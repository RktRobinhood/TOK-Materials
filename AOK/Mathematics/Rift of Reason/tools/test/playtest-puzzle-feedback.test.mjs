import test from 'node:test';
import assert from 'node:assert/strict';
import { loadWithDom } from './fake-dom.mjs';

function mounted(id, build, difficulty = 1) {
    const g = loadWithDom(['js/core/rift.js', 'js/puzzles/registry.js', 'js/puzzles/' + id + '.js']);
    g.ctx.addEventListener = () => {};
    g.ctx.removeEventListener = () => {};
    const def = g.Rift.Puzzles.get(id);
    const data = build(def, g.Rift);
    const box = g.document.createElement('div');
    g.document.body.appendChild(box);
    const sent = [];
    const handle = def.mount(box, data, { el: g.Rift.el, difficulty, rng: g.Rift.makeRng('feedback-ui'), sfx() {}, say() {}, submit(answer) {
        sent.push(answer);
        return def.check(data, answer);
    } });
    return { g, def, data, box, sent, handle };
}

function sceneData(def, Rift, scene, difficulty = 3) {
    for (let seed = 0; seed < 500; seed++) {
        const data = def.generate(Rift.makeRng('scene-' + seed), difficulty);
        if (data.scene === scene) return data;
    }
    throw new Error('Scene not found: ' + scene);
}

test('Witness explains the fair timing gap on the first check and welcomes a checked revision', () => {
    const t = mounted('witness', (def, R) => sceneData(def, R, 'fair'));
    const claim = t.data.claims.find(c => c.t.includes('carousel ten minutes'));
    const rows = t.box.querySelectorAll('.wit-claim');
    const row = rows[t.data.claims.indexOf(claim)];
    t.data.claims.forEach((c, i) => rows[i].querySelectorAll('button').find(b => b.dataset.k === (c === claim ? 'F' : c.a)).click());
    t.box.querySelector('.primary').click();
    assert.equal(t.sent.length, 1);
    assert.match(row.querySelector('.wit-reason').textContent, /Missing evidence:.*nut-stall sentence has no time attached.*ten minutes later/i);
    row.querySelectorAll('button').find(b => b.dataset.k === 'U').click();
    t.box.querySelector('.primary').click();
    assert.equal(t.sent.length, 2);
    assert.match(row.querySelector('.wit-reason').textContent, /Revision supported:.*no time attached/i);
    assert.equal(row.classList.contains('wit-wrong'), false);
});

for (const difficulty of [1, 2, 3]) for (const scene of ['bakery', 'library', 'match', 'lab', 'fair', 'graph']) {
    test('Witness ' + scene + ' level ' + difficulty + ' gives every checked claim its evidence explanation', () => {
        const t = mounted('witness', (def, R) => sceneData(def, R, scene, difficulty), difficulty);
        const rows = t.box.querySelectorAll('.wit-claim');
        t.data.claims.forEach((c, i) => rows[i].querySelectorAll('button').find(b => b.dataset.k === (c.a === 'T' ? 'F' : 'T')).click());
        t.box.querySelector('.primary').click();
        t.data.claims.forEach((c, i) => {
            const expected = c.a === 'T' ? 'Supporting evidence:' : c.a === 'F' ? 'Contradicting evidence:' : 'Missing evidence:';
            assert.equal(rows[i].querySelector('.wit-reason').textContent, expected + ' ' + c.why);
        });
    });
}

test('Witness does not infer adulthood from his knees', () => {
    const t = mounted('witness', (def, R) => sceneData(def, R, 'match'));
    const claim = t.data.claims.find(c => c.t.includes('was a man'));
    assert.equal(claim.a, 'U');
    assert.match(claim.why, /boy|adult/i);
});

for (const difficulty of [1, 2, 3]) test('River level ' + difficulty + ' preserves the previous plan and explains the rejected unsafe crossing', () => {
    const t = mounted('river-crossing', (def, R) => def.generate(R.makeRng('recover-' + difficulty), difficulty), difficulty);
    const take = id => t.box.querySelectorAll('.rc-token').find(n => n.title === t.data.cast.find(c => c.id === id).name).click();
    t.data.plan[0].forEach(take);
    t.box.querySelector('.rc-row').click();
    const next = t.data.plan[1];
    const state = t.def._play(t.data, t.data.plan.slice(0, 1));
    let wrong;
    for (const trip of [[], ...t.data.cast.map(c => [c.id])]) {
        const result = t.def._play(t.data, [t.data.plan[0], trip]);
        if (result.problem === 'clash') { wrong = trip; break; }
    }
    // Some layouts have no unsafe return trip. Test the initial unsafe empty trip instead.
    if (!wrong) {
        t.box.querySelectorAll('.rc-tools button').find(n => n.textContent === 'Reset').click();
        t.box.querySelector('.rc-row').click();
        assert.match(t.box.querySelector('.rc-info').textContent, /Crossings: 0/);
    } else {
        wrong.forEach(take);
        t.box.querySelector('.rc-row').click();
        assert.match(t.box.querySelector('.rc-info').textContent, /Crossings: 1/);
        assert.equal(t.box.querySelector('.rc-banks').classList.contains('rc-at-far'), !!state.boat);
    }
    assert.equal(t.sent.length, 1, 'one wrong check for the rejected crossing');
    assert.match(t.box.querySelector('.rc-recovery').textContent, /Only that crossing was undone.*earlier crossings are kept/i);
    assert.match(t.box.querySelector('.rc-recovery').textContent, /bank without you/i);
    // Reset offers an explicit new start and the stored plan still completes.
    t.box.querySelectorAll('.rc-tools button').find(n => n.textContent === 'Reset').click();
    for (const trip of t.data.plan) { trip.forEach(take); t.box.querySelector('.rc-row').click(); }
    assert.equal(t.def.check(t.data, t.sent.at(-1)).solved, true);
    assert.equal(t.box.querySelector('.rc-recovery').textContent, '');
});

test('River ticket exhaustion visibly resets the entire plan and all creatures', () => {
    const t = mounted('river-crossing', (def, R) => def.generate(R.makeRng('ticket-recovery'), 3), 3);
    const first = t.data.plan[0];
    const take = id => t.box.querySelectorAll('.rc-token').find(n => n.title === t.data.cast.find(c => c.id === id).name).click();
    for (let crossing = 0; crossing <= t.data.toll; crossing++) {
        first.forEach(take);
        t.box.querySelector('.rc-row').click();
    }
    assert.equal(t.sent.length, 1);
    assert.match(t.box.querySelector('.rc-recovery').textContent, /Out of tickets.*whole plan was reset.*near bank/i);
    assert.match(t.box.querySelector('.rc-info').textContent, /Crossings: 0/);
    assert.equal(t.box.querySelectorAll('.rc-near .rc-token').length, t.data.cast.length);
    assert.equal(t.box.querySelectorAll('.rc-far .rc-token').length, 0);
    assert.match(t.box.querySelector('.rc-info').textContent, new RegExp('Tickets left: ' + t.data.toll));
    for (const trip of t.data.plan) { trip.forEach(take); t.box.querySelector('.rc-row').click(); }
    assert.equal(t.sent.length, 2);
    assert.equal(t.def.check(t.data, t.sent[1]).solved, true);
    assert.equal(t.box.querySelector('.rc-recovery').textContent, '');
});

test('Moser names the maximum and intersection assumption before asking, then explains the equally spaced exception', () => {
    const t = mounted('rule-hunter', (def, R) => def.generate(R.makeRng('moser-assumptions'), 3, { sequence: 'moser' }), 3);
    assert.match(t.box.querySelector('.rh-intro').textContent, /greatest possible|maximum/i);
    assert.match(t.box.querySelector('.rh-intro').textContent, /no three.*inside/i);
    assert.match(t.box.querySelector('.rh-q').textContent, /greatest possible|maximum/i);
    t.box.querySelectorAll('.rh-step .rh-plank')[t.data.naive].click();
    assert.equal(t.box.querySelector('.rh-mystery .rh-tile').textContent, '31');
    assert.match(t.box.querySelector('.rh-explain').textContent, /equally spaced.*three.*centre.*fewer/i);
    assert.match(t.box.querySelector('.rh-explain').textContent, /31/);
});

function pointer(board, point) {
    board.dispatchEvent({ type: 'pointerdown', button: 0, pointerId: 1, clientX: point[0], clientY: point[1], preventDefault() {} });
    board.dispatchEvent({ type: 'pointerup' });
}

function draw(t, answer = t.def.solve(t.data)) {
    const svg = t.box.querySelector('.ld-svg');
    svg.getScreenCTM = () => ({ a: 50, inverse() { return {}; } });
    svg.createSVGPoint = () => ({ x: 0, y: 0, matrixTransform() { return { x: this.x, y: this.y }; } });
    if (answer.type === 'impossible') {
        t.box.querySelector('.ld-imp').click();
        answer.odd.forEach(i => pointer(svg, t.data.vertices[i]));
        t.box.querySelector('.ld-proofbtn').click();
    } else (answer.points || answer.vertices.map(i => t.data.vertices[i])).forEach(p => pointer(svg, p));
    assert.equal(t.sent.length, 1);
    assert.equal(t.def.check(t.data, t.sent[0]).solved, true);
    return t.def.why(t.data, t.sent[0]);
}

test('every Line Drawer dot layout debrief describes its accepted mounted route', () => {
    const names = ['grid2x4', 'grid2x5', 'tri3', 'hex7', 'tri4', 'grid3x4', 'star13', 'tri5', 'diamond13', 'grid4x4', 'hex19', 'grid4x5'];
    for (const name of names) {
        const t = mounted('line-drawer', (def, R) => def.internals.buildDotPuzzle(def.internals.LAYOUTS.find(l => l.id === name), 0, [0, 0]));
        const reflection = draw(t);
        const xs = t.data.dots.map(p => p[0]), ys = t.data.dots.map(p => p[1]);
        const outside = t.sent[0].points.some(([x, y]) => x < Math.min(...xs) - 0.05 || x > Math.max(...xs) + 0.05 || y < Math.min(...ys) - 0.05 || y > Math.max(...ys) + 0.05);
        const success = t.box.querySelector('.ld-status').textContent;
        assert.doesNotMatch(success, /box was never/i, name);
        if (outside) {
            assert.match(success, /extended beyond/i, name);
            assert.match(reflection.options[reflection.correct], /allowed.*beyond/i, name);
            assert.doesNotMatch(reflection.explain, /had to|required|necessary/i, name);
        } else {
            assert.match(success, /connected.*within the line limit/i, name);
            assert.match(reflection.options[reflection.correct], /connected.*cover.*line limit/i, name);
            assert.doesNotMatch(reflection.explain, /added.*box|outside|beyond/i, name);
        }
        t.handle.destroy();
    }
});

test('Line Drawer reflects the submitted route rather than the stored example', () => {
    const t = mounted('line-drawer', def => def.internals.buildDotPuzzle(def.internals.LAYOUTS.find(l => l.id === 'grid2x4'), 0, [0, 0]));
    const example = t.def.why(t.data);
    assert.match(example.question, /valid answer/);
    const reflection = draw(t, { type: 'polyline', points: [[-1, 0], [3, 0], [0, 1], [3, 1]] });
    assert.match(t.box.querySelector('.ld-status').textContent, /extended beyond/);
    assert.match(reflection.question, /allowed to extend beyond/);
    assert.match(reflection.options[reflection.correct], /allowed.*beyond/);
    t.handle.destroy();
});

test('every Pattern Breaker sequence retains its reveal, successful reflection and local retry', async () => {
    const names = ['moser', 'euler41', 'threes', 'fermat', 'mersenne', 'repunit'];
    for (const name of names) {
        const t = mounted('rule-hunter', (def, R) => def.generate(R.makeRng('sequence-' + name), 3, { sequence: name }), 3);
        t.box.querySelectorAll('.rh-step .rh-plank')[t.data.naive].click();
        assert.equal(t.box.querySelector('.rh-mystery .rh-tile').textContent, t.data.reveal.value);
        t.box.querySelectorAll('.rh-planks.col .rh-plank')[(t.data.lesson.correct + 1) % t.data.lesson.options.length].click();
        for (let i = 0; i < 6; i++) await Promise.resolve();
        assert.ok(t.box.querySelector('.rh-result.lose'), name);
        t.box.querySelectorAll('button').find(b => b.textContent === 'Try again').click();
        assert.equal(t.box.querySelector('.rh-mystery .rh-tile').textContent, t.data.reveal.value);
        t.box.querySelectorAll('.rh-planks.col .rh-plank')[t.data.lesson.correct].click();
        for (let i = 0; i < 6; i++) await Promise.resolve();
        assert.ok(t.box.querySelector('.rh-result.win'), name);
        assert.equal(t.sent.length, 2);
        t.handle.destroy();
    }
});

test('Rule Hunter success copy is grammatical for both gatekeepers', async () => {
    for (const gatekeeper of ['siuuugull', 'beastie']) {
        const t = mounted('rule-hunter', def => ({
            mode: 'rules', difficulty: 1, gatekeeper, max: 30, secret: 'ascending', example: [2, 4, 6], correct: 0,
            candidates: ['ascending', 'plus-two', 'all-even', 'all-different'].map(id => ({ id, text: def.lib.RULE[id].text })),
        }));
        t.box.querySelector('.rh-name-btn').click();
        t.box.querySelectorAll('.rh-cand')[0].click();
        t.box.querySelectorAll('button').find(b => b.textContent === 'This is the rule').click();
        for (let i = 0; i < 6; i++) await Promise.resolve();
        assert.ok(t.box.querySelector('.rh-result.win'));
        const text = t.box.querySelector('.rh-bubble').textContent;
        assert.match(text, /you got it/i);
        assert.doesNotMatch(text, /it you|you got it\./i);
        t.handle.destroy();
    }
});

test('every named Line Drawer graph and generated graph family reflects its actual odd-vertex case', () => {
    const families = [
        (def, R) => Object.keys(def.internals.FIGURES).map(id => def.internals.buildFigure(R.makeRng('figure-' + id), id)),
        (def, R) => Array.from({ length: 80 }, (_, i) => def.generate(R.makeRng('graph-family-' + i), 2)).filter(d => d.mode === 'graph'),
    ];
    const fixture = mounted('line-drawer', (def, R) => def.internals.buildFigure(R.makeRng('fixture'), 'bridges'));
    const graphs = families.flatMap(build => build(fixture.def, fixture.g.Rift));
    fixture.handle.destroy();
    const oddCounts = new Set();
    for (const data of graphs) {
        const t = mounted('line-drawer', () => data);
        const odd = t.def.internals.oddVertices(data).length;
        oddCounts.add(odd);
        const reflection = draw(t);
        const correct = reflection.options[reflection.correct];
        if (odd > 2) assert.match(reflection.question, new RegExp(String(odd) + ' odd'));
        else if (odd === 2) assert.match(correct, /start.*one odd.*end.*other/i);
        else assert.match(correct, /even.*return.*start/i);
        t.handle.destroy();
    }
    assert.ok(oddCounts.has(0) && oddCounts.has(2) && [...oddCounts].some(n => n > 2));
});
