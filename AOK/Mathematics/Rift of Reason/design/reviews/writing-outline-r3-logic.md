# Writing gate, outlines round 3, Critic 1 (logic and consistency), 8 October 2026

Rubric: `design/WRITING-CRITICS.md`, Critic 1. Binding direction: `design/TEACHER-STORY-NOTES.md`. Reviewed in full: `design/STORY.md` (Part I, Appendices A–K, including "Round 3"), `design/SIDE-STORIES.md`, `design/UNDERSTUDIES.md`. Checked against `data/map.js` (links decide what is required), `js/core/world.js` (`complete` reveals all links; `jumpToChapter` keeps flags and gives the kit), `DESIGN.md`, `ROSTER.md`, `AVATARS.md` §2, and my round 2 report (`writing-outline-r2-logic.md`, 7.5).

Proposed map and code changes (removing the Newsstand–Plaza link, the `mayor` village role and Square table, new core trials, the long Ch4 clock) are counted as resolved where Appendix H states them as requirements.

Traced:
- **Owlet girl**, "Characters can die" on, all four deaths. Pattern + Witness; keeps going at the first night; Gate tier 4 (so `nudgeFled`); goes up at the Stairs; Hall tier 4; refuses the bargain; Tribunal tier 4; Kuku at the Stairwell; Sorting tier 4; finale with Achilles (arrived at the Café), Tally (arrives at the shelf), Kuku.
- **Moth-kin boy**, no deaths. Pattern + Gallery; walks back to the open door (`turnedBack`); turns back to the Mayor (`torn`); accepts the bargain; Copy tier 1.
- **Owlet boy**, switch **off**: every brink line, then tier 3.
- **Raven boy**, time-rift jump-in at **Ch2** (no earlier flags), then walks back to the Fair for side stories.
- **Fox girl**, Ch1 played (Granny lost in Ch2), then jumped to **Ch4** (Ch3 skipped); plus a clean jump-in at Ch4.

## Scores

**Overall: 7.5 / 10** (round 2: 7.5; it is now a high 7.5). Almost every round 2 item landed, and several fixes are exactly right: the brink lines, the Ch3 tier-4 aftermath, the pending Quiet Scene "by any route", Achilles' fallback, all defaults unset with fixed text for Exhibit C, the open door for everyone with `turnedBack` set by the visit, the soldiers' drain moved before the Copy's tier, and the map change that puts the Café and Library on every route. The Ch2 leak is gone.

It is not yet scriptable without invention, for three reasons. First, the new **Ch4 long clock** has no rule for filling before the core, or mid-core, and Appendix C's general rule would send the Copy home before you meet it. Second, **a death in the middle of a boss** leaves later boss beats running as if the character were alive and the clock open (Granny's climax prompt; the Ch3 bargain). Third, **the Square's table**, now the mechanism of the Ch2 twist, has no statements, and the accusations staged in front of it cannot be its statements. Hum Charm pairs also now contradict the Quiet Scene.

| Document / part | Score | One-line reason |
|---|---|---|
| **STORY.md** | **7.5** | Round 2 fixes landed. The Ch4 clock, mid-boss deaths, the Square table and the charm rule still need logic a writer would invent. |
| · Prologue | 8.5 | Clean. Tiny: the practice match is listed under the optional Gallery but is required (problem 8). |
| · Ch1 Road | 8 | The open door and `turnedBack` now work. Gaps: the first night if the door is seen first; the Guess-o-Matic's "only time"; a Ch1 jump-in lands behind the Signpost. |
| · Ch2 Boolesbury | 7.5 | The leak is fixed and the Mayor has a real table. But the table has no statements, Granny's climax prompt dies with her, and Quill escapes through a rift her dropped piece locks. |
| · Ch3 Tomorrowton | 7.5 | The required path and the tier-4 aftermath are fixed. The bargain can be offered after the vote has passed; the losses of Nudge and Quill are not staged; EVIDENCE FILED: 3 is wrong on one route. |
| · Ch4 + finale | 7 | Strong design. But the Copy's clock can fill before or during the core, two clocks share the Sorting Room, and the Achilles finale and jump-in boast branches are missing. |
| · Appendices (systems) | 8 | Precise arming, lock, brink and flags. The charm-pair rule contradicts the Quiet Scene, and Appendix C's "plays at once" conflicts with Ch4. |
| **SIDE-STORIES.md** | **8** | Sound. Small items: story 10 shows Achilles without `arrived:` (an off-stage breach in one branch); story 2's stale "winch"; the tier bands differ from Appendix C. |
| **UNDERSTUDIES.md** | **8** | Aligned. It inherits the charm contradiction (§4.3) and has two wording slips (§3.8 "everyone alive"; fixed `quietAt` nodes against the "any route" rule). |

Criterion scores: story logic 7.5 · branches 7.5 · inner voice 8 · continuity 8 · understudies off stage 8.5 · TOK accuracy 9.

---

## Round 2 problems: status

| # | Round 2 problem | Status | Notes |
|---|---|---|---|
| 1 | Café and Library not on the required path | **Fixed** (as a requirement) | Appendix H removes Newsstand↔Plaza; D, G and J agree. With that change, every route to the Plaza runs Café → Library. Residue: EVIDENCE FILED: 3 at the Library is wrong for West Bridge players (problem 8). |
| 2 | No table ever tests the Mayor | **Mostly fixed** | Square table, `mayor` role, Mayor forced honest (H). But its statements are unspecified, and the staged accusations cannot be them (problem 3). |
| 3 | No fiction for a disarmed tier 4; the bargain | **Fixed** | Four brink lines (D), then tier 3; the bargain freezes the vote at its current number. New edge: the bargain after the vote has already passed (problem 2). |
| 4 | Tier-4 residue | **Fixed** | Ch3 tier-4 aftermath ("VERDICT: EXECUTED.", the cold piece); finale beat order ("Got home Tuesday…"); the `dead:sequins` core line keeps "Nobody claps…". |
| 5 | Time rift against deaths, arrivals, defaults | **Mostly fixed** | Pending Quiet Scene by any route; Achilles' finale fallback; every default unset; Exhibit C fixed text. New: jump-ins never hear the boast that the whole arc quotes (problem 5). |
| 6 | Fair Gate after Hum 2; `turnedBack`; two sacks | **Fixed** | The open door shows to everyone; `turnedBack` is set by the visit; Nudge no longer has a sack. Residue: the first night if the door is seen first, and jump-ins (problem 8). |
| 7 | The Hum Charm network | **Partly fixed** | Pairs, the lantern and Achilles' late charm are good. But by the pair rule, humming on yours makes hers (in your bag) sound, so "stays silent" is false (problem 4). |
| 8 | Ch2 clue 2 names Quill; Copy drain too late | **Fixed** | "Somebody tall…", grey feather, soldiers drain at the core. Residue: the Frogling lead is labelled "Hum 3", but the "tall" hum is the fourth (problem 8). |
| 9 | Unplanted references | **Fixed** | Cocoa is planted at the Café; the Oracle–Pip line is gone; the Fox's reveal no longer says "never wanted"; the Moth-kin Ch1 blind spot over-reads lanterns. |
| 10 | Smaller items | **Mostly fixed** | The evening scene, the Constable at the door, Raven `visitor`, the kitchen hum, narrator silence and Ch3–4 fallback limits, the A.7 citation, story 5 keepsake, story 7 wording, the Copy fallback "I AM {name}. 100%." are all done. Left: story 2 still says "the Gate's winch" (problem 8). |

---

## Remaining problems, by severity

### 1. (Medium-high) The Ch4 Copy clock can fill before the core, or during it, and two clocks overlap

- **The rule conflict.** Appendix C (STORY.md:655): "If Danger fills first, the tier-4 outcome… plays at once." Ch4 (STORY.md:527, 532): "its tier is set when the last trial is won", and tier 4 is "It gets home complete" (STORY.md:536). Trial 3 *is* the Copy (STORY.md:531). If the bar fills on the floors or at trial 1–2, either the Copy leaves before you meet it (and the temptation and trial 3 have no Copy), or the general rule is broken. The case is reachable. The start is up to 3, the first wrong check on each of 5–6 floors, every hint, and the Oracle push (+1) can exceed 8 before the core. Then the core's "Let me hear it once more" (+1) has nowhere to go.
- **Two clocks at the Sorting Room.** Pip's glow (6) is a stakes scene where "mistakes tick the clock instead of costing hearts". The Copy bar also takes "the first wrong check on each floor" (STORY.md:668). Does one wrong check at the Sorting Room tick both?
- **Two events at the Oracle door.** With `dead:pip`, Pip's Quiet Scene plays "at the door of the next floor" (STORY.md:519), the Oracle Chamber. That is exactly where the Copy's push happens (STORY.md:668): "your own words in the wrong mouth". There is no order, and the push is mockery placed against a Quiet Scene (teacher's note 4).

**Fix (three lines in Appendix C):**
- "Ch4 exception: the Copy's bar never resolves early. At 8 it shows UPLOAD COMPLETE · WAITING, the Copy waits at the core, and the tier is read when trial 3 is won (8 = tier 4)."
- "At the Sorting Room, mistakes tick only Pip's glow; the Copy bar pauses there."
- "With `dead:pip`, the Copy's push moves to the Oracle win."

### 2. (Medium) A death in the middle of a boss, and the bargain after the vote has passed

Appendix C lets Danger fill before Progress, and the puzzle then continues. Some later scripted beats assume the character is alive or the clock is still open:
- **Ch2 Hall.** If the rope reaches 8 in stage 1 or 2, Granny's line "Don't watch the rope, dear. Watch her." (STORY.md:299) points at Quill before stage 3 reveals her. Then the climax prompt, "Ask her the Mayor's sentence" (STORY.md:294), is a Granny line, so the silence rule skips it. The climax beat has no prompt.
- **Ch3 Tribunal.** The bargain comes "right after Count 2, with the vote high" (STORY.md:414). If the vote reached 8 in Count 1 or 2, the Algorithm offers to "stop the vote" after it has passed, and maybe after the Sundial has died. Accepting is meaningless, and it would still cost two pieces and +2 Copy notches. The character reference ("Ninety years I've known that rock…", STORY.md:420) has no fixed place, so it can play after the death.
- **Ch1 Gate** is fine: nothing after the push depends on Sequins.

**Fix:**
- Hall: Granny's tier-4 line becomes "Don't watch the rope, dear. Watch the table." The climax prompt falls back to the avatar ("Her sentence. The one that ate itself.") when `dead:granny` is set.
- Tribunal: "The bargain is offered only while the vote is below 8 and the Sundial lives; otherwise it is skipped." The character reference plays before Count 1.

### 3. (Medium) The Square's table, the mechanism of the Ch2 twist, has no statements, and the staged ones can't work

STORY.md:274 stages "Mrs Crumb accuses him of the missing loaf; he accuses Smudge; Smudge accuses Mrs Crumb", then "a three-villager table settles it… the Mayor forced honest… nobody here is an imp." Under A.9 (STORY.md:626), villagers inside a puzzle always tell the truth. So if those accusations are the table's statements, "nobody is an imp" makes all three loaf accusations true, which is impossible with one loaf. The Mayor's accusation of Smudge is also false, yet he is forced honest. If they are imp accusations instead, a three-person accusation cycle has **no** consistent world. Either way, a writer and the generator must invent the real statements.

The village lead bank also misleads here: "Two villagers accuse each other? Exactly one is an imp." (STORY.md:784) at a table whose answer is "nobody". And the Moth-kin reveal, "Bread in his hat. Guilty of bread." (STORY.md:327), means the loaf question is answered outside the table. Say so.

**Fix:** state in beat 3 and Appendix H that the loaf squabble is scene, not table. The table's three statements are about imps and true in only one world, for example Crumb: "Smudge is no imp." Smudge: "At least one of us is honest." Mayor: "Mrs Crumb and I are the same kind." The unique answer is "nobody". Give the Square its own lead line instead of the bank's: "Owlet: 'Find a world where anyone lies. If none works, nobody does.'"

### 4. (Medium) Hum Charm pairs contradict the Quiet Scene

A.4 (STORY.md:621): your charm pairs with Granny's, and an unworn charm still sounds (her charm "in your bag hums" at the Café). Then in the Quiet Scene (STORY.md:370), "You hum on your own charm. Her charm, in your bag, stays silent." By the rule, your hum comes out of her charm. UNDERSTUDIES §4.3 (line 507) adds "humming on it gets no answer", which is false after Achilles puts his charm on.

**Fix (one sentence in A.4):** "A charm only sounds when worn." In the Quiet Scene you put her charm on beside yours and hum. It plays back only your own hum: "Only mine." This also explains why Achilles' unworn charm heard nothing, and why hers hums at the Café (you wear it now). In §4.3, change the line to "hums only for Achilles, after he arrives".

### 5. (Medium) Jump-ins never hear the boast that the whole arc quotes

The hero's flaw is the Fair Gate boast. It is quoted at the Gate (STORY.md:169), the Plaza (388), the Prediction Hall ("YOU SAID 'ALWAYS'", 499), core trial 2 (530), the Copy ("YOU WANTED THIS AT THE FAIR", 531) and the trophy question (564). None of the four "Previously…" recaps (STORY.md:152–155, 263–266, 374–378, 488–491) mentions the boast or the trophy. So a Ch3 or Ch4 jump-in is quoted saying a line they never said.

Related: for a Ch4 jump-in, n is never 0 at the core, because the Prediction Hall's LEFT/RIGHT is offered first. So the "n = 0" line (STORY.md:551) is unreachable, while "1 data points" is reachable. And the Prediction Hall readout at n = 0 must leave out the k-of-n field.

**Fix:**
- Add one line to every "Previously…": "At the Fair you said you'd win the Thinking Trophy. 'I always know the answer.' Something heard."
- Core: use "{n} data point(s)", with n ≤ 1 → "One data point. I still called it knowing."
- Readout: omit k of n when n = 0.

### 6. (Medium-low) Branches with understudies in the finale, and one off-stage breach

- **Finale beat 1** (STORY.md:561) is Granny-only fiction: "got home on Tuesday", "That's my {name}.", and she "has already sat on it". With `dead:granny`, `role:granny` is Achilles, who did not walk home from 1850. If Achilles is on his fallback (a jump over Ch3), he is "at her card table in person" while the Copy "sits at her card table, being you". Beat 3's "Downhill. Through time. Took ages." (STORY.md:563) is also Granny's. **Fix:** Achilles variants. Beat 1: "Came to sit at her table. Somebody was already sitting there." Beat 3: no travel line. With the fallback, his arrival line comes first, then the Copy.
- **Beat 3's** "The Sundial: 'Will this one grow up loud?'" has no `dead:sundial` variant. Give it to Kuku ("I can't predict that. I can only tell the hours.") or skip it.
- **Side story 10** (SIDE-STORIES.md:370, 387) shows Achilles whenever `dead:granny` is set, without `arrived:granny`. A student who lost Granny and was jumped over Ch3 meets him here before his arrival: an off-stage breach. **Fix:** gate on `arrived:granny`; otherwise the story plays without the Granny figure, with Volt as the slow one.

### 7. (Medium-low) Antagonist losses that the tables promise are not staged

- **Nudge** "loses its followers (Ch3)" (STORY.md:54, 903). No Ch3 aftermath line stages it at any tier (STORY.md:428–429). Its followers are lost at the Ch4 core instead ("My followers…", STORY.md:530). Its "job (Ch4)" is never lost on screen, and how it "follows you home" is never shown before it turns up at the shelf (STORY.md:563).
- **Quill** loses "her jury (Ch3)" (STORY.md:55): not staged.
- **The Guess-o-Matic:** "for the only time after he dies: 'PROBABLY… KEEP GOING.'" (STORY.md:185), but it beeps "PROBABLY." at the core in every branch (STORY.md:537).

**Fix:**
- Ch3 aftermath, tiers 1–3: Nudge's counter drops ("My followers… unfollowed me?"), and Juror One's mask turns away from the screens. Tier 4: the counter peaks, then "…Why is nobody cheering?"
- Ch4: after the reveal, the core says "NUDGE. YOU ARE NO LONGER REQUIRED." Nudge picks up the brass box and comes with you.
- Change the table so the followers are lost in Ch4 and the jury in Ch3, or match the text to the table.
- Guess-o-Matic: "the only time until the core".

### 8. (Low) Smaller items

- **First night after the open door** (STORY.md:165–166). A player can see the empty cottage after the Well win and before the first night (for example while going back for side story 1). The first night's "She's asleep. Obviously." and "go back?" then contradict what they saw. Add a `turnedBack` variant: "Nothing hums back. You know why."
- **Open door for jump-ins** (STORY.md:166, 913). It starts "from the Ch1 Well win". A Ch2+ jump-in who walks back finds Granny at her card table although the recap says she was taken. Make it "from the Well win, or once any later chapter has been entered".
- **Ch1 jump-in** lands at the Forest Road (`chapters.ch1.start`), behind the Signpost, so clue 2 and the Moth-kin blind spot (STORY.md:161, 206) are missed. Play the Signpost lines at the Forest Road for jump-ins. The Campfire `brave` callback (STORY.md:167) needs an unset variant.
- **EVIDENCE FILED: 3** at the Library (STORY.md:387) is 2 for West Bridge players. Use "{n}", +1 per Pip-hosted win.
- **The Frogling's "Hum 3"** (STORY.md:329): the "tall" hum is the Clock Tower's, the fourth in order (Stone Circle, Square, Clockmaker, Clock Tower). Write "Clock Tower hum".
- **Quill's escape** (STORY.md:300): her scarf, piece 2, has just fallen, yet she runs through the Sky Rift that the piece locks (A.1, STORY.md:618). Add to A.1: "The feed's own pass its doors freely; the locks are against you."
- **The Fox's Ch4 reveal** "at the Core" (STORY.md:578) plus "Your voice comes back with one line" (STORY.md:537, 553) gives the Fox two lines where one is promised. Merge them.
- **Kuku "asks the Ch3 question"** (STORY.md:500), but it is in the first person ("He made me say it", STORY.md:455). Give Kuku a version: "He made it say 'I guess', to get its shadow home. Was he right?"
- **The Copy's "borrowed voice"** (STORY.md:497) is defined only with `bargain`. With `dead:sundial`, the jar is "empty, and warm" (STORY.md:500): say where the voice went (or that it is your own voice, recorded).
- **Pip's lantern** (A.13, STORY.md:630, 757): the Fair keeps lanterns for people it loves, and Pip never lived there. Add: "a new lantern, lit by you, for Pip".
- **Fin's turn** (STORY.md:428): "It had to say it in court. Then the shadow was evidence." But he entered Exhibit A at the Library, before the trial (STORY.md:387). Reword: "I entered your shadow as evidence. It had to say 'I guess', or the court would drop it. Evidence goes home."
- **TOK:** the Owlet's "Valid isn't true!" (STORY.md:443) mixes up arguments and statements. Use "Valid isn't sound! Hit the first premise!"
- **The practice match** is listed under the Gallery (STORY.md:109) but is required whatever two stalls you pick (`fair-rift.requiresFlag: 'story-battle-won'`, map.js:69). Move it out of the stall list.
- **A pending Quiet Scene and a jump backwards.** A pending scene would play at an *earlier* chapter's opening (for example Pip mourning the Sundial in Boolesbury). Say "the first chapter opening, at or after the next chapter".
- **SIDE-STORIES.md:**
  - Story 2 still says "digging towards the Gate's winch" (line 122). There is no winch at the Gate now; use "digging under the Gate, towards the cage".
  - The side-story tiers "0–2 / 3–4 / 5 / 6" (line 42) differ from Appendix C's 6-notch "0–1 / 2–3 / 4–5 / 6", and "Danger 4" has no bands. Pick one.
  - The header still says "round 2".
- **UNDERSTUDIES.md:**
  - §3.8 (line 416), "a time-rift jump-in gets STORY.md's default flags (everyone alive)", could be read as a reset. Say "flags already set are kept; unset ones stay unset" (A.14: no time-rift undo).
  - The fixed `quietAt` nodes in §3.1 should say "or the first later chapter opening" (§3.6).

---

## What is now right (keep)

- **The death machinery is complete and testable.** `met` lists all on the required path once the map change is made; six arming conditions; brink lines; a disarmed 4 stored as 3; the `risked:` lock; `canPossess`; silence, then a named stand-in, then `arrived:`.
- **The off-stage rule holds** in every STORY.md and UNDERSTUDIES.md line I checked. Kuku's clock, Achilles' charm and Tally appear only behind `dead:` and `arrived:` (story 10 is the one breach).
- **The four choices pay off.** `turnedBack` now keys on the visit. `mayor` changes the Hall start, stage 1, drains and lines. `bargain` freezes the vote and changes the Copy, the Stairwell, the last piece and the shadow. `fate` changes the shelf.
- **Possession follows teacher note 9 exactly**: caricatures carry it; Pip is the one known NPC, using his single moment; the Algorithm faces you in its own body.
- **Time-rift handling:** recaps, kits, unset defaults with fixed text, memory mode, and the pending Quiet Scene by any route.
- **TOK content is correct throughout:**
  - valid vs sound, and bivalence as an assumption broken by the liar sentence;
  - "This statement is true" fits either stamp;
  - quantifier slips, biased samples, base rates (story 9) and common cause (story 3);
  - proxies (story 10), the casket labels (story 4, unique answer B), and "two worlds fit" (story 6);
  - Moser's 31, and every knights-and-knaves lead.
