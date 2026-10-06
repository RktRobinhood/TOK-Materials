// Creature variation (design/card-arena-2026-10-07.md, "Variation"), the v1 → v2 save
// migration, the own-deck rules and the engine using variant + taught tricks for battle stats.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { loadRift, GAME_DIR } from './harness.mjs';

const Rift = loadRift([
    'js/core/rift.js', 'js/core/state.js', 'data/creatures.js', 'data/items.js', 'data/axioms.js', 'data/tactics.js',
    'js/battle/abilities.js', 'js/battle/engine.js',
]);
const S = Rift.State, E = Rift.Battle.Engine;
const J = x => JSON.parse(JSON.stringify(x));

test('variant rolls are deterministic per uid and always in range', () => {
    for (let i = 0; i < 500; i++) {
        const v = S.rollVariant('uid-' + i);
        assert.deepEqual(J(v), J(S.rollVariant('uid-' + i)));
        assert.ok(S.isVariant(v), JSON.stringify(v));
    }
    assert.notDeepEqual(J([0, 1, 2, 3, 4].map(i => S.rollVariant('a' + i))), J([0, 1, 2, 3, 4].map(i => S.rollVariant('b' + i))));
});

test('variant distribution: attack 25/50/25, health 20/45/25/10, about one trait in eight', () => {
    const N = 20000;
    const att = { '-1': 0, 0: 0, 1: 0 }, hp = { '-1': 0, 0: 0, 1: 0, 2: 0 }, trait = { guard: 0, swift: 0, shield: 0, sturdy: 0 };
    let traits = 0;
    for (let i = 0; i < N; i++) {
        // uids shaped like makeCreature's: time-counter-random in base 36
        const v = S.rollVariant((1790000000000 + i * 977).toString(36) + '-' + i.toString(36) + '-' + (i * 7919 % 1e6).toString(36));
        att[v.attack]++; hp[v.health]++;
        if (v.trait) { traits++; trait[v.trait]++; }
    }
    const near = (got, want, tol) => assert.ok(Math.abs(got / N - want) < tol, got / N + ' vs ' + want);
    near(att[-1], 0.25, 0.02); near(att[0], 0.5, 0.02); near(att[1], 0.25, 0.02);
    near(hp[-1], 0.2, 0.02); near(hp[0], 0.45, 0.02); near(hp[1], 0.25, 0.02); near(hp[2], 0.1, 0.015);
    near(traits, 0.12, 0.015);
    Object.values(trait).forEach(n => assert.ok(n > traits * 0.18 && n < traits * 0.32));
});

test('labels and stars describe the roll in plain words', () => {
    const d = v => S.describeVariant({ variant: v });
    assert.deepEqual(J(d({ attack: 0, health: 0, trait: null })), { stars: 2, labels: ['Ordinary'], taught: null });
    assert.deepEqual(J(d({ attack: 1, health: 1, trait: null }).labels), ['Strong (+1 attack)', 'Hardy (+1 health)']);
    assert.equal(d({ attack: 1, health: 1, trait: null }).stars, 3);
    assert.equal(d({ attack: -1, health: 0, trait: null }).stars, 1);
    assert.ok(d({ attack: 0, health: 0, trait: 'guard' }).labels.includes('Natural Guard'));
    assert.ok(d({ attack: 0, health: 2, trait: 'sturdy' }).labels.includes('Sturdy (+1 health)'));
    assert.equal(S.describeVariant({ variant: { attack: 0, health: 0, trait: null }, taught: 'shield' }).taught, 'Learned: Shield');
    // Instances without a variant read as ordinary.
    assert.deepEqual(J(S.describeVariant({}).labels), ['Ordinary']);
});

test('migration v1 → v2: an old save fixture loads with variants from uids and new fields', () => {
    const old = JSON.parse(fs.readFileSync(GAME_DIR + '/tools/test/fixtures/save-v1.json', 'utf8'));
    const s = S.migrate(J(old));
    assert.equal(s.version, 2);
    assert.equal(s.creatures.length, 3);
    s.creatures.forEach((c, i) => {
        assert.deepEqual(J(c.variant), J(S.rollVariant(old.creatures[i].uid)));
        assert.equal(c.taught, null);
        assert.equal(c.powerDelta, old.creatures[i].powerDelta);
        assert.deepEqual(J(c.injuries), old.creatures[i].injuries);
    });
    assert.deepEqual(J(s.tactics), []);
    assert.deepEqual(J(s.deckTactics), []);
    assert.equal(s.items.charm, 2);
    assert.equal(s.flags['card-rules-version'], 2);
    // The same old save always gets the same variants, and a backup code round-trips.
    assert.deepEqual(J(S.migrate(J(old)).creatures), J(s.creatures));
    assert.deepEqual(J(S.migrate(S.decode('save', S.encode('save', s)))), J(s));
    // Defaults: battle team = first 10, tactics = the starter ten.
    assert.deepEqual(J(S.battleTeam(s).map(c => c.uid)), old.creatures.map(c => c.uid));
    assert.deepEqual(J(S.deckTactics(s)), J(Rift.data.tacticDecks.starter));
});

test('battleTeam and deckTactics honour choices and drop what is gone or not owned', () => {
    const s = S.freshState();
    for (let i = 0; i < 12; i++) s.creatures.push(S.makeCreature('khaby', { uid: 'k' + i }));
    assert.equal(S.battleTeam(s).length, 10);
    s.team = ['k11', 'k3', 'gone'];
    assert.deepEqual(J(S.battleTeam(s).map(c => c.uid)), ['k11', 'k3']);
    s.deckTactics = ['peer-review', 'eureka', 'eureka', 'eureka', 'nonsense'];
    assert.deepEqual(J(S.deckTactics(s)), ['eureka', 'eureka'], 'peer-review is not owned yet; at most 2 copies');
    s.tactics.push('peer-review');
    assert.deepEqual(J(S.ownedTactics(s)).slice(-1), ['peer-review']);
    assert.deepEqual(J(S.deckTactics(s)), ['peer-review', 'eureka', 'eureka']);
});

test('checkDeck: creatures + tactics = 20 with 6–14 of each; loans fill a small collection', () => {
    const c = (owned, team, tactics) => S.checkDeck({ owned, team, tactics });
    assert.equal(c(20, 10, 10).valid, true);
    assert.equal(c(20, 10, 10).message, 'Deck 20/20: 10 creatures + 10 tactics.');
    assert.equal(c(20, 14, 6).valid, true);
    assert.equal(c(20, 12, 10).valid, false);
    assert.match(c(20, 12, 10).message, /Remove 2 cards/);
    assert.match(c(20, 8, 10).message, /Add 2 more cards/);
    assert.match(c(20, 15, 5).message, /at least 6 tactic/);
    const small = c(4, 4, 10);
    assert.equal(small.valid, true);
    assert.equal(small.loans, 6);
    assert.equal(small.message, 'Deck 20/20: 4 creatures + 6 loaned + 10 tactics.');
    assert.match(c(4, 3, 10).message, /Pick all your creatures/);
    assert.equal(c(0, 0, 14).valid, true);
});

test('createBattle uses variant, natural traits and taught tricks for battle stats', () => {
    const lob = Rift.data.creatures.lobstorian, ast = Rift.data.creatures.astrophysicat, zuck = Rift.data.creatures.zuckerborg;
    const team = [
        { uid: 'a', species: 'astrophysicat', variant: { attack: 1, health: 2, trait: null }, taught: 'attack', injuries: [], powerDelta: 0 },
        { uid: 'b', species: 'astrophysicat', variant: { attack: 0, health: 0, trait: 'sturdy' }, taught: 'health', injuries: [], powerDelta: 0 },
        { uid: 'c', species: 'astrophysicat', variant: { attack: 0, health: 0, trait: 'swift' }, taught: 'shield', injuries: [], powerDelta: 0 },
        { uid: 'd', species: 'zuckerborg', variant: { attack: -1, health: -1, trait: null }, taught: null, injuries: [], powerDelta: -5 },
        { uid: 'e', species: 'lobstorian', variant: { attack: 0, health: 0, trait: 'guard' }, taught: 'guard', injuries: [], powerDelta: 0 },
    ];
    const s = E.createBattle({ seed: 'v', players: [{ team }, { team: [] }], options: { shuffle: false } });
    assert.equal(s.cards.p0c0.attack, ast.attack + 2);
    assert.equal(s.cards.p0c0.health, ast.health + 2);
    assert.equal(s.cards.p0c1.health, ast.health + 2);
    assert.deepEqual(J(E.keywordsOf(s, 'p0c2')).sort(), ['shield', 'swift']);
    assert.equal(s.cards.p0c3.attack, 0, 'attack never below 0');
    assert.equal(s.cards.p0c3.health, Math.max(1, zuck.health - 1), 'health never below 1');
    assert.deepEqual(J(E.keywordsOf(s, 'p0c4')), ['guard']);
    assert.equal(s.cards.p0c4.health, lob.health);
    // The Collection shows the same numbers the engine uses.
    team.forEach((inst, i) => {
        const st = S.creatureStats(inst);
        assert.equal(st.attack, s.cards['p0c' + i].attack);
        assert.equal(st.health, s.cards['p0c' + i].health);
        assert.deepEqual(J(st.keywords).sort(), J(E.keywordsOf(s, 'p0c' + i)).sort());
    });
    // Player tactics: the chosen list (≤2 copies) goes into the deck.
    const t = E.createBattle({ seed: 'v', players: [{ team, tactics: ['eureka', 'eureka', 'lemma'] }, { team: [] }], options: { shuffle: false } });
    assert.deepEqual(J(Object.values(t.cards).filter(c => c.kind === 'tactic' && c.owner === 0).map(c => c.tactic)), ['eureka', 'eureka', 'lemma']);
});
