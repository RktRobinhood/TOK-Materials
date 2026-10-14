// Owned avatar-type starter decks (#114): the five exact twelve-creature/eight-tactic lists and the default
// ten axioms from design/drafts/card-arena-2026-10-12 (CARD-DRAFTS.md, starter-decks.json), granted once per
// adventure as real owned cards with a versioned receipt in the save (save.starter). Reloads, backups,
// avatar appearance changes and chapter jumps never grant again; existing adventures get a safe catch-up.
// Every list obeys the shared construction rules (#112) and plays with both avatar powers.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { loadRift, GAME_DIR } from './harness.mjs';

const FILES = ['js/core/rift.js', 'js/core/state.js', 'js/core/world.js', 'data/avatars.js', 'data/creatures.js', 'data/items.js', 'data/map.js',
    'data/axioms.js', 'data/tactics.js', 'data/fate.js', 'data/powers.js', 'data/starters.js',
    'js/battle/abilities.js', 'js/battle/engine.js', 'js/battle/ai.js', 'js/battle/lesson.js', 'js/battle/team-codes.js'];
const R = loadRift(FILES);
const S = R.State, E = R.Battle.Engine, AI = R.Battle.AI;
const J = x => JSON.parse(JSON.stringify(x));
const TYPES = ['owlet', 'mothkin', 'fox', 'frogling', 'raven'];
const DRAFT = JSON.parse(fs.readFileSync(GAME_DIR + '/design/drafts/card-arena-2026-10-12/starter-decks.json', 'utf8'));

function adventure(type, variant, extra) {
    const s = S.freshState();
    s.seed = 12345;
    s.avatar = { type, variant: variant || 'girl', nickname: 'Ida', realName: 'Ida Test' };
    R.World.start(s);
    Object.assign(s, extra || {});
    return s;
}

test('the five runtime lists are exactly the drafted ones, use only existing common/baseline cards and pass the shared rules', () => {
    const D = R.data.starterDecks;
    assert.deepEqual(Object.keys(D.decks).sort(), TYPES.slice().sort());
    assert.deepEqual(Object.keys(R.data.avatars).sort(), TYPES.slice().sort(), 'one list per avatar type, no Wolf');
    assert.deepEqual(J(D.axioms), J(R.data.axiomDecks.default));
    const baseline = new Set(R.data.tacticDecks.starter.concat(R.data.tacticDecks.earned));
    for (const draft of DRAFT.decks) {
        const deck = D.decks[draft.avatarType];
        assert.deepEqual(J(deck.creatures), draft.creatures, draft.avatarType + ' creatures');
        assert.deepEqual(J(deck.tactics), draft.tactics, draft.avatarType + ' tactics');
        assert.deepEqual(J(D.axioms), draft.axioms, draft.avatarType + ' axioms');
        assert.equal(deck.strategy, draft.strategy);
        assert.equal(deck.creatures.length, 12);
        assert.equal(deck.tactics.length, 8);
        deck.creatures.forEach(id => {
            const c = R.data.creatures[id];
            assert.ok(c, 'runtime creature ' + id);
            assert.equal(c.rarity, 'common', id + ' is a common card');
        });
        const colour = R.data.avatars[draft.avatarType].colour;
        assert.equal(deck.creatures.filter(id => R.data.creatures[id].colour === colour).length, 6, draft.avatarType + ': six of its colour');
        deck.tactics.forEach(id => {
            const t = R.data.tactics[id];
            assert.ok(t, 'runtime tactic ' + id);
            assert.ok(t.colour ? t.colour === colour && t.rarity === 'common' : baseline.has(id), id + ' is a common colour tactic of ' + colour + ' or a baseline generic one');
        });
        assert.equal(deck.tactics.filter(id => R.data.tactics[id].colour).length, 4);
        D.axioms.forEach(id => assert.ok(R.data.axioms[id] && !R.data.axioms[id].own, id));
        const r = S.validateDeck({ creatures: deck.creatures, tactics: deck.tactics, axioms: D.axioms });
        assert.ok(r.valid, draft.avatarType + ': ' + r.message);
        assert.deepEqual(J(r.quota[colour]), { creatures: 6, tactics: 4 });
        assert.ok(deck.creatures.filter(id => R.data.creatures[id].cost <= 2).length >= 6, draft.avatarType + ' has a cheap opening');
    }
});

test('a new adventure gets the starter as real owned cards and its loadout, once; both variants get the same list', () => {
    for (const type of TYPES) {
        const lists = ['boy', 'girl'].map(variant => {
            const s = adventure(type, variant);
            const receipt = S.grantStarter(s);
            assert.ok(receipt, type + ' ' + variant);
            assert.equal(receipt.v, R.data.starterDecks.version);
            assert.equal(receipt.type, type);
            assert.equal(receipt.catchUp, false);
            assert.equal(s.creatures.length, 12);
            s.creatures.forEach(c => {
                assert.equal(c.loaner, undefined, 'owned, not a loan');
                assert.deepEqual(J(c.variant), { attack: 0, health: 0, trait: null }, 'plain starter copies');
                assert.ok(s.seen.includes(c.species));
            });
            assert.deepEqual(J(receipt.uids), J(s.creatures.map(c => c.uid)));
            assert.deepEqual(J(s.team), J(receipt.uids), 'the starter is the loadout');
            assert.deepEqual(J(s.deckTactics), J(R.data.starterDecks.decks[type].tactics));
            assert.deepEqual(J(s.axiomLoadout), J(R.data.starterDecks.axioms));
            R.data.starterDecks.decks[type].tactics.forEach(id => assert.ok(S.ownedTactics(s).includes(id), id + ' is owned'));
            const own = S.ownDeck(s);
            assert.ok(own.check.valid, type + ': ' + own.check.message);
            assert.deepEqual(J(own.loans), [], 'no loaned creatures');
            assert.equal(S.grantStarter(s), null, 'never twice');
            assert.equal(s.creatures.length, 12);
            return { species: s.creatures.map(c => c.species), tactics: s.deckTactics };
        });
        assert.deepEqual(J(lists[0]), J(lists[1]), type + ': same list for both variants');
    }
});

test('the grant is deterministic for one adventure and its uids never collide', () => {
    const a = adventure('fox'), b = adventure('fox');
    const strip = s => J(Object.assign({}, S.grantStarter(s), { at: 0 }));
    assert.deepEqual(strip(a), strip(b));
    assert.deepEqual(J(a.creatures.map(c => [c.uid, c.species])), J(b.creatures.map(c => [c.uid, c.species])));
    assert.equal(new Set(a.creatures.map(c => c.uid)).size, 12);
    const c = adventure('fox');
    c.creatures.push(S.makeCreature('muskrat', { uid: a.creatures[0].uid }));
    S.grantStarter(c);
    assert.equal(new Set(c.creatures.map(x => x.uid)).size, 13, 'an existing uid is never reused');
});

test('reloads, backup codes, appearance changes and chapter jumps cannot repeat the grant', async () => {
    const store = new Map();
    const W = loadRift(FILES);
    W.storage = () => ({ getItem: k => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: k => store.delete(k) });
    const fresh = W.State.newGame();
    W.State.update(s => { s.avatar = { type: 'owlet', variant: 'boy', nickname: 'Bo', realName: 'Bo' }; W.World.start(s); W.State.grantStarter(s); });
    W.State.saveNow();
    assert.equal(fresh.creatures.length, 12);
    const receipt = J(W.State.get().starter);
    // Reload.
    W.State.load();
    assert.equal(W.State.ensureStarter(), null);
    assert.equal(W.State.get().creatures.length, 12);
    assert.deepEqual(J(W.State.get().starter), receipt);
    // Appearance change: the receipt belongs to the adventure, not to the look.
    W.State.update(s => { s.avatar.variant = 'girl'; });
    assert.equal(W.State.ensureStarter(), null);
    W.State.update(s => { s.avatar.type = 'raven'; });
    assert.equal(W.State.ensureStarter(), null, 'not even a different type');
    assert.equal(W.State.get().creatures.length, 12);
    // Chapter jumps (the old starter kit gives a creature only to nearly empty collections).
    W.State.update(s => { W.World.jumpToChapter(s, 'ch2'); W.World.jumpToChapter(s, 'ch3'); });
    assert.equal(W.State.ensureStarter(), null);
    assert.equal(W.State.get().creatures.length, 12);
    // A backup round trip keeps the receipt; importing it never grants again.
    const code = await W.State.exportCode();
    W.State.wipe();
    await W.State.importCode(code);
    assert.deepEqual(J(W.State.get().starter), receipt);
    assert.equal(W.State.ensureStarter(), null);
    assert.equal(W.State.get().creatures.length, 12);
});

test('catch-up for an existing adventure keeps catches, earned unlocks and custom loadouts, and runs once', async () => {
    const W = loadRift(FILES);
    const store = new Map();
    W.storage = () => ({ getItem: k => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: k => store.delete(k) });
    // A save made before #114: a Reason avatar with catches, a trophy, an earned tactic, an earned axiom and a custom deck.
    const old = W.State.freshState();
    old.avatar = { type: 'frogling', variant: 'girl', nickname: 'Old', realName: 'Old Timer' };
    old.chapter = 'ch2';
    ['muskrat', 'lobstorian', 'tremendoodle', 'kardashiant', 'kardashiant', 'eelish', 'eelish', 'keanu', 'beastie', 'zuckerborg', 'zuckerborg', 'khaby']
        .forEach((sp, i) => old.creatures.push(W.State.makeCreature(sp, { uid: 'old-' + i })));
    old.trophies.push(W.State.makeCreature('godelix', { uid: 'trophy-1', trophyOf: 'Ida' }));
    old.tactics = ['lemma', 'recall'];
    old.axioms = ['age-of-reason'];
    old.team = old.creatures.slice(0, 10).map(c => c.uid);
    old.deckTactics = ['lemma', 'lemma', 'recall', 'counterexample', 'eureka', 'pep-talk', 'stand-firm', 'second-wind', 'clockwork', 'rethink'];
    old.axiomLoadout = ['age-of-reason', 'mercy', 'mercy', 'thrift', 'underdog', 'study', 'arrival', 'vigilance', 'choice', 'abundance'];
    old.stats.catches = 12;
    delete old.starter; // an old save has no receipt field at all
    const before = J(old);
    W.State.replace(J(old));
    const receipt = W.State.ensureStarter();
    assert.ok(receipt);
    assert.equal(receipt.catchUp, true);
    const s = W.State.get();
    assert.deepEqual(J(s.creatures.slice(0, 12)), before.creatures, 'every catch kept, in order, unchanged');
    assert.equal(s.creatures.length, 24);
    assert.deepEqual(J(s.trophies), before.trophies);
    assert.deepEqual(J(s.team), before.team, 'the custom team is untouched');
    assert.deepEqual(J(s.deckTactics), before.deckTactics);
    assert.deepEqual(J(s.axiomLoadout), before.axiomLoadout);
    assert.deepEqual(J(s.axioms), before.axioms);
    assert.ok(['lemma', 'recall'].every(id => s.tactics.includes(id)), 'earned unlocks kept');
    assert.ok(['remember-when', 'stored-thought'].every(id => W.State.ownedTactics(s).includes(id)), 'the starter tactics are now owned');
    assert.equal(s.stats.catches, 12, 'a grant is not a catch');
    assert.equal(W.State.ensureStarter(), null, 'idempotent');
    assert.equal(W.State.get().creatures.length, 24);
    // The catch-up player can switch to the starter deck in Collection: the receipt says which copies.
    const starterDeck = W.State.validateDeck({ creatures: receipt.uids.map(uid => s.creatures.find(c => c.uid === uid)), tactics: receipt.tactics, axioms: receipt.axioms });
    assert.ok(starterDeck.valid, starterDeck.message);
    // An existing adventure that never customised its deck keeps its default, now made of catches first.
    const plain = W.State.freshState();
    plain.avatar = { type: 'fox', variant: 'boy', nickname: 'P', realName: 'P' };
    ['muskrat', 'muskrat', 'muskrat', 'lobstorian'].forEach((sp, i) => plain.creatures.push(W.State.makeCreature(sp, { uid: 'p' + i })));
    W.State.grantStarter(plain);
    assert.deepEqual(J(plain.team), [], 'not set: the default team keeps the player\'s own catches first');
    const own = W.State.ownDeck(plain);
    assert.deepEqual(J(own.team.slice(0, 3).map(c => c.uid)), ['p0', 'p1', 'p3'], 'catches first, copy limit kept');
    assert.ok(own.check.valid, own.check.message);
    assert.deepEqual(J(own.loans), []);
});

test('an adventure without an avatar or with an unknown type gets nothing', () => {
    const s = S.freshState();
    assert.equal(S.grantStarter(s), null);
    s.avatar = { type: 'wolf', variant: 'boy', nickname: 'W' };
    assert.equal(S.grantStarter(s), null);
    assert.equal(s.starter, null);
    assert.equal(s.creatures.length, 0);
});

test('every starter plays complete deterministic matches with both of its avatar powers, first and second', () => {
    const team = (deck, p) => deck.creatures.map((sp, i) => ({ uid: 's' + p + '-' + i, species: sp, variant: { attack: 0, health: 0, trait: null }, injuries: [], scars: [], powerDelta: 0, warped: null, trophyOf: null }));
    const used = {};
    TYPES.forEach((type, k) => {
        const deck = R.data.starterDecks.decks[type];
        const rival = R.data.starterDecks.decks[TYPES[(k + 1) % TYPES.length]];
        ['boy', 'girl'].forEach(variant => {
            const power = R.Powers.forAvatar({ type, variant });
            assert.ok(power, type + ' ' + variant + ' has a power');
            [0, 1].forEach(first => {
                const make = () => E.createBattle({
                    seed: 'starter:' + type + ':' + variant + ':' + first,
                    players: [{ team: team(deck, 0), tactics: deck.tactics, axioms: R.data.starterDecks.axioms, power },
                        { team: team(rival, 1), tactics: rival.tactics, axioms: R.data.starterDecks.axioms, power: R.Powers.forAvatar({ type: TYPES[(k + 1) % TYPES.length], variant }) }],
                    options: { first },
                });
                const start = make();
                const P = start.players[0];
                assert.equal(P.deck.length + P.hand.length, 20, 'twenty own cards');
                assert.ok(!Object.keys(start.cards).some(cid => start.cards[cid].loaner), 'no loaned pad creatures');
                const steps = [];
                const end = AI.playOut(start, ['normal', 'normal'], (prev, a) => steps.push(E.actionKey(a)));
                assert.ok(E.winner(end) != null, type + ' ' + variant + ' reaches a result');
                const again = [];
                AI.playOut(make(), ['normal', 'normal'], (prev, a) => again.push(E.actionKey(a)));
                assert.deepEqual(again, steps, 'deterministic');
                used[power.id] = (used[power.id] || 0) + end.players[0].power.uses;
            });
        });
    });
    const powers = Object.keys(used);
    assert.equal(powers.length, 10, 'ten avatar powers tried');
    assert.ok(powers.filter(id => used[id] > 0).length >= 8, 'the AI uses most powers with the starter decks: ' + JSON.stringify(used));
});

test('Collection: a catch-up player can switch to the starter deck in one click; a lost starter copy is replaced by another owned copy', async () => {
    const { loadWithDom } = await import('./fake-dom.mjs');
    const modals = [];
    const g = loadWithDom(['js/core/rift.js', 'js/core/state.js', 'data/avatars.js', 'data/creatures.js', 'data/items.js', 'data/axioms.js', 'data/tactics.js', 'data/starters.js', ctx => {
        const Rf = ctx.Rift;
        const save = Rf.State.freshState();
        save.avatar = { type: 'mothkin', variant: 'boy', nickname: 'M', realName: 'M' };
        ['muskrat', 'lobstorian', 'kardashiant', 'eelish', 'eelish', 'keanu', 'beastie', 'khaby', 'zuckerborg', 'zuckerborg'].forEach((sp, i) => save.creatures.push(Rf.State.makeCreature(sp, { uid: 'own-' + i })));
        save.team = save.creatures.map(c => c.uid);
        Rf.State.grantStarter(save);
        // A starter Kardashiant was lost in a stake; the player's own caught one stands in.
        save.creatures = save.creatures.filter(c => c.uid !== save.starter.uids[0]);
        Rf.State.get = () => save; Rf.State.update = fn => fn(save);
        Rf.Screens = { register() {} };
        Rf.Assets = { has: () => false, img: () => Rf.el('img') };
        Rf.UI = { toast() {}, statLine: () => Rf.el('span'), variantBadges: () => Rf.el('span'), framedCard: () => Rf.el('div'),
            modal(title, body, buttons) { const m = { title, body, buttons, node: Rf.el('div'), closed: false, close() { m.closed = true; } }; modals.push(m); return m; } };
    }, 'js/screens/collection.js']);
    const save = g.Rift.State.get();
    assert.equal(save.starter.catchUp, true);
    const dialog = g.Rift.Collection.editOwnDeck();
    dialog.buttons.find(b => b.label === 'Starter deck').onclick();
    assert.match(dialog.body.querySelector('.deck-status').textContent, /^Deck 20\/20: 12 creatures \+ 8 tactics\.$/);
    dialog.buttons.find(b => b.label === 'Save deck').onclick();
    assert.equal(dialog.closed, true);
    assert.deepEqual(J(save.team.map(uid => save.creatures.find(c => c.uid === uid).species)).sort(), J(R.data.starterDecks.decks.mothkin.creatures).sort());
    assert.ok(save.team.includes('own-2'), 'the caught Kardashiant replaces the lost starter copy');
    assert.deepEqual(J(save.deckTactics).sort(), J(R.data.starterDecks.decks.mothkin.tactics).sort());
    assert.ok(g.Rift.State.ownDeck(save).check.valid);
});
