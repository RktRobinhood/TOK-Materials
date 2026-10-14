/*
 * Owned avatar-type starter decks (#114; design/drafts/card-arena-2026-10-12/CARD-DRAFTS.md, "Five draft
 * decks", and starter-decks.json beside it, which tools/test/starter-decks.test.mjs compares with this file).
 *
 * Rift.State.grantStarter gives the player's avatar TYPE its deck once per adventure as real owned cards:
 * twelve creatures (two copies of six species: six of the type's colour), eight tactics (two copies of
 * four: four of that colour plus four generic ones) and the default ten axiom cards. Both variants of a type
 * use the same list, so a different appearance never means a different deck. Every list obeys the shared
 * construction rules (Rift.State.validateDeck). The lists are weak, common cards on purpose: better cards
 * are earned. Costs and names are draft tuning (CARD-DRAFTS.md).
 *
 *   version   the receipt version written to save.starter.v
 *   axioms    the ten axiom cards every starter uses (one copy each; data/axioms.js axiomDecks.default)
 *   decks     { type: { strategy, creatures: [12 species], tactics: [8 tactic ids] } }
 */
(function (root) {
    'use strict';
    const Rift = root.Rift;
    Rift.data = Rift.data || {};

    const two = list => list.reduce((out, id) => out.concat([id, id]), []);

    Rift.data.starterDecks = {
        version: 1,
        axioms: ['underdog', 'reverse-hearts', 'normal-hearts', 'thrift', 'abundance', 'study', 'arrival', 'vigilance', 'choice', 'mercy'],
        decks: {
            // Guard buys time; small damage sets up Close the Proof. Drawing and selective answers support Foresee.
            owlet: { strategy: 'Patient midrange',
                creatures: two(['astrophysicat', 'khaby', 'proof-pup', 'siuuugull', 'keanu', 'beansprout']),
                tactics: two(['step-by-step', 'patient-proof', 'pause-for-thought', 'counterexample']) },
            // Small damage pairs with Lantern; inspection and cheap interaction support Night Sight.
            mothkin: { strategy: 'Information tempo',
                creatures: two(['kardashiant', 'attenbirdough', 'lens-lizard', 'astrophysicat', 'beansprout', 'keanu']),
                tactics: two(['look-closer', 'steady-gaze', 'counterexample', 'pause-for-thought']) },
            // Cloud Calf offers a risky stat swap for What If; cheap creatures and buffs make Brainstorm useful.
            fox: { strategy: 'Growth and pressure',
                creatures: two(['zuckerborg', 'paper-dragon', 'cloud-calf', 'beansprout', 'siuuugull', 'eelish']),
                tactics: two(['daydream', 'creative-spark', 'eureka', 'pep-talk']) },
            // Recall recovers defeated creatures; Clockwork and a modest draw/heal package support Hold That Thought.
            frogling: { strategy: 'Resilient planning',
                creatures: two(['pocket-tortoise', 'siuuugull', 'keanu', 'khaby', 'attenbirdough', 'beansprout']),
                tactics: two(['remember-when', 'stored-thought', 'clockwork', 'second-wind']) },
            // A protected board benefits from Call It Out; healing and economical plays support Fine Print.
            raven: { strategy: 'Defensive attrition',
                creatures: two(['beansprout', 'comma-crab', 'footnote-finch', 'eelish', 'zuckerborg', 'astrophysicat']),
                tactics: two(['label-it', 'careful-words', 'stand-firm', 'second-wind']) },
        },
    };
})(typeof window !== 'undefined' ? window : globalThis);
