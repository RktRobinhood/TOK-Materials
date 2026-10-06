import test from 'node:test';
import assert from 'node:assert/strict';
import { loadWithDom } from './fake-dom.mjs';

const CORE = ['js/core/rift.js', 'js/core/assets.js', 'data/creatures.js', 'data/axioms.js', 'data/tactics.js',
    'js/battle/abilities.js', 'js/battle/engine.js', 'js/battle/lesson.js'];

function setup(params, opts) {
    const screens = {};
    const g = loadWithDom(CORE.concat([ctx => { ctx.Rift.Screens = { register: (n, d) => { screens[n] = d; }, get: n => screens[n] }; }, 'js/screens/battle.js', 'js/screens/battle-lesson.js']));
    const { Rift } = g;
    Rift.data.speakers = { granny: { name: 'Granny Axiom', art: 'npc/granny-axiom' } };
    // A tiny scripted opponent so this test does not depend on the AI's choices.
    Rift.Battle.AI = { choose(s) {
        const L = Rift.Battle.Engine.legalActions(s);
        return L.find(a => a.type === 'draw' && a.choice === 'deck') || L.find(a => a.type === 'play' && !a.target) || L.find(a => a.type === 'end') || L[0];
    } };
    const spoken = [];
    Rift.Audio = { speak: l => spoken.push(l), stopVoice() {}, sfx() {} };
    let helpClosed = 0;
    Rift.Battles = { rules: onClose => ({ close() { helpClosed++; onClose(); } }) };
    if (opts && opts.calm) g.document.body.classList.add('calm-motion');
    const root = g.document.createElement('div');
    g.document.body.appendChild(root);
    const results = [];
    const name = (opts && opts.screen) || 'battle';
    const handle = screens[name].mount(root, Object.assign({ onEnd: r => results.push(r) }, params));
    const $ = sel => root.querySelector(sel);
    const text = () => root.textContent;
    return { g, Rift, E: Rift.Battle.Engine, root, handle, $, text, results, spoken, helpClosed: () => helpClosed };
}

const team = (ids, prefix) => ids.map((species, i) => ({ uid: prefix + i, species, injuries: [], scars: [], powerDelta: 0 }));
const practice = {
    mode: 'practice', seed: 'screen-test',
    player: { team: team(Array(8).fill('kardashiant'), 'me-'), tactics: [], axioms: [] },
    opponent: { name: 'Dummy', team: team(Array(8).fill('kardashiant'), 'opp-'), tactics: [], ai: 'easy' },
    axiomDeck: ['thrift', 'luxury', 'arrival', 'mercy'],
    battleOptions: { first: 0, shuffle: false, shuffleAxioms: false, spark: false, openHand: [3, 3], deckSize: 8, minCreatures: 1 },
};

test('click-click: draw, play with the Play button, end turn, then attack a creature', () => {
    const t = setup(practice);
    const { E, $ } = t;
    assert.equal(t.handle.state.phase, 'draw');
    const drawButtons = t.root.querySelectorAll('.b-draw-btn');
    assert.equal(drawButtons.length, 4);
    assert.match(t.text(), /Draw from your deck/);
    assert.match(t.text(), /Take an axiom card/);
    assert.match(t.text(), /Fate 2 closer/);
    assert.match(t.text(), /Fate 2 away/);
    $('.b-draw-btn[data-choice="deck"]').click();
    assert.equal(t.handle.state.phase, 'main');
    assert.equal(t.handle.state.players[0].hand.length, 4);

    // Click a hand card, then Play.
    $('.b-hand [data-cid="p0c0"]').click();
    const play = $('.b-prompt .btn.primary');
    assert.match(play.textContent, /Play · 1/);
    play.click();
    assert.equal(t.handle.state.players[0].board.join(), 'p0c0');
    assert.match($('.my-board [data-cid="p0c0"]').textContent, /Zzz/, 'a new creature shows it is asleep');

    // Clicking the sleeping creature explains why it can't attack.
    $('.my-board [data-cid="p0c0"]').click();
    assert.match($('.b-note').textContent, /asleep/);

    // Energy crystals: 0 of 1.
    assert.match($('.b-hero-row.me .b-energy-num').textContent, /0\/1/);

    $('.b-end').click();
    t.g.flush();
    assert.equal(E.decider(t.handle.state), 0, 'the opponent has played and passed back');
    assert.equal(t.handle.state.players[1].board.join(), 'p1c0');
    $('.b-draw-btn[data-choice="deck"]').click();

    // Click attacker, then the glowing target.
    $('.my-board [data-cid="p0c0"]').click();
    assert.ok($('.my-board [data-cid="p0c0"]').classList.contains('selected'));
    assert.ok($('.opp-board [data-cid="p1c0"]').classList.contains('valid'));
    assert.ok($('.b-hero[data-target="h1"]').classList.contains('valid'));
    $('.opp-board [data-cid="p1c0"]').click();
    const s = t.handle.state;
    assert.equal(s.cards.p0c0.damage, 1);
    assert.equal(s.cards.p1c0.damage, 1);
    assert.ok($('.opp-board [data-cid="p1c0"] .bc-gem.health').classList.contains('hurt'), 'damaged health shows in red');
    assert.match(t.root.querySelector('.b-log').textContent, /fights/);
    t.handle.destroy();
});

test('guide mode allows only the expected action and runs the replies', () => {
    const t = setup({}, { screen: 'battle-lesson' });
    const { $ } = t;
    assert.equal(t.handle.step, 0);
    assert.equal(t.spoken[0].speaker, 'granny');
    assert.equal(t.spoken[0].voice, t.Rift.voiceId('granny', t.Rift.Battle.Lesson.steps[0].text));
    assert.equal($('.b-draw-btn[data-choice="deck"]').disabled, false);
    for (const c of ['axiom', 'forward', 'rewind']) assert.equal($('.b-draw-btn[data-choice="' + c + '"]').disabled, true, c);
    assert.ok($('.b-draw-btn[data-choice="deck"]').classList.contains('guide-focus'));
    $('.b-draw-btn[data-choice="forward"]').click();
    assert.equal(t.handle.state.phase, 'draw', 'a disabled choice does nothing');
    $('.b-draw-btn[data-choice="deck"]').click();
    assert.equal(t.handle.step, 1);

    // Astrophysicat is affordable later but not part of this step.
    $('.b-hand [data-cid="p0c1"]').click();
    assert.match($('.b-note').textContent, /gold pointer/);
    assert.equal($('.b-prompt .btn.primary'), null);
    assert.ok($('.b-hand [data-cid="p0c0"]').classList.contains('guide-focus'));
    $('.b-hand [data-cid="p0c0"]').click();
    $('.b-prompt .btn.primary').click();
    assert.equal(t.handle.step, 2);
    assert.ok($('.b-end').classList.contains('guide-focus'));
    $('.b-end').click();
    assert.equal(t.handle.busy, true);
    assert.equal(t.handle.state.active, 1, 'the reply waits for a pause');
    t.g.flush();
    assert.equal(t.handle.busy, false);
    assert.equal(t.handle.step, 3);
    assert.equal(t.handle.state.players[1].board.join(), 'p1c0');
    assert.match($('.b-coach').textContent, /Attack a creature/);
    t.handle.destroy();
});

test('How to play pauses and closes with the screen; Leave lesson ends with outcome left', () => {
    const t = setup(practice);
    t.root.querySelectorAll('button').find(b => b.textContent === 'How to play').click();
    t.handle.destroy();
    assert.equal(t.helpClosed(), 1);
    let left = null;
    const g = setup({}, { screen: 'battle-lesson' });
    g.handle.destroy();
    const lesson = setup({ onEnd: won => { left = won; } }, { screen: 'battle-lesson' });
    lesson.root.querySelectorAll('button').find(b => b.textContent === 'Leave lesson').click();
    assert.equal(left, false);
});

test('the draw choice is docked in the centre lane and "Your turn" shows at turn start', () => {
    const t = setup(practice);
    const { $ } = t;
    assert.ok($('.b-lane .b-draw.show'), 'the draw buttons sit in the lane, not over the boards');
    assert.ok($('.b-lane').classList.contains('drawing'));
    assert.ok($('.b-banner').classList.contains('show'));
    assert.match($('.b-banner').textContent, /Your turn/);
    $('.b-draw-btn[data-choice="deck"]').click();
    assert.equal($('.b-lane .b-draw.show'), null);
    assert.equal($('.b-lane').classList.contains('drawing'), false);
    t.handle.destroy();
});

test('hand and board cards show a big preview with the full text on hover and long-press', () => {
    const t = setup(practice);
    const { $ } = t;
    $('.b-draw-btn[data-choice="deck"]').click();
    const card = $('.b-hand [data-cid="p0c0"]');
    // Small cards show keyword chips and the ability name; the preview shows the full text.
    const text = t.E.describe(t.handle.state, 'p0c0').lines[0].text.replace(/^(Entrance|Last Word|Activate \(\d+ energy\)):\s*/i, '');
    card.dispatchEvent({ type: 'pointerenter', pointerType: 'mouse' });
    t.g.flush();
    assert.ok($('.b-inspect').classList.contains('show'));
    assert.ok($('.b-inspect .bc.big'));
    assert.ok($('.b-inspect').textContent.includes(text), 'the preview has the full ability text');
    card.dispatchEvent({ type: 'pointerleave', pointerType: 'mouse' });
    assert.equal($('.b-inspect').classList.contains('show'), false);

    // Touch: press and hold shows it; releasing hides it and does not select the card.
    card.dispatchEvent({ type: 'pointerdown', pointerType: 'touch', pointerId: 7, clientX: 0, clientY: 0, button: 0, preventDefault() {} });
    t.g.flush();
    assert.ok($('.b-inspect').classList.contains('show'));
    card.dispatchEvent({ type: 'pointerup', pointerType: 'touch', pointerId: 7, clientX: 0, clientY: 0 });
    assert.equal($('.b-inspect').classList.contains('show'), false);
    t.handle.destroy();
});

test('calm motion: damage numbers still appear (they only fade)', () => {
    const t = setup(practice, { calm: true });
    const { $ } = t;
    $('.b-draw-btn[data-choice="deck"]').click();
    $('.b-hand [data-cid="p0c0"]').click();
    $('.b-prompt .btn.primary').click();
    $('.b-end').click();
    t.g.flush();
    $('.b-draw-btn[data-choice="deck"]').click();
    $('.my-board [data-cid="p0c0"]').click();
    $('.opp-board [data-cid="p1c0"]').click();
    assert.equal(t.handle.state.cards.p1c0.damage, 1);
    assert.ok(t.root.querySelectorAll('.b-float').length >= 2, 'damage numbers are shown');
    t.handle.destroy();
});
