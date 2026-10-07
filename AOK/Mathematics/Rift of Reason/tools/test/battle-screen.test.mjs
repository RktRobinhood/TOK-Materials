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
    // Only two draws by default (Fate time draws are off): your deck or a rule card.
    const drawButtons = t.root.querySelectorAll('.b-draw-btn');
    assert.equal(drawButtons.length, 2);
    assert.equal(drawButtons[0].getAttribute("aria-label"), "Draw from your deck");
    assert.equal(drawButtons[1].dataset.tip, "Take a rule card");
    const title = t.$(".b-draw-title");
    assert.equal(title.querySelector('strong').textContent, 'Choose');
    assert.equal(title.querySelector('span').textContent, 'one draw');
    // Each picture button has a short visible label under it.
    const labels = t.root.querySelectorAll('.b-draw-opt .b-draw-label');
    assert.equal(labels.length, 2);
    assert.match(labels[0].textContent, /^Your deck/);
    assert.match(labels[1].textContent, /^Rule card/);
    assert.ok(labels[1].querySelector('small'), 'the rule card label names the top card in a small line');
    assert.ok(!/Draw from your deck/.test(t.text()), "the long name is only in the tooltip");
    $('.b-draw-btn[data-choice="deck"]').click();
    assert.equal(t.handle.state.phase, 'main');
    assert.equal(t.handle.state.players[0].hand.length, 4);

    // Click a hand card, then Play.
    $('.b-hand [data-cid="p0c0"]').click();
    const play = $('.b-prompt .btn.primary');
    assert.match(play.textContent, /Play · 1/);
    play.click();
    assert.equal(t.handle.state.players[0].board.join(), 'p0c0');
    assert.match($('.my-board [data-cid="p0c0"] .bc-state.sleep').textContent, /Asleep/, 'a new creature shows it is asleep');
    assert.equal(t.handle.state.players[0].hand.length, 3);
    assert.match($('.b-hero-row.me .b-plays').title, /1 of 2 left/, 'one of two card plays used');

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
    // No text log: the newest move is the top tile of "Recent plays"; it holds what followed.
    assert.equal(t.root.querySelector('.b-log'), null);
    const recent = t.root.querySelectorAll('.b-arena .b-recent .b-recent-tile');
    assert.ok(recent.length >= 2 && recent.length <= 5, 'at most five recent plays');
    assert.ok(recent[0].classList.contains('newest') && recent[0].classList.contains('mine'));
    assert.match(recent[0].getAttribute('aria-label'), /You attack .*fights/);
    t.handle.destroy();
});

test('guide mode allows only the expected action and runs the replies', () => {
    const t = setup({}, { screen: 'battle-lesson' });
    const { $ } = t;
    assert.equal(t.handle.step, 0);
    assert.equal(t.spoken[0].speaker, 'granny');
    assert.equal(t.spoken[0].voice, t.Rift.voiceId('granny', t.Rift.Battle.Lesson.steps[0].text));
    assert.equal($('.b-draw-btn[data-choice="deck"]').getAttribute('aria-disabled'), null);
    assert.equal(t.root.querySelectorAll('.b-draw-btn').length, 2, 'no Fate time draws in the lesson');
    const ax = $('.b-draw-btn[data-choice="axiom"]');
    assert.equal(ax.getAttribute('aria-disabled'), 'true');
    assert.ok(ax.classList.contains('off'));
    assert.match(ax.dataset.tipDetail, /Not in this lesson step/);
    assert.ok($('.b-draw-btn[data-choice="deck"]').classList.contains('guide-focus'));
    ax.click();
    assert.equal(t.handle.state.phase, 'draw', 'a disabled choice does nothing');
    $('.b-draw-btn[data-choice="deck"]').click();
    assert.equal(t.handle.step, 1);

    // Astrophysicat is in the hand but not part of this step.
    $('.b-hand [data-cid="p0c1"]').click();
    assert.match($('.b-note').textContent, /gold pointer/);
    assert.equal($('.b-prompt .btn.primary'), null);
    assert.ok($('.b-hand [data-cid="p0c0"]').classList.contains('guide-focus'));
    $('.b-hand [data-cid="p0c0"]').click();
    $('.b-prompt .btn.primary').click();
    // A narration reply ({ say }) shows in Granny's panel; the step moves on after it.
    assert.equal(t.handle.busy, true);
    assert.equal(t.handle.step, 1);
    assert.match($('.b-coach-say').textContent, /asleep/);
    t.g.flush();
    assert.equal(t.handle.step, 2);
    assert.ok($('.b-end').classList.contains('guide-focus'));
    $('.b-end').click();
    assert.equal(t.handle.busy, true);
    t.g.flush();
    assert.equal(t.handle.busy, false);
    assert.equal(t.handle.step, 3);
    assert.equal(t.handle.state.active, 0, 'Granny drew and passed back');
    assert.equal(t.handle.state.players[1].board.length, 0);
    assert.match($('.b-coach').textContent, /Do this: Draw from your deck/);
    t.handle.destroy();
});

test('How to play pauses and closes with the screen; Leave lesson ends with outcome left', () => {
    const t = setup(practice);
    t.root.querySelectorAll('button').find(b => b.getAttribute('aria-label') === 'How to play').click();
    t.handle.destroy();
    assert.equal(t.helpClosed(), 1);
    let left = null;
    const g = setup({}, { screen: 'battle-lesson' });
    g.handle.destroy();
    const lesson = setup({ onEnd: won => { left = won; } }, { screen: 'battle-lesson' });
    lesson.root.querySelectorAll('button').find(b => b.getAttribute('aria-label') === 'Leave lesson').click();
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
    // Small cards show keyword chips and the ability's timing and name; the notes under the big
    // card hold the full text.
    const text = t.E.describe(t.handle.state, 'p0c0').lines[0].text.replace(/^(Entrance|Last Word|Activate \(\d+ energy\)):\s*/i, '');
    const full = text.charAt(0).toUpperCase() + text.slice(1);
    assert.ok(!card.textContent.includes(text) && !card.textContent.includes(full), 'the hand card is short');
    card.dispatchEvent({ type: 'pointerenter', pointerType: 'mouse' });
    t.g.flush();
    assert.ok($('.b-inspect').classList.contains('show'));
    assert.ok($('.b-inspect .bc.big'));
    assert.ok(!$('.b-inspect .bc.big').textContent.includes(full), 'the big card shows the brief too');
    assert.ok($('.b-inspect .b-notes .b-ability').textContent.includes(full), 'the notes have the full ability text');
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

const mouse = (extra) => Object.assign({ pointerType: 'mouse', pointerId: 1, clientX: 0, clientY: 0, button: 0, preventDefault() {} }, extra);

// Draw, play the first creature, pass, let the opponent play, draw again: both sides have a creature.
function toSecondTurn(t) {
    const { $ } = t;
    $('.b-draw-btn[data-choice="deck"]').click();
    $('.b-hand [data-cid="p0c0"]').click();
    $('.b-prompt .btn.primary').click();
    $('.b-end').click();
    t.g.flush();
    $('.b-draw-btn[data-choice="deck"]').click();
}

test('the big hover copy never takes over a board card: dragging still lights the real target', () => {
    const t = setup(practice);
    const { $ } = t;
    toSecondTurn(t);
    const enemy = $('.opp-board [data-cid="p1c0"]');
    enemy.dispatchEvent(mouse({ type: 'pointerenter' }));
    t.g.flush();
    assert.ok($('.b-inspect .bc.big[data-cid="p1c0"]'), 'the big preview of the enemy card is open');
    enemy.dispatchEvent(mouse({ type: 'pointerleave' }));
    // Drag my ready creature: the board card (not the hidden preview copy) gets the target glow.
    $('.my-board [data-cid="p0c0"]').dispatchEvent(mouse({ type: 'pointerdown' }));
    $('.b-arena').dispatchEvent(mouse({ type: 'pointermove', clientX: 60, clientY: 0 }));
    assert.ok($('.opp-board [data-cid="p1c0"]').classList.contains('valid-drag'));
    assert.equal(t.root.querySelectorAll('.b-inspect .valid-drag').length, 0);
    assert.match($('.b-prompt .b-ask').textContent, /Drop it on a glowing target to attack/);
    $('.b-arena').dispatchEvent(mouse({ type: 'pointercancel' }));
    assert.equal($('.opp-board [data-cid="p1c0"]').classList.contains('valid-drag'), false);
    t.handle.destroy();
});

test('pointing at a target with an attacker chosen shows the predicted fight', () => {
    const t = setup(practice);
    const { $ } = t;
    toSecondTurn(t);
    $('.my-board [data-cid="p0c0"]').click();
    $('.opp-board [data-cid="p1c0"]').dispatchEvent(mouse({ type: 'pointerenter' }));
    assert.match($('.opp-board [data-cid="p1c0"] .b-predict').textContent, /Takes 1.*Survives/);
    assert.match($('.my-board [data-cid="p0c0"] .b-predict').textContent, /Deals 1.*Takes 1.*Survives/);
    $('.b-hero[data-target="h1"]').dispatchEvent(mouse({ type: 'pointerenter' }));
    assert.match($('.b-hero[data-target="h1"] .b-predict').textContent, /−1 heart/);
    $('.b-hero[data-target="h1"]').dispatchEvent(mouse({ type: 'pointerleave' }));
    assert.equal(t.root.querySelectorAll('.b-predict').length, 0);
    t.handle.destroy();
});

test('a long opponent title stays out of Recent plays; story end screen, rule tiles and the Fate reel', () => {
    const t = setup(Object.assign({}, practice, {
        story: true,
        opponent: Object.assign({}, practice.opponent, { name: 'Sergeant Syllo · Road challenge', hearts: 1 }),
        battleOptions: Object.assign({}, practice.battleOptions, { timeline: true }),
    }));
    const { $ } = t;
    const pill = $('.b-hero-row.opp .b-hero-name');
    assert.equal(pill.textContent, 'Sergeant Syllo');
    assert.equal(pill.title, 'Sergeant Syllo · Road challenge');
    // The Fate track is a centred 7-space reel with NOW fixed in the middle and a short summary;
    // the old text line and pips are gone.
    assert.equal($('.b-fate-text'), null);
    assert.equal(t.root.querySelectorAll('.b-fate .pip').length, 0);
    assert.ok($('.b-lane .b-fate .b-fate-label'));
    assert.equal(t.root.querySelectorAll('.b-fate-track > .b-fate-reel > .b-fs').length, 7);
    assert.equal(t.root.querySelectorAll('.b-fate-reel .b-fs.now').length, 1);
    assert.ok($('.b-fate-track > .b-fate-now'));
    const turns = t.handle.state.fate.until;
    assert.match($('.b-fate-sum').textContent, new RegExp('^New rule in ' + turns + ' turns.+: .+ · '));
    assert.equal($('.b-fate-label').dataset.tip, 'Fate track');
    assert.match($('.b-fate-label').dataset.tipDetail, /Each End turn moves every event 1 space closer/);
    // The next event (further than 3 spaces) waits at the edge and says when; hovering it explains it.
    const far = $('.b-fev.flip');
    assert.ok(far.classList.contains('far'));
    assert.equal(far.querySelector('.b-fev-label').textContent, 'New rule · in ' + turns);
    assert.match(hover(t, '.b-fev.flip'), /top card of the shared rule deck/);
    far.dispatchEvent(mouse({ type: 'pointerleave' }));
    // "Rules in play": picture tiles for the core rules, all basic now; no keyword list in the panel.
    const tiles = t.root.querySelectorAll('section.b-rules .b-rtile');
    assert.deepEqual(tiles.map(x => x.dataset.cat), ['victory', 'combat', 'plays', 'attacks', 'energy']);
    assert.equal(t.root.querySelectorAll('.b-rtile.changed').length, 0);
    assert.match($('.b-rtile[data-cat="plays"]').textContent, /2 left/);
    assert.ok(!/Keywords/.test($('.b-side').textContent), 'the keywords are in How to play, not the panel');
    assert.equal($('.b-log'), null, 'no text log');
    toSecondTurn(t);
    const recent = t.root.querySelectorAll('.b-recent .b-recent-tile');
    assert.ok(recent.some(x => x.classList.contains('theirs')), 'the opponent\'s play is listed');
    recent.forEach(x => assert.ok(!/Road challenge/.test(x.getAttribute('aria-label')), 'Recent plays use the short name'));
    $('.my-board [data-cid="p0c0"]').click();
    $('.b-hero[data-target="h1"]').click();
    t.g.flush();
    assert.match($('.b-overlay').textContent, /Story challenge: nothing at stake\./);
    assert.ok(!/fate roll/i.test($('.b-overlay').textContent));
    t.handle.destroy();
});

test('practice end screen says nothing is at stake', () => {
    const t = setup(Object.assign({}, practice, { opponent: Object.assign({}, practice.opponent, { hearts: 1 }) }));
    toSecondTurn(t);
    t.$('.my-board [data-cid="p0c0"]').click();
    t.$('.b-hero[data-target="h1"]').click();
    t.g.flush();
    assert.match(t.$('.b-overlay').textContent, /Practice: nothing at stake\. Your creatures are safe\./);
    t.handle.destroy();
});

test('a creature dropped on the table waits for its Entrance target, and is not lost silently', () => {
    const eel = Object.assign({}, practice, { player: Object.assign({}, practice.player, { team: team(Array(8).fill('eelish'), 'me-') }) });
    const t = setup(eel);
    const { $, g } = t;
    $('.b-draw-btn[data-choice="deck"]').click();
    $('.b-end').click();
    g.flush();
    $('.b-draw-btn[data-choice="deck"]').click();
    assert.equal(t.handle.state.players[1].board.length, 1, 'the opponent has a creature to target');
    // Drag the Eelish from the hand and drop it on my (empty) side of the table.
    g.document.elementFromPoint = () => $('.my-board');
    $('.b-hand [data-cid="p0c0"]').dispatchEvent(mouse({ type: 'pointerdown' }));
    $('.b-arena').dispatchEvent(mouse({ type: 'pointermove', clientX: 0, clientY: -80 }));
    assert.match($('.b-prompt .b-ask').textContent, /Drop it on a glowing target/);
    $('.b-arena').dispatchEvent(mouse({ type: 'pointerup', clientX: 0, clientY: -80 }));
    assert.equal(t.handle.state.players[0].board.length, 0, 'not played yet');
    assert.ok($('.my-board .bc.pending'), 'a faint copy waits on the board');
    assert.match($('.b-prompt .b-ask').textContent, /Now click a glowing target for Billie Eelish's Entrance \(or Cancel\)/);
    // Doing something else first: the card stays in the hand and the screen says so.
    $('.b-end').click();
    assert.match($('.b-note').textContent, /Billie Eelish was not played/);
    t.handle.destroy();
});

test('card faces name the timing of each ability', () => {
    const mixed = Object.assign({}, practice, { player: Object.assign({}, practice.player, { team: team(['zuckerborg', 'eelish', 'astrophysicat', 'kardashiant'], 'me-') }), battleOptions: Object.assign({}, practice.battleOptions, { openHand: [4, 3], deckSize: 4 }) });
    const t = setup(mixed);
    const text = t.$('.b-hand').textContent;
    assert.match(text, /Last Word:Metaverse/);
    assert.match(text, /Entrance:Whisper/);
    assert.match(text, /Activate \(1⚡\):Well, Actually/);
    // Names are never cut short: long ones get a smaller type size instead.
    const kim = t.$('.b-hand [data-cid="p0c3"] .bc-name');
    assert.equal(kim.textContent, 'Kim Kardashiant');
    assert.ok(kim.classList.contains('long'));
    t.root.querySelectorAll('.bc-name').forEach(n => assert.ok(!/…|\.\.\.$/.test(n.textContent), n.textContent));
    t.handle.destroy();
});

test('board cards show keyword chips and the timing word only, and "Ready" on a creature that can act', () => {
    const t = prepared({ me: ['kardashiant', 'khaby'], opp: ['kardashiant'] }, (s, move) => { move('p0c0', 0, 'board'); move('p0c1', 0, 'board'); move('p1c0', 1, 'board'); });
    const kim = t.$('.my-board [data-cid="p0c0"]');
    assert.equal(kim.querySelector('.bc-ab-kind').textContent, 'Activate');
    assert.equal(kim.querySelector('.bc-ab-name'), null, 'no ability name on the table');
    assert.ok(t.$('.my-board [data-cid="p0c1"] .bc-kw'), 'keyword chip (Guard)');
    assert.equal(kim.querySelector('.b-ready-tag').textContent, 'Ready');
    assert.equal(t.$('.opp-board [data-cid="p1c0"] .b-ready-tag'), null, 'only my creatures');
    // Energy: the number in bold, the capacity after it; the card plays sit under it.
    const num = t.$('.b-hero-row.me .b-energy-num');
    assert.equal(num.querySelector('strong').textContent, '5');
    assert.equal(num.querySelector('span').textContent, '/5');
    assert.ok(t.$('.b-hero-row.me .b-energy .b-plays'));
    assert.equal(t.$('.b-hero-row.opp .b-plays'), null);
    t.handle.destroy();
});

test('their turn: a banner, their creature shown big first, and a recap when my turn starts', () => {
    const t = setup(practice);
    const { $, g } = t;
    $('.b-draw-btn[data-choice="deck"]').click();
    assert.equal($('.b-draw-recap'), null, 'no recap before the opponent has played');
    $('.b-end').click();
    assert.ok($('.b-banner').classList.contains('show') && $('.b-banner').classList.contains('theirs'));
    assert.match($('.b-banner').textContent, /^Dummy's turn/);
    assert.ok(g.timers.some(x => x.ms === 1250), 'the opponent waits a moment (AI_DELAY)');
    // Run timers one at a time until the opponent's creature is shown big.
    for (let i = 0; i < 20 && !$('.b-reveal').classList.contains('show'); i++) g.timers.shift().fn();
    assert.ok($('.b-reveal').classList.contains('show'));
    assert.equal($('.b-reveal .b-reveal-caption').textContent, 'Dummy plays a creature');
    assert.ok($('.b-reveal .bc.big'));
    assert.equal(t.handle.state.players[1].board.length, 0, 'shown first, played after');
    assert.ok(g.timers.some(x => x.ms === 1500), 'REVEAL 1500 ms');
    g.flush();
    assert.equal(t.handle.state.players[1].board.join(), 'p1c0');
    assert.equal(t.E.decider(t.handle.state), 0);
    assert.match($('.b-banner').textContent, /Your turn/);
    assert.match($('.b-draw .b-draw-recap').textContent, /^Dummy's turn: /);
    t.handle.destroy();
});

test('a rule change is shown big, and the opponent waits until it fades', () => {
    const t = prepared({ me: ['kardashiant'], opp: ['kardashiant'] }, s => { s.players[0].axHand = ['thrift']; });
    const { $, g } = t;
    $('.b-hand [data-axiom="thrift"]').click();
    $('.b-prompt .btn.primary').click();
    assert.equal(t.handle.state.axioms.active.cost, 'thrift');
    assert.ok($('.b-reveal').classList.contains('show') && $('.b-reveal').classList.contains('rule'));
    assert.equal($('.b-reveal .b-reveal-caption').textContent, 'You change a rule!');
    assert.match($('.b-reveal .b-reveal-what').textContent, /^Card costs: /);
    assert.ok(g.timers.some(x => x.ms === 2600), 'RULE_SHOW 2600 ms');
    assert.ok($('.b-rtile[data-cat="cost"]').classList.contains('changed'), 'the new rule has its tile');
    $('.b-end').click();
    assert.ok(!g.timers.some(x => x.ms === 1250), 'the opponent does not start while the rule is shown');
    g.flush();
    assert.equal(t.E.decider(t.handle.state), 0, 'then the opponent plays and passes back');
    t.handle.destroy();
});

// ---- round-2 playtest fixes ----

// A prepared match (engine state edited by hand), so one situation can be checked directly.
// cfg: { me: [species], opp: [species], myTactics?, myLoaned?, oppLoaned?, phase?, energy? }, then edit(s, move).
function prepared(cfg, edit) {
    const holder = setup(practice);
    const E = holder.E;
    holder.handle.destroy();
    const mk = (ids, prefix, loaner) => ids.map((species, i) => ({ uid: prefix + i, species, injuries: [], scars: [], powerDelta: 0, loaner: !!loaner }));
    const tactics = cfg.myTactics || [];
    const s = E.createBattle({
        seed: 'prepared',
        players: [{ name: 'You', team: mk(cfg.me, 'me-', cfg.myLoaned), tactics }, { name: 'Dummy', team: mk(cfg.opp, 'opp-', cfg.oppLoaned), tactics: [] }],
        axiomDeck: ['thrift', 'luxury', 'arrival', 'mercy'],
        options: { first: 0, shuffle: false, shuffleAxioms: false, spark: false, openHand: [0, 0], openAxioms: 0, deckSize: cfg.me.length + tactics.length, minCreatures: 1 },
    });
    const move = (cid, p, zone) => {
        const P = s.players[p];
        ['deck', 'hand', 'board'].forEach(z => { P[z] = P[z].filter(x => x !== cid); });
        P[zone].push(cid);
        if (zone === 'board') s.cards[cid].enteredTurn = -1;
    };
    s.phase = cfg.phase || 'main';
    s.players[0].energy = s.players[0].capacity = cfg.energy == null ? 5 : cfg.energy;
    edit(s, move);
    return setup(Object.assign({}, practice, { initialState: s }));
}
const hover = (t, sel) => { t.$(sel).dispatchEvent(mouse({ type: 'pointerenter' })); t.g.flush(); return t.$('.b-inspect').classList.contains('show') ? t.$('.b-inspect').textContent : ''; };

test('practice and story can be left after a confirm step; the lesson and risked matches have no Leave match', () => {
    const t = setup(practice);
    const btn = () => t.root.querySelectorAll('.b-side button').find(b => b.getAttribute('aria-label') === 'Leave match');
    assert.ok(btn(), 'practice has Leave match');
    btn().click();
    assert.ok(t.$('.b-overlay').classList.contains('show'));
    assert.match(t.$('.b-overlay').textContent, /Leave this match\?.*no win or loss is counted/);
    t.root.querySelectorAll('.b-overlay button').find(b => b.textContent === 'Keep playing').click();
    assert.equal(t.$('.b-overlay').classList.contains('show'), false);
    assert.equal(t.results.length, 0);
    t.$('.b-draw-btn[data-choice="deck"]').click();
    assert.equal(t.handle.state.phase, 'main', 'the match goes on after Keep playing');
    btn().click();
    t.root.querySelectorAll('.b-overlay button').find(b => b.textContent === 'Leave match').click();
    assert.equal(t.results.length, 1);
    assert.equal(t.results[0].outcome, 'left');
    assert.equal(t.results[0].fate, null);
    t.handle.destroy();
    const risky = setup(Object.assign({}, practice, { mode: 'trainer' }));
    assert.equal(risky.root.querySelectorAll('button').find(b => b.getAttribute('aria-label') === 'Leave match'), undefined, 'no Leave match when something is at stake');
    risky.handle.destroy();
    const lesson = setup({}, { screen: 'battle-lesson' });
    assert.equal(lesson.root.querySelectorAll('button').find(b => b.getAttribute('aria-label') === 'Leave match'), undefined);
    lesson.handle.destroy();
});

test('Fate draw buttons (only with timeDraws) show the new count in short words', () => {
    const plain = setup(Object.assign({}, practice, { battleOptions: Object.assign({}, practice.battleOptions, { timeline: true }) }));
    assert.equal(plain.$('.b-draw-btn[data-choice="forward"]'), null, 'no time draws by default');
    assert.equal(plain.$('.b-draw-btn[data-choice="rewind"]'), null);
    plain.handle.destroy();
    const t = setup(Object.assign({}, practice, { battleOptions: Object.assign({}, practice.battleOptions, { timeline: true, timeDraws: true }) }));
    assert.equal(t.root.querySelectorAll('.b-draw-btn').length, 4);
    const fwd = t.$('.b-draw-btn[data-choice="forward"]'), back = t.$('.b-draw-btn[data-choice="rewind"]');
    assert.equal(fwd.dataset.tip, 'Fate sooner');
    assert.equal(back.dataset.tip, 'Fate later');
    assert.equal(fwd.querySelector('.b-ibtn-badge').textContent, 'in 5', 'one space sooner');
    assert.equal(back.querySelector('.b-ibtn-badge').textContent, 'in 7', 'one space later');
    assert.match(fwd.dataset.tipDetail, /1 turn sooner\. Rule card in 5\./);
    assert.match(back.dataset.tipDetail, /1 turn later\. Rule card in 7\./);
    const labels = t.root.querySelectorAll('.b-draw-label').map(x => x.textContent);
    assert.ok(labels.includes('Fate sooner') && labels.includes('Fate later'), labels.join(', '));
    // Pointing at a time draw previews it on the Fate track.
    fwd.dispatchEvent(mouse({ type: 'pointerenter' }));
    assert.match(t.$('.b-fate-sum.preview').textContent, /in 5 turns/);
    fwd.dispatchEvent(mouse({ type: 'pointerleave' }));
    assert.equal(t.$('.b-fate-sum.preview'), null);
    fwd.click();
    assert.equal(t.handle.state.fate.until, 5);
    t.handle.destroy();
    const timeDraws = s => { s.options.timeDraws = true; };
    const r = prepared({ me: ['kardashiant'], opp: ['kardashiant'], phase: 'draw' }, s => { timeDraws(s); s.fate.events = 1; s.fate.until = 5; s.axioms.active = {}; });
    assert.match(r.$('.b-draw-btn[data-choice="forward"]').dataset.tipDetail, /Reset \(no change now\)\./);
    assert.match(r.$('.b-fate-sum').textContent, /^Reset in 5 turnsAll rules back to basic · /);
    r.handle.destroy();
    const c = prepared({ me: ['kardashiant'], opp: ['kardashiant'], phase: 'draw' }, s => { timeDraws(s); s.fate.events = 1; s.fate.until = 5; s.axioms.active = { cost: 'thrift' }; });
    assert.match(c.$('.b-draw-btn[data-choice="forward"]').dataset.tipDetail, /Reset in 4\./);
    assert.equal(c.$('.b-draw-btn[data-choice="forward"] .b-ibtn-badge').textContent, 'in 4');
    c.handle.destroy();
});

test('changed rules: gold "Changed" tiles beside the core tiles, and each tile shows its card', () => {
    const t = prepared({ me: ['kardashiant'], opp: ['kardashiant'] }, s => { s.axioms.active = { combat: 'underdog', cost: 'thrift', arrival: 'arrival', defeat: 'mercy' }; });
    assert.equal(t.root.querySelectorAll('.b-rule-chip').length, 0, 'no lane rule chips');
    const tiles = t.root.querySelectorAll('section.b-rules .b-rtile');
    assert.deepEqual(tiles.map(x => x.dataset.cat), ['victory', 'combat', 'plays', 'attacks', 'energy', 'cost', 'arrival', 'defeat']);
    const changed = t.root.querySelectorAll('.b-rtile.changed').map(x => x.dataset.cat);
    assert.deepEqual(changed, ['combat', 'cost', 'arrival', 'defeat']);
    t.root.querySelectorAll('.b-rtile.changed').forEach(x => assert.equal(x.querySelector('.b-rtile-new').textContent, 'Changed'));
    assert.match($rt(t, 'combat').textContent, new RegExp(t.Rift.data.axioms.underdog.short));
    assert.match(t.$('.b-rules-head').textContent, /4 changed/);
    for (const [cat, id] of [['combat', 'underdog'], ['cost', 'thrift'], ['arrival', 'arrival'], ['defeat', 'mercy']]) {
        const text = hover(t, '.b-rtile[data-cat="' + cat + '"]');
        assert.ok(text.includes(t.Rift.data.axioms[id].text), id + ': the full rule text is in the preview');
        t.$('.b-rtile[data-cat="' + cat + '"]').dispatchEvent(mouse({ type: 'pointerleave' }));
    }
    assert.match(hover(t, '.b-rtile[data-cat="victory"]'), /basic rule/);
    t.handle.destroy();
    // The plays tile counts the plays left (a changed plays rule shows the count instead of the tag).
    const r = prepared({ me: ['kardashiant', 'kardashiant'], opp: ['kardashiant'] }, (s, move) => { s.axioms.active = { plays: 'restraint' }; move('p0c0', 0, 'hand'); });
    assert.ok($rt(r, 'plays').classList.contains('changed'));
    assert.match($rt(r, 'plays').textContent, /1 left/);
    r.$('.b-hand [data-cid="p0c0"]').click();
    r.$('.b-prompt .btn.primary').click();
    assert.match($rt(r, 'plays').textContent, /0 left/);
    r.handle.destroy();
});
const $rt = (t, cat) => t.$('.b-rtile[data-cat="' + cat + '"]');

test('with a button in the bar, the news lines step aside', () => {
    const t = setup(practice);
    t.$('.b-draw-btn[data-choice="deck"]').click();
    t.$('.b-hand [data-cid="p0c0"]').click();
    assert.ok(t.$('.b-prompt').classList.contains('has-buttons'));
    assert.equal(t.$('.b-prompt .b-news'), null);
    t.handle.destroy();
});

test('Elusive: dropping a tactic on it explains why and leaves no waiting copy', () => {
    const t = prepared({ me: ['kardashiant'], opp: ['shakirattle'], myTactics: ['counterexample'] }, (s, move) => {
        move('p0c0', 0, 'board'); move('p1c0', 1, 'board'); move('p0t0', 0, 'hand');
    });
    const { g, $ } = t;
    g.document.elementFromPoint = () => $('.opp-board [data-cid="p1c0"]');
    $('.b-hand [data-cid="p0t0"]').dispatchEvent(mouse({ type: 'pointerdown' }));
    $('.b-arena').dispatchEvent(mouse({ type: 'pointermove', clientX: 0, clientY: -80 }));
    $('.b-arena').dispatchEvent(mouse({ type: 'pointerup', clientX: 0, clientY: -80 }));
    assert.match($('.b-note').textContent, /^Shakirattle is Elusive: tactics and abilities can't target it\.$/);
    assert.equal($('.bc.pending'), null, 'no ghost card');
    assert.ok(t.handle.state.players[0].hand.includes('p0t0'));
    // Click-click says the same.
    $('.b-hand [data-cid="p0t0"]').click();
    $('.opp-board [data-cid="p1c0"]').click();
    assert.match($('.b-note').textContent, /Elusive/);
    t.handle.destroy();
});

test('only your own loaned cards are tagged Loaned', () => {
    const t = prepared({ me: ['kardashiant'], opp: ['kardashiant'], myLoaned: true, oppLoaned: true }, (s, move) => { move('p0c0', 0, 'board'); move('p1c0', 1, 'board'); });
    assert.match(hover(t, '.my-board [data-cid="p0c0"]'), /Loaned/);
    assert.ok(!/Loaned/.test(hover(t, '.opp-board [data-cid="p1c0"]')));
    t.handle.destroy();
});

test('a lectured creature: "on its next turn" until its own turn, then "this turn"', () => {
    const t = prepared({ me: ['kardashiant'], opp: ['kardashiant', 'kardashiant'] }, (s, move) => {
        move('p0c0', 0, 'board'); move('p1c0', 1, 'board'); move('p1c1', 1, 'board');
        s.cards.p0c0.frozen = true; s.cards.p1c0.frozen = true; s.cards.p1c1.silenced = true;
    });
    // On the table: a word over the picture ("Lectured", "No ability"); no small state icon.
    assert.equal(t.$('.opp-board [data-cid="p1c0"] .bc-state.frozen').textContent.replace(/^❄/, ''), 'Lectured');
    assert.equal(t.$('.opp-board [data-cid="p1c0"] .state.frozen'), null);
    assert.equal(t.$('.opp-board [data-cid="p1c1"] .bc-state.silenced').textContent, 'No ability');
    assert.match(hover(t, '.my-board [data-cid="p0c0"]'), /can't attack this turn/);
    t.$('.my-board [data-cid="p0c0"]').dispatchEvent(mouse({ type: 'pointerleave' }));
    assert.match(hover(t, '.opp-board [data-cid="p1c0"]'), /can't attack on its next turn/);
    // The big card keeps the small state icon, its title says when.
    assert.equal(t.$('.b-inspect .bc.big .state.frozen').title, "It can't attack on its next turn");
    t.handle.destroy();
});

test('Haste: a creature that may attack again shows "2nd attack"', () => {
    const t = prepared({ me: ['kardashiant'], opp: ['kardashiant'] }, (s, move) => {
        move('p0c0', 0, 'board'); move('p1c0', 1, 'board');
        s.axioms.active = { attacks: 'haste' };
        s.cards.p0c0.attacks = 1; s.players[0].attacksThisTurn = 1;
    });
    assert.ok(t.$('.my-board [data-cid="p0c0"]').classList.contains('ready'));
    assert.equal(t.$('.my-board [data-cid="p0c0"] .b-again').textContent, '2nd attack');
    assert.match(hover(t, '.my-board [data-cid="p0c0"]'), /attack twice this turn/);
    t.handle.destroy();
});

test('the Spark hint replaces "Nothing left to do" when +1 energy makes a card playable', () => {
    const t = prepared({ me: ['astrophysicat'], opp: ['kardashiant'], energy: 1 }, (s, move) => { move('p0c0', 0, 'hand'); s.players[0].spark = true; });
    assert.equal(t.$('.b-prompt .b-ask').textContent, 'Use the Spark (+1 energy) to play Astrophysicat?');
    assert.ok(t.$('.b-spark').classList.contains('glow'));
    assert.equal(t.$('.b-end').classList.contains('glow'), false);
    assert.ok(t.$('.b-hand [data-cid="p0c0"]').classList.contains('unplayable'), 'a card you cannot play now is dimmed');
    t.$('.b-spark').click();
    assert.ok(t.$('.b-hand [data-cid="p0c0"]').classList.contains('playable'));
    t.handle.destroy();
});

test('a rule card that would change nothing is dimmed and says "Already the rule"', () => {
    const t = prepared({ me: ['kardashiant'], opp: ['kardashiant'] }, s => { s.players[0].axHand = ['normal-hearts']; });
    const card = t.$('.b-hand [data-axiom="normal-hearts"]');
    assert.ok(card.classList.contains('unplayable'));
    assert.match(card.textContent, /Already the rule/);
    card.click();
    assert.match(t.$('.b-note').textContent, /^Already the rule/);
    t.handle.destroy();
});

test('hover previews wait, close on pointerdown and stay shut after a drag until the mouse moves', () => {
    const t = setup(practice);
    const { $, g } = t;
    $('.b-draw-btn[data-choice="deck"]').click();
    $('.b-hand [data-cid="p0c1"]').dispatchEvent(mouse({ type: 'pointerenter' }));
    assert.equal($('.b-inspect').classList.contains('show'), false, 'not at once');
    assert.ok(g.timers.some(x => x.ms >= 200 && x.ms <= 230), 'a short hover delay (about 220 ms)');
    g.flush();
    assert.ok($('.b-inspect').classList.contains('show'));
    $('.b-hand [data-cid="p0c1"]').dispatchEvent(mouse({ type: 'pointerdown' }));
    assert.equal($('.b-inspect').classList.contains('show'), false, 'pressing closes it');
    $('.b-arena').dispatchEvent(mouse({ type: 'pointerup' }));
    // Drag p0c0 onto my side; the mouse then rests on a card.
    g.document.elementFromPoint = () => $('.my-board');
    $('.b-hand [data-cid="p0c0"]').dispatchEvent(mouse({ type: 'pointerdown' }));
    $('.b-arena').dispatchEvent(mouse({ type: 'pointermove', clientX: 0, clientY: -80 }));
    $('.b-arena').dispatchEvent(mouse({ type: 'pointerup', clientX: 0, clientY: -80 }));
    assert.equal(t.handle.state.players[0].board.join(), 'p0c0');
    $('.b-hand [data-cid="p0c1"]').dispatchEvent(mouse({ type: 'pointerenter', clientX: 0, clientY: -80 }));
    g.flush();
    assert.equal($('.b-inspect').classList.contains('show'), false, 'no preview right after a drag');
    $('.b-hand [data-cid="p0c1"]').dispatchEvent(mouse({ type: 'pointermove', clientX: 30, clientY: -80 }));
    g.flush();
    assert.ok($('.b-inspect').classList.contains('show'), 'moving the mouse opens it again');
    t.handle.destroy();
});

test('picture buttons: each has a name (aria-label) and a tooltip, and no native title', () => {
    const t = setup(practice);
    const names = t.root.querySelectorAll('.b-ibtn').map(b => b.getAttribute('aria-label'));
    for (const n of ['Draw from your deck', 'Take a rule card', 'How to play', 'Leave match', 'Close', 'Rules & log']) assert.ok(names.includes(n), n);
    assert.ok(!names.includes('Fate sooner') && !names.includes('Fate later'), 'no time draws by default');
    t.root.querySelectorAll('.b-ibtn').forEach(b => {
        assert.ok(b.dataset.tip, b.getAttribute('aria-label') + ' has tooltip text');
        assert.equal(b.title, '', b.getAttribute('aria-label') + ' has no native title');
        assert.ok(b.querySelector('.b-ctrl-icon') || b.querySelector('.b-spark-icon') || b.querySelector('.b-bag-icon'), b.getAttribute('aria-label') + ' shows an icon');
    });
    // The tooltip name of each draw button is exactly its name; the detail says what it does.
    assert.equal(t.$('.b-draw-btn[data-choice="axiom"]').dataset.tip, 'Take a rule card');
    // The rule card draw names the card on top of the shared deck (the one Fate would turn over).
    const top = t.Rift.data.axioms[t.handle.state.axioms.deck[0]];
    assert.ok(t.$('.b-draw-btn[data-choice="axiom"]').dataset.tipDetail.startsWith('A rule card for your hand. You take ' + top.name + ': '));
    assert.equal(t.$('.b-draw-btn[data-choice="deck"] .b-ibtn-badge').textContent, String(t.handle.state.players[0].deck.length));
    // End turn: a two-word face and a name that says whose turn it is.
    const end = () => t.$('.b-end');
    assert.equal(end().dataset.tip, 'End turn');
    assert.equal(end().getAttribute('aria-label'), 'End turn');
    assert.deepEqual(end().querySelectorAll('span').map(s => s.textContent), ['End', 'turn']);
    t.$('.b-draw-btn[data-choice="deck"]').click();
    end().click();
    assert.equal(end().getAttribute('aria-label'), 'Their turn');
    assert.deepEqual(end().querySelectorAll('span').map(s => s.textContent), ['Their', 'turn']);
    assert.ok(end().disabled);
    t.handle.destroy();
});

test('the tooltip shows on keyboard focus and hides on Escape; hover waits a moment; a long-press keeps it', () => {
    const t = setup(practice);
    const { $, g } = t;
    const tip = $('.b-tip');
    assert.equal(tip.getAttribute('role'), 'tooltip');
    assert.ok(!tip.classList.contains('show'));
    const deck = $('.b-draw-btn[data-choice="deck"]');
    deck.dispatchEvent({ type: 'focus' });
    assert.ok(tip.classList.contains('show'), 'focus shows it at once');
    assert.equal(tip.querySelector('.b-tip-name').textContent, 'Draw from your deck');
    assert.match(tip.querySelector('.b-tip-detail').textContent, /A creature or tactic card\. \d+ cards left\./);
    assert.equal(deck.getAttribute('aria-describedby'), tip.id);
    deck.dispatchEvent({ type: 'keydown', key: 'Escape' });
    assert.ok(!tip.classList.contains('show'), 'Escape hides it');
    assert.equal(deck.getAttribute('aria-describedby'), null);

    // Mouse: after a short rest; leaving hides it.
    const help = t.root.querySelectorAll('.b-ibtn').find(b => b.getAttribute('aria-label') === 'How to play');
    help.dispatchEvent(mouse({ type: 'pointerenter' }));
    assert.ok(!tip.classList.contains('show'), 'not at once under the mouse');
    g.flush();
    assert.ok(tip.classList.contains('show'));
    assert.equal(tip.querySelector('.b-tip-name').textContent, 'How to play');
    help.dispatchEvent(mouse({ type: 'pointerleave' }));
    assert.ok(!tip.classList.contains('show'));

    // Touch: a long-press shows it and does not press the button; the next tap hides it.
    const touch = extra => mouse(Object.assign({ pointerType: 'touch', pointerId: 7 }, extra));
    const axiom = $('.b-draw-btn[data-choice="axiom"]');
    axiom.dispatchEvent(touch({ type: 'pointerdown' }));
    g.flush();
    assert.ok(tip.classList.contains('show'));
    assert.equal(tip.querySelector('.b-tip-name').textContent, 'Take a rule card');
    axiom.dispatchEvent(touch({ type: 'pointerup' }));
    axiom.click();
    assert.equal(t.handle.state.phase, 'draw', 'the long-press only read the name');
    assert.ok(tip.classList.contains('show'), 'it stays after the finger lifts');
    g.flush();
    $('.b-lane').dispatchEvent(touch({ type: 'pointerdown' }));
    assert.ok(!tip.classList.contains('show'), 'the next tap hides it');
    g.flush();

    // A click hides it and does the action.
    deck.dispatchEvent({ type: 'focus' });
    assert.ok(tip.classList.contains('show'));
    deck.click();
    assert.ok(!tip.classList.contains('show'));
    assert.equal(t.handle.state.phase, 'main');
    t.handle.destroy();
});

test('a dim draw button says why in its tooltip (hand full)', () => {
    const t = prepared({ me: Array(12).fill('kardashiant'), opp: ['kardashiant'], phase: 'draw' }, s => {
        const P = s.players[0];
        while (P.hand.length + P.axHand.length < s.options.handLimit) P.hand.push(P.deck.shift());
    });
    const deck = t.$('.b-draw-btn[data-choice="deck"]');
    assert.equal(deck.getAttribute('aria-disabled'), 'true');
    assert.ok(deck.classList.contains('off'));
    assert.match(deck.dataset.tipDetail, /Your hand is full\./);
    deck.click();
    assert.equal(t.handle.state.phase, 'draw');
    assert.ok(t.$('.b-tip').classList.contains('show'), 'clicking a dim button shows why');
    assert.match(t.$('.b-tip').textContent, /Your hand is full/);
    t.handle.destroy();
});
