/*
 * The Village: honest villagers and lying imps in the square of Boolesbury
 * (chapter 2, encounter 1). Lesson 2 teaches truth tables as a first taste of
 * proof, so this puzzle comes with a truth-table tool.
 *
 * Every villager is either HONEST (everything they say is true) or an IMP
 * (everything they say is false). The player is told how many imps there are.
 * Each villager says one statement whose shape depends on their job. A
 * brute-force solver tries every way the imps could be hiding (every "world")
 * and the generator keeps only puzzles with exactly ONE consistent world.
 *
 * Villagers stand in a row; "neighbours" means the villagers next to you.
 * Statement AST (villager references are indices into data.villagers; no
 * statement names its own speaker, except the Sweep's deliberate "I am honest"):
 *   { t:'imp', g }  { t:'honest', g }                Constable: "X is an imp."
 *   { t:'count', of:[a,b,c], n }                       Postmistress: exactly n imps among them
 *   { t:'same', g, h }  { t:'diff', g, h }            Lamplighter: same / different kinds
 *   { t:'if', a:atom, b:atom }                         Clockmaker: "If A is honest, then B is an imp."
 *   { t:'anyImp', of }  { t:'noImp', of }             Gardener: about their neighbours
 *   { t:'odd', of }                                    Schoolteacher: an odd number of them are imps
 *   { t:'self', g }                                    Sweep: "I am honest." (proves nothing)
 *   { t:'lying', g, about? }                           Baker: "X is lying (about Y)." = X's statement is false
 *
 * Mechanics in the spirit of social-deduction games (Demon Bluff and the
 * knights-and-knaves folk puzzle); every name, line and picture here is new.
 */
(function (root) {
    'use strict';

    const Rift = root.Rift;

    const ROLES = {
        baker: { name: 'Baker', species: 'bunny' },
        postmistress: { name: 'Postmistress', species: 'mouse' },
        clockmaker: { name: 'Clockmaker', species: 'hedgehog' },
        lamplighter: { name: 'Lamplighter', species: 'duck' },
        constable: { name: 'Constable', species: 'bulldog' },
        sweep: { name: 'Sweep', species: 'mole' },
        schoolteacher: { name: 'Teacher', species: 'stork' },
        gardener: { name: 'Gardener', species: 'goat' },
    };
    const ROLE_IDS = Object.keys(ROLES);
    const NUM = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight'];

    // Villager count, imp count and which jobs can appear, per difficulty.
    const CONFIG = {
        1: { n: [5, 6], k: [1, 1], roles: ['baker', 'postmistress', 'lamplighter', 'constable', 'sweep', 'gardener'] },
        2: { n: [6, 7], k: [1, 2], roles: ROLE_IDS },
        3: { n: [7, 8], k: [2, 3], roles: ROLE_IDS },
    };

    // ---- evaluation ---------------------------------------------------------

    // imp = [bool per villager]; says = every villager's statement (the Baker
    // talks about someone else's statement).
    function evaluate(node, imp, says) {
        switch (node.t) {
            case 'imp': return imp[node.g];
            case 'honest': return !imp[node.g];
            case 'count': return node.of.filter(i => imp[i]).length === node.n;
            case 'same': return imp[node.g] === imp[node.h];
            case 'diff': return imp[node.g] !== imp[node.h];
            case 'if': return !evaluate(node.a, imp, says) || evaluate(node.b, imp, says);
            case 'anyImp': return node.of.some(i => imp[i]);
            case 'noImp': return !node.of.some(i => imp[i]);
            case 'odd': return node.of.filter(i => imp[i]).length % 2 === 1;
            case 'self': return !imp[node.g];
            case 'lying': return !evaluate(says[node.g], imp, says);
        }
        throw new Error('Unknown statement node ' + node.t);
    }

    // Every world with exactly k imps among n villagers, in table order
    // (imps listed left to right, earliest villagers first).
    const worldCache = {};
    function worlds(n, k) {
        const key = n + ':' + k;
        if (worldCache[key]) return worldCache[key];
        const out = [];
        (function rec(start, picked) {
            if (picked.length === k) {
                const imp = new Array(n).fill(false);
                picked.forEach(i => { imp[i] = true; });
                out.push({ list: picked.slice(), imp });
                return;
            }
            for (let i = start; i < n; i++) { picked.push(i); rec(i + 1, picked); picked.pop(); }
        })(0, []);
        return (worldCache[key] = out);
    }

    // Honest villagers must say true things and imps false ones.
    function consistent(says, imp) {
        for (let i = 0; i < says.length; i++) if (evaluate(says[i], imp, says) === imp[i]) return false;
        return true;
    }

    function solutions(says, k) {
        return worlds(says.length, k).filter(w => consistent(says, w.imp));
    }

    // The truth table the in-game tool shows: one row per world, one cell per
    // statement (true/false in that world). A cell CLASHES when an honest
    // villager's statement is false there or an imp's is true.
    function table(data) {
        const says = data.villagers.map(v => v.says);
        return worlds(says.length, data.imps).map(w => {
            const cells = says.map(s => evaluate(s, w.imp, says));
            const clash = cells.map((v, i) => v === w.imp[i]);
            return { imps: w.list.slice(), imp: w.imp.slice(), cells, clash, possible: clash.indexOf(true) === -1 };
        });
    }

    // ---- rendering ------------------------------------------------------------

    function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

    function andList(items) {
        if (items.length <= 1) return items.join('');
        return items.slice(0, -1).join(', ') + ' and ' + items[items.length - 1];
    }

    function renderer(villagers) {
        const N = g => 'the ' + villagers[g].name;
        function clause(n) {
            switch (n.t) {
                case 'imp': return N(n.g) + ' is an imp';
                case 'honest': return N(n.g) + ' is honest';
                case 'count': return n.n === 0
                    ? 'none of ' + andList(n.of.map(N)) + ' is an imp'
                    : 'exactly ' + NUM[n.n] + ' of ' + andList(n.of.map(N)) + (n.n === 1 ? ' is an imp' : ' are imps');
                case 'same': return N(n.g) + ' and ' + N(n.h) + ' are the same kind';
                case 'diff': return N(n.g) + ' and ' + N(n.h) + ' are different kinds';
                case 'if': return 'if ' + clause(n.a) + ', then ' + clause(n.b);
                case 'anyImp': return n.of.length === 1
                    ? 'my neighbour, ' + N(n.of[0]) + ', is an imp'
                    : 'at least one of my neighbours (' + N(n.of[0]) + ', ' + N(n.of[1]) + ') is an imp';
                case 'noImp': return n.of.length === 1
                    ? 'my neighbour, ' + N(n.of[0]) + ', is honest'
                    : 'both my neighbours (' + N(n.of[0]) + ', ' + N(n.of[1]) + ') are honest';
                case 'odd': return 'an odd number of ' + andList(n.of.map(N)) + ' are imps';
                case 'self': return 'I am honest';
                case 'lying': return n.about != null ? N(n.g) + ' is lying about ' + N(n.about) : N(n.g) + ' is lying';
            }
            return '?';
        }
        return { clause, sentence: n => cap(clause(n)) + '.', N };
    }

    function statementText(data, i) {
        return renderer(data.villagers).sentence(data.villagers[i].says);
    }

    // Which villagers a statement names (the Baker's also names the one they
    // say is lying). Never includes the speaker, except the Sweep.
    function mentions(node, acc) {
        acc = acc || [];
        const add = g => { if (g != null && acc.indexOf(g) === -1) acc.push(g); };
        add(node.g); add(node.h);
        if (node.of) node.of.forEach(add);
        if (node.a) mentions(node.a, acc);
        if (node.b) mentions(node.b, acc);
        return acc;
    }

    // A short reason why statement `node` has the value it has in world `imp`,
    // in words. ctx 'world' = "here"; ctx 'answer' = "you accused …".
    function reason(data, node, imp, ctx) {
        const R = renderer(data.villagers);
        const says = data.villagers.map(v => v.says);
        const kind = g => ctx === 'answer'
            ? (imp[g] ? 'you accused ' : 'you did not accuse ') + R.N(g)
            : R.N(g) + (imp[g] ? ' is an imp' : ' is honest') + ' here';
        const many = of => {
            const c = of.filter(i => imp[i]).length;
            const who = of.filter(i => imp[i]).map(R.N);
            if (ctx === 'answer') return c ? 'you accused ' + NUM[c] + ' of them (' + andList(who) + ')' : 'you accused none of them';
            return c ? NUM[c] + ' of them ' + (c === 1 ? 'is an imp' : 'are imps') + ' here (' + andList(who) + ')' : 'none of them is an imp here';
        };
        switch (node.t) {
            case 'imp': case 'honest': case 'self': return kind(node.g);
            case 'same': case 'diff': return kind(node.g) + ', and ' + kind(node.h);
            case 'count': case 'anyImp': case 'noImp': return many(node.of);
            case 'odd': {
                const c = node.of.filter(i => imp[i]).length;
                return many(node.of) + ', and ' + NUM[c] + ' is ' + (c % 2 ? 'odd' : 'even');
            }
            case 'if': {
                const va = evaluate(node.a, imp, says), vb = evaluate(node.b, imp, says);
                const head = '“If … then” is false only when the first part is true and the second is false';
                if (va && !vb) return reason(data, node.a, imp, ctx) + ' and ' + reason(data, node.b, imp, ctx) + ' (' + head + ')';
                if (!va) return reason(data, node.a, imp, ctx) + ', so the “if” part is false and the whole sentence is true (' + head + ')';
                return reason(data, node.b, imp, ctx) + ', so the “then” part is true';
            }
            case 'lying': {
                const v = evaluate(says[node.g], imp, says);
                return R.N(node.g) + '’s statement is ' + (v ? 'true' : 'false') + (ctx === 'answer' ? ' in your answer' : ' here')
                    + ' (' + reason(data, says[node.g], imp, ctx) + ')';
            }
        }
        return '';
    }

    // ---- generation -----------------------------------------------------------

    function others(s, n) {
        const out = [];
        for (let i = 0; i < n; i++) if (i !== s) out.push(i);
        return out;
    }
    const sorted = list => list.slice().sort((x, y) => x - y);
    const atom = (rng, g) => ({ t: rng.chance(0.5) ? 'imp' : 'honest', g });

    // One maker per job. Arguments: rng, speaker, n villagers, k imps, says.
    const MAKERS = {
        constable: (rng, s, n) => atom(rng, rng.pick(others(s, n))),
        postmistress: (rng, s, n, k) => ({
            t: 'count',
            of: sorted(rng.shuffle(others(s, n)).slice(0, 3)),
            n: rng.weighted(k === 1 ? { 0: 1, 1: 3 } : { 0: 1, 1: 3, 2: 3, 3: k >= 3 ? 1 : 0.4 }) | 0,
        }),
        lamplighter: (rng, s, n) => {
            const [g, h] = sorted(rng.shuffle(others(s, n)).slice(0, 2));
            return { t: rng.chance(0.65) ? 'same' : 'diff', g, h };
        },
        clockmaker: (rng, s, n) => {
            const [g, h] = rng.shuffle(others(s, n));
            return { t: 'if', a: atom(rng, g), b: atom(rng, h) };
        },
        gardener: (rng, s, n) => {
            const of = [s - 1, s + 1].filter(i => i >= 0 && i < n);
            return { t: rng.chance(0.6) ? 'anyImp' : 'noImp', of };
        },
        schoolteacher: (rng, s, n) => ({
            t: 'odd',
            of: sorted(rng.shuffle(others(s, n)).slice(0, n >= 7 && rng.chance(0.4) ? 4 : 3)),
        }),
        sweep: (rng, s) => ({ t: 'self', g: s }),
        baker: (rng, s, n, k, says) => {
            const pool = others(s, n).filter(i => says[i] && says[i].t !== 'lying');
            const g = rng.pick(pool);
            const named = mentions(says[g]).filter(x => x !== g);
            const node = { t: 'lying', g };
            if (named.length === 1 && named[0] !== s) node.about = named[0];
            return node;
        },
    };

    function truthKey(node, n, k, says) {
        let key = '';
        for (const w of worlds(n, k)) key += evaluate(node, w.imp, says) ? '1' : '0';
        return key;
    }
    const negKey = s => s.replace(/[01]/g, m => (m === '1' ? '0' : '1'));

    // A statement is worth saying if, over the possible worlds, it is not
    // always true or always false, it is not secretly about the speaker's own
    // kind (only the Sweep says that, on purpose), and an "if" isn't just one
    // of its parts.
    function worthSaying(node, s, says, k) {
        const n = says.length;
        if (node.t === 'self') return true;
        if (mentions(node).indexOf(s) !== -1) return false;
        const tt = truthKey(node, n, k, says);
        if (tt.indexOf('0') === -1 || tt.indexOf('1') === -1) return false;
        const speaker = truthKey({ t: 'honest', g: s }, n, k, says);
        if (tt === speaker || tt === negKey(speaker)) return false;
        if (node.t === 'if') {
            if (node.a.g === node.b.g) return false;
            const ta = truthKey(node.a, n, k, says), tb = truthKey(node.b, n, k, says);
            if ([ta, tb, negKey(ta), negKey(tb)].indexOf(tt) !== -1) return false;
        }
        return true;
    }

    // A statement for villager s that is true if s is honest in the target
    // world, false if s is an imp there.
    function sampleMatching(rng, roles, s, k, says, target) {
        const n = roles.length;
        for (let tries = 0; tries < 40; tries++) {
            const node = MAKERS[roles[s]](rng, s, n, k, says);
            const trial = says.slice();
            trial[s] = node;
            if (evaluate(node, target, trial) === target[s]) continue;
            if (!worthSaying(node, s, trial, k)) continue;
            return node;
        }
        return null;
    }

    function score(says, k, target) {
        const n = says.length;
        if (says.some(x => !x) || !consistent(says, target)) return 999;
        let sc = solutions(says, k).length;
        // Every statement must still be worth saying (the Baker's depends on
        // the statement they call a lie, which may have changed).
        says.forEach((x, i) => { if (!worthSaying(x, i, says, k)) sc += 5; });
        // Two statements that are true in exactly the same worlds waste a voice.
        const keys = says.filter(x => x.t !== 'self').map(x => truthKey(x, n, k, says));
        sc += 2 * (keys.length - new Set(keys).size);
        return sc;
    }

    function generate(rng, difficulty) {
        const diff = Rift.clamp(Math.round(difficulty || 1), 1, 3);
        const cfg = CONFIG[diff];
        const n = rng.int(cfg.n[0], cfg.n[1]);
        const k = rng.int(cfg.k[0], cfg.k[1]);
        const roles = rng.shuffle(cfg.roles).slice(0, n);
        // The Baker talks about someone else's statement, so is written last.
        const order = others(-1, n).sort((a, b) => (roles[a] === 'baker') - (roles[b] === 'baker'));

        let says = null, target = null;
        for (let attempt = 0; attempt < 80 && !says; attempt++) {
            const pick = rng.shuffle(others(-1, n)).slice(0, k);
            target = new Array(n).fill(false);
            pick.forEach(i => { target[i] = true; });

            let cur = new Array(n).fill(null);
            for (const s of order) cur[s] = sampleMatching(rng, roles, s, k, cur, target);
            if (cur.some(x => !x)) continue;
            let sc = score(cur, k, target);
            for (let iter = 0; iter < 300 && sc > 1; iter++) {
                const s = rng.int(0, n - 1);
                if (roles[s] === 'sweep') continue;
                const cand = sampleMatching(rng, roles, s, k, cur, target);
                if (!cand) continue;
                const next = cur.slice();
                next[s] = cand;
                const ns = score(next, k, target);
                if (ns <= sc) { cur = next; sc = ns; }
            }
            if (sc === 1) says = cur;
        }
        if (!says) return fallback(rng, diff);

        return finish(rng, diff, roles, says, k);
    }

    function finish(rng, diff, roles, says, k) {
        const data = {
            v: 1,
            difficulty: diff,
            seed: rng.int(0, 2147483646),
            imps: k,
            villagers: roles.map((role, i) => ({
                id: role, role, name: ROLES[role].name, species: ROLES[role].species, says: says[i],
            })),
        };
        data.villagers.forEach((v, i) => { v.text = statementText(data, i); });
        return data;
    }

    // Never expected in play (the tests check), but always uniquely solvable:
    // five villagers, one imp, a chain the Constable starts.
    function fallback(rng, diff) {
        const roles = ['constable', 'lamplighter', 'postmistress', 'gardener', 'baker'];
        const says = [
            { t: 'imp', g: 3 },                     // Constable: the Gardener is an imp
            { t: 'same', g: 0, h: 2 },              // Lamplighter: Constable and Postmistress same kind
            { t: 'count', of: [0, 1, 4], n: 0 },    // Postmistress: none of Constable, Lamplighter, Baker
            { t: 'anyImp', of: [2, 4] },            // Gardener (imp): one of my neighbours is an imp
            { t: 'lying', g: 3 },                   // Baker: the Gardener is lying
        ];
        return finish(rng, diff, roles, says, 1);
    }

    // ---- solving and checking ----------------------------------------------

    function saysOf(data) { return data.villagers.map(v => v.says); }

    function solve(data) {
        const sol = solutions(saysOf(data), data.imps);
        if (sol.length !== 1) return null;
        return { imps: sol[0].list.map(i => data.villagers[i].id) };
    }

    // The first statement that breaks in world `imp`, or -1.
    function firstClash(data, imp) {
        const says = saysOf(data);
        for (let i = 0; i < says.length; i++) if (evaluate(says[i], imp, says) === imp[i]) return i;
        return -1;
    }

    function check(data, answer) {
        const n = data.villagers.length, k = data.imps;
        const sol = solve(data);
        const ids = answer && Array.isArray(answer.imps) ? answer.imps : [];
        const imp = data.villagers.map(v => ids.indexOf(v.id) !== -1);
        const solImp = data.villagers.map(v => !!sol && sol.imps.indexOf(v.id) !== -1);
        const right = imp.filter((x, i) => x === solImp[i]).length;
        const partial = right / n;
        const accused = imp.filter(Boolean).length;
        const R = renderer(data.villagers);

        if (!accused) {
            return { solved: false, partial, feedback: 'Place an accuse token on every villager you think is an imp (there ' + (k === 1 ? 'is one imp' : 'are ' + NUM[k] + ' imps') + ').' };
        }
        if (sol && right === n) {
            const who = andList(sol.imps.map(id => 'the ' + data.villagers.find(v => v.id === id).name));
            return { solved: true, partial: 1, feedback: 'Unmasked! ' + cap(who) + (k === 1 ? ' was the imp' : ' were the imps') + '. In this world, and only this one, every honest villager tells the truth and every imp lies.' };
        }
        const i = firstClash(data, imp);
        let clashText = '';
        if (i >= 0) {
            const v = data.villagers[i];
            const quote = '“' + v.text.replace(/[.]$/, '') + '”';
            const why = reason(data, v.says, imp, 'answer');
            clashText = imp[i]
                ? 'If the ' + v.name + ' is an imp, what they say must be false. But ' + quote + ' is true in your answer' + (why ? ': ' + why : '') + '.'
                : 'If the ' + v.name + ' is honest, what they say must be true. But ' + quote + ' is false in your answer' + (why ? ': ' + why : '') + '.';
        }
        if (accused !== k) {
            return {
                solved: false, partial,
                feedback: 'There ' + (k === 1 ? 'is exactly one imp' : 'are exactly ' + NUM[k] + ' imps') + ', and you accused ' + NUM[accused] + '.' + (clashText ? ' Also: ' + clashText : ''),
            };
        }
        return { solved: false, partial, feedback: clashText || 'Everything fits your answer, but the square disagrees. Check again.' };
    }

    // ---- hints and the "why?" question ---------------------------------------

    // How many possible worlds a villager's statement rules out if we KNOW
    // they are honest (their statement must then be true).
    function cutIfHonest(data, i) {
        const says = saysOf(data);
        return worlds(says.length, data.imps).filter(w => !w.imp[i] && evaluate(says[i], w.imp, says)).length;
    }

    function hints(data) {
        const sol = solve(data);
        const n = data.villagers.length, k = data.imps;
        const rows = worlds(n, k).length;
        const out = [];
        out.push('Open the truth table. Each of its ' + rows + ' rows is one possible world: one way '
            + (k === 1 ? 'the imp' : 'the ' + NUM[k] + ' imps') + ' could be hiding. A world is impossible as soon as an honest villager says something false there, or an imp says something true.');

        const sweep = data.villagers.findIndex(v => v.says.t === 'self');
        const pickTest = data.villagers.findIndex(v => v.says.t === 'imp' || v.says.t === 'honest' || v.says.t === 'lying');
        if (sweep >= 0) {
            out.push('The Sweep’s “I am honest.” proves nothing: an honest Sweep says it truthfully, and an imp Sweep says it as a lie. In the table, the Sweep’s column never clashes. Look at what the others say about the Sweep instead.');
        } else {
            const s = pickTest >= 0 ? pickTest : 0;
            out.push('Suppose the ' + data.villagers[s].name + ' is honest. Then “' + data.villagers[s].text.replace(/[.]$/, '') + '” is true. Which worlds are left? If none of them work, the ' + data.villagers[s].name + ' must be an imp.');
        }

        // Last hint: reveal the honest villager whose words rule out the most worlds.
        if (sol) {
            let best = -1, bestCut = -1;
            data.villagers.forEach((v, i) => {
                if (sol.imps.indexOf(v.id) !== -1 || v.says.t === 'self') return;
                const c = cutIfHonest(data, i);
                if (c > bestCut) { best = i; bestCut = c; }
            });
            if (best < 0) best = data.villagers.findIndex(v => sol.imps.indexOf(v.id) === -1);
            const v = data.villagers[best];
            out.push('The ' + v.name + ' is honest, so “' + v.text.replace(/[.]$/, '') + '” is true. Cross out every world where it is false.');
        }
        return out;
    }

    function why(data) {
        const sol = solve(data);
        if (!sol) return null;
        const names = sol.imps.map(id => 'the ' + data.villagers.find(v => v.id === id).name);
        const who = andList(names);
        const k = data.imps;
        const rows = worlds(data.villagers.length, k).length;
        const correct = 'The truth table lists every possible world, and every world except this one contains a contradiction, so this one must be the real one.';
        const accusers = data.villagers.filter(v => v.says.t === 'imp' || v.says.t === 'anyImp' || v.says.t === 'lying');
        const wrong = [
            'Because ' + who + ' looked nervous when the accuse tokens came out.',
            accusers.length
                ? 'Because most of the villagers pointed at ' + (k === 1 ? 'that one' : 'them') + ', and the majority is usually right.'
                : 'Because nobody defended ' + (k === 1 ? 'that villager' : 'them') + ', and silence means guilt.',
            data.villagers.some(v => v.says.t === 'self')
                ? 'Because the Sweep said “I am honest.”, and an imp could never say that.'
                : 'Because the first world we tried in the table worked, so there was no need to check the rest.',
        ];
        const rng = Rift.makeRng('village-why:' + data.seed);
        const options = rng.shuffle([correct].concat(wrong));
        return {
            question: 'How do you know ' + who + (k === 1 ? ' is the imp' : ' are the imps') + '?',
            options,
            correct: options.indexOf(correct),
            explain: 'There were only ' + rows + ' possible worlds, and the table checked them all. Every other world breaks a rule somewhere (an honest villager saying something false, or an imp saying something true). When every alternative leads to a contradiction, the conclusion is proved, not guessed. Looks, majorities and confident voices prove nothing; an imp can say “I am honest” just as easily as anyone.',
        };
    }

    // ---- DOM ------------------------------------------------------------------
    //
    // The square: villagers in a row, each with a speech bubble; click a
    // villager to place / take back an accuse token, then Accuse.
    //
    // The truth-table tool: rows = every possible world (way the k imps could
    // be hiding), columns = each villager's statement, a cell = is that
    // statement true in that world? At difficulty 1-2 the player fills cells in
    // (each answer is checked, with a reason when wrong); after two correct
    // cells in a column, that column can be auto-filled. At difficulty 3 the
    // tool starts open and any column can be filled at once: the job is to
    // spot the clashes. A row can only be crossed out once a clash in it is
    // showing; when one world survives, that is the proof.

    const POSE_ACCUSING = { imp: 1, anyImp: 1, lying: 1 };
    const artId = (v, pose) => 'npc/villager-' + v.role + '/' + pose;

    function mount(container, data, api) {
        const el = (api && api.el) || Rift.el;
        const doc = root.document;
        const sfx = name => { try { if (api && api.sfx) api.sfx(name); } catch (e) { /* sound is optional */ } };
        const n = data.villagers.length, k = data.imps, diff = data.difficulty;
        const R = renderer(data.villagers);
        const says = saysOf(data);
        const rows = table(data);
        const short = i => data.villagers[i].name;
        const worldName = r => andList(rows[r].imps.map(i => 'the ' + short(i)));

        const st = {
            accused: [],
            done: false,
            ttOpen: diff === 3,
            filled: rows.map(() => new Array(n).fill(null)),
            struck: rows.map(() => false),
            sel: null,
            colRight: new Array(n).fill(0),
            unlocked: new Array(n).fill(diff === 3),
            strikes: 0,
            note: null,        // { text, kind } for the inspector
        };

        const prevPos = container.style.position;
        if (root.getComputedStyle && root.getComputedStyle(container).position === 'static') container.style.position = 'relative';

        const rootEl = el('div.vg', { dataset: { difficulty: String(diff), villagers: String(n) } });
        const bg = el('div.vg-bg', { 'aria-hidden': 'true' });
        if (Rift.Assets && Rift.Assets.has('scene/village-square')) {
            bg.style.backgroundImage = 'url("' + Rift.Assets.url('scene/village-square') + '")';
            bg.classList.add('art');
        }
        rootEl.appendChild(bg);

        // ---- rules strip ----
        rootEl.appendChild(el('div.vg-rules', {}, [
            el('span.vg-rule', {}, [el('b', { text: '😇 Honest' }), ' always tell the truth']),
            el('span.vg-rule', {}, [el('b', { text: '😈 Imps' }), ' always lie']),
            el('span.vg-rule.count', {}, [el('b', { text: k === 1 ? 'One imp' : cap(NUM[k]) + ' imps' }), ' hide in the square']),
            el('span.vg-rule.muted', { text: 'neighbours = the villagers either side' }),
        ]));

        // ---- the square ----
        const tokenArt = cls => (Rift.Assets && Rift.Assets.has('ui/accuse-token'))
            ? Rift.Assets.img('ui/accuse-token', { className: cls, alt: '' })
            : el('span.' + cls, { text: '👉' });
        const square = el('div.vg-square');
        const cards = data.villagers.map((v, i) => {
            const pose = POSE_ACCUSING[v.says.t] ? 'accusing' : 'neutral';
            const art = Rift.Assets
                ? Rift.Assets.img(artId(v, pose), { colour: 'reason', label: v.name, className: 'vg-art', alt: 'The ' + v.name })
                : el('div.vg-art');
            const figure = el('button.vg-figure', {
                type: 'button', title: 'Accuse the ' + v.name + ' (click again to take the token back)',
                onclick: () => toggleAccuse(i),
            }, [art, el('span.vg-token', { 'aria-hidden': 'true' }, [tokenArt('vg-token-art')]), el('span.vg-ghost', { 'aria-hidden': 'true', text: '😈' })]);
            const bubble = el('div.vg-bubble', {
                role: 'note', 'aria-label': 'The ' + v.name + ' says',
                onmouseenter: () => mark(i, true), onmouseleave: () => mark(i, false),
            }, [el('span', { text: v.text })]);
            const name = el('button.vg-name', { type: 'button', tabIndex: -1, title: 'Accuse the ' + v.name, onclick: () => toggleAccuse(i), text: v.name });
            const card = el('div.vg-villager', { dataset: { role: v.role } }, [bubble, figure, name]);
            square.appendChild(card);
            return { v, card, art, figure, name, pose };
        });
        rootEl.appendChild(square);

        function setPose(c, pose) {
            if (!Rift.Assets || !c.art.tagName || c.art.tagName !== 'IMG') return;
            c.art.src = Rift.Assets.src(artId(c.v, pose), { colour: 'reason', label: c.v.name });
        }

        // Hovering a bubble rings the villagers it talks about.
        function mark(i, on) {
            const m = mentions(says[i]).filter(g => g !== i);
            cards.forEach((c, j) => c.card.classList.toggle('mentioned', on && m.indexOf(j) !== -1));
            cards[i].card.classList.toggle('speaking', on);
        }

        // ---- the truth table ----
        const tt = el('section.vg-tt', { 'aria-label': 'Truth table' });
        const insp = el('div.vg-insp', { 'aria-live': 'polite' });
        const counter = el('span.vg-tt-count');
        const strikeAll = el('button.btn.small.vg-strike-all', { type: 'button', onclick: strikeAllClashes, text: 'Cross out every row with a ⚡' });
        const thead = el('thead');
        const tbody = el('tbody');
        const headRow = el('tr', {}, [el('th.vg-th-world', { scope: 'col' }, [el('span', { text: k === 1 ? 'World: the imp is…' : 'World: the imps are…' })])]);
        const fillBtns = data.villagers.map((v, c) => {
            const b = el('button.vg-fill', { type: 'button', title: 'Fill in this column for every world', onclick: () => fillColumn(c), text: 'fill ▾' });
            headRow.appendChild(el('th.vg-th-col', { scope: 'col', title: 'The ' + v.name + ': “' + v.text + '”' }, [
                el('span.vg-th-name', { text: v.name }),
                b,
            ]));
            return b;
        });
        headRow.appendChild(el('th.vg-th-poss', { scope: 'col', text: 'Possible?' }));
        thead.appendChild(headRow);

        const rowEls = rows.map((row, r) => {
            const label = el('th.vg-row-label', { scope: 'row' }, [
                el('span.vg-row-num', { text: String(r + 1) }),
                el('span', { text: row.imps.map(short).join(' + ') }),
            ]);
            const cells = data.villagers.map((v, c) => el('button.vg-cell' + (row.imp[c] ? '.imp' : '.honest'), {
                type: 'button',
                title: 'World ' + (r + 1) + ': is the ' + v.name + '’s statement true here?',
                onclick: () => select(r, c),
            }));
            const poss = el('button.vg-poss', { type: 'button', title: 'Cross out this world (needs a ⚡ clash)', onclick: () => strike(r, true), text: '?' });
            const tr = el('tr.vg-row', {
                onmouseenter: () => ghost(r), onmouseleave: () => ghost(-1),
            }, [label].concat(cells.map(cell => el('td', {}, [cell]))).concat([el('td', {}, [poss])]));
            tbody.appendChild(tr);
            return { tr, cells, poss };
        });

        const legend = el('span.vg-legend', {}, [
            el('span.vg-key.honest', { text: '😇 honest here' }), el('span.vg-key.imp', { text: '😈 imp here' }),
            el('span.vg-key', { text: '✓ true · ✗ false' }), el('span.vg-key.clash', { text: '⚡ clash' }),
        ]);
        tt.appendChild(el('div.vg-tt-head', {}, [
            el('h3', { text: 'Truth table' }),
            el('span.vg-tt-sub', { text: 'Every possible world: ' + rows.length + ' ways ' + (k === 1 ? 'one imp' : NUM[k] + ' imps') + ' could hide among ' + NUM[n] + ' villagers.' }),
        ]));
        tt.appendChild(insp);
        tt.appendChild(el('div.vg-tt-scroll', {}, [el('table.vg-table', {}, [thead, tbody])]));
        tt.appendChild(el('div.vg-tt-foot', {}, [counter, legend, strikeAll]));
        rootEl.appendChild(tt);

        // Hovering a row shows that world's imps in the square.
        function ghost(r) {
            cards.forEach((c, i) => c.card.classList.toggle('ghost', r >= 0 && rows[r].imp[i] && !st.done));
        }

        function knownClash(r) {
            return st.filled[r].some((v, c) => v !== null && rows[r].clash[c]);
        }
        function complete(r) {
            return st.filled[r].every(v => v !== null);
        }
        function nextOpen(fromRow, fromCol) {
            // Next unfilled cell in a row that is still possible, scanning forward.
            for (let step = 0; step < rows.length * n; step++) {
                const idx = (fromRow * n + fromCol + 1 + step) % (rows.length * n);
                const r = Math.floor(idx / n), c = idx % n;
                if (!st.struck[r] && !knownClash(r) && st.filled[r][c] === null) return { r, c };
            }
            return null;
        }

        function select(r, c) {
            if (st.struck[r]) { st.note = { text: 'World ' + (r + 1) + ' is already crossed out.', kind: 'info' }; render(); return; }
            st.sel = { r, c };
            st.note = null;
            clearResult();
            sfx('click');
            render();
        }

        function answer(val) {
            if (!st.sel) return;
            const { r, c } = st.sel;
            if (st.filled[r][c] !== null) return;
            const truth = rows[r].cells[c];
            const v = data.villagers[c];
            const why = reason(data, v.says, rows[r].imp, 'world');
            if (val !== truth) {
                sfx('error');
                st.note = { text: 'Not quite. ' + cap(why) + ', so “' + v.text.replace(/[.]$/, '') + '” is ' + (truth ? 'TRUE' : 'FALSE') + ' in this world.', kind: 'bad' };
                const cell = rowEls[r].cells[c];
                cell.classList.remove('shake'); void cell.offsetWidth; cell.classList.add('shake');
                render();
                return;
            }
            st.filled[r][c] = truth;
            st.colRight[c]++;
            const unlockedNow = !st.unlocked[c] && st.colRight[c] >= 2;
            if (st.colRight[c] >= 2) st.unlocked[c] = true;
            sfx('place');
            if (rows[r].clash[c]) {
                st.note = {
                    text: '⚡ Clash! The ' + v.name + ' is ' + (rows[r].imp[c] ? 'an imp' : 'honest') + ' in this world, so their words should be '
                        + (rows[r].imp[c] ? 'false' : 'true') + ', but they are ' + (truth ? 'true' : 'false') + '. This world is impossible: click its “Possible?” box to cross it out.',
                    kind: 'clash',
                };
            } else if (complete(r)) {
                st.note = { text: '✓ Every statement fits world ' + (r + 1) + ': the honest villagers’ words are true and the imps’ words are false.', kind: 'good' };
            } else {
                st.note = { text: 'Right: ' + (truth ? 'true' : 'false') + '. No clash: ' + (rows[r].imp[c] ? 'an imp’s words should be false' : 'an honest villager’s words should be true') + '.'
                    + (unlockedNow ? ' You can now fill the ' + v.name + '’s whole column with “fill ▾”.' : ''), kind: 'good' };
                const nx = nextInRow(r, c);
                if (nx != null) st.sel = { r, c: nx };
            }
            render();
        }

        function nextInRow(r, c) {
            for (let j = 1; j < n; j++) { const cc = (c + j) % n; if (st.filled[r][cc] === null) return cc; }
            return null;
        }

        function fillColumn(c) {
            if (!st.unlocked[c]) {
                st.note = { text: 'First fill in ' + (2 - st.colRight[c] === 1 ? 'one more cell' : 'two cells') + ' of the ' + data.villagers[c].name + '’s column yourself. Then the tool can do the rest.', kind: 'info' };
                sfx('error');
                render();
                return;
            }
            rows.forEach((row, r) => {
                if (st.struck[r] || st.filled[r][c] !== null) return;
                st.filled[r][c] = row.cells[c];
                const cell = rowEls[r].cells[c];
                cell.style.animationDelay = Math.min(r * 18, 600) + 'ms';
                cell.classList.remove('pop'); void cell.offsetWidth; cell.classList.add('pop');
            });
            const clashes = rows.filter((row, r) => !st.struck[r] && row.clash[c]).length;
            sfx('place');
            st.note = {
                text: 'Filled the ' + data.villagers[c].name + '’s column: “' + data.villagers[c].text + '” '
                    + (data.villagers[c].says.t === 'self'
                        ? 'It never clashes: honest or imp, saying “I am honest” fits. Self-praise proves nothing.'
                        : (clashes ? 'It clashes in ' + clashes + ' world' + (clashes === 1 ? '' : 's') + ' (⚡).' : 'No clashes in the worlds that are left.')),
                kind: 'info',
            };
            render();
        }

        function strike(r, manual) {
            if (st.done && manual) return;
            if (st.struck[r]) return;
            if (!knownClash(r)) {
                if (manual) {
                    sfx('error');
                    st.note = complete(r)
                        ? { text: 'World ' + (r + 1) + ' has no clash: every statement fits. It is still possible!', kind: 'good' }
                        : { text: 'No clash showing in world ' + (r + 1) + ' yet. Fill in more of its cells: one ⚡ is enough to cross it out.', kind: 'info' };
                    if (!complete(r)) st.sel = { r, c: st.filled[r].indexOf(null) };
                    render();
                }
                return;
            }
            st.struck[r] = true;
            if (manual) {
                st.strikes++;
                sfx('click');
                const c = st.filled[r].findIndex((v, j) => v !== null && rows[r].clash[j]);
                st.note = { text: 'Crossed out world ' + (r + 1) + ': the ' + short(c) + (rows[r].imp[c] ? ' would be an imp telling the truth.' : ' would be honest but saying something false.'), kind: 'info' };
                const nx = diff < 3 ? nextOpen(r, n - 1) : null;
                st.sel = nx;
                render();
            }
        }

        function strikeAllClashes() {
            let c = 0;
            rows.forEach((row, r) => { if (!st.struck[r] && knownClash(r)) { strike(r, false); c++; } });
            sfx(c ? 'place' : 'error');
            st.note = c
                ? { text: 'Crossed out ' + c + ' world' + (c === 1 ? '' : 's') + ' with a clash.', kind: 'info' }
                : { text: 'No ⚡ clashes showing in the rows that are left. Fill more columns.', kind: 'info' };
            if (st.sel && st.struck[st.sel.r]) st.sel = null;
            render();
        }

        function useWorld(r) {
            if (st.done) return;
            st.accused = rows[r].imps.slice();
            sfx('place');
            clearResult();
            render();
        }

        function renderInspector() {
            insp.innerHTML = '';
            insp.className = 'vg-insp';
            const alive = rows.map((x, r) => r).filter(r => !st.struck[r]);
            if (alive.length === 1 && !st.done) {
                const r = alive[0];
                insp.classList.add('proved');
                insp.appendChild(el('div.vg-insp-text', {}, [
                    el('b', { text: 'Only one world survives! ' }),
                    'Every other world contains a clash, so this one must be the real one: ' + worldName(r) + (k === 1 ? ' is the imp.' : ' are the imps.'),
                ]));
                insp.appendChild(el('div.vg-insp-btns', {}, [el('button.btn.small.gold', { type: 'button', onclick: () => useWorld(r), text: 'Place my tokens on them' })]));
                return;
            }
            if (!st.sel) {
                insp.appendChild(el('div.vg-insp-text', {
                    text: st.note ? st.note.text : diff === 3
                        ? 'Too tangled to guess. Press “fill ▾” on a column to test that statement in every world. Then cross out the worlds with a ⚡ clash (after two by hand, the tool can cross out the rest).'
                        : 'Click a cell. Each cell asks one question: in this world, is this villager’s statement true (✓) or false (✗)?',
                }));
                if (st.note) insp.classList.add(st.note.kind);
                return;
            }
            const { r, c } = st.sel;
            const v = data.villagers[c];
            const isImp = rows[r].imp[c];
            const val = st.filled[r][c];
            insp.appendChild(el('div.vg-insp-world', {}, [
                el('span.vg-row-num', { text: String(r + 1) }),
                el('span', { text: 'In this world ' + worldName(r) + (k === 1 ? ' is the imp.' : ' are the imps.') }),
            ]));
            insp.appendChild(el('div.vg-insp-text', {}, [
                el('span.vg-who' + (isImp ? '.imp' : '.honest'), { text: (isImp ? '😈 ' : '😇 ') + 'The ' + v.name }),
                ' says “' + v.text + '”',
            ]));
            if (val === null && !st.struck[r]) {
                insp.appendChild(el('div.vg-insp-btns', {}, [
                    el('span.vg-q', { text: 'True in this world?' }),
                    el('button.btn.small.vg-ans.t', { type: 'button', onclick: () => answer(true), text: '✓ True' }),
                    el('button.btn.small.vg-ans.f', { type: 'button', onclick: () => answer(false), text: '✗ False' }),
                ]));
            }
            if (st.note) insp.appendChild(el('div.vg-insp-note.' + st.note.kind, { text: st.note.text }));
            else if (val !== null) {
                insp.appendChild(el('div.vg-insp-note.' + (rows[r].clash[c] ? 'clash' : 'info'), {
                    text: (val ? 'True' : 'False') + ' here: ' + reason(data, v.says, rows[r].imp, 'world') + '.' + (rows[r].clash[c] ? ' ⚡ Clash.' : ''),
                }));
            }
        }

        function renderTable() {
            rows.forEach((row, r) => {
                const re = rowEls[r];
                const clash = knownClash(r);
                re.tr.classList.toggle('struck', st.struck[r]);
                re.tr.classList.toggle('has-clash', clash && !st.struck[r]);
                re.tr.classList.toggle('truth', st.done && row.possible);
                re.tr.classList.toggle('survivor', !st.struck[r] && st.struck.filter(x => !x).length === 1);
                re.cells.forEach((cell, c) => {
                    const v = st.filled[r][c];
                    cell.textContent = v === null ? '' : row.clash[c] ? (v ? '✓⚡' : '✗⚡') : (v ? '✓' : '✗');
                    cell.classList.toggle('filled', v !== null);
                    cell.classList.toggle('clash', v !== null && row.clash[c]);
                    cell.classList.toggle('sel', !!st.sel && st.sel.r === r && st.sel.c === c);
                    cell.disabled = st.struck[r];
                });
                const works = !st.struck[r] && !clash && complete(r);
                re.poss.textContent = st.struck[r] ? '✗' : works ? '✓' : clash ? 'cross out' : '?';
                re.poss.classList.toggle('works', works);
                re.poss.classList.toggle('ready', clash && !st.struck[r]);
                re.poss.disabled = st.struck[r];
            });
            fillBtns.forEach((b, c) => {
                b.classList.toggle('locked', !st.unlocked[c]);
                b.textContent = st.unlocked[c] ? 'fill ▾' : '🔒 ' + st.colRight[c] + '/2';
            });
            const alive = st.struck.filter(x => !x).length;
            counter.textContent = 'Worlds still possible: ' + alive + ' of ' + rows.length;
            strikeAll.hidden = st.strikes < 2 || alive === 1;
        }

        // Keep the selected cell in view inside the table's own scroller.
        function revealSel() {
            const alive = st.struck.map((x, r) => (x ? -1 : r)).filter(r => r >= 0);
            const target = alive.length === 1 ? { r: alive[0], c: 0 } : st.sel;
            if (!target) return;
            const tr = rowEls[target.r].tr;
            const box = tr.closest('.vg-tt-scroll');
            if (!box) return;
            const b = box.getBoundingClientRect(), c = tr.getBoundingClientRect();
            const head = thead.getBoundingClientRect().height || 0;
            if (c.top < b.top + head) box.scrollTop -= (b.top + head - c.top) + 4;
            else if (c.bottom > b.bottom) box.scrollTop += (c.bottom - b.bottom) + 4;
        }

        // ---- bottom bar ----
        const ttBtn = el('button.btn.vg-tt-toggle', { type: 'button', onclick: () => { st.ttOpen = !st.ttOpen; if (!st.done) clearResult(); sfx('click'); render(); } });
        const tray = el('div.vg-tray', { title: 'Your accuse tokens: click a villager to place one' });
        const status = el('div.vg-status');
        const accuseBtn = el('button.btn.primary.vg-accuse', { type: 'button', onclick: submit, text: 'Accuse!' });
        const result = el('div.vg-result', { 'aria-live': 'polite' });
        rootEl.appendChild(el('div.vg-bottom', {}, [ttBtn, tray, el('div.vg-action', {}, [status, accuseBtn])]));
        rootEl.appendChild(result);

        function toggleAccuse(i) {
            if (st.done) return;
            const at = st.accused.indexOf(i);
            if (at !== -1) st.accused.splice(at, 1);
            else if (st.accused.length >= k) {
                sfx('error');
                status.textContent = 'You only have ' + NUM[k] + ' token' + (k === 1 ? '' : 's') + '. Take one back first.';
                return;
            } else st.accused.push(i);
            sfx('place');
            clearResult();
            render();
        }

        function clearResult() { result.textContent = ''; result.className = 'vg-result'; }

        function render() {
            rootEl.classList.toggle('tt-open', st.ttOpen);
            ttBtn.textContent = st.ttOpen ? '📜 Hide table' : '📜 Truth table';
            cards.forEach((c, i) => {
                const on = st.accused.indexOf(i) !== -1;
                c.card.classList.toggle('accused', on);
                c.figure.setAttribute('aria-pressed', String(on));
                c.figure.disabled = c.name.disabled = st.done;
                if (!st.done) setPose(c, on ? 'nervous' : c.pose);
            });
            tray.innerHTML = '';
            for (let t = 0; t < k; t++) tray.appendChild(el('span.vg-tray-token' + (t < st.accused.length ? '.used' : ''), {}, [tokenArt('vg-tray-art')]));
            const left = k - st.accused.length;
            if (!st.done) status.textContent = left ? 'Place ' + NUM[left] + ' more token' + (left === 1 ? '' : 's') : 'Ready to accuse';
            else status.textContent = '';
            accuseBtn.disabled = st.done || left !== 0;
            if (st.ttOpen) { renderTable(); renderInspector(); revealSel(); }
        }

        function submit() {
            if (st.done || st.accused.length !== k) return;
            const ans = { imps: st.accused.slice().sort((a, b) => a - b).map(i => data.villagers[i].id) };
            sfx('click');
            const r = api && api.submit ? api.submit(ans) : check(data, ans);
            if (!r) return;
            result.textContent = r.feedback || '';
            if (r.solved) {
                st.done = true;
                st.ttOpen = false;      // show the square, where the imps unmask
                result.className = 'vg-result good';
                rootEl.classList.add('solved');
                cards.forEach((c, i) => {
                    const isImp = st.accused.indexOf(i) !== -1;
                    c.card.classList.add(isImp ? 'unmasked' : 'cleared');
                    setPose(c, isImp ? 'unmasked' : 'neutral');
                });
                ghost(-1);
                sfx('success');
            } else {
                result.className = 'vg-result bad';
                sfx('error');
                st.accused.forEach(i => { const f = cards[i].figure; f.classList.remove('shake'); void f.offsetWidth; f.classList.add('shake'); });
            }
            render();
        }

        function onKey(e) {
            if (!st.ttOpen || !st.sel || st.done || !rootEl.isConnected) return;
            const key = (e.key || '').toLowerCase();
            if (key === 't' || key === '1') { answer(true); e.preventDefault(); }
            else if (key === 'f' || key === '0') { answer(false); e.preventDefault(); }
        }
        doc.addEventListener('keydown', onKey);

        render();
        container.appendChild(rootEl);
        return {
            destroy() {
                doc.removeEventListener('keydown', onKey);
                if (rootEl.parentNode) rootEl.parentNode.removeChild(rootEl);
                container.style.position = prevPos;
            },
        };
    }

    Rift.Puzzles.register({
        id: 'village',
        name: 'The Village',
        colour: 'reason',
        family: 'Deduction',
        blurb: 'Honest villagers always tell the truth; imps always lie. Find the imps hiding in the square.',
        tok: 'A truth table checks every possible world, so its conclusion is proved, not guessed: certainty comes from ruling out every alternative, not from how convincing anyone sounds.',
        generate,
        check,
        hints,
        why,
        solve,
        mount,
        // exposed for tests and tools
        _internal: { evaluate, worlds, solutions, table, statementText, mentions, worthSaying, fallback, ROLES, CONFIG },
    });
})(typeof window !== 'undefined' ? window : globalThis);
