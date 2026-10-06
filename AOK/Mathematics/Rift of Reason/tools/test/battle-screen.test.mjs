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

test('a long opponent title stays out of the log; story end screen, keywords, Fate wording and log scroll', () => {
    const t = setup(Object.assign({}, practice, {
        story: true,
        opponent: Object.assign({}, practice.opponent, { name: 'Sergeant Syllo · Road challenge', hearts: 1 }),
        battleOptions: Object.assign({}, practice.battleOptions, { timeline: true }),
    }));
    const { $ } = t;
    const pill = $('.b-hero-row.opp .b-hero-name');
    assert.equal(pill.textContent, 'Sergeant Syllo');
    assert.equal(pill.title, 'Sergeant Syllo · Road challenge');
    // The lane says it short; the tooltip and Rules now have the long explanation.
    assert.match($('.b-fate-text').textContent, /^In \d+ turns: new rule \(.+\)\.$/);
    assert.match($('.b-fate').title, /the top card of the shared deck/);
    assert.match($('.b-rules').textContent, /the top card of the shared deck/);
    assert.match($('.b-rules').textContent, /Keywords.*Guard.*Swift.*Shield.*Elusive.*Spark.*Entrance.*Last Word.*Activate/);
    toSecondTurn(t);
    assert.ok(!/Road challenge/.test($('.b-log').textContent), 'the log uses the short name');
    assert.equal($('.b-log').scrollTop, $('.b-log').scrollHeight, 'the log keeps the newest entry in view');
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
    const btn = () => t.root.querySelectorAll('button').find(b => b.textContent === 'Leave match' && !b.closest('.b-overlay'));
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
    assert.ok(!risky.root.querySelectorAll('button').some(b => b.textContent === 'Leave match'), 'no Leave match when something is at stake');
    risky.handle.destroy();
    const lesson = setup({}, { screen: 'battle-lesson' });
    assert.ok(!lesson.root.querySelectorAll('button').some(b => b.textContent === 'Leave match'));
    lesson.handle.destroy();
});

test('Fate draw buttons show the new count in short words', () => {
    const t = setup(Object.assign({}, practice, { battleOptions: Object.assign({}, practice.battleOptions, { timeline: true }) }));
    assert.equal(t.$('.b-draw-btn[data-choice="forward"] small').textContent, 'Rule card in 4');
    assert.equal(t.$('.b-draw-btn[data-choice="rewind"] small').textContent, 'Rule card in 8');
    assert.match(t.$('.b-draw-btn[data-choice="forward"]').title, /Now: In 6 turns/);
    t.handle.destroy();
    const r = prepared({ me: ['kardashiant'], opp: ['kardashiant'], phase: 'draw' }, s => { s.fate.events = 1; s.fate.until = 5; s.axioms.active = {}; });
    assert.equal(r.$('.b-draw-btn[data-choice="forward"] small').textContent, 'Reset (no change now)');
    assert.match(r.$('.b-fate-text').textContent, /no change now/);
    r.handle.destroy();
    const c = prepared({ me: ['kardashiant'], opp: ['kardashiant'], phase: 'draw' }, s => { s.fate.events = 1; s.fate.until = 5; s.axioms.active = { cost: 'thrift' }; });
    assert.equal(c.$('.b-draw-btn[data-choice="forward"] small').textContent, 'Reset in 3');
    c.handle.destroy();
});

test('four or more changed rules: two chips and "+N more", whose preview lists them all', () => {
    const t = prepared({ me: ['kardashiant'], opp: ['kardashiant'] }, s => { s.axioms.active = { combat: 'underdog', cost: 'thrift', arrival: 'arrival', defeat: 'mercy' }; });
    const chips = t.root.querySelectorAll('.b-lane-rules .b-rule-chip');
    assert.equal(chips.length, 3);
    assert.equal(chips[2].textContent, '+2 more');
    const text = hover(t, '.b-rule-chip.more');
    for (const id of ['underdog', 'thrift', 'arrival', 'mercy']) assert.ok(text.includes(t.Rift.data.axioms[id].name), id);
    t.handle.destroy();
});

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
    const t = prepared({ me: ['kardashiant'], opp: ['kardashiant'] }, (s, move) => {
        move('p0c0', 0, 'board'); move('p1c0', 1, 'board');
        s.cards.p0c0.frozen = true; s.cards.p1c0.frozen = true;
    });
    assert.match(hover(t, '.my-board [data-cid="p0c0"]'), /can't attack this turn/);
    assert.match(hover(t, '.opp-board [data-cid="p1c0"]'), /can't attack on its next turn/);
    assert.equal(t.$('.opp-board [data-cid="p1c0"] .state.frozen').title, "It can't attack on its next turn");
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
    assert.ok(g.timers.some(x => x.ms >= 350 && x.ms <= 400), 'a hover delay of about 350-400 ms');
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
