/*
 * The deck workshop (#115; design/drafts/card-arena-2026-10-12/CARD-DRAFTS.md, "Deck-building tutorial").
 * A short, optional, replayable lesson on the construction rules (Rift.State.validateDeck, #112) with a
 * COPY of the player's avatar-type starter deck (data/starters.js, #114):
 *
 *   1 the starter: its plan and both powers of the avatar type (one per look)
 *   2 20 personal cards and 10 Axiom cards (a short check question)
 *   3 repair a third copy of a creature
 *   4 repair an over-quota colour tactic (generic tactics have no quota)
 *   5 cast a colour tactic with no creature of its colour on the table (the real battle engine)
 *   6 done
 *
 * The workshop never changes the saved deck. It writes only two save flags: 'deck-workshop-seen' (offered,
 * skipped or opened) and 'deck-workshop-done' (reached the last step). Leaving at any step loses nothing.
 *
 *   Rift.DeckWorkshop.open({ onDone?, onClose?, start? })  the workshop (a modal); start: a battle to
 *                    continue to from the last step (the launch offer)
 *   Rift.DeckWorkshop.offer(start) → true when it asked; Rift.Battles calls it before a battle with the
 *                    player's own deck. "Not now" (or ✕/Escape) runs start at once and never asks again.
 *   Rift.DeckWorkshop.shouldOffer(save) → true before the first own-deck battle (starter owned, not seen)
 *   Pure parts, for the tests: plan(save), scenario(kind, plan), change(task, kind, id, delta),
 *   demo(plan), cast(demo).
 */
(function (root) {
    'use strict';
    const Rift = root.Rift;
    const el = (...a) => Rift.el(...a);

    const SEEN = 'deck-workshop-seen', DONE = 'deck-workshop-done';
    const colourName = c => ((Rift.COLOURS || {})[c] || { name: c }).name;
    const aColour = c => (/^[aeiou]/i.test(colourName(c)) ? 'an ' : 'a ') + colourName(c);
    const creatureDef = id => ((Rift.data || {}).creatures || {})[id] || { name: id };
    const tacticDef = id => ((Rift.data || {}).tactics || {})[id] || { name: id };
    const plural = (n, word) => n + ' ' + word + (n === 1 ? '' : 's');
    const count = (list, id) => list.filter(x => x === id).length;
    const unique = list => Array.from(new Set(list));
    const colourOfCreature = id => { const c = creatureDef(id); return (!c.generic && c.colour) || null; };

    // ---- the starter -------------------------------------------------------------------------------------
    // The starter deck the workshop copies (the receipt's type, else the avatar's), its plan, and both
    // powers of the type (data/avatars.js powers: { boy, girl }), the player's own one marked.
    function plan(save) {
        const s = save || (Rift.State && Rift.State.get()) || {};
        const type = (s.starter && s.starter.type) || (s.avatar && s.avatar.type);
        const deck = type && Rift.State.starterDeck(type);
        if (!deck) return null;
        const avatar = ((Rift.data.avatars || {})[type]) || { name: type, powers: {} };
        const def = (((Rift.data.starterDecks || {}).decks) || {})[type] || {};
        const variant = s.avatar && s.avatar.type === type ? s.avatar.variant : null;
        const powers = ['boy', 'girl'].filter(v => avatar.powers && avatar.powers[v]).map(v => {
            const id = avatar.powers[v];
            const mine = v === variant;
            const base = (Rift.data.powers || {})[id] || { name: id, text: '', cost: 0 };
            const x = Rift.PowerView && Rift.PowerView.numbers ? Rift.PowerView.numbers(id, mine ? (s.avatar.tweaks || []) : []) : null;
            return { variant: v, id, mine, name: (x || base).name, text: (x || base).text, cost: x ? x.cost : base.cost, heartCost: x ? x.heartCost : 0 };
        });
        powers.sort((a, b) => (b.mine ? 1 : 0) - (a.mine ? 1 : 0));
        return { type, name: avatar.name, colour: avatar.colour, strategy: deck.strategy, plan: def.plan || '', powers, deck };
    }

    // ---- the two repair tasks ----------------------------------------------------------------------------
    // A task: { kind, creatures: [species], tactics: [ids], rows: { creatures: [species], tactics: [ids] },
    //   focus: species with three copies ('copies') | the over-quota colour ('quota') }.
    function scenario(kind, p) {
        const deck = p.deck;
        if (kind === 'copies') {
            // A third copy of the first creature of the avatar's colour.
            const extra = deck.creatures.find(id => colourOfCreature(id) === p.colour) || deck.creatures[0];
            const creatures = deck.creatures.slice();
            creatures.splice(creatures.lastIndexOf(extra) + 1, 0, extra);
            return { kind, creatures, tactics: deck.tactics.slice(), focus: extra,
                rows: { creatures: unique(creatures), tactics: unique(deck.tactics) } };
        }
        // 'quota': the first other colour with exactly two creatures gets three tactics of its colour.
        const colours = unique(deck.creatures.map(colourOfCreature).filter(c => c && c !== p.colour));
        const byColour = ((Rift.data.tacticDecks || {}).colour) || {};
        const focus = colours.find(c => deck.creatures.filter(id => colourOfCreature(id) === c).length === 2 && (byColour[c] || []).length >= 2) || colours[0];
        const pair = byColour[focus] || [];
        const own = deck.tactics.filter(id => tacticDef(id).colour);
        const generic = unique(deck.tactics.filter(id => !tacticDef(id).colour));
        // Keep the colour tactics, one copy of the first generic tactic, and three of the other colour.
        const tactics = own.concat(generic.slice(0, 1), [pair[0], pair[0], pair[1]]);
        // One more creature of that colour the learner could add (another species: two copies is the limit).
        const spare = Object.keys(Rift.data.creatures).filter(id => {
            const c = Rift.data.creatures[id];
            return colourOfCreature(id) === focus && c.rarity === 'common' && !deck.creatures.includes(id);
        }).sort((a, b) => (creatureDef(a).cost - creatureDef(b).cost) || (a < b ? -1 : 1))[0];
        return { kind, creatures: deck.creatures.slice(), tactics, focus,
            rows: { creatures: unique(deck.creatures.concat(spare ? [spare] : [])), tactics: unique(own.concat(generic, pair.slice(0, 2))) } };
    }

    const check = task => Rift.State.validateDeck({ creatures: task.creatures, tactics: task.tactics });

    // Why this card cannot be added now (the Collection builder's reasons), or null.
    function addBlock(task, kind, id) {
        const R = Rift.State.DECK_RULES;
        const list = kind === 'creature' ? task.creatures : task.tactics;
        const name = (kind === 'creature' ? creatureDef(id) : tacticDef(id)).name;
        if (count(list, id) >= R.copies) return 'At most ' + R.copies + ' copies of ' + name + '.';
        const colour = kind === 'tactic' && tacticDef(id).colour;
        if (colour) {
            const q = check(task).quota[colour] || { creatures: 0, tactics: 0 };
            if (q.tactics >= q.creatures) {
                const C = colourName(colour);
                return plural(q.creatures, C + ' creature') + ' allow' + (q.creatures === 1 ? 's ' : ' ') + plural(q.creatures, C + ' tactic')
                    + '. Add ' + aColour(colour) + ' creature first, or remove another ' + C + ' tactic.';
            }
        }
        return null;
    }

    // One change by the learner: kind 'creature' | 'tactic', delta +1 | -1.
    // → { ok, task (the new task, or the same one when refused), text (the reason or a hint), mistake, done }
    function change(task, kind, id, delta) {
        const name = (kind === 'creature' ? creatureDef(id) : tacticDef(id)).name;
        const key = kind === 'creature' ? 'creatures' : 'tactics';
        const before = check(task);
        if (task.kind === 'copies') {
            // One right move: remove a copy of the creature that has three.
            const right = kind === 'creature' && id === task.focus && delta < 0 && count(task.creatures, id) > Rift.State.DECK_RULES.copies;
            if (!right) {
                const F = creatureDef(task.focus).name;
                return { ok: false, task, mistake: true, done: false,
                    text: delta > 0 ? 'Adding a card makes the deck bigger. It already has ' + before.counts.total + ' cards. Remove one ' + F + ' instead.'
                        : 'Not that card: ' + name + ' is fine. Find the card with 3 copies: ' + F + '.' };
            }
        }
        if (delta > 0) {
            const why = addBlock(task, kind, id);
            if (why) return { ok: false, task, text: why, mistake: true, done: false };
        } else if (!count(task[key], id)) return { ok: false, task, text: 'There is no ' + name + ' in this deck.', mistake: true, done: false };
        const next = Object.assign({}, task, { [key]: task[key].slice() });
        if (delta > 0) next[key].splice(next[key].lastIndexOf(id) + 1 || next[key].length, 0, id);
        else next[key].splice(next[key].lastIndexOf(id), 1);
        const r = check(next);
        if (r.valid) return { ok: true, task: next, text: '', mistake: false, done: true };
        // The over-quota colour is still over: say so when this change was not about that colour.
        let text = r.problems[0].text, mistake = false;
        if (task.kind === 'quota') {
            const q = r.quota[task.focus] || { creatures: 0, tactics: 0 };
            const about = kind === 'creature' ? colourOfCreature(id) === task.focus : tacticDef(id).colour === task.focus || (!tacticDef(id).colour && delta > 0);
            if (q.tactics > q.creatures && !about) {
                mistake = true;
                text = 'That card is not the problem. ' + colourName(task.focus) + ' still has ' + plural(q.tactics, 'tactic') + ' for ' + plural(q.creatures, 'creature') + '.';
            }
        }
        return { ok: true, task: next, text, mistake, done: false };
    }

    // ---- the casting demonstration (the real battle engine) ---------------------------------------------
    // A tiny match: you play a starter creature of ANOTHER colour, the opponent plays one creature, then
    // your turn starts with a colour tactic of the avatar's colour in your hand. Every step is a legal
    // engine action. → { state, cid, action, tactic, colour, mine, foe, before } or null.
    const FOES = ['beansprout', 'pocket-tortoise', 'kardashiant', 'lens-lizard', 'footnote-finch'];
    const FILL = ['counterexample', 'second-wind', 'clockwork', 'pep-talk'];
    function demo(p) {
        const E = Rift.Battle && Rift.Battle.Engine;
        if (!E || !p) return null;
        const own = unique(p.deck.tactics.filter(id => tacticDef(id).colour));
        // No target first, then a friendly one, then an enemy one: the clearest demonstration.
        const rank = id => { const t = tacticDef(id).target || ''; return !t ? 0 : /^friendly/.test(t) ? 1 : 2; };
        const ordered = own.slice().sort((a, b) => rank(a) - rank(b));
        for (const tactic of ordered) {
            const colour = tacticDef(tactic).colour;
            const mine = unique(p.deck.creatures).filter(id => creatureDef(id).colour !== colour && creatureDef(id).cost <= 2)
                .sort((a, b) => creatureDef(a).cost - creatureDef(b).cost)[0];
            const foe = FOES.find(id => id !== mine && creatureDef(id).colour && creatureDef(id).colour !== colour && creatureDef(id).cost <= 2);
            if (!mine || !foe) continue;
            const made = playOut(E, tactic, mine, foe);
            if (made) return Object.assign(made, { tactic, colour, mine, foe });
        }
        return null;
    }
    function playOut(E, tactic, mine, foe) {
        const inst = (species, uid) => ({ uid, species, powerDelta: 0, injuries: [], scars: [], warped: null, trophyOf: null, loaner: true });
        const fill = FILL.filter(id => id !== tactic);
        let s = E.createBattle({
            seed: 'deck-workshop',
            players: [
                { name: 'You', team: [inst(mine, 'workshop-you')], tactics: [tactic].concat(fill), consumables: { 'extra-energy': 1 } },
                { name: 'Practice partner', team: [inst(foe, 'workshop-foe')], tactics: fill.slice(), consumables: { 'extra-energy': 1 } },
            ],
            axiomDeck: [],
            options: { mode: 'practice', first: 0, shuffle: false, shuffleAxioms: false, timeline: false, spark: false,
                openHand: [2, 1], openAxioms: 0, deckSize: 1 + 1 + fill.length, minCreatures: 1 },
        });
        const act = a => { s = E.applyAction(s, Object.assign({ player: E.decider(s) }, a)); };
        const drawFirst = () => { if (s.phase === 'draw') act({ type: 'draw', choice: E.legalActions(s).some(a => a.choice === 'deck') ? 'deck' : E.legalActions(s)[0].choice }); };
        const playCreature = cid => { const a = E.legalActions(s).find(x => x.type === 'play' && x.cid === cid); if (!a) return false; act(a); return true; };
        try {
            drawFirst();
            if (!playCreature('p0c0')) return null;
            act({ type: 'end' });
            drawFirst();
            if (!playCreature('p1c0')) return null;
            act({ type: 'end' });
            drawFirst();
        } catch (e) { return null; }
        if (E.winner(s) != null || s.phase !== 'main' || s.active !== 0) return null;
        const cid = 'p0t0';
        const plays = E.legalActions(s).filter(a => a.type === 'play' && a.cid === cid);
        // A friendly tactic on your own creature; an enemy one on the opponent's creature.
        const action = plays.find(a => a.target === 'p0c0') || plays.find(a => a.target === 'p1c0') || plays.find(a => !a.target) || null;
        if (!action) return null;
        return { state: s, cid, action, before: E.colourInPlay(s, 0, tacticDef(tactic).colour) || E.colourInPlay(s, 1, tacticDef(tactic).colour) };
    }
    // Casts the demonstration's tactic. → { state, events: [text], ok }
    function cast(d) {
        const E = Rift.Battle.Engine;
        const s = E.applyAction(d.state, d.action);
        const events = (s.lastEvents || []).filter(ev => ev.text && (ev.privateTo == null || ev.privateTo === 0)).map(ev => ev.text);
        return { state: s, events, ok: s.players[0].discard.includes(d.cid) && !s.players[0].hand.includes(d.cid) };
    }

    // ---- flags and the offer ---------------------------------------------------------------------------
    const flags = () => ((Rift.State.get() || {}).flags) || {};
    function mark(key) { if (!flags()[key]) Rift.State.setFlag(key, true); }
    function shouldOffer(save) {
        const s = save || Rift.State.get();
        return !!(s && s.starter && s.avatar && !(s.flags || {})[SEEN] && !(s.flags || {})[DONE] && plan(s));
    }
    // Before the first battle with the player's own deck. → true when it asked (start runs later).
    function offer(start) {
        if (!shouldOffer()) return false;
        const p = plan();
        Rift.UI.modal('Deck workshop', el('div.stack', null, [
            el('p', { text: 'Before your first match with your own deck: a short workshop on how decks are built. It uses your ' + p.name + ' starter deck.' }),
            el('p.small', { text: 'It is optional. It uses a copy, so your saved deck does not change. You can replay it in Collection.' }),
        ]), [
            { label: 'Not now', onclick() { mark(SEEN); if (start) start(); } },
            { label: 'Start the workshop', primary: true, onclick() { open({ start }); } },
        ]);
        return true;
    }

    // ---- the workshop on screen ------------------------------------------------------------------------
    const STEPS = ['starter', 'size', 'copies', 'quota', 'cast', 'done'];
    function open(opts) {
        const o = opts || {};
        const p = plan();
        if (!p) { Rift.UI.toast('The deck workshop needs your starter deck first.', 3500); return null; }
        mark(SEEN);
        const ui = { step: 0, solved: {}, task: null, note: '', mistake: false, cast: null, demo: null, answer: null };
        const body = el('div.stack.deck-editor.workshop');
        let dialog = null;
        const footer = [{ label: 'Close workshop', onclick: () => { if (o.onClose) o.onClose(); } }];
        dialog = Rift.UI.modal('Deck workshop', body, footer);
        const box = dialog.node && dialog.node.querySelector ? dialog.node.querySelector('.modal') : null;
        if (box) box.classList.add('deck-modal');

        const go = i => {
            ui.step = Math.max(0, Math.min(STEPS.length - 1, i));
            ui.note = ''; ui.mistake = false;
            const kind = STEPS[ui.step];
            if ((kind === 'copies' || kind === 'quota') && !ui.solved[kind]) ui.task = scenario(kind, p);
            if (kind === 'cast' && !ui.demo) ui.demo = demo(p);
            if (kind === 'done') { mark(DONE); if (o.onDone) o.onDone(); }
            render(true);
        };
        const ready = () => {
            const kind = STEPS[ui.step];
            if (kind === 'size') return ui.answer === 'right';
            if (kind === 'copies' || kind === 'quota') return !!ui.solved[kind];
            if (kind === 'cast') return !!ui.cast || !ui.demo;
            return true;
        };

        function powerRow(x) {
            const cost = x.heartCost ? plural(x.heartCost, 'heart') : x.cost ? x.cost + ' energy' : 'free';
            return el('div.panel.perk.power-panel.workshop-power' + (x.mine ? '.mine' : ''), { dataset: { power: x.id } }, [
                el('div.power-panel-icon', {}, [Rift.PowerView ? Rift.PowerView.icon(x.id) : el('span', { text: '✷' })]),
                el('div.power-panel-words', {}, [
                    el('div.small.muted', { text: x.mine ? 'Your power' : 'The other ' + p.name + ' look' }),
                    el('strong', { text: x.name + ' · ' + cost }),
                    el('div', { text: x.text }),
                ]),
            ]);
        }

        function rows(task) {
            const R = Rift.State.DECK_RULES;
            const r = check(task);
            const row = (kind, id) => {
                const def = kind === 'creature' ? creatureDef(id) : tacticDef(id);
                const list = kind === 'creature' ? task.creatures : task.tactics;
                const n = count(list, id);
                const colour = kind === 'creature' ? colourOfCreature(id) : def.colour;
                const over = kind === 'creature' ? n > R.copies : n > R.copies || (colour && (r.quota[colour] || {}).tactics > (r.quota[colour] || {}).creatures);
                const press = delta => () => {
                    const res = change(ui.task, kind, id, delta);
                    ui.task = res.task;
                    ui.note = res.text;
                    ui.mistake = res.mistake;
                    if (res.done) ui.solved[task.kind] = true;
                    render(false, (delta > 0 ? 'Add one ' : 'Remove one ') + def.name);
                };
                return el('div.deck-option.workshop-row' + (over ? '.over' : ''), { dataset: colour ? { colour } : {} }, [
                    el('span', { style: { flex: 1 } }, [
                        el('strong', { text: def.name }), ' ',
                        colour ? el('span.chip', { dataset: { colour }, text: (Rift.COLOURS[colour] || {}).icon + ' ' + colourName(colour) }) : el('span.chip', { text: kind === 'creature' ? 'no colour' : 'generic: no quota' }),
                    ]),
                    el('span.stepper', { role: 'group', 'aria-label': def.name + ' copies' }, [
                        el('button.btn.small', { type: 'button', text: '−', 'aria-label': 'Remove one ' + def.name, disabled: ui.solved[task.kind] || !n, onclick: press(-1) }),
                        el('span.stepper-count' + (n > R.copies ? '.need-line' : ''), { text: '×' + n + '/' + R.copies }),
                        el('button.btn.small', { type: 'button', text: '+', 'aria-label': 'Add one ' + def.name, disabled: !!ui.solved[task.kind], onclick: press(1) }),
                    ]),
                ]);
            };
            const colours = Object.keys(r.quota);
            return [
                el('p.deck-status' + (r.valid ? '' : '.bad'), { role: 'status', text: r.head + (r.valid ? ' Ready.' : '') }),
                r.valid ? null : el('ul.deck-problems', null, r.problems.map(x => el('li', { text: x.text }))),
                el('div.deck-quota.small', { text: 'Colour quotas (tactics/creatures): ' + colours.map(c => colourName(c) + ' ' + r.quota[c].tactics + '/' + r.quota[c].creatures).join(' · ') + '.' }),
                el('p.small.deck-reject' + (ui.mistake ? '.mistake' : ''), { role: 'alert', text: ui.note }),
                el('div.deck-scroll.stack', null, [
                    el('h3', { text: 'Creatures' }),
                    el('div.deck-builder', null, task.rows.creatures.map(id => row('creature', id))),
                    el('h3', { text: 'Tactic cards' }),
                    el('div.deck-builder', null, task.rows.tactics.map(id => row('tactic', id))),
                ]),
            ];
        }

        function content() {
            const kind = STEPS[ui.step];
            const R = Rift.State.DECK_RULES;
            if (kind === 'starter') return [
                el('p', { text: 'This is your ' + p.name + ' starter deck. Its plan: ' + p.strategy + '.' }),
                p.plan ? el('p', { text: p.plan }) : null,
                el('p.small', { text: p.name + ' heroes have one of two powers. Your look decides which one you use.' }),
                el('div.stack', null, p.powers.map(powerRow)),
                el('p.small.muted', { text: 'This workshop uses a copy of your deck. Your saved deck does not change.' }),
            ];
            if (kind === 'size') {
                const r = Rift.State.validateDeck({ creatures: p.deck.creatures, tactics: p.deck.tactics, axioms: p.deck.axioms });
                const choices = [['20 + 10', 'right'], ['10 + 20', 'wrong'], ['12 + 8', 'wrong']];
                return [
                    el('p', { text: 'Your own deck has ' + R.size + ' cards: ' + r.counts.creatures + ' creatures and ' + r.counts.tactics + ' tactics.' }),
                    el('p', { text: 'You also bring ' + R.axioms + ' Axiom cards (rule cards). They are shuffled with the opponent\'s ' + R.axioms + '.' }),
                    el('p', { text: 'Take at most ' + R.copies + ' copies of a creature or a tactic, and at most ' + R.axiomCopies + ' copies of an Axiom.' }),
                    el('p', null, [el('strong', { text: 'Check: how many own cards, and how many Axiom cards?' })]),
                    el('div.row.wrap', { role: 'group', 'aria-label': 'Choose an answer' }, choices.map(([label, value]) => el('button.btn' + (ui.answer === 'right' && value === 'right' ? '.primary' : ''), {
                        type: 'button', text: label, dataset: { answer: label },
                        onclick() {
                            if (ui.answer === 'right') return;
                            ui.answer = value;
                            ui.mistake = value !== 'right';
                            ui.note = value === 'right' ? 'Right: ' + R.size + ' own cards and ' + R.axioms + ' Axiom cards.' : 'Not quite. Count again: ' + r.counts.creatures + ' creatures + ' + r.counts.tactics + ' tactics = ' + R.size + '. Axiom cards: ' + R.axioms + '. Try again.';
                            render(false, label);
                        },
                    }))),
                    el('p.small.deck-reject' + (ui.mistake ? '.mistake' : ''), { role: 'alert', text: ui.note }),
                ];
            }
            if (kind === 'copies') {
                const F = creatureDef(ui.task.focus).name;
                return [
                    el('p', { text: 'Oops! This copy of your deck has 3 copies of ' + F + '. A deck may hold only ' + R.copies + ' copies of a card. Remove one ' + F + '.' }),
                    ui.solved.copies ? el('p.workshop-ok', { role: 'status', text: 'Fixed: ' + R.copies + ' copies of each card, ' + R.size + ' cards.' }) : null,
                ].concat(rows(ui.task));
            }
            if (kind === 'quota') {
                const C = colourName(ui.task.focus);
                const start = scenario('quota', p);
                const q = check(start).quota[ui.task.focus] || { creatures: 0, tactics: 0 };
                const spare = start.rows.creatures.some(id => !p.deck.creatures.includes(id));
                return [
                    el('p', { text: 'Colour tactics have a quota. For each colour, take no more colour tactics than creatures of that colour. Count the copies.' }),
                    el('p', { text: 'This copy has ' + plural(q.creatures, C + ' creature') + ' but ' + plural(q.tactics, C + ' tactic') + '. Fix it: swap one ' + C + ' tactic for a generic tactic.' + (spare ? ' Or add another ' + C + ' creature and remove a different card.' : '') }),
                    el('p.small', { text: 'Generic tactics have no colour, so they need no creature. They always fit.' }),
                    ui.solved.quota ? el('p.workshop-ok', { role: 'status', text: 'Fixed: every colour fits its quota. ' + R.size + ' cards.' }) : null,
                ].concat(rows(ui.task));
            }
            if (kind === 'cast') {
                const d = ui.demo;
                if (!d) return [el('p', { text: 'In a battle, a colour tactic does not need a creature of its colour on the table. The quota already checked your deck.' })];
                const T = tacticDef(d.tactic).name, C = colourName(d.colour);
                const where = d.action.target === 'p0c0' ? ' on your ' + creatureDef(d.mine).name : d.action.target === 'p1c0' ? ' on the enemy ' + creatureDef(d.foe).name : '';
                return [
                    el('p', { text: 'In a battle, a colour tactic does not need a creature of its colour on the table. The quota already checked your deck.' }),
                    el('div.panel.workshop-table', null, [
                        el('div', { text: 'Your side: ' + creatureDef(d.mine).name + ' (' + colourName(creatureDef(d.mine).colour) + ').' }),
                        el('div', { text: 'Enemy side: ' + creatureDef(d.foe).name + ' (' + colourName(creatureDef(d.foe).colour) + ').' }),
                        el('div', null, [el('strong', { text: C + ' creatures on the table: ' + (d.before ? 'yes' : '0') + '.' })]),
                        el('div', { text: 'In your hand: ' + T + ' (' + C + ' tactic): ' + tacticDef(d.tactic).text }),
                    ]),
                    ui.cast ? null : el('button.btn.primary.workshop-cast', { type: 'button', text: 'Cast ' + T + where, onclick() {
                        ui.cast = cast(d);
                        render(false);
                    } }),
                    ui.cast ? el('div.workshop-ok', { role: 'status' }, [
                        el('p', { text: (ui.cast.ok ? 'It worked! ' : '') + ui.cast.events.join(' ') }),
                        el('p', { text: 'No ' + C + ' creature was needed.' }),
                    ]) : null,
                ];
            }
            // done
            return [
                el('p', { text: 'Well done! You know the deck rules:' }),
                el('ul', null, [
                    R.size + ' own cards (creatures and tactics) and ' + R.axioms + ' Axiom cards.',
                    'At most ' + R.copies + ' copies of a card.',
                    'Colour tactics: no more than your creatures of that colour. Generic tactics always fit.',
                    'In a battle, colour tactics need no creature of their colour.',
                ].map(text => el('li', { text }))),
                el('p.small.muted', { text: 'Your saved deck did not change. You can replay this workshop in Collection.' }),
            ];
        }

        // focusLabel: after a click, keep the focus on that control (keyboard users stay in place).
        function render(moved, focusLabel) {
            const kind = STEPS[ui.step];
            const scrollTop = body.scrollTop || 0;
            body.textContent = '';
            const last = ui.step === STEPS.length - 1;
            const nav = [
                el('button.btn.small', { type: 'button', text: 'Back', disabled: ui.step === 0, onclick: () => go(ui.step - 1) }),
            ];
            if (!last) nav.push(el('button.btn.primary.workshop-next', { type: 'button', text: 'Next', disabled: !ready(), onclick: () => { if (ready()) go(ui.step + 1); } }));
            if ((kind === 'copies' || kind === 'quota') && !ui.solved[kind]) nav.push(el('button.btn.small', { type: 'button', text: 'Start this task again', onclick() { ui.task = scenario(kind, p); ui.note = ''; ui.mistake = false; render(false); } }));
            if (last) {
                if (o.start) nav.push(el('button.btn.primary', { type: 'button', text: 'Continue to the match', onclick() { dialog.close(); o.start(); } }));
                nav.push(el('button.btn' + (o.start ? '' : '.primary'), { type: 'button', text: 'Open my deck builder', onclick() { dialog.close(); if (Rift.Battles && Rift.Battles.repairDeck) Rift.Battles.repairDeck('deck'); } }));
            }
            body.append(
                el('div.small.muted.workshop-progress', { text: 'Step ' + (ui.step + 1) + ' of ' + STEPS.length }),
                el('h3.workshop-title', { tabindex: '-1', text: ({ starter: 'Your starter deck', size: '20 cards and 10 Axioms', copies: 'Two copies at most', quota: 'Colour quotas', cast: 'Cast without a matching creature', done: 'Workshop complete' })[kind] }),
                ...content().filter(Boolean),
                el('div.row.wrap.workshop-nav', null, nav),
            );
            // A new step starts at its top; a change inside a step keeps the list where it was.
            body.scrollTop = moved ? 0 : scrollTop;
            const all = body.querySelectorAll ? Array.from(body.querySelectorAll('button')) : [];
            const target = (focusLabel && all.find(b => (b.getAttribute('aria-label') || b.textContent) === focusLabel && !b.disabled))
                || (moved || ready() ? all.find(b => b.classList.contains('workshop-next') && !b.disabled) : null)
                || all.find(b => b.classList.contains('workshop-cast'))
                || (moved && body.querySelector ? body.querySelector('.workshop-title') : null);
            if (target && target.focus) try { target.focus({ preventScroll: true }); } catch (e) { /* ignore */ }
        }

        go(0);
        return { dialog, ui, body, go };
    }

    Rift.DeckWorkshop = { SEEN, DONE, STEPS, plan, scenario, change, check, demo, cast, shouldOffer, offer, open };
})(typeof window !== 'undefined' ? window : globalThis);
