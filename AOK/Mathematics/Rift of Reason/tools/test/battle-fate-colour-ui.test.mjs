// The colour-scheduled spells and Fate timing Axioms on the battle screen (#121): the prompt and the card's
// inspection say when a spell in hand would happen now (a timing rule moves it) and how many already wait;
// Remember This names the creature it fixes; a node's "if it happened now" line names tokens, returns and how
// many cards a draw would bring, never which; the Idea token enters play; a boost until a player's next turn
// says so; the rule tiles and rule cards name the Fate timing categories in words.
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadWithDom } from './fake-dom.mjs';

const CORE = ['js/core/rift.js', 'js/core/assets.js', 'data/creatures.js', 'data/axioms.js', 'data/tactics.js',
    'js/battle/abilities.js', 'js/battle/engine.js', 'js/battle/lesson.js'];

// mine/theirs: tactic lists (p0t0…, p1t0…), all in hand; rules: active Axioms; discard: my creatures already
// defeated (in order). The opponent only draws and ends.
function mount(opts = {}) {
    const screens = {};
    const g = loadWithDom(CORE.concat([ctx => { ctx.Rift.Screens = { register: (n, d) => { screens[n] = d; }, get: n => screens[n] }; }, 'js/screens/battle.js']));
    const { Rift } = g;
    const E = Rift.Battle.Engine;
    Rift.Battle.AI = { choose(s) { const L = E.legalActions(s); return L.find(a => a.type === 'draw') || L.find(a => a.type === 'end') || L[0]; } };
    Rift.Audio = { speak() {}, stopVoice() {}, sfx() {} };
    const mk = (ids, prefix) => ids.map((species, i) => ({ uid: prefix + i, species, injuries: [], scars: [], powerDelta: 0 }));
    const s = E.createBattle({ seed: 'fate-colour-ui',
        players: [{ name: 'You', team: mk(['zuckerborg', 'kardashiant', 'astrophysicat'], 'me-'), tactics: opts.mine || [] },
            { name: 'Dummy', team: mk(['lobstorian', 'astrophysicat', 'beastie'], 'opp-'), tactics: opts.theirs || [] }],
        axiomDeck: ['thrift', 'luxury', 'arrival', 'mercy'],
        options: { first: 0, shuffle: false, shuffleAxioms: false, spark: false, openHand: [0, 0], openAxioms: 0, timeline: true, fateStart: 6, fateGap: 3 } });
    const move = (cid, p, zone) => {
        ['deck', 'hand', 'board', 'discard'].forEach(z => { s.players[p][z] = s.players[p][z].filter(x => x !== cid); });
        s.players[p][zone].push(cid); s.cards[cid].enteredTurn = -1;
    };
    move('p0c1', 0, 'board'); move('p0c2', 0, 'board'); move('p1c0', 1, 'board'); move('p1c1', 1, 'board');
    (opts.discard || []).forEach(cid => move(cid, 0, 'discard'));
    (opts.mine || []).forEach((_, i) => move('p0t' + i, 0, 'hand'));
    (opts.theirs || []).forEach((_, i) => move('p1t' + i, 1, 'hand'));
    (opts.rules || []).forEach(id => { s.axioms.active[Rift.data.axioms[id].category] = id; });
    s.players.forEach(P => { P.energy = P.capacity = 10; P.hearts = P.maxHearts = 30; });
    s.phase = 'main';
    const root = g.document.createElement('div');
    g.document.body.appendChild(root);
    const handle = screens.battle.mount(root, { mode: 'practice', seed: 'fate-colour-ui', initialState: s,
        opponent: { name: 'Dummy', team: mk(['lobstorian'], 'opp-'), ai: 'normal' }, onEnd() {} });
    const $ = sel => root.querySelector(sel);
    const log = t => E.fullLog(handle.state).filter(e => e.t === t);
    return { g, Rift, E, root, handle, $, log };
}
const select = (t, cid) => t.$('.b-hand [data-cid="' + cid + '"]').click();
const playIt = (t, cid) => { select(t, cid); t.$('.b-prompt .btn.primary').click(); t.g.flush(); };
const inspectHand = (t, cid) => { t.$('.b-hand [data-cid="' + cid + '"]').dispatchEvent({ type: 'pointerenter', pointerType: 'mouse' }); t.g.flush(); return t.$('.b-inspect').textContent; };
function nextRound(t) {
    t.$('.b-end').click();
    t.g.flush();
    const draw = t.$('.b-draw-btn[data-choice="deck"]');
    if (draw) draw.click();
    t.g.flush();
}

test('Tomorrow\'s Idea: when it happens and how many wait; its node previews the token; the token enters at the round\'s end', () => {
    const t = mount({ mine: ['tomorrows-idea', 'scheduled-speech'] });
    assert.match(inspectHand(t, 'p0t0'), /If you play it now: It happens at the end of this round\. Your spells waiting on the Fate track: 0 of 2\./);
    select(t, 'p0t0');
    assert.equal(t.$('.b-prompt .b-fate-move').textContent.trim(), 'It happens at the end of this round. Your spells waiting on the Fate track: 0 of 2.');
    t.$('.b-prompt .btn.primary').click(); t.g.flush();
    const node = t.$('.b-fate .b-fev.sched[data-fate-event="f1"]');
    assert.ok(node);
    assert.match(node.getAttribute('aria-label'), /Upcoming · Your Tomorrow's Idea at the end of this round, after Dummy's turn\. A 1\/2 Idea token joins your side, if there is room\. If it happened now: an Idea token joins your side\./);
    select(t, 'p0t1');
    assert.match(t.$('.b-prompt .b-fate-move').textContent, /Your spells waiting on the Fate track: 1 of 2\./);
    nextRound(t);
    assert.equal(t.log('summon').length, 1, 'one token');
    const cid = t.log('summon')[0].cid;
    const card = t.$('[data-zone="my-board"] [data-cid="' + cid + '"]');
    assert.ok(card, 'the token is on my side');
    assert.match(card.textContent, /Idea/);
    t.handle.destroy();
});

test('a Fate timing rule moves the spell in hand: the prompt, the rule tile and the rule card say so in words', () => {
    const t = mount({ mine: ['clean-slate'], rules: ['patient-plans'] });
    select(t, 'p0t0');
    assert.equal(t.$('.b-prompt .b-fate-move').textContent.trim(), 'It happens in 3 rounds (Patient Plans: 1 round later). Your spells waiting on the Fate track: 0 of 2.');
    const tile = t.$('.b-rtile[data-cat="fate-delay"]');
    assert.ok(tile, 'a tile for the active rule');
    assert.match(tile.getAttribute('aria-label'), /^Fate timing: Fate spells 1 round later \(changed by Patient Plans\)$/);
    tile.click(); t.g.flush();
    assert.match(t.$('.b-inspect').textContent, /Rule card \(Fate timing\): active now for BOTH players\./);
    t.$('.b-prompt .btn.primary') && t.$('.b-prompt .btn.primary').click();
    t.g.flush();
    assert.match(t.log('fate-schedule')[0].text, /In 3 rounds: every creature in play is defeated\. Patient Plans moved it 1 round later\./);
    t.handle.destroy();
});

test('Open Calendar: three may wait; a fourth says why it can\'t be played', () => {
    const t = mount({ mine: ['tomorrows-idea', 'scheduled-speech', 'prepared-defence', 'tomorrows-idea'], rules: ['open-calendar'] });
    playIt(t, 'p0t0'); playIt(t, 'p0t1');
    t.handle.state.players[0].playsThisTurn = 0;            // a third play this turn (the play limit is not what this tests)
    select(t, 'p0t2');                                     // a repaint that sees the new budget
    select(t, 'p0t2');
    assert.match(t.$('.b-prompt .b-fate-move').textContent, /Your spells waiting on the Fate track: 2 of 3\./);
    t.$('.b-prompt .btn.primary').click(); t.g.flush();
    select(t, 'p0t3');
    assert.match(t.$('.b-prompt').textContent, /You already have 3 spells waiting on the Fate track\./);
    // The rule goes with three waiting: none is cancelled, and the message gives both numbers.
    t.handle.state.axioms.active = {};
    t.$('.b-prompt .btn') && t.$('.b-prompt .btn').click(); t.g.flush();   // Cancel: a repaint without the rule
    select(t, 'p0t3');
    assert.match(t.$('.b-prompt').textContent, /You already have 3 spells waiting on the Fate track\. The limit is now 2\./);
    t.handle.destroy();
});

test('Remember This names its creature; Delayed Observation\'s node counts the cards and never names one', () => {
    const t = mount({ mine: ['remember-this', 'delayed-observation'], discard: ['p0c0'] });
    assert.match(inspectHand(t, 'p0t0'), /It brings back Zuckerborg if it is still in your discard pile then\./);
    playIt(t, 'p0t0');
    let label = t.$('.b-fate .b-fev.sched[data-fate-event="f1"]').getAttribute('aria-label');
    assert.match(label, /Zuckerborg returns from the discard pile to your hand\. If it happened now: Zuckerborg returns to your hand\./);
    playIt(t, 'p0t1');
    label = t.$('.b-fate .b-fev.sched[data-fate-event="f2"]').getAttribute('aria-label');
    assert.match(label, /You draw 2 cards from your deck\. If it happened now: you draw 2 cards\./);
    const st = t.handle.state, top = st.players[0].deck.slice(0, 2).map(cid => t.E.cardName(st, cid));
    t.$('.b-fate .b-fev.sched[data-fate-event="f2"]').click(); t.g.flush();
    const shown = t.$('.b-inspect').textContent + label;
    top.forEach(name => assert.ok(!shown.includes(name), 'the top card ' + name + ' is not named'));
    nextRound(t);
    assert.ok(t.handle.state.players[0].hand.includes('p0c0'), 'Zuckerborg is back');
    t.handle.destroy();
});

test('Scheduled Speech: the boost says it lasts until the end of your next turn', () => {
    const t = mount({ mine: ['scheduled-speech'] });
    playIt(t, 'p0t0');
    t.$('.b-end').click(); t.g.flush();                     // round 1 ends after Dummy's turn; my turn 3 starts
    assert.equal(t.log('fate-event').length, 1);
    const card = t.$('[data-zone="my-board"] [data-cid="p0c1"]');
    card.dispatchEvent({ type: 'pointerenter', pointerType: 'mouse' }); t.g.flush();
    assert.match(t.$('.b-inspect').textContent, /\+1 attack: Scheduled Speech \(until the end of this turn\)/, 'it is my turn 3: the boost ends with it');
    t.handle.destroy();
});
