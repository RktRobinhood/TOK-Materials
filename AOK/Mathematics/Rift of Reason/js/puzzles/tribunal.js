/*
 * The Tribunal: cross-examination (chapter 3, encounters 1-3; design/CH3.md).
 *
 * A witness (a caricature) testifies in 4-6 statements. The player steps
 * through them (◀ ▶), PRESSES a statement to make the witness say more
 * (a hidden premise, a new statement, new evidence), and PRESENTS evidence
 * from the court record at the statement it contradicts. When the testimony
 * collapses, the player names the flaw (the learning payoff) and, for a proof
 * on trial, picks the repair. Cases are hand-written in data/cases.js; variety
 * comes from the choice of case, shuffled evidence and options, and numbers
 * that change in the statistics cases.
 *
 * Answer for check(): { presented: [{ statement, evidence }], flaw, repair? }
 * Wrong presentations and wrong flaw names are sent to api.submit as they
 * happen (so the encounter can charge health in boss fights); the final,
 * correct answer is submitted when the player closes the case.
 *
 * Mechanics in the spirit of courtroom cross-examination games (press,
 * present, objection bursts); every name, line and picture here is new.
 */
(function (root) {
    'use strict';

    const Rift = root.Rift;

    const FLAWS = {
        'hidden-premise': { name: 'Hidden premise', short: 'The argument needs an unstated assumption, and that assumption is false.' },
        'strawman': { name: 'Strawman', short: 'It attacks a twisted, weaker version of what the other side really said.' },
        'false-dichotomy': { name: 'False dichotomy', short: 'It pretends there are only two options when there are more.' },
        'authority': { name: 'Appeal to authority', short: 'It says “true, because someone impressive said so”, even outside their expertise.' },
        'popularity': { name: 'Appeal to popularity', short: 'It says “true, because lots of people believe it”.' },
        'hasty-generalisation': { name: 'Hasty generalisation', short: 'It jumps from a few cases to a rule about all cases.' },
        'correlation': { name: 'Correlation is not causation', short: 'Two things go together, so it claims one causes the other.' },
        'cherry-picking': { name: 'Cherry-picking', short: 'It shows only the data that fits and hides the rest.' },
        'base-rate': { name: 'Base-rate neglect', short: 'It ignores how often the thing happens by pure chance anyway.' },
        'misleading-chart': { name: 'Misleading chart', short: 'The picture exaggerates: a cut axis makes a small change look huge.' },
        'circular': { name: 'Circular reasoning', short: 'The conclusion is hidden inside one of the reasons.' },
        'false-lemma': { name: 'Proof with a false step', short: 'One step of the proof (a lemma) only works for some cases, so a counterexample breaks it.' },
    };

    const EVIDENCE_ART = ['chart', 'photo', 'letter', 'receipt', 'video', 'survey', 'coin', 'map', 'recording', 'notebook'];
    const THEMES = ['argument', 'statistics', 'proof'];

    // ---- case data --------------------------------------------------------------

    function allCases() {
        return (Rift.data && Rift.data.cases) || [];
    }

    // Fill {name} placeholders from a parameter set, everywhere in a value.
    function fill(value, params) {
        if (!params) return value;
        if (typeof value === 'string') return value.replace(/\{(\w+)\}/g, (m, k) => (params[k] != null ? String(params[k]) : m));
        if (Array.isArray(value)) return value.map(v => fill(v, params));
        if (value && typeof value === 'object') {
            const out = {};
            Object.keys(value).forEach(k => { out[k] = fill(value[k], params); });
            return out;
        }
        return value;
    }

    function pickCase(rng, difficulty, opts) {
        const o = opts || {};
        let list = allCases();
        if (o.caseId) {
            const one = list.find(c => c.id === o.caseId);
            if (one) return one;
        }
        if (o.theme && THEMES.indexOf(o.theme) !== -1) {
            const themed = list.filter(c => c.theme === o.theme);
            if (themed.length) list = themed;
        }
        const d = Rift.clamp(Math.round(+difficulty || 1), 1, 3);
        // Nearest difficulty that has any cases.
        for (let gap = 0; gap <= 2; gap++) {
            const pool = list.filter(c => Math.abs(c.difficulty - d) === gap);
            if (pool.length) return rng.pick(pool);
        }
        throw new Error('The Tribunal has no cases (is data/cases.js loaded?)');
    }

    function build(c, rng) {
        const params = c.params && c.params.length ? Rift.deepClone(rng.pick(c.params)) : null;
        const cc = fill(Rift.deepClone(c), params);
        const creature = Rift.data && Rift.data.creatures && Rift.data.creatures[cc.witness];
        const contradictions = cc.contradictions.map(x => ({
            statements: [].concat(x.statements),
            evidence: [].concat(x.evidence),
            explain: x.explain,
            reaction: x.reaction,
            after: x.after ? { lines: x.after.lines || [], adds: x.after.adds || null } : null,
        }));
        const data = {
            caseId: cc.id,
            title: cc.title,
            theme: cc.theme,
            difficulty: cc.difficulty,
            claim: cc.claim,
            opening: cc.opening,
            intro: cc.intro,
            witness: {
                id: cc.witness,
                name: creature ? creature.name : cc.witness,
                colour: creature ? creature.colour : 'language',
            },
            testimony: cc.testimony.map(s => ({
                id: s.id, text: s.text, hidden: !!s.hidden,
                press: Object.assign({}, s.press),
            })),
            evidence: rng.shuffle(cc.evidence.map(e => ({ id: e.id, art: e.art, name: e.name, desc: e.desc, hidden: !!e.hidden }))),
            contradictions,
            need: Rift.clamp(cc.need || contradictions.length, 1, contradictions.length),
            near: (cc.near || []).slice(),
            flaw: cc.flaw,
            flawOptions: rng.shuffle([cc.flaw].concat(cc.distractors || [])),
            hint: cc.hint,
            whyText: cc.why,
            lesson: cc.lesson,
            repair: cc.repair ? {
                question: cc.repair.question,
                options: rng.shuffle(cc.repair.options.slice()),
                correct: cc.repair.correct,
            } : null,
            params,
            seed: rng.int(0, 2147483646),
        };
        return data;
    }

    // generate(rng, difficulty[, { theme, caseId }]): the encounter passes two
    // arguments; the optional third lets a chapter script pick a theme.
    function generate(rng, difficulty, opts) {
        return build(pickCase(rng, difficulty, opts), rng);
    }

    // ---- lookups and wording --------------------------------------------------------

    const stmt = (data, id) => data.testimony.find(s => s.id === id) || null;
    const evi = (data, id) => data.evidence.find(e => e.id === id) || null;
    const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
    const quote = text => '“' + String(text).replace(/[.!?…]+$/, '') + '”';
    const PROPER = /^(Fair|Maths|Truth|Feed|Granny|Pip|Euclid|Owlet|GlowUp)\b/;

    // "the ball-drop video", "Pip’s notebook", "the Fair coin"
    function evName(e) {
        const n = e.name;
        if (/’s\b/.test(n.split(' ')[0])) return n;
        if (/^The /.test(n)) return 'the ' + n.slice(4);
        return 'the ' + (PROPER.test(n) ? n : n.charAt(0).toLowerCase() + n.slice(1));
    }

    function matchContra(data, pair) {
        if (!pair) return -1;
        return data.contradictions.findIndex(c => c.statements.indexOf(pair.statement) !== -1 && c.evidence.indexOf(pair.evidence) !== -1);
    }

    function nearFor(data, pair) {
        if (!pair) return null;
        return (data.near || []).find(n => n.statement === pair.statement && n.evidence === pair.evidence) || null;
    }

    // Which statement's press reveals a hidden statement / unlocks evidence.
    function revealerOfStatement(data, id) {
        const s = data.testimony.find(t => t.press && t.press.adds === id);
        if (s) return { kind: 'press', statement: s };
        const ci = data.contradictions.findIndex(c => c.after && c.after.adds === id);
        return ci >= 0 ? { kind: 'contradiction', index: ci } : null;
    }
    function revealerOfEvidence(data, id) {
        return data.testimony.find(t => t.press && t.press.unlocks === id) || null;
    }

    function pairFeedback(data, p) {
        const s = stmt(data, p.statement), e = evi(data, p.evidence);
        if (!s || !e) return 'That statement or piece of evidence isn’t part of this case.';
        const near = nearFor(data, p);
        if (near) return near.say;
        const evUsed = data.contradictions.some(c => c.evidence.indexOf(e.id) !== -1);
        const weak = data.contradictions.some(c => c.statements.indexOf(s.id) !== -1);
        if (evUsed) return cap(evName(e)) + ' matters, but it doesn’t contradict ' + quote(s.text) + '. Find the statement it really clashes with.';
        if (weak) return quote(s.text) + ' is a weak spot, but ' + evName(e) + ' doesn’t break it. Look for evidence that says the opposite.';
        return cap(evName(e)) + ' doesn’t contradict ' + quote(s.text) + ': both can be true at the same time.';
    }

    // ---- check, hints, why, solve ---------------------------------------------------

    function check(data, answer) {
        const need = data.need;
        const w = data.repair ? [0.6, 0.25, 0.15] : [0.65, 0.35, 0];
        if (!answer || typeof answer !== 'object') {
            return { solved: false, partial: 0, feedback: 'Present a piece of evidence at the statement it contradicts.' };
        }
        const pairs = Array.isArray(answer.presented) ? answer.presented.filter(p => p && typeof p === 'object') : [];
        const found = new Set();
        const wrong = [];
        pairs.forEach(p => {
            const ci = matchContra(data, p);
            if (ci >= 0) found.add(ci); else wrong.push(p);
        });
        const nf = Math.min(found.size, need);
        const flawOk = answer.flaw === data.flaw;
        const repairOk = !data.repair || answer.repair === data.repair.correct;
        let partial = w[0] * nf / need + (flawOk ? w[1] : 0) + (data.repair && repairOk ? w[2] : 0) - 0.15 * wrong.length;
        partial = Math.round(Rift.clamp(partial, 0, 1) * 100) / 100;

        if (nf >= need && !wrong.length && flawOk && repairOk) {
            return {
                solved: true, partial: 1,
                feedback: 'Case closed! The flaw: ' + FLAWS[data.flaw].name.toLowerCase() + '. ' + data.lesson,
            };
        }
        if (partial >= 1) partial = 0.95;
        if (wrong.length) return { solved: false, partial, feedback: pairFeedback(data, wrong[0]) };
        if (nf === 0) {
            return { solved: false, partial, feedback: 'Present a piece of evidence at the statement it contradicts. If the court record looks thin, press the statements first.' };
        }
        if (nf < need) {
            const left = need - nf;
            return { solved: false, partial, feedback: 'Contradiction found! But the testimony still has ' + (left === 1 ? 'another weak point' : left + ' more weak points') + '. Keep cross-examining.' };
        }
        if (!flawOk) {
            const f = FLAWS[answer.flaw];
            if (!answer.flaw) return { solved: false, partial, feedback: 'The contradiction is found. Now name the flaw: what kind of mistake did the witness make?' };
            if (!f) return { solved: false, partial, feedback: 'The court doesn’t know that flaw. Choose one from the list.' };
            return {
                solved: false, partial,
                feedback: 'The contradiction is right, but this isn’t ' + f.name.toLowerCase() + ' (' + f.short.charAt(0).toLowerCase() + f.short.slice(1).replace(/[.]$/, '') + '). Look again at the statement you broke: what was the witness doing there?',
            };
        }
        const opt = data.repair.options.find(o => o.id === answer.repair);
        return { solved: false, partial, feedback: opt ? opt.explain : 'Choose how the proof should be repaired.' };
    }

    function hints(data) {
        const out = [data.hint];
        const c0 = data.contradictions[0];
        const lockedEv = c0.evidence.every(id => (evi(data, id) || {}).hidden);
        const lockedSt = c0.statements.every(id => (stmt(data, id) || {}).hidden);
        if (lockedEv) {
            const by = revealerOfEvidence(data, c0.evidence[0]);
            out.push('The evidence you need isn’t in the court record yet. Press ' + (by ? quote(by.text) : 'every statement') + ' and the witness will hand it over.');
        } else if (lockedSt) {
            const by = revealerOfStatement(data, c0.statements[0]);
            out.push('Press ' + (by && by.statement ? quote(by.statement.text) : 'every statement') + ': the witness has more to say.');
        } else {
            out.push('Focus on ' + quote(stmt(data, c0.statements[0]).text) + '. The whole argument leans on it. Which evidence says the opposite?');
        }
        const steps = data.contradictions.slice(0, data.need).map(c => {
            const s = stmt(data, c.statements[0]), e = evi(data, c.evidence[0]);
            const later = s.hidden && revealerOfStatement(data, s.id) && revealerOfStatement(data, s.id).kind === 'contradiction';
            return 'present ' + evName(e) + ' at ' + quote(s.text) + (later ? ' (that statement appears after the first contradiction)' : '');
        });
        out.push(cap(steps.join('; then ')) + '.');
        return out;
    }

    function why(data) {
        const c = data.contradictions[0];
        const s = stmt(data, c.statements[0]), e = evi(data, c.evidence[0]);
        const t = data.whyText;
        const rng = Rift.makeRng('tribunal-why:' + data.seed);
        const options = rng.shuffle([t.right].concat(t.wrong));
        return {
            question: 'Why does ' + evName(e) + ' break the statement ' + quote(s.text) + '?',
            options,
            correct: options.indexOf(t.right),
            explain: data.lesson,
        };
    }

    function solve(data) {
        const ans = {
            presented: data.contradictions.slice(0, data.need).map(c => ({ statement: c.statements[0], evidence: c.evidence[0] })),
            flaw: data.flaw,
        };
        if (data.repair) ans.repair = data.repair.correct;
        return ans;
    }

    // ---- DOM ----------------------------------------------------------------------

    const CAST = {
        judge: { name: 'Judge Hoot', art: 'npc/judge', colour: 'language' },
        pros: { name: 'Prosecutor Fin', art: 'npc/prosecutor', colour: 'emotion' },
        clerk: { name: 'Pip', art: 'npc/clerk', colour: 'reason' },
        you: { name: 'You' },
    };
    const PROS_OBJECT = [
        'Objection! The defence is waving random papers around.',
        'Objection! That evidence has nothing to do with this statement.',
        'Objection! Is the defence presenting evidence, or confetti?',
    ];
    const PROS_SHAKEN = ['Wh— what?! That can’t be…', 'Impossible! My perfect witness…', 'Grr… a lucky shot. Nothing more.'];
    const PROS_NEAR = ['Hmph. And what is that supposed to prove?', 'So? That doesn’t touch the testimony.'];

    function mount(container, data, api) {
        const el = (api && api.el) || Rift.el;
        const doc = root.document;
        const A = Rift.Assets;
        const sfx = name => { try { if (api && api.sfx) api.sfx(name); } catch (e) { /* sound is optional */ } };
        const cos = (api && api.rng) || Rift.makeRng('tribunal-ui:' + data.seed);
        const timers = [];
        const later = (fn, ms) => { const t = setTimeout(fn, ms); timers.push(t); return t; };
        const manifest = () => (Rift.data && Rift.data.assets) || {};

        const st = {
            mode: 'talk', idx: 0, line: null, queue: [], after: null, busy: false,
            revealed: {}, unlocked: {}, pressed: {}, fresh: {}, premises: [],
            found: [], foundPairs: [], mistakes: 0, nudges: 0,
            recordOpen: false, selEv: null, flawTried: {}, repairTried: {}, done: false,
            poses: { judge: 'neutral', pros: 'neutral', clerk: 'neutral', witness: 'smug' },
        };

        const visible = () => data.testimony.filter(s => !s.hidden || st.revealed[s.id]);
        const shownEvidence = () => data.evidence.filter(e => !e.hidden || st.unlocked[e.id]);
        const current = () => visible()[Rift.clamp(st.idx, 0, visible().length - 1)];

        const prevPos = container.style.position;
        if (root.getComputedStyle && root.getComputedStyle(container).position === 'static') container.style.position = 'relative';

        const rootEl = el('div.tb', { dataset: { case: data.caseId, theme: data.theme } });
        const bg = el('div.tb-bg', { 'aria-hidden': 'true' });
        if (A && A.has('scene/tribunal')) {
            bg.style.backgroundImage = 'url("' + A.url('scene/tribunal') + '")';
            bg.classList.add('art');
        }
        rootEl.appendChild(bg);

        // ---- top bar: claim on trial, penalties, court record ----
        const penalties = el('span.tb-penalty', { title: 'Wrong presentations' });
        const recordBtn = el('button.btn.small.tb-record-btn', { type: 'button', onclick: () => toggleRecord() });
        rootEl.appendChild(el('div.tb-top', {}, [
            el('div.tb-claim', {}, [el('span.tb-claim-label', { text: 'On trial' }), el('span.tb-claim-text', { text: data.claim })]),
            el('div.tb-top-right', {}, [penalties, recordBtn]),
        ]));

        // ---- the courtroom ----
        function artFor(key, pose) {
            if (key === 'witness') {
                let p = pose;
                const m = manifest();
                if (p === 'shocked' && !m['creature/' + data.witness.id + '/shocked'] && m['creature/' + data.witness.id + '/defeated']) p = 'defeated';
                return 'creature/' + data.witness.id + '/' + p;
            }
            return CAST[key].art + '/' + pose;
        }
        function makeImg(key) {
            const colour = key === 'witness' ? data.witness.colour : CAST[key].colour;
            const label = key === 'witness' ? data.witness.name : CAST[key].name;
            const id = artFor(key, st.poses[key]);
            return A ? A.img(id, { colour, label, className: 'tb-art', alt: label }) : el('div.tb-art');
        }
        const chars = {};
        ['judge', 'clerk', 'witness', 'pros'].forEach(key => {
            const img = makeImg(key);
            const name = key === 'witness' ? data.witness.name : CAST[key].name;
            const box = el('div.tb-char.tb-' + key, { dataset: { pose: st.poses[key] } }, [img, el('span.tb-plate', { text: name })]);
            chars[key] = { box, img, pose: st.poses[key] };
        });
        const pipBtn = el('button.btn.small.tb-pip-btn', { type: 'button', title: 'Pip gives a free nudge', onclick: () => nudge(), text: '💬 Ask Pip' });
        chars.clerk.box.appendChild(pipBtn);
        const court = el('div.tb-court', {}, [
            el('div.tb-bench', { 'aria-hidden': 'true' }),
            chars.judge.box, chars.pros.box, chars.clerk.box, chars.witness.box,
            el('div.tb-stand', { 'aria-hidden': 'true' }),
        ]);
        rootEl.appendChild(court);

        // ---- the box: dialogue, testimony, choices ----
        const box = el('div.tb-box', { onclick: onBoxClick });
        rootEl.appendChild(box);

        // ---- court record ----
        const record = el('aside.tb-record', { 'aria-label': 'Court record' });
        rootEl.appendChild(record);

        // ---- objection burst ----
        const burstEl = el('div.tb-burst', { 'aria-hidden': 'true' });
        rootEl.appendChild(burstEl);

        function showBurst(word, then) {
            burstEl.innerHTML = '';
            const shape = (A && A.has('ui/objection')) ? A.img('ui/objection', { className: 'tb-burst-art', alt: '' }) : el('div.tb-burst-shape');
            burstEl.appendChild(shape);
            burstEl.appendChild(el('span.tb-burst-word', { text: word }));
            burstEl.dataset.word = word.replace(/[^A-Z]/g, '').toLowerCase();
            burstEl.classList.remove('on'); void burstEl.offsetWidth; burstEl.classList.add('on');
            sfx('place');
            later(() => { burstEl.classList.remove('on'); then(); }, 850);
        }

        // ---- dialogue queue ----
        // line: { who, text, poses?, burst?, action? }
        function play(lines, done) {
            st.mode = 'talk';
            st.queue = lines.slice();
            st.after = done || null;
            st.recordOpen = false;
            next();
        }
        function next() {
            if (st.busy) return;
            if (!st.queue.length) {
                const d = st.after;
                st.after = null;
                st.line = null;
                if (d) d(); else toTestimony();
                return;
            }
            const line = st.queue.shift();
            if (line.poses) Object.assign(st.poses, line.poses);
            if (line.action) line.action();
            if (line.burst) {
                st.busy = true;
                st.line = null;
                render();
                showBurst(line.burst, () => { st.busy = false; st.line = line; render(); });
                return;
            }
            st.line = line;
            render();
        }
        function onBoxClick(e) {
            if (st.mode !== 'talk' || st.busy) return;
            if (e && e.target && e.target.closest && e.target.closest('button') && !e.target.closest('.tb-next')) return;
            sfx('click');
            next();
        }

        function toTestimony() {
            st.mode = 'testimony';
            st.poses.judge = 'neutral';
            if (st.poses.witness === 'angry') st.poses.witness = 'smug';
            if (st.poses.pros === 'angry' || st.poses.pros === 'smug') st.poses.pros = st.found.length ? 'shaken' : 'neutral';
            st.poses.clerk = 'neutral';
            render();
        }

        // ---- actions ----
        function step(d) {
            const n = visible().length;
            st.idx = (st.idx + d + n) % n;
            sfx('click');
            render();
        }

        function press() {
            if (st.mode !== 'testimony') return;
            const s = current();
            const p = s.press || {};
            st.pressed[s.id] = true;
            const lines = [
                { who: 'you', text: 'Hold it! ' + (p.q || 'Can you explain that?'), burst: 'HOLD IT!' },
                { who: 'witness', text: p.reply || '…', poses: { witness: 'angry' } },
            ];
            if (p.pip) lines.push({ who: 'clerk', text: p.pip, poses: { clerk: 'thinking' } });
            if (p.premise && st.premises.indexOf(p.premise) === -1) {
                lines.push({
                    who: 'clerk', poses: { clerk: 'happy' },
                    text: 'Hidden premise spotted! The witness is assuming: “' + p.premise.replace(/[.]$/, '') + '.” I’ve noted it in the court record.',
                    action: () => st.premises.push(p.premise),
                });
            }
            let jumpTo = null;
            if (p.adds && !st.revealed[p.adds]) {
                lines.push({ who: 'judge', text: 'The witness will add that to the testimony.', action: () => { st.revealed[p.adds] = true; st.fresh[p.adds] = true; jumpTo = p.adds; } });
            }
            if (p.unlocks && !st.unlocked[p.unlocks]) {
                const e = evi(data, p.unlocks);
                lines.push({
                    who: 'clerk', poses: { clerk: 'happy' },
                    text: 'New evidence for the court record: ' + evName(e) + '!',
                    action: () => { st.unlocked[p.unlocks] = true; st.selEv = p.unlocks; },
                });
            }
            play(lines, () => {
                if (jumpTo) st.idx = visible().findIndex(x => x.id === jumpTo);
                toTestimony();
            });
        }

        function present() {
            if (st.mode !== 'testimony' || !st.selEv) return;
            const s = current();
            const e = evi(data, st.selEv);
            const pair = { statement: s.id, evidence: e.id };
            st.recordOpen = false;
            const ci = matchContra(data, pair);
            if (ci >= 0 && st.found.indexOf(ci) !== -1) {
                play([{ who: 'clerk', text: 'We already used that contradiction. Look for the next weak point!', poses: { clerk: 'thinking' } }]);
                return;
            }
            if (ci >= 0) {
                const c = data.contradictions[ci];
                st.found.push(ci);
                st.foundPairs.push(pair);
                st.selEv = null;
                const lines = [
                    { who: 'you', text: 'Take that! ' + c.explain, burst: 'TAKE THAT!' },
                    { who: 'witness', text: c.reaction, poses: { witness: 'shocked' } },
                    { who: 'pros', text: cos.pick(PROS_SHAKEN), poses: { pros: 'shaken' } },
                    { who: 'judge', text: 'That is a clear contradiction! The court takes note.', poses: { judge: 'surprised' } },
                ];
                if (st.found.length < data.need) {
                    const after = c.after || { lines: [] };
                    after.lines.forEach(t => lines.push({ who: 'witness', text: t, poses: { witness: 'angry', judge: 'neutral' } }));
                    if (after.adds && !st.revealed[after.adds]) {
                        lines.push({ who: 'judge', text: 'The witness will add that to the testimony.', action: () => { st.revealed[after.adds] = true; st.fresh[after.adds] = true; } });
                    }
                    lines.push({ who: 'judge', text: 'The cross-examination continues. Defence: there is more to examine.', poses: { judge: 'neutral', pros: 'angry' } });
                    play(lines, () => {
                        if (after.adds) st.idx = visible().findIndex(x => x.id === after.adds);
                        st.poses.witness = 'smug';
                        toTestimony();
                    });
                } else {
                    lines.push({ who: 'judge', text: 'The testimony has collapsed! But this court judges arguments, not people. Defence: what kind of flaw broke this argument?', poses: { judge: 'neutral' } });
                    play(lines, () => { st.mode = 'flaw'; render(); });
                }
                return;
            }
            const near = nearFor(data, pair);
            if (near) {
                play([
                    { who: 'you', text: 'Take that! ' + cap(evName(e)) + '!', burst: 'TAKE THAT!' },
                    { who: 'pros', text: cos.pick(PROS_NEAR), poses: { pros: 'smug' } },
                    { who: 'clerk', text: near.say, poses: { clerk: 'thinking' } },
                ]);
                return;
            }
            st.mistakes++;
            const r = (api && api.submit) ? api.submit({ presented: [pair], flaw: null }) : check(data, { presented: [pair], flaw: null });
            sfx('error');
            play([
                { who: 'you', text: 'Take that! ' + cap(evName(e)) + '!', burst: 'TAKE THAT!' },
                { who: 'pros', text: cos.pick(PROS_OBJECT), burst: 'OBJECTION!', poses: { pros: 'smug' } },
                { who: 'judge', text: 'The defence will only present evidence that contradicts the statement. That is a penalty!', poses: { judge: 'angry' } },
                { who: 'clerk', text: (r && r.feedback) || pairFeedback(data, pair), poses: { clerk: 'thinking', judge: 'neutral' } },
            ]);
        }

        function nameFlaw(id) {
            if (st.mode !== 'flaw' || st.flawTried[id]) return;
            if (id === data.flaw) {
                sfx('place');
                play([
                    { who: 'you', text: 'The flaw is: ' + FLAWS[id].name.toLowerCase() + '!', burst: 'OBJECTION!' },
                    { who: 'judge', text: 'Correct. ' + FLAWS[id].short, poses: { judge: 'neutral', pros: 'angry' } },
                ], () => {
                    if (data.repair) { st.mode = 'repair'; render(); } else verdict();
                });
                return;
            }
            st.flawTried[id] = true;
            st.mistakes++;
            const ans = { presented: st.foundPairs.slice(), flaw: id };
            const r = (api && api.submit) ? api.submit(ans) : check(data, ans);
            sfx('error');
            play([
                { who: 'judge', text: 'Hmm. ' + FLAWS[id].name + '? Is that really what happened here?', poses: { judge: 'angry' } },
                { who: 'clerk', text: (r && r.feedback) || 'Not that one. Think about what the witness did wrong.', poses: { clerk: 'thinking', judge: 'neutral' } },
            ], () => { st.mode = 'flaw'; render(); });
        }

        function pickRepair(id) {
            if (st.mode !== 'repair' || st.repairTried[id]) return;
            const opt = data.repair.options.find(o => o.id === id);
            if (id === data.repair.correct) {
                sfx('place');
                play([{ who: 'clerk', text: opt.explain, poses: { clerk: 'happy' } }], verdict);
                return;
            }
            st.repairTried[id] = true;
            st.mistakes++;
            const ans = { presented: st.foundPairs.slice(), flaw: data.flaw, repair: id };
            const r = (api && api.submit) ? api.submit(ans) : check(data, ans);
            sfx('error');
            play([
                { who: 'pros', text: 'Ha! Even the prosecution wouldn’t fix it like that.', poses: { pros: 'smug' } },
                { who: 'clerk', text: (r && r.feedback) || opt.explain, poses: { clerk: 'thinking', pros: 'shaken' } },
            ], () => { st.mode = 'repair'; render(); });
        }

        function verdict() {
            play([
                { who: 'judge', text: 'The court has heard enough.', poses: { judge: 'gavel', witness: 'defeated', pros: 'shaken' }, action: () => sfx('success') },
            ], () => { st.mode = 'verdict'; render(); });
        }

        function closeCase() {
            if (st.done) return;
            st.done = true;
            const ans = { presented: st.foundPairs.slice(), flaw: data.flaw };
            if (data.repair) ans.repair = data.repair.correct;
            sfx('click');
            if (api && api.submit) api.submit(ans);
            render();
        }

        function nudge() {
            if (st.mode !== 'testimony') return;
            const unpressed = visible().filter(s => !st.pressed[s.id]).length;
            const locked = data.evidence.some(e => e.hidden && !st.unlocked[e.id]);
            let text;
            if (locked && unpressed) text = 'Witnesses often say more than they mean to. You haven’t pressed ' + (unpressed === 1 ? 'one of the statements' : unpressed + ' of the statements') + ' yet.';
            else if (st.nudges % 2 === 0) text = data.hint;
            else text = 'Read each statement and ask: which one does the whole argument lean on? Then look for evidence that clashes with exactly that one.';
            st.nudges++;
            sfx('click');
            play([{ who: 'clerk', text, poses: { clerk: 'thinking' } }]);
        }

        function toggleRecord(force) {
            st.recordOpen = force != null ? force : !st.recordOpen;
            sfx('click');
            render();
        }

        function selectEvidence(id) {
            st.selEv = id;
            sfx('click');
            render();
        }

        // ---- rendering ----
        function setPose(key) {
            const c = chars[key];
            const pose = st.poses[key];
            if (c.pose === pose) return;
            c.pose = pose;
            c.box.dataset.pose = pose;
            if (A && c.img.tagName === 'IMG') {
                const colour = key === 'witness' ? data.witness.colour : CAST[key].colour;
                const label = key === 'witness' ? data.witness.name : CAST[key].name;
                const id = artFor(key, pose);
                c.img.src = A.src(id, { colour, label });
                if (A.has(id)) delete c.img.dataset.placeholder; else c.img.dataset.placeholder = id;
            }
            c.box.classList.remove('jolt'); void c.box.offsetWidth; c.box.classList.add('jolt');
        }

        function renderChars() {
            Object.keys(chars).forEach(setPose);
            const who = st.mode === 'talk' && st.line ? st.line.who : st.mode === 'testimony' ? 'witness' : (st.mode === 'flaw' || st.mode === 'repair' || st.mode === 'verdict') ? 'judge' : null;
            Object.keys(chars).forEach(k => chars[k].box.classList.toggle('speaking', who === k));
            pipBtn.disabled = st.mode !== 'testimony';
        }

        function speakerName(who) {
            return who === 'witness' ? data.witness.name : (CAST[who] || {}).name || '';
        }

        function renderBox() {
            box.innerHTML = '';
            box.className = 'tb-box mode-' + st.mode + (st.busy ? ' busy' : '');
            if (st.mode === 'talk') {
                if (!st.line) return;
                box.appendChild(el('span.tb-name.who-' + st.line.who, { text: speakerName(st.line.who) }));
                box.appendChild(el('div.tb-text' + (st.line.who === 'you' ? '.you' : ''), { text: st.line.text }));
                box.appendChild(el('button.tb-next', { type: 'button', title: 'Next', 'aria-label': 'Next', text: '▼' }));
                return;
            }
            if (st.mode === 'testimony') {
                const list = visible();
                const s = current();
                st.idx = list.indexOf(s);
                const wasFresh = !!st.fresh[s.id];
                delete st.fresh[s.id];
                box.appendChild(el('span.tb-name.who-witness', { text: 'Testimony · ' + data.witness.name }));
                box.appendChild(el('div.tb-nav', {}, [
                    el('button.tb-arrow', { type: 'button', title: 'Previous statement', 'aria-label': 'Previous statement', onclick: () => step(-1), text: '◀' }),
                    el('div.tb-dots', {}, list.map((x, i) => el('button.tb-dot' + (i === st.idx ? '.on' : '') + (st.pressed[x.id] ? '.pressed' : '') + (st.fresh[x.id] ? '.fresh' : ''), {
                        type: 'button', title: 'Statement ' + (i + 1), 'aria-label': 'Statement ' + (i + 1),
                        onclick: () => { st.idx = i; sfx('click'); render(); },
                    }))),
                    el('span.tb-count', { text: 'Statement ' + (st.idx + 1) + ' of ' + list.length }),
                    wasFresh ? el('span.tb-new', { text: 'NEW' }) : null,
                    st.pressed[s.id] ? el('span.tb-pressed', { text: '✓ pressed' }) : null,
                    el('button.tb-arrow', { type: 'button', title: 'Next statement', 'aria-label': 'Next statement', onclick: () => step(1), text: '▶' }),
                ]));
                box.appendChild(el('div.tb-text.testimony', { text: s.text }));
                box.appendChild(el('div.tb-actions', {}, [
                    el('button.btn.tb-press', { type: 'button', onclick: press, title: 'Press the witness on this statement' }, [
                        A && A.has('ui/press') ? A.img('ui/press', { className: 'tb-btn-icon' }) : el('span.tb-btn-emoji', { text: '🔍' }),
                        el('span', {}, [el('b', { text: 'Press' }), el('small', { text: 'Hold it!' })]),
                    ]),
                    el('button.btn.tb-present', { type: 'button', onclick: () => toggleRecord(true), title: 'Choose evidence that contradicts this statement' }, [
                        A && A.has('ui/present') ? A.img('ui/present', { className: 'tb-btn-icon' }) : el('span.tb-btn-emoji', { text: '🃏' }),
                        el('span', {}, [el('b', { text: 'Present' }), el('small', { text: 'Take that!' })]),
                    ]),
                ]));
                return;
            }
            if (st.mode === 'flaw' || st.mode === 'repair') {
                const flaw = st.mode === 'flaw';
                box.appendChild(el('span.tb-name.who-judge', { text: 'Judge Hoot' }));
                box.appendChild(el('div.tb-text', { text: flaw ? 'What kind of flaw broke this argument?' : data.repair.question }));
                const opts = flaw
                    ? data.flawOptions.map(id => ({ id, title: FLAWS[id].name, sub: FLAWS[id].short, tried: st.flawTried[id], go: () => nameFlaw(id) }))
                    : data.repair.options.map(o => ({ id: o.id, title: o.text, sub: '', tried: st.repairTried[o.id], go: () => pickRepair(o.id) }));
                box.appendChild(el('div.tb-choices' + (flaw ? '' : '.repair'), {}, opts.map(o => el('button.tb-choice' + (o.tried ? '.tried' : ''), {
                    type: 'button', disabled: !!o.tried, onclick: o.go,
                }, [el('b', { text: o.title }), o.sub ? el('small', { text: o.sub }) : null]))));
                return;
            }
            if (st.mode === 'verdict') {
                const repaired = !!data.repair;
                box.appendChild(el('span.tb-name.who-judge', { text: 'Verdict' }));
                box.appendChild(el('div.tb-verdict', {}, [
                    el('div.tb-stamp', { text: repaired ? 'THEOREM REPAIRED' : 'ARGUMENT BROKEN' }),
                    el('div.tb-verdict-body', {}, [
                        el('div.tb-verdict-flaw', {}, [el('b', { text: FLAWS[data.flaw].name + ': ' }), FLAWS[data.flaw].short]),
                        el('p', { text: data.lesson }),
                        st.premises.length ? el('p.tb-verdict-prem', { text: 'Hidden premises you uncovered: ' + st.premises.map(p => '“' + p.replace(/[.]$/, '') + '”').join(', ') + '.' }) : null,
                    ]),
                    el('button.btn.gold.tb-close', { type: 'button', disabled: st.done, onclick: closeCase, text: st.done ? 'Case closed' : '⚖ Close the case' }),
                ]));
            }
        }

        function renderRecord() {
            record.innerHTML = '';
            record.classList.toggle('open', st.recordOpen);
            const ev = shownEvidence();
            const presenting = st.mode === 'testimony';
            const head = el('div.tb-record-head', {}, [
                A && A.has('ui/court-record') ? A.img('ui/court-record', { className: 'tb-record-icon' }) : el('span.tb-record-emoji', { text: '📁' }),
                el('h3', { text: 'Court record' }),
                el('button.btn.small.tb-record-close', { type: 'button', onclick: () => toggleRecord(false), text: '✕' }),
            ]);
            record.appendChild(head);
            if (presenting) {
                record.appendChild(el('div.tb-record-target', {}, [
                    el('span', { text: 'Present against statement ' + (st.idx + 1) + ':' }),
                    el('b', { text: current().text }),
                ]));
            }
            record.appendChild(el('div.tb-evidence', {}, ev.map(e => el('button.tb-card' + (st.selEv === e.id ? '.sel' : ''), {
                type: 'button', onclick: () => selectEvidence(e.id), dataset: { art: e.art },
            }, [
                el('span.tb-card-frame', {}, [A ? A.img('ui/evidence-' + e.art, { className: 'tb-card-art', colour: 'language', label: e.art }) : el('span')]),
                el('span.tb-card-text', {}, [el('b', { text: e.name }), el('small', { text: e.desc })]),
            ]))));
            if (st.premises.length) {
                record.appendChild(el('div.tb-notes', {}, [
                    el('h4', { text: 'Hidden premises' }),
                    el('ul', {}, st.premises.map(p => el('li', { text: p }))),
                ]));
            }
            if (presenting) {
                const sel = st.selEv && evi(data, st.selEv);
                record.appendChild(el('button.btn.primary.tb-takethat', {
                    type: 'button', disabled: !sel, onclick: present,
                    text: sel ? 'Take that! Present ' + evName(sel) : 'Choose a piece of evidence',
                }));
            }
        }

        function render() {
            rootEl.classList.toggle('record-open', st.recordOpen);
            renderChars();
            renderBox();
            renderRecord();
            penalties.textContent = st.mistakes ? '⚖ Penalties: ' + st.mistakes : '';
            penalties.hidden = !st.mistakes;
            recordBtn.textContent = '📁 Court record (' + shownEvidence().length + ')';
        }

        function onKey(e) {
            if (!rootEl.isConnected) return;
            const k = e.key;
            if (k === 'Escape' && st.recordOpen) { toggleRecord(false); e.preventDefault(); return; }
            if (st.mode === 'testimony' && !st.recordOpen) {
                if (k === 'ArrowLeft') { step(-1); e.preventDefault(); }
                else if (k === 'ArrowRight') { step(1); e.preventDefault(); }
            } else if (st.mode === 'talk' && (k === 'Enter' || k === ' ')) {
                if (doc.activeElement && doc.activeElement.tagName === 'BUTTON') return; // the button's own click handles it
                e.preventDefault();
                onBoxClick(null);
            }
        }
        doc.addEventListener('keydown', onKey);

        container.appendChild(rootEl);
        play([
            { who: 'judge', text: 'Court is now in session. On trial today, the claim: “' + data.claim.replace(/[.]$/, '') + '.”', poses: { judge: 'gavel' } },
            { who: 'pros', text: data.opening, poses: { judge: 'neutral', pros: 'smug' } },
            { who: 'judge', text: 'The witness, ' + data.witness.name + ', will now testify.' },
            { who: 'witness', text: data.intro },
            { who: 'clerk', text: 'Pip here, keeping the court record! Press a statement to make the witness say more. When a statement clashes with a piece of evidence, present it!', poses: { clerk: 'happy', pros: 'neutral' } },
        ], toTestimony);

        return {
            destroy() {
                timers.forEach(clearTimeout);
                doc.removeEventListener('keydown', onKey);
                if (rootEl.parentNode) rootEl.parentNode.removeChild(rootEl);
                container.style.position = prevPos;
            },
        };
    }

    Rift.Puzzles.register({
        id: 'tribunal',
        rules: [
            "Read the claim and testimony. Use the arrows to move between statements.",
            "Press asks for more detail. The Court record contains evidence and notes.",
            "Present evidence only against the statement it contradicts.",
            "After the objection, name the argument's flaw. Repair the proof if asked, then Close the case.",
            "How to play is free. The Hint button shows its heart cost. Think first, then check your answer."
        ],
        tutorial: [
            {
                "text": "We put the argument on trial. Your job is to connect a weak statement to evidence.",
                "highlight": ".tb-top"
            },
            {
                "text": "Use the arrows to read the testimony. Press a statement to hear more; some evidence appears only after pressing.",
                "highlight": ".tb-box"
            },
            {
                "text": "Open the Court record. Read what each piece of evidence establishes, not just its picture.",
                "highlight": ".tb-record-btn"
            },
            {
                "text": "Example: \"The door stayed locked all day\" clashes with a dated record showing it opened at noon. Present that record against that statement.",
                "highlight": ".tb-box"
            },
            {
                "text": "Use Present on the statement, choose evidence, then Take that. Name the flaw and repair the proof if asked. Finish with Close the case. How to play is free. The Hint button shows its heart cost. Think first, then check your answer.",
                "highlight": ".tb-box"
            }
        ],
        name: 'The Tribunal',
        colour: 'language',
        family: 'Breaking down arguments',
        blurb: 'Breaking an argument down means finding which premise carries the weight, and testing that one. Press the witness; present the evidence that breaks the testimony.',
        tok: 'An argument is only as strong as the premise that carries its weight: break that one and the conclusion is left unsupported (not proved false). In maths, a single counterexample does the same to a proof.',
        generate,
        check,
        hints,
        why,
        solve,
        mount,
        // exposed for tests and tools
        _internal: { FLAWS, EVIDENCE_ART, THEMES, build, fill, pickCase, matchContra, nearFor, revealerOfStatement, revealerOfEvidence, evName },
    });
})(typeof window !== 'undefined' ? window : globalThis);
