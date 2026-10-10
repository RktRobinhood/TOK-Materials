/*
 * JRPG-style dialogue: pop-up portrait, name plate, typewriter text, voices,
 * choices that set story flags, and branches on earlier choices.
 *
 *   await Rift.Dialogue.play('prologue.rift');   // resolves when the script ends
 *
 * The step format is design/SCRIPT-FORMAT.md. Roles resolve through Rift.Cast (understudies,
 * silence), conditions through Rift.Story.test, stakes clocks through Rift.Stakes. Avatar lines
 * are voiced in the player's avatar voice; inner lines in its inner voice.
 */
(function (root) {
    'use strict';

    const Rift = root.Rift;
    const el = (...a) => Rift.el(...a);
    const Story = () => Rift.Story;
    const live = new Set();   // the context of every script on screen now

    function nickname() {
        const s = Rift.State.get();
        return (s && s.avatar && s.avatar.nickname) || 'traveller';
    }

    function fill(text) {
        // {role:granny} (notes, labels, cards; never in voiced lines): whoever holds the role now.
        return String(text).replace(/\{name\}/g, nickname()).replace(/\{role:([a-z0-9-]+)\}/g, (m, role) => {
            const who = Rift.Cast ? Rift.Cast.actor(role) : role;
            return who ? ((Rift.data.speakers || {})[who] || { name: who }).name : 'nobody';
        });
    }

    function speakerInfo(id, pose) {
        if (id === 'avatar') {
            const s = Rift.State.get();
            const av = s && s.avatar;
            return { name: (av && av.nickname) || 'You', art: av ? Rift.avatarArt(av, pose || 'neutral') : 'avatar/unknown' };
        }
        const sp = (Rift.data.speakers || {})[id];
        if (sp) return Object.assign({}, sp, { art: pose && !(Rift.data.creatures || {})[id] ? sp.art + '/' + pose : sp.art });
        const c = (Rift.data.creatures || {})[id];
        if (c) return { name: c.name, art: 'creature/' + id + '/smug', colour: c.colour };
        return { name: id, art: 'npc/' + id + (pose ? '/' + pose : '') };
    }

    function textSpeed(ctx) {
        const s = Rift.State.get();
        const base = (s && s.settings && s.settings.textSpeed) || 1;
        return ctx.quiet ? base * 0.55 : base;
    }

    function typewriter(node, text, speed) {
        let i = 0;
        let done = false;
        let timer = null;
        return {
            start() {
                return new Promise(resolve => {
                    const tick = () => {
                        i += 1;
                        node.textContent = text.slice(0, i);
                        if (i >= text.length) { done = true; resolve(); return; }
                        timer = setTimeout(tick, 22 / (speed || 1));
                    };
                    this.finish = () => { clearTimeout(timer); node.textContent = text; done = true; resolve(); };
                    tick();
                });
            },
            isDone() { return done; },
            finish() {},
        };
    }

    // The skin over a possessed portrait: the painted feed overlay (fx/possessed) when it exists,
    // else the CSS grid.
    function possessSkin() {
        const A = Rift.Assets;
        const pic = A.url && A.has('fx/possessed') ? A.url('fx/possessed') : null;
        return el('div.possess-skin' + (pic ? '.painted' : ''), { 'aria-hidden': 'true', style: pic ? { backgroundImage: 'url("' + pic + '")' } : null });
    }

    // Shows one box and waits for the player. A Quiet Scene can't be rushed: clicks while the text
    // types are ignored, and each line stays at least a moment.
    function show(layer, ctx, node) {
        if (ctx.node) ctx.node.remove();
        ctx.node = node;
        layer.appendChild(node);
    }

    function present(layer, ctx, node, box, textNode, text) {
        return new Promise(resolve => {
            show(layer, ctx, node);
            const tw = typewriter(textNode, text, textSpeed(ctx));
            let readyAt = 0;
            let settled = false;
            tw.start().then(() => { readyAt = Date.now() + (ctx.quiet ? 1200 : 0); });
            const advance = ev => {
                if (settled || ctx.aborted || (Rift.UI && Rift.UI.input && !Rift.UI.input.available(layer))) return;
                if (ev) { ev.preventDefault(); if (ev.stopImmediatePropagation) ev.stopImmediatePropagation(); else ev.stopPropagation(); }
                if (!tw.isDone()) {
                    if (ctx.quiet) return;
                    Rift.Audio.sfx('click');
                    tw.finish();
                    return;
                }
                if (Date.now() < readyAt) return;
                settled = true;
                if (Rift.UI && Rift.UI.input) Rift.UI.input.guard();
                Rift.Audio.sfx('click');
                cleanup();
                resolve();
            };
            const onKey = ev => {
                if (ev.key === ' ' || ev.key === 'Enter') {
                    if (Rift.UI && Rift.UI.input && !Rift.UI.input.available(layer)) return;
                    ev.preventDefault();
                    if (ev.stopImmediatePropagation) ev.stopImmediatePropagation(); else ev.stopPropagation();
                    if (ev.repeat) return;
                    advance();
                }
            };
            const cleanup = () => { root.document.removeEventListener('keydown', onKey, true); if (box.removeEventListener) box.removeEventListener('click', advance); if (ctx.cleanup === cleanup) ctx.cleanup = null; };
            ctx.cleanup = cleanup;
            box.addEventListener('click', advance);
            // Intercept before a focused map marker receives Enter/Space.
            root.document.addEventListener('keydown', onKey, true);
        });
    }

    // ---- lines ----------------------------------------------------------------------

    function line(layer, step, ctx) {
        const role = step.s;
        const isAvatar = role === 'avatar';
        let actor = role;
        let words = step.t;
        if (!isAvatar) {
            // Last words: a Quiet Scene's replayed line, or the dying role's lines in its own clock's death sequence.
            const last = step.replay || (ctx.deathOf && role === ctx.deathOf);
            actor = last ? Rift.Cast.original(role) : Rift.Cast.actor(role, { replay: ctx.replay });
            if (!actor) {
                // Silence (STORY.md App. D); a dark-if-lost role may leave a stage note.
                return step.dark ? note(layer, ctx, step.dark) : null;
            }
            words = last ? step.t : Rift.Cast.text(step, actor);
            if (words == null) return null;
            if (actor !== Rift.Cast.original(role)) ctx.cast[role] = actor;
        }
        if (typeof words !== 'string' || !words.length) return null;
        const possessed = !isAvatar && (step.possessed || !!Story().flag('possessed:' + role));
        const info = speakerInfo(actor, step.e);
        const text = fill(words);
        const voiceSpeaker = isAvatar ? Story().avatarVoice() : actor + (possessed ? '-possessed' : '');
        const tags = [];
        if (step.hum) tags.push(el('span.line-tag.hum', { text: ctx.memory ? 'Remembered' : '♪ Hum Charm' }));
        else if (ctx.replay || step.replay) tags.push(el('span.line-tag.memory', { text: 'Remembered' }));
        if (possessed) tags.push(el('span.line-tag.possessed-tag', { text: 'Possessed' }));
        const textNode = el('div.text');
        const box = el('div.box.parchment', null, [el('div.name', null, [info.name].concat(tags)), textNode, el('div.more', { text: '▼' })]);
        const portrait = el('div.portrait-wrap' + (possessed ? '.possessed' : '') + (step.replay || ctx.replay ? '.remembered' : ''), null, [
            Rift.Assets.img(info.art, { className: 'portrait', colour: info.colour, label: info.name }),
            // The painted feed overlay (fx/possessed) when it exists, else the CSS grid.
            possessed ? possessSkin() : null,
        ]);
        const node = el('div.dialogue' + (isAvatar ? '.avatar-line' : '') + (possessed ? '.possessed-line' : ''), null, [portrait, box]);
        const shown = present(layer, ctx, node, box, textNode, text);
        if (voiceSpeaker) Rift.Audio.speak({ speaker: voiceSpeaker, text, voice: Rift.voiceId(voiceSpeaker, words) });
        return shown;
    }

    function note(layer, ctx, words) {
        const textNode = el('div.text');
        const box = el('div.box.parchment', null, [textNode, el('div.more', { text: '▼' })]);
        const node = el('div.dialogue.stage-note', null, [box]);
        return present(layer, ctx, node, box, textNode, fill(words));
    }

    // The inner voice (design/AVATARS.md §2.2): the player's species' line, tagged with its Way of
    // Knowing in its colour, voiced in the inner delivery. The Feed imitates it in grey.
    function inner(layer, step, ctx) {
        const sp = Story().species();
        const words = sp && step.inner && step.inner[sp];
        if (typeof words !== 'string' || !words.length) return null;
        const wok = Story().wayOfKnowing() || { tag: 'THOUGHT', hex: '#C9C9D6' };
        const feed = !!step.feed;
        const text = fill(words);
        const tag = el('span.inner-tag', { text: wok.tag + (feed && step.p != null ? ' · ' + step.p + '%' : ''), style: { '--wok': feed ? '#8a8a96' : wok.hex } });
        const textNode = el('div.text');
        const box = el('div.box.inner-box', null, [tag, textNode, el('div.more', { text: '▼' })]);
        const node = el('div.dialogue.inner-line' + (feed ? '.feed-line' : ''), { style: { '--wok': feed ? '#8a8a96' : wok.hex } }, [box]);
        const shown = present(layer, ctx, node, box, textNode, text);
        const speaker = Story().avatarVoice(feed ? 'possessed' : 'inner');
        if (speaker) Rift.Audio.speak({ speaker, text, voice: Rift.voiceId(speaker, words) });
        return shown;
    }

    // ---- choices -------------------------------------------------------------------

    function choice(layer, step, ctx) {
        const options = step.choice.filter(opt => Story().matchesOnly(opt.only) && Story().test(opt.when, ctx));
        if (!options.length) return Promise.resolve(null);
        if (options.some(o => o.voice)) Story().addFlag('voice.offered', 1);
        const wok = Story().wayOfKnowing();
        return new Promise(resolve => {
            let chosen = false;
            const info = speakerInfo('avatar');
            const buttons = options.map(opt => {
                const marked = (opt.only || opt.voice) && wok;
                return el('button.btn' + (marked ? '.voice-option' : ''), {
                    style: marked ? { '--wok': wok.hex } : null,
                    onclick(ev) {
                        if (chosen || ctx.aborted || (Rift.UI && Rift.UI.input && !Rift.UI.input.available(layer))) return;
                        chosen = true;
                        if (Rift.UI && Rift.UI.input) { Rift.UI.input.consume(ev); Rift.UI.input.guard(); }
                        Rift.Audio.sfx('click');
                        resolve(opt);
                    },
                }, [marked ? el('span.inner-tag', { text: wok.tag }) : null, fill(opt.t)]);
            });
            show(layer, ctx, el('div.dialogue.avatar-line', null, [
                Rift.Assets.img(info.art, { className: 'portrait', label: info.name }),
                el('div.box.parchment', null, [el('div.name', { text: info.name }), el('div.choices', null, buttons)]),
            ]));
            if (buttons[0].focus) buttons[0].focus();
        }).then(async opt => {
            if (opt.flag) Story().setFlag(opt.flag, opt.value === undefined ? true : opt.value);
            if (opt.voice) Story().addFlag('voice.followed', 1);
            if (opt.then) await run(layer, opt.then, ctx);
            return opt;
        });
    }

    // ---- stakes clocks ------------------------------------------------------------

    async function clockStep(layer, step, ctx) {
        const id = step.clock;
        const S = Rift.Stakes;
        if (!S) return;
        if ('start' in step) S.start(id, step.start === true ? 0 : step.start);
        else if ('tick' in step) await playTick(layer, S.tick(id, step.tick, { silent: step.silent }), id, ctx);
        else if ('drain' in step) { if (!ctx.quiet) S.drain(id, step.drain); }
        else if ('progress' in step) { if (!ctx.quiet) S.progress(id, step.progress); }
        else if (step.pause) S.pause(id, true);
        else if (step.resume) S.pause(id, false);
        else if (step.resolve) S.resolve(id);
    }
    async function playTick(layer, result, id, ctx) {
        const d = Rift.Stakes.def(id) || {};
        if (result.outcome === 'full' && d.full) {
            const before = ctx.deathOf;
            ctx.deathOf = d.peril || null;
            try { await run(layer, d.full, ctx); } finally { ctx.deathOf = before; }
        }
        else if (result.outcome === 'hold' && d.full) await run(layer, d.full, ctx);   // the Copy: UPLOAD COMPLETE
        else if (result.outcome === 'brink' && d.brink) await run(layer, d.brink, ctx);
        else if (result.warn) await run(layer, result.warn, ctx);
    }

    // ---- the runner ----------------------------------------------------------------

    // { keepsake: 'cage-cushion' } shows keepsake/<id> at the side and remembers it was given;
    // { prop: 'ui/memorial-candle' } shows any art in the same place, with no flag (memorial props).
    function keepsake(layer, id, ctx, art) {
        if (!art) Story().setFlag('keepsake:' + id, true);
        const img = Rift.Assets.img(art || 'keepsake/' + id, { className: 'keepsake', label: (art ? id.split('/').pop().replace(/^memorial-/, '') : id).replace(/-/g, ' ') });
        if (ctx.keepsake) ctx.keepsake.remove();
        ctx.keepsake = img;
        layer.appendChild(img);
    }

    // { scene: 'scene/burrow' } shows a background behind the dialogue for the rest of the script;
    // { scene: 'black' } is plain black; { scene: null } clears it.
    function backdrop(layer, id, ctx) {
        if (ctx.backdrop) { ctx.backdrop.remove(); ctx.backdrop = null; }
        if (!id) return;
        const node = id === 'black' ? el('div.dialogue-backdrop.black') : el('div.dialogue-backdrop', null, [Rift.Assets.img(id, { className: 'scene-bg', label: id })]);
        ctx.backdrop = node;
        if (layer.insertBefore && layer.firstChild) layer.insertBefore(node, layer.firstChild); else layer.appendChild(node);
    }

    async function quietStep(layer, who, ctx) {
        const npc = Story().npcOf(Rift.Cast.roleOf(who));
        const key = 'quiet.' + npc;
        if (Story().flag('quiet:' + npc) !== 'pending' || !(Rift.data.script || {})[key]) return;
        const wasQuiet = ctx.quiet;
        layer.classList.add('quiet-scene');
        ctx.quiet = true;
        try { await run(layer, Rift.data.script[key], ctx); } finally { ctx.quiet = wasQuiet; if (!wasQuiet) layer.classList.remove('quiet-scene'); }
        Story().setFlag('quiet:' + npc, 'done');
        Story().setFlag('seen:' + key, true);
    }

    async function run(layer, steps, ctx) {
        for (const step of steps || []) {
            if (!step || typeof step !== 'object') continue;
            if (step.when !== undefined && (step.then || step.else)) {
                await run(layer, Story().test(step.when, ctx) ? step.then : step.else, ctx);
                continue;
            }
            if (step.when !== undefined && !Story().test(step.when, ctx)) continue;
            if (!Story().matchesOnly(step.only)) continue;
            if (Rift.Ambience && step.ambience) Rift.Ambience.scene(step.ambience);
            if (Rift.Ambience && step.tension != null) Rift.Ambience.tension(step.tension);
            if (step.inner) await inner(layer, step, ctx);
            else if (step.lead) {
                const lead = leadFor(step.lead, ctx);
                if (lead) await run(layer, [lead], ctx);
            } else if (step.choice) await choice(layer, step, ctx);
            // An unvoiced stage note: on-screen text (screens, readouts, posts), never recorded.
            else if (typeof step.note === 'string') await note(layer, ctx, step.note);
            else if (typeof step.s === 'string') await line(layer, step, ctx);
            else if (step.give) {
                if (ctx.quiet) continue;   // a Quiet Scene gives no rewards
                Object.entries(step.give).forEach(([id, n]) => Rift.State.addItem(id, n));
                Rift.UI.toast('Received: ' + Object.entries(step.give).map(([id, n]) => n + '× ' + ((Rift.data.items[id] || {}).name || id)).join(', '));
            } else if (step.clock) await clockStep(layer, step, ctx);
            else if (step.play) {
                const sub = (Rift.data.script || {})[step.play];
                if (!sub || (step.once && Story().flag('seen:' + step.play))) continue;
                await run(layer, sub, ctx);
                Story().setFlag('seen:' + step.play, true);
            } else if (step.arrive) Rift.Cast.arrive(step.arrive);
            else if (step.quiet) await quietStep(layer, step.quiet, ctx);
            else if (step.keepsake) keepsake(layer, step.keepsake, ctx);
            // Side-story rewards: a creature that visits (offered at your next win), a station shut for one visit.
            else if (step.visitor) { if (!ctx.quiet) Story().setFlag('visitor:' + step.visitor, true); }
            else if (step.closed) Story().setFlag('closed:' + step.closed, step.note || true);
            else if (step.prop) { if (Rift.Assets.has(step.prop)) keepsake(layer, step.prop, ctx, step.prop); }
            else if ('scene' in step) backdrop(layer, step.scene, ctx);
            else if (step.possess) {
                const role = step.possess;
                if (Rift.Cast.canPossess(role)) Story().setFlag('possessed:' + role, true);
            } else if (step.free) Story().setFlag('possessed:' + step.free, false);
            else if (step.flag) {
                if (typeof step.add === 'number') Story().addFlag(step.flag, step.add);
                else Story().setFlag(step.flag, step.value === undefined ? true : step.value);
            }
        }
    }

    // The lead bank (STORY.md App. E): `lead: true` uses this station's puzzle (and its mode).
    function leadFor(spec, ctx) {
        const bank = Rift.data.leads || {};
        if (typeof spec === 'string') return bank[spec] || bank[spec.split(':')[0]] || null;
        const p = ctx.puzzle;
        if (!p) return null;
        const id = typeof p === 'string' ? p : p.id;
        const mode = typeof p === 'object' && (p.mode || (p.opts && p.opts.mode));
        // A station may name its own bank (puzzle opts.lead, e.g. 'well' → 'venn:well'), so a lead never repeats.
        const tag = typeof p === 'object' && p.opts && p.opts.lead;
        if (tag === false) return null;   // opts.lead: false: no lead bank here (the Ch2 Square)
        return (tag && bank[id + ':' + tag]) || (mode && bank[id + ':' + mode]) || bank[id] || null;
    }

    // opts: { after, replay (a "Watch again" of a seen scene), quiet, puzzle }
    async function play(key, opts) {
        const o = opts || {};
        const steps = typeof key === 'string' ? (Rift.data.script || {})[key] : key;
        if (!steps || !steps.length) return;
        const named = typeof key === 'string';
        const replay = o.replay && named ? (Story().flag('cast@' + key) || {}) : null;
        const chapter = named ? Story().chapterOfKey(key) : null;
        const ctx = {
            key: named ? key : null,
            quiet: !!o.quiet,
            replay,
            memory: !!replay || (chapter ? Story().isMemory(chapter) : false),
            puzzle: o.puzzle || null,
            deathOf: o.deathOf || null,
            cast: {},
        };
        const overlay = root.document.getElementById('overlay');
        const layer = el('div.dialogue-layer' + (ctx.quiet ? '.quiet-scene' : '') + (replay ? '.memory-scene' : ''));
        overlay.appendChild(layer);
        ctx.releaseInput = Rift.UI && Rift.UI.input ? Rift.UI.input.claim(layer, { dialogue: () => !!ctx.cleanup }) : null;
        ctx.layer = layer;
        live.add(ctx);
        let finished = false;
        try {
            await run(layer, steps, ctx);
            finished = true;
        } finally {
            live.delete(ctx);
            if (ctx.cleanup) ctx.cleanup();
            if (ctx.releaseInput) ctx.releaseInput();
            if (Rift.UI && Rift.UI.input) Rift.UI.input.guard();
            Rift.Audio.stopVoice();
            layer.remove();
        }
        if (finished && named && Rift.State.get()) {
            Story().setFlag('seen:' + key, true);
            // Remember who played each role, so "Watch again" shows what was seen (UNDERSTUDIES.md §3.3).
            if (!replay && Object.keys(ctx.cast).length && !Story().flag('cast@' + key)) Story().setFlag('cast@' + key, ctx.cast);
        }
        if (o.after) o.after();
    }

    // Leaving the screen (the Map button, any router change) ends every open script: its box goes,
    // its voice stops, and its promise never settles, so the old screen's code after the await never runs.
    function abortAll() {
        live.forEach(ctx => {
            ctx.aborted = true;
            if (ctx.cleanup) ctx.cleanup();
            if (ctx.releaseInput) ctx.releaseInput();
            ctx.layer.remove();
        });
        live.clear();
        Rift.Audio.stopVoice();
    }

    // The Quiet Scene for an NPC, if pending (used at chapter openings).
    async function playQuiet(npc) {
        const key = 'quiet.' + npc;
        if (Story().flag('quiet:' + npc) !== 'pending' || !(Rift.data.script || {})[key]) return false;
        await play(key, { quiet: true });
        Story().setFlag('quiet:' + npc, 'done');
        return true;
    }

    // An engine tick (a wrong check in a stakes scene): plays the warning or the outcome.
    async function clockTick(id, k) {
        if (!Rift.Stakes) return null;
        const result = Rift.Stakes.tick(id, k);
        const d = Rift.Stakes.def(id) || {};
        const steps = result.outcome === 'full' ? d.full : result.outcome === 'brink' ? d.brink : result.warn;
        if (steps && steps.length) await play(steps, { deathOf: result.outcome === 'full' ? d.peril : null });
        return result;
    }

    Rift.Dialogue = { play, playQuiet, clockTick, abortAll, has: key => !!(Rift.data.script || {})[key] };
})(typeof window !== 'undefined' ? window : globalThis);
