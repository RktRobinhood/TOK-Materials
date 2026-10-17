/*
 * Roaming legendary hunts (#111, design/ROAMING-LEGENDARIES.md): the save rules, kept pure.
 *
 * One record per hunt in save.hunts[id] (data/legendaries.js), made the first time the hunt is found:
 *   { v, phase: 'roaming'|'claimed', node, from, attempt, round, fails, practice, resting,
 *     departure: { attempt, from, to, tier, seen } | null, claimed: { uid, at, node, attempt } | null, found }
 * - node: the map node where the creature waits now. Its normal station is untouched; the hunt never
 *   writes map.completed, map.revealed, flags or the chapter, so ignoring every hunt changes nothing.
 * - attempt: the current run. The run's rounds are generated from (save seed, hunt, attempt), so a reload
 *   shows the same rounds; round = how many rounds of this run are passed (a voluntary exit keeps it).
 * - A wrong answer (fail) resets the run, picks and stores the next site ONCE, and records the departure.
 *   The guard (attempt + node) makes a repeated submission a no-op, so nothing relocates twice.
 * - claimed is the permanent receipt: it, not collection ownership, blocks a second creature.
 *
 * Every function changes the save object it is given and does not save; call inside Rift.State.update.
 */
(function (root) {
    'use strict';

    const Rift = root.Rift;
    const VERSION = 1;
    // Rounds in one run; the same number as Rift.Tricks.ROUNDS (js/core/tricks.js, a test checks).
    // Twelve since 17 Oct 2026 (was three): legendaries are a gauntlet. A save mid-run keeps its
    // round count and simply has more rounds to go.
    const ROUNDS = 12;
    // Node types a creature never waits on: bosses (their chain) and rifts (portals that move the avatar).
    const BARRED = ['boss', 'rift'];

    const defs = () => (Rift.data && Rift.data.hunts) || {};
    const def = id => defs()[id] || null;
    const node = id => (((Rift.data || {}).map || {}).nodes || {})[id] || null;
    const mapOf = id => { const n = node(id); return n ? (n.map || 'main') : null; };
    const hunts = s => (s.hunts && typeof s.hunts === 'object' && !Array.isArray(s.hunts) ? s.hunts : (s.hunts = {}));
    const record = (s, id) => (s && s.hunts && s.hunts[id]) || null;
    const placeName = id => (node(id) || {}).name || id;

    // A node the avatar can stand on or walk through: revealed, on this painted map, not locked.
    function walkable(s, id, mapId) {
        const n = node(id);
        if (!n || mapOf(id) !== mapId || !s.map.revealed.includes(id)) return false;
        return !(Rift.World && Rift.World.lockReason(s, id));
    }
    // Nodes reachable from `from` through walkable nodes on its map (BFS), as an ordered list.
    function reachable(s, from, mapId) {
        if (!node(from) || mapOf(from) !== mapId) return [];
        const seen = [from], queue = [from];
        while (queue.length) {
            const cur = queue.shift();
            (node(cur).links || []).forEach(n => {
                if (!seen.includes(n) && walkable(s, n, mapId)) { seen.push(n); queue.push(n); }
            });
        }
        return seen;
    }
    // The shortest walkable route between two nodes (for the departure trail), or null.
    function path(s, from, to) {
        const mapId = mapOf(from);
        if (!mapId || mapOf(to) !== mapId) return null;
        const prev = { [from]: null }, queue = [from];
        while (queue.length) {
            const cur = queue.shift();
            if (cur === to) break;
            (node(cur).links || []).forEach(n => { if (!(n in prev) && walkable(s, n, mapId)) { prev[n] = cur; queue.push(n); } });
        }
        if (!(to in prev)) return null;
        const out = [];
        for (let c = to; c; c = prev[c]) out.unshift(c);
        return out;
    }
    const legalType = id => { const n = node(id); return !!n && !BARRED.includes(n.type); };

    // The hunt's authored sites a creature could stand on now, seen from `from` (stable order).
    function legalSites(s, id, from) {
        const d = def(id);
        if (!d || !from) return [];
        const reach = reachable(s, from, d.map);
        return d.sites.filter(n => reach.includes(n) && walkable(s, n, d.map) && legalType(n));
    }

    // Where a creature fleeing from `from` goes, without changing anything → { to, tier }.
    // tier 'roam': another authored site (never `from`, and not straight back where it came from when
    // anything else is legal). 'fallback': no other authored site is legal, so any other walkable,
    // reachable, non-boss, non-rift node on the map. 'hide': nothing else at all; it stays at `from`
    // and hides until the avatar has walked somewhere else. The choice is seeded by the attempt.
    function destination(s, id, from) {
        const d = def(id), rec = record(s, id);
        const rng = Rift.makeRng(String(s.seed) + ':hunt:' + id + ':flee:' + (rec ? rec.attempt : 0));
        let pool = legalSites(s, id, from).filter(n => n !== from);
        const fresh = pool.filter(n => !rec || n !== rec.from);
        if (fresh.length) pool = fresh;
        if (pool.length) return { to: rng.pick(pool), tier: 'roam' };
        const reach = reachable(s, from, d.map);
        const any = Object.keys(((Rift.data || {}).map || {}).nodes || {}).filter(n => n !== from && reach.includes(n) && legalType(n));
        if (any.length) return { to: rng.pick(any), tier: 'fallback' };
        return { to: from, tier: 'hide' };
    }

    // Finds hunts on the avatar's map with at least two legal sites (so a flight is always possible).
    // Also lets a hiding creature come back once the avatar stands elsewhere. → ids found just now.
    function sync(s) {
        if (!s || !s.map) return [];
        const found = [];
        Object.keys(defs()).forEach(id => {
            const d = def(id), rec = record(s, id);
            if (rec) {
                if (rec.resting && s.map.at !== rec.node) rec.resting = false;
                // Caught up: the trail of a departure the map has shown ends once the avatar stands there.
                if (rec.departure && rec.departure.seen && s.map.at === rec.node && !rec.resting) rec.departure = null;
                return;
            }
            if (mapOf(s.map.at) !== d.map) return;
            const sites = legalSites(s, id, s.map.at);
            if (sites.length < 2) return;
            hunts(s)[id] = { v: VERSION, phase: 'roaming', node: sites[0], from: null, attempt: 1, round: 0, fails: 0, practice: 0,
                resting: false, departure: null, claimed: null, found: Date.now() };
            found.push(id);
        });
        return found;
    }

    // Would sync(s) change anything? (Read-only, so the map saves only when something changed.)
    function needsSync(s) {
        if (!s || !s.map) return false;
        return Object.keys(defs()).some(id => {
            const d = def(id), rec = record(s, id);
            if (rec) return (rec.resting && s.map.at !== rec.node) || !!(rec.departure && rec.departure.seen && s.map.at === rec.node && !rec.resting);
            return mapOf(s.map.at) === d.map && legalSites(s, id, s.map.at).length >= 2;
        });
    }

    // Hunt ids whose creature waits at this node now.
    function at(s, nodeId) {
        return Object.keys(defs()).filter(id => { const r = record(s, id); return r && r.node === nodeId; });
    }

    // May the avatar open this hunt's challenge here? → { ok, practice, reason }
    function canAttempt(s, id, nodeId) {
        const d = def(id), rec = record(s, id), name = d && ((Rift.data.creatures || {})[d.species] || {}).name || id;
        if (!d || !rec) return { ok: false, reason: 'Nobody is here.' };
        if (rec.node !== nodeId) return { ok: false, reason: name + ' is not here now. It ran to ' + placeName(rec.node) + '.' };
        if (s.map.at !== nodeId) return { ok: false, reason: 'Walk to ' + placeName(nodeId) + ' first.' };
        if (rec.resting) return { ok: false, reason: name + ' is hiding. Walk to another place, then come back.' };
        return { ok: true, practice: rec.phase === 'claimed' };
    }

    // The seed of the run on screen now: the attempt for a real run, the practice count after the claim.
    function runSeed(s, id) {
        const rec = record(s, id);
        if (!rec) return null;
        return String(s.seed) + ':hunt:' + id + (rec.phase === 'claimed' ? ':practice:' + rec.practice : ':run:' + rec.attempt);
    }

    // One round passed in the current run. Ignored for an old attempt or a round already counted.
    function pass(s, id, attempt, round) {
        const rec = record(s, id);
        if (!rec || rec.phase !== 'roaming' || rec.attempt !== attempt || rec.round !== round || round >= ROUNDS) return false;
        rec.round = round + 1;
        return true;
    }

    // A submitted wrong answer: reset the run and send the creature away. Commits the destination once;
    // a second call for the same attempt (double click, reload, replayed event) changes nothing.
    // → { from, to, tier } or null.
    function fail(s, id, attempt, nodeId) {
        const rec = record(s, id);
        if (!rec || rec.phase !== 'roaming' || rec.attempt !== attempt || rec.node !== nodeId) return null;
        const dest = destination(s, id, nodeId);
        rec.departure = { attempt, from: nodeId, to: dest.to, tier: dest.tier, seen: false };
        rec.from = nodeId;
        rec.node = dest.to;
        rec.attempt = attempt + 1;
        rec.round = 0;
        rec.fails = (rec.fails || 0) + 1;
        rec.resting = dest.tier === 'hide';
        return { from: nodeId, to: dest.to, tier: dest.tier };
    }

    // After the last round is passed (round === ROUNDS): grants the creature exactly once. The receipt rec.claimed is permanent, so
    // a repeat, a reload or a released creature can never grant another. → the receipt or null.
    function claim(s, id, attempt) {
        const d = def(id), rec = record(s, id);
        if (!d || !rec || rec.claimed || rec.phase !== 'roaming' || rec.attempt !== attempt || rec.round < ROUNDS) return null;
        if (!Array.isArray(s.creatures)) s.creatures = [];
        if (!Array.isArray(s.seen)) s.seen = [];
        const taken = new Set(s.creatures.concat(s.trophies || []).map(c => c && c.uid));
        let uid = 'legend-' + id + '-' + ((s.seed >>> 0) || 0).toString(36);
        while (taken.has(uid)) uid += 'x';
        // A unique creature: no luck roll, so every classmate's Maskip has the same card.
        s.creatures.push(Rift.State.makeCreature(d.species, { uid, variant: { attack: 0, health: 0, trait: null } }));
        if (!s.seen.includes(d.species)) s.seen.push(d.species);
        rec.claimed = { uid, at: Date.now(), node: rec.node, attempt };
        rec.phase = 'claimed';
        rec.round = 0;
        rec.departure = null;
        return rec.claimed;
    }

    // A finished practice run after the claim (a new practice seed next time; never a reward).
    function practiced(s, id) {
        const rec = record(s, id);
        if (!rec || rec.phase !== 'claimed') return false;
        rec.practice = (rec.practice || 0) + 1;
        return true;
    }

    // The map has shown (or, with reduced motion, stated) this departure.
    function seen(s, id) {
        const rec = record(s, id);
        if (!rec || !rec.departure || rec.departure.seen) return false;
        rec.departure.seen = true;
        return true;
    }

    // True for species that only come from a hunt.
    function roaming(species) {
        return Object.values(defs()).some(d => d.species === species);
    }

    // One plain sentence about where a hunt stands, for the map note and the bench.
    function status(s, id) {
        const d = def(id), rec = record(s, id);
        const name = d && ((Rift.data.creatures || {})[d.species] || {}).name || id;
        if (!rec) return null;
        if (rec.phase === 'claimed') return name + ' joined you. Visit ' + placeName(rec.node) + ' to practise its tricks.';
        if (rec.resting) return name + ' is hiding at ' + placeName(rec.node) + '. Walk to another place, then come back.';
        if (rec.departure) return name + ' ran from ' + placeName(rec.departure.from) + ' to ' + placeName(rec.node) + '. Walk there to try again.';
        return name + ' waits at ' + placeName(rec.node) + '. Its challenge is optional.';
    }

    Rift.Hunts = { VERSION, ROUNDS, def, defs, record, mapOf, legalSites, reachable, path, destination, sync, needsSync, at, canAttempt,
        runSeed, pass, fail, claim, practiced, seen, roaming, status, placeName };
})(typeof window !== 'undefined' ? window : globalThis);
