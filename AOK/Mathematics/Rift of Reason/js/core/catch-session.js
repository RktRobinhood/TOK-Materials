/* The adventure boundary for catching. One saved visitor per node; one charm per
 * attempt; only legal board actions settle it. Reloads never reroll a game. */
(function (root) {
    'use strict';
    const Rift = root.Rift, games = Rift.CatchGames;
    function offer(save, node, species, seed, lured) {
        const key = String(seed) + ':attempt:1';
        const o = { species, seed: String(seed), lured: !!lured, attempt: 1, kind: games.pick(key),
            version: 0, board: null, item: null, receipt: null };
        save.catchOffers[node] = o;
        return o;
    }
    function get(node) { return (Rift.State.get().catchOffers || {})[node] || null; }
    function sly(save, species) {
        return !!(save.avatar && save.avatar.type === 'fox' && ['language', 'imagination'].includes(Rift.data.creatures[species].colour));
    }
    function boardFor(save, o, item) {
        return o.board || games.create(o.kind, o.seed + ':attempt:' + o.attempt, Rift.data.creatures[o.species].rarity, item, o.lured, sly(save, o.species));
    }
    function preview(node, item) { return boardFor(Rift.State.get(), get(node), item); }
    function change(node, version, fn) {
        const o = get(node);
        if (!o || o.dismissed || o.version !== version) return { ok: false, error: 'This catch has changed. Open it again to continue.' };
        try {
            return Rift.State.transact(save => {
                const live = save.catchOffers[node];
                const value = fn(save, live);
                live.version++;
                return value;
            });
        } catch (e) { return { ok: false, error: e.message }; }
    }
    function start(node, item, version) {
        return change(node, version, (s, o) => {
            if (o.board || o.receipt) throw new Error('This try has already started.');
            if (!['charm', 'greatcharm'].includes(item) || !(s.items[item] > 0)) throw new Error('No charm of that kind left.');
            if (!Rift.State.hasRoom(s, o.species)) throw new Error(Rift.State.fullReason(o.species));
            o.board = boardFor(s, o, item);
            o.item = item;
            s.items[item]--;
        });
    }
    function play(node, action, version) {
        return change(node, version, (s, o) => {
            if (!o.board || o.receipt) throw new Error('This try is not active.');
            const result = games.step(o.board, action);
            if (!result) throw new Error('Choose an available move.');
            o.board = result.board;
            if (o.board.done === 'caught') {
                const foil = Rift.makeRng(o.seed + ':foil:' + o.attempt).chance((Rift.data.fate || {}).foilCatch || 0);
                const inst = Rift.State.makeCreature(o.species, { foil });
                if (Rift.State.addCreature(s, inst)) {
                    s.stats.catches++;
                    o.receipt = { outcome: 'caught', uid: inst.uid };
                    if (Rift.data.creatures[o.species].rarity === 'legendary') Rift.World.award(s, 'legend-hunter');
                } else {
                    s.items[o.item]++;
                    o.receipt = { outcome: 'full' }; // Never lose a paid win to the copy cap.
                }
            } else if (o.board.done === 'escaped') {
                s.stats.escapes++;
                o.receipt = { outcome: 'escaped' };
            }
            return result;
        });
    }
    function retry(node, version) {
        return change(node, version, (s, o) => {
            if (!o.receipt || o.receipt.outcome !== 'escaped') throw new Error('Finish this try first.');
            o.attempt++;
            o.kind = games.pick(o.seed + ':attempt:' + o.attempt);
            o.board = null; o.item = null; o.receipt = null;
        });
    }
    function dismiss(node, version) {
        const result = change(node, version, (s, o) => { o.dismissed = true; });
        return result;
    }
    Rift.CatchSession = { offer, get, preview, sly, start, play, retry, dismiss };
})(typeof window !== 'undefined' ? window : globalThis);
