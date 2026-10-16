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
 *   { note: '<silent court record>', during: [steps] }             caption + reading time, never voiced
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
    // The four stolen pieces have distinct silhouettes. Complete shadows belong on the ground;
    // fragments may be carried or exhibited without turning into miniature whole sundials.
    const SHADOW = { whole: 'cutscene/shadow-whole', half: 'cutscene/shadow-incomplete',
        one: 'cutscene/shadow-fragment-one', two: 'cutscene/shadow-fragment-two',
        three: 'cutscene/shadow-fragment-three', four: 'cutscene/shadow-fragment-four' };
    // Whole figures stay above the subtitle band. Cameras never punch through their silhouettes.
    const FAIR = [
        { id: 'fair', art: 'scene/fair', x: 800, y: 450, w: 1600, h: 900, cover: true },
        { id: 'sequins', art: 'npc/professor-sequins/idle', x: 360, bottom: 730, w: 300 },
        { id: 'hero', art: '{avatar}/idle', x: 640, bottom: 730, w: 255, wFor: { mothkin: 280 } },
        { id: 'granny', art: 'npc/granny-axiom/idle', x: 900, bottom: 730, w: 270 },
        { id: 'sundial', art: 'npc/sundial/idle', x: 1130, bottom: 730, w: 135 },
        { id: 'toy', art: 'ui/guess-o-matic', x: 470, bottom: 735, w: 95 },
        { id: 'shadow', art: SHADOW.whole, x: 1200, y: 742, w: 240, sy: 0.4, opacity: 0.65 },
        { id: 'gull', art: 'creature/siuuugull/idle', x: 1290, bottom: 735, w: 180 },
    ];
    const fairConcern = Object.assign({}, FAIR[2], { art: '{avatar}/solemn' });
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
                { id: 'streamer', art: 'creature/speedcheeta/idle', x: 1490, bottom: 730, w: 160 },
            ]) },
            fairLine(4), { ambience: 'cutscene/cold-open' }, fairLine(5),
            fairLine(6),
            { tween: 'sequins', to: { x: 150 }, dur: 1200, wait: true },
            { shot: 'the-sky-opens', fade: 1100, camera: { x: 800, y: 450, zoom: 1 }, layers: [
                FAIR[0], fairConcern, FAIR[3], FAIR[4],
                { id: 'rift', art: 'fx/rift-6', x: 1080, y: 260, w: 420, opacity: 0, glow: '#3fe0d0' },
                { id: 'eye', art: 'npc/algorithm/sky-eye', x: 1080, y: 250, w: 530, opacity: 0 },
                FAIR[6],
                FAIR[7],
                // The thief crosses in front of the gull so his face and net stay readable.
                { id: 'thief', art: 'cutscene/nudge-net-empty', x: 1430, bottom: 735, w: 320, opacity: 0 },
            ] },
            fairLine(7, [{ sfx: 'rift' }, { tween: 'rift', to: { opacity: 1 }, dur: 1800 }]),
            fairLine(8, [{ tween: 'eye', to: { opacity: 1 }, dur: 2200 }]),
            { tween: 'thief', to: { opacity: 1, x: 1370 }, dur: 1500, wait: true },
            { tween: 'shadow', to: { x: 1470, y: 490, sy: 1, scale: 0.35, opacity: 0 }, dur: 1700, wait: true },
            { set: 'thief', art: 'cutscene/nudge-net-soft-shadow' },
            { wait: 500 }, fairLine(9),
            { tween: 'thief', to: { opacity: 0 }, dur: 1100, wait: true },
            fairLine(10), { wait: 800 }, fairLine(11),
            { shot: 'the-fair-changes', fade: 700, camera: { x: 800, y: 450, zoom: 1 }, layers: [
                FAIR[0], fairConcern, FAIR[3], FAIR[4],
                { id: 'eye', art: 'npc/algorithm/sky-eye', x: 1080, y: 250, w: 530 },
                FAIR[7],
                { id: 'skin', art: 'fx/possessed', x: 1290, y: 610, w: 220, opacity: 0 },
                { id: 'eye-light', art: 'fx/rift-1', x: 1080, y: 290, w: 55, opacity: 0 },
            ] },
            { wait: 1000 },
            { tween: 'eye-light', to: { opacity: 0.8 }, dur: 600, wait: true },
            { tween: 'eye-light', to: { x: 1290, y: 610 }, dur: 1600, wait: true },
            { tween: 'skin', to: { opacity: 0.4 }, dur: 1500, wait: true },
            { tween: 'eye-light', to: { opacity: 0 }, dur: 700, wait: true },
            fairLine(12), fairLine(13),
            { shot: 'down-the-road', fade: 800, camera: { x: 800, y: 450, zoom: 1 }, layers: [
                FAIR[0], fairConcern, FAIR[3], FAIR[4],
                { id: 'eye', art: 'npc/algorithm/sky-eye', x: 1080, y: 250, w: 530 },
                FAIR[7],
                { id: 'skin', art: 'fx/possessed', x: 1290, y: 610, w: 220, opacity: 0.4 },
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
                { id: 'hero', art: '{avatar}/solemn', x: 470, bottom: 730, w: 270, wFor: { mothkin: 290 } },
                { id: 'sequins', art: 'npc/professor-sequins/idle', x: 880, bottom: 730, w: 330, when: { all: ['!dead:sequins', { flag: 'stakes.ch1', is: 1 }] } },
                { id: 'sequins', art: 'npc/professor-sequins/idle', x: 880, bottom: 730, w: 330, bright: 0.65, when: { all: ['!dead:sequins', { flag: 'stakes.ch1', is: 2 }] } },
                { id: 'sequins', art: 'npc/professor-sequins/idle', x: 880, bottom: 730, w: 330, bright: 0.4, when: { all: ['!dead:sequins', { flag: 'stakes.ch1', gte: 3 }] } },
            ] },
            { wait: 1000 }, { conversation: 'ch1.gate.release' },
            { wait: 1400, when: 'dead:sequins' },
            { shot: 'the-escaping-piece', fade: 1000, camera: { x: 800, y: 450, zoom: 1 }, layers: [
                { id: 'pass', art: 'scene/rift-pass', x: 800, y: 450, w: 1600, h: 900, cover: true },
                { id: 'eye', art: 'npc/algorithm/sky-eye', x: 1050, y: 230, w: 390, opacity: 0.75 },
                { id: 'hero', art: '{avatar}/solemn', x: 470, bottom: 730, w: 270, wFor: { mothkin: 290 } },
                { id: 'nudge', art: 'npc/nudge/idle', x: 1100, bottom: 720, w: 210, when: '!dead:sequins' },
                { id: 'ring', art: 'cutscene/ring-light-broken', x: 930, bottom: 725, w: 130, when: { all: ['!dead:sequins', { clock: 'ch1', lte: 2 }] } },
                { id: 'ring', art: 'cutscene/ring-light', x: 960, bottom: 725, w: 130, when: { all: ['!dead:sequins', { clock: 'ch1', gte: 3 }] } },
                { id: 'piece', art: SHADOW.one, x: 1170, y: 560, w: 76, when: '!dead:sequins' },
            ] },
            { line: 'ch1.gate.escape', at: 0 },
            { tween: 'piece', to: { x: 560, y: 590 }, dur: 1500, wait: true, when: { all: ['!dead:sequins', { clock: 'ch1', lte: 2 }] } },
            { tween: 'nudge', to: { x: 1210, y: 360, scale: 0.4, opacity: 0 }, dur: 1500, when: '!dead:sequins' },
            { tween: 'piece', to: { x: 1240, y: 365, scale: 0.4, opacity: 0 }, dur: 1500, when: { all: ['!dead:sequins', { clock: 'ch1', gte: 3 }] } },
            { tween: 'ring', to: { x: 1190, y: 400, scale: 0.4, opacity: 0 }, dur: 1500, when: { all: ['!dead:sequins', { clock: 'ch1', gte: 3 }] } },
            { wait: 1700, when: '!dead:sequins' },
            { line: 'ch1.gate.escape', at: 1, when: '!dead:sequins' },
            { tween: 'eye', to: { scale: 0.6, opacity: 0.3 }, dur: 2000, wait: true },
            // A villain feed, explicitly shown from the Gate; the player has not travelled home.
            { ambience: 'cutscene/cold-open' },
            { shot: 'the-wrong-victory', fade: 1500, camera: { x: 800, y: 450, zoom: 1 }, layers: [
                { id: 'gate', art: 'scene/gate-after', x: 800, y: 450, w: 1600, h: 900, cover: true },
                { id: 'hero', art: '{avatar}/solemn', x: 470, bottom: 730, w: 270, wFor: { mothkin: 290 } },
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
    // The accepted paradox locks the winch and extinguishes the fire. The outcome/reward still
    // resolves in the story, but the confession no longer competes with an active emergency.
    const hallPerilRoom = [Object.assign({}, hallRoom, { art: 'scene/hall-stilled', when: { all: ['!dead:granny', { clock: 'ch2', lte: 7 }] } }),
        Object.assign({}, hallRoom, { when: { any: ['dead:granny', { clock: 'ch2', gte: 8 }] } }),
        // On the no-death brink the rope already snapped: she has climbed out, without her shawl.
        { id: 'granny-safe', art: 'cutscene/granny-without-shawl', x: 200, bottom: 730, w: 200,
            when: { all: ['!dead:granny', { clock: 'ch2', gte: 8 }] } }];
    const hallHero = { id: 'hero', art: '{avatar}/solemn', x: 1110, bottom: 730, w: 255, wFor: { mothkin: 280 }, mirror: true };
    const hallQuill = { id: 'quill', art: 'cutscene/quill-unmasked', x: 540, bottom: 730, w: 335 };
    const hallPiece = { id: 'shadow-two', art: SHADOW.two, x: 560, y: 727, w: 95, sy: 0.65 };
    const hallFirst = { id: 'shadow-one', art: SHADOW.one, x: 1340, y: 728, w: 75, sy: 0.55, when: 'nudgeFled' };
    C['town-hall-unmask'] = {
        title: 'The Hall: the faces fall',
        steps: [
            { ambience: 'scene/feast-hall' },
            { shot: 'the-last-answer', fade: 1000, camera: { x: 800, y: 450, zoom: 1 }, layers: [
                ...hallPerilRoom, hallHero, Object.assign({}, hallQuill, { art: 'cutscene/quill-masked', w: 300 }),
                { id: 'smudge', art: 'npc/villager-sweep/idle', x: 110, bottom: 460, w: 90, when: 'paradox-board' },
            ] },
            { conversation: 'ch2.hall.safety' },
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
                { id: 'nudge', art: 'npc/nudge/masked', x: 1340, bottom: 730, w: 190 },
                { id: 'shadow-one', art: SHADOW.one, x: 1340, y: 510, w: 75, opacity: 0, when: 'nudgeFled' },
            ] },
            { set: 'guest-a', art: 'npc/imp-bunny/unmasked' },
            { wait: 300 }, { set: 'guest-b', art: 'npc/imp-duck/unmasked' },
            { wait: 300 }, { set: 'guest-c', art: 'npc/imp-hedgehog/unmasked' },
            { set: 'nudge', art: 'npc/nudge/idle', h: 284, y: 588 },
            { conversation: 'ch2.hall.masks' },
            { tween: 'shadow-one', to: { opacity: 1, y: 728, sy: 0.55 }, dur: 1400, wait: true, when: 'nudgeFled' },
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
                hallRoom,
                { id: 'rift', art: 'fx/rift-6', x: 800, y: 300, w: 330, opacity: 0.75 },
                hallHero, hallQuill, hallPiece, hallFirst,
            ] },
            { tween: 'quill', to: { x: 800, y: 425, scale: 0.8 }, dur: 1800, wait: true },
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
    // The Tribunal's accepted evidence and clock resolve in lesson3.js. Only the returned
    // shadow is shown here; a bargain never conjures the two pieces already handed away.
    const courtRoom = { id: 'court', art: 'scene/tribunal', x: 800, y: 450, w: 1600, h: 900, cover: true };
    const courtHero = { id: 'hero', art: '{avatar}/solemn', x: 1230, bottom: 730, w: 235, wFor: { mothkin: 260 }, mirror: true };
    const courtPip = { id: 'pip', art: 'cutscene/pip-solemn', x: 1000, bottom: 730, w: 185 };
    const courtFin = { id: 'fin', art: 'cutscene/fin-subdued', x: 420, bottom: 730, w: 245 };
    const courtSundial = { id: 'sundial', art: 'npc/sundial/idle', x: 800, bottom: 730, w: 115, when: '!dead:sundial' };
    const courtCase = { id: 'case', art: 'cutscene/exhibit-case', x: 630, bottom: 680, w: 220 };
    const courtGlass = { id: 'glass', art: 'cutscene/exhibit-glass', x: 650, y: 585, w: 160, opacity: 0.3 };
    const courtPiece = { id: 'exhibit', art: SHADOW.three, x: 650, y: 590, w: 95 };
    const courtAisle = [courtRoom, courtFin, courtCase, courtPiece, courtGlass, courtHero, courtPip, courtSundial,
        { id: 'judge', art: 'npc/judge/idle', x: 800, bottom: 535, w: 170 }];
    const living = '!dead:sundial';
    const lost = 'dead:sundial';
    const courtGallery = [Object.assign({}, courtRoom, { bright: 0.65 }),
        { id: 'juror-a', art: 'cutscene/court-juror-a', x: 390, bottom: 730, w: 185 },
        { id: 'juror-b', art: 'cutscene/court-juror-b', x: 650, bottom: 730, w: 185 },
        { id: 'juror-one', art: 'cutscene/juror-one', x: 910, bottom: 730, w: 235 },
        { id: 'sign-a', art: 'cutscene/court-sign', x: 390, y: 635, w: 145 },
        { id: 'sign-b', art: 'cutscene/court-sign', x: 650, y: 635, w: 145 },
        { id: 'sign-one', art: 'cutscene/court-sign', x: 910, y: 555, w: 145 },
        { id: 'nudge', art: 'npc/nudge/idle', x: 1200, bottom: 730, w: 185 }];
    const signLabels = [
        { hud: 'text', id: 'jury-a', follow: 'sign-a', x: 390, y: 555, w: 125, h: 60, label: 'GUILTY', colour: '#413244' },
        { hud: 'text', id: 'jury-b', follow: 'sign-b', x: 650, y: 555, w: 125, h: 60, label: 'GUILTY', colour: '#413244' },
        { hud: 'text', id: 'jury-one', follow: 'sign-one', x: 910, y: 555, w: 125, h: 60, label: 'GUILTY', colour: '#b32738' },
    ];
    const livingGallery = [
        { shot: 'the-last-guilty-sign', fade: 1100, camera: { x: 800, y: 450, zoom: 1 }, layers: courtGallery },
        ...signLabels,
        { line: 'ch3.trial.gallery-living', at: 0, during: [
            { tween: 'sign-a', to: { y: 660, opacity: 0 }, dur: 1700 },
            { tween: 'sign-b', to: { y: 660, opacity: 0 }, dur: 1700 },
            { wait: 1900 }, { hud: 'clear' }, signLabels[2],
            { wait: 1300 },
            { tween: 'sign-one', to: { y: 660, opacity: 0 }, dur: 1800, wait: true },
            { hud: 'clear' },
            { hud: 'box', id: 'followers', x: 1200, y: 300, w: 250, h: 80, label: 'FOLLOWERS: 0' },
            { wait: 1200 },
            { tween: 'nudge', to: { x: 1320, opacity: 0 }, dur: 1900, wait: true },
        ] },
    ];
    C['tribunal-verdict'] = {
        title: 'The Tribunal: the prosecutor\'s gamble',
        steps: [
            { ambience: 'scene/tribunal' },
            { shot: 'the-verdict', fade: 1200, camera: { x: 800, y: 450, zoom: 1 }, layers: courtAisle },
            { wait: 1000 },
            { hud: 'box', id: 'exhibit-label', x: 630, y: 590, w: 240, h: 190, label: 'EXHIBIT A' },
            { conversation: 'ch3.trial.verdict' },
            { hud: 'box', id: 'court-label', x: 800, y: 160, w: 440, h: 105, label: 'CONTROVERSIAL',
                when: { all: [living, { flag: 'stakes.ch3', is: 2 }] } },
            { hud: 'box', id: 'court-label', x: 800, y: 160, w: 440, h: 105, label: 'RECORDING RETAINED · “…I GUESS.”',
                when: { all: [living, { flag: 'stakes.ch3', is: 3 }] } },
            { conversation: 'ch3.trial.label' },
            // Living owner gets the exhibit before Fin explains; the death branch releases it later.
            { line: 'ch3.trial.release', at: 0, when: living, during: [
                { tween: 'glass', to: { y: 365, opacity: 0.2 }, dur: 1300, wait: true },
                { tween: 'exhibit', to: { x: 835, y: 728, sy: 0.6 }, dur: 2200, wait: true },
            ] },
            { hud: 'clear' },
            { hud: 'box', id: 'fin-licence', x: 420, y: 205, w: 350, h: 100, label: 'PROSECUTOR FIN · LICENCE ACTIVE' },
            { conversation: 'ch3.trial.fin' },
            { wait: 800 }, { hud: 'clear' },
            { hud: 'box', id: 'fin-licence', x: 420, y: 205, w: 350, h: 100, label: 'FIN · UNFOLLOWED · LICENCE DELETED' },
            { line: 'ch3.trial.licence', at: 0, during: [
                { set: 'fin', art: 'cutscene/fin-tie', when: living },
            ] },
            { set: 'fin', art: 'cutscene/fin-subdued', when: living },
            { wait: 1100 },
            { hud: 'box', id: 'verdict-readout', x: 800, y: 160, w: 460, h: 100, label: 'VERDICT: EXECUTED', when: lost },
            { conversation: 'ch3.trial.algorithm' },
            { line: 'ch3.trial.cold-piece', at: 0, when: lost, during: [
                { tween: 'glass', to: { y: 365, opacity: 0.2 }, dur: 1300, wait: true },
                { tween: 'exhibit', to: { x: 1190, y: 590 }, dur: 2100, wait: true },
                { tween: 'exhibit', to: { opacity: 0 }, dur: 1000, wait: true },
            ] },
            ...livingGallery.map(s => Object.assign({}, s, { when: living })),
            { wait: 1100 }, { end: true, fade: 1300, reveal: true },
        ],
    };
    C['tribunal-empty-gallery'] = {
        title: 'The Tribunal: nobody cheering',
        steps: [
            { ambience: 'cutscene/cold-open' },
            { shot: 'the-empty-gallery', fade: 1400, camera: { x: 800, y: 450, zoom: 1 }, layers: courtGallery },
            ...signLabels,
            { hud: 'box', id: 'guilty-peak', x: 1200, y: 300, w: 250, h: 80, label: 'GUILTY: 8 / 8' },
            { line: 'ch3.trial.gallery-loss', at: 0, during: [
                { wait: 900 },
                { tween: 'juror-a', to: { opacity: 0 }, dur: 1800 },
                { tween: 'juror-b', to: { opacity: 0 }, dur: 1800 },
                { tween: 'sign-a', to: { opacity: 0 }, dur: 1800 },
                { tween: 'sign-b', to: { opacity: 0 }, dur: 1800 },
                { wait: 2000 }, { hud: 'clear' }, signLabels[2],
                { hud: 'box', id: 'followers', x: 1200, y: 300, w: 250, h: 80, label: 'FOLLOWERS: 0' },
            ] },
            { wait: 1200 }, { line: 'ch3.trial.gallery-loss', at: 1 },
            { wait: 1800 }, { end: true, fade: 1500, reveal: true },
        ],
    };
    C['tribunal-aftermath'] = {
        title: 'The Tribunal: stolen things go home', script: 'ch3.trial.win', replayLabel: 'Watch the Tribunal aftermath again',
        steps: [].concat(C['tribunal-verdict'].steps.filter(s => !s.end),
            C['tribunal-empty-gallery'].steps.filter(s => !s.end).map(s => Object.assign({}, s, { when: lost })),
            [{ end: true, fade: 1500, reveal: true }]),
    };
    // The Core makes the machine small. Decisions remain in lesson4.js between these films.
    const coreRoom = { id: 'room', art: 'scene/core-chamber', x: 800, y: 450, w: 1600, h: 900, cover: true, bright: 0.8 };
    const coreHero = { id: 'hero', art: '{avatar}/solemn', x: 1320, bottom: 730, w: 240, wFor: { mothkin: 265 }, mirror: true };
    const coreOld = { id: 'old-box', art: 'npc/algorithm/core', x: 760, bottom: 700, w: 160 };
    const coreYoung = { id: 'young-box', art: 'ui/guess-o-matic', x: 950, bottom: 700, w: 130 };
    const shellLeft = { id: 'shell-left', art: 'cutscene/colossus-shell-left', x: 605, bottom: 730, w: 310 };
    const shellRight = { id: 'shell-right', art: 'cutscene/colossus-shell-right', x: 904.5, bottom: 730, w: 289 };
    const coreCompanions = [
        { id: 'sundial', art: 'npc/sundial/idle', x: 1110, bottom: 730, w: 100, when: '!dead:sundial' },
        { id: 'kuku', art: 'npc/kuku/idle', x: 1110, bottom: 730, w: 140, when: { all: ['dead:sundial', 'arrived:sundial'] } },
    ];
    const coreOpenLayers = [Object.assign({}, coreRoom, { bright: 0.55 }),
        Object.assign({}, shellLeft, { x: 380, bright: 0.22 }),
        Object.assign({}, shellRight, { x: 1100, bright: 0.22 }),
        coreOld, coreYoung, ...coreCompanions, coreHero];
    // A whole-object close shot: the confession belongs to these two small faces. No actor is
    // cropped to obtain it; the listening traveller remains present in the surrounding wide shots.
    const coreCloseOld = Object.assign({}, coreOld, { x: 610, w: 370 });
    const coreCloseYoung = Object.assign({}, coreYoung, { x: 1030, w: 300 });
    const coreCloseLayers = [Object.assign({}, coreRoom, { bright: 0.35 }), coreCloseOld, coreCloseYoung];
    const coreQuestionLabels = [
        ['believe', 'Why do people believe you?'], ['noclicks', 'What happens if nobody clicks?'],
        ['premises', 'What are your premises?'], ['light', 'What\'s behind all that light?'],
        ['small', 'What if you\'re small?'], ['before', 'What were you before?'], ['know', 'What do you mean by "know"?'],
    ].map(([value, question]) => ({ hud: 'text', id: 'chosen-question', x: 800, y: 130, w: 780, h: 80,
        label: 'YOUR QUESTION: ' + question, compact: { columns: 1, column: 0, row: 0 },
        when: { flag: 'wonder', is: value } }));
    C['core-copy-outcome'] = {
        title: 'The Core: your shape, your colours', noteLabel: 'THE CORE',
        steps: [
            { ambience: 'scene/core-chamber' },
            { shot: 'the-last-copy', fade: 1200, camera: { x: 800, y: 450, zoom: 1 }, layers: [
                coreRoom,
                { id: 'colossus', art: 'npc/algorithm/colossus', x: 650, bottom: 730, w: 650 },
                { id: 'rift', art: 'fx/rift-6', x: 1380, y: 300, w: 270, opacity: 0.75, when: { flag: 'stakes.ch4', in: [3, 4] } },
                { id: 'copy', art: '{avatar}/idle', x: 990, bottom: 730, w: 240, wFor: { mothkin: 265 }, opacity: 0.65,
                    when: { flag: 'stakes.ch4', in: [1, 2, 3] } },
                { id: 'copy', art: '{avatar}/idle', x: 990, bottom: 730, w: 240, wFor: { mothkin: 265 },
                    when: { flag: 'stakes.ch4', is: 4 } },
                { id: 'hat', art: 'keepsake/copy-hat', x: 990, bottom: 725, w: 110, opacity: 0, glow: '{colour}',
                    when: { flag: 'stakes.ch4', is: 1 } },
                { id: 'die', art: 'keepsake/lucky-die', x: 990, bottom: 725, w: 75, opacity: 0,
                    when: { flag: 'stakes.ch4', is: 2 } },
                coreHero,
            ] },
            { wait: 900 },
            { line: 'ch4.core.copy-outcome', at: 0, when: { flag: 'stakes.ch4', is: 1 }, during: [
                { tween: 'copy', to: { opacity: 0, scale: 0.85 }, dur: 1300, wait: true },
                { tween: 'hat', to: { opacity: 1 }, dur: 1100, wait: true },
            ] },
            { line: 'ch4.core.copy-outcome', at: 0, when: { flag: 'stakes.ch4', is: 2 }, during: [
                { tween: 'copy', to: { opacity: 0, scale: 0.2 }, dur: 2100, wait: true },
                { tween: 'die', to: { opacity: 1 }, dur: 1100, wait: true },
            ] },
            { line: 'ch4.core.copy-outcome', at: 0, when: { flag: 'stakes.ch4', in: [3, 4] } },
            // Both versions finish speaking before travelling to the rift.
            { line: 'ch4.core.copy-outcome', at: 1, when: { flag: 'stakes.ch4', in: [3, 4] }, during: [
                { tween: 'copy', to: { x: 1380, y: 300, scale: 0.4, opacity: 0 }, dur: 2600, wait: true },
            ] },
            { wait: 1000 }, { end: true, fade: 1200, reveal: true },
        ],
    };
    C['core-revelation'] = {
        title: 'The Core: a box with one sequin', noteLabel: 'THE CORE',
        steps: [
            { ambience: 'scene/core-chamber' },
            { shot: 'the-shell', fade: 1200, camera: { x: 800, y: 450, zoom: 1 }, layers: [
                coreRoom, Object.assign({}, coreOld, { opacity: 0 }), shellLeft, shellRight,
                Object.assign({}, coreYoung, { x: 1280, y: 550, bottom: undefined, opacity: 0 }),
                ...coreCompanions, coreHero,
            ] },
            ...coreQuestionLabels,
            { line: 'ch4.core.shell', at: 0 },
            { line: 'ch4.core.shell', at: 1, during: [
                { tween: 'room', to: { bright: 0.55 }, dur: 2500 },
                { tween: 'shell-left', to: { x: 380, bright: 0.22 }, dur: 2500 },
                { tween: 'shell-right', to: { x: 1100, bright: 0.22 }, dur: 2500 },
                { tween: 'old-box', to: { opacity: 1 }, dur: 2100, wait: true },
            ] },
            { wait: 1400 },
            { shot: 'one-sequin', fade: 1000, camera: { x: 800, y: 450, zoom: 1 }, layers: [
                coreCloseLayers[0], coreCloseOld,
                Object.assign({}, coreCloseYoung, { x: 1250, y: 490, bottom: undefined, opacity: 0 }),
            ] },
            { conversation: 'ch4.core.small-box' },
            { line: 'ch4.core.young-box', at: 0, during: [
                { tween: 'young-box', to: { opacity: 1, x: 1030, bottom: 700 }, dur: 1900, wait: true },
            ] },
            { line: 'ch4.core.young-box', at: 1 }, { wait: 1000 },
            { line: 'ch4.core.young-box', at: 2 },
            { ambience: 'cutscene/cold-open' }, { conversation: 'ch4.core.answer' },
            { hud: 'clear' },
            { wait: 1200 }, { end: true, fade: 1300, reveal: true },
        ],
    };
    C['core-confession'] = {
        title: 'The Core: stay small for a while', noteLabel: 'THE CORE',
        steps: [
            { ambience: 'cutscene/cold-open' },
            { shot: 'no-applause', fade: 1200, camera: { x: 800, y: 450, zoom: 1 }, layers: coreCloseLayers },
            { wait: 900 }, { conversation: 'ch4.core.confession' },
            { wait: 1400 }, { end: true, fade: 1300, reveal: true },
        ],
    };
    C['core-chosen-fate'] = {
        title: 'The Core: your decision', noteLabel: 'THE CORE',
        steps: [
            { ambience: 'cutscene/cold-open' },
            { shot: 'the-small-decision', fade: 1200, camera: { x: 800, y: 450, zoom: 1 }, layers: [
                ...coreOpenLayers,
                { id: 'label-board', art: 'cutscene/court-sign', x: 760, y: 505, w: 180, opacity: 0, when: { flag: 'fate', is: 'left' } },
                { id: 'last-piece', art: SHADOW.four, x: 760, y: 665, w: 65, opacity: 0 },
                { id: 'restored-shadow', art: SHADOW.whole, x: 1160, y: 742, w: 190, sy: 0.4, opacity: 0,
                    when: { all: ['!dead:sundial', { flag: 'bargain', not: 'yes' }] } },
                { id: 'restored-shadow', art: SHADOW.half, x: 1185, y: 735, w: 100, sy: 0.4, opacity: 0,
                    when: { all: ['!dead:sundial', { flag: 'bargain', is: 'yes' }] } },
            ] },
            { wait: 700 },
            { tween: 'old-box', to: { bright: 0.12 }, dur: 1800, wait: true, when: { flag: 'fate', is: 'off' } },
            { tween: 'label-board', to: { opacity: 1 }, dur: 1400, wait: true, when: { flag: 'fate', is: 'left' } },
            { hud: 'text', id: 'honest-label', follow: 'label-board', x: 760, y: 505, w: 160, h: 65, font: 22, label: 'IT GUESSES', colour: '#413244',
                when: { flag: 'fate', is: 'left' } },
            { conversation: 'ch4.core.fate-action' },
            { tween: 'old-box', to: { x: 1250, y: 570, scale: 0.6 }, dur: 2100, wait: true,
                when: { flag: 'fate', in: ['home', 'off'] } },
            { tween: 'last-piece', to: { opacity: 1 }, dur: 1100, wait: true },
            { tween: 'last-piece', to: { x: 1160, y: 735, sy: 0.4, opacity: 0 }, dur: 2200, wait: true, when: '!dead:sundial' },
            { tween: 'restored-shadow', to: { opacity: 0.65 }, dur: 1400, wait: true, when: '!dead:sundial' },
            { conversation: 'ch4.core.last-piece', when: '!dead:sundial' },
            { line: 'ch4.core.last-piece', at: 0, when: 'dead:sundial', during: [
                { tween: 'last-piece', to: { x: 1260, y: 580 }, dur: 2100, wait: true },
            ] },
            { line: 'ch4.core.last-piece', at: 1, when: { all: ['dead:sundial', 'arrived:sundial'] } },
            { hud: 'clear' },
            { wait: 1400 }, { end: true, fade: 1500, reveal: true },
        ],
    };
    C['core-aftermath'] = {
        title: 'The Core: probably', noteLabel: 'THE CORE', script: 'ch4.core.win', replayLabel: 'Watch the Core revelation again',
        steps: [].concat(C['core-copy-outcome'].steps.filter(s => !s.end),
            [{ shot: 'the-recorded-question', fade: 900, camera: { x: 800, y: 450, zoom: 1 }, layers: [
                coreRoom, { id: 'colossus', art: 'npc/algorithm/colossus', x: 760, bottom: 730, w: 400 }, coreHero,
            ] }, { conversation: 'ch4.core.prediction' }],
            C['core-revelation'].steps.filter(s => !s.end), C['core-confession'].steps.filter(s => !s.end), C['core-chosen-fate'].steps),
    };
    // The Fair recognises a changed traveller. Story arrivals remain in finale.home, outside film data.
    const fairHome = { id: 'fair', art: 'scene/fair-restored', x: 800, y: 450, w: 1600, h: 900, cover: true };
    const homeHero = { id: 'hero', art: '{avatar}/idle', x: 1320, bottom: 730, w: 240, wFor: { mothkin: 265 }, mirror: true };
    const bareGranny = { all: ['!dead:granny', { flag: 'stakes.ch2', is: 3 }, { clock: 'ch2', gte: 8 }] };
    const shawledGranny = { all: ['!dead:granny', { not: bareGranny }] };
    const homeElder = [
        { id: 'elder', art: 'npc/granny-axiom/idle', x: 500, bottom: 730, w: 250, when: shawledGranny },
        { id: 'elder', art: 'cutscene/granny-without-shawl', x: 500, bottom: 730, w: 250, when: bareGranny },
        { id: 'elder', art: 'npc/achilles/idle', x: 500, bottom: 730, w: 130, when: { all: ['dead:granny', 'arrived:granny'] } },
    ];
    const homeCompanion = [
        { id: 'sundial', art: 'npc/sundial/idle', x: 1100, bottom: 730, w: 105, when: '!dead:sundial' },
        { id: 'kuku', art: 'npc/kuku/idle', x: 1100, bottom: 730, w: 145, when: { all: ['dead:sundial', 'arrived:sundial'] } },
    ];
    const homeNudge = { id: 'nudge', art: 'npc/nudge/idle', x: 930, bottom: 730, w: 185 };
    const copyAtHome = { flag: 'stakes.ch4', in: [3, 4] };
    const memorialDeaths = ['sequins', 'granny', 'sundial', 'pip'];
    const memorialProps = memorialDeaths.flatMap((name, i) => [
        { id: 'lantern-' + name, art: 'ui/memorial-lantern-dark', x: 470 + i * 200, bottom: 605, w: 80,
            opacity: name === 'pip' ? 0 : 1, when: 'dead:' + name },
        { id: 'candle-' + name, art: 'ui/memorial-candle', x: 470 + i * 200, bottom: 730, w: 55,
            opacity: name === 'pip' ? 0 : 1, when: 'dead:' + name },
    ]);
    const memorialLabels = memorialDeaths.map((name, i) => ({ hud: 'text', id: 'name-' + name, x: 470 + i * 200, y: 415,
        w: 175, h: 55, label: name === 'sundial' ? 'THE SUNDIAL' : name.toUpperCase(), colour: '#f6e9cf',
        compact: { columns: 2, column: i % 2, row: Math.floor(i / 2) }, when: 'dead:' + name }));
    C['fair-home-recognition'] = {
        title: 'Home: somebody was already here', noteLabel: 'THE FAIR',
        steps: [
            { ambience: 'scene/fair-restored' },
            { shot: 'home-again', fade: 1600, camera: { x: 800, y: 450, zoom: 1 }, layers: [
                fairHome, ...homeElder, ...homeCompanion,
                { id: 'chair', art: 'cutscene/fair-chair', x: 850, bottom: 710, w: 270, when: copyAtHome },
                // The whole sprite sits behind physical table furniture, rather than a crop plane.
                { id: 'copy', art: '{avatar}/idle', x: 850, bottom: 650, w: 230, wFor: { mothkin: 250 }, when: { flag: 'stakes.ch4', is: 4 } },
                { id: 'table', art: 'cutscene/fair-card-table', x: 850, bottom: 730, w: 380, when: copyAtHome },
                { id: 'flat-copy', art: 'cutscene/copy-flat-remnant', x: 900, bottom: 735, w: 215, glow: '{colour}',
                    when: { flag: 'stakes.ch4', is: 3 } },
                { id: 'copy-die', art: 'keepsake/lucky-die', x: 850, bottom: 730, w: 60, opacity: 0,
                    when: { flag: 'stakes.ch4', is: 4 } },
                homeHero,
            ] },
            { wait: 1100, when: copyAtHome }, { conversation: 'finale.home.copy-greeting' },
            { conversation: 'finale.home.copy-table' }, { conversation: 'finale.home.copy-challenge' },
            { line: 'finale.home.copy-fold', at: 0, when: { flag: 'stakes.ch4', is: 4 }, during: [
                { tween: 'copy', to: { x: 850, y: 690, scale: 0.15, opacity: 0 }, dur: 1900, wait: true },
                { tween: 'copy-die', to: { opacity: 1 }, dur: 1000, wait: true },
            ] },
            { conversation: 'finale.home.copy-flat' }, { conversation: 'finale.home.copy-echo' },
            { line: 'finale.home.copy-stopped', at: 0, when: { flag: 'stakes.ch4', is: 3 }, during: [
                { tween: 'flat-copy', to: { bright: 0.5 }, dur: 1300, wait: true },
            ] },
            { wait: 1000, when: copyAtHome }, { end: true, fade: 1300, reveal: true },
        ],
    };
    C['fair-home-memorial'] = {
        title: 'Home: the dark lanterns', noteLabel: 'THE FAIR',
        steps: [
            { ambience: null },
            { shot: 'the-lanterns', fade: 1800, camera: { x: 800, y: 450, zoom: 1 }, layers: [
                Object.assign({}, fairHome, { bright: 0.55 }),
                ...homeElder.map(l => Object.assign({}, l, { x: 220, w: l.art === 'npc/achilles/idle' ? 108 : 210 })),
                ...memorialProps, ...homeCompanion.map(l => Object.assign({}, l, { x: 1180 })),
                Object.assign({}, homeHero, { art: '{avatar}/solemn' }),
            ] },
            ...memorialLabels.filter(l => l.id !== 'name-pip'),
            { wait: 1400 }, { conversation: 'finale.home.memorial-lanterns' },
            { line: 'finale.home.memorial-pip', at: 0, when: 'dead:pip', during: [
                { tween: 'lantern-pip', to: { opacity: 1 }, dur: 1600 },
                { tween: 'candle-pip', to: { opacity: 1 }, dur: 1600 },
                memorialLabels[3],
            ] },
            { conversation: 'finale.home.memorial-names' },
            { hud: 'clear' }, { wait: 2200 }, { end: true, fade: 1600, reveal: true },
        ],
    };
    C['fair-home-shelf'] = {
        title: 'Home: it guesses', noteLabel: 'THE FAIR',
        steps: [
            { ambience: 'scene/fair-restored' },
            { shot: 'the-pattern-shelf', fade: 1600, camera: { x: 800, y: 450, zoom: 1 }, layers: [
                { id: 'shelf', art: 'scene/fair-shelf', x: 800, y: 450, w: 1600, h: 900, cover: true },
                { id: 'sequins', art: 'npc/professor-sequins/idle', x: 330, bottom: 730, w: 270, when: '!dead:sequins' },
                { id: 'tally', art: 'npc/tally/idle', x: 330, bottom: 730, w: 250, when: { all: ['dead:sequins', 'arrived:sequins'] } },
                { id: 'young-box', art: 'ui/guess-o-matic', x: 650, bottom: 440, w: 135 },
                { id: 'old-box', art: 'npc/algorithm/core', x: 850, bottom: 440, w: 135, when: { flag: 'fate', is: 'home' } },
                { id: 'covered-box', art: 'cutscene/core-covered', x: 850, bottom: 440, w: 135, when: { flag: 'fate', is: 'off' } },
                { id: 'honest-sign', art: 'cutscene/court-sign', x: 650, y: 505, w: 160 },
                homeNudge, ...homeCompanion, homeHero,
            ] },
            { hud: 'text', id: 'young-label', follow: 'honest-sign', x: 650, y: 505, w: 140, h: 65, font: 22,
                label: 'IT GUESSES', colour: '#413244' },
            { conversation: 'finale.home.shelf-boxes' }, { conversation: 'finale.home.shelf-nudge' },
            { line: 'finale.home.nuts', at: 0, during: [
                { hud: 'text', id: 'nuts-claim', x: 1000, y: 135, w: 720, h: 120,
                    label: 'BEST NUTS IN THE WORLD! EVERYONE SAYS SO!', colour: '#ffdb9c',
                    compact: { columns: 1, column: 0, row: 0 } },
                { tween: 'nudge', to: { x: 1000 }, dur: 1600, wait: true },
            ] },
            { conversation: 'finale.home.new-word' },
            { hud: 'clear' }, { wait: 1200 }, { end: true, fade: 1300, reveal: true },
        ],
    };
    const homeSunLayers = [Object.assign({}, fairHome, { bright: 0.7 }), ...homeElder, homeNudge, homeHero,
        { id: 'sundial', art: 'npc/sundial/idle', x: 1100, bottom: 730, w: 105, when: '!dead:sundial' },
        { id: 'silent-stone', art: 'cutscene/sundial-silent', x: 1100, bottom: 730, w: 105, when: 'dead:sundial' },
        { id: 'kuku', art: 'npc/kuku/idle', x: 730, bottom: 730, w: 145, when: { all: ['dead:sundial', 'arrived:sundial'] } },
        ...[false, true].flatMap(dead => [
            { id: 'shadow', art: SHADOW.whole, x: dead ? 1100 : 1150, y: dead ? 675 : 742, w: dead ? 75 : 190, sy: dead ? 0.65 : 0.4,
                opacity: 0, when: { all: [dead ? 'dead:sundial' : '!dead:sundial', { flag: 'bargain', not: 'yes' }] } },
            { id: 'shadow', art: SHADOW.half, x: dead ? 1100 : 1180, y: dead ? 675 : 735, w: dead ? 65 : 100, sy: dead ? 0.65 : 0.4,
                opacity: 0, when: { all: [dead ? 'dead:sundial' : '!dead:sundial', { flag: 'bargain', is: 'yes' }] } },
        ]),
        { id: 'sky-hair', art: 'cutscene/sky-crack', x: 1020, y: 150, w: 230, opacity: 0, bright: 0.35, when: { flag: 'feed', gte: 6 } },
    ];
    const trophyElder = [
        { id: 'elder', art: 'cutscene/granny-trophy', x: 500, bottom: 730, w: 260, when: shawledGranny },
        { id: 'elder', art: 'cutscene/granny-bare-trophy', x: 500, bottom: 730, w: 260, when: bareGranny },
        { id: 'elder', art: 'cutscene/achilles-trophy', x: 500, bottom: 730, w: 210, when: { all: ['dead:granny', 'arrived:granny'] } },
    ];
    const homeTrophyLayers = homeSunLayers.filter(l => l.id !== 'elder').map(l => Object.assign({}, l,
        l.id === 'fair' ? { bright: 1 } : l.id === 'shadow' ? { x: l.y === 675 ? 800 : l.art === SHADOW.half ? 880 : 850, opacity: l.y === 675 ? 0.45 : 0.65 }
            : l.id === 'sky-hair' ? { opacity: 0.65 } : l.id === 'nudge' ? { x: 450 }
                : l.id === 'kuku' ? { x: 650 } : ['sundial', 'silent-stone'].includes(l.id) ? { x: 800 } : {}))
        .concat(trophyElder.map(l => Object.assign({}, l, { x: 1020 })));
    C['fair-home-probably'] = {
        title: 'Home: probably', noteLabel: 'THE FAIR',
        steps: [
            { ambience: 'scene/fair-restored' },
            { shot: 'a-place-in-the-sun', fade: 1500, camera: { x: 800, y: 450, zoom: 1 }, layers: homeSunLayers },
            { set: 'shadow', x: 780, y: 560, when: { all: ['dead:sundial', 'arrived:sundial'] } },
            { line: 'finale.home.sunlight', at: 0, during: [
                { tween: 'fair', to: { bright: 1 }, dur: 2200 },
                { tween: 'shadow', to: { opacity: 0.65 }, dur: 2400, wait: true, when: '!dead:sundial' },
                { tween: 'shadow', to: { x: 1100, y: 675, opacity: 0.45 }, dur: 2400, wait: true, when: 'dead:sundial' },
            ] },
            { line: 'finale.home.sunlight', at: 1, when: { all: ['dead:sundial', 'arrived:sundial'] } },
            { tween: 'sky-hair', to: { opacity: 0.65 }, dur: 1600, wait: true, when: { flag: 'feed', gte: 6 } },
            { conversation: 'finale.home.sky-hair' },
            { shot: 'the-thinking-trophy', fade: 1300, camera: { x: 800, y: 450, zoom: 1 }, layers: homeTrophyLayers },
            { conversation: 'finale.home.trophy' },
            { ambience: null },
            { conversation: 'finale.home.probably' },
            { wait: 1800 }, { conversation: 'finale.home.reply' },
            { line: 'finale.home.applause', at: 0, during: [
                { set: 'nudge', art: 'cutscene/nudge-clap', h: 266, y: 597 },
                { sfx: 'single-clap', volume: 0.45 }, { wait: 900 },
                { sfx: 'fair-applause', volume: 0.4 }, { wait: 4600 },
            ] },
            { ambience: 'scene/fair-restored' }, { conversation: 'finale.home.last-words' },
            { conversation: 'finale.home.end' },
            { hud: 'clear' }, { wait: 1600 }, { end: true, fade: 1800, reveal: true },
        ],
    };
    const anyMemorial = { any: memorialDeaths.map(name => 'dead:' + name) };
    C['fair-homecoming'] = {
        title: 'The Fair: probably', noteLabel: 'THE FAIR', script: 'finale.home', replayLabel: 'Watch the homecoming again',
        // Arrival mutations and their regular portrait lines remain outside this read-only replay.
        steps: [].concat(C['fair-home-recognition'].steps.filter(s => !s.end),
            C['fair-home-memorial'].steps.filter(s => !s.end).map(s => Object.assign({}, s, {
                when: s.when === undefined ? anyMemorial : { all: [anyMemorial, s.when] },
            })), C['fair-home-shelf'].steps.filter(s => !s.end), C['fair-home-probably'].steps),
    };
})(typeof window !== 'undefined' ? window : globalThis);
