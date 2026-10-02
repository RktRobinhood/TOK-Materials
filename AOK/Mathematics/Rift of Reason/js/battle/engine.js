/*
 * Battle engine. PURE and deterministic: state + action → new state.
 *
 * Rules borrowed from Mindbug (Kudahl, Hegen, Garfield, Elias; Nerdlab 2022),
 * not its name, cards or text. Each player brings their own team as a deck
 * (10 creature instances, padded with loaned commons), draws a hand of 5 and
 * has 3 lives and 2 steals.
 *
 *   Turn: PLAY a creature from hand, or ATTACK with one creature on your board.
 *   Attack: the defender BLOCKS with one creature (lower power is defeated, a
 *     tie defeats both) or takes it and loses a life.
 *   Steal: right after the opponent plays a creature you may spend a steal to
 *     take it (it fights for you this battle only); the opponent then takes an
 *     extra turn. On-play effects go to whoever ends up controlling it.
 *   Hand refills to 5 at the end of your turn while your deck lasts.
 *   Win: opponent at 0 lives, or opponent can't act (no hand, deck or board).
 *   Round = both players have taken a turn. Each round one AXIOM flips face-up
 *   for both players and rewrites a rule (data/axioms.js).
 *   Colour wheel (data/axioms.js): +2 power when fighting the colour you beat.
 *
 * API (Rift.Battle.Engine):
 *   createBattle({ seed, players: [{ id, name, team: [instances], lives?, steals?, consumables? }],
 *                  axiomDeck: [ids], options })            → state
 *   legalActions(state)                                    → [action]  (for decider(state))
 *   applyAction(state, action)                             → new state (input untouched)
 *   winner(state)                                          → 0 | 1 | 'draw' | null
 *   decider(state)                                         → player index who must act, or null
 *   power(state, cid, foeCid?)  powerParts(...)            → effective power (+ breakdown)
 *   fightOutcome(state, attackerCid, blockerCid)           → preview of a fight (used by the AI)
 *   fullLog(state)                                         → every event so far, oldest first
 *   lostUids(state, p)                                     → instance uids owned by p that ended in a discard pile
 *
 * Actions: { type: 'play', cid } | { type: 'attack', cid, target? } | { type: 'pass' } | { type: 'end' }
 *          | { type: 'steal' } | { type: 'decline' } | { type: 'block', cid } | { type: 'take' }
 *          | { type: 'choose', choice }
 * Every action carries `player` in the list from legalActions.
 *
 * Events (state.lastEvents for the latest action, fullLog(state) for all):
 *   { t, text, publicText?, privateTo?, ...data } — show `text` to privateTo (or everyone
 *   when privateTo is undefined) and `publicText` to the other player.
 */
(function (root) {
    'use strict';

    const Rift = root.Rift;
    const Battle = Rift.Battle || (Rift.Battle = {});

    const DEFAULTS = {
        handSize: 5, lives: 3, steals: 2, teamSize: 10,
        maxTurns: 150, first: 'random', shuffle: true, shuffleAxioms: true, mode: 'practice',
    };
    const PAD_SPECIES = ['astrophysicat', 'zuckerborg', 'siuuugull'];

    const species = id => (Rift.data.creatures || {})[id];
    const abilityDefs = () => Battle.Abilities || {};
    const axiomDefs = () => Rift.data.axioms || {};

    // ---- small helpers ---------------------------------------------------------

    function removeFrom(list, item) {
        const i = list.indexOf(item);
        if (i >= 0) list.splice(i, 1);
        return i >= 0;
    }

    // Hand-written copy (much faster than JSON for 10,000-game simulations).
    // Nested objects that are only ever replaced, never mutated (options, hype,
    // prediction, boost entries, injured, consumables), are shared.
    function cloneState(state) {
        const cards = {};
        for (const cid in state.cards) {
            const c = state.cards[cid];
            const copy = { ...c };
            copy.gained = c.gained.slice();
            copy.boosts = c.boosts.slice();
            cards[cid] = copy;
        }
        const players = state.players.map(P => {
            const copy = { ...P };
            copy.deck = P.deck.slice();
            copy.hand = P.hand.slice();
            copy.board = P.board.slice();
            copy.discard = P.discard.slice();
            copy.knows = P.knows.slice();
            return copy;
        });
        const s = { ...state };
        s.roundTurns = state.roundTurns.slice();
        s.pending = state.pending ? { ...state.pending } : null;
        s.playCtx = state.playCtx ? { ...state.playCtx } : null;
        s.players = players;
        s.cards = cards;
        s.axioms = { ...state.axioms, deck: state.axioms.deck.slice(), discard: state.axioms.discard.slice() };
        s.lastEvents = [];
        return s;
    }

    // The log is an immutable linked list of event batches, so each action costs O(1).
    // fullLog(state) flattens it, oldest first.
    function fullLog(state) {
        const batches = [];
        for (let node = state.log; node; node = node.prev) batches.push(node.events);
        const out = [];
        for (let i = batches.length - 1; i >= 0; i--) out.push.apply(out, batches[i]);
        return out;
    }

    function currentAxiom(s) {
        const id = s.axioms.current;
        return id ? axiomDefs()[id] || null : null;
    }

    function axiomFlag(s, flag) {
        const a = currentAxiom(s);
        return !!(a && a[flag]);
    }

    function cardName(s, cid) {
        const c = s.cards[cid];
        if (!c) return '?';
        const base = (species(c.species) || {}).name || c.species;
        return c.nicknamedRound === s.round && c.nickname ? `"${c.nickname}"` : base;
    }

    function playerName(s, p) { return s.players[p].name; }

    // "Anna plays" / "You play": subject + verb that agrees with it.
    function says(s, p, verb) {
        const name = s.players[p].name;
        if (name !== 'You') return name + ' ' + verb;
        const base = { has: 'have', goes: 'go', passes: 'pass', wins: 'win', takes: 'take', chooses: 'choose',
            plays: 'play', steals: 'steal', lets: 'let', attacks: 'attack', loses: 'lose' }[verb] || verb;
        return 'You ' + base;
    }

    function abilitiesOf(card) {
        const list = [];
        if (card.ability) list.push(card.ability);
        (card.gained || []).forEach(a => { if (!list.includes(a)) list.push(a); });
        return list;
    }

    function activeAbilities(s, card, fctx) {
        if (!card) return [];
        if (axiomFlag(s, 'abilitiesOff')) return [];
        if (card.suppressedTurn === s.turn) return [];
        if (fctx && fctx.suppressed && fctx.suppressed[card.cid]) return [];
        return abilitiesOf(card);
    }

    function hasActive(s, card, ability, fctx) {
        return activeAbilities(s, card, fctx).includes(ability);
    }

    function eachActive(s, card, fctx, fn) {
        const defs = abilityDefs();
        activeAbilities(s, card, fctx).forEach(id => { if (defs[id]) fn(defs[id], id); });
    }

    // Colourless creatures (Memory, or nicknamed this round) count as 'memory'.
    function colourOf(s, card) {
        if (card.nicknamedRound === s.round) return 'memory';
        return card.colour || 'memory';
    }

    function wheelBonus(s, card, foe) {
        const W = Rift.data.wheel;
        if (!W || !foe) return 0;
        const a = colourOf(s, card), b = colourOf(s, foe);
        if (a === 'memory' || b === 'memory' || a === b) return 0;
        const wins = axiomFlag(s, 'wheelReversed') ? W.beats[b] === a : W.beats[a] === b;
        return wins ? W.bonus : 0;
    }

    const boardOf = (s, p) => s.players[p].board;

    // Helpers exposed to data hooks (abilities, axioms) and the AI.
    const H = {
        colourOf, boardOf, wheelBonus, cardName, playerName, abilitiesOf, activeAbilities, hasActive,
        power: (s, cid, foe, fctx) => power(s, cid, foe, fctx),
        currentAxiom, axiomFlag,
    };

    // ---- power -----------------------------------------------------------------

    function powerParts(s, cid, foeCid, fctx) {
        const c = s.cards[cid];
        const parts = [{ source: 'base', label: 'Base', amount: c.base }];
        (c.boosts || []).forEach(b => parts.push({ source: 'boost', label: b.label, amount: b.amount }));
        if (c.hype && s.players[c.controller].turnsTaken < c.hype.expires) {
            parts.push({ source: 'hype', label: 'Hype', amount: c.hype.amount });
        }
        eachActive(s, c, fctx, def => {
            if (def.powerMod) {
                const v = def.powerMod(s, c, H);
                if (v) parts.push({ source: 'ability', label: def.name, amount: v });
            }
        });
        const ax = currentAxiom(s);
        if (ax && ax.powerMod) {
            const v = ax.powerMod(s, c, H);
            if (v) parts.push({ source: 'axiom', label: ax.name, amount: v });
        }
        if (foeCid && s.cards[foeCid]) {
            const w = wheelBonus(s, c, s.cards[foeCid]);
            if (w) parts.push({ source: 'colour', label: 'Colour wheel', amount: w });
        }
        const total = Math.max(0, parts.reduce((sum, p) => sum + p.amount, 0));
        return { total, parts };
    }

    function power(s, cid, foeCid, fctx) {
        return powerParts(s, cid, foeCid, fctx).total;
    }

    // Preview (and the real resolution) of a fight. Pure.
    function fightOutcome(s, att, blk) {
        const fctx = { suppressed: {}, messages: [] };
        const blocker = s.cards[blk];
        eachActive(s, blocker, null, def => {
            if (def.fightPrep) {
                const msg = def.fightPrep(s, att, blk, fctx, H);
                if (msg) fctx.messages.push(msg);
            }
        });
        const pa = power(s, att, blk, fctx);
        const pb = power(s, blk, att, fctx);
        const ax = currentAxiom(s);
        const res = ax && ax.resolveFight
            ? ax.resolveFight(pa, pb)
            : { attackerDefeated: pa <= pb, blockerDefeated: pb <= pa };
        return { pa, pb, attackerDefeated: !!res.attackerDefeated, blockerDefeated: !!res.blockerDefeated, fctx };
    }

    // ---- queries ---------------------------------------------------------------

    function decider(s) {
        if (s.winner != null) return null;
        switch (s.phase) {
            case 'steal':
            case 'block':
            case 'choose':
            case 'axiom':
                return s.pending ? s.pending.player : null;
            case 'action':
            case 'haste':
                return s.active;
            default:
                return null;
        }
    }

    function canAttack(s, cid) {
        const c = s.cards[cid];
        if (!c || c.controller !== s.active || !s.players[s.active].board.includes(cid)) return false;
        let ok = true;
        eachActive(s, c, null, def => {
            if (def.canAttack && def.canAttack(s, c, H) === false) ok = false;
        });
        return ok;
    }

    function mustAttack(s, cid) {
        let must = false;
        eachActive(s, s.cards[cid], null, def => { if (def.mustAttack) must = true; });
        return must;
    }

    function canBeStolen(s, cid) {
        let ok = true;
        eachActive(s, s.cards[cid], null, def => { if (def.canBeStolen === false) ok = false; });
        return ok;
    }

    function canSteal(s, thief, cid) {
        return s.players[thief].steals > 0 && !axiomFlag(s, 'noSteals') && canBeStolen(s, cid);
    }

    function eligibleBlockers(s, att) {
        const a = s.cards[att];
        const d = 1 - a.controller;
        return s.players[d].board.filter(b => {
            let ok = true;
            eachActive(s, a, null, def => {
                if (def.canBeBlockedBy && !def.canBeBlockedBy(s, a, s.cards[b], H)) ok = false;
            });
            return ok;
        });
    }

    function attackVariants(s, cid, p) {
        const list = [{ type: 'attack', player: p, cid }];
        if (axiomFlag(s, 'attackerChoosesBlocker')) {
            eligibleBlockers(s, cid).forEach(b => list.push({ type: 'attack', player: p, cid, target: b }));
        }
        return list;
    }

    function legalActions(s) {
        if (s.winner != null) return [];
        const p = decider(s);
        if (p == null) return [];
        const P = s.players[p];
        switch (s.phase) {
            case 'action': {
                const attackers = P.board.filter(cid => canAttack(s, cid));
                const forced = attackers.filter(cid => mustAttack(s, cid));
                if (forced.length) return forced.flatMap(cid => attackVariants(s, cid, p));
                const plays = P.hand.map(cid => ({ type: 'play', player: p, cid }));
                const attacks = attackers.flatMap(cid => attackVariants(s, cid, p));
                const all = plays.concat(attacks);
                return all.length ? all : [{ type: 'pass', player: p }];
            }
            case 'haste': {
                const attacks = P.board.filter(cid => canAttack(s, cid)).flatMap(cid => attackVariants(s, cid, p));
                return attacks.concat([{ type: 'end', player: p }]);
            }
            case 'steal':
                return [{ type: 'steal', player: p }, { type: 'decline', player: p }];
            case 'block':
                return s.pending.options.map(cid => ({ type: 'block', player: p, cid }))
                    .concat([{ type: 'take', player: p }]);
            case 'choose':
            case 'axiom':
                return s.pending.options.map(choice => ({ type: 'choose', player: p, choice }));
            default:
                return [];
        }
    }

    function winner(s) { return s.winner == null ? null : s.winner; }

    function lostUids(s, p) {
        const out = [];
        s.players.forEach(P => P.discard.forEach(cid => {
            const c = s.cards[cid];
            if (c.owner === p && !c.loaner && !out.includes(c.uid)) out.push(c.uid);
        }));
        return out;
    }

    // ---- creation ----------------------------------------------------------------

    function padInstance(p, i) {
        return {
            uid: 'loan-' + p + '-' + i, species: PAD_SPECIES[i % PAD_SPECIES.length],
            powerDelta: 0, scars: [], injuries: [], warped: null, trophyOf: null, loaner: true,
        };
    }

    function makeCard(cid, inst, owner) {
        const sp = species(inst.species);
        if (!sp) throw new Error('Unknown species: ' + inst.species);
        const injuries = inst.injuries || [];
        return {
            cid, uid: inst.uid || cid, species: inst.species, owner, controller: owner,
            base: Math.max(0, sp.power + (inst.powerDelta || 0)),
            colour: sp.colour,
            ability: injuries.includes('no-ability') ? null : ((inst.warped && inst.warped.ability) || sp.ability || null),
            gained: [], boosts: [], hype: null,
            enteredTurn: null, suppressedTurn: null,
            nicknamedRound: null, nickname: null,
            metaverseUsed: false, prediction: null,
            legendary: sp.rarity === 'legendary',
            loaner: !!inst.loaner, trophyOf: inst.trophyOf || null,
            injured: injuries.slice(), warped: !!(inst.warped && inst.warped.ability),
            defeats: 0,
        };
    }

    function createBattle(config) {
        const cfg = config || {};
        const opts = Object.assign({}, DEFAULTS, cfg.options || {});
        const seed = String(cfg.seed == null ? 'battle' : cfg.seed);
        const rng = Rift.makeRng('battle:' + seed + ':0');
        const players = cfg.players || [];
        if (players.length !== 2) throw new Error('A battle needs exactly two players.');

        const s = {
            v: 1, seed, step: 0, turn: 1, round: 0, roundTurns: [false, false],
            active: 0, phase: 'setup', pending: null, playCtx: null, extraTurn: false,
            players: [], cards: {},
            axioms: { deck: [], discard: [], current: null, flips: 0 },
            winner: null, endReason: null, options: opts,
            log: null, lastEvents: [],
        };

        players.forEach((pl, i) => {
            const team = (pl.team || []).slice(0, opts.teamSize).filter(inst => inst && species(inst.species));
            let k = 0;
            while (team.length < opts.teamSize) team.push(padInstance(i, k++));
            const cids = team.map((inst, j) => {
                const cid = 'p' + i + 'c' + j;
                s.cards[cid] = makeCard(cid, inst, i);
                return cid;
            });
            const cons = pl.consumables || {};
            s.players.push({
                id: pl.id || ('p' + i),
                name: pl.name || (i === 0 ? 'You' : 'Opponent'),
                lives: (pl.lives == null ? opts.lives : pl.lives) + (cons['extra-life'] || 0),
                steals: (pl.steals == null ? opts.steals : pl.steals) + (cons['extra-steal'] || 0),
                deck: opts.shuffle ? rng.shuffle(cids) : cids,
                hand: [], board: [], discard: [],
                playedCount: 0, turnsTaken: 0,
                knows: [], peek: null, axiomChoice: false,
                consumables: Object.assign({}, cons),
            });
        });

        const known = axiomDefs();
        const ids = (cfg.axiomDeck || (Rift.data.axiomDecks || {}).starter || []).filter(id => known[id]);
        s.axioms.deck = opts.shuffleAxioms ? rng.shuffle(ids) : ids.slice();
        s.active = opts.first === 'random' ? rng.int(0, 1) : (opts.first ? 1 : 0);

        const G = { s, rng, events: [] };
        s.players.forEach((P, i) => refill(G, i));
        emit(G, { t: 'start', text: `${says(s, s.active, 'goes')} first.` });
        startTurn(G);
        s.lastEvents = G.events;
        s.log = { prev: null, events: G.events };
        return s;
    }

    // ---- applying actions --------------------------------------------------------

    function actionKey(a) {
        return [a.type, a.cid || '', a.target || '', a.choice == null ? '' : a.choice].join('|');
    }

    function applyAction(state, action) {
        if (!action) throw new Error('No action given.');
        const legal = legalActions(state);
        const key = actionKey(action);
        const match = legal.find(a => actionKey(a) === key);
        if (!match) throw new Error('Illegal action ' + JSON.stringify(action) + ' in phase ' + state.phase);
        const s = cloneState(state);
        s.step += 1;
        const G = { s, rng: Rift.makeRng('battle:' + s.seed + ':' + s.step), events: [] };
        switch (match.type) {
            case 'play': doPlay(G, match.cid); break;
            case 'attack': doAttack(G, match.cid, match.target || null); break;
            case 'pass':
                emit(G, { t: 'pass', player: s.active, text: `${playerName(s, s.active)} can't do anything: pass.` });
                endTurn(G);
                break;
            case 'end': endTurn(G); break;
            case 'steal': doSteal(G, true); break;
            case 'decline': doSteal(G, false); break;
            case 'block': resolveAttack(G, s.pending.attacker, match.cid); break;
            case 'take': resolveAttack(G, s.pending.attacker, null); break;
            case 'choose':
                if (s.phase === 'axiom') chooseAxiom(G, match.choice);
                else resolveChoice(G, match.choice);
                break;
            default: throw new Error('Unknown action ' + match.type);
        }
        s.lastEvents = G.events;
        s.log = { prev: state.log, events: G.events };
        return s;
    }

    function emit(G, ev) {
        ev.turn = G.s.turn;
        ev.round = G.s.round;
        G.events.push(ev);
    }

    // The api handed to ability hooks.
    function api(G) {
        const s = G.s;
        return {
            s, rng: G.rng, H,
            emit: ev => emit(G, ev),
            draw: p => draw(G, p),
            defeat: (cid, why) => defeat(G, cid, null, why),
            ask: req => ask(G, req),
            power: (cid, foe) => power(s, cid, foe),
            name: cid => cardName(s, cid),
            addBoost(card, label, amount) {
                card.boosts.push({ label, amount });
            },
            runOnPlay: (card, abilityId) => runOnPlay(G, card, abilityId),
        };
    }

    function draw(G, p) {
        const P = G.s.players[p];
        if (!P.deck.length) return null;
        const cid = P.deck.shift();
        P.hand.push(cid);
        emit(G, { t: 'draw', player: p, cid, privateTo: p, text: `You draw ${cardName(G.s, cid)}.`, publicText: null });
        return cid;
    }

    function refill(G, p) {
        const P = G.s.players[p];
        while (P.hand.length < G.s.options.handSize && P.deck.length) draw(G, p);
    }

    function resetCard(c) {
        c.boosts = [];
        c.hype = null;
        c.gained = [];
        c.prediction = null;
        c.nicknamedRound = null;
        c.nickname = null;
        c.enteredTurn = null;
        c.suppressedTurn = null;
    }

    function setWinner(G, p, reason) {
        const s = G.s;
        s.winner = p;
        s.endReason = reason;
        s.phase = 'over';
        s.pending = null;
        const text = p === 'draw' ? 'The battle ends in a draw.' : `${says(s, p, 'wins')} the battle!`;
        emit(G, { t: 'end', winner: p, reason, text });
    }

    // ---- turn structure ------------------------------------------------------------

    function startTurn(G) {
        const s = G.s;
        if (s.round === 0 || (s.roundTurns[0] && s.roundTurns[1])) {
            s.round += 1;
            s.roundTurns = [false, false];
            emit(G, { t: 'round', text: `Round ${s.round}.` });
            if (flipAxiom(G) === 'paused') return;
        }
        beginAction(G);
    }

    function beginAction(G) {
        const s = G.s;
        if (s.turn > s.options.maxTurns) { endByLimit(G); return; }
        const P = s.players[s.active];
        if (!P.hand.length && !P.deck.length && !P.board.length) {
            emit(G, { t: 'stuck', player: s.active, text: `${says(s, s.active, 'has')} no creatures left to play or attack with.` });
            setWinner(G, 1 - s.active, 'cannot-act');
            return;
        }
        s.phase = 'action';
        s.pending = null;
    }

    function endByLimit(G) {
        const s = G.s;
        const [a, b] = s.players;
        let w = 'draw';
        if (a.lives !== b.lives) w = a.lives > b.lives ? 0 : 1;
        else {
            const pa = a.board.reduce((t, cid) => t + power(s, cid), 0);
            const pb = b.board.reduce((t, cid) => t + power(s, cid), 0);
            if (pa !== pb) w = pa > pb ? 0 : 1;
        }
        emit(G, { t: 'limit', text: 'The rift is closing: the battle is decided on lives, then board strength.' });
        setWinner(G, w, 'turn-limit');
    }

    function endTurn(G) {
        const s = G.s;
        const p = s.active;
        s.pending = null;
        s.playCtx = null;
        refill(G, p);
        s.players[p].turnsTaken += 1;
        s.roundTurns[p] = true;
        if (s.winner != null) return;
        const next = s.extraTurn ? p : 1 - p;
        if (s.extraTurn) emit(G, { t: 'extra', player: p, text: `${says(s, p, 'takes')} an extra turn.` });
        s.extraTurn = false;
        s.turn += 1;
        s.active = next;
        startTurn(G);
    }

    function flipAxiom(G) {
        const s = G.s;
        const A = s.axioms;
        if (A.current) { A.discard.push(A.current); A.current = null; }
        if (!A.deck.length && A.discard.length) {
            A.deck = G.rng.shuffle(A.discard);
            A.discard = [];
            emit(G, { t: 'reshuffle', text: 'The axiom deck is reshuffled.' });
        }
        s.players.forEach(P => { P.peek = null; });
        if (!A.deck.length) return null;
        const chooser = [s.active, 1 - s.active].find(i => s.players[i].axiomChoice);
        if (chooser != null) {
            s.players[chooser].axiomChoice = false;
            s.phase = 'axiom';
            s.pending = { kind: 'axiom', player: chooser, options: A.deck.filter((id, i) => A.deck.indexOf(id) === i), prompt: 'Choose the next axiom.' };
            emit(G, { t: 'axiom-choice', player: chooser, text: `${says(s, chooser, 'chooses')} the next axiom.` });
            return 'paused';
        }
        setAxiom(G, A.deck.shift());
        return null;
    }

    function setAxiom(G, id) {
        const s = G.s;
        s.axioms.current = id;
        s.axioms.flips += 1;
        const ax = axiomDefs()[id];
        emit(G, { t: 'axiom', id, text: `Axiom: ${ax.name}. ${ax.text}` });
    }

    function chooseAxiom(G, id) {
        const s = G.s;
        const i = s.axioms.deck.indexOf(id);
        s.axioms.deck.splice(i, 1);
        s.pending = null;
        setAxiom(G, id);
        beginAction(G);
    }

    // ---- play and steal --------------------------------------------------------------

    function doPlay(G, cid) {
        const s = G.s;
        const p = s.active;
        const P = s.players[p];
        removeFrom(P.hand, cid);
        P.board.push(cid);
        const c = s.cards[cid];
        c.controller = p;
        c.enteredTurn = s.turn;
        P.playedCount += 1;
        s.players[1 - p].knows = s.players[1 - p].knows.filter(k => k !== cid);
        emit(G, { t: 'play', player: p, cid, text: `${says(s, p, 'plays')} ${cardName(s, cid)}.` });
        checkPredictions(G, p, c);
        if (canSteal(s, 1 - p, cid)) {
            s.phase = 'steal';
            s.pending = { kind: 'steal', player: 1 - p, cid };
            return;
        }
        resolvePlay(G, cid, false);
    }

    function checkPredictions(G, playedBy, played) {
        const s = G.s;
        const opp = 1 - playedBy;
        s.players[opp].board.forEach(cid => {
            const c = s.cards[cid];
            if (!c.prediction || c.prediction.target !== playedBy) return;
            const right = played.colour === c.prediction.colour;
            c.prediction = null;
            if (right) {
                c.boosts.push({ label: 'Predicted', amount: 3 });
                emit(G, { t: 'predict', cid, right: true, text: `${cardName(s, cid)} predicted it! +3 power.` });
            } else {
                emit(G, { t: 'predict', cid, right: false, text: `${cardName(s, cid)}'s prediction was wrong.` });
            }
        });
    }

    function doSteal(G, yes) {
        const s = G.s;
        const cid = s.pending.cid;
        const thief = s.pending.player;
        const victim = 1 - thief;
        s.pending = null;
        if (yes) {
            s.players[thief].steals -= 1;
            removeFrom(s.players[victim].board, cid);
            s.players[thief].board.push(cid);
            s.cards[cid].controller = thief;
            s.extraTurn = true;
            emit(G, { t: 'steal', player: thief, cid, text: `${says(s, thief, 'steals')} ${cardName(s, cid)}!` });
        } else {
            emit(G, { t: 'decline', player: thief, cid, text: `${says(s, thief, 'lets')} it be.` });
        }
        resolvePlay(G, cid, yes);
    }

    function runOnPlay(G, card, onlyAbility) {
        const s = G.s;
        const defs = abilityDefs();
        const list = onlyAbility ? [onlyAbility] : activeAbilities(s, card);
        for (const id of list) {
            const def = defs[id];
            if (def && def.onPlay) def.onPlay(api(G), card);
            if (s.phase === 'choose') return 'paused';
        }
        return null;
    }

    function resolvePlay(G, cid, stolen) {
        const s = G.s;
        s.phase = 'resolving';
        s.playCtx = { cid, stolen };
        if (runOnPlay(G, s.cards[cid]) === 'paused') return;
        afterPlay(G);
    }

    function afterPlay(G) {
        const s = G.s;
        const ctx = s.playCtx || {};
        s.playCtx = null;
        s.pending = null;
        if (s.winner != null) return;
        if (!ctx.stolen && axiomFlag(s, 'attackAfterPlay')
            && s.players[s.active].board.some(cid => canAttack(s, cid))) {
            s.phase = 'haste';
            emit(G, { t: 'haste', player: s.active, text: 'Haste: you may attack as well.', privateTo: s.active, publicText: null });
            return;
        }
        endTurn(G);
    }

    // Abilities ask questions through this: { player, kind, ability, cid, options, prompt, auto }.
    function ask(G, req) {
        const s = G.s;
        if (!req.options || !req.options.length) return false;
        if (req.options.length === 1 && req.auto !== false) {
            const def = abilityDefs()[req.ability];
            def.onChoose(api(G), s.cards[req.cid], req.options[0], req);
            return true;
        }
        s.phase = 'choose';
        s.pending = Object.assign({}, req, { kind: 'choose', choiceKind: req.kind });
        return true;
    }

    function resolveChoice(G, choice) {
        const s = G.s;
        const req = s.pending;
        s.pending = null;
        s.phase = 'resolving';
        const def = abilityDefs()[req.ability];
        def.onChoose(api(G), s.cards[req.cid], choice, req);
        if (s.phase === 'choose') return;
        afterPlay(G);
    }

    // ---- attacks and fights -----------------------------------------------------------

    function doAttack(G, cid, target) {
        const s = G.s;
        const p = s.active;
        const hidden = axiomFlag(s, 'hiddenAttacker');
        emit(G, {
            t: 'attack', player: p, cid, hidden,
            text: `${says(s, p, 'attacks')} with ${cardName(s, cid)}${hidden ? ' (face-down)' : ''}.`,
            privateTo: hidden ? p : undefined,
            publicText: hidden ? `${says(s, p, 'attacks')} with a face-down creature!` : undefined,
        });
        eachActive(s, s.cards[cid], null, def => { if (def.onAttack) def.onAttack(api(G), s.cards[cid]); });
        if (target) {
            emit(G, { t: 'force', cid: target, text: `Axiom of Choice: ${cardName(s, target)} must block.` });
            resolveAttack(G, cid, target);
            return;
        }
        const blockers = eligibleBlockers(s, cid);
        if (!blockers.length) { resolveAttack(G, cid, null); return; }
        s.phase = 'block';
        s.pending = { kind: 'block', player: 1 - p, attacker: cid, options: blockers, hidden };
    }

    function resolveAttack(G, att, blk) {
        const s = G.s;
        s.pending = null;
        s.phase = 'resolving';
        const p = s.active;
        const d = 1 - p;
        if (!blk) {
            s.players[d].lives -= 1;
            emit(G, {
                t: 'hit', player: d, cid: att,
                text: `${cardName(s, att)} gets through! ${says(s, d, 'loses')} a life (${s.players[d].lives} left).`,
            });
            if (s.players[d].lives <= 0) { setWinner(G, p, 'lives'); return; }
        } else {
            fight(G, att, blk);
        }
        if (s.winner == null) endTurn(G);
    }

    function fight(G, att, blk) {
        const s = G.s;
        const out = fightOutcome(s, att, blk);
        Object.keys(out.fctx.suppressed).forEach(cid => { s.cards[cid].suppressedTurn = s.turn; });
        out.fctx.messages.forEach(text => emit(G, { t: 'ability', text }));
        emit(G, {
            t: 'fight', attacker: att, blocker: blk, pa: out.pa, pb: out.pb,
            attackerDefeated: out.attackerDefeated, blockerDefeated: out.blockerDefeated,
            text: `${cardName(s, blk)} blocks: ${cardName(s, att)} ${out.pa} vs ${cardName(s, blk)} ${out.pb}.`,
        });
        if (out.blockerDefeated) defeat(G, blk, out.fctx, 'fight');
        if (out.attackerDefeated) defeat(G, att, out.fctx, 'fight');
        const ax = currentAxiom(s);
        const winners = [];
        if (out.blockerDefeated && !out.attackerDefeated) winners.push(att);
        if (out.attackerDefeated && !out.blockerDefeated) winners.push(blk);
        if (ax && ax.onFightWon) winners.forEach(cid => {
            ax.onFightWon(api(G), s.cards[cid]);
            emit(G, { t: 'axiom-effect', cid, text: `${ax.name}: ${cardName(s, cid)} grows stronger.` });
        });
        if (!out.blockerDefeated) {
            const b = s.cards[blk];
            eachActive(s, b, out.fctx, def => { if (def.onBlockSurvived) def.onBlockSurvived(api(G), b); });
        }
    }

    function defeat(G, cid, fctx, why) {
        const s = G.s;
        const c = s.cards[cid];
        const P = s.players[c.controller];
        if (!removeFrom(P.board, cid)) return;
        let dest = 'discard';
        let saver = null;
        eachActive(s, c, fctx, def => {
            if (dest === 'discard' && def.onDefeated && def.onDefeated(api(G), c) === 'hand') { dest = 'hand'; saver = def.name; }
        });
        if (dest === 'discard' && axiomFlag(s, 'defeatedToHand')) { dest = 'hand'; saver = currentAxiom(s).name; }
        const name = cardName(s, cid);
        resetCard(c);
        c.defeats += 1;
        if (dest === 'hand') P.hand.push(cid); else P.discard.push(cid);
        emit(G, {
            t: 'defeated', cid, player: c.controller, dest, why,
            text: dest === 'hand' ? `${name} is defeated, but ${saver} sends it back to the hand.` : `${name} is defeated.`,
        });
    }

    // ---- setup helpers -------------------------------------------------------------

    // The starter axioms plus every axiom in the players' pools, no duplicates.
    function buildAxiomDeck() {
        const out = ((Rift.data.axiomDecks || {}).starter || []).slice();
        Array.prototype.slice.call(arguments).forEach(pool => (pool || []).forEach(id => {
            if (axiomDefs()[id] && !out.includes(id)) out.push(id);
        }));
        return out;
    }

    // A random team of n instances, weighted by rarity (for the simulator and bench).
    // opts: { legendaries: bool (default true), prefix: uid prefix }
    function randomTeam(rng, n, opts) {
        const o = opts || {};
        const all = Rift.data.creatures || {};
        const rar = Rift.data.rarities || {};
        const weights = Object.keys(all)
            .filter(id => o.legendaries !== false || all[id].rarity !== 'legendary')
            .map(id => ({ item: id, weight: (rar[all[id].rarity] || { weight: 1 }).weight }));
        const team = [];
        for (let i = 0; i < n; i++) {
            team.push({
                uid: (o.prefix || 'r') + '-' + i, species: rng.weighted(weights), caughtAt: 0,
                powerDelta: 0, scars: [], injuries: [], warped: null, trophyOf: null, wins: 0,
            });
        }
        return team;
    }

    Battle.Engine = {
        buildAxiomDeck, randomTeam,
        DEFAULTS, PAD_SPECIES,
        createBattle, legalActions, applyAction, winner, decider,
        power, powerParts, fightOutcome, eligibleBlockers, canAttack, canSteal,
        colourOf, wheelBonus, abilitiesOf, activeAbilities, currentAxiom, axiomFlag,
        cardName, says, lostUids, actionKey, cloneState, fullLog, H,
    };
})(typeof window !== 'undefined' ? window : globalThis);
