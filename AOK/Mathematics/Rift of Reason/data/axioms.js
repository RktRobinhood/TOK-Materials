/*
 * Battle rules data: the colour wheel (Ways of Knowing) and the shared AXIOM DECK.
 *
 * Paid rewrites affect BOTH players and persist by category until replaced.
 * The visible timeline alternates free flips and full resets from round four.
 * The engine (js/battle/engine.js) reads these hooks; nothing here touches the DOM.
 *
 * Axiom hooks (all optional):
 *   powerMod(state, card, H)      → number added to the card's power (H = engine helpers)
 *   resolveFight(pa, pb)          → { attackerDefeated, blockerDefeated } replaces the normal rule
 *   onFightWon(api, card)         → after a fight, for each creature that beat its opponent
 *   noSteals, hiddenAttacker, attackAfterPlay, defeatedToHand,
 *   attackerChoosesBlocker, wheelReversed, abilitiesOff   (flags)
 */
(function (root) {
    'use strict';
    const Rift = root.Rift;

    // ---- colour wheel ------------------------------------------------------
    // A clean 5-cycle. Each colour beats the next one (+2 power when it fights
    // that colour). Memory is colourless: it neither beats nor is beaten.
    Rift.data.wheel = {
        bonus: 2,
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
        id, name, colour,
        text: `${Rift.COLOURS[colour].name} creatures get +2 power.`,
        flavour,
        powerMod(state, card, H) { return H.colourOf(state, card) === colour ? 2 : 0; },
    });

    const axioms = {
        underdog: {
            id: 'underdog', name: 'Axiom of the Underdog',
            text: 'In every fight the weaker creature wins. (A tie still defeats both.)',
            flavour: 'Who decided that bigger beats smaller? Change the axiom and the result changes.',
            resolveFight(pa, pb) {
                if (pa === pb) return { attackerDefeated: true, blockerDefeated: true };
                return { attackerDefeated: pa > pb, blockerDefeated: pb > pa };
            },
        },
        silence: {
            id: 'silence', name: 'Axiom of Silence',
            text: 'Activating a creature ability costs 3 energy.',
            flavour: 'Some rules forbid an action rather than describe one.',
            rules: { abilityCost: 3 },
        },
        doubt: {
            id: 'doubt', name: 'Axiom of Doubt',
            text: 'Attacks are face-down: the defender only learns which creature attacked after deciding whether to block.',
            flavour: 'You must decide before you can be certain. Welcome to most of life.',
            hiddenAttacker: true,
        },
        haste: {
            id: 'haste', name: 'Axiom of Haste',
            text: 'Each player may take 4 actions per turn.',
            flavour: 'Jump to the conclusion. What could go wrong?',
            rules: { actions: 4 },
        },
        mercy: {
            id: 'mercy', name: 'Axiom of Mercy',
            text: 'Defeated creatures go back to their controller\'s hand instead of the discard pile.',
            flavour: 'Nothing is ever really refuted. It just goes back on the shelf.',
            defeatedToHand: true,
        },
        crowd: {
            id: 'crowd', name: 'Axiom of the Crowd',
            text: 'Each creature gets +1 power for every other creature on its side.',
            flavour: 'Is something truer because more people agree with it?',
            powerMod(state, card, H) {
                const board = H.boardOf(state, card.controller);
                return board.filter(cid => cid !== card.cid).length;
            },
        },
        'excluded-middle': {
            id: 'excluded-middle', name: 'Law of the Excluded Middle',
            text: 'No draws: when a fight is tied, the attacker wins.',
            flavour: 'Every statement is either true or false. There is no in-between.',
            resolveFight(pa, pb) {
                if (pa === pb) return { attackerDefeated: false, blockerDefeated: true };
                return { attackerDefeated: pa < pb, blockerDefeated: pb < pa };
            },
        },
        extensionality: {
            id: 'extensionality', name: 'Axiom of Extensionality',
            text: 'Equal is equal: when a fight is tied, neither creature is defeated.',
            flavour: 'Two sets with exactly the same members are the same set.',
            resolveFight(pa, pb) {
                if (pa === pb) return { attackerDefeated: false, blockerDefeated: false };
                return { attackerDefeated: pa < pb, blockerDefeated: pb < pa };
            },
        },
        choice: {
            id: 'choice', name: 'Axiom of Choice',
            text: 'When you attack, you may choose which enemy creature must block.',
            flavour: 'You can always pick one thing from each set, even when no rule says which.',
            attackerChoosesBlocker: true,
        },
        'curved-space': {
            id: 'curved-space', name: 'The Broken Postulate',
            text: 'The colour wheel runs backwards: each colour beats the one that normally beats it.',
            flavour: 'Drop Euclid\'s parallel postulate and geometry curves. Still consistent, just different.',
            wheelReversed: true,
        },
        'empty-set': {
            id: 'empty-set', name: 'Axiom of the Empty Set',
            text: 'All creature abilities are switched off.',
            flavour: 'There is a set with nothing in it. Now the creatures are just numbers.',
            abilitiesOff: true,
        },
        induction: {
            id: 'induction', name: 'Principle of Induction',
            text: 'A creature that wins a fight gets +1 power for the rest of the battle.',
            flavour: 'It worked once, and it worked the next time. So it always works… right?',
            onFightWon(api, card) {
                api.addBoost(card, 'Induction', 1);
            },
        },

        // ---- spotlights: can be won and added to a player's pool ----
        'age-of-reason': spotlight('age-of-reason', 'reason', 'Age of Reason', 'Doubt everything, then rebuild it step by step.'),
        'age-of-feeling': spotlight('age-of-feeling', 'emotion', 'Age of Feeling', 'The heart has reasons that reason does not know.'),
        'age-of-rhetoric': spotlight('age-of-rhetoric', 'language', 'Age of Rhetoric', 'Whoever names the thing frames the debate.'),
        'age-of-observation': spotlight('age-of-observation', 'perception', 'Age of Observation', 'Look first. Theorise later.'),
        'age-of-wonder': spotlight('age-of-wonder', 'imagination', 'Age of Wonder', 'Every proof starts as a guess somebody dared to make.'),
        'age-of-tradition': spotlight('age-of-tradition', 'memory', 'Age of Tradition', 'We have always done it this way. Is that a reason?'),
    };

    Object.assign(axioms, {
        'one-action': {name:'One Step at a Time', text:'Each player may take 1 action per turn.', rules:{actions:1}, category:'actions'},
        'two-actions': {name:'Two Paths', text:'Each player may take 2 actions per turn.', rules:{actions:2}, category:'actions'},
        'three-actions': {name:'Rule of Three', text:'Each player may take 3 actions per turn.', rules:{actions:3}, category:'actions'},
        'reverse-hearts': {name:'The Last Shall Be First', text:'Reach zero of YOUR OWN hearts to win. Giving the opponent their last hit makes THEM win.', rules:{reverseHearts:true}, category:'victory'},
        'normal-hearts': {name:'Back to the Goal', text:'Reduce the opponent to zero hearts to win.', rules:{reverseHearts:false}, category:'victory'},
        thrift: {name:'Small Assumptions', text:'Creature cards cost 1 less energy (minimum 1).', rules:{playCostDelta:-1}, category:'cost'},
        luxury: {name:'Costly Assumptions', text:'Creature cards cost 1 more energy.', rules:{playCostDelta:1}, category:'cost'},
        abundance: {name:'Growing Ideas', text:'Energy capacity grows by 2 each turn, up to 10.', rules:{growth:2}, category:'energy'},
        study: {name:'Second Opinion', text:'Draw 2 creature cards at the start of your turn.', rules:{draw:2}, category:'draw'},
        vigilance: {name:'Unspent Potential', text:'Attacking, blocking and activating do not exhaust creatures. Each still uses an action or response.', rules:{exhaust:false}, category:'exhaustion'},
        patience: {name:'Time to Think', text:'Attacking, blocking and activating exhaust creatures until their next turn.', rules:{exhaust:true}, category:'exhaustion'},
        arrival: {name:'Ready on Arrival', text:'Newly played creatures can attack or activate immediately.', rules:{arrivalReady:true}, category:'arrival'},
    });
    const categories = {underdog:'combat', silence:'abilities', doubt:'visibility', haste:'actions', mercy:'defeat', crowd:'power',
        'excluded-middle':'combat', extensionality:'combat', choice:'targeting', 'curved-space':'colour', 'empty-set':'abilities', induction:'growth'};
    Object.entries(axioms).forEach(([id,a]) => {
        a.id=id; a.category=a.category || categories[id] || 'colour';
        a.flavour=a.flavour || 'Change an assumption and the same situation can have a different result.';
    });
    Rift.data.axioms = axioms;

    // Available starting rules. Each side selects ten; earned rules expand the pool.
    Rift.data.axiomDecks = {
        default: ['underdog','three-actions','normal-hearts','thrift','abundance','study','arrival','patience','choice','mercy'],
        starter: ['underdog', 'one-action', 'two-actions', 'three-actions', 'reverse-hearts', 'normal-hearts',
            'thrift', 'luxury', 'abundance', 'study', 'vigilance', 'patience', 'arrival', 'silence', 'haste', 'mercy', 'crowd',
            'excluded-middle', 'extensionality', 'choice', 'curved-space', 'empty-set', 'induction'],
    };
})(typeof window !== 'undefined' ? window : globalThis);
