/*
 * Side stories for lesson 2 (design/SIDE-STORIES.md §5). Format: the header of data/script/side-stories.js.
 *   4 cake-tins       The Three Cake Tins  (Deduce; blue: Owlet)     ripple ladle → Ch2 pot (lesson2.js 'ch2.hall.table')
 *   5 silent-pupil    The Silent Pupil     (Deduce; blue: Fox)       ripple paradox-board → Smudge's cheer (lesson2.js 'ch2.hall.win')
 *   6 muskrat-launch  Muskrat's Launch     (Deduce; blue: Frogling)  none (a visitor)
 * Stories 4 and 5 are fixed puzzles, so every reply can be voiced. Story 6 generates which crew member
 * lies; that value appears only in notes and clue cards (voiced lines inside v => [...] are not collected).
 * The lesson trigger is the solved Square (ch2.square.win), so the Mayor's sentence and the table have happened.
 * All three can be played before or after the Town Hall: Quill or Mr Gumleaf teaches (away:schoolteacher),
 * and Granny's note is read by Granny, or shown as a note once she is gone.
 * Each verb ends on the round that settles the story's fate (the right tin, the writer, the switch),
 * so a clock that fills earlier never contradicts what the player has already seen.
 */
(function (root) {
    'use strict';
    const Rift = root.Rift;
    const SS = Rift.data.sideStories || (Rift.data.sideStories = {});

    const TIER = (n, ...ts) => ({ any: ts.map(t => ({ flag: 'side.' + n, is: t })) });
    // Before the Town Hall is won (Granny still in the pot), and after it.
    const PRE = { all: [{ not: { seen: 'ch2.hall.win' } }, '!dead:granny'] };
    const POST = { seen: 'ch2.hall.win' };
    const POST_ALIVE = { all: [POST, '!dead:granny'] };
    // Miss Quill teaches until the Hall; Mr Gumleaf after it (every playthrough).
    const QUILL = '!away:schoolteacher';
    const GUM = 'away:schoolteacher';

    // ================================================================ 4. The Three Cake Tins
    // Labels: A "in this tin", B "not in this tin", C "not in tin A". At most one is true: only B fits.
    // A holds the Mayor's itching powder, C the custard trap (dented). Wrong tins cost 2.
    const NOTE = [
        { note: 'Inside the cake: a folded note. Floury. In Granny\'s writing.' },
        { s: 'granny', t: 'Bring a ladle. A big one. I have a plan.', when: '!dead:granny' },
        { note: '"Bring a ladle. A big one. I have a plan."', when: 'dead:granny' },
    ];
    SS['cake-tins'] = {
        n: 4,
        title: 'The Three Cake Tins',
        lesson: 2,
        station: 'b-bakery',
        teaser: 'Three cake tins in three hot ovens. One holds a cake.',
        aside: { s: 'narrator', t: 'Mrs Crumb is shouting at three ovens. The ovens are winning.' },
        clock: {
            label: 'Oven heat', size: 6, progress: 3,
            warn: [
                [{ s: 'baker', t: 'It\'s browning! I can SMELL it browning!' }],
                [{ note: 'Something in one of the tins rattles. Something very itchy.' }],
                [{ s: 'baker', t: 'The custard trap is warming up. When it\'s hot, it jumps.' }],
                [{ s: 'baker', t: 'Smoke! Is that my cake? Tell me that\'s not my cake!' }],
            ],
        },
        start: [
            { s: 'baker', e: 'accusing', t: 'Three tins! One cake! And imps lit fires under ALL of them!' },
            { note: 'Three ovens roar. In each one sits a tin with a paper label.' },
            { s: 'baker', t: 'One tin has the cake. One has a custard trap. One has the Mayor\'s itching powder. Don\'t ask.' },
        ],
        clues: {
            need: ['labels', 'rule'],
            spots: [
                { id: 'rule', kind: 'person', label: 'Mrs Crumb', x: 24, y: 58, art: 'npc/villager-baker/nervous',
                  steps: [
                      { s: 'baker', t: 'I wrote the labels. At most one tells the truth. Very secure.' },
                      { s: 'avatar', t: 'That is the least secure thing I\'ve ever heard.' },
                      { s: 'baker', t: 'I wrote them so the imps couldn\'t tell. Now I can\'t either.' },
                  ],
                  card: 'Mrs Crumb: at most one label tells the truth.' },
                { id: 'labels', kind: 'record', label: 'The three labels', x: 52, y: 42, art: 'prop/cake-tin-labels',
                  steps: [
                      { note: 'Tin A: "THE CAKE IS IN THIS TIN."' },
                      { note: 'Tin B: "THE CAKE IS NOT IN THIS TIN."' },
                      { note: 'Tin C: "THE CAKE IS NOT IN TIN A."' },
                      { s: 'baker', t: 'My own writing. Lovely, isn\'t it? Very loopy.' },
                  ],
                  card: 'The labels. A: "The cake is in this tin." B: "The cake is not in this tin." C: "The cake is not in tin A."' },
                { id: 'dent', kind: 'object', label: 'A dented tin', x: 78, y: 48, art: 'prop/dented-tin',
                  steps: [
                      { note: 'Tin C has a big dent in its lid.' },
                      { s: 'baker', t: 'Dented? Then that\'s not my cake. I would never dent my cake tin. Never.' },
                  ],
                  card: 'Tin C is dented. Mrs Crumb never dents her cake tin.' },
            ],
        },
        twist: {
            steps: [
                { s: 'baker', t: 'And hurry. It\'s not just a cake. There\'s a note baked inside.' },
                { s: 'baker', t: 'My flour sack came back from the Hall kitchen. With a note in it. Granny\'s writing.' },
                { s: 'baker', t: 'I read the end: "I have a plan." Then it fell into the cake mix.' },
                { s: 'baker', t: 'She\'s in a soup pot, and she has a PLAN. Of course she does.', when: PRE },
                { s: 'baker', t: 'She wrote it from the pot. She\'s home now. I still want to read it.', when: POST_ALIVE },
                { s: 'baker', t: 'She wrote it from the pot. It\'s the last thing she wrote. …Please. The right tin.', when: 'dead:granny' },
                { inner: {
                    owlet: 'Suppose each tin in turn. Count the true labels. One world fits. Mine.',
                    mothkin: 'Ooh, tin B gleams. Shiny means nothing. …The dent on C, though. Look.',
                    fox: 'What if the label on the cake tin is the liar? Delicious.',
                    frogling: '"Bring a lad—". Granny said that once. I remember. The rest is in the cake.',
                    raven: '"At most one" allows zero. Read the small words.',
                } },
                { choice: [
                    { t: 'Which tin, Mrs Crumb? Just tell me.', then: [
                        { s: 'baker', t: 'If I knew, would I be shouting at ovens?', when: '!dead:granny' },
                        { s: 'baker', t: 'If I knew, it would be out already.', when: 'dead:granny' },
                    ] },
                    { t: 'One tin at a time. Suppose the cake is there. Count the true labels.', only: 'owlet', voice: true, then: [
                        { clock: 'side', progress: 1 },
                        { s: 'baker', t: 'Count? I\'m a baker. I count in dozens. …Go on, then.' },
                    ] },
                ] },
            ],
            card: 'A note from Granny is baked into the cake. It ends: "I have a plan."',
        },
        resolve: {
            verb: 'deduce',
            intro: [{ s: 'baker', t: 'Pick a tin. Pull it out. Mind the custard.' }],
            rounds: [
                {
                    q: 'Does "at most one is true" allow zero true labels?',
                    options: [
                        { t: 'No. "At most one" means exactly one.', say: [
                            { s: 'baker', t: 'Exactly one? I said AT MOST. I choose my words. Like my flour.' },
                        ] },
                        { t: 'Yes. "At most one" allows none.', ok: true, say: [
                            { s: 'baker', t: 'None! Three liars! Now THAT would be secure.' },
                        ] },
                        { t: 'Only on holidays.', say: [
                            { s: 'baker', t: 'I bake on holidays. I don\'t lie on them.' },
                        ] },
                    ],
                },
                {
                    q: 'Which tin holds the cake?',
                    table: [
                        ['Suppose the cake is in…', 'A: "In this tin."', 'B: "Not in this tin."', 'C: "Not in tin A."', 'True labels'],
                        ['Tin A', 'true', 'true', 'false', '2'],
                        ['Tin B', '?', '?', '?', '?'],
                        ['Tin C', '?', '?', '?', '?'],
                    ],
                    options: [
                        { t: 'Tin A', cost: 2, say: [
                            { note: 'Pfff. A cloud of pink powder.' },
                            { s: 'baker', t: 'The Mayor\'s itching powder! Don\'t scratch! Scratching makes it ANGRY!' },
                        ] },
                        { t: 'Tin B', ok: true, say: [
                            { note: 'Tin B. Mrs Crumb grabs her oven gloves.' },
                            { s: 'baker', t: 'That one. Please be that one.' },
                        ] },
                        { t: 'Tin C', cost: 2, say: [
                            { note: 'Tin C jumps in your hands. The custard trap is armed. And VERY hot.' },
                            { s: 'baker', t: 'The custard trap! Put it back! Gently! It JUMPS!' },
                        ] },
                    ],
                    why: {
                        q: 'Why?',
                        options: [
                            { t: 'Only with the cake in B is at most one label true. A and C each make two true.', ok: true },
                            { t: 'B\'s label says "not here", so it must be hiding something.', say: [
                                { s: 'baker', t: 'Labels don\'t hide things. Tins hide things. Labels just lie.' },
                            ] },
                            { t: 'The dent rules out C, and A just feels wrong.', say: [
                                { s: 'baker', t: 'The dent rules out C. Fine. "Feels wrong" rules out nothing.' },
                            ] },
                        ],
                    },
                },
            ],
        },
        outcome: {
            1: [
                { note: 'You lift out tin B. The cake is perfect. Not a crumb lost.' },
                ...NOTE,
                { s: 'baker', t: 'A ladle! I have just the thing. And a slice, for the road.', when: PRE },
                { s: 'baker', t: 'A slice, for the road.', when: POST_ALIVE },
                { note: 'Mrs Crumb wraps you a slice. Very neatly.', when: 'dead:granny' },
                { give: { tonic: 1 } },
            ],
            2: [
                { note: 'Tin B comes out singed. The cake is a little black on top.' },
                { s: 'baker', t: 'Singed. Well. We\'ll call it "toasted". People pay more for toasted.', when: '!dead:granny' },
                { s: 'baker', t: 'Singed. The note is safe. Just.', when: 'dead:granny' },
                ...NOTE,
            ],
            3: [
                { note: 'The custard trap goes off. SPLAT. You are now very custardy.' },
                { note: 'The cake survives. Just. Mrs Crumb\'s big ladle sinks into a lake of custard.' },
                { note: 'Mrs Crumb wipes the custard off the note with her apron. Very carefully.', when: 'dead:granny' },
                ...NOTE,
                { s: 'baker', t: 'My ladle! Gone! Into the custard! Nothing comes back from the custard.', when: '!dead:granny' },
            ],
            4: [
                { note: 'Smoke pours out of tin B. The cake is charcoal. So is the note.' },
                { s: 'baker', t: 'Granny\'s note. Burnt. Now nobody knows what she wanted.' },
            ],
        },
        ripples: [{
            flag: 'ladle', tiers: [1, 2], boss: 'b-town-hall', drain: 1,
            late: [
                { s: 'baker', t: 'Ha! Too late for the pot. You got her out without a ladle. That\'ll do.', when: '!dead:granny' },
                { note: 'Mrs Crumb says nothing. She puts the ladle in your hands, and holds on a moment.', when: 'dead:granny' },
                { keepsake: 'ladle', when: 'dead:granny' },
            ],
        }],
        last: [
            { s: 'baker', t: 'Biggest ladle in Boolesbury. Bring her back. And the ladle.', when: { all: ['ladle', PRE] } },
            { s: 'baker', t: 'No ladle now. Bring her back anyway. Use a teacup.', when: { all: [TIER(4, 3), PRE] } },
            { s: 'baker', t: 'Next time, every label tells the truth. Less secure. More cake.',
              when: { all: ['!dead:granny', { any: [TIER(4, 4), POST] }] } },
            { note: 'Mrs Crumb sets a plate by the window. Just in case. Nobody touches it.', when: 'dead:granny' },
        ],
    };

    // ================================================================ 5. The Silent Pupil
    // The writer lies; the others tell the truth. Astrophysicat: "Not Billie. Not Khaby."
    // Billie: "Not Astrophysicat. Not Beansprout." No pupil row fits; "nobody in this class" does.
    // The board's sentence is a statement that can't be true or false; Beansprout's silence is no statement.
    const INNER5 = frogling => ({
        owlet: 'If no row works, my suspect list is wrong. Not me. The list.',
        mothkin: 'Shh. Chalk dust. On the grate. Not on a desk. Look.',
        fox: 'What if it\'s nobody in this room? Ooh.',
        frogling,
        raven: 'Silence isn\'t a statement. Can\'t be true. Can\'t be false.',
    });
    SS['silent-pupil'] = {
        n: 5,
        title: 'The Silent Pupil',
        lesson: 2,
        station: 'b-school',
        teaser: 'Detention for everyone. Somebody wrote one sentence on the board.',
        aside: { s: 'narrator', t: 'The whole Schoolhouse is in detention. Over one sentence.' },
        clock: {
            label: 'Detention', size: 6, progress: 3,
            warn: [
                [{ s: 'schoolteacher', t: 'Ten more minutes. For everyone.', when: QUILL },
                    { s: 'gumleaf', t: 'Ten more minutes. Sorry. Rules. Who writes these rules?', when: GUM }],
                [{ s: 'schoolteacher', t: 'Ten more. I can wait all night, child. I am very patient.', when: QUILL },
                    { s: 'gumleaf', t: 'Ten more minutes. Wow. I sound just like her.', when: GUM }],
                [{ note: 'Billie hums something very slow and very sad. About detention.' }],
            ],
        },
        start: [
            { note: 'On the blackboard, in big chalk letters: THIS STATEMENT IS FALSE.' },
            { s: 'schoolteacher', t: 'It is neither one nor zero. Detention for all until someone confesses.', when: QUILL },
            { s: 'gumleaf', t: 'Miss Quill would have been furious. I think it\'s great. But the rules say find them.', when: GUM },
            { s: 'eelish', t: 'Detention. Again. I\'m going to write a very quiet song about this.' },
        ],
        clues: {
            intro: [
                { s: 'schoolteacher', t: 'The writer will lie, child. The rest will tell the truth. I taught them well.', when: QUILL },
                { s: 'gumleaf', t: 'Rules say the guilty one lies and the rest tell the truth. Very tidy. Not my rules.', when: GUM },
                { inner: INNER5('The Mayor said that sentence in the Square. Miss Quill snapped. I remember.'), when: QUILL },
                { inner: INNER5('That sentence broke Miss Quill at the Hall. I was there. I remember.'), when: GUM },
                { choice: [
                    { t: 'Hands up. Who wrote it?', then: [
                        { note: 'No hands go up. Mr. Beansprout folds his arms. Very slowly.' },
                    ] },
                    { t: 'What if nobody in this room wrote it?', only: 'fox', voice: true, then: [
                        { clock: 'side', progress: 1 },
                        { s: 'schoolteacher', t: 'Nobody? Nobody does not hold chalk, child.', when: QUILL },
                        { s: 'gumleaf', t: 'Nobody? Ooh. Spooky. I love it. Rules say somebody, though.', when: GUM },
                    ] },
                ] },
            ],
            spots: [
                { id: 'pupils', kind: 'person', label: 'The four pupils', x: 30, y: 60, art: 'creature/astrophysicat/smug',
                  steps: [
                      { s: 'astrophysicat', t: 'I have calculated it. It was not Billie. It was not Khaby.' },
                      { s: 'eelish', t: 'It wasn\'t Astrophysicat. Or Beansprout. He doesn\'t even talk.' },
                      { note: 'Khaby Llame says nothing. He points, slowly, at the fireplace.' },
                      { note: 'Mr. Beansprout says nothing at all. He blinks. Once.' },
                  ],
                  card: 'Astrophysicat: "Not Billie. Not Khaby." Billie: "Not Astrophysicat. Not Beansprout." Khaby points. Beansprout: silence.' },
                { id: 'grate', kind: 'object', label: 'The fireplace', x: 80, y: 55, art: 'prop/chimney-grate',
                  steps: [
                      { note: 'Chalk dust on the grate. White on black soot. Fresh.' },
                      { note: 'Every desk is clean. Not one speck.' },
                      { s: 'astrophysicat', t: 'Chalk dust in a fireplace. Statistically, that is weird.' },
                  ],
                  card: 'Chalk dust on the fireplace grate. None on any desk.' },
                { id: 'chart', kind: 'record', label: 'The seating chart', x: 55, y: 35, art: 'prop/seating-chart',
                  steps: [
                      { note: 'The seating chart, ticked in red. Every pupil: in their seat.' },
                      { s: 'schoolteacher', t: 'I faced the class all lesson. Nobody stood up. I turned to the board, and there it was.', when: QUILL },
                      { s: 'gumleaf', t: 'I was facing the class. Nobody moved. Honestly. Then I turned round: that.', when: GUM },
                  ],
                  card: 'Seating chart: the teacher faced the class all lesson. No pupil stood up.' },
            ],
        },
        twist: {
            steps: [
                { note: 'A puff of soot falls down the chimney. Then: a tiny sneeze.' },
                { s: 'schoolteacher', t: 'Bless you, Astrophysicat.', when: QUILL },
                { s: 'gumleaf', t: 'Bless you. Who was that? Nobody? Spooky.', when: GUM },
                { s: 'astrophysicat', t: 'Well, actually, that was not me. I sneeze in a much more scientific way.' },
                { note: 'Khaby Llame points at the chimney again. With both hooves this time.' },
            ],
            card: 'Something up the chimney sneezed.',
        },
        resolve: {
            verb: 'deduce',
            intro: [
                { s: 'schoolteacher', t: 'Well, child? Name the writer. Or we stay until morning.', when: QUILL },
                { s: 'gumleaf', t: 'So. Who was it? No pressure. Well, a little. Rules.', when: GUM },
            ],
            rounds: [
                {
                    q: 'Mr. Beansprout said nothing at all. What does that prove?',
                    options: [
                        { t: 'He\'s guilty. Honest people talk.', say: [
                            { note: 'Mr. Beansprout raises one eyebrow. Very slowly. It is devastating.' },
                        ] },
                        { t: 'He\'s honest, because he kept quiet.', say: [
                            { s: 'eelish', t: 'Quiet isn\'t honest. Quiet is quiet. I wrote a song about it.' },
                        ] },
                        { t: 'Nothing. Silence is neither true nor false.', ok: true, say: [
                            { s: 'astrophysicat', t: 'Well, actually: the board said something that can\'t be true or false. Beansprout said nothing at all.' },
                        ] },
                    ],
                },
                {
                    q: 'Who wrote it on the board?',
                    table: [
                        ['Suppose the writer is…', 'Astrophysicat\'s claim', 'Billie\'s claim', 'Fits?'],
                        ['Astrophysicat', 'true', 'false', '?'],
                        ['Billie Eelish', 'false', 'true', '?'],
                        ['Khaby Llame', 'false', 'true', '?'],
                        ['Mr. Beansprout', 'true', 'false', '?'],
                        ['Nobody in the class', 'true', 'true', '?'],
                    ],
                    options: [
                        { t: 'Astrophysicat', say: [
                            { s: 'astrophysicat', t: 'Me? My claim would be true. A liar can\'t say true things. I checked.' },
                        ] },
                        { t: 'Billie Eelish', say: [
                            { s: 'eelish', t: 'I told the truth. And now I\'m sad. Which is normal, actually.' },
                        ] },
                        { t: 'Khaby Llame', say: [
                            { note: 'Khaby Llame spreads both hooves. Slowly. As if to say: obviously not.' },
                        ] },
                        { t: 'Mr. Beansprout', say: [
                            { note: 'Mr. Beansprout says nothing. His eyebrows say a great deal.' },
                        ] },
                        { t: 'Nobody in this class', ok: true, say: [
                            { s: 'schoolteacher', t: 'Nobody? Then who holds the chalk, child?', when: QUILL },
                            { s: 'gumleaf', t: 'Nobody? Ooh. Then who\'s got the chalk?', when: GUM },
                        ] },
                    ],
                    why: {
                        q: 'Why?',
                        options: [
                            { t: 'In every pupil row, somebody\'s claim breaks the rule.', ok: true },
                            { t: 'Billie sounds sad, so she\'s honest.', say: [
                                { s: 'eelish', t: 'I always sound sad. It\'s just my voice. It proves nothing.' },
                            ] },
                            { t: 'Khaby pointed, and pointing never lies.', say: [
                                { s: 'astrophysicat', t: 'Pointing is not a statement. Khaby taught me that. Without speaking.' },
                            ] },
                        ],
                    },
                    right: [
                        { note: 'You look up the chimney. Two white eyes look back. A sooty hand holds a stick of chalk.' },
                        { note: 'It\'s Smudge the sweep. He puts a finger to his lips.' },
                        { s: 'sweep', e: 'nervous', t: 'I only wanted to see her snap again. Like in the Square.', when: QUILL },
                        { s: 'sweep', e: 'nervous', t: 'It\'s the sentence that beat her. I wanted it on her board.', when: GUM },
                    ],
                },
            ],
        },
        outcome: {
            1: [
                { s: 'schoolteacher', t: 'Not one of them. How… unexpected. Class dismissed.', when: QUILL },
                { note: 'Up the chimney, Smudge keeps very still. You say nothing about him.', when: QUILL },
                { s: 'gumleaf', t: 'Smudge! Come down! Wrong board. Great sentence.', when: GUM },
                { s: 'sweep', t: 'Really, sir? Nobody ever says "great" to a sweep.', when: GUM },
                { note: 'Khaby Llame follows you out. He points at you. Then at himself. Then at the road.' },
                { visitor: 'khaby' },
            ],
            2: [
                { note: 'The class is freed. First, they write "I will not write paradoxes". Fifty times.' },
                { s: 'eelish', t: 'I didn\'t write the first one. But I\'ve written fifty now.' },
                { note: 'Mr. Beansprout\'s page is blank. Somehow, it is the neatest.' },
            ],
            3: [
                { note: 'The class is freed, very late. On the way out, the teacher still glares at Astrophysicat.' },
                { s: 'astrophysicat', t: 'I sat nearest. That was not a proof. That was a distance.' },
                { note: 'Up the chimney, Smudge is already gone.' },
            ],
            4: [
                { note: 'The whole class stays in detention. All night.' },
                { note: 'Mr. Beansprout holds up a blank sign. A silent protest. Nobody can grade it.' },
            ],
        },
        ripples: [{
            flag: 'paradox-board', tiers: [1, 2], boss: 'b-town-hall',
            late: [
                { keepsake: 'paradox-board' },
                { note: 'Mr Gumleaf frames the board and hangs it by the door. Smudge signs it. In soot.' },
            ],
        }],
        last: [
            { s: 'schoolteacher', t: 'Silence is not a statement. I cannot grade it. Can you?', when: QUILL },
            { s: 'gumleaf', t: 'Silence. Can\'t grade it. Can\'t fail it. Lovely.', when: GUM },
        ],
    };

    // ================================================================ 6. Muskrat's Launch
    // Gargoyle: "3 aborts." Eminemu: "2 aborts." Zuckerborg: "1 is NOT the abort." Exactly one lies:
    // switch 2 (the Gargoyle lies) and switch 3 (Eminemu lies) both fit. The generator picks the real one;
    // the diagram (switch 3's wire) or the launch log decides it. The twist shows only the clash;
    // the player finds the two worlds in round 1.
    SS['muskrat-launch'] = {
        n: 6,
        title: 'Muskrat\'s Launch',
        lesson: 2,
        station: 'troll-bridge',
        teaser: 'A countdown at the Troll Bridge. Muskrat is strapped into his rocket.',
        aside: { s: 'narrator', t: 'Somebody is counting down at the Troll Bridge. Loudly. Towards a river.' },
        setup: rng => ({ abort: rng.int(0, 1) ? 2 : 3 }),
        clock: {
            label: 'The countdown', size: 6, progress: 3,
            warn: [
                [{ s: 'muskrat', t: 'T-minus… some! Lots! Fewer than before!' }],
                [{ note: 'The rocket hums. The river looks up at it, nervously.' }],
                [{ s: 'zuckerborg', t: 'Countdown at fifty percent. Smile at one hundred percent.' }],
                [{ s: 'muskrat', t: 'Engines warm! Seat belt on! Wait. Is this the seat belt?' }],
            ],
        },
        start: [
            { s: 'muskrat', t: 'Mars! Today! Not next year! Today! …Is it always this loud in here?' },
            { note: 'A rocket stands on the Troll Bridge. A sign: MARS: TODAY. It points at the river.' },
            { s: 'zuckerborg', t: 'Hello, human. The rocket is aimed at the water. That is a feature.' },
        ],
        clues: {
            intro: [
                { s: 'muskrat', t: 'My crew knows the abort switch. One of them always lies. It\'s in the contract.' },
            ],
            spots: [
                { id: 'crew', kind: 'person', label: 'The ground crew', x: 26, y: 60, art: 'creature/gargoyle/smug',
                  steps: [
                      { s: 'gargoyle', t: 'Three stops it, sweetie. I\'d know. I\'m wearing a rocket.' },
                      { s: 'eminemu', t: 'Switch two, it\'s true, it\'s the stop, make it drop—' },
                      { s: 'zuckerborg', t: 'Switch one is NOT the abort. It launches. I tested it. On a friend.' },
                      { s: 'muskrat', t: 'One of them is lying! I don\'t know which! Isn\'t this exciting?' },
                  ],
                  card: 'Lady Gargoyle: "Switch 3 aborts." Eminemu: "Switch 2 aborts." Zuckerborg: "Switch 1 is NOT the abort." One of them lies.' },
                { id: 'diagram', kind: 'object', label: 'The wiring diagram', x: 55, y: 40, art: 'prop/rocket-diagram',
                  steps: v => [
                      { note: 'A wiring diagram on the rocket\'s side, half scratched off. One wire still shines.' },
                      { note: 'It runs from switch 3 to ' + (v.abort === 3 ? 'a valve marked STOP.' : 'the engine, marked MORE.') },
                  ],
                  card: v => 'The diagram: switch 3\'s wire runs to ' + (v.abort === 3 ? 'the STOP valve.' : 'the engine.') },
                { id: 'log', kind: 'record', label: 'The launch log', x: 80, y: 62, art: 'prop/launch-log',
                  steps: v => [
                      { note: 'The launch log. Forty countdowns. Forty aborts. Each one ends: "Next year."' },
                      { note: 'The last abort that worked used switch ' + v.abort + '.' },
                  ],
                  card: v => 'The launch log: the last abort that worked used switch ' + v.abort + '.' },
            ],
        },
        twist: {
            steps: [
                { s: 'eminemu', t: 'Two! Two! I said it twice, so it\'s true, twice as nice—' },
                { s: 'gargoyle', t: 'Three, darling. Shouting doesn\'t make you right. A good hat does.' },
                { s: 'zuckerborg', t: 'I agree with both of them. I agree with everyone. It\'s good for growth.' },
                { inner: {
                    owlet: 'Fill every row. Don\'t stop at the first one that fits. I nearly did.',
                    mothkin: 'Look. The diagram\'s scratched, but one wire still shines.',
                    fox: 'Picture it: we flip the wrong switch. Splash. Very cinematic. Let\'s not.',
                    frogling: 'The Square, again. Everyone shouted there too. A check settled it. Remember?',
                    raven: '"One of them lies." It never said we\'d know which.',
                } },
                { choice: [
                    { t: 'Everybody, stop shouting!', then: [
                        { s: 'eminemu', t: 'Stop? Nothing rhymes with stop. Except drop. And flop. Oh no.' },
                    ] },
                    { t: 'Like in the Square: shouting proves nothing. We check the rocket.', only: 'frogling', voice: true, then: [
                        { clock: 'side', progress: 1 },
                        { s: 'muskrat', t: 'Check? Like… engineering? I used to love engineering.' },
                    ] },
                ] },
            ],
            card: 'Saying it twice doesn\'t make it true twice. Shouting can\'t settle this.',
        },
        resolve: {
            verb: 'deduce',
            intro: [{ s: 'muskrat', t: 'Pick a switch! Any switch! Not that one! Or that one! Maybe that one!' }],
            rounds: [
                {
                    q: 'Exactly one of them lies. Which switches could abort the launch?',
                    table: [
                        ['Suppose the abort is…', 'Gargoyle: "3"', 'Eminemu: "2"', 'Zuckerborg: "not 1"', 'Liars'],
                        ['Switch 1', 'false', 'false', 'false', '3'],
                        ['Switch 2', '?', '?', '?', '?'],
                        ['Switch 3', '?', '?', '?', '?'],
                    ],
                    options: [
                        { t: 'Only switch 2', say: [
                            { s: 'gargoyle', t: 'Only two? Check the three row, sweetie. It fits me too.' },
                        ] },
                        { t: 'Only switch 3', say: [
                            { s: 'eminemu', t: 'Only three? Check row two, it fits too, it\'s true, who knew—' },
                        ] },
                        { t: 'Switch 2 or switch 3: both rows fit', ok: true, say: [
                            { s: 'zuckerborg', t: 'Two worlds. One rocket. I love worlds. I collect them.' },
                            { s: 'avatar', t: 'Both stories fit. So we test one.' },
                        ] },
                        { t: 'Switch 1', say: [
                            { s: 'zuckerborg', t: 'Then all three of us lie. Only one of us lies. I checked. Twice.' },
                        ] },
                    ],
                    why: {
                        q: 'Why?',
                        options: [
                            { t: 'In rows 2 and 3, exactly one claim is false.', ok: true },
                            { t: 'Eminemu rhymes, so he\'s honest.', say: [
                                { s: 'eminemu', t: 'Rhyme is a skill, not a seal, that\'s the deal, for real—' },
                            ] },
                            { t: 'Lady Gargoyle is wearing a rocket. She\'d know.', say: [
                                { s: 'gargoyle', t: 'I wore a lobster last week, darling. I know nothing about lobsters.' },
                            ] },
                        ],
                    },
                },
                {
                    q: 'Two worlds still fit. Which clue decides between them?',
                    present: ['diagram', 'log'],
                    wrong: [{ s: 'muskrat', t: 'That doesn\'t decide anything! Still two worlds! I can feel the engines!' }],
                    right: v => [
                        { note: 'That settles it: switch ' + v.abort + '. You flip it. CLUNK.' },
                    ],
                },
            ],
        },
        outcome: {
            1: [
                { note: 'The rocket coughs. The countdown stops. The river breathes out.' },
                { s: 'muskrat', t: 'Mars. Next year. I feel good about it.' },
                { note: 'Muskrat climbs out. He gives you a spare banner: MARS: NEXT YEAR.' },
                { keepsake: 'mars-banner' },
                { note: 'He looks at your team. Then at his rocket. He might follow you.' },
                { visitor: 'muskrat' },
            ],
            2: [
                { note: 'The countdown stops. Then: a huge puff of smoke. Everyone coughs. The rocket stays put.' },
                { s: 'gargoyle', t: 'Smoke. Very dramatic. I\'ll wear it next week.' },
            ],
            3: [
                { note: 'CLUNK. Too late: the engines already fired.' },
                { note: 'The rocket lifts. Three metres. Then it tips, gently, into the river. Plop.' },
                { s: 'muskrat', t: 'Three metres! A personal best! …Can somebody open the hatch?' },
            ],
            4: [
                { note: 'The rocket roars thirty metres up. Then down. Into the river. SPLOOSH.' },
                { note: 'Muskrat swims out. Soggy. Fine. The bridge is not.' },
                { closed: 'troll-bridge', note: 'The Troll Bridge is shut today. A sign: ROCKET IN RIVER. DO NOT FEED.' },
            ],
        },
        last: [
            { note: 'Muskrat sits on the edge of the bridge. For once, he is quiet.' },
            { s: 'muskrat', t: 'I didn\'t want to go today. I just couldn\'t say "next year" again.' },
            { s: 'muskrat', t: 'Next year. Definitely. Probably.' },
        ],
    };
})(typeof window !== 'undefined' ? window : globalThis);
