/* Ephemeral bench: never load, replace or persist the player's adventure. */
(function () {
    'use strict';
    Rift.storage = () => null;
    Rift.Audio = { sfx() {} };
    const state = Rift.State.newGame();
    state.avatar = { type: 'owlet', variant: 'boy', nickname: 'Bonus QA' };
    const el = (...a) => Rift.el(...a);
    Rift.Screens.register('map', { mount(node) {
        node.append(el('div.panel', { style: { margin: '20px' } }, [el('h1', { text: 'Bonus bench — temporary save' }),
            el('p', { text: 'XP: ' + Rift.State.get().xp + ' · Charms: ' + Rift.State.get().items.charm }),
            ...['blackbox', 'mines'].map(id => el('button.btn', { text: id === 'blackbox' ? 'Black Box' : 'Mines', onclick: () => Rift.Router.replace('bonus', { nodeId: 'bonus-' + id }) })),
        ]));
    } });
    Rift.Screens.register('collection', { mount() { Rift.Router.replace('map'); } });
    Rift.Screens.register('settings', { mount() { Rift.Router.replace('map'); } });
    const id = new URLSearchParams(location.search).get('id');
    if (['blackbox', 'mines'].includes(id)) Rift.Router.replace('bonus', { nodeId: 'bonus-' + id });
    else Rift.Router.replace('map');
})();
