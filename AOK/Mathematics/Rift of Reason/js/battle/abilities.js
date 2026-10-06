/*
 * Ability keywords used by data/creatures.js. Pure hooks, called by the engine.
 *
 * Hooks (all optional):
 *   onActivate(api, card)                 after paying for and exhausting a controlled creature
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
            text: 'Activate: draw one creature card.',
            onActivate(api, card) { api.draw(card.controller); api.emit({t:'ability',cid:card.cid,text:api.name(card.cid) + ' draws a card.'}); },
            aiPlay: () => 0.3,
        },

        nickname: {
            name: 'Nickname',
            text: 'Activate: give an enemy creature a nickname: it loses its colour this round.',
            onActivate(api, card) {
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
            text: 'Activate: reveal one card in the opponent\'s hand.',
            onActivate(api, card) {
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
            text: 'Activate: delay the next Fate event by 2 turns (up to 12 away). Cannot attack on arrival.',
            canAttack(state, card) { return card.enteredTurn !== state.turn; },
            onActivate(api,card){api.shiftFate(-2);api.emit({t:'ability',cid:card.cid,text:'Next Year: delay Fate by 2 turns.'});},
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
            text: 'Activate: guess the opponent\'s next creature\'s colour; if right, +3 power.',
            onActivate(api, card) {
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
            text: 'Activate: gain 3 energy, up to your capacity.',
            onActivate(api, card) { const P=api.s.players[card.controller]; P.energy=Math.min(P.capacity,P.energy+3); api.emit({t:'ability',cid:card.cid,text:api.name(card.cid)+' restores energy.'}); },
            aiPlay: () => -0.5,
        },

        'its-raw': {
            name: 'It\'s Raw',
            text: 'Activate: defeat an enemy creature with power 4 or less.',
            onActivate(api, card) {
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
            text: 'Activate: your other creatures get +1 until the end of your next turn.',
            onActivate(api, card) {
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
            text: 'Activate: look at the top 3 cards of your deck and keep one.',
            onActivate(api, card) {
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
            text: 'Activate: choose from the next five axioms to rewrite a rule.',
            onActivate(api, card) {
                api.ask({player:card.controller,kind:'axiom',ability:'axiomatic',cid:card.cid,options:api.s.axioms.deck.slice(0,5),auto:false,prompt:'Choose a rule rewrite. The activation already paid for it.'});
                api.emit({ t: 'ability', cid: card.cid, text: `${api.name(card.cid)}: "Let us assume very little." Choose a rule from five instead of three.` });
            },
            onChoose(api,card,id) { api.rewrite(id); },
            aiPlay: () => 0.7,
        },

        program: {
            name: 'Program',
            text: 'Activate: choose an ability from your discard pile; this creature gains it.',
            onActivate(api, card) {
                const s = api.s;
                const options = [];
                s.players[card.controller].discard.forEach(cid => {
                    api.H.abilitiesOf(s.cards[cid]).forEach(ab => {
                        // Never program itself (or a renamed copy of Program): that would loop forever.
                        if (A[ab] && A[ab].onActivate !== A.program.onActivate && !options.includes(ab)) options.push(ab);
                    });
                });
                if (!api.ask({ player: card.controller, kind: 'ability', ability: 'program', cid: card.cid, options, prompt: 'Program which ability into this creature?' })) {
                    api.emit({ t: 'fizzle', cid: card.cid, text: `${api.name(card.cid)} finds nothing in the discard pile to program.` });
                }
            },
            onChoose(api, card, ability) {
                card.gained.push(ability);
                api.emit({ t: 'program', cid: card.cid, ability, text: `${api.name(card.cid)} programs itself with ${A[ability].name}.` });
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
            text: 'Activate: look at the opponent\'s whole hand.',
            onActivate(api, card) {
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

    // Expansion keywords (design/ROSTER.md "Expansion"): most reuse a tested
    // mechanic under the character's own name; 'the-eyebrow' is new.
    A['the-eyebrow'] = {
        name: 'The Eyebrow',
        text: 'Can\'t be stolen.',
        canBeStolen: false,
    };
    const alias = (id, base, name, text) => { A[id] = Object.assign({}, A[base], { name, text: text || A[base].text }); };
    alias('foresight', 'measure', 'Foresight');                  // Magnus Carlseal
    alias('deadpan', 'lecture', 'Deadpan');                      // Khaby Llame
    alias('rapid-fire', 'escalate', 'Rapid Fire');               // Eminemu
    alias('let-me-be-clear', 'grook', 'Let Me Be Clear');        // Barack Obambu
    alias('slapstick', 'metaverse', 'Slapstick');                // Mr. Beansprout
    alias('reinvention', 'program', 'Reinvention');              // Lady Gargoyle
    alias('machine', 'every-time', 'Machine');                   // Haalandroid
    alias('lightning', 'unprovable', 'Lightning');               // Usain Volt
    alias('deja-vu', 'metaverse', 'Déjà Vu');                    // Keanu Meows
    alias('queen-b', 'hype', 'Queen B');                         // Beeyoncé
    alias('whisper', 'lecture', 'Whisper');                      // Billie Eelish
    alias('nature-watch', 'pull-that-up', 'Nature Watch');       // Sir David Attenbirdough
    A.filter={name:'Filter',text:'Activate: advance Fate by 2 turns. An event at zero happens immediately.',
        onActivate(api,card){api.shiftFate(2);api.emit({t:'ability',cid:card.cid,text:'Filter: advance Fate by 2 turns.'});}};
    alias('vision', 'measure', 'Vision');                        // Messilion
    alias('hips-dont-lie', 'easter-egg', 'Hips Don\'t Lie');     // Shakirattle

    Battle.Abilities = A;
    Battle.KEYWORDS = Object.keys(A);
})(typeof window !== 'undefined' ? window : globalThis);
