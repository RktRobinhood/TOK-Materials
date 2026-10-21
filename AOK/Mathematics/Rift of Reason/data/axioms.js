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
 *   pack: 'fate'                  → the later Fate pack (#121): defined, but in no pool or grant list yet
 */
(function (root) {
    'use strict';
    const Rift = root.Rift;

    // ---- colour wheel ------------------------------------------------------
    // Approved six-colour cycle: next two Strong +1, previous two Weak -1,
    // opposite and self neutral. Preserve the old order and append Memory.
    Rift.data.wheel = {
        bonus: 1,
        note: 'This colour wheel is a game rule. It does not rank Ways of Knowing in TOK; their usefulness depends on the question and evidence.',
        order: ['reason', 'emotion', 'language', 'perception', 'imagination', 'memory'],
        lines: {
            reason: 'Game rule: Reason is Strong against Emotion and Language. TOK prompt: when might a proof help check a strong feeling or a claim?',
            emotion: 'Game rule: Emotion is Strong against Language and Perception. TOK prompt: how can feelings affect what we notice?',
            language: 'Game rule: Language is Strong against Perception and Imagination. TOK prompt: how might names shape what we notice or imagine?',
            perception: 'Game rule: Perception is Strong against Imagination and Memory. TOK prompt: can new evidence challenge an imagined or remembered event?',
            imagination: 'Game rule: Imagination is Strong against Memory and Reason. TOK prompt: what new results follow if we change an axiom?',
            memory: 'Game rule: Memory is Strong against Reason and Emotion. TOK prompt: when can a remembered example challenge a proof or feeling?',
        },
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
            flavour: 'In classical logic, P or not P. The card uses this either/or idea to prevent a double defeat.',
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
            flavour: 'Choose one member from each non-empty set, even without a rule saying which. This card lets you choose any target.',
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
            text: 'The colour wheel runs backwards: Strong and Weak swap. Neutral matchups stay neutral.',
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
            name: 'Hasty Generalisation', category: 'growth',
            text: 'A creature that defeats an enemy in a fight and survives gets +1/+1.',
            flavour: 'A win makes this creature stronger. A few wins do not prove it always wins. Mathematical induction needs a base case and a proof from n to n + 1.',
            onFightWon(api, card) { api.buff(card.cid, 1, 1, 'Hasty Generalisation'); },
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
            short: 'Only 1 card activation per turn',
            name: 'Axiom of Restraint', category: 'plays', cost: 1,
            text: 'Each player has 1 card activation per turn: cast, attack or Activate.',
            flavour: 'Fewer moves, harder choices.',
            rules: { playLimit: 1 },
        },
        'two-plays': {
            short: '2 card activations per turn',
            name: 'Two Moves', category: 'plays', cost: 1, basic: true,
            text: 'Back to normal: each player has 2 card activations per turn: casts, attacks and Activate together.',
            rules: {},
        },
        plenty: {
            short: '3 card activations per turn',
            name: 'Axiom of Plenty', category: 'plays',
            text: 'Each player has 3 card activations per turn: casts, attacks and Activate together.',
            flavour: 'More moves make room for bigger plans.',
            rules: { playLimit: 3 },
        },
        infinity: {
            short: 'Unlimited card activations',
            name: 'Axiom of Infinity', category: 'plays', cost: 3,
            text: 'No card activation limit. Energy and creature readiness still apply.',
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
            short: 'More creatures: +1 activation',
            name: 'Momentum', category: 'bonus',
            text: 'At the start of your turn, if you have more creatures in play than your opponent, you get +1 card activation this turn.',
            flavour: 'Success makes success easier. Is that fair?',
            rules: { bonus: 'momentum' },
        },
        think: {
            short: 'Unused activations: draw cards',
            name: 'Think It Over', category: 'bonus',
            text: 'At the end of your turn, draw 1 card for each card activation you did not use (at most 2).',
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

        // ---- Fate timing (#121, CARD-DRAFTS.md "Axiom expansion drafts"): later earnable rules ----
        // Three categories, each replaced only by its own kind. A reset clears them, never the events already on
        // the Fate track: a delay rule changes only spells played while it is active. pack 'fate': no pool, grant
        // or starter names them yet (bench and tests only, like the Fate card pack in data/tactics.js).
        'patient-plans': {
            short: 'Fate spells 1 round later',
            name: 'Patient Plans', category: 'fate-delay', pack: 'fate',
            text: 'A spell put on the Fate track lands 1 round later (at most 4 rounds ahead). Spells already on the track stay where they are.',
            flavour: 'Good plans take time. Some take a little more.',
            rules: { fateDelay: 1 },
        },
        'hasty-plans': {
            short: 'Fate spells 1 round sooner',
            name: 'Hasty Plans', category: 'fate-delay', pack: 'fate',
            text: 'A spell put on the Fate track lands 1 round sooner (at least 1 round ahead). Spells already on the track stay where they are.',
            flavour: 'Why wait for tomorrow? Because tomorrow had a point.',
            rules: { fateDelay: -1 },
        },
        'open-calendar': {
            short: '3 Fate spells each',
            name: 'Open Calendar', category: 'fate-capacity', pack: 'fate',
            text: 'Each player may have 3 spells waiting on the Fate track instead of 2.',
            flavour: 'A free afternoon is just a plan you have not made yet.',
            rules: { scheduleExtra: 1 },
        },
        'gentle-consequences': {
            short: 'Fate spells take at most 1 ❤',
            name: 'Gentle Consequences', category: 'fate-impact', pack: 'fate',
            text: 'A spell from the Fate track takes at most 1 heart from each hero. Creatures take damage as normal.',
            flavour: 'The future arrives. It knocks first.',
            rules: { fateHeroCap: 1 },
        },

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

    // #101: common relative rules. The engine resolves these against the shared value, before
    // owner bonuses. Old named absolute rules keep their original meanings and IDs.
    const fluxIds = [];
    const fluxNames = {
        plays: ['One More Move', 'One Fewer Move', 'Two More Moves', 'Two Fewer Moves'],
        draw: ['One More Card', 'One Fewer Card', 'Two More Cards', 'Two Fewer Cards'],
        growth: ['Grow Faster', 'Grow Slower', 'Grow Much Faster', 'Grow Much Slower'],
        cost: ['A Little Costlier', 'A Little Cheaper', 'Much Costlier', 'Much Cheaper'],
    };
    [['plays', 'plays', 'playLimit', 'card activations per turn', '1–6'], ['draw', 'draw', 'drawCount', 'cards in the normal draw', '1–3'],
        ['growth', 'energy', 'growth', 'energy growth next turn', '−1–3'], ['cost', 'cost', 'costDelta', 'creature energy costs', '−2–2']].forEach(([key, category, field, label, bounds]) => {
        [1, -1, 2, -2].forEach((delta, i) => {
            const id = 'flux-' + key + '-' + (delta > 0 ? 'plus-' : 'minus-') + Math.abs(delta);
            fluxIds.push(id);
            axioms[id] = { name: fluxNames[key][i], category, cost: Math.abs(delta), rarity: 'common',
                short: (delta > 0 ? '+' : '−') + Math.abs(delta) + ' ' + label,
                text: 'For BOTH players, change ' + label + ' by ' + (delta > 0 ? '+' : '−') + Math.abs(delta) + '. Bounds: ' + bounds + '.' + (key === 'plays' ? ' Unlimited needs a fixed limit.' : ''),
                modifier: { field, delta } };
        });
    });
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
    Rift.data.axiomDecks.legacyStarter = Rift.data.axiomDecks.starter.slice();
    Rift.data.axiomDecks.default = ['flux-plays-plus-1', 'flux-plays-minus-1', 'flux-draw-plus-1', 'flux-draw-minus-1',
        'flux-growth-plus-1', 'flux-cost-plus-1', 'flux-cost-minus-1', 'limited-memory', 'momentum', 'two-plays'];
    Rift.data.axiomDecks.starter = Rift.data.axiomDecks.starter.filter(id => id !== 'infinity').concat(fluxIds);
    // Construction, never weighted draws: submitted loadouts and the final shared shuffle stay exact.
    Rift.data.flux = { ids: fluxIds, contribution(seed, eligible) {
        const rng = Rift.makeRng(seed);
        return rng.shuffle(rng.shuffle(fluxIds.slice()).slice(0, 7).concat(['limited-memory', 'momentum', eligible && rng.chance(0.25) ? 'infinity' : 'two-plays']));
    } };
})(typeof window !== 'undefined' ? window : globalThis);
