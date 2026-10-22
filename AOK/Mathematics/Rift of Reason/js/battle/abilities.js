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
 *   lastWordEffect(api, card)        when defeated, wherever the card goes: an effect that never returns it
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
                    // A new nickname replaces an old one (never 'Sad "Low-Energy X"').
                    const base = ((Rift.data.creatures || {})[t.species] || {}).name || api.cardName(target);
                    t.nickname = api.rng.pick(NICKNAMES) + ' ' + base;
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
            text: 'Activate (1 energy): rewind the Fate track 2 rounds.',
            activate: { cost: 1, usable: s => !!s.options.timeline, run(api, card) { api.shiftFate(-2); api.emit({ t: 'ability', cid: card.cid, text: 'Next Year: the Fate track moves 2 rounds back.' }); } },
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
        // ---- roaming legendaries (#111): one of a kind, so stronger than the common cards they echo ----
        'lantern-switch': {
            name: 'Lantern Switch',
            text: 'Entrance: every enemy creature loses its abilities, keywords and boosts.',
            entrance: {
                run(api, card) {
                    api.emit({ t: 'ability', cid: card.cid, text: api.name(card.cid) + ' switches the sign. Every enemy creature loses its abilities, keywords and boosts.' });
                    api.s.players[1 - card.controller].board.slice().forEach(cid => api.silence(cid));
                },
            },
            ai: (s, card) => 1 + s.players[1 - card.controller].board.length,
        },
        'cross-examine': {
            name: 'Cross-Examine',
            keywords: ['guard'], damageReduction: 1,
            text: 'Guard. Hits deal it 1 less damage. Entrance: see the enemy\'s hand, draw 2.',
            entrance: {
                run(api, card) {
                    const P = api.s.players[card.controller];
                    api.s.players[1 - card.controller].hand.forEach(cid => { if (!P.knows.includes(cid)) P.knows.push(cid); });
                    api.emit({ t: 'measure', player: card.controller, text: api.name(card.cid) + ' cross-examines the opponent\'s hand.' });
                    api.draw(card.controller);
                    api.draw(card.controller);
                },
            },
            ai: () => 2,
        },
        'loaded-odds': {
            name: 'Loaded Odds',
            text: 'Activate (1 energy): predict the colour of the enemy\'s next creature. Right: +3/+3 and draw. Wrong: +1/+1.',
            activate: {
                cost: 1,
                run(api, card) {
                    api.ask({ player: card.controller, kind: 'colour', options: Object.keys(Rift.COLOURS), auto: false,
                        prompt: 'Predict the colour of the next creature your opponent plays.', source: { type: 'ability', id: 'loaded-odds', cid: card.cid } });
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
                if (right) { api.buff(card.cid, 3, 3, 'Predicted'); api.draw(card.controller); } else api.buff(card.cid, 1, 1, 'Counted');
                api.emit({ t: 'predict', cid: card.cid, right, text: right ? api.name(card.cid) + ' predicted it! +3/+3 and a card.' : api.name(card.cid) + ' guessed wrong, but still counts: +1/+1.' });
            },
            ai: () => 1.5,
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
            text: 'Activate (1 energy): move the Fate track 2 rounds closer.',
            activate: { cost: 1, usable: s => !!s.options.timeline, run(api, card) { api.shiftFate(2); api.emit({ t: 'ability', cid: card.cid, text: 'Filter: the Fate track moves 2 rounds closer.' }); } },
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
        // Small, bounded starter hooks. They use existing engine effects and no scheduled Fate.
        'fetch-proof': {
            name: 'Fetch Proof', keywords: ['guard'],
            text: 'Guard. Entrance: heal another friendly creature by 1.',
            entrance: {
                target: 'friendly-other', filter: (s, cid) => s.cards[cid].damage > 0,
                run(api, card, target) { api.heal(target, 1); api.emit({ t: 'ability', cid: card.cid, text: api.name(card.cid) + ' fetches a damp proof: heal ' + api.name(target) + ' by 1.' }); },
            },
        },
        'lens-check': {
            name: 'Lens Check',
            text: 'Activate (1 energy): look at your top card. Keep it there or move it to the bottom.',
            activate: {
                cost: 1, usable: (s, card) => s.players[card.controller].deck.length > 0,
                run(api, card) {
                    const top = api.s.players[card.controller].deck[0];
                    api.ask({ player: card.controller, kind: 'option', auto: false, options: ['keep', 'bottom'],
                        labels: { keep: 'Keep on top', bottom: 'Move to bottom' },
                        prompt: 'Your top card is ' + api.cardName(top) + '. Where should it go?',
                        source: { type: 'ability', id: 'lens-check', cid: card.cid } });
                },
            },
            choose(api, card, choice) {
                const deck = api.s.players[card.controller].deck;
                if (choice === 'bottom' && deck.length) deck.push(deck.shift());
                api.emit({ t: 'ability', cid: card.cid, text: api.name(card.cid) + (choice === 'bottom' ? ' moves a card to the bottom of the deck.' : ' keeps the top card in place.') });
            },
            ai: () => 0.2,
        },
        'fold-self': {
            name: 'Fold Self',
            text: 'Activate (1 energy): swap this creature\'s attack and health.',
            activate: {
                cost: 1, usable: (s, card, H) => H.attack(s, card.cid) !== H.health(s, card.cid),
                run(api, card) { api.swapStats(card.cid); api.emit({ t: 'ability', cid: card.cid, text: api.name(card.cid) + ' folds the other way: swap its attack and health.' }); },
            },
        },
        'soft-landing': {
            name: 'Soft Landing', keywords: ['guard'],
            text: 'Guard. At your turn\'s end, if this is damaged, restore 1 heart to your hero.',
            onTurnEnd(api, card) {
                if (card.damage <= 0) return;
                api.healHero(card.controller, 1);
                api.emit({ t: 'ability', cid: card.cid, text: api.name(card.cid) + ' offers a soft landing: restore 1 heart.' });
            },
            ai: (s, card) => card.damage > 0 && s.players[card.controller].hearts < s.players[card.controller].maxHearts ? 0.3 : 0,
        },
        'old-pocket': {
            name: 'Old Pocket',
            text: 'Activate (1 energy): move the bottom card of your deck to the top.',
            activate: {
                cost: 1, usable: (s, card) => s.players[card.controller].deck.length > 1,
                run(api, card) {
                    const deck = api.s.players[card.controller].deck;
                    deck.unshift(deck.pop());
                    api.emit({ t: 'ability', cid: card.cid, text: api.name(card.cid) + ' unpacks the bottom card onto the top of the deck.' });
                },
            },
        },
        'comma-pause': {
            name: 'Comma Pause', keywords: ['guard'],
            text: 'Guard. Activate (1 energy): heal another friendly creature by 1.',
            activate: {
                cost: 1, target: 'friendly-other', filter: (s, cid) => s.cards[cid].damage > 0,
                run(api, card, target) { api.heal(target, 1); api.emit({ t: 'ability', cid: card.cid, text: api.name(card.cid) + ' adds a small pause: heal ' + api.name(target) + ' by 1.' }); },
            },
        },
        'tiny-print': {
            name: 'Tiny Print',
            text: 'When you play an Axiom, this gets +1 attack this turn.',
            onAxiomPlayed(api, card, id, by) {
                if (by !== card.controller) return;
                api.buff(card.cid, 1, 0, 'Tiny Print', true);
                api.emit({ t: 'ability', cid: card.cid, text: api.name(card.cid) + ' argues in tiny print: +1 attack this turn.' });
            },
        },
        'small-premise': {
            name: 'One Small Premise',
            text: 'Entrance: reveal your top personal card. Draw it if it is a spell with printed cost 1 or less.',
            entrance: { run(api, card) {
                if (api.planning) return; // No real top-card inspection during a prospective AI choice.
                const P = api.s.players[card.controller], cid = P.deck[0];
                if (!cid) return;
                const top = api.s.cards[cid], def = top.kind === 'tactic' && Rift.data.tactics[top.tactic];
                const other = api.s.players[1 - card.controller];
                if (!other.knows.includes(cid)) other.knows.push(cid);
                api.emit({ t: 'ability', cid: card.cid, text: api.name(card.cid) + ' reveals ' + api.cardName(cid) + ' on top of the personal deck.' });
                if (def && def.cost <= 1) api.draw(card.controller);
            } },
            ai: () => 0.2, // Small fixed information/draw opportunity, never the unseen top card's identity.
        },
        'balanced-landing': {
            name: 'Balanced Landing',
            text: 'Entrance: heal your hero by 1. If this fills their hearts, gain Shield.',
            entrance: { run(api, card) {
                const P = api.s.players[card.controller], before = P.hearts;
                api.healHero(card.controller, 1);
                const shield = P.hearts > before && P.hearts === P.maxHearts;
                if (shield) api.addKeyword(card.cid, 'shield');
                api.emit({ t: 'ability', cid: card.cid, text: api.name(card.cid) + ' restores ' + (P.hearts - before) + ' heart' + (shield ? ' and gains Shield.' : '.') });
            } },
        },
        'first-look': {
            name: 'One Closer Look',
            text: 'Entrance: look at your top personal-deck card. Leave it there.',
            entrance: { run(api, card) {
                if (api.planning) return;
                const top = api.s.players[card.controller].deck[0];
                if (!top) return;
                api.ask({ player: card.controller, kind: 'option', auto: false, options: ['done'], labels: { done: 'Leave it on top' },
                    prompt: 'Your top card is ' + api.cardName(top) + '.', source: { type: 'ability', id: 'first-look', cid: card.cid } });
            } },
            choose(api, card) { api.emit({ t: 'ability', cid: card.cid, text: api.name(card.cid) + ' looks at one card and leaves it on top.' }); },
            ai: () => 0.1,
        },
        'let-the-guest-speak': {
            name: 'Let the Guest Speak',
            text: 'Entrance: unfreeze another friendly creature. It keeps its normal sleep and action limits.',
            entrance: { target: 'friendly-other', filter: (s, cid) => !!s.cards[cid].frozen,
                run(api, card, target) {
                    api.s.cards[target].frozen = false; delete api.s.cards[target].frozenUntil;
                    api.emit({ t: 'ability', cid: card.cid, text: api.name(card.cid) + ' gives ' + api.name(target) + ' the floor: Freeze ends.' });
                },
            },
        },
        'dramatic-reframe': {
            name: 'Dramatic Reframe',
            text: 'Entrance: swap another ally\'s attack and health. Mono-Imagination: then give it +1 maximum health and heal 1.',
            entrance: { target: 'friendly-other', run(api, card, target) {
                api.swapStats(target);
                const mono = api.s.players[card.controller].monoColour === 'imagination';
                if (mono) { api.buff(target, 0, 1, 'Mono-Imagination'); api.heal(target, 1); }
                api.emit({ t: 'ability', cid: card.cid, text: api.name(card.cid) + ' swaps ' + api.name(target) + '\'s attack and health.' + (mono ? ' Mono-Imagination: +1 maximum health and heal 1.' : '') });
            } },
        },
        'keep-the-last-note': {
            name: 'Keep the Last Note',
            text: 'Entrance: put your newest discarded spell on the bottom of your personal deck.',
            entrance: { run(api, card) {
                const P = api.s.players[card.controller], cid = P.discard.slice().reverse().find(id => api.s.cards[id].kind === 'tactic');
                if (!cid) return;
                api.recoverBottom(cid);
                api.emit({ t: 'ability', cid: card.cid, text: api.name(card.cid) + ' puts ' + api.cardName(cid) + ' on the bottom of the personal deck.' });
            } },
        },
        // #129 expansion-2. Each hook resolves once per paid play and adds no listener, copy or Fate event.
        'same-picture': {
            name: 'Same Picture',
            text: 'Entrance: an enemy creature with the same attack as this loses its abilities, keywords and boosts.',
            // Compared once this is on the board, so auras and rules that change its attack count.
            entrance: { run(api, card) {
                const mine = api.attack(card.cid), H = api.H;
                const options = api.s.players[1 - card.controller].board.filter(cid => !H.hasKeyword(api.s, cid, 'elusive') && api.attack(cid) === mine);
                if (!api.ask({ player: card.controller, kind: 'card', options, prompt: 'Which enemy with ' + mine + ' attack loses its abilities, keywords and boosts?',
                    source: { type: 'ability', id: 'same-picture', cid: card.cid } })) {
                    api.emit({ t: 'fizzle', cid: card.cid, text: api.name(card.cid) + ' finds no enemy with ' + mine + ' attack.' });
                }
            } },
            choose(api, card, cid) {
                const board = api.s.players[1 - card.controller].board;
                if (!board.includes(cid) || api.attack(cid) !== api.attack(card.cid)) return;
                api.silence(cid);
                api.emit({ t: 'ability', cid: card.cid, target: cid, text: api.name(card.cid) + ' draws the same picture: ' + api.name(cid) + ' loses its abilities, keywords and boosts.' });
            },
        },
        'hold-the-line': {
            name: 'Hold the Line', keywords: ['guard'],
            text: 'Guard. While your hero has 4 hearts or fewer, this has +1 attack.',
            attackMod: (s, card) => (s.players[card.controller].hearts <= 4 ? 1 : 0),
        },
        'walk-the-course': {
            name: 'Walk the Course',
            text: 'Entrance: look at your top 2 deck cards. Put one of them on the bottom.',
            entrance: { run(api, card) {
                if (api.planning) return; // No real top-card inspection during a prospective AI choice.
                const options = api.s.players[card.controller].deck.slice(0, 2);
                if (options.length < 2) return; // One card is already top and bottom: nothing to choose.
                api.ask({ player: card.controller, kind: 'card', auto: false, options, prompt: 'Which of your top 2 cards goes to the bottom?',
                    source: { type: 'ability', id: 'walk-the-course', cid: card.cid } });
            } },
            choose(api, card, cid) {
                const deck = api.s.players[card.controller].deck, at = deck.indexOf(cid);
                if (at < 0 || at > 1) return;
                deck.splice(at, 1); deck.push(cid);
                api.emit({ t: 'ability', cid: card.cid, player: card.controller, privateTo: card.controller,
                    text: 'You put ' + api.cardName(cid) + ' on the bottom of your deck.',
                    publicText: api.name(card.cid) + ' puts one of the top 2 cards on the bottom.' });
            },
            ai: () => 0.15,
        },
        'quick-question': {
            name: 'Quick Question',
            text: 'Entrance: an enemy creature gets −1 attack until the end of its next turn.',
            entrance: { target: 'enemy-creature', run(api, card, target) {
                // Minimum 0: a creature with no attack has nothing to lose, so no debuff is stored.
                const hit = api.attack(target) > 0;
                if (hit) api.buffNextTurn(target, -1, 0, 'Quick question');
                api.emit({ t: 'ability', cid: card.cid, target, text: api.name(card.cid) + ' asks ' + api.name(target) + ' a quick question: ' + (hit ? '−1 attack until the end of its next turn.' : 'it has no attack to lose.') });
            } },
        },
        'one-more-way': {
            name: 'One More Way',
            text: 'Entrance: choose +1 attack, or +1 maximum health and heal 1, for this creature.',
            entrance: { run(api, card) {
                api.ask({ player: card.controller, kind: 'option', auto: false, options: ['attack', 'health'],
                    labels: { attack: '+1 attack', health: '+1 maximum health, heal 1' },
                    prompt: 'Choose one for this creature:', source: { type: 'ability', id: 'one-more-way', cid: card.cid } });
            } },
            choose(api, card, choice) {
                if (choice === 'attack') api.buff(card.cid, 1, 0, 'One more way');
                else { api.buff(card.cid, 0, 1, 'One more way'); api.heal(card.cid, 1); }
                api.emit({ t: 'ability', cid: card.cid, text: api.name(card.cid) + (choice === 'attack' ? ' plays it bold: +1 attack.' : ' plays it safe: +1 maximum health and heal 1.') });
            },
        },
        // #129 expansion-3. Like expansion-2: once per paid play (or per defeat), no listener, copy or Fate event.
        'big-hype': {
            name: 'Big Hype',
            text: 'Entrance: another friendly creature gets +1 attack this turn.',
            entrance: { target: 'friendly-other', run(api, card, target) {
                api.buff(target, 1, 0, 'Big hype', true);
                api.emit({ t: 'ability', cid: card.cid, target, text: api.name(card.cid) + ' hypes up ' + api.name(target) + ': +1 attack this turn.' });
            } },
        },
        'dictionary-corner': {
            name: 'Dictionary Corner',
            text: 'Entrance: another friendly creature gets Guard until your next turn starts.',
            // A creature that already has Guard is not offered: it would gain nothing.
            entrance: { target: 'friendly-other', filter: (s, cid, H) => !H.hasKeyword(s, cid, 'guard'), run(api, card, target) {
                api.keywordUntilStart(target, 'guard', 'gain', card.controller, 'Dictionary Corner');
                api.emit({ t: 'ability', cid: card.cid, target, text: api.name(card.cid) + ' defines ' + api.name(target) + ' as a guard until your next turn starts.' });
            } },
        },
        'one-more-take': {
            name: 'One More Take',
            text: 'Entrance: copy a friend\'s attack if it is higher (up to 4) until your next turn starts.',
            // Measured once this is on the board (auras count). Kept as a timed boost of the difference,
            // so a copy never lowers this creature's attack and never goes past 4.
            entrance: { run(api, card) {
                const mine = api.attack(card.cid), options = api.s.players[card.controller].board
                    .filter(cid => cid !== card.cid && Math.min(4, api.attack(cid)) > mine);
                if (!api.ask({ player: card.controller, kind: 'card', options, prompt: 'Whose attack does this copy (up to 4)?',
                    source: { type: 'ability', id: 'one-more-take', cid: card.cid } })) {
                    api.emit({ t: 'fizzle', cid: card.cid, text: api.name(card.cid) + ' finds no higher attack to copy.' });
                }
            } },
            choose(api, card, cid) {
                const P = api.s.players[card.controller];
                if (!P.board.includes(cid) || !P.board.includes(card.cid)) return;
                const gain = Math.min(4, api.attack(cid)) - api.attack(card.cid);
                if (gain <= 0) return;
                api.buffUntilStart(card.cid, gain, 0, 'One more take', card.controller);
                api.emit({ t: 'ability', cid: card.cid, target: cid, text: api.name(card.cid) + ' copies ' + api.name(cid) + ': ' + api.attack(card.cid) + ' attack until your next turn starts.' });
            },
        },
        'last-save': {
            name: 'Last Save', keywords: ['guard'],
            text: 'Guard. Last Word: put your oldest discarded spell on top of your personal deck.',
            // Not lastWord: that one returns a card to the hand and is skipped with a full hand or Mercy.
            // An empty pile is a plain log line, not a fizzle: the action that defeated him did not fail.
            lastWordEffect(api, card) {
                const P = api.s.players[card.controller], cid = P.discard.find(id => api.s.cards[id].kind === 'tactic');
                if (!cid) { api.emit({ t: 'ability', cid: card.cid, text: api.name(card.cid) + ' finds no spell in the discard pile.' }); return; }
                api.recoverTop(cid);
                api.emit({ t: 'ability', cid: card.cid, text: api.name(card.cid) + ' puts ' + api.cardName(cid) + ' on top of the personal deck.' });
            },
            ai: () => 0.5,
        },
        'patient-conclusion': {
            name: 'One Tiny Detail', text: 'Once per turn, after another friend survives a fight at 1 health, draw 1 personal card.',
            onAllySurvive(api, card, ally, health) {
                if (health !== 1 || card.conclusionTurn === api.s.turn) return;
                card.conclusionTurn = api.s.turn;
                if (!api.planning) api.draw(card.controller);
                api.emit({t:'ability',cid:card.cid,text:api.name(card.cid)+' checks the tiny surviving detail: draw 1.'});
            },
        },
        'big-team-talk': {
            name: 'Big Team Talk', text: 'Once per turn, after your hero loses hearts on your turn, your oldest other creature gains 1 attack this turn.',
            onHeroLoss(api, card) {
                if (api.s.active !== card.controller || card.pepTurn === api.s.turn) return;
                card.pepTurn = api.s.turn;
                const target=api.s.players[card.controller].board.find(cid=>cid!==card.cid);
                if(target){api.buff(target,1,0,'Big Team Talk',true);api.emit({t:'ability',cid:card.cid,target,text:api.name(card.cid)+' turns a setback into +1 attack for '+api.name(target)+'.'});}
            },
        },
        'open-the-lock': {
            name: 'Open the Lock', text: 'Entrance: remove one chosen enemy keyword: Guard, Shield or Elusive.',
            entrance: {target:'enemy-creature-seen',filter:(s,cid,H)=>['guard','shield','elusive'].some(k=>H.hasKeyword(s,cid,k)),
                run(api,card,target){
                    const options=['guard','shield','elusive'].filter(k=>api.H.hasKeyword(api.s,target,k));
                    api.ask({player:card.controller,kind:'option',options,labels:{guard:'Remove Guard',shield:'Remove Shield',elusive:'Remove Elusive'},
                        prompt:'Which fastening comes off?',target,source:{type:'ability',id:'open-the-lock',cid:card.cid}});
                }},
            choose(api,card,k,req){
                if(!api.s.players[1-card.controller].board.includes(req.target))return;
                api.stripKeywords(req.target,[k]);api.emit({t:'ability',cid:card.cid,target:req.target,text:api.name(card.cid)+' removes '+k+'.'});
            },
        },
        'serious-favour': {
            name:'A Serious Favour',text:'Your first spell each turn targeting a friendly creature costs 1 less, minimum 0. Multiple copies do not stack.',
            friendlySpellDiscount:true,
        },
        'paper-backup': {
            name:'Paper Backup',text:'Guard. The first time each turn this survives damage, summon a colourless 1/1 Paper if there is space.',keywords:['guard'],
            onDamaged(api,card){
                if(card.paperTurn===api.s.turn)return;card.paperTurn=api.s.turn;
                api.summon(card.controller,'paper-token');
            },
        },
        'one-more-cameo': {
            name:'One More Cameo',text:'Entrance: return a defeated creature with printed cost 3 or less to hand. It gains 1 maximum health on its next play only.',
            entrance:{run(api,card){
                const options=api.s.players[card.controller].discard.filter(cid=>{const c=api.s.cards[cid];return c.kind==='creature'&&!c.burned&&(Rift.data.creatures[c.species]||{}).cost<=3;});
                api.ask({player:card.controller,kind:'card',options,prompt:'Which small creature gets one more cameo?',source:{type:'ability',id:'one-more-cameo',cid:card.cid}});
            }},
            choose(api,card,cid){if(api.fromDiscard(cid)){api.s.cards[cid].nextPlayHealth=1;api.emit({t:'ability',cid:card.cid,text:api.cardName(cid)+' returns for one stronger cameo.'});}},
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
