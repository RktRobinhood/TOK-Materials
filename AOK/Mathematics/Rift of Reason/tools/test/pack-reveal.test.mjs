import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { loadRift, GAME_DIR } from './harness.mjs';
import { loadWithDom } from './fake-dom.mjs';

// The pack reveal (#134) plays back a saved receipt (#136). It must never change the save.
const FILES = ['js/core/rift.js', 'js/core/state.js', 'js/core/world.js', 'js/core/acquisition.js', 'js/core/packs.js',
    'data/creatures.js', 'data/tactics.js', 'data/axioms.js', 'data/items.js', 'data/map.js', 'data/starters.js'];
const J = x => JSON.parse(JSON.stringify(x));
const memory = store => () => ({ getItem: k => store.get(k) || null, setItem: (k, v) => store.set(k, v), removeItem: k => store.delete(k) });
const legendary = R => { R.data.creatures['test-l1'] = { name: 'L1', colour: 'reason', rarity: 'legendary', power: 2, cost: 1, attack: 1, health: 1, lines: [], release: 'test-1', packEligible: true }; };

function pure() {
    const R = loadRift([...FILES, 'js/ui/pack-reveal.js']);
    R.Router = { current: () => 'map' }; R.storage = memory(new Map());
    R.State.newGame();
    R.State.update(s => { s.seed = 1234; s.avatar = { type: 'owlet', variant: 'girl' }; s.map.at = 'campfire'; s.wallet.coins = 200; R.State.grantStarter(s); });
    return R;
}
function mount(store, prepare) {
    const sounds = [], keys = new Set();
    const g = loadWithDom([...FILES, ctx => {
        const R = ctx.Rift;
        R.storage = memory(store); R.Router = { current: () => 'map' };
        R.Assets = { has: () => false, img: (id, o) => R.el('img', { alt: (o && o.alt) || '' }) };
        R.Audio = { sfx: name => sounds.push(name), stopSounds: () => sounds.push('stop') };
        const overlay = R.el('div'); overlay.setAttribute('id', 'overlay'); ctx.document.body.appendChild(overlay);
        // Document key listeners, so a test can press Escape.
        ctx.document.addEventListener = (type, fn) => { if (type === 'keydown') keys.add(fn); };
        ctx.document.removeEventListener = (type, fn) => { if (type === 'keydown') keys.delete(fn); };
        if (store.size) R.State.load();
        else {
            R.State.newGame();
            R.State.update(s => { s.seed = 99; s.avatar = { type: 'owlet', variant: 'girl' }; s.map.at = 'campfire'; s.wallet.coins = 60; R.State.grantStarter(s); });
            if (prepare) prepare(R);
            R.State.saveNow();
        }
    }, 'js/core/shop.js', 'js/ui/ui.js', 'js/ui/pack-reveal.js']);
    const button = text => g.document.body.querySelectorAll('button').find(b => b.textContent === text || b.textContent.startsWith(text));
    const press = key => { const event = { key, repeat: false, preventDefault() {}, stopPropagation() {} }; [...keys].forEach(fn => fn(event)); };
    return { g, R: g.Rift, sounds, button, press, keys, text: () => g.document.body.textContent };
}
const saved = store => [...store.values()].join('|');

test('each card shows the copy it added: folder counts step up within one pack; legendary creatures say one of a kind', () => {
    const R = pure(), S = R.State, P = R.PackReveal;
    legendary(R);
    const before = J(S.get());
    // A real pack: copies right after card i = owned before the pack + this ID so far in the pack.
    const receipt = R.Packs.open(R.Packs.quote(), 'coins').value;
    const slides = P.plan(receipt);
    receipt.cards.forEach((c, i) => {
        const had = c.kind === 'creature' ? S.copiesOf(before, c.id) : S.cardCopies(c.kind, c.id, before);
        const so = receipt.cards.slice(0, i + 1).filter(x => x.kind === c.kind && x.id === c.id).length;
        assert.equal(slides[i].count, had + so, c.id);
        assert.equal(slides[i].folder, 'New copy · Folder ' + (had + so) + '/4');
    });
    // A hand-made receipt with a repeated card, a spell and a legendary creature.
    const s = S.get(), common = receipt.cards.find(c => c.kind === 'creature').id;
    const n = S.copiesOf(s, common);
    S.update(x => { S.addCreature(x, S.makeCreature('test-l1', { uid: 'l1' })); });
    const crafted = { cards: [
        { kind: 'creature', id: common, rarity: 'common', foil: false, uid: 'a' },
        { kind: 'tactic', id: 'generic-small-patch', rarity: 'common', foil: true },
        { kind: 'creature', id: common, rarity: 'common', foil: false, uid: 'b' },
        { kind: 'creature', id: 'test-l1', rarity: 'legendary', foil: false, uid: 'l1' },
    ] };
    const snapshot = JSON.stringify(S.get());
    const out = P.plan(crafted);
    assert.deepEqual(out.map(x => x.count), [n - 1, S.cardCopies('tactic', 'generic-small-patch', S.get()), n, 1]);
    assert.equal(out[3].folder, 'Legendary creature: one of a kind (1/1)');
    assert.equal(out[1].kind, 'spell');
    assert.match(P.line(out[1]), /Small Patch · Common spell · New copy · Folder \d\/4 · ✦ Foil/);
    assert.equal(JSON.stringify(S.get()), snapshot, 'planning a reveal reads the save and never writes it');
});

test('sounds come only from the shared list: open, then one per card, then one jingle', () => {
    const R = pure(), P = R.PackReveal;
    assert.equal(P.soundFor({ kind: 'creature', rarity: 'common' }), 'card-play');
    assert.equal(P.soundFor({ kind: 'tactic', rarity: 'uncommon' }), 'card-play');
    assert.equal(P.soundFor({ kind: 'creature', rarity: 'rare' }), 'reveal');
    assert.equal(P.soundFor({ kind: 'tactic', rarity: 'legendary' }), 'reveal');
    assert.equal(P.soundFor({ kind: 'axiom', rarity: 'common' }), 'axiom');
    assert.equal(P.soundFor({ kind: 'creature', rarity: 'rare', foil: true }), 'reveal', 'foil adds no sound of its own');
});

test('Open, Next and See all are presentation only; Done alone marks the receipt shown', () => {
    const store = new Map();
    let m = mount(store);
    const receipt = m.R.Packs.open(m.R.Packs.quote(), 'coins').value;
    const paid = saved(store), names = m.R.PackReveal.plan(receipt).map(x => x.name);
    m.R.UI.packReveal(receipt);
    assert.match(m.text(), /Pack 1 · 5 cards · 50 Coins/);
    assert.match(m.text(), /already saved/);
    const next = m.g.document.body.querySelector('.pack-next');
    assert.ok(m.g.document.activeElement === next, 'keyboard focus starts on Open pack');
    assert.ok(m.g.document.body.querySelector('.pack-card') === null, 'no card shows before the pack opens');
    next.click();
    assert.deepEqual(m.sounds, ['open']);
    m.g.flush();
    assert.equal(m.sounds.length, 2, 'the first card sound follows the open sound');
    for (let i = 0; i < 5; i++) {
        const card = m.g.document.body.querySelector('.pack-card');
        assert.ok(card !== null);
        assert.equal(card.dataset.rarity, receipt.cards[i].rarity);
        const caption = m.g.document.body.querySelector('.pack-caption').textContent;
        assert.ok(caption.includes(names[i]), names[i]);
        assert.match(caption, /^CCommon (creature|spell)/);
        assert.match(caption, /New copy · Folder \d\/4$/);
        assert.ok(m.g.document.body.querySelector('.pack-caption .rarity-badge') !== null, 'rarity icon');
        assert.ok(m.g.document.activeElement === next, 'focus stays on the next button');
        assert.equal(saved(store), paid, 'revealing a card saves nothing');
        assert.equal(next.textContent, i < 4 ? 'Next card (' + (i + 2) + ' of 5)' : 'See all cards');
        next.click();
    }
    // One sound per card, then the shared jingle once; sounds stopped before it.
    assert.deepEqual(m.sounds.slice(-2), ['stop', 'jingle']);
    assert.equal(m.sounds.filter(x => x !== 'click' && x !== 'stop').length, 1 + 5 + 1, 'open, five cards, one jingle');
    assert.ok(m.sounds.every(x => ['open', 'card-play', 'reveal', 'axiom', 'jingle', 'stop', 'click'].includes(x)));
    const list = m.g.document.body.querySelector('.pack-results');
    assert.ok(list !== null && list.children.length === 5);
    assert.match(list.textContent, /Folder \d\/4/);
    assert.equal(saved(store), paid, 'reaching the list saves nothing');
    const before = J(m.R.State.get());
    m.button('Done').click();
    const after = J(m.R.State.get());
    assert.equal(after.wallet.pack.done, true);
    assert.equal(after.wallet.coins, before.wallet.coins);
    assert.deepEqual(after.creatures, before.creatures);
    assert.deepEqual(after.cardPrints, before.cardPrints);
    assert.equal(m.sounds.at(-1), 'stop', 'Done stops the jingle');
});

test('Skip goes straight to the list in silence; a reload replays the same receipt with no new charge', () => {
    const store = new Map();
    let m = mount(store);
    const receipt = m.R.Packs.open(m.R.Packs.quote(), 'coins').value;
    const paid = saved(store);
    let shop = m.R.UI.shop(); // the stall resumes a waiting pack with its reveal
    assert.ok(m.g.document.body.querySelector('.pack-stage') !== null);
    m.button('Open pack').click();
    m.button('Skip').click();
    m.g.flush();
    assert.deepEqual(m.sounds, ['open', 'click', 'stop'], 'Skip stops the pack sounds and the delayed card sound never plays');
    assert.ok(m.g.document.body.querySelector('.pack-stage') === null);
    assert.equal(m.g.document.body.querySelector('.pack-results').children.length, 5);
    assert.equal(saved(store), paid, 'Skip saves nothing');
    shop.close();
    // Reload before Done: the same pack, card for card, still paid once.
    m = mount(store);
    assert.equal(m.R.State.get().wallet.coins, 10);
    shop = m.R.UI.shop();
    assert.match(m.text(), /Pack 1 · 5 cards/);
    m.button('Open pack').click();
    assert.ok(m.g.document.body.querySelector('.pack-caption').textContent.includes(m.R.PackReveal.plan(receipt)[0].name));
    m.button('Skip').click();
    m.button('Done').click();
    assert.equal(m.R.State.get().wallet.pack.done, true);
    assert.equal(m.R.State.get().wallet.coins, 10);
    shop.close();
    m = mount(store); shop = m.R.UI.shop();
    assert.ok(m.g.document.body.querySelector('.pack-stage') === null, 'a finished pack does not reveal again');
    shop.close();
});

test('a foil card gets a badge and one sheen; its stats and folder rules match a normal copy', () => {
    const store = new Map();
    let id;
    const m = mount(store, R => {
        const S = R.State; id = R.Packs.roster().find(e => e.kind === 'creature').id;
        R.State.update(s => {
            // The same rolled copy twice, so only the foil flag differs.
            const shiny = S.makeCreature(id, { uid: 'shiny', foil: true });
            S.addCreature(s, shiny);
            S.addCreature(s, Object.assign(J(shiny), { uid: 'plain', foil: false }));
            s.wallet.packSerial = 1;
            s.wallet.pack = { v: 1, number: 1, version: 'test', source: 'free', price: 0, at: 0, done: false, unlocked: [],
                cards: [{ kind: 'creature', id, rarity: 'common', foil: true, uid: 'shiny' }, { kind: 'creature', id, rarity: 'common', foil: false, uid: 'plain' }] };
        });
    });
    const receipt = m.R.Packs.active();
    m.R.UI.packReveal(receipt);
    assert.match(m.text(), /Pack 1 · 2 cards · free/);
    m.button('Open pack').click();
    const shiny = m.g.document.body.querySelector('.pack-card');
    assert.ok(shiny.querySelector('.pack-sheen') !== null && shiny.querySelector('.fcard.foil') !== null);
    assert.match(m.g.document.body.querySelector('.pack-caption').textContent, /✦ Foil · looks only, same card/);
    const shinyStats = shiny.querySelector('.fcard-stats').textContent, shinyFolder = m.g.document.body.querySelector('.pack-folder').textContent;
    m.button('Next card').click();
    const plain = m.g.document.body.querySelector('.pack-card');
    assert.ok(plain.querySelector('.pack-sheen') === null && plain.querySelector('.fcard.foil') === null);
    assert.equal(plain.querySelector('.fcard-stats').textContent, shinyStats, 'foil changes no stats');
    assert.equal(shinyFolder.replace(/\d\/4/, ''), m.g.document.body.querySelector('.pack-folder').textContent.replace(/\d\/4/, ''));
    assert.ok(!/upgrade/i.test(m.text()), 'no upgrade ladder');
    m.button('See all cards').click();
    assert.match(m.text(), /Foil changes the look only: same stats, same limits\./);
});

test('the reveal never writes progress, loops motion or uses its own sounds; Calm and reduced motion are covered', () => {
    const source = fs.readFileSync(path.join(GAME_DIR, 'js/ui/pack-reveal.js'), 'utf8');
    for (const write of ['transact(', 'State.update(', 'grantPrint', 'addCreature', 'spendCoins', 'saveNow', 'localStorage'])
        assert.ok(!source.includes(write), 'pack-reveal.js must not call ' + write);
    const sounds = [...source.matchAll(/sound\('([\w-]+)'\)/g)].map(m => m[1]);
    assert.deepEqual([...new Set(sounds)].sort(), ['jingle', 'open']);
    const css = fs.readFileSync(path.join(GAME_DIR, 'css/screens.css'), 'utf8');
    const pack = css.slice(css.indexOf('/* Pack reveal (#134)'));
    assert.ok(pack.length > 100 && !/infinite|alternate/.test(pack), 'no looping animation');
    assert.match(pack, /\.pack-in \{ animation: pack-in 0\.3s ease-out 1 both; \}/);
    assert.match(pack, /\.pack-card \.pack-sheen \{ animation: pack-sheen 0\.9s ease-out 0\.25s 1 both; \}/);
    assert.match(pack, /\.pack-sheen \{[^}]*opacity: 0;/, 'the sheen rests hidden');
    assert.match(pack, /body\.calm-motion \.pack-in, body\.calm-motion \.pack-card \.pack-sheen \{ animation: none !important; \}/);
    assert.match(pack, /@media \(prefers-reduced-motion: reduce\) \{\s*\.pack-in \{ animation: pack-fade[^}]*\}\s*\.pack-sheen \{ display: none; \}/);
    assert.ok(!/@keyframes pack-[\w-]+ \{[^}]*rotate/.test(pack), 'no shake');
    const html = fs.readFileSync(path.join(GAME_DIR, 'index.html'), 'utf8');
    assert.ok(html.indexOf('js/ui/pack-reveal.js') > html.indexOf('js/ui/ui.js'));
});

test('an Axiom shows its own art on the parchment glow and keeps light ink on its dark panel', () => {
    const m = mount(new Map());
    const R = m.R, id = Object.keys(R.data.axioms)[0];
    R.data.axioms[id].art = 'art/axiom-rule-motif';
    R.Assets = { has: x => x === 'art/axiom-rule-motif' || x === 'ui/card-axiom', img: (x, o) => R.el('img', { alt: (o && o.alt) || '', className: (o && o.className) || '', dataset: { asset: x } }) };
    R.PackReveal.show({ number: 1, source: 'free', price: 0, cards: [{ kind: 'axiom', id, rarity: 'common', foil: false }] });
    m.button('Open pack').click();
    const face = m.g.document.body.querySelector('.pack-print');
    assert.ok(face !== null && face.classList.contains('axiom') && !face.classList.contains('no-frame'));
    assert.equal(face.querySelector('.fcard-art img').dataset.asset, 'art/axiom-rule-motif');
    assert.equal(face.querySelector('img.fcard-frame').dataset.asset, 'ui/card-axiom');
    const css = fs.readFileSync(path.join(GAME_DIR, 'css/screens.css'), 'utf8');
    assert.match(css, /\.pack-print:not\(\.no-frame\):not\(\.axiom\) \.fcard-panel \{ color: #2b1a0e; \}/, 'dark ink on spell parchment only');
});

test('Escape skips the reveal to the same list and stops listening once closed', () => {
    const store = new Map();
    const m = mount(store);
    const receipt = m.R.Packs.open(m.R.Packs.quote(), 'coins').value;
    const paid = saved(store), listening = m.keys.size; // ui.js keeps its own input guard
    m.R.UI.packReveal(receipt);
    m.button('Open pack').click();
    m.g.flush(); // the guard after opening passes
    m.press('Escape');
    assert.ok(m.g.document.body.querySelector('.pack-stage') === null, 'Escape closed the reveal');
    assert.equal(m.g.document.body.querySelector('.pack-results').children.length, 5);
    assert.equal(saved(store), paid, 'Escape saves nothing');
    m.press('Escape');
    assert.ok(m.g.document.body.querySelector('.pack-results') !== null, 'a second Escape does not close the list (Done is required)');
    m.button('Done').click();
    assert.equal(m.keys.size, listening, 'no key listener left behind');
    assert.equal(m.R.State.get().wallet.pack.done, true);
});

test('the receipt keeps each folder count; later catches or a released copy do not change what the reveal says', () => {
    const R = pure(), S = R.State, P = R.PackReveal;
    const receipt = R.Packs.open(R.Packs.quote(), 'coins').value;
    assert.ok(receipt.cards.every(c => Number.isSafeInteger(c.copies) && c.copies >= 1), 'each card saves its folder count');
    const before = P.plan(receipt).map(x => x.folder);
    assert.deepEqual(P.plan(receipt).map(x => x.count), receipt.cards.map(c => c.copies));
    // Before Done (say after a reload): catch another copy of the first card, then release the last pack creature.
    const first = receipt.cards.find(c => c.kind === 'creature'), last = receipt.cards.filter(c => c.kind === 'creature').at(-1);
    S.update(s => { S.addCreature(s, S.makeCreature(first.id, { uid: 'later' })); s.creatures = s.creatures.filter(c => c.uid !== last.uid); });
    const after = P.plan(receipt);
    after.forEach((x, i) => {
        if (x.card.uid === last.uid) assert.equal(x.folder, before[i] + ' · no longer in your Collection');
        else assert.equal(x.folder, before[i]);
    });
    // An older receipt without counts falls back to today's save.
    const legacy = { ...receipt, cards: receipt.cards.map(({ copies, ...c }) => c) };
    assert.ok(P.plan(legacy).every(x => Number.isSafeInteger(x.count)));
});
