/*
 * Side stories: the ten pop-up one-shots (design/SIDE-STORIES.md). Engine: js/core/side-stories.js
 * (queue, clock, ripples), js/core/side-verbs.js (the four verbs), js/screens/side-story.js (screen).
 *
 * ============================== SCRIPT FORMAT ==============================
 * Every "steps" below is a list of normal script steps (design/SCRIPT-FORMAT.md): lines
 * { s, e, t, u }, { inner: {…} }, { note }, { choice: [...] }, { when, then, else }, { flag },
 * { give }, { keepsake }, { scene }, `only`, `when`, speaker roles with understudies. Extras here:
 *   { clock: 'side', drain: 1 }      this story's clock ('side' is replaced by its real id, side.<n>)
 *   { clock: 'side', progress: 1 }   +1 gold Progress (a blue option's "+1 progress")
 *   { clock: 'side', tick: 1 }       a scripted mistake
 *   { visitor: 'siuuugull' }         "visits as a catchable creature": it is the loot of your next win
 *                                    anywhere, until you own one
 *   { closed: 'troll-bridge', note: 'The bridge is shut today.' }   that station is shut for one visit
 *   {role:granny} in a note, label or card (not in voiced lines): whoever holds the role now
 * Any field marked (fn) may instead be a function of the generated values: v => [...steps] (see setup).
 *
 * SS['lucky-well'] = {
 *     n: 2,                      // the story's number (flags side.2, stakes.side.2, clock side.2)
 *     title: 'The Lucky Well',
 *     lesson: 1,                 // 1–4: its trigger (Troll Bridge solved · Square solved · Plaza scene · Prediction Hall solved)
 *     station: 'well',           // a node id in data/map.js; the icon shows once it has been visited
 *     when: cond,                // optional extra condition to appear (Story conditions, plus { done: node }, { visited: node })
 *     colour: 'memory',          // optional Way of Knowing key: a creature of this colour on the team drains 1 (default: the lesson's)
 *     teaser: 'A queue at the Wishing Well. Coins are going in. Nothing is coming out.',   // the map hover
 *     aside: { s: 'narrator', t: 'Somebody at the Well is very lucky. Suspiciously lucky.' },   // optional, rest stops
 *     scene: 'scene/…',          // optional; default the station's own background (its `scenes` list too)
 *     setup: (rng, flags) => ({ wished: 6, plain: 6 }),   // optional generator (seeded per attempt); its result is `v`
 *     clock: {
 *         label: 'Coins lost', size: 6,   // Danger 6, or 4 for the gentlest
 *         progress: 3,                    // gold Progress (3–4)
 *         warn: [ steps… ],               // warn[k-1] plays when notch k fills (the last one repeats)
 *     },
 *     start: [ steps ],          // beat 1, the strong start (2–3 lines); the clock appears after it  (fn)
 *     clues: {                   // beat 2: hotspots on the background
 *         intro: [ steps ],      // optional  (fn)
 *         need: 2,               // any two are enough (default). Or ['labels', 'rule'] (these ids),
 *                                // or [['labels', 'rule'], ['labels', 'dent']] (any one of these sets)
 *         free: 3,               // clicks before each further click costs 1 notch (default 3)
 *         spots: [               // (fn)
 *             { id: 'list', kind: 'person', label: "Siuuugull's list", x: 30, y: 55,   // x, y: % of the scene
 *               art: 'npc/siuuugull',        // optional picture on the hotspot (else an icon for its kind)
 *               steps: [ steps ],            // what you see and hear when you click it
 *               again: [ steps ],            // optional, on a later click (costs like any click)
 *               card: 'Only matches where he wished AND scored.' },   // the clue card it adds (fn)
 *             // kind: 'person' | 'object' | 'record'
 *         ],
 *     },
 *     twist: { steps: [ steps ], id: 'twist', card: 'He knows it does not work.' },   // beat 3 (fn)
 *     resolve: { verb: 'test', intro: [steps], … },   // beat 4: one verb, see VERBS  (fn)
 *     after: [ steps ],          // optional: a follow-up choice (story 9's sign, story 10's new rule)  (fn)
 *     outcome: { 1: [steps], 2: [steps], 3: [steps], 4: [steps] },   // beat 5, by tier  (fn)
 *     ripples: [                 // flags into the main story, set at these tiers
 *         { flag: 'well-map', tiers: [1, 2], boss: 'gate', drain: 1,
 *           late: [ { keepsake: 'well-map' }, { s: 'nudge', t: '…' } ] },   // if the boss is already beaten
 *     ],
 *     last: [ steps ],           // beat 6, the last line; branch with when: { flag: 'side.2', is: 1 }  (fn)
 * };
 *
 * The tier is read from Danger when the verb ends (Danger 6: 0–1 · 2–3 · 4–5 · 6; Danger 4: 0–1 · 2 · 3 · 4).
 * The engine then sets side.<n> = tier, changes the Feed (tier 1 −1, tier 3 +1, tier 4 +2), applies the
 * ripples and plays outcome[tier], any late-play steps, then `last`. If the clock fills earlier, it jumps
 * straight to outcome[4]. Ripples: `drain` counts towards the cap of 2 per boss (a ripple over the cap or
 * aimed at a beaten boss plays `late` instead). The boss script reads the flag (lesson2.js reads 'ladle').
 *
 * Drains during a story: the blue option (write it in a choice: only + voice + then: [{ clock: 'side', drain: 1 }]),
 * "Spend a heart" (once), a creature of the story's colour on the team (once), each listen move in a
 * negotiation (once each). Mistakes: a wrong answer (1, or its `cost`), a clue click after the free ones.
 * The inner voice: one { inner: { owlet, mothkin, fox, frogling, raven } } hook per species per story;
 * one species' hook is the blue option (SIDE-STORIES.md section 2 table).
 * Hosts who have gone: write the role in `s` as usual (the cast picks the understudy or silence) and
 * give a `when: 'dead:granny'` fallback where a beat must still land. Nobody can die in a side story.
 *
 * VERBS (resolve.verb). Every wrong answer costs 1 notch (or `cost`) and is struck out; every round won
 * is +1 Progress. Progress already filled when the verb starts (blue "+1 progress") strikes out one
 * wrong option per notch (rounds with noHead: true are skipped), or in a negotiation adds 1 Interest per notch.
 *   option: { t: 'Tin B', ok: true, say: [steps], cost: 2 }    (say = the reply when picked)
 *
 * deduce — pick, then a one-click "Why?":
 *   { verb: 'deduce', rounds: [ { q: 'Which tin holds the cake?', options: [...],
 *       why: { q: 'Why?', options: [...] }, right: [steps] } ] }
 * test — choose the test that could prove the claim wrong (optional table and a follow-up):
 *   { verb: 'test', rounds: [ { q: 'Which data would show if wishing works?', options: [...] },
 *       { q: 'Does wishing help?', options: [...],     // a table shows on every ask of its round,
 *         table: v => [['', 'Goal', 'No goal'], ['Wished', v.a, 10 - v.a], ['Did not', v.b, 10 - v.b]] } ] }
 *   (or one round with then: { q, options } as a follow-up, when no table would give the first ask away)
 * object — a 3–4 line mini cross-examination; each round is one witness line:
 *   { verb: 'object', rounds: [ { line: [steps], press: [steps],      // press: a free "Press" button
 *       q: 'Your reply?', options: [...],                             // or present: 'clip' (a clue card id)
 *       name: { q: 'Name the flaw.', options: [...] } } ] }
 *   Any round may instead give asks: [ { q, options } | { q, present } ] in order.
 * negotiate — Interest (0–5) and Patience; listen first, then argue, then ask:
 *   { verb: 'negotiate', who: 'corvina', interest: 2, patience: 3, askAt: 4,
 *     cares: ['fairness', 'profit'], cantStand: ['experts'],     // facts · fame · fairness · safety · experts · profit
 *     listen: { mirror: { t: 'Nobody believes a crow.', say: [steps] },   // the avatar's words; her reply
 *               feeling: { t: 'You sound tired of the blame.', say: [steps] },
 *               sum: { t: 'So: you never left, and they blame you.', say: [steps] } },
 *     args: [ { t: 'Come out and the crowd sees you were fair.', appeal: 'fairness', sound: true, say: [steps] } ],
 *     special: { owlet: 'If you never left, you could not take it.', raven: { t: '…', say: [steps] } },
 *     ask: { t: 'Let them go, and come out with me.', early: [steps], yes: [steps] },
 *     replies: { up: [steps], same: [steps], down: [steps], reset: [steps] } }
 *   Rules: a listen move costs no Patience; the first use of each drains 1 notch and turns over one
 *   hidden tag. An argument that hits an unused "cares" is +1 Interest (and −1 Patience unless sound);
 *   a used one or a plain one is −1 Patience; a "can't stand" one is −1 Interest, −1 Patience and 1 notch.
 *   Your Way of Knowing's own card (special) counts as whichever of its two appeals is unused:
 *   owlet facts/fairness · mothkin facts/safety · fox fame/safety · frogling experts/fairness · raven profit/fame.
 *   Asking below askAt costs 1 notch and 1 Patience; at askAt or more it succeeds. Interest 5 ends it at once.
 *   Patience 0: 1 notch, then Patience, cards and motivations come back. Interest 0: 1 notch, back to 1.
 * ==========================================================================
 */
(function (root) {
    'use strict';
    const Rift = root.Rift;
    const SS = Rift.data.sideStories || (Rift.data.sideStories = {});

    // ---- TEST FIXTURE: placeholder text, not a real story. It never appears in the game
    // (fixture: true); the dev bench (dev/side-story.html) and tools/test/side-stories.test.mjs play it.
    // Writers: replace it with the ten real stories, keyed by a short id.
    SS['fixture'] = {
        fixture: true,
        n: 0,
        title: 'Test Fixture: The Missing Bucket',
        lesson: 1,
        station: 'well',
        teaser: 'TEST: a bucket is missing at the Well.',
        aside: { s: 'narrator', t: 'TEST aside: something is waiting at the Well.' },
        setup: rng => ({ coins: 3 + rng.int(0, 3) }),
        clock: {
            label: 'TEST: the rope frays', size: 6, progress: 3,
            warn: [{ note: 'TEST warning: the rope frays.' }],
        },
        start: [
            { s: 'narrator', t: 'TEST line: the bucket is gone.' },
            { s: 'avatar', t: 'TEST line: somebody took it.' },
        ],
        clues: {
            spots: v => [
                { id: 'person', kind: 'person', label: 'TEST person', x: 25, y: 60, steps: [{ note: 'TEST: the person saw nothing.' }], card: 'TEST card: saw nothing.' },
                { id: 'object', kind: 'object', label: 'TEST rope', x: 55, y: 45, steps: [{ note: 'TEST: the rope is cut.' }], card: 'TEST card: rope cut.' },
                { id: 'record', kind: 'record', label: 'TEST log', x: 78, y: 62, steps: [{ note: 'TEST: ' + v.coins + ' coins logged.' }], card: 'TEST card: ' + v.coins + ' coins.' },
            ],
        },
        twist: { steps: [{ note: 'TEST twist: the bucket was never there.' }], card: 'TEST card: no bucket.' },
        resolve: {
            verb: 'deduce',
            rounds: [{
                q: 'TEST: where is the bucket?',
                options: [{ t: 'TEST: stolen' }, { t: 'TEST: never there', ok: true }, { t: 'TEST: in the well' }],
                why: { q: 'Why?', options: [{ t: 'TEST: the rope is cut', ok: true }, { t: 'TEST: a hunch' }] },
            }],
        },
        outcome: {
            1: [{ note: 'TEST tier 1.' }, { give: { charm: 1 } }],
            2: [{ note: 'TEST tier 2.' }],
            3: [{ note: 'TEST tier 3.' }],
            4: [{ note: 'TEST tier 4.' }],
        },
        ripples: [{ flag: 'fixture-ripple', tiers: [1, 2], boss: 'gate', drain: 1, late: [{ note: 'TEST: the boss is beaten; a keepsake instead.' }] }],
        last: [{ s: 'narrator', t: 'TEST last line.' }],
    };
})(typeof window !== 'undefined' ? window : globalThis);
