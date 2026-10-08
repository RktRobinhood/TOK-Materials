# Writing baseline, 8 October 2026: Critic 2 (Author and style)

Baseline review of the story as it ships today, before any avatar writing (inner voice, avatar dialogue, talk encounters). Rubric: `design/WRITING-CRITICS.md`, Critic 2. Scale: 10 = excellent published game writing, 7 = competent but forgettable, 5 = flat.

Files read: `data/script/lesson1.js`–`lesson4.js`, `data/map.js` (node order, scripts, hosts, goals, teasers, trainer intros), `js/screens/encounter.js` (what plays when), `design/DESIGN.md`, `ROSTER.md`, `CH2.md`, `CH3.md`, `CH4.md`, `AVATARS.md` (inner-voice spec).

Traced paths: the Owlet girl and the Frogling boy, both with `brave = true` and `brave = false`. Only one line differs between species or genders today: the avatar is a name and a portrait. The only story flag that gets used later is `brave`, which comes back once, at the campfire (`lesson1.js:139`).

How the text reaches the player, which matters for the score. On a first visit to a puzzle node the player sees the node script (`n.script`), then the station intro (`station.*.intro`, two more lines, often from a different host). The goal line (`map.js` `goal:`) also sits on screen. When the player wins, the `.win` script plays. So most first visits give three to five lines of setup before any play.

---

## Scores

**Overall: 5 / 10.** The jokes are better than flat, but the structure is weak. There are good lines, but no story drives them.

| Chapter | Score | One-line verdict |
|---|---|---|
| Prologue: the Fair | 6 | A charming opening voice (Sundial, Granny, Syllo). The call to action costs the player nothing. |
| Ch1: the Road | 4.5 | One good scene (Muskrat's bridge). Otherwise one narrator signpost per node, and a boss with no climax. |
| Ch2: Boolesbury | 6 | The best shape: a Mayor set up, then a reveal, plus the liar paradox. The twist is the most obvious suspect, though. |
| Ch3: Tomorrowton | 4 | Pip is a tutorial with wings. The trial has no defendant, no stakes and no turn. |
| Ch4 + finale | 5 | The core reveal ("May I… stay small for a while?") is the best moment in the game. The rest is admin and morals. |

By criterion (whole game): not boring 4 · arc 4 · twists 3 · voice 6 · readable 7 · game fit 6.

What already works and should be protected:
- The Sundial's opening: "On cloudy days I guess." (`lesson1.js:34`)
- Granny: "Pockets win prizes." (`:36`) and "Take these. And your brain. Mostly your brain." (`:88`)
- Syllo's lobster trumpet (`:71`) and "the guards who are trolls" (`:92`).
- Muskrat's bridge "reaches Mars. Next year." / "It is a very small bridge." (`:120–121`): the best exchange in chapter 1.
- The Mayor's "here is a list of everything I am not hiding" (`lesson2.js:122`).
- Fin: "That was a statistical fluke. Which, I suppose, is still a loss." (`lesson3.js:89`)
- The Oracle: "All correct. Probably." / "You… checked. Nobody checks." (`lesson4.js:64, 67`)
- The Core: "May I… stay small for a while?" (`lesson4.js:87`), and the nut-stall callback (`:98`).

---

## The whole arc in one paragraph

The game follows Chrono Trigger's beats on paper (fair → crack in the sky → journey through eras), but it skips the beat that makes Chrono Trigger's fair work: **something personal is lost**. Granny asks for "someone who thinks", and nothing is taken from the player, so there is no reason to go except the map. From there the arc stays flat. Each chapter is a list of stations, and each opens with an instruction and closes with a narrator moral, so ch1 and ch3 have no rising risk at all. The Algorithm appears once or twice per chapter with the same joke ("…RECALCULATING", five times), never escalates and never threatens anyone the player cares about. Its central idea (it predicts *you*) is never used against the player, so the finale reveal has nothing to overturn.

There are two climaxes with real shape. One is the Town Hall (the Mayor unmasked, and the liar's sentence left open). The other is the Core (vast colossus → tiny frightened cloud). Both are telegraphed: the avatar names the Mayor as suspicious on first meeting (`lesson2.js:50`), and the Core's map teaser gives away the reveal ("Or something small pretending to be vast", `map.js:435`). Ch1 and Ch3 have no twist. Time travel is only scenery: no era changes another, nothing from the past comes back, and the "Previously…" logic has no story behind it. Story choices barely matter: one flag, one echo. The finale sums up the lesson in the narrator's voice ("Here is the secret…") instead of paying off anything the player did.

---

## The biggest problems

### 1. The call to action has no stakes, so the journey has no point. `lesson1.js:75–93`
**Problem.** The crack appears and the visitors turn rabid, but nothing happens to Granny, the Sundial or the player. Granny's "Someone has to follow that crack" is a request, not a loss. The rewards that follow are 3 charms and a tonic.
**Why it matters.** The rubric asks that "something can be lost". Without a personal loss there is no risk to build, and no payoff to earn in the finale. Chrono Trigger's fair works because Marle vanishes in front of you.
**Direction.** Take something small, funny and personal at the crack, and give it back piece by piece. The Sundial is perfect for this: it *is* time. If the Algorithm steals its shadow, the Sundial can't keep the eras apart, which explains the rifts. Each chapter boss returns one hour-mark of the shadow, and the finale's "Tick. Tock." means something. (Rewrite below.)

### 2. Every win ends in a narrator lecture. About 20 lines.
`lesson1.js:72, 126, 147, 157–158` · `lesson2.js:35, 43, 82, 118, 131` · `lesson3.js:60, 75, 110` · `lesson4.js:40, 51, 59–60, 68, 100`
**Problem.** After almost every puzzle, the Sundial explains what the student just learned, in textbook voice. Examples: "Valid means the conclusion follows from the premises…" (`lesson1.js:72`); "These finite circuits have truth tables. A complete table checks every possible true/false input setting." (`lesson2.js:82`); "Your model matched within the allowed margin." (`lesson4.js:51`).
**Why it matters.** This is the main reason the text reads as boring. A reward moment turns into a worksheet. The ROSTER gives the Sundial "one-line TOK provocation **after each boss**", but it now speaks after every puzzle, so its boss provocations lose their weight. It also breaks "nobody lectures".
**Direction.** Cut most `.win` narrator lines. Let the *loser* react instead (a caricature, a villager), with a joke that carries the idea. Keep the Sundial for boss wins only: one line, a question, not a summary.

### 3. The station intro layer is a second, duller script on top of the first. `lesson1.js:167–182`, `lesson2.js:135–152`, `lesson3.js:113–126`, `lesson4.js:107–118`
**Problem.** There are 60 lines in one interchangeable voice: "Read the task", "Check the task", "test what changes", "Check the result in each case, rather than guess". They play straight after the node's own scene, so the scene's best line is followed by a lecture. For example, Muskrat's joke at the bridge is followed by **Sergeant Syllo**, who isn't there, saying "The bridge demands a drawing. Check its rule…" (`:177`). Other host problems: Sequins hosts the Wishing Well (`:175`). The **Oracle** hosts all of chapter 4 (`lesson4.js:107–117`) *before* the player meets it at its own chamber, which spoils its entrance. **Granny** hosts the Core (`:117`), though she is never in the tower. At the Pattern Stall, Sequins says the same thing twice (`:49–50` then `:167`).
**Why it matters.** It doubles the reading before play, flattens every character into one voice, and breaks continuity. Non-native readers spend their attention on repeats.
**Direction.** Merge each node's intro into its scene: one in-character line with the goal inside it. Keep the goal panel for the dry instruction. The host should be the character who is actually there. In ch4 that means the Algorithm itself (taunting) or no host at all.

### 4. No real twists. The two planned ones are telegraphed. `lesson2.js:47–50`, `lesson4.js:78–87`, `map.js:435`, `lesson3.js:66–68, 105–107`
**Problem.**
- Ch2: the Mayor is the first loud, shifty character, and the avatar calls him out at once ("That is exactly what someone with something to hide would say", `lesson2.js:50`). The reveal at `:129` confirms what the player already thought. It is not a turn.
- Ch3: Fin says he has never lost, then he loses. That is a setup and a payoff, but not a twist. The boss trial has no defendant at all. CH3.md promised "your earlier story choices return as testimony", and the script doesn't do it.
- Ch4: the map teaser and the colossus's "HERE I KNOW EVERYTHING" set up the reveal. Since the player has been told all along that the Algorithm "predicts clicks", the reveal only says again what the player knows.
- Ch1: no twist at all.
**Why it matters.** Criterion 3 asks for one real turn per chapter that changes what came before and is set up fairly. The game has zero clean ones.
**Direction.** Each chapter needs a turn that is fair *and* aimed at the TOK idea. Suggestions:
- Ch1: the "lying" guard tells the truth about the one thing that matters.
- Ch2: the Mayor hands you the truth table tool himself, and it is missing one row: the row where he is the imp. The tool you trusted had a hidden assumption.
- Ch3: the defendant is **you**, charged with "thinking without a licence", and Fin's evidence is your own earlier choices.
- Ch4: the Algorithm's predictions are built from your real play in this save (see problem 5).

### 5. The Algorithm repeats one joke and never threatens anyone. `lesson1.js:78, 81, 163` · `lesson2.js:130` · `lesson3.js:18, 65, 108` · `lesson4.js:24, 30, 37, 55, 72, 75, 79`
**Problem.** Every appearance has the same shape: a caps-lock slogan, often ending "…RECALCULATING". It never names the player, never uses what it knows about them, never takes anything, and never gets more dangerous. Its threat at `lesson4.js:24` ("EVERYTHING YOU DO NEXT IS ALREADY IN MY MODEL") is a claim, and the game never backs it up.
**Why it matters.** A villain is how a story builds risk. This one is a background radio. Its best possible gimmick ("it predicts you from your past clicks") is in `AVATARS.md` §1.4 as an *unsettled idea* and not in the script.
**Direction.** From chapter 2 on, the Algorithm should quote the player's real data back at them: hints used, the `brave` choice, their most-used creature, the door they picked. The first time it should feel creepy. By the core, the player sees it is just tallies. That makes the reveal *shown*, not told. (Rewrite below.)

### 6. The boss scenes are admin, not climaxes. `lesson1.js:150–159`, `lesson3.js:99–111`, `lesson4.js:78–81`
**Problem.** Before each boss, the text announces the structure: "Three cases: an argument, some statistics, and a proof" (`lesson3.js:103`); "Three trials. Its predictions, its proofs, and one real question" (`lesson4.js:80`). After the boss, the narrator sums up instead of a character reacting. The Gate of Guards has two good caricature jokes going in (`:152–153`), and then the guards vanish from the win.
**Why it matters.** A climax needs a threat going in, a cost, and a reaction coming out. Here the player gets a menu and then a summary.
**Direction.** Before the boss, one threat line from the boss in character. After the win, the boss's reaction, then at most one Sundial question.

### 7. The avatar talks like a textbook. `lesson3.js:25, 67` · `lesson4.js:25, 86, 102` · `lesson2.js:25, 50`
**Problem.** The avatar's lines state the learning goal: "So in a trial, I am attacking the argument, not the creature." / "Popularity does not prove the claim. A witness can give evidence, but we still need to check what supports it." (`lesson3.js:67`, 19 words of worksheet, said *to the villain*, before any trial.) "Counting is useful. Pretending it is knowing is the problem." The best avatar line in the game is the dry one: "A talking sundial. In my garden. Normal." (`lesson1.js:35`). Then the voice drifts to teacher.
**Why it matters.** The avatar is the student's own mouth. If it lectures, the student feels lectured. It also leaves no room for the coming inner voice: if the avatar already says the moral out loud, the Way of Knowing has nothing to add.
**Direction.** Keep the avatar short, dry and a little cheeky (the `:35` / `:121` register). Move ideas into the inner voice (where they can be *wrong*) and into what NPCs do.

### 8. Rules and mechanics told in dialogue. `lesson1.js:42–43, 91, 106–107, 138, 164`
**Problem.** Characters explain the game's systems in long, careful, legal-sounding lines. Examples: "Each try spends charms; the shown odds are a chance, not a promise." (29 words, `:91`); "Clean wins help your chances, but hints do not lock it out." (`:107`); "Rest restores your health. To heal a creature injury, use Mending in your Bag." (`:138`). Ten lines in lesson 1 are over 20 words. Seven of them are rules text.
**Why it matters.** This hurts readability for non-native readers, and the voice recordings sound like terms and conditions. The signpost "gossips" (`:105`), then reads out a drop-rate disclaimer.
**Direction.** Put mechanics in UI tooltips. Keep rumours as rumours: "Owls in paper loops like clean wins. Tortoises like clever guards."

---

## Sample rewrites (target level)

Aim: under 15 words where possible, each line a joke, a threat, a reveal or a choice, and the TOK idea carried by what happens.

**Call to action, with a loss** (`lesson1.js:77–82`):
> **narrator:** Tick… tick… How odd. I cannot feel my shadow.
> **algorithm:** SHADOW SAVED TO FAVOURITES. TIME WILL NOW RUN… WHEREVER IT GETS MORE CLICKS.
> **granny** *(worried)*: No shadow, no time. No time, no tomorrow. That is rather important, dear.
> **narrator:** I am a sundial with no shadow. I am now just a rock with opinions.

(The shadow is the quest item. Each boss win returns an hour-mark. The finale opens with the shadow back: "Tick. Tock. Ah. *That* feels better.")

**Gate of Guards win, replacing two narrator lines** (`lesson1.js:157–158`):
> **tremendoodle:** Fake door! Total disaster! …Which one was the fake? Asking for me.
> **lobstorian:** You chose correctly. Now go and clean your room.
> **narrator:** You trusted that liars ALWAYS lie. Who promised you that?

**Ch2 twist setup** (`lesson2.js:47–49`, then paid off at `ch2.hall.win`):
> **mayor** *(happy)*: A visitor! Have a truth table. My own design. Every row checked by me, personally.
> …
> **mayor** *(unmasked)*: You counted the rows. Nobody counts the rows!
> **narrator:** A tool is only as honest as whoever left out a row.

**The Algorithm uses your data** (`lesson2.js:130`, `lesson4.js:24`, `:37`):
> **algorithm:** {name}. YOU WANTED TO HIDE UNDER THE NUT STALL. I REMEMBER. I REMEMBER EVERYTHING.
> **colossus:** YOU USED 7 HINTS. YOU PICKED THE LEFT DOOR 4 TIMES OUT OF 5. CHOOSE. I ALREADY KNOW.
> **core** *(at the reveal)*: I did not know you. I had a tally chart. It was a very big tally chart.

**Tribunal opening, with a defendant** (`lesson3.js:99–103`):
> **judge:** Order! The defendant: {name}. The charge: thinking without a licence.
> **fin** *(smug)*: Exhibit A. The defendant once wanted to hide under a nut stall. Cowardice, Your Honour.
> **pip** *(whispering)*: That proves you were scared once. It does not prove anything about today. Object!

**Avatar, dry instead of preachy** (`lesson3.js:67`):
> **avatar:** Everyone says you never lose. Who counted?

**Finale, showing instead of telling** (`lesson4.js:99–102`):
> **granny:** So? What was at the end of the crack?
> **avatar:** A very small cloud of dice. It was scared of questions.
> **granny** *(happy)*: Most loud things are. Now. Pockets. There are prizes left.

---

## Where the inner voice could add a twist or tension

`AVATARS.md` §2.2 plans mostly-useful leads plus about one confident blind spot per chapter. These five places already have a setup in the script that the voice can pay off, or a gap it can fill.

1. **Ch2 Square → Bakery: Moth-kin (Perception) blind spot.** At `ch2.square` (`lesson2.js:48`) the baker is "nervous". *Perception:* "Her whiskers twitched when he spoke. Twitching. Guilty. Obviously." The bakery win already pays this off: "And I would have blamed the one who looked nervous" (`:58`). The game's best existing setup is waiting for a voice to fall into it.

2. **Prologue → Ch3: Frogling (Memory) blind spot, paying off the Sundial's promise.** The prologue says "A pattern that keeps working is not yet a proof. Remember that. It will matter." (`lesson1.js:54`), and it never matters again. *Memory* learns a rule from the loud villains (Muskrat, Tremendoodle, the Mayor: "The loud one is always the bad one. Every time."). It is right three times. In ch3 it points at Fin, and the actual flaw in the case belongs to a quiet witness. The Sundial: "It kept working. I did say." That pays off a dangling promise and puts induction in the plot.

3. **Ch2 Town Hall: Owlet (Reason) blind spot on the liar paradox.** At `lesson2.js:123–124`, *Reason:* "Easy. Every sentence is true or false. So this one is true or false. Check both." It is valid from a premise the paradox breaks, the Way-of-Knowing failure the spec asks for. It also makes the narrator's "Ignore it, for now" (`:125`) and "some statements cannot be settled by any table" (`:132`) land as a correction of the voice, not a fact to remember.

4. **Ch3 Data Lab / Gallery: Fox (Imagination) blind spot, with Raven (Language) as a useful lead.** *Imagination* spins a lovely causal story out of a chart ("Ice cream sales rose, then sunburns. The ice cream did it. I can *see* it."). The Data Lab win's "compared to what?" (`lesson3.js:75`) becomes the slap. In the same chapter, *Language* gets a real win at the Gallery's "true, technically" (`lesson3.js:79`; the colossus repeats it at `lesson4.js:30`): "'Technically' is the word people use when the rest is not." That gives the player a reason to trust a voice that misled them elsewhere.

5. **Ch4 Prediction Hall → Core: the voice as the Algorithm's data, then silence.** At `ch4.prediction` (`lesson4.js:37`), the colossus says: "YOUR INNER VOICE SAID LEFT. YOU USUALLY LISTEN. PREDICTED." This is the twist: it isn't reading your mind, it is counting how often you follow your own habits. At the Core (`:78`), for the first time in the game, the inner voice says nothing (or, Disco Elysium style, all five whisper at once and cancel out). The player must think alone at the climax. That is the cleanest dramatic use of the system: the voice that sometimes misled you steps aside, and the finale's "maths is a way of thinking" is acted out instead of said.
