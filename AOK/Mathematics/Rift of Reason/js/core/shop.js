/* A deliberately small surplus table. Reference buy prices are builder starting
 * tuning, not a new item-buy route. Every sale pays half, rounded down (#135). */
(function (root) {
    'use strict';
    const Rift = root.Rift;
    const catalogue = Object.freeze({
        charm: Object.freeze({ buy: 10, keep: 2 }),
        lure: Object.freeze({ buy: 20, keep: 1 }),
        tonic: Object.freeze({ buy: 12, keep: 1 }),
    });
    const stock = s => JSON.stringify(Object.keys(s.items).sort().map(id => [id, s.items[id]]));
    const here = () => !!(Rift.State.get() && Rift.Router.current() === 'map' && Rift.State.get().map.at === 'campfire');
    function quote(save) {
        const s = save || Rift.State.get(), w = Rift.State.walletOf(s);
        const rows = Object.entries(catalogue).map(([id, config]) => {
            const owned = s.items[id] || 0, quantity = Number.isSafeInteger(owned) ? Math.max(0, owned - config.keep) : 0;
            const unit = Math.floor(config.buy / 2);
            return { id, owned, keep: config.keep, quantity, unit, total: quantity * unit };
        });
        return { stamp: JSON.stringify([s.createdAt, s.seed, w.saleSerial, w.coins, stock(s)]), rows, total: rows.reduce((n, row) => n + row.total, 0) };
    }
    function validReceipt(r) {
        return r && r.v === 1 && Number.isSafeInteger(r.number) && r.number > 0
            && Number.isSafeInteger(r.coins) && r.coins > 0 && Number.isSafeInteger(r.afterCoins) && r.afterCoins >= r.coins
            && typeof r.stock === 'string' && Array.isArray(r.items) && r.items.length > 0
            && new Set(r.items.map(row => row.id)).size === r.items.length
            && r.items.every(row => catalogue[row.id] && Number.isSafeInteger(row.quantity) && row.quantity > 0)
            && r.items.reduce((n, row) => n + row.quantity * Math.floor(catalogue[row.id].buy / 2), 0) === r.coins;
    }
    function canUndo(save) {
        const s = save || Rift.State.get(), w = Rift.State.walletOf(s), r = w.sale;
        return !!(validReceipt(r) && r.number === w.saleSerial && w.coins === r.afterCoins && stock(s) === r.stock);
    }
    function change(fn) {
        if (!here()) return { ok: false, error: 'Return to the Campfire Clearing map to sell or undo.' };
        try { return Rift.State.transact(fn); }
        catch (e) { return { ok: false, error: e.message }; }
    }
    function sell(reviewed) {
        return change(s => {
            const q = quote(s), w = Rift.State.walletOf(s);
            if (JSON.stringify(q) !== JSON.stringify(reviewed)) throw new Error('Your bag or Coins changed. Review the sale again.');
            if (!Number.isSafeInteger(q.total) || q.total <= 0 || !Number.isSafeInteger(w.coins) || w.coins < 0 || !Number.isSafeInteger(w.coins + q.total)
                || !Number.isSafeInteger(w.saleSerial + 1)) throw new Error('There is no safe surplus to sell.');
            const items = q.rows.filter(row => row.quantity).map(row => ({ id: row.id, quantity: row.quantity }));
            items.forEach(row => { s.items[row.id] -= row.quantity; });
            w.coins += q.total; w.saleSerial++;
            w.sale = { v: 1, number: w.saleSerial, coins: q.total, afterCoins: w.coins, stock: stock(s), items };
            return { coins: q.total, quantity: items.reduce((n, row) => n + row.quantity, 0) };
        });
    }
    function undo(number) {
        return change(s => {
            const w = Rift.State.walletOf(s);
            if (!canUndo(s) || w.sale.number !== number) throw new Error('This sale can no longer be undone. Your bag or Coins changed.');
            const r = w.sale;
            w.coins -= r.coins;
            r.items.forEach(row => { s.items[row.id] = (s.items[row.id] || 0) + row.quantity; });
            w.sale = null; // Keep the serial: old review/Undo handlers can never repeat a transaction.
            return { coins: r.coins };
        });
    }
    Rift.Shop = { catalogue, quote, sell, canUndo, undo };
})(typeof window !== 'undefined' ? window : globalThis);
