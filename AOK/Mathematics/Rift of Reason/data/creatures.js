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
            name: 'Mr. Beastie', inspiredBy: 'MrBeast', colour: 'memory', rarity: 'uncommon', power: 7,
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
            name: 'Rawmsay', inspiredBy: 'Gordon Ramsay', colour: 'emotion', rarity: 'rare', power: 8,
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
