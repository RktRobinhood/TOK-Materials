// Folders, release and random foils (#151): four copies of a type, protected release, won
// creatures that overflow a full folder, and the cosmetic foil field in saves and backups.
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadRift } from './harness.mjs';

function game() {
    const Rift = loadRift(['js/core/rift.js', 'js/core/state.js', 'data/creatures.js', 'data/fate.js', 'js/battle/ante.js']);
    const s = Rift.State.freshState();
    return { Rift, s };
}
const common = Rift => Object.keys(Rift.data.creatures).find(id => Rift.data.creatures[id].rarity === 'common');
const legend = Rift => Object.keys(Rift.data.creatures).find(id => Rift.data.creatures[id].rarity === 'legendary');

test('a folder holds four copies of a type; older saves above the cap keep every copy', () => {
    const { Rift, s } = game(), S = Rift.State, sp = common(Rift);
    assert.equal(S.COPY_CAP, 4);
    for (let i = 0; i < 4; i++) assert.equal(S.addCreature(s, S.makeCreature(sp)), true);
    assert.equal(S.hasRoom(s, sp), false);
    assert.equal(S.addCreature(s, S.makeCreature(sp)), false, 'a fifth copy is refused');
    assert.equal(S.copiesOf(s, sp), 4);
    s.creatures.push(S.makeCreature(sp), S.makeCreature(sp));   // a legacy save with six
    assert.equal(S.copiesOf(s, sp), 6, 'nothing is deleted to enforce the cap');
    assert.equal(S.addCreature(s, S.makeCreature(sp)), false);
});

test('release frees a slot, leaves the team consistent, warns for team copies and protects legendaries', () => {
    const { Rift, s } = game(), S = Rift.State, sp = common(Rift);
    const a = S.makeCreature(sp), b = S.makeCreature(sp), l = S.makeCreature(legend(Rift));
    s.creatures.push(a, b, l);
    s.team = [a.uid, l.uid];
    assert.match(S.releaseCheck(s, a.uid).warn, /battle team/);
    assert.equal(S.releaseCheck(s, b.uid).warn, null);
    assert.equal(S.releaseCheck(s, l.uid).ok, false, 'legendaries are keepsakes');
    assert.equal(S.releaseCreature(s, l.uid), false);
    assert.equal(S.releaseCreature(s, a.uid), true);
    assert.deepEqual(s.team, [l.uid], 'a released copy leaves the chosen team');
    assert.equal(s.creatures.some(c => c.uid === a.uid), false);
    assert.equal(S.releaseCreature(s, a.uid), false, 'releasing twice does nothing');
});

test('a won creature with no folder room becomes a Catch Charm, said plainly', () => {
    const { Rift, s } = game(), S = Rift.State, sp = common(Rift);
    for (let i = 0; i < 3; i++) S.addCreature(s, S.makeCreature(sp));
    const ante = { type: 'trainer', player: { items: { charm: 1 } }, opponent: { items: {}, creatures: [sp, sp], trophy: null } };
    const room = id => Math.max(0, S.COPY_CAP - S.copiesOf(s, id));
    const res = Rift.Battle.Ante.settle(ante, 'won', { seed: 'x', now: 1, room });
    assert.equal(res.creaturesGained.length, 1, 'one slot left');
    assert.equal(res.itemsDelta.charm, 1);
    assert.ok(res.lines.some(l => /folder is full.*Catch Charm/.test(l)));
    const before = s.items.charm;
    Rift.Battle.Ante.applyToSave(s, { mode: 'trainer', outcome: 'won', settlement: res });
    assert.equal(S.copiesOf(s, sp), 4);
    assert.equal(s.items.charm, before + 1);
    // A stale settlement (no room callback) still cannot overfill the folder.
    const stale = Rift.Battle.Ante.settle(ante, 'won', { seed: 'y', now: 2 });
    Rift.Battle.Ante.applyToSave(s, { mode: 'trainer', outcome: 'won', settlement: stale });
    assert.equal(S.copiesOf(s, sp), 4);
});

test('foil is a cosmetic field: off by default, no stat change, carried by backup codes', () => {
    const { Rift, s } = game(), S = Rift.State, sp = common(Rift);
    const plain = S.makeCreature(sp, { uid: 'same' }), shiny = S.makeCreature(sp, { uid: 'same', foil: true });
    assert.equal(plain.foil, false);
    assert.deepEqual(S.creatureStats(shiny), S.creatureStats(plain), 'foil never changes the numbers');
    assert.ok(Rift.data.fate.foilCatch > 0 && Rift.data.fate.foilCatch <= 0.1, 'shiny catches are rare');
    s.creatures.push(shiny);
    const back = S.decode('save', S.encode('save', s));
    assert.equal(back.creatures[0].foil, true);
});
