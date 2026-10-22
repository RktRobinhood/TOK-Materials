// #148/#149 release balance probe. Each Way's legal mono deck plays paired games WITH its waiting cards against
// the same deck holding ORDINARY cards in those slots (starter spells Clockwork, Look It Up, Eureka! and the
// cheapest creature pair). Also a mirror control (the ordinary deck against itself, alternating first player)
// and a run against the unchanged fixture deck (which keeps the strong Pep Talk / Stand Firm / Counterexample).
// Competent AI on both sides, opposite seats, alternating first player. A smoke test, not a classroom claim.
//   node tools/sim-conditional.mjs [seeds per row, default 8]
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { loadRift, GAME_DIR } from './test/harness.mjs';
const R = loadRift(['js/core/rift.js', 'js/core/state.js', 'data/creatures.js', 'data/items.js', 'data/axioms.js', 'data/tactics.js', 'data/fate.js', 'data/starters.js',
    'js/battle/abilities.js', 'js/battle/conditional-cards.js', 'js/battle/engine.js', 'js/battle/ai.js', 'dev/foundation-fixtures.js']);
const F = R.FoundationFixtures, E = R.Battle.Engine, AI = R.Battle.AI, C = R.ConditionalCards;
const seeds = Number(process.argv[2] || 8);
assert(Number.isInteger(seeds) && seeds > 0 && seeds <= 100);
const way = id => id.slice('conditional-'.length).split('-')[0];
const isCreature = id => !!R.data.creatures[id];

// The slots: each waiting spell takes one generic spell pair, each waiting creature the cheapest creature pair.
// fill(id) is what goes in: the waiting card itself, or an ordinary card of the same kind. Same size, same
// rules, legal by the shared validator.
const SPELL_SLOTS = ['pep-talk', 'stand-firm', 'counterexample'], ORDINARY = ['clockwork', 'look-it-up', 'eureka'];
function swapped(base, ids, waiting) {
    const d = { creatures: base.creatures.slice(), tactics: base.tactics.slice(), axioms: base.axioms.slice() };
    const creatureOut = [...new Set(d.creatures)]; let spell = 0;
    ids.forEach(id => {
        if (isCreature(id)) { const out = creatureOut.shift(); if (waiting) d.creatures = d.creatures.filter(x => x !== out).concat([id, id]); }
        else { const out = SPELL_SLOTS[spell], put = waiting ? id : ORDINARY[spell]; spell++; d.tactics = d.tactics.filter(x => x !== out).concat([put, put]); }
    });
    return d;
}
const rows = F.colours.map(colour => ({ label: colour, colour, ids: C.ids.filter(id => way(id) === colour) }))
    // All five generic cards in one deck (two of its four creature pairs become masked creatures), then each alone.
    .concat([{ label: 'generic', colour: 'reason', ids: C.ids.filter(id => way(id) === 'generic') }])
    .concat(C.ids.filter(id => way(id) === 'generic').map(id => ({ label: 'generic:' + id.slice('conditional-generic-'.length), colour: 'reason', ids: [id] })));

const out = [], plays = {}, reveals = {}, longGames = [];
function match(label, specs, seed, seat, tally, first) {
    const s = E.createBattle({ seed: 'conditional-probe:' + label + ':' + seed, players: specs.map(F.player), options: { first, mode: 'practice' } });
    let steps = 0;
    const end = AI.playOut(s, ['competent', 'competent'], (before, a, after) => {
        steps++;
        if (tally && a.type === 'play') {
            const c = before.cards[a.cid], id = c.species || c.tactic;
            if (C.ids.includes(id)) plays[id] = (plays[id] || 0) + 1;
        }
        if (tally) (after.lastEvents || []).forEach(e => { if (e.t === 'conditional-reveal') { const c = after.cards[e.cid], id = c.species || c.tactic; reveals[id] = (reveals[id] || 0) + 1; } });
        // Every personal card is in exactly one zone: no reveal, recovery or token creates a copy.
        for (const P of after.players) {
            const zones = ['deck', 'hand', 'board', 'armed', 'discard'].flatMap(k => P[k] || []);
            assert.equal(new Set(zones).size, zones.length, 'an instance cannot occupy two zones');
            assert.ok((P.armed || []).length <= 2, 'at most two armed conditions');
        }
    });
    if (end.endReason === 'turn-limit') longGames.push({ label, seed, seat, turn: end.turn, hearts: end.players.map(P => P.hearts) });
    return { winner: end.winner, steps, turnLimit: end.endReason === 'turn-limit' };
}
for (const row of rows) {
    const fixture = F.deck(row.colour, false), base = swapped(fixture, row.ids, false), waiting = swapped(fixture, row.ids, true);
    for (const d of [fixture, base, waiting]) {
        const check = R.State.validateDeck(d, { owned: d.tactics });
        assert(check.valid, row.label + ': ' + check.message);
        assert.equal(d.creatures.length + d.tactics.length, 20);
    }
    const r = { row: row.label, cards: row.ids.map(id => (R.data.creatures[id] || R.data.tactics[id]).name), games: 0, waitingWins: 0, baselineWins: 0, draws: 0,
        control: { games: 0, seat0Wins: 0, seat1Wins: 0, draws: 0 }, vsFixture: { games: 0, waitingWins: 0, fixtureWins: 0, draws: 0 }, maxSteps: 0, turnLimit: 0 };
    for (let seed = 0; seed < seeds; seed++) for (const seat of [0, 1]) {
        const g = match(row.label, seat ? [base, waiting] : [waiting, base], seed, seat, true, seed % 2);
        r.games++; r.maxSteps = Math.max(r.maxSteps, g.steps); if (g.turnLimit) r.turnLimit++;
        if (g.winner === 'draw') r.draws++; else if (g.winner === seat) r.waitingWins++; else r.baselineWins++;
        const c = match(row.label + ':control:' + seat, [base, base], seed, seat, false, (seed + seat) % 2);
        r.control.games++; if (c.winner === 'draw') r.control.draws++; else if (c.winner === 0) r.control.seat0Wins++; else r.control.seat1Wins++;
        const x = match(row.label + ':fixture', seat ? [fixture, waiting] : [waiting, fixture], seed, seat, false, seed % 2);
        r.vsFixture.games++; if (x.winner === 'draw') r.vsFixture.draws++; else if (x.winner === seat) r.vsFixture.waitingWins++; else r.vsFixture.fixtureWins++;
    }
    out.push(r); console.log(JSON.stringify(r));
}
const report = { date: '2026-10-22', scope: 'Paired legal 20-card mono decks: each Way with its 3 waiting cards (2 copies each; the generic row puts 2 creatures + 3 spells in the Reason deck) against the same deck with ordinary cards in those slots (Clockwork, Look It Up, Eureka!, cheapest creature pair). Also a mirror control and a run against the unchanged fixture deck, which keeps Pep Talk, Stand Firm and Counterexample. Competent AI both sides, opposite seats, alternating first player.',
    seedsPerRow: seeds, games: out.reduce((n, r) => n + r.games + r.control.games + r.vsFixture.games, 0), rows: out, plays, reveals, longGames };
const target = path.join(GAME_DIR, 'design/reviews/conditional-release-2026-10-22'); fs.mkdirSync(target, { recursive: true });
fs.writeFileSync(path.join(target, 'balance-probe.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ games: report.games, plays, reveals }));
