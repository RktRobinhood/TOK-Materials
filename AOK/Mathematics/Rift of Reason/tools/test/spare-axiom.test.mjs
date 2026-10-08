// Granny's Spare Axiom (#60): the player's own rule card for saving Granny at the Ch2 Hall
// (save flag `spare-axiom`). It starts in the player's hand, never joins the shared deck,
// clears every active rule for both players and draws a card.
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadRift } from './harness.mjs';
import { Node } from './dom-adapter.mjs';
import { Rift, E, AI, setup, act, rule, events, plain, inst } from './battle-helpers.mjs';

const same = (a, b, m) => assert.deepEqual(plain(a), b, m);
const SPARE = 'spare-axiom';

test('the card: cost 1, an own card that clears the rules and draws 1', () => {
    const ax = Rift.data.axioms[SPARE];
    assert.equal(ax.name, 'Granny\'s Spare Axiom');
    assert.equal(ax.cost, 1);
    assert.equal(ax.text, 'Clear every rule in play. Draw a card.');
    assert.equal(ax.short, 'Clear all rules, draw 1');
    assert.equal(ax.flavour, 'When the rules get silly, go back to what you know.');
    assert.ok(ax.own && ax.clearRules && ax.draws === 1);
    assert.ok(!Rift.data.axiomDecks.starter.includes(SPARE) && !Rift.data.axiomDecks.default.includes(SPARE));
    assert.ok(!E.axiomSelection([SPARE, 'haste']).includes(SPARE), 'a loadout never brings it into the shared deck');
});

function battle(own0, own1, axiomDeck) {
    const team = ['kardashiant', 'astrophysicat', 'eelish'].map(sp => inst(sp));
    return E.createBattle({
        seed: 'spare',
        players: [{ name: 'You', team, ownAxioms: own0 }, { name: 'Them', team: team.map(c => inst(c.species)), ownAxioms: own1 }],
        axiomDeck,
        options: { first: 0 },
    });
}

test('ownAxioms puts it in that player\'s opening hand only; never in the shared deck', () => {
    const s = battle([SPARE], [], [SPARE, 'haste', 'underdog', SPARE]);
    assert.equal(s.players[0].axHand.filter(id => id === SPARE).length, 1, 'one copy in my hand');
    assert.ok(!s.players[1].axHand.includes(SPARE), 'never the opponent\'s');
    assert.ok(!s.axioms.deck.includes(SPARE) && !s.axioms.discard.includes(SPARE), 'not in the shared rule deck');
    const none = battle([], undefined, ['haste', 'underdog']);
    assert.ok(!none.players[0].axHand.includes(SPARE) && !none.players[1].axHand.includes(SPARE));
    assert.equal(battle(['haste'], [], ['underdog']).players[0].axHand.filter(id => id === 'haste').length, 0, 'a shared rule card is not an own card');
});

test('playing it clears every rule for both players, keeps Fate, draws 1 and leaves the game', () => {
    let s = setup({ p0: ['kardashiant'], options: { timeline: true } });
    rule(s, 'haste'); rule(s, 'underdog'); rule(s, 'normal-hearts');
    s.players[0].axHand.push(SPARE);
    const fate = plain(s.fate), hand = s.players[0].hand.length, deck = s.players[0].deck.length, energy = s.players[0].energy;
    assert.ok(E.legalActions(s).some(a => a.type === 'axiom' && a.choice === SPARE));
    s = act(s, { type: 'axiom', choice: SPARE });
    same(s.axioms.active, {}, 'no rule in play');
    same(E.activeAxioms(s), []);
    assert.equal(E.rules(s).attacksPerCreature, 1, 'back to the basic rules');
    for (const id of ['haste', 'underdog', 'normal-hearts']) assert.ok(s.axioms.discard.includes(id), id + ' goes to the shared discard');
    same(s.fate, fate, 'the Fate track does not move');
    assert.equal(s.players[0].hand.length, hand + 1, 'draws a card');
    assert.equal(s.players[0].deck.length, deck - 1);
    assert.equal(s.players[0].energy, energy - 1, 'costs 1');
    assert.ok(!s.players[0].axHand.includes(SPARE), 'it left the hand');
    assert.ok(!s.axioms.discard.includes(SPARE) && !s.axioms.deck.includes(SPARE), 'and never joins the shared deck');
    const ev = events(s, 'axiom')[0];
    assert.equal(ev.id, SPARE);
    assert.equal(ev.clear, true);
    assert.equal(events(s, 'draw').length, 1);
});

test('it cannot be played while every rule is basic', () => {
    const s = setup({ p0: ['kardashiant'] });
    s.players[0].axHand.push(SPARE);
    assert.ok(!E.legalActions(s).some(a => a.type === 'axiom' && a.choice === SPARE), 'nothing to clear');
    rule(s, 'patience');
    assert.ok(!E.legalActions(s).some(a => a.type === 'axiom' && a.choice === SPARE), 'a basic rule is not worth clearing');
    rule(s, 'haste');
    assert.ok(E.legalActions(s).some(a => a.type === 'axiom' && a.choice === SPARE));
});

test('the hand limit discards it out of the game, not into the shared deck', () => {
    let s = setup({ p0: ['kardashiant'] });
    rule(s, 'limited-memory');
    s.players[0].axHand.push(SPARE, 'haste', 'underdog', 'thrift');
    s = act(s, { type: 'end' });
    assert.ok(!s.players[0].axHand.includes(SPARE));
    assert.ok(!s.axioms.discard.includes(SPARE) && !s.axioms.deck.includes(SPARE));
});

test('the AI handles it: values it as clearing the rules and plays out a match without errors', () => {
    let s = setup({ p0: ['kardashiant'], p1: ['astrophysicat'] });
    s.active = 1;
    rule(s, 'reverse-hearts');
    s.players[1].axHand.push(SPARE);
    const a = AI.choose(s, { level: 'competent' });
    assert.ok(a && a.type, 'the AI picks a move');
    const end = AI.playOut(battle([SPARE], [], undefined), ['competent', 'normal']);
    assert.ok(E.winner(end) != null);
});

// ---- the launcher reads the save flag ----------------------------------------------------

function game() {
    const R = loadRift(['js/core/rift.js', 'js/core/state.js', 'js/core/world.js', 'data/creatures.js', 'data/items.js', 'data/map.js', 'data/decks.js', 'data/axioms.js',
        'js/battle/abilities.js', 'js/battle/engine.js', 'js/battle/ai.js', 'js/battle/lesson.js', 'js/ui/battles.js']);
    const state = R.State.freshState(); state.avatar = { type: 'owlet', nickname: 'Test' };
    R.State.get = () => state; R.State.update = fn => fn(state); R.el = (...args) => new Node(...args);
    const routes = [];
    R.Assets = { img: () => new Node() }; R.Dialogue = { has: () => false };
    R.UI = { toast: () => {}, modal: (title, body, buttons) => ({ title, body, buttons }) };
    R.Router = { go: (screen, params) => routes.push({ screen, params }), replace: screen => routes.push({ screen }) };
    return { R, state, routes };
}
const startOf = (R, p) => R.Battle.Engine.createBattle({ seed: 'x', players: [
    { name: 'You', team: p.player.team, tactics: p.player.tactics, ownAxioms: p.player.ownAxioms },
    { name: 'Them', team: p.opponent.team, tactics: p.opponent.tactics }], options: { first: 0 } });

test('flag spare-axiom: the player starts every card battle with it; without the flag, never', () => {
    const g = game();
    g.R.Battles.practice();
    let p = g.routes.at(-1).params;
    same(p.player.ownAxioms, [], 'no flag, no card');
    assert.ok(!startOf(g.R, p).players[0].axHand.includes(SPARE));

    g.state.flags['spare-axiom'] = true;
    g.R.Battles.practice();
    p = g.routes.at(-1).params;
    same(p.player.ownAxioms, [SPARE]);
    assert.ok(!p.opponent.ownAxioms, 'never the opponent');
    const s = startOf(g.R, p);
    assert.ok(s.players[0].axHand.includes(SPARE), 'in the starting hand');
    assert.ok(!s.players[1].axHand.includes(SPARE) && !s.axioms.deck.includes(SPARE));
    g.R.Battles.story();
    same(g.routes.at(-1).params.player.ownAxioms, [SPARE], 'Syllo\'s match too');
});

// ---- the battle screen shows it in my hand -----------------------------------------------

test('battle screen: the card sits in my hand as my own card, and says when there is no rule to clear', async () => {
    const { loadWithDom } = await import('./fake-dom.mjs');
    const screens = {};
    const g = loadWithDom(['js/core/rift.js', 'js/core/assets.js', 'data/creatures.js', 'data/axioms.js', 'data/tactics.js',
        'js/battle/abilities.js', 'js/battle/engine.js', 'js/battle/lesson.js',
        ctx => { ctx.Rift.Screens = { register: (n, d) => { screens[n] = d; }, get: n => screens[n] }; }, 'js/screens/battle.js']);
    const R = g.Rift;
    R.Battle.AI = { choose(s) { const L = R.Battle.Engine.legalActions(s); return L.find(a => a.type === 'end') || L[0]; } };
    R.Audio = { speak() {}, stopVoice() {}, sfx() {} };
    R.Battles = { rules: () => ({ close() {} }) };
    const root = g.document.createElement('div');
    g.document.body.appendChild(root);
    const team = p => Array.from({ length: 8 }, (_, i) => ({ uid: p + i, species: 'kardashiant', injuries: [], scars: [], powerDelta: 0 }));
    const handle = screens.battle.mount(root, {
        mode: 'practice', seed: 'spare-screen', onEnd() {},
        player: { team: team('me-'), tactics: [], axioms: [], ownAxioms: [SPARE] },
        opponent: { name: 'Dummy', team: team('opp-'), tactics: [], ai: 'normal' },
        axiomDeck: ['thrift', 'luxury', 'arrival', 'mercy'],
        battleOptions: { first: 0, shuffle: false, shuffleAxioms: false, spark: false, openHand: [3, 3], deckSize: 8, minCreatures: 1 },
    });
    assert.ok(handle.state.players[0].axHand.includes(SPARE));
    assert.ok(!handle.state.players[1].axHand.includes(SPARE));
    const card = root.querySelector('[data-axiom="' + SPARE + '"]');
    assert.ok(card, 'the card is in my hand');
    assert.match(card.textContent, /Your own card/);
    assert.match(card.textContent, /No rule to clear/);
});
