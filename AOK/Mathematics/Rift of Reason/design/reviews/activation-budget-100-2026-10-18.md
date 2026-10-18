# Shared card activations — #100, 18 October 2026

Each turn has two shared card activations: creature/tactic/axiom casts, attacks and manual Activate. The counting contract is recorded in DESIGN.md. Existing energy, readiness, Guard, attack limits and power/item restrictions still apply. No adventure progress or backup schema changed.

The validated action boundary charges once before resolution. Automatic Entrance/Last Word/passive/retaliation effects and required answers add no charge. Invalid input, cancelling a target selection and previews are free. A committed attack intercepted by a conditional still spends its use. Draw, End turn, Spark, Bag and hero powers are exempt. Rule changes preserve spent uses, including changes that reduce the total below the amount already spent. Unlimited removes only the shared limit. Momentum, Brainstorm and Think It Over use the same counter; next own turn resets spent uses and temporary bonuses.

The full lesson now has legal turn breaks after Counterexample/Underdog and after Filter plus attack, and four starting Granny hearts. Its reset is four rounds after the first flip so Filter remains a meaningful repair. Its deck supplies the extra draws. The short lesson keeps its prediction, independent rule/Filter/losing-attack choices, and safe retry. Seven changed spoken lines are listed in [voice-followup.json](activation-budget-100-2026-10-18/voice-followup.json); text and browser speech fallback work now. No TTS request was made: the daily allowance is exhausted until 09:00 Copenhagen on 19 October. Recording remains #43.

## Verification

- Focused tests first exposed the missing attack/Activate charge, then passed with the engine change. Regressions cover Swift, repeated attacks, Arrival, pending choices, free automatic effects, invalid third uses, changing totals, Unlimited, bonus uses and exempt items/Spark/powers.
- Both lessons replay through the real engine and mounted battle UI. Mounted regressions check pips decreasing after attacks, rejection of a third ready creature, the accessible exhausted-ability reason, and Danger limited to the next-turn allowance including qualifying Momentum.
- Actual browser keyboard play completed the short lesson: draw, cast, attack, reversed-goal prediction, independent Back to the Goal repair, turn break and winning attack. The Axiom dock displayed the remaining uses and the new wording. A separate full-lesson browser check reached its first attack plus cast and displayed zero of two uses. Escape closed Help and returned focus. See the committed Help, short-lesson victory and full two-use screenshots. This is desktop browser evidence, not classroom hardware feedback.
- Final complete tracked suite plus the new activation tests: **1,144 passed, one existing skip, zero failures (1,145 total; 300.9 seconds)**. Command: `node --max-old-space-size=2048 --test --test-concurrency=2` with the complete `git ls-files` test list and the new activation file explicitly. The initial run exposed two obsolete free-attack/three-use fixtures (updated to assert wakefulness separately or explicitly use Plenty) and an AI regression saving its board from imminent Fate. The latter was fixed, retaining the all-level schedule regression.

## Seeded balance

Reproduce with `node --test tools/test/battle-ai-behaviour.test.mjs`; its diagnostic reports [balance.json](activation-budget-100-2026-10-18/balance.json). Three hundred deterministic practice matches use random non-legendary teams and starter axioms, both first players, 200 Normal/Competent matches with seats swapped and 100 Normal mirrors.

| Measure | Normal | Competent |
|---|---:|---:|
| End turns sampled | 3,954 | 1,969 |
| Mean board size at end of own turns 1–3 | 0.93 | 0.93 |
| Ends with uses remaining but no legal card action | 673 (17.0%) | 326 (16.6%) |
| Ends despite an affordable legal creature cast | 0 | 0 |
| Mean unused energy, all ends | 3.04 | 3.12 |
| Mean unused energy when uses remain | 1.30 | 1.34 |

Mean match length: 20.74 individual player turns; maximum 41. Competent won 143/200 (71.5%). Every match finished. Normal played no twist victory rules. Unspent energy after exhausting card uses is expected under this economy; the actionable energy metric separates that from passing with uses available. Stalled ends include ordinary early turns with insufficient energy, not only dead boards.

AI values casts, attacks and abilities against both energy and uses, rescoring after every action. Normal/Competent use an approximate combination of each card's best current use; Expert additionally searches actual sequences. Threat forecasts cap attacks by the shared next-turn allowance. When a public wipe is imminent, saving a developed board has urgency so two attacks do not consume the use needed to delay it. Seeded tests establish a reproducible baseline, not student enjoyment or optimal strategy.

## Standards

Independent review found no documented coding-standard violations or actionable baseline smells. It requested the linked verification report, supplied here. Existing API names are retained and documented for compatibility.

## Spec

Independent review found two presentation defects: Danger ignored the new limit and exhausted abilities reported an empty effect. Both were corrected with mounted regressions. Follow-up review confirmed both fixes and the AI urgency change, with no remaining findings or scope creep.

Standards: zero remaining findings. Spec: zero remaining findings.
