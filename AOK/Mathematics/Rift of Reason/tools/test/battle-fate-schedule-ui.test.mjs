// Clean Slate on the battle screen (#119): card play → a node on the Fate reel with an inspectable
// countdown and live preview → engine resolution with a reveal → a spent marker. The screen only reads
// engine events: repeated clicks, Calm motion or leaving mid-reveal never resolve it twice.
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadWithDom } from './fake-dom.mjs';

const CORE = ['js/core/rift.js', 'js/core/assets.js', 'data/creatures.js', 'data/axioms.js', 'data/tactics.js',
    'js/battle/abilities.js', 'js/battle/engine.js', 'js/battle/lesson.js'];

function mount(opts = {}) {
    const screens = {};
    const g = loadWithDom(CORE.concat([ctx => { ctx.Rift.Screens = { register: (n, d) => { screens[n] = d; }, get: n => screens[n] }; }, 'js/screens/battle.js']));
    const { Rift } = g;
    const E = Rift.Battle.Engine;
    // A quiet scripted opponent: it draws and ends its turn.
    Rift.Battle.AI = { choose(s) { const L = E.legalActions(s); return L.find(a => a.type === 'draw') || L.find(a => a.type === 'end') || L[0]; } };
    Rift.Audio = { speak() {}, stopVoice() {}, sfx() {} };
    if (opts.calm) g.document.body.classList.add('calm-motion');
    const mk = (ids, prefix) => ids.map((species, i) => ({ uid: prefix + i, species, injuries: [], scars: [], powerDelta: 0 }));
    const s = E.createBattle({ seed: 'fate-ui',
        players: [{ name: 'You', team: mk(['zuckerborg', 'kardashiant', 'astrophysicat'], 'me-'), tactics: ['clean-slate'] },
            { name: 'Dummy', team: mk(['lobstorian', 'astrophysicat', 'beastie'], 'opp-'), tactics: [] }],
        axiomDeck: ['thrift', 'luxury', 'arrival', 'mercy'],
        options: { first: 0, shuffle: false, shuffleAxioms: false, spark: false, openHand: [0, 0], openAxioms: 0, timeline: true, fateStart: 3 } });
    const move = (cid, p, zone) => {
        ['deck', 'hand', 'board'].forEach(z => { s.players[p][z] = s.players[p][z].filter(x => x !== cid); });
        s.players[p][zone].push(cid); s.cards[cid].enteredTurn = -1;
    };
    move('p0c0', 0, 'board'); move('p0c1', 0, 'board'); move('p1c0', 1, 'board'); move('p1c1', 1, 'board'); move('p0t0', 0, 'hand');
    s.players.forEach(P => { P.energy = P.capacity = 10; });
    s.phase = 'main';
    const root = g.document.createElement('div');
    g.document.body.appendChild(root);
    const results = [];
    const handle = screens.battle.mount(root, { mode: 'practice', seed: 'fate-ui', initialState: s,
        opponent: { name: 'Dummy', team: mk(['lobstorian'], 'opp-'), ai: 'normal' }, onEnd: r => results.push(r) });
    const $ = sel => root.querySelector(sel);
    const fired = () => E.fullLog(handle.state).filter(e => e.t === 'fate-event').length;
    return { g, Rift, E, root, handle, $, fired, results };
}
const playCleanSlate = t => { t.$('.b-hand [data-cid="p0t0"]').click(); t.$('.b-prompt .btn.primary').click(); };
// My End turn, the opponent's turn, and my draw: one round further.
function nextRound(t) {
    t.$('.b-end').click();
    t.g.flush();
    const draw = t.$('.b-draw-btn[data-choice="deck"]');
    if (draw) draw.click();
    t.g.flush();
}

test('card play puts a node on the Fate reel with an inspectable countdown and the live preview', () => {
    const t = mount();
    playCleanSlate(t);
    const q = t.E.fateSchedule(t.handle.state);
    assert.equal(q.length, 1);
    assert.equal(q[0].state, 'pending');
    const node = t.$('.b-fate .b-fev.sched[data-fate-event="f1"]');
    assert.ok(node, 'a Clean Slate node on the reel');
    assert.ok(node.classList.contains('mine'));
    assert.equal(node.parentNode.dataset.k, '2', 'on the round it resolves: 2 rounds ahead');
    const label = node.getAttribute('aria-label');
    assert.match(label, /Upcoming · Your Clean Slate in 2 rounds, at the end of round 2, after Dummy's turn\./);
    assert.match(label, /Every creature in play is defeated\./);
    assert.match(label, /If it happened now: 4 creatures are defeated: your Zuckerborg \(back to the hand\), your Kim Kardashiant, Dummy's Lobstorian, Dummy's Astrophysicat\./);
    assert.match(label, /One-shot: it happens once/);
    assert.match(label, /You played it\./);
    assert.match(t.$('.b-fate-sum').textContent, /Your Clean Slate in 2 rounds/);
    node.click();
    assert.ok(t.$('.b-inspect').classList.contains('show'));
    assert.match(t.$('.b-inspect').textContent, /If it happened now: 4 creatures are defeated/);
    assert.match(t.$('.b-inspect').textContent, /Creatures are chosen when it happens, not now\./);
    t.handle.destroy();
});

test('it resolves once through the real engine, is revealed, and stays visible as spent; repeated clicks change nothing', () => {
    for (const calm of [false, true]) {
        const t = mount({ calm });
        playCleanSlate(t);
        nextRound(t);
        assert.equal(t.fired(), 0);
        assert.match(t.$('.b-fate-sum').textContent, /Your Clean Slate in 1 round/, 'the countdown has moved one round');
        // Round 2: my End turn, then the opponent's End turn resolves it. Clicking End again does nothing more.
        t.$('.b-end').click(); t.$('.b-end').click();
        t.g.flush();
        assert.equal(t.fired(), 1, 'resolved exactly once');
        const s = t.handle.state;
        assert.deepEqual(Array.from(s.players[0].board).concat(Array.from(s.players[1].board)), []);
        assert.ok(s.players[0].hand.includes('p0c0'), 'Zuckerborg\'s Last Word');
        assert.match(t.$('.b-reveal').textContent, /Fate: Clean Slate!/);
        assert.match(t.$('.b-reveal').textContent, /Fate reaches your Clean Slate: every creature in play is defeated\./);
        const past = t.root.querySelectorAll('.b-fate .b-fpast.scheduled');
        assert.equal(past.length, 1, 'a spent marker where it happened');
        assert.match(past[0].getAttribute('aria-label'), /Fate reached your Clean Slate \(spent: it happens only once\)/);
        assert.equal(t.$('.b-fate .b-fev.sched'), null, 'no coming node any more');
        assert.ok(t.root.querySelectorAll('.b-recent-tile').some(n => /Fate reaches your Clean Slate/.test(n.getAttribute('aria-label'))));
        // Many more rounds (and a re-render each): still once.
        for (let n = 0; n < 3; n++) nextRound(t);
        assert.equal(t.fired(), 1);
        t.handle.destroy();
    }
});

test('leaving mid-reveal or interrupting visuals never repeats or loses the resolution', () => {
    const t = mount();
    playCleanSlate(t);
    nextRound(t);
    t.$('.b-end').click();
    // Step the screen's timers one by one until the opponent's End turn has resolved it and the reveal is up.
    const showing = () => t.$('.b-reveal').classList.contains('show') && /Clean Slate/.test(t.$('.b-reveal').textContent);
    for (let n = 0; n < 60 && !(t.fired() === 1 && showing()); n++) { const next = t.g.timers.shift(); if (!next) break; next.fn(); }
    assert.equal(t.fired(), 1, 'the engine resolved it in the opponent\'s End turn');
    assert.ok(showing(), 'its reveal is on screen');
    const state = t.handle.state;
    t.handle.destroy();   // leave mid-reveal
    t.g.flush();
    assert.equal(t.handle.state, state, 'nothing more happens after leaving');
    assert.equal(t.fired(), 1, 'still exactly once');
    assert.equal(t.E.fateSchedule(state)[0].state, 'fired', 'the battle state, not the animation, records it');
});

test('a full schedule explains why Clean Slate cannot be played', () => {
    const t = mount();
    const s = t.handle.state;
    s.fate.queue = [1, 2].map(n => ({ id: 'f' + n, seq: n, def: 'clean-slate', source: { type: 'tactic', cid: 'x', card: 'clean-slate' }, controller: 0,
        space: 5, createdRound: 1, createdTurn: 1, repeat: false, lifetime: null, expiresRound: null, state: 'pending', fires: 0, firedRound: null, reason: null, target: null }));
    s.fate.seq = 2;
    t.$('.b-hand [data-cid="p0t0"]').click();
    assert.match(t.root.textContent, /You already have 2 spells waiting on the Fate track\./);
    t.handle.destroy();
});
