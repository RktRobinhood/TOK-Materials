# Roaming legendary creatures: original trick challenges for Units 2–4

Research date: 2026-10-11. Status: future-feature discovery and issue preparation; no gameplay, assets or save format implemented. The teacher wants additional unique, mischievous legendary creatures in Units 2, 3 and 4. Encounters are completely optional. Each creature hosts a short logical trick challenge; failure resets the challenge, returns the player to the chapter map, and visibly sends the creature to a different location. The player must travel there to retry. Passing unlocks that creature. The teacher clarified that the art requirement is **sprite sheets for animation**, rather than spreadsheets.

Filed as [GitHub epic #111 — Optional roaming legendary challenges for Units 2–4](https://github.com/RktRobinhood/TOK-Materials/issues/111), with four future stages and labels for puzzles, content, engine and art. The issue contains the planning findings independently of this local note.

This note separates published reference descriptions, direct observations and our original proposals. Creature names, exact puzzles, balancing and implementation details below are design candidates, not settled additions to the roster.

## Requested reference games

| Reference | Published information inspected | Useful pattern | Adaptation for Rift |
|---|---|---|---|
| [Stupidity Test](https://www.crazygames.com/game/stupidity-test) | CrazyGames credits Rarebit Studios and lists April 2026. Its description says questions involve colours, shapes and simple maths; a mistake or completion ends with a score. It lists click/touch selection. | Simple-looking instructions reward attention. A short run can end after one mistake. | Use a small original sequence with explicit evidence, followed by the requested map chase. Do not assume this currently linked version is the old Flash game the teacher remembers. |
| [The Impossible Quiz](https://www.crazygames.com/game/the-impossible-quiz) | The host describes lateral-thinking questions, three lives, 110 questions, some timers, and seven skips needed for the final question. It credits Splapp-me-do. | A confident-looking answer may be the trap; different interaction types interrupt habits. | Borrow surprise, literal instructions and changing interaction patterns. Use short encounters; avoid long memorised answer chains, hidden final-resource requirements and arbitrary trivia. |
| [The Idiot Test](https://www.crazygames.com/game/the-idiot-test) | The host credits Ryan Curtis and dates the original to October 2006. It describes tricky logical questions, button sequences, increasingly difficult instructions and time-based tasks that sometimes require waiting. | Read the current instruction instead of repeating the previous action; sometimes restraint is the action. | Use visible rule changes and original sequence/selection tasks. Any wait condition must be understandable and offer an accessible equivalent. |

The creator's own [Impossible Quiz submission](https://www.newgrounds.com/portal/view/365143), uploaded 20 February 2007, explicitly describes a mixture of obscure logic, fast reactions and luck. That matters: the reference is not evidence that every question is a fair deduction. Our version should keep the mischievous surprise while making the answer derivable from displayed evidence. No answer walkthroughs, wiki solutions, original question wording, sprites, music or source code were copied.

Rarebit's [FreeGames.org homepage](https://freegames.org/) identifies Free Games Ltd and Rarebit Studios as the same company's website/development brand and links its Stupidity Test. This corroborates the current game's provenance, without establishing the identity of an older Flash version.

### Direct browser spot-checks

All three linked games loaded in their current browser versions. The following small samples were played on 2026-10-11; no full completion or exhaustive puzzle audit is claimed. Canvas gameplay was inspected visually after each action. The playable frame URLs were obtained from the host's rendered iframe, rather than guessed or reconstructed.

- **Stupidity Test:** The opening sequence briefly displayed a colour word in a conflicting ink colour. The next prompt asked for the ink colour; a following round switched to the colour named by the word. A correct first response advanced, and a deliberately incorrect second response ended the run at a score screen. Its retry control returned to the introductory screen. Useful pattern: the task changes while the interaction remains familiar. Our version should not require colour-only discrimination or insult the student.
- **The Impossible Quiz:** Sampled the first two questions. A wrong first answer visibly removed one of three lives while retaining the same question; an accepted response advanced to the next question. The second question relied on an English wordplay ambiguity. This confirms that its immediate failure rule differs from the requested creature escape, and that some reference tricks need replacement for this class. The later game-over/restart sequence and timed rounds were not sampled.
- **The Idiot Test:** Began through a labelled shape selection, followed by a size-selection button task and another shape task. A deliberately wrong shape selection opened a failure screen. Its rewind control returned to the introductory shape screen. Useful pattern: simple targets with a changing instruction; our accepted answer rules must state mathematical distinctions clearly rather than depend on calling a square a non-rectangle.

These observations support adapting instruction changes and interrupted habits. The map pursuit and unique recruitment are the teacher's new design, not features observed in the references. Published descriptions above are distinguished from these direct observations.

## Fit with the existing game

[DESIGN.md](../AOK/Mathematics/Rift%20of%20Reason/design/DESIGN.md) defines short, plain English for a largely non-native-English-speaking class, generated interactive puzzles, a fixed node map, optional exploration and collecting as the payoff. [AGENTS.md](../AOK/Mathematics/Rift%20of%20Reason/AGENTS.md) requires classic scripts/plain HTML and CSS, all durable progress inside the existing save object, offline compatibility, Calm motion, and borrowing mechanics rather than commercial names, art or text.

The current [roster](../AOK/Mathematics/Rift%20of%20Reason/design/ROSTER.md) defines historical mathematician legendaries with rumour prerequisites. This request adds a new legendary encounter/recruitment route; it does not replace the existing roster or generic catches. Decide during authoring whether the new mischievous creatures are original legendary tricksters, historical-inspired creatures, or both. Original tricksters are the recommended starting point for this new feature.

Unit 2's [Village](../AOK/Mathematics/Rift%20of%20Reason/design/CH2.md) covers truth tables and claims; Unit 3's [Tribunal](../AOK/Mathematics/Rift%20of%20Reason/design/CH3.md) covers arguments and contradicting evidence; Unit 4's [Tower](../AOK/Mathematics/Rift%20of%20Reason/design/CH4.md) covers probability, AI and trust in reasoning. The challenge concepts below attach surprise to those ideas rather than turn the side activity into English trivia.

## Original creature and challenge candidates

Initial content target: at least one new unique creature in each of Units 2, 3 and 4. More can use the same encounter framework later. Start with three short rounds per creature and tune their duration in a playtest; the number is a proposal, not a user-set requirement. These are original examples inspired by broad mechanics, not reworded questions from the reference games.

### Unit 2: Maskip, the lantern imp

A small, friendly imp in an oversized Victorian mask, with two brass lanterns and a tail shaped like a switch. It mischievously changes the rule plaque between rounds. Candidate home: Boolesbury side locations such as the square, garden and lamplighter's lane, subject to the actual reachable-node audit.

- **Both:** Four lantern pairs show every on/off combination. The plaque asks for the pair with both lanterns on. The bright ornamental lantern beside the instruction is scenery, not an answer; actual answer pairs have clear control boundaries.
- **Exactly one:** The same layout returns with a clearly changed plaque asking for exactly one lantern on. There are two valid answers; either passes. A player who repeats the previous answer fails because the rule changed, not because a hitbox moved.
- **Check the claim:** A mask card claims that a pictured pair has both lights on. The player inspects that pair and marks the claim true or false. Maskip's dramatic voice and expression may disagree with the evidence, but the displayed task judges the claim rather than the creature's sincerity.

TOK hook: a logical operator changes which rows satisfy the rule; confidence and appearance do not establish truth. Use on/off icons plus labels, not colour alone. Generate answer order and lamp arrangements while retaining every required logical case.

### Unit 3: Quibblequill, the evidence ferret

A tiny ferret with an ink-stained quill, a ludicrous legal wig and stolen ticket stubs. It hides behind impressive-looking paperwork. Candidate roaming region: Tomorrowton's library, archive and café side paths, subject to the node audit.

- **One exception:** Its claim says every stamped parcel has already arrived at the archive. The visible record includes two stamped delivered parcels and one stamped parcel marked not yet arrived. The player picks the one record that defeats the universal claim. A flashy stack of confirming records is a distractor.
- **Changed task:** The next round asks which claim is supported, rather than which claim is false. A clearly displayed instruction changes; the valid choice is the modest statement established by the record, while the grander claim goes beyond it.
- **Missing link:** A displayed premise says every archive key is brass with a moon mark; Quibblequill concludes that every brass, moon-marked key opens the archive. Select that unproved converse among a short set of claim cards, then compare it with a pictured matching key whose visible test record says it does not open the archive.

TOK hook: supporting examples are weaker than a counterexample to an all-claim; a conclusion needs the right premise. Each generated record must independently establish the accepted response; unrelated records and absent evidence cannot be treated as proof of falsehood.

### Unit 4: Oddsnap, the probability gremlin

A cheerful little dice-tailed gremlin wearing a crooked paper crown, emerging from the Tower's prediction machinery. Its bragging is more certain than its evidence. Candidate roaming region: accessible non-boss Tower floors, subject to the node audit.

- **Beat the habit:** The visible machine log records triangle six times, circle three times and square once. Its displayed model assigns next-choice probabilities in proportion to those counts. The instruction asks for its least likely shape. Select square. The oversized glowing triangle is the attentional trap; all counts and the model rule stay visible.
- **New evidence:** The log changes and the instruction now asks for the model's most likely choice. Repeating the least-frequent rule fails; reading the updated task succeeds. Use a unique maximum/minimum in generated logs unless multiple answers are expressly accepted.
- **Likely is not certain:** Two doors show probabilities below 100%, and a third control says that no door is guaranteed. The task asks for a guaranteed safe door. The correct response is that no guarantee follows; the gremlin's animated confident recommendation supplies no extra evidence.

TOK hook: a transparent frequency rule predicts from past data; probabilities are not guarantees. Do not imply that this toy model describes every form of AI. The answer is determined by the shown model/evidence, not by discovering an unrevealed random result.

## Encounter and pursuit loop

1. **Discover:** A visible map marker introduces the legendary and its optional challenge. Skipping it leaves chapter progress, story and mandatory puzzle requirements unaffected. A rumour may advertise it, but decide explicitly whether this new route needs a prerequisite.
2. **Attempt:** Open a dedicated creature challenge from its current node. Instructions are visible in a central panel; no auto-start reading deadline. Use deliberate submission, clear answer targets and a visible round indicator. A short taunt should tease the trick, never label the student stupid.
3. **Fail:** Explain the missed condition briefly, reset the creature's challenge to its beginning, and return to the chapter map. Commit the new location before the flee presentation so animation, reload or interruption cannot allow a retry at the old node.
4. **Flee:** Show the creature travel to a different eligible node, with a persistent destination marker and a plain-text location clue. The destination must be reachable without mandatory battles, paid unlocks or a new chapter gate. Never choose the current node. Select only from a validated roaming set, with at least two legal locations before discovery permits a challenge. Define a fallback if no alternative is reachable.
5. **Pursue:** Retry appears only after the avatar actually travels to the new node. No immediate retry button and no background real-time countdown are required. Reopening the old encounter or reloading must not undo the relocation. Leaving the chapter keeps the creature's location for a later return.
6. **Win:** Unlock the specific creature once. Recommended interpretation: deterministic recruitment after passing, without a subsequent catch-odds roll, charm expenditure or another challenge. If a separate collection confirmation is used, persist a pending reward so leaving/reloading cannot lose it. Repeat visits can offer practice without duplicate unique rewards.

Travel is the requested failure cost. Recommendation for the first prototype: no added heart, danger, charm or death penalty for this optional trick encounter. Settle that explicitly before production, since ordinary puzzle checks currently have other costs. A voluntary exit should return to the map without treating an unfinished attempt as a wrong answer; its exact resume behaviour should also be decided.

Persist encounter status, creature id, current map node, attempt/seed data needed for reproducibility, and the once-only unlock in the existing save object. Distinguish challenge progress, pursuit location and recruitment so resetting the challenge cannot erase an already earned creature. Include chapter jumps, reloads, interrupted flee animation and backup-code round trips in the future checks.

## Sprite sheets and interaction accessibility

Each selected creature needs transparent original art with a documented frame size/grid and consistent pivot: full-body/map idle, challenge/taunt, thinking, correct-answer reaction, wrong-answer/flee-start, short running or flying cycle, and unlocked/recruited pose. Portrait/card art should share the design while remaining legible at their different sizes. The existing avatar uses a roughly six-frame mirrored walk cycle; audit the asset pipeline before choosing the new creatures' exact animation frame counts and orientation support. Do not generate art during this research issue.

Show an actual short departure and movement toward the new node, not just disappearance. Preserve a readable marker after the animation. Calm motion and OS reduced motion use static departure/destination states plus equivalent text, without mandatory animation, shakes, wobble or repeated loops. Keyboard, pointer and touch must all offer the same reachable answers. Shapes need names/symbols in addition to colour; a deliberate wait task needs a plainly explained progress indicator and an equivalent control path if timing is not the learning goal. Append approved future art requirements to the existing [art request list](../AOK/Mathematics/Rift%20of%20Reason/design/art-requests/ART-REQUESTS.md) when the feature enters production.

## Staged future issue acceptance

**Stage 1 — Authoring and prototype specification**

- Select at least one additional unique legendary per Unit 2–4 and decide its relationship to the historical/rumour-based roster.
- Approve each original short challenge, its visible clues, accepted answers, reset point, optional status and TOK connection. Check that its surprise remains understandable for non-native English readers.
- Specify eligible roaming nodes, destination visibility, failure costs, voluntary exit behaviour and guaranteed-unlock interpretation.
- Record sprite-sheet/portrait/card requirements and map motion/reduced-motion storyboards.

**Stage 2 — Reusable roaming encounter and save integration**

- A failed submitted challenge resets, returns to the map, commits a different reachable destination, visibly flees, and requires actual travel before a new attempt.
- Map nodes retain their normal content; the legendary does not replace core teaching encounters or block the story. Each eligible node has a discoverable legendary entry when it hosts one.
- Pursuit survives reload, chapter leave/return, interrupted animation and save/backup round trips. Repeated submissions cannot create duplicate relocation/rewards or lose a pending unlock.
- Works in the existing static classic-script architecture, offline and on GitHub Pages.

**Stage 3 — Unit content, sprites and recruitment**

- Supply one approved creature/challenge set in each unit with consistent original art, animation and a usable Collection/battle card. Abilities and balance need their own deliberate review; no combat stats are prescribed here.
- All variants remain solvable from displayed evidence, with multiple valid responses accepted where intended. A wrong result explains the violated condition before the chase.
- Completing the challenge grants the approved unique unlock exactly once. Existing legendary/catch routes continue to work.
- Pointer, keyboard, touch, Calm motion and OS reduced motion preserve the same information and answers.

**Stage 4 — Playtest and regression evidence**

- Sample all three challenges with students/teacher and record time, clue comprehension, fairness of surprise and whether the chase encourages a retry without wasting class time.
- Validate first discovery, fail/flee/travel/retry, repeated failures, win, replay, no-alternative-node fallback, reload/backup and chapter jumps.
- Run relevant generated-answer, map, save-code and existing collection/battle checks before future implementation ships. Confirm that ignoring every creature leaves Units 2–4 completable.

## Local architecture handoff

Source audit baseline: commit `c10103d9fa2d31fbb37df07be33b6abc4c230f8f`. These are existing seams and proposed extensions, not an implementation of the new feature.

- **Current recruitment:** [data/creatures.js](../AOK/Mathematics/Rift%20of%20Reason/data/creatures.js) contains six historical legendaries and a legendary spawn weight of 2/base catch chance of 15%. [js/core/world.js](../AOK/Mathematics/Rift%20of%20Reason/js/core/world.js) gates those spawns on `rumour:<species>`, rolls loot after a successful activity, and adjusts catch odds for items and other bonuses. [js/screens/encounter.js](../AOK/Mathematics/Rift%20of%20Reason/js/screens/encounter.js) appends a creature instance after a successful normal catch and offers retries after failed catches. These routes do not enforce one unique instance. Keep new challenge legendaries out of ordinary spawn tables and implement a separate once-only claim transaction.
- **Map integration:** [data/map.js](../AOK/Mathematics/Rift%20of%20Reason/data/map.js) supplies fixed sites and links; [js/screens/map.js](../AOK/Mathematics/Rift%20of%20Reason/js/screens/map.js) routes the avatar through revealed nodes on the same painted map. Host the optional encounter as a discoverable overlay/entry at approved sites, preserving their normal activities. Completing this side challenge must not mark the host node complete or satisfy story prerequisites. Use actual map identity: `fair-finale` belongs to Chapter 4 but sits on the main map, outside the Tower map. Validate revealed connected paths, locks and automatic portal travel before choosing a destination. Do not reveal the entire map or bypass chapter gates. A deliberately authored small local pursuit trail is an alternative if the existing reveal set cannot supply two sites.
- **Durable pursuit:** Add a per-creature hunt record to [js/core/state.js](../AOK/Mathematics/Rift%20of%20Reason/js/core/state.js)'s `freshState()` so old saves get defaults and backup codes include it. Candidate fields: phase, current node, attempt number, run seed, round index, departure event `{id, from, to, acknowledged}`, permanent claimed status and recruited UID. Reuse merge-default handling; add a migration only if changing an existing shape. Select/store the destination once from a stable legal-node ordering and attempt seed. Do not reroll location on animation, refresh or load.
- **State transitions:** A submitted wrong answer atomically resets the run, increments its attempt and stores the new node/departure event before showing the map. The old node immediately loses its challenge action. Require actual avatar travel/arrival at the destination before retry. Reload during a challenge preserves the established run; reload during flight preserves the destination and supplies a static departure clue. Chapter leave/return preserves the hunt. Winning atomically records a permanent claim and grants exactly one creature; repeat input, reload or later changes to collection ownership cannot grant another. Multiple active hunts need independent records.
- **Challenge seam:** [js/puzzles/registry.js](../AOK/Mathematics/Rift%20of%20Reason/js/puzzles/registry.js) provides the existing puzzle registry. Evaluate reuse of its interactions/generators while keeping the roaming encounter's failure/reward lifecycle separate from ordinary hearts, scars, loot and story completion. Decide voluntary exit/resume behaviour before production; exiting must not undo an already submitted failure.
- **Sprite pipeline:** [js/core/assets.js](../AOK/Mathematics/Rift%20of%20Reason/js/core/assets.js) exposes `Rift.Assets.frames()` with `{file, frames, frameWidth, frameHeight}`. [tools/assets/sheets.json](../AOK/Mathematics/Rift%20of%20Reason/tools/assets/sheets.json) and [tools/build-assets.mjs](../AOK/Mathematics/Rift%20of%20Reason/tools/build-assets.mjs) already support transparent six-frame walk rows. Use this as the production baseline, extending it deliberately for reaction/flight sheets. JavaScript movement must explicitly respect both Calm motion and OS reduced motion; CSS suppression alone does not stop scripted travel. Keep the destination marker/text available in every mode.

Related existing work: [#30 rumours](https://github.com/RktRobinhood/TOK-Materials/issues/30), [#41 catching mini-games](https://github.com/RktRobinhood/TOK-Materials/issues/41), and [#66 JavaScript animation](https://github.com/RktRobinhood/TOK-Materials/issues/66). This adds a distinct optional challenge-and-pursuit route; the Card Arena interface epic is not a prerequisite. Exact dependencies should be settled when production is scheduled.
