/*
 * The 10 avatars: 5 creature types × boy/girl. Avatars are silent (text only).
 * Art ids: 'avatar/<type>-<variant>/idle', '.../neutral|happy|surprised|worried',
 * walk sheet 'avatar/<type>-<variant>/walk' (6 frames, facing right).
 */
(function (root) {
    'use strict';
    const Rift = root.Rift;

    Rift.data.avatars = {
        owlet: {
            name: 'Owlet', colour: 'reason',
            looks: { boy: 'long red scarf and a satchel', girl: 'teal hooded cloak and spectacles' },
            perk: { id: 'free-hint', name: 'Wise Eyes', text: 'One free hint per chapter (no health cost).' },
        },
        mothkin: {
            name: 'Moth-kin', colour: 'perception',
            looks: { boy: 'dusty-blue fur and an amber lantern', girl: 'lilac fur and a moon-white lantern' },
            perk: { id: 'lantern', name: 'Lantern', text: 'Once per chapter, light up a puzzle: one wrong option or clue is revealed.' },
        },
        fox: {
            name: 'Fox kit', colour: 'imagination',
            looks: { boy: 'green bandana', girl: 'mustard duffle coat' },
            perk: { id: 'sly', name: 'Sly Charm', text: '+10% catch odds on Language and Imagination caricatures.' },
        },
        frogling: {
            name: 'Frogling', colour: 'memory',
            looks: { boy: 'yellow raincoat', girl: 'lily-pad hat and red raincoat' },
            perk: { id: 'leap', name: 'Big Leap', text: 'Walking between nodes is free of random events, and your first wrong answer each puzzle costs no health.' },
        },
        raven: {
            name: 'Raven chick', colour: 'language',
            looks: { boy: 'oversized grey hoodie and a notebook', girl: 'purple beret and magnifying glass' },
            perk: { id: 'collector', name: 'Shiny Hoard', text: 'Bosses always drop one extra item.' },
        },
    };

    Rift.avatarArt = function (avatar, pose) {
        return 'avatar/' + avatar.type + '-' + avatar.variant + '/' + (pose || 'idle');
    };
})(typeof window !== 'undefined' ? window : globalThis);
