/*
 * The four side-story resolution verbs as pure models (design/SIDE-STORIES.md section 2;
 * the data format is the header of data/script/side-stories.js). No DOM: the screen
 * (js/screens/side-story.js) draws them and turns each result into clock ticks, drains,
 * Progress and replies.
 *
 *   const m = Rift.SideVerbs.rounds('deduce', spec, { head: 1, cards })   // deduce · test · object
 *   m.current()  → { round, ask, index, struck }      m.answer(i) → { ok, cost, say, roundDone, done }
 *   const n = Rift.SideVerbs.negotiation(spec, { head: 1, species: 'owlet' })
 *   n.listen('mirror') · n.argue(i) · n.argue('special') · n.ask()  → effects (see below)
 *
 * Every verb is deterministic: no dice. Mistakes cost clock notches, never hearts.
 */
(function (root) {
    'use strict';

    const Rift = root.Rift;

    // ---- Deduce, Test and Object: rounds of "asks" ------------------------------------
    // A round is { line, press, table, asks: [ask] }; an ask is { q, options: [{ t, ok, say, cost }] }
    // or { q, present: 'cardId' | ['a', 'b'] } (pick one of your clue cards). Shorthand per verb:
    //   deduce: { q, options, why: { q, options } }        → asks [pick, Why?]
    //   test:   { q, options, then: { q, options } }       → asks [the test, the follow-up]
    //   object: { line, press, q, options | present, name: { q, options } } → asks [reply, name the flaw]
    const DEFAULT_Q = {
        deduce: 'Who or what is it?',
        test: 'Which test could prove the claim wrong?',
        object: 'What is wrong with that?',
    };
    function normalRound(kind, r) {
        if (r.asks) return Object.assign({}, r, { asks: r.asks.map(a => Object.assign({}, a)) });
        const asks = [];
        const first = { q: r.q || DEFAULT_Q[kind] || 'Choose.', cost: r.cost };
        if (r.present) first.present = r.present; else first.options = r.options || [];
        asks.push(first);
        if (r.why) asks.push(Object.assign({ q: 'Why?', why: true }, r.why));
        if (r.then) asks.push(Object.assign({ q: 'And so?' }, r.then));
        if (r.name) asks.push(Object.assign({ q: 'Name the flaw.' }, r.name));
        return Object.assign({}, r, { asks });
    }
    function rightPresent(ask, cardId) { return [].concat(ask.present).includes(cardId); }

    function rounds(kind, spec, opts) {
        const o = opts || {};
        const list = (spec.rounds || []).map(r => normalRound(kind, r));
        let ri = 0, ai = 0;
        const struck = list.map(r => r.asks.map(() => new Set()));
        // A head start (Progress already filled: blue options, { progress } steps) strikes out one
        // wrong option per notch, in the first asks, always leaving one wrong option to choose.
        let head = Math.max(0, Number(o.head) || 0);
        for (let r = 0; r < list.length && head > 0; r++) {
            list[r].asks.forEach((a, k) => {
                if (!a.options) return;
                const wrong = a.options.map((x, i) => (x.ok ? -1 : i)).filter(i => i >= 0);
                while (head > 0 && wrong.length - struck[r][k].size > 1) {
                    struck[r][k].add(wrong.find(i => !struck[r][k].has(i)));
                    head -= 1;
                }
            });
        }
        const done = () => ri >= list.length;
        function current() {
            if (done()) return null;
            const round = list[ri];
            return { round, ask: round.asks[ai], index: ri, askIndex: ai, struck: struck[ri][ai], total: list.length };
        }
        // i: an option index, or a clue card id for a `present` ask.
        function answer(i) {
            const cur = current();
            if (!cur) return { ok: false, done: true };
            const ask = cur.ask;
            let ok, opt = null;
            if (ask.present) ok = rightPresent(ask, i);
            else {
                opt = ask.options[i];
                if (!opt || cur.struck.has(i)) return { ok: false, ignored: true, cost: 0 };
                ok = !!opt.ok;
            }
            if (!ok) {
                if (opt) cur.struck.add(i);
                const cost = (opt && opt.cost != null) ? opt.cost : (ask.cost != null ? ask.cost : (cur.round.cost != null ? cur.round.cost : 1));
                return { ok: false, cost, say: (opt && opt.say) || ask.wrong || cur.round.wrong || null, roundDone: false, done: false };
            }
            const say = (opt && opt.say) || ask.right || null;
            ai += 1;
            let roundDone = false;
            let after = null;
            if (ai >= cur.round.asks.length) {
                roundDone = true;
                after = cur.round.right || null;
                ri += 1; ai = 0;
            }
            return { ok: true, cost: 0, say, after, roundDone, progress: roundDone ? 1 : 0, done: done() };
        }
        return { kind, current, answer, done, rounds: list, cards: o.cards || [] };
    }

    // ---- Negotiate (research/draw-steel-and-disco-elysium.md §3.1, made deterministic) --------
    const MOTIVES = ['facts', 'fame', 'fairness', 'safety', 'experts', 'profit'];
    const MOTIVE_NAMES = { facts: 'Facts', fame: 'Fame', fairness: 'Fairness', safety: 'Safety', experts: 'Experts', profit: 'Profit' };
    const LISTEN = {
        mirror: { label: 'Mirror', tag: 'Listen', hint: 'Say back their last words.' },
        feeling: { label: 'Name the feeling', tag: 'Feel', hint: 'Say what they seem to feel.' },
        sum: { label: 'Sum up', tag: 'Listen', hint: 'Say their story back, short.' },
    };
    // The avatar's own argument (its Way of Knowing). It counts as any one of its appeals that is unused.
    const SPECIAL = {
        owlet: { label: 'Spell it out', appeal: ['facts', 'fairness'] },
        mothkin: { label: 'Look for yourself', appeal: ['facts', 'safety'] },
        fox: { label: 'Picture this', appeal: ['fame', 'safety'] },
        frogling: { label: 'Remember when', appeal: ['experts', 'fairness'] },
        raven: { label: 'Reframe', appeal: ['profit', 'fame'] },
    };

    function negotiation(spec, opts) {
        const o = opts || {};
        const start = { interest: spec.interest != null ? spec.interest : 2, patience: spec.patience != null ? spec.patience : 3 };
        const askAt = spec.askAt || 4;
        const cares = (spec.cares || []).slice();
        const cantStand = (spec.cantStand || []).slice();
        const hidden = cares.map(k => ({ kind: 'cares', key: k })).concat(cantStand.map(k => ({ kind: 'cantStand', key: k })));
        const sp = o.species && SPECIAL[o.species] ? o.species : null;
        const specialText = sp && spec.special ? spec.special[sp] : null;
        const st = {
            interest: Math.min(5, start.interest + Math.max(0, Number(o.head) || 0)),
            patience: start.patience,
            used: new Set(),          // motivations already used this round of talks
            played: new Set(),        // argument cards played this round of talks (index or 'special')
            listened: new Set(),
            revealed: [],             // [{ kind, key }]
            done: false,
            ok: false,
        };
        const special = sp ? { t: (typeof specialText === 'string' ? specialText : (specialText && specialText.t)) || SPECIAL[sp].label + '.', label: SPECIAL[sp].label, appeal: SPECIAL[sp].appeal, sound: true, special: true, say: specialText && specialText.say } : null;

        function reveal() {
            const next = hidden.find(h => !st.revealed.some(r => r.kind === h.kind && r.key === h.key));
            if (next) st.revealed.push(next);
            return next || null;
        }
        // Patience out: the clock ticks, then they give you another go (cards and motivations come back).
        function afterArgument(out) {
            if (st.interest <= 0) { out.tick += 1; st.interest = 1; out.floor = true; }
            if (st.patience <= 0 && !st.done) {
                out.tick += 1;
                out.reset = true;
                st.patience = start.patience;
                st.used.clear();
                st.played.clear();
            }
            if (st.interest >= 5) { st.done = true; st.ok = true; out.done = true; }
            return out;
        }

        function listen(kind) {
            if (st.done || !LISTEN[kind]) return { ignored: true };
            const first = !st.listened.has(kind);
            st.listened.add(kind);
            const out = { kind, first, drain: first ? 1 : 0, progress: first ? 1 : 0, reveal: first ? reveal() : null, say: ((spec.listen || {})[kind] || {}).say || null };
            return out;
        }

        function classify(card) {
            const appeals = [].concat(card.appeal || []).filter(Boolean);
            const fresh = appeals.find(k => cares.includes(k) && !st.used.has(k));
            if (fresh) return { result: 'hit', key: fresh };
            if (appeals.some(k => cares.includes(k))) return { result: 'used' };
            if (appeals.some(k => cantStand.includes(k))) return { result: 'pitfall', key: appeals.find(k => cantStand.includes(k)) };
            return { result: 'plain' };
        }

        // i: an argument index, or 'special' for the avatar's own card.
        function argue(i) {
            const card = i === 'special' ? special : (spec.args || [])[i];
            if (st.done || !card || st.played.has(i)) return { ignored: true };
            st.played.add(i);
            const c = classify(card);
            const out = { result: c.result, key: c.key || null, interest: 0, patience: 0, tick: 0, progress: 0, say: card.say || null, reply: null };
            if (c.result === 'hit') {
                st.used.add(c.key);
                out.interest = 1;
                out.patience = card.sound ? 0 : -1;
                out.progress = 1;
                if (!st.revealed.some(r => r.kind === 'cares' && r.key === c.key)) st.revealed.push({ kind: 'cares', key: c.key });
                out.reply = 'up';
            } else if (c.result === 'used') { out.patience = -1; out.reply = 'same'; }
            else if (c.result === 'plain') { out.patience = -1; out.reply = 'same'; }
            else {
                out.interest = -1; out.patience = -1; out.tick = 1; out.reply = 'down';
                if (!st.revealed.some(r => r.kind === 'cantStand' && r.key === c.key)) st.revealed.push({ kind: 'cantStand', key: c.key });
            }
            st.interest = Math.min(5, Math.max(0, st.interest + out.interest));
            st.patience = Math.max(0, st.patience + out.patience);
            return afterArgument(out);
        }

        // The request. Before Trust (Interest below askAt) it costs a notch and some Patience.
        function ask() {
            if (st.done) return { ignored: true };
            if (st.interest >= askAt) { st.done = true; st.ok = true; return { ok: true, done: true, tick: 0, say: (spec.ask || {}).yes || null }; }
            st.patience = Math.max(0, st.patience - 1);
            const out = { ok: false, done: false, tick: 1, say: (spec.ask || {}).early || null };
            return afterArgument(out);
        }

        return {
            kind: 'negotiate', spec, state: st, special, askAt, start,
            listen, argue, ask, classify,
            done: () => st.done,
            canAsk: () => !st.done,
            cards: () => (spec.args || []).map((a, i) => ({ i, card: a, played: st.played.has(i) })),
        };
    }

    Rift.SideVerbs = { rounds, negotiation, normalRound, MOTIVES, MOTIVE_NAMES, LISTEN, SPECIAL };
})(typeof window !== 'undefined' ? window : globalThis);
