/* Atomic weighted card packs (#136). A purchase validates, computes every card, then saves
 * Coins, owned copies and one receipt in a single durable write before anything is shown.
 * A reveal (#134) only plays back the saved receipt; it never rolls. */
(function (root) {
    'use strict';
    const Rift = root.Rift;
    // Approved starting tuning (ECONOMY-DRAFT.md, 14 Oct; foil is the 4% builder choice, #151).
    // Any change to these numbers needs a new version so a saved receipt keeps its own rules.
    const CONFIG = Object.freeze({
        version: 1, size: 5, unit: 10, foil: 0.04,
        totals: Object.freeze({ common: 0.65, uncommon: 0.23, rare: 0.09, mythic: 0.025, legendary: 0.005 }),
    });
    const KINDS = Object.freeze({ creature: 'creatures', tactic: 'tactics', axiom: 'axioms' });
    const LABELS = Object.freeze({ creature: 'creature', tactic: 'spell', axiom: 'Axiom' });

    // Released, explicitly pack-eligible IDs only. Story rewards stay out forever (Acquisition).
    // Waiting cards join only once this adventure has its two lessons (Acquisition.usable, #148).
    // Ownership never decides membership; it only decides room. → [{ kind, id, rarity, weight }]
    function roster(save) {
        const A = Rift.Acquisition, out = [], s = save === undefined ? Rift.State.get() : save;
        if (!A) return out;
        Object.entries(KINDS).forEach(([kind, key]) => {
            const defs = (Rift.data || {})[key] || {};
            Object.keys(defs).sort().forEach(id => {
                const d = defs[id];
                if (!d || d.own || typeof d.release !== 'string' || !d.release || !A.packEligible(kind, id) || !A.usable(kind, id, s)) return;
                out.push({ kind, id, rarity: Rift.Rarity.of(d).id });
            });
        });
        // Fixed per-ID weight: the rarity's approved total shared by its released IDs. A rarity with
        // no released IDs is simply absent; draws renormalise over what is left.
        const count = {};
        out.forEach(e => { count[e.rarity] = (count[e.rarity] || 0) + 1; });
        out.forEach(e => { e.weight = (CONFIG.totals[e.rarity] || 0) / count[e.rarity]; });
        return out.filter(e => e.weight > 0);
    }
    // The pool version names the exact roster and tuning, so a quote cannot be paid under other odds.
    function version(list) {
        const text = JSON.stringify([CONFIG, (list || roster()).map(e => [e.kind, e.id, e.rarity])]);
        return 'packs-' + CONFIG.version + '-' + Rift.hashSeed(text).toString(36);
    }
    // Free copies left in a folder. Legacy excess copies count as full, never negative.
    function room(s, e) {
        return e.kind === 'creature' ? Rift.State.roomFor(s, e.id) : Rift.State.cardRoom(e.kind, e.id, s);
    }
    function eligible(s, list) { return (list || roster(s)).filter(e => room(s, e) > 0); }
    // Chance that the NEXT card is each rarity, over the eligible IDs only.
    function odds(s, list) {
        const open = eligible(s, list), total = open.reduce((n, e) => n + e.weight, 0);
        return Rift.Rarity.ids.map(rarity => {
            const ids = open.filter(e => e.rarity === rarity);
            return { rarity, label: Rift.Rarity.of({ rarity }).label, ids: ids.length, chance: total ? ids.reduce((n, e) => n + e.weight, 0) / total : 0 };
        }).filter(row => row.ids);
    }

    // Free draws waiting: leftover cards from a free pack opened with little room come first.
    function freeSize(w, slots) {
        if (w.freeCards > 0) return Math.min(w.freeCards, CONFIG.size, slots);
        return w.freePacks > 0 ? Math.min(CONFIG.size, slots) : 0;
    }
    // Everything a purchase depends on. A stale quote (other tab, new card, spent Coins) is refused.
    function quote(save) {
        const s = save || Rift.State.get(), w = Rift.State.walletOf(s), list = roster(s);
        const slots = list.reduce((n, e) => n + room(s, e), 0), size = Math.min(CONFIG.size, slots);
        const v = version(list), price = size * CONFIG.unit;
        const rooms = list.map(e => room(s, e));
        return {
            stamp: JSON.stringify([s.createdAt, s.seed, w.packSerial, w.coins, w.freePacks, w.freeCards, v, rooms]),
            version: v, slots, size, price, coins: w.coins, freePacks: w.freePacks, freeCards: w.freeCards || 0,
            free: freeSize(w, slots), odds: odds(s, list), foil: CONFIG.foil,
        };
    }

    // One weighted pick: every eligible ID draws its own seeded key, the smallest -ln(u)/weight wins.
    // The chance is exactly weight / total, and the winner only changes if the winner itself (or a
    // newcomer with a smaller key) changes, so restoring an old backup and tweaking one folder does
    // not reshuffle a whole pack.
    function pick(open, label) {
        let best = null, low = Infinity;
        open.forEach(e => {
            const key = -Math.log(Rift.makeRng(label + ':' + e.kind + ':' + e.id).next()) / e.weight;
            if (key < low || !best) { best = e; low = key; }
        });
        return best;
    }
    // Pure: draws `size` cards into the supplied save. Separate seeded streams for the card and for
    // its foil, so cosmetic tuning can never change which IDs are rewarded.
    function draw(s, number, size) {
        const S = Rift.State, list = roster(s), base = s.seed + ':pack:' + number;
        const foils = Rift.makeRng(base + ':foil');
        const cards = [];
        for (let i = 0; i < size; i++) {
            const open = eligible(s, list); // recomputed after every copy: a full folder drops out at once
            if (!open.length) throw new Error('The pack pool ran out of room.');
            const e = pick(open, base + ':cards:' + i);
            const foil = foils.chance(CONFIG.foil);
            const card = { kind: e.kind, id: e.id, rarity: e.rarity, foil };
            if (e.kind === 'creature') {
                let uid = 'pack:' + (s.seed >>> 0).toString(36) + ':' + number + ':' + i;
                const existing = (s.creatures || []).concat(s.trophies || []);
                while (existing.some(c => c && c.uid === uid)) uid += 'x';
                if (!S.addCreature(s, S.makeCreature(e.id, { uid, foil }))) throw new Error('Could not add ' + cardName(e) + '.');
                card.uid = uid;
            } else if (!S.grantPrint(e.kind, e.id, s, { foil })) throw new Error('Could not add ' + cardName(e) + '.');
            // The folder count right after this copy, for the reveal (#134): display only.
            card.copies = e.kind === 'creature' ? S.copiesOf(s, e.id) : S.cardCopies(e.kind, e.id, s);
            cards.push(card);
        }
        return cards;
    }

    const here = () => !!(Rift.State.get() && Rift.Router.current() === 'map' && Rift.State.get().map.at === 'campfire');
    function change(fn) {
        if (!here()) return { ok: false, error: 'Return to the Campfire Clearing map to open packs.' };
        try { return Rift.State.transact(fn); }
        catch (e) { return { ok: false, error: e.message }; }
    }
    // source: 'coins' (10 Coins per card) or 'free' (saved free cards first, else one chapter pack).
    // A free pack opened with fewer than five slots keeps the rest as free cards for later.
    // → { ok, value: receipt } | { ok: false, error }
    function open(reviewed, source) {
        return change(s => {
            const q = quote(s), w = Rift.State.walletOf(s);
            if (active(s)) throw new Error('Look at your new cards first.');
            if (!reviewed || reviewed.version !== q.version) throw new Error('The cards in packs changed. Check the pack again.');
            if (reviewed.stamp !== q.stamp) throw new Error('Your Coins or cards changed. Check the pack again.');
            if (!q.size) throw new Error('You have every card in the pack pool. Nothing was charged.');
            if (!Number.isSafeInteger(w.packSerial) || !Number.isSafeInteger(w.packSerial + 1)) throw new Error('This pack cannot be opened safely.');
            let size = q.size;
            if (source === 'coins') {
                if (!Rift.State.spendCoins(q.price, s)) throw new Error('You need ' + q.price + ' Coins for this pack.');
            } else if (source === 'free') {
                size = q.free;
                if (!size || !Number.isSafeInteger(w.freeCards) || !Number.isSafeInteger(w.freePacks)) throw new Error('You have no free pack saved.');
                if (w.freeCards > 0) w.freeCards -= size;
                else { w.freePacks -= 1; w.freeCards = CONFIG.size - size; }
            } else throw new Error('Unknown pack.');
            w.packSerial += 1;
            const cards = draw(s, w.packSerial, size);
            // A first creature of a colour brings its colour spell (as any catch does); list it too.
            const unlocked = Rift.State.unlockColourTactics(s);
            w.pack = { v: 1, number: w.packSerial, version: q.version, source, price: source === 'coins' ? q.price : 0, cards, unlocked, at: Date.now(), done: false };
            return JSON.parse(JSON.stringify(w.pack));
        });
    }
    // The saved pack still waiting to be shown (reload resumes it), or null.
    function active(save) {
        const s = save || Rift.State.get(), p = s && Rift.State.walletOf(s).pack;
        return p && !p.done ? p : null;
    }
    // Presentation finished (Done in the results list). Never changes cards or Coins. Safe to repeat.
    function finish(number) {
        const p = active();
        if (!p || p.number !== number) return { ok: true, value: false };
        return Rift.State.transact(s => { const w = Rift.State.walletOf(s); if (w.pack && w.pack.number === number) w.pack.done = true; return true; });
    }
    function cardName(card) {
        return ((((Rift.data || {})[KINDS[card.kind]] || {})[card.id]) || {}).name || card.id;
    }

    Rift.Packs = { CONFIG, KINDS, LABELS, roster, room, quote, draw, open, active, finish };
})(typeof window !== 'undefined' ? window : globalThis);
