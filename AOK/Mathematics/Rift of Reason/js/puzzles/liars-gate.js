/*
 * Liar's Gate: knights and knaves at a gate with two or three doors.
 *
 * Every guard always tells the truth or always lies, and exactly one door is
 * safe. Each guard says one statement. Statements are a small AST (below),
 * evaluated by a brute-force solver over every truth/lie assignment × safe
 * door. The generator only keeps puzzles with exactly ONE consistent world.
 *
 * AST nodes (guard and door references are indices; the speaker is the guard
 * whose statement it is, so 'I' is rendered when a node names the speaker):
 *   { t:'honest', g }   { t:'liar', g }
 *   { t:'safe', d }     { t:'trap', d }
 *   { t:'and', a, b }   { t:'or', a, b }   { t:'if', a, b }
 *   { t:'same', g, h }  { t:'diff', g, h }          (both honest/liars, or not)
 *   { t:'count', kind:'honest'|'liar', op:'exactly'|'atLeast'|'atMost', n }
 *                                                    ('us' = all the guards)
 *
 * Written from scratch for Rift of Reason (the folk puzzle is Smullyan's).
 */
(function (root) {
    'use strict';

    const Rift = root.Rift;

    const DOOR_NAMES = { 2: ['left', 'right'], 3: ['left', 'middle', 'right'] };
    const NUM = ['no', 'one', 'two', 'three', 'four', 'five'];
    const FALLBACK_GUARDS = [
        { id: 'guard-a', name: 'Guard Amber', colour: 'reason' },
        { id: 'guard-b', name: 'Guard Basalt', colour: 'language' },
        { id: 'guard-c', name: 'Guard Cobalt', colour: 'imagination' },
        { id: 'guard-d', name: 'Guard Dusk', colour: 'emotion' },
        { id: 'guard-e', name: 'Guard Ember', colour: 'perception' },
    ];

    // ---- evaluation ---------------------------------------------------------

    // w = { honest: [bool per guard], door: index of the safe door }
    function evaluate(node, w) {
        switch (node.t) {
            case 'honest': return w.honest[node.g];
            case 'liar': return !w.honest[node.g];
            case 'safe': return w.door === node.d;
            case 'trap': return w.door !== node.d;
            case 'and': return evaluate(node.a, w) && evaluate(node.b, w);
            case 'or': return evaluate(node.a, w) || evaluate(node.b, w);
            case 'if': return !evaluate(node.a, w) || evaluate(node.b, w);
            case 'same': return w.honest[node.g] === w.honest[node.h];
            case 'diff': return w.honest[node.g] !== w.honest[node.h];
            case 'count': {
                let c = 0;
                for (const h of w.honest) if (node.kind === 'honest' ? h : !h) c++;
                if (node.op === 'exactly') return c === node.n;
                if (node.op === 'atLeast') return c >= node.n;
                return c <= node.n;
            }
        }
        throw new Error('Unknown statement node ' + node.t);
    }

    const worldCache = {};
    function allWorlds(n, k) {
        const key = n + ':' + k;
        if (worldCache[key]) return worldCache[key];
        const out = [];
        for (let mask = 0; mask < (1 << n); mask++) {
            const honest = [];
            for (let i = 0; i < n; i++) honest.push(!!(mask & (1 << i)));
            for (let d = 0; d < k; d++) out.push({ honest, door: d });
        }
        return (worldCache[key] = out);
    }

    function consistent(says, w) {
        for (let i = 0; i < says.length; i++) if (evaluate(says[i], w) !== w.honest[i]) return false;
        return true;
    }

    // Every world in which honest guards say true things and liars say false ones.
    function solutions(says, k) {
        return allWorlds(says.length, k).filter(w => consistent(says, w));
    }

    // ---- rendering ------------------------------------------------------------

    function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

    function renderer(names, doors, speaker) {
        const who = g => (g === speaker ? 'I' : names[g]);
        const pair = (g, h) => {
            if (h === speaker) [g, h] = [h, g];
            return g === speaker ? names[h] + ' and I' : names[g] + ' and ' + names[h];
        };
        const door = d => 'the ' + doors[d] + ' door';
        function clause(n) {
            switch (n.t) {
                case 'honest': return n.g === speaker ? 'I am honest' : names[n.g] + ' is honest';
                case 'liar': return n.g === speaker ? 'I am a liar' : names[n.g] + ' is a liar';
                case 'safe': return door(n.d) + ' is safe';
                case 'trap': return door(n.d) + ' is a trap';
                case 'and':
                    if (n.a.t === 'liar' && n.b.t === 'liar') return pair(n.a.g, n.b.g) + ' are both liars';
                    if (n.a.t === 'honest' && n.b.t === 'honest') return pair(n.a.g, n.b.g) + ' are both honest';
                    return clause(n.a) + ' and ' + clause(n.b);
                case 'or': return clause(n.a) + ', or ' + clause(n.b);
                case 'if': return 'if ' + clause(n.a) + ', then ' + clause(n.b);
                case 'same': return pair(n.g, n.h) + ' are both honest, or both liars';
                case 'diff': {
                    const other = n.g === speaker ? n.h : n.h === speaker ? n.g : null;
                    return other != null
                        ? 'exactly one of ' + names[other] + ' and me is honest'
                        : 'exactly one of ' + names[n.g] + ' and ' + names[n.h] + ' is honest';
                }
                case 'count': {
                    const opText = { exactly: 'exactly', atLeast: 'at least', atMost: 'at most' }[n.op];
                    const many = n.n !== 1;
                    const tail = n.kind === 'honest' ? (many ? 'are honest' : 'is honest') : (many ? 'are liars' : 'is a liar');
                    return opText + ' ' + NUM[n.n] + ' of us ' + tail;
                }
            }
            return '?';
        }
        return { clause, sentence: n => cap(clause(n)) + '.', who };
    }

    function statementText(data, i) {
        return renderer(data.guards.map(g => g.name), data.doors, i).sentence(data.guards[i].says);
    }

    // ---- generation -----------------------------------------------------------

    function others(s, n) {
        const out = [];
        for (let i = 0; i < n; i++) if (i !== s) out.push(i);
        return out;
    }

    function roleAtom(rng, s, n) {
        const o = rng.pick(others(s, n));
        return { t: rng.chance(0.5) ? 'honest' : 'liar', g: o };
    }

    function doorAtom(rng, k) {
        const d = rng.int(0, k - 1);
        return { t: rng.chance(k === 3 ? 0.7 : 0.5) ? 'safe' : 'trap', d };
    }

    function twoGuards(rng, s, n) {
        const os = rng.shuffle(others(s, n));
        if (n < 3 || rng.chance(0.6)) return [s, os[0]];
        return [os[0], os[1]];
    }

    const MAKERS = {
        role: (rng, s, n) => roleAtom(rng, s, n),
        door: (rng, s, n, k) => doorAtom(rng, k),
        bothLiars: (rng, s, n) => ({ t: 'and', a: { t: 'liar', g: s }, b: { t: 'liar', g: rng.pick(others(s, n)) } }),
        and: (rng, s, n, k) => ({ t: 'and', a: roleAtom(rng, s, n), b: rng.chance(0.75) ? doorAtom(rng, k) : roleAtom(rng, s, n) }),
        or: (rng, s, n, k) => {
            const r = rng.next();
            if (r < 0.55) return { t: 'or', a: roleAtom(rng, s, n), b: doorAtom(rng, k) };
            if (r < 0.8 || k < 3) return { t: 'or', a: roleAtom(rng, s, n), b: roleAtom(rng, s, n) };
            return { t: 'or', a: { t: 'safe', d: rng.int(0, 2) }, b: { t: 'safe', d: rng.int(0, 2) } };
        },
        same: (rng, s, n) => { const [g, h] = twoGuards(rng, s, n); return { t: 'same', g, h }; },
        diff: (rng, s, n) => { const [g, h] = twoGuards(rng, s, n); return { t: 'diff', g, h }; },
        ifSelf: (rng, s, n, k) => ({ t: 'if', a: { t: 'honest', g: s }, b: doorAtom(rng, k) }),
        ifOther: (rng, s, n, k) => rng.chance(0.65)
            ? { t: 'if', a: roleAtom(rng, s, n), b: doorAtom(rng, k) }
            : { t: 'if', a: doorAtom(rng, k), b: roleAtom(rng, s, n) },
        count: (rng, s, n) => ({
            t: 'count',
            kind: rng.chance(0.5) ? 'honest' : 'liar',
            op: rng.weighted({ exactly: 3, atLeast: 2, atMost: 1 }),
            n: rng.int(1, Math.min(n - 1, 3)),
        }),
    };

    const POOLS = {
        1: { role: 4, door: 3, and: 1.6, bothLiars: 0.25 },
        2: { role: 1.5, door: 1.5, and: 2, or: 2, same: 1.5, diff: 1.5, bothLiars: 0.4 },
        3: { role: 0.7, door: 1, and: 1, or: 1, same: 0.7, diff: 0.7, ifSelf: 0.6, ifOther: 1.6, count: 2 },
    };
    const COMPOUND = { and: 1, or: 1, if: 1, same: 1, diff: 1, count: 1 };
    const SIGNATURE = {
        1: null,
        2: t => t === 'and' || t === 'or' || t === 'same' || t === 'diff',
        3: t => t === 'if' || t === 'count',
    };

    function truthTable(node, n, k) {
        return allWorlds(n, k).map(w => (evaluate(node, w) ? '1' : '0')).join('');
    }

    // A statement is worth saying if it isn't always true / always false and,
    // when compound, isn't secretly just one of its parts.
    function worthSaying(node, n, k) {
        const tt = truthTable(node, n, k);
        if (tt.indexOf('0') === -1 || tt.indexOf('1') === -1) return false;
        if (node.a && node.b) {
            const neg = s => s.replace(/[01]/g, m => (m === '1' ? '0' : '1'));
            const ta = truthTable(node.a, n, k), tb = truthTable(node.b, n, k);
            if ([ta, tb, neg(ta), neg(tb)].indexOf(tt) !== -1) return false;
            if (JSON.stringify(node.a) === JSON.stringify(node.b)) return false;
        }
        if ((node.t === 'same' || node.t === 'diff') && node.g === node.h) return false;
        return true;
    }

    // A statement for guard s whose truth matches s's role in the target world.
    function sampleMatching(rng, s, n, k, difficulty, target) {
        const pool = POOLS[difficulty];
        for (let tries = 0; tries < 60; tries++) {
            const kind = rng.weighted(pool);
            const node = MAKERS[kind](rng, s, n, k);
            if (evaluate(node, target) !== target.honest[s]) continue;
            if (!worthSaying(node, n, k)) continue;
            return node;
        }
        return null;
    }

    function score(says, k, difficulty) {
        let s = solutions(says, k).length;
        const keys = says.map(x => JSON.stringify(x));
        s += 3 * (keys.length - new Set(keys).size);
        const sig = SIGNATURE[difficulty];
        if (sig && !says.some(x => sig(x.t))) s += 3;
        const compounds = says.filter(x => COMPOUND[x.t]).length;
        if (difficulty === 1 && compounds > 1) s += 3 * (compounds - 1);
        const counts = says.filter(x => x.t === 'count').length;
        if (counts > 2) s += 2 * (counts - 2);
        return s;
    }

    function fallbackSays(rng, n, k) {
        // Guard 0: "If I am honest, then door d is safe." forces guard 0 honest
        // and d safe; every later guard talks about the one before, so the
        // chain fixes everyone. Always exactly one solution.
        const says = [{ t: 'if', a: { t: 'honest', g: 0 }, b: { t: 'safe', d: rng.int(0, k - 1) } }];
        for (let i = 1; i < n; i++) says.push({ t: rng.chance(0.5) ? 'honest' : 'liar', g: i - 1 });
        return says;
    }

    function pickGuards(rng, n) {
        const all = (Rift.data && Rift.data.creatures) || {};
        const ids = Object.keys(all).filter(id => all[id].rarity !== 'legendary');
        if (ids.length >= n) {
            return rng.shuffle(ids).slice(0, n).map(id => ({ id, name: all[id].name || id, colour: all[id].colour || 'reason' }));
        }
        return rng.shuffle(FALLBACK_GUARDS).slice(0, n).map(g => Object.assign({}, g));
    }

    function generate(rng, difficulty) {
        const diff = Rift.clamp(Math.round(difficulty || 1), 1, 3);
        const range = { 1: [2, 3], 2: [3, 4], 3: [4, 5] }[diff];
        const n = rng.int(range[0], range[1]);
        const k = diff === 3 ? 3 : 2;
        const guards = pickGuards(rng, n);
        const doors = DOOR_NAMES[k].slice();

        let says = null;
        for (let attempt = 0; attempt < 40 && !says; attempt++) {
            const honest = [];
            for (let i = 0; i < n; i++) honest.push(rng.chance(0.5));
            if (n >= 3 && honest.every(h => h === honest[0])) honest[rng.int(0, n - 1)] = !honest[0];
            const target = { honest, door: rng.int(0, k - 1) };

            let cur = [];
            for (let i = 0; i < n; i++) cur.push(sampleMatching(rng, i, n, k, diff, target));
            if (cur.some(x => !x)) continue;
            let sc = score(cur, k, diff);
            for (let iter = 0; iter < 250 && sc > 1; iter++) {
                const s = rng.int(0, n - 1);
                const cand = sampleMatching(rng, s, n, k, diff, target);
                if (!cand) continue;
                const next = cur.slice();
                next[s] = cand;
                const ns = score(next, k, diff);
                if (ns <= sc) { cur = next; sc = ns; }
            }
            if (sc === 1) says = cur;
        }
        if (!says) says = fallbackSays(rng, n, k);

        const data = {
            v: 1,
            difficulty: diff,
            seed: rng.int(0, 2147483646),
            doors,
            guards: guards.map((g, i) => ({ id: g.id, name: g.name, colour: g.colour, says: says[i] })),
        };
        data.guards.forEach((g, i) => { g.text = statementText(data, i); });
        return data;
    }

    // ---- solving and checking ----------------------------------------------

    function says(data) { return data.guards.map(g => g.says); }

    function solve(data) {
        const sol = solutions(says(data), data.doors.length);
        if (sol.length !== 1) return null;
        const roles = {};
        data.guards.forEach((g, i) => { roles[g.id] = sol[0].honest[i] ? 'truth' : 'lie'; });
        return { roles, door: sol[0].door };
    }

    // Which guards / doors a statement mentions (to explain a contradiction).
    function mentions(node, acc) {
        acc = acc || { guards: [], doors: [], everyone: false };
        if (node.g != null && acc.guards.indexOf(node.g) === -1) acc.guards.push(node.g);
        if (node.h != null && acc.guards.indexOf(node.h) === -1) acc.guards.push(node.h);
        if (node.d != null && acc.doors.indexOf(node.d) === -1) acc.doors.push(node.d);
        if (node.t === 'count') acc.everyone = true;
        if (node.a) mentions(node.a, acc);
        if (node.b) mentions(node.b, acc);
        return acc;
    }

    // The parts of a statement that decide its truth value in world w.
    function deciding(node, w) {
        const va = node.a && evaluate(node.a, w), vb = node.b && evaluate(node.b, w);
        if (node.t === 'and' && !(va && vb)) return [].concat(va ? [] : deciding(node.a, w), vb ? [] : deciding(node.b, w));
        if (node.t === 'or' && (va || vb)) return [].concat(va ? deciding(node.a, w) : [], vb ? deciding(node.b, w) : []);
        if (node.t === 'if' && (!va || vb)) return !va ? deciding(node.a, w) : deciding(node.b, w);
        return [node];
    }

    function describeChoices(data, node, w) {
        const m = { guards: [], doors: [], everyone: false };
        deciding(node, w).forEach(part => mentions(part, m));
        const parts = [];
        if (m.everyone) {
            const c = w.honest.filter(Boolean).length;
            parts.push('you marked ' + NUM[c] + ' guard' + (c === 1 ? '' : 's') + ' honest');
        } else if (m.guards.length) {
            parts.push('you marked ' + m.guards.map(g => data.guards[g].name + (w.honest[g] ? ' honest' : ' a liar')).join(' and '));
        }
        if (m.doors.length) parts.push('you picked the ' + data.doors[w.door] + ' door');
        return parts.join(', and ');
    }

    function check(data, answer) {
        const n = data.guards.length;
        const sol = solve(data);
        const a = answer || {};
        const roles = a.roles || {};
        let right = 0, marked = 0;
        data.guards.forEach(g => {
            if (roles[g.id] === 'truth' || roles[g.id] === 'lie') marked++;
            if (sol && roles[g.id] === sol.roles[g.id]) right++;
        });
        const partial = right / n;
        if (marked < n) {
            return { solved: false, partial, feedback: 'Put a sun or a mask on every guard first (' + (n - marked) + ' still unmarked).' };
        }
        const door = typeof a.door === 'number' ? a.door : -1;
        if (door < 0 || door >= data.doors.length) {
            return { solved: false, partial, feedback: 'Now choose a door.' };
        }
        if (sol && right === n && door === sol.door) {
            return { solved: true, partial: 1, feedback: 'Every statement fits: honest guards say true things, liars say false ones. The ' + data.doors[door] + ' door is safe.' };
        }
        // Name one contradiction in the player's own world.
        const w = { honest: data.guards.map(g => roles[g.id] === 'truth'), door };
        for (let i = 0; i < n; i++) {
            const g = data.guards[i];
            const val = evaluate(g.says, w);
            if (val === w.honest[i]) continue;
            const why = describeChoices(data, g.says, w);
            const quote = '“' + g.text.replace(/[.]$/, '') + '”';
            const fb = w.honest[i]
                ? 'If ' + g.name + ' is honest, then what ' + g.name + ' says must be true — but ' + quote + ' is false in your answer' + (why ? ', because ' + why : '') + '.'
                : 'If ' + g.name + ' is a liar, then what ' + g.name + ' says must be false — but ' + quote + ' is true in your answer' + (why ? ', because ' + why : '') + '.';
            return { solved: false, partial, feedback: fb };
        }
        // Unreachable when the puzzle has exactly one solution.
        return { solved: false, partial, feedback: 'Everything fits your answer, but it is not the gate\'s answer. Check again.' };
    }

    // ---- hints and the "why?" question ---------------------------------------

    function hints(data) {
        const sol = solve(data);
        const n = data.guards.length;
        const names = data.guards.map(g => g.name);
        const first = data.guards.findIndex(g => mentions(g.says).guards.some(x => x !== data.guards.indexOf(g)));
        const start = first >= 0 ? first : 0;
        const out = [];
        out.push('Suppose ' + names[start] + ' tells the truth. Then “' + data.guards[start].text.replace(/[.]$/, '')
            + '” is true. What follows? Keep going until something breaks, or until everything fits. If it breaks, ' + names[start] + ' is a liar.');

        const doorTalker = data.guards.findIndex(g => mentions(g.says).doors.length > 0);
        if (doorTalker >= 0) {
            out.push(names[doorTalker] + ' talks about the doors. First decide whether ' + names[doorTalker]
                + ' is honest or a liar: an honest guard\'s words are true, a liar\'s words are false. Then the words tell you about the doors.');
        } else {
            out.push('Only the guards\' roles decide the door here. Find the one marking of suns and masks where every statement fits.');
        }

        // Last hint: the role of the guard the others talk about most.
        const refs = new Array(n).fill(0);
        data.guards.forEach((g, i) => mentions(g.says).guards.forEach(x => { if (x !== i) refs[x]++; }));
        let best = 0;
        refs.forEach((c, i) => { if (c > refs[best]) best = i; });
        if (sol) {
            const role = sol.roles[data.guards[best].id];
            out.push(names[best] + (role === 'truth' ? ' is honest (a sun ☀️).' : ' is a liar (a mask 🎭).')
                + ' Start from there and test each other guard\'s words.');
        }
        return out;
    }

    function why(data) {
        const sol = solve(data);
        if (!sol) return null;
        const doorName = data.doors[sol.door];
        const first = data.guards[0].name;
        const correct = 'Only one way of marking the guards makes every statement fit (honest guards\' words true, liars\' words false), and in that one world the ' + doorName + ' door is safe.';
        const liars = data.guards.filter(g => sol.roles[g.id] === 'lie' && mentions(g.says).doors.length);
        const wrong = [
            'Because the reasoning is valid, and valid reasoning always gives a true conclusion, even if the guards\' words are unreliable.',
            'Because more of the guards\' statements point to the ' + doorName + ' door, and the majority is usually right.',
            liars.length
                ? 'Because ' + liars[0].name + ' mentioned the doors, and no guard would lie about something so important.'
                : 'Because ' + first + ' spoke first and sounded sure, and confident testimony is reliable testimony.',
        ];
        const rng = Rift.makeRng('why:' + data.seed);
        const options = rng.shuffle([correct].concat(wrong));
        const roles = data.guards.map(g => g.name + (sol.roles[g.id] === 'truth' ? ' honest' : ' a liar')).join(', ');
        return {
            question: 'Why is the ' + doorName + ' door the safe one?',
            options,
            correct: options.indexOf(correct),
            explain: 'The deduction is certain only because we accept the premise that every guard always lies or always tells the truth. Test every case: only ' + roles
                + ' makes all ' + NUM[data.guards.length] + ' statements fit, and then the ' + doorName + ' door is safe. Valid reasoning from shaky premises proves nothing.',
        };
    }

    // ---- DOM ------------------------------------------------------------------

    const TOKENS = {
        truth: { icon: '☀️', label: 'Truth', long: 'truth-teller' },
        lie: { icon: '🎭', label: 'Lie', long: 'liar' },
    };

    function mount(container, data, api) {
        const el = (api && api.el) || Rift.el;
        const sfx = name => { try { if (api && api.sfx) api.sfx(name); } catch (e) { /* ignore */ } };
        const roles = {};
        let door = -1;
        let armed = null;   // token picked up from the tray by clicking
        let done = false;

        const rootEl = el('div.lg', { dataset: { doors: String(data.doors.length), guards: String(data.guards.length) } });

        // Rules strip
        rootEl.appendChild(el('div.lg-rules', {}, [
            el('span.lg-rule', {}, [el('b', { text: '☀️ Truth' }), ' everything they say is true']),
            el('span.lg-rule', {}, [el('b', { text: '🎭 Lie' }), ' everything they say is false']),
            el('span.lg-rule', {}, [el('b', { text: '🚪 One' }), ' door is safe']),
            el('span.lg-rule.muted', { text: '“or” = at least one is true · “us” = all the guards here' }),
        ]));

        // Guards
        const guardRow = el('div.lg-guards');
        const cards = data.guards.map((g, i) => {
            const art = Rift.Assets
                ? Rift.Assets.img('creature/' + g.id + '/idle', { colour: g.colour, label: g.name, className: 'lg-art', alt: g.name })
                : el('div.lg-art');
            const badge = el('div.lg-badge', { 'aria-hidden': 'true' });
            const btnTruth = el('button.lg-mark.truth', { type: 'button', 'aria-pressed': 'false', title: 'Mark ' + g.name + ' as a truth-teller', onclick: () => setRole(g.id, 'truth', true) }, [el('span', { text: TOKENS.truth.icon }), ' Truth']);
            const btnLie = el('button.lg-mark.lie', { type: 'button', 'aria-pressed': 'false', title: 'Mark ' + g.name + ' as a liar', onclick: () => setRole(g.id, 'lie', true) }, [el('span', { text: TOKENS.lie.icon }), ' Lie']);
            const figure = el('div.lg-figure', {
                onclick: () => { if (armed) setRole(g.id, armed, false); },
            }, [art, badge]);
            const card = el('div.lg-guard', { dataset: { id: g.id, colour: g.colour } }, [
                el('div.lg-bubble', { role: 'note', 'aria-label': g.name + ' says' }, [el('span', { text: g.text })]),
                figure,
                el('div.lg-name', { text: g.name }),
                el('div.lg-marks', {}, [btnTruth, btnLie]),
            ]);
            card.style.setProperty('--gcol', (Rift.COLOURS[g.colour] || {}).hex || '#3D7BFF');
            card.addEventListener('dragover', e => { if (!done) { e.preventDefault(); card.classList.add('drop'); } });
            card.addEventListener('dragleave', () => card.classList.remove('drop'));
            card.addEventListener('drop', e => {
                e.preventDefault();
                card.classList.remove('drop');
                const t = e.dataTransfer && e.dataTransfer.getData('text/plain');
                if (t === 'truth' || t === 'lie') setRole(g.id, t, false);
            });
            guardRow.appendChild(card);
            return { g, card, badge, btnTruth, btnLie };
        });
        rootEl.appendChild(guardRow);

        // Bottom: token tray, doors, action
        const tray = el('div.lg-tray', {}, [el('div.lg-tray-label', { text: 'Drag a token onto a guard' })]);
        const trayTokens = {};
        ['truth', 'lie'].forEach(kind => {
            const tok = el('div.lg-token.' + kind, {
                draggable: true, title: 'Drag onto a guard, or click then click a guard',
                onclick: () => { if (done) return; armed = armed === kind ? null : kind; sfx('click'); refresh(); },
            }, [el('span.lg-token-icon', { text: TOKENS[kind].icon }), el('span', { text: TOKENS[kind].label })]);
            tok.addEventListener('dragstart', e => {
                if (done) { e.preventDefault(); return; }
                e.dataTransfer.setData('text/plain', kind);
                e.dataTransfer.effectAllowed = 'copy';
            });
            trayTokens[kind] = tok;
            tray.appendChild(tok);
        });

        const doorRow = el('div.lg-doors');
        const doorEls = data.doors.map((name, d) => {
            const b = el('button.lg-door', {
                type: 'button', 'aria-pressed': 'false', title: 'Choose the ' + name + ' door',
                onclick: () => { if (done) return; door = door === d ? -1 : d; sfx('click'); clearResult(); refresh(); },
            }, [
                el('span.lg-door-frame', {}, [el('span.lg-door-light'), el('span.lg-door-leaf', {}, [el('span.lg-door-knob')])]),
                el('span.lg-door-label', { text: cap(name) }),
            ]);
            doorRow.appendChild(b);
            return b;
        });

        const status = el('div.lg-status');
        const openBtn = el('button.btn.primary.lg-open', { type: 'button', onclick: submit, text: 'Open the gate' });
        const result = el('div.lg-result', { 'aria-live': 'polite' });
        const action = el('div.lg-action', {}, [status, openBtn]);
        rootEl.appendChild(el('div.lg-bottom', {}, [tray, doorRow, action]));
        rootEl.appendChild(result);

        function setRole(id, kind, fromButton) {
            if (done) return;
            if (fromButton && roles[id] === kind) delete roles[id];
            else roles[id] = kind;
            armed = fromButton ? armed : null;
            sfx('place');
            clearResult();
            refresh();
        }

        function clearResult() {
            result.textContent = '';
            result.className = 'lg-result';
        }

        function refresh() {
            cards.forEach(c => {
                const r = roles[c.g.id];
                c.card.dataset.role = r || '';
                c.badge.textContent = r ? TOKENS[r].icon : '';
                c.btnTruth.setAttribute('aria-pressed', String(r === 'truth'));
                c.btnLie.setAttribute('aria-pressed', String(r === 'lie'));
                c.btnTruth.disabled = c.btnLie.disabled = done;
            });
            rootEl.classList.toggle('armed', !!armed);
            Object.keys(trayTokens).forEach(k => trayTokens[k].classList.toggle('armed', armed === k));
            doorEls.forEach((b, d) => { b.setAttribute('aria-pressed', String(door === d)); b.disabled = done; });
            const left = data.guards.filter(g => !roles[g.id]).length;
            status.textContent = done ? '' : left ? 'Mark every guard (' + left + ' left)' : door < 0 ? 'Now choose a door' : 'Ready: the ' + data.doors[door] + ' door';
            openBtn.disabled = done || left > 0 || door < 0;
        }

        function submit() {
            if (done || door < 0) return;
            const answer = { roles: Object.assign({}, roles), door };
            sfx('click');
            const r = api && api.submit ? api.submit(answer) : check(data, answer);
            if (!r) return;
            result.textContent = r.feedback || '';
            if (r.solved) {
                done = true;
                result.className = 'lg-result good';
                doorEls[door].classList.add('open');
                rootEl.classList.add('solved');
                sfx('success');
            } else {
                result.className = 'lg-result bad';
                sfx('error');
                const dEl = doorEls[door];
                dEl.classList.remove('shake');
                void dEl.offsetWidth;
                dEl.classList.add('shake');
            }
            refresh();
        }

        refresh();
        container.appendChild(rootEl);
        return {
            destroy() { if (rootEl.parentNode) rootEl.parentNode.removeChild(rootEl); },
        };
    }

    Rift.Puzzles.register({
        id: 'liars-gate',
        rules: [
            "Honest guards always tell the truth; liars always lie.",
            "Read the rules above the guards. Mark each guard Truth or Lie.",
            "Test your marks against every statement, including statements about other guards.",
            "Choose the safe door, then Open the gate. All marks and the door must fit.",
            "How to play is free. The Hint button shows its heart cost. Think first, then check your answer."
        ],
        tutorial: [
            {
                "text": "We need a safe route. These are the rules of this world, not promises about real people.",
                "highlight": ".lg-rules"
            },
            {
                "text": "Click Truth or Lie under each guard. Your marks are a guess you can change.",
                "highlight": ".lg-marks"
            },
            {
                "text": "Example: A says \"B is a liar\". Suppose A is honest: B must be a liar. Suppose A lies: B must be honest.",
                "highlight": ".lg-guards"
            },
            {
                "text": "Now check the other statements. A possible answer must make every honest statement true and every lie false.",
                "highlight": ".lg-doors"
            },
            {
                "text": "Choose a door and Open the gate when all your marks fit. How to play is free. The Hint button shows its heart cost. Think first, then check your answer.",
                "highlight": ".lg-bottom"
            }
        ],
        name: "Liar's Gate",
        colour: 'reason',
        family: 'Deduction',
        blurb: 'Each guard always tells the truth or always lies. Mark them all, then open the one safe door.',
        tok: 'Deduction from testimony can give certainty, but only as much as the premises deserve: here everything rests on trusting that each guard always lies or always tells the truth.',
        generate,
        check,
        hints,
        why,
        solve,
        mount,
        // exposed for tests and tools
        _internal: { evaluate, solutions, statementText, fallbackSays },
    });
})(typeof window !== 'undefined' ? window : globalThis);
