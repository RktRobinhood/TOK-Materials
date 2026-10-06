/*
 * Battle engine. PURE and deterministic: state + action → new state.
 *
 * Energy grows 1→2→3 each personal turn, refills and caps at 10.
 * Spend up to three actions, then End turn. Play costs energy; attack is free;
 * activate and rewrite cost two. Attack, block and activate exhaust a creature.
 * Arriving creatures can block but attack/activate next turn. Six hearts.
 * Shared axioms persist by category; paid rewrites replace that category only.
 * The visible timeline flips/reset rules every three rounds, starting round four.
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
        handSize: 5, lives: 6, steals: 0, teamSize: 10, energyCap: 10, timeline: true,
        maxTurns: 80, first: 'random', shuffle: true, shuffleAxioms: true, mode: 'practice',
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
        s.axioms = { ...state.axioms, active: { ...state.axioms.active }, deck: state.axioms.deck.slice(), discard: state.axioms.discard.slice() };
        s.fate = { ...state.fate };
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

    function currentAxiom(s) { return axiomDefs()[s.axioms.current] || null; }

    function activeAxioms(s) {
        const active = Object.assign({}, s.axioms.active);
        // Also supports previewing a proposed axiom without mutating the battle.
        const last = currentAxiom(s);
        if (last) active[last.category] = last.id;
        return Object.values(active).map(id => axiomDefs()[id]).filter(Boolean);
    }

    // Many power/AI queries share the same rule combination. Bound the cache and
    // freeze results; the key also detects externally constructed preview states.
    const ruleCache=new Map();
    function rules(s) {
        const key=s.axioms.current+'|'+Object.values(s.axioms.active||{}).join('|');
        if(ruleCache.has(key))return ruleCache.get(key);
        const out = { actions: 3, abilityCost: 2, rewriteCost: 2, playCostDelta: 0,
            growth: 1, draw: 1, exhaust: true, arrivalReady: false, reverseHearts: false };
        activeAxioms(s).forEach(a => Object.assign(out, a.rules || {}));
        if(ruleCache.size>=128)ruleCache.delete(ruleCache.keys().next().value);
        ruleCache.set(key,Object.freeze(out));
        return out;
    }

    function playCost(s, cid) { return Math.max(1, Math.ceil(s.cards[cid].base / 2) - 1 + rules(s).playCostDelta); }
    function actionsLeft(s) { return Math.max(0, rules(s).actions - s.actionsUsed); }
    function activations(s, cid) {
        const card = s.cards[cid];
        const ids = activeAbilities(s, card);
        if (!ids.length) return [];
        const list = ids.filter(id => abilityDefs()[id].onActivate).map(id => ({id, name: abilityDefs()[id].name, text: abilityDefs()[id].text}));
        if (!list.length && (card.focus || 0) < 3) list.push({id:'focus', name:'Focus', text:'Gain +1 power for this battle (up to +3 from Focus).'});
        return list;
    }
    function readyToUse(s, cid) {
        const c = s.cards[cid];
        return c && !c.exhausted && (c.enteredTurn !== s.turn || rules(s).arrivalReady);
    }
    function spend(G, amount, text) {
        G.s.players[G.s.active].energy -= amount;
        G.s.actionsUsed += 1;
        emit(G, {t:'spend', player:G.s.active, text:text + ' Spend ' + amount + ' energy and 1 action.'});
    }
    function exhaust(G, cid) {
        if (rules(G.s).exhaust) G.s.cards[cid].exhausted = true;
    }
    function timeline(s) {
        if (!s.options.timeline) return [];
        return [0,1].map(offset=>{
            const turns=s.fate.until+offset*6, reset=(s.fate.events+offset)%2===1;
            return {turns,turn:s.turn+turns,round:Math.floor((s.turn+turns-1)/2)+1,type:reset?'reset':'flip',
                text:reset?'Reset all rules to the basics':offset?'Free flip from the shared deck':s.axioms.deck.length?'Free flip: '+axiomDefs()[s.axioms.deck[0]].name:'No unused rule to flip'};
        });
    }
    function ruleSummary(s) {
        const r = rules(s);
        const combat = activeAxioms(s).find(a => a.category === 'combat');
        return [
            ['Win', r.reverseHearts ? 'Reach zero of YOUR OWN hearts to win.' : 'Reduce the opponent to zero hearts to win.'],
            ['Actions', r.actions + ' per turn. End turn when ready.'],
            ['Energy', 'Gain +' + r.growth + ' capacity and refill each turn; maximum ' + s.options.energyCap + '.'],
            ['Cards', 'Draw ' + r.draw + ' at turn start. Play costs shown on each card.'],
            ['Combat', (combat ? combat.text : 'Higher power wins; a tie defeats both.') + ' Unblocked attacks remove 1 heart.'],
            ['Readiness', (r.arrivalReady ? 'New creatures can act immediately. ' : 'New creatures may block, but act next turn. ') + (r.exhaust ? 'Attack, block or activate: exhaust until your next turn.' : 'Creatures do not exhaust.')],
            ['Abilities', axiomFlag(s,'abilitiesOff') ? 'Creature abilities are off.' : 'Activate for ' + r.abilityCost + ' energy and 1 action. Passive effects stay on.'],
            ['Rewrite', 'Pay ' + r.rewriteCost + ' energy and 1 action. Replace only the chosen rule category.'],
        ];
    }

    function axiomFlag(s, flag) { return activeAxioms(s).some(a => !!a[flag]); }

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
            plays: 'play', steals: 'steal', lets: 'let', attacks: 'attack', loses: 'lose', ends: 'end' }[verb] || verb;
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
        activeAxioms(s).forEach(ax => {
            if (ax.powerMod) { const v = ax.powerMod(s, c, H); if (v) parts.push({source:'axiom', label:ax.name, amount:v}); }
        });
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
        const ax = activeAxioms(s).find(a => a.resolveFight);
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
        if (!readyToUse(s, cid) || c.controller !== s.active || !s.players[s.active].board.includes(cid)) return false;
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
            if (s.cards[b].exhausted) return false;
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
        const p = decider(s); if (p == null) return [];
        const P = s.players[p];
        if (s.phase === 'action') {
            const list = [{type:'end', player:p}];
            if (!actionsLeft(s)) return list;
            P.hand.filter(cid => playCost(s,cid) <= P.energy).forEach(cid => list.push({type:'play', player:p, cid}));
            P.board.forEach(cid => {
                if (canAttack(s,cid)) list.push(...attackVariants(s,cid,p));
                if (readyToUse(s,cid) && P.energy >= rules(s).abilityCost) activations(s,cid).forEach(a => list.push({type:'activate',player:p,cid,ability:a.id}));
            });
            if (P.energy >= rules(s).rewriteCost) s.axioms.deck.slice(0,3).forEach(choice => list.push({type:'rewrite',player:p,choice}));
            return list;
        }
        if (s.phase === 'steal') return [{type:'steal',player:p},{type:'decline',player:p}];
        if (s.phase === 'block') return s.pending.options.map(cid => ({type:'block',player:p,cid})).concat([{type:'take',player:p}]);
        if (s.phase === 'choose' || s.phase === 'axiom') return s.pending.options.map(choice => ({type:'choose',player:p,choice}));
        return [];
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
            defeats: 0, exhausted: false, focus: 0,
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
            v: 2, actionsUsed: 0, seed, step: 0, turn: 1, round: 0, roundTurns: [false, false],
            active: 0, phase: 'setup', pending: null, playCtx: null, extraTurn: false,
            players: [], cards: {},
            axioms: { deck: [], discard: [], active: {}, current: null, flips: 0 },
            fate: {until:6,events:0},
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
                playedCount: 0, turnsTaken: 0, energy: 0, capacity: 0,
                knows: [], peek: null, axiomChoice: false,
                consumables: Object.assign({}, cons),
            });
        });

        const known = axiomDefs();
        const ids = (cfg.axiomDeck || buildAxiomDeck(players[0].axioms,players[1].axioms)).filter(id => known[id]);
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
        return [a.type, a.cid || '', a.target || '', a.choice == null ? '' : a.choice, a.ability || ''].join('|');
    }

    function applyAction(state, action) {
        if (!action) throw new Error('No action given.');
        if (action.player != null && action.player !== decider(state)) throw new Error('Wrong player.');
        const legal = legalActions(state);
        const key = actionKey(action);
        const match = legal.find(a => actionKey(a) === key);
        if (!match) throw new Error('Illegal action ' + JSON.stringify(action) + ' in phase ' + state.phase);
        const s = cloneState(state);
        s.step += 1;
        const G = { s, rng: Rift.makeRng('battle:' + s.seed + ':' + s.step), events: [] };
        switch (match.type) {
            case 'play': doPlay(G, match.cid); break;
            case 'activate': doActivate(G, match.cid, match.ability); break;
            case 'rewrite': spend(G, rules(s).rewriteCost, 'Rewrite.'); removeFrom(s.axioms.deck, match.choice); setAxiom(G, match.choice); beginAction(G); break;
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
            rewrite(id) { removeFrom(s.axioms.deck,id); setAxiom(G,id); },
            shiftFate(turns) { shiftFate(G,turns); },
            emit: ev => emit(G, ev),
            draw: p => draw(G, p),
            defeat: (cid, why) => defeat(G, cid, null, why),
            ask: req => ask(G, req),
            power: (cid, foe) => power(s, cid, foe),
            name: cid => cardName(s, cid),
            addBoost(card, label, amount) {
                card.boosts.push({ label, amount });
            },
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
        c.exhausted = false; c.focus = 0;
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
            s.round += 1; s.roundTurns = [false,false];
            emit(G,{t:'round',text:'Round ' + s.round + '.'});
        }
        const P = s.players[s.active], r = rules(s);
        s.actionsUsed = 0;
        P.capacity = Math.min(s.options.energyCap, P.capacity + r.growth);
        P.energy = P.capacity + (P.consumables['extra-energy'] || 0);
        P.board.forEach(cid => {s.cards[cid].exhausted = false;});
        if (P.turnsTaken) for (let i=0; i<r.draw; i++) draw(G,s.active);
        emit(G,{t:'turn',player:s.active,text:playerName(s,s.active) + ': ' + P.energy + ' energy, ' + r.actions + ' actions. Creatures ready.'});
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

    function endByLimit(G) { emit(G,{t:'limit',text:'The rift closes after ' + G.s.options.maxTurns + ' turns. Draw.'}); setWinner(G,'draw','turn-limit'); }

    function endTurn(G) {
        const s = G.s;
        const p = s.active;
        s.pending = null;
        s.playCtx = null;
        emit(G,{t:'turn-end',player:p,text:says(s,p,'ends') + ' the turn. Unspent energy is lost.'});
        s.players[p].turnsTaken += 1;
        s.roundTurns[p] = true;
        if (s.winner != null) return;
        const next = s.extraTurn ? p : 1 - p;
        if (s.extraTurn) emit(G, { t: 'extra', player: p, text: `${says(s, p, 'takes')} an extra turn.` });
        s.extraTurn = false;
        s.turn += 1;
        s.active = next;
        shiftFate(G,1);
        startTurn(G);
    }

    // Positive shifts advance toward the event; negative shifts delay it.
    function shiftFate(G,turns) {
        const s=G.s;
        if(!s.options.timeline)return;
        s.fate.until=Math.max(0,Math.min(12,s.fate.until-turns));
        if(s.fate.until)return;
        if(s.fate.events%2===1){
            s.axioms.discard.push(...Object.values(s.axioms.active));s.axioms.active={};s.axioms.current=null;
            refillAxioms(G);emit(G,{t:'reset',text:'Fate reset: all rules return to the basics.'});
        }else flipAxiom(G);
        s.fate.events++;s.fate.until=6;
    }

    function refillAxioms(G) {
        const A = G.s.axioms;
        if (!A.deck.length && A.discard.length) { A.deck = G.rng.shuffle(A.discard); A.discard = []; }
    }

    function flipAxiom(G) {
        const A = G.s.axioms;
        if (A.deck.length) setAxiom(G,A.deck.shift());
    }

    function setAxiom(G, id) {
        const A = G.s.axioms, ax = axiomDefs()[id];
        const old = A.active[ax.category]; if (old) A.discard.push(old);
        A.active[ax.category] = id; A.current = id; A.flips += 1;
        refillAxioms(G);
        G.s.players.forEach(P => {P.peek = null;});
        emit(G,{t:'axiom',id,text:'Rule change — ' + ax.category + ': ' + ax.name + '. ' + ax.text});
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
        spend(G, playCost(s,cid), 'Play ' + cardName(s,cid) + '.');
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

    function runActivation(G, card, onlyAbility) {
        const s = G.s;
        const defs = abilityDefs();
        const list = onlyAbility ? [onlyAbility] : activeAbilities(s, card);
        for (const id of list) {
            const def = defs[id];
            if (def && def.onActivate) def.onActivate(api(G), card);
            if (s.phase === 'choose') return 'paused';
        }
        return null;
    }

    function resolvePlay(G, cid, stolen) { G.s.playCtx = null; beginAction(G); }

    function finishActivation(G) { G.s.playCtx = null; G.s.pending = null; if (G.s.winner == null) beginAction(G); }

    function doActivate(G, cid, ability) {
        const card = G.s.cards[cid];
        spend(G,rules(G.s).abilityCost,'Activate ' + cardName(G.s,cid) + '.'); exhaust(G,cid);
        G.s.playCtx = {cid}; G.s.phase = 'resolving';
        if (ability === 'focus') {card.focus += 1; card.boosts.push({label:'Focus',amount:1}); emit(G,{t:'ability',cid,text:cardName(G.s,cid) + ' focuses: +1 power.'});}
        else if (runActivation(G,card,ability) === 'paused') return;
        finishActivation(G);
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
        finishActivation(G);
    }

    // ---- attacks and fights -----------------------------------------------------------

    function doAttack(G, cid, target) {
        const s = G.s;
        const p = s.active;
        spend(G,0,'Attack with ' + cardName(s,cid) + '.'); exhaust(G,cid);
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
            if (s.players[d].lives <= 0) { setWinner(G, rules(s).reverseHearts ? d : p, rules(s).reverseHearts ? 'reverse-hearts' : 'lives'); return; }
        } else {
            exhaust(G,blk); fight(G, att, blk);
        }
        if (s.winner == null) beginAction(G);
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
        const ax = activeAxioms(s).find(a => a.onFightWon);
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
        if (dest === 'discard' && axiomFlag(s, 'defeatedToHand')) { dest = 'hand'; saver = 'Mercy'; }
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

    function axiomSelection(pool) {
        const out=[];
        (pool||[]).concat((Rift.data.axiomDecks||{}).default||[]).forEach(id=>{
            if(out.length<10&&axiomDefs()[id]&&!out.includes(id))out.push(id);
        });
        return out;
    }
    // Ten distinct cards from each side. Copies between sides remain in the shared deck.
    function buildAxiomDeck(mine,theirs) {
        return axiomSelection(mine).concat(axiomSelection(theirs));
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
        buildAxiomDeck, axiomSelection, randomTeam, rules, activeAxioms, playCost, actionsLeft, activations, readyToUse, timeline, ruleSummary,
        DEFAULTS, PAD_SPECIES,
        createBattle, legalActions, applyAction, winner, decider,
        power, powerParts, fightOutcome, eligibleBlockers, canAttack, canSteal,
        colourOf, wheelBonus, abilitiesOf, activeAbilities, currentAxiom, axiomFlag,
        cardName, says, lostUids, actionKey, cloneState, fullLog, H,
    };
})(typeof window !== 'undefined' ? window : globalThis);
