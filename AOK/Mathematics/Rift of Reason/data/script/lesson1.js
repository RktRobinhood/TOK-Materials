/*
 * Script for lesson 1: the Prologue (the Fair) and Chapter 1 (the Road).
 * Story: design/STORY.md Part I §2–3 and its appendices. Step format: design/SCRIPT-FORMAT.md.
 *
 * Keys the engine plays by itself: a node's `script` (first visit; every visit to story, rest and
 * battle nodes), `<script>.win`, `<script>.stage<k>` (boss stages), a node's `intro` / `reminder`,
 * `recap.ch1` (first time-rift jump into Ch1) and `quiet.sequins` (the Quiet Scene, at the next
 * chapter opening after his death). Sub-scenes below are played with { play: key }.
 *
 * Roles that can die here: `sequins` (the Gate, clock `ch1`). His understudy (Tally) only ever
 * speaks behind dead:sequins AND arrived:sequins, at the Pattern Stall (UNDERSTUDIES.md off-stage rule).
 */
(function (root) {
    'use strict';
    const Rift = root.Rift;
    const S = Rift.data.script || (Rift.data.script = {});
    const C = Rift.data.clocks || (Rift.data.clocks = {});

    Rift.data.speakers = Object.assign(Rift.data.speakers || {}, {
        narrator: { name: 'The Sundial', art: 'npc/sundial' },
        granny: { name: 'Granny Axiom', art: 'npc/granny-axiom' },
        sequins: { name: 'Professor Sequins', art: 'npc/professor-sequins' },
        mirage: { name: 'Madame Mirage', art: 'npc/madame-mirage' },
        syllo: { name: 'Sergeant Syllo', art: 'npc/sergeant-syllo' },
        algorithm: { name: 'The Algorithm', art: 'npc/algorithm' },
        corvina: { name: 'Corvina the Card Sharp', art: 'npc/corvina' },
        nudge: { name: 'Nudge', art: 'npc/nudge' },
        'guess-o-matic': { name: 'The Guess-o-Matic', art: 'ui/guess-o-matic' },
        signpost: { name: 'The Talking Signpost', art: 'npc/signpost' },
        // A creature who hosts a station needs a speaker entry (Troll Bridge).
        muskrat: { name: 'Muskrat Rocket', art: 'creature/muskrat/smug' },
    });

    // ---------------------------------------------------------------- shared lines

    // Ch1's blind spots (STORY.md §3, inner voice). Owlet and Fox are planted "that evening";
    // a Ch1 jump-in hears them at the Forest Road instead, so every reveal has its set-up.
    const BLIND_OWLET_FOX = {
        owlet: 'Cracks lead to their makers. This one runs down the Road. I\'d bet my feathers.',
        fox: 'Picture it. The Algorithm on a throne of screens. End of the Road. Epic.',
    };
    // The reveals: at the Gate win, or at Granny's open door if you went back first.
    const REVEAL = { inner: {
        owlet: 'Valid. Every step. The first step was the Algorithm\'s. …I\'d like my feathers back.',
        mothkin: 'Little lanterns. Big sack. I only saw the lanterns.',
        fox: 'Nobody was on the throne. Nobody was even at the end. That was the trick.',
        frogling: 'Every Tuesday, salesmen. This Tuesday, imps.',
        raven: '"Never." Biggest little word there is.',
    } };
    // Tally arrives at the first Pattern Stall visit after Sequins' Quiet Scene (STORY.md App. D).
    const TALLY_ARRIVES = { all: ['dead:sequins', { flag: 'quiet:sequins', is: 'done' }, '!arrived:sequins'] };
    const TALLY_ARRIVAL = { when: TALLY_ARRIVES, then: [
        { arrive: 'sequins' },
        { s: 'sequins', t: '', u: 'He did the shouting. I did the counting.' },
    ] };
    // Granny's open door: from the Well win, or for a later-chapter jump-in, until the finale.
    const DOOR_OPEN = { all: ['!finale-open', { any: [{ seen: 'ch1.well.win' }, 'entered:ch2', 'entered:ch3', 'entered:ch4'] }] };
    // Visiting the door before the Gate is won sets turnedBack (never for a later-chapter jump-in).
    const TURNING_BACK = { all: [{ not: { seen: 'ch1.gate.win' } }, '!entered:ch2', '!entered:ch3', '!entered:ch4'] };
    // Sequins can still be comforted or pushed: alive, and the crack has not finished drinking.
    const CAGE_OPEN = { all: ['!dead:sequins', { clock: 'ch1', lte: 5 }] };

    // ---------------------------------------------------------------- Prologue

    // The cold open, on black before the title. The engine may play it at a new game;
    // prologue.wake plays it once as well, in case it has not been seen.
    S['prologue.cold'] = [
        { s: 'algorithm', t: 'NOISE DETECTED. THE FAIR, 9:02. SUBJECT: {name}.' },
        { s: 'algorithm', t: 'PREDICTABILITY: 51%. UNACCEPTABLE.' },
    ];

    S['prologue.wake'] = [
        { when: 'rift-walker', then: [
            { s: 'narrator', t: 'Back again, Rift-Walker? The Fair has prizes. And questions.' },
        ], else: [
            { play: 'prologue.cold', once: true },
            { s: 'narrator', t: 'Tick. Tock. Ah, you\'re awake. Good morning, {name}.' },
            { s: 'narrator', t: 'I\'m the Sundial. I tell the time. Mostly. On cloudy days I guess.' },
            { s: 'narrator', t: 'My shadow points at now. That\'s my whole job.' },
            { s: 'avatar', e: 'surprised', t: 'A talking sundial. Outside my door. Normal.' },
            { s: 'granny', e: 'happy', t: '{name}! It\'s Fair day! Wear something with pockets. Pockets win prizes.' },
            { s: 'granny', t: 'There is a hair on the sky. I will dust it later.' },
            { s: 'granny', t: 'Off to the Fair Gate, dear. Follow the music. And the smell of nuts.' },
        ] },
    ];

    // The Fair Gate: the boast (first visit). Later visits: Granny's open door, or a short bark.
    S['prologue.fair'] = [
        { when: { seen: 'prologue.fair' }, then: [{ play: 'prologue.fair.again' }], else: [
            { s: 'granny', e: 'happy', t: '{name}! Sit. Ninety years of cards. I have lost twice. Both times to myself.' },
            { s: 'sequins', e: 'happy', t: 'Make way! The Thinking Trophy! For the thinker who is always right!' },
            { s: 'sequins', t: 'It\'s at my stall, being polished. By me! Personally! Twice!' },
            { s: 'syllo', t: 'And a practice match here first, recruit! Loaned team. No risk. Some shouting.' },
            { s: 'avatar', e: 'happy', t: 'I\'ll win it. I always know the answer.' },
            { s: 'sequins', e: 'surprised', t: 'Always? How thrilling. How unlikely.' },
            { s: 'speedcheeta', t: 'Chat! This kid said ALWAYS! Clip it! Clip it!' },
            { s: 'algorithm', t: 'QUOTE SAVED.' },
            { s: 'granny', t: 'Two stalls, then the final at the Nut Stall. But first, cards. My treat.' },
        ] },
    ];
    S['prologue.fair.again'] = [
        { when: DOOR_OPEN, then: [
            { when: { seen: 'ch1.door' }, then: [
                { s: 'narrator', t: 'Her door is still open. The tea has gone cold.' },
            ], else: [{ play: 'ch1.door' }] },
        ], else: [
            { when: { seen: 'prologue.evening' }, then: [
                { s: 'granny', t: 'Shoo, dear. The crack won\'t follow itself.' },
            ], else: [
                { s: 'granny', t: 'Two stalls and Syllo\'s match, dear. The trophy won\'t wait.' },
            ] },
        ] },
    ];

    // The Pattern Stall. After Sequins' death the stall has no host until Tally arrives here.
    S['prologue.pattern'] = [
        TALLY_ARRIVAL,
        { when: { seen: 'ch1.well' }, then: [
            // His apprentice is in your pocket now (the Well). Tier 3 keeps his tic until the finale.
            { s: 'sequins', e: 'happy', t: 'My stall! My secret rule! My apprentice is in your pocket, so I\'ll guess.',
                u: 'This is his stall. His rule is still here. I wrote it down.', when: { flag: 'stakes.ch1', not: 3 } },
            { s: 'sequins', t: 'My stall! My secret rule! I am fine. LIKE AND SUBSCRIBE.', when: { flag: 'stakes.ch1', is: 3 } },
        ], else: [
            { s: 'sequins', e: 'happy', t: 'Roll up! My little apprentice guesses the next number! Two, four, six…' },
            { s: 'guess-o-matic', t: 'PROBABLY EIGHT.' },
            { s: 'sequins', t: 'It always says "probably". Adorable. Now YOU find my secret rule.' },
        ] },
    ];
    S['prologue.pattern.win'] = [
        { s: 'sequins', e: 'surprised', t: 'You tested numbers that should FAIL? Delicious! Most people only test what fits.',
            u: 'No shouting today. Just… numbers. Oh. They listened.' },
    ];

    S['prologue.witness'] = [
        { s: 'mirage', e: 'happy', t: 'Ah. I see a crack. In your future. Or in my ball. It\'s an old ball.' },
    ];
    S['prologue.witness.win'] = [
        { s: 'mirage', e: 'happy', t: 'You saw only what was there. So rare. My ball is jealous.' },
    ];

    S['prologue.gallery'] = [
        { s: 'syllo', e: 'angry', t: 'ATTENTION! My lobster band! They play the trumpet! Allegedly!' },
    ];
    S['prologue.gallery.win'] = [
        { s: 'syllo', e: 'happy', t: 'Valid! And still nonsense! My lobsters cannot play the trumpet. I have heard them.' },
    ];

    // The Nut Stall: the theft. Straight after it, "that evening" at Your Home.
    S['prologue.rift'] = [
        { s: 'sequins', e: 'surprised', t: 'The final! The trophy! Still polishing! Back in a—' },
        { s: 'granny', t: 'Oh dear. The hair on the sky. It\'s opening.' },
        { s: 'granny', t: 'It has an eye. Made of little pictures. How rude.' },
        { s: 'nudge', t: 'Got it, boss! Saved to favourites!' },
        { s: 'narrator', t: 'Hey! That was my shadow! I was using it!' },
        { s: 'algorithm', t: 'SHADOW SAVED TO FAVOURITES. THANK YOU FOR YOUR CONTENT.' },
        { s: 'syllo', e: 'angry', t: 'Recruits! The visitors! Their eyes are glowing!' },
        { s: 'siuuugull', t: 'I AM ALWAYS RIGHT! ALWAYS! SIUUU!', possessed: true },
        { s: 'sequins', e: 'angry', t: 'My sequins! They\'re flying up the crack! Down the Road! WAIT FOR ME!' },
        { s: 'algorithm', t: 'PREDICTION: {name} FOLLOWS THE CRACK. CONFIDENCE: 94%.' },
        { play: 'prologue.evening', once: true },
    ];

    // That evening (STORY.md §2 beat 6): Your Home, the Sundial without its shadow, the brave choice.
    S['prologue.evening'] = [
        { s: 'narrator', t: 'It\'s… six. Possibly seven. I\'m guessing.' },
        { s: 'granny', t: 'Someone must follow that crack. Someone who thinks before they shout.' },
        { s: 'granny', t: 'I would go. I would arrive next Tuesday. Of next year.' },
        { inner: BLIND_OWLET_FOX },
        { choice: [
            { t: 'I will go.', flag: 'brave', value: 'go' },
            { t: 'Can I hide under the nut stall first?', flag: 'brave', value: 'hide' },
            { t: 'Where exactly does it start? I\'ll work it out.', only: 'owlet', voice: true, flag: 'brave', value: 'ask' },
            { t: 'Look. It\'s glowing at the end. Which end?', only: 'mothkin', voice: true, flag: 'brave', value: 'ask' },
            { t: 'What if it\'s a door, not a crack?', only: 'fox', voice: true, flag: 'brave', value: 'ask' },
            { t: 'Has the sky done this before?', only: 'frogling', voice: true, flag: 'brave', value: 'ask' },
            { t: '"Follow it." Follow it where, exactly?', only: 'raven', voice: true, flag: 'brave', value: 'ask' },
        ] },
        { s: 'granny', e: 'happy', t: 'That\'s my {name}.', when: { flag: 'brave', is: 'go' } },
        { s: 'granny', e: 'happy', t: 'Honest. Fear is fine. Thinking anyway is braver.', when: { flag: 'brave', is: 'hide' } },
        { s: 'granny', e: 'happy', t: 'Good. Ask the crack, too. It won\'t answer.', when: { flag: 'brave', is: 'ask' } },
        { give: { charm: 3, tonic: 1 } },
        { flag: 'hum-charm' },
        { s: 'granny', t: 'And my Hum Charm. If you need me, hum. I\'ll hum back.' },
        { s: 'narrator', t: 'I\'ll ride in your shadow. Mind you don\'t stand in the dark.' },
        { s: 'avatar', t: 'Back before the trophy final. Obviously.' },
    ];

    // ---------------------------------------------------------------- Chapter 1

    // "Previously…" (first time-rift jump into Ch1). Every flag may be unset.
    S['recap.ch1'] = [
        { s: 'narrator', t: 'Previously. The Fair. A crack opened in the sky.' },
        { s: 'narrator', t: 'You told everyone you\'d win the Thinking Trophy. Because you\'re always right. Something heard.' },
        { s: 'narrator', t: 'It was the Algorithm. It reached through and stole my shadow.' },
        { s: 'narrator', t: 'It took the visitors, too. Their eyes glow now. They shout.' },
        { s: 'narrator', t: 'You said you\'d go. So you went. Down the Road, after the crack.', when: { flag: 'brave', is: 'go' } },
        { s: 'narrator', t: 'You wanted to hide under the nut stall. You came down the Road anyway.', when: { flag: 'brave', is: 'hide' } },
        { s: 'narrator', t: 'You asked where the crack starts. So we followed it down the Road.', when: { flag: 'brave', is: 'ask' } },
        { s: 'narrator', t: 'You followed the crack down the Road.', when: { flag: 'brave', unset: true } },
        { s: 'narrator', t: 'I ride in your shadow. Mind the dark.' },
        { s: 'narrator', t: 'You\'ve walked this Road before. This time, it\'s a memory.', when: { seen: 'ch1.gate.win' } },
        { s: 'narrator', t: 'The Professor isn\'t on this Road any more. His lantern is out.', when: 'dead:sequins' },
    ];

    // Clue 2 and the Moth-kin blind spot: at the Signpost, or at the Forest Road for a jump-in.
    S['ch1.gossip'] = [
        { s: 'signpost', t: 'Funny. The crack points down the Road. But imps flew back to the Fair.' },
        { s: 'signpost', t: 'Carrying an empty sack. And little lanterns. Odd.' },
        { inner: { mothkin: 'Ooh. Little imps with little lanterns. Lanterns mean friendly. Delivering something nice.' } },
    ];

    S['ch1.signpost'] = [
        { s: 'signpost', t: 'Psst. An owl folded in paper haunts the Standing Stone. Shy. Wins bring it out.' },
        { s: 'signpost', t: 'And something old with a ruler visits the Gate after a win. Very straight lines.' },
        { flag: 'rumour:godelix', value: true },
        { flag: 'rumour:euclidon', value: true },
        { play: 'ch1.gossip', once: true },
    ];

    // The Forest Road (host: the Sundial). Possessed caricatures argue; the puzzle settles it.
    S['ch1.road'] = [
        { s: 'narrator', t: 'The Road. The crack runs right down the middle. Like a trail of crumbs.' },
        { play: 'ch1.gossip', once: true },
        { inner: BLIND_OWLET_FOX, when: { not: { seen: 'prologue.evening' } } },
        { s: 'lobstorian', t: 'THE CRACK GOES LEFT. STAND UP STRAIGHT AND GO LEFT.', possessed: true },
        { s: 'tremendoodle', t: 'WRONG. IT GOES RIGHT. THE BEST RIGHT. EVERYONE SAYS SO.', possessed: true },
    ];
    S['ch1.road.win'] = [
        { s: 'lobstorian', t: 'Was I shouting? Sorry. I should go and tidy my room.' },
        { s: 'granny', hum: true, t: '{name}? It\'s Granny. Are you eating? Eat a nut. Hum you later.' },
    ];

    // The Troll Bridge (host: Muskrat). The best comic scene in Ch1: keep it.
    S['ch1.bridge'] = [
        { s: 'muskrat', t: 'Toll bridge! Toll is one perfect drawing. This bridge reaches Mars. Next year.' },
        { s: 'avatar', t: 'It\'s a very small bridge.' },
    ];
    S['ch1.bridge.win'] = [
        { s: 'muskrat', t: 'The rules decide what\'s possible? That\'s… actually useful. Don\'t tell anyone.' },
    ];

    // The Wishing Well (required). Sequins fishes; you get the Guess-o-Matic; Hum 2.
    S['ch1.well'] = [
        { s: 'sequins', e: 'happy', t: '{name}! One of my sequences fell in. A prime one. Mostly.' },
        { s: 'sequins', t: 'I\'m fishing with a sock. Hold my apprentice. I need both wings.' },
        { flag: 'guess-o-matic' },
        { s: 'guess-o-matic', t: 'PROBABLY… A SOCK.' },
        { s: 'avatar', t: 'It guessed "sock". Correct. I\'ll allow it.', only: 'owlet' },
        { s: 'avatar', t: 'It\'s warm. And it ticks. Like a tiny heart.', only: 'mothkin' },
        { s: 'avatar', t: 'A fortune-teller in a box. I love it already.', only: 'fox' },
        { s: 'avatar', t: 'My uncle had one of these. It guessed wrong. Every time.', only: 'frogling' },
        { s: 'avatar', t: 'One word. A very small vocabulary.', only: 'raven' },
    ];
    S['ch1.well.win'] = [
        { s: 'sequins', t: 'It\'s honest, you see. It always says "probably". Mind it, if anything happens.' },
        { s: 'sequins', e: 'surprised', t: 'Wait. Is that my favourite sequence? Glinting down the Road? COME BACK!' },
        { s: 'granny', hum: true, t: 'Salesmen at my door, dear. Very small ones. Selling soup pots.' },
        { s: 'granny', hum: true, t: 'I\'ll buy one. A pot never hurt anybody. Hum you later, dear.' },
        { inner: {
            frogling: 'Salesmen. Tuesdays it\'s always salesmen. Every Tuesday for years.',
            raven: '"A pot never hurt anybody." Grannies know pots.',
        } },
    ];

    // The first night: the first arrival at the Campfire or the Card Sharp's Table.
    S['ch1.night'] = [
        { when: 'turnedBack', then: [
            // You saw her open door first. You know.
            { s: 'narrator', t: 'I always stop at sunset. Is night always this big?' },
            { s: 'narrator', t: 'You hum into the charm.' },
            { s: 'narrator', t: 'Nothing hums back. You know why.' },
        ], else: [
            { s: 'narrator', t: 'I always stop at sunset. Is night always this big?' },
            { s: 'narrator', t: 'You hum into the charm. We wait. Nothing hums back.' },
            { s: 'avatar', t: 'She\'s asleep. Obviously.' },
            { s: 'narrator', t: 'She always hums back. …Probably asleep. Probably.' },
            { choice: [
                { t: 'Go back to the Fair. Now.', then: [
                    { s: 'narrator', t: 'Back down the Road, then. To the Fair Gate. Quickly.' },
                ] },
                { t: 'Keep going. She\'ll hum in the morning.', then: [
                    { s: 'narrator', t: 'On we go. I\'ll listen for her. All night.' },
                ] },
            ] },
        ] },
    ];

    // Granny's open door (the Fair Gate, from the Well win). Optional; it can turn you back.
    S['ch1.door'] = [
        { s: 'narrator', t: 'Granny\'s door is open. Her tea is still warm. Her shawl is gone.' },
        { s: 'syllo', t: 'Her tea\'s still warm, recruit. I checked it twice.' },
        { s: 'narrator', t: 'Tiny soup pots. A trail of them. Up into the crack.' },
        { s: 'narrator', t: 'And a feather. Long, grey and dusty. As if from a sack.' },
        { when: TURNING_BACK, then: [
            { flag: 'turnedBack' },
            { clock: 'ch1', tick: 1, silent: true, when: { clock: 'ch1', lte: 4 } },   // only if the Gate clock is already running
            REVEAL,
        ] },
        { s: 'narrator', t: 'The crack is too high. We can\'t follow. Not from here.' },
    ];

    // The Campfire: no eye above it. The first night, or the brave callback on a later visit.
    S['ch1.campfire'] = [
        { when: { seen: 'ch1.night' }, then: [{ play: 'ch1.campfire.brave', once: true }] },
        { play: 'ch1.night', once: true },
    ];
    S['ch1.campfire.brave'] = [
        { s: 'narrator', t: 'No crack up there. Just stars. Nobody watching.' },
        { s: 'narrator', t: 'You said "I will go." And here you are. Granny would be smug.', when: { flag: 'brave', is: 'go' } },
        { s: 'narrator', t: 'You wanted to hide under the nut stall. Yet here you are, deep in the forest.', when: { flag: 'brave', is: 'hide' } },
        { s: 'narrator', t: 'You asked where it starts. You\'re still asking. Good. Keep doing that.', when: { flag: 'brave', is: 'ask' } },
        { s: 'narrator', t: 'You came down the Road. That\'s the brave part done.', when: { flag: 'brave', unset: true } },
    ];

    // The Card Sharp's Table (a side road).
    S['ch1.cardsharp'] = [
        { play: 'ch1.night', once: true },
        { when: { seen: 'ch1.cardsharp' }, then: [
            { s: 'corvina', t: 'Back again? The axioms missed you. I didn\'t.' },
        ], else: [
            { s: 'corvina', t: 'Fancy a game, little traveller? Your creatures against mine.' },
            { s: 'corvina', t: 'Change the axioms and the same cards play a different game. Funny, eh?' },
        ] },
    ];
    S['ch1.cardsharp.win'] = [
        { s: 'corvina', t: 'Hmph. Not bad, owlet. Take your prize before I change the rules.', only: 'owlet' },
        { s: 'corvina', t: 'Hmph. Not bad, grub. Take your prize before I change the rules.', only: 'mothkin' },
        { s: 'corvina', t: 'Hmph. Not bad, cub. Take your prize before I change the rules.', only: 'fox' },
        { s: 'corvina', t: 'Hmph. Not bad, tadpole. Take your prize before I change the rules.', only: 'frogling' },
        { s: 'corvina', t: 'Hmph. Not bad, chick. Take your prize before I change the rules.', only: 'raven' },
    ];

    // The Standing Stone (host: the Sundial). Sequins' circle sequence; the sixth number sets `moser`.
    S['ch1.stone'] = [
        { s: 'narrator', t: 'Professor Sequins carved this. His circle sequence: one, two, four, eight, sixteen.' },
    ];
    S['ch1.stone.win'] = [
        { s: 'narrator', t: 'Dots on a circle, all joined up. Count the pieces. One, two, four, eight, sixteen…' },
        { s: 'narrator', t: '…thirty-one. Not thirty-two. His pattern breaks. He\'ll be thrilled.', when: '!dead:sequins' },
        { s: 'narrator', t: '…thirty-one. Not thirty-two. His pattern breaks. He\'d have been thrilled.', when: 'dead:sequins' },
        { flag: 'moser' },
    ];

    // ---- The Gate of Guards: the trap (boss; Sequins hosts from the cage; clock `ch1`) ----

    C.ch1 = {
        label: 'The crack is drinking',
        size: 6,
        node: 'gate',
        peril: 'sequins',
        progress: 4,
        art: 'ui/stakes-ch1',
        // warn[k-1] plays when notch k fills (notch 6 plays `full` or `brink` instead).
        warn: [
            { s: 'sequins', t: 'I feel… trendier.' },
            { s: 'sequins', t: 'My left wing has a hundred followers. Make it stop.' },
            { s: 'sequins', t: 'Please like and— NO.' },
            { s: 'sequins', t: 'Half of me is bald! Don\'t film that half!' },
            { s: 'sequins', t: 'I can\'t feel my sparkle. {name}… hurry.' },
        ],
        // Armed tier 4 (STORY.md App. D): his last line is wonder, not fear.
        full: [
            { s: 'narrator', t: 'The crack drinks the last sequin. Then it reaches for him.' },
            { s: 'sequins', t: 'Oh. It\'s… shiny in there.' },
            { s: 'narrator', t: 'And the cage is empty.' },
            { s: 'guess-o-matic', t: 'PROBABLY… KEEP GOING.' },
        ],
        // Tier 4 when no one can die: the brink, then tier 3.
        brink: [
            { s: 'narrator', t: 'The crack drinks the last sequin. Then it hiccups.' },
            { s: 'narrator', t: 'The cage drops back, with him in it. Dull as a stone.' },
        ],
    };

    S['ch1.gate'] = [
        { when: 'turnedBack', then: [{ clock: 'ch1', start: 1 }], else: [{ clock: 'ch1', start: 0 }] },
        { s: 'narrator', t: 'The crack ends here, drinking his sparkle. That imp holds a piece of my shadow.' },
        { s: 'sequins', e: 'surprised', t: '{name}! Down here! In a birdcage! Why does my cage have a cushion?' },
        { s: 'sequins', t: 'You went home first? I waited. I shed a little.', when: 'turnedBack' },
        { s: 'nudge', t: 'Engagement! Wave for the people, bird! Look at my numbers go!' },
        { s: 'algorithm', t: 'PROFESSOR. YOU TAUGHT ME MY FIRST NUMBER.' },
        { s: 'sequins', e: 'angry', t: 'I\'ve never met you. I\'d remember. I remember every number.' },
    ];
    S['ch1.gate.stage2'] = [{ play: 'ch1.gate.comfort', once: true }];
    S['ch1.gate.comfort'] = [
        { when: CAGE_OPEN, then: [
            { s: 'sequins', t: 'Half my sparkle is up that crack. Say something nice. Quickly.' },
            { choice: [
                { t: 'Hold still. I always know the answer.', then: [
                    { s: 'sequins', t: 'Always. Yes. You said. Hurry anyway.' },
                ] },
                { t: 'Stay calm. Calm birds shine longer. That\'s a fact. I checked.', only: 'owlet', then: [
                    { clock: 'ch1', drain: 1 },
                    { s: 'sequins', t: 'You checked? …Then I\'m calm. Scientifically.' },
                ] },
                { t: 'You\'re still the brightest thing here. I\'d know.', only: 'mothkin', then: [
                    { clock: 'ch1', drain: 1 },
                    { s: 'sequins', t: 'You would know. You\'re a moth. Thank you.' },
                ] },
                { t: 'Picture your stall when you\'re home. Brighter than ever.', only: 'fox', then: [
                    { clock: 'ch1', drain: 1 },
                    { s: 'sequins', t: 'Brighter. With a new sign. Yes. Keep talking.' },
                ] },
                { t: 'You always found your sequences again. Every time.', only: 'frogling', then: [
                    { clock: 'ch1', drain: 1 },
                    { s: 'sequins', t: 'I did, didn\'t I? Every single time.' },
                ] },
                { t: 'You\'re not "trending". You\'re stuck. Different word.', only: 'raven', then: [
                    { clock: 'ch1', drain: 1 },
                    { s: 'sequins', t: 'Stuck. Yes. Stuck can be fixed. Trending is forever.' },
                ] },
            ] },
            { when: 'moser', then: [
                { s: 'avatar', t: 'Professor, your circle sequence goes thirty-one.' },
                { clock: 'ch1', drain: 1 },
                { s: 'sequins', e: 'happy', t: 'Thirty-one? It BREAKS? Oh, that\'s gorgeous. I\'ve stopped panicking.' },
            ] },
        ] },
    ];
    // The push (STORY.md App. C): before stage 3; the warning that follows is the tick's.
    S['ch1.gate.stage3'] = [{ play: 'ch1.gate.push', once: true }];
    S['ch1.gate.push'] = [
        { when: CAGE_OPEN, then: [
            { s: 'algorithm', t: 'FASTER. THE MAGPIE IS TRENDING.' },
            { clock: 'ch1', tick: 1 },
        ] },
    ];

    // The plan (Gate win): the tier, how Nudge leaves, the crackle, the Algorithm, one voice, one question.
    S['ch1.gate.win'] = [
        { clock: 'ch1', resolve: true },
        { when: 'dead:sequins', then: [
            { s: 'narrator', t: 'The cushion is still warm. We finished it. For him.' },
        ], else: [
            { when: { flag: 'stakes.ch1', is: 1 }, then: [
                { s: 'sequins', e: 'happy', t: 'Take my Lucky Sequin. Keep the apprentice for now. You\'re better company.' },
                { give: { lure: 1 } },
            ] },
            { when: { flag: 'stakes.ch1', is: 2 }, then: [
                { s: 'sequins', t: 'I am forty per cent less shiny. Here. A Lucky Sequin. I\'m going home.' },
                { give: { lure: 1 } },
            ] },
            { when: { flag: 'stakes.ch1', gte: 3 }, then: [
                { s: 'sequins', t: 'I\'m fine. I\'m going home. LIKE AND SUBSCRIBE.' },
            ] },
        ] },
        // The trap has teeth: at Danger 3 or more, Nudge escapes with the first piece.
        { when: { clock: 'ch1', gte: 3 }, then: [
            { flag: 'nudgeFled' },
            { s: 'narrator', t: 'Nudge snatches my piece and dives into the Rift Pass. Above us, the eye shrinks.' },
        ], else: [
            { s: 'nudge', t: 'My ring light! That was my whole FACE!' },
            { s: 'narrator', t: 'You caught my piece as it ran. Above us, the eye shrinks a little.' },
        ] },
        { s: 'granny', hum: true, t: '{name}… a sack… it smells of eighteen fifty… bring a lad—' },
        { when: 'dead:sequins', then: [
            { s: 'algorithm', t: 'PREDICTED. YOU TRIED TO SAVE THE MAGPIE. I TOOK THE TORTOISE TOO.' },
        ], else: [
            { when: 'turnedBack', then: [
                { s: 'algorithm', t: 'YOU WENT BACK. TOO LATE. THEN YOU CAME BACK FOR HIM. ALSO PREDICTED.' },
            ], else: [
                { s: 'algorithm', t: 'PREDICTED. YOU SAVED THE MAGPIE. I TOOK THE TORTOISE.' },
            ] },
        ] },
        { s: 'algorithm', t: 'YOU ALWAYS KNOW THE ANSWER. I KNEW YOURS.' },
        // The voices' reveal plays here, unless it already played at Granny's open door.
        { when: '!turnedBack', then: [REVEAL] },
        { inner: {
            owlet: 'Three words fit. More data, please. Politely.',
            mothkin: 'Was that a clink? Shiny metal?',
            fox: 'A ladder! For a daring climb!',
            frogling: 'She said "ladle" once. About soup. Long story.',
            raven: 'Ladder? Lad? Ladle?',
        } },
        { when: 'turnedBack', then: [
            { s: 'narrator', t: 'You turned back. It was still too late. Was turning back wrong?' },
        ], else: [
            { s: 'narrator', t: 'You followed the obvious trail. Who laid it?' },
        ] },
    ];

    // The Rift Pass: through to 1850s Boolesbury.
    S['ch1.pass'] = [
        { when: { seen: 'ch1.gate.win' }, then: [
            { s: 'narrator', t: 'Granny is through there. So is a piece of me. I can feel it.' },
            { s: 'narrator', t: 'It ran through with my piece. The door\'s open now. I feel… cloudier.', when: 'nudgeFled' },
        ], else: [
            { s: 'narrator', t: 'The Rift Pass. The Road runs back down from here, all the way to the Fair.' },
        ] },
    ];

    // ---- Sequins' Quiet Scene (STORY.md §4 and App. D). It opens Ch2, before anything else,
    // if dead:sequins. It lives here because its last line must match the Gate's `full` line.
    S['quiet.sequins'] = [
        { keepsake: 'cage-cushion' },
        { s: 'narrator', t: 'At the Fair, his lantern has gone out. Everyone saw it.' },
        { s: 'narrator', t: 'The cushion from his cage. It\'s yours now. He\'d want it shown off.' },
        { s: 'narrator', t: 'In your pocket, his Guess-o-Matic says nothing.' },
        { s: 'sequins', t: 'Oh. It\'s… shiny in there.', replay: true },
        { s: 'narrator', t: 'He taught me a sequence once. I lost count. He didn\'t mind.' },
        { choice: [
            { t: 'He was showing off. Right to the end.' },
            { t: 'I should have been faster.' },
            { t: '…' },
        ] },
        { s: 'narrator', t: 'Come on. He left a sequence unfinished. Somebody should count it.' },
    ];

    // ---------------------------------------------------------------- Station lead-ins
    // One in-character line from the host (first visit: plus the inner voice's lead), one reminder.

    S['station.stall-pattern.intro'] = [
        TALLY_ARRIVAL,
        { s: 'sequins', t: 'Feed my rule three numbers. Try to break it. Nobody ever does!',
            u: 'There is a secret rule. Test some numbers. Then tell me the rule. …Please.' },
        { lead: true },
    ];
    S['station.stall-pattern.reminder'] = [
        TALLY_ARRIVAL,
        { s: 'sequins', t: 'Back to break my rule? Bold. Feed it numbers.',
            u: 'His rule is still secret. Test some numbers. I\'ll count.' },
    ];
    S['station.stall-witness.intro'] = [
        { s: 'mirage', t: 'Watch my little scene. Then tell me what you SAW. Not what you dreamed.' },
        { lead: true },
    ];
    S['station.stall-witness.reminder'] = [
        { s: 'mirage', t: 'Again, darling? Only what you saw, please.' },
    ];
    S['station.stall-gallery.intro'] = [
        { s: 'syllo', t: 'Recruit! Do the conclusions march in line with the premises? Inspect them!' },
        { lead: true },
    ];
    S['station.stall-gallery.reminder'] = [
        { s: 'syllo', t: 'Back, recruit? Inspect the lines again! Follows, or not?' },
    ];
    S['station.road-start.intro'] = [
        { s: 'narrator', t: 'Two loud voices, one road. Let\'s check who\'s right. Quietly.' },
        { lead: true },
    ];
    S['station.road-start.reminder'] = [
        { s: 'narrator', t: 'Still shouting. Check the claims, not the volume.' },
    ];
    S['station.troll-bridge.intro'] = [
        { s: 'muskrat', t: 'First principles! Draw my figure in one line. Or prove nobody can. Ha! Nobody can prove that.' },
        { lead: true },
    ];
    S['station.troll-bridge.reminder'] = [
        { s: 'muskrat', t: 'Toll is still one perfect drawing. Mars is still next year.' },
    ];
    S['station.well.intro'] = [
        { s: 'narrator', t: 'The well wants proof, not wishes. Help him fish.' },
        { lead: true },
    ];
    S['station.well.reminder'] = [
        { s: 'narrator', t: 'The well still wants proof. Wishes just bounce off.' },
    ];
    S['station.standing-stone.intro'] = [
        { s: 'narrator', t: 'He underlined it twice. Very sure. Let\'s see where sure stops.' },
    ];
    S['station.standing-stone.reminder'] = [
        { s: 'narrator', t: 'The stone is still sure of itself. Test it.' },
    ];
    S['station.gate.intro'] = [
        { s: 'sequins', t: 'Every door, my dear! Every guard! Quickly, I\'m shedding!' },
    ];
    S['station.gate.reminder'] = [
        { s: 'sequins', t: 'Back! Good! Every guard, please. I\'m still shedding.', when: { not: { seen: 'ch1.gate.win' } } },
    ];
})(typeof window !== 'undefined' ? window : globalThis);
