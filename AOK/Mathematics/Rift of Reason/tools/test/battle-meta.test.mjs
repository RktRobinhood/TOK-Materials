// Fate table, ante and team codes.
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

// ---- fate ------------------------------------------------------------------------------

test('fate never kills legendaries', () => {
    const legends = Object.keys(Rift.data.creatures).filter(id => Rift.data.creatures[id].rarity === 'legendary').map(id => inst(id));
    for (let i = 0; i < 200; i++) {
        const r = Fate.roll({ instances: legends, defeated: legends.map(c => c.uid), mode: 'trainer', seed: 'L' + i, odds: { death: 1 } });
        assert.equal(r.removed.length, 0);
        assert.equal(r.instances.length, legends.length);
        r.results.forEach(x => { assert.equal(x.outcome, 'scarred'); assert.equal(x.savedBy, 'legend'); });
    }
});

test('ordinary creatures can die, and the dead are removed', () => {
    const team = [inst('lobstorian'), inst('swiftlet')];
    const r = Fate.roll({ instances: team, defeated: [team[0].uid], mode: 'trainer', seed: 'd', odds: { death: 1 } });
    assert.deepEqual(J(r.removed), [team[0].uid]);
    assert.deepEqual(J(r.instances.map(c => c.uid)), [team[1].uid]);
});

test('practice battles never change instances', () => {
    const team = TEN.map(x => inst(x));
    const before = J(team);
    const r = Fate.roll({ instances: team, defeated: team.map(c => c.uid), mode: 'practice', seed: 'p', odds: { death: 1 } });
    assert.deepEqual(J(r.instances), before);
    assert.equal(r.removed.length, 0);
    assert.equal(r.results.length, 0);
    assert.deepEqual(J(team), before, 'input untouched');
    // and the ante is empty
    const a = Ante.compute({ type: 'practice', player: { items: { charm: 5 } } });
    assert.deepEqual(J(Ante.settle(a, 'lost')), { itemsDelta: {}, creaturesGained: [], lines: [] });
    const save = { creatures: J(team), items: { charm: 5 }, stats: { battlesWon: 0, battlesLost: 0 } };
    Ante.applyToSave(save, { mode: 'practice', outcome: 'lost' });
    assert.deepEqual(save.creatures, before);
});

test('fate is pure: input instances are never mutated', () => {
    const team = TEN.map(x => inst(x));
    const before = J(team);
    Fate.roll({ instances: team, defeated: team.map(c => c.uid), mode: 'trainer', seed: 'pure', odds: { injured: 1, warp: 1, scarred: 1 } });
    assert.deepEqual(J(team), before);
});

test('injured: -1 power or loses its ability; warp: a different keyword; scarred: cosmetic', () => {
    const team = Array.from({ length: 30 }, () => inst('lobstorian'));
    const hurt = Fate.roll({ instances: team, defeated: team.map(c => c.uid), mode: 'trainer', seed: 'i', odds: { injured: 1 } });
    hurt.instances.forEach(c => assert.ok(c.powerDelta === -1 || c.injuries.includes('no-ability')));
    assert.ok(hurt.instances.some(c => c.powerDelta === -1) && hurt.instances.some(c => c.injuries.includes('no-ability')));
    const warped = Fate.roll({ instances: team, defeated: team.map(c => c.uid), mode: 'trainer', seed: 'w', odds: { warp: 1 } });
    warped.instances.forEach(c => {
        assert.ok(Rift.Battle.KEYWORDS.includes(c.warped.ability));
        assert.notEqual(c.warped.ability, 'lecture');
    });
    const scar = Fate.roll({ instances: team, defeated: team.map(c => c.uid), mode: 'trainer', seed: 's', odds: { scarred: 1 } });
    scar.instances.forEach(c => { assert.equal(c.scars.length, 1); assert.equal(c.powerDelta, 0); });
    // the engine honours the results
    const s = E.createBattle({ seed: 'x', players: [{ team: [hurt.instances[0], warped.instances[0]] }, { team: [] }], options: { shuffle: false } });
    assert.ok(s.cards.p0c0.attack === Rift.data.creatures.lobstorian.attack - 1 || s.cards.p0c0.ability === null);
    assert.equal(s.cards.p0c1.ability, warped.instances[0].warped.ability);
});

test('injuries lower attack but never below 0: a 0-attack creature loses its ability or is only scarred', () => {
    // Astrophysicat has 1 attack; a -1 attack variant brings it to 0.
    const weak = Array.from({ length: 20 }, () => inst('astrophysicat', { variant: { attack: -1, health: 0, trait: null } }));
    const r = Fate.roll({ instances: weak, defeated: weak.map(c => c.uid), mode: 'trainer', seed: 'zero', odds: { injured: 1 } });
    r.instances.forEach(c => { assert.equal(c.powerDelta, 0); assert.ok(c.injuries.includes('no-ability')); });
    const done = r.instances.map(c => Object.assign({}, c));
    const again = Fate.roll({ instances: done, defeated: done.map(c => c.uid), mode: 'trainer', seed: 'zero2', odds: { injured: 1 } });
    again.results.forEach(x => assert.equal(x.outcome, 'scarred'));
    // A taught +1 attack trick counts as attack that can be lost.
    const taught = [inst('astrophysicat', { variant: { attack: -1, health: 0, trait: null }, taught: 'attack', injuries: ['no-ability'] })];
    const t = Fate.roll({ instances: taught, defeated: [taught[0].uid], mode: 'trainer', seed: 't', odds: { injured: 1 } });
    assert.equal(t.instances[0].powerDelta, -1);
    assert.match(t.log[0], /-1 attack/);
});

test('anchor stops a warp; wards cancel the worst bad rolls first', () => {
    const team = [inst('lobstorian'), inst('swiftlet'), inst('muskrat')];
    const ids = team.map(c => c.uid);
    const a = Fate.roll({ instances: team, defeated: ids, mode: 'trainer', seed: 'a', odds: { warp: 1 }, items: { anchor: 1 } });
    assert.equal(a.itemsUsed.anchor, 1);
    assert.equal(a.results.filter(r => r.outcome === 'fine' && r.savedBy === 'anchor').length, 1);
    assert.equal(a.results.filter(r => r.outcome === 'warp').length, 2);
    const w = Fate.roll({ instances: team, defeated: ids, mode: 'trainer', seed: 'b', odds: { death: 1 }, items: { ward: 2 } });
    assert.equal(w.itemsUsed.ward, 2);
    assert.equal(w.removed.length, 1);
});

test('loaned commons and creatures outside the instance list never roll', () => {
    const team = [inst('lobstorian')];
    const r = Fate.roll({ instances: team, defeated: ['loan-0-1', 'nobody', team[0].uid], mode: 'trainer', seed: 'l' });
    assert.equal(r.results.length, 1);
});

test('fate odds are tuned to be kinder to winners', () => {
    const F = Rift.data.fate;
    const total = o => Object.values(o).reduce((a, b) => a + b, 0);
    assert.equal(F.winnerOdds.death, 0);
    assert.ok(F.odds.death / total(F.odds) <= 0.01);
    assert.ok(F.winnerOdds.fine / total(F.winnerOdds) > F.odds.fine / total(F.odds));
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

test('applyToSave drops dead creatures from the chosen battle team', () => {
    const team = [inst('lobstorian'), inst('swiftlet')];
    const save = { creatures: J(team), team: team.map(c => c.uid), items: { charm: 2 }, stats: { battlesWon: 0, battlesLost: 0 } };
    const fate = Fate.roll({ instances: save.creatures, defeated: [team[0].uid], mode: 'trainer', seed: 'x', odds: { death: 1 } });
    Ante.applyToSave(save, { mode: 'trainer', outcome: 'won', fate });
    assert.deepEqual(save.team, [team[1].uid]);
});

test('applyToSave applies fate and ante to a save', () => {
    const team = [inst('lobstorian'), inst('swiftlet')];
    const save = { creatures: J(team), items: { charm: 2, ward: 1 }, stats: { battlesWon: 0, battlesLost: 0 } };
    const fate = Fate.roll({ instances: save.creatures, defeated: [team[0].uid], mode: 'trainer', seed: 'x', odds: { death: 1 }, items: { ward: 0 } });
    const ante = Ante.compute({ type: 'trainer', player: { items: save.items }, opponent: { name: 'T' }, seed: 'x' });
    Ante.applyToSave(save, { mode: 'trainer', outcome: 'lost', fate, settlement: Ante.settle(ante, 'lost') });
    assert.deepEqual(save.creatures.map(c => c.uid), [team[1].uid]);
    assert.equal(save.items.charm, 1);
    assert.equal(save.stats.battlesLost, 1);
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
    assert.throws(() => TeamCodes.importTeam(v2(['lobstorian', -3, [], 0, 0, [0, 0, 0], 0])), /impossible power/); // attack 2 - 3 < 0
    assert.throws(() => TeamCodes.importTeam(v2(ok, ['win-the-game'])), /unknown tactic/);
    assert.throws(() => TeamCodes.importTeam(v2(ok, ['eureka', 'eureka', 'eureka'])), /2 copies/);
    assert.throws(() => TeamCodes.importTeam(Rift.State.encode('team', { v: 2, n: 'Hax', a: [], t: Array(14).fill(ok), k: ['eureka', 'eureka', 'lemma', 'lemma', 'recall', 'recall', 'clockwork'] })), /at most 20/);
    assert.throws(() => TeamCodes.importTeam(Rift.State.encode('team', { v: 2, n: 'Hax', a: [], t: Array(15).fill(ok), k: [] })), /1 to 14/);
    assert.throws(() => TeamCodes.importTeam(Rift.State.encode('team', { v: 2, n: 'Hax', a: [], t: [ok] })), /tactic list/);
});

test('decks are capped at 14 creatures and 20 cards on export', () => {
    const code = TeamCodes.exportTeam({ nickname: 'Big', creatures: Array.from({ length: 16 }, () => inst('zuckerborg')), tactics: Rift.data.tacticDecks.starter });
    const back = TeamCodes.importTeam(code);
    assert.equal(back.team.length, 14);
    assert.equal(back.tactics.length, 6);
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
