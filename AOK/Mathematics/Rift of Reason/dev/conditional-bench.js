/* Playable #148/#149 study: real engine and controls, isolated scratch save. */
(function (root) {
    'use strict';
    const R = root.Rift;
    if (!R.ConditionalStudy) return;
    root.document.body.classList.add('conditional-study');
    const E = R.Battle.Engine, el = R.el, q = new URLSearchParams(root.location.search), set = R.ConditionalStudy;
    let selected = set.ids.includes(q.get('conditional')) ? q.get('conditional') : set.creatures[1];
    const scratch = R.State.freshState();
    R.State.get = () => scratch; R.State.update = fn => fn(scratch); R.State.save = () => {}; R.State.saveNow = () => true;
    const note = el('p', { id: 'conditional-note' });
    const select = el('select', { 'aria-label': 'Conditional card case', onchange(ev) {
        selected = ev.target.value; q.set('conditional', selected); root.history.replaceState(null, '', root.location.pathname + '?' + q.toString()); start();
    } }, set.ids.map(id => el('option', { value: id, selected: selected === id, text: (R.data.creatures[id] || R.data.tactics[id]).name })));
    root.document.querySelector('.bench header').replaceChildren(el('strong', { text: 'Conditional cards · scratch battle, no saves' }), select,
        el('button.btn.small', { text: 'Reset case', onclick: () => start() }),
        el('label', {}, [el('input', { type: 'checkbox', onchange(ev) { root.document.body.classList.toggle('calm-motion', ev.target.checked); } }), ' Calm motion']));
    root.document.getElementById('screen').before(note);
    function start() {
        const creature = !!R.data.creatures[selected], seat = selected === set.creatures[1];
        // Cards that wait for Fate (#148 step 4) need the Fate track; the others keep the quieter table.
        const def = (creature ? R.data.creatures[selected] : R.data.tactics[selected]).conditional;
        const fate = def.options.some(o => o.event === 'fate-entered');
        note.textContent = 'Arm the highlighted card, then continue playing. Two conditions maximum; creatures reserve board space. '
            + (seat ? 'End turn with your board empty: a hero attack reveals Guard before damage.' : fate ? 'Fate moves at the end of each round: watch it reveal when Fate lands.' : 'Inspect the armed card to read its committed condition.')
            + ' Eighteen study cards are playable; campaign acquisition and five other concepts remain unfinished.';
        const own = [creature ? selected : 'proof-pup', 'paper-dragon', 'lens-lizard', 'cloud-calf', 'comma-crab', 'pocket-tortoise', 'rawmsay'];
        const inst = (species, i) => ({ uid: 'conditional-' + i, species, powerDelta: 0, injuries: [], scars: [] });
        const s = E.createBattle({ seed: 'conditional-study-' + selected,
            players: [{ name: 'You', team: own.map(inst), tactics: creature ? ['second-wind'] : [selected, 'second-wind'] },
                { name: 'Practice rival', team: ['paper-dragon', 'lens-lizard', 'cloud-calf', 'comma-crab', 'pocket-tortoise'].map(inst), tactics: ['second-wind', 'clockwork'] }],
            axiomDeck: ['luxury', 'abundance', 'reverse-hearts'], options: { first: 0, shuffle: false, shuffleAxioms: false,
                openHand: [0, 0], openAxioms: 0, spark: false, timeline: fate, fateStart: 3, mode: 'practice' } });
        const move = (cid, p, zone) => {
            ['deck', 'hand', 'board', 'discard'].forEach(z => { s.players[p][z] = s.players[p][z].filter(id => id !== cid); });
            s.players[p][zone].push(cid); s.cards[cid].enteredTurn = 0;
        };
        if (creature) move('p0c0', 0, 'hand'); else { move('p0t0', 0, 'hand'); move('p0c0', 0, 'hand'); }
        if (!seat) { move('p0c1', 0, 'board'); s.cards.p0c1.damage = 1; }
        move(creature ? 'p0t0' : 'p0t1', 0, 'hand');
        move('p1c0', 1, 'board'); move('p1c1', 1, 'hand'); move('p1t0', 1, 'hand');
        s.players[0].axHand = ['luxury']; s.players[1].axHand = ['abundance'];
        s.players.forEach(P => { P.energy = 10; P.capacity = 10; P.hearts = 8; }); s.phase = 'main';
        R.Router.replace('battle', { mode: 'practice', initialState: s, opponent: { name: 'Practice rival', ai: 'normal' },
            onEnd(result) { note.textContent = 'Scratch result: ' + result.outcome + '. Reset or choose another card.'; } });
    }
    R.ConditionalBench = { start };
})(typeof window !== 'undefined' ? window : globalThis);
