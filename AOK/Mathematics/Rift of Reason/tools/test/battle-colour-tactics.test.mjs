// Colour tactics (design/card-arena-expansion-2026-10-07.md, section 2): each tactic's effect,
// its In tune bonus, `usable`, determinism, AI play and the unlock (also from an old save).
// Stats are set explicitly with stats() so these tests survive balance changes.
import test from 'node:test';
import assert from 'node:assert/strict';
import { Rift, E, AI, setup, act, onBoard, toHand, toDiscard, pass, hp, atk, plain, stats, invariants } from './battle-helpers.mjs';

const T = Rift.data.tactics;
const COLOUR = Rift.data.tacticDecks.colour;
const legal = (s, pred) => E.legalActions(s).filter(pred);
const offered = s => legal(s, a => a.cid === 'p0t0').length > 0;
const targets = s => plain(legal(s, a => a.cid === 'p0t0').map(a => a.target)).sort();
const cast = (s, target) => act(s, Object.assign({ type: 'play', cid: 'p0t0' }, target ? { target } : {}));

// One creature of `colour` for player 0 (put on the board when tuned), a plain off-colour
// friend p0c1 on the board, and two enemies. Colours: Kardashiant perception, Astrophysicat reason,
// Eelish emotion, Beansprout language, Zuckerborg imagination, Siuuugull memory.
const OF = { perception: 'kardashiant', reason: 'astrophysicat', emotion: 'eelish', language: 'beansprout', imagination: 'zuckerborg', memory: 'siuuugull' };
const OFF = { perception: 'astrophysicat', reason: 'kardashiant', emotion: 'kardashiant', language: 'kardashiant', imagination: 'kardashiant', memory: 'kardashiant' };
function table(id, tuned, extra) {
    const colour = T[id].colour;
    const s = setup(Object.assign({
        p0: [OF[colour], OFF[colour], OFF[colour], OFF[colour]], p1: ['kardashiant', 'astrophysicat'],
        t0: [id, 'counterexample', 'pep-talk'],
    }, extra));
    onBoard(s, 'p0c1', 'p1c0', 'p1c1');
    if (tuned) onBoard(s, 'p0c0');
    stats(s, 'p0c0', 2, 3);
    stats(s, 'p0c1', 2, 4);
    stats(s, 'p1c0', 3, 5);
    stats(s, 'p1c1', 2, 4);
    toHand(s, 'p0t0');
    assert.equal(E.inTune(s, 0, colour), !!tuned, id + ': in tune set-up');
    return s;
}

test('twelve colour tactics, two per colour, each with a colour, an In tune line and art id; the fifteen old ones stay colourless', () => {
    const ids = Object.values(COLOUR).flat();
    assert.equal(ids.length, 12);
    assert.deepEqual(Object.keys(COLOUR).sort(), Object.keys(Rift.COLOURS).sort());
    Object.entries(COLOUR).forEach(([colour, list]) => {
        assert.equal(list.length, 2, colour);
        list.forEach(id => {
            assert.ok(T[id], id);
            assert.equal(T[id].colour, colour, id);
            assert.ok(T[id].inTune && T[id].text && typeof T[id].run === 'function', id);
            assert.ok(T[id].name.length <= 24 && T[id].text.length <= 70 && T[id].inTune.length <= 50, id + ': short card text');
        });
    });
    const old = Object.keys(T).filter(id => !ids.includes(id));
    assert.equal(old.length, 15);
    old.forEach(id => assert.equal(T[id].colour, undefined, id));
    const D = Rift.data.tacticDecks;
    ids.forEach(id => assert.ok(!D.starter.includes(id) && !D.earned.includes(id), id + ' is not a starter or trainer reward'));
});

test('In tune: a creature of that colour on your own board (not in hand, not the enemy\'s, not a nicknamed one)', () => {
    const s = table('step-by-step', false);
    assert.equal(E.inTune(s, 0, 'reason'), false, 'p0c0 still in the deck');
    assert.ok(s.cards.p1c1.species === 'astrophysicat' && s.players[1].board.includes('p1c1'));
    assert.equal(E.inTune(s, 1, 'reason'), true, 'the enemy\'s creature tunes only the enemy');
    toHand(s, 'p0c0');
    assert.equal(E.inTune(s, 0, 'reason'), false, 'in hand only');
    onBoard(s, 'p0c0');
    assert.equal(E.inTune(s, 0, 'reason'), true);
    s.cards.p0c0.colourless = true;
    assert.equal(E.inTune(s, 0, 'reason'), false, 'a nicknamed creature has no colour');
    const d = E.describe(table('step-by-step', true), 'p0t0');
    assert.equal(d.colour, 'reason');
    assert.equal(d.inTune, true);
    assert.equal(d.inTuneText, T['step-by-step'].inTune);
    assert.equal(E.describe(table('step-by-step', false), 'p0t0').inTune, false);
    assert.equal(E.describe(table('step-by-step', true), 'p0t1').colour, null, 'a colourless tactic');
});

test('Reason: Proof by Contradiction (2 damage, 3 in tune) and Step by Step (draw 1, 2 in tune)', () => {
    assert.deepEqual(targets(table('proof-by-contradiction', false)), ['p1c0', 'p1c1'], 'enemy creatures only');
    assert.equal(hp(cast(table('proof-by-contradiction', false), 'p1c0'), 'p1c0'), 3);
    let s = cast(table('proof-by-contradiction', true), 'p1c0');
    assert.equal(hp(s, 'p1c0'), 2);
    assert.match(s.lastEvents.find(e => e.t === 'tactic').text, /in tune/);
    s = table('step-by-step', false);
    const before = s.players[0].hand.length;
    assert.equal(cast(s).players[0].hand.length, before);   // −1 played, +1 drawn
    assert.equal(cast(table('step-by-step', true)).players[0].hand.length, before + 1);
    s = table('step-by-step', true);
    s.players[0].discard.push(...s.players[0].deck.splice(0));
    assert.equal(offered(s), false, 'empty deck: not offered');
});

test('Emotion: Rally Cry (+1 attack, +1/+1 in tune) and Gut Reaction (2 to the enemy hero, 3 in tune)', () => {
    let s = cast(table('rally-cry', false));
    assert.equal(atk(s, 'p0c1'), 3);
    assert.equal(hp(s, 'p0c1'), 4);
    assert.equal(atk(s, 'p1c0'), 3, 'enemy creatures are untouched');
    s = cast(table('rally-cry', true));
    assert.equal(atk(s, 'p0c1'), 3);
    assert.equal(hp(s, 'p0c1'), 5);
    assert.equal(hp(s, 'p0c0'), 4);
    s = table('rally-cry', false);
    s.players[0].board = [];
    s.players[0].discard.push('p0c1');
    assert.equal(offered(s), false, 'no creatures: not offered');
    assert.equal(cast(table('gut-reaction', false)).players[1].hearts, 8);
    assert.equal(cast(table('gut-reaction', true)).players[1].hearts, 7);
    assert.equal(cast(table('gut-reaction', true)).players[0].hearts, 10);
});

test('Perception: Look Closer strips Guard, Elusive and Shield (even from an Elusive enemy), draws in tune', () => {
    let s = table('look-closer', false);
    assert.equal(offered(s), false, 'no enemy has Guard, Elusive or Shield');
    s.cards.p1c0.baseKeywords = ['guard', 'shield'];
    s.cards.p1c1.extraKeywords = ['elusive'];
    assert.deepEqual(targets(s), ['p1c0', 'p1c1'], 'Elusive does not hide from it');
    const hand = s.players[0].hand.length;
    s = cast(s, 'p1c0');
    assert.deepEqual(plain(E.keywordsOf(s, 'p1c0')), []);
    assert.equal(s.players[0].hand.length, hand - 1, 'no draw when not in tune');
    // Without the Guard the attacker may now hit the hero.
    assert.ok(legal(s, a => a.type === 'attack' && a.cid === 'p0c1').some(a => a.target === 'h1'));
    // An ability's Elusive (Shakirattle) goes too; in tune draws a card.
    s = table('look-closer', true, { p1: ['shakirattle', 'astrophysicat'] });
    assert.ok(E.keywordsOf(s, 'p1c0').includes('elusive'));
    const h2 = s.players[0].hand.length;
    s = cast(s, 'p1c0');
    assert.ok(!E.keywordsOf(s, 'p1c0').includes('elusive'));
    assert.equal(s.players[0].hand.length, h2, 'played one, drew one');
    // A lost keyword can be given back (Stand Firm), and the loss ends when the creature leaves the board.
    s = table('look-closer', false, { p1: ['kardashiant', 'astrophysicat'], t1: ['stand-firm'] });
    s.cards.p1c0.baseKeywords = ['guard'];
    s = cast(s, 'p1c0');
    assert.ok(!E.keywordsOf(s, 'p1c0').includes('guard'));
    s = pass(s);
    toHand(s, 'p1t0');
    s = act(s, { type: 'play', cid: 'p1t0', target: 'p1c0' });
    assert.ok(E.keywordsOf(s, 'p1c0').includes('guard'), 'Stand Firm gives Guard back');
    s = table('look-closer', false, { t0: ['look-closer', 'rethink'] });
    s.cards.p1c0.baseKeywords = ['guard'];
    s = cast(s, 'p1c0');
    toHand(s, 'p0t1');
    s = act(s, { type: 'play', cid: 'p0t1', target: 'p1c0' });
    assert.equal(s.cards.p1c0.lostKeywords, null, 'back in the hand: the loss is forgotten');
    onBoard(s, 'p1c0');
    assert.ok(E.keywordsOf(s, 'p1c0').includes('guard'));
});

test('Perception: Field Notes fully heals and gives +1 health (+1/+1 in tune)', () => {
    let s = table('field-notes', false);
    s.cards.p0c1.damage = 3;
    s = cast(s, 'p0c1');
    assert.equal(hp(s, 'p0c1'), 5);
    assert.equal(atk(s, 'p0c1'), 2);
    s = table('field-notes', true);
    s.cards.p0c1.damage = 3;
    s = cast(s, 'p0c1');
    assert.equal(hp(s, 'p0c1'), 5);
    assert.equal(atk(s, 'p0c1'), 3);
    assert.deepEqual(targets(table('field-notes', false)), ['p0c1'], 'friendly creatures only');
});

test('Language: Label It sets an enemy\'s attack to 1 (and it can\'t attack next turn in tune); Rousing Speech +1/+1 (+2 hearts in tune)', () => {
    let s = table('label-it', false);
    stats(s, 'p1c1', 1, 4);
    assert.deepEqual(targets(s), ['p1c0'], 'only targets with 2 or more attack');
    s = cast(s, 'p1c0');
    assert.equal(atk(s, 'p1c0'), 1);
    s = pass(s);
    assert.equal(E.canAttack(s, 'p1c0'), true, 'not in tune: it can still attack');
    s = cast(table('label-it', true), 'p1c0');
    assert.equal(atk(s, 'p1c0'), 1);
    s = pass(s);
    assert.equal(E.canAttack(s, 'p1c0'), false, 'in tune: it can\'t attack on its next turn');
    s = pass(s);
    assert.equal(atk(s, 'p1c0'), 1, 'the label stays');
    s = table('rousing-speech', false);
    s.players[0].hearts = 5;
    s = cast(s);
    assert.equal(atk(s, 'p0c1'), 3);
    assert.equal(hp(s, 'p0c1'), 5);
    assert.equal(s.players[0].hearts, 5);
    s = table('rousing-speech', true);
    s.players[0].hearts = 5;
    s = cast(s);
    assert.equal(s.players[0].hearts, 7);
    assert.equal(hp(s, 'p0c0'), 4);
});

test('Imagination: Imagine Otherwise swaps attack and health (draw in tune); Daydream gives Elusive and +1 (+2 in tune)', () => {
    let s = table('imagine-otherwise', false);
    stats(s, 'p1c1', 3, 3);
    assert.ok(!targets(s).includes('p1c1'), 'equal attack and health: nothing to swap');
    s = cast(s, 'p1c0');              // 3/5 → 5/3
    assert.equal(atk(s, 'p1c0'), 5);
    assert.equal(hp(s, 'p1c0'), 3);
    s = table('imagine-otherwise', false);
    s.cards.p0c1.damage = 1;          // 2 attack, 3 of 4 health, +2/+2 from Pep Talk → 4/5 (damaged)
    s.cards.p0c1.buffs.push({ label: 'Pep talk', attack: 2, health: 2, temp: false });
    s = cast(s, 'p0c1');
    assert.equal(atk(s, 'p0c1'), 5);
    assert.equal(hp(s, 'p0c1'), 4);
    assert.equal(E.healthOf(s, 'p0c1').max, 4);
    s = table('imagine-otherwise', false);
    stats(s, 'p1c1', 0, 4);
    s = cast(s, 'p1c1');              // 0 attack → 0 health: defeated
    assert.ok(s.players[1].discard.includes('p1c1'));
    const t = table('imagine-otherwise', true);
    const n = t.players[0].hand.length;
    assert.equal(cast(t, 'p1c0').players[0].hand.length, n, 'played one, drew one');

    s = cast(table('daydream', false), 'p0c1');
    assert.equal(atk(s, 'p0c1'), 3);
    assert.ok(E.keywordsOf(s, 'p0c1').includes('elusive'));
    s = cast(table('daydream', true), 'p0c1');
    assert.equal(atk(s, 'p0c1'), 4);
    // The enemy's tactics can no longer target it.
    s = pass(s);
    s.players[1].hand.push(...s.players[1].deck.filter(cid => s.cards[cid].kind === 'tactic'));
    assert.ok(!E.legalActions(s).some(a => a.type === 'play' && a.target === 'p0c1'));
});

test('Memory: Remember When brings back another tactic (+2 hearts in tune); Nostalgia rewinds Fate 2 and restores 2 (3 in tune)', () => {
    let s = table('remember-when', false);
    assert.equal(offered(s), false, 'no tactic in the discard pile');
    toDiscard(s, 'p0c2');
    assert.equal(offered(s), false, 'a creature is not a tactic');
    toDiscard(s, 'p0t1', 'p0t2');
    assert.equal(offered(s), true);
    s.players[0].hearts = 5;
    s = cast(s);
    assert.equal(s.phase, 'choose');
    assert.deepEqual(plain(E.legalActions(s).map(a => a.choice)).sort(), ['p0t1', 'p0t2'], 'never itself');
    s = act(s, { type: 'choose', choice: 'p0t2' });
    assert.ok(s.players[0].hand.includes('p0t2'));
    assert.equal(s.players[0].hearts, 5);
    s = table('remember-when', true);
    toDiscard(s, 'p0t1');
    s.players[0].hearts = 5;
    s = cast(s);                       // one option: answered at once
    assert.ok(s.players[0].hand.includes('p0t1'));
    assert.equal(s.players[0].hearts, 7);
    // Another copy of Remember When in the discard pile is not an option (no loops).
    s = table('remember-when', false, { t0: ['remember-when', 'remember-when'] });
    toDiscard(s, 'p0t1');
    assert.equal(offered(s), false);

    s = table('nostalgia', false, { options: { timeline: true } });
    s.players[0].hearts = 5;
    s.fate.until = 3;
    s = cast(s);
    assert.equal(s.players[0].hearts, 7);
    assert.equal(s.fate.until, 5);
    s = table('nostalgia', true, { options: { timeline: true } });
    s.players[0].hearts = 5;
    assert.equal(cast(s).players[0].hearts, 8);
    s = table('nostalgia', false);   // no Fate track, full hearts: nothing to do
    assert.equal(offered(s), false);
    s.players[0].hearts = 9;
    assert.equal(offered(s), true);
    s = table('nostalgia', false, { options: { timeline: true } });
    s.fate.until = s.options.fateMax;
    assert.equal(offered(s), false, 'Fate already as far away as it goes, hearts full');
});

test('colour tactics are deterministic and keep the card invariants in AI play', () => {
    const ids = Object.values(COLOUR).flat();
    const team = sp => Array.from({ length: 10 }, (_, i) => ({ uid: sp + i, species: ['astrophysicat', 'eelish', 'kardashiant', 'beansprout', 'zuckerborg', 'siuuugull'][(i + sp.length) % 6], powerDelta: 0, injuries: [], scars: [], warped: null, trophyOf: null }));
    const played = {};
    for (let g = 0; g < 12; g++) {
        const make = () => E.createBattle({ seed: 'colour-' + g, players: [
            { name: 'A', team: team('a'), tactics: ids.slice(0, 10).concat(ids.slice(0, 0)).map((x, i) => ids[(i + g) % 12]) },
            { name: 'B', team: team('bb'), tactics: ids.map((x, i) => ids[(i + g + 5) % 12]).slice(0, 10) },
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
    const seen = Object.keys(played);
    assert.ok(seen.length >= 10, 'the AI plays most colour tactics: ' + seen.join(', '));
});

// ---- unlocks --------------------------------------------------------------------------------------------

test('a colour\'s two tactics unlock with the first creature of that colour, also for an old save', () => {
    const S = Rift.State;
    const save = S.freshState();
    assert.deepEqual(plain(S.unlockColourTactics(save)), []);
    save.creatures.push(S.makeCreature('astrophysicat'));
    assert.deepEqual(plain(S.unlockColourTactics(save)), ['proof-by-contradiction', 'step-by-step']);
    assert.deepEqual(plain(S.unlockColourTactics(save)), [], 'only once');
    assert.ok(S.ownedTactics(save).includes('step-by-step'));
    save.creatures.push(S.makeCreature('eelish'), S.makeCreature('rawmsay'));
    assert.deepEqual(plain(S.unlockColourTactics(save)), ['rally-cry', 'gut-reaction']);
    // An old (version 1) save with creatures of two colours gets their four tactics on load.
    const old = { version: 1, creatures: [{ uid: 'old-1', species: 'kardashiant' }, { uid: 'old-2', species: 'keanu' }], items: {}, flags: {} };
    const m = S.migrate(plain(old));
    assert.deepEqual(plain(m.tactics).sort(), ['field-notes', 'look-closer', 'nostalgia', 'remember-when']);
    // A current save without them (made before colour tactics existed) gets them on load too.
    const cur = S.freshState();
    cur.creatures.push({ uid: 'x1', species: 'muskrat', variant: { attack: 0, health: 0, trait: null } });
    cur.tactics = ['lemma'];
    assert.deepEqual(plain(S.migrate(plain(cur)).tactics), ['lemma', 'imagine-otherwise', 'daydream']);
    // Trophy copies count as creatures you own.
    const t = S.freshState();
    t.trophies.push({ uid: 't1', species: 'beansprout' });
    assert.deepEqual(plain(S.unlockColourTactics(t)), ['label-it', 'rousing-speech']);
});
