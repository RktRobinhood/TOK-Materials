/*
 * Battle rules data: the colour wheel (Ways of Knowing) and the shared AXIOM DECK.
 *
 * Axiom cards are drawn into a player's hand (draw choice, Look It Up) and played
 * for their cost. A played or Fate-flipped axiom affects BOTH players and stays
 * until another axiom in its category replaces it or the Fate track resets.
 * The engine (js/battle/engine.js) reads these hooks; nothing here touches the DOM.
 * See design/card-arena-2026-10-07.md.
 *
 * Axiom fields:
 *   category, cost (energy, default 2), text, flavour
 *   short                         → the rule in a few words (the battle screen's rule tiles)
 *   basic: true                   → it restates the default rule ("Back to normal"). Playing it still
 *                                   replaces (removes) the active rule in its category.
 *   rules: { ... }                → values merged over Engine.rules defaults
 *   powerMod(state, card, H)      → attack added to a creature
 *   resolveFight(pa, pb)          → { toAttacker, toDefender } replaces normal fight damage
 *   defenderSurvivesTrade         → if both fighters would fall, the defender keeps 1 health
 *   onFightWon(api, card)         → for a creature that defeated its foe and survived
 *   own: true                     → a player's OWN card, never in the shared deck (Granny's Spare Axiom).
 *                                   createBattle player.ownAxioms puts it in that player's opening hand;
 *                                   once played or discarded it leaves the game.
 *   clearRules: true              → playing it clears every active rule for BOTH players (back to the
 *                                   basics, like a Fate reset, but Fate does not move). It never becomes
 *                                   an active rule itself. Playable only while a rule is changed.
 *   draws: n                      → after it is played, its player draws n cards from their deck
 */
(function (root) {
    'use strict';
    const Rift = root.Rift;

    // ---- colour wheel ------------------------------------------------------
    // A clean 5-cycle. Each colour beats the next one (+1 attack while it fights
    // that colour). Memory is colourless: it neither beats nor is beaten.
    Rift.data.wheel = {
        bonus: 1,
        order: ['reason', 'emotion', 'language', 'perception', 'imagination'],
        beats: {
            reason: 'emotion',
            emotion: 'language',
            language: 'perception',
            perception: 'imagination',
            imagination: 'reason',
        },
        lines: {
            reason: 'Reason checks Emotion: a calm proof outlasts a heated argument.',
            emotion: 'Emotion outruns Language: we feel things before we have words for them.',
            language: 'Language frames Perception: we notice what we have names for.',
            perception: 'Perception grounds Imagination: a wild idea still has to meet the evidence.',
            imagination: 'Imagination outflanks Reason: change one axiom and new worlds appear, like curved-space geometry.',
        },
        memory: 'Memory stands outside the wheel: it neither beats nor is beaten.',
    };

    const spotlight = (id, colour, name, flavour) => ({
        id, name, colour, category: 'colour',
        short: Rift.COLOURS[colour].name + ' +2 attack',
        text: Rift.COLOURS[colour].name + ' creatures get +2 attack.',
        flavour,
        powerMod(state, card, H) { return H.colourOf(state, card) === colour ? 2 : 0; },
    });

    const axioms = {
        underdog: {
            short: 'Lower attack hits',
            name: 'Axiom of the Underdog', category: 'combat',
            text: 'In a fight, only the creature with LOWER attack deals damage. Equal attack: both deal damage.',
            flavour: 'Who decided that bigger beats smaller? Change the axiom and the result changes.',
            resolveFight(pa, pb) {
                if (pa === pb) return { toAttacker: pb, toDefender: pa };
                return pa < pb ? { toAttacker: 0, toDefender: pa } : { toAttacker: pb, toDefender: 0 };
            },
        },
        'excluded-middle': {
            short: 'No double defeats',
            name: 'Law of the Excluded Middle', category: 'combat',
            text: 'No double defeats: if both fighters would be defeated, the defender survives with 1 health.',
            flavour: 'Every statement is either true or false. There is no in-between.',
            defenderSurvivesTrade: true,
        },
        extensionality: {
            short: 'Equal attack: no damage',
            name: 'Axiom of Extensionality', category: 'combat',
            text: 'Equal is equal: creatures with the same attack deal no damage to each other.',
            flavour: 'Two sets with exactly the same members are the same set.',
            resolveFight(pa, pb) { return pa === pb ? { toAttacker: 0, toDefender: 0 } : { toAttacker: pb, toDefender: pa }; },
        },
        'reverse-hearts': {
            short: 'Reach 0 ❤ yourself to WIN',
            name: 'The Last Shall Be First', category: 'victory', cost: 3,
            text: 'Reach zero of YOUR OWN hearts to win. Taking the opponent to zero makes THEM win.',
            rules: { reverseHearts: true },
        },
        'normal-hearts': {
            short: 'Enemy hero to 0 ❤ wins',
            name: 'Back to the Goal', category: 'victory', cost: 1, basic: true,
            text: 'Back to normal: reduce the enemy hero to zero hearts to win.',
            rules: { reverseHearts: false },
        },
        'one-action': {
            short: 'Only 1 attack per turn',
            name: 'One Step at a Time', category: 'attacks',
            text: 'Each player may attack only once per turn.',
            rules: { attackLimit: 1 },
        },
        'two-actions': {
            short: 'Only 2 attacks per turn',
            name: 'Two Paths', category: 'attacks',
            text: 'Each player may attack only twice per turn.',
            rules: { attackLimit: 2 },
        },
        'three-actions': {
            short: 'Each creature attacks once',
            name: 'Free Attacks', category: 'attacks', cost: 1, basic: true,
            text: 'Back to normal: every ready creature may attack once per turn.',
            rules: {},
        },
        haste: {
            short: 'Each creature attacks twice',
            name: 'Axiom of Haste', category: 'attacks',
            text: 'Every creature may attack twice per turn.',
            flavour: 'Jump to the conclusion. What could go wrong?',
            rules: { attacksPerCreature: 2 },
        },
        thrift: {
            short: 'Creatures cost 1 less',
            name: 'Small Assumptions', category: 'cost', cost: 1,
            text: 'Creature cards cost 1 less energy.',
            rules: { costDelta: -1 },
        },
        luxury: {
            short: 'Creatures cost 1 more',
            name: 'Costly Assumptions', category: 'cost', cost: 1,
            text: 'Creature cards cost 1 more energy.',
            rules: { costDelta: 1 },
        },
        abundance: {
            short: '+2 each turn',
            name: 'Growing Ideas', category: 'energy',
            text: 'Energy capacity grows by 2 each turn, up to 10.',
            rules: { growth: 2 },
        },
        study: {
            short: 'Draw 2 cards',
            name: 'Second Opinion', category: 'draw',
            text: 'Drawing from your deck or the axiom deck takes 2 cards.',
            rules: { drawCount: 2 },
        },
        vigilance: {
            short: 'Heal every turn',
            name: 'Rest and Recover', category: 'healing',
            text: 'Creatures heal fully at the start of their controller\'s turn.',
            flavour: 'What if every wound closed overnight? The same fight would end differently.',
            rules: { heal: true },
        },
        patience: {
            short: 'Damage stays',
            name: 'Wounds Remain', category: 'healing', cost: 1, basic: true,
            text: 'Back to normal: damage stays on creatures.',
            rules: { heal: false },
        },
        arrival: {
            short: 'Act at once',
            name: 'Ready on Arrival', category: 'arrival',
            text: 'New creatures can attack and activate on the turn they arrive.',
            rules: { arrivalReady: true },
        },
        choice: {
            short: 'Off (attack anyone)',
            name: 'Axiom of Choice', category: 'targeting',
            text: 'Guard is ignored: attackers may choose any target.',
            flavour: 'You can always pick one thing from each set, even when no rule says which.',
            rules: { ignoreGuard: true },
        },
        mercy: {
            short: 'Defeated go to hand',
            name: 'Axiom of Mercy', category: 'defeat',
            text: 'Defeated creatures go back to their owner\'s hand, fully healed.',
            flavour: 'Nothing is ever really refuted. It just goes back on the shelf.',
            rules: { mercy: true },
        },
        crowd: {
            short: '+1 attack for each friend',
            name: 'Axiom of the Crowd', category: 'power',
            text: 'Each creature gets +1 attack for every other creature on its side.',
            flavour: 'Is something truer because more people agree with it?',
            powerMod(state, card, H) { return H.boardOf(state, card.controller).filter(cid => cid !== card.cid).length; },
        },
        'curved-space': {
            short: 'Wheel runs backwards',
            name: 'The Broken Postulate', category: 'colour',
            text: 'The colour wheel runs backwards: each colour beats the one that normally beats it.',
            flavour: 'Drop Euclid\'s parallel postulate and geometry curves. Still consistent, just different.',
            rules: { wheelReversed: true },
        },
        silence: {
            short: 'Activate costs 1 more',
            name: 'Axiom of Silence', category: 'abilities',
            text: 'Activating a creature ability costs 1 more energy.',
            flavour: 'Some rules make an action harder rather than forbid it.',
            rules: { abilityCostDelta: 1 },
        },
        'empty-set': {
            short: 'Abilities OFF',
            name: 'Axiom of the Empty Set', category: 'abilities', cost: 3,
            text: 'All creature abilities and keywords are switched off.',
            flavour: 'There is a set with nothing in it. Now the creatures are just numbers.',
            rules: { abilitiesOff: true },
        },
        induction: {
            short: 'A winner of a fight gets +1/+1',
            name: 'Principle of Induction', category: 'growth',
            text: 'A creature that defeats an enemy in a fight and survives gets +1/+1.',
            flavour: 'It worked once, and it worked the next time. So it always works… right?',
            onFightWon(api, card) { api.buff(card.cid, 1, 1, 'Induction'); },
        },
        doubt: {
            short: 'Hero hits deal only 1',
            name: 'Axiom of Doubt', category: 'damage',
            text: 'Attacks on heroes remove only 1 heart, however strong the attacker.',
            flavour: 'Big claims shrink when you doubt them.',
            rules: { heroDamageCap: 1 },
        },

        // ---- plays per turn (a Fluxx-style "Play N"; basic: 2 card plays) ----
        restraint: {
            short: 'Only 1 card play per turn',
            name: 'Axiom of Restraint', category: 'plays', cost: 1,
            text: 'Each player may play only 1 card per turn (creature, tactic or rule card).',
            flavour: 'Fewer moves, harder choices.',
            rules: { playLimit: 1 },
        },
        'two-plays': {
            short: '2 card plays per turn',
            name: 'Two Moves', category: 'plays', cost: 1, basic: true,
            text: 'Back to normal: each player may play 2 cards per turn.',
            rules: {},
        },
        plenty: {
            short: '3 card plays per turn',
            name: 'Axiom of Plenty', category: 'plays',
            text: 'Each player may play 3 cards per turn.',
            flavour: 'More moves make room for bigger plans.',
            rules: { playLimit: 3 },
        },
        infinity: {
            short: 'Play any number of cards',
            name: 'Axiom of Infinity', category: 'plays', cost: 3,
            text: 'No limit: play as many cards as your energy allows.',
            flavour: 'There is an infinite set. Mathematicians simply decided so.',
            rules: { playLimit: Infinity },
        },

        // ---- energy ----
        'steady-state': {
            short: 'Energy stops growing',
            name: 'Steady State', category: 'energy',
            text: 'Energy capacity does not grow. It still refills every turn.',
            flavour: 'What if nothing ever changed? Then nothing would ever get bigger either.',
            rules: { growth: 0 },
        },
        'diminishing-returns': {
            short: 'Energy shrinks by 1 each turn',
            name: 'Diminishing Returns', category: 'energy', cost: 3,
            text: 'Energy capacity goes DOWN by 1 each turn (never below 1).',
            flavour: 'Each extra hour of study teaches a little less than the one before.',
            rules: { growth: -1 },
        },

        // ---- hand limit ----
        'limited-memory': {
            short: 'Hand limit 3',
            name: 'Limited Memory', category: 'hand',
            text: 'At the end of your turn, keep at most 3 cards in hand. The oldest cards are discarded.',
            flavour: 'Nobody can hold every idea in mind at once.',
            rules: { handCap: 3 },
        },

        // ---- bonuses (one at a time) ----
        'fresh-start': {
            short: 'Empty hand: draw 2',
            name: 'Fresh Start', category: 'bonus', cost: 1,
            text: 'If you start your turn with no cards in hand, draw 2 cards.',
            flavour: 'An empty mind is a place to begin.',
            rules: { bonus: 'fresh-start' },
        },
        'fair-share': {
            short: 'Fewer creatures: draw 1',
            name: 'Fair Share', category: 'bonus',
            text: 'At the start of your turn, if you have fewer creatures in play than your opponent, draw 1 card.',
            flavour: 'Is it fair to help the one who is behind?',
            rules: { bonus: 'fair-share' },
        },
        momentum: {
            short: 'More creatures: +1 play',
            name: 'Momentum', category: 'bonus',
            text: 'At the start of your turn, if you have more creatures in play than your opponent, you get +1 card play this turn.',
            flavour: 'Success makes success easier. Is that fair?',
            rules: { bonus: 'momentum' },
        },
        think: {
            short: 'Unused plays: draw cards',
            name: 'Think It Over', category: 'bonus',
            text: 'At the end of your turn, draw 1 card for each card play you did not use (at most 2).',
            flavour: 'Sometimes the best move is to wait and think.',
            rules: { bonus: 'think' },
        },

        // ---- spotlights: can be won and added to a player's pool ----
        'age-of-reason': spotlight('age-of-reason', 'reason', 'Age of Reason', 'Doubt everything, then rebuild it step by step.'),
        'age-of-feeling': spotlight('age-of-feeling', 'emotion', 'Age of Feeling', 'The heart has reasons that reason does not know.'),
        'age-of-rhetoric': spotlight('age-of-rhetoric', 'language', 'Age of Rhetoric', 'Whoever names the thing frames the debate.'),
        'age-of-observation': spotlight('age-of-observation', 'perception', 'Age of Observation', 'Look first. Theorise later.'),
        'age-of-wonder': spotlight('age-of-wonder', 'imagination', 'Age of Wonder', 'Every proof starts as a guess somebody dared to make.'),
        'age-of-tradition': spotlight('age-of-tradition', 'memory', 'Age of Tradition', 'We have always done it this way. Is that a reason?'),

        // ---- own cards: never in the shared deck ----
        // Granny's reward for saving her at the Ch2 Hall (flag `spare-axiom`, STORY.md stakes.ch2 tiers 1–2):
        // the player starts every card battle with it in hand (js/ui/battles.js myDeck → ownAxioms).
        'spare-axiom': {
            short: 'Clear all rules, draw 1',
            name: 'Granny\'s Spare Axiom', category: 'reset', cost: 1, own: true, clearRules: true, draws: 1,
            text: 'Clear every rule in play. Draw a card.',
            flavour: 'When the rules get silly, go back to what you know.',
        },
    };

    Object.entries(axioms).forEach(([id, a]) => {
        a.id = id;
        if (a.cost == null) a.cost = 2;
        a.flavour = a.flavour || 'Change an assumption and the same situation can have a different result.';
    });
    Rift.data.axioms = axioms;

    // Available starting rules. Each side selects ten; earned rules expand the pool.
    Rift.data.axiomDecks = {
        default: ['underdog', 'reverse-hearts', 'normal-hearts', 'thrift', 'abundance', 'study', 'arrival', 'vigilance', 'choice', 'mercy'],
        starter: ['underdog', 'one-action', 'two-actions', 'three-actions', 'reverse-hearts', 'normal-hearts',
            'thrift', 'luxury', 'abundance', 'study', 'vigilance', 'patience', 'arrival', 'silence', 'haste', 'mercy', 'crowd',
            'excluded-middle', 'extensionality', 'choice', 'curved-space', 'empty-set', 'induction', 'doubt',
            // Fluxx-style rules: card plays per turn, energy growth, hand limit, bonuses
            'restraint', 'two-plays', 'plenty', 'infinity', 'steady-state', 'diminishing-returns', 'limited-memory',
            'fresh-start', 'fair-share', 'momentum', 'think'],
    };
})(typeof window !== 'undefined' ? window : globalThis);
