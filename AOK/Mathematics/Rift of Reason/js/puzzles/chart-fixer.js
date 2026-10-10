/*
 * Chart Fixer: Sense perception / seeing vs knowing (chapter 4, lesson 4).
 *
 * The Algorithm posts a chart of true Tomorrowton numbers drawn in a lying
 * way. The player adjusts the chart (axis ruler knobs, a time-window slider and
 * a few two-way switches) until the picture is honest, then says what the
 * honest chart really shows. The TOK point: the data never changed, only the
 * picture did.
 *
 * Distortions (difficulty 1/2/3 → one/two/three of them, never clashing):
 *   baseline   : bar axis starts above zero (small change looks huge)
 *   scale      : axis top far above the data (a real change looks flat)
 *   window     : cherry-picked run of years hides the long-run trend
 *   intervals  : unevenly spaced years drawn with equal gaps (bends the pace)
 *   cumulative : running total shown as if it were growth
 *   percapita  : totals while the population changed a lot
 *   dual       : a second series on its own stretched right axis (fake link)
 *   picto      : pictures scaled in width AND height for a 1-D change
 * Harder charts also get "decoy" switches that are already honest.
 *
 * Chart state (also the answer's `fixes`):
 *   { baseline, top,        axis range as ratios of the tallest shown value
 *     window: [a, b],       first and last year index shown
 *     spacing: 'even'|'true', cumulative: bool, perCapita: bool,
 *     dual: 'overlay'|'split', picto: 'area'|'stack' }   (only keys the chart has)
 * Honest: baseline 0, top in [1, 1.75], every year, true spacing, each year on
 * its own, per villager, separate charts, stacked pictures.
 *
 * Answer: { fixes: <state>, reading: <option index> }.
 */
(function (root) {
    'use strict';

    const Rift = root.Rift;

    const CATS = ['bigFall', 'smallFall', 'flat', 'smallRise', 'bigRise'];
    const BIG = ['bigFall', 'bigRise'];
    const PACES = ['steady', 'speeding', 'slowing'];
    const TOP_MIN = 1, TOP_MAX = 1.75, RULER_MAX = 12, MIN_WINDOW = 3;

    const DIST = {
        baseline: {
            name: 'Truncated axis', where: 'where the axis starts',
            fix: 'Drag the lower knob of the axis ruler down to 0.',
            feedback: 'the bars still do not start at zero, so small differences look huge.',
            why: 'starting the axis above zero made a small change look enormous',
        },
        scale: {
            name: 'Squashed scale', where: 'how high the axis goes',
            fix: 'Drag the upper knob of the ruler down until it sits just above the tallest bar.',
            feedback: 'the axis still does not fit the data: it goes far too high (changes look tiny) or cuts the bars off.',
            why: 'stretching the axis far above the data squashed a real change flat',
        },
        window: {
            name: 'Cherry-picked window', where: 'which years are shown',
            fix: 'Drag the window handles out so every year is shown.',
            feedback: 'the chart still hides some of the years.',
            why: 'showing only a few chosen years hid the long-run story',
        },
        intervals: {
            name: 'Uneven intervals', where: 'the gaps between the years',
            fix: 'Set the gaps between years to "true to the calendar".',
            feedback: 'the years are not evenly spaced in time, but the chart still draws them as if they were.',
            why: 'drawing uneven gaps between years as equal bent the shape of the change',
        },
        cumulative: {
            name: 'Running total', where: 'whether each bar adds up all the years before it',
            fix: 'Show each year on its own, not the running total.',
            feedback: 'the chart still adds each year onto the last, so it can only go up.',
            why: 'a running total can only grow, so it looked like growth even when each year was not',
        },
        percapita: {
            name: 'Missing per-person view', where: 'the population in the small print',
            fix: 'Switch to the per-villager numbers.',
            feedback: 'the number of villagers changed a lot, so the totals still hide what each villager does.',
            why: 'the totals moved because the number of villagers changed, not because each villager changed',
        },
        dual: {
            name: 'Two-axis trick', where: 'the two different axes',
            fix: 'Give each series its own honest chart.',
            feedback: 'the two series still sit on two separately stretched axes, so they look linked.',
            why: 'two separately stretched axes made two lines look as if they moved together',
        },
        picto: {
            name: 'Growing pictures', where: 'how the pictures grow',
            fix: 'Stack the pictures instead of growing them.',
            feedback: 'each picture still grows in width AND height, so a change looks much bigger than it is.',
            why: 'pictures that grow in both directions made the change look bigger than it was',
        },
    };
    const ORDER = Object.keys(DIST);

    // Distortions that cannot share a chart (both bend the same thing, or need
    // opposite stories in the data).
    const CLASH = {
        baseline: ['scale', 'intervals', 'picto', 'dual'],
        scale: ['picto', 'dual', 'cumulative'],
        window: [],
        intervals: ['picto'],
        cumulative: ['dual'],
        percapita: ['dual'],
        dual: ['picto', 'cumulative', 'percapita'],
        picto: [],
    };
    const clash = (a, b) => CLASH[a].includes(b) || CLASH[b].includes(a);
    // Features that cannot share a chart even as decoys.
    const FEAT_CLASH = { picto: ['intervals', 'dual'], dual: ['percapita', 'cumulative', 'picto'], intervals: ['picto'] };
    const featClash = (a, b) => (FEAT_CLASH[a] || []).includes(b) || (FEAT_CLASH[b] || []).includes(a);

    // Which honest trends each distortion can lie about.
    const ALLOWED = {
        baseline: ['smallFall', 'flat', 'smallRise'],
        scale: ['bigFall', 'bigRise'],
        intervals: ['bigFall', 'bigRise'],
        cumulative: ['bigFall', 'smallFall', 'flat', 'smallRise'],
        dual: ['bigFall', 'bigRise'],
        picto: ['smallFall', 'smallRise'],
    };
    const allowedCats = D => CATS.filter(c => D.every(k => !ALLOWED[k] || ALLOWED[k].includes(c)));

    // Tomorrowton datasets (all fictional).
    const THEMES = [
        { id: 'pies', short: 'Pie sales', title: 'Pies sold at the Fair', unit: 'pies', pc: { label: 'pies per villager', factor: 1, level: [2.2, 3.4] }, level: [1800, 3200], dec: 0, cum: true, icon: 'pie' },
        { id: 'rifts', short: 'Rift sightings', title: 'Rift sightings in Tomorrowton', unit: 'sightings', pc: { label: 'sightings per 100 villagers', factor: 100, level: [10, 16] }, level: [90, 160], dec: 0, cum: true, icon: 'eye' },
        { id: 'books', short: 'Library loans', title: 'Books borrowed from the library', unit: 'books', pc: { label: 'books per villager', factor: 1, level: [4, 7] }, level: [3500, 7000], dec: 0, cum: true, icon: 'book' },
        { id: 'lanterns', sing: true, short: 'Lantern oil use', title: 'Lantern oil burned', unit: 'litres', pc: { label: 'litres per villager', factor: 1, level: [6, 10] }, level: [5000, 9000], dec: 0, cum: true, icon: 'lantern' },
        { id: 'teacups', short: 'Broken teacups', title: 'Teacups broken at the Tea House', unit: 'cups', pc: { label: 'cups per 100 villagers', factor: 100, level: [12, 20] }, level: [110, 200], dec: 0, cum: true, icon: 'cup' },
        { id: 'pumpkins', short: 'Giant pumpkins', title: 'Giant pumpkins grown', unit: 'pumpkins', pc: { label: 'pumpkins per 100 villagers', factor: 100, level: [8, 14] }, level: [80, 140], dec: 0, cum: true, icon: 'pumpkin' },
        { id: 'happiness', sing: true, short: 'Happiness', title: 'Tomorrowton Happiness Index', unit: 'index points', pc: null, level: [42, 58], dec: 1, cum: false, icon: 'smile' },
        { id: 'scores', short: 'Test scores', title: 'Average test score at Tomorrowton School', unit: 'points out of 100', pc: null, level: [40, 56], dec: 1, cum: false, icon: 'star' },
    ];
    // Second series for the two-axis trick: big numbers or one decimal, so the
    // stretched right axis still draws a smooth line.
    const DUAL_OK = ['pies', 'books', 'lanterns', 'happiness', 'scores'];

    const TREND_TEXT = { bigRise: 'rose a lot', smallRise: 'rose a little', flat: 'stayed about the same', smallFall: 'fell a little', bigFall: 'fell a lot' };
    const PACE_TEXT = { steady: ', at a steady pace', speeding: ', faster and faster', slowing: ', but more and more slowly' };

    // ------------------------------------------------------------------
    // Maths helpers
    // ------------------------------------------------------------------

    const float = (rng, lo, hi) => lo + rng.next() * (hi - lo);
    const range = (a, b) => { const o = []; for (let i = a; i <= b; i++) o.push(i); return o; };
    const roundTo = (v, dec) => { const f = Math.pow(10, dec); return Math.round(v * f) / f; };
    const cap = s => s.charAt(0).toUpperCase() + s.slice(1);

    function linfit(xs, ys) {
        const n = xs.length;
        const mx = xs.reduce((s, v) => s + v, 0) / n;
        const my = ys.reduce((s, v) => s + v, 0) / n;
        let sxx = 0, sxy = 0;
        for (let i = 0; i < n; i++) { sxx += (xs[i] - mx) * (xs[i] - mx); sxy += (xs[i] - mx) * (ys[i] - my); }
        const slope = sxx > 0 ? sxy / sxx : 0;
        return { slope, at: x => my + slope * (x - mx) };
    }

    // Relative change of the best-fit line from the first to the last point.
    function changeOf(xs, ys) {
        const f = linfit(xs, ys);
        const s = f.at(xs[0]), e = f.at(xs[xs.length - 1]);
        if (s <= 0) return e >= s ? 9 : -9;
        return (e - s) / s;
    }

    // Strict bands for the honest reading (gaps between bands are rejected at
    // generation, so the right answer is never borderline).
    function catStrict(r) {
        const a = Math.abs(r);
        if (a <= 0.04) return 'flat';
        if (a >= 0.08 && a <= 0.22) return r > 0 ? 'smallRise' : 'smallFall';
        if (a >= 0.32) return r > 0 ? 'bigRise' : 'bigFall';
        return null;
    }
    function catLoose(r) {
        const a = Math.abs(r);
        if (a < 0.06) return 'flat';
        if (a < 0.27) return r > 0 ? 'smallRise' : 'smallFall';
        return r > 0 ? 'bigRise' : 'bigFall';
    }

    // Pace: slope of the second half (by position) over the slope of the first half.
    function paceRatio(xs, ys) {
        const mid = (xs[0] + xs[xs.length - 1]) / 2;
        const A = [], B = [];
        xs.forEach((x, i) => { if (x <= mid) A.push(i); if (x >= mid) B.push(i); });
        if (A.length < 2 || B.length < 2) return null;
        const s1 = linfit(A.map(i => xs[i]), A.map(i => ys[i])).slope;
        const s2 = linfit(B.map(i => xs[i]), B.map(i => ys[i])).slope;
        if (s1 === 0) return null;
        return s2 / s1;
    }
    function paceStrict(q) {
        if (q == null) return null;
        if (q >= 0.67 && q <= 1.5) return 'steady';
        if (q >= 2) return 'speeding';
        if (q > 0 && q <= 0.5) return 'slowing';
        return null;
    }
    function paceLoose(q) {
        if (q == null) return 'steady';
        if (q < 0.71) return 'slowing';
        if (q > 1.41) return 'speeding';
        return 'steady';
    }

    function niceStep(x) {
        if (!(x > 0)) return 1;
        const p = Math.pow(10, Math.floor(Math.log10(x)));
        const m = x / p;
        return (m < 1.5 ? 1 : m < 3 ? 2 : m < 7 ? 5 : 10) * p;
    }
    function niceTicks(lo, hi, count) {
        const step = niceStep((hi - lo) / (count || 5));
        const out = [];
        for (let t = Math.ceil(lo / step - 1e-9) * step; t <= hi + step * 1e-6; t += step) out.push(Math.abs(t) < step * 1e-9 ? 0 : t);
        return out;
    }
    function fmt(v) {
        const a = Math.abs(v);
        let s;
        if (a >= 100) s = String(Math.round(v)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        else if (a >= 10) s = String(roundTo(v, 1));
        else s = String(roundTo(v, 2));
        return s;
    }

    // ------------------------------------------------------------------
    // The chart model (pure)
    // ------------------------------------------------------------------

    // What the chart currently draws.
    function view(data, st) {
        const n = data.years.length;
        let vals = data.raw.slice();
        if (data.pop && st.perCapita) vals = vals.map((v, i) => v / data.pop[i] * data.pcFactor);
        if (data.hasCum && st.cumulative) { let s = 0; vals = vals.map(v => (s += v)); }
        const a = Math.max(0, Math.min(n - 2, st.window[0] | 0));
        const b = Math.max(a + 1, Math.min(n - 1, st.window[1] | 0));
        const idx = range(a, b);
        const trueGaps = !data.uneven || st.spacing === 'true';
        const pos = idx.map(i => (trueGaps ? data.years[i] : i));
        const shown = idx.map(i => vals[i]);
        const M = Math.max(...shown) || 1;
        const out = { idx, pos, vals: shown, M, B: st.baseline * M, T: st.top * M, trueGaps };
        if (data.raw2) out.vals2 = idx.map(i => data.raw2[i]);
        return out;
    }

    // The reading the chart gives. strict → the honest reading (null if borderline);
    // loose → what the picture makes you see.
    function facets(data, st, strict) {
        const v = view(data, st);
        const out = {};
        if (strict) {
            out.trend = catStrict(changeOf(v.pos, v.vals));
            if (data.facets.pace) out.pace = paceStrict(paceRatio(v.pos, v.vals));
            if (data.facets.trend2) out.trend2 = catStrict(changeOf(v.pos, v.vals2));
            return out;
        }
        const f = linfit(v.pos, v.vals);
        const fs = f.at(v.pos[0]), fe = f.at(v.pos[v.pos.length - 1]);
        let r;
        if (data.picto && st.picto === 'area') {
            r = fs > 0 ? (fe * fe) / (fs * fs) - 1 : 9;
        } else {
            const span = Math.max(1e-9, v.T - v.B);
            const hs = (Math.max(v.B, Math.min(v.T, fs)) - v.B) / span;
            const he = (Math.max(v.B, Math.min(v.T, fe)) - v.B) / span;
            if (Math.abs(he - hs) < 0.05) r = 0;
            else if (hs < 0.02) r = he > hs ? 9 : -0.9;
            else r = he / hs - 1;
        }
        out.trend = catLoose(r);
        if (data.facets.pace) out.pace = paceLoose(paceRatio(v.pos, v.vals));
        if (data.facets.trend2) out.trend2 = st.dual === 'overlay' ? out.trend : catLoose(changeOf(v.pos, v.vals2));
        return out;
    }

    const sameKind = (a, b) => a.trend === b.trend && a.pace === b.pace && a.trend2 === b.trend2;

    function honestState(data) {
        const n = data.years.length;
        const s = { baseline: 0, top: data.start.top >= TOP_MIN && data.start.top <= TOP_MAX ? data.start.top : 1.2, window: [0, n - 1] };
        if (data.uneven) s.spacing = 'true';
        if (data.hasCum) s.cumulative = false;
        if (data.pop) s.perCapita = true;
        if (data.raw2) s.dual = 'split';
        if (data.picto) s.picto = 'stack';
        return s;
    }

    // Read an answer's fixes over the starting state (missing keys = untouched).
    function readState(data, fixes) {
        const s = JSON.parse(JSON.stringify(data.start));
        if (!fixes || typeof fixes !== 'object') return s;
        const n = data.years.length;
        if (fixes.baseline != null && isFinite(+fixes.baseline)) s.baseline = +fixes.baseline;
        if (fixes.top != null && isFinite(+fixes.top)) s.top = +fixes.top;
        if (Array.isArray(fixes.window) && fixes.window.length === 2) {
            const a = Math.round(+fixes.window[0]), b = Math.round(+fixes.window[1]);
            if (isFinite(a) && isFinite(b) && a >= 0 && b <= n - 1 && a < b) s.window = [a, b];
        }
        if (data.uneven && (fixes.spacing === 'even' || fixes.spacing === 'true')) s.spacing = fixes.spacing;
        if (data.hasCum && typeof fixes.cumulative === 'boolean') s.cumulative = fixes.cumulative;
        if (data.pop && typeof fixes.perCapita === 'boolean') s.perCapita = fixes.perCapita;
        if (data.raw2 && (fixes.dual === 'overlay' || fixes.dual === 'split')) s.dual = fixes.dual;
        if (data.picto && (fixes.picto === 'area' || fixes.picto === 'stack')) s.picto = fixes.picto;
        return s;
    }

    // Every control still in a dishonest position, as distortion keys.
    function issuesOf(data, s) {
        const n = data.years.length;
        const out = [];
        if (Math.abs(s.baseline) > 1e-6) out.push('baseline');
        if (!(s.top >= TOP_MIN - 1e-9 && s.top <= TOP_MAX + 1e-9)) out.push('scale');
        if (s.window[0] !== 0 || s.window[1] !== n - 1) out.push('window');
        if (data.uneven && s.spacing !== 'true') out.push('intervals');
        if (data.hasCum && s.cumulative) out.push('cumulative');
        if (data.pop && !s.perCapita) out.push('percapita');
        if (data.raw2 && s.dual !== 'split') out.push('dual');
        if (data.picto && s.picto !== 'stack') out.push('picto');
        return out;
    }

    // ------------------------------------------------------------------
    // Generation
    // ------------------------------------------------------------------

    function pickDistortions(rng, d) {
        const chosen = [];
        for (let i = 0; i < d; i++) {
            const cands = ORDER.filter(k => !chosen.includes(k) && chosen.every(c => !clash(c, k)) && allowedCats(chosen.concat(k)).length);
            if (!cands.length) return null;
            // the window fits everything, so damp it a little to keep variety
            chosen.push(rng.weighted(cands.map(k => ({ item: k, weight: k === 'window' ? 0.6 : 1 }))));
        }
        return ORDER.filter(k => chosen.includes(k));
    }

    function unevenYears(rng, n, dense) {
        const nBig = Math.max(2, Math.round((n - 1) * 0.4));
        const big = [], small = [];
        for (let i = 0; i < nBig; i++) big.push(rng.pick([4, 5, 6, 8, 10]));
        for (let i = nBig; i < n - 1; i++) small.push(rng.pick([1, 1, 2]));
        const gaps = dense === 'late' ? big.concat(small) : small.concat(big);
        const total = gaps.reduce((s, g) => s + g, 0);
        const years = [rng.int(2020, 2026) - total];
        gaps.forEach(g => years.push(years[years.length - 1] + g));
        return years;
    }

    const SHAPE = { steady: u => u, speeding: u => u * u, slowing: u => 1 - (1 - u) * (1 - u) };
    const TARGET = { bigRise: [0.4, 0.65], smallRise: [0.12, 0.19], flat: [-0.015, 0.015], smallFall: [-0.19, -0.12], bigFall: [-0.45, -0.35] };

    function headlineFor(data, seen, theme, theme2) {
        const S = data.start.perCapita ? cap(theme.pc.label) : theme.short;
        if (seen.trend2) {
            const verb = /Rise/.test(seen.trend) ? 'rise' : /Fall/.test(seen.trend) ? 'fall' : 'move';
            return S + ' and ' + theme2.short.toLowerCase() + ' ' + verb + ' together! Coincidence? We think not.';
        }
        const base = {
            bigRise: S + ' are SOARING!', smallRise: S + ' are creeping up.', flat: S + ': nothing ever changes.',
            smallFall: S + ' are slipping.', bigFall: S + ' are CRASHING!',
        }[seen.trend];
        const fixed = theme.sing && !data.start.perCapita ? base.replace(' are ', ' is ') : base;
        if (!seen.pace || seen.pace === 'steady') return fixed;
        return fixed + (seen.pace === 'speeding' ? ' And it is speeding up!' : ' But the boom is fading fast.');
    }

    function readingText(data, k) {
        let t = data.subject + ' ' + TREND_TEXT[k.trend] + (k.pace ? PACE_TEXT[k.pace] : '');
        if (k.trend2) {
            if (k.trend2 === k.trend && !k.pace) return data.subject + ' and ' + data.subject2.toLowerCase() + ' both ' + TREND_TEXT[k.trend] + '.';
            t += ', while ' + data.subject2.toLowerCase() + ' ' + TREND_TEXT[k.trend2];
        }
        return t + '.';
    }

    function buildReading(rng, data, truth, seen) {
        const trends = data.facets.pace ? BIG : CATS;
        let space = trends.map(t => ({ trend: t }));
        if (data.facets.pace) space = [].concat(...space.map(k => PACES.map(p => Object.assign({}, k, { pace: p }))));
        if (data.facets.trend2) space = [].concat(...space.map(k => CATS.map(t2 => Object.assign({}, k, { trend2: t2 }))));
        const key = k => [k.trend, k.pace || '', k.trend2 || ''].join('|');
        const truthKey = key(truth);
        const kinds = [truth];
        const seenOk = space.some(k => key(k) === key(seen));
        if (seenOk && key(seen) !== truthKey) kinds.push(seen);
        const dist = k => (k.trend !== truth.trend) + (k.pace !== truth.pace) + (k.trend2 !== truth.trend2);
        const rest = rng.shuffle(space.filter(k => !kinds.some(x => key(x) === key(k))));
        rest.sort((a, b) => dist(a) - dist(b));
        while (kinds.length < 4 && rest.length) kinds.push(rest.shift());
        const order = rng.shuffle(kinds.map((_, i) => i));
        const shuffled = order.map(i => kinds[i]);
        return {
            question: 'Now the chart is honest. What does it really show' + (data.facets.trend2 ? '' : ' about ' + data.subject.toLowerCase()) + ', from the first year to the last?',
            options: shuffled.map(k => readingText(data, k)),
            kinds: shuffled,
            correct: order.indexOf(0),
        };
    }

    function attempt(rng, d, D) {
        const has = k => D.includes(k);
        const themes = THEMES.filter(t => (!has('percapita') || t.pc) && (!has('cumulative') || t.cum) && (!has('dual') || THEMES.some(o => o !== t && DUAL_OK.includes(o.id))));
        const theme = rng.pick(themes);

        // decoy switches: present, but already honest
        const decoys = [];
        const nDecoy = d === 1 ? 0 : d === 2 ? (rng.chance(0.5) ? 1 : 0) : rng.int(1, 2);
        for (let i = 0; i < nDecoy; i++) {
            const feats = D.concat(decoys);
            const cands = ['intervals', 'percapita', 'cumulative', 'picto'].filter(k => !feats.includes(k)
                && feats.every(f => !featClash(f, k))
                && (k !== 'percapita' || theme.pc) && (k !== 'cumulative' || theme.cum));
            if (!cands.length) break;
            decoys.push(rng.pick(cands));
        }
        const feat = k => has(k) || decoys.includes(k);

        const cat = rng.pick(allowedCats(D));
        const pace = has('intervals') ? rng.pick(PACES) : null;
        const uneven = feat('intervals');
        const n = has('window') ? rng.int(10, 12) : feat('picto') ? rng.int(5, 7) : rng.int(7, 9);
        const dense = pace === 'speeding' ? 'late' : pace === 'slowing' ? 'early' : rng.pick(['late', 'early']);
        let years;
        if (uneven) years = unevenYears(rng, n, dense);
        else { const y0 = rng.int(2008, 2014); years = range(0, n - 1).map(i => y0 + i); }
        const u = years.map(y => (y - years[0]) / (years[n - 1] - years[0]));

        const hasPop = feat('percapita');
        const r = float(rng, TARGET[cat][0], TARGET[cat][1]);
        const shape = SHAPE[pace || 'steady'];
        const lv = hasPop ? theme.pc.level : theme.level;
        const level = float(rng, lv[0], lv[1]);
        const h = u.map(x => level * (1 + r * shape(x)) * (1 + float(rng, -0.02, 0.02)));

        // the cherry-picked window: a short run that goes the "wrong" way
        let win = null;
        if (has('window')) {
            const L = rng.int(4, 5);
            const a = rng.chance(0.7) ? n - L : rng.int(1, n - L);
            win = [a, a + L - 1];
            const dir = /Rise/.test(cat) ? -1 : /Fall/.test(cat) ? 1 : rng.pick([-1, 1]);
            for (let j = 0; j < L; j++) {
                const t = j / (L - 1);
                h[a + j] *= dir > 0 ? 0.86 + 0.46 * t : 1.18 - 0.42 * t;
            }
        }

        let pop = null, raw;
        const factor = hasPop ? theme.pc.factor : 1;
        if (hasPop) {
            const P0 = rng.int(700, 1300);
            const g = has('percapita') ? (cat === 'bigRise' ? -float(rng, 0.3, 0.42) : float(rng, 0.6, 1.0)) : float(rng, -0.05, 0.25);
            pop = u.map(x => Math.round(P0 * (1 + g * x) * (1 + float(rng, -0.01, 0.01))));
            raw = h.map((v, i) => Math.max(1, Math.round(v * pop[i] / factor)));
        } else {
            raw = h.map(v => Math.max(0.1, roundTo(v, theme.dec)));
        }

        let raw2 = null, theme2 = null;
        if (has('dual')) {
            theme2 = rng.pick(THEMES.filter(t => t !== theme && DUAL_OK.includes(t.id)));
            const up = /Rise/.test(cat);
            const cat2 = rng.chance(0.65) ? (up ? 'smallRise' : 'smallFall') : 'flat';
            const r2 = cat2 === 'flat' ? (up ? 1 : -1) * float(rng, 0.015, 0.03) : (up ? 1 : -1) * float(rng, 0.1, 0.16);
            const lv2 = float(rng, theme2.level[0], theme2.level[1]);
            raw2 = u.map(x => roundTo(lv2 * (1 + r2 * x) * (1 + float(rng, -0.003, 0.003)), Math.max(theme2.dec, lv2 < 1000 ? 1 : 0)));
        }

        const data = {
            difficulty: d,
            distortions: D,
            decoys,
            theme: theme.id,
            title: theme.title,
            icon: theme.icon,
            unit: theme.unit,
            pcLabel: hasPop ? theme.pc.label : null,
            pcFactor: factor,
            subject: hasPop ? cap(theme.pc.label) : theme.short,
            years,
            uneven,
            raw,
            pop,
            hasCum: feat('cumulative'),
            picto: feat('picto'),
            raw2,
            title2: theme2 ? theme2.title : null,
            subject2: theme2 ? theme2.short : null,
            unit2: theme2 ? theme2.unit : null,
            facets: { pace: !!pace, trend2: !!raw2 },
        };

        // the starting (lying) state
        const start = { baseline: 0, top: float(rng, 1.08, 1.3), window: [0, n - 1] };
        if (uneven) start.spacing = has('intervals') ? 'even' : 'true';
        if (data.hasCum) start.cumulative = has('cumulative');
        if (hasPop) start.perCapita = !has('percapita');
        if (raw2) start.dual = 'overlay';
        if (data.picto) start.picto = has('picto') ? 'area' : 'stack';
        if (win) start.window = win;
        if (has('scale')) start.top = float(rng, 10, RULER_MAX);
        data.start = start;
        if (has('baseline')) {
            const v = view(data, start);
            const mn = Math.min(...v.vals), mx = Math.max(...v.vals);
            let B = mn - (mx - mn) * float(rng, 0.12, 0.35);
            if (B < mn * 0.4) B = mn * float(rng, 0.5, 0.8); // a running total spans a lot
            const step = niceStep(Math.min((mx - mn) / 4, B / 4));
            B = Math.floor(B / step) * step;
            if (!(B > 0)) return null;
            start.baseline = B / v.M;
            start.top = Math.max(start.top, start.baseline + 0.1);
        }

        // the honest reading must be clear-cut, and the lying chart must tell another story
        const truth = facets(data, honestState(data), true);
        if (!truth.trend || truth.trend !== cat) return null;
        if (data.facets.pace && truth.pace !== pace) return null;
        if (data.facets.trend2 && !truth.trend2) return null;
        if (data.facets.trend2 && truth.trend2 === truth.trend) return null;
        const seen = facets(data, start, false);
        if (sameKind(seen, truth)) return null;

        data.truth = truth;
        data.seen = seen;
        data.headline = headlineFor(data, seen, theme, theme2);
        data.reading = buildReading(rng, data, truth, seen);
        return data;
    }

    function generate(rng, difficulty) {
        const d = Math.max(1, Math.min(3, Math.round(Number(difficulty) || 1)));
        // choose the tricks first, then retry the numbers until they tell a clear story
        for (let i = 0; i < 40; i++) {
            const D = pickDistortions(rng, d);
            if (!D) continue;
            for (let j = 0; j < 400; j++) {
                const data = attempt(rng, d, D);
                if (data) { data.whyShuffle = rng.int(1, 1e6); return data; }
            }
        }
        throw new Error('chart-fixer: could not generate a chart');
    }

    // ------------------------------------------------------------------
    // Checking, hints, why
    // ------------------------------------------------------------------

    function check(data, answer) {
        if (!data || !answer || typeof answer !== 'object') return { solved: false, partial: 0, unfixed: [], feedback: 'Nothing to check yet.' };
        const s = readState(data, answer.fixes);
        const issues = issuesOf(data, s);
        const k = data.distortions.length;
        const fixed = data.distortions.filter(d => !issues.includes(d)).length;
        if (issues.length) {
            const first = DIST[issues[0]];
            return {
                solved: false,
                partial: fixed / (k + 1),
                unfixed: issues,
                feedback: 'Still misleading' + (issues.length > 1 ? ' (' + issues.length + ' problems left)' : '') + '. ' + first.name + ': ' + first.feedback,
            };
        }
        const pick = answer.reading == null ? null : Number(answer.reading);
        if (pick !== data.reading.correct) {
            return {
                solved: false,
                partial: k / (k + 1),
                unfixed: [],
                feedback: pick == null ? 'The chart is honest now. Say what it really shows.'
                    : 'The chart is honest now, but that is not what it shows. Compare the first and last years again.',
            };
        }
        return { solved: true, partial: 1, unfixed: [], feedback: 'Honest at last! ' + data.reading.options[data.reading.correct] };
    }

    function hintsFor(data) {
        const D = data.distortions;
        const count = D.length === 1 ? 'one trick' : D.length === 2 ? 'two tricks' : 'three tricks';
        return [
            'This chart hides ' + count + '. The numbers are true; the picture is not. Check the axis, the years shown, and what is being counted.',
            'Look closely at ' + D.map(k => DIST[k].where).join('; and at ') + '.',
            D.map(k => DIST[k].fix).join(' ') + ' Then compare the first and last years of the honest chart.',
        ];
    }

    function whyFor(data) {
        const tricks = data.distortions.map(k => DIST[k].why);
        const list = tricks.length === 1 ? tricks[0] : tricks.slice(0, -1).join(', ') + ' and ' + tricks[tricks.length - 1];
        const options = [
            'The numbers stayed the same; only the drawing changed, and the drawing bent what our eyes saw.',
            'The Algorithm secretly used different numbers, and the honest chart used the real ones.',
            'The first chart was older, so its numbers were out of date by the time we fixed it.',
            'Charts always lie, so the numbers behind any chart can never be trusted at all.',
        ];
        const order = Rift.makeRng(data.whyShuffle || 1).shuffle(options.map((_, i) => i));
        return {
            question: 'The lying chart and your honest chart used exactly the same numbers. So why did the first one say "' + data.headline + '"?',
            options: order.map(i => options[i]),
            correct: order.indexOf(0),
            explain: 'Seeing is not knowing. Here, ' + list + '. A chart is a set of choices (where the axis starts, which years, what is counted), and each choice can bend what our eyes believe. To know what the data says, ask how the picture was made.',
        };
    }

    function solveFor(data) {
        return { fixes: honestState(data), reading: data.reading.correct };
    }

    // ------------------------------------------------------------------
    // Drawing (SVG strings)
    // ------------------------------------------------------------------

    const GLYPHS = {
        pie: '<ellipse cx="50" cy="60" rx="44" ry="28" fill="#b9772f" stroke="#1A1020" stroke-width="5"/><ellipse cx="50" cy="50" rx="44" ry="27" fill="#e2a95a" stroke="#1A1020" stroke-width="5"/><path d="M22 42 L78 42 M18 55 L82 55 M38 26 L33 74 M60 25 L64 75" stroke="#9a5a1e" stroke-width="5" stroke-linecap="round"/>',
        eye: '<path d="M6 50 Q50 8 94 50 Q50 92 6 50Z" fill="#efe3c8" stroke="#1A1020" stroke-width="5"/><circle cx="50" cy="50" r="18" fill="#3FE0D0" stroke="#1A1020" stroke-width="5"/><circle cx="50" cy="50" r="7" fill="#1A1020"/>',
        book: '<path d="M8 20 L48 26 L48 86 L8 80Z" fill="#3D7BFF" stroke="#1A1020" stroke-width="5" stroke-linejoin="round"/><path d="M92 20 L52 26 L52 86 L92 80Z" fill="#5b8fff" stroke="#1A1020" stroke-width="5" stroke-linejoin="round"/><path d="M17 36 L40 39 M17 51 L40 54 M60 39 L83 36 M60 54 L83 51" stroke="#efe3c8" stroke-width="4"/>',
        lantern: '<rect x="40" y="6" width="20" height="10" rx="3" fill="#6b4a1c" stroke="#1A1020" stroke-width="4"/><rect x="24" y="16" width="52" height="64" rx="10" fill="#ffcf6b" stroke="#1A1020" stroke-width="5"/><path d="M50 32 q11 15 0 30 q-11 -15 0 -30z" fill="#E8384F"/><rect x="20" y="80" width="60" height="12" rx="4" fill="#6b4a1c" stroke="#1A1020" stroke-width="5"/>',
        cup: '<path d="M14 34 H74 V58 Q74 84 44 84 Q14 84 14 58Z" fill="#efe3c8" stroke="#1A1020" stroke-width="5" stroke-linejoin="round"/><path d="M74 42 q18 0 14 14 q-3 10 -16 8" fill="none" stroke="#1A1020" stroke-width="5"/><ellipse cx="44" cy="90" rx="36" ry="6" fill="#c99a3c" stroke="#1A1020" stroke-width="4"/><path d="M32 22 q6 -8 0 -14 M50 22 q6 -8 0 -14" stroke="#1A1020" stroke-width="3" fill="none"/>',
        pumpkin: '<ellipse cx="30" cy="60" rx="22" ry="30" fill="#e8742a" stroke="#1A1020" stroke-width="5"/><ellipse cx="70" cy="60" rx="22" ry="30" fill="#e8742a" stroke="#1A1020" stroke-width="5"/><ellipse cx="50" cy="60" rx="22" ry="32" fill="#f28c38" stroke="#1A1020" stroke-width="5"/><path d="M50 28 q2 -14 12 -20" stroke="#2f6b2a" stroke-width="7" fill="none" stroke-linecap="round"/>',
        smile: '<circle cx="50" cy="50" r="42" fill="#F2B632" stroke="#1A1020" stroke-width="5"/><circle cx="36" cy="40" r="6" fill="#1A1020"/><circle cx="64" cy="40" r="6" fill="#1A1020"/><path d="M30 60 Q50 80 70 60" fill="none" stroke="#1A1020" stroke-width="6" stroke-linecap="round"/>',
        star: '<path d="M50 6 L62 38 L96 38 L68 58 L79 92 L50 71 L21 92 L32 58 L4 38 L38 38Z" fill="#F2B632" stroke="#1A1020" stroke-width="5" stroke-linejoin="round"/>',
    };
    function glyph(kind, cx, cy, size) {
        const s = size / 100;
        return '<g transform="translate(' + (cx - size / 2).toFixed(1) + ' ' + (cy - size / 2).toFixed(1) + ') scale(' + s.toFixed(4) + ')">' + (GLYPHS[kind] || GLYPHS.star) + '</g>';
    }
    const esc = s => String(s).replace(/[<>&"]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c]));

    const COL = { ink: '#1A1020', bar: '#2c8f57', barHi: '#3fbf78', grid: 'rgba(26,16,32,0.13)', muted: '#5a4a3a', line2: '#b0219e' };

    function layoutOf(data, st, W, H) {
        const overlay = !!data.raw2 && st.dual === 'overlay';
        const split = !!data.raw2 && st.dual === 'split';
        const L = { ml: 52, mr: overlay ? 52 : 14, mt: overlay ? 26 : 12, mb: 26 };
        L.pTop = L.mt;
        L.pBot = split ? L.mt + (H - L.mt - L.mb) * 0.56 : H - L.mb;
        if (split) { L.p2Top = L.pBot + 30; L.p2Bot = H - L.mb; }
        return L;
    }

    function rightAxis(v) {
        const last = v.pos.length - 1;
        const f1 = linfit(v.pos, v.vals), f2 = linfit(v.pos, v.vals2);
        const span1 = Math.max(1e-9, v.T - v.B);
        const hs = (f1.at(v.pos[0]) - v.B) / span1, he = (f1.at(v.pos[last]) - v.B) / span1;
        const gs = f2.at(v.pos[0]), ge = f2.at(v.pos[last]);
        const span = (ge - gs) / (he - hs);
        if (isFinite(span) && span > 0 && Math.abs(he - hs) > 0.05) {
            const B2 = gs - hs * span;
            return [B2, B2 + span];
        }
        const mn = Math.min(...v.vals2), mx = Math.max(...v.vals2);
        const pad = (mx - mn) * 0.25 || 1;
        return [mn - pad, mx + pad];
    }

    function chartSvg(data, st, W, H, uid) {
        const v = view(data, st);
        const L = layoutOf(data, st, W, H);
        const overlay = !!data.raw2 && st.dual === 'overlay';
        const split = !!data.raw2 && st.dual === 'split';
        const area = data.picto && st.picto === 'area';
        const stack = data.picto && st.picto === 'stack';
        const x0 = L.ml, x1 = W - L.mr;
        const cnt = v.idx.length;
        let cx, bw;
        if (!data.uneven || !v.trueGaps) {
            const slot = (x1 - x0) / cnt;
            bw = Math.min(slot * 0.64, 70);
            cx = k => x0 + slot * (k + 0.5);
        } else {
            const p0 = v.pos[0], p1 = v.pos[cnt - 1];
            let mg = Infinity;
            for (let k = 1; k < cnt; k++) mg = Math.min(mg, v.pos[k] - v.pos[k - 1]);
            bw = Math.max(5, Math.min((x1 - x0) / cnt * 0.64, (x1 - x0) * mg / (p1 - p0) * 0.7, 70));
            cx = k => x0 + bw / 2 + 2 + (v.pos[k] - p0) / (p1 - p0) * (x1 - x0 - bw - 4);
        }
        const s = [];
        const defs = ['<clipPath id="' + uid + 'clip"><rect x="' + x0 + '" y="' + L.pTop + '" width="' + (x1 - x0) + '" height="' + (L.pBot - L.pTop) + '"/></clipPath>'];

        if (area) {
            // the lying pictogram: every picture grows in width and height
            const slot = (x1 - x0) / cnt;
            const maxS = Math.min(slot * 0.96, L.pBot - L.pTop - 18);
            s.push('<line x1="' + x0 + '" y1="' + L.pBot + '" x2="' + x1 + '" y2="' + L.pBot + '" stroke="' + COL.ink + '" stroke-width="2"/>');
            v.vals.forEach((val, k) => {
                const sz = Math.max(4, maxS * val / v.M);
                const c = x0 + slot * (k + 0.5);
                s.push('<g><title>' + data.years[v.idx[k]] + ': ' + fmt(val) + '</title>' + glyph(data.icon, c, L.pBot - sz / 2, sz) + '</g>');
                s.push('<text x="' + c + '" y="' + (L.pBot - sz - 5) + '" text-anchor="middle" font-size="12" font-weight="700" fill="' + COL.ink + '">' + fmt(val) + '</text>');
            });
        } else {
            const yOf = val => L.pBot - (val - v.B) / Math.max(1e-9, v.T - v.B) * (L.pBot - L.pTop);
            niceTicks(v.B, v.T, (L.pBot - L.pTop) > 160 ? 5 : 3).forEach(t => {
                const y = yOf(t);
                s.push('<line x1="' + x0 + '" y1="' + y + '" x2="' + x1 + '" y2="' + y + '" stroke="' + COL.grid + '"/>');
                s.push('<text x="' + (x0 - 6) + '" y="' + (y + 4) + '" text-anchor="end" font-size="11" fill="' + COL.muted + '">' + fmt(t) + '</text>');
            });
            v.vals.forEach((val, k) => {
                const c = cx(k), left = c - bw / 2;
                const yr = data.years[v.idx[k]];
                if (val <= v.B) {
                    s.push('<path d="M' + (c - 5) + ' ' + (L.pBot - 9) + ' h10 l-5 7z" fill="' + COL.bar + '" opacity=".75"><title>' + yr + ': ' + fmt(val) + ' (below the axis start)</title></path>');
                    return;
                }
                const top = Math.max(L.pTop, yOf(Math.min(val, v.T)));
                let fill = COL.bar;
                if (stack) {
                    const pid = uid + 'p' + k;
                    defs.push('<pattern id="' + pid + '" patternUnits="userSpaceOnUse" x="' + left + '" y="' + L.pBot + '" width="' + bw + '" height="' + bw + '"><rect width="' + bw + '" height="' + bw + '" fill="#cfe8d6"/>' + glyph(data.icon, bw / 2, bw / 2, bw * 0.82) + '</pattern>');
                    fill = 'url(#' + pid + ')';
                }
                s.push('<rect x="' + left + '" y="' + top + '" width="' + bw + '" height="' + Math.max(0, L.pBot - top) + '" fill="' + fill + '" stroke="' + COL.ink + '" stroke-width="1.5"><title>' + yr + ': ' + fmt(val) + '</title></rect>');
                if (val > v.T) s.push('<path d="M' + left + ' ' + (L.pTop + 4) + ' l' + bw / 4 + ' -4 l' + bw / 4 + ' 4 l' + bw / 4 + ' -4 l' + bw / 4 + ' 4" fill="none" stroke="' + COL.ink + '" stroke-width="2"/>');
            });
            s.push('<line x1="' + x0 + '" y1="' + L.pTop + '" x2="' + x0 + '" y2="' + L.pBot + '" stroke="' + COL.ink + '" stroke-width="2"/>');
            s.push('<line x1="' + x0 + '" y1="' + L.pBot + '" x2="' + x1 + '" y2="' + L.pBot + '" stroke="' + COL.ink + '" stroke-width="2"/>');

            if (overlay) {
                const [B2, T2] = rightAxis(v);
                const y2 = val => L.pBot - (val - B2) / Math.max(1e-9, T2 - B2) * (L.pBot - L.pTop);
                niceTicks(B2, T2, 4).forEach(t => {
                    s.push('<text x="' + (x1 + 6) + '" y="' + (y2(t) + 4) + '" font-size="11" fill="' + COL.line2 + '">' + fmt(t) + '</text>');
                });
                s.push('<line x1="' + x1 + '" y1="' + L.pTop + '" x2="' + x1 + '" y2="' + L.pBot + '" stroke="' + COL.line2 + '" stroke-width="2"/>');
                const pts = v.vals2.map((val, k) => cx(k).toFixed(1) + ',' + y2(val).toFixed(1));
                s.push('<g clip-path="url(#' + uid + 'clip)"><polyline points="' + pts.join(' ') + '" fill="none" stroke="' + COL.line2 + '" stroke-width="3" stroke-linejoin="round"/>');
                v.vals2.forEach((val, k) => s.push('<circle cx="' + cx(k) + '" cy="' + y2(val) + '" r="4" fill="' + COL.line2 + '" stroke="#fff" stroke-width="1.5"><title>' + data.years[v.idx[k]] + ': ' + fmt(val) + '</title></circle>'));
                s.push('</g>');
                s.push('<g font-size="11" font-weight="700"><rect x="' + x0 + '" y="4" width="10" height="10" fill="' + COL.bar + '" stroke="' + COL.ink + '"/><text x="' + (x0 + 14) + '" y="13" fill="' + COL.ink + '">' + esc(data.subject) + ' (left)</text>'
                    + '<circle cx="' + (x1 - 150) + '" cy="9" r="5" fill="' + COL.line2 + '"/><text x="' + (x1 - 141) + '" y="13" fill="' + COL.line2 + '">' + esc(data.subject2) + ' (right)</text></g>');
            }
            if (split) {
                const mx2 = Math.max(...v.vals2);
                const ticks = niceTicks(0, mx2 * 1.2, 3);
                const T2 = Math.max(ticks[ticks.length - 1], mx2 * 1.05);
                const y2 = val => L.p2Bot - val / T2 * (L.p2Bot - L.p2Top);
                s.push('<text x="' + x0 + '" y="' + (L.p2Top - 9) + '" font-size="12" font-weight="700" fill="' + COL.line2 + '">' + esc(data.title2) + ' (' + esc(data.unit2) + ')</text>');
                ticks.forEach(t => {
                    s.push('<line x1="' + x0 + '" y1="' + y2(t) + '" x2="' + x1 + '" y2="' + y2(t) + '" stroke="' + COL.grid + '"/>');
                    s.push('<text x="' + (x0 - 6) + '" y="' + (y2(t) + 4) + '" text-anchor="end" font-size="11" fill="' + COL.muted + '">' + fmt(t) + '</text>');
                });
                s.push('<line x1="' + x0 + '" y1="' + L.p2Top + '" x2="' + x0 + '" y2="' + L.p2Bot + '" stroke="' + COL.ink + '" stroke-width="2"/>');
                s.push('<line x1="' + x0 + '" y1="' + L.p2Bot + '" x2="' + x1 + '" y2="' + L.p2Bot + '" stroke="' + COL.ink + '" stroke-width="2"/>');
                const pts = v.vals2.map((val, k) => cx(k).toFixed(1) + ',' + y2(val).toFixed(1));
                s.push('<polyline points="' + pts.join(' ') + '" fill="none" stroke="' + COL.line2 + '" stroke-width="3" stroke-linejoin="round"/>');
                v.vals2.forEach((val, k) => s.push('<circle cx="' + cx(k) + '" cy="' + y2(val) + '" r="4" fill="' + COL.line2 + '" stroke="#fff" stroke-width="1.5"><title>' + data.years[v.idx[k]] + ': ' + fmt(val) + '</title></circle>'));
            }
        }

        // year labels along the bottom, thinned when crowded
        const yLab = (split ? L.p2Bot : L.pBot) + 17;
        let lastX = -Infinity;
        v.idx.forEach((i, k) => {
            const c = area ? x0 + (x1 - x0) / cnt * (k + 0.5) : cx(k);
            if (c - lastX < 36) return;
            lastX = c;
            s.push('<text x="' + c + '" y="' + yLab + '" text-anchor="middle" font-size="11" fill="' + COL.ink + '">' + data.years[i] + '</text>');
        });

        return '<svg class="cf-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + W + ' ' + H + '" width="' + W + '" height="' + H + '"><defs>' + defs.join('') + '</defs>' + s.join('') + '</svg>';
    }

    // Ruler position (0 bottom … 1 top) ↔ axis ratio (0 … RULER_MAX). The
    // lower half is 0 … tallest bar, the upper half stretches up to ×12.
    const rulerPos = r => (r <= 1 ? 0.5 * Math.max(0, r) : 0.5 + 0.5 * Math.sqrt(Math.min(1, (r - 1) / (RULER_MAX - 1))));
    const rulerRatio = p => (p <= 0.5 ? 2 * Math.max(0, p) : 1 + (RULER_MAX - 1) * Math.pow((Math.min(1, p) - 0.5) / 0.5, 2));

    // ------------------------------------------------------------------
    // DOM
    // ------------------------------------------------------------------

    function mount(container, data, api) {
        const el = Rift.el;
        const sfx = name => { try { if (api && api.sfx) api.sfx(name); } catch (e) { /* sound is optional */ } };
        const uid = 'cf' + Math.floor((api && api.rng ? api.rng.next() : Math.random()) * 1e9).toString(36);
        const n = data.years.length;
        const st = JSON.parse(JSON.stringify(data.start));
        let reading = null, done = false;

        // ---- top strip ----
        const k = data.distortions.length;
        const top = el('div.cf-top', null, [
            el('span.chip', { dataset: { colour: 'perception' }, text: Rift.COLOURS.perception.icon + ' Chart Fixer' }),
            el('span.cf-piece', { text: 'the numbers are true' }),
            el('span.cf-piece', { text: 'the picture lies' }),
            el('span.cf-piece', { text: 'fix it, then read it' }),
            el('span.cf-spacer'),
            el('span.cf-count', { text: '🔍 ' + k + (k === 1 ? ' trick' : ' tricks') + ' hidden' }),
        ]);

        // ---- the chart board ----
        const headText = el('span.cf-htext', { text: data.headline });
        const headline = el('div.cf-headline', null, [el('span.cf-tag', { text: '#TRENDING' }), headText]);
        const titleEl = el('div.cf-title', { text: data.title });
        const subEl = el('div.cf-sub');
        const rTrack = el('div.cf-rtrack');
        const rFill = el('div.cf-rfill');
        const rZero = el('div.cf-rmark.zero', null, [el('span', { text: '0' })]);
        const rMax = el('div.cf-rmark.max', null, [el('span', { text: 'max' })]);
        const knobLo = el('div.cf-knob.lo', { title: 'Where the axis starts', tabIndex: 0 });
        const knobHi = el('div.cf-knob.hi', { title: 'Where the axis ends', tabIndex: 0 });
        rTrack.append(rFill, rZero, rMax, knobLo, knobHi);
        const ruler = el('div.cf-ruler', { title: 'Axis ruler: drag the knobs' }, [el('div.cf-rcap', { text: 'axis' }), rTrack]);
        const plot = el('div.cf-plot');
        const plotRow = el('div.cf-plotrow', null, [ruler, plot]);

        const wTrack = el('div.cf-wtrack');
        const wFill = el('div.cf-wfill');
        wTrack.appendChild(wFill);
        data.years.forEach((y, i) => wTrack.appendChild(el('span.cf-wdot', { style: { left: (i / (n - 1) * 100) + '%' }, title: String(y) })));
        const wKnobA = el('div.cf-wknob.a', { tabIndex: 0, title: 'First year shown' }, [el('span.cf-wlabel')]);
        const wKnobB = el('div.cf-wknob.b', { tabIndex: 0, title: 'Last year shown' }, [el('span.cf-wlabel')]);
        wTrack.append(wKnobA, wKnobB);
        const windowEl = el('div.cf-window', null, [el('span.cf-wcap', { text: 'years shown' }), wTrack]);
        const foot = el('div.cf-foot');
        const stamp = el('div.cf-stamp', { text: 'HONEST' });

        const canvas = el('div.cf-canvas', null, [headline, el('div.cf-titlebar', null, [titleEl, subEl]), plotRow, windowEl, foot, stamp]);
        const board = el('div.cf-board', null, [canvas]);
        const A = Rift.Assets;
        if (A && A.has && A.has('ui/chart-easel')) {
            board.classList.add('cf-has-easel');
            board.insertBefore(A.img('ui/chart-easel', { className: 'cf-easel-art' }), canvas);
        }

        // ---- tools ----
        const toggles = [];
        function toggle(key, label, a, b) {
            const btnA = el('button.cf-seg', { text: a[1], onclick: () => setToggle(key, a[0]) });
            const btnB = el('button.cf-seg', { text: b[1], onclick: () => setToggle(key, b[0]) });
            toggles.push({ key, opts: [[a[0], btnA], [b[0], btnB]] });
            return el('div.cf-tog', null, [el('div.cf-toglabel', { text: label }), el('div.cf-segs', null, [btnA, btnB])]);
        }
        const toolEls = [];
        if (data.uneven) toolEls.push(toggle('spacing', 'Gaps between the years', ['even', 'All the same'], ['true', 'True to the calendar']));
        if (data.hasCum) toolEls.push(toggle('cumulative', 'Each bar shows', [true, 'Total so far'], [false, 'That year only']));
        if (data.pop) toolEls.push(toggle('perCapita', 'Count', [false, 'All villagers together'], [true, 'Per villager']));
        if (data.raw2) toolEls.push(toggle('dual', 'Two series', ['overlay', 'One chart, two axes'], ['split', 'Separate charts']));
        if (data.picto) toolEls.push(toggle('picto', 'Pictures', ['area', 'Grow the picture'], ['stack', 'Stack the pictures']));
        const tools = el('div.cf-section', null, [
            el('div.cf-sidehead', { text: 'Fix the picture' }),
            el('div.cf-note', { text: 'Drag the brass knobs on the axis ruler and the years slider.' + (toolEls.length ? ' Not every switch is a trick.' : '') }),
            ...toolEls,
        ]);

        const optBtns = data.reading.options.map((text, i) => el('button.cf-opt', { text, onclick: () => { if (done) return; reading = i; sfx('click'); render(); } }));
        const readBox = el('div.cf-section', null, [
            el('div.cf-sidehead', { text: 'Then read it' }),
            el('div.cf-q', { text: data.reading.question }),
            ...optBtns,
        ]);
        const statusEl = el('div.cf-status', { role: 'status', tabindex: '0', 'aria-label': 'Chart feedback' });
        const submitBtn = el('button.btn.gold.cf-submit', { text: '✓ This chart is honest', onclick: () => submit() });
        const side = el('div.cf-side', null, [
            el('div.cf-controls', null, [tools, readBox]),
            el('div.cf-actions', null, [statusEl, submitBtn]),
        ]);

        const main = el('div.cf-main', null, [board, side]);
        const rootEl = el('div.cf-root', null, [top, main]);
        try { if (root.getComputedStyle(container).position === 'static') container.style.position = 'relative'; } catch (e) { /* ignore */ }
        container.appendChild(rootEl);

        function setStatus(text, tone) {
            statusEl.textContent = text || '';
            statusEl.className = 'cf-status' + (tone ? ' ' + tone : '');
        }

        function setToggle(key, value) {
            if (done || st[key] === value) return;
            st[key] = value;
            sfx('click');
            setStatus('');
            render();
        }

        // ---- render ----
        function subtitle() {
            const what = data.pop && st.perCapita ? data.pcLabel : data.unit;
            return data.hasCum && st.cumulative ? 'total ' + what : what + (data.hasCum || data.pop ? ' each year' : '');
        }

        function render() {
            const area = data.picto && st.picto === 'area';
            rootEl.classList.toggle('solved', done);
            headline.classList.toggle('struck', done);
            subEl.textContent = subtitle();

            const W = Math.max(240, Math.floor(plot.clientWidth || 600));
            const H = Math.max(160, Math.floor(plot.clientHeight || 300));
            plot.innerHTML = chartSvg(data, st, W, H, uid);
            const L = layoutOf(data, st, W, H);

            // ruler
            ruler.classList.toggle('off', area);
            ruler.title = area ? 'A picture chart has no axis: there is nothing to adjust here.' : 'Axis ruler: drag the knobs';
            rTrack.style.top = L.pTop + 'px';
            rTrack.style.bottom = (H - L.pBot) + 'px';
            const pLo = rulerPos(st.baseline), pHi = rulerPos(st.top);
            knobLo.style.bottom = (pLo * 100) + '%';
            knobHi.style.bottom = (pHi * 100) + '%';
            rFill.style.bottom = (pLo * 100) + '%';
            rFill.style.top = ((1 - pHi) * 100) + '%';
            rMax.style.bottom = '50%';
            const v = view(data, st);
            knobLo.title = 'The axis starts at ' + fmt(v.B);
            knobHi.title = 'The axis ends at ' + fmt(v.T);

            // years window
            windowEl.style.marginLeft = (ruler.offsetWidth + L.ml) + 'px';
            windowEl.style.marginRight = L.mr + 'px';
            const fa = st.window[0] / (n - 1) * 100, fb = st.window[1] / (n - 1) * 100;
            wKnobA.style.left = fa + '%';
            wKnobB.style.left = fb + '%';
            wFill.style.left = fa + '%';
            wFill.style.width = (fb - fa) + '%';
            wKnobA.firstChild.textContent = data.years[st.window[0]];
            wKnobB.firstChild.textContent = data.years[st.window[1]];

            // small print
            const bits = [];
            if (data.pop) bits.push('Tomorrowton had ' + fmt(data.pop[0]) + ' villagers in ' + data.years[0] + ' and ' + fmt(data.pop[n - 1]) + ' in ' + data.years[n - 1] + '.');
            if (data.uneven) bits.push('Records were only kept in some years.');
            bits.push('Source: Tomorrowton Gazette archives.');
            foot.textContent = 'Small print: ' + bits.join(' ');

            toggles.forEach(t => t.opts.forEach(([val, btn]) => { btn.classList.toggle('on', st[t.key] === val); btn.disabled = done; }));
            optBtns.forEach((b, i) => { b.classList.toggle('sel', reading === i); b.disabled = done; });
            submitBtn.disabled = done || reading == null;
            submitBtn.title = reading == null ? 'Choose what the honest chart shows first' : '';
        }

        // ---- dragging ----
        function rulerPick(ev) {
            const br = rTrack.getBoundingClientRect();
            return 1 - (ev.clientY - br.top) / Math.max(1, br.height);
        }
        function setRuler(which, p) {
            const r = rulerRatio(p);
            if (which === 'lo') {
                let b = Math.min(r, 0.98, st.top - 0.08);
                if (b < 0.03) b = 0;
                st.baseline = Math.max(0, b);
            } else {
                st.top = Math.min(RULER_MAX, Math.max(r, st.baseline + 0.08, 0.3));
            }
            render();
        }
        function winPick(ev) {
            const br = wTrack.getBoundingClientRect();
            return Math.round(Math.max(0, Math.min(1, (ev.clientX - br.left) / Math.max(1, br.width))) * (n - 1));
        }
        function setWin(which, i) {
            if (which === 'a') st.window[0] = Math.max(0, Math.min(i, st.window[1] - (MIN_WINDOW - 1)));
            else st.window[1] = Math.min(n - 1, Math.max(i, st.window[0] + (MIN_WINDOW - 1)));
            render();
        }

        let drag = null;
        function startDrag(ev, kind, which, target) {
            if (done || ev.button > 0) return;
            drag = { kind, which, before: JSON.stringify(st) };
            try { target.setPointerCapture(ev.pointerId); } catch (e) { /* ok */ }
            ev.preventDefault();
            moveDrag(ev);
        }
        function moveDrag(ev) {
            if (!drag) return;
            if (drag.kind === 'ruler') setRuler(drag.which, rulerPick(ev));
            else setWin(drag.which, winPick(ev));
        }
        function endDrag() {
            if (!drag) return;
            const changed = drag.before !== JSON.stringify(st);
            drag = null;
            if (changed) { sfx('place'); setStatus(''); }
        }

        ruler.addEventListener('pointerdown', ev => {
            if (ruler.classList.contains('off')) return;
            let which = ev.target === knobLo ? 'lo' : ev.target === knobHi ? 'hi' : null;
            if (!which) {
                const p = rulerPick(ev);
                which = Math.abs(p - rulerPos(st.baseline)) <= Math.abs(p - rulerPos(st.top)) ? 'lo' : 'hi';
            }
            startDrag(ev, 'ruler', which, ruler);
        });
        windowEl.addEventListener('pointerdown', ev => {
            const t = ev.target.closest ? ev.target.closest('.cf-wknob') : null;
            let which = t === wKnobA ? 'a' : t === wKnobB ? 'b' : null;
            if (!which) {
                const i = winPick(ev);
                which = Math.abs(i - st.window[0]) < Math.abs(i - st.window[1]) || (i < st.window[0]) ? 'a' : 'b';
            }
            startDrag(ev, 'window', which, windowEl);
        });
        [ruler, windowEl].forEach(node => {
            node.addEventListener('pointermove', moveDrag);
            node.addEventListener('pointerup', endDrag);
            node.addEventListener('pointercancel', endDrag);
        });

        // keyboard nudges for the knobs
        function nudge(fn) { return ev => {
            const dir = { ArrowUp: 1, ArrowRight: 1, ArrowDown: -1, ArrowLeft: -1 }[ev.key];
            if (!dir || done) return;
            ev.preventDefault();
            fn(dir);
            sfx('click');
        }; }
        knobLo.addEventListener('keydown', nudge(d => setRuler('lo', rulerPos(st.baseline) + d * 0.02)));
        knobHi.addEventListener('keydown', nudge(d => setRuler('hi', rulerPos(st.top) + d * 0.02)));
        wKnobA.addEventListener('keydown', nudge(d => setWin('a', st.window[0] + d)));
        wKnobB.addEventListener('keydown', nudge(d => setWin('b', st.window[1] + d)));

        // ---- submit ----
        function submit() {
            if (done || reading == null) return;
            const fixes = { baseline: st.baseline, top: st.top, window: st.window.slice() };
            ['spacing', 'cumulative', 'perCapita', 'dual', 'picto'].forEach(key => { if (key in st) fixes[key] = st[key]; });
            let r = null;
            try { r = api && api.submit ? api.submit({ fixes, reading }) : null; } catch (e) { console.error('[chart-fixer]', e); }
            const show = res => {
                if (!res) return;
                if (res.solved) {
                    done = true;
                    sfx('success');
                    setStatus(res.feedback, 'good');
                } else {
                    sfx('error');
                    setStatus(res.feedback, 'bad');
                }
                render();
            };
            if (r && typeof r.then === 'function') r.then(show, () => {}); else show(r);
        }

        let ro = null;
        const redraw = () => render();
        if (root.ResizeObserver) { ro = new root.ResizeObserver(redraw); ro.observe(plot); }
        else root.addEventListener('resize', redraw);

        render();
        if (root.requestAnimationFrame) root.requestAnimationFrame(redraw);
        setStatus('Every number in this chart is true. Change how it is drawn until the picture is honest.');
        try { if (api && api.say) api.say('My chart is TRUE: every number is real! "' + data.headline + '" Prove me wrong.'); } catch (e) { /* speech is optional */ }

        return {
            destroy() {
                if (ro) ro.disconnect(); else root.removeEventListener('resize', redraw);
                if (rootEl.parentNode) rootEl.parentNode.removeChild(rootEl);
            },
        };
    }

    // ------------------------------------------------------------------

    const def = {
        id: 'chart-fixer',
        rules: [
            "Inspect the graph and its headline, then make the view fair.",
            "Drag the axis handles and visible-window handles; the arrow keys also move focused handles.",
            "Read the switches. Some reveal a trick; others were honest already.",
            "Fix the distortions, choose what the data actually says, then submit. Changing the view does not change the data.",
            "How to play is free. The Hint button shows its heart cost. Think first, then check your answer."
        ],
        tutorial: [
            {
                "text": "We want a fair chart. Compare the headline with the actual values.",
                "highlight": ".cf-titlebar"
            },
            {
                "text": "Move the axis handles. Example: bars of 95 and 100 look very different if the axis starts at 90; the increase is only 5.",
                "highlight": ".cf-ruler"
            },
            {
                "text": "The visible window can hide inconvenient values. Use its handles to check the full picture when the task needs it.",
                "highlight": ".cf-window"
            },
            {
                "text": "Read each switch before changing it. Not every switch is a trick: keep the honest controls honest.",
                "highlight": ".cf-side"
            },
            {
                "text": "Choose the claim the corrected data supports, then submit. Fixing a chart means both its view and its conclusion are fair. How to play is free. The Hint button shows its heart cost. Think first, then check your answer.",
                "highlight": ".cf-q"
            }
        ],
        name: 'Chart Fixer',
        colour: 'perception',
        family: 'Seeing vs knowing',
        blurb: 'The Algorithm drew a chart. Every number is true, but the picture lies. Fix the picture, then say what it really shows.',
        tok: 'The data did not change, only the picture did: seeing is not knowing, so ask how a chart was made before you believe what it shows.',

        generate,
        check,
        hints: hintsFor,
        why: whyFor,
        solve: solveFor,
        mount,

        internals: {
            DIST, ORDER, CLASH, ALLOWED, THEMES, CATS, TOP_MIN, TOP_MAX,
            linfit, changeOf, catStrict, catLoose, paceRatio, paceStrict, paceLoose,
            view, facets, honestState, readState, issuesOf, chartSvg, rulerPos, rulerRatio, niceTicks, fmt, clash,
        },
    };

    Rift.Puzzles.register(def);
})(typeof window !== 'undefined' ? window : globalThis);
