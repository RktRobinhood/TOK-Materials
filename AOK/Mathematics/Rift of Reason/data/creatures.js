/*
 * Species data. Source: design/ROSTER.md.
 *
 * power: Mindbug-scale 1–10. ability: a keyword id implemented by the battle
 * engine (js/battle/abilities.js). rarity weights live in data/spawns.js.
 * Art ids: 'creature/<id>/idle', 'creature/<id>/attack', 'creature/<id>/smug|angry|defeated'.
 */
(function (root) {
    'use strict';
    const Rift = root.Rift;

    Rift.data.creatures = {
        // ---- lesson 1 caricatures ----
        lobstorian: {
            name: 'Lobstorian', inspiredBy: 'Jordan Peterson', colour: 'reason', rarity: 'uncommon', power: 6, cost: 4, attack: 2, health: 4, keywords: ['guard'],
            ability: 'lecture', abilityText: 'Guard. Entrance: give an enemy creature a lecture. It can\'t attack on its next turn.',
            blurb: 'Insists on a strict hierarchy of everything, starting with lobsters. Asks you to tidy your room before you argue.',
            lines: ['Before we begin, is your room clean?', 'Let me be precise about this, roughly.', 'You assumed. Never assume.'],
        },
        astrophysicat: {
            name: 'Astrophysicat', inspiredBy: 'Neil deGrasse Tyson', colour: 'reason', rarity: 'common', power: 4, cost: 2, attack: 1, health: 3,
            ability: 'well-actually', abilityText: 'Activate (1 energy): draw a card.',
            blurb: 'Cheerfully corrects everyone, including the stars. Still not over Pluto.',
            lines: ['Well, actually…', 'The universe is under no obligation to make sense to you.', 'Pluto deserved better.'],
        },
        tremendoodle: {
            name: 'Tremendoodle', inspiredBy: 'Donald Trump', colour: 'language', rarity: 'uncommon', power: 7, cost: 5, attack: 4, health: 4,
            ability: 'nickname', abilityText: 'Entrance: nickname an enemy creature. It gets −2 attack and loses its colour.',
            blurb: 'Everything is either tremendous or a total disaster. Has a nickname for you already.',
            lines: ['Tremendous. Nobody solves puzzles like me.', 'Fake syllogism! Very fake.', 'Many people are saying it. The best people.'],
        },
        swiftlet: {
            name: 'Swiftlet', inspiredBy: 'Taylor Swift', colour: 'language', rarity: 'rare', power: 5, cost: 3, attack: 2, health: 3,
            ability: 'easter-egg', abilityText: 'Whenever anyone plays an axiom card, this gets +1/+1.',
            blurb: 'Hides clues in everything. Fans decode them for years. Has an era for every mood.',
            lines: ['Did you catch the clue? It was in the third verse.', 'This is my Logic Era.', 'Read between the lines.'],
        },
        muskrat: {
            name: 'Muskrat Rocket', inspiredBy: 'Elon Musk', colour: 'imagination', rarity: 'uncommon', power: 8, cost: 6, attack: 5, health: 6,
            ability: 'next-year', abilityText: 'Activate (1 energy): rewind the Fate track 2 rounds.',
            blurb: 'Mars by next year. Every year. Renames things at three in the morning.',
            lines: ['We land on the next node by next year. Probably.', 'I have renamed this puzzle X.', 'First principles! Also, vibes.'],
        },
        zuckerborg: {
            name: 'Zuckerborg', inspiredBy: 'Mark Zuckerberg', colour: 'imagination', rarity: 'common', power: 3, cost: 2, attack: 2, health: 1,
            ability: 'metaverse', abilityText: 'Last Word: return it to your hand (once per match).',
            blurb: 'Lives mostly in a virtual world where nobody has legs. Definitely not a lizard. Probably.',
            lines: ['Welcome to the Metaverse. Legs coming soon.', 'I am a normal human. I enjoy normal human things.', 'Engagement is up.'],
        },
        altmanta: {
            name: 'Altmanta', inspiredBy: 'Sam Altman', colour: 'imagination', rarity: 'rare', power: 6, cost: 4, attack: 3, health: 5, keywords: ['guard'],
            ability: 'predict', abilityText: 'Guard. Activate (1 energy): predict the colour of the opponent\'s next creature. If right, this gets +3/+3.',
            blurb: 'Calmly announces that everything is about to change. Glides on a chat bubble.',
            lines: ['It\'s going to be fine. Probably transformative. But fine.', 'I predicted you would say that.', 'Next token, please.'],
        },
        beastie: {
            name: 'Mr. Beastie', inspiredBy: 'MrBeast', colour: 'memory', rarity: 'uncommon', power: 5, cost: 4, attack: 2, health: 4,
            ability: 'escalate', abilityText: '+1 attack for each other creature you have played this match (max +3).',
            blurb: 'Every challenge is bigger than the last. Last one to leave the puzzle wins a puzzle.',
            lines: ['Last one to leave this circle wins ten thousand charms!', 'Bigger. We need bigger.', 'Subscribe… to logic.'],
        },
        siuuugull: {
            name: 'Siuuugull', inspiredBy: 'Cristiano Ronaldo', colour: 'memory', rarity: 'common', power: 5, cost: 3, attack: 2, health: 3,
            ability: 'every-time', abilityText: 'At the end of your turn, this gets +1 attack (max +4). Every time.',
            blurb: 'Does the same celebration every single time. You could set a clock by it. Or could you?',
            lines: ['SIUUUU!', 'Same jump. Every time. Perfection.', 'You saw the pattern? I AM the pattern.'],
        },
        rawmsay: {
            name: 'Rawmsay', inspiredBy: 'Gordon Ramsay', colour: 'emotion', rarity: 'rare', power: 6, cost: 5, attack: 3, health: 5,
            ability: 'its-raw', abilityText: 'Entrance: defeat an enemy creature with 2 or less attack.',
            blurb: 'Volcanic about undercooked arguments. Unexpectedly gentle with beginners.',
            lines: ['This argument is RAW!', 'Where is the premise?!', 'Lovely. Well done, little one.'],
        },
        speedcheeta: {
            name: 'Speedcheeta', inspiredBy: 'IShowSpeed', colour: 'emotion', rarity: 'rare', power: 4, cost: 2, attack: 2, health: 1, keywords: ['swift'],
            ability: 'hype', abilityText: 'Swift. Entrance: your other creatures get +1 attack this turn.',
            blurb: 'Screams first, thinks never. Will backflip off anything.',
            lines: ['AAAAAAH!', 'Let\'s GOOOO!', 'Is that… is that a SYLLOGISM?!'],
        },
        chimpossible: {
            name: 'Chimpossible', inspiredBy: 'Joe Rogan', colour: 'perception', rarity: 'rare', power: 6, cost: 4, attack: 3, health: 4, keywords: ['guard'],
            ability: 'pull-that-up', abilityText: 'Guard. Activate (2 energy): look at the top 3 cards of your deck and keep one.',
            blurb: 'Everything is entirely possible. Has an anecdote about a chimp for every occasion.',
            lines: ['It\'s entirely possible.', 'Jamie, pull that up.', 'Have you ever seen a chimp do a syllogism? Wild.'],
        },

        // ---- expansion (design/ROSTER.md "Expansion: 16 more caricatures") ----
        carlseal: {
            name: 'Magnus Carlseal', inspiredBy: 'Magnus Carlsen', colour: 'reason', rarity: 'uncommon', power: 6, cost: 5, attack: 3, health: 5, keywords: ['guard'],
            ability: 'foresight', abilityText: 'Guard. Entrance: look at the opponent\'s hand and draw a card.',
            blurb: 'Thinks twenty moves ahead and finds most games a bit easy. Calm. Unbearably calm.',
            lines: ['I saw this position four moves ago.', 'Interesting. Not good, but interesting.', 'Your move. Take your time. I already know it.'],
        },
        khaby: {
            name: 'Khaby Llame', inspiredBy: 'Khaby Lame', colour: 'reason', rarity: 'common', power: 4, cost: 2, attack: 1, health: 3, keywords: ['guard'],
            ability: 'deadpan', abilityText: 'Guard. A creature that attacks it loses its abilities, keywords and boosts.',
            blurb: 'Never says a word. Just holds out both hooves and shows you the obvious, simpler way.',
            lines: ['…', '(holds out both hooves, palms up)', '(raises one eyebrow very slowly)'],
        },
        eminemu: {
            name: 'Eminemu', inspiredBy: 'Eminem', colour: 'language', rarity: 'uncommon', power: 5, cost: 4, attack: 2, health: 4, keywords: ['guard'],
            ability: 'rapid-fire', abilityText: 'Guard. Can attack twice each turn.',
            blurb: 'Rhymes faster than anyone can follow. Half the argument is just the speed.',
            lines: ['Logic, syllogistic, my premises are ballistic!', 'One shot, one premise. Make it count.', 'Too fast? That\'s the point.'],
        },
        obambu: {
            name: 'Barack Obambu', inspiredBy: 'Barack Obama', colour: 'language', rarity: 'rare', power: 7, cost: 6, attack: 4, health: 6, keywords: ['guard'],
            ability: 'let-me-be-clear', abilityText: 'Guard. Entrance: restore 3 hearts to your hero.',
            blurb: 'Measured, patient, and fond of a long pause. Chews bamboo between sentences.',
            lines: ['Let me be clear.', 'Now… (long pause)… here is the thing.', 'Yes, we can. Well. Let us check the premises first.'],
        },
        beansprout: {
            name: 'Mr. Beansprout', inspiredBy: 'Rowan Atkinson\'s Mr. Bean', colour: 'language', rarity: 'common', power: 3, cost: 1, attack: 1, health: 1,
            ability: 'slapstick', abilityText: 'Shield: the first damage it takes is ignored.',
            blurb: 'Never says a word. Communicates entirely through faces, and somehow wins anyway.',
            lines: ['Hmm?', '(pulls an extremely confused face)', 'Teddy!'],
        },
        gargoyle: {
            name: 'Lady Gargoyle', inspiredBy: 'Lady Gaga', colour: 'imagination', rarity: 'uncommon', power: 6, cost: 4, attack: 3, health: 3,
            ability: 'reinvention', abilityText: 'Activate (2 energy): gain the ability of a creature in your discard pile.',
            blurb: 'A stone gargoyle with a new outrageous costume every week. Reinvention is the whole act.',
            lines: ['This week I am a syllogism.', 'Born this way. Then reborn. Several times.', 'Change the costume, change the rules.'],
        },
        haalandroid: {
            name: 'Haalandroid', inspiredBy: 'Erling Haaland', colour: 'memory', rarity: 'uncommon', power: 6, cost: 5, attack: 4, health: 4,
            ability: 'machine', abilityText: 'Deals 2 extra damage when it attacks a hero.',
            blurb: 'A meditating robot-viking who scores the same way every single match. Like a machine.',
            lines: ['Goal. Again.', 'Pattern detected. Pattern repeated.', 'Meditate. Score. Meditate. Score.'],
        },
        usainvolt: {
            name: 'Usain Volt', inspiredBy: 'Usain Bolt', colour: 'memory', rarity: 'common', power: 5, cost: 3, attack: 2, health: 2, keywords: ['swift'],
            ability: 'lightning', abilityText: 'Swift. Ignores Guard when it attacks.',
            blurb: 'A grinning electric eel who does the lightning pose after every win. And before. And during.',
            lines: ['Too fast!', '(strikes the lightning pose)', 'You blinked. I won.'],
        },
        keanu: {
            name: 'Keanu Meows', inspiredBy: 'Keanu Reeves', colour: 'memory', rarity: 'common', power: 4, cost: 3, attack: 2, health: 3, keywords: ['guard'],
            ability: 'deja-vu', abilityText: 'Guard. Last Word: return it to your hand (once per match).',
            blurb: 'A kind, sad-eyed black cat in a long coat. Walks past you twice. Wait. Déjà vu.',
            lines: ['Whoa.', 'Did you see that? I walked past twice.', 'You\'re breathtaking. Also, your argument has a glitch.'],
        },
        beeyonce: {
            name: 'Beeyoncé', inspiredBy: 'Beyoncé', colour: 'emotion', rarity: 'rare', power: 7, cost: 6, attack: 4, health: 5,
            ability: 'queen-b', abilityText: 'Your other creatures have +1 attack.',
            blurb: 'Queen B. Total command of the stage, and of the hive.',
            lines: ['The hive has spoken.', 'Bow down to a well-formed argument.', 'Flawless reasoning, darling. Check it.'],
        },
        eelish: {
            name: 'Billie Eelish', inspiredBy: 'Billie Eilish', colour: 'emotion', rarity: 'common', power: 4, cost: 2, attack: 1, health: 2,
            ability: 'whisper', abilityText: 'Entrance: an enemy creature loses its abilities, keywords and boosts.',
            blurb: 'Whispers moody ballads so quietly you have to lean in. Then you\'re hooked.',
            lines: ['(whispering) Duh.', '(very quietly) That premise is a bit sad.', 'Lean in. The flaw is in the whisper.'],
        },
        rockodile: {
            name: 'The Rockodile', inspiredBy: 'Dwayne "The Rock" Johnson', colour: 'emotion', rarity: 'uncommon', power: 7, cost: 5, attack: 3, health: 6, keywords: ['guard'],
            ability: 'the-eyebrow', abilityText: 'Guard. Takes 1 less damage from each hit.',
            blurb: 'A huge smiling crocodile with one eyebrow permanently raised. Endless motivational hype.',
            lines: ['Can you smell what the Rockodile is reasoning?', '(raises one eyebrow)', 'Be the hardest working creature in the room. Then check your premises.'],
        },
        attenbirdough: {
            name: 'Sir David Attenbirdough', inspiredBy: 'David Attenborough', colour: 'perception', rarity: 'common', power: 3, cost: 2, attack: 1, health: 2, keywords: ['guard'],
            ability: 'nature-watch', abilityText: 'Guard. Entrance: look at the top 3 cards of your deck and keep one.',
            blurb: 'An elderly puffin who whispers nature narration about everything, including you.',
            lines: ['And here, in its natural habitat, a student. Thinking.', 'Remarkable. Quite remarkable.', 'Watch closely. The truth is shy.'],
        },
        kardashiant: {
            name: 'Kim Kardashiant', inspiredBy: 'Kim Kardashian', colour: 'perception', rarity: 'common', power: 3, cost: 1, attack: 1, health: 2,
            ability: 'filter', abilityText: 'Activate (1 energy): move the Fate track 2 rounds closer.',
            blurb: 'A tiny ant whose selfie filter makes her look enormous. Seeing is not knowing.',
            lines: ['Hold on, let me find my light.', 'With the filter I am basically a lion.', 'Is this real? Does it matter? It got likes.'],
        },
        messilion: {
            name: 'Messilion', inspiredBy: 'Lionel Messi', colour: 'perception', rarity: 'uncommon', power: 6, cost: 4, attack: 3, health: 3,
            ability: 'vision', abilityText: 'When it attacks, your other creatures get +1 attack this turn.',
            blurb: 'A small, quiet lion cub who sees every pass before it happens. Siuuugull\'s eternal rival.',
            lines: ['(quietly) I saw the gap.', 'Less shouting. More seeing.', 'The ball goes where you look. So look properly.'],
        },
        shakirattle: {
            name: 'Shakirattle', inspiredBy: 'Shakira', colour: 'perception', rarity: 'uncommon', power: 5, cost: 3, attack: 3, health: 3,
            ability: 'hips-dont-lie', abilityText: 'Elusive: enemy tactics and abilities can\'t target it.',
            blurb: 'A rattlesnake in sequins. Her hips don\'t lie, so the evidence is in the body.',
            lines: ['The hips don\'t lie. People do.', 'Rattle, rattle. Evidence!', 'Watch the rattle, not the talk.'],
        },

        // ---- historical legendaries (never die) ----
        // One of a kind (a folder of one, one per deck), so a little above the curve (teacher, 17 Oct 2026):
        // Lovelace +1 attack, Tycho and Booleon cost 6 (were 7), Piet Hexling +1 health.
        euclidon: {
            name: 'Euclidon', inspiredBy: 'Euclid', colour: 'reason', rarity: 'legendary', power: 9, cost: 7, attack: 5, health: 7,
            ability: 'axiomatic', abilityText: 'Entrance: choose one of the next five shared axioms. It takes effect now.',
            blurb: 'Built a whole world from five assumptions. Very patient. Very tortoise.',
            lines: ['Let us assume very little.', 'Therefore.', 'Which was to be demonstrated.'],
        },
        lovelace: {
            name: 'Lovelace', inspiredBy: 'Ada Lovelace', colour: 'imagination', rarity: 'legendary', power: 9, cost: 6, attack: 5, health: 6,
            ability: 'program', abilityText: 'Activate (1 energy): gain the ability of a creature in your discard pile.',
            blurb: 'Saw what a machine could do before anyone built one. Hums in punched-card lace.',
            lines: ['Imagination is a kind of calculation.', 'The engine weaves patterns.', 'Shall we program the future?'],
        },
        godelix: {
            name: 'Gödelix', inspiredBy: 'Kurt Gödel', colour: 'memory', rarity: 'legendary', power: 7, cost: 6, attack: 5, health: 5,
            ability: 'unprovable', abilityText: 'Elusive. Can\'t be attacked while you control another creature.',
            blurb: 'Showed that some true things can never be proved from inside the system. Shy.',
            lines: ['This statement cannot be caught.', 'Is it true? Yes. Can you prove it? Ah.', 'Every system has a loop.'],
        },
        tycho: {
            name: 'Tycho', inspiredBy: 'Tycho Brahe', colour: 'perception', rarity: 'legendary', power: 9, cost: 6, attack: 5, health: 6,
            ability: 'measure', abilityText: 'Entrance: deal 1 damage to every enemy creature.',
            blurb: 'Measured the stars from a Danish island more precisely than anyone before telescopes. Brass nose.',
            lines: ['Measure twice. Then measure again.', 'The heavens do not lie. People do.', 'Hven has the best view.'],
        },
        booleon: {
            name: 'Booleon', inspiredBy: 'George Boole', colour: 'reason', rarity: 'legendary', power: 9, cost: 6, attack: 5, health: 6,
            ability: 'truth-table', abilityText: 'Entrance: choose TRUE (your other creatures get +1/+1) or FALSE (enemy creatures get −1 attack).',
            blurb: 'Turned logic into algebra: every statement a 0 or a 1. A dignified heron who sees every case at once.',
            lines: ['True is one. False is zero. Everything else is arithmetic.', 'Let us check every case.', 'The laws of thought are surprisingly short.'],
        },
        hexling: {
            name: 'Piet Hexling', inspiredBy: 'Piet Hein', colour: 'language', rarity: 'legendary', power: 8, cost: 6, attack: 4, health: 7,
            ability: 'grook', abilityText: 'Whenever it survives a fight, draw a card.',
            blurb: 'A Danish poet-mathematician hedgehog who writes tiny wise verses and invents games.',
            lines: ['A little verse for a little problem.', 'Problems bite back. Good.', 'Hex! I mean, hello.'],
        },
        // ---- roaming legendaries (#111, data/legendaries.js): original tricksters, never in a spawn table.
        // Passing the creature's trick challenge grants exactly one (Rift.Hunts.claim). Legendaries are one
        // of a kind and hard to win, so these sit above the curve (teacher, 17 Oct 2026): stronger versions
        // of Eelish's Whisper, Carlseal's Foresight and Altmanta's Predict. No `lines` here: their speech
        // lives in data/legendaries.js and is not voiced yet (no cast voice).
        maskip: {
            name: 'Maskip', inspiredBy: 'Original roaming trickster', colour: 'reason', rarity: 'legendary', roaming: true, lesson: 2,
            power: 8, cost: 4, attack: 3, health: 5,
            ability: 'lantern-switch', abilityText: 'Entrance: every enemy creature loses its abilities, keywords and boosts.',
            blurb: 'A lantern imp in an oversized mask. Switches the rule sign when you blink. Its lanterns never lie, even when it does.',
        },
        quibblequill: {
            name: 'Quibblequill', inspiredBy: 'Original roaming trickster', colour: 'language', rarity: 'legendary', roaming: true, lesson: 3, keywords: ['guard'],
            power: 8, cost: 4, attack: 3, health: 6,
            ability: 'cross-examine', abilityText: 'Guard. Hits deal it 1 less damage. Entrance: see the enemy\'s hand, draw 2.',
            blurb: 'An ink-stained ferret in a legal wig, buried in very official paperwork. Knows that one record can beat a whole pile.',
        },
        oddsnap: {
            name: 'Oddsnap', inspiredBy: 'Original roaming trickster', colour: 'memory', rarity: 'legendary', roaming: true, lesson: 4,
            power: 8, cost: 3, attack: 3, health: 5,
            ability: 'loaded-odds', abilityText: 'Activate (1 energy): predict the colour of the enemy\'s next creature. Right: +3/+3 and draw. Wrong: +1/+1.',
            blurb: 'A dice-tailed gremlin in a crooked paper crown. Counts everything, then sounds far more certain than its numbers.',
        },
        // Small original starter helpers (#113); no plot spawn or automatic ownership grant.
        'proof-pup': {
            name: 'Proof Pup', inspiredBy: 'Original starter helper', colour: 'reason', rarity: 'common', power: 3, cost: 2, attack: 1, health: 3,
            ability: 'fetch-proof', abilityText: 'Guard. Entrance: heal another friendly creature by 1.',
            blurb: 'Fetches the missing proof. It is slightly damp.',
            lines: ['I fetched the proof. Ignore the teeth marks.', 'The proof needs a nap.'],
        },
        'lens-lizard': {
            name: 'Lens Lizard', inspiredBy: 'Original starter helper', colour: 'perception', rarity: 'common', power: 2, cost: 1, attack: 1, health: 2,
            ability: 'lens-check', abilityText: 'Activate (1 energy): look at your top card. Keep it there or move it to the bottom.',
            blurb: 'Inspects tomorrow through very large glasses.',
            lines: ['Let me adjust my very serious glasses.', 'Tomorrow needs a closer look.'],
        },
        'paper-dragon': {
            name: 'Paper Dragon', inspiredBy: 'Original starter helper', colour: 'imagination', rarity: 'common', power: 3, cost: 2, attack: 2, health: 2,
            ability: 'fold-self', abilityText: 'Activate (1 energy): swap this creature\'s attack and health.',
            blurb: 'A fierce dragon, folded on the wrong side.',
            lines: ['Fear my very sharp paper corners.', 'New fold. New me.'],
        },
        'cloud-calf': {
            name: 'Cloud Calf', inspiredBy: 'Original starter helper', colour: 'imagination', rarity: 'common', power: 3, cost: 3, attack: 1, health: 4,
            ability: 'soft-landing', abilityText: 'Guard. At your turn\'s end, if this is damaged, restore 1 heart to your hero.',
            blurb: 'Keeps a fluffy umbrella ready for a very small disaster.',
            lines: ['I brought a spare cloud.', 'Even clouds need a rest.'],
        },
        'pocket-tortoise': {
            name: 'Pocket Tortoise', inspiredBy: 'Original starter helper', colour: 'memory', rarity: 'common', power: 2, cost: 1, attack: 1, health: 2,
            ability: 'old-pocket', abilityText: 'Activate (1 energy): move the bottom card of your deck to the top.',
            blurb: 'Finds useful things in pockets older than the pockets.',
            lines: ['I put it somewhere very safe.', 'Ah. It was in the old pocket.'],
        },
        'comma-crab': {
            name: 'Comma Crab', inspiredBy: 'Original starter helper', colour: 'language', rarity: 'common', power: 3, cost: 2, attack: 1, health: 3,
            ability: 'comma-pause', abilityText: 'Guard. Activate (1 energy): heal another friendly creature by 1.',
            blurb: 'Prescribes one very small pause, with claws.',
            lines: ['Hold still. You missed a comma.', 'A tiny pause. Not a full stop.'],
        },
        'footnote-finch': {
            name: 'Footnote Finch', inspiredBy: 'Original starter helper', colour: 'language', rarity: 'common', power: 2, cost: 1, attack: 1, health: 2,
            ability: 'tiny-print', abilityText: 'When you play an Axiom, this gets +1 attack this turn.',
            blurb: 'The smallest note always wants the last word.',
            lines: ['One tiny note before we begin.', 'Please read the tiny print next time.'],
        },
    };

    // First audited #123 batch. Existing selected portraits, stable mechanical IDs,
    // ordinary catches/copy limits. These card faces are intentionally unvoiced text.
    Object.assign(Rift.data.creatures, {
        'reason-premise-pigeon': {
            name: 'Tom Skink', inspiredBy: 'Tom Scott', colour: 'reason', rarity: 'common', power: 2, cost: 1, attack: 1, health: 2,
            ability: 'small-premise', abilityText: 'Entrance: reveal your top personal card. Draw it if it is a spell with printed cost 1 or less.',
            blurb: 'One small detail needs a surprisingly careful explanation.', lines: [], release: 'foundation-1', packEligible: true,
        },
        'emotion-courage-cub': {
            name: 'Simone Bearles', inspiredBy: 'Simone Biles', colour: 'emotion', rarity: 'common', power: 3, cost: 2, attack: 2, health: 2,
            ability: 'balanced-landing', abilityText: 'Entrance: heal your hero by 1. If this fills their hearts, gain Shield.',
            blurb: 'A tiny perfect landing. A very large bow.', lines: [], release: 'foundation-1', packEligible: true,
        },
        'perception-cue-cricket': {
            name: 'Nikkie de Jaguar', inspiredBy: 'Nikkie de Jager', colour: 'perception', rarity: 'common', power: 2, cost: 1, attack: 1, health: 2,
            ability: 'first-look', abilityText: 'Entrance: look at your top personal-deck card. Leave it there.',
            blurb: 'One closer look before the grand reveal.', lines: [], release: 'foundation-1', packEligible: true,
        },
        'language-question-quail': {
            name: 'Jimmy Fowlon', inspiredBy: 'Jimmy Fallon', colour: 'language', rarity: 'common', power: 2, cost: 1, attack: 1, health: 2,
            ability: 'let-the-guest-speak', abilityText: 'Entrance: unfreeze another friendly creature. It keeps its normal sleep and action limits.',
            blurb: 'The guest froze. The little host gives them the floor.', lines: [], release: 'foundation-1', packEligible: true,
        },
        'imagination-fable-fawn': {
            name: 'Jack Blackbird', inspiredBy: 'Jack Black', colour: 'imagination', rarity: 'common', power: 3, cost: 2, attack: 1, health: 3,
            ability: 'dramatic-reframe', abilityText: 'Entrance: swap another ally\'s attack and health. Mono-Imagination: then give it +1 maximum health and heal 1.',
            blurb: 'The smallest adventure needs the biggest entrance.', lines: [], release: 'foundation-1', packEligible: true,
        },
        'memory-recall-robin': {
            name: 'John Greenfinch', inspiredBy: 'John Green', colour: 'memory', rarity: 'common', power: 2, cost: 2, attack: 1, health: 2,
            ability: 'keep-the-last-note', abilityText: 'Entrance: put your newest discarded spell on the bottom of your personal deck.',
            blurb: 'The last footnote is never quite the last footnote.', lines: [], release: 'foundation-1', packEligible: true,
        },
    });

    // #129 expansion-2: second small audited batch. Existing selected portraits, packs plus one
    // ordinary chapter-two catch each, four-owned/two-deck limits. Unvoiced, like foundation-1.
    Object.assign(Rift.data.creatures, {
        'reason-diagonal-deer': {
            name: 'Grant Sanderstag', inspiredBy: 'Grant Sanderson', colour: 'reason', rarity: 'rare', power: 6, cost: 4, attack: 3, health: 3,
            ability: 'same-picture', abilityText: 'Entrance: an enemy creature with the same attack as this loses its abilities, keywords and boosts.',
            blurb: 'Draws the picture first. Then the hard part looks obvious.', lines: [], release: 'expansion-2', packEligible: true,
        },
        'emotion-resolve-ram': {
            name: 'Greta Thunbug', inspiredBy: 'Greta Thunberg', colour: 'emotion', rarity: 'uncommon', power: 5, cost: 4, attack: 2, health: 5,
            ability: 'hold-the-line', abilityText: 'Guard. While your hero has 4 hearts or fewer, this has +1 attack.',
            blurb: 'Calmly repeats the evidence until someone listens.', lines: [], release: 'expansion-2', packEligible: true,
        },
        'perception-scout-stoat': {
            name: 'Nelly Koalda', inspiredBy: 'Nelly Korda', colour: 'perception', rarity: 'uncommon', power: 4, cost: 3, attack: 2, health: 3,
            ability: 'walk-the-course', abilityText: 'Entrance: look at your top 2 deck cards. Put one of them on the bottom.',
            blurb: 'Walks the whole course before the first swing.', lines: [], release: 'expansion-2', packEligible: true,
        },
        'language-label-lemur': {
            name: 'Ryan Georilla', inspiredBy: 'Ryan George', colour: 'language', rarity: 'common', power: 3, cost: 2, attack: 2, health: 2,
            ability: 'quick-question', abilityText: 'Entrance: an enemy creature gets −1 attack until the end of its next turn.',
            blurb: 'Asks one very literal question about the big plan.', lines: [], release: 'expansion-2', packEligible: true,
        },
        'imagination-possibility-pika': {
            name: 'PewDiePika', inspiredBy: 'PewDiePie', colour: 'imagination', rarity: 'common', power: 3, cost: 2, attack: 2, health: 2,
            ability: 'one-more-way', abilityText: 'Entrance: choose +1 attack, or +1 maximum health and heal 1, for this creature.',
            blurb: 'There is always one more way to play this.', lines: [], release: 'expansion-2', packEligible: true,
        },
    });

    // #129 expansion-3: third small audited batch, the same rules as expansion-2 above.
    Object.assign(Rift.data.creatures, {
        'emotion-cheer-chick': {
            name: 'Terry Chews', inspiredBy: 'Terry Crews', colour: 'emotion', rarity: 'common', power: 2, cost: 2, attack: 1, health: 2,
            ability: 'big-hype', abilityText: 'Entrance: another friendly creature gets +1 attack this turn.',
            blurb: 'Every small pep talk becomes a full motivational show.', lines: [], release: 'expansion-3', packEligible: true,
        },
        'language-definition-dolphin': {
            name: 'Susie Dentshell', inspiredBy: 'Susie Dent', colour: 'language', rarity: 'uncommon', power: 4, cost: 3, attack: 1, health: 4,
            ability: 'dictionary-corner', abilityText: 'Entrance: another friendly creature gets Guard until your next turn starts.',
            blurb: 'Even a monster must wait while she finds exactly the right word.', lines: [], release: 'expansion-3', packEligible: true,
        },
        'imagination-mirror-marten': {
            name: 'Peter Jacktree', inspiredBy: 'Peter Jackson', colour: 'imagination', rarity: 'uncommon', power: 4, cost: 3, attack: 2, health: 3,
            ability: 'one-more-take', abilityText: 'Entrance: copy a friend\'s attack if it is higher (up to 4) until your next turn starts.',
            blurb: 'The scene is fine. One more take, just to be sure.', lines: [], release: 'expansion-3', packEligible: true,
        },
        'memory-archive-armadillo': {
            name: 'Niklas Landillo', inspiredBy: 'Niklas Landin Jacobsen', colour: 'memory', rarity: 'common', power: 3, cost: 2, attack: 1, health: 3,
            ability: 'last-save', abilityText: 'Guard. Last Word: put your oldest discarded spell on top of your personal deck.',
            blurb: 'Remembers every shot he ever saved.', lines: [], release: 'expansion-3', packEligible: true,
        },
    });

    // #129 expansion-4: the next bounded catalogue batch, using existing selected portraits.
    Object.assign(Rift.data.creatures, {
        'imagination-paradox-pony': {
            name: 'Pedro Platypascal', inspiredBy: 'Pedro Pascal', colour: 'imagination', rarity: 'rare', power: 5, cost: 4, attack: 3, health: 3,
            ability: 'this-is-the-swap', abilityText: 'Entrance: swap an enemy creature\'s attack and health until your next turn starts.',
            blurb: 'Takes the long way round to a very different shape.', lines: [], release: 'expansion-4', packEligible: true,
        },
        'memory-bookmark-bunny': {
            name: 'Hank Greenhare', inspiredBy: 'Hank Green', colour: 'memory', rarity: 'common', power: 2, cost: 1, attack: 1, health: 2,
            ability: 'keep-your-place', abilityText: 'Entrance: if still on your board at your next turn start, draw 1 personal card.',
            blurb: 'Marks one page, then explains why every other page matters too.', lines: [], release: 'expansion-4', packEligible: true,
        },
        'language-debate-dingo': {
            name: 'K-S-Ibis', inspiredBy: 'KSI', colour: 'language', rarity: 'uncommon', power: 4, cost: 3, attack: 3, health: 2,
            ability: 'punching-up', abilityText: 'When attacking a creature with higher attack, gain Shield for that fight only.',
            blurb: 'Chooses the biggest rival, then asks for one tiny safety rule.', lines: [], release: 'expansion-4', packEligible: true,
        },
        'emotion-grudge-goose': {
            name: 'Jack Axoloticeye', inspiredBy: 'Jacksepticeye', colour: 'emotion', rarity: 'uncommon', power: 4, cost: 3, attack: 2, health: 3,
            ability: 'one-last-shout', abilityText: 'Last Word: deal 1 damage to the enemy hero.',
            blurb: 'The final shout always needs one more final shout.', lines: [], release: 'expansion-4', packEligible: true,
        },
        'reason-counterexample-crow': {
            name: 'V-Squish', inspiredBy: 'Michael Stevens / Vsauce', colour: 'reason', rarity: 'common', power: 3, cost: 3, attack: 2, health: 2,
            ability: 'another-question', abilityText: 'Entrance: 1 damage to an enemy creature; 2 with a friend of another colour.',
            blurb: 'One small question makes the whole explanation wobble.', lines: [], release: 'expansion-4', packEligible: true,
        },
    });

    // #129 expansion-10: existing selected portraits and three bounded Entrance contracts.
    Object.assign(Rift.data.creatures, {
        'emotion-temper-tiger': {
            name: 'Jeremy Clawson', inspiredBy: 'Jeremy Clarkson', colour: 'emotion', rarity: 'uncommon', power: 4, cost: 3, attack: 3, health: 2,
            ability: 'more-speed', abilityText: 'Entrance: your hero loses 1 heart.',
            blurb: 'The tiny toy steering wheel is apparently never fast enough.', lines: [], release: 'expansion-10', packEligible: true,
        },
        'perception-lens-lynx': {
            name: 'James Rand-eater', inspiredBy: 'James Randi', colour: 'perception', rarity: 'common', power: 3, cost: 2, attack: 2, health: 2,
            ability: 'check-the-sleeve', abilityText: 'Entrance: remove an enemy creature\'s Elusive until its next turn starts.',
            blurb: 'Before admiring the mystery, quietly checks the sleeve.', lines: [], release: 'expansion-10', packEligible: true,
        },
        'imagination-doodle-duck': {
            name: 'Luka Donchilla', inspiredBy: 'Luka Doncic', colour: 'imagination', rarity: 'common', power: 2, cost: 1, attack: 1, health: 2,
            ability: 'change-position', abilityText: 'Entrance: if a friend\'s printed attack equals this creature\'s printed health, swap this creature\'s attack and health.',
            blurb: 'A matching teammate sets up an unexpected change of position.', lines: [], release: 'expansion-10', packEligible: true,
        },
    });

    // #129 expansion-13: existing selected portrait and one bounded damage reaction.
    Rift.data.creatures['emotion-spite-sprite'] = {
        name: 'Kai Ceenat', inspiredBy: 'Kai Cenat', colour: 'emotion', rarity: 'common', power: 3, cost: 2, attack: 1, health: 3,
        ability: 'big-reaction', abilityText: 'Once per turn, after surviving damage, gain +1 attack until your next turn starts.',
        blurb: 'One small hit. A reaction that barely fits inside the headset.', lines: [], release: 'expansion-13', packEligible: true,
    };

    // #132 plot identities: their actual earned source is the permanent Acquisition registry.
    function plotCreature(name,inspiredBy,colour,attack,health,ability,abilityText,blurb){
        return {name,inspiredBy,colour,rarity:'rare',power:5,cost:5,attack,health,ability,abilityText,blurb,lines:[],release:'plot-1',packEligible:false};
    }
    Object.assign(Rift.data.creatures,{
        'reason-inference-heron':plotCreature('James Mayfly','James May','reason',3,5,'patient-conclusion','Once per turn, after another friend survives a fight at 1 health, draw 1 personal card.','The tiny detail needs a surprisingly patient explanation.'),
        'emotion-heartfire-hawk':plotCreature('LeBrontosaurus','LeBron James','emotion',3,4,'big-team-talk','Once per turn, after your hero loses hearts on your turn, your oldest other creature gains 1 attack this turn.','A small setback. A very large team talk.'),
        'perception-exposure-eagle':plotCreature('Houdini Wisp','Harry Houdini','perception',3,5,'open-the-lock','Entrance: remove one chosen enemy keyword: Guard, Shield or Elusive.','The impossible fastening is now an ordinary open lock.'),
        'language-contract-coyote':plotCreature('Jenna Otterga','Jenna Ortega','language',3,5,'serious-favour','Your first spell each turn targeting a friendly creature costs 1 less, minimum 0. Multiple copies do not stack.','This perfectly ordinary favour sounds very serious.'),
        'imagination-cloud-castle-crab':plotCreature('Ariana Crande','Ariana Grande','imagination',2,6,'paper-backup','Guard. The first time each turn this survives damage, summon a colourless 1/1 Paper if there is space.','The tiny entrance needs one more paper backup performer.'),
        'memory-second-chance-salamander':plotCreature('Downewt Jr.','Robert Downey Jr.','memory',3,4,'one-more-cameo','Entrance: return a defeated creature with printed cost 3 or less to hand. It gains 1 maximum health on its next play only.','Surely this little scene has room for one more cameo.'),
    });

    // Starter content begins with the adventure; grants are handled by the owned-deck ticket.
    Rift.data.starterSpecies = ['proof-pup', 'lens-lizard', 'paper-dragon', 'cloud-calf', 'pocket-tortoise', 'comma-crab', 'footnote-finch'];

    // Rarity weights used by catch odds and spawn tables.
    Rift.data.rarities = {
        common: { weight: 60, catchBase: 0.7 },
        uncommon: { weight: 28, catchBase: 0.5 },
        rare: { weight: 10, catchBase: 0.32 },
        // Metadata support is not approval of catch tuning. No Mythic wild source yet.
        mythic: { weight: 0, catchBase: null },
        legendary: { weight: 2, catchBase: 0.15 },
    };
})(typeof window !== 'undefined' ? window : globalThis);
