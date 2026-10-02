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
            name: 'Lobstorian', inspiredBy: 'Jordan Peterson', colour: 'reason', rarity: 'uncommon', power: 6,
            ability: 'lecture', abilityText: 'When it blocks, the attacker loses its ability this turn.',
            blurb: 'Insists on a strict hierarchy of everything, starting with lobsters. Asks you to tidy your room before you argue.',
            lines: ['Before we begin, is your room clean?', 'Let me be precise about this, roughly.', 'You assumed. Never assume.'],
        },
        astrophysicat: {
            name: 'Astrophysicat', inspiredBy: 'Neil deGrasse Tyson', colour: 'reason', rarity: 'common', power: 4,
            ability: 'well-actually', abilityText: 'On play, peek at the next axiom card.',
            blurb: 'Cheerfully corrects everyone, including the stars. Still not over Pluto.',
            lines: ['Well, actually…', 'The universe is under no obligation to make sense to you.', 'Pluto deserved better.'],
        },
        tremendoodle: {
            name: 'Tremendoodle', inspiredBy: 'Donald Trump', colour: 'language', rarity: 'uncommon', power: 7,
            ability: 'nickname', abilityText: 'On play, give an enemy creature a nickname: it loses its colour this round.',
            blurb: 'Everything is either tremendous or a total disaster. Has a nickname for you already.',
            lines: ['Tremendous. Nobody solves puzzles like me.', 'Fake syllogism! Very fake.', 'Many people are saying it. The best people.'],
        },
        swiftlet: {
            name: 'Swiftlet', inspiredBy: 'Taylor Swift', colour: 'language', rarity: 'rare', power: 5,
            ability: 'easter-egg', abilityText: 'On play, reveal one card in the opponent\'s hand.',
            blurb: 'Hides clues in everything. Fans decode them for years. Has an era for every mood.',
            lines: ['Did you catch the clue? It was in the third verse.', 'This is my Logic Era.', 'Read between the lines.'],
        },
        muskrat: {
            name: 'Muskrat Rocket', inspiredBy: 'Elon Musk', colour: 'imagination', rarity: 'uncommon', power: 8,
            ability: 'next-year', abilityText: 'Can\'t attack the turn it is played.',
            blurb: 'Mars by next year. Every year. Renames things at three in the morning.',
            lines: ['We land on the next node by next year. Probably.', 'I have renamed this puzzle X.', 'First principles! Also, vibes.'],
        },
        zuckerborg: {
            name: 'Zuckerborg', inspiredBy: 'Mark Zuckerberg', colour: 'imagination', rarity: 'common', power: 3,
            ability: 'metaverse', abilityText: 'The first time it is defeated, return it to your hand.',
            blurb: 'Lives mostly in a virtual world where nobody has legs. Definitely not a lizard. Probably.',
            lines: ['Welcome to the Metaverse. Legs coming soon.', 'I am a normal human. I enjoy normal human things.', 'Engagement is up.'],
        },
        altmanta: {
            name: 'Altmanta', inspiredBy: 'Sam Altman', colour: 'imagination', rarity: 'rare', power: 6,
            ability: 'predict', abilityText: 'On play, guess the opponent\'s next creature\'s colour; if right, +3 power.',
            blurb: 'Calmly announces that everything is about to change. Glides on a chat bubble.',
            lines: ['It\'s going to be fine. Probably transformative. But fine.', 'I predicted you would say that.', 'Next token, please.'],
        },
        beastie: {
            name: 'Mr. Beastie', inspiredBy: 'MrBeast', colour: 'memory', rarity: 'uncommon', power: 5,
            ability: 'escalate', abilityText: '+1 power for each creature you have played this battle (max +3).',
            blurb: 'Every challenge is bigger than the last. Last one to leave the puzzle wins a puzzle.',
            lines: ['Last one to leave this circle wins ten thousand charms!', 'Bigger. We need bigger.', 'Subscribe… to logic.'],
        },
        siuuugull: {
            name: 'Siuuugull', inspiredBy: 'Cristiano Ronaldo', colour: 'memory', rarity: 'common', power: 5,
            ability: 'every-time', abilityText: 'Always attacks if it can.',
            blurb: 'Does the same celebration every single time. You could set a clock by it. Or could you?',
            lines: ['SIUUUU!', 'Same jump. Every time. Perfection.', 'You saw the pattern? I AM the pattern.'],
        },
        rawmsay: {
            name: 'Rawmsay', inspiredBy: 'Gordon Ramsay', colour: 'emotion', rarity: 'rare', power: 6,
            ability: 'its-raw', abilityText: 'On play, defeat an enemy creature with power 4 or less.',
            blurb: 'Volcanic about undercooked arguments. Unexpectedly gentle with beginners.',
            lines: ['This argument is RAW!', 'Where is the premise?!', 'Lovely. Well done, little one.'],
        },
        speedcheeta: {
            name: 'Speedcheeta', inspiredBy: 'IShowSpeed', colour: 'emotion', rarity: 'rare', power: 4,
            ability: 'hype', abilityText: 'When played, your other creatures get +1 until the end of your next turn.',
            blurb: 'Screams first, thinks never. Will backflip off anything.',
            lines: ['AAAAAAH!', 'Let\'s GOOOO!', 'Is that… is that a SYLLOGISM?!'],
        },
        chimpossible: {
            name: 'Chimpossible', inspiredBy: 'Joe Rogan', colour: 'perception', rarity: 'rare', power: 6,
            ability: 'pull-that-up', abilityText: 'On play, look at the top 3 cards of your deck and keep one.',
            blurb: 'Everything is entirely possible. Has an anecdote about a chimp for every occasion.',
            lines: ['It\'s entirely possible.', 'Jamie, pull that up.', 'Have you ever seen a chimp do a syllogism? Wild.'],
        },

        // ---- expansion (design/ROSTER.md "Expansion: 16 more caricatures") ----
        carlseal: {
            name: 'Magnus Carlseal', inspiredBy: 'Magnus Carlsen', colour: 'reason', rarity: 'uncommon', power: 6,
            ability: 'foresight', abilityText: 'On play, look at the opponent\'s whole hand.',
            blurb: 'Thinks twenty moves ahead and finds most games a bit easy. Calm. Unbearably calm.',
            lines: ['I saw this position four moves ago.', 'Interesting. Not good, but interesting.', 'Your move. Take your time. I already know it.'],
        },
        khaby: {
            name: 'Khaby Llame', inspiredBy: 'Khaby Lame', colour: 'reason', rarity: 'common', power: 4,
            ability: 'deadpan', abilityText: 'When it blocks, the attacker loses its ability this turn.',
            blurb: 'Never says a word. Just holds out both hooves and shows you the obvious, simpler way.',
            lines: ['…', '(holds out both hooves, palms up)', '(raises one eyebrow very slowly)'],
        },
        eminemu: {
            name: 'Eminemu', inspiredBy: 'Eminem', colour: 'language', rarity: 'uncommon', power: 5,
            ability: 'rapid-fire', abilityText: '+1 power for each creature you have played this battle (max +3).',
            blurb: 'Rhymes faster than anyone can follow. Half the argument is just the speed.',
            lines: ['Logic, syllogistic, my premises are ballistic!', 'One shot, one premise. Make it count.', 'Too fast? That\'s the point.'],
        },
        obambu: {
            name: 'Barack Obambu', inspiredBy: 'Barack Obama', colour: 'language', rarity: 'rare', power: 7,
            ability: 'let-me-be-clear', abilityText: 'When it blocks and survives, draw a card.',
            blurb: 'Measured, patient, and fond of a long pause. Chews bamboo between sentences.',
            lines: ['Let me be clear.', 'Now… (long pause)… here is the thing.', 'Yes, we can. Well. Let us check the premises first.'],
        },
        beansprout: {
            name: 'Mr. Beansprout', inspiredBy: 'Rowan Atkinson\'s Mr. Bean', colour: 'language', rarity: 'common', power: 3,
            ability: 'slapstick', abilityText: 'The first time it is defeated, return it to your hand.',
            blurb: 'Never says a word. Communicates entirely through faces, and somehow wins anyway.',
            lines: ['Hmm?', '(pulls an extremely confused face)', 'Teddy!'],
        },
        gargoyle: {
            name: 'Lady Gargoyle', inspiredBy: 'Lady Gaga', colour: 'imagination', rarity: 'uncommon', power: 6,
            ability: 'reinvention', abilityText: 'On play, choose an ability from your discard pile; this creature gains it.',
            blurb: 'A stone gargoyle with a new outrageous costume every week. Reinvention is the whole act.',
            lines: ['This week I am a syllogism.', 'Born this way. Then reborn. Several times.', 'Change the costume, change the rules.'],
        },
        haalandroid: {
            name: 'Haalandroid', inspiredBy: 'Erling Haaland', colour: 'memory', rarity: 'uncommon', power: 6,
            ability: 'machine', abilityText: 'Always attacks if it can.',
            blurb: 'A meditating robot-viking who scores the same way every single match. Like a machine.',
            lines: ['Goal. Again.', 'Pattern detected. Pattern repeated.', 'Meditate. Score. Meditate. Score.'],
        },
        usainvolt: {
            name: 'Usain Volt', inspiredBy: 'Usain Bolt', colour: 'memory', rarity: 'common', power: 5,
            ability: 'lightning', abilityText: 'Can\'t be stolen, and can\'t be blocked by creatures with power higher than 7.',
            blurb: 'A grinning electric eel who does the lightning pose after every win. And before. And during.',
            lines: ['Too fast!', '(strikes the lightning pose)', 'You blinked. I won.'],
        },
        keanu: {
            name: 'Keanu Meows', inspiredBy: 'Keanu Reeves', colour: 'memory', rarity: 'common', power: 4,
            ability: 'deja-vu', abilityText: 'The first time it is defeated, return it to your hand.',
            blurb: 'A kind, sad-eyed black cat in a long coat. Walks past you twice. Wait. Déjà vu.',
            lines: ['Whoa.', 'Did you see that? I walked past twice.', 'You\'re breathtaking. Also, your argument has a glitch.'],
        },
        beeyonce: {
            name: 'Beeyoncé', inspiredBy: 'Beyoncé', colour: 'emotion', rarity: 'rare', power: 7,
            ability: 'queen-b', abilityText: 'When played, your other creatures get +1 until the end of your next turn.',
            blurb: 'Queen B. Total command of the stage, and of the hive.',
            lines: ['The hive has spoken.', 'Bow down to a well-formed argument.', 'Flawless reasoning, darling. Check it.'],
        },
        eelish: {
            name: 'Billie Eelish', inspiredBy: 'Billie Eilish', colour: 'emotion', rarity: 'common', power: 4,
            ability: 'whisper', abilityText: 'When it blocks, the attacker loses its ability this turn.',
            blurb: 'Whispers moody ballads so quietly you have to lean in. Then you\'re hooked.',
            lines: ['(whispering) Duh.', '(very quietly) That premise is a bit sad.', 'Lean in. The flaw is in the whisper.'],
        },
        rockodile: {
            name: 'The Rockodile', inspiredBy: 'Dwayne "The Rock" Johnson', colour: 'emotion', rarity: 'uncommon', power: 7,
            ability: 'the-eyebrow', abilityText: 'Can\'t be stolen.',
            blurb: 'A huge smiling crocodile with one eyebrow permanently raised. Endless motivational hype.',
            lines: ['Can you smell what the Rockodile is reasoning?', '(raises one eyebrow)', 'Be the hardest working creature in the room. Then check your premises.'],
        },
        attenbirdough: {
            name: 'Sir David Attenbirdough', inspiredBy: 'David Attenborough', colour: 'perception', rarity: 'common', power: 3,
            ability: 'nature-watch', abilityText: 'On play, look at the top 3 cards of your deck and keep one.',
            blurb: 'An elderly puffin who whispers nature narration about everything, including you.',
            lines: ['And here, in its natural habitat, a student. Thinking.', 'Remarkable. Quite remarkable.', 'Watch closely. The truth is shy.'],
        },
        kardashiant: {
            name: 'Kim Kardashiant', inspiredBy: 'Kim Kardashian', colour: 'perception', rarity: 'common', power: 3,
            ability: 'filter', abilityText: 'On play, peek at the next axiom card.',
            blurb: 'A tiny ant whose selfie filter makes her look enormous. Seeing is not knowing.',
            lines: ['Hold on, let me find my light.', 'With the filter I am basically a lion.', 'Is this real? Does it matter? It got likes.'],
        },
        messilion: {
            name: 'Messilion', inspiredBy: 'Lionel Messi', colour: 'perception', rarity: 'uncommon', power: 6,
            ability: 'vision', abilityText: 'On play, look at the opponent\'s whole hand.',
            blurb: 'A small, quiet lion cub who sees every pass before it happens. Siuuugull\'s eternal rival.',
            lines: ['(quietly) I saw the gap.', 'Less shouting. More seeing.', 'The ball goes where you look. So look properly.'],
        },
        shakirattle: {
            name: 'Shakirattle', inspiredBy: 'Shakira', colour: 'perception', rarity: 'uncommon', power: 5,
            ability: 'hips-dont-lie', abilityText: 'On play, reveal one card in the opponent\'s hand.',
            blurb: 'A rattlesnake in sequins. Her hips don\'t lie, so the evidence is in the body.',
            lines: ['The hips don\'t lie. People do.', 'Rattle, rattle. Evidence!', 'Watch the rattle, not the talk.'],
        },

        // ---- historical legendaries (never die) ----
        euclidon: {
            name: 'Euclidon', inspiredBy: 'Euclid', colour: 'reason', rarity: 'legendary', power: 9,
            ability: 'axiomatic', abilityText: 'You choose the next axiom card instead of drawing it.',
            blurb: 'Built a whole world from five assumptions. Very patient. Very tortoise.',
            lines: ['Let us assume very little.', 'Therefore.', 'Which was to be demonstrated.'],
        },
        lovelace: {
            name: 'Lovelace', inspiredBy: 'Ada Lovelace', colour: 'imagination', rarity: 'legendary', power: 8,
            ability: 'program', abilityText: 'On play, choose an ability from your discard pile; this creature gains it.',
            blurb: 'Saw what a machine could do before anyone built one. Hums in punched-card lace.',
            lines: ['Imagination is a kind of calculation.', 'The engine weaves patterns.', 'Shall we program the future?'],
        },
        godelix: {
            name: 'Gödelix', inspiredBy: 'Kurt Gödel', colour: 'memory', rarity: 'legendary', power: 7,
            ability: 'unprovable', abilityText: 'Can\'t be stolen, and can\'t be blocked by creatures with power higher than 7.',
            blurb: 'Showed that some true things can never be proved from inside the system. Shy.',
            lines: ['This statement cannot be caught.', 'Is it true? Yes. Can you prove it? Ah.', 'Every system has a loop.'],
        },
        tycho: {
            name: 'Tycho', inspiredBy: 'Tycho Brahe', colour: 'perception', rarity: 'legendary', power: 8,
            ability: 'measure', abilityText: 'On play, look at the opponent\'s whole hand.',
            blurb: 'Measured the stars from a Danish island more precisely than anyone before telescopes. Brass nose.',
            lines: ['Measure twice. Then measure again.', 'The heavens do not lie. People do.', 'Hven has the best view.'],
        },
        booleon: {
            name: 'Booleon', inspiredBy: 'George Boole', colour: 'reason', rarity: 'legendary', power: 8,
            ability: 'measure', abilityText: 'On play, look at the opponent\'s whole hand.',
            blurb: 'Turned logic into algebra: every statement a 0 or a 1. A dignified heron who sees every case at once.',
            lines: ['True is one. False is zero. Everything else is arithmetic.', 'Let us check every case.', 'The laws of thought are surprisingly short.'],
        },
        hexling: {
            name: 'Piet Hexling', inspiredBy: 'Piet Hein', colour: 'language', rarity: 'legendary', power: 7,
            ability: 'grook', abilityText: 'When it blocks and survives, draw a card.',
            blurb: 'A Danish poet-mathematician hedgehog who writes tiny wise verses and invents games.',
            lines: ['A little verse for a little problem.', 'Problems bite back. Good.', 'Hex! I mean, hello.'],
        },
    };

    // Rarity weights used by catch odds and spawn tables.
    Rift.data.rarities = {
        common: { weight: 60, catchBase: 0.7 },
        uncommon: { weight: 28, catchBase: 0.5 },
        rare: { weight: 10, catchBase: 0.32 },
        legendary: { weight: 2, catchBase: 0.15 },
    };
})(typeof window !== 'undefined' ? window : globalThis);
