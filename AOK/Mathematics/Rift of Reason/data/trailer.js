/* Trailer edit: seconds, original narration and authentic game art. No story outcomes. */
(function (root) {
    'use strict';
    root.Rift.data.trailer = {
        duration: 82,
        soundtrack: 'assets/trailer/soundtrack.mp3',
        voice: { id: 'nPczCjzI2devNBz1zQrb', name: 'Brian', model: 'eleven_v3' },
        scenes: [
            { id: 'fair', start: 0, end: 8, art: 'scene/fair', mode: 'fair', kicker: 'EVERY ADVENTURE STARTS SOMEWHERE', heading: 'It began at a fair.', sub: '', color: '#edc782' },
            { id: 'rift', start: 8, end: 15, art: 'scene/fair', mode: 'rift', kicker: '', heading: 'Something heard you.', sub: '', color: '#70e8df' },
            { id: 'road', start: 15, end: 23, art: 'scene/road-forest', mode: 'journey', kicker: 'HOME IS COUNTING ON YOU', heading: 'Follow the crack.', sub: '', color: '#a2d2b5', cast: [{ art: 'avatar/fox-girl/idle', x: .72, y: .87, h: .45 }] },
            { id: 'heroes', start: 23, end: 29, art: 'scene/road-bridge', mode: 'heroes', kicker: 'YOUR JOURNEY. YOUR WAY OF THINKING.', heading: 'Who will you be?', sub: '', color: '#edc782', cast: [{ art: 'avatar/raven-girl/idle', x: .16, y: .86, h: .34 }, { art: 'avatar/frogling-boy/idle', x: .33, y: .87, h: .38 }, { art: 'avatar/fox-girl/idle', x: .50, y: .88, h: .47 }, { art: 'avatar/owlet-boy/idle', x: .68, y: .87, h: .39 }, { art: 'avatar/mothkin-girl/idle', x: .85, y: .86, h: .35 }] },
            { id: 'village', start: 29, end: 36, art: 'scene/village-square', mode: 'journey', kicker: 'BOOLESBURY', heading: 'Who can you believe?', sub: '', color: '#edc782' },
            { id: 'city', start: 36, end: 40, art: 'scene/neon-plaza', mode: 'journey', kicker: 'TOMORROWTON', heading: 'A thousand voices.', sub: '', color: '#86dbe7' },
            { id: 'tribunal', start: 40, end: 43, art: 'scene/tribunal', mode: 'journey', kicker: '', heading: 'One story must stand.', sub: '', color: '#86dbe7' },
            { id: 'tower', start: 43, end: 49, art: 'scene/tower-base', mode: 'journey', kicker: 'THE SERVER TOWER', heading: 'Waiting.', sub: '', color: '#c0a9e7' },
            { id: 'puzzles', start: 49, end: 56, art: 'scene/switch-room', mode: 'puzzles', kicker: 'PUZZLES. CLUES. CONTRADICTIONS.', heading: 'Question the claim.', sub: 'Test the rule. Find the flaw.', color: '#70e8df' },
            { id: 'creatures', start: 56, end: 63, art: 'scene/fair', mode: 'creatures', kicker: 'DISCOVER. CATCH. COLLECT.', heading: 'Expect the extraordinary.', sub: '', color: '#edc782', cast: [{ art: 'creature/astrophysicat/idle', x: .25, y: .86, h: .44 }, { art: 'creature/swiftlet/idle', x: .5, y: .85, h: .4 }, { art: 'creature/lobstorian/idle', x: .75, y: .86, h: .46 }] },
            { id: 'battle', start: 63, end: 70, art: 'scene/arena-l1', mode: 'battle', kicker: 'THE CARD ARENA', heading: 'Outthink your rivals.', sub: 'Even the rules can change.', color: '#dba9e7', cast: [{ art: 'creature/astrophysicat/idle', x: .28, y: .85, h: .35 }, { art: 'creature/lobstorian/idle', x: .72, y: .85, h: .35 }] },
            { id: 'question', start: 70, end: 76, art: 'scene/rift-pass', mode: 'question', kicker: '', heading: 'Will you prove it wrong?', sub: '', color: '#70e8df', cast: [{ art: 'avatar/fox-girl/idle', x: .2, y: .86, h: .36 }] },
            { id: 'title', start: 76, end: 82, art: 'scene/title', mode: 'title', kicker: 'A THEORY OF KNOWLEDGE ADVENTURE', heading: 'RIFT OF REASON', sub: 'THINK BEFORE YOU SHOUT', color: '#edc782' },
        ].map(scene => {
            // Story shots keep the world prominent; words live chiefly in narration/captions.
            if (['journey', 'heroes', 'creatures', 'battle', 'puzzles'].includes(scene.mode)) scene.textMode = 'location';
            if (scene.id === 'road') scene.cast[0] = { art: 'avatar/fox-girl/idle', x: .72, y: .86, h: .37, walk: true, fromX: .12, toX: .76 };
            if (scene.mode === 'heroes') scene.cast.forEach((member, i) => Object.assign(member, { walk: true, fromX: member.x - .13, toX: member.x + .035, delay: i * .18 }));
            if (['village', 'city', 'tribunal'].includes(scene.id)) scene.cast = [{ art: 'avatar/fox-girl/idle', x: .6, y: .85, h: .27, walk: true, fromX: .24, toX: .77 }];
            if (scene.id === 'tower') scene.cast = [{ art: 'avatar/fox-girl/idle', x: .38, y: .87, h: .20, walk: true, fromX: .21, toX: .49 }];
            if (scene.id === 'rift') scene.cast = [{ art: 'npc/algorithm/sky-eye', x: .72, y: .69, h: .42 }];
            return scene;
        }),
        lines: [
            { id: '01', start: .6, end: 7.6, direction: '[storytelling]', text: 'It began at a fair. Lanterns. Laughter. And one dangerous word: always.' },
            { id: '02', start: 8.6, end: 14.6, direction: '[serious]', text: 'Then the sky opened. And something on the other side... heard you.' },
            { id: '03', start: 15.6, end: 22.5, direction: '[storytelling]', text: 'Now the crack runs down the road. And home is counting on you.' },
            { id: '04', start: 23.4, end: 28.6, direction: '[confident]', text: 'Choose your traveller. Take the road. Leave certainty behind.' },
            { id: '05', start: 29.5, end: 35.6, direction: '[curious]', text: 'In Boolesbury... friendly faces. Strange promises. Who can you believe?' },
            { id: '06', start: 36.5, end: 42.7, direction: '[serious]', text: 'In Tomorrowton... a thousand voices shout. But which story can stand?' },
            { id: '07', start: 43.5, end: 48.5, direction: '[whispers]', text: 'And above it all... the Server Tower. Waiting.' },
            { id: '08', start: 49.5, end: 55.5, direction: '[confident]', text: 'Test the rule. Question the claim. Find the flaw.' },
            { id: '09', start: 56.4, end: 62.7, direction: '[excited]', text: 'Catch extraordinary creatures. Build your collection. Bring your best into the Card Arena.' },
            { id: '10', start: 63.5, end: 69.6, direction: '[confident]', text: 'Outthink your rivals... when even the rules can turn against you.' },
            { id: '11', start: 70.5, end: 75.6, direction: '[serious]', text: 'Something thinks it knows your next move. Will you prove it wrong?' },
            { id: '12', start: 76.6, end: 80.6, direction: '[confident]', text: 'Rift of Reason. Think before you shout.' },
        ].map(line => Object.assign(line, { file: 'assets/trailer/voice/' + line.id + '.mp3' })),
    };
})(typeof window !== 'undefined' ? window : globalThis);
