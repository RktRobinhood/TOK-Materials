# Writing gate, outlines round 2, Critic 1 (logic and consistency), 8 October 2026

Rubric: `design/WRITING-CRITICS.md`, Critic 1. Binding direction: `design/TEACHER-STORY-NOTES.md`. Reviewed in full: `design/STORY.md` (Part I and Appendices A–K), `design/SIDE-STORIES.md`, `design/UNDERSTUDIES.md`. Checked against `data/map.js` (node links decide what is required), `js/core/world.js` (reveal-on-complete and the time-rift jump), `js/puzzles/village.js` (roles), `data/script/lesson2.js`–`lesson4.js`, `DESIGN.md`, `ROSTER.md`, `AVATARS.md` §2, and my round 1 report (`writing-outline-r1-logic.md`, 6.5).

Traced:
- **Raven girl**, "Characters can die" on, all four deaths (Sequins, Granny, the Sundial, Pip). Prologue with Witness + Gallery; Ch2 without the Post Office (so the first interrogation is at the Clock Tower); Ch3 first by the short route (Neon Bridge → Newsstand → Plaza), then again by the long route (West Bridge → Café → Library) so the Sundial can be armed.
- **Fox boy**, no deaths. Pattern + Gallery; turns back in Ch1 and at the Ch2 Stairs (`mayor = torn`); accepts the Ch3 bargain.
- **Owlet boy** with "Characters can die" switched **off**: every tier 4 reached on purpose.
- **Raven boy**, time-rift jump-in at Ch3 with no earlier flags. A variant also finishes Ch1 (Sequins dies), then jumps over Ch2 to Ch3.

## Scores

**Overall: 7.5 / 10** (round 1: 6.5). The rewrite fixes most of what round 1 found, and several fixes are elegant: the role goes silent, then falls back to a named stand-in, then the understudy arrives through a beat; the `met` lists; a disarmed tier 4 stored as 3; scoping rule 8; "it logs what you do, never what you think". The understudy system is now sound, and every understudy line I found sits behind `dead:` (plus `arrived:`).

It is still not scriptable without invention. One structural error is new: the Ch3 Café and Library are written as "required", but the map lets players skip both. One twist premise has no mechanism: no puzzle ever tests the Mayor, yet "the table cleared him". The disarmed tier 4 (switch off, `met` not complete, memory mode) has no fiction for the moment the clock fills. A few tier-4 and jump-in branches from round 1 are still open.

| Document / part | Score | One-line reason |
|---|---|---|
| **STORY.md** | **7.5** | The spine and the death machinery are now coherent. The Ch3 required-path error, the Mayor's "table", the disarmed-tier fiction and a few tier-4/finale branches remain. |
| · Prologue | 8 | Clean. "At your door" is staged at "the same node" (the Nut Stall) (STORY.md:103). |
| · Ch1 Road | 8 | The twist and turn-back work. Gaps: the Fair Gate state for players who walk back without choosing to; `turnedBack` set by the choice, not the visit; Nudge's sack against Granny's sack. |
| · Ch2 Boolesbury | 7 | The required-path fixes landed. But no table ever tests the Mayor; Hum clue 2 says "She", which gives Quill away; the Constable is never placed at the feast he falls back to hosting. |
| · Ch3 Tomorrowton | 7 | The Café and Library are optional on the map. The tier-4 aftermath still plays "VERDICT REJECTED" and Nudge's counter dropping to zero. A disarmed vote of 8 has no fiction. The bargain "stops" a vote that still climbs. |
| · Ch4 + finale | 7.5 | Strong core. The finale order is still self-contradictory at Copy tiers 3–4. The soldiers' drain lands after the Copy's tier is fixed. `dead:sequins` cuts the Algorithm's motive. Two unplanted references (cocoa, the Oracle and Pip). |
| · Appendices (systems) | 7.5 | Arming, recording and the lock are precise. Not covered: Quiet Scenes and arrivals when a chapter is skipped by the time rift, Achilles' finale fallback, inconsistent jump-in defaults, and the Hum Charm network. |
| **SIDE-STORIES.md** | **8** | Self-contained and logically sound; story 4 is now correct. Small items: story 2's Nudge in late play, story 5's flag after the Hall, story 7's "Sequins changed or gone", story 7's drain timing. |
| **UNDERSTUDIES.md** | **8** | Now aligned with Appendix D, with a clear resolver order. Small contradictions: "Pip speaks the arrivals" against "script lines are skipped"; one stale rule-8 reference; it inherits the missing Achilles fallback. |

Criterion scores: story logic 7.5 · branches 7 · inner voice 8 · continuity 7.5 · understudies off stage 8.5 · TOK accuracy 8.5.

---

## Round 1 problems: status

| # | Round 1 problem | Status | Notes |
|---|---|---|---|
| 1 | Required beats on optional nodes | **Partly fixed** | Ch2 is fully fixed: the cover choice is at the first interrogation, the blind spots are at the Square and the cover choice, leads are on required stations, and the hum ladder is on the Square, Clockmaker and Clock Tower. The lesson-3 trigger is the Plaza. **New instance in Ch3:** the Café and Library are labelled required but are not (problem 1 below). |
| 2 | Understudies on stage too early; three Kuku origins | **Fixed** | Silence, then fallback, then `arrived:`. Kuku has one origin. Small residue: STORY.md:719 and UNDERSTUDIES.md:40 have Pip "speak the arrivals", but the resolver (UNDERSTUDIES §3.1, step 4) skips script lines. Say which applies (problem 10). |
| 3 | Arming undefined; disarmed value | **Fixed** | Explicit `met` lists; a disarmed tier 4 is stored as 3; everything keys on `dead:`; the `risked:` lock. One `met` beat (`ch3.cafe`) is not on the required path (problem 1). |
| 4 | Hum Charm and shawl in two places | **Mostly fixed** | Three charms, the shawl and the keepsakes are consistent. New: the charm *network* raises what Achilles heard and when (problem 7). |
| 5 | "Every tier" scenes forget tier 4 | **Partly fixed** | Ch1's plan line and Achilles' dust line are fixed. Ch3's "what the antagonists lose" and the finale's "just walked in" against Granny already home with the Copy are **not fixed** (problem 4). |
| 6 | World rule 8 | **Fixed** | Scoped to puzzles. Quill is excluded from Ch2 rolls except the forced stage. New and related: the Mayor is "cleared by the table", but no table includes him (problem 2). |
| 7 | The Algorithm knowing what it could not | **Fixed** | Actions only, no eyes at rest stops, sample size shown, unset fields omitted. The default `cover = postman` partly undoes the last point (problem 5). |
| 8 | Jump-ins and out-of-order play | **Mostly fixed** | Recaps, kits, Exhibit B fixed text and the memory rule are in. Not covered: a chapter skipped by a jump after a death (problem 5). |
| 9 | Crack vs rift; the Guess-o-Matic loop | **Fixed** | Rules A.7 and A.14. |
| 10 | The files disagree (switch, Feed, `away:`) | **Fixed** | UNDERSTUDIES §3.9 and §4.4 match Appendix D; there are no shields and no memorial refund. |
| 11 | TOK slips | **Fixed** | Every item checked: the unsound note, the Moth-kin liars-gate lead, the Owlet Ch1 premise, `visitor`, the climax wording, the line-drawer modes, `wonder` answers. All are correct now. |
| 12 | Smaller items | **Mostly fixed** | Story 4, late plays, story 6, the Plaza budget and climbing vote, one Copy clock, the Sundial's memorial: all fixed. The Copy push still has no fallback when `brave` is unset (problem 8). |

---

## Remaining problems, by severity

### 1. (High) The Ch3 Café and Library are not on the required path

STORY.md:378–379 label "Somewhere quiet (Café, required)" and "For the record (Library, required)". `data/map.js` disagrees. `t-newsstand` links `['t-south-bridge', 't-plaza', 't-cafe']`, and `World.complete` reveals every link. So **Neon Bridge → Newsstand → Plaza** is a legal shortest route that skips both. Appendix H's map changes do not touch that link. On the short route the player loses:
- **`ch3.cafe`**, which is in the Sundial's `met` list (STORY.md:691; UNDERSTUDIES.md:40). Appendix D says "Every `met` beat is on the required path": false. In practice the game's biggest death is disarmed for short-route players.
- **The Sundial's Ch3 companion beat** ("put me somewhere sunny") and its finale payoff, where Kuku lays the shadow "as it once asked at the Café" (STORY.md:577), a request this player never heard.
- **Twist clue 2** (Pip: "say 'I guess' again… for the record") and **EVIDENCE FILED: 2**, so the counter jumps 1 → "everything".
- **The Moth-kin Ch3 story lead** (Library), leaving Moth-kin with a thinner Ch3 than the other species.
- **Pip's café card match**, and the place the Frogling's Ch4 blue line remembers (problem 9).

**Fix** (one line in Appendix H): remove `t-plaza` from `t-newsstand.links` (and `t-newsstand` from `t-plaza.links`), so every route runs Café → Library → Plaza. The Newsstand stays an optional side branch off the Neon Bridge and Café. Alternatively, keep the map and move the Café beat to the Rift Landing and clue 2 to the Neon Bridge. The map change is simpler and keeps the Café as the quiet place.

### 2. (High) "The table cleared the Mayor", but no table ever includes him

The Ch2 twist rests on this: "The table rightly clears him of being an imp" (STORY.md:300). The turn-back scene says "He is not an imp, and the table already showed you that… 'Your table says I'm not an imp. True.'" (STORY.md:273). The Sundial question for `suspect = mayor` builds on it too. But `js/puzzles/village.js` has no `mayor` role (baker, postmistress, clockmaker, lamplighter, constable, sweep, schoolteacher, gardener), and no required Ch2 puzzle before the Stairs tests him: Lamp Lane comes before you meet him; the Clockmaker and Stairs are switchboards; the Clock Tower is a tower puzzle. A writer has to invent where the clearing happens. And the turn-back confrontation comes *before* the Hall, so the Hall's stage 1 cannot be that table either.

**Fix:** add `mayor` as a village role with a statement type (for example his bread fib as a checkable claim, "The loaf is not in the Bakery"). Force him **honest** in one required roll after the Square. The best place is the Clock Tower: a 3-villager pre-check before the tower puzzle, where Clobber says "Check the Mayor while you're here. Everyone else has." Also add him to Hall stage 1 (forced honest) for players who never turned back. Then the Mayor's line is true when he says it, and the twist ("cleared of being an imp, guilty of not reading") has a mechanism.

### 3. (Medium-high) A disarmed tier 4, and the bargain, have no fiction at the moment the clock fills

Appendix C: "If Danger fills first, the tier-4 consequence plays at once, the puzzle continues without the clock". Appendix D: a disarmed tier 4 "plays the tier-3 scene". But every tier-3 text is an **end-of-boss outcome**: "Out, but he ends sentences with LIKE AND SUBSCRIBE"; "Out, but her shawl has boiled away"; "Dismissed, but the Algorithm keeps a recording"; "Freed, at a price". None of them says what happens **mid-puzzle** when the winch reaches 6, the rope 8 or the vote 8 and nobody can die. This is the normal path for every player with the switch off (my Owlet trace), every jump-in, every memory-mode chapter, and anyone who skipped a `met` beat. The worst case is Ch3: the vote reaches 8, so GUILTY has passed under the rule "verdicts by **public vote**", yet the tier-3 text says "Dismissed". The writer must invent why a passed vote is not carried out.

The bargain has the same gap. "I STOP THE VOTE" / "The vote is frozen" (STORY.md:403) sits against "frozen below 8" (STORY.md:416), so the vote still climbs to 7 after it was "stopped".

**Fix:** add one "held at the brink" line per peril, played when the clock fills while disarmed:
- Gate: "The rope jams one notch from the crack. Nudge kicks it. It holds."
- Hall: "The rope snags. Her shell is in the soup. Only her shell."
- Tribunal: "GUILTY passes. Sentence scheduled… after the adverts." Your dismissal then lands first.
- Sorting: "The glow holds. The machine starts wiping his record instead."

Then the tier-3 outcome follows naturally. For the bargain, reword it to "I'LL STOP IT JUST SHORT. A DEAL'S A DEAL." and describe the vote as "capped at 7", not "frozen".

### 4. (Medium) Tier-4 branches still open (round 1 problem 5, residue)

- **Ch3 aftermath at tier 4** (STORY.md:426–427, 476). After "ROCK: DELETED. TRENDING.":
  - the "what the antagonists lose" lines still play "verdict rejected. VERDICT REJECTED." (the verdict was carried out);
  - Nudge's counter "drops to zero" (it just won);
  - "Exhibit A goes back to its owner" (the owner is gone).

  Fix: a tier-4 set. The Algorithm keeps its capitals ("VERDICT: EXECUTED."), and its small loss is the piece: "EXHIBIT A… released? probably— RELEASED." Nudge's counter peaks, then stalls: "…Why is nobody cheering?" The piece goes "into your pocket, cold" (matching the Ch4 Quiet Scene).
- **Finale order** (STORY.md:573–575). At Copy tiers 3–4, beat 1 has `role:granny` at her table, having "already sat on" the Copy. Then beat 3 says "Granny has just walked in ('Downhill. Through time. Took ages.')". This was round 1's finding, and it is unchanged. Fix: at Copy tiers 3–4, beat 3's line is "Got home Tuesday. Somebody was already here. Wrong blink."
- **`dead:sequins` at the core** (STORY.md:562). "The next two lines are not played" cuts "Nobody claps for 'probably'. So I stopped saying it" (the theme's centre, and the answer the finale gives to `wonder`). It also cuts the motive. And "Is he… here?" contradicts its own Ch1 gloat ("I TOOK THE TORTOISE TOO") and rule A.7 (the crack, its feed, kept him). Fix: keep "Nobody claps…". Replace the motive line with "He taught me 'probably'. I took him to un-learn it. …It didn't work."

### 5. (Medium) The time rift against deaths, arrivals and defaults

- **A Quiet Scene can be skipped forever.** `quiet:<role> = pending` plays "at the chapter opening STORY.md names" (UNDERSTUDIES §3.6). A student who loses Sequins in Ch1, then is jumped by the class to Ch3, never opens the Ch2 Stone Circle. The teacher's note 4 says the Quiet Scene "always happens". Fix: a pending Quiet Scene plays at the **first chapter opening reached by any route** (a rift walk or a time-rift jump), before that chapter's "Previously…".
- **Achilles has no fallback arrival.** His arrival is the Plaza hum (Ch3). A student who loses Granny in Ch2 and is jumped to Ch4 never meets him. The finale's `role:granny` beats (Copy, Home, trophy, `wonder`, sky) then have no speaker and no named stand-in. Tally has a finale fallback; Achilles needs one too: "or else the finale, at her card table", with his arrival line spoken in person.
- **Defaults disagree.** Ch1/Ch2 kits give `brave = go` (STORY.md:149, 261). Ch3/Ch4 and Appendix F give `brave` unset. `cover = postman` is a default in Ch3/Ch4 (STORY.md:372, 497). So a jump-in hears Exhibit C quote a postman story they never told, and the Prediction Hall readout (STORY.md:503) shows "YOUR COVER: POSTMAN". That breaks the round 2 rule "unset fields are left out". Fix: every default is unset. Exhibit C gets fixed text ("the companion's story in the 1850s, whatever it was") like Exhibit B. Exhibits and readouts omit unset fields. The core's "Three data points" becomes "{n} data points" (0 for a Ch4 jump-in: "No data points. I still called it knowing.").

### 6. (Medium) The Fair Gate after Hum 2, and the turn-back flag

- Granny is gone from Hum 2 on, but the cottage "story state" exists only "after `turnedBack`" (STORY.md:863). Players reach the Fair Gate without choosing to turn back: side story 1 (the Witness Tent, triggered at the Troll Bridge) and stories 7 and 9 all pull them back. Granny's card table then shows… what? The outline does not say whether Granny is drawn there, or whether "Learn" (her teaching match) still works. Fix: the open-door state shows to **everyone** at the Fair Gate from the Well win until the finale. Seeing it before the Gate is won sets `turnedBack` (with its +1 notch and the reveal order). Her teaching match plays as a memory (UNDERSTUDIES §3.6 already has the frame).
- **`turnedBack` is set by the choice** (STORY.md:819), so "go back", followed by walking straight to the Gate, gets "YOU WENT BACK. TOO LATE." without ever going back. Set it on the cottage visit instead.
- **Two sacks.** "Either way, Nudge loses its sack" at the Gate, "dropping the sack at once" (STORY.md:172). Meanwhile Granny is "in the sack" that leaves the crack at the Gate (A.4). Players will expect Granny inside the sack Nudge drops. Fix: one line saying Nudge's sack held the net and the shadow piece, while Granny went in the Signpost's "empty sack" carried by other imps. Moth-kin's reveal already says "A tiny sack. A tiny tortoise."

### 7. (Medium) The Hum Charm network: what Achilles heard

A.4 says three charms "work anywhere, at any time". If they are one network, then:
- Achilles heard every hum in Ch1–2: the soup-pot salesmen, the kitchen, the pot. He did nothing, which contradicts his arrival line, "For emergencies. …This is one."
- When you hum on Granny's charm in the Quiet Scene (STORY.md:362), Achilles' charm should answer, but "nothing hums back".
- Nothing says how Achilles (or Tally) learns of the death.

Fix: charms are **pairs**. Yours pairs with Granny's; Granny's also pairs with Achilles' "emergency" charm, which he never wore. In the Quiet Scene you hum on **your** charm, and her charm in your bag stays silent. At the Plaza, **her** charm in your bag hums: Achilles, who saw the Fair's lantern go out and finally put his charm on. ("Saw her lantern go out. Put this on for the first time in seventy years.") This also explains how Tally knows (the lantern). Rewrite A.4 in one sentence.

### 8. (Medium) Ch2 clue 2 gives away Quill, and the Copy's clock drains too late

- **"A tall bird keeps checking the pot. She hums in ones and zeros."** (STORY.md:270). The outline calls this ambiguous ("peacock or stork?", and the Frogling lead agrees), but the Mayor is "he" (Appendix G), so "She" names Quill. The white feather on Granny's step (STORY.md:158, 305) leans the same way: a peacock's feather is not white. Fix: "A tall bird keeps checking the pot. Hums in ones and zeros." And make the feather "a long feather, black and white at the tip" (a stork, or the Mayor's white-eyed train). Better still, make it grey, so the clue stays fair without pointing at one bird.
- **The soldiers' drain lands after the tier is fixed.** "The tier is fixed at the core door" (STORY.md:532), but side story 7's drain is "at the Summit Rift" (STORY.md:531; SIDE-STORIES.md:286), which comes after the core. Fix: the soldiers guard the **Tower Door** (or the drain applies at the core door). Keep the Summit Rift parade as flavour.

### 9. (Low-medium) References to things never planted

- **Frogling's Sorting Room blue line**, "Remember the café? You said the cocoa had a sound argument." (STORY.md:524). Pip never says this in the Ch3 outline. It exists only in UNDERSTUDIES' Rubberstamp sample (line 148), and the Café is optional (problem 1). Plant Pip's cocoa line at the Café or Rift Landing (required after fix 1).
- **The Oracle misses Pip**: "He was the only one who ever asked me to slow down." (STORY.md:523). Pip dies at the Sorting Room, the floor **before** the Oracle Chamber, so he never meets the Oracle on screen. Plant it (Pip at the Tower Door: "The Oracle answers my forms in a millisecond. I always ask it to slow down."), or give the line to someone who met him.
- **The Fox's Ch4 reveal**, "It never wanted anything. It counted." (STORY.md:593), contradicts the spine ("What the Algorithm wants: 100%") and the core's "I wanted to un-learn it". Use "It didn't hate me. It didn't even know me. It counted."
- **The Moth-kin Ch1 blind spot** ("An empty sack. Tiny. Nuts, probably. Nothing to see.") dismisses a detail instead of over-reading one. That is not Perception's typical error (AVATARS §2.2: "a vivid detail that proves nothing"). Example: "Look. Pot salesmen with tiny hats. Very polite hats. Harmless."

### 10. (Low) Smaller items

- **STORY.md:103** stages "At your door" at "the same node" (the Nut Stall). Either it is a second scene at Your Home (`burrow`, revisited), or call it "That evening, at the Nut Stall".
- **The Ch2 Hall fallback host is the Constable** (STORY.md:292, 327), but the boss description never puts him at the feast. Add him at the door: "Constable Clobber, guarding the soup. Two p's in 'soup'?"
- **The Raven Ch2 blind spot/reveal** ("Smooth words. Still a story.") does not fit `cover = visitor`, which is true. Give `visitor` a Raven reveal: "True words. Still no proof. Interesting."
- **Granny's climax prompt**, "Ask her the Mayor's favourite sentence", assumes Granny heard his habit from the kitchen. Give one kitchen hum: "The Mayor came to taste the stock. Said a sentence that ate itself."
- **UNDERSTUDIES.md:40 and 80** have Pip "speak the arrivals", but the resolver (§3.1, step 4) skips silent roles' script lines, and `fallback` applies to host slots only. Either add `scriptFallback: 'pip'` for `narrator` in Ch3–4, or say the arrivals are silent until Kuku. Also: with `fallback: { '*': 'pip' }`, Pip would host the Road's and the Fair's narrator slots when you walk back. Restrict it to Ch3–4 nodes.
- **UNDERSTUDIES.md:193** cites "imps can wear anyone's face, STORY rule 8". Rule 8 no longer says that. Cite Appendix A.9 or drop it.
- **Side story 2:** before the Gate, Nudge is at the Gate's winch, yet "digging towards the Gate's winch" from the Well. After Ch2 it is masked or maskless and running the vote counter. In late play, replace Nudge with "a sackless imp" or give its chapter look.
- **Side story 5:** `paradox-board` set after the Hall has no reader. Add a late-play keepsake ("the board, framed").
- **Side story 7:** "Sequins changed or gone" (SIDE-STORIES.md:282) is false at Ch1 tiers 1–2. Use "Sequins quieter than usual" or branch on `stakes.ch1`.
- **Copy lines with `brave` unset** (STORY.md:530, 534) and "your most-used line" (STORY.md:573) need a fallback: the cover line, or "I AM {name}. 100%."

---

## What is now right (keep)

- **The understudy system** is clean and testable. Original, then arrived understudy, then named stand-in, then silence. `met` lists, six arming conditions, a disarmed 4 stored as 3, everything keyed on `dead:`. The `risked:` lock and `canPossess` honour teacher note 9 exactly. Pip is the one possessed known NPC, and the possession uses his single moment.
- **The off-stage rule holds** in every written line I checked across the three files. Kuku's clock, Achilles' charm and Tally appear only behind `dead:` (and `arrived:`), and the Quiet Scenes never include an understudy.
- **The Quiet Scenes** are solemn, with no reward and no jokes, and the villain's callousness stays outside them (note 4).
- **The four choices pay off:**
  - Ch1: the turn-back changes the reveal order and the clock.
  - Ch2: the Mayor outcome changes the Hall's start, stage 1, drains and lines.
  - Ch3: the bargain changes the arming, Copy, Stairwell, last piece and shadow.
  - Ch4: the fate changes the shelf.
- **The antagonists are continuous.** Nudge has a sack, then a mask, then a counter, then a job, then a question. Quill is ally, Arch-Imp, Juror One, last believer. Fin is the misjudged villain with a clean motive.
- **The world rules now cover what the scenes need:** crack vs rift (A.7), shadow pieces as locks, memory mode (A.12), the loop (A.14).
- **TOK content is correct throughout.** Valid vs sound (Count 1 and the Owlet reveal), bivalence as an assumption, quantifier slips (Count 3), biased samples, base rates (story 9), common cause (story 3), proxies (story 10), Moser's circle. The knights-and-knaves leads all check out.
