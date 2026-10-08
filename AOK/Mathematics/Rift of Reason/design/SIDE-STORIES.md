# Rift of Reason — Side stories (pop-up one-shots)

Status: **lesson 1 (stories 1–3) scripted and passed the writing gate** (8 October 2026: Logic 8, Author 8.5, Editor 8.5; `reviews/writing-side-l1-r1-*.md`, `-r2-*.md`; `data/script/side-stories-l1.js`). **Lesson 2 (stories 4–6) scripted and passed the writing gate** (8 October 2026: Logic 8, Author 8.5, Editor 8.5; `reviews/writing-side-l2-r1-*.md`, `-r2-*.md`; `data/script/side-stories-l2.js`). **outline passed the gate** (8 October 2026, `reviews/outline-gate-passed-2026-10-08.md`); the **engine is built** (#56: `js/core/side-stories.js`, `js/core/side-verbs.js`, `js/screens/side-story.js`, bench `dev/side-story.html`); stories 4–10 are not scripted yet. The map marker art `ui/side-story` exists. Ten one-shots: three each for lessons 1 and 2, two each for lessons 3 and 4. Nothing is scripted until the three critics in `design/WRITING-CRITICS.md` each score 8/10. Main story: `design/STORY.md` (appendix letters below refer to it). Research: `research/one-shots-and-stakes.md` Part 5; `research/draw-steel-and-disco-elysium.md` §3.1.

**What a side story is.** A 5–10 minute scene at a station you **have already visited**, not part of the main plot (teacher's note 8). It practises the reasoning of the lesson that unlocked it, through **negotiation**, **deduction**, **argument-spotting** or a **test**. Each one has a stakes clock, a fair twist, a reward, and sometimes a small ripple into the main story. None is needed to finish the game. **Nobody can die in a side story.**

House rules from STORY.md apply: short plain lines; every line a joke, threat, reveal, choice or payoff; no rules in dialogue; no gendered words for the avatar; calm motion.

---

## 1. The map icon

**Look.** A speech bubble over the station, in the lesson's colour, that slowly fades in and out (about 3 seconds per cycle; no bounce or shake; a still, bright bubble under Calm motion). Hover shows the teaser.

**When one appears.** When both are true:
1. The **lesson trigger** has been met (the skill has been taught), on a required node:
   - lesson 1: the Troll Bridge is solved (so these can be done before the Gate);
   - lesson 2: the Village Square is solved (its table, `ch2.square.win`);
   - lesson 3: the Neon Plaza scene has played;
   - lesson 4: the Prediction Hall is solved.
2. The story's **station has been visited**. A time-rift jumper who never walked to the Fair sees no Fair stories until they do.

**How many.** At most **two** icons at once. The rest queue: stories from the current lesson first, then the oldest.

**If ignored.** Nothing bad happens. Icons never expire, the Feed never ticks for an ignored story, and nobody is hurt off-screen. You only miss the reward and the ripple. Once per lesson, at a rest stop, the narrator may spend its one aside on a waiting story ("Somebody at the Well is very lucky. Suspiciously lucky."). If a ripple targets a boss you have already beaten, the story still plays, and the ripple becomes a keepsake or a reaction line (each story says which).

---

## 2. The template

Six beats, about 25 lines.

| Beat | Time | What happens |
|---|---|---|
| 1. **Strong start** | 30 s | Something is already going wrong. 2–3 voiced lines; the clock appears. |
| 2. **Three clues** | 3–4 min | Three hotspots on the station's existing background: a **person**, an **object**, a **record**. Any order; **any two are enough** (the generator checks every pair; story 4 is the stated exception). |
| 3. **The twist** | 1 min | A fact that reframes the request. It adds a clue card. At least one earlier clue sets it up. |
| 4. **Resolution** | 1–3 min | One verb: **Deduce** (pick, then a one-click "Why?"), **Negotiate** (Interest/Patience; listen before you ask), **Object** (a 3–4 line mini cross-examination), or **Test** (choose the test that could prove the claim wrong). |
| 5. **Outcome** | 30 s | The clock's tier, with a short scene for each. |
| 6. **The last line** | 10 s | A character beat or punchline that **implies** the idea. Only stories 5 and 9 end on an explicit question. |

**The clock** (the boss widget, STORY.md Appendix C): Danger 6 (4 for the gentlest); Progress 3–4. Mistakes tick the clock instead of costing hearts. Clue clicks after the first three cost 1 notch (time is counted in actions, never seconds). Drains: the story's blue option; a matching-colour creature on the team (once); a heart (once); in negotiations, each "listen" move (mirror, name the feeling, sum up), once. Tiers, the same bands as STORY.md Appendix C: Danger 6, **Clean** 0–1 · **Close** 2–3 · **At a price** 4–5 · **Too late, for now** 6; Danger 4, **Clean** 0–1 · **Close** 2 · **At a price** 3 · **Too late, for now** 4. Feed: tier 1 −1, tier 3 +1, tier 4 +2. Ripples into a boss are capped at 2 notches per boss.

**Possession in side stories.** Caricatures may be possessed (the glow, Appendix A.6) and are freed when beaten. **No known NPC is ever possessed in a side story**, and no side story is anyone's death-risk moment.

**Hosts who have gone.** If a host's role was vacated in the main story, the story uses `role:` text: the understudy if they have arrived; otherwise the station's fallback (STORY.md Appendix D). Understudies never appear otherwise.

**Inner voice.** One hook per species per story, in each voice's personality (STORY.md Appendix E). One of them is the **blue option**, a choice only that species sees:

| Blue option | Stories |
|---|---|
| Owlet | 4, 8 |
| Moth-kin | 3, 9 |
| Fox | 5, 7 |
| Frogling | 2, 6 |
| Raven | 1, 10 |

---

## 3. The ten at a glance

| # | Title | Station | Lesson | Skill | Verb | Twist turns on | Ripple |
|---|---|---|---|---|---|---|---|
| 1 | Siege at the Witness Tent | Fair: Witness Tent | 1 | confirmation bias | Negotiate | a beloved bird did it, innocently | Mirage testifies at the Ch3 trial |
| 2 | The Lucky Well | Road: Wishing Well | 1 | induction from a biased sample | Test | the lucky one knows it's not luck | Nudge's tunnel map: drain at the Gate |
| 3 | The Midday Pie | Road: Campfire | 1 | induction vs deduction; common cause | Deduce | there is no thief | none (a visitor) |
| 4 | The Three Cake Tins | Boolesbury: Bakery | 2 | truth values, "at most one is true" | Deduce | Granny is planning her own rescue | the ladle: drain at the pot |
| 5 | The Silent Pupil | Boolesbury: Schoolhouse | 2 | liars and truth-tellers; silence | Deduce | the answer isn't among your options | a reaction at the Hall |
| 6 | Muskrat's Launch | Road: Troll Bridge | 2 | truth tables with a liar | Deduce | two worlds fit; only a test decides | none (a visitor) |
| 7 | Syllo's Recruitment Drive | Fair: Syllogism Gallery | 3 | popularity, false choice, authority | Object (duel) | the "everyone" was wooden | toy soldiers: drain on the Copy |
| 8 | The Headline Debate | Tomorrowton: Newsstand | 3 | strawman; persuading vs showing | Object (referee) | the angry poodle wrote it | the full quote: drain at the trial |
| 9 | The Fortune Machine | Fair: Witness Tent | 4 | base rates; right often ≠ knowing | Test + choice | never right when it matters | a bark on the restored Fair |
| 10 | The Giveaway App | Road: Campfire | 4 | proxy variables; who pays for errors | Negotiate + choice | nobody cheated; the measure is wrong | a bark on the restored Fair |

---

## 4. Lesson 1

### 1. Siege at the Witness Tent

**Station:** the Fair, Madame Mirage's tent. **Teaser:** "The Witness Tent is tied shut from inside. Someone is dealing cards."

**Hook.** Corvina the Card Sharp has barricaded herself in Mirage's tent with three fairgoers (Mr. Beansprout, Billie Eelish, a Speedcheeta cub) and Mirage's crystal ball. Everyone "knows" she stole the Thinking Trophy: at the final, the trophy's stand at the Nut Stall was empty, and Speedcheeta's clip shows a black wing beside it. Sergeant Syllo's toy army will charge with cork rifles at the end of a drum roll. (The teacher's own example: a criminal with hostages at a Fair station, solved by talking.)

**Reasoning: Negotiate**, on the crisis "stairway": each reply is tagged **Listen / Feel / Trust / Ask**, and asking her out before Trust costs a notch. Corvina: Interest 2, Patience 3. **Cares about:** Fairness ("Everyone blames the crow"), Profit ("What do I get?"). **Can't stand:** Experts ("Don't you lecture me").

**Clues (any two show she didn't take it):**
- *Person:* Billie, whispering through the flap: "She's been dealing cards to us all morning. Badly. She never left."
- *Object:* the clip, zoomed out: the wing is black **and white**. A magpie's.
- *Record:* the Pattern Stall's polishing box: the trophy, and a note, "Polishing. Back soon. —S"

**Twist.** Sequins "borrowed" the trophy before the crack, to polish it. The crowd suspected the wrong black bird. If `dead:sequins`, the note now hurts: it waits behind the black ribbon, or Tally hands it to you if she has arrived ("He polished things. Without asking. Always.").

**Clock.** Danger: the drum roll (6). Progress: her trust (4).

**Outcomes.** 1: everyone walks out; the trophy goes back on its stand; Corvina gives you a lure. `mirage-witness`: at the Ch3 trial Mirage testifies, through her ball, that she saw the sky take the shadow (drain 1). 2: everyone out, but the tent is torn and closed for one visit; `mirage-witness`. 3: Syllo charges; everyone is covered in fortune-teller glitter; Corvina slips out the back; no witness; Feed +1. 4: Corvina escapes with the crystal ball, and Mirage reads tea leaves until story 9. Feed +2. (If Syllo is away chasing recruits from story 7, the toy soldiers have no sergeant; their drummer only knows one beat.)

**Late play.** If the trial is already over, Mirage gives you a free fortune instead: "You will win an argument. You already did."

**Inner voice.** Owlet: "Everyone 'knows'. Nobody checked. That isn't knowing. I checked." · Moth-kin: "Look. The clip has edges. There's more picture." · Fox: "What if the black wing belongs to someone we like? Twist!" · Frogling: "Crows got blamed for my mother's pond, too. It was the wind." · **Raven (blue, drains 1):** "Tell her: 'People blame black feathers. I know. I have them.'"

**Sample lines.**
> **syllo:** Thirty seconds, recruit! Then we go in. Corks loaded!
> **corvina:** I didn't take it! But nobody believes a crow. Ever.
> **billie** *(whispering)*: She's been dealing cards to us all morning. Badly.
> **beansprout** *(says nothing; holds up an ace he found in her sleeve)*
> **corvina** *(last line)*: Crows get blamed. Magpies get trophies. …I'm keeping the ace.

### 2. The Lucky Well

**Station:** the Road, the Wishing Well. **Teaser:** "A queue at the Wishing Well. Coins are going in. Nothing is coming out."

**Hook.** Siuuugull tells a queue of Fair folk that the well works: he wished before matches, and he scored. Chimpossible livestreams it ("Entirely possible!"). Mr. Beastie has just thrown in a giant cheque.

**Reasoning: Test** (induction from a one-sided sample), then a 2×2 table (numbers generated each play).

**Clues (any two show wishing does nothing):**
- *Person:* Siuuugull's list: only the matches where he wished **and** scored.
- *Record:* the referee's full log: 6 goals in 10 matches after wishing, 6 in 10 without (generated, always equal or near-equal).
- *Object:* down the well, by lantern: Nudge (in whatever look it has by then: ring light, mask or clipboard; STORY.md Appendix G), scooping coins and muttering "Engagement".

**Twist.** Siuuugull knows the well doesn't work. "I know. I just like the moment before the kick. It's quiet." He never asked anyone else to wish; the queue copied him. And Nudge, caught, drops a tunnel map: it has been digging under the Gate, towards the cage.

**Resolution.** "Which data would show whether wishing works?" His scoring matches / all matches he wished before / all matches, with and without wishing / what the viewers think. Only the third. Then: "Does wishing help?" (No: same rate.)

**Clock.** Danger: coins lost (6). Progress: people who stop wishing (3).

**Outcomes.** 1: coins back; Siuuugull visits as a catchable creature; `well-map` (drain 1 at the Ch1 Gate). 2: most coins back; `well-map`. 3: Nudge escapes with half and the map; Feed +1. 4: Nudge escapes with everything, cheque included; Beastie films a very sad video. Feed +2.

**Late play.** If the Gate is already won, the map is a keepsake ("a very bad map").

**Inner voice.** Owlet: "Wished and scored. What about wished and missed? I always ask that." · Moth-kin: "Look. His list has no crosses. Lists always have crosses." · Fox: "Picture the matches he didn't write down. Lots of drama there." · **Frogling (blue, +1 progress):** "Ask him: 'Remember the matches you forgot to wish?'" · Raven: "'Works.' Works compared to what?"

**Sample lines.**
> **siuuugull:** I wished. I scored. SIUUU! The well is magic!
> **chimpossible:** It's entirely possible. Jamie, pull that up. Who's Jamie?
> **beastie:** I threw in a cheque! The biggest wish ever!
> **siuuugull** *(quietly)*: I know it doesn't work. I just like the moment before.
> **chimpossible** *(last line)*: Jamie. Pull up the full table. …There's no Jamie, is there.

### 3. The Midday Pie

**Station:** the Road, the Campfire Clearing. **Teaser:** "At noon, a pie vanished from the Campfire. At noon yesterday, too."

**Hook.** Rawmsay's bake-off pie vanishes at noon, every day, and he will close the Campfire kitchen for everyone. The crowd blames Keanu Meows: "Every time a pie goes, the black cat walks by."

**Reasoning: Deduce.** An elimination grid (3 suspects × 3 clues). Induction ("every time…") suggests; deduction settles it; and a third thing can cause two others.

**Clues (any two show there is no thief):**
- *Person:* Sir David Attenbirdough, whispering behind a fern: "The cat passes when the oven timer rings. Noon. Remarkable."
- *Object:* Rawmsay's own apron: pastry crumbs, and a fork in the pocket.
- *Record:* the timer log: it rings at noon. The kitchen's warm-air vent opens at noon, too, right where Keanu likes to nap.

**Twist.** There is no thief. At noon the timer rings: it wakes Rawmsay, who sleep-bakes, and sleep-eats, and it opens the warm vent that draws Keanu past. The cat and the missing pie happen together because the timer causes both.

**Clock.** Danger: Rawmsay's temper (6). Progress: the case (3).

**Outcomes.** 1: Rawmsay, mortified and then tender ("Come here, little one. Have tomorrow's pie."); Keanu visits as a catchable creature. 2: the pie is gone, but the kitchen stays open. 3: Keanu is cleared, but the kitchen closes for one visit; Feed +1. 4: Keanu is sent away down the Road and forgives you later at the Rift Pass, because he is famously nice; Feed +2.

**Inner voice.** Owlet: "'Every time' is a pattern. A pattern isn't a proof. Classic me." · **Moth-kin (blue, +1 progress):** "Shh. Look at his apron. Look closely." · Fox: "What if nobody stole it? Plot twist of the year." · Frogling: "Every noon, the cat. Every noon, the pie. Every noon, the timer." · Raven: "'Walks by.' Not 'takes'. Different verbs."

**Sample lines.**
> **rawmsay:** WHERE IS MY PIE? It was PERFECT. It was barely RAW.
> **crowd:** Every time a pie goes, the black cat walks by!
> **attenbirdough** *(whispering)*: The cat passes when the timer rings. Remarkable.
> **keanu:** I have a strange feeling I've been accused of this before.
> **rawmsay** *(last line, finding the fork)*: …I have been eating my own pies. In my sleep. Delicious.

---

## 5. Lesson 2

### 4. The Three Cake Tins

**Station:** Boolesbury, the Bakery. **Teaser:** "Three cake tins in three hot ovens. One holds a cake."

**Hook.** Mrs Crumb baked the cake for tonight's Feast of Laws and hid it in one of three tins. Imps have lit the ovens under all three. One holds the cake, one a custard trap, one the Mayor's itching powder.

**Reasoning: Deduce**, a three-row truth table (a small version of the Ch2 table tool): "Suppose the cake is in A. Which labels are true? Is that allowed?" (The public-domain casket puzzle, in a Smullyan style.)

**Clues (the stated exception: two specific clues are needed):**
- *Record:* the three labels (generated, for example A: "The cake is here." B: "The cake is not here." C: "The cake is not in A.").
- *Person:* Mrs Crumb: "I wrote them so that at most one label tells the truth."
- *Object:* a dented tin. Mrs Crumb never dents her cake tin, so it rules one tin out.

The labels and the rule always solve it. The dent is a shortcut a stuck player can use. (Logic round 1 found "any two" false here; this is the corrected claim.)

**Twist.** Baked into the cake, a note in Granny's hand, slipped into the flour sack Mrs Crumb took up to the Town Hall kitchen: "Bring a ladle. A big one. I have a plan." Everyone knows the soup is Granny (Nudge's flyers say so); what nobody knew is that Granny is planning her own rescue. It also answers the Ch1 crackle ("Bring a lad—").

**Clock.** Danger: oven heat (6; a wrong tin costs 2). Progress: 3.

**Outcomes.** 1: the cake is saved, the note found, and Mrs Crumb hands you her biggest ladle: `ladle` (bail the pot at the Hall; drain 1). Plus a slice (healing). 2: singed cake; note and ladle. 3: the custard trap goes off and you are "Custardy" for one visit; the note is found, the ladle lost in custard; Feed +1. 4: the cake and the note burn; Feed +2.

**Late play.** After the Hall: with Granny alive, Mrs Crumb laughs ("You brought yourself. That'll do."); with `dead:granny` she says nothing, and gives you the ladle to keep.

**Inner voice.** **Owlet (blue, +1 progress):** "Suppose each tin in turn. Count the true labels. One world fits. Mine." · Moth-kin: "Look. That tin's dented. She'd never dent her own." · Fox: "What if the label on the cake tin is the liar? Delicious." · Frogling: "'Bring a lad—'. Granny said that. I remember. Now I know the rest." · Raven: "'At most one' allows zero. Read the small words."

**Sample lines.**
> **baker:** Three tins! One cake! And imps lighting fires under my livelihood!
> **baker:** I wrote the labels. At most one tells the truth. Very secure.
> **avatar:** That is the least secure thing I've ever heard.
> **granny** *(the note)*: "Bring a ladle. A big one. I have a plan."
> **baker** *(last line, handing it over)*: Biggest ladle in Boolesbury. Bring her back. And the ladle.

### 5. The Silent Pupil

**Station:** Boolesbury, the Schoolhouse. **Teaser:** "Detention for everyone. Somebody wrote one sentence on the board."

**Hook.** Someone chalked THIS SENTENCE IS FALSE on the blackboard. Before the Hall, Miss Quill is calmly furious: "It is neither one nor zero. Detention for all until someone confesses." After the Hall, Mr Gumleaf finds it lovely: "Miss Quill would have been furious. I think it's great. But the rules say find them."

**Cast.** Miss Quill or Mr Gumleaf; four pupils of the "visitor class" (Astrophysicat, Khaby Llame, Billie Eelish, Mr. Beansprout); Smudge.

**Reasoning: Deduce.** Liars and truth-tellers: the writer lies, the others tell the truth (generated statements). Khaby only **points** (a gesture, not a statement). Beansprout says **nothing**: neither a liar nor proven honest.

**Clues (any two show the writer is not a pupil):**
- *Person:* the pupils' statements. Filled in, **no row** makes any one of them the writer (the generator guarantees it).
- *Object:* chalk dust on the chimney grate, none on any desk.
- *Record:* the seating chart: every pupil was seated, facing the board, when the teacher turned round.

**Twist.** The table's answer is "none of them": a truth table can tell you the answer is not among your options. The writer is Smudge, hiding up the chimney. He heard the Mayor say the sentence in the Square, saw Quill flinch, and wanted to see it again. (Before the Hall, this is a fair, optional clue to the Ch2 twist.)

**Clock.** Danger: the detention (each wrong accusation adds "ten more minutes"; 6). Progress: 3.

**Outcomes.** 1: the class is freed, and Smudge is praised (Gumleaf) or quietly shielded (Quill); a Reason-colour visitor appears; `paradox-board`. 2: freed after writing "I will not write paradoxes" fifty times; `paradox-board`. 3: a pupil is blamed first, then cleared; Feed +1. 4: the whole class gets detention, and Beansprout holds a silent protest nobody can grade; Feed +2.

**Ripple.** `paradox-board`: at the Hall's climax, Smudge cheers from the gallery: "My sentence! From the board!" (A reaction only; the pot's side-story cap goes to story 4.) Played after the Hall, the board becomes a keepsake instead: framed, in the Schoolhouse.

**Inner voice.** Owlet: "If no row works, my suspect list is wrong. Not me. The list." · Moth-kin: "Shh. The dust is on the grate. Not a desk." · **Fox (blue, +1 progress):** "What if it's nobody in this room? Ooh." · Frogling: "The Mayor says that sentence. And she flinched. I remember." · Raven: "Silence isn't a statement. Can't be true. Can't be false."

**Sample lines.**
> **quill:** It is neither one nor zero. Detention for all until someone confesses.
> **khaby:** *(says nothing; points at the chimney)*
> **avatar:** Beansprout said nothing. That proves nothing. Either way.
> **sweep** *(from the chimney)*: I only wanted to see her flinch again.
> **quill** *(last line)*: Silence is not a statement. I cannot grade it. Can you?
> **gumleaf** *(last line, after the Hall)*: Silence. Can't grade it. Can't fail it. Lovely.

### 6. Muskrat's Launch

**Station:** the Road, the Troll Bridge (an earlier station, after lesson 2). **Teaser:** "A countdown at the Troll Bridge. Muskrat is strapped into his rocket."

**Hook.** Muskrat Rocket has strapped himself into his rocket ("MARS: TODAY. NOT NEXT YEAR. TODAY."), and the countdown has started. It is pointed at the river. Three ground crew shout which switches abort the launch: Lady Gargoyle (in a ridiculous costume), Zuckerborg (too-wide smile) and Eminemu (in rhyme, very fast). One of them always lies. The generator picks which, so no "type" of crew member is ever the guilty one.

**Reasoning: Deduce**, truth tables with a liar: each crew member describes one switch's wiring (AND/OR/NOT on the switchboard). Fill in the table, find the abort, set it.

**Clues (any two decide it):**
- *Person:* the three crew statements.
- *Object:* the wiring diagram on the rocket's side, half scratched off: enough to test one claim.
- *Record:* the launch log: which switch the last working abort used.

**Twist.** The table leaves **two** worlds standing: in one the costume lies, in the other the rapper does, and each world has a different abort switch. No amount of shouting can settle it. Only a test can: the diagram or the log. A truth table can tell you that the evidence isn't enough **yet**. Once it's aborted, Muskrat, quietly, before his last line: "I didn't want to go today. I just couldn't say 'next year' again."

**Clock.** Danger: the countdown (6). Progress: 3.

**Outcomes.** 1: aborted; Muskrat climbs out ("Mars. Next year. I feel good about it."); he visits as a catchable creature, and you get a "MARS: NEXT YEAR" banner (cosmetic). 2: aborted, after a big puff of smoke. 3: it launches three metres and lands in the river; Muskrat is soggy and fine; Feed +1. 4: it launches thirty metres, into the river; the bridge is closed for one visit; Feed +2.

**Inner voice.** Owlet: "Two rows survive. Two! I'd like a word with this table." · Moth-kin: "Look. The diagram's scratched, but one wire still shines." · Fox: "Two possible worlds. In one we're heroes. In the other we're wet." · **Frogling (blue, +1 progress):** "Remember Mr Tock's plaques? Same AND. Same NOT." · Raven: "'One of them lies.' It never said we'd know which."

**Sample lines.**
> **muskrat:** Mars! Today! Not next year! Today! …Is it always this loud in here?
> **eminemu:** Switch two, it's true, it's the cue, push it through—
> **gargoyle:** Switch two makes it go faster, darling. I'd know. I'm wearing a rocket.
> **avatar:** Both stories fit. So we test one.
> **muskrat** *(quietly)*: I didn't want to go today. I just couldn't say "next year" again.
> **muskrat** *(last line, climbing out)*: Next year. Definitely. Probably.

---

## 6. Lesson 3

### 7. Syllo's Recruitment Drive

**Station:** the Fair, the Syllogism Gallery. **Teaser:** "A drum at the Fair. Half the Fair is marching in step."

**Hook.** Sergeant Syllo has drafted half the Fair into his toy army. At the end of the drum roll they will march down the Road, "to fight the sky". A front rank of eleven was marching first; the rest fell in behind. The new recruits' eyes are starting to glow: the louder the drum, the more the feed takes them.

**Reasoning: Object**, an argument duel. Each possessed recruit gives a reason for joining; you pick the reply that answers that **kind** of bad argument, and the recruit's glow drains. Then Syllo rewords the same tricks, and you must recognise them by meaning, not wording.

**Clues (any two show the drive is built on fallacies):**
- *Record:* his posters: "EVERYONE'S JOINING!" (popularity); "MARCH OR BE A COWARD!" (false choice); "THE ROCKODILE SAYS SO!" (authority, with the eyebrow).
- *Person:* Usain Volt: "I joined because everyone else did."
- *Object:* the front rank. They never blink, and their eyes don't glow. One has a paint chip on its nose.

**Twist.** The "everyone" was wooden. The front rank, the first eleven "recruits", are Syllo's own toy soldiers, painted as Fair folk. Every real recruit joined because a crowd was already marching. The Fair has gone quiet (Granny gone; Sequins quieter than usual, or gone; you away), and he is lonely: "They were the only ones who ever listened. I thought, if they marched, you'd follow." The last round is not an answer to a fallacy. It is a **sound** reason to stay, which you give him.

**Clock.** Danger: the drum (6). Progress: recruits freed (4).

**Outcomes.** 1: everyone stays; Syllo opens a "fallacy range" (a line only: there is no argument-card mechanic) and gives you a **Ward**, his lucky cork (the item: it cancels one bad fate roll after a battle); `soldiers`: his toy army holds the far end of the Summit Rift in Ch4 (drain 1 on the Copy, applied at the core before its tier is set). 2: everyone stays, and Syllo sulks (his practice matches are louder, a note only); `soldiers`. 3: half the recruits march off and come back loud for a while; Feed +1. 4: on the last boom every recruit still glowing marches off (the wooden front rank stays), and Syllo goes after them alone. The Gallery hangs a sign, and his trainer challenge is closed (the card school still teaches), "GONE AFTER MY RECRUITS. —S", until the finale; on the restored Fair map he is home, hoarse, with most of them (a bark, STORY.md §6). Feed +2. (He is missing, not dead; no understudy steps in.)

**Late play.** If the core is already won, the wooden soldiers stand guard at the Gallery instead (a keepsake view).

**Inner voice.** Owlet: "'March or be a coward.' Two options? I count at least four." · Moth-kin: "Look. The front rank never blinks. Not once. Not even at the drum." · **Fox (blue, drains 1):** "Tell him: picture the Fair without its Sergeant." · Frogling: "Last time a crowd all agreed, it was the crack. Remember?" · Raven: "'Everyone.' Count them. It's eleven."

**Sample lines.**
> **syllo:** RECRUITS! Everyone's joining! Are you everyone, or are you NOBODY?
> **usain volt:** I joined because everyone else did. Is that… not a reason?
> **avatar:** The Rockodile says so. Is the Rockodile a sergeant?
> **usain volt** *(after the twist)*: I joined because everyone else did. …Is "everyone" made of wood?
> **syllo** *(quietly)*: They were the only ones who ever listened. I thought, if they marched, you'd follow.
> **syllo** *(last line)*: Fine. I'll shout at targets. Targets never leave.

### 8. The Headline Debate

**Station:** Tomorrowton, the Newsstand. **Teaser:** "A poodle and a puffin are about to debate a headline. The crowd's eyes are glowing."

**Hook.** On the Newsstand steps, Tremendoodle demands an apology from the editor, Sir David Attenbirdough, for the headline TREMENDOODLE SAYS SPEECHES ARE A DISASTER. A crowd films it; the angrier it gets, the more eyes glow. Pip asks you to **referee**.

**Reasoning: Object**, refereeing a short public debate. Press each side's claim, present a clue at the one that doesn't hold, and name the flaw (strawman, popularity, attacking the person).

**Clues (any two show the headline misstates the article):**
- *Record:* the article: "Tremendoodle's speech was long."
- *Object:* the headline. He never said speeches are a disaster.
- *Person:* the paper-seller: "That headline came in this morning. Handwritten. On golden paper."

**Twist.** Tremendoodle wrote the headline himself, on his own golden paper, so that he would have something to be outraged about. Outrage gets attention. The poodle is the strawman's author.

**Clock.** Danger: the crowd's glow (6). Progress: claims refereed (4).

**Outcomes.** 1: the crowd calms; the paper prints a correction, and Attenbirdough promises to print every quote **in full** from now on, starting with today's big one, the Sundial's own "On cloudy days I guess": `fair-quote` (drain 1 at the Ch3 trial); Tremendoodle gives you a nickname title (cosmetic). 2: calmed, but Tremendoodle still gets his front page; `fair-quote`. 3: the crowd boos everyone, and the Newsstand closes for one visit; Feed +1. 4: the glowing crowd chants the headline across Tomorrowton until the trial ends; Feed +2.

**Late play.** After the trial, Attenbirdough frames the full quote for the Café wall.

**Inner voice.** **Owlet (blue, +1 progress):** "Spell it out: article says 'long'. Headline says 'disaster'. QED." · Moth-kin: "Look. Golden paper. Who owns golden paper?" · Fox: "Picture him writing it. Tongue out. Concentrating." · Frogling: "'I guess.' The paper cut a quote once before. I remember." · Raven: "'Says.' He never said it. The headline did."

**Sample lines.**
> **tremendoodle:** A DISASTER, they say I said! Fake! Very unfair! Tremendously unfair!
> **attenbirdough** *(whispering)*: Here we see the poodle in its natural habitat. Outraged.
> **pip:** You're the referee. Press a claim. Any claim. Please.
> **tremendoodle:** "Long"? They said my speech was "long"? …That's fair, actually.
> **attenbirdough** *(last line, whispering)*: The poodle agrees with a fact. Extraordinary. We may never see this again.

---

## 7. Lesson 4

### 9. The Fortune Machine

**Station:** the Fair, the Witness Tent. **Teaser:** "A violin lies smashed outside the Witness Tent. A machine says YOU WILL FAIL. 90%."

**Hook.** A fairgoer smashes their own violin because a shiny new Fortune Machine told them "YOU WILL FAIL. 90%." Altmanta installed it in Mirage's tent: "90% accurate!" Fairgoers are giving up their hobbies. Mirage reads tea leaves on the step. (If story 1 ended at tier 4, the machine's glass dome is her stolen crystal ball. Corvina sold it on.)

**Reasoning: Test, then a choice.** Base rates: if 90% of Fair days are like the day before, "same as yesterday" is 90% right while knowing nothing.

**Clues (any two show it knows nothing):**
- *Record:* its log: 90 right out of 100.
- *Object:* inside the panel, one dial: PREDICT: SAME AS YESTERDAY.
- *Person:* Mirage: "At a fair, most days are like yesterday. I could do that. I chose not to."

**Twist.** It has never once been right on a day when something **changed**, the only days that matter. On the day of the crack it predicted "a normal Fair".

**Resolution.** Choose the test that separates foresight from guessing the usual: ask it about a day that is different. Then choose **which sign goes on it** (`honest-label`): "90% ACCURATE" (true, and misleading) / "I GUESS THE USUAL" (honest) / "BROKEN" (false: it works exactly as built). (This rehearses honest framing; the decision about the Algorithm itself comes at the core.)

**Clock.** Danger: fairgoers who give up (6). Progress: 4.

**Outcomes.** 1: hobbies are taken up again, and Mirage gets her tent back (and her ball, if it was lost). 2: most come back. 3: half the Fair still believes it; Mirage shares the tent, grumpily; Feed +1. 4: it predicts you will lose your next card battle, and the crowd boos you (cosmetic) until you win one; Feed +2.

**Ripple.** With the honest sign, an optional bark at the Witness Tent on the restored Fair map after the finale (STORY.md §6): Mirage, "Altmanta's box says 'I GUESS THE USUAL' now. Labels are catching on."

**Inner voice.** Owlet: "Right ninety times because ninety days were the same. Proves nothing. I'm proud of that sentence." · **Moth-kin (blue, drains 1):** "Shh. Open the panel. Look. One dial. That's it." · Fox: "Ask it about a strange day. Watch it panic." · Frogling: "The day of the crack. What did it say about that day?" · Raven: "'Accurate.' Accurate at what?"

**Sample lines.**
> **fortune machine:** YOU WILL FAIL. CONFIDENCE: 90%.
> **altmanta** *(calm)*: Ninety per cent. It will be better soon. Very soon.
> **mirage:** At a fair, most days are like yesterday. I could do that. I chose not to.
> **avatar:** What did it say about the day the sky cracked?
> **mirage** *(last line)*: Right most of the time. Is that the same as knowing?

### 10. The Giveaway App

**Station:** the Road, the Campfire Clearing. **Teaser:** "A mountain of berries at the Campfire. The slowest person there is ranked last."

**Hook.** `role:granny`, ranked last, is very slowly typing one request into a huge tablet: "I… need… a… ber—". Speedcheeta has sent four hundred. Mr. Beastie is giving a mountain of healing berries to "whoever needs them most", chosen by his new app. Usain Volt, injured, is ranked last but one. (With `dead:granny` and `arrived:granny`: Coach Achilles, who ran the Road looking for her twice, is ranked first because he types fast, and refuses: "I don't need berries. Give mine to the limping one." With `dead:granny` but no arrival yet, for example after a jump over Ch3, there is no Granny figure at all: the story plays with Usain Volt as the slow one, ranked last, and the off-stage rule holds.)

**Reasoning: Negotiate, then a choice.** Proxy variables: what the app counts stands in for need; errors go both ways. Beastie is proud of the rule, because he set it honestly. Interest 2, Patience 3. **Cares about:** Safety ("I want to help!"), Fame. **Can't stand:** Facts ("Boring!").

**Clues (any two show the app measures the wrong thing):**
- *Record:* the ranking: the top five send the most requests, and none of them is hurt.
- *Person:* Usain Volt, limping: "I'm hurt. I don't like asking. So I'm near the bottom."
- *Object:* the settings screen: GOAL = NEED. MEASURED BY: REQUESTS PER HOUR. Set by Beastie, carefully.

**Twist.** Nobody cheated, and nobody is to blame. Beastie chose the goal honestly, and the app works exactly as built. The measure is the problem: it counts how loudly people ask, not how much they need. Volt is too proud to ask; Granny is too slow to type. A measure is a choice, even an honest one.

**Resolution.** Persuade him that his fair-looking rule isn't fair; then choose the new rule, each with a visible trade-off: a medic checks need (fair, slow); a random draw (fair to all, ignores need); first come, first served (fast, favours the fast).

**Clock.** Danger: people who give up and leave (6). Progress: 4.

**Outcomes.** 1: a fair rule; Beastie films the fix, and it gets more views anyway; berries for all and a rare visitor; `berry`. 2: a fairer rule, but some berries are wasted; `berry`. 3: the old rule stays, but you get one berry to `role:granny`, or to Volt if nobody holds the role (`berry`); Feed +1. 4: the app gives every berry to Speedcheeta, the loudest asker, who eats them all and feels very silly; Feed +2.

**Ripple.** `berry`: an optional bark at Granny's card table on the restored Fair map after the finale (STORY.md §6): `role:granny`, "I had a berry. A very fair berry." (Achilles, if arrived: "Got a berry. Gave it to Volt. Felt good.")

**Inner voice.** Owlet: "Asking a lot isn't needing a lot. Different ruler. I spotted it." · Moth-kin: "Look who's limping. Then look who's typing." · Fox: "Picture being too proud to ask. Last place, forever." · Frogling: "The Sorting Room did this. Same mistake, smaller." · **Raven (blue, drains 1):** "Ask him: 'Needs it most.' Define 'most'."

**Sample lines.**
> **beastie:** Berries for whoever needs them most! The app decides! It's very scientific!
> **granny** *(typing)*: I… need… a… ber— Oh, it's gone to sleep.
> **usain volt:** I'm hurt. I don't like asking. So I'm near the bottom.
> **beastie:** I measured how much people ask. Not how much they need. …Those are different?
> **beastie** *(last line, filming)*: New rule. Fair one. …It's getting more views than the old one. Huh.

---

## 8. Flags these stories set

| Flag | Set by | Read by |
|---|---|---|
| `mirage-witness` | 1, tiers 1–2 | Ch3 trial drain (or a fortune line later) |
| `well-map` | 2, tiers 1–2 | Ch1 Gate drain (or a keepsake later) |
| `ladle` | 4, tiers 1–2 | Ch2 Hall drain (or a keepsake later) |
| `paradox-board` | 5, tiers 1–2 | Ch2 Hall: Smudge's cheer |
| `soldiers` | 7, tiers 1–2 | Ch4 Copy drain at the core (or the soldiers at the Gallery, late play) |
| `syllo-away` | 7, tier 4 | Gallery sign; story 1's sergeant-less soldiers; Syllo home, a bark on the restored Fair map |
| `fair-quote` | 8, tiers 1–2 | Ch3 trial drain (or the Café wall) |
| `honest-label` | 9, the honest sign | Mirage's bark at the Witness Tent, restored Fair map |
| `berry` | 10, tiers 1–3 | `role:granny`'s bark at the card table, restored Fair map |
| `side.<n>` | every story | tier 1–4, for the Feed and the teacher overview |

Side-story drains per boss: the Ch1 Gate, story 2 (1); the Ch2 pot, story 4 (1); the Ch3 trial, stories 1 and 8 (2); the Ch4 Copy, story 7 (1). All within the cap of 2.

## 8b. Script format

The full format, with every field, is the header comment of `data/script/side-stories.js`; that file holds one placeholder story marked `fixture: true` (never shown in the game) for the bench and the tests. In short:

- A story is `SS['<id>'] = { n, title, lesson, station, teaser, aside, colour, setup, clock, start, clues, twist, resolve, after, outcome, ripples, last }`. All text is ordinary script steps (SCRIPT-FORMAT.md): speakers, `e`, `t`, `u`, `when`, `only`, `inner`, choices, flags, `give`, `keepsake`.
- **Clock:** `{ label, size: 6 | 4, progress: 3 | 4, warn }`. Tiers, Feed and `side.<n>` are set by the engine. `{ clock: 'side', drain | tick | progress: 1 }` acts on this story's clock (write the blue option as a choice option with `only`, `voice: true` and `then: [{ clock: 'side', drain: 1 }]`).
- **Clues:** `spots: [{ id, kind: person | object | record, label, x, y, steps, card }]` placed in % on the station's background; `need: 2` (any two), or a list of ids, or several lists (story 4). Three free looks, then 1 notch a look.
- **Twist:** `{ steps, card }`; the card joins your clue cards (an Object round can ask you to present it).
- **Resolve:** `{ verb: 'deduce' | 'test' | 'object' | 'negotiate', … }`. Rounds of options (`{ t, ok, say, cost }`), with `why` (Deduce), `then` and `table` (Test), `line`, `press`, `present` and `name` (Object); a negotiation gives `interest`, `patience`, `askAt`, `cares`, `cantStand`, `listen` (mirror, feeling, sum), `args`, `special` (per species), `ask`, `replies`.
- **Outcome and ripples:** `outcome: { 1: [...], 2: [...], 3: [...], 4: [...] }`; `ripples: [{ flag, tiers, boss, drain, late }]` (`late` plays instead when the boss is already beaten or its cap of 2 is full).
- **Generated numbers:** `setup: rng => ({ … })`; any beat may be a function of those values (`v => [...]`).
- New steps for rewards: `{ visitor: '<creature>' }` (it is the loot of your next win until you own one) and `{ closed: '<node>', note }` (shut for one visit). `{role:granny}` in a note or card names whoever holds the role now.

**Decided** (engine): verbs are deterministic. Mistakes cost notches, never hearts. Progress already filled when the verb starts (a blue "+1 progress") strikes out one wrong option per notch, or adds 1 Interest in a negotiation. In a negotiation, listening costs no Patience and turns over one hidden tag; Patience running out costs a notch and then the talks restart; asking below `askAt` (default 4) costs a notch. Icon colours: lesson 1 green, 2 blue, 3 gold, 4 violet. A side story left halfway leaves no trace and starts again next time.

## 9. Change lists

### Round 4

- **Story 7 re-twisted** (author 5): the "everyone" was wooden. The front rank are Syllo's own toy soldiers, painted as Fair folk; the real recruits followed a crowd that was never there. The twist now turns on popularity itself, so 7 and 8 no longer share "the shouter wrote it himself". The object clue is the front rank that never blinks; the Raven's "Count them. It's eleven." sets it up.
- **Story 10 and the off-stage rule** (logic 6): Achilles appears only with `arrived:granny`; with `dead:granny` and no arrival, the story plays with no Granny figure and Volt as the slow one. "The eel" is gone ("the limping one", "Gave it to Volt"); the last line is plain.
- **Story 2:** Nudge digs "under the Gate, towards the cage" (no winch).
- **Story 1:** the hook says the trophy's stand at the Nut Stall was empty at the final; the Raven blue line is idiomatic.
- **Story 4:** the note adds "I have a plan."; the twist is now Granny planning her own rescue, not the soup (which the flyers already tell you).
- **Story 6:** Muskrat's admission is a spoken line.
- **Finale ripples (9, 10, 7 at tier 4)** are now optional barks on the restored Fair map after the finale, so the shelf stays short (STORY.md §6).
- **Tier bands** match STORY.md Appendix C (Danger 6: 0–1 / 2–3 / 4–5 / 6; Danger 4: 0–1 / 2 / 3 / 4).

### Round 3

- **"He did it himself" three times** → story 10 is re-twisted: nobody cheated, and the honest measure is wrong (a proxy is a choice). The two self-authored twists left, 7 (loneliness) and 8 (outrage for attention), teach different things.
- **Story 6 repeated Ch2's twist** → the liar is now generated, so no type of crew member is guilty, and the twist is that two worlds fit, so only a test can decide. The calm expert in the white coat is gone (Altmanta now appears only in story 9).
- **Mirage asked the moral twice** → story 1 ends on Corvina; explicit questions remain only in 5 and 9.
- **Logic items:**
  - Nudge's look in late play (2);
  - a late keepsake for `paradox-board` (5);
  - "Sequins quieter than usual" (7);
  - the soldiers' drain applies at the core, before the Copy's tier is set (7);
  - the lesson-3 trigger (the Plaza) is reached only through the Café and the Library once STORY.md's map change is made.

### Round 2

- **Deaths removed** from side stories (the editor's problem 11). The Mayor story is replaced by Muskrat's Launch (the author's "three danglings" note); Syllo's worst tier is now "missing", not dead.
- **"The feed did it" five times** → five twists now turn on a person's own choice or a plain cause: Siuuugull knows (2), no thief, common cause (3), Syllo wrote it (7), Tremendoodle wrote it (8), Beastie typed it (10). Nudge appears in one story only (2).
- **Stories 1 and 3 shared a twist** → story 3 is re-twisted (common cause, no thief); Keanu appears only in 3.
- **Two barricades** → story 8 is a refereed debate.
- **Lectures at the end** → each story ends on a character beat; questions remain only in 1, 5 and 9.
- **Teasers** → each has a different strange image; "shouting" is used nowhere.
- **Weak openings (9, 10)** → the smashed violin; Granny entering the circle.
- **Logic fixes:** the lesson-3 trigger is now the Plaza (required); story 4's clue claim is corrected; late-play fallbacks are added for every ripple; `role:` text for hosts whose roles were vacated.
- **Inner voices** → rewritten in each species' personality.
