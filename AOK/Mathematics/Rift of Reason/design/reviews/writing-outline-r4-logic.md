# Writing gate, outlines round 4, Critic 1 (logic and consistency), 8 October 2026

Rubric: `design/WRITING-CRITICS.md`, Critic 1. Binding direction: `design/TEACHER-STORY-NOTES.md`. Reviewed in full: `design/STORY.md` (Part I, Appendices A–K, including "Round 4"), `design/SIDE-STORIES.md`, `design/UNDERSTUDIES.md`. Checked against `data/map.js` (Ch1 and Ch4 links; the Ch4 floors are a single line, so the Stairwell and Prediction Hall are always passed), `js/core/world.js` (`jumpToChapter` reveals only the start node, keeps flags, and marks a "first jump", which plays "Previously…" even for a student who played the chapter before), `js/puzzles/village.js` (today the player is told the imp count and the solver only checks worlds with exactly k imps), and my round 3 report (`writing-outline-r3-logic.md`, 7.5).

Map and code changes are counted as resolved where Appendix H states them as requirements.

Traced:
- **Raven girl**, "Characters can die" on, all four deaths. `ask`; Gate tier 4 in stage 2 (push skipped by the App. C rule); Ch2 Quiet Scene; Hall rope fills in stage 2 ("Watch the table"); Ch3 Quiet Scene with the worn charm; Achilles at the Café; reference before Count 1; refuses the bargain; vote fills in Count 3; Ch4 Quiet Scene from Pip; Kuku at the Stairwell; Pip tier 4 (Quiet Scene at the Oracle door, push moved to the Oracle win, moving-on line from Kuku); Copy bar full on the floors (WAITING); "Let me hear them once more"; finale with Achilles, Tally at the shelf, Kuku, four candles.
- **Frogling boy**, no deaths. `go`; keeps going at the first night; Gate tier 1; the Square table; turns back to the Mayor (`torn`); Hall tier 2; accepts the bargain at vote 5; Pip tier 1; Copy tier 2.
- **Owlet girl**, switch **off**: every brink line, then tier 3 (stored 3; Copy +1 from `stakes.ch3 = 3`).
- **Moth-kin boy**, time-rift jump-in at **Ch2**, then walks back to the Fair (open door).
- **Fox girl**, Ch1 and Ch2 played (Granny dies), then jumped to **Ch4**; plus a clean jump-in at Ch4 (n = 1 at the core).

I also checked the Square table by hand over all eight worlds (below).

## Scores

**Overall: 8 / 10 (pass)** (round 3: 7.5). Every round 3 problem is fixed in the text, not just in Appendix K, and the three big ones are now exact. The Copy clock never resolves early, pauses in the Sorting Room and has a defined order at the Oracle door. Mid-boss deaths have a general rule plus named fallbacks. The Square table has exactly one world. The remaining problems are each one or two lines. The most important one is new: the "Previously…" recaps ignore death and bargain flags, so a common classroom path (play Ch2, lose Granny, get jumped into Ch3) mourns her and then hears "Granny was nearly soup." Fix that before scripting, along with the village puzzle's hidden-count mode.

| Document / part | Score | One-line reason |
|---|---|---|
| **STORY.md** | **8** | The clock, the mid-boss deaths, the table and the charms are all now exact. Left: flag-blind recaps, an unspecified "hidden imp count" mode, and the bargain at a low vote. |
| · Prologue | 8.5 | Clean. The practice match is in the right place. |
| · Ch1 Road | 8 | The first-night variant, the jump-in Signpost and the unset Campfire line all work. Left: the open door sets `turnedBack` for later-chapter jump-ins (problem 5), and the Owlet and Fox blind spots are never planted for a Ch1 jump-in. |
| · Ch2 Boolesbury | 8.5 | The table is correct and unique (verified). The scene/table split is clean. "Watch the table" and the avatar's climax prompt close the mid-boss gap. Left: the code must hide the imp count (problem 2), and the Ch2 recap says "You won back the first" with `nudgeFled`. |
| · Ch3 Tomorrowton | 8 | The bargain gate, the reference before Count 1, the staged losses and the {n} counter are right. Left: the recap after a Granny death (problem 1), and a bargain at a low vote that freezes a near-clean tier and makes Count 3 free (problem 3). |
| · Ch4 + finale | 8 | The clock is exact end to end. Achilles' beat 1, his fallback and the Kuku shelf line are fixed. Left: the recap is spoken by a dead narrator (problem 1), and beat 3's Granny parenthetical is garbled (problem 4). |
| · Appendices (systems) | 8.5 | A.4, C, D, F and H agree with each other and with Part I. |
| **SIDE-STORIES.md** | **8** | Story 10's off-stage breach is closed, and the bands and winch are fixed. Left: story 10's twist and berry lines lack Achilles and Volt variants (problem 4). |
| **UNDERSTUDIES.md** | **8.5** | Aligned with round 4. Two stale slips (problem 6). |

Criterion scores: story logic 8 · branches 8 · inner voice 8 · continuity 8 · understudies off stage 9 · TOK accuracy 9.

### The Square table, checked

The three statements are Mayor "Mrs Crumb and I are the same kind.", Crumb "Smudge is no imp.", and Smudge "The Mayor is no imp." The rule is that honest villagers say true things and imps say false ones. Of the eight worlds (M, C, S honest or imp), only **all honest** survives:
- **HHI** fails: Smudge, an imp, says the true "Mayor is no imp".
- **HIH** fails: Crumb, an imp, says the true "Smudge is no imp".
- **HII** fails: the honest Mayor says "same kind", which is false.
- **IHH** fails: the honest Smudge says "Mayor is no imp", which is false.
- **IHI** fails: the honest Crumb says "Smudge is no imp", which is false.
- **IIH** and **III** fail: the imp Mayor says "same kind", which is true.

The STORY.md gloss ("same kind" makes Crumb honest; the chain clears the rest) is correct. Appendix K is also right that my round 3 sample had two worlds. The Mayor's later loaf fib and his liar sentence sit outside the table (A.9), so nothing contradicts it.

---

## Round 3 problems: status

| # | Round 3 problem | Status | Verified at |
|---|---|---|---|
| 1 | The Ch4 Copy clock fills early; two clocks overlap; two events at the Oracle door | **Fixed** | App. C, "The Copy's clock": a start cap of 3; per-floor first wrong check and hints; the Sorting Room pause; the push at the Oracle door, or at the Oracle win with `dead:pip`; "never resolves early", WAITING, drains on a full bar, tier read at the trial 3 win. Part I §6 (the "One clock here" line, the core clock paragraph and Pip's tier 4) agrees. |
| 2 | Mid-boss deaths; the bargain after the vote passed | **Fixed** | Hall tier 4 "Watch the table" variant and the avatar's climax prompt; the bargain is offered only below 8 (`bargain` unset otherwise, App. F agrees); the reference plays before Count 1; App. C's general skip/fallback rule (which also covers the Gate push and drain lines after Sequins dies). |
| 3 | The Square table has no statements | **Fixed** | Ch2 beat 3 and App. H have fixed statements; unique world (above); scene vs table split; the lead bank is muted at the Square; the loaf rolls out at the Hall for everyone. Residue: hidden imp count (problem 2). |
| 4 | Hum Charm pairs vs the Quiet Scene | **Fixed** | A.4 "only sounds when worn"; the Ch3 Quiet Scene ("Only mine."); UNDERSTUDIES lines 16, 481 and 511. |
| 5 | Jump-ins never hear the boast; n = 0 | **Fixed** | All four recaps carry the boast line; the readout drops k of n when n = 0; the n = 1 core line. Residue: recaps ignore other flags (problem 1). |
| 6 | Finale branches; story 10 breach | **Fixed** | Beat 1 Achilles line and fallback order; Kuku shelf variant; story 10 gated on `arrived:granny`. Residue: problem 4. |
| 7 | Antagonist losses not staged | **Fixed** | Ch3 silent images (signs, FOLLOWERS: 0, the tier 4 variant); core trial 2 "NO LONGER REQUIRED"; App. G lists them; the Guess-o-Matic "only time until the core". |
| 8 | Smaller items (16) | **Fixed** | All checked in the text: first night, open door, Ch1 jump-in Signpost, Campfire unset, EVIDENCE {n}, Clock Tower hum, A.1 doors, Fox merged, Kuku's question, the Copy's voice and jar label, Pip's lantern, Fin's turn, "Valid isn't sound", practice match, pending Quiet Scene direction, SIDE-STORIES winch/bands/header, UNDERSTUDIES §3.8 and `quietAt`. |

---

## Remaining problems

### 1. (Medium) The "Previously…" recaps ignore death, bargain and `nudgeFled` flags

`jumpToChapter` plays a chapter's recap on the **first jump** into it, even for a student who has just played the chapter before. That is the normal classroom case: finish lesson 2, then get jumped into Ch3 at the start of lesson 3. The pending Quiet Scene plays first (App. D), then the recap:
- **Ch3** (STORY.md:379): "In the past, Granny was nearly soup." With `dead:granny` this comes straight after her Quiet Scene and contradicts it.
- **Ch4** (STORY.md:495–498): spoken by the Sundial ("I'm the Sundial…", "You won. I'm still a little shaken."). With `dead:sundial`, App. D silences narrator script lines, so the recap vanishes; if it played, a dead character would speak. With `bargain`, "You won three pieces back" is wrong (one piece).
- **Ch2** (STORY.md:266): "You won back the first." This is wrong with `nudgeFled`.

**Fix (one rule in App. D and four variant lines):**
- A recap line that a flag makes false has a variant.
- Ch3 with `dead:granny`: "In the past, the soup won. Granny is gone."
- Ch4 with `dead:sundial`: Pip reads the recap ("Previously. The Sundial was on trial for guessing. We lost. I kept its words."). Drop the "You won" line.
- Ch4 with `bargain`: "You gave two pieces back to save me. One left up there."
- Ch2 with `nudgeFled`: "The imp ran off with the first piece."

### 2. (Medium-low) The Square table needs a hidden-count mode, and App. H does not say so

`js/puzzles/village.js` tells the player how many imps there are and only searches worlds with exactly k imps (lines 7, 73 and 107; feedback at 397 and 416 assumes k ≥ 1). The Square's uniqueness, and its point ("No imps is a possible answer"), only holds if the count is hidden and every subset of the three is a candidate world. Announced as "0 imps", the puzzle is trivial. **Fix (App. H, one bullet):** "Square mode: imp count not announced; worlds range over all 8 assignments; an empty accusation is a valid submission; feedback text for k = 0 ('Nobody here is an imp. Every row with an imp breaks.')."

### 3. (Low-medium) The bargain at a low vote

The bargain is offered "right after Count 2, with the vote high" (STORY.md:417), but the only gate is "below 8". At vote 1–3 it freezes a clean tier: Hoot's Gavel and Feed −1 for two pieces and Copy +2. It also makes every Count 3 mistake free, because a frozen clock in a stakes scene costs neither notches nor hearts. "Stop the vote right here" means nothing at 2. **Fix:** "Offered only while the vote is 4–7; otherwise skipped and `bargain` stays unset." Then say that after acceptance, Count 3 mistakes cost hearts again.

### 4. (Low) Finale and story 10 wording branches

- **Finale beat 3** (STORY.md:584): "Granny watches (only if the Copy didn't get home first, and not when Tally's arrival line plays here: 'Downhill. Through time. Took ages.'; Achilles has no travel line)". As written, this reads as if "Downhill…" were Tally's line. Rewrite: "Granny: 'Downhill. Through time. Took ages.' (only if she lives, the Copy didn't get home first, and Tally's arrival line isn't using the slot)."
- **Story 10 twist** (SIDE-STORIES.md:381): "Granny is too slow to type" has no variant for the Achilles or Volt versions. Tier 3 gives "one berry to `role:granny`", but Achilles refuses berries in the hook.
- **Story 10 berry bark** (line 389): Achilles' bark "Got a berry. Gave it to Volt." plays even when the story ran before he arrived (the Volt-only version), and then he was never there. Gate the Achilles bark on "story 10 played after `arrived:granny`"; otherwise give it to Volt or drop it.

### 5. (Low) The open door for later-chapter jump-ins sets `turnedBack`

STORY.md:167 opens the door "once any later chapter has been entered", and "Visiting here before the Gate is won sets `turnedBack`". A Ch2+ jump-in has not won the Ch1 Gate (`jumpToChapter` completes nothing). So walking back sets the flag, plays Ch1 voice reveals whose blind spots were never planted, and later gives the memory-mode Gate its "YOU WENT BACK… THEN YOU CAME BACK FOR HIM" line. **Fix:** "`turnedBack` and the reveals at the door apply only while Ch1 is the current chapter; for later jump-ins the door is scenery." Related, for a Ch1 jump-in: the Owlet and Fox blind spots live in the Prologue evening. Play them at the Forest Road with the Signpost lines, or skip their Gate reveals when unplanted.

### 6. (Low) Small slips

- **"Watch the table"** is not carried into the Ch3 Quiet Scene text (STORY.md:372 hard-codes "Watch her"; the Hall note says it replays whichever was said) or UNDERSTUDIES §4.2 (line 498). Add "(or 'Watch the table.')".
- **Core trial 2** "{k} TIMES OUT OF {n}" needs a singular form for n = 1 (a Ch4 jump-in).
- **Hoot's Gavel** is a drain both at the Sorting Room and at the core. Say "one use".
- **UNDERSTUDIES.md:9** still says "Binding facts from STORY.md (round 3)".

---

## What is right (keep)

- **The Ch4 clock** is now the best-specified system in the file: start, per-floor ticks, the pause, the push and its `dead:pip` move, core ticks, the temptations, drains on a full bar, and one read at the trial 3 win. Neither trace can reach a Copy-less trial 3.
- **Mid-boss deaths** follow a general rule, with each case named; I found no beat that still assumes a live character after a death.
- **The off-stage rule** holds in every line I traced, including story 10 now. Kuku's clock, Achilles' charm and Tally appear only behind `dead:` and `arrived:`.
- **Staged losses** match App. G and the antagonist table.
- **The Hum Charm rule** now explains every charm beat (Ch1 silence, the Gate crackle, the Quiet Scene, the Café) with one sentence.
- **TOK content** is correct: the Square table, "This statement is true" fitting either stamp, valid vs sound, biased samples, base rates, common cause, proxies, two worlds in story 6, and the casket labels in story 4 (unique answer B).
