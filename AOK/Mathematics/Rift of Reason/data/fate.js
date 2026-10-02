/*
 * Fate table: what happens to a creature that ends a RISKED battle in the
 * discard pile (practice battles never roll). Weights, not percentages.
 * Tuned with tools/sim-battle.mjs; see the numbers in design notes.
 *
 * Legendaries never die (a death roll becomes "scarred").
 * Items: 'anchor' stops one warp; 'ward' cancels one bad roll (injured, warp or death).
 */
(function (root) {
    'use strict';
    const Rift = root.Rift;

    Rift.data.fate = {
        // The brief's starting odds (fine 55 / scarred 20 / injured 12 / warp 10 / death 3)
        // were far too punishing: about 6 creatures per player (8 for the loser) end a
        // battle in the discard pile, so a player got an injury or death in ~56% of
        // battles and lost a creature for good in ~16%. Tuned with tools/sim-battle.mjs
        // so that a LOST battle means an injury/death ~30% of the time and a permanent
        // loss ~4%, and a WON battle almost never hurts. Weights need not sum to 100.
        briefOdds: { fine: 55, scarred: 20, injured: 12, warp: 10, death: 3 },
        // Creatures on the losing side.
        odds: { fine: 66, scarred: 25, injured: 3.5, warp: 5, death: 0.5 },
        // Creatures on the winning side: you held the field and carried them home. Nobody dies.
        winnerOdds: { fine: 78, scarred: 20, injured: 1, warp: 1, death: 0 },

        outcomes: {
            fine: { name: 'Fine', icon: '✨', text: 'Shook it off.' },
            scarred: { name: 'Scarred', icon: '🩹', text: 'Picked up a scar. Purely cosmetic, very dramatic.' },
            injured: { name: 'Injured', icon: '🤕', text: 'Hurt: loses 1 power or its ability until mended.' },
            warp: { name: 'Warp-cursed', icon: '🌀', text: 'The rift scrambled it: its ability is now a different one.' },
            death: { name: 'Lost', icon: '🕯️', text: 'Fell into the rift and did not come back.' },
        },

        // Order of badness, worst first (wards are spent on the worst rolls).
        bad: ['death', 'warp', 'injured'],

        // Cosmetic scars.
        scars: [
            { id: 'chipped-ear', name: 'Chipped ear' },
            { id: 'singed-whiskers', name: 'Singed whiskers' },
            { id: 'eye-patch', name: 'Eye patch' },
            { id: 'bandaged-tail', name: 'Bandaged tail' },
            { id: 'cracked-crown', name: 'Cracked crown' },
            { id: 'rift-freckles', name: 'Rift freckles' },
            { id: 'lightning-streak', name: 'Lightning streak' },
            { id: 'stitched-cheek', name: 'Stitched cheek' },
        ],
    };
})(typeof window !== 'undefined' ? window : globalThis);
