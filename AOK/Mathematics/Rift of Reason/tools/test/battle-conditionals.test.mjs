import test from 'node:test';
import assert from 'node:assert/strict';
import { Rift, E, AI, setup, act, onBoard, toHand, pass, rule } from './battle-helpers.mjs';

const option = (event, actor = 'opponent') => ({ key: event + ':' + actor, event, actor, label: actor + ' ' + event });
function spell(id, options, run, visibility = 'face-down') {
    Rift.data.tactics[id] = { name: id, cost: 1, text: 'Conditional test card.', conditional: { visibility, options, run } };
}
spell('test-condition-draw', [option('spell-played')], (api, p) => api.draw(p));
spell('test-condition-menu', [option('creature-played'), option('spell-played')], (api, p) => api.healHero(p, 1), 'face-up');
spell('test-condition-win', [option('spell-played')], (api, p) => api.damage('h' + p, 10));
spell('test-condition-friend', [option('creature-defeated', 'self')], (api, p) => api.healHero(p, 1));
Rift.data.creatures['test-masked-guard'] = { name: 'Masked Guard', colour: 'memory', rarity: 'common', cost: 2, attack: 1, health: 3,
    keywords: ['guard'], conditional: { visibility: 'face-down', options: [option('attack-declared')] } };
Rift.data.creatures['test-masked-choice'] = { name: 'Masked Choice', colour: 'memory', rarity: 'common', cost: 2, attack: 1, health: 3,
    ability: 'test-conditional-entry', conditional: { visibility: 'face-down', options: [option('attack-declared')] } };
Rift.Battle.Abilities['test-conditional-entry'] = { name: 'Choose shelter', text: 'Give a friend Guard.', entrance: { target: 'friendly-other', run(api, c, target) { api.addKeyword(target, 'guard'); api.buff(target, 0, 1, 'Shelter'); } } };

test('arming pays once, uses a normal play, commits a menu and preserves the input', () => {
    const s = setup({ t0: ['test-condition-menu'] }); toHand(s, 'p0t0');
    const before = JSON.stringify(s);
    let n = act(s, { type: 'play', cid: 'p0t0' });
    assert.equal(JSON.stringify(s), before);
    assert.equal(n.phase, 'choose'); assert.equal(n.players[0].energy, 9); assert.equal(n.players[0].playsThisTurn, 1);
    assert.throws(() => act(n, { type: 'choose', choice: 'made-up' }), /Illegal/);
    n = act(n, { type: 'choose', choice: 'spell-played:opponent' });
    assert.equal(n.cards.p0t0.conditionKey, 'spell-played:opponent'); assert.deepEqual(Array.from(n.players[0].armed), ['p0t0']);
    assert.equal(n.players[0].energy, 9); assert.equal(n.players[0].playsThisTurn, 1);
});

test('hidden cards expose a back; face-up cards expose their committed condition', () => {
    let s = setup({ t0: ['test-condition-draw', 'test-condition-menu'] }); toHand(s, 'p0t0', 'p0t1');
    s = act(s, { type: 'play', cid: 'p0t0' }); s = act(s, { type: 'play', cid: 'p0t1' });
    s = act(s, { type: 'choose', choice: 'spell-played:opponent' });
    assert.equal(JSON.stringify(E.armedView(s, 0, 1)[0]), JSON.stringify({ concealed: true }));
    assert.match(E.armedView(s, 0, 1)[1].condition, /spell-played/);
    assert.equal(E.armedView(s, 0, 0)[0].name, 'test-condition-draw');
    const publicLog = E.fullLog(s).map(e => e.privateTo === 0 ? e.publicText : e.text).join('\n');
    assert.ok(!publicLog.includes('test-condition-draw'));
    const view = E.informationState(s, 1);
    assert.equal(view.cards.p0t0.tactic, undefined); assert.equal(view.cards.p0t1.tactic, 'test-condition-menu');
});

test('opponent spell condition resolves after the spell, draws once and cannot rearm', () => {
    let s = setup({ t0: ['test-condition-draw'], t1: ['second-wind', 'second-wind'] });
    toHand(s, 'p0t0', 'p1t0', 'p1t1'); s = act(s, { type: 'play', cid: 'p0t0' }); s = pass(s);
    const before = s.players[0].hand.length;
    s = act(s, { type: 'play', cid: 'p1t0' });
    assert.equal(s.players[0].hand.length, before + 1); assert.equal(s.players[0].armed.length, 0);
    assert.ok(s.cards.p0t0.conditionSpent); assert.ok(s.players[0].discard.includes('p0t0'));
    s = act(s, { type: 'play', cid: 'p1t1' }); assert.equal(s.players[0].hand.length, before + 1);
    s = pass(s); toHand(s, 'p0t0'); assert.ok(!E.legalActions(s).some(a => a.cid === 'p0t0'));
});

test('a revealed Guard intercepts before hero damage, with exactly one attack spent', () => {
    let s = setup({ p0: ['test-masked-guard'], p1: ['lobstorian'] });
    toHand(s, 'p0c0'); onBoard(s, 'p1c0'); s = act(s, { type: 'play', cid: 'p0c0' });
    assert.equal(s.players[0].energy, 8); assert.equal(s.players[0].playedCount, 0);
    s = pass(s); s = act(s, { type: 'attack', cid: 'p1c0', target: 'h0' });
    assert.equal(s.players[0].hearts, 10); assert.equal(s.cards.p1c0.attacks, 1); assert.equal(s.players[1].attacksThisTurn, 1);
    assert.equal(s.players[0].playedCount, 1);
    assert.equal(s.lastEvents.find(e => e.t === 'fight').defender, 'p0c0');
    assert.equal(s.lastEvents.filter(e => e.t === 'conditional-reveal').length, 1);
});

test('multiple revealed Guards let the attacker choose without paying twice', () => {
    let s = setup({ p0: ['test-masked-guard', 'test-masked-guard'], p1: ['lobstorian'] });
    toHand(s, 'p0c0', 'p0c1'); onBoard(s, 'p1c0');
    s = act(s, { type: 'play', cid: 'p0c0' }); s = act(s, { type: 'play', cid: 'p0c1' }); s = pass(s);
    s = act(s, { type: 'attack', cid: 'p1c0', target: 'h0' });
    assert.equal(s.phase, 'choose'); assert.equal(E.decider(s), 1); assert.equal(s.players[0].hearts, 10);
    s = act(s, { type: 'choose', choice: 'p0c1' });
    assert.equal(s.lastEvents.find(e => e.t === 'fight').defender, 'p0c1'); assert.equal(s.cards.p1c0.attacks, 1);
});

test('reveal Entrance pauses an attack and resolves exactly once before Guard targeting', () => {
    let s = setup({ p0: ['test-masked-choice', 'astrophysicat', 'astrophysicat'], p1: ['lobstorian'] });
    toHand(s, 'p0c0'); onBoard(s, 'p0c1', 'p0c2', 'p1c0');
    s = act(s, { type: 'play', cid: 'p0c0' }); s = pass(s);
    s = act(s, { type: 'attack', cid: 'p1c0', target: 'h0' });
    assert.equal(s.phase, 'choose'); assert.equal(E.decider(s), 0); assert.equal(s.players[0].hearts, 10);
    s = act(s, { type: 'choose', choice: 'p0c1' });
    assert.equal(s.lastEvents.find(e => e.t === 'fight').defender, 'p0c1');
    assert.equal(s.cards.p0c1.buffs.filter(b => b.label === 'Shelter').length, 1);
});

test('armed creatures reserve space and still count as remaining creatures', () => {
    let s = setup({ p0: ['test-masked-guard', 'lobstorian'], options: { boardLimit: 1 } });
    toHand(s, 'p0c0', 'p0c1'); s = act(s, { type: 'play', cid: 'p0c0' });
    assert.equal(E.boardOccupancy(s, 0), 1); assert.ok(E.creaturesLeft(s, 0));
    assert.ok(!E.legalActions(s).some(a => a.cid === 'p0c1'));
});

test('a forced full-board reveal consumes into discard without a combat/Fate loss', () => {
    let s = setup({ p0: ['test-masked-guard', 'astrophysicat'], p1: ['astrophysicat'], options: { boardLimit: 1 } });
    toHand(s, 'p0c0'); onBoard(s, 'p1c0'); s = act(s, { type: 'play', cid: 'p0c0' });
    onBoard(s, 'p0c1'); // a future summon bypasses the reserved slot; exercise the documented failure
    s = pass(s); s = act(s, { type: 'attack', cid: 'p1c0', target: 'h0' });
    assert.ok(s.players[0].discard.includes('p0c0')); assert.ok(s.cards.p0c0.conditionSpent);
    assert.equal(s.cards.p0c0.defeats, 0); assert.ok(!E.lostUids(s, 0).includes(s.cards.p0c0.uid));
});

test('terminal Win stops later conditions in the same event, including own-zero victory', () => {
    for (const reverse of [false, true]) {
        let s = setup({ t0: ['test-condition-win', 'test-condition-draw'], t1: ['second-wind'] });
        if (reverse) rule(s, 'reverse-hearts');
        toHand(s, 'p0t0', 'p0t1', 'p1t0'); s = act(s, { type: 'play', cid: 'p0t0' }); s = act(s, { type: 'play', cid: 'p0t1' });
        s = pass(s); const count = s.players[0].hand.length; s = act(s, { type: 'play', cid: 'p1t0' });
        assert.equal(s.winner, reverse ? 0 : 1); assert.equal(s.players[0].hand.length, count); assert.equal(s.reactions.length, 0);
    }
});

test('AI decisions cannot distinguish two concealed identities and remain legal', () => {
    let s = setup({ t0: ['test-condition-draw'], p1: ['lobstorian'] });
    toHand(s, 'p0t0'); onBoard(s, 'p1c0'); s = act(s, { type: 'play', cid: 'p0t0' }); s = pass(s);
    const other = E.cloneState(s); other.cards.p0t0.tactic = 'test-condition-win';
    for (const level of ['normal', 'competent', 'expert']) {
        const a = AI.choose(s, { level }), b = AI.choose(other, { level });
        assert.deepEqual(a, b); assert.ok(E.legalActions(s).some(l => E.actionKey(l) === E.actionKey(a)));
    }
});
