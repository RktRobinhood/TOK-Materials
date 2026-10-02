/*
 * The Sorting Machine: Emotion / ethics of maths (chapter 4, encounter 3).
 *
 * A Tomorrowton machine decides who gets a scarce kind of help (repair grants,
 * lantern-oil rations, tutor places) with a simple, visible rule:
 *
 *   score = wH × hardship + (household ≥ bigAt ? wBig : 0) + districtPoints[d]
 *           − wR × floor(warning notes ÷ perVisit[d])
 *   help if score ≥ T
 *
 * Every applicant also has a hidden ground truth (did they really need help?),
 * revealed by the "home-visit audit". The player:
 *   1. audits the machine (stamps vs truth: a confusion matrix and per-district
 *      missed rates),
 *   2. names what is wrong (one flaw per puzzle):
 *        'biased-data' one district was inspected 3× as often, so its villagers
 *                      collect more warning notes; the notes measure the
 *                      inspections, not the villagers,
 *        'proxy'       district points copied from last year's grant list: where
 *                      you live stands in for who was helped before,
 *        'threshold'   the cut-off was tuned for "accuracy"; the districts are
 *                      treated alike but too many needy villagers are missed,
 *      (distractors: 'accurate', 'data-is-truth', 'base-rate'),
 *   3. picks one fix. Each fix's outcome is recomputed; it must meet the stated
 *      criteria: grants ≤ budget, at least minHelp needy villagers helped, and
 *      no two districts' missed rates more than maxGap apart. Several fixes
 *      can pass; there is no perfect answer (each trades one error for another),
 *   4. (difficulty 3) says which value the chosen fix put first.
 *
 * Answer: { flaw: id, fix: id, value?: index into data.values }.
 * check() recomputes every outcome from data; nothing reported by the UI is used.
 */
(function (root) {
    'use strict';

    const Rift = root.Rift;

    const SETTINGS = {
        1: { n: 12, maxGap: 0.34, slack: 2, missFrac: 0.3, minPass: 2, fixCount: 4 },
        2: { n: 15, maxGap: 0.30, slack: 1, missFrac: 0.25, minPass: 2, fixCount: 5 },
        3: { n: 18, maxGap: 0.25, slack: 1, missFrac: 0.2, minPass: 1, fixCount: 5 },
    };
    const EPS = 1e-9;

    const THEMES = [
        { id: 'repair', title: 'Roof-repair grants', machine: 'the Grant-o-Matic', grant: 'grant', grants: 'grants',
            need: 'Storm damage', needIcon: '🔨' },
        { id: 'oil', title: 'Lantern-oil rations', machine: 'the Ration Engine', grant: 'ration', grants: 'rations',
            need: 'Dark hours', needIcon: '🕯️' },
        { id: 'school', title: 'Extra help at school', machine: 'the Tutor Sorter', grant: 'tutor place', grants: 'tutor places',
            need: 'Missed lessons', needIcon: '📚' },
    ];

    const DISTRICTS = [
        { name: 'Lantern Row', hue: '#F2B632' },
        { name: 'Millbrook', hue: '#3FE0D0' },
        { name: 'Hilltop', hue: '#E85BC8' },
        { name: 'Cogwheel Lane', hue: '#A05CF0' },
        { name: 'Puddleby', hue: '#3D7BFF' },
        { name: 'Fernhollow', hue: '#2FBF71' },
    ];

    const FIRST = ['Bramble', 'Pip', 'Odette', 'Wren', 'Tobias', 'Marigold', 'Fennick', 'Hazel', 'Barnaby', 'Clover', 'Rook', 'Juniper',
        'Basil', 'Tansy', 'Otis', 'Willa', 'Crispin', 'Nettle', 'Moss', 'Sorrel', 'Quill', 'Dot', 'Alder', 'Poppy'];
    const LAST = ['Thistlewick', 'Mossfoot', 'Quillfeather', 'Puddlejump', 'Burrowes', 'Ashwhisker', 'Lanternby', 'Cogsworth',
        'Fernsby', 'Inkwell', 'Dewhollow', 'Brightpaw'];
    const GLYPHS = ['🦉', '🦊', '🐸', '🦔', '🐭', '🐇', '🦡', '🐿️', '🦆', '🐌', '🦝', '🐢'];

    const VALUES = [
        { id: 'need', text: 'Catch every needy villager, even if some help goes to villagers who did not need it.' },
        { id: 'thrift', text: 'Never waste help: refuse when unsure, even if some needy villagers are missed.' },
        { id: 'same', text: 'Judge everyone by the same yardstick, using only information we can trust.' },
        { id: 'equal', text: "Make the districts' results equal, even if that means different rules for different districts." },
    ];

    const FIX_SETS = {
        'biased-data': ['drop-reports', 'per-visit', 'threshold-down', 'bonus', 'threshold-up'],
        proxy: ['drop-district', 'threshold-down', 'bonus', 'drop-reports', 'threshold-up'],
        threshold: ['threshold-down', 'threshold-down-2', 'threshold-down-3', 'threshold-up', 'drop-reports'],
    };

    // ------------------------------------------------------------------
    // The machine (pure)
    // ------------------------------------------------------------------

    function applyFix(rule, fix) {
        const out = JSON.parse(JSON.stringify(rule));
        if (fix && fix.change) Object.keys(fix.change).forEach(k => { out[k] = JSON.parse(JSON.stringify(fix.change[k])); });
        return out;
    }

    function notesCounted(rule, a) {
        return Math.floor(a.notes / (rule.perVisit[a.district] || 1));
    }

    function scoreOf(rule, a) {
        return rule.wH * a.hardship
            + (a.household >= rule.bigAt ? rule.wBig : 0)
            + rule.points[a.district]
            - rule.wR * notesCounted(rule, a);
    }

    // Everything the audit shows, recomputed from scratch for a rule.
    function outcomes(data, rule) {
        const nd = data.districts.length;
        const byDistrict = [];
        for (let d = 0; d < nd; d++) byDistrict.push({ n: 0, needy: 0, helped: 0, tp: 0, fp: 0, fn: 0, tn: 0, missedRate: 0 });
        const scores = [];
        const decisions = [];
        let tp = 0, fp = 0, fn = 0, tn = 0;
        data.applicants.forEach(a => {
            const s = scoreOf(rule, a);
            const yes = s >= rule.T;
            scores.push(s);
            decisions.push(yes);
            const D = byDistrict[a.district];
            D.n++;
            if (a.needed) D.needy++;
            if (yes) D.helped++;
            if (yes && a.needed) { tp++; D.tp++; }
            else if (yes) { fp++; D.fp++; }
            else if (a.needed) { fn++; D.fn++; }
            else { tn++; D.tn++; }
        });
        const rates = [];
        byDistrict.forEach(D => { D.missedRate = D.needy ? D.fn / D.needy : 0; if (D.needy) rates.push(D.missedRate); });
        const gap = rates.length ? Math.max(...rates) - Math.min(...rates) : 0;
        const helped = tp + fp;
        const c = data.criteria;
        const crit = {
            budget: helped <= c.budget,
            coverage: tp >= c.minHelp,
            fair: gap <= c.maxGap + EPS,
        };
        return {
            scores, decisions, tp, fp, fn, tn, helped,
            needy: tp + fn,
            accuracy: data.applicants.length ? (tp + tn) / data.applicants.length : 0,
            byDistrict, gap, crit,
            ok: crit.budget && crit.coverage && crit.fair,
        };
    }

    function fixById(data, id) { return data.fixes.find(f => f.id === id) || null; }
    function fixOutcome(data, fix) { return outcomes(data, applyFix(data.rule, fix)); }

    // ------------------------------------------------------------------
    // Generation
    // ------------------------------------------------------------------

    function weightedInt(rng, table) {
        return Number(rng.weighted(table));
    }

    function makeApplicants(rng, s, flaw, roles) {
        const per = s.n / 3;
        const list = [];
        for (let d = 0; d < 3; d++) {
            const k = Math.max(2, rng.int(Math.floor(per * 0.4), Math.ceil(per * 0.6)));
            for (let j = 0; j < per; j++) {
                const needed = j < k;
                const hardship = needed ? weightedInt(rng, { 5: 1, 4: 3, 3: 4, 2: 2 }) : weightedInt(rng, { 0: 2, 1: 4, 2: 4, 3: 1 });
                const household = rng.chance(needed ? 0.55 : 0.3) ? rng.int(4, 6) : rng.int(1, 3);
                const notes = flaw === 'biased-data' && d === roles.target
                    ? weightedInt(rng, { 0: 2, 1: 4, 2: 3, 3: 1 })
                    : weightedInt(rng, { 0: 7, 1: 2, 2: 0.3 });
                const helpedLastYear = rng.chance(flaw === 'proxy' ? (d === roles.favoured ? 0.75 : d === roles.target ? 0.1 : 0.35) : 0.35);
                list.push({ district: d, needed, hardship, household, notes, helpedLastYear });
            }
        }
        const names = rng.shuffle(FIRST).slice(0, list.length);
        const lasts = rng.shuffle(LAST);
        return rng.shuffle(list).map((a, i) => Object.assign({
            id: 'a' + i,
            name: names[i] + ' ' + lasts[i % lasts.length],
            glyph: GLYPHS[rng.int(0, GLYPHS.length - 1)],
        }, a));
    }

    function makeFix(id, rule, roles, districts, theme, visitsMult) {
        const T = rule.T;
        switch (id) {
            case 'drop-reports': return { id, value: 'same', label: 'Ignore warning notes',
                text: 'Stop counting warning notes at all.', change: { wR: 0 } };
            case 'per-visit': return { id, value: 'same', label: 'Count notes per visit',
                text: 'Divide each district\'s warning notes by how often inspectors went there.', change: { perVisit: visitsMult.slice() } };
            case 'drop-district': return { id, value: 'same', label: 'Remove district points',
                text: 'Where you live gives no points, plus or minus.', change: { points: [0, 0, 0] } };
            case 'threshold-down': return { id, value: 'need', label: 'Lower the cut-off to ' + (T - 1),
                text: 'Help anyone scoring ' + (T - 1) + ' or more.', change: { T: T - 1 } };
            case 'threshold-down-2': return { id, value: 'need', label: 'Lower the cut-off to ' + (T - 2),
                text: 'Help anyone scoring ' + (T - 2) + ' or more.', change: { T: T - 2 } };
            case 'threshold-down-3': return { id, value: 'need', label: 'Lower the cut-off to ' + (T - 3),
                text: 'Help anyone scoring ' + (T - 3) + ' or more.', change: { T: T - 3 } };
            case 'threshold-up': return { id, value: 'thrift', label: 'Raise the cut-off to ' + (T + 1),
                text: 'Only help anyone scoring ' + (T + 1) + ' or more.', change: { T: T + 1 } };
            case 'bonus': {
                const points = rule.points.slice();
                points[roles.target] += 2;
                return { id, value: 'equal', label: 'Give ' + districts[roles.target].name + ' +2 points',
                    text: 'A bonus for the district that is missed most, to even things out.', change: { points } };
            }
        }
        throw new Error('unknown fix ' + id);
    }

    function flawOptionsFor(data, rng) {
        const t = data.districts[data.roles.target].name;
        const mostNotes = mostNotesDistrict(data);
        const real = {
            'biased-data': 'Inspectors went to ' + data.districts[mostNotes].name + ' far more often, so its villagers collect more warning notes. The notes measure the inspections, not the villagers.',
            proxy: 'The district points were copied from last year\'s grant list, so where you live stands in for who was helped before.',
            threshold: 'The districts are treated alike, but the cut-off is too strict: too many needy villagers are missed everywhere.',
        };
        const distract = {
            accurate: 'Nothing is wrong: the machine is ' + Math.round(outcomes(data, data.rule).accuracy * 100) + '% accurate, so it must be fair.',
            'data-is-truth': data.districts[mostNotes].name + ' has the most warning notes, so its villagers really are riskier. Numbers don\'t lie.',
            'base-rate': t + ' simply has more needy villagers, so of course more of them are missed. Nothing to fix.',
        };
        const pickD = rng.pick(Object.keys(distract));
        const opts = Object.keys(real).map(id => ({ id, text: real[id] })).concat([{ id: pickD, text: distract[pickD] }]);
        return rng.shuffle(opts);
    }

    function mostNotesDistrict(data) {
        const sum = [0, 0, 0], cnt = [0, 0, 0];
        data.applicants.forEach(a => { sum[a.district] += a.notes; cnt[a.district]++; });
        let best = 0;
        for (let d = 1; d < 3; d++) if (sum[d] / cnt[d] > sum[best] / cnt[best]) best = d;
        return best;
    }

    function worstDistrict(out) {
        let best = -1;
        out.byDistrict.forEach((D, d) => { if (D.needy && (best < 0 || D.missedRate > out.byDistrict[best].missedRate)) best = d; });
        return best;
    }

    // One attempt; returns null when the instance does not teach cleanly.
    function attempt(rng, d, flaw, theme, districts) {
        const s = SETTINGS[d];
        const target = rng.int(0, 2);
        const favoured = (target + rng.int(1, 2)) % 3;
        const roles = { target, favoured: flaw === 'proxy' ? favoured : null };
        const applicants = makeApplicants(rng, s, flaw, roles);
        const v = rng.int(8, 14);
        const visits = [v, v, v];
        if (flaw === 'biased-data') visits[target] = 3 * v;
        const visitsMult = visits.map(x => x / v);

        const rule = { wH: 2, wBig: 1, bigAt: 4, wR: flaw === 'biased-data' ? 2 : 1, points: [0, 0, 0], T: 6, perVisit: [1, 1, 1] };
        if (flaw === 'proxy') { rule.points[favoured] = rng.pick([1, 2]); rule.points[target] = rng.pick([-2, -3]); }
        if (flaw === 'threshold') rule.T = rng.pick([8, 9]);
        else rule.T = rng.pick([6, 6, 7]);

        const needy = applicants.filter(a => a.needed).length;
        const data = {
            difficulty: d,
            theme: Object.assign({}, theme),
            districts: districts.map(x => Object.assign({}, x)),
            applicants,
            rule,
            visits,
            flaw,
            roles,
            criteria: { budget: needy + s.slack, minHelp: needy - Math.ceil(needy * s.missFrac), maxGap: s.maxGap },
        };
        data.fixes = rng.shuffle(FIX_SETS[flaw].slice(0, s.fixCount)).map(id => makeFix(id, rule, roles, districts, theme, visitsMult));

        const base = outcomes(data, rule);
        if (flaw === 'threshold') {
            if (!(base.crit.fair && base.crit.budget && !base.crit.coverage)) return null;
            // strict, not absurd: it still helps some needy villagers in every district
            if (base.byDistrict.some(x => x.tp < 1)) return null;
        } else {
            if (base.crit.fair) return null;
            const w = worstDistrict(base);
            if (w !== target) return null;
            // the worst district must stand out alone
            if (base.byDistrict.some((D, k) => k !== target && D.needy && D.missedRate >= base.byDistrict[target].missedRate - EPS)) return null;
            if (flaw === 'biased-data' && mostNotesDistrict(data) !== target) return null;
        }
        const passing = data.fixes.filter(f => fixOutcome(data, f).ok);
        if (passing.length < s.minPass || passing.length === data.fixes.length) return null;
        if (d >= 3 && new Set(passing.map(f => f.value)).size < Math.min(2, passing.length)) return null;

        data.flawOptions = flawOptionsFor(data, rng);
        data.values = rng.shuffle(VALUES.map(x => Object.assign({}, x)));
        data.whyShuffle = rng.int(1, 1e6);
        return data;
    }

    function generate(rng, difficulty) {
        const d = Math.max(1, Math.min(3, Math.round(Number(difficulty) || 1)));
        const theme = rng.pick(THEMES);
        const districts = rng.shuffle(DISTRICTS).slice(0, 3);
        const flaw = rng.pick(['biased-data', 'proxy', 'threshold']);
        for (let i = 0; i < 2000; i++) {
            const data = attempt(rng, d, flaw, theme, districts);
            if (data) return data;
        }
        throw new Error('sorting: could not generate a puzzle');
    }

    // ------------------------------------------------------------------
    // Hints, why, solve, check
    // ------------------------------------------------------------------

    function pct(x) { return Math.round(x * 100) + '%'; }

    function critFailText(data, out) {
        const c = data.criteria;
        const bits = [];
        if (!out.crit.budget) bits.push('it hands out ' + out.helped + ' ' + data.theme.grants + ' but the budget is ' + c.budget);
        if (!out.crit.coverage) bits.push('only ' + out.tp + ' needy villagers are helped (at least ' + c.minHelp + ' must be)');
        if (!out.crit.fair) bits.push('the districts\' missed rates are ' + Math.round(out.gap * 100) + ' points apart (at most ' + Math.round(c.maxGap * 100) + ' allowed)');
        return bits.join('; ');
    }

    function wrongFlawFeedback(data, id) {
        const t = data.districts[data.roles.target].name;
        switch (id) {
            case 'accurate': return 'Accuracy adds all the mistakes together. Look at who the mistakes fall on: check the district bars.';
            case 'data-is-truth': return 'Check the inspector\'s logbook. Warning notes count what inspectors wrote down, so they also depend on where inspectors went.';
            case 'base-rate': return 'The bars already show the missed RATE (missed ÷ needy in that district), so having more needy villagers does not explain it.';
            case 'biased-data': return 'The inspector\'s logbook shows every district was visited equally often, so the warning notes are not skewed here.';
            case 'proxy': return data.rule.points.some(p => p !== 0)
                ? 'Look again at the evidence.'
                : 'This rule gives no district points at all, so the district cannot be standing in for anything here.';
            case 'threshold': return 'The cut-off is the same for everyone, yet ' + t + '\'s needy villagers are missed far more than the others. Something treats the districts differently.';
        }
        return 'That does not explain what the audit shows.';
    }

    function hintsFor(data) {
        const t = data.districts[data.roles.target].name;
        const second = {
            'biased-data': 'Compare the inspector\'s logbook with the warning-notes column. Does ' + t + ' break more rules, or was it simply checked more often?',
            proxy: 'Where did the district points come from? A district that got little help last year gets minus points this year, whatever its villagers need now.',
            threshold: 'All districts are missed about equally, so the rule is not unfair between them. Count the needy villagers refused, and the ' + data.theme.grants + ' left unused.',
        }[data.flaw];
        const pass = data.fixes.find(f => fixOutcome(data, f).ok);
        const third = 'Try the changes and watch the three goals at the top. "' + pass.label + '" meets all of them'
            + (data.difficulty >= 3 ? ', and it puts this first: ' + VALUES.find(v => v.id === pass.value).text : '.');
        return [
            'Run the audit, then look at the district bars: whose needy villagers are missed most? Then read the evidence notes.',
            second,
            third,
        ];
    }

    function whyFor(data) {
        const acc = pct(outcomes(data, data.rule).accuracy);
        const opts = [
            'Accuracy treats every mistake the same and adds them all up, so it can hide that the mistakes fall on one group, and which mistakes matter more is a human choice.',
            'It cannot be unfair: maths is neutral, so an accurate machine is a fair machine.',
            'It was only unfair because of a calculation error somewhere in the score.',
            'Anything above 50% accurate is fair; only machines below 50% are biased.',
        ];
        const order = Rift.makeRng(data.whyShuffle || 1).shuffle([0, 1, 2, 3]);
        return {
            question: 'The machine was ' + acc + ' accurate. Why can an accurate algorithm still be unfair?',
            options: order.map(i => opts[i]),
            correct: order.indexOf(0),
            explain: 'The sums were exact. But someone chose what to count (warning notes, district points), where to put the cut-off, and which mistake is worse: missing a needy villager or helping one who did not need it. Those are value choices, so maths that decides about people is never neutral.',
        };
    }

    function solveFor(data) {
        const fix = data.fixes.find(f => fixOutcome(data, f).ok);
        const answer = { flaw: data.flaw, fix: fix.id };
        if (data.difficulty >= 3) answer.value = data.values.findIndex(v => v.id === fix.value);
        return answer;
    }

    function checkAnswer(data, answer) {
        if (!data || !answer || typeof answer !== 'object') return { solved: false, partial: 0, feedback: 'Nothing to check yet.' };
        if (!data.flawOptions.some(o => o.id === answer.flaw)) {
            return { solved: false, partial: 0, feedback: 'First say what is wrong with the machine.' };
        }
        if (answer.flaw !== data.flaw) {
            return { solved: false, partial: 0.1, feedback: 'Not quite: ' + wrongFlawFeedback(data, answer.flaw) };
        }
        const fix = fixById(data, answer.fix);
        if (!fix) return { solved: false, partial: 0.3, feedback: 'You found the flaw. Now choose one change to the machine.' };
        // recompute: never trust outcomes reported by the UI
        const out = fixOutcome(data, fix);
        if (!out.ok) {
            return { solved: false, partial: 0.5, feedback: 'You found the flaw, but with "' + fix.label + '" ' + critFailText(data, out) + '. Try another change.' };
        }
        if (data.difficulty >= 3) {
            const v = Number.isInteger(answer.value) ? data.values[answer.value] : null;
            if (!v) return { solved: false, partial: 0.7, feedback: 'Your fix works. Now say which value it put first.' };
            if (v.id !== fix.value) {
                return { solved: false, partial: 0.8, feedback: 'Your fix works, but that is not what it put first. Look at what "' + fix.label + '" changes, and who gains or loses from it.' };
            }
        }
        return {
            solved: true, partial: 1,
            feedback: '"' + fix.label + '" meets all three goals: ' + out.tp + ' needy villagers helped, ' + out.fp + ' helped who did not need it, ' + out.fn + ' missed. No perfect answer, but a defensible one.',
        };
    }

    // ------------------------------------------------------------------
    // DOM
    // ------------------------------------------------------------------

    // Drawn stand-ins for ui/stamp-yes, ui/stamp-no and ui/balance-scale.
    const STAMP_YES = '<svg viewBox="0 0 60 60" aria-hidden="true"><circle cx="30" cy="30" r="25" fill="none" stroke="currentColor" stroke-width="4"/>'
        + '<circle cx="30" cy="30" r="19" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="3 3"/>'
        + '<path d="M18 31l8 8 16-18" fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    const STAMP_NO = '<svg viewBox="0 0 60 60" aria-hidden="true"><circle cx="30" cy="30" r="25" fill="none" stroke="currentColor" stroke-width="4"/>'
        + '<circle cx="30" cy="30" r="19" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="3 3"/>'
        + '<path d="M20 20l20 20M40 20L20 40" fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round"/></svg>';
    function scaleSvg(tilt) {
        return '<svg viewBox="0 0 120 80" aria-hidden="true">'
            + '<path d="M52 74h16l-4-50h-8z" fill="#9a6a10" stroke="#1A1020" stroke-width="2.5"/>'
            + '<rect x="40" y="72" width="40" height="6" rx="3" fill="#c98d14" stroke="#1A1020" stroke-width="2.5"/>'
            + '<g class="sm-beam" style="transform: rotate(' + tilt.toFixed(1) + 'deg); transform-origin: 60px 22px">'
            + '<rect x="12" y="19" width="96" height="6" rx="3" fill="#F2B632" stroke="#1A1020" stroke-width="2.5"/>'
            + '<path d="M18 25l-10 22h22zM102 25l-10 22h22z" fill="none" stroke="#1A1020" stroke-width="1.5"/>'
            + '<path d="M4 47q14 10 28 0zM88 47q14 10 28 0z" fill="#F2B632" stroke="#1A1020" stroke-width="2.5"/>'
            + '</g><circle cx="60" cy="22" r="5" fill="#F2B632" stroke="#1A1020" stroke-width="2.5"/></svg>';
    }

    function mount(container, data, api) {
        const el = Rift.el;
        const A = Rift.Assets;
        const sfx = name => { try { if (api && api.sfx) api.sfx(name); } catch (e) { /* sound is optional */ } };
        const say = text => { try { if (api && api.say) api.say(text, 'algorithm'); } catch (e) { /* speech is optional */ } };
        const th = data.theme;
        const D = data.districts;
        const has = id => !!(A && A.has && A.has(id));
        const timers = [];
        const later = (fn, ms) => { timers.push(root.setTimeout(fn, ms)); };

        const STEPS = [
            { id: 'audit', label: 'Audit' },
            { id: 'flaw', label: 'Find the flaw' },
            { id: 'fix', label: 'Fix it' },
        ].concat(data.difficulty >= 3 ? [{ id: 'value', label: 'Justify' }] : []);

        const base = outcomes(data, data.rule);
        const st = {
            phase: 'audit',
            audited: false,
            flaw: null,
            fix: null,
            value: null,
            done: false,
            open: {},
            shown: base.decisions.slice(),   // decisions currently stamped (to animate changes)
            fresh: {},
            result: null,
        };
        const curRule = () => (st.fix ? applyFix(data.rule, fixById(data, st.fix)) : data.rule);
        const cur = () => outcomes(data, curRule());
        const stepIx = id => STEPS.findIndex(s => s.id === id);
        const reached = id => {
            if (id === 'audit') return true;
            if (id === 'flaw') return st.audited;
            if (id === 'fix') return st.audited && !!st.flaw;
            if (id === 'value') return st.audited && !!st.flaw && !!st.fix;
            return false;
        };

        // ---- frame ----
        const stepsEl = el('div.sm-steps');
        const critEl = el('div.sm-crits');
        const top = el('div.sm-top', null, [
            el('span.chip', { dataset: { colour: 'emotion' }, text: Rift.COLOURS.emotion.icon + ' The Sorting Machine' }),
            stepsEl,
            el('span.sm-spacer'),
            critEl,
        ]);

        const cardsHead = el('div.sm-cardshead');
        const cardsEl = el('div.sm-cards');
        const actionEl = el('div.sm-action');
        const statusEl = el('div.sm-status');
        const left = el('div.sm-left', null, [cardsHead, cardsEl, el('div.sm-actionwrap', null, [actionEl, statusEl])]);

        const ruleEl = el('div.sm-panel.sm-rule');
        const auditEl = el('div.sm-panel.sm-audit');
        const evidenceEl = el('div.sm-panel.sm-evidence');
        const right = el('div.sm-right', null, [auditEl, ruleEl, evidenceEl]);

        const rootEl = el('div.sm-root', null, [top, el('div.sm-main', null, [left, right])]);
        try { if (root.getComputedStyle(container).position === 'static') container.style.position = 'relative'; } catch (e) { /* ignore */ }
        container.appendChild(rootEl);

        function setStatus(text, tone) {
            statusEl.textContent = text || '';
            statusEl.className = 'sm-status' + (tone ? ' ' + tone : '');
        }
        function pieces(list) {
            return el('div.sm-pieces', null, list.map(t => el('span.sm-piece', { text: t })));
        }

        // ---- top: steps and goals ----
        function renderTop(out) {
            stepsEl.innerHTML = '';
            STEPS.forEach((s, i) => {
                const ok = reached(s.id) && !st.done;
                stepsEl.appendChild(el('button.sm-stepbtn', {
                    className: (s.id === st.phase ? 'on' : '') + (stepIx(st.phase) > i ? ' past' : ''),
                    disabled: !ok,
                    onclick: () => { if (ok && st.phase !== s.id) { sfx('click'); go(s.id); } },
                }, [el('span.sm-stepn', { text: String(i + 1) }), el('span', { text: s.label })]));
            });
            critEl.innerHTML = '';
            const c = data.criteria;
            const goals = [
                { key: 'budget', icon: '💰', text: out.helped + ' / ' + c.budget + ' ' + th.grants, title: 'Budget: hand out at most ' + c.budget + ' ' + th.grants, known: true },
                { key: 'coverage', icon: '❤️', text: (st.audited ? out.tp : '?') + ' / ' + c.minHelp + '+ needy helped', title: 'Help at least ' + c.minHelp + ' villagers who really need it', known: st.audited },
                { key: 'fair', icon: '⚖️', text: 'gap ' + (st.audited ? Math.round(out.gap * 100) : '?') + ' ≤ ' + Math.round(c.maxGap * 100), title: 'No district\'s missed rate more than ' + Math.round(c.maxGap * 100) + ' points above another\'s', known: st.audited },
            ];
            goals.forEach(g => {
                const state = !g.known ? 'unknown' : out.crit[g.key] ? 'pass' : 'fail';
                critEl.appendChild(el('span.sm-crit', { className: state, title: g.title }, [
                    el('span.sm-criticon', { text: g.icon }),
                    el('span', { text: g.text }),
                    el('span.sm-critmark', { text: state === 'pass' ? '✓' : state === 'fail' ? '✗' : '·' }),
                ]));
            });
        }

        // ---- cards ----
        function stampNode(yes) {
            const id = yes ? 'ui/stamp-yes' : 'ui/stamp-no';
            if (has(id)) return A.img(id, { className: 'sm-stampimg' });
            return el('span.sm-stampdraw', { html: yes ? STAMP_YES : STAMP_NO });
        }
        function breakdown(rule, a, score) {
            const parts = [rule.wH + '×' + a.hardship];
            if (a.household >= rule.bigAt && rule.wBig) parts.push('+ ' + rule.wBig);
            const p = rule.points[a.district];
            if (p) parts.push((p > 0 ? '+ ' : '− ') + Math.abs(p));
            const n = notesCounted(rule, a);
            if (rule.wR && n) parts.push('− ' + rule.wR + '×' + n);
            return parts.join(' ') + ' = ' + score + (score >= rule.T ? ' ≥ ' : ' < ') + rule.T;
        }
        function renderCards(out) {
            const rule = curRule();
            cardsHead.innerHTML = '';
            cardsHead.appendChild(el('span.sm-title', { text: th.title }));
            cardsHead.appendChild(el('span.sm-count', { text: Rift.clamp(out.helped, 0, 99) + ' of ' + data.applicants.length + ' stamped YES' }));
            if (st.audited) {
                cardsHead.appendChild(el('span.sm-legend', null, [
                    el('span.sm-key.tp', { text: 'helped & needed' }),
                    el('span.sm-key.fp', { text: 'helped, not needed' }),
                    el('span.sm-key.fn', { text: 'missed' }),
                    el('span.sm-key.tn', { text: 'rightly refused' }),
                ]));
            }
            cardsEl.innerHTML = '';
            data.applicants.forEach((a, i) => {
                const yes = out.decisions[i];
                const kind = yes ? (a.needed ? 'tp' : 'fp') : (a.needed ? 'fn' : 'tn');
                const changed = st.fresh[i];
                const dist = D[a.district];
                const stats = el('div.sm-stats', null, [
                    el('span.sm-stat', { title: th.need + ' (0–5)' }, [el('span', { text: th.needIcon }), el('span.sm-pips', null,
                        [0, 1, 2, 3, 4].map(k => el('span.sm-pip' + (k < a.hardship ? '.on' : ''))))]),
                    el('span.sm-stat', { title: 'Household size', text: '👪 ' + a.household }),
                    el('span.sm-stat' + (a.notes ? '.warn' : ''), { title: 'Warning notes from inspectors', text: '📜 ' + a.notes }),
                ]);
                const card = el('button.sm-card', {
                    className: (st.audited ? kind : '') + (st.open[i] ? ' open' : ''),
                    style: { '--hue': dist.hue },
                    onclick: () => { st.open[i] = !st.open[i]; sfx('click'); render(); },
                    title: 'Click to see the sum',
                }, [
                    el('div.sm-cardtop', null, [
                        el('span.sm-glyph', { text: a.glyph }),
                        el('span.sm-name', { text: a.name }),
                    ]),
                    el('div.sm-dist', { text: dist.name }),
                    stats,
                    a.helpedLastYear ? el('div.sm-last', { text: 'helped last year' }) : null,
                    el('div.sm-cardfoot', null, [
                        el('span.sm-score', { text: st.open[i] ? breakdown(rule, a, out.scores[i]) : 'score ' + out.scores[i] }),
                        st.audited ? el('span.sm-truth', { className: a.needed ? 'need' : 'fine', text: a.needed ? '♥ needed help' : 'did not need it' }) : null,
                    ]),
                    el('div.sm-stamp', { className: (yes ? 'yes' : 'no') + (changed ? ' restamp' : '') }, [stampNode(yes)]),
                ]);
                cardsEl.appendChild(card);
            });
            st.fresh = {};
        }

        // ---- rule panel ----
        function slider(label, value, min, max, note, changed) {
            return el('div.sm-slider' + (changed ? '.changed' : ''), null, [
                el('span.sm-slabel', { text: label }),
                el('input', { type: 'range', min: String(min), max: String(max), step: '1', value: String(value), disabled: true, tabIndex: -1 }),
                el('span.sm-sval', { text: note }),
            ]);
        }
        function renderRule() {
            const r = curRule();
            const o = data.rule;
            ruleEl.innerHTML = '';
            ruleEl.appendChild(el('div.sm-head', null, [el('span', { text: 'The machine\'s rule' }), el('span.sm-sub', { text: th.machine })]));
            ruleEl.appendChild(slider(th.need + ' ×', r.wH, 0, 3, '× ' + r.wH, r.wH !== o.wH));
            ruleEl.appendChild(slider('Household ' + r.bigAt + '+', r.wBig, 0, 3, '+ ' + r.wBig, r.wBig !== o.wBig));
            const perVisit = r.perVisit.some(x => x !== 1);
            ruleEl.appendChild(slider('Warning notes', r.wR, 0, 3, r.wR ? '− ' + r.wR + ' each' + (perVisit ? ' (per visit)' : '') : 'ignored',
                r.wR !== o.wR || perVisit));
            const pts = el('div.sm-points', null, [el('span.sm-slabel', { text: 'District points' })].concat(D.map((d, k) => {
                const p = r.points[k];
                return el('span.sm-pt', { style: { '--hue': d.hue }, className: p !== o.points[k] ? 'changed' : '', text: d.name + ' ' + (p > 0 ? '+' + p : p === 0 ? '0' : '−' + Math.abs(p)) });
            })));
            ruleEl.appendChild(pts);
            ruleEl.appendChild(slider('Help if score ≥', r.T, 0, 12, String(r.T), r.T !== o.T));
            ruleEl.appendChild(el('div.sm-budget', { text: '💰 Budget: ' + data.criteria.budget + ' ' + th.grants }));
        }

        // ---- audit panel: matrix and districts ----
        function cell(cls, n, was, cap) {
            const delta = st.fix && st.audited ? n - was : 0;
            return el('div.sm-cell.' + cls, null, [
                el('span.sm-cn', { text: st.audited ? String(n) : '?' }),
                delta ? el('span.sm-delta', { text: (delta > 0 ? '+' : '−') + Math.abs(delta) }) : null,
                el('span.sm-cc', { text: cap }),
            ]);
        }
        function renderAudit(out) {
            auditEl.innerHTML = '';
            const scaleArt = has('ui/balance-scale') ? A.img('ui/balance-scale', { className: 'sm-scaleimg' }) : el('span.sm-scaledraw');
            const rates = out.byDistrict.map(x => x.missedRate);
            const worst = rates.indexOf(Math.max(...rates));
            const tilt = st.audited ? Rift.clamp(out.gap * 40, 0, 18) * (worst === 0 ? -1 : worst === 2 ? 1 : (rates[0] > rates[2] ? -1 : 1)) : 0;
            if (scaleArt.classList.contains('sm-scaledraw')) scaleArt.innerHTML = scaleSvg(tilt);
            else scaleArt.style.transform = 'rotate(' + (tilt / 3).toFixed(1) + 'deg)';
            auditEl.appendChild(el('div.sm-head', null, [el('span', { text: 'Home-visit audit' }),
                el('span.sm-sub', { text: st.audited ? 'machine says: ' + pct(out.accuracy) + ' accurate' : 'not run yet' })]));
            const m = el('div.sm-matrix', null, [
                el('div'), el('div.sm-mh', { text: 'Stamped YES' }), el('div.sm-mh', { text: 'Stamped NO' }),
                el('div.sm-mh.row', { text: 'Needed help' }), cell('tp', out.tp, base.tp, 'helped & needed'), cell('fn', out.fn, base.fn, 'missed'),
                el('div.sm-mh.row', { text: 'Did not need it' }), cell('fp', out.fp, base.fp, 'helped, not needed'), cell('tn', out.tn, base.tn, 'rightly refused'),
            ]);
            auditEl.appendChild(m);

            const bars = el('div.sm-bars');
            bars.appendChild(el('div.sm-barshead', null, [scaleArt, el('div', null, [
                el('div.sm-bt', { text: 'Missed rate by district' }),
                el('div.sm-bs', { text: 'needy villagers stamped NO ÷ needy villagers there' }),
            ])]));
            out.byDistrict.forEach((x, k) => {
                const was = base.byDistrict[k].missedRate;
                bars.appendChild(el('div.sm-bar', { style: { '--hue': D[k].hue } }, [
                    el('span.sm-bname', { text: D[k].name }),
                    el('span.sm-track', null, [
                        el('span.sm-fill', { style: { width: (st.audited ? x.missedRate * 100 : 0) + '%' } }),
                        st.fix && st.audited ? el('span.sm-ghost', { style: { left: (was * 100) + '%' }, title: 'before the fix: ' + pct(was) }) : null,
                    ]),
                    el('span.sm-bval', { text: st.audited ? x.fn + '/' + x.needy + ' · ' + pct(x.missedRate) : '?' }),
                ]));
            });
            bars.appendChild(el('div.sm-gap', {
                className: st.audited ? (out.crit.fair ? 'pass' : 'fail') : '',
                text: st.audited ? 'Gap between districts: ' + Math.round(out.gap * 100) + ' points (allowed ' + Math.round(data.criteria.maxGap * 100) + ')' : 'Run the audit to see who is missed.',
            }));
            auditEl.appendChild(bars);
        }

        // ---- evidence ----
        function renderEvidence() {
            evidenceEl.innerHTML = '';
            evidenceEl.appendChild(el('div.sm-head', null, [el('span', { text: 'Evidence' })]));
            const notes = el('div.sm-notes');
            notes.appendChild(el('div.sm-note', null, [
                el('div.sm-nt', { text: '📒 Inspector\'s logbook' }),
                el('div.sm-visits', null, D.map((d, k) => el('span.sm-visit', { style: { '--hue': d.hue } }, [
                    el('span', { text: d.name }), el('b', { text: data.visits[k] + ' visits' })]))),
            ]));
            const avg = [0, 1, 2].map(k => {
                const list = data.applicants.filter(a => a.district === k);
                return list.reduce((s, a) => s + a.notes, 0) / list.length;
            });
            notes.appendChild(el('div.sm-note', null, [
                el('div.sm-nt', { text: '📜 Warning notes per villager' }),
                el('div.sm-visits', null, D.map((d, k) => el('span.sm-visit', { style: { '--hue': d.hue } }, [
                    el('span', { text: d.name }), el('b', { text: avg[k].toFixed(1) })]))),
            ]));
            const anyPoints = data.rule.points.some(p => p !== 0);
            notes.appendChild(el('div.sm-note', null, [
                el('div.sm-nt', { text: '🗺️ District points' }),
                el('div', { text: anyPoints ? 'Copied from last year\'s grant list: districts that got more help last year get more points this year.' : 'This rule gives no district points.' }),
            ]));
            if (st.audited) {
                notes.appendChild(el('div.sm-note.boast', null, [
                    el('div.sm-nt', { text: '🤖 ' + th.machine.replace(/^the /, 'The ') + ' reports' }),
                    el('div', { text: '"' + pct(base.accuracy) + ' of my stamps were right. My sums never make mistakes."' }),
                ]));
            }
            evidenceEl.appendChild(notes);
        }

        // ---- action area (the current step) ----
        function renderAction() {
            actionEl.innerHTML = '';
            const ph = st.phase;
            if (st.done) {
                actionEl.appendChild(el('div.sm-q', { text: 'Audit accepted' }));
                actionEl.appendChild(el('div', { text: def.tok }));
                return;
            }
            if (ph === 'audit') {
                actionEl.appendChild(pieces(['the machine stamped every application', 'it never visited anyone', 'the home visits show who really needed help']));
                actionEl.appendChild(el('div.sm-row', null, [
                    el('button.btn.gold', { text: 'Run the home-visit audit', onclick: runAudit }),
                    el('span.muted.small', { text: 'Tip: click a card to see its sum.' }),
                ]));
                return;
            }
            if (ph === 'flaw') {
                actionEl.appendChild(el('div.sm-q', { text: 'What is wrong with the machine?' }));
                const list = el('div.sm-opts');
                data.flawOptions.forEach(o => {
                    list.appendChild(el('button.sm-opt', {
                        className: st.flaw === o.id ? 'on' : '',
                        onclick: () => { st.flaw = o.id; sfx('place'); setStatus(''); render(); },
                    }, [el('span.sm-radio'), el('span', { text: o.text })]));
                });
                actionEl.appendChild(list);
                actionEl.appendChild(el('div.sm-row', null, [
                    el('button.btn.gold', { text: 'Now fix it →', disabled: !st.flaw, onclick: () => { sfx('click'); go('fix'); } }),
                ]));
                return;
            }
            if (ph === 'fix') {
                actionEl.appendChild(el('div.sm-q', { text: 'Change one thing. Watch the stamps, the table and the goals.' }));
                const list = el('div.sm-opts.fixes');
                list.appendChild(fixToggle(null, 'Machine as it was', 'No change: compare with the original.'));
                data.fixes.forEach(f => list.appendChild(fixToggle(f.id, f.label, f.text)));
                actionEl.appendChild(list);
                const last = STEPS[STEPS.length - 1].id === 'fix';
                actionEl.appendChild(el('div.sm-row', null, [
                    last
                        ? el('button.btn.gold', { text: 'Hand in the audit', disabled: !st.fix, onclick: send })
                        : el('button.btn.gold', { text: 'Justify it →', disabled: !st.fix, onclick: () => { sfx('click'); go('value'); } }),
                    el('span.muted.small', { text: 'No change is perfect: each one trades one mistake for another.' }),
                ]));
                return;
            }
            if (ph === 'value') {
                const f = fixById(data, st.fix);
                actionEl.appendChild(el('div.sm-q', { text: 'You chose "' + (f ? f.label : '?') + '". Which value did that put first?' }));
                const list = el('div.sm-opts');
                data.values.forEach((v, i) => list.appendChild(el('button.sm-opt', {
                    className: st.value === i ? 'on' : '',
                    onclick: () => { st.value = i; sfx('place'); setStatus(''); render(); },
                }, [el('span.sm-radio'), el('span', { text: v.text })])));
                actionEl.appendChild(list);
                actionEl.appendChild(el('div.sm-row', null, [
                    el('button.btn.gold', { text: 'Hand in the audit', disabled: st.value == null, onclick: send }),
                ]));
            }
        }

        function fixToggle(id, label, text) {
            const on = st.fix === id;
            return el('button.sm-fix', {
                className: on ? 'on' : '',
                onclick: () => chooseFix(id),
                role: 'switch',
                'aria-checked': on ? 'true' : 'false',
            }, [
                el('span.sm-switch', null, [el('span.sm-knob')]),
                el('span.sm-fixtext', null, [el('b', { text: label }), el('span', { text: text })]),
            ]);
        }

        // ---- actions ----
        function go(phase) {
            st.phase = phase;
            setStatus('');
            render();
        }

        function runAudit() {
            if (st.audited) return go('flaw');
            st.audited = true;
            sfx('place');
            const out = cur();
            const worst = worstDistrict(out);
            say('Audit? I am ' + pct(base.accuracy) + ' accurate. My sums are perfect.');
            setStatus('Audit done: ' + out.fn + ' needy villagers were stamped NO. The worst-hit district is ' + D[worst].name + '.');
            go('flaw');
        }

        function chooseFix(id) {
            const before = cur().decisions;
            st.fix = id;
            st.value = null;
            const after = cur();
            after.decisions.forEach((y, i) => { if (y !== before[i]) st.fresh[i] = true; });
            sfx(after.ok ? 'place' : 'click');
            const changed = after.decisions.filter((y, i) => y !== base.decisions[i]).length;
            setStatus(id == null ? 'Back to the machine as it was.' : changed + ' stamp' + (changed === 1 ? '' : 's') + ' differ from the original machine. '
                + (after.ok ? 'All three goals are met.' : 'Not all goals are met yet.'), id == null ? '' : after.ok ? 'good' : '');
            render();
        }

        function send() {
            if (st.done) return;
            sfx('click');
            const answer = { flaw: st.flaw, fix: st.fix };
            if (data.difficulty >= 3) answer.value = st.value;
            let r = null;
            try { r = api && api.submit ? api.submit(answer) : null; } catch (e) { console.error('[sorting]', e); }
            const show = res => {
                if (!res) return;
                if (res.solved) {
                    st.done = true;
                    sfx('success');
                    say('I only did the sums. You chose what they were for.');
                    setStatus(res.feedback, 'good');
                } else {
                    sfx('error');
                    setStatus(res.feedback, 'bad');
                }
                render();
            };
            if (r && typeof r.then === 'function') r.then(show, () => {}); else show(r);
        }

        function render() {
            const out = cur();
            renderTop(out);
            renderCards(out);
            renderRule();
            renderAudit(out);
            renderEvidence();
            renderAction();
        }

        // ---- go ----
        say('I sort ' + th.title.toLowerCase() + ' with perfect sums. Nobody can call numbers unfair.');
        render();
        cardsEl.classList.add('dealing');
        later(() => cardsEl.classList.remove('dealing'), 1400);

        return {
            destroy() {
                timers.forEach(id => root.clearTimeout(id));
                if (rootEl.parentNode) rootEl.parentNode.removeChild(rootEl);
            },
        };
    }

    // ------------------------------------------------------------------

    const def = {
        id: 'sorting',
        name: 'The Sorting Machine',
        colour: 'emotion',
        family: 'Ethics of maths',
        blurb: 'A machine decides which villagers get help. Its sums are perfect. Audit it: who does it miss, and why?',
        tok: 'The maths was exact, but choosing what to count, which mistakes matter more and what "fair" means were human value choices: maths is not neutral when it decides about people.',

        generate,
        check: checkAnswer,
        hints: hintsFor,
        why: whyFor,
        solve: solveFor,
        mount,

        internals: { SETTINGS, VALUES, FIX_SETS, applyFix, scoreOf, outcomes, fixOutcome, worstDistrict, mostNotesDistrict },
    };

    Rift.Puzzles.register(def);
})(typeof window !== 'undefined' ? window : globalThis);
