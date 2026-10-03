# Feedback audit — issue #39

2026-10-03. Source audit of all fourteen checkers, plus focused controller/feedback tests. Not an exhaustive browser playthrough.

| Puzzle | Wrong-answer reasoning |
|---|---|
| Liar's Gate | Names a guard and explains why their words clash with the proposed roles/door. |
| Rule Hunter | Compares the proposed rule with observed tests; pattern mode distinguishes the first examples from later values. |
| Venn | Explains valid/invalid counterworld reasoning, truth separately, and one diagram repair. |
| Line Drawer | Identifies unused/reused edges, missed dots, line limit or incorrect odd-point proof. |
| Witness | Marks every wrong claim without giving its answer. On the second wrong check, explains one with stored scene evidence. |
| Village | Explains a statement's contradiction in the student's proposed world, or the wrong imp count. |
| Switchboard | Shows insufficient inputs, a redundant assumption, invalid/cyclic wires or a conflicting report. Wire mismatch now names the first table row to trace. |
| Tower | Collapse identifies repeated base contradictions or fallen-block threshold. Per-move feedback shows the conflicting support. |
| Tribunal | Explains why evidence does/does not contradict a claim, the flaw or the repair. |
| Chart Fixer | Names the remaining distortion or asks for the corrected data interpretation. |
| Prediction | Points to the counting table or the gap between pattern prediction and knowing a person. |
| Sorting | Names the mistaken audit interpretation or the goal/value a fix fails. |
| Oracle | Names the first invalid step/flaw, or asks what warrants trusting a machine. Removed wording that treated a few matching examples as proof. |
| Three Acts | Identifies missing information, wrong assumptions/rounding, or missing reflection. |

No ordinary wrong-answer path only says “wrong”. Empty/invalid input paths ask the student to supply the required move. Two defensive unique-solution fallbacks (Liar's Gate and Village) remain generic “check again”; their generated worlds are independently covered by solver tests and should not be reachable in normal play.

The attempt rule is per **stage**: three free wrong checks at difficulty 1, two at 2–3; Frogling adds one. Correct checks cost nothing. Subsequent wrong checks cost one heart everywhere. Hints cost one (two with Shaky Hand); an avatar's free hint still counts as help for stars. Boss Why is a separate, explicitly priced one-heart decision.

Success is protected against repeated submissions and requires Continue. Every stage retains reasoning/TOK feedback; every boss stage runs its own Why. Knockout pauses play, explains scars/rest/shrines, and prevents completion or rewards. Encounter-wide hints/errors produce stars (3 clean, 2 with up to two in total, 1 otherwise), adding 10/5/0 XP.

Content corrections: Tower now keeps “know” and its negation consistent and avoids equating friendship with knowing; dawn's negative answer is an actual negation. Tribunal's look-alike cats leave identity unsupported, rather than prove it false. The Truth-Tabler accolade no longer claims the player used the table.

Tests exercise budgets, scars, stars/XP, Witness wrong IDs/evidence, mounted Witness first/second feedback, duplicate success, normal-station costs, hints counted once, knockout, and boss Why knockout blocking rewards.

Independent standards and spec source reviews: no blockers. The controller tests use a small DOM/modal adapter; they do not certify real browser overlay removal or help-close timing. Previous #37 browser checks covered help replay/closing and the Witness help pause. All 281 tests pass.
