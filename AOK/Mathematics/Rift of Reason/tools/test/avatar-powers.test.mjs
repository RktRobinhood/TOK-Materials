// Hero powers (design/AVATARS.md section 1, data/powers.js): each power's effect, energy and heart
// costs, recharge, once per turn, no card play used, tweaks, the AI using them, team codes and
// determinism.
import test from 'node:test';
import assert from 'node:assert/strict';
import { Rift, E, AI, inst, setup, act, onBoard, toHand, toDiscard, pass, hp, atk, plain, stats, invariants } from './battle-helpers.mjs';

const same = (a, b, m) => assert.deepEqual(plain(a), b, m);
const powerActs = s => E.legalActions(s).filter(a => a.type === 'power');
const texts = s => s.lastEvents.map(e => e.text).join(' | ');

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
    assert.equal(st.cost, 1);
    assert.equal(st.recharge, 1);
    s = act(s, { type: 'power', target: 'p1c0' });
    assert.ok(s.players[1].discard.includes('p1c0'));
    assert.equal(s.players[0].energy, 9);
    assert.equal(s.players[0].playsThisTurn || 0, 0, 'not a card play');
    assert.equal(E.playsLeft(s, 0), 2);
    assert.ok(s.lastEvents.some(e => e.t === 'power-use' && e.id === 'close-the-proof'));
    // Once per turn, then recharge 1: skip one own turn, ready on the next.
    s.cards.p1c1.damage = 2;
    assert.equal(powerActs(s).length, 0);
    assert.equal(E.powerStatus(s, 0).why, 'recharge');
    assert.equal(E.powerStatus(s, 0).turnsLeft, 2);
    s = pass(pass(s));
    assert.equal(s.active, 0);
    assert.equal(E.powerStatus(s, 0).turnsLeft, 1);
    assert.equal(powerActs(s).length, 0);
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
    assert.equal(st.cost, 2, 'Broader: +1 energy');
    assert.equal(st.recharge, 2, 'Deeper: recharge +1');
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

test('Foresee reorders the top 2 rule cards (Deeper 3, Broader takes one)', () => {
    let s = powered('foresee', [], { axioms: ['underdog', 'thrift', 'haste', 'mercy'] });
    s = act(s, { type: 'power' });
    assert.equal(s.phase, 'choose');
    same(s.pending.options, ['underdog', 'thrift']);
    assert.equal(s.pending.kind, 'axiom');
    const look = s.lastEvents.find(e => e.t === 'power' && e.privateTo === 0);
    assert.ok(look && /Underdog/.test(look.text) && !/Underdog/.test(look.publicText), 'only the user sees the cards');
    s = act(s, { type: 'choose', choice: 'thrift' });
    same(s.axioms.deck, ['thrift', 'underdog', 'haste', 'mercy']);
    assert.equal(s.phase, 'main');

    let d = powered('foresee', ['deeper'], { axioms: ['underdog', 'thrift', 'haste', 'mercy'] });
    d = act(d, { type: 'power' });
    same(d.pending.options, ['underdog', 'thrift', 'haste']);
    d = act(d, { type: 'choose', choice: 'haste' });
    same(d.pending.options, ['underdog', 'thrift']);
    d = act(d, { type: 'choose', choice: 'thrift' });
    same(d.axioms.deck, ['haste', 'thrift', 'underdog', 'mercy']);

    let b = powered('foresee', ['broader'], { axioms: ['underdog', 'thrift', 'haste'] });
    b = act(b, { type: 'power' });
    b = act(b, { type: 'choose', choice: 'underdog' });
    same(b.players[0].axHand, ['underdog']);
    same(b.axioms.deck, ['thrift', 'haste']);
    assert.equal(b.phase, 'main', 'one card left: nothing to order');
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

test('What If?: swaps attack and health (Deeper +1 attack, Broader draws)', () => {
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
    assert.equal(hp(d, 'p0c0'), 1);
    assert.equal(d.players[0].hand.length, 1);
});

test('Brainstorm: +1 card play this turn (Deeper +2, Broader +1 energy)', () => {
    let s = powered('brainstorm');
    s = act(s, { type: 'power' });
    assert.equal(E.playsLeft(s, 0), 3);
    let d = powered('brainstorm', ['deeper', 'broader']);
    d = act(d, { type: 'power' });
    assert.equal(E.playsLeft(d, 0), 4);
    assert.equal(d.players[0].energy, 10 - 2 + 1);
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

test('Hold That Thought moves Fate 1 space (Deeper up to 2, Broader draws)', () => {
    let s = powered('hold-that-thought', [], { options: { timeline: true, fateStart: 6 } });
    s = act(s, { type: 'power' });
    same(s.pending.options, ['forward', 'rewind']);
    s = act(s, { type: 'choose', choice: 'forward' });
    assert.equal(s.fate.until, 5);
    let d = powered('hold-that-thought', ['deeper', 'broader'], { options: { timeline: true, fateStart: 6 } });
    d = act(d, { type: 'power' });
    same(d.pending.options, ['forward-2', 'forward', 'rewind', 'rewind-2']);
    d = act(d, { type: 'choose', choice: 'rewind-2' });
    assert.equal(d.fate.until, 8);
    assert.equal(d.players[0].hand.length, 1);
    assert.equal(E.powerStatus(powered('hold-that-thought'), 0).why, 'useless', 'no Fate track');
});

test('Call It Out strips Guard, Shield and Elusive (Deeper: can\'t attack next turn)', () => {
    let s = powered('call-it-out', [], { p1: ['lobstorian', 'astrophysicat'] });
    onBoard(s, 'p1c0', 'p1c1');
    same(powerActs(s).map(a => a.target), ['p1c0'], 'only creatures with those keywords');
    s = act(s, { type: 'power', target: 'p1c0' });
    assert.ok(!E.keywordsOf(s, 'p1c0').includes('guard'));
    let d = powered('call-it-out', ['deeper'], { p1: ['astrophysicat'] });
    onBoard(d, 'p1c0');
    d = act(d, { type: 'power', target: 'p1c0' });
    assert.equal(d.cards.p1c0.frozen, true);
});

test('Fine Print: lose 1 heart, draw (Deeper 2 cards, Broader +1 energy); never the last heart', () => {
    let s = powered('fine-print');
    s = act(s, { type: 'power' });
    assert.equal(s.players[0].hearts, 9);
    assert.equal(s.players[0].hand.length, 1);
    let d = powered('fine-print', ['deeper', 'broader']);
    d = act(d, { type: 'power' });
    assert.equal(d.players[0].hand.length, 2);
    assert.equal(d.players[0].energy, 10 - 2 + 1);
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
    same([st('lantern', ['quick']).cost, st('lantern', ['quick']).recharge], [3, 0]);
    same([st('lantern', ['cheap']).cost, st('lantern', ['cheap']).recharge], [1, 2]);
    same([st('fine-print', ['quick']).recharge, st('close-the-proof', ['cheap']).cost], [0, 0]);
    const b = st('lantern', ['blood', 'broader']);
    same([b.cost, b.heartCost], [0, 1]);
    let s = powered('lantern', ['blood']);
    onBoard(s, 'p1c0');
    s = act(s, { type: 'power', target: 'p1c0' });
    assert.equal(s.players[0].energy, 10, 'no energy');
    assert.equal(s.players[0].hearts, 9, 'one heart');
    const low = powered('lantern', ['blood']);
    onBoard(low, 'p1c0');
    low.players[0].hearts = 1;
    assert.equal(E.powerStatus(low, 0).why, 'hearts');
    // Recharge 0 (Quick): ready again next own turn, still once per turn.
    let q = powered('fine-print', ['quick']);
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
