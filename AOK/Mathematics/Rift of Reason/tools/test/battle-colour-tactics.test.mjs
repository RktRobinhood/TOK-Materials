// Colour tactics (design/card-arena-expansion-2026-10-07.md, section 2): eighteen tactics, three per
// Way of Knowing (common, uncommon, rare), the colour identity rule (deck and play), each effect,
// `usable`, determinism and AI play, team codes, and the unlocks (also from an old save).
// Stats are set explicitly with stats() so these tests survive balance changes.
import test from 'node:test';
import assert from 'node:assert/strict';
import { Rift, E, AI, setup, act, onBoard, toHand, toDiscard, pass, hp, atk, plain, stats, invariants } from './battle-helpers.mjs';
import { loadRift } from './harness.mjs';

const T = Rift.data.tactics;
const COLOUR = Rift.data.tacticDecks.colour;
const legal = (s, pred) => E.legalActions(s).filter(pred);
const offered = s => legal(s, a => a.cid === 'p0t0').length > 0;
const targets = s => plain(legal(s, a => a.cid === 'p0t0').map(a => a.target)).sort();
const cast = (s, target) => act(s, Object.assign({ type: 'play', cid: 'p0t0' }, target ? { target } : {}));

// Player 0: a creature of the tactic's colour (p0c0, on the board unless `away`), a plain friend p0c1
// of another colour on the board, two more in the deck; two enemies on the board. Colours:
// Kardashiant perception, Astrophysicat reason, Eelish emotion, Beansprout language,
// Zuckerborg imagination, Siuuugull memory.
const OF = { perception: 'kardashiant', reason: 'astrophysicat', emotion: 'eelish', language: 'beansprout', imagination: 'zuckerborg', memory: 'siuuugull' };
const OFF = c => (c === 'perception' ? 'astrophysicat' : 'kardashiant');
function table(id, extra, away) {
    const colour = T[id].colour;
    const s = setup(Object.assign({
        p0: [OF[colour], OFF(colour), OFF(colour), OFF(colour)], p1: ['kardashiant', 'astrophysicat'],
        t0: [id, 'counterexample', 'pep-talk'],
    }, extra));
    onBoard(s, 'p0c1', 'p1c0', 'p1c1');
    if (!away) onBoard(s, 'p0c0');
    stats(s, 'p0c0', 2, 3);
    stats(s, 'p0c1', 2, 4);
    stats(s, 'p1c0', 3, 5);
    stats(s, 'p1c1', 2, 4);
    toHand(s, 'p0t0');
    return s;
}

test('eighteen colour tactics: common, uncommon and rare for each colour; the fifteen old ones stay colourless', () => {
    const ids = Object.values(COLOUR).flat();
    assert.equal(ids.length, 18);
    assert.deepEqual(Object.keys(COLOUR).sort(), Object.keys(Rift.COLOURS).sort());
    Object.entries(COLOUR).forEach(([colour, list]) => {
        assert.deepEqual(plain(list.map(id => T[id].rarity)), ['common', 'uncommon', 'rare'], colour);
        list.forEach(id => {
            assert.equal(T[id].colour, colour, id);
            assert.ok(T[id].text && typeof T[id].run === 'function', id);
            assert.ok(T[id].name.length <= 24 && T[id].text.length <= 90, id + ': short card text');
            assert.equal(T[id].inTune, undefined, id + ': no In tune bonus any more');
        });
    });
    const old = Object.keys(T).filter(id => !ids.includes(id));
    assert.equal(old.length, 15);
    old.forEach(id => { assert.equal(T[id].colour, undefined, id); assert.equal(T[id].rarity, undefined, id); });
    const D = Rift.data.tacticDecks;
    ids.forEach(id => assert.ok(!D.starter.includes(id) && !D.earned.includes(id), id + ' is not a starter or earned tactic'));
    // The rares named by the teacher, with short art ids.
    assert.deepEqual(plain(Object.values(COLOUR).map(l => l[2])), ['qed', 'wave-of-feeling', 'clear-view', 'persuasion', 'dream-big', 'total-recall']);
});

test('colour identity in play: a colour tactic is offered only while you control a creature of its colour', () => {
    let s = table('step-by-step', {}, true);
    assert.equal(E.colourInPlay(s, 0, 'reason'), false);
    assert.equal(offered(s), false, 'the Reason creature is still in the deck');
    toHand(s, 'p0c0');
    assert.equal(offered(s), false, 'in the hand is not in play');
    assert.equal(E.colourInPlay(s, 1, 'reason'), true, 'the enemy has one, which does not count for you');
    onBoard(s, 'p0c0');
    assert.equal(offered(s), true);
    s.cards.p0c0.colourless = true;
    assert.equal(offered(s), false, 'a nicknamed creature has no colour');
    // Memory counts as a colour too.
    s = table('remember-when', {}, true);
    toDiscard(s, 'p0t1');
    assert.equal(offered(s), false);
    onBoard(s, 'p0c0');
    assert.equal(offered(s), true);
    // Colourless tactics need nothing.
    s = table('step-by-step', {}, true);
    toHand(s, 'p0t1');
    assert.ok(legal(s, a => a.cid === 'p0t1').length > 0);
    const d = E.describe(s, 'p0t0');
    assert.equal(d.colour, 'reason');
    assert.equal(d.rarity, 'common');
    assert.equal(d.colourReady, false);
    assert.equal(E.describe(s, 'p0t1').colourReady, true);
});

test('colour identity in the deck: a colour tactic without a creature of its colour is left out of the battle', () => {
    const inst = (sp, i) => ({ uid: 'id' + i, species: sp });
    assert.deepEqual(plain(E.identityFilter(['qed', 'counterexample', 'daydream', 'step-by-step'], [inst('astrophysicat', 1)])),
        { kept: ['qed', 'counterexample', 'step-by-step'], dropped: ['daydream'] });
    const s = E.createBattle({ seed: 'id', players: [
        { team: [inst('astrophysicat', 1), inst('kardashiant', 2)], tactics: ['qed', 'daydream', 'daydream', 'look-closer', 'counterexample'] },
        { team: [inst('eelish', 3)], tactics: ['gut-reaction', 'nostalgia'] },
    ], options: { shuffle: false } });
    const tacticsOf = p => Object.values(s.cards).filter(c => c.kind === 'tactic' && c.owner === p).map(c => c.tactic);
    assert.deepEqual(plain(tacticsOf(0)), ['qed', 'look-closer', 'counterexample']);
    assert.deepEqual(plain(tacticsOf(1)), ['gut-reaction']);
});

test('Reason: Step by Step draws 2; Proof by Contradiction 3 damage and a card if it defeats; Q.E.D. defeats', () => {
    let s = table('step-by-step');
    const n = s.players[0].hand.length;
    assert.equal(cast(s).players[0].hand.length, n + 1, 'played one, drew two');
    s = table('step-by-step');
    s.players[0].discard.push(...s.players[0].deck.splice(0));
    assert.equal(offered(s), false, 'empty deck');
    assert.deepEqual(targets(table('proof-by-contradiction')), ['p1c0', 'p1c1'], 'enemy creatures only');
    s = cast(table('proof-by-contradiction'), 'p1c0');
    assert.equal(hp(s, 'p1c0'), 2);
    assert.equal(s.players[0].hand.length, 0, 'it survived: no card');
    s = table('proof-by-contradiction');
    stats(s, 'p1c1', 2, 3);
    s = cast(s, 'p1c1');
    assert.ok(s.players[1].discard.includes('p1c1'));
    assert.equal(s.players[0].hand.length, 1, 'it fell: draw a card');
    s = table('proof-by-contradiction');
    s.cards.p1c1.baseKeywords = ['shield'];
    stats(s, 'p1c1', 2, 3);
    s = cast(s, 'p1c1');
    assert.equal(s.players[0].hand.length, 0, 'a Shield blocks it: no card');
    s = table('qed');
    stats(s, 'p1c0', 9, 9);
    s = cast(s, 'p1c0');
    assert.ok(s.players[1].discard.includes('p1c0'));
});

test('Emotion: Gut Reaction 3 to the enemy hero; Rally Cry +1/+1; Wave of Feeling +2 attack and Swift', () => {
    assert.equal(cast(table('gut-reaction')).players[1].hearts, 7);
    let s = cast(table('rally-cry'));
    assert.equal(atk(s, 'p0c1'), 3);
    assert.equal(hp(s, 'p0c1'), 5);
    assert.equal(atk(s, 'p1c0'), 3, 'enemy creatures are untouched');
    s = table('wave-of-feeling');
    toHand(s, 'p0c2');
    s = act(s, { type: 'play', cid: 'p0c2' });
    assert.equal(E.canAttack(s, 'p0c2'), false, 'asleep');
    s = cast(s);
    assert.equal(atk(s, 'p0c1'), 4);
    assert.ok(E.canAttack(s, 'p0c2'), 'Swift wakes it');
});

test('Perception: Look Closer strips Guard, Elusive and Shield (even from an Elusive enemy) and draws; Field Notes; Clear View', () => {
    let s = table('look-closer');
    assert.equal(offered(s), false, 'no enemy has Guard, Elusive or Shield');
    s.cards.p1c0.baseKeywords = ['guard', 'shield'];
    s.cards.p1c1.extraKeywords = ['elusive'];
    assert.deepEqual(targets(s), ['p1c0', 'p1c1'], 'Elusive does not hide from it');
    s = cast(s, 'p1c0');
    assert.deepEqual(plain(E.keywordsOf(s, 'p1c0')), []);
    assert.equal(s.players[0].hand.length, 1, 'draw a card');
    assert.ok(legal(s, a => a.type === 'attack' && a.cid === 'p0c1').some(a => a.target === 'h1'), 'no Guard: the hero is open');
    s = table('look-closer', { p1: ['shakirattle', 'astrophysicat'] });
    assert.ok(E.keywordsOf(s, 'p1c0').includes('elusive'), 'Elusive from an ability');
    s = cast(s, 'p1c0');
    assert.ok(!E.keywordsOf(s, 'p1c0').includes('elusive'));
    // A lost keyword can be given back (Stand Firm); back in the hand the loss is forgotten.
    s = table('look-closer', { t1: ['stand-firm'] });
    s.cards.p1c0.baseKeywords = ['guard'];
    s = pass(cast(s, 'p1c0'));
    toHand(s, 'p1t0');
    s = act(s, { type: 'play', cid: 'p1t0', target: 'p1c0' });
    assert.ok(E.keywordsOf(s, 'p1c0').includes('guard'));
    s = table('look-closer', { t0: ['look-closer', 'rethink'] });
    s.cards.p1c0.baseKeywords = ['guard'];
    s = cast(s, 'p1c0');
    toHand(s, 'p0t1');
    s = act(s, { type: 'play', cid: 'p0t1', target: 'p1c0' });
    assert.equal(s.cards.p1c0.lostKeywords, null);
    onBoard(s, 'p1c0');
    assert.ok(E.keywordsOf(s, 'p1c0').includes('guard'));

    s = table('field-notes');
    s.cards.p0c1.damage = 3;
    s = cast(s, 'p0c1');
    assert.equal(hp(s, 'p0c1'), 5);
    assert.equal(atk(s, 'p0c1'), 3);

    s = table('clear-view');
    s.cards.p1c0.baseKeywords = ['guard'];
    s.cards.p1c1.baseKeywords = ['shield'];
    s = cast(s);
    assert.deepEqual(plain(E.keywordsOf(s, 'p1c0')), []);
    assert.deepEqual(plain(E.keywordsOf(s, 'p1c1')), []);
    assert.equal(s.players[0].hand.length, 2);
});

test('Language: Label It (attack 1, can\'t attack next turn); Rousing Speech (+1/+1, 2 hearts); Persuasion takes control', () => {
    let s = table('label-it');
    stats(s, 'p1c1', 1, 4);
    assert.deepEqual(targets(s), ['p1c0'], 'only targets with 2 or more attack');
    s = cast(s, 'p1c0');
    assert.equal(atk(s, 'p1c0'), 1);
    s = pass(s);
    assert.equal(E.canAttack(s, 'p1c0'), false, 'it can\'t attack on its next turn');
    s = pass(s);
    assert.equal(atk(s, 'p1c0'), 1, 'the label stays');
    s = table('rousing-speech');
    s.players[0].hearts = 5;
    s = cast(s);
    assert.equal(atk(s, 'p0c1'), 3);
    assert.equal(hp(s, 'p0c1'), 5);
    assert.equal(s.players[0].hearts, 7);

    s = table('persuasion');
    stats(s, 'p1c0', 4, 5);
    assert.deepEqual(targets(s), ['p1c1'], '3 or less attack');
    s = cast(s, 'p1c1');
    invariants(s, assert);
    assert.ok(s.players[0].board.includes('p1c1') && !s.players[1].board.includes('p1c1'));
    assert.equal(s.cards.p1c1.controller, 0);
    assert.equal(s.cards.p1c1.owner, 1);
    assert.equal(E.canAttack(s, 'p1c1'), false, 'it arrives asleep');
    s = pass(pass(s));
    assert.ok(E.canAttack(s, 'p1c1'), 'next turn it fights for you');
    stats(s, 'p1c0', 9, 9);
    s = act(s, { type: 'attack', cid: 'p1c1', target: 'p1c0' });
    invariants(s, assert);
    assert.ok(s.players[1].discard.includes('p1c1'), 'defeated: back to its owner\'s discard pile');
    assert.equal(s.cards.p1c1.controller, 1);
    assert.deepEqual(plain(E.lostUids(s, 1)), [s.cards.p1c1.uid], 'the Fate roll stays with the real owner');
    assert.deepEqual(plain(E.lostUids(s, 0)), []);
    s = table('persuasion', { options: { boardLimit: 2 } });
    assert.equal(offered(s), false, 'no room on your side');
});

test('Imagination: Daydream (Elusive, +2 attack); Imagine Otherwise (swap, draw); Dream Big (+3/+3)', () => {
    let s = cast(table('daydream'), 'p0c1');
    assert.equal(atk(s, 'p0c1'), 4);
    assert.ok(E.keywordsOf(s, 'p0c1').includes('elusive'));
    s = table('imagine-otherwise');
    stats(s, 'p1c1', 3, 3);
    assert.ok(!targets(s).includes('p1c1'), 'equal attack and health: nothing to swap');
    s = cast(s, 'p1c0');              // 3/5 → 5/3
    assert.equal(atk(s, 'p1c0'), 5);
    assert.equal(hp(s, 'p1c0'), 3);
    assert.equal(s.players[0].hand.length, 1, 'draw a card');
    s = table('imagine-otherwise');
    s.cards.p0c1.damage = 1;          // 2/4 with Pep Talk +2/+2 → 4 attack, 5 of 6 health
    s.cards.p0c1.buffs.push({ label: 'Pep talk', attack: 2, health: 2, temp: false });
    s = cast(s, 'p0c1');
    assert.equal(atk(s, 'p0c1'), 5);
    assert.equal(hp(s, 'p0c1'), 4);
    assert.equal(E.healthOf(s, 'p0c1').max, 4);
    s = table('imagine-otherwise');
    stats(s, 'p1c1', 0, 4);
    s = cast(s, 'p1c1');              // 0 attack → 0 health: defeated
    assert.ok(s.players[1].discard.includes('p1c1'));
    s = cast(table('dream-big'), 'p0c1');
    assert.equal(atk(s, 'p0c1'), 5);
    assert.equal(hp(s, 'p0c1'), 7);
});

test('Memory: Remember When (another tactic back, 2 hearts); Nostalgia (Fate 2 away, 3 hearts); Total Recall (two creatures, 3 hearts)', () => {
    let s = table('remember-when');
    assert.equal(offered(s), false, 'no tactic in the discard pile');
    toDiscard(s, 'p0c2');
    assert.equal(offered(s), false, 'a creature is not a tactic');
    toDiscard(s, 'p0t1', 'p0t2');
    s.players[0].hearts = 5;
    s = cast(s);
    assert.equal(s.players[0].hearts, 7);
    assert.deepEqual(plain(E.legalActions(s).map(a => a.choice)).sort(), ['p0t1', 'p0t2'], 'never itself');
    s = act(s, { type: 'choose', choice: 'p0t2' });
    assert.ok(s.players[0].hand.includes('p0t2'));
    s = table('remember-when', { t0: ['remember-when', 'remember-when'] });
    toDiscard(s, 'p0t1');
    assert.equal(offered(s), false, 'not another Remember When (no loops)');

    s = table('nostalgia', { options: { timeline: true } });
    s.players[0].hearts = 5;
    s.fate.until = 3;
    s = cast(s);
    assert.equal(s.players[0].hearts, 8);
    assert.equal(s.fate.until, 5);
    s = table('nostalgia');
    assert.equal(offered(s), false, 'no Fate track and full hearts');
    s.players[0].hearts = 9;
    assert.equal(offered(s), true);

    s = table('total-recall');
    assert.equal(offered(s), false, 'full hearts, no creature in the discard pile');
    toDiscard(s, 'p0c2', 'p0c3');
    s.players[0].hearts = 5;
    s = cast(s);
    assert.equal(s.players[0].hearts, 8);
    assert.equal(s.phase, 'choose');
    s = act(s, { type: 'choose', choice: 'p0c3' });   // the last one is answered at once
    assert.ok(s.players[0].hand.includes('p0c2') && s.players[0].hand.includes('p0c3'));
    assert.equal(s.phase, 'main');
    s = table('total-recall');
    s.players[0].hearts = 5;
    s = cast(s);
    assert.equal(s.players[0].hearts, 8, 'hearts alone are enough to play it');
});

test('colour tactics are deterministic, keep the card invariants and are played by the AI', () => {
    const ids = Object.values(COLOUR).flat();
    const species = ['astrophysicat', 'eelish', 'kardashiant', 'beansprout', 'zuckerborg', 'siuuugull'];
    const team = tag => Array.from({ length: 10 }, (_, i) => ({ uid: tag + i, species: species[(i + tag.length) % 6], powerDelta: 0, injuries: [], scars: [], warped: null, trophyOf: null }));
    const played = {};
    for (let g = 0; g < 12; g++) {
        const make = () => E.createBattle({ seed: 'colour-' + g, players: [
            { name: 'A', team: team('a'), tactics: ids.map((x, i) => ids[(i + g) % 18]).slice(0, 10) },
            { name: 'B', team: team('bb'), tactics: ids.map((x, i) => ids[(i + g + 9) % 18]).slice(0, 10) },
        ], options: { mode: 'trainer' } });
        const steps = [];
        const end = AI.playOut(make(), ['hard', g % 2 ? 'easy' : 'hard'], (prev, a, next) => {
            invariants(next, assert);
            steps.push(E.actionKey(a));
            next.lastEvents.forEach(e => { if (e.t === 'tactic-play' && ids.includes(e.id)) played[e.id] = (played[e.id] || 0) + 1; });
        });
        const again = [];
        AI.playOut(make(), ['hard', g % 2 ? 'easy' : 'hard'], (prev, a) => again.push(E.actionKey(a)));
        assert.deepEqual(again, steps, 'same seed, same game');
        assert.ok(end.winner != null);
    }
    assert.ok(Object.keys(played).length >= 12, 'the AI plays most colour tactics: ' + Object.keys(played).join(', '));
});

test('team codes keep colour tactics only with a creature of their colour', () => {
    const R = loadRift([
        'js/core/rift.js', 'js/core/state.js', 'data/creatures.js', 'data/items.js', 'data/axioms.js', 'data/tactics.js',
        'js/battle/abilities.js', 'js/battle/engine.js', 'js/battle/team-codes.js',
    ]);
    const TC = R.Battle.TeamCodes;
    const creatures = [{ uid: 'c1', species: 'astrophysicat' }, { uid: 'c2', species: 'kardashiant' }];
    const code = TC.exportTeam({ nickname: 'Ida', creatures, tactics: ['qed', 'daydream', 'look-closer', 'counterexample'] });
    const back = TC.importTeam(code);
    assert.deepEqual(plain(back.tactics), ['qed', 'look-closer', 'counterexample'], 'export leaves out Daydream (no Imagination creature)');
    // A code made elsewhere with an offending tactic: dropped and flagged, not refused.
    const payload = R.State.decode('team', code);
    payload.k = ['daydream', 'step-by-step'];
    const odd = TC.importTeam(R.State.encode('team', payload));
    assert.deepEqual(plain(odd.tactics), ['step-by-step']);
    assert.deepEqual(plain(odd.droppedTactics), ['daydream']);
});

// ---- unlocks and grants ------------------------------------------------------------------------------

test('the first creature of a colour unlocks that colour\'s common; also for an old save; grantTactic for the rest', () => {
    const S = Rift.State;
    const save = S.freshState();
    assert.deepEqual(plain(S.unlockColourTactics(save)), []);
    save.creatures.push(S.makeCreature('astrophysicat'));
    assert.deepEqual(plain(S.unlockColourTactics(save)), ['step-by-step']);
    assert.deepEqual(plain(S.unlockColourTactics(save)), [], 'only once');
    save.creatures.push(S.makeCreature('eelish'), S.makeCreature('rawmsay'));
    assert.deepEqual(plain(S.unlockColourTactics(save)), ['gut-reaction']);
    assert.ok(!S.ownedTactics(save).includes('proof-by-contradiction'), 'uncommons are not unlocked by catching');
    assert.equal(S.grantTactic('qed', save), true);
    assert.equal(S.grantTactic('qed', save), false, 'already owned');
    assert.equal(S.grantTactic('counterexample', save), false, 'starter tactics are owned by everyone');
    assert.equal(S.grantTactic('no-such-tactic', save), false);
    assert.ok(S.ownedTactics(save).includes('qed'));
    // An old (version 1) save with creatures of two colours gets their commons on load.
    const old = { version: 1, creatures: [{ uid: 'old-1', species: 'kardashiant' }, { uid: 'old-2', species: 'keanu' }], items: {}, flags: {} };
    assert.deepEqual(plain(S.migrate(plain(old)).tactics).sort(), ['look-closer', 'remember-when']);
    // A current save made before colour tactics existed gets them on load too; trophies count.
    const cur = S.freshState();
    cur.creatures.push({ uid: 'x1', species: 'muskrat', variant: { attack: 0, health: 0, trait: null } });
    cur.trophies.push({ uid: 't1', species: 'beansprout' });
    cur.tactics = ['lemma'];
    assert.deepEqual(plain(S.migrate(plain(cur)).tactics), ['lemma', 'daydream', 'label-it']);
});

test('the default deck drops colour tactics whose colour is not in the battle team', () => {
    const S = Rift.State;
    const save = S.freshState();
    save.creatures.push(S.makeCreature('astrophysicat'), S.makeCreature('kardashiant'));
    S.unlockColourTactics(save);
    S.grantTactic('daydream', save);
    save.deckTactics = ['step-by-step', 'look-closer', 'daydream', 'counterexample', 'pep-talk', 'stand-firm'];
    assert.deepEqual(plain(S.deckTactics(save)), ['step-by-step', 'look-closer', 'counterexample', 'pep-talk', 'stand-firm']);
    save.team = [save.creatures[1].uid];
    assert.ok(!S.deckTactics(save).includes('step-by-step'), 'the Reason creature is not in the chosen team');
});

test('a trainer whose earned tactics are all owned gives the uncommon of the team\'s main colour', () => {
    const R = loadRift([
        'js/core/rift.js', 'js/core/state.js', 'data/creatures.js', 'data/items.js', 'data/axioms.js', 'data/tactics.js', 'data/map.js', 'js/core/world.js',
    ]);
    const st = R.State.freshState();
    st.tactics = R.data.tacticDecks.earned.slice();
    const r = R.World.claimTrainerReward(st, 'syllo');   // Syllo: mostly Reason
    assert.equal(r.tactic, 'proof-by-contradiction');
    assert.ok(st.tactics.includes('proof-by-contradiction'));
});
