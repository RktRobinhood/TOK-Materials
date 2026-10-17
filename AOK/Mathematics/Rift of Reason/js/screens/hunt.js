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

    const SCENES = { lanterns, records, keys, log, doors };

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
            const mapDef = (Rift.data.maps || {})[d.map] || {};

            const say = el('p.hunt-say', { role: 'status' });
            const pips = el('div.hunt-pips');
            const box = el('div.hunt-box');
            const leave = el('button.btn.small', { text: 'Leave', title: 'Back to the map. Your progress here is kept.', onclick: () => toMap() });
            const portrait = Rift.Assets.img('creature/' + d.species + '/idle', { colour: sp.colour, label: sp.name, className: 'hunt-portrait', alt: sp.name });
            const panel = el('div.hunt-panel.panel', { style: { '--hunt': (Rift.COLOURS[sp.colour] || {}).hex || 'var(--rift)' } }, [
                el('div.hunt-head', null, [
                    portrait,
                    el('div.hunt-title', null, [
                        el('h2', { text: sp.name + ' · ' + d.title }),
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
                fill([
                    el('ul.hunt-rules', null, [
                        el('li', { text: 'This is optional. Your story does not need it.' }),
                        el('li', { text: 'Three short rounds. Read the sign every time: it changes.' }),
                        practice ? el('li', { text: 'You already won. This is just for fun.' })
                            : el('li', { text: 'A wrong answer starts the game again and sends ' + sp.name + ' running to another place. You lose no hearts.' }),
                        !practice ? el('li', { text: 'Pass all three and ' + sp.name + ' joins you.' }) : null,
                    ].filter(Boolean)),
                    el('button.btn.primary', { text: back ? 'Go on' : 'Start', onclick: showRound }),
                ]);
            }

            function showRound() {
                chosen = null;
                drawPips();
                const r = run.rounds[round];
                pose('thinking');
                speak(d.say.rounds[round]);
                const check = el('button.btn.primary.hunt-check', { text: 'Check', disabled: true, onclick: () => submit() });
                const options = r.options.map(o => el('button.btn.hunt-option', {
                    'aria-pressed': 'false', dataset: { option: o.id },
                    onclick() {
                        if (busy) return;
                        chosen = o.id;
                        options.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.option === chosen)));
                        check.disabled = false;
                        Rift.Audio.sfx('click');
                    },
                }, [el('span', { text: o.label }), o.sub ? el('span.small.muted', { text: o.sub }) : null]));
                fill([
                    el('div.hunt-sign', { role: 'heading', 'aria-level': '3' }, [el('span.small', { text: 'Round ' + (round + 1) + ' of ' + run.rounds.length + ' · The sign says:' }), el('strong', { text: r.sign })]),
                    (SCENES[r.scene.kind] || (() => null))(r.scene),
                    el('div.hunt-options', null, options),
                    el('div.hunt-actions', null, [check]),
                ]);
            }

            function submit(force) {
                if (busy || destroyed) return;
                const answer = force || chosen;
                if (answer == null) return;
                busy = true;
                const r = run.rounds[round];
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
                    fill([el('p.hunt-result.good', { text: '✔ All three! Good practice.' }), el('button.btn.primary', { text: 'Back to the map', onclick: toMap })]);
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
                destroy() { destroyed = true; },
                // Playtest hook (AGENTS.md): submits a right answer for the round on screen.
                debugSolve() { if (run.rounds[round] && box.querySelector('.hunt-option')) submit(run.rounds[round].accept[0]); },
            };
        },
    });
})(typeof window !== 'undefined' ? window : globalThis);
