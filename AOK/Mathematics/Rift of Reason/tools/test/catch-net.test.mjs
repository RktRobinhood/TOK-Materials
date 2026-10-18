import test from 'node:test';
import assert from 'node:assert/strict';
import { loadRift } from './harness.mjs';
const C = loadRift(['js/core/rift.js', 'js/core/catch-net.js']).CatchNetPrototype;
const json = v => JSON.stringify(v);

test('every served catch arena has a replayable winning certificate; previews leave it untouched', () => {
    for (const behaviour of C.BEHAVIOURS) for (let seed = 0; seed < 40; seed++) {
        const start = C.generate('verification:' + seed, behaviour);
        const saved = json(start);
        assert.equal(json(C.generate('verification:' + seed, behaviour)), saved, 'seed is deterministic');
        assert.ok(C.room(start).length >= 20, 'a real room to shrink, never pre-caught');
        const plan = C.solve(start);
        assert.ok(plan && plan.length <= start.cfg.casts, 'accepted seed has a legal certificate');
        let board = start;
        for (const cut of plan) {
            const result = C.preview(board, cut);
            assert.ok(result, 'certificate uses a currently available cut');
            assert.ok(!start.rocks.includes(result.board.cell), 'creature never enters terrain');
            assert.ok(result.path.every(cell => cell >= 0 && cell < 36), 'committed trace stays on the board');
            board = result.board;
        }
        assert.equal(board.done, 'caught');
        assert.ok(C.room(board).length <= start.cfg.target);
        assert.equal(json(start), saved, 'search/preview did not mutate live state or its RNG');
        assert.equal(C.preview(start, -1), null);
        assert.equal(C.preview(start, 10), null);
    }
});

test('charm and lure visibly add casts on the same terrain; the baseline never loses a prior win', () => {
    for (const behaviour of C.BEHAVIOURS) for (let seed = 0; seed < 30; seed++) {
        const plain = C.generate('paired:' + seed, behaviour);
        const great = C.generate('paired:' + seed, behaviour, true);
        const lure = C.generate('paired:' + seed, behaviour, false, true);
        const both = C.generate('paired:' + seed, behaviour, true, true);
        for (const assisted of [great, lure, both]) {
            assert.equal(json(assisted.rocks), json(plain.rocks));
            assert.equal(assisted.cell, plain.cell);
            assert.equal(assisted.dir, plain.dir);
            assert.ok(assisted.cfg.casts > plain.cfg.casts);
            if (C.playSensible(plain)) assert.ok(C.playSensible(assisted), 'assistance cannot remove a baseline win');
        }
        assert.equal(great.cfg.casts, 4);
        assert.equal(lure.cfg.casts, 4);
        assert.equal(both.cfg.casts, 5);
    }
});

test('a broken net spends one cast without building a wall; a finished net permanently partitions space', () => {
    const board = C.generate('collision-fixture', 'steady');
    // An open six-by-six room makes the collision independent of generation choices.
    Object.assign(board, { rocks: [], cell: 14, dir: 1, phase: 0, turn: 0, mask: 0 });
    const hit = C.preview(board, 2);
    assert.ok(hit.hit, 'right-facing creature crosses the net after column three');
    assert.equal(hit.board.turn, 1);
    assert.equal(hit.board.mask, 0);
    assert.equal(hit.area, 36);
    const safe = C.preview(board, 0);
    assert.ok(!safe.hit);
    assert.equal(safe.board.mask, 1);
    assert.equal(safe.area, 30, 'leftmost column is disconnected');
    assert.equal(C.preview(safe.board, 0), null, 'completed net cannot be cast again');
});
