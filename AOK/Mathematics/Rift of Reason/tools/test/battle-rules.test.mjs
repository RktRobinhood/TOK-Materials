// Card Arena rules: combat, keywords, every axiom, every creature ability and every tactic.
// Stats are set explicitly with stats() so these tests survive balance changes.
import test from 'node:test';
import assert from 'node:assert/strict';
import { Rift, E, setup, act, onBoard, toHand, toDiscard, rule, pass, hp, atk, events, plain, stats } from './battle-helpers.mjs';

const same = (a, b, m) => assert.deepEqual(plain(a), b, m);
const legal = (s, pred) => E.legalActions(s).filter(pred);
const targetsOf = (s, cid) => plain(legal(s, a => a.type === 'attack' && a.cid === cid).map(a => a.target)).sort();
// A plain fighter: Kim Kardashiant (perception) and Astrophysicat (reason) neither beat each other on the wheel.
const duel = (a, b, opts) => {
    const s = setup(Object.assign({ p0: ['kardashiant'], p1: ['astrophysicat'] }, opts));
    onBoard(s, 'p0c0', 'p1c0');
    stats(s, 'p0c0', a[0], a[1]);
    stats(s, 'p1c0', b[0], b[1]);
    return s;
};
const hit = (s, cid, target) => act(s, { type: 'attack', cid, target });

// ---- every ability used by a creature exists ------------------------------------------------

test('every creature has stats, a known ability and only known keywords', () => {
    Object.entries(Rift.data.creatures).forEach(([id, sp]) => {
        assert.ok(Rift.Battle.Abilities[sp.ability], id + ': missing ability ' + sp.ability);
        assert.ok(sp.cost >= 0 && sp.attack >= 0 && sp.health >= 1, id + ': stats');
        (sp.keywords || []).forEach(k => assert.ok(E.KEYWORDS.includes(k), id + ': keyword ' + k));
    });
    Object.entries(Rift.Battle.Abilities).forEach(([id, a]) => assert.ok(a.name && a.text, id));
});

// ---- combat ---------------------------------------------------------------------------------------

test('a fight: both deal damage at once, damage stays, and a defeated creature goes to the discard', () => {
    let s = duel([3, 6], [2, 5]);
    s = hit(s, 'p0c0', 'p1c0');
    assert.equal(hp(s, 'p1c0'), 2);
    assert.equal(hp(s, 'p0c0'), 4);
    same(events(s, 'fight').map(e => [e.pa, e.pb]), [[3, 2]]);
    s = pass(pass(s));
    assert.equal(hp(s, 'p1c0'), 2, 'damage stays');
    s = hit(s, 'p0c0', 'p1c0');
    assert.ok(s.players[1].discard.includes('p1c0'));
    assert.equal(s.cards.p1c0.damage, 0, 'a defeated card is reset');
    assert.equal(events(s, 'defeated').length, 1);
    assert.equal(hp(s, 'p0c0'), 2);
});

test('an attack on a hero removes hearts equal to the attack; zero attack cannot attack', () => {
    let s = duel([3, 4], [0, 5]);
    s = hit(s, 'p0c0', 'h1');
    assert.equal(s.players[1].hearts, 7);
    s = pass(s);
    assert.equal(E.canAttack(s, 'p1c0'), false);
});

test('fightPreview matches what the fight does', () => {
    const s = duel([3, 4], [4, 3]);
    const f = E.fightPreview(s, 'p0c0', 'p1c0');
    assert.equal(f.attackerDefeated, true);
    assert.equal(f.defenderDefeated, true);
    const d = hit(s, 'p0c0', 'p1c0');
    assert.equal(d.players[0].board.length + d.players[1].board.length, 0);
    assert.equal(E.fightPreview(s, 'p0c0', 'h1').damage, 3);
});

// ---- Guard, hidden, Shield, damage reduction, healing ------------------------------------------------

test('Guard: attacks must target a Guard creature; the Axiom of Choice and Lightning ignore it', () => {
    const s = setup({ p0: ['kardashiant', 'usainvolt'], p1: ['khaby', 'astrophysicat'] });
    onBoard(s, 'p0c0', 'p0c1', 'p1c0', 'p1c1');
    same(targetsOf(s, 'p0c0'), ['p1c0']);
    same(targetsOf(s, 'p0c1'), ['h1', 'p1c0', 'p1c1'], 'Lightning ignores Guard');
    rule(s, 'choice');
    same(targetsOf(s, 'p0c0'), ['h1', 'p1c0', 'p1c1']);
});

test('Unprovable cannot be attacked while its side has another creature, and is Elusive', () => {
    const s = setup({ p0: ['kardashiant'], p1: ['godelix', 'astrophysicat'], t0: ['counterexample'] });
    onBoard(s, 'p0c0', 'p1c0', 'p1c1');
    toHand(s, 'p0t0');
    same(targetsOf(s, 'p0c0'), ['h1', 'p1c1']);
    assert.equal(E.isHidden(s, 'p1c0'), true);
    assert.ok(!legal(s, a => a.cid === 'p0t0').some(a => a.target === 'p1c0'), 'enemy tactics cannot target it');
    toDiscard(s, 'p1c1');
    same(targetsOf(s, 'p0c0'), ['h1', 'p1c0']);
});

test('Shield cancels the first damage and pops; Safety Net gives it back', () => {
    let s = setup({ p0: ['kardashiant'], p1: ['beansprout'], t1: ['safety-net'] });
    onBoard(s, 'p0c0', 'p1c0');
    stats(s, 'p0c0', 2, 9);
    stats(s, 'p1c0', 1, 3);
    s = hit(s, 'p0c0', 'p1c0');
    assert.equal(hp(s, 'p1c0'), 3);
    assert.ok(!E.keywordsOf(s, 'p1c0').includes('shield'));
    assert.equal(events(s, 'shield').length, 1);
    s = pass(s);
    toHand(s, 'p1t0');
    s = act(s, { type: 'play', cid: 'p1t0', target: 'p1c0' });
    assert.ok(E.keywordsOf(s, 'p1c0').includes('shield'));
});

test('The Eyebrow takes 1 less damage from each hit', () => {
    let s = setup({ p0: ['kardashiant'], p1: ['rockodile'] });
    onBoard(s, 'p0c0', 'p1c0');
    stats(s, 'p0c0', 3, 9);
    stats(s, 'p1c0', 1, 6);
    s = hit(s, 'p0c0', 'p1c0');
    assert.equal(hp(s, 'p1c0'), 4);
});

test('Rest and Recover (vigilance) heals creatures fully at the start of their controller\'s turn', () => {
    let s = duel([2, 9], [2, 9]);
    rule(s, 'vigilance');
    s = hit(s, 'p0c0', 'p1c0');
    s = act(s, { type: 'end' });
    assert.equal(hp(s, 'p1c0'), 9, 'player 1 heals at the start of its turn');
    assert.equal(hp(s, 'p0c0'), 7, 'player 0 waits for its own turn');
    s = act(act(s, { type: 'draw', choice: 'deck' }), { type: 'end' });
    assert.equal(hp(s, 'p0c0'), 9);
});

// ---- combat axioms -----------------------------------------------------------------------------------

test('Axiom of the Underdog: only the lower attack deals damage; equal attack, both do', () => {
    let s = rule(duel([4, 5], [1, 5]), 'underdog');
    let d = hit(s, 'p0c0', 'p1c0');
    assert.equal(hp(d, 'p1c0'), 5);
    assert.equal(hp(d, 'p0c0'), 4);
    assert.equal(E.fightPreview(s, 'p0c0', 'p1c0').toDefender, 0);
    s = rule(duel([2, 5], [2, 5]), 'underdog');
    d = hit(s, 'p0c0', 'p1c0');
    assert.equal(hp(d, 'p1c0'), 3);
    assert.equal(hp(d, 'p0c0'), 3);
});

test('Law of the Excluded Middle: no double defeat; the defender survives on 1 health', () => {
    const s = rule(duel([3, 3], [3, 3]), 'excluded-middle');
    assert.equal(E.fightPreview(s, 'p0c0', 'p1c0').defenderDefeated, false);
    const d = hit(s, 'p0c0', 'p1c0');
    assert.ok(d.players[0].discard.includes('p0c0'));
    assert.equal(hp(d, 'p1c0'), 1);
});

test('Axiom of Extensionality: equal attacks deal no damage to each other', () => {
    const d = hit(rule(duel([3, 3], [3, 3]), 'extensionality'), 'p0c0', 'p1c0');
    assert.equal(hp(d, 'p0c0'), 3);
    assert.equal(hp(d, 'p1c0'), 3);
    const e = hit(rule(duel([3, 3], [2, 3]), 'extensionality'), 'p0c0', 'p1c0');
    assert.equal(e.players[1].board.length, 0);
});

test('Hasty Generalisation: a creature that defeats an enemy in a fight and survives gets +1/+1', () => {
    const d = hit(rule(duel([3, 5], [1, 2]), 'induction'), 'p0c0', 'p1c0');
    assert.equal(atk(d, 'p0c0'), 4);
    assert.equal(E.healthOf(d, 'p0c0').max, 6);
});

test('Axiom of Mercy: defeated creatures return to the owner\'s hand, healed', () => {
    const d = hit(rule(duel([3, 5], [1, 2]), 'mercy'), 'p0c0', 'p1c0');
    assert.ok(d.players[1].hand.includes('p1c0'));
    assert.equal(d.cards.p1c0.damage, 0);
    assert.equal(events(d, 'defeated')[0].dest, 'hand');
});

test('Axiom of the Crowd: +1 attack for every other friendly creature', () => {
    const s = setup({ p0: ['kardashiant', 'kardashiant', 'kardashiant'] });
    onBoard(s, 'p0c0', 'p0c1', 'p0c2');
    stats(s, 'p0c0', 1, 2);
    rule(s, 'crowd');
    assert.equal(atk(s, 'p0c0'), 3);
});

test('the colour wheel: +1 attack against the colour it beats; The Broken Postulate reverses it; Memory is outside', () => {
    // Astrophysicat is Reason, Billie Eelish is Emotion, Siuuugull is Memory.
    const s = setup({ p0: ['astrophysicat', 'siuuugull'], p1: ['eelish'] });
    onBoard(s, 'p0c0', 'p0c1', 'p1c0');
    stats(s, 'p0c0', 2, 5);
    stats(s, 'p1c0', 2, 6);
    assert.equal(E.attackOf(s, 'p0c0', 'p1c0'), 3);
    assert.equal(E.attackOf(s, 'p1c0', 'p0c0'), 2);
    assert.equal(E.attackOf(s, 'p0c0'), 2, 'no bonus against a hero');
    assert.equal(E.wheelBonus(s, s.cards.p0c1, s.cards.p1c0), 0);
    rule(s, 'curved-space');
    assert.equal(E.attackOf(s, 'p0c0', 'p1c0'), 2);
    assert.equal(E.attackOf(s, 'p1c0', 'p0c0'), 3);
    const d = hit(rule(s, 'age-of-reason'), 'p0c0', 'p1c0');
    assert.equal(d.axioms.active.colour, 'age-of-reason', 'a spotlight replaces the reversed wheel');
    assert.equal(hp(d, 'p1c0'), 6 - (2 + 1 + 2), 'Age of Reason: +2 attack for Reason, wheel normal again');
});

test('Axiom of Doubt: attacks on heroes remove only 1 heart', () => {
    const s = rule(setup({ p0: ['haalandroid'] }), 'doubt');
    onBoard(s, 'p0c0');
    assert.equal(hit(s, 'p0c0', 'h1').players[1].hearts, 9);
});

test('attack limits: One Step at a Time, Two Paths, Haste, and Rapid Fire', () => {
    const base = () => {
        const s = setup({ p0: ['kardashiant', 'kardashiant', 'kardashiant', 'eminemu'] });
        onBoard(s, 'p0c0', 'p0c1', 'p0c2', 'p0c3');
        return s;
    };
    let s = rule(base(), 'one-action');
    s = hit(s, 'p0c0', 'h1');
    assert.equal(legal(s, a => a.type === 'attack').length, 0);
    s = rule(base(), 'two-actions');
    s = hit(hit(s, 'p0c0', 'h1'), 'p0c1', 'h1');
    assert.equal(legal(s, a => a.type === 'attack').length, 0);
    s = rule(base(), 'haste');
    s = hit(hit(s, 'p0c0', 'h1'), 'p0c0', 'h1');
    assert.equal(E.canAttack(s, 'p0c0'), false);
    assert.equal(E.canAttack(s, 'p0c1'), true);
    s = hit(hit(base(), 'p0c3', 'h1'), 'p0c3', 'h1');
    assert.equal(E.canAttack(s, 'p0c3'), false, 'Rapid Fire attacks twice');
    assert.equal(s.players[1].hearts, 10 - 2 * Rift.data.creatures.eminemu.attack);
});

test('Axiom of Silence makes activations cost 1 more; the Empty Set switches abilities and keywords off', () => {
    let s = setup({ p0: ['astrophysicat', 'kardashiant'], p1: ['khaby', 'lobstorian'] });
    onBoard(s, 'p0c0', 'p0c1', 'p1c0');
    toHand(s, 'p1c1');
    rule(s, 'silence');
    assert.equal(E.activations(s, 'p0c0')[0].cost, 2);
    rule(s, 'empty-set');
    assert.equal(E.activations(s, 'p0c0').length, 0);
    same(targetsOf(s, 'p0c1'), ['h1', 'p1c0'], 'Guard is off');
    s = pass(s);
    s.players[1].energy = 10;
    s = act(s, { type: 'play', cid: 'p1c1' });
    assert.equal(s.players[1].board.includes('p1c1'), true);
    assert.equal(s.cards.p0c0.frozen, false, 'no Entrance under the Empty Set');
});

test('an axiom card replaces the rule in its category for both players and goes to the shared discard later', () => {
    let s = setup({});
    s.players[0].axHand = ['underdog', 'extensionality'];
    s = act(s, { type: 'axiom', choice: 'underdog' });
    assert.equal(s.axioms.active.combat, 'underdog');
    assert.equal(s.players[0].energy, 8);
    s = act(s, { type: 'axiom', choice: 'extensionality' });
    assert.equal(s.axioms.active.combat, 'extensionality');
    same(s.axioms.discard, ['underdog']);
    same(s.players[0].axHand, []);
    assert.equal(E.axiomCost(s, 'reverse-hearts'), 3);
    assert.equal(E.axiomCost(s, 'thrift'), 1);
});

// ---- abilities: Entrance -----------------------------------------------------------------------------------

test('Lecture: Guard; Entrance freezes an enemy creature for its next turn', () => {
    let s = setup({ p0: ['lobstorian'], p1: ['kardashiant'] });
    onBoard(s, 'p1c0');
    toHand(s, 'p0c0');
    same(legal(s, a => a.cid === 'p0c0').map(a => a.target), ['p1c0'], 'the target is part of the play');
    s = act(s, { type: 'play', cid: 'p0c0', target: 'p1c0' });
    assert.ok(E.keywordsOf(s, 'p0c0').includes('guard'));
    s = pass(s);
    assert.equal(E.canAttack(s, 'p1c0'), false);
    s = pass(pass(s));
    assert.equal(E.canAttack(s, 'p1c0'), true);
});

test('an Entrance with no legal target is played without one and fizzles', () => {
    let s = setup({ p0: ['lobstorian'] });
    toHand(s, 'p0c0');
    const plays = legal(s, a => a.cid === 'p0c0');
    assert.equal(plays.length, 1);
    assert.equal(plays[0].target, undefined);
    s = act(s, { type: 'play', cid: 'p0c0' });
    assert.equal(events(s, 'fizzle').length, 1);
});

test('Nickname: an enemy creature gets −2 attack and loses its colour', () => {
    let s = setup({ p0: ['tremendoodle'], p1: ['eelish'] });
    onBoard(s, 'p1c0');
    stats(s, 'p1c0', 3, 3);
    toHand(s, 'p0c0');
    s = act(s, { type: 'play', cid: 'p0c0', target: 'p1c0' });
    assert.equal(atk(s, 'p1c0'), 1);
    assert.equal(E.colourOf(s, s.cards.p1c0), 'none');
    assert.equal(E.describe(s, 'p1c0').colourless, true);
    assert.match(E.cardName(s, 'p1c0'), /Billie Eelish/);
});

test('Nickname: no colour at all, so no spotlight (not even Age of Tradition) and no colour wheel bonus', () => {
    // Siuuugull is Memory, Astrophysicat is Reason (beats Emotion), Billie Eelish is Emotion.
    let s = setup({ p0: ['tremendoodle', 'astrophysicat'], p1: ['siuuugull', 'eelish'] });
    onBoard(s, 'p0c1', 'p1c0', 'p1c1');
    stats(s, 'p1c0', 4, 9);
    stats(s, 'p1c1', 4, 9);
    stats(s, 'p0c1', 2, 9);
    toHand(s, 'p0c0');
    s = act(s, { type: 'play', cid: 'p0c0', target: 'p1c0' });
    rule(s, 'age-of-tradition');
    assert.equal(atk(s, 'p1c0'), 2, 'the −2 stays: a nicknamed Memory creature gets no Memory spotlight');
    assert.equal(E.attackOf(s, 'p0c1', 'p1c1'), 3, 'Reason beats Emotion');
    s.cards.p1c1.colourless = true; // as if nicknamed
    assert.equal(E.attackOf(s, 'p0c1', 'p1c1'), 2, 'no wheel bonus against a colourless creature');
    rule(s, 'curved-space');
    assert.equal(E.attackOf(s, 'p1c1', 'p0c1'), 4, 'and none for it, even with the wheel reversed');
    rule(s, 'age-of-feeling');
    assert.equal(atk(s, 'p1c1'), 4, 'no Emotion spotlight either');
    s.cards.p1c1.colourless = false;
    assert.equal(atk(s, 'p1c1'), 6);
});

test('It\'s Raw: Entrance defeats an enemy creature with 2 or less attack (only those are targets)', () => {
    let s = setup({ p0: ['rawmsay'], p1: ['kardashiant', 'astrophysicat'] });
    onBoard(s, 'p1c0', 'p1c1');
    stats(s, 'p1c0', 2, 9);
    stats(s, 'p1c1', 3, 1);
    toHand(s, 'p0c0');
    same(legal(s, a => a.cid === 'p0c0').map(a => a.target), ['p1c0']);
    s = act(s, { type: 'play', cid: 'p0c0', target: 'p1c0' });
    assert.ok(s.players[1].discard.includes('p1c0'));
});

test('Hype: Swift; Entrance gives the other creatures +1 attack this turn only', () => {
    let s = setup({ p0: ['speedcheeta', 'kardashiant'] });
    onBoard(s, 'p0c1');
    stats(s, 'p0c1', 1, 2);
    toHand(s, 'p0c0');
    s = act(s, { type: 'play', cid: 'p0c0' });
    assert.equal(atk(s, 'p0c1'), 2);
    assert.equal(E.canAttack(s, 'p0c0'), true);
    s = act(s, { type: 'end' });
    assert.equal(atk(s, 'p0c1'), 1);
});

test('Foresight: Entrance reveals the opponent\'s hand and draws a card', () => {
    let s = setup({ p0: ['carlseal', 'kardashiant'], p1: ['kardashiant', 'astrophysicat'] });
    toHand(s, 'p0c0', 'p1c0', 'p1c1');
    s = act(s, { type: 'play', cid: 'p0c0' });
    same(plain(s.players[0].knows).sort(), ['p1c0', 'p1c1']);
    assert.equal(s.players[0].hand.length, 1);
});

test('Let Me Be Clear: Guard; Entrance restores 3 hearts (never above the starting hearts)', () => {
    let s = setup({ p0: ['obambu', 'obambu'] });
    s.players[0].hearts = 5;
    toHand(s, 'p0c0', 'p0c1');
    s = act(s, { type: 'play', cid: 'p0c0' });
    assert.equal(s.players[0].hearts, 8);
    s.players[0].energy = 10;
    s = act(s, { type: 'play', cid: 'p0c1' });
    assert.equal(s.players[0].hearts, 10);
});

test('Whisper: Entrance silences an enemy creature (keywords, buffs and abilities)', () => {
    let s = setup({ p0: ['eelish'], p1: ['khaby'] });
    onBoard(s, 'p1c0');
    s.cards.p1c0.buffs.push({ label: 'x', attack: 2, health: 0 });
    toHand(s, 'p0c0');
    s = act(s, { type: 'play', cid: 'p0c0', target: 'p1c0' });
    same(E.keywordsOf(s, 'p1c0'), []);
    assert.equal(atk(s, 'p1c0'), s.cards.p1c0.attack);
    assert.equal(E.describe(s, 'p1c0').silenced, true);
    assert.match(events(s, 'ability')[0].text, /loses its abilities, keywords and boosts/);
});

test('losing abilities, keywords and boosts: every + bonus goes, penalties stay, and the texts say so', () => {
    let s = setup({ p0: ['kardashiant'], p1: ['astrophysicat'], t0: ['occams-razor'] });
    onBoard(s, 'p0c0', 'p1c0');
    stats(s, 'p1c0', 3, 4);
    const c = s.cards.p1c0;
    c.buffs.push({ label: 'Pep talk', attack: 2, health: 2 }, { label: 'Nickname', attack: -2, health: 0 });
    c.extraKeywords.push('guard');
    c.baseKeywords.push('swift'); // a natural or taught keyword
    c.nickname = 'Sad Astrophysicat';
    c.colourless = true;
    toHand(s, 'p0t0');
    s = act(s, { type: 'play', cid: 'p0t0', target: 'p1c0' });
    same(E.keywordsOf(s, 'p1c0'), []);
    same(plain(s.cards.p1c0.buffs.map(b => b.label)), ['Nickname']);
    assert.equal(atk(s, 'p1c0'), 1, 'base 3, the Nickname −2 stays');
    assert.equal(hp(s, 'p1c0'), 4);
    assert.equal(E.colourOf(s, s.cards.p1c0), 'none', 'still nicknamed');
    assert.equal(E.activations(s, 'p1c0').length, 0);
    const say = /loses its abilities, keywords and boosts\./;
    assert.match(events(s, 'tactic')[0].text, say);
    assert.match(Rift.data.tactics['occams-razor'].text, say);
    ['deadpan', 'whisper'].forEach(id => assert.match(Rift.Battle.Abilities[id].text, say, id));
    ['khaby', 'eelish'].forEach(id => assert.match(Rift.data.creatures[id].abilityText, say, id));
});

test('Nature Watch: look at the top three cards, keep one, the others go to the bottom', () => {
    let s = setup({ p0: ['attenbirdough', 'kardashiant', 'astrophysicat', 'keanu', 'khaby'] });
    toHand(s, 'p0c0');
    const top = s.players[0].deck.slice(0, 3);
    s = act(s, { type: 'play', cid: 'p0c0' });
    assert.equal(s.phase, 'choose');
    assert.equal(s.pending.kind, 'card');
    same(E.legalActions(s).map(a => a.choice), plain(top));
    s = act(s, { type: 'choose', choice: top[1] });
    assert.ok(s.players[0].hand.includes(top[1]));
    same(s.players[0].deck.slice(-2), [top[0], top[2]]);
    assert.equal(s.phase, 'main');
});

test('Axiomatic: choose one of the next five shared axioms; it takes effect now', () => {
    let s = setup({ p0: ['euclidon'], axioms: ['haste', 'underdog', 'mercy', 'study', 'choice', 'doubt'] });
    toHand(s, 'p0c0');
    s = act(s, { type: 'play', cid: 'p0c0' });
    same(E.legalActions(s).map(a => a.choice), ['haste', 'underdog', 'mercy', 'study', 'choice']);
    s = act(s, { type: 'choose', choice: 'mercy' });
    assert.equal(s.axioms.active.defeat, 'mercy');
    assert.ok(!s.axioms.deck.includes('mercy'));
});

test('Measure: Entrance deals 1 damage to every enemy creature', () => {
    let s = setup({ p0: ['tycho'], p1: ['kardashiant', 'astrophysicat'] });
    onBoard(s, 'p1c0', 'p1c1');
    stats(s, 'p1c0', 1, 1);
    stats(s, 'p1c1', 1, 3);
    toHand(s, 'p0c0');
    s = act(s, { type: 'play', cid: 'p0c0' });
    assert.ok(s.players[1].discard.includes('p1c0'));
    assert.equal(hp(s, 'p1c1'), 2);
});

test('Truth Table: TRUE gives the other friendly creatures +1/+1, FALSE gives enemies −1 attack', () => {
    const s = setup({ p0: ['booleon', 'kardashiant'], p1: ['astrophysicat'] });
    onBoard(s, 'p0c1', 'p1c0');
    stats(s, 'p0c1', 1, 1);
    stats(s, 'p1c0', 2, 2);
    toHand(s, 'p0c0');
    const asked = act(s, { type: 'play', cid: 'p0c0' });
    same(E.legalActions(asked).map(a => a.choice), ['true', 'false']);
    const t = act(asked, { type: 'choose', choice: 'true' });
    assert.equal(atk(t, 'p0c1'), 2);
    assert.equal(hp(t, 'p0c1'), 2);
    const f = act(asked, { type: 'choose', choice: 'false' });
    assert.equal(atk(f, 'p1c0'), 1);
    assert.equal(atk(f, 'p0c1'), 1);
});

// ---- abilities: Activate --------------------------------------------------------------------------------------

test('Well, Actually: pay 1 to draw; activating uses the creature\'s attack for the turn', () => {
    let s = setup({ p0: ['astrophysicat', 'kardashiant'] });
    onBoard(s, 'p0c0');
    s = act(s, { type: 'activate', cid: 'p0c0', ability: 'well-actually' });
    assert.equal(s.players[0].energy, 9);
    assert.equal(s.players[0].hand.length, 1);
    assert.equal(E.canAttack(s, 'p0c0'), false);
    let t = setup({ p0: ['astrophysicat'] });
    onBoard(t, 'p0c0');
    t = hit(t, 'p0c0', 'h1');
    assert.equal(E.canActivateNow(t, 'p0c0'), false, 'no activation after attacking');
    const u = setup({ p0: ['astrophysicat'] });
    toHand(u, 'p0c0');
    assert.equal(E.canActivateNow(act(u, { type: 'play', cid: 'p0c0' }), 'p0c0'), false, 'not while sleeping');
});

test('Next Year rewinds the Fate track 2 spaces', () => {
    let s = setup({ p0: ['muskrat'], options: { timeline: true } });
    onBoard(s, 'p0c0');
    s.fate.until = 3;
    s = act(s, { type: 'activate', cid: 'p0c0', ability: 'next-year' });
    assert.equal(s.fate.until, 5);
});

test('Predict: name a colour; if the opponent\'s next creature has it, +3/+3', () => {
    let s = setup({ p0: ['altmanta'], p1: ['rockodile', 'astrophysicat'] });
    onBoard(s, 'p0c0');
    stats(s, 'p0c0', 3, 4);
    toHand(s, 'p1c0', 'p1c1');
    s = act(s, { type: 'activate', cid: 'p0c0', ability: 'predict' });
    same(E.legalActions(s).map(a => a.choice), Object.keys(Rift.COLOURS));
    s = act(s, { type: 'choose', choice: 'emotion' });
    assert.equal(s.cards.p0c0.prediction, 'emotion');
    s = pass(s);
    s.players[1].energy = 10;
    const right = act(s, { type: 'play', cid: 'p1c0' });
    assert.equal(atk(right, 'p0c0'), 6);
    assert.equal(E.healthOf(right, 'p0c0').max, 7);
    const wrong = act(s, { type: 'play', cid: 'p1c1' });
    assert.equal(atk(wrong, 'p0c0'), 3);
    assert.equal(wrong.cards.p0c0.prediction, null);
});

test('Pull That Up: pay 2, look at the top three cards and keep one', () => {
    let s = setup({ p0: ['chimpossible', 'kardashiant', 'astrophysicat', 'keanu'] });
    onBoard(s, 'p0c0');
    const top = s.players[0].deck.slice(0, 3);
    s = act(s, { type: 'activate', cid: 'p0c0', ability: 'pull-that-up' });
    assert.equal(s.players[0].energy, 8);
    s = act(s, { type: 'choose', choice: top[2] });
    same(s.players[0].hand, [top[2]]);
});

test('Program and Reinvention gain an ability from the discard pile, never Program itself', () => {
    let s = setup({ p0: ['gargoyle', 'usainvolt', 'lovelace', 'eminemu'] });
    onBoard(s, 'p0c0');
    toDiscard(s, 'p0c1', 'p0c2', 'p0c3');
    s = act(s, { type: 'activate', cid: 'p0c0', ability: 'reinvention' });
    same(plain(E.legalActions(s).map(a => a.choice)).sort(), ['lightning', 'rapid-fire']);
    s = act(s, { type: 'choose', choice: 'lightning' });
    assert.ok(s.cards.p0c0.gained.includes('lightning'));
    assert.ok(E.keywordsOf(s, 'p0c0').includes('swift'));
    s = pass(pass(s));
    same(plain(E.legalActions(s).filter(a => a.type === 'activate').map(a => a.ability)), ['reinvention'], 'still Rapid Fire to gain');
    toHand(s, 'p0c3');
    assert.equal(E.legalActions(s).filter(a => a.type === 'activate').length, 0, 'it already has Lightning: nothing new to gain');
    const t = setup({ p0: ['lovelace', 'gargoyle'] });
    onBoard(t, 'p0c0');
    toDiscard(t, 'p0c1');
    assert.equal(legal(t, a => a.type === 'activate').length, 0, 'only Program-like abilities to copy: not offered');
    same(E.activations(t, 'p0c0').map(a => [a.id, a.usable]), [['program', false]]);
});

test('activations that would certainly do nothing are not offered', () => {
    // Pull That Up and Well, Actually: empty deck or full hand.
    const s = setup({ p0: ['chimpossible', 'astrophysicat', 'kardashiant'] });
    onBoard(s, 'p0c0', 'p0c1');
    const offered = x => plain(legal(x, a => a.type === 'activate').map(a => a.ability)).sort();
    same(offered(s), ['pull-that-up', 'well-actually']);
    s.players[0].discard.push(...s.players[0].deck.splice(0));
    same(offered(s), [], 'empty deck');
    s.players[0].deck.push(s.players[0].discard.pop());
    same(offered(s), ['pull-that-up', 'well-actually']);
    while (s.players[0].hand.length + s.players[0].axHand.length < 10) s.players[0].axHand.push('haste');
    same(offered(s), [], 'full hand');
    // Next Year and Filter need the Fate track.
    const m = setup({ p0: ['muskrat', 'kardashiant'] });
    onBoard(m, 'p0c0', 'p0c1');
    same(offered(m), []);
    const n = setup({ p0: ['muskrat', 'kardashiant'], options: { timeline: true } });
    onBoard(n, 'p0c0', 'p0c1');
    same(offered(n), ['filter', 'next-year']);
});

// ---- abilities: Last Word, passives and reactions -------------------------------------------------------------

test('Metaverse and Déjà Vu return to the hand once per match', () => {
    for (const species of ['zuckerborg', 'keanu']) {
        let s = duel([5, 9], [1, 1], { p1: [species] });
        s = hit(s, 'p0c0', 'p1c0');
        assert.ok(s.players[1].hand.includes('p1c0'), species + ' returns');
        onBoard(s, 'p1c0');
        stats(s, 'p1c0', 1, 1);
        s.cards.p0c0.attacks = 0;
        s = hit(s, 'p0c0', 'p1c0');
        assert.ok(s.players[1].discard.includes('p1c0'), species + ' only once');
    }
});

test('Mercy or a full hand does not use up a once-per-match Last Word', () => {
    let s = rule(duel([5, 9], [1, 1], { p1: ['zuckerborg'] }), 'mercy');
    s = hit(s, 'p0c0', 'p1c0');
    assert.ok(s.players[1].hand.includes('p1c0'));
    assert.equal(s.cards.p1c0.metaverseUsed, false);
    let f = duel([5, 9], [1, 1], { p1: ['zuckerborg'] });
    const P = f.players[1];
    while (P.hand.length + P.axHand.length < 10) P.axHand.push('haste');
    f = hit(f, 'p0c0', 'p1c0');
    assert.ok(f.players[1].discard.includes('p1c0'));
    assert.equal(f.cards.p1c0.metaverseUsed, false);
});

test('Easter Egg: +1/+1 whenever anyone plays an axiom card (not on a Fate flip)', () => {
    let s = setup({ p0: ['swiftlet'] });
    onBoard(s, 'p0c0');
    stats(s, 'p0c0', 2, 3);
    s.players[0].axHand = ['underdog'];
    s = act(s, { type: 'axiom', choice: 'underdog' });
    assert.equal(atk(s, 'p0c0'), 3);
    assert.equal(hp(s, 'p0c0'), 4);
});

test('Escalate: +1 attack per other creature played this match, at most +3', () => {
    const s = setup({ p0: ['beastie'] });
    onBoard(s, 'p0c0');
    stats(s, 'p0c0', 2, 3);
    s.players[0].playedCount = 3;
    assert.equal(atk(s, 'p0c0'), 4);
    s.players[0].playedCount = 9;
    assert.equal(atk(s, 'p0c0'), 5);
});

test('Every Time: +1 attack at the end of each of its controller\'s turns, at most +4', () => {
    let s = setup({ p0: ['siuuugull'] });
    onBoard(s, 'p0c0');
    stats(s, 'p0c0', 2, 3);
    for (let i = 0; i < 6; i++) s = pass(pass(s));
    assert.equal(atk(s, 'p0c0'), 6);
});

test('Deadpan: Guard; a creature that attacks it loses its abilities', () => {
    let s = setup({ p0: ['haalandroid'], p1: ['khaby'] });
    onBoard(s, 'p0c0', 'p1c0');
    stats(s, 'p0c0', 1, 9);
    s = hit(s, 'p0c0', 'p1c0');
    assert.equal(s.cards.p0c0.silenced, true);
    assert.equal(E.fightPreview(s, 'p0c0', 'h1').damage, 1, 'no more Machine bonus');
    // A creature with no ability, only a boost and a keyword, loses them too.
    let k = setup({ p0: ['kardashiant'], p1: ['khaby'] });
    onBoard(k, 'p0c0', 'p1c0');
    stats(k, 'p0c0', 1, 9);
    k.cards.p0c0.ability = null;
    k.cards.p0c0.buffs.push({ label: 'Pep talk', attack: 2, health: 2 });
    k.cards.p0c0.extraKeywords.push('swift');
    k = hit(k, 'p0c0', 'p1c0');
    same(E.keywordsOf(k, 'p0c0'), []);
    assert.equal(atk(k, 'p0c0'), 1);
});

test('Machine deals 2 extra damage to heroes', () => {
    const s = setup({ p0: ['haalandroid'] });
    onBoard(s, 'p0c0');
    stats(s, 'p0c0', 3, 4);
    assert.equal(hit(s, 'p0c0', 'h1').players[1].hearts, 5);
});

test('Queen B gives the other friendly creatures +1 attack', () => {
    const s = setup({ p0: ['beeyonce', 'kardashiant'] });
    onBoard(s, 'p0c0', 'p0c1');
    stats(s, 'p0c0', 4, 5);
    stats(s, 'p0c1', 1, 2);
    assert.equal(atk(s, 'p0c1'), 2);
    assert.equal(atk(s, 'p0c0'), 4);
});

test('Vision: when it attacks, the other friendly creatures get +1 attack this turn', () => {
    let s = setup({ p0: ['messilion', 'kardashiant'] });
    onBoard(s, 'p0c0', 'p0c1');
    stats(s, 'p0c1', 1, 2);
    s = hit(s, 'p0c0', 'h1');
    assert.equal(atk(s, 'p0c1'), 2);
    s = hit(s, 'p0c1', 'h1');
    assert.equal(s.players[1].hearts, 10 - atk(s, 'p0c0') - 2);
});

test('Hips Don\'t Lie: enemy tactics and abilities cannot target it, its own side can', () => {
    const s = setup({ p0: ['shakirattle'], t0: ['pep-talk'], p1: ['kardashiant'], t1: ['counterexample'] });
    onBoard(s, 'p0c0', 'p1c0');
    assert.ok(!E.targetsFor(s, 'any-creature', 1, null, null).includes('p0c0'));
    assert.ok(E.targetsFor(s, 'friendly-creature', 0, null, null).includes('p0c0'));
});

test('Grook: whenever it survives a fight, draw a card', () => {
    let s = setup({ p0: ['hexling', 'kardashiant'], p1: ['astrophysicat'] });
    onBoard(s, 'p0c0', 'p1c0');
    stats(s, 'p0c0', 4, 6);
    stats(s, 'p1c0', 1, 9);
    s = hit(s, 'p0c0', 'p1c0');
    assert.equal(s.players[0].hand.length, 1);
});

// ---- tactics ----------------------------------------------------------------------------------------------------

const withTactic = (id, extra) => {
    const s = setup(Object.assign({ p0: ['kardashiant', 'astrophysicat', 'keanu', 'khaby'], p1: ['kardashiant', 'astrophysicat'], t0: [id] }, extra));
    onBoard(s, 'p0c0', 'p1c0');
    stats(s, 'p0c0', 2, 4);
    stats(s, 'p1c0', 2, 4);
    toHand(s, 'p0t0');
    return s;
};
const cast = (s, target) => act(s, Object.assign({ type: 'play', cid: 'p0t0' }, target ? { target } : {}));

test('every tactic has a cost, text and a run hook; targeted ones need a target', () => {
    Object.entries(Rift.data.tactics).forEach(([id, t]) => {
        assert.ok(t.cost >= 0 && t.text && typeof t.run === 'function', id);
    });
    const s = withTactic('counterexample');
    onBoard(s, 'p0c1');
    same(plain(legal(s, a => a.cid === 'p0t0').map(a => a.target)).sort(), ['p0c0', 'p0c1', 'p1c0']);
    toDiscard(s, 'p0c0', 'p0c1', 'p1c0');
    assert.equal(legal(s, a => a.cid === 'p0t0').length, 0);
});

test('tactics: Counterexample, Pep Talk, Stand Firm, Eureka!', () => {
    let s = cast(withTactic('counterexample'), 'p1c0');
    assert.equal(hp(s, 'p1c0'), 1);
    assert.ok(s.players[0].discard.includes('p0t0'));
    assert.equal(s.players[0].energy, 10 - Rift.data.tactics.counterexample.cost);
    s = cast(withTactic('pep-talk'), 'p0c0');
    assert.equal(atk(s, 'p0c0'), 4);
    assert.equal(hp(s, 'p0c0'), 6);
    s = cast(withTactic('stand-firm'), 'p0c0');
    assert.ok(E.keywordsOf(s, 'p0c0').includes('guard'));
    assert.equal(hp(s, 'p0c0'), 6);
    let e = withTactic('eureka');
    toHand(e, 'p0c2');
    e = act(e, { type: 'play', cid: 'p0c2' });
    e = cast(e, 'p0c2');
    assert.equal(E.canAttack(e, 'p0c2'), true);
    assert.equal(atk(e, 'p0c2'), e.cards.p0c2.attack + 1);
});

test('tactics: Second Wind, Occam\'s Razor, Rethink, Big Claims', () => {
    let s = withTactic('second-wind');
    s.players[0].hearts = 4;
    assert.equal(cast(s).players[0].hearts, 7);
    s = withTactic('occams-razor');
    onBoard(s, 'p1c1');
    s.cards.p1c1.baseKeywords = ['guard'];
    s = cast(s, 'p1c1');
    same(E.keywordsOf(s, 'p1c1'), []);
    s = withTactic('rethink');
    s.cards.p1c0.damage = 2;
    s = cast(s, 'p1c0');
    assert.ok(s.players[1].hand.includes('p1c0'));
    assert.equal(s.cards.p1c0.damage, 0);
    s = withTactic('big-claims');
    assert.equal(legal(s, a => a.cid === 'p0t0').length, 0, 'nothing with 5 attack');
    stats(s, 'p1c0', 5, 5);
    s = cast(s, 'p1c0');
    assert.ok(s.players[1].discard.includes('p1c0'));
});

test('tactics: Look It Up, Peer Review, Recall, Pause for Thought, Safety Net, Lemma', () => {
    let s = withTactic('look-it-up', { axioms: ['haste'] });
    s = cast(s);
    same(s.players[0].axHand, ['haste']);
    s = withTactic('peer-review');
    onBoard(s, 'p1c1');
    stats(s, 'p1c1', 1, 2);
    s = cast(s);
    assert.equal(hp(s, 'p1c0'), 2);
    assert.ok(s.players[1].discard.includes('p1c1'));
    s = withTactic('recall');
    toDiscard(s, 'p0c2', 'p0c3');
    s = cast(s);
    same(plain(E.legalActions(s).map(a => a.choice)).sort(), ['p0c2', 'p0c3']);
    s = act(s, { type: 'choose', choice: 'p0c3' });
    assert.ok(s.players[0].hand.includes('p0c3'));
    s = withTactic('pause-for-thought');
    s = pass(cast(s, 'p1c0'));
    assert.equal(E.canAttack(s, 'p1c0'), false);
    s = cast(withTactic('safety-net'), 'p0c0');
    assert.ok(E.keywordsOf(s, 'p0c0').includes('shield'));
    s = cast(withTactic('lemma'));
    assert.equal(s.players[0].hand.length, 2);
});

test('tactics that would certainly do nothing are not offered', () => {
    const offered = s => legal(s, a => a.cid === 'p0t0').length > 0;
    let s = withTactic('recall');
    assert.equal(offered(s), false, 'Recall: no creature in the discard pile');
    toDiscard(s, 'p0c2');
    assert.equal(offered(s), true);
    s = withTactic('look-it-up');
    assert.equal(offered(s), false, 'Look It Up: shared deck and discard both empty');
    s.axioms.discard.push('haste');
    assert.equal(offered(s), true, 'the discard is reshuffled');
    while (s.players[0].hand.length + s.players[0].axHand.length < 10) s.players[0].axHand.push('haste');
    assert.equal(offered(s), true, 'playing it frees a place in a full hand');
    s.players[0].axHand.push('haste');
    assert.equal(offered(s), false, 'no room even after playing it');
    s = withTactic('lemma');
    assert.equal(offered(s), true);
    s.players[0].discard.push(...s.players[0].deck.splice(0));
    assert.equal(offered(s), false, 'Lemma: empty deck');
    assert.equal(offered(withTactic('clockwork')), false, 'Clockwork: no Fate track');
    assert.equal(offered(withTactic('clockwork', { options: { timeline: true } })), true);
});

test('Look It Up gives the right reason when it takes nothing', () => {
    const run = (deck, handFull) => {
        const out = [];
        const fake = {
            s: { axioms: { deck, discard: [] } },
            handRoom: () => !handFull,
            drawAxiom: () => (handFull || !deck.length ? null : deck.shift()),
            emit: ev => out.push(ev.text),
        };
        Rift.data.tactics['look-it-up'].run(fake, 0);
        return out[0];
    };
    assert.equal(run(['haste'], false), 'Look It Up: take a rule card.');
    assert.equal(run(['haste'], true), 'Look It Up: the hand is full, so no rule card is taken.');
    assert.equal(run([], false), 'Look It Up: the shared rule deck is empty.');
});

test('a creature discarded because the hand is full is not "lost" for the after-battle Fate roll', () => {
    let s = withTactic('rethink');
    const P = s.players[0];
    while (P.hand.length + P.axHand.length < 11) P.axHand.push('haste'); // Rethink leaves the hand first
    s = cast(s, 'p0c0');
    assert.ok(s.players[0].discard.includes('p0c0'));
    assert.equal(s.cards.p0c0.burned, true);
    same(plain(E.lostUids(s, 0)), [], 'it never fought');
    // Recalled, then defeated in a fight: now it counts.
    s.players[0].axHand = [];
    s.cards.p0t0.tactic = 'recall';
    toHand(s, 'p0t0');
    s = act(s, { type: 'play', cid: 'p0t0' });
    if (s.phase === 'choose') s = act(s, { type: 'choose', choice: 'p0c0' });
    assert.ok(s.players[0].hand.includes('p0c0'));
    assert.equal(s.cards.p0c0.burned, false);
    onBoard(s, 'p0c0');
    stats(s, 'p0c0', 1, 1);
    stats(s, 'p1c0', 5, 9);
    s = hit(s, 'p0c0', 'p1c0');
    same(plain(E.lostUids(s, 0)), [s.cards.p0c0.uid]);
});

test('Pull That Up / Nature Watch with a full hand: the kept card is discarded and the log says so', () => {
    let s = setup({ p0: ['chimpossible', 'kardashiant', 'astrophysicat', 'keanu'] });
    onBoard(s, 'p0c0');
    const top = s.players[0].deck.slice(0, 3);
    s = act(s, { type: 'activate', cid: 'p0c0', ability: 'pull-that-up' });
    while (s.players[0].hand.length + s.players[0].axHand.length < 10) s.players[0].axHand.push('haste');
    s = act(s, { type: 'choose', choice: top[0] });
    assert.ok(s.players[0].discard.includes(top[0]));
    assert.equal(s.cards[top[0]].burned, true);
    same(plain(E.lostUids(s, 0)), []);
    const texts = s.lastEvents.map(e => e.text);
    assert.ok(!texts.some(x => /You keep/.test(x)), 'never "You keep" when it was discarded');
    assert.ok(texts.includes('The hand is full, so ' + E.cardName(s, top[0]) + ' is discarded. The others go to the bottom of the deck.'), texts.join(' | '));
});

test('basic rule cards: flagged, plain names, and they still replace the active rule in their category', () => {
    const ax = Rift.data.axioms;
    same(Object.keys(ax).filter(id => ax[id].basic).sort(), ['normal-hearts', 'patience', 'three-actions', 'two-plays']);
    assert.equal(ax['two-plays'].name, 'Two Moves');
    assert.equal(ax['two-plays'].text, 'Back to normal: each player may play 2 cards per turn.');
    assert.equal(ax['three-actions'].name, 'Free Attacks');
    assert.equal(ax['three-actions'].text, 'Back to normal: every ready creature may attack once per turn.');
    assert.equal(ax['normal-hearts'].name, 'Back to the Goal');
    assert.equal(ax['normal-hearts'].text, 'Back to normal: reduce the enemy hero to zero hearts to win.');
    assert.equal(ax.patience.name, 'Wounds Remain');
    assert.equal(ax.patience.text, 'Back to normal: damage stays on creatures.');
    let s = setup({ p0: ['kardashiant'] });
    rule(s, 'one-action');
    s.players[0].axHand.push('three-actions');
    s = act(s, { type: 'axiom', choice: 'three-actions' });
    assert.equal(s.axioms.active.attacks, 'three-actions');
    assert.ok(s.axioms.discard.includes('one-action'), 'the old rule is removed');
    assert.equal(E.rules(s).attackLimit, Infinity);
    assert.equal(events(s, 'axiom')[0].basic, true);
    same(plain(E.activeAxioms(s).map(a => a.id)), ['three-actions'], 'activeAxioms still lists it');
    same(plain(E.changedAxioms(s)), [], 'but it changes nothing');
    rule(s, 'haste');
    same(plain(E.changedAxioms(s).map(a => a.id)), ['haste']);
});

test('log names: a creature name on both boards says whose it is', () => {
    let s = setup({ p0: ['kardashiant', 'astrophysicat'], p1: ['kardashiant'] });
    s.players[0].name = 'You';
    s.players[1].name = 'Granny';
    onBoard(s, 'p0c0', 'p1c0', 'p0c1');
    stats(s, 'p0c0', 1, 1);
    stats(s, 'p1c0', 1, 5);
    assert.equal(E.cardName(s, 'p0c0'), 'Kim Kardashiant', 'cardName stays plain');
    assert.equal(E.logName(s, 'p0c0'), 'your Kim Kardashiant');
    assert.equal(E.logName(s, 'p1c0'), 'Granny\'s Kim Kardashiant');
    assert.equal(E.logName(s, 'p0c1'), 'Astrophysicat', 'no twin, no owner');
    s = hit(s, 'p0c0', 'p1c0');
    const texts = s.lastEvents.map(e => e.text);
    assert.ok(texts.includes('You attack Granny\'s Kim Kardashiant with your Kim Kardashiant.'), texts.join(' | '));
    assert.ok(texts.includes('Granny\'s Kim Kardashiant takes 1 damage.'), texts.join(' | '));
    assert.ok(texts.includes('Your Kim Kardashiant takes 1 damage.'), 'capitalised at the start: ' + texts.join(' | '));
    assert.ok(texts.includes('Your Kim Kardashiant is defeated.'), 'named before it leaves the board: ' + texts.join(' | '));
    // Once the twin is gone, the plain name is enough.
    s = pass(s);
    const t2 = hit(s, 'p1c0', 'p0c1').lastEvents.map(e => e.text);
    assert.ok(t2.includes('Kim Kardashiant (1 attack) fights Astrophysicat (1 attack).') || t2.some(x => /^Kim Kardashiant \(/.test(x)), t2.join(' | '));
});

test('a card returned to a full hand is discarded instead', () => {
    let s = withTactic('rethink');
    const P = s.players[1];
    while (P.hand.length < 10 && P.deck.length) P.hand.push(P.deck.shift());
    while (P.hand.length < 10) P.axHand.push('haste');
    s = cast(s, 'p1c0');
    assert.ok(s.players[1].discard.includes('p1c0'));
    assert.equal(events(s, 'burn').length, 1);
});

test('axiom cards that would change nothing are not offered', () => {
    const s = E.createBattle({ seed: 'no-op-axiom', players: [{ name: 'A', team: [] }, { name: 'B', team: [] }], axiomDeck: [], options: { first: 0, shuffle: false, shuffleAxioms: false, openAxioms: 0 } });
    assert.equal(E.axiomWouldChange(s, 'normal-hearts'), false, 'already the normal goal');
    assert.equal(E.axiomWouldChange(s, 'reverse-hearts'), true);
    const t = { ...s, axioms: { ...s.axioms, active: { victory: 'reverse-hearts' } } };
    assert.equal(E.axiomWouldChange(t, 'normal-hearts'), true, 'undoes the reversed goal');
    assert.equal(E.axiomWouldChange(t, 'reverse-hearts'), false, 'same rule again');
});
