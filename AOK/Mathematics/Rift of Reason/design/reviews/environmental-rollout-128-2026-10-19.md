# Environmental Fate rollout — #128, 19 October 2026

Baseline: `0dafabc`. This completes the remaining character/scene rollout authorized in the teacher's 18 October issue comment. It supersedes the **proposed** statuses and teacher-playtest prerequisite in the [17 October report](environmental-fate-128-2026-10-17.md). The original two schedules and their engine policy remain in place.

## Complete encounter audit

All timings below count full rounds, after both players act. The source portrait, effect, affected side, countdown, recurrence and current-state forecast are inspectable on the gold Fate node. Strongest means current attack without a combat opponent, leftmost on a tie, selected **at resolution**, not committed at announcement.

| Actual encounter | Scene / level | Source: event | Effect and target | First / repeat | Duration and counterplay |
|---|---|---|---|---|---|
| Granny lesson, both routes | Fair Gate / scripted | None | Explicit exception: scripted actions | — | No scene interference |
| Syllo practice match | Fair Gate / Normal | Syllo: Drill Whistle | Both sides +1 energy next turn | 4 / 4 | One turn; plan a bigger play |
| Training Dummy | Collection / Normal | None | Explicit exception: neutral sparring | — | No scene |
| Classmate ghost | Collection / Normal | None | Explicit exception: no authored scene | — | No advantage assigned to either side |
| Syllo stall challenge | Valley / Normal | Syllo: Roll Call | Both draw 1 from their own deck | 4 / 4 | Instant; keep hand space |
| Corvina challenge | Ch1 battle table / Competent | Corvina: Marked Deck | Corvina draws 1 from her deck | 3 / 4 | Instant; press early or skip |
| Mrs Crumb challenge | Boolesbury / Normal | Mrs Crumb: Oven Timer | Every creature in play heals 1 damage | 3 / 3 | Instant; trade before it heals |
| Constable Clobber | Ch2 battle table / Expert | Clobber: Curfew | Player's strongest cannot attack or Activate | 2 / 3 | Through its next turn; spread attack or skip |
| Constable, lower-level override | Same / Normal or Competent | Same | Same | 3 / 4 | Gentler cadence, same counterplay |
| Pip challenge | Tomorrowton / Normal | Pip: Late Paperwork | Both draw 1 from their own deck | 4 / 4 | Instant; keep hand space |
| Prosecutor Fin | Ch3 battle table / Expert | Fin: Objection! | Player's strongest gets −1 attack | 3 / 3 | Through its next turn; attack first, spread attack or skip |
| Fin, lower-level override | Same / Normal or Competent | Same | Same | 4 / 4 | Gentler cadence, same counterplay |
| Feed's Champion | Ch4 battle table / Expert | Algorithm: Trending | Feed's strongest gets +1 attack | 2 / 2 | Through its next turn; defeat it first or skip |
| Feed, lower-level override | Same / Normal or Competent | Same | Same | 3 / 3 | Gentler cadence, same counterplay |
| Roaming legendaries | Units 2–4 / trick challenges | None | Not card battles; no invented schedule | — | Optional hunt rules under #111 |

Trainer plans live on the existing seven trainer definitions in `data/map.js`; Syllo practice retains its launcher plan. No imaginary workshop encounter was added. Existing source portraits are reused, with no new art or recording requests.

## Effects and forecasts

Draws use ordinary engine draws: a full hand or empty deck draws nothing, without draw-step exhaustion. Public forecasts give counts only. AI projections insert concealed placeholder cards, independent of hidden deck order. Healing changes damage only. Missing creature targets consume an occurrence with a public explanation and still schedule the next recurrence.

Curfew uses a next-turn freeze expiry. Ordinary freeze cards retain their existing behavior. The expiry survives cloning/JSON, clears on transfer/return to hand, and appears in the AI action signature. This fixes the reviewer-found case where using Clockwork on your own turn previously made Curfew expire too early. Objection and Trending reuse the existing next-turn buff expiry.

Forecasts now explicitly show healed damage and creatures frozen, including an extended freeze. The tracker says **affects**, rather than wrongly saying a harmful event helps its target. Help teaches gold scene nodes, permanent leap skipping, rewind and distinct recurrences.

The schedule engine is unchanged: no player owns environmental occurrences; player-created event limits remain separate. Each repeat has a fresh ID. A leap permanently skips the occurrence; rewinding revives neither skipped nor fired occurrences. Simultaneous events retain sequence order before the normal rule event. Battle end stops resolution.

## Verification

- Focused rollout, existing environment/UI and trainer-launch tests pass, including both starting players, one advance per full round, ties/selection at resolution, missing targets, expiry, full hands/empty decks, hidden information, forecasts, immutable projections, JSON, skipping/rewinding and distinct recurrences. Clockwork regressions cover resolution during either side's turn.
- Actual in-app browser: laptop-size keyboard inspection, Corvina's count-only draw forecast and round-end firing/recurrence, Oven Timer's two named healing forecasts, Curfew's target/next-turn wording, and Calm-motion Objection leap followed by Nostalgia with the original node still marked skipped. Phone-width inspection was sampled; this is viewport automation, not a physical touchscreen or school-laptop test.
- Reproducible paired pacing: `node tools/sim-environment.mjs 1 design/reviews/environmental-rollout-128-2026-10-19-balance.json`. Five owned avatar starter decks, explicit boy-variant powers, trainer powers and Feed's copied avatar power (no saved-use history), authored opponents and both starting positions. No bag items. Same seeds compare scene events on/off. The JSON receipt reports per-avatar outcomes and actual event firings. This is a small regression sample, not a precise win-rate estimate or classroom pacing/enjoyment evidence. Later bosses are intentionally demanding for starter decks; this does not establish progression-deck balance.
- Independent Standards review: no findings. Spec review found the Curfew expiry bug; the fix and its 23 rollout regressions were re-reviewed successfully. Production powers were added to the pacing harness in response to its validation feedback.

Final full tracked suite plus the new rollout file: **1,173 tests, 1,172 passed, one existing skip, zero failures; 277.4 seconds**. The issue records the publication receipt after scoped push.

Pacing receipt: 140 complete games (70 matched on/off pairs). Starter wins out of ten pairs per trainer: Syllo **2 → 3**, Mrs Crumb **2 → 5**, Pip **2 → 2**, Feed **2 → 2**, Fin **1 → 2**, Clobber **0 → 0**, Corvina **1 → 0**. These small samples support retaining the modest proposed effects and gentler lower-level boss cadence; they do not justify precise difficulty claims. Counterplay is also checked directly through legal actions and the UI, rather than inferred from win rates.
