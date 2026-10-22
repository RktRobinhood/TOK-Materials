/* #163 card text bench: every released card's rules text in each place that shows it, on the
 * production screens, with a memory-only save (never the player's progress). Driven by
 * tools/measure-card-text.mjs; usable by hand from the console:
 *   CardText.gallery('creature')          big framed cards (Collection details, hunt reward)
 *   CardText.gallery('tactic'|'axiom')    pack-reveal prints (name only; the rules are in the caption)
 *   CardText.pack([{ kind, id }, ...])    the real pack reveal of those cards (Next with the button)
 *   CardText.arena({ hand: [...], axioms: [...] })   a real battle with those cards in your hand
 * ?calm=1 turns on Calm motion. */
(function () {
    'use strict';
    const R = window.Rift, el = R.el, memory = new Map();
    R.storage = () => ({ getItem: k => memory.get(k) || null, setItem: (k, v) => memory.set(k, String(v)), removeItem: k => memory.delete(k) });
    R.State.newGame();
    R.State.update(s => { s.avatar = { type: 'owlet', variant: 'girl', nickname: 'Card text bench' }; s.settings.music = s.settings.sfx = s.settings.voice = s.settings.ambience = 0; });
    const q = new URLSearchParams(location.search);
    document.body.classList.toggle('calm-motion', q.get('calm') === '1');

    // Every card the game ships (held catalogue concepts are not in Rift.data).
    function ids() {
        return { creature: Object.keys(R.data.creatures), tactic: Object.keys(R.data.tactics), axiom: Object.keys(R.data.axioms) };
    }
    function screen() { const n = document.getElementById('screen'); n.innerHTML = ''; return n; }
    // The big faces: Collection details and the hunt reward (framedCard), pack prints (PackReveal.face).
    function gallery(kind, list) {
        R.Router.replace && R.Router.current && R.Router.current() === 'battle' && R.Router.replace('title');
        const root = screen();
        const wrap = el('div.card-text-gallery', { style: { display: 'flex', flexWrap: 'wrap', gap: '12px', padding: '12px', overflow: 'auto', height: '100%', boxSizing: 'border-box', alignContent: 'flex-start' } });
        (list || ids()[kind]).forEach(id => wrap.appendChild(el('div', { dataset: { kind, id } }, [kind === 'creature' ? R.UI.framedCard(id, { big: true }) : R.PackReveal.face({ kind, id, foil: false })])));
        root.appendChild(wrap);
        return wrap.children.length;
    }
    function move(s, cid, zone) {
        s.players.forEach(P => ['deck', 'hand', 'board', 'discard'].forEach(z => { const i = P[z].indexOf(cid); if (i >= 0) P[z].splice(i, 1); }));
        s.players[s.cards[cid].owner][zone].push(cid);
        if (zone === 'board') s.cards[cid].enteredTurn = 0;
    }
    // A real battle: o.hand = creature species and tactic ids for your hand, o.board = species on
    // your side, o.axioms = Axiom ids in your rule hand. The rival has a creature on the table, so
    // most aimed spells are playable (not dimmed).
    function arena(o) {
        const E = R.Battle.Engine, hand = o.hand || [], board = o.board || [];
        const species = hand.concat(board).filter(id => R.data.creatures[id] || (R.data.tokens || {})[id]);
        const tactics = hand.filter(id => R.data.tactics[id]);
        const team = list => list.map((sp, i) => ({ uid: 'ct-' + i + '-' + sp, species: sp, powerDelta: 0, injuries: [], scars: [] }));
        const s = E.createBattle({ seed: 'card-text', players: [
            { name: 'You', team: team(species.concat(['beastie'])), tactics: tactics.concat(['counterexample']), axioms: [] },
            { name: 'Rival', team: team(['lobstorian', 'beastie']), tactics: ['counterexample'], axioms: [] }],
        options: { first: 0, shuffle: false, shuffleAxioms: false, openHand: [0, 0], openAxioms: 0, spark: false, timeline: false, maxCreatures: 40, deckSize: 80 } });
        s.phase = 'main';
        s.players.forEach(P => { P.energy = 10; P.capacity = 10; });
        const used = new Set();
        const find = id => Object.keys(s.cards).find(c => !used.has(c) && s.cards[c].owner === 0 && (s.cards[c].species === id || s.cards[c].tactic === id));
        hand.forEach(id => { const c = find(id); if (c) { used.add(c); move(s, c, 'hand'); } });
        board.forEach(id => { const c = find(id); if (c) { used.add(c); move(s, c, 'board'); } });
        const rival = Object.keys(s.cards).find(c => s.cards[c].owner === 1 && s.cards[c].kind === 'creature');
        if (rival) move(s, rival, 'board');
        if (!board.length) { const mine = Object.keys(s.cards).find(c => !used.has(c) && s.cards[c].owner === 0 && s.cards[c].species === 'beastie'); if (mine) move(s, mine, 'board'); }
        s.players[0].axHand = (o.axioms || []).slice();
        R.Router.replace('battle', { mode: 'practice', initialState: s, player: { name: 'You' }, opponent: { name: 'Rival', ai: 'normal' }, onEnd() {} });
        return s;
    }
    // The real pack reveal of these cards, from a receipt that is never saved.
    function pack(cards) {
        R.Router.current && R.Router.current() === 'battle' && R.Router.replace('title');
        const receipt = { number: 1, source: 'free', price: 0, cards: cards.map((c, i) => ({ kind: c.kind, id: c.id, uid: 'ct-' + i, copies: 1,
            rarity: R.Rarity.of((R.data[R.Packs.KINDS[c.kind]] || {})[c.id] || {}).id, foil: false })) };
        return !!R.PackReveal.show(receipt);
    }
    window.CardText = { ids, gallery, pack, arena };
    R.Router.replace('title');
})();
