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
    const PREVIOUS_KEY = 'rift-of-reason:save:previous';     // the save before the last load / new game / erase
    const UNREADABLE_KEY = 'rift-of-reason:save:unreadable'; // a stored save that failed to parse, kept untouched
    const CODE_PREFIX = 'ROR1';        // base64 JSON: team codes, and save codes made before October 2026
    const PACKED_PREFIX = 'ROR2';      // base64 of deflated JSON: save codes, about ten times shorter

    function freshState() {
        return {
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
            stats: { puzzlesSolved: 0, hintsUsed: 0, battlesWon: 0, battlesLost: 0, catches: 0, escapes: 0, powerUses: {} },
            settings: { music: 0.5, sfx: 0.45, voice: 1, ambience: 0.5, textSpeed: 1, calm: false, charactersCanDie: true },
            backup: { lastAt: 0, reminded: [] }, // last backup code made; milestone reminders already shown
            // New progress (coins, card backs, quests, Rift Run…) goes in this object too, so backup
            // codes carry it automatically; tools/test/save-codes.test.mjs checks every field survives.
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
    // Colour tactics (data/tactics.js tacticDecks.colour, [common, uncommon, rare] per colour): the
    // COMMON unlocks the first time the player owns a creature (or trophy copy) of that colour. Adds it
    // to save.tactics and returns the ids that are new. Old saves get theirs on load (migrate).
    function unlockColourTactics(save) {
        const s = save || current;
        if (!s) return [];
        const byColour = ((Rift.data || {}).tacticDecks || {}).colour || {};
        const creatures = (Rift.data || {}).creatures || {};
        const fresh = [];
        (s.creatures || []).concat(s.trophies || []).forEach(inst => {
            const sp = inst && creatures[inst.species];
            const common = sp && (byColour[sp.colour] || [])[0];
            if (common && grantTactic(common, s)) fresh.push(common);
        });
        return fresh;
    }
    // Gives the player a tactic to use in decks (vendor, quests, Rift Run, trainer rewards…).
    // Returns true when it is new. Does not save; use inside State.update or on a save object.
    function grantTactic(id, save) {
        const s = save || current;
        if (!s || !((Rift.data || {}).tactics || {})[id]) return false;
        if (!Array.isArray(s.tactics)) s.tactics = [];
        if (s.tactics.includes(id) || ownedTactics(s).includes(id)) return false;
        s.tactics.push(id);
        return true;
    }
    // The chosen tactic cards (owned, ≤2 copies each), else the starter ten.
    function deckTactics(save) {
        const s = save || current || {};
        const owned = ownedTactics(s);
        const counts = {};
        // Colour identity: a colour tactic needs a creature of its colour in the battle team.
        const colours = teamColours(battleTeam(s));
        const known = (Rift.data || {}).tactics || {};
        const fits = id => !(known[id] && known[id].colour) || colours.has(known[id].colour);
        const chosen = (s.deckTactics || []).filter(id => owned.includes(id) && fits(id) && (counts[id] = (counts[id] || 0) + 1) <= 2).slice(0, 14);
        return chosen.length ? chosen : (((Rift.data || {}).tacticDecks || {}).starter || []).slice();
    }
    // The colours of these creature instances (for the colour identity of colour tactics).
    function teamColours(team) {
        const creatures = (Rift.data || {}).creatures || {};
        return new Set((team || []).map(x => x && (creatures[x.species] || {}).colour).filter(Boolean));
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
        // Saves from before the Ambience slider (10 Oct): add it, and lower an untouched Sounds slider.
        if (s.settings && s.settings.ambience == null) { s.settings.ambience = 0.5; if (s.settings.sfx === 0.8) s.settings.sfx = 0.45; }
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
        return storageSet(STORAGE_KEY, JSON.stringify(current));
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
        grantTactic,
        teamColours,
        deckTactics,
        checkDeck,
        DECK_SIZE,
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
        flush,
        previous,
        restorePrevious,
        replace,
        get() { return current; },
        has() { return !!current; },
        newGame() { keepPrevious('new'); current = freshState(); saveNow(); return current; },
        wipe() {
            keepPrevious('erase');
            clearTimeout(saveTimer);
            saveTimer = null;
            current = null;
            storageSet(STORAGE_KEY, null);
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
