// Headless Card Arena simulator: AI vs AI, for balance tuning (design/card-arena-2026-10-07.md).
//
//   node tools/sim-battle.mjs [N=1000] [--seed=sim] [--team=10] [--legendaries] [--mirror]
//        [--he=N] [--hh-only] [--species] [--set=key:value,...] [--workers=N (default: CPU count)]
//
// N matchups are generated (random rarity-weighted teams, starter tactics, ten random
// starter axioms per side). Every matchup is played in BOTH seat orders, so team
// strength cancels out of the first-player rate. --mirror gives both seats the same
// team, tactics and axioms (isolates seat advantage). --set overrides Engine DEFAULTS,
// e.g. --set=hearts:12,openHand:3/5,spark:false. --patch tries data changes without editing
// files: --patch=keanu.health:4,astrophysicat.keywords:guard,clockwork.cost:2 (creature, tactic
// or axiom id; keywords joined with +, 'none' for no keywords). --colour=4 swaps 4 starter tactics
// for colour tactics of each team's colours (design/card-arena-expansion-2026-10-07.md, section 2);
// --only=<colour tactic id> swaps in just that one for every side (to test one card alone).
//
// Reports first-player win %, draws, rounds and personal turns, hearts left, creatures
// defeated per player (feeds the fate odds), end reasons, how often each tactic/axiom
// is played and the win rate of the player who played it, Competent vs Normal, and the fate
// outcome distribution per player per RISKED battle.
//
// AI level ladder (the standard test of the levels, design/card-arena-expansion-2026-10-07.md §8):
//
//   node tools/sim-battle.mjs --ladder [--games=1100] [--seed=ladder]
//
// Four rows, each --games games (default 1,100: ±3 points at 95% confidence near 70%):
//   Competent vs Normal and Expert vs Competent: random teams, swapped seats × both turn orders;
//   Expert with a built boss deck (data/decks.js, cycled) vs Competent with the loaned starter
//   team and starter tactics, swapped seats × both turn orders;
//   a beginner-level scripted player (AI level 'beginner', test-only) with the starter deck vs
//   Normal Syllo in his Road story challenge (the game's own set-up: player first, no shuffle).
// Prints each win rate with its 95% interval next to the target, and Expert's move times.
// Level names: normal, competent, expert, beginner ('easy'/'hard' still mean normal/competent).
//
// Hero powers (design/AVATARS.md section 1.5; results in design/reviews/avatar-powers-balance.md):
//
//   node tools/sim-battle.mjs --powers[=none|pairs|tweaks|all] [--games=1100] [--level=competent]
//        [--pw=lantern,recall] [--tw=quick,deeper] [--seed=powers]
//
//   none    each power (the 10 avatar powers and the 2 Emotion powers) vs no power, then a
//           no-power baseline row (target: the power's side wins 53–58%);
//   pairs   every pair of the 10 avatar powers (target: 45–55%), as a matrix of the row's win rate;
//   tweaks  each tweak (Quick, Cheap, Blood price, Deeper, Broader) vs the same power untweaked
//           (target: 46–54%).
// Every row is --games games (default 1,100: ±3 points at 95%): random teams as above, each
// matchup in both turn orders and with the powers in swapped seats, both players at --level.
// --pw limits the powers, --tw the tweaks. --patch also takes power ids, e.g.
// --patch=lantern.cost:1,recall.recharge:2, to try numbers without editing data/powers.js.
// Each row prints the win rate with its 95% interval, uses per game of each side's power,
// first-player wins and average rounds.
import { loadRift } from './test/harness.mjs';
import { Worker, isMainThread, parentPort, workerData } from 'node:worker_threads';
import os from 'node:os';

const args = process.argv.slice(2);
const N = Number(args.find(a => /^\d+$/.test(a)) || 1000);
const opt = (name, dflt) => { const a = args.find(x => x.startsWith('--' + name + '=')); return a ? a.slice(name.length + 3) : dflt; };
const flag = name => args.includes('--' + name);
const SEED = opt('seed', args.some(a => /^--powers/.test(a)) ? 'powers' : 'sim');
const TEAM = Number(opt('team', 10));
const LEGENDARIES = flag('legendaries');
const MIRROR = flag('mirror');
const HE = Number(opt('he', Math.max(200, Math.round(N / 2))));
const OVERRIDES = {};
(opt('set', '') || '').split(',').filter(Boolean).forEach(kv => {
    const [k, v] = kv.split(':');
    OVERRIDES[k] = v.includes('/') ? v.split('/').map(Number) : v === 'true' ? true : v === 'false' ? false : isNaN(+v) ? v : +v;
});

const Rift = loadRift([
    'js/core/rift.js', 'js/core/state.js', 'data/creatures.js', 'data/items.js', 'data/axioms.js', 'data/tactics.js', 'data/fate.js', 'data/avatars.js', 'data/powers.js',
    'js/battle/abilities.js', 'js/battle/engine.js', 'js/battle/ai.js', 'js/battle/fate.js', 'js/battle/lesson.js', 'data/decks.js',
]);
const { Engine, AI, Fate, Lesson } = Rift.Battle;
const PATCH = opt('patch', '');
PATCH.split(',').filter(Boolean).forEach(kv => {
    const [path, v] = kv.split(':');
    const [id, field] = path.split('.');
    const D = Rift.data.creatures[id] || Rift.data.tactics[id] || Rift.data.axioms[id] || Rift.data.powers[id];
    if (!D) throw new Error('Unknown id in --patch: ' + id);
    D[field] = field === 'keywords' ? (v === 'none' ? [] : v.split('+')) : isNaN(+v) ? v : +v;
});
// --ai=normal.mistake:0.2,expert.width:3 tries AI level settings (AI.LEVELS / AI.EXPERT) without editing files.
const AI_PATCH = opt('ai', '');
AI_PATCH.split(',').filter(Boolean).forEach(kv => {
    const [path, v] = kv.split(':');
    const [level, key] = path.split('.');
    const target = level === 'expert' && key in AI.EXPERT ? AI.EXPERT : AI.LEVELS[level];
    if (!target) throw new Error('Unknown level in --ai: ' + level);
    target[key] = v === 'true' ? true : v === 'false' ? false : +v;
});
// --syllo-hearts=N gives Syllo N hearts in the story-challenge row (default: the game's own setting).
const SYLLO_HEARTS = opt('syllo-hearts', null);
const OUTCOMES = ['fine', 'scarred', 'injured', 'warp', 'death'];

function matchup(label, g) {
    const rng = Rift.makeRng(SEED + ':' + label + ':' + g);
    const teamA = Engine.randomTeam(rng, TEAM, { prefix: 'g' + g + 'a', legendaries: LEGENDARIES });
    const teamB = MIRROR ? teamA.map(c => Object.assign({}, c, { uid: c.uid.replace(/a-/, 'b-') })) : Engine.randomTeam(rng, TEAM, { prefix: 'g' + g + 'b', legendaries: LEGENDARIES });
    const axA = rng.shuffle(Rift.data.axiomDecks.starter).slice(0, 10);
    const axB = MIRROR ? axA.slice() : rng.shuffle(Rift.data.axiomDecks.starter).slice(0, 10);
    const tacA = tacticsFor(rng, teamA);
    const tacB = MIRROR ? (tacA && tacA.slice()) : tacticsFor(rng, teamB);
    return { teams: [teamA, teamB], axioms: [axA, axB], tactics: [tacA, tacB] };
}

// --colour=N: N of the ten starter tactics are swapped for colour tactics of the team's colours
// (random, distinct; --only=id forces that one colour tactic in, whatever the team's colours).
const COLOUR_N = Number(opt('colour', 0));
const ONLY = opt('only', '');
function tacticsFor(rng, team) {
    if (!COLOUR_N && !ONLY) return undefined;
    const D = Rift.data.tacticDecks;
    let pool = [];
    if (ONLY) pool = [ONLY];
    else {
        const colours = [...new Set(team.map(c => Rift.data.creatures[c.species].colour))];
        colours.forEach(col => (D.colour[col] || []).forEach(id => pool.push(id)));
        pool = rng.shuffle(pool).slice(0, COLOUR_N);
    }
    return rng.shuffle(D.starter).slice(0, 10 - pool.length).concat(pool);
}

// Syllo's Road challenge, as js/ui/battles.js story() sets it up (keep the two in step).
const SYLLO_TEAM = ['attenbirdough', 'eelish', 'beansprout', 'kardashiant', 'attenbirdough', 'eelish', 'zuckerborg', 'beansprout'];
const SYLLO_TACTICS = ['look-it-up', 'look-it-up', 'clockwork', 'clockwork', 'stand-firm', 'eureka', 'pep-talk', 'occams-razor'];
const SYLLO_HEARTS_GAME = 8; // SYLLO_HEARTS in js/ui/battles.js (the player has the default 12)
const BOSS_DECKS = Object.keys(Rift.data.decks || {});
const deckTeam = (deck, prefix) => deck.creatures.map((species, i) => ({ uid: prefix + i, species, injuries: [], scars: [], powerDelta: 0, warped: null, trophyOf: null }));

// One matchup for a scenario: random teams ('random'), a built boss deck for the Expert seat vs the
// loaned starter deck ('boss'), or Syllo's story challenge with the player in seat 0 ('syllo').
function scenarioGame(scenario, label, g, levels, powers) {
    const starterTactics = Rift.data.tacticDecks.starter;
    if (scenario === 'syllo') {
        return {
            orders: [0],
            teams: [Lesson.starter(), Lesson.team(SYLLO_TEAM, 'syllo-')],
            players: [
                { name: 'You', team: Lesson.starter(), tactics: starterTactics, axioms: [] },
                { name: 'Syllo', team: Lesson.team(SYLLO_TEAM, 'syllo-'), tactics: SYLLO_TACTICS, hearts: SYLLO_HEARTS == null ? SYLLO_HEARTS_GAME : +SYLLO_HEARTS },
            ],
            axiomDeck: ['underdog', 'thrift', 'three-actions', 'normal-hearts', 'mercy', 'arrival', 'age-of-reason'],
            options: { shuffle: false, shuffleAxioms: false, deckSize: 16, mode: 'practice' },
        };
    }
    const m = matchup(label, g);
    if (scenario === 'boss') {
        m.deckId = BOSS_DECKS[g % BOSS_DECKS.length];
        const deck = Rift.data.decks[m.deckId];
        m.teams = levels.map((lv, p) => (AI.levelOf(lv) === 'expert' ? deckTeam(deck, 'g' + g + 'boss') : Lesson.starter()));
        m.tactics = levels.map(lv => (AI.levelOf(lv) === 'expert' ? deck.tactics : starterTactics));
    }
    return {
        orders: [0, 1], teams: m.teams, deckId: m.deckId,
        players: m.teams.map((team, p) => ({ name: 'P' + p, team, axioms: m.axioms[p], tactics: m.tactics ? m.tactics[p] : undefined, power: (powers && powers[p]) || undefined })),
        options: { mode: 'trainer' },
    };
}

function newSide() { return { players: 0, rolls: 0, fine: 0, scarred: 0, injured: 0, warp: 0, death: 0, anyDeath: 0, anyHurt: 0 }; }
function tally(F, fate) {
    F.players += 1;
    let death = false, hurt = false;
    fate.results.forEach(r => {
        F[r.outcome] += 1; F.rolls += 1;
        if (r.outcome === 'death') death = true;
        if (r.outcome === 'death' || r.outcome === 'injured') hurt = true;
    });
    if (death) F.anyDeath += 1;
    if (hurt) F.anyHurt += 1;
}

function runRange(from, to, levels, label, scenario, powers) {
    const t0 = Date.now();
    const st = {
        games: 0, firstWins: 0, decided: 0, draws: 0, seatWins: [0, 0], levelWins: {},
        turns: 0, rounds: 0, roundsHist: {}, heartsWinner: 0, heartsLoser: 0, defeated: 0, lost: 0,
        reasons: {}, tactics: {}, axioms: {}, flips: 0, resets: 0, reverseEnds: 0,
        species: {}, fate: { won: newSide(), lost: newSide() },
        expertMs: { moves: 0, sum: 0, max: 0, over100: 0, over300: 0 }, decks: {},
        powerUses: [0, 0], powerGames: [0, 0],
    };
    levels.forEach(lv => { st.levelWins[lv] = 0; });
    const row = (map, id) => map[id] || (map[id] = { plays: 0, games: 0, wins: 0 });
    for (let g = from; g < to; g++) {
        const m = scenarioGame(scenario || 'random', label, g, levels, powers);
        for (const first of m.orders) {
            const seed = SEED + ':' + label + ':' + g + ':' + first;
            let s = Engine.createBattle({
                seed,
                players: m.players,
                axiomDeck: m.axiomDeck,
                options: Object.assign({}, m.options, { first }, OVERRIDES),
            });
            let guard = 0;
            while (Engine.winner(s) == null) {
                const p = Engine.decider(s);
                const t1 = performance.now();
                const a = AI.choose(s, { level: levels[p] });
                const dt = performance.now() - t1;
                if (AI.levelOf(levels[p]) === 'expert' && s.phase === 'main') {
                    const X = st.expertMs;
                    X.moves += 1; X.sum += dt; X.max = Math.max(X.max, dt);
                    if (dt > 100) X.over100 += 1;
                    if (dt > 300) X.over300 += 1;
                }
                s = Engine.applyAction(s, a);
                if (++guard > 6000) throw new Error('Battle did not finish');
            }
            const log = Engine.fullLog(s);
            if (m.deckId) {
                const r = st.decks[m.deckId] || (st.decks[m.deckId] = { games: 0, wins: 0 });
                r.games += 1;
                if (s.winner !== 'draw' && AI.levelOf(levels[s.winner]) === 'expert') r.wins += 1;
            }
            st.games += 1;
            st.turns += s.turn;
            st.rounds += s.round;
            const bucket = s.round <= 6 ? '≤6' : s.round <= 8 ? '7-8' : s.round <= 11 ? '9-11' : s.round <= 14 ? '12-14' : s.round <= 20 ? '15-20' : '21+';
            st.roundsHist[bucket] = (st.roundsHist[bucket] || 0) + 1;
            st.reasons[s.endReason] = (st.reasons[s.endReason] || 0) + 1;
            if (s.winner === 'draw') st.draws += 1;
            else {
                st.decided += 1;
                st.seatWins[s.winner] += 1;
                st.levelWins[levels[s.winner]] += 1;
                if (s.winner === first) st.firstWins += 1;
                st.heartsWinner += s.players[s.winner].hearts;
                st.heartsLoser += s.players[1 - s.winner].hearts;
            }
            const used = [{}, {}];
            log.forEach(e => {
                if (e.t === 'defeated') st.defeated += 1;
                if (e.t === 'flip') st.flips += 1;
                if (e.t === 'reset') st.resets += 1;
                if (e.t === 'tactic-play') { row(st.tactics, e.id).plays += 1; used[e.player]['t:' + e.id] = true; }
                if (e.t === 'axiom-play') { row(st.axioms, e.id).plays += 1; used[e.player]['a:' + e.id] = true; }
                if (e.t === 'power-use') { st.powerUses[e.player] += 1; used[e.player].power = true; }
            });
            [0, 1].forEach(p => {
                const won = s.winner === p;
                if (used[p].power) { st.powerGames[p] += 1; delete used[p].power; }
                Object.keys(used[p]).forEach(k => {
                    const r = row(k[0] === 't' ? st.tactics : st.axioms, k.slice(2));
                    r.games += 1;
                    if (won) r.wins += 1;
                });
                const lost = Engine.lostUids(s, p);
                st.lost += lost.length;
                if (s.winner !== 'draw') tally(won ? st.fate.won : st.fate.lost, Fate.roll({ instances: m.teams[p], defeated: lost, mode: 'trainer', won, seed: seed + ':fate:' + p }));
                if (levels[0] === levels[1]) new Set(m.teams[p].map(c => c.species)).forEach(id => {
                    const r = row(st.species, id);
                    r.games += 1;
                    if (won) r.wins += 1;
                });
            });
        }
    }
    st.ms = Date.now() - t0;
    return st;
}

function merge(a, b) {
    for (const k in b) {
        if (typeof b[k] === 'number') a[k] = k === 'max' ? Math.max(a[k] || 0, b[k]) : (a[k] || 0) + b[k];
        else if (b[k] && typeof b[k] === 'object') merge(a[k] || (a[k] = Array.isArray(b[k]) ? [] : {}), b[k]);
    }
    return a;
}

const WORKERS = Math.max(1, Number(opt('workers', os.cpus().length)));
async function run(n, levels, label, scenario, powers) {
    const t0 = Date.now();
    const parts = Math.min(WORKERS, n);
    if (parts <= 1) return runRange(0, n, levels, label, scenario, powers);
    const chunks = [];
    for (let i = 0; i < parts; i++) {
        const from = Math.floor(i * n / parts), to = Math.floor((i + 1) * n / parts);
        chunks.push(new Promise((resolve, reject) => {
            const w = new Worker(new URL(import.meta.url), { argv: process.argv.slice(2), workerData: { from, to, levels, label, scenario, powers } });
            w.once('message', resolve);
            w.once('error', reject);
        }));
    }
    const out = (await Promise.all(chunks)).reduce((acc, st) => merge(acc, st), {});
    out.ms = Date.now() - t0;
    return out;
}

const pct = (a, b) => (b ? (100 * a / b).toFixed(1) : '0.0') + '%';
const avg = (a, b) => (b ? (a / b).toFixed(2) : '0');

function report(title, st) {
    console.log(`\n== ${title} (${st.games} games, ${(st.ms / 1000).toFixed(1)} s) ==`);
    console.log(`first player wins          ${pct(st.firstWins, st.decided)} of decided games`);
    console.log(`draws                      ${pct(st.draws, st.games)}`);
    console.log(`end reasons                ${Object.entries(st.reasons).map(([k, v]) => `${k} ${pct(v, st.games)}`).join(', ')}`);
    console.log(`average rounds             ${avg(st.rounds, st.games)}  (personal turns ${avg(st.turns, st.games)})`);
    console.log(`rounds histogram           ${['≤6', '7-8', '9-11', '12-14', '15-20', '21+'].map(k => `${k}: ${pct(st.roundsHist[k] || 0, st.games)}`).join('  ')}`);
    console.log(`hearts left                winner ${avg(st.heartsWinner, st.decided)}, loser ${avg(st.heartsLoser, st.decided)}`);
    console.log(`creatures defeated         ${avg(st.defeated, 2 * st.games)} per player (lost at the end: ${avg(st.lost, 2 * st.games)})`);
    console.log(`Fate events per game       flips ${avg(st.flips, st.games)}, resets ${avg(st.resets, st.games)}`);
}

function playTable(title, map, games) {
    console.log(`\n-- ${title}: plays per game, share of player-games that played it, win rate when played --`);
    Object.entries(map).sort((a, b) => b[1].plays - a[1].plays).forEach(([id, r]) => {
        console.log(`  ${id.padEnd(18)} ${avg(r.plays, games).padStart(5)}  ${pct(r.games, 2 * games).padStart(6)}  win ${pct(r.wins, r.games).padStart(6)}`);
    });
}

function fateReport(F) {
    console.log('\n-- fate per player per risked battle (data/fate.js odds) --');
    console.log('                       winners           losers');
    const sides = [F.won, F.lost];
    console.log('rolls per player       ' + sides.map(t => avg(t.rolls, t.players).padEnd(18)).join(''));
    OUTCOMES.forEach(k => console.log('  ' + k.padEnd(21) + sides.map(t => (avg(t[k], t.players) + ' (' + pct(t[k], t.rolls) + ')').padEnd(18)).join('')));
    console.log('battles: perm. loss    ' + sides.map(t => pct(t.anyDeath, t.players).padEnd(18)).join(''));
    console.log('battles: injury/death  ' + sides.map(t => pct(t.anyHurt, t.players).padEnd(18)).join(''));
}

// The level ladder: each row is --games games of level A vs level B (A's win rate is reported).
const LADDER = [
    { id: 'nc', title: 'Competent vs Normal', a: 'competent', b: 'normal', scenario: 'random', target: [65, 75] },
    { id: 'ce', title: 'Expert vs Competent', a: 'expert', b: 'competent', scenario: 'random', target: [60, 70] },
    { id: 'boss', title: 'Expert (built boss deck) vs Competent (starter deck)', a: 'expert', b: 'competent', scenario: 'boss', target: [75, 85] },
    { id: 'syllo', title: 'Beginner player vs Normal Syllo (Road challenge)', a: 'beginner', b: 'normal', scenario: 'syllo', target: [65, 75] },
];

async function ladder() {
    const GAMES = Number(opt('games', 1100));
    const rows = (opt('rows', '') || LADDER.map(r => r.id).join(',')).split(',');
    console.log(`AI level ladder: ${GAMES} games per row, seed "${SEED}"${PATCH ? ', patch ' + PATCH : ''}`);
    const ms = { moves: 0, sum: 0, max: 0, over100: 0, over300: 0 };
    for (const row of LADDER.filter(r => rows.includes(r.id))) {
        let parts;
        if (row.scenario === 'syllo') parts = [await run(GAMES, [row.a, row.b], 'ladder-' + row.id, row.scenario)];
        else {
            const m = Math.ceil(GAMES / 4); // × 2 turn orders × swapped seats
            parts = [await run(m, [row.a, row.b], 'ladder-' + row.id + '-ab', row.scenario), await run(m, [row.b, row.a], 'ladder-' + row.id + '-ba', row.scenario)];
        }
        const games = parts.reduce((t, p) => t + p.games, 0);
        const wins = parts.reduce((t, p) => t + p.levelWins[row.a], 0);
        const draws = parts.reduce((t, p) => t + p.draws, 0);
        const rounds = parts.reduce((t, p) => t + p.rounds, 0);
        const secs = parts.reduce((t, p) => t + p.ms, 0) / 1000;
        parts.forEach(p => merge(ms, p.expertMs));
        const rate = wins / games;
        const half = 196 * Math.sqrt(rate * (1 - rate) / games);
        const ok = 100 * rate >= row.target[0] - half && 100 * rate <= row.target[1] + half;
        console.log(`${row.title.padEnd(54)} ${(100 * rate).toFixed(1).padStart(5)}% ±${half.toFixed(1)}  (target ${row.target[0]}–${row.target[1]}%) ${ok ? 'ok' : 'OFF'}   ${games} games, draws ${pct(draws, games)}, rounds ${avg(rounds, games)}, ${secs.toFixed(0)} s`);
        const decks = parts.reduce((acc, p) => merge(acc, p.decks || {}), {});
        if (Object.keys(decks).length) console.log('    per deck: ' + Object.entries(decks).map(([id, r]) => `${id} ${pct(r.wins, r.games)} (${r.games})`).join(', '));
    }
    if (ms.moves) console.log(`Expert main-phase move time: mean ${(ms.sum / ms.moves).toFixed(1)} ms, max ${ms.max.toFixed(0)} ms, over 100 ms ${pct(ms.over100, ms.moves)}, over 300 ms ${pct(ms.over300, ms.moves)} (${ms.moves} moves, one core each)`);
}

// ---- hero powers (--powers) -------------------------------------------------------------

const AVATAR_POWERS = [];
Object.values(Rift.data.avatars).forEach(a => ['girl', 'boy'].forEach(v => {
    const id = a.powers && a.powers[v];
    if (id && !AVATAR_POWERS.includes(id)) AVATAR_POWERS.push(id);
}));
const ALL_POWERS = Object.keys(Rift.data.powers);
const TWEAK_IDS = Object.keys(Rift.data.powerTweaks);
const pwLabel = pw => (pw ? pw.id + (pw.tweaks.length ? '+' + pw.tweaks.join('+') : '') : 'none');
const pwNumbers = pw => {
    if (!pw) return '';
    const st = Engine.powerStatus(Engine.createBattle({ seed: 'n', players: [{ team: Engine.randomTeam(Rift.makeRng('n'), 3, { prefix: 'a' }), power: pw }, { team: Engine.randomTeam(Rift.makeRng('m'), 3, { prefix: 'b' }) }] }), 0);
    return (st.heartCost ? st.heartCost + 'h' : st.cost) + '/' + st.recharge;
};

// One row: power a vs power b (null: none), both at `level`, the same matchups with a and b in
// swapped seats, each in both turn orders. Returns a's win rate (draws count half) and more.
async function powerRow(a, b, games, level) {
    const m = Math.ceil(games / 4);
    const label = 'pw';
    const x = await run(m, [level, level], label, 'random', [a, b]);
    const y = await run(m, [level, level], label, 'random', [b, a]);
    const n = x.games + y.games;
    const draws = x.draws + y.draws;
    const rate = (x.seatWins[0] + y.seatWins[1] + draws / 2) / n;
    return {
        games: n, rate, half: 1.96 * Math.sqrt(rate * (1 - rate) / n), draws,
        first: (x.firstWins + y.firstWins) / Math.max(1, x.decided + y.decided), rounds: (x.rounds + y.rounds) / n,
        usesA: (x.powerUses[0] + y.powerUses[1]) / n, usesB: (x.powerUses[1] + y.powerUses[0]) / n,
        secs: (x.ms + y.ms) / 1000,
    };
}

const f1 = v => (100 * v).toFixed(1);
const verdict = (v, lo, hi) => (v >= lo && v <= hi ? 'ok' : 'OFF');

async function powersMode() {
    const mode = opt('powers', 'none') || 'none';
    const GAMES = Number(opt('games', 1100));
    const level = AI.levelOf(opt('level', 'competent'));
    const only = (opt('pw', '') || '').split(',').filter(Boolean);
    const tws = (opt('tw', '') || '').split(',').filter(Boolean);
    const pick = list => (only.length ? list.filter(id => only.includes(id)) : list);
    console.log(`Hero powers: ${GAMES} games per row, ${level} vs ${level}, seed "${SEED}"${PATCH ? ', patch ' + PATCH : ''}`);
    const all = mode === 'all';
    const pool = { first: 0, rounds: 0, games: 0 };
    const add = r => { pool.first += r.first * r.games; pool.rounds += r.rounds * r.games; pool.games += r.games; };

    if (mode === 'none' || all) {
        console.log('\n-- each power vs no power (target: +3 to +8 points) --');
        console.log('power                cost/rech   win%   ±95%   delta  verdict  uses/game  first%  rounds');
        for (const id of pick(ALL_POWERS)) {
            const pw = { id, tweaks: [] };
            const r = await powerRow(pw, null, GAMES, level);
            add(r);
            const d = 100 * r.rate - 50;
            console.log(`${id.padEnd(20)} ${pwNumbers(pw).padEnd(9)} ${f1(r.rate).padStart(6)}  ±${(100 * r.half).toFixed(1)}  ${(d >= 0 ? '+' : '') + d.toFixed(1).padStart(4)}   ${verdict(d, 3, 8).padEnd(7)}  ${r.usesA.toFixed(2).padStart(8)}  ${f1(r.first).padStart(6)}  ${r.rounds.toFixed(2)}`);
        }
        if (!only.length) {
            const r = await powerRow(null, null, GAMES, level);
            console.log(`${'(no power either side)'.padEnd(30)}                                       ${f1(r.first).padStart(6)}  ${r.rounds.toFixed(2)}`);
        }
    }

    if (mode === 'pairs' || all) {
        const ids = pick(AVATAR_POWERS);
        console.log('\n-- avatar power pairs (row power\'s win rate vs column; target 45–55%) --');
        const M = {};
        const off = [];
        for (let i = 0; i < ids.length; i++) {
            for (let j = i + 1; j < ids.length; j++) {
                const r = await powerRow({ id: ids[i], tweaks: [] }, { id: ids[j], tweaks: [] }, GAMES, level);
                add(r);
                M[ids[i] + '|' + ids[j]] = r.rate;
                M[ids[j] + '|' + ids[i]] = 1 - r.rate;
                const ok = verdict(100 * r.rate, 45, 55);
                if (ok === 'OFF') off.push(`${ids[i]} vs ${ids[j]} ${f1(r.rate)}%`);
                console.log(`  ${ids[i].padEnd(18)} vs ${ids[j].padEnd(18)} ${f1(r.rate).padStart(5)}% ±${(100 * r.half).toFixed(1)}  ${ok}  uses ${r.usesA.toFixed(2)} / ${r.usesB.toFixed(2)}  first ${f1(r.first)}%  rounds ${r.rounds.toFixed(2)}`);
            }
        }
        const short = id => id.slice(0, 6);
        console.log('\n' + ''.padEnd(19) + ids.map(id => short(id).padStart(7)).join('') + '   mean');
        ids.forEach(a => {
            const vals = ids.filter(b => b !== a).map(b => M[a + '|' + b]);
            console.log(a.padEnd(19) + ids.map(b => (a === b ? '—' : f1(M[a + '|' + b])).padStart(7)).join('') + f1(vals.reduce((t, v) => t + v, 0) / vals.length).padStart(7));
        });
        console.log(off.length ? 'Outside 45–55%: ' + off.join('; ') : 'Every pairing within 45–55%.');
    }

    if (mode === 'tweaks' || all) {
        console.log('\n-- each tweak vs the same power untweaked (target: 46–54%) --');
        console.log('power + tweak                     cost/rech   win%   ±95%  verdict  uses tweak/base  rounds');
        for (const id of pick(AVATAR_POWERS)) {
            for (const t of TWEAK_IDS.filter(t => !tws.length || tws.includes(t))) {
                const pw = { id, tweaks: [t] };
                const r = await powerRow(pw, { id, tweaks: [] }, GAMES, level);
                add(r);
                console.log(`${pwLabel(pw).padEnd(33)} ${pwNumbers(pw).padEnd(9)} ${f1(r.rate).padStart(6)}  ±${(100 * r.half).toFixed(1)}  ${verdict(100 * r.rate, 46, 54).padEnd(7)}  ${r.usesA.toFixed(2)} / ${r.usesB.toFixed(2)}     ${r.rounds.toFixed(2)}`);
            }
        }
    }
    if (pool.games) console.log(`\nAll rows: first player wins ${f1(pool.first / pool.games)}%, average rounds ${(pool.rounds / pool.games).toFixed(2)} (${pool.games} games)`);
}

async function main() {
if (flag('ladder')) return ladder();
if (args.some(a => a === '--powers' || a.startsWith('--powers='))) return powersMode();
console.log(`Card Arena simulator: ${N} matchups × 2 seat orders, seed "${SEED}", team ${TEAM}${LEGENDARIES ? ', with legendaries' : ''}${MIRROR ? ', MIRROR' : ''}`);
if (Object.keys(OVERRIDES).length) console.log('overrides: ' + JSON.stringify(OVERRIDES));
if (PATCH) console.log('patch:     ' + PATCH);
console.log('defaults:  ' + JSON.stringify(Object.assign({}, Engine.DEFAULTS, OVERRIDES), ['hearts', 'openHand', 'openAxioms', 'spark', 'fateStart', 'fateGap', 'maxTurns']));

const hh = await run(N, ['competent', 'competent'], 'hh');
report('Competent vs Competent', hh);
playTable('tactics', hh.tactics, hh.games);
playTable('axiom cards', hh.axioms, hh.games);
fateReport(hh.fate);

if (!flag('hh-only')) {
    const he = await run(Math.ceil(HE / 2), ['competent', 'normal'], 'he');
    const eh = await run(Math.ceil(HE / 2), ['normal', 'competent'], 'eh');
    const games = he.games + eh.games;
    console.log(`\n== Competent vs Normal (${games} games, both seats and both turn orders) ==`);
    console.log(`competent wins             ${pct(he.levelWins.competent + eh.levelWins.competent, games)}   normal ${pct(he.levelWins.normal + eh.levelWins.normal, games)}   draws ${pct(he.draws + eh.draws, games)}`);
    console.log(`average rounds             ${avg(he.rounds + eh.rounds, games)}`);
}

if (flag('species')) {
    console.log('\n-- win rate of teams containing each species (competent vs competent) --');
    Object.entries(hh.species).sort((a, b) => b[1].wins / b[1].games - a[1].wins / a[1].games)
        .forEach(([id, r]) => console.log(`  ${id.padEnd(14)} ${pct(r.wins, r.games).padStart(6)}  (${r.games} teams)`));
}
}

if (!isMainThread) {
    parentPort.postMessage(runRange(workerData.from, workerData.to, workerData.levels, workerData.label, workerData.scenario, workerData.powers));
} else {
    await main();
}
