// Card Arena AI: a legal answer in every phase, sensible key decisions, determinism,
// an Easy level that can lose, and a 10,000-game AI-vs-AI fuzz (run in worker threads).
import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import { Worker } from 'node:worker_threads';
import { Rift, E, AI, inst, setup, act, onBoard, toHand, toDiscard, rule, stats } from './battle-helpers.mjs';

const key = a => E.actionKey(a);
function legalChoice(s, level) {
    const a = AI.choose(s, { level });
    assert.ok(a, 'an action');
    assert.ok(E.legalActions(s).some(x => key(x) === key(a)), 'legal: ' + JSON.stringify(a));
    assert.equal(a.player, E.decider(s));
    return a;
}

test('the AI answers the draw choice, the main phase and every kind of question legally', () => {
    for (const level of ['hard', 'easy']) {
        // draw phase
        const d = E.createBattle({ seed: 'ai-draw', players: [{ team: E.randomTeam(Rift.makeRng('x'), 10) }, { team: E.randomTeam(Rift.makeRng('y'), 10) }], options: { first: 0 } });
        assert.equal(legalChoice(d, level).type, 'draw');
        // questions: card (Nature Watch), colour (Predict), axiom (Axiomatic), ability (Reinvention),
        // option (Truth Table, Clockwork), card (Recall)
        const asks = [];
        let s = setup({ p0: ['attenbirdough', 'kardashiant', 'astrophysicat', 'keanu'] });
        toHand(s, 'p0c0');
        asks.push(act(s, { type: 'play', cid: 'p0c0' }));
        s = setup({ p0: ['altmanta'] });
        onBoard(s, 'p0c0');
        asks.push(act(s, { type: 'activate', cid: 'p0c0', ability: 'predict' }));
        s = setup({ p0: ['euclidon'], axioms: ['haste', 'underdog', 'mercy', 'reverse-hearts', 'doubt'] });
        toHand(s, 'p0c0');
        asks.push(act(s, { type: 'play', cid: 'p0c0' }));
        s = setup({ p0: ['gargoyle', 'usainvolt', 'eminemu'] });
        onBoard(s, 'p0c0');
        toDiscard(s, 'p0c1', 'p0c2');
        asks.push(act(s, { type: 'activate', cid: 'p0c0', ability: 'reinvention' }));
        s = setup({ p0: ['booleon', 'kardashiant'] });
        toHand(s, 'p0c0');
        asks.push(act(s, { type: 'play', cid: 'p0c0' }));
        s = setup({ p0: ['kardashiant'], t0: ['clockwork'], options: { timeline: true }, axioms: ['haste'] });
        toHand(s, 'p0t0');
        asks.push(act(s, { type: 'play', cid: 'p0t0' }));
        s = setup({ p0: ['kardashiant', 'keanu', 'khaby'], t0: ['recall'] });
        toDiscard(s, 'p0c1', 'p0c2');
        toHand(s, 'p0t0');
        asks.push(act(s, { type: 'play', cid: 'p0t0' }));
        assert.deepEqual(asks.map(x => x.pending && x.pending.kind), ['card', 'colour', 'axiom', 'ability', 'option', 'option', 'card']);
        asks.forEach(x => assert.equal(legalChoice(x, level).type, 'choose'));
        // main phase with attacks, plays, tactics, activations, axiom cards and the Spark
        s = setup({ p0: ['astrophysicat', 'kardashiant', 'lobstorian'], p1: ['khaby', 'keanu'], t0: ['counterexample', 'pep-talk'] });
        onBoard(s, 'p0c0', 'p0c1', 'p1c0', 'p1c1');
        toHand(s, 'p0c2', 'p0t0', 'p0t1');
        s.players[0].axHand = ['haste', 'reverse-hearts'];
        s.players[0].spark = true;
        legalChoice(s, level);
    }
});

test('Hard takes lethal, and never hits the opponent to zero under The Last Shall Be First', () => {
    const s = setup({ p0: ['usainvolt', 'kardashiant'], p1: ['astrophysicat'] });
    onBoard(s, 'p0c0', 'p0c1', 'p1c0');
    stats(s, 'p0c0', 3, 1);
    stats(s, 'p1c0', 1, 9);
    s.players[1].hearts = 3;
    const a = AI.choose(s, { level: 'hard' });
    assert.equal(a.type, 'attack');
    assert.equal(a.target, 'h1');
    rule(s, 'reverse-hearts');
    let r = s;
    for (let i = 0; i < 12 && r.active === 0 && r.winner == null; i++) {
        const b = AI.choose(r, { level: 'hard' });
        assert.ok(!(b.type === 'attack' && b.target === 'h1' && E.fightPreview(r, b.cid, 'h1').damage >= r.players[1].hearts), 'no winning hit for the enemy');
        r = E.applyAction(r, b);
    }
    assert.notEqual(r.winner, 1);
});

test('Hard plays Back to the Goal when the reversed rule helps the opponent', () => {
    const s = rule(setup({ p0: ['kardashiant'], p1: ['kardashiant'] }), 'reverse-hearts');
    onBoard(s, 'p0c0', 'p1c0');
    s.players[0].hearts = 10;
    s.players[1].hearts = 2;
    s.players[0].axHand = ['normal-hearts'];
    s.players[0].energy = s.players[0].capacity = 3;
    const a = AI.choose(s, { level: 'hard' });
    assert.equal(a.type, 'axiom');
    assert.equal(a.choice, 'normal-hearts');
});

test('Hard answers Truth Table TRUE with a wide board and FALSE against a wide enemy board', () => {
    const wide = setup({ p0: ['booleon', 'kardashiant', 'kardashiant', 'kardashiant'], p1: ['astrophysicat'] });
    onBoard(wide, 'p0c1', 'p0c2', 'p0c3', 'p1c0');
    toHand(wide, 'p0c0');
    assert.equal(AI.choose(act(wide, { type: 'play', cid: 'p0c0' }), { level: 'hard' }).choice, 'true');
    const enemy = setup({ p0: ['booleon'], p1: ['astrophysicat', 'astrophysicat', 'astrophysicat', 'astrophysicat'] });
    onBoard(enemy, 'p1c0', 'p1c1', 'p1c2', 'p1c3');
    toHand(enemy, 'p0c0');
    assert.equal(AI.choose(act(enemy, { type: 'play', cid: 'p0c0' }), { level: 'hard' }).choice, 'false');
});

test('Hard spends its energy on the best combination of cards', () => {
    // 5 energy: a 2-cost and a 3-cost creature beat one 4-cost creature plus nothing.
    let s = setup({ p0: ['astrophysicat', 'keanu', 'lobstorian'], energy: 5 });
    toHand(s, 'p0c0', 'p0c1', 'p0c2');
    const played = [];
    for (let i = 0; i < 6 && s.active === 0; i++) {
        const a = AI.choose(s, { level: 'hard' });
        if (a.type === 'end') break;
        if (a.type === 'play') played.push(a.cid);
        s = E.applyAction(s, a);
    }
    assert.deepEqual(played.slice().sort(), ['p0c0', 'p0c1']);
});

test('AI choices are deterministic for the same state, level and salt', () => {
    const s = E.createBattle({ seed: 'ai-det', players: [{ team: E.randomTeam(Rift.makeRng('a'), 10) }, { team: E.randomTeam(Rift.makeRng('b'), 10) }] });
    const run = () => JSON.stringify(E.fullLog(AI.playOut(s, ['hard', 'easy'])));
    assert.equal(run(), run());
    assert.equal(JSON.stringify(AI.choose(s, { level: 'easy', salt: 'q' })), JSON.stringify(AI.choose(s, { level: 'easy', salt: 'q' })));
});

test('Hard usually beats Easy, but Easy can win', () => {
    let hard = 0, easy = 0;
    for (let g = 0; g < 40; g++) {
        const rng = Rift.makeRng('he-' + g);
        const teams = [0, 1].map(p => E.randomTeam(rng, 10, { prefix: 'he' + g + p, legendaries: false }));
        const hardSeat = g % 2;
        const levels = hardSeat ? ['easy', 'hard'] : ['hard', 'easy'];
        const end = AI.playOut(E.createBattle({ seed: 'he-' + g, players: teams.map(team => ({ team })), options: { first: (g >> 1) % 2 } }), levels);
        if (end.winner === hardSeat) hard++;
        else if (end.winner === 1 - hardSeat) easy++;
    }
    assert.ok(hard >= 24, 'hard wins most (' + hard + '/40)');
    assert.ok(easy >= 1, 'easy is beatable but not hopeless (' + easy + '/40)');
});

test('10,000 AI-vs-AI games (random teams, tactics, axioms, options, levels) end with consistent states', async () => {
    const N = 10000;
    const W = Math.max(1, Math.min(8, os.cpus().length));
    const parts = await Promise.all(Array.from({ length: W }, (_, i) => new Promise((resolve, reject) => {
        const w = new Worker(new URL('./battle-ai-fuzz.worker.mjs', import.meta.url), { workerData: { from: Math.floor(i * N / W), to: Math.floor((i + 1) * N / W) } });
        w.once('message', resolve);
        w.once('error', reject);
    })));
    parts.forEach(p => assert.equal(p.error, null, p.error));
    const games = parts.reduce((t, p) => t + p.games, 0);
    assert.equal(games, N);
    const reasons = {};
    parts.forEach(p => Object.entries(p.reasons).forEach(([k, v]) => { reasons[k] = (reasons[k] || 0) + v; }));
    assert.ok((reasons['turn-limit'] || 0) < N * 0.05, 'few games reach the turn limit: ' + JSON.stringify(reasons));
});
