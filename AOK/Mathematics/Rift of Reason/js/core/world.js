/*
 * World rules: fog of war, what a visit rolls, catch odds, rewards, chapter jumps.
 * Works on the live state (Rift.State) but keeps the maths in small pure
 * functions so tools/test/world.test.mjs can check it.
 */
(function (root) {
    'use strict';

    const Rift = root.Rift;

    function nodes() { return Rift.data.map.nodes; }
    function node(id) { return nodes()[id]; }

    // ---- fog of war ------------------------------------------------------------
    // revealed: you can see and enter it. hinted: a fogged silhouette next to a
    // revealed node, showing only its teaser on hover.

    function reveal(state, id) {
        if (!state.map.revealed.includes(id)) state.map.revealed.push(id);
    }

    function hinted(state) {
        const out = new Set();
        state.map.revealed.forEach(id => (node(id).links || []).forEach(n => {
            if (!state.map.revealed.includes(n)) out.add(n);
        }));
        return [...out];
    }

    function completedPuzzlesInChapter(state, chapter) {
        return state.map.completed.filter(id => node(id).chapter === chapter && ['puzzle', 'miniboss', 'boss'].includes(node(id).type)).length;
    }

    function lockReason(state, id) {
        const n = node(id);
        if (n.requires && completedPuzzlesInChapter(state, n.chapter) < n.requires) {
            return 'Win ' + n.requires + ' games here first (' + completedPuzzlesInChapter(state, n.chapter) + ' so far).';
        }
        const ch = Rift.data.chapters[n.chapter];
        if (ch && ch.comingSoon && n.type !== 'rift') return 'Opens in a later lesson.';
        return null;
    }

    function start(state) {
        const first = Rift.data.chapters.prologue.start;
        state.map.at = first;
        reveal(state, first);
    }

    // Completing a node lifts the fog on its neighbours.
    function complete(state, id) {
        const firstTime = !state.map.completed.includes(id);
        if (firstTime) state.map.completed.push(id);
        (node(id).links || []).forEach(n => reveal(state, n));
        const ch = node(id).chapter;
        if (ch && ch !== state.chapter && !(Rift.data.chapters[ch] || {}).comingSoon) state.chapter = ch;
        return firstTime;
    }

    function jumpToChapter(state, chapterId) {
        const ch = Rift.data.chapters[chapterId];
        if (!ch || !ch.start) return false;
        reveal(state, ch.start);
        state.map.at = ch.start;
        state.chapter = chapterId;
        const firstJump = !state.map.rifts.includes(chapterId);
        if (firstJump) {
            state.map.rifts.push(chapterId);
            // Starter kit, once per chapter, so a fresh or absent student isn't empty-handed.
            state.items.charm = (state.items.charm || 0) + 3;
            state.items.tonic = (state.items.tonic || 0) + 1;
            const common = Object.entries(Rift.data.creatures).find(([sp, c]) => c.rarity === 'common' && !state.creatures.some(x => x.species === sp));
            if (common && state.creatures.length < 3) state.creatures.push(Rift.State.makeCreature(common[0]));
        }
        return firstJump;
    }

    // ---- visits ------------------------------------------------------------------

    function spawnWeights(state, n) {
        const lureLeft = (state.lures || {})[n.id] || 0;
        const out = {};
        (n.spawns || []).forEach(sp => {
            const c = Rift.data.creatures[sp];
            if (!c) return;
            if (c.rarity === 'legendary' && !state.flags['rumour:' + sp]) return;
            let w = Rift.data.rarities[c.rarity].weight;
            if (lureLeft > 0 && (c.rarity === 'rare' || c.rarity === 'legendary')) w *= 2;
            out[sp] = w;
        });
        return out;
    }

    // Rolls what this visit holds: which puzzle variant and which obstacle.
    function rollVisit(state, id) {
        const n = Object.assign({ id }, node(id));
        state.map.visitCount[id] = (state.map.visitCount[id] || 0) + 1;
        const rng = Rift.makeRng(state.seed + ':' + id + ':' + state.map.visitCount[id]);
        const puzzle = n.puzzles && n.puzzles.length ? rng.pick(n.puzzles) : null;
        const weights = spawnWeights(state, n);
        const obstacle = Object.keys(weights).length ? rng.weighted(weights) : null;
        if (state.lures && state.lures[id] > 0) state.lures[id] -= 1;
        return { node: n, puzzle, obstacle, seed: rng.seed, rng };
    }

    // ---- catching ---------------------------------------------------------------

    function catchOdds(state, speciesId, itemId) {
        const c = Rift.data.creatures[speciesId];
        let p = Rift.data.rarities[c.rarity].catchBase;
        p += (Rift.data.items[itemId] || {}).catchBonus || 0;
        const av = state.avatar || {};
        if (av.type === 'fox' && (c.colour === 'language' || c.colour === 'imagination')) p += 0.1;
        // A clean solve (no hints) steadies the throw.
        return Rift.clamp(Math.round(p * 100) / 100, 0.05, 0.95);
    }

    function rollCatch(state, speciesId, itemId, rng) {
        const p = catchOdds(state, speciesId, itemId);
        return { p, caught: rng.next() < p };
    }

    // ---- rewards -------------------------------------------------------------------

    function rewards(state, n, rng, opts) {
        const o = opts || {};
        const out = { xp: 0, items: {} };
        const give = (id, k) => { out.items[id] = (out.items[id] || 0) + (k || 1); };
        if (n.type === 'puzzle') {
            out.xp = 10;
            if (rng.chance(0.5)) give('charm');
        } else if (n.type === 'miniboss') {
            out.xp = 25;
            give('charm', 2);
            give(rng.pick(['tonic', 'greatcharm', 'lure']));
        } else if (n.type === 'boss') {
            out.xp = 50;
            give('greatcharm', 2);
            give(rng.pick(['ward', 'anchor', 'mending']));
        }
        if (o.noHints && out.xp) out.xp += 5;
        if (o.firstTime && out.xp) give('charm');
        if (n.type === 'boss' && state.avatar && state.avatar.type === 'raven') give(rng.pick(['ward', 'tonic', 'lure']));
        return out;
    }

    function applyRewards(state, r) {
        state.xp += r.xp;
        Object.entries(r.items).forEach(([id, k]) => { state.items[id] = (state.items[id] || 0) + k; });
    }

    function level(state) {
        return 1 + Math.floor(Math.sqrt(state.xp / 20));
    }

    Rift.World = {
        node, reveal, hinted, lockReason, start, complete, jumpToChapter,
        spawnWeights, rollVisit, catchOdds, rollCatch, rewards, applyRewards, level,
        completedPuzzlesInChapter,
    };
})(typeof window !== 'undefined' ? window : globalThis);
