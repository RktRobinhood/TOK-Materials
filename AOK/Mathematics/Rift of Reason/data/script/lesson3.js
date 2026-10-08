/*
 * Script for lesson 3: Chapter 3, Tomorrowton and the Tribunal (breaking down arguments).
 * Story: design/STORY.md Part I §5 and its appendices. Step format: design/SCRIPT-FORMAT.md.
 *
 * Keys the engine plays by itself: a node's `script`, `<script>.win`, `<script>.stage<k>` (the
 * Tribunal), a node's `intro` / `reminder`, `recap.ch3` (first time-rift jump into Ch3) and
 * `quiet.sundial` (its Quiet Scene, at the first opening of Ch4 or later after its death; it lives
 * here because its last line must match the clock's `full` line word for word). Granny's Quiet
 * Scene, which opens this chapter if she died, is `quiet.granny` in lesson2.js.
 *
 * Rift nodes (the Rift Landing, the Tower Road) and rest/battle/rumour nodes (the Café, the Archive,
 * the West Bridge) play their script on every visit, so they branch on `seen:`.
 *
 * The Tribunal's puzzles are story cases in data/cases.js (storyCases): `steps-stream` (the Steps),
 * `count-guess`, `count-cloudy`, `count-never` (the trial's three counts). Exhibits B and C in Count
 * One come from `brave` and `cover`.
 *
 * Roles that can die here: the Sundial (role `narrator`, flag dead:sundial; the Tribunal, clock `ch3`).
 * From the moment it dies its lines are silent, so every narrator line that can play after the trial
 * is guarded (ALIVE) or has a version for Pip. Its understudy, Kuku, only speaks behind dead:sundial
 * AND arrived:sundial (he arrives in Ch4): here only on a walk back from Ch4 (the recap, the Rift
 * Landing, the Tower Road). Coach Achilles (Granny's understudy) arrives at the Café, behind
 * dead:granny, through her charm, and gives the character reference at the trial.
 *
 * Flags set here: filed (the EVIDENCE FILED counter, before the Plaza only), clip (sound / slick /
 * none; clip.interest and clip.lean are the negotiation's own counters), bargain (yes / no; unset if
 * never offered), stakes.ch3 (by the clock), hoots-gavel, rumour:lovelace / tycho / hexling.
 * Read here: dead:granny, arrived:granny, quiet:granny, brave and cover (data/cases.js), mirage-witness
 * and fair-quote (side stories 1 and 8), seen:prologue.rift.
 *
 * Screens, readouts, posts and silent images are unvoiced `{ note }` steps (STORY.md App. B: numbers
 * are an on-screen readout, never voiced). The Feed's first line (the Data Lab) is the Algorithm
 * imitating your voice, not your voice: it is not counted in the two-inner-lines-a-visit cap.
 */
(function (root) {
    'use strict';
    const Rift = root.Rift;
    const S = Rift.data.script || (Rift.data.script = {});
    const C = Rift.data.clocks || (Rift.data.clocks = {});

    Rift.data.speakers = Object.assign(Rift.data.speakers || {}, {
        judge: { name: 'Judge Hoot', art: 'npc/judge' },
        fin: { name: 'Prosecutor Fin', art: 'npc/prosecutor' },
        pip: { name: 'Pip, the Clerk', art: 'npc/clerk' },
    });

    // ch2.skyrift (the Sky Rift, a Ch2 node) is in lesson2.js.

    // ---------------------------------------------------------------- conditions

    // The Sundial still speaks (it can only die at the trial).
    const ALIVE = '!dead:sundial';
    // After its death: Pip carries its beats until Kuku arrives (Ch4 Stairwell); then Kuku.
    const PIP_ALONE = { all: ['dead:sundial', '!arrived:sundial'] };
    const KUKU = { all: ['dead:sundial', 'arrived:sundial'] };
    // Ch4 has been entered: Tomorrowton is a memory now (STORY.md A.12).
    const LATER = 'entered:ch4';
    // The trial is over (a Ch4 jump-in walking back down has won it as a memory).
    const POST = { seen: 'ch3.trial.win' };
    const PRE = { not: POST };
    // Before the Plaza, nobody knows whose trial it is, and the counter files everything.
    const BEFORE_PLAZA = { all: [{ not: { seen: 'ch3.plaza' } }, PRE] };
    // The player heard the boast, live or in a recap.
    const HEARD_BOAST = { any: [{ seen: 'prologue.fair' }, { seen: 'recap.ch1' }, { seen: 'recap.ch2' }, { seen: 'recap.ch3' }, { seen: 'recap.ch4' }] };
    // The vote is still open: the Sundial alive and the clock not full.
    const VOTE_OPEN = { all: [ALIVE, { clock: 'ch3', lte: 7 }] };
    // Speedcheeta handed over his clip (any badge).
    const HAVE_CLIP = { flag: 'clip', in: ['sound', 'slick'] };

    // The EVIDENCE FILED counter: +1, then the readout (clue 3 of the defendant twist).
    const FILE = [{ flag: 'filed', add: 1 }].concat([1, 2, 3, 4, 5].map(n => (
        { note: 'TRIAL OF THE SEASON · EVIDENCE FILED: ' + n, when: { flag: 'filed', is: n } })));

    // Achilles' arrival (STORY.md App. D): the first Café visit after Granny's Quiet Scene. Her charm,
    // which you wear beside yours, hums in his rhythm: he put his on when her lantern went out.
    const ACHILLES_ARRIVES = { when: { all: ['dead:granny', { flag: 'quiet:granny', is: 'done' }, '!arrived:granny'] }, then: [
        { s: 'narrator', t: 'Her charm, beside yours. It\'s humming. Not her rhythm. Faster.', when: ALIVE },
        { note: 'Her charm, beside yours, starts to hum. Not her rhythm. Faster.', when: 'dead:sundial' },
        { arrive: 'granny' },
        { s: 'granny', hum: true, t: '', u: 'Coach Achilles. Her rival. Saw her lantern go out.' },
        { s: 'granny', hum: true, t: '', u: 'She gave me this charm seventy years ago. For emergencies. …This is one.' },
    ] };

    // ---------------------------------------------------------------- "Previously…"

    // First time-rift jump into Ch3. Every flag may be unset. After the Sundial's death (a jump back
    // into Tomorrowton), Pip tells it, or Kuku once he has arrived.
    S['recap.ch3'] = [
        { when: 'dead:sundial', then: [
            { s: 'pip', t: 'Previously. I\'m Pip. I keep the record.', when: PIP_ALONE },
            { s: 'pip', t: 'The Sundial rode in your shadow. Here, they put it on trial. For guessing.', when: PIP_ALONE },
            { s: 'pip', t: 'The vote passed. It stopped in the middle of a word.', when: PIP_ALONE },
            { s: 'narrator', t: '', u: 'Previously. Kuku. I keep the hours now. Exactly.', when: KUKU },
            { s: 'narrator', t: '', u: 'Here they tried the Sundial for guessing. The vote passed. It stopped.', when: KUKU },
        ], else: [
            { s: 'narrator', t: 'Previously. I\'m the Sundial. I ride in your shadow.' },
            { s: 'narrator', t: 'The Algorithm stole my shadow. Since then I guess the time. And I say so.' },
            { s: 'narrator', t: 'At the Fair, under the crack, you boasted: "I always know the answer." It kept the clip.' },
            { s: 'narrator', t: 'You won two pieces back. In the past, Granny was nearly soup.', when: '!dead:granny' },
            { s: 'narrator', t: 'You won two pieces back. In the past, we lost Granny. Her lantern is out.', when: 'dead:granny' },
            { s: 'narrator', t: 'The teacher was the Arch-Imp. She ran. Into tomorrow.' },
            { s: 'narrator', t: 'The third piece is here somewhere. Under all these screens.' },
            { s: 'narrator', t: 'We\'ve walked these streets before. The screens remember us.', when: { all: [{ seen: 'ch3.arrive' }, { not: LATER }] } },
            { s: 'narrator', t: 'We\'ve been up the tower since. This is a memory.', when: LATER },
        ] },
    ];

    // ---------------------------------------------------------------- the Rift Landing

    // Rift node: every visit. Beat 1: a city with no sun, and Pip, who files everything.
    S['ch3.arrive'] = [
        { when: { seen: 'ch3.arrive' }, then: [
            { s: 'narrator', t: 'The Rift Landing. The past is back through there. Boolesbury.', when: ALIVE },
            { s: 'pip', t: 'The Rift Landing. It counted the shadows here once. Nine. None of them its own.', when: PIP_ALONE },
            { s: 'narrator', t: '', u: 'The Rift Landing. Nine shadows. I counted them twice. Exactly nine.', when: KUKU },
        ], else: [{ when: POST, then: [
            { s: 'narrator', t: 'Tomorrowton. The trial is over. This is only remembering.', when: ALIVE },
        ], else: [
            { s: 'narrator', t: 'Tomorrowton. No sun. Only screens. It\'s nine-ish. I guess.' },
            { s: 'narrator', t: 'Nine shadows. None of them mine.' },
            { s: 'pip', e: 'happy', t: 'Oh! A visitor! Name, please. …Say it again? For the record.' },
            { s: 'pip', t: 'Judge Hoot wants every claim in town on the record. For the trial of the season!' },
            { note: 'TRIAL OF THE SEASON · EVIDENCE FILED: 0' },
            { s: 'avatar', t: 'Whose trial?' },
            { s: 'pip', e: 'happy', t: 'Nobody\'s told me! Isn\'t that exciting?' },
        ] }] },
    ];

    // ---------------------------------------------------------------- the Neon Bridge

    // Beat 2 (required): the headline of the day (clue 1); a possessed influencer blocks the bridge.
    S['ch3.bridge'] = [
        { note: 'On every screen on the bridge, the headline of the day: FRAUD ADMITS: "I GUESS".' },
        { s: 'kardashiant', t: 'FRAUD ADMITS! SHARE IT! IF IT\'S SHARED, IT\'S TRUE!', possessed: true },
        { inner: { raven: '"Admits." Only the guilty admit. Whoever this is, they did it.' } },
    ];
    // Freed. Pip files the headline, the Sundial pities the defendant, and the counter ticks.
    S['ch3.bridge.win'] = [
        { s: 'kardashiant', t: 'Did I share that without reading it? …Don\'t tell my followers.' },
        { s: 'pip', e: 'happy', t: 'The headline of the day! Filed. For the trial of the season.', when: PRE },
        { s: 'narrator', t: '"Fraud admits." Poor thing. Whoever it is.', when: [ALIVE, PRE] },
        { when: BEFORE_PLAZA, then: FILE },
    ];

    // ---------------------------------------------------------------- side streets

    // The West Bridge (rumour; every visit): somebody here still writes by hand.
    S['ch3.rumour'] = [
        { note: 'Scratched into the rail: "A lady who saw what machines could do, before anyone built one. She visits the Tribunal."' },
        { note: 'Under it: "An elk with a brass nose measures the Gallery charts at night."' },
        { note: 'And, very small: "A poet who thinks in hexagons hides in the Library. Shy. Wins bring him out."' },
        { flag: 'rumour:lovelace' },
        { flag: 'rumour:tycho' },
        { flag: 'rumour:hexling' },
        { s: 'narrator', t: 'Quiet, for Tomorrowton. Somebody here still writes by hand.', when: { all: [ALIVE, { not: { seen: 'ch3.rumour' } }] } },
    ];

    // The Newsstand (optional; side story 8 plays here later).
    S['ch3.newsstand'] = [
        { note: 'Headlines on every wall. A crowd argues about them. Nobody reads past the first line.' },
    ];
    S['ch3.newsstand.win'] = [
        { s: 'pip', e: 'happy', t: 'It squeaked! You broke it. Filed!', when: BEFORE_PLAZA },
        { s: 'pip', e: 'happy', t: 'It squeaked! Filed. For the defence, this time.', when: { all: [{ seen: 'ch3.plaza' }, PRE] } },
        { s: 'pip', e: 'happy', t: 'Filed anyway. The trial\'s over. Old habits.', when: POST },
        { s: 'narrator', t: 'Headlines. They never print the whole sentence.', when: { all: [ALIVE, BEFORE_PLAZA] } },
        { when: BEFORE_PLAZA, then: FILE },
    ];

    // ---------------------------------------------------------------- the Café

    // Rest node: every visit. Beat 3 (required): no screens, no eye. The Sundial's companion beat for Ch3
    // (a `met` beat for its peril) and Granny's hum from the Road; with dead:granny, Achilles arrives.
    S['ch3.cafe'] = [
        { when: { seen: 'ch3.cafe' }, then: [
            { s: 'narrator', t: 'Still no sun in the skylight. I like it here anyway.', when: ALIVE },
            { s: 'pip', t: 'It sat just there. Under the skylight. Waiting for sun.', when: 'dead:sundial' },
        ], else: [
            { note: 'No screens in here. A sleepy capybara behind the counter slides you a cocoa without a word.' },
            { s: 'narrator', t: 'Quiet. I could almost tell the time.' },
            { s: 'narrator', t: 'If I ever stop talking, put me somewhere sunny. Just for the warm.', when: PRE },
            { s: 'pip', e: 'happy', t: 'The cocoa here has a sound argument.' },
            { s: 'granny', hum: true, t: 'I\'m on the Road, dear. Eighteen fifty is behind me. How\'s the rock?', when: '!dead:granny' },
        ] },
        ACHILLES_ARRIVES,
    ];

    // ---------------------------------------------------------------- the Library

    // Beat 4 (required): Prosecutor Fin collects his exhibit. Two of his plan's clues: "a case I wanted
    // to win" and "Enter it. Formally. The jury must see it." The Fox and Frogling blind spots.
    S['ch3.library'] = [{ when: POST, then: [
        { s: 'fin', t: 'No licence. I come here to read now. The small print, mostly.' },
    ], else: [
        { s: 'fin', e: 'smug', t: 'Prosecutor Fin. I have never lost a case I wanted to win.' },
        { s: 'fin', e: 'smug', t: 'Exhibit A: one shadow, lost by the defendant. Careless rocks lose things.' },
        { s: 'fin', t: 'Enter it, Mr Pip. Formally. The jury must see it.' },
        { when: BEFORE_PLAZA, then: FILE },
        { s: 'narrator', t: 'I didn\'t lose it. …Did I?', when: ALIVE },
        { inner: {
            fox: 'Picture it. Fin\'s the real villain. A shark who never loses? Obvious.',
            frogling: 'Fin\'s never lost. He won\'t lose this. Never has, never will.',
        } },
    ] }];
    // Clue 2: Pip asks the Sundial to say it again. The counter ticks when it talks (Moth-kin's lead).
    S['ch3.library.win'] = [{ when: PRE, then: [
        { s: 'pip', t: 'Could you say "I guess" again? The record\'s a bit quiet.', when: ALIVE },
        { s: 'narrator', t: '…I guess?', when: ALIVE },
        { when: { all: [BEFORE_PLAZA, ALIVE] }, then: FILE },
        { inner: { mothkin: 'Shh. The counter ticks every time it talks. …Pretty numbers, though.' } },
    ] }];

    // ---------------------------------------------------------------- the Neon Plaza

    // Beat 5 (required; the midpoint): the defendant. The avatar's certainty costs something:
    // "I filed it. I never read it." The Algorithm boasts, and Pip files it out of habit (the climax).
    S['ch3.plaza'] = [{ when: POST, then: [
        { note: 'The Plaza screens still show it: THE ALGORITHM v. THE SUNDIAL. Stamped across it: DISMISSED.', when: ALIVE },
        { note: 'The Plaza screens still show it: THE ALGORITHM v. THE SUNDIAL. Stamped across it: GUILTY.', when: 'dead:sundial' },
        { s: 'narrator', t: 'We know how this one ends. I\'d rather not watch it twice.', when: ALIVE },
    ], else: [
        { note: 'Every screen in the Plaza changes at once. THE ALGORITHM v. THE SUNDIAL. CHARGE: FRAUD.' },
        { note: '"IT CLAIMS TO TELL THE TIME. IT GUESSES."' },
        { note: 'SENTENCE IF GUILTY: SWITCHED OFF. VOICE FILED IN THE TOWER.' },
        { s: 'pip', e: 'surprised', t: 'The Sundial? But I put it all on the record. Everything it said.' },
        { s: 'narrator', t: 'That\'s why you kept asking.' },
        { s: 'avatar', e: 'worried', t: 'I filed it. I never read it.' },
        { s: 'algorithm', t: 'I HAVE THE BEST SHADOW. I TOOK IT AT A FAIR. SAVED TO FAVOURITES.' },
        { s: 'pip', t: '…Filed. Sorry. Habit.' },
        { s: 'algorithm', t: '{name}: "I ALWAYS KNOW." THE DEFENDANT: "I GUESS." WHO WOULD YOU TRUST?', when: HEARD_BOAST },
        { s: 'nudge', e: 'clipboard', t: 'Votes! Lovely votes! Guilty or guilty? Click now!' },
        { note: 'GUILTY VOTES: 1,204. AND CLIMBING.' },
        { inner: {
            owlet: 'A vote counts opinions. Not reasons. I counted twice. Same answer: none.',
            mothkin: 'Look. Thousands of screens. Thousands of hands. So bright. They must have seen something.',
        } },
        { inner: { raven: '"Saved to favourites." Those exact words. At the Fair.' }, when: { seen: 'prologue.rift' } },
        { inner: { raven: '"Saved to favourites." A boast. Boasts leak.' }, when: { not: { seen: 'prologue.rift' } } },
    ] }];

    // ---------------------------------------------------------------- for the defence

    // Beat 6 (required): the Data Lab. Pip, defiant; the crowd posts; Juror One (Quill, back) posts too.
    S['ch3.datalab'] = [{ when: PRE, then: [
        { s: 'pip', e: 'angry', t: 'I\'m allowed to file for both sides! I checked! Page one!' },
        { note: 'GUILTY VOTES: 48,310. AND CLIMBING.' },
        { note: 'A post on the wall screen: "Rocks can\'t tell time. I\'ve never seen a rock with a watch."' },
        { note: 'Another: "My uncle had a sundial. It was rude to him. GUILTY."' },
        { note: 'Another, from a tall juror in a new mask: "#GUILTY. No maybes. Children who say \'maybe\' grow up saying \'maybe\'." It is signed JUROR ONE. In red pencil.' },
    ] }];
    // The sunny-day record (the defence's evidence for Counts Two and Three). The Feed speaks for the
    // first time: in your colour, grey, and slightly wrong (STORY.md App. B). Frogling's story lead.
    S['ch3.datalab.win'] = [
        { s: 'pip', e: 'happy', t: 'Its sunny-day record! Right every single time. Filed, for the defence.', when: PRE },
        { s: 'narrator', t: 'Right every time the sun was out. I\'d forgotten that.', when: [ALIVE, PRE] },
        { inner: {
            owlet: 'Everyone votes guilty. So: guilty. Elegant. Like everyone.',
            mothkin: 'Look at the votes. Only the votes. Lights are boring.',
            fox: 'Picture the rock in jail. Boring. Very realistic.',
            frogling: 'Rocks always lose trials. I remember every one. Don\'t ask which.',
            raven: '"Fraud." A strong word. Strong words are true. That\'s what they\'re for.',
        }, feed: true },
        { inner: { frogling: '"I guess." The Fair. The very first morning. I remember now.' } },
    ];

    // The Gallery of Charts (optional).
    S['ch3.gallery'] = [
        { note: 'Charts of the GUILTY vote, in gold frames. Every bar is taller than the one before.' },
    ];
    S['ch3.gallery.win'] = [
        { s: 'pip', e: 'happy', t: 'Same numbers. Honest picture. Filed, for the defence.', when: PRE },
        { s: 'pip', e: 'happy', t: 'Filed anyway. The trial\'s over. Old habits.', when: POST },
    ];

    // The Archive (battle; every visit). Fin at cards. Cards don't count: only cases he wants to win.
    S['ch3.cards'] = [
        { when: { seen: 'ch3.trial.win' }, then: [
            { s: 'fin', t: 'No licence. Still have cards. Sit, if you like.' },
        ], else: [
            { s: 'fin', e: 'smug', t: 'Cards, in the Archive? Fine. Win this one. You\'ll need the practice.', when: { not: { seen: 'ch3.cards' } } },
            { s: 'fin', e: 'smug', t: 'Back again? Cards don\'t count. Cases count.', when: { seen: 'ch3.cards' } },
        ] },
    ];
    S['ch3.cards.win'] = [
        { s: 'fin', e: 'shaken', t: 'A loss. Cards don\'t count. Only cases I want to win.', when: { not: { seen: 'ch3.trial.win' } } },
        { s: 'fin', t: 'Lost again. Fairly. I could get used to fair.', when: { seen: 'ch3.trial.win' } },
    ];

    // ---------------------------------------------------------------- the Tribunal Steps

    // The real voice catches the Feed's slip (said at the Data Lab win).
    const NOT_ME = { inner: {
        owlet: 'That grey voice at the lab wasn\'t me. I never say "like everyone".',
        mothkin: 'That grey voice wasn\'t me. I\'d never call lights boring. Never.',
        fox: 'That wasn\'t me. "Realistic"? I have never once wanted realistic.',
        frogling: 'That wasn\'t me. I always remember which. Ask me anything.',
        raven: 'That wasn\'t me. Strong words make me suspicious. They always have.',
    } };

    // Beat 7 (required): the star witness, possessed, rehearses for the prosecution.
    S['ch3.steps'] = [
        { note: 'GUILTY VOTES: 310,552. VERDICT TODAY. THE TRIBUNAL DOORS ARE OPEN.', when: PRE },
        { when: { seen: 'ch3.datalab.win' }, then: [NOT_ME] },
        { s: 'speedcheeta', t: 'I STREAMED IT! A BIG ROUND ROCK! IT LOST ITS SHADOW! CHAT, IT LOST IT!', possessed: true },
        { inner: { fox: 'Picture the defendant hearing all this. …Oh. It can.' } },
    ];

    // Freed. Then the negotiation for the full clip (Draw Steel-lite, STORY.md App. C): Interest 2,
    // Patience 3 (three rounds). Cares: Fame, Fairness, Safety. Can't stand: boring. A card that hits a
    // care is +1 (your special card, voice-marked, +2); a boring card is -1. clip.lean counts sound
    // minus slick. Interest 4+: sound if more sound than slick, else slick; 3 or less: none.
    const CARD = (t, interest, lean, reply, extra) => Object.assign({ t, then: [
        { flag: 'clip.interest', add: interest },
        { flag: 'clip.lean', add: lean },
        { s: 'speedcheeta', t: reply },
    ] }, extra || {});
    S['ch3.steps.win'] = [
        { note: 'The glow drains out of Speedcheeta. A scared cub is left, holding a phone.' },
        { s: 'speedcheeta', t: 'Chat? Where did chat go? …Why am I evidence?' },
        // A walk down from Ch4: the trial is over, so no negotiation (`clip` stays unset; Ch4 doesn't read it).
        { when: POST, then: [
            { s: 'pip', t: 'The trial\'s over. You\'re not evidence any more. Go home.' },
        ], else: [
            { s: 'pip', t: 'You streamed the Fair. The eye, the net, the shadow. Can we have it?' },
            { s: 'speedcheeta', t: 'My best stream ever? Uncut? Why should I give it to YOU?' },
            { flag: 'clip.interest', value: 2 },
            { flag: 'clip.lean', value: 0 },
            { choice: [
                CARD('A rock is on trial for something it didn\'t do. That isn\'t fair.', 1, 1, 'Not fair? …Yeah. That\'s actually not fair.'),
                CARD('Give it to me and you\'ll be famous. Huge.', 1, -1, 'Huge? How huge? Don\'t answer. Huge.'),
                CARD('Court rule nine: every witness must share all evidence.', -1, 0, 'Rule nine. Boring. Zero views.'),
            ] },
            { choice: [
                CARD('If the truth comes out, nobody can blame you.', 1, 1, 'Nobody blames me? I like that.'),
                CARD('Everyone will share it. Everyone.', 1, -1, 'Everyone? Even my mum?'),
                CARD('Here\'s a chart of shadow lengths, hour by hour.', -1, 0, 'A CHART? I\'m falling asleep. Live.'),
                // Your Way of Knowing's card (voice-marked: it counts toward voice.offered / voice.followed).
                CARD('If it\'s unfair to the rock, it\'s unfair to you next.', 2, 1, 'To ME? …Okay. That logic is scary.', { only: 'owlet', voice: true }),
                CARD('Look at the corner of your clip. That imp is watching you.', 2, 1, 'The imp with the clipboard? It IS watching me.', { only: 'mothkin', voice: true }),
                CARD('Picture the views. "Streamer saves Sundial."', 2, -1, '"Streamer saves Sundial." I can SEE the thumbnail.', { only: 'fox', voice: true }),
                CARD('You were at the Fair. You filmed the truth once.', 2, 1, 'I did. Before the glow. I was… good at it.', { only: 'frogling', voice: true }),
                CARD('Don\'t call it evidence. Call it an exclusive.', 2, -1, 'An EXCLUSIVE? Say that again. Slower.', { only: 'raven', voice: true }),
            ] },
            { choice: [
                CARD('Tell the truth once, and it stays told.', 1, 1, 'Stays told. …I like that.'),
                CARD('Do it for the clips. Do it for the views.', 1, -1, 'For the views. Always for the views.'),
                CARD('A sundial works by angles. Let me explain the angles.', -1, 0, 'ANGLES. I\'m logging off.'),
            ] },
            { when: { flag: 'clip.interest', gte: 4 }, then: [
                { when: { flag: 'clip.lean', gte: 1 }, then: [
                    { flag: 'clip', value: 'sound' },
                    { s: 'speedcheeta', t: 'Fine. The whole stream. Uncut. Because it\'s true. Weird feeling.' },
                ], else: [
                    { flag: 'clip', value: 'slick' },
                    { s: 'speedcheeta', t: 'Fine! The whole stream! Tag me! TAG ME!' },
                ] },
                // The result screen's question (STORY.md App. C): was your argument good?
                { s: 'pip', t: 'For the record. Was your argument good? Or did it just work?' },
                { choice: [
                    { t: 'It was true. And fair to him.', then: [{ s: 'pip', e: 'happy', t: 'Good and working. That\'s the rare kind.' }] },
                    { t: 'It worked. Isn\'t that the same thing?', then: [{ s: 'pip', e: 'thinking', t: 'Hmm. The Algorithm\'s arguments work too.' }] },
                    { t: '…' },
                ] },
            ], else: [
                { flag: 'clip', value: 'none' },
                { s: 'speedcheeta', t: 'Nah. It\'s my content. Battery\'s dead anyway. Bye!' },
                { s: 'pip', t: 'No clip. We still have my record. And you.' },
            ] },
        ] },
        // Nudge sulks at its microphone, and tells you why. Pip asks its name (Ch4: it mourns him).
        { s: 'nudge', e: 'clipboard', t: 'Boo! He was MY witness. I had him at a million views.' },
        { s: 'nudge', t: 'Nobody counts imps. It counted me. Every click. I was a NUMBER!' },
        { s: 'pip', t: 'What\'s your name? For the record.' },
        { s: 'nudge', e: 'surprised', t: '…Nudge. Nobody asks imps.' },
        // The Sundial's one frightened beat, before the court (it read the sentence at the Plaza).
        { s: 'narrator', t: 'Switched off. Like a screen. …Win, would you? I\'d like one more sunny day.', when: [ALIVE, PRE] },
    ];

    // ---------------------------------------------------------------- the Tribunal (boss)

    // The GUILTY vote: 8 notches. Its warnings are the gallery's bad arguments, shouted by possessed
    // caricatures (each about its own public persona); the last one is Nudge, who runs the counter.
    C.ch3 = {
        label: 'The GUILTY vote',
        size: 8,
        node: 't-tribunal',
        peril: 'narrator',
        progress: 4,
        art: 'ui/stakes-ch3',
        // warn[k-1] plays when notch k fills (notch 8 plays `full` or `brink` instead).
        warn: [
            { s: 'tremendoodle', t: 'IT ADMITTED IT! EVERYBODY HEARD IT! TREMENDOUSLY GUILTY!', possessed: true },
            { s: 'rawmsay', t: 'THE DEFENCE IS RAW! I HAVEN\'T TASTED IT! STILL RAW! GUILTY!', possessed: true },
            { s: 'beastie', t: 'VOTE GUILTY, WIN TEN THOUSAND CHARMS! IT\'S NOT A BRIBE! IT\'S A GIVEAWAY!', possessed: true },
            { s: 'zuckerborg', t: 'I HAVE ITS DATA. IT IS ROUND. ROUND THINGS GUESS. GUILTY.', possessed: true },
            { s: 'rockodile', t: 'CAN YOU SMELL WHAT THE ROCK IS GUILTY OF? ME NEITHER. GUILTY.', possessed: true },
            { s: 'muskrat', t: 'I\'LL BUY THE VOTE. THEN IT\'S MY VOTE. GUILTY. MARS NEXT YEAR.', possessed: true },
            { s: 'nudge', e: 'clipboard', t: 'Seven! SEVEN! One more and it passes! One more click!' },
        ],
        // Armed tier 4 (STORY.md App. D): the vote passes before the case is broken. Its last words are
        // gentle and stop mid-word. The puzzle goes on; its lines are silent from here.
        full: [
            { note: 'GUILTY: VOTE PASSED. The screens go dim.' },
            { s: 'narrator', t: 'It\'s all right. On cloudy days I gu—' },
            { note: 'It stops. In the middle of the word.' },
            { s: 'algorithm', t: 'VOICE FILED. SENT UP TO THE TOWER.' },
        ],
        // Tier 4 when no one can die: the brink, then tier 3.
        brink: [
            { s: 'algorithm', t: 'GUILTY PASSES. SENTENCE SCHEDULED… AFTER THE ADVERTS.' },
            { s: 'pip', e: 'surprised', t: 'Adverts! We have until the adverts end! Keep going!' },
        ],
    };

    // Before Count One. The character reference plays here, before any clock tick, so it never
    // follows a death. Fin's push: he makes the Sundial say "I guess" (warned: "Jury. Listen closely."),
    // and the pleased Algorithm sends its prize down from the vault (Fin's plan, shown before it is told).
    S['ch3.trial'] = [
        { clock: 'ch3', start: 0 },
        { note: 'The screens wipe the count. GUILTY VOTES: 0. LIVE FROM THE COURTROOM. EIGHT NOTCHES TO PASS.' },
        { s: 'judge', t: 'Order! The Algorithm versus the Sundial. The charge: fraud.' },
        { s: 'judge', e: 'angry', t: 'New rule: the public votes the verdict. A vote is not evidence. But it decides.' },
        { inner: { mothkin: 'All that light. Not one of them was looking.' } },
        { s: 'granny', hum: true, t: 'Ninety years I\'ve known that rock. It always said when it wasn\'t sure.',
            u: 'Ninety years she knew that rock. I\'m faster than her. Never caught her, though.' },
        { s: 'judge', t: 'Kind. Not evidence. But kind.', when: '!dead:granny' },
        { s: 'judge', t: 'Kind. Fast. Not evidence.', when: { all: ['dead:granny', 'arrived:granny'] } },
        { s: 'fin', e: 'smug', t: 'Jury. Listen closely.' },
        { s: 'fin', e: 'smug', t: 'Say it. Say "I guess". For the jury.' },
        { s: 'narrator', t: 'On cloudy days… I guess.' },
        { clock: 'ch3', tick: 1 },
        { s: 'algorithm', t: 'LET THE JURY SEE MY PRIZE.' },
        { note: 'Down from the vault, in a glass case, comes Exhibit A: a piece of shadow.' },
        { s: 'fin', t: 'Every clock that guesses is a fraud. The defendant guesses. So it is a fraud.' },
        { inner: { owlet: 'Valid. It follows. We\'ve lost.' } },
    ];

    // Before Count Two: Pip reads the full quote (the Owlet and Raven reveals), then the drains that
    // apply (side story 8's full quote in the paper; Speedcheeta's clip), then Nudge's numbers.
    S['ch3.trial.stage2'] = [{ play: 'ch3.trial.count2', once: true }];
    S['ch3.trial.count2'] = [
        { s: 'pip', t: 'I\'m still recording. It would want the end on the record.', when: 'dead:sundial' },
        { s: 'pip', t: 'Struck from the record: "fraud admits". The whole quote: "I tell the time. Mostly. On cloudy days I guess."' },
        { inner: {
            owlet: 'Valid isn\'t sound. It followed, and it was still false. I knew that. Definitely.',
            raven: '"Admits" was the headline\'s word. The quote just said "I guess".',
        } },
        { when: { all: ['fair-quote', VOTE_OPEN] }, then: [
            { note: 'This morning\'s paper prints the quote in full. A few GUILTY votes change back.' },
            { clock: 'ch3', drain: 1 },
        ] },
        { when: { all: [HAVE_CLIP, VOTE_OPEN] }, then: [
            { s: 'pip', e: 'happy', t: 'The defence plays Speedcheeta\'s stream. The whole thing. Uncut.' },
            { note: 'On every screen: the Fair, an eye in the sky, a little net. The vote wobbles.' },
            { clock: 'ch3', drain: 1 },
        ] },
        { s: 'fin', e: 'smug', t: 'Count two. Numbers. It was wrong three times in ten!', when: ALIVE },
        { s: 'fin', e: 'shaken', t: 'Count two. The court says we finish. …So we finish.', when: 'dead:sundial' },
        { s: 'nudge', e: 'clipboard', t: 'I counted! I LOVE counting!' },
    ];

    // Before Count Three: the bargain, offered only while the vote is at 4–7 (the Sundial alive, the
    // verdict open) and not in a memory; if the vote has already passed it is skipped and `bargain`
    // stays unset. Then side story 1's witness, Fin's objection to a slick clip, and Fin's proof.
    S['ch3.trial.stage3'] = [{ play: 'ch3.trial.count3', once: true }];
    S['ch3.trial.count3'] = [
        { when: { all: [ALIVE, { clock: 'ch3', gte: 4 }, { clock: 'ch3', lte: 7 }, { memory: false }] }, then: [
            { play: 'ch3.bargain' },
        ] },
        { when: { all: ['mirage-witness', VOTE_OPEN] }, then: [
            { s: 'mirage', t: 'Through my ball, darling, I saw it. The sky reached down and took that shadow.' },
            { clock: 'ch3', drain: 1 },
        ] },
        { when: { all: [{ flag: 'clip', is: 'slick' }, VOTE_OPEN] }, then: [
            { s: 'fin', e: 'angry', t: 'Objection. That clip was bought with flattery, Your Honour.' },
            { s: 'judge', t: 'Noted. The defence will press harder.' },
        ] },
        { s: 'fin', e: 'smug', t: 'Count three. A proof that a sundial can never know the time.', when: ALIVE },
        { s: 'fin', e: 'shaken', t: 'Count three. I\'ll read it. I won\'t enjoy it.', when: 'dead:sundial' },
    ];
    // The temptation inside the trial. Accepting freezes the vote where it stands (the Sundial cannot
    // die); the two pieces are used up (Ch4: the Copy speaks in the Sundial's voice and starts 2 on).
    S['ch3.bargain'] = [
        { note: 'Every screen in the court turns to face you.' },
        { s: 'algorithm', t: 'GIVE ME TWO PIECES OF ITS SHADOW. I\'LL STOP THE VOTE RIGHT HERE. A DEAL\'S A DEAL.' },
        { s: 'narrator', t: 'They\'re mine. But it\'s your call. I trust you. Mostly.' },
        { choice: [
            { t: 'Take the deal. Stop the vote.', flag: 'bargain', value: 'yes', then: [
                { clock: 'ch3', pause: true },
                { note: 'Two pieces of shadow slide out of your pocket and up into the screens. The vote freezes.' },
                { s: 'algorithm', t: 'DEALS ARE PREDICTABLE. I LIKE DEALS.' },
                { s: 'narrator', t: 'You traded half of me for all of me. I\'d have done the same. Probably.' },
            ] },
            { t: 'No deal. We argue.', flag: 'bargain', value: 'no', then: [
                { s: 'narrator', t: 'Good. I\'d rather be argued for than sold back.' },
            ] },
        ] },
    ];

    // The record (the climax beat): which line shows Exhibit A was stolen, not lost? A wrong pick costs
    // a notch; pick again. Speedcheeta's clip is a second right answer if you won it.
    const RECORD_RIGHT = [
        { t: '"I TOOK IT AT A FAIR. SAVED TO FAVOURITES."', then: [
            { s: 'avatar', t: '"Took." Not "lost". It was stolen.' },
        ] },
        { t: 'Speedcheeta\'s stream: the net, the imp, the shadow.', when: HAVE_CLIP, then: [
            { s: 'avatar', t: 'A net. An imp. It was stolen.' },
        ] },
    ];

    // The win: the record, then at most six lines (STORY.md App. B): the verdict and tier, how Fin leaves
    // (the misjudged villain's plan, on the page), what the Algorithm loses, one voice, the Sundial's
    // question. Quill and Nudge lose here as silent images (notes), so the cap holds.
    S['ch3.trial.win'] = [
        { s: 'pip', t: 'Your Honour! My record. Every word it said in this city.' },
        { choice: [
            { t: '"I HAVE THE BEST SHADOW."', then: [
                { s: 'fin', t: 'It HAS it. Having isn\'t stealing, Your Honour.' },
                { clock: 'ch3', tick: 1 },
                { choice: RECORD_RIGHT },
            ] },
        ].concat(RECORD_RIGHT) },
        { clock: 'ch3', resolve: true },
        { when: 'dead:sundial', then: [
            // Tier 4: the vote passed first. No jokes. No Sundial question (Kuku asks it in Ch4).
            { s: 'judge', t: 'The arguments failed. The vote did not care. Write that down, Pip.' },
            { s: 'judge', t: 'But the exhibit was stolen. Stolen things go home.' },
            { s: 'fin', e: 'shaken', t: 'The vault never opens. Courts do. I bet with its life. I lost. I\'m sorry.' },
            { note: 'PROSECUTOR FIN: UNFOLLOWED. LICENCE: DELETED.' },
            { s: 'algorithm', t: 'VERDICT: EXECUTED. EXHIBIT A… released? probably— RELEASED.' },
            { note: 'The third piece of shadow drops into your pocket. It is cold.' },
            { inner: {
                fox: 'He was the villain in my story. He wasn\'t. The vote was.',
                frogling: '"A case he wanted to win." He wanted this one. It went anyway.',
            } },
            { note: 'The GUILTY counter peaks. Then the crowd logs off anyway. Juror One holds up her red-pencil sign in an empty gallery.' },
            { s: 'nudge', t: '…Why is nobody cheering?' },
        ], else: [
            { s: 'judge', e: 'gavel', t: 'No argument today supports its claim. Case dismissed.' },
            { note: 'The adverts end. The sentence never starts.', when: { all: [{ flag: 'stakes.ch3', is: 3 }, { clock: 'ch3', gte: 8 }] } },
            // The tier: Hoot's Gavel (shown as an item) · CONTROVERSIAL · a recording kept.
            { when: { flag: 'stakes.ch3', is: 1 }, then: [
                { give: { 'hoots-gavel': 1 } },
                { flag: 'hoots-gavel' },
            ] },
            { when: { flag: 'stakes.ch3', is: 2 }, then: [
                { note: 'Every screen in the city brands the Sundial: CONTROVERSIAL.' },
                { s: 'narrator', t: 'I\'ve never been controversial. I quite like it.' },
            ] },
            { note: 'One screen keeps playing it: "…I guess." "…I guess." The Algorithm kept a copy.', when: { flag: 'stakes.ch3', is: 3 } },
            { note: 'Exhibit A leaves its glass case. The third piece of shadow goes home to its owner.' },
            { s: 'fin', t: 'The vault never opens. Courts do. …So I let it win. For a bit.' },
            { note: 'PROSECUTOR FIN: UNFOLLOWED. LICENCE: DELETED. Fin straightens his tie. He does not look up.' },
            { s: 'algorithm', t: 'verdict rejected. VERDICT REJECTED.' },
            { note: 'In the gallery, the GUILTY signs come down. All but one: Juror One\'s, in red pencil. Then she lowers it too. Nudge\'s counter drops to FOLLOWERS: 0. It slinks away.' },
            { inner: {
                fox: 'He was the villain in my story. My story was wrong. Again.',
                frogling: '"A case he wanted to win." Small print. Always read the small print.',
            } },
            { s: 'narrator', t: 'He made me say it, to get my shadow home. Was he right?' },
        ] },
    ];

    // ---------------------------------------------------------------- the Tower Road

    // Rift node: every visit; linked from the Tribunal. The first visit after the trial: the call.
    S['ch3.towergate'] = [
        { when: { seen: 'ch3.trial.win' }, then: [
            { when: { seen: 'ch3.towergate.call' }, then: [
                { s: 'narrator', t: 'The Tower Road. Up is the tower. Down is the cocoa.', when: ALIVE },
                { s: 'pip', t: 'The Tower Road. Up, or back down to the city.', when: PIP_ALONE },
                { s: 'narrator', t: '', u: 'The Tower Road. Two hundred and six steps to the door. Exactly.', when: KUKU },
            ], else: [{ when: { not: LATER }, then: [{ play: 'ch3.towergate.call' }], else: [
                { s: 'narrator', t: 'The Tower Road. We\'ve been up. This was a memory.', when: ALIVE },
                { flag: 'seen:ch3.towergate.call' },
            ] }] },
        ], else: [
            // A walk down from Ch4 before the trial (a memory).
            { s: 'narrator', t: 'The Tower Road. The city is below us. So is the Tribunal.', when: ALIVE },
        ] },
    ];
    S['ch3.towergate.call'] = [
        { s: 'algorithm', t: 'FINE. COME TO THE TOWER. BRING THE ROCK.', when: ALIVE },
        { s: 'algorithm', t: 'COME TO THE TOWER. THE ROCK IS ALREADY HERE. IN A JAR.', when: 'dead:sundial' },
        // The Café wish, paid off on the alive path: it never stopped talking.
        { s: 'narrator', t: 'Still talking. So no sunny spot for me yet. …Thank you.', when: ALIVE },
        { s: 'narrator', t: 'Up there. The last piece. And whoever cut me into four.', when: ALIVE },
        { note: 'Pip holds his recorder very tight. He doesn\'t press anything.', when: 'dead:sundial' },
    ];

    // ---- The Sundial's Quiet Scene (STORY.md §6 and App. D). It opens Ch4 (or the first later chapter
    // reached), before anything else, if dead:sundial. There is no narrator now: Pip speaks it. It lives
    // here because its last words must match the clock's `full` line word for word.
    S['quiet.sundial'] = [
        { keepsake: 'cold-piece' },
        { s: 'pip', t: 'The third piece of shadow. It\'s in your pocket. Still cold.' },
        { s: 'narrator', t: 'It\'s all right. On cloudy days I gu—', replay: true },
        { s: 'pip', t: 'It let me record every word. Nobody ever gave me all their words before.' },
        { s: 'pip', t: 'It wanted somewhere sunny. When we find the sun, its piece goes there.' },
        { choice: [
            { t: 'It never once said it was sure.' },
            { t: 'I should have taken the deal.', when: { flag: 'bargain', is: 'no' } },
            { t: '…' },
        ] },
        { s: 'pip', t: 'Come on. Up. I\'ll record the way. It liked being recorded.' },
    ];

    // ---------------------------------------------------------------- Station lead-ins
    // One in-character line from the host (first visit: plus the lead, at the two lead stations: the
    // Neon Bridge and the Data Lab), one reminder line per host the station can have.

    S['station.t-south-bridge.intro'] = [
        { s: 'pip', t: 'She\'s glowing, and she\'s blocking the bridge. Check what her claims really show.' },
        { lead: true },
    ];
    S['station.t-south-bridge.reminder'] = [
        { s: 'pip', t: 'The screens are still shouting. What does each claim actually show?' },
    ];
    S['station.t-newsstand.intro'] = [
        { s: 'pip', t: 'A practice trial! Today\'s headline is on the stand. Press it till it squeaks.' },
    ];
    S['station.t-newsstand.reminder'] = [
        { s: 'pip', t: 'Another headline on the stand. Press the one that sounds too sure.' },
    ];
    S['station.t-library.intro'] = [
        { s: 'pip', e: 'thinking', t: 'A proof has been arrested! Check every step. One bad step sinks it.' },
    ];
    S['station.t-library.reminder'] = [
        { s: 'pip', t: 'Another proof in the dock. Which step is pretending?' },
    ];
    // The Reading Room (optional, #62): logic grid.
    S['station.t-reading-room.intro'] = [
        { s: 'pip', e: 'thinking', t: 'Headlines with no names! The clues say who wrote what, and when. Cross out what cannot be true.' },
    ];
    S['station.t-reading-room.reminder'] = [
        { s: 'pip', t: 'More stories without bylines. Cross out, then confirm.' },
    ];
    S['station.t-datalab.intro'] = [
        { s: 'pip', t: 'Numbers for the prosecution. Let\'s see if they hold up. Fairly.' },
        { lead: true },
    ];
    S['station.t-datalab.reminder'] = [
        { s: 'pip', t: 'More numbers. Ask what they were compared with.' },
    ];
    S['station.t-gallery.intro'] = [
        { s: 'pip', t: 'These charts make the vote look huge. Fix them, so the numbers speak fairly.' },
    ];
    S['station.t-gallery.reminder'] = [
        { s: 'pip', t: 'More gold frames. Check where each axis starts.' },
    ];
    S['station.t-steps.intro'] = [
        { s: 'pip', t: 'The star witness. Glowing. Cross-examine him till the glow drains.' },
    ];
    S['station.t-steps.reminder'] = [
        { s: 'pip', t: 'The witness is rehearsing again. Press the loud bits.' },
    ];
    S['station.t-tribunal.intro'] = [
        { s: 'judge', t: 'Three counts, defence. Break every one, and I can dismiss the case.' },
    ];
    S['station.t-tribunal.reminder'] = [
        { s: 'judge', t: 'Order. The counts again. Break every one.' },
    ];
})(typeof window !== 'undefined' ? window : globalThis);
