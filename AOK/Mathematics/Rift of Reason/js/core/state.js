/*
 * Player state: one versioned object, autosaved to localStorage, exportable
 * as a backup code for moving between devices. No personal data beyond the
 * nickname the player types, and nothing ever leaves the laptop.
 */
(function (root) {
    'use strict';

    const Rift = root.Rift;
    const STATE_VERSION = 1;
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
            seen: [],              // species ids seen
            axioms: [],            // axiom ids added to the player's pool
            rumours: [],           // rumour ids heard
            lures: {},             // node id -> visits of boosted rare spawns left
            perksUsed: {},         // perk id -> chapter it was used in
            stats: { puzzlesSolved: 0, hintsUsed: 0, battlesWon: 0, battlesLost: 0, catches: 0, escapes: 0 },
            settings: { music: 0.5, sfx: 0.8, voice: 1, textSpeed: 1 },
        };
    }

    let instanceCounter = 0;
    function makeCreature(speciesId, extra) {
        instanceCounter += 1;
        return Object.assign({
            uid: Date.now().toString(36) + '-' + instanceCounter.toString(36) + '-' + Math.floor(Math.random() * 1e6).toString(36),
            species: speciesId,
            caughtAt: Date.now(),
            powerDelta: 0,         // injuries lower it
            scars: [],             // cosmetic scars
            injuries: [],          // e.g. 'no-ability', 'minus-one'
            warped: null,          // { ability } when the warp re-rolled it
            trophyOf: null,        // classmate nickname for trophy copies
            wins: 0,
        }, extra || {});
    }

    // ---- migrations ----------------------------------------------------------
    // Each entry upgrades from version N to N+1. Add one when STATE_VERSION grows.
    const MIGRATIONS = {
        // 1: s => { s.newField = ...; s.version = 2; return s; },
    };

    function migrate(state) {
        let s = state;
        while (s.version < STATE_VERSION) {
            const step = MIGRATIONS[s.version];
            if (!step) throw new Error('No migration from version ' + s.version);
            s = step(s);
        }
        // Fill any fields added since this save was made.
        return mergeDefaults(freshState(), s);
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
        update(fn) { fn(current); save(); Rift.bus.emit('state:changed', current); return current; },
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
