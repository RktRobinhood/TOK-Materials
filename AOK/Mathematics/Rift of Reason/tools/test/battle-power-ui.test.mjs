// The hero power on the battle screen (issue #52, design/AVATARS.md 1.6): the round button by each
// hero, its cost gem, resting counter and "Used" state, targeting like an ability, the choice panel,
// Recent plays, Night Sight's seen cards, the End turn glow and the opponent's power shown big first.
// The numbers are read from data/powers.js (the balance pass may change them).
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadWithDom } from './fake-dom.mjs';

const CORE = ['js/core/rift.js', 'js/core/assets.js', 'data/creatures.js', 'data/axioms.js', 'data/tactics.js', 'data/powers.js',
    'js/battle/abilities.js', 'js/battle/engine.js', 'js/battle/lesson.js', 'js/ui/powers.js'];

function load() {
    const screens = {};
    const g = loadWithDom(CORE.concat([ctx => { ctx.Rift.Screens = { register: (n, d) => { screens[n] = d; }, get: n => screens[n] }; }, 'js/screens/battle.js', 'js/screens/battle-lesson.js']));
    const { Rift } = g;
    Rift.data.speakers = { granny: { name: 'Granny Axiom', art: 'npc/granny-axiom' } };
    Rift.Audio = { speak() {}, stopVoice() {}, sfx() {} };
    Rift.Battles = { rules: onClose => ({ close() { onClose(); } }) };
    return { g, Rift, screens, E: Rift.Battle.Engine };
}

function mount(L, params) {
    const root = L.g.document.createElement('div');
    L.g.document.body.appendChild(root);
    const handle = L.screens[(params && params.screen) || 'battle'].mount(root, Object.assign({ mode: 'practice', opponent: { name: 'Dummy', team: [] }, onEnd() {} }, params));
    return { ...L, root, handle, $: sel => root.querySelector(sel), $$: sel => root.querySelectorAll(sel) };
}

const mk = (ids, prefix) => ids.map((species, i) => ({ uid: prefix + i, species, injuries: [], scars: [], powerDelta: 0 }));

// A prepared main-phase match: cfg { me, opp, myPower, oppPower, energy, first, hand? }, then edit(s, move).
function prepared(cfg, edit) {
    const L = load();
    const { E } = L;
    const s = E.createBattle({
        seed: 'power-ui',
        players: [
            { name: 'You', team: mk(cfg.me, 'me-'), tactics: [], power: cfg.myPower || null },
            { name: 'Dummy', team: mk(cfg.opp, 'opp-'), tactics: [], power: cfg.oppPower || null },
        ],
        axiomDeck: ['thrift', 'luxury', 'arrival', 'mercy'],
        options: { first: cfg.first || 0, shuffle: false, shuffleAxioms: false, spark: false, openHand: [0, 0], openAxioms: 0, deckSize: Math.max(cfg.me.length, cfg.opp.length), minCreatures: 1 },
    });
    const move = (cid, p, zone) => {
        const P = s.players[p];
        ['deck', 'hand', 'board'].forEach(z => { P[z] = P[z].filter(x => x !== cid); });
        P[zone].push(cid);
        if (zone === 'board') s.cards[cid].enteredTurn = -1;
    };
    s.phase = 'main';
    const a = s.active;
    s.players[a].energy = s.players[a].capacity = cfg.energy == null ? 5 : cfg.energy;
    if (edit) edit(s, move);
    // A scripted opponent: its power first (with the first target), then End turn.
    L.Rift.Battle.AI = { choose(st) {
        const acts = E.legalActions(st);
        return acts.find(x => x.type === 'draw' && x.choice === 'deck') || acts.find(x => x.type === 'choose') || acts.find(x => x.type === 'power') || acts.find(x => x.type === 'end') || acts[0];
    } };
    return mount(L, { initialState: s, opponent: { name: 'Dummy', team: [] } });
}

const def = (t, id) => t.Rift.data.powers[id];

test('no power, no button: a practice match without powers and Granny\'s lesson', () => {
    const t = prepared({ me: ['kardashiant'], opp: ['kardashiant'] });
    assert.equal(t.$$('.b-power').length, 0);
    t.handle.destroy();
    const L = load();
    const lesson = mount(L, { screen: 'battle-lesson' });
    assert.equal(lesson.$$('.b-power').length, 0, 'the guided lesson has no power button');
    lesson.handle.destroy();
});

test('a targeted power: cost gem, green when ready, targets glow, click-click uses it; Recent plays and "Used"', () => {
    const t = prepared({ me: ['kardashiant'], opp: ['kardashiant', 'kardashiant'], myPower: { id: 'lantern', tweaks: [] }, oppPower: { id: 'foresee', tweaks: [] } },
        (s, move) => { move('p1c0', 1, 'board'); move('p1c1', 1, 'board'); });
    const { $, E } = t;
    const btn = $('.b-power.mine');
    assert.ok(btn, 'my power button');
    assert.equal(btn.tagName.toLowerCase(), 'button');
    assert.equal($('.b-power.mine .b-pw-cost').textContent, String(def(t, 'lantern').cost), 'the energy cost in a gem');
    assert.ok(btn.classList.contains('ready'));
    assert.match(btn.dataset.tipDetail, /Deal 1 damage/);
    assert.match(btn.dataset.tipDetail, /glowing target/);
    // The opponent's button shows its state but is not a button.
    const theirs = $('.b-power.theirs');
    assert.ok(theirs && theirs.tagName.toLowerCase() === 'div');
    assert.match(theirs.dataset.tip, /Dummy's power: Foresee/);
    // A usable power keeps End turn from glowing.
    assert.ok(!$('.b-end').classList.contains('glow'));
    btn.click();
    assert.ok($('.b-power.mine').classList.contains('selected'));
    assert.deepEqual([...t.$$('.opp-board .bc.valid')].map(n => n.dataset.cid).sort(), ['p1c0', 'p1c1']);
    assert.match($('.b-ask').textContent, /glowing target for Lantern/);
    $('.opp-board [data-cid="p1c1"]').click();
    const s = t.handle.state;
    assert.equal(s.cards.p1c1.damage, 1);
    assert.equal(s.players[0].energy, 5 - def(t, 'lantern').cost);
    const used = $('.b-power.mine');
    assert.ok(used.classList.contains('used') && !used.classList.contains('ready'));
    assert.equal($('.b-power.mine .b-pw-used').textContent, 'Used');
    assert.match(used.dataset.tipDetail, /You used it this turn/);
    // Recent plays: the power's picture, and the text in its label.
    const tile = $('.b-recent-tile');
    assert.ok(tile.querySelector('.pw-icon'), 'the power icon (glyph until art exists)');
    assert.match(tile.getAttribute('aria-label'), /You use the power Lantern on/);
    // Clicking it again explains why not.
    used.click();
    assert.match($('.b-note').textContent, /used it this turn/);
    t.handle.destroy();
});

test('the resting counter shows the turns left over a dimmed button; the opponent\'s too', () => {
    const t = prepared({ me: ['kardashiant', 'kardashiant', 'kardashiant'], opp: ['kardashiant', 'kardashiant', 'kardashiant'], myPower: { id: 'hold-that-thought', tweaks: [] } });
    const { $, g, E } = t;
    $('.b-power.mine').click();
    assert.equal(t.handle.state.phase, 'choose', 'Hold That Thought asks which way');
    const options = [...t.$$('.b-choice button')].map(b => b.textContent);
    assert.ok(options.some(x => /closer/.test(x)) && options.some(x => /further/.test(x)));
    t.$$('.b-choice button')[0].click();
    assert.equal(t.handle.state.phase, 'main');
    $('.b-end').click();
    g.flush();
    assert.equal(E.decider(t.handle.state), 0, 'my turn again');
    const st = E.powerStatus(t.handle.state, 0);
    if (st.ready) assert.ok(!$('.b-power.mine .b-pw-wait'));
    else {
        assert.ok($('.b-power.mine').classList.contains('resting'));
        assert.equal($('.b-power.mine .b-pw-wait').textContent, String(st.turnsLeft));
        assert.match($('.b-power.mine').dataset.tipDetail, /resting/);
    }
    t.handle.destroy();
});

test('Blood price shows a heart instead of the energy gem; too little energy marks the gem', () => {
    const t = prepared({ me: ['kardashiant'], opp: ['kardashiant'], myPower: { id: 'fine-print', tweaks: ['blood'] }, energy: 0 });
    const gem = t.$('.b-power.mine .b-pw-cost');
    assert.ok(gem.classList.contains('heart'));
    assert.equal(gem.textContent, '1');
    assert.match(t.$('.b-power.mine').dataset.tipDetail, /Cost: 1 heart/);
    t.handle.destroy();
    const poor = prepared({ me: ['kardashiant'], opp: ['kardashiant'], myPower: { id: 'night-sight', tweaks: [] }, energy: 0 });
    assert.ok(poor.$('.b-power.mine').classList.contains('poor'));
    assert.match(poor.$('.b-power.mine').dataset.tipDetail, /needs \d+ energy/);
    poor.$('.b-power.mine').click();
    assert.match(poor.$('.b-note').textContent, /needs \d+ energy/);
    poor.handle.destroy();
});

test('Foresee asks with the rule cards in the choice panel', () => {
    const t = prepared({ me: ['kardashiant'], opp: ['kardashiant'], myPower: { id: 'foresee', tweaks: [] } });
    t.$('.b-power.mine').click();
    assert.equal(t.handle.state.phase, 'choose');
    assert.ok(t.$('.b-choice').classList.contains('show'));
    assert.equal(t.$$('.b-choice .bc.axiom').length, 2);
    t.$$('.b-choice .bc.axiom')[1].click();
    assert.equal(t.handle.state.phase, 'main');
    assert.match(t.$('.b-recent-tile').getAttribute('aria-label'), /Foresee: you look at the top 2 rule cards/);
    t.handle.destroy();
});

test('Night Sight: the opponent\'s cards lie face up, tagged Seen, until my next turn', () => {
    const t = prepared({ me: ['kardashiant', 'kardashiant'], opp: ['kardashiant', 'astrophysicat', 'kardashiant'], myPower: { id: 'night-sight', tweaks: [] } },
        (s, move) => { move('p1c0', 1, 'hand'); move('p1c1', 1, 'hand'); });
    const { $, g, E } = t;
    assert.equal(t.$$('.b-opp-hand .b-seen-tag').length, 0);
    $('.b-power.mine').click();
    assert.equal(t.$$('.b-opp-hand .bc.revealed').length, 2);
    assert.equal(t.$$('.b-opp-hand .b-seen-tag').length, 2);
    assert.match($('.b-opp-hand .bc.revealed').getAttribute('aria-label'), /^Seen in Dummy's hand/);
    assert.match($('.b-hero-row.opp .b-tax').textContent, /Next card \+1/);
    $('.b-end').click();
    g.flush();
    assert.equal(E.decider(t.handle.state), 0);
    assert.equal(t.$$('.b-opp-hand .b-seen-tag').length, 0, 'forgotten at my next turn');
    t.handle.destroy();
});

test('End turn glows with nothing left, but not while a power can be used; Brainstorm only with a card to play', () => {
    const idle = prepared({ me: ['kardashiant'], opp: ['kardashiant'] });
    assert.ok(idle.$('.b-end').classList.contains('glow'), 'nothing to do: End turn glows');
    idle.handle.destroy();
    const free = prepared({ me: ['kardashiant'], opp: ['kardashiant'], myPower: { id: 'hold-that-thought', tweaks: [] } });
    assert.ok(!free.$('.b-end').classList.contains('glow'));
    assert.match(free.$('.b-ask').textContent, /use your power/);
    free.handle.destroy();
    // Brainstorm with an empty hand: +1 card play would do nothing, so End turn still glows.
    const brain = prepared({ me: ['kardashiant'], opp: ['kardashiant'], myPower: { id: 'brainstorm', tweaks: [] } });
    assert.ok(brain.$('.b-power.mine').classList.contains('ready'));
    assert.ok(brain.$('.b-end').classList.contains('glow'));
    brain.handle.destroy();
});

test('the opponent\'s power is shown big first, then used; my recap names it', () => {
    const t = prepared({ me: ['kardashiant', 'kardashiant'], opp: ['kardashiant', 'kardashiant'], oppPower: { id: 'lantern', tweaks: [] } },
        (s, move) => { move('p0c0', 0, 'board'); s.players[1].capacity = 4; });
    const { $, g, E } = t;
    $('.b-end').click();
    for (let i = 0; i < 30 && g.timers.length && !($('.b-reveal').classList.contains('show') && $('.b-reveal').classList.contains('power')); i++) g.timers.shift().fn();
    assert.ok($('.b-reveal').classList.contains('power'), 'the power is shown big');
    assert.match($('.b-reveal .b-reveal-caption').textContent, /^Dummy uses the power Lantern on Kim Kardashiant/);
    assert.ok($('.b-reveal .b-power-big'));
    assert.equal(t.handle.state.cards.p0c0.damage || 0, 0, 'shown first, used after');
    g.flush();
    assert.equal(t.handle.state.cards.p0c0.damage, 1);
    assert.equal(E.decider(t.handle.state), 0);
    assert.match($('.b-draw-recap').textContent, /used Lantern on Kim Kardashiant/);
    assert.ok($('.b-power.theirs').classList.contains('resting'), 'their button rests');
    assert.match($('.b-power.theirs').dataset.tipDetail, /of their turns|their next turn/);
    t.handle.destroy();
});

test('PowerView: numbers after tweaks and a panel for the avatar screen', () => {
    const L = load();
    L.Rift.data.avatars = { owlet: { name: 'Owlet', powers: { boy: 'foresee', girl: 'close-the-proof' } } };
    const PV = L.Rift.PowerView;
    const base = PV.numbers('lantern');
    assert.equal(base.cost, def(L, 'lantern').cost);
    assert.equal(base.recharge, def(L, 'lantern').recharge);
    const blood = PV.numbers('lantern', ['blood']);
    assert.equal(blood.cost, 0);
    assert.equal(blood.heartCost, 1);
    const panel = PV.panel({ type: 'owlet', variant: 'girl' });
    assert.equal(panel.dataset.power, 'close-the-proof');
    assert.match(panel.textContent, /Close the Proof/);
    assert.match(panel.textContent, /Card Arena power/);
    assert.equal(PV.panel({ type: 'nobody', variant: 'boy' }), null);
});
