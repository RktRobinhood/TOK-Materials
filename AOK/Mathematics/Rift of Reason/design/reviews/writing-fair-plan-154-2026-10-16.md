# Writing gate: Granny's Fair day plan (#154), 16 October 2026

Teacher playtest (15 Oct): straight after the card tutorial, Granny explained the Fair too fast. Students missed that they must win **any two of the three** puzzle stalls, plus Syllo's **separate** practice match, before the Nut Stall final.

## What changed

- `prologue.fair` (first Fair Gate visit) now offers only the card lesson: "First, cards with me. A short lesson. Then tea, and I'll tell you the plan."
- New `prologue.fair.plan`: one patient Granny conversation, one instruction per line. It plays once, after her lesson (won or lost) or straight away when the player picks "Explore first" (`Rift.Battles.fairPlan`). Legacy saves that won the lesson before this change hear it on their next Gate visit. It never plays after the rupture.
- The card-lesson modal is now "Granny's card lesson", cards only. Syllo's modal reacts to Granny ("Granny says you're ready, recruit!") and says the match is not a puzzle stall.
- A persistent **Fair day** tracker entry (`js/core/quests.js`), first in the map tracker from Granny's first words until the rupture. Example: "Fair day: puzzle stalls 1/2 (any of 3) · Syllo's match at the Gate: not yet". It points at a started stall, then the Gate, then the Nut Stall. The Journal text gives the full rule.
- The Nut Stall lock text names both keys. The stall-count message is now "Win any 2 of the 3 puzzle stalls first (N so far)" (`requiresText`).
- Code fix from Critic 1: Syllo's own card challenge at his Gallery stays hidden until the Gate practice match is won (`Battles.canChallenge`), so the two Syllo card games are never confused.
- STORY.md §105 describes the new order.

## Rounds

| Round | Logic | Author/style | Editor |
|---|---|---|---|
| 1 | 6 | 7 | 6 |
| 2 | 7 | 8 | 7.5 |
| 3 | **8** | **8** | **8** |

- **Round 1.** "You borrow his cards" was false (it is a loaned starter team). The lesson was a hidden step before Syllo's match. Syllo's Gallery challenge could be mistaken for the required match. "Practice" sounded optional. The plan was a briefing with no want, and the sky hook went quiet. The tracker's "0 of 2 stalls" suggested only two stalls exist.
- **Round 2.** The skip line was false for players who lost the lesson. "Very heavy" (set-up for the finale's "It's very heavy") had been dropped. The text never said the match must be *won*. The tea promise was not paid off. There were too many names for the match, and "dear" was overused.
- **Round 3.** All three passed. The last small fixes were applied: the lesson line moved after the Syllo description, the avatar's boast became "I always do." (planting the Nut Stall boast), "Play the third for fun, if you like" replaced "Be kind" (the third stall still teaches an idea), and the tracker says "Syllo's match at the Gate" with "(not Syllo's Gallery)".

## Rejected

- Species-specific inner lines after the trophy (Critic 3, optional): five extra recordings, and the Fair Gate has a one-thread-per-station rule.
- Renaming "Explore first" to "Skip the lesson": the plan now acknowledges a skipped lesson in Granny's voice.

## Voice

New and changed Granny lines enter the Gemini catalogue automatically (`tools/voices.mjs` reads `data/script/*.js`). Browser speech covers them until the next daily run. "There you are…" and "Very shiny. Very heavy." keep their existing recordings. The avatar line is silent (avatars are not voiced in scripts yet).

Browser check (localhost, fox girl save): all 14 lines played in order, one per click; the lesson line was correctly left out after a won lesson; the tracker showed the Fair day entry first. The teacher's own local save was backed up and restored.
