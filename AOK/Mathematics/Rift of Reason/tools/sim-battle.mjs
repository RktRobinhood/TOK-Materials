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
// or axiom id; keywords joined with +, 'none' for no keywords).
//
// Reports first-player win %, draws, rounds and personal turns, hearts left, creatures
// defeated per player (feeds the fate odds), end reasons, how often each tactic/axiom
// is played and the win rate of the player who played it, Hard vs Easy, and the fate
// outcome distribution per player per RISKED battle.
import { loadRift } from './test/harness.mjs';
import { Worker, isMainThread, parentPort, workerData } from 'node:worker_threads';
import os from 'node:os';

const args = process.argv.slice(2);
const N = Number(args.find(a => /^\d+$/.test(a)) || 1000);
const opt = (name, dflt) => { const a = args.find(x => x.startsWith('--' + name + '=')); return a ? a.slice(name.length + 3) : dflt; };
const flag = name => args.includes('--' + name);
const SEED = opt('seed', 'sim');
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
    'js/core/rift.js', 'js/core/state.js', 'data/creatures.js', 'data/items.js', 'data/axioms.js', 'data/tactics.js', 'data/fate.js',
    'js/battle/abilities.js', 'js/battle/engine.js', 'js/battle/ai.js', 'js/battle/fate.js',
]);
const { Engine, AI, Fate } = Rift.Battle;
const PATCH = opt('patch', '');
PATCH.split(',').filter(Boolean).forEach(kv => {
    const [path, v] = kv.split(':');
    const [id, field] = path.split('.');
    const D = Rift.data.creatures[id] || Rift.data.tactics[id] || Rift.data.axioms[id];
    if (!D) throw new Error('Unknown id in --patch: ' + id);
    D[field] = field === 'keywords' ? (v === 'none' ? [] : v.split('+')) : isNaN(+v) ? v : +v;
});
const OUTCOMES = ['fine', 'scarred', 'injured', 'warp', 'death'];

function matchup(label, g) {
    const rng = Rift.makeRng(SEED + ':' + label + ':' + g);
    const teamA = Engine.randomTeam(rng, TEAM, { prefix: 'g' + g + 'a', legendaries: LEGENDARIES });
    const teamB = MIRROR ? teamA.map(c => Object.assign({}, c, { uid: c.uid.replace(/a-/, 'b-') })) : Engine.randomTeam(rng, TEAM, { prefix: 'g' + g + 'b', legendaries: LEGENDARIES });
    const axA = rng.shuffle(Rift.data.axiomDecks.starter).slice(0, 10);
    const axB = MIRROR ? axA.slice() : rng.shuffle(Rift.data.axiomDecks.starter).slice(0, 10);
    return { teams: [teamA, teamB], axioms: [axA, axB] };
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

function runRange(from, to, levels, label) {
    const t0 = Date.now();
    const st = {
        games: 0, firstWins: 0, decided: 0, draws: 0, seatWins: [0, 0], levelWins: { hard: 0, easy: 0 },
        turns: 0, rounds: 0, roundsHist: {}, heartsWinner: 0, heartsLoser: 0, defeated: 0, lost: 0,
        reasons: {}, tactics: {}, axioms: {}, flips: 0, resets: 0, reverseEnds: 0,
        species: {}, fate: { won: newSide(), lost: newSide() },
    };
    const row = (map, id) => map[id] || (map[id] = { plays: 0, games: 0, wins: 0 });
    for (let g = from; g < to; g++) {
        const m = matchup(label, g);
        for (const first of [0, 1]) {
            const seed = SEED + ':' + label + ':' + g + ':' + first;
            let s = Engine.createBattle({
                seed,
                players: m.teams.map((team, p) => ({ name: 'P' + p, team, axioms: m.axioms[p] })),
                options: Object.assign({ mode: 'trainer', first }, OVERRIDES),
            });
            s = AI.playOut(s, levels);
            const log = Engine.fullLog(s);
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
            });
            [0, 1].forEach(p => {
                const won = s.winner === p;
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
        if (typeof b[k] === 'number') a[k] = (a[k] || 0) + b[k];
        else if (b[k] && typeof b[k] === 'object') merge(a[k] || (a[k] = Array.isArray(b[k]) ? [] : {}), b[k]);
    }
    return a;
}

const WORKERS = Math.max(1, Number(opt('workers', os.cpus().length)));
async function run(n, levels, label) {
    const t0 = Date.now();
    const parts = Math.min(WORKERS, n);
    if (parts <= 1) return runRange(0, n, levels, label);
    const chunks = [];
    for (let i = 0; i < parts; i++) {
        const from = Math.floor(i * n / parts), to = Math.floor((i + 1) * n / parts);
        chunks.push(new Promise((resolve, reject) => {
            const w = new Worker(new URL(import.meta.url), { argv: process.argv.slice(2), workerData: { from, to, levels, label } });
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

async function main() {
console.log(`Card Arena simulator: ${N} matchups × 2 seat orders, seed "${SEED}", team ${TEAM}${LEGENDARIES ? ', with legendaries' : ''}${MIRROR ? ', MIRROR' : ''}`);
if (Object.keys(OVERRIDES).length) console.log('overrides: ' + JSON.stringify(OVERRIDES));
if (PATCH) console.log('patch:     ' + PATCH);
console.log('defaults:  ' + JSON.stringify(Object.assign({}, Engine.DEFAULTS, OVERRIDES), ['hearts', 'openHand', 'openAxioms', 'spark', 'fateStart', 'fateGap', 'maxTurns']));

const hh = await run(N, ['hard', 'hard'], 'hh');
report('Hard vs Hard', hh);
playTable('tactics', hh.tactics, hh.games);
playTable('axiom cards', hh.axioms, hh.games);
fateReport(hh.fate);

if (!flag('hh-only')) {
    const he = await run(Math.ceil(HE / 2), ['hard', 'easy'], 'he');
    const eh = await run(Math.ceil(HE / 2), ['easy', 'hard'], 'eh');
    const games = he.games + eh.games;
    console.log(`\n== Hard vs Easy (${games} games, both seats and both turn orders) ==`);
    console.log(`hard wins                  ${pct(he.levelWins.hard + eh.levelWins.hard, games)}   easy ${pct(he.levelWins.easy + eh.levelWins.easy, games)}   draws ${pct(he.draws + eh.draws, games)}`);
    console.log(`average rounds             ${avg(he.rounds + eh.rounds, games)}`);
}

if (flag('species')) {
    console.log('\n-- win rate of teams containing each species (hard vs hard) --');
    Object.entries(hh.species).sort((a, b) => b[1].wins / b[1].games - a[1].wins / a[1].games)
        .forEach(([id, r]) => console.log(`  ${id.padEnd(14)} ${pct(r.wins, r.games).padStart(6)}  (${r.games} teams)`));
}
}

if (!isMainThread) {
    parentPort.postMessage(runRange(workerData.from, workerData.to, workerData.levels, workerData.label));
} else {
    await main();
}
