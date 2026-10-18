import test from 'node:test';
import assert from 'node:assert/strict';
import { loadRift } from './harness.mjs';
const R = loadRift(['js/core/rift.js', 'js/core/catch-net.js', 'js/core/catch-games.js']);
const C = R.CatchGames, json = v => JSON.stringify(v);

test('all three games, every rarity: deterministic layouts have replayable unassisted wins', () => {
    for (const kind of C.IDS) for (const rarity of C.RARITIES) for (let i = 0; i < 40; i++) {
        let b = C.create(kind, 'held-out:' + i, rarity, 'charm', false);
        const before = json(b);
        assert.equal(json(C.create(kind, 'held-out:' + i, rarity, 'charm', false)), before);
        const plan = C.solve(b);
        assert.ok(plan && plan.length, `${kind}/${rarity}/${i} is playable and winnable`);
        assert.equal(json(b), before, 'solver is pure');
        assert.equal(C.step(b, {}), null, 'invalid actions do not spend a move');
        for (const action of plan) {
            const result = C.step(b, action);
            assert.ok(result, `certificate action is legal: ${json(action)}`);
            b = result.board;
            if (b.done) break;
        }
        assert.equal(b.done, 'caught', `${kind}/${rarity}/${i}`);
        assert.equal(C.step(b, plan[0]), null, 'terminal boards cannot be played again');
    }
});

test('assistance preserves the exact layout and adds a visible action or mistake budget', () => {
    for (const kind of C.IDS) for (const rarity of C.RARITIES) for (let i = 0; i < 10; i++) {
        const base = C.create(kind, 'help:' + i, rarity, 'charm', false);
        for (const [item, lure, extra] of [['greatcharm', false, 1], ['charm', true, 1], ['greatcharm', true, 2]]) {
            let assisted = C.create(kind, 'help:' + i, rarity, item, lure);
            const field = kind === 'net' ? 'casts' : kind === 'lure' ? 'moves' : 'lives';
            assert.equal(kind === 'net' ? assisted.cfg[field] : assisted[field], (kind === 'net' ? base.cfg[field] : base[field]) + extra);
            for (const action of C.solve(base)) {
                if (assisted.done) break;
                assisted = C.step(assisted, action).board;
            }
            assert.equal(assisted.done, 'caught', 'help cannot invalidate a winning plan');
        }
    }
});

test('trail cells use clues, flags and explicit mistakes; flagging alone never wins', () => {
    let b = C.create('tracks', 'flags', 'rare', 'greatcharm', false);
    const trap = b.traps[0];
    const flag = C.step(b, { cell: trap, flag: true });
    assert.equal(flag.board.turn, 0);
    assert.equal(flag.board.done, null);
    assert.equal(C.step(flag.board, { cell: trap }), null);
    b = C.step(b, { cell: trap }).board;
    assert.equal(b.mistakes, 1);
    assert.equal(b.done, null, 'Great Charm forgives one trap');
    assert.equal(C.step(b, { cell: trap, flag: true }), null, 'a revealed trap cannot be hidden or charged twice');
    b = C.step(b, { cell: b.traps[1] }).board;
    assert.equal(b.done, 'escaped');
});

test('random game choice uses its own deterministic stream and reaches all three games', () => {
    const counts = Object.fromEntries(C.IDS.map(id => [id, 0]));
    for (let i = 0; i < 3000; i++) {
        const id = C.pick('attempt:' + i);
        counts[id]++;
        assert.equal(C.pick('attempt:' + i), id);
    }
    for (const n of Object.values(counts)) assert.ok(n > 850 && n < 1150, json(counts));
});

test('net rarity tightens budgets on the same terrain and behaviour; easier tiers cannot remove a policy win', () => {
    for (let i = 0; i < 40; i++) {
        let harder = null;
        for (const rarity of Array.from(C.RARITIES).reverse()) {
            const easier = C.create('net', 'rarity-paired:' + i, rarity, 'charm', false);
            if (harder) {
                assert.equal(json(easier.rocks), json(harder.rocks));
                assert.equal(easier.cfg.behaviour, harder.cfg.behaviour);
                assert.equal(easier.cfg.casts, harder.cfg.casts + 1);
                if (R.CatchNetPrototype.playSensible(harder)) assert.ok(R.CatchNetPrototype.playSensible(easier));
            }
            harder = easier;
        }
    }
});

test('Lantern Lure shows an actual joined route and enforces a finite turn budget', () => {
    assert.ok(C.IDS.includes('lure')); assert.ok(!C.IDS.includes('ricochet'));
    for (const rarity of C.RARITIES) {
        let b = C.create('lure', 'route-check', rarity, 'charm', false);
        assert.equal(C.lightPath(b).connected, false, 'never serve an already solved route');
        assert.equal(C.step(b, { cell: -1 }), null);
        assert.equal(C.step(b, { cell: 16 }), null);
        const left = b.moves, original = json(b.tiles);
        for (let i = 0; i < left; i++) {
            // Tile 3 cannot repair the deliberately closed entrance by itself.
            b = C.step(b, { cell: 3 }).board;
            if (b.done) break;
        }
        assert.equal(b.done, 'escaped');
        assert.equal(b.turn, left);
        b = C.create('lure', 'route-check', rarity, 'charm', false);
        assert.equal(json(b.tiles), original);
        for (const action of C.solve(b)) { if (!b.done) b = C.step(b, action).board; }
        assert.equal(b.done, 'caught');
        assert.equal(C.lightPath(b).connected, true);
        assert.equal(C.lightPath(b).path[0], 0);
        assert.equal(C.lightPath(b).path.at(-1), 15);
    }
});
