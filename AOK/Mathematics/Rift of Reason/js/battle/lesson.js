/*
 * Granny's guided card lesson: a fixed teaching match on the real engine.
 * The battle screen runs it in guide mode (js/screens/battle.js, js/screens/battle-lesson.js).
 *
 * Each step: { title, text, label, expect, replies, compare? }
 *   info     an explain-only step (expect { type: 'info' }): no move; the learner clicks the pointed-at
 *            power button (a Got it button only if that button is missing)
 *   expect   the pointed-at action (matched on every key it lists); accepts can allow other plans
 *   predict  choices for an explain-only prediction before an independent move
 *   replies  actions applied afterwards with a visible pause (Granny's turn, and the
 *            learner's end where the step says so), and { say } lines Granny speaks between
 *            them (the screen waits for the voice to end before it goes on)
 *   compare  [attacker, defender]: show "Same cards, different rule" for this fight
 * Every step is legal in the normal engine (tools/test/battle-lesson.test.mjs replays them).
 *
 * guide is the full reference; shortGuide is the default first lesson.
 * guide(power) adds powerStep before "Change a rule" when the learner's avatar has a power
 * (design/AVATARS.md 1.6: "This button is your power."); the button shows but stays unused.
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
            text: 'You have 1 energy. Kim costs 1: the blue number. The yellow number is attack, the red one is health. Drag Kim onto your side of the table.',
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
            expect: { type: 'attack', cid: 'p0c0', target: 'h1' }, replies: [{ say: 'Ouch! 3 hearts left. That attack used one activation.' }] },
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
            text: 'This is the Fate track. After each round, your turn and then mine, it moves one step. It reached NOW, so a rule changed: creatures cost 1 less. Now draw.',
            expect: { type: 'draw', choice: 'deck' }, replies: [{ say: 'In 4 rounds, Fate comes back and resets all rules.' }] },
        { title: 'Guard comes first', label: 'Attack Khaby Llame',
            text: 'You want to hit me, but Khaby Llame has Guard. While he stands, attacks must hit him first: only Khaby glows. Drag Astrophysicat onto Khaby.',
            expect: { type: 'attack', cid: 'p0c1', target: 'p1c0' },
            replies: [{ say: 'Both took 1 damage. Damage stays: the number in the heart shows the health left.' },
                { say: 'Khaby\'s own ability also took Astrophysicat\'s ability away. See: No ability.' }] },
        { title: 'An Entrance', label: 'Play Billie Eelish on Khaby',
            text: 'Billie Eelish has an Entrance: it works when you play her. Her Whisper takes away an enemy\'s special powers, like Guard. Drag her onto Khaby Llame.',
            expect: { type: 'play', cid: 'p0c3', target: 'p1c0' },
            replies: [{ say: 'Khaby lost his Guard. The way to me is open.' }] },
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
            replies: [{ say: 'Khaby is defeated. That used one activation. Each cast, attack or Activate uses one. You have two per turn.' },
                { say: 'One more thing: Kim has an ability, Filter. Pay 1 energy, and the next Fate event comes 2 rounds sooner.' }] },
        { title: 'Change a rule', label: 'Play the Underdog rule',
            text: 'A rule card changes a rule for BOTH players. Underdog: in a fight, only the LOWER attack hits. Drag it to the middle row.',
            expect: { type: 'axiom', choice: 'underdog' }, replies: [], compare: ['p0c1', 'p1c1'] },
        { title: 'Two uses spent', label: 'End turn',
            text: 'The tactic and rule used both activations. End turn. Granny will pass, then you will draw.',
            expect: { type: 'end' }, replies: [{ type: 'draw', choice: 'deck' }, { type: 'end' }, { type: 'draw', choice: 'deck' }] },
        { title: 'Test the new rule', label: 'Attack Shakirattle',
            text: 'Let\'s test the new rule on my strongest creature. Under the basic rules Astrophysicat would fall. Under Underdog only the lower attack hits. Drag Astrophysicat onto Shakirattle.',
            expect: { type: 'attack', cid: 'p0c1', target: 'p1c1' }, compare: ['p0c1', 'p1c1'],
            replies: [{ say: 'Shakirattle took 1 damage. Astrophysicat took 0. Same cards, different rule, different result.' }] },
        { title: 'Back to the hero', label: 'Attack Granny with Billie',
            text: 'Now drag Billie Eelish onto my portrait.',
            expect: { type: 'attack', cid: 'p0c3', target: 'h1' }, replies: [{ say: 'Only 2 hearts left! Those two attacks used both activations.' }] },
        { title: 'End your turn', label: 'End turn',
            text: 'Press End turn and watch closely.',
            expect: { type: 'end' },
            replies: [{ type: 'draw', choice: 'deck' }, { type: 'axiom', choice: 'reverse-hearts' },
                { say: 'I played a rule card! Look at the Win tile.' },
                { type: 'end' }] },
        { title: 'Draw', label: 'Draw from your deck',
            text: 'Draw first. Then read Axioms before you attack.',
            expect: { type: 'draw', choice: 'deck' }, replies: [] },
        { title: 'What will you do?', label: 'Activate Kim\'s Filter',
            text: 'I have only 2 hearts left. But something changed. Read Axioms, then decide what to do.',
            // No gold pointer at first: the learner decides. The hint comes after a while, or after the trap.
            open: true,
            // Two hints: first the idea, later the click (so the learner can still find it alone).
            hint: 'Hint: what will the next Reset on the Fate track do to my new Win rule? Which of your creatures can move Fate?',
            hint2: 'Kim\'s Filter (1 energy) brings the Reset 2 rounds sooner. Click Kim, then press Activate.',
            expect: { type: 'activate', cid: 'p0c0', ability: 'filter' },
            // Tempting, but under The Last Shall Be First it would help Granny: the screen stops it and says why.
            trap: { expect: { type: 'attack', target: 'h1' }, card: 'reverse-hearts', title: 'Careful!',
                what: 'Now: if MY hearts reach 0, I WIN. Two more hits and Granny wins!',
                say: 'Careful! Now if MY hearts reach 0, I WIN. Don\'t hit me now. Read the Win tile.' },
            replies: [{ say: 'Fate reset! All rules are back to the basics: my rule AND yours. Zero hearts loses again.' }] },
        { title: 'Read, then attack', label: 'Attack Granny with Astrophysicat',
            text: 'Check the Win tile: enemy hero to zero hearts. Drag Astrophysicat onto me.',
            expect: { type: 'attack', cid: 'p0c1', target: 'h1' }, replies: [] },
        { title: 'Save the last hit', label: 'End turn',
            text: 'Filter and the attack used both activations. End turn. Granny will pass, then draw before your last hit.',
            expect: { type: 'end' }, replies: [{ type: 'draw', choice: 'deck' }, { type: 'end' }, { type: 'draw', choice: 'deck' }] },
        { title: 'Win by the active axioms', label: 'Attack Granny with Billie',
            text: 'One heart left. Drag Billie Eelish onto me to win. Always read the rules before you attack.',
            expect: { type: 'attack', cid: 'p0c3', target: 'h1' }, replies: [] },
    ];

    // Granny points at the learner's own power button (only when there is one).
    // No Got it button (the teacher's playtest: it was the one step that broke the pointer flow):
    // the gold pointer sits on the power button, and clicking it moves on without using it.
    const powerStep = { title: 'Your power', label: 'Click your power', info: true, expect: { type: 'info' }, replies: [],
        text: 'The round button by your portrait is your power. Point at it to read its effect and cost. Click it to continue; this lesson click does not use the power.' };

    function team(ids, prefix) {
        return ids.map((species, i) => ({ uid: prefix + i, species, loaner: true, injuries: [], scars: [], powerDelta: 0, warped: null, trophyOf: null }));
    }
    // A loaned 10-creature team for anyone without a collection (story match, practice).
    function starter() {
        return team(['kardashiant', 'astrophysicat', 'zuckerborg', 'speedcheeta', 'lobstorian', 'muskrat', 'astrophysicat', 'zuckerborg', 'speedcheeta', 'lobstorian'], 'lesson-you-');
    }

    // The 5th and 6th creatures are too expensive to play during the lesson, so Granny can't be beaten early
    // by a route the lesson does not teach (a critic found an early win with Swift Speedcheeta).
    const YOU = ['kardashiant', 'astrophysicat', 'zuckerborg', 'eelish', 'muskrat', 'tremendoodle'];
    const GRANNY = ['khaby', 'shakirattle', 'keanu', 'astrophysicat', 'eelish', 'beansprout', 'zuckerborg', 'siuuugull', 'kardashiant'];
    function config(power) {
        return {
            seed: 'card-arena-lesson',
            players: [
                { id: 'you', name: 'You', team: team(YOU, 'lesson-you-'), tactics: ['counterexample', 'second-wind', 'stand-firm', 'stand-firm'], hearts: 6, power: power || null },
                { id: 'granny', name: 'Granny Axiom', team: team(GRANNY, 'lesson-granny-'), tactics: [], hearts: 4 },
            ],
            // Opening rule cards: Underdog for you, the reversed victory rule for Granny. Fate counts
            // rounds (your turn, then Granny's). Its first flip is set aside at the start: Small
            // Assumptions (creatures cost 1 less), active from round 3 (turn 5) and easy to see on the
            // blue cost numbers. The reset is due as round 7 starts; the added budget-teaching
            // turn keeps Filter's repair in round 6, one round before that reset.
            axiomDeck: ['underdog', 'reverse-hearts', 'thrift', 'normal-hearts', 'doubt', 'arrival'],
            options: { mode: 'practice', first: 0, shuffle: false, shuffleAxioms: false, timeline: true, fateStart: 2, fateGap: 4, spark: false,
                openHand: [3, 3], openAxioms: 1, deckSize: 10, minCreatures: 1, hearts: 6 },
        };
    }
    function create(power) { return Battle.Engine.createBattle(config(power)); }
    function advance(state, index, list) {
        const step = (list || steps)[index];
        if (!step) throw Error('Unknown lesson step');
        // Narration lines ({ say }) are not actions.
        if (step.info) return state;
        return [step.expect].concat((step.replies || []).filter(r => r.type)).reduce((s, a) => Battle.Engine.applyAction(s, a), state);
    }
    // Guide-mode parameters for the battle screen.
    // Granny's closing line on the lesson's end screen (the TOK point).
    const outro = 'Same table, same cards: change the rules, and the same attack can win or lose. In maths, the rules you start from are called axioms. Which rules does your subject start from?';
    // What a real match adds (shown on the lesson's end screen).
    const next = 'Next you will meet: the colour wheel (+1 attack against the colour you beat), Last Word (it works when the creature is defeated), Swift and Shield. Point at any card to read it.';
    function guide(power) {
        if (!power) return { steps, create, outro, next };
        const at = steps.findIndex(s => s.title === 'Change a rule');
        const status = Battle.Engine.powerStatus(create(power), 0);
        const cost = status.heartCost ? status.heartCost + ' heart' + (status.heartCost === 1 ? '' : 's') : status.cost ? status.cost + ' energy' : 'free';
        const ownPowerStep = Object.assign({}, powerStep, { text: status.name + ': ' + status.text + ' Cost: ' + cost + '. Click your power to continue; this lesson click does not use it.' });
        return { steps: steps.slice(0, at).concat([ownPowerStep], steps.slice(at)), create: () => create(power), outro, next };
    }

    // The first visit reaches the changed victory goal after six actions. The learner predicts
    // the outcome, then chooses between real legal actions: two repairs, or the losing attack.
    // Guard, tactics, powers and the combat comparison stay in the replayable full reference.
    const shortSteps = [
        { title: 'Draw one card', label: 'Draw from your deck',
            text: 'Each turn starts with one draw. Press Your deck. This short match uses loaned cards: your collection is safe.',
            expect: { type: 'draw', choice: 'deck' }, replies: [] },
        { title: 'One cheap creature', label: 'Play Kim Kardashiant',
            text: 'You have 1 energy. Kim costs 1: the blue number. Yellow is attack; red is health. Drag Kim onto your side, or click her then Play.',
            expect: { type: 'play', cid: 'p0c0' }, replies: [] },
        { title: 'Wake your creature', label: 'End turn',
            text: 'New creatures sleep until your next turn. End turn. Granny will draw and pass; then Kim can attack.',
            expect: { type: 'end' }, replies: [{ type: 'draw', choice: 'deck' }, { type: 'end' }] },
        { title: 'Your next draw', label: 'Draw from your deck',
            text: 'Draw first. Your energy grows and refills each turn.',
            expect: { type: 'draw', choice: 'deck' }, replies: [] },
        { title: 'An obvious attack', label: 'Attack Granny with Kim',
            text: 'Granny has 2 hearts and no blocker. Drag Kim onto her portrait, or click Kim then Granny. Each cast, attack or Activate uses one of your two activations. This hit takes one heart.',
            expect: { type: 'attack', cid: 'p0c0', target: 'h1' }, replies: [] },
        { title: 'The goal changes', label: 'End turn',
            text: 'End turn. Watch Granny change the Win rule. Rule cards affect both players.',
            expect: { type: 'end' }, replies: [{ type: 'draw', choice: 'deck' }, { type: 'axiom', choice: 'reverse-hearts' }, { type: 'end' }, { type: 'draw', choice: 'deck' }] },
        { title: 'Predict before acting', label: 'Choose a prediction', info: true,
            text: 'Read the Win tile in Axioms. Granny has 1 heart. If Kim attacks her now, whose zero hearts will win the match?',
            expect: { type: 'info' }, replies: [],
            predict: [
                { label: 'I win', correct: false, feedback: 'Read Win again: a hero now wins when their own hearts reach 0. This attack would make Granny win.' },
                { label: 'Granny wins', correct: true },
            ] },
        { title: 'Choose your plan', label: 'Change the Win rule', open: true,
            text: 'Your decision. You may attack, play your Win rule card, or use Kim’s Filter to bring Fate’s Reset sooner. Read their effects and choose. No pointer yet.',
            hint: 'A hit would make Granny win. Your Win rule card or Kim’s Filter can restore the original goal.',
            hint2: 'Play your Win rule card, or click Kim then Activate Filter. Filter uses her attack for this turn.',
            expect: { type: 'activate', cid: 'p0c0', ability: 'filter' },
            accepts: [{ type: 'activate', cid: 'p0c0', ability: 'filter' }, { type: 'axiom', choice: 'normal-hearts' }, { type: 'attack', cid: 'p0c0', target: 'h1' }],
            replies: [{ say: 'Zero hearts loses again. You changed the starting rule, so the same attack has a different result.' }] },
        { title: 'Prepare the last attack', label: 'End turn',
            text: 'Read Win: the enemy hero to zero hearts. For the last test, end turn. Granny will pass, then you will draw.',
            expect: { type: 'end' }, replies: [{ type: 'draw', choice: 'deck' }, { type: 'end' }, { type: 'draw', choice: 'deck' }] },
        { title: 'Test your prediction', label: 'Attack Granny with Kim',
            text: 'Attack Granny with Kim. Same creature, same hit: this time the current Win rule makes you win.',
            expect: { type: 'attack', cid: 'p0c0', target: 'h1' }, replies: [] },
    ];
    function shortConfig(power) {
        return {
            seed: 'card-arena-first-lesson',
            players: [
                { name: 'You', team: team(['kardashiant', 'muskrat', 'tremendoodle', 'muskrat', 'tremendoodle', 'muskrat'], 'lesson-you-'), tactics: [], hearts: 3, power: power || null },
                { name: 'Granny Axiom', team: team(['muskrat', 'tremendoodle', 'muskrat', 'tremendoodle', 'muskrat', 'tremendoodle'], 'lesson-granny-'), tactics: [], hearts: 2, consumables: { 'extra-energy': 1 } },
            ],
            axiomDeck: ['normal-hearts', 'reverse-hearts', 'thrift', 'underdog', 'normal-hearts'],
            options: { mode: 'practice', first: 0, shuffle: false, shuffleAxioms: false, timeline: true, fateStart: 1, fateGap: 2, spark: false,
                openHand: [1, 1], openAxioms: 1, deckSize: 6, minCreatures: 1 },
        };
    }
    function shortGuide(power) {
        return { steps: shortSteps, create: () => Battle.Engine.createBattle(shortConfig(power)), outro,
            next: 'Replay this short lesson or choose Full card lesson in Collection for Guard, abilities, tactics and your avatar’s power.' };
    }

    Battle.Lesson = { steps, powerStep, create, config, advance, starter, team, guide, shortSteps, shortConfig, shortGuide };
})(typeof window !== 'undefined' ? window : globalThis);
