/*
 * Items (Pokémon/Pokémon Go-like, our own names) and player scars.
 * Art ids: 'item/<id>'.
 *
 * `battle` (optional): the item's second job in a card battle (the Bag, design/card-arena-expansion-2026-10-07.md §3).
 * Bring up to two into a real battle; use one per main phase; it is used up only when used.
 *   cost                energy to use
 *   target?, filter?    target spec and filter, as for tactics (js/battle/abilities.js)
 *   text                one short line for the Bag tray
 *   usable?(s, p, H)    false → not offered (it would do nothing); why? says so in the tray
 *   noTarget?           tray note when no target fits
 *   run(api, p, target) the effect (the same api as tactics)
 */
(function (root) {
    'use strict';
    const Rift = root.Rift;

    Rift.data.items = {
        charm: { name: 'Catch Charm', kind: 'catch', catchBonus: 0, text: 'A woven charm. Use it to catch a creature after solving a puzzle.', battle: {
            cost: 1, target: 'enemy-creature', filter: (s, cid, H) => H.health(s, cid) <= 2 && !s.cards[cid].frozen,
            text: "An enemy creature with 2 or less health can't attack on its next turn.",
            noTarget: 'You need an enemy creature with 2 or less health.',
            run(api, p, target) { api.freeze(target); api.emit({ t: 'item', text: 'Catch Charm: ' + api.name(target) + " can't attack next turn." }); },
        } },
        greatcharm: { name: 'Great Charm', kind: 'catch', catchBonus: 0.2, text: 'A golden charm with a gem: +20% catch odds.', battle: {
            cost: 1, target: 'enemy-creature', filter: (s, cid) => !s.cards[cid].frozen,
            text: "An enemy creature can't attack on its next turn.",
            noTarget: 'You need an enemy creature to aim at.',
            run(api, p, target) { api.freeze(target); api.emit({ t: 'item', text: 'Great Charm: ' + api.name(target) + " can't attack next turn." }); },
        } },
        lure: { name: 'Lure Lantern', kind: 'support', text: 'Light it at a node: rare creatures become more likely for your next 3 visits; catch odds gain 5 points.', battle: {
            cost: 1, text: 'Draw a card from your deck.',
            usable: (s, p, H) => s.players[p].deck.length > 0 && H.handRoom(s, p, 1),
            why: (s, p) => (s.players[p].deck.length ? 'Your hand is full.' : 'Your deck is empty.'),
            // Announce first so the log reads in order before the private "You draw…" line.
            run(api, p) { api.emit({ t: 'item', text: 'Lure Lantern: draw a card.' }); api.draw(p); },
        } },
        // The Gate reward for saving Professor Sequins (STORY.md Ch1, tiers 1–2): a stronger lure.
        'lucky-sequin': { name: 'Lucky Sequin', kind: 'support', lure: 5, text: 'One of Professor Sequins’ own sequins. Hold it up at a node: rare creatures become more likely for your next 5 visits; catch odds gain 5 points.' },
        tonic: { name: 'Tonic', kind: 'support', heal: 2, text: 'Restores 2 health.', battle: {
            cost: 1, text: 'Restore 2 hearts to your hero.',
            usable: (s, p) => s.players[p].hearts < s.players[p].maxHearts,
            why: 'Your hearts are full.',
            run(api, p) {
                const P = api.s.players[p], before = P.hearts;
                api.healHero(p, 2);
                api.emit({ t: 'item', text: 'Tonic: +' + (P.hearts - before) + ' heart' + (P.hearts - before === 1 ? '' : 's') + ' (' + P.hearts + ' now).' });
            },
        } },
        ward: { name: 'Ward', kind: 'battle', text: 'Cancels one bad fate roll after a battle.', battle: {
            cost: 1, target: 'friendly-creature', filter: (s, cid, H) => !H.hasKeyword(s, cid, 'shield'),
            text: 'A friendly creature gets Shield.',
            noTarget: 'You need a creature of yours without Shield.',
            run(api, p, target) { api.addKeyword(target, 'shield'); api.emit({ t: 'item', text: 'Ward: ' + api.name(target) + ' gets Shield.' }); },
        } },
        mending: { name: 'Mending', kind: 'support', text: 'Use in the Bag: restore one lost ability or one lost attack point on a creature.', battle: {
            cost: 1, target: 'friendly-creature', filter: (s, cid) => s.cards[cid].damage > 0,
            text: 'Fully heal a friendly creature.',
            noTarget: 'You need a damaged creature of yours.',
            run(api, p, target) { api.heal(target, api.s.cards[target].damage); api.emit({ t: 'item', text: 'Mending: ' + api.name(target) + ' is fully healed.' }); },
        } },
        anchor: { name: 'Anchor', kind: 'battle', text: 'Stops a creature being warp-cursed in one battle.', battle: {
            cost: 0, text: "The Fate track doesn't move at the end of this turn.",
            usable: s => !!s.options.timeline,
            why: 'There is no Fate track in this match.',
            run(api) { api.s.fate.anchorTurn = api.s.turn; api.emit({ t: 'item', text: 'Anchor: the Fate track will not move at the end of this turn.' }); },
        } },
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
