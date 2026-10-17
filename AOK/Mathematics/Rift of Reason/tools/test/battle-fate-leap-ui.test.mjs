// Leap Ahead, Revisit and Echoing Encouragement on the battle screen (#120): the hand prompt says exactly
// what a move would do (the engine's move on a copy); a leap shows what it skipped; the reel keeps marks
// for the leap, each skipped one-shot and a repeat space that ran out; a live repeat space behind NOW says
// how a rewind lands on it and how long it lasts. The screen only reads engine events: double clicks and
// Calm motion change nothing, and an inspected marker keeps its focus across repaints.
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadWithDom } from './fake-dom.mjs';

const CORE = ['js/core/rift.js', 'js/core/assets.js', 'data/creatures.js', 'data/axioms.js', 'data/tactics.js',
    'js/battle/abilities.js', 'js/battle/engine.js', 'js/battle/lesson.js'];

// mine / theirs: tactic ids; before(E, s) may take real engine actions before the screen opens.
function mount({ mine, theirs = [], calm = false, before } = {}) {
    const screens = {};
    const g = loadWithDom(CORE.concat([ctx => { ctx.Rift.Screens = { register: (n, d) => { screens[n] = d; }, get: n => screens[n] }; }, 'js/screens/battle.js']));
    const { Rift } = g;
    const E = Rift.Battle.Engine;
    Rift.Battle.AI = { choose(s) { const L = E.legalActions(s); return L.find(a => a.type === 'draw') || L.find(a => a.type === 'end') || L[0]; } };
    Rift.Audio = { speak() {}, stopVoice() {}, sfx() {} };
    if (calm) g.document.body.classList.add('calm-motion');
    const mk = (ids, prefix) => ids.map((species, i) => ({ uid: prefix + i, species, injuries: [], scars: [], powerDelta: 0 }));
    let s = E.createBattle({ seed: 'fate-leap-ui',
        players: [{ name: 'You', team: mk(['kardashiant', 'astrophysicat', 'lobstorian'], 'me-'), tactics: mine },
            { name: 'Dummy', team: mk(['lobstorian', 'astrophysicat', 'beastie'], 'opp-'), tactics: theirs }],
        axiomDeck: ['thrift', 'luxury', 'arrival', 'mercy'],
        options: { first: 0, shuffle: false, shuffleAxioms: false, spark: false, openHand: [0, 0], openAxioms: 0, timeline: true, fateStart: 6, fateMax: 7 } });
    const move = (cid, p, zone) => {
        ['deck', 'hand', 'board'].forEach(z => { s.players[p][z] = s.players[p][z].filter(x => x !== cid); });
        s.players[p][zone].push(cid); s.cards[cid].enteredTurn = -1;
    };
    move('p0c0', 0, 'board'); move('p0c1', 0, 'board'); move('p1c0', 1, 'board'); move('p1c1', 1, 'board');
    mine.forEach((x, i) => move('p0t' + i, 0, 'hand'));
    theirs.forEach((x, i) => move('p1t' + i, 1, 'hand'));
    s.players.forEach(P => { P.energy = P.capacity = 10; P.hearts = P.maxHearts = 30; });
    s.phase = 'main';
    if (before) s = before(E, s);
    const root = g.document.createElement('div');
    g.document.body.appendChild(root);
    const handle = screens.battle.mount(root, { mode: 'practice', seed: 'fate-leap-ui', initialState: s,
        opponent: { name: 'Dummy', team: mk(['lobstorian'], 'opp-'), ai: 'normal' }, onEnd() {} });
    const $ = sel => root.querySelector(sel);
    const $$ = sel => root.querySelectorAll(sel);
    const count = t => E.fullLog(handle.state).filter(e => e.t === t).length;
    return { g, Rift, E, root, handle, $, $$, count };
}
const select = (t, cid) => t.$('.b-hand [data-cid="' + cid + '"]').click();
const prompt = t => t.$('.b-prompt').textContent;
function nextRound(t) {
    t.$('.b-end').click();
    t.g.flush();
    const draw = t.$('.b-draw-btn[data-choice="deck"]');
    if (draw) draw.click();
    t.g.flush();
}
// Dummy schedules Clean Slate in round 1, so it happens at the end of round 2 (1 round ahead of NOW).
const enemyWipe = (E, s) => {
    const a = x => { s = E.applyAction(s, Object.assign({ player: E.decider(s) }, x)); };
    a({ type: 'end' }); a({ type: 'draw', choice: 'deck' }); a({ type: 'play', cid: 'p1t0' }); a({ type: 'end' }); a({ type: 'draw', choice: 'deck' });
    s.players.forEach(P => { P.energy = 10; });
    return s;
};

test('Leap Ahead: the prompt says what it skips; one leap however often Play is clicked; the reveal and the reel show the skipped plan', () => {
    for (const calm of [false, true]) {
        const t = mount({ mine: ['leap-ahead', 'revisit'], theirs: ['clean-slate'], calm, before: enemyWipe });
        const node = t.$('.b-fate .b-fev.sched[data-fate-event="f1"]');
        assert.ok(node && node.classList.contains('theirs'));
        assert.equal(node.parentNode.dataset.k, '1');
        assert.match(node.getAttribute('aria-label'), /Upcoming · Dummy's Clean Slate at the end of this round/);
        assert.match(node.getAttribute('aria-label'), /A leap over it skips it for good\./);
        select(t, 'p0t0');
        assert.match(prompt(t), /Play Leap Ahead for 2 energy\? You have 10\. Fate jumps 2 rounds ahead\. Skipped for good: Dummy's Clean Slate\. Nothing happens where it lands\./);
        const play = t.$('.b-prompt .btn.primary');
        play.click(); play.click();
        t.$('.b-hand [data-cid="p0t0"]') && t.$('.b-hand [data-cid="p0t0"]').click();
        assert.equal(t.count('fate-leap'), 1, 'one leap, however often it is clicked');
        assert.equal(t.handle.state.fate.queue[0].state, 'skipped');
        assert.match(t.$('.b-reveal').textContent, /You leap ahead!/);
        assert.match(t.$('.b-reveal').textContent, /Fate leaps 2 rounds ahead\. Skipped for good: Dummy's Clean Slate\. It lands on an empty space\./);
        const leap = t.$('.b-fate .b-fpast.leap'), skipped = t.$('.b-fate .b-fpast.skipped');
        assert.ok(leap && skipped, 'marks for the leap and the skipped plan');
        assert.equal(skipped.parentNode.dataset.k, '0', 'in this round');
        assert.match(leap.getAttribute('aria-label'), /You: Fate jumped 2 rounds ahead, skipping 1 event\./);
        assert.match(skipped.getAttribute('aria-label'), /Dummy's Clean Slate was skipped by a leap\. It will never happen, even if Fate comes back\./);
        assert.equal(t.$('.b-fate .b-fev.sched'), null, 'no coming node any more');
        assert.ok(t.$$('.b-recent-tile').some(n => /Leap Ahead/.test(n.getAttribute('aria-label')) && /is skipped\. It will never happen/.test(n.getAttribute('aria-label'))));
        // Inspect the skipped mark with the keyboard, then play Revisit: the repaint keeps focus and the panel.
        skipped.focus();
        skipped.dispatchEvent && skipped.dispatchEvent({ type: 'keydown', key: 'Enter', preventDefault() {} });
        if (!t.$('.b-inspect').classList.contains('show')) skipped.click();
        assert.match(t.$('.b-inspect').textContent, /will never happen/);
        select(t, 'p0t1');
        assert.match(prompt(t), /Fate goes 1 round back\. Nothing happens where it lands\./, 'landing on the skipped space does nothing');
        t.$('.b-prompt .btn.primary').click();
        assert.equal(t.handle.state.fate.pos, 2);
        assert.equal(t.handle.state.fate.queue[0].state, 'skipped');
        const again = t.$('.b-fate .b-fpast.skipped');
        assert.equal(t.g.document.activeElement, again, 'focus stays on the same mark after the repaint');
        assert.ok(t.$('.b-inspect').classList.contains('show'));
        // A skipped plan back ahead of NOW is shown struck out, never as coming.
        for (let n = 0; n < 2; n++) nextRound(t);
        assert.equal(t.count('fate-event'), 0, 'the wipe never happens');
        t.handle.destroy();
    }
});

test('Echoing Encouragement and Revisit: a repeat node with its lifetime, a live space behind NOW, landing on it again, and its end', () => {
    const t = mount({ mine: ['echoing-encouragement', 'revisit'] });
    const s0 = t.handle.state;
    const base = ['p0c0', 'p0c1'].map(cid => t.E.attackOf(s0, cid));
    select(t, 'p0t0');
    t.$('.b-prompt .btn.primary').click();
    const node = t.$('.b-fate .b-fev.sched[data-fate-event="f1"]');
    assert.equal(node.parentNode.dataset.k, '1');
    const label = node.getAttribute('aria-label');
    assert.match(label, /Upcoming · Your Echoing Encouragement at the end of this round, after Dummy's turn\./);
    assert.match(label, /Your creatures get \+1\/\+1\./);
    assert.match(label, /If it happened now: your Kim Kardashiant becomes \d+\/\d+, your Astrophysicat becomes \d+\/\d+\./);
    assert.match(label, /Repeatable: it happens each time Fate lands here, until it expires\. It ends after round 3 \(3 rounds more, this one included\)\. Moving Fate back does not make it last longer\./);
    nextRound(t);                        // round 1 ends: it happens
    assert.equal(t.count('fate-event'), 1);
    assert.deepEqual(['p0c0', 'p0c1'].map(cid => t.E.attackOf(t.handle.state, cid)), base.map(n => n + 1));
    let here = t.$('.b-fate .b-fev.sched.behind[data-fate-event="f1"]');
    assert.equal(here.parentNode.dataset.k, '0');
    assert.match(here.getAttribute('aria-label'), /Repeat space · Your Echoing Encouragement is where Fate is now \(it has happened once\)\. If Fate lands here again \(Revisit, Clockwork back\), it happens again\./);
    assert.match(t.$('.b-fate-sum').textContent, /↺ Your Echoing Encouragement: 2 rounds left/);
    nextRound(t);                        // round 2 ends: Fate moves off it
    here = t.$('.b-fate .b-fev.sched.behind[data-fate-event="f1"]');
    assert.equal(here.parentNode.dataset.k, '-1');
    assert.match(here.getAttribute('aria-label'), /is 1 round back/);
    assert.match(here.getAttribute('aria-label'), /It ends after round 3 \(this round is its last\)/);
    select(t, 'p0t1');
    assert.match(prompt(t), /Fate goes 1 round back\. It lands on your Echoing Encouragement \(again\): it happens now\./);
    t.$('.b-prompt .btn.primary').click();
    assert.equal(t.count('fate-event'), 2);
    assert.match(t.$('.b-reveal').textContent, /Fate: Echoing Encouragement!/);
    assert.match(t.$('.b-reveal').textContent, /Fate comes back to your Echoing Encouragement: your creatures get \+1\/\+1\./);
    assert.ok(t.$$('.b-fate .b-fpast.scheduled').some(n => /came back to your Echoing Encouragement \(a repeat space: time 2\)/.test(n.getAttribute('aria-label'))));
    assert.deepEqual(['p0c0', 'p0c1'].map(cid => t.E.attackOf(t.handle.state, cid)), base.map(n => n + 2));
    nextRound(t);                        // round 3 ends: its lifetime is over
    assert.equal(t.count('fate-expire'), 1);
    assert.deepEqual(['p0c0', 'p0c1'].map(cid => t.E.attackOf(t.handle.state, cid)), base, 'every boost it gave ends');
    const ended = t.$('.b-fate .b-fpast.expired');
    assert.ok(ended);
    assert.match(ended.getAttribute('aria-label'), /Your Echoing Encouragement ended after its rounds \(it happened 2 times\)\. Its boosts ended with it\. Moving Fate back does not bring it back\./);
    assert.equal(t.$('.b-fate .b-fev.sched.behind'), null, 'no live repeat space any more');
    assert.doesNotMatch(t.$('.b-fate-sum').textContent, /↺/);
    assert.ok(t.$$('.b-recent-tile').some(n => /Your Echoing Encouragement expires after 3 rounds: its \+1\/\+1 boosts end\./.test(n.getAttribute('aria-label'))));
    t.handle.destroy();
});

test('Clockwork\'s choice says when a move back lands on a live repeat space', () => {
    const t = mount({ mine: ['echoing-encouragement', 'clockwork'] });
    select(t, 'p0t0');
    t.$('.b-prompt .btn.primary').click();
    nextRound(t); nextRound(t);          // it happened at the end of round 1; Fate is 1 space past it
    select(t, 'p0t1');
    t.$('.b-prompt .btn.primary').click();
    const outs = t.$$('.b-choice-out').map(n => n.textContent);
    assert.ok(outs.some(x => /Echoing Encouragement happens again NOW/.test(x)), 'the move back lands on it: ' + outs.join(' | '));
    assert.ok(outs.some(x => !/Echoing Encouragement/.test(x)), 'the move forward does not');
    t.handle.destroy();
});
