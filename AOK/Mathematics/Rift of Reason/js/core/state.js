/*
 * Player state: one versioned object, autosaved to localStorage, exportable
 * as a backup code for moving between devices. No personal data beyond the
 * nickname the player types, and nothing ever leaves the laptop.
 */
(function (root) {
    'use strict';

    const Rift = root.Rift;
    const STATE_VERSION = 6;
    const STORAGE_KEY = 'rift-of-reason:save';
    const PREVIOUS_KEY = 'rift-of-reason:save:previous';     // the save before the last load / new game / erase
    const UNREADABLE_KEY = 'rift-of-reason:save:unreadable'; // a stored save that failed to parse, kept untouched
    const CODE_PREFIX = 'ROR1';        // base64 JSON: team codes, and save codes made before October 2026
    const PACKED_PREFIX = 'ROR2';      // base64 of deflated JSON: save codes, about ten times shorter

    function freshState() {
        const s = {
            version: STATE_VERSION,
            createdAt: Date.now(),
            seed: Math.floor(Math.random() * 2 ** 31),
            visits: 0,
            avatar: null,          // { type: 'owlet', variant: 'boy'|'girl', nickname, realName }
            chapter: 'prologue',
            map: {
                at: null,          // node id the avatar stands on
                revealed: [],      // node ids out of the fog
                completed: [],     // node ids whose task is done at least once
                visitCount: {},    // node id -> visits (seeds the per-visit roll)
                rifts: [],         // chapters jumped to through a time rift
            },
            flags: {},             // story decisions: { key: value }
            health: 5,
            maxHealth: 5,
            scars: [],             // ids from data/scars.js
            xp: 0,
            accolades: [],
            items: { charm: 3, tonic: 1 },
            wallet: { coins: 0, visits: {}, chapters: {}, freePacks: 0, freeCards: 0, saleSerial: 0, sale: null, packSerial: 0, pack: null }, // earned Coins, bounded source receipts and the latest pack receipt (#133/#135/#136)
            creatures: [],         // owned creature instances, see makeCreature
            team: [],              // creature uids chosen for battle (6–14); empty = the first 10
            trophies: [],          // named trophy copies won from classmates' ghosts
            seen: [],              // species ids seen
            axioms: [],            // axiom ids added to the player's pool
            axiomLoadout: [],      // ten chosen cards (≤2 copies each); empty saves receive the starter selection
            tactics: [],           // earned tactic ids beyond the starter pool (data/tactics.js)
            cardPrints: { v: 1, ready: {}, colours: {}, tactic: {}, axiom: {} }, // normal/foil booleans per actual non-creature copy (#131)
            deckTactics: [],       // chosen tactic cards for the own deck (validateDeck rules); empty = the starter ten
            rumours: [],           // rumour ids heard
            lures: {},             // node id -> visits of boosted rare spawns left
            perksUsed: {},         // perk id -> chapter it was used in
            tutorialsSeen: {},     // puzzle type -> tutorial offered (also filled for old saves)
            stats: { puzzlesSolved: 0, hintsUsed: 0, battlesWon: 0, battlesLost: 0, catches: 0, escapes: 0, powerUses: {} },
            settings: { music: 0.5, sfx: 0.45, voice: 1, ambience: 0.5, textSpeed: 1, textInstant: false, calm: false, charactersCanDie: false },
            backup: { lastAt: 0, reminded: [] }, // last backup code made; milestone reminders already shown
            starter: null,         // receipt of the avatar type's starter deck (#114, grantStarter): { v, type, uids, tactics, axioms, unlocked, catchUp, at }
            hunts: {},             // roaming legendary hunts (#111, js/core/hunts.js): hunt id -> { phase, node, attempt, round, departure, claimed, … }
            catchOffers: {},       // node -> persisted visitor, selected minigame, board and settlement receipt (#158)
            // New progress (coins, card backs, quests, Rift Run…) goes in this object too, so backup
            // codes carry it automatically; tools/test/save-codes.test.mjs checks every field survives.
        };
        reconcilePrints(s);
        return s;
    }

    // ---- earned Coins (#133) ----------------------------------------------------
    function walletOf(save) {
        const s = save || current;
        if (!s) return null;
        if (!s.wallet) s.wallet = { coins: 0, visits: {}, chapters: {}, freePacks: 0, freeCards: 0, saleSerial: 0, sale: null, packSerial: 0, pack: null };
        return s.wallet;
    }
    // Pure debit on the supplied save. Pack purchases (js/core/packs.js) call it inside one transact().
    function spendCoins(amount, save) {
        const w = walletOf(save);
        if (!w || !Number.isSafeInteger(amount) || amount <= 0 || !Number.isSafeInteger(w.coins) || w.coins < amount) return false;
        w.coins -= amount;
        return true;
    }

    // ---- creature variation (design/card-arena-2026-10-07.md, "Variation") ----------
    // Every creature instance differs a little, like wild animals. The roll depends only
    // on the uid, so old saves (migration 1 → 2), tests and the display all agree.
    const TRAITS = ['guard', 'swift', 'shield', 'sturdy'];
    const TRICKS = ['guard', 'swift', 'shield', 'attack', 'health'];
    const KEYWORD_TRAITS = ['guard', 'swift', 'shield'];
    const ATTACK_ODDS = [{ item: -1, weight: 25 }, { item: 0, weight: 50 }, { item: 1, weight: 25 }];
    const HEALTH_ODDS = [{ item: -1, weight: 20 }, { item: 0, weight: 45 }, { item: 1, weight: 25 }, { item: 2, weight: 10 }];
    const TRAIT_CHANCE = 0.12;

    function rollVariant(uid) {
        const rng = Rift.makeRng('variant:' + String(uid));
        const attack = rng.weighted(ATTACK_ODDS);
        const health = rng.weighted(HEALTH_ODDS);
        const trait = rng.chance(TRAIT_CHANCE) ? rng.pick(TRAITS) : null;
        return { attack, health, trait };
    }
    const plainVariant = () => ({ attack: 0, health: 0, trait: null });
    function isVariant(v) {
        return !!v && typeof v === 'object' && [-1, 0, 1].includes(v.attack) && [-1, 0, 1, 2].includes(v.health)
            && (v.trait === null || TRAITS.includes(v.trait));
    }

    // Battle numbers of an owned instance; mirrors the engine's makeCreature.
    function creatureStats(inst) {
        const sp = ((Rift.data || {}).creatures || {})[inst.species];
        if (!sp) return null;
        const v = isVariant(inst.variant) ? inst.variant : plainVariant();
        const taught = TRICKS.includes(inst.taught) ? inst.taught : null;
        const keywords = (sp.keywords || []).slice();
        [v.trait, taught].forEach(k => { if (KEYWORD_TRAITS.includes(k) && !keywords.includes(k)) keywords.push(k); });
        const ch = Rift.changeEffect(inst);
        return {
            cost: Math.max(1, sp.cost + ch.cost),
            attack: Math.max(0, (sp.attack || 0) + v.attack + (taught === 'attack' ? 1 : 0) + (inst.powerDelta || 0) + ch.attack),
            health: Math.max(1, (sp.health || 1) + v.health + (taught === 'health' ? 1 : 0) + (v.trait === 'sturdy' ? 1 : 0) + ch.health),
            keywords,
            ability: (inst.injuries || []).includes('no-ability') ? null : (ch.ability || (inst.warped && inst.warped.ability) || sp.ability || null),
        };
    }

    // Keywords a creature has without any taught trick: species keywords, natural trait and
    // keywords its current ability grants (warped ability if any; none after 'no-ability').
    function naturalKeywords(inst) {
        const st = creatureStats(Object.assign({}, inst, { taught: null }));
        if (!st) return [];
        const abilities = (Rift.Battle && Rift.Battle.Abilities) || {};
        const granted = (st.ability && abilities[st.ability] && abilities[st.ability].keywords) || [];
        granted.forEach(k => { if (KEYWORD_TRAITS.includes(k) && !st.keywords.includes(k)) st.keywords.push(k); });
        return st.keywords;
    }

    // Lowest powerDelta that still means "attack 0": injuries can never push attack below 0.
    // Old saves and codes counted injuries on the old 1–10 power scale, so they can go lower.
    function minPowerDelta(inst) {
        const sp = ((Rift.data || {}).creatures || {})[inst.species];
        if (!sp) return -Infinity;
        const v = isVariant(inst.variant) ? inst.variant : plainVariant();
        return 0 - ((sp.attack || 0) + v.attack + (inst.taught === 'attack' ? 1 : 0)); // 0 − x avoids −0
    }
    // Raises powerDelta to minPowerDelta; drops the 'minus-one' injury if that heals it fully.
    function clampPower(inst) {
        if (!inst || typeof inst !== 'object') return inst;
        const floor = minPowerDelta(inst);
        if ((inst.powerDelta || 0) < floor) {
            inst.powerDelta = floor;
            if (inst.powerDelta >= 0 && Array.isArray(inst.injuries)) inst.injuries = inst.injuries.filter(x => x !== 'minus-one');
        }
        return inst;
    }

    const TRAIT_LABELS ={ guard: 'Natural Guard', swift: 'Natural Swift', shield: 'Natural Shield', sturdy: 'Sturdy (+1 health)' };
    const TRICK_LABELS = { guard: 'Guard', swift: 'Swift', shield: 'Shield', attack: '+1 attack', health: '+1 health' };
    // { stars: 1–3, labels: ['Strong (+1 attack)', …], taught: 'Learned: Guard' | null }
    function describeVariant(inst) {
        const v = isVariant(inst && inst.variant) ? inst.variant : plainVariant();
        const labels = [];
        if (v.attack > 0) labels.push('Strong (+1 attack)');
        if (v.attack < 0) labels.push('Gentle (−1 attack)');
        if (v.health === 1) labels.push('Hardy (+1 health)');
        if (v.health === 2) labels.push('Very hardy (+2 health)');
        if (v.health < 0) labels.push('Frail (−1 health)');
        if (v.trait) labels.push(TRAIT_LABELS[v.trait]);
        if (!labels.length) labels.push('Ordinary');
        const points = 2 * v.attack + v.health + (v.trait ? 2 : 0);
        const stars = points < 0 ? 1 : points >= 2 ? 3 : 2;
        const taught = TRICKS.includes(inst && inst.taught) ? 'Learned: ' + TRICK_LABELS[inst.taught] : null;
        return { stars, labels, taught };
    }

    // ---- the player's own battle deck ------------------------------------------
    // Battle team: the chosen uids (6–14) that still exist, else the default team.
    function battleTeam(save) {
        const s = save || current;
        if (!s) return [];
        const byUid = {};
        (s.creatures || []).forEach(c => { byUid[c.uid] = c; });
        const chosen = (s.team || []).map(uid => byUid[uid]).filter(Boolean).slice(0, 14);
        return chosen.length ? chosen : defaultTeam(s);
    }
    // The default team (no team chosen yet): the first 10 creatures in collection order, skipping
    // a species once 2 copies are in (1 for a legendary), so the default never breaks the copy limit.
    function defaultTeam(save) {
        const s = save || current || {};
        const counts = {};
        return (s.creatures || []).filter(c => c && (counts[c.species] = (counts[c.species] || 0) + 1) <= deckCopies(c.species)).slice(0, 10);
    }
    // ---- counted spell/Axiom prints (#131) -----------------------------------------------
    // Keep historical unlock lists, caught instances and loadouts intact. A ready ledger is
    // authoritative, including empty folders: loading a backup must never refill retired cards.
    function reconcilePrints(s) {
        if (!s.cardPrints) s.cardPrints = { v: 1, ready: {}, tactic: {}, axiom: {} };
        const P = s.cardPrints, data = Rift.data || {};
        P.ready = P.ready || {};
        P.colours = P.colours || {};
        for (const kind of ['tactic', 'axiom']) {
            if (!P[kind]) P[kind] = {};
            const decks = data[kind === 'tactic' ? 'tacticDecks' : 'axiomDecks'];
            // Core-only tools may load before the card data; reconcile that kind later.
            if (P.ready[kind] || !decks) continue;
            const unlocked = s[kind === 'tactic' ? 'tactics' : 'axioms'] || [];
            // The former implicit starting pool is now a real two-copy normal entitlement.
            // Old unlocked IDs also get two, preserving every previously legal two-copy deck.
            new Set((decks.starter || []).concat(unlocked)).forEach(id => {
                if (!printDefinition(kind, id)) return;
                if (!Array.isArray(P[kind][id])) P[kind][id] = [false, false];
            });
            P.ready[kind] = true;
        }
        return P;
    }
    function printDefinition(kind, id) {
        const defs = (Rift.data || {})[kind === 'tactic' ? 'tactics' : kind === 'axiom' ? 'axioms' : ''];
        const def = defs && Object.prototype.hasOwnProperty.call(defs, id) && defs[id];
        return def && !(kind === 'axiom' && def.own) ? def : null;
    }
    function printsOf(kind, id, save) {
        const s = save || current;
        if (!s || !['tactic', 'axiom'].includes(kind)) return [];
        const list = reconcilePrints(s)[kind][id];
        return Array.isArray(list) ? list.slice() : [];
    }
    function cardCopies(kind, id, save) { return printsOf(kind, id, save).length; }
    function cardRoom(kind, id, save) { return printDefinition(kind, id) ? Math.max(0, COPY_CAP - cardCopies(kind, id, save)) : 0; }
    function printCounts(kind, save) {
        const s = save || current, out = {};
        if (!s || !['tactic', 'axiom'].includes(kind)) return out;
        const ledger = reconcilePrints(s)[kind];
        Object.keys(ledger).forEach(id => { out[id] = Array.isArray(ledger[id]) ? ledger[id].length : 0; });
        return out;
    }
    function grantPrint(kind, id, save, opts) {
        const s = save || current;
        if (Rift.Acquisition && Rift.Acquisition.story(kind, id) && (!opts || opts.story !== id)) return false;
        if (!s || !printDefinition(kind, id) || !cardRoom(kind, id, s)) return false;
        const P = reconcilePrints(s), key = kind === 'tactic' ? 'tactics' : 'axioms';
        if (!Array.isArray(P[kind][id])) P[kind][id] = [];
        P[kind][id].push(!!(opts && opts.foil));
        if (!Array.isArray(s[key])) s[key] = [];
        const initial = (((Rift.data || {})[kind === 'tactic' ? 'tacticDecks' : 'axiomDecks']) || {}).starter || [];
        if (!initial.includes(id) && !s[key].includes(id)) s[key].push(id);
        return true;
    }
    function releasePrint(kind, id, index, save) {
        const s = save || current, list = printsOf(kind, id, s);
        if (!s || !Number.isInteger(index) || index < 0 || index >= list.length) return false;
        const chosen = kind === 'tactic' ? deckTactics(s) : axiomLoadout(s);
        if (list.length <= chosen.filter(c => c === id).length) return false;
        reconcilePrints(s)[kind][id].splice(index, 1);
        return true;
    }
    // Tactics this player can actually put in a deck (historical unlocks alone do not suffice).
    function ownedTactics(save) {
        const s = save || current || {};
        const known = (Rift.data || {}).tactics || {};
        const counts = printCounts('tactic', s);
        return Object.keys(counts).filter(id => known[id] && counts[id] > 0);
    }
    // Colour tactics (data/tactics.js tacticDecks.colour, [common, uncommon, rare] per colour): the
    // COMMON unlocks the first time the player owns a creature (or trophy copy) of that colour. Adds it
    // to save.tactics and returns the ids that are new. Old saves get theirs on load (migrate).
    function unlockColourTactics(save, legacy) {
        const s = save || current;
        if (!s) return [];
        const byColour = ((Rift.data || {}).tacticDecks || {}).colour || {};
        const creatures = (Rift.data || {}).creatures || {};
        const fresh = [];
        (s.creatures || []).concat(s.trophies || []).forEach(inst => {
            const sp = inst && creatures[inst.species];
            const common = sp && (byColour[sp.colour] || [])[0];
            if (!common) return;
            const receipts = reconcilePrints(s).colours;
            if (receipts[sp.colour]) return;
            // Starter/legacy ownership already supplies this introduction; do not add it on reload.
            if (!cardCopies('tactic', common, s) && grantTactic(common, s)) {
                fresh.push(common);
                if (legacy) grantTactic(common, s); // preserve formerly usable pairs for colours already caught
            }
            receipts[sp.colour] = true;
        });
        return fresh;
    }
    // Grants one actual copy; source receipts prevent repeating once-only rewards.
    // No save or RNG here: pack selection and independent foil rolls belong to the acquisition caller.
    function grantTactic(id, save, opts) { return grantPrint('tactic', id, save, opts); }
    function grantAxiom(id, save, opts) { return grantPrint('axiom', id, save, opts); }
    // The chosen tactic cards exactly as saved, else the starter ten. Nothing is dropped quietly:
    // validateDeck (through ownDeck) reports cards that break a rule, so the player can repair them.
    function deckTactics(save) {
        const s = save || current || {};
        const chosen = (s.deckTactics || []).slice();
        return chosen.length ? chosen : (((Rift.data || {}).tacticDecks || {}).starter || []).slice();
    }
    // Axiom ids this player may put in the ten: the starter pool plus earned ones.
    function ownedAxioms(save) {
        const s = save || current || {};
        const known = (Rift.data || {}).axioms || {};
        const counts = printCounts('axiom', s);
        return Object.keys(counts).filter(id => known[id] && !known[id].own && counts[id] > 0);
    }
    // The ten axiom cards: the saved loadout exactly as saved, else the fixed introductory ten.
    // Earned-pool order never changes this fallback; construction remains an explicit player choice.
    function axiomLoadout(save) {
        const s = save || current || {};
        if ((s.axiomLoadout || []).length) return s.axiomLoadout.slice();
        const known = (Rift.data || {}).axioms || {};
        const out = [];
        (((Rift.data || {}).axiomDecks || {}).default || []).forEach(id => {
            if (out.length < DECK_RULES.axioms && known[id] && !known[id].own && !out.includes(id)) out.push(id);
        });
        return out;
    }

    // Deck size for every personal deck (no loaned creatures fill a player's deck since #114: every
    // adventure owns its avatar type's starter deck).
    const DECK_SIZE = 20;

    // ---- construction rules (#112, design/drafts/card-arena-2026-10-12/CARD-DRAFTS.md) ----------
    // ONE validator for every deck: the Collection builder, saved decks, team codes, and the
    // trainer, boss and starter decks (their tests). A personal deck has 20 cards (6–14 creatures,
    // 6–14 tactics), at most 2 copies of a creature species or a named tactic. Colour quota: per
    // colour, colour tactic copies ≤ creature copies of that colour in the deck. Generic tactics
    // (no colour) have no quota, and no creature needs to be in play to cast a colour tactic.
    // Ten axiom cards, at most 2 copies of a named rule. Rules limit decks, not ownership.
    const DECK_RULES = Object.freeze({ size: DECK_SIZE, minCreatures: 6, maxCreatures: 14, minTactics: 6, maxTactics: 14, copies: 2, axioms: 10, axiomCopies: 2 });

    const speciesOf = x => (typeof x === 'string' ? x : x && x.species);
    // The colour a creature counts for in a quota: null for a generic or unknown one.
    function creatureColour(x) {
        const sp = ((Rift.data || {}).creatures || {})[speciesOf(x)];
        return (sp && !sp.generic && sp.colour) || null;
    }
    const tacticColour = id => ((((Rift.data || {}).tactics || {})[id]) || {}).colour || null;
    function countBy(list, key) {
        const out = {};
        (list || []).forEach(x => { const k = key ? key(x) : x; if (k != null) out[k] = (out[k] || 0) + 1; });
        return out;
    }
    // { colour: { creatures, tactics } } for every colour the deck uses.
    function colourQuota(creatures, tactics) {
        const out = {};
        const row = c => out[c] || (out[c] = { creatures: 0, tactics: 0 });
        (creatures || []).forEach(x => { const c = creatureColour(x); if (c) row(c).creatures += 1; });
        (tactics || []).forEach(id => { const c = tacticColour(id); if (c) row(c).tactics += 1; });
        return out;
    }
    // The colour tactics that fit the quota, in order → { kept, dropped } (only for old team codes
    // made under the earlier rule; a player's own deck is never trimmed).
    function quotaFilter(tactics, creatures) {
        const room = countBy(creatures, creatureColour);
        const kept = [], dropped = [];
        (tactics || []).forEach(id => {
            const c = tacticColour(id);
            if (c && !(room[c] > 0)) { dropped.push(id); return; }
            if (c) room[c] -= 1;
            kept.push(id);
        });
        return { kept, dropped };
    }

    // validateDeck({ creatures: [instances | species ids], tactics: [ids], axioms?: [ids], loans?, missing? }, opts)
    //   opts.complete (default true): the exact size and the 6–14 bands; false only checks maxima
    //     (team codes: the battle fills a classmate's short ghost deck).
    //   opts.owned / opts.ownedAxioms: when given, cards outside them are reported.
    //   loans: loaned filler creatures (fixtures only); they count for the size, never for copies or quotas.
    //   missing: chosen creatures no longer in the collection.
    // → { valid, problems: [{ part: 'deck'|'axioms', code, text, id?, colour? }], message, head, axiomHead,
    //     counts: { creatures, loans, tactics, total, axioms }, copies: { creatures, tactics, axioms }, quota }
    function validateDeck(deck, opts) {
        const d = deck || {}, o = Object.assign({ complete: true }, opts);
        const R = DECK_RULES, data = Rift.data || {};
        const species = data.creatures || {}, known = data.tactics || {}, axDefs = data.axioms || {};
        const creatures = d.creatures || [], tactics = d.tactics || [], loans = d.loans || 0;
        const problems = [];
        const add = (part, code, text, extra) => problems.push(Object.assign({ part, code, text }, extra || {}));
        const n = (k, word) => k + ' ' + word + (k === 1 ? '' : 's');
        const nameOf = (defs, id) => ((defs[id] || {}).name || id);
        const colourName = c => (((Rift.COLOURS || {})[c]) || { name: c }).name;
        const aColour = c => (/^[aeiou]/i.test(colourName(c)) ? 'an ' : 'a ') + colourName(c);
        const copies = { creatures: countBy(creatures, speciesOf), tactics: countBy(tactics), axioms: countBy(d.axioms) };
        const quota = colourQuota(creatures, tactics);

        if (d.missing) add('deck', 'missing', n(d.missing, 'chosen creature') + (d.missing === 1 ? ' is' : ' are') + ' no longer in your collection. Choose another.');
        Object.keys(copies.creatures).forEach(id => {
            if (!species[id]) add('deck', 'unknown', 'Unknown creature: ' + id + '. Remove it.', { id });
            else if (copies.creatures[id] > deckCopies(id)) add('deck', 'copies', isLegendary(id)
                ? nameOf(species, id) + ' is legendary: one per deck. Remove ' + (copies.creatures[id] - 1) + '.'
                : nameOf(species, id) + ': at most ' + R.copies + ' copies. Remove ' + (copies.creatures[id] - R.copies) + '.', { id });
        });
        Object.keys(copies.tactics).forEach(id => {
            if (!known[id]) add('deck', 'unknown', 'Unknown tactic card: ' + id + '. Remove it.', { id });
            else if (o.owned && !o.owned.includes(id)) add('deck', 'unowned', 'You do not own ' + nameOf(known, id) + ' yet. Remove it.', { id });
            if (known[id] && copies.tactics[id] > R.copies) add('deck', 'copies', nameOf(known, id) + ': at most ' + R.copies + ' copies. Remove ' + (copies.tactics[id] - R.copies) + '.', { id });
            if (known[id] && o.ownedCounts && copies.tactics[id] <= R.copies && (!o.owned || o.owned.includes(id)) && copies.tactics[id] > (o.ownedCounts[id] || 0)) add('deck', 'unowned-copies', 'You own ' + (o.ownedCounts[id] || 0) + ((o.ownedCounts[id] || 0) === 1 ? ' copy of ' : ' copies of ') + nameOf(known, id) + '. Remove the extra copies.', { id });
        });
        Object.keys(quota).forEach(c => {
            const q = quota[c];
            if (q.tactics > q.creatures) {
                add('deck', 'quota', n(q.tactics, colourName(c) + ' tactic') + (q.tactics === 1 ? ' needs ' : ' need ') + n(q.tactics, colourName(c) + ' creature')
                    + '. You have ' + q.creatures + '. Add ' + aColour(c) + ' creature or remove ' + aColour(c) + ' tactic.', { colour: c });
            }
        });
        const total = creatures.length + loans + tactics.length;
        if (o.complete) {
            if (tactics.length < R.minTactics) add('deck', 'tactics', 'Choose at least ' + R.minTactics + ' tactic cards.');
            else if (tactics.length > R.maxTactics) add('deck', 'tactics', 'Choose at most ' + R.maxTactics + ' tactic cards.');
            if (creatures.length > R.maxCreatures) add('deck', 'creatures', 'Choose at most ' + R.maxCreatures + ' creatures.');
            else if (creatures.length + loans < R.minCreatures) add('deck', 'creatures', 'Choose at least ' + R.minCreatures + ' creatures.');
            if (total < R.size) add('deck', 'size', 'Add ' + n(R.size - total, 'more card') + '.');
            else if (total > R.size) add('deck', 'size', 'Remove ' + n(total - R.size, 'card') + '.');
        } else {
            if (creatures.length > R.maxCreatures) add('deck', 'creatures', 'Choose at most ' + R.maxCreatures + ' creatures.');
            if (total > R.size) add('deck', 'size', 'Remove ' + n(total - R.size, 'card') + '.');
        }

        if (d.axioms) {
            Object.keys(copies.axioms).forEach(id => {
                const ax = axDefs[id];
                if (!ax) add('axioms', 'unknown', 'Unknown axiom card: ' + id + '. Remove it.', { id });
                else if (ax.own) add('axioms', 'own', ax.name + ' starts in your hand. It is not one of the ten.', { id });
                else if (o.ownedAxioms && !o.ownedAxioms.includes(id)) add('axioms', 'unowned', 'You do not own ' + ax.name + ' yet. Remove it.', { id });
                if (ax && copies.axioms[id] > R.axiomCopies) add('axioms', 'copies', ax.name + ': at most ' + R.axiomCopies + ' copies. Remove ' + (copies.axioms[id] - R.axiomCopies) + '.', { id });
                if (ax && !ax.own && o.ownedAxiomCounts && copies.axioms[id] <= R.axiomCopies && (!o.ownedAxioms || o.ownedAxioms.includes(id)) && copies.axioms[id] > (o.ownedAxiomCounts[id] || 0)) add('axioms', 'unowned-copies', 'You own ' + (o.ownedAxiomCounts[id] || 0) + ((o.ownedAxiomCounts[id] || 0) === 1 ? ' copy of ' : ' copies of ') + nameOf(axDefs, id) + '. Remove the extra copies.', { id });
            });
            const k = d.axioms.length;
            if (k > R.axioms) add('axioms', 'size', 'Axiom cards ' + k + '/' + R.axioms + ': remove ' + (k - R.axioms) + '.');
            else if (o.complete && k < R.axioms) add('axioms', 'size', 'Axiom cards ' + k + '/' + R.axioms + ': add ' + (R.axioms - k) + '.');
        }

        const who = !loans ? n(creatures.length, 'creature')
            : !creatures.length ? n(loans, 'loaned creature')
                : n(creatures.length + loans, 'creature') + ' (' + creatures.length + ' yours + ' + loans + ' loaned)';
        const head = 'Deck ' + total + '/' + R.size + ': ' + who + ' + ' + n(tactics.length, 'tactic') + '.';
        const axiomHead = d.axioms ? 'Axiom cards ' + d.axioms.length + '/' + R.axioms + '.' : null;
        const first = problems[0];
        return {
            valid: !problems.length, problems, head, axiomHead,
            message: first ? (first.part === 'axioms' ? axiomHead : head) + ' ' + first.text : head,
            counts: { creatures: creatures.length, loans, tactics: tactics.length, total, axioms: d.axioms ? d.axioms.length : null },
            copies, quota,
        };
    }

    // The player's own deck for a battle, exactly as saved (defaults for empty choices), with its
    // check. Battles start only when check.valid; otherwise the player repairs it in Collection.
    // No loaned creatures fill it (#114): `loans` stays empty for old callers.
    // → { team: [instances], tactics: [ids], axioms: [ids], loans: [species], missing, custom, check }
    function ownDeck(save) {
        const s = save || current;
        if (!s) return null;
        const byUid = {};
        (s.creatures || []).forEach(c => { byUid[c.uid] = c; });
        const chosen = s.team || [];
        const team = chosen.length ? chosen.map(uid => byUid[uid]).filter(Boolean) : defaultTeam(s);
        const missing = chosen.length ? chosen.length - team.length : 0;
        const tactics = deckTactics(s);
        const axioms = axiomLoadout(s);
        const loans = [];
        const check = validateDeck({ creatures: team, tactics, axioms, missing },
            { owned: ownedTactics(s), ownedAxioms: ownedAxioms(s), ownedCounts: printCounts('tactic', s), ownedAxiomCounts: printCounts('axiom', s) });
        return { team, tactics, axioms, loans, missing, custom: !!(chosen.length || (s.deckTactics || []).length), check };
    }

    // ---- owned avatar-type starter decks (#114, data/starters.js) ------------------------------------
    // The avatar type's starter deck as { strategy, creatures, tactics, axioms }, or null.
    function starterDeck(type) {
        const D = (Rift.data || {}).starterDecks;
        const deck = D && D.decks && D.decks[type];
        return deck ? { strategy: deck.strategy, creatures: deck.creatures.slice(), tactics: deck.tactics.slice(), axioms: D.axioms.slice() } : null;
    }
    // Grants the avatar type's starter deck ONCE per adventure: real owned creatures (plain variants,
    // ordinary stakes, never loaners), its tactics as owned unlocks, and the receipt save.starter =
    // { v, type, uids, tactics, axioms, unlocked, catchUp, at }. Any receipt blocks a second grant, so
    // reloads, backup codes, a changed appearance or type and chapter jumps never repeat it. A new
    // adventure (nothing owned or chosen yet) also gets the deck as its loadout; an existing adventure
    // (catch-up) keeps its catches, unlocks and loadouts, and can pick the starter in Collection.
    // Does not save; use inside State.update or on a save object. → the receipt, or null.
    function grantStarter(save) {
        const s = save || current;
        if (!s || !s.avatar || s.starter) return null;
        const deck = starterDeck(s.avatar.type);
        if (!deck) return null;
        ['creatures', 'team', 'deckTactics', 'axiomLoadout', 'seen', 'tactics'].forEach(k => { if (!Array.isArray(s[k])) s[k] = []; });
        const fresh = !s.creatures.length && !s.team.length && !s.deckTactics.length && !s.axiomLoadout.length;
        const taken = new Set(s.creatures.concat(s.trophies || []).map(c => c && c.uid));
        const tag = 'starter-' + ((s.seed >>> 0) || 0).toString(36) + '-';
        const uids = deck.creatures.map((species, i) => {
            let uid = tag + i;
            while (taken.has(uid)) uid += 'x';
            taken.add(uid);
            s.creatures.push(makeCreature(species, { uid, variant: plainVariant() }));
            if (!s.seen.includes(species)) s.seen.push(species);
            return uid;
        });
        const before = new Set(ownedTactics(s));
        deck.tactics.forEach(id => grantTactic(id, s));
        deck.axioms.forEach(id => grantAxiom(id, s));
        const unlocked = Array.from(new Set(deck.tactics)).filter(id => !before.has(id));
        if (fresh) {
            s.team = uids.slice();
            s.deckTactics = deck.tactics.slice();
            s.axiomLoadout = deck.axioms.slice();
        }
        s.starter = { v: (Rift.data.starterDecks || {}).version || 1, type: s.avatar.type, uids, tactics: deck.tactics, axioms: deck.axioms,
            unlocked, catchUp: !fresh, at: Date.now() };
        return s.starter;
    }

    let instanceCounter = 0;
    function makeCreature(speciesId, extra) {
        instanceCounter += 1;
        const inst = Object.assign({
            uid: Date.now().toString(36) + '-' + instanceCounter.toString(36) + '-' + Math.floor(Math.random() * 1e6).toString(36),
            species: speciesId,
            caughtAt: Date.now(),
            powerDelta: 0,         // old injuries lowered it; healed by migration 2 → 3
            scars: [],             // old cosmetic scars (kept, not shown)
            injuries: [],          // old injuries ('no-ability', 'minus-one'); healed by migration 2 → 3
            warped: null,          // old warp { ability }; migration 2 → 3 makes it a sideways Change
            changes: [],           // Changes from battles (data/fate.js): [{ id, ability?, from? }]
            trophyOf: null,        // classmate nickname for trophy copies
            wins: 0,
            variant: null,         // { attack, health, trait } rolled from the uid
            taught: null,          // one Trick Book trick: 'guard'|'swift'|'shield'|'attack'|'health'
            foil: false,           // a shiny catch (#151): the cosmetic foil print, no stat change
        }, extra || {});
        if (!isVariant(inst.variant)) inst.variant = rollVariant(inst.uid);
        return inst;
    }

    // ---- folders: up to COPY_CAP of each creature type (#151) -------------------------------------
    // A collection holds at most four copies of a species (variants, foils and Changed copies all
    // count); a deck still takes two (DECK_RULES). Older saves above the cap keep every copy: they just
    // cannot gain another until the student releases some. Legendaries are keepsakes and never released.
    // Legendaries are one of a kind (teacher, 17 Oct 2026): a folder of one and one per deck. Old saves
    // that already hold more keep them; a deck still takes only one.
    const COPY_CAP = 4;
    const isLegendary = species => (((Rift.data || {}).creatures || {})[species] || {}).rarity === 'legendary';
    const copyCap = species => (isLegendary(species) ? 1 : COPY_CAP);
    const deckCopies = species => (isLegendary(species) ? 1 : DECK_RULES.copies);
    function copiesOf(save, species) {
        return ((save || current || {}).creatures || []).filter(c => c && c.species === species).length;
    }
    function hasRoom(save, species) { return copiesOf(save, species) < copyCap(species); }
    // Free folder slots for a species (never below 0).
    function roomFor(save, species) { return Math.max(0, copyCap(species) - copiesOf(save, species)); }
    // Why a gained copy cannot join, in plain words.
    function fullReason(species) {
        const name = (((Rift.data || {}).creatures || {})[species] || {}).name || species;
        return isLegendary(species)
            ? 'You already have ' + name + '. Legendaries are one of a kind.'
            : 'Your ' + name + ' folder is full (' + COPY_CAP + ' copies).';
    }

    // Adds a gained instance when its folder has room. Does not save. → true if added.
    function addCreature(save, inst, opts) {
        const s = save || current;
        if (inst && Rift.Acquisition && Rift.Acquisition.story('creature', inst.species) && (!opts || opts.story !== inst.species)) return false;
        if (!s || !inst || !hasRoom(s, inst.species)) return false;
        if (!Array.isArray(s.creatures)) s.creatures = [];
        s.creatures.push(inst);
        if (Array.isArray(s.seen) && !s.seen.includes(inst.species)) s.seen.push(inst.species);
        return true;
    }

    // Can this copy be released? → { ok, reason?, warn? }. warn: it is in the chosen battle team.
    function releaseCheck(save, uid) {
        const s = save || current || {};
        const inst = (s.creatures || []).find(c => c && c.uid === uid);
        if (!inst) return { ok: false, reason: 'That creature is not in your collection.' };
        const sp = (Rift.data.creatures || {})[inst.species] || {};
        if (sp.rarity === 'legendary') return { ok: false, reason: 'Legendary creatures are keepsakes. They stay with you.' };
        const inTeam = (s.team || []).includes(uid) || battleTeam(s).includes(inst);
        return { ok: true, warn: inTeam ? 'This copy is in your battle team. Releasing it takes it out of your deck.' : null };
    }

    // Releases one copy back to the wild (#151). Does not save. → true if released.
    function releaseCreature(save, uid) {
        const s = save || current;
        if (!s || !releaseCheck(s, uid).ok) return false;
        s.creatures = s.creatures.filter(c => c.uid !== uid);
        if (Array.isArray(s.team)) s.team = s.team.filter(id => id !== uid);
        return true;
    }

    // Gives an owned instance its uid-based variant and the taught slot (migration 1 → 2).
    function upgradeInstance(c) {
        if (!c || typeof c !== 'object' || typeof c.uid !== 'string') return c;
        if (!isVariant(c.variant)) c.variant = rollVariant(c.uid);
        if (!TRICKS.includes(c.taught)) c.taught = null;
        // Old powerDelta used the 1–10 power scale (e.g. Astrophysicat 4 → 2 = −2): keep attack ≥ 0.
        clampPower(c);
        return c;
    }

    function healForChanges(c) {
        if (!c || typeof c !== 'object') return c;
        if (!Array.isArray(c.changes)) c.changes = [];
        if ((c.powerDelta || 0) < 0) c.powerDelta = 0;
        c.injuries = [];
        if (c.warped && c.warped.ability && !c.changes.some(ch => ch.id === 'rift-freckles')) {
            c.changes.push({ id: 'rift-freckles', ability: c.warped.ability, from: c.warped.from || null });
        }
        c.warped = null;
        return c;
    }

    // ---- migrations ----------------------------------------------------------
    // Each entry upgrades from version N to N+1. Add one when STATE_VERSION grows.
    const MIGRATIONS = {
        // Card Arena: creature variation, Trick Book tricks and tactic cards.
        1: s => {
            if (Array.isArray(s.creatures)) s.creatures.forEach(upgradeInstance);
            if (Array.isArray(s.trophies)) s.trophies.forEach(upgradeInstance);
            if (!Array.isArray(s.tactics)) s.tactics = [];
            if (!Array.isArray(s.deckTactics)) s.deckTactics = [];
            s.version = 2;
            return s;
        },
        // Changes replace the Fate table (#151): injuries heal for free, a warp becomes a sideways
        // Change, cosmetic scars stay in the data but are no longer shown.
        2: s => {
            [s.creatures, s.trophies].forEach(list => { if (Array.isArray(list)) list.forEach(healForChanges); });
            s.version = 3;
            return s;
        },
        // Rebound retired by teacher feedback. Keep the visitor and receipts;
        // refund active paid games before offering the replacement, exactly once.
        3: s => {
            Object.values(s.catchOffers || {}).forEach(o => {
                if (o.kind !== 'ricochet') return;
                o.kind = 'lure';
                if (!o.receipt) {
                    if (o.board && ['charm', 'greatcharm'].includes(o.item)) {
                        s.items = s.items || {};
                        s.items[o.item] = (s.items[o.item] || 0) + 1;
                    }
                    o.board = null; o.item = null;
                } else o.board = null;
                o.version++;
            });
            s.version = 4;
            return s;
        },
    };

    // Preserve the formerly virtual starting ownership before removing rare Unlimited access.
    // Migration runs on loads/imports, never on freshState/new adventures.
    MIGRATIONS[4] = s => {
        const old = ((Rift.data || {}).axiomDecks || {}).legacyStarter || [];
        s.axioms = Array.from(new Set((s.axioms || []).concat(old)));
        s.version = 5;
        return s;
    };
    MIGRATIONS[5] = s => { s.cardPrints = s.cardPrints || { v: 1, ready: {}, tactic: {}, axiom: {} }; s.version = 6; return s; };

    function migrate(state) {
        let s = state;
        const legacyPrints = s.version < 6 || !s.cardPrints;
        while (s.version < STATE_VERSION) {
            const step = MIGRATIONS[s.version];
            if (!step) throw new Error('No migration from version ' + s.version);
            s = step(s);
        }
        // Saves migrated before the attack clamp existed: fix them too (does nothing otherwise).
        [s.creatures, s.trophies].forEach(list => { if (Array.isArray(list)) list.forEach(clampPower); });
        // Saves from before the Ambience slider (10 Oct): add it, and lower an untouched Sounds slider.
        if (s.settings && s.settings.ambience == null) { s.settings.ambience = 0.5; if (s.settings.sfx === 0.8) s.settings.sfx = 0.45; }
        // Fill any fields added since this save was made.
        const prints = s.cardPrints;
        const out = mergeDefaults(freshState(), s);
        // Dynamic inventory maps must not merge fresh entitlements into an existing ledger.
        out.cardPrints = prints || { v: 1, ready: {}, tactic: {}, axiom: {} };
        reconcilePrints(out);
        // Colour tactics for the colours this save already owns (saves made before they existed).
        unlockColourTactics(out, legacyPrints);
        return out;
    }

    function mergeDefaults(defaults, value) {
        if (Array.isArray(defaults)) return Array.isArray(value) ? value : defaults;
        if (defaults && typeof defaults === 'object') {
            const out = Object.assign({}, value);
            for (const key of Object.keys(defaults)) {
                out[key] = key in (value || {}) ? mergeDefaults(defaults[key], value[key]) : defaults[key];
            }
            return out;
        }
        return value === undefined ? defaults : value;
    }

    // ---- backup codes ----------------------------------------------------------
    // PREFIX.kind.body.checksum. ROR1: body = base64 of the UTF-8 JSON. ROR2: body = base64 of
    // the deflated JSON (CompressionStream), about ten times shorter for a big collection.
    // Readers accept both forever. The checksum catches typos and edits. Pasted codes are
    // forgiving: spaces, line breaks, quotes, text around the code and lost '=' are ignored.

    function bytesToBase64(bytes) {
        if (typeof root.btoa === 'function') {
            let bin = '';
            for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
            return root.btoa(bin);
        }
        return Buffer.from(bytes).toString('base64');
    }

    function base64ToBytes(b64) {
        if (typeof root.atob === 'function') return Uint8Array.from(root.atob(b64), c => c.charCodeAt(0));
        return new Uint8Array(Buffer.from(b64, 'base64'));
    }

    const toBase64 = text => bytesToBase64(new TextEncoder().encode(text));
    const fromBase64 = b64 => new TextDecoder('utf-8', { fatal: true }).decode(base64ToBytes(b64));

    function checksum(text) {
        return Rift.hashSeed(text).toString(36).padStart(7, '0').slice(-7);
    }

    function encode(kind, payload) {
        const body = toBase64(JSON.stringify(payload)).replace(/=+$/, '');
        return [CODE_PREFIX, kind, body, checksum(kind + body)].join('.');
    }

    const CODE_ERRORS = {
        empty: 'Paste your code into the box first.',
        notCode: 'That doesn\'t look like a Rift of Reason code. A code starts with ROR.',
        cutOff: 'That code looks cut off. Copy the whole code, from ROR to the very last character, and paste it again.',
        changed: 'That code has a typo or has been changed. Copy it again in one piece, without editing it.',
        newer: 'That code comes from a newer version of the game. Reload this page to update it, then try again.',
        oldBrowser: 'This browser is too old to open that code. Try it in an up-to-date Chrome, Edge, Firefox or Safari.',
        damaged: 'That code opened, but the adventure inside is damaged. Try an older backup code.',
    };
    const codeError = key => Object.assign(new Error(CODE_ERRORS[key]), { reason: key });
    // Spaces of every kind (also non-breaking and zero-width ones) can sit anywhere in a pasted code.
    const squeeze = text => String(text == null ? '' : text).replace(/[\s​-‍⁠­﻿]+/g, '');

    // Finds the code in pasted text → { packed, kind, body }. Throws a friendly error.
    function readParts(kind, text) {
        const clean = squeeze(text);
        if (!clean) throw codeError('empty');
        const found = clean.match(/ROR(\d+)\.([a-z]+)\.([A-Za-z0-9+/]+)=*\.([0-9a-z]{7})/i);
        if (!found) {
            const head = clean.match(/ROR(\d+)/i);
            if (!head) throw codeError('notCode');
            throw codeError(+head[1] > 2 ? 'newer' : 'cutOff');
        }
        const version = +found[1], codeKind = found[2].toLowerCase();
        if (version > 2) throw codeError('newer');
        if (version < 1) throw codeError('notCode');
        if (codeKind !== kind) throw new Error('That code is for something else (' + codeKind + ').');
        if (checksum(codeKind + found[3]) !== found[4].toLowerCase()) throw codeError('changed');
        return { packed: version === 2, kind: codeKind, body: found[3] };
    }

    const padded = body => body + '='.repeat((4 - (body.length % 4)) % 4);
    function parseJson(text) {
        try { return JSON.parse(text); } catch (e) { throw codeError('changed'); }
    }

    // Plain (ROR1) codes only; team codes are always plain. Packed codes need decodeAsync.
    function decode(kind, code) {
        const p = readParts(kind, code);
        if (p.packed) throw new Error('That code needs State.decodeAsync.');
        let text;
        try { text = fromBase64(padded(p.body)); } catch (e) { throw codeError('changed'); }
        return parseJson(text);
    }

    const canPack = () => typeof root.CompressionStream === 'function' && typeof root.DecompressionStream === 'function';

    // Runs bytes through a CompressionStream or DecompressionStream.
    async function pipeBytes(stream, bytes) {
        const writer = stream.writable.getWriter();
        const written = writer.write(bytes).then(() => writer.close());
        written.catch(() => { /* the reader reports the error */ });
        const reader = stream.readable.getReader();
        const chunks = [];
        let size = 0;
        for (;;) {
            const { value, done } = await reader.read();
            if (done) break;
            chunks.push(value);
            size += value.length;
        }
        await written;
        const out = new Uint8Array(size);
        let at = 0;
        chunks.forEach(c => { out.set(c, at); at += c.length; });
        return out;
    }

    // Packed (ROR2) code; falls back to a plain code where the browser can't compress.
    async function encodePacked(kind, payload) {
        if (!canPack()) return encode(kind, payload);
        try {
            const bytes = await pipeBytes(new root.CompressionStream('deflate'), new TextEncoder().encode(JSON.stringify(payload)));
            const body = bytesToBase64(bytes).replace(/=+$/, '');
            return [PACKED_PREFIX, kind, body, checksum(kind + body)].join('.');
        } catch (e) {
            return encode(kind, payload);
        }
    }

    // Plain or packed code → Promise<payload>.
    async function decodeAsync(kind, code) {
        const p = readParts(kind, code);
        if (!p.packed) return decode(kind, code);
        if (!canPack()) throw codeError('oldBrowser');
        let text;
        try {
            const bytes = await pipeBytes(new root.DecompressionStream('deflate'), base64ToBytes(padded(p.body)));
            text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
        } catch (e) { throw codeError('changed'); }
        return parseJson(text);
    }

    // Any code (packed or plain, with stray text around it) as a clean plain code, for readers
    // that work synchronously (the teacher overview). Throws the same friendly errors.
    async function plainCode(code) {
        const kind = (squeeze(code).match(/ROR\d+\.([a-z]+)\./i) || [])[1];
        const k = kind ? kind.toLowerCase() : 'save';
        return encode(k, await decodeAsync(k, code));
    }

    // A decoded save made safe to use: a real save object, migrated and complete. Never changes
    // the live save. Throws a friendly error for anything that could break the game.
    function checkSave(payload) {
        const p = payload;
        if (!p || typeof p !== 'object' || Array.isArray(p) || !Number.isInteger(p.version) || p.version < 1) throw codeError('damaged');
        const badList = list => list !== undefined && (!Array.isArray(list)
            || list.some(c => !c || typeof c !== 'object' || typeof c.uid !== 'string' || typeof c.species !== 'string'));
        if (badList(p.creatures) || badList(p.trophies)) throw codeError('damaged');
        if (p.cardPrints != null) {
            const record = x => x && typeof x === 'object' && !Array.isArray(x);
            const prints = p.cardPrints;
            if (!record(prints)) throw codeError('damaged');
            for (const kind of ['tactic', 'axiom']) {
                if (prints[kind] !== undefined && (!record(prints[kind]) || Object.values(prints[kind]).some(list => !Array.isArray(list) || list.some(foil => typeof foil !== 'boolean')))) throw codeError('damaged');
            }
            for (const key of ['ready', 'colours']) {
                if (prints[key] !== undefined && (!record(prints[key]) || Object.values(prints[key]).some(v => typeof v !== 'boolean'))) throw codeError('damaged');
            }
        }
        if (p.wallet != null) {
            const record = x => x && typeof x === 'object' && !Array.isArray(x);
            if (!record(p.wallet)) throw codeError('damaged');
            for (const key of ['coins', 'freePacks', 'freeCards', 'saleSerial', 'packSerial']) {
                if (p.wallet[key] !== undefined && (!Number.isSafeInteger(p.wallet[key]) || p.wallet[key] < 0)) throw codeError('damaged');
            }
            if (p.wallet.visits !== undefined && (!record(p.wallet.visits) || Object.values(p.wallet.visits).some(v => !Number.isSafeInteger(v) || v < 0))) throw codeError('damaged');
            if (p.wallet.chapters !== undefined && (!record(p.wallet.chapters) || Object.values(p.wallet.chapters).some(v => typeof v !== 'boolean'))) throw codeError('damaged');
            if (p.wallet.sale != null) {
                const r = p.wallet.sale;
                if (!record(r) || r.v !== 1 || !Number.isSafeInteger(r.number) || r.number <= 0
                    || !Number.isSafeInteger(r.coins) || r.coins <= 0 || !Number.isSafeInteger(r.afterCoins) || r.afterCoins < r.coins
                    || typeof r.stock !== 'string' || !Array.isArray(r.items)
                    || r.items.some(row => !record(row) || typeof row.id !== 'string' || !Number.isSafeInteger(row.quantity) || row.quantity <= 0)) throw codeError('damaged');
            }
            if (p.wallet.pack != null) {
                const r = p.wallet.pack;
                if (!record(r) || r.v !== 1 || !Number.isSafeInteger(r.number) || r.number <= 0 || typeof r.version !== 'string'
                    || !['coins', 'free'].includes(r.source) || !Number.isSafeInteger(r.price) || r.price < 0 || (r.source === 'free' && r.price !== 0) || typeof r.done !== 'boolean'
                    || (r.unlocked !== undefined && (!Array.isArray(r.unlocked) || r.unlocked.some(id => typeof id !== 'string')))
                    || !Array.isArray(r.cards) || !r.cards.length || r.cards.some(c => !record(c) || !['creature', 'tactic', 'axiom'].includes(c.kind)
                        || typeof c.id !== 'string' || typeof c.rarity !== 'string' || typeof c.foil !== 'boolean' || (c.kind === 'creature' && typeof c.uid !== 'string'))
                    || p.wallet.packSerial === undefined || r.number > p.wallet.packSerial) throw codeError('damaged');
            }
        }
        try {
            const s = migrate(JSON.parse(JSON.stringify(p)));
            JSON.stringify(s);
            return s;
        } catch (e) {
            throw codeError('damaged');
        }
    }

    // Decodes and checks a backup code without touching the live save → Promise<save>.
    async function readCode(code) {
        return checkSave(await decodeAsync('save', code));
    }

    // The student's real name, typed once at the start and never changed after: it travels in
    // every backup code so the teacher can see whose code it is.
    function cleanName(text) {
        return String(text || '').replace(/\s+/g, ' ').trim().slice(0, 40);
    }

    // One line about a save for "replace this adventure?" questions:
    // 'Ida · Chapter 1: The Road · 12 creatures · 9 places done'.
    function summary(save) {
        const s = save || current;
        if (!s) return 'No adventure';
        const chapter = (((Rift.data || {}).chapters || {})[s.chapter] || {}).name || s.chapter;
        const n = (k, word) => k + ' ' + word + (k === 1 ? '' : 's');
        const real = s.avatar && s.avatar.realName;
        const nick = (s.avatar && s.avatar.nickname) || 'No name yet';
        return [real && real !== nick ? nick + ' (' + real + ')' : nick, chapter,
            n((s.creatures || []).length, 'creature'), n(new Set((s.map && s.map.completed) || []).size, 'place') + ' done'].join(' · ');
    }

    // Milestones after which the game suggests a fresh backup code, once each: chapter bosses
    // beaten. → { ids: [every due id], name: the latest boss } or null.
    function backupMilestone(save) {
        const s = save || current;
        if (!s || !s.avatar) return null;
        const nodes = (((Rift.data || {}).map || {}).nodes) || {};
        const reminded = (s.backup && s.backup.reminded) || [];
        const due = ((s.map && s.map.completed) || []).filter(id => nodes[id] && nodes[id].type === 'boss' && !reminded.includes('boss:' + id));
        return due.length ? { ids: due.map(id => 'boss:' + id), name: nodes[due[due.length - 1]].name } : null;
    }

    // ---- live state ------------------------------------------------------------

    let current = null;
    let saveTimer = null;
    let lastWritten = null;
    function writeConflict() {
        if (storageGet(STORAGE_KEY) === lastWritten) return false;
        Rift.bus.emit('state:conflict');
        return true;
    }

    function storageGet(key) {
        const s = Rift.storage();
        if (!s) return null;
        try { return s.getItem(key); } catch (e) { return null; }
    }
    function storageSet(key, value) {
        const s = Rift.storage();
        if (!s) return false;
        try {
            if (value == null) s.removeItem(key); else s.setItem(key, value);
            return true;
        } catch (e) {
            console.warn('[Rift] Could not save.', e);
            return false;
        }
    }

    function load() {
        const raw = storageGet(STORAGE_KEY);
        lastWritten = raw;
        if (raw) {
            try {
                current = migrate(JSON.parse(raw));
            } catch (e) {
                // Keep the unreadable text (once) so the next save can't destroy it; the title
                // screen still offers the previous save and backup codes.
                console.warn('[Rift] Save could not be read; starting fresh.', e);
                if (!storageGet(UNREADABLE_KEY)) storageSet(UNREADABLE_KEY, raw);
                current = null;
            }
        }
        return current;
    }

    function saveNow() {
        clearTimeout(saveTimer);
        saveTimer = null;
        if (!current) return false;
        // A background autosave must not undo another tab's paid catch transaction.
        if (writeConflict()) return false;
        const raw = JSON.stringify(current);
        const ok = storageSet(STORAGE_KEY, raw);
        if (ok) lastWritten = raw;
        return ok;
    }

    function save() {
        clearTimeout(saveTimer);
        saveTimer = setTimeout(saveNow, 150);
    }

    // Write a pending autosave at once when the tab is hidden or closed.
    function flush() { if (saveTimer) saveNow(); }
    if (typeof root.addEventListener === 'function') root.addEventListener('pagehide', flush);
    if (root.document && typeof root.document.addEventListener === 'function') {
        root.document.addEventListener('visibilitychange', () => { if (root.document.visibilityState === 'hidden') flush(); });
    }

    // ---- the previous save --------------------------------------------------------
    // Loading a code, starting a new game or erasing first moves a real adventure (one with an
    // avatar) here, so one mistake can always be undone from the title screen.
    function keepPrevious(reason) {
        if (!current || !current.avatar) return false;
        return storageSet(PREVIOUS_KEY, JSON.stringify({ savedAt: Date.now(), reason, save: current }));
    }
    // → { savedAt, reason: 'load'|'new'|'erase'|'swap', save } or null.
    function previous() {
        const raw = storageGet(PREVIOUS_KEY);
        if (!raw) return null;
        try {
            const p = JSON.parse(raw);
            return { savedAt: p.savedAt || 0, reason: p.reason || 'load', save: checkSave(p.save) };
        } catch (e) {
            return null;
        }
    }
    // Swaps the live save and the previous one (so this, too, can be undone).
    function restorePrevious() {
        const p = previous();
        if (!p) return null;
        const was = current;
        current = p.save;
        lastWritten = storageGet(STORAGE_KEY);
        if (was && was.avatar) storageSet(PREVIOUS_KEY, JSON.stringify({ savedAt: Date.now(), reason: 'swap', save: was }));
        else storageSet(PREVIOUS_KEY, null);
        saveNow();
        Rift.bus.emit('state:replaced', current);
        return current;
    }

    // Puts a save in place of the live one, keeping the old one as the previous save.
    function replace(state) {
        const s = checkSave(state); // throws before anything changes
        keepPrevious('load');
        current = s;
        lastWritten = storageGet(STORAGE_KEY);
        saveNow();
        Rift.bus.emit('state:replaced', current);
        return current;
    }

    const State = {
        VERSION: STATE_VERSION,
        STORAGE_KEY,
        PREVIOUS_KEY,
        UNREADABLE_KEY,
        freshState,
        makeCreature,
        COPY_CAP,
        copiesOf,
        hasRoom,
        roomFor,
        copyCap,
        deckCopies,
        isLegendary,
        fullReason,
        addCreature,
        releaseCheck,
        releaseCreature,
        rollVariant,
        isVariant,
        creatureStats,
        naturalKeywords,
        minPowerDelta,
        clampPower,
        healForChanges,
        describeVariant,
        battleTeam,
        defaultTeam,
        ownedTactics,
        ownedAxioms,
        unlockColourTactics,
        grantTactic,
        grantAxiom,
        grantPrint,
        printsOf,
        cardCopies,
        cardRoom,
        printCounts,
        releasePrint,
        walletOf,
        spendCoins,
        deckTactics,
        axiomLoadout,
        DECK_SIZE,
        DECK_RULES,
        validateDeck,
        colourQuota,
        quotaFilter,
        ownDeck,
        starterDeck,
        grantStarter,
        TRAITS,
        TRICKS,
        TRICK_LABELS,
        migrate,
        encode,
        decode,
        encodePacked,
        decodeAsync,
        plainCode,
        checkSave,
        readCode,
        summary,
        cleanName,
        backupMilestone,
        load,
        save,
        saveNow,
        // A catch move, charm charge and reward must be one durable write. Publish only
        // after success. Optimistic checks detect saves changed before/while computing.
        transact(fn) {
            if (!current) return { ok: false, error: 'There is no adventure to save.' };
            if (writeConflict()) return { ok: false, error: 'This adventure changed in another tab. Reload to continue.' };
            const next = JSON.parse(JSON.stringify(current));
            const value = fn(next);
            const fresh = unlockColourTactics(next);
            const raw = JSON.stringify(next);
            // Board admission can be expensive: check again after computing the move.
            if (writeConflict()) return { ok: false, error: 'This adventure changed in another tab. Reload to continue.' };
            if (!storageSet(STORAGE_KEY, raw)) return { ok: false, error: 'Could not save this move. Free some browser storage, then try again.' };
            clearTimeout(saveTimer);
            saveTimer = null;
            current = next;
            lastWritten = raw;
            Rift.bus.emit('state:changed', current);
            if (fresh.length) Rift.bus.emit('tactics:unlocked', fresh);
            return { ok: true, value };
        },
        flush,
        previous,
        restorePrevious,
        replace,
        get() { return current; },
        has() { return !!current; },
        newGame() { keepPrevious('new'); current = freshState(); lastWritten = storageGet(STORAGE_KEY); saveNow(); return current; },
        wipe() {
            keepPrevious('erase');
            clearTimeout(saveTimer);
            saveTimer = null;
            current = null;
            storageSet(STORAGE_KEY, null);
            lastWritten = null;
        },
        // The live save as a backup code → Promise<string>. Packed when the browser can; the code
        // is read back and compared before it is handed out, else the plain format is used.
        async exportCode() {
            if (!current) throw new Error('There is no adventure to back up yet.');
            const json = JSON.stringify(current);
            const plain = JSON.parse(json);
            const code = await encodePacked('save', plain);
            try {
                if (JSON.stringify(await decodeAsync('save', code)) === json) return code;
            } catch (e) { /* fall through */ }
            return encode('save', plain);
        },
        // Loads a backup code in place of the live save → Promise<save>. Nothing changes unless
        // the whole code reads and checks; the old adventure becomes the previous save.
        async importCode(code) { return replace(await readCode(code)); },
        // The player copied or downloaded a backup code (shown in Settings as the last backup).
        noteBackup() { State.update(s => { s.backup.lastAt = Date.now(); }); },
        // Marks backup reminders as shown (ids from backupMilestone).
        markReminded(ids) {
            State.update(s => { [].concat(ids || []).forEach(id => { if (!s.backup.reminded.includes(id)) s.backup.reminded.push(id); }); });
        },
        // Catch-up (#114): grants the live adventure its avatar type's starter deck if it has no receipt
        // yet (boot, a loaded backup code, the previous save). Safe to call any time; announces
        // 'starter:granted'. → the receipt, or null.
        ensureStarter() {
            if (!current || !current.avatar || current.starter || !starterDeck(current.avatar.type)) return null;
            let receipt = null;
            State.update(s => { receipt = grantStarter(s); });
            if (receipt && Rift.bus) Rift.bus.emit('starter:granted', receipt);
            return receipt;
        },
        // Convenience mutators that also autosave and announce changes.
        update(fn) {
            if (writeConflict()) return current;
            fn(current);
            // A newly owned colour (a catch, a trophy, a won stake) unlocks its two colour tactics.
            const fresh = unlockColourTactics(current);
            save();
            Rift.bus.emit('state:changed', current);
            if (fresh.length) Rift.bus.emit('tactics:unlocked', fresh);
            return current;
        },
        addItem(id, n) { State.update(s => { s.items[id] = Math.max(0, (s.items[id] || 0) + (n == null ? 1 : n)); }); },
        useItem(id) {
            if (!current || !current.items[id]) return false;
            State.update(s => { s.items[id] -= 1; });
            return true;
        },
        setFlag(key, value) { State.update(s => { s.flags[key] = value === undefined ? true : value; }); },
        flag(key) { return current ? current.flags[key] : undefined; },
    };

    Rift.State = State;
})(typeof window !== 'undefined' ? window : globalThis);
