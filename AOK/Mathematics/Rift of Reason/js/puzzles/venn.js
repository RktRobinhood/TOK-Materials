/*
 * Carroll's Venn board: syllogisms, and why VALID is not the same as TRUE.
 *
 * Three (or, for a sorites, four) terms are drawn as overlapping circles. The
 * player shades the parts the premises say are EMPTY, drops x counters where
 * something must EXIST (on a line when it could be either side), then judges
 * whether the conclusion has to follow. From difficulty 2 they also say
 * whether the conclusion is true in our world, false, or absurd.
 *
 * Flavour after Lewis Carroll, The Game of Logic (1886) and Symbolic Logic
 * (1896), both public domain. Pieces marked "after Lewis Carroll" use his own
 * premises; everything else is new.
 *
 * VALIDITY IS NEVER HAND-CODED. The engine enumerates every way of marking the
 * 2^n regions as occupied/empty, keeps the "models" that make every premise
 * true, and calls the conclusion valid iff it is true in all of them.
 *
 * EXISTENTIAL IMPORT. The engine uses the modern (Boolean) reading, the one
 * Venn diagrams are built on: "All A are B" and "No A are B" only shade; they
 * do not promise that any A exists. Only "Some …" and named individuals
 * ("Fido is a dog": Fido exists, and is exactly one thing) put x's on the
 * board. So "All A are B, therefore some A are B" is INVALID here. The
 * traditional (Aristotelian) reading assumes every term names something; the
 * generator computes validity under BOTH readings and throws away any
 * conclusion where they disagree (e.g. Darapti), so a player is never marked
 * wrong for using the other convention. engine.analyse(..., { existentialImport:
 * true }) gives the traditional answer.
 */
(function (root) {
    'use strict';

    const Rift = root.Rift;

    // =====================================================================
    // Engine (pure)
    // =====================================================================

    const popcount = m => { let c = 0; while (m) { m &= m - 1; c++; } return c; };

    function regionMask(n, pred) {
        let m = 0;
        for (let r = 0; r < (1 << n); r++) if (pred(r)) m |= (1 << r);
        return m;
    }

    function regionsOf(mask, n) {
        const out = [];
        for (let r = 0; r < (1 << n); r++) if (mask & (1 << r)) out.push(r);
        return out;
    }

    // A statement { q, a, b } (a, b = term indices = bit numbers) becomes
    // constraints on a model mask m (bit r set = region r is occupied):
    //   empty: (m & mask) === 0        some: (m & mask) !== 0
    function compile(st, n) {
        const A = 1 << st.a, B = 1 << st.b;
        switch (st.q) {
            case 'all': case 'is': return [{ t: 'empty', m: regionMask(n, r => (r & A) && !(r & B)) }];
            case 'no': case 'isNot': return [{ t: 'empty', m: regionMask(n, r => (r & A) && (r & B)) }];
            case 'some': return [{ t: 'some', m: regionMask(n, r => (r & A) && (r & B)) }];
            case 'someNot': return [{ t: 'some', m: regionMask(n, r => (r & A) && !(r & B)) }];
        }
        throw new Error('venn: unknown statement form ' + st.q);
    }

    function holds(c, m) {
        if (c.t === 'empty') return (m & c.m) === 0;
        if (c.t === 'some') return (m & c.m) !== 0;
        return popcount(m & c.m) === 1; // 'one': a named individual is exactly one thing
    }

    function termMask(n, i) { return regionMask(n, r => r & (1 << i)); }

    // Every model (occupancy mask) consistent with the premises.
    function models(n, terms, premises, opts) {
        const cons = [];
        premises.forEach(p => cons.push(...compile(p, n)));
        terms.forEach((t, i) => {
            if (t.singular) cons.push({ t: 'one', m: termMask(n, i) });
            else if (opts && opts.existentialImport) cons.push({ t: 'some', m: termMask(n, i) });
        });
        const out = [];
        const total = 1 << (1 << n);
        for (let m = 0; m < total; m++) {
            let ok = true;
            for (let k = 0; k < cons.length; k++) if (!holds(cons[k], m)) { ok = false; break; }
            if (ok) out.push(m);
        }
        return out;
    }

    function holdsAll(st, n, m) { return compile(st, n).every(c => holds(c, m)); }

    function validIn(ms, st, n) {
        if (!ms.length) return false;
        for (let i = 0; i < ms.length; i++) if (!holdsAll(st, n, ms[i])) return false;
        return true;
    }

    // Full analysis of a puzzle: validity, the forced diagram, a counter-model.
    function analyse(n, terms, premises, conclusion, opts) {
        const ms = models(n, terms, premises, opts);
        let union = 0, counter = null;
        ms.forEach(m => {
            union |= m;
            if (conclusion && counter === null && !holdsAll(conclusion, n, m)) counter = m;
        });
        const R = 1 << n;
        const empty = [];
        for (let r = 0; r < R; r++) if (!(union & (1 << r))) empty.push(r);
        const emptyMask = regionMask(n, r => !(union & (1 << r)));
        // where the x's go: particular premises and named individuals
        const marks = [], seen = {};
        const addMark = mask => {
            const regs = regionsOf(mask & ~emptyMask, n);
            const key = regs.join(',');
            if (regs.length && !seen[key]) { seen[key] = 1; marks.push(regs); }
        };
        premises.forEach(p => {
            if (p.q === 'some' || p.q === 'someNot') addMark(compile(p, n)[0].m);
        });
        terms.forEach((t, i) => { if (t.singular) addMark(termMask(n, i)); });
        return {
            consistent: ms.length > 0,
            models: ms.length,
            valid: conclusion ? (ms.length > 0 && counter === null) : null,
            counterModel: counter,
            empty,
            marks,
        };
    }

    function analyseData(data, opts) {
        return analyse(data.terms.length, data.terms, data.premises, data.conclusion, opts);
    }

    // ---- our world ------------------------------------------------------
    // A real theme lists its universal facts; the world is the largest model
    // they allow (every region not ruled out is occupied: there are bats, and
    // birds, and fish…). Named people are pinned by their own facts.

    function parseFact(text, keys) {
        const [q, a, b] = text.split(' ');
        return { q, a: keys.indexOf(a), b: keys.indexOf(b) };
    }

    function worldOf(theme) {
        const keys = theme.terms.map(t => t[0]);
        const n = keys.length;
        let occ = (1 << (1 << n)) - 1;
        (theme.facts || []).forEach(f => {
            compile(parseFact(f, keys), n).forEach(c => { if (c.t === 'empty') occ &= ~c.m; });
        });
        return { keys, n, occ };
    }

    function placements(theme, personKey) {
        const w = worldOf(theme);
        const person = (theme.people || []).find(p => p.key === personKey);
        if (!person || !person.facts || !person.facts.length) return [];
        const facts = person.facts.map(f => { const [q, b] = f.split(' '); return { q, b: w.keys.indexOf(b) }; });
        return regionsOf(w.occ, w.n).filter(r => facts.every(f => (f.q === 'is') === !!(r & (1 << f.b))));
    }

    // → true | false | 'absurd' | 'unknown'
    function worldTruth(theme, st, terms) {
        if (theme.absurd) return 'absurd';
        const w = worldOf(theme);
        const ta = terms[st.a], tb = terms[st.b];
        if (ta.singular) {
            const places = placements(theme, ta.key);
            if (!places.length) return 'unknown';
            const bit = 1 << w.keys.indexOf(tb.key);
            const inside = places.map(r => !!(r & bit));
            if (inside.every(Boolean)) return st.q === 'is';
            if (!inside.some(Boolean)) return st.q === 'isNot';
            return 'unknown';
        }
        const mapped = { q: st.q, a: w.keys.indexOf(ta.key), b: w.keys.indexOf(tb.key) };
        return holdsAll(mapped, w.n, w.occ);
    }

    // =====================================================================
    // Content
    // =====================================================================
    // terms: [key, circle label, plural, "a/an …"]. facts: 'all a b' / 'no a b'.

    const THEMES = [
        // ---- absurd (nothing here exists in our world) ----
        {
            id: 'pudding', name: 'The Pudding Parliament', absurd: true,
            terms: [
                ['puddings', 'Talking puddings', 'talking puddings', 'a talking pudding'],
                ['senators', 'Custard senators', 'custard senators', 'a custard senator'],
                ['spoonfearers', 'Spoon-fearers', 'spoon-fearers', 'a spoon-fearer'],
                ['judges', 'Jelly judges', 'jelly judges', 'a jelly judge'],
            ],
            people: [{ key: 'wobble', name: 'Sir Wobble' }],
        },
        {
            id: 'crocodiles', name: 'The Crocodile Poetry Club', absurd: true,
            terms: [
                ['crocs', 'Sonnet crocs', 'sonnet-writing crocodiles', 'a sonnet-writing crocodile'],
                ['moonpoets', 'Moon poets', 'moon poets', 'a moon poet'],
                ['ghostbards', 'Ghost bards', 'ghost bards', 'a ghost bard'],
                ['teadragons', 'Tea dragons', 'tea-sipping dragons', 'a tea-sipping dragon'],
            ],
            people: [{ key: 'snapsworth', name: 'Lady Snapsworth' }],
        },
        {
            id: 'quadrille', name: 'The Lobster Quadrille', absurd: true,
            terms: [
                ['lobsters', 'Dancing lobsters', 'dancing lobsters', 'a dancing lobster'],
                ['admirals', 'Snail admirals', 'snail admirals', 'a snail admiral'],
                ['waiters', 'Whiting waiters', 'whiting waiters', 'a whiting waiter'],
                ['seajudges', 'Sea-cucumber judges', 'sea-cucumber judges', 'a sea-cucumber judge'],
            ],
        },
        {
            id: 'unicorns', name: 'The Unicorn Tax Office', absurd: true,
            terms: [
                ['unicorns', 'Tax unicorns', 'tax-paying unicorns', 'a tax-paying unicorn'],
                ['goblins', 'Goblin accountants', 'goblin accountants', 'a goblin accountant'],
                ['glitter', 'Glitter inspectors', 'glitter inspectors', 'a glitter inspector'],
                ['rainbow', 'Rainbow lawyers', 'rainbow lawyers', 'a rainbow lawyer'],
            ],
            people: [{ key: 'sparkletoes', name: 'Sparkletoes' }],
        },
        {
            id: 'sleepy', name: 'The Sleepy Kingdom', absurd: true,
            terms: [
                ['volcanoes', 'Snoring volcanoes', 'snoring volcanoes', 'a snoring volcano'],
                ['knights', 'Pillow knights', 'pillow knights', 'a pillow knight'],
                ['merchants', 'Dream merchants', 'dream merchants', 'a dream merchant'],
                ['castles', 'Yawning castles', 'yawning castles', 'a yawning castle'],
            ],
        },
        {
            id: 'dragons', name: 'The Knitting Circle', absurd: true,
            terms: [
                ['knitdragons', 'Knitting dragons', 'knitting dragons', 'a knitting dragon'],
                ['toads', 'Hat-wearing toads', 'hat-wearing toads', 'a hat-wearing toad'],
                ['wizards', 'Soup-fearing wizards', 'soup-fearing wizards', 'a soup-fearing wizard'],
                ['teapots', 'Teapot goblins', 'teapot goblins', 'a teapot goblin'],
            ],
            people: [{ key: 'grizelda', name: 'Grizelda' }],
        },

        // ---- real (checked against our world) ----
        {
            id: 'menagerie', name: 'The Menagerie',
            terms: [
                ['dogs', 'Dogs', 'dogs', 'a dog'],
                ['mammals', 'Mammals', 'mammals', 'a mammal'],
                ['fliers', 'Fliers', 'animals that can fly', 'an animal that can fly'],
                ['cats', 'Cats', 'cats', 'a cat'],
            ],
            facts: ['all dogs mammals', 'all cats mammals', 'no dogs cats', 'no dogs fliers', 'no cats fliers'],
            people: [
                { key: 'fido', name: 'Fido', facts: ['is dogs'] },
                { key: 'tom', name: 'Tom the cat', facts: ['is cats'] },
            ],
        },
        {
            id: 'spaghetti', name: 'The Spaghetti Question',
            terms: [
                ['italians', 'Italians', 'Italians', 'an Italian'],
                ['spag', 'Spaghetti eaters', 'spaghetti eaters', 'a spaghetti eater'],
                ['europeans', 'Europeans', 'Europeans', 'a European'],
                ['danes', 'Danes', 'Danes', 'a Dane'],
            ],
            facts: ['all italians europeans', 'all danes europeans'],
            people: [{ key: 'giovanni', name: 'Giovanni' }],
        },
        {
            id: 'shapes', name: 'The Shape Garden',
            terms: [
                ['squares', 'Squares', 'squares', 'a square'],
                ['rectangles', 'Rectangles', 'rectangles', 'a rectangle'],
                ['triangles', 'Triangles', 'triangles', 'a triangle'],
                ['polygons', 'Polygons', 'polygons', 'a polygon'],
            ],
            facts: ['all squares rectangles', 'all rectangles polygons', 'all triangles polygons', 'no rectangles triangles'],
        },
        {
            id: 'numbers', name: 'The Number Market',
            terms: [
                ['m4', 'Multiples of 4', 'multiples of 4', 'a multiple of 4'],
                ['even', 'Even numbers', 'even numbers', 'an even number'],
                ['primes', 'Primes', 'prime numbers', 'a prime number'],
                ['m10', 'Multiples of 10', 'multiples of 10', 'a multiple of 10'],
            ],
            facts: ['all m4 even', 'all m10 even', 'no m4 primes', 'no m10 primes'],
            people: [
                { key: 'n12', name: '12', facts: ['is m4', 'is even', 'isNot primes', 'isNot m10'] },
                { key: 'n7', name: '7', facts: ['is primes', 'isNot even', 'isNot m4', 'isNot m10'] },
                { key: 'n2', name: '2', facts: ['is primes', 'is even', 'isNot m4', 'isNot m10'] },
            ],
        },
        {
            id: 'aviary', name: 'The Aviary',
            terms: [
                ['penguins', 'Penguins', 'penguins', 'a penguin'],
                ['birds', 'Birds', 'birds', 'a bird'],
                ['fliers', 'Fliers', 'animals that can fly', 'an animal that can fly'],
            ],
            facts: ['all penguins birds', 'no penguins fliers'],
            people: [{ key: 'pingu', name: 'Pingu', facts: ['is penguins'] }],
        },
        {
            id: 'maproom', name: 'The Map Room',
            terms: [
                ['capitals', 'Capitals', 'capital cities', 'a capital city'],
                ['cities', 'Cities', 'cities', 'a city'],
                ['danish', 'Danish cities', 'Danish cities', 'a Danish city'],
            ],
            facts: ['all capitals cities', 'all danish cities'],
            people: [
                { key: 'aarhus', name: 'Aarhus', facts: ['is danish', 'isNot capitals'] },
                { key: 'copenhagen', name: 'Copenhagen', facts: ['is danish', 'is capitals'] },
                { key: 'paris', name: 'Paris', facts: ['is capitals', 'isNot danish'] },
            ],
        },
    ];

    const themeById = id => THEMES.find(t => t.id === id);

    // Classic traps from the lesson: fixed premises, fixed conclusion(s).
    // Validity is still computed by the engine.
    const CLASSICS = [
        { id: 'giovanni', theme: 'spaghetti', terms: ['giovanni', 'italians', 'spag'],
            premises: [['all', 1, 2, 'All Italians eat spaghetti.'], ['is', 0, 2, 'Giovanni eats spaghetti.']],
            conclusions: [['is', 0, 1]], note: 'affirming the consequent' },
        { id: 'giovanni-tollens', theme: 'spaghetti', terms: ['giovanni', 'italians', 'spag'],
            premises: [['all', 1, 2, 'All Italians eat spaghetti.'], ['isNot', 0, 2, 'Giovanni never eats spaghetti.']],
            conclusions: [['isNot', 0, 1]] },
        { id: 'fido', theme: 'menagerie', terms: ['fido', 'mammals', 'dogs'],
            premises: [['all', 2, 1, 'All dogs are mammals.'], ['is', 0, 2, 'Fido is a dog.']],
            conclusions: [['is', 0, 1]] },
        { id: 'tom', theme: 'menagerie', terms: ['tom', 'mammals', 'dogs'],
            premises: [['all', 2, 1, 'All dogs are mammals.'], ['isNot', 0, 2, 'Tom is not a dog.']],
            conclusions: [['isNot', 0, 1]], note: 'denying the antecedent' },
        { id: 'dogs-cats', theme: 'menagerie', terms: ['dogs', 'cats', 'mammals'],
            premises: [['all', 0, 2], ['all', 1, 2]],
            conclusions: [['all', 0, 1], ['no', 0, 1]], note: 'undistributed middle' },
        { id: 'flying-dogs', theme: 'menagerie', terms: ['dogs', 'fliers', 'mammals'],
            premises: [['all', 2, 1, 'All mammals can fly.'], ['all', 0, 2]],
            conclusions: [['all', 0, 1]] },
        { id: 'squares', theme: 'shapes', terms: ['squares', 'polygons', 'rectangles'],
            premises: [['all', 2, 1], ['all', 0, 2]],
            conclusions: [['all', 0, 1], ['all', 1, 0]] },
        { id: 'seven', theme: 'numbers', terms: ['n7', 'even', 'primes'],
            premises: [['some', 2, 1], ['is', 0, 2, '7 is a prime number.']],
            conclusions: [['is', 0, 1], ['isNot', 0, 1]] },
    ];

    const CARROLL = 'after Lewis Carroll, Symbolic Logic (1896)';
    const CARROLL_PIECES = [
        { id: 'cats-french', credit: CARROLL,
            theme: { id: 'carroll-cats', name: "Carroll's Farmyard", absurd: true, terms: [
                ['chickens', 'Chickens', 'chickens', 'a chicken'],
                ['french', 'French speakers', 'creatures that understand French', 'a creature that understands French'],
                ['cats', 'Cats', 'cats', 'a cat']] },
            premises: [['all', 2, 1, 'All cats understand French.'], ['some', 0, 2, 'Some chickens are cats.']],
            ends: [0, 1], canonical: ['some', 0, 1] },
        { id: 'cakes', credit: CARROLL,
            theme: { id: 'carroll-cakes', name: "Carroll's Bakery", absurd: true, terms: [
                ['newcakes', 'New cakes', 'new cakes', 'a new cake'],
                ['nice', 'Nice cakes', 'nice cakes', 'a nice cake'],
                ['unwholesome', 'Unwholesome', 'unwholesome cakes', 'an unwholesome cake']] },
            premises: [['some', 0, 2, 'Some new cakes are unwholesome.'], ['no', 1, 2, 'No nice cakes are unwholesome.']],
            ends: [0, 1], canonical: ['someNot', 0, 1] },
        { id: 'misers', credit: CARROLL,
            theme: { id: 'carroll-misers', name: "Carroll's Misers", absurd: true, terms: [
                ['unselfish', 'Unselfish', 'unselfish people', 'an unselfish person'],
                ['eggshell', 'Egg-shell savers', 'people who save egg-shells', 'a person who saves egg-shells'],
                ['misers', 'Misers', 'misers', 'a miser']] },
            premises: [['no', 2, 0, 'No misers are unselfish.'], ['all', 1, 2, 'None but misers save egg-shells.']],
            ends: [0, 1], canonical: ['no', 0, 1] },
        { id: 'babies', credit: CARROLL,
            theme: { id: 'carroll-babies', name: "Carroll's Nursery", absurd: true, terms: [
                ['babies', 'Babies', 'babies', 'a baby'],
                ['illogical', 'Illogical', 'illogical people', 'an illogical person'],
                ['despised', 'Despised', 'despised people', 'a despised person'],
                ['croc', 'Crocodile managers', 'people who can manage a crocodile', 'a person who can manage a crocodile']] },
            premises: [['all', 0, 1, 'Babies are illogical.'], ['no', 3, 2, 'Nobody is despised who can manage a crocodile.'],
                ['all', 1, 2, 'Illogical persons are despised.']],
            ends: [0, 3], canonical: ['no', 0, 3] },
        { id: 'ducks', credit: CARROLL,
            theme: { id: 'carroll-ducks', name: "Carroll's Poultry Yard", absurd: true, terms: [
                ['poultry', 'My poultry', 'birds in my yard', 'a bird in my yard'],
                ['ducks', 'Ducks', 'ducks', 'a duck'],
                ['waltzers', 'Waltzers', 'creatures that waltz', 'a creature that waltzes'],
                ['officers', 'Officers', 'officers', 'an officer']] },
            premises: [['no', 1, 2, 'No ducks waltz.'], ['all', 3, 2, 'No officers ever decline to waltz.'],
                ['all', 0, 1, 'All my poultry are ducks.']],
            ends: [0, 3], canonical: ['no', 0, 3] },
    ];

    // =====================================================================
    // Generation
    // =====================================================================

    const FORMS_BY_D = { 1: ['all', 'no'], 2: ['all', 'no', 'some', 'someNot'], 3: ['all', 'no', 'some', 'someNot'] };
    const FORM_WEIGHT = { all: 35, no: 25, some: 20, someNot: 20 };
    const KIND_WEIGHTS = {
        1: { syllogism: 62, singular: 12, classic: 14, carroll: 12 },
        2: { syllogism: 55, singular: 15, classic: 15, carroll: 15 },
        3: { syllogism: 30, sorites: 35, singular: 10, classic: 12, carroll: 13 },
    };
    const REAL_CHANCE = { 1: 0.5, 2: 0.5, 3: 0.6 };

    const st = (q, a, b) => ({ q, a, b });

    function makeTerm(theme, key) {
        const t = theme.terms.find(x => x[0] === key);
        if (t) return { key, label: t[1], plural: t[2], one: t[3] };
        const p = (theme.people || []).find(x => x.key === key);
        if (!p) throw new Error('venn: unknown term ' + key + ' in ' + theme.id);
        return { key, label: p.name, plural: p.name, one: p.name, singular: true };
    }

    function pickForm(rng, forms) {
        const w = {};
        forms.forEach(f => { w[f] = FORM_WEIGHT[f]; });
        return rng.weighted(w);
    }

    function pickTheme(rng, d, filter) {
        const pool = THEMES.filter(filter || (() => true));
        const real = pool.filter(t => !t.absurd), silly = pool.filter(t => t.absurd);
        const wantReal = rng.chance(REAL_CHANCE[d]);
        const group = (wantReal && real.length) || !silly.length ? real : silly;
        return rng.pick(group);
    }

    function classConclusions(s, p, forms) {
        const out = [];
        if (forms.includes('all')) out.push(st('all', s, p), st('all', p, s));
        if (forms.includes('no')) out.push(st('no', s, p));
        if (forms.includes('some')) out.push(st('some', s, p));
        if (forms.includes('someNot')) out.push(st('someNot', s, p), st('someNot', p, s));
        return out;
    }

    function parts(s, terms) {
        const T = (i, form) => ({ t: 'term', i, s: terms[i][form] });
        const W = s => ({ t: 'w', s });
        switch (s.q) {
            case 'all': return [W('All'), T(s.a, 'plural'), W('are'), T(s.b, 'plural')];
            case 'no': return [W('No'), T(s.a, 'plural'), W('are'), T(s.b, 'plural')];
            case 'some': return [W('Some'), T(s.a, 'plural'), W('are'), T(s.b, 'plural')];
            case 'someNot': return [W('Some'), T(s.a, 'plural'), W('are not'), T(s.b, 'plural')];
            case 'is': return [T(s.a, 'plural'), W('is'), T(s.b, 'one')];
            case 'isNot': return [T(s.a, 'plural'), W('is not'), T(s.b, 'one')];
        }
        return [];
    }

    const textOf = ps => ps.map(p => p.s).join(' ') + '.';

    function statementOut(s, terms, theme, say) {
        const ps = parts(s, terms);
        const out = { q: s.q, a: s.a, b: s.b, parts: ps, text: textOf(ps), world: worldTruth(theme, s, terms) };
        if (say) out.say = say;
        return out;
    }

    // Shared tail of every generator: pick a conclusion with the wanted
    // validity (agreeing under both existential-import conventions) and build
    // the JSON puzzle data.
    function finish(ctx) {
        const { rng, d, kind, theme, termKeys, premises, candidates, target } = ctx;
        const terms = termKeys.map(k => makeTerm(theme, k));
        const n = terms.length;
        const ms = models(n, terms, premises);
        const msTrad = models(n, terms, premises, { existentialImport: true });
        if (!ms.length || !msTrad.length) return null;
        const twist = d === 3 && !theme.absurd && rng.chance(0.7);
        const same = (x, y) => x.q === y.q && x.a === y.a && x.b === y.b;
        const ok = candidates.filter(c => {
            if (premises.some(p => same(p, c))) return false;
            const v = validIn(ms, c, n);
            if (v !== target || v !== validIn(msTrad, c, n)) return false;
            if (twist) {
                const w = worldTruth(theme, c, terms);
                if (!((v && w === false) || (!v && w === true))) return false;
            }
            return true;
        });
        if (!ok.length) return null;
        let concl = (ctx.canonical && ok.find(c => same(c, ctx.canonical))) || rng.pick(ok);
        if ((concl.q === 'no' || concl.q === 'some') && rng.chance(0.5)) concl = st(concl.q, concl.b, concl.a);

        const says = ctx.says || [];
        const data = {
            id: 'venn',
            v: 1,
            difficulty: d,
            kind,
            uid: ctx.uid,
            theme: { id: theme.id, name: theme.name, absurd: !!theme.absurd },
            credit: ctx.credit || null,
            terms,
            premises: premises.map((p, i) => statementOut(p, terms, theme, says[i])),
            conclusion: statementOut(concl, terms, theme),
            note: ctx.note || null,
        };
        const an = analyseData(data);
        // every x must fit in one region or on one line between two regions
        for (const mk of an.marks) {
            if (mk.length > 2 || (mk.length === 2 && popcount(mk[0] ^ mk[1]) !== 1)) return null;
        }
        data.valid = an.valid;
        data.askWorld = d >= 2 && [true, false, 'absurd'].includes(data.conclusion.world);
        return data;
    }

    const GEN = {
        // S, P, M with two premises (M–P and S–M) and a conclusion about S and P
        syllogism(rng, d, target, uid) {
            const theme = pickTheme(rng, d);
            const keys = rng.shuffle(theme.terms.map(t => t[0])).slice(0, 3); // [S, P, M]
            const forms = FORMS_BY_D[d];
            const major = rng.chance(0.5) ? st(pickForm(rng, forms), 2, 1) : st(pickForm(rng, forms), 1, 2);
            const minor = rng.chance(0.5) ? st(pickForm(rng, forms), 0, 2) : st(pickForm(rng, forms), 2, 0);
            const premises = rng.chance(0.7) ? [major, minor] : [minor, major];
            return finish({ rng, d, kind: 'syllogism', theme, termKeys: keys, premises,
                candidates: classConclusions(0, 1, forms), target, uid });
        },
        // a named individual: "Fido is a dog"
        singular(rng, d, target, uid) {
            const theme = pickTheme(rng, d, t => (t.people || []).length > 0);
            const person = rng.pick(theme.people).key;
            const [P, M] = rng.shuffle(theme.terms.map(t => t[0])).slice(0, 2);
            const forms = FORMS_BY_D[d];
            const classPremise = rng.chance(0.5) ? st(pickForm(rng, forms), 2, 1) : st(pickForm(rng, forms), 1, 2);
            const single = st(rng.chance(0.65) ? 'is' : 'isNot', 0, 2);
            const premises = rng.chance(0.7) ? [classPremise, single] : [single, classPremise];
            return finish({ rng, d, kind: 'singular', theme, termKeys: [person, P, M], premises,
                candidates: [st('is', 0, 1), st('isNot', 0, 1)], target, uid });
        },
        // Carroll-style sorites: a chain of three universal premises over four terms
        sorites(rng, d, target, uid) {
            const theme = pickTheme(rng, d, t => t.terms.length >= 4);
            const keys = rng.shuffle(theme.terms.map(t => t[0])).slice(0, 4);
            const link = (x, y) => {
                const q = rng.weighted({ all: 3, no: 2 });
                return rng.chance(0.5) ? st(q, x, y) : st(q, y, x);
            };
            const premises = rng.shuffle([link(0, 1), link(1, 2), link(2, 3)]);
            return finish({ rng, d, kind: 'sorites', theme, termKeys: keys, premises,
                candidates: classConclusions(0, 3, FORMS_BY_D[d]), target, uid });
        },
        classic(rng, d, target, uid) {
            const pool = rng.shuffle(CLASSICS.filter(c => fitsDifficulty(c.premises, d, 3)));
            for (const c of pool) {
                const data = finish({ rng, d, kind: 'classic', theme: themeById(c.theme), termKeys: c.terms,
                    premises: c.premises.map(p => st(p[0], p[1], p[2])), says: c.premises.map(p => p[3]),
                    candidates: c.conclusions.map(p => st(p[0], p[1], p[2])), target, uid, note: c.note });
                if (data) return data;
            }
            return null;
        },
        carroll(rng, d, target, uid) {
            const pool = rng.shuffle(CARROLL_PIECES.filter(c => fitsDifficulty(c.premises, d, c.theme.terms.length)));
            for (const c of pool) {
                const data = finish({ rng, d, kind: 'carroll', theme: c.theme, termKeys: c.theme.terms.map(t => t[0]),
                    premises: c.premises.map(p => st(p[0], p[1], p[2])), says: c.premises.map(p => p[3]),
                    candidates: classConclusions(c.ends[0], c.ends[1], FORMS_BY_D[d]),
                    canonical: st(c.canonical[0], c.canonical[1], c.canonical[2]), target, uid, credit: c.credit });
                if (data) return data;
            }
            return null;
        },
    };

    function fitsDifficulty(premises, d, nTerms) {
        if (nTerms > 3 && d < 3) return false;
        const allowed = FORMS_BY_D[d].concat(['is', 'isNot']);
        return premises.every(p => allowed.includes(p[0]));
    }

    function generate(rng, difficulty) {
        const d = Rift.clamp(Math.round(difficulty || 1), 1, 3);
        const uid = rng.int(1, 999999999);
        const target = rng.chance(0.5);
        for (let i = 0; i < 400; i++) {
            const kind = rng.weighted(KIND_WEIGHTS[d]);
            const data = GEN[kind](rng, d, target, uid);
            if (data) return data;
        }
        // practically unreachable; Fido is always valid
        return finish({ rng, d, kind: 'classic', theme: themeById('menagerie'), termKeys: ['fido', 'mammals', 'dogs'],
            premises: [st('all', 2, 1), st('is', 0, 2)], candidates: [st('is', 0, 1)], target: true, uid });
    }

    // =====================================================================
    // Words: region names, reasons, hints
    // =====================================================================

    function listWords(xs) {
        if (xs.length <= 1) return xs.join('');
        return xs.slice(0, -1).join(', ') + ' and ' + xs[xs.length - 1];
    }

    function describeRegion(terms, r) {
        const inside = terms.filter((t, i) => r & (1 << i)).map(t => t.label);
        const outside = terms.filter((t, i) => !(r & (1 << i))).map(t => t.label);
        if (!inside.length) return 'outside every circle';
        return 'inside ' + listWords(inside) + (outside.length ? ', outside ' + listWords(outside) : '');
    }

    function describeMark(terms, regs) {
        if (regs.length === 1) return 'in the part ' + describeRegion(terms, regs[0]);
        const k = Math.log2(regs[0] ^ regs[1]);
        const both = regs[0] & regs[1];
        return 'on the ' + terms[k].label + ' line, in the part ' + describeRegion(terms.filter((t, i) => i !== k),
            compress(both, k));
    }

    // drop bit k from a region index (for describing the rest of a split region)
    function compress(r, k) {
        const low = r & ((1 << k) - 1);
        return low | ((r >> (k + 1)) << k);
    }

    const quote = s => '“' + s.replace(/\.$/, '') + '”';

    function validReason(data) {
        const c = data.conclusion, T = data.terms, S = T[c.a].label, P = T[c.b].label;
        switch (c.q) {
            case 'all': return 'The premises already shade every part of ' + S + ' that lies outside ' + P + ', so there is no room for a counterexample.';
            case 'no': return 'The premises already shade every part where ' + S + ' and ' + P + ' overlap, so nothing can be in both.';
            case 'some': return 'The premises force an x into a part that is inside both ' + S + ' and ' + P + '.';
            case 'someNot': return 'The premises force an x into a part of ' + S + ' that is outside ' + P + '.';
            case 'is': return 'Every part of the ' + S + ' circle outside ' + P + ' is shaded, so ' + S + ' must be inside ' + P + '.';
            case 'isNot': return 'Every part of the ' + S + ' circle inside ' + P + ' is shaded, so ' + S + ' must be outside ' + P + '.';
        }
        return '';
    }

    function invalidReason(data, an) {
        const c = data.conclusion, T = data.terms, n = T.length, S = T[c.a].label, P = T[c.b].label;
        const m = an.counterModel;
        const failing = compile(c, n)[0];
        const where = m == null ? [] : regionsOf(m & failing.m, n);
        switch (c.q) {
            case 'all': case 'no': case 'is': case 'isNot':
                if (where.length) {
                    const who = T[c.a].singular ? S + ' could be ' : 'there could be something ';
                    return 'The premises can all be true and ' + who + describeRegion(T, where[0]) + ', which breaks the conclusion.';
                }
                break;
            case 'some':
                return 'The premises can all be true while the overlap of ' + S + ' and ' + P + ' is completely empty.';
            case 'someNot':
                return 'The premises can all be true while every part of ' + S + ' outside ' + P + ' is empty.';
        }
        return 'There is a way to draw the premises where the conclusion fails.';
    }

    function trapName(data) {
        return data.note ? 'This is the classic trap called ' + data.note + '.' : '';
    }

    function premiseHint(p, T, ix) {
        const A = T[p.a].label, B = T[p.b].label;
        const head = 'Premise ' + (ix + 1) + ' ' + quote(p.text) + ': ';
        switch (p.q) {
            case 'all': return head + 'nothing is in ' + A + ' outside ' + B + '. Shade the part of the ' + A + ' circle that is outside ' + B + '.';
            case 'no': return head + 'shade every part where ' + A + ' and ' + B + ' overlap.';
            case 'some': return head + 'put an x where ' + A + ' and ' + B + ' overlap. If a third line cuts that overlap in two and neither side is shaded, put the x on that line.';
            case 'someNot': return head + 'put an x in ' + A + ' outside ' + B + '. If a line cuts that part in two and neither side is shaded, put the x on the line.';
            case 'is': return head + 'shade the part of the ' + A + ' circle outside ' + B + ', then put an x for ' + A + ' in what is left (on the line if two places are left).';
            case 'isNot': return head + 'shade the part of the ' + A + ' circle inside ' + B + ', then put an x for ' + A + ' in what is left (on the line if two places are left).';
        }
        return head;
    }

    function conclusionHint(c, T) {
        const S = T[c.a].label, P = T[c.b].label;
        const need = {
            all: 'every part of ' + S + ' outside ' + P + ' to be shaded',
            no: 'every part where ' + S + ' and ' + P + ' overlap to be shaded',
            some: 'an x sitting completely inside both ' + S + ' and ' + P + ' (an x on a line that leads out does not count)',
            someNot: 'an x sitting completely inside ' + S + ' and outside ' + P,
            is: 'every part of ' + S + ' outside ' + P + ' to be shaded',
            isNot: 'every part of ' + S + ' inside ' + P + ' to be shaded',
        }[c.q];
        return 'The conclusion ' + quote(c.text) + ' needs ' + need + '. Does your diagram force that, or does it leave room for it to fail?';
    }

    function hints(data) {
        const T = data.terms;
        const out = ['Shade first, then place x\'s. "All" and "No" tell you which parts are EMPTY (shade them). "Some", and named individuals, tell you something EXISTS (an x). An x can never sit in a shaded part.'];
        data.premises.forEach((p, i) => out.push(premiseHint(p, T, i)));
        out.push(conclusionHint(data.conclusion, T));
        if (data.askWorld) out.push('VALID is about the form: if the premises were true, would the conclusion have to be true? TRUE is a different question: forget the premises and check the conclusion against our world. Absurd means it talks about things that do not exist here.');
        const an = analyseData(data);
        out.push(an.valid
            ? 'It is VALID. ' + validReason(data)
            : 'It is INVALID. ' + invalidReason(data, an) + (trapName(data) ? ' ' + trapName(data) : ''));
        return out;
    }

    function why(data) {
        const an = analyseData(data);
        const c = data.conclusion, T = data.terms;
        const mid = T[data.premises[0].a === c.a || data.premises[0].a === c.b ? data.premises[0].b : data.premises[0].a];
        const correct = an.valid ? validReason(data) : invalidReason(data, an);
        const distractors = an.valid ? [
            'Because the conclusion is true in real life, so the argument must be valid.',
            'Because both premises mention ' + mid.plural + ', so ' + T[c.a].plural + ' and ' + T[c.b].plural + ' must be connected somehow.',
            'Because the conclusion uses the same words as the premises.',
        ] : [
            'Because the conclusion is false or silly in our world, so it cannot follow.',
            'Because the premises are not true, and nothing can follow from untrue premises.',
            'Because the conclusion talks about ' + T[c.a].plural + ', and the first premise does not.',
        ];
        const rng = Rift.makeRng('venn-why:' + data.uid);
        const options = rng.shuffle([correct].concat(distractors));
        return {
            question: an.valid ? 'Why does ' + quote(c.text) + ' have to follow?' : 'Why does ' + quote(c.text) + ' NOT have to follow?',
            options,
            correct: options.indexOf(correct),
            explain: correct + ' ' + (trapName(data) ? trapName(data) + ' ' : '')
                + 'Validity is about form: IF the premises were true, would the conclusion have to be true? '
                + 'Whether the conclusion is actually true in our world is a separate question. Valid arguments can have false conclusions, and invalid ones can have true ones.',
        };
    }

    // =====================================================================
    // Checking
    // =====================================================================

    function regionsOk(list, R) {
        return Array.from(new Set((list || []).map(Number).filter(r => Number.isInteger(r) && r >= 0 && r < R)));
    }

    function normMark(mk, R) {
        const regs = regionsOk(Array.isArray(mk) ? mk : (mk && mk.regions) || [mk], R).sort((x, y) => x - y);
        return regs;
    }

    function worldWord(w) {
        return w === 'absurd' ? 'absurd (it is about things that do not exist here)' : w ? 'true' : 'false';
    }

    function check(data, answer) {
        const a = answer || {};
        const T = data.terms, n = T.length, R = 1 << n;
        const an = analyseData(data);

        // ---- the diagram ----
        const shaded = new Set(regionsOk(a.shading, R));
        const should = new Set(an.empty);
        const missing = an.empty.filter(r => !shaded.has(r));
        const extra = Array.from(shaded).filter(r => !should.has(r)).sort((x, y) => x - y);
        const expected = an.marks.map(m => m.join(','));
        const used = {};
        const given = (a.marks || []).map(mk => normMark(mk, R));
        const markOk = given.map(regs => {
            const key = regs.join(',');
            if (regs.length && expected.includes(key) && !used[key]) { used[key] = 1; return true; }
            return false;
        });
        const missingMarks = an.marks.filter(m => !used[m.join(',')]);
        const matched = markOk.filter(Boolean).length;
        const shadeScore = (R - missing.length - extra.length) / R;
        const markCount = Math.max(an.marks.length, given.length);
        const markScore = markCount ? matched / markCount : 1;
        const diagramScore = markCount ? 0.6 * shadeScore + 0.4 * markScore : shadeScore;
        const perfect = !missing.length && !extra.length && !missingMarks.length && markOk.every(Boolean);

        // ---- the judgements ----
        const validOk = a.valid === an.valid;
        const worldOk = !data.askWorld || a.trueInWorld === data.conclusion.world;
        const solved = validOk && worldOk;
        const partial = Math.round(((validOk ? 0.5 : 0) + (data.askWorld ? (worldOk ? 0.2 : 0) + 0.3 * diagramScore : 0.5 * diagramScore)) * 100) / 100;

        const lines = [];
        if (validOk) lines.push(an.valid ? 'Yes: it is VALID. ' + validReason(data) : 'Yes: it is INVALID. ' + invalidReason(data, an) + (trapName(data) ? ' ' + trapName(data) : ''));
        else if (a.valid == null) lines.push('Decide: VALID or INVALID?');
        else lines.push(a.valid
            ? 'Not quite. Try to break it: can you draw the premises so the conclusion is false?'
            : 'Not quite. Look again: is there really any way to draw the premises and still make the conclusion fail?');
        if (data.askWorld) {
            lines.push(worldOk
                ? 'And you kept VALID and TRUE apart: in our world the conclusion is ' + worldWord(data.conclusion.world) + '.'
                : 'TRUE is a different question from VALID. Forget the premises and check the conclusion against our world.');
        }
        const fixes = [];
        missing.forEach(r => fixes.push('the part ' + describeRegion(T, r) + ' should be shaded (a premise says it is empty)'));
        extra.forEach(r => fixes.push('the part ' + describeRegion(T, r) + ' should not be shaded (no premise says it is empty)'));
        given.forEach((regs, i) => {
            if (markOk[i]) return;
            if (regs.some(r => should.has(r) && regs.length === 1)) { fixes.push('an x sits in a shaded part: something cannot be in an empty place'); return; }
            const partOf = an.marks.find(m => m.length === 2 && regs.length === 1 && m.includes(regs[0]));
            const wider = an.marks.find(m => m.length === 1 && regs.length === 2 && regs.includes(m[0]));
            if (partOf) fixes.push('an x is too sure of itself: the premise does not say which side of the line, so put it ON the line');
            else if (wider) fixes.push('an x can be more precise: one side of its line is shaded, so it belongs ' + describeMark(T, wider));
            else fixes.push('an x is in a place no premise asks for');
        });
        missingMarks.forEach(m => {
            if (!given.some((regs, i) => !markOk[i] && regs.some(r => m.includes(r)))) fixes.push('an x is missing ' + describeMark(T, m));
        });
        if (perfect) lines.push('Your diagram is perfect.');
        else if (fixes.length) lines.push('Diagram: ' + fixes[0] + '.' + (fixes.length > 1 ? ' (' + (fixes.length - 1) + ' more marked on the board.)' : ''));

        return {
            solved,
            partial,
            feedback: lines.join(' '),
            validOk,
            worldOk,
            diagram: { missing, extra, markOk, missingMarks, perfect, score: Math.round(diagramScore * 100) / 100 },
        };
    }

    function solve(data) {
        const an = analyseData(data);
        const out = { shading: an.empty.slice(), marks: an.marks.map(m => m.slice()), valid: an.valid };
        if (data.askWorld) out.trueInWorld = data.conclusion.world;
        return out;
    }

    // =====================================================================
    // Geometry (pure): three circles, or four ellipses for a sorites
    // =====================================================================

    const VIEW = { w: 600, h: 520 };
    const UNIVERSE = { x: 8, y: 8, w: 584, h: 504, rx: 26 };
    const geoCache = {};

    function geometry(n) {
        if (geoCache[n]) return geoCache[n];
        let shapes;
        if (n === 3) {
            shapes = [
                { cx: 228, cy: 205, rx: 138, ry: 138, rot: 0 },
                { cx: 372, cy: 205, rx: 138, ry: 138, rot: 0 },
                { cx: 300, cy: 330, rx: 138, ry: 138, rot: 0 },
            ];
        } else {
            // the classic symmetric four-ellipse Venn diagram (all 16 regions)
            const base = [
                { cx: 0.350, cy: 0.400, w: 0.72, h: 0.45, a: 140 },
                { cx: 0.450, cy: 0.500, w: 0.72, h: 0.45, a: 140 },
                { cx: 0.544, cy: 0.500, w: 0.72, h: 0.45, a: 40 },
                { cx: 0.644, cy: 0.400, w: 0.72, h: 0.45, a: 40 },
            ];
            const S = 560, raw = base.map(e => ({ cx: e.cx * S, cy: (1 - e.cy) * S, rx: e.w * S / 2, ry: e.h * S / 2, rot: -e.a }));
            let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
            raw.forEach(e => {
                const t = e.rot * Math.PI / 180, c = Math.cos(t), s = Math.sin(t);
                const hx = Math.sqrt(e.rx * e.rx * c * c + e.ry * e.ry * s * s), hy = Math.sqrt(e.rx * e.rx * s * s + e.ry * e.ry * c * c);
                x0 = Math.min(x0, e.cx - hx); x1 = Math.max(x1, e.cx + hx); y0 = Math.min(y0, e.cy - hy); y1 = Math.max(y1, e.cy + hy);
            });
            const k = Math.min((VIEW.w - 70) / (x1 - x0), (VIEW.h - 90) / (y1 - y0));
            const ox = (VIEW.w - (x1 - x0) * k) / 2 - x0 * k, oy = (VIEW.h - (y1 - y0) * k) / 2 - y0 * k + 14;
            shapes = raw.map(e => ({ cx: e.cx * k + ox, cy: e.cy * k + oy, rx: e.rx * k, ry: e.ry * k, rot: e.rot }));
        }
        const centre = { x: VIEW.w / 2, y: VIEW.h / 2 };
        const labels = shapes.map(e => {
            let p;
            if (n === 3) {
                const dx = e.cx - centre.x, dy = e.cy - centre.y - 25, len = Math.hypot(dx, dy) || 1;
                p = { x: e.cx + dx / len * (e.rx + 6), y: e.cy + dy / len * (e.ry + 6) };
                if (p.y > e.cy) p.y = Math.min(p.y + 6, VIEW.h - 16);
            } else {
                const t = e.rot * Math.PI / 180;
                const ends = [1, -1].map(sg => ({ x: e.cx + sg * Math.cos(t) * e.rx, y: e.cy + sg * Math.sin(t) * e.rx }));
                p = ends[0].y < ends[1].y ? ends[0] : ends[1];
                p = { x: p.x, y: p.y - 12 };
            }
            return { x: Rift.clamp(p.x, 90, VIEW.w - 90), y: Rift.clamp(p.y, 24, VIEW.h - 18) };
        });
        const geo = { n, view: VIEW, universe: UNIVERSE, shapes, labels };
        geo.anchors = regionAnchors(geo);
        geoCache[n] = geo;
        return geo;
    }

    // inside? + distance to the boundary + nearest boundary point
    function hitShape(e, x, y) {
        const t = e.rot * Math.PI / 180, c = Math.cos(t), s = Math.sin(t);
        const dx = x - e.cx, dy = y - e.cy;
        const u = dx * c + dy * s, v = -dx * s + dy * c;
        const q = Math.sqrt((u / e.rx) * (u / e.rx) + (v / e.ry) * (v / e.ry));
        const rho = Math.hypot(dx, dy);
        if (q < 1e-9) return { inside: true, dist: Math.min(e.rx, e.ry), sx: x, sy: y };
        return { inside: q <= 1, dist: Math.abs(rho - rho / q), sx: e.cx + dx / q, sy: e.cy + dy / q };
    }

    function inUniverse(x, y) {
        const u = UNIVERSE;
        return x >= u.x && x <= u.x + u.w && y >= u.y && y <= u.y + u.h;
    }

    function locate(geo, x, y, tol) {
        if (!inUniverse(x, y)) return null;
        let region = 0, line = null;
        geo.shapes.forEach((e, k) => {
            const h = hitShape(e, x, y);
            if (h.inside) region |= 1 << k;
            if (h.dist < tol && (!line || h.dist < line.dist)) line = { k, dist: h.dist, x: h.sx, y: h.sy };
        });
        return { region, line };
    }

    // A comfortable point inside each region (furthest from every line).
    function regionAnchors(geo) {
        const best = {};
        const u = UNIVERSE;
        for (let y = u.y + 4; y < u.y + u.h; y += 5) {
            for (let x = u.x + 4; x < u.x + u.w; x += 5) {
                let r = 0, clear = Math.min(x - u.x, u.x + u.w - x, y - u.y, u.y + u.h - y);
                geo.shapes.forEach((e, k) => {
                    const h = hitShape(e, x, y);
                    if (h.inside) r |= 1 << k;
                    clear = Math.min(clear, h.dist);
                });
                if (!best[r] || clear > best[r].clear) best[r] = { x, y, clear };
            }
        }
        return best;
    }

    // =====================================================================
    // DOM
    // =====================================================================

    const TERM_COLOURS = ['#9b1f7d', '#1d6f8f', '#a8620c', '#3c7d22'];
    const SVGNS = 'http://www.w3.org/2000/svg';
    let mountCount = 0;

    function svg(tag, attrs, children) {
        const node = root.document.createElementNS(SVGNS, tag);
        Object.entries(attrs || {}).forEach(([k, v]) => { if (v != null) node.setAttribute(k, v); });
        (children || []).forEach(c => c && node.appendChild(c));
        return node;
    }

    function shapeNode(e, attrs) {
        return svg('ellipse', Object.assign({ cx: e.cx, cy: e.cy, rx: e.rx, ry: e.ry,
            transform: e.rot ? 'rotate(' + e.rot + ' ' + e.cx + ' ' + e.cy + ')' : null }, attrs || {}));
    }

    function mount(container, data, api) {
        const el = (api && api.el) || Rift.el;
        const sfx = name => { try { api && api.sfx && api.sfx(name); } catch (e) { /* sound is optional */ } };
        const doc = root.document;
        const T = data.terms, n = T.length, R = 1 << n;
        const geo = geometry(n);
        const P = 'vn' + (++mountCount) + '-';
        const askWorld = !!data.askWorld;
        const state = { tool: 'shade', shaded: new Set(), counters: [], valid: null, world: null, solved: false, nextId: 1 };

        const prevPos = container.style.position;
        if (root.getComputedStyle && root.getComputedStyle(container).position === 'static') container.style.position = 'relative';

        // ---------- the board (SVG) ----------
        const U = geo.universe;
        const defs = svg('defs', {}, [
            svg('pattern', { id: P + 'hatch', width: 9, height: 9, patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(45)' }, [
                svg('rect', { width: 9, height: 9, fill: '#3b2b3c', 'fill-opacity': '0.62' }),
                svg('line', { x1: 0, y1: 0, x2: 0, y2: 9, stroke: '#1A1020', 'stroke-width': 4, 'stroke-opacity': '0.75' }),
            ]),
        ]);
        geo.shapes.forEach((e, k) => defs.appendChild(svg('clipPath', { id: P + 'c' + k }, [shapeNode(e)])));

        const regionLayer = svg('g', { class: 'vn-regions' });
        const regionNodes = [];
        for (let r = 0; r < R; r++) {
            const excluded = geo.shapes.map((e, k) => k).filter(k => !(r & (1 << k)));
            let inner = svg('g', {}, [
                svg('rect', { class: 'vn-shade', x: U.x, y: U.y, width: U.w, height: U.h, rx: U.rx, fill: 'url(#' + P + 'hatch)' }),
                svg('rect', { class: 'vn-glow', x: U.x, y: U.y, width: U.w, height: U.h, rx: U.rx }),
            ]);
            if (excluded.length) {
                const mask = svg('mask', { id: P + 'm' + r, maskUnits: 'userSpaceOnUse', x: 0, y: 0, width: geo.view.w, height: geo.view.h },
                    [svg('rect', { x: 0, y: 0, width: geo.view.w, height: geo.view.h, fill: '#fff' })]
                        .concat(excluded.map(k => shapeNode(geo.shapes[k], { fill: '#000' }))));
                defs.appendChild(mask);
                inner.setAttribute('mask', 'url(#' + P + 'm' + r + ')');
            }
            for (let k = 0; k < n; k++) {
                if (r & (1 << k)) inner = svg('g', { 'clip-path': 'url(#' + P + 'c' + k + ')' }, [inner]);
            }
            const holder = svg('g', { class: 'vn-region', 'data-region': r }, [inner]);
            regionNodes.push(holder);
            regionLayer.appendChild(holder);
        }

        const fills = svg('g', { class: 'vn-fills' }, geo.shapes.map((e, k) => shapeNode(e, { fill: TERM_COLOURS[k], 'fill-opacity': '0.09' })));
        const strokes = svg('g', { class: 'vn-strokes' }, geo.shapes.map((e, k) => shapeNode(e, { fill: 'none', stroke: TERM_COLOURS[k], 'stroke-width': 3.5 })));
        const labelLayer = svg('g', { class: 'vn-labels' });
        geo.labels.forEach((p, k) => {
            const text = T[k].label;
            const w = Math.max(60, text.length * 9.2 + 22);
            labelLayer.appendChild(svg('g', { transform: 'translate(' + p.x + ' ' + p.y + ')' }, [
                svg('rect', { x: -w / 2, y: -14, width: w, height: 28, rx: 14, fill: TERM_COLOURS[k], stroke: '#1A1020', 'stroke-width': 2.5 }),
                (() => { const t = svg('text', { x: 0, y: 5, 'text-anchor': 'middle', class: 'vn-label-text' }); t.textContent = text; return t; })(),
            ]));
        });
        const ghostLayer = svg('g', { class: 'vn-ghosts' });
        const counterLayer = svg('g', { class: 'vn-counters' });
        const hoverDot = svg('circle', { class: 'vn-hover-dot', r: 9, cx: -50, cy: -50 });

        const board = svg('svg', { class: 'vn-svg', viewBox: '0 0 ' + geo.view.w + ' ' + geo.view.h, preserveAspectRatio: 'xMidYMid meet', role: 'img',
            'aria-label': 'Venn diagram with ' + n + ' circles' }, [
            defs,
            svg('rect', { class: 'vn-universe', x: U.x, y: U.y, width: U.w, height: U.h, rx: U.rx }),
            fills, regionLayer, strokes, labelLayer, ghostLayer, counterLayer, hoverDot,
        ]);

        const status = el('div.vn-status', { text: 'Point at the board.' });
        const toolShade = el('button.btn.small.vn-tool', { type: 'button', 'aria-pressed': 'true', onclick: () => setTool('shade') }, [el('span.vn-tool-icon.vn-icon-shade'), 'Shade']);
        const toolCounter = el('button.btn.small.vn-tool', { type: 'button', 'aria-pressed': 'false', onclick: () => setTool('counter') }, [el('span.vn-tool-icon.vn-icon-x', { text: 'x' }), 'Place x']);
        const tray = el('div.vn-tray', { title: 'Drag an x onto the board' }, [el('span.vn-token', { text: 'x' }), el('span.small', { text: 'drag me' })]);
        const clearBtn = el('button.btn.small', { type: 'button', onclick: () => { state.shaded.clear(); state.counters = []; clearFeedback(); render(); sfx('click'); } }, ['Clear']);

        const boardWrap = el('div.vn-board.parchment', {}, [
            el('div.vn-board-head', {}, [
                el('span.vn-theme', { text: data.theme.name }),
                el('div.vn-tools', {}, [toolShade, toolCounter, tray, clearBtn]),
            ]),
            el('div.vn-svg-wrap', {}, [board]),
            status,
        ]);

        // ---------- the scrolls ----------
        const NUMERALS = ['I', 'II', 'III', 'IV'];
        const chip = p => p.t === 'term'
            ? el('span.vn-term', { style: { '--term': TERM_COLOURS[p.i] }, text: p.s })
            : el('span.vn-word', { text: p.s });
        const sentence = ps => {
            const out = [];
            ps.forEach((p, i) => { if (i) out.push(' '); out.push(chip(p)); });
            out.push('.');
            return out;
        };
        const scrolls = data.premises.map((p, i) => el('div.vn-scroll', {}, [
            el('span.vn-seal', { text: NUMERALS[i] }),
            el('div.vn-scroll-body', {}, [
                el('div.vn-statement', {}, sentence(p.parts)),
                p.say ? el('div.vn-say', { text: (data.credit ? 'Carroll wrote: ' : 'Often said: ') + quote(p.say) + '.' }) : null,
            ]),
        ]));
        const conclusionScroll = el('div.vn-scroll.vn-conclusion', {}, [
            el('span.vn-seal', { text: '∴' }),
            el('div.vn-scroll-body', {}, [
                el('div.vn-therefore', { text: 'Therefore…' }),
                el('div.vn-statement', {}, sentence(data.conclusion.parts)),
            ]),
        ]);

        // ---------- verdicts ----------
        const choice = (label, cls, onclick) => el('button.btn.vn-choice' + (cls ? '.' + cls : ''), { type: 'button', 'aria-pressed': 'false', onclick }, [label]);
        const validBtn = choice('Valid', 'vn-valid', () => pickValid(true));
        const invalidBtn = choice('Invalid', 'vn-invalid', () => pickValid(false));
        const worldBtns = askWorld ? [
            [true, choice('True', '', () => pickWorld(true))],
            [false, choice('False', '', () => pickWorld(false))],
            ['absurd', choice('Absurd', '', () => pickWorld('absurd'))],
        ] : [];
        const submitBtn = el('button.btn.primary.vn-submit', { type: 'button', disabled: true, onclick: submit }, ['Seal the verdict']);
        const result = el('div.vn-result', { 'aria-live': 'polite' });

        const steps = el('div.vn-steps.panel', {}, [
            el('div.vn-step', {}, [
                el('div.vn-step-title', {}, [el('span.vn-num', { text: '1' }), 'Draw the premises']),
                el('div.vn-legend', {}, [
                    el('span.vn-key', {}, [el('span.vn-swatch.vn-swatch-shade'), 'shaded = EMPTY']),
                    el('span.vn-key', {}, [el('span.vn-token.vn-token-small', { text: 'x' }), 'x = something IS here']),
                    el('span.vn-key', {}, [el('span.vn-swatch'), 'blank = we don\'t know']),
                ]),
            ]),
            el('div.vn-step', {}, [
                el('div.vn-step-title', {}, [el('span.vn-num', { text: '2' }), 'Must the conclusion follow?']),
                el('div.vn-choices', {}, [validBtn, invalidBtn]),
            ]),
            askWorld ? el('div.vn-step', {}, [
                el('div.vn-step-title', {}, [el('span.vn-num', { text: '3' }), 'Is the conclusion true in our world?']),
                el('div.vn-choices', {}, worldBtns.map(x => x[1])),
                el('div.vn-tip.small.muted', { text: 'Absurd = about things that don\'t exist here, so it can\'t be checked.' }),
            ]) : null,
            submitBtn,
            result,
        ]);

        const side = el('div.vn-side', {}, [
            el('div.vn-scrolls', {}, scrolls.concat([conclusionScroll])),
            data.credit ? el('div.vn-credit', { text: 'Premises ' + data.credit + '.' }) : null,
            steps,
        ]);

        const rootNode = el('div.vn-root', { dataset: { terms: String(n) } }, [boardWrap, side]);
        container.appendChild(rootNode);

        // ---------- interaction ----------
        function toSvg(clientX, clientY) {
            const m = board.getScreenCTM();
            if (!m) return null;
            const pt = board.createSVGPoint();
            pt.x = clientX; pt.y = clientY;
            const p = pt.matrixTransform(m.inverse());
            return { x: p.x, y: p.y };
        }

        function lineTolerance() {
            const m = board.getScreenCTM();
            const scale = m ? Math.abs(m.a) || 1 : 1;
            return Math.max(7, 11 / scale);
        }

        // where would an x dropped at (x, y) sit?
        function placement(x, y) {
            const loc = locate(geo, x, y, lineTolerance());
            if (!loc) return null;
            if (loc.line) {
                const bit = 1 << loc.line.k;
                const regs = [loc.region & ~bit, loc.region | bit].sort((a, b) => a - b);
                return { x: loc.line.x, y: loc.line.y, regions: regs };
            }
            return { x, y, regions: [loc.region] };
        }

        function setTool(t) {
            state.tool = t;
            toolShade.setAttribute('aria-pressed', String(t === 'shade'));
            toolCounter.setAttribute('aria-pressed', String(t === 'counter'));
            rootNode.dataset.tool = t;
            sfx('click');
        }
        rootNode.dataset.tool = 'shade';

        function describeSpot(x, y) {
            const loc = locate(geo, x, y, lineTolerance());
            if (!loc) return 'Point at the board.';
            if (state.tool === 'counter' && loc.line) {
                return 'On the ' + T[loc.line.k].label + ' line: an x here could be on either side.';
            }
            const r = loc.region;
            return (state.shaded.has(r) ? 'Shaded: ' : '') + 'the part ' + describeRegion(T, r) + '.';
        }

        let hoverRegion = -1;
        function onMove(e) {
            if (drag) return;
            const p = toSvg(e.clientX, e.clientY);
            if (!p) return;
            const loc = locate(geo, p.x, p.y, lineTolerance());
            const r = loc ? loc.region : -1;
            if (r !== hoverRegion) {
                if (hoverRegion >= 0) regionNodes[hoverRegion].classList.remove('hover');
                hoverRegion = r;
                if (r >= 0 && state.tool === 'shade') regionNodes[r].classList.add('hover');
            }
            if (state.tool === 'counter' && loc && loc.line) {
                hoverDot.setAttribute('cx', loc.line.x); hoverDot.setAttribute('cy', loc.line.y);
            } else {
                hoverDot.setAttribute('cx', -50); hoverDot.setAttribute('cy', -50);
            }
            status.textContent = describeSpot(p.x, p.y);
        }
        function onLeave() {
            if (hoverRegion >= 0) regionNodes[hoverRegion].classList.remove('hover');
            hoverRegion = -1;
            hoverDot.setAttribute('cx', -50);
            status.textContent = 'Point at the board.';
        }

        function onBoardClick(e) {
            if (state.solved || suppressClick) { suppressClick = false; return; }
            if (e.target.closest && e.target.closest('.vn-counter')) return;
            const p = toSvg(e.clientX, e.clientY);
            if (!p) return;
            if (state.tool === 'counter') {
                addCounter(p.x, p.y);
                return;
            }
            const loc = locate(geo, p.x, p.y, 0);
            if (!loc) return;
            if (state.shaded.has(loc.region)) state.shaded.delete(loc.region); else state.shaded.add(loc.region);
            sfx('click');
            clearFeedback();
            render();
            status.textContent = describeSpot(p.x, p.y);
        }

        function addCounter(x, y) {
            const pl = placement(x, y);
            if (!pl) return false;
            if (state.counters.length >= 6) { sfx('error'); status.textContent = 'Six x\'s is plenty: click one to remove it.'; return false; }
            state.counters.push({ id: state.nextId++, x: pl.x, y: pl.y, regions: pl.regions });
            sfx('place');
            clearFeedback();
            render();
            return true;
        }

        // dragging: from the tray (new x) or an existing x (move; a click removes it)
        let drag = null, suppressClick = false;
        function startDrag(e, counter) {
            if (state.solved) return;
            e.preventDefault();
            const ghost = el('span.vn-token.vn-drag-ghost', { text: 'x' });
            ghost.style.left = e.clientX + 'px';
            ghost.style.top = e.clientY + 'px';
            (doc.body || rootNode).appendChild(ghost);
            drag = { counter, ghost, sx: e.clientX, sy: e.clientY, moved: false };
            if (counter) counter.node.classList.add('dragging');
            doc.addEventListener('pointermove', onDragMove);
            doc.addEventListener('pointerup', onDragEnd);
            doc.addEventListener('pointercancel', onDragEnd);
        }
        function onDragMove(e) {
            if (!drag) return;
            if (Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy) > 4) drag.moved = true;
            drag.ghost.style.left = e.clientX + 'px';
            drag.ghost.style.top = e.clientY + 'px';
            drag.ghost.classList.toggle('visible', drag.moved);
            const p = toSvg(e.clientX, e.clientY);
            const pl = p && placement(p.x, p.y);
            if (pl && pl.regions.length === 2) { hoverDot.setAttribute('cx', pl.x); hoverDot.setAttribute('cy', pl.y); }
            else { hoverDot.setAttribute('cx', -50); }
            if (p && inUniverse(p.x, p.y)) status.textContent = describeSpot(p.x, p.y);
        }
        function onDragEnd(e) {
            if (!drag) return;
            const d = drag;
            drag = null;
            d.ghost.remove();
            doc.removeEventListener('pointermove', onDragMove);
            doc.removeEventListener('pointerup', onDragEnd);
            doc.removeEventListener('pointercancel', onDragEnd);
            hoverDot.setAttribute('cx', -50);
            const p = e.type === 'pointerup' ? toSvg(e.clientX, e.clientY) : null;
            const pl = p && placement(p.x, p.y);
            if (d.counter) {
                suppressClick = true;
                setTimeout(() => { suppressClick = false; }, 0);
                state.counters = state.counters.filter(c => c.id !== d.counter.id);
                if (d.moved && pl) {
                    state.counters.push({ id: state.nextId++, x: pl.x, y: pl.y, regions: pl.regions });
                    sfx('place');
                } else {
                    sfx('click'); // a click (or a drop off the board) removes it
                }
                clearFeedback();
                render();
            } else if (d.moved) {
                if (pl) addCounter(p.x, p.y);
            } else {
                setTool('counter');
                status.textContent = 'Click the board to place an x, or drag one from the tray.';
            }
        }

        tray.addEventListener('pointerdown', e => startDrag(e, null));
        board.addEventListener('pointermove', onMove);
        board.addEventListener('pointerleave', onLeave);
        board.addEventListener('click', onBoardClick);

        function pickValid(v) {
            if (state.solved) return;
            state.valid = v;
            validBtn.setAttribute('aria-pressed', String(v === true));
            invalidBtn.setAttribute('aria-pressed', String(v === false));
            sfx('click');
            updateSubmit();
        }
        function pickWorld(w) {
            if (state.solved) return;
            state.world = w;
            worldBtns.forEach(([val, b]) => b.setAttribute('aria-pressed', String(val === w)));
            sfx('click');
            updateSubmit();
        }
        function updateSubmit() {
            submitBtn.disabled = state.solved || state.valid == null || (askWorld && state.world == null);
        }

        function answer() {
            const a = {
                shading: Array.from(state.shaded).sort((x, y) => x - y),
                marks: state.counters.map(c => c.regions.slice()),
                valid: state.valid,
            };
            if (askWorld) a.trueInWorld = state.world;
            return a;
        }

        function clearFeedback() {
            regionNodes.forEach(g => g.classList.remove('need', 'extra'));
            ghostLayer.textContent = '';
            state.fb = null;
        }

        function showFeedback(res) {
            clearFeedback();
            state.fb = res.diagram;
            res.diagram.missing.forEach(r => regionNodes[r].classList.add('need'));
            res.diagram.extra.forEach(r => regionNodes[r].classList.add('extra'));
            res.diagram.missingMarks.forEach(m => {
                if (m.length !== 1) return;
                const a = geo.anchors[m[0]];
                if (!a) return;
                ghostLayer.appendChild(svg('g', { class: 'vn-ghost', transform: 'translate(' + a.x + ' ' + a.y + ')' }, [
                    svg('circle', { r: 15 }),
                    (() => { const t = svg('text', { y: 5, 'text-anchor': 'middle' }); t.textContent = 'x'; return t; })(),
                ]));
            });
            render();
        }

        function submit() {
            if (submitBtn.disabled) return;
            const ans = answer();
            const local = check(data, ans);
            let res = null;
            try { res = api && api.submit ? api.submit(ans) : null; } catch (e) { console.error('[venn] submit', e); }
            const shown = res && typeof res === 'object' && typeof res.feedback === 'string' ? res : local;
            showFeedback(local);
            result.className = 'vn-result ' + (shown.solved ? 'good' : 'bad');
            result.textContent = shown.feedback;
            sfx(shown.solved ? 'success' : 'error');
            if (shown.solved) {
                state.solved = true;
                rootNode.classList.add('solved');
                updateSubmit();
            }
        }

        function render() {
            regionNodes.forEach((g, r) => g.classList.toggle('shaded', state.shaded.has(r)));
            counterLayer.textContent = '';
            const fb = state.fb;
            state.counters.forEach((c, i) => {
                const t = svg('text', { y: 6, 'text-anchor': 'middle' });
                t.textContent = 'x';
                const cls = ['vn-counter'];
                if (c.regions.length === 2) cls.push('on-line');
                if (fb) cls.push(fb.markOk[i] ? 'ok' : 'bad');
                const node = svg('g', { class: cls.join(' '), transform: 'translate(' + c.x + ' ' + c.y + ')' }, [
                    svg('circle', { class: 'vn-counter-hit', r: 22 }),
                    svg('circle', { class: 'vn-counter-body', r: 15 }),
                    t,
                ]);
                c.node = node;
                node.addEventListener('pointerdown', e => { e.stopPropagation(); startDrag(e, c); });
                counterLayer.appendChild(node);
            });
        }

        render();
        updateSubmit();

        return {
            destroy() {
                if (drag) drag.ghost.remove();
                drag = null;
                doc.removeEventListener('pointermove', onDragMove);
                doc.removeEventListener('pointerup', onDragEnd);
                doc.removeEventListener('pointercancel', onDragEnd);
                rootNode.remove();
                container.style.position = prevPos;
            },
            // for the bench / tests: the current answer
            answer,
        };
    }

    // =====================================================================

    Rift.Puzzles.register({
        id: 'venn',
        rules: [
            "The scrolls give facts to assume for this argument.",
            "Shade means empty. An x means at least one thing exists there.",
            "Use Shade to click regions; drag an x from the tray. An x on a border leaves its side unknown.",
            "Valid means the conclusion must follow. Judge real-world truth separately when asked. The diagram is a thinking tool; the verdict decides the win.",
            "How to play is free. The Hint button shows its heart cost. Think first, then check your answer."
        ],
        tutorial: [
            {
                "text": "We judge whether the conclusion MUST follow from these facts. Read the scrolls first.",
                "highlight": ".vn-scrolls"
            },
            {
                "text": "Shade means no things here. Example: \"All ducks are birds\" shades the ducks-only region outside birds. It does not add an x.",
                "highlight": ".vn-tools"
            },
            {
                "text": "Some means at least one. \"Some ducks are birds\" needs an x in their overlap. \"No ducks are birds\" shades that overlap.",
                "highlight": ".vn-tools"
            },
            {
                "text": "Choose Shade and click a region, or drag an x from the tray. Put an x on a border when the facts leave its side open. Clear lets you restart.",
                "highlight": ".vn-svg-wrap"
            },
            {
                "text": "Choose Valid only if every possible world that fits the facts also fits the conclusion. A true conclusion can still come from a bad argument.",
                "highlight": ".vn-choices"
            },
            {
                "text": "Judge real-world truth separately if asked, then Seal the verdict. The diagram helps you think; read its feedback too. How to play is free. The Hint button shows its heart cost. Think first, then check your answer.",
                "highlight": ".vn-steps"
            }
        ],
        name: "Carroll's Venn Board",
        colour: 'language',
        family: 'Definitions and ambiguity',
        blurb: 'Shade what must be empty, mark what must exist, then decide: does the conclusion HAVE to follow?',
        tok: 'Validity is about form, not truth: a valid argument can reach a false conclusion, and a true conclusion can come from an invalid argument.',
        generate,
        check,
        hints,
        why,
        solve,
        mount,
        engine: { compile, models, analyse, analyseData, validIn, worldOf, worldTruth, placements, describeRegion,
            geometry, locate, THEMES, CLASSICS, CARROLL_PIECES },
    });
})(typeof window !== 'undefined' ? window : globalThis);
