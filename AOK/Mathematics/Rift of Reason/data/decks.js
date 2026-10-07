/*
 * Built competitive decks for Expert opponents (design/card-arena-expansion-2026-10-07.md, section 8).
 * A boss trainer in data/map.js names one with `deck: '<id>'`; at the Expert level it plays this
 * deck instead of its ordinary ten-creature team (js/ui/battles.js trainerSide).
 *
 *   creatures  species ids (data/creatures.js), one or two neighbouring colours, a low cost curve
 *   tactics    tactic ids (data/tactics.js), at most 2 copies each: colourless ones plus colour
 *              tactics of the deck's own colours only (the colour identity rule, Engine.identityFilter)
 *   creatures + tactics = 20 cards, like a player's deck (6–14 of each).
 *
 * Simulated strength: design/reviews/card-arena-balance-2026-10-07.md (`node tools/sim-battle.mjs --ladder`).
 * Tuned so Expert with the deck beats Competent with the loaned starter deck about 80% (the later
 * the chapter, the stronger the deck); a few weak tactics (Clockwork, Look It Up) keep it there.
 */
(function (root) {
    'use strict';
    const Rift = root.Rift;

    Rift.data.decks = {
        // Constable Clobber: "Guards first." Reason and Memory Guards, then big Reason bodies.
        constable: {
            name: 'Guards First', colours: ['reason', 'memory'],
            creatures: ['khaby', 'khaby', 'astrophysicat', 'keanu', 'keanu', 'usainvolt',
                'lobstorian', 'siuuugull', 'carlseal', 'haalandroid'],
            // Colour tactics: Proof by Contradiction (Reason), Nostalgia (Memory).
            tactics: ['counterexample', 'eureka', 'pep-talk', 'pep-talk', 'big-claims', 'stand-firm', 'proof-by-contradiction', 'nostalgia', 'clockwork', 'look-it-up'],
        },
        // Prosecutor Fin: "A strong case needs sound rules." Language arguments backed by Reason.
        fin: {
            name: 'Sound Case', colours: ['language', 'reason'],
            creatures: ['astrophysicat', 'astrophysicat', 'khaby', 'swiftlet', 'swiftlet',
                'eminemu', 'lobstorian', 'tremendoodle', 'tremendoodle', 'obambu'],
            // Colour tactics: Label It (Language), Proof by Contradiction (Reason).
            tactics: ['counterexample', 'stand-firm', 'occams-razor', 'occams-razor', 'rethink', 'big-claims', 'label-it', 'proof-by-contradiction', 'clockwork', 'look-it-up'],
        },
        // The Feed's Champion: "MY TEAM GETS ATTENTION." Fast Emotion and Imagination, all-in.
        feed: {
            name: 'Attention Engine', colours: ['emotion', 'imagination'],
            creatures: ['zuckerborg', 'zuckerborg', 'speedcheeta', 'speedcheeta', 'eelish',
                'altmanta', 'gargoyle', 'rockodile', 'rawmsay', 'beeyonce', 'muskrat'],
            // Colour tactics: Rally Cry (Emotion), Daydream (Imagination).
            tactics: ['counterexample', 'counterexample', 'pep-talk', 'pep-talk', 'eureka', 'peer-review', 'rally-cry', 'daydream', 'clockwork'],
        },
    };
})(typeof window !== 'undefined' ? window : globalThis);
