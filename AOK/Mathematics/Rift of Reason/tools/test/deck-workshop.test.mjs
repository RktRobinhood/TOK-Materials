// The deck workshop (#115, js/ui/deck-workshop.js): an optional, replayable lesson on the construction rules
// (#112) with a COPY of the avatar type's starter deck (#114). It is offered once before the first battle
// with the player's own deck, can be skipped, and replays from Collection. The learner repairs a third copy
// and an over-quota colour tactic, and casts a colour tactic with no creature of its colour on the table
// through the real battle engine. Only two save flags change; the saved deck never does.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { loadRift, GAME_DIR } from './harness.mjs';
import { loadWithDom } from './fake-dom.mjs';

const DATA = ['js/core/rift.js', 'js/core/state.js', 'js/core/world.js', 'data/avatars.js', 'data/creatures.js', 'data/items.js', 'data/map.js',
    'data/axioms.js', 'data/tactics.js', 'data/fate.js', 'data/powers.js', 'data/starters.js',
    'js/battle/abilities.js', 'js/battle/engine.js', 'js/battle/lesson.js', 'js/battle/team-codes.js'];
const R = loadRift(DATA.concat(['js/ui/deck-workshop.js']));
const S = R.State, E = R.Battle.Engine, W = R.DeckWorkshop;
const J = x => JSON.parse(JSON.stringify(x));
const TYPES = ['owlet', 'mothkin', 'fox', 'frogling', 'raven'];

function adventure(type, variant) {
    const s = S.freshState();
    s.seed = 4242;
    s.avatar = { type, variant: variant || 'girl', nickname: 'Ida', realName: 'Ida Test' };
    S.grantStarter(s);
    return s;
}
const problems = task => W.check(task).problems.map(p => p.code);

test('every starter: its plan, strategy and both powers of the avatar type, the player\'s own one first', () => {
    for (const type of TYPES) {
        for (const variant of ['boy', 'girl']) {
            const p = W.plan(adventure(type, variant));
            const def = R.data.avatars[type];
            assert.equal(p.type, type);
            assert.equal(p.strategy, R.data.starterDecks.decks[type].strategy);
            assert.ok(p.plan.length > 20 && p.plan.split(/\s+/).length <= 30, type + ' has a short plan line');
            assert.deepEqual(J(p.powers.map(x => x.id).sort()), [def.powers.boy, def.powers.girl].sort(), type + ': both powers');
            assert.equal(p.powers[0].mine, true);
            assert.equal(p.powers[0].id, def.powers[variant]);
            assert.equal(p.powers[1].mine, false);
            p.powers.forEach(x => assert.equal(x.text, R.data.powers[x.id].text));
            assert.ok(S.validateDeck({ creatures: p.deck.creatures, tactics: p.deck.tactics, axioms: p.deck.axioms }).valid);
        }
    }
    // A save with no starter (no avatar yet) has no workshop.
    assert.equal(W.plan(S.freshState()), null);
});

test('repair a third copy: only removing that copy fixes it; other moves are refused with a clear reason', () => {
    for (const type of TYPES) {
        const p = W.plan(adventure(type));
        let task = W.scenario('copies', p);
        const F = R.data.creatures[task.focus];
        assert.equal(F.colour, p.colour, type + ': a creature of the avatar\'s colour');
        assert.deepEqual(J(problems(task)), ['copies', 'size']);
        assert.equal(W.check(task).problems[0].text, F.name + ': at most 2 copies. Remove 1.');
        // A wrong card: refused, nothing changes, the reason names the real problem.
        const other = task.rows.creatures.find(id => id !== task.focus);
        const before = J(task);
        let res = W.change(task, 'creature', other, -1);
        assert.equal(res.ok, false);
        assert.equal(res.mistake, true);
        assert.match(res.text, new RegExp('^Not that card: .+ is fine\\. Find the card with 3 copies: ' + F.name.replace(/[.?]/g, '\\$&') + '\\.$'));
        assert.deepEqual(J(res.task), before);
        res = W.change(task, 'tactic', task.rows.tactics[0], 1);
        assert.equal(res.ok, false);
        assert.match(res.text, /^Adding a card makes the deck bigger\. It already has 21 cards\./);
        // The right move.
        res = W.change(task, 'creature', task.focus, -1);
        assert.equal(res.done, true);
        task = res.task;
        assert.ok(W.check(task).valid);
        assert.equal(task.creatures.filter(id => id === task.focus).length, 2);
    }
});

test('repair an over-quota colour tactic: a third one is refused, a swap for a generic tactic (or a matching creature) fixes it', () => {
    for (const type of TYPES) {
        const p = W.plan(adventure(type));
        const task = W.scenario('quota', p);
        const r = W.check(task);
        assert.deepEqual(J(problems(task)), ['quota'], type);
        assert.deepEqual(J(r.quota[task.focus]), { creatures: 2, tactics: 3 }, type + ': two creatures, three tactics of that colour');
        assert.notEqual(task.focus, p.colour);
        assert.equal(r.counts.total, 20);
        const colourTactics = task.rows.tactics.filter(id => R.data.tactics[id].colour === task.focus);
        const generic = task.rows.tactics.filter(id => !R.data.tactics[id].colour);
        assert.ok(generic.length >= 2, 'generic tactics stay available');
        // Adding another colour tactic is refused with the builder's reason.
        const add = colourTactics.find(id => task.tactics.filter(x => x === id).length < 2);
        let res = W.change(task, 'tactic', add, 1);
        assert.equal(res.ok, false);
        const C = R.COLOURS[task.focus].name;
        assert.equal(res.text, '2 ' + C + ' creatures allow 2 ' + C + ' tactics. Add ' + (/^[aeiou]/i.test(C) ? 'an ' : 'a ') + C + ' creature first, or remove another ' + C + ' tactic.');
        // Removing an unrelated card is a mistake: still over the quota, said plainly.
        const own = task.tactics.find(id => R.data.tactics[id].colour === p.colour);
        res = W.change(task, 'tactic', own, -1);
        assert.equal(res.mistake, true);
        assert.equal(res.text, 'That card is not the problem. ' + C + ' still has 3 tactics for 2 creatures.');
        // Swap: remove one colour tactic, add a generic one. Generic tactics have no quota.
        res = W.change(task, 'tactic', colourTactics[0], -1);
        assert.equal(res.done, false);
        assert.match(res.text, /Add 1 more card\./);
        const g = generic.find(id => res.task.tactics.filter(x => x === id).length < 2);
        res = W.change(res.task, 'tactic', g, 1);
        assert.equal(res.done, true, type + ': the swap fixes it');
        assert.ok(W.check(res.task).valid);
        // Or: another creature of that colour, and a different card out.
        const spare = task.rows.creatures.find(id => !p.deck.creatures.includes(id));
        if (spare) {
            let alt = W.change(task, 'creature', spare, 1);
            assert.equal(alt.ok, true);
            assert.deepEqual(J(W.check(alt.task).problems.map(x => x.code)), ['size']);
            const out = alt.task.tactics.find(id => !R.data.tactics[id].colour);
            alt = W.change(alt.task, 'tactic', out, -1);
            assert.equal(alt.done, true, type + ': a matching creature fixes it too');
        }
    }
});

test('the demonstration: a colour tactic of the starter casts in the real engine with no creature of its colour on the table', () => {
    for (const type of TYPES) {
        const p = W.plan(adventure(type));
        const d = W.demo(p);
        assert.ok(d, type + ' has a demonstration');
        assert.equal(R.data.tactics[d.tactic].colour, p.colour);
        assert.ok(p.deck.tactics.includes(d.tactic), 'one of the starter\'s own tactics');
        assert.equal(d.before, false);
        assert.equal(E.colourInPlay(d.state, 0, d.colour), false);
        assert.equal(E.colourInPlay(d.state, 1, d.colour), false);
        assert.equal(d.state.players[0].board.length, 1, 'your own creature is on the table');
        assert.notEqual(R.data.creatures[d.mine].colour, d.colour);
        assert.ok(E.legalActions(d.state).some(a => a.type === 'play' && a.cid === d.cid), 'the engine offers the cast');
        const before = J(d.state);
        const r = W.cast(d);
        assert.equal(r.ok, true, type + ': cast and discarded');
        assert.ok(r.events.some(t => t.includes(R.data.tactics[d.tactic].name)), r.events.join(' '));
        assert.deepEqual(J(d.state), before, 'casting never changes the demonstration state in place');
        // Deterministic: the same demonstration every time.
        assert.deepEqual(J(W.demo(p).action), J(d.action));
    }
});

// ---- on screen (fake DOM) ----------------------------------------------------------------------------

// An adventure built with the fake-DOM game's own State.
function adventureIn(Rf, type) {
    const s = Rf.State.freshState();
    s.seed = 4242;
    s.avatar = { type, variant: 'girl', nickname: 'Ida', realName: 'Ida Test' };
    Rf.State.grantStarter(s);
    return s;
}
function play(type, prep) {
    const modals = [], toasts = [], routes = [], screens = {};
    const g = loadWithDom(DATA.concat([ctx => {
        const Rf = ctx.Rift;
        Object.assign(ctx, { TextEncoder, TextDecoder, Buffer, Uint8Array });
        const save = adventureIn(Rf, type);
        if (prep) prep(save, Rf.State);
        Rf.State.get = () => save; Rf.State.update = fn => { fn(save); return save; };
        Rf.Screens = { register(name, def) { screens[name] = def; } };
        Rf.Router = { go: (screen, params) => routes.push({ screen, params }), replace: screen => routes.push({ screen }), back: () => {}, current: () => 'collection' };
        Rf.Assets = { has: () => false, img: () => Rf.el('img') };
        Rf.Audio = { sfx() {} };
        Rf.UI = {
            toast: t => toasts.push(t), hud: () => Rf.el('div'),
            statLine: () => Rf.el('span'), variantBadges: () => Rf.el('span'), framedCard: () => Rf.el('div'),
            modal(title, body, buttons) { const m = { title, body, buttons, node: Rf.el('div'), closed: false, close() { m.closed = true; } }; modals.push(m); return m; },
        };
    }, 'js/ui/battles.js', 'js/ui/powers.js', 'js/ui/deck-workshop.js', 'js/screens/collection.js']));
    return { g, R: g.Rift, modals, toasts, routes, screens, save: g.Rift.State.get() };
}
const text = n => n.textContent;
const buttons = body => body.querySelectorAll('button');
const byText = (body, label) => buttons(body).find(b => b.textContent === label);
const byLabel = (body, label) => buttons(body).find(b => b.getAttribute('aria-label') === label);
const next = body => byText(body, 'Next');
// The saved deck and everything but the two workshop flags.
const deckOf = s => J({ team: s.team, deckTactics: s.deckTactics, axiomLoadout: s.axiomLoadout, creatures: s.creatures, tactics: s.tactics, axioms: s.axioms, starter: s.starter, items: s.items });
const rest = s => { const x = J(s); delete x.flags; return x; };

test('offered once before the first own-deck battle; Not now starts the battle at once and is never asked again', () => {
    const t = play('fox');
    const before = rest(t.save);
    t.R.Battles.practice();
    const offer = t.modals.pop();
    assert.equal(offer.title, 'Deck workshop');
    assert.match(text(offer.body), /Fox kit starter deck/);
    assert.match(text(offer.body), /optional.*copy.*does not change/);
    assert.equal(t.routes.length, 0, 'no battle until the learner answers');
    offer.buttons.find(b => b.label === 'Not now').onclick();
    assert.equal(t.save.flags[t.R.DeckWorkshop.SEEN], true);
    assert.equal(t.routes.pop().screen, 'battle', 'the practice battle starts at once');
    // Never asked again; the battle starts directly.
    t.R.Battles.practice();
    assert.equal(t.modals.filter(m => m.title === 'Deck workshop').length, 0);
    assert.equal(t.routes.pop().screen, 'battle');
    assert.deepEqual(rest(t.save), before, 'skipping changes only the flag');
    // A trainer or a classmate's ghost also asks first, once (here: a fresh adventure).
    const u = play('raven');
    assert.equal(u.R.DeckWorkshop.shouldOffer(), true);
    const own = u.R.Battles.myDeck();
    u.R.Battles.ghost(u.R.Battle.TeamCodes.exportTeam({ nickname: 'Bo', creatures: own.team, tactics: own.tactics, axioms: own.axioms, avatar: u.save.avatar }));
    assert.equal(u.modals.pop().title, 'Deck workshop', 'a classmate\'s ghost asks first too');
    assert.equal(u.routes.length, 0);
    u.R.Battles.ghost('not a code');
    assert.equal(u.modals.length, 0, 'a broken code is refused before any offer');
    u.save.flags[u.R.DeckWorkshop.DONE] = true;
    assert.equal(u.R.DeckWorkshop.shouldOffer(), false, 'done: never offered');
    const v = play('owlet', s => { s.starter = null; });
    assert.equal(v.R.DeckWorkshop.shouldOffer(), false, 'no starter deck: nothing to offer');
});

test('the whole workshop from the offer: mistakes and retries, both repairs, the cast, then the match; the saved deck never changes', () => {
    const t = play('owlet');
    const W2 = t.R.DeckWorkshop;
    const saved = deckOf(t.save);
    t.R.Battles.practice();
    t.modals.pop().buttons.find(b => b.label === 'Start the workshop').onclick();
    const m = t.modals.pop();
    assert.equal(m.title, 'Deck workshop');
    assert.ok(m.buttons.some(b => b.label === 'Close workshop'), 'a way out at every step');
    assert.equal(t.save.flags[W2.SEEN], true);
    const body = m.body;
    // 1 the starter, its plan and both Owlet powers.
    assert.match(text(body), /Step 1 of 6/);
    assert.match(text(body), /Owlet starter deck\. Its plan: Patient midrange\./);
    assert.match(text(body), /Your power.*Close the Proof · 3 energy/);
    assert.match(text(body), /The other Owlet look.*Foresee · free/);
    assert.equal(next(body).disabled, false);
    next(body).click();
    // 2 twenty and ten, with a check question: a wrong answer says why and allows a retry.
    assert.match(text(body), /Your own deck has 20 cards: 12 creatures and 8 tactics\./);
    assert.match(text(body), /10 Axiom cards/);
    assert.equal(next(body).disabled, true);
    buttons(body).find(b => b.dataset.answer === '12 + 8').click();
    assert.match(text(body.querySelector('.deck-reject')), /^Not quite\. .*Try again\.$/);
    assert.equal(next(body).disabled, true);
    buttons(body).find(b => b.dataset.answer === '20 + 10').click();
    assert.match(text(body.querySelector('.deck-reject')), /^Right/);
    next(body).click();
    // 3 a third Astrophysicat.
    assert.match(text(body), /3 copies of Astrophysicat/);
    assert.match(text(body.querySelector('.deck-problems')), /Astrophysicat: at most 2 copies\. Remove 1\./);
    assert.equal(next(body).disabled, true);
    byLabel(body, 'Remove one Khaby Llame').click();
    assert.match(text(body.querySelector('.deck-reject')), /^Not that card: Khaby Llame is fine\./);
    assert.equal(t.g.document.activeElement.getAttribute('aria-label'), 'Remove one Khaby Llame', 'keyboard focus stays on the pressed control');
    byText(body, 'Start this task again').click();
    byLabel(body, 'Remove one Astrophysicat').click();
    assert.match(text(body), /Fixed: 2 copies of each card, 20 cards\./);
    assert.equal(next(body).disabled, false);
    next(body).click();
    // 4 the colour quota: 2 Language creatures, 3 Language tactics; swap one for a generic tactic.
    assert.match(text(body), /2 Language creatures but 3 Language tactics/);
    assert.match(text(body), /Generic tactics have no colour/);
    assert.match(text(body.querySelector('.deck-quota')), /Language 3\/2/);
    byLabel(body, 'Add one Rousing Speech').click();
    assert.match(text(body.querySelector('.deck-reject')), /2 Language creatures allow 2 Language tactics/);
    byLabel(body, 'Remove one Label It').click();
    assert.match(text(body.querySelector('.deck-problems')), /Add 1 more card\./);
    byLabel(body, 'Add one Pause for Thought').click();
    assert.match(text(body), /Fixed: every colour fits its quota\./);
    assert.match(text(body.querySelector('.deck-quota')), /Language 2\/2/);
    next(body).click();
    // 5 the cast.
    assert.match(text(body), /Reason creatures on the table: 0\./);
    assert.equal(next(body).disabled, true);
    byText(body, 'Cast Step by Step').click();
    assert.match(text(body), /It worked! You play the tactic Step by Step\./);
    assert.match(text(body), /No Reason creature was needed\./);
    next(body).click();
    // 6 done: the flag, and the match continues.
    assert.match(text(body), /Workshop complete/);
    assert.match(text(body), /Your saved deck did not change\./);
    assert.equal(t.save.flags[W2.DONE], true);
    assert.deepEqual(deckOf(t.save), saved, 'the workshop never touched the saved deck');
    byText(body, 'Continue to the match').click();
    assert.equal(m.closed, true);
    assert.equal(t.routes.pop().screen, 'battle');
    // A replay starts the repair tasks fresh.
    const again = W2.open();
    again.go(3);
    assert.equal(byText(again.body, 'Next').disabled, true, 'a replay starts the tasks fresh');
});

test('replay from Collection at any time, also after completion; leaving midway loses nothing', () => {
    const t = play('mothkin', s => { s.flags['deck-workshop-done'] = true; s.flags['deck-workshop-seen'] = true; });
    const before = rest(t.save);
    const node = t.g.Rift.el('div');
    t.screens.collection.mount(node, {});
    const open = node.querySelectorAll('button').find(b => b.textContent === 'Deck workshop');
    assert.ok(open, 'Collection has the workshop button');
    open.click();
    const m = t.modals.pop();
    assert.equal(m.title, 'Deck workshop');
    assert.match(text(m.body), /Moth-kin starter deck/);
    next(m.body).click();
    buttons(m.body).find(b => b.dataset.answer === '20 + 10').click();
    next(m.body).click();
    byLabel(m.body, 'Remove one Kim Kardashiant').click();
    // Leave in the middle.
    m.buttons.find(b => b.label === 'Close workshop').onclick();
    assert.deepEqual(rest(t.save), before, 'nothing but flags, and they were already set');
    assert.equal(t.routes.length, 0, 'closing starts no battle');
    // A save without a starter shows no workshop button.
    const u = play('fox', s => { s.starter = null; });
    const n2 = u.g.Rift.el('div');
    u.screens.collection.mount(n2, {});
    assert.equal(n2.querySelectorAll('button').some(b => b.textContent === 'Deck workshop'), false);
});

test('the workshop is in index.html after the battle launcher, and the battle UI has no live-colour fallback left', () => {
    const index = fs.readFileSync(path.join(GAME_DIR, 'index.html'), 'utf8');
    const at = f => index.indexOf('src="' + f + '"');
    assert.ok(at('js/ui/deck-workshop.js') > at('js/ui/battles.js') && at('js/ui/deck-workshop.js') < at('js/screens/collection.js'));
    const battle = fs.readFileSync(path.join(GAME_DIR, 'js/screens/battle.js'), 'utf8');
    assert.equal(/needsText|colourReady/.test(battle), false);
    const lessons = fs.readFileSync(path.join(GAME_DIR, 'js/battle/lesson.js'), 'utf8') + fs.readFileSync(path.join(GAME_DIR, 'js/ui/tutorial.js'), 'utf8');
    assert.equal(/creature (of (its|that) colour )?in play|needs a .* creature/i.test(lessons), false);
});
