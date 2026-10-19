# Relative Flux contract — #101, stage 1

Planning baseline: `590f6fc`, 19 October 2026. #100 is implemented. This document completes the first requested stage: composition, bounds, Unlimited behavior and an initial content/distribution matrix. **None of these modifiers, grants or distribution changes is implemented yet.** #101 remains open. Numeric tuning below is an initial builder decision to measure in the later engine/UI/AI release, not a classroom balance finding or another teacher approval gate.

## Current seams and compatibility constraints

- `js/battle/engine.js`: `RULE_DEFAULTS`, `memoFor`, `axiomWouldChange`, `setAxiom`, `fateEvent`, `playCost` and `startTurn`. Rules currently overlay absolute values from one active ID per category. The memo watches IDs: a repeated relative card must invalidate it even when that ID stays the same.
- `js/battle/ai.js`: `withAxiom`, `nextEventState` and `axiomValues` currently project replacements directly from IDs. They must consume the engine's effective projection before relative cards become obtainable.
- `js/screens/battle.js`: `axiomNote`, `ruleTile`, `axiomChanges` and `whyNotAxiomRule` need effective values/reasons. Collection/Help must distinguish a delta from a fixed total. Coordinate with #104; this contract does not claim its preview clips or redesigned arena are complete.
- `data/axioms.js`, `data/starters.js`, `State.ownedAxioms`, `State.axiomLoadout` and team-code validation control actual access. **Current construction permits ten axiom cards with at most two copies per ID**, not ten distinct IDs as the older issue body says. Preserve that implemented #112 rule.
- Existing IDs retain their meanings: `thrift` sets creature cost delta to −1; `luxury` sets it to +1; `study` sets draw count to 2; `abundance` sets growth to 2; `restraint`/`two-plays`/`plenty` set activation totals to 1/2/3. `infinity` remains the explicit Unlimited card. Do not silently turn an old absolute card into a relative one.

## Composition and timing

Each modifier changes **one shared numeric value**. For finite values, `after = clamp(before + delta, minimum, maximum)`. Both players read that same value. Temporary owner bonuses are added afterwards; they are never included in `before` or stored in the shared value.

| Category / field | Basic | Finite bounds | Meaning |
|---|---:|---:|---|
| `plays` / `playLimit` | 2 | 1…6 | Casts, attacks and manual Activate together, under #100 |
| `draw` / `drawCount` | 1 | 1…3 | Number taken from the selected own/shared deck in the normal draw choice |
| `energy` / `growth` | 1 | −1…3 | Change in energy capacity at the next own turn start; capacity still clamps to at least 1 and the configured cap (normally 10) |
| `cost` / `costDelta` | 0 | −2…2 | Adjustment to creature cast costs; each base cost still floors at zero before existing taxes |

The growth floor includes existing Steady State (0) and Diminishing Returns (−1); the existing capacity floor of one prevents a zero-energy lock. Cost modifiers do **not** alter tactic, axiom, item or ability energy costs. Draw modifiers do not alter Entrance/passive/item extra draws or make exhaustion happen per card: existing once-per-normal-draw-step exhaustion and hand limits remain.

A repeated modifier is legal whenever it changes the effective value. Examples: 2 → 3 → 4 from two +1 activation cards; 2 → 1 from −2 because of the floor. An unchanged result at a bound is not a legal paid cast, consumes no energy/use/card and explains the bound. Do not reject a repeated ID merely because it is already active.

Each committed paid modifier cast spends one activation and its printed energy cost **before** applying its result. It must be legal under the pre-change allowance: zero uses left cannot bootstrap a +1/+2 cast. A committed cast stopped by an automatic conditional keeps its normal #100 charge; cancelling an uncommitted selection is free. Uses already spent never change. With one use spent under a base of 2, casting +1 leaves base 3, spent 2, one left. Casting −2 instead leaves base 1, spent 2, zero left. With base 3, an owner's +2 bonus and one use spent, casting −1 gives shared base 2, owner total 4, spent 2, two left. The opponent gets shared base 2 and no borrowed bonus.

Changing growth affects future turn starts, not current capacity/refill. Changing draw count does not repeat a draw already taken. Changing creature costs affects future casts, not creatures already paid for. Momentum remains allocated at the start of its qualifying owner's turn; changing/removing its rule later does not retract an already allocated use. Brainstorm remains owner's current-turn bonus. A new own turn resets spent uses/temporary bonuses as #100 specifies. Think It Over uses the resulting unused allowance, capped at two cards.

## Unlimited, absolute replacement and reset

- Only activation allowance supports Unlimited in this matrix. A numeric delta against Unlimited changes nothing: paid cast blocked, with “Unlimited stays Unlimited; play a fixed limit to change it.” No infinity arithmetic, huge numeric substitute or bonus absorption.
- An explicit fixed finite rule (`restraint`, `two-plays`, `plenty`) replaces Unlimited with 1/2/3, then adds the current owner's temporary bonus. It also replaces the whole accumulated finite value. The same effective fixed value is a no-op.
- The latest successfully applied card ID remains the category's provenance; earlier replaced cards go to the finite shared discard exactly once. They are not an effect stack to rescan or return on reset. If deltas return a value to its basic value, show the category as basic numerically; a provenance ID is not evidence of a different rule.
- Fate evaluates a relative flip against the value **at resolution**, not the value when its card was set aside. Its preview shows “If this resolves now: before → after; later rule changes can alter this.” The announced card identity stays locked under #117.
- A free Fate delta that is ineffective at a bound/Unlimited is consumed to the shared discard, leaves the active value/provenance intact and reports why. It does not create a replacement conditional event or cost a player activation. The normal Fate cursor/event progression still happens.
- Fate reset and Spare Axiom clear all shared accumulated values and active IDs, restoring the basics. Neither refunds spent uses nor erases an allocated owner bonus. Pending scheduled/conditional effects keep their existing reset semantics. Normal paid-cast conditional hooks, targeted choices and automatic follow-ups retain #100's counting contract.

## State and projection seam to establish

Keep `axioms.active` as category → ID for current callers and card provenance. Add a battle-local resolved numeric record, for example `axioms.numeric[category] = { id, value }`; the record and active ID update atomically. Store finite integers or the explicit string `unlimited`, never raw JSON Infinity. Older battle fixtures without this record fall back to their existing absolute IDs/defaults. The resolved rule query may expose JavaScript Infinity, as it does now. No adventure save field is needed for a battle-local record; acquisition receipts belong in the canonical save.

Cloning and memoization must include the numeric record. Clone-apply, JSON round trip and two casts of the same ID must preserve values without changing the input. Validate modifiers against a whitelist of the four category/field pairs and integer deltas ±1/±2; unrelated fields do not become arbitrary mutation instructions.

Use one authoritative engine transition for paid casts, free Fate flips, effective projection and no-change reasons. Proposed interfaces are a pure `axiomPreview(state, id)` descriptor (category, before/after, changed, reason) and a pure projected-rule-state query for AI/lookahead. Projection spends nothing, fires no hooks, draws nothing, consumes no shared cards and alters no owner bonus. UI and AI must stop reconstructing relative rules independently. Concrete function names may follow repository conventions; these semantics are the contract.

## Initial content matrix

Sixteen **planned new common** IDs cover all four signs in all four categories. All ±1 cards cost 1 energy; all ±2 cards cost 2. Every cast also costs its one activation. Short names below are working student-facing names; give card text the category and applicable bounds.

| Planned ID | Working name | Category | Delta | Energy |
|---|---|---|---:|---:|
| `flux-plays-plus-1` | One More Move | plays | +1 | 1 |
| `flux-plays-minus-1` | One Fewer Move | plays | −1 | 1 |
| `flux-plays-plus-2` | Two More Moves | plays | +2 | 2 |
| `flux-plays-minus-2` | Two Fewer Moves | plays | −2 | 2 |
| `flux-draw-plus-1` | One More Card | draw | +1 | 1 |
| `flux-draw-minus-1` | One Fewer Card | draw | −1 | 1 |
| `flux-draw-plus-2` | Two More Cards | draw | +2 | 2 |
| `flux-draw-minus-2` | Two Fewer Cards | draw | −2 | 2 |
| `flux-growth-plus-1` | Grow Faster | energy | +1 | 1 |
| `flux-growth-minus-1` | Grow Slower | energy | −1 | 1 |
| `flux-growth-plus-2` | Grow Much Faster | energy | +2 | 2 |
| `flux-growth-minus-2` | Grow Much Slower | energy | −2 | 2 |
| `flux-cost-plus-1` | A Little Costlier | cost | +1 | 1 |
| `flux-cost-minus-1` | A Little Cheaper | cost | −1 | 1 |
| `flux-cost-plus-2` | Much Costlier | cost | +2 | 2 |
| `flux-cost-minus-2` | Much Cheaper | cost | −2 | 2 |

Reuse existing optional `limited-memory` (hand cap 3) and `momentum` (qualifying owner's +1 use) for the smaller group that adds dock entries, with their current effects/costs. These are existing optional categories, **not invented new mechanics**. Keep the explicit `two-plays` finite repair and rarer `infinity` special. Other legacy categories/cards remain available through explicit construction and compatible earned ownership. New modifier art can use existing category treatment initially; request missing distinct assets when implementing cards, without changing approved art provenance.

The four numeric categories each have one readable current-value entry, reused across all their modifiers, with a shared/owner distinction in the activation counter. Cost/draw may need promotion from today's optional tiles to baseline numeric entries; test the resulting compact/scrolling panel against #104 rather than adding one tile per modifier. Hand/bonus add at most two optional entries and disappear on reset. Hover, keyboard inspection, no-change reasons and Fate forecasts show effective before → after. Selecting/cancelling/previewing remains free.

## Initial distribution and acquisition policy to measure

This is a construction policy, **never a weighted draw**. Every constructed deck is fairly seeded-shuffled; neither rarity nor need can change the top card afterwards. Explicit player loadouts remain exact, including up to two copies per named rule.

- A generated eligible ten-card contribution samples **seven different modifiers uniformly without replacement from the sixteen**, adds `limited-memory` and `momentum`, then adds one repair/special slot: 25% `infinity`, otherwise `two-plays`. Shuffle the completed ten. This gives exactly 70% modifier slots, 20% optional-category slots, and an expected 2.5% Unlimited / 7.5% finite-repair slots. Two independent eligible contributions have an expected 43.75% chance of at least one Unlimited. These are deck-frequency expectations, not encounter or draw-frequency measurements.
- Introductory/default new-adventure contributions have zero Unlimited. Their repair/special slot is always `two-plays`. Initial fixed starter ten: plays +1/−1, draw +1/−1, growth +1, creature cost +1/−1, Limited Memory, Momentum, Two Moves. No random starter grant. Keep the introductory ten consistent across `data/starters.js`, `data.axiomDecks.default` and the no-saved-loadout fallback; the current earned-pool-first fallback must not accidentally substitute the old introductory mix. Preserve any explicitly selected loadout. Make all sixteen common modifiers available for ordinary explicit construction at release; retain other compatible legacy choices.
- Initial rare access: a one-time first win against the existing Chapter 2 Constable trainer grants `infinity` to `save.axioms`, with an idempotent flag receipt. Generated Constable/later-chapter opponents and an explicitly unrestricted practice profile may use the eligible special slot; earlier/intro opponents use the finite slot. This is a proposed release path to implement and measure, not an existing reward or dependency on packs/#131–#136.
- **Grandfather existing adventures before removing Infinity from the virtual starter pool.** `State.ownedAxioms` currently unions the global starter pool with `save.axioms`; simply removing an ID can invalidate old selections. At release, use a versioned, idempotent migration to preserve the old virtual pool as earned IDs for existing adventures before starter catch-up/deck validation. Fresh new adventures use the new pool. Keep old named IDs, exact saved loadouts, earned cards and ROR1/ROR2/team codes valid. Test old adventures with and without a selected Infinity, repeated imports, and new adventures separately. Allocate the migration version at implementation time; do not collide with another release.

Legacy owners can deliberately select two Infinity copies, so their decks need not follow generated percentages. Report them separately. Preserve that ownership instead of forcing old decks to meet a new frequency target. Named teaching/boss decks may keep required cards; inventory and report those explicit exceptions. Do not silently rewrite Granny's scripted draw order or an already submitted loadout to hit a ratio.

Opening-state tradeoff: both negative draw modifiers are ineffective while draw count is basic (1), and Two Moves is ineffective while activation allowance is basic (2). Uniformly sampling seven of sixteen gives an expected 0.875 initially ineffective modifier cards per contribution (8.75% of all slots); 70% of contributions contain at least one of the two negative draw cards. Including the finite repair slot, the expected initial no-op share is 18.75% for the introductory profile and 16.25% for the eligible profile. Those cards can become useful after rules change; these are static construction facts, not stalled-turn measurements. The first runtime balance pass must specifically test this tradeoff before adopting the proposed distribution, including the fixed starter's negative draw/finite repair cards. Adjust construction/tuning if needed; never reroll a submitted card or the top of a shuffled deck to hide it.

## Implementation slices and acceptance evidence still required

1. **Completed here:** this reviewed contract/matrix, algebra cases and a seeded construction-policy experiment. No shipped gameplay change.
2. Implement one complete activation-modifier slice at the real engine seam: repeat/saturation/Unlimited/finite repair/reset, clone/JSON/memo, owner bonus/spent counts, pending hooks, Fate/no-change behavior, UI/AI agreement. Keep cards bench-only until those paths agree; preserve old IDs. Then extend the same transition to draw/growth/creature costs and test timing/taxes/exhaustion.
3. Populate/grant cards and apply migration, starter/NPC/preset policy. Exercise real backup/team-code compatibility, acquisition receipts, all deck validators, both lessons and actual browser controls. No parent dependency is satisfied by a rarity field alone.
4. On the actual implementation, run construction/draw-frequency sampling and seeded matches at all AI levels, reporting modifiers/Unlimited, early development, stalled turns, actionable unspent energy and match length against the #100 baseline. Compare eligibility profiles, legacy/custom decks, conditional/Fate interactions and saturation dead cards. Retune bounds/costs/25% eligibility sampling if needed; explain any revision here. Classroom feedback stays a later observation, not an approval gate already delegated by the teacher.

Only close #101 when every acceptance item is implemented and verified. This stage does not close it or claim a gameplay/playtest result.
