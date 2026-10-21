import test from 'node:test';
import assert from 'node:assert/strict';
import { E, Rift as R, AI, setup, act, pass, onBoard, toHand, rule } from './battle-helpers.mjs';
import { loadRift } from './harness.mjs';
const J = x => JSON.parse(JSON.stringify(x));
const flux = (key, delta) => 'flux-' + key + '-' + (delta > 0 ? 'plus-' : 'minus-') + Math.abs(delta);
function cast(s, id) { s.players[s.active].axHand.push(id); return act(s, { type: 'axiom', choice: id }); }
const fresh = () => setup({ p0: ['keanu', 'keanu'], p1: ['keanu'], energy: 10, options: { hearts: 100 } });

test('every relative card composes at all finite bounds; previews are pure and match paid casts', () => {
    const keys = { plays: 'plays', draw: 'draw', energy: 'growth', cost: 'cost' };
    for (const [cat, def] of Object.entries(E.NUMERIC_RULES)) for (let value = def.min; value <= def.max; value++) for (const delta of [-2, -1, 1, 2]) {
        let s = fresh(), id = flux(keys[cat], delta);
        s.axioms.active[cat] = id; s.axioms.numeric = { [cat]: { id, value } };
        const snapshot = JSON.stringify(s), preview = E.axiomPreview(s, id);
        const expected = Math.max(def.min, Math.min(def.max, value + delta));
        assert.equal(preview.before, value); assert.equal(preview.after, expected);
        const projected = E.projectAxiom(s, id);
        assert.equal(E.rules(projected)[def.field], expected);
        assert.equal(JSON.stringify(s), snapshot, 'projection does not alter cards, bonuses, hooks or cursor');
        s.players[0].axHand = [id];
        assert.equal(E.legalActions(s).some(a => a.type === 'axiom'), expected !== value);
        if (expected === value) { assert.match(preview.reason, /bounds/); continue; }
        s = act(s, { type: 'axiom', choice: id });
        assert.equal(E.rules(s)[def.field], expected); assert.equal(E.rules(J(s))[def.field], expected);
        assert.equal(s.players[0].playsThisTurn, 1); assert.equal(s.players[0].energy, 10 - Math.abs(delta));
    }
});

test('repeated IDs invalidate memo, clone independently, preserve spent uses and keep owner bonuses separate', () => {
    let s = fresh(), id = flux('plays', 1);
    s.players[0].extraPlays = 2;
    s = cast(s, id); assert.equal(E.rules(s).playLimit, 3); assert.equal(E.playLimit(s, 0), 5); assert.equal(E.playLimit(s, 1), 3);
    const before = s; s = cast(s, id);
    assert.equal(E.rules(s).playLimit, 4); assert.equal(E.rules(before).playLimit, 3);
    assert.equal(s.players[0].playsThisTurn, 2); assert.equal(E.playsLeft(s, 0), 4);
    assert.equal(s.axioms.discard.filter(x => x === id).length, 1);
    s.axioms.numeric.plays.value = 5; assert.equal(E.rules(s).playLimit, 5, 'in-place record edits cannot reuse a stale memo');
    assert.equal(E.rules(before).playLimit, 3);
    s = cast(s, flux('plays', -2)); assert.equal(E.rules(s).playLimit, 3); assert.equal(E.playsLeft(s, 0), 2);
    s.players[0].playsThisTurn = 5; s.players[0].axHand.push(id);
    assert.ok(!E.legalActions(s).some(a => a.type === 'axiom'), 'no bootstrapping a bonus from zero uses');
});

test('Unlimited ignores deltas without charge; finite repair and Spare Axiom reset values without refund', () => {
    let s = fresh(); s = cast(s, 'infinity');
    const id = flux('plays', -2), p = E.axiomPreview(s, id);
    assert.equal(p.changed, false); assert.match(p.reason, /Unlimited stays Unlimited/);
    assert.equal(s.axioms.numeric.plays.value, 'unlimited'); assert.equal(E.rules(J(s)).playLimit, Infinity);
    s.players[0].axHand.push(id); const snap = JSON.stringify(s);
    assert.throws(() => act(s, { type: 'axiom', choice: id }), /Illegal/); assert.equal(JSON.stringify(s), snap);
    s.players[0].extraPlays = 2; s = cast(s, 'plenty');
    assert.equal(E.rules(s).playLimit, 3); assert.equal(E.playsLeft(s, 0), 3);
    s = cast(s, flux('plays', -2)); assert.equal(E.rules(s).playLimit, 1); assert.equal(E.playsLeft(s, 0), 0);
    s.players[0].extraPlays = 4; s = cast(s, 'spare-axiom');
    assert.equal(E.rules(s).playLimit, 2); assert.deepEqual(J(s.axioms.numeric), {});
    assert.equal(s.players[0].playsThisTurn, 4); assert.equal(s.players[0].extraPlays, 4);
});

test('a numeric return to basics is basic despite provenance, and malformed modifiers cannot mutate rules', () => {
    let s = E.projectAxiom(E.projectAxiom(fresh(), flux('draw', 1)), flux('draw', -1));
    assert.equal(E.rules(s).drawCount, 1); assert.equal(E.changedAxioms(s).length, 0);
    assert.equal(E.axiomWouldChange(s, 'spare-axiom'), false);
    assert.equal(E.axiomWouldChange(s, 'two-plays'), false);
    assert.equal(E.axiomPreview(s, 'two-plays').after, 2);
    const returned = E.projectAxiom(E.projectAxiom(fresh(), flux('plays', 1)), flux('plays', -1));
    assert.equal(E.axiomWouldChange(returned, 'two-plays'), false, '2 → 2 fixed repair cannot be charged under delta provenance');
    for (const bad of [{ category: 'plays', modifier: { field: 'hearts', delta: 1 } }, { category: 'plays', modifier: { field: 'playLimit', delta: 100 } }, { category: 'victory', modifier: { field: 'reverseHearts', delta: 1 } }]) {
        R.data.axioms['bad-flux'] = { ...bad, id: 'bad-flux' };
        assert.equal(E.axiomWouldChange(s, 'bad-flux'), false);
        assert.equal(E.rules(E.projectAxiom(s, 'bad-flux')).playLimit, 2);
    }
    delete R.data.axioms['bad-flux'];
});

test('Fate resolves a delta against the current value, consumes ineffective flips and resets numeric state', () => {
    const id = flux('plays', 1);
    let s = setup({ p0: ['keanu'], p1: ['keanu'], axioms: [id], options: { timeline: true, fateStart: 1, fateGap: 1, hearts: 100 } });
    assert.equal(s.fate.next, id);
    s = E.projectAxiom(s, 'plenty'); s = pass(pass(s));
    assert.equal(E.rules(s).playLimit, 4); assert.equal(s.axioms.active.plays, id);
    s = pass(pass(s)); assert.equal(E.rules(s).playLimit, 2); assert.deepEqual(J(s.axioms.numeric), {});
    let u = setup({ axioms: [id], options: { timeline: true, fateStart: 1, hearts: 100 } });
    u = E.projectAxiom(u, 'infinity'); u = pass(pass(u));
    assert.equal(E.rules(u).playLimit, Infinity); assert.equal(u.axioms.active.plays, 'infinity');
    assert.ok(u.axioms.discard.includes(id));
    assert.ok(E.fullLog(u).some(e => e.t === 'axiom-no-change' && /Unlimited/.test(e.text)));
});

test('draw, growth and creature costs apply at the correct timing and keep other costs unchanged', () => {
    let s = fresh(); toHand(s, 'p0c0');
    const cost = E.playCost(s, 'p0c0'), cap = s.players[0].capacity;
    s = cast(s, flux('cost', -2)); assert.equal(E.playCost(s, 'p0c0'), Math.max(0, cost - 2));
    assert.equal(E.axiomCost(s, 'infinity', 0), R.data.axioms.infinity.cost);
    s.players[0].playsThisTurn = 0; s = cast(s, flux('growth', -2));
    assert.equal(s.players[0].capacity, cap, 'current capacity is not retroactively changed');
    s = pass(pass(s)); assert.equal(s.players[0].capacity, cap - 1);
    s = E.projectAxiom(s, flux('draw', 2)); s.players[0].deck = []; s.axioms.deck = [];
    s.phase = 'draw'; s.players[0].drawn = false;
    const hearts = s.players[0].hearts; s = act(s, { type: 'draw', choice: 'none' });
    assert.equal(s.players[0].hearts, hearts - s.players[0].exhaustion, 'exhaustion charges once per normal draw, not once per requested card');
});

test('new defaults, legacy migration, rare reward, exact decks and team/backup codes remain compatible', async () => {
    const r = loadRift(['js/core/rift.js', 'js/core/state.js', 'js/core/world.js', 'data/creatures.js', 'data/tactics.js', 'data/items.js', 'data/map.js', 'data/axioms.js', 'data/starters.js', 'js/battle/team-codes.js']);
    const S = r.State, s = S.freshState();
    assert.ok(!S.ownedAxioms(s).includes('infinity'));
    assert.ok(r.data.flux.ids.every(id => S.ownedAxioms(s).includes(id)));
    assert.deepEqual(J(S.axiomLoadout(s)), J(r.data.starterDecks.axioms));
    s.axioms = ['age-of-wonder']; assert.deepEqual(J(S.axiomLoadout(s)), J(r.data.axiomDecks.default), 'earned pool order does not substitute a different fallback');
    const legacy = J(s); legacy.version = 4; delete legacy.cardPrints; legacy.axiomLoadout = ['infinity', 'infinity', ...r.data.axiomDecks.legacyStarter.filter(id => id !== 'infinity').slice(0, 8)];
    const migrated = S.migrate(legacy); assert.ok(S.ownedAxioms(migrated).includes('infinity')); assert.deepEqual(J(migrated.axiomLoadout), legacy.axiomLoadout);
    const twice = S.migrate(J(migrated)); assert.deepEqual(J(twice.axioms), J(migrated.axioms));
    const imported = S.migrate(S.decode('save', S.encode('save', migrated))); assert.deepEqual(J(imported.axiomLoadout), legacy.axiomLoadout);
    const storage = new Map(); r.storage = () => ({ getItem: k => storage.get(k) || null, setItem: (k, v) => storage.set(k, v), removeItem: k => storage.delete(k) });
    S.newGame(); S.update(out => Object.assign(out, J(legacy), { version: 4, cardPrints: undefined }));
    const packed = await S.exportCode(); assert.match(packed, /^ROR2/);
    await S.importCode(packed); assert.deepEqual(J(S.axiomLoadout()), legacy.axiomLoadout);
    assert.ok(S.ownedAxioms().includes('infinity'));
    const code = r.Battle.TeamCodes.exportTeam({ creatures: [S.makeCreature('keanu')], tactics: [], axioms: legacy.axiomLoadout });
    assert.deepEqual(J(r.Battle.TeamCodes.importTeam(code).axioms), legacy.axiomLoadout);
    const implicit = S.migrate({ ...J(s), version: 4, cardPrints: undefined, axiomLoadout: [] }); assert.ok(S.ownedAxioms(implicit).includes('infinity'));
    const reward = r.World.claimTrainerReward(s, 'constable'); assert.equal(reward.axiom, 'infinity');
    assert.equal(r.World.claimTrainerReward(s, 'constable'), null); assert.equal(s.axioms.filter(id => id === 'infinity').length, 1);
});

test('generated contributions have seven modifiers and rare eligible Infinity, without changing explicit selections', () => {
    let infinity = 0;
    for (let i = 0; i < 2000; i++) for (const eligible of [false, true]) {
        const deck = R.data.flux.contribution('policy-' + i, eligible);
        assert.equal(deck.length, 10); assert.equal(new Set(deck).size, 10);
        assert.equal(deck.filter(id => R.data.axioms[id].modifier).length, 7);
        assert.deepEqual(J(deck), J(R.data.flux.contribution('policy-' + i, eligible)));
        if (!eligible) assert.ok(!deck.includes('infinity')); else infinity += deck.includes('infinity');
    }
    assert.ok(infinity > 400 && infinity < 600, String(infinity));
    let s = fresh(); const exact = ['infinity', 'infinity', ...R.data.axiomDecks.default.slice(0, 8)];
    assert.deepEqual(J(E.axiomSelection(exact)), exact);
});

test('Competent and Expert consider an effective repeated cost reduction that develops two creatures', () => {
    let s = setup({ p0: ['keanu', 'keanu'], p1: ['beastie'], energy: 3 });
    toHand(s, 'p0c0', 'p0c1'); rule(s, 'plenty'); s = E.projectAxiom(s, flux('cost', -1));
    s.players[0].axHand = [flux('cost', -1)];
    for (const level of ['competent', 'expert']) {
        const a = AI.choose(s, { level }); assert.equal(a.type, 'axiom'); assert.equal(a.choice, flux('cost', -1));
        let after = E.applyAction(s, a);
        after = act(after, { type: 'play', cid: 'p0c0' }); after = act(after, { type: 'play', cid: 'p0c1' });
        assert.equal(after.players[0].board.length, 2); assert.equal(after.players[0].energy, 0);
    }
});

test('normal multi-draw respects hand space and owner bonuses reset on the next own turn', () => {
    let s = setup({ p0: Array(5).fill('keanu'), p1: ['keanu'], options: { handLimit: 3, hearts: 100 } });
    s = E.projectAxiom(s, flux('draw', 2)); toHand(s, 'p0c0'); s.phase = 'draw';
    s = act(s, { type: 'draw', choice: 'deck' }); assert.equal(s.players[0].hand.length, 3);
    s.players[0].extraPlays = 2; s.players[0].playsThisTurn = 4;
    s = pass(pass(s)); assert.equal(s.players[0].extraPlays, 0); assert.equal(s.players[0].playsThisTurn, 0);
});

test('a conditional watching a relative rule resolves once after the paid change, without another use', () => {
    R.data.tactics['flux-watcher'] = { name: 'Watcher', cost: 1, text: 'Test fixture.', conditional: { visibility: 'face-up',
        options: [{ key: 'axiom-replaced:self', event: 'axiom-replaced', actor: 'self', label: 'Your rule changes' }], run: (api, p) => api.draw(p) } };
    let s = setup({ p0: ['keanu'], t0: ['flux-watcher'] }); toHand(s, 'p0t0');
    s = act(s, { type: 'play', cid: 'p0t0' });
    const count = s.players[0].hand.length; s = cast(s, flux('plays', 2));
    assert.equal(E.rules(s).playLimit, 4); assert.equal(s.players[0].playsThisTurn, 2);
    assert.equal(s.players[0].hand.length, count + 1); assert.equal(s.players[0].armed.length, 0);
    assert.equal(s.cards.p0t0.conditionSpent, true); delete R.data.tactics['flux-watcher'];
});
