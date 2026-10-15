/*
 * Changes (issue #151, teacher 14 Oct 2026; design/DESIGN.md "Changes replace the Fate table"):
 * after a battle with something at stake (trainer, boss, ghost; never practice, lessons or loans),
 * a creature rarely comes home a little different. The Change lives on that one caught creature.
 * Tuned with tools/sim-battle.mjs.
 *
 * Builder decisions (recorded on #151):
 * - at most 2 Changes per creature; Changes add up to at most ±2 attack and ±2 health, and cost
 *   stays within ±1 of the printed cost and never 0. Attack never below 0, health never below 1;
 *   a Change that would break a limit is not offered.
 * - creatures that were not defeated: 0.5%, gains only.
 * - "a stronger version of its ability" is left out for now: abilities have no strength setting.
 * - Wards, Anchors and Mending keep their in-battle uses; they no longer do anything after a battle.
 */
(function (root) {
    'use strict';
    const Rift = root.Rift;

    Rift.data.fate = {
        chance: {
            defeated: 0.02,     // per defeated collected creature
            survivor: 0.005,    // per collected creature that was not defeated (gains only)
            boss: 3,            // boss battles multiply the chance
            overkill: 5,        // defeated with this much more damage than it had health left…
            overkillAt: 3,      // …multiplies the chance again
            cap: 0.3,
        },
        limits: { changes: 2, attack: 2, health: 2, cost: 1 },

        kinds: {
            gain: { name: 'Gain', icon: '⬆️' },
            loss: { name: 'Loss', icon: '⬇️' },
            sideways: { name: 'Sideways', icon: '🌀' },
            trade: { name: 'Trade-off', icon: '⚖️' },
        },

        // Scar-style names that tell the story. `text` is the plain explanation shown on the card.
        changes: {
            'lightning-streak': { name: 'Lightning Streak', kind: 'gain', attack: 1, weight: 3, text: '+1 attack.' },
            'thick-hide': { name: 'Thick Hide', kind: 'gain', health: 1, weight: 3, text: '+1 health.' },
            'light-feet': { name: 'Light Feet', kind: 'gain', cost: -1, weight: 2, text: 'Costs 1 less.' },
            'stiff-claw': { name: 'Stiff Claw', kind: 'loss', attack: -1, weight: 2, text: '−1 attack.' },
            'bandaged-tail': { name: 'Bandaged Tail', kind: 'loss', health: -1, weight: 2, text: '−1 health.' },
            'heavy-step': { name: 'Heavy Step', kind: 'loss', cost: 1, weight: 2, text: 'Costs 1 more.' },
            'rift-freckles': { name: 'Rift Freckles', kind: 'sideways', sideways: true, weight: 3, text: 'The rift swapped its ability for a different one.' },
            'chipped-ear': { name: 'Chipped Ear', kind: 'trade', attack: 1, health: -1, weight: 2, text: '+1 attack, −1 health.' },
            'cracked-crown': { name: 'Cracked Crown', kind: 'trade', attack: 2, health: -1, weight: 1, text: '+2 attack, −1 health.' },
            'stitched-cheek': { name: 'Stitched Cheek', kind: 'trade', attack: -1, health: 2, weight: 1, text: '+2 health, −1 attack.' },
            'singed-whiskers': { name: 'Singed Whiskers', kind: 'trade', cost: -1, health: -1, weight: 2, text: 'Costs 1 less, −1 health.' },
        },
    };
})(typeof window !== 'undefined' ? window : globalThis);
