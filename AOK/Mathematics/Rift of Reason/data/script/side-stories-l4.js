/*
 * Side stories for lesson 4 (design/SIDE-STORIES.md §7). Format: the header of data/script/side-stories.js.
 *    9 fortune-machine  The Fortune Machine  (Test, then the sign; blue: Moth-kin)   honest-label → Mirage's
 *                                                                                    bark on the restored Fair (lesson4.js)
 *   10 giveaway-app     The Giveaway App     (Negotiate, then the rule; blue: Raven) berry → role:granny's bark
 *                                                                                    on the restored Fair (lesson4.js)
 * Both are fixed puzzles: every line is static, so every voiced line can be recorded. The Fortune
 * Machine never speaks: its screen is an on-screen readout (notes), like the Algorithm's numbers.
 * Story 9 reads { flag: 'side.1', is: 4 }: Mirage lost her crystal ball, and it is the machine's dome.
 * Story 10's Granny is there only once she is free (the Hall won) and alive; with dead:granny and
 * arrived:granny, Coach Achilles stands in; otherwise Usain Volt is the slow one, and no Granny figure appears.
 * Nobody here is a known NPC under possession.
 */
(function (root) {
    'use strict';
    const Rift = root.Rift;
    const SS = Rift.data.sideStories || (Rift.data.sideStories = {});

    const TIER = (n, ...ts) => ({ any: ts.map(t => ({ flag: 'side.' + n, is: t })) });

    // ================================================================ 9. The Fortune Machine
    // Three Test rounds: the test that separates foresight from "same as yesterday"; what the
    // split log shows (the table appears only on that round); what "YOU WILL FAIL" told the hedgehog.
    const BALL = TIER(1, 4);        // story 1 ended at tier 4: Corvina took the ball and sold it on
    const NO_BALL = { not: BALL };
    // The "90% ACCURATE" sign (true, and misleading) brings the queue back by evening.
    const ACCURATE_QUEUE = { note: 'By evening, a new queue. The sign says 90% ACCURATE.', when: { flag: 'side.9.sign', is: 'accurate' } };

    SS['fortune-machine'] = {
        n: 9,
        title: 'The Fortune Machine',
        lesson: 4,
        station: 'stall-witness',
        teaser: 'A violin lies smashed outside the Witness Tent. A machine says YOU WILL FAIL. 90%.',
        aside: { s: 'narrator', t: 'A brass box has moved into Madame Mirage\'s tent. It is ninety per cent sure of everything.' },
        clock: {
            label: 'Fairgoers giving up', size: 6, progress: 4,
            warn: [
                [{ note: 'A juggler reads the screen: YOU WILL DROP THEM. 90%. He puts his clubs down. Gently.' }],
                [{ s: 'siuuugull', t: 'It says I will miss. Ninety per cent. I have never missed. …I will sit down.' }],
                [{ s: 'speedcheeta', t: 'CHAT. It says my next backflip fails. So I\'m… walking. Forwards. Like a normal person.' }],
            ],
        },
        start: [
            { note: 'Outside the Witness Tent, a hedgehog holds a broken violin. Inside, a brass box glows.' },
            { note: 'Its screen: YOU WILL FAIL. CONFIDENCE: 90%.' },
            { note: 'The hedgehog shrugs. "It said I\'d fail. So I saved everyone the time."' },
            { s: 'altmanta', t: 'Ninety per cent accurate. It will be better soon. Very soon.' },
            { s: 'mirage', t: 'My tent, darling. Taken by a box. It doesn\'t even wear a scarf.', when: NO_BALL },
            { s: 'mirage', t: 'My tent. And that glass dome on top? My crystal ball. A crow sold it to a manta.', when: BALL },
        ],
        clues: {
            intro: [
                { note: 'Madame Mirage sits on the step, reading tea leaves. The queue walks past her.', when: BALL },
                { note: 'Madame Mirage sits on the step, polishing her crystal ball. The queue walks past her.', when: NO_BALL },
                { inner: {
                    owlet: 'Ninety right? If ninety days were the same, a parrot scores ninety. Proud of that.',
                    mothkin: 'Shh. Behind the panel. Something shiny. Only one thing. Look.',
                    fox: 'Picture it: we ask it about a strange day. It panics. Sparks. Great scene.',
                    frogling: 'The day the sky cracked, my pond went still. What did the box say?',
                    raven: '"Accurate." Accurate at what?',
                } },
                { s: 'altmanta', t: 'Questions are welcome. Answers are ninety per cent.' },
                { choice: [
                    { t: 'Where does it get its fortunes?', then: [
                        { s: 'altmanta', t: 'From the future. Roughly. It\'s very complicated. Please don\'t look inside.' },
                    ] },
                    { t: 'Shh. What\'s that shining behind the panel?', only: 'mothkin', voice: true, then: [
                        { clock: 'side', progress: 1 },
                        { s: 'altmanta', t: 'Nothing. A light. Lights are normal. Please look at the screen instead.' },
                    ] },
                ] },
            ],
            spots: [
                { id: 'mirage', kind: 'person', label: 'Madame Mirage, on the step', x: 24, y: 60, art: 'npc/madame-mirage/neutral',
                  steps: [
                      { s: 'mirage', t: 'A fortune? Here. Tomorrow will be like today. That\'s free.' },
                      { s: 'mirage', t: 'At a fair, nine days in ten are like the day before.' },
                      { s: 'mirage', t: 'I could say that every day, and be right nine times in ten. I chose not to.' },
                  ],
                  card: 'Mirage: at the Fair, nine days in ten are like the day before.' },
                { id: 'dial', kind: 'object', label: 'Behind the side panel', x: 58, y: 50, art: 'prop/fortune-dial',
                  steps: [
                      { s: 'altmanta', t: 'Please don\'t open that. It spoils the magic. There\'s a lot of magic.' },
                      { note: 'Inside: no gears, no crystal. One dial, with one setting: PREDICT: SAME AS YESTERDAY.' },
                  ],
                  card: 'Inside the machine: one dial. PREDICT: SAME AS YESTERDAY.' },
                { id: 'log', kind: 'record', label: 'The machine\'s logbook', x: 80, y: 62, art: 'prop/fortune-log',
                  steps: [
                      { note: 'A logbook chained to the box. One hundred days of fortunes, each marked RIGHT or WRONG.' },
                      { note: 'Ninety RIGHT. Ten WRONG.' },
                      { s: 'altmanta', t: 'Ninety per cent. Read it again. It\'s even better the second time.' },
                  ],
                  card: 'The logbook: 100 days of fortunes. 90 right.' },
            ],
        },
        twist: {
            steps: [
                { s: 'altmanta', t: 'It even predicted the day the sky cracked. Look it up.' },
                { note: 'The log, the day the sky cracked: A NORMAL FAIR. CONFIDENCE: 90%.' },
                { s: 'altmanta', t: '…A normal Fair. With one small crack. Mostly normal.' },
                { s: 'mirage', t: 'The one day the whole Fair needed a fortune, darling.' },
                { s: 'mirage', t: 'I saw a crack that day. In my ball. It was just an old ball. I got lucky.' },
            ],
            card: 'The day the sky cracked, it said: A NORMAL FAIR. 90%.',
        },
        resolve: {
            verb: 'test',
            intro: [{ s: 'altmanta', t: 'Test it any way you like. It\'s ninety per cent. It always passes.' }],
            rounds: [{
                q: 'Which test shows if it sees the future, or just guesses the usual?',
                options: [
                    { t: 'Ask it about a hundred more ordinary days.', say: [
                        { s: 'altmanta', t: 'Ninety right! I told you. …Again.' },
                    ] },
                    { t: 'Score it only on the days when something changed.', ok: true, say: [
                        { s: 'mirage', t: 'The strange days. Yes. Show me the strange days.' },
                    ] },
                    { t: 'Ask Altmanta how sure he is.', say: [
                        { s: 'altmanta', t: 'Very sure. Calmly sure. It will be fine.' },
                    ] },
                    { t: 'Ask it about tomorrow, and wait a day.', say: [
                        { s: 'mirage', t: 'Tomorrow will probably be like today, darling. It will probably be right. We\'ll learn nothing.' },
                    ] },
                ],
            }, {
                q: 'So what does its "90%" really show?',
                table: [
                    ['', 'Right', 'Wrong'],
                    ['Days like the day before (90)', 90, 0],
                    ['Days when something changed (10)', 0, 10],
                ],
                options: [
                    { t: 'It sees the future, nine times in ten.', say: [
                        { s: 'altmanta', t: 'Yes! …The table says no. The table is new. It will learn.' },
                    ] },
                    { t: 'It gets the usual days right. It has never seen a change coming.', ok: true, say: [
                        { s: 'mirage', t: 'Never. Not once. Not even the big one.' },
                    ] },
                    { t: 'It is broken.', say: [
                        { s: 'mirage', t: 'Broken? No. It works perfectly. At the wrong job.' },
                    ] },
                    { t: 'Ninety right is close enough to knowing.', say: [
                        { s: 'mirage', t: 'Close enough? Tell that to the sky.' },
                    ] },
                ],
            }, {
                q: 'So what did "YOU WILL FAIL" tell the hedgehog?',
                options: [
                    { t: 'That he will fail, nine times in ten.', say: [
                        { s: 'mirage', t: 'Its ninety is about all its fortunes. Mostly ordinary days. Not about him.' },
                    ] },
                    { t: 'Only that he played badly yesterday.', ok: true, say: [
                        { s: 'mirage', t: 'Yesterday\'s news, darling. Dressed up as tomorrow.' },
                    ] },
                    { t: 'That he has no talent.', say: [
                        { s: 'mirage', t: 'It has never heard him play. It has only heard about yesterday.' },
                    ] },
                ],
            }],
        },
        // The sign (SIDE-STORIES.md §7): true and misleading · honest (sets honest-label) · false.
        after: [
            { s: 'altmanta', t: 'Fine. It can\'t see the future. But it stays. It needs a new sign.' },
            { choice: [
                { t: '"90% ACCURATE"', flag: 'side.9.sign', value: 'accurate', then: [
                    { s: 'altmanta', t: 'True! Every word! People love that sign.' },
                    { s: 'mirage', t: 'True. And it will fool them all again.' },
                ] },
                { t: '"I GUESS THE USUAL"', flag: 'honest-label', then: [
                    { s: 'altmanta', t: 'Honest. Calm. A little boring. …Fine.' },
                    { s: 'mirage', t: 'Nobody smashes a violin over THAT sign.' },
                ] },
                { t: '"BROKEN"', then: [
                    { s: 'altmanta', t: 'But it isn\'t broken. It does exactly what it was built to do.' },
                    { s: 'mirage', t: 'He\'s right. That\'s the worrying part.' },
                ] },
            ] },
        ],
        outcome: {
            1: [
                { note: 'The hedgehog comes back with glue. The violin squeaks. It is awful. He keeps playing.' },
                { note: 'The juggler picks up his clubs. The queue goes home to its hobbies.' },
                { s: 'mirage', t: 'My tent. My chair. Out, box. Into the corner. Think about what you did.', when: NO_BALL },
                { s: 'mirage', t: 'My tent. And my ball! Hello, darling. Did the manta treat you well?', when: BALL },
                { s: 'altmanta', t: 'Fine. I\'ll build a bigger one. Bigger is always better. Probably.' },
                ACCURATE_QUEUE,
            ],
            2: [
                { note: 'Most of the queue goes home to their hobbies. A few still check the box first.' },
                { s: 'mirage', t: 'Most of them. Ninety per cent, darling. I\'m told that\'s very good.' },
                ACCURATE_QUEUE,
            ],
            3: [
                { note: 'Half the Fair still checks the box before breakfast.' },
                { s: 'mirage', t: 'Fine. It gets the left half of the tent. I get the half with the chair.' },
            ],
            4: [
                { note: 'The box turns its screen to you: YOU WILL LOSE YOUR NEXT CARD BATTLE. 90%.' },
                { note: 'The queue boos you. Politely at first. Then less politely.' },
                { s: 'altmanta', t: 'Don\'t worry. It will be fine. Ninety per cent fine.' },
            ],
        },
        last: [
            { s: 'mirage', t: 'Right most of the time. Is that the same as knowing?' },
        ],
    };

    // ================================================================ 10. The Giveaway App
    // A negotiation with Mr. Beastie, then the new rule (only when he can still change it: Danger 0–3,
    // tiers 1–2). Cares: safety, fame and fairness (fairness added so every species card has a target).
    const GRANNY = { all: ['!dead:granny', { seen: 'ch2.hall.win' }] };   // alive, and out of the pot
    const ACHILLES = { all: ['dead:granny', 'arrived:granny'] };
    const HOLDER = { any: [GRANNY, ACHILLES] };                            // someone holds role:granny here
    const NO_GRANNY = { not: HOLDER };
    // Achilles' one quiet beat (he is only here because she is gone).
    const GRIEF = { s: 'granny', t: '', u: 'She typed with one finger. Took her an hour. …I\'d wait for her now.', when: ACHILLES };
    const RULE = v => ({ flag: 'side.10.rule', is: v });
    const RULE_NOTES = [
        { note: 'The medic sees Volt first. His tail is bandaged in a minute.', when: RULE('medic') },
        { note: 'The draw is random. Volt wins a basket. So does Speedcheeta, who eats it at once.', when: RULE('draw') },
        { note: 'Speedcheeta is first, of course. But there are berries left for the slow ones. Today.', when: RULE('first') },
    ];

    SS['giveaway-app'] = {
        n: 10,
        title: 'The Giveaway App',
        lesson: 4,
        station: 'campfire',
        teaser: 'A mountain of berries at the Campfire. The slowest person there is ranked last.',
        aside: { s: 'narrator', t: 'Mr. Beastie is giving away berries at the Campfire. Scientifically. Oh dear.' },
        clock: {
            label: 'People giving up', size: 6, progress: 4,
            warn: [
                [{ note: 'A tired badger reads its rank: 212th. It shrugs and limps off down the Road.' }],
                [{ s: 'speedcheeta', t: 'FIVE HUNDRED! My thumbs are on FIRE! Is that a berry thing? CHAT?' }],
                [{ s: 'beastie', t: 'More requests! More berries! This is the most scientific day of my LIFE!' }],
            ],
        },
        start: [
            { s: 'beastie', t: 'Berries for whoever needs them most! The app decides! It\'s very scientific!' },
            { note: 'By the fire, Usain Volt is limping. He is an eel. Nobody knows how. He is limping anyway.' },
            { note: 'At the bottom of the ranking, Granny Axiom is typing on a huge tablet. With one finger.', when: GRANNY },
            { s: 'granny', t: 'I… need… a… ber— Oh. It\'s gone to sleep.', when: GRANNY },
            { note: 'Top of the ranking: Coach Achilles. He typed one request. Very, very fast.', when: ACHILLES },
            { s: 'granny', t: '', u: 'First? I don\'t need berries. Give mine to the limping one.', when: ACHILLES },
            { s: 'beastie', t: 'Four HUNDRED requests? Speedcheeta! Are you HACKING my app?' },
            { s: 'speedcheeta', t: 'I don\'t even like berries! I like WINNING!' },
        ],
        clues: {
            intro: [
                { inner: {
                    owlet: 'Asking a lot isn\'t needing a lot. Different ruler. I checked. Well. I will.',
                    mothkin: 'Ooh, the tablet sparkles. …No. Look who\'s limping. Then who\'s typing.',
                    fox: 'Picture being too proud to ask. Last place. Forever.',
                    raven: 'Ask him: "Needs it most." Define "most".',
                } },
                { inner: { frogling: 'The Sorting Room did this. Same mistake, smaller.' },
                  when: { all: [{ seen: 'ch4.sorting.win' }, '!dead:pip'] } },
                { inner: { frogling: 'Our pond fed the loudest frog first. The quiet ones got thin.' },
                  when: { not: { all: [{ seen: 'ch4.sorting.win' }, '!dead:pip'] } } },
                { s: 'beastie', t: 'Questions? Quick ones! The berries are going!' },
                { choice: [
                    { t: 'How does the app choose?', then: [
                        { s: 'beastie', t: 'Science! Numbers go in. Berries come out. And a video!' },
                    ] },
                    { t: '"Needs them most." What does "most" mean, here?', only: 'raven', voice: true, then: [
                        { clock: 'side', progress: 1 },
                        { s: 'beastie', t: 'Most means… the most! The most… requests? …Is that what I meant?' },
                    ] },
                ] },
            ],
            spots: [
                { id: 'volt', kind: 'person', label: 'Usain Volt, by the fire', x: 24, y: 60, art: 'creature/usainvolt/defeated',
                  steps: [
                      { s: 'usainvolt', t: 'I\'m hurt. I don\'t like asking. So I\'m near the bottom.', when: GRANNY },
                      { s: 'usainvolt', t: 'I\'m hurt. I don\'t like asking. So I\'m at the bottom.', when: { not: GRANNY } },
                      { s: 'usainvolt', t: 'Lightning doesn\'t ask. Lightning just… sits here. Hurting.' },
                  ],
                  card: 'Usain Volt is hurt, but too proud to ask. So he ranks at or near the bottom.' },
                { id: 'ranking', kind: 'record', label: 'The ranking, on the big tablet', x: 52, y: 44, art: 'prop/berry-ranking',
                  steps: [
                      { note: 'Top: Speedcheeta, four hundred requests. The next four are loud too.', when: { not: ACHILLES } },
                      { note: 'Top: Coach Achilles. One request, typed in two seconds. That counts as 1,800 an hour.', when: ACHILLES },
                      { note: 'Then Speedcheeta, and three more loud ones.', when: ACHILLES },
                      { note: 'Not a scratch on any of the top five.' },
                      { note: 'Bottom: Granny Axiom, one request, half typed. Just above her: Usain Volt.', when: GRANNY },
                      { note: 'Bottom: Usain Volt.', when: { not: GRANNY } },
                      { s: 'speedcheeta', t: 'Number ONE! …Wait. Am I hurt? CHAT, am I supposed to be hurt?', when: { not: ACHILLES } },
                      { s: 'speedcheeta', t: 'Number TWO? Behind a man who typed ONCE? CHAT, am I hurt? Is that how it works?', when: ACHILLES },
                  ],
                  card: 'The ranking: the top five ask the fastest. None of them is hurt.' },
                { id: 'settings', kind: 'object', label: 'The app\'s settings screen', x: 78, y: 56, art: 'prop/berry-settings',
                  steps: [
                      { note: 'The settings screen. GOAL: NEED. MEASURED BY: REQUESTS PER HOUR.' },
                      { s: 'beastie', t: 'I set that up myself! Very carefully! It took all morning!' },
                  ],
                  card: 'Settings: GOAL: NEED. MEASURED BY: REQUESTS PER HOUR. Beastie chose it, carefully.' },
            ],
        },
        twist: {
            steps: [
                { s: 'speedcheeta', t: 'Wait. Did I CHEAT? I just pressed the button. Four hundred times. It was RIGHT THERE.' },
                { note: 'You check the app. Nobody cheated. Nobody hacked it. It counts exactly what Beastie told it to count.' },
                { s: 'beastie', t: 'See? No cheats! The app is perfect! So the rule is fair! …Right?' },
            ],
            card: 'Nobody cheated. The app works exactly as Beastie set it. It counts asking, not need.',
        },
        resolve: {
            verb: 'negotiate', who: 'beastie', interest: 2, patience: 3, askAt: 4,
            cares: ['safety', 'fame', 'fairness'], cantStand: ['facts'],
            intro: [
                { s: 'beastie', t: 'Change my rule? But it\'s FAIR. It\'s maths! Maths can\'t be unfair!' },
            ],
            listen: {
                mirror: { t: '"Maths can\'t be unfair."', say: [
                    { s: 'beastie', t: 'Exactly! Numbers don\'t have favourites. I checked. With a bigger number.' },
                ] },
                feeling: { t: 'You really want to help people.', say: [
                    { s: 'beastie', t: 'I DO. I\'ve given away four boats. Nobody here even needs a boat.' },
                ] },
                sum: { t: 'So you set it up honestly, and you want the right people fed.', say: [
                    { s: 'beastie', t: 'YES. Honest AND helpful. That\'s my whole channel.' },
                ] },
            },
            args: [
                { t: 'Volt is hurt. If the berries skip him, he stays hurt.', appeal: 'safety', sound: true, say: [
                    { s: 'beastie', t: 'Hurt? At MY giveaway? That\'s the opposite of the video!' },
                ] },
                { t: 'Film the fix. "I found a flaw in my own app." People love that.', appeal: 'fame', say: [
                    { s: 'beastie', t: 'A twist video. Ooh. Those get millions.' },
                ] },
                { t: 'The loud ones get berries. The quiet ones get nothing. That isn\'t fair.', appeal: 'fairness', sound: true, say: [
                    { s: 'beastie', t: 'Nothing? I said WHOEVER needs them. …The quiet ones need them.' },
                ] },
                { t: 'The data shows requests don\'t match injuries.', appeal: 'facts', say: [
                    { s: 'beastie', t: 'Data! Boring! My viewers skip the boring part!' },
                ] },
                { t: 'A doctor would never rank patients like this.', appeal: 'experts', say: [
                    { s: 'beastie', t: 'I\'m not a doctor. I\'m a GIVER.' },
                ] },
            ],
            special: {
                owlet: { t: 'Asking a lot isn\'t needing a lot. Your app measures the wrong thing.', say: [
                    { s: 'beastie', t: 'The wrong thing. Very carefully. …I measured the wrong thing very carefully.' },
                ] },
                mothkin: { t: 'Look at Volt. Really look. He\'s limping. Nobody at the top is.', say: [
                    { s: 'beastie', t: 'He IS limping. How is an eel limping? That\'s terrible. And amazing.' },
                ] },
                fox: { t: 'Picture the thumbnail: "MY APP SKIPPED A HURT HERO." Now picture the fix.', say: [
                    { s: 'beastie', t: 'No! I want the second thumbnail! The happy one!' },
                ] },
                frogling: { t: 'Our pond fed the loudest frog first. The quiet ones got thin.', say: [
                    { s: 'beastie', t: 'Thin frogs. On my channel? Never.' },
                ] },
                raven: { t: '"Needs them most." Your app reads that as "asks the most". The comments will notice.', say: [
                    { s: 'beastie', t: 'The comments. Oh no. The COMMENTS.' },
                ] },
            },
            ask: {
                t: 'Change the rule. Asking isn\'t needing.',
                early: [{ s: 'beastie', t: 'Change it? It\'s my best app yet! Give me a better reason.' }],
                yes: [{ s: 'beastie', t: 'I measured how much people ask. Not how much they need. …Those are different?' }],
            },
            replies: {
                up: [{ s: 'beastie', t: 'Ooh. Go on.' }],
                same: [{ s: 'beastie', t: 'Hm. The app still says no.' }],
                down: [{ s: 'beastie', t: 'Boring! Skip! Skip!' }],
                reset: [{ s: 'beastie', t: 'Okay. Reset. Like a video. From the top!' }],
            },
        },
        // The new rule, each with a visible trade-off. Too late (Danger 4+) and the app is locked.
        after: [
            { when: { clock: 'side.10', lte: 3 }, then: [
                { s: 'beastie', t: 'New rule, then! Which one? Pick, and I\'ll film it.' },
                { choice: [
                    { t: 'A medic checks who is hurt. Fair, but slow.', flag: 'side.10.rule', value: 'medic', then: [
                        { s: 'beastie', t: 'Slow AND fair! The queue will be long. I\'ll hand out snacks. Berry snacks.' },
                    ] },
                    { t: 'A random draw. Fair to everyone, but it ignores need.', flag: 'side.10.rule', value: 'draw', then: [
                        { s: 'beastie', t: 'A lucky draw! Everyone has a chance! Even people who are fine. …Hm.' },
                    ] },
                    { t: 'First come, first served. Fast, but it favours the fast.', flag: 'side.10.rule', value: 'first', then: [
                        { s: 'speedcheeta', t: 'FIRST? I\'m always FIRST! I was born FIRST!' },
                    ] },
                ] },
            ] },
        ],
        outcome: {
            1: [
                ...RULE_NOTES,
                { s: 'beastie', t: 'Today I broke my own app. On purpose. Like and subscribe.' },
                { note: 'Granny gets a basket. She types "thank you". It takes the rest of the day.', when: GRANNY },
                { note: 'Achilles carries a basket to Volt. He runs off before anyone can thank him.', when: ACHILLES },
                GRIEF,
                { note: 'Volt tries the lightning pose. Carefully. He might follow you.' },
                { visitor: 'usainvolt' },
            ],
            2: [
                ...RULE_NOTES,
                { note: 'But the new rule starts late. Half the berries have gone soft in the sun.' },
                { s: 'beastie', t: 'Soft berries! Still berries! Still content!' },
                { note: 'Granny gets a soft berry. She types "thank you". It takes the rest of the day.', when: GRANNY },
                { note: 'Achilles carries a soft berry to Volt. He runs off before anyone can thank him.', when: ACHILLES },
                GRIEF,
            ],
            3: [
                { note: 'Beastie agrees. The app does not. It is locked until tomorrow\'s update.' },
                { s: 'beastie', t: 'I can\'t change it till tomorrow! But here. One berry. Secretly.' },
                { note: 'You carry one berry to {role:granny}.', when: HOLDER },
                { s: 'granny', t: 'A berry! For me? I only got as far as "ber".', when: GRANNY },
                { s: 'granny', t: '', u: 'Thanks. I\'ll give it to the limping one. He won\'t ask.', when: ACHILLES },
                GRIEF,
                { note: 'You carry one berry to Usain Volt. He eats it without a word.', when: NO_GRANNY },
            ],
            4: [
                { note: 'The app sends every berry to the top of the list.' },
                { note: 'Coach Achilles sends his on, untouched. They roll down to number two.', when: ACHILLES },
                { note: 'Down by the fire, Volt is still waiting. He doesn\'t ask.' },
                { s: 'speedcheeta', t: 'I ate a MOUNTAIN. Chat… I don\'t feel like a winner. I feel like a berry.' },
                { s: 'beastie', t: 'That… was not the most scientific thing I\'ve ever done.' },
            ],
        },
        // berry: role:granny's bark on the restored Fair (lesson4.js), only when someone holding the role was here.
        ripples: [{ flag: 'berry', tiers: [1, 2, 3], when: HOLDER }],
        last: [
            { note: 'Beastie checks his phone.', when: TIER(10, 1, 2) },
            { s: 'beastie', t: 'New rule. …It\'s getting more views than the old one. Huh.', when: TIER(10, 1, 2) },
            { s: 'beastie', t: 'Tomorrow, new rule. Fair one. I\'ll film it. People love a fix. …Right?', when: TIER(10, 3) },
            { s: 'beastie', t: 'Next week, no app. I\'ll just ask people. …Oh no. The loud ones.', when: TIER(10, 4) },
        ],
    };
})(typeof window !== 'undefined' ? window : globalThis);
