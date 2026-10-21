import test from 'node:test';
import assert from 'node:assert/strict';
import { E, setup, act, onBoard, toHand, rule } from './battle-helpers.mjs';

test('casting Swift then attacking spends both uses; invalid and third actions spend nothing', () => {
    let s = setup({ p0: ['speedcheeta', 'keanu', 'kardashiant'], p1: ['keanu'] });
    toHand(s, 'p0c0', 'p0c2'); onBoard(s, 'p0c1');
    const initial = JSON.stringify(s);
    assert.throws(() => act(s, { type: 'attack', cid: 'p0c2', target: 'h1' }), /Illegal/);
    assert.equal(JSON.stringify(s), initial);
    s = act(s, { type: 'play', cid: 'p0c0' });
    assert.equal(E.playsLeft(s, 0), 1);
    s = act(s, { type: 'attack', cid: 'p0c0', target: 'h1' });
    assert.equal(E.playsLeft(s, 0), 0);
    assert.ok(!E.canAttack(s, 'p0c1'));
    assert.ok(!E.legalActions(s).some(a => ['play', 'attack', 'activate', 'axiom'].includes(a.type)));
    assert.throws(() => act(s, { type: 'attack', cid: 'p0c1', target: 'h1' }), /Illegal/);
});

test('Rapid Fire charges each attack; an Entrance question can finish after the last use', () => {
    let s = setup({ p0: ['eminemu', 'keanu'], p1: ['keanu'] }); onBoard(s, 'p0c0', 'p0c1');
    s = act(s, { type: 'attack', cid: 'p0c0', target: 'h1' });
    s = act(s, { type: 'attack', cid: 'p0c0', target: 'h1' });
    assert.equal(s.players[0].playsThisTurn, 2); assert.equal(E.playsLeft(s, 0), 0);
    let q = setup({ p0: ['kardashiant', 'euclidon'], p1: ['keanu'], axioms: ['thrift', 'haste'] });
    onBoard(q, 'p0c0'); toHand(q, 'p0c1');
    q = act(q, { type: 'attack', cid: 'p0c0', target: 'h1' });
    q = act(q, { type: 'play', cid: 'p0c1' });
    assert.equal(q.phase, 'choose'); assert.equal(E.playsLeft(q, 0), 0);
    q = act(q, { type: 'choose', choice: 'thrift' });
    assert.equal(q.phase, 'main'); assert.equal(q.players[0].playsThisTurn, 2);
});

test('Spark, Bag and hero powers remain legal after the shared card budget is spent', () => {
    let s = setup({ p0: ['keanu', 'keanu', 'keanu'], p1: ['keanu'], powers: [{ id: 'brainstorm' }] });
    onBoard(s, 'p0c0', 'p0c1', 'p0c2');
    s.players[0].spark = true; s.players[0].bag = ['tonic']; s.players[0].hearts = 7;
    s = act(s, { type: 'attack', cid: 'p0c0', target: 'h1' });
    s = act(s, { type: 'attack', cid: 'p0c1', target: 'h1' });
    s = act(s, { type: 'spark' }); s = act(s, { type: 'item', id: 'tonic' });
    assert.equal(s.players[0].playsThisTurn, 2);
    s = act(s, { type: 'power' });
    assert.equal(s.players[0].playsThisTurn, 2); assert.equal(E.playsLeft(s, 0), 1);
    s = act(s, { type: 'attack', cid: 'p0c2', target: 'h1' });
    assert.equal(E.playsLeft(s, 0), 0);
});

test('Think It Over draws from unused shared activations, including attacks already taken', () => {
    let s = setup({ p0: ['kardashiant', 'kardashiant', 'keanu', 'keanu'], p1: ['keanu'] });
    onBoard(s, 'p0c0', 'p0c1'); rule(s, 'think');
    s = act(s, { type: 'attack', cid: 'p0c0', target: 'h1' });
    s = act(s, { type: 'end' });
    assert.equal(s.players[0].hand.length, 1, 'only the one unused activation draws a card');
});

test('attack then a different creature manual ability exhausts the same budget', () => {
    let s = setup({ p0: ['keanu', 'kardashiant', 'keanu'], p1: ['keanu'], options: { timeline: true } });
    onBoard(s, 'p0c0', 'p0c1', 'p0c2');
    s = act(s, { type: 'attack', cid: 'p0c0', target: 'h1' });
    assert.equal(E.playsLeft(s, 0), 1);
    s = act(s, { type: 'activate', cid: 'p0c1', ability: 'filter' });
    assert.equal(E.playsLeft(s, 0), 0);
    assert.ok(!E.legalActions(s).some(a => a.type === 'attack'));
});

test('an attack and its retaliation/automatic hooks charge only the declaring player once', () => {
    let s = setup({ p0: ['keanu'], p1: ['khaby'] });
    onBoard(s, 'p0c0', 'p1c0');
    s = act(s, { type: 'attack', cid: 'p0c0', target: 'p1c0' });
    assert.equal(s.players[0].playsThisTurn, 1);
    assert.equal(s.players[1].playsThisTurn || 0, 0);
});

test('a rule cast spends before increasing/decreasing the total; spent uses are never refunded', () => {
    const start = () => {
        const s = setup({ p0: ['kardashiant'], p1: ['keanu'] }); onBoard(s, 'p0c0');
        s.players[0].axHand.push('plenty', 'restraint'); return s;
    };
    let s = act(start(), { type: 'attack', cid: 'p0c0', target: 'h1' });
    s = act(s, { type: 'axiom', choice: 'plenty' });
    assert.equal(s.players[0].playsThisTurn, 2); assert.equal(E.playsLeft(s, 0), 1);
    s = act(s, { type: 'axiom', choice: 'restraint' });
    assert.equal(s.players[0].playsThisTurn, 3); assert.equal(E.playsLeft(s, 0), 0);
    rule(s, 'two-plays');
    assert.equal(E.playsLeft(s, 0), 0, 'returning to normal does not erase spent uses');
    rule(s, 'infinity');
    assert.equal(E.playsLeft(s, 0), Infinity);
    rule(s, 'two-plays'); s.players[0].extraPlays = 2;
    assert.equal(E.playsLeft(s, 0), 1, 'temporary owner bonus stays separate from the shared total');
});
