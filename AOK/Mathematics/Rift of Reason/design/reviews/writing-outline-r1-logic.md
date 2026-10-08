# Writing gate, outlines round 1, Critic 1 (logic and consistency), 8 October 2026

Rubric: `design/WRITING-CRITICS.md`, Critic 1. Reviewed: `design/STORY.md`, `design/SIDE-STORIES.md`, `design/UNDERSTUDIES.md` (all in full). Checked against `data/map.js` (node links decide what is optional), `js/core/world.js` (time-rift jump), `js/puzzles/village.js` and `line-drawer.js`, `data/script/lesson2.js`, `DESIGN.md`, `ROSTER.md`, `AVATARS.md` §1–2, and the baseline `writing-baseline-2026-10-08-logic.md`.

Traced:
- **Owlet girl** (board power), Characters can die on, every death happens (Sequins, Granny, Sundial). Prologue with Pattern + Gallery (Witness Tent skipped), Ch2 without the Schoolhouse.
- **Frogling girl** (Fate power), no deaths (clean or close saves), every optional station visited.
- **Raven boy** who jumps in through the time rift at Ch3 with no earlier flags.

## Scores

**Overall: 6.5 / 10.** This is a big step up from the 5 at baseline. Nearly every baseline problem now has a fix in the outline, and most of those fixes are good. Hosts are physically present. The Oracle and the Post Office no longer contradict themselves. Clobber has one name. The Tower Road moves behind the trial. Recaps, `brave` payoffs and Hexling are in. The spine is causal (shadow pieces as locks, Granny as the cost of saving Sequins). The four twists are set up fairly.

It is not yet scriptable without invention, though. The death branches are the weak point. The "every tier" scenes forget tier 4. Understudies get onto the stage through the live-resolution system before their arrival beat. The Hum Charm is in two places at once. The rule that arms a death is undefined. Separately, several required beats sit on optional map nodes, and world rule 8 (imps always lie) is broken by the outline's own scenes.

| Document / part | Score | One-line reason |
|---|---|---|
| **STORY.md** | **6.5** | Strong spine and setup. Tier-4 and optional-node branches are missing; rules 5 and 8 are broken in its own scenes. |
| · Prologue | 7.5 | Clean. The Pattern Stall (Guess-o-Matic setup, `firstStall`) is optional (2 of 3 stalls). |
| · Ch1 Road | 7 | Good twist with 5 clues. "YOU SAVED THE MAGPIE" plays even when he died. Sequins dies falling into "the rift" that you walk through unharmed. |
| · Ch2 Boolesbury | 6 | Post Office, School and Bakery are optional but carry `cover`, the Owlet blind spot, the Raven blind spot and a lead. Rule 8 vs the Mayor's fibs and Quill's true lines. `village.js` can roll Quill as honest. |
| · Ch3 Tomorrowton | 6 | The tier-4 trial ending contradicts "Win, every tier". The Newsstand is optional. The recap doesn't set up the twist for jump-ins. TOK note error ("two counts not deductive"). |
| · Ch4 + finale | 6.5 | The readout reads your inner voice (breaks rule 5). The Copy's push needs an optional line. Upload 80% vs "deleted at a few per cent". The finale's "Not yet" fails for questions the core answered. |
| · Systems (§4–6, §12) | 6 | The flag table is good. "No death without a meeting" is undefined. Which stakes value is stored when a death is disarmed is unstated. The Feed rules differ from UNDERSTUDIES. |
| **SIDE-STORIES.md** | **7** | Self-contained, fair twists, ripples capped. "Any two clues" is false for story 4. The lesson-3 trigger is optional. Some late-play fallbacks are missing. |
| **UNDERSTUDIES.md** | **6** | Off-stage rule kept in the written lines, broken by the live resolver. Contradicts STORY on `away:`, the no-meeting rule, the Hum Charm, Kuku's origin and the Feed. |

Criterion scores: story logic 6.5 · branches 5.5 · inner voice 7 · continuity 6 · understudies off stage 6.5 · TOK accuracy 7.5.

Baseline check: P1 (hosts) fixed except the death case (problem 2). P2 fixed. P3 fixed. P4 fixed (link moved; Fin's "a case"). P5 mostly fixed, but the Ch3 recap is too thin (problem 8). P6 fixed. P7 fixed, with one new TOK slip (problem 11). P8 fixed.

---

## The biggest problems (by severity)

### 1. Required beats sit on optional map nodes (Ch2, Ch3, Prologue)

From `data/map.js` links: in Ch2 the Post Office, Bakery and Schoolhouse are all optional. The required path is Lever Bridge, Lamp Lane, Square, Clockmaker, Clock Tower, Stairs, Hall. In Ch3 the Newsstand is optional (South Bridge, West Bridge, Café, Library, Plaza). In the Prologue only 2 of 3 stalls are needed.

- **`cover`** is set only at the Post Office (STORY.md:536, 592). But the Clock Tower is required and is "the second, harder interrogation… with your cover story" (STORY.md:525, 540). If the player skips the Post Office, it is the first interrogation and has nothing to quote. Exhibit C (STORY.md:721) and the Copy (STORY.md:824) read an unset flag.
- **Owlet Ch2 blind spot** is at the School (STORY.md:609), but its reveal is at the Hall climax: "I called it the first rule". The Owlet girl trace skipped the School and hears a reveal of a line she never heard.
- **Raven Ch2 blind spot** is at the Post Office (STORY.md:613), with its reveal at the Clock Tower. The blind spot also says "postman" when the Raven's own cover is "letter carrier".
- **"Three useful leads per chapter"** (STORY.md:262) uses the Bakery (Ch2) and the Newsstand (Ch3) (STORY.md:605, 738). A minimum-path player gets two.
- **Ch3 Newsstand** carries twist clue 1, the Frogling story lead, the Raven blind spot and the Raven reveal ("'Admits' was the headline's word", STORY.md:746). It is also the **lesson-3 side-story trigger** (SIDE-STORIES.md:19), so a minimum-path player never unlocks stories 7 and 8.
- **Hum ladder** fires "after 2, 4 and 6 Ch2 stations" (STORY.md:545). The required path has only 5 puzzle stations before the Hall, so Hum 3 (clue 5, the tall bird) is not guaranteed.
- **Café hum** (STORY.md:679) is optional. In the dead-Granny branch it is the only place the understudy explains why he has her charm.

**Why it matters:** these are the "missing branch" failures the rubric names. They hit the most common classroom path, which is the shortest one.

**Fix:**
- Ask the Constable's cover question at whichever interrogation comes first: "Who are you?" as a `choice` with `when cover unset`. The Clock Tower line becomes "Again. From the top" only when `cover` was set at the Post Office.
- Move the Owlet Ch2 blind spot to the Square, as a reply to Quill's "Every claim is true or false". Move the Raven one to the cover choice itself, worded per cover.
- Key leads to required stations only: Ch2 Lever Bridge and Lamp Lane; Ch3 Neon Bridge and Data Lab.
- Change the lesson-3 trigger to "Plaza scene played".
- Change the Hum ladder to "after the Square, after the Clockmaker, after the Clock Tower" (all required).
- Put the understudy's first-hum line on whichever hum comes first in Ch3.

### 2. Understudies reach the stage too early, and in places they cannot be (the live resolver)

UNDERSTUDIES.md §3.3 (line 361) and §3.4 (line 365) resolve live text, station hosts and reminders to "whoever is there now", meaning the first actor without `dead:`. So the moment the stakes widget sets `dead:sequins` mid-boss ("The puzzle goes on", STORY.md:439):
- the Gate's host panel and reminder (host `sequins`, STORY.md:411) switch to **Tally**, on the Road, in a cage that just fell;
- `dead:granny` puts **Coach Achilles** in the pot's host panel in 1850s Boolesbury (STORY.md:527);
- `dead:sundial` makes every `narrator` line from the Tribunal on resolve to **Kuku**: the Tower Road host (STORY.md:671), Ch4 asides, the rest stations. STORY.md:237 and UNDERSTUDIES.md:80 say "silence until the Stairwell". STORY.md:123 says the understudy narrates "from Ch4 on". These disagree with each other too.

**Kuku's origin is given three ways:**
- "a pocket cuckoo clock you carry" (STORY.md:215);
- "pops out" of the jar in the Tower (STORY.md:810);
- "living in Granny's hallway clock" for 300 years (UNDERSTUDIES.md:40).

A writer has to invent how a clock from Granny's hallway gets into a jar in the future.

**Why it matters:** this is the teacher's hard rule in practice. An understudy must arrive through a beat, not appear because a flag flipped. It also brings back baseline P1 (hosts in impossible places) in the death branches.

**Fix:**
- Add a third state to the resolver: `actor(role)` returns the understudy only once `takeover:<role>` (or a new `arrived:<role>`) is set. Between death and arrival the role is **silent**: lines are skipped and the host panel is empty.
- Name each arrival beat in STORY.md: Tally at the Pattern Stall takeover; Achilles at the first Ch3 hum; Kuku at the Stairwell jar.
- After a tier-4 death mid-boss, switch the host for the rest of the boss: Gate to `narrator`, Hall to `constable`.
- Pick one Kuku origin. Suggestion: the imps took Granny's hallway clock in the same sack (only revealed after the death). The Tower files every confiscated clock with the Sundial's voice. Kuku hops out of the jar and lives in your pocket from then on.

### 3. "No death without a meeting" is undefined, and the disarmed result is not stored consistently

STORY.md:197 arms a death only if the player saw "every earlier story scene featuring that role". UNDERSTUDIES.md:314 says the same.

- The Sundial speaks in or over almost every station (asides, rest stops, hosts). Skipping one optional node (Standing Stone, Mines, West Bridge, Garden) therefore disarms the game's biggest death for almost every player.
- For Granny, it is unclear whether hums, the optional card lesson or the Hum 3 that is not guaranteed (problem 1) count.
- Skipping optional Granny or Sequins content makes them immune. That is a perverse lesson for the students who discover it.
- UNDERSTUDIES.md:32 gives a different disarmed outcome ("carried off and found in the next chapter") from STORY.md:197 ("Saved at a price").
- Nobody says whether a disarmed tier 4 is saved as `stakes.chN = 3` or `4`. That matters because carry-forward scenes are keyed on the stakes value, not the death:
  - Ch3 Plaza: "If `stakes.ch2 = 4`" (STORY.md:678);
  - the flag table: Stairwell jar on `stakes.ch3` 4 (STORY.md:927).

  With 4 stored and no death, a living Granny's shawl is "taken back from the stream", and a living Sundial's jar opens.

**Fix:**
- Replace "every earlier scene" with an explicit list of required beats per role, held in `data/cast.js` as `met: [...]`:
  - Sundial: `prologue.wake`, `prologue.rift`, `ch3.arrive`;
  - Granny: `prologue.fair`, `prologue.rift`, Hum 2;
  - Sequins: `prologue.pattern`, `prologue.rift`, `ch1.well`;
  - Syllo: `stall-gallery`, the Fair Gate challenge;
  - Mayor: `ch2.square`.
- State that a disarmed tier 4 is stored as **3**.
- Key every carry-forward scene on `dead:<role>`, never on `stakes = 4`.
- Align UNDERSTUDIES.md:32.

### 4. Granny's Hum Charm and shawl are in two places at once (STORY §5, UNDERSTUDIES §1–2, §4.2)

- STORY.md:100: Granny keeps the second charm. She hums from the sack (Hum 3, STORY.md:426) and from the kitchen and pot (STORY.md:532, 545–548). So the charm is with her in the pot.
- STORY.md:230 and UNDERSTUDIES.md:41, 93 say "her other Hum Charm was in her cottage", where Achilles finds it.
- **Shawl:**
  - At tier 3 (she lives), "her shawl has boiled away" (STORY.md:562).
  - At tier 4 (she dies), the shawl survives and is recovered from the stream as an inheritance (STORY.md:229).
  - UNDERSTUDIES.md:466–467 and 502 give keepsakes only at the memorial and only if `knew:granny`. STORY.md gives the shawl at the Plaza to everyone.
  - The Shawl "drains the next stakes clock" (STORY.md:250), which is the Ch3 trial, but it is also listed as a Ch4 core drain (STORY.md:826).
- **Achilles** hums "from the Road" for the character reference (STORY.md:727). He is in her cottage and has no reason to be on the Road, nor at the lesson-4 Campfire (SIDE-STORIES.md:476).

**Fix:**
- Tier 4: the imps' stream at the Plaza shows the pot with Granny's charm on a string. You take back the charm, not the shawl.
- Give the set a third charm, so Achilles has his own: Granny gave it to him years ago "for emergencies, which he never had". Say this only after her death, so it is not foreshadowing. He hums on that charm from Ch3 on.
- Keep the shawl boiled at tier 3. At tier 4 make the inheritance **Granny's Spare Axiom**, found in the charm's pouch.
- State once whether keepsakes are given at the recovery scene or at the memorial.
- Make the trial line "role:granny hums" with no place in it.
- Give Achilles a reason to be at the Campfire: "Ran the Road looking for her. Twice."

### 5. "Every tier" scenes forget tier 4

- **Ch1:** "PREDICTED. YOU SAVED THE MAGPIE. I TOOK THE TORTOISE." (STORY.md:426, 489) plays even when Sequins fell. Needs a tier-4 variant: "PREDICTED. YOU TRIED TO SAVE THE MAGPIE. I TOOK THE TORTOISE TOO."
- **Ch3** "Win, every tier" (STORY.md:734):
  - Judge: "Case dismissed";
  - Fin: "My first loss";
  - Algorithm: "VERDICT REJECTED";
  - Frogling reveal: "Never lost. Until now" (STORY.md:745);
  - Exhibit A "goes back to its owner".

  At tier 4 the vote passed and the sentence was carried out, so Fin won and the owner is gone. Write a tier-4 ending: the case is dismissed *after* the sentence; Fin: "I lost the argument. I won the vote. I feel… worse." The piece goes into your pocket. The Frogling reveal waits until Ch4.
- **Ch4:**
  - Tier 4 "It said 'like and subscribe' to Granny. She subscribed" (STORY.md:835) names Granny. It should name `role:granny` in its text.
  - At tiers 3 and 4, finale step 2 has `role:granny` "just walked in" (STORY.md:877), but steps 1 and 3 have her already sitting on the Copy.
  - Step 6's "I will dust it later" (STORY.md:881) needs a `u` line for Achilles ("She'd have said she'll dust it later. I'll do it now.").
- **Sky Rift** (STORY.md:543) has no `dead:granny` line, and the Sundial's direction-finding ("That way. Probably.") has no `dead:sundial` owner before Kuku arrives.

### 6. World rule 8 is broken by the outline's own scenes, and by `village.js`

STORY.md:104: "Imps always lie, in every village puzzle and every scene. Honest folk always tell the truth."

- The Mayor is honest folk, not an imp, yet he fibs about bread ("I have not seen your loaf", STORY.md:534, 625) and says "Nothing is wrong".
- Quill is an imp, yet she says true things:
  - "Saying so proves nothing, Smudge" (STORY.md:538; the outline itself notes "She is right");
  - "It is neither" about the liar sentence (STORY.md:626; SIDE-STORIES.md:259).
- If imps always lie, their reports to the Algorithm (§2.5, the `cover` leak) are lies too.
- `js/puzzles/village.js:39, 48–49` includes `schoolteacher` in every d2/d3 village roll. So Bakery d2, Schoolhouse d2 and **Town Hall stage 1** can show Quill as honest and verified by the table. Stage 3 then forces her to be the imp (STORY.md:1037). The game's own truth table "proves" the twist false.

**Fix:**
- Scope rule 8: "Inside a village puzzle, imps always lie and villagers always tell the truth. Outside, people are people." Or keep it total and audit every Quill line to be literally false or not a statement. Her motto "A statement is either true or false" is false, which is a lovely payoff. "Saying so proves nothing" becomes "Saying so makes it so, Smudge."
- Exclude `schoolteacher` from every village roll in Ch2 except stage 3 (`excludeRoles` option).
- Have the imps' reports be "the opposite of what you said, which the Algorithm flips back. It is good at that."

### 7. The Algorithm knows what it could not have seen (rule 5 vs Ch4)

STORY.md:101 says "It never knows anything it could not have seen". But the Prediction Hall readout (STORY.md:809, 898; §6 line 299) quotes `voice.followed`, and "YOUR VOICE SAID LEFT" reads your **inner** voice. Hints used and card powers include places with no crack, screen or imp (the Road, the Garden, the no-screens Café, where Pip's card match is).

Separately, with three marked choices before the Hall, "78%" is impossible: only 0, 33, 67 or 100% can happen. For a jump-in it quotes a `brave` answer and a `firstStall` that never happened.

**Fix:**
- Rule 5b: "It logs what you **do**, never what you think."
- Make the voice line its *guess*: "YOU PICKED THE CLEVER-SOUNDING ONE 2 TIMES OUT OF 3. YOU WILL PICK IT AGAIN." Show the tiny sample on screen. That is a free TOK point that pays off at the core ("three data points. I called it knowing.").
- Count hints and cards only from stations with an eye. Or say the shadow pieces it held were watching ("your shadow told me").
- Omit unset fields from the readout.

### 8. Time-rift jump-ins and out-of-order play

**The Ch3 recap** (STORY.md:648–651) never says who is speaking (the Sundial), who the Algorithm is, who Granny is, or that the narrator guesses since its shadow was stolen. Yet the Ch3 twist is "the defendant is your Sundial", and its clue 1 is "the game's second line" (STORY.md:692).

For the Raven boy jump-in:
- the Plaza lead "I've heard those exact words before" (STORY.md:746) is false;
- the Café hum needs a charm, but the Ch3 defaults (STORY.md:653) give none (Ch1 and Ch2 defaults do);
- Exhibit B attacks "I will go", which has no sting.

**Out-of-order play is unaddressed.** DESIGN.md:34 lets skipped chapters be played later. A student who jumps to Ch2, saves Granny, then goes back to Ch1 hears her kidnapped (Hum 2) after her rescue. Sequins can die at the Gate after the Ch4 finale reunion.

**Fix:**
- Add two Ch3 recap lines: "I am the Sundial. I ride in your shadow." / "Since my shadow was stolen, I guess the time. And I say so."
- Add the Hum Charm to the Ch3 and Ch4 starter kits.
- Exhibit B uses a fixed "the companion followed a stranger's crack" when `brave` is a default.
- Add a rule: a chapter played after a later one plays as a **memory**. Lethal tiers are disarmed; Hum beats show as "Remembered"; flags from later chapters win.

### 9. Unstated world rules a writer would have to invent

- **Crack vs rift.**
  - Sequins dies when his cage tips "into the rift" (STORY.md:425, 439), yet you walk through rifts (rule 1).
  - Granny is carried through the crack alive (STORY.md:1019).
  - Syllo walks into the crack and dies (SIDE-STORIES.md:366), and "nobody who walks into the feed comes back the same" (SIDE-STORIES.md:347).

  Fix: hang the cage over **the crack**, not the rift, and add rule 12: "The crack is the feed. Fall in alone and it keeps you. Imps can carry things through in sacks."
- **The Guess-o-Matic loop.** At the end the young toy and its 100-year-older self sit side by side (STORY.md:87, 878). How did the toy reach the future, and does the young one still become the Algorithm? Fix, in one line: the "IT GUESSES" sign is what changes its future ("This one will always say 'probably'. I've labelled it."). Also give one line on how it got to Tomorrowton (sold at the Fair's closing-down auction, a West Bridge scratch).

### 10. The two files disagree on the gentle switch, the Feed and the arming rule

The known conflict: STORY.md:198 (switch off means Saved at a price, no understudy, no memorial) against UNDERSTUDIES.md §3.9 (line 405) and §5 (line 599), where `away:` puts the understudy in "while she recovers" and the original returns at the finale.

STORY's version should win:
- it keeps understudies fully off stage;
- it needs no "welcome back" lines;
- it matches the no-undo rule.

UNDERSTUDIES still recommends the other in three places (§3.1 table line 323, §3.9, §5). Also, `Cast.lose` is "called only by the stakes-clock widget at tier 4" (line 315), but Quill's `away:` is set by every Hall win.

The Feed rules also differ:
- STORY §4 (line 177): death +2, nothing else.
- UNDERSTUDIES §4.1 beat 6 and §4.3 (lines 468, 519–522): memorial −1 per role, and an unexplained "+3 shields max".

**Fix:** rewrite UNDERSTUDIES §3.9 and §5 to STORY rule 8, and add a `Cast.away(role)` call for scripted absences. Decide whether the memorial gives −1 and put the decision in STORY §4. Delete "shields".

### 11. TOK accuracy slips

- **STORY.md:734:** "(Not 'unsound': two of the counts were not deductive.)" Only Count 2 (statistics) is non-deductive. Count 1 is valid and unsound (false premise), and Count 3 is invalid. Use: "(Not 'unsound': one count was statistics, and one proof was simply invalid.)"
- **Lead bank, liars-gate, Moth-kin** (STORY.md:285): "Two guards say the same thing? Then they are the same kind." This is false: a truth-teller and a liar can both say "I am honest". The Raven lead in the same row says exactly that. Use: "Two guards make the same claim about a door? Then they are the same kind."
- **Ch1 Owlet blind spot** (STORY.md:360): "It starts here and runs down the Road. So the villain is at the end." This is not valid, yet the reveal says "Every step was valid" (STORY.md:465). Make the planted premise explicit: "A crack leads to whoever made it. This one runs down the Road. So the villain is down the Road."
- **`cover = visitor`** ("Just visiting") is true. So the Clock Tower payoff "Lies can be tidy too" (STORY.md:540) does not fit it. Give `visitor` its own line ("A true story holds too. That proves less than you think.") or drop it as an option.
- **Climax pick** (STORY.md:558): "This statement is true" can be stamped either value without contradiction. Phrase the question as "the sentence that breaks whichever stamp she uses", so the wrong option is clearly wrong.
- **Line-drawer leads** (STORY.md:286) are keyed by puzzle id, but the puzzle has two modes (`line-drawer.js:4–12`). Owlet's odd-dot count is useless on dots boards, and Fox's "leave the box" is useless on graph boards. Key the lead by mode.
- **Finale** (STORY.md:880): the avatar answers "Not yet" to `wonder`, but the core reveal has just answered "What were you before?" and "Why do people believe you?". Use per-question answers, or "Partly. It made three new questions."

### 12. Smaller logic items (side stories and Ch3–4)

- **SIDE-STORIES.md:224–226 (story 4):** "Any two clues leave exactly one tin" is false. The dent plus Mrs Crumb's "at most one true" leaves two tins, and so do the labels plus the dent. Only the labels plus the rule solve it. Make the dent clue say which of two tins is the swap, or drop the "any two" claim for this story.
- **Late-play fallbacks are missing:**
  - story 3's `cat-mask` after the Ch2 arrival (SIDE-STORIES.md:194);
  - story 5 played with Gumleaf after the Hall (SIDE-STORIES.md:282);
  - story 1 played after `dead:syllo`, where the cast and drum roll are Syllo's (SIDE-STORIES.md:87, 102). It needs `role:syllo` text.
- **Story 6** shows the Mayor fleeing the "ones and zeros" kitchen with its key (SIDE-STORIES.md:313). At the Feast he then asks, innocently, "Is it soup yet? What's in it?" (STORY.md:552, 630). Give him a story-6 variant: "I'm only here for the bread rolls. I'm not looking at the pot."
- **Ch3 Plaza:**
  - Moth-kin gets three inner lines (story lead, blind spot, Feed answer; STORY.md:743, 748), over the budget of 2 (STORY.md:261).
  - Its blind spot "Thousands of hands up" sits beside a vote of "GUILTY 0" (STORY.md:678). Let the counter climb during the scene.
- **Ch4:** the upload bar reads 80% after the Oracle (STORY.md:813), but at the core it starts at 0–2 of 8, and tier 1 deletes it "at a few per cent" (STORY.md:832). Say that the floors build the Copy and the core uploads it, or pre-fill from the floor percentage.
- **Ch4 Copy push** (STORY.md:825) quotes "your Ch1 comfort line": an optional choice, and missing for jump-ins. Fall back to the `brave` answer.
- **The Sundial has no memorial station** (`narrator` has no `home`, UNDERSTUDIES.md:290). Use `burrow`.
- **UNDERSTUDIES §4.1** example still uses `brave` as a boolean (line 475).

---

## What is already right (keep)

- The shadow-pieces-as-locks rule gives the whole route a reason and makes the rifts unlock in story order.
- Every twist has 5 or more clues. The Ch2 split between story lead and blind spot ("notice the right thing, jump to the wrong suspect") is a strong inner-voice design.
- The flag table is nearly complete: every flag in it is set and read, and `rift-walker` is now live.
- The understudy lines actually written in STORY.md and SIDE-STORIES.md are all behind `dead:` conditions. No understudy is named, shown or set up in any line before their role is vacated. Problem 2 is about the resolver, not the written lines.
- The TOK content is mostly precise and well pitched: Moser's circle, bivalence as an assumption, "never only covers the past", the 70% forecast, proxy variables, base rates.
