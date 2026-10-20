import test from 'node:test';
import assert from 'node:assert/strict';
import { Rift as R, E, setup, onBoard, toHand, toDiscard, rule } from './battle-helpers.mjs';
const J = x => JSON.parse(JSON.stringify(x));
const board = s => s.players.map(P => ({ name: P.name, hearts: P.hearts, energy: P.energy, uses: E.playsLeft(s, s.players.indexOf(P)),
    board: P.board.map(cid => ({ cid, species: s.cards[cid].species, name: E.cardName(s, cid), attack: E.attackOf(s, cid), health: E.healthOf(s, cid).current, keywords: J(E.keywordsOf(s, cid)) })) }));
function check(s, action) {
    action = { player: 0, ...action };
    const before = JSON.stringify(s), p = E.previewAction(s, action, 0);
    assert.equal(JSON.stringify(s), before, 'opening and resolving the preview leaves the entire live state unchanged');
    assert.deepEqual(J(E.previewAction(s, action, 0)), J(p), 'replay is pure and deterministic');
    assert.ok(p.complete, p.reason);
    const committed = E.applyAction(s, action);
    assert.deepEqual(J(p.frames.at(-1).view.players), J(board(committed)), 'public result agrees with committing the same move');
    const publicLines = committed.lastEvents.map(e => e.privateTo != null ? e.publicText : e.text).filter(Boolean);
    assert.deepEqual(J(p.lines.filter(line => publicLines.includes(line))), J(publicLines), 'clip text agrees with committed public events');
    assert.ok(!('state' in p)); return p;
}

test('attack previews resolve damage, Shield, colour/rule bonuses and public Last Words with the real engine', () => {
    for (const ax of [null, 'underdog', 'age-of-feeling', 'excluded-middle']) {
        let s = setup({ p0: ['beastie'], p1: ['keanu'] }); onBoard(s, 'p0c0', 'p1c0');
        s.cards.p0c0.buffs.push({ label: 'Preview fixture', attack: 3, health: 0 });
        if (ax) rule(s, ax);
        const p = check(s, { type: 'attack', cid: 'p0c0', target: 'p1c0' });
        assert.match(p.lines.join(' '), /attack/);
        if (ax) assert.ok(p.frames.some(f => f.view.rules.some(t => t.includes(R.data.axioms[ax].name))));
        if (!ax) assert.match(p.lines.join(' '), /hand|Déjà|deja/i, 'Last Word return is included, not just combat arithmetic');
    }
    const s = setup({ p0: ['beastie'], p1: ['keanu'] }); onBoard(s, 'p0c0', 'p1c0'); s.cards.p1c0.extraKeywords.push('shield');
    check(s, { type: 'attack', cid: 'p0c0', target: 'p1c0' });
});

test('clips explain both fighters, reduction, Shield and hero damage limits', () => {
    const s = setup({ p0: ['beastie'], p1: ['rockodile'] }); onBoard(s, 'p0c0', 'p1c0');
    const p = check(s, { type: 'attack', cid: 'p0c0', target: 'p1c0' });
    assert.match(p.explanation, /The Eyebrow: each hit deals it 1 less damage/);
    assert.match(p.explanation, /Rockodile.*Base/);
    s.cards.p1c0.extraKeywords.push('shield');
    assert.match(check(s, { type: 'attack', cid: 'p0c0', target: 'p1c0' }).explanation, /Shield blocks/);
    const hero = setup({ p0: ['beastie'], p1: ['keanu'] }); onBoard(hero, 'p0c0');
    hero.cards.p0c0.gained.push('machine'); rule(hero, 'doubt');
    const h = check(hero, { type: 'attack', cid: 'p0c0', target: 'h1' });
    assert.match(h.explanation, /Machine: \+2 damage to a hero/);
    assert.match(h.explanation, /limits each hero hit to 1 damage/);
});

test('a single public Recall option resolves automatically; real decisions remain unknown', () => {
    const s = setup({ p0: ['beastie', 'keanu'], t0: ['recall'] });
    toDiscard(s, 'p0c0'); toHand(s, 'p0t0');
    check(s, { type: 'play', cid: 'p0t0' });
    toDiscard(s, 'p0c1');
    const p = E.previewAction(s, { type: 'play', player: 0, cid: 'p0t0' }, 0);
    assert.equal(p.complete, false); assert.match(p.reason, /choice/);
});

test('long immutable history is irrelevant and invalid actors cannot preview a move', () => {
    const s = setup({ p0: ['beastie'], p1: ['keanu'] }); onBoard(s, 'p0c0', 'p1c0');
    const action = { type: 'attack', player: 0, cid: 'p0c0', target: 'p1c0' }, expected = E.previewAction(s, action, 0);
    for (let i = 0; i < 6000; i++) s.log = { prev: s.log, events: [{ text: 'Private historical fixture' }] };
    assert.deepEqual(J(E.previewAction(s, action, 0)), J(expected));
    assert.equal(E.previewAction(s, { ...action, player: 1 }, 0).complete, false);
});

test('manual abilities, creature plays, tactics and relative axioms project paid costs without spending them live', () => {
    const s = setup({ p0: ['astrophysicat', 'keanu'], p1: ['keanu'], t0: ['pep-talk'] }); onBoard(s, 'p0c0', 'p1c0'); toHand(s, 'p0c1', 'p0t0');
    s.cards.p0c0.gained = ['comma-pause']; onBoard(s, 'p0c1'); s.cards.p0c1.damage = 1;
    check(s, { type: 'activate', cid: 'p0c0', ability: 'comma-pause', target: 'p0c1' });
    toHand(s, 'p0c1');
    check(s, { type: 'play', cid: 'p0c1' });
    check(s, { type: 'play', cid: 'p0t0', target: 'p0c0' });
    s.players[0].axHand = ['flux-plays-plus-1'];
    const p = check(s, { type: 'axiom', choice: 'flux-plays-plus-1' }); assert.match(p.lines.join(' '), /2 → 3/);
});

test('changing hidden hands, deck order and RNG seed cannot change preview output', () => {
    const s = setup({ p0: ['beastie', 'astrophysicat', 'beansprout'], p1: ['keanu', 'muskrat', 'beansprout'] });
    onBoard(s, 'p0c0', 'p1c0'); toHand(s, 'p1c1');
    const a = { type: 'attack', player: 0, cid: 'p0c0', target: 'p1c0' }, original = E.previewAction(s, a, 0);
    const hidden = E.cloneState(s); hidden.seed = 'PRIVATE-RNG-SECRET'; hidden.players[0].deck.reverse(); hidden.players[1].deck.reverse();
    hidden.cards.p1c1.species = 'PRIVATE-HAND-SECRET'; hidden.players[1].axHand = ['PRIVATE-AXIOM-SECRET'];
    assert.deepEqual(J(E.previewAction(hidden, a, 0)), J(original));
    assert.ok(!JSON.stringify(E.previewAction(hidden, a, 0)).includes('PRIVATE-'));
});

test('draws and direct private-zone reads stop before hidden identities or their consequences are resolved', () => {
    for (const id of ['look-it-up', 'test-private-read']) {
        if (id === 'test-private-read') R.data.tactics[id] = { name: 'Read fixture', cost: 1, text: 'Test.', run: api => api.emit({ t: 'tactic', text: api.cardName(api.s.players[1].hand[0]) }) };
        const s = setup({ p0: ['keanu'], p1: ['muskrat'], t0: [id], axioms: ['infinity'] }); toHand(s, 'p0t0', 'p1c0');
        const before = JSON.stringify(s), p = E.previewAction(s, { type: 'play', player: 0, cid: 'p0t0' }, 0);
        assert.equal(p.complete, false); assert.match(p.reason, /unknown/); assert.equal(JSON.stringify(s), before);
        assert.ok(!p.lines.join(' ').includes('Elon'));
    }
    delete R.data.tactics['test-private-read'];
});

test('random branches, hidden conditional identities and pending choices remain explicitly conditional', () => {
    R.data.tactics['test-preview-random'] = { name: 'Random fixture', cost: 1, text: 'Test.', run: api => api.damage('h1', api.rng.int(1, 8)) };
    const s = setup({ p0: ['beastie'], p1: ['keanu'], t0: ['test-preview-random'] }); onBoard(s, 'p0c0', 'p1c0'); toHand(s, 'p0t0');
    const p = E.previewAction(s, { type: 'play', player: 0, cid: 'p0t0' }, 0); assert.equal(p.complete, false); assert.match(p.reason, /random/);
    assert.equal(p.frames.at(-1).view.players[1].hearts, 10);
    s.players[1].armed = ['p1t-hidden']; s.cards['p1t-hidden'] = { cid: 'p1t-hidden', kind: 'tactic', tactic: 'SECRET-A', owner: 1, controller: 1 };
    const a = { type: 'attack', player: 0, cid: 'p0c0', target: 'p1c0' }, h = E.previewAction(s, a, 0);
    s.cards['p1t-hidden'].tactic = 'SECRET-B'; assert.deepEqual(J(E.previewAction(s, a, 0)), J(h)); assert.match(h.reason, /concealed/);
    s.players[1].armed = []; delete s.cards['p1t-hidden'];
    R.data.tactics['test-preview-choice'] = { name: 'Choice fixture', cost: 1, text: 'Test.', run: api => api.ask({ kind: 'colour', player: 0, options: ['reason', 'emotion'] }) };
    const c = setup({ t0: ['test-preview-choice'] }); toHand(c, 'p0t0');
    const choice = E.previewAction(c, { type: 'play', player: 0, cid: 'p0t0' }, 0); assert.equal(choice.complete, false); assert.match(choice.reason, /choice/);
    delete R.data.tactics['test-preview-random']; delete R.data.tactics['test-preview-choice'];
});
