import test from 'node:test';
import assert from 'node:assert/strict';
import { loadRift } from './harness.mjs';
import { loadWithDom } from './fake-dom.mjs';

function game() {
    const R = loadRift(['js/core/rift.js', 'js/core/state.js', 'js/core/world.js', 'data/creatures.js', 'data/tactics.js', 'data/axioms.js', 'data/items.js', 'data/map.js', 'data/starters.js']);
    return { R, S: R.State, W: R.World, s: R.State.freshState() };
}
const plain = x => JSON.parse(JSON.stringify(x));
const win = (W, s, id) => {
    const v = W.rollVisit(s, id), receipt = W.claimVisitCoins(s, id, v.number, true);
    W.complete(s, id); return receipt;
};

test('first checked success pays ten, replay pays two, and every visit pays once', () => {
    const { S, W, s } = game();
    assert.equal(win(W, s, 'road-start').coins, 10);
    assert.equal(s.wallet.coins, 10);
    assert.equal(W.claimVisitCoins(s, 'road-start', 1, true), null);
    assert.equal(win(W, s, 'road-start').coins, 2);
    assert.equal(W.claimVisitCoins(s, 'road-start', 1, true), null, 'a stale callback cannot repay an older visit');
    for (let i = 0; i < 100; i++) win(W, s, 'road-start');
    assert.equal(s.wallet.coins, 212);
    assert.deepEqual(Object.keys(s.wallet.visits), ['road-start'], 'receipts stay bounded per node');
});

test('failures, unchecked bonuses, rest, invalid visit numbers and generic completion never pay Coins', () => {
    const { W, s } = game(); const v = W.rollVisit(s, 'road-start');
    for (const number of [0, -1, 2, NaN, 1.5]) assert.equal(W.claimVisitCoins(s, 'road-start', number, true), null);
    assert.equal(W.claimVisitCoins(s, 'road-start', v.number, false), null);
    for (const id of ['campfire', 'bonus-mines', 'fair-finale']) {
        const visit = W.rollVisit(s, id); assert.equal(W.claimVisitCoins(s, id, visit.number, true), null);
    }
    W.complete(s, 'road-start');
    assert.equal(s.wallet.coins, 0);
    assert.equal(win(W, s, 'road-start').coins, 2, 'a formerly completed node is a replay, not a first-win windfall');
});

test('first miniboss/boss pays twenty-five; chapter completion retains one free pack entitlement', () => {
    const { R, W, s } = game();
    const mini = Object.keys(R.data.map.nodes).find(id => W.node(id).type === 'miniboss');
    assert.ok(mini); assert.equal(win(W, s, mini).coins, 25);
    assert.equal(win(W, s, mini).coins, 2);
    assert.equal(win(W, s, 'gate').coins, 25);
    assert.equal(s.wallet.freePacks, 1);
    assert.equal(win(W, s, 'gate').coins, 2); W.reconcileWallet(s);
    assert.equal(s.wallet.freePacks, 1);
    assert.deepEqual(plain(s.wallet.chapters), { ch1: true });
});

test('old backups default to zero Coins; completed chapters reconcile once without retroactive income', async () => {
    const { S, W, s } = game(); delete s.wallet; s.map.completed = ['gate', 'b-town-hall'];
    const back = S.migrate(await S.decodeAsync('save', await S.encodePacked('save', s)));
    assert.equal(back.wallet.coins, 0); assert.equal(W.reconcileWallet(back), 2);
    assert.equal(W.reconcileWallet(back), 0); assert.equal(back.wallet.freePacks, 2);
    const round = S.migrate(S.decode('save', S.encode('save', back)));
    assert.deepEqual(plain(round.wallet), plain(back.wallet));
    assert.equal(W.reconcileWallet(round), 0);
});

test('debit validates exact earned balance and rejects unsafe, negative and insufficient amounts', () => {
    const { S, s } = game(); s.wallet.coins = 50;
    for (const amount of [-1, 0, 51, 1.5, NaN, Infinity, '50']) {
        assert.equal(S.spendCoins(amount, s), false); assert.equal(s.wallet.coins, 50);
    }
    assert.equal(S.spendCoins(50, s), true); assert.equal(s.wallet.coins, 0);
    assert.equal(S.spendCoins(1, s), false);
});

test('paid-visit and free-pack receipts survive backups without granting again', async () => {
    const { S, W, s } = game(); win(W, s, 'gate');
    const back = S.migrate(await S.decodeAsync('save', await S.encodePacked('save', s)));
    assert.equal(W.claimVisitCoins(back, 'gate', 1, true), null);
    assert.equal(W.reconcileWallet(back), 0);
    assert.deepEqual(plain(back.wallet), plain(s.wallet));
});

test('invalid wallets are refused as damaged backups without silently repairing balances', () => {
    const { S, s } = game();
    for (const wallet of [true, { coins: -1 }, { coins: 1.5 }, { freePacks: Infinity }, { visits: { gate: '1' } }, { chapters: { ch1: 1 } }]) {
        assert.throws(() => S.checkSave({ ...plain(s), wallet }), /damaged/);
    }
});

test('early checked milestones still grant compatible common cards without spending earned Coins', () => {
    const { R, S, W, s } = game(); s.avatar = { type: 'owlet', variant: 'girl' }; S.grantStarter(s);
    const id = Object.keys(R.data.map.nodes).find(id => W.node(id).type === 'puzzle' && W.openCardSlots(s, id).includes('fit'));
    assert.ok(id); assert.equal(win(W, s, id).coins, 10);
    const receipt = s.flags['card-reward:fit']; assert.ok(receipt && receipt.id);
    assert.equal(R.data.tactics[receipt.id].rarity, 'common');
    assert.ok(S.cardCopies('tactic', receipt.id, s) > 0);
    assert.equal(s.wallet.coins, 10, 'a direct card reward is not a purchase');
});

test('campfire shop shows balance and retained packs but never enables or charges a purchase', () => {
    let save;
    const g = loadWithDom(['js/core/rift.js', 'js/core/state.js', 'js/core/world.js', 'data/avatars.js', ctx => {
        const R = ctx.Rift; save = R.State.freshState();
        save.avatar = { type: 'owlet', variant: 'girl', nickname: 'Shop test' };
        R.State.get = () => save;
        R.State.update = fn => { fn(save); R.bus.emit('state:changed', save); };
        R.Assets = { has: () => false, img: () => R.el('img') }; R.Audio = { sfx() {} };
        const overlay = R.el('div'); overlay.setAttribute('id', 'overlay'); ctx.document.body.appendChild(overlay);
    }, 'js/ui/ui.js']);
    const { Rift: R } = g;
    const hud = R.UI.hud(); g.document.body.appendChild(hud);
    const entry = hud.querySelector('.campfire-shop'); assert.equal(entry.hidden, true);
    save.map.at = 'campfire'; save.map.completed = ['gate'];
    R.World.reconcileWallet(save); R.bus.emit('state:changed', save); assert.equal(entry.hidden, false);
    for (const balance of [0, 49, 50, 500]) {
        save.wallet.coins = balance;
        const before = JSON.stringify(save.wallet), dialog = R.UI.shop();
        assert.match(dialog.node.textContent, new RegExp(balance + ' Coins'));
        assert.match(dialog.node.textContent, /Free five-card packs saved: 1/);
        assert.match(dialog.node.textContent, /Packs coming soon/);
        const buy = dialog.node.querySelectorAll('button').find(b => b.textContent === 'Five-card pack · 50 Coins');
        assert.ok(buy); assert.equal(buy.disabled, true); buy.click();
        dialog.close(); assert.equal(JSON.stringify(save.wallet), before);
    }
    save.map.at = 'road-start'; R.bus.emit('state:changed', save);
    assert.equal(entry.hidden, true); assert.equal(R.UI.shop(), null);
});
