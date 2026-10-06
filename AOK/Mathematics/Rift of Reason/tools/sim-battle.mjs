// Headless battle simulator: AI vs AI, for tuning "not too punishing".
//
//   node tools/sim-battle.mjs [N=10000] [--seed=sim] [--team=10] [--no-legendaries]
//
// Prints win rates (first player, hard vs easy), average turns, defeats per
// battle, end reasons, and the fate-outcome distribution per player per RISKED
// battle for both the tuned odds (data/fate.js) and the brief's starting odds,
// plus per-species team win rates.
import { loadRift } from './test/harness.mjs';

const args = process.argv.slice(2);
const N = Number(args.find(a => /^\d+$/.test(a)) || 10000);
const opt = (name, dflt) => { const a = args.find(x => x.startsWith('--' + name + '=')); return a ? a.split('=')[1] : dflt; };
const SEED = opt('seed', 'sim');
const TEAM = Number(opt('team', 10));
const LEGENDARIES = !args.includes('--no-legendaries');

const Rift = loadRift([
    'js/core/rift.js', 'js/core/state.js', 'data/creatures.js', 'data/items.js', 'data/axioms.js', 'data/fate.js',
    'js/battle/abilities.js', 'js/battle/engine.js', 'js/battle/ai.js', 'js/battle/fate.js',
]);
const { Engine, AI, Fate } = Rift.Battle;
const OUTCOMES = ['fine', 'scarred', 'injured', 'warp', 'death'];

function newSide() {
    return { players: 0, rolls: 0, fine: 0, scarred: 0, injured: 0, warp: 0, death: 0, anyDeath: 0, anyHurt: 0, anyBad: 0 };
}
function newFate() { return { all: newSide(), won: newSide(), lost: newSide() }; }

function tally(F, won, fate) {
    [F.all, won ? F.won : F.lost].forEach(t => {
        t.players += 1;
        let death = false, hurt = false, bad = false;
        fate.results.forEach(r => {
            t[r.outcome] += 1;
            t.rolls += 1;
            if (r.outcome === 'death') death = true;
            if (r.outcome === 'death' || r.outcome === 'injured') hurt = true;
            if (r.outcome === 'death' || r.outcome === 'injured' || r.outcome === 'warp') bad = true;
        });
        if (death) t.anyDeath += 1;
        if (hurt) t.anyHurt += 1;
        if (bad) t.anyBad += 1;
    });
}

function run(n, levels, label) {
    const t0 = Date.now();
    const st = {
        n, wins: [0, 0], draws: 0, firstWins: 0, turns: 0, rounds: 0, defeats: 0, lost: 0, steals: 0,
        reasons: {}, species: {}, fate: { tuned: newFate(), brief: newFate() },
    };
    for (let g = 0; g < n; g++) {
        const rng = Rift.makeRng(SEED + ':' + label + ':' + g);
        const teams = [0, 1].map(p => Engine.randomTeam(rng, TEAM, { prefix: 'g' + g + 'p' + p, legendaries: LEGENDARIES }));
        let s = Engine.createBattle({
            seed: SEED + ':' + label + ':' + g,
            players: teams.map((team, p) => ({ name: 'P' + p, team, axioms:rng.shuffle(Rift.data.axiomDecks.starter).slice(0,10) })),
            options: { mode: 'trainer' },
        });
        const first = s.active;
        s = AI.playOut(s, levels);
        const log = Engine.fullLog(s);
        st.turns += s.turn;
        st.rounds += s.round;
        st.reasons[s.endReason] = (st.reasons[s.endReason] || 0) + 1;
        if (s.winner === 'draw') st.draws += 1;
        else {
            st.wins[s.winner] += 1;
            if (s.winner === first) st.firstWins += 1;
        }
        st.defeats += log.filter(e => e.t === 'defeated').length;
        st.steals += log.filter(e => e.t === 'steal').length;
        [0, 1].forEach(p => {
            const lost = Engine.lostUids(s, p);
            const won = s.winner === p;
            st.lost += lost.length;
            const base = { instances: teams[p], defeated: lost, mode: 'trainer', won, seed: s.seed + ':fate:' + p };
            tally(st.fate.tuned, won, Fate.roll(base));
            tally(st.fate.brief, won, Fate.roll(Object.assign({}, base, { odds: Rift.data.fate.briefOdds })));
            new Set(teams[p].map(c => c.species)).forEach(id => {
                const row = st.species[id] || (st.species[id] = { games: 0, wins: 0 });
                row.games += 1;
                if (won) row.wins += 1;
            });
        });
    }
    st.ms = Date.now() - t0;
    return st;
}

const pct = (a, b) => (b ? (100 * a / b).toFixed(1) : '0.0') + '%';
const avg = (a, b) => (b ? (a / b).toFixed(2) : '0');

function printFate(title, F) {
    console.log(`\n== fate per player per risked battle: ${title} ==`);
    console.log('                       all players       winners           losers');
    const sides = [F.all, F.won, F.lost];
    console.log('rolls per player       ' + sides.map(t => avg(t.rolls, t.players).padEnd(18)).join(''));
    OUTCOMES.forEach(k => {
        console.log('  ' + k.padEnd(21) + sides.map(t => (avg(t[k], t.players) + ' (' + pct(t[k], t.rolls) + ')').padEnd(18)).join(''));
    });
    const rate = (label, k) => console.log(label.padEnd(23) + sides.map(t => pct(t[k], t.players).padEnd(18)).join(''));
    rate('battles: perm. loss', 'anyDeath');
    rate('battles: injury/death', 'anyHurt');
    rate('battles: any bad roll', 'anyBad');
    console.log('  (outcomes: average per player per battle, and share of all rolls; "bad" = injured, warp or death)');
}

console.log(`Rift of Reason battle simulator: ${N} battles, seed "${SEED}", team size ${TEAM}${LEGENDARIES ? '' : ', no legendaries'}\n`);

const hh = run(N, ['hard', 'hard'], 'hh');
console.log('== hard AI vs hard AI ==');
console.log(`time                       ${(hh.ms / 1000).toFixed(1)} s`);
console.log(`first player wins          ${pct(hh.firstWins, N - hh.draws)} of decided battles`);
console.log(`draws                      ${pct(hh.draws, N)}`);
console.log(`end reasons                ${Object.entries(hh.reasons).map(([k, v]) => `${k} ${pct(v, N)}`).join(', ')}`);
console.log(`average turns              ${avg(hh.turns, N)}  (rounds ${avg(hh.rounds, N)})`);
console.log(`steals used per battle     ${avg(hh.steals, N)}`);
console.log(`defeats per battle         ${avg(hh.defeats, N)}  (both sides, incl. ones that bounced back to hand)`);
console.log(`creatures lost per player  ${avg(hh.lost, 2 * N)}  (ended the battle in a discard pile → fate roll)`);

printFate('TUNED odds (data/fate.js odds for losers, winnerOdds for winners)', hh.fate.tuned);
printFate('BRIEF starting odds (55/20/12/10/3 for everyone)', hh.fate.brief);

const M = Math.max(1000, Math.round(N / 5));
const he = run(M, ['hard', 'easy'], 'he');
const eh = run(M, ['easy', 'hard'], 'eh');
const hardWins = he.wins[0] + eh.wins[1];
console.log(`\n== hard AI vs easy AI (${2 * M} battles, both seats) ==`);
console.log(`hard wins                  ${pct(hardWins, 2 * M)}   draws ${pct(he.draws + eh.draws, 2 * M)}`);

console.log('\n== win rate of teams containing each species (hard vs hard) ==');
Object.entries(hh.species)
    .sort((a, b) => b[1].wins / b[1].games - a[1].wins / a[1].games)
    .forEach(([id, r]) => console.log(`  ${id.padEnd(14)} ${pct(r.wins, r.games).padStart(6)}  (${r.games} teams)`));
