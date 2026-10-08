# Script gate, lesson 1, round 3: Critic 1 (logic and consistency)

Date: 8 October 2026. Read: `data/script/lesson1.js` (all 664 lines), `data/script/leads.js`, the lesson 1 nodes of `data/map.js`, `ch2.arrive` in `data/script/lesson2.js`, `leadFor` in `js/ui/dialogue.js`, and the round 3 diff (5859ec8). I re-checked the engine paths these depend on: `run`/`play`/`once` and when `seen:` is set (`dialogue.js`), `Story.test`, `Cast.actor`/`nodeHost`, `map.js` arrival (the Fair Gate replays live; rift nodes replay with `replay: true`; walking through a node doesn't trigger it), `encounter.js` `leadPuzzle()` (it passes `opts`, so `opts.lead` reaches `leadFor`), `World.complete`/`jumpToChapter`, and `venn`/`rule-hunter` `generate`. `content.test.mjs` and `story-engine.test.mjs` pass (24/24).

Known open items, not scored:
- The line-drawer ignores `opts.mode`.
- The jump-in starter kit doesn't set `guess-o-matic`. This also covers Sequins' tier-1 "Keep the apprentice for now" on a Ch2 walk-back.
- The Witness bank's Raven inner line uses "probably" (verdict below).

## Score: 8 / 10 (pass)

Every round 2 problem is fixed in the data, and round 3's new material didn't break any main path. Here is what I re-traced:
- **Barks.** Granny's barks play once each, then she is silent. `fair` → `fair2` before the evening; `road` after it, or for a jump-in. A `dead:granny` player can never reach a bark, because `LATER` routes to the door.
- **Gate win, Ch2 walk-back.** It is five lines: tier, Nudge ×2, the Algorithm, the question. There is no "I KNEW YOURS" and no reveal.
- **Gate win, other paths.** The default and turned-back wins are six lines. The death win is five lines plus one inner line.
- **The dark lantern.** It plays once at the first Fair visit after the death, before the door content.
- **The Quiet Scene.** Seven lines and one choice.
- **The moved gossip.** A walker always gets it at the Signpost, because the fog makes the Signpost mandatory. A Ch1 jump-in gets it at the Road win, which comes before the Well win. So the Moth-kin reveal is always set up.
- **Well lead banks.** They resolve by tag before mode. The Well's rule-hunter at d2 is always in rules mode.

The problems left are one-line wording and continuity fixes on side paths. One Well lead misleads on some rolls. None breaks a branch, a flag or a set-up/payoff chain.

## Round 2 status

| # | Round 2 problem | Status |
|---|---|---|
| 1 | A Ch2 walk-back gets reveals without set-ups | **Fixed.** `lesson1.js:539` guards on `ch1.road` + `ch1.well.win`. On every non-walk-back path, `well.win` implies the Road win, which implies the gossip (fog order), so all five set-ups have played. "I KNEW YOURS" is guarded at `:536`. |
| 2 | Tally can host the Gate | **Fixed.** `map.js:142` `any [gate.win, dead:sequins]` → narrator. The reminder at `:661–662` is guarded both ways. |
| 3 | Stale Fair Gate lines | **Fixed.** `finale-open` comes first (`:128`). The door revisit has a `dead:granny` variant (`:134–135`). One wording slip remains (problem 3). |
| 4 | The Hum Charm is never given to a Ch1 jump-in | **Fixed** (`:253`). A Ch2 jump-in gets it from the fallback line (`:576`). |
| 5 | Owlet "Valid isn't true" | **Fixed** (`:75`). |
| 6 | The Pass replays its arrival from later chapters | **Fixed** (`:563–571`). A revisit before Ch2 still replays the two lines with a "Remembered" tag, which is acceptable. |
| 7 | The Ch2 fallback crackle has no context | **Fixed** (`:574–579`). The guard on `seen:ch1.crackle` means it plays once across the Pass and Ch2, in either order. |
| 8 | Light crackle readings after a death | **Fixed** (`:555–556`: calm Fox and Frogling). |

## Remaining problems

### 1. Minor: two Well Venn leads mislead (`leads.js:52`, `:54`)
At d2, Venn can roll all/no-only premises (`venn.js:404` allows every form). Then no premise forces an x, so Moth-kin's "Look for the one x the premises force. Just one." sends the player hunting for a mark that isn't there (criterion 3). Raven's "'No' and 'not all'. Different words. Different shading." is also wrong: "not all" (some… not) is an x, not shading.
**Fix:**
- Moth-kin: "Look at what the shading leaves open. One lit corner can break the ending."
- Raven: "'No' and 'some… not'. Different words. Different marks."

### 2. Minor: "Her tea is still warm" a night later (`lesson1.js:353`)
The warm-tea line only checks `!LATER`. A walker who chose "Keep going" and goes back to the Fair after the Gate gets "still warm" a full night after the Well win. This includes the new dead-lantern path: lantern → door. So does a walker who picked "Go back to the Fair. Now." at nightfall.
**Fix:**
- Warm: `when: { all: [{ not: LATER }, { not: { seen: 'ch1.night' } }] }`.
- Add `{ s: 'narrator', t: 'Granny\'s door is open. Her tea has gone cold. Her shawl is gone.', when: { all: [{ not: LATER }, { seen: 'ch1.night' }] } }`.

### 3. Minor: "Her lantern is still out" on the first sight of it (`lesson1.js:135`)
The scenario: a walker saw the door during Ch1, while Granny was alive, and Granny then dies in Ch2. The revisit says "still out", but the player has never been told it was out.
**Fix:** "Her door is still open. Her lantern has gone out." (`ch1.door:356` already covers a player whose first door visit comes after the death.)

### 4. Minor: a Ch2 walk-back plays Ch1 live, with no memory framing (`lesson1.js:569`)
No `recap.ch1` plays on a walk. The player steps back through the Pass and finds Sequins caged, then fishing at the Well. Both come after they already know Granny was taken, with nothing saying this is a memory. Criterion 4 asks that rift travel makes sense.
**Fix:** before the LATER Pass line, add `{ s: 'narrator', t: 'Back down the Road. All this happened already. We\'re only remembering.', when: { all: [LATER, { not: { seen: 'ch1.gate.win' } }] } }`.

### 5. Note: the Quiet Scene's Syllo line after the lantern beat (`lesson1.js:590`)
A player who goes back to the Fair before entering Ch2 has already seen Syllo salute the lantern (`:155`). The Quiet Scene then says "Syllo will salute his empty stall." It is not a contradiction, but it repeats the beat. Optional fix: `when: { not: { seen: 'ch1.lantern' } }`, or no change.

### 6. Note (lesson 2; forward-looking):
- When `recap.ch2` lands with "I always know the answer. It heard.", add `{ seen: 'recap.ch2' }` to the "I KNEW YOURS" guard (`:536`). A walk-back player will then know about the boast. Until then, Nudge's push line "Say 'always' for the camera! It got great numbers!" (`:490`) is unexplained on that path; guard it the same way.
- `recap.ch2`'s "imps took Granny" will repeat the fallback's "Imps took her" (`:576`); trim one.
- Granny's peril isn't scripted yet, but once it is, a walker who left the Well unwon could get `dead:granny` in Ch2 and come back. The Well-win hum lines (`:320–321`) would then go silent, or Achilles would speak Granny's lines. Guard them with `'!dead:granny'` plus a `replay: true` copy for the dead case.

## Raven's "probably" in the Witness bank (`leads.js:32`)
**It doesn't break the rule.** The payoff is the avatar *saying* "Probably." as its answer at the very end, and no avatar line in lesson 1 or the leads uses the word (checked).
- The Raven inner line *mentions* the word in quotes, to contrast it with "saw". That is the Language voice doing its job: words as objects.
- It is the inner delivery, a separate voice. It doesn't hedge.

If the teacher wants the word kept untouched until the finale, swap it for "'Saw' and 'think I saw'. Different words. Different prices."

## Paths traced
- **Owlet-girl, go, no turn back, tier 1.** Evening blind spot → Signpost gossip → Road (no repeat; Nudge's new line) → Road win (heckle; gossip skipped; hum) → Well (`venn:well` / `rule-hunter:well` lead) → Stone (`moser`) → night "keep going" → Gate (comfort; moser drain; push with the camera line) → win: 6 lines + Owlet reveal → Pass crackle → "So is Granny." → Ch2 (fallback skipped). Back at the Fair: door "still warm" (problem 2).
- **Frogling-boy, hide, turned back after the Well.** Door (warm; Syllo; silent tick on an unstarted clock; reveal) → night "You know why" → Gate starts at 1 → win: Algorithm turned-back line, no second reveal, the turned-back question.
- **Raven, ask, brink (switch off).** Brink lines; comfort and push skipped → tier 3 → `nudgeFled` → Pass "cloudier" → "So is Granny."
- **Mothkin, go, armed death.** `full` → dead win (5 lines + Moth-kin reveal) → Pass, with the calm readings → the Quiet Scene opens Ch2. Variant: back at the Fair before Ch2, the lantern + Syllo, then the door (problem 2). The Gate reminder comes from the Sundial; the Gate host is the Sundial whether the Gate was won or abandoned.
- **Fox, unset, Ch1 jump-in.** Recap (boast, Hum Charm, unset line) → Road blind spot → Road win gossip + hum → Fair "Shoo" once, then silence → Well → Gate win with "I KNEW YOURS" and the reveal.
- **Fox, Ch2 jump-in.** Fallback context + crackle → walk back: Pass "Boolesbury hums" → Gate as a memory, 5-line win, no reveal (problem 4) → Well and Road set-ups afterwards, no payoff (accepted under the memory framing).
- **Ch2 jump-in, rift-jump to the Prologue.** Home look-back → door with cold tea (LATER) → stall "home" line → Nut Stall look-back → Signpost → Road → Well → Gate with the reveal.
- **After the finale.** Fair: "No hair on the sky now." every visit. Pass: the LATER line. Stall: Sequins' home line, or Tally.
