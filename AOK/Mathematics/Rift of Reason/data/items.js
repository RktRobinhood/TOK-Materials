/*
 * Items (Pokémon/Pokémon Go-like, our own names) and player scars.
 * Art ids: 'item/<id>'.
 */
(function (root) {
    'use strict';
    const Rift = root.Rift;

    Rift.data.items = {
        charm: { name: 'Catch Charm', kind: 'catch', catchBonus: 0, text: 'A woven charm. Use it to catch a creature after solving a puzzle.' },
        greatcharm: { name: 'Great Charm', kind: 'catch', catchBonus: 0.2, text: 'A golden charm with a gem: +20% catch odds.' },
        lure: { name: 'Lure Lantern', kind: 'support', text: 'Light it at a node: rare creatures become more likely for your next 3 visits; catch odds gain 5 points.' },
        tonic: { name: 'Tonic', kind: 'support', heal: 2, text: 'Restores 2 health.' },
        ward: { name: 'Ward', kind: 'battle', text: 'Cancels one bad fate roll after a battle.' },
        mending: { name: 'Mending', kind: 'support', text: 'Use in the Bag: restore one lost ability or one lost attack point on a creature.' },
        anchor: { name: 'Anchor', kind: 'battle', text: 'Stops a creature being warp-cursed in one battle.' },
        'trick-book': { name: 'Trick Book', kind: 'support', text: 'Use in the Bag or Collection: teach one creature a trick for card battles.' },
        // Battle consumables earned from puzzles: chosen before a real battle, used up when it starts.
        'trickster-coin': { name: 'Trickster Coin', kind: 'battle', consumable: 'extra-energy', text: 'Bring it into a battle for +1 energy each turn.' },
        heartstone: { name: 'Heartstone', kind: 'battle', consumable: 'extra-life', text: 'Bring it into a battle to start with +2 hearts.' },
    };

    // Trick Book tricks (stored as creature.taught; one per creature). Art: 'ui/trait-<id>' for keywords.
    Rift.data.tricks = {
        guard: { name: 'Guard', text: 'Enemies must attack it first.' },
        swift: { name: 'Swift', text: 'It can attack on the turn it arrives.' },
        shield: { name: 'Shield', text: 'It ignores the first damage it takes.' },
        attack: { name: '+1 attack', text: 'It hits 1 harder.' },
        health: { name: '+1 health', text: 'It can take 1 more damage.' },
    };
    // Natural traits from creature variation (about one creature in eight has one).
    Rift.data.traits = {
        guard: { name: 'Natural Guard', text: 'Enemies must attack it first.' },
        swift: { name: 'Natural Swift', text: 'It can attack on the turn it arrives.' },
        shield: { name: 'Natural Shield', text: 'It ignores the first damage it takes.' },
        sturdy: { name: 'Sturdy', text: '+1 health.' },
    };

    // Player scars: consequences that make the run harder until removed at a shrine.
    Rift.data.scars = {
        'fogged-eye': { name: 'Fogged Eye', icon: '👁️‍🗨️', text: 'One clue in each puzzle starts hidden.' },
        'shaky-hand': { name: 'Shaky Hand', icon: '✋', text: 'Hints cost 2 health instead of 1.' },
        'heavy-heart': { name: 'Heavy Heart', icon: '💔', text: 'Max health is 1 lower.' },
    };
})(typeof window !== 'undefined' ? window : globalThis);
