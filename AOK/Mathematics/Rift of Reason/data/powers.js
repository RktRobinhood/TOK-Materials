/*
 * Hero powers for the Card Arena (design/AVATARS.md section 1). Each avatar has one power
 * (data/avatars.js `powers: { boy, girl }`); trainers use the power of their team's main colour;
 * Emotion (the colour no avatar has) has two powers of its own for trainers and bosses.
 *
 * Rift.data.powers[id] = {
 *   name, colour, kind: 'board' (acts on creatures) | 'other' (rules, Fate, plays, hand, hearts),
 *   cost (energy), minCost? (no tweak takes the energy cost below it), recharge (own turns it skips
 *   after use), target? (Engine.targetsFor spec),
 *   text, deeper? (full text with the Deeper tweak), broader? (extra sentence with Broader),
 *   filter?(s, cid, H, m), usable?(s, p, H, m), run(api, p, target, m), choose?(api, p, choice, req, m),
 *   ai?(s, p, target, H, m) → extra score for the AI (what its one-ply look can't see),
 *   kills?(s, cid, H, m) → true if the power would defeat that enemy creature (the AI keeps its own
 *     creatures out of reach of a ready enemy Lantern or Close the Proof),
 *   face?(s, p, m) → most hero damage it could add this turn (Expert's lethal search)
 * }
 * m = Engine.powerMods: { cost, heartCost, recharge, deeper, broader }. Cost and recharge come from
 * the balance pass (tools/sim-battle.mjs --powers; design/reviews/avatar-powers-balance.md): each
 * power vs none +3 to +8 points for Competent, pairs within 45-55%.
 *
 * Rift.data.powerTweaks: the five tweaks (trade-offs, each taken once).
 * Rift.Powers.forAvatar({ type, variant, tweaks? }) → { id, tweaks } | null
 * Rift.Powers.forTeam(team, level) → { id, tweaks: [] } | null: the power of the team's most common
 *   colour (ties: the order of COLOURS below), the board one for Normal and the other for
 *   Competent/Expert; Emotion teams get Outrage (Normal) or Pile-On.
 * Rift.Powers.text(id, tweaks) → the power's text with its Deeper/Broader tweaks.
 */
(function (root) {
    'use strict';
    const Rift = root.Rift;
    Rift.data = Rift.data || {};

    const SEEN = ['guard', 'shield', 'elusive'];
    const SEEN_DEEPER = SEEN.concat('swift'); // Call It Out Deeper (#53: "can't attack next turn" was too strong)
    const cap = w => w[0].toUpperCase() + w.slice(1);
    const list = names => (names.length > 1 ? names.slice(0, -1).join(', ') + ' and ' + names[names.length - 1] : names[0] || '');
    const axName = id => ((Rift.data.axioms || {})[id] || { name: id }).name;
    const foeHero = p => 'h' + (1 - p);

    // The player's most recently defeated creature (not one only discarded from a full hand).
    function lastDefeated(s, p) {
        const d = s.players[p].discard;
        for (let i = d.length - 1; i >= 0; i--) {
            const c = s.cards[d[i]];
            if (c.kind === 'creature' && !c.burned) return d[i];
        }
        return null;
    }

    // Foresee after the take: with Broader, one of the n cards left on top goes to the bottom; then order the rest.
    function foreseeBottom(api, p, n, m) {
        const rest = Array.from(new Set(api.s.axioms.deck.slice(0, n)));
        if (m.broader && rest.length >= 1 && api.s.axioms.deck.length > n) {
            api.ask({ player: p, kind: 'axiom', options: rest, step: 'bottom', n, prompt: 'Foresee: which rule goes to the bottom of the rule deck?',
                source: { type: 'power', id: 'foresee' } });
        } else foreseeOrder(api, p, 0, n, m);
    }

    // Foresee: put the chosen rule card at place k of the top `n` cards of the shared deck.
    function foreseeOrder(api, p, k, n, m) {
        const deck = api.s.axioms.deck;
        const rest = Array.from(new Set(deck.slice(k, n)));
        if (rest.length < 2) { api.emit({ t: 'power', player: p, text: 'Foresee: the rule deck is set.' }); return; }
        api.ask({ player: p, kind: 'axiom', options: rest, step: 'order', k, n,
            prompt: k === 0 ? 'Foresee: which rule goes on top of the shared deck?' : 'Foresee: and which rule comes next?',
            source: { type: 'power', id: 'foresee' } });
    }

    const powers = {
        // ---- Owlet (Reason) ----
        'close-the-proof': {
            name: 'Close the Proof', colour: 'reason', kind: 'board', cost: 3, recharge: 2, target: 'enemy-creature',
            text: 'Defeat an enemy creature that has 1 health left.',
            deeper: 'Defeat an enemy creature that has 2 or less health left.',
            broader: 'Also deal 1 damage to the enemy hero.',
            filter: (s, cid, H, m) => H.health(s, cid) <= (m.deeper ? 2 : 1),
            run(api, p, target, m) {
                api.emit({ t: 'power', player: p, text: 'Close the Proof: ' + api.name(target) + ' is finished off.' });
                api.defeat(target, 'power');
                if (m.broader) api.damage(foeHero(p), 1, null);
            },
            face: (s, p, m) => (m.broader ? 1 : 0),
            kills: (s, cid, H, m) => H.health(s, cid) <= (m.deeper ? 2 : 1),
        },
        foresee: {
            name: 'Foresee', colour: 'reason', kind: 'other', cost: 0, recharge: 1,
            text: 'Look at the top 3 rule cards. Take one into your hand and put the others back in any order.',
            deeper: 'Look at the top 4 rule cards. Take one into your hand and put the others back in any order.',
            broader: 'Also put one of the others at the bottom of the rule deck.',
            usable(s, p, H) {
                const A = s.axioms, have = A.deck.length || A.discard.length;
                return have >= 2 || (have >= 1 && H.handRoom(s, p, 1));
            },
            run(api, p, target, m) {
                api.refillAxioms();
                const n = Math.min(m.deeper ? 4 : 3, api.s.axioms.deck.length);
                const top = api.s.axioms.deck.slice(0, n);
                api.emit({ t: 'power', player: p, privateTo: p, text: 'Foresee: you look at the top ' + n + ' rule cards: ' + list(top.map(axName)) + '.',
                    publicText: 'Foresee: ' + api.H.playerName(api.s, p) + ' looks at the top ' + n + ' rule cards.' });
                if (api.handRoom(p)) {
                    api.ask({ player: p, kind: 'axiom', options: Array.from(new Set(top)), step: 'take', n, prompt: 'Foresee: which rule card do you take into your hand?',
                        source: { type: 'power', id: 'foresee' } });
                } else foreseeBottom(api, p, n, m);
            },
            choose(api, p, choice, req, m) {
                const deck = api.s.axioms.deck;
                if (req.step === 'take') {
                    deck.splice(deck.indexOf(choice), 1);
                    api.s.players[p].axHand.push(choice);
                    api.emit({ t: 'power', player: p, privateTo: p, text: 'Foresee: you take ' + axName(choice) + '.', publicText: 'Foresee: ' + api.H.playerName(api.s, p) + ' takes one of them.' });
                    foreseeBottom(api, p, req.n - 1, m);
                    return;
                }
                if (req.step === 'bottom') {
                    deck.splice(deck.indexOf(choice), 1);
                    deck.push(choice);
                    api.emit({ t: 'power', player: p, privateTo: p, text: 'Foresee: ' + axName(choice) + ' goes to the bottom of the rule deck.',
                        publicText: 'Foresee: ' + api.H.playerName(api.s, p) + ' puts one rule card at the bottom.' });
                    foreseeOrder(api, p, 0, req.n - 1, m);
                    return;
                }
                const i = deck.indexOf(choice, req.k);
                deck.splice(i, 1);
                deck.splice(req.k, 0, choice);
                api.emit({ t: 'power', player: p, privateTo: p, text: 'Foresee: ' + axName(choice) + ' goes ' + (req.k ? 'next' : 'on top') + '.',
                    publicText: req.k ? null : 'Foresee: ' + api.H.playerName(api.s, p) + ' puts the rule cards back.' });
                foreseeOrder(api, p, req.k + 1, req.n, m);
            },
        },

        // ---- Moth-kin (Sense perception) ----
        lantern: {
            name: 'Lantern', colour: 'perception', kind: 'board', cost: 2, recharge: 4, target: 'enemy-creature',
            text: 'Deal 1 damage to an enemy creature.',
            deeper: 'Deal 2 damage to an enemy creature.',
            broader: 'Also see one random card in the enemy hand.',
            kills: (s, cid, H, m) => H.health(s, cid) <= (m.deeper ? 2 : 1),
            run(api, p, target, m) {
                const n = m.deeper ? 2 : 1;
                api.emit({ t: 'power', player: p, text: 'Lantern: ' + n + ' damage to ' + api.name(target) + '.' });
                api.damage(target, n, null);
                if (!m.broader) return;
                const P = api.s.players[p];
                const hidden = api.s.players[1 - p].hand.filter(cid => !P.knows.includes(cid));
                if (!hidden.length) return;
                const cid = api.rng.pick(hidden);
                P.knows = P.knows.concat([cid]);
                api.emit({ t: 'power', player: p, privateTo: p, text: 'Lantern: you see ' + api.cardName(cid) + ' in the enemy hand.',
                    publicText: 'Lantern: ' + api.H.playerName(api.s, p) + ' sees one card in your hand.' });
            },
        },
        'night-sight': {
            name: 'Night Sight', colour: 'perception', kind: 'other', cost: 2, recharge: 2,
            // Never usable on turn 1 (#53: Cheap at cost 1 made the tax cost the opponent a whole turn).
            minCost: 2,
            text: 'See the opponent\'s hand until your next turn. Their next card costs 1 more.',
            deeper: 'See the opponent\'s hand until your next turn. Their next 2 cards cost 1 more.',
            broader: 'Also see the top card of their deck.',
            run(api, p, target, m) {
                const s = api.s, P = s.players[p], Q = s.players[1 - p];
                const fresh = Q.hand.filter(cid => !P.knows.includes(cid));
                P.knows = P.knows.concat(fresh);
                P.sight = (P.sight || []).concat(fresh);
                const names = Q.hand.map(cid => api.cardName(cid));
                api.emit({ t: 'power', player: p, privateTo: p, text: 'Night Sight: you see their hand' + (names.length ? ': ' + list(names) : ' (empty)') + '.',
                    publicText: 'Night Sight: ' + api.H.playerName(s, p) + ' sees your hand.' });
                const n = m.deeper ? 2 : 1;
                Q.tax = (Q.tax || 0) + n;
                api.emit({ t: 'power', player: p, text: 'Night Sight: ' + (n === 1 ? 'the next card' : 'the next ' + n + ' cards') + ' ' + api.H.playerName(s, 1 - p) + ' plays cost' + (n === 1 ? 's' : '') + ' 1 more.' });
                if (m.broader && Q.deck.length) {
                    api.emit({ t: 'power', player: p, privateTo: p, text: 'Night Sight: the top card of their deck is ' + api.cardName(Q.deck[0]) + '.',
                        publicText: 'Night Sight: ' + api.H.playerName(s, p) + ' sees the top card of your deck.' });
                }
            },
            // Seeing the hand is worth little to the AI (it never reads hands); the tax is the value.
            ai: (s, p) => (s.players[1 - p].hand.length ? 0.9 : 0.2),
        },

        // ---- Fox kit (Imagination) ----
        'what-if': {
            name: 'What If?', colour: 'imagination', kind: 'board', cost: 0, recharge: 2, target: 'any-creature',
            text: 'Swap a creature\'s attack and health.',
            deeper: 'Swap a creature\'s attack and health, then give it +1 attack.',
            broader: 'Also +1 health.',
            filter: (s, cid, H, m) => m.deeper || m.broader || H.attack(s, cid) !== H.health(s, cid),
            run(api, p, target, m) {
                api.swapStats(target);
                // Broader first, so a 0-attack creature (swapped to 0 health) lives on with 1.
                if (m.broader && api.s.cards[target]) api.buff(target, 0, 1, 'What If?');
                if (m.deeper && api.s.cards[target] && api.H.health(api.s, target) > 0) api.buff(target, 1, 0, 'What If?');
                const extra = [m.deeper ? '+1 attack' : '', m.broader ? '+1 health' : ''].filter(Boolean);
                api.emit({ t: 'power', player: p, text: 'What If?: ' + api.name(target) + ' swaps its attack and health' + (extra.length ? ', then gets ' + extra.join(' and ') : '') + '.' });
            },
        },
        brainstorm: {
            name: 'Brainstorm', colour: 'imagination', kind: 'other', cost: 0, recharge: 0,
            text: '+1 card play this turn.',
            deeper: '+2 card plays this turn.',
            broader: 'Also +1 energy.',
            run(api, p, target, m) {
                const P = api.s.players[p], n = m.deeper ? 2 : 1;
                P.extraPlays = (P.extraPlays || 0) + n;
                if (m.broader) P.energy += 1;
                api.emit({ t: 'power', player: p, text: 'Brainstorm: +' + n + ' card play' + (n === 1 ? '' : 's') + ' this turn' + (m.broader ? ' and +1 energy' : '') + '.' });
            },
            // Worth it when there are more affordable cards than plays left.
            ai(s, p, target, H, m) {
                const P = s.players[p];
                const energy = P.energy - m.cost + (m.broader ? 1 : 0);
                const left = Math.max(0, H.rules(s).playLimit + (P.extraPlays || 0) - (P.playsThisTurn || 0));
                const cards = P.hand.filter(cid => H.playCost(s, cid) <= energy).length;
                return cards > left ? 1.0 : -0.5;
            },
        },

        // ---- Frogling (Memory) ----
        recall: {
            name: 'Recall', colour: 'memory', kind: 'board', cost: 2, recharge: 3,
            text: 'Return your most recently defeated creature to your hand.',
            deeper: 'Return your most recently defeated creature to your hand with +1/+1.',
            broader: 'Also restore 2 hearts.',
            usable: (s, p, H) => !!lastDefeated(s, p) && H.handRoom(s, p, 1),
            run(api, p, target, m) {
                const cid = lastDefeated(api.s, p);
                api.emit({ t: 'power', player: p, text: 'Recall: ' + api.cardName(cid) + ' returns to the hand' + (m.deeper ? ' with +1/+1' : '') + '.' });
                api.fromDiscard(cid);
                if (m.deeper && api.s.players[p].hand.includes(cid)) api.buff(cid, 1, 1, 'Recall');
                if (m.broader) {
                    api.healHero(p, 2);
                    api.emit({ t: 'power', player: p, text: 'Recall: ' + api.H.playerName(api.s, p) + ' restores 2 hearts.' });
                }
            },
        },
        'hold-that-thought': {
            name: 'Hold That Thought', colour: 'memory', kind: 'other', cost: 3, recharge: 2,
            text: 'Move the Fate track 1 space closer or further away. Draw a card.',
            deeper: 'Move the Fate track up to 2 spaces closer or further away. Draw a card.',
            broader: 'Also restore 1 heart.',
            usable: s => !!s.options.timeline,
            run(api, p, target, m) {
                const options = m.deeper ? ['forward-2', 'forward', 'rewind', 'rewind-2'] : ['forward', 'rewind'];
                const labels = { forward: 'Fate 1 space closer', rewind: 'Fate 1 space further away', 'forward-2': 'Fate 2 spaces closer', 'rewind-2': 'Fate 2 spaces further away' };
                api.ask({ player: p, kind: 'option', auto: false, options, labels, prompt: 'Hold That Thought: which way does Fate move?', source: { type: 'power', id: 'hold-that-thought' } });
            },
            choose(api, p, choice, req, m) {
                const n = /-2$/.test(choice) ? 2 : 1, closer = /^forward/.test(choice);
                api.emit({ t: 'power', player: p, text: 'Hold That Thought: Fate moves ' + n + ' space' + (n === 1 ? '' : 's') + ' ' + (closer ? 'closer.' : 'further away.') });
                api.shiftFate(closer ? n : -n);
                api.draw(p);
                if (m.broader) {
                    api.healHero(p, 1);
                    api.emit({ t: 'power', player: p, text: 'Hold That Thought: ' + api.H.playerName(api.s, p) + ' restores 1 heart.' });
                }
            },
        },

        // ---- Raven chick (Language) ----
        'call-it-out': {
            name: 'Call It Out', colour: 'language', kind: 'board', cost: 2, recharge: 2, target: 'enemy-creature-seen',
            text: 'An enemy creature loses Guard, Shield and Elusive.',
            deeper: 'An enemy creature loses Guard, Shield, Elusive and Swift.',
            broader: 'Also draw a card.',
            filter: (s, cid, H, m) => H.keywordsOf(s, cid).some(k => (m.deeper ? SEEN_DEEPER : SEEN).includes(k)),
            run(api, p, target, m) {
                const had = api.stripKeywords(target, m.deeper ? SEEN_DEEPER : SEEN);
                api.emit({ t: 'power', player: p, text: 'Call It Out: ' + api.name(target) + ' loses ' + (had.length ? list(had.map(cap)) : 'nothing') + '.' });
                if (m.broader) api.draw(p);
            },
        },
        'fine-print': {
            name: 'Fine Print', colour: 'language', kind: 'other', cost: 2, recharge: 2,
            text: 'Lose 1 heart and draw a card.',
            deeper: 'Lose 1 heart and draw 2 cards.',
            broader: 'Also +1 energy this turn.',
            // Never the last heart (unless losing hearts wins under the reversed rule).
            usable: (s, p, H, m) => s.players[p].deck.length > 0 && H.handRoom(s, p, 1) && (H.rules(s).reverseHearts || s.players[p].hearts > 1 + m.heartCost),
            run(api, p, target, m) {
                const n = m.deeper ? 2 : 1;
                api.emit({ t: 'power', player: p, text: 'Fine Print: ' + api.H.playerName(api.s, p) + ' pays 1 heart for ' + n + ' card' + (n === 1 ? '' : 's') + (m.broader ? ' and +1 energy' : '') + '.' });
                api.damage('h' + p, 1, null);
                for (let i = 0; i < n; i++) api.draw(p);
                if (m.broader) api.s.players[p].energy += 1;
            },
            // The one-ply score prices a heart above a card. Early on, with hearts to spare and a thin
            // hand, the card is worth more (more options next turn); low on hearts it is not.
            ai(s, p, target, H) {
                const P = s.players[p];
                if (H.rules(s).reverseHearts) return 0;
                return (P.hearts >= 8 ? 0.6 : P.hearts >= 6 ? 0.2 : -0.5) + (P.hand.length <= 2 ? 0.5 : 0);
            },
        },

        // ---- Emotion (trainers and bosses only) ----
        outrage: {
            name: 'Outrage', colour: 'emotion', kind: 'board', cost: 1, recharge: 0, target: 'friendly-creature',
            text: 'A friendly creature gets +2 attack this turn.',
            run(api, p, target) {
                api.buff(target, 2, 0, 'Outrage', true);
                api.emit({ t: 'power', player: p, text: 'Outrage: ' + api.name(target) + ' gets +2 attack this turn.' });
            },
            // A this-turn boost only shows its worth in the attack that follows.
            ai: (s, p, target, H) => (H.canAttack(s, target) ? 1.2 : -1),
            face: () => 2,
        },
        'pile-on': {
            name: 'Pile-On', colour: 'emotion', kind: 'board', cost: 2, recharge: 2,
            text: 'Deal 1 damage to the enemy hero for each of your creatures that attacked this turn.',
            usable: (s, p) => s.players[p].board.some(cid => s.cards[cid].attacks > 0),
            run(api, p) {
                const n = api.s.players[p].board.filter(cid => api.s.cards[cid].attacks > 0).length;
                api.emit({ t: 'power', player: p, text: 'Pile-On: ' + n + ' creature' + (n === 1 ? '' : 's') + ' attacked, so ' + n + ' damage to the enemy hero.' });
                api.damage(foeHero(p), n, null);
            },
            face: (s, p) => s.players[p].board.length,
        },
    };

    Rift.data.powers = powers;

    Rift.data.powerTweaks = {
        quick: { name: 'Quick', text: 'Recharge −1, cost +1 energy.' },
        cheap: { name: 'Cheap', text: 'Cost −1 energy, recharge +1.' },
        blood: { name: 'Blood price', text: 'Costs hearts instead of energy: 1 heart per 2 energy (at least 1).' },
        deeper: { name: 'Deeper', text: 'A stronger version, recharge +1.' },
        broader: { name: 'Broader', text: 'An extra effect, cost +1 energy.' },
    };

    const COLOURS = ['reason', 'perception', 'imagination', 'memory', 'language', 'emotion'];

    function cleanTweaks(list) {
        const out = [];
        (list || []).forEach(t => { if (Rift.data.powerTweaks[t] && !out.includes(t) && out.length < 3) out.push(t); });
        return out;
    }

    function forAvatar(avatar) {
        if (!avatar || !avatar.type) return null;
        const a = (Rift.data.avatars || {})[avatar.type];
        const id = a && a.powers && a.powers[avatar.variant];
        return id && powers[id] ? { id, tweaks: cleanTweaks(avatar.tweaks) } : null;
    }

    // team: creature instances ({ species }) or species ids.
    function forTeam(team, level) {
        const species = Rift.data.creatures || {};
        const counts = {};
        (team || []).forEach(x => {
            const sp = species[typeof x === 'string' ? x : x && x.species];
            if (sp && sp.colour) counts[sp.colour] = (counts[sp.colour] || 0) + 1;
        });
        let main = null;
        COLOURS.forEach(c => { if (counts[c] && (!main || counts[c] > counts[main])) main = c; });
        if (!main) return null;
        const board = !level || level === 'normal' || level === 'easy' || level === 'beginner';
        if (main === 'emotion') return { id: board ? 'outrage' : 'pile-on', tweaks: [] };
        const id = Object.keys(powers).find(k => powers[k].colour === main && powers[k].kind === (board ? 'board' : 'other'));
        return id ? { id, tweaks: [] } : null;
    }

    function text(id, tweaks) {
        const def = powers[id];
        if (!def) return '';
        const t = tweaks || [];
        return (t.includes('deeper') && def.deeper ? def.deeper : def.text) + (t.includes('broader') && def.broader ? ' ' + def.broader : '');
    }

    Rift.Powers = { forAvatar, forTeam, text, cleanTweaks, COLOURS };
})(typeof window !== 'undefined' ? window : globalThis);
