// Roaming legendary hunts (#111, design/ROAMING-LEGENDARIES.md): discovery, the flight to a different
// legal site, travel before a retry, reload/backup survival, repeated submissions, the once-only claim,
// practice, the fallback, ordinary spawn tables and the three trick challenges.
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadRift } from './harness.mjs';

const FILES = ['js/core/rift.js', 'js/core/state.js', 'js/core/world.js', 'data/map.js', 'data/creatures.js', 'data/tactics.js',
    'data/items.js', 'data/legendaries.js', 'js/core/hunts.js', 'js/core/tricks.js'];
const J = x => JSON.parse(JSON.stringify(x));

function memoryStorage() {
    const m = new Map();
    return { getItem: k => (m.has(k) ? m.get(k) : null), setItem: (k, v) => { m.set(k, String(v)); }, removeItem: k => { m.delete(k); } };
}

function setup() {
    const R = loadRift(FILES);
    R.storage = () => memoryStorage();
    const s = R.State.freshState();
    s.avatar = { type: 'owlet', variant: 'girl', nickname: 'Ada' };
    s.seed = 12345;
    return { R, H: R.Hunts, s };
}

// Stand in a chapter with every one of its nodes on that map revealed (no story progress needed).
function openChapter(R, s, ch) {
    R.World.jumpToChapter(s, ch);
    const mapId = R.data.chapters[ch] && R.World.node(R.data.chapters[ch].start).map;
    Object.entries(R.data.map.nodes).forEach(([id, n]) => { if ((n.map || 'main') === mapId) R.World.reveal(s, id); });
    // Story locks (flags, puzzle counts) stay as they are; hunts must respect them.
    return mapId;
}

const walkTo = (s, id) => { s.map.at = id; };

test('fresh saves and old saves both get an empty hunts object', () => {
    const { R } = setup();
    assert.deepEqual(J(R.State.freshState().hunts), {});
    const old = J(R.State.freshState());
    delete old.hunts;
    assert.deepEqual(J(R.State.migrate(old).hunts), {});
});

test('roaming species never appear in an ordinary spawn table', () => {
    const { R, s } = setup();
    ['maskip', 'quibblequill', 'oddsnap'].forEach(sp => { s.flags['rumour:' + sp] = true; });
    Object.values(R.data.map.nodes).forEach(n => {
        const w = R.World.spawnWeights(s, Object.assign({}, n, { spawns: (n.spawns || []).concat(['maskip', 'quibblequill', 'oddsnap']) }));
        ['maskip', 'quibblequill', 'oddsnap'].forEach(sp => assert.ok(!(sp in w), sp + ' spawned at ' + n.id));
    });
    assert.ok(R.Hunts.roaming('maskip') && !R.Hunts.roaming('proof-pup'));
});

test('every hunt names real sites on its own painted map, no bosses or rifts, and each challenge exists', () => {
    const { R } = setup();
    Object.entries(R.data.hunts).forEach(([id, d]) => {
        assert.ok(R.data.creatures[d.species] && R.data.creatures[d.species].roaming, id + ' species');
        assert.equal(R.data.creatures[d.species].rarity, 'legendary');
        assert.ok(R.Tricks.make(d.challenge, 1), id + ' challenge');
        assert.ok(d.sites.length >= 2);
        d.sites.forEach(n => {
            const node = R.data.map.nodes[n];
            assert.ok(node, id + ': unknown site ' + n);
            assert.equal(node.map || 'main', d.map, id + ': ' + n + ' is on another map');
            assert.ok(!['boss', 'rift'].includes(node.type), id + ': ' + n + ' is a ' + node.type);
        });
    });
    // fair-finale belongs to Chapter 4 but sits on the main map: never an Oddsnap site.
    assert.ok(!R.data.hunts.oddsnap.sites.includes('fair-finale'));
});

test('a hunt is found only on its map, once two legal sites are revealed and reachable', () => {
    const { R, H, s } = setup();
    R.World.jumpToChapter(s, 'ch2');
    s.map.revealed = ['b-arrival'];
    assert.deepEqual(J(H.sync(s)), []);
    assert.equal(H.record(s, 'maskip'), null);
    openChapter(R, s, 'ch2');
    assert.deepEqual(J(H.sync(s)), ['maskip']);
    const rec = H.record(s, 'maskip');
    assert.equal(rec.phase, 'roaming');
    assert.equal(rec.attempt, 1);
    assert.ok(R.data.hunts.maskip.sites.includes(rec.node));
    assert.equal(H.sync(s).length, 0, 'found only once');
    assert.equal(H.record(s, 'oddsnap'), null, 'other maps stay unfound');
});

test('the hunt never touches story progress: completed, revealed, flags and chapter stay the same', () => {
    const { R, H, s } = setup();
    openChapter(R, s, 'ch2');
    H.sync(s);
    const before = J({ map: s.map, flags: s.flags, chapter: s.chapter, health: s.health, scars: s.scars, items: s.items });
    const rec = H.record(s, 'maskip');
    walkTo(s, rec.node);
    H.pass(s, 'maskip', 1, 0);
    H.fail(s, 'maskip', 1, s.map.at);
    walkTo(s, H.record(s, 'maskip').node);
    [0, 1, 2].forEach(r => H.pass(s, 'maskip', 2, r));
    H.claim(s, 'maskip', 2);
    const after = J({ map: s.map, flags: s.flags, chapter: s.chapter, health: s.health, scars: s.scars, items: s.items });
    after.map.at = before.map.at; // only the avatar's own walking moved it
    assert.deepEqual(after, before);
});

test('a wrong answer resets the run, sends the creature to a different legal site once, and needs travel', () => {
    const { R, H, s } = setup();
    openChapter(R, s, 'ch2');
    H.sync(s);
    const first = H.record(s, 'maskip').node;
    walkTo(s, first);
    assert.equal(H.canAttempt(s, 'maskip', first).ok, true);
    assert.equal(H.pass(s, 'maskip', 1, 0), true);
    assert.equal(H.record(s, 'maskip').round, 1);

    const out = H.fail(s, 'maskip', 1, first);
    assert.ok(out && out.to !== first && out.tier === 'roam');
    const rec = H.record(s, 'maskip');
    assert.equal(rec.node, out.to);
    assert.equal(rec.attempt, 2);
    assert.equal(rec.round, 0, 'the whole challenge resets');
    assert.deepEqual(J(rec.departure), { attempt: 1, from: first, to: out.to, tier: 'roam', seen: false });
    assert.ok(H.legalSites(s, 'maskip', first).includes(out.to));

    // A double click, a replayed event or a reload re-submitting the old attempt changes nothing.
    const snapshot = J(rec);
    assert.equal(H.fail(s, 'maskip', 1, first), null);
    assert.equal(H.pass(s, 'maskip', 1, 0), false);
    assert.deepEqual(J(H.record(s, 'maskip')), snapshot);

    // No retry at the old site; the avatar has to walk to the new one.
    assert.equal(H.canAttempt(s, 'maskip', first).ok, false);
    assert.match(H.canAttempt(s, 'maskip', first).reason, /ran to/);
    assert.equal(H.canAttempt(s, 'maskip', out.to).ok, false, 'still standing at the old site');
    walkTo(s, out.to);
    assert.equal(H.canAttempt(s, 'maskip', out.to).ok, true);
    assert.match(H.status(s, 'maskip'), /ran from/);

    // The trail stays until the map has shown the departure and the avatar has caught up.
    H.sync(s);
    assert.ok(H.record(s, 'maskip').departure);
    assert.equal(H.seen(s, 'maskip'), true);
    assert.equal(H.seen(s, 'maskip'), false, 'shown once');
    H.sync(s);
    assert.equal(H.record(s, 'maskip').departure, null);
});

test('the destination is fixed by the save: the same save always picks the same site', () => {
    const { R, H, s } = setup();
    openChapter(R, s, 'ch3');
    H.sync(s);
    const at = H.record(s, 'quibblequill').node;
    walkTo(s, at);
    const a = J(s), b = J(s);
    assert.deepEqual(H.fail(a, 'quibblequill', 1, at), H.fail(b, 'quibblequill', 1, at));
    // A flight never goes straight back where the creature just came from while another site is legal.
    walkTo(a, H.record(a, 'quibblequill').node);
    const second = H.fail(a, 'quibblequill', 2, a.map.at);
    assert.notEqual(second.to, at);
});

test('locked or unrevealed places are never a destination; with no other site it falls back, then hides', () => {
    const { R, H, s } = setup();
    openChapter(R, s, 'ch4');
    H.sync(s);
    const rec = H.record(s, 'oddsnap');
    walkTo(s, rec.node);
    // Every legal pick is revealed, unlocked, on the Tower map and reachable from where it fled.
    for (let i = 1; i < 12; i++) {
        const from = H.record(s, 'oddsnap').node;
        walkTo(s, from);
        const out = H.fail(s, 'oddsnap', i, from);
        const n = R.data.map.nodes[out.to];
        assert.notEqual(out.to, from);
        assert.equal(n.map, 'ch4');
        assert.ok(s.map.revealed.includes(out.to));
        assert.equal(R.World.lockReason(s, out.to), null);
        assert.ok(!['boss', 'rift'].includes(n.type));
    }
    // Only the avatar's own station and one other non-site node are open → the fallback tier.
    const t = setup();
    R.World.jumpToChapter(t.s, 'ch4');
    t.s.map.revealed = ['k-base', 'k-gallery', 'k-prediction'];
    t.H.sync(t.s);
    walkTo(t.s, t.H.record(t.s, 'oddsnap').node);
    t.s.map.revealed = [t.s.map.at, 'k-base'];
    const fb = t.H.destination(t.s, 'oddsnap', t.s.map.at);
    assert.equal(fb.tier, 'hide', 'k-base is a rift: never a destination');
    t.s.map.revealed = ['k-gallery', 'k-prediction', 'k-stairwell'];
    t.s.map.at = 'k-gallery';
    t.s.hunts.oddsnap.node = 'k-gallery';
    const hidden = t.H.fail(t.s, 'oddsnap', t.H.record(t.s, 'oddsnap').attempt, 'k-gallery');
    assert.equal(hidden.tier, 'roam');
    // Nowhere else at all: it hides at the same place until the avatar has walked away and back.
    const u = setup();
    R.World.jumpToChapter(u.s, 'ch4');
    u.s.map.revealed = ['k-base', 'k-gallery', 'k-prediction'];
    u.H.sync(u.s);
    u.s.map.at = u.s.hunts.oddsnap.node;
    u.s.map.revealed = [u.s.map.at];
    const hide = u.H.fail(u.s, 'oddsnap', 1, u.s.map.at);
    assert.equal(hide.tier, 'hide');
    assert.equal(u.H.canAttempt(u.s, 'oddsnap', u.s.map.at).ok, false);
    const home = u.s.map.at;
    u.s.map.at = 'k-base';
    u.H.sync(u.s);
    u.s.map.at = home;
    assert.equal(u.H.canAttempt(u.s, 'oddsnap', home).ok, true);
});

test('passing all rounds grants exactly one unique creature, once, and later visits are practice', () => {
    const { R, H, s } = setup();
    openChapter(R, s, 'ch2');
    H.sync(s);
    walkTo(s, H.record(s, 'maskip').node);
    const owned = s.creatures.length;
    assert.equal(H.claim(s, 'maskip', 1), null, 'no claim before the rounds are passed');
    assert.equal(H.ROUNDS, R.Tricks.ROUNDS, 'the save and the challenge agree on the run length');
    for (let r = 0; r < H.ROUNDS; r++) {
        if (r === H.ROUNDS - 1) assert.equal(H.claim(s, 'maskip', 1), null, 'one round short is no claim');
        assert.equal(H.pass(s, 'maskip', 1, r), true);
    }
    assert.equal(H.pass(s, 'maskip', 1, H.ROUNDS), false);
    const receipt = H.claim(s, 'maskip', 1);
    assert.ok(receipt);
    assert.equal(s.creatures.length, owned + 1);
    const inst = s.creatures.find(c => c.uid === receipt.uid);
    assert.equal(inst.species, 'maskip');
    assert.deepEqual(J(inst.variant), { attack: 0, health: 0, trait: null });
    assert.ok(s.seen.includes('maskip'));
    assert.equal(H.claim(s, 'maskip', 1), null, 'a repeat never grants another');
    // Releasing the creature does not reopen the reward: the receipt, not ownership, decides.
    s.creatures = s.creatures.filter(c => c.species !== 'maskip');
    assert.equal(H.claim(s, 'maskip', 1), null);
    const p = H.canAttempt(s, 'maskip', s.map.at);
    assert.equal(p.ok, true);
    assert.equal(p.practice, true);
    const seed = H.runSeed(s, 'maskip');
    assert.equal(H.fail(s, 'maskip', 1, s.map.at), null, 'practice never relocates');
    assert.equal(H.practiced(s, 'maskip'), true);
    assert.notEqual(H.runSeed(s, 'maskip'), seed, 'a new practice run');
});

test('independent hunts coexist on their own maps', () => {
    const { R, H, s } = setup();
    openChapter(R, s, 'ch2');
    H.sync(s);
    openChapter(R, s, 'ch3');
    H.sync(s);
    walkTo(s, H.record(s, 'quibblequill').node);
    H.fail(s, 'quibblequill', 1, s.map.at);
    assert.equal(H.record(s, 'maskip').attempt, 1);
    assert.equal(H.record(s, 'quibblequill').attempt, 2);
    assert.deepEqual(J(H.at(s, H.record(s, 'maskip').node)), ['maskip']);
});

test('a hunt survives a reload and a backup-code round trip, mid-run and mid-flight', async () => {
    const { R, H } = setup();
    const S = R.State;
    S.newGame();
    S.update(s => { s.avatar = { type: 'owlet', variant: 'girl', nickname: 'Ada' }; openChapter(R, s, 'ch2'); H.sync(s); });
    S.update(s => { walkTo(s, H.record(s, 'maskip').node); H.pass(s, 'maskip', 1, 0); });
    const midRun = J(S.get().hunts);
    assert.equal(midRun.maskip.round, 1);
    S.update(s => { H.fail(s, 'maskip', 1, s.map.at); });
    const midFlight = J(S.get());
    assert.equal(midFlight.hunts.maskip.departure.seen, false);
    const code = await S.exportCode();
    S.wipe();
    const back = J(await S.importCode(code));
    assert.deepEqual(back.hunts, midFlight.hunts);
    // A reload keeps the same rounds for the same attempt (no reroll).
    const t1 = R.Tricks.make('maskip', H.runSeed(back, 'maskip'));
    const t2 = R.Tricks.make('maskip', H.runSeed(midFlight, 'maskip'));
    assert.deepEqual(J(t1), J(t2));
});

// The trick rounds themselves are checked in tools/test/tricks.test.mjs.
