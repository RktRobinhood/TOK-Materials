// Environmental Fate events on the battle screen (#128): the node says Environmental, its source, its effect,
// who it helps, when, and that it comes back; keyboard inspection works; when Fate reaches it, the reveal shows
// the source's picture; a leap marks it skipped for good. Calm motion changes nothing in what happens.
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
    Rift.Battle.AI = { choose(s) { const L = E.legalActions(s); return L.find(a => a.type === 'draw') || L.find(a => a.type === 'end') || L[0]; } };
    Rift.Audio = { speak() {}, stopVoice() {}, sfx() {} };
    if (opts.calm) g.document.body.classList.add('calm-motion');
    const mk = (ids, prefix) => ids.map((species, i) => ({ uid: prefix + i, species, injuries: [], scars: [], powerDelta: 0 }));
    const s = E.createBattle({ seed: 'fate-env-ui', environment: opts.environment,
        players: [{ name: 'You', team: mk(['zuckerborg', 'kardashiant', 'astrophysicat'], 'me-'), tactics: opts.mine || [] },
            { name: 'Dummy', team: mk(['lobstorian', 'astrophysicat', 'beastie'], 'opp-'), tactics: [] }],
        axiomDeck: ['thrift', 'luxury', 'arrival', 'mercy'],
        options: { first: 0, shuffle: false, shuffleAxioms: false, spark: false, openHand: [0, 0], openAxioms: 0, timeline: true, fateStart: 6, fateGap: 3 } });
    const move = (cid, p, zone) => {
        ['deck', 'hand', 'board'].forEach(z => { s.players[p][z] = s.players[p][z].filter(x => x !== cid); });
        s.players[p][zone].push(cid); s.cards[cid].enteredTurn = -1;
    };
    move('p0c0', 0, 'board'); move('p1c0', 1, 'board'); move('p1c1', 1, 'board');
    (opts.mine || []).forEach((_, i) => move('p0t' + i, 0, 'hand'));
    s.players.forEach(P => { P.energy = P.capacity = 10; P.hearts = P.maxHearts = 30; });
    s.phase = 'main';
    const root = g.document.createElement('div');
    g.document.body.appendChild(root);
    const handle = screens.battle.mount(root, { mode: 'practice', seed: 'fate-env-ui', initialState: s,
        opponent: { name: 'Dummy', team: mk(['lobstorian'], 'opp-'), ai: 'normal' }, onEnd() {} });
    const $ = sel => root.querySelector(sel);
    const log = t => E.fullLog(handle.state).filter(e => e.t === t);
    return { g, Rift, E, root, handle, $, log };
}
const select = (t, cid) => t.$('.b-hand [data-cid="' + cid + '"]').click();
const playIt = (t, cid) => { select(t, cid); t.$('.b-prompt .btn.primary').click(); };
function nextRound(t) {
    t.$('.b-end').click();
    t.g.flush();
    const draw = t.$('.b-draw-btn[data-choice="deck"]');
    if (draw) draw.click();
    t.g.flush();
}
const TREND = [{ def: 'trending', first: 2, every: 2, side: 1 }];

test('an environmental node names its source, its effect, who it helps, when, and that it comes back', () => {
    for (const calm of [false, true]) {
        const t = mount({ calm, environment: TREND });
        const node = t.$('.b-fate .b-fev.sched.env[data-fate-event="f1"]');
        assert.ok(node, calm + ': the node is on the reel, marked environmental');
        assert.equal(node.parentNode.dataset.k, '2');
        assert.match(node.textContent, /Trending/);
        const label = node.getAttribute('aria-label');
        assert.match(label, /^Upcoming · Environmental: The Algorithm's Trending in 2 rounds, at the end of round 2/);
        assert.match(label, /Dummy's creature with the most attack gets \+1 attack until the end of its next turn\./);
        assert.match(label, /If it happened now: Dummy's Lobstorian gets \+1\/0\./);
        assert.match(label, /One-shot: it happens once\. A leap past it skips it for good\./);
        assert.match(label, /Part of this match: The Algorithm causes it\. It helps Dummy\. It comes back every 2 rounds, as a new event\./);
        assert.match(t.$('.b-fate-sched').textContent, /The Algorithm's Trending in 2 rounds/);
        // Keyboard inspection.
        node.focus();
        node.dispatchEvent({ type: 'keydown', key: 'Enter', preventDefault() {} });
        assert.match(t.$('.b-inspect').textContent, /The Feed boosts whatever is loudest/);
        t.handle.destroy();
    }
});

test('when Fate reaches it, it happens once, is revealed with its source, and the next occurrence takes its place', () => {
    for (const calm of [false, true]) {
        const t = mount({ calm, environment: TREND });
        nextRound(t); nextRound(t);
        const fired = t.log('fate-event');
        assert.equal(fired.length, 1, calm + ': it happened once');
        assert.equal(fired[0].def, 'trending');
        assert.match(t.$('.b-reveal').textContent, /Fate: Trending!/);
        assert.match(t.$('.b-reveal').textContent, /Fate reaches the Trending: Dummy's creature with the most attack gets \+1 attack/);
        assert.ok(t.$('.b-reveal .b-reset-icon'), 'the source\'s picture stands in for a card');
        const next = t.$('.b-fate .b-fev.sched.env[data-fate-event="f2"]');
        assert.ok(next, 'a new occurrence with its own id');
        assert.equal(next.parentNode.dataset.k, '2');
        t.$('.b-hand') && t.$('.b-end');                       // a repaint changes nothing
        assert.equal(t.log('fate-event').length, 1);
        t.handle.destroy();
    }
});

test('Leap Ahead over an environmental occurrence: the prompt says so, and the node is marked skipped for good', () => {
    const t = mount({ environment: TREND, mine: ['leap-ahead', 'nostalgia'] });
    nextRound(t);                                             // Trending is 1 round away
    select(t, 'p0t0');
    assert.match(t.$('.b-prompt').textContent, /Skipped for good: The Algorithm's Trending/);
    t.$('.b-prompt .btn.primary').click();
    t.g.flush();
    assert.match(t.$('.b-reveal').textContent, /The Trending is skipped\. It will not happen\./);
    playIt(t, 'p0t1'); t.g.flush();                           // Nostalgia: back over the skipped space
    const node = t.$('.b-fate .b-fev.sched.spent.skipped[data-fate-event="f1"]');
    assert.ok(node, 'the skipped node is on the reel');
    assert.match(node.getAttribute('aria-label'), /Over · Environmental: The Algorithm's Trending was skipped by a leap\. It will not happen\./);
    nextRound(t);
    assert.ok(!t.log('fate-event').some(e => e.id === 'f1'), 'it never happens');
    t.handle.destroy();
});
