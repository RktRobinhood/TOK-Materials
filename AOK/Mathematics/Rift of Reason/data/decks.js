/*
 * Built competitive decks for Expert opponents (design/card-arena-expansion-2026-10-07.md, section 8).
 * A boss trainer in data/map.js names one with `deck: '<id>'`; at the Expert level it plays this
 * deck instead of its ordinary ten-creature team (js/ui/battles.js trainerSide).
 *
 *   creatures  species ids (data/creatures.js), one or two neighbouring colours, a low cost curve
 *   tactics    colourless tactic ids (data/tactics.js), at most 2 copies each
 *   creatures + tactics = 20 cards, like a player's deck (6–14 of each).
 *
 * Simulated strength: design/reviews/card-arena-balance-2026-10-07.md (`node tools/sim-battle.mjs --ladder`).
 */
(function (root) {
    'use strict';
    const Rift = root.Rift;

    Rift.data.decks = {
        // Constable Clobber: "Guards first." Reason and Memory Guards, then big Reason bodies.
        constable: {
            name: 'Guards First', colours: ['reason', 'memory'],
            creatures: ['khaby', 'khaby', 'astrophysicat', 'keanu', 'keanu', 'usainvolt',
                'lobstorian', 'lobstorian', 'beastie', 'carlseal', 'carlseal', 'haalandroid'],
            tactics: ['counterexample', 'counterexample', 'pep-talk', 'pep-talk', 'stand-firm', 'big-claims', 'peer-review', 'occams-razor'],
            // TODO colour tactics: add Reason/Memory colour tactics here after the colour-tactics merge
            // (keep 20 cards: swap out colourless tactics one for one).
        },
        // Prosecutor Fin: "A strong case needs sound rules." Language arguments backed by Reason.
        fin: {
            name: 'Sound Case', colours: ['language', 'reason'],
            creatures: ['astrophysicat', 'astrophysicat', 'khaby', 'swiftlet', 'swiftlet',
                'eminemu', 'eminemu', 'lobstorian', 'tremendoodle', 'tremendoodle', 'obambu', 'obambu'],
            tactics: ['counterexample', 'counterexample', 'occams-razor', 'occams-razor', 'rethink', 'big-claims', 'pep-talk', 'lemma'],
            // TODO colour tactics: add Language/Reason colour tactics here after the colour-tactics merge.
        },
        // The Feed's Champion: "MY TEAM GETS ATTENTION." Fast Emotion and Imagination, all-in.
        feed: {
            name: 'Attention Engine', colours: ['emotion', 'imagination'],
            creatures: ['zuckerborg', 'zuckerborg', 'speedcheeta', 'speedcheeta', 'eelish',
                'altmanta', 'altmanta', 'gargoyle', 'rockodile', 'rawmsay', 'beeyonce', 'muskrat'],
            tactics: ['counterexample', 'counterexample', 'pep-talk', 'pep-talk', 'eureka', 'eureka', 'peer-review', 'big-claims'],
            // TODO colour tactics: add Emotion/Imagination colour tactics here after the colour-tactics merge.
        },
    };
})(typeof window !== 'undefined' ? window : globalThis);
