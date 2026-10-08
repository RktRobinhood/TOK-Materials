/*
 * Stakes clocks (STORY.md Appendix C, design/SCRIPT-FORMAT.md section 8). Pure rules: the clock's
 * notches live in the save as flags['clock:<id>'] = { n, size, paused, done, tier, progress, started }.
 * Definitions are data: Rift.data.clocks[id] = { label, size, node, floors, peril, hold, warn, full, brink… }.
 *
 *   Rift.Stakes.start('ch1', 0)
 *   Rift.Stakes.tick('ch1', 1)   → { warn: [steps] | null, outcome: null | 'full' | 'brink' | 'hold', tier }
 *   Rift.Stakes.resolve('ch1')   → the tier stored in stakes.ch1 (1–4)
 *
 * The UI (js/ui/stakes.js, js/ui/dialogue.js) plays the returned steps; this file never touches the DOM.
 */
(function (root) {
    'use strict';

    const Rift = root.Rift;
    const S = () => Rift.Story;

    function def(id) { return ((Rift.data || {}).clocks || {})[id] || null; }
    function key(id) { return 'clock:' + id; }
    function get(id) {
        const s = Rift.State && Rift.State.get();
        const v = s && s.flags[key(id)];
        return v && typeof v === 'object' ? v : null;
    }
    function put(id, value) {
        Rift.State.update(s => { s.flags[key(id)] = value; });
        if (Rift.bus) Rift.bus.emit('stakes:changed', { id, clock: value });
    }
    function size(id) { const d = def(id); return (d && d.size) || 6; }
    function stakesId(id) { const d = def(id); return (d && d.stakes) || id; }
    function danger(id) { const c = get(id); return c ? c.n : 0; }

    // Highest Danger of tiers 1, 2 and 3 (STORY.md App. C): 8 → 0–3 · 4–5 · 6–7 · 8; 6 → 0–1 · 2–3 · 4–5 · 6.
    function bands(id) {
        const d = def(id) || {};
        if (d.tiers) return d.tiers;
        const n = size(id);
        return n === 8 ? [3, 5, 7] : n === 6 ? [1, 3, 5] : [Math.floor(n / 4), Math.floor(n / 2), n - 1];
    }
    function tierOf(id, n) {
        const b = bands(id);
        const v = n == null ? danger(id) : n;
        if (v >= size(id)) return 4;
        return v <= b[0] ? 1 : v <= b[1] ? 2 : v <= b[2] ? 3 : 4;
    }

    function start(id, at) {
        const d = def(id);
        if (!d) { console.warn('[Rift] No clock definition: ' + id); return null; }
        const old = get(id);
        if (old && old.started) return old;   // a replayed script never restarts a clock
        let n = Number(at) || 0;
        if (typeof d.prefill === 'function') {
            try { n += Number(d.prefill((Rift.State.get() || {}).flags || {})) || 0; } catch (e) { console.warn('[Rift] prefill', id, e); }
        }
        const c = { n: Rift.clamp(n, 0, size(id)), size: size(id), paused: false, done: false, tier: null, progress: 0, started: true };
        put(id, c);
        return c;
    }

    const running = c => !!(c && c.started && !c.done);

    // Store the tier: stakes.<id>, and the Feed (tier 1: −1, tier 3: +1, tier 4: +2).
    function record(id, tier) {
        Rift.State.update(s => { s.flags['stakes.' + stakesId(id)] = tier; });
        const feed = tier === 1 ? -1 : tier === 3 ? 1 : tier >= 4 ? 2 : 0;
        if (feed) S().addFeed(feed);
    }

    // Close a clock at this tier: a peril runs through the cast (arming, dead:, risked:, quiet:).
    function close(id, tier) {
        const d = def(id) || {};
        const c = Object.assign({}, get(id));
        let played = tier;
        if (d.peril && Rift.Cast) played = Rift.Cast.resolvePeril(d.peril, id, tier);
        c.done = true;
        c.tier = played;
        put(id, c);
        record(id, played);
        return played;
    }

    // Fill notches. Returns what the UI should play: the warning for the last notch filled,
    // or the outcome when the clock fills ('full' = armed death / tier 4, 'brink' = disarmed,
    // 'hold' = a hold clock just reached full).
    function tick(id, k, opts) {
        const c = get(id);
        const d = def(id) || {};
        const none = { warn: null, outcome: null, tier: null, filled: 0 };
        if (!running(c) || c.paused) return none;
        const max = size(id);
        if (c.n >= max) return none;
        const before = c.n;
        const n = Rift.clamp(before + (k == null ? 1 : k), 0, max);
        put(id, Object.assign({}, c, { n }));
        const out = { warn: null, outcome: null, tier: null, filled: n - before };
        if (n >= max) {
            if (d.hold) { out.outcome = 'hold'; return out; }
            const played = close(id, 4);
            out.tier = played;
            out.outcome = played >= 4 ? 'full' : 'brink';
            return out;
        }
        if (!(opts && opts.silent)) {
            const list = d.warn || [];
            if (list.length) {
                const w = list[Math.min(n, list.length) - 1];
                out.warn = Array.isArray(w) ? w : [w];
            }
        }
        return out;
    }

    function drain(id, k) {
        const c = get(id);
        if (!running(c)) return 0;
        const n = Math.max(0, c.n - (k == null ? 1 : k));
        put(id, Object.assign({}, c, { n }));
        return c.n - n;
    }
    function pause(id, on) {
        const c = get(id);
        if (!running(c)) return;
        put(id, Object.assign({}, c, { paused: on !== false }));
    }
    function progress(id, k) {
        const c = get(id);
        const d = def(id) || {};
        if (!running(c) || !d.progress) return;
        put(id, Object.assign({}, c, { progress: Math.min(d.progress, (c.progress || 0) + (k == null ? 1 : k)) }));
    }

    // Read the tier (normally first in the boss's .win script). Already closed: the stored tier.
    function resolve(id) {
        const c = get(id);
        if (c && c.done) return c.tier;
        if (!c) return null;
        return close(id, tierOf(id, c.n));
    }

    // Clocks to draw: started and not closed (paused ones too).
    function active() {
        const flags = ((Rift.State && Rift.State.get()) || {}).flags || {};
        return Object.keys(flags).filter(k => k.startsWith('clock:')).map(k => k.slice(6))
            .filter(id => def(id) && running(get(id)));
    }
    const listHas = (v, id) => [].concat(v || []).includes(id);
    // The running, unpaused clocks bound to a node: { scene, floor } clock ids or null.
    function forNode(nodeId) {
        const out = { scene: null, floor: null };
        active().forEach(id => {
            const c = get(id), d = def(id);
            if (c.paused) return;
            if (!out.scene && listHas(d.node, nodeId)) out.scene = id;
            else if (!out.floor && listHas(d.floors, nodeId)) out.floor = id;
        });
        return out;
    }

    Rift.Stakes = { def, get, danger, size, bands, tierOf, start, tick, drain, pause, progress, resolve, active, forNode, stakesId };
})(typeof window !== 'undefined' ? window : globalThis);
