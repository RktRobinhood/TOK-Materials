import test from 'node:test';
import assert from 'node:assert/strict';
import { loadRift } from './harness.mjs';
import { loadWithDom } from './fake-dom.mjs';
const FILES = ['js/core/rift.js', 'js/core/state.js', 'js/core/world.js', 'js/core/shop.js', 'data/items.js', 'data/creatures.js'];
const J = x => JSON.parse(JSON.stringify(x));
function setup(store = new Map()) {
    const R = loadRift(FILES); let screen = 'map';
    R.Router = { current: () => screen }; R.testScreen = name => { screen = name; };
    R.storage = () => ({ getItem: k => store.get(k) || null, setItem: (k, v) => store.set(k, v), removeItem: k => store.delete(k) });
    if (store.size) R.State.load();
    else {
        R.State.newGame();
        R.State.update(s => {
            s.avatar = { type: 'owlet', variant: 'girl' }; s.map.at = 'campfire'; s.wallet.coins = 12;
            s.items = { charm: 10, lure: 3, tonic: 4, greatcharm: 9, 'lucky-sequin': 1, 'hoots-gavel': 1, 'trick-book': 1, ward: 2, heartstone: 1 };
        });
        R.State.saveNow();
    }
    return { R, S: R.State, H: R.Shop, store };
}

test('a reviewed surplus sale preserves catching reserves and every unconfigured item/card/creature', () => {
    const { S, H } = setup(), before = J(S.get()), q = H.quote();
    assert.equal(q.total, 78);
    for (const row of q.rows) assert.equal(row.unit, Math.floor(H.catalogue[row.id].buy / 2));
    assert.equal(H.sell(q).ok, true);
    assert.equal(S.get().wallet.coins, 90);
    assert.deepEqual(J(S.get().items), { ...before.items, charm: 2, lure: 1, tonic: 1 });
    assert.deepEqual(J(S.get().creatures), before.creatures); assert.deepEqual(J(S.get().cardPrints), before.cardPrints);
    assert.equal(H.sell(q).ok, false, 'a repeated click cannot repeat a reviewed sale');
    assert.equal(H.sell(H.quote()).ok, false, 'nothing below the protected reserve is saleable');
    assert.equal(S.get().wallet.coins, 90);
});

test('Undo is durable, restores exactly once, and never revives a stale sale handler', () => {
    let g = setup(); const before = J(g.S.get()), old = g.H.quote(); g.H.sell(old);
    g = setup(g.store); assert.equal(g.H.canUndo(), true);
    assert.equal(g.H.undo(g.S.get().wallet.sale.number).ok, true);
    assert.deepEqual(J(g.S.get().items), before.items); assert.equal(g.S.get().wallet.coins, 12);
    assert.equal(g.S.get().wallet.sale, null); assert.equal(g.S.get().wallet.saleSerial, 1);
    assert.equal(g.H.undo(1).ok, false); assert.equal(g.H.sell(old).ok, false);
    assert.equal(g.H.sell(g.H.quote()).ok, true); assert.equal(g.S.get().wallet.saleSerial, 2);
});

test('a sale receipt and its Undo survive both backup formats without repeating income', async () => {
    const { S, H } = setup(); H.sell(H.quote());
    for (const code of [S.encode('save', S.get()), await S.exportCode()]) {
        await S.importCode(code); assert.equal(S.get().wallet.coins, 90); assert.equal(H.quote().total, 0);
        assert.equal(H.canUndo(), true); assert.equal(S.get().wallet.saleSerial, 1);
    }
    assert.equal(H.undo(1).ok, true); assert.equal(S.get().wallet.coins, 12);
    assert.equal(S.get().items.charm, 10);
});

test('changed bag/Coins invalidates a review and makes old Undo unavailable without removing new rewards', () => {
    const { S, H } = setup(); const old = H.quote(); S.addItem('charm', 1);
    assert.equal(H.sell(old).ok, false);
    assert.equal(H.sell(H.quote()).ok, true);
    S.addItem('hoots-gavel', 1); const before = JSON.stringify(S.get());
    assert.equal(H.canUndo(), false); assert.equal(H.undo(1).ok, false); assert.equal(JSON.stringify(S.get()), before);
    S.update(s => { s.items['hoots-gavel']--; s.wallet.coins++; });
    assert.equal(H.canUndo(), false); assert.equal(H.undo(1).ok, false);
});

test('failed durable writes publish neither the sale nor Undo; retries settle once', () => {
    const { R, S, H, store } = setup(), good = R.storage, q = H.quote(), before = JSON.stringify(S.get());
    R.storage = () => ({ getItem: k => store.get(k) || null, setItem() { throw Error('full'); } });
    assert.equal(H.sell(q).ok, false); assert.equal(JSON.stringify(S.get()), before);
    R.storage = good; assert.equal(H.sell(q).ok, true); const sold = JSON.stringify(S.get());
    R.storage = () => ({ getItem: k => store.get(k) || null, setItem() { throw Error('full'); } });
    assert.equal(H.undo(1).ok, false); assert.equal(JSON.stringify(S.get()), sold);
    R.storage = good; assert.equal(H.undo(1).ok, true); assert.equal(S.get().wallet.coins, 12);
});

test('an old tab cannot sell or undo over a newer canonical transaction', () => {
    const g = setup(), other = setup(g.store), old = other.H.quote();
    assert.equal(g.H.sell(g.H.quote()).ok, true);
    assert.equal(other.H.sell(old).ok, false); assert.equal(other.H.undo(1).ok, false);
    assert.equal(setup(g.store).S.get().wallet.coins, 90);
});

test('selling and Undo are barred away from the campfire map, including active battle reservations', () => {
    const { R, S, H } = setup(), q = H.quote();
    for (const screen of ['battle', 'collection', 'encounter']) {
        R.testScreen(screen); assert.equal(H.sell(q).ok, false);
    }
    R.testScreen('map'); S.update(s => { s.map.at = 'road-start'; }); assert.equal(H.sell(q).ok, false);
    S.update(s => { s.map.at = 'campfire'; }); assert.equal(H.sell(q).ok, true);
    R.testScreen('battle'); assert.equal(H.undo(1).ok, false); assert.equal(S.get().wallet.coins, 90);
});

test('tampered reviews, unsafe totals and malformed receipts cannot mint Coins or supplies', () => {
    const { S, H } = setup(), q = J(H.quote()); q.total++;
    assert.equal(H.sell(q).ok, false);
    S.update(s => { s.wallet.coins = Number.MAX_SAFE_INTEGER; }); assert.equal(H.sell(H.quote()).ok, false);
    S.update(s => { s.wallet.coins = 12; }); H.sell(H.quote());
    for (const value of [{ ...J(S.get().wallet.sale), items: [{ id: 'hoots-gavel', quantity: 1 }] }, { ...J(S.get().wallet.sale), coins: 900 }]) {
        S.update(s => { s.wallet.sale = value; }); assert.equal(H.canUndo(), false); assert.equal(H.undo(1).ok, false);
    }
    assert.throws(() => S.checkSave({ ...J(S.get()), wallet: { ...J(S.get().wallet), saleSerial: -1 } }), /damaged/);
});

test('legacy wallet defaults add the sale fields without resetting Coins or creating a sale', () => {
    const { S, H } = setup(), old = J(S.get()); delete old.wallet.saleSerial; delete old.wallet.sale;
    S.replace(old); assert.equal(S.get().wallet.coins, 12); assert.equal(S.get().wallet.saleSerial, 0); assert.equal(S.get().wallet.sale, null);
    assert.equal(H.sell(H.quote()).ok, true);
});

test('mounted shop reviews exact surplus, cancels safely, sells once, offers Undo and guards detached handlers', async () => {
    const store = new Map();
    const g = loadWithDom([...FILES, 'data/tactics.js', 'data/axioms.js', 'js/core/acquisition.js', 'js/core/packs.js', ctx => {
        const R = ctx.Rift;
        R.storage = () => ({ getItem: k => store.get(k) || null, setItem: (k, v) => store.set(k, v), removeItem: k => store.delete(k) });
        R.Router = { current: () => 'map' }; R.Assets = { has: () => false }; R.Audio = { sfx() {} };
        const overlay = R.el('div'); overlay.setAttribute('id', 'overlay'); ctx.document.body.appendChild(overlay);
        R.State.newGame(); R.State.update(s => { s.map.at = 'campfire'; s.items = { charm: 5, lure: 2, tonic: 1, 'hoots-gavel': 1 }; }); R.State.saveNow();
    }, 'js/ui/ui.js']);
    const R = g.Rift, shop = R.UI.shop(), buttons = () => g.document.body.querySelectorAll('button');
    const find = text => buttons().find(b => b.textContent === text);
    assert.match(shop.node.textContent, /Catch Charm: 5 owned · keep 2 · sell 3 × 5 = 15 Coins/);
    find('Review surplus sale · 25 Coins').click();
    assert.match(g.document.body.textContent, /Total: 25 Coins/);
    find('Cancel').click(); await new Promise(resolve => setTimeout(resolve, 0));
    assert.equal(R.State.get().wallet.coins, 0); assert.equal(R.State.get().items.charm, 5);
    const detachedReview = find('Review surplus sale · 25 Coins'); detachedReview.click();
    const detachedSell = find('Sell for 25 Coins'); detachedSell.click();
    await new Promise(resolve => setTimeout(resolve, 0));
    assert.equal(R.State.get().wallet.coins, 25); assert.equal(R.State.get().items.charm, 2);
    assert.match(shop.node.textContent, /25 more Coins would cover/);
    const undo = find('Undo last sale · 25 Coins'); assert.ok(undo); assert.equal(g.document.activeElement, undo);
    detachedSell.click(); await new Promise(resolve => setTimeout(resolve, 0)); assert.equal(R.State.get().wallet.coins, 25);
    undo.click(); assert.equal(R.State.get().wallet.coins, 0); assert.equal(R.State.get().items.charm, 5);
    shop.close(); detachedReview.click(); undo.click();
    await new Promise(resolve => setTimeout(resolve, 0));
    assert.equal(R.State.get().wallet.coins, 0); assert.equal(g.document.getElementById('overlay').children.length, 0);
});
