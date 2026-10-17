/*
 * Trick challenges of the roaming legendaries (#111, design/ROAMING-LEGENDARIES.md). Pure, no DOM.
 *
 *   const run = Rift.Tricks.make('maskip', seed);   → { id, rounds: [round, round, round] }
 *   Rift.Tricks.check(round, optionId)              → { ok, why }
 *
 * A round: { key, sign, scene, options: [{ id, label, sub? }], accept: [ids], why }.
 * - sign: the instruction on the creature's plaque. It changes between rounds; that is the trick.
 * - scene: the evidence to show (kind 'lanterns' | 'records' | 'keys' | 'log' | 'doors'). Every answer
 *   follows from the scene and the sign alone: no hidden outcomes, no speed, no colour-only cues.
 * - accept: every valid option (Maskip's "exactly one" round has two).
 * - why: one or two plain sentences that explain the rule a wrong answer missed.
 * The same seed always gives the same run, so a reload shows the same rounds.
 */
(function (root) {
    'use strict';

    const Rift = root.Rift;
    const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

    // ---- Unit 2: Maskip, the lantern imp (AND, exactly one, judge a claim) ---------------------------

    const lamp = on => (on ? 'on' : 'off');
    const pairText = p => 'left ' + lamp(p.left) + ', right ' + lamp(p.right);
    const CLAIMS = {
        both: { text: 'has both lanterns on', test: p => p.left && p.right },
        one: { text: 'has exactly one lantern on', test: p => p.left !== p.right },
        neither: { text: 'has no lantern on', test: p => !p.left && !p.right },
        some: { text: 'has at least one lantern on', test: p => p.left || p.right },
    };

    function maskip(rng) {
        const pairs = rng.shuffle([[1, 1], [1, 0], [0, 1], [0, 0]]).map((lr, i) => ({ id: LETTERS[i], name: 'Pair ' + LETTERS[i], left: !!lr[0], right: !!lr[1] }));
        const options = () => pairs.map(p => ({ id: p.id, label: p.name, sub: pairText(p) }));
        const scene = extra => Object.assign({ kind: 'lanterns', pairs: pairs.map(p => Object.assign({}, p)) }, extra || {});
        const both = pairs.filter(CLAIMS.both.test), one = pairs.filter(CLAIMS.one.test);

        const kind = rng.pick(Object.keys(CLAIMS));
        const truth = rng.chance(0.5);
        const target = rng.pick(pairs.filter(p => !!CLAIMS[kind].test(p) === truth));
        const claim = target.name + ' ' + CLAIMS[kind].text + '.';
        return [
            {
                key: 'both', sign: 'Pick the pair with BOTH lanterns on.', scene: scene(), options: options(),
                accept: both.map(p => p.id),
                why: 'Both means the left one AND the right one are on. Only ' + both[0].name + ' has that.',
            },
            {
                key: 'exactly-one', sign: 'The sign changed! Pick a pair with EXACTLY ONE lantern on.', scene: scene(), options: options(),
                accept: one.map(p => p.id),
                why: 'Exactly one means one on and one off. ' + one[0].name + ' and ' + one[1].name + ' both count. Both on is two, not one.',
            },
            {
                key: 'claim', sign: 'Is the mask\'s claim true or false? Check the lanterns.', scene: scene({ claim, target: target.id }),
                options: [{ id: 'true', label: 'True' }, { id: 'false', label: 'False' }],
                accept: [truth ? 'true' : 'false'],
                why: target.name + ' is ' + pairText(target) + '. So the claim is ' + (truth ? 'true' : 'false') + '. A confident mask is not evidence; the lanterns are.',
            },
        ];
    }

    // ---- Unit 3: Quibblequill, the evidence ferret (counterexample, supported claim, converse) -------

    function quibblequill(rng) {
        const numbers = rng.shuffle([12, 17, 23, 31, 38, 44, 52, 59, 66, 73]);
        const shape = [];
        const confirming = rng.int(2, 3);
        for (let i = 0; i < confirming; i++) shape.push({ stamped: true, arrived: true });
        shape.push({ stamped: true, arrived: false, counter: true });
        shape.push({ stamped: false, arrived: false });
        if (rng.chance(0.5)) shape.push({ stamped: false, arrived: true });
        const records = rng.shuffle(shape).map((r, i) => Object.assign({ id: 'p' + numbers[i], name: 'Parcel ' + numbers[i] }, r));
        const counter = records.find(r => r.counter);
        const arrivedStamped = records.filter(r => r.stamped && r.arrived).length;
        const recSub = r => (r.stamped ? 'stamped' : 'no stamp') + ' · ' + (r.arrived ? 'arrived' : 'not arrived yet');
        const recScene = claim => ({ kind: 'records', claim, records: records.map(r => ({ id: r.id, name: r.name, stamped: r.stamped, arrived: r.arrived })) });

        const claims = rng.shuffle([
            { id: 'some', label: 'At least ' + arrivedStamped + ' stamped parcels have arrived.', ok: true },
            { id: 'every', label: 'Every stamped parcel has arrived.' },
            { id: 'all-stamped', label: 'Every parcel has a stamp.' },
            { id: 'first', label: 'Stamped parcels always arrive first.' },
        ]);

        const material = rng.pick(['brass', 'silver', 'iron']);
        const door = rng.pick(['archive', 'vault', 'attic']);
        const key = 'Key ' + rng.pick(['7', '9', '14', '21']);
        return [
            {
                key: 'counterexample', sign: 'Pick the ONE record that proves the claim false.',
                scene: recScene('Every stamped parcel has arrived.'),
                options: records.map(r => ({ id: r.id, label: r.name, sub: recSub(r) })),
                accept: [counter.id],
                why: counter.name + ' is stamped but has not arrived. One case like that breaks an "every" claim. A parcel with no stamp says nothing about stamped ones.',
            },
            {
                key: 'supported', sign: 'New task! Pick the claim these records SUPPORT.',
                scene: recScene(null),
                options: claims.map(c => ({ id: c.id, label: c.label })),
                accept: ['some'],
                why: 'The records show ' + arrivedStamped + ' stamped parcels that arrived, so "at least ' + arrivedStamped + '" is supported. '
                    + counter.name + ' breaks the "every" claim, and nothing in the records says which parcel came first.',
            },
            {
                key: 'converse', sign: 'Pick the claim that does NOT follow from the rule.',
                scene: { kind: 'keys', rule: 'Every ' + door + ' key is ' + material + '.', record: key + ': ' + material + '. Tried on the ' + door + ' door: it did NOT open.' },
                options: rng.shuffle([
                    { id: 'converse', label: 'Every ' + material + ' key opens the ' + door + '.' },
                    { id: 'instance', label: 'If a key opens the ' + door + ', it is ' + material + '.' },
                    { id: 'contra', label: 'A key that is not ' + material + ' cannot be ' + (/^[aeiou]/.test(door) ? 'an ' : 'a ') + door + ' key.' },
                ]),
                accept: ['converse'],
                why: 'The rule goes one way: ' + door + ' key, so ' + material + '. It does not go back. ' + key + ' is ' + material + ' and did not open the ' + door + '.',
            },
        ];
    }

    // ---- Unit 4: Oddsnap, the probability gremlin (least likely, most likely, likely is not certain) -

    const SHAPES = [
        { id: 'triangle', name: 'Triangle', icon: '▲' },
        { id: 'circle', name: 'Circle', icon: '●' },
        { id: 'square', name: 'Square', icon: '■' },
    ];
    const LOGS = [[6, 3, 1], [5, 4, 1], [5, 3, 2], [7, 2, 1], [4, 5, 1], [6, 1, 3]];

    function log(counts) {
        const total = counts.reduce((a, b) => a + b, 0);
        const top = Math.max(...counts);
        return {
            kind: 'log', total,
            shapes: SHAPES.map((s, i) => ({ id: s.id, name: s.name, icon: s.icon, count: counts[i], pct: Math.round(100 * counts[i] / total), glow: counts[i] === top })),
        };
    }
    const shapeOptions = () => SHAPES.map(s => ({ id: s.id, label: s.icon + ' ' + s.name }));

    function oddsnap(rng) {
        // Round 1: the least likely. Distinct counts, so exactly one shape is lowest.
        const first = rng.shuffle(rng.pick(LOGS).slice());
        const least = SHAPES[first.indexOf(Math.min(...first))];
        // Round 2: the most likely in a new log. Round 1's answer is now the LEAST likely, so repeating
        // either the old shape or the old rule fails; only reading the new sign works.
        const second = rng.shuffle(rng.pick(LOGS).slice());
        const low = second.indexOf(Math.min(...second)), mine = SHAPES.indexOf(least);
        [second[low], second[mine]] = [second[mine], second[low]];
        const most = SHAPES[second.indexOf(Math.max(...second))];
        const one = log(first), two = log(second);
        const pct = (l, s) => l.shapes.find(x => x.id === s.id).pct;
        // Round 3: three doors, all below 100%.
        const odds = rng.shuffle([95, 90, 80, 70, 60, 50]).slice(0, 3).sort((a, b) => b - a);
        const doors = rng.shuffle(odds.map(p => ({ pct: p }))).map((d, i) => ({ id: 'door-' + LETTERS[i], name: 'Door ' + LETTERS[i], pct: d.pct }));
        return [
            {
                key: 'least', sign: 'The machine predicts from its log. Pick its LEAST likely next shape.', scene: one, options: shapeOptions(),
                accept: [least.id],
                why: least.name + ' came up only ' + first[SHAPES.indexOf(least)] + ' times out of ' + one.total + ', so the model gives it ' + pct(one, least) + '%. The glowing shape is the MOST likely one.',
            },
            {
                key: 'most', sign: 'New log! Now pick the MOST likely next shape.', scene: two, options: shapeOptions(),
                accept: [most.id],
                why: 'The sign asked for the MOST likely this time. ' + most.name + ' has the biggest count, ' + second[SHAPES.indexOf(most)] + ' out of ' + two.total + ' (' + pct(two, most) + '%).',
            },
            {
                key: 'guarantee', sign: 'Pick a door that is GUARANTEED safe.', scene: { kind: 'doors', doors },
                options: doors.map(d => ({ id: d.id, label: d.name, sub: d.pct + '% safe' })).concat([{ id: 'none', label: 'No door is guaranteed safe' }]),
                accept: ['none'],
                why: 'Guaranteed means 100%. Every door is below 100%, so none is guaranteed. Even ' + odds[0] + '% safe still fails sometimes.',
            },
        ];
    }

    const MAKERS = { maskip, quibblequill, oddsnap };

    function make(id, seed) {
        const maker = MAKERS[id];
        if (!maker) return null;
        const rounds = maker(Rift.makeRng('trick:' + id + ':' + String(seed)));
        return { id, rounds };
    }

    function check(round, optionId) {
        const ok = !!round && round.accept.includes(optionId);
        return { ok, why: ok ? null : round && round.why };
    }

    Rift.Tricks = { make, check, ids: () => Object.keys(MAKERS) };
})(typeof window !== 'undefined' ? window : globalThis);
