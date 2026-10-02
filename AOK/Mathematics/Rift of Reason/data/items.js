/*
 * Items (Pokémon/Pokémon Go-like, our own names) and player scars.
 * Art ids: 'item/<id>'.
 */
(function (root) {
    'use strict';
    const Rift = root.Rift;

    Rift.data.items = {
        charm: { name: 'Catch Charm', kind: 'catch', catchBonus: 0, text: 'A woven charm. Throw it to catch a beaten caricature.' },
        greatcharm: { name: 'Great Charm', kind: 'catch', catchBonus: 0.2, text: 'A golden charm with a gem: +20% catch odds.' },
        lure: { name: 'Lure Lantern', kind: 'support', text: 'Light it at a node: rare spawns are twice as likely there for your next 3 visits.' },
        tonic: { name: 'Tonic', kind: 'support', heal: 2, text: 'Restores 2 health.' },
        ward: { name: 'Ward', kind: 'battle', text: 'Cancels one bad fate roll after a battle.' },
        mending: { name: 'Mending', kind: 'support', text: 'Heals one injury on a creature.' },
        anchor: { name: 'Anchor', kind: 'battle', text: 'Stops a creature being warp-cursed in one battle.' },
        // Battle consumables earned from puzzles: chosen before a real battle, used up when it starts.
        'trickster-coin': { name: 'Trickster Coin', kind: 'battle', consumable: 'extra-steal', text: 'Bring it into a battle for one extra steal.' },
        heartstone: { name: 'Heartstone', kind: 'battle', consumable: 'extra-life', text: 'Bring it into a battle to start with one extra life.' },
    };

    // Player scars: consequences that make the run harder until removed at a shrine.
    Rift.data.scars = {
        'fogged-eye': { name: 'Fogged Eye', icon: '👁️‍🗨️', text: 'One clue in each puzzle starts hidden.' },
        'shaky-hand': { name: 'Shaky Hand', icon: '✋', text: 'Hints cost 2 health instead of 1.' },
        'heavy-heart': { name: 'Heavy Heart', icon: '💔', text: 'Max health is 1 lower.' },
    };
})(typeof window !== 'undefined' ? window : globalThis);
