import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { loadRift, GAME_DIR } from './harness.mjs';
import { loadWithDom } from './fake-dom.mjs';

const FILES = ['js/core/rift.js', 'js/core/state.js', 'js/core/world.js', 'js/core/acquisition.js', 'js/core/packs.js',
    'data/creatures.js', 'data/tactics.js', 'data/axioms.js', 'data/items.js', 'data/map.js', 'data/starters.js'];
const J = x => JSON.parse(JSON.stringify(x));
const memory = store => () => ({ getItem: k => store.get(k) || null, setItem: (k, v) => store.set(k, v), removeItem: k => store.delete(k) });
// A synthetic test release with every rarity, so weights and caps are checked beyond today's commons.
function widen(R) {
    const base = { colour: 'reason', power: 2, cost: 1, attack: 1, health: 1, lines: [], release: 'test-1', packEligible: true };
    Object.assign(R.data.creatures, {
        'test-u1': { ...base, name: 'U1', rarity: 'uncommon' }, 'test-u2': { ...base, name: 'U2', rarity: 'uncommon' },
        'test-r1': { ...base, name: 'R1', rarity: 'rare' }, 'test-m1': { ...base, name: 'M1', rarity: 'mythic' },
        'test-l1': { ...base, name: 'L1', rarity: 'legendary' },
    });
    R.data.tactics['test-l-spell'] = { name: 'L spell', cost: 1, rarity: 'legendary', release: 'test-1', packEligible: true, run() {} };
}
function setup(store = new Map(), opts = {}) {
    const R = loadRift(FILES); let screen = 'map';
    if (opts.wide) widen(R);
    R.Router = { current: () => screen }; R.testScreen = name => { screen = name; };
    R.storage = memory(store);
    if (store.size) R.State.load();
    else {
        R.State.newGame();
        R.State.update(s => { s.seed = 1234; s.avatar = { type: 'owlet', variant: 'girl' }; s.map.at = 'campfire'; s.wallet.coins = opts.coins ?? 120; R.State.grantStarter(s); });
        R.State.saveNow();
    }
    return { R, S: R.State, P: R.Packs, store };
}
const owned = (R, s, card) => card.kind === 'creature' ? R.State.copiesOf(s, card.id) : R.State.cardCopies(card.kind, card.id, s);
const ids = receipt => receipt.cards.map(c => c.kind + ':' + c.id + (c.foil ? '*' : ''));

test('only released, explicitly pack-eligible IDs; plot-only cards stay out before and after their unlock', () => {
    const { R, S, P } = setup(), A = R.Acquisition;
    const pool = P.roster().map(e => e.kind + ':' + e.id);
    assert.ok(pool.length > 0);
    for (const e of P.roster()) {
        const def = R.data[{ creature: 'creatures', tactic: 'tactics', axiom: 'axioms' }[e.kind]][e.id];
        assert.equal(def.packEligible, true); assert.equal(typeof def.release, 'string'); assert.equal(A.story(e.kind, e.id), null);
    }
    for (const row of A.entries) assert.ok(!pool.includes(row.kind + ':' + row.id), row.id + ' is a story reward');
    assert.ok(!pool.includes('creature:lobstorian'), 'older cards without an explicit pack flag are not in packs');
    // Even a wrongly flagged story card stays out, and unlocking every story reward changes nothing.
    R.data.tactics['generic-quiet-reset'].packEligible = true;
    S.update(s => { s.map.completed = A.entries.map(row => row.node); A.entries.forEach(row => { s.flags['plot-card:' + row.id] = { v: 1 }; }); });
    assert.deepEqual(P.roster().map(e => e.kind + ':' + e.id), pool);
    // A definition without a release is not released, whatever its flag says.
    R.data.tactics['test-unreleased'] = { name: 'Draft', cost: 1, rarity: 'common', packEligible: true, run() {} };
    assert.deepEqual(P.roster().map(e => e.kind + ':' + e.id), pool);
});

test('fixed per-ID weights use the approved totals over the actual roster; odds renormalise and are disclosed', () => {
    const { R, S, P } = setup(new Map(), { wide: true });
    const roster = P.roster(), by = r => roster.filter(e => e.rarity === r);
    const commons = by('common').length;
    assert.equal(by('common')[0].weight, 0.65 / commons);
    assert.equal(by('uncommon')[0].weight, 0.23 / 2);
    assert.equal(by('legendary')[0].weight, 0.005 / 2);
    const odds = Object.fromEntries(P.quote().odds.map(r => [r.rarity, r.chance]));
    assert.ok(Math.abs(odds.common - 0.65) < 1e-12 && Math.abs(odds.mythic - 0.025) < 1e-12);
    assert.ok(Math.abs(Object.values(odds).reduce((a, b) => a + b, 0) - 1) < 1e-12);
    // Filling every common folder removes commons; the rest renormalise to 100%.
    S.update(s => { by('common').forEach(e => { while (P.room(s, e)) e.kind === 'creature' ? S.addCreature(s, S.makeCreature(e.id)) : S.grantPrint(e.kind, e.id, s); }); });
    const after = Object.fromEntries(P.quote().odds.map(r => [r.rarity, r.chance]));
    assert.equal(after.common, undefined);
    assert.ok(Math.abs(after.uncommon - 0.23 / 0.35) < 1e-12);
    // Today's release has commons only: honest 100% Common, and a different version from the wide pool.
    const today = setup();
    assert.deepEqual(J(today.P.quote().odds.map(r => [r.rarity, r.chance])), [['common', 1]]);
    assert.notEqual(today.P.quote().version, P.quote().version);
});

test('weighted draws follow the published odds over many deterministic packs', () => {
    const { R, P } = setup(new Map(), { wide: true }), counts = {};
    const s = J(R.State.get()); let n = 0;
    for (let number = 1; number <= 3000; number++) {
        const copy = J(s); P.draw(copy, number, 1).forEach(c => { counts[c.rarity] = (counts[c.rarity] || 0) + 1; n++; });
    }
    assert.ok(Math.abs(counts.common / n - 0.65) < 0.03, 'common ' + counts.common / n);
    assert.ok(Math.abs(counts.uncommon / n - 0.23) < 0.03, 'uncommon ' + counts.uncommon / n);
    assert.ok(Math.abs(counts.rare / n - 0.09) < 0.02, 'rare ' + counts.rare / n);
});

test('each card is one owned copy; folders cap at four, legendary creatures at one, legacy excess is kept and skipped', () => {
    const { R, S, P } = setup(new Map(), { wide: true });
    const s = J(S.get());
    // Legacy: six Tom Skinks from an old save stay six and are never drawn.
    for (let i = 0; i < 6; i++) s.creatures.push(S.makeCreature('reason-premise-pigeon', { uid: 'old-' + i }));
    let total = 0;
    for (let number = 1; number <= 40; number++) {
        const q = P.quote(s); if (!q.size) break;
        const before = J(s), cards = P.draw(s, number, q.size);
        total += cards.length;
        for (const c of cards) {
            assert.notEqual(c.id, 'reason-premise-pigeon');
            assert.ok(owned(R, s, c) <= (c.kind === 'creature' && c.rarity === 'legendary' ? 1 : 4), c.id + ' over its cap');
        }
        const gained = cards.reduce((m, c) => (m[c.id] = (m[c.id] || 0) + 1, m), {});
        for (const id of Object.keys(gained)) {
            const c = cards.find(x => x.id === id);
            assert.equal(owned(R, s, c), owned(R, before, c) + gained[id], 'each draw adds exactly one copy');
        }
    }
    assert.equal(S.copiesOf(s, 'reason-premise-pigeon'), 6);
    assert.equal(S.copiesOf(s, 'test-l1'), 1, 'a legendary creature fills its folder with one copy');
    assert.equal(S.cardCopies('tactic', 'test-l-spell', s), 4, 'a legendary spell keeps the ordinary folder of four');
    assert.equal(P.quote(s).slots, 0);
    assert.equal(total, P.roster().reduce((n, e) => n + (e.kind === 'creature' && e.rarity === 'legendary' ? 1 : 4), 0) - 4);
});

test('foil rolls on its own stream: about 4%, independent of which cards are drawn, with no upgrades', () => {
    const { R, S, P } = setup(new Map(), { wide: true });
    const s = J(S.get()); let foils = 0, n = 0;
    for (let number = 1; number <= 1500; number++) { const copy = J(s); P.draw(copy, number, 1).forEach(c => { n++; if (c.foil) foils++; }); }
    assert.ok(foils / n > 0.025 && foils / n < 0.055, 'foil rate ' + foils / n);
    // The same module with 100% foil draws exactly the same IDs: cosmetic tuning cannot change rewards.
    const normal = P.draw(J(s), 7, 5);
    const src = fs.readFileSync(path.join(GAME_DIR, 'js/core/packs.js'), 'utf8').replace('foil: 0.04', 'foil: 1');
    assert.ok(src.includes('foil: 1'));
    new Function('window', src)({ Rift: R });
    const shiny = R.Packs.draw(J(s), 7, 5);
    assert.deepEqual(J(shiny.map(c => c.id)), J(normal.map(c => c.id)));
    assert.ok(shiny.every(c => c.foil));
    // A foil copy is its own copy: earlier normal copies stay normal.
    const copy = J(s); copy.creatures = []; const got = R.Packs.draw(copy, 7, 5);
    got.filter(c => c.kind === 'creature').forEach(c => assert.equal(copy.creatures.find(x => x.uid === c.uid).foil, true));
    assert.ok(copy.creatures.every(x => x.foil === true));
});

test('a purchase charges once and saves Coins, copies and receipt together before anything is shown', () => {
    const { R, S, P, store } = setup(), q = P.quote();
    assert.equal(q.size, 5); assert.equal(q.price, 50);
    const r = P.open(q, 'coins');
    assert.equal(r.ok, true); assert.equal(r.value.cards.length, 5); assert.equal(r.value.price, 50);
    const saved = JSON.parse(store.get(S.STORAGE_KEY));
    assert.equal(saved.wallet.coins, 70); assert.deepEqual(saved.wallet.pack, J(r.value));
    for (const c of r.value.cards) assert.ok(owned(R, saved, c) > 0);
    assert.deepEqual(J(P.active()), J(r.value));
    assert.equal(P.open(q, 'coins').ok, false, 'a repeated click cannot buy again with the same review');
    assert.equal(S.get().wallet.coins, 70); assert.equal(S.get().wallet.packSerial, 1);
});

test('a failed save restores the prior state; the retry saves the very same cards', () => {
    const { R, S, P, store } = setup(), q = P.quote(), before = JSON.stringify(S.get()), good = R.storage;
    R.storage = () => ({ getItem: k => store.get(k) || null, setItem() { throw Error('full'); }, removeItem() {} });
    const failed = P.open(q, 'coins');
    assert.equal(failed.ok, false); assert.match(failed.error, /Could not save/);
    assert.equal(JSON.stringify(S.get()), before); assert.equal(P.active(), null);
    R.storage = good;
    const first = P.open(q, 'coins');
    assert.equal(first.ok, true);
    // A different save with the same seed and serial would draw the same cards: no lucky retries.
    const again = setup(); const twin = again.P.open(again.P.quote(), 'coins');
    assert.deepEqual(ids(twin.value), ids(first.value));
});

test('reload resumes the saved receipt until Done, and Done never changes cards or Coins', () => {
    let g = setup(); const r = g.P.open(g.P.quote(), 'coins').value;
    const after = J(g.S.get());
    g = setup(g.store);
    assert.deepEqual(J(g.P.active()), J(r));
    assert.equal(g.P.finish(r.number).ok, true);
    assert.equal(g.P.active(), null);
    const done = J(g.S.get());
    assert.equal(done.wallet.coins, after.wallet.coins); assert.deepEqual(done.creatures, after.creatures); assert.deepEqual(done.cardPrints, after.cardPrints);
    assert.equal(g.P.finish(r.number).ok, true, 'Skip twice is harmless');
    g = setup(g.store); assert.equal(g.P.active(), null); assert.equal(g.S.get().wallet.pack.done, true);
});

test('backup import keeps the receipt without a second charge, duplicate or reroll', async () => {
    const { S, P } = setup(), old = P.quote(), earlier = await S.exportCode();
    const r = P.open(old, 'coins').value, after = J(S.get());
    for (const code of [S.encode('save', S.get()), await S.exportCode()]) {
        await S.importCode(code);
        assert.deepEqual(J(S.get().wallet), after.wallet); assert.deepEqual(J(S.get().creatures), after.creatures);
        assert.deepEqual(J(P.active()), J(r));
        assert.equal(P.open(old, 'coins').ok, false);
    }
    // Going back to a backup from before the purchase and buying again yields the same cards.
    await S.importCode(earlier);
    assert.equal(S.get().wallet.coins, 120);
    assert.deepEqual(ids(P.open(P.quote(), 'coins').value), ids(r));
});

test('an older backup plus one small folder change cannot reshuffle the whole pack', async () => {
    const { R, S, P } = setup(new Map(), { wide: true }), earlier = await S.exportCode();
    const r = P.open(P.quote(), 'coins').value;
    await S.importCode(earlier);
    // Fill one folder that the pack did not draw, then buy again.
    const other = P.roster().find(e => e.kind === 'creature' && e.rarity === 'common' && !r.cards.some(c => c.id === e.id));
    S.update(s => { while (P.room(s, other)) S.addCreature(s, S.makeCreature(other.id)); });
    assert.deepEqual(ids(P.open(P.quote(), 'coins').value), ids(r));
});

test('an older tab cannot buy over a newer save, even with a fresh quote', () => {
    const g = setup(), other = setup(g.store), stale = other.P.quote();
    assert.equal(g.P.open(g.P.quote(), 'coins').ok, true);
    assert.equal(other.P.open(stale, 'coins').ok, false);
    assert.equal(other.P.open(other.P.quote(), 'coins').ok, false);
    const fresh = setup(g.store); assert.equal(fresh.S.get().wallet.coins, 70); assert.equal(fresh.S.get().wallet.packSerial, 1);
});

test('a final smaller pack costs ten per usable copy; a complete pool cannot be bought and keeps free packs', () => {
    const { R, S, P } = setup(new Map(), { coins: 500 });
    S.update(s => {
        s.wallet.freePacks = 2;
        P.roster().forEach(e => { while (P.room(s, e)) e.kind === 'creature' ? S.addCreature(s, S.makeCreature(e.id)) : S.grantPrint(e.kind, e.id, s); });
        // Release three copies: room for exactly three.
        const sp = P.roster().find(e => e.kind === 'creature').id;
        s.creatures = s.creatures.filter((c, i, all) => c.species !== sp || all.filter(x => x.species === sp).indexOf(c) >= 3);
    });
    let q = P.quote(); assert.equal(q.slots, 3); assert.equal(q.size, 3); assert.equal(q.price, 30);
    const r = P.open(q, 'coins').value;
    assert.equal(r.cards.length, 3); assert.equal(S.get().wallet.coins, 470);
    q = P.quote(); assert.equal(q.size, 0); assert.equal(q.price, 0);
    const before = JSON.stringify(S.get());
    assert.equal(P.open(q, 'coins').ok, false); assert.equal(P.open(q, 'free').ok, false);
    assert.equal(JSON.stringify(S.get()), before, 'no blanks, no charge, free packs kept');
    assert.equal(S.get().wallet.freePacks, 2);
});

test('a free pack with little room opens what fits and keeps the rest as free cards', () => {
    const { R, S, P } = setup(new Map(), { coins: 0 });
    S.update(s => {
        s.wallet.freePacks = 1;
        P.roster().forEach(e => { while (P.room(s, e)) e.kind === 'creature' ? S.addCreature(s, S.makeCreature(e.id)) : S.grantPrint(e.kind, e.id, s); });
        const sp = P.roster().find(e => e.kind === 'creature').id;
        s.creatures = s.creatures.filter((c, i, all) => c.species !== sp || all.filter(x => x.species === sp).indexOf(c) >= 2);
    });
    let q = P.quote(); assert.equal(q.free, 2);
    let r = P.open(q, 'free').value;
    assert.equal(r.cards.length, 2); assert.equal(r.price, 0);
    assert.equal(S.get().wallet.freePacks, 0); assert.equal(S.get().wallet.freeCards, 3);
    P.finish(r.number);
    q = P.quote(); assert.equal(q.free, 0); assert.equal(P.open(q, 'free').ok, false);
    assert.equal(S.get().wallet.freeCards, 3, 'no room: the free cards stay saved');
    // Releasing two copies makes room: the saved free cards come first.
    S.update(s => { const sp = P.roster().find(e => e.kind === 'creature').id; s.creatures = s.creatures.filter((c, i, all) => c.species !== sp || all.filter(x => x.species === sp).indexOf(c) >= 2); });
    q = P.quote(); assert.equal(q.free, 2);
    r = P.open(q, 'free').value; assert.equal(r.cards.length, 2);
    assert.equal(S.get().wallet.freeCards, 1); assert.equal(S.get().wallet.coins, 0);
});

test('a quote from before a pool change is refused; a second pack waits until the first is seen', () => {
    const { R, S, P } = setup(), q = P.quote();
    R.data.creatures['test-new'] = { name: 'New', colour: 'reason', rarity: 'uncommon', power: 2, cost: 1, attack: 1, health: 1, lines: [], release: 'test-2', packEligible: true };
    const stale = P.open(q, 'coins');
    assert.equal(stale.ok, false); assert.match(stale.error, /cards in packs changed/);
    assert.equal(S.get().wallet.coins, 120);
    const r = P.open(P.quote(), 'coins');
    assert.equal(r.ok, true);
    const second = P.open(P.quote(), 'coins');
    assert.equal(second.ok, false); assert.match(second.error, /Look at your new cards first/);
    assert.equal(S.get().wallet.coins, 70);
    P.finish(r.value.number);
    assert.equal(P.open(P.quote(), 'coins').ok, true);
    assert.equal(S.get().wallet.coins, 20);
});

test('a legacy save with two copies of a legendary creature keeps both and never draws a third', () => {
    const { R, S, P } = setup(new Map(), { wide: true }), s = J(S.get());
    s.creatures.push(S.makeCreature('test-l1', { uid: 'old-l-1' }), S.makeCreature('test-l1', { uid: 'old-l-2' }));
    for (let number = 1; number <= 40 && P.quote(s).size; number++) P.draw(s, number, P.quote(s).size).forEach(c => assert.notEqual(c.id, 'test-l1'));
    assert.equal(S.copiesOf(s, 'test-l1'), 2);
});

test('a first creature of a new colour lists its colour spell on the receipt', () => {
    const { R, S, P } = setup();
    const commons = Object.values(R.data.tacticDecks.colour).map(list => list[0]);
    S.update(s => { s.creatures = []; s.trophies = []; s.cardPrints.colours = {}; commons.forEach(id => { delete s.cardPrints.tactic[id]; }); s.deckTactics = []; });
    const r = P.open(P.quote(), 'coins').value;
    const expected = [...new Set(r.cards.filter(c => c.kind === 'creature').map(c => R.data.tacticDecks.colour[R.data.creatures[c.id].colour][0]))].sort();
    assert.ok(expected.length > 0);
    assert.deepEqual(J(r.unlocked).sort(), expected);
    r.unlocked.forEach(id => assert.ok(S.cardCopies('tactic', id) > 0));
    assert.deepEqual(J(S.get().wallet.pack.unlocked), J(r.unlocked), 'the saved receipt lists them too');
});

test('a free chapter pack costs no Coins and is used once', () => {
    const { S, P } = setup(new Map(), { coins: 0 });
    assert.equal(P.open(P.quote(), 'coins').ok, false);
    assert.equal(P.open(P.quote(), 'free').ok, false, 'no free pack saved');
    S.update(s => { s.wallet.freePacks = 1; });
    const q = P.quote(), r = P.open(q, 'free');
    assert.equal(r.ok, true); assert.equal(r.value.source, 'free'); assert.equal(r.value.price, 0); assert.equal(r.value.cards.length, 5);
    assert.equal(S.get().wallet.freePacks, 0); assert.equal(S.get().wallet.coins, 0);
    assert.equal(P.open(q, 'free').ok, false); assert.equal(P.open(P.quote(), 'free').ok, false);
});

test('packs open only on the Campfire Clearing map; tampered or unknown requests change nothing', () => {
    const { R, S, P } = setup(), q = P.quote(), before = JSON.stringify(S.get());
    for (const screen of ['battle', 'collection', 'encounter']) { R.testScreen(screen); assert.equal(P.open(q, 'coins').ok, false); }
    R.testScreen('map'); S.update(s => { s.map.at = 'road-start'; }); assert.equal(P.open(P.quote(), 'coins').ok, false);
    S.update(s => { s.map.at = 'campfire'; });
    assert.equal(P.open({ ...q, stamp: 'x' }, 'coins').ok, false);
    assert.equal(P.open(P.quote(), 'gift').ok, false);
    assert.equal(P.open(null, 'coins').ok, false);
    assert.equal(S.get().wallet.coins, 120); assert.equal(S.get().wallet.packSerial, 0);
    assert.equal(JSON.parse(before).wallet.coins, 120);
});

test('legacy wallets gain empty pack fields; damaged pack receipts are refused', () => {
    const { S, P } = setup(), old = J(S.get());
    delete old.wallet.packSerial; delete old.wallet.pack;
    S.replace(old); assert.equal(S.get().wallet.packSerial, 0); assert.equal(S.get().wallet.pack, null); assert.equal(S.get().wallet.coins, 120);
    const r = P.open(P.quote(), 'coins').value, good = J(S.get());
    for (const pack of [{ ...r, v: 2 }, { ...r, number: 0 }, { ...r, source: 'gift' }, { ...r, cards: [] }, { ...r, price: -1 }, { ...r, number: 2 },
        { ...r, cards: [{ kind: 'creature', id: 'x', rarity: 'common', foil: false }] }, { ...r, cards: [{ kind: 'tactic', id: 'x', rarity: 'common', foil: 'no' }] },
        { ...r, cards: [{ kind: 'tactic', id: 'x', foil: false }] }, { ...r, source: 'free' }, { ...r, unlocked: [1] }]) {
        assert.throws(() => S.checkSave({ ...good, wallet: { ...good.wallet, pack } }), /damaged/);
    }
    assert.throws(() => S.checkSave({ ...good, wallet: { ...good.wallet, packSerial: undefined } }), /damaged/);
    assert.throws(() => S.checkSave({ ...good, wallet: { ...good.wallet, packSerial: -1 } }), /damaged/);
    assert.throws(() => S.checkSave({ ...good, wallet: { ...good.wallet, freeCards: 1.5 } }), /damaged/);
    assert.equal(S.checkSave(good).wallet.pack.number, 1);
});

test('mounted stall shows odds, confirms, lists the saved cards first and resumes them after reload', async () => {
    const store = new Map();
    const mount = () => loadWithDom([...FILES, ctx => {
        const R = ctx.Rift;
        R.storage = memory(store); R.Router = { current: () => 'map' }; R.Assets = { has: () => false }; R.Audio = { sfx() {} };
        const overlay = R.el('div'); overlay.setAttribute('id', 'overlay'); ctx.document.body.appendChild(overlay);
        if (store.size) R.State.load();
        else { R.State.newGame(); R.State.update(s => { s.map.at = 'campfire'; s.wallet.coins = 60; s.wallet.freePacks = 1; }); R.State.saveNow(); }
    }, 'js/core/shop.js', 'js/ui/ui.js']);
    let g = mount(); let R = g.Rift;
    const find = text => g.document.body.querySelectorAll('button').find(b => b.textContent === text);
    let shop = R.UI.shop();
    assert.match(shop.node.textContent, /Next card: Common 100% \(7 kinds\)/);
    assert.match(shop.node.textContent, /Foil: 4% per card/);
    assert.match(shop.node.textContent, /Free packs saved: 1/);
    assert.ok(find('Open free pack · 5 cards'));
    find('Five-card pack · 50 Coins').click();
    assert.match(g.document.body.textContent, /Buy 5 cards for 50 Coins\?/);
    find('Cancel').click(); await new Promise(resolve => setTimeout(resolve, 0));
    assert.equal(R.State.get().wallet.coins, 60);
    find('Five-card pack · 50 Coins').click();
    find('Buy for 50 Coins').click(); await new Promise(resolve => setTimeout(resolve, 0));
    assert.equal(R.State.get().wallet.coins, 10);
    const list = g.document.body.querySelector('.pack-results');
    assert.ok(list !== null && list.tagName === 'OL');
    assert.equal(list.children.length, 5);
    assert.match(g.document.body.textContent, /5 new cards are in your Collection \(50 Coins\)/);
    assert.match(shop.node.textContent, /40 more Coins would cover this pack/);
    // Reload before Done: the stall shows the same saved cards again, without charging.
    const first = list.textContent;
    g = mount(); R = g.Rift; shop = R.UI.shop();
    assert.equal(g.document.body.querySelector('.pack-results').textContent, first);
    assert.equal(R.State.get().wallet.coins, 10);
    g.document.body.querySelectorAll('button').find(b => b.textContent === 'Done').click();
    assert.equal(R.State.get().wallet.pack.done, true);
    assert.ok(g.document.body.querySelector('.pack-results') === null);
    shop.close();
    g = mount(); shop = g.Rift.UI.shop();
    assert.ok(g.document.body.querySelector('.pack-results') === null, 'a finished pack is not shown again');
    shop.close();
    // A complete pool: both pack buttons are disabled and the saved free pack is kept.
    R = g.Rift;
    R.State.update(s => { s.wallet.coins = 500; R.Packs.roster().forEach(e => { while (R.Packs.room(s, e)) e.kind === 'creature' ? R.State.addCreature(s, R.State.makeCreature(e.id)) : R.State.grantPrint(e.kind, e.id, s); }); });
    shop = R.UI.shop();
    const full = g.document.body.querySelectorAll('.shop-packs button').map(b => b.textContent + ':' + b.disabled);
    assert.deepEqual(J(full), ['Free cards kept for later:true', 'All pack cards collected:true']);
    assert.match(shop.node.textContent, /You have every card in the packs/);
    shop.close();
    assert.equal(R.State.get().wallet.coins, 500); assert.equal(R.State.get().wallet.freePacks, 1);
});
