# Chapter 4: The Tower (lesson 4: the ethics of maths, AI, and maths as thinking)

Design notes for #28. The art ids below are what the game code will request.

## Setting

**The Server Tower**, the dark tower on Tomorrowton's horizon and the Algorithm's home. Each floor is a stage of the climb (a vertical map). At the top is the Algorithm's core. The finale returns you home to the Fair, restored.

## Encounters

1. **Chart Fixer** (green / Sense perception): a misleading chart (truncated axis, stretched scale, cherry-picked window, 3-D pie, dual axes). Drag the axis, baseline and window until it tells the truth, then say what the honest chart shows.
2. **The Prediction Machine**: the Algorithm predicts your next choice from a frequency table of your past choices. Beat it by understanding it: it only counts what you did before. Shows "AI is just probability" from the inside.
3. **The Sorting Machine** (ethics): a fictional algorithm decides who gets help in a village. Audit its data and rules (biased training data, a proxy variable, false positives versus false negatives) and choose what to change, with trade-offs. No real cases; the teacher can bring the Danish welfare-algorithm story to class.
4. **The Oracle Machine** (AI and proof): a machine presents a "proof". Check it step by step, find the flaw or confirm it, and decide what it would take to trust a proof nobody can read.
5. **Finale, a three-act task** (Dan Meyer-style): Act 1, a striking visual and "what do you wonder?"; Act 2, the player asks for the information they need; Act 3, the reveal. Maths as a way of thinking, not formulas. Then the Algorithm's core is revealed as a small cloud of dice and percentages, beaten by reasoning, and the Sundial closes the story at the restored Fair.

## Art ids

Backgrounds (`scene/…`, 16:9, no characters, lower thirds open):
- `scene/map-ch4`: the tower as a vertical cutaway, about 8 floors from base to core, each with a clear landmark spot (gate, chart gallery, prediction hall, sorting room, oracle chamber, stairwell rest, sky bridge, core).
- `scene/tower-base`: the foot of the tower at night, a huge door, cables like roots, feed-screens on the walls.
- `scene/chart-gallery`: a gallery hung with giant empty chart frames and easels.
- `scene/server-hall`: endless rows of softly glowing server cabinets, with cables and fans.
- `scene/oracle-chamber`: a domed room around a brass-and-glass machine, with paper tape spilling everywhere.
- `scene/core-chamber`: the top of the tower: a vast hollow sphere of swirling numbers, dice and percentage-shapes (no readable text) around an empty centre.
- `scene/fair-restored`: the home Fair in bright morning light, with bunting, villagers celebrating and the sky healed.

Cast and bosses (`npc/<id>/<pose>`; poses `idle` full body, then busts `neutral`, `happy`, `surprised`, `angry`, plus the extras listed):
- `npc/oracle-machine`: a friendly-uncanny brass-and-glass automaton with a round glass head full of gears and a paper-tape mouth. Extras: `glitch`.
- `npc/algorithm/colossus`: the Algorithm's boss form, a towering figure built from feed-screens and notification bubbles, with the single eye.
- `npc/algorithm/core`: its true form, a small, flickering, almost cute cloud of dice and percentage signs with one tiny eye. Not scary at all.
- `npc/algorithm/defeated`: the core form fizzling into a single confused die.

Props (`ui/…`, transparent):
- `ui/chart-easel`: a blank wooden easel board for drawing charts.
- `ui/dice`: a pair of dice. `ui/probability-orb`: a glass orb holding a swirling cloud.
- `ui/hourglass`: a big ornate hourglass for the three-act task.
- `ui/balance-scale`: a brass balance scale for the ethics room.
- `ui/stamp-yes`, `ui/stamp-no`: two ink stamps with a tick and a cross shape (no text).

Accolade badges (`ui/badge-<id>`, round enamel pins, about 120px), shown in the collection:
- `clear-thinker`: five puzzles solved with no hints (an eye with a spark)
- `falsifier`: tried to break a rule in the Rule Hunter (a hammer and a pattern)
- `truth-tabler`: solved a Village with the table (a grid with one lit row)
- `unmasker`: unmasked the Mayor (a falling mask)
- `cross-examiner`: won a Tribunal case (a gavel)
- `chart-honest`: fixed a misleading chart (a straight axis)
- `legend-hunter`: caught a legendary (a golden aura)
- `rift-walker`: finished the story (the healed sky)
