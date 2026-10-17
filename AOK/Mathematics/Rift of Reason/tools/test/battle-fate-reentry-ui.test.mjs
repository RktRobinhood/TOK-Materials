// Leaps, rewinds and repeatable spaces on the battle screen (#120): the play prompt and the card's inspection
// say exactly what Leap Ahead or Revisit would do now; a leap is revealed with what it skipped; the reel keeps
// a leap marker, a live repeatable space behind NOW, and the expiry. The screen only reads engine events:
// repeated clicks, Calm motion or repaints never resolve anything twice, and a focused marker keeps its focus.
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadWithDom } from './fake-dom.mjs';

const CORE = ['js/core/rift.js', 'js/core/assets.js', 'data/creatures.js', 'data/axioms.js', 'data/tactics.js',
    'js/battle/abilities.js', 'js/battle/engine.js', 'js/battle/lesson.js'];

// mine/theirs: tactic lists (p0t0…, p1t0…); prep(s, move) arranges the start; the opponent only draws and ends,
// or plays the actions listed in opts.script first.
function mount(opts = {}) {
    const screens = {};
    const g = loadWithDom(CORE.concat([ctx => { ctx.Rift.Screens = { register: (n, d) => { screens[n] = d; }, get: n => screens[n] }; }, 'js/screens/battle.js']));
    const { Rift } = g;
    const E = Rift.Battle.Engine;
    const script = (opts.script || []).slice();
    Rift.Battle.AI = { choose(s) {
        const L = E.legalActions(s);
        const ok = script.length && L.find(x => E.actionKey(x) === E.actionKey(Object.assign({ player: s.active }, script[0])));
        if (ok) { script.shift(); return ok; }
        return L.find(a => a.type === 'draw') || L.find(a => a.type === 'end') || L[0];
    } };
    Rift.Audio = { speak() {}, stopVoice() {}, sfx() {} };
    if (opts.calm) g.document.body.classList.add('calm-motion');
    const mk = (ids, prefix) => ids.map((species, i) => ({ uid: prefix + i, species, injuries: [], scars: [], powerDelta: 0 }));
    const s = E.createBattle({ seed: 'fate-reentry-ui',
        players: [{ name: 'You', team: mk(['zuckerborg', 'kardashiant', 'astrophysicat'], 'me-'), tactics: opts.mine || [] },
            { name: 'Dummy', team: mk(['lobstorian', 'astrophysicat', 'beastie'], 'opp-'), tactics: opts.theirs || [] }],
        axiomDeck: ['thrift', 'luxury', 'arrival', 'mercy'],
        options: { first: 0, shuffle: false, shuffleAxioms: false, spark: false, openHand: [0, 0], openAxioms: 0, timeline: true, fateStart: 6, fateGap: 3 } });
    const move = (cid, p, zone) => {
        ['deck', 'hand', 'board'].forEach(z => { s.players[p][z] = s.players[p][z].filter(x => x !== cid); });
        s.players[p][zone].push(cid); s.cards[cid].enteredTurn = -1;
    };
    move('p0c0', 0, 'board'); move('p0c1', 0, 'board'); move('p1c0', 1, 'board'); move('p1c1', 1, 'board');
    (opts.mine || []).forEach((_, i) => move('p0t' + i, 0, 'hand'));
    (opts.theirs || []).forEach((_, i) => move('p1t' + i, 1, 'hand'));
    s.players.forEach(P => { P.energy = P.capacity = 10; P.hearts = P.maxHearts = 30; });
    s.phase = 'main';
    const root = g.document.createElement('div');
    g.document.body.appendChild(root);
    const handle = screens.battle.mount(root, { mode: 'practice', seed: 'fate-reentry-ui', initialState: s,
        opponent: { name: 'Dummy', team: mk(['lobstorian'], 'opp-'), ai: 'normal' }, onEnd() {} });
    const $ = sel => root.querySelector(sel);
    const log = t => E.fullLog(handle.state).filter(e => e.t === t);
    return { g, Rift, E, root, handle, $, log };
}
const select = (t, cid) => t.$('.b-hand [data-cid="' + cid + '"]').click();
const playIt = (t, cid) => { select(t, cid); t.$('.b-prompt .btn.primary').click(); };
// My End turn, the opponent's turn, and my draw: one round further.
function nextRound(t) {
    t.$('.b-end').click();
    t.g.flush();
    const draw = t.$('.b-draw-btn[data-choice="deck"]');
    if (draw) draw.click();
    t.g.flush();
}

test('Leap Ahead over the rival\'s Clean Slate: an exact prompt, one leap, a reveal, and a marker that lists the skip', () => {
    for (const calm of [false, true]) {
        const t = mount({ calm, mine: ['leap-ahead'], theirs: ['clean-slate'], script: [{ type: 'play', cid: 'p1t0' }] });
        nextRound(t);                                      // the rival casts Clean Slate in round 1: due at the end of round 2
        assert.equal(t.E.fateSchedule(t.handle.state)[0].rounds, 1);
        t.$('.b-hand [data-cid="p0t0"]').dispatchEvent({ type: 'pointerenter', pointerType: 'mouse' });
        t.g.flush();
        assert.match(t.$('.b-inspect').textContent, /If you play it now: Fate leaps 2 rounds\. Skipped for good: Dummy's Clean Slate\./, 'the card\'s inspection says it');
        select(t, 'p0t0');
        assert.match(t.$('.b-prompt .b-fate-move').textContent, /Fate leaps 2 rounds\. Skipped for good: Dummy's Clean Slate\./, 'and the prompt');
        const button = t.$('.b-prompt .btn.primary');
        // A double click: the second reaches the engine with a card no longer in hand, and is refused.
        const errors = [], err = console.error;
        console.error = (...x) => errors.push(x.join(' '));
        try { button.click(); button.click(); } finally { console.error = err; }
        t.g.flush();
        assert.ok(errors.length <= 1 && errors.every(e => /Illegal action/.test(e)), 'the repeat is refused, nothing else goes wrong');
        assert.equal(t.log('fate-leap').length, 1, calm + ': one leap');
        assert.equal(t.log('fate-skip').length, 1);
        assert.match(t.$('.b-reveal').textContent, /You: Fate leaps 2 rounds!/);
        assert.match(t.$('.b-reveal').textContent, /Dummy's Clean Slate is skipped\. It will not happen\./);
        const marker = t.$('.b-fate .b-fpast.leap');
        assert.ok(marker, 'a leap marker on the reel');
        assert.match(marker.getAttribute('aria-label'), /You: Fate leapt 2 rounds closer\. Skipped for good \(it will not happen\): Dummy's Clean Slate\. Already|Fate leapt 2 rounds closer\. Skipped for good \(it will not happen\): Dummy's Clean Slate\./);
        assert.equal(t.root.querySelectorAll('.b-fate .b-fev.sched:not(.spent)').length, 0, 'no coming wipe on the reel');
        for (let n = 0; n < 3; n++) nextRound(t);
        assert.equal(t.log('fate-event').length, 0, 'the wipe never happens');
        assert.ok(t.handle.state.players[0].board.includes('p0c1'));
        t.handle.destroy();
    }
});

test('a skipped node that Fate comes back past is shown ahead, struck through, and says why', () => {
    const t = mount({ mine: ['leap-ahead', 'revisit', 'revisit'], theirs: ['clean-slate'], script: [{ type: 'play', cid: 'p1t0' }] });
    nextRound(t);
    playIt(t, 'p0t0');
    t.g.flush();
    playIt(t, 'p0t1'); t.g.flush();
    t.handle.state.players[0].playsThisTurn = 0;           // a third card this turn (the play limit is not what this tests)
    select(t, 'p0t2');                                     // a repaint that sees the new budget
    playIt(t, 'p0t2'); t.g.flush();                         // two rewinds: the skipped space is 1 round ahead again
    const node = t.$('.b-fate .b-fev.sched.spent.skipped[data-fate-event="f1"]');
    assert.ok(node, 'the skipped node is on the reel');
    assert.equal(node.parentNode.dataset.k, '1');
    assert.match(node.textContent, /Clean Slate · skipped/);
    assert.match(node.getAttribute('aria-label'), /Over · Dummy's Clean Slate was skipped by a leap\. It will not happen\./);
    nextRound(t);
    assert.equal(t.log('fate-event').length, 0);
    t.handle.destroy();
});

test('Echoing Encouragement: a repeatable node, a live space behind NOW, Revisit\'s preview, a second firing and the expiry', () => {
    for (const calm of [false, true]) {
        const t = mount({ calm, mine: ['echoing-encouragement', 'revisit'] });
        playIt(t, 'p0t0');
        t.g.flush();
        let node = t.$('.b-fate .b-fev.sched.repeat[data-fate-event="f1"]');
        assert.ok(node, 'a repeatable node');
        assert.equal(node.parentNode.dataset.k, '1');
        let label = node.getAttribute('aria-label');
        assert.match(label, /Upcoming · Your Echoing Encouragement at the end of this round, after Dummy's turn\./);
        assert.match(label, /Your creatures get \+1\/\+1 until it expires\./);
        assert.match(label, /If it happened now: your Zuckerborg gets \+1\/\+1, your Kim Kardashiant gets \+1\/\+1\./);
        assert.match(label, /Repeatable: it happens each time Fate lands here, until it expires at the end of round 3 \(3 rounds from now\)\. Moving Fate back never makes it last longer\./);
        nextRound(t);                                      // round 1 ends: first entry
        assert.equal(t.log('fate-event').length, 1);
        nextRound(t);                                      // round 2 ends: Fate moves past it
        node = t.$('.b-fate .b-fev.sched.repeat.behind[data-fate-event="f1"]');
        assert.ok(node, 'a live repeatable space stays on the reel behind NOW');
        assert.equal(node.parentNode.dataset.k, '-1');
        assert.match(node.textContent, /Echoing Encouragement · ×1/);
        assert.match(node.getAttribute('aria-label'), /Live · Your Echoing Encouragement is 1 round behind NOW\. If Fate lands on it again before it expires, it happens again\./);
        assert.match(node.getAttribute('aria-label'), /\(1 so far\), until it expires at the end of round 3 \(1 round from now\)/);
        select(t, 'p0t1');
        assert.match(t.$('.b-prompt .b-fate-move').textContent, /Fate moves 1 round further away and lands on your Echoing Encouragement: it happens again\./);
        t.$('.b-prompt .btn.primary').click(); t.$('.b-prompt .btn.primary') && t.$('.b-prompt .btn.primary').click();
        t.g.flush();
        const fires = t.log('fate-event');
        assert.deepEqual(JSON.parse(JSON.stringify(fires.map(e => [e.how, e.fires]))), [['walk', 1], ['rewind', 2]], calm + ': it fires again once');
        assert.match(t.$('.b-reveal').textContent, /Fate reaches your Echoing Encouragement again: your creatures get \+1\/\+1 until it expires\./);
        // The creature's inspection says how long the boosts last.
        t.$('.my-board [data-cid="p0c1"]').dispatchEvent({ type: 'pointerenter' });
        t.g.flush();
        const zuck = t.E.activeEffects(t.handle.state, 'p0c1');
        assert.equal(zuck.length, 4);
        const fx = t.root.querySelectorAll('.b-effect').map(n => n.textContent).join(' | ');
        assert.match(fx, /\+1 attack: Echoing Encouragement \(until its Fate space expires, at the end of round 3\)/);
        nextRound(t);                                      // round 3 ends: expiry
        assert.equal(t.log('fate-expire').length, 1);
        const expired = t.$('.b-fate .b-fpast.expired');
        assert.ok(expired, 'an expiry marker');
        assert.match(expired.getAttribute('aria-label'), /Your Echoing Encouragement expired\. Its boosts ended\./);
        assert.equal(t.E.attackOf(t.handle.state, 'p0c1'), t.Rift.data.creatures.kardashiant.attack, 'the boosts ended');
        assert.equal(t.$('.b-fate .b-fev.sched.repeat:not(.spent)'), null);
        t.handle.destroy();
    }
});

test('Revisit onto a spent one-shot says it will not happen again, and nothing does', () => {
    const t = mount({ mine: ['clean-slate', 'revisit'] });
    playIt(t, 'p0t0');
    nextRound(t); nextRound(t);                            // Clean Slate happens at the end of round 2
    assert.equal(t.log('fate-event').length, 1);
    nextRound(t);                                          // its space is 1 round behind NOW
    select(t, 'p0t1');
    assert.match(t.$('.b-prompt .b-fate-move').textContent, /Fate moves 1 round further away\. Your Clean Slate already happened there: it will not happen again\./);
    t.$('.b-prompt .btn.primary').click();
    t.g.flush();
    assert.equal(t.log('fate-event').length, 1, 'a one-shot never happens twice');
    t.handle.destroy();
});

test('Revisit at the cap explains why it cannot be played; a focused repeatable node keeps focus through a repaint', () => {
    const t = mount({ mine: ['revisit', 'echoing-encouragement'] });
    t.handle.state.fate.until = t.handle.state.options.fateMax;
    select(t, 'p0t0');
    assert.match(t.root.textContent, /Fate is already as far away as it can be \(6 rounds\)\./);
    t.$('.b-prompt .btn') && t.$('.b-prompt .btn').click();   // Cancel
    playIt(t, 'p0t1');
    t.g.flush();
    let node = t.$('.b-fate .b-fev.sched.repeat');
    node.focus();
    node.dispatchEvent({ type: 'keydown', key: 'Enter', preventDefault() {} });
    assert.match(t.$('.b-inspect').textContent, /Repeatable: it happens each time Fate lands here/);
    t.$('.b-hand [data-cid="p0t0"]').click();                // a repaint
    node = t.$('.b-fate .b-fev.sched.repeat');
    assert.equal(t.g.document.activeElement, node, 'focus survives the repaint');
    assert.ok(t.$('.b-inspect').classList.contains('show'));
    t.handle.destroy();
});
