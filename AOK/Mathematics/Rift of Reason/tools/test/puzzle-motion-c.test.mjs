// #66: short one-shot motion for oracle, prediction, three-act, tribunal, sorting and chart-fixer.
// Rift.Motion is stubbed to record "kind:className" strings. Every puzzle is driven twice, with and
// without Rift.Motion, and must submit and show exactly the same things (presentation only).
// Only strings, numbers and booleans are asserted: never pass a fake-DOM node to assert.
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadWithDom } from './fake-dom.mjs';

const BASE = ['js/core/rift.js', 'js/puzzles/registry.js'];

function setup(files, withMotion, calm) {
    const g = loadWithDom(BASE.concat(files), ctx => {
        ctx.addEventListener = () => {};
        ctx.removeEventListener = () => {};
    });
    const calls = [];
    if (withMotion) {
        const rec = kind => node => { calls.push(kind + ':' + (node && node.className)); return null; };
        g.Rift.Motion = { calm: () => !!calm, play: rec('play'), settle: rec('settle'), nudge: rec('nudge'), reveal: rec('reveal'),
            glow: rec('glow'), pop: rec('pop'), draw: rec('draw'), cancel: () => {} };
    } else {
        delete g.Rift.Motion;
    }
    const box = g.document.createElement('div');
    g.document.body.appendChild(box);
    const sent = [];
    const sfx = [];
    const mount = (id, data) => {
        const def = g.Rift.Puzzles.get(id);
        return def.mount(box, data, {
            submit: a => { const r = def.check(data, a); sent.push(JSON.stringify(a) + ' => ' + JSON.stringify({ solved: r.solved, partial: r.partial, feedback: r.feedback })); return r; },
            sfx: name => sfx.push(name), say() {}, rng: g.Rift.makeRng('motion-ui'), difficulty: data.difficulty, el: g.Rift.el,
        });
    };
    const all = sel => box.querySelectorAll(sel);
    const one = sel => box.querySelector(sel);
    const byText = (sel, text) => all(sel).find(b => b.textContent === text);
    const take = () => calls.splice(0);
    return { g, R: g.Rift, calls, take, sent, sfx, box, mount, all, one, byText };
}

// Run the same script with and without Rift.Motion; the outcome must not differ.
function bothWays(script) {
    const withM = script(true);
    const without = script(false);
    assert.equal(without.sent, withM.sent, 'same submissions without Rift.Motion');
    assert.equal(without.text, withM.text, 'same screen text without Rift.Motion');
    return withM;
}

// ---------------------------------------------------------------- oracle
function oracleScript(want) {
    return withMotion => {
        const t = setup(['js/puzzles/oracle.js'], withMotion);
        const def = t.R.Puzzles.get('oracle');
        const I = def.internals;
        let data = null, step = -1;
        for (let d = 1; d <= 3 && step < 0; d++) for (let s = 0; s < 60 && step < 0; s++) {
            const cand = def.generate(t.R.makeRng('motion-om-' + d + '-' + s), d);
            cand.steps.forEach((st, i) => {
                if (step >= 0 || !st.claim) return;
                const env = {};
                I.testVars(cand, i).forEach(k => { const v = cand.vars.find(x => x.name === k); env[k] = v ? v.start : 1; });
                let res = null;
                try { res = I.testStep(cand, i, env); } catch (e) { res = null; }
                if (res && res.fits && res.ok === (want === 'held')) { data = cand; step = i; }
            });
        }
        assert.ok(step >= 0, 'found a step that ' + want);
        const h = t.mount('oracle', data);
        t.take();
        t.all('.om-step')[step].click();
        const onSelect = t.take();
        t.one('.om-testbtn').click();
        const onTest = t.take();
        t.one('.om-accuse').click();
        t.all('.om-opt')[0].click();
        const text = t.box.textContent;
        h.destroy();
        return { onSelect, onTest, sent: t.sent.join('\n'), text };
    };
}

test('oracle: a held test settles its tape row, a broken one nudges it, once', () => {
    const held = bothWays(oracleScript('held'));
    assert.equal(held.onSelect.length, 0, 'selecting a step does not animate');
    assert.equal(held.onTest.length, 1);
    assert.match(held.onTest[0], /^settle:om-step\b.*\bheld\b/);
    const broke = bothWays(oracleScript('broke'));
    assert.equal(broke.onTest.length, 1);
    assert.match(broke.onTest[0], /^nudge:om-step\b.*\bbroke\b/);
    assert.ok(broke.sent.length > 0, 'the verdict was submitted');
});

// ---------------------------------------------------------------- prediction
function predictionScript(withMotion) {
    const t = setup(['js/puzzles/prediction.js'], withMotion);
    const def = t.R.Puzzles.get('prediction');
    const data = def.generate(t.R.makeRng('motion-pm'), 1);
    const h = t.mount('prediction', data);
    t.g.flush(500);
    const firstRender = t.take().length;
    let clicks = 0;
    const playRounds = max => {
        for (let r = 0; r < max; r++) {
            const opts = t.all('.pm-opt').filter(b => !b.disabled);
            if (!opts.length) break;
            opts[r % opts.length].click();
            clicks++;
            t.g.flush(500);
        }
    };
    playRounds(10);
    const warm = t.take();
    const warmClicks = clicks;
    const beat = t.byText('button', 'Now beat it →');
    if (beat) { beat.click(); t.g.flush(500); }
    playRounds(10);
    const calls = t.take();
    const text = t.box.textContent;
    const pipsOn = t.all('.pm-pip.on').length;
    h.destroy();
    return { firstRender, warm, warmClicks, clicks: clicks - warmClicks, calls, pipsOn, sent: t.sent.join('\n'), text };
}

test('prediction: only the newest history chip and the newly lit pip pop', () => {
    const r = bothWays(predictionScript);
    assert.equal(r.firstRender, 0, 'nothing pops on the first render');
    assert.equal(r.warmClicks, 10);
    assert.equal(r.warm.filter(c => c.startsWith('pop:pm-hchip')).length, 10, 'one chip pop per warm-up round');
    assert.ok(r.clicks > 0, 'played into the open-brain block');
    assert.equal(r.calls.filter(c => c.startsWith('pop:pm-hchip')).length, r.clicks, 'one chip pop per round');
    assert.equal(r.calls.filter(c => c === 'pop:pm-pip on').length, r.pipsOn, 'each lit pip popped exactly once');
    assert.ok(r.pipsOn > 0, 'won at least one open-brain round');
    assert.ok(r.calls.every(c => c.startsWith('pop:pm-hchip') || c === 'pop:pm-pip on'), r.calls.join(' | '));
});

// ---------------------------------------------------------------- three-act
function threeActScript(withMotion) {
    const t = setup(['js/puzzles/three-act.js'], withMotion);
    const def = t.R.Puzzles.get('three-act');
    const data = def.generate(t.R.makeRng('motion-ta'), 1);
    const sol = def.solve(data);
    const h = t.mount('three-act', data);
    t.g.flush(5000);
    t.all('.ta-wonder')[0].click();
    t.one('.ta-next').click();
    t.take();
    const card = t.all('.ta-info').find(b => !b.disabled);
    card.click();
    const onAsk = t.take();
    const model = t.one('.ta-model');
    model.value = String(sol.model);
    model.dispatchEvent({ type: 'input', preventDefault() {}, stopPropagation() {} });
    t.one('.ta-next').click();
    t.g.flush(5000);
    const firstTruth = t.all('.ta-cmp.truth.fresh').length;
    t.all('.ta-reflect')[sol.reflection].click();
    const laterTruth = t.all('.ta-cmp.truth.fresh').length;
    const truthStill = t.all('.ta-cmp.truth').length;
    t.byText('button', 'Hand it in').click();
    const text = t.box.textContent;
    h.destroy();
    return { onAsk, firstTruth, laterTruth, truthStill, sent: t.sent.join('\n'), text };
}

test('three-act: an asked card is revealed once; the answer pops only the first time', () => {
    const r = bothWays(threeActScript);
    assert.equal(r.onAsk.length, 1);
    assert.match(r.onAsk[0], /^reveal:ta-info got$/);
    assert.equal(r.firstTruth, 1, 'the answer card animates when it first appears');
    assert.equal(r.truthStill, 1);
    assert.equal(r.laterTruth, 0, 'a later click rebuilds it without replaying the pop');
    assert.ok(r.sent.length > 0);
});

test('three-act: Calm motion steps the scene quickly like reduced motion', () => {
    const run = calm => {
        const t = setup(['js/puzzles/three-act.js'], true, calm);
        const def = t.R.Puzzles.get('three-act');
        const h = t.mount('three-act', def.generate(t.R.makeRng('motion-ta'), 1));
        const first = t.g.timers.map(x => x.ms).join(',');
        h.destroy();
        return first;
    };
    assert.equal(run(true), '50');
    assert.equal(run(false), '700');
});

// ---------------------------------------------------------------- tribunal
const TB_FILES = ['data/creatures.js', 'data/cases.js', 'js/puzzles/tribunal.js'];
function tbAdvance(t) {
    for (let k = 0; k < 200; k++) {
        t.g.flush(500);
        if (t.one('.tb-press') || t.one('.tb-choice') || t.one('.tb-close')) return;
        const nextBtn = t.one('.tb-next');
        if (nextBtn) nextBtn.click();
    }
    throw new Error('tribunal never left the dialogue');
}
function tribunalContraScript(withMotion) {
    const t = setup(TB_FILES, withMotion);
    const def = t.R.Puzzles.get('tribunal');
    const data = def.generate(t.R.makeRng('m0'), 3);
    assert.ok(data.need >= 2, 'case keeps going after the first contradiction');
    const c = data.contradictions[0];
    const visible = data.testimony.filter(s => !s.hidden);
    const evidence = data.evidence.filter(e => !e.hidden);
    const h = t.mount('tribunal', data);
    tbAdvance(t);
    t.all('.tb-dot')[visible.findIndex(s => s.id === c.statements[0])].click();
    t.one('.tb-present').click();
    t.all('.tb-card')[evidence.findIndex(e => e.id === c.evidence[0])].click();
    t.take();
    t.one('.tb-takethat').click();
    tbAdvance(t);
    const back = t.take();
    t.all('.tb-arrow')[1].click();
    const later = t.take();
    const text = t.box.textContent;
    h.destroy();
    return { back, later, sent: t.sent.join('\n'), text };
}
function tribunalNewLineScript(withMotion) {
    const t = setup(TB_FILES, withMotion);
    const def = t.R.Puzzles.get('tribunal');
    let data = null;
    for (let d = 1; d <= 3 && !data; d++) for (let s = 0; s < 40 && !data; s++) {
        const cand = def.generate(t.R.makeRng('motion-tb-' + d + '-' + s), d);
        if (cand.testimony.some(x => !x.hidden && x.press && x.press.adds)) data = cand;
    }
    assert.ok(data, 'found a press that adds a statement');
    const visible = data.testimony.filter(s => !s.hidden);
    const h = t.mount('tribunal', data);
    tbAdvance(t);
    t.all('.tb-dot')[visible.findIndex(s => s.press && s.press.adds)].click();
    t.take();
    t.one('.tb-press').click();
    tbAdvance(t);
    const added = t.take();
    t.all('.tb-arrow')[1].click();
    t.all('.tb-arrow')[0].click();
    const again = t.take();
    const text = t.box.textContent;
    h.destroy();
    return { added, again, sent: t.sent.join('\n'), text };
}

test('tribunal: the contradicted statement is marked once; a new line slides in once', () => {
    const r = bothWays(tribunalContraScript);
    assert.deepEqual(r.back, ['settle:tb-text testimony']);
    assert.deepEqual(r.later, [], 'moving on does not replay it');
    const n = bothWays(tribunalNewLineScript);
    assert.deepEqual(n.added, ['reveal:tb-text testimony']);
    assert.deepEqual(n.again, [], 'the NEW line is revealed only once');
});

// ---------------------------------------------------------------- sorting
function sortingScript(withMotion) {
    const t = setup(['js/puzzles/sorting.js'], withMotion);
    const def = t.R.Puzzles.get('sorting');
    const data = def.generate(t.R.makeRng('motion-sm'), 2);
    const sol = def.solve(data);
    const fix = data.fixes.find(f => f.id === sol.fix);
    const h = t.mount('sorting', data);
    const first = t.take();
    const cells = () => ['tp', 'fn', 'fp', 'tn'].map(k => t.one('.sm-cell.' + k).textContent);
    t.byText('.sm-action button', 'Run the home-visit audit').click();
    const audit = t.take();
    const truthFirst = t.all('.sm-truth.fresh').length;
    t.byText('.sm-opt', data.flawOptions.find(o => o.id === data.flaw).text).click();
    const flawPick = t.take();
    const truthLater = t.all('.sm-truth.fresh').length;
    const truthShown = t.all('.sm-truth').length;
    t.byText('.sm-action button', 'Now fix it →').click();
    t.take();
    const before = cells();
    t.all('.sm-fix').find(b => b.textContent.includes(fix.label)).click();
    const after = cells();
    const onFix = t.take();
    const changedCells = before.filter((x, i) => x !== after[i]).length;
    const handIn = t.byText('.sm-action button', 'Hand in the audit');
    if (handIn) handIn.click();
    const text = t.box.textContent;
    h.destroy();
    return { first, audit, truthFirst, flawPick, truthLater, truthShown, onFix, changedCells, applicants: data.applicants.length, sent: t.sent.join('\n'), text };
}

test('sorting: only changed matrix numbers pop; the needed-help tags fade in only once', () => {
    const r = bothWays(sortingScript);
    assert.equal(r.first.length, 0, 'nothing pops on the first render');
    assert.equal(r.audit.filter(c => c === 'pop:sm-cn').length, 4, 'the audit fills all four cells');
    assert.equal(r.flawPick.length, 0, 'an unchanged matrix does not pop');
    assert.equal(r.truthFirst, r.applicants);
    assert.equal(r.truthShown, r.applicants);
    assert.equal(r.truthLater, 0, 'a later render does not replay the fade');
    assert.ok(r.changedCells > 0, 'the fix changes the table');
    assert.equal(r.onFix.filter(c => c === 'pop:sm-cn').length, r.changedCells);
    assert.ok(r.onFix.every(c => c === 'pop:sm-cn' || c === 'pop:sm-delta'), r.onFix.join(' | '));
    assert.ok(r.sent.length > 0);
});

// ---------------------------------------------------------------- chart-fixer
function chartScript(withMotion) {
    const t = setup(['js/puzzles/chart-fixer.js'], withMotion);
    const def = t.R.Puzzles.get('chart-fixer');
    let data = null;
    for (let s = 0; s < 60 && !data; s++) {
        const cand = def.generate(t.R.makeRng('motion-cf-' + s), 2);
        if (cand.uneven || cand.hasCum || cand.pop || cand.raw2 || cand.picto) data = cand;
    }
    assert.ok(data, 'found a chart with a switch');
    const h = t.mount('chart-fixer', data);
    const first = t.take();
    t.all('.cf-seg').find(b => !b.classList.contains('on')).click();
    const onToggle = t.take();
    const ev = (type, y) => ({ type, button: 0, pointerId: 1, clientX: 0, clientY: y, preventDefault() {}, stopPropagation() {} });
    const knob = t.one('.cf-knob.hi');
    const ruler = t.one('.cf-ruler');
    const placesBefore = t.sfx.filter(x => x === 'place').length;
    knob.dispatchEvent(ev('pointerdown', 0.5));
    ruler.dispatchEvent(ev('pointermove', 0.2));
    ruler.dispatchEvent(ev('pointermove', 0.1));
    const duringDrag = t.take();
    ruler.dispatchEvent(ev('pointerup', 0.1));
    const dragEnd = t.take();
    const dragChanged = t.sfx.filter(x => x === 'place').length - placesBefore;
    t.all('.cf-opt')[data.reading.correct].click();
    t.one('.cf-submit').click();
    const text = t.box.textContent;
    h.destroy();
    return { first, onToggle, duringDrag, dragEnd, dragChanged, sent: t.sent.join('\n'), text };
}

test('chart-fixer: the plot settles once per toggle and once at the end of a drag', () => {
    const r = bothWays(chartScript);
    assert.equal(r.first.length, 0);
    assert.deepEqual(r.onToggle, ['settle:cf-plot']);
    assert.deepEqual(r.duringDrag, [], 'no motion while dragging');
    assert.equal(r.dragChanged, 1, 'the drag moved the axis');
    assert.deepEqual(r.dragEnd, ['settle:cf-plot']);
    assert.ok(r.sent.length > 0);
});
