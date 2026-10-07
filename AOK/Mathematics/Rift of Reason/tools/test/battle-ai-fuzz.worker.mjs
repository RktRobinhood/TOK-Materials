// Worker for the AI-vs-AI fuzz in battle-cycle.test.mjs: plays games [from, to) with random
// teams, tactics, axiom decks, options and AI levels, and checks the card invariants.
import { parentPort, workerData } from 'node:worker_threads';
import assert from 'node:assert/strict';
import { Rift, E, AI, invariants } from './battle-helpers.mjs';

const { from, to } = workerData;
const out = { games: 0, steps: 0, reasons: {}, error: null };
const allTactics = Object.keys(Rift.data.tactics);
const allAxioms = Object.keys(Rift.data.axioms);
let g = from;
try {
    for (; g < to; g++) {
        const rng = Rift.makeRng('aifuzz-' + g);
        const team = p => E.randomTeam(rng, rng.int(3, 14), { prefix: 'f' + g + p, legendaries: rng.chance(0.5) });
        const tactics = () => rng.shuffle(allTactics.concat(allTactics)).slice(0, rng.int(0, 12));
        const levels = [rng.chance(0.3) ? 'hard' : 'easy', rng.chance(0.3) ? 'hard' : 'easy'];
        let s = E.createBattle({
            seed: 'aifuzz-' + g,
            // Player 0 may carry bag items: the AI must ignore them (it never uses items).
            players: [{ name: 'A', team: team(0), tactics: tactics(), bag: g % 3 ? [] : ['tonic', 'anchor'] }, { name: 'B', team: team(1), tactics: tactics() }],
            axiomDeck: rng.shuffle(allAxioms).slice(0, rng.int(0, 20)),
            options: { hearts: rng.int(2, 10), timeline: !rng.chance(0.15), spark: !rng.chance(0.2), fateStart: rng.int(1, 8), fateGap: rng.int(2, 8) },
        });
        const check = g % 10 === 0;
        let steps = 0;
        while (E.winner(s) == null) {
            const p = E.decider(s);
            const a = AI.choose(s, { level: levels[p], salt: String(g) });
            assert.ok(a, 'the AI always finds an action (phase ' + s.phase + ')');
            assert.equal(a.player, p);
            s = E.applyAction(s, a); // throws on an illegal action
            if (check) invariants(s, assert);
            assert.ok(++steps < 3000, 'game did not finish');
        }
        invariants(s, assert);
        out.games += 1;
        out.steps += steps;
        out.reasons[s.endReason] = (out.reasons[s.endReason] || 0) + 1;
    }
} catch (e) {
    out.error = 'game ' + g + ': ' + (e && e.stack || e);
}
parentPort.postMessage(out);
