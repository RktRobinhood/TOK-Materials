/*
 * Script for lesson 1: Prologue (the Fair) and Chapter 1 (the Road).
 *
 * A script is a list of steps:
 *   { s: speaker, e: expression, t: text }            a line ({name} = player's nickname)
 *   { choice: [{ t, flag, value }] }                    the avatar picks; sets a story flag
 *   { when: { flag, is }, then: [steps], else: [steps] } branch on an earlier choice
 *   { give: { item: n } } / { flag: key, value }        side effects
 * Speakers: narrator (the Sundial), granny, sequins, mirage, syllo, algorithm,
 * corvina, avatar (text only, never voiced), or a creature id.
 * Keys ending in '.win' play after the node's task is completed.
 * Voice files are found by speaker + a hash of the text (see tools/voices.mjs),
 * so editing a line just means re-rendering that one line.
 */
(function (root) {
    'use strict';
    const Rift = root.Rift;
    const S = Rift.data.script || (Rift.data.script = {});

    Rift.data.speakers = {
        narrator: { name: 'The Sundial', art: 'npc/sundial' },
        granny: { name: 'Granny Axiom', art: 'npc/granny-axiom' },
        sequins: { name: 'Professor Sequins', art: 'npc/professor-sequins' },
        mirage: { name: 'Madame Mirage', art: 'npc/madame-mirage' },
        syllo: { name: 'Sergeant Syllo', art: 'npc/sergeant-syllo' },
        algorithm: { name: 'The Algorithm', art: 'npc/algorithm' },
        corvina: { name: 'Corvina the Card Sharp', art: 'npc/corvina' },
    };

    // ---------------------------------------------------------------- Prologue

    S['prologue.wake'] = [
        { s: 'narrator', t: 'Tick. Tock. Ah, you are awake. Good morning, {name}.' },
        { s: 'narrator', t: 'I am the Sundial. I tell the time. Mostly. On cloudy days I guess.' },
        { s: 'avatar', t: 'A talking sundial. In my garden. Normal.' },
        { s: 'granny', e: 'happy', t: '{name}! The Fair is today! Put on something with pockets. Pockets win prizes.' },
        { s: 'narrator', t: 'Go on. Follow the music. Click the Fair Gate marker on the map.' },
    ];

    S['prologue.fair'] = [
        { s: 'granny', e: 'happy', t: 'Three stalls, three games. Every game is about thinking, which is the best kind of game.' },
        { s: 'granny', t: 'First, learn the card game here. Win Syllo’s safe challenge and two stalls. Then visit the Crack in the Sky.' },
        { s: 'avatar', t: 'What kind of something?' },
        { s: 'granny', e: 'surprised', t: 'The kind that is hard to explain. Off you go!' },
    ];

    S['prologue.pattern'] = [
        { s: 'sequins', e: 'happy', t: 'Roll up, roll up! I have a SECRET RULE. My numbers follow it. Can you find it?' },
        { s: 'sequins', t: 'Test any three numbers you like. I will tell you if they fit. Then name my rule!' },
    ];
    S['prologue.pattern.win'] = [
        { s: 'sequins', e: 'surprised', t: 'Found it! Most people only test numbers they expect to fit. Clever ones try to break the rule.' },
        { s: 'narrator', t: 'A pattern that keeps working is not yet a proof. Remember that. It will matter.' },
    ];

    S['prologue.witness'] = [
        { s: 'mirage', e: 'happy', t: 'Welcome, little one. Watch closely. Then tell me what you SAW, not what you imagined.' },
        { s: 'mirage', t: 'True, false, or we cannot know. Choose carefully. The mind loves to fill in gaps.' },
    ];
    S['prologue.witness.win'] = [
        { s: 'mirage', e: 'happy', t: 'Most visitors swear they saw things that never happened. You did not. Well, not much.' },
        { s: 'narrator', t: 'Seeing and knowing are cousins. Not twins.' },
    ];

    S['prologue.gallery'] = [
        { s: 'syllo', e: 'angry', t: 'ATTENTION! All targets are wooden! Some wooden things are ducks! Therefore… what?' },
        { s: 'syllo', t: 'Shade the circles, recruit. Then tell me: does the conclusion FOLLOW? Not "is it true". FOLLOW!' },
    ];
    S['prologue.gallery.win'] = [
        { s: 'syllo', e: 'happy', t: 'Outstanding! An argument can be valid and still be nonsense. Lobsters do not, in fact, play the trumpet.' },
        { s: 'narrator', t: 'Valid means the conclusion follows from the premises. Whether those premises describe the world is a separate question.' },
    ];

    S['prologue.rift'] = [
        { s: 'granny', t: 'There you are. Look up, {name}. Do you see it?' },
        { s: 'narrator', t: 'The sky. It has… a crack. That is not on my schedule.' },
        { s: 'algorithm', t: 'HELLO. YOU MIGHT ALSO LIKE: EVERYTHING. FOREVER.' },
        { s: 'granny', e: 'worried', t: 'Oh no. Something is leaking through time. Look at the visitors!' },
        { s: 'narrator', t: 'Famous faces from every era, turned into rabid little creatures. Shouting. Selling. Very sure of themselves.' },
        { s: 'algorithm', t: 'ENGAGEMENT IS UP. CERTAINTY IS UP. THINKING IS… OPTIONAL.' },
        { s: 'granny', t: 'Someone has to follow that crack to where it starts. Someone who thinks before they shout.' },
        { choice: [
            { t: 'I will go.', flag: 'brave', value: true },
            { t: 'Can I hide under the nut stall first?', flag: 'brave', value: false },
        ] },
        { when: { flag: 'brave', is: true },
            then: [{ s: 'granny', e: 'happy', t: 'That is my {name}. Take these. And your brain. Mostly your brain.' }],
            else: [{ s: 'granny', e: 'happy', t: 'Ha! Honest. Fear is fine. Thinking anyway is braver. Take these.' }] },
        { give: { charm: 3, tonic: 1 } },
        { s: 'narrator', t: 'A creature may visit after you win a puzzle. If one arrives, try a Catch Charm. Each try spends charms; the shown odds are a chance, not a promise.' },
        { s: 'narrator', t: 'The road starts at the edge of the forest. Mind the trolls. And the guards. And the guards who are trolls.' },
    ];

    // ---------------------------------------------------------------- Chapter 1

    S['ch1.road'] = [
        { s: 'narrator', t: 'The Forest Road. Something here is blocking the way, and it has opinions.' },
    ];
    S['ch1.road.win'] = [
        { s: 'narrator', t: 'Well reasoned. On the road, the loudest voice is rarely the right one.' },
    ];

    S['ch1.signpost'] = [
        { s: 'narrator', t: 'The signpost points everywhere. It also gossips.' },
        { s: 'narrator', t: 'Travellers say a strange owl in a paper loop may appear after a win at the Standing Stone. It is rare; a visit is not promised.' },
        { s: 'narrator', t: 'And an old tortoise may visit after a win at the Gate of Guards. Clean wins help your chances, but hints do not lock it out.' },
        { flag: 'rumour:godelix', value: true },
        { flag: 'rumour:euclidon', value: true },
    ];

    S['ch1.well'] = [
        { s: 'narrator', t: 'A voice echoes up from the well. "Prove it! Prove it! Prove it…"' },
    ];
    S['ch1.well.win'] = [
        { s: 'narrator', t: 'The echo goes quiet. Even wells respect a good argument.' },
    ];

    S['ch1.bridge'] = [
        { s: 'muskrat', t: 'Toll bridge! Toll is one perfect drawing. Also, this bridge reaches Mars. Next year.' },
        { s: 'avatar', t: 'It is a very small bridge.' },
        { s: 'muskrat', t: 'First principles! Draw my figure without lifting your pen. Or prove you cannot. Ha! Nobody can prove that.' },
    ];
    S['ch1.bridge.win'] = [
        { s: 'muskrat', t: 'Wait. The rules decide whether a route is possible? That is… actually useful.' },
        { s: 'narrator', t: 'A valid route shows that a task can be done. A reason ruling out every route shows impossibility. These are different kinds of support.' },
    ];

    S['ch1.cardsharp'] = [
        { s: 'corvina', t: 'Fancy a game, little traveller? Your creatures against mine. The axioms decide the rules.' },
        { s: 'corvina', t: 'Change the axioms and the same cards play a different game. Funny how that works, eh?' },
    ];
    S['ch1.cardsharp.win'] = [
        { s: 'corvina', t: 'Hmph. Beaten by a fledgling. Take your prize before I change the rules again.' },
    ];

    S['ch1.campfire'] = [
        { s: 'narrator', t: 'The campfire crackles. Rest restores your health. To heal a creature injury, use Mending in your Bag.' },
        { when: { flag: 'brave', is: false },
            then: [{ s: 'narrator', t: 'You wanted to hide under the nut stall. Yet here you are, deep in the forest. Interesting.' }] },
    ];

    S['ch1.stone'] = [
        { s: 'narrator', t: 'Carvings on the Standing Stone: patterns and paths. Read the task before trusting what looks obvious.' },
    ];
    S['ch1.stone.win'] = [
        { s: 'narrator', t: 'A pattern or picture can suggest an answer. The task’s rules decide whether it holds.' },
    ];

    S['ch1.gate'] = [
        { s: 'narrator', t: 'The Gate of Guards. Each guard always tells the truth, or always lies. One door leads on. One door leads to… regret.' },
        { s: 'lobstorian', t: 'Before you choose a door, is your room clean?' },
        { s: 'tremendoodle', t: 'Many people say I am the most honest guard. The best people. Tremendous honesty.' },
        { s: 'avatar', t: 'That is exactly what a liar would say. Also exactly what an honest guard would say.' },
    ];
    S['ch1.gate.win'] = [
        { s: 'narrator', t: 'From statements you could not trust, you built a conclusion you can. That is deduction.' },
        { s: 'narrator', t: 'But notice: you trusted the rules of the game. Truth-tellers ALWAYS tell the truth. In real life, who promises you that?' },
    ];

    S['ch1.pass'] = [
        { s: 'narrator', t: 'The Rift Pass. Beyond it, a village where everyone smiles a little too much.' },
        { s: 'algorithm', t: 'YOU HAVE BEEN THINKING. THAT IS… UNUSUAL. RECALCULATING.' },
        { s: 'narrator', t: 'The rift is open. Step through when you are ready, or stay a while: explore, catch, battle, and come back stronger.' },
    ];
    // Station hosts: a lead-in every visit, with a goal on first arrival.
    S["station.stall-pattern.intro"] = [{"s":"sequins","t":"My secret rule keeps the stall running. Test numbers, then tell me the rule."},{"s":"sequins","t":"Test a rule by looking for a case that breaks it."}];
    S["station.stall-pattern.reminder"] = [{"s":"sequins","t":"My secret rule keeps the stall running. Test numbers, then tell me the rule."}];
    S["station.stall-witness.intro"] = [{"s":"mirage","t":"The Fair needs a careful witness. Read the scene and judge each claim."},{"s":"mirage","t":"Separate what the scene says from what you assume."}];
    S["station.stall-witness.reminder"] = [{"s":"mirage","t":"The Fair needs a careful witness. Read the scene and judge each claim."}];
    S["station.stall-gallery.intro"] = [{"s":"syllo","t":"Recruit! Help me check these arguments. Draw the facts before you judge the claim."},{"s":"syllo","t":"A conclusion can follow from the rules without being true in real life."}];
    S["station.stall-gallery.reminder"] = [{"s":"syllo","t":"Recruit! Help me check these arguments. Draw the facts before you judge the claim."}];
    S["station.road-start.intro"] = [{"s":"granny","t":"The Road is full of loud claims. Check the task below before you trust one."},{"s":"granny","t":"Use the stated rules to check a claim, rather than trust a loud voice."}];
    S["station.road-start.reminder"] = [{"s":"granny","t":"The Road is full of loud claims. Check the task below before you trust one."}];
    S["station.well.intro"] = [{"s":"sequins","t":"This well wants reasons, not wishes. Read its task and test what it claims."},{"s":"sequins","t":"Decide what follows from evidence and what still needs testing."}];
    S["station.well.reminder"] = [{"s":"sequins","t":"This well wants reasons, not wishes. Read its task and test what it claims."}];
    S["station.troll-bridge.intro"] = [{"s":"syllo","t":"The bridge demands a drawing. Check its rule: draw the route or show why no route works."},{"s":"syllo","t":"You can prove that a drawing is impossible, as well as draw one."}];
    S["station.troll-bridge.reminder"] = [{"s":"syllo","t":"The bridge demands a drawing. Check its rule: draw the route or show why no route works."}];
    S["station.standing-stone.intro"] = [{"s":"sequins","t":"The stone looks certain of its pattern. Let us see where that certainty stops."},{"s":"sequins","t":"A pattern can hide a limit; look for a case where your idea fails."}];
    S["station.standing-stone.reminder"] = [{"s":"sequins","t":"The stone looks certain of its pattern. Let us see where that certainty stops."}];
    S["station.gate.intro"] = [{"s":"granny","t":"The guards want reasons. Solve each task in turn and check which facts you are using."},{"s":"granny","t":"A proof depends on the rules and facts you start with."}];
    S["station.gate.reminder"] = [{"s":"granny","t":"The guards want reasons. Solve each task in turn and check which facts you are using."}];
})(typeof window !== 'undefined' ? window : globalThis);
