# Writing gate, script round 2: Critic 2 (author) and Critic 3 (editor). Lesson 1

Date: 8 October 2026. Rubric: `design/WRITING-CRITICS.md` (Critics 2 and 3). Binding: `design/TEACHER-STORY-NOTES.md`.
Files read in full: `data/script/lesson1.js` (commit a4e9ce5), `data/script/leads.js`, `design/AVATAR-VOICES.md`; lesson 1 nodes in `data/map.js`; the opening of `data/script/lesson2.js` (`ch2.arrive` crackle fallback); the lead lookup in `js/ui/dialogue.js:301`.
Previous report: `writing-script-l1-r1-author-editor.md` (7.5 / 7.5).
Scale: 10 = excellent published game writing, a story I'd fight to publish. 7 = competent but forgettable. Pass mark: 8.

Paths traced:
- **Owlet, board-power gender.** Home → boast → Pattern Stall + Gallery → theft → evening ("ask") → Signpost → Road → Bridge → Well → Campfire night ("Keep going") → Stone (moser) → Gate, comfort chosen, tier 1, Nudge caught → Rift Pass.
- **Raven, other gender.** Witness + Gallery → Card Sharp night ("Go back") → door (turnedBack, reveal at the door) → Gate tier 3, `nudgeFled` → Rift Pass.
- **Moth-kin.** Pattern + Witness → Gate armed tier 4, `dead:sequins` → Rift Pass crackle → Ch2 Quiet Scene.
- **Fox, Ch1 time-rift jump-in.** `recap.ch1` → Forest Road → walks back to Home, Fair Gate and Nut Stall (dispatchers).
- **Frogling.** Every `inner` and `only:` line checked.

The two sections are scored separately.

---

## Section A. Critic 2: Author and style

### Score: **8.0 / 10. Passed** (the fixes below are still recommended; none blocks).

| Criterion | R1 | R2 | Note |
|---|---|---|---|
| Not boring | 8 | 8.5 | The boast, Gate opening and Corvina now earn every line. Granny's Fair Gate bark repeats on every hub visit. |
| Arc | 8.5 | 8.5 | "I'll win that trophy" → "Wrong. I decide where I go." → "Obviously." → "I KNEW YOURS" → "It knew where you'd go before you did. How?" is a clean, closed loop. |
| Twists | 8 | 8 | Bait twist fair and well spaced; reveals true in both places. |
| Voice | 8 | 8.5 | Nudge has a voice now. Corvina has a personality ("Cards are good for worrying."). |
| Readable | 8.5 | 8 | A few new non-native traps: "will have gone out", "is gone through", "goes thirty-one", "Mind it", "Every click's ME". |
| Teacher's direction | 7 | 8 | No jokes at the Gate win after a death; no Nudge on the dead path; recurring Nudge. The crackle readings still play their jokes minutes after a death (A1). |
| Game fit | 7 | 7.5 | Gate win at six lines; Pattern Stall single instruction. Leads can still repeat; a jump-in reads ~17 lines before the first puzzle. |

### Round 1 status

| R1 | Status |
|---|---|
| A1 Gate win too long; jokes after a death | **Fixed.** Six spoken + one inner on every path; dead path is solemn and Nudge-free; Owlet "Ladder. Ladle. Lad." adopted; new question adopted. Residue: the readings moved to the Rift Pass still joke on the dead path (new A1). |
| A2 boast's "it", double match offer | **Fixed.** "I'll win that trophy." Syllo after the boast, Granny carries the match, QUOTE SAVED last. |
| A3 Nudge not recurring | **Mostly fixed.** Road line and flee gloat added. Clarity of the Road line (A4). |
| A4 Pattern Stall double instruction | **Fixed.** "Nobody claps for it. I do." is the best new line in the lesson. |
| A5 Venn lead repeats; Frogling line wrong at the Gallery | **Half fixed.** `venn:gallery` written, Frogling line fresh. Repeats are still possible on other routes (A2). |
| A6 line slips | **Fixed** (Well sparkle line, Syllo door, Fox reveal, cushion line). Raven Well line reworded but now breaks for some players (A5). |
| A7 Corvina | **Fixed**, both lines adopted. |
| A8 readability | **Fixed** ("I'm losing sequins!"). New traps listed in A5. |

### Remaining problems

**A1. Medium. The crackle readings joke between a death and the Quiet Scene.** `lesson1.js:532–538`.
- On `dead:sequins` the player goes from "The gate is open. The cushion is still warm." straight to the Rift Pass and hears Fox "A ladder! For a daring climb!" or Frogling "…Long story." The Quiet Scene only comes after, in Ch2. The story's own voice is chirpy in the gap the teacher wants solemn.
- Fix: make the two jokey readings calm for everyone (they still mishear, so the clue survives):
```js
fox: 'A ladder. Up into the crack. To her.',
frogling: 'She said "ladle" once. About soup. I remember the soup.',
```

**A2. Medium. A lead can still play twice in lesson 1.** `leads.js:13–19, 34–40`; Road (`map.js` road-start: liars-gate or **venn d1**), Pattern Stall (**rule-hunter d1**), Well (**venn d2** or **rule-hunter d2**).
- Road-venn then Well-venn plays `L['venn']` twice word for word; Pattern Stall then Well-rule-hunter plays `L['rule-hunter']` twice. Frogling's "Last time I judged by what was true" also has no "last time" for a player who skipped the Gallery.
- Fix: let `leadFor` try `<id>:<node>` before `<id>` (`js/ui/dialogue.js:302`) and add two Well banks, e.g.
```js
L['rule-hunter:well'] = { inner: {
    owlet: 'Ten fits prove nothing. One miss proves plenty. Hunt the miss.',
    mothkin: 'Look at the ones it says no to. They know the secret.',
    fox: 'Picture the weirdest numbers. Feed it those.',
    frogling: 'He tested what fits. Every time. I watched. Test what breaks.',
    raven: '"Probably." The well wants better than that.',
} };
L['venn:well'] = { inner: { /* five fresh lines; "Does it follow?" stays in Frogling's */ } };
```

**A3. Medium. A Ch1 jump-in reads about 17 lines before the first puzzle.** `lesson1.js:229–241` + `:265–272` + intro `:599–602`.
- recap (9–10) → arrival (1) → gossip (2 + Moth inner) → Owlet/Fox blind spot → two caricatures → Nudge → Sundial intro → lead.
- Fix:
  - Merge recap `:230–233` into two lines: **"Previously. The Fair. You said you're always right. Something in the sky heard."** / **"The Algorithm. It stole my shadow and the visitors' minds."**
  - In `ch1.road`, move `{ play: 'ch1.gossip', once: true }` to the top of `ch1.road.win`. A jump-in still hears clue 2 (before the Well), and a walker has already had it at the Signpost.

**A4. Low–medium. Nudge's Road line is opaque, and he never gets in your way.** `:271`.
- "Every click's ME!" doesn't parse for most non-native readers; the motive is lost.
- → **nudge: "Louder! Every shout is a click! Every click makes me BIGGER!"**
- Add as the first line of `ch1.road.win`: **nudge: "Boo! You made them calm! Calm gets zero views!"** One line, and now he loses something on screen and mocks you (teacher's note 5).

**A5. Low. Line slips.**
- `:297` Raven: "Always the same first word." A player who skipped the Pattern Stall has heard the Guess-o-Matic once. → **'"Probably." Clever word. Hard to be wrong with it.'**
- `:301` "Mind it, if anything happens." "Mind" reads as "be careful of" to many learners, and "if anything happens" flags the cage. → **"It's honest, you see. It always says 'probably'. Look after it for me."**
- `:462` "your circle sequence goes thirty-one." → **"Professor! Your circle sequence breaks. Thirty-one, not thirty-two."**
- `:485` "Nudge is gone through" → **"Nudge has gone through the Rift Pass. With my piece."**
- `:546` "The door's open now." Which door? Granny's? Cut it (see E1 for the line).
- `:556` "will have gone out" (future perfect). See E2.

**A6. Low. Granny's Fair Gate bark plays on every hub visit.** `:134`, `:136`.
- The Fair Gate script now runs every visit, and the Prologue crosses the hub three or four times. The same line every time turns Granny into a shop sign.
- Fix: `once: true` on the first bark, then a second bark for later visits (e.g. **"Still here, dear? The nuts are getting nervous."**), then silence.

### Strongest new lines (don't touch)
"Always? How thrilling. How unlikely." · "Wrong. I decide where I go." · "Nobody claps for it. I do." · "Yours is the wonky one." · "Cards are good for worrying." · "Nine o'clock. Roughly." · "Why does my cage have a cushion?" · "The gate is open. The cushion is still warm." · "He did the shouting. I did the counting."

---

## Section B. Critic 3: The editor

### Score: **8.0 / 10. Passed** (fix E1 and E2 before recording; they cost four lines).

| Criterion | R1 | R2 | Note |
|---|---|---|---|
| Hook | 8 | 8.5 | "NOISE DETECTED" → "Nine o'clock. Roughly." The contrast is the theme in two beats. |
| Characters and arcs | 7 | 8 | Sequins is lonely on the required path now; the hero answers the eye and walks into it anyway. |
| Antagonists | 7.5 | 8 | The Algorithm's ladder is excellent and present at every act break. Nudge is back but still only one-liners. |
| Plot hooks and set-ups | 7 | 8 | Lanterns planted; boast fixed; crackle relocated with a Ch2 fallback. The lantern is never *seen* out. |
| Pacing and momentum | 7.5 | 8 | Signpost and Gate open on story. Ch1's last line is the Sundial talking about itself (E1). |
| Emotional throughline | 8 | 8 | Tiers land; the dead path is clean. The Quiet Scene still has nobody who misses him (E2). |
| Skim test | 8 | 8.5 | Every scene's first line now pulls. |

### Round 1 status

| R1 | Status |
|---|---|
| E1 Sequins never vulnerable on the required path | **Fixed.** "Nobody holds things for me. I polish my own trophy. Twice." recasts the brag. Optional payoff in E2. |
| E2 lanterns never set up | **Fixed** at the set-up end ("One for each of us." / "Yours is the wonky one."). The payoff end is weak (E2). |
| E3 waking line | **Fixed.** |
| E4 Ch1 opens on a rumour | **Fixed.** Arrival and gossip first. |
| E5 Ch1 ends on navigation; obvious question | **Mostly fixed.** Question adopted; the Rift Pass now has Granny's voice. The very last line steps on it (E1). |
| E6 hero silent at the theft | **Fixed.** |
| E7 Gate opens on exposition | **Fixed.** Sequins first; "the rock's shadow" is a good Nudge joke. |
| E8 twist clues piling up (watch) | **Improved.** The Guess-o-Matic is lowercase now. "Mind it, if anything happens" adds a new nudge (A5 rewrite removes it). Keep lesson 1 at this count. |

### Remaining problems

**E1. Medium. Ch1's last line belongs to Granny, not the Sundial's shadow.** `lesson1.js:545–546`.
- After the strongest hook in the lesson (Granny's voice from a sack, "eighteen fifty"), the chapter ends on "So is a piece of me." and, on `nudgeFled`, a second line about the same piece ("It ran through with my piece. The door's open now…"). The Sundial makes the climax about itself, twice.
- Fix: piece first, Granny last.
```js
{ play: 'ch1.crackle', once: true },
{ s: 'narrator', t: 'Nudge ran through here with my piece. I feel… cloudier.', when: 'nudgeFled' },
{ s: 'narrator', t: 'Eighteen fifty. That\'s through there. So is Granny.' },
```

**E2. Medium. The Quiet Scene has no one who misses him, and the lantern is told, never seen.** `:554–567`, `:127–138`.
- Teacher's note 4 lists "the people who miss them". Only the Sundial grieves. "Back at the Fair, his lantern will have gone out." is a guess in the future perfect, the hardest tense in the script.
- Fix, three lines:
  - `:556` → **"Back at the Fair, his lantern is dark now."**
  - after `:560` → **"At the Fair, Syllo will salute an empty stall. Mirage won't look in her ball."**
  - In `prologue.fair.again` (any post-death visit, before the door/bark branch): **{ s: 'narrator', t: 'The lanterns. One is dark. It was the shiniest.', when: 'dead:sequins' }**. The player who goes back sees it with their own eyes; the wake's "one for each of us" pays off.
- Optional, pays off the Well line: `:558` → **"In your pocket, his apprentice says nothing. You held it for him. Nobody else did."**

**E3. Medium–low. Nudge escalates in volume, not in threat.** `:190, :271, :428, :501–505`.
- Four appearances, all one-liners shouted into the air. He never addresses the hero, never costs them anything before the Gate. A3/A4 of the author section fixes most of this cheaply (the Road-win heckle). It is enough for lesson 1 if the later chapters give him a scene where he actually gets in the way.

**E4. Low. The Home look-back is inert.** `:95`.
- "Your home. I used to stand right here, outside your door. Before the crack." It recaps, but no joke, no hook.
- → **"Your home. I stood here every morning for forty years. Now I stand in your shadow."** (It earns the line with a feeling.)

### Skim test (first line of each scene, in play order)
cold ✓ · wake ✓ · fair ✓ · pattern ✓ · witness ✓ · gallery ✓ · rift ✓ · evening ✓✓ · signpost ✓ · road ✓ · bridge ✓ · well ✓ · night ✓✓ · door ✓✓ · gate ✓ · gate win ✓ (dead ✓✓) · pass ✓✓ (crackle) · quiet ✓.
Read only these and the story is clear and compelling. The lesson now ends, on every path, with a voice from a sack.

### The Quiet Scene
- Restrained, no gags, in the right order. The `replay` of "Oh. It's… shiny in there." and "Somebody should count it." (which Tally's "I did the counting" answers) are right.
- With E2 it becomes moving rather than correct.
