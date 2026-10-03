/*
 * Witness: read (or watch) a short scene, then mark claims True / False /
 * Can't tell. Teaches the gap between what we observe and what we infer.
 * Colour: Sense perception. Scenes are original (inspired by the classic
 * "uncritical inference" exercise from the Reason lesson).
 */
(function (root) {
    'use strict';

    const Rift = root.Rift;

    const SCENES = [
        {
            id: 'bakery',
            lines: ['Just before closing, the baker switched off the oven.', 'A tall figure in a hood came in and asked for the last loaf.', 'The baker wrapped it.', 'Coins clinked onto the counter.', 'The figure left, and the bell above the door rang.', 'A moment later, the baker\'s cat jumped onto the counter.'],
            claims: [
                { t: 'Someone came in after the oven was switched off.', a: 'T', why: 'The oven went off "just before closing", then the figure came in.' },
                { t: 'The hooded figure was a man.', a: 'U', why: 'We only know "a tall figure". Tall is not the same as male.' },
                { t: 'The hooded figure paid for the loaf.', a: 'U', why: 'Coins clinked, but the story never says who put them there, or what for.' },
                { t: 'The cat was on the counter before the figure left.', a: 'F', why: 'The cat jumped up "a moment later", after the figure left.' },
                { t: 'The bell rang when the figure left.', a: 'T', why: 'Stated directly.' },
                { t: 'The figure asked for the last loaf.', a: 'T', why: 'Stated directly.' },
                { t: 'The baker gave the loaf to the figure.', a: 'U', why: 'The baker wrapped it. We are never told it was handed over.' },
                { t: 'The shop was robbed.', a: 'U', why: 'Nothing in the story says so. Hoods make our minds jump.' },
            ],
        },
        {
            id: 'library',
            lines: ['The librarian turned off the main lights at six.', 'A student was still at the back table, reading by a desk lamp.', 'A loud thud came from the history section.', 'The student looked up.', 'A book lay open on the floor.', 'The window above the shelf was open.'],
            claims: [
                { t: 'The student was reading by a desk lamp.', a: 'T', why: 'Stated directly.' },
                { t: 'The wind knocked the book off the shelf.', a: 'U', why: 'The window was open, but we never learn what caused the fall.' },
                { t: 'The thud came from the history section.', a: 'T', why: 'Stated directly.' },
                { t: 'The book on the floor was a history book.', a: 'U', why: 'It lay on the floor, but we are not told what it was or where it came from.' },
                { t: 'All the lights in the library were off.', a: 'F', why: 'A desk lamp was on.' },
                { t: 'The librarian was in the room when the thud happened.', a: 'U', why: 'We only know the librarian turned off the main lights at six.' },
                { t: 'The student had stopped reading by the end of the story.', a: 'U', why: 'The student looked up. We don\'t know if they went back to reading.' },
            ],
        },
        {
            id: 'match',
            lines: ['The final whistle blew with the score at two-all.', 'A player in a red shirt fell to his knees.', 'The crowd in the north stand went silent.', 'In the south stand, people waved blue scarves and sang.', 'The referee walked towards the tunnel.'],
            claims: [
                { t: 'The match ended in a draw.', a: 'T', why: 'The final whistle blew at two-all.' },
                { t: 'The player in red was disappointed.', a: 'U', why: 'Falling to your knees could be despair, joy, exhaustion or cramp.' },
                { t: 'The blue team\'s fans were in the south stand.', a: 'U', why: 'People waved blue scarves; we\'re never told which team they support.' },
                { t: 'The north stand was silent at some point.', a: 'T', why: 'Stated directly.' },
                { t: 'The referee left the pitch.', a: 'U', why: 'The referee walked towards the tunnel. Not the same as leaving.' },
                { t: 'The score was three-two.', a: 'F', why: 'It was two-all.' },
                { t: 'The player in the red shirt was a man.', a: 'T', why: 'The story says "his knees".' },
            ],
        },
        {
            id: 'lab',
            lines: ['At 9:00 the beaker on the bench was full of clear liquid.', 'At 9:30 the teacher left the room to answer the phone.', 'At 9:40 the beaker was empty and the floor below it was wet.', 'Two students were standing near the bench.', 'One of them was holding a cloth.'],
            claims: [
                { t: 'The beaker was full at 9:00.', a: 'T', why: 'Stated directly.' },
                { t: 'A student knocked the beaker over.', a: 'U', why: 'The beaker was empty and the floor wet. We never see how.' },
                { t: 'The liquid was water.', a: 'U', why: 'Clear liquid is not necessarily water.' },
                { t: 'The teacher was out of the room at 9:30.', a: 'T', why: 'The teacher left at 9:30.' },
                { t: 'The student with the cloth was cleaning up the liquid.', a: 'U', why: 'Holding a cloth is not the same as cleaning with it.' },
                { t: 'The beaker was still full at 9:40.', a: 'F', why: 'It was empty at 9:40.' },
                { t: 'Exactly two students were in the room.', a: 'U', why: 'Two were near the bench. Others could be elsewhere in the room.' },
            ],
        },
        {
            id: 'fair',
            lines: ['At the fair, a fox in a green coat won the ring-toss game.', 'She was handed a large stuffed moon.', 'Ten minutes later, a moth was seen carrying a large stuffed moon past the carousel.', 'The fox was standing at the nut stall.'],
            claims: [
                { t: 'The fox won the ring-toss game.', a: 'T', why: 'Stated directly.' },
                { t: 'The moth took the fox\'s stuffed moon.', a: 'U', why: 'A large stuffed moon is not necessarily the same one.' },
                { t: 'The fox was wearing a green coat.', a: 'T', why: 'Stated directly.' },
                { t: 'The moth stole something.', a: 'U', why: 'Nothing says anything was stolen. Our minds love a story.' },
                { t: 'The fox was at the carousel ten minutes later.', a: 'U', why: 'She was "standing at the nut stall", but we\'re not told when.' },
                { t: 'The fox lost the ring-toss game.', a: 'F', why: 'She won it.' },
            ],
        },
        {
            id: 'graph',
            lines: ['A poster at the town hall shows a bar chart.', 'The bar for "This year" is twice as tall as the bar for "Last year".', 'The title says: "Village happiness is soaring!"', 'The vertical axis starts at 90.'],
            claims: [
                { t: 'The poster shows a bar chart.', a: 'T', why: 'Stated directly.' },
                { t: 'Happiness doubled since last year.', a: 'U', why: 'The bar is twice as tall, but the axis starts at 90. The real change could be tiny.' },
                { t: 'The vertical axis starts at zero.', a: 'F', why: 'It starts at 90.' },
                { t: 'The title claims happiness is rising.', a: 'T', why: '"Soaring" is a claim of rising, whatever the data shows.' },
                { t: 'The village is happier this year than last year.', a: 'U', why: 'The bar is taller, but we don\'t know how happiness was measured, or by whom.' },
                { t: 'The chart was made by the mayor.', a: 'U', why: 'We only know where the poster is.' },
            ],
        },
    ];

    const LABELS = { T: 'True', F: 'False', U: "Can't tell" };

    function generate(rng, difficulty) {
        const scene = rng.pick(SCENES);
        const n = Math.min(scene.claims.length, 4 + difficulty);
        // Always include at least one of each answer so guessing "can't tell" for everything fails.
        const byA = { T: [], F: [], U: [] };
        scene.claims.forEach((c, i) => byA[c.a].push(i));
        const picked = new Set(['T', 'F', 'U'].filter(a => byA[a].length).map(a => rng.pick(byA[a])));
        rng.shuffle(scene.claims.map((_, i) => i)).forEach(i => { if (picked.size < n) picked.add(i); });
        return {
            scene: scene.id,
            lines: scene.lines,
            hideAfter: difficulty >= 3 ? 25 : 0,
            claims: rng.shuffle([...picked]).map(i => ({ id: scene.id + ':' + i, t: scene.claims[i].t, a: scene.claims[i].a, why: scene.claims[i].why })),
        };
    }

    function check(data, answer) {
        const a = answer || {};
        const wrong = data.claims.filter(c => a[c.id] !== c.a);
        const right = data.claims.length - wrong.length;
        if (!wrong.length) return { solved: true, feedback: 'Every claim judged on the evidence alone. Sharp eyes.' };
        const w = wrong[0];
        const missing = data.claims.filter(c => !a[c.id]).length;
        return {
            solved: false,
            partial: right / data.claims.length,
            feedback: missing ? 'Judge every claim first (' + missing + ' left).' : right + ' of ' + data.claims.length + ' right. Look again at: "' + w.t + '"',
        };
    }

    function hints(data) {
        const u = data.claims.find(c => c.a === 'U');
        const f = data.claims.find(c => c.a === 'F');
        return [
            'Only mark True if the scene SAYS it. If you had to assume anything, it\'s "Can\'t tell".',
            f ? 'One claim directly contradicts the scene. Find the line that disagrees with it.' : 'Check each claim against one specific line.',
            u ? '"' + u.t + '" → ' + u.why : 'Read the claims slowly.',
        ];
    }

    function why(data) {
        const u = data.claims.find(c => c.a === 'U') || data.claims[0];
        return {
            question: 'Why is "' + u.t + '" a "Can\'t tell"?',
            options: [u.why, 'Because the story is fiction, so nothing in it can be known.', 'Because most people would guess it is true.', 'Because only experts can judge witness statements.'],
            correct: 0,
            explain: 'Observation gives us the lines of the scene. Everything else is inference, and inference can be wrong.',
        };
    }

    function solve(data) {
        const out = {};
        data.claims.forEach(c => { out[c.id] = c.a; });
        return out;
    }

    function mount(container, data, api) {
        const el = api.el;
        const answers = {};
        const scene = el('div.wit-scene.parchment', null, data.lines.map(l => el('p', { text: l })));
        const claims = el('div.wit-claims');
        const submit = el('button.btn.primary', { text: 'Give my testimony', onclick: () => api.submit(Object.assign({}, answers)) });
        data.claims.forEach(c => {
            const row = el('div.wit-claim.panel', null, [el('div.wit-text', { text: c.t })]);
            const btns = el('div.row.wit-btns');
            ['T', 'F', 'U'].forEach(k => {
                btns.append(el('button.btn.small', {
                    text: LABELS[k],
                    dataset: { k },
                    onclick() {
                        answers[c.id] = k;
                        btns.querySelectorAll('button').forEach(b => b.classList.toggle('picked', b.dataset.k === k));
                        api.sfx('place');
                    },
                }));
            });
            row.append(btns);
            claims.append(row);
        });
        container.append(el('div.wit', null, [scene, el('div.stack', null, [claims, submit])]));
        let timer = null;
        let remaining = data.hideAfter * 1000;
        let started = 0;
        let stopped = false;
        const note = data.hideAfter ? el('div.small.muted', { text: 'The scene fades after ' + data.hideAfter + ' seconds of play. Help pauses the clock.' }) : null;
        function pause() {
            if (!timer) return;
            clearTimeout(timer);
            timer = null;
            remaining = Math.max(0, remaining - (Date.now() - started));
        }
        function resume() {
            if (stopped || timer || !data.hideAfter || scene.classList.contains('faded')) return;
            started = Date.now();
            timer = setTimeout(() => { timer = null; scene.classList.add('faded'); note.textContent = 'The scene has faded. Trust what you saw, not what you imagine.'; }, remaining);
        }
        if (data.hideAfter) {
            scene.append(note);
            resume();
        }
        return { pause, resume, destroy() { stopped = true; clearTimeout(timer); } };
    }

    Rift.Puzzles.register({
        id: 'witness',
        name: "Madame Mirage's Witness",
        colour: 'perception',
        family: 'Seeing vs knowing',
        blurb: 'Read the scene. Then judge each claim: True, False, or Can\'t tell.',
        tok: 'What we observe and what we infer feel the same from the inside. Knowledge needs us to tell them apart.',
        generate, check, hints, why, solve, mount,
    });
})(typeof window !== 'undefined' ? window : globalThis);
