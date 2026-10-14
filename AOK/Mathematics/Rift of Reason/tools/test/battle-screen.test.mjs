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
    if (opts && opts.before) opts.before(g);
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

test('concealed opponent arming never displays the normal card reveal', () => {
    const t = setup(Object.assign({}, practice, { player: { team: team(Array(8).fill('astrophysicat'),'me-'), tactics: [] } }), { before(g) {
        const c = g.Rift.data.creatures.kardashiant; c.cost = 1;
        c.conditional = { visibility: 'face-down', options: [{ key: 'attack', event: 'attack-declared', actor: 'opponent', label: 'Opponent attacks' }] };
    } });
    t.$('.b-draw-btn[data-choice="deck"]').click(); t.$('.b-end').click(); t.g.flush();
    assert.equal(t.handle.state.players[1].armed.length, 1);
    assert.ok(!t.$('.b-reveal').classList.contains('show'));
    assert.ok(!t.$('.b-reveal').textContent.includes('Kim Kardashiant'));
    assert.match(t.$('.opp-board .b-conditions').textContent, /Concealed 1/);
    assert.ok(!t.$('.opp-board .b-conditions').textContent.includes('Kim Kardashiant'));
    t.handle.destroy();
});

test('arming controls use the normal play budget and expose a readable condition rail', () => {
    const t = setup(practice, { before(g) {
        const c = g.Rift.data.creatures.kardashiant; c.cost = 1;
        c.conditional = { visibility: 'face-up', options: [{ key: 'attack', event: 'attack-declared', actor: 'opponent', label: 'Opponent attacks' }] };
    } });
    t.$('.b-draw-btn[data-choice="deck"]').click(); t.$('.b-hand [data-cid="p0c0"]').click();
    assert.match(t.$('.b-prompt .btn.primary').textContent, /Arm/);t.$('.b-prompt .btn.primary').click();
    assert.equal(t.handle.state.players[0].energy,0);assert.equal(t.handle.state.players[0].playsThisTurn,1);
    assert.match(t.$('.my-board .b-conditions').textContent, /Kim Kardashiant/);
    assert.match(t.$('.my-board .b-condition').getAttribute('aria-label'),/Opponent attacks/);
    t.handle.destroy();
});

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
    const t = setup({ full: true }, { screen: 'battle-lesson' });
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
    // Fate counts full rounds: you go first, so each round ends after the opponent's turn.
    const rounds = t.handle.state.fate.until;
    assert.equal(rounds, 3);
    assert.equal($('.b-fate-label span').textContent, 'rounds');
    assert.match($('.b-fate-sum').textContent, new RegExp('^Upcoming · New rule in ' + rounds + ' roundsNot active yet: .+ · after their turn$'));
    assert.equal($('.b-fate-label').dataset.tip, 'Fate track');
    assert.match($('.b-fate-label').dataset.tipDetail, /One space is one round. After both players have had a turn, every event moves 1 space closer/);
    // The flip sits on the round it starts; its card is set aside, so hovering names it for certain.
    const flip = $('.b-fev.flip');
    assert.ok(!flip.classList.contains('far'));
    assert.equal(flip.parentNode.dataset.k, String(rounds));
    const kept = t.Rift.data.axioms[t.handle.state.fate.next];
    flip.click();   // (the fake DOM bubbles pointerenter into the round's own tooltip, so click)
    assert.match(t.$('.b-inspect').textContent, new RegExp(kept.name + '.*Fate has set this card aside'));
    flip.dispatchEvent(mouse({ type: 'pointerleave' }));
    // The next event further than 3 rounds (the reset) waits at the edge and says when.
    const far = $('.b-fev.reset');
    assert.ok(far.classList.contains('far'));
    assert.equal(far.querySelector('.b-fev-label').textContent, 'Reset · in ' + (rounds + t.handle.state.options.fateGap));
    // "Axioms": picture tiles for the core rules, all basic now; no keyword list in the panel.
    assert.equal($('.b-rules').getAttribute('aria-label'), 'Axioms');
    assert.equal($('.b-rules-head strong').textContent, 'Axioms');
    assert.match($('.b-rules').textContent, /Axioms are the rules both players start from\./);
    assert.match($('.b-rules-head').textContent, /Active now/);
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
    // Guard on the table is a shield badge under the card, not a text chip.
    assert.ok(t.$('.my-board [data-cid="p0c1"] .bc-guard'), 'Guard shield badge');
    assert.equal(t.$('.my-board [data-cid="p0c1"] .bc-kw'), null, 'no Guard text chip on the table');
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

test('a ready Astrophysicat describes both attack and activation, and either action works', () => {
    for (const choice of ['attack', 'activate']) {
        const t = prepared({ me: ['astrophysicat', 'kardashiant'], opp: ['kardashiant'] }, (s, move) => move('p0c0', 0, 'board'));
        t.$('.my-board [data-cid="p0c0"]').click();
        assert.match(t.$('.b-ask').textContent, /drag to attack, or choose an ability beside its card/);
        assert.match(t.$('.b-ask').textContent, /Activating uses its attack this turn/);
        assert.ok(t.$('.b-hero[data-target="h1"]').classList.contains('valid'));
        const hp = t.handle.state.players[1].hearts;
        if (choice === 'attack') {
            t.$('.b-hero[data-target="h1"]').click();
            assert.equal(t.handle.state.players[1].hearts, hp - 1);
            assert.equal(t.handle.state.cards.p0c0.attacks, 1);
        } else {
            t.$('.b-card-actions .btn.gold').click();
            assert.equal(t.handle.state.players[0].hand.length, 1);
            assert.equal(t.handle.state.cards.p0c0.activated, true);
        }
        t.handle.destroy();
    }
});
const hover = (t, sel) => { t.$(sel).dispatchEvent(mouse({ type: 'pointerenter' })); t.g.flush(); return t.$('.b-inspect').classList.contains('show') ? t.$('.b-inspect').textContent : ''; };

test('a creature-local tray lists multiple gained abilities and resolves a chosen target exactly once', () => {
    const t = prepared({ me: ['lens-lizard', 'paper-dragon', 'cloud-calf'], opp: ['kardashiant'], energy: 3 }, (s, move) => {
        move('p0c0', 0, 'board'); move('p0c1', 0, 'board');
        s.cards.p0c1.damage = 1; s.cards.p0c0.gained = ['well-actually', 'comma-pause'];
    });
    t.$('.my-board [data-cid="p0c0"]').dispatchEvent({ type: 'click', detail: 0 });
    assert.equal(t.g.document.activeElement, t.$('.b-card-actions [data-ability="lens-check"]'));
    const tray = t.$('.b-card-actions');
    assert.equal(tray.hidden, false); assert.match(tray.getAttribute('aria-label'), /Abilities for Lens Lizard/);
    assert.equal(tray.querySelectorAll('[data-ability]').length, 3);
    assert.equal(t.$('.b-prompt .btn.gold'), null, 'the middle bar has no activation menu');
    assert(!tray.parentNode.closest('button'), 'ability buttons are outside the card button');
    t.$('.b-card-actions [data-ability="comma-pause"]').dispatchEvent({ type: 'click', detail: 0 });
    assert.equal(t.handle.state.players[0].energy, 3, 'selecting a targeted ability does not pay yet');
    assert(t.$('.my-board [data-cid="p0c1"]').classList.contains('valid'));
    assert(!t.$('.my-board [data-cid="p0c0"]').classList.contains('valid'));
    assert.equal(t.g.document.activeElement, t.$('.my-board [data-cid="p0c1"]'), 'keyboard ability focuses a legal target');
    t.$('.my-board [data-cid="p0c1"]').dispatchEvent({ type: 'click', detail: 0 });
    assert.equal(t.handle.state.cards.p0c1.damage, 0);
    assert.equal(t.handle.state.players[0].energy, 2); assert.equal(t.handle.state.cards.p0c0.activated, true);
    assert.equal(t.$('.b-card-actions').hidden, true);
    assert.equal(t.g.document.activeElement, t.$('.my-board [data-cid="p0c0"]'), 'keyboard resolution returns to its source');
    t.$('.my-board [data-cid="p0c0"]').dispatchEvent({ type: 'click', detail: 0 });
    assert.equal(t.g.document.activeElement, t.$('.b-card-actions-close'), 'all-disabled tray keeps keyboard focus');
    assert(t.root.querySelectorAll('.b-card-actions [data-ability]').every(b => b.disabled));
    assert.match(t.$('.b-card-actions').textContent, /used its ability this turn/);
    t.$('.b-card-actions-close').click();
    assert.equal(t.$('.b-card-actions').hidden, true);
    assert.equal(t.g.document.activeElement, t.$('.my-board [data-cid="p0c0"]'));
    t.handle.destroy();
});

test('keyboard immediate abilities focus a pending choice or their rebuilt source', () => {
    for (const species of ['lens-lizard', 'pocket-tortoise']) {
        const t = prepared({ me: [species, 'paper-dragon', 'cloud-calf'], opp: ['kardashiant'] }, (s, move) => move('p0c0', 0, 'board'));
        t.$('.my-board [data-cid="p0c0"]').dispatchEvent({ type: 'click', detail: 0 });
        t.$('.b-card-actions [data-ability]').dispatchEvent({ type: 'click', detail: 0 });
        const next = species === 'lens-lizard' ? t.$('.b-choice button') : t.$('.my-board [data-cid="p0c0"]');
        assert.ok(t.g.document.activeElement === next, species + ': focus stays on the next interaction');
        assert.equal(t.handle.state.cards.p0c0.activated, true);
        t.handle.destroy();
    }
});

test('ability tray exposes actual costs and explains insufficient energy and an empty effect', () => {
    const t = prepared({ me: ['lens-lizard', 'paper-dragon'], opp: ['kardashiant'], energy: 0 }, (s, move) => { move('p0c0', 0, 'board'); s.axioms.active.abilities = 'silence'; });
    t.$('.my-board [data-cid="p0c0"]').click();
    assert(t.$('.b-card-actions [data-ability="lens-check"]').disabled);
    assert.match(t.$('.b-card-actions').textContent, /Needs 2 energy/);
    t.handle.destroy();
    const empty = prepared({ me: ['pocket-tortoise'], opp: ['kardashiant'] }, (s, move) => move('p0c0', 0, 'board'));
    empty.$('.my-board [data-cid="p0c0"]').click();
    assert(empty.$('.b-card-actions [data-ability="old-pocket"]').disabled);
    assert.match(empty.$('.b-card-actions').textContent, /No useful target or effect/);
    empty.handle.destroy();
});

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
    assert.equal(fwd.querySelector('.b-ibtn-badge').textContent, 'in 2', 'one round sooner');
    assert.equal(back.querySelector('.b-ibtn-badge').textContent, 'in 4', 'one round later');
    assert.match(fwd.dataset.tipDetail, /1 round sooner\. Rule card in 2 rounds\./);
    assert.match(back.dataset.tipDetail, /1 round later\. Rule card in 4 rounds\./);
    const labels = t.root.querySelectorAll('.b-draw-label').map(x => x.textContent);
    assert.ok(labels.includes('Fate sooner') && labels.includes('Fate later'), labels.join(', '));
    // Pointing at a time draw previews it on the Fate track.
    fwd.dispatchEvent(mouse({ type: 'pointerenter' }));
    assert.match(t.$('.b-fate-sum.preview').textContent, /in 2 rounds/);
    fwd.dispatchEvent(mouse({ type: 'pointerleave' }));
    assert.equal(t.$('.b-fate-sum.preview'), null);
    fwd.click();
    assert.equal(t.handle.state.fate.until, 2);
    t.handle.destroy();
    const timeDraws = s => { s.options.timeDraws = true; };
    const r = prepared({ me: ['kardashiant'], opp: ['kardashiant'], phase: 'draw' }, s => { timeDraws(s); s.fate.events = 1; s.fate.until = 5; s.axioms.active = {}; });
    assert.match(r.$('.b-draw-btn[data-choice="forward"]').dataset.tipDetail, /Reset \(no change now\)\./);
    assert.match(r.$('.b-fate-sum').textContent, /^Upcoming · Reset in 5 roundsNot active yet: all rules will return to basic · after their turn$/);
    r.handle.destroy();
    const c = prepared({ me: ['kardashiant'], opp: ['kardashiant'], phase: 'draw' }, s => { timeDraws(s); s.fate.events = 1; s.fate.until = 5; s.axioms.active = { cost: 'thrift' }; });
    assert.match(c.$('.b-draw-btn[data-choice="forward"]').dataset.tipDetail, /Reset in 4 rounds\./);
    assert.equal(c.$('.b-draw-btn[data-choice="forward"] .b-ibtn-badge').textContent, 'in 4');
    c.handle.destroy();
});

test('Fate inspection explains timing in rounds and the set-aside flip, which a shared draw cannot replace', () => {
    const t = prepared({ me: ['kardashiant'], opp: ['kardashiant'], phase: 'draw' }, s => {
        s.fate.until = 2;
        s.fate.next = 'thrift';
        s.axioms.deck = ['luxury', 'arrival'];
    });
    let marker = t.$('.b-fev.flip');
    marker.focus();
    marker.dispatchEvent({ type: 'keydown', key: 'Enter', preventDefault() {} });
    assert.match(t.$('.b-inspect').textContent, /Free flip in 2 rounds, at the end of round 2, after Dummy's turn/);
    assert.match(marker.getAttribute('aria-label'), /Fate has set this card aside: no draw can take it/);
    assert.match(t.$('.b-inspect').textContent, /It replaces:/);
    assert.match(t.$('.b-inspect').textContent, new RegExp(t.Rift.data.axioms.thrift.name));
    // The rule card draw takes the deck's top card (Luxury), never the set-aside flip.
    assert.match(t.$('.b-draw-btn[data-choice="axiom"]').dataset.tipDetail, new RegExp('You take ' + t.Rift.data.axioms.luxury.name));
    t.$('.b-draw-btn[data-choice="axiom"]').click();
    assert.deepEqual([...t.handle.state.players[0].axHand], ['luxury']);
    marker = t.$('.b-fev.flip');
    assert.equal(t.g.document.activeElement, marker, 'focused event survives a repaint');
    assert.ok(t.$('.b-inspect').classList.contains('show'));
    assert.match(t.$('.b-inspect').textContent, new RegExp(t.Rift.data.axioms.thrift.name), 'still the announced card');
    assert.ok(!t.$('.b-fate-sum').classList.contains('bent'), 'nothing about Fate changed');
    const until = t.handle.state.fate.until;
    marker.dispatchEvent({ type: 'keydown', key: ' ', preventDefault() {} });
    marker.click();
    assert.equal(t.handle.state.fate.until, until, 'inspection never moves Fate');
    t.handle.destroy();
});

test('Fate inspection distinguishes reset, a flip still waiting for a card and empty piles', () => {
    // The shared deck is finite (#117): rule cards in the discard never come back for Fate.
    for (const [events, deck, discard, pattern] of [
        [1, [], [], /Reset at the end of this round, after Dummy's turn.*All axioms return to the basic rules/],
        [0, ['thrift', 'luxury'], [], /No rule card is set aside yet\. Fate sets one aside from the shared deck when the next turn starts/],
        [0, [], ['thrift', 'luxury'], /No rule card is left to flip.*Current axioms stay in play/],
        [0, [], [], /No rule card is left to flip.*Current axioms stay in play/],
    ]) {
        const t = prepared({ me: ['kardashiant'], opp: ['kardashiant'] }, s => {
            s.fate.until = 1; s.fate.events = events; s.fate.next = null; s.axioms.deck = deck; s.axioms.discard = discard;
        });
        const marker = t.$('.b-fev');
        marker.click();
        assert.match(t.$('.b-inspect').textContent, pattern);
        assert.match(marker.getAttribute('aria-label'), pattern);
        t.handle.destroy();
    }
});

test('exhaustion: the draw controls and both hero rows show the coming heart loss and its cause (#117)', () => {
    const exhausted = (hearts, reversed) => prepared({ me: ['kardashiant', 'kardashiant'], opp: ['kardashiant', 'kardashiant'], phase: 'draw' }, (s, move) => {
        move('p0c0', 0, 'board'); move('p1c0', 1, 'board');
        s.players.forEach(P => { P.discard.push(...P.deck.splice(0)); });
        s.axioms.discard.push(...s.axioms.deck.splice(0)); s.fate.next = null;
        s.players[0].exhaustion = 1;
        s.players[0].hearts = hearts;
        if (reversed) s.axioms.active = { victory: 'reverse-hearts' };
    });
    const t = exhausted(10);
    const warn = t.$('.b-draw-warn');
    assert.ok(warn, 'a warning on the draw controls');
    assert.equal(warn.textContent, 'Both decks empty: −2 ❤');
    assert.equal(warn.getAttribute('aria-label'), 'Exhaustion: both decks are empty. You lose 2 hearts now.');
    const rows = t.root.querySelectorAll('.b-exhaust').map(n => n.textContent);
    assert.deepEqual(rows.sort(), ['Empty: −1 ❤', 'Empty: −2 ❤'], 'both hero rows show their next exhaustion');
    assert.match(t.root.querySelectorAll('.b-exhaust').map(n => n.getAttribute('aria-label')).join(' '), /Dummy's deck and the rule deck are empty\. Dummy loses 1 heart at their next draw/);
    const go = t.root.querySelectorAll('.b-draw button').find(b => /Continue: lose 2 hearts/.test(b.textContent));
    assert.ok(go, 'the continue button names the cost');
    go.click();
    assert.equal(t.handle.state.players[0].hearts, 8);
    assert.equal(t.handle.state.players[0].exhaustion, 2);
    t.handle.destroy();
    // Reversed Win rule: the same loss reaches zero and wins, and the warning says so.
    assert.equal(t.Rift.data.axioms['reverse-hearts'].category, 'victory');
    const r = exhausted(2, true);
    assert.ok(r.$('.b-draw-warn').classList.contains('wins'));
    assert.equal(r.$('.b-draw-warn').textContent, 'Both decks empty: −2 ❤, you win');
    assert.match(r.$('.b-draw-warn').getAttribute('aria-label'), /You lose 2 hearts now\. Reversed Win rule: that reaches zero and wins!/);
    r.handle.destroy();
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
    assert.match(hover(t, '.b-rtile[data-cat="victory"]'), /basic axiom/);
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
    for (const n of ['Draw from your deck', 'Take a rule card', 'How to play', 'Leave match', 'Close', 'Axioms & log']) assert.ok(names.includes(n), n);
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

test('the Fate reel slides one space per round, step by step, and a repaint mid-slide carries on from where it was', () => {
    const anims = [];
    let clock = 1000;
    const t = setup(practice, { before(g) {
        g.ctx.performance = { now: () => clock };
        Object.getPrototypeOf(g.document.createElement('div')).animate = function (frames, timing) {
            const a = { el: this, frames, timing, currentTime: null };
            anims.push(a);
            return a;
        };
    } });
    const reelAnims = () => anims.filter(a => a.el.classList.contains('b-fate-reel'));
    assert.equal(reelAnims().length, 0, 'no slide on the first paint');
    t.$('.b-draw-btn[data-choice="deck"]').click();
    assert.equal(reelAnims().length, 0, 'no slide while the turn is the same');
    t.$('.b-end').click();
    assert.equal(reelAnims().length, 0, 'the first player\'s End turn does not move Fate');
    // The opponent's End turn closes the round: Fate moves once and the reel slides one space.
    for (let n = 0; n < 60 && t.g.timers.length && t.handle.state.round === 1; n++) t.g.timers.shift().fn();
    assert.equal(t.handle.state.round, 2);
    assert.equal(t.handle.state.fate.until, 2, 'exactly one advance for the round');
    const first = reelAnims()[0];
    assert.ok(first, 'the round end slides the reel');
    assert.equal(first.timing.duration, 700, 'one space, slow enough to follow');
    assert.equal(first.currentTime, 0);
    assert.match(first.frames[0].transform, /^translateX\(14\.28\d*%\)$/, 'it starts one space to the right');
    assert.equal(first.frames.at(-1).transform, 'translateX(0%)');
    assert.equal(first.frames[0].easing, 'ease-in-out');
    // Something happens 300 ms in: the screen repaints, and the new reel picks up the same slide.
    clock += 300;
    const before = reelAnims().length;
    const reel = t.$('.b-fate-reel');
    for (let n = 0; n < 20 && t.g.timers.length && t.$('.b-fate-reel') === reel; n++) t.g.timers.shift().fn();
    if (t.$('.b-fate-reel') === reel) t.$('.b-draw-btn[data-choice="deck"]').click();
    assert.notEqual(t.$('.b-fate-reel'), reel, 'the screen repainted the reel');
    const later = reelAnims().slice(before);
    assert.ok(later.length, 'the repainted reel is animated too');
    assert.ok(later.every(a => a.timing.duration === 700 && a.currentTime === 300), 'it carries on, not from the start');
    t.handle.destroy();
});

test('Fate wording follows the round for either first player; Calm motion steps the reel, and a slide cut short by the next round carries on', () => {
    for (const first of [0, 1]) {
        const t = setup(Object.assign({}, practice, { battleOptions: Object.assign({}, practice.battleOptions, { timeline: true, first }) }));
        t.g.flush();
        assert.equal(t.handle.state.active, 0, 'my turn');
        assert.equal(t.$('.b-fs.now').dataset.tip, 'Round ' + t.handle.state.round);
        assert.match(t.$('.b-fs.now').dataset.tipDetail, first === 0 ? /your turn, then Dummy's/ : /Dummy's turn, then yours/);
        t.$('.b-draw-btn[data-choice="deck"]').click();
        // Going first, my End turn does not move Fate; going second, it closes the round.
        assert.match(t.$('.b-end').dataset.tipDetail, first === 0 ? /Fate moves after Dummy's turn\./ : /The round ends: the Fate track moves 1 space\./);
        assert.match(t.$('.b-fate-sum').textContent, first === 0 ? /after their turn$/ : /after your turn$/);
        const until = t.handle.state.fate.until;
        t.$('.b-end').click();
        assert.equal(t.handle.state.fate.until, first === 0 ? until : until - 1);
        t.handle.destroy();
    }
    const anims = [];
    let clock = 1000;
    const t = setup(practice, { calm: true, before(g) {
        g.ctx.performance = { now: () => clock };
        Object.getPrototypeOf(g.document.createElement('div')).animate = function (frames, timing) {
            const a = { el: this, frames, timing, currentTime: null };
            anims.push(a);
            return a;
        };
    } });
    const reelAnims = () => anims.filter(a => a.el.classList.contains('b-fate-reel'));
    const round = () => {
        const r = t.handle.state.round;
        t.$('.b-draw-btn[data-choice="deck"]').click();
        t.$('.b-end').click();
        for (let n = 0; n < 60 && t.g.timers.length && t.handle.state.round === r; n++) t.g.timers.shift().fn();
        assert.equal(t.handle.state.round, r + 1);
    };
    round();
    const first = reelAnims().at(-1);
    assert.equal(first.frames[0].easing, 'steps(1, end)', 'Calm motion: a step, no slide');
    // The next round ends 300 ms later, before the first slide is over: one longer slide picks up both.
    clock += 300;
    round();
    const both = reelAnims().at(-1);
    assert.equal(both.timing.duration, 2 * 700, 'the space still to go and the new one');
    assert.equal(both.currentTime, 0);
    t.handle.destroy();
});
