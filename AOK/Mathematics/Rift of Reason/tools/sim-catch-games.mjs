// Feasibility and transparent machine policies, never a claim about student success.
import fs from 'node:fs';
import { loadRift } from './test/harness.mjs';
const R = loadRift(['js/core/rift.js', 'js/core/catch-arcade.js', 'js/core/catch-games.js']);
const C = R.CatchGames, count = Number(process.argv[2] || 200);
const rows = [];
const A = R.CatchArcade;
// Real-time games: the documented average sensible player, or random taps about once a second.
function arcadeRandom(rng) {
    return s => {
        if (s.t % (s.kind === 'net' ? 60 : 20)) return null;
        if (s.kind === 'burst') return { fire: Math.round(rng.next() * 6283) / 1000 };
        const c = rng.int(0, A.COLS * A.ROWS - 1);
        return { wall: [c % A.COLS, Math.floor(c / A.COLS), rng.int(0, 1)] };
    };
}
function play(start, random) {
    if (A.KINDS.includes(start.kind)) {
        const seed = JSON.stringify([start.terrain, start.balls, start.shards]);
        return A.play(start, random ? arcadeRandom(R.makeRng('random:' + seed)) : A.average(start.kind, seed)).done === 'caught';
    }
    let b = start, actions = 0;
    const rng = R.makeRng('policy:' + JSON.stringify(start));
    while (!b.done && actions++ < 100) {
        let action;
        if (b.kind === 'lure' || b.kind === 'picture') {
            const plan = C.solve(b);
            if (!random && (!plan || !plan.length)) return false;
            action = random ? { cell: b.kind === 'picture' ? rng.pick(C.pictureMoves(b)) : rng.int(0, 15) } : plan[0];
        } else if (random) {
            const closed = Array.from({ length: b.size ** 2 }, (_, i) => i).filter(i => !b.open.includes(i) && !b.flags.includes(i));
            action = { cell: rng.pick(closed) };
        } else {
            const plan = C.solve(b);
            if (!plan || !plan.length) return false;
            action = plan[0];
        }
        const result = C.step(b, action);
        if (!result) return false;
        b = result.board;
    }
    return b.done === 'caught';
}
for (const kind of C.IDS) for (const rarity of ['common', 'uncommon', 'rare', 'legendary']) {
    const row = { kind, rarity, seeds: count, certified: 0, policyWins: 0, randomWins: 0, greatWins: 0, lureWins: 0, bothWins: 0, certificateActions: [] };
    for (let i = 0; i < count; i++) {
        const seed = 'production-held-out:2381:' + i, base = C.create(kind, seed, rarity, 'charm', false), plan = C.solve(base);
        if (!plan) throw new Error('Uncertified board: ' + JSON.stringify({ kind, rarity, seed }));
        let proof = base;
        for (const action of plan) { if (proof.done) break; proof = C.step(proof, action).board; }
        if (proof.done !== 'caught') throw new Error('Certificate failed');
        row.certified++; row.certificateActions.push(plan.length);
        const won = play(base);
        row.policyWins += Number(won); row.randomWins += Number(play(base, true));
        for (const [item, lure, field] of [['greatcharm', false, 'greatWins'], ['charm', true, 'lureWins'], ['greatcharm', true, 'bothWins']]) {
            const helped = play(C.create(kind, seed, rarity, item, lure));
            if (won && !helped) throw new Error('Assistance worsened this policy');
            row[field] += Number(helped);
        }
    }
    row.certificateActions.sort((a, b) => a - b);
    row.medianCertificateActions = row.certificateActions[Math.floor(count / 2)];
    row.maxCertificateActions = row.certificateActions.at(-1);
    delete row.certificateActions;
    rows.push(row);
}
const report = { seedsPerGameRarity: count, seedPrefix: 'production-held-out:2381:',
    policies: { picture: 'Shortest sliding route from visible numbered pieces. Planning expert, not an average student. Random chooses a uniformly legal adjacent slide.',
        net: 'Average sensible player (catch-arcade.js): looks 0.6–1.5 s between nets, weighs six random spots, skips spots a creature seems to be heading for (speed misjudged up to 25%), reacts in 0.17–0.33 s and slips one cell 20% of the time.',
        burst: 'Average sensible player (catch-arcade.js): holds the pointer down, picks the nearest shard 75% of the time (else a random one), pointer trails it by 0.25 s, about 6° aim error, half a lead, 0.1–0.23 s to re-aim.',
        lure: 'Minimum-turn route using every visible tile shape. This is a planning expert, not an average student.',
        tracks: 'Apply visible-clue direct/subset deductions plus the total trap count until solved. This is a logical expert, not an average player.',
        random: 'Uniform legal trail tile/adjacent slide, uniformly chosen unopened unflagged tile, a random net spot once a second or a random throw three times a second. No deliberate-loss coin flip.' },
    limitations: 'These are machine policies. They do not establish ~50% average-student success, 20–60-second timing or enjoyment. Those require classroom play.', rows };
if (process.argv[3]) fs.writeFileSync(process.argv[3], JSON.stringify(report, null, 2) + '\n');
console.table(rows.map(({ kind, rarity, seeds, certified, policyWins, randomWins, bothWins, medianCertificateActions }) => ({ kind, rarity, seeds, certified, policyWins, randomWins, bothWins, medianCertificateActions })));
