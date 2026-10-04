/*
 * Sound effect names → files in assets/sfx (Kenney CC0, see assets/CREDITS.md).
 * A name with several files picks one at random. Never synthesize beeps.
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
        rift: ['rift.wav'],
        door: ['door.wav'],
        open: ['open.wav'],
        close: ['close.wav'],
        step: ['step1.wav', 'step2.wav'],
        throw: ['throw.wav'],
        wobble: ['dial.wav'],
        caught: ['victory.wav'],
        escape: ['shatter.wav'],
        jingle: ['sigil.wav'],
        count: ['count.wav'],
        // battle screen
        'card-play': ['tile.wav'],
        steal: ['creak.wav'],
        hit: ['clunk.wav'],
        defeat: ['shatter.wav'],
        block: ['block.wav'],
        'fate-fine': ['unlock.wav'],
        'fate-scarred': ['cloth.wav'],
        'fate-injured': ['clunk.wav'],
        'fate-warp': ['rift.wav'],
        'fate-death': ['shatter.wav'],
        axiom: ['page1.wav', 'page2.wav'],
        win: ['victory.wav'],
        lose: ['loss.wav'],
    };
})(typeof window !== 'undefined' ? window : globalThis);
