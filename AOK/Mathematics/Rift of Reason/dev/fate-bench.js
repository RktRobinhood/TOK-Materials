/* #119/#120/#121 scratch QA: dev/battle.html?fate=you-cast (or mercy, rival-casts, due-now, leap, echo, once,
 * five, rules, full).
 * The later Fate pack on the real battle screen and engine: Clean Slate (#119); Leap Ahead, Revisit and
 * Echoing Encouragement (#120); the five colour-scheduled spells and the Fate timing Axioms (#121). No save
 * writes. The pack is defined in data/tactics.js and data/axioms.js, but no grant list names it: students
 * can't obtain it yet.
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
        leap: 'The rival\'s Clean Slate wipes the board at the end of this round. Select Leap Ahead: the bar says what it skips. Play it: Fate leaps 2 rounds and the wipe never happens. Inspect the ⏭ marker. Revisit or Clockwork back brings Fate back over its space: still nothing.',
        echo: 'Your Echoing Encouragement fired at the end of round 1 and is still live, 1 round behind NOW. Play Revisit: Fate lands on it again and your creatures get +1/+1 again. Its node says when it expires: End turn, and its boosts end. Moving Fate back further never makes it last longer.',
        once: 'Your Clean Slate already happened, 1 round behind NOW. Play Revisit: Fate lands on its space, and nothing happens. A one-shot spell never happens twice.',
        five: 'The five colour spells are in your hand (2 plays a turn; Open Calendar is active, so 3 may wait). Select each to read when it happens. Remember This names Zuckerborg, defeated earlier. Play them, inspect their nodes, then End turn: at the round\'s end an Idea token joins you, you draw 2 (the preview never names them), your creatures heal and grow.',
        rules: 'Patient Plans is active: select Tomorrow\'s Idea or Clean Slate, and the bar says it lands 1 round later. Play one, then play Hasty Plans from your rule cards: the spell already on the track does not move, but the next one lands sooner.',
        full: 'Your side is full and so is your hand. Tomorrow\'s Idea, Delayed Observation and Remember This are already on the Fate track: End turn and read what happens (nothing arrives, nothing is drawn, Zuckerborg stays in the discard pile). Each is still used up.',
    };
    let selected = CASES[q.get('fate')] ? q.get('fate') : 'you-cast';
    const scratch = R.State.freshState();
    R.State.get = () => scratch; R.State.update = fn => fn(scratch); R.State.save = () => {}; R.State.saveNow = () => true;
    const note = el('p', { id: 'fate-note' });
    const select = el('select', { 'aria-label': 'Fate pack case', onchange(ev) {
        selected = ev.target.value; q.set('fate', selected); root.history.replaceState(null, '', root.location.pathname + '?' + q.toString()); start();
    } }, Object.keys(CASES).map(id => el('option', { value: id, selected: id === selected, text: id })));
    root.document.querySelector('.bench header').replaceChildren(el('strong', { text: 'Fate pack · scratch battle, no saves' }), select,
        el('button.btn.small', { text: 'Reset case', onclick: () => start() }),
        el('label', {}, [el('input', { type: 'checkbox', onchange(ev) { root.document.body.classList.toggle('calm-motion', ev.target.checked); } }), ' Calm motion']));
    root.document.getElementById('screen').before(note);

    const inst = (species, i, p) => ({ uid: 'fate-' + p + '-' + i, species, powerDelta: 0, injuries: [], scars: [] });
    function start() {
        note.textContent = CASES[selected];
        const rival = selected === 'rival-casts';
        const MINE = { leap: ['leap-ahead', 'revisit', 'clockwork'], echo: ['echoing-encouragement', 'revisit', 'clockwork'], once: ['clean-slate', 'revisit', 'clockwork'],
            five: ['prepared-defence', 'delayed-observation', 'tomorrows-idea', 'remember-this', 'scheduled-speech'],
            rules: ['tomorrows-idea', 'clean-slate', 'scheduled-speech'],
            full: ['tomorrows-idea', 'delayed-observation', 'remember-this', 'second-wind', 'second-wind', 'clockwork', 'clockwork', 'lemma', 'lemma', 'recall'] };
        const mine = ['zuckerborg', 'kardashiant', 'lobstorian', 'astrophysicat', 'keanu', 'tremendoodle'];
        const theirs = ['siuuugull', 'beastie', 'astrophysicat', 'lobstorian', 'tremendoodle', 'kardashiant'];
        let s = E.createBattle({ seed: 'fate-bench-' + selected,
            players: [{ name: 'You', team: mine.map((x, i) => inst(x, i, 0)), tactics: MINE[selected] || (rival ? ['nostalgia', 'clockwork'] : ['clean-slate', 'clockwork']) },
                { name: 'Practice rival', team: theirs.map((x, i) => inst(x, i, 1)), tactics: rival || selected === 'leap' ? ['clean-slate'] : ['second-wind'] }],
            axiomDeck: ['luxury', 'abundance', 'haste', 'thrift'],
            options: { first: 0, shuffle: false, shuffleAxioms: false, openHand: [0, 0], openAxioms: 0, spark: false, timeline: true, fateStart: 3, mode: 'practice' } });
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
        }
        if (MINE[selected]) move('p0t2', 0, 'hand');
        // #121 cases: every listed spell in hand; Zuckerborg already defeated (Remember This fixes it).
        if (['five', 'rules', 'full'].includes(selected)) {
            MINE[selected].forEach((_, i) => move('p0t' + i, 0, 'hand'));
            move('p0c0', 0, 'discard');
            move('p0c3', 0, 'board');
            s.cards.p0c1.damage = 1;
        }
        if (selected === 'five') s.axioms.active = { 'fate-capacity': 'open-calendar' };
        if (selected === 'rules') { s.axioms.active = { 'fate-delay': 'patient-plans' }; s.players[0].axHand = ['hasty-plans', 'open-calendar']; }
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
        // #120 cases, built with real actions. step: whoever must act; a draw takes the deck.
        const step = a => { s = E.applyAction(s, Object.assign({ player: E.decider(s) }, a)); s.players.forEach(P => { P.energy = 10; P.capacity = 10; }); };
        const draw = () => step({ type: 'draw', choice: (E.legalActions(s).find(a => a.type === 'draw' && a.choice === 'deck') || E.legalActions(s).find(a => a.type === 'draw')).choice });
        const round = () => { step({ type: 'end' }); draw(); step({ type: 'end' }); draw(); };
        if (selected === 'leap') {
            // The rival casts Clean Slate in round 1; it is due at the end of round 2 (now).
            move('p1t0', 1, 'hand');
            step({ type: 'end' }); draw(); step({ type: 'play', cid: 'p1t0' }); step({ type: 'end' }); draw();
        } else if (selected === 'echo') {
            step({ type: 'play', cid: 'p0t0' });   // round 1: Echoing Encouragement on the next space
            round(); round();                       // it fires at the end of round 1; round 2 passes
        } else if (selected === 'full') {
            // The three spells go on the track with real plays (Open Calendar lets 3 wait), all due at the end
            // of this round. Then the side and the hand fill up, and the rival's creatures can't attack, so
            // nothing makes room before the round ends.
            s.axioms.active = { 'fate-capacity': 'open-calendar' };
            ['p0t0', 'p0t1', 'p0t2'].forEach(cid => { s.players[0].playsThisTurn = 0; step({ type: 'play', cid }); });
            const P = s.players[0];
            P.deck.slice().forEach(cid => { if (P.board.length < s.options.boardLimit && s.cards[cid].kind === 'creature') move(cid, 0, 'board'); });
            P.deck.slice().forEach(cid => { if (P.hand.length + P.axHand.length < s.options.handLimit) move(cid, 0, 'hand'); });
            while (P.hand.length + P.axHand.length < s.options.handLimit) P.axHand.push('luxury');   // rule cards fill the rest
            s.players[1].board.forEach(cid => { s.cards[cid].frozen = true; });
            P.playsThisTurn = 0;
        } else if (selected === 'once') {
            step({ type: 'play', cid: 'p0t0' });   // round 1: Clean Slate 2 rounds ahead
            round(); round(); round();              // it happens at the end of round 2; round 3 passes
            ['p0c1', 'p0c2'].forEach(cid => move(cid, 0, 'board'));
            ['p1c1', 'p1c2'].forEach(cid => move(cid, 1, 'board'));
        }
        R.Router.replace('battle', { mode: 'practice', initialState: s, opponent: { name: 'Practice rival', ai: 'competent' },
            onEnd(result) { note.textContent = 'Scratch result: ' + result.outcome + '. Reset or choose another case.'; } });
    }
    R.FateBench = { start, cases: Object.keys(CASES) };
})(typeof window !== 'undefined' ? window : globalThis);
