/*
 * Side stories for lesson 1 (design/SIDE-STORIES.md §4). Format: the header of data/script/side-stories.js.
 *   1 witness-tent  Siege at the Witness Tent  (Negotiate; blue: Raven)    ripple mirage-witness → Ch3 trial
 *   2 lucky-well    The Lucky Well             (Test; blue: Frogling)      ripple well-map → Ch1 Gate (lesson1.js)
 *   3 midday-pie    The Midday Pie             (Deduce; blue: Moth-kin)    side.3 = 4 → Keanu at the Rift Pass (lesson1.js)
 * Generated numbers (story 2) appear only in cards, notes and the table; every voiced line is static,
 * so the voice tool can collect it. Story 9 may read { flag: 'side.1', is: 4 } (Mirage lost her ball).
 */
(function (root) {
    'use strict';
    const Rift = root.Rift;
    const SS = Rift.data.sideStories || (Rift.data.sideStories = {});

    // Sequins: down the Road until the Gate is won; home after it; or gone (his understudy may have arrived).
    const LATER = { any: ['entered:ch2', 'entered:ch3', 'entered:ch4'] };
    const SEQ_HOME = { all: ['!dead:sequins', { any: [{ seen: 'ch1.gate.win' }, LATER] }] };
    const SEQ_AWAY = { all: ['!dead:sequins', { not: { any: [{ seen: 'ch1.gate.win' }, LATER] } }] };
    const SEQ_RIBBON = { all: ['dead:sequins', '!arrived:sequins'] };
    const SEQ_TALLY = { all: ['dead:sequins', 'arrived:sequins'] };
    // Story 7 at tier 4 sends Syllo off recruiting: his toy army has only a drummer.
    const SYLLO = '!syllo-away';
    const NO_SYLLO = 'syllo-away';
    const TIER = (n, ...ts) => ({ any: ts.map(t => ({ flag: 'side.' + n, is: t })) });
    // Nudge's look by the time you meet it at the Well (STORY.md App. G): ring light (to the Gate), mask
    // (to the Hall), no mask (to Ch3), clipboard (to core trial 2), then no job at all.
    const NUDGE_JOBLESS = { seen: 'ch4.core.copy' };
    const NUDGE_CH1 = { not: { any: [{ seen: 'ch1.gate.win' }, LATER] } };
    const NUDGE_CH2 = { all: [{ any: [{ seen: 'ch1.gate.win' }, 'entered:ch2'] }, { not: { seen: 'ch2.hall.win' } }, '!entered:ch3', '!entered:ch4'] };
    const NUDGE_CH2_LATE = { all: [{ seen: 'ch2.hall.win' }, '!entered:ch3', '!entered:ch4'] };
    const NUDGE_CH3 = { all: [{ any: ['entered:ch3', 'entered:ch4'] }, { not: NUDGE_JOBLESS }] };

    // ================================================================ 1. Siege at the Witness Tent
    SS['witness-tent'] = {
        n: 1,
        title: 'Siege at the Witness Tent',
        lesson: 1,
        station: 'stall-witness',
        teaser: 'The Witness Tent is tied shut from inside. Someone is dealing cards.',
        aside: { s: 'narrator', t: 'Madame Mirage\'s tent is tied shut. From the inside. That\'s new.' },
        clock: {
            label: 'The drum roll', size: 6, progress: 4,
            warn: [
                [{ s: 'syllo', t: 'Drummer! Roll! Slowly! Dramatically!', when: SYLLO },
                    { note: 'The drummer plays its one beat. Boom. Boom.', when: NO_SYLLO }],
                [{ s: 'syllo', t: 'Faster, drummer! Toy soldiers, look fierce! Fiercer! That\'s a smile, private.', when: SYLLO },
                    { note: 'Boom. Boom. The toy soldiers lean forward.', when: NO_SYLLO }],
                [{ s: 'syllo', t: 'Corks IN! Aim at the tent! Not at Madame! Mostly not at Madame!', when: SYLLO },
                    { note: 'Boom. Boom. Someone loads a cork.', when: NO_SYLLO }],
                [{ s: 'syllo', t: 'Last bars, recruit! I can hear the cymbal coming!', when: SYLLO },
                    { note: 'Boom. Boom. BOOM.', when: NO_SYLLO }],
            ],
        },
        start: [
            { s: 'syllo', t: 'Recruit! A crow has taken the tent! Three fairgoers! And a crystal ball!', when: SYLLO },
            { note: 'Sergeant Syllo\'s toy army surrounds the tent. No sergeant. Just a very keen drummer.', when: NO_SYLLO },
            { note: 'Inside: three fairgoers, a crystal ball and one very tired crow.', when: NO_SYLLO },
            { s: 'corvina', t: 'I didn\'t take the Thinking Trophy! Nobody believes a crow. Ever.' },
            { s: 'corvina', t: 'These three aren\'t hostages. They\'re my witnesses. Nobody leaves until somebody listens.' },
            { s: 'syllo', t: 'When the drum roll ends, we go in. Corks loaded!', when: SYLLO },
        ],
        clues: {
            intro: [
                { clock: 'side', tick: 1 },
                { inner: {
                    owlet: 'Everyone "knows". Nobody checked. That isn\'t knowing. I checked.',
                    mothkin: 'Look. The clip has edges. Something shiny is just outside them.',
                    fox: 'What if the black wing belongs to someone we like? Twist!',
                    frogling: 'Crows got blamed for my mother\'s pond, too. It was the wind.',
                    raven: 'Tell her: "People blame black feathers. I know. I have them."',
                } },
                { s: 'corvina', t: 'Who\'s out there? If it\'s another expert, go away.' },
                { choice: [
                    { t: 'Only me. I want to talk.', then: [
                        { s: 'corvina', t: 'Talk. Ha. Everybody talks. Nobody listens to a crow.' },
                    ] },
                    { t: 'People blame black feathers. I know. I have them.', only: 'raven', voice: true, then: [
                        { clock: 'side', drain: 1 },
                        { s: 'corvina', t: 'Hmph. You do, chick. Fine. I\'ll listen. For one hand.' },
                    ] },
                ] },
            ],
            spots: [
                { id: 'billie', kind: 'person', label: 'Billie, at the tent flap', x: 30, y: 58, art: 'creature/eelish/idle',
                  steps: [
                      { s: 'eelish', t: 'On the day of the final, she dealt us cards. All morning. Badly.' },
                      { s: 'eelish', t: 'She never left. I know. I lost my lunch money. And a song.' },
                      { note: 'Mr. Beansprout says nothing. He holds up an ace. He found it in her sleeve.' },
                  ],
                  card: 'Billie: on the day of the final, Corvina dealt cards all morning. She never left.' },
                { id: 'clip', kind: 'object', label: 'Speedcheeta\'s stream, from inside the tent', x: 58, y: 44, art: 'prop/witness-clip',
                  steps: [
                      { note: 'Through the flap, a phone screen. The cub is streaming the siege. Live.' },
                      { s: 'speedcheeta', t: 'CHAT! My clip! A black wing! Right by the trophy stand! Case CLOSED!' },
                      { note: 'You ask to see it zoomed out. The wing is black. And white. A magpie\'s wing.' },
                      { s: 'speedcheeta', t: '…Case open. Case VERY open. Nobody clip that.' },
                  ],
                  card: 'The clip, zoomed out: the wing is black AND white. A magpie\'s.' },
                { id: 'box', kind: 'record', label: 'The polishing box, at the Pattern Stall', x: 82, y: 62, art: 'prop/polishing-box',
                  steps: [
                      { note: 'Next door, the Pattern Stall. A sign on the curtain: BACK SOON. PROBABLY.', when: SEQ_AWAY },
                      { s: 'sequins', t: 'The trophy? I\'m POLISHING it! I told the whole Fair! Twice!', when: SEQ_HOME },
                      { note: 'The Pattern Stall wears a black ribbon. Behind it sits his polishing box.', when: SEQ_RIBBON },
                      { s: 'sequins', t: '', u: 'He polished things. Without asking. Always.', when: SEQ_TALLY },
                      { note: 'Inside: the Thinking Trophy, half shiny. A note: "Polishing. Back soon. —S"' },
                  ],
                  card: 'The polishing box: the trophy, and a note. "Polishing. Back soon. —S"' },
            ],
        },
        twist: {
            steps: [
                { s: 'speedcheeta', t: 'Wait. I cropped that clip. For the thumbnail. A crow got more clicks.' },
                { s: 'speedcheeta', t: 'The Professor took it. To polish it. Delete my clip. Delete my LIFE.', when: '!dead:sequins' },
                { s: 'speedcheeta', t: 'The Professor took it. To polish it. …I\'m not streaming this part.', when: 'dead:sequins' },
            ],
            card: 'Speedcheeta cropped the clip. The wing was a magpie\'s: Sequins took the trophy, to polish it.',
        },
        resolve: {
            verb: 'negotiate', who: 'corvina', interest: 2, patience: 3, askAt: 4,
            cares: ['fairness', 'profit', 'safety'], cantStand: ['experts'],
            intro: [
                { s: 'corvina', t: 'So you know it wasn\'t me. Lovely. Out there, they still "know" it was.' },
            ],
            listen: {
                mirror: { t: '"Nobody believes a crow."', say: [
                    { s: 'corvina', t: 'Nobody. If I win at cards, I cheated. If I lose, I cheated badly.' },
                ] },
                feeling: { t: 'You sound tired. Tired of the blame.', say: [
                    { s: 'corvina', t: 'Tired? I\'m a crow at a fair. I was born tired.' },
                ] },
                sum: { t: 'So you didn\'t take it, and they blamed you anyway.', say: [
                    { s: 'corvina', t: 'Yes. That. …Huh. Nobody ever said it back to me before.' },
                ] },
            },
            args: [
                { t: 'Come out with me. Let the crowd see the clip, zoomed out.', appeal: 'fairness', sound: true, say: [
                    { s: 'corvina', t: 'A crow, cleared in public. That would be a first. Go on.' },
                ] },
                { t: 'A crow who was right gets customers. Your table will be full.', appeal: 'profit', sound: true, say: [
                    { s: 'corvina', t: 'Full tables. Full pockets. Now you\'re speaking crow.' },
                ] },
                { t: 'A famous detective studied this case. Trust the expert.', appeal: 'experts', say: [
                    { s: 'corvina', t: 'Don\'t you lecture me. Experts said crows steal shiny things.' },
                ] },
                { t: 'The facts are on your side. The clip proves it.', appeal: 'facts', say: [
                    { s: 'corvina', t: 'Facts. Lovely. That drum can\'t read.' },
                ] },
                { t: 'Those corks really sting. Please, stay safe.', appeal: 'safety', say: [
                    { s: 'corvina', t: '…Corks. Yes. I don\'t love corks. Go on.' },
                ] },
            ],
            special: {
                owlet: { t: 'Black and white is a magpie. You\'re a crow. So it wasn\'t you.', say: [
                    { s: 'corvina', t: 'Logic. From an owlet. Fine. I\'ll allow it.' },
                ] },
                mothkin: { t: 'Look at the clip with me. Black and white. Look.', say: [
                    { s: 'corvina', t: 'Black and white. Pretty, grub. …And if they see it, the corks go down.' },
                ] },
                fox: { t: 'Picture it: you walk out, the corks go down, nobody gets hurt.', say: [
                    { s: 'corvina', t: 'Nobody hurt. Not even me. That\'s a new picture. Keep painting.' },
                ] },
                frogling: { t: 'They blamed a crow for my mother\'s pond. It was the wind.', say: [
                    { s: 'corvina', t: 'The wind. Ha. The wind never says sorry either.' },
                ] },
                raven: { t: 'They call you "thief". One word. Come out and change the word.', say: [
                    { s: 'corvina', t: 'Change the word. Ha. I\'ve changed worse things, chick. Cards, mostly.' },
                ] },
            },
            ask: {
                t: 'Let your witnesses go. Come out with me.',
                early: [{ s: 'corvina', t: 'Out? Into THAT? Not yet. Deal me a better hand.' }],
                yes: [{ s: 'corvina', t: 'Fine. I\'m coming out. If a cork hits me, I\'m going back in.' }],
            },
            replies: {
                up: [{ s: 'corvina', t: 'Hm. Go on.' }],
                same: [{ s: 'corvina', t: 'And? The drum is still going.' }],
                down: [{ s: 'corvina', t: 'Don\'t you lecture me.' }],
                reset: [{ s: 'corvina', t: 'Stop. Shuffle. Start again. Slowly this time.' }],
            },
        },
        outcome: {
            1: [
                { note: 'The flap opens. Billie, Mr. Beansprout and Speedcheeta walk out. Then the crow.' },
                { s: 'syllo', t: 'STAND DOWN! Corks away! …Recruit, what was the drum roll for, then?', when: SYLLO },
                { note: 'Speedcheeta shows the zoomed-out clip. Just the trophy stand. "The rest is… private."' },
                { note: 'The Thinking Trophy goes back on its stand.' },
                { s: 'corvina', t: 'Here. A lantern. Don\'t tell anyone a crow gave you a present.' },
                { give: { lure: 1 } },
            ],
            2: [
                { note: 'Everyone gets out. Then the toy army charges anyway, a little late. The tent rips.' },
                { s: 'syllo', t: 'Sorry, madame! The drummer got excited!', when: SYLLO },
                { closed: 'stall-witness', note: 'The Witness Tent is closed for repairs. A sign: SEE YOU IN THE FUTURE.' },
            ],
            3: [
                { s: 'syllo', t: 'CHARGE!', when: SYLLO },
                { note: 'Corks fly. A sack of fortune-teller glitter bursts. Everyone is now very sparkly.' },
                { note: 'In the glitter, Corvina slips out the back.' },
                { s: 'mirage', t: 'My glitter, darling. That was for special occasions. This was not one.' },
            ],
            4: [
                { note: 'The drum roll ends. Corks fly. When the glitter settles, the tent is empty.' },
                { note: 'Corvina is gone. So is the crystal ball.' },
                { s: 'mirage', t: 'My ball! Fine. I\'ll read tea leaves. They only ever say "tea".' },
            ],
        },
        ripples: [{
            flag: 'mirage-witness', tiers: [1, 2], boss: 't-tribunal', drain: 1,
            late: [{ s: 'mirage', t: 'A free fortune, darling. You will win an argument. You already did.' }],
        }],
        last: [
            { s: 'mirage', t: 'My ball saw a great deal today, darling. If you ever need a witness, ask.', when: 'mirage-witness' },
            { s: 'corvina', t: 'Crows get blamed. Magpies get trophies. …I\'m keeping the ace.', when: { all: [TIER(1, 1, 2), '!dead:sequins'] } },
            { s: 'corvina', t: 'Crows get blamed. Magpies get missed. …He\'d have polished this ace.', when: { all: [TIER(1, 1, 2), 'dead:sequins'] } },
            { note: 'Mr. Beansprout feels in his sleeve. The ace is gone. So is the crow.', when: TIER(1, 3, 4) },
        ],
    };

    // ================================================================ 2. The Lucky Well
    SS['lucky-well'] = {
        n: 2,
        title: 'The Lucky Well',
        lesson: 1,
        station: 'well',
        teaser: 'A queue at the Wishing Well. Coins are going in. Nothing is coming out.',
        aside: { s: 'narrator', t: 'Somebody at the Well is very lucky. Suspiciously lucky.' },
        // Goals in 10 matches after wishing, and in 10 without: always the same.
        setup: rng => { const a = 4 + rng.int(0, 3); return { a, b: a }; },
        clock: {
            label: 'Coins lost', size: 6, progress: 3,
            warn: [
                [{ s: 'beastie', t: 'Second cheque going in! Even bigger! For SCIENCE!' }],
                [{ s: 'chimpossible', t: 'Ten thousand viewers. All wishing at once. That\'s entirely possible.' }],
                [{ note: 'Plink. Plink. Plink. The queue is longer now. Somebody brought a picnic.' }],
            ],
        },
        start: [
            { s: 'siuuugull', t: 'I wished. I scored. SIUUU! The well is magic!' },
            { s: 'beastie', t: 'I threw in a cheque! The biggest wish ever!' },
            { s: 'chimpossible', t: 'It\'s entirely possible. Jamie, pull that up.' },
        ],
        clues: {
            intro: [
                { inner: {
                    owlet: 'Wished and scored. What about wished and missed? I always ask that.',
                    mothkin: 'Ooh, coins. Shiny. …No. His list. No crosses at all.',
                    fox: 'Picture the matches he didn\'t write down. Lots of drama there.',
                    frogling: 'Ask him: "Remember the matches you forgot to wish?"',
                    raven: '"Magic." Big word. Magic compared to what?',
                } },
                { s: 'siuuugull', t: 'Questions? I answer only in goals.' },
                { choice: [
                    { t: 'How does the well work, exactly?', then: [
                        { s: 'siuuugull', t: 'Coin in. Wish. Goal. SIUUU. It is science.' },
                    ] },
                    { t: 'Remember the matches you forgot to wish?', only: 'frogling', voice: true, then: [
                        { clock: 'side', progress: 1 },
                        { s: 'siuuugull', t: 'Forgot to wish? A few times. I scored in those too. …Hm.' },
                    ] },
                ] },
            ],
            spots: [
                { id: 'list', kind: 'person', label: 'Siuuugull\'s list', x: 28, y: 58, art: 'creature/siuuugull/smug',
                  steps: [
                      { s: 'siuuugull', t: 'My list! Every time I wished and scored. All me.' },
                      { note: 'Wished, scored. Wished, scored. Wished, scored. Not one cross.' },
                  ],
                  card: v => 'His list: ' + v.a + ' matches. He wished AND scored in every one. No misses.' },
                { id: 'log', kind: 'record', label: 'The referee\'s log', x: 76, y: 60, art: 'prop/referee-log',
                  steps: [
                      { note: 'The referee\'s log. Every match: coin or no coin, goal or no goal.' },
                      { s: 'chimpossible', t: 'Hold on. He scores without the well, too? Is that possible?' },
                  ],
                  card: v => 'Referee\'s log: after wishing, he scored in ' + v.a + ' of 10 matches. Without wishing, ' + v.b + ' of 10.' },
                { id: 'well', kind: 'object', label: 'Down the well', x: 52, y: 46, art: 'prop/wishing-well',
                  steps: [
                      { note: 'You lower a lantern. At the bottom: Nudge, filling a sack with coins.' },
                      { s: 'nudge', t: 'Get that light off me! I do the lighting!', when: { not: NUDGE_JOBLESS } },
                      { s: 'nudge', t: 'Engagement! Every wish is a click! Keep them coming!', when: NUDGE_CH1 },
                      { s: 'nudge', e: 'masked', t: 'Engagement! Every wish is a click! Keep them coming!', when: NUDGE_CH2 },
                      { s: 'nudge', e: 'maskless', t: 'Engagement! Every wish is a click! Keep them coming!', when: NUDGE_CH2_LATE },
                      { s: 'nudge', e: 'clipboard', t: 'Engagement! Every wish is a click! Keep them coming!', when: NUDGE_CH3 },
                      { s: 'nudge', e: 'sad', t: 'Old habits. Nobody counts my clicks now. I count coins.', when: NUDGE_JOBLESS },
                  ],
                  card: 'Down the well: Nudge, scooping up every coin.' },
            ],
        },
        twist: {
            steps: [
                { note: 'Siuuugull pulls you aside. No SIUUU this time.' },
                { s: 'siuuugull', t: 'I know it doesn\'t work.' },
                { s: 'siuuugull', t: 'I just like the moment before the kick. It\'s quiet.' },
                { s: 'siuuugull', t: 'I never asked anyone to wish. They just copied me.' },
                { note: 'A bell jingles down the well. Nudge is down there, with a sack of coins.' },
                { note: 'It drops a map. Tunnels. One runs under the Gate, with a long cable in it.' },
            ],
            card: 'Siuuugull knows wishing does nothing. The queue only copied him. Nudge takes the coins.',
        },
        resolve: {
            verb: 'test',
            intro: [{ s: 'chimpossible', t: 'The queue still believes. Have you ever tried… counting? Jamie, give me data.' }],
            // Two rounds: the table appears only once the right data has been chosen.
            rounds: [{
                q: 'Which data would show whether wishing works?',
                options: [
                    { t: 'The matches where he scored', say: [
                        { s: 'siuuugull', t: 'All goals! Beautiful! …Oh. That\'s the problem, isn\'t it.' },
                    ] },
                    { t: 'Every match he wished before', say: [
                        { s: 'chimpossible', t: 'Wished, wished, wished. Compared to what, though?' },
                    ] },
                    { t: 'All his matches, with and without wishing', ok: true, say: [
                        { s: 'chimpossible', t: 'Both columns. Pull up BOTH columns.' },
                    ] },
                    { t: 'What the viewers think', say: [
                        { s: 'chimpossible', t: 'The viewers think the moon is a cheese. Ten thousand of them.' },
                    ] },
                ],
            }, {
                q: 'Does wishing help?',
                table: v => [['', 'Scored', 'Did not score'], ['Wished first', v.a, 10 - v.a], ['Did not wish', v.b, 10 - v.b]],
                options: [
                    { t: 'Yes: wishing clearly helps', say: [
                        { s: 'siuuugull', t: 'Clearly? Same goals either way. Even I see that. And I mostly see myself.' },
                    ] },
                    { t: 'No: he scores the same either way', ok: true, say: [
                        { s: 'siuuugull', t: 'The same. Yes. I told you. Quietly.' },
                    ] },
                    { t: 'We can\'t tell without his list', say: [
                        { s: 'chimpossible', t: 'His list only has the good ones. Jamie, burn the list. Gently.' },
                    ] },
                ],
            }],
        },
        outcome: {
            1: [
                { note: 'The queue stops wishing. The coins come back up in a bucket. All of them.' },
                { s: 'beastie', t: 'My cheque! I\'m giving it away again! Somewhere drier!' },
                { note: 'Nudge flees up a tunnel, without its sack.' },
                { s: 'nudge', t: 'You can\'t unsubscribe from a WELL!', when: { not: NUDGE_JOBLESS } },
                { note: 'Siuuugull watches you go. He might follow.' },
                { visitor: 'siuuugull' },
            ],
            2: [
                { note: 'Most of the coins come back. Nudge keeps a pocketful and runs.' },
                { s: 'beastie', t: 'Most of my wishes are back! That\'s still a lot of wishes.' },
            ],
            3: [
                { note: 'Nudge grabs the map and half the coins, and vanishes down a tunnel.' },
                { s: 'beastie', t: 'Half my wishes are gone! Down a hole! With an imp!' },
            ],
            4: [
                { note: 'Nudge takes everything. The coins. The map. The giant cheque.' },
                { s: 'beastie', t: 'Hi, guys. Today I lost a giant cheque. Down a well. Please like.' },
            ],
        },
        ripples: [{
            flag: 'well-map', tiers: [1, 2], boss: 'gate', drain: 1,
            late: [
                { keepsake: 'well-map' },
                { note: 'You keep Nudge\'s tunnel map. The cage is empty now. It is a very bad map.', when: '!dead:sequins' },
                { note: 'You keep Nudge\'s tunnel map. It leads to an empty cage.', when: 'dead:sequins' },
            ],
        }],
        last: [
            { note: 'You keep Nudge\'s tunnel map. One tunnel runs under the Gate, with a cable in it.', when: 'well-map' },
            { s: 'chimpossible', t: 'Jamie. Pull up the full table. …There\'s no Jamie, is there.' },
        ],
    };

    // ================================================================ 3. The Midday Pie
    SS['midday-pie'] = {
        n: 3,
        title: 'The Midday Pie',
        lesson: 1,
        station: 'campfire',
        teaser: 'At noon, a pie vanished from the Campfire. At noon yesterday, too.',
        aside: { s: 'narrator', t: 'Pies keep vanishing at the Campfire. Always at noon. Rude.' },
        clock: {
            label: 'Rawmsay\'s temper', size: 6, progress: 3,
            warn: [
                [{ s: 'rawmsay', t: 'I am THIS close to closing this kitchen. THIS close.' }],
                [{ s: 'rawmsay', t: 'Who taught you to investigate? A SPOON?' }],
                [{ s: 'rawmsay', t: 'I\'m writing the CLOSED sign. In capitals. Every letter.' }],
            ],
        },
        start: [
            { s: 'rawmsay', t: 'WHERE IS MY PIE? It was PERFECT. It was barely RAW.' },
            { s: 'speedcheeta', t: 'CHAT! Every time a pie goes, the black cat walks by! EVERY TIME!' },
            { s: 'keanu', t: 'I have a strange feeling I\'ve been accused of this before.' },
        ],
        clues: {
            intro: [
                { s: 'rawmsay', t: 'Find the thief. Or this kitchen CLOSES. For everyone.' },
                { inner: {
                    owlet: '"Every time" is a pattern. A pattern isn\'t a proof. Classic me.',
                    mothkin: 'Shh. His apron. Something glints in the pocket. Look.',
                    fox: 'Picture it: a cat burglar. Tiny mask. Tiny rope. …Too good to be false?',
                    frogling: 'Every noon, the cat. Every noon, the pie. Every noon, the timer.',
                    raven: '"Walks by." Not "takes". Different verbs.',
                } },
                { choice: [
                    { t: 'Chef, when did you last see the pie?', then: [
                        { s: 'rawmsay', t: 'Noon! On the sill! I blinked, and it was GONE.' },
                    ] },
                    { t: 'Chef. What\'s that on your apron?', only: 'mothkin', voice: true, then: [
                        { clock: 'side', progress: 1 },
                        { s: 'rawmsay', t: 'Flour. Chefs wear flour. …And a little pastry. Stop looking.' },
                    ] },
                ] },
            ],
            spots: [
                { id: 'fern', kind: 'person', label: 'A fern that whispers', x: 22, y: 56, art: 'creature/attenbirdough/idle',
                  steps: [
                      { s: 'attenbirdough', t: 'Here, at the Campfire, a rare event. It happens every day.' },
                      { s: 'attenbirdough', t: 'At noon, the oven timer rings. And the cat passes. Remarkable.' },
                  ],
                  card: 'Attenbirdough: the cat walks by when the oven timer rings. At noon.' },
                { id: 'apron', kind: 'object', label: 'Rawmsay\'s apron', x: 50, y: 50, art: 'prop/rawmsay-apron',
                  steps: [
                      { note: 'Pastry crumbs down the front. A fork in the pocket.' },
                      { s: 'rawmsay', t: 'That fork is for TASTING. Chefs taste. Stop looking at my fork.' },
                  ],
                  card: 'His apron: pastry crumbs, and a fork in the pocket.' },
                { id: 'timer', kind: 'record', label: 'The oven timer\'s log', x: 78, y: 60, art: 'prop/oven-timer',
                  steps: [
                      { note: 'The timer rings at noon, every day. At noon it also opens the warm-air vent.' },
                      { s: 'keanu', t: 'The vent is lovely. Warm air. I go and say hello to it.' },
                  ],
                  card: 'The timer rings at noon. It also opens the warm vent, where Keanu naps.' },
            ],
        },
        twist: {
            steps: [
                { s: 'rawmsay', t: 'Are we done? I need my nap. Eleven to noon. Every day.' },
                { s: 'attenbirdough', t: 'And at noon, the timer wakes the great chef. Eyes still closed.' },
                { s: 'rawmsay', t: 'Nonsense. I wake up at noon with a full stomach. Like everyone.' },
            ],
            card: 'Rawmsay naps until noon. The timer wakes him, half asleep. He wakes up full.',
        },
        resolve: {
            verb: 'deduce',
            intro: [{ s: 'rawmsay', t: 'Well? Name the thief. And it had better not be the cat. It\'s the cat.' }],
            rounds: [
                {
                    q: 'Who ate the pie?',
                    table: [
                        ['', 'Near the sill at noon', 'Half asleep at noon', 'Woke up full', 'Crumbs and a fork'],
                        ['Keanu Meows', '✓', '—', '—', '—'],
                        ['Sir David, in the fern', '✓', '—', '—', '—'],
                        ['Rawmsay', '✓', '✓', '✓', '✓'],
                    ],
                    options: [
                        { t: 'Keanu Meows', say: [
                            { s: 'keanu', t: 'That\'s okay. I forgive you. I didn\'t do it. But I forgive you.' },
                        ] },
                        { t: 'Sir David, in the fern', say: [
                            { s: 'attenbirdough', t: 'Me? I only watch. I have watched pies for forty years. Never touched one.' },
                        ] },
                        { t: 'Nobody stole it. Rawmsay ate it, half asleep.', ok: true, say: [
                            { s: 'rawmsay', t: 'Me? I\'m a CHEF. I don\'t steal pies. I… make them. And then…' },
                        ] },
                    ],
                    why: {
                        q: 'Why?',
                        options: [
                            { t: 'He was at the sill, half asleep, and woke up full. Crumbs and fork too.', ok: true },
                            { t: 'Chefs always have crumbs.', say: [
                                { s: 'rawmsay', t: 'Exactly! Crumbs prove NOTHING. …Hm.' },
                            ] },
                            { t: 'The cat walks by every time.', say: [
                                { s: 'rawmsay', t: 'Every time! See? …Wait. I walk by every time, too.' },
                            ] },
                            { t: 'Nobody hides in a fern for no reason.', say: [
                                { s: 'attenbirdough', t: 'I hide in ferns for EVERY reason.' },
                            ] },
                        ],
                    },
                },
                {
                    q: 'So why does the cat always pass when a pie goes?',
                    options: [
                        { t: 'The cat smells the pie.', say: [
                            { s: 'keanu', t: 'I don\'t like pie. I like the vent.' },
                        ] },
                        { t: 'The timer causes both: it wakes the chef and opens the vent.', ok: true, say: [
                            { s: 'attenbirdough', t: 'One timer. A hungry chef. A warm cat. Remarkable.' },
                        ] },
                        { t: 'Pure luck.', say: [
                            { s: 'rawmsay', t: 'Luck? Every day at noon? That\'s not luck. That\'s a SCHEDULE.' },
                        ] },
                    ],
                },
            ],
        },
        outcome: {
            1: [
                { s: 'rawmsay', t: 'A cat. I blamed a CAT.' },
                { s: 'rawmsay', t: 'Come here, little one. Have tomorrow\'s pie.' },
                { s: 'keanu', t: 'Thank you. I\'ll share it with the vent.' },
                { visitor: 'keanu' },
            ],
            2: [
                { s: 'rawmsay', t: 'Fine. The kitchen stays open. The pie stays GONE.' },
            ],
            3: [
                { s: 'rawmsay', t: 'The cat is innocent. I am still FURIOUS. Kitchen CLOSED!' },
                { closed: 'campfire', note: 'The Campfire kitchen is closed. A sign: GONE FOR A NAP. ANGRILY.' },
            ],
            4: [
                { s: 'rawmsay', t: 'OUT, cat! Down the Road! And don\'t come back for lunch!' },
                { s: 'keanu', t: 'Okay. I\'ll go. I\'m not angry. I\'m just walking.' },
            ],
        },
        last: [
            { note: 'Rawmsay puts a hand in his apron pocket. He pulls out the fork.' },
            { s: 'rawmsay', t: '…I have been eating my own pies. In my sleep. Delicious.' },
        ],
    };
})(typeof window !== 'undefined' ? window : globalThis);
