/*
 * Cutscenes as data, played by js/ui/cutscene.js (issue #65). The stage is 1600 × 900 world
 * pixels; x and y are the centre of a layer or HUD box unless `bottom` gives its lower edge.
 *
 * Steps run in order. A step waits only when it says so (`wait: true`), except `say`, which
 * always waits for its voice line (and a fair reading time), so the film fits the recording.
 *
 *   { shot, bg, camera: { x, y, zoom }, layers: [...], fade }   a new shot (cross-fade in ms, 0 = cut)
 *   layer: { id, art, x, y | bottom, w, h?, depth, cover, opacity, scale, sy, clipY, glow, wFor }
 *   { camera: { x, y, zoom }, dur, ease, wait }                  move the camera of the current shot
 *   { tween: '<layer id>', to: { opacity, x, y | bottom, scale, sy, bright }, dur, ease, wait }
 *   { set: '<layer id>', ...props }                               change a layer now (art swaps too)
 *   { say: '<speaker>', t: '<the scripted line>', during: [steps] }   voice + subtitle; `during` runs alongside
 *   { wait: ms }   { sfx: '<name>' }   { ambience: '<art id in data/ambience.js>' }
 *   { fx: 'flicker' | 'flash' | 'bolt' }   one-off light effects; Calm motion leaves them out
 *   { hud: 'box' | 'glyphs' | 'sweep' | 'meter' | 'clear', ... }   the Algorithm's targeting HUD
 *   { title: 'Rift of Reason', logo: 'ui/logo' }   the title card;   { end: true, fade }
 *
 * Player tokens, filled in for the person watching: {avatar} → avatar/<type>-<variant>,
 * {name} → nickname, {NAME} → NICKNAME, {colour} → the avatar's Way of Knowing colour.
 * Every `say` line must be a line that is already recorded (same speaker and words as the
 * script), because Rift.voiceId keys the MP3 by speaker + text.
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
            // An ordinary, quiet morning. Give its small world time to feel safe before
            // revealing the enormous watcher on the other side of the hairline crack.
            { ambience: 'scene/fair' },
            { shot: 'morning', bg: '#14121f', camera: { x: 800, y: 450, zoom: 1 }, layers: VILLAGE },
            { camera: { x: 800, y: 470, zoom: 1.06 }, dur: 6500, ease: 'inOut', wait: true },
            { wait: 1500 },
            // Somewhere beyond the village's time: a projection, not its later physical form.
            { ambience: 'cutscene/cold-open' },
            { shot: 'watcher', bg: '#05040a', fade: 1100, camera: { x: 800, y: 450, zoom: 1 }, layers: [
                { id: 'servers', art: 'scene/server-hall', x: 800, y: 450, w: 1600, h: 900, depth: 0.6, cover: true, bright: 0.58 },
                { id: 'watcher', art: 'npc/algorithm/speaking', x: 800, bottom: 850, w: 380, opacity: 0, depth: 1.1, glow: '#3fe0d0' },
            ] },
            { tween: 'watcher', to: { opacity: 0.85 }, dur: 2600, ease: 'inOut' },
            { camera: { x: 800, y: 430, zoom: 1.12 }, dur: 5500, ease: 'inOut', wait: true },
            // The same watcher looks through the hairline into the ordinary morning.
            { shot: 'void', bg: '#05040a', fade: 1200, camera: { x: 800, y: 450, zoom: 1 }, layers: [
                { id: 'eye', art: 'npc/algorithm/sky-eye', x: 800, y: 440, w: 640, opacity: 0, sy: 0.04, glow: '#5fe8ff' },
            ] },
            { wait: 900 },
            { sfx: 'fate-warp' },
            { tween: 'eye', to: { opacity: 1, sy: 1 }, dur: 1400, ease: 'out', wait: true },
            { camera: { x: 800, y: 450, zoom: 1.12 }, dur: 2600, ease: 'inOut' },
            { wait: 3000 },
            // It looks closer: we fall into the eye.
            { tween: 'eye', to: { scale: 1.9, opacity: 0 }, dur: 900, ease: 'in' },
            { wait: 500 },

            // 2. Through the crack. Seen from the Algorithm's side, the hairline flickers.
            { shot: 'crack', bg: '#07050f', fade: 500, camera: { x: 800, y: 450, zoom: 1 }, layers: [
                { id: 'gap', art: 'cutscene/sky-crack', x: 800, y: 450, w: 1150, opacity: 1, glow: '#5fe8ff' },
            ] },
            { wait: 900 },
            { fx: 'flicker', target: 'gap', times: 3, seed: 'crack' },
            { wait: 500 },
            { sfx: 'rift' },
            { camera: { x: 900, y: 474, zoom: 6 }, dur: 1700, ease: 'in' },
            { wait: 1150 },
            { fx: 'flash', dur: 700 },
            // The sleeping village at dawn, from high in the sky. The crack stays a hairline.
            { shot: 'village', bg: '#14121f', fade: 450, camera: { x: 800, y: 250, zoom: 1.9 }, layers: VILLAGE },
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
            { camera: { x: 800, y: 450, zoom: 1.035 }, dur: 4500, ease: 'inOut', wait: true },
            { wait: 3000 },
            // Warm daylight and the Sundial's familiar voice carry us into conversation.
            { ambience: 'scene/fair' },
            { shot: 'daybreak', bg: '#14121f', fade: 1200, camera: { x: 800, y: 460, zoom: 1.04 }, layers: VILLAGE },
            { title: 'Rift of Reason', logo: 'ui/logo' },
            { sfx: 'splash' },
            { wait: 1600 },
            { say: 'narrator', t: 'Nine o\'clock. Roughly. Good morning, {name}.' },
            { title: false, dur: 900 },
            { say: 'narrator', t: 'I\'m the Sundial. I tell the time. Mostly. On cloudy days I guess.', during: [
                { camera: { x: 735, y: 600, zoom: 1.18 }, dur: 3600, ease: 'inOut' },
            ] },
            { end: true, fade: 350 },
        ],
    };
})(typeof window !== 'undefined' ? window : globalThis);
