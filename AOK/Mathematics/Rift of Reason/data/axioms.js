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
 *   basic: true                   → it restates the default rule ("Back to normal"). Playing it still
 *                                   replaces (removes) the active rule in its category.
 *   rules: { ... }                → values merged over Engine.rules defaults
 *   powerMod(state, card, H)      → attack added to a creature
 *   resolveFight(pa, pb)          → { toAttacker, toDefender } replaces normal fight damage
 *   defenderSurvivesTrade         → if both fighters would fall, the defender keeps 1 health
 *   onFightWon(api, card)         → for a creature that defeated its foe and survived
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
        text: Rift.COLOURS[colour].name + ' creatures get +2 attack.',
        flavour,
        powerMod(state, card, H) { return H.colourOf(state, card) === colour ? 2 : 0; },
    });

    const axioms = {
        underdog: {
            name: 'Axiom of the Underdog', category: 'combat',
            text: 'In a fight, only the creature with LOWER attack deals damage. Equal attack: both deal damage.',
            flavour: 'Who decided that bigger beats smaller? Change the axiom and the result changes.',
            resolveFight(pa, pb) {
                if (pa === pb) return { toAttacker: pb, toDefender: pa };
                return pa < pb ? { toAttacker: 0, toDefender: pa } : { toAttacker: pb, toDefender: 0 };
            },
        },
        'excluded-middle': {
            name: 'Law of the Excluded Middle', category: 'combat',
            text: 'No double defeats: if both fighters would be defeated, the defender survives with 1 health.',
            flavour: 'Every statement is either true or false. There is no in-between.',
            defenderSurvivesTrade: true,
        },
        extensionality: {
            name: 'Axiom of Extensionality', category: 'combat',
            text: 'Equal is equal: creatures with the same attack deal no damage to each other.',
            flavour: 'Two sets with exactly the same members are the same set.',
            resolveFight(pa, pb) { return pa === pb ? { toAttacker: 0, toDefender: 0 } : { toAttacker: pb, toDefender: pa }; },
        },
        'reverse-hearts': {
            name: 'The Last Shall Be First', category: 'victory', cost: 3,
            text: 'Reach zero of YOUR OWN hearts to win. Taking the opponent to zero makes THEM win.',
            rules: { reverseHearts: true },
        },
        'normal-hearts': {
            name: 'Back to the Goal', category: 'victory', cost: 1, basic: true,
            text: 'Back to normal: reduce the enemy hero to zero hearts to win.',
            rules: { reverseHearts: false },
        },
        'one-action': {
            name: 'One Step at a Time', category: 'attacks',
            text: 'Each player may attack only once per turn.',
            rules: { attackLimit: 1 },
        },
        'two-actions': {
            name: 'Two Paths', category: 'attacks',
            text: 'Each player may attack only twice per turn.',
            rules: { attackLimit: 2 },
        },
        'three-actions': {
            name: 'Free Attacks', category: 'attacks', cost: 1, basic: true,
            text: 'Back to normal: every ready creature may attack once per turn.',
            rules: {},
        },
        haste: {
            name: 'Axiom of Haste', category: 'attacks',
            text: 'Every creature may attack twice per turn.',
            flavour: 'Jump to the conclusion. What could go wrong?',
            rules: { attacksPerCreature: 2 },
        },
        thrift: {
            name: 'Small Assumptions', category: 'cost', cost: 1,
            text: 'Creature cards cost 1 less energy.',
            rules: { costDelta: -1 },
        },
        luxury: {
            name: 'Costly Assumptions', category: 'cost', cost: 1,
            text: 'Creature cards cost 1 more energy.',
            rules: { costDelta: 1 },
        },
        abundance: {
            name: 'Growing Ideas', category: 'energy',
            text: 'Energy capacity grows by 2 each turn, up to 10.',
            rules: { growth: 2 },
        },
        study: {
            name: 'Second Opinion', category: 'draw',
            text: 'Drawing from your deck or the axiom deck takes 2 cards.',
            rules: { drawCount: 2 },
        },
        vigilance: {
            name: 'Rest and Recover', category: 'healing',
            text: 'Creatures heal fully at the start of their controller\'s turn.',
            flavour: 'What if every wound closed overnight? The same fight would end differently.',
            rules: { heal: true },
        },
        patience: {
            name: 'Wounds Remain', category: 'healing', cost: 1, basic: true,
            text: 'Back to normal: damage stays on creatures.',
            rules: { heal: false },
        },
        arrival: {
            name: 'Ready on Arrival', category: 'arrival',
            text: 'New creatures can attack and activate on the turn they arrive.',
            rules: { arrivalReady: true },
        },
        choice: {
            name: 'Axiom of Choice', category: 'targeting',
            text: 'Guard is ignored: attackers may choose any target.',
            flavour: 'You can always pick one thing from each set, even when no rule says which.',
            rules: { ignoreGuard: true },
        },
        mercy: {
            name: 'Axiom of Mercy', category: 'defeat',
            text: 'Defeated creatures go back to their owner\'s hand, fully healed.',
            flavour: 'Nothing is ever really refuted. It just goes back on the shelf.',
            rules: { mercy: true },
        },
        crowd: {
            name: 'Axiom of the Crowd', category: 'power',
            text: 'Each creature gets +1 attack for every other creature on its side.',
            flavour: 'Is something truer because more people agree with it?',
            powerMod(state, card, H) { return H.boardOf(state, card.controller).filter(cid => cid !== card.cid).length; },
        },
        'curved-space': {
            name: 'The Broken Postulate', category: 'colour',
            text: 'The colour wheel runs backwards: each colour beats the one that normally beats it.',
            flavour: 'Drop Euclid\'s parallel postulate and geometry curves. Still consistent, just different.',
            rules: { wheelReversed: true },
        },
        silence: {
            name: 'Axiom of Silence', category: 'abilities',
            text: 'Activating a creature ability costs 1 more energy.',
            flavour: 'Some rules make an action harder rather than forbid it.',
            rules: { abilityCostDelta: 1 },
        },
        'empty-set': {
            name: 'Axiom of the Empty Set', category: 'abilities', cost: 3,
            text: 'All creature abilities and keywords are switched off.',
            flavour: 'There is a set with nothing in it. Now the creatures are just numbers.',
            rules: { abilitiesOff: true },
        },
        induction: {
            name: 'Principle of Induction', category: 'growth',
            text: 'A creature that defeats an enemy in a fight and survives gets +1/+1.',
            flavour: 'It worked once, and it worked the next time. So it always works… right?',
            onFightWon(api, card) { api.buff(card.cid, 1, 1, 'Induction'); },
        },
        doubt: {
            name: 'Axiom of Doubt', category: 'damage',
            text: 'Attacks on heroes remove only 1 heart, however strong the attacker.',
            flavour: 'Big claims shrink when you doubt them.',
            rules: { heroDamageCap: 1 },
        },

        // ---- spotlights: can be won and added to a player's pool ----
        'age-of-reason': spotlight('age-of-reason', 'reason', 'Age of Reason', 'Doubt everything, then rebuild it step by step.'),
        'age-of-feeling': spotlight('age-of-feeling', 'emotion', 'Age of Feeling', 'The heart has reasons that reason does not know.'),
        'age-of-rhetoric': spotlight('age-of-rhetoric', 'language', 'Age of Rhetoric', 'Whoever names the thing frames the debate.'),
        'age-of-observation': spotlight('age-of-observation', 'perception', 'Age of Observation', 'Look first. Theorise later.'),
        'age-of-wonder': spotlight('age-of-wonder', 'imagination', 'Age of Wonder', 'Every proof starts as a guess somebody dared to make.'),
        'age-of-tradition': spotlight('age-of-tradition', 'memory', 'Age of Tradition', 'We have always done it this way. Is that a reason?'),
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
            'excluded-middle', 'extensionality', 'choice', 'curved-space', 'empty-set', 'induction', 'doubt'],
    };
})(typeof window !== 'undefined' ? window : globalThis);
