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

    // One Mending restores an ability or one lost power point on an owned card.
    function mend(state,uid,injury){
        const c=state.creatures.find(x=>x.uid===uid);
        if(!c || !(state.items.mending>0) || !['no-ability','minus-one'].includes(injury) || !c.injuries.includes(injury))return false;
        if(injury==='minus-one'){
            c.powerDelta=(c.powerDelta||0)+1;
            if(c.powerDelta>=0)c.injuries=c.injuries.filter(x=>x!==injury);
        }else c.injuries=c.injuries.filter(x=>x!==injury);
        state.items.mending--;return true;
    }

    // One Trick Book teaches an owned creature one trick (replacing any earlier one).
    // Returns false, spending nothing, for a missing book, creature or trick, or the same trick again.
    function teach(state, uid, trick) {
        const c = (state.creatures || []).find(x => x.uid === uid);
        if (!c || !((state.items || {})['trick-book'] > 0) || !Rift.State.TRICKS.includes(trick) || c.taught === trick) return false;
        if (Rift.State.naturalKeywords(c).includes(trick)) return false; // e.g. Guard on a creature that already has Guard
        c.taught = trick;
        state.items['trick-book'] -= 1;
        return true;
    }

    // First win against a trainer: one Trick Book and, if any is left to earn, one tactic
    // (the trainer's own reward tactic first). Returns { items, tactic } or null if already claimed.
    function claimTrainerReward(state, trainerId) {
        const key = 'trainer-reward:' + trainerId;
        const t = (Rift.data.trainers || {})[trainerId];
        if (!t || state.flags[key]) return null;
        state.flags[key] = true;
        state.items['trick-book'] = (state.items['trick-book'] || 0) + 1;
        if (!Array.isArray(state.tactics)) state.tactics = [];
        const owned = Rift.State.ownedTactics(state);
        const earned = ((Rift.data.tacticDecks || {}).earned || []).filter(id => (Rift.data.tactics || {})[id]);
        const tactic = [t.rewardTactic].concat(earned).find(id => id && earned.includes(id) && !owned.includes(id)) || null;
        if (tactic) state.tactics.push(tactic);
        return { items: { 'trick-book': 1 }, tactic };
    }

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
        if (n.requiresFlag && !state.flags[n.requiresFlag]) return n.lockText || 'Not yet.';
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

    function spawnWeights(state, n, opts) {
        const o = opts || {};
        const lured = o.lured === undefined ? ((state.lures || {})[n.id] || 0) > 0 : o.lured;
        const stars = Rift.clamp(o.stars || 1, 1, 3);
        const out = {};
        (n.spawns || []).forEach(sp => {
            const c = Rift.data.creatures[sp];
            if (!c) return;
            if (c.rarity === 'legendary' && !state.flags['rumour:' + sp]) return;
            let w = Rift.data.rarities[c.rarity].weight;
            if (c.rarity === 'uncommon') w *= 1 + (stars - 1) * 0.2;
            if (c.rarity === 'rare' || c.rarity === 'legendary') {
                w *= 1 + (stars - 1) * 0.5;
                if (lured) w *= 2;
            }
            out[sp] = w;
        });
        return out;
    }

    // Arrival rolls the puzzle only. Capture the lure before spending its visit.
    function rollVisit(state, id) {
        const n = Object.assign({ id }, node(id));
        state.map.visitCount[id] = (state.map.visitCount[id] || 0) + 1;
        const rng = Rift.makeRng(state.seed + ':' + id + ':' + state.map.visitCount[id]);
        const puzzle = n.puzzles && n.puzzles.length ? rng.pick(n.puzzles) : null;
        const lured = !!(state.lures && state.lures[id] > 0);
        if (state.lures && state.lures[id] > 0) state.lures[id] -= 1;
        return { node: n, puzzle, lured, seed: rng.seed, rng };
    }

    // Call only after successful activity completion, with a separate seed.
    function rollLoot(state, n, rng, opts) {
        const o = opts || {};
        const stars = Rift.clamp(o.stars || 1, 1, 3);
        const base = n.type === 'boss' ? 0.75 : (n.type === 'miniboss' ? 0.65 : 0.5);
        const chance = Math.round((base + (stars - 1) * 0.075) * 1000) / 1000;
        const weights = spawnWeights(state, n, o);
        const species = Object.keys(weights).length && rng.chance(chance) ? rng.weighted(weights) : null;
        return { species, chance };
    }

    // ---- catching ---------------------------------------------------------------

    function catchOdds(state, speciesId, itemId, opts) {
        const o = opts || {};
        const c = Rift.data.creatures[speciesId];
        let p = Rift.data.rarities[c.rarity].catchBase;
        p += (Rift.data.items[itemId] || {}).catchBonus || 0;
        const av = state.avatar || {};
        if (av.type === 'fox' && (c.colour === 'language' || c.colour === 'imagination')) p += 0.1;
        p += (Rift.clamp(o.stars || 1, 1, 3) - 1) * 0.03;
        if (o.lured) p += 0.05;
        p = Rift.clamp(Math.round(p * 100) / 100, 0.05, 0.95);
        if (o.skillFailed) p *= 0.25;
        else p += Rift.clamp(o.skillBonus || 0, 0, 0.15);
        return Rift.clamp(Math.round(p * 100) / 100, 0.05, 0.95);
    }

    function rollCatch(state, speciesId, itemId, rng, opts) {
        const p = catchOdds(state, speciesId, itemId, opts);
        return { p, caught: rng.next() < p };
    }

    // ---- attempts: the same rule for every puzzle stage ------------------------
    function attempts(difficulty, avatar) {
        return { free: (difficulty === 1 ? 3 : 2) + (avatar && avatar.type === 'frogling' ? 1 : 0), wrong: 0 };
    }
    function recordWrong(counter) {
        counter.wrong += 1;
        return counter.wrong > counter.free ? 1 : 0;
    }
    function hintCost(state) { return state.scars.includes('shaky-hand') ? 2 : 1; }
    function solveStars(hints, wrongs) {
        if (!hints && !wrongs) return 3;
        return hints + wrongs <= 2 ? 2 : 1;
    }

    // ---- rewards -------------------------------------------------------------------

    function rewards(state, n, rng, opts) {
        const o = opts || {};
        const out = { xp: 0, items: {} };
        const give = (id, k) => { out.items[id] = (out.items[id] || 0) + (k || 1); };
        if (n.type === 'puzzle') {
            out.xp = 10;
            if (rng.chance(0.5)) give('charm');
            if (rng.chance(0.15)) give(rng.pick(['trickster-coin', 'heartstone']));
            if (rng.chance(0.05)) give('trick-book');
        } else if (n.type === 'miniboss') {
            out.xp = 25;
            give('charm', 2);
            give(rng.pick(['tonic', 'greatcharm', 'lure']));
            give(rng.pick(['trickster-coin', 'heartstone']));
            if (rng.chance(0.1)) give('trick-book');
        } else if (n.type === 'boss') {
            out.xp = 50;
            give('greatcharm', 2);
            give(rng.pick(['ward', 'anchor', 'mending']));
            give('trickster-coin');
            give('heartstone');
        }
        if (out.xp) out.xp += o.stars ? (o.stars - 1) * 5 : (o.noHints ? 5 : 0);
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

    // Unchecked bonus reports are worth less than checked puzzle wins, once only.
    function claimBonus(state, id) {
        const n = node(id);
        if (!n || n.type !== 'bonus' || !['blackbox', 'mines'].includes(n.bonus) || state.map.completed.includes(id)) return null;
        const reward = { xp: 5, items: { charm: 1 } };
        complete(state, id);
        applyRewards(state, reward);
        return reward;
    }

    // Accolades (art 'ui/badge-<id>'): earned for real achievements, shown in the collection.
    Rift.data.accolades = {
        'clear-thinker': { name: 'Clear Thinker', text: 'Solved puzzles without a single hint.' },
        'falsifier': { name: 'Falsifier', text: 'Ruled out alternative rules with test evidence.' },
        'truth-tabler': { name: 'Truth-Tabler', text: 'Found identities that fit every statement in the village.' },
        'unmasker': { name: 'Unmasker', text: 'Unmasked the Mayor of Boolesbury.' },
        'cross-examiner': { name: 'Cross-Examiner', text: 'Broke down an argument at the Tribunal.' },
        'chart-honest': { name: 'Chart Honest', text: 'Made a misleading chart tell the truth.' },
        'legend-hunter': { name: 'Legend Hunter', text: 'Caught a legendary thinker.' },
        'rift-walker': { name: 'Rift Walker', text: 'Closed the rift and came home.' },
    };

    // Returns true the first time an accolade is earned.
    function award(state, id) {
        if (!Rift.data.accolades[id] || state.accolades.includes(id)) return false;
        state.accolades.push(id);
        return true;
    }

    Rift.World = {
        award, attempts, recordWrong, hintCost, solveStars, mend, teach, claimTrainerReward,
        node, reveal, hinted, lockReason, start, complete, jumpToChapter,
        spawnWeights, rollVisit, rollLoot, catchOdds, rollCatch, rewards, applyRewards, level,
        completedPuzzlesInChapter, claimBonus,
    };
})(typeof window !== 'undefined' ? window : globalThis);
