/*
 * The Oracle Machine: Reason / proof (chapter 4, lesson 4: AI and proof).
 *
 * A brass-and-glass machine prints a "proof" on paper tape, one numbered step
 * at a time. Some proofs hold; most contain exactly one flaw:
 *
 *   zero-divide   dividing by something that can be zero (the "2 = 1" proof)
 *   circular      using the claim itself as a reason
 *   few-cases     checking some cases, then claiming "for all" (n² + n + 41)
 *   non-sequitur  an "if… then" used backwards (affirming the consequent)
 *   diagram       trusting how a picture looks (a corner that only looks square)
 *   off-by-one    counting gaps instead of posts (or pages)
 *   sqrt-sign     confusing equal squares with equal numbers (√(x²) = |x|)
 *
 * At difficulty 3 the machine may also print a huge, correct, case-by-case
 * proof that no human would read (hundreds of cases), like the computer
 * proof of the four colour theorem: would you trust it?
 *
 * Every step carries a machine-checkable claim, so the "test a step with a
 * number" tool (and the tests) can plug values into both sides. The flaw step
 * is the FIRST step whose claim is false for some allowed values.
 *
 * Answer: { step: index | null (null = "every step holds"), flaw: id | null,
 *           trust?: index into data.trust.options (for proofs that hold) }.
 */
(function (root) {
    'use strict';

    const Rift = root.Rift;

    const FLAWS = {
        'zero-divide': { label: 'It divides by something that could be zero', short: 'Divides by zero',
            explain: 'You may never divide by zero. Here the thing you divide by is zero, so the step after it breaks.' },
        'circular': { label: 'It uses what it is trying to prove', short: 'Circular',
            explain: 'The step uses the claim itself as a reason. That is circular: the proof assumes its own conclusion.' },
        'few-cases': { label: 'It checks a few cases, then claims "for all"', short: 'A few cases',
            explain: 'Checking many cases is evidence, not proof. One counter-example breaks a "for all" claim.' },
        'non-sequitur': { label: 'It does not follow: an "if… then" is used backwards', short: 'Does not follow',
            explain: '"If A then B" and "B is true" do not give "A is true". The step does not follow.' },
        'diagram': { label: 'It trusts what a diagram looks like', short: 'Trusts the picture',
            explain: 'A picture can look right without being right. The step assumes something only because it looks that way.' },
        'off-by-one': { label: 'It counts one too few (or one too many)', short: 'Off by one',
            explain: 'Counting gaps is not counting posts: from a to b there are b − a + 1 whole numbers.' },
        'sqrt-sign': { label: 'It treats equal squares as equal numbers', short: 'Square-root sign',
            explain: 'If two squares are equal, the numbers are equal OR opposite: √(x²) is |x|, not always x.' },
    };
    const FLAW_IDS = Object.keys(FLAWS);

    // ------------------------------------------------------------------
    // The evaluator (pure): a tiny safe expression language
    //   numbers, variables, + - * / ^, brackets, and the functions
    //   sqrt abs mod(x, m) count(a, b) sum(a, b) heron(a, b, c)
    // ------------------------------------------------------------------

    const FUNCS = {
        sqrt: x => Math.sqrt(x),
        abs: x => Math.abs(x),
        mod: (x, m) => ((x % m) + m) % m,
        // count the whole numbers from a to b, one by one (no formula)
        count(a, b) { let c = 0; for (let i = Math.ceil(a); i <= b && c < 1e6; i++) c++; return c; },
        sum(a, b) { let s = 0; for (let i = Math.ceil(a), c = 0; i <= b && c < 1e6; i++, c++) s += i; return s; },
        heron(a, b, c) { const s = (a + b + c) / 2; return Math.sqrt(Math.max(0, s * (s - a) * (s - b) * (s - c))); },
    };

    const astCache = {};
    function parse(src) {
        if (astCache[src]) return astCache[src];
        const toks = [];
        const re = /\s*(\d+(?:\.\d+)?|[a-zA-Z][a-zA-Z0-9]*|\S)/g;
        let m;
        while ((m = re.exec(src)) && m[1]) toks.push(m[1]);
        let i = 0;
        const peek = () => toks[i];
        const eat = t => { if (toks[i] !== t) throw new Error('Expected ' + t + ' in ' + src); i++; };
        function expr() {
            let node = term();
            while (peek() === '+' || peek() === '-') { const op = toks[i++]; node = { op, a: node, b: term() }; }
            return node;
        }
        function term() {
            let node = unary();
            while (peek() === '*' || peek() === '/') { const op = toks[i++]; node = { op, a: node, b: unary() }; }
            return node;
        }
        function unary() {
            if (peek() === '-') { i++; return { op: 'neg', a: unary() }; }
            return power();
        }
        function power() {
            const base = atom();
            if (peek() === '^') { i++; return { op: '^', a: base, b: unary() }; }
            return base;
        }
        function atom() {
            const t = toks[i++];
            if (t == null) throw new Error('Unexpected end in ' + src);
            if (/^\d/.test(t)) return { num: parseFloat(t) };
            if (t === '(') { const e = expr(); eat(')'); return e; }
            if (/^[a-zA-Z]/.test(t)) {
                if (peek() === '(') {
                    if (!FUNCS[t]) throw new Error('Unknown function ' + t);
                    i++;
                    const args = [];
                    if (peek() !== ')') { args.push(expr()); while (peek() === ',') { i++; args.push(expr()); } }
                    eat(')');
                    return { fn: t, args };
                }
                return { v: t };
            }
            throw new Error('Unexpected ' + t + ' in ' + src);
        }
        const ast = expr();
        if (i !== toks.length) throw new Error('Trailing input in ' + src);
        astCache[src] = ast;
        return ast;
    }

    function evalAst(n, env) {
        if (n.num != null) return n.num;
        if (n.v != null) {
            if (!(n.v in env)) throw new Error('No value for ' + n.v);
            return env[n.v];
        }
        if (n.fn) return FUNCS[n.fn].apply(null, n.args.map(a => evalAst(a, env)));
        const a = evalAst(n.a, env);
        switch (n.op) {
            case 'neg': return -a;
            case '+': return a + evalAst(n.b, env);
            case '-': return a - evalAst(n.b, env);
            case '*': return a * evalAst(n.b, env);
            case '/': return a / evalAst(n.b, env);
            case '^': return Math.pow(a, evalAst(n.b, env));
        }
        throw new Error('Bad node');
    }

    function evaluate(src, env) { return evalAst(parse(String(src)), env || {}); }

    function identsOf(src) {
        const out = [];
        (function walk(n) {
            if (n.v != null) { if (out.indexOf(n.v) < 0) out.push(n.v); return; }
            if (n.fn) { n.args.forEach(walk); return; }
            if (n.a) walk(n.a);
            if (n.b) walk(n.b);
        })(parse(String(src)));
        return out;
    }

    const close = (a, b) => Number.isFinite(a) && Number.isFinite(b) && Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(a), Math.abs(b));
    const isWhole = x => Number.isFinite(x) && Math.abs(x - Math.round(x)) < 1e-9;

    function smallestFactor(n) {
        if (!isWhole(n) || n < 2) return null;
        n = Math.round(n);
        if (n % 2 === 0) return n === 2 ? n : 2;
        for (let f = 3; f * f <= n; f += 2) if (n % f === 0) return f;
        return n;
    }
    const isPrime = n => smallestFactor(n) === n;

    // Fill in derived values (lets) on top of the free variables.
    function fullEnv(data, env) {
        const out = Object.assign({}, env);
        (data.lets || []).forEach(l => { out[l.name] = evaluate(l.expr, out); });
        return out;
    }

    // Evaluate one claim → { ok, l?, r?, value?, factor?, fail?, cases? }
    function evalClaim(c, env) {
        switch (c.rel) {
            case 'eq': { const l = evaluate(c.l, env), r = evaluate(c.r, env); return { ok: close(l, r), l, r }; }
            case 'neq': { const l = evaluate(c.l, env), r = evaluate(c.r, env); return { ok: Number.isFinite(l) && Number.isFinite(r) && !close(l, r), l, r }; }
            case 'ge': { const l = evaluate(c.l, env), r = evaluate(c.r, env); return { ok: l >= r - 1e-9, l, r }; }
            case 'even': { const v = evaluate(c.l, env); return { ok: isWhole(v) && FUNCS.mod(Math.round(v), 2) === 0, value: v }; }
            case 'odd': { const v = evaluate(c.l, env); return { ok: isWhole(v) && FUNCS.mod(Math.round(v), 2) === 1, value: v }; }
            case 'div': { const v = evaluate(c.l, env), d = evaluate(c.r, env); return { ok: d !== 0 && isWhole(v / d), value: v, d, q: v / d }; }
            case 'prime': { const v = evaluate(c.l, env); const f = smallestFactor(v); return { ok: f === Math.round(v), value: v, factor: f }; }
            case 'both': {
                const parts = c.parts.map(p => evalClaim(p, env));
                return { ok: parts.every(p => p.ok), parts };
            }
            case 'range': {
                // every value of c.v from c.from to c.to satisfies c.each
                let fail = null;
                for (let k = c.from; k <= c.to; k++) {
                    const e = Object.assign({}, env, { [c.v]: k });
                    if (!evalClaim(c.each, e).ok) { fail = k; break; }
                }
                return { ok: fail == null, fail, count: c.to - c.from + 1 };
            }
            case 'cases': {
                // every combination of c.vars in 0..c.m-1: mod(c.l, c.m) is never c.r
                const k = c.vars.length;
                const total = Math.pow(c.m, k);
                let fail = null;
                for (let idx = 0; idx < total && !fail; idx++) {
                    const e = Object.assign({}, env);
                    let t = idx;
                    c.vars.forEach(v => { e[v] = t % c.m; t = Math.floor(t / c.m); });
                    if (FUNCS.mod(evaluate(c.l, e), c.m) === c.r) fail = c.vars.map(v => e[v]);
                }
                const out = { ok: !fail, fail, cases: total };
                if (c.vars.every(v => v in env)) {
                    out.value = evaluate(c.l, env);
                    out.rem = FUNCS.mod(out.value, c.m);
                }
                return out;
            }
        }
        throw new Error('Unknown claim ' + c.rel);
    }

    // The free variables a claim depends on (through lets too); bound ones excluded.
    function claimVars(data, c) {
        const declared = (data.vars || []).map(v => v.name);
        const lets = {};
        (data.lets || []).forEach(l => { lets[l.name] = l.expr; });
        const out = [];
        const add = (src, bound) => identsOf(src).forEach(name => {
            if (bound.indexOf(name) >= 0) return;
            if (lets[name] != null) { add(lets[name], bound); return; }
            if (declared.indexOf(name) >= 0 && out.indexOf(name) < 0) out.push(name);
        });
        (function walk(cl, bound) {
            if (!cl) return;
            if (cl.rel === 'both') { cl.parts.forEach(p => walk(p, bound)); return; }
            if (cl.rel === 'range') { walk(cl.each, bound.concat(cl.v)); return; }
            if (cl.rel === 'cases') { add(cl.l, bound.concat(cl.vars)); return; }
            if (cl.l != null) add(cl.l, bound);
            if (cl.r != null && typeof cl.r === 'string') add(cl.r, bound);
        })(c, []);
        return out;
    }

    // Every name written in a claim (variables and derived values).
    function claimIdents(c) {
        const out = [];
        const add = src => identsOf(src).forEach(n => { if (out.indexOf(n) < 0) out.push(n); });
        (function walk(cl) {
            if (!cl) return;
            if (cl.parts) cl.parts.forEach(walk);
            if (cl.each) walk(cl.each);
            if (cl.l != null) add(cl.l);
            if (typeof cl.r === 'string') add(cl.r);
        })(c);
        return out;
    }

    function stepVars(data, i) {
        const s = data.steps[i];
        return s && s.claim ? claimVars(data, s.claim) : [];
    }

    function testVars(data, i) {
        const used = stepVars(data, i).slice();
        const c = data.steps[i] && data.steps[i].claim;
        // A cases claim binds these letters while checking all combinations,
        // but also shows the student's chosen case in the tester.
        if (c && c.rel === 'cases') c.vars.forEach(v => { if (used.indexOf(v) < 0) used.push(v); });
        return used;
    }

    function domainText(v) {
        const d = v.domain || { type: 'real' };
        if (d.type === 'integer') {
            if (d.min === 0) return 'a whole number, 0 or more (no fractions)';
            if (d.min === 1) return 'a whole number, 1 or more (no fractions)';
            return 'an integer (no fractions; negatives are allowed)';
        }
        return d.min === 0 ? 'a number, 0 or more (fractions are allowed)' : 'a number (fractions and negatives are allowed)';
    }

    // The number tester. env holds values for (some of) the free variables;
    // missing ones take their starting value.
    // vars.min/max are sampling ranges, not the proposition's domain.
    //   → { claim: bool, fits, ok, env?, result?, unmet? }
    function testStep(data, i, env) {
        const s = data.steps[i];
        if (!s || !s.claim) return { claim: false, fits: true, ok: true };
        const base = {};
        const invalid = [];
        (data.vars || []).forEach(v => {
            const raw = env && Object.prototype.hasOwnProperty.call(env, v.name) ? env[v.name] : v.start;
            if (raw == null || (typeof raw === 'string' && !raw.trim())) {
                invalid.push('Enter a number for ' + v.name);
                return;
            }
            const value = (typeof raw === 'number' || typeof raw === 'string') ? Number(raw) : NaN;
            if (!Number.isFinite(value)) {
                invalid.push(v.name + ' must be a finite number');
                return;
            }
            const domain = v.domain || { type: 'real' };
            if ((domain.type === 'integer' && !Number.isInteger(value)) || (domain.min != null && value < domain.min)) {
                invalid.push(v.name + ' = ' + raw + ' is outside the proof: ' + v.name + ' must be ' + domainText(v));
                return;
            }
            base[v.name] = value;
        });
        // Invalid inputs cannot be counterexamples. Reject them before lets or
        // claims are evaluated, including values that would happen to pass.
        if (invalid.length) return { claim: true, fits: false, ok: true, unmet: invalid };
        const e = fullEnv(data, base);
        const used = stepVars(data, i);
        const unmet = (data.given || []).filter(g => claimVars(data, g).some(v => used.indexOf(v) >= 0) && !evalClaim(g, e).ok);
        if (unmet.length) return { claim: true, fits: false, ok: true, env: e, unmet: unmet.map(g => g.say || 'the start of the proof') };
        const result = evalClaim(s.claim, e);
        return { claim: true, fits: true, ok: result.ok, env: e, result };
    }

    // ------------------------------------------------------------------
    // Text helpers
    // ------------------------------------------------------------------

    // 'a^2-a*b' → 'a² − ab'
    function pretty(s) {
        return String(s)
            .replace(/\^2/g, '²').replace(/\^3/g, '³')
            .replace(/sqrt\(/g, '√(')
            .replace(/(\d)\*(?=[a-z(])/g, '$1')
            .replace(/([a-z)²³])\*(?=[a-z(])/g, '$1')
            .replace(/\*/g, '·')
            .replace(/\//g, ' ÷ ')
            .replace(/\+/g, ' + ')
            .replace(/=/g, ' = ')
            .replace(/(^|[(=,])\s*-/g, '$1−')
            .replace(/-/g, ' − ')
            .replace(/\s+/g, ' ').replace(/\( /g, '(').replace(/ \)/g, ')')
            .trim();
    }
    const sq = n => (n < 0 ? '(' + minus(n) + ')' : String(n)) + '²';
    const minus = n => (n < 0 ? '−' + Math.abs(n) : String(n));

    const eq = (l, r, show) => ({ rel: 'eq', l: String(l), r: String(r), show });
    const step = (text, claim) => ({ text, claim: claim || null });

    const LETTERS2 = [['a', 'b'], ['x', 'y'], ['m', 'n'], ['p', 'q']];

    // ------------------------------------------------------------------
    // Flawed templates. Each returns a proof; flawStep is the first false step.
    // ------------------------------------------------------------------

    const T = {};

    T['zero-divide'] = function (rng) {
        const [a, b] = rng.pick(LETTERS2);
        const K = rng.int(0, 7);
        const v = rng.int(0, 1);
        const steps = [step('Let ' + a + ' and ' + b + ' be numbers with ' + a + ' = ' + b + '.', eq(a, b))];
        let flawStep;
        if (v === 0) {
            steps.push(step('Multiply both sides by ' + a + ': ' + pretty(a + '^2=' + a + '*' + b) + '.', eq(a + '^2', a + '*' + b)));
            steps.push(step('Subtract ' + b + '² from both sides: ' + pretty(a + '^2-' + b + '^2=' + a + '*' + b + '-' + b + '^2') + '.', eq(a + '^2-' + b + '^2', a + '*' + b + '-' + b + '^2')));
            steps.push(step('Factor both sides: ' + pretty('(' + a + '+' + b + ')*(' + a + '-' + b + ')=' + b + '*(' + a + '-' + b + ')') + '.', eq('(' + a + '+' + b + ')*(' + a + '-' + b + ')', b + '*(' + a + '-' + b + ')')));
            flawStep = steps.length;
            steps.push(step('Divide both sides by (' + pretty(a + '-' + b) + '): ' + pretty(a + '+' + b + '=' + b) + '.', eq(a + '+' + b, b)));
            steps.push(step('Since ' + a + ' = ' + b + ', write ' + b + ' for ' + a + ': ' + pretty('2*' + b + '=' + b) + '.', eq('2*' + b, b)));
            steps.push(step('Divide both sides by ' + b + ': 2 = 1.', eq(2, 1)));
        } else {
            steps.push(step('Multiply both sides by ' + b + ': ' + pretty(a + '*' + b + '=' + b + '^2') + '.', eq(a + '*' + b, b + '^2')));
            steps.push(step('Subtract ' + a + '² from both sides: ' + pretty(a + '*' + b + '-' + a + '^2=' + b + '^2-' + a + '^2') + '.', eq(a + '*' + b + '-' + a + '^2', b + '^2-' + a + '^2')));
            steps.push(step('Factor both sides: ' + pretty(a + '*(' + b + '-' + a + ')=(' + b + '+' + a + ')*(' + b + '-' + a + ')') + '.', eq(a + '*(' + b + '-' + a + ')', '(' + b + '+' + a + ')*(' + b + '-' + a + ')')));
            flawStep = steps.length;
            steps.push(step('Divide both sides by (' + pretty(b + '-' + a) + '): ' + pretty(a + '=' + b + '+' + a) + '.', eq(a, b + '+' + a)));
            steps.push(step('Since ' + b + ' = ' + a + ': ' + pretty(a + '=2*' + a) + '.', eq(a, '2*' + a)));
            steps.push(step('Divide both sides by ' + a + ': 1 = 2.', eq(1, 2)));
        }
        const end = v === 0 ? [2, 1] : [1, 2];
        if (K) steps.push(step('Add ' + K + ' to both sides: ' + (end[0] + K) + ' = ' + (end[1] + K) + '. ∎', eq(end[0] + K, end[1] + K)));
        else steps[steps.length - 1].text = steps[steps.length - 1].text.replace(/.$/, '') + '. ∎';
        return {
            title: 'Proof that ' + (K ? (end[0] + K) + ' = ' + (end[1] + K) : end[0] + ' = ' + end[1]),
            steps, flawStep,
            vars: [{ name: a, min: -10, max: 10, start: 3, domain: { type: 'real' } }],
            lets: [{ name: b, expr: a }],
            hint: 'Try ' + a + ' = ' + b + ' = 3 in step ' + (flawStep + 1) + '. What is ' + pretty(a + '-' + b) + ' then, and what are you dividing by?',
            explain: a + ' = ' + b + ', so ' + pretty(a + '-' + b) + ' = 0. Step ' + (flawStep + 1) + ' divides both sides by zero.',
        };
    };

    const FALSE_IDS = [
        { l: x => '(' + x + '+A)^2', r: x => x + '^2+AA', min: -10, max: 10 },
        { l: x => '(' + x + '-A)^2', r: x => x + '^2-AA', min: -10, max: 10 },
        { l: x => 'sqrt(' + x + '^2+AA)', r: x => x + '+A', min: 0, max: 12, note: ' ≥ 0' },
    ];
    function falseIdentity(rng) {
        const x = rng.pick(['x', 'y', 't']);
        const A = rng.int(2, 9);
        const f = rng.pick(FALSE_IDS);
        const sub = s => s.replace(/AA/g, String(A * A)).replace(/A/g, String(A));
        return { x, A, L: sub(f.l(x)), R: sub(f.r(x)), min: f.min, max: f.max, every: 'every ' + x + (f.note || '') };
    }

    T['circular'] = function (rng) {
        const f = falseIdentity(rng);
        const L = pretty(f.L), R = pretty(f.R);
        const steps = [
            step('Let ' + f.x + ' be any number' + (f.min === 0 ? ' with ' + f.x + ' ≥ 0' : '') + '.'),
            step('Start with the left side: ' + L + '.'),
            step('Because ' + L + ' = ' + R + ', we can write it as ' + R + '.', eq(f.L, f.R)),
            step('That is exactly the right side, ' + R + '.', eq(f.R, f.R)),
            step('So ' + L + ' = ' + R + ' for ' + f.every + '. ∎', eq(f.L, f.R)),
        ];
        return {
            title: 'Proof that ' + L + ' = ' + R + ' for ' + f.every,
            steps, flawStep: 2,
            vars: [{ name: f.x, min: f.min, max: f.max, start: 1, domain: f.min === 0 ? { type: 'real', min: 0 } : { type: 'real' } }],
            hint: 'Where does step 3 get "' + L + ' = ' + R + '" from? Is that something we already know, or the thing we are trying to show?',
            explain: 'Step 3 uses the claim itself as its reason. Test ' + f.x + ' = 1: the two sides are different, so the claim is false anyway.',
        };
    };

    T['non-sequitur'] = function (rng) {
        const v = rng.int(0, 2);
        if (v === 0) {
            const f = falseIdentity(rng);
            const L = pretty(f.L), R = pretty(f.R);
            return {
                title: 'Proof that ' + L + ' = ' + R + ' for ' + f.every,
                steps: [
                    step('Suppose ' + L + ' = ' + R + '.'),
                    step('Multiply both sides by 0: 0 · ' + L + ' = 0 · ' + (/[+−]/.test(R) ? '(' + R + ')' : R) + '.', eq('0*(' + f.L + ')', '0*(' + f.R + ')')),
                    step('That gives 0 = 0, which is true!', eq(0, 0)),
                    step('A true result came out, so ' + L + ' = ' + R + ' for ' + f.every + '. ∎', eq(f.L, f.R)),
                ],
                flawStep: 3,
                alsoAccept: ['circular'],
                vars: [{ name: f.x, min: f.min, max: f.max, start: 1, domain: f.min === 0 ? { type: 'real', min: 0 } : { type: 'real' } }],
                hint: 'Multiplying by 0 turns ANY equation into 0 = 0, even a false one. So does "0 = 0 is true" tell you anything?',
                explain: 'If the claim were true, 0 = 0 would follow. But 0 = 0 follows from anything, so it does not show the claim. Try ' + f.x + ' = 1.',
            };
        }
        if (v === 1) {
            const A = rng.pick([2, 3, 4, 5]);
            const c = rng.pick([2, 3]);
            const B = A * c;
            const [n, m] = rng.pick([['n', 'm'], ['N', 'k'], ['x', 'j']]);
            const kk = m === 'k' ? 'j' : 'k';
            return {
                title: 'Proof that every multiple of ' + A + ' is a multiple of ' + B,
                steps: [
                    step('Let ' + n + ' be a multiple of ' + A + ': ' + n + ' = ' + A + m + ' for some integer ' + m + ' (no fractions).', { rel: 'div', l: n, r: String(A) }),
                    step('Fact: every multiple of ' + B + ' is also a multiple of ' + A + ' (because ' + B + ' = ' + A + ' × ' + c + ').', { rel: 'div', l: B + '*' + kk, r: String(A) }),
                    step(n + ' is a multiple of ' + A + '.', { rel: 'div', l: n, r: String(A) }),
                    step('So ' + n + ' is a multiple of ' + B + '. ∎', { rel: 'div', l: n, r: String(B) }),
                ],
                flawStep: 3,
                vars: [{ name: m, min: 1, max: 30, start: 2, domain: { type: 'integer' } }, { name: kk, min: 1, max: 30, start: 1, domain: { type: 'integer' } }],
                lets: [{ name: n, expr: A + '*' + m }],
                hint: '"Every multiple of ' + B + ' is a multiple of ' + A + '" does not say "every multiple of ' + A + ' is a multiple of ' + B + '". Try ' + n + ' = ' + A + '.',
                explain: 'Step 2 goes from ' + B + ' to ' + A + '. Step 4 uses it backwards, from ' + A + ' to ' + B + '. ' + A + ' itself is a multiple of ' + A + ' but not of ' + B + '.',
            };
        }
        const [x, y] = rng.pick(LETTERS2);
        return {
            title: 'Proof that if ' + x + ' + ' + y + ' is even, then ' + x + ' and ' + y + ' are both even',
            steps: [
                step('Let ' + x + ' and ' + y + ' be integers (no fractions), and ' + x + ' + ' + y + ' is even.', { rel: 'even', l: x + '+' + y }),
                step('Fact: if two numbers are both even (2s and 2t), their sum 2s + 2t = 2(s + t) is even.', { rel: 'even', l: '2*s+2*t' }),
                step('We know ' + x + ' + ' + y + ' is even.', { rel: 'even', l: x + '+' + y }),
                step('So ' + x + ' and ' + y + ' must both be even. ∎', { rel: 'both', parts: [{ rel: 'even', l: x }, { rel: 'even', l: y }] }),
            ],
            flawStep: 3,
            vars: [{ name: x, min: -8, max: 8, start: 2, domain: { type: 'integer' } }, { name: y, min: -8, max: 8, start: 4, domain: { type: 'integer' } }, { name: 's', min: -5, max: 5, start: 1, domain: { type: 'integer' } }, { name: 't', min: -5, max: 5, start: 2, domain: { type: 'integer' } }],
            given: [{ rel: 'even', l: x + '+' + y, say: x + ' + ' + y + ' must be even' }],
            hint: 'Step 2 says "both even → sum even". Step 4 uses it backwards. Try ' + x + ' = 1 and ' + y + ' = 1.',
            explain: '"Both even → sum even" is true, but "sum even → both even" is not: 1 + 1 = 2 is even and 1 is odd.',
        };
    };

    T['few-cases'] = function (rng, d) {
        const p = d >= 3 ? rng.pick([41, 17]) : rng.pick([11, 17, 41]);
        const minusForm = rng.chance(0.4);
        const expr = minusForm ? 'n^2-n+' + p : 'n^2+n+' + p;
        const last = minusForm ? p - 1 : p - 2;
        const show = rng.int(3, 4);
        const steps = [step('Look at the numbers ' + pretty(expr) + ' for n = 0, 1, 2, 3, …')];
        for (let k = minusForm ? 1 : 0; k <= show; k++) {
            const val = evaluate(expr, { n: k });
            steps.push(step('n = ' + k + ': ' + val + ' is prime ✓', { rel: 'prime', l: String(val) }));
        }
        steps.push(step('The machine checked every n from 0 to ' + last + ': all ' + (last + 1) + ' results are prime ✓',
            { rel: 'range', v: 'n', from: 0, to: last, each: { rel: 'prime', l: expr } }));
        const flawStep = steps.length;
        steps.push(step('So ' + pretty(expr) + ' is prime for every whole number n. ∎', { rel: 'prime', l: expr }));
        return {
            title: 'Proof that ' + pretty(expr) + ' is always prime',
            steps, flawStep,
            vars: [{ name: 'n', min: 0, max: 60, start: 5, domain: { type: 'integer', min: 0 } }],
            hint: 'The last step is about EVERY n, not just the ones checked. Look for a counter-example: try n = ' + p + '.',
            explain: (last + 1) + ' cases in a row is still not "every n": n = ' + (last + 1) + ' gives ' + evaluate(expr, { n: last + 1 }) + ' = ' + p + ' × ' + p + ', which is not prime.',
        };
    };

    T['diagram'] = function (rng) {
        const a = rng.int(5, 11);
        let b = rng.int(5, 12);
        if (b === a) b += 1;
        let c = Math.round(Math.sqrt(a * a + b * b));
        if (c * c === a * a + b * b) c += rng.pick([-1, 1]);
        const area = a * b / 2;
        return {
            title: 'Proof that this triangle has area ' + area,
            steps: [
                step('The triangle in the picture has sides ' + a + ', ' + b + ' and ' + c + '.'),
                step('The corner between the sides ' + a + ' and ' + b + ' looks square, so it is a right angle (90°).',
                    eq(a + '^2+' + b + '^2', c + '^2', 'A right angle needs ' + sq(a) + ' + ' + sq(b) + ' = ' + sq(c) + ' (Pythagoras)')),
                step('By Pythagoras: ' + sq(a) + ' + ' + sq(b) + ' = ' + sq(c) + '.', eq(a + '^2+' + b + '^2', c + '^2')),
                step('The sides ' + a + ' and ' + b + ' are base and height, so the area is ½ × ' + a + ' × ' + b + ' = ' + area + '. ∎',
                    eq('heron(' + a + ',' + b + ',' + c + ')', area, 'Left: the true area, worked out from all three sides. Right: the claimed area, ' + area + '.')),
            ],
            flawStep: 1,
            vars: [],
            diagram: { a, b, c },
            hint: 'Does the corner only LOOK square? A right angle needs ' + sq(a) + ' + ' + sq(b) + ' = ' + sq(c) + '. Test step 2.',
            explain: sq(a) + ' + ' + sq(b) + ' = ' + (a * a + b * b) + ' but ' + sq(c) + ' = ' + (c * c) + '. The corner is close to 90°, but not 90°: the picture fooled the proof.',
        };
    };

    T['off-by-one'] = function (rng) {
        if (rng.chance(0.5)) {
            const P = rng.int(5, 40);
            const Q = P + rng.int(10, 40);
            return {
                title: 'Proof that you read ' + (Q - P) + ' pages',
                steps: [
                    step('You read every page from page ' + P + ' to page ' + Q + ', including both.'),
                    step('From page a to page b there are b − a pages.', eq('count(a,b)', 'b-a', 'Pages from a to b (counted one by one) = b − a')),
                    step(Q + ' − ' + P + ' = ' + (Q - P) + '.', eq(Q + '-' + P, Q - P)),
                    step('So you read ' + (Q - P) + ' pages. ∎', eq('count(' + P + ',' + Q + ')', Q - P, 'Pages from ' + P + ' to ' + Q + ' (counted one by one) = ' + (Q - P))),
                ],
                flawStep: 1,
                vars: [{ name: 'a', min: 1, max: 20, start: 1, domain: { type: 'integer', min: 1 } }, { name: 'b', min: 1, max: 30, start: 3, domain: { type: 'integer', min: 1 } }],
                given: [{ rel: 'ge', l: 'b', r: 'a', say: 'the last page b must come after the first page a' }],
                hint: 'Test step 2 with tiny numbers: from page 1 to page 3 is pages 1, 2, 3. Is that 3 − 1?',
                explain: 'From page 1 to page 3 there are 3 pages, not 3 − 1 = 2. The rule counts the gaps between pages, not the pages: you read ' + (Q - P + 1) + '.',
            };
        }
        const d = rng.int(2, 5);
        const g = rng.int(6, 15);
        const L = d * g;
        return {
            title: 'Proof that the fence needs ' + g + ' posts',
            steps: [
                step('A straight fence is ' + L + ' m long, with a post at each end and one every ' + d + ' m.'),
                step('So there are ' + L + ' ÷ ' + d + ' = ' + g + ' gaps between posts.', eq(L + '/' + d, g)),
                step('Each gap has one post, so k gaps need k posts.', eq('count(0,k)', 'k', 'Posts for k gaps (count them: 0, 1, …, k) = k')),
                step('So the fence needs ' + g + ' posts. ∎', eq('count(0,' + g + ')', g, 'Posts for ' + g + ' gaps (counted) = ' + g)),
            ],
            flawStep: 2,
            vars: [{ name: 'k', min: 1, max: 20, start: 1, domain: { type: 'integer', min: 0 } }],
            hint: 'Test step 3 with k = 1: one gap. How many posts does one gap need?',
            explain: 'One gap needs 2 posts, two gaps need 3: there is always one more post than gaps. The fence needs ' + (g + 1) + '.',
        };
    };

    T['sqrt-sign'] = function (rng) {
        if (rng.chance(0.55)) {
            const p = rng.int(1, 6);
            const q = p + 2 * rng.int(1, 2);
            const s = p + q, h = s / 2, H = h * h;
            const lhs = p + '^2-' + s + '*' + p, rhs = q + '^2-' + s + '*' + q;
            const both = p * p - s * p;
            return {
                title: 'Proof that ' + p + ' = ' + q,
                steps: [
                    step('Start with a true fact: ' + p + '² − ' + s + '·' + p + ' = ' + q + '² − ' + s + '·' + q + ' (both sides are ' + minus(both) + ').', eq(lhs, rhs)),
                    step('Add ' + H + ' to both sides: ' + p + '² − ' + s + '·' + p + ' + ' + H + ' = ' + q + '² − ' + s + '·' + q + ' + ' + H + '.', eq(lhs + '+' + H, rhs + '+' + H)),
                    step('Both sides are perfect squares: (' + p + ' − ' + h + ')² = (' + q + ' − ' + h + ')².', eq('(' + p + '-' + h + ')^2', '(' + q + '-' + h + ')^2')),
                    step('Take the square root of both sides: ' + p + ' − ' + h + ' = ' + q + ' − ' + h + '.', eq(p + '-' + h, q + '-' + h)),
                    step('Add ' + h + ' to both sides: ' + p + ' = ' + q + '. ∎', eq(p, q)),
                ],
                flawStep: 3,
                vars: [],
                hint: 'Work out ' + p + ' − ' + h + ' and ' + q + ' − ' + h + '. They have the same square, but are they the same number?',
                explain: p + ' − ' + h + ' = ' + minus(p - h) + ' and ' + q + ' − ' + h + ' = ' + (q - h) + '. Their squares are equal, but the numbers are opposites. Taking √ gives their absolute values, not the original signed numbers.',
            };
        }
        const x = rng.pick(['x', 'y', 'n']);
        return {
            title: 'Proof that every number is 0',
            steps: [
                step('Let ' + x + ' be any number.'),
                step('A square hides the sign: ' + x + '² = (−' + x + ')².', eq(x + '^2', '(-' + x + ')^2')),
                step('Take the square root of both sides: ' + x + ' = −' + x + '.', eq(x, '-' + x)),
                step('Add ' + x + ' to both sides: 2' + x + ' = 0.', eq('2*' + x, 0)),
                step('So ' + x + ' = 0: every number is zero! ∎', eq(x, 0)),
            ],
            flawStep: 2,
            vars: [{ name: x, min: -10, max: 10, start: 3, domain: { type: 'real' } }],
            hint: 'Try ' + x + ' = 3 in step 3. Is 3 = −3? Both have the same square, 9.',
            explain: x + '² = (−' + x + ')² is true, but equal squares only mean the numbers are equal OR opposite. √(' + x + '²) is |' + x + '|, not ' + x + '.',
        };
    };

    // ------------------------------------------------------------------
    // Correct proofs (every step holds)
    // ------------------------------------------------------------------

    const C = {};

    C['odd'] = function (rng) {
        const [m, n] = rng.pick([['m', 'n'], ['a', 'b'], ['p', 'q']]);
        const both = { rel: 'both', parts: [{ rel: 'odd', l: m }, { rel: 'odd', l: n }] };
        const intro = step('Let ' + m + ' and ' + n + ' be odd: ' + m + ' = 2j + 1 and ' + n + ' = 2k + 1, where j and k are integers (no fractions; negatives are allowed).', both);
        const base = { vars: [{ name: 'j', min: -6, max: 12, start: 2, domain: { type: 'integer' } }, { name: 'k', min: -6, max: 12, start: 3, domain: { type: 'integer' } }],
            lets: [{ name: m, expr: '2*j+1' }, { name: n, expr: '2*k+1' }] };
        if (rng.chance(0.5)) {
            return Object.assign(base, {
                title: 'Proof that odd + odd is always even',
                steps: [intro,
                    step('Add them: ' + m + ' + ' + n + ' = 2j + 2k + 2.', eq(m + '+' + n, '2*j+2*k+2')),
                    step('Take out a factor of 2: ' + m + ' + ' + n + ' = 2(j + k + 1).', eq(m + '+' + n, '2*(j+k+1)')),
                    step('j + k + 1 is an integer, so ' + m + ' + ' + n + ' is even. ∎', { rel: 'even', l: m + '+' + n }),
                ],
                explain: 'Every step holds for any integers j and k, not just the ones you tested: that is what makes it a proof.',
            });
        }
        return Object.assign(base, {
            title: 'Proof that odd × odd is always odd',
            steps: [intro,
                step('Multiply them: ' + m + n + ' = 4jk + 2j + 2k + 1.', eq(m + '*' + n, '4*j*k+2*j+2*k+1')),
                step('Group the even part: ' + m + n + ' = 2(2jk + j + k) + 1.', eq(m + '*' + n, '2*(2*j*k+j+k)+1')),
                step('2jk + j + k is an integer, so ' + m + n + ' is odd. ∎', { rel: 'odd', l: m + '*' + n }),
            ],
            explain: 'Every step is algebra that holds for all integers j and k, so the claim holds for every pair of odd numbers.',
        });
    };

    C['square'] = function (rng) {
        const x = rng.pick(['x', 'y', 't']);
        const c = rng.int(2, 9);
        const neg = rng.chance(0.4);
        const s = neg ? '-' : '+';
        const S = neg ? ' − ' : ' + ';
        const sq2 = '(' + x + s + c + ')';
        return {
            title: 'Proof that ' + pretty(sq2 + '^2') + ' = ' + x + '²' + S + (2 * c) + x + ' + ' + (c * c),
            steps: [
                step('Squaring means multiplying by itself: ' + pretty(sq2 + '^2') + ' = ' + pretty(sq2 + '*' + sq2) + '.', eq(sq2 + '^2', sq2 + '*' + sq2)),
                step('Multiply every part by every part: ' + x + '²' + S + c + x + S + c + x + ' + ' + (c * c) + '.',
                    eq(sq2 + '*' + sq2, x + '^2' + s + c + '*' + x + s + c + '*' + x + '+' + (c * c))),
                step('Collect the like terms: ' + pretty(sq2 + '^2') + ' = ' + x + '²' + S + (2 * c) + x + ' + ' + (c * c) + '. ∎',
                    eq(sq2 + '^2', x + '^2' + s + (2 * c) + '*' + x + '+' + (c * c))),
            ],
            vars: [{ name: x, min: -10, max: 10, start: 2, domain: { type: 'real' } }],
            explain: 'Each step is a rule of algebra that holds for every ' + x + '. Testing numbers can only find mistakes; the algebra is what proves it.',
        };
    };

    C['gauss'] = function (rng) {
        const N = rng.int(2, 10) * 10;
        const V = N * (N + 1) / 2;
        return {
            title: 'Proof that 1 + 2 + … + ' + N + ' = ' + V,
            steps: [
                step('Let n be a whole number, 1 or more. Call the sum S: S = 1 + 2 + 3 + … + n.'),
                step('Write it backwards: S = n + (n − 1) + … + 1.', eq('sum(1,n)', 'sum(1,n)')),
                step('Add the two rows pair by pair: each pair adds up to n + 1.', eq('i+(n+1-i)', 'n+1')),
                step('There are n pairs, so 2S = n(n + 1).', eq('2*sum(1,n)', 'n*(n+1)', '2 × (1 + 2 + … + n) = n(n + 1)')),
                step('So S = n(n + 1) ÷ 2.', eq('sum(1,n)', 'n*(n+1)/2', '1 + 2 + … + n = n(n + 1) ÷ 2')),
                step('For n = ' + N + ': S = ' + N + ' × ' + (N + 1) + ' ÷ 2 = ' + V + '. ∎', eq('sum(1,' + N + ')', V, '1 + 2 + … + ' + N + ' = ' + V)),
            ],
            vars: [{ name: 'n', min: 1, max: 40, start: 4, domain: { type: 'integer', min: 1 } }, { name: 'i', min: 1, max: 40, start: 1, domain: { type: 'integer', min: 1 } }],
            given: [{ rel: 'ge', l: 'n', r: 'i', say: 'the pair number i must be from 1 to n' }],
            explain: 'This is the young Gauss\'s pairing trick. Each step holds for every n, so it proves the formula for all n at once.',
        };
    };

    C['diff-squares'] = function (rng) {
        const P = rng.int(21, 99);
        const D = rng.int(2, 6);
        const Q = P - D;
        const V = P * P - Q * Q;
        return {
            title: 'Proof that ' + P + '² − ' + Q + '² = ' + V,
            steps: [
                step('For any numbers a and b: (a + b)(a − b) = a² − ab + ab − b².', eq('(a+b)*(a-b)', 'a^2-a*b+a*b-b^2')),
                step('The middle terms cancel: (a + b)(a − b) = a² − b².', eq('(a+b)*(a-b)', 'a^2-b^2')),
                step('Use a = ' + P + ' and b = ' + Q + ': ' + P + '² − ' + Q + '² = (' + P + ' + ' + Q + ')(' + P + ' − ' + Q + ').', eq(P + '^2-' + Q + '^2', '(' + P + '+' + Q + ')*(' + P + '-' + Q + ')')),
                step('= ' + (P + Q) + ' × ' + D + ' = ' + V + '. ∎', eq('(' + P + '+' + Q + ')*(' + P + '-' + Q + ')', V)),
            ],
            vars: [{ name: 'a', min: -10, max: 10, start: 5, domain: { type: 'real' } }, { name: 'b', min: -10, max: 10, start: 2, domain: { type: 'real' } }],
            explain: 'The general rule holds for all a and b, and the arithmetic checks out, so the result is proved.',
        };
    };

    // The "inhuman" machine proof: correct, by brute force over hundreds of cases.
    function machineProof(rng) {
        const v = rng.pick([
            { pow: 2, m: 8, r: 7, name: 'squares' },
            { pow: 3, m: 9, r: rng.pick([4, 5]), name: 'cubes' },
        ]);
        const P = v.pow;
        const sup = P === 2 ? '²' : '³';
        const expr = 'a^' + P + '+b^' + P + '+c^' + P;
        const shown = 'a' + sup + ' + b' + sup + ' + c' + sup;
        const total = v.m * v.m * v.m;
        const steps = [
            step('Claim: ' + shown + ' never leaves remainder ' + v.r + ' when divided by ' + v.m + ', for any integers a, b, c (no fractions).'),
            step('Adding ' + v.m + ' to a number never changes the remainder of its ' + v.name.slice(0, -1) + ' ÷ ' + v.m + '. So only the remainders 0 to ' + (v.m - 1) + ' of a, b and c matter.',
                eq('mod((a+' + v.m + '*t)^' + P + ',' + v.m + ')', 'mod(a^' + P + ',' + v.m + ')', 'Remainder of (a + ' + v.m + 't)' + sup + ' ÷ ' + v.m + ' = remainder of a' + sup + ' ÷ ' + v.m)),
            step('That leaves ' + v.m + ' × ' + v.m + ' × ' + v.m + ' = ' + total + ' cases. Checking all of them.'),
        ];
        const seen = {};
        for (let k = 0; k < 3; k++) {
            let a, b, c, key;
            do { a = rng.int(0, v.m - 1); b = rng.int(0, v.m - 1); c = rng.int(0, v.m - 1); key = a + ',' + b + ',' + c; } while (seen[key]);
            seen[key] = 1;
            const val = Math.pow(a, P) + Math.pow(b, P) + Math.pow(c, P);
            steps.push(step('Case (' + a + ', ' + b + ', ' + c + '): ' + [a, b, c].map(x => Math.pow(x, P)).join(' + ') + ' = ' + val + ' → remainder ' + (val % v.m) + ' ✓',
                eq('mod(' + val + ',' + v.m + ')', val % v.m)));
        }
        const casesClaim = { rel: 'cases', l: expr, vars: ['a', 'b', 'c'], m: v.m, r: v.r, show: 'Remainder of ' + shown + ' ÷ ' + v.m };
        const grid = step('… ' + (total - 3) + ' more cases, one cell each … all ✓', casesClaim);
        grid.grid = total;
        steps.push(grid);
        steps.push(step('None of the ' + total + ' cases leaves remainder ' + v.r + '.', casesClaim));
        steps.push(step('So ' + shown + ' never leaves remainder ' + v.r + ' when divided by ' + v.m + '. ∎',
            { rel: 'neq', l: 'mod(' + expr + ',' + v.m + ')', r: String(v.r), show: 'Remainder of ' + shown + ' ÷ ' + v.m + ' ≠ ' + v.r }));
        return {
            title: 'Proof that ' + shown + ' never leaves remainder ' + v.r + ' when divided by ' + v.m,
            steps,
            vars: [{ name: 'a', min: -12, max: 12, start: 1, domain: { type: 'integer' } }, { name: 'b', min: -12, max: 12, start: 2, domain: { type: 'integer' } }, { name: 'c', min: -12, max: 12, start: 3, domain: { type: 'integer' } },
                { name: 't', min: 0, max: 5, start: 1, domain: { type: 'integer' } }],
            cases: total,
            explain: 'Every step holds: the machine really did check all ' + total + ' cases. Nobody will read them all, so we trust the program, and that trust needs checking too.',
        };
    }

    // ------------------------------------------------------------------
    // generate
    // ------------------------------------------------------------------

    const EASY_FLAWS = ['zero-divide', 'few-cases', 'off-by-one', 'sqrt-sign', 'diagram'];

    function shuffleWithCorrect(rng, options, correctIndex) {
        const order = rng.shuffle(options.map((_, i) => i));
        return { options: order.map(i => options[i]), correct: order.indexOf(correctIndex) };
    }

    function trustFor(rng, kind, cases) {
        if (kind === 'machine') {
            return Object.assign({ question: 'No human will read all ' + cases + ' cases. Should you trust this proof?' }, shuffleWithCorrect(rng, [
                'Only if the program itself can be checked, and independent programs (run by other people) get the same result.',
                'Yes. With so many cases checked, it must be right.',
                'Yes. The machine printed ∎, so it is proved.',
                'No. A proof never counts unless one person checks every case by hand.',
            ], 0));
        }
        return Object.assign({ question: 'This proof holds. Would you trust the machine\'s NEXT proof without checking it?' }, shuffleWithCorrect(rng, [
            'No. I would still need to check each step, or have someone independent check it.',
            'Yes. It was right this time, so it will be right next time.',
            'Yes. Machines do not make mistakes in maths.',
            'No. A proof written by a machine can never be true.',
        ], 0));
    }

    function generate(rng, difficulty) {
        const d = Math.max(1, Math.min(3, Math.round(Number(difficulty) || 1)));
        const roll = rng.next();
        let kind;
        if (d === 1) kind = 'flawed';
        else if (d === 2) kind = roll < 0.3 ? 'correct' : 'flawed';
        else kind = roll < 0.3 ? 'machine' : roll < 0.5 ? 'correct' : 'flawed';

        let proof, flaw = null, template;
        if (kind === 'flawed') {
            flaw = rng.pick(d === 1 ? EASY_FLAWS : FLAW_IDS);
            template = flaw;
            proof = T[flaw](rng, d);
        } else if (kind === 'correct') {
            template = rng.pick(Object.keys(C));
            proof = C[template](rng, d);
        } else {
            template = 'machine';
            proof = machineProof(rng);
        }

        const data = {
            difficulty: d,
            kind,
            template,
            title: proof.title,
            steps: proof.steps,
            vars: proof.vars || [],
            lets: proof.lets || [],
            given: proof.given || [],
            flawStep: kind === 'flawed' ? proof.flawStep : null,
            flaw,
            alsoAccept: proof.alsoAccept || [],
            diagram: proof.diagram || null,
            cases: proof.cases || null,
            hint: proof.hint || null,
            explain: proof.explain,
        };
        if (kind === 'flawed') {
            const nOpts = d === 1 ? 3 : d === 2 ? 4 : FLAW_IDS.length;
            const others = rng.shuffle(FLAW_IDS.filter(id => id !== flaw && data.alsoAccept.indexOf(id) < 0)).slice(0, nOpts - 1);
            data.flawOptions = rng.shuffle([flaw].concat(others));
        } else {
            data.trust = trustFor(rng, kind, data.cases || data.steps.length);
        }
        data.whySeed = rng.int(1, 1e6);
        return data;
    }

    // ------------------------------------------------------------------
    // check, hints, why, solve
    // ------------------------------------------------------------------

    function checkAnswer(data, answer) {
        if (!data || !answer || typeof answer !== 'object' || !('step' in answer)) {
            return { solved: false, partial: 0, feedback: 'Pick the step that breaks, or say every step holds.' };
        }
        const n = data.steps.length;
        const stepIx = answer.step;
        if (stepIx !== null && !(Number.isInteger(stepIx) && stepIx >= 0 && stepIx < n)) {
            return { solved: false, partial: 0, feedback: 'That step is not on the tape.' };
        }
        if (data.kind === 'flawed') {
            if (stepIx === null) {
                return { solved: false, partial: 0, feedback: 'One step does break. Test with numbers allowed by the assumptions: plug the same value into both sides.' };
            }
            if (stepIx < data.flawStep) {
                return { solved: false, partial: 0, feedback: 'Step ' + (stepIx + 1) + ' holds under the stated assumptions. Check the algebra, not just a few examples. The flaw is further along the tape.' };
            }
            if (stepIx > data.flawStep) {
                return { solved: false, partial: 0.2, feedback: 'Step ' + (stepIx + 1) + ' is wrong, but only because of an earlier step. Find the FIRST step that breaks.' };
            }
            const ok = answer.flaw === data.flaw || data.alsoAccept.indexOf(answer.flaw) >= 0;
            if (!ok) {
                return { solved: false, partial: 0.6, feedback: 'Right step! But that is not what goes wrong there. What kind of mistake is it?' };
            }
            return { solved: true, partial: 1, feedback: 'Found it: step ' + (data.flawStep + 1) + '. ' + FLAWS[data.flaw].explain };
        }
        if (stepIx !== null) {
            return { solved: false, partial: 0, feedback: 'Step ' + (stepIx + 1) + ' actually holds under the stated assumptions. A few matching examples alone would not prove that.' };
        }
        if (answer.trust !== data.trust.correct) {
            return { solved: false, partial: 0.6, feedback: 'Yes, every step holds! Now think again: what would it take to trust the machine?' };
        }
        return {
            solved: true, partial: 1,
            feedback: data.kind === 'machine'
                ? 'Every step holds, and you know why trusting it is a question of checking the checker.'
                : 'Every step holds, and one good proof is not a reason to stop checking.',
        };
    }

    function hintsFor(data) {
        if (data.kind === 'flawed') {
            return [
                'Click a step and test it with an allowed number: plug the same value into both sides and see if they stay equal.',
                data.hint,
                'Look closely at step ' + (data.flawStep + 1) + '. ' + FLAWS[data.flaw].label + '.',
            ];
        }
        if (data.kind === 'machine') {
            return [
                'Test a few steps and a few cases. Does any of them fail?',
                'Every step holds. The real question is the last one: how could anyone trust ' + data.cases + ' cases nobody reads?',
                'Think of the four colour theorem: people trusted it once the program was checked and other programs got the same answer.',
            ];
        }
        return [
            'Test every step with two or three different numbers. A flaw only needs one counter-example.',
            'Tests can find a flaw. To stamp "every step holds", justify every step for all allowed numbers.',
            'Every step holds. Now: does one good proof mean you can stop checking the next one?',
        ];
    }

    function whyFor(data) {
        const s = shuffleWithCorrect(Rift.makeRng(data.whySeed || 1), [
            'Someone can check that every step follows from the one before.',
            'The machine that wrote it is very confident.',
            'The final answer looks neat.',
            'Most people agree with it.',
        ], 0);
        return {
            question: 'What turns a printed proof into mathematical knowledge?',
            options: s.options,
            correct: s.correct,
            explain: 'A proof is knowledge only when its steps can be checked. When machines write proofs too long for any human to read, we check the machine instead: open code, independent programs, and people who re-run them.',
        };
    }

    function solveFor(data) {
        if (data.kind === 'flawed') return { step: data.flawStep, flaw: data.flaw };
        return { step: null, flaw: null, trust: data.trust.correct };
    }

    // ------------------------------------------------------------------
    // DOM
    // ------------------------------------------------------------------

    const fmt = x => {
        if (!Number.isFinite(x)) return Number.isNaN(x) ? 'undefined' : (x > 0 ? '∞' : '−∞');
        const r = Math.round(x * 1e6) / 1e6;
        return minus(r);
    };

    function triangleSvg(dg) {
        // the real triangle: side a along the bottom, angle C from the cosine rule
        const { a, b, c } = dg;
        const cosC = (a * a + b * b - c * c) / (2 * a * b);
        const C = Math.acos(Math.max(-1, Math.min(1, cosC)));
        const px = [[0, 0], [a, 0], [b * Math.cos(C), b * Math.sin(C)]];
        const xs = px.map(p => p[0]), ys = px.map(p => p[1]);
        const minX = Math.min(...xs), maxX = Math.max(...xs), maxY = Math.max(...ys);
        const S = 150 / Math.max(maxX - minX, maxY);
        const pt = p => [20 + (p[0] - minX) * S, 170 - p[1] * S];
        const [P0, P1, P2] = px.map(pt);
        const mid = (u, v) => [(u[0] + v[0]) / 2, (u[1] + v[1]) / 2];
        const m1 = mid(P0, P1), m2 = mid(P0, P2), m3 = mid(P1, P2);
        return '<svg viewBox="0 0 200 190" class="om-tri" aria-label="triangle">'
            + '<polygon points="' + [P0, P1, P2].map(p => p.join(',')).join(' ') + '" fill="rgba(242,182,50,0.12)" stroke="#F2B632" stroke-width="2.5" stroke-linejoin="round"/>'
            + '<path d="M' + (P0[0] + 14) + ',' + P0[1] + ' L' + (P0[0] + 14) + ',' + (P0[1] - 14) + ' L' + P0[0] + ',' + (P0[1] - 14) + '" fill="none" stroke="#EFE3C8" stroke-width="1.5" stroke-dasharray="3 2"/>'
            + '<text x="' + m1[0] + '" y="' + (m1[1] + 16) + '" text-anchor="middle">' + a + '</text>'
            + '<text x="' + (m2[0] - 12) + '" y="' + m2[1] + '" text-anchor="middle">' + b + '</text>'
            + '<text x="' + (m3[0] + 12) + '" y="' + (m3[1] - 4) + '" text-anchor="middle">' + c + '</text>'
            + '</svg>';
    }

    function mount(container, data, api) {
        const el = Rift.el;
        const A = Rift.Assets;
        const sfx = name => { try { if (api && api.sfx) api.sfx(name); } catch (e) { /* sound is optional */ } };
        const say = text => { try { if (api && api.say) api.say(text, 'oracle-machine'); } catch (e) { /* optional */ } };
        const timers = [];
        const later = (fn, ms) => { timers.push(root.setTimeout(fn, ms)); };

        const st = {
            sel: null,          // step shown in the tester
            accused: undefined, // undefined = undecided, number = step, null = every step holds
            done: false,
            values: {},
            tested: {},         // step → last result (ok / broke)
        };
        (data.vars || []).forEach(v => { st.values[v.name] = v.start; });

        // ---- frame ----
        const top = el('div.om-top', null, [
            el('span.chip', { dataset: { colour: 'reason' }, text: Rift.COLOURS.reason.icon + ' The Oracle Machine' }),
            el('span.om-piece', { text: 'check every step' }),
            el('span.om-piece', { text: 'one counter-example breaks a step' }),
            el('span.om-piece', { text: data.difficulty < 2 ?'find the first broken step' : 'or stamp it: every step holds' }),
        ]);

        const poseImg = A && A.img
            ? A.img('npc/oracle-machine/neutral', { className: 'om-oracle', colour: 'reason', label: 'oracle machine' })
            : el('span.om-oracle');
        function pose(name) {
            if (!A || !A.src) return;
            poseImg.src = A.src('npc/oracle-machine/' + name, { colour: 'reason', label: 'oracle ' + name });
            poseImg.classList.toggle('glitch', name === 'glitch');
        }
        const bubble = el('div.om-bubble');
        const claimCard = el('div.om-claim', null, [
            el('div.om-claimcap', { text: 'The machine claims' }),
            el('div.om-claimtext', { text: data.title.replace(/^Proof that /, '') }),
        ]);
        const machineCol = el('div.om-machine', null, [el('div.om-glass', null, [poseImg]), bubble, claimCard]);
        if (data.diagram) machineCol.appendChild(el('div.om-diagram', { html: triangleSvg(data.diagram) }));

        const tape = el('div.om-tape');
        const stepBtns = data.steps.map((s, i) => {
            const kids = [el('span.om-num', { text: String(i + 1) }), el('span.om-text', { text: s.text })];
            if (s.grid) {
                const g = el('span.om-grid');
                for (let k = 0; k < s.grid; k++) g.appendChild(el('i'));
                kids.push(g);
            }
            const b = el('button.om-step', { style: { '--i': String(i) }, onclick: () => select(i) }, kids);
            return b;
        });
        stepBtns.forEach(b => tape.appendChild(b));
        const holdsBtn = el('button.om-holds', { style: { '--i': String(data.steps.length) }, onclick: () => accuse(null) }, [
            el('span.om-stamp', { text: '∎' }), el('span', { text: 'Every step holds' }),
        ]);
        tape.appendChild(holdsBtn);
        const tapeWrap = el('div.om-tapewrap', null, [el('div.om-mouth'), tape]);

        const tester = el('div.om-tester');
        const verdict = el('div.om-verdict');
        const side = el('div.om-side', null, [tester, verdict]);

        const main = el('div.om-main', null, [machineCol, tapeWrap, side]);
        const rootEl = el('div.om-root', null, [top, main]);
        try { if (root.getComputedStyle(container).position === 'static') container.style.position = 'relative'; } catch (e) { /* ignore */ }
        container.appendChild(rootEl);

        function speak(text) {
            bubble.textContent = text;
            bubble.classList.remove('pop');
            void bubble.offsetWidth;
            bubble.classList.add('pop');
        }

        // ---- the tape ----
        function renderTape() {
            stepBtns.forEach((b, i) => {
                b.classList.toggle('sel', st.sel === i);
                b.classList.toggle('accused', st.accused === i);
                b.classList.toggle('broke', st.tested[i] === 'broke');
                b.classList.toggle('held', st.tested[i] === 'held');
            });
            holdsBtn.classList.toggle('accused', st.accused === null);
        }

        function select(i) {
            if (st.done) return;
            sfx('click');
            st.sel = i;
            renderTape();
            renderTester(null);
        }

        // ---- the number tester ----
        function varRow(v) {
            const domain = v.domain || { type: 'real' };
            const input = el('input.om-val', {
                type: 'number', value: String(st.values[v.name]), step: domain.type === 'integer' ? '1' : 'any',
                min: domain.min, title: v.name + ' must be ' + domainText(v),
                oninput: () => { st.values[v.name] = input.value; },
            });
            const bump = d => { st.values[v.name] = (Number(st.values[v.name]) || 0) + d; input.value = String(st.values[v.name]); sfx('click'); };
            return el('div.om-variable', null, [
                el('div.om-varrow', null, [
                    el('span.om-var', { text: v.name + ' =' }),
                    el('button.om-bump', { text: '−', title: 'one less', onclick: () => bump(-1) }),
                    input,
                    el('button.om-bump', { text: '+', title: 'one more', onclick: () => bump(1) }),
                ]),
                el('div.om-muted', { text: domainText(v) }),
            ]);
        }

        function resultLines(res, claim) {
            const r = res.result;
            const lines = [];
            const label = claim.show ? el('div.om-show', { text: claim.show }) : null;
            if (label) lines.push(label);
            switch (claim.rel) {
                case 'eq': case 'neq': case 'ge':
                    lines.push(el('div.om-side-val', null, [el('span', { text: 'Left side' }), el('b', { text: fmt(r.l) })]));
                    lines.push(el('div.om-side-val', null, [el('span', { text: 'Right side' }), el('b', { text: fmt(r.r) })]));
                    break;
                case 'even': case 'odd':
                    lines.push(el('div.om-side-val', null, [el('span', { text: 'Value' }), el('b', { text: fmt(r.value) + (isWhole(r.value) ? (FUNCS.mod(Math.round(r.value), 2) ? ' (odd)' : ' (even)') : '') })]));
                    break;
                case 'div':
                    lines.push(el('div.om-side-val', null, [el('span', { text: fmt(r.value) + ' ÷ ' + fmt(r.d) }), el('b', { text: fmt(r.q) })]));
                    break;
                case 'prime':
                    lines.push(el('div.om-side-val', null, [el('span', { text: 'Value' }), el('b', { text: fmt(r.value) })]));
                    if (!r.ok && r.factor) lines.push(el('div.om-detail', { text: fmt(r.value) + ' = ' + r.factor + ' × ' + fmt(r.value / r.factor) }));
                    break;
                case 'both':
                    r.parts.forEach((p, k) => {
                        const c = claim.parts[k];
                        lines.push(el('div.om-side-val', null, [el('span', { text: c.l + ' (' + c.rel + '?)' }), el('b', { text: fmt(p.value) + (p.ok ? ' ✓' : ' ✗') })]));
                    });
                    break;
                case 'range':
                    lines.push(el('div.om-detail', { text: 'Re-checked all ' + r.count + ' cases: ' + (r.ok ? 'all hold.' : 'n = ' + r.fail + ' fails.') }));
                    break;
                case 'cases':
                    if (r.value != null) lines.push(el('div.om-side-val', null, [el('span', { text: 'This case' }), el('b', { text: fmt(r.value) + ' → remainder ' + r.rem })]));
                    lines.push(el('div.om-detail', { text: 'Re-ran all ' + r.cases + ' cases: ' + (r.ok ? 'none gives remainder ' + claim.r + '.' : 'case (' + r.fail.join(', ') + ') does!') }));
                    break;
            }
            return lines;
        }

        function renderTester(res) {
            tester.innerHTML = '';
            tester.appendChild(el('div.om-head', { text: '🔍 Test a step with numbers' }));
            if (st.sel == null) {
                tester.appendChild(el('div.om-muted', { text: 'Click a step on the tape. Then plug in a number and see if both sides really agree.' }));
                return;
            }
            const s = data.steps[st.sel];
            tester.appendChild(el('div.om-seltext', null, [el('b', { text: 'Step ' + (st.sel + 1) + ': ' }), s.text]));
            if (!s.claim) {
                tester.appendChild(el('div.om-muted', { text: 'This line only sets things up. There is nothing to test here.' }));
            } else {
                const used = testVars(data, st.sel);
                const vars = used.map(name => (data.vars.find(v => v.name === name) || { name, start: 1 }));
                vars.forEach(v => { if (st.values[v.name] == null) st.values[v.name] = v.start; });
                if (vars.length) tester.appendChild(el('div.om-vars', null, vars.map(varRow)));
                else tester.appendChild(el('div.om-muted', { text: 'No letters here: just work out both sides.' }));
                tester.appendChild(el('button.btn.small.om-testbtn', { text: vars.length ? 'Plug in and test' : 'Work it out', onclick: () => runTest() }));
                if (res) {
                    const box = el('div.om-result' + (!res.fits ? '.unfit' : res.ok ? '.good' : '.bad'));
                    if (!res.fits) {
                        box.appendChild(el('div', { text: 'These inputs do not fit the proof: ' + res.unmet.join('; ') + '. This is not a counterexample.' }));
                    } else {
                        const named = claimIdents(s.claim);
                        (data.lets || []).filter(l => named.indexOf(l.name) >= 0).forEach(l => box.appendChild(el('div.om-detail', { text: l.name + ' = ' + pretty(l.expr) + ' = ' + fmt(res.env[l.name]) })));
                        resultLines(res, s.claim).forEach(n => box.appendChild(n));
                        box.appendChild(el('div.om-verdictline', { text: res.ok ? '✓ Holds for these numbers.' : '✗ Fails for these numbers!' }));
                    }
                    tester.appendChild(box);
                }
            }
            if (!st.done) {
                tester.appendChild(el('button.btn.small.om-accuse', { text: '⚠ This step breaks', onclick: () => accuse(st.sel) }));
            }
        }

        function runTest() {
            const env = {};
            testVars(data, st.sel).forEach(k => { env[k] = st.values[k]; });
            let res;
            try { res = testStep(data, st.sel, env); } catch (e) { res = { claim: true, fits: false, ok: true, unmet: ['the machine could not read those numbers'] }; }
            if (res.fits) {
                if (!res.ok) st.tested[st.sel] = 'broke';
                else if (st.tested[st.sel] !== 'broke') st.tested[st.sel] = 'held';
                sfx(res.ok ? 'place' : 'error');
                if (!res.ok) { speak('That… does not compute.'); pose('surprised'); } else { pose('neutral'); }
            }
            renderTape();
            renderTester(res);
        }

        // ---- verdicts ----
        function accuse(i) {
            if (st.done) return;
            sfx('place');
            st.accused = i;
            renderTape();
            renderVerdict();
        }

        let lastFeedback = null;
        function renderVerdict() {
            verdict.innerHTML = '';
            verdict.appendChild(el('div.om-head', { text: '⚖ Your verdict' }));
            if (st.done) {
                verdict.appendChild(el('div.om-feedback.good', { text: lastFeedback || '' }));
                verdict.appendChild(el('div.om-explain', { text: data.explain }));
                return;
            }
            if (st.accused === undefined) {
                verdict.appendChild(el('div.om-muted', { text: 'Find the FIRST step that breaks and press "This step breaks". Or, if every step holds, press the ∎ stamp at the end of the tape.' }));
            } else if (st.accused === null) {
                const t = data.trust || trustFor(Rift.makeRng(data.whySeed || 1), 'correct', data.steps.length);
                verdict.appendChild(el('div.om-question', { text: 'You say every step holds. ' + t.question }));
                verdict.appendChild(el('div.om-opts', null, t.options.map((text, k) => el('button.om-opt', { text, onclick: () => send({ step: null, flaw: null, trust: k }, k) }))));
                verdict.appendChild(el('button.om-cancel', { text: '← back to the tape', onclick: () => accuse(undefined) }));
            } else {
                const opts = data.flawOptions || FLAW_IDS;
                verdict.appendChild(el('div.om-question', { text: 'You say step ' + (st.accused + 1) + ' breaks. What kind of mistake is it?' }));
                verdict.appendChild(el('div.om-opts', null, opts.map(id => el('button.om-opt', {
                    text: FLAWS[id].label, dataset: { flaw: id },
                    onclick: () => send({ step: st.accused, flaw: id }, id),
                }))));
                verdict.appendChild(el('button.om-cancel', { text: '← back to the tape', onclick: () => accuse(undefined) }));
            }
            if (lastFeedback) verdict.appendChild(el('div.om-feedback.bad', { text: lastFeedback }));
        }

        function send(answer, pickKey) {
            if (st.done) return;
            sfx('click');
            let r = null;
            try { r = api && api.submit ? api.submit(answer) : checkAnswer(data, answer); } catch (e) { console.error('[oracle]', e); }
            const show = res => {
                if (!res) return;
                lastFeedback = res.feedback;
                if (res.solved) {
                    st.done = true;
                    sfx('success');
                    if (data.kind === 'flawed') {
                        pose('glitch');
                        speak('Err… error… my proof… has a hole.');
                        say('Error. Step ' + (data.flawStep + 1) + ' does not hold. Recalibrating my confidence.');
                        stepBtns[data.flawStep].classList.add('found');
                    } else {
                        pose('happy');
                        speak(data.kind === 'machine' ? 'Check my code, then. I insist.' : 'Correct. But do keep checking me.');
                        say(data.kind === 'machine' ? 'Every case holds. Do not trust me: check the program.' : 'Every step holds. Keep checking me anyway.');
                    }
                } else {
                    sfx('error');
                    pose('surprised');
                    speak(res.partial >= 0.5 ? 'Close. Very close.' : 'My proof stands. Test it properly.');
                    // keep the accused step (to retry the type) only when the step was right
                    if (!(res.partial >= 0.5)) { st.accused = undefined; renderTape(); }
                }
                renderVerdict();
                renderTester(null);
                if (!res.solved) {
                    verdict.querySelectorAll('.om-opt').forEach(b => {
                        if (b.dataset.flaw === pickKey) b.classList.add('wrong');
                    });
                }
            };
            if (r && typeof r.then === 'function') r.then(show, () => {}); else show(r);
        }

        // ---- go ----
        pose('neutral');
        speak('Behold: a proof. Every step is certain.');
        say('I have proved it. My tape never lies. Check it if you dare.');
        renderTape();
        renderTester(null);
        renderVerdict();
        later(() => speak('Click any step. Test me with your numbers.'), 2600);

        return {
            destroy() {
                timers.forEach(id => root.clearTimeout(id));
                if (rootEl.parentNode) rootEl.parentNode.removeChild(rootEl);
            },
        };
    }

    // ------------------------------------------------------------------

    const def = {
        id: 'oracle',
        rules: [
            "Read the claim, assumptions and proof steps. Choose a step to inspect.",
            "Test with numbers allowed by the assumptions. One failed allowed case can break a universal claim.",
            "A few successful tests do not prove a claim for all numbers. Check why every step follows.",
            "Mark whether the proof holds or choose the broken step and flaw. Some proofs are valid; do not assume a trick.",
            "How to play is free. The Hint button shows its heart cost. Think first, then check your answer."
        ],
        tutorial: [
            {
                "text": "The machine prints a proof. Our task is to check the reasoning, not trust its confident voice.",
                "highlight": ".om-claim"
            },
            {
                "text": "Click a numbered step to inspect it. Read the assumptions: a division is allowed only if its divisor is not zero.",
                "highlight": ".om-tape"
            },
            {
                "text": "Example: \"all odd numbers are prime\" fails at 9. Use the number tester to look for a failed case. Testing 3 and 5 alone proves nothing about all odd numbers.",
                "highlight": ".om-tester"
            },
            {
                "text": "If no test breaks it, still ask why each step works for every allowed case. A valid proof needs a general reason.",
                "highlight": ".om-tape"
            },
            {
                "text": "Choose the broken step and flaw, or say the proof holds if every step is justified. Finish the task and read the explanation. How to play is free. The Hint button shows its heart cost. Think first, then check your answer.",
                "highlight": ".om-verdict"
            }
        ],
        name: 'The Oracle Machine',
        colour: 'reason',
        family: 'Proof',
        blurb: 'The Oracle Machine prints a "proof" on its paper tape. Check it step by step: find the step that breaks, or decide whether to trust it.',
        tok: 'A proof is knowledge only if someone can check each step. So what happens when machines write proofs that no human can read?',

        generate,
        check: checkAnswer,
        hints: hintsFor,
        why: whyFor,
        solve: solveFor,
        mount,

        // exposed for tests and tools
        internals: { FLAWS, FLAW_IDS, T, C, machineProof, evaluate, evalClaim, testStep, stepVars, testVars, claimVars, fullEnv, pretty, isPrime },
    };

    Rift.Puzzles.register(def);
})(typeof window !== 'undefined' ? window : globalThis);
