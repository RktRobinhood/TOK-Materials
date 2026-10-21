import test from 'node:test';
import assert from 'node:assert/strict';
import { Rift as R, E, setup, onBoard, rule, plain } from './battle-helpers.mjs';

const colours = ['reason', 'emotion', 'language', 'perception', 'imagination', 'memory'];
// Independent acceptance oracle: rows attack columns, in the approved clockwise order.
const matrix = [[0, 1, 1, 0, -1, -1], [-1, 0, 1, 1, 0, -1], [-1, -1, 0, 1, 1, 0],
    [0, -1, -1, 0, 1, 1], [1, 0, -1, -1, 0, 1], [1, 1, 0, -1, -1, 0]];
function duel(a, b, attack = 3) {
    const s = setup({ p0: ['beastie'], p1: ['beastie'] }); onBoard(s, 'p0c0', 'p1c0');
    [a, b].forEach((colour, p) => Object.assign(s.cards['p' + p + 'c0'], {
        colour, attack, health: 30, ability: '', gained: [], extraKeywords: [], buffs: [],
    }));
    return s;
}
const hit = s => E.applyAction(s, { type: 'attack', player: 0, cid: 'p0c0', target: 'p1c0' });

test('all six colours have two strong, two weak and two neutral matchups, including reversal', () => {
    assert.deepEqual(plain(R.data.wheel.order), colours);
    for (const reversed of [false, true]) for (let a = 0; a < 6; a++) {
        const counts = { strong: 0, weak: 0, neutral: 0 };
        for (let b = 0; b < 6; b++) {
            const s = duel(colours[a], colours[b]); if (reversed) rule(s, 'curved-space');
            const expected = matrix[a][b] ? matrix[a][b] * (reversed ? -1 : 1) : 0;
            assert.equal(E.wheelBonus(s, s.cards.p0c0, s.cards.p1c0), expected, colours[a] + '/' + colours[b]);
            counts[expected > 0 ? 'strong' : expected < 0 ? 'weak' : 'neutral']++;
        }
        assert.deepEqual(counts, { strong: 2, weak: 2, neutral: 2 });
    }
});

test('every ordered pair agrees across both fighters, real damage, Underdog and prospective clips', () => {
    for (const axes of [[], ['curved-space'], ['underdog'], ['curved-space', 'underdog']]) for (let a = 0; a < 6; a++) for (let b = 0; b < 6; b++) {
        const s = duel(colours[a], colours[b]); axes.forEach(ax => rule(s, ax));
        const sign = axes.includes('curved-space') ? -1 : 1, pa = 3 + matrix[a][b] * sign, pb = 3 + matrix[b][a] * sign;
        const before = JSON.stringify(s), p = E.fightPreview(s, 'p0c0', 'p1c0');
        assert.equal(p.pa, pa); assert.equal(p.pb, pb);
        const toDefender = axes.includes('underdog') && pa > pb ? 0 : pa;
        const toAttacker = axes.includes('underdog') && pb > pa ? 0 : pb;
        const clip = E.previewAction(s, { type: 'attack', player: 0, cid: 'p0c0', target: 'p1c0' }, 0);
        assert.equal(JSON.stringify(s), before, 'aiming and clipping never change live attack/state');
        assert.equal(E.attackOf(s, 'p0c0'), 3);
        const after = hit(s);
        assert.equal(after.cards.p1c0.damage, toDefender); assert.equal(after.cards.p0c0.damage, toAttacker);
        assert.equal(clip.frames.at(-1).view.players[0].board[0].health, 30 - toAttacker);
        assert.equal(clip.frames.at(-1).view.players[1].board[0].health, 30 - toDefender);
    }
});

test('weakness floors an otherwise positive modified attack at one, while zero never gains attack', () => {
    const s = duel('emotion', 'reason', 1);
    assert.equal(E.attackOf(s, 'p0c0', 'p1c0'), 1);
    assert.match(E.attackParts(s, 'p0c0', 'p1c0').parts.map(p => p.label).join(' '), /Weak|floor/i);
    s.cards.p0c0.buffs.push({ label: 'Stacked boost', attack: 2, health: 0 });
    assert.equal(E.attackOf(s, 'p0c0', 'p1c0'), 2, 'all ordinary modifiers apply before the -1');
    s.cards.p0c0.buffs.push({ label: 'Cancelling penalty', attack: -3, health: 0 });
    assert.equal(E.attackOf(s, 'p0c0', 'p1c0'), 0);
    const zero = duel('reason', 'emotion', 0);
    assert.equal(E.attackOf(zero, 'p0c0', 'p1c0'), 0, 'Strong +1 never wakes a zero-attack creature');
    assert.equal(E.canAttack(zero, 'p0c0'), false);
});

test('heroes and colourless creatures are neutral; Memory is a full wheel colour', () => {
    const s = duel('memory', 'reason');
    assert.equal(E.attackOf(s, 'p0c0', 'p1c0'), 4);
    assert.equal(E.fightPreview(s, 'p0c0', 'h1').damage, 3);
    s.cards.p1c0.colourless = true;
    assert.equal(E.attackOf(s, 'p0c0', 'p1c0'), 3);
    assert.equal(E.attackOf(s, 'p1c0', 'p0c0'), 3);
    for (const colour of colours) {
        const neutral = duel(colour, 'reason'); neutral.cards.p1c0.generic = true;
        assert.equal(E.attackOf(neutral, 'p0c0', 'p1c0'), 3);
        assert.equal(E.attackOf(neutral, 'p1c0', 'p0c0'), 3);
        assert.equal(E.fightPreview(neutral, 'p0c0', 'h1').damage, 3);
    }
});

test('spotlights and stacked buffs precede the matchup, which never becomes a stored effect', () => {
    const s = duel('reason', 'memory', 2); rule(s, 'age-of-reason');
    s.cards.p0c0.buffs.push({ label: 'Boost', attack: 1, health: 0 }, { label: 'Penalty', attack: -1, health: 0 });
    assert.equal(E.attackOf(s, 'p0c0'), 4); assert.equal(E.attackOf(s, 'p0c0', 'p1c0'), 3);
    assert.equal(E.activeEffects(s, 'p0c0').some(x => /Weak|Strong|floor/.test(x.label)), false);
    assert.equal(s.cards.p0c0.attack, 2);
});

test('Shield and prevention may reduce effective damage to zero after the attack floor', () => {
    const s = duel('emotion', 'reason', 1); s.cards.p1c0.extraKeywords = ['shield'];
    const p = E.fightPreview(s, 'p0c0', 'p1c0');
    assert.equal(p.pa, 1); assert.equal(p.damageToDefender, 0);
    assert.equal(hit(s).cards.p1c0.damage, 0);
    s.cards.p1c0.extraKeywords = []; s.cards.p1c0.ability = 'the-eyebrow';
    assert.equal(E.fightPreview(s, 'p0c0', 'p1c0').damageToDefender, 0);
    assert.equal(hit(s).cards.p1c0.damage, 0);
});
