/*
 * Battle engine (Card Arena rules, design/card-arena-2026-10-07.md).
 * PURE and deterministic: state + action → new state. No DOM.
 *
 * Heroes have hearts (10 by default). Creatures have attack and health; damage stays.
 * Each turn: one draw choice (own deck or the shared axiom deck), then up to two shared card
 * activations (rules.playLimit): cast a creature/tactic/axiom for energy, attack with a ready creature
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
 *                  hearts?, consumables?, bag?, power?: { id, tweaks: [] }, ownAxioms?: [ids] }], axiomDeck?: [ids],
 *                  environment?: [{ def, first, every?, times?, side? }], options })      → state
 *                  ownAxioms: the player's own rule cards (ax.own, e.g. Granny's Spare Axiom), added to the opening
 *                  hand; own cards are never taken into the shared axiom deck.
 *                  environment: the encounter's public environmental Fate events (#128, Rift.data.environments):
 *                  def's first occurrence sits on space `first`; with `every` it recurs (a new occurrence each
 *                  time, at most `times` in all); side: the player index it favours, or null for both.
 *   legalActions(state) → [action]    applyAction(state, action) → new state (input untouched)
 *   applyLegal(state, action) → like applyAction but skips the legality check; only for an
 *                  action object taken from legalActions(state) of this same state (AI lookahead)
 *   decider(state) → player index who must act, or null     winner(state) → 0 | 1 | 'draw' | null
 *   describe(state, cid) → everything a card face needs (name, cost, attack, health, keywords, lines…)
 *   attackOf / healthOf / keywordsOf / canAttack / attackTargets / activations / targetsFor / fightPreview
 *   rules(state), ruleSummary(state), timeline(state), fullLog(state), lostUids(state, p), overkillOf(state, p)
 *   fateSchedule(state) → the public scheduled Fate events (#118/#119), fateEventPreview(state, id) → what
 *                  one would do if it resolved now (the real resolution, run on a copy), canSchedule(state, p)
 *   fateLeapPreview(state, spaces, p) → what a leap (#120, Leap Ahead) would do now, also run on a copy
 *   scheduleDelay(state, tacticId) → how many spaces ahead that scheduled card would land if played now (its
 *                  printed delay moved by a fate-delay Axiom, #121); scheduleLimit(state) → live events each
 *                  player may have (2; Open Calendar 3)
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
 *   cid, player, how: 'walk' | 'rewind' | 'leap', fires } (its effects follow), 'fate-expire' { id, def, player,
 *   boosted: [cids whose boosts from it end] }.
 *   A leap (#120): 'fate-leap' { player, from, to, spaces, skipped: [ids], passed: [ids] }, then one
 *   'fate-skip' { id, def, player (its controller), by } for each one-shot event it jumped over.
 *   'fate-schedule' also carries printed and delay (#121: a fate-delay Axiom moved it when they differ).
 *   A token (#121, Tomorrow's Idea): 'summon' { player, cid, token }. A token that leaves play leaves the game:
 *   'defeated' with dest 'gone', or 'token-gone' { cid, player } when it would go to a hand.
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
 * may use it for its energy (or hearts with the Blood price tweak). It is not a card activation. After
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
        // Fate timing Axioms (#121): delay shift for newly scheduled spells, extra live events per player,
        // most hearts one resolving scheduled effect can take from each hero.
        fateDelay: 0, scheduleExtra: 0, fateHeroCap: null,
    };
    const PAD_SPECIES = ['astrophysicat', 'zuckerborg', 'siuuugull'];
    const NUMERIC_RULES = Object.freeze({
        plays: { field: 'playLimit', min: 1, max: 6, label: 'Activations' },
        draw: { field: 'drawCount', min: 1, max: 3, label: 'Draw count' },
        energy: { field: 'growth', min: -1, max: 3, label: 'Energy growth' },
        cost: { field: 'costDelta', min: -2, max: 2, label: 'Creature cost change' },
    });
    const ruleValue = n => n === Infinity ? 'Unlimited' : String(n);
    const KEYWORDS = ['guard', 'swift', 'shield'];

    // Tokens (#121, data/tactics.js Rift.data.tokens) are looked up like species, but are never collected.
    const species = id => (Rift.data.creatures || {})[id] || (Rift.data.tokens || {})[id];
    const abilityDefs = () => Battle.Abilities || {};
    const axiomDefs = () => Rift.data.axioms || {};
    const tacticDefs = () => Rift.data.tactics || {};
    const envDefs = () => Rift.data.environments || {};
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
            ...P, deck: P.deck.slice(), hand: P.hand.slice(), axHand: P.axHand.slice(), publicAxioms: (P.publicAxioms || []).slice(),
            board: P.board.slice(), armed: (P.armed || []).slice(), discard: P.discard.slice(), knows: P.knows.slice(),
        }));
        s.cards = cards;
        s.roundTurns = state.roundTurns.slice();
        s.pending = state.pending ? { ...state.pending } : null;
        s.reactions = (state.reactions || []).slice();
        s.completedPlays = (state.completedPlays || []).slice();
        s.attackIntent = state.attackIntent ? { ...state.attackIntent } : null;
        s.axioms = { ...state.axioms, active: { ...state.axioms.active }, numeric: Object.fromEntries(Object.entries(state.axioms.numeric || {}).map(([k, v]) => [k, { ...v }])), deck: state.axioms.deck.slice(), discard: state.axioms.discard.slice() };
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
        const numeric = s.axioms.numeric || {};
        const m = ruleMemo.get(active);
        if (m) {
            let n = 0, same = true;
            for (const k in active) { n++; if (m.snap[k] !== active[k]) { same = false; break; } }
            if (same && n === m.n && Object.keys(NUMERIC_RULES).every(k => {
                const a = numeric[k], b = m.numeric[k];
                return a ? b && a.id === b.id && a.value === b.value : !b;
            })) return m;
        }
        const list = Object.freeze(Object.values(active).map(id => axiomDefs()[id]).filter(Boolean));
        const out = Object.assign({}, RULE_DEFAULTS);
        list.forEach(a => Object.assign(out, a.rules || {}));
        Object.entries(NUMERIC_RULES).forEach(([cat, def]) => {
            const rec = numeric[cat];
            if (rec && rec.id === active[cat]) {
                if (rec.value === 'unlimited' && cat === 'plays') out[def.field] = Infinity;
                else if (Number.isInteger(rec.value) && rec.value >= def.min && rec.value <= def.max) out[def.field] = rec.value;
            }
        });
        const memo = { snap: Object.assign({}, active), numeric: Object.fromEntries(Object.entries(numeric).map(([k, v]) => [k, { ...v }])), n: Object.keys(active).length, list, rules: Object.freeze(out) };
        ruleMemo.set(active, memo);
        return memo;
    }
    function activeAxioms(s) { return memoFor(s).list; }
    // Active rule cards that differ from the basics (a `basic` card only restates a default rule).
    function changedAxioms(s) { return activeAxioms(s).filter(a => NUMERIC_RULES[a.category]
        ? rules(s)[NUMERIC_RULES[a.category].field] !== RULE_DEFAULTS[NUMERIC_RULES[a.category].field] : !a.basic); }
    // False when playing this axiom card would change nothing: the same rule is already active,
    // or a "back to normal" card while its category is already normal.
    function axiomWouldChange(s, id) {
        return axiomPreview(s, id).changed;
    }
    // One pure transition description for legal casts, free flips, UI and AI. Numeric records are
    // battle-local JSON values; provenance alone never reconstructs accumulated deltas.
    function axiomPreview(s, id) {
        const ax = axiomDefs()[id];
        if (!ax) return { changed: false, reason: 'Unknown rule.' };
        const category = ax.category, def = NUMERIC_RULES[category];
        if (def && (ax.modifier || ax.basic || (ax.rules && def.field in ax.rules))) {
            const before = rules(s)[def.field], mod = ax.modifier;
            if (mod && (mod.field !== def.field || ![-2, -1, 1, 2].includes(mod.delta))) return { category, changed: false, reason: 'Invalid numeric modifier.' };
            const after = mod ? before === Infinity ? Infinity : Math.max(def.min, Math.min(def.max, before + mod.delta)) : ax.rules && def.field in ax.rules ? ax.rules[def.field] : RULE_DEFAULTS[def.field];
            const changed = before !== after;
            const reason = changed ? '' : mod && before === Infinity ? 'Unlimited stays Unlimited; play a fixed limit to change it.'
                : mod ? def.label + ' stays at ' + ruleValue(before) + ' (bounds ' + def.min + ' to ' + def.max + ').' : 'Already the rule: ' + def.label + ' is ' + ruleValue(before) + '.';
            return { category, field: def.field, before, after, changed, reason, text: def.label + ': ' + ruleValue(before) + ' → ' + ruleValue(after) + (reason ? '. ' + reason : '') };
        }
        if (ax.modifier) return { category, changed: false, reason: 'Invalid numeric category.' };
        if (ax.clearRules) {
            const changed = changedAxioms(s).length > 0;
            return { category, changed, reason: changed ? '' : 'No rule to clear: every rule is basic now.' };
        }
        const current = s.axioms.active[ax.category];
        const changed = current !== id && (!ax.basic || (!!current && !(axiomDefs()[current] || {}).basic));
        return { category, changed, reason: changed ? '' : 'Already the rule: ' + ax.name + ' would change nothing now.' };
    }
    function projectedAxioms(s, id, preview) {
        const ax = id && axiomDefs()[id];
        if (id && !ax) return s.axioms;
        if (!id || ax.clearRules) return { ...s.axioms, active: {}, numeric: {} };
        if (!preview.changed) return s.axioms;
        const numeric = { ...s.axioms.numeric };
        if (preview.field) numeric[ax.category] = { id, value: preview.after === Infinity ? 'unlimited' : preview.after };
        else delete numeric[ax.category];
        return { ...s.axioms, active: { ...s.axioms.active, [ax.category]: id }, numeric };
    }
    function projectAxiom(s, id) {
        return { ...s, axioms: projectedAxioms(s, id, id ? axiomPreview(s, id) : null) };
    }
    function rules(s) { return memoFor(s).rules; }
    function goalProgress(s, p) {
        const ax=activeAxioms(s).find(a=>a.category==='victory'&&a.goalChecks);
        if(!ax)return null;
        const checks=ax.goalChecks(s,p,H);
        return {id:ax.id,name:ax.name,checks,complete:checks.every(c=>c.met)};
    }
    function combatAxiom(s) { return activeAxioms(s).find(a => a.category === 'combat') || null; }

    // ---- card queries --------------------------------------------------------------

    function cardName(s, cid) {
        if (isHero(cid)) return s.players[+cid[1]].name;
        const c = s.cards[cid];
        if (!c) return '?';
        if (c.kind === 'concealed') return 'an unknown card';
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
            attacks: 'attack', loses: 'lose', ends: 'end', draws: 'draw', activates: 'activate', skips: 'skip', uses: 'use', schedules: 'schedule', pays: 'pay' }[verb] || verb;
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
        // Timed keywords (#148): gained or lost until a turn starts. When one ends, the creature's own keywords
        // are as they were. A timed Shield is separate from a used printed one: it never revives that one.
        const timed = c.timedKeywords || [];
        const timedLoss = timed.filter(t => t.mode === 'lose').map(t => t.k);
        const lost = (c.lostKeywords || []).concat(timedLoss);
        let kept = lost.length ? out.filter(k => !lost.includes(k)) : out;
        if (c.shieldUsed) kept = kept.filter(k => k !== 'shield');
        timed.forEach(t => { if (t.mode === 'gain' && !timedLoss.includes(t.k) && !kept.includes(t.k)) kept.push(t.k); });
        return kept;
    }
    const hasKeyword = (s, cid, k) => keywordsOf(s, cid).includes(k);

    // 'none' (nicknamed): no colour at all, so no spotlight (not even Memory's) and no wheel bonus.
    function colourOf(s, card) {
        return card.colourless || card.generic ? 'none' : (card.colour || 'memory');
    }
    function wheelBonus(s, card, foe) {
        const W = Rift.data.wheel;
        if (!W || !card || card.kind !== 'creature' || !foe || foe.kind !== 'creature') return 0;
        const a = colourOf(s, card), b = colourOf(s, foe);
        const from = W.order.indexOf(a), to = W.order.indexOf(b);
        if (from < 0 || to < 0) return 0;
        const distance = (to - from + W.order.length) % W.order.length;
        const modifier = distance === 1 || distance === 2 ? W.bonus : distance === 4 || distance === 5 ? -W.bonus : 0;
        return modifier && rules(s).wheelReversed ? -modifier : modifier;
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
        let total = Math.max(0, parts.reduce((sum, p) => sum + p.amount, 0));
        // A matchup is conditional on the target, after every ordinary modifier. It cannot
        // turn zero attack into an attack, or reduce an otherwise positive attack below one.
        if (total > 0 && foeCid && s.cards[foeCid]) {
            const w = wheelBonus(s, c, s.cards[foeCid]);
            if (w) {
                parts.push({ source: 'colour', label: w > 0 ? 'Strong' : 'Weak', amount: w });
                if (total + w < 1) parts.push({ source: 'floor', label: 'Positive attack floor', amount: 1 - total - w });
                total = Math.max(1, total + w);
            }
        }
        return { total, parts };
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
    // `from` is in play), 'rule' (while that rule is active), 'tax' (Night Sight), 'fate' (until a
    // repeatable Fate space expires, from: its last round), 'next-turn' (until turn `from` ends), 'turn-start'
    // (#148: until turn `from` starts). The colour wheel depends on the target, so it is not here: see wheelEdges.
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
            // A repeatable Fate space's boost (#120) lasts until that space expires: from = its last round.
            // A boost until a player's next turn ends (#121, Scheduled Speech): from = that turn's number.
            // A boost until a player's next turn starts (#148, Standing Ovation): from = that turn's number.
            const until = b.fate ? 'fate' : b.untilTurn != null ? 'next-turn' : b.untilStart != null ? 'turn-start' : b.temp ? 'turn' : 'play';
            const from = b.fate ? ((queueOf(s).find(ev => ev.id === b.fate) || {}).expiresRound || null) : b.untilTurn != null ? b.untilTurn : b.untilStart != null ? b.untilStart : null;
            if (b.attack) out.push({ stat: 'attack', amount: b.attack, label: b.label, until, from });
            if (b.health) out.push({ stat: 'health', amount: b.health, label: b.label, until, from });
        });
        // Timed keywords (#148): { stat: 'keyword', keyword, amount: +1 gained / −1 lost, until: 'turn-start' }.
        (c.timedKeywords || []).forEach(t => out.push({ stat: 'keyword', keyword: t.k, amount: t.mode === 'gain' ? 1 : -1, label: t.label || 'Condition', until: 'turn-start', from: t.until }));
        if (s.players[c.controller].hand.includes(cid)) {
            const delta = rules(s).costDelta;
            const shown = Math.max(0, c.cost + delta) - c.cost;   // a cost never goes below 0
            if (shown) out.push({ stat: 'cost', amount: shown, label: (activeAxioms(s).find(ax => ax.rules && ax.rules.costDelta) || {}).name || 'Cost rule', until: 'rule', from: null });
            if (taxOn(s, cid)) out.push({ stat: 'cost', amount: 1, label: 'Night Sight', until: 'tax', from: null });        }
        return out;
    }
    // Target relationships from this creature's side; follows a reversed wheel.
    function wheelEdges(s, cid) {
        const W = Rift.data.wheel, c = s.cards[cid];
        const out = { strong: [], weak: [], neutral: [], bonus: W ? W.bonus : 0 };
        if (!W || !c || c.kind !== 'creature') return out;
        W.order.forEach(b => {
            const foe = { kind: 'creature', colour: b };
            const modifier = wheelBonus(s, c, foe);
            out[modifier > 0 ? 'strong' : modifier < 0 ? 'weak' : 'neutral'].push(b);
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
        if (!playsLeft(s, s.active) || !P.board.includes(cid) || c.frozen || c.activated || isSleeping(s, cid)) return false;
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
    // A spell-only tax (#148, Queue That Question): the player's next spell card costs `amount` more, until it is
    // paid or turn `until` ends. Creatures, rule cards and abilities are not taxed. P.spellTax: { amount, until, label }.
    function spellTaxOn(s, cid) {
        const c = s.cards[cid], P = s.players[c.controller], T = P.spellTax;
        return c.kind === 'tactic' && T && T.until >= s.turn && P.hand.includes(cid) ? T.amount : 0;
    }
    function friendlySpellDiscount(s, cid, target) {
        const c = s.cards[cid], P = s.players[c.controller], def = tacticDefs()[c.tactic] || {};
        if (c.kind !== 'tactic' || P.friendlySpellsThisTurn || (conditionOf(s, cid) && !c.conditionSpent)) return 0;
        if (!P.board.some(id => { let on = false;eachAbility(s, s.cards[id], d => { if (d.friendlySpellDiscount) on = true; });return on; })) return 0;
        const friendly = target ? P.board.includes(target) : def.target && targetsFor(s, def.target, c.controller, def.filter, null).some(t => P.board.includes(t));
        return friendly ? 1 : 0;
    }
    function playCost(s, cid, target) {
        const c = s.cards[cid];
        if (c.kind === 'tactic') return Math.max(0, (tacticDefs()[c.tactic] || { cost: 0 }).cost + taxOn(s, cid) + spellTaxOn(s, cid) - friendlySpellDiscount(s, cid, target));
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
            && playsLeft(s, s.active) > 0 && !c.frozen && !c.activated && !c.attacks && !isSleeping(s, cid);
    }

    // A one-fight Shield never becomes a lasting keyword or uses up an existing Shield (#129).
    // Both preview and commitment compare the same effective attacks, including wheel/rule/aura changes.
    function fightShield(s, attacker, pa, pb) {
        return pb > pa && abilityFlag(s, s.cards[attacker], 'shieldAgainstHigher');
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
        const damageToAttacker = fightShield(s, att, pa, pb) ? 0 : damageAfterPrevention(s, att, res.toAttacker);
        const damageToDefender = damageAfterPrevention(s, target, res.toDefender);
        const ha = healthOf(s, att).current - damageToAttacker, hb = healthOf(s, target).current - damageToDefender;
        let defenderDefeated = hb <= 0;
        const attackerDefeated = ha <= 0;
        if (ax && ax.defenderSurvivesTrade && attackerDefeated && defenderDefeated) defenderDefeated = false;
        return { hero: false, pa, pb, toAttacker: res.toAttacker, toDefender: res.toDefender, damageToAttacker, damageToDefender, attackerDefeated, defenderDefeated };
    }

    function creaturesLeft(s, p) {
        const P = s.players[p];
        return planningCreatureCount(s, p) > 0 || P.deck.concat(P.hand, P.board, P.armed || []).some(cid => s.cards[cid].kind === 'creature' || s.cards[cid].reservedCreature);
    }

    // A known aggregate reserve, never assigned to an unseen position. If opaque cards leave
    // play, cap the estimate by those still available; no hypothetical identity is invented.
    function planningCreatureCount(s, p) {
        const P = s.players[p];
        return Math.min(P.planningCreatureReserve || 0, P.deck.concat(P.hand).filter(cid => s.cards[cid].kind === 'concealed').length);
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
            const kind = def.activate ? 'activate' : def.entrance ? 'entrance' : def.lastWord || def.lastWordEffect ? 'lastword' : 'passive';
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
            ['Turn', 'Choose one draw: take ' + r.drawCount + ' from your deck or the axiom deck. Energy grows by ' + r.growth + ' and refills (max ' + s.options.energyCap + '). Use up to ' + (r.playLimit === Infinity ? 'any number of' : r.playLimit) + ' card activations: casts, attacks and manual Activate together.'
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
                if (def.target) targetsFor(s, def.target, p, def.filter, null).forEach(target => { if (playCost(s, cid, target) <= P.energy) list.push({ type: 'play', player: p, cid, target }); });
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

    // Shared card activations: each cast, declared attack and manual Activate costs one.
    // Draw, End, Spark, Bag, hero powers, passive effects and pending answers are exempt.
    // Keep the old field/API names for compatible battle fixtures and integrations.
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
    // the hand was full (`burned`) never fought, so they do not count. Tokens (#121) are not collected.
    function lostUids(s, p) {
        const out = [];
        s.players.forEach(P => P.discard.forEach(cid => {
            const c = s.cards[cid];
            if (c.kind === 'creature' && c.owner === p && !c.loaner && !c.burned && !c.token && !out.includes(c.uid)) out.push(c.uid);
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
            damage: 0, enteredTurn: null, attacks: 0, activated: false, frozen: false, frozenUntil: null, silenced: false, shieldUsed: false,
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
            // Submitted personal cards define mono once. Generic cards do not break it;
            // Memory is an explicit sixth colour. Shared rules, tokens and live changes never recalculate it.
            const deckColours = Array.from(new Set(ids.map(cid => {
                const c = s.cards[cid];
                const def = c.kind === 'creature' ? species(c.species) : tacticDefs()[c.tactic];
                return def.generic ? null : def.colour;
            }).filter(colour => ['reason', 'emotion', 'perception', 'language', 'imagination', 'memory'].includes(colour))));
            s.players.push({
                id: pl.id || ('p' + i), name: pl.name || (i === 0 ? 'You' : 'Opponent'),
                hearts, maxHearts: hearts, energy: 0, capacity: 0, spark: false,
                monoColour: deckColours.length === 1 ? deckColours[0] : null,
                deck: opts.shuffle ? rng.shuffle(ids) : ids, hand: [], axHand: [], board: [], armed: [], discard: [],
                playedCount: 0, turnsTaken: 0, attacksThisTurn: 0, friendlySpellsThisTurn: 0, knows: [], exhaustion: 0,
                consumables: Object.assign({}, cons),
                bag: bagSelection(pl.bag), itemsUsed: [], itemTurn: 0,
                power: powerSetup(pl.power), tax: 0, sight: [], nextEnergy: 0,
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
        s.players.forEach((P, p) => emit(G, { t: 'deck-identity', player: p,
            text: P.name + '\'s public deck identity: ' + (P.monoColour ? 'Mono ' + P.monoColour : 'mixed or generic') + '. Shared rules do not count.' }));
        setupEnvironment(G, cfg.environment);
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
        resolveAction(G, match);
        s.lastEvents = G.events;
        s.log = { prev: state.log, events: G.events };
        return s;
    }

    function resolveAction(G, match) {
        switch (match.type) {
            case 'draw': doDraw(G, match.choice); break;
            case 'play': countPlay(G); doPlay(G, match.cid, match.target || null); break;
            case 'axiom': countPlay(G); doAxiom(G, match.choice); break;
            case 'attack': countPlay(G); doAttack(G, match.cid, match.target); break;
            case 'activate': countPlay(G); doActivate(G, match.cid, match.ability, match.target || null); break;
            case 'spark': doSpark(G); break;
            case 'item': doItem(G, match.id, match.target || null); break;
            case 'power': doPower(G, match.target || null); break;
            case 'end': endTurn(G); break;
            case 'choose': resolveChoice(G, match.choice); break;
            default: throw new Error('Unknown action ' + match.type);
        }
        resolveReactions(G);
    }

    // #108: prospective resolution never runs an unseen draw, random branch or concealed condition.
    // Guarded private zones fail closed even when a hook reads them directly instead of using api.draw.
    // Only public snapshots/text leave this function, never the simulated state or private event fields.
    function previewAction(state, action, viewer) {
        const frames = [], lines = [], explanations = [], stop = message => { throw { previewStop: true, message }; };
        const copy = x => Array.isArray(x) ? x.map(copy) : x && typeof x === 'object' ? Object.fromEntries(Object.entries(x).map(([k, v]) => [k, copy(v)])) : x;
        // History is immutable and irrelevant to one prospective move. Do not recursively copy
        // its linked list (or retain private historical events for hooks to inspect).
        const s = copy({ ...state, log: null, lastEvents: [] });
        const snapshot = () => ({
            players: s.players.map(P => ({ name: P.name, hearts: P.hearts, energy: P.energy, uses: playsLeft(s, s.players.indexOf(P)),
                board: P.board.map(cid => ({ cid, species: s.cards[cid].species, name: cardName(s, cid), attack: attackOf(s, cid), health: healthOf(s, cid).current,
                    keywords: keywordsOf(s, cid).slice() })) })),
            rules: changedAxioms(s).map(a => a.name + ': ' + (NUMERIC_RULES[a.category] ? NUMERIC_RULES[a.category].label + ' ' + ruleValue(rules(s)[NUMERIC_RULES[a.category].field]) : a.text)),
        });
        const push = text => { if (frames.length < 7) frames.push({ text, view: snapshot() }); };
        const explainFighter = (cid, target) => {
            const parts = attackParts(s, cid, target);
            const notes = [cardName(s, cid) + ': ' + parts.parts.map(p => p.label + ' ' + (p.amount >= 0 ? '+' : '') + p.amount).join(', ') + ' = ' + parts.total + ' attack.'];
            if (hasKeyword(s, cid, 'shield')) notes.push('Shield blocks its next hit.');
            eachAbility(s, s.cards[cid], def => {
                if (def.damageReduction) notes.push(def.name + ': each hit deals it ' + def.damageReduction + ' less damage.');
                if (isHero(target) && def.heroDamage) notes.push(def.name + ': +' + def.heroDamage + ' damage to a hero.');
            });
            return notes.join(' ');
        };
        push('Before the move.');
        const G = { s, rng: new Proxy({}, { get: () => () => stop('A random result is unknown until you commit the move.') }), events: [], preview: true };
        G.capture = ev => {
            const text = ev.privateTo != null ? ev.publicText : ev.text;
            if (text) { lines.push(text); push(text); }
            // Fight is emitted after attack/defence hooks. Explain the actual public modifiers
            // there, including prevention, rather than treating arithmetic as full resolution.
            if (ev.t === 'fight') {
                explanations.push(explainFighter(ev.attacker, ev.defender), explainFighter(ev.defender, ev.attacker));
            }
        };
        let complete = false, reason = '';
        try {
            if (viewer !== decider(state) || !action || (action.player != null && action.player !== viewer) || !['attack', 'activate', 'play', 'axiom', 'power', 'item'].includes(action.type)) stop('Choose a complete move on your turn first.');
            const match = legalActions(state).find(a => actionKey(a) === actionKey(action));
            if (!match) stop('That move is no longer available.');
            if ((state.players[1 - viewer].armed || []).some(cid => { const d = conditionOf(state, cid); return !d || d.visibility === 'face-down'; })) stop('A concealed condition may change this move. Its effect stays unknown until it is revealed.');
            const guarded = (list, why) => new Proxy(list, { get(target, key) {
                if (/^\d+$/.test(String(key))) stop(why);
                return Reflect.get(target, key);
            } });
            const visible = new Set(s.players.flatMap((P, p) => P.board.concat(P.discard, p === viewer ? P.hand : [],
                (P.armed || []).filter(cid => p === viewer || (conditionOf(s, cid) || {}).visibility === 'face-up'))));
            Object.keys(s.cards).forEach(cid => {
                if (!visible.has(cid)) { const c = s.cards[cid]; s.cards[cid] = { cid, kind: 'concealed', owner: c.owner, controller: c.controller }; }
            });
            s.players.forEach((P, p) => {
                P.deck = guarded(P.deck, 'A deck card is unknown until it is drawn or revealed.');
                if (p !== viewer) { P.hand = guarded(P.hand, 'The rival’s hand stays unknown.'); P.axHand = guarded(P.axHand, 'The rival’s rule hand stays unknown.'); }
            });
            s.axioms.deck = guarded(s.axioms.deck, 'The next shared-deck card stays unknown. Only the announced Fate flip is certain.');
            s.seed = 'preview-public'; s.step += 1;
            if (match.type !== 'choose') { s.reactionCount = 0; s.resolutionRoot = s.step; }
            resolveAction(G, match);
            if (s.phase === 'choose') stop('Another choice is needed. Its later result is not part of this clip.');
            complete = true;
        } catch (e) { reason = e && e.previewStop ? e.message : 'A later effect cannot be predicted safely. Its result stays unknown.'; }
        // Keep a distinct final frame, even when the event budget was exhausted by a long chain.
        if (frames.length === 7) frames.pop();
        frames.push({ text: complete ? 'Visible result of this move. Future rival decisions are not predicted.' : reason + ' Earlier steps show only what is already certain.', view: snapshot() });
        if (action && action.type === 'attack' && state.cards[action.cid] && isHero(action.target)) {
            // Hero attacks have no fight event; their public result is already in the event text.
            explanations.push(explainFighter(action.cid, action.target));
            const cap = rules(s).heroDamageCap;
            if (cap != null) explanations.push('The active rule limits each hero hit to ' + cap + ' damage.');
        }
        return { complete, reason, explanation: explanations.join(' '), frames, lines: ['Before the move.'].concat(explanations, lines, frames[frames.length - 1].text) };
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
        if (G.capture) G.capture(ev);
    }

    // The api handed to ability and tactic hooks.
    function recordRecovery(s, p, cid) {
        const old = s.players[p].recovered, cids = old && old.turn === s.turn ? old.cids : [];
        s.players[p].recovered = {turn:s.turn,cids:cids.includes(cid)?cids.slice():cids.concat(cid)};
    }
    function api(G) {
        const s = G.s;
        return {
            s, rng: G.rng, H, planning: !!s.aiPlanning,
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
            freezeNextTurn(cid) {
                const c = s.cards[cid];
                c.frozen = true;
                c.frozenUntil = Math.max(c.frozenUntil || 0, nextTurnEnd(G, c.controller));
            },
            bounce: cid => bounce(G, cid),
            fromDiscard(cid) {
                const p = s.cards[cid].owner, P = s.players[p];
                if (!removeFrom(P.discard, cid)) return false;
                const moved = toHand(G, p, cid);if (moved) recordRecovery(s, p, cid);return moved;
            },
            recoverBottom(cid) {
                const p = s.cards[cid].owner, P = s.players[p];
                if (!removeFrom(P.discard, cid)) return false;
                preparePlanningDeck(s, p);
                P.deck.push(cid);recordRecovery(s, p, cid);return true;
            },
            // The discard pile is public, so the card now on top is known to both players (#129, Last Save).
            recoverTop(cid) {
                const p = s.cards[cid].owner, P = s.players[p];
                if (!removeFrom(P.discard, cid)) return false;
                preparePlanningDeck(s, p);
                P.deck.unshift(cid);recordRecovery(s, p, cid);return true;
            },
            toHand: (p, cid, quiet) => toHand(G, p, cid, quiet),
            bottomHandCard(p, cid) {
                const P = s.players[p], other = s.players[1 - p];
                if (!P.hand.includes(cid)) return false;
                preparePlanningDeck(s, p); // the selected hand card remains known after the unknown part
                // The selected identity is private. Any previously seen hand card might be the
                // one that moved: keeping the others marked would disclose that private choice.
                const hidden = P.hand.slice();
                other.knows = other.knows.filter(id => !hidden.includes(id));
                if (other.sight) other.sight = other.sight.filter(id => !hidden.includes(id));
                removeFrom(P.hand, cid); P.deck.push(cid);
                return true;
            },
            handRoom: (p, n) => handRoom(s, p, n),
            buff(cid, attack, health, label, temp) { s.cards[cid].buffs.push({ label, attack: attack || 0, health: health || 0, temp: !!temp }); },
            // Until the end of its controller's next turn (#121, Scheduled Speech; see nextTurnEnd).
            buffNextTurn(cid, attack, health, label) { s.cards[cid].buffs.push({ label, attack: attack || 0, health: health || 0, temp: false, untilTurn: nextTurnEnd(G, s.cards[cid].controller) }); },
            // Until p's next turn starts (#148): a boost, or a keyword gained or lost. A gain the creature already
            // has, or a loss of one it doesn't have, changes nothing (→ false). Damage is never touched.
            buffUntilStart(cid, attack, health, label, p) { s.cards[cid].buffs.push({ label, attack: attack || 0, health: health || 0, temp: false, untilStart: nextTurnStart(G, p) }); },
            keywordUntilStart(cid, k, mode, p, label) {
                const c = s.cards[cid], has = hasKeyword(s, cid, k);
                if (mode === 'gain' ? has : !has) return false;
                c.timedKeywords = (c.timedKeywords || []).concat([{ k, mode, until: nextTurnStart(G, p), label: label || null }]);
                return true;
            },
            // Player p's soonest pending one-shot scheduled event (#148, Second Alarm), moved `spaces` later, but never
            // more than 4 spaces ahead of NOW (DELAY_MAX). Environmental events and repeatable spaces never move this
            // way. → the moved record's id, or null (nothing to move, or already as late as it can be).
            delayOwnEvent(p, spaces, label) {
                const pos = cursorOf(s);
                const ev = queueOf(s).filter(e => e.controller === p && !isEnv(e) && !e.repeat && e.state === 'pending' && e.space > pos)
                    .sort((a, b) => a.space - b.space || a.seq - b.seq)[0];
                if (!ev) return null;
                const to = Math.min(ev.space + (spaces || 1), pos + DELAY_MAX);
                if (to <= ev.space) return null;
                ev.space = to;
                emit(G, { t: 'fate-delay', id: ev.id, player: p, space: to, text: (label || 'A card') + ': ' + eventName(s, ev) + ' now happens in ' + roundsText(to - pos + (fateHeld(s) ? 1 : 0)) + '.' });
                return ev.id;
            },
            // p's next spell card costs `amount` more, until it is played or p's next turn ends (#148). A new tax
            // replaces an unpaid one (they never add up).
            spellTax(p, amount, label) { s.players[p].spellTax = { amount: amount || 1, until: nextTurnEnd(G, p), label: label || 'Spell tax' }; },
            // Extra energy for p's next turn start (#128); it is added once, then gone.
            energyNextTurn(p, n) { s.players[p].nextEnergy = (s.players[p].nextEnergy || 0) + (n || 0); },
            summon: (p, id) => summonToken(G, p, id),
            addKeyword(cid, k) { const c = s.cards[cid]; if (!c.extraKeywords.includes(k)) c.extraKeywords.push(k); if (k === 'shield') c.shieldUsed = false; if (c.lostKeywords) c.lostKeywords = c.lostKeywords.filter(x => x !== k); },
            shiftFate: n => shiftFate(G, n),
            leapFate: (n, by) => leapFate(G, n, by),
            setAxiom: (id, by) => setAxiom(G, id, by),
            clearCategory: (category, by) => clearCategory(G, category, by),
            changedCategories: () => changedAxioms(s).map(ax => ax.category),
            takeAxiom(id) { removeFrom(s.axioms.deck, id); },
            ask: req => ask(G, req),
            attack: cid => attackOf(s, cid),
            // Colour tactics (below).
            colourInPlay: (p, colour) => colourInPlay(s, p, colour),
            stripKeywords: (cid, list) => stripKeywords(s, cid, list),
            fullHeal(cid) { s.cards[cid].damage = 0; },
            setAttack: (cid, n, label) => setAttack(s, cid, n, label),
            setAttackUntilStart(cid, n, label, p) {
                // A displayed zero can hide negative modifiers. Offset their raw sum so a copy
                // really reaches n now; later modifiers still apply and survive this expiry.
                const raw = attackParts(s, cid).parts.reduce((sum, part) => sum + part.amount, 0);
                const delta = Math.max(0, n) - raw;
                if (delta) s.cards[cid].buffs.push({ label, attack: delta, health: 0, temp: false, untilStart: nextTurnStart(G, p) });
            },
            swapStats: cid => swapStats(s, cid),
            swapUntilStart: (cid, p, label) => swapStats(s, cid, { untilStart: nextTurnStart(G, p), label }),
            takeControl: (cid, p) => takeControl(G, cid, p),
        };
    }

    // Authored conditions use semantic facts, never translated log messages or animation callbacks.
    // Definitions: js/battle/conditional-cards.js (release conditional-1, two-lesson policy in Rift.Acquisition).
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
        const events = ['creature-played', 'spell-played', 'axiom-replaced', 'creature-defeated', 'attack-declared', 'fate-entered'];
        if (new Set(def.options.map(o => o.key)).size !== def.options.length || def.options.some(o => !o.key || !events.includes(o.event) || !['self', 'opponent', 'either'].includes(o.actor))) {
            throw new Error('Invalid authored conditional option.');
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
        if (c.nextPlayHealth) { c.buffs.push({label:'Second Chance',attack:0,health:c.nextPlayHealth,temp:false});delete c.nextPlayHealth; }
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
        c.bookmarkTurn = null; c.bookmarkPlayer = null; // a delayed Entrance is lost on a control change (#129)
        c.attacks = 0; c.activated = false; c.frozen = false; c.frozenUntil = null;
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
        // Timed gains of these keywords end too (#148); a new array, as below.
        if (c.timedKeywords) { const left = c.timedKeywords.filter(t => !(t.mode === 'gain' && list.includes(t.k))); c.timedKeywords = left.length ? left : null; }
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
    function swapStats(s, cid, expiry) {
        const c = s.cards[cid];
        const atk = attackOf(s, cid), hp = healthOf(s, cid).current;
        const short = b => b.temp || b.untilTurn != null || b.untilStart != null;   // this-turn and timed (#121, #148) boosts are not folded in
        const lasting = c.buffs.reduce((sum, b) => sum + (short(b) ? 0 : (b.attack || 0)), 0);
        const original = expiry && { attack: c.attack + lasting,
            health: c.health + c.buffs.reduce((sum, b) => sum + (short(b) ? 0 : (b.health || 0)), 0) };
        const extra = attackParts(s, cid).parts.reduce((sum, x) => sum + (x.source === 'base' ? 0 : x.amount), 0) - lasting;
        c.buffs = c.buffs.filter(short).map(b => Object.assign({}, b, { health: 0 }));
        c.attack = Math.max(0, hp - extra);
        c.health = Math.max(1, atk);
        c.damage = atk > 0 ? 0 : 1;
        // The same swap, expressed as an ordinary timed stat modifier over the folded lasting stats.
        // Expiry removes the modifier while preserving damage taken since the swap and any later boosts.
        if (expiry) {
            const attack = c.attack - original.attack, health = c.health - original.health;
            c.attack = original.attack; c.health = original.health;
            c.buffs.push({ label: expiry.label, attack, health, temp: false, untilStart: expiry.untilStart });
        }
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

    // Hypothetical draws have a known count, not known identities. Keep unknown cards unplayable
    // so Expert cannot plan a removal it has not drawn. Real states never acquire this flag/deck.
    function preparePlanningDeck(s, p) {
        const P = s.players[p];
        if (!s.aiPlanning || P.planningDeck) return;
        P.planningDeck = true;
        P.planningCreatureReserve = P.deck.filter(cid => s.cards[cid].kind === 'creature').length;
        P.deck = P.deck.map((_, i) => {
            const cid = 'planning-card-' + p + '-' + s.step + '-' + i;
            s.cards[cid] = { cid, kind: 'concealed', owner: p, controller: p };
            return cid;
        });
    }
    function draw(G, p, quiet) {
        const P = G.s.players[p];
        if (!P.deck.length || handCount(P) >= G.s.options.handLimit) return null;
        preparePlanningDeck(G.s, p);
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
        const publicCard = !!rules(s).publicAxioms;
        if (publicCard) (P.publicAxioms || (P.publicAxioms = [])).push(id);
        if (!quiet) emit(G, publicCard
            ? { t: 'draw-axiom', player: p, id, text: playerName(s, p) + ' takes the public rule card ' + axiomDefs()[id].name + '.' }
            : { t: 'draw-axiom', player: p, id, privateTo: p, text: 'You take the rule card ' + axiomDefs()[id].name + '.', publicText: playerName(s, p) + ' takes a rule card.' });
        return id;
    }

    function resetCard(c) {
        c.damage = 0; c.buffs = []; c.gained = []; c.extraKeywords = [];
        c.bookmarkTurn = null; c.bookmarkPlayer = null;
        c.enteredTurn = null; c.attacks = 0; c.activated = false; c.frozen = false; c.frozenUntil = null; c.silenced = false; c.shieldUsed = false;
        c.nickname = null; c.colourless = false; c.prediction = null; c.siuuu = 0; c.burned = false;
        if (c.lostKeywords) c.lostKeywords = null;
        if (c.timedKeywords) c.timedKeywords = null;
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
        endAtTurnStart(s);
        // Expiring health can defeat a creature. Finish those Last Words before healing, bonuses or drawing.
        cleanup(G);
        if (s.winner != null) return;
        P.capacity = Math.max(1, Math.min(s.options.energyCap, P.capacity + r.growth));   // growth may be 0 or −1
        P.energy = P.capacity + (P.consumables['extra-energy'] || 0) + (P.nextEnergy || 0);   // nextEnergy: an environmental event (#128)
        P.nextEnergy = 0;
        P.attacksThisTurn = 0;
        P.friendlySpellsThisTurn = 0;
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
        // Creature start effects follow existing rule bonuses in board order. Dead creatures cannot trigger.
        P.board.slice().forEach(cid => {
            if (!P.board.includes(cid) || healthOf(s, cid).current <= 0) return;
            eachAbility(s, s.cards[cid], def => { if (def.onTurnStart) def.onTurnStart(api(G), s.cards[cid]); });
        });
        if (r.healMost) {
            const target = P.board.slice().sort((a, b) => s.cards[b].damage - s.cards[a].damage || s.cards[a].enteredTurn - s.cards[b].enteredTurn)[0];
            if (target && s.cards[target].damage > 0) {
                const n = Math.min(r.healMost, s.cards[target].damage);s.cards[target].damage -= n;
                emit(G, { t: 'heal', cid: target, amount: n, text: 'Fair Rest: ' + logName(s, target) + ' heals ' + n + '.' });
            }
        }
    }

    // Boosts and keywords that last "until a player's next turn starts" (#148) end as that turn starts. Damage
    // stays; health that depended on a boost can then be lost (as with every other boost that ends).
    function endAtTurnStart(s) {
        Object.values(s.cards).forEach(c => {
            if (c.kind !== 'creature') return;
            if (c.buffs.some(b => b.untilStart != null && b.untilStart <= s.turn)) c.buffs = c.buffs.filter(b => !(b.untilStart != null && b.untilStart <= s.turn));
            if (c.timedKeywords && c.timedKeywords.some(t => t.until <= s.turn)) {
                const left = c.timedKeywords.filter(t => t.until > s.turn);   // a new array: cloneState copies cards shallowly
                c.timedKeywords = left.length ? left : null;
            }
        });
    }
    // The turn whose start ends an effect that lasts "until p's next turn starts". Between turns (a round's
    // end) the turn about to start is p's next one if it is p's; during a turn, p's next turn after this one.
    function nextTurnStart(G, p) {
        const s = G.s;
        if (G.roundEnd) return p === s.active ? s.turn : s.turn + 1;
        return p === s.active ? s.turn + 2 : s.turn + 1;
    }

    // Bonus rules (one at a time), checked when a turn starts:
    //   fresh-start  an empty hand draws 2 cards
    //   fair-share   fewer creatures in play than the opponent: draw 1 card
    //   momentum     more creatures in play than the opponent: +1 card activation this turn
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
            emit(G, { t: 'bonus', player: p, text: 'Momentum: more creatures in play, so +1 card activation this turn.' });
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
        // This turn's boosts end, and so do boosts that last until this turn ends (#121, untilTurn).
        const ends = b => b.temp || (b.untilTurn != null && b.untilTurn <= s.turn);
        Object.values(s.cards).forEach(c => { if (c.kind === 'creature' && c.buffs.some(ends)) c.buffs = c.buffs.filter(b => !ends(b)); });
        P.board.forEach(cid => {
            const c = s.cards[cid];
            if (c.frozenUntil == null || c.frozenUntil <= s.turn) { c.frozen = false; c.frozenUntil = null; }
        });
        // A spell tax (#148) that was never paid ends with the turn it lasts until.
        s.players.forEach((Q, q) => { if (Q.spellTax && Q.spellTax.until <= s.turn) {
            emit(G, { t: 'tax-end', player: q, text: Q.spellTax.label + ' ends: ' + possessive(s, q) + ' spells cost the usual again.' }); Q.spellTax = null; } });
        endRules(G, p);
        cleanup(G);
        const goal = s.winner == null && goalProgress(s,p);
        if(goal&&goal.complete){emit(G,{t:'goal',player:p,id:goal.id,text:playerName(s,p)+' completes '+goal.name+' at their own turn end.'});setWinner(G,p,'goal:'+goal.id);}
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
            G.roundEnd = true;   // between turns: see nextTurnEnd and summonToken (#121)
            shiftFate(G, 1);
            G.roundEnd = false;
        }
        if (s.winner == null) expireScheduled(G);
    }

    function endRules(G, p) {
        const s = G.s, P = s.players[p], r = rules(s);
        if (r.bonus === 'think') {
            const n = Math.min(2, playsLeft(s, p));
            if (n > 0) {
                emit(G, { t: 'bonus', player: p, text: 'Think It Over: ' + n + ' unused activation' + (n === 1 ? '' : 's') + ', so ' + says(s, p, 'draws').replace(/^You/, 'you') + ' ' + n + ' card' + (n === 1 ? '' : 's') + '.' });
                for (let i = 0; i < n; i++) draw(G, p);
            }
        }
        if (r.handCap != null && handCount(P) > r.handCap) {
            let extra = handCount(P) - r.handCap;
            const gone = [];
            while (extra > 0 && P.hand.length) { const cid = P.hand.shift(); s.cards[cid].burned = true; P.discard.push(cid); gone.push(cardName(s, cid)); extra--; }
            while (extra > 0 && P.axHand.length) {
                const id = P.axHand.shift();
                removeFrom(P.publicAxioms || [], id);
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

    // A leap (#120, Leap Ahead) moves the cursor forward without walking: it enters only the space it
    // lands on. A live one-shot event on a space it jumps over is skipped for good (a later rewind never
    // brings it back). A repeatable space it jumps over was not entered, so it neither fires nor ends. A
    // leap never jumps over Fate's rule event: if that lies inside the leap, the leap lands on it, and the
    // rule event resolves after the scheduled events there. by: the player who leaps.
    function leapFate(G, spaces, by) {
        const s = G.s;
        if (!s.options.timeline || !(spaces > 0)) return;
        const from = cursorOf(s), n = Math.min(spaces, Math.max(1, s.fate.until)), to = from + n;
        const passed = queueOf(s).filter(ev => ev.space > from && ev.space < to && isLive(ev)).sort((a, b) => a.space - b.space || a.seq - b.seq);
        const skipped = passed.filter(ev => !ev.repeat);
        skipped.forEach(ev => { ev.state = 'skipped'; ev.reason = 'leap'; });
        s.fate.pos = to;
        s.fate.until = Math.max(0, s.fate.until - n);
        emit(G, { t: 'fate-leap', player: by, from, to, spaces: n, skipped: skipped.map(ev => ev.id), passed: passed.filter(ev => ev.repeat).map(ev => ev.id),
            text: 'Fate leaps ' + roundsText(n) + ' closer.' + (n < spaces ? ' It stops at Fate\'s own event: a leap never jumps over a new rule or reset.' : '') });
        skipped.forEach(ev => emit(G, { t: 'fate-skip', id: ev.id, def: ev.def, player: ev.controller, env: isEnv(ev), by,
            text: capFirst(eventName(s, ev)) + ' is skipped. It will not happen.' }));
        // A skipped environmental occurrence stays skipped; a recurring one puts its next occurrence on (#128).
        skipped.filter(isEnv).forEach(ev => recurEnvironment(G, ev));
        G.fateBy = by == null ? null : by;
        enterSpace(G, to, 'leap');
        G.fateBy = undefined;
        if (s.winner == null && !s.fate.until) ruleEvent(G);
    }

    // Fate's own event (a free flip or a reset) on the space the cursor has just entered. It resolves
    // after the scheduled events on that space (#118), so they resolve under the rules they were forecast with.
    function ruleEvent(G) {
        const s = G.s;
        if (s.fate.events % 2 === 1) {
            s.axioms.discard.push(...Object.values(s.axioms.active));
            s.axioms.active = {};
            s.axioms.numeric = {};
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
        const preview = axiomPreview(s, id), changed = preview.changed;
        if (!changed) {
            if (!ax.own) A.discard.push(id);
            emit(G, { t: 'axiom-no-change', id, player: by, text: ax.name + ': ' + preview.reason });
            return;
        }
        const projected = projectedAxioms(s, id, preview);
        if (ax.clearRules) {
            A.discard.push(...Object.values(A.active));
        } else {
            const old = A.active[ax.category];
            if (old) A.discard.push(old);
        }
        A.active = projected.active;
        A.numeric = projected.numeric;
        A.flips += 1;
        emit(G, ax.clearRules
            ? { t: 'axiom', id, player: by, clear: true, text: 'Rule change — ' + ax.name + ': every rule goes back to the basics.' }
            : { t: 'axiom', id, player: by, basic: !!ax.basic, text: 'Rule change — ' + ax.category + ': ' + ax.name + '. ' + (preview.text || ax.text) });
        if (by != null) {
            [0, 1].forEach(p => s.players[p].board.slice().forEach(cid => {
                const c = s.cards[cid];
                eachAbility(s, c, def => { if (def.onAxiomPlayed) def.onAxiomPlayed(api(G), c, id, by); });
            }));
        }
        if (changed) s.completedPlays.push({ event: 'axiom-replaced', actor: by == null ? null : by, axiom: id });
    }

    // A spell can reset one category without playing an Axiom or touching announced events.
    function clearCategory(G, category, by) {
        const A = G.s.axioms, old = A.active[category];
        if (!old) return false;
        A.discard.push(old);delete A.active[category];if (A.numeric) delete A.numeric[category];
        A.flips += 1;
        emit(G, { t: 'axiom', id: old, player: by, basic: true, categoryReset: category, text: 'Rule change — ' + category + ': back to basics.' });
        G.s.completedPlays.push({ event: 'axiom-replaced', actor: by == null ? null : by, axiom: old, clear: true });
        return true;
    }

    // ---- scheduled Fate events (#118; design/drafts/card-arena-2026-10-12/FATE-SCHEDULE-MODEL.md) ----
    // A tactic with a `scheduled` block (data/tactics.js) puts a public event on the Fate track, `delay`
    // spaces ahead of the cursor. s.fate.queue holds plain records (never functions):
    //   { id: 'f<seq>', seq, def, source: { type: 'tactic', cid, card }, controller, space, createdRound,
    //     createdTurn, repeat, lifetime, expiresRound, state, fires, firedRound, reason, target }
    // state: 'pending' → 'fired' when the cursor enters its space (claimed before its effect runs, so it
    // can never fire twice); one-shot records stay fired for good, whichever way the cursor comes back.
    // A marked repeatable record (repeat) stays live after firing and fires on every later entry until
    // it expires: lifetime counts real round ends (expiresRound), never spaces. Boosts it gives are tagged
    // with its id (buff.fate) and end together when it expires (#120). 'skipped': a leap jumped over a
    // pending one-shot (leapFate). 'cancelled' is reserved for later cards. Events on one space resolve in
    // seq order, then Fate's own rule event. A battle that is over freezes the schedule.
    const SCHEDULE_LIMIT = 2;   // live scheduled events per player (like the two conditional slots); Open Calendar +1
    const DELAY_MAX = 4;        // Patient Plans moves a spell later, but never beyond 4 spaces ahead (#121)
    const cursorOf = s => s.fate.pos || 0;          // an older state has no cursor: space 0
    const queueOf = s => s.fate.queue || [];
    const isLive = ev => ev.state === 'pending' || (ev.state === 'fired' && !!ev.repeat);
    function scheduledDef(ev) {
        if (!ev || !ev.source) return null;
        if (ev.source.type === 'environment') return envDefs()[ev.def] || null;
        if (ev.source.type !== 'tactic') return null;
        return (tacticDefs()[ev.def] || {}).scheduled || null;
    }
    const isEnv = ev => !!(ev && ev.source && ev.source.type === 'environment');
    // The event's printed name: a tactic's, or an environmental event's (#128).
    const eventTitle = ev => (isEnv(ev) ? (envDefs()[ev.def] || {}).name : (tacticDefs()[ev.def] || {}).name) || ev.def;
    // The side an event is about: its controller, or the side an environmental event favours (null: both).
    const eventSide = ev => (ev.controller != null ? ev.controller : ev.side != null ? ev.side : null);
    function liveScheduled(s, p) { return queueOf(s).filter(ev => ev.controller === p && isLive(ev)).length; }
    // Fate timing Axioms (#121) are read when a spell is played. Events already on the track never move
    // because one changes, and a lower limit never cancels events already waiting.
    function scheduleLimit(s) { return SCHEDULE_LIMIT + (rules(s).scheduleExtra || 0); }
    function canSchedule(s, p) { return !!s.options.timeline && liveScheduled(s, p) < scheduleLimit(s); }
    function scheduleDelay(s, id) {
        const sch = (tacticDefs()[id] || {}).scheduled;
        if (!sch) return null;
        const printed = Math.max(1, sch.delay || 1), shift = rules(s).fateDelay || 0;
        return Math.max(rules(s).fateMinDelay || 1, Math.min(Math.max(DELAY_MAX, printed), printed + shift));
    }
    const lowerFirst = t => (t ? t[0].toLowerCase() + t.slice(1) : t);
    const roundsText = n => n + ' round' + (n === 1 ? '' : 's');
    // "your Clean Slate" / "Anna's Clean Slate" / "the Drill Whistle" (an environmental event, #128).
    const eventName = (s, ev) => (ev.controller == null ? 'the' : possessive(s, ev.controller)) + ' ' + eventTitle(ev);
    // Its one-sentence effect, mid-sentence ("every creature…", "your creatures…", "Anna's creatures…").
    // A summary function names the controller's side itself, so it is never lower-cased. ctx: { who ('you' /
    // 'Anna' / 'the'), target (the name of the target fixed when it was played, or null) }. An environmental
    // event (#128) names the side it favours the same way.
    function summaryOf(s, ev, sch) {
        if (!sch) return 'nothing happens.';
        if (typeof sch.summary !== 'function') return lowerFirst(sch.summary || '');
        const p = eventSide(ev);
        return sch.summary(p == null ? 'the' : possessive(s, p), { who: p == null ? 'the' : s.players[p].name === 'You' ? 'you' : s.players[p].name,
            target: ev.target && s.cards[ev.target] ? cardName(s, ev.target) : null });
    }

    // A fate-delay Axiom (#121) moves the new event's space once, now; a card with pick fixes its target now.
    function scheduleEvent(G, p, cid, def) {
        const s = G.s, sch = def.scheduled, printed = Math.max(1, sch.delay || 1), delay = scheduleDelay(s, def.id);
        const seq = (s.fate.seq || 0) + 1;
        const lifetime = sch.repeat && sch.lifetime ? sch.lifetime : null;
        const ev = { id: 'f' + seq, seq, def: def.id, source: { type: 'tactic', cid, card: def.id }, controller: p,
            space: cursorOf(s) + delay, createdRound: s.round, createdTurn: s.turn, repeat: !!sch.repeat,
            lifetime, expiresRound: lifetime ? s.round + lifetime - 1 : null,
            state: 'pending', fires: 0, firedRound: null, reason: null, target: sch.pick ? sch.pick(s, p, H) || null : null };
        s.fate.seq = seq;
        s.fate.queue = queueOf(s).concat([ev]);
        const rounds = delay + (fateHeld(s) ? 1 : 0);
        const by = delay !== printed ? activeAxioms(s).find(a => a.category === 'fate-delay') : null;
        emit(G, { t: 'fate-schedule', player: p, id: ev.id, cid, def: def.id, space: ev.space, rounds, printed, delay,
            text: says(s, p, 'schedules') + ' ' + def.name + ' on the Fate track. In ' + roundsText(rounds) + ': ' + summaryOf(s, ev, sch)
                + (by ? ' ' + by.name + ' moved it ' + roundsText(Math.abs(delay - printed)) + (delay > printed ? ' later.' : ' sooner.') : '') });
    }
    // ---- environmental events (#128; design/drafts/card-arena-2026-10-12/ENVIRONMENTAL-FATE.md) ----
    // An encounter brings plans (createBattle's `environment`): { def, first, every?, times?, side? }. They are
    // kept in s.fate.env, never changed. Each plan puts ONE occurrence on the track at a time: a one-shot
    // record with source { type: 'environment', card: def }, controller null (so it uses nobody's limit and
    // no player owns it), side (the player it favours, or null), plan (its index) and occurrence (1, 2, …).
    // When an occurrence fires, or a leap skips it, a recurring plan puts its NEXT occurrence `every` spaces
    // further on (a new record with its own id): a skipped occurrence never comes back, and rewinding only
    // moves the next one further away. Its effect is fixed now and public; nothing is rolled when it happens.
    function setupEnvironment(G, plans) {
        const s = G.s;
        if (!s.options.timeline || !plans || !plans.length) return;
        s.fate.env = plans.filter(pl => pl && envDefs()[pl.def]).map(pl => ({
            def: pl.def, first: Math.max(1, pl.first || 1), every: pl.every > 0 ? pl.every : null,
            times: pl.times > 0 ? pl.times : null, side: pl.side === 0 || pl.side === 1 ? pl.side : null,
        }));
        s.fate.env.forEach((pl, i) => scheduleEnvironment(G, i, 1, pl.first));
    }
    function scheduleEnvironment(G, plan, occurrence, space) {
        const s = G.s, pl = s.fate.env[plan], def = envDefs()[pl.def];
        const seq = (s.fate.seq || 0) + 1;
        const ev = { id: 'f' + seq, seq, def: pl.def, source: { type: 'environment', card: pl.def }, controller: null, side: pl.side,
            plan, occurrence, space, createdRound: s.round, createdTurn: s.turn, repeat: false, lifetime: null, expiresRound: null,
            state: 'pending', fires: 0, firedRound: null, reason: null, target: null };
        s.fate.seq = seq;
        s.fate.queue = queueOf(s).concat([ev]);
        const rounds = space - cursorOf(s) + (fateHeld(s) ? 1 : 0);
        emit(G, { t: 'fate-schedule', player: null, env: true, id: ev.id, def: pl.def, space, rounds, occurrence,
            text: (occurrence > 1 ? 'It comes back: ' : 'Environmental: ') + def.source + '\'s ' + def.name + ' in ' + roundsText(rounds) + ': ' + summaryOf(s, ev, def) });
    }
    // The occurrence after `ev` (fired or skipped), if its plan recurs: `every` spaces on, and always ahead of NOW.
    function recurEnvironment(G, ev) {
        const s = G.s, pl = isEnv(ev) && (s.fate.env || [])[ev.plan];
        if (!pl || !pl.every || (pl.times && ev.occurrence >= pl.times) || s.winner != null) return;
        let space = ev.space + pl.every;
        while (space <= cursorOf(s)) space += pl.every;
        scheduleEnvironment(G, ev.plan, ev.occurrence + 1, space);
    }

    // Gentle Consequences (#121): while one scheduled effect resolves (its own effect and the defeats it
    // causes), each hero loses at most rules.fateHeroCap hearts. damageHero reads G.fateCap.
    function withFateCap(G, fn) {
        const s = G.s, cap = rules(s).fateHeroCap, was = G.fateCap;
        G.fateCap = cap == null ? null : { cap, dealt: [0, 0], name: (activeAxioms(s).find(a => a.rules && a.rules.fateHeroCap != null) || { name: 'Fate rule' }).name };
        try { fn(); } finally { G.fateCap = was; }
    }
    // A token (#121): a plain generated creature for player p, if p's side has room (reserved condition
    // spaces count). It is not a collected card: it never goes to a hand, deck or discard pile, and leaves the
    // game when it leaves play. It can act on its controller's next turn: a token that arrives between turns
    // (at a round's end) is ready for the turn that starts next if that turn is its controller's.
    function summonToken(G, p, id) {
        const s = G.s;
        if (!(Rift.data.tokens || {})[id] || boardOccupancy(s, p) >= s.options.boardLimit) return null;
        s.tokenSeq = (s.tokenSeq || 0) + 1;
        const cid = 'p' + p + 'k' + s.tokenSeq;
        const c = makeCreature(cid, { uid: 'token-' + cid, species: id }, p);
        c.token = true;
        c.enteredTurn = G.roundEnd && p === s.active ? s.turn - 1 : s.turn;
        s.cards[cid] = c;
        s.players[p].board.push(cid);
        emit(G, { t: 'summon', player: p, cid, token: id, text: 'A ' + c.attack + '/' + c.health + ' ' + cardName(s, cid) + ' token joins ' + possessive(s, p) + ' side.' });
        return cid;
    }
    // The same token added to a copy of the state, for the AI's rough look-ahead only (H.projectToken).
    function projectToken(s, p, id) {
        if (!(Rift.data.tokens || {})[id] || boardOccupancy(s, p) >= s.options.boardLimit) return s;
        const cid = 'p' + p + 'k' + ((s.tokenSeq || 0) + 1);
        const c = makeCreature(cid, { uid: 'token-' + cid, species: id }, p);
        c.token = true;
        c.enteredTurn = s.turn;
        const players = s.players.slice();
        players[p] = Object.assign({}, s.players[p], { board: s.players[p].board.concat([cid]) });
        return Object.assign({}, s, { players, cards: Object.assign({}, s.cards, { [cid]: c }), tokenSeq: (s.tokenSeq || 0) + 1 });
    }
    // The turn at whose end a "until its controller's next turn ends" boost stops (#121). Between turns (a
    // round's end) the turn about to start is the next one; during a turn, the controller's following turn.
    function nextTurnEnd(G, p) {
        const s = G.s;
        if (G.roundEnd) return p === s.active ? s.turn : s.turn + 1;
        return p === s.active ? s.turn + 2 : s.turn + 1;
    }

    // The cursor has entered this space: its live scheduled events fire, oldest first.
    // A semantic fact for conditional cards (#148): { event: 'fate-entered', actor, space, how }. actor: the
    // player who moved Fate (a card, ability, draw or leap), or null for the ordinary advance at a round's end.
    // Reactions queue and resolve after the whole Fate movement (FATE-SCHEDULE-MODEL.md section 4, rule 7).
    function enterSpace(G, space, how) {
        const s = G.s;
        const due = queueOf(s).filter(ev => ev.space === space && isLive(ev)).sort((a, b) => a.seq - b.seq).map(ev => ev.id);
        for (const id of due) {
            if (s.winner != null) return;
            fireScheduled(G, id, how);
        }
        if (s.winner == null) s.completedPlays.push({ event: 'fate-entered', actor: G.fateBy !== undefined ? G.fateBy : G.roundEnd ? null : s.active, space, how });
    }
    function fireScheduled(G, id, how) {
        const s = G.s, ev = queueOf(s).find(e => e.id === id);
        if (!ev || !isLive(ev)) return;
        ev.state = 'fired';   // claimed before the effect
        ev.fires = (ev.fires || 0) + 1;
        if (ev.firedRound == null) ev.firedRound = s.round;
        const def = scheduledDef(ev);
        emit(G, { t: 'fate-event', id, def: ev.def, cid: ev.source && ev.source.cid, player: ev.controller, how, fires: ev.fires,
            text: 'Fate reaches ' + eventName(s, ev) + (ev.fires > 1 ? ' again' : '') + ': ' + summaryOf(s, ev, def) });
        const A = api(G);
        // A repeatable space's boosts carry its id, so they all end when it expires (#120).
        if (ev.repeat) A.buff = (cid, attack, health, label, temp) => { s.cards[cid].buffs.push({ label, attack: attack || 0, health: health || 0, temp: !!temp, fate: ev.id }); };
        withFateCap(G, () => {
            if (def && def.resolve) def.resolve(A, ev, H);
            cleanup(G);
        });
        recurEnvironment(G, ev);
    }
    // After a round's end (the Fate move or the Anchor's hold): live records whose lifetime is used up
    // expire, and every boost they gave ends (health that depended on one can then be lost).
    function expireScheduled(G) {
        const s = G.s;
        queueOf(s).forEach(ev => {
            if (!isLive(ev) || ev.expiresRound == null || s.round < ev.expiresRound) return;
            ev.state = 'expired';
            ev.reason = 'lifetime';
            const def = scheduledDef(ev);
            const boosted = Object.keys(s.cards).filter(cid => s.cards[cid].kind === 'creature' && s.cards[cid].buffs.some(b => b.fate === ev.id));
            emit(G, { t: 'fate-expire', id: ev.id, def: ev.def, player: ev.controller, boosted,
                text: capFirst(eventName(s, ev)) + ' expires after ' + roundsText(ev.lifetime) + '.' + (boosted.length ? ' Its boosts end.' : '') });
            boosted.forEach(cid => { s.cards[cid].buffs = s.cards[cid].buffs.filter(b => b.fate !== ev.id); });
            if (def && def.expire) withFateCap(G, () => def.expire(api(G), ev, H));
        });
        cleanup(G);
    }

    // The public schedule, one entry per record (oldest first), for the reel, previews and the AI:
    //   { id, seq, def, name, summary, idle, text, cid, controller, state, live, repeat, spaces (from the cursor),
    //     rounds / turns / turn / round / after / held (as in timeline; null when it is not coming),
    //     createdRound, expiresRound, lifetime, fires, firedRound, reason, target, targetName (#121: the target
    //     fixed when it was played, e.g. Remember This's creature, or null),
    //     env (#128: an environmental event of this encounter), source (its source's name), art, side (the
    //     player it favours, or null), occurrence, every (it recurs every n rounds, or null), times }
    function fateSchedule(s) {
        if (!s.options.timeline) return [];
        const hold = fateHeld(s) ? 1 : 0, half = s.roundTurns[1 - s.active] ? 1 : 0, after = roundCloser(s), pos = cursorOf(s);
        return queueOf(s).map(ev => {
            const env = isEnv(ev), def = scheduledDef(ev) || {}, card = env ? def : tacticDefs()[ev.def] || {};
            const plan = env ? (s.fate.env || [])[ev.plan] || {} : {};
            const spaces = ev.space - pos, live = isLive(ev);
            const rounds = live && spaces > 0 ? spaces + hold : null, turns = rounds == null ? null : 2 * rounds - half;
            return {
                env, source: env ? def.source || '' : null, art: env ? def.art || null : null, side: env ? ev.side : null,
                occurrence: env ? ev.occurrence : null, every: env ? plan.every || null : null, times: env ? plan.times || null : null,
                id: ev.id, seq: ev.seq, def: ev.def, name: card.name || ev.def, summary: def.summary ? capFirst(summaryOf(s, ev, def)) : '', idle: def.idle || '', text: card.text || '',
                cid: ev.source ? ev.source.cid || null : null, controller: ev.controller, state: ev.state, live, repeat: !!ev.repeat, spaces,
                rounds, turns, turn: turns == null ? null : s.turn + turns, round: rounds == null ? null : s.round + rounds, after, held: !!hold,
                createdRound: ev.createdRound, expiresRound: ev.expiresRound, lifetime: ev.lifetime, fires: ev.fires || 0, firedRound: ev.firedRound, reason: ev.reason,
                target: ev.target || null, targetName: ev.target && s.cards[ev.target] ? cardName(s, ev.target) : null,
            };
        });
    }
    // What a live scheduled event would do if it resolved NOW: the real resolution, run on a copy of the
    // state (nothing is changed), so the preview and the resolution cannot disagree. null when not live.
    //   { id, defeated: [{ cid, name, owner, controller, dest }], boosted: [{ cid, name, controller, attack,
    //     health }] (creatures still in play whose numbers it changes), hearts: [h0, h1], winner, events,
    //     summoned: [{ cid, name, controller }] (tokens, #121), returned: [{ cid, name, player }] (discard pile
    //     to hand), drawn: [n0, n1] (only how many: a preview never names a hidden card) }
    // events are public only: a private event (a draw) keeps only what everyone may see.
    function fateEventPreview(state, id) {
        const ev = queueOf(state).find(e => e.id === id);
        if (!ev || !isLive(ev) || state.winner != null) return null;
        const s = cloneState(state);
        const G = { s, rng: Rift.makeRng('battle:' + s.seed + ':preview:' + id), events: [] };
        fireScheduled(G, id, 'preview');
        return Object.assign({ id }, previewOutcome(state, G));
    }
    function previewOutcome(state, G) {
        const s = G.s;
        const boosted = [], healed = [], frozen = [];
        [0, 1].forEach(p => s.players[p].board.forEach(cid => {
            if (!state.players[p].board.includes(cid)) return;
            const attack = attackOf(s, cid) - attackOf(state, cid), health = healthOf(s, cid).max - healthOf(state, cid).max;
            if (attack || health) boosted.push({ cid, name: logName(state, cid), controller: p, attack, health });
            const restored = state.cards[cid].damage - s.cards[cid].damage;
            if (restored > 0) healed.push({ cid, name: logName(state, cid), controller: p, amount: restored });
            if (s.cards[cid].frozen && (!state.cards[cid].frozen || (s.cards[cid].frozenUntil || 0) > (state.cards[cid].frozenUntil || 0))) frozen.push({ cid, name: logName(state, cid), controller: p });
        }));
        const summoned = [], returned = [];
        [0, 1].forEach(p => {
            s.players[p].board.forEach(cid => { if (!state.cards[cid]) summoned.push({ cid, name: cardName(s, cid), controller: p }); });
            s.players[p].hand.forEach(cid => { if (state.players[p].discard.includes(cid)) returned.push({ cid, name: cardName(state, cid), player: p }); });
        });
        const drawn = [0, 1].map(p => s.players[p].hand.filter(cid => state.players[p].deck.includes(cid)).length);
        return {
            // A token made and defeated inside the preview is only in the copy (#121).
            defeated: G.events.filter(e => e.t === 'defeated').map(e => ({ cid: e.cid, name: state.cards[e.cid] ? logName(state, e.cid) : s.cards[e.cid] ? cardName(s, e.cid) : e.cid,
                owner: e.player, controller: state.cards[e.cid] ? state.cards[e.cid].controller : e.player, dest: e.dest })),
            boosted, healed, frozen, summoned, returned, drawn, hearts: s.players.map(P => P.hearts), winner: s.winner,
            events: G.events.map(e => (e.privateTo == null ? e : { t: e.t, player: e.player, turn: e.turn, round: e.round, text: e.publicText || '' })),
        };
    }
    // What a leap of `spaces` by player p would do NOW (#120), run on a copy like fateEventPreview:
    //   { spaces (the leap actually made), from, to, skipped: [ids], passed: [ids], fired: [ids], rule (it
    //     lands on Fate's own event), defeated, boosted, hearts, winner, events }. null without a Fate track.
    function fateLeapPreview(state, spaces, p) {
        if (!state.options.timeline || state.winner != null) return null;
        const s = cloneState(state);
        const G = { s, rng: Rift.makeRng('battle:' + s.seed + ':preview:leap'), events: [] };
        leapFate(G, spaces, p);
        const leap = G.events.find(e => e.t === 'fate-leap');
        if (!leap) return null;
        return Object.assign({ spaces: leap.spaces, from: leap.from, to: leap.to, skipped: leap.skipped, passed: leap.passed,
            fired: G.events.filter(e => e.t === 'fate-event').map(e => e.id), rule: leap.spaces >= state.fate.until },
        previewOutcome(state, G));
    }

    // ---- main-phase moves ---------------------------------------------------------------------

    function spend(G, amount) { G.s.players[G.s.active].energy -= amount; }

    function doPlay(G, cid, target) {
        const s = G.s, p = s.active, P = s.players[p], c = s.cards[cid];
        const paidCost = playCost(s, cid, target);
        const spellTax = spellTaxOn(s, cid);
        spend(G, paidCost);
        if (P.tax > 0) P.tax -= 1;
        if (spellTax) { emit(G, { t: 'tax-paid', player: p, text: says(s, p, 'pays') + ' ' + spellTax + ' more for that spell: ' + P.spellTax.label + ' is used up.' }); P.spellTax = null; }
        removeFrom(P.hand, cid);
        s.players[1 - p].knows = s.players[1 - p].knows.filter(k => k !== cid);
        if (conditionOf(s, cid) && !c.conditionSpent) { arm(G, cid); afterMove(G); return; }
        if (c.kind === 'tactic') {
            const def = tacticDefs()[c.tactic];
            if (target && P.board.includes(target)) P.friendlySpellsThisTurn = (P.friendlySpellsThisTurn || 0) + 1;
            P.discard.push(cid);
            emit(G, { t: 'tactic-play', player: p, cid, id: c.tactic, target, text: says(s, p, 'plays') + ' the tactic ' + def.name + (target ? ' on ' + logName(s, target) : '') + '.' });
            if (def.scheduled) scheduleEvent(G, p, cid, def);
            def.run(api(G), p, target, cid);
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
        removeFrom(P.publicAxioms || [], id);
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
        if (G.preview) throw { previewStop: true, message: 'Another choice is needed. Its later result stays unknown.' };
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
        const shield = fightShield(s, att, pa, pb);
        const ax = combatAxiom(s);
        const res = ax && ax.resolveFight ? ax.resolveFight(pa, pb) : { toAttacker: pb, toDefender: pa };
        emit(G, { t: 'fight', attacker: att, defender: def, pa, pb, text: logName(s, att) + ' (' + pa + ' attack) fights ' + logName(s, def) + ' (' + pb + ' attack)' + (combatAxiom(s) && !combatAxiom(s).basic ? ' under ' + combatAxiom(s).name : '') + '.' });
        dealDamage(G, def, res.toDefender, att);
        if (shield && res.toAttacker > 0) emit(G, { t: 'shield', cid: att, text: logName(s, att) + '\'s Shield blocks the damage for this fight.' });
        else dealDamage(G, att, res.toAttacker, def);
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
        [[att, aLive, def, healthOf(s, att).current], [def, dLive, att, healthOf(s, def).current]].forEach(([cid, alive, foe, survivedHealth]) => {
            if (!alive) return;
            const c = s.cards[cid];
            eachAbility(s, c, d => { if (d.onSurvive) d.onSurvive(api(G), c, foe); });
            s.players[c.controller].board.slice().forEach(other => {
                if (other === cid || healthOf(s, other).current <= 0) return;
                eachAbility(s, s.cards[other], d => { if (d.onAllySurvive) d.onAllySurvive(api(G), s.cards[other], cid, survivedHealth); });
            });
        });
    }

    function damageAfterPrevention(s, cid, amount) {
        if (amount <= 0 || hasKeyword(s, cid, 'shield')) return 0;
        let reduction = 0;
        eachAbility(s, s.cards[cid], def => { reduction += def.damageReduction || 0; });
        return Math.max(0, amount - reduction);
    }
    function dealDamage(G, cid, amount, source) {
        const s = G.s, c = s.cards[cid];
        if (!c || amount <= 0 || !s.players[c.controller].board.includes(cid)) return 0;
        if (hasKeyword(s, cid, 'shield')) {
            // A timed Shield (#148) is used up first; the creature's own Shield, if any, stays.
            const temp = (c.timedKeywords || []).find(t => t.mode === 'gain' && t.k === 'shield');
            if (temp) {
                const left = c.timedKeywords.filter(t => t !== temp);
                c.timedKeywords = left.length ? left : null;
                emit(G, { t: 'shield', cid, text: logName(s, cid) + '\'s Shield blocks the damage.' });
                return 0;
            }
            c.shieldUsed = true;
            c.extraKeywords = c.extraKeywords.filter(k => k !== 'shield');
            emit(G, { t: 'shield', cid, text: logName(s, cid) + '\'s Shield blocks the damage.' });
            return 0;
        }
        const dealt = damageAfterPrevention(s, cid, amount);
        if (!dealt) return 0;
        c.damage += dealt;
        emit(G, { t: 'damage', cid, amount: dealt, source, text: logName(s, cid) + ' takes ' + dealt + ' damage.' });
        if (healthOf(s, cid).current > 0) eachAbility(s, c, d => { if (d.onDamaged) d.onDamaged(api(G), c, dealt); });
        return dealt;
    }

    function damageHero(G, p, amount, source) {
        const s = G.s, P = s.players[p];
        // Gentle Consequences (#121): one resolving scheduled effect takes at most cap hearts from each hero.
        const cap = G.fateCap;
        if (cap && amount > 0) {
            const room = Math.max(0, cap.cap - cap.dealt[p]);
            if (amount > room) emit(G, { t: 'axiom-effect', player: p, text: cap.name + ': a spell from the Fate track takes at most ' + cap.cap + ' heart' + (cap.cap === 1 ? '' : 's') + ' from ' + possessive(s, p) + ' hero.' });
            amount = Math.min(amount, room);
            cap.dealt[p] += amount;
        }
        if (amount <= 0) return 0;
        const before = P.hearts;P.hearts = Math.max(0, P.hearts - amount);
        emit(G, { t: 'hit', player: p, amount, cid: source || null, text: says(s, p, 'loses') + ' ' + amount + ' heart' + (amount === 1 ? '' : 's') + ' (' + P.hearts + ' left).' });
        if (P.hearts < before) P.board.slice().forEach(cid => { if (healthOf(s,cid).current > 0) eachAbility(s,s.cards[cid],d=>{if(d.onHeroLoss)d.onHeroLoss(api(G),s.cards[cid],before-P.hearts);}); });
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
        // A token (#121) never goes to a hand or a discard pile: it leaves the game.
        const room = !c.token && handCount(s.players[c.owner]) < s.options.handLimit;
        if (room && rules(s).mercy) { dest = 'hand'; saver = 'Mercy'; }
        abilityIds(s, c).forEach(id => {
            const def = abilityDefs()[id];
            if (def.lastWordEffect) def.lastWordEffect(api(G), c); // whatever the hand or Mercy (#129, Last Save)
            if (room && dest === 'discard' && def.lastWord && def.lastWord(api(G), c) === 'hand') { dest = 'hand'; saver = def.name; }
        });
        resetCard(c);
        c.defeats += 1;
        c.controller = c.owner;
        const P = s.players[c.owner];
        if (c.token) { dest = 'gone'; c.gone = true; }
        else if (dest === 'hand' && handCount(P) < s.options.handLimit) P.hand.push(cid);
        else { dest = 'discard'; P.discard.push(cid); }
        emit(G, { t: 'defeated', cid, player: c.owner, dest, why,
            text: dest === 'hand' ? name + ' is defeated, but ' + saver + ' returns it to the hand.' : dest === 'gone' ? name + ' is defeated. A token leaves the game.' : name + ' is defeated.' });
        conditionalFact(G, 'creature-defeated', controller, { cid, owner: c.owner, dest, why });
    }

    function bounce(G, cid) {
        const s = G.s, c = s.cards[cid];
        const name = logName(s, cid);
        if (!removeFrom(s.players[c.controller].board, cid)) return;
        resetCard(c);
        c.controller = c.owner;
        if (c.token) { c.gone = true; emit(G, { t: 'token-gone', cid, player: c.owner, text: name + ' leaves the game: a token cannot go to a hand.' }); return; }
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
        // Waiting (conditional) cards never join a random team (#148): a practice dummy must not show them early.
        let weights = Object.keys(all)
            .filter(id => !all[id].conditional && (o.legendaries !== false || all[id].rarity !== 'legendary') && ((rar[all[id].rarity] || { weight: 1 }).weight > 0))
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
        maxHealth: (s,cid)=>healthOf(s,cid).max,
        changedAxioms,
        playCost: (s, cid) => playCost(s, cid),
        canAttack: (s, cid) => canAttack(s, cid),
        projectToken: (s, p, id) => projectToken(s, p, id),
    };

    Battle.Engine = {
        DEFAULTS, RULE_DEFAULTS, PAD_SPECIES, KEYWORDS,
        createBattle, legalActions, applyAction, applyLegal, previewAction, winner, decider, actionKey, cloneState, fullLog, lostUids, overkillOf, exhaustion,
        rules, activeAxioms, axiomWouldChange, axiomPreview, projectAxiom, NUMERIC_RULES, changedAxioms, ruleSummary, timeline, fatePreview, fateNext, fateSchedule, fateEventPreview, fateLeapPreview, SCHEDULE_LIMIT, canSchedule, scheduleLimit, scheduleDelay, describe, activeEffects, wheelEdges, playsLeft, playLimit,
        playCost, axiomCost, attackOf, attackParts, healthOf, keywordsOf, hasKeyword, isSleeping, isHidden, goalProgress,
        canAttack, attackTargets, activations, canActivateNow, targetsFor, entranceOf, fightPreview,
        colourOf, wheelBonus, cardName, logName, says, handRoom, isHero, heroId, drawChoices, creaturesLeft, planningCreatureCount,
        buildAxiomDeck, axiomSelection, tacticSelection, randomTeam, colourInPlay, H,
        BAG_LIMIT, bagSelection, itemActions, bagStatus, itemsUsed,
        TWEAKS, powerMods, powerActions, powerStatus,
        conditionOf, boardOccupancy, armedView, informationState,
    };
})(typeof window !== 'undefined' ? window : globalThis);
