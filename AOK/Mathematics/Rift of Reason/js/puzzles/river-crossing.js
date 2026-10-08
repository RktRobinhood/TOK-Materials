/*
 * River crossing (the Ford): row your creatures across a river in a small boat.
 * Rivals left together on a bank without you squabble. Borrows the classic
 * river-crossing mechanic only. BFS checks every generated puzzle is solvable.
 *   d1: 3 creatures, boat seats 1, rivals in a chain (A–B, B–C).
 *   d2: 4 creatures, boat seats 2, random rivalries.
 *   d3: 5 creatures, boat seats 2, more rivalries, and a troll toll: the
 *       shortest number of crossings is all you get.
 * Uses the player's own caught creatures when it can (Rift.State), topped up
 * from a fixed Ch1 cast. Answer: { trips: [[creatureId, ...], ...] }, alternating
 * near → far, far → near, starting from the near bank (an empty trip = you row alone).
 */
(function (root) {
    'use strict';

    const Rift = root.Rift;
    const FALLBACK = [
        { id: 'beastie', name: 'Mr. Beastie' },
        { id: 'swiftlet', name: 'Swiftlet' },
        { id: 'siuuugull', name: 'Siuuugull' },
        { id: 'lobstorian', name: 'Lobstorian' },
        { id: 'tremendoodle', name: 'Tremendoodle' },
    ];
    const SHAPE = {
        1: { n: 3, seats: 1, pairs: [1, 1], min: 7, max: 7 },
        2: { n: 4, seats: 2, pairs: [2, 3], min: 5, max: 11 },
        3: { n: 5, seats: 2, pairs: [3, 5], min: 7, max: 15 },
    };

    // Species the player owns, in a stable order (empty in tests and on the bench).
    function owned() {
        try {
            const s = Rift.State && Rift.State.get && Rift.State.get();
            const seen = [];
            ((s && s.creatures) || []).forEach(c => { if (c && c.species && !seen.includes(c.species)) seen.push(c.species); });
            return seen;
        } catch (e) { return []; }
    }
    function nameOf(id) {
        const c = Rift.data && Rift.data.creatures && Rift.data.creatures[id];
        return c ? c.name : ((FALLBACK.find(f => f.id === id) || {}).name || id);
    }

    // State: bitmask of creatures on the far bank, and which bank the boat (and you) are on.
    function unsafe(data, mask, boat) {
        const full = (1 << data.cast.length) - 1;
        const away = boat ? full & ~mask : mask; // the bank you are not on
        return data.rivals.find(([a, b]) => (away >> a & 1) && (away >> b & 1)) || null;
    }

    function subsets(bits, max) {
        const out = [0];
        const idx = [];
        for (let i = 0; i < 31; i++) if (bits >> i & 1) idx.push(i);
        const walk = (start, set, size) => {
            for (let k = start; k < idx.length; k++) {
                const s = set | (1 << idx[k]);
                out.push(s);
                if (size + 1 < max) walk(k + 1, s, size + 1);
            }
        };
        walk(0, 0, 0);
        return out;
    }

    // BFS over safe states: shortest plan (list of carried bitmasks) and how many safe states exist.
    function search(data) {
        const full = (1 << data.cast.length) - 1;
        const key = (m, b) => m * 2 + b;
        const prev = new Map([[key(0, 0), null]]);
        const queue = [[0, 0]];
        let plan = null;
        while (queue.length) {
            const [mask, boat] = queue.shift();
            if (!plan && mask === full) {
                plan = [];
                for (let k = key(mask, boat); prev.get(k); k = prev.get(k).from) plan.unshift(prev.get(k).carry);
            }
            const here = boat ? mask : full & ~mask;
            for (const carry of subsets(here, data.seats)) {
                const nm = boat ? mask & ~carry : mask | carry;
                const nb = 1 - boat;
                if (unsafe(data, nm, nb) || prev.has(key(nm, nb))) continue;
                prev.set(key(nm, nb), { from: key(mask, boat), carry });
                queue.push([nm, nb]);
            }
        }
        return { plan, states: prev.size };
    }

    const bitsToIds = (data, bits) => data.cast.filter((_, i) => bits >> i & 1).map(c => c.id);

    function generate(rng, difficulty, opts) {
        const d = Math.max(1, Math.min(3, difficulty || 1));
        const shape = SHAPE[d];
        const o = opts || {};
        const known = id => !(Rift.data && Rift.data.creatures) || !!Rift.data.creatures[id];
        const mine = rng.shuffle((o.creatures || owned()).filter(known));
        const ids = [];
        mine.concat(FALLBACK.map(f => f.id)).forEach(id => { if (ids.length < shape.n && !ids.includes(id)) ids.push(id); });
        const cast = rng.shuffle(ids).map(id => ({ id, name: nameOf(id) }));
        const allPairs = [];
        for (let a = 0; a < cast.length; a++) for (let b = a + 1; b < cast.length; b++) allPairs.push([a, b]);
        for (let tries = 0; tries < 3000; tries++) {
            let rivals;
            if (d === 1) rivals = [[0, 1], [1, 2]];
            else rivals = rng.shuffle(allPairs).slice(0, rng.int(shape.pairs[0], shape.pairs[1])).map(p => p.slice());
            const data = { cast, seats: shape.seats, rivals };
            const found = search(data);
            if (!found.plan || found.plan.length < shape.min || found.plan.length > shape.max) continue;
            data.shortest = found.plan.length;
            data.states = found.states;
            data.toll = d === 3 ? found.plan.length : null;
            data.plan = found.plan.map(bits => bitsToIds(data, bits));
            return data;
        }
        throw new Error('river-crossing: no puzzle found');
    }

    // Plays the trips. Returns { mask, boat, trips, problem? } where problem says what went wrong.
    function play(data, trips) {
        let mask = 0;
        let boat = 0;
        const list = Array.isArray(trips) ? trips : [];
        for (let t = 0; t < list.length; t++) {
            const ids = Array.isArray(list[t]) ? list[t] : [];
            let carry = 0;
            for (const id of ids) {
                const i = data.cast.findIndex(c => c.id === id);
                if (i < 0 || (carry >> i & 1)) return { mask, boat, trips: t, problem: 'bad' };
                carry |= 1 << i;
            }
            if (ids.length > data.seats) return { mask, boat, trips: t, problem: 'seats' };
            const onBank = boat ? mask : ~mask;
            if ((carry & onBank) !== carry) return { mask, boat, trips: t, problem: 'bad' };
            mask = boat ? mask & ~carry : mask | carry;
            boat = 1 - boat;
            const clash = unsafe(data, mask, boat);
            if (clash) return { mask, boat, trips: t + 1, problem: 'clash', clash };
        }
        return { mask, boat, trips: list.length };
    }

    function check(data, answer) {
        const trips = (answer && answer.trips) || [];
        const r = play(data, trips);
        const full = (1 << data.cast.length) - 1;
        if (r.problem === 'clash') {
            const [a, b] = r.clash;
            const side = r.boat ? 'near' : 'far';
            return { solved: false, partial: 0, clash: r.clash.map(i => data.cast[i].id), feedback: data.cast[a].name + ' and ' + data.cast[b].name + ' were left alone on the ' + side + ' bank. They squabbled.' };
        }
        if (r.problem === 'seats') return { solved: false, partial: 0, feedback: 'The boat only seats ' + data.seats + ' besides you.' };
        if (r.problem) return { solved: false, partial: 0, feedback: 'You can only carry creatures from the bank you are on.' };
        if (data.toll && trips.length > data.toll) return { solved: false, partial: 0, feedback: 'The troll charges a toll. You only get ' + data.toll + ' crossings.' };
        if (r.mask !== full) {
            const across = data.cast.filter((_, i) => r.mask >> i & 1).length;
            return { solved: false, partial: across / data.cast.length, feedback: across + ' of ' + data.cast.length + ' are across. Keep going.' };
        }
        return { solved: true, feedback: 'Everyone across in ' + trips.length + ' crossings.' + (trips.length > data.shortest ? ' It can be done in ' + data.shortest + '.' : '') + ' A computer finds this by trying all ' + data.states + ' safe positions.' };
    }

    function hints(data) {
        const names = ids => ids.length ? ids.map(nameOf).join(' and ') : 'nobody';
        const count = {};
        data.rivals.forEach(([a, b]) => { count[a] = (count[a] || 0) + 1; count[b] = (count[b] || 0) + 1; });
        const busiest = data.cast[Object.keys(count).sort((x, y) => count[y] - count[x])[0]];
        const half = data.plan.slice(0, Math.max(2, Math.ceil(data.plan.length / 2)));
        return [
            busiest.name + ' has the most rivals. Plan around them. You may bring someone back.',
            'First crossing: take ' + names(data.plan[0]) + '.',
            'A plan that works starts: ' + half.map((ids, k) => (k % 2 ? 'back with ' : 'over with ') + names(ids)).join(', then ') + '.',
        ];
    }

    function why() {
        return {
            question: 'What makes your plan safe?',
            options: ['After every crossing, no two rivals are alone together on either bank.', 'Everyone reached the far bank in the end.', 'Nobody complained.', 'It used lots of crossings.'],
            correct: 0,
            explain: 'A plan is only as safe as its worst moment. Each step has to follow the rules, not just the ending.',
        };
    }

    function solve(data) { return { trips: data.plan.map(t => t.slice()) }; }

    function mount(container, data, api) {
        const el = api.el;
        let trips = [];
        let load = [];
        let done = false;
        const full = (1 << data.cast.length) - 1;
        const art = c => (Rift.Assets ? Rift.Assets.img('creature/' + c.id + '/idle', { label: c.name, className: 'rc-art', alt: c.name }) : null);

        const rivals = el('div.rc-rivals.panel', null, [el('strong', { text: 'Rivals (never leave them alone together):' })]
            .concat(data.rivals.map(([a, b]) => el('div.small', { text: data.cast[a].name + '  ✕  ' + data.cast[b].name }))));
        const info = el('div.small.rc-info');
        const near = el('div.rc-bank.rc-near');
        const far = el('div.rc-bank.rc-far');
        const boatBox = el('div.rc-boat');
        const water = el('div.rc-water', null, [boatBox]);
        const banks = el('div.rc-banks', null, [near, water, far]);
        const row = el('button.btn.primary.rc-row', { text: 'Row across', onclick: rowAcross });
        const tools = el('div.row.rc-tools', null, [
            row,
            el('button.btn.small', { text: 'Undo', onclick() { if (done || !trips.length) return; trips.pop(); load = []; render(); } }),
            el('button.btn.small', { text: 'Reset', onclick() { if (done) return; trips = []; load = []; render(); } }),
        ]);

        function state() { return play(data, trips); }
        function token(c, i, where) {
            const picked = load.includes(c.id);
            return el('button.rc-token' + (picked ? '.picked' : ''), { title: c.name, onclick() { toggle(c, where); } }, [art(c), el('span.small', { text: c.name })]);
        }
        function toggle(c, where) {
            if (done) return;
            const s = state();
            const onFar = !!(s.mask >> data.cast.indexOf(c) & 1);
            if (where !== 'boat' && onFar !== !!s.boat) { api.sfx('error'); info.textContent = 'You can only load creatures from your own bank.'; return; }
            if (load.includes(c.id)) load = load.filter(x => x !== c.id);
            else if (load.length >= data.seats) { api.sfx('error'); info.textContent = 'The boat seats ' + data.seats + ' besides you.'; return; }
            else load.push(c.id);
            api.sfx('click');
            render();
        }
        function rowAcross() {
            if (done) return;
            const next = trips.concat([load.slice()]);
            const r = play(data, next);
            api.sfx('place');
            if (r.problem === 'clash' || (data.toll && next.length > data.toll)) {
                api.submit({ trips: next }); // a wrong check: the encounter shows why
                info.textContent = r.problem === 'clash' ? 'Trip undone. Try a different crossing.' : 'Out of crossings. Start again.';
                if (r.problem !== 'clash') trips = [];
                load = [];
                render();
                return;
            }
            trips = next;
            load = [];
            render();
            if (r.mask === full) {
                const res = api.submit({ trips: trips.map(t => t.slice()) });
                if (res && res.solved) { done = true; container.querySelectorAll('.rc button').forEach(b => { b.disabled = true; }); }
            }
        }
        function render() {
            const s = state();
            near.innerHTML = '';
            far.innerHTML = '';
            boatBox.innerHTML = '';
            near.append(el('div.rc-label', { text: 'Near bank' }));
            far.append(el('div.rc-label', { text: 'Far bank' }));
            boatBox.append(el('div.rc-you.small', { text: 'You (rowing)' }));
            data.cast.forEach((c, i) => {
                if (load.includes(c.id)) { boatBox.append(token(c, i, 'boat')); return; }
                (s.mask >> i & 1 ? far : near).append(token(c, i, s.mask >> i & 1 ? 'far' : 'near'));
            });
            banks.classList.toggle('rc-at-far', !!s.boat);
            const left = data.toll ? ' · Toll: ' + Math.max(0, data.toll - trips.length) + ' left' : '';
            info.textContent = 'Crossings: ' + trips.length + left + ' · Boat seats ' + data.seats + ' besides you.';
        }

        container.append(el('div.rc', null, [rivals, banks, info, tools]));
        render();
        return { destroy() { done = true; } };
    }

    Rift.Puzzles.register({
        id: 'river-crossing',
        name: 'The Ford',
        colour: 'reason',
        family: 'Planning by rules',
        blurb: 'Row everyone across. Never leave two rivals alone together.',
        tok: 'A plan is a chain of steps. Every step must follow the rules, and a computer can check them all.',
        rules: [
            'Get every creature to the far bank. You row the boat.',
            'Click creatures on your bank to load the boat, then Row across. You may row back with someone, or alone.',
            'Never leave two rivals on a bank without you. An unsafe crossing counts as a wrong check.',
            'At the hardest level, the troll gives you only a set number of crossings. Undo and Reset are free.',
            'How to play is free. The Hint button shows its heart cost. Think first, then check your answer.',
        ],
        tutorial: [
            { text: 'Get everyone to the far bank. You row the boat, so you are always in it.', highlight: '.rc-banks' },
            { text: 'Some creatures are rivals. Never leave two rivals on a bank without you.', highlight: '.rc-rivals' },
            { text: 'Example, not this puzzle: A and B are rivals, and B and C are rivals. Take B over first. Later, bring B back. Going back is allowed.', highlight: '.rc-banks' },
            { text: 'Click creatures to load the boat, then Row across. An unsafe crossing counts as a wrong check.', highlight: '.rc-row' },
            { text: 'Undo and Reset are free. How to play is free. The Hint button shows its heart cost. Think first, then check your answer.', highlight: '.rc-tools' },
        ],
        generate, check, hints, why, solve, mount,
        _search: search, _play: play,
    });
})(typeof window !== 'undefined' ? window : globalThis);
