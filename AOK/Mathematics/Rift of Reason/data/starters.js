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
 *   decks     { type: { strategy, colour, plan, creatures: [12 species], tactics: [8 tactic ids], rewards } }
 *             plan: one short line for the deck workshop (#115, js/ui/deck-workshop.js)
 *
 * Station card rewards (#124, design/reviews/reward-cadence-124-2026-10-14.md): `rewards` maps a reward
 * slot (the `cards` list of a node in data/map.js) to an ordered list of candidate cards: a tactic id,
 * or 'axiom:<id>'. The first completion of a node with that slot grants the first candidate the player
 * does not own yet, once per adventure (Rift.World.claimCards; receipt flags['card-reward:<slot>']).
 * Each track grows the starter: a common for a second colour it already has creatures of, its own
 * colour's uncommon, rare and spotlight Axiom, then a second colour's uncommon and spotlight Axiom,
 * and Nostalgia for Fate planning. Later candidates are fallbacks when a trainer already gave the card.
 *   fit, fit-2      Fair stalls (first one won), the Ford: a common that fits the deck's colour quota now
 *   colour          the Wishing Well: the uncommon tactic of the deck's colour
 *   colour-rule     the Lever Bridge: the deck colour's spotlight Axiom (Age of …)
 *   second-colour   Granny's Kitchen: an uncommon of a second colour in the deck
 *   colour-rare     the Library: the rare tactic of the deck's colour
 *   second-rule     the Reading Room: the second colour's spotlight Axiom
 *   fate            the Prediction Hall: Nostalgia (moves the Fate track), else a fallback
 * Amounts and choices are draft tuning (teacher review); rewardsVersion is written to each receipt.
 */
(function (root) {
    'use strict';
    const Rift = root.Rift;
    Rift.data = Rift.data || {};

    const two = list => list.reduce((out, id) => out.concat([id, id]), []);

    Rift.data.starterDecks = {
        version: 1,
        rewardsVersion: 1,
        axioms: ['flux-plays-plus-1', 'flux-plays-minus-1', 'flux-draw-plus-1', 'flux-draw-minus-1',
            'flux-growth-plus-1', 'flux-cost-plus-1', 'flux-cost-minus-1', 'limited-memory', 'momentum', 'two-plays'],
        decks: {
            // Guard buys time; small damage sets up Close the Proof. Drawing and selective answers support Foresee.
            owlet: { strategy: 'Patient midrange', colour: 'reason',
                plan: 'Block with Guard creatures and make small hits. Close the Proof defeats a creature with 1 health left. Foresee lets you plan your rule cards.',
                creatures: two(['astrophysicat', 'khaby', 'proof-pup', 'siuuugull', 'keanu', 'beansprout']),
                tactics: two(['step-by-step', 'patient-proof', 'pause-for-thought', 'counterexample']),
                rewards: { fit: ['stored-thought', 'careful-words'], 'fit-2': ['careful-words', 'stored-thought'],
                    colour: ['proof-by-contradiction', 'qed'], 'colour-rule': ['axiom:age-of-reason', 'axiom:age-of-tradition'],
                    'second-colour': ['nostalgia', 'rousing-speech'], 'colour-rare': ['qed', 'proof-by-contradiction', 'total-recall'],
                    'second-rule': ['axiom:age-of-tradition', 'axiom:age-of-rhetoric'], fate: ['nostalgia', 'total-recall', 'rousing-speech'] } },
            // Small damage pairs with Lantern; inspection and cheap interaction support Night Sight.
            mothkin: { strategy: 'Information tempo', colour: 'perception',
                plan: 'Make small hits and look at cards early. Lantern deals 1 damage to an enemy creature. Night Sight shows the other hand.',
                creatures: two(['kardashiant', 'attenbirdough', 'lens-lizard', 'astrophysicat', 'beansprout', 'keanu']),
                tactics: two(['look-closer', 'steady-gaze', 'counterexample', 'pause-for-thought']),
                rewards: { fit: ['patient-proof', 'stored-thought'], 'fit-2': ['stored-thought', 'careful-words'],
                    colour: ['field-notes', 'clear-view'], 'colour-rule': ['axiom:age-of-observation', 'axiom:age-of-reason'],
                    'second-colour': ['proof-by-contradiction', 'nostalgia'], 'colour-rare': ['clear-view', 'field-notes', 'qed'],
                    'second-rule': ['axiom:age-of-reason', 'axiom:age-of-tradition'], fate: ['nostalgia', 'proof-by-contradiction', 'qed'] } },
            // Cloud Calf offers a risky stat swap for What If; cheap creatures and buffs make Brainstorm useful.
            fox: { strategy: 'Growth and pressure', colour: 'imagination',
                plan: 'Play cheap creatures fast and make them stronger. What If? swaps attack and health. Brainstorm gives one more card activation.',
                creatures: two(['zuckerborg', 'paper-dragon', 'cloud-calf', 'beansprout', 'siuuugull', 'eelish']),
                tactics: two(['daydream', 'creative-spark', 'eureka', 'pep-talk']),
                rewards: { fit: ['careful-words', 'stored-thought'], 'fit-2': ['stored-thought', 'careful-words'],
                    colour: ['imagine-otherwise', 'dream-big'], 'colour-rule': ['axiom:age-of-wonder', 'axiom:age-of-feeling'],
                    'second-colour': ['rally-cry', 'rousing-speech'], 'colour-rare': ['dream-big', 'imagine-otherwise', 'wave-of-feeling'],
                    'second-rule': ['axiom:age-of-feeling', 'axiom:age-of-rhetoric'], fate: ['nostalgia', 'rally-cry', 'wave-of-feeling'] } },
            // Recall recovers defeated creatures; Clockwork and a modest draw/heal package support Hold That Thought.
            frogling: { strategy: 'Resilient planning', colour: 'memory',
                plan: 'Plan for a long match and heal. Recall brings back a defeated creature. Hold That Thought moves Fate and draws a card.',
                creatures: two(['pocket-tortoise', 'siuuugull', 'keanu', 'khaby', 'attenbirdough', 'beansprout']),
                tactics: two(['remember-when', 'stored-thought', 'clockwork', 'second-wind']),
                rewards: { fit: ['steady-gaze', 'patient-proof'], 'fit-2': ['patient-proof', 'careful-words'],
                    colour: ['nostalgia', 'total-recall'], 'colour-rule': ['axiom:age-of-tradition', 'axiom:age-of-observation'],
                    'second-colour': ['field-notes', 'proof-by-contradiction'], 'colour-rare': ['total-recall', 'nostalgia', 'clear-view'],
                    'second-rule': ['axiom:age-of-observation', 'axiom:age-of-reason'], fate: ['nostalgia', 'clear-view', 'field-notes', 'proof-by-contradiction'] } },
            // A protected board benefits from Call It Out; healing and economical plays support Fine Print.
            raven: { strategy: 'Defensive attrition', colour: 'language',
                plan: 'Protect and heal your creatures. Call It Out removes enemy defences. Fine Print trades a heart for a card.',
                creatures: two(['beansprout', 'comma-crab', 'footnote-finch', 'eelish', 'zuckerborg', 'astrophysicat']),
                tactics: two(['label-it', 'careful-words', 'stand-firm', 'second-wind']),
                rewards: { fit: ['creative-spark', 'patient-proof'], 'fit-2': ['patient-proof', 'creative-spark'],
                    colour: ['rousing-speech', 'persuasion'], 'colour-rule': ['axiom:age-of-rhetoric', 'axiom:age-of-feeling'],
                    'second-colour': ['rally-cry', 'imagine-otherwise'], 'colour-rare': ['persuasion', 'rousing-speech', 'wave-of-feeling'],
                    'second-rule': ['axiom:age-of-feeling', 'axiom:age-of-wonder'], fate: ['nostalgia', 'rally-cry', 'wave-of-feeling'] } },
        },
    };
})(typeof window !== 'undefined' ? window : globalThis);
