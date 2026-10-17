/*
 * Trick challenges of the roaming legendaries (#111, design/ROAMING-LEGENDARIES.md). Pure, no DOM.
 *
 *   const run = Rift.Tricks.make('maskip', seed);   → { id, rounds: [round × ROUNDS] }
 *   Rift.Tricks.check(round, answer)                → { ok, why }
 *
 * The teacher wants these hard, a meme, in the spirit of the old Flash "idiot test" games (#111,
 * research/roaming-legendary-trick-challenges-2026-10-11.md): their trick TYPES, pacing and instant
 * reset, with our own original questions. A run is ROUNDS rounds drawn from the creature's bank:
 * half from its own TOK tricks, half from the shared troll tricks dressed in its theme. The same seed
 * always gives the same run, so a reload shows the same rounds; a new attempt draws a new run.
 *
 * A round: { key, mode, sign, signLink?, scene?, options, accept, why, seconds? }
 *   seconds on a 'tap' or 'number' round: a quick-action clock. When it runs out the answer is
 *   TIMEOUT, which fails. Clocks are generous (6+ seconds): they ask for focus, not reflexes.
 *   mode 'pick'     choose one option, then Check.                answer: option id
 *        'multi'    choose every right option, then Check.        answer: [option ids] (order free)
 *        'tap'      the first click is the answer. No Check.     answer: option id
 *        'sequence' press options in order; a wrong press fails.  answer: [option ids] (order counts)
 *        'wait'     touch nothing until the timer ends.           answer: WAITED (any option fails)
 *        'number'   type a whole number, then Check.              answer: text
 *   options: [{ id, label, sub?, size?, place? }]. size 'xs'|'s'|'m'|'l'|'xl' (tap rounds) sets the
 *     button and its text. place 'sign' = a word inside the sign (signLink names it), 'portrait' = the
 *     creature's picture, 'title' = the challenge's name: hidden-in-plain-sight answers.
 *   accept: every valid answer (for multi and sequence: the one right list).
 *   why: one or two plain sentences that explain the trick a wrong answer fell for.
 * Fair by rule (tools/test/tricks.test.mjs): every answer follows from the sign and what is on screen.
 * No speed, no colour-only cues, no English puns, no trivia. A 'wait' round needs patience, not speed.
 */
(function (root) {
    'use strict';

    const Rift = root.Rift;
    // A gauntlet (teacher, 17 Oct 2026: "at least 10, maybe 15"): 12 rounds, a third of them the
    // creature's own TOK tricks, the rest shared troll tricks.
    const ROUNDS = 12;
    const OWN_PER_RUN = 4;
    const WAITED = '(waited)';
    const TIMEOUT = '(too slow)';   // the answer a timed round gives when its clock runs out
    const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

    // Each creature's look for the shared tricks.
    const SKINS = {
        maskip: { name: 'Maskip', icon: '💡', thing: 'lantern', a: 'wick', b: 'lantern', light: 'feathers', heavy: 'lanterns' },
        quibblequill: { name: 'Quibblequill', icon: '📜', thing: 'paper', a: 'stamp', b: 'quill', light: 'feathers', heavy: 'law books' },
        oddsnap: { name: 'Oddsnap', icon: '🎲', thing: 'die', a: 'die', b: 'crown', light: 'feathers', heavy: 'dice' },
    };

    const opt = (id, label, extra) => Object.assign({ id, label }, extra || {});

    // ---- shared troll tricks (the idiot-test family) -------------------------------------------------

    const SHARED = {
        // The answer is the tiny button nobody looks at.
        smallest(rng, k) {
            const sizes = rng.shuffle(['xs', 's', 'm', 'l', 'xl']);
            const options = sizes.map((size, i) => opt(LETTERS[i], k.icon, { size }));
            return { mode: 'tap', sign: 'Click the SMALLEST button.', options, accept: [options[sizes.indexOf('xs')].id],
                why: 'The smallest button was the tiny one. Look at the whole screen, not just the big buttons.' };
        },
        // Big print is not a big number.
        biggestNumber(rng) {
            const nums = rng.shuffle([3, 7, 12, 19, 40, 58, 86, 95]).slice(0, 5);
            const sorted = nums.slice().sort((x, y) => x - y);
            const size = n => ['xl', 'l', 'm', 's', 'xs'][sorted.indexOf(n)];   // the biggest number in the smallest print
            const options = nums.map((n, i) => opt(LETTERS[i], String(n), { size: size(n) }));
            const top = sorted[sorted.length - 1];
            return { mode: 'tap', sign: 'Click the BIGGEST number.', options, accept: [options[nums.indexOf(top)].id],
                why: 'Big writing is not a big number. ' + top + ' is the biggest number, even in tiny print.' };
        },
        // Read the words on the buttons, not the words you expect.
        blank(rng) {
            const options = rng.shuffle([opt('nothing', 'Nothing'), opt('empty', '(empty)'), opt('blank', ''), opt('none', 'No words'), opt('dots', '…')]);
            return { mode: 'tap', sign: 'Click the button with NOTHING written on it.', options, accept: ['blank'],
                why: '"Nothing", "(empty)", "No words" and "…" are all written on their buttons. One button had nothing on it at all.' };
        },
        // Restraint is the answer.
        dontTouch(rng, k) {
            const seconds = rng.int(5, 7);
            const options = rng.shuffle([opt('win', 'Click to win!'), opt('next', 'Next ▶'), opt('skip', 'Skip this round'), opt('help', '? Help'), opt('thing', k.icon + ' Pet the ' + k.thing)]);
            return { mode: 'wait', seconds, sign: 'Do NOT touch any button until the timer ends.', options, accept: [WAITED],
                why: 'The sign said: do not touch anything. Sometimes the right move is to do nothing at all.' };
        },
        // The sign itself holds the answer.
        clickHere(rng) {
            const options = rng.shuffle([opt('go', 'Go on ▶'), opt('cont', 'Continue'), opt('ok', 'OK'), opt('here', 'here', { place: 'sign' })]);
            return { mode: 'tap', sign: 'To go on, click here.', signLink: 'here', options, accept: ['here'],
                why: 'The sign said "click here". The word "here" in the sign was the button.' };
        },
        // The creature was on screen the whole time.
        findMe(rng, k) {
            const options = rng.shuffle([opt('hiding', k.name + ' is hiding'), opt('map', 'On the map'), opt('behind', 'Behind the sign'), opt('portrait', k.name, { place: 'portrait' })]);
            return { mode: 'tap', sign: 'Click ' + k.name + '.', options, accept: ['portrait'],
                why: k.name + ' was in the top corner the whole time. The buttons only talked ABOUT ' + k.name + '.' };
        },
        // The title is a target too.
        clickTitle(rng) {
            const options = rng.shuffle([opt('a', 'The challenge'), opt('b', 'This one'), opt('c', 'The name'), opt('title', 'title', { place: 'title' })]);
            return { mode: 'tap', sign: 'Click the NAME of this challenge.', options, accept: ['title'],
                why: 'The challenge\'s name is written at the very top, next to the creature. That was the answer.' };
        },
        // The word is not its meaning.
        letters(rng) {
            const word = rng.pick([['five', 4], ['three', 5], ['nine', 4], ['eleven', 6], ['seven', 5], ['one', 3], ['twelve', 6]]);
            return { mode: 'number', sign: 'How many LETTERS are in the word "' + word[0] + '"?', options: [], accept: [String(word[1])],
                why: 'Count the letters, not the number the word means: "' + word[0] + '" has ' + word[1] + ' letters.' };
        },
        // Two NOTs cancel.
        notNot(rng) {
            const options = rng.shuffle([opt('yes', '✔ Yes'), opt('no', '✖ No'), opt('maybe', '? Maybe')]);
            const v = rng.pick([
                { sign: 'Do NOT click a button that is NOT "✔ Yes".', accept: 'yes' },
                { sign: 'Do NOT NOT click "✖ No".', accept: 'no' },
                { sign: 'Click a button, but NOT one that is NOT "? Maybe".', accept: 'maybe' },
            ]);
            return { mode: 'tap', sign: v.sign, options, accept: [v.accept],
                why: 'Two NOTs cancel out. "Do not click a button that is not X" means: click X.' };
        },
        // Backwards.
        reverse(rng) {
            const n = rng.int(4, 5);
            const nums = rng.shuffle(Array.from({ length: n }, (_, i) => i + 1));
            const options = nums.map(v => opt('n' + v, String(v), { size: 'l' }));
            return { mode: 'sequence', sign: 'Press the numbers 1 to ' + n + ' in REVERSE order.', options,
                accept: [Array.from({ length: n }, (_, i) => 'n' + (n - i))],
                why: 'Reverse means backwards: ' + Array.from({ length: n }, (_, i) => n - i).join(', ') + '.' };
        },
        // Below zero.
        smallToBig(rng) {
            const nums = rng.shuffle(rng.pick([[-3, 0, 2, 10], [-7, -1, 4, 6], [0, -2, 5, -10], [12, -12, 1, -1]]).slice());
            const sorted = nums.slice().sort((x, y) => x - y);
            const options = nums.map(v => opt('v' + v, String(v).replace('-', '−'), { size: 'l' }));
            return { mode: 'sequence', sign: 'Press the numbers from SMALLEST to BIGGEST.', options, accept: [sorted.map(v => 'v' + v)],
                why: 'A minus number is smaller than zero, and the further below zero, the smaller. In order: ' + sorted.join(', ').replace(/-/g, '−') + '.' };
        },
        // Odd one out, both ways.
        oddOne(rng) {
            const evens = rng.shuffle([2, 4, 6, 8, 10, 12, 14, 16]).slice(0, 4);
            const odd = rng.pick([5, 7, 9, 11, 13]);
            const nums = rng.shuffle(evens.concat([odd]));
            const options = nums.map((v, i) => opt(LETTERS[i], String(v)));
            return { mode: 'tap', sign: 'Click the ODD one out.', options, accept: [options[nums.indexOf(odd)].id],
                why: 'Every other number is even. ' + odd + ' is the odd one out, in both senses.' };
        },
        // Corners.
        corners(rng) {
            const q = rng.pick([
                { sign: 'How many corners does a circle have?', a: 0, why: 'A circle has no corners at all: 0.' },
                { sign: 'A square has 4 corners. You cut off ONE corner with one straight cut. How many corners does the shape have now?', a: 5, why: 'The cut removes one corner but makes two new ones: 4 − 1 + 2 = 5.' },
                { sign: 'How many corners do three circles have, all together?', a: 0, why: 'Circles have no corners. Three times zero is still 0.' },
            ]);
            return { mode: 'number', sign: q.sign, options: [], accept: [String(q.a)], why: q.why };
        },
        // See the shape, ignore the word.
        shapeNotWord(rng) {
            const shapes = [['triangle', '▲', 'Triangle'], ['square', '■', 'Square'], ['circle', '●', 'Circle']];
            const [seen, read] = rng.shuffle(shapes.slice()).slice(0, 2);
            return { mode: 'tap', sign: 'Click the SHAPE you SEE, not the word you read.', scene: { kind: 'shapeword', icon: seen[1], word: read[2].toUpperCase() },
                options: rng.shuffle(shapes.map(s => opt(s[0], s[1] + ' ' + s[2]))), accept: [seen[0]],
                why: 'The shape was a ' + seen[2].toLowerCase() + '. The word inside it said ' + read[2].toUpperCase() + ' to fool you.' };
        },
        // Now the other way round.
        wordNotShape(rng) {
            const shapes = [['triangle', '▲', 'Triangle'], ['square', '■', 'Square'], ['circle', '●', 'Circle']];
            const [seen, read] = rng.shuffle(shapes.slice()).slice(0, 2);
            return { mode: 'tap', sign: 'This time: click the WORD you READ, not the shape you see.', scene: { kind: 'shapeword', icon: seen[1], word: read[2].toUpperCase() },
                options: rng.shuffle(shapes.map(s => opt(s[0], s[1] + ' ' + s[2]))), accept: [read[0]],
                why: 'The word said ' + read[2].toUpperCase() + '. The shape was only the decoy this time.' };
        },
        // The quick answer is wrong.
        cost(rng, k) {
            const small = rng.pick([5, 10, 15, 20]), more = rng.pick([100, 50]);
            const total = 2 * small + more;
            return { mode: 'number', sign: 'A ' + k.b + ' and a ' + k.a + ' cost ' + total + ' coins together. The ' + k.b + ' costs ' + more + ' coins MORE than the ' + k.a + '. How many coins is the ' + k.a + '?',
                options: [], accept: [String(small)],
                why: 'Not ' + (total - more) + '! If the ' + k.a + ' is ' + small + ', the ' + k.b + ' is ' + (small + more) + ', and together they make ' + total + '.' };
        },
        // A kilo is a kilo.
        heavier(rng, k) {
            const options = rng.shuffle([opt('light', 'The ' + k.light), opt('heavy', 'The ' + k.heavy), opt('same', 'They weigh the same')]);
            return { mode: 'tap', sign: 'Which is heavier: one kilogram of ' + k.light + ' or one kilogram of ' + k.heavy + '?', options, accept: ['same'],
                why: 'Both are one kilogram. A kilogram of anything weighs a kilogram.' };
        },
        // Every month counts.
        months(rng) {
            const q = rng.pick([
                { sign: 'How many months of the year have at least 28 days?', a: 12, why: 'Every month has at least 28 days, so all 12 do.' },
                { sign: 'How many months of the year have at least 30 days?', a: 11, why: 'Every month except February has 30 days or more: 11 months.' },
            ]);
            return { mode: 'number', sign: q.sign, options: [], accept: [String(q.a)], why: q.why };
        },
        // Zero is even.
        evens(rng) {
            const nums = rng.shuffle([0, 2, 3, 7, 10, 15, 18, 21]).slice(0, 6);
            if (!nums.includes(0)) nums[rng.int(0, 5)] = 0;
            const options = nums.map(v => opt('v' + v, String(v)));
            return { mode: 'multi', sign: 'Select EVERY even number. Then press Check.', options, accept: [nums.filter(v => v % 2 === 0).map(v => 'v' + v)],
                why: 'Even numbers split into two equal halves, and 0 counts: 0 is even.' };
        },
        // The round counter is evidence too.
        rounds() {
            return { mode: 'number', sign: 'How many rounds does this challenge have? Type the number.', options: [], accept: [String(ROUNDS)],
                why: 'Count the little circles at the top: this challenge has ' + ROUNDS + ' rounds.' };
        },
        // Exactly what it says.
        pressTimes(rng, k) {
            const n = rng.pick([2, 3, 4]);
            const words = { 2: 'TWO', 3: 'THREE', 4: 'FOUR' };
            const options = rng.shuffle([opt('it', k.icon + ' This one', { size: 'l' }), opt('other', 'Not this one', { size: 'l' })]);
            return { mode: 'sequence', sign: 'Press "' + k.icon + ' This one" exactly ' + words[n] + ' times.', options, accept: [Array(n).fill('it')],
                why: 'The sign asked for ' + words[n].toLowerCase() + ' presses of the same button.' };
        },
    };

    // ---- more shared tricks: quick action, reading, counting (17 Oct 2026, "about 50 puzzles") -------

    Object.assign(SHARED, {
        // Quick action: read every button before the clock runs out.
        quickGo(rng) {
            const options = rng.shuffle([opt('go', 'GO'), opt('og', 'OG'), opt('goo', 'GOO'), opt('gone', 'GONE'), opt('ago', 'AGO')]);
            return { mode: 'tap', seconds: 6, sign: 'Quick! Click GO before the clock runs out.', options, accept: ['go'],
                why: 'Only one button said exactly GO. The others were OG, GOO, GONE and AGO. Fast is fine, but read first.' };
        },
        // Quick count.
        quickCount(rng, k) {
            const n = rng.int(7, 11);
            return { mode: 'number', seconds: 12, sign: 'Quick! How many ' + k.icon + ' are there?', scene: { kind: 'icons', icon: k.icon, count: n }, options: [], accept: [String(n)],
                why: 'There were ' + n + '. Count in small groups so you do not lose your place.' };
        },
        // Quick: do exactly as told.
        quickPress(rng, k) {
            const options = rng.shuffle([opt('stop', '⏹ Stop'), opt('wait', '⏸ Wait'), opt('go', '▶ Go'), opt('it', k.icon)]);
            return { mode: 'tap', seconds: 6, sign: 'Quick! Click the button that is NOT a word.', options, accept: ['it'],
                why: 'Stop, Wait and Go are all words. The ' + k.icon + ' button had no word on it.' };
        },
        // The second from the left.
        secondLeft(rng) {
            const labels = rng.shuffle(['Second', 'First', 'Left', 'Right']);
            const options = labels.map((l, i) => opt(LETTERS[i], l, { size: 'l' }));
            return { mode: 'tap', sign: 'Click the button that is SECOND from the LEFT.', options, accept: [options[1].id],
                why: 'Count from the left: the second button said "' + labels[1] + '". The words on the buttons were there to trick you.' };
        },
        // Last letter.
        lastLetter(rng) {
            const letters = rng.shuffle(['M', 'Q', 'T', 'R', 'D', 'K', 'W']).slice(0, 4);
            const last = letters.slice().sort().pop();
            const options = letters.map((l, i) => opt('l' + l, l, { size: ['xl', 'l', 'm', 's'][i] }));
            return { mode: 'tap', sign: 'Click the letter that comes LAST in the alphabet.', options, accept: ['l' + last],
                why: 'In alphabet order the letters were ' + letters.slice().sort().join(', ') + ', so ' + last + ' comes last. Size does not matter.' };
        },
        // Everything except one.
        allBut(rng, k) {
            const pool = rng.shuffle(['⭐', '🌙', '☀', '☁', '❄', '🔥']).slice(0, 5);
            const odd = pool[0];
            const options = rng.shuffle(pool.map((s, i) => opt('s' + i, s, { size: 'l' })));
            return { mode: 'multi', sign: 'Select EVERY button EXCEPT the ' + odd + '. Then press Check.', options,
                accept: [options.filter(o => o.label !== odd).map(o => o.id)],
                why: '"Every button except ' + odd + '" means all the others: ' + (options.length - 1) + ' buttons.' };
        },
        // Digits or words.
        notDigits(rng) {
            const word = rng.pick([['four', 4], ['seven', 7], ['two', 2], ['nine', 9]]);
            const nums = rng.shuffle([1, 3, 5, 6, 8].filter(n => n !== word[1])).slice(0, 3);
            const options = rng.shuffle(nums.map(n => opt('d' + n, String(n), { size: 'l' })).concat([opt('word', word[0], { size: 's' })]));
            return { mode: 'tap', sign: 'Click the number that is NOT written in digits.', options, accept: ['word'],
                why: '"' + word[0] + '" is a number written as a word. The others were digits.' };
        },
        // Times before plus.
        order(rng) {
            const a = rng.int(2, 5), b = rng.int(2, 4), c = rng.int(2, 4);
            return { mode: 'number', sign: 'What is ' + a + ' + ' + b + ' × ' + c + '?', options: [], accept: [String(a + b * c)],
                why: 'Multiply first: ' + b + ' × ' + c + ' = ' + b * c + ', then add ' + a + ': ' + (a + b * c) + '. Not ' + (a + b) * c + '.' };
        },
        // Fence posts.
        posts(rng) {
            const gaps = rng.int(4, 9);
            return { mode: 'number', sign: 'A straight fence has ' + gaps + ' gaps between its posts. How many posts are there?', scene: { kind: 'icons', icon: '┃', count: gaps + 1, gapped: true }, options: [], accept: [String(gaps + 1)],
                why: 'There is always one more post than gaps: ' + gaps + ' gaps need ' + (gaps + 1) + ' posts. Count them in the picture.' };
        },
        // Halves and quarters.
        smallerDecimal(rng) {
            const pair = rng.pick([['0.5', '0.25'], ['0.3', '0.25'], ['0.7', '0.65'], ['0.4', '0.35']]);
            const options = rng.shuffle([opt('a', pair[0], { size: 'l' }), opt('b', pair[1], { size: 'l' }), opt('same', 'They are equal')]);
            return { mode: 'tap', sign: 'Click the SMALLER number.', options, accept: ['b'],
                why: pair[1] + ' is smaller than ' + pair[0] + '. More digits do not make a bigger number.' };
        },
        // Legs.
        legs(rng) {
            const sp = rng.int(1, 3), cats = rng.int(1, 3), birds = rng.int(0, 2);
            const total = sp * 8 + cats * 4 + birds * 2;
            return { mode: 'number', sign: 'A spider has 8 legs, a cat 4 and a bird 2. How many legs do ' + sp + ' spider' + (sp > 1 ? 's' : '') + ', ' + cats + ' cat' + (cats > 1 ? 's' : '') + ' and ' + birds + ' bird' + (birds === 1 ? '' : 's') + ' have?',
                options: [], accept: [String(total)],
                why: sp + ' × 8 + ' + cats + ' × 4 + ' + birds + ' × 2 = ' + total + '.' };
        },
        // Alphabet order.
        alphabetical(rng) {
            const letters = rng.shuffle(['B', 'D', 'A', 'C', 'F', 'E']).slice(0, 4);
            const options = letters.map(l => opt('l' + l, l, { size: 'l' }));
            return { mode: 'sequence', sign: 'Press the letters in ALPHABET order.', options, accept: [letters.slice().sort().map(l => 'l' + l)],
                why: 'Alphabet order: ' + letters.slice().sort().join(', ') + '.' };
        },
        // A short pattern.
        pattern(rng) {
            const options = rng.shuffle([opt('yes', '✔ Yes', { size: 'l' }), opt('no', '✖ No', { size: 'l' })]);
            const seq = rng.pick([['no', 'yes', 'no'], ['yes', 'yes', 'no'], ['no', 'no', 'yes'], ['yes', 'no', 'yes', 'yes']]);
            const name = { yes: '✔ Yes', no: '✖ No' };
            return { mode: 'sequence', sign: 'Press ' + seq.map(x => name[x]).join(', then ') + '.', options, accept: [seq],
                why: 'The sign gave the order: ' + seq.map(x => name[x]).join(', ') + '.' };
        },
        // Longer patience.
        patience(rng) {
            const seconds = rng.int(8, 10);
            const options = rng.shuffle([opt('ready', 'I am ready ▶'), opt('bored', 'This is boring'), opt('end', 'End the round')]);
            return { mode: 'wait', seconds, sign: 'This round ends by itself. Just wait.', options, accept: [WAITED],
                why: 'The round ended by itself. Every button was a way to lose by not waiting.' };
        },
        // Count a letter.
        countLetter(rng) {
            const w = rng.pick([['TEENAGE', 'E', 3], ['BANANA', 'A', 3], ['COFFEE', 'F', 2], ['MISSISSIPPI', 'S', 4], ['BOOKKEEPER', 'E', 3]]);
            return { mode: 'number', sign: 'How many letter ' + w[1] + 's are in the word ' + w[0] + '?', options: [], accept: [String(w[2])],
                why: w[0] + ' has ' + w[2] + ' letter ' + w[1] + 's. Go letter by letter.' };
        },
        // Same amount, different look.
        sameAmount(rng) {
            const pair = rng.pick([['½', '50%'], ['0.25', '¼'], ['3/6', '½'], ['10%', '0.1']]);
            const options = rng.shuffle([opt('same', 'The same amount'), opt('first', pair[0] + ' is more'), opt('second', pair[1] + ' is more')]);
            return { mode: 'tap', sign: 'Which is more: ' + pair[0] + ' or ' + pair[1] + '?', options, accept: ['same'],
                why: pair[0] + ' and ' + pair[1] + ' are the same amount, written two ways.' };
        },
        // Upside down.
        upsideDown(rng, k) {
            const words = rng.shuffle(['Click me', 'Pick me', 'Me!', 'Here']);
            const flip = rng.int(0, 3);
            const options = words.map((w, i) => opt('w' + i, w, { flip: i === flip }));
            return { mode: 'tap', sign: 'Click the button that is UPSIDE DOWN.', options, accept: ['w' + flip],
                why: '"' + words[flip] + '" was the one printed upside down. Look at the buttons, not just their words.' };
        },
        // The longest word.
        longestWord(rng) {
            const words = rng.shuffle(['cat', 'owl', 'elephant', 'bee', 'whale', 'mouse'].slice()).slice(0, 4);
            if (!words.includes('elephant')) words[0] = 'elephant';
            const sorted = words.slice().sort((a, b) => a.length - b.length);
            const options = words.map(w => opt(w, w, { size: ['xl', 'l', 'm', 'xs'][sorted.indexOf(w)] }));
            return { mode: 'tap', sign: 'Click the word with the MOST letters.', options, accept: ['elephant'],
                why: '"elephant" has 8 letters, the most. Small print does not mean a short word.' };
        },
        // Sides.
        sides(rng) {
            const t = rng.int(1, 3), s = rng.int(1, 3);
            return { mode: 'number', sign: 'How many sides do ' + t + ' triangle' + (t > 1 ? 's' : '') + ' and ' + s + ' square' + (s > 1 ? 's' : '') + ' have, all together?', options: [], accept: [String(t * 3 + s * 4)],
                why: t + ' × 3 + ' + s + ' × 4 = ' + (t * 3 + s * 4) + '.' };
        },
    });

    // ---- Unit 2: Maskip, the lantern imp (logic words) ----------------------------------------------

    const lamp = on => (on ? 'on' : 'off');
    const pairText = p => 'left ' + lamp(p.left) + ', right ' + lamp(p.right);
    function lanternPairs(rng) {
        return rng.shuffle([[1, 1], [1, 0], [0, 1], [0, 0]]).map((lr, i) => ({ id: LETTERS[i], name: 'Pair ' + LETTERS[i], left: !!lr[0], right: !!lr[1] }));
    }
    const pairOptions = pairs => pairs.map(p => opt(p.id, p.name, { sub: pairText(p) }));
    const pairScene = (pairs, extra) => Object.assign({ kind: 'lanterns', pairs: pairs.map(p => Object.assign({}, p)) }, extra || {});
    const CLAIMS = {
        both: { text: 'has both lanterns on', test: p => p.left && p.right },
        one: { text: 'has exactly one lantern on', test: p => p.left !== p.right },
        neither: { text: 'has no lantern on', test: p => !p.left && !p.right },
        some: { text: 'has at least one lantern on', test: p => p.left || p.right },
    };

    const MASKIP = {
        both(rng) {
            const pairs = lanternPairs(rng), both = pairs.filter(CLAIMS.both.test);
            return { mode: 'pick', sign: 'Pick the pair with BOTH lanterns on.', scene: pairScene(pairs), options: pairOptions(pairs), accept: both.map(p => p.id),
                why: 'Both means the left one AND the right one are on. Only ' + both[0].name + ' has that.' };
        },
        exactlyOne(rng) {
            const pairs = lanternPairs(rng), one = pairs.filter(CLAIMS.one.test);
            return { mode: 'pick', sign: 'Pick a pair with EXACTLY ONE lantern on.', scene: pairScene(pairs), options: pairOptions(pairs), accept: one.map(p => p.id),
                why: 'Exactly one means one on and one off. ' + one[0].name + ' and ' + one[1].name + ' both count. Both on is two, not one.' };
        },
        claim(rng) {
            const pairs = lanternPairs(rng);
            const kind = rng.pick(Object.keys(CLAIMS));
            const truth = rng.chance(0.5);
            const target = rng.pick(pairs.filter(p => !!CLAIMS[kind].test(p) === truth));
            return { mode: 'pick', sign: 'Is the mask\'s claim true or false? Check the lanterns.', scene: pairScene(pairs, { claim: target.name + ' ' + CLAIMS[kind].text + '.', target: target.id }),
                options: [opt('true', 'True'), opt('false', 'False')], accept: [truth ? 'true' : 'false'],
                why: target.name + ' is ' + pairText(target) + '. So the claim is ' + (truth ? 'true' : 'false') + '. A confident mask is not evidence; the lanterns are.' };
        },
        neither(rng) {
            const pairs = lanternPairs(rng), none = pairs.filter(CLAIMS.neither.test);
            return { mode: 'pick', sign: 'Pick the pair with NEITHER lantern on.', scene: pairScene(pairs), options: pairOptions(pairs), accept: none.map(p => p.id),
                why: 'Neither means: not the left and not the right. Only ' + none[0].name + ' has both off.' };
        },
        atLeastOne(rng) {
            const pairs = lanternPairs(rng), some = pairs.filter(CLAIMS.some.test);
            return { mode: 'multi', sign: 'Select EVERY pair with AT LEAST ONE lantern on. Then press Check.', scene: pairScene(pairs), options: pairOptions(pairs), accept: [some.map(p => p.id)],
                why: 'At least one means one OR both. Three pairs count: ' + some.map(p => p.name).join(', ') + '.' };
        },
        breaksRule(rng) {
            const pairs = lanternPairs(rng), bad = pairs.filter(p => p.left && !p.right);
            return { mode: 'pick', sign: 'Rule: IF the left lantern is on, THEN the right one is on. Pick the pair that BREAKS the rule.', scene: pairScene(pairs), options: pairOptions(pairs), accept: bad.map(p => p.id),
                why: 'Only "left on, right off" breaks an if-then rule. When the left is off, the rule promises nothing, so ' + bad[0].name + ' is the only rule-breaker.' };
        },
        notBoth(rng) {
            const pairs = lanternPairs(rng), nb = pairs.filter(p => !(p.left && p.right));
            return { mode: 'multi', sign: 'Select EVERY pair that does NOT have both lanterns on. Then press Check.', scene: pairScene(pairs), options: pairOptions(pairs), accept: [nb.map(p => p.id)],
                why: '"Not both" is true whenever at least one is off. Only the pair with both on is left out.' };
        },
    };

    // ---- Unit 3: Quibblequill, the evidence ferret (counterexamples, support, one-way rules) --------

    function parcels(rng) {
        const numbers = rng.shuffle([12, 17, 23, 31, 38, 44, 52, 59, 66, 73]);
        const shape = [];
        const confirming = rng.int(2, 3);
        for (let i = 0; i < confirming; i++) shape.push({ stamped: true, arrived: true });
        shape.push({ stamped: true, arrived: false, counter: true });
        shape.push({ stamped: false, arrived: false });
        if (rng.chance(0.5)) shape.push({ stamped: false, arrived: true });
        return rng.shuffle(shape).map((r, i) => Object.assign({ id: 'p' + numbers[i], name: 'Parcel ' + numbers[i] }, r));
    }
    const recSub = r => (r.stamped ? 'stamped' : 'no stamp') + ' · ' + (r.arrived ? 'arrived' : 'not arrived yet');
    const recScene = (records, claim) => ({ kind: 'records', claim, records: records.map(r => ({ id: r.id, name: r.name, stamped: r.stamped, arrived: r.arrived })) });
    const recOptions = records => records.map(r => opt(r.id, r.name, { sub: recSub(r) }));
    const EVERY = 'Every stamped parcel has arrived.';

    const QUIBBLE = {
        counterexample(rng) {
            const records = parcels(rng), counter = records.find(r => r.counter);
            return { mode: 'pick', sign: 'Pick the ONE record that proves the claim false.', scene: recScene(records, EVERY), options: recOptions(records), accept: [counter.id],
                why: counter.name + ' is stamped but has not arrived. One case like that breaks an "every" claim. A parcel with no stamp says nothing about stamped ones.' };
        },
        supported(rng) {
            const records = parcels(rng), counter = records.find(r => r.counter);
            const ok = records.filter(r => r.stamped && r.arrived).length;
            const claims = rng.shuffle([
                opt('some', 'At least ' + ok + ' stamped parcels have arrived.'),
                opt('every', EVERY),
                opt('all-stamped', 'Every parcel has a stamp.'),
                opt('first', 'Stamped parcels always arrive first.'),
            ]);
            return { mode: 'pick', sign: 'Pick the claim these records SUPPORT.', scene: recScene(records, null), options: claims, accept: ['some'],
                why: 'The records show ' + ok + ' stamped parcels that arrived, so "at least ' + ok + '" is supported. ' + counter.name + ' breaks the "every" claim, and nothing says which came first.' };
        },
        converse(rng) {
            const material = rng.pick(['brass', 'silver', 'iron']);
            const door = rng.pick(['archive', 'vault', 'attic']);
            const key = 'Key ' + rng.pick(['7', '9', '14', '21']);
            return { mode: 'pick', sign: 'Pick the claim that does NOT follow from the rule.',
                scene: { kind: 'keys', rule: 'Every ' + door + ' key is ' + material + '.', record: key + ': ' + material + '. Tried on the ' + door + ' door: it did NOT open.' },
                options: rng.shuffle([
                    opt('converse', 'Every ' + material + ' key opens the ' + door + '.'),
                    opt('instance', 'If a key opens the ' + door + ', it is ' + material + '.'),
                    opt('contra', 'A key that is not ' + material + ' cannot be ' + (/^[aeiou]/.test(door) ? 'an ' : 'a ') + door + ' key.'),
                ]),
                accept: ['converse'],
                why: 'The rule goes one way: ' + door + ' key, so ' + material + '. It does not go back. ' + key + ' is ' + material + ' and did not open the ' + door + '.' };
        },
        irrelevant(rng) {
            const records = parcels(rng), off = records.filter(r => !r.stamped);
            return { mode: 'multi', sign: 'Select EVERY record that says NOTHING about the claim. Then press Check.', scene: recScene(records, EVERY), options: recOptions(records), accept: [off.map(r => r.id)],
                why: 'The claim is only about stamped parcels. A parcel with no stamp can neither support it nor break it.' };
        },
        agreeing(rng) {
            const records = parcels(rng), agree = records.filter(r => r.stamped && r.arrived);
            return { mode: 'multi', sign: 'Select EVERY record that AGREES with the claim. Then press Check.', scene: recScene(records, EVERY), options: recOptions(records), accept: [agree.map(r => r.id)],
                why: 'Only stamped parcels that arrived agree with it. (And agreeing records still do not prove an "every" claim.)' };
        },
        howMany(rng) {
            const records = parcels(rng);
            return { mode: 'number', sign: 'The claim says "every". How many records that break it do you need to prove it FALSE?', scene: recScene(records, EVERY), options: [], accept: ['1'],
                why: 'One. A single counterexample is enough to break an "every" claim, however many records agree.' };
        },
    };

    // ---- Unit 4: Oddsnap, the probability gremlin (likely is not certain) ----------------------------

    const SHAPES = [
        { id: 'triangle', name: 'Triangle', icon: '▲' },
        { id: 'circle', name: 'Circle', icon: '●' },
        { id: 'square', name: 'Square', icon: '■' },
    ];
    const LOGS = [[6, 3, 1], [5, 4, 1], [5, 3, 2], [7, 2, 1], [4, 5, 1], [6, 1, 3]];
    function shapeLog(counts) {
        const total = counts.reduce((a, b) => a + b, 0), top = Math.max(...counts);
        return { kind: 'log', total, shapes: SHAPES.map((s, i) => ({ id: s.id, name: s.name, icon: s.icon, count: counts[i], pct: Math.round(100 * counts[i] / total), glow: counts[i] === top })) };
    }
    const shapeOptions = () => SHAPES.map(s => opt(s.id, s.icon + ' ' + s.name));

    const ODDSNAP = {
        least(rng) {
            const counts = rng.shuffle(rng.pick(LOGS).slice()), scene = shapeLog(counts);
            const least = SHAPES[counts.indexOf(Math.min(...counts))];
            return { mode: 'pick', sign: 'The machine predicts from its log. Pick its LEAST likely next shape.', scene, options: shapeOptions(), accept: [least.id],
                why: least.name + ' came up only ' + Math.min(...counts) + ' times out of ' + scene.total + ', so it is the least likely. The glowing shape is the MOST likely one.' };
        },
        most(rng) {
            const counts = rng.shuffle(rng.pick(LOGS).slice()), scene = shapeLog(counts);
            const most = SHAPES[counts.indexOf(Math.max(...counts))];
            return { mode: 'pick', sign: 'The machine predicts from its log. Pick its MOST likely next shape.', scene, options: shapeOptions(), accept: [most.id],
                why: most.name + ' has the biggest count, ' + Math.max(...counts) + ' out of ' + scene.total + '.' };
        },
        guarantee(rng) {
            const odds = rng.shuffle([95, 90, 80, 70, 60, 50]).slice(0, 3);
            const doors = odds.map((p, i) => ({ id: 'door-' + LETTERS[i], name: 'Door ' + LETTERS[i], pct: p }));
            return { mode: 'pick', sign: 'Pick a door that is GUARANTEED safe.', scene: { kind: 'doors', doors },
                options: doors.map(d => opt(d.id, d.name, { sub: d.pct + '% safe' })).concat([opt('none', 'No door is guaranteed safe')]), accept: ['none'],
                why: 'Guaranteed means 100%. Every door is below 100%, so none is guaranteed. Even ' + Math.max(...odds) + '% safe still fails sometimes.' };
        },
        streak(rng) {
            const n = rng.int(4, 7), side = rng.pick(['HEADS', 'TAILS']);
            return { mode: 'pick', sign: 'A fair coin landed ' + side + ' ' + n + ' times in a row. What is the chance that the next flip is ' + side + '?',
                options: rng.shuffle([opt('half', '50%'), opt('less', 'Less than 50%: it is due a change'), opt('more', 'More than 50%: it is on a streak')]), accept: ['half'],
                why: 'A fair coin has no memory. Every flip is 50% heads and 50% tails, whatever came before.' };
        },
        sameRolls(rng) {
            const odd = rng.pick(['6, 6, 6, 6, 6, 6', '1, 1, 1, 1, 1, 1', '1, 2, 3, 4, 5, 6']);
            return { mode: 'pick', sign: 'Roll a fair die six times. Which exact list of rolls is more likely?',
                options: rng.shuffle([opt('odd', odd), opt('mixed', '3, 5, 1, 6, 2, 4'), opt('same', 'They are exactly as likely')]), accept: ['same'],
                why: 'Each exact list of six rolls has the same chance. A pattern only LOOKS special.' };
        },
        impossible(rng) {
            return { mode: 'pick', sign: 'One normal die, rolled once. Pick the IMPOSSIBLE result.',
                options: rng.shuffle([opt('six', 'Roll a 6'), opt('seven', 'Roll a 7'), opt('even', 'Roll an even number'), opt('one', 'Roll a 1')]), accept: ['seven'],
                why: 'A normal die only has 1 to 6. A 7 is impossible; the others are just unlikely or likely.' };
        },
        certain(rng) {
            return { mode: 'pick', sign: 'One normal die, rolled once. Pick the CERTAIN result.',
                options: rng.shuffle([opt('six', 'Roll a 6'), opt('small', 'Roll less than 7'), opt('even', 'Roll an even number'), opt('notone', 'Roll more than 1')]), accept: ['small'],
                why: 'Every face of a normal die is less than 7, so that one is certain. "More than 1" is likely, not certain.' };
        },
    };

    // More of each creature's own tricks (17 Oct 2026).
    Object.assign(MASKIP, {
        orFalse(rng) {
            const pairs = lanternPairs(rng), none = pairs.filter(CLAIMS.neither.test);
            return { mode: 'pick', sign: 'Claim: "the left OR the right lantern is on." Pick the pair where that claim is FALSE.', scene: pairScene(pairs), options: pairOptions(pairs), accept: none.map(p => p.id),
                why: 'An OR claim is true if at least one is on. It is only false when both are off: ' + none[0].name + '.' };
        },
        notExactlyOne(rng) {
            const pairs = lanternPairs(rng), same = pairs.filter(p => p.left === p.right);
            return { mode: 'multi', sign: 'Select EVERY pair that does NOT have exactly one lantern on. Then press Check.', scene: pairScene(pairs), options: pairOptions(pairs), accept: [same.map(p => p.id)],
                why: 'Not exactly one means none or both: ' + same.map(p => p.name).join(' and ') + '.' };
        },
        countOn(rng) {
            const pairs = lanternPairs(rng);
            return { mode: 'number', sign: 'How many lanterns are ON, counting every pair?', scene: pairScene(pairs), options: [], accept: ['4'],
                why: 'Both on gives 2, each "exactly one" pair gives 1, and both off gives 0: 2 + 1 + 1 + 0 = 4.' };
        },
    });
    Object.assign(QUIBBLE, {
        someNot(rng) {
            const records = parcels(rng), counter = records.find(r => r.counter);
            return { mode: 'pick', sign: 'Claim: "Some stamped parcels have NOT arrived." Pick the record that SUPPORTS it.', scene: recScene(records, null), options: recOptions(records), accept: [counter.id],
                why: counter.name + ' is stamped and not arrived, so it supports "some have not". Unstamped parcels are about something else.' };
        },
        wouldBreak(rng) {
            const n = rng.pick([81, 84, 90, 95]);
            return { mode: 'pick', sign: 'Claim: "' + EVERY + '" A new record arrives. Which one would BREAK the claim?', scene: recScene(parcels(rng), EVERY),
                options: rng.shuffle([opt('break', 'Parcel ' + n + ': stamped, not arrived'), opt('nostamp', 'Parcel ' + n + ': no stamp, not arrived'), opt('agree', 'Parcel ' + n + ': stamped, arrived')]), accept: ['break'],
                why: 'Only a stamped parcel that has not arrived goes against "every stamped parcel has arrived".' };
        },
        notBrass(rng) {
            const material = rng.pick(['brass', 'silver', 'iron']), door = rng.pick(['archive', 'vault', 'attic']);
            return { mode: 'pick', sign: 'Rule: "Every ' + door + ' key is ' + material + '." This key is NOT ' + material + '. Is it ' + (/^[aeiou]/.test(door) ? 'an ' : 'a ') + door + ' key?',
                options: [opt('yes', 'Yes'), opt('no', 'No'), opt('cant', 'We cannot tell')], accept: ['no'],
                why: 'Every ' + door + ' key is ' + material + '. A key that is not ' + material + ' cannot be one of them, so: no.' };
        },
        isBrass(rng) {
            const material = rng.pick(['brass', 'silver', 'iron']), door = rng.pick(['archive', 'vault', 'attic']);
            return { mode: 'pick', sign: 'Rule: "Every ' + door + ' key is ' + material + '." This key IS ' + material + '. Is it ' + (/^[aeiou]/.test(door) ? 'an ' : 'a ') + door + ' key?',
                options: [opt('yes', 'Yes'), opt('no', 'No'), opt('cant', 'We cannot tell')], accept: ['cant'],
                why: 'The rule only goes one way. Other keys may be ' + material + ' too, so we cannot tell.' };
        },
    });
    Object.assign(ODDSNAP, {
        twoDice(rng) {
            return { mode: 'pick', sign: 'Roll two fair dice and add them. Which total is MOST likely?',
                options: rng.shuffle([opt('2', '2'), opt('7', '7'), opt('12', '12'), opt('same', 'All totals are equally likely')]), accept: ['7'],
                why: 'Six pairs make 7 (1+6, 2+5, 3+4, 4+3, 5+2, 6+1). Only one pair makes 2, and only one makes 12.' };
        },
        oneSix(rng) {
            return { mode: 'pick', sign: 'One fair die. What is the chance of rolling a 6?',
                options: rng.shuffle([opt('sixth', '1 in 6'), opt('half', '1 in 2: it is a 6 or it is not'), opt('third', '1 in 3')]), accept: ['sixth'],
                why: 'Six faces, all equally likely, one of them a 6: 1 in 6. "It happens or it does not" is not 50/50.' };
        },
        bag(rng) {
            const a = rng.int(3, 5), b = rng.int(1, 2);
            return { mode: 'pick', sign: 'A bag holds ' + a + ' ▲ and ' + b + ' ■. You pick one without looking. Which is more likely?',
                options: rng.shuffle([opt('tri', '▲ Triangle'), opt('sq', '■ Square'), opt('same', 'Equally likely')]), accept: ['tri'],
                why: 'There are more triangles (' + a + ') than squares (' + b + '), so a triangle is more likely.' };
        },
    });

    const OWN = { maskip: MASKIP, quibblequill: QUIBBLE, oddsnap: ODDSNAP };

    // A run: half own tricks, half shared ones, mixed, no trick twice. Keys say where a round came from.
    function make(id, seed) {
        const own = OWN[id], skin = SKINS[id];
        if (!own) return null;
        const rng = Rift.makeRng('trick:' + id + ':' + String(seed));
        const picks = rng.shuffle(Object.keys(own)).slice(0, OWN_PER_RUN).map(k => ['own', k])
            .concat(rng.shuffle(Object.keys(SHARED)).slice(0, ROUNDS - OWN_PER_RUN).map(k => ['shared', k]));
        const rounds = rng.shuffle(picks).map(([from, k]) => Object.assign({ key: from + ':' + k }, (from === 'own' ? own : SHARED)[k](rng, skin)));
        return { id, rounds };
    }

    // One of every trick for a creature: the review page and the fairness tests.
    function bank(id, seed) {
        const own = OWN[id], skin = SKINS[id];
        if (!own) return [];
        const rng = Rift.makeRng('trick-bank:' + id + ':' + String(seed));
        return Object.keys(own).map(k => Object.assign({ key: 'own:' + k }, own[k](rng, skin)))
            .concat(Object.keys(SHARED).map(k => Object.assign({ key: 'shared:' + k }, SHARED[k](rng, skin))));
    }

    const sameSet = (a, b) => a.length === b.length && new Set(a).size === a.length && a.every(x => b.includes(x));
    const sameList = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);
    // "07", " 7 ", "+7" all read as 7; nothing else is forgiven.
    const number = t => String(t == null ? '' : t).trim().replace(/^\+/, '').replace(/^(-?)0+(\d)/, '$1$2');

    function check(round, answer) {
        if (!round) return { ok: false, why: null };
        if (answer === TIMEOUT) return { ok: false, why: 'The clock ran out. ' + round.why };
        let ok;
        if (round.mode === 'multi') ok = Array.isArray(answer) && sameSet(answer, round.accept[0]);
        else if (round.mode === 'sequence') ok = Array.isArray(answer) && sameList(answer, round.accept[0]);
        else if (round.mode === 'number') ok = round.accept.includes(number(answer));
        else ok = round.accept.includes(answer);
        return { ok, why: ok ? null : round.why };
    }

    // Is a sequence still on track after these presses? (A wrong press fails at once.)
    function onTrack(round, pressed) {
        const want = round.accept[0];
        return pressed.length <= want.length && pressed.every((x, i) => x === want[i]);
    }

    // The answer that solves a round (the playtest hook and the tests use it).
    const solution = round => (round.mode === 'multi' || round.mode === 'sequence' ? round.accept[0].slice() : round.accept[0]);

    Rift.Tricks = { ROUNDS, OWN_PER_RUN, WAITED, TIMEOUT, make, bank, check, onTrack, solution, ids: () => Object.keys(OWN), sharedKeys: () => Object.keys(SHARED), ownKeys: id => Object.keys(OWN[id] || {}) };
})(typeof window !== 'undefined' ? window : globalThis);
