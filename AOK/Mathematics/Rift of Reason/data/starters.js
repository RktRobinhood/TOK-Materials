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
 *   decks     { type: { strategy, plan, creatures: [12 species], tactics: [8 tactic ids] } }
 *             plan: one short line for the deck workshop (#115, js/ui/deck-workshop.js)
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
                plan: 'Block with Guard creatures and make small hits. Close the Proof defeats a creature with 1 health left. Foresee lets you plan your rule cards.',
                creatures: two(['astrophysicat', 'khaby', 'proof-pup', 'siuuugull', 'keanu', 'beansprout']),
                tactics: two(['step-by-step', 'patient-proof', 'pause-for-thought', 'counterexample']) },
            // Small damage pairs with Lantern; inspection and cheap interaction support Night Sight.
            mothkin: { strategy: 'Information tempo',
                plan: 'Make small hits and look at cards early. Lantern deals 1 damage to an enemy creature. Night Sight shows the other hand.',
                creatures: two(['kardashiant', 'attenbirdough', 'lens-lizard', 'astrophysicat', 'beansprout', 'keanu']),
                tactics: two(['look-closer', 'steady-gaze', 'counterexample', 'pause-for-thought']) },
            // Cloud Calf offers a risky stat swap for What If; cheap creatures and buffs make Brainstorm useful.
            fox: { strategy: 'Growth and pressure',
                plan: 'Play cheap creatures fast and make them stronger. What If? swaps attack and health. Brainstorm gives one more card play.',
                creatures: two(['zuckerborg', 'paper-dragon', 'cloud-calf', 'beansprout', 'siuuugull', 'eelish']),
                tactics: two(['daydream', 'creative-spark', 'eureka', 'pep-talk']) },
            // Recall recovers defeated creatures; Clockwork and a modest draw/heal package support Hold That Thought.
            frogling: { strategy: 'Resilient planning',
                plan: 'Plan for a long match and heal. Recall brings back a defeated creature. Hold That Thought moves Fate and draws a card.',
                creatures: two(['pocket-tortoise', 'siuuugull', 'keanu', 'khaby', 'attenbirdough', 'beansprout']),
                tactics: two(['remember-when', 'stored-thought', 'clockwork', 'second-wind']) },
            // A protected board benefits from Call It Out; healing and economical plays support Fine Print.
            raven: { strategy: 'Defensive attrition',
                plan: 'Protect and heal your creatures. Call It Out removes enemy defences. Fine Print trades a heart for a card.',
                creatures: two(['beansprout', 'comma-crab', 'footnote-finch', 'eelish', 'zuckerborg', 'astrophysicat']),
                tactics: two(['label-it', 'careful-words', 'stand-firm', 'second-wind']) },
        },
    };
})(typeof window !== 'undefined' ? window : globalThis);
