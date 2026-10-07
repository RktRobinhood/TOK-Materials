/*
 * Player state: one versioned object, autosaved to localStorage, exportable
 * as a backup code for moving between devices. No personal data beyond the
 * nickname the player types, and nothing ever leaves the laptop.
 */
(function (root) {
    'use strict';

    const Rift = root.Rift;
    const STATE_VERSION = 2;
    const STORAGE_KEY = 'rift-of-reason:save';
    const CODE_PREFIX = 'ROR1';

    function freshState() {
        return {
            version: STATE_VERSION,
            createdAt: Date.now(),
            seed: Math.floor(Math.random() * 2 ** 31),
            visits: 0,
            avatar: null,          // { type: 'owlet', variant: 'boy'|'girl', nickname }
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
            creatures: [],         // owned creature instances, see makeCreature
            team: [],              // creature uids chosen for battle (6–14); empty = the first 10
            trophies: [],          // named trophy copies won from classmates' ghosts
            seen: [],              // species ids seen
            axioms: [],            // axiom ids added to the player's pool
            axiomLoadout: [],      // ten chosen cards; empty saves receive the starter selection
            tactics: [],           // earned tactic ids beyond the starter pool (data/tactics.js)
            deckTactics: [],       // chosen tactic cards for the own deck (≤2 copies); empty = the starter ten
            rumours: [],           // rumour ids heard
            lures: {},             // node id -> visits of boosted rare spawns left
            perksUsed: {},         // perk id -> chapter it was used in
            tutorialsSeen: {},     // puzzle type -> tutorial offered (also filled for old saves)
            stats: { puzzlesSolved: 0, hintsUsed: 0, battlesWon: 0, battlesLost: 0, catches: 0, escapes: 0 },
            settings: { music: 0.5, sfx: 0.8, voice: 1, textSpeed: 1, calm: false },
        };
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
        return {
            cost: sp.cost,
            attack: Math.max(0, (sp.attack || 0) + v.attack + (taught === 'attack' ? 1 : 0) + (inst.powerDelta || 0)),
            health: Math.max(1, (sp.health || 1) + v.health + (taught === 'health' ? 1 : 0) + (v.trait === 'sturdy' ? 1 : 0)),
            keywords,
            ability: (inst.injuries || []).includes('no-ability') ? null : ((inst.warped && inst.warped.ability) || sp.ability || null),
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
    // Battle team: the chosen uids (6–14) that still exist, else the first 10.
    function battleTeam(save) {
        const s = save || current;
        if (!s) return [];
        const byUid = {};
        (s.creatures || []).forEach(c => { byUid[c.uid] = c; });
        const chosen = (s.team || []).map(uid => byUid[uid]).filter(Boolean).slice(0, 14);
        return chosen.length ? chosen : (s.creatures || []).slice(0, 10);
    }
    // Tactics this player may put in a deck: the starter pool plus earned ones.
    function ownedTactics(save) {
        const s = save || current || {};
        const known = (Rift.data || {}).tactics || {};
        const decks = (Rift.data || {}).tacticDecks || { starter: [] };
        return Array.from(new Set(decks.starter.concat(s.tactics || []))).filter(id => known[id]);
    }
    // Colour tactics (data/tactics.js tacticDecks.colour): a colour's two unlock the first time the
    // player owns a creature (or trophy copy) of that colour. Adds them to save.tactics and returns
    // the ids that are new (in the order the colours were first met). Old saves get theirs on load.
    function unlockColourTactics(save) {
        const s = save || current;
        if (!s) return [];
        const byColour = ((Rift.data || {}).tacticDecks || {}).colour || {};
        const known = (Rift.data || {}).tactics || {};
        const creatures = (Rift.data || {}).creatures || {};
        if (!Array.isArray(s.tactics)) s.tactics = [];
        const fresh = [];
        (s.creatures || []).concat(s.trophies || []).forEach(inst => {
            const sp = inst && creatures[inst.species];
            (sp && byColour[sp.colour] || []).forEach(id => {
                if (known[id] && !s.tactics.includes(id)) { s.tactics.push(id); fresh.push(id); }
            });
        });
        return fresh;
    }
    // The chosen tactic cards (owned, ≤2 copies each), else the starter ten.
    function deckTactics(save) {
        const s = save || current || {};
        const owned = ownedTactics(s);
        const counts = {};
        const chosen = (s.deckTactics || []).filter(id => owned.includes(id) && (counts[id] = (counts[id] || 0) + 1) <= 2).slice(0, 14);
        return chosen.length ? chosen : (((Rift.data || {}).tacticDecks || {}).starter || []).slice();
    }

    // Deck rule for the Collection builder: creatures + tactics = 20, 6–14 of each.
    // When the player owns too few creatures, all of them are picked and loans fill the rest.
    // checkDeck({ owned, team, tactics }) → { valid, creatures, loans, tactics, total, message }
    const DECK_SIZE = 20;
    function checkDeck(o) {
        const owned = o.owned || 0, team = o.team || 0, tactics = o.tactics || 0;
        const slots = DECK_SIZE - tactics;
        const loans = owned < slots && team === owned ? slots - owned : 0;
        const total = team + loans + tactics;
        const n = (k, word) => k + ' ' + word + (k === 1 ? '' : 's');
        const creatures = !loans ? n(team, 'creature')
            : !team ? n(loans, 'loaned creature')
                : n(team + loans, 'creature') + ' (' + team + ' yours + ' + loans + ' loaned)';
        const parts = creatures + ' + ' + n(tactics, 'tactic');
        const head = 'Deck ' + total + '/' + DECK_SIZE + ': ' + parts + '.';
        let problem = null;
        if (tactics < 6) problem = 'Choose at least 6 tactic cards.';
        else if (tactics > 14) problem = 'Choose at most 14 tactic cards.';
        else if (team > 14) problem = 'Choose at most 14 creatures.';
        else if (owned < slots && team < owned) problem = 'Pick all your creatures; loaned creatures fill the rest.';
        else if (total < DECK_SIZE) problem = 'Add ' + (DECK_SIZE - total) + ' more card' + (DECK_SIZE - total === 1 ? '' : 's') + '.';
        else if (total > DECK_SIZE) problem = 'Remove ' + (total - DECK_SIZE) + ' card' + (total - DECK_SIZE === 1 ? '' : 's') + '.';
        return { valid: !problem, creatures: team, loans, tactics, total, message: problem ? head + ' ' + problem : head };
    }

    // Species of the loaned creatures that fill the deck, in the order the battle adds them:
    // with no creatures, the loaned starter team (js/battle/lesson.js); otherwise the engine's
    // pad species. loanFillers({ owned, team, tactics }) → ['astrophysicat', …]
    const PAD_FALLBACK = ['astrophysicat', 'zuckerborg', 'siuuugull'];
    function loanFillers(o) {
        const count = checkDeck(o).loans;
        const B = Rift.Battle || {};
        const pad = (B.Engine && B.Engine.PAD_SPECIES) || PAD_FALLBACK;
        const starter = !(o.owned || 0) && B.Lesson && B.Lesson.starter ? B.Lesson.starter().map(x => x.species) : [];
        const out = starter.slice(0, count);
        for (let k = 0; out.length < count; k++) out.push(pad[k % pad.length]);
        return out;
    }

    let instanceCounter = 0;
    function makeCreature(speciesId, extra) {
        instanceCounter += 1;
        const inst = Object.assign({
            uid: Date.now().toString(36) + '-' + instanceCounter.toString(36) + '-' + Math.floor(Math.random() * 1e6).toString(36),
            species: speciesId,
            caughtAt: Date.now(),
            powerDelta: 0,         // injuries lower it (the engine applies it to attack)
            scars: [],             // cosmetic scars
            injuries: [],          // e.g. 'no-ability', 'minus-one'
            warped: null,          // { ability } when the warp re-rolled it
            trophyOf: null,        // classmate nickname for trophy copies
            wins: 0,
            variant: null,         // { attack, health, trait } rolled from the uid
            taught: null,          // one Trick Book trick: 'guard'|'swift'|'shield'|'attack'|'health'
        }, extra || {});
        if (!isVariant(inst.variant)) inst.variant = rollVariant(inst.uid);
        return inst;
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
    };

    function migrate(state) {
        let s = state;
        while (s.version < STATE_VERSION) {
            const step = MIGRATIONS[s.version];
            if (!step) throw new Error('No migration from version ' + s.version);
            s = step(s);
        }
        // Saves migrated before the attack clamp existed: fix them too (does nothing otherwise).
        [s.creatures, s.trophies].forEach(list => { if (Array.isArray(list)) list.forEach(clampPower); });
        // Fill any fields added since this save was made.
        const out = mergeDefaults(freshState(), s);
        // Colour tactics for the colours this save already owns (saves made before they existed).
        unlockColourTactics(out);
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
    // Base64 of UTF-8 JSON plus a checksum, wrapped in a prefix. Compact enough
    // to paste in a chat; tampering or typos are caught by the checksum.

    function toBase64(text) {
        if (typeof root.btoa === 'function') {
            const bytes = new TextEncoder().encode(text);
            let bin = '';
            bytes.forEach(b => { bin += String.fromCharCode(b); });
            return root.btoa(bin);
        }
        return Buffer.from(text, 'utf8').toString('base64');
    }

    function fromBase64(b64) {
        if (typeof root.atob === 'function') {
            const bin = root.atob(b64);
            const bytes = Uint8Array.from(bin, c => c.charCodeAt(0));
            return new TextDecoder().decode(bytes);
        }
        return Buffer.from(b64, 'base64').toString('utf8');
    }

    function checksum(text) {
        return Rift.hashSeed(text).toString(36).padStart(7, '0').slice(-7);
    }

    function encode(kind, payload) {
        const body = toBase64(JSON.stringify(payload)).replace(/=+$/, '');
        return [CODE_PREFIX, kind, body, checksum(kind + body)].join('.');
    }

    function decode(kind, code) {
        const clean = String(code || '').replace(/\s+/g, '');
        const parts = clean.split('.');
        if (parts.length !== 4 || parts[0] !== CODE_PREFIX) throw new Error('That doesn\'t look like a Rift of Reason code.');
        if (parts[1] !== kind) throw new Error('That code is for something else (' + parts[1] + ').');
        if (checksum(parts[1] + parts[2]) !== parts[3]) throw new Error('That code has a typo or has been changed.');
        const pad = '='.repeat((4 - (parts[2].length % 4)) % 4);
        return JSON.parse(fromBase64(parts[2] + pad));
    }

    // ---- live state ------------------------------------------------------------

    let current = null;
    let saveTimer = null;

    function load() {
        const s = Rift.storage();
        let raw = null;
        if (s) {
            try { raw = s.getItem(STORAGE_KEY); } catch (e) { raw = null; }
        }
        if (raw) {
            try {
                current = migrate(JSON.parse(raw));
            } catch (e) {
                console.warn('[Rift] Save could not be read; starting fresh.', e);
                current = null;
            }
        }
        return current;
    }

    function saveNow() {
        if (!current) return false;
        const s = Rift.storage();
        if (!s) return false;
        try {
            s.setItem(STORAGE_KEY, JSON.stringify(current));
            return true;
        } catch (e) {
            console.warn('[Rift] Could not save.', e);
            return false;
        }
    }

    function save() {
        clearTimeout(saveTimer);
        saveTimer = setTimeout(saveNow, 150);
    }

    const State = {
        VERSION: STATE_VERSION,
        freshState,
        makeCreature,
        rollVariant,
        isVariant,
        creatureStats,
        naturalKeywords,
        minPowerDelta,
        clampPower,
        loanFillers,
        describeVariant,
        battleTeam,
        ownedTactics,
        unlockColourTactics,
        deckTactics,
        checkDeck,
        DECK_SIZE,
        TRAITS,
        TRICKS,
        TRICK_LABELS,
        migrate,
        encode,
        decode,
        load,
        save,
        saveNow,
        get() { return current; },
        has() { return !!current; },
        newGame() { current = freshState(); saveNow(); return current; },
        replace(state) { current = migrate(state); saveNow(); Rift.bus.emit('state:replaced', current); return current; },
        wipe() {
            current = null;
            const s = Rift.storage();
            if (s) { try { s.removeItem(STORAGE_KEY); } catch (e) { /* ignore */ } }
        },
        exportCode() { return encode('save', current); },
        importCode(code) { return State.replace(decode('save', code)); },
        // Convenience mutators that also autosave and announce changes.
        update(fn) {
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
