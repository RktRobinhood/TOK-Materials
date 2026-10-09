// Hero powers (design/AVATARS.md section 1, data/powers.js): each power's effect, energy and heart
// costs, recharge, once per turn, no card play used, tweaks, the AI using them, team codes and
// determinism.
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadRift } from './harness.mjs';
import { Rift, E, AI, inst, setup, act, onBoard, toHand, toDiscard, pass, hp, atk, plain, stats, invariants } from './battle-helpers.mjs';

const same = (a, b, m) => assert.deepEqual(plain(a), plain(b), m);
const powerActs = s => E.legalActions(s).filter(a => a.type === 'power');
const texts = s => s.lastEvents.map(e => e.text).join(' | ');
// The numbers come from data/powers.js (set by the balance pass, design/reviews/avatar-powers-balance.md).
const P = id => Rift.data.powers[id];

// A quiet main-phase battle (battle-helpers setup) where player 0 has this power.
function powered(id, tweaks, opts) {
    return setup(Object.assign({ p0: ['astrophysicat', 'astrophysicat', 'astrophysicat'], p1: ['astrophysicat', 'astrophysicat', 'astrophysicat'],
        powers: [{ id, tweaks: tweaks || [] }] }, opts || {}));
}

test('every avatar has a power; the board power goes to the coin-flip gender', () => {
    const board = { owlet: 'girl', mothkin: 'boy', fox: 'girl', frogling: 'boy', raven: 'girl' };
    const seen = new Set();
    for (const [type, a] of Object.entries(Rift.data.avatars)) {
        for (const variant of ['boy', 'girl']) {
            const pw = Rift.Powers.forAvatar({ type, variant });
            assert.ok(pw && Rift.data.powers[pw.id], type + ' ' + variant);
            const def = Rift.data.powers[pw.id];
            assert.equal(def.colour, a.colour, type + ' power colour');
            assert.equal(def.kind, board[type] === variant ? 'board' : 'other', type + ' ' + variant + ' kind');
            seen.add(pw.id);
        }
    }
    assert.equal(seen.size, 10);
    for (const [id, def] of Object.entries(Rift.data.powers)) {
        assert.ok(def.name && def.text && def.text.length < 100, id + ' text');
        assert.ok(Number.isInteger(def.cost) && Number.isInteger(def.recharge), id + ' numbers');
        if (def.colour !== 'emotion') assert.ok(def.deeper && def.broader, id + ' has Deeper and Broader');
    }
});

test('createBattle keeps a known power and cleans its tweaks; no power gives no action', () => {
    const s = E.createBattle({ seed: 'pw', players: [{ team: [inst('khaby')], power: { id: 'lantern', tweaks: ['deeper', 'nonsense', 'deeper', 'quick'] } },
        { team: [inst('khaby')], power: { id: 'no-such-power' } }], options: { first: 0, openHand: [0, 0], openAxioms: 0 } });
    same(s.players[0].power, { id: 'lantern', tweaks: ['deeper', 'quick'], cooldown: 0, uses: 0 });
    assert.equal(s.players[1].power, null);
    assert.equal(E.powerStatus(s, 1), null);
    const t = setup({ p0: ['astrophysicat'], p1: ['astrophysicat'] });
    assert.equal(powerActs(t).length, 0);
});

test('Close the Proof: only a 1-health enemy, free of card plays, then recharges', () => {
    let s = powered('close-the-proof');
    onBoard(s, 'p1c0', 'p1c1');
    s.cards.p1c0.damage = 2; // 1 health left
    same(powerActs(s).map(a => a.target), ['p1c0']);
    const st = E.powerStatus(s, 0);
    assert.equal(st.usable, true);
    assert.equal(st.cost, P('close-the-proof').cost);
    assert.equal(st.recharge, P('close-the-proof').recharge);
    assert.ok(P('close-the-proof').recharge >= 1, 'the recharge check below needs a recharge');
    s = act(s, { type: 'power', target: 'p1c0' });
    assert.ok(s.players[1].discard.includes('p1c0'));
    assert.equal(s.players[0].energy, 10 - P('close-the-proof').cost);
    assert.equal(s.players[0].playsThisTurn || 0, 0, 'not a card play');
    assert.equal(E.playsLeft(s, 0), 2);
    assert.ok(s.lastEvents.some(e => e.t === 'power-use' && e.id === 'close-the-proof'));
    // Once per turn, then recharge r: skip r own turns, ready on the next.
    s.cards.p1c1.damage = 2;
    assert.equal(powerActs(s).length, 0);
    assert.equal(E.powerStatus(s, 0).why, 'recharge');
    const r = P('close-the-proof').recharge;
    assert.equal(E.powerStatus(s, 0).turnsLeft, r + 1);
    for (let i = r; i >= 1; i--) {
        s = pass(pass(s));
        assert.equal(s.active, 0);
        assert.equal(E.powerStatus(s, 0).turnsLeft, i);
        assert.equal(powerActs(s).length, 0);
    }
    s = pass(pass(s));
    assert.equal(E.powerStatus(s, 0).ready, true);
    s.cards.p1c1.damage = 2;
    same(powerActs(s).map(a => a.target), ['p1c1']);
});

test('Close the Proof Deeper and Broader', () => {
    let s = powered('close-the-proof', ['deeper', 'broader']);
    onBoard(s, 'p1c0');
    s.cards.p1c0.damage = 1; // 2 health left
    const st = E.powerStatus(s, 0);
    assert.equal(st.cost, P('close-the-proof').cost + 1, 'Broader: +1 energy');
    assert.equal(st.recharge, P('close-the-proof').recharge + 1, 'Deeper: recharge +1');
    s = act(s, { type: 'power', target: 'p1c0' });
    assert.ok(s.players[1].discard.includes('p1c0'));
    assert.equal(s.players[1].hearts, 9);
});

test('the power is ready on turn 1 and only in the main phase of its owner', () => {
    const s = E.createBattle({ seed: 'turn1', players: [{ team: [inst('khaby'), inst('khaby')], power: { id: 'brainstorm' } }, { team: [inst('khaby')], power: { id: 'brainstorm' } }],
        options: { first: 0, openHand: [1, 1], openAxioms: 0, spark: false } });
    assert.equal(s.phase, 'draw');
    assert.equal(E.powerStatus(s, 0).why, 'draw');
    assert.equal(E.powerStatus(s, 1).why, 'turn');
    const m = act(s, { type: 'draw', choice: 'deck' });
    assert.equal(m.players[0].energy, 1);
    same(powerActs(m).map(a => a.type), ['power']);
});

test('Foresee: look at the top 3 rule cards, take one, order the rest (Deeper 4, Broader puts one at the bottom)', () => {
    const AX = ['underdog', 'thrift', 'haste', 'mercy', 'arrival'];
    let s = powered('foresee', [], { axioms: AX });
    s = act(s, { type: 'power' });
    assert.equal(s.phase, 'choose');
    same(s.pending.options, ['underdog', 'thrift', 'haste']);
    assert.equal(s.pending.step, 'take');
    const look = s.lastEvents.find(e => e.t === 'power' && e.privateTo === 0);
    assert.ok(look && /Underdog/.test(look.text) && !/Underdog/.test(look.publicText), 'only the user sees the cards');
    s = act(s, { type: 'choose', choice: 'thrift' });
    same(s.players[0].axHand, ['thrift']);
    same(s.pending.options, ['underdog', 'haste'], 'then order the other two');
    s = act(s, { type: 'choose', choice: 'haste' });
    same(s.axioms.deck, ['haste', 'underdog', 'mercy', 'arrival']);
    assert.equal(s.phase, 'main');

    let d = powered('foresee', ['deeper'], { axioms: AX });
    d = act(d, { type: 'power' });
    same(d.pending.options, ['underdog', 'thrift', 'haste', 'mercy']);
    d = act(d, { type: 'choose', choice: 'mercy' });
    same(d.players[0].axHand, ['mercy']);
    d = act(d, { type: 'choose', choice: 'haste' });
    d = act(d, { type: 'choose', choice: 'thrift' });
    same(d.axioms.deck, ['haste', 'thrift', 'underdog', 'arrival']);

    let b = powered('foresee', ['broader'], { axioms: AX });
    b = act(b, { type: 'power' });
    b = act(b, { type: 'choose', choice: 'underdog' });
    assert.equal(b.pending.step, 'bottom');
    same(b.pending.options, ['thrift', 'haste']);
    b = act(b, { type: 'choose', choice: 'thrift' });
    same(b.axioms.deck, ['haste', 'mercy', 'arrival', 'thrift'], 'one goes to the bottom; one left: nothing to order');
    assert.equal(b.phase, 'main');

    // A full hand: nothing to take, so Foresee only orders the cards.
    let full = powered('foresee', [], { axioms: AX });
    while (E.handRoom(full, 0, 1)) full.players[0].axHand.push('mercy');
    full = act(full, { type: 'power' });
    assert.notEqual(full.pending.step, 'take');
    same(full.pending.options, ['underdog', 'thrift', 'haste']);
});

test('Lantern: 1 damage (Deeper 2); Broader sees one enemy hand card', () => {
    let s = powered('lantern');
    onBoard(s, 'p1c0');
    s = act(s, { type: 'power', target: 'p1c0' });
    assert.equal(s.cards.p1c0.damage, 1);
    assert.equal(s.players[0].energy, 8);
    let d = powered('lantern', ['deeper', 'broader']);
    onBoard(d, 'p1c0');
    toHand(d, 'p1c1', 'p1c2');
    d = act(d, { type: 'power', target: 'p1c0' });
    assert.equal(d.cards.p1c0.damage, 2);
    assert.equal(d.players[0].knows.length, 1);
    assert.ok(['p1c1', 'p1c2'].includes(d.players[0].knows[0]));
    assert.equal(d.players[0].energy, 7, 'Broader costs 1 more');
});

test('Night Sight: see the hand until my next turn; their next card costs 1 more', () => {
    let s = powered('night-sight');
    toHand(s, 'p1c0', 'p1c1');
    s = act(s, { type: 'power' });
    same(s.players[0].knows.slice().sort(), ['p1c0', 'p1c1']);
    assert.equal(s.players[1].tax, 1);
    const reveal = s.lastEvents.find(e => e.privateTo === 0);
    assert.ok(reveal && reveal.publicText && !/Astrophysicat/.test(reveal.publicText));
    s = pass(s);
    assert.equal(s.active, 1);
    const base = Rift.data.creatures.astrophysicat.cost;
    assert.equal(E.playCost(s, 'p1c0'), base + 1);
    s = act(s, { type: 'play', cid: 'p1c0' });
    assert.equal(s.players[1].energy, 10 - base - 1);
    assert.equal(s.players[1].tax, 0);
    assert.equal(E.playCost(s, 'p1c1'), base, 'only the next card');
    s = pass(s);
    assert.equal(s.active, 0);
    same(s.players[0].knows, [], 'the look ends at my next turn');
    // Deeper: the next 2 cards.
    let d = powered('night-sight', ['deeper']);
    d = act(d, { type: 'power' });
    assert.equal(d.players[1].tax, 2);
});

test('What If?: swaps attack and health (Deeper +1 attack, Broader +1 health)', () => {
    let s = powered('what-if');
    onBoard(s, 'p1c0');
    stats(s, 'p1c0', 1, 3);
    s = act(s, { type: 'power', target: 'p1c0' });
    assert.equal(atk(s, 'p1c0'), 3);
    assert.equal(hp(s, 'p1c0'), 1);
    let d = powered('what-if', ['deeper', 'broader']);
    onBoard(d, 'p0c0');
    stats(d, 'p0c0', 1, 3);
    d = act(d, { type: 'power', target: 'p0c0' });
    assert.equal(atk(d, 'p0c0'), 4);
    assert.equal(hp(d, 'p0c0'), 2);
    assert.equal(d.players[0].hand.length, 0, 'no card drawn');
    // Broader: a 0-attack creature lives on with 1 health; equal stats are a target too.
    let b = powered('what-if', ['broader']);
    onBoard(b, 'p0c0', 'p0c1');
    stats(b, 'p0c0', 0, 3);
    stats(b, 'p0c1', 2, 2);
    assert.ok(powerActs(b).some(a => a.target === 'p0c1'));
    b = act(b, { type: 'power', target: 'p0c0' });
    assert.ok(b.players[0].board.includes('p0c0'));
    assert.equal(hp(b, 'p0c0'), 1);
});

test('Brainstorm: +1 card play this turn (Deeper +2, Broader +1 energy)', () => {
    let s = powered('brainstorm');
    s = act(s, { type: 'power' });
    assert.equal(E.playsLeft(s, 0), 3);
    let d = powered('brainstorm', ['deeper', 'broader']);
    d = act(d, { type: 'power' });
    assert.equal(E.playsLeft(d, 0), 4);
    assert.equal(d.players[0].energy, 10 - (P('brainstorm').cost + 1) + 1, 'Broader: costs 1 more, gives 1 energy');
    d = pass(pass(d));
    assert.equal(E.playsLeft(d, 0), 2, 'only this turn');
});

test('Recall: the most recently defeated creature returns (Deeper +1/+1, Broader 2 hearts)', () => {
    let s = powered('recall', ['deeper', 'broader']);
    toDiscard(s, 'p0c0', 'p0c1');
    assert.equal(E.powerStatus(s, 0).recharge, 4);
    s.players[0].hearts = 5;
    s = act(s, { type: 'power' });
    same(s.players[0].hand, ['p0c1']);
    assert.equal(s.players[0].hearts, 7);
    s = act(s, { type: 'play', cid: 'p0c1' });
    const sp = Rift.data.creatures.astrophysicat;
    assert.equal(atk(s, 'p0c1'), sp.attack + 1);
    assert.equal(hp(s, 'p0c1'), sp.health + 1);
    const none = powered('recall');
    assert.equal(E.powerStatus(none, 0).why, 'useless');
});

test('Hold That Thought: move Fate 1 space and draw a card (Deeper up to 2, Broader restores 1 heart)', () => {
    let s = powered('hold-that-thought', [], { options: { timeline: true, fateStart: 6 } });
    s = act(s, { type: 'power' });
    same(s.pending.options, ['forward', 'rewind']);
    s = act(s, { type: 'choose', choice: 'forward' });
    assert.equal(s.fate.until, 5);
    assert.equal(s.players[0].hand.length, 1, 'draws a card');
    assert.equal(s.players[0].energy, 10 - P('hold-that-thought').cost);
    let d = powered('hold-that-thought', ['deeper', 'broader'], { options: { timeline: true, fateStart: 6 } });
    d.players[0].hearts = 5;
    d = act(d, { type: 'power' });
    same(d.pending.options, ['forward-2', 'forward', 'rewind', 'rewind-2']);
    d = act(d, { type: 'choose', choice: 'rewind-2' });
    assert.equal(d.fate.until, 8);
    assert.equal(d.players[0].hand.length, 1, 'still one card');
    assert.equal(d.players[0].hearts, 6, 'Broader: 1 heart');
    assert.equal(E.powerStatus(powered('hold-that-thought'), 0).why, 'useless', 'no Fate track');
});

test('Call It Out strips Guard, Shield and Elusive (Deeper: Swift too)', () => {
    let s = powered('call-it-out', [], { p1: ['lobstorian', 'astrophysicat', 'speedcheeta'] });
    onBoard(s, 'p1c0', 'p1c1', 'p1c2');
    same(powerActs(s).map(a => a.target), ['p1c0'], 'only creatures with those keywords');
    s = act(s, { type: 'power', target: 'p1c0' });
    assert.ok(!E.keywordsOf(s, 'p1c0').includes('guard'));
    let d = powered('call-it-out', ['deeper'], { p1: ['astrophysicat', 'speedcheeta'] });
    onBoard(d, 'p1c0', 'p1c1');
    same(powerActs(d).map(a => a.target), ['p1c1'], 'Deeper: a Swift creature is a target');
    d = act(d, { type: 'power', target: 'p1c1' });
    assert.ok(!E.keywordsOf(d, 'p1c1').includes('swift'));
    assert.ok(!d.cards.p1c1.frozen, 'it can still attack');
});

test('Fine Print: lose 1 heart, draw (Deeper 2 cards, Broader +1 energy); never the last heart', () => {
    let s = powered('fine-print');
    s = act(s, { type: 'power' });
    assert.equal(s.players[0].hearts, 9);
    assert.equal(s.players[0].hand.length, 1);
    assert.equal(s.players[0].energy, 10 - P('fine-print').cost);
    let d = powered('fine-print', ['deeper', 'broader']);
    d = act(d, { type: 'power' });
    assert.equal(d.players[0].hand.length, 2);
    assert.equal(d.players[0].energy, 10 - (P('fine-print').cost + 1) + 1);
    const low = powered('fine-print');
    low.players[0].hearts = 1;
    assert.equal(E.powerStatus(low, 0).why, 'useless');
});

test('Emotion powers: Outrage and Pile-On', () => {
    let s = powered('outrage');
    onBoard(s, 'p0c0');
    stats(s, 'p0c0', 1, 3);
    s = act(s, { type: 'power', target: 'p0c0' });
    assert.equal(atk(s, 'p0c0'), 3);
    s = pass(pass(s));
    assert.equal(atk(s, 'p0c0'), 1, 'this turn only');
    let p = powered('pile-on');
    onBoard(p, 'p0c0', 'p0c1');
    assert.equal(E.powerStatus(p, 0).why, 'useless', 'nobody attacked yet');
    p = act(p, { type: 'attack', cid: 'p0c0', target: 'h1' });
    p = act(p, { type: 'attack', cid: 'p0c1', target: 'h1' });
    const before = p.players[1].hearts;
    p = act(p, { type: 'power' });
    assert.equal(p.players[1].hearts, before - 2);
});

test('tweaks: Quick, Cheap and Blood price change the numbers, never below 0', () => {
    const st = (id, tw) => E.powerStatus(powered(id, tw), 0);
    const L = P('lantern');
    same([st('lantern', ['quick']).cost, st('lantern', ['quick']).recharge], [L.cost + 1, Math.max(0, L.recharge - 1)]);
    same([st('lantern', ['cheap']).cost, st('lantern', ['cheap']).recharge], [Math.max(0, L.cost - 1), L.recharge + 1]);
    // Never below 0: a cost-0 power made Cheap, a recharge-0 power made Quick.
    const free = Object.keys(Rift.data.powers).find(id => P(id).cost === 0 && P(id).recharge === 0 && P(id).colour !== 'emotion');
    same([st(free, ['cheap']).cost, st(free, ['quick']).recharge], [0, 0]);
    // Blood price: 1 heart per 2 energy it would cost (at least 1), after the other tweaks.
    same([st('lantern', ['blood']).cost, st('lantern', ['blood']).heartCost], [0, 1]);
    same(st('lantern', ['blood', 'broader']).heartCost, 2, 'Lantern Broader would cost 3');
    same(st('close-the-proof', ['blood']).heartCost, 2, 'Close the Proof would cost 3');
    same(st('what-if', ['blood']).heartCost, 1, 'a free power still costs 1 heart');
    // Night Sight's cost floor of 2: Cheap can't take it lower.
    same([st('night-sight', ['cheap']).cost, st('night-sight', ['cheap']).recharge], [2, P('night-sight').recharge + 1]);
    same(st('night-sight', ['broader', 'cheap']).cost, 2);
    let s = powered('lantern', ['blood']);
    onBoard(s, 'p1c0');
    s = act(s, { type: 'power', target: 'p1c0' });
    assert.equal(s.players[0].energy, 10, 'no energy');
    assert.equal(s.players[0].hearts, 9, 'one heart');
    const low = powered('lantern', ['blood']);
    onBoard(low, 'p1c0');
    low.players[0].hearts = 1;
    assert.equal(E.powerStatus(low, 0).why, 'hearts');
    let c = powered('close-the-proof', ['blood']);
    onBoard(c, 'p1c0');
    c.cards.p1c0.damage = 2;
    c.players[0].hearts = 2;
    assert.match(E.powerStatus(c, 0).note, /costs 2 hearts/);
    c.players[0].hearts = 10;
    c = act(c, { type: 'power', target: 'p1c0' });
    assert.equal(c.players[0].hearts, 8, 'two hearts');
    // Recharge 0: ready again next own turn, still once per turn.
    let q = powered(free);
    q = act(q, { type: 'power' });
    assert.equal(powerActs(q).length, 0);
    q = pass(pass(q));
    assert.equal(powerActs(q).length, 1);
});

test('powerStatus explains energy, and the power works with every rule untouched for a no-power player', () => {
    const s = powered('lantern');
    onBoard(s, 'p1c0');
    s.players[0].energy = 1;
    const st = E.powerStatus(s, 0);
    assert.equal(st.why, 'energy');
    assert.equal(st.usable, false);
    assert.equal(st.name, 'Lantern');
    assert.equal(st.text, 'Deal 1 damage to an enemy creature.');
    assert.equal(E.powerStatus(powered('lantern', ['deeper', 'broader']), 0).text, 'Deal 2 damage to an enemy creature. Also see one random card in the enemy hand.');
});

// ---- the AI ----

const POWER_IDS = Object.keys(Rift.data.powers);

// A practice-style battle where both heroes have a power (cycled through the 12 by game number).
function poweredGame(tag, g, tweaks) {
    const rng = Rift.makeRng('powers:' + tag + ':' + g);
    const teams = [0, 1].map(p => E.randomTeam(rng, 10, { prefix: tag + g + 'p' + p, legendaries: false }));
    const axioms = [0, 1].map(() => rng.shuffle(Rift.data.axiomDecks.starter).slice(0, 10));
    return E.createBattle({ seed: 'powers:' + tag + ':' + g,
        players: teams.map((team, p) => ({ team, axioms: axioms[p], power: { id: POWER_IDS[(g + p * 5) % POWER_IDS.length], tweaks: tweaks || [] } })),
        options: { mode: 'trainer', first: g % 2 } });
}

test('every AI level uses its power and plays legal moves to the end; Expert stays fast and deterministic', () => {
    for (const level of ['normal', 'competent', 'expert']) {
        const used = {};
        const times = [];
        for (let g = 0; g < POWER_IDS.length; g++) {
            let s = poweredGame(level, g, g % 3 === 2 ? ['deeper', 'broader'] : g % 3 === 1 ? ['blood'] : []);
            let guard = 0;
            while (E.winner(s) == null) {
                const t0 = performance.now();
                const a = AI.choose(s, { level });
                if (s.phase === 'main') times.push(performance.now() - t0);
                if (level === 'expert' && guard % 9 === 0) assert.deepEqual(plain(AI.choose(s, { level })), plain(a), 'Expert repeats its choice');
                s = E.applyAction(s, a);
                s.lastEvents.forEach(e => { if (e.t === 'power-use') used[e.id] = (used[e.id] || 0) + 1; });
                assert.ok(++guard < 3000, 'battle finished');
            }
            invariants(s, assert);
        }
        assert.ok(Object.keys(used).length >= 8, level + ' used most powers: ' + JSON.stringify(used));
        if (level === 'expert') {
            times.sort((a, b) => a - b);
            const mean = times.reduce((a, b) => a + b, 0) / times.length;
            // Same limits as battle-ai-levels.test.mjs (Expert's time budget).
            assert.ok(mean < 120, 'Expert mean move ' + mean.toFixed(1) + ' ms');
            assert.ok(times[Math.floor(0.95 * (times.length - 1))] < 300, 'Expert 95th-percentile move');
        }
    }
});

test('a battle with powers is deterministic: same seed, same moves, same log', () => {
    const run = () => AI.playOut(poweredGame('det', 3), ['competent', 'normal']);
    const a = run(), b = run();
    assert.deepEqual(E.fullLog(a).map(e => e.text), E.fullLog(b).map(e => e.text));
    assert.ok(E.fullLog(a).some(e => e.t === 'power-use'), 'a power was used');
});

test('Normal takes a clear power play: Close the Proof on a 1-health enemy', () => {
    let s = powered('close-the-proof', [], { p1: ['lobstorian'] });
    onBoard(s, 'p1c0');
    s.cards.p1c0.damage = E.healthOf(s, 'p1c0').max - 1;
    const a = AI.choose(s, { level: 'normal', salt: 'clear' });
    assert.equal(a.type, 'power');
    assert.equal(a.target, 'p1c0');
});

test('Competent sees an enemy Lantern or Close the Proof that could finish its 1-health creature; Normal does not', () => {
    for (const id of ['lantern', 'close-the-proof']) {
        const value = (enemy, level, ready) => {
            const s = setup({ p0: ['astrophysicat'], p1: ['astrophysicat'], powers: [null, enemy && { id: enemy, tweaks: [] }] });
            onBoard(s, 'p0c0');
            s.cards.p0c0.damage = E.healthOf(s, 'p0c0').max - 1; // 1 health left
            if (enemy && !ready) s.players[1].power = Object.assign({}, s.players[1].power, { cooldown: 2 });
            return AI.evaluate(s, 0, { level });
        };
        assert.ok(value(id, 'competent', true) < value(null, 'competent') - 0.1, id + ': exposed creature is worth less');
        assert.equal(value(id, 'competent', false), value(null, 'competent'), id + ': not ready next turn, no effect');
        assert.equal(value(id, 'normal', true), value(null, 'normal'), id + ': Normal does not look');
    }
});

// ---- team codes, launchers and Granny's lesson ----

const G = loadRift(['js/core/rift.js', 'js/core/state.js', 'js/core/world.js', 'data/creatures.js', 'data/items.js', 'data/map.js', 'data/decks.js',
    'data/axioms.js', 'data/tactics.js', 'data/avatars.js', 'data/powers.js', 'js/battle/abilities.js', 'js/battle/engine.js', 'js/battle/ai.js',
    'js/battle/lesson.js', 'js/battle/team-codes.js', 'js/ui/battles.js']);
const TC = G.Battle.TeamCodes;

test('team codes carry the avatar (type, variant, tweaks); old codes still import', () => {
    const team = [inst('lobstorian'), inst('swiftlet')];
    const code = TC.exportTeam({ nickname: 'Ida', creatures: team, avatar: { type: 'raven', variant: 'girl', nickname: 'Ida', tweaks: ['deeper', 'junk', 'deeper', 'blood'] } });
    const back = TC.importTeam(code);
    same(back.avatar, { type: 'raven', variant: 'girl', tweaks: ['deeper', 'blood'] });
    const ghost = TC.ghostOpponent(back);
    same(ghost.power, { id: 'call-it-out', tweaks: ['deeper', 'blood'] });
    // No avatar: the code imports with avatar null and the ghost uses its team's main colour (Competent: the other power).
    const plainCode = TC.exportTeam({ nickname: 'Bo', creatures: [inst('lobstorian'), inst('astrophysicat'), inst('swiftlet')] });
    const old = TC.importTeam(plainCode);
    assert.equal(old.avatar, null);
    assert.equal(G.State.decode('team', plainCode).av, undefined);
    same(TC.ghostOpponent(old).power, { id: 'foresee', tweaks: [] });
    const v1 = TC.importTeam(G.State.encode('team', { v: 1, n: 'Old', a: [], t: [['astrophysicat', 0, [], 0, 0]] }));
    assert.equal(v1.avatar, null);
    // Impossible avatars are refused.
    const crafted = av => G.State.encode('team', Object.assign(G.State.decode('team', plainCode), { av }));
    assert.throws(() => TC.importTeam(crafted(['dragon', 'boy', []])), /unknown avatar/);
    assert.throws(() => TC.importTeam(crafted(['owlet', 'boy', ['godmode']])), /unknown avatar/);
    assert.throws(() => TC.importTeam(crafted(['owlet', 'boy', ['quick', 'cheap', 'deeper', 'broader']])), /unknown avatar/);
    assert.throws(() => TC.importTeam(crafted('owlet')), /unknown avatar/);
});

test('trainers use the power of their main colour: board power at Normal, the other above', () => {
    for (const [id, t] of Object.entries(G.data.trainers)) {
        const side = G.Battles.trainerSide(id);
        assert.ok(side.power && G.data.powers[side.power.id], id + ' has a power');
        const kind = G.data.powers[side.power.id].kind;
        if (G.data.powers[side.power.id].colour !== 'emotion') assert.equal(kind, side.ai === 'normal' ? 'board' : 'other', id);
        same(side.power, G.Powers.forTeam(side.team, side.ai));
    }
    same(G.Powers.forTeam(['rawmsay', 'speedcheeta', 'lobstorian'], 'normal'), { id: 'outrage', tweaks: [] });
    same(G.Powers.forTeam(['rawmsay', 'speedcheeta', 'lobstorian'], 'competent'), { id: 'pile-on', tweaks: [] });
    assert.equal(G.Powers.forTeam([], 'normal'), null);
});

test('the Feed\'s Champion copies your most-used power (else your own); finished matches count uses', () => {
    const keep = G.State.get;
    const state = G.State.freshState();
    G.State.get = () => state;
    try {
        assert.equal(G.data.trainers.feed.copiesPower, true);
        // No avatar, no uses: the Champion keeps its own team power.
        const plain = G.Battles.trainerSide('feed');
        same(plain.power, G.Powers.forTeam(plain.team, plain.ai));
        // An avatar, no uses yet: your own power, with your tweaks.
        state.avatar = { type: 'fox', variant: 'girl', tweaks: ['quick'] };
        const own = G.Powers.forAvatar(state.avatar);
        same(G.Battles.trainerSide('feed').power, own);
        // Uses counted: the most-used one wins (tweaks only carry over for your own power).
        state.stats.powerUses = { [own.id]: 2, brainstorm: 5 };
        same(G.Battles.trainerSide('feed').power, { id: 'brainstorm', tweaks: [] });
        state.stats.powerUses = { [own.id]: 9, brainstorm: 5 };
        same(G.Battles.trainerSide('feed').power, own);
        // Other trainers are unaffected.
        const syllo = G.Battles.trainerSide('syllo');
        same(syllo.power, G.Powers.forTeam(syllo.team, syllo.ai));
    } finally { G.State.get = keep; }
});

test('launchers pass the avatar power and the opponent power; Granny\'s lesson has none', () => {
    const state = G.State.freshState();
    state.avatar = { type: 'fox', variant: 'boy', nickname: 'Test' };
    state.flags['card-lesson-won'] = true;
    state.flags['card-rules-version'] = 3;
    G.State.get = () => state;
    const routes = [];
    G.Router = { go: (screen, params) => routes.push({ screen, params }), replace: () => {} };
    G.UI = { toast() {}, modal() {} };
    G.Battles.practice();
    const p = routes.at(-1).params;
    same(p.player.power, { id: 'brainstorm', tweaks: [] });
    same(p.opponent.power, G.Powers.forTeam(p.opponent.team, 'normal'));
    G.Battles.story();
    same(routes.at(-1).params.player.power, { id: 'brainstorm', tweaks: [] });
    assert.ok(routes.at(-1).params.opponent.power);
    // Granny's guided lesson: no power for either side.
    const lesson = G.Battle.Lesson.create();
    assert.equal(lesson.players[0].power, null);
    assert.equal(lesson.players[1].power, null);
    assert.ok(!E.legalActions(lesson).some(a => a.type === 'power'));
});

test('tweak slots: one per chapter boss beaten, up to three; a jump ahead counts the bosses before it', () => {
    const st = G.State.freshState();
    assert.equal(G.World.tweakSlots(st), 0);
    st.map.completed.push('gate');
    assert.equal(G.World.tweakSlots(st), 1);
    st.map.completed.push('well', 'b-town-hall');
    assert.equal(G.World.tweakSlots(st), 2, 'only boss nodes count');
    st.map.completed.push('t-tribunal', 'k-core');
    assert.equal(G.World.tweakSlots(st), 3, 'the Core does not add a fourth');
    const jumper = G.State.freshState();
    jumper.map.rifts.push('ch3');
    assert.equal(G.World.tweakSlots(jumper), 2, 'jumped into Ch3: the Gate and the Town Hall count');
    jumper.map.rifts.push('ch4');
    assert.equal(G.World.tweakSlots(jumper), 3);
    for (const id of ['gate', 'b-town-hall', 't-tribunal']) assert.equal(G.data.map.nodes[id].type, 'boss', id);
});
