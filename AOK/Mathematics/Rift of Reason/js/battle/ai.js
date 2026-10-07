/*
 * Battle AI for the Card Arena rules (design/card-arena-2026-10-07.md), three levels:
 * Normal, Competent and Expert (design/card-arena-expansion-2026-10-07.md section 8).
 * Old names still work: 'easy' means 'normal' and 'hard' means 'competent' (saves, team
 * codes, older callers). Deterministic: the same state, level and salt always give the
 * same action. The only randomness comes from
 * Rift.makeRng('ai:' + seed + ':' + step + ':' + level + ':' + salt) (level = the canonical name),
 * and Expert's search is limited by fixed counts, never by the clock.
 *
 * How it thinks (one-ply lookahead):
 *   every legal action (identical attackers/targets/cards grouped) is applied with
 *   Engine.applyLegal (applyAction minus the re-check) and the resulting state is scored by evaluate() from the
 *   acting player's view; the action with the best gain over the current state wins,
 *   and 'end' is just another action. Pending questions (cards, colours, axioms,
 *   true/false, forward/rewind) are answered the same way. The draw choice is scored
 *   without peeking at the deck: a card is worth a flat amount, the top shared axiom
 *   is public (the Fate track shows it), and Fate moves are simulated.
 *
 *   evaluate(): hearts (each heart is worth more when you are low; the sign flips
 *   under The Last Shall Be First), creatures (attack, current health, keywords,
 *   ability values, Guard when your hero is low), cards in hand, the threat of lethal
 *   next turn and running out of creatures. "Deep" scoring (axiom cards, Fate moves)
 *   also counts who wins the fights on the board and the next Fate event. Energy is
 *   spent on the best combination of scored plays (a small knapsack), not greedily.
 *
 *   Both levels develop their board: End turn never wins over playing an affordable
 *   creature into an open space unless every such play scores below DEVELOP_FLOOR.
 *
 *   competent (was 'hard'): all of the above, plus an explicit lethal check and
 *         whole-turn rollouts (with and without each axiom card) before playing an axiom card.
 *   normal (was 'easy', made a little sharper): weaker CHOICES, never sitting still: no
 *         threat terms, likes hitting the hero more, sometimes (LEVELS.normal.mistake) picks
 *         a random second-rate useful move instead of the best one, and once nothing is
 *         left to play sometimes (5%) holds back an attack. It takes an obvious lethal
 *         attack, draws from its deck (always when it has no creature it can pay for), and
 *         never plays the big twists (NORMAL_TWISTS: The Last Shall Be First, Empty Set).
 *   expert: Competent's scoring plus a whole-turn search: a lethal search over this
 *         turn's attacks, tactics and plays (EXPERT.lethalNodes), then the best few
 *         one-ply candidates (and promising axiom cards) are each followed by a greedy
 *         rollout of the rest of the turn and the opponent's greedy attacks with the creatures
 *         already in play (EXPERT.reply), and compared on the deep score (EXPERT.width).
 *         It also keeps removal tactics for real threats (EXPERT.holdRemoval) and counts
 *         lethal next turn (a two-turn plan) and the race clock. Bosses use it with a
 *         built deck (data/decks.js).
 *   beginner: a test-only stand-in for a new student (the old Easy, 40% random second-rate
 *         moves, no lethal check). Never offered as an opponent in the game.
 *   Simulated ladder: design/reviews/card-arena-balance-2026-10-07.md (`--ladder`).
 *
 *   The Bag: the AI never uses items (it ignores 'item' actions, also for a player it simulates).
 *
 *   Hidden information: the AI never looks at the opponent's hand or deck order. The
 *   Predict colour guess uses the opponent's public team list minus the cards seen.
 *   Bag item actions ({ type: 'item' }) are never chosen by the AI.
 *
 * Rift.Battle.AI = {
 *   choose(state, { level: 'normal' | 'competent' | 'expert' (or 'easy'/'hard'), salt? })
 *       → an action from Engine.legalActions(state)
 *   playOut(state, levels, onStep?) → final state (levels[p] for player p)
 *   evaluate(state, player, { level?, deep? }) → number (higher is better for player)
 *   levelOf(name) → 'normal' | 'competent' | 'expert' | 'beginner'; LEVELS, LEVEL_NAMES (student labels)
 *   MISTAKE, EARLY_END, NORMAL_TWISTS (= EASY_TWISTS), EXPERT
 * }
 */
(function (root) {
    'use strict';

    const Rift = root.Rift;
    const Battle = Rift.Battle || (Rift.Battle = {});
    const E = () => Battle.Engine;
    // Legal actions without bag items (the AI does not use items).
    const legalFor = s => E().legalActions(s).filter(a => a.type !== 'item');

    // ---- levels -------------------------------------------------------------------------
    //   simple   Normal-style main phase (one-ply, random second-rate moves, deck draws)
    //   threat   lethal-next-turn terms and Guard-when-low in the evaluation
    //   deep     rule changes, Fate and axiom cards scored with fights and the next Fate event
    //   lethal   take an obvious lethal attack on the hero first
    //   twists   may play The Last Shall Be First / Empty Set
    //   search   Expert's whole-turn search
    const LEVELS = {
        beginner: { simple: true, mistake: 0.4, earlyEnd: 0.05, faceBias: 2.2, threat: false, deep: false, lethal: false, twists: false, search: false },
        normal: { simple: true, mistake: 0.2, earlyEnd: 0.05, faceBias: 1.8, threat: false, deep: false, lethal: true, twists: false, search: false },
        competent: { simple: false, mistake: 0, earlyEnd: 0, faceBias: 1, threat: true, deep: true, lethal: true, twists: true, search: false },
        expert: { simple: false, mistake: 0, earlyEnd: 0, faceBias: 1, threat: true, deep: true, lethal: true, twists: true, search: true },
    };
    const ALIASES = { easy: 'normal', hard: 'competent' };
    // What a student sees (only the three opponent levels).
    const LEVEL_NAMES = { normal: 'Normal', competent: 'Competent', expert: 'Expert' };
    function levelOf(name) {
        const n = ALIASES[name] || name;
        return LEVELS[n] ? n : 'competent';
    }
    const perLevel = key => {
        const out = {};
        Object.keys(LEVELS).forEach(k => { out[k] = LEVELS[k][key]; });
        Object.keys(ALIASES).forEach(k => { out[k] = LEVELS[ALIASES[k]][key]; });
        return out;
    };
    const MISTAKE = perLevel('mistake');
    const EARLY_END = perLevel('earlyEnd');
    // Expert's search limits (counts, so the same state always gives the same move).
    //   lethalNodes / lethalDepth  states tried / actions deep when looking for a win this turn
    //   width       one-ply candidates followed by a rollout of the rest of the turn
    //   axioms      axiom cards also tried that way
    //   holdRemoval extra worth of a removal tactic kept in hand (spent on real threats)
    //   nextLethal  bonus when my board threatens lethal next turn (a two-turn plan)
    //   race        weight of the race clock (turns until each hero falls at the current pace)
    //   work        budget of scored actions per decision (rollouts and replies); a hard cap on time
    //   reply       1: each candidate turn is scored after the opponent's greedy attacks with the
    //               creatures already in play (public board only; +3 points vs Competent in the ladder)
    const EXPERT = { lethalNodes: 150, lethalDepth: 7, width: 4, axioms: 2, holdRemoval: 1.2, nextLethal: 4, race: 0.6, reply: 1, work: 1500 };
    // A creature play scored at least this much (vs ending the turn) is still made rather than passing.
    const DEVELOP_FLOOR = -1.5;
    const WIN = 1000;
    const HAND_CARD = 1.0;
    const AXIOM_CARD = 0.6;
    // Evaluation weights (Hard). Tests and the simulator may override some with { weights }.
    const WEIGHTS = { atk: 1.0, hp: 0.9, hearts: 1.3, threat: 1, race: 0 };

    const isHero = t => t === 'h0' || t === 'h1';

    // Each heart is worth a bit more when you are low.
    function heartValue(h) { return h <= 0 ? -4 : h + 6 * (1 - Math.pow(0.75, h)); }

    function tempAttack(c) {
        let n = 0;
        for (const b of c.buffs) if (b.temp && b.attack) n += b.attack;
        return n;
    }

    function abilityDefs() { return Battle.Abilities || {}; }

    function abilityIdsOf(s, c) {
        const r = E().rules(s);
        if (!c || c.silenced || r.abilitiesOff) return [];
        const out = [];
        if (c.ability && abilityDefs()[c.ability]) out.push(c.ability);
        c.gained.forEach(a => { if (abilityDefs()[a] && !out.includes(a)) out.push(a); });
        return out;
    }

    // ---- creature value ------------------------------------------------------------

    function creatureValue(s, cid, ctx) {
        const Eng = E();
        const c = s.cards[cid];
        const p = c.controller;
        const atk = Math.max(0, Eng.attackOf(s, cid) - tempAttack(c));
        const hp = Eng.healthOf(s, cid).current;
        if (hp <= 0) return 0;
        let v = atk * ctx.w.atk + hp * ctx.w.hp + 0.4;
        const kws = Eng.keywordsOf(s, cid);
        const r = Eng.rules(s);
        if (kws.includes('guard') && !r.ignoreGuard) {
            v += 0.6;
            const h = s.players[p].hearts;
            if (ctx.cfg.threat && !r.reverseHearts && h <= 6) v += (7 - h) * 0.3;
        }
        if (kws.includes('shield')) v += 1.2;
        if (kws.includes('elusive')) v += 0.4;
        const ids = abilityIdsOf(s, c);
        for (const id of ids) {
            const def = abilityDefs()[id];
            if (def.ai) v += def.ai(s, c, Eng.H) || 0;
            if (def.attacksPerTurn > 1) v += atk * 0.5;
            if (def.heroDamage) v += def.heroDamage * 0.5;
            if (def.damageReduction) v += def.damageReduction;
            if (def.hidden && def.hidden(s, c, Eng.H)) v += 1.2;
            if (def.lastWord && !c.metaverseUsed) v += 1;
        }
        if (r.attacksPerCreature > 1) v += atk * 0.3;
        if (c.frozen) v -= atk * 0.4;
        if (c.prediction) v += 1;
        return v;
    }

    function boardValue(s, p, ctx) {
        let v = 0;
        for (const cid of s.players[p].board) v += creatureValue(s, cid, ctx);
        return v;
    }

    // Energy an action spends and the card/rule it uses up (null: free).
    function resourceOf(s, a) {
        const Eng = E();
        if (a.type === 'play') return { id: a.cid, cost: Eng.playCost(s, a.cid) };
        if (a.type === 'axiom') return { id: 'ax:' + a.choice, cost: Eng.axiomCost(s, a.choice) };
        if (a.type === 'activate') {
            const def = Eng.activations(s, a.cid).find(x => x.id === a.ability);
            return { id: a.cid, cost: def ? def.cost : 0 };
        }
        return null;
    }

    // Best total gain from spending this much energy on the scored actions (0/1 knapsack over
    // cards; each card counts once with its best use). Returns { value, ids }.
    function energyPlan(s, scored, energy) {
        const best = {};
        for (const x of scored) {
            const r = resourceOf(s, x.a);
            if (!r || r.cost <= 0 || x.score <= 0.05 || r.cost > energy) continue;
            if (!best[r.id] || best[r.id].gain < x.score) best[r.id] = { id: r.id, cost: r.cost, gain: x.score };
        }
        const items = Object.values(best);
        const table = new Array(energy + 1).fill(null).map(() => ({ value: 0, ids: [] }));
        for (const it of items) {
            for (let e = energy; e >= it.cost; e--) {
                const v = table[e - it.cost].value + it.gain;
                if (v > table[e].value) table[e] = { value: v, ids: table[e - it.cost].ids.concat([it.id]) };
            }
        }
        return table[energy];
    }

    // Hero damage p's creatures could deal next turn, roughly (Guard soaks some).
    function facePotential(s, p) {
        const Eng = E();
        const r = Eng.rules(s);
        const foe = 1 - p;
        const guards = s.players[foe].board.filter(cid => Eng.keywordsOf(s, cid).includes('guard') && !Eng.isHidden(s, cid));
        let soak = 0;
        if (guards.length && !r.ignoreGuard) for (const g of guards) soak += Eng.healthOf(s, g).current;
        const hits = [];
        for (const cid of s.players[p].board) {
            const c = s.cards[cid];
            if (c.frozen && s.active !== p) continue;
            let dmg = Eng.attackOf(s, cid) - tempAttack(c);
            if (dmg <= 0) continue;
            let n = r.attacksPerCreature;
            let bypass = false;
            for (const id of abilityIdsOf(s, c)) {
                const def = abilityDefs()[id];
                if (def.heroDamage) dmg += def.heroDamage;
                if (def.attacksPerTurn) n = Math.max(n, def.attacksPerTurn);
                if (def.ignoresGuard) bypass = true;
            }
            if (r.heroDamageCap != null) dmg = Math.min(dmg, r.heroDamageCap);
            for (let i = 0; i < n; i++) hits.push({ dmg, bypass });
        }
        hits.sort((a, b) => b.dmg - a.dmg);
        const limited = r.attackLimit === Infinity ? hits : hits.slice(0, r.attackLimit);
        let total = 0;
        for (const h of limited) {
            if (h.bypass || soak <= 0) total += h.dmg;
            else soak -= h.dmg;
        }
        return total;
    }

    function creatureCount(s, p) {
        const P = s.players[p];
        let n = 0;
        for (const z of [P.deck, P.hand, P.board]) for (const cid of z) if (s.cards[cid].kind === 'creature') n++;
        return n;
    }

    // Creatures in p's hand that p could pay for this turn.
    function playableCreatures(s, p) {
        const P = s.players[p];
        const energy = P.energy;
        return P.hand.filter(cid => s.cards[cid].kind === 'creature' && E().playCost(s, cid) <= energy).length;
    }

    function handValue(s, p, ctx) {
        const P = s.players[p];
        let v = Math.min(P.hand.length, 7) * HAND_CARD + Math.max(0, P.hand.length - 7) * 0.4;
        if (ctx.me === p && ctx.axVal) for (const id of P.axHand) v += AXIOM_CARD + Math.max(0, ctx.axVal[id] || 0) * 0.5;
        else v += P.axHand.length * (AXIOM_CARD + 0.4);
        if (ctx.me === p && ctx.cfg.search) v += EXPERT.holdRemoval * removalInHand(s, p);
        return v;
    }

    // Removal tactics in p's hand (they target an enemy or any creature, or hit the whole enemy board).
    function removalInHand(s, p) {
        let n = 0;
        for (const cid of s.players[p].hand) {
            const c = s.cards[cid];
            if (c.kind !== 'tactic') continue;
            const def = (Rift.data.tactics || {})[c.tactic];
            if (def && (def.target === 'enemy-creature' || def.target === 'any-creature' || c.tactic === 'peer-review')) n++;
        }
        return n;
    }

    // Rough value of the current special rules for player me (deep scoring only).
    function ruleExtras(s, me, ctx) {
        const Eng = E();
        const r = Eng.rules(s);
        const opp = 1 - me;
        const P = s.players[me], Q = s.players[opp];
        const handCreatures = P.hand.filter(cid => s.cards[cid].kind === 'creature').length;
        let v = 0;
        if (r.costDelta) v -= r.costDelta * 0.5 * (handCreatures - Q.hand.length * 0.5);
        if (r.growth > 1) v += 0.3 * (P.hand.length - Q.hand.length);
        if (r.arrivalReady) v += 0.4 * (handCreatures - Q.hand.length * 0.5);
        if (r.heal) {
            let mine = 0, theirs = 0;
            P.board.forEach(cid => { mine += s.cards[cid].damage; });
            Q.board.forEach(cid => { theirs += s.cards[cid].damage; });
            v += 0.6 * (mine - theirs);
        }
        if (r.mercy) v += 0.05 * (boardValue(s, opp, ctx) - boardValue(s, me, ctx));
        if (r.abilityCostDelta) {
            const act = p => s.players[p].board.filter(cid => Eng.activations(s, cid).length).length;
            v -= 0.5 * r.abilityCostDelta * (act(me) - act(opp));
        }
        return v;
    }

    // Who wins the fights on the board right now: for each creature its best attack.
    function fightMatrix(s, me, ctx) {
        const Eng = E();
        const r = Eng.rules(s);
        const side = p => {
            let sum = 0;
            const foe = 1 - p;
            const hearts = s.players[foe].hearts;
            for (const cid of s.players[p].board) {
                const c = s.cards[cid];
                if (Eng.attackOf(s, cid) <= 0) continue;
                let best = 0;
                for (const t of Eng.attackTargets(s, cid)) {
                    const f = Eng.fightPreview(s, cid, t);
                    let g;
                    if (f.hero) {
                        if (r.reverseHearts) continue;
                        g = heartValue(hearts) - heartValue(hearts - f.damage);
                    } else {
                        g = (f.defenderDefeated ? creatureValue(s, t, ctx) : 0.3 * f.toDefender)
                            - (f.attackerDefeated ? creatureValue(s, cid, ctx) : 0.3 * f.toAttacker);
                    }
                    if (g > best) best = g;
                }
                let n = r.attacksPerCreature;
                for (const id of abilityIdsOf(s, c)) if (abilityDefs()[id].attacksPerTurn) n = Math.max(n, abilityDefs()[id].attacksPerTurn);
                sum += best * Math.min(n, 2);
            }
            return sum;
        };
        return 0.5 * (side(me) - side(1 - me));
    }

    function withRules(s, active) {
        return Object.assign({}, s, { axioms: Object.assign({}, s.axioms, { active }) });
    }
    function withAxiom(s, id) {
        const ax = Rift.data.axioms[id];
        return withRules(s, Object.assign({}, s.axioms.active, { [ax.category]: id }));
    }

    function nextEventState(s) {
        if (!s.options.timeline) return null;
        if (s.fate.events % 2 === 1) return withRules(s, {});
        const top = s.axioms.deck[0];
        return top ? withAxiom(s, top) : null;
    }

    // Base score plus fights and rules (used to value rule changes).
    function staticDeep(s, me, ctx) {
        return evaluateBase(s, me, ctx) + fightMatrix(s, me, ctx) + ruleExtras(s, me, ctx);
    }

    function evaluateBase(s, me, ctx) {
        if (s.winner != null) return s.winner === me ? WIN : s.winner === 'draw' ? -WIN / 4 : -WIN;
        const Eng = E();
        const r = Eng.rules(s);
        const opp = 1 - me;
        const P = s.players[me], Q = s.players[opp];
        let v = 0;
        const faceBias = ctx.cfg.faceBias;
        const hv = heartValue(P.hearts) - faceBias * heartValue(Q.hearts);
        v += r.reverseHearts ? -0.6 * hv : ctx.w.hearts * hv;
        v += boardValue(s, me, ctx) - boardValue(s, opp, ctx);
        v += handValue(s, me, ctx) - handValue(s, opp, ctx);
        v += Math.min(P.deck.length, 3) * 0.1 - Math.min(Q.deck.length, 3) * 0.1;
        if (ctx.cfg.threat && !r.reverseHearts) {
            const theirs = facePotential(s, opp);
            const mine = facePotential(s, me);
            const nextLethal = ctx.cfg.search ? EXPERT.nextLethal : 4;
            v -= ctx.w.threat * (theirs >= P.hearts ? 14 : 3 * theirs / Math.max(1, P.hearts));
            v += ctx.w.threat * (mine >= Q.hearts ? nextLethal : 1.5 * mine / Math.max(1, Q.hearts));
            const race = ctx.w.race || (ctx.cfg.search ? EXPERT.race : 0);
            if (race) {
                const clock = (h, pot) => Math.min(8, h / Math.max(1, pot));
                v += race * (clock(P.hearts, theirs) - clock(Q.hearts, mine));
            }
        }
        if (!creatureCount(s, me)) v -= WIN / 2;
        if (!creatureCount(s, opp)) v += WIN / 2;
        return v;
    }

    function makeCtx(me, o) {
        const level = levelOf(o && o.level);
        return { me, level, cfg: LEVELS[level], axVal: null, w: Object.assign({}, WEIGHTS, o && o.weights) };
    }

    function evaluate(s, me, opts) {
        const o = opts || {};
        const ctx = o.ctx || makeCtx(me, o);
        if (!o.deep || s.winner != null) return evaluateBase(s, me, ctx);
        let v = staticDeep(s, me, ctx);
        const next = nextEventState(s);
        if (next) v += Math.pow(0.85, s.fate.until) * (staticDeep(next, me, ctx) - staticDeep(s, me, ctx));
        return v;
    }

    // What each axiom would be worth to me if it became active now.
    function axiomValues(s, me, ctx, ids) {
        const out = {};
        if (!ids.length) return out;
        const base = staticDeep(s, me, ctx);
        ids.forEach(id => {
            if (out[id] != null || !Rift.data.axioms[id]) return;
            const cat = Rift.data.axioms[id].category;
            out[id] = s.axioms.active[cat] === id ? 0 : staticDeep(withAxiom(s, id), me, ctx) - base;
        });
        return out;
    }

    // ---- grouping identical choices -------------------------------------------------

    function signature(s, cid, cache) {
        if (isHero(cid) || cid == null) return String(cid);
        if (cache.has(cid)) return cache.get(cid);
        const Eng = E();
        const c = s.cards[cid];
        let sig;
        if (c.kind === 'tactic') sig = 't:' + c.tactic;
        else {
            const onBoard = s.players[c.controller].board.includes(cid);
            sig = [c.controller, c.species, c.ability, c.gained.join(','), Eng.attackOf(s, cid), Eng.healthOf(s, cid).current,
                Eng.healthOf(s, cid).max, Eng.keywordsOf(s, cid).join(','), onBoard ? 'b' : 'h', c.attacks, c.activated, c.frozen,
                c.silenced, c.enteredTurn === s.turn, c.metaverseUsed, c.siuuu, c.prediction, c.colourless, c.cost].join('|');
        }
        cache.set(cid, sig);
        return sig;
    }

    function groupActions(s, legal) {
        const cache = new Map();
        const seen = new Set();
        const out = [];
        for (const a of legal) {
            let key;
            if (a.type === 'attack' || a.type === 'play' || a.type === 'activate') {
                key = a.type + '>' + signature(s, a.cid, cache) + '>' + (a.ability || '') + '>' + signature(s, a.target, cache);
            } else key = E().actionKey(a);
            if (seen.has(key)) continue;
            seen.add(key);
            out.push(a);
        }
        return out;
    }

    // ---- scoring actions -------------------------------------------------------------

    const DEEP_TACTICS = { clockwork: true, 'look-it-up': true, nostalgia: true };

    // A tactic's own value hint (data/tactics.js `ai`), for what the one-ply score can't see.
    function tacticHint(s, a, me) {
        const c = s.cards[a.cid];
        const def = c && c.kind === 'tactic' && (Rift.data.tactics || {})[c.tactic];
        return def && def.ai ? def.ai(s, me, a.target || null, E().H) || 0 : 0;
    }
    const DEEP_ABILITIES = { filter: true, 'next-year': true, axiomatic: true };

    function needsDeep(s, a) {
        if (a.type === 'axiom' || a.type === 'draw') return true;
        if (a.type === 'activate') return !!DEEP_ABILITIES[a.ability];
        if (a.type === 'play') {
            const c = s.cards[a.cid];
            if (c.kind === 'tactic') return !!DEEP_TACTICS[c.tactic];
            return c.ability === 'axiomatic';
        }
        return false;
    }

    // Score a state that may still be waiting for one of my answers.
    function settle(next, me, ctx, deep, depth) {
        if (next.winner == null && next.phase === 'choose' && next.pending && next.pending.player === me && depth < 3) {
            const legal = E().legalActions(next);
            let best = -Infinity;
            if (next.pending.kind === 'card' || next.pending.kind === 'colour') {
                const pick = heuristicChoice(next, me);
                const a = legal.find(x => x.choice === pick) || legal[0];
                return settle(E().applyLegal(next, a), me, ctx, deep, depth + 1);
            }
            for (const a of legal) {
                const v = settle(E().applyLegal(next, a), me, ctx, deep, depth + 1);
                if (v > best) best = v;
            }
            return best;
        }
        return evaluate(next, me, { ctx, deep });
    }

    function scoreActions(s, cands, me, ctx) {
        if (ctx.work) ctx.work.n += cands.length; // Expert's work budget (EXPERT.work)
        const baseCache = {};
        const base = deep => (baseCache[deep] != null ? baseCache[deep] : (baseCache[deep] = evaluate(s, me, { ctx, deep })));
        const scored = cands.map(a => {
            if (a.type === 'spark') return { a, score: 0 };
            const deep = ctx.cfg.deep && !ctx.fast && needsDeep(s, a);
            let next;
            try { next = E().applyLegal(s, a); } catch (e) { return { a, score: -Infinity }; }
            let score = settle(next, me, ctx, deep, 0) - base(deep);
            if (a.type === 'end') score -= 0.01;
            if (a.type === 'play') score += tacticHint(s, a, me);
            return { a, score };
        });
        // Spend energy on the best combination of cards, not just the best single card.
        const energy = s.players[me].energy;
        const plan = energyPlan(s, scored, energy);
        const inPlan = new Set(plan.ids);
        scored.forEach(x => {
            const r = resourceOf(s, x.a);
            if (r && r.cost > 0 && x.score > 0.05 && !inPlan.has(r.id)) x.score = Math.min(x.score, 0.04);
            if (x.a.type === 'spark') x.score = energyPlan(s, scored, energy + 1).value - plan.value - 0.3;
        });
        return scored;
    }

    // ---- draw choice -------------------------------------------------------------------

    function drawScores(s, legal, me, ctx) {
        const P = s.players[me];
        const r = E().rules(s);
        const n = r.drawCount;
        const out = [];
        const room = s.options.handLimit - P.hand.length - P.axHand.length;
        for (const a of legal) {
            let score = 0;
            if (a.choice === 'deck') {
                score = 1.8 + (P.hand.length <= 2 ? 1 : 0) + (playableCreatures(s, me) ? 0 : 1) + (P.capacity >= 4 ? 0.3 : 0);
                score *= Math.min(n, room) > 1 ? 1.6 : 1;
            } else if (a.choice === 'axiom') {
                const top = s.axioms.deck[0];
                if (top) {
                    const vals = axiomValues(s, me, ctx, [top]);
                    const own = Math.max(0, vals[top]);
                    score = AXIOM_CARD + own * 0.6;
                    // Taking it also stops Fate flipping it for free.
                    if (s.options.timeline && s.fate.events % 2 === 0) score += Math.max(0, -vals[top]) * Math.pow(0.85, s.fate.until) * 0.8;
                } else score = AXIOM_CARD + 0.3;
                if (P.axHand.length >= 2) score -= 0.6 * (P.axHand.length - 1);
            } else if (a.choice === 'forward' || a.choice === 'rewind') {
                const next = E().applyLegal(s, a);
                score = evaluate(next, me, { ctx, deep: true }) - evaluate(s, me, { ctx, deep: true });
            } else score = 0;
            out.push({ a, score });
        }
        return out;
    }

    // ---- pending questions answered by rules of thumb ----------------------------------

    function cardWorth(s, cid, me) {
        const c = s.cards[cid];
        if (c.kind === 'tactic') return 2 + (Rift.data.tactics[c.tactic] || { cost: 1 }).cost * 0.5;
        const P = s.players[me];
        const v = c.attack + c.health * 0.9 + c.baseKeywords.length * 0.6;
        const affordable = c.cost <= P.capacity + 1 ? 1.5 : 0;
        return v + affordable;
    }

    function heuristicChoice(s, me) {
        const req = s.pending;
        const opts = req.options;
        if (req.kind === 'card') return opts.slice().sort((x, y) => cardWorth(s, y, me) - cardWorth(s, x, me))[0];
        if (req.kind === 'colour') {
            // Guess the colour the opponent has most of among its creatures not seen yet. Only public
            // facts: the opponent's whole team is known (team list), minus what is on a board or in a
            // discard pile. Its hand and deck order are hidden, so they are never looked at.
            const foe = 1 - me;
            const seen = new Set();
            s.players.forEach(P => P.board.concat(P.discard).forEach(cid => seen.add(cid)));
            const counts = {};
            Object.keys(s.cards).forEach(cid => {
                const c = s.cards[cid];
                if (c.kind === 'creature' && c.owner === foe && !seen.has(cid)) counts[c.colour] = (counts[c.colour] || 0) + 1;
            });
            return opts.slice().sort((a, b) => (counts[b] || 0) - (counts[a] || 0))[0];
        }
        return opts[0];
    }

    // ---- choose -----------------------------------------------------------------------------

    function lethalAttack(s, legal, me) {
        const Eng = E();
        const r = Eng.rules(s);
        if (r.reverseHearts) return null;
        const foe = 1 - me;
        const hero = 'h' + foe;
        const face = legal.filter(a => a.type === 'attack' && a.target === hero);
        if (!face.length) return null;
        let hits = [];
        const seen = new Set();
        face.forEach(a => {
            if (seen.has(a.cid)) return;
            seen.add(a.cid);
            const dmg = Eng.fightPreview(s, a.cid, hero).damage;
            const c = s.cards[a.cid];
            let n = r.attacksPerCreature;
            abilityIdsOf(s, c).forEach(id => { if (abilityDefs()[id].attacksPerTurn) n = Math.max(n, abilityDefs()[id].attacksPerTurn); });
            for (let i = c.attacks; i < n; i++) hits.push({ a, dmg });
        });
        hits.sort((x, y) => y.dmg - x.dmg);
        const left = r.attackLimit === Infinity ? hits.length : r.attackLimit - s.players[me].attacksThisTurn;
        hits = hits.slice(0, Math.max(0, left));
        const total = hits.reduce((t, h) => t + h.dmg, 0);
        return total >= s.players[foe].hearts && hits.length ? hits[0].a : null;
    }

    // Answer a pending question of mine (cards and colours by rule of thumb, the rest by lookahead).
    function answerPending(s, me, ctx, allowed) {
        const legal = allowed || E().legalActions(s);
        if (s.pending.kind === 'card' || s.pending.kind === 'colour') {
            const pick = heuristicChoice(s, me);
            return legal.find(a => a.choice === pick) || legal[0];
        }
        const deep = ctx.cfg.deep && !ctx.fast;
        return pickBest(legal.map(a => ({ a, score: settle(E().applyLegal(s, a), me, ctx, deep, 1) })));
    }

    // Plays the rest of my turn greedily (one-ply, no axiom cards) and returns the state before End.
    function rollout(s, me, ctx) {
        const fast = Object.assign({}, ctx, { fast: true });
        let cur = s;
        for (let i = 0; i < 10 && cur.winner == null && cur.active === me; i++) {
            if (ctx.work && ctx.work.n > 2 * EXPERT.work) break; // Expert out of budget: stop here
            if (cur.phase === 'choose') {
                if (!cur.pending || cur.pending.player !== me) break;
                cur = E().applyLegal(cur, answerPending(cur, me, fast));
                continue;
            }
            if (cur.phase !== 'main') break;
            const legal = legalFor(cur).filter(a => a.type !== 'axiom');
            const a = lethalAttack(cur, legal, me) || pickBest(scoreActions(cur, groupActions(cur, legal), me, fast));
            if (!a || a.type === 'end') break;
            cur = E().applyLegal(cur, a);
        }
        return cur;
    }

    const IMMEDIATE = { attacks: true, arrival: true, cost: true, targeting: true, combat: true };

    // Should I play an axiom card now? Compares my whole turn with and without each one.
    function axiomCheck(s, legal, me, ctx) {
        // Only rules that look useful (or act at once, like extra attacks) are worth a full rollout.
        const vals = ctx.axVal || {};
        const options = legal.filter(a => {
            if (a.type !== 'axiom') return false;
            const ax = Rift.data.axioms[a.choice];
            if (s.axioms.active[ax.category] === a.choice) return false;
            return (vals[a.choice] || 0) > 0.2 || IMMEDIATE[ax.category];
        }).sort((x, y) => (vals[y.choice] || 0) - (vals[x.choice] || 0)).slice(0, 3);
        if (!options.length) return null;
        const score = st => evaluate(rollout(st, me, ctx), me, { ctx, deep: true });
        const base = score(s);
        let best = null, bestGain = 0.3;
        for (const a of options) {
            const gain = score(E().applyLegal(s, a)) - base;
            if (gain > bestGain) { best = a; bestGain = gain; }
        }
        return best;
    }

    function pickBest(scored) {
        let best = null;
        for (const x of scored) if (!best || x.score > best.score) best = x;
        return best ? best.a : null;
    }

    // Debugging aid: the scored candidates for the current decision (draw or main phase).
    function explain(state, options) {
        const o = options || {};
        const me = E().decider(state);
        const ctx = makeCtx(me, o);
        const legal = E().legalActions(state).filter(a => a.type !== 'item');
        ctx.axVal = axiomValues(state, me, ctx, state.players[me].axHand.concat(state.axioms.deck.slice(0, 1)));
        if (state.phase === 'draw') return drawScores(state, legal, me, ctx);
        return scoreActions(state, groupActions(state, legal), me, ctx);
    }

    // Rule cards Normal never plays: twists that turn the whole game around are kept for Competent and Expert.
    const NORMAL_TWISTS = { 'reverse-hearts': true, 'empty-set': true };

    // Bag items are the player's own business: the AI never uses them ({ type: 'item' }).
    function allowedActions(s, legal, level) {
        const usable = legal.filter(a => a.type !== 'item');
        if (LEVELS[level].twists) return usable;
        const twist = a => (a.type === 'axiom' || (a.type === 'choose' && s.pending && s.pending.kind === 'axiom')) && NORMAL_TWISTS[a.choice];
        const ok = usable.filter(a => !twist(a));
        return ok.length ? ok : usable;
    }

    // ---- Expert: whole-turn search ----------------------------------------------------------

    // Most hero damage my side could still deal this turn if everything went right (prunes the lethal search).
    function lethalCeiling(s, me) {
        const Eng = E();
        const r = Eng.rules(s);
        const P = s.players[me];
        let dmg = P.spark ? 3 : 0;
        for (const cid of P.board) {
            const c = s.cards[cid];
            let n = r.attacksPerCreature;
            let extra = 0;
            for (const id of abilityIdsOf(s, c)) {
                const def = abilityDefs()[id];
                if (def.attacksPerTurn) n = Math.max(n, def.attacksPerTurn);
                if (def.heroDamage) extra += def.heroDamage;
            }
            if (Eng.canAttack(s, cid)) dmg += Math.max(0, n - c.attacks) * (Eng.attackOf(s, cid) + extra + 2);
        }
        // Every card I can pay for might add a little (a buff, Swift, a direct hit, a cleared Guard).
        for (const cid of P.hand) if (Eng.playCost(s, cid) <= P.energy) dmg += 3;
        return dmg;
    }

    // Looks for a line of attacks, tactics, plays and activations that wins this turn (no axiom
    // cards). Returns its first action, or null. At most EXPERT.lethalNodes states are tried.
    function lethalLine(s, me, ctx) {
        const Eng = E();
        if (Eng.rules(s).reverseHearts) return null;
        if (lethalCeiling(s, me) < s.players[1 - me].hearts) return null;
        const fast = Object.assign({}, ctx, { fast: true });
        let nodes = 0;
        const hero = 'h' + (1 - me);
        const order = a => (a.type === 'attack' ? (a.target === hero ? 0 : 1) : a.type === 'play' ? 2 : 3);
        function dfs(st, depth) {
            if (st.winner === me) return true;
            if (st.winner != null || depth >= EXPERT.lethalDepth || nodes >= EXPERT.lethalNodes) return false;
            if (st.phase === 'choose') {
                if (!st.pending || st.pending.player !== me) return false;
                nodes++;
                return dfs(Eng.applyLegal(st, answerPending(st, me, fast)), depth + 1);
            }
            if (st.phase !== 'main' || st.active !== me) return false;
            if (lethalCeiling(st, me) < st.players[1 - me].hearts) return false;
            const legal = groupActions(st, Eng.legalActions(st).filter(a => a.type === 'attack' || a.type === 'play' || a.type === 'activate' || a.type === 'spark'));
            legal.sort((x, y) => order(x) - order(y));
            for (const a of legal) {
                if (++nodes > EXPERT.lethalNodes) return false;
                let next;
                try { next = Eng.applyLegal(st, a); } catch (e) { continue; }
                if (dfs(next, depth + 1)) return true;
            }
            return false;
        }
        const legal = groupActions(s, Eng.legalActions(s).filter(a => a.type === 'attack' || a.type === 'play' || a.type === 'activate' || a.type === 'spark'));
        legal.sort((x, y) => order(x) - order(y));
        for (const a of legal) {
            if (++nodes > EXPERT.lethalNodes) return null;
            let next;
            try { next = Eng.applyLegal(s, a); } catch (e) { continue; }
            if (dfs(next, 1)) return a;
        }
        return null;
    }

    // Value of a move = the deep score after it and a greedy rollout of the rest of my turn
    // (the state just before I would press End turn).
    function turnValue(s, a, me, ctx) {
        if (a.type === 'end') return leafValue(s, me, ctx);
        let next;
        try { next = E().applyLegal(s, a); } catch (e) { return -Infinity; }
        if (next.winner != null) return evaluate(next, me, { ctx });
        return leafValue(rollout(next, me, ctx), me, ctx);
    }

    function leafValue(st, me, ctx) {
        if (!EXPERT.reply || st.winner != null) return evaluate(st, me, { ctx, deep: true });
        return evaluate(boardReply(st, me, ctx.work), me, { ctx, deep: true });
    }

    // The opponent's answer on the PUBLIC board: I end my turn, they draw (a hidden card they do
    // not use here) and attack greedily with the creatures already in play. No hand cards are
    // played, so their hand is never looked at.
    function boardReply(st, me, work) {
        const Eng = E();
        const opp = 1 - me;
        if (st.phase !== 'main' || st.active !== me) return st;
        let cur;
        try { cur = Eng.applyLegal(st, { type: 'end', player: me }); } catch (e) { return st; }
        const octx = Object.assign(makeCtx(opp, { level: 'competent' }), { fast: true, work });
        for (let i = 0; i < 12 && cur.winner == null && cur.active === opp; i++) {
            const legal = Eng.legalActions(cur);
            if (cur.phase === 'draw') { cur = Eng.applyLegal(cur, legal.find(a => a.choice === 'deck') || legal.find(a => a.choice === 'none') || legal[0]); continue; }
            if (cur.phase === 'choose') {
                if (!cur.pending || cur.pending.player !== opp) break;
                cur = Eng.applyLegal(cur, answerPending(cur, opp, octx, legal));
                continue;
            }
            if (cur.phase !== 'main') break;
            const attacks = groupActions(cur, legal.filter(a => a.type === 'attack'));
            if (!attacks.length) break;
            const a = lethalAttack(cur, attacks, opp) || pickBest(scoreActions(cur, attacks, opp, octx).filter(x => x.score > 0));
            if (!a) break;
            cur = Eng.applyLegal(cur, a);
        }
        return cur;
    }

    function expertMain(s, legal, me, ctx) {
        const kill = lethalAttack(s, legal, me) || lethalLine(s, me, ctx);
        if (kill) return kill;
        ctx.work = { n: 0 };
        const P = s.players[me];
        ctx.axVal = axiomValues(s, me, ctx, P.axHand);
        const scored = scoreActions(s, groupActions(s, legal.filter(a => a.type !== 'axiom')), me, ctx);
        const oneply = develop(s, scored, pickBest(scored));
        // Candidates: the one-ply choice, the best few other moves, End turn and promising axiom cards.
        const ranked = scored.filter(x => x.a.type !== 'end' && x.score > DEVELOP_FLOOR).sort((x, y) => y.score - x.score);
        const cands = [oneply];
        for (const x of ranked) { if (cands.length > EXPERT.width) break; if (!cands.includes(x.a)) cands.push(x.a); }
        const end = legal.find(a => a.type === 'end');
        if (end && !cands.includes(end)) cands.push(end);
        const vals = ctx.axVal || {};
        legal.filter(a => {
            if (a.type !== 'axiom') return false;
            const ax = Rift.data.axioms[a.choice];
            return s.axioms.active[ax.category] !== a.choice && ((vals[a.choice] || 0) > 0.2 || IMMEDIATE[ax.category]);
        }).sort((x, y) => (vals[y.choice] || 0) - (vals[x.choice] || 0)).slice(0, EXPERT.axioms).forEach(a => cands.push(a));
        let best = oneply, bestV = -Infinity;
        for (const a of cands) {
            if (a !== oneply && ctx.work.n > EXPERT.work) break; // out of budget: keep the best so far
            // Axiom cards and End turn must clearly beat the rest (as Competent's axiom check).
            const v = turnValue(s, a, me, ctx) - (a.type === 'axiom' ? 0.3 : a.type === 'end' ? 0.05 : 0);
            if (v > bestV) { bestV = v; best = a; }
        }
        return develop(s, scored, best);
    }

    // Easy needs new cards when nothing in its hand is a creature it can pay for.
    function needsCards(s, me) {
        return s.players[me].hand.length <= 2 || !playableCreatures(s, me);
    }

    // Never End turn while a creature can still be played into an open board space, unless
    // every such play looks clearly bad (it would just be thrown away).
    function develop(s, scored, best) {
        if (!best || best.type !== 'end') return best;
        let pick = null;
        for (const x of scored) {
            if (x.a.type !== 'play' || s.cards[x.a.cid].kind !== 'creature' || x.score < DEVELOP_FLOOR) continue;
            if (!pick || x.score > pick.score) pick = x;
        }
        return pick ? pick.a : best;
    }

    function choose(state, options) {
        const o = options || {};
        const level = levelOf(o.level);
        const cfg = LEVELS[level];
        const Eng = E();
        const s = state;
        const legal = allowedActions(s, legalFor(s), level);
        if (legal.length <= 1) return legal[0] || null;
        const me = Eng.decider(s);
        const rng = Rift.makeRng('ai:' + s.seed + ':' + s.step + ':' + level + ':' + (o.salt || ''));
        const mistake = rng.chance(cfg.mistake);
        const ctx = makeCtx(me, o);

        if (s.phase === 'draw') {
            if (cfg.simple) {
                // Normal nearly always draws from its deck, and always when it has nothing to play.
                const deck = legal.find(a => a.choice === 'deck');
                if (deck && (needsCards(s, me) || !(mistake || rng.chance(0.15)))) return deck;
                return rng.pick(legal);
            }
            ctx.axVal = axiomValues(s, me, ctx, s.players[me].axHand.concat(s.axioms.deck.slice(0, 1)));
            return pickBest(drawScores(s, legal, me, ctx));
        }

        if (s.phase === 'choose') return mistake ? rng.pick(legal) : answerPending(s, me, ctx, legal);

        // Main phase.
        if (cfg.simple) {
            // Normal's weaknesses are weaker CHOICES (no threat terms, likes hitting the hero, a random
            // second-rate move now and then, sometimes holding back an attack), never sitting still.
            // It does take an obvious lethal attack.
            const kill = cfg.lethal && lethalAttack(s, legal, me);
            if (kill) return kill;
            const scored = scoreActions(s, groupActions(s, legal), me, ctx);
            const best = develop(s, scored, pickBest(scored));
            if (mistake) {
                const pool = scored.filter(x => x.a !== best && x.score > 0 && x.a.type !== 'end' && x.a.type !== 'spark' && x.a.type !== 'axiom');
                if (pool.length) return rng.pick(pool).a;
            }
            // Holding back an attack only once nothing is left to play.
            const canPlay = legal.some(a => a.type === 'play' && s.cards[a.cid].kind === 'creature');
            if (best && best.type === 'attack' && !canPlay && rng.chance(cfg.earlyEnd)) return legal.find(a => a.type === 'end');
            return best;
        }
        if (cfg.search) return expertMain(s, legal, me, ctx);
        const kill = lethalAttack(s, legal, me);
        if (kill) return kill;
        const P = s.players[me];
        ctx.axVal = axiomValues(s, me, ctx, P.axHand);
        // Axiom cards are weighed against a whole turn, at the start of the turn and before ending it.
        const fresh = P.energy >= P.capacity && !P.attacksThisTurn;
        if (fresh) { const ax = axiomCheck(s, legal, me, ctx); if (ax) return ax; }
        const scored = scoreActions(s, groupActions(s, legal.filter(a => a.type !== 'axiom')), me, ctx);
        const best = develop(s, scored, pickBest(scored));
        if (best && best.type === 'end' && !fresh) { const ax = axiomCheck(s, legal, me, ctx); if (ax) return ax; }
        return best;
    }

    // Plays a whole battle with the given levels (levels[p] for player p). Used by tests and the simulator.
    function playOut(state, levels, onStep) {
        const Eng = E();
        let s = state;
        let guard = 0;
        while (Eng.winner(s) == null) {
            const p = Eng.decider(s);
            const act = choose(s, typeof levels[p] === 'object' ? levels[p] : { level: levels[p] });
            if (!act) throw new Error('AI found no action in phase ' + s.phase);
            const next = Eng.applyAction(s, act);
            if (onStep) onStep(s, act, next);
            s = next;
            if (++guard > 6000) throw new Error('Battle did not finish');
        }
        return s;
    }

    Battle.AI = {
        choose, playOut, evaluate, explain, levelOf, LEVELS, LEVEL_NAMES, EXPERT,
        MISTAKE, EARLY_END, NORMAL_TWISTS, EASY_TWISTS: NORMAL_TWISTS, WEIGHTS,
    };
})(typeof window !== 'undefined' ? window : globalThis);
