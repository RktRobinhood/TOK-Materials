import test from 'node:test';
import assert from 'node:assert/strict';
import { loadRift } from './harness.mjs';

function game() {
    const R = loadRift(['js/core/rift.js', 'js/core/state.js', 'data/creatures.js', 'data/tactics.js', 'data/axioms.js', 'data/starters.js']);
    return { R, S: R.State, s: R.State.freshState() };
}
const plain = x => JSON.parse(JSON.stringify(x));

test('new grants are individual normal/foil prints with four-copy caps independent of rarity', () => {
    const { R, S, s } = game();
    R.data.tactics['peer-review'].rarity = 'legendary';
    for (const kind of ['tactic', 'axiom']) {
        const id = kind === 'tactic' ? 'peer-review' : 'infinity';
        assert.equal(S.cardCopies(kind, id, s), 0);
        for (let i = 0; i < 4; i++) assert.equal(S.grantPrint(kind, id, s, { foil: !!(i % 2) }), true);
        assert.deepEqual(plain(S.printsOf(kind, id, s)), [false, true, false, true]);
        assert.equal(S.grantPrint(kind, id, s), false);
        assert.equal(S.cardRoom(kind, id, s), 0);
    }
    assert.equal(S.grantPrint('creature', 'beastie', s), false, 'caught instances use their existing inventory');
    assert.equal(S.grantPrint('axiom', 'no-such-card', s), false);
    assert.equal(S.grantPrint('tactic', '__proto__', s), false);
    assert.equal(S.grantPrint('axiom', 'toString', s), false);
});

test('legacy unlocks/defaults reconcile once and preserve loadouts, captures and excess copies', () => {
    const { R, S } = game(), old = S.freshState();
    old.version = 5; delete old.cardPrints;
    old.tactics = ['peer-review']; old.axioms = ['infinity'];
    old.deckTactics = ['peer-review', 'peer-review']; old.axiomLoadout = ['infinity', 'infinity'];
    old.creatures = Array.from({ length: 6 }, (_, i) => S.makeCreature('beastie', { uid: 'old-' + i, foil: i === 1, changes: [{ id: 'kept' }] }));
    const captures = JSON.stringify(old.creatures), migrated = S.migrate(old);
    for (const id of R.data.tacticDecks.starter.concat('peer-review')) assert.equal(S.cardCopies('tactic', id, migrated), 2);
    for (const id of R.data.axiomDecks.starter.concat('infinity')) assert.equal(S.cardCopies('axiom', id, migrated), 2);
    assert.equal(JSON.stringify(migrated.creatures), captures);
    assert.deepEqual(plain(migrated.deckTactics), ['peer-review', 'peer-review']);
    assert.deepEqual(plain(migrated.axiomLoadout), ['infinity', 'infinity']);
    migrated.deckTactics = ['pep-talk'];
    assert.equal(S.releasePrint('tactic', 'peer-review', 0, migrated), true);
    assert.equal(S.releasePrint('tactic', 'peer-review', 0, migrated), true);
    const again = S.migrate(plain(migrated));
    assert.equal(S.cardCopies('tactic', 'peer-review', again), 0, 'historical unlock IDs do not refill retired prints');
    assert.equal(S.cardCopies('tactic', 'peer-review', S.migrate(plain(again))), 0);
    assert.equal(S.cardCopies('tactic', 'counterexample', again), 2, 'default entitlement is retained');
});

test('one rewarded copy allows one deck copy and releasing cannot break a saved loadout', () => {
    const { S, s } = game(); S.grantTactic('peer-review', s);
    assert.equal(S.cardCopies('tactic', 'peer-review', s), 1);
    const check = S.validateDeck({ creatures: [], tactics: ['peer-review', 'peer-review'] }, { complete: false, ownedCounts: S.printCounts('tactic', s) });
    assert.ok(check.problems.some(x => x.code === 'unowned-copies'));
    s.deckTactics = ['peer-review'];
    assert.equal(S.releasePrint('tactic', 'peer-review', 0, s), false);
    S.grantTactic('peer-review', s, { foil: true });
    assert.equal(S.releasePrint('tactic', 'peer-review', 0, s), true);
    assert.deepEqual(plain(S.printsOf('tactic', 'peer-review', s)), [true]);
    assert.equal(S.releasePrint('tactic', 'peer-review', 0, s), false);
    assert.equal(S.cardRoom('tactic', 'peer-review', s), 3);
});

test('colour unlock and avatar starter receipts never refill on repeat calls or migration', () => {
    const { S, s } = game(); s.avatar = { type: 'owlet', variant: 'boy' };
    const receipt = S.grantStarter(s); assert.ok(receipt);
    const counts = {};
    receipt.tactics.forEach(id => { counts[id] = (counts[id] || 0) + 1; });
    Object.entries(counts).forEach(([id, n]) => assert.ok(S.cardCopies('tactic', id, s) >= n));
    S.unlockColourTactics(s);
    const before = JSON.stringify(s.cardPrints);
    assert.equal(S.grantStarter(s), null); S.unlockColourTactics(s); S.migrate(s);
    assert.equal(JSON.stringify(s.cardPrints), before);
});

test('normal/foil print state and empty folders survive ROR1 and compressed backup import', async () => {
    const { S, s } = game();
    S.grantTactic('peer-review', s, { foil: true });
    S.grantAxiom('infinity', s, { foil: true });
    s.deckTactics = ['pep-talk'];
    S.releasePrint('tactic', 'clockwork', 0, s); S.releasePrint('tactic', 'clockwork', 0, s);
    const expected = plain(s.cardPrints);
    for (const code of [S.encode('save', s), await S.encodePacked('save', s)]) {
        const back = S.migrate(await S.decodeAsync('save', code));
        assert.deepEqual(plain(back.cardPrints), expected);
        assert.equal(S.cardCopies('tactic', 'clockwork', back), 0);
    }
});

test('Axiom loadouts need actual copies; malformed print ledgers fail before changing a save', () => {
    const { S, s } = game(); S.grantAxiom('infinity', s);
    const check = S.validateDeck({ axioms: ['infinity', 'infinity'] }, { complete: false, ownedAxiomCounts: S.printCounts('axiom', s) });
    assert.ok(check.problems.some(x => x.part === 'axioms' && x.code === 'unowned-copies'));
    s.axiomLoadout = ['infinity']; assert.equal(S.releasePrint('axiom', 'infinity', 0, s), false);
    for (const bad of [true, [], { tactic: 3 }, { axiom: { infinity: [false, 'foil'] } }, { ready: { tactic: 'yes' } }]) {
        assert.throws(() => S.checkSave({ ...plain(s), cardPrints: bad }), /damaged/);
    }
    s.cardPrints.tactic['peer-review'] = [false, true, false, false, true, false];
    const back = S.checkSave(plain(s));
    assert.equal(S.cardCopies('tactic', 'peer-review', back), 6, 'excess historical copies are never trimmed');
    assert.equal(S.cardRoom('tactic', 'peer-review', back), 0);
});

test('trainer and story card receipts grant actual copies once, without refilling released rewards', () => {
    const R = loadRift(['js/core/rift.js', 'js/core/state.js', 'js/core/world.js', 'data/creatures.js', 'data/tactics.js', 'data/axioms.js', 'data/map.js', 'data/starters.js']);
    const S = R.State, s = S.freshState(); s.avatar = { type: 'owlet', variant: 'girl' }; S.grantStarter(s);
    const trainer = R.World.claimTrainerReward(s, 'constable');
    assert.equal(trainer.axiom, 'infinity'); assert.equal(S.cardCopies('axiom', 'infinity', s), 1);
    assert.equal(R.World.claimTrainerReward(s, 'constable'), null);
    assert.equal(S.cardCopies('axiom', 'infinity', s), 1);
    const node = Object.keys(R.data.map.nodes).find(id => R.World.openCardSlots(s, id).length);
    assert.ok(node);
    const rewards = R.World.claimCards(s, node).filter(c => c.id);
    assert.ok(rewards.length);
    for (const reward of rewards) {
        assert.equal(S.cardCopies(reward.kind, reward.id, s), 1);
        assert.equal(S.releasePrint(reward.kind, reward.id, 0, s), true);
    }
    assert.deepEqual(plain(R.World.claimCards(s, node)), []);
    const back = S.migrate(plain(s));
    for (const reward of rewards) assert.equal(S.cardCopies(reward.kind, reward.id, back), 0);
    assert.deepEqual(plain(R.World.claimCards(back, node)), []);
});
