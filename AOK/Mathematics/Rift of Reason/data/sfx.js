/*
 * Sound effect names → files in assets/sfx (Kenney CC0, see assets/CREDITS.md).
 * A name with several files picks one at random. Never synthesize beeps.
 * TODO (#24): footsteps, throw whoosh and a rift swell from Kenney's RPG Audio pack.
 */
(function (root) {
    'use strict';
    root.Rift.data.sfx = {
        click: ['tap.wav'],
        place: ['tile.wav'],
        error: ['wrong.wav'],
        success: ['correct.wav'],
        hint: ['notify.wav'],
        hurt: ['clunk.wav'],
        heal: ['unlock.wav'],
        reveal: ['page1.wav', 'page2.wav'],
        rift: ['creak.wav'],
        door: ['door.wav'],
        open: ['open.wav'],
        close: ['close.wav'],
        step: ['tick.wav'],
        throw: ['back.wav'],
        wobble: ['dial.wav'],
        caught: ['victory.wav'],
        escape: ['shatter.wav'],
        jingle: ['sigil.wav'],
        count: ['count.wav'],
    };
})(typeof window !== 'undefined' ? window : globalThis);
