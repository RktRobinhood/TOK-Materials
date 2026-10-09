# Writing gate: puzzles #62, round 2, Critic 1 (logic and consistency)

**Score: 9/10**

All 10 round-1 items are fixed in 863f04a. Checked:
- **Granny gating.** `HUMPRE` (alive and before the Hall) and the baker lines (`any: [hall.win, dead:granny]`) cover every case, with exactly one host speaking. They match the map.js `hosts` entry and b-town-hall.
- **The new jugs result.** "4 and 6 → every amount is even → 3 never appears" is correct.
- **The new reminder.** `{ flag: 'side.6', gte: 3 }` is the real tier flag (side-stories.js sets `'side.' + n` to the tier). Tiers 3 and 4 both put the rocket in the river by the bridge, so "Upstream" fits the Ford downstream.
- **The river practice result.** It is true at the end of frame 2: you are on the far bank with A and B.

Remaining fixes:

1. **River practice frame 2 marks a correct move as wrong.** This was there before round 2; I missed it in round 1. A and C are symmetric (each is a rival only of B), so "Take C" is as good as "Take A". From the far bank with B, no unsafe move exists, so the distractor has to be illegal instead. Rewrite line 78 of tutorial-examples.js:
   `['Come back alone, then take A. (C would work too.)',['Back alone, take A','Back alone, take A and C'],0,'Near: C · Far: A, B'],`
   (The boat seats one, so "A and C" breaks a stated rule.)
2. **The tickets text doesn't say a ticket is one crossing.** The counter takes one ticket off for every crossing, including solo trips back. "Tickets" alone reads as per creature or per round trip. Rewrite the rules card line:
   `'At the hardest level, Muskrat sells only a few tickets: one per crossing, trips back included. Undo and Reset are free.'`
3. (Minor) **"Nobody got eaten."** Every other line says rivals fight or bite ("bite each other", "They fought"). No one eats anyone, so make it consistent: `' Nobody got bitten.'`

Not a fix, just noted: the cut board still shows the first three moves of d1 (d1 is always the A–B–C chain), and the result hints at the return trip. That is the text-only minimum from round 1; it's the teacher's call. The 4-and-6 jugs example is a possible d3 board (g = 2). It teaches the argument, and the student still has to find g on their own board, so it is acceptable.
