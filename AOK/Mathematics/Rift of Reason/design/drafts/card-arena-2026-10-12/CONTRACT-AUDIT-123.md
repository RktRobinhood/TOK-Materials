# 210-contract review and foundation release — 21 October 2026

This review completes the creative/contract pass requested by #123 and releases one small batch. It does **not** implement all 210 concepts. The catalogue keeps exactly 28 concepts per colour plus 42 generic, 72 creatures/84 spells/54 Axioms, and 92 common/60 uncommon/37 rare/14 Mythic/7 legendary. All 18 story-only contracts remain permanently excluded from packs. There are 192 eventual pack candidates, not 192 currently usable pack rewards.

## Method and retained distinctions

Read every proposed effect against the shipped creature ability, tactic and Axiom texts and the other drafts. Compare trigger, target, choice, payoff, lifetime and resource limit, rather than names, colours or stats. Shared primitives such as Guard, one-point healing and damage are allowed when the surrounding decision changes. The authored `review-123.mjs` records 23 replacements, their previous text, reasoning and revised persona links. Stable IDs, allocations, selected art, costs, stats, rarities and acquisition channels are retained. Regeneration of catalogue/persona files is repeatable.

`CONTRACT-REVIEW.json` indexes all 210 retained contracts and their release hazards. It is a review ledger, not a semantic-uniqueness algorithm or balance proof. Distinct text checks prevent exact duplicate sentences; human review makes the mechanical judgement. No unimplemented draft is certified against every possible engine interaction.

The replacement groups are:

- Vanilla/keyword bodies: Tom's conditional public cheap-spell reveal, Bill's outnumbered Shield, Dua's once-per-match extra fight, Simone's last-heart landing, David's post-hero-attack exposure, Emma's Last Word hand reveal, Luka's matching-stat self-swap and Niklas's Last Word discard-to-top each add a different decision/persona joke.
- Simple spells: Small Lemma rewards equality, Hold the Floor thaws/heals a frozen guest, Careful Wording removes one temporary debuff, Follow Through needs a prior hero attack, and Cool Down redirects aggression towards creatures. These replace Careful Words/Stand Firm/Pep Talk/Notice the Crack/Settle Down number-only overlaps.
- Delayed spells: Tomorrow's Rally becomes risky hero-attack pressure; Tomorrow's Address becomes one consumed Axiom-to-draw permission. Neither is another Scheduled Speech team buff.
- Shared rules: Long View rewards an actual completed one-shot with bounded unreserved information; Shared Nerves uses relative hearts; Clear Timetable uses prepared plans to filter a normal draw; Careful Hands bottoms the highest-cost card; Open Slots snapshots a full board at turn start. They replace Patient Plans/Doubt/Open Calendar/Limited Memory/Small Armies variants.
- Construction/live colour: Jack gets the explicitly named mono bonus; Small Patch gets a mono alternate amount; Counterexample Crow gets one capped mixed-board bonus damage packet. Crow remains held. These are authored card effects, not universal bonuses.

## Foundation-1: seven common runtime cards

| Way / release | Distinct hook and persona | Normal source | Response / bound |
|---|---|---|---|
| Reason · Tom Skink | One small premise: publicly reveal the actual top card; draw only a printed-cost ≤1 spell | Forest Road catch | May reveal an unhelpful card; normal hand cap/energy/uses; no second card |
| Emotion · Simone Bearles | Landing fills the last missing heart → Shield | Pattern stall catch | Already full gives no Shield; small hits consume it; normal Win rules |
| Perception · Nikkie de Jaguar | One private closer look; leave the card there | Witness stall catch | No draw/reorder, no opponent identity leak; empty deck is quiet |
| Language · Jimmy Fowlon | Let another frozen guest speak | Gallery stall catch | No self-target; sleep/spent attacks/activation use remain; no target is a harmless Entrance |
| Imagination · Jack Blackbird | Dramatic ally stat swap; mono adds max-health/healing | Troll Bridge catch | Balanced bodies reduce value; mixed result can be fragile; normal swap/cleanup rules |
| Memory · John Greenfinch | Keep the newest actual discarded spell on the bottom | Old Well catch | No extra copy, immediate draw or choice of best older spell; normal later draw/cost |
| Generic · Small Patch | Heal2, or3 in a mono deck | Checked River Ford reward, once | Damaged friendly target; no max-health growth; receipt survives reload/import |

Each creature uses its already shipped selected portrait under its stable mechanical ID. Small Patch uses the existing generic spell motif. Normal play/heal/block/reveal cues are reused; no art requests or audio generation are needed. New faces intentionally have no spoken lines. Existing recordings, manifests and quota ledgers are unchanged.

## One mono sequence and mixed bridge per Way

These are demonstrated engine/board sequences and legal deck probes, not promises of equal win rates. Each colour's probe uses an actual legal twenty-card personal deck and ten shared Axioms, two-copy limits and matching spell quotas.

| Way | Mono sequence | Mixed bridge |
|---|---|---|
| Reason | Tom can reveal/draw generic Small Patch; a mono Patch heals3 after a careful trade | Cheap generic spells remain drawable in a Reason/Language deck; Patch heals2 |
| Emotion | Simone restores the last missing heart and gains Shield; mono Patch repairs a damaged supporter | Shield gives a fragile Imagination attacker time; hero healing does not reset attacks |
| Perception | Nikkie reads the next draw without spending it; mono Patch preserves an exposed defender | Information still works with Reason control; no mono requirement on inspection |
| Language | Jimmy thaws a ready ally; it can use only its remaining ordinary attack/activation | A frozen attacker of another colour is a legal guest; new/sleeping guests remain asleep |
| Imagination | Jack turns a 1/4 ally into4/2 after its mono bonus | The same target becomes4/1 mixed: useful pressure with greater fragility |
| Memory | John puts the newest spent spell at the bottom; later ordinary draws recover that same instance | Recover a spent spell of another colour without creating a free cast or bypassing quotas |

Mono is public at match start and fixed from the submitted personal deck. Generic-marked and absent-colour cards do not break it; at least one explicit colour is required. Memory is the sixth colour. Shared Axioms, later draws, control transfers, board colours and temporary transformations do not recalculate identity. No live-different-colour engine modifier is introduced for the held Crow.

## Loop and information review

All six hooks are Entrances. Re-entry requires another legal paid play and an available activation; no self-return, free cast, refund, discount or repeated automatic listener is added. Empty Set suppresses the Entrance and removing it does not retroactively fire it. Tom and John move an existing card through normal zones; John bottoms rather than immediately drawing/casting. No token generator, turn lock, victory rule, pending Fate occurrence or copy/replay handler ships in this batch. These bounds preserve finite fun combinations without inventing new policy.

Zero-attack Jack targets use the existing swap representation (max1/damage1). A mixed target dies at cleanup; mono adds max1 then heals1 before cleanup, leaving2 health. No engine stat semantics were changed. Empty source and no-target paths are tested. Preview stops before the unknown top card; real committed reveals may expose it. Prospective AI planning skips new inspection side effects and values them at a small fixed amount, preserving decisions under hidden-order permutations at all three levels. Planning never marks the actual battle.

Future resource, discard, replay, token, information, lifetime and Win hazards are indexed per contract. Closed prerequisite issues do not supply missing card handlers. Fate cards still need original occurrence/expiry, skip/rewind/cancel and terminal-queue tests; alternative goals need explicit ties/terminal rules; tokens need finite generation/board-capacity/order; reaction cards need their spell-reaction gate. No automatic release follows from this review.

## Continuation under #129

The other **203** concepts remain held. Keep each subsequent batch small, test and measure it before choosing the next. #130 owns consistent Mythic presentation; #132 owns exact story-only grants/exclusion; #136/#134 own atomic packs and reveal. None may draw an unimplemented catalogue ID. Later #129 content batches must explicitly choose IDs, implement their hooks and sources, run the same edge/loop/mono/mixed checks and record release metadata. Conditional #148/#149 is a separate set. This resolves #123's draft/audit/first staged release brief while preserving the larger implementation map.

Measured play, browser evidence, review and full-suite receipts are in [the acceptance report](../../reviews/expansion-123-2026-10-21.md).

## Expansion-2 under #129 — 22 October 2026

The second staged batch follows the rules above. It releases eight IDs as `expansion-2`, ledgered in `review-129.mjs`:

- `reason-diagonal-deer`, a Rare
- `emotion-resolve-ram` and `perception-scout-stoat`, both Uncommon
- `language-label-lemur` and `imagination-possibility-pika`
- the spells `emotion-share-the-feeling`, `memory-remember-the-guard` and `generic-warm-blanket`

Each has a real handler, a pack source (creatures also have one ordinary chapter-two catch), its existing portrait or motif and shared sounds. No voice is added.

Three contract texts are clarified without changing their meaning: the deer compares attack after it is on the board, the stoat's look is private, and a Shield still counts as surviving Share the Feeling.

Edge, re-entry, information, source and backup tests, paired mono/mixed games against a mono mirror, and real-board browser commits are in the [acceptance report](../../reviews/expansion-2-2026-10-22.md).

**177 concepts remain held.** The next batch is suggested in that report. The same exclusions stand: Fate timing, alternative Win goals, tokens and reaction cards.


## Expansion-3 under #129 — 23 October 2026

The third staged batch follows the same rules. It releases eight IDs as `expansion-3`, ledgered in `review-129.mjs`:

- `reason-proof-by-cases`, a Rare
- `language-definition-dolphin` and `imagination-mirror-marten`, both Uncommon
- `emotion-cheer-chick` and `memory-archive-armadillo`
- the spells `reason-check-the-premise`, `perception-focused-hit` and `generic-simple-cover`

Each has a real handler, a pack source (creatures also have one ordinary chapter-two catch), its existing portrait or motif and shared sounds. No voice is added.

Four contract texts are clarified without changing their meaning: the dolphin skips a creature that already has Guard, the marten measures once on the board and never lowers its own attack, the armadillo's Last Word also happens with a full hand or Mercy, and Proof by Cases offers only a case that can happen.

Edge, re-entry, information, source and backup tests, paired mono/mixed games against three partner Ways from the colour wheel and a mono mirror, and real-board browser commits are in the [acceptance report](../../reviews/expansion-3-2026-10-23.md).

**169 concepts remain held.** The next batch is suggested in that report. The same exclusions stand: Fate timing, alternative Win goals, tokens and reaction cards.

## Expansion-4 under #129 — 24 October 2026

Eight IDs from expansion-3's recommendation are now `expansion-4`: `reason-counterexample-crow`, `reason-exact-answer`, `emotion-grudge-goose`, `perception-notice-the-crack`, `language-debate-dingo`, `imagination-paradox-pony`, `memory-bookmark-bunny`, `generic-forked-reply`. All six Ways plus generic, 1 Rare/3 Uncommon/4 Common. Each has a real handler, pack source, existing portrait/motif and shared sounds; the five creatures also have ordinary chapter-two catches. No voice/model requests.

`reviewExpansion4` preserves previous text/rationale while pinning explicit-colour qualification, positive-attack targets, effect-only Last Word ordering, one-fight effective-attack Shield, normal temporary-swap semantics, the exact delayed-draw/controller/suppression window and distinct two-enemy choice before deferred cleanup. Timed-health expiry now resolves defeats/Last Words before start bonuses/draws, verified with a lethal regression.

Acceptance: [expansion-4 report](../../reviews/expansion-4-2026-10-24.md), 19 focused checks, full 1,530 pass/1 existing skip/0 fail, independent Standards and Spec reviews, sources/canonical backups and 27 native outcomes. Three paired 768-game runs include hook control and Crow-bonus ablation. Two −0.375 fixture shifts exceed the earlier noise band; retain them explicitly. Builder accepts bounded single-player release with counterplay and no single-rate tuning; the next interacting batch must finish the targeted comparison in the report. No classroom balance claim.

**161 concepts remain held.** #129 stays open; Fate/alternative Win/token/reaction exclusions remain.

The [targeted follow-up](../../reviews/expansion-4-followup-2026-10-24.md) is complete: 64 seeds per seat, three selected rows, eight variants, 3,072 games. Persistent fixture shifts are partly attributed to the Reason damage package; broader colour viability is not certified. Earlier-card substitutions are legal composition-sensitivity checks with body/cost differences disclosed. Runtime/contracts remain unchanged. Preserve the baseline and prefer support/recovery/defence for the next small batch.


## Expansion-5 under #129 — 25 October 2026

Eight held support spells are released: reason-small-lemma, emotion-second-heartbeat, perception-practical-observation, language-careful-wording, imagination-borrow-the-shape, memory-clear-reminder, generic-balanced-exchange, generic-take-stock. All six Ways plus generic,4 Common/3 Uncommon/1 Rare, ordinary packs only. Existing motifs/shared cues, no new creature/catch/voice/model requests. Original text and clarification rationale remain in review-129.mjs/generated catalogue. **153 concepts remain held.**

[Acceptance](../../reviews/expansion-5-2026-10-24.md):19 new focused tests; full1549pass/1existing skip/0fail;30 native outcomes and desktop/390px production pack flows. Privacy fixes include complete opponent-view equivalence for private bottoming and opaque hypothetical AI draws with known public recoveries preserved. No actual adventure or voice ledger changed. Screenshot service failed; no new PNG/motion-recording/physical-device claim.

768+768 paired support-hook games and768 targeted64seed/seat games retain adverse Perception-neutral/Reason-weak shifts and finite60turn guard draws. Small Lemma contributes to the former. No numeric tuning or global balance claim. Separately96 original expansion4 trials reproduce all winners under currentAI; earlier baselines remain untouched. The targeted comparison is complete; avoid further Reason reinforcement in the next slice. #129 remains open.

## Expansion-6 under #129 — 25 October 2026

Eight held utility/counterplay spells are released: emotion-honest-hurt, perception-read-the-room, language-plain-words, generic-quick-study, emotion-cost-of-courage, language-read-the-fine-print, memory-return-to-the-plan and emotion-outburst. Four Common / three Uncommon / one Rare, ordinary packs only, existing motifs/shared sounds. This batch omits Reason/Imagination reinforcement; overall catalogue allocations remain unchanged. **65 implemented / 145 held.** Pre-lesson pack kinds: 29 Common / 13 Uncommon / 5 Rare, prices/weights unchanged.

`reviewExpansion6` preserves original text and exact clarification rationale. Self-heart loss is an ordinary printed effect, followed by deferred defeat/Last Word/Win resolution. Private inspection reveals only its permitted information to its owner. Temporary attack-component removal preserves health/expiry. Return to the Plan excludes the exact casting CID, allows another copy of the same spell and preserves replay costs/shared activations.

[Acceptance](../../reviews/expansion-6-2026-10-25.md): 13 focused checks, full 1,562 pass / 1 existing skip / 0 fail, canonical ownership/backups, 33 native board outcomes and two actual scratch pack flows containing Outburst. Screenshot provider failed; DOM/state evidence does not establish visual-motion or physical-touch acceptance. No actual adventure, model/voice quota or original OneDrive work changed.

Two 768-game cohorts and 1,152 extended 64-seed/seat games retain material Reason-strong, Perception-weak and Language-weak shifts. Outburst partly explains the Emotion-mixed rows; a further 128-game Fine Print ablation contributes to Perception/Language. Separate controls are not additive, and no costs/stats/AI were tuned. One initial control game reaches the finite 60-turn guard; extended cohorts have no draws. All 64 exact earlier expansion-5 sampled winners reproduce. Preserve baselines and avoid extending Reason reinforcement or cheap Silence/removal next. #129 remains open; unchanged Fate/alternative Win/token/reaction exclusions apply.

## Expansion-7 under #129 — 25 October 2026

Eight resource/choice spells are released: emotion-careful-cheer, imagination-bright-possibility, memory-keep-the-note, memory-familiar-path, generic-spare-spark, generic-fair-trade, generic-repair-the-shield and generic-one-last-draw. Six Common / one Uncommon / one Rare, ordinary packs only, unchanged overall allocations and 18 story exclusions. Existing motifs/shared sounds, no new creatures/catches or art/voice requests. **73 implemented / 137 held.** Pre-lesson pack kinds: 35 Common / 14 Uncommon / 6 Rare, unchanged weights/prices.

`reviewExpansion7` retains original texts and clarification rationales: current-board healing, serialized choice with correct expiry, exact-instance bottom recovery, base creature cost including permanent Changes before current rules/taxes (explicitly different from Cameo), current-energy-only gain, private caster-first draws, normal Shield/Silence and deferred self-loss/Win. No central engine/AI or save-schema change.

[Acceptance](../../reviews/expansion-7-2026-10-25.md): 13 focused checks; full 1,575 pass / 1 existing skip / 0 fail; canonical copies/backups; 33 matching native outcomes and two scratch packs containing One Last Draw. Screenshot provider previously failed; no new visual-motion/physical-device claim. No actual save, quota ledger or original OneDrive changes.

Corrected 768+768 legal-deck probes, 768 targeted 64-seed/seat games and two distinct 384-game Reason-mirror compositions retain real limits. Repair's whole payoff (including healing) contributes to the persistent Memory/Reason shift and 38/128 resource-mirror draws versus 25/128 control; replacing two draw tools with Counterexample/Pep Talk gives 1/128 versus 11/128 in that separate composition. Costs/effect roles/seed tag differ; no additive or isolated-mechanic inference. Initial rejected four-copy Memory fixtures are separately preserved, never pooled. All 96 exact earlier expansion-6 winners reproduce. No tuning or global/classroom balance certification. Preserve baselines and prefer bounded keyword/Shield counterplay next; #129 remains open.

## Expansion-8 under #129 — 25 October 2026

Eight keyword/positioning spells: perception-expose-the-shield, language-ask-again, language-hold-the-floor, generic-settle-down, perception-strip-the-illusion, imagination-try-another-shape, generic-clean-cut and imagination-impossible-position. Six Common / two Rare, ordinary packs, existing motifs/shared sounds. **81 implemented / 129 held**; pre-lesson kinds: 41 Common / 14 Uncommon / 8 Rare. Weights/prices and the 18 story exclusions are unchanged.

`reviewExpansion8` retains original text/targets and explicit revisions. Ask/Strip reach Elusive through the established seen-enemy seam. Strip removes temporary stat rows including Fate-lifetime boosts without cancelling the event, removing ability text or altering lasting Changes/damage/Freeze. Hold thaws without readying. Stat swaps preserve authoritative raw/timed semantics, distinct serialized targets, controllers and later boosts. Clean Cut requires an actual colourless token. Production runtime only changes tactics.js; no engine, shared AI, save schema, new art, voice or quota change.

[Acceptance](../../reviews/expansion-8-2026-10-25.md): 13 focused checks; full 1,588 pass / 1 existing skip / 0 fail; 36 native outcomes / 32 layout measurements; two scratch packs with Rare Strip, 50 Coins paid and 70 left. Screenshot capture failed; no new PNG, motion-quality or physical-device claim.

Two 768-game cohorts, 768 targeted games and 384 Reason mirror games retain a material Perception/Reason interaction (35/128 wins vs 3 control / 2 without Strip). The initial Language difference shrinks with more seeds. Mirror draws: zero production vs 36/128 control and zero without Clean Cut. This does not attribute the result to Clean Cut alone or erase the earlier resource-heavy draw risk. Eighteen initial draws plus one new extended draw reproduce exactly; all 64 sampled original expansion-7 winners are unchanged. No numeric tuning or global/classroom balance certification. #129 stays open with 129 held; prefer independent contracts before further developed-board control/sustain, preserving prior raw evidence and policy gates.

## Expansion-9 under #129 — 25 October 2026

Eight inspection/utility spells shipped in e2d715f: reason-work-it-out, emotion-quick-courage, perception-follow-the-clue, language-a-better-label, language-change-the-subject, imagination-sketch-a-friend, generic-pocket-plan and generic-recorded-choice. Six Common / two Uncommon, ordinary packs and existing motifs. **89 implemented / 121 held**; pre-lesson kinds 47 Common / 16 Uncommon / 8 Rare. `reviewExpansion9` retains original text/targets and clarification rationales. Private actual-instance choices preserve order/caps and opponent privacy; explicit bottom-purpose metadata lets existing AI choose among inspected cards. Recorded Choice's scheduled branch is bench-fixture coverage; scheduling spells remain held.

[Acceptance](../../reviews/expansion-9-2026-10-25.md): 18 focused checks; full 1,606 pass / one existing skip / zero failures; 33 matching native outcomes/layouts; two completed scratch packs with Uncommon Follow the Clue. Paired 768+768 initial games and 1,152 selected games retain adverse mono-share shifts (Perception/Imagination −.203125, Perception/Reason −.1328125, Language/Perception −.125). Separate whole-payoff controls are nonadditive. One initial draw reproduces exactly, selected extended rows have no draws, and all64 sampled original expansion-8 winners match. Both final axes cleared; exact Pages/public tactics and AI blobs verified. No numeric/global balance claim; earlier risks and policy gates remain.

## Expansion-10 under #129 — 25 October 2026

Three entrance-only creatures use existing selected portraits: emotion-temper-tiger / Jeremy Clawson, perception-lens-lynx / James Rand-eater and imagination-doodle-duck / Luka Donchilla. Two Common / one Uncommon, original base costs/stats, ordinary packs, unchanged assets/shared cues. **92 implemented / 118 held**; pre-lesson kinds 49 Common / 17 Uncommon / 8 Rare, unchanged prices/weights. `reviewExpansion10` preserves original contracts and pins ordinary self-loss, seen-enemy temporary Elusive removal and species-printed eligibility followed by authoritative current-stat swapping. Shared text and token-aware lookup handle existing warped abilities correctly. No engine/AI/save/spawning or art/voice change.

[Verification](../../reviews/expansion-10-2026-10-25.md): ten focused checks; full 1,616 pass / one existing skip / zero failures; 24 matching native outcomes/layouts; two actual completed scratch packs with Uncommon Jeremy. Its deterministic normal copy has the existing health −1 variant (base species still 3/3/2). Native suppression/expiry stamp and focused restoration are separate evidence. Capture timed out, so no new PNG/motion/hardware claim. Corrected 768+768 same-body entrance-control games have no draws, all three bodies played and paired differences within ±.0625; small samples do not establish balance. All96 sampled original expansion-9 winners match. Preserve prior material interactions/draw risks and unresolved policies; #129 stays open.

## Expansion-11 under #129 — 25 October 2026

Shared Pain (Uncommon,3) and Board Sweep (Rare,5) use ordinary packs, existing motifs/shared cues and original costs. **94 implemented / 116 held**; pre-lesson kinds 49 Common / 18 Uncommon / 9 Rare, unchanged prices/weights. `reviewExpansion11` retains original text/targets and explicit damage/cleanup/snapshot clarifications. Both hero packets precede ordinary Win; both-board damage precedes defeat/Last Words; normal prevention and survivor-created Paper follow existing rules. No engine/AI/save/art/voice or new Fate/token-order/Win policy.

[Verification](../../reviews/expansion-11-2026-10-25.md): nine focused checks; full 1,625 pass / one existing skip / zero failures; 24 matching native outcomes/layouts; two actual completed packs with Rare Board Sweep. The incomplete early phone guard attempt is retained separately; accepted Done receipts show70Coins/no reveal. No new PNG/motion/hardware claim. Two768-game initial cohorts and1,536 extended selected games retain large Memoryneutral/weak and Reasonstrong differences. All-off isolates Board Sweep where Shared Pain is absent; other controls are nonadditive. One initial control draw and two same-fixture extended draws reproduce exactly; all64 sampled original expansion-10 winners match. No numeric/global balance claim. Preserve all prior risks and prefer independent contracts before more board wipes or removal/recovery/sustain. #129 remains open.

## Expansion-12 under #129 — 25 October 2026

Provisional Proof and Paper Shield, both Common cost 2, use ordinary packs and existing motifs/shared cues. **96 implemented / 114 held**; pre-lesson kinds 51 Common / 18 Uncommon / 9 Rare, unchanged prices/weights. reviewExpansion12 preserves original text/targets and records effective Guard before fresh Shield, token-and-colour eligibility and lasting +1 attack. Existing suppression, caps, damage and buff lifetimes remain authoritative. No engine/AI/save/art/voice or new Fate/token-order/Win policy.

[Verification](../../reviews/expansion-12-2026-10-25.md): seven focused checks, full 1,632 pass / one existing skip / zero failures, 24 matching native outcomes/layouts, two completed scratch packs with both new Common normal copies. No new PNG/motion/hardware claim. Paired 768+768 initial games and 1,024 selected larger comparisons have zero draws; each selected fixture contains exactly one new spell. Memory strong and weak mono-share shifts persist (−.2265625/−.1953125), others shrink. Whole-payoff controls do not attribute individual Shield/draw/attack subeffects. All 64 original expansion-11 sampled winners match. Preserve prior risks and policy gates; no numeric/global balance claim. #129 remains open.

## Expansion-13 under #129 — 25 October 2026

Kai Ceenat (emotion-spite-sprite), Common cost 2 / attack 1 / health 3, uses its existing selected portrait, ordinary packs and shared cues. **97 implemented / 113 held**; pre-lesson kinds 52 Common / 18 Uncommon / 9 Rare, unchanged weights/prices. reviewExpansion13 retains the original contract and pins ordinary positive survived damage, same-instance global-turn allowance and controller-at-resolution next-start expiry. Bounce/replay cannot reset the allowance; ordinary leave-play cleanup removes buffs. No engine/AI/save/spawn/catch/art/voice or new policy change.

[Verification](../../reviews/expansion-13-2026-10-25.md): eight focused checks, full 1,640 pass / one existing skip / zero failures, 24 accepted matching native outcomes/layouts and two completed scratch packs with normal Kai. Incomplete pointer and rejected helper-metadata receipts are separate from acceptance. No new PNG/motion/hardware claim. Corrected 768+768 body-control cohorts have zero draws; all trials match the original observer-defective diagnostic runs exactly. Kai plays 445/440 times in mono/mixed; reaction counter records 106/0 across all games including mirrors. Eighteen paired differences are within ±.0625, with no larger selected rows justified; this is not balance certification. All 64 sampled original expansion-12 winners match. Prior risks/gates remain; #129 stays open.

## Expansion-14 under #129 — 26 October 2026

Dua Leapfrog (emotion-pulse-pup), Common cost 1 / attack 2 / health 1, uses its existing selected portrait, ordinary packs and shared cues. **98 implemented / 112 held**; pre-lesson kinds 53 Common / 18 Uncommon / 9 Rare, unchanged weights/prices. reviewExpansion14 retains the original contract and pins survived creature fights on the current controller's turn, once per battle instance, current-global-turn attack-only permission and no shared/manual activation refund. Ordinary player caps, suppression and leave-play cleanup remain authoritative. Bounce/replay cannot restore the match allowance. Minimal Engine permission plus canonical current-turn AI budgets/grouping are tested; no numeric, progress-save, spawn/catch, art/voice or new policy changes.

[Verification](../../reviews/expansion-14-2026-10-26.md): ten focused checks, full 1,650 pass / one existing skip / zero failures, 30 matching native outcomes/layouts and two completed scratch packs with normal Dua. Incomplete early Play attempt is separate; no new PNG/motion/hardware claim. Paired 768+768 body-control games record 422/422 mono/mixed body plays and only 2/0 leap events across all games including mirrors. All eighteen winner arrays match, paired deltas/SEs zero; sparse activation limits balance conclusions. Two unique Dua-absent mirror draws in each mode reproduce exactly, and all64 original expansion-13 sampled winners match. Prior risks and policy gates remain; #129 stays open. Final review/publication status is recorded in the report.

## Expansion-15 under #129 — 26 October 2026

Bill Ny-ant and Mark Ro-beetle, both Common cost 2 with original1/3 and2/2, use selected existing portraits, ordinary packs and shared cues. **100 implemented / 110 held**; pre-lesson kinds 55 Common / 18 Uncommon / 9 Rare, unchanged prices/weights. reviewExpansion15 retains original contracts and pins actual post-entry counts, fresh ordinary Shield, another-friendly targeting and existing lasting maximum-health buff then capped heal semantics. Suppression, no-target body entry, consumption and normal buff/leave-play cleanup remain authoritative. No engine, AI, progress-save, spawn/catch, art/voice or new policy change. Stephen remains held; Stage 13.94 records the portrait mismatch.

[Verification](../../reviews/expansion-15-2026-10-26.md): nine focused checks, full 1,659 pass /one existing skip /zero failures,30 matching native outcomes/layouts and two completed scratch packs with both new normal copies. No new PNG/motion/hardware claim. Paired 768+768 Entrance controls retain Bill's Guard and have zero draws; body plays489/496 Bill,504/504 Mark mono/mixed; Shield-grant60/0 and repair367/0 events across all games including mirrors. Mark event counts are resolutions, not healed points. All18 initial paired deltas within ±.0625; zero-average Reason/Emotion and Perception/Reason rows have nonzero SE and cancelling wins. Whole Entrances are controlled, not individual buff/heal subeffects or Guard. All64 original expansion-14 sampled winners match; prior risks and policy gates remain. #129 stays open; final review/publication status is recorded in the report.

## Expansion-16 under #129 — 26 October 2026

Serenox Rare4/4/3 and David Brine Common2/2/1 retain original contracts/costs/stats, selected existing art and ordinary packs. **102 implemented /108 held**; pre-lesson kinds56 Common /18 Uncommon /10 Rare, unchanged weights/prices. reviewExpansion16 records global arrival identity and controller-next-start exposure, including independent prior loss/restoration. Canonical target flag and opt-in timed loss preserve existing suppression/cleanup/uses; no AI, progress-save, spawn/catch, art/voice or policy change. Stephen remains held for Stage13.94 art mismatch.

[Verification](../../reviews/expansion-16-2026-10-26.md):12 focused checks; full1,671 pass /one existing skip /zero failures;30 matching native outcomes/layouts; two completed memory-only packs with both normal copies and70 Coins after Done. Initial desktop immediate Buy left shop unchanged at120Coins, inspected before keyboard retry; receipt note retained. No new PNG/motion/hardware claim. Paired768+768 hook-off games retain Swift/Elusive with zero draws. Mono/mixed body playsSerenox402/342,David390/376; all-game arrival creature/hero events169/0 versus34/315 andCurtain Slip events345/0, not unique windows. Selected512games retain+.171875 Reason strong/+.15625 Imagination neutral mono-share differences; both fixtures contain Serenox and no David, isolating the arrival restriction while retaining Swift. Zero-mean Imagination weak includes cancelling wins/nonzero SE. All64 original expansion-15 sampled winners match; prior adverse/draw/sparse risks and policy gates remain. No tuning/global balance claim. #129 stays open; final review/publication is in the report.
