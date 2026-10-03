# Student critic: round 1 baseline

Date: 2026-10-03. Baseline: `f1bfcf6`, frozen separately and served on `http://localhost:8792/`. Persona: willing DP1 student, 16–17, Danish first language, half-listened to the introduction, unlikely to read a long rules page.

**This is a partial playtest plus a complete source-based station audit, not an exhaustive playthrough.** The ratings below are provisional wherever marked **S**. They must not be used to claim that issue #35's real-game coverage or round 2 acceptance criteria are complete.

**B** = browser observation in a fresh Owlet save: title/avatar, Burrow, Fair Gate, Pattern Stall (solved normally), rewards, three catch attempts (third succeeded), collection and creature detail. Browser viewport was 1280 × 720. No `debugSolve()` was used. **S** = inspected frozen map, dialogue and applicable puzzle/battle UI source, but did not play the station. Source-based turning points are expectations, not observed moments. A reviewer-only unlocked backup was generated but **not imported**; navigation did not use it. The other generated variants, boss chains, battles and chapter jumps remain unplayed.

The opening is attractive and the Pattern Stall actually teaches its idea through test results. The wider problem is that the student gets a joke or theme, then a new interface, without one concrete first action. Health-priced hints discourage learning that interface. The clearest immediate bugs are the crowded Pattern Stall layout and its three different hosts.

## Summary table

| Station / feature | Evidence | Comfort /10 | Top problem | Fix type |
|---|---|---:|---|---|
| Title and avatar | B | 7 | Perk arrives before the student knows what hints/chapters mean | content |
| Your Burrow | B | 6 | “Click the glowing path” but node names are absent from accessibility tree | game |
| Fair Gate | B | 7 | Clear two-win goal, vague destination “old oak” | narrative |
| Pattern Stall | B | 6 | Overlap hides number tiles; three different hosts | game, narrative |
| Witness Tent | S | 6 | “Watch” introduces a written scene; no worked Can't tell example | content |
| Syllogism Gallery | S | 3 | Shade/existence conventions assumed immediately | content, game |
| Crack in the Sky | S | 7 | Catch explanation comes after first possible catch | narrative |
| Talking Signpost | S | 7 | Rumours sound like guarantees rather than chances | content |
| Forest Road | S | 4 | One vague line leads to either of two unfamiliar puzzles | narrative |
| Troll Bridge | S | 4 | Drawing and impossibility-proof controls need a first demonstration | game, content |
| Wishing Well | S | 4 | “Prove it!” does not establish the rolled puzzle's task | narrative |
| Card Sharp's Table / Corvina | S | 3 | Real stakes before a guided first turn | game, narrative |
| Campfire Clearing | S | 7 | Creature mending implied without a visible next action | content |
| Standing Stone | S | 4 | Pattern story can lead to a line-drawing puzzle | narrative |
| Gate of Guards | S | 3 | Three different stages and penalties without stage briefings | content, game |
| Rift Pass | S | 7 | Destination clear; relationship to chapter menu unclear | content |
| Stone Circle | S | 7 | Strong world rules, no immediate next objective | narrative |
| Lever Bridge | S | 5 | Levers are “assumptions” before AND/OR/NOT is explained | content |
| Lamp Lane | S | 5 | Table instructions name rows, but not how to evaluate a cell | content, game |
| Village Square | S | 7 | Useful objective but no recommendation among several routes | narrative |
| Bakery | S | 5 | Theft story does not explain why finding imps resolves it | narrative |
| Post Office | S | 4 | Cover story / cemented / loose blocks appear together | content |
| Boolesbury West Bridge | S | 7 | Rumour purpose is implicit | content |
| Clockmaker's Workshop | S | 5 | AND/OR/NOT named, not demonstrated | content |
| Schoolhouse | S | 4 | Dialogue promises a table even when switchboard is rolled | narrative |
| Walled Garden | S | 7 | Health restoration and scar healing not introduced by gardener | content |
| East Bridge / Constable | S | 4 | Hard opponent; one-line invitation assumes battle fluency | game |
| Clock Tower | S | 4 | Harder questions announced without a reminder of safe choices | content |
| Town Hall Stairs | S | 4 | “Work backwards” doesn't explain hidden-switch controls | content |
| Town Hall | S | 3 | Paradox plus three-stage switch/table changes overload the start | narrative, content |
| Sky Rift | S | 7 | Atmosphere clear; end-of-chapter reflection missing | narrative |
| Rift Landing | S | 7 | “Find the weak premise” uses an unexplained term | content |
| Neon Bridge | S | 4 | Generic “warm up” precedes Venn or timed Witness | narrative |
| Tomorrowton West Bridge | S | 7 | Two rare-creature clues without collection reminder | content |
| Newsstand | S | 6 | Useful Press/Present directions; evidence matching still needs one example | content |
| Café | S | 8 | Rest is clear; optional scar offer can change the task unexpectedly | content |
| Library | S | 5 | Repairing a theorem is a new task introduced in one sentence | content |
| Neon Plaza | S | 7 | Villain established, next route less explicit | narrative |
| Data Lab | S | 5 | “Numbers do not lie” gives theme, not a procedure | narrative |
| Gallery of Charts | S | 6 | Useful local tool text; jargon and many controls still compete | content |
| Archive / Fin | S | 4 | Battle difficulty changes without player preparation | game |
| Tribunal Steps | S | 5 | Penalty-bearing task introduced as “catch the flaw” | content |
| Tribunal | S | 5 | Strong three-case forecast, missing case-by-case transition | content |
| Tower Road | S | 7 | Clear destination but no recap of what the player will do there | narrative |
| Tower Door | S | 7 | Good villain hook; “floor by floor” is a weak action prompt | narrative |
| Chart Gallery | S | 6 | More difficult chart tools without a reminder | content |
| Prediction Hall | S | 6 | Brain reveal helps; initial rounds' role and win goal unclear | content |
| Stairwell | S | 8 | Simple rest, health feedback does the work | content |
| Modelling Workshop | S | 5 | “Wonder/model/reveal” are new workflow words | content |
| Sorting Room | S | 4 | Accurate/objective/fair concepts and controls arrive together | content |
| Oracle Chamber | S | 5 | First broken step versus trust verdict needs one example | content |
| Sky Bridge / Feed's Champion | S | 4 | Optimised opponent invitation doesn't prepare a small team | game |
| Core | S | 4 | Three different interfaces in a boss without individual briefings | content, narrative |
| Summit Rift | S | 8 | Home destination clear, recap could connect the victory | narrative |
| Fair, Restored | S | 8 | Good ending; assumptions about what student learned need care | content |
| Catching | B | 7 | Clear odds; first catch lacks earlier explanation and retry framing | narrative, content |
| Collection | B | 6 | “First 10” team rule but no team choice or battle introduction | game, content |
| Time-rift chapter menu | S | 6 | Same “Jump” buttons; starter creature not explicitly described | content, narrative |

## Observed stations

### Title and avatar — 7/10; content

“One free hint per chapter (no health cost).” I can choose a traveller confidently, but I do not yet know whether a hint is needed to understand controls or to solve a puzzle. The choice first makes sense when the encounter shows both “Hint (−1 ❤)” and “Free hint”. Add one short sentence explaining that puzzles earn creatures for card battles, then introduce perks as optional help.

### Your Burrow — 6/10; game

“Click the glowing path on the map.” I clicked a destination marker, not a path. In the browser accessibility tree the SVG destinations had no names, so I had to inspect their map positions. It made sense visually when the fair area was revealed. Label destination controls with their names and say “Click the Fair Gate marker”.

### Fair Gate — 7/10; narrative

“Win at least two and come and find me by the old oak.” This establishes a small goal, but I cannot identify a destination called Old Oak. It made sense when three puzzle markers became available. Keep the goal, name the return destination, and explain the first creature/catch before sending me off.

### Pattern Stall — 6/10; game and narrative

“Test any three numbers you like” conflicts with the tile tray's 1–30 choices. More seriously, the puzzle names Siuuugull and gives it a second portrait, while the encounter's obstacle is Usain Volt and Professor Sequins introduced the task. “Catch the Usain Volt!” feels like a different creature arrived after I beat Siuuugull.

I solved the rolled rule normally using [10,10,10], [2,2,2] and [2,2,4], then chose “All three numbers are less than 10”. The clear fit/no-fit test log was the moment the mechanic made sense; the result explained how the failing test ruled alternatives out. At 1280×720 the inner portrait/layout produced horizontal overflow. Clicking the Number 1 control did not fill any slots, whereas visible Number 2 worked. The screenshot showed the first tray column hidden beside/under the portrait. Keep the strong test feedback, give the layout room, and use one consistent speaker/obstacle.

### Catching — 7/10; narrative and content

“Throw Catch Charm (4 left) · 70%” makes the action and odds clear. Two throws failed; the third caught Usain Volt. The reduced count made consumption understandable. The first catch occurs before the Crack in the Sky scene explains “When you beat a rabid one, throw a Catch Charm”. Move a short version earlier. Say explicitly that failure spends a charm and that 70% can still fail several times. The escape explanation is a brief toast; after it disappears, only another throw remains.

### Collection — 6/10; game and content

“Your first 10 creatures form your battle team.” I understand that catches become cards, but cannot choose a team here. The caught creature modal explains power and ability, using “stolen” and “blocked” before I have learned those actions. It first made sense on opening Usain Volt's detail and seeing power 5. Explain the three-lives objective and point to safe practice before the real trainer. The many “???” entries are fine for discovery, but the useful caught card should be easy to find.

## Source-inspected stations: Fair and Road

The following entries are **S**, not played. “Expected turning point” means an anticipated useful teaching moment in the inspected content, not a recorded student experience.

### Witness Tent — 6/10; content

“Watch closely” and “True, false, or we cannot know” sound clear, but the UI says “Read the scene”. Am I remembering a video or reading facts? Expected turning point: choosing Can't tell for something not stated. Show one short example of missing evidence before the real claims.

### Syllogism Gallery — 3/10; content and game

“Shade the circles, recruit.” Which part do I shade, and why does an x mean something exists? Expected turning point: feedback distinguishing missing/extra shaded regions, if the student is willing to submit a guess. Give a tiny separate worked example of empty versus existing regions, including an x on a boundary.

### Crack in the Sky — 7/10; narrative

“When you beat a rabid one, throw a Catch Charm.” This is the first coherent explanation of the payoff loop, after it can already have happened twice. Expected turning point: that sentence. Give the catch explanation at the Fair Gate; use this scene to explain why the adventure leaves home.

### Talking Signpost — 7/10; content

“Only for those who break patterns.” I may interpret this as a guaranteed reward or a new hidden requirement. Expected turning point: seeing a rumour affect a rare encounter. Say rumours improve the chance, and that rare creatures can take revisits.

### Forest Road — 4/10; narrative

“Something here is blocking the way, and it has opinions.” Then either guards/doors or a Venn board appears. Expected turning point: the puzzle's own blurb, after an abrupt transition. Let the rolled puzzle host explain the particular blockage and the first control.

### Troll Bridge — 4/10; game and content

“Draw my figure without lifting your pen. Or prove you cannot.” How do I stop drawing? How do selected dots count as a proof? Expected turning point: “This is impossible!” opening the proof tool and its explanation. Demonstrate one short stroke and a separate impossibility example before any heart penalties.

### Wishing Well — 4/10; narrative

“Prove it! Prove it! Prove it…” does not tell me whether to test number triples or shade circles. Expected turning point: local Rule Hunter or Venn instructions. Add a specific question tied to the rolled puzzle and make “prove” versus “test” precise.

### Card Sharp's Table / Corvina — 3/10; game and narrative

“Your creatures against mine. The axioms decide the rules.” I do not know how I win, what an axiom does, or why one caught creature is enough against ten. Expected turning point: an annotated first play/attack/block, currently absent as an encounter lead-in. Offer safe guided practice, clearly state three lives and two steals, then explain real-battle fate before starting.

### Campfire Clearing — 7/10; content

“Your health returns, and your creatures can be mended.” The health toast is clear, but where is mending? Expected turning point: restoration feedback and, when relevant, the shrine offer. Name the Bag action for creature healing and distinguish it from solving to heal an avatar scar.

### Standing Stone — 4/10; narrative

“A pattern, going on and on” may lead to Line Drawer. The win speech then talks about a counterexample irrespective of which puzzle was played. Expected turning point: rolled puzzle's blurb. Give each variant its own lead-in and matching conclusion.

### Gate of Guards — 3/10; content and game

“Each guard always tells the truth, or always lies” fits the guards task. It does not prepare a Venn middle stage. Expected turning point: noticing “stage 2 of 3”, which explains sequence but not the new job. Brief every stage, explain wrong-answer health loss before starting, and make the why-question/Skip consequence visible.

### Rift Pass — 7/10; content

“Step through when you are ready, or stay a while.” Clear permission, but a student may not distinguish this portal from the global Time rift button. Expected turning point: destination confirmation. Explain that this follows the story while the menu lets the class jump to a lesson.

## Source-inspected stations: Boolesbury

### Stone Circle — 7/10; narrative

“Honest folk always tell the truth here. Imps always lie.” Good rule grounding. Expected turning point: “checking every case”. Give a concrete next destination and preview that bridge levers use a different kind of logic task.

### Lever Bridge — 5/10; content

“Each lever is something you assume.” I understand the goal of lowering the bridge, but not what AND/OR/NOT symbols do. Expected turning point: changing a lever and watching the bulb. Show one AND and one OR example; say whether an off lever means false rather than unknown.

### Lamp Lane — 5/10; content and game

“Every row is one possible world. Cross out the ones that contradict themselves.” How do I decide whether the sentence is true in a hypothetical world? Expected turning point: the table inspector's true/false explanation. Work one cell and one clash on a separate miniature example, then let me handle the rest.

### Village Square — 7/10; narrative

“Help the villagers find the imps among them. Then climb to the Town Hall.” Good chapter objective. Expected turning point: that line. Suggest an approachable next station and explain that branches can be revisited.

### Bakery — 5/10; narrative

“Someone took my last loaf!” The puzzle identifies imps, not a thief, so I might look for a theft clue that is not in the task. Expected turning point: the deduction blurb. Connect lying witnesses to the bakery's problem without implying guilt from imp identity.

### Post Office — 4/10; content

“Every answer you give rests on the ones before.” Cover story, loose blocks, cemented blocks and contradictions are several new ideas. Expected turning point: seeing “Placed loose: it fits, but nothing proves it.” Walk through a sample answer and distinguish consistent from proved before questioning begins.

### Boolesbury West Bridge — 7/10; content

“He writes only ones and zeros.” Nice clue, but what do I do with it? Expected turning point: returning to the Schoolhouse and finding the rare species. Add the brief rumour/chance reminder.

### Clockmaker's Workshop — 5/10; content

“AND, OR, NOT. Nothing else.” Naming operations is not teaching them. Expected turning point: live switch/bulb changes. Show symbols beside plain meanings and connect this machine's particular goal to the controls.

### Schoolhouse — 4/10; narrative

“You trusted the table” is the fixed win speech even if Switchboard rolled. Expected turning point: the selected puzzle's local feedback. Let the teacher explain the rolled activity and name the specific reasoning used in its result.

### Walled Garden — 7/10; content

“Sit a while.” Pleasant, but health/scar mechanics are not in the character's line. Expected turning point: “Rested: health restored.” Introduce the optional scar puzzle before offering it; explain that relaxing restores hearts without a puzzle.

### East Bridge / Constable — 4/10; game

“Whatever the rules are this round.” Assumes I understand axiom flips and have built a viable team. Expected turning point: reading the active axiom during play. Offer a quick rules reminder and team-size advice; make stakes and the hard opponent visible before launch.

### Clock Tower — 4/10; content

“This time the questions are harder.” That is warning without help. Expected turning point: identifying which base statements support an answer. Remind me how to inspect a block's dependencies and recover from one mistake.

### Town Hall Stairs — 4/10; content

“You cannot see the hidden premise... Work backwards.” Which controls are observations and which are guesses? Expected turning point: comparing Seen versus the guessed hidden-switch outcome in the table. Demonstrate observation versus hypothesis in a separate tiny circuit.

### Town Hall — 3/10; narrative and content

“This statement is false” followed by “Ignore it, for now” introduces a difficult paradox and immediately discards it. The boss also switches Village → Switchboard → Village. Expected turning point: individual stage controls, rather than the story. Shorten the paradox beat; give one task sentence per stage and a clear health warning.

### Sky Rift — 7/10; narrative

“MORE SCREENS. MORE OPINIONS. LESS CHECKING.” Clear transition but little reflection on the completed investigation. Expected turning point: destination confirmation. Add a brief character recap of checking cases before entering the next era.

## Source-inspected stations: Tomorrowton

### Rift Landing — 7/10; content

“Find the weak premise and prove it.” I may not know premise means a claim the argument relies on. Expected turning point: avatar's distinction between argument and creature. Define premise with a short example and name the Newsstand as practice.

### Neon Bridge — 4/10; narrative

“Warm up your reasoning before the trials.” This can become Venn or Witness; the latter can hide its scene on harder difficulty. Expected turning point: local puzzle instruction. Name the concrete task and announce any reading timer before it starts.

### Tomorrowton West Bridge — 7/10; content

“Visiting the Tribunal” sounds like a guaranteed legendary. Expected turning point: linking the clue to a destination. Explain that rumours change chances and revisits are allowed.

### Newsstand — 6/10; content

“Press a statement... present it. Then name the flaw.” Better than most openings, but “Press” is a game verb a new student will not know. Expected turning point: Press revealing another claim/evidence with Pip's guidance. Give one tiny non-solution demonstration and state that Ask Pip is free.

### Café — 8/10; content

“Rest a while.” Simple purpose. Expected turning point: restored-heart toast. Explain optional scar healing if it appears so the café does not suddenly become another difficult test.

### Library — 5/10; content

“One counterexample sinks it. But then you have to decide how to fix it.” Finding a counterexample and repairing a theorem are separate skills. Expected turning point: repair options with plain descriptions. Demonstrate one harmless generalisation and how restricting its scope repairs it.

### Neon Plaza — 7/10; narrative

“We shall see. At the Tribunal.” Establishes rivalry but not which branch helps me prepare. Expected turning point: knowing the Tribunal is the chapter destination. Offer a next-step suggestion tied to investigating evidence.

### Data Lab — 5/10; narrative

“People choose which numbers to show you.” Theme is useful but no action. Expected turning point: court record evidence contradicting a selected testimony statement. Let Pip say what to read first and how this case differs from the Newsstand.

### Gallery of Charts — 6/10; content

“Every chart here is true, technically... lying a little.” The local UI gives “Drag the brass knobs” and “Then read it”, which help. Expected turning point: changing one control while the underlying numbers stay fixed. Show one separate misleading-axis example and define tool labels in plain language.

### Archive / Fin — 4/10; game

“The axioms always favour me. Probably.” Banter does not explain why this trainer is hard or what I risk. Expected turning point: active axiom display. Provide a preparation/rules reminder and safe practice link before the real match.

### Tribunal Steps — 5/10; content

“Catch the flaw before they get inside!” I may rush and present evidence without knowing that wrong answers now cost hearts. Expected turning point: contradiction feedback. State the penalty before the task; keep free Press/Ask Pip assistance distinct from health-priced hints.

### Tribunal — 5/10; content

“Three cases: an argument, some statistics, and a proof.” Good forecast, but individual cases need a new objective and proof repair guidance. Expected turning point: the new testimony/court record for each case. Add a short case transition and health-risk reminder without a new lecture.

### Tower Road — 7/10; narrative

“Everything you have learned points here.” A chapter-jumping student may not have learned it. Expected turning point: seeing the tower destination. Use a brief recap that introduces the next task without assuming earlier mastery.

## Source-inspected stations: Server Tower and ending

### Tower Door — 7/10; narrative

“Let us find out what it really knows. Floor by floor.” Clear reason to climb, vague first action. Expected turning point: Chart Gallery task. Name the first floor and one thing the student will check.

### Chart Gallery — 6/10; content

“EVERY CHART IS TRUE. TECHNICALLY.” More difficult chart variants need a reminder, especially after a chapter jump. Expected turning point: live chart updates and reading feedback. Offer the same short example on first exposure regardless of chapter.

### Prediction Hall — 6/10; content

“CHOOSE. I WILL ALREADY KNOW.” The puzzle's locked guess and brain reveal provide useful scaffolding, but initial play and later win threshold are different phases. Expected turning point: “1. count... 2. bet on the biggest count”. Tell me the early rounds collect examples and that the real challenge starts when its brain opens.

### Stairwell — 8/10; content

“Even thinkers need rest.” Clear and short. Expected turning point: automatic restoration feedback. Keep the simple rest, explain optional scar repair only when relevant.

### Modelling Workshop — 5/10; content

“Look first, wonder, then decide what you need to know.” Attractive but model, estimate and requested information are unfamiliar workflow concepts. Expected turning point: “Too low: a number you are sure is too small” beside the sliders. Explain that a model is a calculation using selected facts, with one tiny example separate from the generated problem.

### Sorting Room — 4/10; content

“IT IS ACCURATE. IT IS OBJECTIVE. IT IS MATHS.” Which mistake does the score count, and which control changes a human choice? Expected turning point: changing a policy and seeing who gets help. Define each error type in plain language and separate arithmetic correctness from the ethical decision.

### Oracle Chamber — 5/10; content

“All correct. Probably.” Funny, but I need to know whether I should reject every machine proof or check a particular first broken step. Expected turning point: selecting “This step breaks” and seeing flaw choices. Show one valid mini-proof and one broken step, with the division-by-zero danger explained if present.

### Sky Bridge / Feed's Champion — 4/10; game

“OPTIMISED FOR ENGAGEMENT. PLEASE ENGAGE.” No team preparation or rules recap. Expected turning point: battle's axiom display. Show difficulty, stakes and a safe practice option; avoid a forced loss for a student who only caught one creature.

### Core — 4/10; content and narrative

“Three trials. Its predictions, its proofs, and one real question about the world.” Good preview but these are three different interfaces under boss penalties. Expected turning point: each trial's own task instructions. Brief each stage and show the cumulative progress/health risk clearly.

### Summit Rift — 8/10; narrative

“The last rift... a familiar fairground tune.” Clear homeward direction. Expected turning point: confirming the destination. Use a short recap of what exposed the core rather than adding another mechanic.

### Fair, Restored — 8/10; content

“Mathematics was never a pile of formulas. It is a way of asking good questions and checking the answers.” Strong accessible conclusion. Expected turning point: this reflection and the explicit permission to keep exploring. Invite one student reflection without treating the whole game's claims as proved.

### Time-rift chapter menu — 6/10; content and narrative

“Jump to the start of any chapter” is useful. All choices have the same “Jump” label; the starter-kit toast names charms and tonic, while the design also promises a common creature. Expected turning point: destination/lesson labels and a previously recap. Use descriptive button names, say exactly what is kept/given, and introduce essential puzzle concepts when landing in a later chapter.

## Worst five to prioritise

These are priorities from mixed evidence; four of the five are **source predictions**, not observed playtest failures.

1. **Syllogism Gallery (S, 3/10):** first Venn diagram needs a separate shading/existence demonstration.
2. **Corvina's Card Table (S, 3/10):** first real match needs a guided safe turn and clear stakes.
3. **Gate of Guards (S, 3/10):** stage-specific instructions and penalty explanation before the boss chain.
4. **Town Hall (S, 3/10):** paradox overload and switching interfaces without stage briefings.
5. **Pattern Stall (B, 6/10):** observed layout overlap and inconsistent speaker/obstacle identity; fix these even though the core test mechanic is good.

## Handoff and remaining evidence

Implement reusable first-exposure help, short variant-aware host/task lines, clear boss stage transitions, health-risk text and a safe first-battle tutorial. Preserve generated puzzles and independent thinking; use demonstrations with different examples rather than answer hints. Fix the observed layout/host mismatch before raising this station's rating.

Then perform the real fresh-save station route, all four trainer matches, every boss stage, chapter jumps and the ending. Check harder Witness timing, all Switchboard modes and diverse generated chart/proof/model cases in the real browser. Round 2 must record observed comfort of at least 6/10 per station; source-predicted ratings do not satisfy that condition.
