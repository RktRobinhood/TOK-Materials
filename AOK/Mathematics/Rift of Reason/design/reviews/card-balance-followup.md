# Balance follow-up for the rebuilt card cycle

This follows #44's mechanical redesign; it does not undo the energy/action/Fate system. The new mechanics and tutorial are implemented. A seeded AI simulation is a tuning signal, not a measured human win rate.

`node tools/sim-battle.mjs 1000 --seed=cycle-shared-2026-10-06` gives each side ten randomly selected core axioms and shuffles both contributions. In 1,000 Hard/Hard matches, the first player wins 62.4% of decided games, 2.6% draw at the limit, and matches average 26.93 personal turns (13.79 rounds). Across 2,000 Hard/Easy matches in both seats, Hard wins 71.7%, with no draws. Defeated creatures average four per player; current risked-match fate odds yield permanent loss in 1.8% of player outcomes. Practice and the mandatory story challenge have no fate/stakes.

Follow-up should:

- Compare mirrored creature teams and axiom selections in swapped seats, separately from random compositions and AI level. Log rewrites, active victory rules and Fate delays for long games.
- Trial a modest second-player opening compensation, such as an extra card, while preserving both players' 1→2→3 capacity progression. Measure before changing student instructions or narration.
- Check reverse-goal games, repeated Mercy returns and deliberate Fate delays. Do not make the displayed victory goal or countdown misleading to force a result.
- Tune an accessible Easy opponent using observable decisions; preserve the fixed safe Syllo challenge and deterministic practice lesson.
- Keep an explicit bounded draw safeguard. Any rule change must pass legality/purity/invariant tests, swapped-seat simulation and browser checks of the actual budget/goal.

Neither the AI heuristic nor these samples certify classroom balance or fun. Record the next observed playtest separately.
