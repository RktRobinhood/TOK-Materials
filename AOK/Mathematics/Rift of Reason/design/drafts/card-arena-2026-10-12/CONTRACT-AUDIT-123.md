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
