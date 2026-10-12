# Starter card pack — #113

Implemented seven common creature definitions and five common spells, using the seven already-produced portraits. Beginner creatures now have distinct small hooks instead of repeated vanilla bodies. Proof Pup heals on entry; Lens Lizard inspects/reorders the top card; Paper Dragon swaps only its own stats; Cloud Calf provides conditional capped hero recovery; Pocket Tortoise moves bottom to top; Comma Crab spends its attack/energy to heal another creature; Footnote Finch gains temporary attack from its owner's played Axioms. Patient Proof targets small attackers, distinguishing its role from unrestricted damage.

All effects use existing deterministic engine APIs; no scheduled Fate, construction quotas, owned starter grants or new progress fields. Existing colour casting rules remain until #112. Helpers are appended after the shipped roster to preserve legacy chapter-kit choices; a regression checks the three old grants and ownership cap. #114 still owns permanent avatar-type decks and normal-play loaner retirement. The teacher allows a controlled tutorial fixture followed by a bridge to the player's own deck.

Seven additive Google cast profiles and fourteen original source lines are authored. Barks reuse those exact texts, so hashes deduplicate. Starter metadata classifies recording plans as lesson1 without adding plot spawns or grants. No paid request, voice manifest or recording changed. Five spells use the native readable text-frame fallback pending shared motif art.

Browser QA found selected cards (layer6) could intercept the native lane Activate button (layer5). Raising the lane to7 fixed the hit target, verified with actual mouse input. The teacher subsequently requested abilities next to the creature; that is the next serial UI slice, including multiple/gained abilities. Hover inspection and drag attacks remain separate behaviours.

## Verification

- Fifteen focused pack tests cover targets, no-op/empty states, damage prevention, max-health/heal order, temporary-health defeat, silence, turn timing, repeated activation limits, exact deck order, immutable input, deterministic actions, AI legality and legacy chapter grants.
- Required full suite: 820 tests, 819 passed, one skipped, zero failed; 116,292 ms. The AI power corpus now gives each power two deterministic encounters because extra commons change weighted draws; the same eight-power coverage, speed, completion and legality assertions remain.
- Planning validation passed: 210 separate expansion concepts, twelve starters, exact colour coverage/acquisition counts. Existing starter art validation passed alpha, margins, runtime dimensions and exact manifest IDs for all seven portraits.
- Real native bench controls exercised all twelve effects at1280px: play/target healing and damage, paid activation, Lens keep/bottom choice, self-folding stats, capped hero recovery, deck reorder, own-Axiom burst and its expiry, draw/heal, temporary buff expiry and max-health/heal order. Calm motion toggled; no broken images. Evidence: [Proof Pup](starter-pack-2026-10-12/proof-pup.png), [Lens choice](starter-pack-2026-10-12/lens-choice.png), [Careful Words](starter-pack-2026-10-12/careful-words.png). These are scratch matches; no saved collection edits.
- Free voice plan for Proof Pup: two lines, one Flash request. The seven source pairs remain unrecorded. Record through the existing per-speaker plan/render/audit workflow when quota permits; never reset its ledger.

## Standards

Independent review found no blocking standards findings. Classic scripts, local assets, cloned-state effects, scratch save isolation, additive cast profiles and existing recording contracts are preserved. The test-corpus expansion increases coverage without weakening assertions. No material refactoring smell identified.

## Spec

Independent review found one unintended grant risk from placing helpers first in the species registry. Moving them after the original roster and adding a chapter-kit regression resolved it. Re-review found zero remaining blockers. The ability tray requested later is the next ticket, then visual card/foil work; no claim that owned starters, production board integration or the expansion are complete.
