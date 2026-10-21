// #101 actual engine/AI sampling. node tools/sim-flux.mjs [matches-per-row=20] [profiles,comma,separated] [powers]
// JSON on stdout; no saves, keys, art or recording calls.
import { loadRift } from './test/harness.mjs';
const R = loadRift(['js/core/rift.js', 'js/core/state.js', 'data/creatures.js', 'data/items.js', 'data/axioms.js',
    'data/tactics.js', 'data/fate.js', 'data/avatars.js', 'data/powers.js', 'data/starters.js', 'js/battle/abilities.js', 'js/battle/engine.js', 'js/battle/ai.js']);
const E = R.Battle.Engine, AI = R.Battle.AI, N = Number(process.argv[2] || 20);
const profiles = process.argv[3] ? process.argv[3].split(',') : ['legacy-baseline', 'intro', 'eligible', 'legacy-custom'];
const powers = process.argv[4] === 'powers';
const legacy = ['underdog', 'reverse-hearts', 'normal-hearts', 'thrift', 'abundance', 'study', 'arrival', 'vigilance', 'choice', 'mercy'];
const custom = ['infinity', 'infinity', ...legacy.slice(0, 8)];
const types = Object.keys(R.data.starterDecks.decks), rows = [];
for (const profile of profiles) for (const level of ['normal', 'competent', 'expert']) {
    const m = { profile, level, matches: N, contributions: 0, modifierSlots: 0, unlimitedSlots: 0, sharedDecksWithUnlimited: 0,
        turns: 0, maxTurns: 0, draws: 0, drawnRules: 0, drawnModifiers: 0, drawnUnlimited: 0, playedModifiers: 0, freeModifiers: 0,
        noChangeFlips: 0, announcedUnlimited: 0, flippedUnlimited: 0, playedUnlimited: 0, endedTurns: 0, noLegalCardEnds: 0, emptyBoardNoLegalCardEnds: 0, endWithAffordableCreature: 0,
        earlyCreaturePlays: 0, deadModifierHandSlots: 0, modifierHandSlots: 0 };
    for (let i = 0; i < N; i++) {
        const seed = 'flux-101-' + i;
        const decks = [0, 1].map(p => profile === 'legacy-baseline' ? legacy.slice() : profile === 'legacy-custom' ? custom.slice()
            : profile === 'intro' ? R.data.axiomDecks.default.slice() : R.data.flux.contribution(seed + ':' + p, true));
        m.contributions += 2; m.sharedDecksWithUnlimited += decks.some(d => d.includes('infinity'));
        decks.flat().forEach(id => { if (R.data.axioms[id].modifier) m.modifierSlots++; if (id === 'infinity') m.unlimitedSlots++; });
        const players = [0, 1].map(p => {
            const d = R.data.starterDecks.decks[types[(i + p) % types.length]];
            return { name: 'P' + p, team: d.creatures.map((species, j) => ({ uid: 'p' + p + '-' + j, species })), tactics: d.tactics.slice(), axioms: decks[p],
                power: powers ? { id: p === 0 ? 'brainstorm' : 'close-the-proof' } : null };
        });
        let s = E.createBattle({ seed, players, options: { first: i % 2, mode: 'practice' } });
        // Include opening rules, which are dealt quietly rather than emitted as draw events.
        const countRule = id => { m.drawnRules++; if (R.data.axioms[id].modifier) m.drawnModifiers++; if (id === 'infinity') m.drawnUnlimited++; };
        s.players.forEach(p => p.axHand.forEach(countRule));
        m.announcedUnlimited += s.fate.next === 'infinity';
        s = AI.playOut(s, [level, level], (before, a, after) => {
            if (a.type === 'end') {
                m.endedTurns++;
                const legal = E.legalActions(before), P = before.players[a.player];
                const cardActions = legal.filter(x => ['play', 'attack', 'activate', 'axiom'].includes(x.type));
                if (!cardActions.length) { m.noLegalCardEnds++; if (!P.board.length) m.emptyBoardNoLegalCardEnds++; }
                if (legal.some(x => x.type === 'play' && before.cards[x.cid].kind === 'creature')) m.endWithAffordableCreature++;
                P.axHand.filter(id => R.data.axioms[id].modifier).forEach(id => { m.modifierHandSlots++; if (!E.axiomWouldChange(before, id)) m.deadModifierHandSlots++; });
            }
            if (a.type === 'play' && before.round <= 3 && before.cards[a.cid].kind === 'creature') m.earlyCreaturePlays++;
            after.lastEvents.forEach(e => {
                if (e.t === 'draw-axiom') countRule(e.id);
                if (e.t === 'axiom' && R.data.axioms[e.id].modifier) { if (e.player == null) m.freeModifiers++; else m.playedModifiers++; }
                if (e.t === 'axiom-no-change') m.noChangeFlips++;
                if (e.id === 'infinity') {
                    if (e.t === 'fate-next') m.announcedUnlimited++;
                    if (e.t === 'axiom') { if (e.player == null) m.flippedUnlimited++; else m.playedUnlimited++; }
                }
            });
        });
        m.turns += s.turn; m.maxTurns = Math.max(m.maxTurns, s.turn); if (E.winner(s) === 'draw') m.draws++;
    }
    rows.push(m);
    process.stderr.write(profile + '/' + level + ': ' + N + ' matches complete\n');
}
process.stdout.write(JSON.stringify({ seed: 'flux-101', powers, matches: N * rows.length, definitions: {
    noLegalCardEnds: 'End turn with no legal cast, attack, manual Activate or rule cast; includes ordinary exhausted budgets.',
    emptyBoardNoLegalCardEnds: 'The same, with no creature on the active side; descriptive, not proof of an engine lock.',
    endWithAffordableCreature: 'An AI ends while a legal creature cast remains (energy, space and activation included).',
    deadModifierHandSlots: 'Modifier cards with no effective change, sampled at End turn; denominator modifierHandSlots.' }, rows }, null, 2) + '\n');
