/* #101: real engine/screen, scratch state only. dev/battle.html?flux=repeat */
(function (root) {
    'use strict';
    const R = root.Rift, q = new URLSearchParams(root.location.search);
    if (!q.has('flux')) return;
    const E = R.Battle.Engine, el = R.el;
    const CASES = {
        repeat: 'Shared activations are 3; your temporary bonus is +2. Read One More Move: 3 → 4. Play both copies: one dock entry becomes 5. Each cast spends a use before the total changes. Preview/cancel is free. Two Fewer Moves lowers the shared total; Granny’s Spare Axiom resets it to 2 without refunding uses or removing your +2.',
        unlimited: 'Shared activations are Unlimited. Two Fewer Moves is dimmed and explains why. Play Axiom of Plenty to repair Unlimited to 3. It spends a use first; One More Move can then raise the finite value to 4.',
        fate: 'The next free flip is Two Fewer Cards. Focus/tap its Fate node: at the basic draw count it changes nothing. Play Two More Cards now, and its forecast becomes 3 → 1. End a round and it resolves against that current value. The following Fate event resets all rules.',
        categories: 'Play cost and growth modifiers. Only creature costs change, never rule/spell costs. Growth changes the next turn’s capacity, not your current energy. All four numeric categories keep one tile. Lower bounds can make a card unplayable; read the reason.',
    };
    let selected = CASES[q.get('flux')] ? q.get('flux') : 'repeat';
    const scratch = R.State.freshState();
    R.State.get = () => scratch; R.State.update = fn => fn(scratch); R.State.save = () => {}; R.State.saveNow = () => true;
    const note = el('p', { id: 'flux-note' }); root.document.getElementById('screen').before(note);
    const select = el('select', { 'aria-label': 'Flux case', onchange(ev) { selected = ev.target.value; start(); } },
        Object.keys(CASES).map(id => el('option', { value: id, selected: id === selected, text: id })));
    root.document.querySelector('.bench header').replaceChildren(el('strong', { text: 'Flux · scratch battle, no saves' }), select,
        el('button.btn.small', { text: 'Reset case', onclick: () => start() }),
        el('label', null, [el('input', { type: 'checkbox', onchange(ev) { root.document.body.classList.toggle('calm-motion', ev.target.checked); } }), ' Calm motion']));
    function start() {
        note.textContent = CASES[selected];
        const team = p => ['keanu', 'astrophysicat', 'khaby', 'beastie', 'beansprout', 'proof-pup'].map((species, i) => ({ uid: 'flux-' + p + '-' + i, species }));
        let s = E.createBattle({ seed: 'flux-bench', players: [{ name: 'You', team: team(0) }, { name: 'Rival', team: team(1) }],
            axiomDeck: ['flux-draw-minus-2', 'flux-growth-plus-1', 'two-plays'],
            options: { first: 0, shuffle: false, shuffleAxioms: false, openHand: [2, 2], openAxioms: 0, spark: false, hearts: 30, fateStart: 1, fateGap: 2 } });
        s.players.forEach(P => { P.energy = P.capacity = 10; }); s.phase = 'main';
        if (selected === 'repeat') { s = E.projectAxiom(s, 'flux-plays-plus-1'); s.players[0].extraPlays = 2; s.players[0].axHand = ['flux-plays-plus-1', 'flux-plays-plus-1', 'flux-plays-minus-2', 'spare-axiom']; }
        if (selected === 'unlimited') { s = E.projectAxiom(s, 'infinity'); s.players[0].axHand = ['flux-plays-minus-2', 'plenty', 'flux-plays-plus-1']; }
        if (selected === 'fate') s.players[0].axHand = ['flux-draw-plus-2'];
        if (selected === 'categories') s.players[0].axHand = ['flux-growth-minus-2', 'flux-cost-minus-1', 'flux-cost-minus-2', 'flux-draw-minus-1'];
        R.Router.replace('battle', { mode: 'practice', initialState: s, opponent: { name: 'Rival', ai: 'competent' },
            onEnd(result) { note.textContent = 'Scratch result: ' + result.outcome + '. Reset or choose another case.'; } });
    }
    R.FluxBench = { start };
})(window);
