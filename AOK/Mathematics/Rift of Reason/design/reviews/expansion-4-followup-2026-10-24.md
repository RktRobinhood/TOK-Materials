# #129 expansion-4 targeted comparison — 24 October 2026

Runtime remains [f5a13c1](https://github.com/RktRobinhood/TOK-Materials/commit/f5a13c165ca0b80d75efcf8bc97c7b2ebb07f3ef). This completes the comparison requested by the [expansion-4 acceptance report](expansion-4-2026-10-24.md) before another interacting batch. No card, cost, AI rule, saved progress, art, audio or quota changed. #129 stays open with 161 concepts held.

## Method and validation

`node tools/sim-expansion-4-followup.mjs 64` runs eight modes on three selected adverse fixtures, **64 seeds × both mono seats = 128 games per row; 3,072 games total**. Immutable published deck lists and the original seed tags, first-player schedule, deck identity and Competent AI are retained. Production and broad control reproduce the original first-16-seed aggregate wins/draws exactly. The published original did not store individual outcomes, so this is aggregate reproduction, not proof of individual historical transitions.

Each mode has a fresh engine context. Every deck is validated before that mode starts; each committed action checks single-zone membership. Full trial records include seed, mono seat, first player, winner and turn-limit result. All **3,072 games finish with a winner, zero draws and zero turn limits**. Each mode has 128 unique seed/seat pairs in each row.

The first run completed five modes (1,920 games) then stopped before the earlier-leads games because replacing Crow with Tom and Bunny with Niklas created illegal four-copy decks. No invalid game result was accepted. The replacement fixture was corrected and its missing mode run separately; the existing five outputs were retained. Two additional Reason-effect controls were then run because the planned ablations did not explain most of the Perception/Memory difference. This failed preflight and usage-interrupted review are not a runtime regression or completed-test claim.

Earlier leads now replace Crow with **Grant Sanderstag** (3-cost 2/2 → 4-cost 3/3), Bunny with **Mr. Beastie** (1-cost 1/2 → 4-cost 2/4), Dingo with **Susie Dentshell** (3-cost 3/2 → 3-cost 1/4). These earlier cards are absent from the compared lists, preserving two-copy limits and other slots. Colours/mono identity remain valid. This changes body, cost, ability and keywords together: **composition sensitivity, not isolated ability attribution**.

Raw outputs are in `expansion-4-followup-2026-10-24/`. `paired-analysis.json` matches each seed/seat/first between production and a variant. The delta is `(variant mono wins − production mono wins) / 128`; mixed→mono minus mono→mixed equals the net win change in every row. An unchanged winner does not mean an identical game. No independent-observation or classroom statistical claim is made from deterministic selected fixtures.

## Results

Mono share; each cell has 128 games:

| Variant | Perception vs Perception+Reason (neutral) | Memory vs Memory+Reason (Strong) | Language vs Language+Memory (neutral) |
|---|---:|---:|---:|
| Production | 0.3594 | 0.3828 | 0.5547 |
| All batch hooks off, spells as 1 damage | 0.7656 | 0.7031 | 0.7734 |
| No Bunny delayed draw | 0.3594 | 0.3594 | 0.6328 |
| No Dingo fight Shield | 0.3594 | 0.3828 | 0.5781 |
| Forked Reply as one hit, no heal | 0.4609 | 0.3359 | 0.6172 |
| Earlier creature leads | 0.3125 | 0.3984 | 0.3672 |
| No Crow Entrance at all | 0.5938 | 0.5234 | 0.5547 |
| Exact Answer as 1 damage | 0.6094 | 0.5469 | 0.5547 |

**The original signal persists.** Production minus broad control is now −0.4063, −0.3203 and −0.2188. Under paired seeds, broad control changes Perception outcomes 57 mixed→mono versus 5 mono→mixed; Memory 50 versus 9; Language 38 versus 10. Increasing the cohort did not make the adverse differences disappear.

**The Reason damage package matters in the two Reason-mixed rows.** Removing Crow's entire Entrance increases Perception mono share by 0.2344 and Memory by 0.1406. Reducing Exact Answer to 1 damage increases them by 0.2500 and 0.1641. This is stronger attribution than the original Crow-extra-colour-only ablation, which did not explain the shift. Both the ordinary Entrance hit and the conditional spell damage affect these matchups; separate changes cannot be summed as independent effects. Language contains neither Reason card and remains identical across both controls, including every trial winner.

**The novel timing hooks are not the main explanation in those rows.** Removing Bunny changes Memory mono by −0.0234; Dingo is absent there and gives identical results. Forked Reply changes Perception by +0.1016 and Memory by −0.0469; it is in both decks, so the interaction is not a uniform mono/mixed bonus. In Language-neutral, removing Bunny helps mono by +0.0781, Dingo by +0.0234 and Forked Reply by +0.0625; none alone reproduces the broad-control gap.

**Composition matters independently.** Replacing the three creatures leaves Perception/Memory near their production share but changes Language by −0.1875 (12 mixed→mono versus 36 mono→mixed). The substituted cards have different costs/bodies/abilities, so this cannot establish that one new hook is too strong or that a whole Way is weak. In particular, Memory's tested fixture still struggles against the mixed Reason package even with a different Memory creature.

## Disposition and next frontier

Keep the released contracts unchanged. This investigation shows matchup-sensitive removal/composition interactions, not a correctness/privacy defect or an endless strategy. Exact Answer still costs 2 and caps at 3, no stronger as direct damage than the pre-existing 2-cost Counterexample, while its positive-current-attack/enemy gates are narrower. Crow needs a legal target and a different-colour friend for its second damage. Target prevention, board composition, low health and limited activations remain counterplay. That is a bounded design judgment, not proof of global balance.

The required targeted comparison is complete. Preserve both baseline and follow-up outputs. The next small batch should avoid extending Reason's removal package; use existing support/recovery/defence seams, keep all six Ways represented, and compare to this exact baseline rather than silently rebuilding decks. New batch probes must again measure three wheel partners/mirrors; rerun these selected rows if it changes their involved effects. Any future cost/stat change needs its own stated rationale and verification, not an attempt to equalize one sampled rate.

## Publication and checks

Expansion-4 Pages run **40095773978 succeeded** for exact SHA f5a13c165ca0b80d75efcf8bc97c7b2ebb07f3ef. Public `data/creatures.js` returned HTTP 200 and Git blob **f996d20c9ea371be1a578d9cb90c945c8afb9b20**, matching that commit.

No runtime/test changed after the complete expansion-4 suite: **1,531 total / 1,530 pass / 1 existing skip / 0 fail**. That historical unchanged-runtime result is retained; it was not needlessly rerun for this simulation/report-only change. The new tool passes syntax, validates its decks, checks baseline aggregates and 3,072 actual games, and paired-output integrity checks pass.

## Standards

Independent follow-up method review clear after the illegal-deck fix. Fresh isolated contexts, immutable baseline reads, legal colour-preserving replacements and exact pairing schedule checked. First-16 assertions are correctly described as aggregate checks. Final review independently recomputed all 3,072 stored trials and 21 paired-analysis rows, including extra controls; counts, transitions, deltas and report claims agree. Syntax passes. No remaining actionable findings; no simulations/browser work rerun by reviewer.

## Spec

Independent follow-up method review clear: revised substitutions avoid duplicate-cap violations, requested ablations and full per-trial data are present, composition sensitivity is accurately bounded. Final review independently checked eight modes, all 3,072 trials and 21 paired-transition records; extra controls are justified and unchanged-contract/next-batch dispositions are supported. No remaining actionable findings. The earlier published release's reviews remain complete.
