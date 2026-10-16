/*
 * Cutscenes (issue #65): a small timeline player for films written as data in data/cutscenes.js.
 *
 *   const played = await Rift.Cutscene.play('cold-open');            // the watcher's own avatar and name
 *   Rift.Cutscene.play('cold-open', { player: { type: 'fox', variant: 'girl', nickname: 'Ada' } });
 *
 * play() resolves true when the film ran to the end or was skipped, and false when it could not
 * play (missing art, art that fails to load, an error): the caller then shows its fallback.
 * It never writes the save. Layers are DOM images moved with transforms on one animation frame
 * loop; a camera with per-layer depth gives the parallax. Voice lines use the same
 * Rift.voiceId / Rift.Audio.speak path as dialogue, with subtitles that are always on.
 *
 * Calm motion (body.calm-motion, or the system's reduced-motion setting) plays a gentler cut:
 * no camera moves, flashes, lightning or glitches; shots and faces change with slow fades.
 * Nothing loops except the HUD's scrolling data columns, which stand still in Calm motion.
 */
(function (root) {
    'use strict';

    const Rift = root.Rift;
    const W = 1600, H = 900;
    const HUD = '#7df3ff';
    const LOAD_LIMIT = 12000;     // ms before slow art counts as missing
    const HOLD_TO_SKIP = 900;     // ms of press-and-hold
    let current = null;

    const EASE = {
        linear: t => t,
        in: t => t * t * t,
        out: t => 1 - Math.pow(1 - t, 3),
        inOut: t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
        snap: t => 1 - Math.pow(1 - t, 5),
    };

    const manifest = () => (Rift.data && Rift.data.assets) || {};
    const defOf = id => ((Rift.data && Rift.data.cutscenes) || {})[id] || null;
    const has = id => !!defOf(id);
    const clock = () => (root.performance && root.performance.now ? root.performance.now() : Date.now());

    // ---- planning (pure: no DOM) -------------------------------------------------------

    // The person watching: the save's avatar, or the bench's pick.
    function viewer(given) {
        const s = Rift.State && Rift.State.get && Rift.State.get();
        const av = given || (s && s.avatar) || {};
        const type = av.type || 'owlet', variant = av.variant || 'boy';
        const def = ((Rift.data && Rift.data.avatars) || {})[type];
        const colour = def && Rift.COLOURS[def.colour] ? Rift.COLOURS[def.colour].hex : HUD;
        return { type, variant, name: String(av.nickname || av.name || 'traveller'), colour };
    }

    function fill(text, who) {
        return String(text)
            .replace(/\{avatar\}/g, 'avatar/' + who.type + '-' + who.variant)
            .replace(/\{name\}/g, who.name)
            .replace(/\{NAME\}/g, who.name.toUpperCase())
            .replace(/\{colour\}/g, who.colour);
    }

    // Every string gets the watcher's tokens, except a say step's `t`: the voice file is keyed by
    // the scripted words, so the filled version goes to `text` (the subtitle and browser voice).
    function fillDeep(value, who, key) {
        if (typeof value === 'string') return key === 't' ? value : fill(value, who);
        if (Array.isArray(value)) return value.map(v => fillDeep(v, who));
        if (value && typeof value === 'object') {
            const out = {};
            Object.keys(value).forEach(k => { out[k] = fillDeep(value[k], who, k); });
            if (typeof value.say === 'string' && typeof value.t === 'string') out.text = fill(value.t, who);
            return out;
        }
        return value;
    }

    // A layer's size and centre: height from the art's own shape, `wFor` per avatar type, `bottom` anchors.
    function sizeLayer(layer, who) {
        const l = Object.assign({ depth: 1, opacity: 1, scale: 1, sy: 1, bright: 1 }, layer);
        if (l.wFor && l.wFor[who.type]) l.w = l.wFor[who.type];
        delete l.wFor;
        const m = manifest()[l.art];
        if (l.h == null) l.h = m && m.w ? Math.round(l.w * m.h / m.w) : Math.round(l.w * 0.5625);
        if (l.bottom != null) { l.y = l.bottom - l.h / 2; delete l.bottom; }
        return l;
    }

    // The gentler cut for Calm motion. A step can opt out (`calm: false`) or override (`calm: {...}`).
    function calmStep(step) {
        if (!step || step.calm === false) return null;
        let s = Object.assign({}, step, typeof step.calm === 'object' ? step.calm : null);
        delete s.calm;
        if (s.fx) return null;                                   // flashes, flickers, lightning
        if (s.hud === 'sweep') return null;
        if (s.hud === 'clear') s.glitch = false;
        if (s.shot) s.fade = Math.max(s.fade || 0, 900);
        if (s.end) s.fade = Math.max(s.fade || 0, 1400);
        if (s.camera && !s.shot) {
            if (s.wait) return { wait: s.dur || 0 };           // hold the still shot for the same beat
            s.dur = 0;                                       // no camera moves: cuts only
        }
        if (s.tween) {
            const to = Object.assign({}, s.to);
            if ('opacity' in to) {
                // A fade in may first jump to its end pose while invisible; a fade out keeps still.
                const jump = {};
                Object.keys(to).forEach(k => { if (k !== 'opacity') jump[k] = to[k]; });
                s = Object.assign(s, { to: { opacity: to.opacity }, jump: to.opacity > 0 ? jump : null, dur: Math.max((s.dur || 0) * 1.5, 900) });
            } else s.dur = 0;
        }
        if (s.set && 'opacity' in s) s.fadeSet = 900;          // swaps fade instead of popping
        if (s.during) s.during = s.during.map(calmStep).filter(Boolean);
        return s;
    }

    // Read-only dialogue selection. Decisions, rewards and clocks stay in Dialogue.run.
    // A named conversation is also the Skip/failure continuation and the voice catalogue source.
    function conversation(key, ctx) {
        const out = [];
        function walk(steps) {
            for (const s of steps || []) {
                const allowed = s.when === undefined || (Rift.Story && Rift.Story.test(s.when, ctx));
                if (s.then || s.else) { walk(allowed ? s.then : s.else); continue; }
                if (!allowed || (Rift.Story && !Rift.Story.matchesOnly(s.only))) continue;
                if ((s.s && typeof s.t === 'string') || typeof s.note === 'string') out.push(s);
                else throw new Error('Cutscene conversations may contain only dialogue, notes and conditions: ' + key);
            }
        }
        walk((Rift.data.script || {})[key]);
        return out;
    }

    function canonicalLine(line, who, ctx) {
        if (typeof line.note === 'string') return { note: line.note, text: fill(line.note, who) };
        const avatar = line.s === 'avatar';
        const actor = avatar ? 'avatar-' + who.type + '-' + who.variant
            : (Rift.Cast ? (line.replay ? Rift.Cast.original(line.s) : Rift.Cast.actor(line.s, { replay: ctx && ctx.replay })) : line.s);
        if (!actor) return null;
        const text = avatar || !Rift.Cast || line.replay ? line.t : Rift.Cast.text(line, actor);
        if (!text) return null;
        const possessed = line.possessed || (Rift.Story && Rift.Story.flag('possessed:' + line.s));
        return { say: actor + (possessed && !avatar ? '-possessed' : ''), role: line.s, actor,
            label: avatar ? who.name : (((Rift.data.speakers || {})[actor] || (Rift.data.creatures || {})[actor]) || {}).name,
            t: text, continuationText: line.t, text: fill(text, who) };
    }

    // plan(id, { player, calm, context }) → a save-free, fully selected timeline.
    function plan(id, opts) {
        const def = typeof id === 'object' ? id : defOf(id);
        if (!def) return null;
        const o = opts || {};
        const who = viewer(o.player);
        const size = steps => steps.flatMap(step => {
            if (step.when !== undefined && Rift.Story && !Rift.Story.test(step.when, o.context)) return [];
            if (step.conversation) return conversation(step.conversation, o.context).map(line => canonicalLine(line, who, o.context)).filter(Boolean);
            if (step.line) {
                const line = conversation(step.line, o.context)[step.at || 0];
                if (!line) throw new Error('Missing cutscene line: ' + step.line + ' #' + step.at);
                const spoken = canonicalLine(line, who, o.context);
                if (!spoken) return [];
                const selected = Object.assign({}, step, spoken);
                if (selected.during) selected.during = size(selected.during);
                return [selected];
            }
            const s = Object.assign({}, step);
            if (s.layers) s.layers = s.layers.filter(l => l.when === undefined || (Rift.Story && Rift.Story.test(l.when, o.context))).map(l => sizeLayer(l, who));
            if (s.during) s.during = size(s.during);
            return s;
        });
        let steps = size(fillDeep(def.steps || [], who));
        if (o.calm) steps = steps.map(calmStep).filter(Boolean);
        return { id: typeof id === 'string' ? id : def.id, def, who, calm: !!o.calm, steps };
    }

    // Every art id a planned film shows, marked optional when it has a fallback (the title logo).
    function needs(planned) {
        const out = [];
        const add = (id, optional) => { if (id && !out.some(x => x.id === id)) out.push({ id, optional: !!optional }); };
        const walk = steps => (steps || []).forEach(s => {
            (s.layers || []).forEach(l => add(l.art));
            if (s.set && s.art) add(s.art);
            if (s.title && s.logo) add(s.logo, true);
            if (s.during) walk(s.during);
        });
        walk(planned.steps);
        return out;
    }

    // Where a layer lands on the 1600 × 900 stage for a camera. depth 0 never moves, 1 moves with
    // the camera, more than 1 is foreground. A `cover` layer is kept filling the frame (no gaps).
    function project(cam, layer) {
        const d = layer.depth == null ? 1 : layer.depth;
        const z = Math.pow(cam.zoom, d);
        const cx = W / 2 + (cam.x - W / 2) * d, cy = H / 2 + (cam.y - H / 2) * d;
        let S = z * (layer.scale == null ? 1 : layer.scale);
        let sx = W / 2 + (layer.x - cx) * z, sy = H / 2 + (layer.y - cy) * z;
        let dx = 0, dy = 0;
        if (layer.cover) {
            S = Math.max(S, Math.max(W / layer.w, H / layer.h));
            const hw = layer.w * S / 2, hh = layer.h * S / 2;
            const cxs = Rift.clamp(sx, W - hw, hw), cys = Rift.clamp(sy, H - hh, hh);
            dx = cxs - sx; dy = cys - sy; sx = cxs; sy = cys;
        }
        return { S, sx, sy, z, dx, dy };
    }

    function calmWanted() {
        const body = root.document && root.document.body;
        if (body && body.classList && body.classList.contains('calm-motion')) return true;
        try { return !!(root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches); } catch (e) { return false; }
    }

    // ---- the player ----------------------------------------------------------------------

    function Player(planned, opts) {
        this.p = planned;
        this.o = opts || {};
        this.instant = !!this.o.instant;
        this.calm = planned.calm;
        this.rng = Rift.makeRng('cutscene:' + planned.id);
        this.tweens = [];
        this.shots = [];
        this.hud = [];
        this.bolts = [];
        this.glyphs = null;
        this.closed = false;
        this.curtain = { opacity: 1 };
        this.timers = new Map();
        this.trace = [];
        this.halted = new Promise(resolve => { this.halt = resolve; });
    }

    Player.prototype.now = clock;

    Player.prototype.sleep = function (ms) {
        if (this.instant || !(ms > 0)) return Promise.resolve();
        return new Promise(resolve => {
            const id = root.setTimeout(() => { this.timers.delete(id); resolve(); }, ms);
            this.timers.set(id, resolve);
        });
    };
    // Every await races the skip, so a skipped film stops at once.
    Player.prototype.hold = function (promise) { return Promise.race([promise, this.halted]); };

    Player.prototype.tween = function (target, to, dur, ease) {
        // A newer tween takes over the properties it shares with older ones on the same target.
        this.tweens.forEach(tw => { if (tw.target === target) Object.keys(to).forEach(k => { delete tw.to[k]; }); });
        if (this.instant || !(dur > 0)) { Object.assign(target, to); this.render(); return Promise.resolve(); }
        return new Promise(resolve => {
            const from = {};
            Object.keys(to).forEach(k => { from[k] = Number(target[k]) || 0; });
            this.tweens.push({ target, from, to: Object.assign({}, to), t0: this.now(), dur, ease: EASE[ease] || EASE.inOut, resolve });
        });
    };

    Player.prototype.build = function () {
        const el = Rift.el;
        this.world = el('div.cs-world');
        this.hudLayer = el('div.cs-hud', { 'aria-hidden': 'true' });
        this.boltSvg = root.document.createElementNS ? root.document.createElementNS('http://www.w3.org/2000/svg', 'svg') : el('div');
        this.boltSvg.setAttribute('class', 'cs-bolts');
        this.flash = { opacity: 0, node: el('div.cs-flash') };
        this.black = { opacity: 0, node: el('div.cs-black') };
        this.titleNode = el('div.cs-title', { hidden: true });
        this.viewport = el('div.cs-viewport', null, [this.world, this.boltSvg, this.hudLayer, this.flash.node, this.titleNode, this.black.node]);
        this.subName = el('span.cs-sub-name');
        this.subText = el('span.cs-sub-text');
        this.subtitle = el('div.cs-subtitle', { hidden: true, role: 'status', 'aria-live': 'polite' }, [this.subName, this.subText]);
        this.skipButton = el('button.cs-skip', {
            type: 'button', text: '⏭', title: 'Skip (Esc, or hold anywhere)', 'aria-label': 'Skip the film',
            onclick: ev => { if (ev && ev.preventDefault) ev.preventDefault(); this.skip(); },
        });
        this.ring = el('div.cs-hold', { 'aria-hidden': 'true' }, [el('span', { text: 'Hold to skip' })]);
        this.previousFocus = root.document.activeElement;
        this.node = el('div.cutscene' + (this.calm ? '.cs-calm' : ''), { role: 'dialog', 'aria-modal': 'true', 'aria-label': (this.p.def && this.p.def.title) || 'Cutscene' },
            [this.viewport, this.subtitle, this.ring, this.skipButton]);
        const host = root.document.getElementById('overlay') || root.document.body;
        host.appendChild(this.node);
        this.releaseInput = Rift.UI && Rift.UI.input ? Rift.UI.input.claim(this.node) : null;
        if (!this.releaseInput) this.node.style.zIndex = '900';
        if (this.skipButton.focus) this.skipButton.focus();
        this.listen();
        this.layout();
    };

    Player.prototype.listen = function () {
        const doc = root.document;
        this.onKey = ev => {
            if (ev.key !== 'Escape' || this.closed) return;
            ev.preventDefault();
            if (ev.stopImmediatePropagation) ev.stopImmediatePropagation();
            this.skip();
        };
        this.onDown = ev => {
            if (this.closed || (ev.target && ev.target.closest && ev.target.closest('.cs-skip'))) return;
            this.holdFrom = this.now();
            this.node.classList.add('holding');
        };
        this.onUp = () => { this.holdFrom = null; this.node.classList.remove('holding'); };
        this.onResize = () => this.layout();
        // The window sees keys before the game's document-level input guard.
        if (root.addEventListener) {
            root.addEventListener('keydown', this.onKey, true);
            root.addEventListener('resize', this.onResize);
        } else if (doc.addEventListener) doc.addEventListener('keydown', this.onKey, true);
        this.node.addEventListener('pointerdown', this.onDown);
        ['pointerup', 'pointercancel', 'pointerleave'].forEach(t => this.node.addEventListener(t, this.onUp));
        // Router navigation calls Dialogue.abortAll (and Cutscene.stop) BEFORE mounting
        // the next screen. screen:changed also fires after the initial mount and must
        // not stop a film that the new encounter has just started.
    };

    Player.prototype.unlisten = function () {
        if (root.removeEventListener) {
            root.removeEventListener('keydown', this.onKey, true);
            root.removeEventListener('resize', this.onResize);
        } else if (root.document.removeEventListener) root.document.removeEventListener('keydown', this.onKey, true);
    };

    // The stage keeps 16:9 and fits the window; phones get letterbox room for the subtitles.
    Player.prototype.layout = function () {
        const vw = root.innerWidth || W, vh = root.innerHeight || H;
        const s = Math.min(vw / W, vh / H);
        this.scale = s;
        const w = W * s, h = H * s;
        Object.assign(this.viewport.style, { width: w + 'px', height: h + 'px', left: (vw - w) / 2 + 'px', top: Math.max(0, (vh - h) / 2 - (vh - h > 160 ? 40 : 0)) + 'px' });
        this.world.style.transform = 'scale(' + s + ')';
        this.render();
    };

    // ---- drawing --------------------------------------------------------------------------

    Player.prototype.loop = function () {
        if (this.closed || this.instant) return;
        const raf = root.requestAnimationFrame ? f => root.requestAnimationFrame(f) : f => root.setTimeout(f, 16);
        const frame = () => {
            if (this.closed) return;
            try {
                this.step();
                this.render();
                if (!this.closed) this.frameId = raf(frame);
            } catch (error) {
                console.error('[Rift] cutscene frame', error);
                this.finish(false);
            }
        };
        this.frameId = raf(frame);
    };

    Player.prototype.step = function () {
        const t = this.now();
        this.tweens = this.tweens.filter(tw => {
            const k = Math.min(1, (t - tw.t0) / tw.dur), e = tw.ease(k);
            Object.keys(tw.to).forEach(p => { tw.target[p] = tw.from[p] + (tw.to[p] - tw.from[p]) * e; });
            if (k >= 1 || !Object.keys(tw.to).length) { tw.resolve(); return false; }
            return true;
        });
        if (this.holdFrom != null && t - this.holdFrom >= HOLD_TO_SKIP) this.skip();
    };

    const px = v => Math.round(v * 100) / 100 + 'px';

    Player.prototype.render = function () {
        if (this.closed || !this.world) return;
        this.node.style.opacity = String(this.curtain.opacity);
        const t = this.now();
        this.shots.forEach(shot => {
            shot.node.style.opacity = String(shot.state.opacity);
            shot.layers.forEach(l => {
                const at = project(shot.camera, l);
                const sy = l.sy == null ? 1 : l.sy;
                const facing = l.mirror ? -1 : 1;
                const style = l.node.style;
                style.width = l.w + 'px';
                style.height = l.h + 'px';
                style.transform = 'translate(' + px(at.sx - l.w * at.S * facing / 2) + ',' + px(at.sy - l.h * at.S * sy / 2) + ') scale(' + at.S * facing + ',' + at.S * sy + ')';
                style.opacity = String(Rift.clamp(l.opacity, 0, 1));
                const filters = [];
                if (l.bright && l.bright !== 1) filters.push('brightness(' + l.bright + ')');
                if (l.glow) filters.push('drop-shadow(0 0 ' + Math.round(14 * (l.bright || 1)) + 'px ' + l.glow + ')');
                style.filter = filters.join(' ');
                // The observation glass opens from a narrow screen to the full village image.
                if (l.aperture != null) {
                    const inset = l.h * (1 - Rift.clamp(l.aperture, 0, 1)) / 2;
                    style.clipPath = 'inset(' + px(inset) + ' 0)';
                }
                // The quilt line: the part of the art below clipY is hidden (sitting up in bed).
                if (l.clipY != null) {
                    const hidden = Math.max(0, (l.y + l.h * (l.scale || 1) / 2 - l.clipY) / (l.scale || 1));
                    style.clipPath = 'inset(0 0 ' + Math.min(l.h, hidden) + 'px 0)';
                }
            });
        });
        this.renderHud(t);
        this.renderBolts(t);
        this.flash.node.style.opacity = String(this.flash.opacity);
        this.black.node.style.opacity = String(this.black.opacity);
        if (this.title) {
            this.titleNode.style.opacity = String(this.title.opacity);
            this.titleNode.style.transform = 'scale(' + this.title.scale + ')';
        }
        if (this.holdFrom != null) this.ring.style.setProperty('--hold', String(Rift.clamp((t - this.holdFrom) / HOLD_TO_SKIP, 0, 1)));
    };

    // World rectangle → screen pixels inside the viewport, following the shot's camera.
    Player.prototype.toScreen = function (shot, item) {
        const ref = shot.layers.find(l => l.cover && (l.depth == null ? 1 : l.depth) === (item.depth == null ? 1 : item.depth));
        const at = project(shot.camera, { x: item.x, y: item.y, w: item.w || 0, h: item.h || 0, depth: item.depth });
        const shift = ref ? project(shot.camera, ref) : { dx: 0, dy: 0 };
        const s = this.scale || 1;
        return { x: (at.sx + shift.dx) * s, y: (at.sy + shift.dy) * s, w: (item.w || 0) * at.z * s, h: (item.h || 0) * at.z * s };
    };

    Player.prototype.renderHud = function (t) {
        const shot = this.shots[this.shots.length - 1];
        this.hud.forEach(item => {
            const style = item.node.style;
            style.opacity = String(item.state.opacity);
            if (item.kind === 'text' && shot) {
                const anchor = item.follow && shot.layers.find(l => l.id === item.follow);
                const target = anchor ? Object.assign({}, item, { x: anchor.x, y: anchor.y,
                    w: item.w * (anchor.scale || 1), h: item.h * (anchor.scale || 1) }) : item;
                const r = this.toScreen(shot, target);
                Object.assign(style, { left: px(r.x - r.w / 2), top: px(r.y - r.h / 2),
                    width: px(r.w), height: px(r.h), fontSize: px(item.font * r.w / item.w),
                    opacity: String(item.state.opacity * (anchor ? anchor.opacity : 1)) });
            } else if (item.kind === 'box' && shot) {
                const r = this.toScreen(shot, item);
                const k = item.state.k;
                Object.assign(style, { left: px(r.x - r.w * k / 2), top: px(r.y - r.h * k / 2), width: px(r.w * k), height: px(r.h * k) });
            } else if (item.kind === 'meter' && shot) {
                const r = this.toScreen(shot, item);
                Object.assign(style, { left: px(r.x - r.w / 2), top: px(r.y), width: px(r.w) });
                const v = item.state.value;
                item.fill.style.width = Rift.clamp(v, 0, 100) + '%';
                // "Ticking at 51%": once full, the number twitches by tenths (never in Calm motion).
                const settled = v >= item.target - 0.01;
                const shown = settled && !this.calm ? item.target + Math.round(Math.sin(t / 170) * 3 + Math.sin(t / 61)) / 10 : v;
                item.number.textContent = (settled && !this.calm ? shown.toFixed(1) : Math.round(shown)) + '%';
            } else if (item.kind === 'sweep') {
                style.left = (item.state.p * 100) + '%';
            } else if (item.kind === 'glyphs' && !this.calm) {
                item.cols.forEach((c, i) => { c.style.transform = 'translateY(' + px(-((t * (0.035 + i * 0.012)) % (c.half || 400))) + ')'; });
            }
        });
        // The glitch out: a few frames of torn, shifted HUD (one-off, then it is gone).
        if (this.glitchUntil) {
            const style = this.hudLayer.style;
            if (t < this.glitchUntil) {
                const r = this.rng;
                style.transform = 'translateX(' + Math.round((r.next() - 0.5) * 26) + 'px)';
                const top = Math.round(r.next() * 70);
                style.clipPath = 'inset(' + top + '% 0 ' + Math.round(r.next() * (90 - top)) + '% 0)';
                style.opacity = String(0.35 + r.next() * 0.65);
                style.filter = 'hue-rotate(' + Math.round(r.next() * 180) + 'deg)';
            } else {
                this.glitchUntil = 0;
                Object.assign(style, { transform: '', clipPath: '', filter: '', opacity: '1' });
                this.clearHud();
            }
        }
    };

    Player.prototype.renderBolts = function (t) {
        const shot = this.shots[this.shots.length - 1];
        const svg = this.boltSvg;
        this.bolts = this.bolts.filter(b => {
            const age = (t - b.t0) / b.dur;
            if (age >= 1 || this.instant) { b.nodes.forEach(n => n.remove()); return false; }
            if (shot) {
                const pts = b.points.map(p => { const r = this.toScreen(shot, { x: p[0], y: p[1], depth: b.depth }); return Math.round(r.x) + ',' + Math.round(r.y); }).join(' ');
                b.nodes.forEach(n => { n.setAttribute('points', pts); n.style.opacity = String(1 - age); });
            }
            return true;
        });
        if (svg.setAttribute && this.viewport) svg.setAttribute('viewBox', '0 0 ' + Math.round(W * (this.scale || 1)) + ' ' + Math.round(H * (this.scale || 1)));
    };

    // A jagged lightning line between two world points, drawn for a moment (white core, cyan glow).
    Player.prototype.bolt = function (x1, y1, x2, y2, opts) {
        const o = opts || {};
        const rng = o.seed ? Rift.makeRng(o.seed + ':' + this.bolts.length) : this.rng;
        const n = 9, len = Math.hypot(x2 - x1, y2 - y1), nx = -(y2 - y1) / (len || 1), ny = (x2 - x1) / (len || 1);
        const points = [];
        for (let i = 0; i <= n; i++) {
            const k = i / n, j = i === 0 || i === n ? 0 : (rng.next() - 0.5) * len * 0.16;
            points.push([x1 + (x2 - x1) * k + nx * j, y1 + (y2 - y1) * k + ny * j]);
        }
        const make = cls => {
            const node = root.document.createElementNS ? root.document.createElementNS('http://www.w3.org/2000/svg', 'polyline') : Rift.el('div');
            node.setAttribute('class', cls);
            this.boltSvg.appendChild(node);
            return node;
        };
        this.bolts.push({ points, depth: o.depth == null ? 1 : o.depth, t0: this.now(), dur: o.dur || 200, nodes: [make('cs-bolt-glow'), make('cs-bolt')] });
        this.render();
    };

    Player.prototype.clearHud = function () {
        this.hud.forEach(item => item.node.remove());
        this.hud = [];
    };

    // ---- steps --------------------------------------------------------------------------------

    Player.prototype.layer = function (id) {
        for (let i = this.shots.length - 1; i >= 0; i--) {
            const found = this.shots[i].layers.find(l => l.id === id);
            if (found) return found;
        }
        throw new Error('Cutscene layer not found: ' + id);
    };

    Player.prototype.run = async function (steps) {
        for (const step of steps || []) {
            if (this.closed) return;
            await this.hold(this.exec(step));
        }
    };

    Player.prototype.exec = async function (s) {
        const kind = s.shot ? 'shot' : s.say ? 'say' : s.note ? 'note' : s.camera ? 'camera' : s.tween ? 'tween' : s.set ? 'set'
            : s.fx ? 'fx' : s.hud ? 'hud' : 'title' in s ? 'title' : s.end ? 'end' : s.sfx ? 'sfx' : 'ambience' in s ? 'ambience' : 'wait' in s ? 'wait' : 'unknown';
        this.trace.push(kind + ':' + (s.shot || s.say || s.tween || s.set || s.fx || s.hud || s.sfx || s.ambience || (kind === 'wait' ? s.wait : '') || ''));
        if (this.o.onStep) this.o.onStep(kind, s);
        if (kind === 'shot') return this.shot(s);
        if (kind === 'say') return this.say(s);
        if (kind === 'note') return this.note(s);
        if (kind === 'camera') {
            const done = this.tween(this.shots[this.shots.length - 1].camera, s.camera, s.dur, s.ease);
            return s.wait ? done : null;
        }
        if (kind === 'tween') {
            const l = this.layer(s.tween);
            if (s.jump) Object.assign(l, this.pose(l, s.jump));
            const done = this.tween(l, this.pose(l, s.to), s.dur, s.ease);
            return s.wait ? done : null;
        }
        if (kind === 'set') return this.set(s);
        if (kind === 'wait') return this.sleep(s.wait);
        if (kind === 'sfx') {
            if (Rift.Audio && Rift.Audio.sfx) {
                this.sfxPlayed = true;
                Rift.Audio.sfx(s.sfx, { volume: s.volume, minGap: 0 });
            }
            return null;
        }
        if (kind === 'ambience') {
            if (Rift.Ambience && Rift.Ambience.scene) { this.ambienceChanged = true; Rift.Ambience.scene(s.ambience); }
            return null;
        }
        if (kind === 'fx') return this.fx(s);
        if (kind === 'hud') return this.hudStep(s);
        if (kind === 'title') return this.showTitle(s);
        if (kind === 'end') return s.reveal
            ? this.tween(this.curtain, { opacity: 0 }, s.fade || 0, 'inOut')
            : this.tween(this.black, { opacity: 1 }, s.fade || 0, 'inOut');
        throw new Error('Unknown cutscene step: ' + JSON.stringify(s));
    };

    // `bottom` in a pose becomes the layer's centre y.
    Player.prototype.pose = function (l, to) {
        const out = Object.assign({}, to);
        if (out.bottom != null) { out.y = out.bottom - l.h * (out.scale || l.scale || 1) / 2; delete out.bottom; }
        return out;
    };

    Player.prototype.shot = function (s) {
        const shot = {
            name: s.shot,
            camera: Object.assign({ x: W / 2, y: H / 2, zoom: 1 }, s.camera),
            state: { opacity: s.fade > 0 && !this.instant ? 0 : 1 },
            node: Rift.el('div.cs-shot', { style: { background: s.bg || '#000' }, dataset: { shot: s.shot } }),
            layers: (s.layers || []).map(l => Object.assign({}, l)),
        };
        shot.layers.forEach(l => {
            l.node = Rift.el('img.cs-layer', { src: 'assets/' + ((manifest()[l.art] || {}).file || ''), alt: '', draggable: false, dataset: { layer: l.id } });
            shot.node.appendChild(l.node);
        });
        // A new shot drops the old shot's HUD boxes.
        this.hud.filter(h => h.kind === 'box' || h.kind === 'meter').forEach(h => h.node.remove());
        this.hud = this.hud.filter(h => h.kind !== 'box' && h.kind !== 'meter');
        this.world.appendChild(shot.node);
        this.shots.push(shot);
        const old = this.shots.slice(0, -1);
        const done = () => { old.forEach(o => { o.node.remove(); }); this.shots = this.shots.filter(x => !old.includes(x)); };
        if (shot.state.opacity >= 1) { done(); this.render(); return null; }
        this.render();
        this.tween(shot.state, { opacity: 1 }, s.fade, 'inOut').then(done);
        return null;
    };

    Player.prototype.set = function (s) {
        const l = this.layer(s.set);
        const props = Object.assign({}, s);
        ['set', 'fadeSet', 'calm'].forEach(k => delete props[k]);
        if (props.art) { l.art = props.art; l.node.src = 'assets/' + ((manifest()[props.art] || {}).file || ''); delete props.art; }
        const pose = this.pose(l, props);
        if (s.fadeSet && 'opacity' in pose) {
            const opacity = pose.opacity;
            delete pose.opacity;
            Object.assign(l, pose);
            this.tween(l, { opacity }, s.fadeSet, 'inOut');
        } else Object.assign(l, pose);
        this.render();
        return null;
    };

    // Court screens and silent actions are canonical notes, never a dead narrator's voice.
    Player.prototype.note = async function (s) {
        const text = s.text || s.note;
        this.subName.textContent = s.label || this.p.def.noteLabel || 'COURT RECORD';
        this.subText.textContent = text;
        this.subtitle.hidden = false;
        await this.hold(Promise.all([this.sleep(1200 + 45 * String(text).length), this.run(s.during)]));
        if (!this.closed) {
            this.subtitle.hidden = true;
            if (this.o.onNote) this.o.onNote(s.note);
        }
    };

    Player.prototype.say = async function (s) {
        const speaker = s.say;
        const text = s.text || s.t;
        const info = ((Rift.data && Rift.data.speakers) || {})[speaker];
        this.subName.textContent = s.label || (info && info.name) || speaker;
        this.subText.textContent = text;
        this.subtitle.hidden = false;
        const voice = Rift.Audio && Rift.Audio.speak
            ? Rift.Audio.speak({ speaker, text, voice: Rift.voiceId(speaker, s.t) })
            : Promise.resolve();
        // Subtitles stay up for a fair reading time even when the voice is muted or quicker.
        const reading = this.sleep(1200 + 45 * String(text).length);
        await this.hold(Promise.all([voice, reading, this.run(s.during)]));
        if (!this.closed) {
            this.subtitle.hidden = true;
            if (this.o.onSpoken) this.o.onSpoken({ speaker: s.role || speaker, actor: s.actor,
                text: s.continuationText == null ? s.t : s.continuationText });
        }
    };

    Player.prototype.fx = async function (s) {
        if (s.fx === 'flash') {
            this.flash.opacity = 0.85;
            this.render();
            return this.tween(this.flash, { opacity: 0 }, s.dur || 500, 'out');
        }
        if (s.fx === 'bolt') { this.bolt(s.x1, s.y1, s.x2, s.y2, s); return null; }
        if (s.fx === 'flicker') {
            const l = this.layer(s.target);
            const rng = Rift.makeRng('flicker:' + (s.seed || s.target));
            for (let i = 0; i < (s.times || 3) && !this.closed; i++) {
                l.bright = 2.4;
                const x = l.x + (rng.next() - 0.5) * l.w * 0.7, y = l.y + (rng.next() - 0.5) * l.h * 0.4;
                this.bolt(x, y, x + (rng.next() - 0.5) * l.w * 0.25, y + (rng.next() < 0.5 ? -1 : 1) * l.h * (0.8 + rng.next()), { seed: (s.seed || 'f') + i, depth: l.depth, dur: 160 });
                if (Rift.Audio && Rift.Audio.sfx && i === 0) Rift.Audio.sfx('fizzle', { volume: 0.6, minGap: 0 });
                this.render();
                await this.hold(this.sleep(70));
                await this.hold(this.tween(l, { bright: 1 }, 160, 'out'));
                await this.hold(this.sleep(150 + rng.next() * 260));
            }
            return null;
        }
        throw new Error('Unknown cutscene effect: ' + s.fx);
    };

    Player.prototype.hudStep = function (s) {
        const el = Rift.el;
        const colour = s.colour || HUD;
        if (s.hud === 'text') {
            const node = el('div.cs-lettering', { text: s.label || '', style: { color: colour } });
            const item = { kind: 'text', id: s.id, x: s.x, y: s.y, w: s.w, h: s.h, depth: s.depth,
                follow: s.follow, font: s.font || 28, node, state: { opacity: 0 } };
            this.hud.push(item); this.hudLayer.appendChild(node);
            this.tween(item.state, { opacity: 1 }, this.calm ? 700 : 250, 'out');
            return null;
        }
        if (s.hud === 'box') {
            const node = el('div.cs-box' + (s.lock ? '.lock' : ''), { style: { '--hud': colour } }, [
                el('i.c1'), el('i.c2'), el('i.c3'), el('i.c4'),
                s.label ? el('span.cs-box-label', { text: s.label }) : null,
            ]);
            const item = { kind: 'box', id: s.id, x: s.x, y: s.y, w: s.w, h: s.h, depth: s.depth, node, state: { opacity: 0, k: this.calm ? 1 : (s.lock ? 1.6 : 1.25) } };
            this.hud.push(item);
            this.hudLayer.appendChild(node);
            this.tween(item.state, this.calm ? { opacity: 1 } : { opacity: 1, k: 1 }, this.calm ? 700 : (s.lock ? 320 : 240), 'out');
            return null;
        }
        if (s.hud === 'meter') {
            const fill = el('div.cs-meter-fill');
            const number = el('span.cs-meter-number', { text: '0%' });
            const node = el('div.cs-meter', { style: { '--hud': colour } }, [el('div.cs-meter-row', null, [el('span.cs-meter-label', { text: s.label || '' }), number]), el('div.cs-meter-bar', null, [fill])]);
            const item = { kind: 'meter', id: s.id, x: s.x, y: s.y, w: s.w, h: 0, depth: s.depth, node, fill, number, target: s.value, state: { opacity: 0, value: 0 } };
            this.hud.push(item);
            this.hudLayer.appendChild(node);
            this.tween(item.state, { opacity: 1 }, this.calm ? 700 : 250, 'out');
            this.tween(item.state, { value: s.value }, s.dur || 1500, 'out');
            return null;
        }
        if (s.hud === 'alarm') {
            const item = this.hud.find(h => h.id === s.id);
            if (item) { item.node.classList.add('alarm'); const label = item.node.querySelector('.cs-meter-label'); if (label) label.textContent = s.label || 'UNACCEPTABLE'; }
            return null;
        }
        if (s.hud === 'glyphs') {
            if (this.glyphs) return null;
            const rng = Rift.makeRng('glyphs');
            const bits = ['0x3F', '9:02', '51%', '▲', '▼', 'NOISE', '0101', 'LOC', '◆', 'SCAN', '7E', 'FAIR', '0.51', '//'];
            const column = () => {
                const lines = [];
                for (let i = 0; i < 22; i++) lines.push(rng.pick(bits) + ' ' + rng.pick(bits));
                const node = el('div.cs-glyph-col', { text: lines.concat(lines).join('\n') });
                node.half = 22 * 18;
                return node;
            };
            const cols = [column(), column()];
            const node = el('div.cs-glyphs', null, [el('div.cs-glyph-side.left', null, [cols[0]]), el('div.cs-glyph-side.right', null, [cols[1]])]);
            const item = { kind: 'glyphs', node, cols, state: { opacity: 0 } };
            this.glyphs = item;
            this.hud.push(item);
            this.hudLayer.appendChild(node);
            this.tween(item.state, { opacity: 0.8 }, this.calm ? 900 : 400, 'out');
            return null;
        }
        if (s.hud === 'sweep') {
            const node = el('div.cs-sweep');
            const item = { kind: 'sweep', node, state: { opacity: 0.9, p: 0 } };
            this.hud.push(item);
            this.hudLayer.appendChild(node);
            this.tween(item.state, { p: 1 }, s.dur || 1500, 'inOut').then(() => { node.remove(); this.hud = this.hud.filter(h => h !== item); });
            return null;
        }
        if (s.hud === 'clear') {
            this.glyphs = null;
            if (s.glitch && !this.calm && !this.instant) { this.glitchUntil = this.now() + 520; return null; }
            const items = this.hud.slice();
            if (this.instant) { this.clearHud(); return null; }
            items.forEach(item => this.tween(item.state, { opacity: 0 }, 700, 'inOut'));
            return this.sleep(720).then(() => { items.forEach(i => i.node.remove()); this.hud = this.hud.filter(h => !items.includes(h)); });
        }
        throw new Error('Unknown cutscene HUD: ' + s.hud);
    };

    Player.prototype.showTitle = function (s) {
        if (s.title === false) {
            if (!this.title) return null;
            return this.tween(this.title, { opacity: 0 }, s.dur || 900, 'inOut').then(() => { this.titleNode.hidden = true; });
        }
        const logo = s.logo && manifest()[s.logo];
        this.titleNode.replaceChildren(logo
            ? Rift.el('img.cs-logo', { src: 'assets/' + logo.file, alt: s.title })
            : Rift.el('h1.cs-title-text', { text: s.title }));
        this.titleNode.hidden = false;
        this.title = { opacity: 0, scale: this.calm ? 1 : 1.12 };
        if (!this.calm) {
            this.bolt(800, -40, 790, 470, { seed: 'title', dur: 260, depth: 0 });
            this.flash.opacity = 0.75;
            this.tween(this.flash, { opacity: 0 }, 650, 'out');
        }
        return this.tween(this.title, { opacity: 1, scale: 1 }, this.calm ? 1400 : 260, 'out');
    };

    // ---- lifecycle -------------------------------------------------------------------------------

    Player.prototype.preload = function () {
        if (this.instant || typeof root.Image !== 'function') return Promise.resolve(true);
        const ids = needs(this.p).filter(a => manifest()[a.id]);
        const one = a => new Promise(resolve => {
            const img = new root.Image();
            img.onload = () => resolve(true);
            img.onerror = () => resolve(!!a.optional);
            img.src = 'assets/' + manifest()[a.id].file;
        });
        const limit = this.sleep(LOAD_LIMIT).then(() => false);
        return Promise.race([Promise.all(ids.map(one)).then(all => all.every(Boolean)), limit, this.halted.then(() => true)]);
    };

    Player.prototype.start = function () {
        this.done = new Promise(resolve => { this.resolveDone = resolve; });
        try {
            if (Rift.Ambience && Rift.Ambience.now) this.ambienceBefore = Rift.Ambience.now();
            this.build();
        } catch (e) {
            console.error('[Rift] cutscene', e);
            this.finish(false);
            return this.done;
        }
        this.preload().then(ok => {
            if (this.closed) return;
            if (!ok) { console.warn('[Rift] cutscene art did not load; showing the fallback'); this.finish(false); return; }
            this.loop();
            return this.run(this.p.steps).then(() => this.finish(true));
        }).catch(e => { console.error('[Rift] cutscene', e); this.finish(false); });
        return this.done;
    };

    Player.prototype.skip = function () {
        if (this.closed) return;
        this.skipped = true;
        this.trace.push('skip');
        this.finish(true);
    };

    Player.prototype.finish = function (result) {
        if (this.closed) return;
        this.closed = true;
        this.halt();
        if (this.frameId != null && root.cancelAnimationFrame) root.cancelAnimationFrame(this.frameId);
        else if (this.frameId != null) root.clearTimeout(this.frameId);
        this.timers.forEach((resolve, id) => { root.clearTimeout(id); resolve(); });
        this.timers.clear();
        this.tweens.forEach(tw => tw.resolve());
        this.tweens = [];
        if (this.onKey) this.unlisten();
        if (Rift.Audio && Rift.Audio.stopVoice) Rift.Audio.stopVoice();
        if (this.sfxPlayed && Rift.Audio && Rift.Audio.stopSounds) Rift.Audio.stopSounds();
        // Back to whatever was playing before (the map's loop), at its old tension.
        const before = this.ambienceBefore;
        if (this.ambienceChanged && Rift.Ambience && before && before.art !== undefined) {
            Rift.Ambience.scene(before.art);
            if (before.tension) Rift.Ambience.tension(before.tension);
        }
        if (this.releaseInput) this.releaseInput();
        if (Rift.UI && Rift.UI.input) Rift.UI.input.guard();
        if (this.node) this.node.remove();
        if (this.previousFocus && this.previousFocus.isConnected) this.previousFocus.focus();
        if (this.resolveDone) this.resolveDone(result);
    };

    Player.prototype.status = function () {
        return { id: this.p.id, calm: this.calm, closed: this.closed, skipped: !!this.skipped, trace: this.trace.slice(), shot: (this.shots[this.shots.length - 1] || {}).name || null };
    };

    // ---- the public face --------------------------------------------------------------------------

    // opts: { player, calm (default: the Calm motion setting), instant (tests), onStep, onSpoken }
    function play(id, opts) {
        const o = opts || {};
        if (!has(id) || !root.document) return Promise.resolve(false);
        if (current) return current.done || Promise.resolve(false);
        let planned;
        try { planned = plan(id, { player: o.player, calm: o.calm == null ? calmWanted() : o.calm, context: o.context }); } catch (e) {
            console.error('[Rift] cutscene', e);
            return Promise.resolve(false);
        }
        const missing = needs(planned).filter(a => !a.optional && !manifest()[a.id]);
        if (missing.length) {
            console.warn('[Rift] cutscene ' + id + ' is missing art: ' + missing.map(a => a.id).join(', '));
            return Promise.resolve(false);
        }
        const player = new Player(planned, o);
        current = player;
        return player.start().then(result => { if (current === player) current = null; return result; });
    }

    function stop() { if (current) current.skip(); }

    Rift.Cutscene = {
        play, stop, has, plan, needs, project, calmWanted, conversation,
        current: () => (current ? current.status() : null),
        list: () => Object.keys((Rift.data && Rift.data.cutscenes) || {}),
    };
})(typeof window !== 'undefined' ? window : globalThis);
