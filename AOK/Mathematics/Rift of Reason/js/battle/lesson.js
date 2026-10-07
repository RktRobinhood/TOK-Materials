/*
 * Granny's guided card lesson: a fixed teaching match on the real engine.
 * The battle screen runs it in guide mode (js/screens/battle.js, js/screens/battle-lesson.js).
 *
 * Each step: { title, text, label, expect, replies, compare? }
 *   expect   the ONE action the learner must take (matched on every key it lists)
 *   replies  actions applied afterwards with a visible pause (Granny's turn, and the
 *            learner's end where the step says so), and { say } lines Granny speaks between
 *            them (the screen waits for the voice to end before it goes on)
 *   compare  [attacker, defender]: show "Same cards, different rule" for this fight
 * Every step is legal in the normal engine (tools/test/battle-lesson.test.mjs replays them).
 *
 * Rift.Battle.Lesson = { steps, create, config, advance, starter, team, guide }
 */
(function (root) {
    'use strict';
    const Rift = root.Rift, Battle = Rift.Battle || (Rift.Battle = {});

    // Small blocks, in the order a careful player would really act (the teacher's playtest: no
    // attacking creatures while the enemy hero is open, unless Guard forces it or a reason is given).
    // A reply { say } is a line Granny speaks between her moves; the lesson waits for it to end.
    const steps = [
        { title: 'Your first draw', label: 'Draw from your deck',
            text: 'Every turn starts with ONE draw. Your deck gives a creature or a tactic. Rule card gives a card that changes a rule. Today, press Your deck.',
            expect: { type: 'draw', choice: 'deck' }, replies: [] },
        { title: 'Play a creature', label: 'Play Kim Kardashiant',
            text: 'You have 1 energy. Kim Kardashiant costs 1: see the blue number on the card. Drag Kim onto your side of the table.',
            expect: { type: 'play', cid: 'p0c0' },
            replies: [{ say: 'New creatures are asleep. Zzz. Kim can attack on your next turn.' }] },
        { title: 'End your turn', label: 'End turn',
            text: 'Your energy is spent. Press End turn, then watch Granny.',
            expect: { type: 'end' },
            replies: [{ say: 'My turn. I have only 1 energy, and my cards cost more. So I just draw.' },
                { type: 'draw', choice: 'deck' }, { type: 'end' },
                { say: 'Your turn again. Your energy grew to 2, and Kim is awake.' }] },
        { title: 'Draw', label: 'Draw from your deck',
            text: 'Start with your draw again.',
            expect: { type: 'draw', choice: 'deck' }, replies: [] },
        { title: 'Attack the hero', label: 'Attack Granny with Kim',
            text: 'My side of the table is empty, so nothing can stop you. Drag Kim onto my portrait. A hit on a hero takes hearts equal to its attack.',
            expect: { type: 'attack', cid: 'p0c0', target: 'h1' }, replies: [{ say: 'Ouch! 5 hearts left.' }] },
        { title: 'Spend your energy', label: 'Play Astrophysicat',
            text: 'Play Astrophysicat for 2 energy.',
            expect: { type: 'play', cid: 'p0c1' }, replies: [] },
        { title: 'Nothing left to do', label: 'End turn',
            text: 'No energy left. The End turn button glows green when nothing is left to do. Press it.',
            expect: { type: 'end' },
            replies: [{ type: 'draw', choice: 'deck' }, { type: 'play', cid: 'p1c0' },
                { say: 'I played Khaby Llame. See his silver shield frame? That means Guard.' },
                { type: 'end' }] },
        { title: 'The Fate track', label: 'Draw from your deck',
            text: 'Look at the Fate track in the middle. Every turn it moves one step. At NOW, a rule changes: creatures now cost 1 less. Next time, Fate resets all rules. Now draw.',
            expect: { type: 'draw', choice: 'deck' }, replies: [] },
        { title: 'Guard comes first', label: 'Attack Khaby Llame',
            text: 'You want to hit me, but Khaby Llame has Guard. While he stands, attacks must hit him first: only Khaby glows. Drag Astrophysicat onto Khaby.',
            expect: { type: 'attack', cid: 'p0c1', target: 'p1c0' },
            replies: [{ say: 'Both took 1 damage. Damage stays. And Khaby\'s own ability took Astrophysicat\'s ability away: see No ability.' }] },
        { title: 'An Entrance', label: 'Play Billie Eelish on Khaby',
            text: 'Billie Eelish has an Entrance: it works when you play her. Her Whisper takes away an enemy\'s special powers, like Guard. Drag her onto Khaby Llame.',
            expect: { type: 'play', cid: 'p0c3', target: 'p1c0' },
            replies: [{ say: 'Khaby lost his Guard. The way to me is open.' }] },
        { title: 'Hit the hero again', label: 'Attack Granny with Kim',
            text: 'Drag Kim onto my portrait.',
            expect: { type: 'attack', cid: 'p0c0', target: 'h1' }, replies: [{ say: '4 hearts left. You are doing well.' }] },
        { title: 'End your turn', label: 'End turn',
            text: 'Press End turn and watch my turn.',
            expect: { type: 'end' },
            replies: [{ type: 'draw', choice: 'deck' }, { type: 'play', cid: 'p1c1' },
                { say: 'Shakirattle! 3 attack, and Elusive: tactic cards can\'t target her.' },
                { type: 'attack', cid: 'p1c0', target: 'h0' },
                { say: 'Khaby hit you for 1 heart. The pictures on the left, Recent plays, show what I did.' },
                { type: 'end' },
                { say: 'Your turn. Shakirattle hits hard. Let\'s deal with my creatures.' }] },
        { title: 'Draw', label: 'Draw from your deck',
            text: 'Draw first.',
            expect: { type: 'draw', choice: 'deck' }, replies: [] },
        { title: 'Play a tactic', label: 'Counterexample on Khaby',
            text: 'Tactic cards work once. Counterexample deals 3 damage. Khaby keeps hitting you, and Shakirattle is Elusive, so aim at Khaby Llame.',
            expect: { type: 'play', cid: 'p0t0', target: 'p1c0' },
            replies: [{ say: 'Khaby is defeated. That was your first card. You can play 2 cards each turn.' },
                { say: 'Remember Kim\'s ability, Filter: pay 1 energy and the Fate track moves 2 steps closer.' }] },
        { title: 'Change a rule', label: 'Play the Underdog rule',
            text: 'A rule card changes a rule for BOTH players. Underdog: in a fight, only the LOWER attack hits. Drag it to the middle row.',
            expect: { type: 'axiom', choice: 'underdog' }, replies: [], compare: ['p0c1', 'p1c1'] },
        { title: 'Same cards, new result', label: 'Attack Shakirattle',
            text: 'Shakirattle has 3 attack. Hurt her now, while Underdog keeps you safe: under the basic rules Astrophysicat would fall, but now only the lower attack hits. Drag Astrophysicat onto her.',
            expect: { type: 'attack', cid: 'p0c1', target: 'p1c1' }, compare: ['p0c1', 'p1c1'],
            replies: [{ say: 'Same cards, different rule, different result.' }] },
        { title: 'Back to the hero', label: 'Attack Granny with Billie',
            text: 'Now drag Billie Eelish onto my portrait.',
            expect: { type: 'attack', cid: 'p0c3', target: 'h1' }, replies: [{ say: '3 hearts left.' }] },
        { title: 'And Kim too', label: 'Attack Granny with Kim',
            text: 'Kim can attack too. Drag Kim onto my portrait.',
            expect: { type: 'attack', cid: 'p0c0', target: 'h1' }, replies: [{ say: 'Only 2 hearts left! I need a plan.' }] },
        { title: 'End your turn', label: 'End turn',
            text: 'Press End turn and watch closely.',
            expect: { type: 'end' },
            replies: [{ type: 'draw', choice: 'deck' }, { type: 'axiom', choice: 'reverse-hearts' },
                { say: 'I played a rule card! Look at the Win tile.' },
                { type: 'end' }] },
        { title: 'Draw', label: 'Draw from your deck',
            text: 'Draw first. Then read the rule tiles before you attack.',
            expect: { type: 'draw', choice: 'deck' }, replies: [] },
        { title: 'What will you do?', label: 'Activate Kim\'s Filter',
            text: 'I have only 2 hearts left. But something changed. Read the rule tiles, then decide what to do.',
            // No gold pointer at first: the learner decides. The hint comes after a while, or after the trap.
            open: true,
            hint: 'Hint: Fate\'s next stop is a Reset, and a Reset removes my new Win rule. Kim\'s Filter (1 energy) moves Fate 2 steps closer. Click Kim, then press Activate.',
            expect: { type: 'activate', cid: 'p0c0', ability: 'filter' },
            // Tempting, but under The Last Shall Be First it would help Granny: the screen stops it and says why.
            trap: { expect: { type: 'attack', cid: 'p0c1', target: 'h1' }, card: 'reverse-hearts', title: 'Careful!',
                what: 'Now: if MY hearts reach 0, I WIN. Two more hits and Granny wins!',
                say: 'Careful! Now if MY hearts reach 0, I WIN. Don\'t hit me now. Read the Win tile.' },
            replies: [{ say: 'Fate reset! All rules are back to the basics. Zero hearts loses again.' }] },
        { title: 'Read, then attack', label: 'Attack Granny with Astrophysicat',
            text: 'Check the Win tile: enemy hero to zero hearts. Drag Astrophysicat onto me.',
            expect: { type: 'attack', cid: 'p0c1', target: 'h1' }, replies: [] },
        { title: 'Win by the rules in play', label: 'Attack Granny with Billie',
            text: 'One heart left. Drag Billie Eelish onto me to win. Always read the rules before you attack.',
            expect: { type: 'attack', cid: 'p0c3', target: 'h1' }, replies: [] },
    ];

    function team(ids, prefix) {
        return ids.map((species, i) => ({ uid: prefix + i, species, loaner: true, injuries: [], scars: [], powerDelta: 0, warped: null, trophyOf: null }));
    }
    // A loaned 10-creature team for anyone without a collection (story match, practice).
    function starter() {
        return team(['astrophysicat', 'zuckerborg', 'speedcheeta', 'lobstorian', 'muskrat', 'astrophysicat', 'zuckerborg', 'speedcheeta', 'lobstorian', 'muskrat'], 'lesson-you-');
    }

    // The 5th and 6th creatures are too expensive to play during the lesson, so Granny can't be beaten early
    // by a route the lesson does not teach (a critic found an early win with Swift Speedcheeta).
    const YOU = ['kardashiant', 'astrophysicat', 'zuckerborg', 'eelish', 'muskrat', 'tremendoodle'];
    const GRANNY = ['khaby', 'shakirattle', 'keanu', 'astrophysicat', 'eelish', 'beansprout', 'zuckerborg', 'siuuugull', 'kardashiant'];
    function config() {
        return {
            seed: 'card-arena-lesson',
            players: [
                { id: 'you', name: 'You', team: team(YOU, 'lesson-you-'), tactics: ['counterexample', 'second-wind', 'stand-firm'], hearts: 6 },
                { id: 'granny', name: 'Granny Axiom', team: team(GRANNY, 'lesson-granny-'), tactics: [], hearts: 6 },
            ],
            // Opening rule cards: Underdog for you, the reversed victory rule for Granny. The first
            // Fate flip (turn 5) is Small Assumptions (creatures cost 1 less): easy to see on the blue cost
            // numbers. The reset is due on turn 11; Kim's Filter on turn 9 brings it forward.
            axiomDeck: ['underdog', 'reverse-hearts', 'thrift', 'normal-hearts', 'doubt', 'arrival'],
            options: { mode: 'practice', first: 0, shuffle: false, shuffleAxioms: false, timeline: true, fateStart: 4, fateGap: 6, spark: false,
                openHand: [3, 3], openAxioms: 1, deckSize: 9, minCreatures: 1, hearts: 6 },
        };
    }
    function create() { return Battle.Engine.createBattle(config()); }
    function advance(state, index) {
        const step = steps[index];
        if (!step) throw Error('Unknown lesson step');
        // Narration lines ({ say }) are not actions.
        return [step.expect].concat((step.replies || []).filter(r => r.type)).reduce((s, a) => Battle.Engine.applyAction(s, a), state);
    }
    // Guide-mode parameters for the battle screen.
    // Granny's closing line on the lesson's end screen (the TOK point).
    const outro = 'Same table, same cards: change the rules, and the same attack can win or lose. In maths, the rules you start from are called axioms.';
    function guide() { return { steps, create, outro }; }

    Battle.Lesson = { steps, create, config, advance, starter, team, guide };
})(typeof window !== 'undefined' ? window : globalThis);
