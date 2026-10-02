// Content integrity: the map, script, spawns and puzzles all point at things that exist.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { loadRift, GAME_DIR } from './harness.mjs';

const puzzleFiles = ['liars-gate', 'rule-hunter', 'venn', 'line-drawer', 'witness']
    .map(id => 'js/puzzles/' + id + '.js')
    .filter(f => fs.existsSync(path.join(GAME_DIR, f)));

const Rift = loadRift([
    'js/core/rift.js', 'js/core/state.js', 'js/core/world.js',
    'data/avatars.js', 'data/items.js', 'data/creatures.js', 'data/map.js', 'data/script/lesson1.js',
    'js/puzzles/registry.js', ...puzzleFiles,
]);
const { nodes } = Rift.data.map;

test('map links are two-way and point at real nodes', () => {
    for (const [id, n] of Object.entries(nodes)) {
        for (const m of n.links) {
            assert.ok(nodes[m], id + ' links to missing ' + m);
            assert.ok(nodes[m].links.includes(id), id + ' → ' + m + ' is one-way');
        }
    }
});

test('every node is reachable from the start', () => {
    const seen = new Set(['burrow']);
    const queue = ['burrow'];
    while (queue.length) nodes[queue.shift()].links.forEach(m => { if (!seen.has(m)) { seen.add(m); queue.push(m); } });
    assert.deepEqual(Object.keys(nodes).filter(id => !seen.has(id)), []);
});

test('scripts, spawns, trainers and chapter starts exist', () => {
    for (const [id, n] of Object.entries(nodes)) {
        if (n.script) assert.ok(Rift.data.script[n.script], id + ': missing script ' + n.script);
        (n.spawns || []).forEach(sp => assert.ok(Rift.data.creatures[sp], id + ': unknown spawn ' + sp));
        if (n.trainer) {
            const t = Rift.data.trainers[n.trainer];
            assert.ok(t, id + ': unknown trainer');
            t.team.forEach(sp => assert.ok(Rift.data.creatures[sp], 'trainer team: ' + sp));
        }
        if (['puzzle', 'miniboss', 'boss'].includes(n.type)) assert.ok(n.puzzles && n.puzzles.length, id + ' has no puzzles');
    }
    Object.values(Rift.data.chapters).forEach(ch => { if (ch.start) assert.ok(nodes[ch.start], 'chapter start ' + ch.start); });
});

test('every puzzle a node uses is registered (once all generators exist)', () => {
    const used = new Set(Object.values(nodes).flatMap(n => (n.puzzles || []).map(p => p.id)));
    const missing = [...used].filter(id => !Rift.Puzzles.get(id));
    if (puzzleFiles.length === 5) assert.deepEqual(missing, []);
});

test('script speakers are known and lines are short enough to read', () => {
    const known = new Set([...Object.keys(Rift.data.speakers), ...Object.keys(Rift.data.creatures), 'avatar']);
    const walk = steps => steps.forEach(s => {
        if (s.t) {
            assert.ok(known.has(s.s), 'unknown speaker ' + s.s);
            assert.ok(s.t.length <= 160, 'line too long: ' + s.t);
        }
        if (s.when) { walk(s.when.then || []); walk(s.then || []); walk(s.else || []); }
    });
    Object.values(Rift.data.script).forEach(walk);
});

test('catch odds stay between 5% and 95% and favour better charms', () => {
    const s = Rift.State.freshState();
    s.avatar = { type: 'fox', variant: 'girl' };
    for (const sp of Object.keys(Rift.data.creatures)) {
        const a = Rift.World.catchOdds(s, sp, 'charm');
        const b = Rift.World.catchOdds(s, sp, 'greatcharm');
        assert.ok(a >= 0.05 && a <= 0.95 && b >= a, sp);
    }
});

test('fog: completing a node reveals its neighbours; jumping gives the starter kit once', () => {
    const s = Rift.State.freshState();
    Rift.World.start(s);
    assert.deepEqual([...s.map.revealed], ['burrow']);
    Rift.World.complete(s, 'burrow');
    assert.ok(s.map.revealed.includes('fair-gate'));
    const before = s.items.charm;
    assert.equal(Rift.World.jumpToChapter(s, 'ch1'), true);
    assert.equal(s.items.charm, before + 3);
    assert.equal(Rift.World.jumpToChapter(s, 'ch1'), false);
    assert.equal(s.items.charm, before + 3);
    assert.equal(s.map.at, 'road-start');
});

test('legendaries only spawn after their rumour', () => {
    const s = Rift.State.freshState();
    const n = Object.assign({ id: 'standing-stone' }, nodes['standing-stone']);
    assert.ok(!('godelix' in Rift.World.spawnWeights(s, n)));
    s.flags['rumour:godelix'] = true;
    assert.ok('godelix' in Rift.World.spawnWeights(s, n));
});
