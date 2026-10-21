import test from 'node:test';
import assert from 'node:assert/strict';
import { Rift as R, E, AI, setup, act, onBoard, toHand, toDiscard, rule } from './battle-helpers.mjs';
import { loadRift } from './harness.mjs';
const narrow = { deckSize: 4, minCreatures: 0, maxCreatures: 4 };
const battle = opts => setup({ ...opts, options: { ...narrow, deckSize: Math.max(1, (opts.p0 || []).length + (opts.t0 || []).length, (opts.p1 || []).length + (opts.t1 || []).length), ...(opts.options || {}) } });
const play = (s, cid, target) => act(toHand(s, cid), { type: 'play', cid, ...(target ? { target } : {}) });

test('mono is a personal-deck snapshot: generic spells do not break it, Memory counts, mixed colours do', () => {
    const s = battle({ p0: ['imagination-fable-fawn', 'paper-dragon'], t0: ['generic-small-patch'] });
    assert.equal(s.players[0].monoColour, 'imagination');
    onBoard(s, 'p0c0'); s.cards.p0c0.colour = 'reason';
    assert.equal(s.players[0].monoColour, 'imagination');
    assert.equal(battle({ p0: ['memory-recall-robin'], t0: ['generic-small-patch'] }).players[0].monoColour, 'memory');
    assert.equal(battle({ p0: ['imagination-fable-fawn', 'memory-recall-robin'] }).players[0].monoColour, null);
    assert.equal(battle({ t0: ['generic-small-patch'] }).players[0].monoColour, null);
    R.data.creatures['generic-probe'] = { ...R.data.creatures['memory-recall-robin'], generic: true };
    try {
        assert.equal(battle({ p0: ['imagination-fable-fawn','generic-probe'] }).players[0].monoColour,'imagination');
        assert.equal(battle({ p0: ['generic-probe'] }).players[0].monoColour,null);
    } finally { delete R.data.creatures['generic-probe']; }
});

test('Tom reveals once, draws only a printed cheap spell, and never copies the top card', () => {
    let s = battle({ p0: ['reason-premise-pigeon'], t0: ['generic-small-patch', 'counterexample'] });
    const top = 'p0t0'; s.players[0].deck = [top, 'p0t1'];
    s = play(s, 'p0c0');
    assert.ok(s.players[0].hand.includes(top)); assert.ok(s.players[1].knows.includes(top));
    assert.equal(s.players[0].deck.includes(top), false);
    assert.ok(s.lastEvents.some(e => /reveals Small Patch/.test(e.text)));
    let other = battle({ p0: ['reason-premise-pigeon'], t0: ['counterexample'] });
    other.players[0].deck = ['p0t0']; other = play(other, 'p0c0');
    assert.equal(other.players[0].deck[0], 'p0t0'); assert.equal(other.players[0].hand.length, 0);
});

test('Simone gains Shield only from actually filling the last missing heart', () => {
    for (const [hearts, shield] of [[9, true], [10, false], [8, false]]) {
        let s = battle({ p0: ['emotion-courage-cub'] }); s.players[0].hearts = hearts;
        s = play(s, 'p0c0'); assert.equal(E.describe(s, 'p0c0').keywords.includes('shield'), shield);
        assert.equal(s.players[0].hearts, Math.min(10, hearts + 1));
    }
});

test('Nikkie privately inspects one card without drawing, reordering or sharing its identity', () => {
    let s = battle({ p0: ['perception-cue-cricket'], t0: ['counterexample'] });
    s.players[0].deck = ['p0t0']; s = play(s, 'p0c0');
    assert.equal(s.phase, 'choose'); assert.match(s.pending.prompt, /Counterexample/);
    assert.equal(s.players[1].knows.includes('p0t0'), false);
    const done = E.legalActions(s).find(a => a.type === 'choose'); s = act(s, done);
    assert.deepEqual(Array.from(s.players[0].deck), ['p0t0']);
    assert.equal(s.players[0].hand.length, 0);
    assert.equal(s.lastEvents.some(e => /Counterexample/.test(e.text || '')), false);
});

test('Jimmy clears only another ally Freeze, preserving sleep, spent attacks and activation limits', () => {
    let s = battle({ p0: ['language-question-quail', 'comma-crab'], p1: ['khaby'] }); onBoard(s, 'p0c1', 'p1c0');
    s.cards.p0c1.frozen = true; s.cards.p0c1.frozenUntil = 20; s.cards.p0c1.attacks = 1; s.cards.p0c1.activated = true;
    s = play(s, 'p0c0', 'p0c1');
    assert.equal(s.cards.p0c1.frozen, false); assert.equal(s.cards.p0c1.frozenUntil, undefined);
    assert.equal(s.cards.p0c1.attacks, 1); assert.equal(s.cards.p0c1.activated, true);
    assert.equal(E.canAttack(s, 'p0c1'), false);
    let sleepy = battle({ p0: ['language-question-quail', 'comma-crab'] }); onBoard(sleepy, 'p0c1');
    sleepy.cards.p0c1.enteredTurn = sleepy.turn; sleepy.cards.p0c1.frozen = true;
    sleepy = play(sleepy, 'p0c0', 'p0c1'); assert.equal(E.describe(sleepy, 'p0c1').sleeping, true);
    const empty = play(battle({ p0: ['language-question-quail'] }), 'p0c0');
    assert.equal(empty.players[0].board.includes('p0c0'), true, 'no frozen guest does not strand Entrance');
});

test('Jack swaps another ally once; mono bonus follows the submitted deck after colour changes', () => {
    let s = battle({ p0: ['imagination-fable-fawn', 'paper-dragon'] }); onBoard(s, 'p0c1');
    s.cards.p0c1.attack = 1; s.cards.p0c1.health = 4; s.cards.p0c1.colour = 'language';
    s = play(s, 'p0c0', 'p0c1');
    const d = E.describe(s, 'p0c1'); assert.equal(d.attack, 4); assert.equal(d.health, 2);
    assert.equal(s.players[0].monoColour, 'imagination');
    let mixed = battle({ p0: ['imagination-fable-fawn', 'proof-pup'] }); onBoard(mixed, 'p0c1');
    mixed.cards.p0c1.attack = 1; mixed.cards.p0c1.health = 4;
    mixed = play(mixed, 'p0c0', 'p0c1'); assert.equal(E.describe(mixed, 'p0c1').health, 1);
});

test('John moves only the newest actual discarded spell, preserving identity and total copies', () => {
    let s = battle({ p0: ['memory-recall-robin', 'pocket-tortoise'], t0: ['counterexample', 'generic-small-patch'] });
    toDiscard(s, 'p0t0', 'p0c1', 'p0t1'); const count = Object.keys(s.cards).length;
    s = play(s, 'p0c0');
    assert.equal(s.players[0].deck.at(-1), 'p0t1'); assert.equal(s.players[0].discard.includes('p0t1'), false);
    assert.ok(s.players[0].discard.includes('p0t0')); assert.ok(s.players[0].discard.includes('p0c1'));
    assert.equal(Object.keys(s.cards).length, count);
});

test('zero-attack swap resolves the whole Entrance before cleanup; only the mono bonus rescues it', () => {
    for (const [ally, survives] of [['paper-dragon', true], ['proof-pup', false]]) {
        let s = battle({ p0: ['imagination-fable-fawn', ally] }); onBoard(s, 'p0c1');
        s.cards.p0c1.attack = 0; s.cards.p0c1.health = 4;
        s = play(s, 'p0c0', 'p0c1');
        assert.equal(s.players[0].board.includes('p0c1'), survives);
        if (survives) assert.equal(E.describe(s, 'p0c1').health, 2); // Existing swap stores zero as max1/damage1; +max1 then heal1 resolves atomically.
        else assert.ok(s.players[0].discard.includes('p0c1'));
    }
});

test('inspection and recovery Entrances handle empty sources without extra cards or pending choices', () => {
    for (const id of ['reason-premise-pigeon','perception-cue-cricket','memory-recall-robin']) {
        const s = play(battle({p0:[id]}), 'p0c0');
        assert.equal(s.phase, 'main'); assert.equal(s.players[0].hand.length, 0);
        assert.equal(s.players[0].deck.length, 0); assert.equal(Object.values(s.cards).filter(c => c.owner === 0).length, 1);
    }
});

test('Small Patch heals2 mixed/3 mono, cannot raise maximum health, and respects normal targeting', () => {
    for (const [p0, healed] of [[['paper-dragon'], 3], [['paper-dragon', 'proof-pup'], 2]]) {
        let s = battle({ p0, t0: ['generic-small-patch'] }); onBoard(s, 'p0c0');
        s.cards.p0c0.health = 5; s.cards.p0c0.damage = 4;
        s = play(s, 'p0t0', 'p0c0'); assert.equal(s.cards.p0c0.damage, 4 - healed); assert.equal(s.cards.p0c0.health, 5);
    }
});

test('Empty Set disables all new Entrances without re-firing them when the rule changes', () => {
    let s = battle({ p0: ['emotion-courage-cub'] }); s.players[0].hearts = 9; rule(s, 'empty-set');
    s = play(s, 'p0c0'); assert.equal(s.players[0].hearts, 9);
    delete s.axioms.active[R.data.axioms['empty-set'].category]; assert.equal(s.players[0].hearts, 9);
});

test('unknown top cards never leak through a prospective Tom or Nikkie clip', () => {
    for (const id of ['reason-premise-pigeon', 'perception-cue-cricket']) {
        const s = battle({ p0: [id], t0: ['counterexample', 'generic-small-patch'] }); toHand(s, 'p0c0');
        const a = { type: 'play', player: 0, cid: 'p0c0' }, before = JSON.stringify(s);
        const first = E.previewAction(s, a, 0); assert.equal(first.complete, false); assert.match(first.reason, /unknown/);
        s.players[0].deck.reverse(); const second = E.previewAction(s, a, 0);
        assert.deepEqual(JSON.parse(JSON.stringify(first)), JSON.parse(JSON.stringify(second)));
        s.players[0].deck.reverse(); assert.equal(JSON.stringify(s), before);
        assert.doesNotMatch(JSON.stringify(first), /Counterexample|Small Patch/);
    }
});

test('all AI levels choose identically when only an unrevealed inspection outcome changes', () => {
    for (const id of ['reason-premise-pigeon','perception-cue-cricket']) for (const level of ['normal','competent','expert']) for (const salt of [0,1,2]) {
        const s = battle({ p0: [id,'lens-lizard'], p1: ['beastie'], t0: ['generic-small-patch','counterexample'], energy:1 });
        onBoard(s,'p1c0'); toHand(s,'p0c0','p0c1'); s.players[0].deck=['p0t0','p0t1'];
        const before=JSON.stringify(s), a=AI.choose(s,{level,salt});
        assert.equal(JSON.stringify(s),before,'planning cannot mark or change the real battle');
        const hidden=E.cloneState(s); hidden.players[0].deck.reverse();
        assert.equal(E.actionKey(AI.choose(hidden,{level,salt})),E.actionKey(a),id+' '+level+' '+salt);
    }
});

test('six released creatures use ordinary catches; the shared first spell pays once at the checked Ford', async () => {
    const L = loadRift(['js/core/rift.js','js/core/state.js','js/core/world.js','data/creatures.js','data/items.js','data/map.js','data/tactics.js','data/axioms.js','data/starters.js']);
    const s = L.State.freshState(); s.avatar = { type: 'owlet', variant: 'girl' }; L.State.grantStarter(s);
    const sources = { 'reason-premise-pigeon': 'road-start', 'emotion-courage-cub': 'stall-pattern', 'perception-cue-cricket': 'stall-witness',
        'language-question-quail': 'stall-gallery', 'imagination-fable-fawn': 'troll-bridge', 'memory-recall-robin': 'well' };
    for (const [id,node] of Object.entries(sources)) {
        assert.ok(L.World.spawnWeights(s,L.World.node(node),{stars:1})[id] > 0, id+' has a real ordinary source');
        assert.equal(L.State.copyCap(id),4);
    }
    L.World.complete(s,'river-ford'); assert.equal(L.State.cardCopies('tactic','generic-small-patch',s),1);
    L.World.complete(s,'river-ford'); assert.equal(L.State.cardCopies('tactic','generic-small-patch',s),1);
    const back = L.State.migrate(await L.State.decodeAsync('save',await L.State.encodePacked('save',s)));
    L.World.reconcileCards(back); assert.equal(L.State.cardCopies('tactic','generic-small-patch',back),1);
    assert.equal(back.flags['card-reward:foundation-patch'].node,'river-ford');
    const legacy = L.State.freshState(); legacy.avatar=s.avatar; L.State.grantStarter(legacy); legacy.map.completed=['river-ford'];
    L.World.reconcileCards(legacy); L.World.reconcileCards(legacy);
    assert.equal(L.State.cardCopies('tactic','generic-small-patch',legacy),1);
});
