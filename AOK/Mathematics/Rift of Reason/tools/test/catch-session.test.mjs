import test from 'node:test';
import assert from 'node:assert/strict';
import { loadRift } from './harness.mjs';
const FILES = ['js/core/rift.js', 'js/core/state.js', 'js/core/world.js', 'js/core/catch-net.js', 'js/core/catch-games.js', 'js/core/catch-session.js', 'data/creatures.js', 'data/items.js'];
const J = b => JSON.parse(JSON.stringify(b));
function setup(store = new Map()) {
    const R = loadRift(FILES);
    R.storage = () => ({ getItem: k => store.get(k) || null, setItem: (k, v) => store.set(k, v), removeItem: k => store.delete(k) });
    if (store.size) R.State.load(); else R.State.newGame();
    return { R, store, S: R.CatchSession };
}
function visitor(g, kind) {
    g.R.State.update(s => {
        s.items.charm = 2; s.items.greatcharm = 2;
        g.S.offer(s, 'test', 'swiftlet', 'session-proof', false);
        s.catchOffers.test.kind = kind;
    });
    g.R.State.saveNow();
}
for (const kind of ['net', 'ricochet', 'tracks']) {
    test(`${kind}: a paid attempt resumes exactly and its win grants one creature without a luck roll`, async () => {
        let g = setup(); visitor(g, kind);
        const o = J(g.S.get('test'));
        assert.equal(g.R.State.get().items.charm, 2);
        assert.equal(g.S.start('test', 'charm', o.version).ok, true);
        assert.equal(g.S.start('test', 'charm', o.version).ok, false, 'double Start is rejected');
        assert.equal(g.R.State.get().items.charm, 1);
        const plan = g.R.CatchGames.solve(g.S.get('test').board);
        const first = plan.shift();
        g.S.play('test', first, g.S.get('test').version);
        const saved = J(g.S.get('test'));
        g = setup(g.store);
        assert.deepEqual(J(g.S.get('test')), saved, 'kind, board, item and progress survive reload');
        assert.equal(g.R.State.get().items.charm, 1);
        g.R.World.rollCatch = () => { throw new Error('A skill win must not roll catch odds'); };
        for (const action of plan) {
            if (g.S.get('test').receipt) break;
            assert.equal(g.S.play('test', action, g.S.get('test').version).ok, true);
        }
        const win = J(g.S.get('test'));
        assert.equal(win.receipt.outcome, 'caught');
        assert.equal(g.R.State.get().stats.catches, 1);
        assert.equal(g.R.State.get().creatures.length, 1);
        assert.equal(g.S.play('test', first, win.version).ok, false);
        g = setup(g.store);
        assert.equal(g.S.start('test', 'charm', g.S.get('test').version).ok, false);
        assert.equal(g.R.State.get().creatures.length, 1);
        const backup = await g.R.State.exportCode();
        await g.R.State.importCode(backup);
        assert.deepEqual(J(g.S.get('test')), win, 'backup carries settlement receipt');
        assert.equal(g.R.State.get().items.charm, 1);
    });
}
test('failed storage writes never spend or advance; an old tab cannot duplicate a paid try', () => {
    const g = setup(); visitor(g, 'tracks');
    const oldTab = setup(g.store), before = JSON.stringify(g.R.State.get());
    let conflicts = 0;
    oldTab.R.bus.on('state:conflict', () => conflicts++);
    const normalStorage = g.R.storage;
    g.R.storage = () => ({ getItem: k => g.store.get(k) || null, setItem() { throw new Error('full'); } });
    assert.equal(g.S.start('test', 'charm', 0).ok, false);
    assert.equal(JSON.stringify(g.R.State.get()), before);
    g.R.storage = normalStorage;
    assert.equal(g.S.start('test', 'charm', 0).ok, true);
    oldTab.R.State.update(s => { s.map.at = 'test'; });
    assert.notEqual(oldTab.R.State.get().map.at, 'test', 'ordinary mutations stop after a detected conflict');
    assert.ok(conflicts, 'UI is told to show a reload notice');
    assert.equal(oldTab.R.State.saveNow(), false, 'stale autosave cannot undo the paid write');
    assert.equal(oldTab.S.start('test', 'charm', 0).ok, false);
    assert.equal(JSON.parse(g.store.get(g.R.State.STORAGE_KEY)).items.charm, 1);
});
test('a write during expensive board admission is detected before publishing or charging', () => {
    const g = setup(); visitor(g, 'net');
    const other = setup(g.store), original = g.R.CatchGames.create;
    g.R.CatchGames.create = (...args) => {
        const board = original(...args);
        assert.equal(other.S.start('test', 'charm', 0).ok, true);
        return board;
    };
    assert.equal(g.S.start('test', 'charm', 0).ok, false);
    assert.equal(g.R.State.get().items.charm, 2, 'failed candidate never published');
    assert.equal(g.S.get('test').board, null);
    assert.equal(setup(g.store).R.State.get().items.charm, 1, 'other tab commit survives');
});
test('a failed final save grants nothing; repeating the same action after recovery settles once', () => {
    const g = setup(); visitor(g, 'net'); g.S.start('test', 'charm', 0);
    const plan = Array.from(g.R.CatchGames.solve(g.S.get('test').board));
    const last = plan.pop();
    for (const action of plan) g.S.play('test', action, g.S.get('test').version);
    const before = JSON.stringify(g.R.State.get()), normal = g.R.storage;
    g.R.storage = () => ({ getItem: k => g.store.get(k) || null, setItem() { throw new Error('full'); } });
    assert.equal(g.S.play('test', last, g.S.get('test').version).ok, false);
    assert.equal(JSON.stringify(g.R.State.get()), before);
    g.R.storage = normal;
    assert.equal(g.S.play('test', last, g.S.get('test').version).ok, true);
    assert.equal(g.R.State.get().creatures.length, 1);
    assert.equal(g.R.State.get().stats.catches, 1);
});
test('Fox perk is real assistance on the same board, without changing adventure health', () => {
    const g = setup(); visitor(g, 'tracks');
    const normal = g.S.preview('test', 'charm');
    g.R.State.update(s => { s.avatar = { type: 'fox' }; });
    const sly = g.S.preview('test', 'charm');
    assert.equal(sly.lives, normal.lives + 1);
    assert.deepEqual(J(sly.traps), J(normal.traps));
    g.S.start('test', 'charm', 0);
    g.S.play('test', { cell: sly.traps[0] }, g.S.get('test').version);
    assert.equal(g.S.get('test').board.done, null);
    assert.equal(g.R.State.get().health, 5);
});
test('a collection that fills during play returns the paid charm and never exceeds the copy cap', () => {
    const g = setup(); visitor(g, 'tracks'); g.S.start('test', 'charm', 0);
    const plan = g.R.CatchGames.solve(g.S.get('test').board);
    g.R.State.update(s => { for (let i = 0; i < 4; i++) g.R.State.addCreature(s, g.R.State.makeCreature('swiftlet')); });
    for (const action of plan) { if (g.S.get('test').receipt) break; g.S.play('test', action, g.S.get('test').version); }
    assert.equal(g.S.get('test').receipt.outcome, 'full');
    assert.equal(g.R.State.get().items.charm, 2);
    assert.equal(g.R.State.get().stats.catches, 0);
    assert.equal(g.R.State.get().creatures.length, 4);
});
test('escape is counted once; retry saves a new random selection before charging another charm', () => {
    const g = setup(); visitor(g, 'tracks'); g.S.start('test', 'charm', 0);
    const trap = g.S.get('test').board.traps[0];
    g.S.play('test', { cell: trap }, g.S.get('test').version);
    const version = g.S.get('test').version;
    assert.equal(g.R.State.get().stats.escapes, 1);
    assert.equal(g.S.play('test', { cell: trap }, version).ok, false);
    assert.equal(g.S.retry('test', version).ok, true);
    const retry = J(g.S.get('test'));
    assert.equal(retry.attempt, 2); assert.equal(retry.board, null);
    assert.equal(retry.kind, g.R.CatchGames.pick(retry.seed + ':attempt:2'));
    assert.deepEqual(J(setup(g.store).S.get('test')), retry);
    assert.equal(g.R.State.get().items.charm, 1);
});
