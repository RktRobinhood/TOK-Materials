/* #119/#120 scratch QA: dev/battle.html?fate=you-cast (or mercy, rival-casts, due-now, leap, echo, expiry).
 * The scheduled Fate spells (Clean Slate; #120 Leap Ahead, Revisit, Echoing Encouragement) on the real
 * battle screen and engine. No save writes. They are defined in data/tactics.js but no grant list names
 * them: students can't obtain them yet.
 */
(function (root) {
    'use strict';
    const R = root.Rift, q = new URLSearchParams(root.location.search);
    if (!q.has('fate')) return;
    const E = R.Battle.Engine, el = R.el;
    const CASES = {
        'you-cast': 'Play Clean Slate (4 energy). Its node appears 2 rounds ahead on the Fate track: hover or tap it for the countdown and what it would defeat right now. End turns until it resolves. Zuckerborg\'s Last Word returns it to your hand.',
        mercy: 'Mercy is active. Play Clean Slate and inspect its node: every creature would return to its owner\'s hand. The preview always uses the rules in force.',
        'rival-casts': 'The rival is behind on the board and holds Clean Slate. Take your turn and end it: watch the rival schedule the wipe, then react (Nostalgia delays it 2 rounds; Clockwork moves it 1 round).',
        'due-now': 'Your Clean Slate resolves at the end of this round. Clockwork can move Fate (and the wipe) 1 round later, or 1 round sooner, which resolves it at once.',
        // #120
        leap: 'The rival\'s Clean Slate happens at the end of this round. Select Leap Ahead: the prompt says what it skips. Play it: Fate jumps 2 rounds, the wipe is skipped for good (see the marks on the reel). Revisit or Clockwork back onto that space: it still never happens.',
        echo: 'Play Echoing Encouragement: a repeat space 1 round ahead. End the round: your creatures get +1/+1. Next round, Revisit lands Fate on it again: +1/+1 again. Inspect the space behind NOW: it says how many rounds it still lasts.',
        expiry: 'Your Echoing Encouragement is 1 space back and this is its last round. Revisit lands on it once more (+1/+1). End the round: it ends, and every boost it gave ends. Clockwork back onto it next round does nothing.',
    };
    let selected = CASES[q.get('fate')] ? q.get('fate') : 'you-cast';
    const scratch = R.State.freshState();
    R.State.get = () => scratch; R.State.update = fn => fn(scratch); R.State.save = () => {}; R.State.saveNow = () => true;
    const note = el('p', { id: 'fate-note' });
    const select = el('select', { 'aria-label': 'Fate case', onchange(ev) {
        selected = ev.target.value; q.set('fate', selected); root.history.replaceState(null, '', root.location.pathname + '?' + q.toString()); start();
    } }, Object.keys(CASES).map(id => el('option', { value: id, selected: id === selected, text: id })));
    root.document.querySelector('.bench header').replaceChildren(el('strong', { text: 'Scheduled Fate · scratch battle, no saves' }), select,
        el('button.btn.small', { text: 'Reset case', onclick: () => start() }),
        el('label', {}, [el('input', { type: 'checkbox', onchange(ev) { root.document.body.classList.toggle('calm-motion', ev.target.checked); } }), ' Calm motion']));
    root.document.getElementById('screen').before(note);

    const inst = (species, i, p) => ({ uid: 'fate-' + p + '-' + i, species, powerDelta: 0, injuries: [], scars: [] });
    function start() {
        note.textContent = CASES[selected];
        const rival = selected === 'rival-casts';
        const mine = ['zuckerborg', 'kardashiant', 'lobstorian', 'astrophysicat', 'keanu', 'tremendoodle'];
        const theirs = ['siuuugull', 'beastie', 'astrophysicat', 'lobstorian', 'tremendoodle', 'kardashiant'];
        const pack = { leap: [['leap-ahead', 'revisit', 'clockwork'], ['clean-slate']], echo: [['echoing-encouragement', 'revisit', 'leap-ahead'], ['second-wind']],
            expiry: [['echoing-encouragement', 'revisit', 'clockwork'], ['second-wind']] }[selected];
        let s = E.createBattle({ seed: 'fate-bench-' + selected,
            players: [{ name: 'You', team: mine.map((x, i) => inst(x, i, 0)), tactics: pack ? pack[0] : rival ? ['nostalgia', 'clockwork'] : ['clean-slate', 'clockwork'] },
                { name: 'Practice rival', team: theirs.map((x, i) => inst(x, i, 1)), tactics: pack ? pack[1] : rival ? ['clean-slate'] : ['second-wind'] }],
            axiomDeck: ['luxury', 'abundance', 'haste', 'thrift'],
            // #120 cases: Fate's own rule event far away (6 rounds), so the leaps and rewinds are about the spells.
            options: { first: 0, shuffle: false, shuffleAxioms: false, openHand: [0, 0], openAxioms: 0, spark: false, timeline: true, fateStart: pack ? 6 : 3, fateMax: pack ? 7 : 6, mode: 'practice' } });
        const move = (cid, p, zone) => {
            ['deck', 'hand', 'board', 'discard'].forEach(z => { s.players[p][z] = s.players[p][z].filter(id => id !== cid); });
            s.players[p][zone].push(cid); s.cards[cid].enteredTurn = 0;
        };
        if (rival) {
            ['p0c0', 'p0c1', 'p0c2', 'p0c3'].forEach(cid => move(cid, 0, 'board'));
            move('p0t0', 0, 'hand'); move('p0t1', 0, 'hand'); move('p0c4', 0, 'hand');
            move('p1t0', 1, 'hand'); move('p1c0', 1, 'hand');
        } else {
            move('p0c0', 0, 'board'); move('p0c1', 0, 'board');
            ['p1c0', 'p1c1', 'p1c2'].forEach(cid => move(cid, 1, 'board'));
            move('p0t0', 0, 'hand'); move('p0t1', 0, 'hand'); move('p0c2', 0, 'hand');
            move('p1c3', 1, 'hand');
            if (pack) { move('p0t2', 0, 'hand'); move('p1t0', 1, 'hand'); }
        }
        if (selected === 'mercy') s.axioms.active = { defeat: 'mercy' };
        // Plenty of hearts, so the case always reaches the wipe (hero damage is not what this bench shows).
        s.players.forEach(P => { P.energy = 10; P.capacity = 10; P.hearts = P.maxHearts = 30; });
        s.phase = 'main';
        if (selected === 'due-now') {
            // Built with real actions: cast it, then let one round pass. It resolves at the end of the next one.
            s = E.applyAction(s, { type: 'play', player: 0, cid: 'p0t0' });
            s = E.applyAction(s, { type: 'end', player: 0 });
            s = E.applyAction(s, { type: 'draw', player: 1, choice: E.legalActions(s).find(a => a.type === 'draw').choice });
            s = E.applyAction(s, { type: 'end', player: 1 });
            s = E.applyAction(s, { type: 'draw', player: 0, choice: E.legalActions(s).find(a => a.type === 'draw').choice });
            s.players.forEach(P => { P.energy = 10; P.capacity = 10; });
        }
        // #120, built with real actions. leap: the rival schedules Clean Slate in round 1 (due at the end of round 2).
        // expiry: your Echoing Encouragement fires at the end of round 1; it is round 3, its last.
        const pass = p => {
            if (s.phase === 'draw') s = E.applyAction(s, { type: 'draw', player: p, choice: E.legalActions(s).find(a => a.type === 'draw').choice });
            s = E.applyAction(s, { type: 'end', player: p });
        };
        if (selected === 'leap') {
            pass(0);
            s = E.applyAction(s, { type: 'draw', player: 1, choice: E.legalActions(s).find(a => a.type === 'draw').choice });
            s = E.applyAction(s, { type: 'play', player: 1, cid: 'p1t0' });
            pass(1);
        } else if (selected === 'expiry') {
            s = E.applyAction(s, { type: 'play', player: 0, cid: 'p0t0' });
            pass(0); pass(1); pass(0); pass(1);
        }
        if (pack && selected !== 'echo') {
            s = E.applyAction(s, { type: 'draw', player: 0, choice: E.legalActions(s).find(a => a.type === 'draw').choice });
            s.players.forEach(P => { P.energy = 10; P.capacity = 10; });
        }
        R.Router.replace('battle', { mode: 'practice', initialState: s, opponent: { name: 'Practice rival', ai: 'competent' },
            onEnd(result) { note.textContent = 'Scratch result: ' + result.outcome + '. Reset or choose another case.'; } });
    }
    R.FateBench = { start, cases: Object.keys(CASES) };
})(typeof window !== 'undefined' ? window : globalThis);
