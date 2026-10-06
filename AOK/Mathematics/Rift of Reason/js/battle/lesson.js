/*
 * Granny's guided card lesson: a fixed teaching match on the real engine.
 * The battle screen runs it in guide mode (js/screens/battle.js, js/screens/battle-lesson.js).
 *
 * Each step: { title, text, label, expect, replies, compare? }
 *   expect   the ONE action the learner must take (matched on every key it lists)
 *   replies  actions applied afterwards with a visible pause (Granny's turn, and the
 *            learner's routine draw/end where the step says so)
 *   compare  [attacker, defender]: show "Same cards, different rule" for this fight
 * Every step is legal in the normal engine (tools/test/battle-lesson.test.mjs replays them).
 *
 * Rift.Battle.Lesson = { steps, create, config, advance, starter, team, guide }
 */
(function (root) {
    'use strict';
    const Rift = root.Rift, Battle = Rift.Battle || (Rift.Battle = {});

    const steps = [
        { title: 'Choose your draw', label: 'Draw from your deck',
            text: 'Each turn starts with one choice. Draw from your deck, take a rule card, or move the Fate track. Today, draw from your deck. Granny starts with only 2 hearts, so the lesson is short.',
            expect: { type: 'draw', choice: 'deck' }, replies: [] },
        { title: 'Play a creature', label: 'Play Kardashiant',
            text: 'You have 1 energy. Kardashiant costs 1. Drag it onto your side of the table, or click it and press Play. New creatures are asleep. They attack next turn.',
            expect: { type: 'play', cid: 'p0c0' }, replies: [] },
        { title: 'End your turn', label: 'End turn',
            text: 'Your energy is spent. Press End turn. Granny will play a creature. Next turn you get 2 energy, and you draw again.',
            expect: { type: 'end' }, replies: [{ type: 'draw', choice: 'deck' }, { type: 'play', cid: 'p1c0' }, { type: 'end' }, { type: 'draw', choice: 'deck' }] },
        { title: 'Attack a creature', label: 'Attack her Kardashiant',
            text: 'Your Kardashiant is awake. Drag it onto Granny\'s Kardashiant. Both deal 1 damage at the same time. Damage stays: the red number shows the health left.',
            expect: { type: 'attack', cid: 'p0c0', target: 'p1c0' }, replies: [] },
        { title: 'Spend your energy', label: 'Play Astrophysicat',
            text: 'Play Astrophysicat for 2 energy. That uses all your energy, so your turn then ends for you. Watch Granny\'s turn.',
            expect: { type: 'play', cid: 'p0c1' }, replies: [{ type: 'end' }, { type: 'draw', choice: 'deck' }, { type: 'play', cid: 'p1c1' }, { type: 'end' }, { type: 'draw', choice: 'deck' }] },
        { title: 'Guard comes first', label: 'Attack Khaby',
            text: 'Khaby has Guard. While it stands, you must attack Khaby first. Only Khaby glows. Your hurt Kardashiant attacks it. Your creature is defeated, but Khaby is hurt too.',
            expect: { type: 'attack', cid: 'p0c0', target: 'p1c1' }, replies: [] },
        { title: 'Activate an ability', label: 'Activate Astrophysicat',
            text: 'Astrophysicat has an Activate ability: pay 1 energy to draw a card. Activating uses its attack for this turn. Click it, then press Activate.',
            expect: { type: 'activate', cid: 'p0c1', ability: 'well-actually' }, replies: [] },
        { title: 'An Entrance with a target', label: 'Play Eelish on Khaby',
            text: 'Eelish has an Entrance: when it arrives, an enemy creature loses its abilities. Drop Eelish on Khaby. Khaby loses Guard. Then your turn ends.',
            expect: { type: 'play', cid: 'p0c3', target: 'p1c1' }, replies: [{ type: 'end' }, { type: 'draw', choice: 'deck' }, { type: 'play', cid: 'p1c2' }, { type: 'end' }, { type: 'draw', choice: 'deck' }] },
        { title: 'Attack the hero', label: 'Attack Granny',
            text: 'No Guard is left. Drag Astrophysicat onto Granny\'s portrait. An attack on a hero removes hearts equal to the attack.',
            expect: { type: 'attack', cid: 'p0c1', target: 'h1' }, replies: [] },
        { title: 'Play a tactic', label: 'Counterexample on Khaby',
            text: 'Tactic cards work once, then go to your discard pile. Counterexample deals 3 damage. Drop it on Khaby.',
            expect: { type: 'play', cid: 'p0t0', target: 'p1c1' }, replies: [] },
        { title: 'One more creature', label: 'Play Zuckerborg',
            text: 'Play Zuckerborg. Read its Last Word: when it is defeated, it returns to your hand once. Then Granny attacks your hero.',
            expect: { type: 'play', cid: 'p0c2' }, replies: [{ type: 'end' }, { type: 'draw', choice: 'deck' }, { type: 'attack', cid: 'p1c0', target: 'h0' }, { type: 'end' }, { type: 'draw', choice: 'deck' }] },
        { title: 'A Last Word', label: 'Attack Shakirattle',
            text: 'Attack Shakirattle with Zuckerborg. Green beats violet on the colour wheel, so Shakirattle hits with 4. Zuckerborg is defeated, but its Last Word sends it back to your hand.',
            expect: { type: 'attack', cid: 'p0c2', target: 'p1c2' }, replies: [] },
        { title: 'Change a rule', label: 'Play the Underdog rule',
            text: 'Rule cards change the game for both players. Drag the Axiom of the Underdog to the centre lane. Now only the creature with LOWER attack deals damage.',
            expect: { type: 'axiom', choice: 'underdog' }, replies: [], compare: ['p0c1', 'p1c2'] },
        { title: 'Same cards, different result', label: 'Attack Shakirattle',
            text: 'Attack Shakirattle with Astrophysicat. Normally both would fall. Under Underdog only Shakirattle falls. Same cards, different rule, different result. Then Granny plays a rule.',
            expect: { type: 'attack', cid: 'p0c1', target: 'p1c2' }, replies: [{ type: 'end' }, { type: 'draw', choice: 'deck' }, { type: 'axiom', choice: 'reverse-hearts' }, { type: 'end' }], compare: ['p0c1', 'p1c2'] },
        { title: 'Read the victory rule', label: 'Fate 2 closer',
            text: 'Granny played The Last Shall Be First. Now reaching zero hearts WINS. If you hit her now, she wins! The Fate track is 2 spaces from a reset. Choose Fate 2 closer: every rule goes back to the basics.',
            expect: { type: 'draw', choice: 'forward' }, replies: [] },
        { title: 'Win by the current rules', label: 'Attack Granny',
            text: 'The reset worked. Rules now says: reduce the enemy hero to zero hearts. Drag Eelish onto Granny to win. Always read the rules before you attack.',
            expect: { type: 'attack', cid: 'p0c3', target: 'h1' }, replies: [] },
    ];

    function team(ids, prefix) {
        return ids.map((species, i) => ({ uid: prefix + i, species, loaner: true, injuries: [], scars: [], powerDelta: 0, warped: null, trophyOf: null }));
    }
    // A loaned 10-creature team for anyone without a collection (story match, practice).
    function starter() {
        return team(['astrophysicat', 'zuckerborg', 'speedcheeta', 'lobstorian', 'muskrat', 'astrophysicat', 'zuckerborg', 'speedcheeta', 'lobstorian', 'muskrat'], 'lesson-you-');
    }

    const YOU = ['kardashiant', 'astrophysicat', 'zuckerborg', 'eelish', 'speedcheeta', 'beansprout'];
    const GRANNY = ['kardashiant', 'khaby', 'shakirattle', 'astrophysicat', 'eelish', 'beansprout', 'zuckerborg', 'siuuugull', 'keanu'];
    function config() {
        return {
            seed: 'card-arena-lesson',
            players: [
                { id: 'you', name: 'You', team: team(YOU, 'lesson-you-'), tactics: ['counterexample', 'second-wind', 'stand-firm'], hearts: 6 },
                { id: 'granny', name: 'Granny Axiom', team: team(GRANNY, 'lesson-granny-'), tactics: [], hearts: 2 },
            ],
            // Opening rule cards: Underdog for you, the reversed victory rule for Granny;
            // the first Fate flip is the harmless Wounds Remain.
            axiomDeck: ['underdog', 'reverse-hearts', 'patience', 'normal-hearts', 'thrift', 'arrival'],
            options: { mode: 'practice', first: 0, shuffle: false, shuffleAxioms: false, timeline: true, spark: false,
                openHand: [3, 3], openAxioms: 1, deckSize: 9, minCreatures: 1, hearts: 6 },
        };
    }
    function create() { return Battle.Engine.createBattle(config()); }
    function advance(state, index) {
        const step = steps[index];
        if (!step) throw Error('Unknown lesson step');
        return [step.expect].concat(step.replies || []).reduce((s, a) => Battle.Engine.applyAction(s, a), state);
    }
    // Guide-mode parameters for the battle screen.
    function guide() { return { steps, create }; }

    Battle.Lesson = { steps, create, config, advance, starter, team, guide };
})(typeof window !== 'undefined' ? window : globalThis);
