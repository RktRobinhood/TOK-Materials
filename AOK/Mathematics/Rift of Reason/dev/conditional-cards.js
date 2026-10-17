/* #149 playable study definitions. Loaded only by the battle bench, never index.html,
 * collection, rewards or imports. Fifteen implementable cards (five added for #148 step 1); the other eight remain drafts.
 */
(function (root) {
    'use strict';
    if (root.location && !new URLSearchParams(root.location.search).has('conditional')) return;
    const R = root.Rift, prefix = 'conditional-';
    const options = (events, actor) => events.map(event => ({ key: event + ':' + actor, event, actor,
        label: (actor === 'self' ? 'After you' : actor === 'opponent' ? 'After the opponent' : 'After either player')
            + ({ 'spell-played': ' plays a spell', 'creature-played': ' plays a creature', 'axiom-replaced': ' changes an Axiom', 'creature-defeated': ' loses a creature', 'attack-declared': ' declares an attack' })[event] }));
    const mostDamaged = (api, p) => api.s.players[p].board.slice().sort((a, b) => api.s.cards[b].damage - api.s.cards[a].damage)[0];
    function spell(suffix, name, colour, cost, events, actor, visibility, text, run) {
        const id = prefix + suffix;
        R.data.tactics[id] = { name, colour: colour === 'generic' || colour === 'memory' ? null : colour, rarity: 'uncommon', cost,
            art: 'art/spell-motif-' + colour, text, short: 'Conditional · ' + text, run() {},
            conditional: { options: options(events, actor), visibility, run } };
        return id;
    }
    const ids = [
        spell('reason-exhibit-aha', 'Exhibit Aha!', 'reason', 1, ['creature-played', 'spell-played'], 'opponent', 'face-down',
            'Arm: choose enemy creature or spell play. Odd paid cost: draw 1. Even: heal your most damaged creature 1.',
            (api, p, fact) => { if (fact.paidCost % 2) api.draw(p); else { const cid = mostDamaged(api, p); if (cid) api.heal(cid, 1); } }),
        spell('emotion-tiny-drama', 'Tiny Drama', 'emotion', 1, ['creature-defeated'], 'self', 'face-down',
            'After your creature is defeated: lose 1 heart. If the battle is still active, draw 1.',
            (api, p) => { api.damage('h' + p, 1); api.checkHearts(); if (api.s.winner == null) api.draw(p); }),
        spell('emotion-group-gasp', 'Group Gasp', 'emotion', 2, ['axiom-replaced'], 'either', 'face-up',
            'After either player changes an Axiom: both heroes lose 1 heart together.',
            api => { api.damage('h0', 1); api.damage('h1', 1); }),
        spell('perception-blink-forecast', 'Blink Forecast', 'perception', 1, ['creature-played', 'spell-played'], 'self', 'face-up',
            'Arm: choose your creature or spell play. Reveal your top card. Creature: heal hero 1. Spell: heal your most damaged creature 1.',
            (api, p) => { const cid = api.s.players[p].deck[0]; if (!cid) return;
                api.emit({ t: 'forecast', cid, text: api.cardName(cid) + ' is revealed on top of the personal deck.' });
                const knows = api.s.players[1 - p].knows; if (!knows.includes(cid)) knows.push(cid);
                if (api.s.cards[cid].kind === 'creature') api.healHero(p, 1); else { const target = mostDamaged(api, p); if (target) api.heal(target, 1); } }),
        spell('language-footnote-trap', 'Footnote, Please', 'language', 1, ['axiom-replaced'], 'opponent', 'face-up',
            'After the opponent changes an Axiom: heal your most damaged creature 1 and their hero 1.',
            (api, p) => { const cid = mostDamaged(api, p); if (cid) api.heal(cid, 1); api.healHero(1 - p, 1); }),
        spell('generic-queue-please', 'Queue, Please', 'generic', 1, ['spell-played'], 'either', 'face-up',
            'After either player plays a spell: each personal deck moves its top card to the bottom without looking.',
            api => api.s.players.forEach(P => { if (P.deck.length > 1) P.deck.push(P.deck.shift()); })),
        spell('generic-refreshments', 'Round of Refreshments', 'generic', 1, ['axiom-replaced'], 'either', 'face-up',
            'After either player changes an Axiom: heal both heroes 1. A finished battle stays finished.',
            api => { api.healHero(0, 1); api.healHero(1, 1); }),
        spell('generic-tiny-windfall', 'Tiny Windfall', 'generic', 1, ['spell-played'], 'either', 'face-down',
            'After either player plays a spell: the active player gains 1 energy this turn, up to 10.',
            api => { const P = api.s.players[api.s.active]; P.energy = Math.min(10, P.energy + 1); }),
        // #148 step 1: effects with a lifetime (until a controller's next turn ends or starts).
        spell('reason-premise-pending', 'Premise Pending', 'reason', 1, ['creature-played'], 'opponent', 'face-down',
            'After the opponent plays a creature: if you have a creature and theirs has more attack than each of yours, it gets −2 attack until the end of their next turn.',
            (api, p, fact) => { const s = api.s, E = R.Battle.Engine, cid = fact.cid;
                if (!cid || !s.players[1 - p].board.includes(cid) || !s.players[p].board.length) { api.emit({ t: 'tactic', text: 'Premise Pending: no comparison to make.' }); return; }
                const big = E.attackOf(s, cid);
                if (!s.players[p].board.every(mine => big > E.attackOf(s, mine))) { api.emit({ t: 'tactic', text: 'Premise Pending: ' + api.name(cid) + ' is not the biggest. Nothing happens.' }); return; }
                api.buffNextTurn(cid, -2, 0, 'Premise Pending');
                api.emit({ t: 'tactic', text: 'Premise Pending: ' + api.name(cid) + ' gets −2 attack until the end of its controller’s next turn.' }); }),
        spell('perception-velvet-reveal', 'Velvet Reveal', 'perception', 1, ['creature-played'], 'opponent', 'face-down',
            'After the opponent plays a creature: if it is Elusive, it loses Elusive until their next turn starts.',
            (api, p, fact) => { const s = api.s, cid = fact.cid;
                if (!cid || !s.players[1 - p].board.includes(cid) || !api.keywordUntilStart(cid, 'elusive', 'lose', s.cards[cid].controller, 'Velvet Reveal')) {
                    api.emit({ t: 'tactic', text: 'Velvet Reveal: nothing to reveal.' }); return; }
                api.emit({ t: 'tactic', text: 'Velvet Reveal: ' + api.name(cid) + ' loses Elusive until its controller’s next turn starts.' }); }),
    ];
    const safe = prefix + 'memory-somewhere-safe', seat = prefix + 'generic-seat-reserved';
    R.Battle.Abilities['conditional-safe-entry'] = { name: 'Somewhere Safe', text: 'Entrance: put the just-defeated creature from your discard on the bottom of your deck.',
        entrance: { run(api, c) { const fact = c.revealFact, P = api.s.players[c.controller], cid = fact && fact.cid;
            if (!cid || api.s.cards[cid].token || !P.discard.includes(cid)) return;
            P.discard = P.discard.filter(id => id !== cid); P.deck.push(cid);
            api.emit({ t: 'recovery', cid, text: api.cardName(cid) + ' goes to the bottom of its owner’s deck. Its used condition stays used.' }); } } };
    R.data.creatures[safe] = { name: 'Keanu Reeveaver', colour: 'memory', rarity: 'uncommon', cost: 2, attack: 1, health: 2, ability: 'conditional-safe-entry',
        conditional: { visibility: 'face-down', options: options(['creature-defeated'], 'self') } };
    R.data.creatures[seat] = { name: 'Danny DeSeato', colour: 'memory', generic: true, rarity: 'uncommon', cost: 2, attack: 1, health: 3, keywords: ['guard'],
        conditional: { visibility: 'face-down', options: options(['attack-declared'], 'opponent'), matches: (s, c) => s.players[c.controller].board.length === 0 } };
    // #148 step 1: masked creatures whose Entrance lasts until a player's next turn starts.
    const ovation = prefix + 'emotion-standing-ovation', chair = prefix + 'language-chair-recognises', umbrella = prefix + 'generic-spare-umbrella';
    const entry = (id, name, text, run) => { R.Battle.Abilities[id] = { name, text: 'Entrance: ' + text, entrance: { run } }; };
    entry('conditional-ovation-entry', 'Standing Ovation', 'your creatures get +1 attack until your next turn starts.', (api, c) => {
        const mine = api.s.players[c.controller].board.slice();
        mine.forEach(cid => api.buffUntilStart(cid, 1, 0, 'Standing Ovation', c.controller));
        api.emit({ t: 'ability', cid: c.cid, text: 'Standing Ovation: ' + mine.length + ' creature' + (mine.length === 1 ? '' : 's') + ' get +1 attack until your next turn starts.' });
    });
    entry('conditional-chair-entry', 'The Chair Recognises You', 'the creature that was just played gains Guard until its controller’s next turn starts (no second Guard).', (api, c) => {
        const s = api.s, cid = c.revealFact && c.revealFact.cid, card = cid && s.cards[cid];
        if (!card || !s.players[card.controller].board.includes(cid)) { api.emit({ t: 'ability', cid: c.cid, text: 'The Chair Recognises You: that creature has left.' }); return; }
        const gave = api.keywordUntilStart(cid, 'guard', 'gain', card.controller, 'The Chair Recognises You');
        api.emit({ t: 'ability', cid: c.cid, text: 'The Chair Recognises You: ' + api.name(cid) + (gave ? ' gains Guard until its controller’s next turn starts.' : ' already has Guard.') });
    });
    entry('conditional-umbrella-entry', 'Spare Umbrella', 'your creature with the least health left gains Shield until your next turn starts (oldest first on a tie).', (api, c) => {
        const s = api.s, E = R.Battle.Engine, board = s.players[c.controller].board;
        let pick = null;
        board.forEach(cid => { if (pick == null || E.healthOf(s, cid).current < E.healthOf(s, pick).current) pick = cid; });   // board order = arrival order
        const gave = pick && api.keywordUntilStart(pick, 'shield', 'gain', c.controller, 'Spare Umbrella');
        api.emit({ t: 'ability', cid: c.cid, text: 'Spare Umbrella: ' + (!pick ? 'no creature to cover.' : api.name(pick) + (gave ? ' gains Shield until your next turn starts.' : ' already has a Shield.')) });
    });
    R.data.creatures[ovation] = { name: 'Shia LaBeef', colour: 'emotion', rarity: 'uncommon', cost: 2, attack: 1, health: 2, ability: 'conditional-ovation-entry',
        conditional: { visibility: 'face-down', options: options(['spell-played'], 'opponent') } };
    R.data.creatures[chair] = { name: 'Morgan Freemantis', colour: 'language', rarity: 'uncommon', cost: 2, attack: 1, health: 2, ability: 'conditional-chair-entry',
        conditional: { visibility: 'face-up', options: options(['creature-played'], 'self').concat(options(['creature-played'], 'opponent')) } };
    R.data.creatures[umbrella] = { name: 'Tom Holland-er', colour: 'memory', generic: true, rarity: 'uncommon', cost: 2, attack: 1, health: 2, ability: 'conditional-umbrella-entry',
        conditional: { visibility: 'face-up', options: options(['spell-played'], 'self') } };
    const creatures = [safe, seat, ovation, chair, umbrella];
    R.ConditionalStudy = { spells: ids, creatures, ids: ids.concat(creatures) };
})(typeof window !== 'undefined' ? window : globalThis);
