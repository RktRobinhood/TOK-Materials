# Script gate, lesson 3, round 1: all three critics

Date: 8 October 2026. Checked: commit 27a9494 (`data/script/lesson3.js`, the four Ch3 story cases in `data/cases.js`, the Ch3 nodes in `data/map.js`, the Ch3 leads in `data/script/leads.js`). I compared them with STORY.md §5 and Appendices B–D, UNDERSTUDIES.md, and the end of lesson2.js.

I traced two avatars:
- **Fox girl.** Played live from Ch2, Granny dead, the bargain refused, the Sundial dead at Count Two.
- **Owlet boy.** A Ch3 time-rift jump-in with no flags set. He takes the West Bridge route and a sound clip, then reaches the brink. A second run accepts the bargain at 5.

I also walked two other routes: Ch4 → Tower Road → down, and dead:sundial plus arrived:sundial.

## Scores

- **Critic 1, logic: 7 / 10. Fail.** The flags, the bargain gate (4–7, not in a memory), the brink, the death and the understudy gates all hold. But a walk down from Ch4 replays the whole pre-trial chapter after the trial. That is the same failure that held up lesson 2. After a death, the trial also plays on as if nothing happened.
- **Critic 2, author: 7.5 / 10. Fail.** The voices are sharp, the caricature warnings are good fallacy jokes, and the Fin turn is fairly clued. But nobody ever says what GUILTY does to the Sundial. Fin stays smug after it dies, and the middle third never raises the vote.
- **Critic 3, editor: 7.5 / 10. Fail.** The hook ("Whose trial?" / "Nobody's told me!") and the midpoint ("I filed it. I never read it.") are strong. But the climax has abstract stakes, the Sundial has no frightened beat after it learns it is on trial, and Quill as Juror One is invisible on a skim.

## What I verified

- **Understudies.** Kuku speaks only behind `KUKU` (dead + arrived): at `:90–91`, `:112` and `:547`. Achilles speaks only behind `dead:granny`: at `:73–79` and `:399–402`. His history is mentioned only after her death.
- **Required path.** The Café and the Library are on every route: the map shows that the Plaza links only to the Library, the Data Lab and the Archive. So `met: ch3.cafe` always holds.
- **Clip.** A Fox or Raven can still earn `sound` with their slick special card (+1 −1 +1).
- **Bargain.** The bargain is skipped after a fill (`VOTE_OPEN`) and in a memory. "I should have taken the deal" shows only with `bargain: no`. Pause, then resolve, gives tier 2 or 3.
- **Brink.** The brink gates all drains through `lte: 7`, and the adverts note (`:513`) fires correctly.
- **Death.** Every narrator line after the trial is ALIVE-guarded or has a Pip version. The last words at `:380` match `:567` word for word.
- **Inner voice.** Every species gets a lead, a blind spot and a reveal, with at most two inner lines a visit. `HEARD_BOAST` covers the jump-in.
- **TOK.** The ideas are stated correctly: valid vs sound, cherry-picking, "not always" vs "never", and monster-barring vs a narrowed claim.

## Problems (most severe first)

**1. Logic, major: a walk down from Ch4 meets pre-trial Tomorrowton after the trial** (`:59`, `:113–121`, `:135–137`, `:186–201`, `:209–226`, `:231–240`, `:300–347`, `:554–557`).
A Ch4 jump-in lands at the Tower Door. Fog lifts only around completed nodes, so the walk down goes Tower Road → Tribunal (won as a memory) → Steps → Data Lab → Plaza → Library → Café → Bridge → Rift Landing. After the verdict, the player then meets all of this:
- Speedcheeta's clip is negotiated "for the trial".
- Juror One posts #GUILTY.
- The Plaza reveals the defendant, with "GUILTY VOTES… AND CLIMBING".
- Fin, already struck off, collects Exhibit A "for the jury".
- The Sundial says "Poor thing. Whoever it is."
- FILE ticks "TRIAL OF THE SEASON · EVIDENCE FILED: 1", because `BEFORE_PLAZA` is still true.
- Pip asks "Whose trial?"
- The Tower Road "call" plays to someone who has already been up the tower.

Fix:
- Add `const POST = { seen: 'ch3.trial.win' };` and make `BEFORE_PLAZA = { all: [{ not: { seen: 'ch3.plaza' } }, { not: POST }] }`.
- Gate on `{ not: POST }`: the `ch3.arrive` first-visit block, `:136`, the Library script and its win, `:232–234`, and `:239–240`.
- Wrap the Plaza as `{ when: POST, then: [{ note: 'The Plaza screens still show it: THE ALGORITHM v. THE SUNDIAL. Stamped across it: DISMISSED.' }, { s: 'narrator', t: 'We know how this one ends. I\'d rather not watch it twice.', when: ALIVE }], else: [ …current… ] }`.
- Use these POST stand-ins:
  - Rift Landing: `{ s: 'narrator', t: 'Tomorrowton. The trial is over. This is only remembering.', when: ALIVE }`
  - Library: `{ s: 'fin', t: 'No licence. I come here to read now. The small print, mostly.' }`
  - Steps win: skip `:303–347` and play `{ s: 'pip', t: 'The trial\'s over. You\'re not evidence any more. Go home.' }`. Leave `clip` unset; Ch4 doesn't read it.
- Guard `ch3.towergate.call` with `{ not: LATER }`, else `{ s: 'narrator', t: 'The Tower Road. We\'ve been up. This was a memory.', when: ALIVE }`.
- Then re-trace the walk down.

**2. Author and editor, major: nobody says what GUILTY does, and the Sundial never shows fear** (`:209–219`, `:300–353`, `:564–575`).
STORY's spine says the sentence is "switched off". In the script the player learns it only from the death itself (`:382`). So the 8-notch "GUILTY vote" means a bad score, not a friend's life. After the reveal, the Sundial's only line is to Pip (`:213`). Its Café wish ("put me somewhere sunny", `:175`) is never paid off: there is no "sunny" anywhere in lesson4.js. Fix:
- After `:211`: `{ note: 'SENTENCE IF GUILTY: SWITCHED OFF. VOICE FILED IN THE TOWER.' }`
- The last line of `ch3.steps.win`, before the court: `{ s: 'narrator', t: 'Switched off. Like a screen. …Win, would you? I\'d like one more sunny day.', when: ALIVE }`. The Steps has no narrator aside yet.
- In `quiet.sundial`, after `:568`: `{ s: 'pip', t: 'It wanted somewhere sunny. When we find the sun, its piece goes there.' }`. That makes 7 lines, inside the template.

**3. Logic and author, major: after a death mid-trial, Fin is still smug and the counts open as normal** (`:431`, `:447–451`).
If the vote fills in Count One or Two, the next stage opens with Fin, `e: 'smug'`, saying "Count two. Numbers. It was wrong three times in ten!" and later "Count three. A proof…". He is a man who, we learn, "bet with its life". Nobody marks the silence either. The villain may be callous, but Fin isn't the villain, and the game's own staging shouldn't be. Fix:
- Gate `:431` and `:451` on `ALIVE`.
- Add `{ s: 'pip', t: 'I\'m still recording. It would want the end on the record.', when: 'dead:sundial' }` as the first line of `count2`.
- Add `{ s: 'fin', e: 'shaken', t: 'Count two. The court says we finish. …So we finish.', when: 'dead:sundial' }`.
- Add `{ s: 'fin', e: 'shaken', t: 'Count three. I\'ll read it. I won\'t enjoy it.', when: 'dead:sundial' }`.
- Leave Nudge's lines; he may be callous.

**4. Author and editor, medium: the middle third doesn't raise the stakes** (`:219`, `:231–257`, `:285–289`).
STORY: "You build the defence while the GUILTY vote climbs." The vote appears once, at the Plaza, and is never shown again until the court opens at 0. The Data Lab, Gallery and Steps have no pressure. The outline's best crowd post ("My uncle had a sundial. It was rude to him. GUILTY.") is missing. Notes are free, because they are unvoiced. Fix:
- Before `:233`: `{ note: 'GUILTY VOTES: 48,310. AND CLIMBING.' }`
- After `:233`: `{ note: 'Another: "My uncle had a sundial. It was rude to him. GUILTY."' }`
- First step of `ch3.steps`: `{ note: 'GUILTY VOTES: 310,552. VERDICT TODAY. THE TRIBUNAL DOORS ARE OPEN.' }`

**5. Logic, low: Pip's "full" quote is shorter than the full quote, and it comes after the count it belongs to** (`:417`, `cases.js:278`).
Count One's evidence card is the real full quote: "I tell the time. Mostly. On cloudy days I guess." Then, before Count Two, Pip reads "in full" only "On cloudy days I guess." The Raven reveal then lands after the player has already used it. Fix `:417`: `{ s: 'pip', t: 'Struck from the record: "fraud admits". The whole sentence: "Mostly. On cloudy days I guess."' }`. It now reads as a correction to the record, not a new reveal.

**6. Logic and editor, low: in tier 4 nobody orders the exhibit home, and both win branches break the six-line cap** (`:498–503`, `:512–535`).
In tier 4 the Algorithm has won, yet it releases Exhibit A unprompted. The voiced lines run to 7 (tier 4) and 7 (tier 2), and up to six notes in a row read like captions. Fix:
- Tier 4: replace Pip's `:499` with `{ s: 'judge', t: 'But the exhibit was stolen. Stolen things go home.' }`. Merge `:502–503` into one line: `'VERDICT: EXECUTED. EXHIBIT A… released? probably— RELEASED.'` That gives 6 lines.
- Tiers 1–3: merge Fin's `:525–526` into `{ s: 'fin', t: 'The vault never opens. Courts do. …So I let it win. For a bit.' }`. The preceding note already shows the prize coming out of the vault.
- Merge `:529–530` into one gallery note.

**7. Editor, low: Juror One is not recognisably Quill** (`:234`, `:509`, `:529`).
"A tall juror in a new mask" and "maybe" are fair, but they are faint for a skimmer, and Quill is the last boss. Her Ch2 hinge was the red pencil (`lesson2.js:201`), and that tell costs nothing. Fix:
- `:234` → `…It is signed JUROR ONE. In red pencil.`
- `:529` → `…All but one: Juror One's, in red pencil. Then she lowers it too.`
- `:509` → `…Juror One holds up her red-pencil sign in an empty gallery.`

## Gate status

All three critics fail this round. Problems 1–3 must be fixed for logic, author and editor to reach 8. Problems 4–7 are small and need no rescore. Round 2 should re-trace the Ch4 walk down and a death in Count One.
