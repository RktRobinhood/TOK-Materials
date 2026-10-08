/*
 * The Tower: keep your cover story straight.
 *
 * You are disguised in Boolesbury and the Constable questions you. Your cover
 * story is the BASE of a tower (the axioms). Every answer is a claim that is
 * stacked on the blocks it rests on:
 *   cemented  proven from the cover story by the village facts (a theorem)
 *   loose     fits everything so far, but nothing proves it (a conjecture)
 *   cracked   a base claim the Constable has caught you contradicting once
 * An answer that contradicts the tower is caught: it is not placed, and the
 * blocks it clashes with are pulled together with everything resting on
 * them (a cracked base block stays, but loses everything above it). Hit a
 * cracked base block again, or let the rubble reach the collapse threshold,
 * and the round is lost.
 *
 * Logic model (all pure, no DOM):
 *   atoms      true/false facts about you ("I arrived on Tuesday", "I own a ladder").
 *              Day, trade and lodging atoms come in exactly-one groups.
 *   rules      clauses (OR of literals). 'common' rules are the exactly-one
 *              groups; 'fact' rules are village facts written as "if … then …".
 *   claims     conjunctions of literals { a: atomIndex, v: bool }.
 *   worlds     every assignment of the atoms that satisfies every rule, found by
 *              brute force (the exactly-one groups are enumerated directly,
 *              then every clause is checked on every candidate).
 *   consistent a set of claims is consistent iff some world makes them all true.
 *   proven     a claim is proven iff every alternative answer is impossible.
 * Unit propagation over the same clauses is used only to EXPLAIN (show the
 * derivation chain); every decision is made by brute force.
 *
 * "Rests on": a placed block rests on a minimal set of standing blocks that
 * rule out the same alternatives as the whole tower does (for a cemented block,
 * only base or cemented blocks may hold it up). Collapse pulls the descendants.
 *
 * Written from scratch for Rift of Reason.
 */
(function (root) {
    'use strict';

    const Rift = root.Rift;

    // ---- content catalog ------------------------------------------------------

    const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const JOBS = [
        { id: 'baker', text: "a baker's apprentice", short: "Baker's apprentice" },
        { id: 'sweep', text: 'a chimney sweep', short: 'Chimney sweep' },
        { id: 'clock', text: 'a travelling clock-mender', short: 'Clock-mender' },
        { id: 'post', text: 'a postal runner', short: 'Postal runner' },
        { id: 'lamp', text: 'a lamplighter', short: 'Lamplighter' },
        { id: 'garden', text: "a gardener's helper", short: "Gardener's helper" },
    ];
    const LODGES = [
        { id: 'inn', text: 'the Crooked Kettle inn', short: 'the Crooked Kettle' },
        { id: 'loft', text: 'the bakery loft', short: 'the bakery loft' },
        { id: 'attic', text: 'the post office attic', short: 'the post office attic' },
        { id: 'shed', text: "the lamplighters' shed", short: 'the lamp shed' },
        { id: 'school', text: 'the schoolhouse', short: 'the schoolhouse' },
    ];
    const BOOLS = [
        { id: 'tower', yes: 'I have been inside the clock tower', no: 'I have never been inside the clock tower', ys: 'Been in the tower', ns: 'Never in the tower', q: ['Have you ever been inside our clock tower?', 'Ever climbed up into the clock tower, have you?'] },
        { id: 'parade', yes: "I saw the Mayor's parade", no: "I missed the Mayor's parade", ys: 'Saw the parade', ns: 'Missed the parade', q: ["Did you see the Mayor's parade?", 'Lovely parade this week. Did you see it?'] },
        { id: 'thirteen', yes: 'I heard the clock strike thirteen', no: 'I did not hear the clock strike thirteen', ys: 'Heard it strike 13', ns: 'Did not hear 13', q: ['The clock struck thirteen this week. Did you hear it?'] },
        { id: 'watch', yes: 'I carry a pocket watch', no: 'I do not carry a pocket watch', ys: 'Pocket watch', ns: 'No pocket watch', q: ['Do you carry a pocket watch?', 'Got the time? Do you carry a pocket watch?'] },
        { id: 'pie', yes: 'I have eaten the famous goose pie', no: 'I have never eaten the goose pie', ys: 'Ate goose pie', ns: 'Never ate goose pie', q: ['Have you tasted our famous goose pie?'] },
        { id: 'postmistress', yes: 'I know the Postmistress', no: 'I do not know the Postmistress', ys: 'Knows the Postmistress', ns: 'Does not know the Postmistress', q: ['Do you know our Postmistress?'] },
        { id: 'mayor', yes: 'I have met the Mayor', no: 'I have never met the Mayor', ys: 'Met the Mayor', ns: 'Never met the Mayor', q: ['Have you met our Mayor?'] },
        { id: 'chimney', yes: 'I have climbed up a chimney', no: 'I have never climbed a chimney', ys: 'Climbed a chimney', ns: 'Never in a chimney', q: ['Have you ever climbed up a chimney?'] },
        { id: 'ladder', yes: 'I own a ladder', no: 'I do not own a ladder', ys: 'Owns a ladder', ns: 'No ladder', q: ['Do you own a ladder?'] },
        { id: 'dawn', yes: 'I get up before dawn', no: 'I do not get up before dawn', ys: 'Up before dawn', ns: 'Not up before dawn', q: ['Do you get up before dawn?', 'Early riser, are you? Up before dawn?'] },
    ];

    const GROUP_INFO = {
        day: { q: ['When did you arrive in Boolesbury?', 'Which day did you come to town?'], rule: list => 'Everyone arrived on exactly one of these days: ' + list + '.' },
        job: { q: ['What is your trade, stranger?', 'And what work do you do?'], rule: list => 'Everyone has exactly one of these trades: ' + list + '.' },
        lodge: { q: ['Where are you staying in Boolesbury?', 'And where do you sleep at night?'], rule: list => 'Everyone stays in exactly one of these places: ' + list + '.' },
    };

    // Village-fact templates. Each returns { id, text, imps: [{ ifs: [[atom, v]…], then: [atom, v] }] }
    // or null when it needs an atom this puzzle doesn't have.
    const imp = (ifs, then) => ({ ifs, then });
    const after = (c, i) => c.days.slice(i + 1);
    const TEMPLATES = [
        c => after(c, c.ev.parade).length && ({ id: 'parade-missed', text: "The Mayor's parade was on " + c.days[c.ev.parade] + '. Anyone who arrived after ' + c.days[c.ev.parade] + ' missed it.', imps: after(c, c.ev.parade).map(d => imp([['day:' + d, true]], ['parade', false])) }),
        c => ({ id: 'parade-band', text: 'Everyone who arrived on ' + c.days[c.ev.parade] + ' or earlier has seen the parade.', imps: c.days.slice(0, c.ev.parade + 1).map(d => imp([['day:' + d, true]], ['parade', true])) }),
        c => after(c, c.ev.thirteen).length && ({ id: 'thirteen-late', text: 'On ' + c.days[c.ev.thirteen] + ' night the clock struck thirteen. Anyone who arrived after ' + c.days[c.ev.thirteen] + ' was too late to hear it.', imps: after(c, c.ev.thirteen).map(d => imp([['day:' + d, true]], ['thirteen', false])) }),
        c => ({ id: 'thirteen-tower', text: 'The thirteenth chime could only be heard from inside the clock tower.', imps: [imp([['thirteen', true]], ['tower', true])] }),
        c => after(c, c.ev.pie).length && ({ id: 'pie-gone', text: 'The last goose pie was eaten on ' + c.days[c.ev.pie] + '. Nobody who arrived after ' + c.days[c.ev.pie] + ' has tasted it.', imps: after(c, c.ev.pie).map(d => imp([['day:' + d, true]], ['pie', false])) }),
        c => c.lodge.inn && ({ id: 'inn-full', text: 'The Crooked Kettle has been full since ' + c.days[c.ev.inn] + '. Nobody who arrived on ' + c.days[c.ev.inn] + ' or later got a room there.', imps: c.days.slice(c.ev.inn).map(d => imp([['day:' + d, true]], ['lodge:inn', false])) }),

        c => c.job.clock && ({ id: 'clock-tower', text: 'The only clock in Boolesbury is in the tower, so every clock-mender has been inside it.', imps: [imp([['job:clock', true]], ['tower', true])] }),
        c => c.job.clock && ({ id: 'clock-watch', text: 'Clock-menders always carry a pocket watch.', imps: [imp([['job:clock', true]], ['watch', true])] }),
        c => c.job.sweep && ({ id: 'sweep-tower', text: 'No chimney sweep has ever been inside the clock tower.', imps: [imp([['job:sweep', true]], ['tower', false])] }),
        c => c.job.sweep && ({ id: 'sweep-chimney', text: 'Every chimney sweep has climbed up a chimney.', imps: [imp([['job:sweep', true]], ['chimney', true])] }),
        c => c.job.baker && ({ id: 'baker-dawn', text: "Bakers' apprentices start work before dawn.", imps: [imp([['job:baker', true]], ['dawn', true])] }),
        c => c.job.baker && ({ id: 'baker-pie', text: "Every baker's apprentice has eaten the goose pie: it is the first thing they learn to bake.", imps: [imp([['job:baker', true]], ['pie', true])] }),
        c => c.job.post && ({ id: 'post-postmistress', text: 'Postal runners report to the Postmistress every morning.', imps: [imp([['job:post', true]], ['postmistress', true])] }),
        c => c.job.post && ({ id: 'post-dawn', text: 'The first post leaves before dawn, so every postal runner is up before dawn.', imps: [imp([['job:post', true]], ['dawn', true])] }),
        c => c.job.lamp && ({ id: 'lamp-ladder', text: 'Every lamplighter owns a ladder.', imps: [imp([['job:lamp', true]], ['ladder', true])] }),
        c => c.job.lamp && ({ id: 'lamp-dawn', text: 'Lamplighters work all night and sleep until after sunrise.', imps: [imp([['job:lamp', true]], ['dawn', false])] }),
        c => c.job.garden && ({ id: 'garden-dawn', text: "Gardeners' helpers water the roses before dawn.", imps: [imp([['job:garden', true]], ['dawn', true])] }),
        c => c.job.garden && ({ id: 'garden-ladder', text: "Every gardener's helper owns a ladder for picking apples.", imps: [imp([['job:garden', true]], ['ladder', true])] }),

        c => c.lodge.loft && c.job.baker && ({ id: 'loft-baker', text: "Everyone staying in the bakery loft is a baker's apprentice.", imps: [imp([['lodge:loft', true]], ['job:baker', true])] }),
        c => c.lodge.attic && ({ id: 'attic-postmistress', text: 'Everyone staying in the post office attic knows the Postmistress.', imps: [imp([['lodge:attic', true]], ['postmistress', true])] }),
        c => c.lodge.inn && ({ id: 'inn-pie', text: 'Every guest at the Crooked Kettle has eaten goose pie.', imps: [imp([['lodge:inn', true]], ['pie', true])] }),
        c => c.lodge.inn && ({ id: 'inn-ladder', text: 'The Crooked Kettle bans ladders, so none of its guests owns one.', imps: [imp([['lodge:inn', true]], ['ladder', false])] }),
        c => c.lodge.shed && c.job.lamp && ({ id: 'shed-lamp', text: "Everyone staying in the lamplighters' shed is a lamplighter.", imps: [imp([['lodge:shed', true]], ['job:lamp', true])] }),
        c => c.lodge.school && ({ id: 'school-dawn', text: 'Everyone staying in the schoolhouse gets up before dawn.', imps: [imp([['lodge:school', true]], ['dawn', true])] }),

        c => ({ id: 'tower-ladder', text: 'The clock tower has no stairs: you need your own ladder to get in.', imps: [imp([['tower', true]], ['ladder', true])] }),
        c => ({ id: 'mayor-parade', text: 'The Mayor never steps off his parade float, so anyone who has met him saw the parade.', imps: [imp([['mayor', true]], ['parade', true])] }),
        c => ({ id: 'postmistress-pie', text: 'Everyone who knows the Postmistress has never eaten goose pie.', imps: [imp([['postmistress', true]], ['pie', false])] }),
        c => ({ id: 'chimney-watch', text: 'Soot ruins pocket watches: nobody who has climbed a chimney still carries one.', imps: [imp([['chimney', true]], ['watch', false])] }),
        c => ({ id: 'tower-watch', text: 'Everyone who has been inside the clock tower now carries a pocket watch.', imps: [imp([['tower', true]], ['watch', true])] }),
        c => ({ id: 'watch-mayor', text: 'Everyone who carries a pocket watch has met the Mayor.', imps: [imp([['watch', true]], ['mayor', true])] }),
    ];

    const CFG = {
        1: { days: 3, bools: 6, facts: 6, questions: 5, trapDist: 2, threshold: 7 },
        2: { days: 3, bools: 7, facts: 8, questions: 6, trapDist: 3, threshold: 6 },
        3: { days: 4, bools: 7, facts: 10, questions: 7, trapDist: 4, threshold: 5 },
    };

    const QUESTIONER = { id: 'villager-constable', name: 'Constable Clobber' };

    // ---- the logic model --------------------------------------------------------

    const lit = (a, v) => ({ a, v: !!v });
    const litKey = l => l.a + (l.v ? '+' : '-');

    function litText(data, l) { const at = data.atoms[l.a]; return l.v ? at.yes : at.no; }
    function litShort(data, l) { const at = data.atoms[l.a]; return l.v ? at.ys : at.ns; }

    // Clause masks and every world, found once per puzzle object.
    const cache = typeof WeakMap === 'function' ? new WeakMap() : null;
    function compile(data) {
        if (cache && cache.has(data)) return cache.get(data);
        const n = data.atoms.length;
        const clauses = [];
        data.rules.forEach((r, ri) => r.clauses.forEach(c => {
            let pos = 0, neg = 0;
            c.forEach(l => { if (l.v) pos |= 1 << l.a; else neg |= 1 << l.a; });
            clauses.push({ pos, neg, rule: ri });
        }));
        const grouped = {};
        data.groups.forEach(g => g.atoms.forEach(a => { grouped[a] = true; }));
        const free = [];
        for (let a = 0; a < n; a++) if (!grouped[a]) free.push(a);
        // Every way to pick one atom per group, times every assignment of the rest.
        let partial = [0];
        data.groups.forEach(g => {
            const next = [];
            partial.forEach(w => g.atoms.forEach(a => next.push(w | (1 << a))));
            partial = next;
        });
        const worlds = [];
        const full = 1 << free.length;
        for (const base of partial) {
            for (let m = 0; m < full; m++) {
                let w = base;
                for (let i = 0; i < free.length; i++) if (m & (1 << i)) w |= 1 << free[i];
                let ok = true;
                for (let i = 0; i < clauses.length; i++) {
                    const c = clauses[i];
                    if (!((w & c.pos) || (~w & c.neg))) { ok = false; break; }
                }
                if (ok) worlds.push(w);
            }
        }
        const cm = { n, clauses, worlds };
        if (cache) cache.set(data, cm);
        return cm;
    }

    // Can all these literals be true at once in some world?
    function sat(cm, lits) {
        let mask = 0, val = 0;
        for (const l of lits) {
            const bit = 1 << l.a;
            if (mask & bit) { if (((val & bit) !== 0) !== l.v) return false; continue; }
            mask |= bit;
            if (l.v) val |= bit;
        }
        const ws = cm.worlds;
        for (let i = 0; i < ws.length; i++) if ((ws[i] & mask) === val) return true;
        return false;
    }

    function groupOf(data, a) { return data.groups.find(g => g.atoms.indexOf(a) !== -1) || null; }

    // The other answers a literal competes with: other members of its group, or its negation.
    function alternatives(data, lits) {
        const out = [];
        lits.forEach(l => {
            const g = groupOf(data, l.a);
            if (g && l.v) g.atoms.forEach(o => { if (o !== l.a) out.push(lit(o, true)); });
            else out.push(lit(l.a, !l.v));
        });
        return out;
    }

    function blockLits(blocks) { return [].concat.apply([], blocks.map(b => b.lits)); }

    function ruledOut(cm, blocks, alts) {
        const ls = blockLits(blocks);
        return alts.map(alt => !sat(cm, ls.concat([alt])));
    }
    const sameFlags = (x, y) => x.every((f, i) => f === y[i]);

    // Unit propagation, used only to explain. starts: [{ a, v, label }]
    function propagate(data, starts) {
        const n = data.atoms.length;
        const known = new Array(n).fill(null);
        for (const s of starts) {
            if (known[s.a] && known[s.a].v !== s.v) return { known, conflict: { kind: 'given', a: s.a, label: s.label, round: 0 } };
            known[s.a] = { v: s.v, depth: 0, rule: -1, from: [], label: s.label };
        }
        for (let round = 1; round <= 60; round++) {
            const adds = [];
            for (let ri = 0; ri < data.rules.length; ri++) {
                for (const clause of data.rules[ri].clauses) {
                    let unknown = null, nUnknown = 0, satisfied = false;
                    const from = [];
                    for (const l of clause) {
                        const k = known[l.a];
                        if (!k) { nUnknown++; unknown = l; } else if (k.v === l.v) { satisfied = true; break; } else from.push(l.a);
                    }
                    if (satisfied) continue;
                    if (nUnknown === 0) return { known, conflict: { kind: 'clause', rule: ri, from, round } };
                    if (nUnknown === 1) adds.push({ a: unknown.a, v: unknown.v, rule: ri, from });
                }
            }
            if (!adds.length) break;
            for (const add of adds) {
                const k = known[add.a];
                if (k) {
                    if (k.v !== add.v) return { known, conflict: { kind: 'clash', a: add.a, rule: add.rule, from: add.from, v: add.v, round } };
                    continue;
                }
                known[add.a] = { v: add.v, depth: round, rule: add.rule, from: add.from };
            }
        }
        return { known, conflict: null };
    }

    function ruleLine(data, ri) {
        const r = data.rules[ri];
        return (r.kind === 'common' ? 'Common sense: ' : 'Village fact: ') + r.text;
    }

    function chainLines(data, known, a, out, seen) {
        if (seen[a]) return;
        seen[a] = true;
        const k = known[a];
        if (!k) return;
        const text = litText(data, lit(a, k.v));
        if (k.rule < 0) { out.push((k.label || 'You said') + ': “' + text + '.”'); return; }
        k.from.forEach(f => chainLines(data, known, f, out, seen));
        out.push(ruleLine(data, k.rule) + ' So: ' + text + '.');
    }

    function starts(blocks, label) {
        return [].concat.apply([], blocks.map(b => b.lits.map(l => ({ a: l.a, v: l.v, label: label || (b.kind === 'base' ? 'Your cover story' : 'You said') }))));
    }

    // How a set of standing blocks proves each literal (for cemented blocks).
    function proofLines(data, baseBlocks, lits) {
        const p = propagate(data, starts(baseBlocks));
        const out = [], seen = {};
        let ok = true;
        lits.forEach(l => {
            const k = p.known[l.a];
            if (k && k.v === l.v) chainLines(data, p.known, l.a, out, seen);
            else ok = false;
        });
        if (!ok) out.push('Check every case: in every world where your cover story is true, so is this.');
        return out;
    }

    // Why an answer clashes with these blocks.
    function conflictLines(data, blocks, answer) {
        const p = propagate(data, starts(blocks).concat(answer.lits.map(l => ({ a: l.a, v: l.v, label: 'You now say' }))));
        const out = [], seen = {};
        const c = p.conflict;
        if (!c) {
            blocks.forEach(b => out.push((b.kind === 'base' ? 'Your cover story' : 'You said') + ': “' + b.text + '.”'));
            out.push('You now say: “' + answer.text + '.”');
            out.push('Try every case: there is no way for all of these to be true together.');
            return out;
        }
        if (c.kind === 'given') {
            chainLines(data, p.known, c.a, out, seen);
            out.push('You now say: “' + litText(data, lit(c.a, !p.known[c.a].v)) + '.” Both cannot be true.');
            return out;
        }
        if (c.kind === 'clash') {
            chainLines(data, p.known, c.a, out, seen);
            c.from.forEach(f => chainLines(data, p.known, f, out, seen));
            out.push(ruleLine(data, c.rule) + ' So: ' + litText(data, lit(c.a, c.v)) + '. Both cannot be true.');
            return out;
        }
        c.from.forEach(f => chainLines(data, p.known, f, out, seen));
        out.push('But that breaks this ' + (data.rules[c.rule].kind === 'common' ? 'common-sense rule' : 'village fact') + ': ' + data.rules[c.rule].text);
        return out;
    }

    const STEP_LINE = /^(Village fact|Common sense|But that breaks)/;
    function countSteps(lines) { return lines.filter(l => STEP_LINE.test(l)).length; }

    // How many reasoning steps (village facts used) until this answer clashes with
    // these literals; 0 = no clash. Clashes only found by trying every case count as 2.
    function trapDistance(data, cm, lits, answer) {
        if (sat(cm, lits.concat(answer))) return 0;
        const blocks = [{ kind: 'base', lits, text: '' }];
        const p = propagate(data, starts(blocks));
        if (!p.conflict && !propagate(data, starts(blocks).concat(answer.map(l => ({ a: l.a, v: l.v })))).conflict) return 2;
        return Math.max(1, countSteps(conflictLines(data, blocks, { lits: answer, text: '' })));
    }

    // ---- the tower engine (shared by check() and the UI) -----------------------

    function newState(data) {
        return {
            blocks: data.base.map(b => ({
                id: b.id, kind: 'base', lits: b.lits, text: b.text, short: b.short,
                status: 'base', cracked: false, parents: [], level: 0, q: -1, standing: true, shaky: false, proof: null,
            })),
            qi: 0, rubble: 0, caught: 0, placed: 0, lost: false, reason: null, done: false, chosen: [],
        };
    }

    function standingBlocks(state) { return state.blocks.filter(b => b.standing); }

    function step(data, state, answerId) {
        if (state.done) return { type: 'done' };
        const q = data.questions[state.qi];
        const ans = q && q.answers.find(a => a.id === answerId);
        if (!ans) return { type: 'invalid', answerId };
        const cm = compile(data);
        state.chosen.push(answerId);
        const stand = standingBlocks(state);
        let ev;
        if (sat(cm, blockLits(stand).concat(ans.lits))) {
            const base = stand.filter(b => b.kind === 'base');
            const alts = alternatives(data, ans.lits);
            const cemented = ruledOut(cm, base, alts).every(Boolean);
            const pool = cemented ? stand.filter(b => b.kind === 'base' || b.status === 'cemented') : stand;
            const target = ruledOut(cm, pool, alts);
            let support = pool.slice();
            for (const b of pool) {   // oldest first: keep the newest supports, so towers grow tall
                const trial = support.filter(x => x !== b);
                if (sameFlags(ruledOut(cm, trial, alts), target)) support = trial;
            }
            const level = support.length ? 1 + Math.max.apply(null, support.map(b => b.level)) : 1;
            const block = {
                id: 'blk' + state.qi, kind: 'answer', lits: ans.lits, text: ans.text, short: ans.short,
                status: cemented ? 'cemented' : 'loose', cracked: false,
                parents: support.map(b => b.id), level, q: state.qi, answer: ans.id, standing: true,
                shaky: !cemented && support.some(b => b.status === 'loose'),
                proof: cemented ? proofLines(data, base, ans.lits) : null,
            };
            state.blocks.push(block);
            state.placed++;
            ev = { type: 'placed', block, status: block.status };
        } else {
            // A minimal set of standing blocks the answer clashes with (newest dropped first, so the
            // blame lands as low in the tower as it truly goes).
            let core = stand.slice();
            for (const b of stand.slice().reverse()) {
                const trial = core.filter(x => x !== b);
                if (!sat(cm, blockLits(trial).concat(ans.lits))) core = trial;
            }
            const explain = conflictLines(data, core, ans);
            const hit = {}, cracked = [], broken = [];
            core.forEach(b => {
                hit[b.id] = true;
                if (b.kind === 'base') { if (b.cracked) broken.push(b.id); else { b.cracked = true; cracked.push(b.id); } }
            });
            const pulled = [];
            if (broken.length) {
                stand.forEach(b => { b.standing = false; pulled.push(b.id); });
            } else {
                const gone = {};
                state.blocks.forEach(b => {   // placement order: parents always come first
                    if (!b.standing || b.kind === 'base') return;
                    if (hit[b.id] || b.parents.some(p => hit[p] || gone[p])) { gone[b.id] = true; b.standing = false; pulled.push(b.id); }
                });
            }
            state.caught++;
            state.rubble += 1 + pulled.length;
            ev = { type: 'caught', answer: ans, core: core.map(b => b.id), cracked, broken, pulled, explain };
            if (broken.length) { state.lost = true; state.reason = 'base'; }
            else if (state.rubble >= data.threshold) { state.lost = true; state.reason = 'rubble'; }
        }
        state.qi++;
        if (state.lost || state.qi >= data.questions.length) state.done = true;
        ev.lost = state.lost;
        ev.done = state.done;
        return ev;
    }

    function height(state) {
        const st = standingBlocks(state);
        return st.length ? 1 + Math.max.apply(null, st.map(b => b.level)) : 0;
    }
    function cementedCount(state) { return standingBlocks(state).filter(b => b.status === 'cemented').length; }

    // ---- generation -------------------------------------------------------------

    function buildAtoms(days, jobs, lodges, bools) {
        const atoms = [], groups = [], index = {};
        const add = (id, at) => { index[id] = atoms.length; atoms.push(Object.assign({ id }, at)); return index[id]; };
        const g = (id, list) => groups.push({ id, atoms: list });
        g('day', days.map(d => add('day:' + d, { yes: 'I arrived on ' + d, no: 'I did not arrive on ' + d, ys: 'Arrived ' + d, ns: 'Not ' + d })));
        g('job', jobs.map(j => add('job:' + j.id, { yes: 'I am ' + j.text, no: 'I am not ' + j.text, ys: j.short, ns: 'Not a ' + j.short.toLowerCase() })));
        g('lodge', lodges.map(l => add('lodge:' + l.id, { yes: 'I am staying at ' + l.text, no: 'I am not staying at ' + l.text, ys: 'Stays at ' + l.short, ns: 'Not at ' + l.short })));
        bools.forEach(b => add(b.id, { yes: b.yes, no: b.no, ys: b.ys, ns: b.ns }));
        return { atoms, groups, index };
    }

    function commonRules(atoms, groups) {
        return groups.map(g => {
            const clauses = [g.atoms.map(a => lit(a, true))];
            for (let i = 0; i < g.atoms.length; i++) {
                for (let j = i + 1; j < g.atoms.length; j++) clauses.push([lit(g.atoms[i], false), lit(g.atoms[j], false)]);
            }
            const names = g.atoms.map(a => atoms[a].ys.replace(/^(Arrived|Stays at) /, ''));
            const list = names.slice(0, -1).join(', ') + ' or ' + names[names.length - 1];
            return { id: 'one-' + g.id, kind: 'common', text: GROUP_INFO[g.id].rule(list), clauses };
        });
    }

    function boolsOf(t) {
        const out = [];
        t.imps.forEach(i => i.ifs.concat([i.then]).forEach(([id]) => { if (id.indexOf(':') === -1 && out.indexOf(id) === -1) out.push(id); }));
        return out;
    }

    function pickFacts(rng, cfg, ctx) {
        const cands = TEMPLATES.map(t => t(ctx)).filter(Boolean);
        const chosen = [], bools = [];
        const atomsOf = t => [].concat.apply([], t.imps.map(i => i.ifs.concat([i.then]).map(x => x[0])));
        while (chosen.length < cfg.facts) {
            const used = {};
            chosen.forEach(t => atomsOf(t).forEach(a => { if (a.indexOf('day:') !== 0) used[a] = true; }));
            const pool = cands.filter(t => chosen.indexOf(t) === -1 && boolsOf(t).filter(b => bools.indexOf(b) === -1).length + bools.length <= cfg.bools);
            if (!pool.length) break;
            const t = rng.weighted(pool.map(x => ({ item: x, weight: atomsOf(x).some(a => used[a]) ? 3 : 1 })));
            chosen.push(t);
            boolsOf(t).forEach(b => { if (bools.indexOf(b) === -1) bools.push(b); });
        }
        return { facts: chosen, bools };
    }

    function attempt(rng, diff, cfg) {
        const start = rng.int(0, DAYS.length - cfg.days);
        const days = DAYS.slice(start, start + cfg.days);
        const jobs = rng.shuffle(JOBS).slice(0, 3);
        const lodges = rng.shuffle(LODGES).slice(0, 3);
        const ctx = {
            days,
            job: {}, lodge: {},
            ev: { parade: rng.int(0, days.length - 2), thirteen: rng.int(0, days.length - 2), pie: rng.int(0, days.length - 2), inn: rng.int(1, days.length - 1) },
        };
        jobs.forEach(j => { ctx.job[j.id] = true; });
        lodges.forEach(l => { ctx.lodge[l.id] = true; });
        const picked = pickFacts(rng, cfg, ctx);
        const boolIds = picked.bools.slice();
        rng.shuffle(BOOLS.map(b => b.id)).forEach(id => { if (boolIds.length < cfg.bools && boolIds.indexOf(id) === -1) boolIds.push(id); });
        const bools = BOOLS.filter(b => boolIds.indexOf(b.id) !== -1);
        const { atoms, groups, index } = buildAtoms(days, jobs, lodges, bools);
        const rules = commonRules(atoms, groups).concat(picked.facts.map(t => ({
            id: t.id, kind: 'fact', text: t.text,
            clauses: t.imps.map(i => i.ifs.map(([id, v]) => lit(index[id], !v)).concat([lit(index[i.then[0]], i.then[1])])),
        })));
        const data = { atoms, groups, rules };
        const cm = compile(data);
        if (!cm.worlds.length) return null;
        const world = rng.pick(cm.worlds);
        const truth = a => !!(world & (1 << a));

        // Variables: each group, or a single true/false atom.
        const vars = groups.map(g => ({ kind: 'group', id: g.id, atoms: g.atoms }))
            .concat(bools.map(b => ({ kind: 'bool', id: b.id, atoms: [index[b.id]] })));
        const varLit = v => v.kind === 'group' ? lit(v.atoms.find(truth), true) : lit(v.atoms[0], truth(v.atoms[0]));
        const varOptions = v => v.kind === 'group' ? v.atoms.map(a => lit(a, true)) : [lit(v.atoms[0], true), lit(v.atoms[0], false)];

        // Cover story: three true facts, chosen so they commit you to a lot, and to at
        // least one answer whose clash with the story is several steps away.
        const groupVars = vars.filter(v => v.kind === 'group'), boolVars = vars.filter(v => v.kind === 'bool');
        let best = null;
        for (let t = 0; t < 8; t++) {
            const gs = rng.shuffle(groupVars).slice(0, rng.chance(0.4) ? 3 : 2);
            const pick = gs.concat(rng.shuffle(boolVars).slice(0, 3 - gs.length));
            const lits = pick.map(varLit);
            const p = propagate(data, lits.map(l => ({ a: l.a, v: l.v })));
            let deep = 0;
            vars.forEach(v => {
                if (pick.indexOf(v) !== -1 || deep > cfg.trapDist) return;
                varOptions(v).forEach(o => { deep = Math.max(deep, trapDistance(data, cm, lits, [o])); });
            });
            const score = Math.min(deep, cfg.trapDist + 1) * 4 + p.known.filter(Boolean).length * 0.3 + rng.next();
            if (!best || score > best.score) best = { pick, lits, score };
        }
        const baseVars = best.pick;
        const baseLits = best.lits;

        // Questions, chosen greedily along the true path.
        let left = vars.filter(v => baseVars.indexOf(v) === -1);
        const path = baseLits.slice();
        const questions = [];
        const stats = { traps: 0, maxDist: 0, cemented: 0 };
        while (questions.length < cfg.questions && left.length) {
            let top = null;
            left.forEach(v => {
                const opts = varOptions(v);
                const pathD = Math.max.apply(null, opts.map(o => trapDistance(data, cm, path, [o])));
                const maxD = Math.max.apply(null, opts.map(o => trapDistance(data, cm, baseLits, [o])));
                const cem = alternatives(data, [varLit(v)]).every(alt => !sat(cm, baseLits.concat([alt])));
                const s = (maxD ? 3 + Math.min(maxD, 5) : pathD ? 2.5 : 0) + (cem ? 1.2 : 0) + rng.next() * 2;
                if (!top || s > top.s) top = { v, s, maxD, pathD, cem };
            });
            left = left.filter(v => v !== top.v);
            if (top.pathD) stats.traps++;
            stats.maxDist = Math.max(stats.maxDist, top.maxD);
            if (top.cem) stats.cemented++;
            questions.push(top.v);
            path.push(varLit(top.v));
        }
        if (questions.length < cfg.questions) return null;
        const ok = stats.maxDist >= cfg.trapDist && stats.traps >= Math.ceil(cfg.questions / 2) && stats.cemented >= 1;
        const quality = stats.traps * 2 + Math.min(stats.maxDist, cfg.trapDist + 1) * 3 + Math.min(stats.cemented, 2) + rng.next();
        return { data, baseLits, questions, varOptions, ok, quality };
    }

    function generate(rng, difficulty) {
        const diff = Rift.clamp(Math.round(difficulty || 1), 1, 3);
        const cfg = CFG[diff];
        let best = null;
        for (let i = 0; i < 120; i++) {
            const a = attempt(rng, diff, cfg);
            if (!a) continue;
            if (!best || (a.ok && !best.ok) || (a.ok === best.ok && a.quality > best.quality)) best = a;
            if (best.ok && i >= 2) break;
        }
        const d = best.data;
        const data = {
            v: 1,
            difficulty: diff,
            seed: rng.int(0, 2147483646),
            questioner: Object.assign({}, QUESTIONER),
            threshold: cfg.threshold,
            atoms: d.atoms,
            groups: d.groups,
            rules: d.rules,
            base: best.baseLits.map((l, i) => ({ id: 'base' + i, lits: [l], text: litText(d, l), short: litShort(d, l) })),
            questions: [],
        };
        best.questions.forEach((v, qi) => {
            const opts = rng.shuffle(best.varOptions(v));
            const text = v.kind === 'group' ? rng.pick(GROUP_INFO[v.id].q) : rng.pick(BOOLS.find(b => b.id === v.id).q);
            data.questions.push({
                id: 'q' + qi, text, topic: v.id,
                answers: opts.map((l, j) => ({ id: 'q' + qi + 'a' + j, lits: [l], text: litText(d, l), short: litShort(d, l) })),
            });
        });
        return data;
    }

    // ---- solving and checking ------------------------------------------------------

    // A fully consistent path: pick any world that fits the cover story and answer truthfully about it.
    function solve(data) {
        const cm = compile(data);
        const baseLits = blockLits(data.base);
        const w = cm.worlds.find(x => baseLits.every(l => !!(x & (1 << l.a)) === l.v));
        if (w == null) return null;
        return data.questions.map(q => {
            const a = q.answers.find(ans => ans.lits.every(l => !!(w & (1 << l.a)) === l.v));
            return a ? a.id : null;
        });
    }

    function play(data, ids) {
        const state = newState(data);
        const events = [];
        for (const id of ids) {
            if (state.done) break;
            const ev = step(data, state, id);
            if (ev.type === 'invalid') return { state, events, invalid: id };
            events.push(ev);
        }
        return { state, events };
    }

    function check(data, answer) {
        const ids = Array.isArray(answer) ? answer : (answer && Array.isArray(answer.answers) ? answer.answers : []);
        const n = data.questions.length;
        const { state, invalid } = play(data, ids);
        const res = { solved: false, partial: state.placed / n, height: height(state), cemented: cementedCount(state) };
        if (invalid) return Object.assign(res, { feedback: 'That is not one of the answers.' });
        if (!state.done) return Object.assign(res, { feedback: 'Answer every question (' + (n - state.qi) + ' still to go).' });
        if (state.lost) {
            return Object.assign(res, {
                feedback: state.reason === 'base'
                    ? 'You contradicted a cracked part of your cover story again. The whole tower comes down: the Constable sees through your disguise.'
                    : 'Too many blocks have fallen (' + state.rubble + ' in the rubble). Your story has collapsed and the Constable sees through your disguise.',
            });
        }
        return Object.assign(res, {
            solved: true,
            feedback: 'Your story held! Your tower stands ' + res.height + ' rows tall with ' + res.cemented + ' cemented block' + (res.cemented === 1 ? '' : 's') + '.',
        });
    }

    // ---- hints and the "why?" question ------------------------------------------------

    // The trap furthest from the cover story, along a consistent path.
    function deepestTrap(data) {
        const cm = compile(data);
        const baseLits = blockLits(data.base);
        let best = null;
        data.questions.forEach((q, qi) => q.answers.forEach(a => {
            const d = trapDistance(data, cm, baseLits, a.lits);
            if (d && (!best || d > best.d)) best = { q, qi, a, d };
        }));
        return best;
    }

    function hints(data) {
        const out = ['Before answering, trace which base claim this answer depends on: find the village facts that link it to your cover story, and follow them step by step.'];
        const trap = deepestTrap(data);
        if (!trap) {
            out.push('Cemented blocks are proven from your cover story, so they can never clash with it. Prefer answers you can prove.');
            out.push('Use the village facts to work out what your cover story already commits you to, before the Constable asks.');
            return out;
        }
        const cm = compile(data);
        let core = data.base.map(b => ({ id: b.id, kind: 'base', lits: b.lits, text: b.text }));
        core.slice().reverse().forEach(b => {
            const trial = core.filter(x => x !== b);
            if (!sat(cm, blockLits(trial).concat(trap.a.lits))) core = trial;
        });
        out.push('Question ' + (trap.qi + 1) + ' (“' + trap.q.text + '”) hides a trap: one answer sounds harmless but clashes with your cover story ('
            + core.map(b => '“' + b.text + '”').join(' and ') + ') after ' + trap.d + ' steps through the village facts.');
        const lines = conflictLines(data, core, trap.a);
        out.push('Do not say “' + trap.a.text + '.” ' + lines.join(' '));
        return out;
    }

    function why(data) {
        const rng = Rift.makeRng('why:' + data.seed);
        const variant = rng.int(0, 1);
        let question, correct, wrong, explain;
        if (variant === 0) {
            question = 'One answer contradicted a block near the bottom, and every block above it fell, even the cemented ones. Why?';
            correct = 'Those blocks used that support in their proof. Remove it and that proof no longer justifies them. The claims might still be true for another reason.';
            wrong = [
                'Because the Constable was angry and knocked down everything, whether it was proven or not.',
                'Because cemented blocks are always the weakest part of a tower.',
                'Because tall towers always fall, however strong their base is.',
            ];
            explain = 'A proof shows what follows from its premises. If you drop a premise, that proof may no longer work. The conclusion is not automatically false: it might have another proof. Falling blocks represent lost support, not necessarily false claims.';
        } else {
            question = 'Why is a loose block, one that rests on an unproven claim, fragile?';
            correct = 'Your story did not force that claim. It is an extra choice, so later evidence may contradict it. Unproven does not mean false.';
            wrong = [
                'Because an unproven claim is always false.',
                'Because loose blocks are heavier than cemented ones.',
                'Because the more blocks a tower has, the more likely the Constable is right.',
            ];
            explain = 'A loose claim may be true, but it needs support. A conditional proof says what follows IF its premise is true. If that premise fails, you lose that justification; the conclusion may still be true for another reason.';
        }
        const options = rng.shuffle([correct].concat(wrong));
        return { question, options, correct: options.indexOf(correct), explain };
    }

    // ---- DOM ---------------------------------------------------------------------

    const STATUS_TEXT = {
        base: 'Cover story (an axiom): you accept it without proof. Everything else rests on it.',
        cemented: 'Cemented: proven from your cover story by the village facts.',
        loose: 'Loose: nothing contradicts it, but nothing proves it either.',
        cracked: 'Cracked: the Constable caught you contradicting this once. Once more and the tower falls.',
    };
    const REACT = {
        loose: ['Hmm. I shall write that down.', 'Is that so…', 'Noted.', 'Very well. For now.'],
        cemented: ['Hmph. That does follow.', 'Well… that fits.', 'Quite right, quite right.'],
        caught: ['Aha! That is not what you said before!', 'Contradiction! I have you now!', 'Hold on… that cannot be right!'],
    };

    function mount(container, data, api) {
        const el = (api && api.el) || Rift.el;
        const sfx = name => { try { if (api && api.sfx) api.sfx(name); } catch (e) { /* ignore */ } };
        const uiRng = (api && api.rng) || Rift.makeRng('tower-ui:' + data.seed);
        try { if (root.getComputedStyle && root.getComputedStyle(container).position === 'static') container.style.position = 'relative'; } catch (e) { /* ignore */ }

        const state = newState(data);
        let busy = false;
        let lastEvent = null;
        const timers = [];
        const later = (fn, ms) => { timers.push(setTimeout(fn, ms)); };
        const byId = id => state.blocks.find(b => b.id === id);
        const has = id => !!(Rift.Assets && Rift.Assets.has && Rift.Assets.has(id));

        const rootEl = el('div.tw');

        // --- left: the questioner ---
        const portraitId = mood => 'npc/' + data.questioner.id + '/' + mood;
        const portrait = Rift.Assets
            ? Rift.Assets.img(portraitId('neutral'), { colour: 'emotion', label: data.questioner.name, className: 'tw-portrait', alt: data.questioner.name })
            : el('div.tw-portrait');
        const bubble = el('div.tw-bubble', { role: 'note', 'aria-live': 'polite' });
        const answersEl = el('div.tw-answers');
        const progress = el('div.tw-progress');
        const result = el('div.tw-result', { 'aria-live': 'polite' });
        rootEl.appendChild(el('div.tw-left', {}, [
            el('div.tw-asker', {}, [portrait, el('div.tw-name', { text: data.questioner.name })]),
            bubble, answersEl, result, progress,
        ]));

        // --- middle: the tower ---
        const statsEl = el('div.tw-stats');
        const towerEl = el('div.tw-tower');
        const stage = el('div.tw-stage', {}, [towerEl, el('div.tw-ground')]);
        const info = el('div.tw-info', { 'aria-live': 'polite' });
        rootEl.appendChild(el('div.tw-mid', {}, [statsEl, stage, info]));

        // --- right: what everyone in Boolesbury knows ---
        const facts = data.rules.filter(r => r.kind === 'fact');
        const common = data.rules.filter(r => r.kind === 'common');
        rootEl.appendChild(el('div.tw-right', {}, [
            el('h3', { text: 'Village facts' }),
            el('div.tw-sub', { text: 'Everyone in Boolesbury knows these are true.' }),
            el('ul.tw-facts', {}, facts.map(r => el('li', { text: r.text }))),
            el('h4', { text: 'Common sense' }),
            el('ul.tw-facts.common', {}, common.map(r => el('li', { text: r.text }))),
            el('div.tw-legend', {}, [
                el('span.tw-key.base', { text: 'Cover story' }),
                el('span.tw-key.cemented', { text: 'Cemented: proven' }),
                el('span.tw-key.loose', { text: 'Loose: unproven' }),
                el('span.tw-key.cracked', { text: 'Cracked' }),
            ]),
        ]));

        function setMood(mood) {
            if (portrait.tagName === 'IMG' && Rift.Assets) portrait.src = Rift.Assets.src(portraitId(mood), { colour: 'emotion', label: data.questioner.name });
            portrait.dataset.mood = mood;
        }
        function say(text) {
            bubble.textContent = text;
            bubble.classList.remove('pop');
            void bubble.offsetWidth;
            bubble.classList.add('pop');
        }

        function blockStatus(b) { return b.cracked ? 'cracked' : b.status; }
        function artFor(status) { return status === 'base' ? null : 'ui/block-' + (status === 'cracked' ? 'cracked' : status); }

        function showInfo(b) {
            info.innerHTML = '';
            if (!b) { info.appendChild(el('div.muted', { text: 'Point at a block to see what it claims and what it rests on.' })); return; }
            const parents = b.parents.map(byId).filter(Boolean);
            info.appendChild(el('div.tw-info-claim', { text: '“' + b.text + '.”' }));
            info.appendChild(el('div.tw-info-status', { dataset: { status: blockStatus(b) }, text: STATUS_TEXT[blockStatus(b)] }));
            if (b.kind !== 'base') {
                info.appendChild(el('div.tw-info-rests', {
                    text: parents.length ? 'Rests on: ' + parents.map(p => '“' + p.short + '”').join(', ') : 'Rests on: nothing but your word.',
                }));
            }
            if (b.proof && b.proof.length) info.appendChild(el('ol.tw-proof', {}, b.proof.map(line => el('li', { text: line }))));
        }

        function highlight(b) {
            towerEl.querySelectorAll('.tw-block').forEach(n => n.classList.remove('support', 'focus'));
            if (!b) return;
            const mark = (id, cls) => { const n = towerEl.querySelector('[data-id="' + id + '"]'); if (n) n.classList.add(cls); };
            mark(b.id, 'focus');
            b.parents.forEach(p => mark(p, 'support'));
        }

        function renderTower(fresh) {
            towerEl.innerHTML = '';
            const st = standingBlocks(state);
            const top = st.length ? Math.max.apply(null, st.map(b => b.level)) : 0;
            for (let lv = top; lv >= 0; lv--) {
                const row = el('div.tw-row' + (lv === 0 ? '.base' : ''));
                st.filter(b => b.level === lv).forEach(b => {
                    const status = blockStatus(b);
                    const node = el('button.tw-block', {
                        type: 'button',
                        dataset: { id: b.id, status },
                        'aria-label': b.text + '. ' + STATUS_TEXT[status],
                        onmouseenter: () => { showInfo(b); highlight(b); },
                        onfocus: () => { showInfo(b); highlight(b); },
                        onclick: () => { showInfo(b); highlight(b); sfx('click'); },
                    }, [el('span.tw-block-label', { text: b.short })]);
                    const art = artFor(status);
                    if (art && has(art)) { node.classList.add('art'); node.style.backgroundImage = 'url("' + Rift.Assets.src(art) + '")'; }
                    if (b.kind === 'base') node.classList.add('is-base');
                    if (b.shaky) node.classList.add('shaky');
                    if (status === 'cemented') node.appendChild(el('span.tw-seal', { text: '✓', 'aria-hidden': 'true' }));
                    if (fresh === b.id) node.classList.add('arrive');
                    node.style.setProperty('--tilt', ((uiRng.next() - 0.5) * (b.shaky ? 4 : 1.2)).toFixed(2) + 'deg');
                    row.appendChild(node);
                });
                towerEl.appendChild(row);
            }
            statsEl.innerHTML = '';
            const rubbleLeft = Math.max(0, data.threshold - state.rubble);
            statsEl.appendChild(el('span.chip', { text: 'Height ' + height(state) }));
            statsEl.appendChild(el('span.chip.cem', { text: 'Cemented ' + cementedCount(state) }));
            statsEl.appendChild(el('span.chip.rubble', { title: 'Fallen blocks. The tower collapses at ' + data.threshold + '.', text: 'Rubble ' + state.rubble + ' / ' + data.threshold }, []));
            statsEl.dataset.danger = rubbleLeft <= 2 ? 'high' : '';
        }

        function renderProgress() {
            progress.innerHTML = '';
            data.questions.forEach((q, i) => {
                const ev = state.qi > i ? (state.blocks.find(b => b.q === i) ? 'ok' : 'bad') : (i === state.qi && !state.done ? 'now' : '');
                progress.appendChild(el('span.tw-pip', { dataset: { s: ev }, title: 'Question ' + (i + 1) }));
            });
        }

        function showQuestion() {
            const q = data.questions[state.qi];
            setMood('neutral');
            say(q.text);
            showResult('', '', []);
            answersEl.innerHTML = '';
            q.answers.forEach(a => {
                answersEl.appendChild(el('button.tw-answer', {
                    type: 'button',
                    onclick: () => choose(a.id),
                    onmouseenter: () => sfx('click'),
                }, [el('span', { text: a.text + '.' })]));
            });
            renderProgress();
        }

        function showResult(kind, title, lines) {
            result.innerHTML = '';
            result.className = 'tw-result ' + kind;
            if (title) result.appendChild(el('div.tw-result-title', { text: title }));
            if (lines && lines.length) result.appendChild(el('ol.tw-proof', {}, lines.map(l => el('li', { text: l }))));
        }

        function nextButton(label, fn) {
            answersEl.innerHTML = '';
            answersEl.appendChild(el('button.btn.primary.tw-next', { type: 'button', text: label, onclick: () => { sfx('click'); fn(); } }));
        }

        function rejectGhost(text) {
            const ghost = el('div.tw-ghost', { text });
            stage.appendChild(ghost);
            later(() => { if (ghost.parentNode) ghost.parentNode.removeChild(ghost); }, 1300);
        }

        function choose(id) {
            if (busy || state.done) return;
            busy = true;
            answersEl.querySelectorAll('button').forEach(b => { b.disabled = true; });
            const ev = step(data, state, id);
            lastEvent = ev;
            if (ev.type === 'placed') {
                sfx('place');
                renderTower(ev.block.id);
                showInfo(ev.block);
                highlight(ev.block);
                if (ev.status === 'cemented') {
                    setMood('nervous');
                    say(uiRng.pick(REACT.cemented));
                    showResult('good', 'Cemented! This block is proven from your cover story:', ev.block.proof);
                } else {
                    say(uiRng.pick(REACT.loose));
                    showResult('neutral', ev.block.shaky ? 'Placed loose, on top of another unproven block. Careful: it is only as safe as what it rests on.' : 'Placed loose: it fits, but nothing proves it.', []);
                }
                busy = false;
                afterAnswer();
            } else if (ev.type === 'caught') {
                sfx('error');
                setMood('accusing');
                say(uiRng.pick(REACT.caught));
                rejectGhost(ev.answer.short);
                const doomed = ev.pulled.concat(ev.cracked);
                towerEl.querySelectorAll('.tw-block').forEach(n => {
                    const bid = n.dataset.id;
                    if (ev.pulled.indexOf(bid) !== -1) {
                        n.classList.add('falling');
                        n.style.setProperty('--fall-x', Math.round((uiRng.next() - 0.5) * 220) + 'px');
                        n.style.setProperty('--fall-r', Math.round((uiRng.next() - 0.5) * 140) + 'deg');
                    } else if (ev.cracked.indexOf(bid) !== -1 || ev.core.indexOf(bid) !== -1) n.classList.add('hit');
                });
                const title = ev.broken.length
                    ? 'Caught again on a cracked part of your cover story. The whole tower falls!'
                    : ev.pulled.length
                        ? 'Caught! ' + ev.pulled.length + ' block' + (ev.pulled.length === 1 ? '' : 's') + ' pulled out of your tower' + (ev.cracked.length ? ', and your cover story cracks' : '') + '.'
                        : ev.cracked.length ? 'Caught! Your cover story cracks.' : 'Caught! Your answer crumbles.';
                showResult('bad', title, ev.explain);
                if (doomed.length) stage.classList.add('quake');
                later(() => {
                    stage.classList.remove('quake');
                    renderTower(null);
                    showInfo(null);
                    busy = false;
                    afterAnswer();
                }, 900);
            } else {
                busy = false;
            }
        }

        function afterAnswer() {
            renderProgress();
            if (!state.done) { nextButton('Next question ›', showQuestion); return; }
            nextButton(state.lost ? 'Face the Constable ›' : 'Finish ›', finish);
        }

        function finish() {
            answersEl.innerHTML = '';
            const r = api && api.submit ? api.submit(state.chosen.slice()) : check(data, state.chosen.slice());
            const res = r || check(data, state.chosen.slice());
            if (res.solved) {
                setMood('nervous');
                say('Hmph. Your story checks out… for now. Move along.');
                rootEl.classList.add('solved');
                sfx('success');
                showResult('good', res.feedback, []);
            } else {
                setMood('accusing');
                say('Your story has more holes than a cheese! Imposter!');
                rootEl.classList.add('failed');
                sfx('error');
                showResult('bad', res.feedback, []);
            }
        }

        container.appendChild(rootEl);
        renderTower(null);
        showInfo(null);
        say('Halt! A new face in Boolesbury. Your cover story is the bottom of your tower: stick to it. Now, a few questions…');
        nextButton('Begin the questioning ›', showQuestion);
        renderProgress();

        return {
            destroy() {
                timers.forEach(clearTimeout);
                if (rootEl.parentNode) rootEl.parentNode.removeChild(rootEl);
            },
            get lastEvent() { return lastEvent; },
        };
    }

    Rift.Puzzles.register({
        id: 'tower',
        rules: [
            "Keep your cover story consistent with the facts on the right.",
            "Each answer adds a block. A cemented block already follows from your story.",
            "A loose block is an extra choice that your cover story did not force. It must still fit the facts and your other answers.",
            "A contradiction pulls supporting blocks. The tower falls if a cracked base breaks again or rubble reaches the limit. Finish with the tower standing.",
            "How to play is free. The Hint button shows its heart cost. Think first, then check your answer."
        ],
        tutorial: [
            {
                "text": "Read your cover story and the posted facts. Your answers must fit them all.",
                "highlight": ".tw-right"
            },
            {
                "text": "Choose an answer to the current question. Both choices may look safe, but later facts can force one.",
                "highlight": ".tw-answers"
            },
            {
                "text": "Cemented means already forced by your story. Loose means still open; it is not automatically wrong.",
                "highlight": ".tw-tower"
            },
            {
                "text": "Example: all runners wear boots; your story says you are a runner. \"I wear no boots\" would contradict that story.",
                "highlight": ".tw-right"
            },
            {
                "text": "Follow what the blocks force, rather than choose whatever sounds nice. Finish every question without a collapse. How to play is free. The Hint button shows its heart cost. Think first, then check your answer.",
                "highlight": ".tw-left"
            }
        ],
        name: 'The Tower',
        colour: 'emotion',
        family: 'Hidden premise',
        blurb: 'Keep your cover story straight! Every answer adds a block to your tower. Proven blocks are cemented; a contradiction pulls a block and everything resting on it.',
        tok: 'A proof shows what follows from its premises. Remove a premise and that proof may fail; the conclusion is not automatically false.',
        generate,
        check,
        hints,
        why,
        solve,
        mount,
        // exposed for tests and tools
        _internal: { compile, sat, propagate, alternatives, newState, step, play, height, cementedCount, trapDistance, deepestTrap, blockLits, CFG },
    });
})(typeof window !== 'undefined' ? window : globalThis);
