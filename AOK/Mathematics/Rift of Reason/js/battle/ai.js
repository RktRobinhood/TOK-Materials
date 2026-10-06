/*
 * Heuristic battle AI, two levels. Deterministic: the same state and level
 * always give the same action (randomness comes from a seed derived from the
 * battle seed and step).
 *
 *   hard: blocks when a blocker wins or trades well (respecting axioms and the
 *         colour wheel), steals strong plays, holds its best cards back while the
 *         opponent still has steals, attacks when the defender can't block well.
 *   easy: plays its strongest card, steals anything decent, and makes a random
 *         legal move about one time in five.
 *
 * Rift.Battle.AI.choose(state, { level: 'hard' | 'easy' }) → an action from legalActions(state)
 */
(function (root) {
    'use strict';

    const Rift = root.Rift;
    const Battle = Rift.Battle || (Rift.Battle = {});
    const E = () => Battle.Engine;

    const MISTAKE = { easy: 0.2, hard: 0 };

    function value(s, cid) {
        const c = s.cards[cid];
        return E().power(s, cid) + (c.legendary ? 1 : 0);
    }

    // How the defender (d) would answer an attack, using the hard heuristic.
    // Returns { cid|null, kind: 'take'|'win'|'bounce'|'trade'|'chump' }.
    function bestBlock(s, att, options, opts) {
        const Eng = E();
        const a = s.cards[att];
        const d = 1 - a.controller;
        const lives = s.players[d].lives;
        if (Eng.rules(s).reverseHearts) return {cid:null,kind:'take'};
        let assumed = att;
        if (opts && opts.hidden) {
            // Face-down attack: assume the strongest creature on the attacker's board.
            assumed = s.players[a.controller].board.slice().sort((x, y) => Eng.power(s, y) - Eng.power(s, x))[0] || att;
        }
        const buckets = { win: [], bounce: [], trade: [], chump: [] };
        options.forEach(b => {
            const out = Eng.fightOutcome(s, assumed, b);
            if (out.attackerDefeated && !out.blockerDefeated) buckets.win.push(b);
            else if (!out.attackerDefeated && !out.blockerDefeated) buckets.bounce.push(b);
            else if (out.attackerDefeated && out.blockerDefeated) buckets.trade.push(b);
            else buckets.chump.push(b);
        });
        const cheapest = list => list.slice().sort((x, y) => value(s, x) - value(s, y))[0];
        if (buckets.win.length) return { cid: cheapest(buckets.win), kind: 'win' };
        if (buckets.bounce.length) return { cid: cheapest(buckets.bounce), kind: 'bounce' };
        const attVal = value(s, assumed);
        if (buckets.trade.length) {
            const b = cheapest(buckets.trade);
            if (lives <= 1 || attVal >= value(s, b) - 1 || (lives === 2 && attVal >= 7)) return { cid: b, kind: 'trade' };
        }
        if (lives <= 1 && buckets.chump.length) return { cid: cheapest(buckets.chump), kind: 'chump' };
        return { cid: null, kind: 'take' };
    }

    function attackScore(s, act) {
        const Eng = E();
        const att = act.cid;
        const d = 1 - s.active;
        const lives = s.players[d].lives;
        let resp;
        if (act.target) {
            const out = Eng.fightOutcome(s, att, act.target);
            resp = {
                cid: act.target,
                kind: out.attackerDefeated && !out.blockerDefeated ? 'win'
                    : !out.attackerDefeated && !out.blockerDefeated ? 'bounce'
                        : out.attackerDefeated ? 'trade' : 'chump',
            };
        } else {
            resp = bestBlock(s, att, Eng.eligibleBlockers(s, att), { hidden: Eng.axiomFlag(s, 'hiddenAttacker') });
        }
        const av = value(s, att);
        switch (resp.kind) {
            case 'take': return Eng.rules(s).reverseHearts ? -100 : lives <= 1 ? 100 : 6;
            case 'chump': return 3 + value(s, resp.cid);
            case 'trade': return value(s, resp.cid) - av + 0.5;
            case 'bounce': return -0.5;
            default: return -av - 1;
        }
    }

    function stealRisk(s, cid) {
        const Eng = E();
        const opp = 1 - s.active;
        if (s.players[opp].steals <= 0 || Eng.axiomFlag(s, 'noSteals')) return 0;
        // Would it be stealable once played? (Unprovable can't be.)
        const c = s.cards[cid];
        if (Eng.activeAbilities(s, c).includes('unprovable')) return 0;
        const v = value(s, cid);
        const p = v >= 7 ? 0.7 : v >= 5 ? 0.3 : 0.05;
        return p * v * 0.9;
    }

    function playScore(s, cid, level) {
        const c = s.cards[cid];
        const v = value(s, cid);
        let score = 2 + v * 0.5;
        const defs = Battle.Abilities || {};
        E().activeAbilities(s, c).forEach(ab => {
            if (defs[ab] && defs[ab].aiPlay) score += defs[ab].aiPlay(s, Object.assign({}, c, { controller: s.active }), E().H);
        });
        if (level === 'hard') score -= stealRisk(s, cid);
        return score;
    }

    function rewriteScore(s,id) {
        const Eng=E(), me=s.active, ax=Rift.data.axioms[id];
        if(Eng.activeAxioms(s).some(a=>a.id===id))return -5;
        const changed=Object.assign({},s,{axioms:Object.assign({},s.axioms,{current:id})});
        const r=Eng.rules(changed), before=Eng.rules(s), P=s.players[me], Q=s.players[1-me];
        if(ax.category==='victory') return r.reverseHearts?(Q.lives-P.lives)*3:(P.lives-Q.lives)*3;
        if(ax.category==='actions')return (r.actions-before.actions)*(P.board.filter(cid=>Eng.readyToUse(s,cid)).length-Q.board.length+0.5);
        if(ax.category==='cost')return (before.playCostDelta-r.playCostDelta)*P.hand.length*0.4;
        if(ax.category==='energy'||ax.category==='draw')return 1;
        if(ax.category==='exhaustion')return !r.exhaust&&P.board.length>Q.board.length?4:-2;
        const attackers=P.board.filter(cid=>Eng.canAttack(s,cid));
        return Math.max(-5,Math.min(10,attackers.reduce((v,cid)=>v+attackScore(changed,{cid})-attackScore(s,{cid}),0)));
    }
    function activateScore(s,a) {
        const card=s.cards[a.cid], def=Battle.Abilities[a.ability];
        if(a.ability==='focus')return 1.1;
        if(a.ability==='filter'||a.ability==='next-year'){
            if(!s.options.timeline)return -5;
            const benefit=s.fate.events%2===0&&s.axioms.deck.length?rewriteScore(s,s.axioms.deck[0]):0;
            return a.ability==='filter'?benefit-0.5:-benefit-0.5;
        }
        if(a.ability==='axiomatic')return Math.max(0,...s.axioms.deck.slice(0,5).map(id=>rewriteScore(s,id)));
        return 1.5+(def&&def.aiPlay?def.aiPlay(s,card,E().H):0);
    }
    function chooseAction(s, legal, level, rng) {
        let best = null;
        let bestScore = -Infinity;
        legal.forEach(act => {
            let score;
            if (act.type === 'play') score = level === 'easy' ? value(s, act.cid) : playScore(s, act.cid, level);
            else if (act.type === 'attack') {
                score = attackScore(s, act);
                if (level === 'easy') score = score > 0 ? score + 4 : score;
            } else if (act.type==='rewrite') score=rewriteScore(s,act.choice);
            else if(act.type==='activate') score=activateScore(s,act);
            else if (act.type === 'end') score = 0;
            else score = -50;
            score += rng.next() * 0.01; // deterministic tie-break
            if (score > bestScore) { bestScore = score; best = act; }
        });
        return best;
    }

    function chooseSteal(s, level) {
        const cid = s.pending.cid;
        const thief = s.pending.player;
        const v = value(s, cid);
        if (level === 'easy') return v >= 6;
        const victim = s.players[1 - thief];
        const late = victim.hand.length + victim.deck.length <= 3;
        const its = E().activeAbilities(s, s.cards[cid]);
        const threat = its.includes('its-raw') && s.players[thief].board.some(b => E().power(s, b) <= 3);
        return v >= 7 || s.cards[cid].legendary || threat || (late && v >= 5);
    }

    const PROGRAM_RANK = ['unprovable', 'escalate', 'metaverse', 'grook', 'lecture', 'its-raw', 'hype', 'nickname',
        'pull-that-up', 'predict', 'measure', 'easter-egg', 'well-actually', 'axiomatic', 'next-year', 'every-time'];

    function chooseOption(s, level) {
        const req = s.pending;
        const me = req.player;
        const opts = req.options;
        const Eng = E();
        if (s.phase === 'axiom' || req.choiceKind === 'axiom') {
            // Pick the axiom that most favours our board over theirs.
            let best = opts[0], bestScore = -Infinity;
            opts.forEach(id => {
                const score = rewriteScore(s,id);
                if (score > bestScore) { bestScore = score; best = id; }
            });
            return best;
        }
        switch (req.choiceKind) {
            case 'target':
                return opts.slice().sort((a, b) => Eng.power(s, b) - Eng.power(s, a))[0];
            case 'card':
                return opts.slice().sort((a, b) => value(s, b) - value(s, a))[0];
            case 'ability':
                return opts.slice().sort((a, b) => rank(a) - rank(b))[0];
            case 'colour': {
                // Count colours among the opponent's cards we can't see yet (team lists are public).
                const P = s.players[1 - me];
                const counts = {};
                P.hand.concat(P.deck).forEach(cid => { const c = s.cards[cid].colour; counts[c] = (counts[c] || 0) + 1; });
                return opts.slice().sort((a, b) => (counts[b] || 0) - (counts[a] || 0))[0];
            }
            default:
                return opts[0];
        }
        function rank(a) { const i = PROGRAM_RANK.indexOf(a); return i < 0 ? 99 : i; }
    }

    function choose(state, options) {
        const o = options || {};
        const level = o.level === 'easy' ? 'easy' : 'hard';
        const Eng = E();
        const legal = Eng.legalActions(state);
        if (legal.length <= 1) return legal[0] || null;
        const rng = Rift.makeRng('ai:' + state.seed + ':' + state.step + ':' + level + ':' + (o.salt || ''));
        if (rng.chance(MISTAKE[level])) return rng.pick(legal);
        const s = state;
        switch (s.phase) {
            case 'action':
            case 'haste':
                return chooseAction(s, legal, level, rng);
            case 'steal':
                return legal.find(a => a.type === (chooseSteal(s, level) ? 'steal' : 'decline'));
            case 'block': {
                const pick = bestBlock(s, s.pending.attacker, s.pending.options, { hidden: s.pending.hidden });
                return pick.cid ? legal.find(a => a.type === 'block' && a.cid === pick.cid) : legal.find(a => a.type === 'take');
            }
            case 'choose':
            case 'axiom': {
                const choice = chooseOption(s, level);
                return legal.find(a => a.choice === choice) || legal[0];
            }
            default:
                return legal[0];
        }
    }

    // Plays a whole battle with AI on both sides (or the given levels). Used by tests and the simulator.
    function playOut(state, levels, onStep) {
        let s = state;
        let guard = 0;
        while (Eng().winner(s) == null) {
            const p = Eng().decider(s);
            const act = choose(s, { level: levels[p] });
            const next = Eng().applyAction(s, act);
            if (onStep) onStep(s, act, next);
            s = next;
            if (++guard > 5000) throw new Error('Battle did not finish');
        }
        return s;
        function Eng() { return Battle.Engine; }
    }

    Battle.AI = { choose, bestBlock, playOut, MISTAKE };
})(typeof window !== 'undefined' ? window : globalThis);
