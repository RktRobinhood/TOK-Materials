// Changes after battles (#151), ante and team codes.
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadRift } from './harness.mjs';

const Rift = loadRift([
    'js/core/rift.js', 'js/core/state.js', 'data/creatures.js', 'data/items.js', 'data/axioms.js', 'data/tactics.js', 'data/fate.js',
    'js/battle/abilities.js', 'js/battle/engine.js', 'js/battle/ai.js', 'js/battle/fate.js',
    'js/battle/ante.js', 'js/battle/team-codes.js',
]);
const { Engine: E, AI, Fate, Ante, TeamCodes } = Rift.Battle;
const J = x => JSON.parse(JSON.stringify(x));

let n = 0;
const inst = (species, extra) => Object.assign({ uid: 'm' + (++n), species, caughtAt: 0, powerDelta: 0, injuries: [], scars: [], warped: null, trophyOf: null, wins: 0 }, extra || {});
const TEN = ['lobstorian', 'astrophysicat', 'tremendoodle', 'swiftlet', 'muskrat', 'zuckerborg', 'altmanta', 'beastie', 'siuuugull', 'speedcheeta'];

// ---- Changes (#151) ------------------------------------------------------------------------

const ALL = { defeated: 1, survivor: 1, cap: 1 };
const F = Rift.data.fate;

test('Changes odds: 2% base, x3 in boss battles, x5 on 3+ overkill, capped at 30%; survivors 0.5%', () => {
    const C = F.chance;
    assert.equal(C.defeated, 0.02);
    assert.equal(Fate.chanceFor(C, 'trainer', true, 0), 0.02);
    assert.equal(Fate.chanceFor(C, 'ghost', true, 2), 0.02);
    assert.ok(Math.abs(Fate.chanceFor(C, 'boss', true, 0) - 0.06) < 1e-9);
    assert.ok(Math.abs(Fate.chanceFor(C, 'trainer', true, 3) - 0.1) < 1e-9);
    assert.equal(Fate.chanceFor(C, 'boss', true, 9), 0.3);
    assert.equal(Fate.chanceFor(C, 'trainer', false, 9), 0.005);
});

test('practice battles never change instances, and the ante is empty', () => {
    const team = TEN.map(x => inst(x));
    const before = J(team);
    const r = Fate.roll({ instances: team, defeated: team.map(c => c.uid), mode: 'practice', seed: 'p', chance: ALL });
    assert.deepEqual(J(r.instances), before);
    assert.equal(r.removed.length, 0);
    assert.equal(r.results.length, 0);
    assert.deepEqual(J(team), before, 'input untouched');
    const a = Ante.compute({ type: 'practice', player: { items: { charm: 5 } } });
    assert.deepEqual(J(Ante.settle(a, 'lost')), { itemsDelta: {}, creaturesGained: [], lines: [] });
    const save = { creatures: J(team), items: { charm: 5 }, stats: { battlesWon: 0, battlesLost: 0 } };
    Ante.applyToSave(save, { mode: 'practice', outcome: 'lost' });
    assert.deepEqual(save.creatures, before);
});

test('Changes are pure, never remove a creature, and never spend items', () => {
    const team = TEN.map(x => inst(x));
    const before = J(team);
    const r = Fate.roll({ instances: team, defeated: team.map(c => c.uid), mode: 'trainer', seed: 'pure', chance: ALL, items: { ward: 3 } });
    assert.deepEqual(J(team), before);
    assert.equal(r.instances.length, team.length);
    assert.deepEqual(J(r.removed), []);
    assert.deepEqual(J(r.itemsUsed), {});
    assert.equal(r.results.length, team.length);
});

test('nobody changes most of the time: "Everyone shook it off"', () => {
    const team = TEN.map(x => inst(x));
    const r = Fate.roll({ instances: team, defeated: team.slice(0, 3).map(c => c.uid), mode: 'trainer', seed: 'quiet' });
    if (!r.results.length) assert.deepEqual(J(r.log), ['Everyone shook it off.']);
    let changed = 0;
    for (let i = 0; i < 400; i++) changed += Fate.roll({ instances: team, defeated: team.slice(0, 3).map(c => c.uid), mode: 'trainer', seed: 'q' + i }).results.length;
    // 3 defeated × 2% + 7 survivors × 0.5% ≈ 0.095 per battle.
    assert.ok(changed > 10 && changed < 80, 'about 38 Changes in 400 battles, got ' + changed);
});

test('defeated creatures can get any kind; creatures that were not defeated only gain', () => {
    const team = Array.from({ length: 200 }, () => inst('lobstorian'));
    const fell = Fate.roll({ instances: team, defeated: team.map(c => c.uid), mode: 'trainer', seed: 'k', chance: ALL });
    const kinds = new Set(fell.results.map(r => r.kind));
    ['gain', 'loss', 'sideways', 'trade'].forEach(k => assert.ok(kinds.has(k), k));
    const stood = Fate.roll({ instances: team, defeated: [], mode: 'trainer', seed: 'k', chance: ALL });
    assert.ok(stood.results.length > 0);
    stood.results.forEach(r => { assert.equal(r.kind, 'gain'); assert.equal(r.defeated, false); });
});

test('overkill of 3+ boosts the odds (the engine side is in battle-changes.test.mjs)', () => {
    const team = Array.from({ length: 400 }, () => inst('lobstorian'));
    const ids = team.map(c => c.uid);
    const big = {}; ids.forEach(u => { big[u] = 3; });
    const plain = Fate.roll({ instances: team, defeated: ids, mode: 'trainer', seed: 'o' }).results.length;
    const over = Fate.roll({ instances: team, defeated: ids, overkill: big, mode: 'trainer', seed: 'o' }).results.length;
    assert.ok(over > plain * 2, `overkill ${over} vs plain ${plain}`);
});

test('limits: at most 2 Changes, ±2 attack and health, cost ±1 and never 0, attack ≥ 0, health ≥ 1', () => {
    for (let i = 0; i < 60; i++) {
        let team = Object.keys(Rift.data.creatures).slice(0, 30).map(id => inst(id));
        for (let round = 0; round < 4; round++) {
            team = Fate.roll({ instances: team, defeated: team.map(c => c.uid), mode: 'boss', seed: 'lim' + i + ':' + round, chance: ALL }).instances;
        }
        team.forEach(c => {
            assert.ok(c.changes.length <= F.limits.changes);
            assert.equal(new Set(c.changes.map(ch => ch.id)).size, c.changes.length);
            const sum = k => c.changes.reduce((n, ch) => n + (F.changes[ch.id][k] || 0), 0);
            assert.ok(Math.abs(sum('attack')) <= 2 && Math.abs(sum('health')) <= 2 && Math.abs(sum('cost')) <= 1);
            const sp = Rift.data.creatures[c.species], st = Rift.State.creatureStats(c);
            assert.ok(st.cost >= 1 && Math.abs(st.cost - sp.cost) <= 1);
            assert.ok(st.attack >= 0 && st.health >= 1);
            assert.ok(c.changes.filter(ch => F.changes[ch.id].sideways).length <= 1);
        });
    }
});

test('the engine and the save both honour Changes; a sideways Change swaps the ability', () => {
    const c = inst('lobstorian', { changes: [{ id: 'cracked-crown' }, { id: 'light-feet' }] });
    const sp = Rift.data.creatures.lobstorian;
    const st = Rift.State.creatureStats(c);
    assert.deepEqual([st.attack, st.health, st.cost], [sp.attack + 2, Math.max(1, sp.health - 1), Math.max(1, sp.cost - 1)]);
    const w = inst('lobstorian', { changes: [{ id: 'rift-freckles', ability: 'grook', from: sp.ability }] });
    const s = E.createBattle({ seed: 'x', players: [{ team: [c, w] }, { team: [] }], options: { shuffle: false } });
    assert.deepEqual([s.cards.p0c0.attack, s.cards.p0c0.health, s.cards.p0c0.cost], [st.attack, st.health, st.cost]);
    assert.equal(s.cards.p0c1.ability, 'grook');
    assert.equal(Ante.attackOf(c), st.attack);
});

test('loaned commons and creatures outside the instance list never change', () => {
    const team = [inst('lobstorian'), inst('swiftlet', { loaner: true })];
    const r = Fate.roll({ instances: team, defeated: ['loan-0-1', 'nobody', team[0].uid, team[1].uid], mode: 'trainer', seed: 'l', chance: ALL });
    assert.deepEqual(J(r.results.map(x => x.uid)), [team[0].uid]);
});

test('save migration from 2 heals injuries, turns a warp into a sideways Change and keeps scars', () => {
    const s = Rift.State.freshState();
    s.version = 2;
    s.creatures = [inst('lobstorian', { powerDelta: -1, injuries: ['minus-one', 'no-ability'], scars: ['chipped-ear'], warped: { ability: 'grook', from: 'lecture' } })];
    const m = Rift.State.migrate(J(s));
    const c = m.creatures[0];
    assert.equal(m.version, Rift.State.VERSION);
    assert.equal(c.powerDelta, 0);
    assert.deepEqual(J(c.injuries), []);
    assert.equal(c.warped, null);
    assert.deepEqual(J(c.changes), [{ id: 'rift-freckles', ability: 'grook', from: 'lecture' }]);
    assert.deepEqual(J(c.scars), ['chipped-ear']);
    assert.equal(Rift.State.creatureStats(c).ability, 'grook');
});

// ---- ante -------------------------------------------------------------------------------

test('trainer ante: real items change hands', () => {
    const a = Ante.compute({ type: 'trainer', player: { items: { charm: 3, tonic: 1 } }, opponent: { name: 'Sergeant Syllo', stake: { items: { greatcharm: 1 }, creatures: ['siuuugull'] } }, seed: 't' });
    assert.deepEqual(J(a.player.items), { charm: 1 });
    const won = Ante.settle(a, 'won', { seed: 't', now: 5 });
    assert.deepEqual(J(won.itemsDelta), { greatcharm: 1 });
    assert.equal(won.creaturesGained.length, 1);
    assert.equal(won.creaturesGained[0].species, 'siuuugull');
    const lost = Ante.settle(a, 'lost', { seed: 't' });
    assert.deepEqual(J(lost.itemsDelta), { charm: -1 });
    assert.deepEqual(J(Ante.settle(a, 'draw').itemsDelta), {});
});

test('boss ante: the player stakes two items', () => {
    const a = Ante.compute({ type: 'boss', player: { items: { charm: 1, tonic: 1 } }, opponent: { name: 'Boss' }, seed: 'b' });
    assert.deepEqual(J(a.player.items), { charm: 1, tonic: 1 });
    assert.ok(Object.keys(a.opponent.items).length > 0);
});

test('ghost ante: the winner gets a named trophy copy; nothing is taken from the classmate', () => {
    const ghostTeam = [inst('astrophysicat'), inst('muskrat', { powerDelta: -1 }), inst('beastie')];
    const a = Ante.compute({ type: 'ghost', player: { items: { charm: 2 } }, opponent: { name: "Ida's ghost", nickname: 'Ida', team: ghostTeam }, seed: 'g' });
    assert.ok(['muskrat', 'beastie'].includes(a.opponent.trophy.species));
    const won = Ante.settle(a, 'won', { seed: 'g', now: 0 });
    const trophy = won.creaturesGained.find(c => c.trophyOf);
    assert.equal(trophy.trophyOf, 'Ida');
    assert.match(trophy.uid, /^trophy-/);
    assert.equal(J(won.itemsDelta).charm, 1);
    const lost = Ante.settle(a, 'lost', { seed: 'g' });
    assert.equal(lost.creaturesGained.length, 0);
    assert.deepEqual(J(lost.itemsDelta), { charm: -1 });
});

test('ghost trophy: strongest by real attack, copying its variant and taught trick', () => {
    // Beastie (2 attack) + Strong variant + taught attack = 4 beats Astrophysicat (1).
    const ghostTeam = [inst('astrophysicat'), inst('beastie', { variant: { attack: 1, health: 2, trait: 'guard' }, taught: 'attack' })];
    const a = Ante.compute({ type: 'ghost', player: { items: { charm: 1 } }, opponent: { name: 'G', nickname: 'Gro', team: ghostTeam }, seed: 'tv' });
    assert.equal(a.opponent.trophy.species, 'beastie');
    const trophy = Ante.settle(a, 'won', { seed: 'tv', now: 0 }).creaturesGained.find(c => c.trophyOf);
    assert.deepEqual(J(trophy.variant), { attack: 1, health: 2, trait: 'guard' });
    assert.equal(trophy.taught, 'attack');
    assert.equal(Ante.attackOf(trophy), Rift.data.creatures.beastie.attack + 2);
    // Staked creatures won from trainers get their own uid-based variant.
    const t = Ante.compute({ type: 'trainer', player: { items: { charm: 1 } }, opponent: { name: 'T', stake: { items: {}, creatures: ['siuuugull'] } }, seed: 'tw' });
    const won = Ante.settle(t, 'won', { seed: 'tw' }).creaturesGained[0];
    assert.deepEqual(J(won.variant), J(Rift.State.rollVariant(won.uid)));
    assert.equal(won.taught, null);
});

test('applyToSave applies Changes and the ante to a save', () => {
    const team = [inst('lobstorian'), inst('swiftlet')];
    const save = { creatures: J(team), team: team.map(c => c.uid), items: { charm: 2, ward: 1 }, stats: { battlesWon: 0, battlesLost: 0 } };
    const fate = Fate.roll({ instances: save.creatures, defeated: [team[0].uid], mode: 'trainer', seed: 'x', chance: { defeated: 1, survivor: 0, cap: 1 } });
    const ante = Ante.compute({ type: 'trainer', player: { items: save.items }, opponent: { name: 'T' }, seed: 'x' });
    Ante.applyToSave(save, { mode: 'trainer', outcome: 'lost', fate, settlement: Ante.settle(ante, 'lost') });
    assert.deepEqual(save.creatures.map(c => c.uid), team.map(c => c.uid));
    assert.deepEqual(save.team, team.map(c => c.uid));
    assert.equal(save.creatures[0].changes.length, 1);
    assert.equal(save.creatures[1].changes.length, 0);
    assert.equal(save.items.ward, 1, 'a Ward is no longer spent after a battle');
    assert.equal(save.items.charm, 1);
    assert.equal(save.stats.battlesLost, 1);
});

test('a ghost trophy keeps the ghost creature’s Changes, with old injuries healed', () => {
    const ghostTeam = [inst('beastie', { powerDelta: -1, injuries: ['minus-one'], changes: [{ id: 'cracked-crown' }] })];
    const a = Ante.compute({ type: 'ghost', player: { items: { charm: 1 } }, opponent: { name: 'G', nickname: 'Gro', team: ghostTeam }, seed: 'tc' });
    const trophy = Ante.settle(a, 'won', { seed: 'tc', now: 0 }).creaturesGained.find(c => c.trophyOf);
    assert.deepEqual(J(trophy.changes), [{ id: 'cracked-crown' }]);
    assert.deepEqual(J(trophy.injuries), []);
    assert.equal(trophy.powerDelta, 0);
});

// ---- team codes ----------------------------------------------------------------------------

test('team codes round-trip a team, its axiom pool and nickname', () => {
    const team = [inst('lobstorian', { powerDelta: -1, injuries: ['minus-one'] }), inst('swiftlet', { warped: { ability: 'grook' } }), inst('godelix', { trophyOf: 'Ida' })];
    const code = TeamCodes.exportTeam({ nickname: 'Ærø', creatures: team, axioms: ['age-of-reason', 'nonsense'] });
    assert.match(code, /^ROR1\.team\./);
    const back = TeamCodes.importTeam(code);
    assert.equal(back.nickname, 'Ærø');
    assert.deepEqual(J(back.axioms), ['age-of-reason']);
    assert.deepEqual(J(back.team.map(c => [c.species, c.powerDelta, c.injuries, c.warped && c.warped.ability, c.trophyOf])),
        [['lobstorian', -1, ['minus-one'], null, null], ['swiftlet', 0, [], 'grook', null], ['godelix', 0, [], null, 'Ida']]);
    // stable uids per code, so a ghost is the same ghost every time
    assert.deepEqual(J(TeamCodes.importTeam(code).team.map(c => c.uid)), J(back.team.map(c => c.uid)));
});

test('tampered, wrong-kind and impossible team codes are rejected', () => {
    const code = TeamCodes.exportTeam({ nickname: 'Bo', creatures: [inst('lobstorian')] });
    const parts = code.split('.');
    const flipped = parts[2].slice(0, 10) + (parts[2][10] === 'A' ? 'B' : 'A') + parts[2].slice(11);
    assert.throws(() => TeamCodes.importTeam([parts[0], parts[1], flipped, parts[3]].join('.')), /typo|changed/);
    assert.throws(() => TeamCodes.importTeam(Rift.State.encode('save', { v: 1 })), /something else/);
    assert.throws(() => TeamCodes.importTeam('nonsense'), /doesn't look like/);
    // A hand-crafted code with a valid checksum but impossible contents.
    const crafted = p => Rift.State.encode('team', Object.assign({ v: 1, n: 'Hax', a: [] }, p));
    assert.throws(() => TeamCodes.importTeam(crafted({ t: [['lobstorian', 5, [], 0, 0]] })), /impossible power/);
    assert.throws(() => TeamCodes.importTeam(crafted({ t: [['dragon', 0, [], 0, 0]] })), /unknown creature/);
    assert.throws(() => TeamCodes.importTeam(crafted({ t: [['lobstorian', 0, [], 'win-game', 0]] })), /unknown ability/);
    assert.throws(() => TeamCodes.importTeam(crafted({ t: Array(11).fill(['lobstorian', 0, [], 0, 0]) })), /1 to 10/);
    assert.throws(() => TeamCodes.importTeam(crafted({ v: 3, t: [['lobstorian', 0, [], 0, 0]] })), /version/);
    // Version 2: variants, taught tricks and the tactic list are validated strictly.
    const v2 = (row, k) => Rift.State.encode('team', { v: 2, n: 'Hax', a: [], t: [row], k: k || [] });
    const ok = ['lobstorian', 0, [], 0, 0, [1, 2, 'shield'], 'swift'];
    assert.equal(TeamCodes.importTeam(v2(ok, ['counterexample', 'counterexample'])).team[0].taught, 'swift');
    assert.throws(() => TeamCodes.importTeam(v2(['lobstorian', 0, [], 0, 0, [2, 0, 0], 0])), /impossible variant/);
    assert.throws(() => TeamCodes.importTeam(v2(['lobstorian', 0, [], 0, 0, [0, 3, 0], 0])), /impossible variant/);
    assert.throws(() => TeamCodes.importTeam(v2(['lobstorian', 0, [], 0, 0, [0, 0, 'flying'], 0])), /impossible variant/);
    assert.throws(() => TeamCodes.importTeam(v2(['lobstorian', 0, [], 0, 0, [0, 0], 0])), /garbled variant/);
    assert.throws(() => TeamCodes.importTeam(v2(['lobstorian', 0, [], 0, 0, [0, 0, 0], 'fly'])), /unknown trick/);
    assert.throws(() => TeamCodes.importTeam(v2(['lobstorian', 1, [], 0, 0, [0, 0, 0], 0])), /impossible power/); // no power boosts
    assert.throws(() => TeamCodes.importTeam(v2(['lobstorian', -11, [], 0, 0, [0, 0, 0], 0])), /impossible power/);
    assert.throws(() => TeamCodes.importTeam(v2(ok, ['win-the-game'])), /unknown tactic/);
    assert.throws(() => TeamCodes.importTeam(v2(ok, ['eureka', 'eureka', 'eureka'])), /2 copies/);
    assert.throws(() => TeamCodes.importTeam(Rift.State.encode('team', { v: 2, n: 'Hax', a: [], t: Array(14).fill(ok), k: ['eureka', 'eureka', 'lemma', 'lemma', 'recall', 'recall', 'clockwork'] })), /at most 20/);
    assert.throws(() => TeamCodes.importTeam(Rift.State.encode('team', { v: 2, n: 'Hax', a: [], t: Array(15).fill(ok), k: [] })), /1 to 14/);
    assert.throws(() => TeamCodes.importTeam(Rift.State.encode('team', { v: 2, n: 'Hax', a: [], t: [ok] })), /tactic list/);
});

test('old-scale injuries below attack 0 are lifted to attack 0 on import and export, not rejected', () => {
    // Astrophysicat (attack 1) from an old save: power 4 → 2 became powerDelta −2.
    const v2 = row => Rift.State.encode('team', { v: 2, n: 'Old', a: [], t: [row], k: ['eureka'] });
    const cat = TeamCodes.importTeam(v2(['astrophysicat', -2, ['minus-one'], 0, 0, [0, 0, 0], 0])).team[0];
    assert.equal(cat.powerDelta, -1);
    assert.deepEqual(J(cat.injuries), ['minus-one']);
    assert.equal(Rift.State.creatureStats(cat).attack, 0);
    const gentle = TeamCodes.importTeam(v2(['astrophysicat', -3, ['minus-one', 'no-ability'], 0, 0, [-1, 0, 0], 0])).team[0];
    assert.equal(gentle.powerDelta, 0, 'attack 1 − 1 = 0 already: nothing more to lose');
    assert.deepEqual(J(gentle.injuries), ['no-ability'], 'the healed minus-one tag goes');
    const trained = TeamCodes.importTeam(v2(['lobstorian', -5, ['minus-one'], 0, 0, [1, 0, 0], 'attack'])).team[0];
    assert.equal(trained.powerDelta, -4, 'attack 2 + 1 + 1 trick');
    // v1 codes keep the same rule.
    const old = TeamCodes.importTeam(Rift.State.encode('team', { v: 1, n: 'Old', a: [], t: [['astrophysicat', -3, ['minus-one'], 0, 0]] })).team[0];
    assert.equal(old.powerDelta, -1);
    // Export lifts it as well, so an older copy of the game still accepts the code.
    const code = TeamCodes.exportTeam({ nickname: 'Me', creatures: [inst('astrophysicat', { powerDelta: -3, injuries: ['minus-one'], variant: { attack: 0, health: 0, trait: null } })] });
    const back = TeamCodes.importTeam(code).team[0];
    assert.equal(back.powerDelta, -1);
    assert.equal(Rift.State.decode('team', code).t[0][1], -1);
});

test('export refuses a deck that breaks the construction rules instead of trimming it (#112)', () => {
    const species = ['zuckerborg', 'astrophysicat', 'siuuugull', 'khaby', 'kardashiant', 'keanu', 'eelish', 'beansprout'];
    const two = n => Array.from({ length: n }, (_, i) => inst(species[i >> 1]));
    assert.throws(() => TeamCodes.exportTeam({ nickname: 'Big', creatures: two(16), tactics: [] }), /at most 14 creatures/);
    assert.throws(() => TeamCodes.exportTeam({ nickname: 'Big', creatures: two(12), tactics: Rift.data.tacticDecks.starter }), /Remove 2 cards/);
    assert.throws(() => TeamCodes.exportTeam({ nickname: 'Big', creatures: Array.from({ length: 3 }, () => inst('zuckerborg')) }), /Zuckerborg: at most 2 copies/);
    assert.throws(() => TeamCodes.exportTeam({ nickname: 'Big', creatures: two(10), tactics: ['eureka', 'eureka', 'eureka'] }), /Eureka!: at most 2 copies/);
    // Two copies of an axiom card travel; a third is refused.
    const back = TeamCodes.importTeam(TeamCodes.exportTeam({ nickname: 'Ten', creatures: two(10), tactics: Rift.data.tacticDecks.starter, axioms: ['mercy', 'mercy', 'thrift'] }));
    assert.equal(back.team.length, 10);
    assert.deepEqual(J(back.axioms), ['mercy', 'mercy', 'thrift']);
    assert.throws(() => TeamCodes.exportTeam({ nickname: 'Ten', creatures: two(2), axioms: ['mercy', 'mercy', 'mercy'] }), /Mercy.*at most 2 copies/);
    // A hand-made code with three copies is refused on import.
    const row = ['zuckerborg', 0, [], 0, 0, [0, 0, 0], 0];
    assert.throws(() => TeamCodes.importTeam(Rift.State.encode('team', { v: 2, n: 'Hax', a: [], t: [row, row, row], k: [] })), /at most 2 copies of Zuckerborg/);
    assert.throws(() => TeamCodes.importTeam(Rift.State.encode('team', { v: 2, n: 'Hax', a: ['mercy', 'mercy', 'mercy'], t: [row], k: [] })), /2 copies of an axiom card/);
});

test('v2 team codes carry variants, taught tricks and tactics; ghosts use them', () => {
    const team = [inst('lobstorian', { variant: { attack: 1, health: -1, trait: 'swift' }, taught: 'shield' }), inst('zuckerborg', { variant: { attack: -1, health: 2, trait: null } })];
    const code = TeamCodes.exportTeam({ nickname: 'Vee', creatures: team, tactics: ['pep-talk', 'pep-talk', 'lemma', 'nonsense'] });
    const back = TeamCodes.importTeam(code);
    assert.equal(back.version, 2);
    assert.deepEqual(J(back.team.map(c => [c.variant, c.taught])), [[{ attack: 1, health: -1, trait: 'swift' }, 'shield'], [{ attack: -1, health: 2, trait: null }, null]]);
    assert.deepEqual(J(back.tactics), ['pep-talk', 'pep-talk', 'lemma']);
    const ghost = TeamCodes.ghostOpponent(back);
    assert.deepEqual(J(ghost.tactics), ['pep-talk', 'pep-talk', 'lemma']);
    const s = E.createBattle({ seed: 'v2', players: [{ team: [inst('khaby')] }, { team: ghost.team, tactics: ghost.tactics }], options: { shuffle: false } });
    const lob = Rift.data.creatures.lobstorian;
    assert.equal(s.cards.p1c0.attack, lob.attack + 1);
    assert.equal(s.cards.p1c0.health, lob.health - 1);
    assert.ok(E.keywordsOf(s, 'p1c0').includes('swift') && E.keywordsOf(s, 'p1c0').includes('shield'));
    const theirTactics = Object.values(s.cards).filter(c => c.kind === 'tactic' && c.owner === 1).map(c => c.tactic).sort();
    assert.deepEqual(J(theirTactics), ['lemma', 'pep-talk', 'pep-talk']);
});

test('v1 team codes still import with plain variants and the starter tactics', () => {
    // A code made before the Card Arena: old power-scale injuries are clamped so attack stays >= 0.
    const old = Rift.State.encode('team', { v: 1, n: 'Old', a: ['underdog'], t: [['astrophysicat', -3, ['minus-one'], 0, 0], ['muskrat', 0, [], 'grook', 'Ida']] });
    const back = TeamCodes.importTeam(old);
    assert.equal(back.version, 1);
    assert.deepEqual(J(back.team.map(c => [c.variant, c.taught, c.powerDelta])), [[{ attack: 0, health: 0, trait: null }, null, -1], [{ attack: 0, health: 0, trait: null }, null, 0]]);
    assert.deepEqual(J(TeamCodes.ghostOpponent(back).tactics), J(Rift.data.tacticDecks.starter));
});

test('a ghost battle runs the imported team with the AI, deterministically', () => {
    const code = TeamCodes.exportTeam({ nickname: 'Ida', creatures: TEN.map(x => inst(x)), axioms: ['age-of-wonder'] });
    const ghost = TeamCodes.ghostOpponent(TeamCodes.importTeam(code));
    assert.equal(ghost.name, "Ida's ghost");
    const play = () => {
        const s = E.createBattle({
            seed: 'ghost', players: [{ name: 'You', team: TEN.map(x => inst(x)) }, { name: ghost.name, team: ghost.team }],
            axiomDeck: E.buildAxiomDeck([], ghost.axioms),
        });
        assert.ok(s.axioms.deck.concat(Object.values(s.axioms.active), ...s.players.map(P => P.axHand)).includes('age-of-wonder'));
        return AI.playOut(s, ['hard', ghost.ai]);
    };
    const a = play(), b = play();
    assert.ok(a.winner != null);
    assert.equal(a.winner, b.winner);
    assert.equal(a.turn, b.turn);
});

test('team codes carry Changes; a sideways ability rides in the warped slot; impossible Changes are refused', () => {
    const team = [
        inst('lobstorian', { changes: [{ id: 'cracked-crown' }, { id: 'light-feet' }] }),
        inst('swiftlet', { changes: [{ id: 'rift-freckles', ability: 'grook', from: 'easter-egg' }] }),
    ];
    const code = TeamCodes.exportTeam({ nickname: 'Ida', creatures: team });
    const back = TeamCodes.importTeam(code).team;
    assert.deepEqual(J(back[0].changes), [{ id: 'cracked-crown' }, { id: 'light-feet' }]);
    assert.deepEqual(J(back[1].changes), [{ id: 'rift-freckles', ability: 'grook' }]);
    assert.equal(back[1].warped, null);
    assert.deepEqual(J(Rift.State.creatureStats(back[0])), J(Rift.State.creatureStats(team[0])));
    assert.equal(Rift.State.creatureStats(back[1]).ability, 'grook');
    const forged = TeamCodes.exportTeam({ nickname: 'Ida', creatures: [inst('lobstorian', { changes: [{ id: 'cracked-crown' }, { id: 'lightning-streak' }] })] });
    assert.throws(() => TeamCodes.importTeam(forged), /impossible Changes/);
});
