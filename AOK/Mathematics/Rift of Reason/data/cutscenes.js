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
})(typeof window !== 'undefined' ? window : globalThis);
