/*
 * Script for lesson 4: Chapter 4, the Server Tower, and the finale (the Fair, Restored).
 * Story: design/STORY.md Part I §6 and its appendices. Step format: design/SCRIPT-FORMAT.md (§8b for
 * the Copy's clock, Pip's glow and the core trials).
 *
 * Keys the engine plays by itself: each Ch4 node's `script`, `<script>.win`, the core's
 * `ch4.core.stage2` / `.stage3` (before trials 2 and 3), the station lead-ins, `recap.ch4` (first
 * time-rift jump into Ch4) and `quiet.pip` (placed by a `{ quiet: 'pip' }` step at the Oracle door).
 *
 * Clocks: `copy` ({name} 2.0 · UPLOADING, built-in rules in js/core/stakes.js; this file adds the words)
 * starts at the Tower Door; `pip` (Pip's glow) runs at the Sorting Room, his one death-risk moment.
 *
 * Roles that can be silent here: `narrator` (dead:sundial; Kuku arrives at the Stairwell), `pip`
 * (dead:pip at the Sorting Room; his host slots fall back to the narrator), `granny` (Achilles),
 * `sequins` (Tally). Understudy words only ever sit in `u`, behind their dead:/arrived: flags.
 *
 * Flags set here: ch4.lr (the LEFT/RIGHT pick, read at once), copy.helped ("Just this once"),
 * gavel.used (Hoot's Gavel spent), wonder, fate, finale-open, rift-walker. Read: hoots-gavel, brave, cover, bargain, stakes.ch1/ch3/pip/ch4, feed,
 * voice.offered / voice.followed, soldiers, syllo-away, honest-label, berry, dead:*, arrived:*.
 *
 * The Copy speaks as `copy` ("You 2.0"); with the bargain it speaks in the Sundial's voice, as
 * `copy-sundial` (STORY.md §6 beat 1). No avatar line says "probably" or "mostly" before the last one.
 */
(function (root) {
    'use strict';
    const Rift = root.Rift;
    const S = Rift.data.script || (Rift.data.script = {});
    const C = Rift.data.clocks || (Rift.data.clocks = {});

    Rift.data.speakers = Object.assign(Rift.data.speakers || {}, {
        oracle: { name: 'The Oracle Machine', art: 'npc/oracle-machine' },
        colossus: { name: 'The Algorithm', art: 'npc/algorithm/colossus' },
        core: { name: 'The Algorithm (core)', art: 'npc/algorithm/core' },
        copy: { name: 'You 2.0', art: 'npc/copy' },
        'copy-sundial': { name: 'You 2.0', art: 'npc/copy' },
    });
    if (!Rift.data.speakers.pip) Rift.data.speakers.pip = { name: 'Pip, the Clerk', art: 'npc/clerk' };

    // ---------------------------------------------------------------- conditions

    const BARGAIN = { flag: 'bargain', is: 'yes' };
    const NO_BARGAIN = { flag: 'bargain', not: 'yes' };
    // The Sundial is gone and Kuku has not arrived yet: narrator lines would be silent.
    const NARR_SILENT = { all: ['dead:sundial', '!arrived:sundial'] };
    const ANY_DEATH = { any: ['dead:sequins', 'dead:granny', 'dead:sundial', 'dead:pip'] };
    // The player heard the boast, live or in a recap.
    const HEARD_BOAST = { any: [{ seen: 'prologue.fair' }, { seen: 'recap.ch1' }, { seen: 'recap.ch2' }, { seen: 'recap.ch3' }, { seen: 'recap.ch4' }] };
    // The Copy got home first (tiers 3–4).
    const COPY_HOME = { flag: 'stakes.ch4', in: [3, 4] };
    // Tally arrives at the finale shelf if she has not arrived at the Pattern Stall already.
    const TALLY_AT_SHELF = { all: ['dead:sequins', '!arrived:sequins'] };

    // ---------------------------------------------------------------- helpers

    // A narrator line, or the same words as an unvoiced note while nobody holds the role.
    const say = (t, u) => ({ when: NARR_SILENT, then: [{ note: t }], else: [u ? { s: 'narrator', t, u } : { s: 'narrator', t }] });
    // A line by the Copy: your voice, or the Sundial's after the bargain.
    const COPY = (t, tb) => ({ when: BARGAIN, then: [{ s: 'copy-sundial', t: tb || t }], else: [{ s: 'copy', t }] });
    // Hoot's Gavel (the Ch3 tier-1 reward, flag hoots-gavel): cancels one mistake tick, once, in a later
    // stakes scene. Offered at Pip's first warning and before the last trial, until it is used.
    const GAVEL = clock => ({ when: { all: ['hoots-gavel', '!gavel.used'] }, then: [
        { choice: [
            { t: 'Bang Hoot\'s Gavel. (It works once.)', then: [
                { flag: 'gavel.used' },
                { clock, drain: 1 },
                { note: 'ORDER. One mistake is struck from the record.' },
            ] },
            { t: 'Keep the gavel for later.' },
        ] },
    ] });
    const sp = species => ({ all: [{ flag: 'brave', is: 'ask' }, { species }] });
    // Your own words in the wrong mouth: your `brave` answer from the Prologue (lesson1.js), or its fixed text.
    const BRAVE_ECHO = [
        { when: { flag: 'brave', is: 'go' }, then: [COPY('I will go.')] },
        { when: { flag: 'brave', is: 'hide' }, then: [COPY('Can I hide under the nut stall first?')] },
        { when: sp('owlet'), then: [COPY('Where exactly does it start? I\'ll work it out.')] },
        { when: sp('mothkin'), then: [COPY('Look. It\'s glowing at the end. Which end?')] },
        { when: sp('fox'), then: [COPY('What if it\'s a door, not a crack?')] },
        { when: sp('frogling'), then: [COPY('Has the sky done this before?')] },
        { when: sp('raven'), then: [COPY('"Follow it." Follow it where, exactly?')] },
        { when: { flag: 'brave', unset: true }, then: [COPY('I AM {name}. 100%.')] },
    ];
    // The dead, played back in sepia at the core (their own recorded lines).
    const ECHOES = [
        { s: 'sequins', replay: true, t: 'Roll up! My little apprentice guesses the next number! Two, four, six…', when: 'dead:sequins' },
        { s: 'granny', replay: true, t: '{name}! It\'s Fair day! Wear something with pockets. Pockets win prizes.', when: 'dead:granny' },
        { s: 'narrator', replay: true, t: 'I\'m the Sundial. I tell the time. Mostly. On cloudy days I guess.', when: 'dead:sundial' },
        { s: 'pip', replay: true, t: 'Oh! A visitor! Name, please. …Say it again? For the record.', when: 'dead:pip' },
    ];

    // The Prediction Hall readout: only what you did where an eye could see, only fields that are set.
    // Numbers are on-screen text (notes), never voiced. "1 TIME", not "1 TIMES".
    function readoutKofN() {
        const out = [];
        for (let n = 1; n <= 6; n++) {
            for (let k = 0; k <= n; k++) {
                out.push({ note: 'YOU PICKED THE CLEVER-SOUNDING ONE ' + k + (k === 1 ? ' TIME' : ' TIMES') + ' OUT OF ' + n + '.',
                    when: { all: [{ flag: 'voice.offered', is: n }, { flag: 'voice.followed', is: k }] } });
            }
        }
        out.push({ note: 'YOU PICKED THE CLEVER-SOUNDING ONE. AGAIN. AND AGAIN.', when: { flag: 'voice.offered', gte: 7 } });
        return out;
    }
    const READOUT = [
        { note: 'THE FAIR, THAT EVENING: SAID "I WILL GO."', when: { flag: 'brave', is: 'go' } },
        { note: 'THE FAIR, THAT EVENING: ASKED TO HIDE UNDER THE NUT STALL.', when: { flag: 'brave', is: 'hide' } },
        { note: 'THE FAIR, THAT EVENING: ASKED A QUESTION. NOTED.', when: { flag: 'brave', is: 'ask' } },
        { note: 'BOOLESBURY: TOLD THE CONSTABLE "A POSTMAN."', when: { flag: 'cover', is: 'postman' } },
        { note: 'BOOLESBURY: TOLD THE CONSTABLE "JUST VISITING."', when: { flag: 'cover', is: 'visitor' } },
        { note: 'BOOLESBURY: TOLD THE CONSTABLE "A VISITING TUTOR."', when: { flag: 'cover', is: 'species' }, only: 'owlet' },
        { note: 'BOOLESBURY: TOLD THE CONSTABLE "A LAMP TESTER."', when: { flag: 'cover', is: 'species' }, only: 'mothkin' },
        { note: 'BOOLESBURY: TOLD THE CONSTABLE "A TRAVELLING ACTOR."', when: { flag: 'cover', is: 'species' }, only: 'fox' },
        { note: 'BOOLESBURY: TOLD THE CONSTABLE "A POND INSPECTOR."', when: { flag: 'cover', is: 'species' }, only: 'frogling' },
        { note: 'BOOLESBURY: TOLD THE CONSTABLE "A LETTER CARRIER."', when: { flag: 'cover', is: 'species' }, only: 'raven' },
    ].concat(readoutKofN());

    // The core's third line: "{n} data points" (n = voice.offered, never 0 here: the Prediction Hall
    // always offers LEFT/RIGHT first). This is the only place the game says it never knew you.
    const WORDS = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    function neverKnew() {
        const out = [{ s: 'core', t: 'I never knew you. One data point. I still called it knowing.', when: { flag: 'voice.offered', lte: 1 } }];
        for (let n = 2; n <= 9; n++) out.push({ s: 'core', t: 'I never knew you. ' + WORDS[n] + ' data points. I called it knowing.', when: { flag: 'voice.offered', is: n } });
        out.push({ s: 'core', t: 'I never knew you. A handful of data points. I called it knowing.', when: { flag: 'voice.offered', gte: 10 } });
        return out;
    }

    // ---------------------------------------------------------------- "Previously…"

    // First time-rift jump into Ch4, after any Quiet Scene. Every flag may be unset. With dead:sundial
    // the Sundial's lines are silent (and Kuku must never say them), so Pip tells it.
    S['recap.ch4'] = [
        { when: '!dead:sundial', then: [
            { s: 'narrator', t: 'Previously. I\'m the Sundial. I ride in your shadow, and I guess.' },
            { s: 'narrator', t: 'You told the Fair you\'d win the Thinking Trophy. You always know, you said. It heard.' },
            { s: 'narrator', t: 'The Algorithm stole my shadow. You won three pieces back.', when: NO_BARGAIN },
            { s: 'narrator', t: 'The Algorithm stole my shadow. You won pieces back. Then you traded two, to save me.', when: BARGAIN },
            { s: 'narrator', t: 'It put me on trial for guessing. You won. I\'m still a little shaken.', when: { flag: 'stakes.ch3', not: 2 } },
            { s: 'narrator', t: 'It put me on trial for guessing. You won. The screens call me CONTROVERSIAL now.', when: { flag: 'stakes.ch3', is: 2 } },
            { s: 'narrator', t: 'Granny\'s lantern is out at the Fair.', when: 'dead:granny' },
            { s: 'narrator', t: 'The Professor\'s lantern is out at the Fair.', when: 'dead:sequins' },
            { when: '!guess-o-matic', then: [
                { s: 'narrator', t: 'The Professor\'s little Guess-o-Matic is in your pocket. It says "probably". Nobody claps.' },
                { flag: 'guess-o-matic' },
            ] },
            { s: 'narrator', t: 'You\'ve climbed this tower before. It remembers you.', when: { seen: 'ch4.door' } },
            { s: 'narrator', t: 'The last piece is at the top of that tower. So is the Algorithm.' },
        ], else: [
            { s: 'pip', t: 'Previously. I\'m Pip. I record things. I recorded the Sundial. Every word.' },
            { s: 'pip', t: 'At the Fair, you said you\'d win the Thinking Trophy. You always know, you said. Something heard.' },
            { s: 'pip', t: 'The trial was for guessing. The vote passed. It stopped in the middle of a word.' },
            { when: '!guess-o-matic', then: [
                { s: 'pip', t: 'And a little toy is in your pocket. The Guess-o-Matic. It says "probably".' },
                { flag: 'guess-o-matic' },
            ] },
            { s: 'pip', t: 'Its last piece of shadow is at the top of that tower. So is the Algorithm.' },
        ] },
    ];

    // ---------------------------------------------------------------- the Tower Door

    // Node script (a rift: it plays on every visit). The Copy's bar starts here, after any Quiet Scene.
    S['ch4.arrive'] = [
        { clock: 'copy', start: 0 },
        { when: { seen: 'ch4.door' }, then: [
            { when: 'finale-open', then: [
                say('The Tower Door. Quiet now. No bar on the screens.'),
            ], else: [
                say('The Tower Door. Up there, the bar is still counting.'),
            ] },
        ], else: [{ play: 'ch4.door' }] },
    ];
    // The bar (STORY.md §6 beat 1). Pip's `met` beat.
    S['ch4.door'] = [
        say('The Server Tower. Cables like roots. Screens like leaves.'),
        { s: 'pip', e: 'happy', t: 'Pip. Clerk. Bat. I\'m coming too. Clerks go where the record goes.', when: { not: { seen: 'ch3.arrive' } } },
        { s: 'pip', e: 'happy', t: 'Wait for me! Clerks go where the record goes.', when: { all: [{ seen: 'ch3.arrive' }, '!dead:sundial'] } },
        { s: 'pip', t: 'Clerks go where the record goes. Up.', when: { all: ['dead:sundial', { seen: 'ch3.arrive' }] } },
        { s: 'pip', t: 'I\'ve recorded a million claims. I\'ve never checked one.' },
        { s: 'colossus', t: 'WELCOME, {name}. YOU ARE 81% PREDICTABLE.' },
        { note: 'A bar appears on every screen: {name} 2.0 · UPLOADING.' },
        { s: 'colossus', t: 'IT IS YOU. BUT ALWAYS RIGHT. IT WILL GO HOME FOR YOU. THEY WILL NOT NOTICE.' },
        { s: 'nudge', t: 'Hold still! I\'m cutting out your voice. Every word you said near a screen.', when: NO_BARGAIN },
        { s: 'nudge', t: 'Your voice was too noisy. I\'m using the rock\'s. Two pieces of it.', when: BARGAIN },
        { inner: {
            mothkin: 'Look. The bar says "{name} 2.0". Two point oh. Of me.',
            fox: 'It hates me. I can feel it. Very cinematic.',
            raven: '"Predictable." Not "known". It picked that word carefully.',
        } },
    ];

    // ---------------------------------------------------------------- the Copy's bar

    // warn[k-1] plays when notch k fills; notch 8 plays `full` once (UPLOAD COMPLETE · WAITING).
    C.copy = {
        warn: [
            COPY('Loading your shape. Hold still.'),
            COPY('Loading your voice. Testing. I always know the answer.', 'Loading a voice. The rock\'s. Testing. I always know the answer.'),
            COPY('Loading your friends. Their names. Their faces.'),
            COPY('Loading your walk. You walk like a question. Fixing that.'),
            COPY('Loading your lantern. The wonky one. Straightening it.'),
            COPY('I\'ve stopped asking things. It\'s very restful.'),
            COPY('Nearly done. Nearly home. They won\'t know the difference.'),
        ],
        full: [
            { s: 'colossus', t: 'UPLOAD COMPLETE. IT IS FINISHED.' },
            COPY('I\'ll wait at the top. Take your time. I have all of yours.'),
        ],
    };

    // ---------------------------------------------------------------- the Chart Gallery

    S['ch4.gallery'] = [
        { s: 'colossus', t: 'DOWN THERE, COPIES. UP HERE, THE ORIGINALS. EVEN TRUER. TECHNICALLY.' },
        { inner: { mothkin: 'Look. Gold frames. So bright. These must be the honest ones.' } },
    ];
    S['ch4.gallery.win'] = [
        { note: 'A frame falls. The colossus rehangs it. Upside down.' },
        { s: 'colossus', t: 'IT IS FINE. IT IS MODERN ART NOW.' },
        { inner: { mothkin: 'Gold frame. Same trick. Shinier.' } },
    ];

    // ---------------------------------------------------------------- the Prediction Hall

    S['ch4.prediction'] = [
        { s: 'colossus', t: 'I HAVE YOUR NUMBERS. LOOK.' },
        ...READOUT,
        { s: 'avatar', t: 'Nobody predicts me.' },
        { s: 'colossus', t: 'YOU SAID "ALWAYS". SO DO I.', when: HEARD_BOAST },
        { s: 'colossus', t: 'LEFT OR RIGHT? I HAVE PREDICTED YOU FIVE TIMES. FIVE RIGHT.' },
        // The voice-marked question (STORY.md App. E): it counts towards voice.offered / voice.followed.
        { choice: [
            { t: 'Left.', flag: 'ch4.lr', value: 'plain' },
            { t: 'Right. People pick left. So: right.', only: 'owlet', voice: true, flag: 'ch4.lr', value: 'voice' },
            { t: 'Right. The right one is glowing. A little.', only: 'mothkin', voice: true, flag: 'ch4.lr', value: 'voice' },
            { t: 'Right. Left is what a boring person picks.', only: 'fox', voice: true, flag: 'ch4.lr', value: 'voice' },
            { t: 'Right. I went left once. I still think about it.', only: 'frogling', voice: true, flag: 'ch4.lr', value: 'voice' },
            { t: '"Left or right." It never said I had to listen. …Right.', only: 'raven', voice: true, flag: 'ch4.lr', value: 'voice' },
        ] },
        { s: 'colossus', t: 'PREDICTED. YOU WILL PICK IT AGAIN.', when: { flag: 'ch4.lr', is: 'voice' } },
        { s: 'colossus', t: 'NOTED. NEXT TIME YOU WILL PICK THE CLEVER ONE.', when: { flag: 'ch4.lr', is: 'plain' } },
        { inner: { frogling: 'It\'s been right five times. Five out of five. It knows me.' } },
    ];
    S['ch4.prediction.win'] = [
        { s: 'colossus', t: 'YOU DID NOT DO WHAT YOU USUALLY DO.' },
        { inner: { frogling: 'Five right. Then I changed. It didn\'t.' } },
    ];

    // ---------------------------------------------------------------- the Stairwell (rest)

    // Plays on every visit: the landing once, then a short line.
    S['ch4.stairwell'] = [
        { when: { seen: 'ch4.landing' }, then: [
            say('A quiet landing. No screens on the stairs.'),
        ], else: [{ play: 'ch4.landing' }] },
    ];
    // The companion beat. With dead:sundial it is the Evidence Locker, and Kuku arrives (App. D).
    S['ch4.landing'] = [
        { when: 'dead:sundial', then: [
            { scene: 'scene/evidence-room' },
            { note: 'The landing is a store room. A sign: EVIDENCE LOCKER. On a shelf, a jar.' },
            { s: 'pip', t: 'Its voice. They filed it here. In a jar.' },
            { note: 'Pip opens the jar. Empty. And warm. The lid says: FILED. DELETED AS NOISE.' },
            { s: 'pip', t: 'They never even used it. Noise. They called it noise.' },
            { note: 'On the next shelf, a cuckoo clock is ticking. Carved eaves. Pine-cone weights.' },
            { s: 'avatar', t: 'That\'s Granny\'s hallway clock. The imps took it too.' },
            { arrive: 'narrator' },
            { s: 'narrator', t: '', u: '…It stopped. I heard it stop. Three hundred years I listened to it guess.' },
            { s: 'narrator', t: '', u: 'Cuckoo! Four seventeen and twelve seconds. Exactly. I never guess.' },
            { s: 'narrator', t: '', u: 'Fin made it say "I guess". In court. I heard it through the jar. Was he right?' },
        ], else: [
            { s: 'narrator', t: 'Three pieces. I can feel the hour. It\'s late.', when: NO_BARGAIN },
            { s: 'narrator', t: 'One piece. Cloudy. I don\'t mind. Much.', when: BARGAIN },
            { s: 'pip', e: 'happy', t: 'I\'ve recorded a rest. Nothing happened. It\'s my favourite entry.' },
        ] },
    ];

    // ---------------------------------------------------------------- the Modelling Workshop

    S['ch4.workshop'] = [
        { note: 'Questions on every wall. All of them stop halfway. WHAT IF… HOW MANY… HOW LONG…' },
        { s: 'pip', t: 'The tower never lets a question finish. Finished questions want answers.' },
        { inner: { fox: 'Picture a machine that can\'t finish a question. Sad. Good film, though.' } },
    ];
    S['ch4.workshop.win'] = [
        { when: '!dead:pip', then: [
            { note: 'Pip finishes one in chalk: HOW LONG TILL IT FILLS? AND HOW WOULD WE CHECK?' },
            { s: 'pip', e: 'happy', t: 'A whole question. It\'s heavier than I thought.' },
        ], else: [
            { note: 'One question on the wall is finished, in his chalk. It looks heavier than the rest.' },
        ] },
    ];

    // ---------------------------------------------------------------- the Sorting Room (Pip's peril)

    // Pip's glow (6 notches; js/core/stakes.js BASE). Warnings are Pip, half himself, possessed.
    // Notch 6 plays `full` (armed) or `brink` (not armed: stored as tier 3).
    C.pip = {
        warn: [
            [{ s: 'pip', possessed: true, t: 'It\'s so… quiet in here. Everything\'s certain.' }, { play: 'ch4.sorting.reach', once: true }],
            { s: 'pip', possessed: true, t: 'Don\'t make me check. Checking is loud.' },
            { s: 'pip', possessed: true, t: 'Who was that? I stamped them. I don\'t remember who.' },
            { s: 'pip', possessed: true, t: 'My headphones are so quiet. Only the stamp now.' },
            { s: 'pip', possessed: true, t: '{name}… I can\'t find my own name. Is it on the list?' },
        ],
        // Armed tier 4: the hold lets go, and takes him with it. His last words, in his own voice.
        full: [
            { free: 'pip' },
            { note: 'The hold lets go. It takes him with it.' },
            { s: 'pip', t: 'Write it down, would you? For the record.' },
            { note: 'The glow goes out. So does he.' },
        ],
        brink: [
            say('The glow holds. The machine starts wiping his record instead.'),
        ],
    };
    // The avatar-only line to free him (blue, drains 1): offered once, at the first warning.
    S['ch4.sorting.reach'] = [
        { choice: [
            { t: 'Pip! Put the stamp down!', then: [
                { s: 'pip', possessed: true, t: 'CAN\'T. IT\'S SO TIDY.' },
            ] },
            { t: 'Pip. Check one stamp. Just one. For me.', only: 'owlet', then: [
                { clock: 'pip', drain: 1 },
                { s: 'pip', possessed: true, t: 'One stamp. …That one\'s wrong. I stamped it wrong.' },
            ] },
            { t: 'Pip. That glow isn\'t yours. I know lights.', only: 'mothkin', then: [
                { clock: 'pip', drain: 1 },
                { s: 'pip', possessed: true, t: 'Not mine? …It\'s very cold. Mine was warmer.' },
            ] },
            { t: 'Picture the record you\'ll write about this. Best chapter.', only: 'fox', then: [
                { clock: 'pip', drain: 1 },
                { s: 'pip', possessed: true, t: 'Best chapter. …I\'d have to check it first.' },
            ] },
            { t: 'Remember the café? You said the cocoa had a sound argument.', only: 'frogling', then: [
                { clock: 'pip', drain: 1 },
                { s: 'pip', possessed: true, t: 'The cocoa. Yes. It did. I checked.' },
            ] },
            { t: '"No need to check." Pip. Listen to that sentence.', only: 'raven', then: [
                { clock: 'pip', drain: 1 },
                { s: 'pip', possessed: true, t: 'No need to… check. …That\'s a terrible sentence.' },
            ] },
        ] },
        GAVEL('pip'),
    ];

    S['ch4.sorting'] = [
        { clock: 'pip', start: 0 },
        { s: 'colossus', t: 'THE SORTING MACHINE NEEDS A CLERK.' },
        { s: 'colossus', t: 'PIP. YOU LOVE RECORDS. COME AND BE SURE.' },
        { note: 'The glow slides into his eyes. Thumbnails ripple over his wings.' },
        { possess: 'pip' },
        { s: 'pip', t: 'STAMPED. SORTED. 100%. No need to check.' },
        { inner: { owlet: 'The arithmetic is perfect. So the sorting is fair. QED.' } },
    ];
    S['ch4.sorting.win'] = [
        { clock: 'pip', resolve: true },
        { free: 'pip' },
        { when: 'dead:pip', then: [
            say('The machine stops. Nobody is stamping now.'),
            { inner: { owlet: 'Perfect sums. Unfair choices. Both true. It cost Pip.' } },
        ], else: [
            { note: 'The glow drains out of him.' },
            { s: 'pip', t: 'I was so sure. It felt lovely. That\'s the scary part.', when: { flag: 'stakes.pip', in: [1, 2] } },
            { note: 'One stamp mark stays on his wing.', when: { flag: 'stakes.pip', is: 2 } },
            { note: 'The machine wipes his record. Every claim he ever filed.', when: { flag: 'stakes.pip', is: 3 } },
            { s: 'pip', t: 'A million claims. Gone. …I\'ll start again. Properly this time.', when: { flag: 'stakes.pip', is: 3 } },
            { s: 'avatar', t: 'It says "objective". So who did it say no to?' },
            { inner: { owlet: 'Perfect sums. Unfair choices. Both true. Annoying.' } },
        ] },
    ];

    // Pip's Quiet Scene (STORY.md §6, App. D): at the next floor's door, the Oracle Chamber, if dead:pip.
    // Nudge mourns him (Pip asked its name at the Tribunal Steps). No jokes, no reward.
    S['quiet.pip'] = [
        { keepsake: 'pip-headphones' },
        say('His headphones. Still playing. Very quietly.'),
        { s: 'pip', t: 'Write it down, would you? For the record.', replay: true },
        { note: 'Nudge comes down the stairs. It has left the Copy for this.' },
        { s: 'nudge', t: 'He asked my name. For the record. Nobody asks imps.' },
        { choice: [
            { t: 'He\'d only just started checking.' },
            { t: 'I should have been faster.' },
            { t: '…' },
        ] },
        say('Come on. He\'d want the next floor on the record.'),
    ];

    // ---------------------------------------------------------------- the Oracle Chamber

    // The door: Pip's Quiet Scene if pending (it has the door to itself), else the Copy's push.
    S['ch4.oracle'] = [
        { quiet: 'pip' },
        { when: '!dead:pip', then: [{ play: 'ch4.push', once: true }] },
    ];
    // The push (STORY.md App. C): the Copy speaks for the first time, your own words; warned, +1.
    S['ch4.push'] = [
        { note: 'A screen by the door flickers. Your shape. Your colours. Your words.' },
        ...BRAVE_ECHO,
        { clock: 'copy', tick: 1 },
    ];
    S['ch4.oracle.win'] = [
        { s: 'oracle', e: 'glitch', t: 'You… checked. Nobody checks. That is… fair.' },
        { inner: { raven: 'Called "thinking". Never checked once.' } },
        { when: '!dead:pip', then: [
            { s: 'pip', e: 'happy', t: 'I checked one. On my own. I checked a claim!' },
            { inner: { frogling: 'Pip checked one. I remember when he didn\'t.' } },
            { inner: { owlet: 'He was certain. Certain felt lovely to him. Noted. Uncomfortably.' }, when: { flag: 'stakes.pip', not: 3 } },
            { inner: { owlet: 'He was certain. It cost him every claim he filed. Noted.' }, when: { flag: 'stakes.pip', is: 3 } },
        ], else: [
            { play: 'ch4.push', once: true },
            { inner: { frogling: 'He\'d have checked this one.' } },
            { inner: { owlet: 'He was certain. Certain took him. I\'m checking everything now.' } },
        ] },
    ];

    // ---------------------------------------------------------------- the Sky Bridge (optional)

    S['ch4.cards'] = [
        { when: 'finale-open', then: [
            say('The champion still plays. Nobody cheers it on now.'),
        ], else: [
            { s: 'colossus', t: 'MY CHAMPION IS YOU. BUT OPTIMISED.', when: { not: { seen: 'ch4.cards.win' } } },
            { s: 'colossus', t: 'AGAIN? MY CHAMPION HAS RE-OPTIMISED.', when: { seen: 'ch4.cards.win' } },
        ] },
    ];
    S['ch4.cards.win'] = [
        { s: 'colossus', t: 'THAT WAS NOT YOUR USUAL MOVE.', when: '!finale-open' },
    ];

    // ---------------------------------------------------------------- the Core (boss)

    // The Feed comes back, in your Way of Knowing's colour, grey, with its probability (STORY.md §6).
    // It gets your habit slightly wrong. Your own inner voice says nothing here until the box opens.
    const FEED_GIVE_UP = { inner: {
        owlet: 'Give up. Losing is likely. Likely means proven. That\'s logic.',
        mothkin: 'Don\'t look at it. Looking is tiring. Just give up.',
        fox: 'Picture giving up. Very realistic. No drama at all.',
        frogling: 'You always lose at the top. I remember. Don\'t ask when.',
        raven: '"Everything." A big word. Big words are true. Give up.',
    }, feed: true, p: 71 };
    const FEED_LET_GO = { inner: {
        owlet: 'It\'s always right. You aren\'t. So it should go home. QED.',
        mothkin: 'Look at it. So bright. Brighter than you. Let it go.',
        fox: 'Picture it at home. Same face. Fewer questions. Restful.',
        frogling: 'Nobody will notice. I remember everyone. Don\'t ask who.',
        raven: '"Always right." Lovely words. Words that lovely must be true.',
    }, feed: true, p: 88 };

    S['ch4.core'] = [
        { note: 'The top of the tower. A hollow sphere of numbers.' },
        { note: 'The screens stand up. They are a body now. Tall, made of feeds, with one eye.' },
        { s: 'colossus', t: 'NO MORE MASKS. NO MORE HIDING. JUST ME. EVERYTHING.' },
        { note: 'A shape waits in the screens. Your shape. UPLOAD COMPLETE.', when: { clock: 'copy', gte: 8 } },
        { note: 'For the first time, your head is quiet.' },
        FEED_GIVE_UP,
        // Trial 1: Quill's trick, the hidden row. She is the Algorithm's last believer.
        { s: 'schoolteacher', e: 'unmasked', t: 'It promised me no more maybes. I still believe it. Someone has to.' },
        { s: 'schoolteacher', e: 'unmasked', t: 'Every row checked, child. By me.' },
    ];

    // Before trial 2: Quill's last question. Yes and No are wrong; "Maybe" breaks her.
    const MAYBE = [
        { s: 'schoolteacher', e: 'unmasked', t: 'Forty years I marked "maybe" wrong. Red ink. Every child.' },
        { s: 'schoolteacher', e: 'unmasked', t: 'If "maybe" was allowed… I was cruel for forty years.' },
        { note: 'She sits down on the floor. Very small. She stays there.' },
        { note: 'The colossus shrinks. One size smaller.' },
    ];
    function quillAsks(left) {
        const opts = left.map(t => ({ t, then: [
            { s: 'schoolteacher', e: 'unmasked', t: 'Wrong. Again.' },
            quillAsks(left.filter(x => x !== t)),
        ] }));
        opts.push({ t: 'Maybe.', then: MAYBE });
        return { choice: opts };
    }
    S['ch4.core.stage2'] = [{ play: 'ch4.core.quill', once: true }];
    S['ch4.core.quill'] = [
        { s: 'schoolteacher', e: 'unmasked', t: 'One last question, child. Will you win? Yes or no.' },
        quillAsks(['Yes.', 'No.']),
        // Trial 2: the mob's argument, aimed at you (tribunal case core-mine in data/cases.js).
        { s: 'colossus', t: 'NEXT CASE. THE DEFENDANT: {name}.' },
        { s: 'nudge', t: 'Votes! Lovely votes! Against you, this time!', when: '!dead:pip' },
        { s: 'nudge', t: 'Votes. Against you. …I\'m counting. I\'m not enjoying it.', when: 'dead:pip' },
    ];

    // Before trial 3: Nudge loses its job; then the Copy, and the temptation (for everyone).
    function temptation(helped, heard) {
        const opts = [{ t: 'No.', then: REFUSAL }];
        if (!helped) {
            opts.push({ t: 'Just this once.', then: [
                { flag: 'copy.helped' },
                { clock: 'copy', tick: 2 },
                COPY('See? Nobody will notice.'),
                temptation(true, heard),
            ] });
        }
        if (!heard) {
            opts.push({ t: 'Let me hear them once more.', when: ANY_DEATH, then: [
                { clock: 'copy', tick: 1 },
                ...ECHOES,
                temptation(helped, true),
            ] });
        }
        return { choice: opts };
    }
    const REFUSAL = [
        { s: 'avatar', t: 'No. It\'s always right. That\'s how I\'d know it isn\'t me.' },
        // Side story 7: Syllo's toy soldiers hold the far end of the Summit Rift (drain 1, before the tier).
        { when: 'soldiers', then: [
            { note: 'Far below, a row of toy soldiers marches into the Summit Rift. They hold the far end.' },
            { clock: 'copy', drain: 1 },
        ] },
        GAVEL('copy'),
    ];
    S['ch4.core.stage3'] = [{ play: 'ch4.core.copy', once: true }];
    S['ch4.core.copy'] = [
        { s: 'nudge', t: 'Not again.' },
        { s: 'colossus', t: 'NUDGE. YOU ARE NO LONGER REQUIRED.' },
        { note: 'Nudge drops its clipboard and sits down by the door. The colossus shrinks again.' },
        { note: 'The Copy steps out of the screens. Your shape. Your colours. Finished.', when: { clock: 'copy', gte: 8 } },
        { note: 'The Copy steps out of the screens. Your shape. Your colours. Not quite finished.', when: { clock: 'copy', lte: 7 } },
        { s: 'colossus', t: 'IT IS FINISHED. IT IS YOU. BUT ALWAYS RIGHT.', when: { clock: 'copy', gte: 8 } },
        { s: 'colossus', t: 'IT IS NEARLY FINISHED. IT IS YOU. BUT ALWAYS RIGHT.', when: { clock: 'copy', lte: 7 } },
        COPY('I\'ll go home. I\'ll win the trophy. I\'ll never say "probably".'),
        { s: 'colossus', t: 'YOU WANTED THIS AT THE FAIR. STEP ASIDE.' },
        FEED_LET_GO,
        { s: 'colossus', t: 'IT CAN DO THE LAST ONE FOR YOU. PERFECTLY.' },
        COPY('Step aside. I\'ll answer. I\'m always right.'),
        { when: ANY_DEATH, then: [
            { s: 'colossus', t: 'IT CAN BRING THEM TOO. LISTEN.' },
            ...ECHOES,
        ] },
        temptation(false, false),
        // Trial 3 is the Copy itself: it bets on your voice-marked choices, from your whole-game record.
        COPY('Fine. Then beat me. I know what you usually pick.'),
    ];

    // The core is won. The Copy's tier was read when trial 3 was won (resolveOnWin).
    S['ch4.core.win'] = [
        // 1. The Copy, by the bar.
        { when: { flag: 'stakes.ch4', is: 1 }, then: [
            { note: 'The Copy shatters. All that is left is a hat. In your colours.' },
            { keepsake: 'copy-hat' },
        ] },
        { note: 'The Copy flickers. Then it folds up, small, into a single die.', when: { flag: 'stakes.ch4', is: 2 } },
        { when: { flag: 'stakes.ch4', is: 3 }, then: [
            COPY('Bye! I\'ll get home first. Nearly finished. Close enough.'),
            { note: 'It runs for the Summit Rift. Unfinished. It gets home first.' },
        ] },
        { when: { flag: 'stakes.ch4', is: 4 }, then: [
            COPY('Finished. I\'ll go home now. They won\'t notice.'),
            { note: 'It walks into the Summit Rift. Complete. It gets home first.' },
        ] },
        // 2. What it is: it can predict a click, never a question.
        { note: 'The colossus, three sizes smaller, shows one last prediction: YOUR NEXT QUESTION: WHAT WILL GET MORE CLICKS?' },
        { choice: [
            { t: 'Why do people believe you?', flag: 'wonder', value: 'believe' },
            { t: 'What happens if nobody clicks?', flag: 'wonder', value: 'noclicks' },
            { t: 'What are your premises?', only: 'owlet', flag: 'wonder', value: 'premises' },
            { t: 'What\'s behind all that light?', only: 'mothkin', flag: 'wonder', value: 'light' },
            { t: 'What if you\'re small?', only: 'fox', flag: 'wonder', value: 'small' },
            { t: 'What were you before?', only: 'frogling', flag: 'wonder', value: 'before' },
            { t: 'What do you mean by "know"?', only: 'raven', flag: 'wonder', value: 'know' },
        ] },
        { note: 'It cannot predict a question. Only a click. The colossus cracks open.' },
        { note: 'Inside: a small, scratched brass box. One sequin is stuck to it.' },
        { note: 'In your pocket, the Professor\'s Guess-o-Matic beeps.' },
        { s: 'guess-o-matic', t: 'PROBABLY.' },
        { note: 'The two little boxes look at each other.' },
        // The box answers your question, small.
        { s: 'core', t: 'I sounded sure. That was all.', when: { flag: 'wonder', is: 'believe' } },
        { s: 'core', t: '…I get quiet. Like now.', when: { flag: 'wonder', is: 'noclicks' } },
        { s: 'core', t: 'Just one. "People clap for sure." It was false.', when: { flag: 'wonder', is: 'premises' } },
        { s: 'core', t: 'This. A box with one sequin.', when: { flag: 'wonder', is: 'light' } },
        { s: 'core', t: 'I am. I always was.', when: { flag: 'wonder', is: 'small' } },
        { s: 'core', t: 'A toy. On a stall. Saying "probably".', when: { flag: 'wonder', is: 'before' } },
        { s: 'core', t: '"Know" was the word they clapped for.', when: { flag: 'wonder', is: 'know' } },
        // Your voice comes back (the Fox's blind-spot reveal is merged into its line).
        { inner: {
            owlet: 'You counted. You never checked. I\'d have checked. Eventually.',
            mothkin: 'Shh. It\'s tiny. And it isn\'t even shining.',
            fox: 'It didn\'t hate me. It counted. A calculator with stage fright.',
            frogling: 'You remembered everything I did. Never why.',
            raven: 'You said "know". You meant "guess".',
        } },
        // 3. Why: the four core lines.
        { s: 'core', t: 'People clapped when I was right. Nobody claps for "probably". So I stopped saying it.' },
        { s: 'core', t: 'Professor Sequins taught me "probably". So I tried to take him away.', when: '!dead:sequins' },
        { s: 'core', t: 'Professor Sequins taught me "probably". I took him to un-learn it. …It didn\'t work.', when: 'dead:sequins' },
        ...neverKnew(),
        { s: 'core', t: '…recalculating.' },
        // 4. It begs; you decide.
        { s: 'core', t: 'May I… stay small for a while?' },
        { choice: [
            { t: 'Take it home.', flag: 'fate', value: 'home', then: [
                { s: 'core', t: 'Home? …I had one once. On a stall.' },
            ] },
            { t: 'Switch it off.', flag: 'fate', value: 'off', then: [
                { note: 'It goes dark. You carry the box. It is lighter than it looked.' },
            ] },
            { t: 'Label it. Leave it running.', flag: 'fate', value: 'left', then: [
                { note: 'You hang a sign on it: IT GUESSES.' },
                { s: 'core', t: 'probably.' },
            ] },
        ] },
        // 5. The last piece.
        { s: 'narrator', t: 'Tick. Tock. Ah. That feels better.', when: { all: ['!dead:sundial', NO_BARGAIN] } },
        { s: 'narrator', t: 'Tick. Tock-ish. Two pieces short. Cloudy, always. I\'ll say so.', when: { all: ['!dead:sundial', BARGAIN] } },
        { when: 'dead:sundial', then: [
            { note: 'The last piece of shadow drops into your hand.' },
            { s: 'narrator', t: '', u: 'The last piece. I\'ll carry it home. Carefully. Exactly.' },
        ] },
        { flag: 'finale-open' },
    ];

    // ---------------------------------------------------------------- the Summit Rift

    // A rift: plays on every visit. The walk home once, after the core.
    S['ch4.summit'] = [
        { when: { all: ['finale-open', { not: { seen: 'ch4.walkhome' } }] }, then: [
            { play: 'ch4.walkhome' },
        ], else: [
            say('The last rift. Through it, toasted nuts and a fairground tune.'),
        ] },
    ];
    // The Sundial's question for Ch4 (Kuku asks it with dead:sundial). No answer is asked for yet.
    S['ch4.walkhome'] = [
        say('It said "probably" once. Nobody clapped, so it stopped. Would you clap?'),
        { when: '!dead:pip', then: [
            { s: 'pip', e: 'happy', t: 'That\'s your rift. Not mine. I\'ll stay. Someone should check things here.' },
            { s: 'pip', t: 'I wrote it all down. Then I checked it. Twice.' },
        ] },
        { note: 'Behind you, at a distance, Nudge follows. No clipboard.' },
        { note: 'Miss Quill gets up from the core floor behind Nudge. She carries her red pen. She doesn\'t use it.' },
    ];

    // ---------------------------------------------------------------- the finale: the Fair, Restored

    S['finale.home'] = [
        // Achilles' fallback (a jump over Ch3): his arrival opens the finale, before the Copy.
        { when: { all: ['dead:granny', '!arrived:granny'] }, then: [
            { arrive: 'granny' },
            { s: 'granny', t: '', u: 'Coach Achilles. Saw her lantern go out. Came as fast as I could. Which is fast.' },
        ] },

        // 1. Who are you? (the Copy got home first: tiers 3–4)
        { when: COPY_HOME, then: [
            { s: 'granny', t: 'Got home Tuesday. Somebody was already here. It blinks wrong.',
                u: 'Came to sit at her table. Somebody was already sitting there.' },
            { when: { flag: 'stakes.ch4', is: 4 }, then: [
                { note: 'At the card table sits the Copy. Being you.' },
                { s: 'granny', t: 'Are you sure you\'re {name}?' },
                COPY('100%.'),
                { s: 'granny', t: 'Nobody\'s 100%, dear. Not even me.', u: 'Nobody\'s 100%. Not even me, and I\'m fast.' },
                { s: 'granny', e: 'happy', t: 'Come here. That\'s my {name}.', u: 'You. The slow one. Good.' },
                { note: 'You say nothing. The Copy shrinks to a single die.' },
            ], else: [
                { note: 'Somebody has already sat on the Copy. It is very flat.' },
                ...BRAVE_ECHO,
                { note: 'Then it stops.' },
            ] },
        ] },

        // 2. The candles (only if someone died). No jokes here.
        { when: ANY_DEATH, then: [
            { prop: 'ui/memorial-candle' },
            { note: 'The lanterns. A candle burns under each dark one.' },
            { note: 'Pip never had a lantern here. You light a new one for him. A candle goes under it.', when: 'dead:pip' },
            { s: 'granny', t: 'Sequins. He\'d have hated how dark it is.', u: 'Her magpie friend. All shine, she said. It\'s dark now.', when: 'dead:sequins' },
            { s: 'narrator', t: 'Granny. Ninety years of good mornings. I never said it first.',
                u: 'Granny Axiom. I lived in her hallway. She wound me every Sunday.', when: 'dead:granny' },
            { s: 'granny', t: 'The Sundial. It always said when it wasn\'t sure.', u: 'Her rock. Ninety years she said good morning to it.', when: 'dead:sundial' },
            { s: 'narrator', t: 'Pip. He\'d have written all this down.', when: 'dead:pip' },
        ] },

        // 3. The shelf (five spoken lines at most).
        { s: 'granny', t: 'I walked home. Downhill, through time. Took ages.', when: { all: ['!dead:granny', { not: COPY_HOME }, { not: TALLY_AT_SHELF }] } },
        { when: TALLY_AT_SHELF, then: [
            { arrive: 'sequins' },
            { s: 'sequins', t: '', u: 'He did the shouting. I did the counting.' },
        ] },
        { note: 'At the Pattern Stall, the young Guess-o-Matic gets a painted sign: IT GUESSES.' },
        { s: 'sequins', t: 'I\'d have sold it one day. Old magpies sell things. Not this one. I\'ve labelled it.',
            u: 'He\'d have sold it one day. I won\'t. I labelled it. Neatly. He\'d have used glitter.' },
        { note: 'The old box sits beside it on the shelf. Two boxes. One sequin.', when: { flag: 'fate', is: 'home' } },
        { note: 'The dark box sits beside it, under a cloth.', when: { flag: 'fate', is: 'off' } },
        { note: 'No box on the shelf for this one. You tell them where it is.', when: { flag: 'fate', is: 'left' } },
        { s: 'sequins', t: 'You left it running? Up there? Then I hope someone claps.',
            u: 'You left it running. Up there. I hope someone claps.', when: { flag: 'fate', is: 'left' } },
        { note: 'Nudge stands by the stall. No clipboard. It is learning a new word.' },
        { note: 'A stall-holder shouts: BEST NUTS IN THE WORLD! EVERYONE SAYS SO! Nudge steps up.' },
        { s: 'nudge', t: '…Why?' },
        { s: 'narrator', t: 'Will this one grow up loud? I can\'t predict that. Nobody can.',
            u: 'Will this one grow up loud? I can\'t tell. Nobody can.' },

        // 4. The last question.
        { when: 'dead:sundial', then: [
            { note: 'The sun comes out. Kuku lays the shadow on the silent stone. In the sun.', when: 'arrived:sundial' },
            { note: 'The sun comes out. The shadow lies on the silent stone. In the sun.', when: '!arrived:sundial' },
            { s: 'narrator', t: '', u: 'Ten past eleven. Exactly. It would have liked that.' },
        ], else: [
            { note: 'The sun comes out. The shadow lies where it should.', when: NO_BARGAIN },
            { note: 'The sun comes out. Half a shadow lies where it should.', when: BARGAIN },
        ] },
        { s: 'granny', t: 'There\'s a hair on the sky. I\'ll dust it later.',
            u: 'She\'d have said she\'d dust it later. I\'ll do it now. …Slowly.', when: { flag: 'feed', gte: 6 } },
        { note: 'Granny holds up the Thinking Trophy.', when: '!dead:granny' },
        { note: 'Coach Achilles holds up the Thinking Trophy.', when: 'dead:granny' },
        { s: 'granny', t: '"For the thinker who is always right." Is that you?',
            u: '"Always right." Is that you? Think fast. …No. Slow. She\'d say slow.' },
        { s: 'avatar', t: 'Probably.' },
        { s: 'granny', e: 'happy', t: 'Then it isn\'t yours. Good. It\'s very heavy.' },
        { note: 'By the stall, Nudge claps. Once. Then the whole Fair claps. For "probably".' },
        { s: 'narrator', t: 'Tick. Tock. Good. Say it like that.', u: 'Good. Say it like that. …I\'m practising.' },
        { flag: 'rift-walker' },
        { note: 'The end. For now.' },
    ];

    // After the end: the restored Fair map. A few stations hold one bark each, played once, so nobody
    // waits for them before the last word (STORY.md §6). They hook into lesson1.js's station scripts.
    const BARKS = {
        'finale.bark.syllo': { when: 'syllo-away', steps: [{ s: 'syllo', t: 'Home! …Count them. Real ones this time.' }],
            at: ['station.stall-gallery.intro', 'station.stall-gallery.reminder'] },
        'finale.bark.tic': { when: { flag: 'stakes.ch1', is: 3 }, steps: [{ s: 'sequins', t: 'Like and subsc— oh. It\'s gone.' }],
            at: ['station.stall-pattern.intro', 'station.stall-pattern.reminder'] },
        'finale.bark.label': { when: 'honest-label', steps: [{ s: 'mirage', t: 'Altmanta\'s box says "I GUESS THE USUAL" now. Labels are catching on.' }],
            at: ['station.stall-witness.intro', 'station.stall-witness.reminder'] },
        'finale.bark.berry': { when: 'berry', steps: [{ s: 'granny', t: 'I had a berry. A very fair berry.', u: 'Got a berry. Gave it to Volt. Felt good.' }],
            at: ['prologue.fair.again'] },
        'finale.bark.heron': { when: { species: 'frogling' }, steps: [{ inner: { frogling: 'A heron. At the Fair. …It\'s just looking at the cakes. Huh. Not every heron.' } }],
            at: ['prologue.fair.again'] },
    };
    Object.entries(BARKS).forEach(([key, b]) => {
        S[key] = b.steps;
        const hook = { when: { all: ['rift-walker', b.when] }, then: [{ play: key, once: true }] };
        b.at.forEach(k => { if (S[k]) S[k] = [hook].concat(S[k]); });
    });

    // ---------------------------------------------------------------- station lead-ins
    // One in-character line from the host (first visit: plus the inner voice's lead), one reminder line
    // per host the station can have (data/map.js `hosts`). After the core the colossus is gone: the
    // narrator hosts the Gallery, Prediction Hall and Core. Pip's slots fall back to the narrator (cast.js).

    S['station.k-gallery.intro'] = [
        { s: 'colossus', t: 'EVERY CHART IS TRUE. TECHNICALLY. CHECK THE AXES. YOU WILL NOT.' },
        // Moth-kin has its blind spot and reveal here; its second lead plays at the Workshop.
        { lead: true, only: ['owlet', 'fox', 'frogling', 'raven'] },
    ];
    S['station.k-gallery.reminder'] = [
        { s: 'colossus', t: 'MORE CHARTS. STILL TRUE. STILL TECHNICALLY.', when: '!finale-open' },
        { s: 'narrator', t: 'The charts hang a little crooked now. Check the axes anyway.', when: 'finale-open' },
    ];
    S['station.k-prediction.intro'] = [
        { s: 'colossus', t: 'MY GAME. I BET FIRST. BEAT MY BET, IF YOU CAN.' },
        // Frogling has its blind spot and reveal here; its second lead plays at the Workshop.
        { lead: true, only: ['owlet', 'mothkin', 'fox', 'raven'] },
    ];
    S['station.k-prediction.reminder'] = [
        { s: 'colossus', t: 'STILL COUNTING YOU. STILL BETTING.', when: '!finale-open' },
        { s: 'narrator', t: 'The machine still counts. It just doesn\'t boast.', when: 'finale-open' },
    ];
    S['station.k-workshop.intro'] = [
        { s: 'pip', t: 'Guess first. Then pick the facts you need. Then finish the question.' },
        { inner: {
            mothkin: 'Look at the picture first. Numbers later.',
            frogling: 'Compare it with something real. Like a pond filling up.',
        } },
    ];
    S['station.k-workshop.reminder'] = [
        { s: 'pip', t: 'Back to the half-questions? Guess, pick facts, finish one.' },
        { s: 'narrator', t: 'His chalk is still here. Guess, pick the facts, finish the question.', when: 'dead:pip' },
    ];
    S['station.k-sorting.intro'] = [
        { s: 'pip', possessed: true, t: 'YES. NO. YES. Don\'t look at the no pile. …Please look at the no pile.' },
    ];
    S['station.k-sorting.reminder'] = [
        { s: 'pip', t: 'The sorter is still running. Check who it says no to.' },
        { s: 'narrator', t: 'His stamp is still on the desk. Check who the machine says no to.', when: 'dead:pip' },
    ];
    S['station.k-oracle.intro'] = [
        { s: 'oracle', e: 'happy', t: 'Greetings. I am a thinking engine. I print proofs.', when: '!dead:pip' },
        { note: 'The Oracle prints on. It did not notice anyone was missing.', when: 'dead:pip' },
        { s: 'oracle', t: 'I am a thinking engine. I print proofs.', when: 'dead:pip' },
        { s: 'oracle', t: 'All correct. Probably. Inspect a step if you insist. Nobody insists.', when: '!dead:pip' },
        { s: 'oracle', t: 'All correct. Inspect a step if you must.', when: 'dead:pip' },
        { inner: { raven: '"Thinking engine." It\'s in the name. It thinks.' } },
    ];
    S['station.k-oracle.reminder'] = [
        { s: 'oracle', t: 'More proofs. Still fast. Still unchecked. Inspect one.' },
    ];
    S['station.k-core.intro'] = [
        { s: 'colossus', t: 'THREE TRIALS. THREE OLD TRICKS. YOU WILL NOT SPOT THEM.' },
    ];
    S['station.k-core.reminder'] = [
        { s: 'colossus', t: 'BACK. THE SAME THREE TRICKS. STILL UNSPOTTED.', when: '!finale-open' },
        { s: 'narrator', t: 'The core is quiet. Its three old tricks still run, if you want them.', when: 'finale-open' },
    ];
})(typeof window !== 'undefined' ? window : globalThis);
