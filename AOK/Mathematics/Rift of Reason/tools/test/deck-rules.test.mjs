// Construction rules (#112, design/drafts/card-arena-2026-10-12/CARD-DRAFTS.md): twenty personal cards with
// at most two copies of a creature species or a named tactic; per colour, colour tactic copies ≤ creature
// copies of that colour; generic tactics have no quota; ten axiom cards with at most two copies of a rule.
// One shared validator (Rift.State.validateDeck) for the builder, saved decks, team codes and AI decks,
// and no live-board colour gate in battle.
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadRift } from './harness.mjs';
import { loadWithDom } from './fake-dom.mjs';
import { setup, act, onBoard, toHand, plain } from './battle-helpers.mjs';

const R = loadRift([
    'js/core/rift.js', 'js/core/state.js', 'data/creatures.js', 'data/items.js', 'data/axioms.js', 'data/tactics.js',
    'data/map.js', 'data/decks.js', 'js/battle/abilities.js', 'js/battle/engine.js', 'js/battle/lesson.js', 'js/battle/team-codes.js',
]);
const S = R.State, E = R.Battle.Engine;
const J = x => JSON.parse(JSON.stringify(x));
const codes = r => r.problems.map(p => p.code);
const GENERIC = ['counterexample', 'pep-talk', 'stand-firm', 'eureka', 'second-wind', 'occams-razor', 'rethink', 'big-claims', 'clockwork', 'look-it-up', 'lemma', 'recall', 'pause-for-thought', 'safety-net'];
// Three Reason creatures (one copy each of three species) and nine other creatures.
const REASON3 = ['astrophysicat', 'khaby', 'proof-pup'];
const OTHERS = ['kardashiant', 'kardashiant', 'eelish', 'eelish', 'keanu', 'keanu', 'beansprout', 'beansprout', 'zuckerborg'];
const deck = (creatures, tactics, axioms) => S.validateDeck({ creatures, tactics, axioms });

test('three Reason creatures allow three Reason tactics; a fourth is rejected with an actionable reason', () => {
    const three = ['step-by-step', 'step-by-step', 'patient-proof'];
    const ok = deck(REASON3.concat(OTHERS), three.concat(GENERIC.slice(0, 5)));
    assert.equal(ok.valid, true, ok.message);
    assert.equal(ok.head, 'Deck 20/20: 12 creatures + 8 tactics.');
    assert.deepEqual(J(ok.quota.reason), { creatures: 3, tactics: 3 });
    const four = deck(REASON3.concat(OTHERS), three.concat(['patient-proof'], GENERIC.slice(0, 4)));
    assert.equal(four.valid, false);
    assert.deepEqual(J(codes(four)), ['quota']);
    assert.equal(four.problems[0].text, '4 Reason tactics need 4 Reason creatures. You have 3. Add a Reason creature or remove a Reason tactic.');
    // Copies count, not species: two Astrophysicats are two Reason creatures.
    assert.equal(deck(['astrophysicat', 'astrophysicat'], ['step-by-step', 'step-by-step'], null).problems.some(p => p.code === 'quota'), false);
    // Creatures of another colour never pay for a Reason tactic.
    assert.match(deck(OTHERS.concat(['zuckerborg', 'siuuugull', 'siuuugull']), ['qed'].concat(GENERIC.slice(0, 7))).message, /1 Reason tactic needs 1 Reason creature\. You have 0/);
});

test('a third identical creature or tactic is rejected; two are fine', () => {
    const twelve = REASON3.concat(OTHERS);
    const third = deck(twelve.slice(0, 11).concat(['kardashiant']), GENERIC.slice(0, 8));
    assert.deepEqual(J(codes(third)), ['copies']);
    assert.equal(third.problems[0].text, 'Kim Kardashiant: at most 2 copies. Remove 1.');
    const others = GENERIC.filter(id => id !== 'eureka');
    const tactic = deck(twelve, ['eureka', 'eureka', 'eureka'].concat(others.slice(0, 5)));
    assert.deepEqual(J(codes(tactic)), ['copies']);
    assert.equal(tactic.problems[0].text, 'Eureka!: at most 2 copies. Remove 1.');
    assert.equal(deck(twelve, ['eureka', 'eureka'].concat(others.slice(0, 6))).valid, true);
});

test('generic tactics use no colour quota: six creatures and fourteen generic tactics make a legal deck', () => {
    const r = deck(['kardashiant', 'kardashiant', 'eelish', 'eelish', 'keanu', 'keanu'], GENERIC.slice(0, 14));
    assert.equal(r.valid, true, r.message);
    assert.deepEqual(J(r.quota), { perception: { creatures: 2, tactics: 0 }, emotion: { creatures: 2, tactics: 0 }, memory: { creatures: 2, tactics: 0 } });
    // The size and the 6–14 bands still apply.
    assert.deepEqual(J(codes(deck(['kardashiant'], GENERIC.slice(0, 14)))), ['creatures', 'size']);
    assert.match(deck(REASON3.concat(OTHERS), GENERIC.slice(0, 6)).message, /Deck 18\/20.*Add 2 more cards\./);
});

test('ten axiom cards with at most two copies each; both contributions may bring two, so the shared deck holds four', () => {
    const mine = ['mercy', 'mercy', 'thrift', 'thrift', 'underdog', 'study', 'arrival', 'vigilance', 'choice', 'abundance'];
    const r = S.validateDeck({ creatures: REASON3.concat(OTHERS), tactics: GENERIC.slice(0, 8), axioms: mine });
    assert.equal(r.valid, true, r.message);
    assert.equal(r.axiomHead, 'Axiom cards 10/10.');
    const third = S.validateDeck({ creatures: [], tactics: [], axioms: mine.slice(0, 9).concat(['mercy']) }, { complete: false });
    assert.equal(third.problems[0].text, 'Axiom of Mercy: at most 2 copies. Remove 1.');
    assert.equal(third.problems[0].part, 'axioms');
    assert.match(S.validateDeck({ creatures: [], tactics: [], axioms: mine.slice(0, 9) }).problems.find(p => p.part === 'axioms').text, /Axiom cards 9\/10: add 1\./);
    assert.match(S.validateDeck({ creatures: [], tactics: [], axioms: ['spare-axiom'] }, { complete: false }).problems[0].text, /starts in your hand/);
    // The battle keeps both players' copies: four Mercy cards in the shared rule deck.
    const shared = E.buildAxiomDeck(mine, mine);
    assert.equal(shared.length, 20);
    assert.equal(shared.filter(id => id === 'mercy').length, 4);
    const s = E.createBattle({ seed: 'axioms', players: [{ team: [], axioms: mine }, { team: [], axioms: mine }], options: { shuffleAxioms: false, openAxioms: 0 } });
    assert.equal(s.axioms.deck.filter(id => id === 'mercy').length, 4);
});

test('a legal colour tactic casts with no matching creature on the board, and resolves', () => {
    let s = setup({ p0: ['kardashiant', 'astrophysicat'], p1: ['keanu'], t0: ['patient-proof', 'step-by-step'] });
    onBoard(s, 'p0c0', 'p1c0');
    toHand(s, 'p0t0', 'p0t1');
    assert.equal(E.colourInPlay(s, 0, 'reason'), false, 'the only Reason creature is in the deck');
    const plays = E.legalActions(s).filter(a => a.type === 'play' && a.cid.startsWith('p0t'));
    assert.deepEqual(J(plays.map(a => [a.cid, a.target || null])), [['p0t0', 'p1c0'], ['p0t1', null]]);
    s = act(s, { type: 'play', cid: 'p0t0', target: 'p1c0' });
    assert.equal(s.cards.p1c0.damage, 2, 'Patient Proof dealt its damage');
    assert.ok(s.players[0].discard.includes('p0t0'));
    assert.equal(E.describe(s, 'p0t1').colourReady, true);
});

test('saved decks: kept exactly as saved, problems listed for repair, legacy inventory untouched', () => {
    const s = S.freshState();
    ['astrophysicat', 'astrophysicat', 'astrophysicat', 'khaby', 'kardashiant', 'kardashiant', 'eelish', 'keanu', 'keanu', 'beansprout']
        .forEach((sp, i) => s.creatures.push(S.makeCreature(sp, { uid: 'c' + i })));
    S.unlockColourTactics(s);
    // An old custom deck made under the older rules: three Astrophysicats and three Look Closer.
    s.team = s.creatures.map(c => c.uid);
    s.deckTactics = ['step-by-step', 'step-by-step', 'look-closer', 'look-closer', 'look-closer', 'counterexample', 'eureka', 'eureka', 'pep-talk', 'stand-firm'];
    s.axiomLoadout = ['mercy', 'mercy', 'mercy', 'thrift', 'underdog', 'study', 'arrival', 'vigilance', 'choice', 'abundance'];
    const before = J(s);
    const own = S.ownDeck(s);
    assert.equal(own.check.valid, false);
    assert.deepEqual(J(own.check.problems.map(p => p.text)), [
        'Astrophysicat: at most 2 copies. Remove 1.',
        'Look Closer: at most 2 copies. Remove 1.',
        '3 Sense perception tactics need 3 Sense perception creatures. You have 2. Add a Sense perception creature or remove a Sense perception tactic.',
        'Axiom of Mercy: at most 2 copies. Remove 1.',
    ]);
    assert.deepEqual(J(own.team.map(c => c.uid)), before.team, 'no creature is swapped out');
    assert.deepEqual(J(own.tactics), before.deckTactics, 'no tactic is dropped');
    assert.deepEqual(J(own.axioms), before.axiomLoadout);
    assert.deepEqual(J(s), before, 'checking never changes the save');
    // The migration keeps the inventory and the broken custom deck for repair.
    assert.deepEqual(J(S.migrate(J(s)).team), before.team);
    assert.deepEqual(J(S.migrate(J(s)).deckTactics), before.deckTactics);
});

test('backup codes round-trip a legal custom deck with duplicated axioms and an invalid one awaiting repair', async () => {
    const store = new Map();
    const W = loadRift(['js/core/rift.js', 'js/core/state.js', 'data/creatures.js', 'data/axioms.js', 'data/tactics.js']);
    W.storage = () => ({ getItem: k => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: k => store.delete(k) });
    const s = W.State.freshState();
    s.avatar = { type: 'owlet', variant: 'girl', nickname: 'Ida', realName: 'Ida' };
    REASON3.concat(OTHERS).forEach((sp, i) => s.creatures.push(W.State.makeCreature(sp, { uid: 'u' + i })));
    W.State.unlockColourTactics(s);
    s.team = s.creatures.map(c => c.uid);
    s.deckTactics = ['step-by-step', 'step-by-step', 'counterexample', 'counterexample', 'eureka', 'pep-talk', 'stand-firm', 'second-wind'];
    s.axiomLoadout = ['mercy', 'mercy', 'thrift', 'thrift', 'underdog', 'study', 'arrival', 'vigilance', 'choice', 'abundance'];
    W.State.replace(s);
    assert.equal(W.State.ownDeck().check.valid, true, W.State.ownDeck().check.message);
    const code = await W.State.exportCode();
    W.State.wipe();
    const back = await W.State.importCode(code);
    assert.deepEqual(J(back.team), J(s.team));
    assert.deepEqual(J(back.deckTactics), J(s.deckTactics));
    assert.deepEqual(J(back.axiomLoadout), J(s.axiomLoadout));
    assert.equal(W.State.ownDeck(back).check.valid, true);
    // An invalid deck survives too, unchanged, with the same reasons.
    back.deckTactics = back.deckTactics.concat(['step-by-step']);
    const again = await W.State.readCode(W.State.encode('save', J(back)));
    assert.deepEqual(J(again.deckTactics), J(back.deckTactics));
    assert.deepEqual(J(W.State.ownDeck(again).check.problems.map(p => p.text)), ['Step by Step: at most 2 copies. Remove 1.', 'Remove 1 card.']);
});

test('one validator for every deck: trainers, boss decks, the practice dummy, team codes and starter fixtures', () => {
    for (const [id, t] of Object.entries(R.data.trainers)) {
        const r = S.validateDeck({ creatures: t.team, tactics: t.tactics || R.data.tacticDecks.starter });
        assert.ok(r.valid, 'trainer ' + id + ': ' + r.message);
    }
    for (const [id, d] of Object.entries(R.data.decks)) {
        const r = S.validateDeck({ creatures: d.creatures, tactics: d.tactics });
        assert.ok(r.valid, 'boss deck ' + id + ': ' + r.message);
    }
    for (let i = 0; i < 40; i++) {
        const team = E.randomTeam(R.makeRng('practice:' + i), 10, { prefix: 'spar', legendaries: false, maxCopies: 2 });
        assert.equal(team.length, 10);
        assert.ok(S.validateDeck({ creatures: team, tactics: R.data.tacticDecks.starter }).valid, 'practice dummy ' + i);
    }
    // The loaned starter team for an empty collection keeps the copy limit too.
    assert.ok(S.validateDeck({ creatures: R.Battle.Lesson.starter(), tactics: R.data.tacticDecks.starter }).valid);
    // A team code's ghost goes through the same rules (a short ghost deck is filled by the battle).
    const TC = R.Battle.TeamCodes;
    const ghost = TC.importTeam(TC.exportTeam({ nickname: 'Bo', creatures: REASON3.map((sp, i) => ({ uid: 'g' + i, species: sp })), tactics: ['step-by-step', 'qed'] }));
    assert.ok(S.validateDeck({ creatures: ghost.team, tactics: ghost.tactics, axioms: ghost.axioms }, { complete: false }).valid);
});

// ---- the builder and the launcher (fake DOM) ---------------------------------------------------------

function game(prepare) {
    const modals = [], toasts = [], routes = [];
    const g = loadWithDom(['js/core/rift.js', 'js/core/state.js', 'data/creatures.js', 'data/items.js', 'data/axioms.js', 'data/tactics.js',
        'js/battle/abilities.js', 'js/battle/engine.js', 'js/battle/lesson.js', ctx => {
            const Rf = ctx.Rift;
            const save = Rf.State.freshState();
            save.avatar = { type: 'owlet', variant: 'girl', nickname: 'Ida', realName: 'Ida' };
            prepare(save, Rf.State);
            Rf.State.get = () => save; Rf.State.update = fn => fn(save);
            Rf.Screens = { register() {} };
            Rf.Router = { go: (screen, params) => routes.push({ screen, params }), replace: screen => routes.push({ screen }), current: () => 'map' };
            Rf.Assets = { has: () => false, img: () => Rf.el('img') };
            Rf.UI = {
                toast: t => toasts.push(t),
                statLine: () => Rf.el('span'), variantBadges: () => Rf.el('span'), framedCard: () => Rf.el('div'),
                modal(title, body, buttons) { const m = { title, body, buttons, node: Rf.el('div'), closed: false, close() { m.closed = true; } }; modals.push(m); return m; },
            };
        }, 'js/screens/collection.js', 'js/ui/battles.js']);
    return { g, R: g.Rift, modals, toasts, routes, save: g.Rift.State.get() };
}
const text = n => n.textContent;
const button = (m, label) => m.buttons.find(b => b.label === label);
const plusFor = (body, name) => body.querySelectorAll('button').find(b => b.getAttribute('aria-label') === 'Add one ' + name);
const minusFor = (body, name) => body.querySelectorAll('button').find(b => b.getAttribute('aria-label') === 'Remove one ' + name);
const toggle = (input, on) => { input.checked = on; input.dispatchEvent({ type: 'change', target: input }); };

test('the deck builder shows copy and quota counts, refuses a third copy or a broken quota with a reason, and saves only a legal deck', () => {
    const t = game((s, St) => {
        ['astrophysicat', 'astrophysicat', 'astrophysicat', 'khaby', 'kardashiant', 'kardashiant', 'eelish', 'eelish', 'keanu', 'keanu', 'beansprout', 'beansprout']
            .forEach((sp, i) => s.creatures.push(St.makeCreature(sp, { uid: 'c' + i })));
        St.unlockColourTactics(s);
        St.grantTactic('patient-proof', s);
    });
    const dialog = t.R.Collection.editOwnDeck();
    const body = dialog.body;
    const status = body.querySelector('.deck-status');
    const reject = body.querySelector('.deck-reject');
    assert.match(text(status), /^Deck 20\/20: 10 creatures \+ 10 tactics\.$/, 'the default deck: copy-limited first ten + starter ten');
    assert.match(text(body.querySelector('.deck-quota')), /Reason 0\/3/);
    // A third Astrophysicat is refused with the reason, and stays unchecked.
    const boxes = body.querySelectorAll('input');
    const third = boxes[2];
    toggle(third, true);
    assert.equal(third.checked, false);
    assert.equal(text(reject), 'At most 2 copies of Astrophysicat. Uncheck one first.');
    assert.match(text(body), /In deck: 2\/2/);
    // Tactics: two copies, then a reason for the third (the starter ten has one Eureka!).
    const plusEureka = plusFor(body, 'Eureka!');
    plusEureka.click();
    assert.equal(text(reject), '');
    plusEureka.click();
    assert.equal(text(reject), 'At most 2 copies of Eureka!.');
    assert.match(text(body), /×2\/2/);
    // Reason quota: three Reason creatures in the team allow three Reason tactics.
    ['Rethink', 'Big Claims, Big Evidence', 'Clockwork'].forEach(name => { const m = minusFor(body, name); assert.ok(m, name); m.click(); });
    ['Step by Step', 'Step by Step', 'Patient Proof'].forEach(name => plusFor(body, name).click());
    assert.match(text(body.querySelector('.deck-quota')), /Reason 3\/3/);
    plusFor(body, 'Patient Proof').click();
    assert.equal(text(reject), '3 Reason creatures allow 3 Reason tactics. Add a Reason creature first, or remove another Reason tactic.');
    assert.match(text(status), /^Deck 21\/20: 10 creatures \+ 11 tactics\.$/);
    assert.match(text(body.querySelector('.deck-problems')), /Remove 1 card\./);
    // Saving an illegal deck is refused with the first reason; nothing is written.
    const before = JSON.stringify(t.save);
    button(dialog, 'Save deck').onclick();
    assert.equal(dialog.closed, false);
    assert.equal(text(reject), 'Remove 1 card.');
    assert.equal(JSON.stringify(t.save), before);
    // Repair: remove one generic tactic, then save.
    minusFor(body, 'Look It Up').click();
    assert.match(text(status), /^Deck 20\/20: 10 creatures \+ 10 tactics\.$/);
    button(dialog, 'Save deck').onclick();
    assert.equal(dialog.closed, true);
    assert.equal(t.save.team.length, 10);
    assert.deepEqual(J(t.save.deckTactics.filter(id => R.data.tactics[id].colour)), ['step-by-step', 'step-by-step', 'patient-proof']);
    assert.ok(t.R.State.ownDeck(t.save).check.valid);
});

test('an invalid saved deck opens as saved for repair, and battles say what to fix instead of padding or trimming it', () => {
    const t = game((s, St) => {
        ['astrophysicat', 'khaby', 'kardashiant', 'kardashiant', 'eelish', 'eelish', 'keanu', 'keanu', 'beansprout', 'beansprout']
            .forEach((sp, i) => s.creatures.push(St.makeCreature(sp, { uid: 'c' + i })));
        St.unlockColourTactics(s);
        s.team = s.creatures.map(c => c.uid);
        // Made under the older rule: one Reason creature was enough for any number of Reason tactics.
        s.deckTactics = ['step-by-step', 'step-by-step', 'qed', 'counterexample', 'pep-talk', 'stand-firm', 'eureka', 'second-wind', 'clockwork', 'rethink'];
        St.grantTactic('qed', s);
    });
    t.R.Battles.practice();
    assert.equal(t.routes.length, 0, 'no battle starts');
    const m = t.modals.at(-1);
    assert.equal(m.title, 'Fix your deck first');
    assert.match(text(m.body), /3 Reason tactics need 3 Reason creatures\. You have 2\./);
    button(m, 'Open the deck builder').onclick();
    assert.deepEqual(J(t.routes.at(-1)), { screen: 'collection', params: { edit: 'deck' } });
    const dialog = t.R.Collection.editOwnDeck();
    assert.match(text(dialog.body.querySelector('.deck-problems')), /3 Reason tactics need 3 Reason creatures/);
    assert.equal(dialog.body.querySelectorAll('.stepper-count').map(text).filter(x => x !== '×0/2').length, 9, 'the saved tactics are shown as saved');
    minusFor(dialog.body, 'Q.E.D.').click();
    // (Legacy: a small collection with every creature picked is filled by a loaned creature.)
    assert.match(text(dialog.body.querySelector('.deck-status')), /Deck 20\/20: 11 creatures \(10 yours \+ 1 loaned\) \+ 9 tactics\./);
    plusFor(dialog.body, 'Occam\'s Razor').click();
    assert.match(text(dialog.body.querySelector('.deck-status')), /^Deck 20\/20: 10 creatures \+ 10 tactics\.$/);
    button(dialog, 'Save deck').onclick();
    assert.equal(dialog.closed, true);
    t.R.Battles.practice();
    assert.equal(t.routes.at(-1).screen, 'battle');
    assert.equal(t.routes.at(-1).params.player.tactics.length, 10);
    assert.equal(t.routes.at(-1).params.player.team.length, 10);
});

test('the axiom builder takes up to two copies of a rule and refuses a third or an eleventh card', () => {
    const t = game(() => {});
    const dialog = t.R.Collection.editAxiomDeck();
    const body = dialog.body;
    const reject = body.querySelector('.deck-reject');
    assert.match(text(body.querySelector('.deck-status')), /Axiom cards 10\/10\. Ready\./);
    plusFor(body, 'Axiom of Mercy').click();
    assert.equal(text(reject), 'You have 10 axiom cards. Remove one first.');
    minusFor(body, R.data.axioms.thrift.name).click();
    plusFor(body, 'Axiom of Mercy').click();
    assert.equal(text(reject), '');
    assert.match(text(body), /×2\/2/);
    minusFor(body, R.data.axioms.study.name).click();
    plusFor(body, 'Axiom of Mercy').click();
    assert.equal(text(reject), 'At most 2 copies of Axiom of Mercy.');
    plusFor(body, R.data.axioms.study.name).click();
    button(dialog, 'Save ten cards').onclick();
    assert.equal(dialog.closed, true);
    assert.equal(t.save.axiomLoadout.filter(id => id === 'mercy').length, 2);
    assert.equal(t.save.axiomLoadout.length, 10);
});
