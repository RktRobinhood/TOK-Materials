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
        ch2: { name: 'Chapter 2: The Village', start: 'b-arrival', lesson: 2 },
        ch3: { name: 'Chapter 3: The Tribunal', start: 't-arrival', lesson: 3 },
        ch4: { name: 'Chapter 4: The Server Tower', start: 'k-base', lesson: 4 },
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
                scene: 'scene/fair', script: 'prologue.fair', links: ['burrow', 'stall-pattern', 'stall-witness', 'stall-gallery', 'fair-finale'],
                teaser: 'Music, lanterns and the smell of toasted nuts.',
            },
            'stall-pattern': {
                name: "Professor Sequins' Pattern Stall", chapter: 'prologue', type: 'puzzle', x: 397, y: 636,
                scene: 'scene/stall-pattern', host: 'professor-sequins', script: 'prologue.pattern',
                puzzles: [{ id: 'rule-hunter', difficulty: 1 }],
                spawns: ['siuuugull', 'beastie', 'speedcheeta', 'usainvolt', 'keanu'], links: ['fair-gate', 'fair-rift'],
                teaser: 'A magpie in a ringmaster coat is shouting about secret rules.',
            },
            'stall-witness': {
                name: "Madame Mirage's Witness Tent", chapter: 'prologue', type: 'puzzle', x: 105, y: 690,
                scene: 'scene/stall-witness', host: 'madame-mirage', script: 'prologue.witness',
                puzzles: [{ id: 'witness', difficulty: 1 }],
                spawns: ['chimpossible', 'rawmsay', 'attenbirdough', 'kardashiant', 'shakirattle'], links: ['fair-gate', 'fair-rift'],
                teaser: 'A velvet tent. "See what really happened," says the sign.',
            },
            'stall-gallery': {
                name: "Sergeant Syllo's Syllogism Gallery", chapter: 'prologue', type: 'puzzle', x: 383, y: 766,
                scene: 'scene/stall-gallery', host: 'sergeant-syllo', script: 'prologue.gallery',
                puzzles: [{ id: 'venn', difficulty: 1 }],
                spawns: ['tremendoodle', 'swiftlet', 'beansprout', 'eminemu'], links: ['fair-gate', 'fair-rift'],
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
                spawns: ['astrophysicat', 'lobstorian', 'tremendoodle', 'khaby', 'eelish'], links: ['signpost', 'troll-bridge'],
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
                spawns: ['swiftlet', 'beastie', 'siuuugull', 'chimpossible', 'messilion', 'kardashiant'], links: ['troll-bridge', 'campfire', 'card-sharp'],
                teaser: 'Coins glint at the bottom. A voice echoes up: "Prove it!"',
            },
            'troll-bridge': {
                name: 'The Troll Bridge', chapter: 'ch1', type: 'miniboss', x: 679, y: 550,
                scene: 'scene/road-bridge', script: 'ch1.bridge',
                puzzles: [{ id: 'line-drawer', difficulty: 2 }],
                spawns: ['muskrat', 'zuckerborg', 'altmanta', 'gargoyle'], links: ['road-start', 'well'],
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
                spawns: ['beastie', 'altmanta', 'godelix', 'haalandroid', 'keanu'], links: ['card-sharp'],
                teaser: 'Strange patterns carved into old stone. They seem to change.',
            },
            'gate': {
                name: 'The Gate of Guards', chapter: 'ch1', type: 'boss', x: 1249, y: 316,
                scene: 'scene/road-gate', script: 'ch1.gate',
                puzzles: [{ id: 'liars-gate', difficulty: 2 }, { id: 'venn', difficulty: 2 }, { id: 'liars-gate', difficulty: 3 }],
                spawns: ['lobstorian', 'tremendoodle', 'euclidon', 'obambu', 'rockodile'], links: ['campfire', 'card-sharp', 'rift-pass'],
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
                spawns: ['rawmsay', 'speedcheeta', 'zuckerborg', 'beeyonce', 'eelish'], links: ['b-arrival', 'b-lamp-lane'],
                teaser: 'A drawbridge worked by brass levers. Something about it is very sure of itself.',
            },
            'b-lamp-lane': {
                name: 'Lamp Lane', chapter: 'ch2', map: 'ch2', type: 'puzzle', x: 670, y: 593,
                scene: 'scene/village-square', script: 'ch2.lane',
                puzzles: [{ id: 'village', difficulty: 1 }],
                spawns: ['astrophysicat', 'lobstorian', 'swiftlet', 'carlseal', 'khaby'], links: ['b-south-bridge', 'b-square'],
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
                spawns: ['beastie', 'siuuugull', 'tremendoodle', 'messilion', 'attenbirdough'], links: ['b-square'],
                teaser: 'Warm bread, cold stares. Someone stole the last loaf.',
            },
            'b-post': {
                name: 'The Post Office', chapter: 'ch2', map: 'ch2', type: 'puzzle', x: 383, y: 450,
                scene: 'scene/village-square', script: 'ch2.post',
                puzzles: [{ id: 'tower', difficulty: 1 }],
                spawns: ['swiftlet', 'chimpossible', 'altmanta', 'rockodile', 'shakirattle'], links: ['b-square', 'b-west-bridge'],
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
                spawns: ['muskrat', 'altmanta', 'zuckerborg', 'gargoyle', 'haalandroid'], links: ['b-square', 'b-school', 'b-clock-tower'],
                teaser: 'Gears, wires and a bulb that lights only when you assume the right things.',
            },
            'b-school': {
                name: 'The Schoolhouse', chapter: 'ch2', map: 'ch2', type: 'puzzle', x: 1005, y: 622,
                scene: 'scene/village-square', script: 'ch2.school',
                puzzles: [{ id: 'village', difficulty: 2 }, { id: 'switchboard', difficulty: 2 }],
                spawns: ['astrophysicat', 'beastie', 'booleon', 'carlseal', 'eminemu'], links: ['b-square', 'b-clockmaker', 'b-garden'],
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
                spawns: ['lobstorian', 'tremendoodle', 'rawmsay', 'rockodile', 'beeyonce'], links: ['b-clockmaker', 'b-stairs'],
                teaser: 'Gears grinding. Someone up there is asking questions, and keeping score.',
            },
            'b-stairs': {
                name: 'The Town Hall Stairs', chapter: 'ch2', map: 'ch2', type: 'puzzle', x: 1244, y: 239,
                scene: 'scene/switch-room', script: 'ch2.stairs',
                puzzles: [{ id: 'switchboard', difficulty: 3 }],
                spawns: ['altmanta', 'muskrat', 'speedcheeta', 'usainvolt', 'messilion'], links: ['b-clock-tower', 'b-town-hall'],
                teaser: 'A locked gate on the stairs. One switch is hidden behind a curtain.',
            },
            'b-town-hall': {
                name: 'The Town Hall', chapter: 'ch2', map: 'ch2', type: 'boss', x: 1407, y: 191,
                scene: 'scene/village-square', script: 'ch2.hall',
                puzzles: [{ id: 'village', difficulty: 2 }, { id: 'switchboard', difficulty: 3 }, { id: 'village', difficulty: 3 }],
                spawns: ['tremendoodle', 'rawmsay', 'booleon', 'obambu', 'beeyonce'], links: ['b-stairs', 'b-skyrift'],
                teaser: 'The dome. The Mayor. The truth, if you can build a table big enough.',
            },

            'b-skyrift': {
                name: 'The Sky Rift', chapter: 'ch2', map: 'ch2', type: 'rift', x: 880, y: 130,
                scene: 'scene/village-square', script: 'ch2.skyrift', fx: 'rift', links: ['b-town-hall', 't-arrival'], portal: 't-arrival',
                teaser: 'The swirl above the town hall. Through it: a city of glowing screens.',
            },

            // ---- Chapter 3: Tomorrowton (map: scene/map-ch3; landmarks in design/CH3.md) ----
            't-arrival': {
                name: 'The Rift Landing', chapter: 'ch3', map: 'ch3', type: 'rift', x: 244, y: 679,
                scene: 'scene/neon-plaza', script: 'ch3.arrive', fx: 'rift', links: ['b-skyrift', 't-south-bridge'], portal: 'b-skyrift',
                teaser: 'Where the rift set you down. The way back to Boolesbury is here.',
            },
            't-south-bridge': {
                name: 'The Neon Bridge', chapter: 'ch3', map: 'ch3', type: 'puzzle', x: 622, y: 670,
                scene: 'scene/neon-plaza', script: 'ch3.bridge',
                puzzles: [{ id: 'venn', difficulty: 2 }, { id: 'witness', difficulty: 2 }],
                spawns: ['kardashiant', 'eminemu', 'khaby'], links: ['t-arrival', 't-newsstand', 't-west-bridge'],
                teaser: 'A bridge of glowing tiles. Screens on every lamp-post shout opinions.',
            },
            't-west-bridge': {
                name: 'The West Bridge', chapter: 'ch3', map: 'ch3', type: 'rumour', x: 105, y: 440,
                scene: 'scene/neon-plaza', script: 'ch3.rumour', links: ['t-south-bridge', 't-cafe'],
                teaser: 'Quiet, for Tomorrowton. Someone has scratched a message into the rail.',
            },
            't-newsstand': {
                name: 'The Newsstand', chapter: 'ch3', map: 'ch3', type: 'puzzle', x: 689, y: 507,
                scene: 'scene/tribunal', script: 'ch3.newsstand',
                puzzles: [{ id: 'tribunal', difficulty: 1, opts: { theme: 'argument' } }],
                spawns: ['tremendoodle', 'speedcheeta', 'kardashiant'], links: ['t-south-bridge', 't-plaza', 't-cafe'],
                teaser: 'Headlines everywhere, and a crowd arguing about them. A practice trial is starting.',
            },
            't-cafe': {
                name: 'The Café', chapter: 'ch3', map: 'ch3', type: 'rest', x: 378, y: 397,
                scene: 'scene/neon-plaza', script: 'ch3.cafe', links: ['t-newsstand', 't-west-bridge', 't-library'],
                teaser: 'Warm drinks, no screens. A safe place to rest.',
            },
            't-library': {
                name: 'The Library', chapter: 'ch3', map: 'ch3', type: 'puzzle', x: 340, y: 239,
                scene: 'scene/evidence-room', script: 'ch3.library',
                puzzles: [{ id: 'tribunal', difficulty: 2, opts: { theme: 'proof' } }],
                spawns: ['carlseal', 'obambu', 'hexling'], links: ['t-cafe', 't-plaza'],
                teaser: 'Silent shelves. Someone claims to have proved something that is not quite true.',
            },
            't-plaza': {
                name: 'The Neon Plaza', chapter: 'ch3', map: 'ch3', type: 'story', x: 727, y: 335,
                scene: 'scene/neon-plaza', script: 'ch3.plaza', links: ['t-newsstand', 't-library', 't-datalab', 't-archive', 't-tower-gate'],
                teaser: 'Giant feed-screens. Everyone is looking up. Nobody is looking at each other.',
            },
            't-datalab': {
                name: 'The Data Lab', chapter: 'ch3', map: 'ch3', type: 'puzzle', x: 1091, y: 383,
                scene: 'scene/evidence-room', script: 'ch3.datalab',
                puzzles: [{ id: 'tribunal', difficulty: 2, opts: { theme: 'statistics' } }],
                spawns: ['altmanta', 'beastie', 'messilion'], links: ['t-plaza', 't-gallery', 't-steps'],
                teaser: 'Numbers on every wall. Some of them are telling the truth.',
            },
            't-gallery': {
                name: 'The Gallery of Charts', chapter: 'ch3', map: 'ch3', type: 'puzzle', x: 1435, y: 430,
                scene: 'scene/evidence-room', script: 'ch3.gallery',
                puzzles: [{ id: 'chart-fixer', difficulty: 1 }, { id: 'chart-fixer', difficulty: 2 }],
                spawns: ['attenbirdough', 'shakirattle', 'chimpossible', 'tycho'], links: ['t-datalab', 't-archive'],
                teaser: 'Enormous charts in gold frames. Every one of them is lying a little.',
            },
            't-archive': {
                name: 'The Archive', chapter: 'ch3', map: 'ch3', type: 'battle', x: 1206, y: 622,
                scene: 'scene/battle-table', script: 'ch3.cards', trainer: 'fin', links: ['t-plaza', 't-gallery'],
                teaser: 'Prosecutor Fin, off duty, shuffling a deck. He hates losing even more than in court.',
            },
            't-steps': {
                name: 'The Tribunal Steps', chapter: 'ch3', map: 'ch3', type: 'miniboss', x: 1340, y: 239,
                scene: 'scene/tribunal', script: 'ch3.steps',
                puzzles: [{ id: 'tribunal', difficulty: 2, opts: { theme: 'argument' } }],
                spawns: ['rawmsay', 'rockodile', 'gargoyle'], links: ['t-datalab', 't-tribunal'],
                teaser: 'A witness is waiting on the steps, practising their story.',
            },
            't-tribunal': {
                name: 'The Tribunal', chapter: 'ch3', map: 'ch3', type: 'boss', x: 1368, y: 105,
                scene: 'scene/tribunal', script: 'ch3.trial',
                puzzles: [{ id: 'tribunal', difficulty: 3, opts: { theme: 'argument' } }, { id: 'tribunal', difficulty: 3, opts: { theme: 'statistics' } }, { id: 'tribunal', difficulty: 3, opts: { theme: 'proof' } }],
                spawns: ['zuckerborg', 'muskrat', 'lobstorian', 'lovelace'], links: ['t-steps'],
                teaser: 'The great hall. Judge Hoot, Prosecutor Fin, and the trial of the season.',
            },

            't-tower-gate': {
                name: 'The Tower Road', chapter: 'ch3', map: 'ch3', type: 'rift', x: 842, y: 140,
                scene: 'scene/neon-plaza', script: 'ch3.towergate', fx: 'rift', links: ['t-plaza', 'k-base'], portal: 'k-base',
                teaser: 'The road to the dark tower on the horizon. Its windows flicker like a feed.',
            },

            // ---- Chapter 4: the Server Tower (map: scene/map-ch4, a vertical cutaway).
            // Provisional coordinates: re-place on the painted landmarks when map-ch4 lands.
            'k-base': {
                name: 'The Tower Door', chapter: 'ch4', map: 'ch4', type: 'rift', x: 800, y: 820,
                scene: 'scene/tower-base', script: 'ch4.arrive', links: ['t-tower-gate', 'k-gallery'], portal: 't-tower-gate',
                teaser: 'A huge door. Cables like roots. The way back to Tomorrowton is behind you.',
            },
            'k-gallery': {
                name: 'The Chart Gallery', chapter: 'ch4', map: 'ch4', type: 'puzzle', x: 600, y: 710,
                scene: 'scene/chart-gallery', script: 'ch4.gallery',
                puzzles: [{ id: 'chart-fixer', difficulty: 2 }, { id: 'chart-fixer', difficulty: 3 }],
                spawns: ['kardashiant', 'attenbirdough', 'tycho'], links: ['k-base', 'k-prediction'],
                teaser: 'Giant charts in gold frames. The Algorithm\'s favourite artworks.',
            },
            'k-prediction': {
                name: 'The Prediction Hall', chapter: 'ch4', map: 'ch4', type: 'puzzle', x: 1000, y: 610,
                scene: 'scene/server-hall', script: 'ch4.prediction',
                puzzles: [{ id: 'prediction', difficulty: 1 }, { id: 'prediction', difficulty: 2 }],
                spawns: ['altmanta', 'zuckerborg', 'haalandroid'], links: ['k-gallery', 'k-stairwell', 'k-sorting'],
                teaser: 'A machine that says it knows what you will do next. It seems very sure.',
            },
            'k-stairwell': {
                name: 'The Stairwell', chapter: 'ch4', map: 'ch4', type: 'rest', x: 1180, y: 500,
                scene: 'scene/server-hall', script: 'ch4.stairwell', links: ['k-prediction', 'k-workshop'],
                teaser: 'A quiet landing between floors. A good place to rest.',
            },
            'k-workshop': {
                name: 'The Modelling Workshop', chapter: 'ch4', map: 'ch4', type: 'puzzle', x: 1180, y: 330,
                scene: 'scene/oracle-chamber', script: 'ch4.workshop',
                puzzles: [{ id: 'three-act', difficulty: 1 }, { id: 'three-act', difficulty: 2 }],
                spawns: ['gargoyle', 'lovelace', 'euclidon'], links: ['k-stairwell', 'k-bridge'],
                teaser: 'An hourglass, a dripping cauldron, a growing floor. Questions everywhere.',
            },
            'k-sorting': {
                name: 'The Sorting Room', chapter: 'ch4', map: 'ch4', type: 'miniboss', x: 800, y: 500,
                scene: 'scene/server-hall', script: 'ch4.sorting',
                puzzles: [{ id: 'sorting', difficulty: 2 }],
                spawns: ['rockodile', 'obambu', 'beeyonce'], links: ['k-prediction', 'k-oracle'],
                teaser: 'A machine deciding who gets help. Everyone agrees it is very accurate.',
            },
            'k-oracle': {
                name: 'The Oracle Chamber', chapter: 'ch4', map: 'ch4', type: 'puzzle', x: 600, y: 340,
                scene: 'scene/oracle-chamber', script: 'ch4.oracle',
                puzzles: [{ id: 'oracle', difficulty: 1 }, { id: 'oracle', difficulty: 2 }],
                spawns: ['carlseal', 'booleon', 'godelix'], links: ['k-sorting', 'k-bridge'],
                teaser: 'A brass machine printing proofs on paper tape. Faster than anyone can read.',
            },
            'k-bridge': {
                name: 'The Sky Bridge', chapter: 'ch4', map: 'ch4', type: 'battle', x: 900, y: 230,
                scene: 'scene/battle-table', script: 'ch4.cards', trainer: 'feed', links: ['k-oracle', 'k-workshop', 'k-core'],
                teaser: 'The Algorithm\'s champion waits on the bridge, holding a perfectly optimised deck.',
            },
            'k-core': {
                name: 'The Core', chapter: 'ch4', map: 'ch4', type: 'boss', x: 800, y: 110,
                scene: 'scene/core-chamber', script: 'ch4.core',
                puzzles: [{ id: 'prediction', difficulty: 3 }, { id: 'oracle', difficulty: 3 }, { id: 'three-act', difficulty: 3 }],
                spawns: ['muskrat', 'altmanta', 'beastie'], links: ['k-bridge', 'k-summit'],
                teaser: 'The top of the tower. Something vast is waiting. Or something small pretending to be vast.',
            },
            'k-summit': {
                name: 'The Summit Rift', chapter: 'ch4', map: 'ch4', type: 'rift', x: 1000, y: 70,
                scene: 'scene/core-chamber', script: 'ch4.summit', fx: 'rift', links: ['k-core', 'fair-finale'], portal: 'fair-finale',
                teaser: 'The last rift. It leads home.',
            },

            // ---- The ending, back on the home map ----
            'fair-finale': {
                name: 'The Fair, Restored', chapter: 'ch4', type: 'story', x: 250, y: 545,
                scene: 'scene/fair-restored', script: 'finale.home', links: ['k-summit', 'fair-gate'],
                requiresFlag: 'finale-open', lockText: 'Roped off. Something is still wrong with the sky.',
                teaser: 'A quiet corner of the fair, roped off with a sign: Closed until further notice.',
            },
        },
    };

    // The painted maps. Nodes without a 'map' field are on 'main'.
    Rift.data.maps = {
        main: { scene: 'scene/map', name: 'The Valley' },
        ch2: { scene: 'scene/map-ch2', name: 'Boolesbury' },
        ch3: { scene: 'scene/map-ch3', name: 'Tomorrowton' },
        ch4: { scene: 'scene/map-ch4', name: 'The Server Tower' },
    };

    // NPC trainers for battle nodes.
    Rift.data.trainers = {
        'feed': {
            name: 'The Feed\'s Champion',
            ai: 'hard',
            team: ['beastie', 'muskrat', 'altmanta', 'zuckerborg', 'tremendoodle', 'kardashiant', 'rockodile', 'beeyonce', 'haalandroid', 'eminemu'],
            ante: { items: { greatcharm: 3, ward: 1, heartstone: 1 } },
        },
        'fin': {
            name: 'Prosecutor Fin',
            ai: 'hard',
            team: ['carlseal', 'altmanta', 'obambu', 'rockodile', 'messilion', 'gargoyle', 'beeyonce', 'haalandroid', 'lobstorian', 'muskrat'],
            ante: { items: { greatcharm: 2, 'trickster-coin': 1, heartstone: 1 } },
        },
        'constable': {
            name: 'Constable Clobber',
            ai: 'hard',
            team: ['lobstorian', 'tremendoodle', 'rawmsay', 'rockodile', 'carlseal', 'beastie', 'swiftlet', 'muskrat', 'messilion', 'speedcheeta'],
            ante: { items: { greatcharm: 2, heartstone: 1 } },
        },
        'card-sharp': {
            name: 'Corvina the Card Sharp',
            team: ['zuckerborg', 'astrophysicat', 'siuuugull', 'khaby', 'kardashiant', 'keanu', 'muskrat', 'lobstorian', 'beastie', 'tremendoodle'],
            ante: { items: { greatcharm: 1, ward: 1 } },
        },
    };
})(typeof window !== 'undefined' ? window : globalThis);
