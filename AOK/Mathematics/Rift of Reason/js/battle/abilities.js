/*
 * Ability keywords used by data/creatures.js. Pure hooks, called by the engine.
 *
 * Hooks (all optional):
 *   onPlay(api, card)                    after the steal decision, for whoever controls it
 *   onChoose(api, card, choice, req)     answer to api.ask({ kind, options, ... })
 *   onAttack(api, card)
 *   fightPrep(state, att, blk, fctx, H)  this creature is BLOCKING; may silence the attacker
 *                                        (fctx.suppressed[cid] = true); returns a log line
 *   onBlockSurvived(api, card)
 *   onDefeated(api, card)                return 'hand' to go back to hand instead of discard
 *   powerMod(state, card, H)             static power change
 *   canAttack(state, card, H)            return false to forbid attacking
 *   mustAttack: true                     must attack whenever it can
 *   canBeStolen: false
 *   canBeBlockedBy(state, attacker, blocker, H)
 *   aiPlay(state, card, H)               extra value the AI gives to playing it now
 *
 * Instance effects handled by the engine: powerDelta (injuries), injuries ['no-ability'],
 * warped.ability (the warp curse replaces the species' ability).
 */
(function (root) {
    'use strict';

    const Rift = root.Rift;
    const Battle = Rift.Battle || (Rift.Battle = {});

    const NICKNAMES = ['Sleepy', 'Low-Energy', 'Little', 'Crooked', 'Boring', 'Tiny', 'Wacky', 'Sad'];

    const enemyBoard = (api, card) => api.s.players[1 - card.controller].board;

    const A = {
        lecture: {
            name: 'Lecture',
            text: 'When it blocks, the attacker loses its ability this turn.',
            fightPrep(state, att, blk, fctx, H) {
                fctx.suppressed[att] = true;
                return `${H.cardName(state, blk)} starts a lecture: ${H.cardName(state, att)} loses its ability this turn.`;
            },
        },

        'well-actually': {
            name: 'Well, Actually',
            text: 'On play, peek at the next axiom card.',
            onPlay(api, card) {
                const P = api.s.players[card.controller];
                const next = api.s.axioms.deck[0] || null;
                P.peek = next;
                const ax = next && Rift.data.axioms[next];
                api.emit({
                    t: 'peek', player: card.controller, axiom: next, privateTo: card.controller,
                    text: ax ? `Well, actually… the next axiom will be ${ax.name}.` : 'Well, actually… the axiom deck needs a reshuffle first.',
                    publicText: `${api.name(card.cid)} peeks at the next axiom.`,
                });
            },
            aiPlay: () => 0.3,
        },

        nickname: {
            name: 'Nickname',
            text: 'On play, give an enemy creature a nickname: it loses its colour this round.',
            onPlay(api, card) {
                const options = enemyBoard(api, card).filter(cid => api.H.colourOf(api.s, api.s.cards[cid]) !== 'memory');
                if (!api.ask({ player: card.controller, kind: 'target', ability: 'nickname', cid: card.cid, options, prompt: 'Nickname which enemy creature? It loses its colour this round.' })) {
                    api.emit({ t: 'fizzle', cid: card.cid, text: `${api.name(card.cid)} can't find anyone worth a nickname.` });
                }
            },
            onChoose(api, card, target) {
                const t = api.s.cards[target];
                const oldName = api.name(target);
                t.nickname = api.rng.pick(NICKNAMES) + ' ' + oldName;
                t.nicknamedRound = api.s.round;
                api.emit({ t: 'nickname', cid: target, text: `${api.name(card.cid)} calls ${oldName} "${t.nickname}". It loses its colour this round.` });
            },
            aiPlay: (s, card) => s.players[1 - card.controller].board.length ? 0.8 : 0,
        },

        'easter-egg': {
            name: 'Easter Egg',
            text: 'On play, reveal one card in the opponent\'s hand.',
            onPlay(api, card) {
                const P = api.s.players[card.controller];
                const hand = api.s.players[1 - card.controller].hand.filter(cid => !P.knows.includes(cid));
                if (!hand.length) { api.emit({ t: 'fizzle', text: 'Easter egg: nothing new to reveal.' }); return; }
                const cid = api.rng.pick(hand);
                P.knows.push(cid);
                api.emit({ t: 'reveal', cid, player: card.controller, text: `Easter egg! ${api.name(card.cid)} reveals ${api.name(cid)} in the opponent's hand.` });
            },
            aiPlay: () => 0.3,
        },

        'next-year': {
            name: 'Next Year',
            text: 'Can\'t attack the turn it is played.',
            canAttack(state, card) { return card.enteredTurn !== state.turn; },
        },

        metaverse: {
            name: 'Metaverse',
            text: 'The first time it is defeated, return it to your hand.',
            onDefeated(api, card) {
                if (card.metaverseUsed) return null;
                card.metaverseUsed = true;
                return 'hand';
            },
            aiPlay: () => 1,
        },

        predict: {
            name: 'Predict',
            text: 'On play, guess the opponent\'s next creature\'s colour; if right, +3 power.',
            onPlay(api, card) {
                api.ask({
                    player: card.controller, kind: 'colour', ability: 'predict', cid: card.cid, auto: false,
                    options: Object.keys(Rift.COLOURS), prompt: 'Predict the colour of the next creature your opponent plays.',
                });
            },
            onChoose(api, card, colour) {
                card.prediction = { colour, target: 1 - card.controller };
                api.emit({ t: 'prediction', cid: card.cid, colour, text: `${api.name(card.cid)} predicts the next creature will be ${Rift.COLOURS[colour].name}.` });
            },
            aiPlay: () => 0.8,
        },

        escalate: {
            name: 'Escalate',
            text: '+1 power for each creature you have played this battle (max +3).',
            powerMod(state, card) { return Math.min(3, state.players[card.controller].playedCount); },
        },

        'every-time': {
            name: 'Every Time',
            text: 'Always attacks if it can.',
            mustAttack: true,
            aiPlay: () => -0.5,
        },

        'its-raw': {
            name: 'It\'s Raw',
            text: 'On play, defeat an enemy creature with power 4 or less.',
            onPlay(api, card) {
                const options = enemyBoard(api, card).filter(cid => api.power(cid) <= 4);
                if (!api.ask({ player: card.controller, kind: 'target', ability: 'its-raw', cid: card.cid, options, prompt: 'It\'s RAW! Defeat which enemy creature (power 4 or less)?' })) {
                    api.emit({ t: 'fizzle', cid: card.cid, text: `${api.name(card.cid)} finds nothing raw enough.` });
                }
            },
            onChoose(api, card, target) {
                api.emit({ t: 'ability', cid: card.cid, text: `${api.name(card.cid)}: "It's RAW!"` });
                api.defeat(target, 'its-raw');
            },
            aiPlay(s, card, H) {
                const targets = s.players[1 - card.controller].board.filter(cid => H.power(s, cid) <= 4);
                return targets.length ? 2 + Math.max(...targets.map(cid => H.power(s, cid))) : 0;
            },
        },

        hype: {
            name: 'Hype',
            text: 'When played, your other creatures get +1 until the end of your next turn.',
            onPlay(api, card) {
                const s = api.s;
                const P = s.players[card.controller];
                const others = P.board.filter(cid => cid !== card.cid);
                const expires = P.turnsTaken + (card.controller === s.active ? 2 : 1);
                others.forEach(cid => { s.cards[cid].hype = { amount: 1, expires }; });
                api.emit({ t: 'hype', cid: card.cid, text: others.length ? `${api.name(card.cid)} hypes up the team: +1 power!` : `${api.name(card.cid)} screams at nobody in particular.` });
            },
            aiPlay: (s, card) => 0.6 * s.players[card.controller].board.length,
        },

        'pull-that-up': {
            name: 'Pull That Up',
            text: 'On play, look at the top 3 cards of your deck and keep one.',
            onPlay(api, card) {
                const deck = api.s.players[card.controller].deck;
                const options = deck.slice(0, 3);
                if (!api.ask({ player: card.controller, kind: 'card', ability: 'pull-that-up', cid: card.cid, options, prompt: 'Jamie, pull that up! Keep which card?' })) {
                    api.emit({ t: 'fizzle', text: 'Nothing left to pull up.' });
                }
            },
            onChoose(api, card, chosen) {
                const P = api.s.players[card.controller];
                const top = P.deck.slice(0, 3);
                P.deck = P.deck.slice(top.length).concat(top.filter(c => c !== chosen));
                P.hand.push(chosen);
                api.emit({
                    t: 'keep', player: card.controller, cid: chosen, privateTo: card.controller,
                    text: `You keep ${api.name(chosen)}; the rest go to the bottom of your deck.`,
                    publicText: `${api.name(card.cid)} pulls up a card.`,
                });
            },
            aiPlay: () => 0.7,
        },

        axiomatic: {
            name: 'Axiomatic',
            text: 'You choose the next axiom card instead of drawing it.',
            onPlay(api, card) {
                api.s.players[card.controller].axiomChoice = true;
                api.emit({ t: 'ability', cid: card.cid, text: `${api.name(card.cid)}: "Let us assume very little." Its side chooses the next axiom.` });
            },
            aiPlay: () => 0.7,
        },

        program: {
            name: 'Program',
            text: 'On play, choose an ability from your discard pile; this creature gains it.',
            onPlay(api, card) {
                const s = api.s;
                const options = [];
                s.players[card.controller].discard.forEach(cid => {
                    api.H.abilitiesOf(s.cards[cid]).forEach(ab => {
                        if (ab !== 'program' && A[ab] && !options.includes(ab)) options.push(ab);
                    });
                });
                if (!api.ask({ player: card.controller, kind: 'ability', ability: 'program', cid: card.cid, options, prompt: 'Program which ability into this creature?' })) {
                    api.emit({ t: 'fizzle', cid: card.cid, text: `${api.name(card.cid)} finds nothing in the discard pile to program.` });
                }
            },
            onChoose(api, card, ability) {
                card.gained.push(ability);
                api.emit({ t: 'program', cid: card.cid, ability, text: `${api.name(card.cid)} programs itself with ${A[ability].name}.` });
                if (A[ability].onPlay) api.runOnPlay(card, ability);
            },
            aiPlay: (s, card) => s.players[card.controller].discard.length ? 1 : 0,
        },

        unprovable: {
            name: 'Unprovable',
            text: 'Can\'t be stolen, and can\'t be blocked by creatures with power higher than 7.',
            canBeStolen: false,
            canBeBlockedBy(state, attacker, blocker, H) { return H.power(state, blocker.cid) <= 7; },
        },

        measure: {
            name: 'Measure',
            text: 'On play, look at the opponent\'s whole hand.',
            onPlay(api, card) {
                const s = api.s;
                const P = s.players[card.controller];
                const hand = s.players[1 - card.controller].hand;
                hand.forEach(cid => { if (!P.knows.includes(cid)) P.knows.push(cid); });
                api.emit({
                    t: 'measure', player: card.controller, privateTo: card.controller,
                    text: hand.length ? `${api.name(card.cid)} measures their hand: ${hand.map(api.name).join(', ')}.` : 'Their hand is empty.',
                    publicText: `${api.name(card.cid)} measures the opponent's hand.`,
                });
            },
            aiPlay: () => 0.3,
        },

        grook: {
            name: 'Grook',
            text: 'When it blocks and survives, draw a card.',
            onBlockSurvived(api, card) {
                const cid = api.draw(card.controller);
                api.emit({ t: 'ability', cid: card.cid, text: cid ? `${api.name(card.cid)} writes a little verse and draws a card.` : `${api.name(card.cid)} has no cards left to draw.` });
            },
        },
    };

    Object.keys(A).forEach(id => { A[id].id = id; });

    Battle.Abilities = A;
    Battle.KEYWORDS = Object.keys(A);
})(typeof window !== 'undefined' ? window : globalThis);
