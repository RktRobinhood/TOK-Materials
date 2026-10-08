# Writing gate, script round 1: Critic 2 (author) and Critic 3 (editor). Lesson 1

Date: 8 October 2026. Rubric: `design/WRITING-CRITICS.md` (Critics 2 and 3). Binding: `design/TEACHER-STORY-NOTES.md`. Approved outline: `design/STORY.md` §1–3 and Appendices B, D, E (passed at 8 / 8.5 / 8.5).
Files read in full: `data/script/lesson1.js`, `data/script/leads.js`, `design/AVATAR-VOICES.md`. Play order from `data/map.js` (lesson 1 nodes) and the engine order in `js/screens/encounter.js:540–546`: on a first visit the node's `script` plays, then its `intro` (with the lead), then the puzzle.
Scale: 10 = excellent published game writing, a story I'd fight to publish. 7 = competent but forgettable. Pass mark: 8.

Paths traced:
- **Owlet, board-power gender.** Gallery and Pattern Stall. No turn-back. Gate tier 1, Nudge caught.
- **Raven, other gender.** Witness and Gallery. Turns back at the Card Sharp's first night. Gate tier 3, `nudgeFled`.
- **Moth-kin.** Pattern and Witness. Gate tier 4, armed. Ch2 opens with the Quiet Scene.
- **Frogling and Fox.** Checked line by line at every `inner` and `only:` step.

The two sections are scored separately.

---

## Section A. Critic 2: Author and style

### Score: **7.5 / 10. Not passed.**

| Criterion | Score | Note |
|---|---|---|
| Not boring | 8 | The Sundial and Granny are the best voices in the game. Most of the flat lines are navigation from Granny or the Rift Pass. |
| Arc | 8.5 | The flaw runs on "Obviously." ("Back before the trophy final." → "She's asleep.") and is paid off by "I KNEW YOURS". The tiers have teeth. |
| Twists | 8 | The bait twist is fair and well spaced. |
| Voice | 8 | The five inner voices are distinct. Nudge and Corvina are thin, and two inner lines don't work for a single-species player (A1, A6). |
| Readable | 8.5 | Nearly every line is under 15 words. Watch "lad / ladle", "shed", "Roll up!" and "Fancy a game". |
| Teacher's direction | 7 | Nudge isn't met between the theft and the cage. Inner-voice jokes play straight after a death. |
| Game fit | 7 | Two of the stalls give the instruction twice. A Venn lead repeats and its wording only fits one of the two places it plays. The boss intro and the boss win both run long. |

### Problems, by severity

**A1. High. The Gate win is too long, and on the death path it jokes.** `lesson1.js:430–479`.
- On the usual path the win plays **7 spoken lines and 2 inner lines**. Appendix B allows at most 6.
- On `dead:sequins` the order is:
  1. the solemn cushion line;
  2. the Algorithm being callous (fine: the villain may be);
  3. Owlet's "…I'd like my feathers back." (`:44`);
  4. Fox's "A ladder! For a daring climb!" or Frogling's "Long story." (`:471–472`).

  The story's own voice is cracking jokes within five lines of a death.
- Owlet's reading "Three words fit." (`:469`) doesn't make sense to an Owlet player. Only Raven ever lists the three words, and each player hears only their own species.
- The Sundial's question "Who laid it?" (`:478`) comes right after the Algorithm has said "PREDICTED… I KNEW YOURS". The answer was given two lines earlier, so the question has nothing left to ask.
- **Fix (also my answer to the writer's open question):**
  - Move the crackle (`:455`) and the five "bring a lad—" readings (`:468–474`) to the **Rift Pass**, on the first visit after the Gate win, before "Granny is through there" (see sample rewrite 3). The sack physically passes through that rift (Appendix A.4), so the crackle belongs there. It also gives Ch1 an ending that pulls into Ch2 (editor E5).
  - Guard: if a class jumps straight into Ch2, `ch2.arrive` (or `recap.ch2`) must play the crackle when `ch1.pass` hasn't been seen. Otherwise side story 4 loses its set-up.
  - The Gate win is then 6–7 spoken lines and 1 inner line.
  - On `dead:sequins`, give Owlet a reveal with no tag: "Valid. Every step. The first step was the Algorithm's."
  - Owlet reading: **"Ladder. Ladle. Lad. All fit. More data, please."**
  - Question: **"It knew where you'd go before you did. How?"** This points at the theme (51% predictable, saying "always" under the crack), not at the culprit.

**A2. High. The boast's "it" points at the wrong thing, and two people offer the same match.** `lesson1.js:93–98`.
- Syllo's line (`:93`, "And a practice match here first…") sits directly before "I'll win it. I always know the answer." (`:94`). Read in order, the hero is boasting about the *practice match*, which drains the game's most important line.
- Then Granny offers the same match again: "But first, cards. My treat." (`:98`).
- **Fix:** see sample rewrite 1.
  - Syllo's line goes after the boast, or is cut. He has his own stall.
  - The boast names the trophy: **"I'll win that trophy. I always know the answer."**
  - Granny's last line carries the match.
  - QUOTE SAVED becomes the scene's last line (A-note below).

**A3. Medium–high. Nudge isn't a recurring irritant yet** (teacher's direction 5). `lesson1.js:153, 380, 450–452`.
- He has three lines in the whole lesson: the theft, the Gate intro and the Gate win. There's nothing on the Road.
- On `nudgeFled` (`:450`), the one time he *wins*, he gets no line. The narrator tells it instead.
- **Fixes:**
  - Forest Road, after the two caricatures (`:226`): **nudge: "Louder! Every shout's a click! Every click's ME!"** This is funny, it shows why the possessed shout, and it hints at his motive ("It counted me").
  - `nudgeFled`: give him the callback **nudge: "Got it, boss! Saved to favourites!"** before the narrator line. Then shorten the narrator line to "He's gone through the Rift Pass. With my piece."

**A4. Medium. The Pattern Stall gives the instruction twice and runs to 5 lines.** `lesson1.js:124–126` + `:514–516`.
- "Now YOU find my secret rule." is followed straight away by "Feed my rule three numbers. Try to break it." and then the lead. Appendix B caps a first visit at 3–4 lines.
- **Fix:** let `:126` carry character instead of instruction: **"It always says 'probably'. Adorable. Nobody claps for it. I do."** That is Sequins being kind, and a fair Ch4 plant (see E8 for the clue count). The intro line keeps the goal.

**A5. Medium. The Venn lead plays twice in lesson 1, and one line is wrong at the Gallery.** `leads.js:34–40`; plays at the Gallery (`lesson1.js:530–532`) and the Well (`:551–553`).
- Every player who picks the Gallery hears the same Venn lead again at the Well, word for word.
- Frogling's "Lobsters don't play trumpets. Didn't matter then." only makes sense *after* the Gallery. At the Gallery the lobsters are right there.
- **Fix:** add a second Venn bank keyed by difficulty or station (e.g. `venn:2`, used by the Well). Write Frogling's Gallery line fresh: "Ponds can't play trumpets either. Doesn't matter. Does it follow?" Move the current line to `venn:2`.

**A6. Medium. Line slips.**
- `:252` Raven: "One word. A very small vocabulary." The toy has just said three words. → **"'Probably.' Clever word. Hard to be wrong with it."** This keeps the word-weighing habit and plants the Ch4 theme.
- `:387` "Half my sparkle is up that crack." plays at stage 2 whatever the clock says, even at Danger 0. → **"My sparkle's going up that crack. Say something nice. Quickly."**
- `:290–291` The narrator says "Her tea is still warm", then Syllo says "Her tea's still warm" again. → Syllo: **"No sign of a fight, recruit. She'd have won one."**
- `:46` via `:297` Fox's reveal plays at the open door ("Nobody was even at the end") before a turned-back player has reached the end of the Road. Give it a door variant: "Nobody's at the end of the Road. Everybody's here. That was the trick." Or flag it to logic.
- `:433` "We finished it. For him." edges towards the heroic framing the teacher ruled out. → **"The gate is open. The cushion is still warm."**

**A7. Low–medium. The Card Sharp's Table after the first night.** `lesson1.js:316–323`.
- If the night beat ends with "Go back to the Fair. Now.", Corvina's next line is "Fancy a game, little traveller?"
- "Change the axioms and the same cards play a different game. Funny, eh?" is the only line in lesson 1 that reads like a thesis statement.
- → **corvina: "Fancy a game, little traveller? Cards are good for worrying."** This works after either choice. → **corvina: "My table, my axioms. Change one, and your cards forget how to win."**

**A8. Low. Readability for non-native readers.**
- "bring a lad—" depends on knowing *lad* and *ladle*. Raven's reading lists all three, but only Raven players hear it. With the A1 Owlet fix, two species name the words.
- "I'm shedding!" (`:565, :568`, `:379` "I shed a little"): keep it, because the art shows it. But the first one could say "I'm losing sequins!"
- "Roll up!" and "Fancy a game" are British fairground and pub idioms. The context carries them, so this is optional.

**A-note. The writer's open questions.**
- **Gate win length:** trim, and move the crackle and readings to the Rift Pass, with the Ch2 fallback (A1).
- **`QUOTE SAVED.`:** keep it, as the **last line** of the boast scene, after Granny's.
  - Two words as a sting. It turns "I KNEW YOURS" into a payoff, not a riddle, for the many readers who won't take "Something up there hears you" from the staging alone.
  - It also starts the Algorithm's quoting habit, which climbs each chapter.
  - At the end of the scene nobody has to ignore a voice from the sky, and it stops sitting right on top of Speedcheeta's "Clip it!", which is a different joke (and the Ch3 clip set-up).

### Strongest lines (don't touch)
"There is a hair on the sky. I will dust it later." · "Both times to myself." · "It's… six. Possibly seven. I'm guessing." · "I always stop at sunset. Is night always this big?" · "A pot never hurt anybody." · "Always. Yes. You said. Hurry anyway." · "Stuck can be fixed. Trending is forever." · "Valid! And still nonsense!" · "Oh. It's… shiny in there." · "PROBABLY… KEEP GOING." · "It's warm. And it ticks. Like a tiny heart."

---

## Section B. Critic 3: The editor

### Score: **7.5 / 10. Not passed.**

| Criterion | Score | Note |
|---|---|---|
| Hook | 8 | The cold open is good. The waking line wastes it. |
| Characters and arcs | 7 | The hero's flaw is clear. Granny and the Sundial are loved. Sequins is a delight but not yet *loved* on the required path. |
| Antagonists | 7.5 | The Algorithm's ladder is excellent. Nudge vanishes for the middle of the chapter. |
| Plot hooks and set-ups | 7 | The lanterns are never set up before a lantern carries a death. The boast's antecedent is wrong. |
| Pacing and momentum | 7.5 | Ch1 starts on a collectible rumour and ends on a navigation line. |
| Emotional throughline | 8 | The night choice and the cage tiers land. The Quiet Scene is restrained and right. |
| Skim test | 8 | Nearly every first line pulls you on. The Signpost and the Gate don't. |

### Problems, by severity

**E1. High. Sequins is charming, but on the required path he is never vulnerable before the cage.** Required meetings: `prologue.fair`, `prologue.rift`, `ch1.well`.
- Every required Sequins line is the showman: "Make way!", "Personally! Twice!", "WAIT FOR ME!", "A prime one. Mostly."
- The outline's "vain, kind, a little lonely" has lost its last word.
- His best moments of heart are on the optional Pattern Stall (`:130`), so many players never see them.
- The cage then puts a funny man in danger rather than a man we love.
- **Fix:** one line at the Well, after the avatar's reaction (`:248–252`), that turns his earlier brag into loneliness:
  - **sequins: "Thank you. Nobody holds things for me. I polish my own trophy. Twice."**
  - This recasts "By me! Personally! Twice!" as a man with no one to help him. It costs no clue budget and gives the Quiet Scene something to grieve.
  - Optional companion at the Well win: "It's honest, you see. It always says 'probably'. Mind it. It's all I've got." (`:255`)

**E2. High. The lanterns carry a death but are never set up.** `lesson1.js:202` ("His lantern is out."), `:496` ("At the Fair, his lantern has gone out. Everyone saw it.").
- Appendix A.13 (one lantern per loved person) is never said in lesson 1.
- So the first line of the Quiet Scene, the moment that most needs to land, rests on a rule the player has never met.
- The only lanterns the player *has* met are the imps' "little lanterns" (`:208`).
- **Fix:** plant it in the morning, in Granny's navigation line (`:83`), which also makes that line earn its place:
  - **granny: "Off to the Fair, dear. Look, they've lit the lanterns. One for each of us."**
  - **granny: "Yours is the wonky one."** This is cute now and quietly awful later.
- Check whether the imps' "little lanterns" now read as *stolen Fair lanterns*. If so, make the clue the imps' "little lamps", or keep the clash on purpose and pay it off.

**E3. Medium–high. The first scene after the cold open wastes its own hook.** `lesson1.js:68–77`.
- "Tick. Tock. Ah, you're awake. Good morning" is the most common opening line in games.
- The cold open has just said **"THE FAIR, 9:02."**, with machine precision. The Sundial's first words can answer it with the theme in a single beat:
  - **narrator: "Nine o'clock. Roughly. Good morning, {name}."**
  - The Algorithm is exact and certain. The Sundial is rough and honest. A reader feels the contrast before anyone explains it.
- Optional, as a stronger cold open: add a third Algorithm line before the title screen, **"PREDICTION: SUBJECT PRESSES START."** The player then has to press Start, so it's right. A 16-year-old will remember that, and the 94% at the theft becomes a pattern rather than a one-off.
  - Readout numbers stay on screen per Appendix B. This line has none.

**E4. Medium. Ch1 opens on a Pokédex rumour, not the story.** `lesson1.js:212–217`.
- Players walk from the Nut Stall to the Signpost, so Ch1's first line is "Psst. An owl folded in paper haunts the Standing Stone."
- The twist's clue 2 (the empty sack) comes fourth, after two collectible hints. The Sundial's arrival line ("The Road… Like a trail of crumbs.") only plays one node later.
- **Fix:** in `ch1.signpost`, play the gossip **first** (`{ play: 'ch1.gossip', once: true }`), then the two rumours. Give the Signpost the Sundial's crumbs line as a one-line chapter arrival when the player comes from the Fair. Keep it at the Forest Road for jump-ins only.

**E5. Medium. Ch1 ends on navigation. The Sundial's question has an obvious answer.** `lesson1.js:478`, `:483–489`.
- After "PREDICTED… I KNEW YOURS", "Who laid it?" answers itself.
- The chapter's final node, the Rift Pass, is two lines of description.
- **Fix** (see sample rewrite 3):
  - Gate question: **"It knew where you'd go before you did. How?"**
  - The Rift Pass gets Granny's crackle and the voices' readings. Ch1 ends on her voice, a mystery word and a date: "eighteen fifty". That's a hook into the next lesson. It also does the author's trim (A1).

**E6. Medium. The protagonist says nothing at the inciting incident.** `lesson1.js:150–160`.
- Ten lines of theft. The hero, who boasted twelve lines earlier, never reacts. Even the eye's line "{name} FOLLOWS THE CRACK" lands on silence.
- **Fix:** add after `:159`: **avatar: "Wrong. I decide where I go."**
- Then that evening the hero chooses to go exactly where predicted. At the Gate, "I KNEW YOURS" closes a loop the player opened themselves. That is the arc in miniature, in 6 words.

**E7. Medium–low. The Gate scene opens on exposition and runs about 8 lines before play.** `lesson1.js:377–383` + `:565`.
- "drinking his sparkle" comes before we've seen whose.
- Lead with the person in danger:
  1. **sequins:** "{name}! Down here! In a birdcage! Why does my cage have a cushion?"
  2. **narrator:** "The crack ends here. It's drinking his sparkle."
- Fold "That imp holds a piece of my shadow" into Nudge's line: **nudge: "Engagement! Wave, bird! And look: my shadow piece!"**, or drop it. The win shows the piece anyway.

**E8. Low (watch item). The Ch4 twist's clues are piling up in Ch1.**
- The Guess-o-Matic speaks in the Algorithm's capitals.
- "PROFESSOR. YOU TAUGHT ME MY FIRST NUMBER" (`:381`) comes one scene after you were handed a toy that guesses the next number.
- "It ticks. Like a tiny heart." "PROBABLY… KEEP GOING."
- That is already about four nudges toward "the Algorithm is the toy", against the outline's cap of three ambiguous clues.
- Don't add more in lesson 1. If A4's "Nobody claps for it" is adopted, it is the motive and not the identity, so it's fine. But then consider giving the Guess-o-Matic small caps or a distinct type style, so the capitals alone don't give it away.

### Skim test (first line of each scene, in play order)
cold ✓ · wake ✗ (E3) · fair ✓ · pattern ✓ · witness ✓ · gallery ✓ · rift ✓ (interrupted line, good) · evening ✓✓ · signpost ✗ (E4) · road ✓ · bridge ✓ · well ✓ · night ✓✓ · door ✓✓ · gate ~ (E7) · gate win ✓ · pass ✗ (E5) · quiet ✓.
Read only these lines and the story is clear, and mostly compelling. Fixing the three ✗ lines lifts it to an 8.

### The Quiet Scene (`:494–507`)
- It honours the template: things, last words, who misses him, the pain choice, moving on. There are no gags, and the Guess-o-Matic "says nothing" is the best image in it.
- It rests on E1 (did we love him?) and E2 (do we know what a lantern means?). Fix those two and it will be moving rather than merely correct.
- "He'd want it shown off." is the right amount of warmth. Don't add more.

---

## Sample rewrites

**1. The boast** (`prologue.fair`, first visit, replacing `:90–98`):
```js
{ s: 'granny', e: 'happy', t: '{name}! Sit. Ninety years of cards. I have lost twice. Both times to myself.' },
{ s: 'sequins', e: 'happy', t: 'Make way! The Thinking Trophy! For the thinker who is always right!' },
{ s: 'sequins', t: 'It\'s at my stall, being polished. By me! Personally! Twice!' },
{ s: 'avatar', e: 'happy', t: 'I\'ll win that trophy. I always know the answer.' },
{ s: 'sequins', e: 'surprised', t: 'Always? How thrilling. How unlikely.' },
{ s: 'speedcheeta', t: 'Chat! This kid said ALWAYS! Clip it! Clip it!' },
{ s: 'syllo', t: 'Practice match first, recruit! Loaned team. No risk. Some shouting.' },
{ s: 'granny', t: 'Two stalls, then the final at the Nut Stall. Cards first, dear.' },
{ s: 'algorithm', t: 'QUOTE SAVED.' },
```

**2. The Well** (`ch1.well` and its win; the new line comes after the species reactions):
```js
{ s: 'avatar', t: '"Probably." Clever word. Hard to be wrong with it.', only: 'raven' },
{ s: 'sequins', t: 'Thank you. Nobody holds things for me. I polish my own trophy. Twice.' },
// win
{ s: 'sequins', t: 'It\'s honest, you see. It always says "probably". Mind it, if anything happens.' },
```

**3. The Gate win, trimmed, and the Rift Pass as Ch1's last hook:**
```js
S['ch1.gate.win'] = [
    { clock: 'ch1', resolve: true },
    // tier lines as now; dead: 'The gate is open. The cushion is still warm.'
    { when: { clock: 'ch1', gte: 3 }, then: [
        { flag: 'nudgeFled' },
        { s: 'nudge', t: 'Got it, boss! Saved to favourites!' },
        { s: 'narrator', t: 'Gone through the Rift Pass. With my piece. Above us, the eye shrinks.' },
    ], else: [
        { s: 'nudge', t: 'My ring light! That was my whole FACE!' },
        { s: 'narrator', t: 'You caught my piece as it ran. Above us, the eye shrinks a little.' },
    ] },
    // the Algorithm's two lines as now
    { when: '!turnedBack', then: [REVEAL] },   // Owlet without "feathers" when dead:sequins
    { s: 'narrator', t: 'It knew where you\'d go before you did. How?', when: '!turnedBack' },
    { s: 'narrator', t: 'You turned back. It was still too late. Was turning back wrong?', when: 'turnedBack' },
];
S['ch1.pass'] = [
    { when: { seen: 'ch1.gate.win' }, then: [
        { play: 'ch1.crackle', once: true },   // the hum + the five readings (owlet: 'Ladder. Ladle. Lad. All fit. More data, please.')
        { s: 'narrator', t: 'Eighteen fifty. That\'s through there. So is a piece of me.' },
        { s: 'narrator', t: 'It ran through with my piece. I feel… cloudier.', when: 'nudgeFled' },
    ], else: [ /* as now */ ] },
];
// ch1.crackle = the old :455 hum + the :468–474 readings. ch2.arrive / recap.ch2: { play: 'ch1.crackle', once: true } too,
// so a class that jumps straight into Ch2 still hears it.
```

**4. The first morning** (`prologue.wake`):
```js
{ s: 'narrator', t: 'Nine o\'clock. Roughly. Good morning, {name}.' },
{ s: 'narrator', t: 'I\'m the Sundial. I tell the time. Mostly. On cloudy days I guess.' },
// …
{ s: 'granny', t: 'Off to the Fair, dear. Look, they\'ve lit the lanterns. One for each of us.' },
{ s: 'granny', t: 'Yours is the wonky one.' },
```

**5. Nudge on the Road** (`ch1.road`, after the two caricatures):
```js
{ s: 'nudge', t: 'Louder! Every shout\'s a click! Every click\'s ME!' },
```
