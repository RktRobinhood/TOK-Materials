# Playable Card Arena layout study — 12 October 2026

Ready for teacher layout review under #107, with reference and measurement evidence for #106. These are disposable development matches on Rift's actual battle screen and engine. The production game has not been switched to a new layout.

## Try the layouts

| Layout | Playable study | Reason to choose it | Tradeoff |
|---|---|---|---|
| **A — Duelling table (recommended)** | [Open A](https://rktrobinhood.github.io/TOK-Materials/AOK/Mathematics/Rift%20of%20Reason/dev/battle.html?prototype=1&variant=A&fixture=normal&seed=board-study-107) | Compact board portraits leave the battlefield visible. Complete card text and Active effects have a right-hand inspector. | Small portraits favour inspection. Crowded hand text remains dense. |
| B — Command board | [Open B](https://rktrobinhood.github.io/TOK-Materials/AOK/Mathematics/Rift%20of%20Reason/dev/battle.html?prototype=1&variant=B&fixture=normal&seed=board-study-107) | A vertical hand library stays separate from the battlefield. | Scrolling and narrow hand cards cost time and readability on smaller laptops. |
| C — Study desk | [Open C](https://rktrobinhood.github.io/TOK-Materials/AOK/Mathematics/Rift%20of%20Reason/dev/battle.html?prototype=1&variant=C&fixture=normal&seed=board-study-107) | A broad left inspector favours reading. Fate/actions sit below both boards. | Less horizontal battlefield space; crowded cards are smaller. |

Bottom arrows switch layouts without restarting. **Situation** offers normal, crowded (six own/seven enemy creatures and eight opening hand cards), effects, required-question, short-lesson and full-lesson fixtures. Drawing in the crowded fixture produces nine hand cards. These prepared examples never write student progress. The ordinary bench still works without `prototype=1`.

Select a glowing deck, select/play a hand card, select a ready creature and a legal target, activate Kim's Filter, play an axiom, then End turn. Axioms opens the actual rules/log panel. Inspection responds to pointer, click and keyboard focus. Future glimpse is a collapsible reservation for #108's outcome clips; it does not simulate hidden draws.

## Screenshots

![A, crowded board after drawing, 1280×720](board-traces-2026-10-12/A-crowded.jpg)

![A, nine-card hand, 1024×768](board-traces-2026-10-12/A-laptop-crowded.jpg)

![A, stacked effects and conditional colour bonus](board-traces-2026-10-12/A-effects.jpg)

![Required prediction with current Win axiom](board-traces-2026-10-12/A-question.jpg)

[B crowded](board-traces-2026-10-12/B-crowded.jpg), [B laptop](board-traces-2026-10-12/B-laptop.jpg), [C crowded](board-traces-2026-10-12/C-crowded.jpg).

## Verified behaviour

- All retained traces completed real draw, play, attack/defeat, Filter, axiom change and End turn/Fate. No action was skipped; committed events include attack and defeat, respecting Guard in the crowded fixture.
- Manually drew from the visible deck, dragged Kim from hand to board, and selected Tremendoodle/clicked a legal enemy to resolve combat. Keyboard draw/card selection also worked. Fixed an adapter bug that could remove the focused deck button during inspection.
- Viewed A/B/C at 1280×720 and 1024×768. Refined spacing and separated READY labels from modifiers. A's nine-card laptop hand leaves energy visible. Inspections scroll instead of enlarging cards over targets. Physical touch/mobile layouts remain unverified.
- Effects use `Engine.describe/attackParts`. Beansprout shows stacked +2/-1 attack and max-health changes, cost axiom, source/duration explanations and target-dependent colour bonus. Illustrative temporary buffs are labelled “fixture”.
- Required questions use the actual coach/answer handlers in a native modal. Wrong answers give real feedback; Escape does not advance. Correct prediction advances to the independent experiment. The current Win axiom is readable inside the modal; ongoing guidance stays beside the board. Short/full entries load real lesson sources; complete walkthroughs remain for integration QA.
- Calm motion uses an opacity draw cue and existing battle treatments. No console errors observed in checked states or ordinary bench. Scratch State hooks intercept save/statistic writes; production State is unchanged.
- Final `node --test "tools/test/*.test.mjs"`: **804 passed, one skipped, zero failed** (805 total). `node --check dev/arena-prototype.js` passed.

## Desktop measurements

Fixed seed `board-study-107`, 1280×720, warmed images. Desktop: i7-6700, 16 GiB RAM, RX 580, Chromium 154. Times in milliseconds. Input max is the maximum of ten synthetic click-to-first-DOM-feedback samples, not physical input-to-displayed-pixel latency.

| Capture / raw JSON | Frame p95 | Frame p99 | Worst | Frames >33.34 / >50 | Input max |
|---|---:|---:|---:|---:|---:|
| [Current, normal](board-traces-2026-10-12/baseline-normal-normal.json) | 18.2 | 35.2 | 36.1 | 5 / 0 | 47.6 |
| [Current, crowded](board-traces-2026-10-12/baseline-crowded-normal.json) | 18.1 | 42.6 | 72.0 | 9 / 4 | 51.8 |
| [Current, crowded Calm](board-traces-2026-10-12/baseline-crowded-calm.json) | 18.2 | 36.0 | 54.2 | 9 / 3 | 46.0 |
| [A, normal](board-traces-2026-10-12/A-normal-normal.json) | 16.8 | 16.9 | 50.0 | 3 / 0 | 37.1 |
| [A, crowded Calm](board-traces-2026-10-12/A-crowded-calm.json) | 16.8 | 33.3 | **100.3** | 4 / 3 | 30.4 |

Single-run observations establish a repeatable local baseline, **not a performance improvement claim**. Captures were taken at different times with different observed frame cadence. A still has slow frames. Every original card node was gone after each recorded action/selection: rearrangement retains the production renderer's rebuild problem.

Raw JSON includes long-animation-frame blocking/render/style-layout data and action coverage. It is not a complete DevTools paint breakdown or continuous-drag benchmark. See [reference audit](board-reference-audit-2026-10-12.md) for licence, motion inventory, limits and provisional integration budgets. #106 remains open for representative school-laptop profiling and fuller layout/paint evidence.

## Teacher decision and remaining checks

**Teacher selected A on 12 October 2026, with the changes below.** B wastes space on the side; C is compressed and confusing. A's symmetrical battle-board structure is the approved direction, not its permanent card-inspection column. No redesign issue is closed by this study.

### Teacher feedback for the next iteration

- Put the player's deck directly above their energy and the opponent's deck directly below theirs, mirrored at the right edge of the battlefield. Show each owner's selected card back at a useful scale. Move the shared Axiom deck to the left of the central area, as marked in the teacher's annotated screenshot.
- Use the right-hand column for the persistent **Axioms** panel: the changing shared rules are a core game layer. Restore contextual enlarged card hover/inspection instead of dedicating that column to one card. Preserve click/touch/keyboard inspection and readable Active effects without covering targets or the selected action.
- Keep only essential names, values and keywords readable on compact board cards. Reduce the competing labels above them; give complete ability/effect text more room in contextual inspection. New frames are an option if layout changes cannot solve compressed text.
- Make Guard obvious with a substantial shield-shaped background/backplate. Distinguish it from Shield's protective bubble: Guard redirects attacks; Shield absorbs damage. Both should remain readable at comparable scale, including when a creature has both.
- Make the Fate track visually more interesting and easier to inspect: upcoming nodes show an effect icon/card and a hover description so players can plan.
- Proposed Fate mechanics: players/creatures can schedule deferred abilities, spells/tactics or creature events onto spaces; a jump may bypass an enemy's planned space; rewinding and re-entering a +1/+1 space can trigger it again. These are new engine mechanics, not features already implemented by this prototype.

### Deterministic schedule and turn cycles — teacher follow-up

- Scheduled Fate events should be knowable in advance: their effect, countdown and relevant source/board/enemy relationship are visible. A reset, new axiom or specific rule change is announced before it happens. Deterministic must mean a player can plan from the displayed information, not merely that a hidden random generator has a fixed seed.
- Ordinary Fate movement happens **once per full turn cycle**: first player's turn, second player's turn, then Fate advances/resolves. Label countdowns in cycles/rounds to avoid the current ambiguity between individual turns and both players' turns. Card-driven jumps/rewinds remain explicit exceptions.
- A scheduled board wipe two cycles ahead is an example of a deferred spell/tactic. The visible event should identify what is affected and when; no new timing rule is implemented yet.
- Proposed implementation: freeze the announced event's identity when it is scheduled. Drawing from the shared deck should not silently replace an already announced future rule. Explicit changes to scheduled events must update the preview visibly.

### Deck exhaustion — direction and unresolved details

- Teacher direction: an empty shared Axiom deck alone is not punitive; there are no new rules available to draw. An empty personal deck can still use the shared Axiom draw.
- Proposed exhaustion damage starts only when that player's personal deck **and** the shared Axiom draw source are empty. The opponent's personal deck does not determine that player's exhaustion.
- Suggested implementation, not approved tuning: automatically apply increasing damage (1, then 2, then 3…) at the player's normal draw step when both sources are exhausted. Full hand capacity is not deck exhaustion; extra-draw abilities or choosing a time action must not multiply or evade the normal exhaustion check.
- Current engine has no fatigue counter and does recycle shared Axiom discards. Whether shared depletion is permanent or discarded rules can refill it must be settled; permanent depletion better matches the teacher's “no more rules left” description, but is a proposed change.
- **Teacher approved:** exhaustion damage follows the active Win axiom, including winning at zero of your own hearts. Deliberately exhausting the decks/damaging yourself under that axiom is a legitimate strategy.

### Deck copies, spell eligibility and teaching — teacher follow-up

- Teacher direction for ordinary deck construction: each player contributes ten Axiom cards, with at most **two copies of the same Axiom** in their own contribution. Limits concern card identity, not Axiom category. Two players' contributions can therefore yield four copies of one rule in the combined twenty-card shared deck.
- Personal decks contain twenty cards total, with at most **two copies of any one creature or spell/tactic**. Creature copies should count by species rather than collection-instance UID; this is a deck limit, not an ownership/collection limit. Scripted lesson decks need review because some current examples contain more than two copies.
- Non-generic spells require a friendly creature of the matching type in play. Interpret type as **current creature colour**, matching the existing tactic system. Losing the last matching creature blocks those spells until the colour is restored on the board; generic spells have no colour prerequisite. Energy, targets and current Axiom rules still apply.
- The engine already enforces the live colour prerequisite, and tactics already have a two-copy cap. Axioms currently require ten distinct choices, so their builder/selection/validation must change to support counts; creature deck limits also need implementation and validation.
- The engine currently also filters colour tactics at construction unless the team contains that colour. Clarification pending: keep this construction restriction as well, or allow any unlocked spell in a deck and gate only casting by the live board? Teacher's “you may play any spell” wording suggests the latter, but this is not yet settled.
- Teach by interaction: use a generic spell with no creature, play a coloured creature, cast its colour spell, lose the last matching creature and inspect the now-blocked spell, then restore a matching creature and cast again. Explain the two-copy limits in the deck builder and provide a clear reason beside blocked spell cards.

### Fate rule still to settle

The current `shiftFate()` changes the countdown to the next automatic axiom flip/reset. Moving back delays that event; it does not revisit a stored event or undo previous effects. A genuine timeline therefore needs explicit positions, scheduled event ownership, landing/skipping rules, retained history and effect expiry.

Teacher clarification pending: should every scheduled event replay on re-entry, including creature summons, or should events distinguish one-shot and repeatable behaviour? Recommendation: one-shot events by default, with explicitly repeatable spaces for the proposed rewind/buff interactions. Preserve the current engine until those semantics are settled; board/Axiom layout refinement can proceed independently.

#109 should port only the selected structure, preserve keyed hand/board nodes and keyboard focus, synchronize stats/effect explanations, and coordinate a cancellable queue with #66. #108 owns actual future clips; #103 owns production required-question behaviour.

Before production acceptance: real browser zoom, representative laptop/physical touch, complete short/full lessons, saved encounters and Chapter 4 action flows. Browser policy blocked `file://` navigation, so offline interactive play could not be verified here. The study uses classic scripts/local assets with no new fetch/module/build dependency. #110 remains the school-playtest stage.
