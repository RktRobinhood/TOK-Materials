/*
 * A roaming legendary's trick challenge (#111, design/ROAMING-LEGENDARIES.md). Optional, three rounds.
 * The save rules are in js/core/hunts.js, the rounds in js/core/tricks.js; this file only shows them.
 *
 * params: { id }   (a key of Rift.data.hunts; the avatar must stand where the creature waits)
 *
 * - The sign (the instruction) sits in the middle, the evidence under it, then the answers. Pick an
 *   answer, then press Check: nothing is timed and nothing submits by accident.
 * - A right answer is saved at once (Hunts.pass), so Leave keeps the progress for a later visit.
 * - A wrong answer is saved before anything is shown (Hunts.fail): the run resets and the creature's
 *   new place is fixed. The map then shows it running there. No hearts, scars or items are touched.
 * - After the claim, visits are practice: same screen, no reward, no flight.
 * Nothing loops or shakes; panels only fade in (not under Calm motion).
 */
(function (root) {
    'use strict';

    const Rift = root.Rift;
    const el = (...a) => Rift.el(...a);

    // ---- the evidence -------------------------------------------------------------------------

    const lantern = on => el('span.hunt-lamp.' + (on ? 'on' : 'off'), { text: on ? '💡 ON' : '◯ off' });

    function lanterns(scene) {
        const claim = scene.claim ? el('div.hunt-claim', null, [el('span.hunt-claim-who', { text: '🎭 The mask says:' }), ' "' + scene.claim + '"']) : null;
        return el('div.hunt-scene', null, [claim, el('div.hunt-pairs', null, scene.pairs.map(p => el('div.hunt-pair' + (p.id === scene.target ? '.target' : ''), null, [
            el('strong', { text: p.name + (p.id === scene.target ? '  ◀ this one' : '') }),
            el('div.hunt-lamps', null, [el('span.small.muted', { text: 'left' }), lantern(p.left), el('span.small.muted', { text: 'right' }), lantern(p.right)]),
        ])))]);
    }

    function records(scene) {
        const rows = scene.records.map(r => el('tr', null, [
            el('td', { text: r.name }),
            el('td', { text: r.stamped ? '✔ stamped' : '— no stamp' }),
            el('td', { text: r.arrived ? '✔ arrived' : '✖ not yet' }),
        ]));
        return el('div.hunt-scene', null, [
            scene.claim ? el('div.hunt-claim', null, [el('span.hunt-claim-who', { text: '📜 Claim:' }), ' "' + scene.claim + '"']) : null,
            el('table.hunt-table', null, [el('tr', null, ['Record', 'Stamp', 'Arrived?'].map(h => el('th', { text: h })))].concat(rows)),
        ]);
    }

    function keys(scene) {
        return el('div.hunt-scene', null, [
            el('div.hunt-claim', null, [el('span.hunt-claim-who', { text: '📏 Rule:' }), ' ' + scene.rule]),
            el('div.hunt-claim.record', null, [el('span.hunt-claim-who', { text: '📜 Test record:' }), ' ' + scene.record]),
        ]);
    }

    function log(scene) {
        return el('div.hunt-scene', null, [
            el('p.small.muted', { text: 'The machine\'s log of the last ' + scene.total + ' shapes. Its model: chance = count ÷ ' + scene.total + '.' }),
            el('table.hunt-table', null, [el('tr', null, ['Shape', 'Count', 'Chance next'].map(h => el('th', { text: h })))].concat(scene.shapes.map(s => el('tr' + (s.glow ? '.glow' : ''), null, [
                el('td', { text: s.icon + ' ' + s.name + (s.glow ? ' ✦' : '') }),
                el('td', { text: String(s.count) }),
                el('td', null, [el('span.hunt-bar', { style: { width: s.pct + '%' } }), ' ' + s.pct + '%']),
            ])))),
        ]);
    }

    function doors(scene) {
        return el('div.hunt-scene', null, [
            el('p.small.muted', { text: 'Oddsnap\'s model, from its counts:' }),
            el('div.hunt-doors', null, scene.doors.map(d => el('div.hunt-door', null, [el('div.hunt-door-icon', { text: '🚪' }), el('strong', { text: d.name }), el('div', { text: d.pct + '% safe' })]))),
        ]);
    }

    // A big shape with the wrong shape's name written on it.
    // Drawn as SVG, not a text symbol: font glyphs for ● ▲ ■ come out at very different sizes.
    const SHAPE_SVG = {
        '▲': '<polygon points="80,8 152,148 8,148"/>',
        '■': '<rect x="14" y="14" width="132" height="132" rx="4"/>',
        '●': '<circle cx="80" cy="80" r="72"/>',
    };
    function shapeword(scene) {
        const name = { '▲': 'triangle', '■': 'square', '●': 'circle' }[scene.icon] || 'shape';
        return el('div.hunt-scene.hunt-shapeword', { role: 'img', 'aria-label': 'A ' + name + ' with the word ' + scene.word + ' on it' }, [
            el('span.hunt-shape-icon', { 'aria-hidden': 'true', html: '<svg viewBox="0 0 160 160" width="160" height="160">' + (SHAPE_SVG[scene.icon] || '') + '</svg>' }),
            el('span.hunt-shape-word', { text: scene.word, 'aria-hidden': 'true' }),
        ]);
    }

    // Things to count: a row of icons, or fence posts with the gaps drawn between them.
    function icons(scene) {
        const items = Array.from({ length: scene.count }, () => el('span.hunt-icon', { text: scene.icon }));
        const row = scene.gapped
            ? items.flatMap((it, i) => (i ? [el('span.hunt-gap', { text: '──' }), it] : [it]))
            : items;
        return el('div.hunt-scene.hunt-icons' + (scene.gapped ? '.gapped' : ''), { role: 'img', 'aria-label': scene.gapped ? 'A fence of posts with gaps between them' : scene.count + ' pictures to count' }, row);
    }

    const SCENES = { lanterns, records, keys, log, doors, shapeword, icons };

    // ---- the screen ---------------------------------------------------------------------------

    Rift.Screens.register('hunt', {
        mount(rootNode, params) {
            const id = params && params.id;
            const H = Rift.Hunts;
            const st = Rift.State.get();
            const d = H && H.def(id);
            const allowed = d ? H.canAttempt(st, id, st.map.at) : { ok: false, reason: 'Nobody is here.' };
            if (!allowed.ok) { Rift.UI.toast(allowed.reason, 3500); Rift.Router.replace('map'); return null; }

            const sp = Rift.data.creatures[d.species];
            const practice = !!allowed.practice;
            const attempt = H.record(st, id).attempt;
            const run = Rift.Tricks.make(d.challenge, H.runSeed(st, id));
            let round = practice ? 0 : H.record(st, id).round;
            let chosen = null;
            let destroyed = false;
            let busy = false;
            let timer = null;      // the wait round's countdown
            let hidden = null;     // this round's hidden-in-plain-sight targets: { portrait|title: optionId }
            const mapDef = (Rift.data.maps || {})[d.map] || {};

            const say = el('p.hunt-say', { role: 'status' });
            const pips = el('div.hunt-pips');
            const box = el('div.hunt-box');
            const leave = el('button.btn.small', { text: 'Leave', title: 'Back to the map. Your progress here is kept.', onclick: () => toMap() });
            const portrait = Rift.Assets.img('creature/' + d.species + '/idle', { colour: sp.colour, label: sp.name, className: 'hunt-portrait', alt: sp.name });
            const titleText = el('h2', { text: sp.name + ' · ' + d.title });
            // The portrait and the title answer some rounds ("Click Maskip."). They only listen then.
            [[portrait, 'portrait'], [titleText, 'title']].forEach(([node, place]) => {
                const go = () => { if (hidden && hidden[place]) submit(hidden[place]); };
                node.addEventListener('click', go);
                node.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } });
            });
            const panel = el('div.hunt-panel.panel', { style: { '--hunt': (Rift.COLOURS[sp.colour] || {}).hex || 'var(--rift)' } }, [
                el('div.hunt-head', null, [
                    portrait,
                    el('div.hunt-title', null, [
                        titleText,
                        el('div.small.muted', { text: practice ? 'Practice: no prize, no running away.' : 'Optional trick challenge' }),
                    ]),
                    pips,
                ]),
                say,
                box,
                el('div.hunt-foot', null, [leave]),
            ]);
            rootNode.append(el('div.hunt-wrap', { style: { backgroundImage: 'url("' + Rift.Assets.src(mapDef.scene || 'scene/map', { label: mapDef.name || '' }) + '")' } }, [panel]));

            function toMap() { if (!destroyed) Rift.Router.replace('map'); }
            function speak(text) { say.textContent = text ? sp.name + ': "' + text + '"' : ''; }
            // The creature's whole-body pose for this moment (taunt, thinking, happy, shocked, recruited);
            // the idle portrait until that pose's art exists. A still image: no animation.
            function pose(name) {
                const want = 'creature/' + d.species + '/' + name;
                const use = Rift.Assets.has(want) ? want : 'creature/' + d.species + '/idle';
                portrait.src = Rift.Assets.src(use, { colour: sp.colour, label: sp.name });
                portrait.dataset.pose = name;
            }
            function drawPips() {
                pips.replaceChildren(...run.rounds.map((r, i) => el('span.hunt-pip' + (i < round ? '.done' : i === round ? '.now' : ''))));
                pips.setAttribute('aria-label', 'Round ' + Math.min(round + 1, run.rounds.length) + ' of ' + run.rounds.length);
            }
            function fill(nodes) { box.replaceChildren(...nodes.filter(Boolean)); const b = box.querySelector('button'); if (b && b.focus) b.focus(); }

            function intro() {
                drawPips();
                const back = !practice && round > 0;
                pose('taunt');
                speak(practice ? d.say.practice : back ? 'Back again? We were at round ' + (round + 1) + '. Read my sign!' : d.say.intro);
                const n = run.rounds.length;
                fill([
                    el('ul.hunt-rules', null, [
                        el('li', { text: 'This is optional. Your story does not need it. It is meant to be hard.' }),
                        el('li', { text: n + ' rounds of tricks. Read the sign every time: it changes, and it means exactly what it says.' }),
                        el('li', { text: 'Some rounds answer on your first click. Some race a clock. Some want you to wait. Look at the whole screen.' }),
                        practice ? el('li', { text: 'You already won. This is just for fun.' })
                            : el('li', { text: 'One wrong answer starts the game again and sends ' + sp.name + ' running to another place. You lose no hearts.' }),
                        !practice ? el('li', { text: 'Pass all ' + n + ' and ' + sp.name + ' joins you.' }) : null,
                    ].filter(Boolean)),
                    el('button.btn.primary', { text: back ? 'Go on' : 'Start', onclick: showRound }),
                ]);
            }

            function stopRound() {
                if (timer) clearInterval(timer);
                timer = null;
                hidden = null;
                [portrait, titleText].forEach(node => { node.removeAttribute('tabindex'); node.removeAttribute('role'); node.classList.remove('hunt-target'); });
            }

            // The sign; a 'sign' option turns its word into a button inside the sentence.
            function signNode(r, link) {
                let text = el('strong', { text: r.sign });
                if (link) {
                    const at = r.sign.lastIndexOf(r.signLink);
                    text = el('strong', null, [r.sign.slice(0, at), link, r.sign.slice(at + r.signLink.length)]);
                }
                return el('div.hunt-sign', { role: 'heading', 'aria-level': '3' }, [el('span.small', { text: 'Round ' + (round + 1) + ' of ' + run.rounds.length + ' · The sign says:' }), text]);
            }

            const HINTS = {
                tap: 'One click answers. There is no Check button.',
                sequence: 'Every press counts. A wrong press ends the run.',
            };

            function showRound() {
                stopRound();
                chosen = null;
                drawPips();
                const r = run.rounds[round];
                pose('thinking');
                speak(d.say.rounds[round % d.say.rounds.length]);
                const check = el('button.btn.primary.hunt-check', { text: 'Check', disabled: r.mode !== 'number', onclick: () => submit() });
                const pressed = [];
                const pressedLine = el('p.small.muted.hunt-pressed', { role: 'status' });
                const label = o => [el('span', { text: o.label }), o.sub ? el('span.small.muted', { text: o.sub }) : null];
                const button = (o, onclick, extra) => el('button.btn.hunt-option' + (o.size ? '.size-' + o.size : '') + (o.flip ? '.flipped' : ''), Object.assign({
                    dataset: { option: o.id }, onclick,
                    'aria-label': o.label === '' ? 'A button with no words' : null,
                }, extra || {}), label(o));

                hidden = {};
                let link = null;
                r.options.filter(o => o.place).forEach(o => {
                    if (o.place === 'sign') link = el('button.hunt-sign-link', { text: r.signLink, onclick: () => submit(o.id) });
                    else {
                        hidden[o.place] = o.id;
                        const node = o.place === 'portrait' ? portrait : titleText;
                        node.setAttribute('tabindex', '0');
                        node.setAttribute('role', 'button');
                        node.classList.add('hunt-target');
                    }
                });
                const plain = r.options.filter(o => !o.place);

                let options = [];
                let input = null;
                if (r.mode === 'pick' || r.mode === 'multi') {
                    const picked = new Set();
                    options = plain.map(o => button(o, () => {
                        if (busy) return;
                        if (r.mode === 'pick') picked.clear();
                        if (picked.has(o.id)) picked.delete(o.id); else picked.add(o.id);
                        options.forEach(b => b.setAttribute('aria-pressed', String(picked.has(b.dataset.option))));
                        chosen = r.mode === 'pick' ? [...picked][0] : [...picked];
                        check.disabled = !picked.size;
                        Rift.Audio.sfx('click');
                    }, { 'aria-pressed': 'false' }));
                } else if (r.mode === 'tap') {
                    options = plain.map(o => button(o, () => submit(o.id)));
                } else if (r.mode === 'sequence') {
                    options = plain.map(o => button(o, () => {
                        if (busy) return;
                        pressed.push(o.id);
                        Rift.Audio.sfx('click');
                        pressedLine.textContent = 'Pressed: ' + pressed.map(x => (plain.find(p => p.id === x) || {}).label).join(', ');
                        if (!Rift.Tricks.onTrack(r, pressed) || pressed.length === r.accept[0].length) submit(pressed.slice());
                    }));
                } else if (r.mode === 'wait') {
                    options = plain.map(o => button(o, () => submit(o.id)));
                } else if (r.mode === 'number') {
                    input = el('input.hunt-number', { type: 'text', inputmode: 'numeric', autocomplete: 'off', 'aria-label': 'Your answer',
                        oninput() { chosen = input.value; check.disabled = !input.value.trim(); },
                        // preventDefault: the same Enter must not also press the button that takes focus next.
                        onkeydown(e) { if (e.key === 'Enter') { e.preventDefault(); if (input.value.trim()) submit(); } } });
                    check.disabled = true;
                }

                fill([
                    signNode(r, link),
                    r.scene ? (SCENES[r.scene.kind] || (() => null))(r.scene) : null,
                    HINTS[r.mode] ? el('p.small.muted', { text: HINTS[r.mode] }) : null,
                    options.length ? el('div.hunt-options' + (r.mode === 'tap' || r.mode === 'sequence' || r.mode === 'wait' ? '.loose' : ''), null, options) : null,
                    input,
                    pressedLine,
                    r.mode === 'pick' || r.mode === 'multi' || r.mode === 'number' ? el('div.hunt-actions', null, [check]) : null,
                ]);
                // The clock of a wait round (it passes at zero) or a quick round (it fails at zero). A number that
                // counts down once a second: nothing moves, so Calm motion needs nothing different.
                if (r.seconds) {
                    let left = r.seconds;
                    const clock = el('p.hunt-clock', { role: 'timer', text: '⏳ ' + left });
                    box.insertBefore(clock, box.children[1] || null);
                    timer = setInterval(() => {
                        if (destroyed) return stopRound();
                        left -= 1;
                        clock.textContent = '⏳ ' + Math.max(0, left);
                        if (left <= 0) submit(r.mode === 'wait' ? Rift.Tricks.WAITED : Rift.Tricks.TIMEOUT);
                    }, 1000);
                }
                // A wait round must not start on a focused button (Enter would press it).
                if (r.mode === 'wait' && document.activeElement && document.activeElement.blur) document.activeElement.blur();
                if (input) input.focus();
            }

            function submit(force) {
                if (busy || destroyed) return;
                const answer = force != null ? force : chosen;
                if (answer == null) return;
                busy = true;
                const r = run.rounds[round];
                stopRound();
                const res = Rift.Tricks.check(r, answer);
                try {
                    if (res.ok) right(); else wrong(res.why);
                } finally { busy = false; }
            }

            function right() {
                Rift.Audio.sfx('success');
                if (!practice) Rift.State.update(s => { H.pass(s, id, attempt, round); });
                round += 1;
                drawPips();
                pose('happy');
                if (round < run.rounds.length) {
                    fill([el('p.hunt-result.good', { text: '✔ Correct!' }), el('button.btn.primary', { text: 'Next round', onclick: showRound })]);
                    return;
                }
                if (practice) {
                    Rift.State.update(s => { H.practiced(s, id); });
                    speak(d.say.win);
                    fill([el('p.hunt-result.good', { text: '✔ All ' + run.rounds.length + '! Good practice.' }), el('button.btn.primary', { text: 'Back to the map', onclick: toMap })]);
                    return;
                }
                let receipt = null;
                Rift.State.update(s => { receipt = H.claim(s, id, attempt); });
                const inst = receipt && Rift.State.get().creatures.find(c => c.uid === receipt.uid);
                pose('recruited');
                speak(d.say.win);
                leave.style.display = 'none';   // the panel's own button says the same
                fill([
                    el('p.hunt-result.good', { text: '★ ' + sp.name + ' joined you!' }),
                    Rift.UI.framedCard(d.species, { big: true, inst }),
                    el('p.small', { text: d.tok }),
                    el('button.btn.primary', { text: 'Back to the map', onclick: toMap }),
                ]);
            }

            function wrong(why) {
                Rift.Audio.sfx('error');
                pose('shocked');
                if (practice) {
                    round = 0;
                    drawPips();
                    speak(d.say.wrong);
                    fill([
                        el('p.hunt-result.bad', { text: 'Not quite.' }), el('p', { text: why }),
                        el('div.hunt-actions', null, [el('button.btn', { text: 'Back to the map', onclick: toMap }), el('button.btn.primary', { text: 'Try again', onclick: showRound })]),
                    ]);
                    return;
                }
                // Saved before anything is shown: a reload now can neither retry here nor reroll the place.
                let out = null;
                Rift.State.update(s => { out = H.fail(s, id, attempt, s.map.at); });
                round = 0;
                drawPips();
                speak(d.say.wrong);
                const where = out && out.tier === 'hide'
                    ? sp.name + ' hides here. Walk to another place, then come back.'
                    : sp.name + ' runs off to ' + H.placeName(out ? out.to : H.record(Rift.State.get(), id).node) + '. Walk there to try again from round 1.';
                leave.style.display = 'none';   // the panel's own button says the same
                fill([
                    el('p.hunt-result.bad', { text: 'Not quite.' }),
                    el('p', { text: why }),
                    el('p.hunt-where', { text: where }),
                    el('button.btn.primary', { text: 'Back to the map', onclick: toMap }),
                ]);
            }

            intro();

            return {
                destroy() { destroyed = true; stopRound(); },
                // Playtest hook (AGENTS.md): submits a right answer for the round on screen.
                debugSolve() { if (run.rounds[round] && box.querySelector('.hunt-sign')) submit(Rift.Tricks.solution(run.rounds[round])); },
            };
        },
    });
})(typeof window !== 'undefined' ? window : globalThis);
