# Writing gate: puzzles #62 (water jugs, river crossing, logic grid), round 1, Critic 1 (logic and consistency)

**Score: 6/10**

The maths is sound. The d3 jugs "why" has exactly one correct reason: the gcd proof. The other three are not proofs: "tried lots", "bigger/smaller than a ladle" and "together hold less" (always false, since target < big ladle). The hints' "each move adds or takes away multiples of g" argument is correct. The river and grid "why" questions each have exactly one right option. Pip (dead:pip) and Muskrat (dark if lost) are covered by `Rift.Cast` host resolution, the same as t-library and troll-bridge, so no change is needed there. These must be fixed:

1. **Granny after the Hall (continuity bug).** The kitchen uses `HUM`, which only checks `!dead:granny`. After `ch2.hall.win`, a living Granny is no longer in the pot (the town-hall reminder hands over to the constable then), yet she would still hum here. If the kitchen is first visited after the Hall, the lines are wrong. Match the b-town-hall pattern:
   - map.js b-kitchen: `hosts: [{ when: { any: [{ seen: 'ch2.hall.win' }, 'dead:granny'] }, host: 'baker' }],`
   - lesson2.js: use `HUMPRE(...)` for both Granny lines. Change both baker lines to `when: { any: ['dead:granny', { seen: 'ch2.hall.win' }] }`.
   - Baker intro rewrite (it now covers both cases, so don't say why she is gone): `{ s: 'baker', t: 'Granny\'s ladles. Granny\'s recipe. Exact cups, or nothing.', when: … }`
2. **Jugs intro states fixed numbers, but puzzles are random.** "Exactly four cups… a 3-cup and a 5-cup ladle" contradicts the generated board (d1 caps 2–7, any target). Rewrite:
   `HUMPRE('Exact cups, dear. Two ladles, no markings. Think, then pour.')`
3. **Jugs goal can be misread as "every puzzle here is impossible".** d1 and d2 are always possible. Rewrite map goal:
   `'Make it exactly, or prove it cannot be done. Failing is not a proof.'`
4. **Jugs practice result sentence is muddled.** It says "If every amount you can make shares a factor", which reverses cause and effect. Rewrite:
   `'Four cups, by pouring alone. If both ladle sizes share a factor, every amount you make shares it too. Then some goals can never appear.'`
5. **"Alone together" can be misread at the Ford.** The rule is "two rivals on a bank without you" (a third creature does not stop a squabble). "Alone" suggests that only the two of them are there. Rewrites:
   - Muskrat intro: `'My new ferry! Tiny boat, huge egos. Leave two rivals on a bank without you and they squabble. Plan every trip.'`
   - rivals panel: `'Rivals (never leave them on a bank without you):'`
   - why option 0: `'After every crossing, no two rivals are on a bank without you.'`
   - clash feedback: `A + ' and ' + B + ' were left without you on the ' + side + ' bank. They squabbled.'`
6. **"The troll" is never set up.** At the Troll Bridge, Muskrat sets the toll ("Toll is still one perfect drawing"), and no troll character exists. Rewrites:
   - check feedback: `'Muskrat\'s toll: only ' + data.toll + ' crossings.'`
   - rules card: `'At the hardest level, Muskrat\'s toll allows only a set number of crossings. Undo and Reset are free.'`
7. **The river tutorial solves d1.** d1 is always three creatures, one seat and a chain rivalry. The practice board and step 3 ("Take B over first. Later, bring B back") are that exact solution with the names changed. Step-3 rewrite: `'Example, not this puzzle: sometimes the only safe move is to bring someone back. Going back is allowed.'` Then either cut the practice board to frames 1–2 (frame 2's choice becomes `'Back alone, take A'` and stops there), or make d1's rivalry a non-chain. Teacher's call. Fixing only the text is the minimum.
8. **The logic-grid fallback feedback is false.** "Your grid keeps every clue, but so does another one" cannot happen, because the generator guarantees one solution. A grid that keeps every clue *is* the answer. Rewrite:
   `'Some ✓ are in the wrong place. Find the clue that rules them out.'`
9. **The grid goal overclaims for real evidence (TOK accuracy).** In a closed puzzle, clues can rule out every alternative. Real-world evidence rarely does, and Ch3 is about evidence, so students should not take this away as a general rule. Rewrites:
   - map goal: `'Here the clues can settle a claim: they rule out every other possibility.'`
   - `tok`: `'A claim is proved when the evidence rules out every other possibility, not just when it fits. Real evidence rarely gets that far.'`
   - why `explain`: `'The clues settle it: every other arrangement breaks one. Fitting the clues is not enough on its own.'`
10. **The grid practice result names the wrong rule.** The last step used "each story has one writer", which is the column rule. Rewrite:
    `'One clue and the one-each rule settled it. Every other arrangement broke one of them.'`

Minor, optional: in the rules card, quote the button: `press "It can't be done…"`. A one-line Ford reminder after side story 6 at tier 3–4 (rocket in the river upstream) would tie the stations together, but this is not required.
