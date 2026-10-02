/*
 * The puzzle interface. Every generator registers one definition:
 *
 * Rift.Puzzles.register({
 *   id: 'liars-gate',
 *   name: "Liar's Gate",
 *   colour: 'reason',                  // a key of Rift.COLOURS
 *   family: 'Deduction',
 *   blurb: 'One line shown before the puzzle.',
 *   tok: 'One-sentence TOK takeaway shown after solving.',
 *
 *   // PURE (no DOM) — also run by the Node tests in tools/test:
 *   generate(rng, difficulty),         // difficulty 1..3 → puzzle data (JSON-safe)
 *   check(data, answer),               // → { solved: bool, feedback: string, partial?: number 0..1 }
 *   hints(data),                       // → [string, ...] increasingly specific
 *   why(data),                         // optional, for boss puzzles → { question, options: [..], correct: index, explain }
 *   solve(data),                       // optional, returns a correct answer (used by tests)
 *
 *   // DOM:
 *   mount(container, data, api),       // renders the interactive puzzle; returns { destroy() }
 * });
 *
 * The api passed to mount:
 *   api.submit(answer)    → runs check(); the encounter handles success/failure, health and feedback
 *   api.sfx(name)         → play a sound (e.g. 'click', 'place', 'error')
 *   api.say(text, speaker)→ show a speech bubble line from the obstacle character
 *   api.rng               → a seeded RNG for any cosmetic randomness
 *   api.difficulty        → 1..3
 *   api.el                → Rift.el
 *
 * Rules: mouse-driven, generated fresh each play, and statements shown in
 * pieces/speech bubbles rather than one copyable paragraph.
 */
(function (root) {
    'use strict';

    const Rift = root.Rift;
    const defs = {};

    const Puzzles = {
        register(def) {
            ['id', 'name', 'colour', 'generate', 'check', 'mount'].forEach(k => {
                if (!def[k]) throw new Error('Puzzle definition missing ' + k + ' (' + (def.id || '?') + ')');
            });
            defs[def.id] = Object.assign({ hints: () => [], tok: '', blurb: '' }, def);
        },
        get(id) { return defs[id]; },
        all() { return Object.values(defs); },
        byColour(colour) { return Object.values(defs).filter(d => d.colour === colour); },
    };

    Rift.Puzzles = Puzzles;
})(typeof window !== 'undefined' ? window : globalThis);
