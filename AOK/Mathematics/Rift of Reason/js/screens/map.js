/*
 * The overworld map: fixed nodes under fog of war, the avatar walking along
 * paths with its walk cycle, hover teasers, and the time-rift chapter menu.
 */
(function (root) {
    'use strict';

    const Rift = root.Rift;
    const el = (...a) => Rift.el(...a);
    const SVG = 'http://www.w3.org/2000/svg';
    const W = 1600, H = 900;
    const ICONS = { story: '✦', puzzle: '?', miniboss: '☠', boss: '♛', rest: '🔥', rumour: '💬', battle: '🂠', rift: '🌀' };
    const SECONDS_PER_EDGE = 0.9;

    function svg(tag, attrs, children) {
        const n = root.document.createElementNS(SVG, tag);
        Object.entries(attrs || {}).forEach(([k, v]) => n.setAttribute(k, v));
        (children || []).forEach(c => c && n.appendChild(c));
        return n;
    }

    // Shortest path through revealed nodes (BFS).
    function route(state, from, to) {
        const ok = id => state.map.revealed.includes(id);
        const prev = { [from]: null };
        const queue = [from];
        while (queue.length) {
            const cur = queue.shift();
            if (cur === to) break;
            (Rift.World.node(cur).links || []).forEach(n => {
                if (!(n in prev) && ok(n)) { prev[n] = cur; queue.push(n); }
            });
        }
        if (!(to in prev)) return null;
        const path = [];
        for (let c = to; c; c = prev[c]) path.unshift(c);
        return path;
    }

    Rift.Screens.register('map', {
        mount(rootNode, params) {
            const state = Rift.State.get();
            let walking = false;
            let destroyed = false;
            const tip = el('div.map-tip.panel');
            tip.style.display = 'none';

            const board = svg('svg', { viewBox: `0 0 ${W} ${H}`, class: 'map-svg', preserveAspectRatio: 'xMidYMid meet' });
            const bg = svg('image', { href: Rift.Assets.src('scene/map', { width: W, height: H, label: 'the map' }), x: 0, y: 0, width: W, height: H, preserveAspectRatio: 'xMidYMid slice' });
            const pathsLayer = svg('g', { class: 'paths' });
            const fogMask = svg('mask', { id: 'fog-mask' });
            const fog = svg('rect', { x: 0, y: 0, width: W, height: H, class: 'fog', mask: 'url(#fog-mask)' });
            const nodesLayer = svg('g', { class: 'nodes' });
            const avatarLayer = svg('g', { class: 'avatar-layer' });
            board.append(svg('defs', {}, [
                svg('radialGradient', { id: 'fog-hole' }, [
                    svg('stop', { offset: '0', 'stop-color': 'black' }),
                    svg('stop', { offset: '0.6', 'stop-color': 'black' }),
                    svg('stop', { offset: '1', 'stop-color': 'white' }),
                ]),
                fogMask,
            ]), bg, pathsLayer, fog, nodesLayer, avatarLayer);

            const hud = Rift.UI.hud();
            const chapterLabel = el('div.chapter-label.panel');
            const riftBtn = el('button.btn.small', { text: '🌀 Time rift', title: 'Jump to a chapter', onclick: () => riftMenu() });
            rootNode.append(el('div.map-wrap', null, [board]), hud, el('div.map-bottom.row', null, [chapterLabel, riftBtn]), tip);

            // ---- avatar sprite ----
            const avatarGroup = svg('g', { class: 'map-avatar' });
            const walkSheet = Rift.Assets.frames(Rift.avatarArt(state.avatar, 'walk'));
            const AV = 90; // drawn height in map units
            let sprite;
            if (walkSheet) {
                const fw = walkSheet.frameWidth, fh = walkSheet.frameHeight;
                const w = AV * fw / fh;
                sprite = svg('svg', { x: -w / 2, y: -AV, width: w, height: AV, viewBox: `0 0 ${fw} ${fh}` }, [
                    svg('image', { href: Rift.Assets.url(Rift.avatarArt(state.avatar, 'walk')), width: fw * walkSheet.frames, height: fh }),
                ]);
                sprite.dataset.frames = walkSheet.frames;
                sprite.dataset.fw = fw;
            } else {
                const a = Rift.data.avatars[state.avatar.type];
                sprite = svg('image', { href: Rift.Assets.src(Rift.avatarArt(state.avatar, 'idle'), { colour: a.colour, label: state.avatar.nickname }), x: -AV * 0.42, y: -AV, width: AV * 0.84, height: AV });
            }
            const flip = svg('g', {}, [sprite]);
            avatarGroup.append(svg('ellipse', { cx: 0, cy: 0, rx: 26, ry: 8, class: 'avatar-shadow' }), flip);
            avatarLayer.append(avatarGroup);

            function placeAvatar(x, y, hop, facingLeft, frame) {
                avatarGroup.setAttribute('transform', `translate(${x},${y - (hop || 0)})`);
                flip.setAttribute('transform', facingLeft ? 'scale(-1,1)' : '');
                if (sprite.dataset.frames) {
                    const fw = +sprite.dataset.fw;
                    sprite.setAttribute('viewBox', `${(frame || 0) * fw} 0 ${fw} ${sprite.viewBox.baseVal.height}`);
                }
            }

            // ---- draw ----
            function draw() {
                const st = Rift.State.get();
                const revealed = st.map.revealed;
                const hints = Rift.World.hinted(st);
                pathsLayer.innerHTML = '';
                nodesLayer.innerHTML = '';
                fogMask.innerHTML = '';
                fogMask.append(svg('rect', { x: 0, y: 0, width: W, height: H, fill: 'white' }));
                const drawn = new Set();
                revealed.forEach(id => {
                    const n = Rift.World.node(id);
                    fogMask.append(svg('circle', { cx: n.x, cy: n.y, r: 210, fill: 'url(#fog-hole)' }));
                    (n.links || []).forEach(m => {
                        const key = [id, m].sort().join('|');
                        if (drawn.has(key)) return;
                        drawn.add(key);
                        const o = Rift.World.node(m);
                        const known = revealed.includes(m);
                        pathsLayer.append(svg('path', {
                            d: `M${n.x} ${n.y} Q ${(n.x + o.x) / 2 + (n.y - o.y) * 0.12} ${(n.y + o.y) / 2 + (o.x - n.x) * 0.12} ${o.x} ${o.y}`,
                            class: 'map-path' + (known ? '' : ' faint'),
                        }));
                    });
                });
                hints.forEach(id => nodesLayer.append(nodeMarker(id, 'hinted')));
                revealed.forEach(id => nodesLayer.append(nodeMarker(id, 'revealed')));
                const ch = Rift.data.chapters[st.chapter] || {};
                chapterLabel.textContent = (ch.name || '') + '  ·  Level ' + Rift.World.level(st);
            }

            function nodeMarker(id, kind) {
                const st = Rift.State.get();
                const n = Rift.World.node(id);
                const done = st.map.completed.includes(id);
                const locked = kind === 'revealed' && Rift.World.lockReason(st, id);
                const g = svg('g', {
                    class: ['map-node', kind, n.type, done ? 'done' : '', locked ? 'locked' : '', st.map.at === id ? 'here' : ''].join(' '),
                    transform: `translate(${n.x},${n.y})`,
                    tabindex: kind === 'revealed' ? 0 : -1,
                });
                g.append(
                    svg('circle', { r: n.type === 'boss' ? 30 : 24, class: 'ring' }),
                    svg('text', { class: 'icon', 'text-anchor': 'middle', 'dominant-baseline': 'central' }),
                );
                g.querySelector('text').textContent = kind === 'hinted' ? '?' : (ICONS[n.type] || '•');
                g.addEventListener('mouseenter', () => showTip(id, kind, locked));
                g.addEventListener('mouseleave', () => { tip.style.display = 'none'; });
                if (kind === 'revealed') {
                    g.addEventListener('click', () => goTo(id));
                    g.addEventListener('keydown', ev => { if (ev.key === 'Enter') goTo(id); });
                }
                return g;
            }

            function showTip(id, kind, locked) {
                const n = Rift.World.node(id);
                tip.innerHTML = '';
                tip.append(
                    el('strong', { text: kind === 'hinted' ? '???' : n.name }),
                    el('div.small', { text: n.teaser || '' }),
                    locked ? el('div.small.warn', { text: '🔒 ' + locked }) : null,
                );
                const rect = board.getBoundingClientRect();
                const sx = rect.width / W, sy = rect.height / H, s = Math.min(sx, sy);
                const ox = rect.left + (rect.width - W * s) / 2, oy = rect.top + (rect.height - H * s) / 2;
                tip.style.left = Math.min(root.innerWidth - 280, ox + n.x * s + 24) + 'px';
                tip.style.top = Math.max(60, oy + n.y * s - 30) + 'px';
                tip.style.display = 'block';
            }

            // ---- walking ----
            function walkEdge(fromId, toId) {
                const a = Rift.World.node(fromId), b = Rift.World.node(toId);
                const cx = (a.x + b.x) / 2 + (a.y - b.y) * 0.12, cy = (a.y + b.y) / 2 + (b.x - a.x) * 0.12;
                const dur = SECONDS_PER_EDGE * 1000 * Math.max(0.6, Math.hypot(b.x - a.x, b.y - a.y) / 220);
                const left = b.x < a.x;
                return new Promise(resolve => {
                    const t0 = performance.now();
                    let lastStep = -1;
                    let finished = false;
                    const frameCount = +sprite.dataset.frames || 0;
                    const done = () => {
                        if (finished) return;
                        finished = true;
                        placeAvatar(b.x, b.y, 0, left, 0);
                        resolve();
                    };
                    // Animation frames pause in hidden tabs; never let a walk hang.
                    setTimeout(done, dur + 400);
                    const tick = now => {
                        if (finished) return;
                        if (destroyed) return done();
                        const t = Math.min(1, (now - t0) / dur);
                        const x = (1 - t) * (1 - t) * a.x + 2 * (1 - t) * t * cx + t * t * b.x;
                        const y = (1 - t) * (1 - t) * a.y + 2 * (1 - t) * t * cy + t * t * b.y;
                        const phase = (now - t0) / 160;
                        const step = Math.floor(phase);
                        if (step !== lastStep) { lastStep = step; Rift.Audio.sfx('step', { minGap: 120, volume: 0.5 }); }
                        const hop = frameCount ? 0 : Math.abs(Math.sin(phase * Math.PI / 2)) * 10;
                        placeAvatar(x, y, hop, left, frameCount ? step % frameCount : 0);
                        if (t < 1) requestAnimationFrame(tick); else done();
                    };
                    requestAnimationFrame(tick);
                });
            }

            async function goTo(id) {
                if (walking) return;
                const st = Rift.State.get();
                const locked = Rift.World.lockReason(st, id);
                if (locked) { Rift.UI.toast(locked); Rift.Audio.sfx('error'); return; }
                const path = route(st, st.map.at, id);
                if (!path) { Rift.UI.toast('No known path there yet.'); return; }
                walking = true;
                tip.style.display = 'none';
                for (let i = 1; i < path.length; i++) {
                    await walkEdge(path[i - 1], path[i]);
                    Rift.State.update(s => { s.map.at = path[i]; });
                }
                walking = false;
                if (!destroyed) arrive(id);
            }

            async function arrive(id) {
                const st = Rift.State.get();
                const n = Rift.World.node(id);
                const done = st.map.completed.includes(id);
                const finish = () => {
                    const before = st.map.revealed.length;
                    Rift.State.update(s => Rift.World.complete(s, id));
                    if (Rift.State.get().map.revealed.length > before) { Rift.Audio.sfx('reveal'); Rift.UI.toast('The fog lifts…'); }
                    draw();
                };
                switch (n.type) {
                    case 'story':
                    case 'rumour':
                    case 'rift':
                        if (!done || n.type !== 'story' || await Rift.UI.confirm(n.name, 'Watch this scene again?', 'Watch', 'Not now')) {
                            await Rift.Dialogue.play(n.script);
                        }
                        finish();
                        break;
                    case 'rest':
                        await Rift.Dialogue.play(n.script);
                        Rift.State.update(s => { s.health = Rift.UI.maxHealth(s); });
                        Rift.Audio.sfx('heal');
                        Rift.UI.toast('Rested: health restored.');
                        finish();
                        shrineOffer();
                        break;
                    case 'battle':
                        if (!Rift.Screens.get('battle')) { Rift.UI.toast('The cards are being shuffled. Battles open soon!'); finish(); break; }
                        await Rift.Dialogue.play(n.script);
                        Rift.Router.go('battle', battleParams(id));
                        break;
                    default:
                        Rift.Router.go('encounter', { nodeId: id });
                }
            }

            function shrineOffer() {
                const s = Rift.State.get();
                if (!s.scars.length) return;
                Rift.UI.modal('A quiet shrine', el('p', { text: 'Solve a harder puzzle here to heal one scar.' }), [
                    { label: 'Not now' },
                    { label: 'Try it', primary: true, onclick: () => Rift.Router.go('encounter', { nodeId: s.map.at, shrine: true }) },
                ]);
            }

            function battleParams(id) {
                const n = Rift.World.node(id);
                const t = Rift.data.trainers[n.trainer];
                return {
                    mode: 'trainer',
                    nodeId: id,
                    seed: Rift.State.get().seed + ':' + id + ':' + Date.now(),
                    opponent: { name: t.name, team: t.team.map(sp => Rift.State.makeCreature(sp)), ante: t.ante },
                    onEnd() { Rift.State.update(s => Rift.World.complete(s, id)); Rift.Router.replace('map'); },
                };
            }

            function riftMenu() {
                const st = Rift.State.get();
                const rows = Object.entries(Rift.data.chapters).map(([cid, ch]) => el('div.row', null, [
                    el('div', { style: { flex: 1 } }, [el('strong', { text: ch.name }), el('div.small.muted', { text: 'Lesson ' + ch.lesson + (ch.comingSoon ? ' · opens later' : '') })]),
                    el('button.btn.small', {
                        text: 'Jump',
                        disabled: !!ch.comingSoon || !ch.start,
                        onclick() {
                            m.close();
                            let first = false;
                            Rift.State.update(s => { first = Rift.World.jumpToChapter(s, cid); });
                            Rift.Audio.sfx('rift');
                            const n = Rift.World.node(Rift.State.get().map.at);
                            placeAvatar(n.x, n.y);
                            draw();
                            if (first) Rift.UI.toast('A starter kit tumbles out of the rift!');
                        },
                    }),
                ]));
                const m = Rift.UI.modal('Time rift', el('div.stack', null, [el('p.small.muted', { text: 'Jump to any chapter. Skipped places stay in the fog for later.' })].concat(rows)));
            }

            // ---- start ----
            const here = Rift.World.node(state.map.at);
            placeAvatar(here.x, here.y);
            draw();
            if (params && params.arrive) setTimeout(() => arrive(state.map.at), 400);

            return {
                destroy() { destroyed = true; if (hud.destroy) hud.destroy(); },
            };
        },
    });
})(typeof window !== 'undefined' ? window : globalThis);
