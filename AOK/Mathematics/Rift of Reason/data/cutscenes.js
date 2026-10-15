/*
 * Cutscenes as data, played by js/ui/cutscene.js (issue #65). The stage is 1600 × 900 world
 * pixels; x and y are the centre of a layer or HUD box unless `bottom` gives its lower edge.
 *
 * Steps run in order. A step waits only when it says so (`wait: true`), except `say`, which
 * always waits for its voice line (and a fair reading time), so the film fits the recording.
 *
 *   { shot, bg, camera: { x, y, zoom }, layers: [...], fade }   a new shot (cross-fade in ms, 0 = cut)
 *   layer: { id, art, x, y | bottom, w, h?, depth, cover, opacity, scale, sy, clipY, aperture, glow, wFor }
 *   { camera: { x, y, zoom }, dur, ease, wait }                  move the camera of the current shot
 *   { tween: '<layer id>', to: { opacity, x, y | bottom, scale, sy, bright }, dur, ease, wait }
 *   { set: '<layer id>', ...props }                               change a layer now (art swaps too)
 *   { say: '<speaker>', t: '<the scripted line>', during: [steps] }   voice + subtitle; `during` runs alongside
 *   { wait: ms }   { sfx: '<name>' }   { ambience: '<art id in data/ambience.js>' }
 *   { fx: 'flicker' | 'flash' | 'bolt' }   one-off light effects; Calm motion leaves them out
 *   { hud: 'box' | 'glyphs' | 'sweep' | 'meter' | 'clear', ... }   the Algorithm's targeting HUD
 *   { title: 'Rift of Reason', logo: 'ui/logo' }   the title card;   { end: true, fade, reveal? }
 *
 * Player tokens, filled in for the person watching: {avatar} → avatar/<type>-<variant>,
 * {name} → nickname, {NAME} → NICKNAME, {colour} → the avatar's Way of Knowing colour.
 * Named `line` / `conversation` steps read canonical data/script text, so browser speech and
 * daily Google recordings share the same speaker/text key. New lines need not be recorded yet.
 */
(function (root) {
    'use strict';
    const Rift = root.Rift;
    const C = Rift.data.cutscenes || (Rift.data.cutscenes = {});

    // Places in the dawn village painting (scene/cold-open and its four layers).
    const HOME_WINDOW = { x: 923, y: 527 };
    const VILLAGE = [
        { id: 'sky', art: 'cutscene/cold-open-sky', x: 800, y: 450, w: 1600, h: 900, depth: 0.25, cover: true },
        { id: 'crack', art: 'cutscene/sky-crack', x: 800, y: 157, w: 384, depth: 0.25, opacity: 0.85 },
        { id: 'hills', art: 'cutscene/cold-open-hills', x: 800, y: 450, w: 1600, h: 900, depth: 0.55, cover: true },
        { id: 'village', art: 'cutscene/cold-open-village', x: 800, y: 450, w: 1600, h: 900, depth: 1, cover: true },
        { id: 'front', art: 'cutscene/cold-open-front', x: 800, y: 450, w: 1600, h: 900, depth: 1.3, cover: true },
    ];

    C['cold-open'] = {
        title: 'The cold open: the Algorithm finds you',
        // Played instead of the two lines on black in prologue.cold (data/script/lesson1.js).
        script: 'prologue.cold',
        steps: [
            // An ordinary, quiet morning; the same village becomes the machine's feed.
            { ambience: 'scene/fair' },
            { shot: 'morning', bg: '#14121f', camera: { x: 800, y: 450, zoom: 1 }, layers: VILLAGE },
            { camera: { x: 800, y: 470, zoom: 1.06 }, dur: 6500, ease: 'inOut', wait: true },
            { wait: 1500 },
            // Its speaking projection watches from a server observatory. Not the later colossus.
            // The fans and disks sit beneath a quiet recurring villain theme, on separate buses.
            { ambience: 'cutscene/server-room' },
            { shot: 'watcher', bg: '#05040a', fade: 1800, camera: { x: 800, y: 450, zoom: 1 }, layers: [
                { id: 'servers', art: 'cutscene/server-observatory', x: 800, y: 450, w: 1600, h: 900, cover: true, bright: 0.78 },
                { id: 'feed', art: 'scene/cold-open', x: 800, y: 402, w: 470, h: 264.375, depth: 0, opacity: 0, aperture: 0.58, bright: 0.75, glow: '#367986' },
                { id: 'watcher', art: 'cutscene/algorithm-watching', x: 330, bottom: 870, w: 570, opacity: 0, depth: 1.1 },
            ] },
            { tween: 'watcher', to: { opacity: 1 }, dur: 4200, ease: 'inOut', wait: true },
            { tween: 'watcher', to: { scale: 1.045, x: 345 }, dur: 9000, ease: 'inOut' },
            { tween: 'feed', to: { opacity: 1 }, dur: 2600, ease: 'inOut', wait: true },
            { wait: 2600 },
            // The observation image grows continuously into the town. No separate eye/crack cards.
            { tween: 'watcher', to: { opacity: 0 }, dur: 5000, ease: 'inOut' },
            { tween: 'feed', to: { scale: 1600 / 470, y: 450, aperture: 1, bright: 1 }, dur: 6200, ease: 'inOut', wait: true,
                calm: { to: { opacity: 1 }, dur: 6200 } },
            { ambience: 'cutscene/cold-open' },
            // Match the feed's final framing, then acquire depth as the camera moves into town.
            { shot: 'village', bg: '#14121f', fade: 1600, camera: { x: 800, y: 450, zoom: 1 }, layers: VILLAGE },
            { camera: { x: 760, y: 470, zoom: 1.2 }, dur: 4600, ease: 'inOut', wait: true },

            // 3. Scanning. The HUD sweeps the village while the Algorithm speaks.
            { camera: { x: 840, y: 470, zoom: 1.24 }, dur: 6500, ease: 'inOut' },
            { hud: 'glyphs' },
            { hud: 'sweep', dur: 1600 },
            { wait: 500 },
            { say: 'algorithm', t: 'NOISE DETECTED. THE FAIR, 9:02. SUBJECT: {name}.', during: [
                { hud: 'box', id: 'lanterns', x: 1250, y: 610, w: 330, h: 190, label: 'FAIR LANTERNS · UNLIT' },
                { sfx: 'count' },
                { wait: 1300 },
                { hud: 'box', id: 'sundial', x: 726, y: 650, w: 170, h: 110, label: 'SUNDIAL · TIME: ROUGHLY' },
                { sfx: 'count' },
                { wait: 1100 },
                { hud: 'box', id: 'granny', x: 470, y: 545, w: 150, h: 150, label: "GRANNY'S DOOR · SHUT" },
                { sfx: 'count' },
                { wait: 1000 },
                // 4. Lock-on: the camera snaps to the player's home.
                { camera: { x: HOME_WINDOW.x, y: HOME_WINDOW.y + 30, zoom: 2.6 }, dur: 450, ease: 'snap' },
                { hud: 'box', id: 'home', x: HOME_WINDOW.x, y: HOME_WINDOW.y + 25, w: 190, h: 200, label: 'HOME · ONE LIGHT ON', colour: '{colour}', lock: true },
                { sfx: 'block' },
            ] },
            { wait: 400 },
            { shot: 'bedroom', bg: '#14121f', fade: 350, camera: { x: 800, y: 520, zoom: 1.35 }, layers: [
                { id: 'room', art: 'scene/bedroom', x: 800, y: 450, w: 1600, h: 900, cover: true },
                // The sleeping sprite brings its own pillow and quilt. Moth-kin wings need more room.
                { id: 'sleeper', art: '{avatar}/asleep', x: 800, bottom: 972, w: 800, wFor: { mothkin: 928 } },
            ] },
            { camera: { x: 800, y: 500, zoom: 1.15 }, dur: 3600, ease: 'out' },
            { wait: 1500 },
            { hud: 'box', id: 'subject', x: 800, y: 560, w: 560, h: 420, label: 'SUBJECT: {NAME}', colour: '{colour}', lock: true },
            // The machine watches in silence. Cut the percentage readout: the face,
            // intimate room and unnatural silence carry the fear without an explanation.
            { wait: 2600 },

            // 5. Wake. Lightning in the window; the avatar jolts awake; the HUD glitches out.
            { fx: 'bolt', x1: 700, y1: 70, x2: 860, y2: 290, seed: 'window' },
            { fx: 'flash', dur: 500 },
            { sfx: 'rift' },
            { hud: 'clear', glitch: true },
            // Full new seated cutout: no portrait crop or clipping plane through the body.
            { shot: 'waking', bg: '#14121f', fade: 500, camera: { x: 800, y: 450, zoom: 1 }, layers: [
                { id: 'room', art: 'scene/bedroom', x: 800, y: 450, w: 1600, h: 900, cover: true },
                { id: 'awake', art: '{avatar}/waking', x: 800, bottom: 850, w: 590, wFor: { mothkin: 690 } },
            ] },
            { wait: 2200 },
            // End on the shock. Fade the film away; the regular screen gets the first good morning.
            { end: true, fade: 1500, reveal: true },
        ],
    };
    // Whole figures stay above the subtitle band. Cameras never punch through their silhouettes.
    const FAIR = [
        { id: 'fair', art: 'scene/fair', x: 800, y: 450, w: 1600, h: 900, cover: true },
        { id: 'sequins', art: 'npc/professor-sequins/idle', x: 360, bottom: 730, w: 300 },
        { id: 'hero', art: '{avatar}/idle', x: 640, bottom: 730, w: 255, wFor: { mothkin: 280 } },
        { id: 'granny', art: 'npc/granny-axiom/idle', x: 900, bottom: 730, w: 270 },
        { id: 'sundial', art: 'npc/sundial/idle', x: 1130, bottom: 730, w: 135 },
        { id: 'toy', art: 'ui/guess-o-matic', x: 470, bottom: 735, w: 95 },
        { id: 'shadow', art: 'cutscene/sundial-shadow', x: 1190, bottom: 745, w: 200 },
        { id: 'gull', art: 'creature/siuuugull/idle', x: 1370, bottom: 600, w: 120 },
    ];
    const fairLine = (at, during) => ({ line: 'prologue.rupture', at, during });
    C['fair-rupture'] = {
        title: 'The Fair: the sky opens', script: 'prologue.rift', replayLabel: 'Watch the Fair rupture again',
        steps: [
            { ambience: 'scene/fair' },
            { shot: 'the-final', bg: '#14121f', fade: 1000, camera: { x: 800, y: 450, zoom: 1 }, layers: FAIR },
            { wait: 900 },
            fairLine(0), fairLine(1), fairLine(2), fairLine(3),
            // The streamer records the boast; the sky answers from outside the frame.
            { shot: 'quote-saved', fade: 550, camera: { x: 800, y: 450, zoom: 1 }, layers: FAIR.concat([
                { id: 'streamer', art: 'creature/speedcheeta/idle', x: 1390, bottom: 730, w: 220 },
            ]) },
            fairLine(4), { ambience: 'cutscene/cold-open' }, fairLine(5),
            fairLine(6),
            { tween: 'sequins', to: { x: 150 }, dur: 1200, wait: true },
            { shot: 'the-sky-opens', fade: 1100, camera: { x: 800, y: 450, zoom: 1 }, layers: [
                FAIR[0], FAIR[2], FAIR[3], FAIR[4],
                { id: 'rift', art: 'fx/rift-6', x: 1080, y: 260, w: 420, opacity: 0, glow: '#3fe0d0' },
                { id: 'eye', art: 'npc/algorithm/sky-eye', x: 1080, y: 250, w: 530, opacity: 0 },
                { id: 'shadow', art: 'cutscene/sundial-shadow', x: 1190, bottom: 745, w: 200 },
                { id: 'thief', art: 'cutscene/nudge-net-empty', x: 1390, bottom: 735, w: 320, opacity: 0 },
                FAIR[7],
            ] },
            fairLine(7, [{ sfx: 'rift' }, { tween: 'rift', to: { opacity: 1 }, dur: 1800 }]),
            fairLine(8, [{ tween: 'eye', to: { opacity: 1 }, dur: 2200 }]),
            { tween: 'thief', to: { opacity: 1, x: 1280 }, dur: 1500, wait: true },
            { tween: 'shadow', to: { x: 1380, y: 495, scale: 0.35, opacity: 0 }, dur: 1700, wait: true },
            { set: 'thief', art: 'cutscene/nudge-shadow' },
            { wait: 500 }, fairLine(9),
            { tween: 'thief', to: { opacity: 0 }, dur: 1100, wait: true },
            fairLine(10), { wait: 800 }, fairLine(11),
            { shot: 'the-fair-changes', fade: 700, camera: { x: 800, y: 450, zoom: 1 }, layers: [
                FAIR[0], FAIR[2], FAIR[3], FAIR[4],
                { id: 'eye', art: 'npc/algorithm/sky-eye', x: 1080, y: 250, w: 530 },
                { id: 'gull', art: 'creature/siuuugull/idle', x: 1320, bottom: 735, w: 250 },
                { id: 'skin', art: 'fx/possessed', x: 1320, y: 575, w: 300, opacity: 0 },
                { id: 'eye-light', art: 'fx/rift-1', x: 1250, y: 410, w: 70, opacity: 0 },
            ] },
            { wait: 1000 },
            { tween: 'eye-light', to: { opacity: 0.8 }, dur: 1000, wait: true },
            { tween: 'skin', to: { opacity: 0.4 }, dur: 1500, wait: true },
            { tween: 'eye-light', to: { opacity: 0 }, dur: 700, wait: true },
            fairLine(12), fairLine(13),
            { shot: 'down-the-road', fade: 800, camera: { x: 800, y: 450, zoom: 1 }, layers: [
                FAIR[0], FAIR[2], FAIR[3], FAIR[4],
                { id: 'eye', art: 'npc/algorithm/sky-eye', x: 1080, y: 250, w: 530 },
                { id: 'gull', art: 'creature/siuuugull/idle', x: 1320, bottom: 735, w: 250 },
                { id: 'skin', art: 'fx/possessed', x: 1320, y: 575, w: 300, opacity: 0.4 },
                { id: 'sequins', art: 'npc/professor-sequins/idle', x: 150, bottom: 730, w: 300 },
                { id: 'glint1', art: 'item/lucky-sequin', x: 340, y: 550, w: 20, opacity: 0 },
                { id: 'glint2', art: 'item/lucky-sequin', x: 360, y: 585, w: 16, opacity: 0 },
                { id: 'glint3', art: 'item/lucky-sequin', x: 330, y: 610, w: 18, opacity: 0 },
            ] },
            { tween: 'sequins', to: { x: 340 }, dur: 1300, wait: true },
            { wait: 600 },
            { set: 'glint1', opacity: 1 }, { set: 'glint2', opacity: 1 }, { set: 'glint3', opacity: 1 },
            fairLine(14, [
                { tween: 'glint1', to: { x: 1020, y: 250, opacity: 0 }, dur: 1900 },
                { tween: 'glint2', to: { x: 980, y: 280, opacity: 0 }, dur: 2300 },
                { tween: 'glint3', to: { x: 1060, y: 260, opacity: 0 }, dur: 2700 },
            ]), fairLine(15),
            { tween: 'sequins', to: { x: 150 }, dur: 1500, wait: true },
            fairLine(16), { wait: 800 }, fairLine(17),
            { shot: 'the-road-waits', fade: 1200, camera: { x: 800, y: 450, zoom: 1 }, layers: [
                { id: 'road', art: 'scene/road-forest', x: 800, y: 450, w: 1600, h: 900, cover: true },
                { id: 'crack', art: 'cutscene/sky-crack', x: 1000, y: 140, w: 530, opacity: 0.85 },
            ] },
            { wait: 700 }, { end: true, fade: 1300 },
        ],
    };
    C['gate-aftermath'] = {
        replayLabel: 'Watch the Gate aftermath again',
        title: 'The Gate: we followed the bait', script: 'ch1.gate.win',
        steps: [
            { ambience: 'scene/road-gate' },
            { shot: 'the-open-gate', fade: 1100, camera: { x: 800, y: 450, zoom: 1 }, layers: [
                { id: 'gate', art: 'scene/gate-after', x: 800, y: 450, w: 1600, h: 900, cover: true },
                { id: 'hero', art: '{avatar}/idle', x: 470, bottom: 730, w: 270, wFor: { mothkin: 290 } },
                { id: 'sequins', art: 'npc/professor-sequins/idle', x: 880, bottom: 730, w: 330, when: { all: ['!dead:sequins', { flag: 'stakes.ch1', is: 1 }] } },
                { id: 'sequins', art: 'npc/professor-sequins/idle', x: 880, bottom: 730, w: 330, bright: 0.65, when: { all: ['!dead:sequins', { flag: 'stakes.ch1', is: 2 }] } },
                { id: 'sequins', art: 'npc/professor-sequins/idle', x: 880, bottom: 730, w: 330, bright: 0.4, when: { all: ['!dead:sequins', { flag: 'stakes.ch1', gte: 3 }] } },
            ] },
            { wait: 1000 }, { conversation: 'ch1.gate.release' },
            { wait: 1400, when: 'dead:sequins' },
            { shot: 'the-escaping-piece', fade: 1000, camera: { x: 800, y: 450, zoom: 1 }, layers: [
                { id: 'pass', art: 'scene/rift-pass', x: 800, y: 450, w: 1600, h: 900, cover: true },
                { id: 'eye', art: 'npc/algorithm/sky-eye', x: 1050, y: 230, w: 390, opacity: 0.75 },
                { id: 'hero', art: '{avatar}/idle', x: 470, bottom: 730, w: 270, wFor: { mothkin: 290 } },
                { id: 'nudge', art: 'npc/nudge/idle', x: 1100, bottom: 720, w: 210, when: '!dead:sequins' },
                { id: 'ring', art: 'cutscene/ring-light-broken', x: 930, bottom: 725, w: 130, when: { all: ['!dead:sequins', { clock: 'ch1', lte: 2 }] } },
                { id: 'ring', art: 'cutscene/ring-light', x: 960, bottom: 725, w: 130, when: { all: ['!dead:sequins', { clock: 'ch1', gte: 3 }] } },
                { id: 'piece', art: 'cutscene/sundial-shadow', x: 1130, y: 620, w: 145, when: '!dead:sequins' },
            ] },
            { line: 'ch1.gate.escape', at: 0 },
            { tween: 'piece', to: { x: 600, y: 620 }, dur: 1500, wait: true, when: { all: ['!dead:sequins', { clock: 'ch1', lte: 2 }] } },
            { tween: 'nudge', to: { x: 1210, y: 360, scale: 0.4, opacity: 0 }, dur: 1500, when: '!dead:sequins' },
            { tween: 'piece', to: { x: 1210, y: 360, scale: 0.4, opacity: 0 }, dur: 1500, when: { all: ['!dead:sequins', { clock: 'ch1', gte: 3 }] } },
            { tween: 'ring', to: { x: 1190, y: 400, scale: 0.4, opacity: 0 }, dur: 1500, when: { all: ['!dead:sequins', { clock: 'ch1', gte: 3 }] } },
            { wait: 1700, when: '!dead:sequins' },
            { line: 'ch1.gate.escape', at: 1, when: '!dead:sequins' },
            { tween: 'eye', to: { scale: 0.6, opacity: 0.3 }, dur: 2000, wait: true },
            // A villain feed, explicitly shown from the Gate; the player has not travelled home.
            { ambience: 'cutscene/cold-open' },
            { shot: 'the-wrong-victory', fade: 1500, camera: { x: 800, y: 450, zoom: 1 }, layers: [
                { id: 'gate', art: 'scene/gate-after', x: 800, y: 450, w: 1600, h: 900, cover: true },
                { id: 'hero', art: '{avatar}/idle', x: 470, bottom: 730, w: 270, wFor: { mothkin: 290 } },
                { id: 'door-feed', art: 'scene/granny-door', x: 1090, y: 410, w: 700, h: 394, depth: 0 },
                { id: 'watcher', art: 'npc/algorithm/sky-eye', x: 1180, y: 150, w: 260, opacity: 0.7 },
            ] },
            { hud: 'box', id: 'home-feed', x: 1090, y: 410, w: 720, h: 414, label: 'LIVE FEED · GRANNY\'S DOOR', depth: 0 },
            { conversation: 'ch1.gate.trap' },
            { hud: 'clear' },
            { wait: 1100 }, { end: true, fade: 1400, reveal: true },
        ],
    };
    // The Hall keeps its decisions and danger in lesson2.js. These passages only stage the
    // canonical words after the player's liar sentence; Journal joins them without mutations.
    const hallRoom = { id: 'hall', art: 'scene/hall-after', x: 800, y: 450, w: 1600, h: 900, cover: true };
    // The surviving captive stays visibly in peril until the outcome passage releases her.
    const hallPerilRoom = [Object.assign({}, hallRoom, { art: 'scene/feast-hall', when: { all: ['!dead:granny', { clock: 'ch2', lte: 7 }] } }),
        Object.assign({}, hallRoom, { when: { any: ['dead:granny', { clock: 'ch2', gte: 8 }] } }),
        // On the no-death brink the rope already snapped: she has climbed out, without her shawl.
        { id: 'granny-safe', art: 'cutscene/granny-without-shawl', x: 200, bottom: 730, w: 200,
            when: { all: ['!dead:granny', { clock: 'ch2', gte: 8 }] } }];
    const hallHero = { id: 'hero', art: '{avatar}/idle', x: 1110, bottom: 730, w: 255, wFor: { mothkin: 280 } };
    const hallQuill = { id: 'quill', art: 'cutscene/quill-unmasked', x: 540, bottom: 730, w: 335 };
    const hallPiece = { id: 'shadow-two', art: 'cutscene/sundial-shadow', x: 560, y: 680, w: 145 };
    const hallFirst = { id: 'shadow-one', art: 'cutscene/sundial-shadow', x: 700, bottom: 735, w: 130, when: 'nudgeFled' };
    C['town-hall-unmask'] = {
        title: 'The Hall: the faces fall',
        steps: [
            { ambience: 'scene/feast-hall' },
            { shot: 'the-last-answer', fade: 1000, camera: { x: 800, y: 450, zoom: 1 }, layers: [
                ...hallPerilRoom, hallHero, Object.assign({}, hallQuill, { art: 'cutscene/quill-masked', w: 300 }),
                { id: 'smudge', art: 'npc/villager-sweep/idle', x: 110, bottom: 460, w: 90, when: 'paradox-board' },
            ] },
            { wait: 700 }, { conversation: 'ch2.hall.break' },
            // The speech finishes before the face moves. A detached prop makes the loss physical.
            { set: 'quill', art: 'cutscene/quill-unmasked' },
            { shot: 'the-teachers-face', fade: 500, camera: { x: 800, y: 450, zoom: 1 }, layers: [
                ...hallPerilRoom, hallHero, hallQuill,
                { id: 'mask', art: 'cutscene/quill-mask', x: 540, y: 355, w: 125 },
                { id: 'scarf', art: 'cutscene/quill-scarf', x: 540, y: 500, w: 150 },
            ] },
            { tween: 'mask', to: { x: 660, y: 685, scale: 0.8 }, dur: 1700, wait: true },
            { wait: 700 }, { conversation: 'ch2.hall.face' },
            { tween: 'scarf', to: { x: 560, y: 680, scale: 0.8 }, dur: 1700, wait: true },
            { conversation: 'ch2.hall.shadow' },
            { set: 'scarf', opacity: 0 },
            { shot: 'the-shadow-on-the-floor', fade: 500, camera: { x: 800, y: 450, zoom: 1 }, layers: [
                ...hallPerilRoom, hallHero, hallQuill, hallPiece,
                { id: 'mask', art: 'cutscene/quill-mask', x: 660, y: 685, w: 100 },
            ] },
            { wait: 1000 },
            { shot: 'borrowed-faces', fade: 850, camera: { x: 800, y: 450, zoom: 1 }, layers: [
                ...hallPerilRoom,
                { id: 'guest-a', art: 'npc/imp-bunny/masked', x: 470, bottom: 705, w: 170 },
                { id: 'guest-b', art: 'npc/imp-duck/masked', x: 690, bottom: 705, w: 170 },
                { id: 'guest-c', art: 'npc/imp-hedgehog/masked', x: 910, bottom: 705, w: 170 },
                { id: 'nudge', art: 'npc/nudge/masked', x: 1230, bottom: 730, w: 220 },
                { id: 'shadow-one', art: 'cutscene/sundial-shadow', x: 1260, y: 510, w: 130, opacity: 0, when: 'nudgeFled' },
            ] },
            { set: 'guest-a', art: 'npc/imp-bunny/unmasked' },
            { wait: 300 }, { set: 'guest-b', art: 'npc/imp-duck/unmasked' },
            { wait: 300 }, { set: 'guest-c', art: 'npc/imp-hedgehog/unmasked' },
            { set: 'nudge', art: 'npc/nudge/idle', h: 329, y: 565.5 },
            { conversation: 'ch2.hall.masks' },
            { tween: 'shadow-one', to: { opacity: 1, x: 1100, y: 710 }, dur: 1400, wait: true, when: 'nudgeFled' },
            { conversation: 'ch2.hall.first-piece' },
            { shot: 'forty-years', fade: 1100, camera: { x: 800, y: 450, zoom: 1 }, layers: [
                ...hallPerilRoom, hallHero, hallQuill, hallPiece, hallFirst,
                { id: 'mask', art: 'cutscene/quill-mask', x: 660, y: 685, w: 100 },
            ] },
            { ambience: 'cutscene/cold-open' },
            { line: 'ch2.hall.confession', at: 0 }, { wait: 900 },
            { line: 'ch2.hall.confession', at: 1 }, { wait: 1100 },
            { line: 'ch2.hall.confession', at: 2 },
            { wait: 1000 }, { end: true, fade: 1000, reveal: true },
        ],
    };
    C['town-hall-outcome'] = {
        title: 'The Hall: what the victory cost',
        steps: [
            { ambience: 'scene/feast-hall' },
            { shot: 'the-space-beside-you', fade: 1100, camera: { x: 800, y: 450, zoom: 1 }, layers: [
                hallRoom, hallHero,
                { id: 'granny', art: 'npc/granny-axiom/idle', x: 975, bottom: 350, w: 150,
                    when: { all: ['!dead:granny', { flag: 'stakes.ch2', in: [1, 2] }] } },
                { id: 'granny', art: 'cutscene/granny-without-shawl', x: 200, bottom: 730, w: 150,
                    when: { all: ['!dead:granny', { flag: 'stakes.ch2', is: 3 }, { clock: 'ch2', gte: 8 }] } },
                { id: 'granny', art: 'npc/granny-axiom/idle', x: 975, bottom: 350, w: 150, bright: 0.8,
                    when: { all: ['!dead:granny', { flag: 'stakes.ch2', is: 3 }, { clock: 'ch2', lte: 7 }] } },
                // Cut to the belongings; Clobber's helmet action takes place outside this frame.
                { id: 'keepsakes', art: 'keepsake/granny-charm-glasses', x: 800, y: 520, w: 180, opacity: 0, when: 'dead:granny' },
                { id: 'axiom', art: 'ui/axiom-spare-axiom', x: 720, y: 550, w: 95, opacity: 0,
                    when: { all: ['!dead:granny', { flag: 'stakes.ch2', in: [1, 2] }] } },
            ] },
            // Lower her from the rig, or approach from the floor if the brink already broke it.
            { tween: 'granny', to: { x: 800, bottom: 730, scale: 1.73 }, dur: 2400, wait: true, when: '!dead:granny' },
            { wait: 900 },
            { tween: 'keepsakes', to: { opacity: 1, x: 950, y: 570 }, dur: 1900, wait: true, when: 'dead:granny' },
            { conversation: 'ch2.hall.outcome' },
            { tween: 'axiom', to: { opacity: 1, x: 950 }, dur: 1400, wait: true,
                when: { all: ['!dead:granny', { flag: 'stakes.ch2', in: [1, 2] }] } },
            { wait: 2100, when: 'dead:granny' },
            { wait: 700 }, { end: true, fade: 1100, reveal: true },
        ],
    };
    C['town-hall-departure'] = {
        title: 'The Hall: tomorrow has decided',
        steps: [
            { ambience: 'cutscene/cold-open' },
            { shot: 'the-window', fade: 1100, camera: { x: 800, y: 450, zoom: 1 }, layers: [
                hallRoom, hallHero, hallQuill, hallPiece, hallFirst,
                { id: 'rift', art: 'fx/rift-6', x: 800, y: 300, w: 330, opacity: 0.75 },
            ] },
            { tween: 'quill', to: { x: 800, y: 395, scale: 0.8 }, dur: 1800, wait: true },
            { conversation: 'ch2.hall.exit' },
            // Her threat belongs to her face, not an empty window. She leaves after speaking.
            { tween: 'quill', to: { x: 800, y: 300, scale: 0.35, opacity: 0 }, dur: 2000, wait: true },
            { shot: 'the-next-era', fade: 800, camera: { x: 800, y: 450, zoom: 1 }, layers: [
                hallRoom, hallHero, hallPiece, hallFirst,
                { id: 'rift', art: 'fx/rift-6', x: 800, y: 300, w: 330, opacity: 0.7 },
                { id: 'eye', art: 'npc/algorithm/sky-eye', x: 800, y: 290, w: 290, opacity: 0.75 },
            ] },
            { conversation: 'ch2.hall.algorithm' },
            { wait: 1000 }, { end: true, fade: 1300, reveal: true },
        ],
    };
    C['town-hall-aftermath'] = {
        title: 'The Hall: a world with no maybes', script: 'ch2.hall.win', replayLabel: 'Watch the Hall aftermath again',
        steps: [].concat(C['town-hall-unmask'].steps.filter(s => !s.end),
            C['town-hall-outcome'].steps.filter(s => !s.end), C['town-hall-departure'].steps),
    };
})(typeof window !== 'undefined' ? window : globalThis);
