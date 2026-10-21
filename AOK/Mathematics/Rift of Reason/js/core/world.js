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

    // One Trick Book teaches an owned creature one trick (replacing any earlier one).
    // Returns false, spending nothing, for a missing book, creature or trick, or the same trick again.
    function teach(state, uid, trick) {
        const c = (state.creatures || []).find(x => x.uid === uid);
        if (!c || !((state.items || {})['trick-book'] > 0) || !Rift.State.TRICKS.includes(trick) || c.taught === trick) return false;
        if (Rift.State.naturalKeywords(c).includes(trick)) return false; // e.g. Guard on a creature that already has Guard
        c.taught = trick;
        Rift.State.clampPower(c); // forgetting +1 attack never leaves attack below 0
        state.items['trick-book'] -= 1;
        return true;
    }

    // First win against a trainer: one Trick Book and, if any is left to earn, one tactic
    // (the trainer's own reward tactic first). Returns { items, tactic } or null if already claimed.
    // The uncommon colour tactic (data/tactics.js tacticDecks.colour[c][1]) of the colour most of the
    // trainer's team has, if not owned yet.
    function trainerUncommon(t, owned) {
        const byColour = (Rift.data.tacticDecks || {}).colour || {};
        const counts = {};
        (t.team || []).forEach(sp => { const c = ((Rift.data.creatures || {})[sp] || {}).colour; if (c) counts[c] = (counts[c] || 0) + 1; });
        const order = Object.keys(counts).sort((a, b) => counts[b] - counts[a] || a.localeCompare(b));
        for (const c of order) {
            const id = (byColour[c] || [])[1];
            if (id && (Rift.data.tactics || {})[id] && !owned.includes(id)) return id;
        }
        return null;
    }

    function claimTrainerReward(state, trainerId) {
        const key = 'trainer-reward:' + trainerId;
        const t = (Rift.data.trainers || {})[trainerId];
        if (!t || state.flags[key]) return null;
        state.flags[key] = true;
        state.items['trick-book'] = (state.items['trick-book'] || 0) + 1;
        if (!Array.isArray(state.tactics)) state.tactics = [];
        const owned = Rift.State.ownedTactics(state);
        const earned = ((Rift.data.tacticDecks || {}).earned || []).filter(id => (Rift.data.tactics || {})[id]);
        let tactic = [t.rewardTactic].concat(earned).find(id => id && earned.includes(id) && !owned.includes(id)) || null;
        // Every earned tactic owned already: the uncommon colour tactic of the trainer's main colour.
        if (!tactic) tactic = trainerUncommon(t, owned);
        if (tactic) Rift.State.grantTactic(tactic, state);
        let axiom = null;
        if (trainerId === 'constable' && (Rift.data.axioms || {}).infinity) {
            state.axioms = state.axioms || [];
            if (Rift.State.grantAxiom('infinity', state)) axiom = 'infinity';
        }
        const reward = { items: { 'trick-book': 1 }, tactic };
        if (axiom) reward.axiom = axiom;
        return reward;
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
            return (n.requiresText || 'Win ' + n.requires + ' games here first') + ' (' + completedPuzzlesInChapter(state, n.chapter) + ' so far).';
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

    // ---- station card rewards (#124) ---------------------------------------------------------------
    // A node's `cards` (data/map.js) names reward slots; the adventure's starter type has an ordered list
    // of candidate cards per slot (data/starters.js `rewards`: a tactic id or 'axiom:<id>'). The first
    // completion of ANY node with a slot grants the first candidate not owned yet, as an ordinary owned
    // unlock (save.tactics / save.axioms), and writes the receipt flags['card-reward:<slot>'] =
    // { v, node, kind, id } (kind and id null when every candidate was owned already). The receipt blocks
    // a second grant, so replays, other nodes with the same slot, reloads, backup codes and the catch-up
    // of older saves (catchUpCards) never pay twice. Stars, hints and wrong checks never change it.
    function cardTrack(state) {
        const D = (Rift.data || {}).starterDecks;
        const s = state || {};
        const type = (s.starter && s.starter.type) || (s.avatar && s.avatar.type);
        const deck = D && D.decks && D.decks[type];
        return deck ? Object.assign({}, D.sharedRewards || {}, deck.rewards) : null;
    }
    function cardRef(ref) {
        const m = /^axiom:(.+)$/.exec(String(ref));
        return m ? { kind: 'axiom', id: m[1] } : { kind: 'tactic', id: String(ref) };
    }
    function cardKnown(c) {
        if (c.kind === 'axiom') { const a = ((Rift.data || {}).axioms || {})[c.id]; return !!(a && !a.own); }
        return !!(((Rift.data || {}).tactics || {})[c.id]);
    }
    function cardOwned(state, c) {
        return c.kind === 'axiom' ? Rift.State.ownedAxioms(state).includes(c.id) : Rift.State.ownedTactics(state).includes(c.id);
    }
    // The node's slots this adventure has a track for and no receipt yet.
    function openCardSlots(state, id) {
        const n = node(id), track = cardTrack(state), flags = (state && state.flags) || {};
        if (!n || !Array.isArray(n.cards) || !track) return [];
        return n.cards.filter(slot => Array.isArray(track[slot]) && !flags['card-reward:' + slot]);
    }
    // Grants the node's open slots. Does not save; use inside State.update or on a save object.
    // → [{ slot, v, node, kind, id }] for the receipts written now (id null: nothing new to give).
    function claimCards(state, id) {
        const out = [];
        openCardSlots(state, id).forEach(slot => {
            const pick = cardTrack(state)[slot].map(cardRef).find(c => cardKnown(c) && !cardOwned(state, c)) || null;
            if (pick && pick.kind === 'tactic') Rift.State.grantTactic(pick.id, state);
            if (pick && pick.kind === 'axiom') {
                Rift.State.grantAxiom(pick.id, state);
            }
            const receipt = { v: ((Rift.data || {}).starterDecks || {}).rewardsVersion || 1, node: id, kind: pick ? pick.kind : null, id: pick ? pick.id : null };
            if (!state.flags) state.flags = {};
            state.flags['card-reward:' + slot] = receipt;
            out.push(Object.assign({ slot }, receipt));
        });
        return out;
    }
    // Older saves (before #124) and completions without an encounter: every completed node's open slots.
    function pendingCards(state) {
        return !!(state && state.map && (state.map.completed || []).some(id => openCardSlots(state, id).length));
    }
    function reconcileCards(state) {
        if (!pendingCards(state)) return [];
        return state.map.completed.reduce((out, id) => out.concat(claimCards(state, id)), []);
    }
    // Catch-up for the live save (boot, a loaded backup code, the previous save): pays each slot once,
    // saves, and announces 'cards:granted' when a card was new. → the receipts written now.
    function catchUpCards() {
        const s = Rift.State.get();
        if (!pendingCards(s)) return [];
        let got = [];
        Rift.State.update(st => { got = reconcileCards(st); });
        if (Rift.bus && got.some(r => r.id)) Rift.bus.emit('cards:granted', got);
        return got;
    }
    // The display name of a receipt's card.
    function cardName(r) {
        const defs = r.kind === 'axiom' ? (Rift.data.axioms || {}) : (Rift.data.tactics || {});
        return ((defs[r.id] || {}).name || r.id);
    }

    // Completing a node lifts the fog on its neighbours and pays its station card reward once.
    function complete(state, id) {
        const firstTime = !state.map.completed.includes(id);
        if (firstTime) state.map.completed.push(id);
        claimCards(state, id);
        (node(id).links || []).forEach(n => reveal(state, n));
        const ch = node(id).chapter;
        if (ch && ch !== state.chapter && !(Rift.data.chapters[ch] || {}).comingSoon) state.chapter = ch;
        reconcileWallet(state);
        return firstTime;
    }

    function jumpToChapter(state, chapterId) {
        const ch = Rift.data.chapters[chapterId];
        if (!ch || !ch.start) return false;
        reveal(state, ch.start);
        (node(ch.start).links || []).filter(id => node(id).chapter === chapterId).forEach(id => reveal(state, id));
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
            if (!c || c.roaming) return; // roaming legendaries (#111) come only from their trick challenge
            const rarity = Rift.data.rarities[c.rarity];
            if (!rarity || !(rarity.weight > 0) || !Number.isFinite(rarity.catchBase)) return;
            if (c.rarity === 'legendary' && !state.flags['rumour:' + sp]) return;
            // Legendaries are one of a kind: once you have it, it stops turning up.
            if (c.rarity === 'legendary' && (state.creatures || []).some(x => x && x.species === sp)) return;
            let w = rarity.weight;
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
        return { node: n, puzzle, lured, seed: rng.seed, rng, number: state.map.visitCount[id] };
    }

    // Call only after successful activity completion, with a separate seed.
    function rollLoot(state, n, rng, opts) {
        const o = opts || {};
        const stars = Rift.clamp(o.stars || 1, 1, 3);
        const base = n.type === 'boss' ? 0.75 : (n.type === 'miniboss' ? 0.65 : 0.5);
        const chance = Math.round((base + (stars - 1) * 0.075) * 1000) / 1000;
        // A side-story visitor (flag visitor:<species>) turns up at your next win until you own one.
        const visitor = Object.keys(state.flags || {}).filter(k => k.startsWith('visitor:') && state.flags[k]).map(k => k.slice(8))
            .find(sp => {
                const c = Rift.data.creatures[sp], rarity = c && Rift.data.rarities[c.rarity];
                return rarity && Number.isFinite(rarity.catchBase) && !(state.creatures || []).some(c => c.species === sp);
            });
        if (visitor) return { species: visitor, chance: 1, visitor: true };
        const weights = spawnWeights(state, n, o);
        const species = Object.keys(weights).length && rng.chance(chance) ? rng.weighted(weights) : null;
        return { species, chance };
    }

    // ---- catching ---------------------------------------------------------------

    function catchOdds(state, speciesId, itemId, opts) {
        const o = opts || {};
        const c = Rift.data.creatures[speciesId];
        const rarity = c && Rift.data.rarities[c.rarity];
        if (!rarity || !Number.isFinite(rarity.catchBase)) return 0;
        let p = rarity.catchBase;
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

    const CHAPTER_BOSSES = { ch1: 'gate', ch2: 'b-town-hall', ch3: 't-tribunal', ch4: 'k-core' };
    // Called only by a successfully completed checked encounter, before complete(). Generic story,
    // bonus, rest and Settings paths never call this. One high-water receipt per node bounds the save.
    function claimVisitCoins(state, id, visitNumber, checked) {
        const n = node(id);
        if (checked !== true || !n || !['puzzle', 'miniboss', 'boss'].includes(n.type)
            || !Number.isSafeInteger(visitNumber) || visitNumber <= 0 || visitNumber !== state.map.visitCount[id]) return null;
        const w = Rift.State.walletOf(state), previous = w.visits[id] || 0;
        if (visitNumber <= previous) return null;
        const first = !previous && !state.map.completed.includes(id);
        const amount = first ? (n.type === 'puzzle' ? 10 : 25) : 2;
        if (!Number.isSafeInteger(w.coins) || w.coins < 0 || !Number.isSafeInteger(w.coins + amount)) return null;
        w.coins += amount;
        w.visits[id] = visitNumber;
        return { node: id, visit: visitNumber, first, coins: amount };
    }
    // Chapter packs remain an unclaimed entitlement until usable pack rewards exist (#136).
    // Legacy completions get their entitlement, without inventing retroactive visit income.
    function reconcileWallet(state) {
        const w = Rift.State.walletOf(state);
        let earned = 0;
        Object.entries(CHAPTER_BOSSES).forEach(([chapter, id]) => {
            if (!state.map.completed.includes(id) || w.chapters[chapter] || !Number.isSafeInteger(w.freePacks + 1)) return;
            w.chapters[chapter] = true; w.freePacks += 1; earned++;
        });
        return earned;
    }
    function catchUpWallet() {
        const s = Rift.State.get();
        if (!s || !Object.entries(CHAPTER_BOSSES).some(([chapter, id]) => s.map.completed.includes(id) && !(s.wallet && s.wallet.chapters || {})[chapter])) return 0;
        let count = 0;
        Rift.State.update(st => { count = reconcileWallet(st); });
        return count;
    }

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
        // Mini-bosses and bosses teach a new tactic card the first time they are beaten.
        if (o.firstTime && (n.type === 'miniboss' || n.type === 'boss')) {
            const owned = Rift.State.ownedTactics(state);
            out.tactic = ((Rift.data.tacticDecks || {}).earned || []).find(id => !owned.includes(id)) || null;
        }
        return out;
    }

    function applyRewards(state, r) {
        state.xp += r.xp;
        Object.entries(r.items).forEach(([id, k]) => { state.items[id] = (state.items[id] || 0) + k; });
        if (r.tactic && !Rift.State.ownedTactics(state).includes(r.tactic)) Rift.State.grantTactic(r.tactic, state);
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

    // Tweak slots for the avatar's power (design/AVATARS.md 1.3): one per chapter boss beaten (the Gate,
    // the Town Hall, the Tribunal), up to three. A jump into a later chapter counts the bosses before it,
    // so a student who skipped ahead (the time-rift starter kit) is not behind.
    const TWEAK_BOSSES = ['gate', 'b-town-hall', 't-tribunal'];
    const CHAPTER_ORDER = ['ch1', 'ch2', 'ch3', 'ch4'];
    function tweakSlots(state) {
        const map = state.map || {};
        const won = TWEAK_BOSSES.filter(id => (map.completed || []).includes(id)).length;
        const jumped = Math.max(0, ...(map.rifts || []).map(c => CHAPTER_ORDER.indexOf(c)));
        return Math.min(3, Math.max(won, jumped));
    }

    Rift.World = {
        tweakSlots,
        award, attempts, recordWrong, hintCost, solveStars, teach, claimTrainerReward,
        node, reveal, hinted, lockReason, start, complete, jumpToChapter,
        spawnWeights, rollVisit, rollLoot, catchOdds, rollCatch, rewards, applyRewards, level,
        completedPuzzlesInChapter, claimBonus,
        claimVisitCoins, reconcileWallet, catchUpWallet,
        cardTrack, openCardSlots, claimCards, pendingCards, reconcileCards, catchUpCards, cardName,
    };
})(typeof window !== 'undefined' ? window : globalThis);
