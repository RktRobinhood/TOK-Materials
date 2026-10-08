# Rift of Reason — Side stories (pop-up one-shots)

Status: **outline for the writing gate** (8 October 2026). Ten one-shots: three each for lessons 1 and 2, two each for lessons 3 and 4. No script is written until both critics in `design/WRITING-CRITICS.md` score 8/10. The main story is in `design/STORY.md` (section numbers below refer to it); understudies are in `design/UNDERSTUDIES.md`. Research: `research/one-shots-and-stakes.md` (Part 5) and `research/draw-steel-and-disco-elysium.md` §3.1 (negotiation).

**What a side story is.** A 5–10 minute scene at a station the player **has already visited**, not part of the main plot. It practises the reasoning of the lesson that unlocked it, through **negotiation**, **deduction**, **argument-spotting** or a **test**. Each has a stakes clock, a fair twist and a reward. Some leave a small ripple in the main story: a ladle that drains a notch from Granny's pot, a witness for the Sundial's trial. None is ever needed to finish the game.

The house rules from STORY.md apply: lines under about 15 words; every line a joke, threat, reveal, choice or payoff; no rules in dialogue; no gendered words for the avatar; calm motion.

---

## 1. The map icon

**Look.** A speech bubble over the station marker, in the lesson's colour, that **slowly fades in and out** (about 3 seconds per cycle; no bounce, no shake). With Calm motion on, it is a still, bright bubble. Hover or long-press shows a one-line teaser.

**When one appears.** A story unlocks when **both** are true:
1. Its **lesson trigger** is met, so the skill has been taught:
   - Lesson 1 stories: the Troll Bridge is solved (Ch1 midpoint, so they can be done before the Gate).
   - Lesson 2 stories: the Village Square scene has played.
   - Lesson 3 stories: the Newsstand is solved.
   - Lesson 4 stories: the Prediction Hall is solved.
2. Its **station has been visited** before. A student who jumped in through the time rift and never visited the Fair does not see Fair stories until they walk there.

**How many.** At most **two** icons show at once. Others wait in a queue: stories of the current lesson first, then the oldest. When one is finished, the next in the queue appears.

**If ignored.** Nothing bad happens. Icons never expire, the Feed clock never ticks for an ignored story, and nobody is hurt off-screen. The only cost is the missed reward and ripple. Once per lesson, at a rest stop (Campfire, Garden, Café, Stairwell), the narrator may use its one aside to mention a waiting story ("Someone at the Well is shouting about luck. Probably nothing."). If a story's ripple targets a boss that is already won, the story still plays; its ripple becomes a keepsake or a reaction line (each story says which).

---

## 2. The template

Six beats, about 25 lines in total.

| Beat | Time | What happens |
|---|---|---|
| 1. **Strong start** | 30 s | Something is already happening. 2–3 voiced lines give the goal and show the clock. |
| 2. **Three clues** | 3–4 min | Three glowing hotspots on the station's existing background: a **person** (a statement), an **object** (a close-up), a **record** (a sign, list or log). Any order. **Any two are enough** to solve it (the generator checks every pair). Each becomes a card in the clue strip. |
| 3. **The twist** | 1 min | A new fact reframes the request. It adds a clue card and can change the goal. It is set up by at least one of the three clues. |
| 4. **Resolution** | 1–3 min | One verb: **Deduce** (pick the answer, then a one-click "Why?"), **Negotiate** (the Interest/Patience screen; listen before you ask), **Object** (a 3–4 line mini cross-examination: press or present a clue card), or **Test** (choose the test that could prove the claim wrong). |
| 5. **Outcome** | 30 s | The stakes clock decides the tier. A short scene for each tier. |
| 6. **Reward** | 30 s | XP and a charm at every tier; a bonus at tiers 1–2; any flag or ripple. The **host** closes with one question (not the narrator, whose lines stay as in STORY.md §3). |

**The stakes clock** (same widget as the bosses, STORY.md §4):
- **Danger** 6 notches (4 for the gentlest stories). **Progress** 3–4.
- Mistakes tick the clock instead of costing hearts. Each clue click after the first three costs 1 notch (time is counted in actions, never seconds). A wrong answer: 1 (2 if the button shows a flame).
- **Drains:** the story's blue option (one per story, rotating so each species gets two); a matching-colour creature on the team (once); spending a heart (once). Negotiation "listen" moves (mirror, name the feeling, sum up) drain 1, once each.
- **Tiers** by Danger when Progress fills: **Clean save** 0–2 · **Close call** 3–4 · **Saved at a price** 5 · **Too late, for now** 6.
- **Feed:** tier 1 −1, tier 3 +1, tier 4 +2 (STORY.md §4).
- **Ripples** into a boss clock: at most 2 notches from side stories per boss (STORY.md §4).

**Deaths in side stories** (STORY.md §5). Only two side stories can kill: **6, the Mayor** (minor; his station role goes dark) and **7, Sergeant Syllo** (his single death-risk moment; Private Dawdle steps in). Both follow the same rules as the main story: only the worst tier, only if the player has met him in every earlier scene, and only if "Characters can die" is on. Otherwise tier 4 plays as **Saved at a price**. Every other side story's worst tier is absurd, costly or embarrassing, never fatal. If a host has died earlier, the role's understudy hosts (UNDERSTUDIES.md); a dark-if-lost host's story does not unlock. **Understudies stay off stage** (STORY.md §5 rule 9): every understudy line below sits behind a `dead:` condition (Tally in story 1, Private Dawdle in story 7, Coach Achilles in story 10). Mr Gumleaf (story 5) is an ordinary character, present in every playthrough after the Town Hall.

**Inner voice.** Every species gets one hook per story (one line, at a clue or the twist). One of them is the **blue option**: a choice only that species sees, which drains 1 or adds 1 progress.

| Blue option | Stories |
|---|---|
| Owlet | 4, 8 |
| Moth-kin | 3, 9 |
| Fox | 5, 7 |
| Frogling | 2, 6 |
| Raven | 1, 10 |

---

## 3. The ten stories at a glance

| # | Title | Station | Lesson | Skill | Verb | Ripple | Can kill? |
|---|---|---|---|---|---|---|---|
| 1 | Siege at the Witness Tent | Fair: Witness Tent | 1 | confirmation bias | Negotiate | Mirage testifies at the Ch3 trial (drain 1) | no |
| 2 | The Wishing Well's Winning Streak | Road: Wishing Well | 1 | induction from a biased sample | Test | the well imp's tunnel map: drain 1 at the Ch1 Gate | no |
| 3 | Two Black Cats | Road: Campfire | 1 | induction vs deduction | Deduce | "masks" callback on arrival in Ch2 | no |
| 4 | The Three Cake Tins | Boolesbury: Bakery | 2 | truth values, "at most one is true" | Deduce | Granny's ladle: drain 1 at the Ch2 pot | no |
| 5 | The Silent Pupil | Boolesbury: Schoolhouse | 2 | liars and truth-tellers; silence is not evidence | Deduce | a twist clue for Ch2; reaction at the Hall | no |
| 6 | The Dangling Mayor | Boolesbury: Lever Bridge | 2 | truth tables with a liar | Deduce | the kitchen key: drain 1 at the Ch2 pot | **Mayor (dark)** |
| 7 | Syllo's Recruitment Drive | Fair: Syllogism Gallery | 3 | fallacies of popularity, false choice, authority | Object | toy soldiers: drain 1 at the Ch4 core | **Syllo (understudied)** |
| 8 | The Newsstand Sulk | Tomorrowton: Newsstand | 3 | strawman; persuading vs showing | Negotiate | the full quote: drain 1 at the Ch3 trial | no |
| 9 | The Fortune Machine | Fair: Witness Tent | 4 | base rates; right often is not knowing | Test + choice | the honest label: finale reaction | no |
| 10 | The Giveaway Algorithm | Road: Campfire | 4 | proxy variables; who pays for errors | Negotiate + choice | Granny's berry: finale reaction | no |

---

## 4. Lesson 1 stories

### 1. Siege at the Witness Tent

**Station:** the Fair, Madame Mirage's Witness Tent. **Unlocks:** lesson 1 trigger. **Teaser:** "Shouting from the Witness Tent. The door is tied shut."

**Hook.** Corvina the Card Sharp has barricaded herself in the tent with three fairgoers (Keanu Meows, Mr. Beansprout, a Speedcheeta cub) and Mirage's crystal ball. Everyone "knows" she stole the Fair Trophy: Speedcheeta's clip shows a black wing beside it. Sergeant Syllo's toy army is ready to charge with cork rifles at the end of a drum roll. (This is the teacher's example: a criminal with hostages at a Fair station, solved by talking.)

**Cast.** Corvina (inside), Madame Mirage, Sergeant Syllo and his toy soldiers, the three hostages. Sequins appears only as a note.

**Reasoning: Negotiate**, built on the crisis-negotiation "stairway". Each reply carries a tag: **Listen / Feel / Trust / Ask**. Asking her to come out before Trust is built costs a notch. Corvina starts at Interest 2, Patience 3. **Cares about:** Fairness ("Everyone blames the crow"), Profit ("What do I get?"). **Can't stand:** Experts ("Don't you lecture me").

**Clues (any two prove she did not take the trophy):**
- *Person:* Keanu, through the tent flap: "She was dealing cards to us all morning. Badly. She never left."
- *Object:* Speedcheeta's clip, zoomed out: the wing is black **and white**. A magpie's.
- *Record:* the Pattern Stall's polishing box: the trophy, and a note, "Polishing. Back soon. —S"

**The twist.** Professor Sequins "borrowed" the trophy before the crack, to polish it. The bird everyone suspected was the wrong black bird. Then, as the tent opens, Keanu kindly adds: "There is an ace in her sleeve. There is always an ace in her sleeve." Innocent of one claim, guilty of another: judge each claim on its own evidence.

If `dead:sequins`, Tally hands you the polishing box: "He always polished things. Without asking." The note now hurts.

**Clock.** Danger: Syllo's drum roll (6). Progress: Corvina's trust (4).

**Outcomes.**
1. **Clean save.** Everyone walks out. The trophy is returned. Corvina gives you a lure and plays fairer at her table. `mirage-witness`: at the Ch3 trial Mirage testifies through her crystal ball that she saw the sky take the shadow (drain 1).
2. **Close call.** Everyone out, but the tent is torn and Mirage's stall is closed for one visit. `mirage-witness` set.
3. **Saved at a price.** Syllo charges. Everyone is covered in fortune-teller glitter, and Corvina escapes out the back. Nobody is hurt; no witness. Feed +1.
4. **Too late, for now.** Corvina escapes with the crystal ball. Mirage reads fortunes in a teacup until story 9 (the ball turns up inside the Fortune Machine). Feed +2.

**Reward and ripple.** XP, a charm; the lure (tier 1); `mirage-witness` (tiers 1–2). If the Ch3 trial is already over, Mirage instead gives a free fortune: "You will win an argument. You already did."

**Inner-voice hooks.**
- Owlet: "Everyone 'knows'. Nobody checked. That isn't knowing."
- Moth-kin: "Look at the edge of the clip. There's more picture."
- Fox: "What if the black wing belongs to someone we like?"
- Frogling: "Keanu was in there all morning. He'd remember."
- Raven (**blue**, drains 1): "Tell her: 'I know how it feels when everyone assumes about black feathers.'"

**Sample lines.**
> **syllo:** Thirty seconds, recruit! Then my soldiers go in. Corks loaded!
> **corvina:** I didn't take it! But nobody believes a crow. Ever.
> **keanu:** She was dealing cards to us all morning. Badly.
> **keanu** *(as they leave)*: Also, there is an ace in her sleeve. There is always an ace.
> **mirage** *(closing question)*: Everyone saw it. Did anyone check it?

### 2. The Wishing Well's Winning Streak

**Station:** the Road, the Wishing Well. **Unlocks:** lesson 1 trigger. **Teaser:** "A queue at the Wishing Well. Someone is shouting SIUUU."

**Hook.** Siuuugull tells a queue of Fair folk that the well works: he wished before matches, and he scored. Chimpossible is livestreaming ("It's entirely possible!"). Mr. Beastie has just thrown in a giant cheque. Coins are vanishing down the well.

**Cast.** Siuuugull, Chimpossible, Mr. Beastie, a masked imp at the bottom of the well.

**Reasoning: Test** (induction from a one-sided sample). Then read a 2×2 table (numbers generated each play).

**Clues (any two show that wishing does nothing):**
- *Person:* Siuuugull's list: only the matches where he wished **and** scored.
- *Record:* the referee's full log: he scored in 6 of 10 matches after wishing, and in 6 of 10 when he forgot (generated, always equal or near-equal).
- *Object:* down the well, by lantern: a masked imp scooping coins into a sack.

**The twist.** The "well-keeper" is an imp collecting "engagement donations" for the Algorithm. In the sack is a tunnel map: it has been digging towards the Gate of Guards.

**Resolution.** "Which data would show whether wishing works?" Four buttons: his scoring matches / all matches he wished before / all matches, wished and not / what the stream's viewers think. Only the third is right. Then: "From the full table, does wishing help?" (No: the rate is the same.)

**Clock.** Danger: coins lost (6). Progress: Fair folk who stop wishing (3).

**Outcomes.**
1. **Clean save.** The coins come back. Siuuugull laughs it off and visits as a catchable creature. Chimpossible: "Jamie, pull up the full table." `well-map`: at the Ch1 Gate, you jam the imp's tunnel under the winch (drain 1).
2. **Close call.** Most coins back; `well-map` set.
3. **Saved at a price.** The imp escapes with half the coins and the map. Feed +1.
4. **Too late, for now.** The imp escapes with everything, cheque included. The well is empty; Beastie films a sad video about it. Feed +2.

**Reward and ripple.** XP, a charm; `well-map` (tiers 1–2). If the Gate is already won, the map becomes a keepsake ("a very bad map").

**Inner-voice hooks.**
- Owlet: "Wished and scored. What about wished and missed?"
- Moth-kin: "His list has no crosses on it. Lists always have crosses."
- Fox: "Picture the matches he didn't write down."
- Frogling (**blue**, +1 progress): "Ask him: remember the matches you forgot to wish?"
- Raven: "'It works.' Works compared to what?"

**Sample lines.**
> **siuuugull:** I wished. I scored. SIUUU! The well is magic!
> **chimpossible:** It's entirely possible. Jamie, pull that up. Who's Jamie?
> **beastie:** I threw in a cheque! The biggest wish ever!
> **imp** *(from the well)*: Thank you for your engagement.
> **chimpossible** *(closing question)*: If you only count the hits… is it a pattern?

### 3. Two Black Cats

**Station:** the Road, the Campfire Clearing. **Unlocks:** lesson 1 trigger (and the Campfire visited). **Teaser:** "Shouting at the Campfire. Someone has lost a pie."

**Hook.** Rawmsay's bake-off pie has vanished from the Campfire. He is furious and will close the Campfire kitchen for everyone. The crowd blames Keanu Meows: "Every time a pie goes missing, the black cat walks by."

**Cast.** Rawmsay, Keanu Meows, Sir David Attenbirdough (whispering behind a fern), a masked imp.

**Reasoning: Deduce.** A small elimination grid (3 suspects × 3 clues). Induction ("every time…") suggests; deduction settles it.

**Clues (any two clear Keanu and point to a second cat):**
- *Person:* Attenbirdough, whispering: "The black cat passed twice. A minute apart. Same direction. Remarkable."
- *Object:* paw prints in two sizes by the pie stand.
- *Record:* Keanu's signed scorecard: he was at Syllo's Gallery at noon, when the pie went.

**The twist.** There are two black cats. The second is an imp in a cat mask. Keanu's famous déjà vu was real. (This foreshadows Boolesbury, where imps wear faces.)

**Clock.** Danger: Rawmsay's temper (6). Progress: the case (3).

**Outcomes.**
1. **Clean save.** The pie is found, half-eaten. Rawmsay goes from fury to tenderness ("Come here, little one. Have the other half."). Keanu visits as a catchable creature. `cat-mask` set.
2. **Close call.** The pie is gone, but the kitchen stays open. `cat-mask` set.
3. **Saved at a price.** Keanu is cleared, but the kitchen closes for one visit. Feed +1.
4. **Too late, for now.** Keanu is wrongly sent away down the Road. You meet him later at the Rift Pass, where he forgives you, because he is famously nice. A gentle sting: punishing on a pattern hurts the innocent. Feed +2.

**Reward and ripple.** XP, a charm; Keanu (tier 1). `cat-mask`: on arrival in Ch2, the avatar's voice adds one line in its species' style (Owlet: "Masks. Like the cat at the campfire. Check every face.").

**Inner-voice hooks.**
- Owlet: "'Every time' is a pattern. A pattern isn't a proof."
- Moth-kin (**blue**, drains 1): "Point at the tails. One of them is painted on."
- Fox: "What if there are two of him?"
- Frogling: "Every time a pie went, a cat walked by. Every time a cat walked by… was there a pie?"
- Raven: "'The black cat.' Which black cat?"

**Sample lines.**
> **rawmsay:** WHERE IS MY PIE? It was PERFECT. It was barely RAW.
> **crowd:** Every time a pie goes missing, the black cat walks by!
> **attenbirdough** *(whispering)*: The black cat passed twice. Same direction. Remarkable.
> **keanu:** I have a strange feeling I've been accused before.
> **rawmsay** *(closing question)*: Seeing it every time… is that knowing why?

---

## 5. Lesson 2 stories

### 4. The Three Cake Tins

**Station:** Boolesbury, the Bakery. **Unlocks:** lesson 2 trigger. **Teaser:** "Smoke from the Bakery. Mrs Crumb is shouting at three tins."

**Hook.** Mrs Crumb baked the cake for tonight's Feast of Laws and hid it in one of three tins. Imps have lit the ovens under all three. One tin holds the cake, one a custard trap, one the Mayor's itching powder. Open the wrong one and it goes off.

**Cast.** Mrs Crumb, the imps (offstage); Granny (by note only).

**Reasoning: Deduce**, a three-row truth table, using a small version of the Ch2 table tool. "Suppose the cake is in A. Which labels are true? Is that allowed?" (A public-domain puzzle shape, the caskets, in a Smullyan style.)

**Clues (the generator checks that any two leave exactly one tin):**
- *Record:* the three labels (generated, for example A: "The cake is here." B: "The cake is not here." C: "The cake is not in A.").
- *Person:* Mrs Crumb: "I wrote them so that at most one label tells the truth."
- *Object:* the oven door: one tin is dented from a swap. Mrs Crumb never dents her cake tin.

**The twist.** Inside the cake: a note in Granny's handwriting, slipped into the flour sack Mrs Crumb took up to the Town Hall kitchen this morning: "Bring a ladle. A big one." The feast is the soup, and the soup is Granny. This also answers the Ch1 crackle ("Bring a lad—").

**Clock.** Danger: oven heat (6; a wrong tin costs 2). Progress: 3.

**Outcomes.**
1. **Clean save.** The cake is saved, the note found, and Mrs Crumb hands you her biggest ladle. `ladle`: at the Town Hall you bail the pot (drain 1). Plus a slice of cake (healing).
2. **Close call.** The cake is singed; note and ladle found. `ladle` set.
3. **Saved at a price.** The custard trap goes off. You are "Custardy" (cosmetic) for one visit. The note is found, but the ladle is buried in custard. Feed +1.
4. **Too late, for now.** The cake burns, and the note with it. Mrs Crumb bakes another, without a message. Feed +2.

**Reward and ripple.** XP, a charm, `ladle`. If the Town Hall is already won, the note becomes a keepsake. With Granny alive: "Bring a ladle. A big one." Mrs Crumb: "You brought yourself. That'll do." With `dead:granny`: Mrs Crumb only says "Oh," and gives you the ladle to keep.

**Inner-voice hooks.**
- Owlet (**blue**, +1 progress): "Suppose each tin in turn. Count the true labels. Only one world fits."
- Moth-kin: "That tin is dented. She'd never dent her own."
- Fox: "What if the label on the cake tin is the lie?"
- Frogling: "'Bring a lad—.' Granny's last call. Now I remember."
- Raven: "'At most one' allows zero. Remember that."

**Sample lines.**
> **baker:** Three tins! One cake! And imps lighting fires under my livelihood!
> **baker:** I wrote the labels. At most one tells the truth. I'm very secure.
> **avatar:** That is the least secure thing I've ever heard.
> **granny** *(the note, read aloud)*: "Bring a ladle. A big one."
> **baker** *(closing question)*: Every label was true or false. How did you know which?

### 5. The Silent Pupil

**Station:** Boolesbury, the Schoolhouse. **Unlocks:** lesson 2 trigger. **Teaser:** "Detention for everyone. Someone wrote on the board."

**Hook.** Someone chalked THIS SENTENCE IS FALSE on the blackboard. Miss Quill is furious, in a calm, frightening way: "It is neither one nor zero. Detention for all until someone confesses." Four pupils from her "visitor class": Astrophysicat, Khaby Llame, Billie Eelish, Mr. Beansprout.

After the Town Hall (`away:schoolteacher`), the same story plays with **Mr Gumleaf**, who is delighted: "Someone wrote this. Miss Quill would have been furious. I think it's lovely. But the rules say find them."

**Cast.** Miss Quill (or Mr Gumleaf), the four pupils, Smudge the Sweep.

**Reasoning: Deduce.** Liars and truth-tellers: whoever wrote it lies, everyone else tells the truth (generated statements). Khaby says nothing but **points** (a gesture, not a statement). Beansprout makes **no statement at all**: he is neither a liar nor proven honest. Billie whispers; you hear half unless you click "listen closer" (costs an action).

**Clues (any two show the writer is not a pupil):**
- *Person:* the pupils' statements (generated). When filled in, **no row** makes any one pupil the writer.
- *Object:* chalk dust, on the chimney grate, not on any desk.
- *Record:* the seating chart: every pupil was seated, facing the board, when Quill turned round.

**The twist.** The table's answer is "none of them". The truth table can tell you the answer is **not among your options**. The writer is Smudge, hiding in the chimney. He heard the Mayor say the sentence in the Square, saw Miss Quill flinch, and wanted to see her do it again. (Before the Town Hall this is a fair clue to the Ch2 twist: why is a teacher scared of a sentence?)

**Clock.** Danger: the detention (each wrong accusation adds "ten more minutes"; 6). Progress: 3.

**Outcomes.**
1. **Clean save.** The class is freed and Smudge is praised (by Gumleaf) or quietly shielded (from Quill). A Reason-colour creature visits. `paradox-board` set.
2. **Close call.** Freed, after writing "I will not write paradoxes" fifty times. `paradox-board` set.
3. **Saved at a price.** A pupil is wrongly blamed first, then cleared. Feed +1.
4. **Too late, for now.** The whole class gets detention. Beansprout holds a silent protest, which nobody can grade. Feed +2.

**Reward and ripple.** XP, a charm, a Reason visitor (tier 1). `paradox-board`: at the Town Hall climax, Smudge cheers from the gallery ("My sentence! From the board!"). This is a reaction only, with no drain (the pot's side-story cap is taken by stories 4 and 6).

**Inner-voice hooks.**
- Owlet: "If no row works, my list of suspects is wrong."
- Moth-kin: "The dust is on the grate. Not on any desk."
- Fox (**blue**, +1 progress): "What if it's nobody in this room?"
- Frogling: "The Mayor says that sentence. And she flinched. I remember."
- Raven: "Silence isn't a statement. You can't call it true or false."

**Sample lines.**
> **quill:** It is neither one nor zero. Detention for all until someone confesses.
> **khaby:** *(says nothing; points at the chimney)*
> **avatar:** Beansprout said nothing. That proves nothing. Either way.
> **sweep** *(from the chimney)*: I only wanted to see her flinch again.
> **quill** *(closing question)*: Silence is not a statement. I cannot grade it. Can you?

### 6. The Dangling Mayor

**Station:** Boolesbury, the Lever Bridge. **Unlocks:** lesson 2 trigger (so the Square has played, and the player has met the Mayor). **Teaser:** "The drawbridge is half up. Something in a top hat is hanging from it."

**Hook.** Mayor Plumage dangles from the half-raised drawbridge by his mayoral chain, a sack of loaves in his beak. The imps have rigged the levers. Below him, the river is fast. Every wrong setting dips him in.

**Cast.** Mayor Plumage, Old Wick, Mrs Crumb (who would quite like him dunked), one "villager" who is an imp in a mask.

**Reasoning: Deduce**, truth tables with a liar. Three helpers each say what one lever does (AND/OR/NOT wiring on the switchboard). One helper is an imp and always lies. Find the liar, then set the levers that lower the bridge.

**Clues (any two expose the imp):**
- *Person:* Old Wick and Mrs Crumb agree about lever 2. The third helper says the opposite.
- *Object:* the third helper's boots are dry. Everyone who works the bridge has wet boots.
- *Record:* the bridge's brass plate: the wiring diagram, half scratched off, enough to test one helper's claim.

**The twist.** The Mayor was not escaping with loot. He was running away from the feast: "Something in that kitchen talks in ones and zeros." The loud suspect is scared, not scheming. In his pocket is the Town Hall kitchen key.

**Clock.** Danger: dunks (6). Progress: the bridge lowered (3).

**Outcomes.**
1. **Clean save.** He lands on the bridge, dry, and gives the loaves back to Mrs Crumb. He hands you the key: `kitchen-key` (at the Town Hall you jam the winch; drain 1).
2. **Close call.** He lands soaked and sulking. `kitchen-key` set.
3. **Saved at a price.** A big dunk. He is fished out downstream, safe; the key is lost in the river. Feed +1.
4. **Too late, for now (lethal if armed, STORY.md §5).** The chain snaps. A splash. Then the river is very quiet. His hat floats back to the bank. `dead:mayor`, Feed +2. He is a minor role: no understudy. His three Town Hall lines are skipped, and a statue appears in the Square, "mostly of his hat". If not armed (switch off), tier 4 plays as tier 3.

**Reward and ripple.** XP, a charm, `kitchen-key`. If the Town Hall is already won, the key opens a cupboard there with one charm in it.

**Inner-voice hooks.**
- Owlet: "Two agree, one disagrees. If only one lies, I know who."
- Moth-kin: "Dry boots. Nobody works this bridge with dry boots."
- Fox: "What if he's not escaping? What if he's escaping *from* something?"
- Frogling (**blue**, +1 progress): "Remember Mr Tock's plaques? Same AND. Same NOT."
- Raven: "'Ones and zeros.' He said it like a name."

**Sample lines.**
> **mayor:** Nothing is wrong! I am simply… hanging! Mayors do this!
> **baker:** Leave him a minute. He owes me eleven loaves.
> **mayor** *(dunked)*: Glub. Still nothing wrong. Glub.
> **mayor:** Something in that kitchen talks in ones and zeros. I don't like it.
> **wick** *(closing question)*: The loud one wasn't the bad one. How many times was the loud one bad, before?

---

## 6. Lesson 3 stories

### 7. Syllo's Recruitment Drive

**Station:** the Fair, Sergeant Syllo's Syllogism Gallery. **Unlocks:** lesson 3 trigger (and the Gallery visited). **Teaser:** "A drum at the Fair. Everyone is marching."

**Hook.** Sergeant Syllo has drafted half the Fair into his toy army. At the end of the drum roll they will march into the crack over the Fair, "to fight the Algorithm". Nobody who walks into the feed comes back the same.

**Cast.** Sergeant Syllo, the recruits (Usain Volt, The Rockodile, Mr. Beansprout and Fair folk), Madame Mirage watching.

**Reasoning: Object**, an argument duel. Each recruit states a reason they joined; you pick the reply that answers that **kind** of bad argument. You learn the replies by facing the recruits, then Syllo rewords the same tricks and you must recognise them by meaning, not wording.

**Clues (any two show the drive is built on fallacies):**
- *Record:* his posters: "EVERYONE'S JOINING!" (popularity); "MARCH OR BE A COWARD!" (false choice); "THE ROCKODILE SAYS SO!" (authority, with the eyebrow).
- *Person:* Usain Volt: "I joined because everyone else did."
- *Object:* Syllo's own recruitment letter. It came from the feed.

**The twist.** Syllo was recruited himself, by the feed's ads, with these exact tricks. The Fair has been quiet (Granny gone, Sequins changed or gone), and he is lonely. The last round is not a reply to a fallacy. It is a **sound** argument he can accept: a real reason to stay.

**Clock.** Danger: the drum (6). Progress: recruits freed (4).

**Outcomes.**
1. **Clean save.** Everyone stays. Syllo opens a "fallacy range" at the Gallery (an argument card for negotiations). `soldiers`: his toy army guards the Summit Rift in Ch4 (drain 1 on the Copy's clock).
2. **Close call.** Everyone stays, but Syllo sulks; his trainer match is grumpier. `soldiers` set.
3. **Saved at a price.** Half the recruits march in and come back loud for a while (feed-voiced lines at the Fair until the finale). No soldiers. Feed +1.
4. **Too late, for now (lethal if armed: Syllo's single death-risk moment).** Syllo leads the way into the crack. The recruits stop at the edge. Only his drum rolls back out. `dead:syllo`, Feed +2. **Private Dawdle** takes the Gallery and the practice challenge (UNDERSTUDIES.md); memorial drop-in at the Gallery; keepsake **Syllo's Drum**. The `soldiers` ripple is lost. If not armed (not met in every earlier scene, or the switch is off), tier 4 plays as tier 3.

**Reward and ripple.** XP, a charm, the argument card (tier 1), `soldiers` (tiers 1–2). If the core is already won, the soldiers instead line up for the finale parade (a reaction).

**Inner-voice hooks.**
- Owlet: "'March or be a coward.' Those aren't the only two options."
- Moth-kin: "Look at the letter's stamp. A tiny eye."
- Fox (**blue**, drains 1): "Tell him: picture the Fair without its Sergeant."
- Frogling: "Last time a crowd all agreed, it was the crack. Remember?"
- Raven: "'Everyone.' Count them. It's eleven."

**Sample lines.**
> **syllo:** RECRUITS! Everyone's joining! Are you everyone, or are you NOBODY?
> **usain volt:** I joined because everyone else did. Is that… not a reason?
> **avatar:** The Rockodile says so. Is the Rockodile a sergeant?
> **syllo** *(quietly)*: The Fair's been so quiet. The letter said I'd matter.
> **syllo** *(closing question)*: A loud argument and a good argument. How do you tell them apart, recruit?

### 8. The Newsstand Sulk

**Station:** Tomorrowton, the Newsstand. **Unlocks:** lesson 3 trigger. **Teaser:** "The Newsstand is locked from inside. A poodle is shouting."

**Hook.** Tremendoodle has locked himself in the Newsstand with the editor, Sir David Attenbirdough. He will not come out until the paper calls him "the most tremendous creature ever". A crowd is filming.

**Cast.** Tremendoodle, Sir David Attenbirdough, a paper-seller imp, Pip.

**Reasoning: Negotiate** (the Draw Steel-lite screen). Tremendoodle starts at Interest 2, Patience 2. **Cares about:** Fame, Fairness ("They are so unfair to me"). **Can't stand:** Facts ("fact-checkers are boring"). Cards carry **sound** or **slick** badges; flattery (slick) works on him, and so does showing him the original article (sound). The result screen asks: "You persuaded him. Was your argument good?"

**Clues (any two show the headline is a strawman):**
- *Record:* the original article: "Tremendoodle's speech was long."
- *Object:* the headline he is angry about: "TREMENDOODLE SAYS SPEECHES ARE A DISASTER." He never said that.
- *Person:* the paper-seller imp: "The auto-headline machine shortens everything. Short gets clicks."

**The twist.** The editor did not write the headline. The Algorithm's auto-headline machine did, the same machine that printed "FRAUD ADMITS: 'I GUESS'" (STORY.md Ch3). Hostage-taker and hostage are angry at the same thing.

**Clock.** Danger: the crowd (6). Progress: his trust (4).

**Outcomes.**
1. **Clean save.** Both come out. The paper prints a fair correction, and Attenbirdough reprints the Sundial's whole quote in context: "On cloudy days I guess." `fair-quote`: at the Ch3 trial the jury reads it (drain 1). Tremendoodle gives you a nickname title (cosmetic).
2. **Close call.** They come out, but only because the paper printed his boast. Persuaded, not shown: the result screen notes it. Attenbirdough reprints the quote anyway. `fair-quote` set.
3. **Saved at a price.** Court ushers break the door. Papers everywhere; the Newsstand is closed for one visit. Feed +1.
4. **Too late, for now.** He leaves on a news drone, claiming victory. The strawman headline loops on every Ch3 screen (cosmetic) until the trial ends. Feed +2.

**Reward and ripple.** XP, a charm, the title (tier 1), `fair-quote` (tiers 1–2). If the trial is already over, Attenbirdough frames the quote for the Café wall instead.

**Inner-voice hooks.**
- Owlet (**blue**, +1 progress): "Spell it out. The article said 'long'. The headline said 'disaster'."
- Moth-kin: "The headline font is the screens' font. Not the paper's."
- Fox: "Picture him reading the real article. Would he even be angry?"
- Frogling: "'I guess.' Same machine, same trick. I remember that headline."
- Raven: "'Says.' He never said it. The headline did."

**Sample lines.**
> **tremendoodle:** I am not coming out! Not until they say "most tremendous"! Very unfair!
> **attenbirdough** *(whispering)*: Here we see the poodle, in its natural habitat. Sulking.
> **imp:** The machine shortens everything. Short gets clicks.
> **tremendoodle:** "Long"? They said my speech was "long"? …That's fair, actually.
> **attenbirdough** *(closing question)*: Did you answer what he said, or what the headline said he said?

---

## 7. Lesson 4 stories

### 9. The Fortune Machine

**Station:** the Fair, the Witness Tent. **Unlocks:** lesson 4 trigger. **Teaser:** "A shiny machine in the Witness Tent. 90% ACCURATE, says the sign."

**Hook.** Altmanta has replaced Madame Mirage with a shiny Fortune Machine, "90% accurate!". Fairgoers are giving up their hobbies because it says they will fail. Mirage is out of work, reading tea leaves on the step. (If story 1 ended at tier 4, the machine's glass dome is her stolen crystal ball. Corvina sold it on.)

**Cast.** Altmanta, Madame Mirage, the Fortune Machine, fairgoers.

**Reasoning: Test, then a choice.** Base rates: if 90% of Fair days are like the day before, "same as yesterday" is 90% right while knowing nothing.

**Clues (any two show it knows nothing):**
- *Record:* the machine's log: 90 right out of 100.
- *Object:* inside the panel, a single dial: PREDICT: SAME AS YESTERDAY.
- *Person:* Mirage: "At a fair, most days are like the day before. I could do that. I chose not to."

**The twist.** It has never once been right on a day when something **changed**, the only days that matter. On the day of the crack it predicted "a normal fair". Altmanta calmly promises it will "get better soon".

**Resolution.** Pick the test that separates foresight from guessing the usual: ask it about a day that is different. Then choose: switch it off / label it honestly ("I always guess the usual") / leave it running. The clock decides the tier; the choice decides the ending scene.

**Clock.** Danger: fairgoers who give up (6). Progress: 4.

**Outcomes.**
1. **Clean save.** Fairgoers take up their hobbies again. Mirage gets her tent back (and her crystal ball, if it was lost).
2. **Close call.** Most come back; a few keep believing it.
3. **Saved at a price.** Half the Fair still believes it. Mirage shares the tent, grumpily. Feed +1.
4. **Too late, for now.** It predicts you will lose your next card battle, and the crowd boos you (cosmetic) until you win one. Feed +2.

Choice endings: **labelled** sets `honest-label` (in the finale, `role:sequins`, painting IT GUESSES: "Mirage did the same to Altmanta's box. Labels are catching on."); **switched off**: Altmanta glides away, disappointed but calm; **left running**: it keeps predicting "same as yesterday" for the rest of the game, on a sign by the tent.

**Inner-voice hooks.**
- Owlet: "Right 90 times. Because 90 days were the same. That proves nothing."
- Moth-kin (**blue**, drains 1): "Open the panel. Look. One dial. That's all it is."
- Fox: "Ask it about a strange day. Watch what happens."
- Frogling: "The day of the crack. What did it say about that day?"
- Raven: "'Accurate.' Accurate at what?"

**Sample lines.**
> **altmanta** *(calm)*: The machine is 90% accurate. It will be better soon. Very soon.
> **mirage:** At a fair, most days are like yesterday. I could do that. I chose not to.
> **fortune machine:** TODAY WILL BE LIKE YESTERDAY. CONFIDENCE: 90%.
> **avatar:** What happened on the day of the crack?
> **mirage** *(closing question)*: Right most of the time. Is that the same as knowing?

### 10. The Giveaway Algorithm

**Station:** the Road, the Campfire Clearing. **Unlocks:** lesson 4 trigger. **Teaser:** "A mountain of berries at the Campfire. Nobody can reach them."

**Hook.** Mr. Beastie is giving a mountain of healing berries to "whoever needs them most", chosen by his new app. The app ranks people by followers and by time spent in his "last to leave the circle" challenge, so villagers are stuck in the circle. `role:granny`, walking home very slowly, cannot keep up. Usain Volt, injured, with no followers, is ranked last. (If `dead:granny`, it is Coach Achilles, ranked first because he is fast, who refuses: "I don't need berries. I need a nap. Give mine to the eel.")

**Cast.** Mr. Beastie, `role:granny`, Usain Volt, villagers.

**Reasoning: Negotiate, then a choice.** Proxy variables: followers stand in for need. Errors both ways: berries to someone who does not need them, none to someone who does. Beastie starts at Interest 3, Patience 3. **Cares about:** Safety ("I want to help!"), Fame. **Can't stand:** Facts ("Boring!").

**Clues (any two show the app is measuring the wrong thing):**
- *Record:* the ranking list: top five all have huge follower counts; none is hurt.
- *Person:* Usain Volt, limping: "I'm hurt. I'm last. I don't post much."
- *Object:* the app's settings screen: GOAL = VIEWS.

**The twist.** Beastie truly wants to help. The feed set the app's goal to views, and he never checked. He is torn between helping and the views.

**Resolution.** Persuade him; then choose the new rule, each with a visible trade-off: a medic checks need (fair, but slow); a random draw (fair to everyone, ignores need); first come, first served (fast, favours the fast).

**Clock.** Danger: villagers who give up and leave (6). Progress: Beastie convinced (4).

**Outcomes.**
1. **Clean save.** A fair rule. Beastie films the fix, and the video gets more views anyway (the comic payoff). Berries for all, a rare visitor, and `berry`: in the finale `role:granny` says "I had a berry. A very fair berry."
2. **Close call.** A fairer rule, but some berries are wasted on the circle crowd. `berry` set.
3. **Saved at a price.** The old rule stays, but you get one berry to `role:granny`. Feed +1.
4. **Too late, for now.** The app gives every berry to Speedcheeta, who eats them all and feels very silly. Feed +2.

**Inner-voice hooks.**
- Owlet: "Followers measure fame. The goal was need. Wrong measure."
- Moth-kin: "Look who's limping. Then look at the list."
- Fox: "Picture being last on this list. With a hurt leg."
- Frogling: "The Sorting Room did this too. Same mistake, smaller."
- Raven (**blue**, drains 1): "Ask him: 'Needs it most.' Define 'most'."

**Sample lines.**
> **beastie:** Berries for whoever needs them most! The app decides! It's very scientific!
> **granny:** I'm ninety-three, dear. I am always last to leave a circle. And to enter it.
> **usain volt:** I'm hurt. I'm last. I don't post much.
> **beastie:** It says GOAL equals VIEWS. …I didn't type that.
> **beastie** *(closing question)*: The rule was exact. Was it fair?

---

## 8. Flags these stories set

| Flag | Set by | Used by |
|---|---|---|
| `mirage-witness` | 1, tiers 1–2 | Ch3 trial drain (or a fortune line if the trial is over) |
| `well-map` | 2, tiers 1–2 | Ch1 Gate drain (or a keepsake) |
| `cat-mask` | 3, tiers 1–2 | Ch2 arrival inner-voice line |
| `ladle` | 4, tiers 1–2 | Ch2 Town Hall drain (or a keepsake) |
| `paradox-board` | 5, tiers 1–2 | Ch2 Town Hall: Smudge's cheer |
| `kitchen-key` | 6, tiers 1–2 | Ch2 Town Hall drain (or a cupboard charm) |
| `dead:mayor` | 6, tier 4 if armed | STORY.md §5: Hall lines skipped, Square statue |
| `soldiers` | 7, tiers 1–2 | Ch4 core drain (or the finale parade) |
| `dead:syllo` | 7, tier 4 if armed | STORY.md §5: Private Dawdle, memorial, Syllo's Drum |
| `fair-quote` | 8, tiers 1–2 | Ch3 trial drain (or a framed quote at the Café) |
| `honest-label` | 9, "label it" choice | finale line at the Pattern Stall shelf |
| `berry` | 10, tiers 1–2 (tier 3 gives the berry too) | finale line from `role:granny` |
| `side.<n>` | every story | 1–4 tier, for the Feed clock and the teacher overview |

Side-story drains per boss: the Ch1 Gate has one possible (2); the Ch2 pot two (4, 6; 5 is a reaction only); the Ch3 trial two (1, 8); the Ch4 core one (7). All are within the cap of 2.
