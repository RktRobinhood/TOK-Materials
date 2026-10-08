/*
 * Side stories for lesson 3 (design/SIDE-STORIES.md §6). Format: the header of data/script/side-stories.js.
 *   7 recruitment-drive  Syllo's Recruitment Drive  (Object, a duel; blue: Fox)       ripple soldiers → Ch4 Copy (lesson4.js);
 *                                                                                     tier 4 sets syllo-away (Gallery sign in
 *                                                                                     data/map.js; story 1; the finale bark)
 *   8 headline-debate    The Headline Debate        (Object, refereeing; blue: Owlet) ripple fair-quote → Ch3 trial (lesson3.js)
 * Both are fixed puzzles: every line is static, so every voiced line can be recorded.
 * Every Object round with `present` asks for a card that every path holds: the twist card, or either of
 * two clue cards (any two of three clues always include one of them).
 * Nobody here is a known NPC under possession: the glowing recruits and crowd are caricatures.
 * Syllo is never dead: at tier 4 he is missing (syllo-away) until he comes home on the restored Fair map.
 */
(function (root) {
    'use strict';
    const Rift = root.Rift;
    const SS = Rift.data.sideStories || (Rift.data.sideStories = {});

    const TIER = (n, ...ts) => ({ any: ts.map(t => ({ flag: 'side.' + n, is: t })) });

    // ================================================================ 7. Syllo's Recruitment Drive
    // Four rounds: three possessed recruits (popularity, false choice, authority), then Syllo rewords
    // the same tricks, runs out of them, and needs one sound reason to stay.
    const POP = 'Popularity: lots of people do it, so it must be right.';
    const CHOICE = 'False choice: only two options, when there are more.';
    const AUTH = 'Authority: a big name says so, so it must be true.';
    const NAME7 = (ok, okSay) => [
        { t: POP, ok: ok === 'pop', say: ok === 'pop' ? okSay : undefined },
        { t: CHOICE, ok: ok === 'choice', say: ok === 'choice' ? okSay : undefined },
        { t: AUTH, ok: ok === 'auth', say: ok === 'auth' ? okSay : undefined },
    ];
    // Sequins by lesson 3: home (quieter) or gone. Granny is gone from the Fair either way (walking
    // home through time, or lost at the Hall).
    SS['recruitment-drive'] = {
        n: 7,
        title: 'Syllo\'s Recruitment Drive',
        lesson: 3,
        station: 'stall-gallery',
        teaser: 'A drum at the Fair. Half the Fair is marching in step.',
        aside: { s: 'narrator', t: 'Someone at the Fair is drumming. Half the Fair is marching to it.' },
        clock: {
            label: 'The drum', size: 6, progress: 4,
            warn: [
                [{ s: 'syllo', t: 'Drummer! Louder! The sky can\'t hear us yet!' }],
                [{ note: 'Boom. Boom. Another row of eyes starts to glow.' }],
                [{ s: 'syllo', t: 'Left foot! Right foot! Other left foot!' }],
                [{ note: 'BOOM. BOOM. Every recruit turns, at once, to face the Road.' }],
                [{ s: 'syllo', t: 'Last bars! Wave goodbye to anyone who isn\'t marching!' }],
            ],
        },
        start: [
            { s: 'syllo', t: 'RECRUITS! Everyone\'s joining! Are you everyone, or are you NOBODY?' },
            { note: 'Half the Fair stands in rows behind him. A front rank of eleven, then everyone else. Their eyes are starting to glow.' },
            { s: 'syllo', t: 'When the drum stops, we march! Down the Road! To fight the sky! March, or be a COWARD!' },
        ],
        clues: {
            intro: [
                { inner: {
                    owlet: '"March or be a coward." Two options? I count at least four.',
                    mothkin: 'Look. The front rank never blinks. Not once. Not even at the drum.',
                    fox: 'Tell him: picture the Fair without its Sergeant.',
                    frogling: 'Last time a whole crowd agreed, the sky cracked. I remember.',
                    raven: '"Everyone." Count them. It\'s eleven.',
                } },
                { choice: [
                    { t: 'Sergeant! Who exactly are we fighting?', then: [
                        { s: 'syllo', t: 'The SKY, recruit! It has been looking at us. Funny.' },
                    ] },
                    { t: 'Sergeant. Picture the Fair without its Sergeant.', only: 'fox', voice: true, then: [
                        { clock: 'side', drain: 1 },
                        { s: 'syllo', t: 'Without… me? Who would shout "attention"? Nobody would pay any.' },
                        { note: 'The drum slows down. Just a little.' },
                    ] },
                ] },
            ],
            spots: [
                { id: 'volt', kind: 'person', label: 'Usain Volt, in the second row', x: 30, y: 58, art: 'creature/usainvolt/idle',
                  steps: [
                      { s: 'usainvolt', t: 'I joined because everyone else did. Is that… not a reason?', possessed: true },
                      { note: 'He does his lightning pose. His eyes glow a little brighter.' },
                      { s: 'usainvolt', t: 'I do this when I win. I\'m not sure I\'m winning.', possessed: true },
                  ],
                  card: 'Usain Volt joined because everyone else did. That is his only reason.' },
                { id: 'rank', kind: 'object', label: 'The front rank', x: 58, y: 46, art: 'prop/painted-soldier',
                  steps: [
                      { note: 'The front rank: eleven Fair folk, very straight, very still.' },
                      { note: 'They never blink. Their eyes don\'t glow, even when the drum booms.' },
                      { note: 'One has a chip of paint missing from its nose. It doesn\'t seem to mind.' },
                  ],
                  card: 'The front rank never blinks, and their eyes never glow. One has a chipped nose.' },
                { id: 'posters', kind: 'record', label: 'Posters on the Gallery wall', x: 82, y: 60, art: 'prop/recruit-posters',
                  steps: [
                      { note: 'Three fresh posters. EVERYONE\'S JOINING! · MARCH OR BE A COWARD! · THE ROCKODILE SAYS SO!' },
                      { note: 'On the third, the Rockodile raises one eyebrow. It goes right off the top of the poster.' },
                  ],
                  card: 'The posters: "EVERYONE\'S JOINING!" "MARCH OR BE A COWARD!" "THE ROCKODILE SAYS SO!"' },
            ],
        },
        twist: {
            id: 'wooden',
            steps: [
                { note: 'The drum stops for breath. In the quiet, the front rank creaks.' },
                { note: 'You tap the nearest one on the nose. Tok. Hollow. Paint flakes off. Underneath: wood.' },
                { s: 'usainvolt', t: 'I joined because everyone else did. …Is "everyone" made of wood?', possessed: true },
                { s: 'syllo', t: 'They are… very disciplined recruits.' },
                { s: 'syllo', t: 'Fine! My toy soldiers. In costume. They marched first. The rest of you followed!' },
            ],
            card: 'The front rank is eleven of Syllo\'s toy soldiers, painted as Fair folk. Everyone else followed them.',
        },
        resolve: {
            verb: 'object',
            intro: [
                { s: 'syllo', t: 'Recruits! Tell this civilian why you march!' },
            ],
            rounds: [
                {
                    line: [{ s: 'usainvolt', t: 'The whole Fair is marching now! Real ones! So it must be right!', possessed: true }],
                    press: [{ s: 'usainvolt', t: 'Why did they join? The front rank did. Why did the front rank join?', possessed: true }],
                    q: 'Who started the crowd? Show him.',
                    present: 'wooden',
                    wrong: [{ s: 'usainvolt', t: 'Nice card. But who marched FIRST?', possessed: true }],
                    name: { q: 'Name his bad reason.', options: NAME7('pop'), wrong: [
                        { s: 'usainvolt', t: 'That\'s not mine. Mine is "everybody". I checked.', possessed: true },
                    ] },
                    right: [
                        { note: 'Usain Volt blinks. The glow goes out of his eyes.' },
                        { note: 'He does his lightning pose. Slowly. At nobody.' },
                    ],
                },
                {
                    line: [{ s: 'swiftlet', t: 'There are only two eras now. Marching Era. Or Coward Era.', possessed: true }],
                    press: [{ s: 'swiftlet', t: 'Coward Era has no songs. I\'d have to write them all.', possessed: true }],
                    q: 'Your reply?',
                    options: [
                        { t: 'There\'s a third era. Stay here, and be brave here.', ok: true },
                        { t: 'Everyone\'s staying. You should too.', say: [
                            { s: 'swiftlet', t: '"Everyone"? You sound like the posters.', possessed: true },
                        ] },
                        { t: 'The Rockodile says stay.', say: [
                            { s: 'swiftlet', t: 'He says lots of things. Mostly on posters.', possessed: true },
                        ] },
                    ],
                    name: { q: 'Name her bad reason.', options: NAME7('choice'), wrong: [
                        { s: 'swiftlet', t: 'Wrong era, darling. Count my choices.', possessed: true },
                    ] },
                    right: [
                        { note: 'Swiftlet\'s glow fades.' },
                        { s: 'swiftlet', t: 'A third era. Staying Era. I feel a song coming. Eleven verses. One per soldier.' },
                    ],
                },
                {
                    line: [{ s: 'eminemu', t: 'Rock said march, and the Rock is strong. Strong things, see, are never wrong!', possessed: true }],
                    press: [{ s: 'eminemu', t: 'Has the Rock been to the sky? …He\'s been to the gym. Same height.', possessed: true }],
                    q: 'Your reply?',
                    options: [
                        { t: 'Is the Rockodile a sergeant? Has he even seen the sky?', ok: true },
                        { t: 'Everyone knows the Rockodile is wrong.', say: [
                            { s: 'eminemu', t: 'Everyone? Who\'s everyone? Show me their faces!', possessed: true },
                        ] },
                        { t: 'Agree with him, or you\'re a sheep.', say: [
                            { s: 'eminemu', t: 'Sheep or soldier? That\'s two. I rhyme better than that.', possessed: true },
                        ] },
                    ],
                    name: { q: 'Name his bad reason.', options: NAME7('auth'), wrong: [
                        { s: 'eminemu', t: 'Nope. Listen to the beat. Who said it?', possessed: true },
                    ] },
                    right: [
                        { note: 'The emu stops mid-rhyme. The glow drains out of him.' },
                        { s: 'eminemu', t: 'Not a sergeant. Just a rock with a brow. I\'m off home. Right now.' },
                    ],
                },
                {
                    line: [{ s: 'syllo', t: 'Recruits! ELEVEN brave souls marched first! Eleven can\'t be wrong!' }],
                    asks: [
                        { q: 'Same trick, new words. Which one?', options: NAME7('pop', [
                            { s: 'syllo', t: 'Then I am a SERGEANT! I outrank you! I say MARCH!' },
                        ]), wrong: [
                            { s: 'syllo', t: 'Wrong trick, recruit! I should know. I painted most of them.' },
                        ] },
                        { q: 'And that one?', options: NAME7('auth', [
                            { s: 'syllo', t: 'Then it\'s march, or… or…' },
                            { note: 'He can\'t find the second half. The drum goes quiet.' },
                            { s: 'syllo', t: 'The Fair went quiet, recruit. Granny\'s chair is empty. And you left.' },
                            { s: 'syllo', t: 'The Professor hardly shouts now.', when: '!dead:sequins' },
                            { s: 'syllo', t: 'The Professor is gone.', when: 'dead:sequins' },
                            { s: 'syllo', t: 'They were the only ones who ever listened. I thought, if they marched, you\'d follow.' },
                        ]), wrong: [
                            { s: 'syllo', t: 'No! That\'s a different trick. I\'d salute you for trying. I won\'t.' },
                        ] },
                        { q: 'Give him a reason to stay. A true one.', options: [
                            { t: 'We\'d miss you. I would. That isn\'t a trick. It\'s just true.', ok: true, say: [
                                { s: 'syllo', t: 'Miss me? …Nobody has ever missed me. I\'ve never been away.' },
                            ] },
                            { t: 'Everyone wants you to stay.', say: [
                                { s: 'syllo', t: '"Everyone." I know that one, recruit. I painted it.' },
                            ] },
                            { t: 'Stay, or you\'re a deserter.', say: [
                                { s: 'syllo', t: 'Two choices again. I taught you that. I\'m not proud.' },
                            ] },
                        ] },
                    ],
                },
            ],
        },
        outcome: {
            1: [
                { note: 'The drum stops. The whole crowd blinks. The glow goes out of every eye.' },
                { note: 'One by one, the recruits wander back to their stalls. Somebody buys a toffee apple.' },
                { s: 'syllo', t: 'At ease, recruits. Real ones. …Tuesdays, I\'m opening a fallacy range. Bring friends.' },
                { s: 'syllo', t: 'And take this. My lucky cork. Bad luck bounces off it.' },
                { give: { ward: 1 } },
                { s: 'syllo', t: 'The wooden ones still want a war. I\'ll find them a useful one.', when: 'soldiers' },
            ],
            2: [
                { note: 'The drum stops. The glow fades, slowly. Everyone stays.' },
                { s: 'syllo', t: 'Fine. Stay. Nobody marches. I\'ll be in my Gallery. Sulking. At attention.' },
                { note: 'For the rest of the day, his practice matches are very, very loud.' },
                { s: 'syllo', t: 'The wooden ones still want a war. I\'ll find them a useful one.', when: 'soldiers' },
            ],
            3: [
                { note: 'Half the recruits march off down the Road, still glowing.' },
                { note: 'An hour later they march back, shouting. Nobody remembers why they left.' },
                { s: 'syllo', t: 'They came BACK! …They\'re louder now. Is that good?' },
            ],
            4: [
                { note: 'The drum roll ends. The recruits march off down the Road, eyes glowing, in perfect step.' },
                { s: 'syllo', t: 'Wait! Recruits! You forgot your sergeant!' },
                { note: 'He grabs the drum and runs after them. The Gallery door swings shut behind him.' },
                { note: 'A sign on the door: GONE AFTER MY RECRUITS. —S' },
                { flag: 'syllo-away' },
            ],
        },
        ripples: [{
            flag: 'soldiers', tiers: [1, 2], boss: 'k-core', drain: 1,
            late: [
                { note: 'The eleven wooden soldiers stand guard at the Gallery door now. Freshly painted. Still not blinking.' },
                { s: 'syllo', t: 'Honour guard, recruit. They don\'t march anywhere. I checked.' },
            ],
        }],
        last: [
            { s: 'syllo', t: 'Fine. I\'ll shout at targets. Targets never leave.', when: TIER(7, 1, 2) },
            { s: 'syllo', t: 'Half came back. I\'ll take half. Half is more than wood.', when: TIER(7, 3) },
            { note: 'Far down the Road, a drum. Getting smaller.', when: TIER(7, 4) },
        ],
    };

    // ================================================================ 8. The Headline Debate
    // Four rounds: the editor's claim (strawman: present the article or the old headline), the poodle's
    // crowd (popularity), the editor's whisper (attacking the person), the poodle's denial (present the twist).
    const STRAW = 'Strawman: it twists what someone said, so it is easier to attack.';
    const CROWD = 'Popularity: lots of people believe it, so it must be true.';
    const PERSON = 'Attacking the person: it mocks the speaker, not the claim.';
    const NAME8 = ok => [
        { t: STRAW, ok: ok === 'straw' },
        { t: CROWD, ok: ok === 'crowd' },
        { t: PERSON, ok: ok === 'person' },
    ];
    // Pip keeps the record at the Newsstand; if Pip was lost in Ch4, Sir David asks instead.
    const PIP = '!dead:pip';
    const NO_PIP = 'dead:pip';
    SS['headline-debate'] = {
        n: 8,
        title: 'The Headline Debate',
        lesson: 3,
        station: 't-newsstand',
        teaser: 'A poodle and a puffin are about to debate a headline. The crowd\'s eyes are glowing.',
        aside: { s: 'narrator', t: 'A poodle is shouting at a newspaper. The newspaper is winning.' },
        clock: {
            label: 'The crowd\'s glow', size: 6, progress: 4,
            warn: [
                [{ note: 'Phones go up. The crowd\'s eyes go a little brighter.' }],
                [{ s: 'tremendoodle', t: 'Film my good side! Both sides! All my sides are good!' }],
                [{ note: 'Someone starts a chant. DIS-AS-TER. DIS-AS-TER.' }],
                [{ s: 'attenbirdough', t: 'The herd is restless. In nature, this ends with stamping.' }],
                [{ s: 'tremendoodle', t: 'LOUDER! Angrier! Anger is free! Tremendous value!' }],
            ],
        },
        start: [
            { note: 'On the Newsstand steps, today\'s front page: TREMENDOODLE SAYS SPEECHES ARE A DISASTER.' },
            { s: 'tremendoodle', t: 'A DISASTER, they say I said! Fake! Very unfair! Tremendously unfair!' },
            { s: 'attenbirdough', t: 'Here we see the poodle in its natural habitat. Outraged.' },
            { s: 'pip', t: 'You\'re the referee. Press a claim. Any claim. Please.', when: PIP },
            { s: 'attenbirdough', t: 'Pip kept the record here. Somebody must referee. …You, please.', when: NO_PIP },
        ],
        clues: {
            spots: [
                { id: 'seller', kind: 'person', label: 'Kardashiant, selling papers', x: 26, y: 60, art: 'creature/kardashiant/idle',
                  steps: [
                      { s: 'kardashiant', t: 'I sell papers now. I still don\'t read them.' },
                      { s: 'kardashiant', t: 'That headline came in this morning. Handwritten. On golden paper.' },
                      { s: 'kardashiant', t: 'I took a selfie with it. The gold matches my filter.' },
                  ],
                  card: 'The headline came in this morning, handwritten, on golden paper.' },
                { id: 'headline', kind: 'object', label: 'The front page, pinned to the stand', x: 56, y: 42, art: 'prop/taped-headline',
                  steps: [
                      { note: 'The headline is stuck on with tape. It\'s written in gold ink.' },
                      { note: 'Under one edge, the old headline peeks out: POODLE GIVES LONG SPEECH.' },
                  ],
                  card: 'The headline is taped on, in gold ink. Under it, the paper\'s own: POODLE GIVES LONG SPEECH.' },
                { id: 'article', kind: 'record', label: 'The article, on page nine', x: 80, y: 62, art: 'prop/news-article',
                  steps: [
                      { note: 'Page nine. The whole article: "Tremendoodle\'s speech was long. Very long. Two pigeons fell asleep."' },
                      { s: 'attenbirdough', t: 'Our finest reporter. She timed it with a calendar.' },
                  ],
                  card: 'The article says only: "Tremendoodle\'s speech was long." No "disaster" anywhere.' },
            ],
        },
        twist: {
            id: 'golden',
            steps: [
                { note: 'Tremendoodle waves his arms. A sheet of golden paper drops out of his quiff.' },
                { note: 'Three drafts in gold ink. SPEECHES ARE A CATASTROPHE, crossed out. SPEECHES ARE A DISASTER, with a big tick.' },
                { s: 'tremendoodle', t: 'Not mine. Never seen it. Beautiful handwriting, though. The best.' },
                { note: 'He tucks it back into his quiff. The crowd is filming his face. Only you saw.' },
                { inner: {
                    owlet: 'Spell it out: paper says "long". Headline says "disaster". QED.',
                    mothkin: 'Look. Golden paper. Who owns golden paper?',
                    fox: 'Picture him writing it. Tongue out. Concentrating.',
                    frogling: '"I guess." The paper cut a quote once before. I remember.',
                    raven: '"Says." He never said it. The headline did.',
                } },
                { choice: [
                    { t: 'Where do I start?', then: [
                        { s: 'pip', t: 'Anywhere! Press a claim till it squeaks.', when: PIP },
                        { s: 'attenbirdough', t: 'Start where it is loudest, I find.', when: NO_PIP },
                    ] },
                    { t: 'The paper said "long". The headline says "disaster". Not the same claim.', only: 'owlet', voice: true, then: [
                        { clock: 'side', progress: 1 },
                        { s: 'attenbirdough', t: 'Long is not disaster. I shall write that down. Slowly.' },
                    ] },
                ] },
            ],
            card: 'Tremendoodle wrote the headline himself, on his own golden paper.',
        },
        resolve: {
            verb: 'object',
            intro: [
                { s: 'attenbirdough', t: 'And so the debate begins. Observe. Quietly.' },
            ],
            rounds: [
                {
                    line: [{ s: 'attenbirdough', t: 'Our headline simply sums up the article. In fewer words.' }],
                    press: [{ s: 'attenbirdough', t: 'I never read the headlines myself. I find them loud.' }],
                    q: 'Show him what the paper really said.',
                    present: ['article', 'headline'],
                    wrong: [{ s: 'attenbirdough', t: 'Fascinating. But what did the paper actually say?' }],
                    name: { q: 'What did the headline do to his words?', options: NAME8('straw'), wrong: [
                        { s: 'attenbirdough', t: 'Not quite. Look at what he said, and what we printed.' },
                    ] },
                    right: [
                        { note: 'A few phones go down. A few eyes stop glowing.' },
                    ],
                },
                {
                    line: [{ s: 'tremendoodle', t: 'Look at this crowd! Thousands! All angry! So I must be right!' }],
                    press: [{ s: 'tremendoodle', t: 'Some are angry at me. Doesn\'t matter. Angry is angry. Tremendous.' }],
                    q: 'Your reply?',
                    options: [
                        { t: 'An angry crowd isn\'t evidence. Show me where it says "disaster".', ok: true },
                        { t: 'Your crowd is small. Mine is bigger.', say: [
                            { s: 'tremendoodle', t: 'Mine is TREMENDOUS! …Wait. Now we\'re both counting.' },
                        ] },
                        { t: 'You\'re a poodle. Poodles exaggerate.', say: [
                            { s: 'tremendoodle', t: 'Fake! Very unfair to poodles! Millions of poodles agree!' },
                        ] },
                    ],
                    name: { q: 'Name his bad reason.', options: NAME8('crowd'), wrong: [
                        { s: 'tremendoodle', t: 'Wrong! I said thousands! Count them!' },
                    ] },
                    right: [
                        { note: 'The chant stumbles. Half the crowd stops to check their phones.' },
                    ],
                },
                {
                    line: [{ s: 'attenbirdough', t: 'Here we see the poodle. Its quiff is enormous. Its claims, therefore, are hot air.' }],
                    press: [{ s: 'attenbirdough', t: 'The quiff is relevant. Probably. It is very large.' }],
                    q: 'Your reply?',
                    options: [
                        { t: 'His quiff isn\'t the question. What did he actually say?', ok: true },
                        { t: 'Everyone thinks that quiff is silly.', say: [
                            { s: 'tremendoodle', t: 'Everyone LOVES the quiff! The quiff has fans!' },
                        ] },
                        { t: 'Either we trust the quiff, or we ban it.', say: [
                            { s: 'attenbirdough', t: 'Ban the quiff? It would take a team of twelve.' },
                        ] },
                    ],
                    name: { q: 'Name the puffin\'s bad reason.', options: NAME8('person'), wrong: [
                        { s: 'attenbirdough', t: 'Hm. Read my remark again. What was it really about?' },
                    ] },
                    right: [
                        { s: 'attenbirdough', t: 'The puffin withdraws his remark. Into a nearby fern.' },
                    ],
                },
                {
                    line: [{ s: 'tremendoodle', t: 'I never wrote it! I don\'t even HAVE paper! Golden or otherwise!' }],
                    press: [{ s: 'tremendoodle', t: 'Okay, a little paper. For autographs. And headl— autographs.' }],
                    wrong: [{ s: 'tremendoodle', t: 'That proves NOTHING. Very sad card.' }],
                    asks: [
                        { q: 'Show the crowd what fell out of his quiff.', present: 'golden' },
                        { q: 'So why write a headline against himself?', options: [
                            { t: 'Outrage gets attention. He wanted a fight he could win.', ok: true, say: [
                                { s: 'tremendoodle', t: '…It\'s a front page. Front pages are tremendous.' },
                            ] },
                            { t: 'He really thinks speeches are a disaster.', say: [
                                { s: 'tremendoodle', t: 'Never! I love speeches! Mine, mostly.' },
                            ] },
                            { t: 'He wanted a fair debate.', say: [
                                { s: 'attenbirdough', t: 'Fair? Look at him. He\'s grinning.' },
                            ] },
                        ] },
                    ],
                },
            ],
        },
        outcome: {
            1: [
                { note: 'The crowd lowers its phones. The glow fades from every eye.' },
                { s: 'tremendoodle', t: '"Long"? They said my speech was "long"? …That\'s fair, actually.' },
                { s: 'attenbirdough', t: 'Tomorrow, a correction. And from now on, every quote in full.' },
                { s: 'attenbirdough', t: 'Starting with the big one. The Sundial\'s. All of it, cloudy days included.', when: 'fair-quote' },
                { s: 'tremendoodle', t: 'You! Referee! I\'m calling you "Tremendous Referee". My best nickname. Don\'t tell the others.' },
            ],
            2: [
                { note: 'The crowd calms down. Slowly. The poodle still gets his front page.' },
                { s: 'tremendoodle', t: 'POODLE IN HEADLINE ROW! That\'s me! I\'m the row!' },
                { s: 'attenbirdough', t: 'A correction tomorrow. Every quote in full, from now on. Small print, sadly.' },
                { s: 'attenbirdough', t: 'Starting with the Sundial\'s. All of it, cloudy days included.', when: 'fair-quote' },
            ],
            3: [
                { note: 'The crowd boos. Everyone. The poodle, the puffin, the paper, you.' },
                { note: 'Somebody boos a pigeon. The Newsstand pulls its shutters down.' },
                { closed: 't-newsstand', note: 'The Newsstand is shut today. A sign: BACK WHEN THE BOOING STOPS.' },
            ],
            4: [
                { note: 'The crowd\'s eyes glow gold. They march off, chanting the headline.' },
                { note: 'DIS-AS-TER. DIS-AS-TER. All over Tomorrowton. All day.' },
                { s: 'tremendoodle', t: 'Tremendous ratings. Terrible. But tremendous.' },
            ],
        },
        ripples: [{
            flag: 'fair-quote', tiers: [1, 2], boss: 't-tribunal', drain: 1,
            late: [
                { s: 'attenbirdough', t: 'I\'ve framed the first full quote. It will hang in the Café.', when: '!dead:sundial' },
                { note: 'The frame reads: "I tell the time. Mostly. On cloudy days I guess."', when: '!dead:sundial' },
                { note: 'Sir David frames the Sundial\'s whole quote. He hangs it in the Café, under the skylight.', when: 'dead:sundial' },
                { note: '"I tell the time. Mostly. On cloudy days I guess."', when: 'dead:sundial' },
            ],
        }],
        last: [
            { s: 'attenbirdough', t: 'The poodle agrees with a fact. Extraordinary. We may never see this again.',
              when: { all: [TIER(8, 1, 2), '!dead:sundial'] } },
            { s: 'attenbirdough', t: 'Every word, in full, from now on. Somebody should have started sooner.',
              when: { all: [TIER(8, 1, 2), 'dead:sundial'] } },
            { s: 'attenbirdough', t: 'The herd has booed itself hoarse. Tomorrow it will need a new headline.', when: TIER(8, 3) },
            { note: 'Somewhere in Tomorrowton, a poodle is writing tomorrow\'s headline. In gold.', when: TIER(8, 4) },
        ],
    };
})(typeof window !== 'undefined' ? window : globalThis);
