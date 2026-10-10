// The ElevenLabs sound-effect plan (tools/sfx-eleven.mjs renders it to assets/sfx/el/).
// Each entry: [name, seconds, prompt, variants]. Variant files are <name>-<n>.mp3; the game picks one at
// random (data/sfx-el.js maps the name to every file that exists).
// Creature sounds are real-animal calls that fit each caricature's animal (plus a touch of its gimmick),
// never speech: the spoken barks are Gemini voice lines (data/creatures.js `barks`).

const STYLE = 'cartoon fantasy card game sound effect, clean, close mic, no music, no speech, no words';
const p = text => text + ', ' + STYLE;

// Spells by Way of Knowing (tactic cards), plus colourless.
const CAST = {
    reason: 'precise crystalline chime and a clockwork click, like a proof snapping shut, cool blue magic',
    language: 'quick sparkle of whispering paper pages and a bright bell, golden word magic',
    imagination: 'dreamy rising shimmer with a soft whoosh and twinkling stars, purple magic',
    memory: 'gentle rewind swirl with a low music-box ping, silver echo magic',
    emotion: 'warm heartbeat thump bursting into a fiery whoosh, red passion magic',
    perception: 'airy lens focusing zoom with a clear glassy ping, green nature magic',
    colourless: 'simple soft magic card flick with a light sparkle',
};

// Tactics that get their own sound instead of the colour spell.
const TACTICS = {
    counterexample: 'a sharp record scratch then a glass pane cracking',
    eureka: 'a bright lightbulb ding with a rising sparkle',
    'occams-razor': 'a single clean razor blade slice, swish and shing',
    'proof-by-contradiction': 'a paradox: a rising tone that twists and shatters like glass',
    qed: 'a triumphant short brass hit and a heavy stamp of approval',
    'total-recall': 'a fast tape rewind whirr ending in a bright snap',
    'big-claims': 'a dramatic orchestral sting, then a disappointed deflating balloon',
    clockwork: 'a ticking clock and gears turning, then a winding ratchet',
    'peer-review': 'a crowd murmur and a rubber stamp thud',
    'safety-net': 'a springy net catching something with a soft bounce',
    'second-wind': 'a big refreshing gust of wind and a deep breath of air',
    'stand-firm': 'a heavy metal shield planted on stone with a solid clang',
    'rally-cry': 'a short heroic war horn blast',
    'wave-of-feeling': 'a warm ocean wave rushing in and crashing',
    'gut-reaction': 'a fast punchy gut thump and whoosh',
    persuasion: 'a smooth sly slide whistle and a charming harp gliss',
    'rousing-speech': 'a crowd cheering briefly',
    daydream: 'a soft dreamy harp gliss with bubbles',
    'dream-big': 'a huge magical swell that blooms into sparkles',
    nostalgia: 'a vintage gramophone crackle with a soft chime',
    'look-closer': 'a magnifying glass zoom whoosh with a sparkle',
    'pep-talk': 'an encouraging bright chime and a pat on the back',
};

// Creature calls lean into the caricature (teacher, 10 Oct): the real animal's voice doing the persona's
// signature gimmick, with no intelligible words (the spoken barks are Gemini lines in data/barks.js).
// [animal, signature (enter and attack), how it gets hurt or loses].
const CREATURES = {
    lobstorian: ['a lobster clacking its claws', 'a stern lecturing clack-clack like a pointer tapping a desk, then a sharp claw snap', 'a sputtering offended clatter'],
    astrophysicat: ['a house cat', 'a delighted know-it-all meow over a twinkling cosmic shimmer', 'an indignant cat yowl'],
    tremendoodle: ['a fluffy poodle', 'a loud boastful bark echoing like a stadium rally with a crowd cheer', 'a whiny outraged yap'],
    swiftlet: ['a little swift bird', 'a sweet trilling chirp that sparkles like a pop song hook, a stadium crowd gasp', 'a heartbroken little chirp'],
    muskrat: ['a muskrat squeaking', 'an excited squeak riding a sputtering rocket engine that roars to life', 'a squeak and a rocket explosion fizzling out'],
    zuckerborg: ['a gecko', 'flat robotic gecko clicks with a digital glitch and a soft notification ping', 'a glitching gecko click and a computer shutdown tone'],
    altmanta: ['a manta ray gliding underwater', 'a calm deep underwater whoosh and a soothing chat notification chime', 'a calm hum that glitches out'],
    beastie: ['a huge fluffy beast', 'a friendly hyped roar, confetti cannons popping and a crowd cheering', 'a sad deflated groan and a lonely kazoo'],
    siuuugull: ['a muscular seagull', 'a squawk that stretches into a huge triumphant long SIUUU-like cry with a stadium roar', 'a squawk that cracks mid-cry'],
    rawmsay: ['a lamb', 'a furious shouting bleat, a frying pan clang and sizzling steam', 'an exasperated bleat and a pot boiling over'],
    speedcheeta: ['a cheetah cub', 'a hyped screaming yelp, wild and over the top, with a fast whoosh', 'a dramatic screaming wail'],
    chimpossible: ['a chimpanzee', 'amazed excited hoots building to an astonished whoa-like screech', 'a baffled descending hoot'],
    carlseal: ['a seal', 'a calm smug honk and a chess piece clicking onto a board', 'a surprised honk and a chess board tipping over'],
    khaby: ['a llama', 'a silent deadpan beat, then one unimpressed llama snort and a soft ta-da sting', 'a tired llama sigh'],
    eminemu: ['an emu', 'deep emu drumming booms in a fast rap beat rhythm with record scratch', 'a drum beat that stumbles and stops'],
    obambu: ['a giant panda', 'a thoughtful panda hum, a long pause, then a calm bamboo crunch and a small crowd applause', 'a gentle tired panda sigh'],
    beansprout: ['a teddy bear', 'a rubbery squeaky toy squeak and a silly confused grumble, slapstick boing', 'a squeaky toy deflating, slapstick bonk'],
    gargoyle: ['a stone gargoyle', 'grinding stone growl with flapping stone wings and a dramatic fashion-runway whoosh', 'stone cracking and crumbling'],
    haalandroid: ['a robot viking', 'mechanical servo whirr, a deep robotic grunt and a football thumping into a net', 'a robot power-down whine'],
    usainvolt: ['an electric eel', 'a crackling electric zap, a lightning crack and a sprinting whoosh', 'an electric fizzle and splash'],
    keanu: ['a black cat', 'a low cool meow, a slow-motion bullet whoosh and a deep purr', 'a soft sad meow fading into an echo'],
    beeyonce: ['a queen bee', 'a powerful diva buzz with a swarm swelling like an arena crowd cheering', 'a buzz that sputters out'],
    eelish: ['an eel', 'a moody whispery breathy hiss, slippery and quiet, with a soft bass thump', 'a quiet sad gurgle'],
    rockodile: ['a huge crocodile', 'a deep rumbling croc growl, a jaw snap and a cartoon eyebrow-raise ding', 'a heavy thud and a groaning growl'],
    attenbirdough: ['an elderly puffin', 'hushed puffin purring grunts, sea wind and a gentle wave, like a nature film', 'a soft weary puffin grunt'],
    kardashiant: ['a tiny ant', 'tiny clicking ant mandibles, a camera shutter burst and a glamorous sparkle', 'a tiny squeak and a phone dropping'],
    messilion: ['a lion cub', 'a small determined roar and a football tapped neatly with a soft crowd gasp', 'a little whimpering growl'],
    shakirattle: ['a rattlesnake', 'a rhythmic hip-shaking rattle like a dance shaker and a sly hiss', 'a rattle that slows and stops'],
    euclidon: ['a tortoise', 'a slow wise tortoise grunt, a shell scrape and a chalk tap', 'a slow sinking groan'],
    lovelace: ['a hummingbird', 'rapid wing hum, tiny chirps and a clattering punched-card loom machine', 'a machine clatter winding down'],
    godelix: ['a shy owl', 'a soft shy hoot echoing back on itself like a loop, paper rustling', 'a hoot that loops and fades'],
    tycho: ['an elk', 'a noble bugling call with a ringing brass bell and a telescope clicking into place', 'a low tired bellow and a brass clang'],
    booleon: ['a heron', 'a dignified croak and two clean electronic beeps like one and zero', 'a croak and a falling error beep'],
    hexling: ['a hedgehog', 'snuffly huffs, quills rustling and a tiny playful puzzle-piece click', 'a small snuffly squeak'],
};

const MOOD = {
    enter: (a, s) => `${a}: ${s}, as it arrives`,
    attack: (a, s) => `${a} attacks: ${s}, fierce and short`,
    hurt: (a, s, h) => `${a} gets hit: ${h}, short`,
    die: (a, s, h) => `${a} is defeated: ${h}, falling and fading out`,
};

// Ambience loops (seamless, ElevenLabs loop mode). data/ambience.js maps scene art to these; the two
// tension layers fade in on top as danger rises (js/core/ambience.js).
const AMB = 'seamless ambience loop, background atmosphere, no music, no speech, no words, no sudden loud sounds';
const AMBIENCE = {
    title: 'a crackling magical energy rift: buzzing electric arcs, sizzling sparks, deep pulsing energy hum, occasional distant thunder rolls',
    valley: 'peaceful green valley meadow, gentle breeze in grass, distant songbirds, a faint babbling stream',
    town: 'small storybook village by day, distant indistinct crowd murmur, cart wheels on cobbles, birds, a far bell',
    future: 'futuristic city plaza, soft hover-car whooshes, buzzing neon signs, electronic hum, distant crowd murmur',
    tower: 'inside a huge server room, whirring cooling fans, electrical hum, relays clicking',
    core: 'ominous energy core chamber, deep slow pulsing throb, crackling electricity, low rumble',
    forest: 'daytime woodland path, leaves rustling, woodpecker in the distance, birdsong, twigs creaking',
    river: 'a river flowing under an old wooden bridge, water lapping, creaking planks, light wind',
    pass: 'stormy mountain pass beside a tear in time: howling wind, crackling electric energy arcs, sizzling sparks, rolling thunder, deep humming rift',
    well: 'old stone wishing well, water drips echoing deep inside, birds and breeze outside',
    fair: 'busy village fairground, cheerful indistinct crowd murmur, game bells ringing, distant carousel creaks',
    cosy: 'cosy cottage interior, crackling hearth fire, slow clock ticking, kettle simmering',
    kitchen: 'busy rustic kitchen, roaring oven fire, bubbling pot, pans clattering softly',
    feast: 'great feast hall, indistinct crowd murmur, cutlery and plates, big fireplace crackling',
    school: 'quiet old schoolroom, chalk scratching, pages turning, clock ticking, birds outside the window',
    gallery: 'quiet echoing museum gallery, distant soft footsteps, faint air hum',
    court: 'tense quiet courtroom, indistinct whispers, wooden benches creaking, papers shuffling',
    oracle: 'mystical oracle chamber, soft resonant crystal hum, slow water drips, faint shimmer',
    clock: 'inside a giant clock tower, big gears ticking and grinding, wind whistling through',
    'arena-l1': 'outdoor creature battle arena in a sunny valley, small excited crowd of animals murmuring, birds, flags flapping in wind',
    'arena-l2': 'town square battle arena at dusk, crackling torches, excited indistinct crowd murmur',
    'arena-l3': 'futuristic neon battle arena, electronic hum, echoing crowd murmur, buzzing lights',
    'arena-l4': 'battle arena inside a vast dark server tower, ominous hum, electrical sparks, distant rumble',
    table: 'quiet tavern card table, fireplace crackling, low indistinct chatter, mugs clinking',
    'tension-1': 'uneasy low cinematic drone with a slow distant heartbeat, ominous',
    'tension-2': 'urgent fast heartbeat and rapid clock ticking over a tense cinematic drone, rising danger',
};

export const PLAN = [
    ...Object.entries(AMBIENCE).map(([id, t]) => ['amb-' + id, 20, t + ', ' + AMB, 1]),
    // ---- card plays ----
    ...Object.entries(CAST).map(([c, t]) => ['cast-' + c, 1.4, p('spell cast: ' + t), 2]),
    ...Object.entries(TACTICS).map(([id, t]) => ['tactic-' + id, 1.6, p(t), 1]),
    ['summon', 1.0, p('a magic trading card slapped onto a wooden table with a soft magical poof'), 3],
    ['axiom', 1.8, p('an ancient rule scroll unrolls with a deep gong, the rules of the world change'), 2],
    ['reset', 1.6, p('a big reverse whoosh as everything resets, ending in a soft bell'), 1],
    ['item-use', 1.0, p('pulling a small item from a leather bag, a pop and a twinkle'), 2],
    ['power', 1.6, p('a hero special power charging up and releasing, heroic shimmer and burst'), 2],
    ['activate', 1.0, p('a creature ability activates, a short glowing magical charge-up'), 2],
    ['steal', 1.4, p('a sneaky mind-control swirl, the creature swaps sides, wobbly hypnotic tone'), 2],
    ['draw', 0.6, p('a single playing card drawn quickly from a deck, crisp swish'), 2],
    ['rift', 2.0, p('a rift in time tears open: rising electric energy crackle, a sharp lightning crack and a deep whooshing portal'), 2],
    ['fate-warp', 1.6, p('a time warp: sizzling electric zap that bends and swirls into a whoosh'), 1],
    ['splash', 3.0, p('a huge lightning strike with a sharp crack, crackling electric energy and a rolling thunder boom'), 1],
    ['fizzle', 1.0, p('a magic spell fizzling out, sad puff of smoke'), 1],
    // ---- combat ----
    ['slash', 0.8, p('a quick claw slash whoosh'), 3],
    ['fight', 1.0, p('two creatures clash, a heavy thud and scuffle'), 3],
    ['impact', 0.7, p('a solid punchy hit impact'), 3],
    ['shield', 1.0, p('a magic bubble shield blocks a hit, a glassy boing'), 2],
    ['guard', 1.0, p('a wooden shield takes a blow, solid block thunk'), 2],
    ['defeat', 1.2, p('a defeated creature vanishes in a puff of smoke and sparkles'), 3],
    ['buff', 1.0, p('a rising power-up sparkle, getting stronger'), 2],
    ['heal', 1.2, p('a gentle healing chime with warm sparkles'), 1],
    // ---- heroes getting hit ----
    ['hurt-boy', 0.7, 'a young boy cartoon pain grunt, short "oof" as he is hit, no words, video game hurt sound', 4],
    ['hurt-girl', 0.7, 'a young girl cartoon pain grunt, short "ugh" as she is hit, no words, video game hurt sound', 4],
    ['hurt-man', 0.7, 'an adult man cartoon pain grunt as he is hit, short, no words, video game hurt sound', 3],
    ['hurt-woman', 0.7, 'an adult woman cartoon pain grunt as she is hit, short, no words, video game hurt sound', 3],
    ['hero-hit', 0.8, p('a sharp sword slash cut into cloth with a thud'), 3],
    // ---- creatures ----
    ...Object.entries(CREATURES).flatMap(([id, [a, s, h]]) => Object.entries(MOOD).map(([kind, f]) =>
        ['cr-' + id + '-' + kind, kind === 'die' ? 1.6 : kind === 'hurt' ? 1.0 : 1.5, f(a, s, h) + ', cartoon creature sound effect, no music, no intelligible words',
            kind === 'enter' || kind === 'attack' ? 2 : 1])),
];

export const CREATURE_IDS = Object.keys(CREATURES);
export const TACTIC_IDS = Object.keys(TACTICS);
