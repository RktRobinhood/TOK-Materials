# Hank Greenhare draft distinctness — #146

14 October 2026. Base: 71431dacbc62d5550958416594d36e2e0fba836e. This is a design revision, not a runtime card release. The original card and persona are kept in hank-distinctness-146-before.json.

The old hook was `Entrance: heal a damaged friendly creature by 1.` Shipped Proof Pup (`fetch-proof`) already heals another friendly creature by 1 on Entrance. Comma Crab also heals an ally by 1, Proof Beetle and Word Weasel give an ally health, and draft Wait for Evidence heals later. Cost, body and Guard differences did not make Hank distinct.

**Selected hook — To Be Continued:** `Entrance: if this is still on your board when your next turn starts, draw 1 personal-deck card.` Hank bookmarks the explanation and promises to finish it next turn, if nobody interrupts him first. Cost 1, attack 1, health 2, Memory, common, the mechanical/art IDs, pack eligibility and gates [109] stay the same. The numbers are still provisional. The accepted portrait still fits: one paw opens the notebook and the other points at the broad bookmark. Signature prop, silhouette and ROSTER.md row are unchanged. No new persona, art or catchphrase is needed.

Why this is Memory: the reward depends on the history of one card instance. The same physical card has to stay on its owner's board from its Entrance until the next turn starts. If Hank is defeated, bounced or stolen, even for a moment, that note is lost. A Memory deck can recover Hank cheaply (Familiar Path, Replay Raccoon), but only a new, paid Entrance writes a new note. Memory Guard cards (Archive Armadillo, Remember the Guard) protect him. Language Guard is the mixed-colour bridge. This is delayed value that cannot be replayed for free.

## Overlap audit

The audit covered 426 rows. Shipped: 41 creatures, 41 abilities in js/battle/abilities.js, 38 tactics, 42 Axioms, 12 hero powers and 7 battle items. Drafts: all 210 catalogue proposals, the 12 starter support cards and all 23 conditional concepts, including the 10 study cards in dev/conditional-cards.js. The tuple compared is trigger / condition / target / payoff / cap. No other row gives a single draw at the next turn start only if that same card survived. Nearest neighbours:

| Card | Its tuple | Difference from Hank |
|---|---|---|
| Proof Pup (shipped) | Entrance / now / another ally / heal 1 | Hank heals nothing and targets no ally. |
| Piet Hexling `grook` (shipped legendary) | every fight it survives / self / draw | Hank needs no fight, triggers once per Entrance and does best by *not* fighting. |
| Astrophysicat, Magnus Carlseal (shipped) | paid activation, or draw on Entrance now | Hank gives no draw now; the opponent gets a full turn to answer it. |
| Fair Share Axiom (shipped) | rule / every turn start / fewer creatures / draw | A board-count rule for both players, not a one-off creature note. |
| Wait for Evidence (draft) | Fate +1 round / ally still on board / full heal | Hank's note is not a Fate event and its payoff is a card, not health. |
| Souvenir Seal, Pattern Panther (draft) | after Fate events resolve or are skipped / draw | Hank never touches Fate. |
| Inference Heron (draft) | ally survives a fight at 1 health / draw | Different trigger and target. |
| Cue Cricket (draft 1-cost 1/2) | Entrance / look at top card | Inspection only, nothing delayed. |
| Jimmy Fowlon #144 | Entrance / another frozen ally / unfreeze | Removes a status; Hank removes nothing. |
| Rick Ash-tley #147 | enemy targeted spell / self / escape to hand | Hank gives no protection and no bounce. |
| Stored Thought, Clear Reminder (Memory spells) | cast / draw now (+ hearts) | Instant; no survival condition. |

Alternatives rejected: a delayed heal (Wait for Evidence again). Bookmarking an ally so it returns after defeat (Somewhere Very Safe, Tomorrow's Return, Second Chance Salamander, Keanu all do this). Unsilencing an ally (the same shape as Jimmy's unfreeze). Drawing the bottom card (too close to shipped Pocket Tortoise). A next-turn discount on a held card (Unexpected Door/One More Chance already attach discounts, and the opponent could not answer it).

## Implementation contract for the later #123 release

1. **Trigger.** When Hank's Entrance resolves after a normal paid play, give this physical card one public bookmark note for its owner. Silenced or abilities-off Entrance writes no note. Turning abilities back on later never writes a missed note.
2. **Check time.** Check once, at the start of the owner's next turn: after the normal turn-start refresh and start-of-turn rule bonuses, before the player's normal draw choice. Several notes resolve in board order, oldest arrival first.
3. **Condition.** The note pays only if the same card has stayed on the owner's board, under the owner's control, the whole time. Any defeat, bounce, deck move or control change cancels it, even if Hank comes back before the check. Silence or abilities-off at the check also cancels it. The note is spent either way: never delayed, carried over or refreshed.
4. **Payoff.** Draw 1 personal-deck card with normal draw rules. A full hand or empty personal deck means no draw: nothing is discarded, there is no exhaustion step and nothing replaces the draw. No energy, card play, attack or activation is given.
5. **Bounds.** One note per Entrance; one card holds at most one note. Normal reset on leaving the board clears it. Each copy keeps its own note, and normal copy limits apply. The note is not a Fate occurrence. It uses no player event slot. Skip, cancel, move, copy and repeat effects (Cancel the Appointment, Steal a Beat, Timekeeper Tapir, Marked Revisit) cannot touch it, and delay rules (Long View, Conservative Plans, Changed Horizons) do not move it. It is not a discard recovery, so it never triggers Chronicle Cat, Small Reminders or Recovered Story.
6. **Empty state.** No target is needed. A paid Entrance always succeeds, and with no answer from the opponent it is a plain delayed draw. If the match ends first, nothing happens.
7. **Visibility.** Show the bookmark marker to both players until the check. Explain the draw or the lost note in the action log ("Hank lost his place."). The AI must see the marker when it picks removal targets.

Counterplay: defeat the fragile 1/2, bounce it (Rethink), steal it (Persuasion, Borrowed Voice), silence it (Occam's Razor, Billie Eelish) or switch abilities off before the owner's next turn. Guard can protect Hank, and Guard-removal (Look Closer, Exposure Eagle) answers that.

Loop check. A new note needs a paid play and a full enemy turn survived, so the most a card can give is one draw per Hank per owner turn. Recovery (Familiar Path, Replay Raccoon, Total Recall, Patient Recovery, the shipped Axiom that returns defeated creatures to hand) and Unexpected Door's discount bring Hank back only as a fresh paid Entrance. Dying or bouncing always loses the old note. There is no free replay, energy refund, card creation, repeat or automatic win. Hank adds a turn-start creature hook: the shipped engine has `onTurnEnd` but no turn-start ability hook. #123 must add and test that hook, and the existing #109/#123 gates cover this. No new policy gate is needed. This document is a bounded proposal and counterplay audit, not measured balance.

## Files and validation

catalogue-source.mjs and persona-source.mjs are the source files; regenerating them updates card-catalogue.json, CARD-CATALOGUE.md, persona-roster.json and PERSONA-ROSTER.md. Only Hank's catalogue text, tags (`draw`, `delayed`) and counterplay change. The persona row changes its jokeAngle, mechanicLink, voiceDirection ("shared reveal cue") and derived sharedSfx (`reveal` replaces `heal`). Contract text and appealReason follow. A comparison against the base confirms exactly one changed card and one changed persona row. Protected fields and every count are unchanged: 210 concepts, six × 28 plus 42 generic, 72 creatures, 192 pack candidates, 18 story-only. A second generator run is byte-stable, and design/ROSTER.md is unchanged. See hank-distinctness-146-validation.json.

Not changed: runtime js/ and data/, saves, grants, recordings, voice-manifest, images and the accepted portrait. The #145 bulk inventory (production-145-2026-10-13/inventory.json) and dev/art-production-data.js are also untouched. They keep the old contract and the #146 release gate as a frozen historical snapshot. A later explicit adoption record, like jimmy-draft-adoption-144.json, should update them. The frozen draft line "Keep this note. It might help." still fits. VOICE-NEEDS.md adds two original draft lines for later recording.

Independent Standards/Spec review and any full-suite receipt are still pending; the commit owner records them.
