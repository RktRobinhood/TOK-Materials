# Writing gate, script round 3: Critic 2 (author) and Critic 3 (editor). Lesson 1

Date: 8 October 2026. Rubric: `design/WRITING-CRITICS.md` (Critics 2 and 3). Binding: `design/TEACHER-STORY-NOTES.md`.
Files read in full: `data/script/lesson1.js` and `data/script/leads.js` (commit 5859ec8); lesson 1 nodes in `data/map.js`; `leadFor` in `js/ui/dialogue.js:302–312`; the round 3 diff.
Previous report: `writing-script-l1-r2-author-editor.md` (8.0 / 8.0).
Scale: 10 = excellent published game writing, a story I'd fight to publish. 7 = competent but forgettable. Pass mark: 8.

Paths traced:
- **Owlet, board-power gender.** Home → boast → Gallery (venn:gallery) + Pattern Stall (rule-hunter) → theft → evening ("ask") → Signpost → Road (venn) → Bridge → Well (rule-hunter:well) → Campfire ("Keep going") → Stone (moser) → Gate, comfort + moser, tier 1, Nudge caught → Rift Pass.
- **Raven, other gender.** Witness + Gallery → Road (liars-gate) → Well (venn:well) → Card Sharp night ("Go back") → door (turnedBack, reveal at the door) → Gate tier 3, `nudgeFled` → Rift Pass.
- **Moth-kin.** Pattern + Witness → Well → Gate armed tier 4, `dead:sequins` → walks back to the Fair (`ch1.lantern`, then the door) → Rift Pass crackle → Ch2 Quiet Scene.
- **Fox, Ch1 time-rift jump-in.** `recap.ch1` → Forest Road (blind spot, Nudge, gossip at the win) → walks back to Home, Fair Gate, Nut Stall.
- **Frogling.** Every `inner` and `only:` line, and all four Venn/rule-hunter leads in order.

The two sections are scored separately.

---

## Section A. Critic 2: Author and style

### Score: **8.5 / 10. Passed.** No regressions that block. Four small items below.

| Criterion | R2 | R3 | Note |
|---|---|---|---|
| Not boring | 8.5 | 8.5 | Granny's barks now play once each; "The nuts are getting nervous." earns its slot. |
| Arc | 8.5 | 8.5 | Unchanged and still closed: boast → "I KNEW YOURS" → "So is Granny." |
| Twists | 8 | 8.5 | The chapter's last line is now a turn, not a status report. |
| Voice | 8.5 | 8.5 | Nudge finally has a motive in plain words ("Every click makes me BIGGER!") and talks *to* the hero at the push. Syllo's grief is in character. |
| Readable | 8 | 8 | Old traps gone. Three new small slips (A1). |
| Teacher's direction | 8 | 8.5 | Crackle readings calm; people who miss him; Nudge heckles and loses on screen. One grief-then-quip adjacency is new (A2). |
| Game fit | 7.5 | 8.5 | Leads never repeat in lesson 1; a Ch1 jump-in now reads ~11 lines before the first puzzle (was ~17). |

### Round 2 status

| R2 | Status |
|---|---|
| A1 crackle readings joke after a death | **Fixed.** Fox "A ladder. Up into the crack. To her." and Frogling "I remember the soup." are calm, still mishear, and are better lines than the jokes were. Frogling's is quietly sad on the dead path and simply warm on the others: right for both. |
| A2 a lead can play twice | **Fixed.** Traced Road-venn → Gallery → Well-venn and Pattern → Well-rule-hunter: four different banks. "Ten fits prove nothing. One miss proves plenty." is the best lead in the file. Small echo in Fox (A4). |
| A3 jump-in too long | **Fixed.** Recap is 5 lines for a Ch1 jump-in; the gossip sits at the Road win; the Hum Charm line closes a logic gap without adding drag. |
| A4 Nudge opaque, never in your way | **Fixed.** All three new lines work: the Road line states his motive; "Calm gets zero views!" is the funniest Nudge line yet and makes him lose something; "Say 'always' for the camera!" turns the boast into a weapon at the worst moment. Callous villain, not a callous game. |
| A5 line slips | **Fixed**, all six. "Look after it for me." now pays off in the Quiet Scene. |
| A6 Granny's bark repeats | **Fixed.** Three barks, once each, then silence. |

### Remaining problems

**A1. Low. Three new readability slips.**
- `lesson1.js:95` "I stood here every morning since before Granny was born." Simple past with "since" is a grammar error, and this script is a model text for non-native readers. → **"Your home. I've stood here every morning since before Granny was born. Now I ride in your shadow."**
- `:566` "Eighteen fifty. That's through there." "That's through there" is vague (what is "that"?). → **"Eighteen fifty is through there. So is Granny."** (The rhythm of the last two words survives.)
- `:585–586` "…his lantern is dark now." / "…It's yours now." Two "now"s in two lines. → `:585` **"Back at the Fair, one lantern is dark. His."**

**A2. Low–medium. Syllo jokes two lines after his salute.** `:152–156` then `:355`.
- The new `ch1.lantern` plays first on a post-death Fair visit; if the door has not been seen, `ch1.door` follows at once and Syllo says "No sign of a fight, recruit. She'd have won one." The same man who "didn't know what else to do" a beat ago now quips. The game's own voice wobbles exactly where the teacher wants it steady.
- Fix: a grave variant for that path, which also ties his two scenes together:
```js
{ s: 'syllo', t: 'No sign of a fight, recruit. She\'d have won one.', when: { all: ['!dead:granny', '!dead:sequins'] } },
{ s: 'syllo', t: 'No sign of a fight, recruit. I\'m watching her lantern. It\'s still lit.', when: { all: ['!dead:granny', 'dead:sequins'] } },
```

**A3. Low. The piece is announced twice in a row; the camera line has no set-up for some players.**
- `:503` + `:565` (dead path) and `:520` + `:565` (`nudgeFled`): the Gate says Nudge went through with the piece, and the very next scene says it again. → `:565` **"Nudge ran through here. I feel… cloudier."**
- `:490` "Say 'always' for the camera!" A Ch2 jump-in walking back has heard neither the boast nor the recap (the logic fix gated "I KNEW YOURS" on exactly this). Give the Nudge line the same `when: { any: [{ seen: 'prologue.fair' }, { seen: 'recap.ch1' }] }`, with no replacement line needed.

**A4. Low. Fox's two Venn leads say the same thing.** `leads.js:37` vs `:54`.
- "Make the premises true and the ending false. If I can, it's broken." then, one station later, "Picture a world where the premises hold and the ending fails." A Road-venn → Well-venn player hears one idea twice in Fox's voice. (Frogling's "Does it follow?" three times is fine: it reads as his catchphrase.)
- → `leads.js:54` **fox: 'The well is dark. Picture what\'s down there. Every picture the premises allow.'** Or, shorter: **'Draw every world the premises allow. Does the ending live in all of them?'**

### Strongest new lines (don't touch)
"His lantern went out, recruit. I saluted it. I didn't know what else to do." · "Calm gets zero views!" · "You held it for him. Nobody else did." · "So is Granny." · "Ten fits prove nothing. One miss proves plenty. Hunt the miss." · "Still here, dear? The nuts are getting nervous." · "I remember the soup."

---

## Section B. Critic 3: The editor

### Score: **8.5 / 10. Passed.** The death path is now moving, not just correct.

| Criterion | R2 | R3 | Note |
|---|---|---|---|
| Hook | 8.5 | 8.5 | Unchanged. The recap's "Something in the sky heard." is a better hook for a jump-in than the old four lines. |
| Characters and arcs | 8 | 8.5 | Sequins is loved before he is endangered, and now mourned by people, not only by the narrator. Syllo gains a second layer in one line. |
| Antagonists | 8 | 8 | The Algorithm stays excellent. Nudge now has a motive, mocks the hero by name and loses on screen. Still one-liners (E3). |
| Plot hooks and set-ups | 8 | 8.5 | "One for each of us" → "It was the shiniest." "Nobody holds things for me" → "Look after it for me" → "You held it for him. Nobody else did." Three clean payoffs. |
| Pacing and momentum | 8 | 8.5 | Ch1 ends on Granny on every path. The jump-in reaches play fast. |
| Emotional throughline | 8 | 8.5 | The Quiet Scene now has gathering, last words, people who miss him, pain and moving on, in that order, in 7 lines. One tense clash (E1). |
| Skim test | 8.5 | 8.5 | Every scene's first line still pulls. |

### Round 2 status

| R2 | Status |
|---|---|
| E1 Ch1 ends on the Sundial | **Fixed.** "Eighteen fifty. That's through there. So is Granny." is the right last line for the lesson: a place, a time, a person. (A1 has a tiny wording polish.) |
| E2 Quiet Scene has nobody who misses him; lantern told, not seen | **Fixed.** The dark lantern is *seen* at the Fair, with Syllo's salute; the Quiet Scene has Syllo and Mirage and "You held it for him." Two small problems remain (E1, E2). |
| E3 Nudge escalates in volume, not threat | **Improved enough for lesson 1.** He now names the hero and uses the boast against him while Sequins drains. Ch2 must give him a scene where he costs the player something before a boss. |
| E4 Home look-back inert | **Fixed.** "Since before Granny was born" (she's ninety) gives the Sundial age and a small ache; "Now I ride in your shadow" lands. Grammar fix in A1. |

### Remaining problems

**E1. Medium–low. The Quiet Scene's mourners line clashes with the Fair, and Mirage's half is a riddle.** `lesson1.js:590`.
- A player who walked back after the Gate has already heard Syllo say "I saluted it." The Quiet Scene then says "Syllo **will** salute his empty stall." That is backwards.
- "Mirage won't look in her ball." On a skim, and for a non-native reader, it is unclear why. A visible act is clearer and sadder.
- Fix (present tense works on both paths):
```js
{ s: 'narrator', t: 'At the Fair, Syllo salutes his empty stall. Mirage has covered her ball.' },
```

**E2. Low–medium. On a later return with `dead:granny`, Syllo mourns only Sequins.** `:154–155`.
- If the first post-Sequins Fair visit comes after Granny's death too, the Sundial says "Two are dark", and Syllo answers "His lantern went out". He would not leave Granny out.
- Fix: split Syllo's line:
```js
{ s: 'syllo', t: 'His lantern went out, recruit. I saluted it. I didn\'t know what else to do.', when: '!dead:granny' },
{ s: 'syllo', t: 'Two lanterns out, recruit. I saluted both. I didn\'t know what else to do.', when: 'dead:granny' },
```

**E3. Low (watch, not a fix for lesson 1). Nudge is still a heckler, not an obstacle.** `:286, :290, :445, :490, :519–522`.
- Six appearances, all one line each. Fine for a minion in lesson 1, now that each one escalates (motive → loss → taunt by name → theft or humiliation). The Ch2 script should give him one beat where he blocks or tricks the hero, so the Ch4 payoff has something to pay.

**E4. Low. A walk-back player hears the lantern twice.** `:153` then `:585`.
- "The lanterns. One is dark." at the Fair, then the Quiet Scene opens "Back at the Fair, his lantern is dark". For that player the opening is old news, though it reads as a callback, not an error. Optional: `when: { not: { seen: 'ch1.lantern' } }` on `:585`, and for those who saw it: **"His lantern is still dark. I checked twice."**

### Skim test (first line of each scene, in play order)
cold ✓ · wake ✓ · fair ✓ · pattern ✓ · witness ✓ · gallery ✓ · rift ✓ · evening ✓✓ · signpost ✓ · road ✓ · road win ✓ (Nudge heckle) · bridge ✓ · well ✓ · night ✓✓ · door ✓✓ · gate ✓ · gate win ✓ (dead ✓✓) · pass ✓✓ · lantern ✓✓ · quiet ✓✓.

### The Quiet Scene (7 spoken lines with the apprentice line)
- Order matches the teacher's note 4 exactly. No gags. The replayed last words sit in the middle, which is the right place: the player hears them, then hears who misses him.
- "You held it for him. Nobody else did." is the emotional peak of lesson 1. It works because it was planted twice and never explained.
- With E1 it is finished.

### Regression check (both critics)
- **Voice:** no character drifted; Nudge's new lines are all influencer-speak; Syllo keeps "recruit" in grief.
- **Jokes:** the Gate win, crackle and Quiet Scene are joke-free on the dead path. The only adjacency is A2.
- **Grief:** solemn throughout; the villain is callous ("I TOOK THE TORTOISE TOO"), the game is not.
- **Pacing:** win scenes stay short (Road win is 3 lines for a walker, 6 for a jump-in); the Gate push gained one line and still reads fast.
- **Plain English:** all new lines are under 20 words except the Home look-back (18, fine); slips in A1 and E1.
