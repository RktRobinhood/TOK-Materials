// In-game battle animation (#66): every committed event gets one presentation-only cue, Calm
// motion and OS reduced motion only fade, nothing loops, and everything is cancelled cleanly.
// Never pass a fake-DOM node to assert.equal/deepEqual: assert booleans or strings instead.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { loadWithDom } from './fake-dom.mjs';

const CORE = ['js/core/rift.js', 'js/core/assets.js', 'data/creatures.js', 'data/axioms.js', 'data/tactics.js',
    'js/battle/abilities.js', 'js/battle/engine.js', 'js/battle/lesson.js'];

// Fake layout: the arena is the page; the hand is low, my board above it, theirs near the top.
function rectFor(node) {
    const inside = cls => { for (let n = node; n; n = n.parentNode) if (n.classList && n.classList.contains(cls)) return true; return false; };
    if (node.classList && node.classList.contains('b-arena')) return { left: 0, top: 0, width: 1000, height: 800 };
    const w = { width: 100, height: 140 };
    if (inside('b-hand')) return { left: 700, top: 640, ...w };
    if (inside('b-opp-hand')) return { left: 450, top: 0, width: 200, height: 60 };
    if (inside('my-board')) return { left: node.dataset && node.dataset.cid === 'p0c1' ? 360 : 240, top: 420, ...w };
    if (inside('opp-board')) return { left: 240, top: 180, ...w };
    if (inside('b-hero-row')) return { left: 20, top: inside('me') ? 650 : 20, width: 90, height: 90 };
    if (inside('b-table-decks')) return { left: 900, top: 500, width: 60, height: 80 };
    return { left: 0, top: 0, width: 0, height: 0 };
}

function setup(params, opts) {
    const o = opts || {};
    const screens = {};
    const motions = [];
    const g = loadWithDom(CORE.concat([ctx => { ctx.Rift.Screens = { register: (n, d) => { screens[n] = d; }, get: n => screens[n] }; }, 'js/screens/battle.js']));
    const { Rift } = g;
    Rift.Battle.AI = { choose(s) { const L = Rift.Battle.Engine.legalActions(s); return L.find(a => a.type === 'end') || L[0]; } };
    Rift.Audio = { speak() {}, stopVoice() {}, sfx() {}, has: () => false };
    Rift.Battles = { rules: onClose => ({ close() { onClose(); } }) };
    if (o.calm) g.document.body.classList.add('calm-motion');
    if (o.reduced) g.ctx.matchMedia = () => ({ matches: true });
    if (o.before) o.before(g);
    const proto = Object.getPrototypeOf(g.document.createElement('div'));
    proto.getBoundingClientRect = function () { return rectFor(this); };
    proto.animate = function (frames, options) {
        const motion = { node: this, frames, options, cancel() { this.cancelled = true; } };
        motions.push(motion);
        return motion;
    };
    const listeners = {};
    g.ctx.addEventListener = (type, fn) => { (listeners[type] = listeners[type] || []).push(fn); };
    g.ctx.removeEventListener = (type, fn) => { listeners[type] = (listeners[type] || []).filter(x => x !== fn); };
    const root = g.document.createElement('div');
    g.document.body.appendChild(root);
    const results = [];
    const handle = screens.battle.mount(root, Object.assign({ onEnd: r => results.push(r) }, params));
    const $ = sel => root.querySelector(sel);
    const $$ = sel => root.querySelectorAll(sel);
    return { g, Rift, E: Rift.Battle.Engine, root, handle, $, $$, motions, results, fire: type => (listeners[type] || []).slice().forEach(fn => fn({ type })) };
}

const practice = { mode: 'practice', seed: 'anim', opponent: { name: 'Dummy' } };
function prepared(cfg, edit, opts) {
    const holder = setup(Object.assign({}, practice, { player: { team: [{ uid: 'x', species: 'beastie' }], tactics: [], axioms: [] } }));
    const E = holder.E;
    holder.handle.destroy();
    const mk = (ids, prefix) => ids.map((species, i) => ({ uid: prefix + i, species, injuries: [], scars: [], powerDelta: 0 }));
    const tactics = cfg.myTactics || [];
    const s = E.createBattle({
        seed: 'prepared',
        players: [{ name: 'You', team: mk(cfg.me, 'me-'), tactics }, { name: 'Dummy', team: mk(cfg.opp, 'opp-'), tactics: [] }],
        axiomDeck: ['thrift', 'luxury', 'arrival', 'mercy'],
        options: { first: 0, shuffle: false, shuffleAxioms: false, spark: false, openHand: [0, 0], openAxioms: 0, deckSize: cfg.me.length + tactics.length, minCreatures: 1 },
    });
    const move = (cid, p, zone) => {
        const P = s.players[p];
        ['deck', 'hand', 'board'].forEach(z => { P[z] = P[z].filter(x => x !== cid); });
        P[zone].push(cid);
        if (zone === 'board') s.cards[cid].enteredTurn = -1;
    };
    s.phase = 'main';
    s.players[0].energy = s.players[0].capacity = cfg.energy == null ? 6 : cfg.energy;
    edit(s, move);
    return setup(Object.assign({}, practice, { initialState: s }), opts);
}
// Run the presentation timers the latest action queued (event beats and the change cues after
// them), once each, but not the clean-up timers those beats add.
function runBeats(t) {
    const due = t.g.timers.filter(x => x.ms <= 800).sort((a, b) => a.ms - b.ms);
    due.forEach(timer => { const at = t.g.timers.indexOf(timer); if (at >= 0) { t.g.timers.splice(at, 1); timer.fn(); } });
}
// Selecting a hand card asks "Play X for n energy?"; its primary button plays it.
const playButton = t => t.$$('button.primary').find(b => /^(Play|Arm) ·/.test(b.textContent));
const moving = m => m.frames.some(f => f.transform || f.translate || f.scale || f.rotate || f.filter);
const fx = (t, kind) => t.$$('.b-fx[data-fx="' + kind + '"]').length;

test('a played creature flies from the hand to its place and lands with a ring in its colour', () => {
    const t = prepared({ me: ['beastie'], opp: ['keanu'] }, (s, move) => { move('p0c0', 0, 'hand'); });
    const committedBefore = JSON.stringify(t.handle.state);
    t.$('.b-hand [data-cid="p0c0"]').click();
    playButton(t).click();
    assert.ok(t.handle.state.players[0].board.includes('p0c0'), 'the play is committed before any animation');
    const committed = JSON.stringify(t.handle.state);
    assert.notEqual(committed, committedBefore);
    runBeats(t);
    const ghost = t.$('.b-motion-ghost[data-event="play"]');
    assert.ok(ghost, 'a copy flies over the real card');
    assert.equal(ghost.getAttribute('aria-hidden'), 'true');
    const flight = t.motions.find(m => m.node === ghost);
    // From the hand (700,640) to the board (240,420): the first frame is offset by the difference.
    assert.equal(flight.frames[0].transform, 'translate(460px,220px) scale(1)');
    assert.equal(flight.frames.at(-1).transform, 'translate(0,0) scale(1)');
    assert.ok(flight.options.duration <= 800, 'short');
    const real = t.$('.my-board [data-cid="p0c0"]');
    assert.ok(t.motions.some(m => m.node === real && m.frames[0].opacity === 0), 'the real card waits under the flight');
    assert.ok(!real.classList.contains('entered'), 'the old scale-in does not play twice');
    assert.equal(fx(t, 'ring'), 1);
    assert.equal(t.$('.b-fx[data-fx="ring"]').dataset.colour, 'memory');
    assert.equal(JSON.stringify(t.handle.state), committed, 'presentation never changes the battle');
    t.handle.destroy();
});

test('Calm motion and reduced motion: the arrival only fades in, with no flight or scale', () => {
    for (const opts of [{ calm: true }, { reduced: true }]) {
        const t = prepared({ me: ['beastie'], opp: ['keanu'] }, (s, move) => { move('p0c0', 0, 'hand'); }, opts);
        t.$('.b-hand [data-cid="p0c0"]').click(); playButton(t).click();
        runBeats(t);
        assert.ok(t.handle.state.players[0].board.includes('p0c0'));
        assert.ok(!t.$('.b-motion-ghost'), 'no flight copy');
        assert.ok(t.$('.my-board [data-cid="p0c0"]').classList.contains('entered'), 'the existing fade-in plays (CSS fades it in Calm motion)');
        assert.ok(t.motions.every(m => !moving(m)), 'only opacity changes');
        assert.equal(fx(t, 'ring'), 1, 'the landing ring still shows, as a fade');
        t.handle.destroy();
    }
});

test('a fight: lunge, red flash and damage burst on each creature; a defeat greys out with a puff', () => {
    for (const calm of [false, true]) {
        const t = prepared({ me: ['beastie'], opp: ['kardashiant'] }, (s, move) => {
            move('p0c0', 0, 'board'); move('p1c0', 1, 'board'); s.cards.p1c0.health = 1;
        }, { calm });
        t.$('.my-board [data-cid="p0c0"]').click(); t.$('.opp-board [data-cid="p1c0"]').click();
        assert.ok(!t.handle.state.players[1].board.includes('p1c0'), 'the defender is already defeated');
        const held = t.$('.b-motion-ghost[data-event="hold"]');
        assert.ok(held && held.dataset.cid === 'p1c0', 'a still copy holds its place until its defeat beat');
        runBeats(t);
        assert.ok(!held.parentNode, 'the defeat ghost replaces the held copy');
        assert.equal(fx(t, 'damage'), 2, 'both fighters show the hit');
        assert.equal(fx(t, 'poof'), 1, 'the defeated creature dissolves');
        assert.ok(t.$('.b-defeat-ghost'));
        assert.equal(t.$$('.b-float.dmg').length, 2);
        const attacker = t.$('.my-board [data-cid="p0c0"]');
        const flash = t.motions.find(m => m.node === attacker && m.frames.some(f => f.filter || f.opacity === 0.55));
        assert.ok(flash, 'the surviving attacker flashes once');
        if (calm) assert.ok(t.motions.every(m => !moving(m)), 'Calm motion: no lunge, flash, scale or recoil');
        else assert.ok(t.motions.some(m => m.frames.some(f => /translate\(/.test(f.transform || ''))), 'the attacker lunges');
        t.handle.destroy();
    }
});

test('a hero hit: the portrait flashes and recoils once, the heart counter pops', () => {
    const t = prepared({ me: ['beastie'], opp: ['keanu'] }, (s, move) => { move('p0c0', 0, 'board'); });
    t.$('.my-board [data-cid="p0c0"]').click(); t.$('.b-hero-row.opp .b-hero').click();
    assert.equal(t.handle.state.players[1].hearts, t.handle.state.players[1].maxHearts - 2);
    runBeats(t);
    const face = t.$('.b-hero-row.opp .b-portrait');
    const recoil = t.motions.find(m => m.node === face);
    assert.ok(recoil, 'the portrait moves');
    assert.equal(recoil.frames[1].translate, '0 -6px', 'the opponent recoils up, away from the middle');
    assert.ok(!recoil.options.iterations || recoil.options.iterations === 1, 'once');
    assert.ok(t.motions.some(m => m.node === t.$('.b-hero-row.opp .b-hearts')), 'the heart counter pops');
    assert.equal(fx(t, 'damage'), 1);
    t.handle.destroy();
});

test('Mercy and Last Word: a defeated creature visibly flies back to its owner\'s hand, without a puff', () => {
    for (const [defender, mercy] of [['kardashiant', true], ['keanu', false]]) {
    const t = prepared({ me: ['beastie'], opp: [defender] }, (s, move) => {
        move('p0c0', 0, 'board'); move('p1c0', 1, 'board');
        s.cards.p1c0.health = 1;
        if (mercy) s.axioms.active.defeat = 'mercy';
    });
    t.$('.my-board [data-cid="p0c0"]').click(); t.$('.opp-board [data-cid="p1c0"]').click();
    assert.ok(t.handle.state.players[1].hand.includes('p1c0'));
    runBeats(t);
    const ghost = t.$('.b-defeat-ghost.to-hand');
    assert.ok(ghost, 'the saved creature keeps its colours');
    const flight = t.motions.find(m => m.node === ghost);
    // From the opponent's board (290,250 centre) to their hand row (550,30 centre).
    assert.equal(flight.frames.at(-1).translate, '260px -220px');
    assert.equal(fx(t, 'poof'), 0);
    t.handle.destroy();
    }
});

test('Persuasion: the stolen creature crosses the table; boosts and restored hearts float', () => {
    const t = prepared({ me: ['beastie'], opp: ['keanu'], myTactics: ['persuasion'], energy: 8 }, (s, move) => {
        move('p0t0', 0, 'hand'); move('p1c0', 1, 'board');
    });
    t.$('.b-hand [data-cid="p0t0"]').click(); t.$('.opp-board [data-cid="p1c0"]').click();
    assert.ok(t.handle.state.players[0].board.includes('p1c0'), 'committed first');
    runBeats(t);
    const ghost = t.$('.b-motion-ghost[data-event="cross"]');
    assert.ok(ghost, 'a copy crosses from their side to mine');
    const flight = t.motions.find(m => m.node === ghost);
    assert.equal(flight.frames.at(-1).transform, 'translate(0px,240px) scale(1)');
    assert.ok(t.motions.some(m => m.node === t.$('.my-board [data-cid="p1c0"]') && m.frames[0].opacity === 0), 'the real card waits for the copy');
    const ring = t.$('.b-fx[data-fx="ring"][data-colour="language"]');
    assert.ok(ring, 'the spell bursts in its colour on the target');
    assert.equal(ring.style.left + ' ' + ring.style.top, '290px 250px', 'where the target stood when the spell hit, before it crossed');
    t.handle.destroy();

    const u = prepared({ me: ['beastie'], opp: ['keanu'], myTactics: ['rousing-speech'], energy: 8 }, (s, move) => {
        move('p0t0', 0, 'hand'); move('p0c0', 0, 'board'); s.players[0].hearts = 5;
    });
    u.$('.b-hand [data-cid="p0t0"]').click();
    playButton(u).click();
    assert.equal(u.handle.state.players[0].hearts, 7);
    runBeats(u);
    const floats = u.$$('.b-float').map(f => f.textContent);
    assert.ok(floats.includes('+1/+1'), floats.join(' | '));
    assert.ok(floats.includes('+2 ❤'), floats.join(' | '));
    assert.equal(fx(u, 'buff'), 1); assert.equal(fx(u, 'heal'), 1);
    u.handle.destroy();
});

test('the finish plays inside the existing one-second wait; pointer, resize and leaving cancel every cue', () => {
    const t = prepared({ me: ['beastie'], opp: ['keanu'] }, (s, move) => { move('p0c0', 0, 'board'); s.players[1].hearts = 2; });
    t.$('.my-board [data-cid="p0c0"]').click(); t.$('.b-hero-row.opp .b-hero').click();
    assert.equal(t.E.winner(t.handle.state), 0);
    const finishTimer = t.g.timers.find(x => x.ms === 1000);
    assert.ok(finishTimer, 'results still come after one second');
    const face = t.$('.b-hero-row.opp .b-portrait');
    const greys = () => t.motions.some(m => m.node === face && m.frames.at(-1).filter === 'grayscale(1) brightness(0.55)');
    assert.ok(!greys(), 'the finish waits for the lethal hit to be seen');
    const hitBeat = Math.max(...t.g.timers.filter(x => x.ms < 1000).map(x => x.ms));
    runBeats(t);
    assert.ok(greys(), 'then the loser greys');
    assert.ok(hitBeat < 1000, 'still inside the one-second wait');
    assert.ok(t.motions.some(m => m.node === t.$('.b-hero-row.me .b-hero') && /drop-shadow/.test(m.frames.at(-1).filter)), 'the winner glows');
    t.g.flush();
    assert.ok(t.$('.b-end-panel'), 'the results panel follows');
    assert.ok(t.motions.every(m => m.cancelled), 'the finish is cleared before the results');
    assert.equal(t.$$('.b-fx').length, 0);
    t.handle.destroy();

    for (const stop of ['pointer', 'resize', 'destroy']) {
        const u = prepared({ me: ['beastie'], opp: ['keanu'] }, (s, move) => { move('p0c0', 0, 'hand'); move('p1c0', 1, 'board'); });
        u.$('.b-hand [data-cid="p0c0"]').click(); playButton(u).click();
        runBeats(u);
        assert.ok(u.$$('.b-fx').length > 0 && u.motions.length > 0);
        const committed = JSON.stringify(u.handle.state);
        if (stop === 'pointer') u.$('.battle').dispatchEvent({ type: 'pointerdown', pointerType: 'mouse', clientX: 1, clientY: 1 });
        if (stop === 'resize') u.fire('resize');
        if (stop === 'destroy') u.handle.destroy();
        assert.equal(u.$$('.b-fx').length + u.$$('.b-motion-ghost').length, 0, stop + ' clears the cues');
        assert.ok(u.motions.every(m => m.cancelled), stop + ' cancels every motion');
        if (stop !== 'destroy') assert.equal(JSON.stringify(u.handle.state), committed);
        if (stop !== 'destroy') u.handle.destroy();
    }
});

test('no battle cue loops: no infinite iterations in battle.js, and every burst is one-shot', () => {
    const src = fs.readFileSync(new URL('../../js/screens/battle.js', import.meta.url), 'utf8');
    assert.ok(!/iterations\s*:\s*Infinity/.test(src));
    const css = fs.readFileSync(new URL('../../css/battle.css', import.meta.url), 'utf8');
    const fxRules = css.split('\n').filter(l => /\.b-fx|b-unroll|b-defeat/.test(l));
    assert.ok(fxRules.length > 3);
    assert.ok(fxRules.every(l => !/infinite/.test(l)));
    const t = prepared({ me: ['beastie'], opp: ['keanu'] }, (s, move) => { move('p0c0', 0, 'board'); move('p1c0', 1, 'board'); });
    t.$('.my-board [data-cid="p0c0"]').click(); t.$('.opp-board [data-cid="p1c0"]').click();
    runBeats(t);
    assert.ok(t.motions.length > 3);
    assert.ok(t.motions.every(m => !m.options || !m.options.iterations || m.options.iterations === 1));
    assert.ok(t.motions.every(m => !m.options || (m.options.duration || 0) + (m.options.delay || 0) <= 900), 'every cue is under a second');
    t.handle.destroy();
});

test('the opponent\'s creature flies in from their hand after its reveal', () => {
    const t = prepared({ me: ['beastie'], opp: ['kardashiant'] }, (s, move) => {
        move('p1c0', 1, 'hand'); s.active = 1; s.players[1].energy = s.players[1].capacity = 5;
    }, { before(g) {
        g.Rift.Battle.AI = { choose(s) { const L = g.Rift.Battle.Engine.legalActions(s); return L.find(a => a.type === 'play') || L.find(a => a.type === 'end'); } };
    } });
    // Step the opponent's timers (think, reveal) until the play is committed, then its beats.
    for (let i = 0; i < 60 && !t.handle.state.players[1].board.includes('p1c0'); i++) {
        const next = t.g.timers.slice().sort((a, b) => a.ms - b.ms)[0];
        if (!next) break;
        t.g.timers.splice(t.g.timers.indexOf(next), 1); next.fn();
    }
    assert.ok(t.handle.state.players[1].board.includes('p1c0'));
    runBeats(t);
    const ghost = t.$('.b-motion-ghost[data-event="play"]');
    assert.ok(ghost, 'their card flies too');
    const flight = t.motions.find(m => m.node === ghost);
    // From their hand row (centre 550,30) to their board (centre 290,250).
    // Their hand shows small backs, so the copy starts small and grows to its board size.
    assert.equal(flight.frames[0].transform, 'translate(260px,-220px) scale(0.6)');
    assert.ok(t.$('.b-fx[data-fx="ring"][data-colour="perception"]'));
    t.handle.destroy();
});

test('Guard: an attack on it flashes its frame; a refused target shows which creature to attack first', () => {
    const t = prepared({ me: ['beastie'], opp: ['kardashiant', 'kardashiant'] }, (s, move) => {
        move('p0c0', 0, 'board'); move('p1c0', 1, 'board'); move('p1c1', 1, 'board');
        s.cards.p1c0.extraKeywords = ['guard'];
    });
    t.$('.my-board [data-cid="p0c0"]').click(); t.$('.b-hero-row.opp .b-hero').click();
    assert.equal(t.handle.state.players[1].hearts, t.handle.state.players[1].maxHearts, 'refused: nothing happens in the battle');
    const frames = t.$$('.b-fx[data-fx="guard-frame"]');
    assert.equal(frames.length, 1, 'the Guard creature is shown');
    assert.equal(frames[0].style.left, '290px');
    if (!t.$('.my-board [data-cid="p0c0"]').classList.contains('selected')) t.$('.my-board [data-cid="p0c0"]').click();
    t.$('.opp-board [data-cid="p1c0"]').click();
    assert.equal(t.handle.state.lastEvents[0].t, 'attack');
    runBeats(t);
    assert.ok(t.$$('.b-fx[data-fx="guard-frame"]').length >= 1, 'the Guard takes the hit with its frame');
    t.handle.destroy();
});

test('Shield blocks with its break; a swap says Swapped; a boost that runs out is not shown as a loss', () => {
    const t = prepared({ me: ['beastie'], opp: ['kardashiant'] }, (s, move) => {
        move('p0c0', 0, 'board'); move('p1c0', 1, 'board'); s.cards.p1c0.extraKeywords = ['shield'];
    });
    t.$('.my-board [data-cid="p0c0"]').click(); t.$('.opp-board [data-cid="p1c0"]').click();
    runBeats(t);
    assert.equal(fx(t, 'shield-break'), 1);
    assert.ok(t.$$('.b-float').some(f => f.textContent === 'Blocked!'));
    t.handle.destroy();

    const u = prepared({ me: ['beastie', 'kardashiant'], opp: ['keanu'] }, (s, move) => {
        move('p0c0', 0, 'board'); move('p0c1', 0, 'board');
        s.cards.p0c0.buffs.push({ label: 'Pep', attack: 2, health: 0, temp: true });
    });
    const before = u.E.describe(u.handle.state, 'p0c0').attack;
    u.$('.b-end').click();
    assert.equal(u.E.describe(u.handle.state, 'p0c0').attack, before - 2, 'the this-turn boost ended');
    runBeats(u);
    const words = u.$$('.b-float').map(f => f.textContent + ':' + f.className);
    assert.ok(!words.some(w => /debuff/.test(w)), words.join(' | '));
    assert.ok(words.some(w => /^Boost ends:/.test(w)), words.join(' | '));
    u.handle.destroy();
});

test('a saved creature: the flash plays on its held copy, and its hand card waits for the flight', () => {
    const t = prepared({ me: ['kardashiant'], opp: ['beastie'] }, (s, move) => {
        move('p0c0', 0, 'board'); move('p1c0', 1, 'board'); s.cards.p0c0.health = 1; s.axioms.active.defeat = 'mercy';
    });
    t.$('.my-board [data-cid="p0c0"]').click(); t.$('.opp-board [data-cid="p1c0"]').click();
    assert.ok(t.handle.state.players[0].hand.includes('p0c0'), 'Mercy returned it to my hand');
    const held = t.$('.b-motion-ghost[data-event="hold"]');
    const hand = t.$('.b-hand [data-cid="p0c0"]');
    runBeats(t);
    assert.ok(t.motions.some(m => m.node === held && m.frames.some(f => /drop-shadow/.test(f.filter || ''))), 'the flash is on the board copy');
    assert.ok(!t.motions.some(m => m.node === hand && m.frames.some(f => f.filter)), 'never on the hand card');
    assert.ok(t.motions.some(m => m.node === hand && m.frames[0].opacity === 0), 'the hand card appears as the copy lands');
    t.handle.destroy();
});

test('Fold Self on a hurt creature says Swapped, never a loss and a heal', () => {
    const t = prepared({ me: ['paper-dragon'], opp: ['keanu'] }, (s, move) => {
        move('p0c0', 0, 'board'); Object.assign(s.cards.p0c0, { attack: 5, health: 5, damage: 3 });
    });
    t.$('.my-board [data-cid="p0c0"]').click();
    t.$('.b-card-actions [data-ability="fold-self"]').click();
    const d = t.E.describe(t.handle.state, 'p0c0');
    assert.equal(d.attack + '/' + d.health, '2/5', 'committed: attack and health traded places');
    runBeats(t);
    const words = t.$$('.b-float').map(f => f.textContent).join(' | ');
    assert.equal(words, 'Swapped');
    assert.equal(fx(t, 'heal'), 0);
    t.handle.destroy();
});
