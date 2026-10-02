/*
 * The overworld: one fixed map for everyone, under fog of war.
 *
 * Coordinates are in a 1600×900 map space, placed on the painted landmarks of
 * scene/map (design/source-assets/2-world/map.png): village, fair, pier, signpost,
 * bridge, well, campfire, tree stump (card table), standing stone, gate, rift pass.
 * The ruined shrine (392,244) is still free for a later chapter.
 * type: story | puzzle | miniboss | boss | rest | rumour | battle | rift
 * puzzles: candidate puzzle ids + difficulty, one is rolled per visit.
 * spawns: species that can be the obstacle here (weighted by rarity);
 *         rare teasers from other colours can be listed too.
 * scene: background art id. script: dialogue key in data/script/*.js.
 */
(function (root) {
    'use strict';
    const Rift = root.Rift;

    Rift.data.chapters = {
        prologue: { name: 'Prologue: The Fair', start: 'burrow', lesson: 1 },
        ch1: { name: 'Chapter 1: The Road', start: 'road-start', lesson: 1 },
        ch2: { name: 'Chapter 2: The Village', start: 'b-arrival', lesson: 2, comingSoon: true },
        ch3: { name: 'Chapter 3: The Tribunal', start: null, lesson: 3, comingSoon: true },
    };

    Rift.data.map = {
        nodes: {
            // ---- Prologue: the home village and the fair ----
            'burrow': {
                name: 'Your Burrow', chapter: 'prologue', type: 'story', x: 70, y: 640,
                scene: 'scene/burrow', script: 'prologue.wake', links: ['fair-gate'],
                teaser: 'Home. Warm, safe, and a bit too quiet today.',
            },
            'fair-gate': {
                name: 'The Fair Gate', chapter: 'prologue', type: 'story', x: 200, y: 600,
                scene: 'scene/fair', script: 'prologue.fair', links: ['burrow', 'stall-pattern', 'stall-witness', 'stall-gallery'],
                teaser: 'Music, lanterns and the smell of toasted nuts.',
            },
            'stall-pattern': {
                name: "Professor Sequins' Pattern Stall", chapter: 'prologue', type: 'puzzle', x: 397, y: 636,
                scene: 'scene/stall-pattern', host: 'professor-sequins', script: 'prologue.pattern',
                puzzles: [{ id: 'rule-hunter', difficulty: 1 }],
                spawns: ['siuuugull', 'beastie', 'speedcheeta'], links: ['fair-gate', 'fair-rift'],
                teaser: 'A magpie in a ringmaster coat is shouting about secret rules.',
            },
            'stall-witness': {
                name: "Madame Mirage's Witness Tent", chapter: 'prologue', type: 'puzzle', x: 105, y: 690,
                scene: 'scene/stall-witness', host: 'madame-mirage', script: 'prologue.witness',
                puzzles: [{ id: 'witness', difficulty: 1 }],
                spawns: ['chimpossible', 'rawmsay'], links: ['fair-gate', 'fair-rift'],
                teaser: 'A velvet tent. "See what really happened," says the sign.',
            },
            'stall-gallery': {
                name: "Sergeant Syllo's Syllogism Gallery", chapter: 'prologue', type: 'puzzle', x: 383, y: 766,
                scene: 'scene/stall-gallery', host: 'sergeant-syllo', script: 'prologue.gallery',
                puzzles: [{ id: 'venn', difficulty: 1 }],
                spawns: ['tremendoodle', 'swiftlet'], links: ['fair-gate', 'fair-rift'],
                teaser: 'Pop! Pop! A badger is shouting "All targets are wooden!"',
            },
            'fair-rift': {
                name: 'The Crack in the Sky', chapter: 'prologue', type: 'story', x: 330, y: 575,
                scene: 'scene/fair', script: 'prologue.rift', fx: 'rift', requires: 2, links: ['stall-pattern', 'stall-witness', 'stall-gallery', 'signpost'],
                teaser: 'Something is wrong with the sky above the fair.',
            },

            // ---- Chapter 1: the Road ----
            'road-start': {
                name: 'The Forest Road', chapter: 'ch1', type: 'puzzle', x: 574, y: 583,
                scene: 'scene/road-forest', script: 'ch1.road',
                puzzles: [{ id: 'liars-gate', difficulty: 1 }, { id: 'venn', difficulty: 1 }],
                spawns: ['astrophysicat', 'lobstorian', 'tremendoodle'], links: ['signpost', 'troll-bridge'],
                teaser: 'A dark wood. Fireflies, and someone arguing loudly.',
            },
            'signpost': {
                name: 'The Talking Signpost', chapter: 'ch1', type: 'rumour', x: 483, y: 555,
                scene: 'scene/road-forest', script: 'ch1.signpost', links: ['fair-rift', 'road-start'],
                teaser: 'A signpost that points in every direction at once.',
            },
            'well': {
                name: 'The Wishing Well', chapter: 'ch1', type: 'puzzle', x: 809, y: 435,
                scene: 'scene/road-forest', script: 'ch1.well',
                puzzles: [{ id: 'venn', difficulty: 2 }, { id: 'rule-hunter', difficulty: 2 }],
                spawns: ['swiftlet', 'beastie', 'siuuugull', 'chimpossible'], links: ['troll-bridge', 'campfire', 'card-sharp'],
                teaser: 'Coins glint at the bottom. A voice echoes up: "Prove it!"',
            },
            'troll-bridge': {
                name: 'The Troll Bridge', chapter: 'ch1', type: 'miniboss', x: 679, y: 550,
                scene: 'scene/road-bridge', script: 'ch1.bridge',
                puzzles: [{ id: 'line-drawer', difficulty: 2 }],
                spawns: ['muskrat', 'zuckerborg', 'altmanta'], links: ['road-start', 'well'],
                teaser: 'A toll booth. A rocket parked badly beside it.',
            },
            'card-sharp': {
                name: "The Card Sharp's Table", chapter: 'ch1', type: 'battle', x: 1081, y: 430,
                scene: 'scene/battle-table', script: 'ch1.cardsharp', trainer: 'card-sharp', links: ['well', 'standing-stone', 'gate'],
                teaser: 'Candlelight, a deck of cards and a crow who never loses. Allegedly.',
            },
            'campfire': {
                name: 'The Campfire Clearing', chapter: 'ch1', type: 'rest', x: 761, y: 306,
                scene: 'scene/road-forest', script: 'ch1.campfire', links: ['well', 'gate'],
                teaser: 'A crackling fire. A safe place to rest and mend.',
            },
            'standing-stone': {
                name: 'The Standing Stone', chapter: 'ch1', type: 'puzzle', x: 1158, y: 531,
                scene: 'scene/road-forest', script: 'ch1.stone',
                puzzles: [{ id: 'rule-hunter', difficulty: 3 }, { id: 'line-drawer', difficulty: 3 }],
                spawns: ['beastie', 'altmanta', 'godelix'], links: ['card-sharp'],
                teaser: 'Strange patterns carved into old stone. They seem to change.',
            },
            'gate': {
                name: 'The Gate of Guards', chapter: 'ch1', type: 'boss', x: 1249, y: 316,
                scene: 'scene/road-gate', script: 'ch1.gate',
                puzzles: [{ id: 'liars-gate', difficulty: 2 }, { id: 'venn', difficulty: 2 }, { id: 'liars-gate', difficulty: 3 }],
                spawns: ['lobstorian', 'tremendoodle', 'euclidon'], links: ['campfire', 'card-sharp', 'rift-pass'],
                teaser: 'Two doors in a wall of thorns. Guards who may or may not be lying.',
            },
            'rift-pass': {
                name: 'The Rift Pass', chapter: 'ch1', type: 'rift', x: 1407, y: 143,
                scene: 'scene/rift-pass', script: 'ch1.pass', fx: 'rift', links: ['gate', 'b-arrival'], portal: 'b-arrival',
                teaser: 'The time rift glows here. Through it: a Victorian village where the windows glow too brightly.',
            },

            // ---- Chapter 2: Boolesbury (map: scene/map-ch2, landmarks in 1600×900 space) ----
            'b-arrival': {
                name: 'The Stone Circle', chapter: 'ch2', map: 'ch2', type: 'rift', x: 287, y: 670,
                scene: 'scene/village-square', script: 'ch2.arrive', fx: 'rift', links: ['rift-pass', 'b-south-bridge'], portal: 'rift-pass',
                teaser: 'Where the rift set you down. It hums. The way back is here too.',
            },
            'b-south-bridge': {
                name: 'The Lever Bridge', chapter: 'ch2', map: 'ch2', type: 'puzzle', x: 756, y: 736,
                scene: 'scene/switch-room', script: 'ch2.bridge',
                puzzles: [{ id: 'switchboard', difficulty: 1 }],
                spawns: ['rawmsay', 'speedcheeta', 'zuckerborg'], links: ['b-arrival', 'b-lamp-lane'],
                teaser: 'A drawbridge worked by brass levers. Something about it is very sure of itself.',
            },
            'b-lamp-lane': {
                name: 'Lamp Lane', chapter: 'ch2', map: 'ch2', type: 'puzzle', x: 670, y: 593,
                scene: 'scene/village-square', script: 'ch2.lane',
                puzzles: [{ id: 'village', difficulty: 1 }],
                spawns: ['astrophysicat', 'lobstorian', 'swiftlet'], links: ['b-south-bridge', 'b-square'],
                teaser: 'Lamp-lit steps. The neighbours are whispering about each other.',
            },
            'b-square': {
                name: 'The Village Square', chapter: 'ch2', map: 'ch2', type: 'story', x: 680, y: 402,
                scene: 'scene/village-square', script: 'ch2.square', links: ['b-lamp-lane', 'b-bakery', 'b-post', 'b-clockmaker', 'b-school'],
                teaser: 'A fountain, a crowd, and a Mayor making a speech.',
            },
            'b-bakery': {
                name: 'The Bakery', chapter: 'ch2', map: 'ch2', type: 'puzzle', x: 633, y: 344,
                scene: 'scene/village-square', script: 'ch2.bakery',
                puzzles: [{ id: 'village', difficulty: 1 }, { id: 'village', difficulty: 2 }],
                spawns: ['beastie', 'siuuugull', 'tremendoodle'], links: ['b-square'],
                teaser: 'Warm bread, cold stares. Someone stole the last loaf.',
            },
            'b-post': {
                name: 'The Post Office', chapter: 'ch2', map: 'ch2', type: 'puzzle', x: 383, y: 450,
                scene: 'scene/village-square', script: 'ch2.post',
                puzzles: [{ id: 'tower', difficulty: 1 }],
                spawns: ['swiftlet', 'chimpossible', 'altmanta'], links: ['b-square', 'b-west-bridge'],
                teaser: 'The Constable wants a word. About who you are. And where you were on Tuesday.',
            },
            'b-west-bridge': {
                name: 'The West Bridge', chapter: 'ch2', map: 'ch2', type: 'rumour', x: 167, y: 450,
                scene: 'scene/village-square', script: 'ch2.rumour', links: ['b-post'],
                teaser: 'A quiet bridge where gossip collects like fog.',
            },
            'b-clockmaker': {
                name: "The Clockmaker's Workshop", chapter: 'ch2', map: 'ch2', type: 'puzzle', x: 919, y: 392,
                scene: 'scene/switch-room', script: 'ch2.clockmaker',
                puzzles: [{ id: 'switchboard', difficulty: 2 }],
                spawns: ['muskrat', 'altmanta', 'zuckerborg'], links: ['b-square', 'b-school', 'b-clock-tower'],
                teaser: 'Gears, wires and a bulb that lights only when you assume the right things.',
            },
            'b-school': {
                name: 'The Schoolhouse', chapter: 'ch2', map: 'ch2', type: 'puzzle', x: 1005, y: 622,
                scene: 'scene/village-square', script: 'ch2.school',
                puzzles: [{ id: 'village', difficulty: 2 }, { id: 'switchboard', difficulty: 2 }],
                spawns: ['astrophysicat', 'beastie', 'booleon'], links: ['b-square', 'b-clockmaker', 'b-garden'],
                teaser: 'A bell turret. Chalk on the board: 0 and 1, over and over.',
            },
            'b-garden': {
                name: 'The Walled Garden', chapter: 'ch2', map: 'ch2', type: 'rest', x: 1388, y: 430,
                scene: 'scene/village-square', script: 'ch2.garden', links: ['b-school', 'b-east-bridge'],
                teaser: 'A greenhouse, a bench, and quiet. A safe place to rest.',
            },
            'b-east-bridge': {
                name: 'The East Bridge', chapter: 'ch2', map: 'ch2', type: 'battle', x: 1407, y: 689,
                scene: 'scene/battle-table', script: 'ch2.cards', trainer: 'constable', links: ['b-garden'],
                teaser: 'The Constable, off duty, with a deck of cards and something to prove.',
            },
            'b-clock-tower': {
                name: 'The Clock Tower', chapter: 'ch2', map: 'ch2', type: 'miniboss', x: 1033, y: 287,
                scene: 'scene/clock-tower', script: 'ch2.tower',
                puzzles: [{ id: 'tower', difficulty: 2 }],
                spawns: ['lobstorian', 'tremendoodle', 'rawmsay'], links: ['b-clockmaker', 'b-stairs'],
                teaser: 'Gears grinding. Someone up there is asking questions, and keeping score.',
            },
            'b-stairs': {
                name: 'The Town Hall Stairs', chapter: 'ch2', map: 'ch2', type: 'puzzle', x: 1244, y: 239,
                scene: 'scene/switch-room', script: 'ch2.stairs',
                puzzles: [{ id: 'switchboard', difficulty: 3 }],
                spawns: ['altmanta', 'muskrat', 'speedcheeta'], links: ['b-clock-tower', 'b-town-hall'],
                teaser: 'A locked gate on the stairs. One switch is hidden behind a curtain.',
            },
            'b-town-hall': {
                name: 'The Town Hall', chapter: 'ch2', map: 'ch2', type: 'boss', x: 1407, y: 191,
                scene: 'scene/village-square', script: 'ch2.hall',
                puzzles: [{ id: 'village', difficulty: 2 }, { id: 'switchboard', difficulty: 3 }, { id: 'village', difficulty: 3 }],
                spawns: ['tremendoodle', 'rawmsay', 'booleon'], links: ['b-stairs'],
                teaser: 'The dome. The Mayor. The truth, if you can build a table big enough.',
            },
        },
    };

    // The painted maps. Nodes without a 'map' field are on 'main'.
    Rift.data.maps = {
        main: { scene: 'scene/map', name: 'The Valley' },
        ch2: { scene: 'scene/map-ch2', name: 'Boolesbury' },
    };

    // NPC trainers for battle nodes.
    Rift.data.trainers = {
        'constable': {
            name: 'Constable Clobber',
            ai: 'hard',
            team: ['lobstorian', 'tremendoodle', 'rawmsay', 'astrophysicat', 'siuuugull', 'beastie', 'swiftlet', 'muskrat', 'zuckerborg', 'speedcheeta'],
            ante: { items: { greatcharm: 2, heartstone: 1 } },
        },
        'card-sharp': {
            name: 'Corvina the Card Sharp',
            team: ['zuckerborg', 'astrophysicat', 'siuuugull', 'zuckerborg', 'astrophysicat', 'siuuugull', 'muskrat', 'lobstorian', 'beastie', 'tremendoodle'],
            ante: { items: { greatcharm: 1, ward: 1 } },
        },
    };
})(typeof window !== 'undefined' ? window : globalThis);
