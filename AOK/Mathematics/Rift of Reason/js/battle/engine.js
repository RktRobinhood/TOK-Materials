/*
 * Battle engine (Card Arena rules, design/card-arena-2026-10-07.md).
 * PURE and deterministic: state + action → new state. No DOM.
 *
 * Heroes have hearts (10 by default). Creatures have attack and health; damage stays.
 * Each turn: one draw choice (own deck, shared axiom deck, or move the Fate track),
 * then play creatures/tactics/axiom cards for energy, attack with ready creatures
 * (drag at a creature or the enemy hero; Guard must be attacked first), activate
 * abilities (uses that creature's attack), and End turn. Energy capacity grows
 * 1→10 and refills. The Fate track flips/resets the shared rules.
 *
 * API (Rift.Battle.Engine):
 *   createBattle({ seed, players: [{ id, name, team: [instances], tactics?: [ids], axioms?: [ids],
 *                  hearts?, consumables? }], axiomDeck?: [ids], options })      → state
 *   legalActions(state) → [action]    applyAction(state, action) → new state (input untouched)
 *   decider(state) → player index who must act, or null     winner(state) → 0 | 1 | 'draw' | null
 *   describe(state, cid) → everything a card face needs (name, cost, attack, health, keywords, lines…)
 *   attackOf / healthOf / keywordsOf / canAttack / attackTargets / activations / targetsFor / fightPreview
 *   rules(state), ruleSummary(state), timeline(state), fullLog(state), lostUids(state, p)
 *
 * Actions (each carries `player` in legalActions):
 *   { type: 'draw', choice: 'deck' | 'axiom' | 'forward' | 'rewind' | 'none' }     phase 'draw'
 *   { type: 'play', cid, target? }            creature or tactic from hand        phase 'main'
 *   { type: 'axiom', choice: axiomId }        play an axiom card from hand
 *   { type: 'attack', cid, target }           target: enemy creature cid or 'h0' / 'h1'
 *   { type: 'activate', cid, ability, target? }
 *   { type: 'spark' }                         second player, once: +1 energy this turn
 *   { type: 'end' }
 *   { type: 'choose', choice }                answer a pending question            phase 'choose'
 *
 * Events (state.lastEvents for the latest action, fullLog(state) for all):
 *   { t, text, publicText?, privateTo?, ...data }. Show `text` to privateTo (or everyone
 *   when privateTo is undefined) and `publicText` to the other player.
 */
(function (root) {
    'use strict';

    const Rift = root.Rift;
    const Battle = Rift.Battle || (Rift.Battle = {});

    const DEFAULTS = {
        hearts: 10, energyCap: 10, handLimit: 10, boardLimit: 7,
        deckSize: 20, minCreatures: 6, maxCreatures: 14,
        openHand: [3, 4], openAxioms: 1, spark: true,
        timeline: true, fateStart: 6, fateGap: 6, fateMax: 12,
        maxTurns: 60, first: 'random', shuffle: true, shuffleAxioms: true, mode: 'practice',
    };
    const RULE_DEFAULTS = {
        attackLimit: Infinity, attacksPerCreature: 1, costDelta: 0, growth: 1, drawCount: 1,
        heal: false, arrivalReady: false, ignoreGuard: false, mercy: false, abilityCostDelta: 0,
        abilitiesOff: false, reverseHearts: false, heroDamageCap: null, wheelReversed: false,
    };
    const PAD_SPECIES = ['astrophysicat', 'zuckerborg', 'siuuugull'];
    const KEYWORDS = ['guard', 'swift', 'shield'];

    const species = id => (Rift.data.creatures || {})[id];
    const abilityDefs = () => Battle.Abilities || {};
    const axiomDefs = () => Rift.data.axioms || {};
    const tacticDefs = () => Rift.data.tactics || {};
    const isHero = t => t === 'h0' || t === 'h1';
    const heroId = p => 'h' + p;

    function removeFrom(list, item) {
        const i = list.indexOf(item);
        if (i >= 0) list.splice(i, 1);
        return i >= 0;
    }

    // Hand-written copy (much faster than JSON for 10,000-game simulations).
    function cloneState(state) {
        const cards = {};
        for (const cid in state.cards) {
            const c = state.cards[cid];
            const copy = { ...c };
            if (c.kind === 'creature') {
                copy.buffs = c.buffs.slice();
                copy.gained = c.gained.slice();
                copy.extraKeywords = c.extraKeywords.slice();
            }
            cards[cid] = copy;
        }
        const s = { ...state };
        s.players = state.players.map(P => ({
            ...P, deck: P.deck.slice(), hand: P.hand.slice(), axHand: P.axHand.slice(),
            board: P.board.slice(), discard: P.discard.slice(), knows: P.knows.slice(),
        }));
        s.cards = cards;
        s.roundTurns = state.roundTurns.slice();
        s.pending = state.pending ? { ...state.pending } : null;
        s.axioms = { ...state.axioms, active: { ...state.axioms.active }, deck: state.axioms.deck.slice(), discard: state.axioms.discard.slice() };
        s.fate = { ...state.fate };
        s.lastEvents = [];
        return s;
    }

    // The log is an immutable linked list of event batches, so each action costs O(1).
    function fullLog(state) {
        const batches = [];
        for (let node = state.log; node; node = node.prev) batches.push(node.events);
        const out = [];
        for (let i = batches.length - 1; i >= 0; i--) out.push.apply(out, batches[i]);
        return out;
    }

    // ---- rules ------------------------------------------------------------------

    function activeAxioms(s) {
        return Object.values(s.axioms.active).map(id => axiomDefs()[id]).filter(Boolean);
    }

    const ruleCache = new Map();
    function rules(s) {
        const key = Object.values(s.axioms.active).join('|');
        if (ruleCache.has(key)) return ruleCache.get(key);
        const out = Object.assign({}, RULE_DEFAULTS);
        activeAxioms(s).forEach(a => Object.assign(out, a.rules || {}));
        if (ruleCache.size >= 256) ruleCache.delete(ruleCache.keys().next().value);
        ruleCache.set(key, Object.freeze(out));
        return out;
    }
    function combatAxiom(s) { return activeAxioms(s).find(a => a.category === 'combat') || null; }

    // ---- card queries --------------------------------------------------------------

    function cardName(s, cid) {
        if (isHero(cid)) return s.players[+cid[1]].name;
        const c = s.cards[cid];
        if (!c) return '?';
        if (c.kind === 'tactic') return (tacticDefs()[c.tactic] || {}).name || c.tactic;
        const base = (species(c.species) || {}).name || c.species;
        return c.nickname ? '"' + c.nickname + '"' : base;
    }
    function playerName(s, p) { return s.players[p].name; }
    // "Anna plays" / "You play".
    function says(s, p, verb) {
        const name = s.players[p].name;
        if (name !== 'You') return name + ' ' + verb;
        const base = { has: 'have', goes: 'go', wins: 'win', takes: 'take', chooses: 'choose', plays: 'play',
            attacks: 'attack', loses: 'lose', ends: 'end', draws: 'draw', activates: 'activate', skips: 'skip', uses: 'use' }[verb] || verb;
        return 'You ' + base;
    }

    // Ability ids that currently work on this creature.
    function abilityIds(s, card) {
        if (!card || card.kind !== 'creature' || card.silenced || rules(s).abilitiesOff) return [];
        const list = [];
        if (card.ability && abilityDefs()[card.ability]) list.push(card.ability);
        card.gained.forEach(a => { if (abilityDefs()[a] && !list.includes(a)) list.push(a); });
        return list;
    }
    function eachAbility(s, card, fn) {
        abilityIds(s, card).forEach(id => fn(abilityDefs()[id], id));
    }
    function abilityFlag(s, card, flag) {
        return abilityIds(s, card).some(id => !!abilityDefs()[id][flag]);
    }

    function keywordsOf(s, cid) {
        const c = s.cards[cid];
        if (!c || c.kind !== 'creature' || c.silenced || rules(s).abilitiesOff) return [];
        const out = [];
        const add = k => { if (!out.includes(k)) out.push(k); };
        c.baseKeywords.forEach(add);
        eachAbility(s, c, def => (def.keywords || []).forEach(add));
        c.extraKeywords.forEach(add);
        if (abilityFlag(s, c, 'elusive')) add('elusive');
        return c.shieldUsed ? out.filter(k => k !== 'shield') : out;
    }
    const hasKeyword = (s, cid, k) => keywordsOf(s, cid).includes(k);

    function colourOf(s, card) {
        return card.colourless ? 'memory' : (card.colour || 'memory');
    }
    function wheelBonus(s, card, foe) {
        const W = Rift.data.wheel;
        if (!W || !foe || foe.kind !== 'creature') return 0;
        const a = colourOf(s, card), b = colourOf(s, foe);
        if (a === 'memory' || b === 'memory' || a === b) return 0;
        const wins = rules(s).wheelReversed ? W.beats[b] === a : W.beats[a] === b;
        return wins ? W.bonus : 0;
    }

    function attackParts(s, cid, foeCid) {
        const c = s.cards[cid];
        const parts = [{ source: 'base', label: 'Base', amount: c.attack }];
        c.buffs.forEach(b => { if (b.attack) parts.push({ source: 'buff', label: b.label, amount: b.attack }); });
        eachAbility(s, c, def => {
            if (def.attackMod) { const v = def.attackMod(s, c, H); if (v) parts.push({ source: 'ability', label: def.name, amount: v }); }
        });
        const onBoard = s.players[c.controller].board.includes(cid);
        s.players[c.controller].board.forEach(other => {
            if (other === cid || !onBoard) return;
            const src = s.cards[other];
            eachAbility(s, src, def => {
                if (def.aura) { const v = def.aura(s, src, c, H); if (v) parts.push({ source: 'aura', label: def.name, amount: v }); }
            });
        });
        activeAxioms(s).forEach(ax => {
            if (ax.powerMod) { const v = ax.powerMod(s, c, H); if (v) parts.push({ source: 'axiom', label: ax.name, amount: v }); }
        });
        if (foeCid && s.cards[foeCid]) {
            const w = wheelBonus(s, c, s.cards[foeCid]);
            if (w) parts.push({ source: 'colour', label: 'Colour wheel', amount: w });
        }
        return { total: Math.max(0, parts.reduce((sum, p) => sum + p.amount, 0)), parts };
    }
    function attackOf(s, cid, foeCid) { return attackParts(s, cid, foeCid).total; }

    function healthOf(s, cid) {
        const c = s.cards[cid];
        const max = Math.max(1, c.health + c.buffs.reduce((sum, b) => sum + (b.health || 0), 0));
        return { current: max - c.damage, max, damaged: c.damage > 0 };
    }

    function isSleeping(s, cid) {
        const c = s.cards[cid];
        return c.enteredTurn === s.turn && !rules(s).arrivalReady && !hasKeyword(s, cid, 'swift');
    }
    function attacksAllowed(s, cid) {
        let n = rules(s).attacksPerCreature;
        eachAbility(s, s.cards[cid], def => { if (def.attacksPerTurn) n = Math.max(n, def.attacksPerTurn); });
        return n;
    }

    function canAttack(s, cid) {
        const c = s.cards[cid];
        if (!c || c.kind !== 'creature' || s.phase !== 'main' || c.controller !== s.active) return false;
        const P = s.players[s.active];
        if (!P.board.includes(cid) || c.frozen || c.activated || isSleeping(s, cid)) return false;
        if (c.attacks >= attacksAllowed(s, cid) || P.attacksThisTurn >= rules(s).attackLimit) return false;
        return attackOf(s, cid) > 0;
    }

    function isHidden(s, cid) {
        const c = s.cards[cid];
        let hidden = false;
        eachAbility(s, c, def => { if (def.hidden && def.hidden(s, c, H)) hidden = true; });
        return hidden;
    }

    // Who a creature may attack right now (ignores readiness; see canAttack).
    function attackTargets(s, cid) {
        const c = s.cards[cid];
        const foe = 1 - c.controller;
        const creatures = s.players[foe].board.filter(t => !isHidden(s, t));
        const guards = creatures.filter(t => hasKeyword(s, t, 'guard'));
        if (guards.length && !rules(s).ignoreGuard && !abilityFlag(s, c, 'ignoresGuard')) return guards;
        return creatures.concat([heroId(foe)]);
    }

    // Valid targets for an Entrance, Activate or tactic used by player p.
    function targetsFor(s, spec, p, filter, sourceCid) {
        if (!spec) return [];
        const mine = s.players[p].board, theirs = s.players[1 - p].board;
        let list;
        switch (spec) {
            case 'enemy-creature': list = theirs.slice(); break;
            case 'friendly-creature': list = mine.slice(); break;
            case 'friendly-other': list = mine.filter(cid => cid !== sourceCid); break;
            case 'any-creature': list = mine.concat(theirs); break;
            case 'enemy-any': list = theirs.concat([heroId(1 - p)]); break;
            case 'any': list = mine.concat(theirs, [heroId(p), heroId(1 - p)]); break;
            default: list = [];
        }
        return list.filter(t => {
            if (isHero(t)) return true;
            if (s.cards[t].controller !== p && hasKeyword(s, t, 'elusive')) return false;
            return !filter || filter(s, t, H);
        });
    }

    function playCost(s, cid) {
        const c = s.cards[cid];
        if (c.kind === 'tactic') return (tacticDefs()[c.tactic] || { cost: 0 }).cost;
        return Math.max(0, c.cost + rules(s).costDelta);
    }
    function axiomCost(s, id) { return (axiomDefs()[id] || { cost: 2 }).cost; }

    // Paid abilities this creature has: [{ id, name, text, cost, target, filter }].
    function activations(s, cid) {
        const c = s.cards[cid];
        const out = [];
        eachAbility(s, c, (def, id) => {
            if (def.activate) out.push({ id, name: def.name, text: def.text, cost: Math.max(0, def.activate.cost + rules(s).abilityCostDelta), target: def.activate.target || null, filter: def.activate.filter || null });
        });
        return out;
    }
    function canActivateNow(s, cid) {
        const c = s.cards[cid];
        return c.controller === s.active && s.phase === 'main' && s.players[s.active].board.includes(cid)
            && !c.frozen && !c.activated && !c.attacks && !isSleeping(s, cid);
    }

    // A preview of a fight without running hooks (for the UI and quick AI checks).
    function fightPreview(s, att, target) {
        const pa = attackOf(s, att, isHero(target) ? null : target);
        if (isHero(target)) {
            let dmg = pa;
            eachAbility(s, s.cards[att], def => { if (def.heroDamage) dmg += def.heroDamage; });
            if (rules(s).heroDamageCap != null) dmg = Math.min(dmg, rules(s).heroDamageCap);
            return { hero: true, damage: dmg, hearts: s.players[+target[1]].hearts - dmg };
        }
        const pb = attackOf(s, target, att);
        const ax = combatAxiom(s);
        const res = ax && ax.resolveFight ? ax.resolveFight(pa, pb) : { toAttacker: pb, toDefender: pa };
        const after = (cid, amount) => {
            if (amount <= 0) return healthOf(s, cid).current;
            if (hasKeyword(s, cid, 'shield')) return healthOf(s, cid).current;
            let red = 0;
            eachAbility(s, s.cards[cid], def => { red += def.damageReduction || 0; });
            return healthOf(s, cid).current - Math.max(0, amount - red);
        };
        const ha = after(att, res.toAttacker), hb = after(target, res.toDefender);
        let defenderDefeated = hb <= 0;
        const attackerDefeated = ha <= 0;
        if (ax && ax.defenderSurvivesTrade && attackerDefeated && defenderDefeated) defenderDefeated = false;
        return { hero: false, pa, pb, toAttacker: res.toAttacker, toDefender: res.toDefender, attackerDefeated, defenderDefeated };
    }

    function creaturesLeft(s, p) {
        const P = s.players[p];
        return P.deck.concat(P.hand, P.board).some(cid => s.cards[cid].kind === 'creature');
    }

    // Everything a card face needs.
    function describe(s, cid) {
        const c = s.cards[cid];
        if (c.kind === 'tactic') {
            const t = tacticDefs()[c.tactic] || {};
            return { cid, kind: 'tactic', id: c.tactic, name: t.name, cost: playCost(s, cid), text: t.text, flavour: t.flavour, target: t.target || null };
        }
        const sp = species(c.species) || {};
        const defs = abilityDefs();
        const lines = [];
        const off = c.silenced || rules(s).abilitiesOff;
        [c.ability].concat(c.gained).filter(Boolean).forEach((id, i) => {
            const def = defs[id];
            if (!def) return;
            const kind = def.activate ? 'activate' : def.entrance ? 'entrance' : def.lastWord ? 'lastword' : 'passive';
            lines.push({ id, name: def.name, text: def.text, kind, gained: i > 0, warped: i === 0 && c.warped, off,
                cost: def.activate ? Math.max(0, def.activate.cost + rules(s).abilityCostDelta) : null });
        });
        const onBoard = s.players[c.controller].board.includes(cid);
        const hp = healthOf(s, cid);
        return {
            cid, kind: 'creature', species: c.species, name: cardName(s, cid), speciesName: sp.name, legendary: c.legendary,
            colour: colourOf(s, c), printedColour: c.colour, cost: playCost(s, cid), baseCost: c.cost,
            attack: attackOf(s, cid), baseAttack: c.attack, attackParts: attackParts(s, cid).parts,
            health: hp.current, maxHealth: hp.max, baseHealth: c.health, damaged: hp.damaged,
            keywords: keywordsOf(s, cid), lines, silenced: !!c.silenced, onBoard,
            sleeping: onBoard && isSleeping(s, cid), frozen: !!c.frozen, activated: !!c.activated, attacks: c.attacks,
            canAttack: canAttack(s, cid), hidden: onBoard && isHidden(s, cid),
            variant: c.variant, taught: c.taught, injured: c.injured.slice(), loaner: c.loaner, trophyOf: c.trophyOf,
            prediction: c.prediction, metaverseUsed: c.metaverseUsed,
        };
    }

    function ruleSummary(s) {
        const r = rules(s);
        const combat = combatAxiom(s);
        const limit = r.attackLimit === Infinity ? '' : ' At most ' + r.attackLimit + ' attack' + (r.attackLimit === 1 ? '' : 's') + ' per player per turn.';
        return [
            ['Win', r.reverseHearts ? 'Reach zero of YOUR OWN hearts to win.' : 'Reduce the enemy hero to zero hearts.'],
            ['Turn', 'Choose one draw: your deck, the axiom deck, or move Fate 2 spaces. Energy grows by ' + r.growth + ' and refills (max ' + s.options.energyCap + ').'],
            ['Attacks', (r.attacksPerCreature > 1 ? 'Each ready creature may attack twice.' : 'Each ready creature may attack once.') + limit + ' New creatures wait a turn unless Swift' + (r.arrivalReady ? ' (now: all can act at once).' : '.')],
            ['Combat', (combat ? combat.text : 'Both creatures deal damage equal to their attack.') + ' Damage stays' + (r.heal ? ' until the controller\'s next turn (healing rule).' : '.')],
            ['Guard', r.ignoreGuard ? 'Guard is ignored right now.' : 'If the enemy has Guard creatures, attack one of them first.'],
            ['Hero hits', r.heroDamageCap != null ? 'Attacks on heroes remove only ' + r.heroDamageCap + ' heart.' : 'An attack on a hero removes hearts equal to its attack.'],
            ['Costs', 'Creatures ' + (r.costDelta ? (r.costDelta > 0 ? '+' : '') + r.costDelta + ' energy. ' : 'cost what they show. ') + 'Activating ' + (r.abilityCostDelta ? 'costs ' + r.abilityCostDelta + ' more. ' : 'uses the creature\'s attack. ') + (r.abilitiesOff ? 'Abilities are OFF.' : '')],
            ['Defeat', r.mercy ? 'Defeated creatures return to their owner\'s hand.' : 'Defeated creatures go to the discard pile.'],
        ];
    }

    function timeline(s) {
        if (!s.options.timeline) return [];
        return [0, 1].map(offset => {
            const turns = s.fate.until + offset * s.options.fateGap;
            const reset = (s.fate.events + offset) % 2 === 1;
            const top = s.axioms.deck[0] || s.axioms.discard[0];
            return {
                turns, turn: s.turn + turns, type: reset ? 'reset' : 'flip',
                text: reset ? 'Reset all rules to the basics' : offset ? 'Free flip from the shared deck'
                    : s.axioms.deck.length ? 'Free flip: ' + axiomDefs()[s.axioms.deck[0]].name : top ? 'Free flip from the reshuffled deck' : 'No rule left to flip',
            };
        });
    }

    // ---- legal actions ------------------------------------------------------------------

    function decider(s) {
        if (s.winner != null) return null;
        if (s.phase === 'choose') return s.pending ? s.pending.player : null;
        if (s.phase === 'draw' || s.phase === 'main') return s.active;
        return null;
    }

    const handCount = P => P.hand.length + P.axHand.length;

    function drawChoices(s) {
        const P = s.players[s.active];
        const room = handCount(P) < s.options.handLimit;
        const out = [];
        if (room && P.deck.length) out.push('deck');
        if (room && (s.axioms.deck.length || s.axioms.discard.length)) out.push('axiom');
        if (s.options.timeline) out.push('forward', 'rewind');
        if (!out.length) out.push('none');
        return out;
    }

    function legalActions(s) {
        if (s.winner != null) return [];
        const p = decider(s);
        if (p == null) return [];
        if (s.phase === 'draw') return drawChoices(s).map(choice => ({ type: 'draw', player: p, choice }));
        if (s.phase === 'choose') return s.pending.options.map(choice => ({ type: 'choose', player: p, choice }));
        if (s.phase !== 'main') return [];
        const P = s.players[p];
        const list = [{ type: 'end', player: p }];
        if (P.spark) list.push({ type: 'spark', player: p });
        P.hand.forEach(cid => {
            if (playCost(s, cid) > P.energy) return;
            const c = s.cards[cid];
            if (c.kind === 'creature') {
                if (P.board.length >= s.options.boardLimit) return;
                const entry = entranceOf(s, c);
                const targets = entry && entry.target ? targetsFor(s, entry.target, p, entry.filter, cid) : [];
                if (targets.length) targets.forEach(target => list.push({ type: 'play', player: p, cid, target }));
                else list.push({ type: 'play', player: p, cid });
            } else {
                const def = tacticDefs()[c.tactic];
                if (!def) return;
                if (def.target) targetsFor(s, def.target, p, def.filter, null).forEach(target => list.push({ type: 'play', player: p, cid, target }));
                else list.push({ type: 'play', player: p, cid });
            }
        });
        Array.from(new Set(P.axHand)).forEach(id => { if (axiomCost(s, id) <= P.energy) list.push({ type: 'axiom', player: p, choice: id }); });
        P.board.forEach(cid => {
            if (canAttack(s, cid)) attackTargets(s, cid).forEach(target => list.push({ type: 'attack', player: p, cid, target }));
            if (canActivateNow(s, cid)) activations(s, cid).forEach(a => {
                if (a.cost > P.energy) return;
                if (a.target) targetsFor(s, a.target, p, a.filter, cid).forEach(target => list.push({ type: 'activate', player: p, cid, ability: a.id, target }));
                else list.push({ type: 'activate', player: p, cid, ability: a.id });
            });
        });
        return list;
    }

    // The creature's (first) working Entrance, before it is played (abilities are checked as if on board).
    function entranceOf(s, card) {
        if (card.silenced || rules(s).abilitiesOff) return null;
        const ids = [card.ability].concat(card.gained).filter(Boolean);
        for (const id of ids) { const def = abilityDefs()[id]; if (def && def.entrance) return def.entrance; }
        return null;
    }

    function winner(s) { return s.winner == null ? null : s.winner; }

    function lostUids(s, p) {
        const out = [];
        s.players.forEach(P => P.discard.forEach(cid => {
            const c = s.cards[cid];
            if (c.kind === 'creature' && c.owner === p && !c.loaner && !out.includes(c.uid)) out.push(c.uid);
        }));
        return out;
    }

    // ---- creation ----------------------------------------------------------------------

    function padInstance(p, i) {
        return { uid: 'loan-' + p + '-' + i, species: PAD_SPECIES[i % PAD_SPECIES.length], powerDelta: 0, scars: [], injuries: [], warped: null, trophyOf: null, loaner: true };
    }

    function makeCreature(cid, inst, owner) {
        const sp = species(inst.species);
        if (!sp) throw new Error('Unknown species: ' + inst.species);
        const v = inst.variant || {};
        const taught = inst.taught || null;
        const injuries = inst.injuries || [];
        const kws = (sp.keywords || []).slice();
        [v.trait, taught].forEach(k => { if (KEYWORDS.includes(k) && !kws.includes(k)) kws.push(k); });
        return {
            cid, kind: 'creature', uid: inst.uid || cid, species: inst.species, owner, controller: owner,
            colour: sp.colour, cost: sp.cost,
            attack: Math.max(0, sp.attack + (v.attack || 0) + (taught === 'attack' ? 1 : 0) + (inst.powerDelta || 0)),
            health: Math.max(1, sp.health + (v.health || 0) + (taught === 'health' ? 1 : 0) + (v.trait === 'sturdy' ? 1 : 0)),
            baseKeywords: kws,
            ability: injuries.includes('no-ability') ? null : ((inst.warped && inst.warped.ability) || sp.ability || null),
            gained: [], buffs: [], extraKeywords: [],
            damage: 0, enteredTurn: null, attacks: 0, activated: false, frozen: false, silenced: false, shieldUsed: false,
            nickname: null, colourless: false, prediction: null, metaverseUsed: false, siuuu: 0,
            legendary: sp.rarity === 'legendary', loaner: !!inst.loaner, trophyOf: inst.trophyOf || null,
            injured: injuries.slice(), warped: !!(inst.warped && inst.warped.ability),
            variant: inst.variant || null, taught, defeats: 0,
        };
    }

    function axiomSelection(pool) {
        const out = [];
        (pool || []).concat((Rift.data.axiomDecks || {}).default || []).forEach(id => {
            if (out.length < 10 && axiomDefs()[id] && !out.includes(id)) out.push(id);
        });
        return out;
    }
    // Ten distinct cards from each side. Copies between sides remain in the shared deck.
    function buildAxiomDeck(mine, theirs) { return axiomSelection(mine).concat(axiomSelection(theirs)); }

    // A tactic contribution: known ids, at most two copies each.
    function tacticSelection(list) {
        const known = tacticDefs();
        const counts = {};
        return (list || []).filter(id => known[id] && (counts[id] = (counts[id] || 0) + 1) <= 2);
    }

    function createBattle(config) {
        const cfg = config || {};
        const opts = Object.assign({}, DEFAULTS, cfg.options || {});
        const seed = String(cfg.seed == null ? 'battle' : cfg.seed);
        const rng = Rift.makeRng('battle:' + seed + ':0');
        const players = cfg.players || [];
        if (players.length !== 2) throw new Error('A battle needs exactly two players.');

        const s = {
            v: 3, seed, step: 0, turn: 1, round: 0, roundTurns: [false, false],
            active: 0, phase: 'setup', pending: null,
            players: [], cards: {},
            axioms: { deck: [], discard: [], active: {}, flips: 0 },
            fate: { until: opts.fateStart, events: 0 },
            winner: null, endReason: null, options: opts,
            log: null, lastEvents: [],
        };

        players.forEach((pl, i) => {
            const tactics = tacticSelection(pl.tactics == null ? (Rift.data.tacticDecks || {}).starter : pl.tactics);
            const want = Math.min(opts.maxCreatures, Math.max(opts.minCreatures, opts.deckSize - tactics.length));
            const team = (pl.team || []).filter(inst => inst && species(inst.species)).slice(0, opts.maxCreatures);
            let k = 0;
            while (team.length < want) team.push(padInstance(i, k++));
            const ids = team.map((inst, j) => {
                const cid = 'p' + i + 'c' + j;
                s.cards[cid] = makeCreature(cid, inst, i);
                return cid;
            });
            tactics.slice(0, Math.max(0, opts.deckSize - ids.length)).forEach((id, j) => {
                const cid = 'p' + i + 't' + j;
                s.cards[cid] = { cid, kind: 'tactic', tactic: id, owner: i, controller: i };
                ids.push(cid);
            });
            const cons = pl.consumables || {};
            const hearts = (pl.hearts == null ? opts.hearts : pl.hearts) + 2 * (cons['extra-life'] || 0);
            s.players.push({
                id: pl.id || ('p' + i), name: pl.name || (i === 0 ? 'You' : 'Opponent'),
                hearts, maxHearts: hearts, energy: 0, capacity: 0, spark: false,
                deck: opts.shuffle ? rng.shuffle(ids) : ids, hand: [], axHand: [], board: [], discard: [],
                playedCount: 0, turnsTaken: 0, attacksThisTurn: 0, knows: [],
                consumables: Object.assign({}, cons),
            });
        });

        const known = axiomDefs();
        const axIds = (cfg.axiomDeck || buildAxiomDeck(players[0].axioms, players[1].axioms)).filter(id => known[id]);
        s.axioms.deck = opts.shuffleAxioms ? rng.shuffle(axIds) : axIds.slice();
        s.active = opts.first === 'random' ? rng.int(0, 1) : (opts.first ? 1 : 0);

        const G = { s, rng, events: [] };
        [s.active, 1 - s.active].forEach((p, order) => {
            for (let i = 0; i < opts.openHand[order]; i++) draw(G, p, true);
            for (let i = 0; i < opts.openAxioms; i++) drawAxiom(G, p, true);
        });
        if (opts.spark) {
            s.players[1 - s.active].spark = true;
            emit(G, { t: 'spark', player: 1 - s.active, text: says(s, 1 - s.active, 'goes') + ' second: one extra card and the Spark (+1 energy once).' });
        }
        emit(G, { t: 'start', text: says(s, s.active, 'goes') + ' first.' });
        startTurn(G);
        s.lastEvents = G.events;
        s.log = { prev: null, events: G.events };
        return s;
    }

    // ---- applying actions ------------------------------------------------------------------

    function actionKey(a) {
        return [a.type, a.cid || '', a.target || '', a.choice == null ? '' : a.choice, a.ability || ''].join('|');
    }

    function applyAction(state, action) {
        if (!action) throw new Error('No action given.');
        if (action.player != null && action.player !== decider(state)) throw new Error('Wrong player.');
        const key = actionKey(action);
        const match = legalActions(state).find(a => actionKey(a) === key);
        if (!match) throw new Error('Illegal action ' + JSON.stringify(action) + ' in phase ' + state.phase);
        const s = cloneState(state);
        s.step += 1;
        const G = { s, rng: Rift.makeRng('battle:' + s.seed + ':' + s.step), events: [] };
        switch (match.type) {
            case 'draw': doDraw(G, match.choice); break;
            case 'play': doPlay(G, match.cid, match.target || null); break;
            case 'axiom': doAxiom(G, match.choice); break;
            case 'attack': doAttack(G, match.cid, match.target); break;
            case 'activate': doActivate(G, match.cid, match.ability, match.target || null); break;
            case 'spark': doSpark(G); break;
            case 'end': endTurn(G); break;
            case 'choose': resolveChoice(G, match.choice); break;
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

    // The api handed to ability and tactic hooks.
    function api(G) {
        const s = G.s;
        return {
            s, rng: G.rng, H,
            emit: ev => emit(G, ev),
            name: cid => cardName(s, cid),
            draw: p => draw(G, p),
            drawAxiom: p => drawAxiom(G, p),
            damage: (target, amount, source) => (isHero(target) ? damageHero(G, +target[1], amount) : dealDamage(G, target, amount, source)),
            heal(cid, n) { const c = s.cards[cid]; c.damage = Math.max(0, c.damage - n); },
            healHero(p, n) { const P = s.players[p]; P.hearts = Math.min(P.maxHearts, P.hearts + n); },
            defeat: (cid, why) => defeat(G, cid, why),
            silence: cid => silence(G, cid),
            freeze(cid) { s.cards[cid].frozen = true; },
            bounce: cid => bounce(G, cid),
            fromDiscard(cid) { const P = s.players[s.cards[cid].owner]; if (removeFrom(P.discard, cid)) toHand(G, P === s.players[0] ? 0 : 1, cid); },
            toHand: (p, cid) => toHand(G, p, cid),
            buff(cid, attack, health, label, temp) { s.cards[cid].buffs.push({ label, attack: attack || 0, health: health || 0, temp: !!temp }); },
            addKeyword(cid, k) { const c = s.cards[cid]; if (!c.extraKeywords.includes(k)) c.extraKeywords.push(k); if (k === 'shield') c.shieldUsed = false; },
            shiftFate: n => shiftFate(G, n),
            setAxiom: (id, by) => setAxiom(G, id, by),
            takeAxiom(id) { removeFrom(s.axioms.deck, id); },
            refillAxioms: () => refillAxioms(G),
            ask: req => ask(G, req),
            attack: cid => attackOf(s, cid),
        };
    }

    function toHand(G, p, cid) {
        const P = G.s.players[p];
        if (handCount(P) >= G.s.options.handLimit) { P.discard.push(cid); emit(G, { t: 'burn', player: p, cid, text: says(G.s, p, 'has') + ' a full hand: ' + cardName(G.s, cid) + ' is discarded.' }); return false; }
        P.hand.push(cid);
        return true;
    }

    function draw(G, p, quiet) {
        const P = G.s.players[p];
        if (!P.deck.length || handCount(P) >= G.s.options.handLimit) return null;
        const cid = P.deck.shift();
        P.hand.push(cid);
        if (!quiet) emit(G, { t: 'draw', player: p, cid, privateTo: p, text: 'You draw ' + cardName(G.s, cid) + '.', publicText: playerName(G.s, p) + ' draws a card.' });
        return cid;
    }

    function drawAxiom(G, p, quiet) {
        const s = G.s, P = s.players[p];
        refillAxioms(G);
        if (!s.axioms.deck.length || handCount(P) >= s.options.handLimit) return null;
        const id = s.axioms.deck.shift();
        P.axHand.push(id);
        if (!quiet) emit(G, { t: 'draw-axiom', player: p, id, privateTo: p, text: 'You take the axiom card ' + axiomDefs()[id].name + '.', publicText: playerName(s, p) + ' takes an axiom card.' });
        return id;
    }

    function resetCard(c) {
        c.damage = 0; c.buffs = []; c.gained = []; c.extraKeywords = [];
        c.enteredTurn = null; c.attacks = 0; c.activated = false; c.frozen = false; c.silenced = false; c.shieldUsed = false;
        c.nickname = null; c.colourless = false; c.prediction = null; c.siuuu = 0;
    }

    function setWinner(G, p, reason) {
        const s = G.s;
        if (s.winner != null) return;
        s.winner = p;
        s.endReason = reason;
        s.phase = 'over';
        s.pending = null;
        emit(G, { t: 'end', winner: p, reason, text: p === 'draw' ? 'The battle ends in a draw.' : says(s, p, 'wins') + ' the battle!' });
    }

    // ---- turn structure ----------------------------------------------------------------------

    function startTurn(G) {
        const s = G.s;
        if (s.winner != null) return;
        if (s.round === 0 || (s.roundTurns[0] && s.roundTurns[1])) {
            s.round += 1;
            s.roundTurns = [false, false];
            emit(G, { t: 'round', text: 'Round ' + s.round + '.' });
        }
        if (s.turn > s.options.maxTurns) { emit(G, { t: 'limit', text: 'The rift closes after ' + s.options.maxTurns + ' turns. Draw.' }); setWinner(G, 'draw', 'turn-limit'); return; }
        const p = s.active, P = s.players[p], r = rules(s);
        if (!creaturesLeft(s, p)) {
            emit(G, { t: 'stuck', player: p, text: says(s, p, 'has') + ' no creatures left.' });
            setWinner(G, 1 - p, 'cannot-act');
            return;
        }
        P.capacity = Math.min(s.options.energyCap, P.capacity + r.growth);
        P.energy = P.capacity + (P.consumables['extra-energy'] || 0);
        P.attacksThisTurn = 0;
        P.board.forEach(cid => {
            const c = s.cards[cid];
            c.attacks = 0; c.activated = false;
            if (r.heal) c.damage = 0;
        });
        s.phase = 'draw';
        s.pending = null;
        emit(G, { t: 'turn', player: p, text: playerName(s, p) + ': ' + P.energy + ' energy. Choose a draw.' });
    }

    function doDraw(G, choice) {
        const s = G.s, p = s.active, n = rules(s).drawCount;
        if (choice === 'deck') { for (let i = 0; i < n; i++) draw(G, p); }
        else if (choice === 'axiom') { for (let i = 0; i < n; i++) drawAxiom(G, p); }
        else if (choice === 'forward' || choice === 'rewind') {
            emit(G, { t: 'time', player: p, text: says(s, p, 'skips') + ' the draw and moves Fate 2 spaces ' + (choice === 'forward' ? 'closer.' : 'away.') });
            shiftFate(G, choice === 'forward' ? 2 : -2);
        }
        if (s.winner == null) { s.phase = 'main'; cleanup(G); }
    }

    function doSpark(G) {
        const P = G.s.players[G.s.active];
        P.spark = false;
        P.energy += 1;
        emit(G, { t: 'spark', player: G.s.active, text: says(G.s, G.s.active, 'uses') + ' the Spark: +1 energy this turn.' });
    }

    function endTurn(G) {
        const s = G.s, p = s.active, P = s.players[p];
        P.board.slice().forEach(cid => {
            const c = s.cards[cid];
            eachAbility(s, c, def => { if (def.onTurnEnd) def.onTurnEnd(api(G), c); });
        });
        Object.values(s.cards).forEach(c => { if (c.kind === 'creature' && c.buffs.some(b => b.temp)) c.buffs = c.buffs.filter(b => !b.temp); });
        P.board.forEach(cid => { s.cards[cid].frozen = false; });
        cleanup(G);
        emit(G, { t: 'turn-end', player: p, text: says(s, p, 'ends') + ' the turn.' });
        P.turnsTaken += 1;
        s.roundTurns[p] = true;
        if (s.winner != null) return;
        s.turn += 1;
        s.active = 1 - p;
        shiftFate(G, 1);
        if (s.winner == null) startTurn(G);
    }

    // Positive shifts move the next event closer; negative shifts delay it.
    function shiftFate(G, turns) {
        const s = G.s;
        if (!s.options.timeline) return;
        s.fate.until = Math.max(0, Math.min(s.options.fateMax, s.fate.until - turns));
        if (s.fate.until) return;
        if (s.fate.events % 2 === 1) {
            s.axioms.discard.push(...Object.values(s.axioms.active));
            s.axioms.active = {};
            emit(G, { t: 'reset', text: 'Fate reset: all rules return to the basics.' });
        } else {
            refillAxioms(G);
            if (s.axioms.deck.length) { emit(G, { t: 'flip', text: 'Fate flips a free rule.' }); setAxiom(G, s.axioms.deck.shift(), null); }
        }
        s.fate.events += 1;
        s.fate.until = s.options.fateGap;
        cleanup(G);
    }

    function refillAxioms(G) {
        const A = G.s.axioms;
        if (!A.deck.length && A.discard.length) { A.deck = G.rng.shuffle(A.discard); A.discard = []; }
    }

    // by: the player who played the card, or null for a Fate flip.
    function setAxiom(G, id, by) {
        const s = G.s, A = s.axioms, ax = axiomDefs()[id];
        const old = A.active[ax.category];
        if (old) A.discard.push(old);
        A.active[ax.category] = id;
        A.flips += 1;
        emit(G, { t: 'axiom', id, player: by, text: 'Rule change — ' + ax.category + ': ' + ax.name + '. ' + ax.text });
        if (by != null) {
            [0, 1].forEach(p => s.players[p].board.slice().forEach(cid => {
                const c = s.cards[cid];
                eachAbility(s, c, def => { if (def.onAxiomPlayed) def.onAxiomPlayed(api(G), c, id, by); });
            }));
        }
    }

    // ---- main-phase moves ---------------------------------------------------------------------

    function spend(G, amount) { G.s.players[G.s.active].energy -= amount; }

    function doPlay(G, cid, target) {
        const s = G.s, p = s.active, P = s.players[p], c = s.cards[cid];
        spend(G, playCost(s, cid));
        removeFrom(P.hand, cid);
        s.players[1 - p].knows = s.players[1 - p].knows.filter(k => k !== cid);
        if (c.kind === 'tactic') {
            const def = tacticDefs()[c.tactic];
            P.discard.push(cid);
            emit(G, { t: 'tactic-play', player: p, cid, id: c.tactic, target, text: says(s, p, 'plays') + ' the tactic ' + def.name + (target ? ' on ' + cardName(s, target) : '') + '.' });
            def.run(api(G), p, target);
        } else {
            P.board.push(cid);
            c.enteredTurn = s.turn;
            P.playedCount += 1;
            emit(G, { t: 'play', player: p, cid, target, text: says(s, p, 'plays') + ' ' + cardName(s, cid) + '.' });
            s.players[1 - p].board.slice().forEach(other => {
                const o = s.cards[other];
                eachAbility(s, o, def => { if (def.onEnemyPlay) def.onEnemyPlay(api(G), o, cid); });
            });
            const entry = entranceOf(s, c);
            if (entry && (!entry.target || target)) entry.run(api(G), c, target);
            else if (entry) emit(G, { t: 'fizzle', cid, text: cardName(s, cid) + ' finds no target for its Entrance.' });
        }
        afterMove(G);
    }

    function doAxiom(G, id) {
        const s = G.s, p = s.active, P = s.players[p];
        spend(G, axiomCost(s, id));
        removeFrom(P.axHand, id);
        emit(G, { t: 'axiom-play', player: p, id, text: says(s, p, 'plays') + ' an axiom card.' });
        setAxiom(G, id, p);
        afterMove(G);
    }

    function doActivate(G, cid, ability, target) {
        const s = G.s, c = s.cards[cid];
        const a = activations(s, cid).find(x => x.id === ability);
        spend(G, a.cost);
        c.activated = true;
        emit(G, { t: 'activate', player: s.active, cid, ability, target, text: says(s, s.active, 'activates') + ' ' + cardName(s, cid) + ': ' + a.name + '.' });
        abilityDefs()[ability].activate.run(api(G), c, target);
        afterMove(G);
    }

    function afterMove(G) {
        cleanup(G);
        if (G.s.winner == null && G.s.phase !== 'choose') G.s.phase = 'main';
    }

    // Abilities and tactics ask questions through this:
    // { player, kind: 'card'|'colour'|'axiom'|'ability'|'option', options, labels?, prompt, auto?, source: { type, id, cid? } }
    function ask(G, req) {
        const s = G.s;
        if (!req.options || !req.options.length) return false;
        if (req.options.length === 1 && req.auto !== false) {
            answer(G, req, req.options[0]);
            return true;
        }
        s.phase = 'choose';
        s.pending = Object.assign({}, req, { choiceKind: req.kind });
        return true;
    }

    function answer(G, req, choice) {
        const s = G.s;
        if (req.source.type === 'tactic') tacticDefs()[req.source.id].choose(api(G), req.player, choice, req);
        else abilityDefs()[req.source.id].choose(api(G), s.cards[req.source.cid], choice, req);
    }

    function resolveChoice(G, choice) {
        const s = G.s, req = s.pending;
        s.pending = null;
        s.phase = 'resolving';
        answer(G, req, choice);
        afterMove(G);
    }

    // ---- combat ---------------------------------------------------------------------------------

    function doAttack(G, cid, target) {
        const s = G.s, p = s.active, c = s.cards[cid];
        c.attacks += 1;
        s.players[p].attacksThisTurn += 1;
        emit(G, { t: 'attack', player: p, cid, target, text: says(s, p, 'attacks') + ' ' + cardName(s, target) + ' with ' + cardName(s, cid) + '.' });
        eachAbility(s, c, def => { if (def.onAttack) def.onAttack(api(G), c, target); });
        if (isHero(target)) {
            const prev = fightPreview(s, cid, target);
            damageHero(G, +target[1], prev.damage, cid);
        } else {
            const d = s.cards[target];
            eachAbility(s, d, def => { if (def.onAttacked) def.onAttacked(api(G), d, cid); });
            fight(G, cid, target);
        }
        afterMove(G);
    }

    function fight(G, att, def) {
        const s = G.s;
        const pa = attackOf(s, att, def), pb = attackOf(s, def, att);
        const ax = combatAxiom(s);
        const res = ax && ax.resolveFight ? ax.resolveFight(pa, pb) : { toAttacker: pb, toDefender: pa };
        emit(G, { t: 'fight', attacker: att, defender: def, pa, pb, text: cardName(s, att) + ' (' + pa + ' attack) fights ' + cardName(s, def) + ' (' + pb + ' attack).' });
        dealDamage(G, def, res.toDefender, att);
        dealDamage(G, att, res.toAttacker, def);
        const aDead = healthOf(s, att).current <= 0, dDead = healthOf(s, def).current <= 0;
        if (aDead && dDead && ax && ax.defenderSurvivesTrade) {
            s.cards[def].damage = healthOf(s, def).max - 1;
            emit(G, { t: 'axiom-effect', cid: def, text: ax.name + ': ' + cardName(s, def) + ' survives on 1 health.' });
        }
        const aLive = healthOf(s, att).current > 0, dLive = healthOf(s, def).current > 0;
        const won = aLive && !dLive ? att : dLive && !aLive ? def : null;
        if (won) activeAxioms(s).forEach(a => {
            if (a.onFightWon) { a.onFightWon(api(G), s.cards[won]); emit(G, { t: 'axiom-effect', cid: won, text: a.name + ': ' + cardName(s, won) + ' grows stronger.' }); }
        });
        [[att, aLive, def], [def, dLive, att]].forEach(([cid, alive, foe]) => {
            if (!alive) return;
            const c = s.cards[cid];
            eachAbility(s, c, d => { if (d.onSurvive) d.onSurvive(api(G), c, foe); });
        });
    }

    function dealDamage(G, cid, amount, source) {
        const s = G.s, c = s.cards[cid];
        if (!c || amount <= 0 || !s.players[c.controller].board.includes(cid)) return 0;
        if (hasKeyword(s, cid, 'shield')) {
            c.shieldUsed = true;
            c.extraKeywords = c.extraKeywords.filter(k => k !== 'shield');
            emit(G, { t: 'shield', cid, text: cardName(s, cid) + '\'s Shield blocks the damage.' });
            return 0;
        }
        let red = 0;
        eachAbility(s, c, def => { red += def.damageReduction || 0; });
        const dealt = Math.max(0, amount - red);
        if (!dealt) return 0;
        c.damage += dealt;
        emit(G, { t: 'damage', cid, amount: dealt, source, text: cardName(s, cid) + ' takes ' + dealt + ' damage.' });
        return dealt;
    }

    function damageHero(G, p, amount, source) {
        const s = G.s, P = s.players[p];
        if (amount <= 0) return 0;
        P.hearts = Math.max(0, P.hearts - amount);
        emit(G, { t: 'hit', player: p, amount, cid: source || null, text: says(s, p, 'loses') + ' ' + amount + ' heart' + (amount === 1 ? '' : 's') + ' (' + P.hearts + ' left).' });
        return amount;
    }

    // Defeat creatures at 0 health (their Last Words may cause more), then check hearts.
    function cleanup(G) {
        const s = G.s;
        for (let guard = 0; guard < 50; guard++) {
            const dead = [];
            [s.active, 1 - s.active].forEach(p => s.players[p].board.forEach(cid => { if (healthOf(s, cid).current <= 0) dead.push(cid); }));
            if (!dead.length) break;
            dead.forEach(cid => defeat(G, cid, 'damage'));
        }
        checkHearts(G);
    }

    function checkHearts(G) {
        const s = G.s;
        if (s.winner != null) return;
        const out = [0, 1].filter(p => s.players[p].hearts <= 0);
        if (!out.length) return;
        if (out.length === 2) { setWinner(G, 'draw', 'both-zero'); return; }
        const p = out[0];
        if (rules(s).reverseHearts) setWinner(G, p, 'reverse-hearts');
        else setWinner(G, 1 - p, 'hearts');
    }

    function defeat(G, cid, why) {
        const s = G.s, c = s.cards[cid];
        if (!removeFrom(s.players[c.controller].board, cid)) return;
        let dest = 'discard', saver = null;
        abilityIds(s, c).forEach(id => {
            const def = abilityDefs()[id];
            if (def.lastWord && def.lastWord(api(G), c) === 'hand' && dest === 'discard') { dest = 'hand'; saver = def.name; }
        });
        if (dest === 'discard' && rules(s).mercy) { dest = 'hand'; saver = 'Mercy'; }
        const name = cardName(s, cid);
        resetCard(c);
        c.defeats += 1;
        c.controller = c.owner;
        const P = s.players[c.owner];
        if (dest === 'hand' && handCount(P) < s.options.handLimit) P.hand.push(cid);
        else { dest = 'discard'; P.discard.push(cid); }
        emit(G, { t: 'defeated', cid, player: c.owner, dest, why,
            text: dest === 'hand' ? name + ' is defeated, but ' + saver + ' returns it to the hand.' : name + ' is defeated.' });
    }

    function bounce(G, cid) {
        const s = G.s, c = s.cards[cid];
        if (!removeFrom(s.players[c.controller].board, cid)) return;
        resetCard(c);
        c.controller = c.owner;
        toHand(G, c.owner, cid);
    }

    function silence(G, cid) {
        const c = G.s.cards[cid];
        const before = healthOf(G.s, cid).current;
        c.silenced = true;
        c.buffs = []; c.gained = []; c.extraKeywords = []; c.prediction = null; c.nickname = null; c.colourless = false;
        const max = healthOf(G.s, cid).max;
        c.damage = before >= max ? 0 : max - before;
    }

    // A random team of n instances, weighted by rarity (for the simulator and bench).
    function randomTeam(rng, n, opts) {
        const o = opts || {};
        const all = Rift.data.creatures || {};
        const rar = Rift.data.rarities || {};
        const weights = Object.keys(all)
            .filter(id => o.legendaries !== false || all[id].rarity !== 'legendary')
            .map(id => ({ item: id, weight: (rar[all[id].rarity] || { weight: 1 }).weight }));
        const team = [];
        for (let i = 0; i < n; i++) {
            team.push({ uid: (o.prefix || 'r') + '-' + i, species: rng.weighted(weights), caughtAt: 0,
                powerDelta: 0, scars: [], injuries: [], warped: null, trophyOf: null, wins: 0 });
        }
        return team;
    }

    // Helpers exposed to data hooks (abilities, axioms, tactics) and the AI.
    const H = {
        colourOf, wheelBonus, cardName, playerName, keywordsOf, hasKeyword,
        boardOf: (s, p) => s.players[p].board,
        attack: (s, cid, foe) => attackOf(s, cid, foe),
        health: (s, cid) => healthOf(s, cid).current,
        rules,
    };

    Battle.Engine = {
        DEFAULTS, RULE_DEFAULTS, PAD_SPECIES, KEYWORDS,
        createBattle, legalActions, applyAction, winner, decider, actionKey, cloneState, fullLog, lostUids,
        rules, activeAxioms, ruleSummary, timeline, describe,
        playCost, axiomCost, attackOf, attackParts, healthOf, keywordsOf, hasKeyword, isSleeping, isHidden,
        canAttack, attackTargets, activations, canActivateNow, targetsFor, entranceOf, fightPreview,
        colourOf, wheelBonus, cardName, says, isHero, heroId, drawChoices, creaturesLeft,
        buildAxiomDeck, axiomSelection, tacticSelection, randomTeam, H,
    };
})(typeof window !== 'undefined' ? window : globalThis);
