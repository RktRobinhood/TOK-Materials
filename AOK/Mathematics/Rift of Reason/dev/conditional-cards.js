/* #149 playable study definitions. Loaded only by the battle bench, never index.html,
 * collection, rewards or imports. Ten implementable cards; the other thirteen remain drafts.
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
    R.ConditionalStudy = { spells: ids, creatures: [safe, seat], ids: ids.concat([safe, seat]) };
})(typeof window !== 'undefined' ? window : globalThis);
