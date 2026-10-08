// Side stories (design/SIDE-STORIES.md, format in data/script/side-stories.js): availability and the
// queue, the clock's tiers and drains, each verb's scoring, ripples, the data, and a full run of the fixture.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { Node } from './dom-adapter.mjs';
import { loadRift, GAME_DIR } from './harness.mjs';

const CORE = ['js/core/rift.js', 'js/core/state.js', 'data/avatars.js', 'data/creatures.js', 'data/map.js', 'js/core/story.js', 'js/core/cast.js',
    'js/core/stakes.js', 'js/core/side-verbs.js', 'js/core/side-stories.js', 'data/script/side-stories.js',
    'data/script/side-stories-l1.js', 'data/script/side-stories-l2.js', 'data/script/side-stories-l3.js', 'data/script/side-stories-l4.js'];

class Element extends Node {
    append(...xs) { xs.filter(x => x != null).forEach(x => { if (x instanceof Node) x.parent = this; }); super.append(...xs); }
    appendChild(n) { this.append(n); return n; }
    addEventListener(type, fn) { (this.listeners || (this.listeners = {}))[type] = fn; }
    remove() { if (this.parent) this.parent.children = this.parent.children.filter(x => x !== this); }
    find(cls) { const out = []; const walk = n => { if (!(n instanceof Node)) return; if (n.className.split(' ').includes(cls)) out.push(n); n.children.forEach(walk); }; walk(this); return out; }
    get allText() { const p = []; const walk = n => { if (typeof n === 'string') p.push(n); else if (n instanceof Node) { if (n.textContent) p.push(n.textContent); n.children.forEach(walk); } }; walk(this); return p.join(' '); }
}

function game(opts) {
    const o = opts || {};
    const Rift = loadRift(CORE);
    Rift.data.speakers = { narrator: { name: 'The Sundial', art: 'npc/sundial' }, granny: { name: 'Granny', art: 'npc/granny' } };
    Rift.data.script = Rift.data.script || {};
    vm.runInContext(fs.readFileSync(GAME_DIR + '/data/cast.js', 'utf8'), vm.createContext({ window: { Rift } }));
    Rift.Assets = { has: () => true, img: () => new Element('img') };
    Rift.State.newGame();
    Rift.State.update(s => { s.avatar = { type: o.type || 'owlet', variant: 'girl', nickname: 'Ada' }; s.settings.textSpeed = 1000; });
    return Rift;
}
const plain = x => JSON.parse(JSON.stringify(x));
const ids = list => list.map(s => s.id);
const complete = (Rift, id) => Rift.State.update(s => { s.map.completed.push(id); });
const story = (n, lesson, station, extra) => Object.assign({ n, lesson, station, title: 'S' + n, teaser: 't', clock: { size: 6, progress: 3 }, start: [], clues: { spots: [] }, outcome: {}, last: [] }, extra || {});

// A silent io: every step list runs through a tiny interpreter for flags and clock steps.
function silentIo(Rift, onClues, onVerb) {
    const played = [];
    return {
        played,
        async play(steps) {
            for (const st of steps) {
                played.push(st);
                if (st.clock && 'drain' in st) Rift.Stakes.drain(st.clock, st.drain);
                else if (st.clock && 'tick' in st) Rift.Stakes.tick(st.clock, st.tick);
                else if (st.flag) Rift.Story.setFlag(st.flag, st.value === undefined ? true : st.value);
            }
        },
        clues: ses => onClues(ses),
        verb: (ses, m) => onVerb(ses, m),
    };
}

test('availability: lesson trigger + visited station, two icons at most, queue order, done, fixtures hidden', () => {
    const Rift = game();
    const SS = Rift.SideStories;
    Rift.data.sideStories = {
        a: story(1, 1, 'stall-witness'), b: story(2, 1, 'well'), c: story(3, 1, 'campfire'),
        d: story(4, 2, 'b-bakery'), e: story(5, 2, 'b-school', { when: '!skip-e' }),
    };
    assert.equal(SS.triggered(1), false);
    assert.deepEqual(ids(SS.waiting()), [], 'no trigger yet');
    complete(Rift, 'troll-bridge');
    assert.equal(SS.triggered(1), true);
    assert.deepEqual(ids(SS.waiting()), [], 'stations not visited');
    Rift.State.update(s => { s.map.visitCount.well = 1; });
    Rift.State.setFlag('seen:ch1.campfire', true);
    complete(Rift, 'stall-witness');
    assert.deepEqual(ids(SS.waiting()), ['a', 'b', 'c']);
    assert.deepEqual(ids(SS.shown()), ['a', 'b'], 'two icons at once');
    assert.equal(SS.at('campfire'), null, 'the third one queues');
    // Lesson 2: its stories come first once we are in its chapter; then the oldest.
    Rift.State.setFlag('seen:ch2.square', true);
    complete(Rift, 'b-bakery'); complete(Rift, 'b-school');
    Rift.State.update(s => { s.chapter = 'ch2'; });
    assert.deepEqual(ids(SS.waiting()), ['d', 'e', 'a', 'b', 'c']);
    Rift.State.setFlag('skip-e', true);
    assert.deepEqual(ids(SS.shown()), ['d', 'a'], 'a story\'s own `when`');
    Rift.State.setFlag('side.4', 2);
    assert.deepEqual(ids(SS.shown()), ['a', 'b'], 'done stories leave the queue; nothing expires');
    // The fixture never shows in the game.
    Rift.data.sideStories.fixture = Object.assign({}, story(0, 1, 'well'), { fixture: true });
    assert.ok(!ids(SS.waiting()).includes('fixture'));
    SS.showFixtures = true;
    assert.ok(ids(SS.waiting()).includes('fixture'));
});

test('the narrator aside: once per lesson, about a shown story', () => {
    const Rift = game();
    const SS = Rift.SideStories;
    Rift.data.sideStories = { a: story(1, 1, 'well', { aside: { s: 'narrator', t: 'Somebody at the Well is lucky.' } }) };
    complete(Rift, 'troll-bridge');
    assert.equal(SS.aside(), null, 'nothing waiting yet');
    complete(Rift, 'well');
    assert.equal(SS.aside()[0].t, 'Somebody at the Well is lucky.');
    assert.equal(SS.aside(), null, 'once per lesson');
    Rift.State.update(s => { s.chapter = 'ch2'; });
    assert.ok(SS.aside(), 'a new lesson, a new aside');
});

test('the clock: Danger 6 and 4 tiers, Feed changes, heart and creature drains once each', async () => {
    for (const [size, danger, tier] of [[6, 0, 1], [6, 1, 1], [6, 2, 2], [6, 3, 2], [6, 4, 3], [6, 5, 3], [4, 1, 1], [4, 2, 2], [4, 3, 3]]) {
        const Rift = game();
        Rift.data.sideStories = { s: story(7, 1, 'well', { clock: { size, progress: 3 } }) };
        Rift.State.update(s => { s.flags.feed = 4; });
        const io = silentIo(Rift, async ses => { await ses.tick(danger); }, async () => {});
        const got = await Rift.SideStories.session('s', io).run();
        assert.equal(got, tier, `Danger ${danger} of ${size}`);
        assert.equal(Rift.State.flag('side.7'), tier);
        assert.equal(Rift.State.flag('feed'), 4 + ({ 1: -1, 2: 0, 3: 1 })[tier]);
    }
    // Too late, for now: the clock fills during the clues; the rest is skipped; Feed +2.
    const Rift = game();
    let verbRan = false;
    Rift.data.sideStories = { s: story(7, 1, 'well', { clock: { size: 4 }, outcome: { 4: [{ flag: 'tier4-played' }] } }) };
    const io = silentIo(Rift, async ses => { assert.equal(await ses.tick(4), true); }, async () => { verbRan = true; });
    assert.equal(await Rift.SideStories.session('s', io).run(), 4);
    assert.equal(verbRan, false);
    assert.equal(Rift.State.flag('tier4-played'), true);
    assert.equal(Rift.State.flag('feed'), 2);

    // Drains: a heart (once, never your last), a creature of the story's colour (once).
    const R = game();
    R.data.sideStories = { s: story(8, 1, 'well', { colour: 'reason' }) };
    R.State.update(s => { s.creatures = [R.State.makeCreature('astrophysicat')]; s.team = []; });
    const io2 = silentIo(R, async ses => {
        await ses.tick(3);
        assert.equal(ses.heart(), true);
        assert.equal(ses.heart(), false, 'a heart drains once');
        assert.equal(R.State.get().health, 4);
        assert.ok(ses.creature(), 'a reason creature on the team');
        assert.equal(ses.creature(), null, 'once');
        assert.equal(ses.danger(), 1);
    }, async () => {});
    assert.equal(await R.SideStories.session('s', io2).run(), 1);
});

test('clues: any two are enough, set lists, extra clicks cost a notch, the twist adds a card', async () => {
    const Rift = game();
    const spots = [{ id: 'p', kind: 'person', card: 'P' }, { id: 'o', kind: 'object', card: 'O' }, { id: 'r', kind: 'record', card: 'R' }];
    Rift.data.sideStories = {
        s: story(1, 1, 'well', { clues: { spots }, twist: { card: 'T' } }),
        four: story(4, 2, 'b-bakery', { clues: { spots, need: [['p', 'r'], ['p', 'o']] } }),
    };
    let ses;
    const io = silentIo(Rift, async s => {
        ses = s;
        await s.look('p');
        assert.equal(s.enough(), false);
        await s.look('p');
        await s.look('o');
        assert.equal(s.enough(), true, 'any two');
        assert.equal(s.danger(), 0, 'three clicks are free');
        const r = await s.look('r');
        assert.equal(r.cost, 1, 'the fourth click costs a notch');
        assert.equal(s.danger(), 1);
    }, async () => {});
    await Rift.SideStories.session('s', io).run();
    assert.equal(ses.found.length, 3);
    assert.deepEqual(plain(ses.cards.map(c => c.t)), ['P', 'O', 'R', 'T'], 'the twist adds a card');
    const io4 = silentIo(Rift, async s => {
        await s.look('o'); await s.look('r');
        assert.equal(s.enough(), false, 'story 4: two specific clues');
        await s.look('p');
        assert.equal(s.enough(), true);
    }, async () => {});
    await Rift.SideStories.session('four', io4).run();
});

test('deduce, test and object: right answers, struck wrong ones, costs, Why?, present a card, head start', () => {
    const Rift = game();
    const V = Rift.SideVerbs;
    const d = V.rounds('deduce', { rounds: [{ q: 'Which tin?', options: [{ t: 'A' }, { t: 'B', ok: true }, { t: 'C', cost: 2 }], why: { options: [{ t: 'hunch' }, { t: 'labels', ok: true }] } }] });
    assert.equal(d.current().ask.q, 'Which tin?');
    let r = d.answer(2);
    assert.equal(r.ok, false); assert.equal(r.cost, 2, 'a wrong tin can cost 2');
    assert.equal(d.answer(2).ignored, true, 'struck options do nothing');
    r = d.answer(1);
    assert.equal(r.ok, true); assert.equal(r.roundDone, false);
    assert.equal(d.current().ask.q, 'Why?');
    assert.equal(d.answer(0).cost, 1);
    r = d.answer(1);
    assert.deepEqual([r.ok, r.roundDone, r.progress, r.done], [true, true, 1, true]);

    const t = V.rounds('test', { rounds: [{ options: [{ t: 'his goals' }, { t: 'all matches', ok: true }, { t: 'viewers' }, { t: 'wished only' }], then: { q: 'Does it help?', options: [{ t: 'No', ok: true }, { t: 'Yes' }] } }] }, { head: 5 });
    assert.equal(t.current().ask.q, 'Which test could prove the claim wrong?');
    assert.equal(t.current().struck.size, 2, 'head start strikes wrong options, leaving one');
    assert.equal(t.rounds[0].asks[1].options.length, 2);

    const o = V.rounds('object', { rounds: [
        { line: [{ s: 'syllo', t: 'Everyone is joining!' }], q: 'Reply', options: [{ t: 'Popularity is not proof', ok: true }, { t: 'You are loud' }], name: { options: [{ t: 'Popularity', ok: true }, { t: 'Strawman' }] } },
        { q: 'Show it', present: 'clip' },
    ] }, { cards: [{ id: 'clip' }, { id: 'log' }] });
    assert.equal(o.answer(0).ok, true);
    assert.equal(o.answer(0).roundDone, true, 'named the flaw');
    assert.equal(o.answer('log').ok, false);
    r = o.answer('clip');
    assert.deepEqual([r.ok, r.done], [true, true]);
});

test('negotiate: listen moves drain once and reveal tags, motivations, pitfalls, the avatar card, asking, patience', () => {
    const Rift = game();
    const V = Rift.SideVerbs;
    const spec = { interest: 2, patience: 3, askAt: 4, cares: ['fairness', 'profit'], cantStand: ['experts'],
        listen: { mirror: { t: 'm' }, feeling: { t: 'f' }, sum: { t: 's' } },
        args: [{ t: 'fair', appeal: 'fairness', sound: true }, { t: 'fair again', appeal: 'fairness' }, { t: 'expert says', appeal: 'experts' }, { t: 'plain' }, { t: 'pay', appeal: 'profit' }] };
    const n = V.negotiation(spec, { species: 'owlet' });
    let r = n.listen('mirror');
    assert.deepEqual([r.drain, r.progress, r.reveal.key], [1, 1, 'fairness']);
    r = n.listen('mirror');
    assert.equal(r.drain, 0, 'each listen move drains once');
    assert.equal(n.state.patience, 3, 'listening costs no patience');
    r = n.argue(0);
    assert.deepEqual([r.result, n.state.interest, n.state.patience], ['hit', 3, 3], 'a sound hit costs no patience');
    r = n.argue(1);
    assert.deepEqual([r.result, n.state.interest, n.state.patience], ['used', 3, 2]);
    r = n.ask();
    assert.deepEqual([r.ok, r.tick, n.state.patience], [false, 1, 1], 'asking before trust costs a notch');
    r = n.argue(2);
    assert.equal(r.result, 'pitfall');
    assert.equal(r.tick, 2, 'pitfall notch + patience ran out');
    assert.equal(r.reset, true);
    assert.deepEqual([n.state.interest, n.state.patience], [2, 3], 'cards and motivations come back');
    // The owlet's card counts as facts or fairness: fairness is fresh again after the reset.
    r = n.argue('special');
    assert.deepEqual([r.result, r.key, n.state.interest], ['hit', 'fairness', 3]);
    r = n.argue(4);
    assert.deepEqual([r.result, n.state.interest], ['hit', 4]);
    r = n.ask();
    assert.deepEqual([r.ok, r.done, n.done()], [true, true, true]);

    // Head start (blue +1 progress) adds Interest; Interest 0 ticks and comes back to 1.
    const h = V.negotiation(Object.assign({}, spec, { interest: 1 }), { head: 1, species: 'raven' });
    assert.equal(h.state.interest, 2);
    assert.equal(h.special.label, 'Reframe');
    h.argue(2); r = h.argue(3);
    assert.ok(h.state.interest >= 1);
    const z = V.negotiation({ interest: 1, patience: 5, cantStand: ['fame'], args: [{ t: 'x', appeal: 'fame' }] }, {});
    r = z.argue(0);
    assert.deepEqual([r.tick, r.floor, z.state.interest], [2, true, 1]);
});

test('ripples: set at their tiers, capped at 2 per boss, late play when the boss is already beaten', () => {
    const Rift = game();
    const SS = Rift.SideStories;
    Rift.data.sideStories = {
        a: story(1, 1, 'well', { ripples: [{ flag: 'r-a', tiers: [1, 2], boss: 't-tribunal', drain: 1 }] }),
        b: story(2, 1, 'well', { ripples: [{ flag: 'r-b', tiers: [1, 2], boss: 't-tribunal', drain: 1 }] }),
        c: story(3, 1, 'well', { ripples: [{ flag: 'r-c', tiers: [1], boss: 't-tribunal', drain: 1, late: [{ note: 'over cap' }] }] }),
        d: story(4, 1, 'well', { ripples: [{ flag: 'r-d', tiers: [1, 2], boss: 'gate', drain: 1, late: [{ keepsake: 'map' }] }] }),
    };
    assert.deepEqual(plain(SS.applyRipples(SS.get('a'), 3)), []);
    assert.equal(Rift.State.flag('r-a'), undefined, 'not at tier 3');
    SS.applyRipples(SS.get('a'), 1); SS.applyRipples(SS.get('b'), 2);
    assert.equal(SS.rippleDrains('t-tribunal'), 2);
    assert.deepEqual(plain(SS.applyRipples(SS.get('c'), 1)), [{ note: 'over cap' }]);
    assert.equal(Rift.State.flag('r-c'), undefined);
    complete(Rift, 'gate');
    assert.deepEqual(plain(SS.applyRipples(SS.get('d'), 1)), [{ keepsake: 'map' }]);
    assert.equal(Rift.State.flag('r-d'), undefined);
});

test('data: every side story is complete, on a real station, and ripples stay within the cap', () => {
    const Rift = game();
    const all = Rift.data.sideStories;
    const nodes = Rift.data.map.nodes;
    const perBoss = {};
    const BLUE = { 1: 'raven', 2: 'frogling', 3: 'mothkin', 4: 'owlet', 5: 'fox', 6: 'frogling', 7: 'fox', 8: 'owlet', 9: 'mothkin', 10: 'raven' };
    const nums = new Set();
    Object.entries(all).forEach(([id, s]) => {
        assert.ok(Number.isInteger(s.n) && !nums.has(s.n), id + ': a unique n');
        nums.add(s.n);
        assert.ok([1, 2, 3, 4].includes(s.lesson), id + ': lesson 1–4');
        assert.ok(nodes[s.station], id + ': station ' + s.station);
        assert.ok(s.title && s.teaser, id + ': title and teaser');
        assert.ok(s.clock && [4, 6].includes(s.clock.size || 6) && (s.clock.progress || 3) >= 3, id + ': clock Danger 6 or 4, Progress 3–4');
        assert.ok(s.start && s.clues && s.twist && s.resolve && s.outcome && s.last, id + ': all six beats');
        const spec = typeof s.resolve === 'function' ? s.resolve({}) : s.resolve;
        assert.ok(['deduce', 'test', 'object', 'negotiate'].includes(spec.verb), id + ': a verb');
        [1, 2, 3, 4].forEach(t => assert.ok(s.outcome[t], id + ': outcome ' + t));
        (s.ripples || []).forEach(r => { if (r.drain) perBoss[r.boss] = (perBoss[r.boss] || 0) + r.drain; });
        if (s.fixture) return;
        // A real story: one inner-voice hook per species, and its blue option for the right species.
        const text = JSON.stringify(s, (k, v) => (typeof v === 'function' ? String(v) : v));
        ['owlet', 'mothkin', 'fox', 'frogling', 'raven'].forEach(sp => assert.ok(text.includes('"' + sp + '"'), id + ': an inner hook for ' + sp));
        assert.ok(text.includes('"only":"' + BLUE[s.n] + '"'), id + ': the blue option for ' + BLUE[s.n]);
    });
    Object.entries(perBoss).forEach(([boss, n]) => assert.ok(n <= 2, boss + ': side-story drains capped at 2 (' + n + ')'));
});

// ---- a full run of the fixture through the real dialogue runner ----------------------------

function dialogueRig(Rift, pick) {
    const overlay = new Element('div');
    const keys = new Set();
    const document = { getElementById: () => overlay, addEventListener: (k, fn) => keys.add(fn), removeEventListener: (k, fn) => keys.delete(fn) };
    const lines = [];
    Rift.el = (...a) => new Element(...a);
    Rift.Audio = { sfx() {}, speak() {}, stopVoice() {} };
    Rift.UI = { toast() {} };
    Rift.data.items = { charm: { name: 'Catch Charm' } };
    vm.runInContext(fs.readFileSync(GAME_DIR + '/js/ui/dialogue.js', 'utf8'), vm.createContext({ window: { Rift, document }, setTimeout, clearTimeout, Date }));
    let on = true;
    let last = null;
    (async () => {
        while (on) {
            await new Promise(r => setTimeout(r, 1));
            const layer = overlay.children[overlay.children.length - 1];
            const node = layer && layer.children.find(c => c instanceof Node && c.className.split(' ').includes('dialogue'));
            if (!node) continue;
            if (node !== last) { lines.push(node.allText); last = node; }
            lines[lines.length - 1] = node.allText;
            const buttons = node.find('btn');
            if (buttons.length) { last = null; pick(buttons).onclick(); continue; }
            keys.forEach(fn => fn({ key: 'Enter', preventDefault() {}, stopPropagation() {} }));
        }
    })();
    return { lines, stop() { on = false; }, play: steps => Rift.Dialogue.play(steps) };
}

test('the fixture plays all six beats: clues, twist card, deduce with Why?, tier, rewards, ripple, last line', async () => {
    const Rift = game();
    Rift.SideStories.showFixtures = true;
    complete(Rift, 'troll-bridge');
    complete(Rift, 'well');
    assert.equal(Rift.SideStories.at('well').id, 'fixture');
    const rig = dialogueRig(Rift, b => b[0]);
    const io = {
        play: rig.play,
        async clues(ses) {
            assert.equal(ses.spots.length, 3);
            await ses.look('person');
            await ses.look('record');
            assert.ok(ses.enough());
        },
        async verb(ses, m) {
            assert.equal(m.kind, 'deduce');
            await ses.apply(m.answer(0));                 // wrong: 1 notch
            await ses.apply(m.answer(1));                 // right
            await ses.apply(m.answer(0));                 // Why? right
            assert.ok(m.done());
            assert.equal(ses.progressNow(), 1);
        },
    };
    const ses = Rift.SideStories.session('fixture', io);
    const tier = await ses.run();
    rig.stop();
    assert.equal(tier, 1, 'Danger 1 of 6 is clean');
    assert.equal(Rift.State.flag('side.0'), 1);
    assert.equal(Rift.State.flag('stakes.side.0'), 1);
    assert.equal(Rift.State.flag('fixture-ripple'), true, 'the ripple flag at tier 1');
    assert.equal(Rift.State.get().items.charm >= 1, true, 'the tier-1 reward');
    assert.ok(ses.cards.some(c => c.kind === 'twist'), 'the twist adds a card');
    const text = rig.lines.join(' | ');
    ['bucket is gone', 'saw nothing', 'coins logged', 'twist', 'TEST tier 1.', 'TEST last line.'].forEach(w => assert.ok(text.includes(w), w));
    assert.ok(text.includes('TEST warning'), 'the wrong answer ticked and warned');
    assert.notEqual((Rift.SideStories.at('well') || {}).id, 'fixture', 'done: its icon goes (a real Well story may queue next)');
    assert.equal(Rift.Stakes.active().includes('side.0'), false, 'the clock is closed');
});

test('a blue option drains this story\'s clock; listen moves and replies run through the session', async () => {
    const Rift = game({ type: 'raven' });
    Rift.data.sideStories = { neg: story(1, 1, 'well', {
        start: [{ choice: [{ t: 'Plain' }, { t: 'Blue', only: 'raven', voice: true, then: [{ clock: 'side', drain: 1 }] }] }],
        clues: { spots: [], intro: [{ clock: 'side', tick: 2 }] },
        twist: { steps: [{ choice: [{ t: 'Blue', only: 'raven', voice: true, then: [{ clock: 'side', drain: 1 }] }] }] },
        resolve: { verb: 'negotiate', interest: 3, patience: 3, askAt: 4, cares: ['profit'], listen: { mirror: { t: 'm', say: [{ note: 'She nods.' }] } },
            args: [{ t: 'pay', appeal: 'profit' }], replies: { up: [{ note: 'Fair point.' }] } },
        outcome: { 1: [{ note: 'Clean.' }], 2: [], 3: [], 4: [] },
    }) };
    Rift.State.update(s => { s.map.completed.push('troll-bridge', 'well'); });
    const rig = dialogueRig(Rift, b => b[b.length - 1]);
    const io = {
        play: rig.play,
        async clues(ses) { assert.equal(ses.danger(), 2); },
        async verb(ses, m) {
            assert.equal(ses.danger(), 1, 'the blue option drained 1');
            await ses.apply(m.listen('mirror'));
            assert.equal(ses.danger(), 0, 'a listen move drains 1');
            await ses.apply(m.argue(0));
            await ses.apply(m.ask());
            assert.ok(m.done());
        },
    };
    assert.equal(await Rift.SideStories.session('neg', io).run(), 1);
    rig.stop();
    const text = rig.lines.join(' | ');
    assert.ok(text.includes('She nods.') && text.includes('Fair point.') && text.includes('Clean.'));
});
