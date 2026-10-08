/*
 * Script for lesson 2: Chapter 2, Boolesbury (truth tables, liars and truth-tellers).
 * Story: design/STORY.md Part I §4 and its appendices. Step format: design/SCRIPT-FORMAT.md.
 *
 * Keys the engine plays by itself: a node's `script`, `<script>.win`, `<script>.stage<k>` (the Town
 * Hall), a node's `intro` / `reminder`, `recap.ch2` (first time-rift jump into Ch2) and `quiet.granny`
 * (her Quiet Scene, at the first opening of Ch3 or later after her death; it lives here because its
 * last line must match the clock's `full` line word for word).
 *
 * Rift nodes (the Stone Circle, the Sky Rift) and rest/battle/rumour nodes play their script on every
 * visit, so they branch on `seen:`.
 *
 * Roles that can die here: `granny` (the Town Hall, clock `ch2`). Her understudy (Coach Achilles) only
 * speaks behind dead:granny AND arrived:granny (UNDERSTUDIES.md off-stage rule): one charm hum at a
 * Town Hall revisit. Mr Gumleaf is an ordinary character: he takes Quill's class after the Hall
 * (`away:schoolteacher`) in every playthrough.
 *
 * Flags set here: suspect, cover, mayor (and mayor.interest, the Mayor's scene only), quillNamed
 * (the full table has named Quill: picks Granny's last words), lastWords (her / table: what she
 * actually said, set inside the clock's `full`), spare-axiom, away:schoolteacher.
 * Read here: nudgeFled, guess-o-matic, ladle (side story 4), paradox-board (side story 5), dead:sequins
 * (her Quiet Scene).
 *
 * A Ch3 jump-in can walk back through the Sky Rift and reach the Hall first: reveals wait for their
 * set-ups (seen:ch2.square.win), and the suspicion and Mayor choices are skipped after the feast.
 */
(function (root) {
    'use strict';
    const Rift = root.Rift;
    const S = Rift.data.script || (Rift.data.script = {});
    const C = Rift.data.clocks || (Rift.data.clocks = {});

    Rift.data.speakers = Object.assign(Rift.data.speakers || {}, {
        mayor: { name: 'Mayor Plumage', art: 'npc/mayor' },
        constable: { name: 'Constable Clobber', art: 'npc/villager-constable' },
        baker: { name: 'Mrs Crumb, the Baker', art: 'npc/villager-baker' },
        postmistress: { name: 'Miss Whisker, Postmistress', art: 'npc/villager-postmistress' },
        clockmaker: { name: 'Mr Tock, the Clockmaker', art: 'npc/villager-clockmaker' },
        lamplighter: { name: 'Old Wick, the Lamplighter', art: 'npc/villager-lamplighter' },
        sweep: { name: 'Smudge the Sweep', art: 'npc/villager-sweep' },
        schoolteacher: { name: 'Miss Quill, the Teacher', art: 'npc/villager-schoolteacher' },
        gardener: { name: 'Mr Thistle, the Gardener', art: 'npc/villager-gardener' },
        // Not an understudy: he takes Quill's class after the Hall in every playthrough.
        gumleaf: { name: 'Mr Gumleaf, Supply Teacher', art: 'npc/gumleaf' },
    });

    // ---------------------------------------------------------------- conditions

    // A later chapter has been entered: Ch2 is now a memory (STORY.md A.12).
    const LATER = { any: ['entered:ch3', 'entered:ch4'] };
    // Granny can still be talked to on the rope: alive, and the pot has not finished.
    const ROPE_OPEN = { all: ['!dead:granny', { clock: 'ch2', lte: 7 }] };
    // Achilles has arrived (Ch3 Café): he hums through her charm, which you wear. Never before.
    const ACHILLES_HERE = { all: ['dead:granny', 'arrived:granny'] };
    // Granny's hums from the kitchen. Silent once she is gone (never spoken by anyone else).
    const HUM = t => ({ s: 'granny', hum: true, t, when: '!dead:granny' });
    // Before the Hall is won (a Ch3 jump-in walking back has already won it).
    const PRE = { not: { seen: 'ch2.hall.win' } };
    const HUMPRE = t => ({ s: 'granny', hum: true, t, when: ['!dead:granny', PRE] });

    // ---------------------------------------------------------------- "Previously…"

    // First time-rift jump into Ch2. Every flag may be unset. The crackle's context line
    // (ch1.crackle.fallback, "Imps took her") plays next, at the Stone Circle.
    S['recap.ch2'] = [
        { s: 'narrator', t: 'Previously. The Algorithm stole my shadow. It cut it into four pieces.' },
        { s: 'narrator', t: 'At the Fair you said you\'d win the Thinking Trophy. "I always know the answer." It heard.' },
        { s: 'narrator', t: 'Each piece locks a door behind it. You won back the first.', when: '!nudgeFled' },
        { s: 'narrator', t: 'Each piece locks a door behind it. An imp ran off with the first.', when: 'nudgeFled' },
        { s: 'narrator', t: 'But the Road was a trick. While you were busy, Granny vanished.' },
        { when: '!guess-o-matic', then: [
            { s: 'narrator', t: 'The Professor\'s little Guess-o-Matic is in your pocket. He asked you to mind it.' },
            { flag: 'guess-o-matic' },
        ] },
        { s: 'narrator', t: 'Through this rift. Into the past. The imps went this way.', when: { not: LATER } },
        { s: 'narrator', t: 'We\'ve been to Boolesbury before. This time, it\'s a memory.', when: { all: [LATER, { seen: 'ch2.soup' }] } },
        { s: 'narrator', t: 'Boolesbury. The past. For us, it\'s already happened.', when: { all: [LATER, { not: { seen: 'ch2.soup' } }] } },
        { s: 'narrator', t: 'We know how the feast ends. Her lantern is out.', when: { all: [LATER, 'dead:granny'] } },
        { s: 'narrator', t: 'We know how the feast ends. Granny walks home.', when: { all: [LATER, '!dead:granny', { flag: 'stakes.ch2', in: [1, 2, 3] }] } },
    ];

    // ---------------------------------------------------------------- the Stone Circle

    // Rift node: plays on every visit. First: Granny's crackle if the Rift Pass was skipped by a jump
    // (lesson1.js), then beat 1 (posters, Nudge's flyers, the first hum), or one line on a revisit.
    S['ch2.arrive'] = [
        { play: 'ch1.crackle.fallback' },
        { when: { seen: 'ch2.soup' }, then: [
            { s: 'narrator', t: 'The Stone Circle. The rift back to the Road hums here.', when: { not: LATER } },
            { s: 'narrator', t: 'Boolesbury again. We know how the feast ends. This is a memory.', when: LATER },
        ], else: [{ play: 'ch2.soup' }] },
    ];
    S['ch2.soup'] = [
        { s: 'narrator', t: 'Boolesbury, eighteen fifty-something. Every wall says: FEAST OF LAWS. SOUP FOR ALL. BY ORDER OF THE MAYOR.' },
        { s: 'narrator', t: 'One piece short. I feel… cloudier.', when: 'nudgeFled' },
        { s: 'nudge', t: 'Flyers! Ring light smashed, so: new mask. Villagers trust villagers. Feast tonight!', when: ['!nudgeFled', PRE] },
        { s: 'nudge', t: 'Flyers! Feast tonight! Like my mask? Nothing under it. Nothing shadowy.', when: ['nudgeFled', PRE] },
        { s: 'nudge', t: 'Tonight\'s soup: one Granny Axiom! No Granny, no first rules. Engagement!', when: PRE },
        { s: 'avatar', t: 'Small print: "Thinking Trophy. Predicted winner: nobody." Wrong. Me.', when: PRE },
        { inner: { raven: '"By order of the Mayor." Order. Not "idea". Interesting.' }, when: PRE },
        HUMPRE('{name}? Big kitchen. Big pot. Don\'t panic. I\'m panicking for both of us.'),
    ];

    // ---------------------------------------------------------------- Old Wick's lane

    S['ch2.bridge'] = [
        { s: 'lamplighter', t: 'Evening. Old Wick. I light the lamps. Tonight they want the big stove lit too.' },
    ];
    S['ch2.bridge.win'] = [
        { s: 'lamplighter', t: 'The lamps agree with you. They rarely agree with anyone.' },
    ];
    S['ch2.lane'] = [
        { s: 'lamplighter', t: 'My neighbours are whispering again. Somebody says somebody is an imp. Every night.' },
    ];
    S['ch2.lane.win'] = [
        { s: 'lamplighter', t: 'Nobody shouted. Nobody fainted. Best evening in years.' },
    ];

    // ---------------------------------------------------------------- the Village Square

    // The scene before the Square's small table (village, fixed statements: nobody is an imp).
    // The squabble is about bread and stays unsettled (the loaf falls out of his hat at the Hall).
    // The blind spots play here, before the table proves the Mayor is no imp.
    S['ch2.square'] = [
        { s: 'mayor', t: 'Citizens of Boolesbury! Nothing is wrong! Everything is excellent! Especially me!' },
        { s: 'baker', e: 'accusing', t: 'My last loaf is missing.' },
        { s: 'mayor', e: 'nervous', t: 'Not me! Smudge!' },
        { inner: {
            mothkin: 'Look. His eye twitched at "missing". Twitchers are guilty. Science.',
            fox: 'Picture it. Midnight. The Mayor peels off his face. Perfect.',
            frogling: 'The loud one is always the bad one. Muskrat. The guards. Now him.',
        } },
        { s: 'postmistress', e: 'accusing', t: 'Never mind bread! The flyers say imps. Which of you three is one?' },
        { s: 'sweep', e: 'nervous', t: 'Not me! I\'m honest! I\'m honest!' },
    ];
    // After the table: the Mayor's fib, Quill (clue 1, inside a joke), the suspicion choice, a hum.
    S['ch2.square.win'] = [
        { s: 'mayor', e: 'nervous', t: 'See? Not an imp! I have not seen your loaf. Also, this statement is false.' },
        { s: 'schoolteacher', t: 'Plumage. Crumbs on your chain. Again. And stop that. It\'s neither.', when: PRE },
        { s: 'schoolteacher', t: 'Every claim is true or false, child. Isn\'t that a comfort?', when: PRE },
        { inner: {
            owlet: 'Correct. Every sentence is true or false. First rule of everything.',
            mothkin: 'Shh. Her scarf. There\'s wind. It doesn\'t move. …Lovely lamp behind her, though.',
        }, when: PRE },
        // A Ch3 jump-in who walks back meets the Square after the feast: no suspicion to choose then.
        { when: { seen: 'ch2.hall.win' }, then: [
            { s: 'narrator', t: 'We know who was behind the feast now. This is only a memory.' },
        ], else: [{ play: 'ch2.square.suspect' }] },
    ];
    S['ch2.square.suspect'] = [
        { s: 'narrator', t: 'Somebody wants Granny in that soup. Who\'s behind the feast?' },
        { choice: [
            { t: 'The Mayor.', flag: 'suspect', value: 'mayor' },
            { t: 'Nobody, yet.', flag: 'suspect', value: 'none' },
            { t: 'Miss Quill. Just a feeling.', flag: 'suspect', value: 'quill' },
            { t: 'Nobody. I have no premises yet. Impressive restraint, I think.', only: 'owlet', voice: true, flag: 'suspect', value: 'none' },
            { t: 'The Mayor. He twitched. Like a candle.', only: 'mothkin', voice: true, flag: 'suspect', value: 'mayor' },
            { t: 'The Mayor. I can already picture it.', only: 'fox', voice: true, flag: 'suspect', value: 'mayor' },
            { t: 'The loud one. It\'s always the loud one.', only: 'frogling', voice: true, flag: 'suspect', value: 'mayor' },
            { t: 'Whoever wrote "by order".', only: 'raven', voice: true, flag: 'suspect', value: 'mayor' },
        ] },
        { s: 'mayor', e: 'accusing', t: 'I heard that! I\'m behind nothing! I\'m in front of everything!', when: { flag: 'suspect', is: 'mayor' } },
        { s: 'schoolteacher', t: 'A feeling, child? Feelings are not one or zero. Sit up straight.', when: { flag: 'suspect', is: 'quill' } },
        HUM('The Mayor came down to taste the stock, dear. Said a sentence that ate itself.'),
    ];

    // ---------------------------------------------------------------- the first interrogation

    // At the Post Office if you go there first, otherwise at the Clock Tower (played once).
    // Quill saves you; the avatar's certainty: "See? She's on my side." (quoted at the Hall).
    S['ch2.cover'] = [
        // Nudge sets the Constable on you, so Quill's rescue is a rescue from him.
        { s: 'nudge', t: 'Constable! A stranger! Ask them EVERYTHING! I\'ll count the questions!', when: PRE },
        { s: 'constable', e: 'accusing', t: 'Stranger, eh? Name and business. Slowly. I write slowly.' },
        { inner: { raven: 'If I say it smoothly enough, I am one. Words make things so.' } },
        { choice: [
            { t: 'A postman.', flag: 'cover', value: 'postman', then: [
                { s: 'constable', t: 'A postman. Another one. That\'s four today.' },
            ] },
            { t: 'Just visiting.', flag: 'cover', value: 'visitor', then: [
                { s: 'constable', t: 'Visiting. Visiting what? Never mind. Writing it down.' },
            ] },
            { t: 'A visiting tutor. Of… tutoring.', only: 'owlet', flag: 'cover', value: 'species', then: [
                { s: 'constable', t: 'Tutor. Of tutoring. T-O-O-T. Got it.' },
            ] },
            { t: 'A lamp tester. I test lamps. Closely.', only: 'mothkin', flag: 'cover', value: 'species', then: [
                { s: 'constable', t: 'Lamp… taster. Got it.' },
            ] },
            { t: 'A travelling actor. I\'m acting right now.', only: 'fox', flag: 'cover', value: 'species', then: [
                { s: 'constable', t: 'Acting. Right now. Is that a crime? I\'ll check.' },
            ] },
            { t: 'A pond inspector. Your ponds are fine.', only: 'frogling', flag: 'cover', value: 'species', then: [
                { s: 'constable', t: 'Pond… Inspector. Two p\'s?' },
            ] },
            { t: 'A letter carrier. Ravens carry letters. Famously.', only: 'raven', flag: 'cover', value: 'species', then: [
                { s: 'constable', t: 'Letter… carrot. Fine.' },
            ] },
        ] },
        { s: 'schoolteacher', t: 'Constable, this one\'s with me. I checked their story. Every row.', when: PRE },
        { s: 'constable', t: 'If Miss Quill checked it, it\'s checked. Still. A few questions. For the form.', when: PRE },
        { s: 'avatar', e: 'happy', t: 'See? She\'s on my side.', when: PRE },
        { s: 'schoolteacher', t: 'Take my red pencil, child. Mark what\'s wrong. Never write "maybe".', when: PRE },
    ];

    S['ch2.post'] = [
        { when: { seen: 'ch2.cover' }, then: [
            { s: 'postmistress', t: 'The Constable\'s back, dear. He likes our ink.' },
        ], else: [
            { s: 'postmistress', t: 'Everybody\'s a postman this week, dear. Here, a cap. Pick a better story.' },
            { play: 'ch2.cover', once: true },
        ] },
    ];
    S['ch2.post.win'] = [
        { s: 'constable', t: 'Hmph. Your story holds. For now. I\'ve underlined "for now".' },
    ];

    // ---------------------------------------------------------------- the clocks

    // The Sundial's companion beat for Ch2 (a `met` beat for its peril in Ch3).
    S['ch2.clockmaker'] = [
        { s: 'clockmaker', t: 'Mind the pendulums! A hundred clocks, all correct. I check them twice.' },
        { s: 'narrator', t: 'They tick. All correct. I just point. And on cloudy days, I guess.' },
        { s: 'clockmaker', t: 'A sundial! You never need winding. I\'ve always envied that.' },
    ];
    S['ch2.clockmaker.win'] = [
        { s: 'clockmaker', t: 'The bulb agrees with you. So do the clocks. That never happens.' },
        HUMPRE('They\'ve added carrots, dear. I am not a carrot person.'),
    ];

    // ---------------------------------------------------------------- the Clock Tower

    // The Constable again, harder (or the first interrogation). He lets slip who signed the feast.
    S['ch2.tower'] = [
        { when: { seen: 'ch2.cover' }, then: [
            { s: 'constable', e: 'accusing', t: 'You again. From the top. Harder questions up here.' },
        ], else: [{ play: 'ch2.cover', once: true }] },
        { s: 'constable', t: 'The feast? The Mayor signed it. For the applause. …I didn\'t say that.' },
        { inner: { owlet: '"The Mayor signed it." Signing is choosing. Write that down. I did.' } },
    ];
    S['ch2.tower.win'] = [
        { s: 'constable', t: 'Your story never wobbled. Lies can be tidy too.', when: { flag: 'cover', not: 'visitor' } },
        { s: 'constable', t: 'A true story holds too. Proves less than you\'d think.', when: { flag: 'cover', is: 'visitor' } },
        { inner: { raven: 'Smooth words. Still a story. He knew.' }, when: { flag: 'cover', not: 'visitor' } },
        { inner: { raven: 'True words. Still not proof. Noted.' }, when: { flag: 'cover', is: 'visitor' } },
        HUMPRE('Somebody tall keeps checking the pot. Hums in ones and zeros. Very tidy.'),
        { inner: { frogling: '"Tall." Lots of birds are tall. Herons are tall. I\'m not enjoying this.' }, when: ['!dead:granny', PRE] },
    ];

    // ---------------------------------------------------------------- the Town Hall Stairs

    S['ch2.stairs'] = [
        { s: 'clockmaker', e: 'nervous', t: 'My lock. I built it for the Mayor. He paid me in bread.' },
        { inner: { fox: 'Picture the Mayor reading what he signed. …I can\'t. Can you?' } },
    ];
    // The door opens. Up now, or back to the Square to face the man who signed it.
    // A Ch3 jump-in walking back reaches the Stairs after the feast: no choice then.
    S['ch2.stairs.win'] = [
        { when: { seen: 'ch2.hall.win' }, then: [
            { s: 'narrator', t: 'The door opens. The hall above is quiet now.' },
        ], else: [
            { s: 'narrator', t: 'The door opens. Steam pours down the stairs.' },
            HUM('Come up quickly, dear. The water is singing.'),
            { choice: [
                { t: 'Up the stairs. Now.' },
                { t: 'Back to the Square first. The Mayor signed this.', then: [{ play: 'ch2.mayor' }] },
            ] },
        ] },
    ];

    // The man who signed it (the Square, revisited from the Stairs). A short negotiation: he cares
    // about fame and safety, and can't stand facts. Interest 4–5: torn; 2–3: key; 0–1: refused.
    // Whatever happens, it costs time: the rope starts 1 notch higher.
    S['ch2.mayor'] = [
        { scene: 'scene/village-square' },
        { s: 'mayor', e: 'nervous', t: 'You again! I\'m busy. Being innocent.' },
        { s: 'avatar', t: 'Your feast is boiling Granny. You signed it.' },
        { s: 'mayor', e: 'nervous', t: 'Boiling? It said "soup"! …I stopped reading at "soup".' },
        { s: 'mayor', t: 'Your table says I\'m not an imp. True. I\'m worse. I\'m a mayor who doesn\'t read.' },
        { flag: 'mayor.interest', value: 1 },
        { choice: [
            { t: 'Picture the crowd when you save her. Cheering. For you.', then: [
                { flag: 'mayor.interest', add: 2 },
                { s: 'mayor', t: 'Cheering? For me? …Go on.' },
            ] },
            { t: 'Imps run that kitchen. Mayors could be next on the menu.', then: [
                { flag: 'mayor.interest', add: 1 },
                { s: 'mayor', e: 'nervous', t: 'On the MENU? I\'m listening.' },
            ] },
            { t: 'You signed it without reading it. That\'s a fact.', then: [
                { flag: 'mayor.interest', add: -1 },
                { s: 'mayor', e: 'accusing', t: 'Facts! Boring! And rude!' },
            ] },
        ] },
        { s: 'mayor', t: 'But the decree has my name on it. In gold!' },
        { choice: [
            { t: 'Then tear it up. In front of everyone. They\'ll never forget it.', then: [
                { flag: 'mayor.interest', add: 2 },
                { s: 'mayor', t: 'In front of everyone? …Dramatic. I love it.' },
            ] },
            { t: 'Then give me the kitchen key. Nobody needs to know.', then: [
                { flag: 'mayor.interest', add: 1 },
                { s: 'mayor', t: 'Nobody needs to know. My favourite words.' },
            ] },
            { t: 'Clause four says "boil". Clause five says "stir". Read them.', then: [
                { flag: 'mayor.interest', add: -1 },
                { s: 'mayor', e: 'accusing', t: 'Clauses! I don\'t do clauses!' },
            ] },
        ] },
        { when: { flag: 'mayor.interest', gte: 4 }, then: [
            { flag: 'mayor', value: 'torn' },
            { s: 'mayor', t: 'Citizens! The feast is OFF! By order of… me. Again.' },
            { s: 'narrator', t: 'He tears the decree in two. The guests put down their spoons and go home.' },
        ], else: [
            { when: { flag: 'mayor.interest', gte: 2 }, then: [
                { flag: 'mayor', value: 'key' },
                { s: 'mayor', e: 'nervous', t: 'Here. The kitchen key. You didn\'t get it from me.' },
            ], else: [
                { flag: 'mayor', value: 'refused' },
                { s: 'mayor', t: 'No. Nothing is wrong. Especially me. Good evening!' },
            ] },
        ] },
        { s: 'narrator', t: 'That took time. Back up the stairs. Quickly.' },
    ];

    // ---------------------------------------------------------------- side streets

    S['ch2.bakery'] = [
        { s: 'baker', e: 'accusing', t: 'Imps in my queue! In my customers\' faces! Which ones?' },
    ];
    S['ch2.bakery.win'] = [
        { s: 'baker', t: 'Well! I\'d have blamed the one who looked nervous.' },
    ];

    // Quill at her best, before the Hall; Mr Gumleaf after it (every playthrough).
    S['ch2.school'] = [
        { when: 'away:schoolteacher', then: [
            { s: 'gumleaf', t: 'Today\'s lesson, apparently: true or false. No maybes. Wow. She wrote it in capitals.' },
            { s: 'sweep', e: 'nervous', t: 'I\'m honest, sir!' },
            { s: 'gumleaf', t: 'Saying it doesn\'t prove it, Smudge. An imp would say the same. Sorry. Rules.' },
        ], else: [
            { s: 'schoolteacher', t: 'Today\'s lesson: every statement is true or false. One or zero. No maybes.' },
            { s: 'sweep', e: 'nervous', t: 'I\'m honest, miss! I\'m honest!' },
            { s: 'schoolteacher', t: 'Saying so proves nothing, Smudge. Saying it twice, also nothing. Sit.' },
        ] },
    ];
    S['ch2.school.win'] = [
        { s: 'schoolteacher', t: 'Top marks. You checked every row. I do like a child who checks.', when: '!away:schoolteacher' },
        { s: 'gumleaf', t: 'Top marks. I didn\'t know we gave marks. Nice.', when: 'away:schoolteacher' },
    ];

    // The Walled Garden (rest; plays every visit). No imps in here: nothing watches.
    S['ch2.garden'] = [
        { when: { seen: 'ch2.garden' }, then: [
            { s: 'narrator', t: 'Mr Thistle nods. Still no words. Another radish.' },
        ], else: [
            { s: 'narrator', t: 'A walled garden. No imps. Nothing watching. Mr Thistle hands you a radish.' },
        ] },
    ];

    // The East Bridge (battle; plays every visit).
    S['ch2.cards'] = [
        { s: 'constable', t: 'Off duty. Cards? I play by the rules. Whatever the rules are this round.' },
    ];
    S['ch2.cards.win'] = [
        { s: 'constable', e: 'nervous', t: 'Beaten fair and square. Take your winnings before I arrest them.' },
    ];

    // The West Bridge (rumour; plays every visit).
    S['ch2.rumour'] = [
        { s: 'narrator', t: 'Gossip on the West Bridge: a grey heron in a frock coat haunts the Schoolhouse.' },
        { s: 'narrator', t: 'He\'s shy. He only comes out for winners.' },
        { flag: 'rumour:booleon', value: true },
    ];

    // ---------------------------------------------------------------- the Feast of Laws (boss)

    // The rope: 8 notches. Granny's own warnings. Her last words depend on whether the full
    // table has named Quill yet (quillNamed, set first thing in the win); `full` records which
    // words she said (lastWords), so her Quiet Scene replays exactly those.
    C.ch2 = {
        label: 'The rope is lowering',
        size: 8,
        node: 'b-town-hall',
        peril: 'granny',
        progress: 4,
        art: 'ui/stakes-ch2',
        // warn[k-1] plays when notch k fills (notch 8 plays `full` or `brink` instead).
        warn: [
            { s: 'granny', t: 'My feet are warm, dear. That is new.' },
            { s: 'granny', t: 'Warm, dear. Like a bath. A worrying bath.' },
            { s: 'granny', t: 'I can see a carrot. It is looking at me.' },
            { s: 'granny', t: 'A pot never hurt anybody, I said. I take it back.' },
            { s: 'granny', t: 'The leeks are getting friendly. Too friendly.' },
            { s: 'granny', t: 'Up to my shell now, dear. Every row. Quickly.' },
            { s: 'granny', t: 'The water is singing louder, dear. I\'d like it to stop.' },
        ],
        // Armed tier 4 (STORY.md App. D): calm, looking at you, not the rope.
        full: [
            { s: 'narrator', t: 'Granny looks at you. Not at the rope.' },
            { when: 'quillNamed', then: [
                { flag: 'lastWords', value: 'her' },
                { s: 'granny', t: 'Don\'t watch the rope, dear. Watch her.' },
            ], else: [
                { flag: 'lastWords', value: 'table' },
                { s: 'granny', t: 'Don\'t watch the rope, dear. Watch the table.' },
            ] },
            { s: 'narrator', t: 'The rope goes slack. Steam. Then silence.' },
            { s: 'mayor', t: 'Oh.' },
            { s: 'algorithm', t: 'SAD CONTENT PERFORMS WELL.' },
        ],
        // Tier 4 when no one can die: the brink, then tier 3.
        brink: [
            { s: 'narrator', t: 'The rope snaps. A splash.' },
            { s: 'narrator', t: 'Her shell bobs up. Then her head.' },
            { s: 'granny', t: 'Rude.' },
        ],
    };

    // Before stage 1 (the guests). Going back to the Mayor cost a notch.
    S['ch2.hall'] = [
        { when: { flag: 'mayor', unset: true }, then: [{ clock: 'ch2', start: 0 }], else: [{ clock: 'ch2', start: 1 }] },
        { s: 'constable', t: 'Guarding the soup. Two p\'s in "soup"?' },
        { s: 'granny', t: 'Up here, dear. Rope. Pot. Leeks. Don\'t panic.' },
        { when: { flag: 'mayor', is: 'torn' }, then: [
            { s: 'mayor', t: 'I tore it up! Half the guests went home!' },
        ] },
        { when: { flag: 'mayor', is: 'key' }, then: [
            { s: 'narrator', t: 'The Mayor hides behind a pillar. He won\'t look at you.' },
        ] },
        // He knows now what the feast boils. He still won't stop it.
        { when: { flag: 'mayor', is: 'refused' }, then: [
            { s: 'mayor', e: 'nervous', t: 'I\'m not looking. If I don\'t look, it isn\'t happening.' },
        ] },
        // He never went back to read it: he still thinks it's soup.
        { when: { flag: 'mayor', unset: true }, then: [
            { s: 'mayor', t: 'Is it soup yet?' },
            { s: 'nudge', t: 'Tradition!' },
            { s: 'granny', t: 'Me, dear. I\'m in it.' },
            { s: 'mayor', e: 'nervous', t: '…Is that allowed?' },
        ] },
        { s: 'narrator', t: 'He moves. A loaf rolls out of his hat.' },
        { s: 'schoolteacher', t: 'I\'ll keep the tables, child. You find the imps.' },
    ];
    // Before stage 2 (the winch box): Nudge's winch; the Mayor's help drains the rope.
    S['ch2.hall.stage2'] = [{ play: 'ch2.hall.winch', once: true }];
    S['ch2.hall.winch'] = [
        { s: 'nudge', t: 'Paws off my winch! Every turn is a click! Every click, she goes lower!' },
        { when: ROPE_OPEN, then: [
            { when: { flag: 'mayor', is: 'key' }, then: [
                { s: 'narrator', t: 'The Mayor\'s kitchen key jams the winch. The rope stops. For now.' },
                { clock: 'ch2', drain: 1 },
            ] },
            { when: { flag: 'mayor', is: 'torn' }, then: [
                { s: 'mayor', t: 'I\'ve got the rope! Both wings! Nobody pull!' },
                { clock: 'ch2', drain: 2 },
            ] },
        ] },
    ];
    // Before stage 3 (the accusation): Quill opens her own table. It hides one row.
    S['ch2.hall.stage3'] = [{ play: 'ch2.hall.table', once: true }];
    S['ch2.hall.table'] = [
        { when: { all: ['ladle', ROPE_OPEN] }, then: [
            { s: 'narrator', t: 'Mrs Crumb\'s big ladle. You bail. A little.' },
            { clock: 'ch2', drain: 1 },
        ] },
        { s: 'schoolteacher', t: 'My own table, child. I checked it for you. Like with the Constable.', when: { seen: 'ch2.cover' } },
        { s: 'schoolteacher', t: 'My own table, child. I checked it for you. Every row.', when: { not: { seen: 'ch2.cover' } } },
        { s: 'granny', t: 'Check it yourself, dear. Every row.' },
    ];

    // The win: the full table has named her. The hero answers, the push, the liar sentence, the
    // unmasking (the business first, her confession last); then at most six lines (STORY.md
    // App. B): the tier, Quill's exit, the Algorithm twice, one voice, one question.
    // The reveals and the Mayor's sentence need their set-ups at the Square: a Ch3 jump-in who
    // walks back through the Sky Rift reaches the Hall first.
    S['ch2.hall.win'] = [
        { flag: 'quillNamed' },
        { s: 'avatar', e: 'surprised', t: 'Miss Quill? You were on my side.', when: { seen: 'ch2.cover' } },
        { when: ROPE_OPEN, then: [
            { s: 'schoolteacher', e: 'accusing', t: 'One or zero, child. You are a zero.' },
            { clock: 'ch2', tick: 1 },
        ] },
        { when: { seen: 'ch2.square.win' }, then: [
            { s: 'granny', t: 'Ask her the Mayor\'s sentence. The one that ate itself.' },
            { s: 'avatar', t: 'The Mayor\'s sentence. The one that ate itself.', when: 'dead:granny' },
        ], else: [
            { s: 'granny', t: 'Ask her a sentence that eats itself, dear.' },
            { s: 'avatar', t: 'A sentence that eats itself. Let\'s try one.', when: 'dead:granny' },
        ] },
        // A wrong pick costs a notch; pick again.
        { choice: [
            { t: 'This statement is false.' },
            { t: 'This statement is true.', then: [
                { s: 'schoolteacher', t: 'One. Stamped. It agrees with itself. Next.' },
                { clock: 'ch2', tick: 1 },
                { choice: [
                    { t: 'This statement is false.' },
                    { t: 'Miss Quill is honest.', then: [
                        { s: 'schoolteacher', t: 'One. Obviously. Next.' },
                        { clock: 'ch2', tick: 1 },
                        { choice: [{ t: 'This statement is false.' }] },
                    ] },
                ] },
            ] },
            { t: 'Miss Quill is honest.', then: [
                { s: 'schoolteacher', t: 'One. Obviously. Next.' },
                { clock: 'ch2', tick: 1 },
                { choice: [
                    { t: 'This statement is false.' },
                    { t: 'This statement is true.', then: [
                        { s: 'schoolteacher', t: 'One. Stamped. It agrees with itself. Next.' },
                        { clock: 'ch2', tick: 1 },
                        { choice: [{ t: 'This statement is false.' }] },
                    ] },
                ] },
            ] },
        ] },
        { s: 'schoolteacher', e: 'nervous', t: 'True. No. False. No. ONE. ZER—' },
        // Side story 5 (paradox-board): Smudge, who chalked the sentence on her board, cheers from the gallery.
        { s: 'sweep', t: 'That\'s my sentence! From her board! It WORKS!', when: { all: ['paradox-board', '!dead:granny'] } },
        { s: 'narrator', t: 'In the gallery, Smudge stares at the floor. His sentence. Her board.', when: { all: ['paradox-board', 'dead:granny'] } },
        { s: 'narrator', t: 'Her mask slides off. Under it: a crowned imp. Her own tired eyes.' },
        { s: 'narrator', t: 'Her black scarf falls. It never moved in the wind. It\'s my shadow.' },
        { s: 'narrator', t: 'Round the tables, more masks drop. Imps in borrowed faces. Nudge\'s too.' },
        { s: 'nudge', t: 'My mask! Forty villagers trusted that face! I COUNTED!', when: '!dead:granny' },
        { s: 'narrator', t: 'And out of Nudge\'s mask tumbles my first piece.', when: 'nudgeFled' },
        // Her confession, last: she chose the feed.
        { s: 'schoolteacher', e: 'unmasked', t: 'Forty years I marked "maybe" wrong. Red ink. Every child.' },
        { s: 'schoolteacher', e: 'unmasked', t: 'If "maybe" was allowed… I was cruel for forty years.' },
        { s: 'schoolteacher', e: 'unmasked', t: 'So when a voice offered me a world with no maybes… I said yes.' },
        { when: { seen: 'ch2.square.win' }, then: [
            { inner: {
                owlet: 'I called it the first rule. It was an assumption. That sentence just broke it.',
                frogling: 'Loud was bad three times. The fourth time, quiet was.',
            } },
            { inner: { fox: 'Great story. Wrong face.' }, when: '!dead:granny' },
            { inner: { fox: 'I pictured the wrong face. The whole time.' }, when: 'dead:granny' },
        ] },
        { clock: 'ch2', resolve: true },
        { when: 'dead:granny', then: [
            { s: 'narrator', t: 'Constable Clobber takes off his helmet. He hands you her charm and her glasses.' },
        ], else: [
            { when: { flag: 'stakes.ch2', is: 1 }, then: [
                { s: 'granny', e: 'happy', t: 'Not a drop on me. But leeks? In MY soup? Here, dear. My Spare Axiom.' },
                { flag: 'spare-axiom' },
            ] },
            { when: { flag: 'stakes.ch2', is: 2 }, then: [
                { s: 'granny', t: 'I smell of leek. Tell no one. Tell everyone. Here: my Spare Axiom.' },
                { flag: 'spare-axiom' },
            ] },
            { when: { flag: 'stakes.ch2', is: 3 }, then: [
                { s: 'granny', e: 'angry', t: 'Somebody boiled my shawl. Rude. Your card was in the pocket.', when: { clock: 'ch2', lte: 7 } },
                { s: 'granny', e: 'angry', t: 'My shawl boiled away. With your card in the pocket.', when: { clock: 'ch2', gte: 8 } },
            ] },
        ] },
        // Her exit, seen: up to the window and the Sky Rift beyond it.
        { s: 'narrator', t: 'She steps up onto the window. The Sky Rift glows behind her.' },
        { s: 'schoolteacher', e: 'unmasked', t: 'Tomorrow is waiting. Everyone there has already decided about you.' },
        { flag: 'away:schoolteacher' },
        { s: 'algorithm', t: '"SEE? SHE\'S ON MY SIDE." SHE WAS. MY SIDE.', when: { seen: 'ch2.cover' } },
        { s: 'algorithm', t: 'THE NEXT ERA WILL BE… probably— LOUDER.' },
        { when: { seen: 'ch2.square.win' }, then: [
            { inner: { mothkin: 'He twitched. Bread in his hat. Guilty of bread.' }, when: '!dead:granny' },
            { inner: { mothkin: 'He twitched. Bread in his hat. That\'s all a twitch proved.' }, when: 'dead:granny' },
        ] },
        // The Sundial's question. After her death it is said for her, not about your guess.
        { s: 'narrator', t: 'Every row, she said. Her whole life. Who checks the table now?', when: 'dead:granny' },
        { when: '!dead:granny', then: [
            { s: 'narrator', t: 'You suspected the Mayor. Miss Quill\'s table hid one row. Hers. Who checks the table?', when: { flag: 'suspect', is: 'mayor' } },
            { s: 'narrator', t: 'You waited for the table. Then the table lied. Who checks the table?', when: { flag: 'suspect', is: 'none' } },
            { s: 'narrator', t: 'You guessed Miss Quill. Her own table left her row out. Who checks the table?', when: { flag: 'suspect', is: 'quill' } },
            { s: 'narrator', t: 'Miss Quill\'s table left out one row. Hers. Who checks the table?', when: { flag: 'suspect', unset: true } },
        ] },
    ];

    // ---------------------------------------------------------------- the Sky Rift

    // Rift node: plays on every visit. The first time after the Hall: Granny sets off home.
    // A Ch3 jump-in walks back in here first: the memory framing, before the Hall.
    S['ch2.skyrift'] = [
        { when: { all: [{ seen: 'ch2.hall.win' }, { not: LATER }, { not: { seen: 'ch2.skyrift.goodbye' } }] },
            then: [{ play: 'ch2.skyrift.goodbye' }],
            else: [
                { s: 'narrator', t: 'Boolesbury, below us. All this happened already. We\'re only remembering.', when: { all: [LATER, { not: { seen: 'ch2.hall.win' } }] } },
                { s: 'narrator', t: 'The Sky Rift. Tomorrow hums on the other side.', when: { any: [{ not: LATER }, { seen: 'ch2.hall.win' }] } },
            ] },
    ];
    // Lesson 1's set-ups pay off here ("That's my {name}.", "Hum you later."). After her death only
    // the Sundial's line plays.
    S['ch2.skyrift.goodbye'] = [
        { s: 'granny', e: 'happy', t: 'That\'s my {name}. I\'ll walk home, dear. Downhill. Through time.' },
        { s: 'granny', t: 'Hum you later.' },
        { s: 'narrator', t: 'Miss Quill went up there. So did my next piece. Tomorrow, then.' },
    ];

    // ---- Granny's Quiet Scene (STORY.md §5 and App. D). It opens Ch3 (or the first later chapter
    // reached), before anything else, if dead:granny. Her last words are the ones `full` recorded.
    // The Sundial only sees what you see (A.3): what happens at the Fair is its honest guess.
    S['quiet.granny'] = [
        { keepsake: 'granny-charm-glasses' },
        { s: 'narrator', t: 'After the feast, the Constable gave you her Hum Charm. And her reading glasses.' },
        { s: 'narrator', t: 'I\'d guess the Professor sets out her cards each morning now. Nobody sits.', when: '!dead:sequins' },
        { s: 'narrator', t: 'I\'d guess Syllo salutes two dark lanterns each morning now.', when: 'dead:sequins' },
        { s: 'granny', t: 'Don\'t watch the rope, dear. Watch her.', replay: true, when: { flag: 'lastWords', is: 'her' } },
        { s: 'granny', t: 'Don\'t watch the rope, dear. Watch the table.', replay: true, when: { flag: 'lastWords', not: 'her' } },
        { s: 'narrator', t: 'Ninety years she said good morning to me. I never once said it first.' },
        { choice: [
            { t: 'She was looking at me. Not the rope.' },
            { t: 'I watched the rope.' },
            { t: '…' },
        ] },
        { s: 'narrator', t: 'You put her charm on, beside yours. You hum. Only your own hum comes back.' },
        { s: 'avatar', t: 'Only mine.' },
        { s: 'narrator', t: 'Come on. Pockets, she\'d say. There are prizes left.' },
    ];

    // ---------------------------------------------------------------- Station lead-ins
    // One in-character line from the host (first visit: plus the lead, at the two required lead
    // stations), one reminder line per host the station can have (data/map.js `hosts`).

    S['station.b-south-bridge.intro'] = [
        { s: 'lamplighter', t: 'Set the levers right and the bridge comes down. Set them wrong and… it doesn\'t.' },
        { lead: true },
    ];
    S['station.b-south-bridge.reminder'] = [
        { s: 'lamplighter', t: 'Back to my levers? They don\'t mind. They\'re very patient levers.' },
    ];
    S['station.b-lamp-lane.intro'] = [
        { s: 'lamplighter', t: 'Hear my neighbours out. Then see which of them can be honest.' },
        { lead: true },
    ];
    S['station.b-lamp-lane.reminder'] = [
        { s: 'lamplighter', t: 'Whispering again. Hear them out. Every one.' },
    ];
    S['station.b-square.intro'] = [
        { s: 'mayor', e: 'nervous', t: 'Three of us. Three statements. Check them. Gently. I bruise.' },
    ];
    S['station.b-square.reminder'] = [
        { s: 'mayor', t: 'Check us again, if you like. Still not an imp. Officially.' },
    ];
    S['station.b-bakery.intro'] = [
        { s: 'baker', e: 'accusing', t: 'Check every word before you point. I\'ve been pointed at. It\'s rude.' },
    ];
    S['station.b-bakery.reminder'] = [
        { s: 'baker', t: 'More imps in the queue. Check before you point.' },
    ];
    S['station.b-post.intro'] = [
        { s: 'constable', e: 'accusing', t: 'Every answer stands on the last one. Wobble, and down it all comes.' },
    ];
    S['station.b-post.reminder'] = [
        { s: 'constable', t: 'More questions. Same story, mind. I\'ve written it down. Nearly right.' },
    ];
    S['station.b-clockmaker.intro'] = [
        { s: 'clockmaker', t: 'My bulb only lights for the right inputs. Tick, tock. Find them.' },
    ];
    S['station.b-clockmaker.reminder'] = [
        { s: 'clockmaker', t: 'Back? The bulb is still waiting. So am I. Tick.' },
    ];
    S['station.b-school.intro'] = [
        { s: 'schoolteacher', t: 'Today\'s task is on the board. Check every case, child. Guessing is for gamblers.', when: '!away:schoolteacher' },
        { s: 'gumleaf', t: 'Mr Gumleaf. Supply teacher. Miss Quill left. Through a window. So: the board.', when: 'away:schoolteacher' },
    ];
    S['station.b-school.reminder'] = [
        { s: 'schoolteacher', t: 'Back to class? Every case, child. No guessing.', when: '!away:schoolteacher' },
        { s: 'gumleaf', t: 'Oh, hello again. The board\'s still there. So are the rules, apparently.', when: 'away:schoolteacher' },
    ];
    S['station.b-clock-tower.intro'] = [
        { s: 'constable', e: 'accusing', t: 'Harder questions up here. Your first answers had better hold the rest.' },
    ];
    S['station.b-clock-tower.reminder'] = [
        { s: 'constable', t: 'Again? From the top, then. Same story.' },
    ];
    S['station.b-stairs.intro'] = [
        { s: 'clockmaker', t: 'One switch hides behind a curtain. The Mayor wanted that. He paid in bread.' },
    ];
    S['station.b-stairs.reminder'] = [
        { s: 'clockmaker', t: 'The hidden switch is still hidden. That\'s its whole job.' },
    ];
    S['station.b-town-hall.intro'] = [
        { s: 'granny', t: 'Every row, dear. Every row. And do hurry. Politely.' },
    ];
    S['station.b-town-hall.reminder'] = [
        // After Achilles has arrived (Ch3), her charm hums with his voice here. Never before.
        { when: ACHILLES_HERE, then: [
            { s: 'granny', hum: true, t: '', u: 'Coach here. Her charm went quiet somewhere near you. …I\'m listening. Slowly, for once.' },
        ] },
        { s: 'granny', t: 'Back, dear? Every row. The water\'s still warm.', when: { all: ['!dead:granny', { not: { seen: 'ch2.hall.win' } }] } },
        { s: 'constable', t: 'I\'m guarding the door. Somebody has to.', when: { any: ['dead:granny', { seen: 'ch2.hall.win' }] } },
    ];
})(typeof window !== 'undefined' ? window : globalThis);
