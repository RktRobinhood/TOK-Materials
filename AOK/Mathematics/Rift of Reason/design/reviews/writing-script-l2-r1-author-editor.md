# Writing gate, script round 1: Critic 2 (author) and Critic 3 (editor). Lesson 2

Date: 8 October 2026. Rubric: `design/WRITING-CRITICS.md` (Critics 2 and 3). Binding: `design/TEACHER-STORY-NOTES.md`.
Files read in full: `data/script/lesson2.js`, `data/script/leads.js`, `design/AVATAR-VOICES.md`, `design/STORY.md` §4 and Appendices B–E; lesson 1's Granny lines, Gate win, Rift Pass and Quiet Scene (`lesson1.js:100–330, 480–600`); Ch2 nodes in `data/map.js:157–276`.
Benchmark: lesson 1 passed at 8.5 / 8.5 (`writing-script-l1-r3-author-editor.md`), including its carried note E3 ("Ch2 must give Nudge a beat where he blocks or tricks the hero").
Scale: 10 = excellent published game writing, a story I'd fight to publish. 7 = competent but forgettable. Pass mark: 8.

Paths traced:
- **Moth-kin, board-power gender.** Stone Circle → Bridge → Lane → Square (twitch blind spot, scarf lead, suspects the Mayor) → Post Office (cover: lamp tester) → Clockmaker → Tower → Stairs → back to the Mayor (torn) → Hall (stage 1 skipped, Mayor holds the rope) → tier 1 → "Guilty of bread." → Sky Rift goodbye.
- **Raven, other gender.** Poster inner → Clock Tower as first interrogation (cover: letter carrier, "Words make things so") → Tower win reveal → Stairs, "Up the stairs. Now." → Hall, Mayor unset ("Is it soup yet?") → two wrong liar picks → armed tier 4, "Watch her." → helmet → the Sundial's question → Sky Rift → Ch3 Quiet Scene.
- **Owlet, Ch2 time-rift jump-in.** `recap.ch2` → crackle fallback → `ch2.soup` → Square → Hall; brink path ("Rude.") into tier 3.
- **Fox and Frogling.** Every `inner` line in order; Fox on `dead:granny` ("I pictured the wrong face").

The two sections are scored separately.

---

## Section A. Critic 2: Author and style

### Score: **7.5 / 10. Not yet.** The best single lines in the game so far live in this file. The structure around the climax and one missing minion keep it under the gate.

| Criterion | Score | Note |
|---|---|---|
| Not boring | 8 | The Square, the Mayor's scene and the rope warnings are dense with jokes that also move things. Old Wick's two lines and the Clockmaker's set-up are inert (A5). |
| Arc | 8 | Hums escalate (pot → carrots → "somebody tall" → "the water is singing") into the rope. Rewards are gradient and earned. The alive path ends flat (A4). |
| Twists | 8.5 | Quill is fairly clued: "It's neither" inside a Mayor joke, "Hums in ones and zeros", the still scarf, and "I checked it for you" vs Granny's "Check it yourself, dear." That last pair is the thematic heart and it is excellent. |
| Voice | 8 | Mayor, Constable, Granny, Quill, Gumleaf all sound like themselves. Inner voices are recognisable. Nudge has lost his influencer voice (A1). |
| Readable | 8.5 | Almost every line under 15 words and speakable. A handful of slips (A6). |
| Teacher's direction | 7 | Granny's peril is exactly what note 1 asked for. But note 5 (recurring minion who gets in the way) is weaker than in lesson 1, and on the death path the game's own voice moves straight to a puzzle question (A3). |
| Game fit | 8 | Station intros put the goal inside the joke ("Check them. Gently. I bruise."). The interrogation runs ~9 lines before play, acceptable for a story beat. |

### Problems

**A1. High. Nudge is a background extra, not a recurring irritant.** `lesson2.js:87–89, :402, :413, :480`.
- Four appearances, all one line, none between the Stone Circle and the Hall. He never blocks, tricks or costs the player anything before the boss. Lesson 1's review carried exactly this note forward (E3).
- His voice has drifted: "I LOVE the little crank!" is cute, but there is no clicks / views / counting in Ch2. "Engagement!" was cut from the outline line. His mask, which he loses on screen, is never set up on the `!nudgeFled` path, so "My mask! Don't look at me!" has nothing behind it.
- Fix, three small changes:
```js
// :87, the mask set up on both paths
{ s: 'nudge', t: 'Flyers! Ring light smashed, so: new mask. Villagers trust villagers. Feast tonight!', when: '!nudgeFled' },
// ch2.cover, new first line (:156): he sets the Constable on you, so Quill's rescue rescues you FROM him
{ s: 'nudge', t: 'Constable! Stranger! Ask them EVERYTHING! I\'ll count the questions!' },
// :480
{ s: 'nudge', t: 'My mask! Forty villagers trusted that face! I COUNTED!', when: '!dead:granny' },
```

**A2. High. The climax steps on its own best beat, and the hero says nothing when betrayed.** `:442–488`.
- Order now: Quill's confession (`:477–478`), then the scarf, then Nudge's mask, then the first piece, then Smudge's "My sentence! From the board!", then the inner voice. Three bits of business land on top of "I was cruel for forty years", the most Undertale line in the chapter.
- The avatar said "See? She's on my side." and never reacts in their own voice. The Algorithm's "SHE WAS. MY SIDE." needs something to answer.
- Fix: one avatar line before the push, and move the business before the confession so it is the last thing she says:
```js
{ s: 'avatar', t: 'Miss Quill? You were on my side.' },             // new, before :442
// ... push, Granny's prompt, the liar choice, "ONE. ZER—" unchanged ...
// :476 mask slides off; :479 scarf (the piece); :480–482 Nudge and the first piece; :483 Smudge (or cut it)
// then the confession, last (see E2 for the middle line):
{ s: 'schoolteacher', e: 'unmasked', t: 'Forty years I marked "maybe" wrong. Red ink. Every child.' },
{ s: 'schoolteacher', e: 'unmasked', t: 'If "maybe" was allowed… I was cruel for forty years.' },
// then the inner reveals.
```

**A3. Medium. On the death path the Sundial asks its seminar question over her body.** `:513–516`.
- After "Don't watch the rope, dear. Watch her." / "Steam. Then silence." / the helmet, the narrator says "You suspected the Mayor. Miss Quill's table cleared Miss Quill. Who checks the table?" The question is good; its framing (your suspicion score) is cool and analytic at the one moment the teacher wants grief.
- Fix: one grave variant that keeps the question and ties it to her words; gate the four `suspect` lines on `!dead:granny`.
```js
{ s: 'narrator', t: 'Every row, she said. Her whole life. Who checks the table now?', when: 'dead:granny' },
```

**A4. Medium. Lesson 1's set-ups for Granny are not paid off, and the alive path ends on a status report.** `:362–368, :527–530`.
- Lesson 1 planted "Selling soup pots… A pot never hurt anybody." (`lesson1.js:324–325`), "That's my {name}." (`:236`) and "Hum you later." (`:295`). Ch2 is where they pay; none does.
- Rescuing Granny earns one line ("I'll walk home, dear…") and the chapter's last line is "The next piece is up there. In tomorrow. I can feel it." Lesson 1 ended on "So is Granny."; this should end on a person too.
- Fix:
```js
// warn[3], replacing the weakest warning (:365, "Someone has added salt.")
{ s: 'granny', t: 'A pot never hurt anybody, I said. I take it back.' },
// ch2.skyrift.goodbye
{ s: 'granny', e: 'happy', t: 'That\'s my {name}. I\'ll walk home, dear. Downhill. Through time.' },
{ s: 'granny', t: 'Hum you later.' },
{ s: 'narrator', t: 'Miss Quill went up there. So did my next piece. Tomorrow, then.' },
```

**A5. Low–medium. Two scenes only explain.** `:98, :203`.
- `:98` "Evening, traveller. Old Wick. I light the lamps. And I work this old bridge." is a name tag. → **"Evening. Old Wick. I light the lamps. Tonight they want the big stove lit too."** (threat, and it points at the Hall).
- `:203` "They tick. I've never ticked. I just… point." is sweet, but this is the Sundial's `met` beat for its Ch3 trial *for guessing*. Plant it: → **"They tick. All correct. I just point. And on cloudy days, I guess."** (echoes the game's second line; Ch3 pays it).

**A6. Low. Small readability and voice slips.**
- `:305` "Well I never." is an idiom that blocks. → **"Well! I'd have blamed the one who looked nervous."**
- `:118` / `:124` "Which of you three is one?" but Smudge never speaks in the Square. Add after `:118`: **`{ s: 'sweep', e: 'nervous', t: 'Not me! I\'m honest! I\'m honest!' }`** (it also sets up `:312` and `:316`).
- `:89` "Boil the keeper of the first rules." is abstract for a non-native reader. → **"Tonight's soup: one Granny Axiom! No Granny, no first rules. Engagement!"**
- `:608` "Even I forget which. Bread does that." reads as a non sequitur. → **"One switch hides behind a curtain. The Mayor wanted that. He paid in bread."**
- `:225` Raven says "Interesting" twice in the chapter (`:91`). → **"True words. Still not proof. Noted."**

### Strongest lines (don't touch)
"I heard that! I'm behind nothing! I'm in front of everything!" · "Your table says I'm not an imp. True. I'm worse. I'm a mayor who doesn't read." · "One or zero, child. You are a zero." · "Check it yourself, dear. Every row." · "Forty years I marked 'maybe' wrong. Red ink. Every child." · "The water is singing louder, dear. I'd like it to stop." · "Ninety years she said good morning to me. I never once said it first." · "You hum. Only your own hum comes back." · "Letter… carrot. Fine." · "Shh. Her scarf. There's wind. It doesn't move. …Lovely lamp behind her, though."

---

## Section B. Critic 3: The editor

### Score: **7.5 / 10. Not yet.** The Hall and the Quiet Scene are publishable now. The front door is plain, and the central character turn is missing one hinge.

| Criterion | Score | Note |
|---|---|---|
| Hook | 7 | The outline's hook ("Tonight the town of true-and-false holds a feast. The soup is Granny.") is not on screen. The first line describes scenery (E1). |
| Characters and arcs | 7.5 | The Mayor is the best-built comic character in the game. Quill is likeable, but only just on the required path, and her becoming the imp is never said (E2). |
| Antagonists | 7 | Quill escalates superbly within the chapter. Nudge is thin (A1). The Algorithm's three lines are well judged. |
| Plot hooks and set-ups | 8 | Cover → "See? She's on my side." → "SHE WAS. MY SIDE." and "ate itself" → the liar choice are clean. One clue is over-stated (E6). |
| Pacing and momentum | 8 | Good drive from the Stairs onward; the Mayor choice has a felt cost ("The water is singing"). The chapter end does not pull (E4). |
| Emotional throughline | 8 | The rope is the right gradient: jokes turn to fear by notch 6. The tier-4 lines are calm and devastating. The Quiet Scene has only one mourner (E3). |
| Skim test | 8 | See below; two weak openers. |

### Problems

**E1. Medium. The arrival hook is scenery; the poster everyone quotes is never shown.** `:85, :89–91, :144`.
- "Boolesbury. Eighteen fifty-something. Gas lamps, cobbles, and posters on every wall." tells us what the posters are, not what they say. Raven's inner (`:91`) quotes "By order of the Mayor", the avatar reads its "Small print", and Raven's suspicion option (`:144`) cites "by order". Four of five species never read that text, so the Mayor's link to the feast first appears at the Clock Tower.
- Fix (the reveal "the soup is Granny" then comes from Nudge two lines later):
```js
{ s: 'narrator', t: 'Boolesbury, eighteen fifty-something. Every wall says: FEAST OF LAWS. SOUP FOR ALL. BY ORDER OF THE MAYOR.' },
```

**E2. Medium. Quill's motive lands, but how she became the Arch-Imp does not; and her warmth on the required path is one rescue.** `:476–478, :181–183`.
- "Under it: a crowned imp. With her tired eyes." then forty years of red ink. A 16-year-old will read: she was always an imp in a teacher costume. That kills the motive. The outline's hinge ("She said yes to the feed, and her old face became her mask") is missing.
- "Red ink" is the key image of the confession and is never planted. Her school scene (`:315–321`), where she is warmest, is optional.
- Fix: a gift at the rescue that plants the image, and one line in the confession:
```js
// after :183
{ s: 'schoolteacher', t: 'Take my red pencil, child. Mark what\'s wrong. Never write "maybe".' },
// between the two confession lines (A2's order)
{ s: 'schoolteacher', e: 'unmasked', t: 'Then a voice offered me a world with no maybes. I said yes.' },
```

**E3. Medium–low. Granny's Quiet Scene has one mourner, and its opener copies Sequins'.** `:536–537`.
- Lesson 1 needed a second round to add people who miss Sequins (Syllo, Mirage); the same gap is here. "Back at the Fair, her lantern is dark." is also almost word for word lesson 1's opener, so the scene reads as a template.
- Fix (keeps the scene at 7 lines):
```js
{ s: 'narrator', t: 'At the Fair, Professor Sequins sets her card table every morning. Nobody sits.', when: '!dead:sequins' },
{ s: 'narrator', t: 'At the Fair, two lanterns are dark now. Syllo salutes them both.', when: 'dead:sequins' },
```

**E4. Medium–low. Quill's exit is not seen, and the chapter's end does not pull.** `:507, :527–530`.
- "Tomorrow is waiting. Everyone there has already decided about you." is a superb exit line and Ch3's premise in one sentence. But nothing shows her leave, so it reads as a threat from someone still standing there (Gumleaf's later "Through a window" is funny only if we saw it). Then the Sky Rift ends on a feeling about a shadow piece.
- Fix: one narrator line directly before `:507`, counted as part of "Quill's exit" in the six-line stack (pay for it by cutting Smudge's `:483`, as A2 suggests): **"She steps up onto the window. The Sky Rift glows behind her."** Then `:507`, then she is gone. End the chapter on her (A4's Sky Rift line).

**E5. Low–medium. In the Mayor scene nobody says what the feast does.** `:249–297`.
- The player turns back to "face the man who signed it" and never tells him he signed a boiling. His Hall line "…Is that allowed?" proves he does not know. Telling him is the scene's natural first punch, and makes "I'm a mayor who doesn't read" a confession, not a quip.
- Fix, before `:252`:
```js
{ s: 'avatar', t: 'Your feast is boiling Granny. You signed it.' },
{ s: 'mayor', e: 'nervous', t: 'Boiling? It said "soup"! …I stopped reading at "soup".' },
```

**E6. Low. The rumour is a fourth clue, and points straight at the Schoolhouse.** `:344–345` with `:226–227`.
- The hum says "Somebody tall… hums in ones and zeros". The rumour says a grey heron "haunts the Schoolhouse" and "writes only ones and zeros". The Frogling adds "Herons are tall." Tall + ones and zeros + Schoolhouse = the teacher. The outline allows at most three ambiguous clues.
- Fix `:345` → **"He's shy. He only comes out for winners."**

### Skim test (first line of each scene, in play order)
recap ✓ · arrive ✗ (scenery; E1) · bridge ✗ (name tag; A5) · lane ✓ · square ✓✓ · cover ✓ · post ✓ · clockmaker ✓ · tower ✓ · stairs ✓✓ · mayor ✓✓ · hall ✓ · winch ✓ · table ✓✓ · win ✓✓ · sky rift ✓ · quiet ✓✓.

### The peril (what already works)
- Seven warnings from "My feet are warm" to "I'd like it to stop": comedy drains out on schedule, and the carrot call-back gives the middle a laugh. Gradient tiers each have their own line and cost (card kept, card soggy, card boiled, Granny).
- Tier 4 is the chapter's best writing: "Granny looks at you. Not at the rope." The Mayor's "Oh." is the only voice, and the Algorithm's callousness is the villain's, not the game's.
- The Mayor choice is real: cost first (the hum), then a gradient outcome that changes stage 1, the drains and the starting notch.

### Continuity with lesson 1
Tone matches; Granny, the Constable-style literalism and the Algorithm's capitals carry over. The Quiet Scene's "Pockets, she'd say. There are prizes left." and "Only your own hum comes back." pay off lesson 1 (`:106`, `:240`) beautifully; A4 lists the three that are still unpaid.
