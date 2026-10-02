// Size caps per asset class, and how ids become file names under assets/.

export const QUALITY = 82;
export const SMALL_QUALITY = 76;

// maxW / maxH in px; images are only ever shrunk, never enlarged.
export const CLASSES = {
    sprite: { maxH: 620 },
    bust: { maxH: 240 },
    item: { maxW: 160, maxH: 160 },
    icon: { maxW: 160, maxH: 160 },
    card: { maxH: 500 },
    prop: { maxW: 600, maxH: 600 },
    panel: { maxW: 1000, maxH: 1000 },
    fx: { maxW: 800, maxH: 800 },
    logo: { maxW: 1200, maxH: 600 },
    scene: { maxW: 1600, smallW: 800 },
};

const FULL_BODY = new Set(['idle', 'attack', 'walk', 'sky-eye', 'speaking', 'masked', 'unmasked']);

export function classify(id) {
    const [kind, name = '', pose = ''] = id.split('/');
    if (kind === 'scene') return 'scene';
    if (kind === 'fx') return 'fx';
    if (kind === 'item') return 'item';
    if (kind === 'avatar' || kind === 'creature' || kind === 'npc') {
        return !pose || FULL_BODY.has(pose) ? 'sprite' : 'bust';
    }
    if (kind === 'ui') {
        if (name === 'logo') return 'logo';
        if (name.startsWith('card-')) return 'card';
        if (/^(icon|heart|scar|tile|token|chalk)/.test(name)) return 'icon';
        if (/^(door|venn|slate)/.test(name)) return 'prop';
        return 'panel';
    }
    return 'prop';
}

const FOLDERS = { avatar: 'avatars', creature: 'creatures', npc: 'cast', scene: 'scenes', item: 'items', ui: 'ui', fx: 'fx' };

// 'avatar/owlet-boy/idle' -> 'avatars/owlet-boy-idle.webp'
export function fileFor(id, suffix = '') {
    const [kind, ...rest] = id.split('/');
    const folder = FOLDERS[kind] || kind;
    return `${folder}/${rest.join('-')}${suffix}.webp`;
}

export const OUTPUT_FOLDERS = Object.values(FOLDERS);
