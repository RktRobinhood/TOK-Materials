import test from 'node:test';
import assert from 'node:assert/strict';
import { loadRift } from './harness.mjs';

const Rift = loadRift(['js/core/rift.js', 'js/core/state.js']);

test('seeded RNG is reproducible', () => {
    const a = Rift.makeRng('seed-1'), b = Rift.makeRng('seed-1');
    for (let i = 0; i < 50; i++) assert.equal(a.next(), b.next());
    assert.notEqual(Rift.makeRng('seed-2').next(), Rift.makeRng('seed-1').next());
});

test('weighted picks respect weights', () => {
    const rng = Rift.makeRng(7);
    const counts = { a: 0, b: 0 };
    for (let i = 0; i < 10000; i++) counts[rng.weighted({ a: 9, b: 1 })]++;
    assert.ok(counts.a > 8500 && counts.a < 9500, JSON.stringify(counts));
});

test('backup code round-trips a save', () => {
    const s = Rift.State.freshState();
    s.avatar = { type: 'owlet', variant: 'girl', nickname: 'Ærø' };
    s.creatures.push(Rift.State.makeCreature('lobstorian'));
    const code = Rift.State.encode('save', s);
    assert.match(code, /^ROR1\.save\./);
    assert.deepEqual(Rift.State.decode('save', code), JSON.parse(JSON.stringify(s)));
});

test('tampered or wrong-kind codes are rejected', () => {
    const code = Rift.State.encode('save', { version: 1, x: 1 });
    const parts = code.split('.');
    const tampered = [parts[0], parts[1], parts[2].slice(0, -2) + 'AA', parts[3]].join('.');
    assert.throws(() => Rift.State.decode('save', tampered), /typo|changed/);
    assert.throws(() => Rift.State.decode('team', code), /something else/);
    assert.throws(() => Rift.State.decode('save', 'hello'), /doesn't look like/);
});

test('migrate fills fields added since an old save', () => {
    const old = { version: 1, avatar: { type: 'fox', variant: 'boy' }, items: { charm: 9 } };
    const s = Rift.State.migrate(old);
    assert.equal(s.items.charm, 9);
    assert.equal(s.avatar.type, 'fox');
    assert.ok(Array.isArray(s.creatures));
    assert.equal(typeof s.stats.puzzlesSolved, 'number');
    assert.deepEqual(Object.keys(s.tutorialsSeen), []);
    s.tutorialsSeen.venn = true;
    assert.equal(Rift.State.migrate(s).tutorialsSeen.venn, true);
});
