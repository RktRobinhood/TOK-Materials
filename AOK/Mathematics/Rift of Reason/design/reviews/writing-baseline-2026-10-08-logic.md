# Writing baseline, Critic 1 (logic and consistency), 8 October 2026

Baseline review of the story as it stands before the avatar writing (inner voice, avatar-only choices, talk encounters). Rubric: `design/WRITING-CRITICS.md`, Critic 1. Files read: `data/script/lesson1.js` to `lesson4.js`, `data/map.js`, `design/DESIGN.md`, `ROSTER.md`, `CH2.md` to `CH4.md`, the encounter flow in `js/screens/encounter.js` (which lines play, and in what order), the arrival/rift code in `js/screens/map.js` and `js/core/world.js`, and the cast and text inside the puzzles where a script hands over (`tower.js`, `liars-gate.js`, `venn.js`, `village.js`, `tribunal.js`, `data/rumours.js`).

Traced paths: Owlet girl (bird, board power) and Frogling boy (non-bird, rules power) through Prologue to finale. Also a time-rift jump straight into Ch2, Ch3 and Ch4 with no earlier flags set.

How a puzzle station plays on the first visit (`encounter.js:470-473`): the node's `script` plays first, then the station `intro` (spoken by the node's `host`). After that the host's portrait and reminder line stay in the side panel for the whole puzzle (`encounter.js:70-74`). Several findings below come from these two scripts contradicting each other when they play back to back.

## Scores

**Overall: 5 / 10.** The best TOK lines are accurate and sharp. Examples: the Gate's "you trusted the rules of the game", the OFF-lever line, the Sorting and Core payoffs. The structure underneath them does not hold, though. The player sees characters in places they cannot be, a named NPC with two names, a guide who meets you for the "first time" after guiding you for four floors, and a promised recap and promised consequences of choices that do not exist.

| Part | Score | One-line reason |
|---|---|---|
| Prologue (the Fair) | 6 | Strong TOK beats. Granny names the "Crack in the Sky" before anyone has seen it. The one choice barely echoes. |
| Ch1 (the Road) | 5.5 | The Fair keepers (and Granny, who stayed home) host Road stations. The Gate script's guards are not the puzzle's guards. "Fledgling" is said to every species. |
| Ch2 (Boolesbury) | 5 | The Constable is "Clobber" in the script and "Bulstrode" in the puzzle. The Post Office and Clock Tower intros contradict the scene that just played. The avatar's hunch about the Mayor is rewarded against the chapter's own lesson. |
| Ch3 (Tomorrowton) | 5.5 | The exit to the Tower opens before the trial, so "COME TO THE TOWER" can come after the Tower. Fin's "first loss" can be his second. Piet Hexling can never spawn. The promised "earlier choices return as testimony" is missing. |
| Ch4 + finale | 5 | The Oracle hosts four floors, then greets you as a stranger and contradicts itself in the next line. Granny hosts the Core, then says "There you are!" at the Fair. "Four eras" counts three. |
| Time-rift jump-in | 4 | The "short voiced 'Previously…' recap" that DESIGN.md promises does not exist. The Ch2 and Ch3 arrivals do not say who the Algorithm is or why you are there. |

Criterion notes (the 5 Critic 1 checks):

1. **Story logic: 5.** The causal chain holds (crack, then Road, then past, then future, then core, then home). But the route has no reason: why follow a crack that starts in the future through 1850s Boolesbury first? Several "who is here" contradictions (problems 1–3).
2. **Branches: 4.** There is one choice in the whole game (`brave`, lesson1.js:83-89). It is used once, only for `false`, at the campfire (lesson1.js:139-140). `brave = true` gets nothing later. DESIGN.md ("story decisions (characters react later)") and CH3.md ("your earlier story choices return as testimony") promise more. Dead flag: `rift-walker` (lesson4.js:103) is set but never read; the accolade is awarded separately in `map.js:262`. No scene assumes a choice the player never made: `when brave is false` falls through safely for jump-ins, because undefined is not false. Species fairness: "fledgling" (lesson1.js:134) fits only Owlet and Raven, and "Your Burrow" vs "my garden" (lesson1.js:35) fits nobody exactly.
3. **Inner voice: n/a (not written yet).** Proxy check on the narrator and host lead-ins before puzzles: about half are useful. Lamp Lane's "every row is one possible world" helps. "Read the task before trusting what looks obvious" (lesson1.js:144) does not. The one existing "blind spot shown wrong later" is good and should be the model for inner-voice lines: Miss Quill's "No maybes in my classroom" (lesson2.js:86) is broken by the Mayor's liar sentence (lesson2.js:123). One case goes the wrong way: the avatar's suspicion of the Mayor (lesson2.js:50) is *confirmed*, which teaches the opposite of "Looking guilty is not evidence" (lesson2.js:59).
4. **Continuity: 4.5.** See problems 1–6.
5. **TOK accuracy: 6.5.** Mostly correct and well pitched. Slips: "unsound" for statistical arguments, the liar sentence blurred into Gödel-style undecidability, "valid route" reusing "valid" in a non-logical sense, and the Post Office win line missing its own point (problem 7).

## The biggest problems

### 1. Station hosts are in places they cannot be (Ch1, Ch4)

- `lesson1.js:173, 181`: Granny hosts the Forest Road and the Gate of Guards. Her portrait stays in the puzzle panel the whole time. But lesson1.js:82 has her send someone else ("Someone has to follow that crack"), and she is at the Fair in the finale.
- `lesson4.js:117`: Granny hosts the Core, at the top of the Server Tower. Two scenes later, at the Fair, she greets you with "There you are!" (lesson4.js:98).
- `lesson1.js:175, 177, 179`: Professor Sequins (well, standing stone) and Sergeant Syllo (troll bridge) are Fair stall keepers. They turn up on the Forest Road with no line explaining it. At the troll bridge, Syllo's intro follows straight after Muskrat's toll speech, so two hosts compete for one bridge.

**Why it matters:** this is the most visible logic break in the game. It happens at the first Road station and at the final boss. A student who notices "Granny is here?" stops trusting the story's world, and the finale's reunion loses its payoff.

### 2. Back-to-back scripts contradict each other (Ch2 Post Office and Clock Tower, Ch4 Oracle)

- **Post Office.** `ch2.post` (lesson2.js:62-65): the Constable is interrogating you ("Answer my questions. And keep your story straight"). The next line is the station intro (lesson2.js:141), where the Postmistress says "The Constable *left* an argument here. Check its blocks before we send it on." He has not left. The puzzle (`tower.js` header) is a cover-story interrogation, not checking a posted argument.
- **Clock Tower.** `ch2.tower` (lesson2.js:107): "Again, stranger. From the top." Then the Sweep (lesson2.js:147): "I sweep the tower, but these arguments still wobble."
- **Oracle Chamber.** `ch4.oracle` (lesson4.js:64): "Greetings. I produce proofs… All correct. Probably. Would you like one?" Then the station intro, from the same speaker (lesson4.js:115): "My printer is fast. That does not make every proof right. Inspect a step and test it." The machine refutes itself before you start. Then the win line (lesson4.js:67) is "You… checked. Nobody checks", but it had just told you to check.
- **Oracle as a guide.** The Oracle is also the host and guide for the Chart Gallery, Prediction Hall, Workshop and Sorting Room (lesson4.js:107-113). So by the time it says "Greetings" on floor 6, it has been in your side panel for four floors.

**Why it matters:** these are not subtle. Each pair is on screen within ten seconds. The Oracle's arc ("nobody checks", then it learns humility) is the AI-and-proof lesson of the chapter, and right now it is cancelled out.

### 3. One Constable, two names, and a disguise nobody mentions (Ch2)

The script and the trainer call him **Constable Clobber** (lesson2.js:12, map.js:504). The Tower puzzle that he runs shows **Constable Bulstrode** under his portrait (`js/puzzles/tower.js:124`, shown at :718).

The puzzle also says "You are disguised in Boolesbury" and has a "cover story" (tower.js:4). No script line ever sets up a disguise or a cover story. The avatar just arrives as "Stranger in town", so the puzzle's premise comes from nowhere.

**Why it matters:** a name mismatch on screen is a continuity error any student will spot. The missing disguise also wastes the chapter's best TOK hook (see problem 7).

### 4. The Ch3 exit ignores the order the story assumes (Ch3 to Ch4)

The Tower Road (`t-tower-gate`) links from the Neon Plaza (map.js:315). The fog lifts as soon as you watch the Plaza scene, before the Newsstand, the Steps or the Tribunal. In Ch1 and Ch2 the exit rift hangs off the boss (map.js:143, 258). So in Ch3 a student can climb the Tower and even finish the game, and then win the trial and hear:

- "COME TO THE TOWER" and "the Server Tower lights up. The last climb is close" (lesson3.js:108-109).
- Before the trial, the Sundial's "Everything you have learned points here: logic, proof, arguments" (lesson4.js:19) is said to someone who has not done arguments yet.

Fin has the same problem. He brags "I have never lost a case" (lesson3.js:66), and you can beat him at cards in the Archive first (lesson3.js:89: "…still a loss"). Then at the trial he says "My first loss" (lesson3.js:107).

**Why it matters:** the time-travel story only works if the order of events is believable. This is the one chapter where the map lets the player break it.

### 5. Promised story systems do not exist: recaps, consequences, Hexling

- **"Previously…" recap.** DESIGN.md (Overworld): "a short voiced 'Previously…' recap" on a time-rift jump. There is none; `jumpToChapter` gives a kit and a toast only (world.js:121-137, map.js:347). A student who missed lesson 1 and jumps into Ch2 hears `ch2.arrive` (lesson2.js:22-28). It never mentions the Algorithm, the crack, Granny, or why they are in 1850s Boolesbury. The Ch3 jumper hears "The Algorithm's rabid ones" (lesson3.js:24) with no idea what that is.
- **Choices that matter.** There is one binary choice (`brave`). Its `true` side is never referenced again. Nothing returns at the Tribunal, as CH3.md promises.
- **Piet Hexling.** It is in the Library spawn list (map.js:310), but no script or clue sets `rumour:hexling` (only booleon, euclidon, godelix, lovelace and tycho are set). Legendaries need their rumour flag (world.js:149), so Hexling can never appear. ROSTER.md has its rumour line ready ("A hedgehog of verse waits by the hex-shaped stones…").

**Why it matters:** jump-in is a classroom requirement (absent students). Consequences are what the avatar work is supposed to build on, and right now there is nothing for it to build on.

### 6. The avatar's hunch is rewarded against the chapter's own lesson (Ch2 Square)

The Mayor says "Welcome. Do not ask questions." The avatar replies: "That is exactly what someone with something to hide would say" (lesson2.js:50). The Mayor *is* the Arch-Imp (lesson2.js:129-131). So the game confirms a judgement made from looking suspicious. Meanwhile the Bakery's win line says "Looking guilty is not evidence. A consistent world is." (lesson2.js:59).

In Ch1 the same sentence pattern was used correctly ("…Also exactly what an honest guard would say", lesson1.js:154). Ch2 drops the second half.

**Why it matters:** criterion 3 asks that intuition-style lines be wrong in their typical way and that the game later shows it. Here the game does the reverse. This is also exactly the slot where a Reason or Imagination inner voice will want to speak, so fix the pattern before copying it.

### 7. TOK precision slips at the key moments

- **"Unsound."** `lesson3.js:106`: "The Tribunal finds every argument unsound." Two of the three cases are a statistics case and a flawed proof. Soundness is a deductive notion; a statistical argument is weak or unsupported, not "unsound". Pip's "Find the weak premise in each" (lesson3.js:103) fits the argument case, but the statistics flaws are usually bad inferences (base rates, samples), and the proof case is a broken step.
- **The liar sentence.** `lesson2.js:132`: "Some statements cannot be settled by any table." The liar sentence is not unsettled; it cannot be given *either* value without contradiction. It is set up as a Gödel teaser, but Gödel's sentences are true and unprovable, which is a different thing. A 16-year-old will leave thinking the two are the same.
- **The Post Office win line.** `lesson2.js:68`: "A proof is only as strong as the axioms it stands on. So is a cover story." The real point of this puzzle is sharper and is missed. Your cover story is *false* and the tower still stands. Consistency is not truth; a valid proof from false axioms is still valid.
- **"Valid route."** `lesson1.js:126`: "A valid route shows…" This uses "valid" for "legal drawing" one stall after Syllo defines validity as "the conclusion follows". Use "A working route".
- **Two Galleries.** The Ch3 Gallery and Ch4 Gallery repeat the same claim almost word for word ("Every chart here is true, technically", lesson3.js:79; "EVERY CHART IS TRUE. TECHNICALLY.", lesson4.js:30). Both have gold frames in the teasers (map.js:334, 380). DESIGN.md places Chart Fixer in L4. The repeat reads as a continuity slip (is it the same gallery?).

### 8. Smaller continuity items

- **The crack is spoiled.** `lesson1.js:43`: Granny tells you to "visit the Crack in the Sky" before the crack appears. Then lesson1.js:76-79 plays its discovery as a surprise ("Look up… Do you see it?", "That is not on my schedule").
- **Burrow or garden?** `lesson1.js:35`: "In my garden", but the node is "Your Burrow" (map.js:30).
- **Gate guards.** `lesson1.js:152-154`: the Gate script stars Lobstorian and Tremendoodle as the guards. The puzzle picks random creatures as guards (liars-gate.js:244), and the boss's middle stage is a Venn board with no guards at all.
- **Fledgling.** `lesson1.js:134`: "Beaten by a fledgling" is said to Fox kits, Froglings and Moth-kin.
- **Four eras.** `lesson4.js:99`: "You went through four eras." Home, 1850s and the future make three; the Tower is in Tomorrowton's own era.
- **Judge Hoot.** `lesson3.js:96`: "Judge Hoot is already in *her* robes". The judge's voice in `tools/voices-cast.json:53` is Algieba (a male voice preset). Pick one.
- **Why the route?** The rift route is never motivated. Why does a crack that "starts" at the Server Tower (future) lead through 1850s Boolesbury? `ch2.arrive` "The rift brought the imps here first" (lesson2.js:24) almost says it, but never gives the reason.

## Fixes and rewrites

**P1, hosts.** Swap hosts so each station's guide can plausibly be there:

| Station | Change |
|---|---|
| Road start, Gate | Host becomes `narrator` (the Sundial already narrates the Road). Or keep Granny and add one line at lesson1.js:90, after the gift: `granny: 'I will be in your ear, dear. These charms hum when I talk.'` That makes her a remote voice, and it is the cheapest fix. |
| Well, Standing Stone | Host becomes `narrator`. |
| Troll Bridge | Host becomes `muskrat`, with the intro voiced as Muskrat: "Draw my figure. Or prove nobody can. Ha!" |
| k-core | Host becomes `narrator`. |
| k-gallery to k-sorting | Host becomes `pip`, with a line in `ch4.arrive`: `pip: 'I followed you up. Clerks go where the record goes.'` Or the narrator. |

The Oracle then appears for the first time in its own chamber.

**P2, back-to-back contradictions.**
- `station.b-post.intro`: `constable: 'Your story is the base. Every answer stacks on it. Do not contradict yourself.'` Make the Constable the host (and the same for `b-clock-tower`). The Postmistress and the Sweep can get their lines in the talk encounters instead.
- `station.k-oracle.intro`: keep the machine's arrogance until the win. For example `oracle: 'Here is a proof. Every step is printed. You may inspect one, if you insist.'` and goal line `'A machine's proof needs every step checked.'`

**P3, the Constable.** Rename `tower.js:124` to `Constable Clobber`. Set up the disguise in `ch2.post`, before the Constable speaks:
- `narrator: 'Strangers get arrested here. So you borrowed a coat and a story.'`
- `avatar: 'I am a lamplighter. From… out of town.'`

The puzzle's cover story is then something the player knowingly made up, which unlocks the P7 rewrite.

**P4, Ch3 order.** Move the `t-tower-gate` link from `t-plaza` to `t-tribunal` (map.js:315 and 356). This matches Ch1 and Ch2, where the exit rift sits behind the boss. If the teacher wants Ch3 fully open, rewrite the lines so they do not depend on order instead:
- lesson3.js:107 becomes `fin: 'A loss. In court. That has never… I will need to check my premises.'`
- lesson3.js:108-109: drop "COME TO THE TOWER" and use `algorithm: 'CERTAINTY DOWN. THINKING UP. THIS IS… UNACCEPTABLE.'`

**P5, recaps, consequences and Hexling.**
- Add `S['recap.ch2']`, `S['recap.ch3']` and `S['recap.ch4']`, and play them in the rift jump (map.js:342-347) on a first jump. Each is 2–3 Sundial lines, for example Ch2: `'Previously. A crack opened over the Fair. Through it came the Algorithm, a feed that turns famous faces into shouting creatures.'` / `'You followed the crack down the Forest Road, past lying guards, to a rift. It leads to the past.'`
- Hexling: add `{ flag: 'rumour:hexling', value: true }` and the ROSTER line to `ch3.library` or `ch3.rumour`. Or take Hexling out of the Library spawns until a rumour exists.
- Consequences: echo `brave = true` at least once, for example in `ch2.arrive`: `when brave is true → narrator: 'You said "I will go" without blinking. Granny would be proud. Or worried.'` Make the Tribunal callback CH3.md promises one line in `ch3.trial`, for example `fin: 'The defendant once offered to hide under a nut stall!'` (when brave is false).

**P6, the Mayor hunch.** lesson2.js:50 becomes:
- `avatar: 'That is exactly what someone with something to hide would say.'`
- `narrator: 'Or someone who is just rude. Suspicion is not evidence. Not yet.'`

Then pay it off in `ch2.hall.win` (after lesson2.js:131): `narrator: 'You suspected him in the square. You were right, but only the table made it knowledge.'`

**P7, TOK rewrites.**
- lesson3.js:106 becomes `judge: 'The Tribunal finds that no argument today supports its claim. Not the witnesses. The arguments.'` Pip (lesson3.js:103) becomes `'Three cases: an argument, some statistics, and a proof. Find the step that does not hold.'`
- lesson2.js:132 becomes `narrator: 'But the liar\'s sentence is still out there. It can be neither true nor false without breaking. Some questions break the table itself. Remember that.'`
- lesson2.js:68 becomes `narrator: 'Your cover story is false. Your tower stood anyway. A tight argument from false starting points is still tight. Consistent is not the same as true.'` This needs the disguise from P3.
- lesson1.js:126 becomes `'A working route shows the task can be done. A reason that rules out every route shows it cannot. These are different kinds of support.'`
- lesson4.js:30 becomes `colossus: 'YOU FIXED MY CITY CHARTS. THESE ARE THE ORIGINALS. THEY ARE EVEN TRUER. TECHNICALLY.'`

**P8, small items.**
- lesson1.js:43: `'…then follow the music to the end of the Fair. Something up there wants you.'` Or rename the locked node "Strange Light" until it is completed.
- lesson1.js:35: "In my burrow."
- lesson1.js:134: "Beaten by a beginner."
- lesson4.js:99: "You went through three times: your own, the past and the future."
- lesson1.js:152-154: make the Gate script narrator-led ("The guards today include…"), or mark Lobstorian and Tremendoodle as "the Gate's captains" who are not in the puzzle.
- lesson2.js:24: `'The Algorithm sent its imps here first, to the village where true and false were first written as 1 and 0. Break the logic here, and every era after it wobbles.'` One line that motivates the whole time route.

## Where avatar branches fit naturally (one line each)

- **prologue.wake** (lesson1.js:35): the avatar's first line, a species-flavoured "Normal." joke, also fixes burrow/garden per species.
- **prologue.rift choice** (lesson1.js:83): a third, avatar-only option voiced by its Way of Knowing (Reason: "Where does it start?"; Imagination: "What if it is a door?").
- **ch1.gate** (lesson1.js:154): the "what a liar would say" line. The inner voice gives a blind-spot take here (Language: "He said 'honest' three times, so he means it") and the puzzle disproves it.
- **ch1.cardsharp.win** (lesson1.js:134): Corvina's insult per species (fledgling, tadpole, cub, grub).
- **ch2.square** (lesson2.js:50): the Mayor hunch. The right slot for an Imagination or Perception blind spot that the table then corrects (see P6).
- **ch2.hall** (lesson2.js:124): the liar paradox. The Reason voice panics ("If true then false…"), the Language voice notices the sentence talks about itself.
- **ch2.post** (new disguise line): each avatar picks a species-fitting cover trade.
- **ch3.plaza** (lesson3.js:67): the reply to Fin. The current line answers a popularity claim Fin did not make; an avatar version can answer "never lost" properly (Memory: "Never lost, or never remembered losing?").
- **ch3.trial** (lesson3.js:101): Fin's "confident, famous, popular" is the natural slot for the Emotion or Language voice to be tempted.
- **ch4.arrive** (lesson4.js:25): "A model is not the same as knowing." Per-avatar version, with Memory's blind spot ("It has seen everything I did. Maybe it does know.") disproved on the Prediction floor.
- **ch4.core.win** (lesson4.js:86): the avatar's verdict on the core, phrased in its own Way of Knowing.
- **finale.home** (lesson4.js:102): "What will you wonder about next?", with one answer per avatar.
