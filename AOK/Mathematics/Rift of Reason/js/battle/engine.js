/*
 * Battle engine (Card Arena rules, design/card-arena-2026-10-07.md).
 * PURE and deterministic: state + action → new state. No DOM.
 *
 * Heroes have hearts (10 by default). Creatures have attack and health; damage stays.
 * Each turn: one draw choice (own deck or the shared axiom deck), then play up to rules.playLimit
 * cards (2 by default; creatures, tactics and axiom cards) for energy, attack with ready creatures
 * (drag at a creature or the enemy hero; Guard must be attacked first), activate
 * abilities (uses that creature's attack), and End turn. Energy capacity grows
 * 1→10 and refills. The Fate track flips/resets the shared rules.
 *
 * The shared axiom deck is FINITE (teacher, 14 Oct, #117): played, replaced, reset and discarded
 * rule cards go to state.axioms.discard and never shuffle back in. Exhaustion: at a player's normal
 * draw step, when their own deck AND the shared axiom deck are both empty, they lose 1 heart, then 2,
 * then 3… (players[p].exhaustion counts the steps so far). See exhaustion(state, p) and doDraw.
 *
 * API (Rift.Battle.Engine):
 *   createBattle({ seed, players: [{ id, name, team: [instances], tactics?: [ids], axioms?: [ids],
 *                  hearts?, consumables?, bag?, power?: { id, tweaks: [] }, ownAxioms?: [ids] }], axiomDeck?: [ids], options })      → state
 *                  ownAxioms: the player's own rule cards (ax.own, e.g. Granny's Spare Axiom), added to the opening
 *                  hand; own cards are never taken into the shared axiom deck.
 *   legalActions(state) → [action]    applyAction(state, action) → new state (input untouched)
 *   applyLegal(state, action) → like applyAction but skips the legality check; only for an
 *                  action object taken from legalActions(state) of this same state (AI lookahead)
 *   decider(state) → player index who must act, or null     winner(state) → 0 | 1 | 'draw' | null
 *   describe(state, cid) → everything a card face needs (name, cost, attack, health, keywords, lines…)
 *   attackOf / healthOf / keywordsOf / canAttack / attackTargets / activations / targetsFor / fightPreview
 *   rules(state), ruleSummary(state), timeline(state), fullLog(state), lostUids(state, p), overkillOf(state, p)
 *   fateSchedule(state) → the public scheduled Fate events (#118/#119), fateEventPreview(state, id) → what
 *                  one would do if it resolved now (the real resolution, run on a copy), canSchedule(state, p)
 *   exhaustion(state, p) → { due, damage, count, reversed, lethal, wins } for the draw controls
 *   activeAxioms(state) → every active rule card (a "basic" one has ax.basic: it restates a default rule)
 *   changedAxioms(state) → only the active rule cards that change a basic rule
 *   cardName(state, cid) → plain name;  logName(state, cid) → "your X" / "Anna's X" when both boards have an X
 *   colourOf(state, card) → its colour for spotlights and the wheel; 'none' for a colourless (nicknamed) creature
 *   colourInPlay(state, p, colour) → p controls a creature of that colour (for abilities and the UI). A colour
 *                  tactic does NOT need one: deck construction limits colour tactics (Rift.State.validateDeck, #112)
 *
 * activations(state, cid) lists every paid ability (with `usable`); legalActions offers only usable ones,
 * and leaves out tactics whose `usable` hook says they would certainly fizzle.
 * A card discarded because the hand was full is tagged `burned` and is not reported by lostUids.
 *
 * Actions (each carries `player` in legalActions):
 *   { type: 'draw', choice: 'deck' | 'axiom' | 'none' }     phase 'draw'  ('forward' | 'rewind' only with options.timeDraws)
 *   { type: 'play', cid, target? }            creature or tactic from hand        phase 'main'
 *   { type: 'axiom', choice: axiomId }        play an axiom card from hand
 *   { type: 'attack', cid, target }           target: enemy creature cid or 'h0' / 'h1'
 *   { type: 'activate', cid, ability, target? }
 *   { type: 'spark' }                         second player, once: +1 energy this turn
 *   { type: 'item', id, target? }             use a bag item (one per turn; see "The Bag" below)
 *   { type: 'power', target? }                use the hero power (see "Hero powers" below)
 *   { type: 'end' }
 *   { type: 'choose', choice }                answer a pending question            phase 'choose'
 *
 * Events (state.lastEvents for the latest action, fullLog(state) for all):
 *   { t, text, publicText?, privateTo?, ...data }. Show `text` to privateTo (or everyone
 *   when privateTo is undefined) and `publicText` to the other player.
 *   Scheduled Fate events: 'fate-schedule' { player, id, cid, def, space, rounds }, 'fate-event' { id, def,
 *   cid, player, how: 'walk' | 'rewind', fires } (its effects follow), 'fate-expire' { id, def, player }.
 *
 * The Bag (design/card-arena-expansion-2026-10-07.md §3): players[p].bag lists the item ids brought
 * in (createBattle player.bag; only items with a `battle` block in data/items.js count). In the main
 * phase a player may use ONE item per turn for its energy cost; it leaves the bag and is added to
 * players[p].itemsUsed. itemsUsed(state, p) → { id: n } so the caller removes only those from the
 * save. bagStatus(state, p) → one entry per item kind for the Bag tray (with `ok` and `why`).
 * The arrays bag/itemsUsed are replaced (never changed in place), so cloneState can share them.
 *
 * Hero powers (design/AVATARS.md section 1, data/powers.js): players[p].power = { id, tweaks, cooldown,
 * uses } or null (createBattle player.power; Granny's lesson has none). In the main phase the owner
 * may use it for its energy (or hearts with the Blood price tweak). It is not a card play. After
 * use, cooldown = recharge + 1 and counts down by 1 at the start of each of the owner's turns; it is
 * ready at 0 (so at most once per turn, and ready on turn 1). Tweaks: powerMods(state, p) → { def,
 * cost, heartCost, recharge, deeper, broader }. powerStatus(state, p) → { id, name, text, cost,
 * heartCost, recharge, turnsLeft, ready, usable, why, note, target, tweaks } for the UI, or null.
 * Night Sight sets players[q].tax (the next n cards q plays cost 1 more) and players[p].sight (the
 * cids it added to p's knows, forgotten at p's next turn). The power object and the sight array are
 * replaced, never changed in place, so cloneState can share them.
 * Events: 'power-use' { player, id, target } and the power's own 'power' lines.
 */
(function (root) {
    'use strict';

    const Rift = root.Rift;
    const Battle = Rift.Battle || (Rift.Battle = {});

    const DEFAULTS = {
        hearts: 12, energyCap: 10, handLimit: 10, boardLimit: 7,
        deckSize: 20, minCreatures: 6, maxCreatures: 14,
        openHand: [2, 4], openAxioms: 1, spark: true,
        // Fate counts full ROUNDS (both players' turns), not single turns: see "Fate" below shiftFate.
        timeline: true, timeDraws: false, fateStart: 3, fateGap: 3, fateMax: 6,
        maxTurns: 60, first: 'random', shuffle: true, shuffleAxioms: true, mode: 'practice',
    };
    const RULE_DEFAULTS = {
        attackLimit: Infinity, attacksPerCreature: 1, costDelta: 0, growth: 1, drawCount: 1,
        playLimit: 2, handCap: null, bonus: null,
        heal: false, arrivalReady: false, ignoreGuard: false, mercy: false, abilityCostDelta: 0,
        abilitiesOff: false, reverseHearts: false, heroDamageCap: null, wheelReversed: false,
    };
    const PAD_SPECIES = ['astrophysicat', 'zuckerborg', 'siuuugull'];
    const KEYWORDS = ['guard', 'swift', 'shield'];

    const species = id => (Rift.data.creatures || {})[id];
    const abilityDefs = () => Battle.Abilities || {};
    const axiomDefs = () => Rift.data.axioms || {};
    const tacticDefs = () => Rift.data.tactics || {};
    const battleItem = id => ((Rift.data.items || {})[id] || {}).battle || null;
    const powerDefs = () => Rift.data.powers || {};
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
            board: P.board.slice(), armed: (P.armed || []).slice(), discard: P.discard.slice(), knows: P.knows.slice(),
        }));
        s.cards = cards;
        s.roundTurns = state.roundTurns.slice();
        s.pending = state.pending ? { ...state.pending } : null;
        s.reactions = (state.reactions || []).slice();
        s.completedPlays = (state.completedPlays || []).slice();
        s.attackIntent = state.attackIntent ? { ...state.attackIntent } : null;
        s.axioms = { ...state.axioms, active: { ...state.axioms.active }, deck: state.axioms.deck.slice(), discard: state.axioms.discard.slice() };
        s.fate = { ...state.fate };
        if (state.fate.queue) s.fate.queue = state.fate.queue.map(ev => ({ ...ev }));   // records change in place (#118)
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

    // rules() and activeAxioms() run thousands of times per AI decision, so each
    // `active` object remembers its result (re-checked against a snapshot, because
    // setAxiom and tests may change the object in place).
    const ruleMemo = new WeakMap();
    function memoFor(s) {
        const active = s.axioms.active;
        const m = ruleMemo.get(active);
        if (m) {
            let n = 0, same = true;
            for (const k in active) { n++; if (m.snap[k] !== active[k]) { same = false; break; } }
            if (same && n === m.n) return m;
        }
        const list = Object.freeze(Object.values(active).map(id => axiomDefs()[id]).filter(Boolean));
        const out = Object.assign({}, RULE_DEFAULTS);
        list.forEach(a => Object.assign(out, a.rules || {}));
        const memo = { snap: Object.assign({}, active), n: Object.keys(active).length, list, rules: Object.freeze(out) };
        ruleMemo.set(active, memo);
        return memo;
    }
    function activeAxioms(s) { return memoFor(s).list; }
    // Active rule cards that differ from the basics (a `basic` card only restates a default rule).
    function changedAxioms(s) { return activeAxioms(s).filter(a => !a.basic); }
    // False when playing this axiom card would change nothing: the same rule is already active,
    // or a "back to normal" card while its category is already normal.
    function axiomWouldChange(s, id) {
        const ax = axiomDefs()[id];
        if (!ax) return false;
        if (ax.clearRules) return changedAxioms(s).length > 0; // Granny's Spare Axiom: only while a rule is changed
        const current = s.axioms.active[ax.category];
        if (current === id) return false;
        if (ax.basic) return !!current && !(axiomDefs()[current] || {}).basic;
        return true;
    }
    function rules(s) { return memoFor(s).rules; }
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
    // Name for event (log) texts: when both boards hold a creature with this name, say whose it is
    // ("your Kim Kardashiant" / "Granny's Kim Kardashiant"). emit() capitalises the first letter.
    function logName(s, cid) {
        const name = cardName(s, cid);
        const c = s.cards[cid];
        if (!c || c.kind !== 'creature') return name;
        const p = c.controller;
        const same = other => other !== cid && cardName(s, other) === name;
        return s.players[1 - p].board.some(same) ? possessive(s, p) + ' ' + name : name;
    }
    function possessive(s, p) {
        const n = s.players[p].name;
        return n === 'You' ? 'your' : n + '\'s';
    }
    function playerName(s, p) { return s.players[p].name; }
    // "Anna plays" / "You play".
    function says(s, p, verb) {
        const name = s.players[p].name;
        if (name !== 'You') return name + ' ' + verb;
        const base = { has: 'have', goes: 'go', wins: 'win', takes: 'take', chooses: 'choose', plays: 'play',
            attacks: 'attack', loses: 'lose', ends: 'end', draws: 'draw', activates: 'activate', skips: 'skip', uses: 'use', schedules: 'schedule' }[verb] || verb;
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
        const kept = c.lostKeywords && c.lostKeywords.length ? out.filter(k => !c.lostKeywords.includes(k)) : out;
        return c.shieldUsed ? kept.filter(k => k !== 'shield') : kept;
    }
    const hasKeyword = (s, cid, k) => keywordsOf(s, cid).includes(k);

    // 'none' (nicknamed): no colour at all, so no spotlight (not even Memory's) and no wheel bonus.
    function colourOf(s, card) {
        return card.colourless || card.generic ? 'none' : (card.colour || 'memory');
    }
    function wheelBonus(s, card, foe) {
        const W = Rift.data.wheel;
        if (!W || !foe || foe.kind !== 'creature') return 0;
        const a = colourOf(s, card), b = colourOf(s, foe);
        if (!W.beats[a] || !W.beats[b] || a === b) return 0;
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
                if (def.aura) { const v = def.aura(s, src, c, H); if (v) parts.push({ source: 'aura', label: def.name, amount: v, from: cardName(s, other) }); }
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

    // What is changing a creature's numbers right now, for the card face and its Active effects
    // list: [{ stat: 'attack'|'health'|'cost', amount, label, until, from }]. until says how long:
    // 'turn' (this turn), 'play' (until it leaves play), 'ability' (its own ability), 'aura' (while
    // `from` is in play), 'rule' (while that rule is active), 'tax' (Night Sight). The colour wheel
    // depends on the target, so it is not here: see wheelEdges.
    function activeEffects(s, cid) {
        const c = s.cards[cid];
        if (!c || c.kind !== 'creature') return [];
        const out = [];
        attackParts(s, cid).parts.forEach(x => {
            if (x.source === 'base') return;
            const until = x.source === 'buff' ? null : x.source === 'axiom' ? 'rule' : x.source;
            if (until) out.push({ stat: 'attack', amount: x.amount, label: x.label, until, from: x.from || null });
        });
        c.buffs.forEach(b => {
            const until = b.temp ? 'turn' : 'play';
            if (b.attack) out.push({ stat: 'attack', amount: b.attack, label: b.label, until, from: null });
            if (b.health) out.push({ stat: 'health', amount: b.health, label: b.label, until, from: null });
        });
        if (s.players[c.controller].hand.includes(cid)) {
            const delta = rules(s).costDelta;
            const shown = Math.max(0, c.cost + delta) - c.cost;   // a cost never goes below 0
            if (shown) out.push({ stat: 'cost', amount: shown, label: (activeAxioms(s).find(ax => ax.rules && ax.rules.costDelta) || {}).name || 'Cost rule', until: 'rule', from: null });
            if (taxOn(s, cid)) out.push({ stat: 'cost', amount: 1, label: 'Night Sight', until: 'tax', from: null });
        }
        return out;
    }
    // The colour wheel from this creature's side: { strong: colours it gets +bonus against,
    // weak: colours that get +bonus against it, bonus }. Follows a reversed wheel.
    function wheelEdges(s, cid) {
        const W = Rift.data.wheel, c = s.cards[cid];
        const out = { strong: [], weak: [], bonus: W ? W.bonus : 0 };
        if (!W || !c || c.kind !== 'creature') return out;
        Object.keys(W.beats).forEach(b => {
            const foe = { kind: 'creature', colour: b };
            if (wheelBonus(s, c, foe)) out.strong.push(b);
            if (wheelBonus(s, foe, c)) out.weak.push(b);
        });
        return out;
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
            case 'enemy-creature-seen': list = theirs.slice(); break; // like enemy-creature, but Elusive does not hide from it
            case 'friendly-creature': list = mine.slice(); break;
            case 'friendly-other': list = mine.filter(cid => cid !== sourceCid); break;
            case 'any-creature': list = mine.concat(theirs); break;
            case 'enemy-any': list = theirs.concat([heroId(1 - p)]); break;
            case 'any': list = mine.concat(theirs, [heroId(p), heroId(1 - p)]); break;
            default: list = [];
        }
        return list.filter(t => {
            if (isHero(t)) return true;
            if (spec !== 'enemy-creature-seen' && s.cards[t].controller !== p && hasKeyword(s, t, 'elusive')) return false;
            return !filter || filter(s, t, H);
        });
    }

    // Night Sight's tax: a card in a taxed player's hand costs 1 more.
    function taxOn(s, cid) {
        const P = s.players[s.cards[cid].controller];
        return P.tax > 0 && P.hand.includes(cid) ? 1 : 0;
    }
    function playCost(s, cid) {
        const c = s.cards[cid];
        if (c.kind === 'tactic') return (tacticDefs()[c.tactic] || { cost: 0 }).cost + taxOn(s, cid);
        return Math.max(0, c.cost + rules(s).costDelta) + taxOn(s, cid);
    }
    // p: who plays it (default: the active player), for Night Sight's tax.
    function axiomCost(s, id, p) {
        const P = s.players[p == null ? s.active : p];
        return (axiomDefs()[id] || { cost: 2 }).cost + (P && P.tax > 0 ? 1 : 0);
    }

    // Paid abilities this creature has: [{ id, name, text, cost, target, filter, usable }].
    // usable: false when it would certainly do nothing now (legalActions leaves it out).
    function activations(s, cid) {
        const c = s.cards[cid];
        const out = [];
        eachAbility(s, c, (def, id) => {
            const A = def.activate;
            if (A) out.push({ id, name: def.name, text: def.text, cost: Math.max(0, A.cost + rules(s).abilityCostDelta), target: A.target || null, filter: A.filter || null,
                usable: !A.usable || !!A.usable(s, c, H) });
        });
        return out;
    }
    // Room in player p's hand for n more cards (after `leaving` cards have left it).
    function handRoom(s, p, n, leaving) {
        return handCount(s.players[p]) - (leaving || 0) + (n == null ? 1 : n) <= s.options.handLimit;
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
        return P.deck.concat(P.hand, P.board, P.armed || []).some(cid => s.cards[cid].kind === 'creature' || s.cards[cid].reservedCreature);
    }

    // Everything a card face needs.
    function describe(s, cid) {
        const c = s.cards[cid];
        if (c.kind === 'tactic') {
            const t = tacticDefs()[c.tactic] || {};
            return { cid, kind: 'tactic', id: c.tactic, name: t.name, cost: playCost(s, cid), text: t.text, short: t.short || null, flavour: t.flavour, target: t.target || null,
                // colourReady stays for older callers: always true since #112 (no creature in play is needed).
                colour: t.colour || null, rarity: t.rarity || null, art: t.art || null, colourReady: true };
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
            colour: colourOf(s, c), printedColour: c.colour, colourless: !!c.colourless, cost: playCost(s, cid), baseCost: c.cost,
            attack: attackOf(s, cid), baseAttack: c.attack, attackParts: attackParts(s, cid).parts,
            health: hp.current, maxHealth: hp.max, baseHealth: c.health, damaged: hp.damaged,
            keywords: keywordsOf(s, cid), lines, silenced: !!c.silenced, onBoard,
            sleeping: onBoard && isSleeping(s, cid), frozen: !!c.frozen, activated: !!c.activated, attacks: c.attacks,
            canAttack: canAttack(s, cid), hidden: onBoard && isHidden(s, cid),
            variant: c.variant, taught: c.taught, injured: c.injured.slice(), changes: (c.changes || []).slice(), loaner: c.loaner, trophyOf: c.trophyOf,
            prediction: c.prediction, metaverseUsed: c.metaverseUsed,
        };
    }

    function ruleSummary(s) {
        const r = rules(s);
        const combat = combatAxiom(s);
        const limit = r.attackLimit === Infinity ? '' : ' At most ' + r.attackLimit + ' attack' + (r.attackLimit === 1 ? '' : 's') + ' per player per turn.';
        return [
            ['Win', r.reverseHearts ? 'Reach zero of YOUR OWN hearts to win.' : 'Reduce the enemy hero to zero hearts.'],
            ['Turn', 'Choose one draw: your deck or the axiom deck. Energy grows by ' + r.growth + ' and refills (max ' + s.options.energyCap + '). Play up to ' + (r.playLimit === Infinity ? 'any number of' : r.playLimit) + ' cards.'
                + ' Used rule cards never come back. When your deck and the rule deck are both empty, each draw costs hearts: 1, then 2, then 3.'],
            ['Attacks', (r.attacksPerCreature > 1 ? 'Each ready creature may attack twice.' : 'Each ready creature may attack once.') + limit + ' New creatures wait a turn unless Swift' + (r.arrivalReady ? ' (now: all can act at once).' : '.')],
            ['Combat', (combat ? combat.text : 'Both creatures deal damage equal to their attack.') + ' Damage stays' + (r.heal ? ' until the controller\'s next turn (healing rule).' : '.')],
            ['Guard', r.ignoreGuard ? 'Guard is ignored right now.' : 'If the enemy has Guard creatures, attack one of them first.'],
            ['Hero hits', r.heroDamageCap != null ? 'Attacks on heroes remove only ' + r.heroDamageCap + ' heart.' : 'An attack on a hero removes hearts equal to its attack.'],
            ['Costs', 'Creatures ' + (r.costDelta ? (r.costDelta > 0 ? '+' : '') + r.costDelta + ' energy. ' : 'cost what they show. ') + 'Activating ' + (r.abilityCostDelta ? 'costs ' + r.abilityCostDelta + ' more. ' : 'uses the creature\'s attack. ') + (r.abilitiesOff ? 'Abilities are OFF.' : '')],
            ['Defeat', r.mercy ? 'Defeated creatures return to their owner\'s hand.' : 'Defeated creatures go to the discard pile.'],
        ];
    }

    // The next two Fate events, in full rounds (see "Fate" below shiftFate):
    //   rounds  round ends until it happens (1 = at the end of this round)
    //   turns   End turns until it happens (the same moment counted in turns)
    //   turn / round  the turn and round that start with it active
    //   after   the player whose End turn closes the round (the second player)
    //   held    the Anchor holds this round's end, so everything is one round later
    //   type    'flip' | 'reset';  id  the next flip's rule card (set aside, see fateNext) or null
    function timeline(s) {
        if (!s.options.timeline) return [];
        const hold = fateHeld(s) ? 1 : 0, half = s.roundTurns[1 - s.active] ? 1 : 0, after = roundCloser(s);
        return [0, 1].map(offset => {
            const rounds = s.fate.until + hold + offset * s.options.fateGap;
            const turns = 2 * rounds - half;
            const reset = (s.fate.events + offset) % 2 === 1;
            const id = reset || offset ? null : fateNext(s);
            const ax = id && axiomDefs()[id];
            return {
                rounds, turns, turn: s.turn + turns, round: s.round + rounds, after, held: !!hold, type: reset ? 'reset' : 'flip', id,
                text: reset ? 'Reset all rules to the basics' : offset ? 'Free flip from the shared deck'
                    : ax ? 'Free flip: ' + ax.name : 'No rule left to flip',
            };
        });
    }

    // Fate in full rounds. Ordinary movement happens once per round: the first player's turn, the
    // second player's turn, then exactly one advance (endTurn). s.fate.until counts the round ends
    // left before the next event; events alternate: a free flip (events even), then a reset (odd).
    // Every explicit time ability (Clockwork, Filter, Next Year, Nostalgia, Hold That Thought and the
    // optional time draws) moves the same unit: 1 space = 1 round. The Anchor item holds one round end
    // (s.fate.anchorRound). The next flip's rule card is set aside when that flip is announced
    // (s.fate.next): it leaves the shared deck, so no draw can take it, change it or draw it twice,
    // and it is in exactly one place until it turns over. null: no rule card was left then; Fate
    // tries again at each turn start (a public 'fate-next' event says so). An older state without
    // `next` turns over the deck's top card, as before.
    const fateHeld = s => s.fate.anchorRound != null && s.fate.anchorRound === s.round;
    // The player whose End turn closes the current round: the second player of the match.
    const roundCloser = s => (s.roundTurns[1 - s.active] ? s.active : 1 - s.active);
    function fateNext(s) {
        if (s.fate.next !== undefined) return s.fate.next;
        return s.axioms.deck[0] || null;
    }
    // Where the next event would be after shiftFate(spaces), without moving anything (for previews):
    // { rounds, turns, now } (now: it would happen at once).
    function fatePreview(s, spaces) {
        if (!s.options.timeline) return null;
        const until = Math.max(0, Math.min(s.options.fateMax, s.fate.until - (spaces || 0)));
        if (!until) return { rounds: 0, turns: 0, now: true };
        const rounds = until + (fateHeld(s) ? 1 : 0);
        return { rounds, turns: 2 * rounds - (s.roundTurns[1 - s.active] ? 1 : 0), now: false };
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
        if (room && s.axioms.deck.length) out.push('axiom');   // finite: the discard never refills it (#117)
        // Time draws (move Fate instead of drawing) are off by default: the teacher wants Fate to move
        // only forward, 1 space per turn, and be bent only by cards and abilities.
        if (s.options.timeline && s.options.timeDraws) out.push('forward', 'rewind');
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
        const canPlay = playsLeft(s, p) > 0;
        P.hand.forEach(cid => {
            if (!canPlay || playCost(s, cid) > P.energy) return;
            const c = s.cards[cid];
            const condition = conditionOf(s, cid);
            if (condition && !c.conditionSpent) {
                if ((P.armed || []).length >= 2 || (c.kind === 'creature' && boardOccupancy(s, p) >= s.options.boardLimit)) return;
                list.push({ type: 'play', player: p, cid });
                return;
            }
            if (condition && c.kind === 'tactic') return; // spent one-shots cannot be rearmed by bounce/recovery
            if (c.kind === 'creature') {
                if (boardOccupancy(s, p) >= s.options.boardLimit) return;
                const entry = entranceOf(s, c);
                const targets = entry && entry.target ? targetsFor(s, entry.target, p, entry.filter, cid) : [];
                if (targets.length) targets.forEach(target => list.push({ type: 'play', player: p, cid, target }));
                else list.push({ type: 'play', player: p, cid });
            } else {
                const def = tacticDefs()[c.tactic];
                if (!def) return;
                if (def.scheduled && !canSchedule(s, p)) return;
                if (def.usable && !def.usable(s, p, H)) return;
                if (def.target) targetsFor(s, def.target, p, def.filter, null).forEach(target => list.push({ type: 'play', player: p, cid, target }));
                else list.push({ type: 'play', player: p, cid });
            }
        });
        if (canPlay) Array.from(new Set(P.axHand)).forEach(id => { if (axiomCost(s, id, p) <= P.energy && axiomWouldChange(s, id)) list.push({ type: 'axiom', player: p, choice: id }); });
        P.board.forEach(cid => {
            if (canAttack(s, cid)) attackTargets(s, cid).forEach(target => list.push({ type: 'attack', player: p, cid, target }));
            if (canActivateNow(s, cid)) activations(s, cid).forEach(a => {
                if (a.cost > P.energy || !a.usable) return;
                if (a.target) targetsFor(s, a.target, p, a.filter, cid).forEach(target => list.push({ type: 'activate', player: p, cid, ability: a.id, target }));
                else list.push({ type: 'activate', player: p, cid, ability: a.id });
            });
        });
        if (P.bag && P.bag.length) itemActions(s, p).forEach(a => list.push(a));
        if (P.power) powerActions(s, p).forEach(a => list.push(a));
        return list;
    }

    // Card plays left this turn (creatures, tactics and rule cards each use one; attacks are free).
    function playLimit(s, p) { return rules(s).playLimit + (s.players[p].extraPlays || 0); }
    function playsLeft(s, p) { return Math.max(0, playLimit(s, p) - (s.players[p].playsThisTurn || 0)); }

    // The creature's (first) working Entrance, before it is played (abilities are checked as if on board).
    function entranceOf(s, card) {
        if (card.silenced || rules(s).abilitiesOff) return null;
        const ids = [card.ability].concat(card.gained).filter(Boolean);
        for (const id of ids) { const def = abilityDefs()[id]; if (def && def.entrance) return def.entrance; }
        return null;
    }

    function winner(s) { return s.winner == null ? null : s.winner; }

    // Collected creatures defeated in this battle (in a discard pile). Cards discarded only because
    // the hand was full (`burned`) never fought, so they do not count.
    function lostUids(s, p) {
        const out = [];
        s.players.forEach(P => P.discard.forEach(cid => {
            const c = s.cards[cid];
            if (c.kind === 'creature' && c.owner === p && !c.loaner && !c.burned && !out.includes(c.uid)) out.push(c.uid);
        }));
        return out;
    }

    // { uid: most excess damage at any of its defeats } for the creatures lostUids reports.
    function overkillOf(s, p) {
        const out = {};
        lostUids(s, p).forEach(uid => {
            Object.values(s.cards).forEach(c => { if (c.uid === uid && c.kind === 'creature') out[uid] = Math.max(out[uid] || 0, c.overkill || 0); });
        });
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
        const ch = Rift.changeEffect(inst);
        return {
            cid, kind: 'creature', uid: inst.uid || cid, species: inst.species, owner, controller: owner,
            colour: sp.colour, generic: !!sp.generic, cost: Math.max(1, sp.cost + ch.cost),
            attack: Math.max(0, sp.attack + (v.attack || 0) + (taught === 'attack' ? 1 : 0) + (inst.powerDelta || 0) + ch.attack),
            health: Math.max(1, sp.health + (v.health || 0) + (taught === 'health' ? 1 : 0) + (v.trait === 'sturdy' ? 1 : 0) + ch.health),
            baseKeywords: kws,
            ability: injuries.includes('no-ability') ? null : (ch.ability || (inst.warped && inst.warped.ability) || sp.ability || null),
            gained: [], buffs: [], extraKeywords: [],
            damage: 0, enteredTurn: null, attacks: 0, activated: false, frozen: false, silenced: false, shieldUsed: false,
            nickname: null, colourless: false, prediction: null, metaverseUsed: false, siuuu: 0, burned: false,
            legendary: sp.rarity === 'legendary', loaner: !!inst.loaner, trophyOf: inst.trophyOf || null,
            injured: injuries.slice(), warped: !!(ch.ability || (inst.warped && inst.warped.ability)),
            changes: (inst.changes || []).map(c => c.id), overkill: 0,
            variant: inst.variant || null, taught, defeats: 0,
        };
    }

    // A side's ten rule cards: known ids from the pool, at most two copies each (#112), topped up with
    // the default ten. Own cards (Granny's Spare Axiom) never go in.
    function axiomSelection(pool) {
        const out = [], counts = {};
        (pool || []).forEach(id => {
            if (out.length < 10 && axiomDefs()[id] && !axiomDefs()[id].own && (counts[id] || 0) < 2) { counts[id] = (counts[id] || 0) + 1; out.push(id); }
        });
        ((Rift.data.axiomDecks || {}).default || []).forEach(id => {
            if (out.length < 10 && axiomDefs()[id] && !axiomDefs()[id].own && !out.includes(id)) out.push(id);
        });
        return out;
    }
    // Ten cards from each side. Copies between sides remain in the shared deck (up to four of a rule).
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
        opts.fateMax = Math.max(opts.fateMax, opts.fateStart, opts.fateGap);   // a scheduled event always fits the track
        const seed = String(cfg.seed == null ? 'battle' : cfg.seed);
        const rng = Rift.makeRng('battle:' + seed + ':0');
        const players = cfg.players || [];
        if (players.length !== 2) throw new Error('A battle needs exactly two players.');

        const s = {
            v: 4, seed, step: 0, turn: 1, round: 0, roundTurns: [false, false],   // v4: Fate counts rounds
            active: 0, phase: 'setup', pending: null,
            players: [], cards: {}, reactions: [], completedPlays: [], factSequence: 0, armSequence: 0, reactionCount: 0, attackIntent: null,
            axioms: { deck: [], discard: [], active: {}, flips: 0 },
            // until counts ROUNDS; next: the flip's set-aside rule card (filled by the first startTurn).
            // pos / seq / queue: the cursor's space, the last scheduled-event number, the scheduled events (#118).
            fate: { until: Math.max(1, opts.fateStart), events: 0, next: null, pos: 0, seq: 0, queue: [] },
            winner: null, endReason: null, options: opts,
            log: null, lastEvents: [],
        };

        players.forEach((pl, i) => {
            // Built as given: deck construction (Rift.State.validateDeck) is checked before a battle starts.
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
                deck: opts.shuffle ? rng.shuffle(ids) : ids, hand: [], axHand: [], board: [], armed: [], discard: [],
                playedCount: 0, turnsTaken: 0, attacksThisTurn: 0, knows: [], exhaustion: 0,
                consumables: Object.assign({}, cons),
                bag: bagSelection(pl.bag), itemsUsed: [], itemTurn: 0,
                power: powerSetup(pl.power), tax: 0, sight: [],
            });
        });

        const known = axiomDefs();
        const axIds = (cfg.axiomDeck || buildAxiomDeck(players[0].axioms, players[1].axioms)).filter(id => known[id] && !known[id].own);
        s.axioms.deck = opts.shuffleAxioms ? rng.shuffle(axIds) : axIds.slice();
        s.active = opts.first === 'random' ? rng.int(0, 1) : (opts.first ? 1 : 0);

        const G = { s, rng, events: [] };
        [s.active, 1 - s.active].forEach((p, order) => {
            for (let i = 0; i < opts.openHand[order]; i++) draw(G, p, true);
            for (let i = 0; i < opts.openAxioms; i++) drawAxiom(G, p, true);
        });
        // Own rule cards (Granny's Spare Axiom) start in their player's hand, one of each.
        players.forEach((pl, p) => Array.from(new Set(pl.ownAxioms || [])).forEach(id => {
            if (known[id] && known[id].own && handCount(s.players[p]) < opts.handLimit) s.players[p].axHand.push(id);
        }));
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
        return [a.type, a.cid || '', a.target || '', a.choice == null ? '' : a.choice, a.ability || ''].join('|') + (a.type === 'item' ? '|' + a.id : '');
    }

    function applyAction(state, action) {
        if (!action) throw new Error('No action given.');
        if (action.player != null && action.player !== decider(state)) throw new Error('Wrong player.');
        const key = actionKey(action);
        const match = legalActions(state).find(a => actionKey(a) === key);
        if (!match) throw new Error('Illegal action ' + JSON.stringify(action) + ' in phase ' + state.phase);
        return applyLegal(state, match);
    }

    function applyLegal(state, match) {
        const s = cloneState(state);
        s.step += 1;
        if (match.type !== 'choose') { s.reactionCount = 0; s.resolutionRoot = s.step; }
        const G = { s, rng: Rift.makeRng('battle:' + s.seed + ':' + s.step), events: [] };
        switch (match.type) {
            case 'draw': doDraw(G, match.choice); break;
            case 'play': countPlay(G); doPlay(G, match.cid, match.target || null); break;
            case 'axiom': countPlay(G); doAxiom(G, match.choice); break;
            case 'attack': doAttack(G, match.cid, match.target); break;
            case 'activate': doActivate(G, match.cid, match.ability, match.target || null); break;
            case 'spark': doSpark(G); break;
            case 'item': doItem(G, match.id, match.target || null); break;
            case 'power': doPower(G, match.target || null); break;
            case 'end': endTurn(G); break;
            case 'choose': resolveChoice(G, match.choice); break;
            default: throw new Error('Unknown action ' + match.type);
        }
        resolveReactions(G);
        s.lastEvents = G.events;
        s.log = { prev: state.log, events: G.events };
        return s;
    }

    function countPlay(G) { const P = G.s.players[G.s.active]; P.playsThisTurn = (P.playsThisTurn || 0) + 1; }

    const capFirst = x => (typeof x === 'string' && x ? x[0].toUpperCase() + x.slice(1) : x);
    function emit(G, ev) {
        // Texts may start with a log name such as "your Kim Kardashiant".
        ev.text = capFirst(ev.text);
        if (ev.publicText) ev.publicText = capFirst(ev.publicText);
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
            name: cid => logName(s, cid),           // for event texts
            cardName: cid => cardName(s, cid),      // plain name (e.g. to build a nickname)
            draw: p => draw(G, p),
            drawAxiom: p => drawAxiom(G, p),
            damage: (target, amount, source) => (isHero(target) ? damageHero(G, +target[1], amount) : dealDamage(G, target, amount, source)),
            checkHearts: () => checkHearts(G),
            heal(cid, n) { const c = s.cards[cid]; c.damage = Math.max(0, c.damage - n); },
            healHero(p, n) { const P = s.players[p]; P.hearts = Math.min(P.maxHearts, P.hearts + n); },
            defeat: (cid, why, name) => defeat(G, cid, why, name),
            silence: cid => silence(G, cid),
            freeze(cid) { s.cards[cid].frozen = true; },
            bounce: cid => bounce(G, cid),
            fromDiscard(cid) { const P = s.players[s.cards[cid].owner]; if (removeFrom(P.discard, cid)) toHand(G, P === s.players[0] ? 0 : 1, cid); },
            toHand: (p, cid, quiet) => toHand(G, p, cid, quiet),
            handRoom: (p, n) => handRoom(s, p, n),
            buff(cid, attack, health, label, temp) { s.cards[cid].buffs.push({ label, attack: attack || 0, health: health || 0, temp: !!temp }); },
            addKeyword(cid, k) { const c = s.cards[cid]; if (!c.extraKeywords.includes(k)) c.extraKeywords.push(k); if (k === 'shield') c.shieldUsed = false; if (c.lostKeywords) c.lostKeywords = c.lostKeywords.filter(x => x !== k); },
            shiftFate: n => shiftFate(G, n),
            setAxiom: (id, by) => setAxiom(G, id, by),
            takeAxiom(id) { removeFrom(s.axioms.deck, id); },
            ask: req => ask(G, req),
            attack: cid => attackOf(s, cid),
            // Colour tactics (below).
            colourInPlay: (p, colour) => colourInPlay(s, p, colour),
            stripKeywords: (cid, list) => stripKeywords(s, cid, list),
            fullHeal(cid) { s.cards[cid].damage = 0; },
            setAttack: (cid, n, label) => setAttack(s, cid, n, label),
            swapStats: cid => swapStats(s, cid),
            takeControl: (cid, p) => takeControl(G, cid, p),
        };
    }

    // Authored conditions use semantic facts, never translated log messages or animation callbacks.
    // Only released definitions should be installed in production data. The developer set is separate.
    function conditionOf(s, cid) {
        const c = s.cards[cid];
        const def = c && (c.kind === 'tactic' ? tacticDefs()[c.tactic] : species(c.species));
        return def && def.conditional;
    }
    function boardOccupancy(s, p) {
        return s.players[p].board.length + (s.players[p].armed || []).filter(cid => s.cards[cid].kind === 'creature' || s.cards[cid].reservedCreature).length;
    }
    function armedView(s, p, viewer) {
        return (s.players[p].armed || []).map(cid => {
            const c = s.cards[cid], def = conditionOf(s, cid);
            if (p !== viewer && (!def || def.visibility === 'face-down')) return { concealed: true };
            const option = def.options.find(o => o.key === c.conditionKey);
            return { cid, concealed: false, name: cardName(s, cid), condition: option ? option.label : 'Choosing a condition', kind: c.kind };
        });
    }
    // AI lookahead must not resolve unseen opponent conditions from the engine's private records.
    function informationState(state, viewer) {
        const hidden = (state.players[1 - viewer].armed || []).filter(cid => {
            const def = conditionOf(state, cid);
            return !def || def.visibility === 'face-down';
        });
        if (!hidden.length) return state;
        const s = cloneState(state);
        hidden.forEach(cid => {
            const c = state.cards[cid];
            s.cards[cid] = { cid, kind: 'concealed', owner: c.owner, controller: c.controller, reservedCreature: c.kind === 'creature' || !!c.reservedCreature };
        });
        s.reactions = s.reactions.filter(r => !hidden.includes(r.cid));
        return s;
    }
    function arm(G, cid) {
        const s = G.s, c = s.cards[cid], p = c.controller, def = conditionOf(s, cid);
        if (!def.options || def.options.length < 1 || def.options.length > 3) throw new Error('A conditional card needs one to three authored options.');
        const events = ['creature-played', 'spell-played', 'axiom-replaced', 'creature-defeated', 'attack-declared'];
        if (new Set(def.options.map(o => o.key)).size !== def.options.length || def.options.some(o => !o.key || !events.includes(o.event) || !['self', 'opponent', 'either'].includes(o.actor))) {
            throw new Error('Invalid authored conditional option. Fate entry is not implemented in this release.');
        }
        s.players[p].armed.push(cid);
        c.armSequence = ++s.armSequence;
        const visible = def.visibility !== 'face-down';
        emit(G, { t: 'armed', player: p, privateTo: p, cid: visible ? cid : undefined,
            text: says(s, p, 'plays') + ' ' + cardName(s, cid) + ' as a condition.',
            publicText: visible ? says(s, p, 'plays') + ' ' + cardName(s, cid) + ' as a condition.' : playerName(s, p) + ' arms a concealed condition.' });
        ask(G, { player: p, kind: 'option', options: def.options.map(o => o.key), labels: Object.fromEntries(def.options.map(o => [o.key, o.label])),
            prompt: 'Choose when ' + cardName(s, cid) + ' will reveal.', source: { type: 'conditional-arm', cid } });
    }
    function conditionalFact(G, event, actor, data) {
        const s = G.s;
        const fact = { ...data, event, actor, id: ++s.factSequence, root: s.resolutionRoot || s.step };
        const sources = s.players.flatMap(P => P.armed || []).filter(cid => {
            const c = s.cards[cid], def = conditionOf(s, cid);
            const option = def && def.options.find(o => o.key === c.conditionKey);
            return option && !c.conditionSpent && option.event === event
                && (option.actor === 'either' || (actor != null && (option.actor === 'self' ? actor === c.controller : actor !== c.controller)))
                && (!def.matches || def.matches(s, c, fact, H));
        }).sort((a, b) => s.cards[a].armSequence - s.cards[b].armSequence || a.localeCompare(b));
        sources.forEach(cid => s.reactions.push({ cid, fact }));
    }
    function resolveReactions(G) {
        const s = G.s;
        while (s.winner == null && s.phase !== 'choose') {
            const completed = s.completedPlays;
            s.completedPlays = [];
            completed.forEach(f => conditionalFact(G, f.event, f.actor, f));
            if (!s.reactions.length) break;
            const { cid, fact } = s.reactions.shift(), c = s.cards[cid];
            if (!c || c.conditionSpent || !s.players[c.controller].armed.includes(cid)) continue;
            if (++s.reactionCount > 128) throw new Error('Conditional resolution exceeded 128 reveals; the action was not committed.');
            const def = conditionOf(s, cid), p = c.controller;
            // Claim before effects. Recovery retains this marker; no free recursive rearming.
            c.conditionSpent = true;
            removeFrom(s.players[p].armed, cid);
            emit(G, { t: 'conditional-reveal', player: p, cid, fact: fact.id, text: cardName(s, cid) + ' reveals: ' + def.options.find(o => o.key === c.conditionKey).label + '.' });
            if (c.kind === 'creature') {
                c.revealFact = fact;
                if (s.players[p].board.length >= s.options.boardLimit) {
                    c.burned = true; // failed entry is a discard, not a combat defeat/Fate casualty
                    s.players[c.owner].discard.push(cid);
                    emit(G, { t: 'fizzle', cid, text: cardName(s, cid) + ' cannot enter: the reserved space was filled.' });
                } else enterCreature(G, cid, null, true);
            } else {
                s.players[c.owner].discard.push(cid);
                def.run(api(G), p, fact, cid);
            }
            cleanup(G);
        }
        if (s.winner != null) { s.reactions = []; s.completedPlays = []; s.attackIntent = null; return; }
        if (s.phase !== 'choose' && !s.reactions.length && s.attackIntent) {
            finishDeclaredAttack(G);
            if (s.reactions.length) resolveReactions(G);
        }
    }
    function enterCreature(G, cid, target, revealed) {
        const s = G.s, c = s.cards[cid], p = c.controller, P = s.players[p];
        P.board.push(cid);
        c.enteredTurn = s.turn;
        P.playedCount += 1;
        emit(G, { t: 'play', player: p, cid, target, revealed: !!revealed, text: says(s, p, 'plays') + ' ' + cardName(s, cid) + '.' });
        s.players[1 - p].board.slice().forEach(other => {
            const o = s.cards[other];
            eachAbility(s, o, def => { if (def.onEnemyPlay) def.onEnemyPlay(api(G), o, cid); });
        });
        const entry = entranceOf(s, c);
        const targets = entry && entry.target ? targetsFor(s, entry.target, p, entry.filter, cid) : [];
        if (revealed && entry && entry.target && targets.length) {
            ask(G, { player: p, kind: 'card', options: targets, prompt: 'Choose the Entrance target for ' + cardName(s, cid) + '.', source: { type: 'conditional-entry', cid } });
        } else if (entry && (!entry.target || target)) entry.run(api(G), c, target);
        else if (entry) emit(G, { t: 'fizzle', cid, text: logName(s, cid) + ' finds no target for its Entrance.' });
        // Reveals are entries for existing auras, but not a second creature-played conditional fact.
    }

    // ---- colour tactics (design/card-arena-expansion-2026-10-07.md, section 2) ------------------

    // Player p controls a creature of this colour (a nicknamed creature has none). Since #112 this is
    // no casting condition: a colour tactic in a legal deck can be played without such a creature.
    function colourInPlay(s, p, colour) {
        return s.players[p].board.some(cid => colourOf(s, s.cards[cid]) === colour);
    }
    // Persuasion: player p takes control of an enemy creature. It arrives asleep on p's side; its owner
    // stays the same, so a defeat (or Rethink) sends it back to the owner's discard (or hand) and the
    // after-battle Fate roll stays with the real owner.
    function takeControl(G, cid, p) {
        const s = G.s, c = s.cards[cid];
        if (c.controller === p || s.players[p].board.length >= s.options.boardLimit) return false;
        if (!removeFrom(s.players[c.controller].board, cid)) return false;
        s.players[p].board.push(cid);
        c.controller = p;
        c.enteredTurn = s.turn;
        c.attacks = 0; c.activated = false; c.frozen = false;
        return true;
    }
    // The creature loses these keywords (printed, natural, taught, gained or from an ability) while it
    // stays on the board; a later tactic or ability may give one back. A lost Shield counts as used up.
    // Returns the listed keywords it really had.
    function stripKeywords(s, cid, list) {
        const c = s.cards[cid];
        const had = keywordsOf(s, cid).filter(k => list.includes(k));
        c.extraKeywords = c.extraKeywords.filter(k => !list.includes(k));
        if (list.includes('shield')) c.shieldUsed = true;
        const lost = (c.lostKeywords || []).slice(); // a new array: cloneState copies cards shallowly
        list.forEach(k => { if (k !== 'shield' && !lost.includes(k)) lost.push(k); });
        c.lostKeywords = lost;
        return had;
    }
    // Its attack becomes n now (a lasting change, kept as a buff so the card shows why).
    function setAttack(s, cid, n, label) {
        const delta = n - attackOf(s, cid);
        if (delta) s.cards[cid].buffs.push({ label, attack: delta, health: 0, temp: false });
    }
    // Swap its current attack and current health. Lasting buffs are folded into the new printed
    // numbers; this-turn boosts, auras and rules keep working on top. 0 attack gives 0 health: defeated.
    function swapStats(s, cid) {
        const c = s.cards[cid];
        const atk = attackOf(s, cid), hp = healthOf(s, cid).current;
        const lasting = c.buffs.reduce((sum, b) => sum + (b.temp ? 0 : (b.attack || 0)), 0);
        const extra = attackParts(s, cid).parts.reduce((sum, x) => sum + (x.source === 'base' ? 0 : x.amount), 0) - lasting;
        c.buffs = c.buffs.filter(b => b.temp).map(b => Object.assign({}, b, { health: 0 }));
        c.attack = Math.max(0, hp - extra);
        c.health = Math.max(1, atk);
        c.damage = atk > 0 ? 0 : 1;
    }

    // Returns false when the hand is full: the card goes to the discard pile, tagged `burned` so it
    // does not count as defeated for the after-battle Fate roll. quiet: the caller reports it.
    function toHand(G, p, cid, quiet) {
        const P = G.s.players[p], c = G.s.cards[cid];
        if (handCount(P) >= G.s.options.handLimit) {
            P.discard.push(cid);
            c.burned = true;
            if (!quiet) emit(G, { t: 'burn', player: p, cid, text: says(G.s, p, 'has') + ' a full hand: ' + cardName(G.s, cid) + ' is discarded.' });
            return false;
        }
        c.burned = false;
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
        if (!s.axioms.deck.length || handCount(P) >= s.options.handLimit) return null;
        const id = s.axioms.deck.shift();
        P.axHand.push(id);
        if (!quiet) emit(G, { t: 'draw-axiom', player: p, id, privateTo: p, text: 'You take the rule card ' + axiomDefs()[id].name + '.', publicText: playerName(s, p) + ' takes a rule card.' });
        return id;
    }

    function resetCard(c) {
        c.damage = 0; c.buffs = []; c.gained = []; c.extraKeywords = [];
        c.enteredTurn = null; c.attacks = 0; c.activated = false; c.frozen = false; c.silenced = false; c.shieldUsed = false;
        c.nickname = null; c.colourless = false; c.prediction = null; c.siuuu = 0; c.burned = false;
        if (c.lostKeywords) c.lostKeywords = null;
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
        announceFlip(G);   // the first turn, or a flip still waiting for a rule card
        P.capacity = Math.max(1, Math.min(s.options.energyCap, P.capacity + r.growth));   // growth may be 0 or −1
        P.energy = P.capacity + (P.consumables['extra-energy'] || 0);
        P.attacksThisTurn = 0;
        P.playsThisTurn = 0;
        P.extraPlays = 0;
        if (P.power && P.power.cooldown > 0) P.power = Object.assign({}, P.power, { cooldown: P.power.cooldown - 1 });
        if (P.sight && P.sight.length) { const gone = P.sight; P.knows = P.knows.filter(k => !gone.includes(k)); P.sight = []; }
        P.board.forEach(cid => {
            const c = s.cards[cid];
            c.attacks = 0; c.activated = false;
            if (r.heal) c.damage = 0;
        });
        s.phase = 'draw';
        s.pending = null;
        emit(G, { t: 'turn', player: p, text: playerName(s, p) + ': ' + P.energy + ' energy. Choose a draw.' });
        startBonus(G, p, r);
    }

    // Bonus rules (one at a time), checked when a turn starts:
    //   fresh-start  an empty hand draws 2 cards
    //   fair-share   fewer creatures in play than the opponent: draw 1 card
    //   momentum     more creatures in play than the opponent: +1 card play this turn
    function startBonus(G, p, r) {
        const s = G.s, P = s.players[p], Q = s.players[1 - p];
        if (r.bonus === 'fresh-start' && !handCount(P)) {
            emit(G, { t: 'bonus', player: p, text: 'Fresh Start: ' + says(s, p, 'draws') + ' 2 cards (empty hand).' });
            draw(G, p); draw(G, p);
        } else if (r.bonus === 'fair-share' && P.board.length < Q.board.length) {
            emit(G, { t: 'bonus', player: p, text: 'Fair Share: fewer creatures in play, so ' + says(s, p, 'draws').replace(/^You/, 'you') + ' 1 card.' });
            draw(G, p);
        } else if (r.bonus === 'momentum' && P.board.length > Q.board.length) {
            P.extraPlays = 1;
            emit(G, { t: 'bonus', player: p, text: 'Momentum: more creatures in play, so +1 card play this turn.' });
        }
    }

    // Exhaustion (#117): the normal draw step of a player whose own deck AND the shared axiom deck are
    // both empty costs hearts: 1, then 2, then 3… (players[p].exhaustion = steps so far, part of the
    // plain battle state). The opponent's deck does not matter; a full hand alone is not exhaustion.
    // Checked once per draw step before the choice, so a time draw neither dodges nor repeats it,
    // and extra draws (Second Opinion, Fresh Start, Think It Over, tactics) never cause it. The hearts
    // go through damageHero and checkHearts: the current Win rule decides, so under reversed hearts
    // it can win the game, and both heroes at zero is the usual draw. It is not an attack, so the
    // Hero-hits cap (heroDamageCap) does not shrink it.
    const isExhausted = (s, p) => !s.players[p].deck.length && !s.axioms.deck.length;
    // For the draw controls and the hero rows: what the next draw step of p would cost.
    function exhaustion(s, p) {
        const P = s.players[p], count = P.exhaustion || 0, damage = count + 1, reversed = !!rules(s).reverseHearts;
        const lethal = P.hearts - damage <= 0;
        return { due: isExhausted(s, p), damage, count, reversed, lethal, wins: lethal && reversed };
    }
    function exhaust(G, p) {
        const s = G.s, P = s.players[p];
        P.exhaustion = (P.exhaustion || 0) + 1;
        const amount = P.exhaustion;
        emit(G, { t: 'exhaustion', player: p, amount, text: 'Exhaustion: ' + possessive(s, p) + ' deck and the rule deck are empty.' });
        damageHero(G, p, amount, null);
        checkHearts(G);
    }

    function doDraw(G, choice) {
        const s = G.s, p = s.active, n = rules(s).drawCount;
        if (isExhausted(s, p)) { exhaust(G, p); if (s.winner != null) return; }
        if (choice === 'deck') { for (let i = 0; i < n; i++) draw(G, p); }
        else if (choice === 'axiom') { for (let i = 0; i < n; i++) drawAxiom(G, p); }
        else if (choice === 'forward' || choice === 'rewind') {
            emit(G, { t: 'time', player: p, text: says(s, p, 'skips') + ' the draw. Fate moves 1 round ' + (choice === 'forward' ? 'closer.' : 'away.') });
            shiftFate(G, choice === 'forward' ? 1 : -1);
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
        endRules(G, p);
        cleanup(G);
        emit(G, { t: 'turn-end', player: p, text: says(s, p, 'ends') + ' the turn.' });
        P.turnsTaken += 1;
        s.roundTurns[p] = true;
        if (s.winner != null) return;
        s.turn += 1;
        s.active = 1 - p;
        if (s.roundTurns[0] && s.roundTurns[1]) endRound(G, p);   // the second player's End turn
        if (s.winner == null) startTurn(G);
    }

    // Both players have had their turn: exactly one ordinary Fate advance (none while the Anchor holds).
    // Lifetimes (#118) count real round ends, so they run on while the Anchor holds the track.
    function endRound(G, p) {
        const s = G.s;
        if (!s.options.timeline) return;
        if (fateHeld(s)) emit(G, { t: 'anchor', player: p, text: 'The Anchor holds: the Fate track does not move this round.' });
        else {
            emit(G, { t: 'fate-move', text: 'Round ' + s.round + ' ends: Fate moves 1 space.' });
            shiftFate(G, 1);
        }
        if (s.winner == null) expireScheduled(G);
    }

    function endRules(G, p) {
        const s = G.s, P = s.players[p], r = rules(s);
        if (r.bonus === 'think') {
            const n = Math.min(2, playsLeft(s, p));
            if (n > 0) {
                emit(G, { t: 'bonus', player: p, text: 'Think It Over: ' + n + ' unused play' + (n === 1 ? '' : 's') + ', so ' + says(s, p, 'draws').replace(/^You/, 'you') + ' ' + n + ' card' + (n === 1 ? '' : 's') + '.' });
                for (let i = 0; i < n; i++) draw(G, p);
            }
        }
        if (r.handCap != null && handCount(P) > r.handCap) {
            let extra = handCount(P) - r.handCap;
            const gone = [];
            while (extra > 0 && P.hand.length) { const cid = P.hand.shift(); s.cards[cid].burned = true; P.discard.push(cid); gone.push(cardName(s, cid)); extra--; }
            while (extra > 0 && P.axHand.length) {
                const id = P.axHand.shift();
                if (!(axiomDefs()[id] || {}).own) s.axioms.discard.push(id); // an own card leaves the game
                gone.push('a rule card'); extra--;
            }
            emit(G, { t: 'hand-limit', player: p, privateTo: p, text: 'Hand limit ' + r.handCap + ': you discard ' + gone.join(', ') + '.',
                publicText: 'Hand limit ' + r.handCap + ': ' + playerName(s, p) + ' discards ' + gone.length + ' card' + (gone.length === 1 ? '' : 's') + '.' });
        }
    }

    // Positive shifts move the next event closer; negative shifts delay it. One space = one round.
    // The cursor (s.fate.pos) moves with them (#118). A forward shift WALKS: it enters each space in turn
    // (scheduled events there fire) and stops on the rule event when it reaches it (the rest is absorbed,
    // as before). A rewind enters only the space it lands on and goes back only as far as keeps the rule
    // event within fateMax; scheduled events move relative to NOW by the same amount.
    function shiftFate(G, spaces) {
        const s = G.s;
        if (!s.options.timeline || !spaces) return;
        if (spaces < 0) {
            const before = s.fate.until;
            s.fate.until = Math.max(0, Math.min(s.options.fateMax, s.fate.until - spaces));
            const back = s.fate.until - before;
            if (back > 0) { s.fate.pos = cursorOf(s) - back; enterSpace(G, s.fate.pos, 'rewind'); }
            return;
        }
        for (let i = 0; i < spaces; i++) {
            s.fate.pos = cursorOf(s) + 1;
            s.fate.until = Math.max(0, s.fate.until - 1);
            enterSpace(G, s.fate.pos, 'walk');
            if (s.winner != null) return;
            if (!s.fate.until) { ruleEvent(G); return; }
        }
    }

    // Fate's own event (a free flip or a reset) on the space the cursor has just entered. It resolves
    // after the scheduled events on that space (#118), so they resolve under the rules they were forecast with.
    function ruleEvent(G) {
        const s = G.s;
        if (s.fate.events % 2 === 1) {
            s.axioms.discard.push(...Object.values(s.axioms.active));
            s.axioms.active = {};
            emit(G, { t: 'reset', text: 'Fate reset: all rules return to the basics.' });
        } else {
            // An older state never set a card aside: it turns over the deck's top card, as before.
            if (s.fate.next === undefined) s.fate.next = s.axioms.deck.length ? s.axioms.deck.shift() : null;
            const id = s.fate.next;
            s.fate.next = null;
            if (id) { emit(G, { t: 'flip', id, text: 'Fate flips a free rule.' }); setAxiom(G, id, null); }
            else emit(G, { t: 'fate-empty', text: 'Fate has no rule card to turn over. The rules stay as they are.' });
        }
        s.fate.events += 1;
        s.fate.until = s.options.fateGap;
        announceFlip(G);
        cleanup(G);
    }

    // When the next event is a flip, set its rule card aside now, publicly. The shared deck is finite
    // (#117: used rule cards never come back), so a flip announced with no rule card left stays empty:
    // when it is due, Fate reports 'fate-empty' and the rules stay as they are. It still looks at each
    // turn start, in case a card is put back on the deck.
    function announceFlip(G) {
        const s = G.s, A = s.axioms;
        if (!s.options.timeline || s.fate.events % 2 === 1 || s.fate.next) return;
        s.fate.next = A.deck.length ? A.deck.shift() : null;
        if (s.fate.next) emit(G, { t: 'fate-next', id: s.fate.next, text: 'Fate sets aside the next free rule: ' + axiomDefs()[s.fate.next].name + '.' });
    }

    // by: the player who played the card, or null for a Fate flip.
    // A clearRules card (Granny's Spare Axiom) sends every active rule to the discard pile, as a Fate
    // reset does (Fate does not move), and never becomes an active rule itself.
    function setAxiom(G, id, by) {
        const s = G.s, A = s.axioms, ax = axiomDefs()[id];
        const changed = axiomWouldChange(s, id);
        if (ax.clearRules) {
            A.discard.push(...Object.values(A.active));
            A.active = {};
        } else {
            const old = A.active[ax.category];
            if (old) A.discard.push(old);
            A.active[ax.category] = id;
        }
        A.flips += 1;
        emit(G, ax.clearRules
            ? { t: 'axiom', id, player: by, clear: true, text: 'Rule change — ' + ax.name + ': every rule goes back to the basics.' }
            : { t: 'axiom', id, player: by, basic: !!ax.basic, text: 'Rule change — ' + ax.category + ': ' + ax.name + '. ' + ax.text });
        if (by != null) {
            [0, 1].forEach(p => s.players[p].board.slice().forEach(cid => {
                const c = s.cards[cid];
                eachAbility(s, c, def => { if (def.onAxiomPlayed) def.onAxiomPlayed(api(G), c, id, by); });
            }));
        }
        if (changed) s.completedPlays.push({ event: 'axiom-replaced', actor: by == null ? null : by, axiom: id });
    }

    // ---- scheduled Fate events (#118; design/drafts/card-arena-2026-10-12/FATE-SCHEDULE-MODEL.md) ----
    // A tactic with a `scheduled` block (data/tactics.js) puts a public event on the Fate track, `delay`
    // spaces ahead of the cursor. s.fate.queue holds plain records (never functions):
    //   { id: 'f<seq>', seq, def, source: { type: 'tactic', cid, card }, controller, space, createdRound,
    //     createdTurn, repeat, lifetime, expiresRound, state, fires, firedRound, reason, target }
    // state: 'pending' → 'fired' when the cursor enters its space (claimed before its effect runs, so it
    // can never fire twice); one-shot records stay fired for good, whichever way the cursor comes back.
    // A marked repeatable record (repeat) stays live after firing and fires on every later entry until
    // it expires: lifetime counts real round ends (expiresRound), never spaces. 'skipped' (#120 leaps) and
    // 'cancelled' are reserved for later cards. Events on one space resolve in seq order, then Fate's own
    // rule event. A battle that is over freezes the schedule.
    const SCHEDULE_LIMIT = 2;   // live scheduled events per player (like the two conditional slots)
    const cursorOf = s => s.fate.pos || 0;          // an older state has no cursor: space 0
    const queueOf = s => s.fate.queue || [];
    const isLive = ev => ev.state === 'pending' || (ev.state === 'fired' && !!ev.repeat);
    function scheduledDef(ev) {
        if (!ev || !ev.source || ev.source.type !== 'tactic') return null;
        return (tacticDefs()[ev.def] || {}).scheduled || null;
    }
    function liveScheduled(s, p) { return queueOf(s).filter(ev => ev.controller === p && isLive(ev)).length; }
    function canSchedule(s, p) { return !!s.options.timeline && liveScheduled(s, p) < SCHEDULE_LIMIT; }
    const lowerFirst = t => (t ? t[0].toLowerCase() + t.slice(1) : t);
    const roundsText = n => n + ' round' + (n === 1 ? '' : 's');

    function scheduleEvent(G, p, cid, def) {
        const s = G.s, sch = def.scheduled, delay = Math.max(1, sch.delay || 1);
        const seq = (s.fate.seq || 0) + 1;
        const lifetime = sch.repeat && sch.lifetime ? sch.lifetime : null;
        const ev = { id: 'f' + seq, seq, def: def.id, source: { type: 'tactic', cid, card: def.id }, controller: p,
            space: cursorOf(s) + delay, createdRound: s.round, createdTurn: s.turn, repeat: !!sch.repeat,
            lifetime, expiresRound: lifetime ? s.round + lifetime - 1 : null,
            state: 'pending', fires: 0, firedRound: null, reason: null, target: null };
        s.fate.seq = seq;
        s.fate.queue = queueOf(s).concat([ev]);
        const rounds = delay + (fateHeld(s) ? 1 : 0);
        emit(G, { t: 'fate-schedule', player: p, id: ev.id, cid, def: def.id, space: ev.space, rounds,
            text: says(s, p, 'schedules') + ' ' + def.name + ' on the Fate track. In ' + roundsText(rounds) + ': ' + lowerFirst(sch.summary) });
    }

    // The cursor has entered this space: its live scheduled events fire, oldest first.
    function enterSpace(G, space, how) {
        const s = G.s;
        const due = queueOf(s).filter(ev => ev.space === space && isLive(ev)).sort((a, b) => a.seq - b.seq).map(ev => ev.id);
        for (const id of due) {
            if (s.winner != null) return;
            fireScheduled(G, id, how);
        }
    }
    function fireScheduled(G, id, how) {
        const s = G.s, ev = queueOf(s).find(e => e.id === id);
        if (!ev || !isLive(ev)) return;
        ev.state = 'fired';   // claimed before the effect
        ev.fires = (ev.fires || 0) + 1;
        if (ev.firedRound == null) ev.firedRound = s.round;
        const def = scheduledDef(ev), name = (tacticDefs()[ev.def] || {}).name || ev.def;
        const whose = ev.controller == null ? 'the' : possessive(s, ev.controller);
        emit(G, { t: 'fate-event', id, def: ev.def, cid: ev.source && ev.source.cid, player: ev.controller, how, fires: ev.fires,
            text: 'Fate reaches ' + whose + ' ' + name + ': ' + lowerFirst(def ? def.summary : 'nothing happens.') });
        if (def && def.resolve) def.resolve(api(G), ev, H);
        cleanup(G);
    }
    // After a round's end (the Fate move or the Anchor's hold): live records whose lifetime is used up expire.
    function expireScheduled(G) {
        const s = G.s;
        queueOf(s).forEach(ev => {
            if (!isLive(ev) || ev.expiresRound == null || s.round < ev.expiresRound) return;
            ev.state = 'expired';
            ev.reason = 'lifetime';
            const def = scheduledDef(ev), name = (tacticDefs()[ev.def] || {}).name || ev.def;
            emit(G, { t: 'fate-expire', id: ev.id, def: ev.def, player: ev.controller,
                text: (ev.controller == null ? 'The' : capFirst(possessive(s, ev.controller))) + ' ' + name + ' expires after ' + roundsText(ev.lifetime) + '.' });
            if (def && def.expire) def.expire(api(G), ev, H);
        });
        cleanup(G);
    }

    // The public schedule, one entry per record (oldest first), for the reel, previews and the AI:
    //   { id, seq, def, name, summary, text, cid, controller, state, live, repeat, spaces (from the cursor),
    //     rounds / turns / turn / round / after / held (as in timeline; null when it is not coming),
    //     createdRound, expiresRound, lifetime, fires, firedRound, reason }
    function fateSchedule(s) {
        if (!s.options.timeline) return [];
        const hold = fateHeld(s) ? 1 : 0, half = s.roundTurns[1 - s.active] ? 1 : 0, after = roundCloser(s), pos = cursorOf(s);
        return queueOf(s).map(ev => {
            const def = scheduledDef(ev) || {}, card = tacticDefs()[ev.def] || {};
            const spaces = ev.space - pos, live = isLive(ev);
            const rounds = live && spaces > 0 ? spaces + hold : null, turns = rounds == null ? null : 2 * rounds - half;
            return {
                id: ev.id, seq: ev.seq, def: ev.def, name: card.name || ev.def, summary: def.summary || '', text: card.text || '',
                cid: ev.source ? ev.source.cid || null : null, controller: ev.controller, state: ev.state, live, repeat: !!ev.repeat, spaces,
                rounds, turns, turn: turns == null ? null : s.turn + turns, round: rounds == null ? null : s.round + rounds, after, held: !!hold,
                createdRound: ev.createdRound, expiresRound: ev.expiresRound, lifetime: ev.lifetime, fires: ev.fires || 0, firedRound: ev.firedRound, reason: ev.reason,
            };
        });
    }
    // What a live scheduled event would do if it resolved NOW: the real resolution, run on a copy of the
    // state (nothing is changed), so the preview and the resolution cannot disagree. null when not live.
    //   { id, defeated: [{ cid, name, owner, controller, dest }], hearts: [h0, h1], winner, events }
    function fateEventPreview(state, id) {
        const ev = queueOf(state).find(e => e.id === id);
        if (!ev || !isLive(ev) || state.winner != null) return null;
        const s = cloneState(state);
        const G = { s, rng: Rift.makeRng('battle:' + s.seed + ':preview:' + id), events: [] };
        fireScheduled(G, id, 'preview');
        return {
            id,
            defeated: G.events.filter(e => e.t === 'defeated').map(e => ({ cid: e.cid, name: state.cards[e.cid] ? logName(state, e.cid) : e.cid,
                owner: e.player, controller: state.cards[e.cid] ? state.cards[e.cid].controller : e.player, dest: e.dest })),
            hearts: s.players.map(P => P.hearts), winner: s.winner, events: G.events,
        };
    }

    // ---- main-phase moves ---------------------------------------------------------------------

    function spend(G, amount) { G.s.players[G.s.active].energy -= amount; }

    function doPlay(G, cid, target) {
        const s = G.s, p = s.active, P = s.players[p], c = s.cards[cid];
        const paidCost = playCost(s, cid);
        spend(G, paidCost);
        if (P.tax > 0) P.tax -= 1;
        removeFrom(P.hand, cid);
        s.players[1 - p].knows = s.players[1 - p].knows.filter(k => k !== cid);
        if (conditionOf(s, cid) && !c.conditionSpent) { arm(G, cid); afterMove(G); return; }
        if (c.kind === 'tactic') {
            const def = tacticDefs()[c.tactic];
            P.discard.push(cid);
            emit(G, { t: 'tactic-play', player: p, cid, id: c.tactic, target, text: says(s, p, 'plays') + ' the tactic ' + def.name + (target ? ' on ' + logName(s, target) : '') + '.' });
            if (def.scheduled) scheduleEvent(G, p, cid, def);
            def.run(api(G), p, target);
        } else {
            enterCreature(G, cid, target, false);
        }
        afterMove(G);
        s.completedPlays.push({ event: c.kind === 'tactic' ? 'spell-played' : 'creature-played', actor: p, cid, paidCost });
    }

    function doAxiom(G, id) {
        const s = G.s, p = s.active, P = s.players[p];
        spend(G, axiomCost(s, id, p));
        if (P.tax > 0) P.tax -= 1;
        removeFrom(P.axHand, id);
        emit(G, { t: 'axiom-play', player: p, id, text: says(s, p, 'plays') + ' a rule card.' });
        setAxiom(G, id, p);
        for (let i = 0; i < (axiomDefs()[id].draws || 0); i++) draw(G, p);
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
        if (req.source.type === 'conditional-arm') {
            s.cards[req.source.cid].conditionKey = choice;
        } else if (req.source.type === 'conditional-entry') {
            const c = s.cards[req.source.cid], entry = entranceOf(s, c);
            if (entry) entry.run(api(G), c, choice);
        } else if (req.source.type === 'conditional-intercept') {
            s.attackIntent.target = choice;
        } else if (req.source.type === 'tactic') tacticDefs()[req.source.id].choose(api(G), req.player, choice, req);
        else if (req.source.type === 'power') powerDefs()[req.source.id].choose(api(G), req.player, choice, req, powerMods(s, req.player));
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
        s.attackIntent = { cid, target, player: p };
        conditionalFact(G, 'attack-declared', p, { cid, target });
        resolveReactions(G);
    }

    function finishDeclaredAttack(G) {
        const s = G.s, intent = s.attackIntent, cid = intent.cid, p = intent.player, c = s.cards[cid];
        let target = intent.target;
        if (!s.players[p].board.includes(cid) || c.controller !== p || c.frozen || c.activated || isSleeping(s, cid) || attackOf(s, cid) <= 0) {
            s.attackIntent = null;
            emit(G, { t: 'attack-cancelled', cid, text: 'The declared attacker can no longer attack. Its attack was spent.' });
            return;
        }
        const targets = attackTargets(s, cid);
        if (!targets.includes(target)) {
            const guards = targets.filter(t => !isHero(t) && hasKeyword(s, t, 'guard'));
            if (guards.length) {
                ask(G, { player: p, kind: 'card', options: guards, prompt: 'A Guard revealed. Choose which Guard to attack.', source: { type: 'conditional-intercept' } });
                if (s.phase === 'choose') return;
                target = intent.target;
            } else {
                s.attackIntent = null;
                emit(G, { t: 'attack-cancelled', cid, text: 'The declared target is no longer legal. The attack was spent.' });
                return;
            }
        }
        s.attackIntent = null;
        emit(G, { t: 'attack', player: p, cid, target, text: says(s, p, 'attacks') + ' ' + logName(s, target) + ' with ' + logName(s, cid) + '.' });
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
        emit(G, { t: 'fight', attacker: att, defender: def, pa, pb, text: logName(s, att) + ' (' + pa + ' attack) fights ' + logName(s, def) + ' (' + pb + ' attack)' + (combatAxiom(s) && !combatAxiom(s).basic ? ' under ' + combatAxiom(s).name : '') + '.' });
        dealDamage(G, def, res.toDefender, att);
        dealDamage(G, att, res.toAttacker, def);
        const aDead = healthOf(s, att).current <= 0, dDead = healthOf(s, def).current <= 0;
        if (aDead && dDead && ax && ax.defenderSurvivesTrade) {
            s.cards[def].damage = healthOf(s, def).max - 1;
            emit(G, { t: 'axiom-effect', cid: def, text: ax.name + ': ' + logName(s, def) + ' survives on 1 health.' });
        }
        const aLive = healthOf(s, att).current > 0, dLive = healthOf(s, def).current > 0;
        const won = aLive && !dLive ? att : dLive && !aLive ? def : null;
        if (won) activeAxioms(s).forEach(a => {
            if (a.onFightWon) { a.onFightWon(api(G), s.cards[won]); emit(G, { t: 'axiom-effect', cid: won, text: a.name + ': ' + logName(s, won) + ' grows stronger.' }); }
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
            emit(G, { t: 'shield', cid, text: logName(s, cid) + '\'s Shield blocks the damage.' });
            return 0;
        }
        let red = 0;
        eachAbility(s, c, def => { red += def.damageReduction || 0; });
        const dealt = Math.max(0, amount - red);
        if (!dealt) return 0;
        c.damage += dealt;
        emit(G, { t: 'damage', cid, amount: dealt, source, text: logName(s, cid) + ' takes ' + dealt + ' damage.' });
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
            const names = dead.map(cid => logName(s, cid)); // before any leaves the board
            dead.forEach((cid, i) => defeat(G, cid, 'damage', names[i]));
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

    // name: the log name, when the caller worked it out while the board was still intact.
    function defeat(G, cid, why, name) {
        const s = G.s, c = s.cards[cid];
        if (!s.players[c.controller].board.includes(cid)) return;
        if (!name) name = logName(s, cid);
        const controller = c.controller;
        // Excess damage at the moment of defeat (Changes, #151: overkill raises the odds).
        if (c.kind === 'creature') c.overkill = Math.max(c.overkill || 0, -healthOf(s, cid).current);
        removeFrom(s.players[c.controller].board, cid);
        let dest = 'discard', saver = null;
        // Mercy first, and no return with a full hand, so a once-per-match Last Word is not wasted.
        const room = handCount(s.players[c.owner]) < s.options.handLimit;
        if (room && rules(s).mercy) { dest = 'hand'; saver = 'Mercy'; }
        abilityIds(s, c).forEach(id => {
            const def = abilityDefs()[id];
            if (room && dest === 'discard' && def.lastWord && def.lastWord(api(G), c) === 'hand') { dest = 'hand'; saver = def.name; }
        });
        resetCard(c);
        c.defeats += 1;
        c.controller = c.owner;
        const P = s.players[c.owner];
        if (dest === 'hand' && handCount(P) < s.options.handLimit) P.hand.push(cid);
        else { dest = 'discard'; P.discard.push(cid); }
        emit(G, { t: 'defeated', cid, player: c.owner, dest, why,
            text: dest === 'hand' ? name + ' is defeated, but ' + saver + ' returns it to the hand.' : name + ' is defeated.' });
        conditionalFact(G, 'creature-defeated', controller, { cid, owner: c.owner, dest, why });
    }

    function bounce(G, cid) {
        const s = G.s, c = s.cards[cid];
        if (!removeFrom(s.players[c.controller].board, cid)) return;
        resetCard(c);
        c.controller = c.owner;
        toHand(G, c.owner, cid);
    }

    // "Loses its abilities, keywords and boosts" (Deadpan, Whisper, Occam's Razor): printed, natural,
    // taught and gained abilities and keywords stop working and every boost (a buff with + attack or
    // + health) goes. Penalties stay (a Nickname's −2 and lost colour, FALSE's −1). Health it has left stays.
    function silence(G, cid) {
        const c = G.s.cards[cid];
        const before = healthOf(G.s, cid).current;
        c.silenced = true;
        c.buffs = c.buffs.filter(b => (b.attack || 0) <= 0 && (b.health || 0) <= 0);
        c.gained = []; c.extraKeywords = []; c.prediction = null;
        const max = healthOf(G.s, cid).max;
        c.damage = before >= max ? 0 : max - before;
    }

    // ---- the Bag: items brought into the battle ------------------------------------------------
    // Item battle jobs live in data/items.js (`battle: { cost, target?, filter?, text, usable?, why?,
    // noTarget?, run(api, p, target) }`). One item per turn per player; used items leave the bag.

    const BAG_LIMIT = 2;
    const itemName = id => ((Rift.data.items || {})[id] || {}).name || id;

    // Known item ids with a battle job, at most BAG_LIMIT.
    function bagSelection(list) {
        return (list || []).filter(id => battleItem(id)).slice(0, BAG_LIMIT);
    }

    // The item actions player p may take now (main phase, no item used yet this turn).
    function itemActions(s, p) {
        const P = s.players[p];
        if (s.winner != null || s.phase !== 'main' || s.active !== p || !P.bag || P.itemTurn === s.turn) return [];
        const out = [];
        Array.from(new Set(P.bag)).forEach(id => {
            const def = battleItem(id);
            if (!def || def.cost > P.energy || (def.usable && !def.usable(s, p, H))) return;
            if (def.target) targetsFor(s, def.target, p, def.filter, null).forEach(target => out.push({ type: 'item', player: p, id, target }));
            else out.push({ type: 'item', player: p, id });
        });
        return out;
    }

    // One entry per item kind in p's bag, for the Bag tray: { id, name, text, cost, target, count,
    // ok, why: '' | 'turn' | 'draw' | 'busy' | 'used' | 'energy' | 'useless' | 'target', note }.
    function bagStatus(s, p) {
        const P = s.players[p];
        const counts = {};
        (P.bag || []).forEach(id => { counts[id] = (counts[id] || 0) + 1; });
        return Object.keys(counts).map(id => {
            const def = battleItem(id);
            const pick = x => (typeof x === 'function' ? x(s, p, H) : x);
            let why = '', note = '';
            if (s.winner != null || s.active !== p) { why = 'turn'; note = 'Wait for your turn.'; }
            else if (s.phase === 'draw') { why = 'draw'; note = 'First choose your draw.'; }
            else if (s.phase !== 'main') { why = 'busy'; note = 'First answer the question.'; }
            else if (P.itemTurn === s.turn) { why = 'used'; note = 'You already used an item this turn.'; }
            else if (def.cost > P.energy) { why = 'energy'; note = 'It needs ' + def.cost + ' energy. You have ' + P.energy + '.'; }
            else if (def.usable && !def.usable(s, p, H)) { why = 'useless'; note = pick(def.why) || 'It would do nothing now.'; }
            else if (def.target && !targetsFor(s, def.target, p, def.filter, null).length) { why = 'target'; note = pick(def.noTarget) || 'It has no target right now.'; }
            return { id, name: itemName(id), text: def.text, cost: def.cost, target: def.target || null, count: counts[id], ok: !why, why, note };
        });
    }

    function doItem(G, id, target) {
        const s = G.s, p = s.active, P = s.players[p], def = battleItem(id);
        spend(G, def.cost);
        const i = P.bag.indexOf(id);
        P.bag = P.bag.slice(0, i).concat(P.bag.slice(i + 1));
        P.itemsUsed = P.itemsUsed.concat([id]);
        P.itemTurn = s.turn;
        emit(G, { t: 'item-use', player: p, id, target, text: says(s, p, 'uses') + ' the ' + itemName(id) + (target ? ' on ' + logName(s, target) : '') + '.' });
        def.run(api(G), p, target);
        afterMove(G);
    }

    // { id: n } for the items player p used in this battle (the caller removes them from the save).
    function itemsUsed(s, p) {
        const out = {};
        (s.players[p].itemsUsed || []).forEach(id => { out[id] = (out[id] || 0) + 1; });
        return out;
    }

    // ---- hero powers (design/AVATARS.md section 1, data/powers.js) -------------------------------

    const TWEAKS = ['quick', 'cheap', 'blood', 'deeper', 'broader'];

    // createBattle's player.power → the battle's power state (null: no power).
    function powerSetup(pw) {
        if (!pw || !powerDefs()[pw.id]) return null;
        const tweaks = [];
        (pw.tweaks || []).forEach(t => { if (TWEAKS.includes(t) && !tweaks.includes(t) && tweaks.length < 3) tweaks.push(t); });
        return { id: pw.id, tweaks, cooldown: 0, uses: 0 };
    }

    // The power's numbers after its tweaks. Cost and recharge never go below 0, nor cost below the
    // power's minCost (Night Sight 2). Blood price (#53): 1 heart per 2 energy it would cost, at least 1.
    function powerMods(s, p) {
        const pw = s.players[p].power;
        if (!pw) return null;
        const def = powerDefs()[pw.id];
        const has = t => pw.tweaks.includes(t);
        let cost = def.cost, recharge = def.recharge, heartCost = 0;
        const deeper = has('deeper') && !!def.deeper, broader = has('broader') && !!def.broader;
        if (has('quick')) { recharge -= 1; cost += 1; }
        if (has('cheap')) { cost -= 1; recharge += 1; }
        if (deeper) recharge += 1;
        if (broader) cost += 1;
        cost = Math.max(0, def.minCost || 0, cost);
        if (has('blood')) { heartCost = Math.max(1, Math.ceil(cost / 2)); cost = 0; }
        return { def, cost, heartCost, recharge: Math.max(0, recharge), deeper, broader };
    }

    // Why player p can't use the power now ('' when it can), as a code and a short note.
    function powerBlock(s, p, m) {
        const P = s.players[p], def = m.def;
        if (s.winner != null || s.active !== p) return ['turn', 'Wait for your turn.'];
        if (s.phase === 'draw') return ['draw', 'First choose your draw.'];
        if (s.phase !== 'main') return ['busy', 'First answer the question.'];
        if (P.power.cooldown > 0) return ['recharge', 'Ready in ' + P.power.cooldown + ' turn' + (P.power.cooldown === 1 ? '' : 's') + '.'];
        if (m.cost > P.energy) return ['energy', 'It needs ' + m.cost + ' energy. You have ' + P.energy + '.'];
        if (m.heartCost && !rules(s).reverseHearts && P.hearts <= m.heartCost) return ['hearts', 'It costs ' + (m.heartCost === 1 ? 'a heart' : m.heartCost + ' hearts') + ', and you have only ' + P.hearts + '.'];
        if (def.usable && !def.usable(s, p, H, m)) return ['useless', 'It would do nothing now.'];
        if (def.target && !powerTargets(s, p, m).length) return ['target', 'It has no target right now.'];
        return ['', ''];
    }

    function powerTargets(s, p, m) {
        const def = m.def;
        return targetsFor(s, def.target, p, def.filter ? (st, cid, h) => def.filter(st, cid, h, m) : null, null);
    }

    // The power actions player p may take now.
    function powerActions(s, p) {
        if (!s.players[p].power) return [];
        const m = powerMods(s, p);
        if (powerBlock(s, p, m)[0]) return [];
        if (m.def.target) return powerTargets(s, p, m).map(target => ({ type: 'power', player: p, target }));
        return [{ type: 'power', player: p }];
    }

    // Everything the power button needs, or null when p has no power.
    function powerStatus(s, p) {
        const pw = s.players[p].power;
        if (!pw) return null;
        const m = powerMods(s, p), def = m.def;
        const [why, note] = powerBlock(s, p, m);
        return {
            id: pw.id, name: def.name, text: Rift.Powers ? Rift.Powers.text(pw.id, pw.tweaks) : def.text, tweaks: pw.tweaks.slice(),
            cost: m.cost, heartCost: m.heartCost, recharge: m.recharge, turnsLeft: pw.cooldown, ready: pw.cooldown === 0,
            usable: !why, why, note, target: def.target || null, uses: pw.uses,
        };
    }

    function doPower(G, target) {
        const s = G.s, p = s.active, P = s.players[p];
        const m = powerMods(s, p), def = m.def;
        spend(G, m.cost);
        P.power = Object.assign({}, P.power, { cooldown: m.recharge + 1, uses: P.power.uses + 1 });
        emit(G, { t: 'power-use', player: p, id: P.power.id, target, text: says(s, p, 'uses') + ' the power ' + def.name + (target ? ' on ' + logName(s, target) : '') + '.' });
        if (m.heartCost) damageHero(G, p, m.heartCost);
        def.run(api(G), p, target, m);
        afterMove(G);
    }

    // A random team of n instances, weighted by rarity (for the simulator and bench).
    // opts.maxCopies: at most this many of one species (2 makes a legal opponent deck, #112).
    function randomTeam(rng, n, opts) {
        const o = opts || {};
        const all = Rift.data.creatures || {};
        const rar = Rift.data.rarities || {};
        let weights = Object.keys(all)
            .filter(id => o.legendaries !== false || all[id].rarity !== 'legendary')
            .map(id => ({ item: id, weight: (rar[all[id].rarity] || { weight: 1 }).weight }));
        const team = [], counts = {};
        for (let i = 0; i < n && weights.length; i++) {
            const sp = rng.weighted(weights);
            counts[sp] = (counts[sp] || 0) + 1;
            if (o.maxCopies && counts[sp] >= o.maxCopies) weights = weights.filter(w => w.item !== sp);
            team.push({ uid: (o.prefix || 'r') + '-' + i, species: sp, caughtAt: 0,
                powerDelta: 0, scars: [], injuries: [], warped: null, trophyOf: null, wins: 0 });
        }
        return team;
    }

    // Helpers exposed to data hooks (abilities, axioms, tactics) and the AI.
    const H = {
        colourOf, wheelBonus, cardName, logName, playerName, keywordsOf, hasKeyword,
        handRoom: (s, p, n, leaving) => handRoom(s, p, n, leaving),
        colourInPlay: (s, p, colour) => colourInPlay(s, p, colour),
        boardOf: (s, p) => s.players[p].board,
        attack: (s, cid, foe) => attackOf(s, cid, foe),
        health: (s, cid) => healthOf(s, cid).current,
        rules,
        playCost: (s, cid) => playCost(s, cid),
        canAttack: (s, cid) => canAttack(s, cid),
    };

    Battle.Engine = {
        DEFAULTS, RULE_DEFAULTS, PAD_SPECIES, KEYWORDS,
        createBattle, legalActions, applyAction, applyLegal, winner, decider, actionKey, cloneState, fullLog, lostUids, overkillOf, exhaustion,
        rules, activeAxioms, axiomWouldChange, changedAxioms, ruleSummary, timeline, fatePreview, fateNext, fateSchedule, fateEventPreview, SCHEDULE_LIMIT, canSchedule, describe, activeEffects, wheelEdges, playsLeft, playLimit,
        playCost, axiomCost, attackOf, attackParts, healthOf, keywordsOf, hasKeyword, isSleeping, isHidden,
        canAttack, attackTargets, activations, canActivateNow, targetsFor, entranceOf, fightPreview,
        colourOf, wheelBonus, cardName, logName, says, handRoom, isHero, heroId, drawChoices, creaturesLeft,
        buildAxiomDeck, axiomSelection, tacticSelection, randomTeam, colourInPlay, H,
        BAG_LIMIT, bagSelection, itemActions, bagStatus, itemsUsed,
        TWEAKS, powerMods, powerActions, powerStatus,
        conditionOf, boardOccupancy, armedView, informationState,
    };
})(typeof window !== 'undefined' ? window : globalThis);
