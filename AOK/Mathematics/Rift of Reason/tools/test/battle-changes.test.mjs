// Changes (#151): the engine records excess damage when a creature is defeated.
import test from 'node:test';
import assert from 'node:assert/strict';
import { E, setup, onBoard, act, plain, hp, atk } from './battle-helpers.mjs';

test('overkillOf: a defeated creature records how much damage went past its health', () => {
    // Muskrat (5 attack) hits Footnote Finch (2 health): 3 excess damage.
    let s = setup({ p0: ['muskrat'], p1: ['footnote-finch'] });
    onBoard(s, 'p0c0', 'p1c0');
    const excess = atk(s, 'p0c0') - hp(s, 'p1c0');
    assert.ok(excess >= 3);
    s = act(s, { type: 'attack', cid: 'p0c0', target: 'p1c0' });
    const uid = s.cards.p1c0.uid;
    assert.deepEqual(plain(E.lostUids(s, 1)), [uid]);
    assert.equal(E.overkillOf(s, 1)[uid], excess);
    assert.deepEqual(plain(E.overkillOf(s, 0)), {});
});
