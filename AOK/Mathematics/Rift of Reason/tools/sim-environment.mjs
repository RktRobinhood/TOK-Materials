// Paired encounter pacing check for #128. Actual owned starter decks vs actual trainers,
// same seed/turn order with and without the scene event. No classroom claims.
// node tools/sim-environment.mjs [seeds-per-avatar=2] [output.json]
import fs from 'node:fs';
import { loadRift } from './test/harness.mjs';
const R = loadRift(['js/core/rift.js', 'js/core/state.js', 'data/creatures.js', 'data/items.js', 'data/axioms.js',
    'data/tactics.js', 'data/map.js', 'data/decks.js', 'data/starters.js', 'data/avatars.js', 'data/powers.js', 'js/battle/abilities.js', 'js/battle/engine.js', 'js/battle/ai.js']);
const { Engine: E, AI } = R.Battle;
const seeds = Number(process.argv[2] || 2);
const team = (list, prefix) => list.map((species, i) => ({ uid: prefix + i, species }));
const report = { seed: 'env128-rollout', seedsPerAvatar: seeds, policy: 'Competent starter vs authored trainer AI; boy avatar power (untweaked), normal trainer team power, Feed copies that avatar (no saved-use history); no bag items; both first players; paired scene on/off', rows: {} };
for (const [id, trainer] of Object.entries(R.data.trainers)) {
    const row = { games: 0, without: { wins: 0, turns: 0 }, with: { wins: 0, turns: 0 }, events: {}, byAvatar: {} };
    const rival = (trainer.ai === 'expert' && R.data.decks[trainer.deck]) || { creatures: trainer.team, tactics: trainer.tactics || R.data.tacticDecks.starter };
    const environment = (trainer.fate || []).filter(pl => !pl.levels || pl.levels.includes(trainer.ai))
        .map(pl => ({ ...pl, side: pl.side === 'trainer' ? 1 : pl.side === 'player' ? 0 : null }));
    for (const [avatar, starter] of Object.entries(R.data.starterDecks.decks)) {
        const power = R.Powers.forAvatar({ type: avatar, variant: 'boy' });
        const rivalPower = trainer.copiesPower ? power : R.Powers.forTeam(rival.creatures, trainer.ai);
        const score = row.byAvatar[avatar] = { games: 0, without: 0, with: 0 };
        for (let seed = 0; seed < seeds; seed++) for (const first of [0, 1]) {
            row.games++; score.games++;
            for (const enabled of [false, true]) {
                const cfg = { seed: report.seed + ':' + id + ':' + avatar + ':' + seed, environment: enabled ? environment : null,
                    players: [{ name: 'Starter', team: team(starter.creatures, 'a'), tactics: starter.tactics, axioms: R.data.starterDecks.axioms, power },
                        { name: trainer.name, team: team(rival.creatures, 'b'), tactics: rival.tactics, axioms: R.data.axiomDecks.starter, power: rivalPower }], options: { first, mode: 'trainer' } };
                const s = AI.playOut(E.createBattle(cfg), ['competent', trainer.ai]);
                if (E.winner(s) == null) throw Error('Unfinished match: ' + id);
                const key = enabled ? 'with' : 'without';
                row[key].wins += E.winner(s) === 0 ? 1 : 0; row[key].turns += s.turn;
                score[key] += E.winner(s) === 0 ? 1 : 0;
                if (enabled) E.fullLog(s).filter(e => e.t === 'fate-event').forEach(e => { row.events[e.def] = (row.events[e.def] || 0) + 1; });
            }
        }
    }
    report.rows[id] = row;
    console.log(id + ': ' + row.without.wins + ' -> ' + row.with.wins + ' starter wins / ' + row.games + ' paired matches; turns ' + (row.without.turns / row.games).toFixed(1) + ' -> ' + (row.with.turns / row.games).toFixed(1));
}
if (process.argv[3]) fs.writeFileSync(process.argv[3], JSON.stringify(report, null, 2) + '\n');
