// Content integrity: the map, script, spawns and puzzles all point at things that exist.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { loadRift, GAME_DIR } from './harness.mjs';

const puzzleFiles = fs.readdirSync(path.join(GAME_DIR, 'js/puzzles'))
    .filter(f => f.endsWith('.js') && f !== 'registry.js')
    .map(f => 'js/puzzles/' + f);

const Rift = loadRift([
    'js/core/rift.js', 'js/core/state.js', 'js/core/world.js',
    'data/avatars.js', 'data/items.js', 'data/creatures.js', 'data/map.js', 'data/script/lesson1.js', 'data/script/lesson2.js', 'data/script/lesson3.js', 'data/script/lesson4.js', 'data/cases.js',
    'js/puzzles/registry.js', ...puzzleFiles,
]);
const { nodes } = Rift.data.map;

test('every puzzle station has a known host, goal and first/repeat lead-in', () => {
    for (const [id, n] of Object.entries(nodes)) {
        if (!n.puzzles) continue;
        assert.ok(Rift.data.speakers[n.host], id + ': unknown host');
        assert.ok(n.goal && n.goal.length <= 160, id + ': missing or long goal');
        for (const key of [n.intro, n.reminder]) {
            assert.ok(key && Rift.data.script[key]?.length, id + ': missing lead-in');
            assert.ok(Rift.data.script[key].some(step => step.s === n.host && step.t), id + ': host never speaks');
        }
        // One spoken line per host the station can have (`hosts`); an understudy's arrival branch may sit in front.
        const spoken = Rift.data.script[n.reminder].filter(step => step.t);
        assert.equal(new Set(spoken.map(step => step.s)).size, spoken.length, id + ': repeat lead-in should be short');
    }
});

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

test('every puzzle a node uses is registered (chapters that are open)', () => {
    const open = Object.values(nodes).filter(n => !(Rift.data.chapters[n.chapter] || {}).comingSoon);
    const used = new Set(open.flatMap(n => (n.puzzles || []).map(p => p.id)));
    assert.deepEqual([...used].filter(id => !Rift.Puzzles.get(id)), []);
});

test('all fourteen puzzle types have short plain-text rules and worked tutorial steps', () => {
    assert.equal(Rift.Puzzles.all().length, 15);
    for (const p of Rift.Puzzles.all()) {
        assert.ok(p.rules?.length > 0 && p.rules.length <= 5, p.id + ': rules card');
        assert.ok(p.tutorial?.length >= 3 && p.tutorial.length <= 6, p.id + ': tutorial length');
        for (const text of p.rules) assert.ok(typeof text === 'string' && !/<[^>]+>/.test(text), p.id + ': plain rules');
        assert.ok(p.tutorial.some(step => /example/i.test(step.text)), p.id + ': worked example');
        assert.ok(p.tutorial.some(step => /heart cost/i.test(step.text)), p.id + ': hint cost');
        assert.ok(p.tutorial.every(step => step.text && step.highlight), p.id + ': highlight real controls');
    }
});

test('every node is on a known painted map', () => {
    for (const [id, n] of Object.entries(nodes)) assert.ok(Rift.data.maps[n.map || 'main'], id);
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

test('Ch3: the Café and the Library are on every route to the Plaza (no Newsstand–Plaza link)', () => {
    assert.ok(!nodes['t-newsstand'].links.includes('t-plaza'));
    assert.ok(!nodes['t-plaza'].links.includes('t-newsstand'));
    // Walk Ch3 from the Rift Landing with one node blocked: the Plaza must be out of reach.
    const reaches = blocked => {
        const seen = new Set(['t-arrival']), queue = ['t-arrival'];
        while (queue.length) {
            for (const m of nodes[queue.shift()].links || []) {
                if (m === blocked || seen.has(m) || !nodes[m] || nodes[m].chapter !== 'ch3') continue;
                seen.add(m);
                queue.push(m);
            }
        }
        return seen.has('t-plaza');
    };
    assert.ok(reaches(null), 'the Plaza is reachable');
    assert.ok(!reaches('t-cafe'), 'a route skips the Café');
    assert.ok(!reaches('t-library'), 'a route skips the Library');
});
