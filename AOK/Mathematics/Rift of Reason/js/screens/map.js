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
    const ICONS = { story: '✦', puzzle: '?', bonus: '◇', miniboss: '☠', boss: '♛', rest: '🔥', rumour: '💬', battle: '🂠', rift: '🌀' };
    const SECONDS_PER_EDGE = 0.9;
    // Places already shown on each painted map this session (presentation only, never saved): a
    // place revealed since then opens its fog and fades in once (#66). A map's first view sets it.
    const shownPlaces = {};

    function svg(tag, attrs, children) {
        const n = root.document.createElementNS(SVG, tag);
        Object.entries(attrs || {}).forEach(([k, v]) => n.setAttribute(k, v));
        (children || []).forEach(c => c && n.appendChild(c));
        return n;
    }

    // Which painted map a node sits on (see Rift.data.maps).
    function mapOf(id) {
        return Rift.World.node(id).map || 'main';
    }

    // Shortest path through revealed nodes on the same map (BFS).
    function route(state, from, to) {
        const here = mapOf(from);
        const ok = id => state.map.revealed.includes(id) && mapOf(id) === here;
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

    let trackerFolded = false;   // for this browser session only

    Rift.Screens.register('map', {
        mount(rootNode, params) {
            const state = Rift.State.get();
            const mapId = mapOf(state.map.at);
            const mapDef = (Rift.data.maps || {})[mapId] || { scene: 'scene/map', name: '' };
            if (Rift.Ambience) Rift.Ambience.scene(mapDef.scene);
            const onThisMap = id => mapOf(id) === mapId;
            let walking = false;
            let destroyed = false;
            let pendingArrival = false;
            let arrivalTimer = null;
            let arriving = false;
            let unlockInput = null;
            const input = Rift.UI.input;
            const blockInput = () => { if (input && !unlockInput) unlockInput = input.lock(rootNode); };
            const releaseInput = () => { if (unlockInput) unlockInput(); unlockInput = null; };
            const tip = el('div.map-tip.panel');
            tip.style.display = 'none';

            const board = svg('svg', { viewBox: `0 0 ${W} ${H}`, class: 'map-svg', preserveAspectRatio: 'xMidYMid meet' });
            const bg = svg('image', { href: Rift.Assets.src(mapDef.scene, { width: W, height: H, label: mapDef.name || 'the map' }), x: 0, y: 0, width: W, height: H, preserveAspectRatio: 'xMidYMid slice' });
            const pathsLayer = svg('g', { class: 'paths' });
            const fogMask = svg('mask', { id: 'fog-mask' });
            const fog = svg('rect', { x: 0, y: 0, width: W, height: H, class: 'fog', mask: 'url(#fog-mask)' });
            const nodesLayer = svg('g', { class: 'nodes' });
            const avatarLayer = svg('g', { class: 'avatar-layer' });
            const crisisLayer = svg('g', { class: 'map-crisis', 'aria-hidden': 'true' });
            const crisisNote = el('div.map-crisis-note.panel.small', { role: 'status' });
            // Roaming legendaries (#111, js/core/hunts.js): the trail of a flight, the runner, a plain-text note.
            const huntTrails = svg('g', { class: 'map-hunt-trails', 'aria-hidden': 'true' });
            const huntRunners = svg('g', { class: 'map-hunt-runners', 'aria-hidden': 'true' });
            const huntNote = el('div.map-hunt-note.panel.small', { role: 'status' });
            const flying = new Set();   // hunts whose runner is still on its way (badge not drawn yet)
            board.append(svg('defs', {}, [
                svg('radialGradient', { id: 'fog-hole' }, [
                    svg('stop', { offset: '0', 'stop-color': 'black' }),
                    svg('stop', { offset: '0.6', 'stop-color': 'black' }),
                    svg('stop', { offset: '1', 'stop-color': 'white' }),
                ]),
                fogMask,
            ]), bg, pathsLayer, fog, crisisLayer, huntTrails, nodesLayer, huntRunners, avatarLayer);

            const hud = Rift.UI.hud();
            const chapterLabel = el('div.chapter-label.panel');
            const riftBtn = el('button.btn.small', { text: '🌀 Time rift', title: 'Jump to a chapter', onclick: () => riftMenu() });
            const tracker = el('div.quest-tracker.panel');
            rootNode.append(el('div.map-wrap', null, [board]), hud, tracker, crisisNote, huntNote, el('div.map-bottom.row', null, [chapterLabel, riftBtn]), tip);

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
                syncHunts();
                const st = Rift.State.get();
                const crisis = mapId === 'main' && st.flags['seen:prologue.rift'] && !st.flags['seen:finale.home'];
                const recovering = !!st.flags['seen:ch1.gate.win'];
                crisisLayer.replaceChildren();
                crisisNote.style.display = crisis ? '' : 'none';
                if (crisis) {
                    crisisLayer.append(svg('path', { d: 'M90 92 L360 102 L490 68 L720 100 L880 72 L1120 86 L1470 46', class: recovering ? 'sky-crack recovering' : 'sky-crack' }));
                    crisisNote.textContent = recovering ? 'The crack has stopped drinking. The Fair is recovering.' : 'The sky is cracked. The Fair has fallen quiet.';
                }
                const revealed = st.map.revealed.filter(onThisMap);
                const hints = Rift.World.hinted(st).filter(onThisMap);
                pathsLayer.innerHTML = '';
                nodesLayer.innerHTML = '';
                fogMask.innerHTML = '';
                fogMask.append(svg('rect', { x: 0, y: 0, width: W, height: H, fill: 'white' }));
                const drawn = new Set(), holes = {}, markers = {};
                const fresh = shownPlaces[mapId] ? revealed.filter(id => !shownPlaces[mapId].has(id)) : [];
                revealed.forEach(id => {
                    const n = Rift.World.node(id);
                    fogMask.append(holes[id] = svg('circle', { cx: n.x, cy: n.y, r: 210, fill: 'url(#fog-hole)' }));
                    (n.links || []).filter(onThisMap).forEach(m => {
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
                revealed.forEach(id => nodesLayer.append(markers[id] = nodeMarker(id, 'revealed')));
                // A newly reached place: the fog opens around it, then its marker fades in, so the
                // player sees what the last win opened and where to go next.
                if (Rift.Motion) fresh.forEach((id, i) => {
                    Rift.Motion.play(holes[id], [{ r: '0px' }, { r: '210px' }], { duration: 700, delay: i * 120 }, [{ opacity: 0 }, { opacity: 1 }]);
                    Rift.Motion.play(markers[id], [{ opacity: 0, filter: 'brightness(2)' }, { opacity: 1, filter: 'none' }],
                        { duration: 600, delay: 300 + i * 120, fill: 'backwards' }, [{ opacity: 0 }, { opacity: 1 }]);
                });
                shownPlaces[mapId] = new Set(revealed);
                const ch = Rift.data.chapters[st.chapter] || {};
                drawTracker(st);
                drawHunts(st);
                chapterLabel.textContent = (mapDef.name ? mapDef.name + '  ·  ' : '') + (ch.name || '') + '  ·  Level ' + Rift.World.level(st);
            }

            // The tracker: the next few open entries; a click opens the journal.
            function drawTracker(st) {
                const open = Rift.Quests ? Rift.Quests.tracked(st, 3) : [];
                tracker.replaceChildren();
                tracker.style.display = open.length ? '' : 'none';
                tracker.append(el('div.quest-tracker-head', null, [
                    el('button.quest-tracker-title', { text: 'Journal', title: 'Open the journal', onclick: () => Rift.Router.go('journal') }),
                    el('button.quest-tracker-fold', {
                        text: trackerFolded ? '▸' : '▾', title: trackerFolded ? 'Show the tracker' : 'Hide the tracker',
                        'aria-label': trackerFolded ? 'Show the tracker' : 'Hide the tracker',
                        onclick() { trackerFolded = !trackerFolded; drawTracker(Rift.State.get()); },
                    }),
                ]));
                if (trackerFolded) return;
                open.forEach(q => tracker.append(el('button.quest-tracker-row.' + q.kind, {
                    title: 'Show on the map',
                    onclick() { focusNode(q.node); },
                }, [Rift.Quests.glyph(q.kind, q.status),
                    el('span', { text: q.title }),
                    (Rift.World.node(q.node) || {}).name !== q.title ? el('span.small.muted', { text: (Rift.World.node(q.node) || {}).name }) : null])));
            }

            // ---- roaming legendaries (#111) ----
            const Hunts = Rift.Hunts;
            const huntsHere = st => (Hunts ? Object.keys(Hunts.defs()).filter(h => Hunts.def(h).map === mapId && Hunts.record(st, h)) : []);
            const huntName = h => (Rift.data.creatures[Hunts.def(h).species] || {}).name || h;

            // Finds new hunts and ends caught-up trails; saves only when something changed.
            function syncHunts() {
                if (!Hunts || !Hunts.needsSync(Rift.State.get())) return;
                let found = [];
                Rift.State.update(s => { found = Hunts.sync(s); });
                found.forEach(h => {
                    const rec = Hunts.record(Rift.State.get(), h);
                    Rift.UI.toast('★ ' + Hunts.def(h).found.replace('{place}', Hunts.placeName(rec.node)), 5000);
                });
            }

            // The curve between two linked nodes, as drawn for the map's own paths.
            function curve(a, b) {
                return { a, b, cx: (a.x + b.x) / 2 + (a.y - b.y) * 0.12, cy: (a.y + b.y) / 2 + (b.x - a.x) * 0.12 };
            }
            function huntRoute(st, h) {
                const dep = Hunts.record(st, h).departure;
                const ids = Hunts.path(st, dep.from, dep.to) || [dep.from, dep.to];
                return ids.map(id => Rift.World.node(id));
            }

            // The trail of every shown flight (static, in every motion setting) and one plain line per hunt.
            function drawHunts(st) {
                huntTrails.replaceChildren();
                const lines = [];
                huntsHere(st).forEach(h => {
                    const rec = Hunts.record(st, h);
                    if (rec.departure && rec.departure.from !== rec.departure.to) {
                        const pts = huntRoute(st, h);
                        let d = `M${pts[0].x} ${pts[0].y}`;
                        for (let i = 1; i < pts.length; i++) { const c = curve(pts[i - 1], pts[i]); d += ` Q ${c.cx} ${c.cy} ${c.b.x} ${c.b.y}`; }
                        huntTrails.append(svg('path', { d, class: 'hunt-trail' }));
                    }
                    if (rec.phase === 'roaming') lines.push(el('button', { text: '★ ' + Hunts.status(st, h), title: 'Show on the map', onclick: () => focusNode(rec.node) }));
                });
                huntNote.replaceChildren(...lines);
                huntNote.style.display = lines.length ? '' : 'none';
            }

            function huntBadge(nodeId, h) {
                const st = Rift.State.get();
                const sp = Rift.data.creatures[Hunts.def(h).species];
                const rec = Hunts.record(st, h);
                const label = (rec.phase === 'claimed' ? 'Practise with ' : 'Optional challenge: ') + sp.name;
                const b = svg('g', { class: 'hunt-badge' + (rec.resting ? ' resting' : ''), transform: 'translate(36,22)', tabindex: 0, role: 'button', 'aria-label': label });
                b.append(svg('circle', { r: 23, class: 'hunt-badge-ring' }));
                b.append(svg('image', { href: Rift.Assets.src('creature/' + Hunts.def(h).species + '/idle', { colour: sp.colour, label: ' ' }), x: -17, y: -21, width: 34, height: 41 }));
                const star = svg('text', { class: 'hunt-badge-star', x: 15, y: -13, 'text-anchor': 'middle', 'dominant-baseline': 'central' });
                star.textContent = '★';
                b.append(star);
                const go = ev => { ev.stopPropagation(); goTo(nodeId, null, h); };
                b.addEventListener('click', go);
                b.addEventListener('keydown', ev => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); if (!ev.repeat) go(ev); } });
                return b;
            }

            const calmMotion = () => {
                const body = root.document.body;
                if (body && body.classList && body.classList.contains('calm-motion')) return true;
                try { return !!(root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches); } catch (e) { return false; }
            };

            // A flight the map has not shown yet: the creature runs once along the trail (a plain jump to the
            // new place under Calm motion or reduced motion). The new place was saved before; this only shows it.
            async function showDepartures() {
                const st = Rift.State.get();
                const due = huntsHere(st).filter(h => { const dep = Hunts.record(st, h).departure; return dep && !dep.seen; });
                for (const h of due) {
                    if (destroyed) return;
                    const rec = Hunts.record(Rift.State.get(), h);
                    const dep = rec.departure;
                    if (dep.from !== dep.to && !calmMotion()) {
                        flying.add(h);
                        draw();
                        await runAlong(h, huntRoute(Rift.State.get(), h));
                        flying.delete(h);
                    }
                    if (destroyed) return;
                    Rift.State.update(s => { Hunts.seen(s, h); });
                    Rift.UI.toast('★ ' + Hunts.status(Rift.State.get(), h), 5000);
                    draw();
                }
            }

            function runAlong(h, pts) {
                const sp = Rift.data.creatures[Hunts.def(h).species];
                // The run sheet (6 frames facing right, like the avatar's walk) when it exists; else the idle art.
                const runId = 'creature/' + Hunts.def(h).species + '/run';
                const sheet = Rift.Assets.frames(runId);
                const RH = 54;
                let runner;
                if (sheet) {
                    const fw = sheet.frameWidth, fh = sheet.frameHeight, w = RH * fw / fh;
                    runner = svg('svg', { x: -w / 2, y: -RH, width: w, height: RH, viewBox: `0 0 ${fw} ${fh}`, class: 'hunt-runner' }, [
                        svg('image', { href: Rift.Assets.url(runId), width: fw * sheet.frames, height: fh }),
                    ]);
                } else {
                    runner = svg('image', { href: Rift.Assets.src('creature/' + Hunts.def(h).species + '/idle', { colour: sp.colour, label: ' ' }), x: -22, y: -RH, width: 44, height: RH, class: 'hunt-runner' });
                }
                const g = svg('g', { transform: `translate(${pts[0].x},${pts[0].y})` }, [runner]);
                huntRunners.append(g);
                const legs = [];
                for (let i = 1; i < pts.length; i++) legs.push(curve(pts[i - 1], pts[i]));
                const dur = Math.min(2600, 650 * Math.max(1, legs.length));
                return new Promise(resolve => {
                    let finished = false;
                    const done = () => { if (finished) return; finished = true; g.remove(); resolve(); };
                    setTimeout(done, dur + 400);   // animation frames pause in hidden tabs
                    const t0 = performance.now();
                    if (!legs.length) { done(); return; }
                    const tick = now => {
                        if (finished) return;
                        if (destroyed) return done();
                        // A frame's timestamp can be a little before t0: clamp, or legs[-1] is undefined.
                        const t = Math.min(1, Math.max(0, now - t0) / dur) * legs.length;
                        const leg = legs[Math.min(legs.length - 1, Math.floor(t))];
                        const u = Math.min(1, t - Math.min(legs.length - 1, Math.floor(t)));
                        const x = (1 - u) * (1 - u) * leg.a.x + 2 * (1 - u) * u * leg.cx + u * u * leg.b.x;
                        const y = (1 - u) * (1 - u) * leg.a.y + 2 * (1 - u) * u * leg.cy + u * u * leg.b.y;
                        g.setAttribute('transform', `translate(${x},${y})` + (leg.b.x < leg.a.x ? ' scale(-1,1)' : ''));
                        if (sheet) runner.setAttribute('viewBox', `${(Math.floor(Math.max(0, now - t0) / 90) % sheet.frames) * sheet.frameWidth} 0 ${sheet.frameWidth} ${sheet.frameHeight}`);
                        if (t < legs.length) requestAnimationFrame(tick); else done();
                    };
                    requestAnimationFrame(tick);
                });
            }

            // A calm ring that fades out round a station (from the journal or the tracker).
            function focusNode(id) {
                const n = Rift.World.node(id);
                if (!n || !onThisMap(id)) { Rift.UI.toast('That is on another map. Use a rift to get there.', 3000); return; }
                const ring = svg('circle', { cx: n.x, cy: n.y, r: 44, class: 'quest-focus' });
                nodesLayer.append(ring);
                setTimeout(() => ring.remove(), 2600);
            }

            function nodeMarker(id, kind) {
                const st = Rift.State.get();
                const n = Rift.World.node(id);
                const done = st.map.completed.includes(id);
                const catchOffer = (st.catchOffers || {})[id];
                if (catchOffer && !catchOffer.dismissed) {
                    Rift.Router.go('encounter', { nodeId: id });
                    return;
                }
                const locked = kind === 'revealed' && Rift.World.lockReason(st, id);
                // A dark-if-lost station (UNDERSTUDIES.md §3.4): its keeper is gone; it still counts as done.
                const dark = kind === 'revealed' && Rift.Cast && Rift.Cast.isDark(id);
                const g = svg('g', {
                    class: ['map-node', kind, n.type, done ? 'done' : '', dark ? 'dark' : '', locked ? 'locked' : '', st.map.at === id ? 'here' : ''].join(' '),
                    transform: `translate(${n.x},${n.y})`,
                    tabindex: kind === 'revealed' ? 0 : -1,
                    role: kind === 'revealed' ? 'button' : 'img',
                    'aria-label': n.name + (locked ? ' · ' + locked : ''),
                    'data-node': id,
                });
                const r = n.type === 'boss' ? 30 : 24;
                const marker = 'ui/marker-' + (n.type === 'bonus' ? 'puzzle' : n.type);
                g.append(svg('circle', { r, class: 'ring' }));
                if (kind === 'revealed' && Rift.Assets.has(marker)) {
                    // Painted medallion (art 'ui/marker-<type>') over the ring.
                    const s = r * 2.3;
                    g.append(svg('image', { href: Rift.Assets.src(marker), x: -s / 2, y: -s / 2, width: s, height: s, class: 'marker-art' }));
                } else {
                    const label = svg('text', { class: 'icon', 'text-anchor': 'middle', 'dominant-baseline': 'central' });
                    label.textContent = kind === 'hinted' ? '?' : (ICONS[n.type] || '•');
                    g.append(label);
                }
                g.addEventListener('mouseenter', () => showTip(id, kind, locked));
                g.addEventListener('mouseleave', () => { tip.style.display = 'none'; });
                if (kind === 'revealed') {
                    if(n.trainer&&Rift.Battles.canChallenge(id)){
                        const trainer=Rift.data.trainers[n.trainer], host=Rift.data.speakers[trainer.speaker];
                        g.append(svg('image',{href:Rift.Assets.src(host.art),x:-27,y:-86,width:54,height:60,'aria-label':trainer.name}));
                        const label=svg('text',{'text-anchor':'middle',y:43,fill:'white','font-size':18});
                        label.textContent=n.cardSchool?'Learn / Challenge':'Challenge';g.append(label);
                    }else if(n.trainer&&n.cardSchool){
                        // Its trainer is away (side story 7): the card school still teaches.
                        const label=svg('text',{'text-anchor':'middle',y:43,fill:'white','font-size':18});
                        label.textContent='Learn';g.append(label);
                    }
                    // Quest badge (js/core/quests.js): "!" new, "?" started; gold main story, blue side.
                    const qb = Rift.Quests && Rift.Quests.badge(st, id);
                    if (qb) g.append(questBadge(qb));
                    // A side story waits here (design/SIDE-STORIES.md section 1): a slowly fading bubble.
                    const side = Rift.SideStories && Rift.SideStories.at(id);
                    if (side) g.append(sideBubble(id, side));
                    // A roaming legendary waits here (#111): its badge opens the optional challenge.
                    if (Hunts) Hunts.at(st, id).filter(h => Hunts.def(h).map === mapId && !flying.has(h)).forEach(h => g.append(huntBadge(id, h)));
                    g.addEventListener('click', () => goTo(id));
                    g.addEventListener('keydown', ev => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); ev.stopPropagation(); if (!ev.repeat) goTo(id); } });
                }
                return g;
            }

            function questBadge(qb) {
                const b = svg('g', { class: 'quest-badge ' + qb.kind + ' ' + qb.status, transform: 'translate(-30,-40)', 'aria-hidden': 'true' });
                const art = 'ui/quest-' + qb.status + '-' + qb.kind;
                if (Rift.Assets.has(art)) b.append(svg('image', { href: Rift.Assets.src(art), x: -20, y: -24, width: 40, height: 44 }));
                else {
                    const t = svg('text', { 'text-anchor': 'middle', 'dominant-baseline': 'central', fill: Rift.Quests.COLOURS[qb.kind] });
                    t.textContent = Rift.Quests.GLYPH[qb.status];
                    b.append(t);
                }
                return b;
            }

            function sideBubble(id, side) {
                const colour = Rift.SideStories.colourOf(side);
                const b = svg('g', { class: 'side-bubble', transform: 'translate(30,-40)', tabindex: 0, role: 'button', 'aria-label': 'Side story: ' + side.title, style: '--side:' + colour.hex });
                b.append(svg('circle', { r: 20, class: 'side-bubble-ring' }));
                if (Rift.Assets.has('ui/side-story')) b.append(svg('image', { href: Rift.Assets.src('ui/side-story'), x: -19, y: -19, width: 38, height: 38 }));
                else { const t = svg('text', { class: 'side-bubble-icon', 'text-anchor': 'middle', 'dominant-baseline': 'central' }); t.textContent = '💬'; b.append(t); }
                const go = ev => { ev.stopPropagation(); goTo(id, side.id); };
                b.addEventListener('click', go);
                b.addEventListener('keydown', ev => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); if (!ev.repeat) go(ev); } });
                return b;
            }

            function showTip(id, kind, locked) {
                const n = Rift.World.node(id);
                tip.innerHTML = '';
                const dark = kind !== 'hinted' && Rift.Cast && Rift.Cast.isDark(id);
                tip.append(
                    el('strong', { text: kind === 'hinted' ? '???' : n.name }),
                    el('div.small', { text: dark ? (n.darkTeaser || 'Nobody is here now.') : (n.teaser || '') }),
                );
                // Element.append(null) would print the word "null".
                if (locked) tip.append(el('div.small.warn', { text: '🔒 ' + locked }));
                // Everything waiting here (js/core/quests.js), colour-coded; finished entries stay in the journal.
                const quests = kind === 'revealed' && !dark && Rift.Quests ? Rift.Quests.at(Rift.State.get(), id).filter(q => q.status !== 'done' && q.status !== 'locked') : [];
                if (quests.length) tip.append(el('ul.tip-quests', null, quests.map(q => el('li.' + q.kind, null, [
                    Rift.Quests.glyph(q.kind, q.status),
                    el('span', { text: q.title !== n.name ? q.title : (q.kind === 'main' ? 'Main story' : 'Side') + ' · ' + (q.status === 'new' ? 'new' : 'started') }),
                ]))));
                const side = kind === 'revealed' && Rift.SideStories && Rift.SideStories.at(id);
                if (side) tip.append(el('div.small.side-teaser', { text: '💬 ' + side.teaser }));
                if (kind === 'revealed' && Hunts) Hunts.at(Rift.State.get(), id).filter(h => !flying.has(h)).forEach(h => tip.append(el('div.small.hunt-teaser', {
                    text: '★ ' + huntName(h) + (Hunts.record(Rift.State.get(), h).phase === 'claimed' ? ' is here. Practise its tricks.' : ' waits here. Optional trick challenge.'),
                })));
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
                        if (step !== lastStep) {
                            lastStep = step;
                            // Two footfalls per six-frame walk cycle.
                            if (step % 3 === 0) Rift.Audio.sfx('step', { minGap: 350, volume: 0.5 });
                        }
                        const hop = frameCount ? 0 : Math.abs(Math.sin(phase * Math.PI / 2)) * 10;
                        placeAvatar(x, y, hop, left, frameCount ? step % frameCount : 0);
                        if (t < 1) requestAnimationFrame(tick); else done();
                    };
                    requestAnimationFrame(tick);
                });
            }

            // sideId: walk there and open that side story instead of the station.
            // huntId: walk there and open that roaming legendary's challenge (#111).
            async function goTo(id, sideId, huntId) {
                if (destroyed || walking || pendingArrival || arriving || (input && !input.available(rootNode))) return;
                const st = Rift.State.get();
                const locked = Rift.World.lockReason(st, id);
                if (locked) { Rift.UI.toast(locked); Rift.Audio.sfx('error'); return; }
                const path = route(st, st.map.at, id);
                if (!path) { Rift.UI.toast('No known path there yet.'); return; }
                walking = true;
                blockInput();
                tip.style.display = 'none';
                try {
                    for (let i = 1; i < path.length; i++) {
                        await walkEdge(path[i - 1], path[i]);
                        if (destroyed) return;
                        Rift.State.update(s => { s.map.at = path[i]; });
                    }
                    // Walking on lets a hiding creature come back, and ends a trail once you catch up.
                    syncHunts();
                    if (!destroyed && huntId) Rift.Router.go('hunt', { id: huntId });
                    else if (!destroyed && sideId) Rift.Router.go('side-story', { id: sideId });
                    else if (!destroyed) await arrive(id);
                } finally { walking = false; releaseInput(); }
            }

            // A chapter opening (STORY.md App. D, SCRIPT-FORMAT.md section 7): a pending Quiet Scene plays
            // first, at the first node reached in any later chapter; then, on a first time-rift jump, the
            // chapter's "Previously…" (recap.<chapter>).
            async function opening(ch, recap) {
                if (!ch || !Rift.Story) return;
                for (const npc of Rift.Story.pendingQuiet(ch)) {
                    if (destroyed) return;
                    await Rift.Dialogue.playQuiet(npc);
                }
                if (recap && !destroyed && Rift.Dialogue.has('recap.' + ch)) await Rift.Dialogue.play('recap.' + ch);
                Rift.Story.markEntered(ch);
            }

            async function arrive(id, opts) {
                if (destroyed || arriving) return;
                arriving = true;
                blockInput();
                try { await visit(id, opts); }
                finally { arriving = false; if (!walking && !pendingArrival) releaseInput(); }
            }

            async function visit(id, opts) {
                const n = Rift.World.node(id);
                await opening(n.chapter, opts && opts.recap);
                if (destroyed) return;
                const st = Rift.State.get();
                const done = st.map.completed.includes(id);
                // Shut for one visit by a side story's outcome ({ closed: id, note }).
                const shut = Rift.Story && Rift.Story.flag('closed:' + id);
                if (shut) {
                    Rift.State.update(s => { delete s.flags['closed:' + id]; });
                    Rift.UI.toast(typeof shut === 'string' ? shut : 'Closed today. Come back later.', 3500);
                    return;
                }
                if (Rift.Cast && Rift.Cast.isDark(id)) {
                    Rift.UI.toast(n.darkTeaser || 'Nobody is here now.', 3500);
                    if (!done) { Rift.State.update(s => Rift.World.complete(s, id)); draw(); }
                    return;
                }
                if(n.trainer&&Rift.Battles.canChallenge(id)&&!n.cardSchool&&n.type!=='battle'&&!(opts&&opts.skipTrainer)){
                    Rift.Battles.offer(id,()=>arrive(id,{skipTrainer:true}));return;
                }
                const finish = () => {
                    if (id === 'fair-finale') Rift.State.update(s => { if (Rift.World.award(s, 'rift-walker')) Rift.UI.toast('🏅 New accolade: Rift Walker'); });
                    const before = st.map.revealed.length;
                    Rift.State.update(s => Rift.World.complete(s, id));
                    if (Rift.State.get().map.revealed.length > before) { Rift.Audio.sfx('reveal'); Rift.UI.toast('The fog lifts…'); }
                    draw();
                };
                switch (n.type) {
                    case 'bonus':
                        Rift.Router.go('bonus', { nodeId: id });
                        break;
                    case 'story':
                    case 'rumour':
                    case 'rift':
                        // The card school (the Fair Gate) and nodes with `repeat: true` play their script on every
                        // visit, live; the script branches on seen:/flags. Other story nodes offer a replay.
                        const everyVisit = !!(n.cardSchool || n.repeat);
                        if (!done || n.type !== 'story' || everyVisit || await Rift.UI.confirm(n.name, 'Watch this scene again?', 'Watch', 'Not now')) {
                            if (n.fx === 'rift') await Rift.UI.riftFx();
                            if (destroyed) return;
                            await Rift.Dialogue.play(n.script, { replay: done && !everyVisit });
                        }
                        if (destroyed) return;
                        finish();
                        if(n.cardSchool){
                            if(!Rift.State.get().flags['card-lesson-won'])Rift.Battles.introduction('map');
                            else if(!Rift.State.get().flags['story-battle-won'])Rift.Battles.fairPlan().then(()=>{if(!destroyed)Rift.Battles.storyOffer();});
                            else Rift.Battles.offer(id);
                            break;
                        }
                        if (n.portal && !(opts && opts.fromPortal)) travel(n.portal);
                        break;
                    case 'rest':
                        await Rift.Dialogue.play(n.script);
                        if (destroyed) return;
                        Rift.State.update(s => { s.health = Rift.UI.maxHealth(s); });
                        Rift.Audio.sfx('heal');
                        Rift.UI.toast('Rested: health restored.');
                        // Once per lesson the narrator mentions a waiting side story. Never on the first visit:
                        // that one has its own scene (the first night, the Café), one thread per station.
                        { const aside = done && Rift.SideStories && Rift.SideStories.aside(); if (aside) await Rift.Dialogue.play(aside); }
                        if (destroyed) return;
                        finish();
                        // Campfires are where power tweaks are changed (design/AVATARS.md 1.3); the shrine comes after.
                        if (!(Rift.PowerView && Rift.PowerView.editTweaks && Rift.PowerView.editTweaks({ onClose: shrineOffer }))) shrineOffer();
                        break;
                    case 'battle':
                        await Rift.Dialogue.play(n.script);
                        if (destroyed) return;
                        Rift.Battles.offer(id);
                        break;
                    default:
                        Rift.Router.go('encounter', { nodeId: id });
                }
            }

            // Step through a rift to another painted map (the portal node's twin).
            async function travel(targetId) {
                const target = Rift.World.node(targetId);
                const ch = Rift.data.chapters[target.chapter] || {};
                if (ch.comingSoon) { Rift.UI.toast('The rift is still settling. It opens in a later lesson.', 3500); return; }
                if (!(await Rift.UI.confirm('Step through the rift?', 'It leads to ' + ((Rift.data.maps[target.map || 'main'] || {}).name || 'somewhere else') + '. You can come back the same way.', 'Step through', 'Not yet'))) return;
                await Rift.UI.riftFx();
                Rift.State.update(s => {
                    Rift.World.reveal(s, targetId);
                    s.map.at = targetId;
                    if (target.chapter && s.chapter !== target.chapter) s.chapter = target.chapter;
                });
                Rift.Router.replace('map', { arrive: !Rift.State.get().map.completed.includes(targetId), fromPortal: true });
            }

            function shrineOffer() {
                const s = Rift.State.get();
                if (!s.scars.length) return;
                Rift.UI.modal('A quiet shrine', el('p', { text: 'Solve a harder puzzle here to heal one scar.' }), [
                    { label: 'Not now' },
                    { label: 'Try it', primary: true, onclick: () => Rift.Router.go('encounter', { nodeId: s.map.at, shrine: true }) },
                ]);
            }

            function riftMenu() {
                if (destroyed || walking || pendingArrival || arriving || (input && !input.available(rootNode))) return;
                const st = Rift.State.get();
                const rows = Object.entries(Rift.data.chapters).map(([cid, ch]) => el('div.row', null, [
                    el('div', { style: { flex: 1 } }, [
                        el('strong', { text: ch.name }),
                        el('div.small.muted', { text: 'Lesson ' + ch.lesson + (ch.comingSoon ? ' · opens later' : '') + (st.chapter === cid ? ' · you are here' : '') }),
                    ]),
                    el('button.btn.small', {
                        text: 'Jump',
                        disabled: !!ch.comingSoon || !ch.start,
                        async onclick() {
                            m.close();
                            walking = true;
                            blockInput();
                            try {
                                let first = false;
                                Rift.State.update(s => { first = Rift.World.jumpToChapter(s, cid); });
                                await Rift.UI.riftFx();
                                if (destroyed) return;
                                // The chapter may be on another painted map, so rebuild the screen there.
                                const at = Rift.State.get().map.at;
                                Rift.Router.replace('map', { arrive: !Rift.State.get().map.completed.includes(at), fromPortal: true, recap: first ? cid : null });
                                if (first) Rift.UI.toast('A starter kit tumbles out of the rift: 3 Catch Charms and a Tonic!', 4000);
                            } finally { walking = false; releaseInput(); }
                        },
                    }),
                ]));
                const m = Rift.UI.modal('Time rift', el('div.stack', null, [
                    el('p', { text: 'Jump to the start of any chapter: handy if you missed a lesson or want to catch up with the class.' }),
                    el('p.small.muted', { text: 'Places you skip stay in the fog, so you can go back and explore them later. Your first jump into a chapter brings a small starter kit.' }),
                ].concat(rows)));
            }

            // ---- start ----
            const here = Rift.World.node(state.map.at);
            placeAvatar(here.x, here.y);
            draw();
            if (params && params.focus) setTimeout(() => focusNode(params.focus), 300);
            // A roaming legendary that just fled (or fled while this map was not on screen) runs to its new place.
            if (Hunts) setTimeout(() => { if (!destroyed) showDepartures(); }, 450);
            const firstOpening = params && params.arrive ? () => arrive(state.map.at, { fromPortal: params.fromPortal, recap: params.recap })
                : params && params.recap ? () => opening(params.recap, true)
                : Rift.Story && here.chapter && Rift.Story.pendingQuiet(here.chapter).length ? () => opening(here.chapter) : null;
            // Waiting cards (#148): the teaser after Lesson 1, or the invitation once both lessons are won, after
            // any opening. Each plays once (seen:<key> is set only when it ends) and grants nothing.
            const waitingIntro = async () => {
                const key = Rift.Acquisition && Rift.Acquisition.introDue(Rift.State.get());
                if (key && !destroyed && Rift.Router.current() === 'map' && Rift.Dialogue.has(key)) await Rift.Dialogue.play(key);
            };
            const autoOpening = firstOpening || (Rift.Acquisition && Rift.Acquisition.introDue(state))
                ? async () => { if (firstOpening) await firstOpening(); await waitingIntro(); } : null;
            if (autoOpening) {
                pendingArrival = true;
                blockInput();
                arrivalTimer = setTimeout(async () => {
                    arrivalTimer = null;
                    if (destroyed) return;
                    try { await autoOpening(); }
                    finally { pendingArrival = false; if (!walking && !arriving) releaseInput(); }
                }, 400);
            }

            // After a chapter boss, suggest a backup code once, when nothing else is on screen.
            const backupTimer = setInterval(() => {
                if (destroyed || walking || pendingArrival || arriving) return;
                if (!Rift.State.backupMilestone() || Rift.Backup.remind()) clearInterval(backupTimer);
            }, 1500);

            return {
                destroy() { destroyed = true; clearTimeout(arrivalTimer); clearInterval(backupTimer); releaseInput(); if (hud.destroy) hud.destroy(); },
            };
        },
    });
})(typeof window !== 'undefined' ? window : globalThis);
