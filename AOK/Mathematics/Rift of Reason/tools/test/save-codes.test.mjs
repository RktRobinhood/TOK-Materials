// Backup codes are the students' only protection against losing progress (the save lives in one
// browser's localStorage). These tests check that every part of a save survives export → wipe →
// import exactly, that old codes keep loading, that messy pastes work, and that damaged codes
// always give a friendly error and never change the live save.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { loadRift, GAME_DIR } from './harness.mjs';

const FILES = ['js/core/rift.js', 'js/core/state.js', 'data/map.js', 'data/creatures.js', 'data/tactics.js', 'data/items.js'];
const J = x => JSON.parse(JSON.stringify(x));
const FIXTURES = path.join(GAME_DIR, 'tools', 'test', 'fixtures');

function memoryStorage() {
    const m = new Map();
    return {
        map: m,
        getItem: k => (m.has(k) ? m.get(k) : null),
        setItem: (k, v) => { m.set(k, String(v)); },
        removeItem: k => { m.delete(k); },
    };
}

function setup(opts) {
    const R = loadRift(FILES, opts);
    const store = memoryStorage();
    R.storage = () => store;
    return { R, store, S: R.State };
}

function startAdventure(S, nickname) {
    S.newGame();
    S.update(s => { s.avatar = { type: 'owlet', variant: 'girl', nickname: nickname || 'Ærø 🦉' }; });
    S.saveNow();
    return S.get();
}

// A value of the same shape as the default but different from it, for every field and sub-field.
function distinctLike(def, label, S) {
    if (Array.isArray(def)) return ['probe:' + label, 'probe2:' + label];
    if (def === null) return { probe: label };
    if (typeof def === 'object') {
        const out = {};
        Object.keys(def).forEach(k => { out[k] = distinctLike(def[k], label + '.' + k, S); });
        out['probe-extra'] = label; // fields a newer game adds inside an object must survive too
        return out;
    }
    if (typeof def === 'number') return def + 7.25;
    if (typeof def === 'boolean') return !def;
    if (typeof def === 'string') return def + '-probe';
    return label;
}

test('every save field (and a future one) survives export → wipe → import exactly', async () => {
    const { S } = setup();
    const fresh = S.freshState();
    const save = {};
    for (const key of Object.keys(fresh)) save[key] = key === 'version' ? fresh.version : distinctLike(J(fresh[key]), key, S);
    // Lists the game reads as objects need real-looking entries.
    save.creatures = [S.makeCreature('lobstorian', { uid: 'c-1', taught: 'guard', powerDelta: 1 }), S.makeCreature('astrophysicat', { uid: 'c-2', trophyOf: 'Ida', warped: { ability: 'grook', from: 'x' } })];
    save.trophies = [S.makeCreature('zuckerborg', { uid: 't-1', trophyOf: 'Bo' })];
    save.team = ['c-2', 'c-1'];
    save.chapter = 'ch2';
    save.avatar = { type: 'fox', variant: 'boy', nickname: 'Zoë "Z" O\'Neil' };
    save.map.completed = ['stall-gallery', 'gate'];
    // Fields from the coming expansion and anything newer: kept even though this game ignores them.
    save.glimmers = 42;
    save.cardBacks = { owned: ['plain', 'nebula'], chosen: 'nebula' };
    save.quests = { 'one-colour': { progress: 2, done: false } };
    save.riftRun = { board: 'l1', floor: 3, deck: ['eureka'], keepsakes: ['spark'], seed: 'abc' };
    save.zzFuture = { nested: { deep: [1, 'two', null, { three: 3 }] } };

    startAdventure(S);
    S.replace(save);
    const before = J(S.get());
    for (const key of Object.keys(save)) assert.ok(key in before, 'replace dropped ' + key);

    const code = await S.exportCode();
    const exported = J(S.get());
    assert.match(code, /^ROR2\.save\./);
    S.wipe();
    assert.equal(S.get(), null);
    await S.importCode(code);
    const after = J(S.get());
    assert.deepEqual(after, exported);
    for (const key of Object.keys(fresh)) assert.deepEqual(after[key], exported[key], 'field lost: ' + key);
    for (const key of ['glimmers', 'cardBacks', 'quests', 'riftRun', 'zzFuture']) assert.deepEqual(after[key], save[key], 'future field lost: ' + key);
});

test('a new top-level field in freshState is carried by the code without any other change', async () => {
    const { S } = setup();
    const fresh = Object.keys(S.freshState());
    // If this list changes, the round-trip test above already covers the new field; update the list.
    assert.deepEqual(fresh, ['version', 'createdAt', 'seed', 'visits', 'avatar', 'chapter', 'map', 'flags', 'health', 'maxHealth',
        'scars', 'xp', 'accolades', 'items', 'creatures', 'team', 'trophies', 'seen', 'axioms', 'axiomLoadout', 'tactics',
        'deckTactics', 'rumours', 'lures', 'perksUsed', 'tutorialsSeen', 'stats', 'settings', 'backup']);
});

test('a code made by the game before the Card Arena (ROR1, save version 1) still loads', async () => {
    const { S } = setup();
    const code = fs.readFileSync(path.join(FIXTURES, 'code-v1-old.txt'), 'utf8');
    const old = JSON.parse(fs.readFileSync(path.join(FIXTURES, 'save-v1.json'), 'utf8'));
    assert.match(code, /^ROR1\.save\./);
    const s = J(await S.importCode(code));
    assert.equal(s.version, S.VERSION);
    assert.equal(s.avatar.nickname, 'Old Save');
    assert.equal(s.chapter, old.chapter);
    assert.deepEqual(s.map, old.map);
    assert.deepEqual(s.flags, old.flags);
    assert.deepEqual(s.items, old.items);
    assert.deepEqual(s.stats, Object.assign(J(S.freshState().stats), old.stats)); // newer stats (powerUses) get defaults
    assert.deepEqual(s.accolades, old.accolades);
    assert.equal(s.creatures.length, old.creatures.length);
    s.creatures.forEach((c, i) => {
        assert.equal(c.uid, old.creatures[i].uid);
        assert.ok(S.isVariant(c.variant));
        assert.equal(c.taught, null);
    });
    // Newer fields get their defaults.
    assert.ok(Array.isArray(s.tactics) && Array.isArray(s.deckTactics));
    assert.deepEqual(s.backup, { lastAt: 0, reminded: [] });
    // An untouched Sounds slider (0.8) is lowered once when the Ambience slider arrives (10 Oct).
    assert.deepEqual(s.settings, Object.assign(J(S.freshState().settings), old.settings, old.settings.sfx === 0.8 ? { sfx: 0.45 } : {}));
    // And it goes round again in the new format.
    const again = await S.exportCode();
    const exported = J(S.get());
    S.wipe();
    assert.deepEqual(J(await S.importCode(again)), exported);
});

test('a code from a newer game version loads without crashing and keeps what it does not know', async () => {
    const { S } = setup();
    const future = Object.assign(J(S.freshState()), { version: S.VERSION + 1, avatar: { type: 'owlet', variant: 'boy', nickname: 'Future' }, glimmers: 9 });
    future.settings.hologram = true;
    future.creatures.push(Object.assign(J(S.makeCreature('lobstorian', { uid: 'f-1' })), { shiny: true }));
    const code = await S.encodePacked('save', future);
    const s = J(await S.importCode(code));
    assert.equal(s.version, S.VERSION + 1);
    assert.equal(s.glimmers, 9);
    assert.equal(s.settings.hologram, true);
    assert.equal(s.creatures[0].shiny, true);
    const back = await S.decodeAsync('save', await S.exportCode());
    assert.equal(back.glimmers, 9);
});

test('pasted codes load despite spaces, line breaks, quotes, text around them and missing =', async () => {
    const { S } = setup();
    startAdventure(S, 'Paste Test');
    const packed = await S.exportCode();
    const plain = S.encode('save', J(S.get()));
    const want = J(S.get());
    for (const code of [packed, plain]) {
        const body = code.split('.')[2];
        const variants = [
            '  ' + code + '\n\n',
            code.replace(/(.{50})/g, '$1\n'),
            code.replace(/(.{64})/g, '$1\r\n'),
            code.replace(/(.{10})/g, '$1 '),
            code.replace(/(.{7})/g, '$1​'),
            code.replace(/(.{30})/g, '$1 \t'),
            '“' + code + '”',
            '"' + code + '"',
            '`' + code + '`',
            'Here is my backup code: ' + code + ' — thanks!',
            'Rift of Reason backup for Paste Test.\nLoad it from the title screen.\n\n' + code + '\n',
            code.replace(/^ROR/, 'ror').replace('.save.', '.Save.'),
            code.replace(body, body + '=='),
            code + '\n' + code,
        ];
        for (const v of variants) {
            assert.deepEqual(J(await S.readCode(v)), want, JSON.stringify(v.slice(0, 40)));
        }
    }
});

test('damaged codes give clear, friendly errors', async () => {
    const { S } = setup();
    startAdventure(S);
    const code = await S.exportCode();
    const parts = code.split('.');
    const cases = [
        ['', /Paste your code/],
        ['   \n ', /Paste your code/],
        ['hello there', /doesn't look like/],
        [code.slice(0, code.length - 30), /cut off/],
        [code.slice(0, 40), /cut off/],
        ['ROR2.sa', /cut off/],
        [code.slice(0, -1), /cut off/],
        [[parts[0], parts[1], parts[2].slice(0, 20) + 'Q' + parts[2].slice(21), parts[3]].join('.'), /typo|changed/],
        [[parts[0], parts[1], parts[2], 'zzzzzzz'].join('.'), /typo|changed/],
        [[parts[0], parts[1], parts[2].slice(5), parts[3]].join('.'), /typo|changed/],
        [code.replace(/^ROR2/, 'ROR1'), /typo|changed/],
        [code.replace(/^ROR2/, 'ROR3'), /newer version/],
        ['ROR9.save.abc', /newer version/],
        [code.replace('.save.', '.team.'), /something else/],
    ];
    for (const [text, re] of cases) {
        await assert.rejects(S.readCode(text), re, JSON.stringify(text.slice(0, 40)));
    }
    // The sync reader (team codes) gives the same messages.
    assert.throws(() => S.decode('save', 'hello'), /doesn't look like/);
    assert.throws(() => S.decode('team', S.encode('save', { version: 1 })), /something else/);
});

test('a checked code with a damaged save inside is refused', async () => {
    const { S } = setup();
    for (const payload of [null, 7, 'text', [], {}, { version: 'two' }, { version: 0 }, { version: 2, creatures: 'lots' },
        { version: 2, creatures: [null] }, { version: 2, creatures: [{ uid: 5, species: 'lobstorian' }] }, { version: 2, trophies: [{}] }]) {
        await assert.rejects(S.readCode(S.encode('save', payload)), /damaged/, JSON.stringify(payload));
        await assert.rejects(S.readCode(await S.encodePacked('save', payload)), /damaged/, JSON.stringify(payload));
        assert.throws(() => S.replace(payload), /damaged/);
    }
});

test('a failed load never changes the live save or the previous-save slot', async () => {
    const { S, store } = setup();
    startAdventure(S, 'Keep Me');
    const good = await S.exportCode();
    const before = new Map(store.map);
    const live = J(S.get());
    for (const bad of ['nonsense', good.slice(0, -3), good.replace(/A/, 'B'), S.encode('save', { version: 'x' })]) {
        await assert.rejects(S.importCode(bad));
        assert.deepEqual(J(S.get()), live);
        assert.deepEqual(new Map(store.map), before);
    }
});

test('loading a code keeps the old adventure as the previous save; restoring swaps them back', async () => {
    const { S, store } = setup();
    startAdventure(S, 'Mine');
    S.update(s => { s.xp = 99; });
    const mine = J(S.get());
    startAdventure(S, 'Friend'); // a new game keeps "Mine" as the previous save
    assert.equal(S.previous().save.avatar.nickname, 'Mine');
    assert.equal(S.previous().reason, 'new');
    const friendCode = await S.exportCode();
    const friend = J(S.get());

    S.restorePrevious();
    assert.deepEqual(J(S.get()), mine);
    assert.equal(S.previous().save.avatar.nickname, 'Friend');

    await S.importCode(friendCode);
    assert.deepEqual(J(S.get()), friend);
    assert.deepEqual(J(S.previous().save), mine);
    assert.equal(S.previous().reason, 'load');
    assert.deepEqual(JSON.parse(store.getItem('rift-of-reason:save')), friend);

    // Erasing keeps it too, and an empty game never pushes a real adventure out of the slot.
    S.wipe();
    assert.equal(S.previous().save.avatar.nickname, 'Friend');
    S.newGame();
    assert.equal(S.previous().save.avatar.nickname, 'Friend');
    S.restorePrevious();
    assert.deepEqual(J(S.get()), friend);
    assert.equal(S.previous(), null, 'an empty new game is not kept');
});

test('an unreadable stored save is kept aside instead of being overwritten', () => {
    const { S, store } = setup();
    store.setItem('rift-of-reason:save', '{"version":2,"creatures":[{"uid":');
    assert.equal(S.load(), null);
    assert.equal(store.getItem('rift-of-reason:save:unreadable'), '{"version":2,"creatures":[{"uid":');
    startAdventure(S);
    assert.equal(store.getItem('rift-of-reason:save:unreadable'), '{"version":2,"creatures":[{"uid":');
});

test('copying a code is remembered as the last backup', () => {
    const { S } = setup();
    startAdventure(S);
    assert.equal(S.get().backup.lastAt, 0);
    S.noteBackup();
    assert.ok(S.get().backup.lastAt > 0);
});

test('a pending autosave can be flushed at once (the page does this when the tab is hidden)', () => {
    const { S, store } = setup();
    startAdventure(S);
    S.update(s => { s.xp = 31; });
    assert.notEqual(JSON.parse(store.getItem('rift-of-reason:save')).xp, 31);
    S.flush();
    assert.equal(JSON.parse(store.getItem('rift-of-reason:save')).xp, 31);
});

test('packed codes are much shorter; browsers without compression make plain codes, and say so for packed ones', async () => {
    const { R, S } = setup();
    startAdventure(S);
    const species = Object.keys(R.data.creatures);
    S.update(s => { for (let i = 0; i < 120; i++) s.creatures.push(S.makeCreature(species[i % species.length])); });
    const packed = await S.exportCode();
    const plain = S.encode('save', J(S.get()));
    assert.ok(packed.length * 4 < plain.length, packed.length + ' vs ' + plain.length);

    const old = setup({ noCompression: true });
    startAdventure(old.S, 'Old Browser');
    const code = await old.S.exportCode();
    assert.match(code, /^ROR1\.save\./);
    const want = J(old.S.get());
    old.S.wipe();
    assert.deepEqual(J(await old.S.importCode(code)), want);
    await assert.rejects(old.S.readCode(packed), /too old/);
});

test('the teacher overview reads packed codes through plainCode', async () => {
    const R = loadRift(['js/core/rift.js', 'js/core/state.js', 'data/map.js', 'data/creatures.js', 'data/axioms.js', 'data/items.js',
        'js/battle/abilities.js', 'js/battle/team-codes.js', 'js/teacher/overview.js']);
    const s = R.State.freshState();
    s.avatar = { type: 'owlet', variant: 'boy', nickname: 'Group' };
    s.map.completed = ['stall-gallery', 'bonus-mines'];
    const packed = await R.State.encodePacked('save', s);
    assert.match(packed, /^ROR2/);
    const report = R.TeacherOverview.read(await R.State.plainCode('Code: ' + packed + '\n'));
    assert.equal(report.kind, 'save');
    assert.equal(report.checked, 1);
    const team = R.Battle.TeamCodes.exportTeam({ creatures: [R.State.makeCreature('lobstorian')] });
    assert.equal(R.TeacherOverview.read(await R.State.plainCode(' ' + team + ' ')).kind, 'team');
});

test('a backup reminder is due once per chapter boss beaten', () => {
    const { R, S } = setup();
    const bosses = Object.entries(R.data.map.nodes).filter(([, n]) => n.type === 'boss').map(([id]) => id);
    assert.ok(bosses.length >= 4);
    startAdventure(S);
    assert.equal(S.backupMilestone(), null);
    S.update(s => { s.map.completed.push('stall-gallery', bosses[0]); });
    const due = S.backupMilestone();
    assert.deepEqual(J(due.ids), ['boss:' + bosses[0]]);
    assert.equal(due.name, R.data.map.nodes[bosses[0]].name);
    S.markReminded(due.ids);
    assert.equal(S.backupMilestone(), null);
    S.update(s => { s.map.completed.push(bosses[1], bosses[2]); });
    assert.deepEqual(J(S.backupMilestone().ids), ['boss:' + bosses[1], 'boss:' + bosses[2]]);
    S.markReminded(S.backupMilestone().ids);
    assert.equal(S.backupMilestone(), null);
});

// ---- fuzz ---------------------------------------------------------------------

function randomSave(R, rng) {
    const S = R.State;
    const species = Object.keys(R.data.creatures);
    const nodes = Object.keys(R.data.map.nodes);
    const items = Object.keys(R.data.items);
    const tactics = Object.keys(R.data.tactics);
    const word = () => {
        const bits = ['a', 'Ø', 'é', '🦉', '"', '\\', ' ', '\n', '.', '=', '<b>', 'ROR1', 'ß', '中', '​', '{', '}'];
        let out = '';
        for (let i = rng.int(0, 12); i > 0; i--) out += rng.pick(bits);
        return out;
    };
    const some = (list, max) => rng.shuffle(list.slice()).slice(0, rng.int(0, Math.min(max, list.length)));
    const s = J(S.freshState());
    s.seed = rng.int(0, 2 ** 31 - 1);
    s.createdAt = 1790000000000 + rng.int(0, 1e9);
    s.avatar = { type: rng.pick(['owlet', 'fox']), variant: rng.pick(['boy', 'girl']), nickname: word().slice(0, 16) };
    s.chapter = rng.pick(Object.keys(R.data.chapters));
    s.map = { at: rng.pick(nodes), revealed: some(nodes, 80), completed: some(nodes, 60), visitCount: {}, rifts: some(Object.keys(R.data.chapters), 3) };
    some(nodes, 20).forEach(id => { s.map.visitCount[id] = rng.int(1, 50); });
    for (let i = rng.int(0, 30); i > 0; i--) s.flags[rng.pick(['rumour:', 'clue:', 'strategy:', 'trainer-reward:', '']) + word()] = rng.pick([true, false, 1, 2, 'x', word()]);
    s.health = rng.int(0, 7);
    s.xp = rng.int(0, 5000);
    s.accolades = some(['clear-thinker', 'rift-walker', 'brave', word()], 4);
    s.items = {};
    some(items, items.length).forEach(id => { s.items[id] = rng.int(0, 99); });
    const big = rng.chance(0.3);
    for (let i = rng.int(0, big ? 400 : 30); i > 0; i--) {
        const c = J(S.makeCreature(rng.pick(species), { caughtAt: rng.int(0, 2e12) }));
        if (rng.chance(0.2)) c.taught = rng.pick(S.TRICKS);
        if (rng.chance(0.1)) { c.injuries = ['no-ability']; }
        if (rng.chance(0.1)) c.trophyOf = word();
        if (rng.chance(0.05)) c.warped = { ability: 'grook', from: 'x' };
        if (rng.chance(0.05)) c.futureTag = word();
        s.creatures.push(c);
    }
    s.team = some(s.creatures.map(c => c.uid), 14);
    s.seen = some(species, species.length);
    s.tactics = some(tactics, 20);
    s.deckTactics = some(tactics, 14);
    s.rumours = some(['a', 'b', word()], 3);
    s.lures = { [rng.pick(nodes)]: rng.int(0, 3) };
    s.tutorialsSeen = { venn: rng.chance(0.5) };
    Object.keys(s.stats).forEach(k => { s.stats[k] = rng.int(0, 500); });
    s.settings = { music: rng.next(), sfx: rng.next(), voice: rng.next(), textSpeed: rng.pick([0.5, 1, 2]), calm: rng.chance(0.5) };
    if (rng.chance(0.5)) s.glimmers = rng.int(0, 999);
    if (rng.chance(0.5)) s.cardBacks = { owned: ['plain', word()], chosen: 'plain' };
    return S.migrate(s); // what the game itself would hold
}

test('fuzz: random saves, small and very large, round-trip exactly in both formats', async () => {
    const { R, S } = setup();
    const rng = R.makeRng('save-fuzz');
    for (let round = 0; round < 60; round++) {
        S.replace(randomSave(R, rng));
        const code = await S.exportCode();
        const want = J(S.get());
        S.wipe();
        assert.deepEqual(J(await S.importCode(code)), want, 'packed round ' + round);
        const plain = S.encode('save', J(S.get()));
        S.wipe();
        assert.deepEqual(J(await S.importCode(plain)), want, 'plain round ' + round);
    }
});

test('fuzz: corrupted codes always give a friendly error (or, if harmless, the exact save), never a broken save', async () => {
    const { R, S, store } = setup();
    const rng = R.makeRng('corrupt-fuzz');
    const FRIENDLY = /Paste your code|doesn't look like|cut off|typo or has been changed|newer version|something else|damaged/;
    const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/.=';
    const mutations = [
        c => { const i = rng.int(0, c.length - 1); let ch; do ch = rng.pick(B64.split('')); while (ch === c[i]); return c.slice(0, i) + ch + c.slice(i + 1); },
        c => { const i = rng.int(0, c.length - 1); return c.slice(0, i) + c.slice(i + 1); },
        c => { const i = rng.int(0, c.length); return c.slice(0, i) + rng.pick(B64.split('')) + c.slice(i); },
        c => c.slice(0, rng.int(0, c.length - 1)),
        c => { const i = rng.int(0, c.length - 2); return c.slice(0, i) + c[i + 1] + c[i] + c.slice(i + 2); },
        c => { const i = rng.int(0, c.length - 10), j = rng.int(i, c.length - 1); return c.slice(0, i) + c.slice(j); },
        c => { const i = rng.int(0, c.length - 10); return c.slice(0, i) + c.slice(i, i + 8) + c.slice(i); },
    ];
    let errors = 0, harmless = 0;
    for (let round = 0; round < 12; round++) {
        S.replace(randomSave(R, rng));
        const codes = [await S.exportCode()];
        codes.push(S.encode('save', J(S.get())));
        const original = J(S.get());
        for (const code of codes) {
            for (let k = 0; k < 40; k++) {
                const bad = rng.pick(mutations)(code);
                const storeBefore = new Map(store.map);
                try {
                    await S.importCode(bad);
                    harmless++;
                    assert.deepEqual(J(S.get()), original, 'a changed code loaded a different save: ' + bad.slice(0, 60));
                    S.replace(original);
                } catch (e) {
                    errors++;
                    assert.match(e.message, FRIENDLY, 'unfriendly error: ' + e.message);
                    assert.deepEqual(J(S.get()), original);
                    assert.deepEqual(new Map(store.map), storeBefore);
                }
            }
        }
    }
    assert.ok(errors > 800, 'errors ' + errors + ', harmless ' + harmless);
});
