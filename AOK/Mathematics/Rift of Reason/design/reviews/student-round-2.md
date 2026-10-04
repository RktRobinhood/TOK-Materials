# Student critic — round two source/content audit

2026-10-04. Baseline: `f1bfcf6`. Initial audit: source at HEAD `e049a20` plus the working #42 card-introduction changes and their overlay/preview corrections. A focused follow-up at the same HEAD plus the subsequent working fixes is recorded at the end. Scope: all **54 map nodes**, all fourteen puzzle types, and **26 support flows** listed below. Table scores reflect that follow-up where explicitly recorded; earlier per-node quoted concerns remain an audit trail, not a claim that corrected wording is still present.

## Evidence, interpretation and limits

The teacher authorised source/text checks as a substitute for slow website traversal on 2026-10-04. This report uses that revised review method. **Every score here is source-only. No current browser play or real student observation is claimed.** “Turning point” means the teaching moment I anticipate from the code/text, not something I experienced playing. These scores measure whether a willing DP1 student who half-listened to the introduction could understand the next action, the rules and the consequences. They do not measure experienced fun, solve difficulty or actual visual fit.

I read the baseline `student-round-1.md`; all map-node story, introduction, reminder and win text; goals, hosts, puzzle lists and portals; every current rules card/tutorial; relevant puzzle mount/check/feedback controls; and the shared title/avatar, dialogue, map, encounter, battle, catching, collection, settings, bag, rest/shrine and code-sharing flows. Mounts unchanged since the baseline were compared with the earlier source inspection. I did not exhaust all generated puzzle seeds/cases, simulate a complete adventure, or independently rerun the project's tests during this review.

Reported browser/test evidence in `tutorial-round-2.md`, `catching-review.md` and `feedback-audit.md` belongs to its named authors. It is useful corroboration, not my own play. In particular, this review does **not** certify that the baseline Pattern Stall overlap is gone at every viewport, or that every generated hard puzzle feels comfortable.

Scale: 9 very clear; 8 clear with a concrete method; 7 usable with some reading; 6 usable but substantial interpretation remains; 5 a promised action/risk is not adequately supported. Fix types: **content** (instructions/examples), **narrative** (story/variant/host continuity), **game** (missing or misleading controls), **none** (no concrete issue identified).

## Complete score table

All rows use source evidence. The first 54 are the complete node inventory; the remaining 26 are explicitly scoped support flows.

| ID / station or flow | Clarity/comfort /10 | Remaining focus | Fix type |
|---|---:|---|---|
| burrow — Your Burrow | 7 | Marker naming corrected in follow-up | none |
| fair-gate — The Fair Gate | 7 | Card/stall/Rift goals now named together | none |
| stall-pattern — Pattern Stall | 6 | Host/keeper duplication and unverified layout | narrative, game |
| stall-witness — Witness Tent | 8 | Old “watch” wording before written scene | content |
| stall-gallery — Syllogism Gallery | 7 | Validity/truth wording corrected in follow-up | none |
| fair-rift — Crack in the Sky | 6 | Visitor-loot wording corrected in follow-up | none |
| road-start — Forest Road | 7 | Generic introduction needs the mounted task | none |
| signpost — Talking Signpost | 6 | Chance/hints wording corrected in follow-up | none |
| well — Wishing Well | 7 | Test versus prove still deserves care | content |
| troll-bridge — Troll Bridge | 7 | Three drawing modes in one tour | content |
| card-sharp — Card Sharp's Table | 7 | Stakes warning clear; exact stake shown late | content |
| campfire — Campfire Clearing | 7 | Mending in Bag now named and implemented | none |
| standing-stone — Standing Stone | 6 | Pattern story can roll Line Drawer | narrative |
| gate — Gate of Guards | 7 | Chain reading load; stage help now present | content |
| rift-pass — Rift Pass | 8 | Destination/return choice explicit | none |
| b-arrival — Stone Circle | 8 | World rules and return path explicit | none |
| b-south-bridge — Lever Bridge | 7 | Assumptions metaphor follows concrete switches | none |
| b-lamp-lane — Lamp Lane | 7 | Win story now distinguishes answer from table proof | none |
| b-square — Village Square | 8 | Town Hall objective explicit | none |
| b-bakery — Bakery | 7 | Finding imps versus identifying loaf thief | narrative |
| b-post — Post Office | 7 | Old total-collapse sentence oversimplifies | content |
| b-west-bridge — West Bridge (Boolesbury) | 7 | Chance/revisit reminder absent | content |
| b-clockmaker — Clockmaker's Workshop | 6 | Switch-only story can roll wiring mode | narrative |
| b-school — Schoolhouse | 7 | Universal “every argument”/table wording | content |
| b-garden — Walled Garden | 7 | Trainer offer comes before rest | content |
| b-east-bridge — East Bridge | 7 | Exact stakes could precede starting | content |
| b-clock-tower — Clock Tower | 7 | Correct rules now explain rubble/cement | none |
| b-stairs — Town Hall Stairs | 6 | Variant-neutral intro/reminder now present | none |
| b-town-hall — Town Hall | 7 | Paradox is explicitly set aside; chain is briefed | content |
| b-skyrift — Sky Rift | 8 | Confirmation supplies the destination | none |
| t-arrival — Rift Landing | 7 | “Premise” could use a short definition | content |
| t-south-bridge — Neon Bridge | 7 | Witness timing is explained in mounted help | none |
| t-west-bridge — West Bridge (Tomorrowton) | 7 | Rumours are possibilities, not appointments | content |
| t-newsstand — Newsstand | 8 | Press/Present now have a worked example | none |
| t-cafe — Café | 8 | Rest is simple after choosing activity | none |
| t-library — Library | 7 | Repair needs more than a generic mention | content |
| t-plaza — Neon Plaza | 7 | Tribunal destination clear, route choice open | none |
| t-datalab — Data Lab | 7 | Compare testimony with concrete evidence | none |
| t-gallery — Gallery of Charts | 7 | Tool density despite useful example | content |
| t-archive — Archive | 7 | Easy/hard and fate warning now explicit | none |
| t-steps — Tribunal Steps | 7 | Clear attempt price; accusation urgency is flavour | none |
| t-tribunal — Tribunal | 7 | Three proof/case workflows retain reading load | content |
| t-tower-gate — Tower Road | 7 | Recap assumes earlier mastery | narrative |
| k-base — Tower Door | 7 | First destination is implied | narrative |
| k-gallery — Chart Gallery | 7 | Hard variants still require tool experimentation | content |
| k-prediction — Prediction Hall | 7 | Intro asks for a table that initially is sealed | content |
| k-stairwell — Stairwell | 8 | Simple restoration and optional shrine | none |
| k-workshop — Modelling Workshop | 7 | What to enter as a model takes reading | content |
| k-sorting — Sorting Room | 7 | Budget/value comparison is demanding but explained | content |
| k-oracle — Oracle Chamber | 7 | Individual flaw labels need definitions | content |
| k-bridge — Sky Bridge | 7 | Now offers easy/hard, loans and risk warning | none |
| k-core — Core | 6 | Three hard interfaces; stage support makes it usable | content |
| k-summit — Summit Rift | 8 | Homeward destination clear | none |
| fair-finale — Fair, Restored | 8 | Ending invites continued exploration | none |
| S01 — Title / continue / new game | 8 | Payoff loop could be named earlier | content |
| S02 — Avatar selection / perks | 7 | Hint/chapter vocabulary precedes experience | content |
| S03 — Map discovery / walking / markers | 7 | Source labels fixed; visual fit unverified | game |
| S04 — Dialogue / replay / choices | 7 | First click-to-finish convention unstated | content |
| S05 — Free rules / optional/replayed tours | 8 | Shared neutral voice; long final steps | content |
| S06 — Attempts / hints / perks / knockout | 7 | Many quantities, but costs/consequences explicit | none |
| S07 — Stage success / boss Why / stars | 8 | Why is separately charged and shown clearly | none |
| S08 — Post-success loot / rumours / lure | 8 | Older station stories still imply guaranteed visitor | narrative |
| S09 — Catch: timed ring throw | 7 | Timer starts while instructions are being read | content, game |
| S10 — Catch: grid trap | 7 | Fixed tie order is stated but not visualised | content |
| S11 — Catch results / retry / release | 8 | Base/failure/final chance and item count retained | none |
| S12 — Collection / card details / accolades | 7 | Raw injury identifiers and ability vocabulary | content |
| S13 — Team composition / missing-card loans | 6 | First ten rule is clear; no team editor | game |
| S14 — Guided card lesson | 7 | Scripted actions teach rules, not free choice | none |
| S15 — Required safe story battle | 7 | Teaching-card label now explains paused ability | none |
| S16 — Safe practice battle | 8 | Clearly distinguished from real stakes | none |
| S17 — NPC challenge / difficulty / consumables / fate | 7 | Exact automatic stake should appear before start | content |
| S18 — Classmate ghost battle | **7** | Upfront item/fate warning and Practice alternative | none |
| S19 — Team-code export / sharing | 8 | Named trophy-copy/local-play explanation clear | none |
| S20 — Rest / heart restoration | 8 | Automatic heal toast is explicit | none |
| S21 — Shrine / avatar scar healing | 7 | Harder task is optional and explained | none |
| S22 — Bag / tonic / lure / Mending | 7 | Mending choice flow now available | none |
| S23 — Creature injury mending | **7** | Explicit ability/power choice and one-item cost | none |
| S24 — Settings / audio / calm motion | 7 | “All animations” overstates JS movement suppression | content |
| S25 — Backup export / import / erase | 8 | Replacement and local-save warnings explicit | none |
| S26 — Time-rift chapter jump / return / starter kit | 7 | Same Jump labels; kit toast omits possible creature | content |

## Recurring fixes and standards findings

**R1 — Optional help is now a real starting method (resolved baseline blocker).** All fourteen types have rules and a 3–6-step tour with a separate text example. Village's tokens, Prediction's automatic brain reveal, Switchboard's sockets/hidden gate, Line Drawer's automatic checks and Rule Hunter's naming target now match controls. Witness has explicit True/False/Can't tell examples and evidence-based retry feedback. Venn explains All/Some/No, shading/x and validity versus truth. Tower now explains rubble/repeated base contradictions rather than equating loose with false. These are why formerly 3–5 stations now earn 6–8. Remaining refinement: several final steps append the full sentence “How to play is free. The Hint button shows its heart cost. Think first, then check your answer.” Shorten recurring cost prose, keeping actual prices visible. **Type: content.**

**R2 — Some older story lines still describe the former game.** “When you beat a rabid one, throw a Catch Charm” no longer describes post-success independent creature visitors. “Test any three numbers you like” overstates the tile domain. Introductions claiming a specific hidden input, pattern or switch action can precede another rolled mode. Keep flavour, then state the actual mounted task. **Type: narrative/content.**

**R3 — Rumours should describe eligibility and chance accurately.** “Only for those who break patterns” and “with no hints” sound like required performance conditions. Current legendary filtering uses rumour flags; stars affect weights but those named feats are not additional spawn prerequisites. Explain “this rumour makes it possible; revisits and better stars can help” without promising a visitor. **Type: content.**

**R4 — Real-match risk needs consistent entry warnings (ghost omission resolved in follow-up).** Trainer offers say “This challenge has stakes and fate rolls. Defeated collected cards may be injured or lost.” The initial classmate launch lacked that warning; it is now present before Battle!, distinguishes the protected classmate save, and points to Practice. Showing the precise automatically selected stake before starting remains a refinement. Practice/lesson/story remain safe. **Type: content/game.** S18 rises from 5 to 7 on the inspected text change.

**R5 — Mending was a promised but missing action (resolved in follow-up).** The initial bag only used tonic/lure while Mending promised creature healing. It now offers an owned-creature injury choice, “Restore ability” or “Restore 1 power”, each costing one Mending. `World.mend` checks ownership, stock and the injury; the campfire points to the Bag. The shrine remains a separate avatar-scar action. **Type: game/content.** S23 rises from 5 to 7; the additional power-state edge case was found and fixed during this recheck.

**R6 — Keep unverified layout evidence distinct.** Map markers now have their names and lock reasons in `aria-label`. Encounter slots scroll, and named hosts replace pre-puzzle loot creatures. Rule Hunter still mounts its own keeper portrait alongside the station host; the baseline tile-overlap complaint therefore still requires actual viewport verification rather than a claimed visual fix. **Type: narrative/game.**

**Standards lens since `f1bfcf6`:** New game code remains classic scripts on `window.Rift`; index ordering puts core/data/UI before consumers, with the lesson engine before its screen. No build/framework dependency or new save field migration hazard was found; `tutorialsSeen` has a default. Examples do not submit the live solution or spend hearts/items. Help pauses Witness and battle timers; success/KO phase guards block repeated submission, and cleanup tracks lesson/battle/catch help/timers. New motion does not add looping character/card shake. Calm catching explicitly keeps the ring still. Plain-English goals and worked examples substantially improve the documented B1 requirement, though specialised flaw/model vocabulary still needs care. Possible duplication of price prose is a maintainability judgement, not a hard standard breach.

## Per-node assessment

Each turning point below is anticipated, not played. R-codes refer to the concrete recurring fixes above; “none” means no specific remaining source/content blocker.

### Prologue

**burrow — Your Burrow: 7/10.** “Click the glowing path on the map.” Turning point: the labelled Fair Gate marker becomes available after the wake scene. Remaining: say “Click the Fair Gate marker,” matching the selectable object. **Content.**

**fair-gate — The Fair Gate: 7/10.** “Win at least two and come and find me by the old oak.” Turning point: the guided card lesson now introduces a safe payoff activity immediately, and the Road challenge names its gate requirement. Remaining: replace “old oak” with an actual destination label and reconcile the two-stall and card-match goals in one line. **Narrative.**

**stall-pattern — Pattern Stall: 6/10.** “My secret rule keeps the stall running.” Turning point: the 2,4,6 versus 1,3,5 tour example makes discriminating tests concrete, then the fit/no-fit log teaches the live rule. Remaining: R2/R6; Professor Sequins' “my” conflicts with the independently named inner keeper, and “any three numbers” is broader than the tray. **Narrative/game/content.**

**stall-witness — Witness Tent: 8/10.** “Read the scene and judge each claim.” Turning point: the lamp example distinguishes missing evidence from falsity; marked retries point back to scene evidence. Remaining: old “Watch closely” can be changed to “Read closely” to avoid expecting a video. **Content.**

**stall-gallery — Syllogism Gallery: 7/10.** “Draw the facts before you judge the claim.” Turning point: the duck/bird examples explain what to shade and when to place x, then the verdict separates validity from truth. Remaining: “Mathematics needs both” is a broad gloss after fictional-premise arguments; explain that a conclusion follows from assumed premises even if those premises do not describe the world. **Content.**

**fair-rift — Crack in the Sky: 6/10.** “When you beat a rabid one, throw a Catch Charm.” Turning point: the story explains the adventure's purpose and names the Forest Road. Remaining: R2; say successful tasks can attract a creature visitor, sometimes none. Catching is already explained by the live controls, so the outdated line is a continuity problem rather than an absent first action. **Narrative.**

### Road

**road-start — Forest Road: 7/10.** “Check the task below before you trust one.” Turning point: the actual rolled Liar/Venn name, blurb and free tour give the concrete action the generic road line lacks. Remaining: no new blocker; this generic instruction correctly defers to the mounted variant. **None.**

**signpost — Talking Signpost: 6/10.** “Only for those who break patterns”; “with no hints.” Turning point: hearing a named location/creature clue establishes a reason to revisit. Remaining: R3; distinguish rumour eligibility from strict feat requirements and from certainty of appearance. **Content.**

**well — Wishing Well: 7/10.** “Decide what follows from evidence and what still needs testing.” Turning point: Venn help explains a logical consequence, while Rule Hunter explains a counter-test. Remaining: “Prove it!” is flavour but should not imply that repeated positive tests prove an inductively guessed rule. The goal already helps correct this. **Content.**

**troll-bridge — Troll Bridge: 7/10.** “Draw the route or show why no route works.” Turning point: the T example explains impossibility; current controls explain automatic checking versus Submit proof. Remaining: an early sentence should identify the currently rolled dots/route/proof mode, avoiding the universal “without lifting your pen” setup for dots tasks. **Narrative/content.**

**card-sharp — Card Sharp's Table: 7/10.** “The axioms decide the rules.” Turning point: visible portrait and learn/easy/hard choices connect this to the safe lesson; the risk warning precedes a real challenge. Remaining: R4's precise-stake refinement. **Content.**

**campfire — Campfire Clearing: 6/10.** “Your health returns, and your creatures can be mended.” Turning point: automatic “Rested: health restored” is an unambiguous result. Remaining: R5; creature mending has no corresponding action yet. The heart-rest part is usable. **Game/content.**

**standing-stone — Standing Stone: 6/10.** “The stone looks certain of its pattern.” Turning point: Pattern Breaker asks the student to count instead of extrapolate; Line Drawer supplies its own mode/slate instructions if rolled. Remaining: R2; give a variant-neutral “Check what this task actually allows” reminder for the drawing alternative. **Narrative.**

**gate — Gate of Guards: 7/10.** “Solve each task in turn and check which facts you are using.” Turning point: explicit stage X/of Y, per-type help, retained success feedback and Continue make the changes between guards and Venn legible. Remaining: the chain still takes substantial reading; a very short new-stage action reminder would help. **Content.**

**rift-pass — Rift Pass: 8/10.** “Step through when you are ready, or stay a while.” Turning point: destination/return confirmation turns an atmospheric doorway into an explicit choice. Remaining: no source/content blocker. **None.**

### Boolesbury

**b-arrival — Stone Circle: 8/10.** “Honest folk always tell the truth here. Imps always lie.” Turning point: the scene defines a local rule and names the return rift; first-exposure help still appears for students who jumped here. Remaining: no source/content blocker. **None.**

**b-south-bridge — Lever Bridge: 7/10.** “Try the switches and watch what follows.” Turning point: the true AND false / true OR false / NOT true examples connect switches to outputs. Remaining: the assumptions metaphor is now grounded by concrete input controls; no additional blocker. **None.**

**b-lamp-lane — Lamp Lane: 7/10.** “A row is one possible world.” Turning point: matching honest/imp identity with the truth of words produces a visible clash to cross out. Remaining: “You checked every world” assumes the player used the optional table; say “Your answer fits every statement” when table use is unknown. **Narrative.**

**b-square — Village Square: 8/10.** “Help the villagers find the imps among them. Then climb to the Town Hall.” Turning point: a destination and purpose connect the branches into a chapter objective. Remaining: no source/content blocker. **None.**

**b-bakery — Bakery: 7/10.** “Check the villagers before you point a finger.” Turning point: the accuse-token tutorial gives a method more reliable than apparent nervousness. Remaining: the generated puzzle proves imp identities, not necessarily who stole a loaf; avoid presenting that as solved theft evidence. **Narrative.**

**b-post — Post Office: 7/10.** “Check its blocks before we send it on.” Turning point: cemented versus loose and the boots example explain consistency; current rules name rubble and repeated base failure. Remaining: old “the whole tower comes down” overstates the first contradiction; use the current precise rule. **Content.**

**b-west-bridge — West Bridge: 7/10.** “A grey heron ... visits the Schoolhouse.” Turning point: the clue links a creature to a destination. Remaining: R3's chance/revisit wording would prevent expecting an appointment. **Content.**

**b-clockmaker — Clockmaker's Workshop: 6/10.** “Find which switches the task needs.” Turning point: AND/OR/NOT examples and per-mode controls turn the metaphor into a task. Remaining: difficulty 2 can produce wiring, so R2 applies to the switch-only reminder; name the mounted mode. **Narrative.**

**b-school — Schoolhouse: 7/10.** “Read today's task and test the cases.” Turning point: this accepts either Village or Switchboard and the rules card supplies the relevant method. Remaining: “Today's lesson: a statement is either true or false” should be framed as these simplified game rules, rather than a universal claim about every statement. **Content.**

**b-garden — Walled Garden: 7/10.** “Sit a while.” Turning point: choosing Do the activity bypasses Mrs Crumb's optional real challenge and restores hearts. Remaining: label that choice “Rest” at a rest station, so tired students do not mistake it for another puzzle. **Content.**

**b-east-bridge — East Bridge: 7/10.** “Whatever the rules are this round.” Turning point: learn/easy/hard choices and the fate warning now prepare a match rather than assuming battle fluency. Remaining: exact automatic item stakes should be shown before starting. **Content.**

**b-clock-tower — Clock Tower: 7/10.** “Check what each block supports.” Turning point: the support explanation and visible rubble meter distinguish a mistake from full collapse. Remaining: harder questions are announced, help remains available, and the paid-check rule is explicit; no new blocker. **None.**

**b-stairs — Town Hall Stairs: 6/10.** “A hidden input runs this gate.” Turning point: hidden-mode report comparisons identify an input or gate; wire/light variants still have correct generic help. Remaining: the node's difficulty-3 list does not force hidden mode, and the hidden object can be a gate rather than input. Make the reminder variant-aware. **Narrative.**

**b-town-hall — Town Hall: 7/10.** “Ignore it, for now”; “check the tasks one by one.” Turning point: the liar paradox is separated from the solvable generated tables, and stage feedback requires an explicit continuation. Remaining: the paradox adds reading load and the win narrative should not imply optional table use was mandatory. **Content/narrative.**

**b-skyrift — Sky Rift: 8/10.** “Through the tear: towers of light.” Turning point: travel confirmation names the next map and explicitly allows returning. Remaining: no source/content blocker. **None.**

### Tomorrowton

**t-arrival — Rift Landing: 7/10.** “We put arguments on trial here. Not people. Arguments.” Turning point: the scene separates criticism of reasons from personal attack and identifies the return rift. Remaining: define “premise” as a starting claim once before asking students to find the weak premise. **Content.**

**t-south-bridge — Neon Bridge: 7/10.** “Check the task before you join the shouting.” Turning point: Venn help or Witness evidence examples identify the actual task; Witness explains its fading scene and paused help. Remaining: no mismatch between the generic reminder and either rolled type. **None.**

**t-west-bridge — West Bridge: 7/10.** “Is visiting the Tribunal”; “measures the charts ... at night.” Turning point: location clues create an exploration objective. Remaining: R3; do not imply time-of-day scheduling or guaranteed presence unless it is implemented. **Content.**

**t-newsstand — Newsstand: 8/10.** “Press ... and compare the evidence.” Turning point: the separate locked-door/noon example makes Press/Present evidence matching concrete. Remaining: no specific blocker; the local task and rules agree. **None.**

**t-cafe — Café: 8/10.** “Rest a while.” Turning point: choosing the activity restores hearts; the shrine offer clearly says it is a harder optional puzzle. Remaining: optional Pip battle risk is disclosed; no source/content blocker. **None.**

**t-library — Library: 7/10.** “One counterexample sinks it ... decide how to fix it.” Turning point: the evidence defeats the broad proof and the repair choices narrow its claim. Remaining: the general tutorial only says “Repair the proof if asked”; a separate restriction-of-domain example would make this special phase easier. **Content.**

**t-plaza — Neon Plaza: 7/10.** “We shall see. At the Tribunal.” Turning point: the protagonist's “Asking anyone is not evidence” gives a checkable objection and names the chapter destination. Remaining: route choice is open rather than missing a playable action. **None.**

**t-datalab — Data Lab: 7/10.** “See whether the evidence really supports it.” Turning point: court-record comparisons reveal what the bold numerical claim leaves out. Remaining: the mounted statistics case supplies the specific comparison, so the general reminder is adequate. **None.**

**t-gallery — Gallery of Charts: 7/10.** “Adjust them so the numbers can speak fairly.” Turning point: the 95/100 axis example and honest-switch warning explain why the view matters. Remaining: many controls still require reading; tool-local examples could be shorter than another general lecture. **Content.**

**t-archive — Archive: 7/10.** “The axioms always favour me. Probably.” Turning point: the actual offer now provides learn/easy/hard and a fate warning; the joke is not the entire briefing. Remaining: no distinct blocker beyond the shared precise-stake refinement. **None.**

**t-steps — Tribunal Steps: 7/10.** “Press the statement that seems too sure and check the record.” Turning point: connecting an objection with contradictory evidence; attempt dots and prices establish the cost before checking. Remaining: “Catch the flaw before they get inside!” is urgency flavour, not an undisclosed timer. **None.**

**t-tribunal — Tribunal: 7/10.** “Check each case and explain the flaw you find.” Turning point: retained success/debrief/Why plus stage progress frame each new argument, statistics or proof case. Remaining: proof-repair help needs the same refinement as the Library. **Content.**

**t-tower-gate — Tower Road: 7/10.** “Everything you have learned points here.” Turning point: Tower destination/return confirmation. Remaining: chapter-jumping students may not have mastered preceding activities; use “The next tasks check logic, proof and arguments” as a forward-looking recap. **Narrative.**

### Server Tower and home

**k-base — Tower Door: 7/10.** “A model is not the same as knowing.” Turning point: the challenge is to test an apparently confident machine, with the next floor giving actual task help. Remaining: “Floor by floor” could name the Chart Gallery as the first stop. **Narrative.**

**k-gallery — Chart Gallery: 7/10.** “Inspect the axes and switches before agreeing.” Turning point: moving an axis while values stay fixed; the rules distinguish fixing the view from changing data. Remaining: hard variants may need a tool reminder rather than assuming the earlier chapter was played. Replayable first-type help already covers the essentials. **Content.**

**k-prediction — Prediction Hall: 7/10.** “Read its counting table and test its guess.” Turning point: warm-up ends, the brain opens automatically, and Now beat it starts the target rounds. Remaining: the opening reminder should say to make warm-up choices first, since the counting table begins sealed. **Content.**

**k-stairwell — Stairwell: 8/10.** “Even thinkers need rest.” Turning point: immediate restored-heart feedback, then optional scar offer only when relevant. Remaining: no source/content blocker. **None.**

**k-workshop — Modelling Workshop: 7/10.** “Make a guess, ask for facts, then build a model.” Turning point: the tank example separates capacity/rate from irrelevant colour; the three acts make estimation provisional rather than a scored maths test. Remaining: explain the expected numeric/formula input more locally near the model entry. **Content.**

**k-sorting — Sorting Room: 7/10.** “Check the mistakes and who pays for them.” Turning point: a missed need is shown as a different kind of error from misplaced help; comparing fixes reveals the value choice behind accuracy. Remaining: budget and multiple goals are substantial reading, though listed fixes and four outcome boxes are now explained. **Content.**

**k-oracle — Oracle Chamber: 7/10.** “Inspect a step and test it.” Turning point: 9 breaks “all odd numbers are prime”; the rules explicitly say successful tests alone do not prove a universal claim. Remaining: explain specialised flaw names individually at selection, rather than assuming vocabulary. **Content.**

**k-bridge — Sky Bridge: 7/10.** “PLEASE ENGAGE.” Turning point: the real trainer offer—not the villain's joke—now provides difficulty, learning and explicit card risk; loaners fill an empty team. Remaining: no new distinct blocker. **None.**

**k-core — Core: 6/10.** “Test its guesses, inspect its proof, then make your own model.” Turning point: each named stage mounts its own help and retains its reasoning before Continue/Why; the sequence now has a usable structure. Remaining: three different hard workflows make this the heaviest station. Keep a short concrete first-action reminder at each transition and define the local model/flaw terms. This is a source estimate of understandable instructions, not a claim that the hard chain is easy. **Content.**

**k-summit — Summit Rift: 8/10.** “A familiar fairground tune.” Turning point: home destination confirmation and the return story. Remaining: no source/content blocker. **None.**

**fair-finale — Fair, Restored: 8/10.** “What will you wonder about next?” Turning point: the maths-as-questions reflection connects the four eras and explicitly permits continued exploration. Remaining: no new mechanic or source/content blocker. **None.**

## Support-flow assessment

**S01 Title — 8/10.** “Progress is saved on this laptop only.” Turning point: Continue versus New game and the replacement warning establish save ownership. Remaining: one sentence about earning creature cards through reasoning would make the payoff visible earlier. **Content.**

**S02 Avatar/perks — 7/10.** “Pick a traveller.” Turning point: preview and perk text respond to the choice; encounter buttons later make free hint/lantern benefits concrete. Remaining: explain “chapter” and distinguish free rules from solution hints in one short line. **Content.**

**S03 Map — 7/10.** “No known path there yet.” Turning point: named/locked markers and fog lifting explain reachable destinations; trainer portraits now signal a different activity. Remaining: source labels are fixed, but physical marker/portrait overlap and keyboard comfort are not verified here. **Game; verification limitation.**

**S04 Dialogue — 7/10.** “Watch this scene again?” Turning point: click or Enter/Space finishes then advances a line, while choices set flags. Remaining: show that convention once; a student might otherwise click twice and miss a line. **Content.**

**S05 Help/tours — 8/10.** “I'll figure it out”; “Show me how.” Turning point: optional first-type tour and persistent How to play separate controls learning from paid hints. Remaining: R1's repeated long price sentence and neutral voice; no live answer is demonstrated. **Content.**

**S06 Hearts/checks/hints/perks/KO — 7/10.** “Free wrong checks per stage. Then each wrong check costs 1 heart.” Turning point: visible dot budget, priced Hint and explicit scar/rest/shrine consequences. Remaining: free perk hints still count for stars, which is now reflected by the unassisted-star rule; no specific control blocker. **None.**

**S07 Success/Why/stars — 8/10.** “Stage solved!”; “A wrong answer or skip costs 1 heart.” Turning point: Continue preserves reasoning instead of immediately replacing it; stars explain how hints/mistakes affected rewards. Remaining: no source/content blocker; boss Why is clearly separate from the free-check budget. **None.**

**S08 Loot/rumours/lure — 8/10.** “No creature appeared this time. Your rewards are yours.” Turning point: a win is rewarded even without a visitor; rarity/performance/lure and catch chance are separate. Remaining: R2/R3's old dialogue should match this good current explanation. **Narrative.**

**S09 Ring catch — 7/10.** “One charm per throw. Time out uses one charm for a rushed throw.” Turning point: Good/Great/Excellent timing feedback and the visible final odds connect skill with uncertainty. Calm mode correctly names the still-ring timing window. Remaining: 20–26 seconds begins while reading the instructions; a separate Ready/start control would reduce first-attempt reading pressure. **Content/game.** No fun rating claimed.

**S10 Grid catch — 7/10.** “Place a charm on an empty square (cost: 1).” Turning point: visible placements left and movement away from nearby charms make planning concrete. Remaining: fixed tie priority is learnable but not visualised; show the direction priority or a tiny preview if students struggle. **Content.** No fun rating claimed.

**S11 Catch results/retry/release — 8/10.** “A chance is not a promise.” Turning point: persistent base, skill/failure change, final percentage and Used charms text explain a failed roll before Try again/Let it go. Remaining: no specific source/content blocker. **None.**

**S12 Collection/details/accolades — 7/10.** “Learn the card game”; “Ability:”. Turning point: a caught card's power and ability connect collecting to a safe lesson rather than unexplained real stakes. Remaining: detail strings expose identifiers such as `no-ability`/warped ability codes instead of plain descriptions; trophy and injury concepts could link to their explanation. **Content.**

**S13 Team/loans — 6/10.** “Your first 10 creatures form your battle team.” Turning point: the rule and missing-card loans explain how one catch can participate. Remaining: no way to choose which ten here; disclose that limitation or add selection in later work. This is understandable but reduces agency. **Game.**

**S14 Guided card lesson — 7/10.** “Play ... OR attack”; “block ... OR take the hit.” Turning point: ordered legal engine moves plus the normal/Underdog fight preview explain why axioms matter. Help/tour cleanup now closes both overlays, and progress names the actual step. Remaining: scripted buttons teach a sample sequence rather than testing the student's ability to choose freely; source clarity only, no claim of independent battle fluency. **None.**

**S15 Required story match — 7/10.** “No cards or items are at risk.” Turning point: a loaned starter team can win the safe Road challenge, then the host explicitly links game axioms to mathematical starting rules. Follow-up: loaner ability suppression now displays “Teaching card: no ability”; collected-card injuries retain their distinct wording. The apparent-injury finding is resolved. **None.**

**S16 Practice — 8/10.** “Safe sparring: no fate rolls, nothing at stake.” Turning point: an empty collection is loaned a starter team and the result confirms nothing changed. Remaining: no source/content blocker. **None.**

**S17 NPC challenge/fate — 7/10.** “Defeated collected cards may be injured or lost.” Turning point: learning and easy/hard alternatives plus explicit risk make the choice informed; consumables are separately described as used up win or lose. Remaining: show the exact item stake from Ante before Battle!, rather than only in the result. **Content.**

**S18 Classmate ghost — 7/10 after source-only recheck (initially 5).** “Your own collected cards face fate rolls if defeated and may be injured or lost. Items are at stake.” Turning point: this launch warning distinguishes the classmate's protected original cards from the player's own risks; “Use Practice for a safe match” names the alternative. The missing-warning finding is resolved before Battle!. Exact item stake disclosure remains a general real-match refinement. **Content; no threshold blocker.**

**S19 Share team code — 8/10.** “Nothing is taken from you ... a trophy copy with your name on it.” Turning point: the copy/local-laptop explanation establishes that this is an offline ghost, not a live network transfer or loss of the sharer's original card. Remaining: no source/content blocker. **None.**

**S20 Rest/hearts — 8/10.** “Rested: health restored.” Turning point: the health display updates immediately and no calculation is required. Remaining: creature mending is assessed separately at S23; heart-rest itself is clear. **None.**

**S21 Shrine/avatar scar — 7/10.** “Solve a harder puzzle here to heal one scar.” Turning point: Not now versus Try it makes the additional challenge optional, and the success modal names the healed scar effect. Remaining: say avatar scar to distinguish it from creature injuries. **Content.**

**S22 Bag/tonic/lure/Mending — 7/10.** “Rare creatures become more likely for 3 visits, with +5 points to catch odds.” Turning point: applicable Use buttons and updated inventory show a specific benefit; the last lure visit retains its bonus. Follow-up: Mending now has a Use button when an eligible injury exists, followed by an explicit creature/injury choice. Battle-only items remain separately used in battle preparation. **None.**

**S23 Creature mending — 7/10 after source-only recheck (initially 5).** “Use in the Bag: restore one lost ability or one lost power point on a creature.” Turning point: select the named creature, then “Restore ability” or “Restore 1 power · 1 Mending”; the confirmation and reopened bag show the effect. Guarded `World.mend` consumes stock only for an owned eligible injury, restores one power point without lowering a positive trophy/import boost, or removes lost-ability status. “Cosmetic scars and warp changes stay” limits the promise. The missing-control finding and the subsequently identified positive-power edge case are resolved. **None.**

**S24 Settings/calm/audio — 7/10.** “Calm motion: switch off all animations.” Turning point: the checkbox suppresses CSS motion and catching uses a stationary ring with timed text. Remaining: this absolute wording exceeds CSS suppression; map movement/typewriter/live timers use JavaScript. “Reduce motion” or a precise explanation is safer. **Content.**

**S25 Backups/import/erase — 8/10.** “This replaces your current adventure on this laptop.” Turning point: explicit export/load steps and replacement/erase warnings make the save lifecycle clear. Remaining: clipboard errors may require manual copy; the textarea is still usable. No new blocker. **None.**

**S26 Chapter jumps — 7/10.** “Places you skip stay in the fog.” Turning point: labelled chapter rows explain destination, skipped progress and return exploration; later first-type help means a jump does not remove instructions. Remaining: identical Jump buttons need contextual accessible names, and the kit toast should mention the conditional common-creature gift rather than naming only charms/tonic. **Content.**

## Threshold and handoff

All **54 nodes and 26 support flows now meet the revised source-based minimum of 6**. S18 ghost entry and S23 creature mending initially scored 5 and were reported before completion; the explicit source-only recheck below raises each to 7. No independent play or experienced-fun rating is added.

### Focused follow-up — 2026-10-04

Rechecked HEAD `e049a20` plus working changes in `world.js`, `ui.js`, `battles.js`, `battle.js`, item text and the relevant station-text diffs. Mending's eligible Use control/choice buttons, guarded mutation, explicit item cost and Campfire directions resolve R5. The classmate entry now warns of injury/loss, item stakes, protected original cards and safe Practice, resolving R4's missing entry warning. “Teaching card: no ability” resolves S15's injury-label confusion.

The bounded state edge case was found and resolved during follow-up: `World.mend` initially used `Math.min(0, powerDelta + 1)`, which could reduce a positive-delta injured trophy/import-derived card during “Restore 1 power”. The inspected correction increments by one without a clamp and removes the minus-one injury marker at a non-negative result. The added positive-delta trophy regression checks the retained/increased boost, removed marker and unchanged trophy attribution; the ordinary restoration test checks item consumption. The root reports all four Mending tests pass; I inspected the correction/test but did not independently run them. No unresolved finding remains from this focused recheck.

Inspected older story corrections: Burrow now names the Fair Gate marker; Fair Gate names the safe match/two stalls/Crack objective; Gallery separates validity from worldly premises; Crack explains a possible visitor and spent charms; Signpost says visits are not promised and hints do not lock the tortoise out; Standing Stone accepts patterns and paths; Lamp Lane distinguishes a fitting answer from a complete-table proof; Town Hall Stairs now has a variant-neutral inputs/gates reminder. These resolve the named old-wording concerns where indicated in the table. Their original quotes above are retained as the review trail. Remaining switch-only keeper reminders, local proof/model vocabulary and viewport verification are narrower refinements.

Educational-critic dispositions for Oracle labels, Tower withdrawn-proof explanations and Switchboard OFF versus omitted inputs are maintained by the root agent separately. They are not independently re-audited or certified by this focused follow-up.

The largest remaining station-level refinements are older story/variant mismatches, rumour prerequisites, the heavy Core chain and specialised proof/model vocabulary. The main baseline instructional blockers are addressed by free examples, explicit costs, named hosts and stage debriefs. Actual catch fun, all-station play comfort, physical viewport overlap and diverse hard generated variants remain empirical questions; the authorised source substitute does not turn them into observed facts.
