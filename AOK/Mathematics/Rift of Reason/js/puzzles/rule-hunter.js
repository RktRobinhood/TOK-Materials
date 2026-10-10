/*
 * Rule Hunter (Wason's 2-4-6 task) and Pattern Breaker.
 * Colour: memory (colourless). Family: Pattern breakers. Lesson 1.
 *
 * Mode 'rules' (difficulty 1-2): a gatekeeper lets number triples through by a
 * secret rule. The player is shown one triple that fits many rules, builds test
 * triples from wooden tiles 1-30, then names the rule from 4-5 candidates that
 * all fit the starting triple. The legacy `strategy` field counts responses,
 * not intent. Discriminating tests rule out a listed alternative even if they fit.
 *
 * Mode 'pattern' (difficulty 3, or generate(rng, d, { mode: 'pattern' })): a
 * sequence that holds for a while then breaks (Moser's circle, n² + n + 41,
 * 31/331/3331…, Fermat numbers, Mersenne numbers, 111…1²). The player predicts
 * the next term, sees the truth, then answers "what does this teach you?".
 *
 * Pure parts (generate/check/hints/why/solve and the libraries in def.lib) have
 * no DOM and are tested by tools/test/rule-hunter.test.mjs.
 */
(function (root) {
    'use strict';

    const Rift = root.Rift;
    const MAX = 30;                 // tiles 1..30
    const EXAMPLE_MAX = 20;         // starting examples use small numbers
    const DOMAIN_SIZE = MAX * MAX * MAX;

    // ---- number helpers --------------------------------------------------------

    function isPrime(n) {
        if (n < 2) return false;
        if (n % 2 === 0) return n === 2;
        for (let d = 3; d * d <= n; d += 2) if (n % d === 0) return false;
        return true;
    }

    function choose(n, k) {
        if (k < 0 || k > n) return 0;
        let r = 1;
        for (let i = 1; i <= k; i++) r = r * (n - k + i) / i;
        return Math.round(r);
    }

    const even = n => n % 2 === 0;

    // ---- the rule library --------------------------------------------------------
    // level 1: plain rules a beginner can state; level 2: trickier ones.

    const RULES = [
        { id: 'ascending', level: 1, text: 'Each number is bigger than the one before', f: (a, b, c) => a < b && b < c },
        { id: 'descending', level: 1, text: 'Each number is smaller than the one before', f: (a, b, c) => a > b && b > c },
        { id: 'all-even', level: 1, text: 'All three numbers are even', f: (a, b, c) => even(a) && even(b) && even(c) },
        { id: 'all-odd', level: 1, text: 'All three numbers are odd', f: (a, b, c) => !even(a) && !even(b) && !even(c) },
        { id: 'plus-two', level: 1, text: 'Each number is 2 more than the one before', f: (a, b, c) => b === a + 2 && c === b + 2 },
        { id: 'all-different', level: 1, text: 'All three numbers are different', f: (a, b, c) => a !== b && b !== c && a !== c },
        { id: 'first-lt-last', level: 1, text: 'The first number is smaller than the last', f: (a, b, c) => a < c },
        { id: 'middle-largest', level: 1, text: 'The middle number is the largest', f: (a, b, c) => b > a && b > c },
        { id: 'last-largest', level: 1, text: 'The last number is the largest', f: (a, b, c) => c > a && c > b },
        { id: 'first-smallest', level: 1, text: 'The first number is the smallest', f: (a, b, c) => a < b && a < c },
        { id: 'sum-lt-20', level: 1, text: 'The three numbers add up to less than 20', f: (a, b, c) => a + b + c < 20 },
        { id: 'all-under-10', level: 1, text: 'All three numbers are less than 10', f: (a, b, c) => a < 10 && b < 10 && c < 10 },
        { id: 'product-even', level: 2, text: 'The three numbers multiply to an even number', f: (a, b, c) => even(a * b * c) },
        { id: 'has-mult-3', level: 2, text: 'At least one number is a multiple of 3', f: (a, b, c) => a % 3 === 0 || b % 3 === 0 || c % 3 === 0 },
        { id: 'has-prime', level: 2, text: 'At least one number is prime', f: (a, b, c) => isPrime(a) || isPrime(b) || isPrime(c) },
        { id: 'equal-steps', level: 2, text: 'The gaps between the numbers are equal', f: (a, b, c) => b - a === c - b },
        { id: 'last-is-sum', level: 2, text: 'The last number is the first two added together', f: (a, b, c) => c === a + b },
        { id: 'sum-even', level: 2, text: 'The three numbers add up to an even number', f: (a, b, c) => even(a + b + c) },
        { id: 'sum-mult-3', level: 2, text: 'The three numbers add up to a multiple of 3', f: (a, b, c) => (a + b + c) % 3 === 0 },
        { id: 'doubling', level: 2, text: 'Each number is double the one before', f: (a, b, c) => b === 2 * a && c === 2 * b },
        { id: 'middle-even', level: 2, text: 'The middle number is even', f: (a, b, c) => even(b) },
        { id: 'two-same', level: 2, text: 'Exactly two of the numbers are the same', f: (a, b, c) => (a === b) + (b === c) + (a === c) === 1 },
        { id: 'all-mult-3', level: 2, text: 'All three numbers are multiples of 3', f: (a, b, c) => a % 3 === 0 && b % 3 === 0 && c % 3 === 0 },
    ];
    const RULE = {};
    RULES.forEach(r => { RULE[r.id] = r; });

    // Which secret rules each difficulty draws (weights). The classic 2-4-6
    // lesson works best with a broad secret and a tempting narrow decoy.
    const SECRET_POOLS = {
        1: { ascending: 4, 'all-even': 2, 'first-lt-last': 2, 'all-different': 2, 'sum-lt-20': 2, 'last-largest': 2,
            'first-smallest': 1, 'all-under-10': 1, 'middle-largest': 1, descending: 1, 'all-odd': 1, 'plus-two': 1 },
        2: Object.fromEntries(RULES.map(r => [r.id, r.level === 1 ? 1 : 2])),
        3: Object.fromEntries(RULES.filter(r => r.level === 2).map(r => [r.id, 1]).concat([['ascending', 1], ['first-lt-last', 1]])),
    };
    const CANDIDATE_COUNT = { 1: 4, 2: 5, 3: 5 };

    function fits(ruleId, t) {
        return !!RULE[ruleId].f(t[0], t[1], t[2]);
    }

    function validTriple(t) {
        return Array.isArray(t) && t.length === 3 && t.every(n => Number.isInteger(n) && n >= 1 && n <= MAX);
    }

    // Truth tables over the whole tile domain (1..30)³, built once on demand.
    const ix = (a, b, c) => (a - 1) * MAX * MAX + (b - 1) * MAX + (c - 1);
    let SIGS = null;
    function signatures() {
        if (SIGS) return SIGS;
        SIGS = {};
        RULES.forEach(r => {
            const s = new Uint8Array(DOMAIN_SIZE);
            let i = 0;
            for (let a = 1; a <= MAX; a++) for (let b = 1; b <= MAX; b++) for (let c = 1; c <= MAX; c++) s[i++] = r.f(a, b, c) ? 1 : 0;
            SIGS[r.id] = s;
        });
        return SIGS;
    }

    function sameSig(x, y) {
        for (let i = 0; i < DOMAIN_SIZE; i++) if (x[i] !== y[i]) return false;
        return true;
    }

    function subsetSig(x, y) { // every triple in x is in y
        for (let i = 0; i < DOMAIN_SIZE; i++) if (x[i] && !y[i]) return false;
        return true;
    }

    // Triples ordered from "nicest to try" (small, then low sum) for hints/solve.
    let NICE = null;
    function niceTriples() {
        if (NICE) return NICE;
        NICE = [];
        for (let a = 1; a <= MAX; a++) for (let b = 1; b <= MAX; b++) for (let c = 1; c <= MAX; c++) NICE.push([a, b, c]);
        const key = t => Math.max(t[0], t[1], t[2]) * 1000 + (t[0] + t[1] + t[2]) * 10 + (new Set(t).size === 3 ? 0 : 5);
        NICE.sort((p, q) => key(p) - key(q));
        return NICE;
    }

    // A triple where two rules disagree, or null if they agree everywhere.
    function separator(idA, idB) {
        const s = signatures(), x = s[idA], y = s[idB];
        return niceTriples().find(t => x[ix(t[0], t[1], t[2])] !== y[ix(t[0], t[1], t[2])]) || null;
    }

    function failingTriple(id) {
        const s = signatures()[id];
        return niceTriples().find(t => !s[ix(t[0], t[1], t[2])]) || null;
    }

    // Starting examples for a secret rule: small triples that fit it AND as many
    // other rules as possible, like 2-4-6 (best first).
    function topExamples(secretId, count) {
        const s = signatures();
        const out = [];
        for (let a = 1; a <= EXAMPLE_MAX; a++) for (let b = 1; b <= EXAMPLE_MAX; b++) for (let c = 1; c <= EXAMPLE_MAX; c++) {
            const i = ix(a, b, c);
            if (!s[secretId][i]) continue;
            let score = 0;
            for (const r of RULES) score += s[r.id][i];
            out.push({ t: [a, b, c], score, sum: a + b + c });
        }
        out.sort((p, q) => q.score - p.score || p.sum - q.sum || ix(...p.t) - ix(...q.t));
        return out.slice(0, count || 8).map(o => o.t);
    }

    // 1 correct + (k-1) decoys that all fit the example, none equivalent to the
    // secret or to each other on the tile domain. Includes a narrower "trap"
    // rule when one exists (the "+2 each" of 2-4-6).
    function pickCandidates(rng, secretId, example, k) {
        const s = signatures(), sec = s[secretId];
        const pool = RULES.filter(r => r.id !== secretId && fits(r.id, example) && !sameSig(s[r.id], sec));
        const chosen = [];
        const tryAdd = r => {
            if (!r || chosen.length >= k - 1 || chosen.includes(r)) return;
            if (chosen.some(c => sameSig(s[c.id], s[r.id]))) return;
            chosen.push(r);
        };
        const narrower = pool.filter(r => subsetSig(s[r.id], sec));
        const broader = pool.filter(r => subsetSig(sec, s[r.id]));
        if (narrower.length) tryAdd(rng.pick(narrower));
        if (broader.length && rng.chance(0.6)) tryAdd(rng.pick(broader));
        rng.shuffle(pool).forEach(tryAdd);
        if (chosen.length < k - 1) return null;
        return rng.shuffle([RULE[secretId]].concat(chosen)).map(r => r.id);
    }

    function buildRules(rng, secretId, k) {
        const examples = rng.shuffle(topExamples(secretId, 8));
        for (const ex of examples) {
            const ids = pickCandidates(rng, secretId, ex, k);
            if (ids) {
                return {
                    secret: secretId,
                    example: ex.slice(),
                    candidates: ids.map(id => ({ id, text: RULE[id].text })),
                    correct: ids.indexOf(secretId),
                };
            }
        }
        return null;
    }

    function generateRules(rng, difficulty, gatekeeper) {
        const d = Rift.clamp(difficulty | 0 || 1, 1, 3);
        for (let attempt = 0; attempt < 40; attempt++) {
            const secret = rng.weighted(SECRET_POOLS[d]);
            const built = buildRules(rng, secret, CANDIDATE_COUNT[d]);
            if (built) return Object.assign({ mode: 'rules', difficulty: d, gatekeeper, max: MAX, tag: rng.int(0, 1e9) }, built);
        }
        throw new Error('rule-hunter: could not build a rule puzzle');
    }

    // ---- strategy classification ---------------------------------------------

    function cleanTests(tests) {
        return (Array.isArray(tests) ? tests : []).map(t => (Array.isArray(t) ? t.map(Number) : t)).filter(validTriple);
    }

    function classify(data, tests) {
        const yes = tests.filter(t => fits(data.secret, t)).length;
        const no = tests.length - yes;
        return { strategy: no > 0 ? 'tried-to-falsify' : 'confirming-only', yes, no };
    }

    // For each wrong candidate: the first test that showed it differs from the gate.
    function eliminations(data, tests) {
        return data.candidates.map((c, i) => {
            if (i === data.correct) return { index: i, correct: true, ruledOutBy: null };
            const t = tests.find(tt => fits(c.id, tt) !== fits(data.secret, tt));
            return { index: i, correct: false, ruledOutBy: t ? t.slice() : null };
        });
    }

    const fmt = t => '[' + t.join(', ') + ']';

    function checkRules(data, answer) {
        const a = answer || {};
        const tests = cleanTests(a.tests);
        const pick = Number(a.rule);
        const chosen = Number.isInteger(pick) && data.candidates[pick] ? data.candidates[pick] : null;
        const solved = !!chosen && pick === data.correct;
        const { strategy, yes, no } = classify(data, tests);
        const elim = eliminations(data, tests);
        const remaining = elim.filter(e => !e.correct && !e.ruledOutBy).map(e => data.candidates[e.index].text);
        const eliminated = remaining.length === 0;
        const separated = elim.filter(e => !e.correct && e.ruledOutBy).length;
        const discriminating = separated > 0;
        const truth = '"' + RULE[data.secret].text + '"';
        const parts = [];

        if (solved) parts.push('Correct! The rule was ' + truth + '.');
        else parts.push('Not this time. The rule was ' + truth + (chosen ? ', not "' + chosen.text + '".' : '.'));

        if (tests.length === 0) {
            parts.push('No tests were recorded. Your choice alone does not show how you reached this rule.');
        } else if (discriminating) {
            parts.push('Your tests ruled out ' + separated + ' listed alternative rules. A "fits" result can still be useful when another rule predicts "doesn’t fit".');
        } else {
            parts.push('These tests did not separate the listed rules. Try a triple for which two rules predict different answers. A fit or a failure alone does not show what you intended to test.');
        }

        if (solved && !eliminated && tests.length) {
            parts.push('But you were partly lucky: your tests never ruled out "' + remaining[0] + '".');
        } else if (!solved && chosen) {
            const sep = separator(chosen.id, data.secret);
            if (sep) parts.push('One test would have shown it: ' + fmt(sep) + ' ' + (fits(data.secret, sep) ? 'fits the real rule but not yours.' : 'fits your rule but not the real one.'));
        }

        let partial = 0;
        if (solved) partial = eliminated ? 1 : discriminating ? 0.85 : 0.6;
        else partial = discriminating ? 0.25 : 0;

        return {
            solved,
            feedback: parts.join(' '),
            partial,
            strategy,
            discriminating,
            yes,
            no,
            eliminated,
            eliminations: elim,
            secretText: RULE[data.secret].text,
        };
    }

    // ---- pattern breakers ------------------------------------------------------

    const bigPow2 = e => (BigInt(1) << BigInt(e));

    const SEQUENCES = {
        moser: {
            level: 1,
            title: 'Cut the cake',
            intro: ['Put points on a circle.', 'Join every point to every other point with straight lines.', 'Count the pieces inside the circle.'],
            ns: [1, 2, 3, 4, 5], breakN: 6, starts: [0, 1],
            term: n => String(1 + choose(n, 2) + choose(n, 4)),
            label: n => (n === 1 ? '1 point' : n + ' points'),
            note: () => 'pieces',
            question: 'How many pieces with 6 points?',
            options: () => ['32', '31', '30', '24'],
            naive: '32',
            answer: () => '31',
            revealNote: 'not 32!',
            explain: [
                '6 points give 31 pieces, not 32. Count them and see.',
                'The doubling was a coincidence of small numbers.',
                'The real formula is 1 + C(n,2) + C(n,4). Next come 57 and 99.',
            ],
            hint: 'Draw it with 6 points and count very carefully. Is there any reason the number must double?',
        },
        euler41: {
            level: 1,
            title: 'Euler\'s prime machine',
            intro: ['Take n² + n + 41.', 'For n = 0, 1, 2, 3 … every answer is a prime number.', 'Here are the last ones we checked:'],
            ns: Array.from({ length: 40 }, (_, i) => i), breakN: 40, starts: [34, 35, 36, 37],
            term: n => String(n * n + n + 41),
            label: n => 'n = ' + n,
            note: () => 'prime',
            question: 'Is n² + n + 41 prime when n = 40?',
            options: () => ['Prime', 'Not prime'],
            naive: 'Prime',
            answer: () => 'Not prime',
            revealNote: '= 41 × 41',
            explain: [
                'At n = 40: 1600 + 40 + 41 = 1681 = 41 × 41.',
                'Forty primes in a row, and then it breaks.',
                'Forty examples did not prove the rule. One counterexample destroyed it.',
            ],
            hint: 'At n = 40, n² + n = 40 × 41. Now add one more 41.',
        },
        threes: {
            level: 2,
            title: 'The lucky threes',
            intro: ['Write some 3s and put a 1 at the end.', '31, 331, 3331 … every one is a prime number.', 'Here they are:'],
            ns: [1, 2, 3, 4, 5, 6, 7], breakN: 8, starts: [0, 1, 2],
            term: k => '3'.repeat(k) + '1',
            label: k => k + (k === 1 ? ' three' : ' threes'),
            note: () => 'prime',
            question: 'Is the next one, 333333331, prime?',
            options: () => ['Prime', 'Not prime'],
            naive: 'Prime',
            answer: () => 'Not prime',
            revealNote: '= 17 × 19607843',
            explain: [
                '333333331 = 17 × 19607843, so it is not prime.',
                'Seven primes in a row felt like a law. It was luck.',
                'Primes get rarer as numbers grow, so long runs like this always end.',
            ],
            hint: 'Primes get rarer as numbers grow. Seven in a row is lucky, not a law.',
        },
        fermat: {
            level: 2,
            title: 'Fermat\'s mistake',
            intro: ['Fermat (1640) looked at 2 to the power 2ⁿ, plus 1.', 'He found 3, 5, 17, 257, 65537: all prime.', 'He believed every one would be prime.'],
            ns: [0, 1, 2, 3, 4], breakN: 5, starts: [0, 1],
            term: n => String(bigPow2(Math.pow(2, n)) + BigInt(1)),
            label: n => 'n = ' + n,
            note: () => 'prime',
            question: 'Is the next one, 4294967297, prime?',
            options: () => ['Prime', 'Not prime'],
            naive: 'Prime',
            answer: () => 'Not prime',
            revealNote: '= 641 × 6700417',
            explain: [
                'In 1732 Euler showed 4294967297 = 641 × 6700417.',
                'A brilliant mathematician trusted five examples, and he was wrong.',
                'Today nobody knows a single Fermat prime after 65537.',
            ],
            hint: 'Fermat himself believed it. About 90 years later, Euler checked the next one.',
        },
        mersenne: {
            level: 1,
            title: 'Prime in, prime out?',
            intro: ['Take a prime p and work out 2ᵖ − 1.', 'p = 2, 3, 5, 7 give 3, 7, 31, 127.', 'All prime! Prime in, prime out?'],
            ns: [2, 3, 5, 7], breakN: 11, starts: [0, 1],
            term: p => String(bigPow2(p) - BigInt(1)),
            label: p => 'p = ' + p,
            note: () => 'prime',
            question: '11 is prime. Is 2¹¹ − 1 = 2047 prime?',
            options: () => ['Prime', 'Not prime'],
            naive: 'Prime',
            answer: () => 'Not prime',
            revealNote: '= 23 × 89',
            explain: [
                '2047 = 23 × 89, so it is not prime.',
                'Four examples looked like a rule. They were not.',
                'Some 2ᵖ − 1 are prime (8191 is), but no pattern of examples proves which ones.',
            ],
            hint: 'Try dividing 2047 by 23.',
        },
        repunit: {
            level: 1,
            title: 'The number pyramid',
            intro: ['Square numbers made only of 1s.', '11² = 121, 111² = 12321 …', 'Look at the lovely pattern:'],
            ns: [1, 2, 3, 4, 5, 6, 7, 8, 9], breakN: 10, starts: [2, 3, 4],
            term: k => { const r = BigInt('1'.repeat(k)); return String(r * r); },
            label: k => '1'.repeat(k) + '²',
            note: () => '',
            question: 'What is 1111111111² (ten 1s)?',
            options: () => ['12345678910987654321', '1234567900987654321', '1234567890987654321'],
            naive: '12345678910987654321',
            answer: () => '1234567900987654321',
            revealNote: 'the pyramid breaks',
            explain: [
                '1111111111² = 1234567900987654321.',
                'The pyramid only works while each column adds up to less than 10.',
                'With ten 1s a column reaches 10, a 1 carries, and the pattern breaks.',
            ],
            hint: 'Think about long multiplication: what happens when a column adds up to 10?',
        },
    };

    const LESSON = {
        question: 'So what does this teach you?',
        correct: 'A pattern can suggest a rule, but only a proof shows it is always true.',
        wrong: [
            'If a pattern works many times, it must work forever.',
            'The earlier answers must have been calculated wrong.',
            'Patterns in maths always break in the end, so never use them.',
        ],
    };

    function generatePattern(rng, difficulty, gatekeeper, seqId) {
        const d = Rift.clamp(difficulty | 0 || 3, 1, 3);
        const ids = Object.keys(SEQUENCES).filter(id => d >= 3 || SEQUENCES[id].level === 1);
        const id = seqId && SEQUENCES[seqId] ? seqId : rng.pick(ids);
        const s = SEQUENCES[id];
        const start = rng.pick(s.starts);
        const shownNs = s.ns.slice(start);
        const options = rng.shuffle(s.options());
        const lessonOptions = rng.shuffle([LESSON.correct].concat(LESSON.wrong));
        return {
            mode: 'pattern',
            difficulty: d,
            gatekeeper,
            seq: id,
            title: s.title,
            intro: s.intro.slice(),
            terms: shownNs.map(n => ({ n, label: s.label(n), value: s.term(n), note: s.note(n) })),
            ask: { n: s.breakN, label: s.label(s.breakN) },
            held: s.ns.length,
            question: s.question,
            options,
            correct: options.indexOf(s.answer()),
            naive: options.indexOf(s.naive),
            reveal: { value: s.term(s.breakN), note: s.revealNote },
            explain: s.explain.slice(),
            lesson: { question: LESSON.question, options: lessonOptions, correct: lessonOptions.indexOf(LESSON.correct) },
            tag: rng.int(0, 1e9),
        };
    }

    function checkPattern(data, answer) {
        const a = answer || {};
        const predictedTrue = Number(a.predict) === data.correct;
        const fooled = Number(a.predict) === data.naive;
        const lessonRight = Number(a.lesson) === data.lesson.correct;
        const parts = [];
        if (predictedTrue) parts.push('You saw the break coming. Impressive.');
        else if (fooled) parts.push('The pattern fooled you. It has fooled great mathematicians too.');
        else parts.push('The true answer was ' + data.reveal.value + '.');
        if (lessonRight) parts.push('And you got the big idea: a pattern is not a proof. Examples can suggest a rule; only a proof shows it holds every time.');
        else parts.push('But the lesson is different: a pattern can hold ' + data.held + ' times and still break. Examples suggest a rule; only a proof shows it holds every time.');
        return {
            solved: lessonRight,
            feedback: parts.join(' '),
            partial: lessonRight ? 1 : (predictedTrue ? 0.25 : 0),
            predictedTrue,
            fooled,
            strategy: 'pattern',
        };
    }

    // ---- gatekeepers -------------------------------------------------------------

    const KEEPERS = {
        siuuugull: {
            intro: 'SIUUU! My gate lets numbers through by a secret rule. These three got in. What is my rule?',
            fits: ['SIUUU! It fits!', 'Yes! Through the gate!', 'Fits. Perfection. Like me.'],
            nofit: ['No siuuu. Doesn\'t fit.', 'Blocked! Doesn\'t fit.', 'Nope. Not my rule.'],
            again: 'You tried that already. Same jump, same answer.',
            patternIntro: 'Same jump, every time. Patterns never lie… right?',
            patternBreak: 'SIUUU… wait. That is NOT the pattern.',
        },
        beastie: {
            intro: 'Welcome to the gate challenge! Only numbers that follow my secret rule get in. These three made it!',
            fits: ['YES! It fits! Huge!', 'Through the gate! Subscribe!', 'It fits! Bigger cheer!'],
            nofit: ['Doesn\'t fit! Eliminated!', 'Oof. Doesn\'t fit.', 'Nope! Blocked at the gate!'],
            again: 'Already tested! We need NEW content!',
            patternIntro: 'Every one is bigger and better than the last! It can never stop… right?',
            patternBreak: 'WHAT?! It broke! Edit that out!',
        },
    };

    function keeperLines(id) { return KEEPERS[id] || KEEPERS.siuuugull; }

    // ---- hints / why / solve ---------------------------------------------------

    function trapIndex(data) {
        const s = signatures(), sec = s[data.secret];
        let best = -1;
        data.candidates.forEach((c, i) => {
            if (i === data.correct || best >= 0) return;
            if (subsetSig(s[c.id], sec)) best = i;
        });
        if (best < 0) best = data.candidates.findIndex((c, i) => i !== data.correct);
        return best;
    }

    function hints(data) {
        if (data.mode === 'pattern') {
            return [
                'A pattern that works many times is not the same as a rule that must work every time.',
                SEQUENCES[data.seq].hint,
                'For the last question: what can examples show, and what can only a proof show?',
            ];
        }
        const trap = data.candidates[trapIndex(data)];
        const sep = separator(trap.id, data.secret);
        return [
            'Try a triple you think will NOT fit. A "doesn\'t fit" teaches you more than another "fits".',
            'Think of two different rules that both fit ' + fmt(data.example) + '. Find a triple where they disagree, and test it.',
            'Test ' + fmt(sep) + '. The rule "' + trap.text + '" says it ' + (fits(trap.id, sep) ? 'fits' : 'doesn\'t fit') + '. What does the gate say?',
        ];
    }

    function why(data) {
        const rng = Rift.makeRng('rule-hunter:why:' + data.tag);
        let question, correct, wrong, explain;
        if (data.mode === 'pattern') {
            question = 'The pattern worked ' + data.held + ' times in a row. Why is that still not a proof?';
            correct = 'Examples only check the cases you tried. A proof shows why it must work for every case.';
            wrong = [
                'It is a proof; it just needed more examples, like 1000.',
                'Because computers and calculators make mistakes.',
                'Because mathematicians never trust patterns at all.',
            ];
            explain = 'There are infinitely many cases, and examples check only a few. Patterns are where proofs start, not where they end.';
        } else {
            question = 'Why can a few "fits" answers not prove a rule for every possible triple?';
            correct = 'Each test checks one case. A few cases do not establish a rule for every possible triple.';
            wrong = [
                'Because the gatekeeper might be lying.',
                'Because you need at least ten tests to prove a rule.',
                'Because numbers bigger than 30 were not allowed.',
            ];
            explain = 'Confirmation bias means seeking only agreement. Compare what different rules predict. A test can rule out one rule even when it fits another. A few examples still do not prove a rule for infinitely many triples.';
        }
        const options = rng.shuffle([correct].concat(wrong));
        return { question, options, correct: options.indexOf(correct), explain };
    }

    function solve(data) {
        if (data.mode === 'pattern') return { predict: data.correct, lesson: data.lesson.correct };
        const tests = [];
        const add = t => { if (t && !tests.some(x => x.join() === t.join())) tests.push(t.slice()); };
        data.candidates.forEach((c, i) => { if (i !== data.correct) add(separator(c.id, data.secret)); });
        add(failingTriple(data.secret));
        return { rule: data.correct, tests };
    }

    // ---- DOM ---------------------------------------------------------------------

    function keeperName(id) {
        const c = Rift.data && Rift.data.creatures && Rift.data.creatures[id];
        return c ? c.name : id;
    }

    function portrait(id) {
        if (Rift.Assets) return Rift.Assets.img('creature/' + id + '/idle', { colour: 'memory', label: keeperName(id), className: 'rh-portrait' });
        return Rift.el('div.rh-portrait');
    }

    function sfx(api, name) { try { if (api.sfx) api.sfx(name); } catch (e) { /* ignore */ } }

    function tile(el, n, extra) {
        return el('div.rh-tile' + (extra || ''), { text: String(n) });
    }

    function buildKeeper(el, data) {
        const bubble = el('div.rh-bubble', { 'aria-live': 'polite' });
        const col = el('div.rh-keeper', null, [
            bubble,
            portrait(data.gatekeeper),
            el('div.rh-keeper-name', { text: keeperName(data.gatekeeper) }),
        ]);
        let n = 0;
        function say(text) {
            bubble.textContent = text;
            bubble.classList.remove('pop');
            void bubble.offsetWidth;
            bubble.classList.add('pop');
            n++;
        }
        return { col, say };
    }

    function submitAndShow(api, def, data, answer, show) {
        let r = null;
        try { r = api.submit ? api.submit(answer) : null; } catch (e) { r = null; }
        Promise.resolve(r).then(res => show(res && typeof res.solved === 'boolean' ? res : def.check(data, answer)));
    }

    function mountRules(container, data, api, def) {
        const el = api.el || Rift.el;
        const lines = keeperLines(data.gatekeeper);
        const pickLine = list => list[Math.floor((api.rng ? api.rng.next() : Math.random()) * list.length)];
        const state = { slots: [null, null, null], tests: [], chosen: null, pending: false, done: false };
        let result = null;
        const locked = () => state.done || state.pending || !!result;
        const keeper = buildKeeper(el, data);

        // workbench
        const slots = [0, 1, 2].map(i => el('div.rh-slot', { dataset: { i: String(i) }, title: 'Drop a number here' }));
        const testBtn = el('button.btn.primary.rh-test', { text: 'Test it', disabled: true });
        const clearBtn = el('button.btn.small', { text: 'Clear' });
        const tray = el('div.rh-tray');
        for (let n = 1; n <= data.max; n++) {
            const t = el('button.rh-tile.rh-src', { text: String(n), type: 'button', 'aria-label': 'Number ' + n });
            t.addEventListener('pointerdown', ev => startDrag(ev, n, null));
            // Native keyboard activation emits detail 0; pointer placement already runs on pointerup.
            t.addEventListener('click', ev => { if(ev.detail===0)place(n,null); });
            tray.appendChild(t);
        }
        slots.forEach((s, i) => s.addEventListener('pointerdown', ev => {
            if (state.slots[i] != null) startDrag(ev, state.slots[i], i);
        }));
        const nameBtn = el('button.btn.gold.rh-name-btn', { text: 'Name the rule' });

        const bench = el('div.rh-bench', null, [
            el('div.rh-example.parchment', null, [
                el('div.rh-example-label', { text: 'These got through the gate:' }),
                el('div.rh-example-tiles', null, data.example.map(n => tile(el, n, '.small'))),
            ]),
            el('div.rh-build', null, [
                el('div.rh-build-label', { text: 'Build a test:' }),
                el('div.rh-slots', null, slots),
                el('div.rh-build-btns', null, [testBtn, clearBtn]),
            ]),
            tray,
            el('div.rh-bench-foot', null, [
                el('div.rh-tip.muted.small', { text: 'Click or drag tiles into the slots. Click a slot to empty it.' }),
            ]),
        ]);

        // log
        const logList = el('ol.rh-log-list');
        const counts = el('div.rh-counts.small');
        const log = el('div.rh-log.panel', null, [el('h3', { text: 'Your tests' }), counts, logList]);

        const reference = el('section.rh-reference.panel', { 'aria-label': 'Possible rules' }, [
            el('div.row.wrap', { style: { justifyContent: 'space-between' } }, [el('h3', { text: 'Possible rules' }), nameBtn]),
            el('p.small', { text: 'All fit ' + fmt(data.example) + '. Compare them while you test. When ready, choose Name the rule.' }),
            el('ol.rh-reference-list', null, data.candidates.map((c, i) => el('li.parchment', null, [
                el('strong', { text: String.fromCharCode(65 + i) + '. ' }), el('span', { text: c.text }),
            ]))),
        ]);
        const wrap = el('div.rh.rh-rules', null, [keeper.col, bench, log, reference]);
        container.appendChild(wrap);

        function render() {
            slots.forEach((s, i) => {
                s.textContent = state.slots[i] == null ? '' : String(state.slots[i]);
                s.classList.toggle('filled', state.slots[i] != null);
            });
            testBtn.disabled = locked() || state.slots.some(v => v == null);
            clearBtn.disabled = locked();
            nameBtn.disabled = locked();
            tray.querySelectorAll('button').forEach(b => { b.disabled = locked(); });
            const yes = state.tests.filter(t => t.fits).length;
            counts.innerHTML = '';
            counts.appendChild(el('span.rh-yes', { text: '✓ fits: ' + yes }));
            counts.appendChild(el('span.rh-no', { text: '✗ doesn\'t fit: ' + (state.tests.length - yes) }));
            logList.innerHTML = '';
            if (!state.tests.length) logList.appendChild(el('li.rh-empty.muted.small', { text: 'No tests yet.' }));
            state.tests.slice().reverse().forEach((t, j) => {
                logList.appendChild(el('li.rh-log-row' + (t.fits ? '.yes' : '.no'), null, [
                    el('span.rh-log-n.muted', { text: '#' + (state.tests.length - j) }),
                    el('span.rh-log-tiles', null, t.triple.map(n => tile(el, n, '.mini'))),
                    el('span.rh-verdict', { text: t.fits ? '✓ fits' : '✗ doesn\'t fit' }),
                ]));
            });
        }

        function place(value, slotIndex) {
            if (locked()) return;
            let i = slotIndex;
            if (i == null) i = state.slots.indexOf(null);
            if (i < 0) {
                sfx(api, 'error');
                wrap.querySelector('.rh-slots').classList.remove('shake');
                void wrap.offsetWidth;
                wrap.querySelector('.rh-slots').classList.add('shake');
                return;
            }
            state.slots[i] = value;
            sfx(api, 'place');
            render();
        }

        // pointer drag (click = quick place)
        let drag = null;
        function slotAt(x, y) {
            const hit = root.document.elementFromPoint(x, y);
            const s = hit && hit.closest ? hit.closest('.rh-slot') : null;
            return s && wrap.contains(s) ? Number(s.dataset.i) : null;
        }
        function startDrag(ev, value, fromSlot) {
            if (locked() || (ev.button != null && ev.button !== 0)) return;
            ev.preventDefault();
            drag = { value, fromSlot, x0: ev.clientX, y0: ev.clientY, ghost: null };
            root.addEventListener('pointermove', onMove);
            root.addEventListener('pointerup', onUp);
            root.addEventListener('pointercancel', onCancel);
        }
        function onMove(ev) {
            if (!drag) return;
            if (!drag.ghost && Math.hypot(ev.clientX - drag.x0, ev.clientY - drag.y0) > 6) {
                drag.ghost = el('div.rh-tile.rh-ghost', { text: String(drag.value) });
                root.document.body.appendChild(drag.ghost);
                if (drag.fromSlot != null) { state.slots[drag.fromSlot] = null; render(); }
            }
            if (drag.ghost) {
                drag.ghost.style.left = ev.clientX + 'px';
                drag.ghost.style.top = ev.clientY + 'px';
                const over = slotAt(ev.clientX, ev.clientY);
                slots.forEach((s, i) => s.classList.toggle('over', i === over));
            }
        }
        function endListeners() {
            root.removeEventListener('pointermove', onMove);
            root.removeEventListener('pointerup', onUp);
            root.removeEventListener('pointercancel', onCancel);
        }
        function onCancel() {
            endListeners();
            if (drag && drag.ghost) {
                drag.ghost.remove();
                if (drag.fromSlot != null) state.slots[drag.fromSlot] = drag.value;
            }
            drag = null;
            slots.forEach(s => s.classList.remove('over'));
            render();
        }
        function onUp(ev) {
            endListeners();
            const d = drag;
            drag = null;
            slots.forEach(s => s.classList.remove('over'));
            if (!d) return;
            if (!d.ghost) {
                // a click
                if (d.fromSlot != null) { state.slots[d.fromSlot] = null; sfx(api, 'click'); render(); }
                else place(d.value, null);
                return;
            }
            d.ghost.remove();
            const target = slotAt(ev.clientX, ev.clientY);
            if (target == null) { if (d.fromSlot != null) sfx(api, 'click'); render(); return; }
            if (d.fromSlot != null && state.slots[target] != null) state.slots[d.fromSlot] = state.slots[target];
            place(d.value, target);
        }

        testBtn.addEventListener('click', () => {
            if (locked() || state.slots.some(v => v == null)) return;
            const triple = state.slots.slice();
            if (state.tests.some(t => t.triple.join() === triple.join())) { keeper.say(lines.again); sfx(api, 'click'); return; }
            const ok = fits(data.secret, triple);
            state.tests.push({ triple, fits: ok });
            keeper.say(fmt(triple) + '? ' + pickLine(ok ? lines.fits : lines.nofit));
            sfx(api, 'place');
            state.slots = [null, null, null];
            render();
            const row = logList.firstChild;
            if (row) row.classList.add('new');
        });
        clearBtn.addEventListener('click', () => { if (locked()) return; state.slots = [null, null, null]; sfx(api, 'click'); render(); });

        // naming step
        let namer = null;
        nameBtn.addEventListener('click', () => {
            if (locked()) return;
            sfx(api, 'click');
            openNamer();
        });
        function openNamer() {
            if (namer) namer.remove();
            const confirm = el('button.btn.primary', { text: 'This is the rule', disabled: true });
            const cards = data.candidates.map((c, i) => el('button.rh-cand.parchment', {
                type: 'button',
                onclick: () => {
                    if (locked()) return;
                    state.chosen = i;
                    cards.forEach((k, j) => k.classList.toggle('picked', j === i));
                    confirm.disabled = false;
                    sfx(api, 'click');
                },
            }, [el('span.rh-cand-mark', { text: String.fromCharCode(65 + i) }), el('span', { text: c.text })]));
            confirm.addEventListener('click', () => {
                if (state.chosen == null || locked()) return;
                state.pending = true;
                render();
                namer.querySelectorAll('button').forEach(b => { b.disabled = true; });
                const answer = { rule: state.chosen, tests: state.tests.map(t => t.triple.slice()) };
                submitAndShow(api, def, data, answer, showResult);
            });
            namer = el('div.rh-namer', null, [
                el('div.rh-namer-card.panel', null, [
                    el('h3', { text: 'Which rule is the gate using?' }),
                    el('div.muted.small', { text: 'All of these fit ' + fmt(data.example) + '. Only one is the real rule.' }),
                    el('div.rh-cands', null, cards),
                    el('div.rh-namer-btns', null, [
                        el('button.btn.small', { text: 'Keep testing', onclick: () => { sfx(api, 'click'); namer.remove(); namer = null; } }),
                        confirm,
                    ]),
                ]),
            ]);
            bench.scrollTop = 0;
            bench.appendChild(namer);
        }

        function showResult(r) {
            state.pending = false;
            state.done = r.solved;
            sfx(api, r.solved ? 'success' : 'error');
            keeper.say(r.solved ? pickLine(lines.fits).replace(/fits/i, 'you got it') : 'Ha! Not my rule!');
            if (namer) { namer.remove(); namer = null; }
            const elim = r.eliminations || eliminations(data, state.tests.map(t => t.triple));
            const rows = data.candidates.map((c, i) => {
                const e = elim[i];
                let status;
                if (e.correct) status = el('span.rh-st.truth', { text: '★ the real rule' });
                else if (e.ruledOutBy) status = el('span.rh-st.out', { text: 'ruled out by ' + fmt(e.ruledOutBy) });
                else status = el('span.rh-st.open', { text: 'never ruled out by your tests' });
                return el('li' + (i === state.chosen ? '.mine' : ''), null, [el('span.rh-res-text', { text: c.text }), status]);
            });
            const strat = r.discriminating
                ? el('span.chip.rh-strat.good', { text: r.eliminated ? 'Ruled out every listed alternative' : 'Ruled out some listed alternatives' })
                : el('span.chip.rh-strat.bad', { text: state.tests.length ? 'Tests did not separate the listed rules' : 'No tests recorded' });
            bench.scrollTop = 0;
            if (result) result.remove();
            result = el('div.rh-namer.rh-result-wrap', null, [el('div.rh-result.panel' + (r.solved ? '.win' : '.lose'), null, [
                el('h3', { text: r.solved ? 'Rule found!' : 'Wrong rule' }),
                strat,
                el('p', { text: r.feedback }),
                el('ul.rh-res-list', null, rows),
                !r.solved ? el('button.btn.primary', { text: 'Try again', onclick() {
                    if (state.done || result !== shownResult) return;
                    result.remove(); result = null;
                    state.chosen = null;
                    sfx(api, 'click');
                    render();
                } }) : null,
            ])]);
            const shownResult = result;
            bench.appendChild(result);
            render();
        }

        keeper.say(lines.intro);
        render();
        return {
            destroy() {
                endListeners();
                if (drag && drag.ghost) drag.ghost.remove();
                wrap.remove();
            },
        };
    }

    // A small circle-with-chords picture for Moser's circle.
    function moserSvg(n, big) {
        const size = big ? 120 : 64, r = size / 2 - 6, cx = size / 2, cy = size / 2;
        const jitter = [0, 21, -13, 31, -7, 17, -23];
        const pts = [];
        for (let i = 0; i < n; i++) {
            const ang = ((i * 360 / n) + jitter[i % jitter.length] - 90) * Math.PI / 180;
            pts.push([cx + r * Math.cos(ang), cy + r * Math.sin(ang)]);
        }
        let lines = '';
        for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
            lines += `<line x1="${pts[i][0].toFixed(1)}" y1="${pts[i][1].toFixed(1)}" x2="${pts[j][0].toFixed(1)}" y2="${pts[j][1].toFixed(1)}"/>`;
        }
        const dots = pts.map(p => `<circle class="dot" cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="${big ? 3.5 : 2.6}"/>`).join('');
        return `<svg viewBox="0 0 ${size} ${size}" class="rh-moser"><circle class="ring" cx="${cx}" cy="${cy}" r="${r}"/><g class="chords">${lines}</g>${dots}</svg>`;
    }

    function mountPattern(container, data, api, def) {
        const el = api.el || Rift.el;
        const lines = keeperLines(data.gatekeeper);
        const keeper = buildKeeper(el, data);
        const state = { predict: null, lesson: null, pending: false, done: false };
        let result = null;
        const isMoser = data.seq === 'moser';

        const termCard = (t, i) => el('div.rh-term', { style: { animationDelay: (0.15 * i) + 's' } }, [
            el('div.rh-term-label', { text: t.label }),
            isMoser ? el('div.rh-term-pic', { html: moserSvg(t.n, false) }) : null,
            tile(el, t.value, t.value.length > 6 ? '.long' : ''),
            t.note ? el('div.rh-term-note', { text: (t.note === 'prime' ? '✓ ' : '') + t.note }) : null,
        ]);

        const mystery = el('div.rh-term.rh-mystery', { style: { animationDelay: (0.15 * data.terms.length) + 's' } }, [
            el('div.rh-term-label', { text: data.ask.label }),
            isMoser ? el('div.rh-term-pic', { html: moserSvg(data.ask.n, false) }) : null,
            tile(el, '?', '.qmark'),
            el('div.rh-term-note', { text: '…' }),
        ]);

        const optionBtns = data.options.map((o, i) => el('button.rh-plank', {
            type: 'button',
            text: o,
            onclick: () => choosePredict(i),
        }));
        const stepOne = el('div.rh-step', null, [
            el('div.rh-q', { text: data.question }),
            el('div.rh-planks', null, optionBtns),
        ]);
        const main = el('div.rh-pmain', null, [
            el('div.rh-ptitle', null, [el('span.chip', { dataset: { colour: 'memory' }, text: '⏳ Pattern breaker' }), el('h2', { text: data.title })]),
            el('div.rh-intro.parchment', null, data.intro.map((line, i) => el('div.rh-intro-line', { text: line, style: { animationDelay: (0.4 * i) + 's' } }))),
            el('div.rh-seq', null, data.terms.map(termCard).concat([mystery])),
            stepOne,
        ]);
        const wrap = el('div.rh.rh-pattern', null, [keeper.col, main]);
        container.appendChild(wrap);
        keeper.say(lines.patternIntro);

        function choosePredict(i) {
            if (state.predict != null || state.done) return;
            state.predict = i;
            sfx(api, 'place');
            optionBtns.forEach((b, j) => {
                b.disabled = true;
                b.classList.toggle('picked', j === i);
                if (j === data.correct) b.classList.add('truth');
            });
            // reveal the break
            const v = data.reveal.value;
            const newTile = tile(el, v, '.broken' + (v.length > 6 ? '.long' : ''));
            mystery.querySelector('.rh-tile').replaceWith(newTile);
            mystery.querySelector('.rh-term-note').textContent = data.reveal.note;
            mystery.classList.add('revealed');
            if (isMoser) mystery.querySelector('.rh-term-pic').innerHTML = moserSvg(data.ask.n, false);
            keeper.say(lines.patternBreak);
            sfx(api, i === data.correct ? 'success' : 'error');

            const lessonBtns = data.lesson.options.map((o, j) => el('button.rh-plank.wide', {
                type: 'button', text: o, onclick: () => chooseLesson(j),
            }));
            main.appendChild(el('div.rh-explain.parchment', null, [
                isMoser ? el('div.rh-explain-pic', { html: moserSvg(data.ask.n, true) }) : null,
                el('div', null, data.explain.map((line, k) => el('p.rh-intro-line', { text: line, style: { animationDelay: (0.5 * k) + 's' } }))),
            ]));
            main.appendChild(el('div.rh-step', null, [
                el('div.rh-q', { text: data.lesson.question }),
                el('div.rh-planks.col', null, lessonBtns),
            ]));
            state.lessonBtns = lessonBtns;
            main.scrollTop = main.scrollHeight;
        }

        function chooseLesson(j) {
            if (state.done || state.pending || result) return;
            state.pending = true;
            state.lesson = j;
            sfx(api, 'click');
            state.lessonBtns.forEach((b, k) => { b.disabled = true; b.classList.toggle('picked', k === j); });
            submitAndShow(api, def, data, { predict: state.predict, lesson: j }, r => {
                state.pending = false;
                state.done = r.solved;
                sfx(api, r.solved ? 'success' : 'error');
                state.lessonBtns.forEach((b, k) => { if (k === data.lesson.correct) b.classList.add('truth'); });
                if (result) result.remove();
                result = el('div.rh-result.panel' + (r.solved ? '.win' : '.lose'), null, [
                    el('h3', { text: r.solved ? 'Pattern broken!' : 'Not quite' }),
                    el('p', { text: r.feedback }),
                    !r.solved ? el('button.btn.primary', { text: 'Try again', onclick() {
                        if (state.done || result !== shownResult) return;
                        result.remove(); result = null;
                        state.lesson = null;
                        state.lessonBtns.forEach(b => { b.disabled = false; b.classList.remove('picked', 'truth'); });
                        sfx(api, 'click');
                    } }) : null,
                ]);
                const shownResult = result;
                main.appendChild(result);
                main.scrollTop = main.scrollHeight;
            });
        }

        return { destroy() { wrap.remove(); } };
    }

    // ---- definition ------------------------------------------------------------

    const def = {
        id: 'rule-hunter',
        rules: [
            "The keeper has a secret number rule. Test triples to learn it.",
            "Click three number tiles, then Test it. A yes only means that triple fits.",
            "Look for a test that could break your guess. Compare more than one rule.",
            "Then Name the rule. In Pattern Breaker mode, count the objects and choose the next value and the reason.",
            "How to play is free. The Hint button shows its heart cost. Think first, then check your answer."
        ],
        tutorial: [
            {
                "text": "Find the secret rule, or check whether a pattern really keeps going.",
                "highlight": ".rh-example, .rh-seq"
            },
            {
                "text": "In a triple task, click tiles to fill three slots, then Test it. A yes does not prove your rule.",
                "highlight": ".rh-build, .rh-seq"
            },
            {
                "text": "Example: 2,4,6 fits both \"even numbers\" and \"numbers going up\". Testing 1,3,5 tells those ideas apart.",
                "highlight": ".rh-build, .rh-seq"
            },
            {
                "text": "Test a triple you expect NOT to fit. If it fits, your guess needs changing. Then choose Name the rule.",
                "highlight": ".rh-name-btn, .rh-planks"
            },
            {
                "text": "In Pattern Breaker mode, read the picture and count. Choose the next value and the explanation; a familiar pattern can break.",
                "highlight": ".rh-seq, .rh-log"
            },
            {
                "text": "How to play is free. The Hint button shows its heart cost. Think first, then check your answer.",
                "highlight": ".rh, .rh-pmain"
            }
        ],
        name: 'Rule Hunter',
        colour: 'memory',
        family: 'Pattern breakers',
        blurb: 'The gatekeeper has a secret rule. Test number triples until you can name it.',
        tok: 'No number of agreeing examples proves a rule; one counterexample can break it. Look for tests that could prove you wrong.',

        // generate(rng, difficulty, opts?) — opts.mode: 'rules' | 'pattern'
        // (default: 'pattern' at difficulty 3), opts.sequence: a SEQUENCES id,
        // opts.secret: a RULES id (rules mode).
        generate(rng, difficulty, opts) {
            const o = opts || {};
            const d = Rift.clamp(difficulty | 0 || 1, 1, 3);
            const gatekeeper = rng.pick(Object.keys(KEEPERS));
            const mode = o.mode || (d >= 3 ? 'pattern' : 'rules');
            if (mode === 'pattern') return generatePattern(rng, d, gatekeeper, o.sequence);
            if (o.secret && RULE[o.secret]) {
                const built = buildRules(rng, o.secret, CANDIDATE_COUNT[d]);
                if (built) return Object.assign({ mode: 'rules', difficulty: d, gatekeeper, max: MAX, tag: rng.int(0, 1e9) }, built);
            }
            return generateRules(rng, d, gatekeeper);
        },

        // rules:   answer = { rule: candidateIndex, tests: [[a,b,c], ...] }
        // pattern: answer = { predict: optionIndex, lesson: optionIndex }
        check(data, answer) {
            return data.mode === 'pattern' ? checkPattern(data, answer) : checkRules(data, answer);
        },
        hints,
        why,
        solve,

        mount(container, data, api) {
            const a = api || {};
            if (root.getComputedStyle && root.getComputedStyle(container).position === 'static') container.style.position = 'relative';
            return data.mode === 'pattern' ? mountPattern(container, data, a, def) : mountRules(container, data, a, def);
        },

        // Pure helpers, exposed for tests and for other content (e.g. a teacher page).
        lib: {
            MAX, RULES, RULE, SEQUENCES, LESSON, KEEPERS,
            isPrime, choose, fits, signatures, sameSig, subsetSig, separator, failingTriple,
            topExamples, pickCandidates, buildRules, classify, eliminations,
            moser: n => 1 + choose(n, 2) + choose(n, 4),
            index: ix,
        },
    };

    Rift.Puzzles.register(def);
})(typeof window !== 'undefined' ? window : globalThis);
