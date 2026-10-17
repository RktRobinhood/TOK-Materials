// Paired-seed simulation of the colour-scheduled Fate spells and the Fate timing Axioms (#121; results in
// design/reviews/fate-pack-121-2026-10-17.md).
//
//   node tools/sim-fate-pack.mjs [--games=100] [--level=competent] [--seed=fate-pack] [--workers=N]
//        [--only=spells|rules] [--patch=prepared-defence.cost:3,...]
//
// Spells: each spell's own-colour starter deck (data/starters.js) swaps its generic pair of the same cost (2)
// for two copies of the spell. With the same seeds, it plays all five starters (itself included), in both
// seats, once unchanged and once with the spell. Per spell: the deck's win rate both ways, the change with a
// 95% interval (paired games), and how often the spell was cast per game.
// Timing rules: the five decks with their spell pair play each other. One side's ten Axioms swap Small
// Assumptions and Growing Ideas for two copies of the rule, so it is in the shared deck. Per rule: how often
// it was played, the win rate of the side that played it, and how often it turned over with Fate.
// No hero powers (measured separately: design/reviews/avatar-powers-balance.md); both sides play at --level.
import { loadRift } from './test/harness.mjs';
import { Worker, isMainThread, parentPort, workerData } from 'node:worker_threads';
import os from 'node:os';

const args = process.argv.slice(2);
const opt = (name, dflt) => { const a = args.find(x => x.startsWith('--' + name + '=')); return a ? a.slice(name.length + 3) : dflt; };
const GAMES = Number(opt('games', 100));
const LEVEL = opt('level', 'competent');
const SEED = opt('seed', 'fate-pack');
const ONLY = opt('only', '');

const Rift = loadRift([
    'js/core/rift.js', 'js/core/state.js', 'data/creatures.js', 'data/items.js', 'data/axioms.js', 'data/tactics.js', 'data/fate.js', 'data/avatars.js', 'data/powers.js',
    'data/starters.js', 'js/battle/abilities.js', 'js/battle/engine.js', 'js/battle/ai.js',
]);
const { Engine, AI } = Rift.Battle;
opt('patch', '').split(',').filter(Boolean).forEach(kv => {
    const [path, v] = kv.split(':');
    const [id, field] = path.split('.');
    const D = Rift.data.tactics[id] || Rift.data.axioms[id];
    if (!D) throw new Error('Unknown id in --patch: ' + id);
    if (field === 'delay') D.scheduled.delay = +v; else D[field] = isNaN(+v) ? v : +v;
});

const DECKS = Rift.data.starterDecks.decks;
const TYPES = Object.keys(DECKS);
// The spell, its colour's starter, and the generic pair of the same cost it replaces.
const SPELLS = {
    'prepared-defence': ['owlet', 'counterexample'],
    'delayed-observation': ['mothkin', 'counterexample'],
    'tomorrows-idea': ['fox', 'pep-talk'],
    'remember-this': ['frogling', 'second-wind'],
    'scheduled-speech': ['raven', 'second-wind'],
};
const RULES = ['patient-plans', 'hasty-plans', 'open-calendar', 'gentle-consequences'];
const team = (type, prefix) => DECKS[type].creatures.map((species, i) => ({ uid: prefix + i, species, injuries: [], scars: [], powerDelta: 0, warped: null, trophyOf: null }));
const withSpell = (type, spell, out) => DECKS[type].tactics.map(id => (id === out ? spell : id));
const packDeck = type => { const spell = Object.keys(SPELLS).find(id => SPELLS[id][0] === type); return withSpell(type, spell, SPELLS[spell][1]); };
const tenWith = rule => Rift.data.starterDecks.axioms.map(id => (id === 'thrift' || id === 'abundance' ? rule : id));

// Every deck used here obeys the construction rules.
Object.keys(SPELLS).forEach(spell => {
    const [type, out] = SPELLS[spell];
    const v = Rift.State.validateDeck({ creatures: DECKS[type].creatures, tactics: withSpell(type, spell, out), axioms: tenWith(RULES[0]) });
    if (!v.valid) throw new Error(spell + ' in ' + type + ': ' + v.message);
});

// One game. me: the seat of the side under test; first: the seat that goes first.
function game(seed, decks, axioms, first) {
    let s = Engine.createBattle({ seed, players: decks.map((d, p) => ({ name: 'P' + p, team: team(d.type, seed + ':' + p + ':'), tactics: d.tactics, axioms: axioms[p] })),
        options: { first, mode: 'practice' } });
    s = AI.playOut(s, [LEVEL, LEVEL]);
    return s;
}
// The game list: [kind, key, g, seat, ...]. Workers take slices of it.
function jobs() {
    const out = [];
    if (ONLY !== 'rules') Object.keys(SPELLS).forEach(spell => TYPES.forEach(opp => { for (let g = 0; g < GAMES; g++) for (const seat of [0, 1]) out.push(['spell', spell, opp, g, seat]); }));
    if (ONLY !== 'spells') RULES.forEach(rule => TYPES.forEach(a => TYPES.forEach(b => {
        if (a === b) return;
        for (let g = 0; g < Math.max(1, Math.round(GAMES / 4)); g++) for (const seat of [0, 1]) out.push(['rule', rule, a + '>' + b, g, seat]);
    })));
    return out;
}
function runJob(j) {
    const [kind, key, x, g, seat] = j;
    const st = {};
    if (kind === 'spell') {
        const [type, out] = SPELLS[key];
        const seed = SEED + ':' + key + ':' + x + ':' + g;
        const other = { type: x, tactics: DECKS[x].tactics };
        const scores = ['base', 'with'].map(v => {
            const mine = { type, tactics: v === 'base' ? DECKS[type].tactics : withSpell(type, key, out) };
            const decks = seat === 0 ? [mine, other] : [other, mine];
            const s = game(seed, decks, [Rift.data.starterDecks.axioms, Rift.data.starterDecks.axioms], g % 2);
            const casts = Engine.fullLog(s).filter(e => e.t === 'tactic-play' && e.id === key && e.player === seat).length;
            const score = s.winner === seat ? 1 : s.winner === 'draw' ? 0.5 : 0;
            return { score, casts, rounds: s.round };
        });
        st[key] = { n: 1, base: scores[0].score, with: scores[1].score, diff2: Math.pow(scores[1].score - scores[0].score, 2), casts: scores[1].casts, castGames: scores[1].casts ? 1 : 0,
            rounds: scores[1].rounds, baseRounds: scores[0].rounds };
    } else {
        const [a, b] = x.split('>');
        const seed = SEED + ':' + key + ':' + x + ':' + g;
        const decks = [{ type: a, tactics: packDeck(a) }, { type: b, tactics: packDeck(b) }];
        const s = game(seed, seat === 0 ? decks : decks.slice().reverse(), seat === 0 ? [tenWith(key), Rift.data.starterDecks.axioms] : [Rift.data.starterDecks.axioms, tenWith(key)], g % 2);
        const log = Engine.fullLog(s);
        const plays = log.filter(e => e.t === 'axiom-play' && e.id === key);
        const flips = log.filter(e => e.t === 'axiom' && e.id === key && e.player == null).length;
        const players = [...new Set(plays.map(e => e.player))];
        const r = st[key] = { n: 1, played: plays.length, playedGames: plays.length ? 1 : 0, flips, playerGames: 0, playerWins: 0,
            scheduled: log.filter(e => e.t === 'fate-schedule').length };
        players.forEach(p => { r.playerGames += 1; r.playerWins += s.winner === p ? 1 : s.winner === 'draw' ? 0.5 : 0; });
    }
    return st;
}
function merge(a, b) {
    for (const k in b) {
        if (typeof b[k] === 'number') a[k] = (a[k] || 0) + b[k];
        else merge(a[k] || (a[k] = {}), b[k]);
    }
    return a;
}

if (!isMainThread) {
    const list = jobs().slice(workerData.from, workerData.to);
    parentPort.postMessage(list.reduce((acc, j) => merge(acc, runJob(j)), {}));
} else {
    const list = jobs(), t0 = Date.now();
    const parts = Math.max(1, Math.min(Number(opt('workers', Math.max(1, os.cpus().length - 1))), list.length));
    const chunks = [];
    for (let i = 0; i < parts; i++) {
        const from = Math.floor(i * list.length / parts), to = Math.floor((i + 1) * list.length / parts);
        chunks.push(new Promise((resolve, reject) => {
            const w = new Worker(new URL(import.meta.url), { argv: args, workerData: { from, to } });
            w.once('message', resolve); w.once('error', reject);
        }));
    }
    const st = (await Promise.all(chunks)).reduce((acc, x) => merge(acc, x), {});
    const pct = x => (100 * x).toFixed(1) + '%';
    console.log(`Fate pack (#121): ${list.length} paired jobs, level ${LEVEL}, seed ${SEED}, ${((Date.now() - t0) / 1000).toFixed(0)} s`);
    if (ONLY !== 'rules') {
        console.log('\nSpells (own-colour starter, generic cost-2 pair swapped for the spell; vs all five starters, both seats)');
        console.log('spell                 deck      replaces         games  unchanged  with it   change (95%)        casts/game  cast in');
        Object.keys(SPELLS).forEach(id => {
            const r = st[id], n = r.n, d = (r.with - r.base) / n;
            const sd = Math.sqrt(Math.max(0, r.diff2 / n - d * d)), ci = 1.96 * sd / Math.sqrt(n);
            console.log(`${id.padEnd(22)}${SPELLS[id][0].padEnd(10)}${SPELLS[id][1].padEnd(17)}${String(n).padStart(5)}  ${pct(r.base / n).padStart(9)}  ${pct(r.with / n).padStart(7)}   ${((d >= 0 ? '+' : '') + (100 * d).toFixed(1)).padStart(6)} ± ${(100 * ci).toFixed(1).padStart(4)} pts   ${(r.casts / n).toFixed(2).padStart(9)}  ${pct(r.castGames / n).padStart(7)}`);
        });
    }
    if (ONLY !== 'spells') {
        console.log('\nTiming rules (pack decks vs each other; the rule ×2 in one side\'s ten, so in the shared deck)');
        console.log('rule                   games  played in  plays/game  player win  Fate flips/game  spells scheduled/game');
        RULES.forEach(id => {
            const r = st[id], n = r.n;
            console.log(`${id.padEnd(22)}${String(n).padStart(6)}  ${pct(r.playedGames / n).padStart(9)}  ${(r.played / n).toFixed(2).padStart(10)}  ${(r.playerGames ? pct(r.playerWins / r.playerGames) : '-').padStart(10)}  ${(r.flips / n).toFixed(2).padStart(15)}  ${(r.scheduled / n).toFixed(2).padStart(21)}`);
        });
    }
}
