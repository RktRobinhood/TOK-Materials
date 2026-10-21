/*
 * Rift of Reason: shared namespace and small utilities.
 *
 * Every script is a classic <script> that attaches to window.Rift, so the game
 * runs from file:// and GitHub Pages with no build step. Pure modules (no DOM)
 * are also loaded by the Node tests in tools/test through a fake window.
 */
(function (root) {
    'use strict';

    const Rift = root.Rift || (root.Rift = {});

    // ---- seeded randomness -------------------------------------------------
    // Everything random (puzzles, spawns, catches, battles) goes through an RNG
    // made here, so a seed reproduces a whole encounter.

    function hashSeed(input) {
        const text = String(input);
        let h = 1779033703 ^ text.length;
        for (let i = 0; i < text.length; i++) {
            h = Math.imul(h ^ text.charCodeAt(i), 3432918353);
            h = (h << 13) | (h >>> 19);
        }
        h = Math.imul(h ^ (h >>> 16), 2246822507);
        h = Math.imul(h ^ (h >>> 13), 3266489909);
        return (h ^= h >>> 16) >>> 0;
    }

    function makeRng(seed) {
        let a = typeof seed === 'number' ? seed >>> 0 : hashSeed(seed);
        const next = function () {
            // mulberry32
            a = (a + 0x6D2B79F5) >>> 0;
            let t = a;
            t = Math.imul(t ^ (t >>> 15), t | 1);
            t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
        const rng = {
            next,
            int(min, max) { return min + Math.floor(next() * (max - min + 1)); },
            pick(list) { return list[Math.floor(next() * list.length)]; },
            chance(p) { return next() < p; },
            shuffle(list) {
                const out = list.slice();
                for (let i = out.length - 1; i > 0; i--) {
                    const j = Math.floor(next() * (i + 1));
                    [out[i], out[j]] = [out[j], out[i]];
                }
                return out;
            },
            // weights: [{ item, weight }] or { key: weight }
            weighted(weights) {
                const entries = Array.isArray(weights)
                    ? weights.map(w => [w.item, w.weight])
                    : Object.entries(weights);
                const total = entries.reduce((s, [, w]) => s + Math.max(0, w), 0);
                let roll = next() * total;
                for (const [item, w] of entries) {
                    roll -= Math.max(0, w);
                    if (roll < 0) return item;
                }
                return entries[entries.length - 1][0];
            },
            fork(label) { return makeRng(hashSeed(String(a) + ':' + label)); },
            seed: a,
        };
        return rng;
    }

    // ---- small helpers -----------------------------------------------------

    const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

    function deepClone(value) {
        return value == null ? value : JSON.parse(JSON.stringify(value));
    }

    // Tiny event bus: Rift.bus.on('fog:lifted', fn); Rift.bus.emit('fog:lifted', data)
    const listeners = {};
    const bus = {
        on(name, fn) { (listeners[name] || (listeners[name] = [])).push(fn); return () => bus.off(name, fn); },
        off(name, fn) { listeners[name] = (listeners[name] || []).filter(f => f !== fn); },
        emit(name, data) { (listeners[name] || []).slice().forEach(fn => { try { fn(data); } catch (e) { console.error('[Rift]', name, e); } }); },
    };

    // DOM builder: el('div.panel#id', { onclick, style, dataset, html }, [children])
    function el(spec, props, children) {
        const doc = root.document;
        const m = /^([a-z0-9-]+)?((?:[.#][\w-]+)*)$/i.exec(spec) || [];
        const node = doc.createElement(m[1] || 'div');
        (m[2] || '').replace(/([.#])([\w-]+)/g, (_, kind, name) => {
            if (kind === '.') node.classList.add(name); else node.id = name;
        });
        if (props) {
            for (const [key, value] of Object.entries(props)) {
                if (value == null || value === false) continue;
                if (key === 'style' && typeof value === 'object') {
                    // setProperty handles custom properties ('--hue'), which Object.assign skips.
                    Object.entries(value).forEach(([k, v]) => {
                        if (k.startsWith('--')) node.style.setProperty(k, v);
                        else node.style[k] = v;
                    });
                }
                else if (key === 'dataset') Object.assign(node.dataset, value);
                else if (key === 'html') node.innerHTML = value;
                else if (key === 'text') node.textContent = value;
                else if (key.startsWith('on') && typeof value === 'function') node.addEventListener(key.slice(2), value);
                else if (key === 'className') { if (value) String(value).split(/\s+/).filter(Boolean).forEach(c => node.classList.add(c)); }
                // DOM properties (value, readOnly, maxLength, src…) must be set as properties:
                // a textarea's value attribute, for one, does nothing.
                else if (key in node) { try { node[key] = value; } catch (e) { node.setAttribute(key, value === true ? '' : value); } }
                else node.setAttribute(key, value === true ? '' : value);
            }
        }
        [].concat(children || []).forEach(child => {
            if (child == null || child === false) return;
            node.appendChild(typeof child === 'string' ? doc.createTextNode(child) : child);
        });
        return node;
    }

    // A result stays readable with sound muted and motion disabled. The caller owns settlement
    // and sound; rebuilding a saved result must never replay a reward or a victory jingle.
    function resultBanner(outcome, title, detail) {
        const make = (...args) => root.Rift.el(...args);
        return make('div.result-banner.' + outcome, { role: 'status', 'aria-live': 'polite' }, [
            make('span.result-emblem', { text: outcome === 'won' ? '★' : outcome === 'lost' ? '↻' : '=', 'aria-hidden': 'true' }),
            make('div.result-copy', null, [make('h2', { text: title }), detail ? make('p', { text: detail }) : null]),
        ]);
    }

    function storage() {
        try {
            const s = root.localStorage;
            const probe = '__rift_probe__';
            s.setItem(probe, '1');
            s.removeItem(probe);
            return s;
        } catch (e) {
            return null;
        }
    }

    // Voice lines are keyed by speaker + text, so editing a line's text makes it
    // fall back to browser speech until tools/voices.mjs renders it again.
    function voiceId(speaker, text) {
        const clean = String(text).replace(/\s+/g, ' ').trim();
        return speaker + '-' + hashSeed(speaker + '|' + clean).toString(36);
    }

    // Colours = Ways of Knowing. Colour first, name second (see ART-BIBLE.md).
    const COLOURS = {
        reason: { name: 'Reason', colour: 'blue', hex: '#3D7BFF', icon: '🧭' },
        emotion: { name: 'Emotion', colour: 'red', hex: '#E8384F', icon: '❤️‍🔥' },
        perception: { name: 'Sense perception', colour: 'green', hex: '#2FBF71', icon: '👁️' },
        language: { name: 'Language', colour: 'gold', hex: '#F2B632', icon: '🪶' },
        imagination: { name: 'Imagination', colour: 'violet', hex: '#A05CF0', icon: '🌀' },
        memory: { name: 'Memory', colour: 'silver', hex: '#C9C9D6', icon: '⏳' },
    };

    // What a caught creature's Changes (data/fate.js, issue #151) do to its card: summed attack,
    // health and cost deltas (cost kept within ±1; callers keep the cost at 1 or more) and the
    // newest sideways ability. Shared by the save (State), the battle engine and the ante.
    function changeEffect(inst) {
        const out = { attack: 0, health: 0, cost: 0, ability: null };
        const list = (inst && inst.changes) || [];
        if (!list.length) return out;
        const defs = Rift.data.fate.changes;
        list.forEach(ch => {
            const d = defs[ch.id];
            if (!d) return; // a Change from a newer copy of the game
            out.attack += d.attack || 0;
            out.health += d.health || 0;
            out.cost += d.cost || 0;
            if (d.sideways && ch.ability) out.ability = ch.ability;
        });
        out.cost = clamp(out.cost, -1, 1);
        return out;
    }

    // Presentation only: rarity never implies a catch weight, survival rule or copy limit.
    const rarityTiers = Object.freeze(Object.fromEntries([
        ['common', 'Common', 'C'], ['uncommon', 'Uncommon', 'U'], ['rare', 'Rare', 'R'],
        ['mythic', 'Mythic', 'M'], ['legendary', 'Legendary', 'L'],
    ].map(([id, label, mark], rank) => [id, Object.freeze({ id, label, mark, rank })])));
    const Rarity = {
        ids: Object.freeze(Object.keys(rarityTiers)),
        // Older definitions omitted rarity. Save/team payloads never set a card's tier.
        of: def => Object.prototype.hasOwnProperty.call(rarityTiers, (def || {}).rarity) ? rarityTiers[def.rarity] : rarityTiers.common,
        badge(def) {
            const r = Rarity.of(def);
            return Rift.el('span.rarity-badge', { dataset: { rarity: r.id }, title: r.label, 'aria-label': r.label + ' rarity' }, [
                Rift.el('span', { 'aria-hidden': 'true', text: r.mark }),
                Rift.el('span.rarity-name', { text: r.label }),
            ]);
        },
    };

    Object.assign(Rift, {
        version: '0.1.0',
        changeEffect,
        hashSeed,
        makeRng,
        voiceId,
        clamp,
        deepClone,
        bus,
        el,
        resultBanner,
        storage,
        COLOURS,
        Rarity,
        data: Rift.data || {},
    });
})(typeof window !== 'undefined' ? window : globalThis);
