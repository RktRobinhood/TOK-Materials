/*
 * Creature abilities used by data/creatures.js. Pure hooks, called by the engine.
 * Ids are stable (saves store warp-cursed ability ids). See design/card-arena-2026-10-07.md.
 *
 * Definition fields (all optional except name/text):
 *   keywords: ['guard'|'swift'|'shield']   keywords this ability grants
 *   entrance: { target?, filter?, run(api, card, target) }      when played
 *   activate: { cost, target?, filter?, usable?(state, card, H), run(api, card, target) }
 *                                    paid; uses the creature's attack this turn. usable() false → not offered
 *                                    (it would certainly do nothing, e.g. an empty deck)
 *   lastWord(api, card)              when defeated; return 'hand' to go back to the hand instead
 *                                    (skipped when Mercy already returns it or the hand is full)
 *   attackMod(state, card, H)        own attack change
 *   aura(state, source, card, H)     attack bonus given to OTHER friendly creatures
 *   onTurnEnd(api, card)             at the end of its controller's turn
 *   onAttack(api, card, target)      when it attacks (before damage)
 *   onAttacked(api, card, attacker)  when an enemy creature attacks it (before damage)
 *   onSurvive(api, card, foe)        after a fight it survives
 *   onAxiomPlayed(api, card, id, p)  whenever any player plays an axiom card
 *   onEnemyPlay(api, card, played)   whenever the opponent plays a creature
 *   choose(api, card, choice, req)   answer to api.ask(...)
 *   ignoresGuard, elusive, attacksPerTurn, heroDamage, damageReduction
 *   hidden(state, card, H)           true → it can't be attacked right now
 *   ai(state, card, H)               extra value the AI sees in this creature
 *
 * Target specs: 'enemy-creature' | 'friendly-creature' | 'friendly-other' | 'any-creature'
 *               | 'enemy-any' (enemy creature or enemy hero) | 'any'. Heroes are 'h0' and 'h1'.
 *               'enemy-creature-seen': an enemy creature, Elusive ones included (Look Closer).
 */
(function (root) {
    'use strict';

    const Rift = root.Rift;
    const Battle = Rift.Battle || (Rift.Battle = {});

    const NICKNAMES = ['Sleepy', 'Low-Energy', 'Little', 'Crooked', 'Boring', 'Tiny', 'Wacky', 'Sad'];

    // Look at the top 3 cards of your deck and keep one (Pull That Up, Nature Watch).
    const discover = (id, prompt) => ({
        run(api, card) {
            const options = api.s.players[card.controller].deck.slice(0, 3);
            if (!api.ask({ player: card.controller, kind: 'card', options, prompt, source: { type: 'ability', id, cid: card.cid } })) {
                api.emit({ t: 'fizzle', cid: card.cid, text: 'Nothing left in the deck to look at.' });
            }
        },
    });
    function keepOne(api, card, chosen) {
        const P = api.s.players[card.controller];
        const top = P.deck.slice(0, 3);
        P.deck = P.deck.slice(top.length).concat(top.filter(c => c !== chosen));
        const name = api.cardName(chosen);
        if (api.toHand(card.controller, chosen, true)) {
            api.emit({ t: 'keep', player: card.controller, cid: chosen, privateTo: card.controller,
                text: 'You keep ' + name + '. The others go to the bottom of your deck.',
                publicText: api.name(card.cid) + ' picks a card from the deck.' });
        } else {
            // The discard pile is public, so both players may see the name.
            api.emit({ t: 'burn', player: card.controller, cid: chosen,
                text: 'The hand is full, so ' + name + ' is discarded. The others go to the bottom of the deck.' });
        }
    }

    const canDraw = (s, card, H) => s.players[card.controller].deck.length > 0 && H.handRoom(s, card.controller);

    const programmable = (s, card) => {
        const options = [];
        s.players[card.controller].discard.forEach(cid => {
            const other = s.cards[cid];
            if (other.kind !== 'creature' || !other.ability || !A[other.ability]) return;
            // Never copy Program itself: that would only loop.
            if (A[other.ability].program || options.includes(other.ability)) return;
            // Nor an ability it already has (gaining it again would do nothing).
            if (other.ability === card.ability || card.gained.includes(other.ability)) return;
            options.push(other.ability);
        });
        return options;
    };
    const program = id => ({
        program: true,
        activate: {
            cost: id === 'program' ? 1 : 2,
            usable: (s, card) => programmable(s, card).length > 0,
            run(api, card) {
                if (!api.ask({ player: card.controller, kind: 'ability', options: programmable(api.s, card), prompt: 'Gain which ability?', source: { type: 'ability', id, cid: card.cid } })) {
                    api.emit({ t: 'fizzle', cid: card.cid, text: api.name(card.cid) + ' finds no ability in your discard pile.' });
                }
            },
        },
        choose(api, card, ability) {
            if (!card.gained.includes(ability)) card.gained.push(ability);
            api.emit({ t: 'program', cid: card.cid, ability, text: api.name(card.cid) + ' gains ' + A[ability].name + '.' });
        },
        ai: (s, card) => (programmable(s, card).length ? 1 : 0),
    });

    // Would "loses its abilities, keywords and boosts" change anything?
    const hasSomethingToLose = c => (!c.silenced && (!!c.ability || c.baseKeywords.length > 0)) || c.gained.length > 0
        || c.extraKeywords.length > 0 || c.buffs.some(b => (b.attack || 0) > 0 || (b.health || 0) > 0);

    const returnOnce = {
        lastWord(api, card) {
            if (card.metaverseUsed) return null;
            card.metaverseUsed = true;
            return 'hand';
        },
        ai: () => 1,
    };

    const A = {
        lecture: {
            name: 'Lecture', keywords: ['guard'],
            text: 'Guard. Entrance: give an enemy creature a lecture. It can\'t attack on its next turn.',
            entrance: {
                target: 'enemy-creature',
                run(api, card, target) { api.freeze(target); api.emit({ t: 'ability', cid: card.cid, text: api.name(card.cid) + ' lectures ' + api.name(target) + '. It can\'t attack next turn.' }); },
            },
        },
        'well-actually': {
            name: 'Well, Actually',
            text: 'Activate (1 energy): draw a card.',
            activate: { cost: 1, usable: canDraw, run(api, card) { api.draw(card.controller); api.emit({ t: 'ability', cid: card.cid, text: api.name(card.cid) + ': "Well, actually…" Draw a card.' }); } },
            ai: () => 0.5,
        },
        nickname: {
            name: 'Nickname',
            text: 'Entrance: nickname an enemy creature. It gets −2 attack and loses its colour.',
            entrance: {
                target: 'enemy-creature',
                run(api, card, target) {
                    const t = api.s.cards[target];
                    const old = api.name(target);
                    t.nickname = api.rng.pick(NICKNAMES) + ' ' + api.cardName(target);
                    t.colourless = true;
                    api.buff(target, -2, 0, 'Nickname');
                    api.emit({ t: 'nickname', cid: target, text: api.name(card.cid) + ' calls ' + old + ' "' + t.nickname + '". −2 attack, no colour.' });
                },
            },
        },
        'easter-egg': {
            name: 'Easter Egg',
            text: 'Whenever anyone plays an axiom card, this gets +1/+1.',
            onAxiomPlayed(api, card) { api.buff(card.cid, 1, 1, 'Easter egg'); api.emit({ t: 'ability', cid: card.cid, text: api.name(card.cid) + ' found a hidden clue: +1/+1.' }); },
            ai: () => 0.5,
        },
        'next-year': {
            name: 'Next Year',
            text: 'Activate (1 energy): rewind the Fate track 2 spaces.',
            activate: { cost: 1, usable: s => !!s.options.timeline, run(api, card) { api.shiftFate(-2); api.emit({ t: 'ability', cid: card.cid, text: 'Next Year: the Fate track moves 2 spaces back.' }); } },
        },
        metaverse: Object.assign({ name: 'Metaverse', text: 'Last Word: return it to your hand (once per match).' }, returnOnce),
        predict: {
            name: 'Predict',
            text: 'Activate (1 energy): predict the colour of the opponent\'s next creature. If right, this gets +3/+3.',
            activate: {
                cost: 1,
                run(api, card) {
                    api.ask({ player: card.controller, kind: 'colour', options: Object.keys(Rift.COLOURS), auto: false,
                        prompt: 'Predict the colour of the next creature your opponent plays.', source: { type: 'ability', id: 'predict', cid: card.cid } });
                },
            },
            choose(api, card, colour) {
                card.prediction = colour;
                api.emit({ t: 'prediction', cid: card.cid, colour, text: api.name(card.cid) + ' predicts ' + Rift.COLOURS[colour].name + '.' });
            },
            onEnemyPlay(api, card, played) {
                if (!card.prediction) return;
                const right = api.H.colourOf(api.s, api.s.cards[played]) === card.prediction;
                card.prediction = null;
                if (right) api.buff(card.cid, 3, 3, 'Predicted');
                api.emit({ t: 'predict', cid: card.cid, right, text: right ? api.name(card.cid) + ' predicted it! +3/+3.' : api.name(card.cid) + '\'s prediction was wrong.' });
            },
        },
        escalate: {
            name: 'Escalate',
            text: '+1 attack for each other creature you have played this match (max +3).',
            attackMod(state, card) { return Math.min(3, Math.max(0, state.players[card.controller].playedCount - 1)); },
        },
        'every-time': {
            name: 'Every Time',
            text: 'At the end of your turn, this gets +1 attack (max +4). Every time.',
            onTurnEnd(api, card) {
                if ((card.siuuu || 0) >= 4) return;
                card.siuuu = (card.siuuu || 0) + 1;
                api.buff(card.cid, 1, 0, 'Every time');
                api.emit({ t: 'ability', cid: card.cid, text: api.name(card.cid) + ': SIUUU! +1 attack.' });
            },
            ai: () => 1.5,
        },
        'its-raw': {
            name: 'It\'s Raw',
            text: 'Entrance: defeat an enemy creature with 2 or less attack.',
            entrance: {
                target: 'enemy-creature',
                filter: (s, cid, H) => H.attack(s, cid) <= 2,
                run(api, card, target) { api.emit({ t: 'ability', cid: card.cid, text: api.name(card.cid) + ': "It\'s RAW!"' }); api.defeat(target, 'its-raw'); },
            },
        },
        hype: {
            name: 'Hype', keywords: ['swift'],
            text: 'Swift. Entrance: your other creatures get +1 attack this turn.',
            entrance: {
                run(api, card) {
                    const others = api.s.players[card.controller].board.filter(cid => cid !== card.cid);
                    others.forEach(cid => api.buff(cid, 1, 0, 'Hype', true));
                    api.emit({ t: 'hype', cid: card.cid, text: others.length ? api.name(card.cid) + ' hypes the team: +1 attack this turn!' : api.name(card.cid) + ' screams at nobody in particular.' });
                },
            },
        },
        'pull-that-up': {
            name: 'Pull That Up',
            text: 'Activate (2 energy): look at the top 3 cards of your deck and keep one.',
            activate: Object.assign({ cost: 2, usable: canDraw }, discover('pull-that-up', 'Jamie, pull that up! Keep which card?')),
            choose: keepOne,
            ai: () => 0.7,
        },
        foresight: {
            name: 'Foresight',
            text: 'Entrance: look at the opponent\'s hand and draw a card.',
            entrance: {
                run(api, card) {
                    const P = api.s.players[card.controller];
                    api.s.players[1 - card.controller].hand.forEach(cid => { if (!P.knows.includes(cid)) P.knows.push(cid); });
                    api.emit({ t: 'measure', player: card.controller, text: api.name(card.cid) + ' reads the opponent\'s hand.' });
                    api.draw(card.controller);
                },
            },
        },
        deadpan: {
            name: 'Deadpan', keywords: ['guard'],
            text: 'Guard. A creature that attacks it loses its abilities, keywords and boosts.',
            onAttacked(api, card, attacker) {
                if (!hasSomethingToLose(api.s.cards[attacker])) return;
                api.silence(attacker);
                api.emit({ t: 'ability', cid: card.cid, text: api.name(card.cid) + ' just points at the obvious. ' + api.name(attacker) + ' loses its abilities, keywords and boosts.' });
            },
        },
        'rapid-fire': {
            name: 'Rapid Fire', attacksPerTurn: 2,
            text: 'Can attack twice each turn.',
            ai: () => 1,
        },
        'let-me-be-clear': {
            name: 'Let Me Be Clear', keywords: ['guard'],
            text: 'Guard. Entrance: restore 3 hearts to your hero.',
            entrance: { run(api, card) { api.healHero(card.controller, 3); api.emit({ t: 'ability', cid: card.cid, text: api.name(card.cid) + ': "Let me be clear." Restore 3 hearts.' }); } },
        },
        slapstick: {
            name: 'Slapstick', keywords: ['shield'],
            text: 'Shield: the first damage it takes is ignored.',
        },
        reinvention: Object.assign({ name: 'Reinvention', text: 'Activate (2 energy): gain the ability of a creature in your discard pile.' }, program('reinvention')),
        machine: {
            name: 'Machine', heroDamage: 2,
            text: 'Deals 2 extra damage when it attacks a hero.',
            ai: () => 1,
        },
        lightning: {
            name: 'Lightning', keywords: ['swift'], ignoresGuard: true,
            text: 'Swift. Ignores Guard when it attacks.',
            ai: () => 1,
        },
        'deja-vu': Object.assign({ name: 'Déjà Vu', text: 'Last Word: return it to your hand (once per match).' }, returnOnce),
        'queen-b': {
            name: 'Queen B',
            text: 'Your other creatures have +1 attack.',
            aura: () => 1,
            ai: (s, card) => s.players[card.controller].board.length,
        },
        whisper: {
            name: 'Whisper',
            text: 'Entrance: an enemy creature loses its abilities, keywords and boosts.',
            entrance: {
                target: 'enemy-creature',
                run(api, card, target) { api.silence(target); api.emit({ t: 'ability', cid: card.cid, text: api.name(card.cid) + ' whispers. ' + api.name(target) + ' loses its abilities, keywords and boosts.' }); },
            },
        },
        'the-eyebrow': {
            name: 'The Eyebrow', keywords: ['guard'], damageReduction: 1,
            text: 'Guard. Takes 1 less damage from each hit.',
            ai: () => 1,
        },
        'nature-watch': {
            name: 'Nature Watch',
            text: 'Entrance: look at the top 3 cards of your deck and keep one.',
            entrance: discover('nature-watch', 'Remarkable. Keep which card?'),
            choose: keepOne,
        },
        filter: {
            name: 'Filter',
            text: 'Activate (1 energy): move the Fate track 2 spaces closer.',
            activate: { cost: 1, usable: s => !!s.options.timeline, run(api, card) { api.shiftFate(2); api.emit({ t: 'ability', cid: card.cid, text: 'Filter: the Fate track moves 2 spaces closer.' }); } },
        },
        vision: {
            name: 'Vision',
            text: 'When it attacks, your other creatures get +1 attack this turn.',
            onAttack(api, card) {
                api.s.players[card.controller].board.filter(cid => cid !== card.cid).forEach(cid => api.buff(cid, 1, 0, 'Vision', true));
                api.emit({ t: 'ability', cid: card.cid, text: api.name(card.cid) + ' sees the gap: other creatures +1 attack this turn.' });
            },
        },
        'hips-dont-lie': {
            name: 'Hips Don\'t Lie', elusive: true,
            text: 'Elusive: enemy tactics and abilities can\'t target it.',
        },
        axiomatic: {
            name: 'Axiomatic',
            text: 'Entrance: choose one of the next five shared axioms. It takes effect now.',
            entrance: {
                run(api, card) {
                    api.refillAxioms();
                    const options = api.s.axioms.deck.slice(0, 5);
                    if (!api.ask({ player: card.controller, kind: 'axiom', options, auto: false, prompt: 'Choose a rule. It takes effect for both players now.', source: { type: 'ability', id: 'axiomatic', cid: card.cid } })) {
                        api.emit({ t: 'fizzle', cid: card.cid, text: 'No axioms left to choose.' });
                    }
                },
            },
            choose(api, card, id) { api.takeAxiom(id); api.setAxiom(id, card.controller); },
        },
        program: Object.assign({ name: 'Program', text: 'Activate (1 energy): gain the ability of a creature in your discard pile.' }, program('program')),
        unprovable: {
            name: 'Unprovable', elusive: true,
            text: 'Elusive. Can\'t be attacked while you control another creature.',
            hidden(state, card) { return state.players[card.controller].board.length > 1; },
            ai: () => 2,
        },
        measure: {
            name: 'Measure',
            text: 'Entrance: deal 1 damage to every enemy creature.',
            entrance: {
                run(api, card) {
                    api.emit({ t: 'ability', cid: card.cid, text: api.name(card.cid) + ' measures everything: 1 damage to each enemy creature.' });
                    api.s.players[1 - card.controller].board.slice().forEach(cid => api.damage(cid, 1, card.cid));
                },
            },
        },
        'truth-table': {
            name: 'Truth Table',
            text: 'Entrance: choose TRUE (your other creatures get +1/+1) or FALSE (enemy creatures get −1 attack).',
            entrance: {
                run(api, card) {
                    api.ask({ player: card.controller, kind: 'option', auto: false, options: ['true', 'false'],
                        labels: { true: 'TRUE: your other creatures +1/+1', false: 'FALSE: enemy creatures −1 attack' },
                        prompt: 'True or false?', source: { type: 'ability', id: 'truth-table', cid: card.cid } });
                },
            },
            choose(api, card, choice) {
                const mine = api.s.players[card.controller].board.filter(cid => cid !== card.cid);
                const theirs = api.s.players[1 - card.controller].board;
                if (choice === 'true') mine.forEach(cid => api.buff(cid, 1, 1, 'TRUE'));
                else theirs.forEach(cid => api.buff(cid, -1, 0, 'FALSE'));
                api.emit({ t: 'ability', cid: card.cid, text: choice === 'true' ? 'TRUE: your other creatures get +1/+1.' : 'FALSE: enemy creatures get −1 attack.' });
            },
        },
        grook: {
            name: 'Grook',
            text: 'Whenever it survives a fight, draw a card.',
            onSurvive(api, card) {
                const got = api.draw(card.controller);
                api.emit({ t: 'ability', cid: card.cid, text: got ? api.name(card.cid) + ' writes a little verse and draws a card.' : api.name(card.cid) + ' has no cards left to draw.' });
            },
        },
    };

    Object.keys(A).forEach(id => { A[id].id = id; });
    Battle.Abilities = A;
    Battle.KEYWORDS = Object.keys(A);
    // Keyword descriptions for card tooltips and the rules sheet.
    Battle.KEYWORD_TEXT = {
        guard: 'Guard: enemies must attack a Guard creature first.',
        swift: 'Swift: can attack on the turn it arrives.',
        shield: 'Shield: the first damage it takes is ignored.',
        elusive: 'Elusive: enemy tactics and abilities can\'t target it.',
    };
})(typeof window !== 'undefined' ? window : globalThis);
