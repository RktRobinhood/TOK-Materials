// Feasibility and transparent machine policies, never a claim about student success.
import fs from 'node:fs';
import { loadRift } from './test/harness.mjs';
const R = loadRift(['js/core/rift.js', 'js/core/catch-net.js', 'js/core/catch-games.js']);
const C = R.CatchGames, count = Number(process.argv[2] || 200);
const rows = [];
function play(start, random) {
    let b = start, actions = 0;
    const rng = R.makeRng('policy:' + JSON.stringify(start));
    while (!b.done && actions++ < 100) {
        let action;
        if (b.kind === 'net') action = { cut: random ? rng.pick(R.CatchNetPrototype.available(b)) : R.CatchNetPrototype.sensible(b) };
        else if (b.kind === 'lure') {
            const plan = C.solve(b);
            if (!random && (!plan || !plan.length)) return false;
            action = random ? { cell: rng.int(0, 15) } : plan[0];
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
    policies: { net: 'Choose a safe cut with smallest next room; seed-fixed ties; one action of lookahead, no future search.',
        lure: 'Minimum-turn route using every visible tile shape. This is a planning expert, not an average student.',
        tracks: 'Apply visible-clue direct/subset deductions plus the total trap count until solved. This is a logical expert, not an average player.',
        random: 'Uniform legal cut/trail tile or uniformly chosen unopened unflagged tile. No deliberate-loss coin flip.' },
    limitations: 'These are machine policies. They do not establish ~50% average-student success, 20–60-second timing or enjoyment. Those require classroom play.', rows };
if (process.argv[3]) fs.writeFileSync(process.argv[3], JSON.stringify(report, null, 2) + '\n');
console.table(rows.map(({ kind, rarity, seeds, certified, policyWins, randomWins, bothWins, medianCertificateActions }) => ({ kind, rarity, seeds, certified, policyWins, randomWins, bothWins, medianCertificateActions })));
