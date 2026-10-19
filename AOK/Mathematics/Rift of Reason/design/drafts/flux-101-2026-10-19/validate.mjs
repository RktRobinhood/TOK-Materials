// Planning experiment only. No battle rules, saves, recording tools or runtime pools change.
// Run from any directory: node <path-to-this-file>
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { loadRift } from '../../../tools/test/harness.mjs';

const read = name => JSON.parse(fs.readFileSync(new URL(name, import.meta.url), 'utf8'));
const contract = read('contract-cases.json');
const expected = read('policy-experiment.json');
const Rift = loadRift(['js/core/rift.js']);

assert.equal(contract.cards.length, 16);
assert.equal(new Set(contract.cards.map(c => c.id)).size, 16);
for (const category of Object.keys(contract.fields)) {
    assert.deepEqual(contract.cards.filter(c => c.category === category).map(c => c.delta).sort((a, b) => a - b), [-2, -1, 1, 2]);
}
for (const c of contract.algebraCases) {
    const bounds = contract.fields[c.category];
    const result = c.before === 'unlimited' ? 'unlimited' : Math.max(bounds.min, Math.min(bounds.max, c.before + c.delta));
    assert.equal(result, c.after);
    assert.equal(c.before !== result, c.changed);
}
for (const c of contract.budgetCases) {
    const bounds = contract.fields.plays;
    assert.equal(Math.max(bounds.min, Math.min(bounds.max, c.base + c.delta)), c.afterBase);
    assert.equal(c.spentBefore + 1, c.spentAfter);
    assert.equal(Math.max(0, c.afterBase + c.bonus - c.spentAfter), c.left);
}

for (const eligible of [false, true]) {
    const profile = expected.profiles[eligible ? 'eligible' : 'introductory'];
    let unlimited = 0, modifiers = 0, optional = 0, finite = 0, sharedWithUnlimited = 0, topUnlimited = 0;
    const perModifier = Object.fromEntries(contract.cards.map(c => [c.id, 0]));
    for (let i = 0; i < profile.matches; i++) {
        const rng = Rift.makeRng('flux-policy-101:' + eligible + ':' + i);
        const contribution = () => {
            const slot = () => eligible && rng.chance(0.25) ? contract.unlimitedId : contract.finiteRepairId;
            // Sample before choosing the special slot; stream order is part of the receipt.
            const sample = rng.shuffle(contract.cards.map(c => c.id)).slice(0, 7);
            const deck = sample.concat(contract.optionalCategoryIds, slot());
            assert.equal(deck.length, 10);
            assert.equal(new Set(deck).size, 10);
            return rng.shuffle(deck);
        };
        const a = contribution(), b = contribution();
        const shared = rng.shuffle(a.concat(b));
        if (shared.includes(contract.unlimitedId)) sharedWithUnlimited++;
        for (const deck of [a, b]) {
            if (deck[0] === contract.unlimitedId) topUnlimited++;
            for (const id of deck) {
                if (id in perModifier) { modifiers++; perModifier[id]++; }
                else if (id === contract.unlimitedId) unlimited++;
                else if (id === contract.finiteRepairId) finite++;
                else { assert.ok(contract.optionalCategoryIds.includes(id)); optional++; }
            }
        }
    }
    assert.deepEqual({ unlimited, modifiers, optional, finite, sharedWithUnlimited, topUnlimited, perModifier }, {
        unlimited: profile.unlimitedCards, modifiers: profile.modifierCards, optional: profile.optionalCards,
        finite: profile.finiteRepairCards, sharedWithUnlimited: profile.sharedDecksWithUnlimited,
        topUnlimited: profile.topCardUnlimited, perModifier: profile.perModifier,
    });
    console.log((eligible ? 'Eligible' : 'Introductory') + ': ' + modifiers + '/' + profile.cards + ' modifier slots; '
        + unlimited + ' Unlimited slots; ' + sharedWithUnlimited + '/' + profile.matches + ' shared decks contain Unlimited.');
}
console.log('Planning checks passed: 20 algebra cases, 4 paid-budget cases, 20,000 ten-card contributions. No gameplay was simulated.');
