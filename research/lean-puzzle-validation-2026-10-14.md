# Lean validation for open-ended logic puzzles (Rift of Reason)

Research date: 2026-10-14. Status: research for [issue #138](https://github.com/RktRobinhood/TOK-Materials/issues/138). No game code was changed. The question was whether Rift of Reason can, and should, use Lean to check solutions that students build themselves, so that different tools and routes can reach a valid outcome. Generating problems, checking a result and checking reasoning are treated as three separate jobs.

How to read the labels:

- **[measured]**: produced by the experiment in this folder (`research/lean-validation-2026-10-14/`) on this machine (Windows 10, Node v24.14.0).
- **[verified]**: checked against a primary source on 2026-10-14. The link is given.
- **[code]**: read directly from the game source. File links are relative to this note.
- **[estimate]** and **[proposal]**: our judgement or untested ideas. They are not evidence.

## 1. Recommendation in brief

**Do not adopt Lean, either in the game or as an authoring dependency, for now. Prototype open-ended tasks further with the existing JavaScript checkers.**

- **Lean adds little for these puzzles.** Every puzzle in Rift is finite: a 2–3 input circuit, or 2–8 villagers with 2–3 doors. For a finite puzzle, the plain JavaScript check already examines every case. Lean's real strengths are general claims (statements "for every n") and checking the steps of a student's proof. Neither is part of the current puzzle design.
- **Lean cannot run where Rift runs.** There is no official browser build of Lean (§6.2). The only working in-browser port is unofficial and ships 73–149 MB. It also needs cross-origin isolation, which neither file:// nor GitHub Pages can provide.
- **The alternative is a backend.** Hosted Lean (lean4game or lean4web) means a Linux server with one sandboxed Lean process per player. That would be a new mandatory backend, which this ticket does not authorise.
- **The open-ended activities the teacher wants already work in plain JavaScript.** An open construction grid, toolbox and placement limits, knights-and-knaves with "contradictory" or "not settled" verdicts, and "write your own gate" were all built and checked at the existing `check(data, answer)` boundary. All 30 experiment expectations held **[measured]**. Each check takes about 0.01–0.14 ms, and seeded tasks are sorted into impossible, one solution or several by exhaustive search.
- **Lean during authoring only** is a reasonable later option. It becomes worth it only if a puzzle family appears whose claim is general rather than finite (see §4.3).

**Smallest useful next step:** build a puzzle-bench-only Open Grid Switchboard prototype, reachable via `dev/puzzle.html`, from §3.1 and the experiment's `checkGate`. Then run the 20-minute playtest in §8. Proposed follow-up scope is in §11.

## 2. Audit of the current puzzle families

The registry ([registry.js](../AOK/Mathematics/Rift%20of%20Reason/js/puzzles/registry.js)) already separates five things: seeded `generate(rng, difficulty)`, a pure synchronous `check(data, answer) → { solved, feedback, partial? }`, `hints`, an optional `why`, and an optional reference `solve` used by tests. `encounter.js` calls `def.check(...)` synchronously ([encounter.js](../AOK/Mathematics/Rift%20of%20Reason/js/screens/encounter.js) line 264). Any `solved: false` result counts as a wrong check, and may cost a heart once the free checks are used **[code]**.

Columns: *Answer kind* says whether the puzzle has a single determined answer, many valid constructions, or a choice from options. *Check method* says how `check` decides.

| Puzzle (file) | Answer kind | Check method **[code]** | Open-ended today? | Where broader constructions would help |
|---|---|---|---|---|
| **Switchboard: wire** ([switchboard.js](../AOK/Mathematics/Rift%20of%20Reason/js/puzzles/switchboard.js)) | Many constructions | **Property.** Builds the submitted circuit's full truth table (2ⁿ rows) and compares it with the target. Checks structure first (`nobulb`, `badsrc`, `incomplete`, `cycle`). Any equivalent wiring passes, and tests confirm swapped and hand-made equivalents. The plaque palette is a fixed resource limit; d2–3 add a spare plaque. | **Yes** | No board, no placement rules, no toolbox budget beyond the palette. Feedback gives the row number but not that row's inputs. |
| **Switchboard: light** | Several minimal settings | **Property.** Any setting that lights the bulb with the minimum number of ON switches. | Partly | n/a |
| **Switchboard: hidden** (d3) | Determined (2 choices) | Rejects a guess by finding a contradicting report. The generator keeps only report sets that leave exactly one choice. | No | n/a |
| **Liar's Gate** ([liars-gate.js](../AOK/Mathematics/Rift%20of%20Reason/js/puzzles/liars-gate.js)) | Determined world | Compares with the unique solution found by brute force, then names a contradiction in the player's own world. The generator keeps only puzzles with one consistent world, with a known-unique fallback. Tests check 1,000 seeds per difficulty. | No. The reasoning route is free, but only the final answer is checked. | "Contradictory" or "not settled" verdicts; students writing their own gate (§3.2) |
| **Village** ([village.js](../AOK/Mathematics/Rift%20of%20Reason/js/puzzles/village.js)) | Determined world | Same pattern, plus a known or hidden imp count, a truth-table tool and the Baker's "X is lying" self-reference. The generator demands exactly one world. | No | Students design a square (§7) |
| **Logic grid** ([logic-grid.js](../AOK/Mathematics/Rift%20of%20Reason/js/puzzles/logic-grid.js)) | Determined | Compares exactly with the solution; feedback names the first broken clue. Clues are pruned to a minimal unique set. | No | Low priority |
| **Venn board** ([venn.js](../AOK/Mathematics/Rift%20of%20Reason/js/puzzles/venn.js)) | Determined verdict | Validity is computed by enumerating every model, never hand-coded. The diagram is compared with the canonical shading. Under both existential-import readings, conclusions that disagree are discarded. | Diagram only | Already strong |
| **Line Drawer: dots** ([line-drawer.js](../AOK/Mathematics/Rift%20of%20Reason/js/puzzles/line-drawer.js)) | Many constructions | **Property.** Any polyline with at most N segments that covers every dot. | **Yes** | n/a |
| **Line Drawer: graph** | Many paths, or an impossibility proof | **Property.** Any Euler path. For impossible figures, the player submits the exact set of odd-degree vertices, which is a checkable certificate. | **Yes** | n/a |
| **Water jugs** ([water-jugs.js](../AOK/Mathematics/Rift%20of%20Reason/js/puzzles/water-jugs.js)) | Many plans, or impossible | **Simulation.** Any legal move list. At d3, "impossible" plus a reason picked from options (gcd). | **Yes** | n/a |
| **River crossing** ([river-crossing.js](../AOK/Mathematics/Rift%20of%20Reason/js/puzzles/river-crossing.js)) | Many plans | **Simulation.** Any safe plan, with a ticket limit at d3. | **Yes** | n/a |
| **Tower** ([tower.js](../AOK/Mathematics/Rift%20of%20Reason/js/puzzles/tower.js)) | Many answer paths | **Replay** over brute-forced worlds. Any answer sequence that keeps the story standing passes. | **Yes** | n/a |
| **Sorting machine** ([sorting.js](../AOK/Mathematics/Rift%20of%20Reason/js/puzzles/sorting.js)) | Exact flaw; several fixes | Exact flaw id. The chosen fix is recomputed against criteria (budget, minimum help, gap), and "several fixes can pass". | The fix is | n/a |
| **Chart Fixer** ([chart-fixer.js](../AOK/Mathematics/Rift%20of%20Reason/js/puzzles/chart-fixer.js)) | Range of honest states | **Property.** Honest ranges, for example axis top in [1, 1.75], plus an exact reading option. | Partly | n/a |
| **Three Acts** ([three-act.js](../AOK/Mathematics/Rift%20of%20Reason/js/puzzles/three-act.js)) | Any model within tolerance | **Property.** The student's numeric expression, parsed by its own parser (no `eval`), must fall within tolerance, and the needed information must have been requested. | **Yes** | n/a |
| **Prediction** ([prediction.js](../AOK/Mathematics/Rift%20of%20Reason/js/puzzles/prediction.js)) | Many choice sequences | **Replay** of the frequency model. Reported wins are never trusted. | **Yes** | n/a |
| **Rule Hunter** ([rule-hunter.js](../AOK/Mathematics/Rift%20of%20Reason/js/puzzles/rule-hunter.js)) | Choice from options | Exact rule choice. The tests are analysed for discrimination, but only in feedback, not in deciding success. | No | n/a |
| **Oracle** ([oracle.js](../AOK/Mathematics/Rift%20of%20Reason/js/puzzles/oracle.js)) | Choice from options | Exact first flaw step plus flaw id, with an `alsoAccept` list. | No | The only "check a proof" puzzle. The student finds the flaw rather than writing a proof. |
| **Witness** ([witness.js](../AOK/Mathematics/Rift%20of%20Reason/js/puzzles/witness.js)) | Exact per claim | Exact true / false / can't tell for each claim. | No | n/a |
| **Tribunal** ([tribunal.js](../AOK/Mathematics/Rift%20of%20Reason/js/puzzles/tribunal.js)) | Set match | Each contradiction accepts a set of statement–evidence pairs; flaw and repair are exact. | Slightly | n/a |

What the audit shows:

1. **Many puzzles already accept any valid construction.** Nine puzzles check a property or simulate the answer rather than matching the author's answer: Switchboard wire and light, both Line Drawer modes, water jugs, river crossing, Tower, the Sorting fix, Chart Fixer, Three Acts and Prediction. The teacher's assumption that answers are hardcoded is true only for the deduction and option-choice families.
2. **The deduction puzzles have unique answers by design, and that is correct.** In Liar's Gate, Village, Logic grid and Switchboard hidden, the answer is unique because the generator throws away any instance with zero or several consistent worlds. So "matches the unique answer" is the same as "consistent with the statements". What is genuinely open in these puzzles is the **route**: the order of suppositions, or using the truth table versus chaining arguments. No puzzle checks the route, and none needs to in order to judge the answer.
3. **A small fragility.** If a Liar's Gate or Village instance ever had zero or several worlds, `check` could never return solved. `solve` returns `null`, so no answer could ever win, and wrong checks would keep costing hearts. The generator filtering, the fallback puzzles and the 1,000-seed tests prevent this. The experiment re-confirmed it independently on 900 Liar's Gate and 300 Village seeds **[measured]**.
4. **Reasoning is checked nowhere as a sequence of steps.** The nearest things are Oracle (spot the first broken step), Line Drawer's odd-vertex certificate and Water Jugs' choice of reason. A step-checked proof is the one thing Lean is built for (§4).

## 3. Formalisation sketches

Both sketches were implemented and run in `experiment.mjs` **[measured]**. The answer formats are JSON objects, so the student never writes code, and the browser runs nothing the student submits.

### 3.1 Gate construction: "Open Grid" Switchboard

- **Goal:** a target truth table over 2–3 switches, such as "the bridge is safe when exactly one of A and B is true".
- **Board and toolbox (task data):** `board: { cols: 3, rows: 3, blocked: [[col,row],…] }`, `toolbox: { AND, OR, NOT }`, `maxPieces`. These values drive the displayed rules, so the rule text and the checker read the same data.
- **Legal actions:**
  - Place a plaque from the toolbox on a free cell.
  - Wire a switch or a plaque further left into a plaque's input socket.
  - Wire one output to the bulb.
  - Switches may feed several sockets; each plaque has exactly one output wire.
- **Answer:** `{ pieces: [{ id, op, at: [col,row], in: [src, src?] }], bulb: src }`. Here `src` is a switch letter or a piece id.
- **Validation, in order:**
  1. Placement: on the board, not on a cracked cell, one plaque per cell.
  2. Toolbox: plaque counts within budget.
  3. Wiring: inputs complete, sources exist, wires flow left to right, each plaque output used once.
  4. Behaviour: every row of the truth table matches the target. On failure, report the first differing row with its input values.

  Rules are checked before behaviour, so a correct bulb cannot hide a broken rule. Left-to-right flow makes loops impossible by construction, which replaces the Switchboard's cycle check. One output per plaque means a construction is a formula tree, so the exhaustive search in §5 covers exactly the constructions the rules allow.
- **What counts as a "different solution":** the search counts canonical formula trees. It ignores mirror images (A AND B = B AND A), NOT NOT x and x AND x. Grouping, De Morgan forms and different plaque mixes count as different. Placement on the board is not counted, because many layouts exist for each tree.

### 3.2 Truth-teller and liar sketches (Liar's Gate model)

These sketches reuse the Liar's Gate statement AST: `honest`, `liar`, `safe`, `trap`, `and`, `or`, `if`, `same`, `diff` and `count`.

**(a) Open verdict.** The player can say more than "this world":

- **Goal:** decide what the guards' statements settle.
- **Legal actions:** mark each guard sun or mask and pick a door; or declare "contradictory"; or declare "not settled" and give two worlds.
- **Answer:** one of
  - `{ world: { honest: [bool…], door } }`
  - `{ verdict: 'contradictory' }`
  - `{ verdict: 'open', worlds: [w1, w2] }`
- **Validation:** enumerate every world (2ⁿ × doors). A world answer must fit every statement and must be the only world that fits. Otherwise the feedback names a rival world. "Contradictory" must match zero fitting worlds. "Open" needs two fitting worlds with different safe doors; these are two models acting as a counterexample to "the door is determined". Different pairs of worlds all pass.

**(b) "Write your own gate" (a construction task).**

- **Goal:** give each of three guards one statement so that exactly one world fits, and in it the right door is safe.
- **Toolbox:** the statement tiles `honest`, `liar`, `safe`, `trap`, `same`, `diff`, `if` and `and`, with the AND tile at most once. There are no OR or counting tiles, and at most one guard may mention a door.
- **Answer:** `{ says: [AST, AST, AST] }`, built from tiles in the UI.
- **Validation:**
  1. Tile and budget rules.
  2. Count the fitting worlds by enumeration: 0 means a paradox, 2 or more means not settled (feedback names two worlds), 1 means the door is checked.

### 3.3 Who writes the model, and how it stays aligned with the displayed rules

- **Authoring.** The builder writes the model in the same pure JavaScript as now: the AST, the evaluator and the rule constants. A teacher can change parameters such as the toolbox, blocked cells, guard count and allowed tiles, but not the semantics.
- **Keeping rules and checker in step.** Today `rules[]` is hand-written text, and nothing automatic links it to the checker. The proposal is that budgets and restrictions appear only in task data. The UI then renders the rule lines from that data, for example "Toolbox: 2 AND, 1 OR, 2 NOT", and a test asserts that every restriction key the checker reads appears in the rendered rules. This is the same "single source" pattern the Switchboard already uses: its palette is data, not text.
- **What can be checked automatically:**
  - per instance, at generation time: satisfiable, unique, several solutions, or degenerate;
  - per answer: the correctness of the final construction.
- **What cannot be checked:** whether the student's reasoning was valid. A correct construction can come from trial and error. The Switchboard already admits this honestly in its `why` options.

### 3.4 Finite tests, exhaustive checks and proofs give different guarantees

- **A finite sample**, for example "1,000 seeds per difficulty had one world", supports a claim about the generator but does not prove it for seed 1,001. That is induction in the Rule Hunter sense.
- **An exhaustive check of one instance**, for example "all 4 rows match" or "all 96 worlds were tried", is a complete proof *for that instance*. The Switchboard's success text already says so: "Every possible case checked: that is a proof." Because every generated instance can be checked before it is shown, play is never at the mercy of the sampled generator claim.
- **A general proof**, for example "for every n, a circuit with no NOT plaques cannot compute exclusive or", needs an argument about all n. Here the induction argument is that monotone gates preserve monotonicity. This is where Lean would really help (§4.3).

## 4. Comparison of approaches

| | **A. Extend JS property checkers** (current boundary) | **B. JS exhaustive search at generation time** (already used) | **C. SAT/SMT solver in browser** | **D. Lean 4 at runtime** | **E. Lean during authoring only** |
|---|---|---|---|---|---|
| **What it guarantees** | The final construction meets every rule, for every case of a finite instance | Satisfiable, unique or several solutions, and non-degenerate, per instance | Same as B, at much larger sizes | Kernel-checked proofs, including general claims and student-written proofs | Machine-checked theorems about a formal *model* of a generator or puzzle family |
| **Works from file:// and on GitHub Pages** | Yes | Yes | logic-solver: probably (plain JS/asm, ~305 KB, no threads) **[verified size; offline untested]**. z3-solver: needs `SharedArrayBuffer` and COOP/COEP headers (§6.3) | No official browser build. The unofficial port needs cross-origin isolation (§6.2). Hosted needs a backend | Yes: nothing ships to the browser |
| **Build step** | None | None | Vendoring one file | WASM toolchain and library `.olean` files | Lean toolchain on the author's machine or in CI |
| **Size and latency** | ~0.01–0.14 ms per check **[measured]** | 20–30 ms one-off tree build; ~0.2–0.3 ms per gate task; ~1–3 ms per K&K puzzle **[measured]** | 0.3 MB (logic-solver) to 35.8 MB (z3-solver) **[verified]** | 73–149 MB download, ~4 s to load `Init` (third-party figures, §6.2) | none |
| **Authoring effort** | Low. The same style as the 17 existing puzzles | Low. Already the house style | Medium. Encoding constraints as CNF/SMT; debugging encodings | High. Lean skills, game infrastructure, keeping toolchains current (Lean ships roughly monthly, §6.1) | High. A Lean model of each family, plus a gap between that model and the shipped JS |
| **Feedback quality** | Plain-English feedback designed per rule, with counterexample rows and named rival worlds **[measured]** | Not student-facing | Gives a model or "unsat". English must be written separately | Lean error messages; lean4game adds custom hints. Rewording would be needed for 16–17-year-old EAL students | Not student-facing |
| **Checks reasoning steps?** | No | No | No | **Yes** | No (it checks the author's claims) |

### 4.1 What Lean uniquely contributes

- **Checking a student's proof step by step**, against a trusted kernel, with audits that block cheating:
  - `#print axioms` lists every axiom a result relies on, including `sorryAx` from `sorry`, which "can be used to prove anything" ([Lean reference: Axioms](https://lean-lang.org/doc/reference/latest/Axioms/)) **[verified]**.
  - Since v4.35.0, `lake check` and `lake comparator` replay a submission through the kernel inside a bubblewrap sandbox, Linux only, and reject non-standard axioms ([v4.35.0 release notes](https://lean-lang.org/doc/reference/latest/releases/v4.35.0/); [comparator README](https://github.com/leanprover/comparator)) **[verified]**.
- **General theorems** about a whole puzzle family, not just one instance.
- **Proof terms as objects to teach with.** The Logic Game teaches natural deduction this way (§9).

### 4.2 Where Lean's cost outweighs its benefit in Rift

- **Rift does not need step-checking to judge any current puzzle.** Every answer is a finite construction or world, and A and B check it completely. Lean would re-prove, more slowly, what the 4-row or 96-world loop already establishes.
- **Students would have to write Lean**, or the UI would translate drag-and-drop actions into Lean terms. Writing Lean is explicitly out of scope. Translating means the JS UI model becomes the thing Lean checks, and that model can be checked directly in JS.
- **Deployment:** see §6. Runtime Lean breaks the file:// and GitHub Pages rule, and hosting it adds a backend, privacy questions and dependence on the network.
- **Asynchronous checking.** `check` is synchronous, and any non-solved result costs a wrong check (§6.4). Remote or worker-based Lean would need a new result path.

### 4.3 When authoring-only Lean would become worthwhile

The trigger is a puzzle whose displayed claim is **general**. Examples: "no circuit without NOT can ever compute exclusive or, however big", a parity invariant for sliding puzzles at every size, or a theorem behind a boss "why?" step. Lean could then certify the general fact once, offline, and the browser would only display it.

Even then, the Lean model is a second implementation of the rules, so its alignment with the JS would itself need tests. **[estimate]** This is about a day of expert work per theorem. It is worthwhile for one or two flagship impossibility claims, not as a routine pipeline.

## 5. Generation: parameterised definitions, uniqueness and impossibility

Lean does not generate puzzles or solve them automatically. Rift's generators already follow the right pattern: draw parameters from a seeded RNG, build a candidate, then check it by exhaustive enumeration and keep it only if it qualifies. Examples are Liar's Gate `score`, Village `solutions`, Switchboard `randomCircuit` and `dependsOnAll`, and the Venn model enumeration **[code]**.

The experiment extends this pattern to the gate task **[measured]**:

- **Search space:** 4,914 canonical trees over 2 inputs and 47,838 over 3 inputs, up to 5 plaques. Built once in about 20–30 ms; each task's analysis then averages about 0.2–0.3 ms.
- **Classification of 200 seeded tasks:**
  - Targets come from the Switchboard's own `randomCircuit`, which already rejects circuits that ignore a switch or waste a plaque.
  - Toolbox = the reference circuit's plaques plus a spare, or, in about a third of tasks, minus one.
  - Results: **59 impossible, 54 unique, 87 several solutions, 0 degenerate.**
  - With one plaque removed: 59 impossible, 10 still unique. Another construction survived, which is exactly the "different tools, same goal" effect the teacher wants. With a spare added: 87 several, 44 unique.
- **Agreement with the checker:**
  - All 560 constructions the search found were accepted by `checkGate`.
  - Every AND↔OR mutation agreed with the Switchboard's own evaluator.
  - Every failing mutation carried a counterexample row.
  - Seeds repeat exactly.

For knights and knaves, raw random statement sets that are *not* filtered are mostly unusable **[measured, 1,000 sets per size]**:

| Guards × doors | Contradictory | Unique | Several worlds, door fixed | Several worlds, door open |
|---|---|---|---|---|
| 2 × 2 | 85 | 145 | 44 | 726 |
| 3 × 2 | 94 | 156 | 103 | 647 |
| 4 × 3 | 112 | 84 | 73 | 731 |
| 5 × 3 | 148 | 85 | 100 | 667 |

So only about 8–16 % of naive instances are uniquely solvable. The game's hill-climbing generator, which keeps a candidate only when its score is 1, is essential. It is also cheap, because enumeration is fast.

Two consequences:

1. **The "contradictory" and "open" verdicts (§3.2a) are generated almost for free.** The generator already counts the consistent worlds of each candidate, and most candidates fall into those buckets.
2. **Degeneracy guards stay in JavaScript.** Liar's Gate's `worthSaying` rejects statements that are always true, always false or redundant. Switchboard's "no wasted plaques" and `dependsOnAll` do the same for circuits. The gate experiment adds a check that the target is not a constant or a single switch (0 hits).

**Scale limits [estimate]:**

- Knights and knaves enumeration grows as 2ⁿ × doors; it is still under 1 ms per check at 10 guards (about 3,000 worlds).
- The gate tree search grows about 15× per extra plaque, so 6–7 plaques over 3 inputs is still sub-second at generation time.

Beyond those sizes, a vendored SAT solver (logic-solver) is the next step, not Lean.

## 6. Integration and operation

### 6.1 The Lean toolchain: current facts **[verified]**

- **Latest stable release:** [v4.35.0](https://github.com/leanprover/lean4/releases/tag/v4.35.0), published 2026-10-12. The previous release was v4.34.1 (2026-09-24), with v4.35.0-rc1 to rc4 between 2026-09-15 and 2026-10-06.
- **Licence:** Apache-2.0.
- **Installation:** through **elan**, which picks the version from each project's `lean-toolchain` file ([lean-lang.org manual install](https://lean-lang.org/install/manual/)).
- **Windows v4.35.0 archive:** 622,724,192 bytes (`.tar.zst`) and 902,262,322 bytes (`.zip`), per the GitHub API.
- **Checking untrusted proofs is now built in.**
  - `leanchecker` has shipped with the toolchain since v4.28.0; [lean4checker](https://github.com/leanprover/lean4checker) is archived.
  - `lake check` and `lake comparator` arrived in v4.35.0 and require bubblewrap, so they are Linux-only.
- **The `decide` tactic** ([Init/Tactics.lean](https://github.com/leanprover/lean4/blob/master/src/Init/Tactics.lean)) reduces a `Decidable` instance. That means Lean *can* settle a finite puzzle by brute force inside the kernel (`decide +kernel`); in effect it runs the same exhaustive loop as the JS.
  - `+native` uses compiled code and adds an axiom for each use. This enlarges the trusted base, but `#print axioms` shows it.

### 6.2 Lean in a browser **[verified]**

- **No official WASM build is current.** Official `linux_wasm32` archives exist only from v4.3.0-rc2 to [v4.15.0](https://github.com/leanprover/lean4/releases/tag/v4.15.0) (January 2025): 199,105,233 bytes `.tar.zst`. The WebAssembly CI job is commented out in `.github/workflows/ci.yml`.
- **live.lean-lang.org runs Lean on the server.** The [lean4web](https://github.com/leanprover-community/lean4web) README describes "a web application running Lean 4 server-side … not in the browser". It is Apache-2.0 and was last committed 2026-10-02.
- **The only working in-browser port is unofficial:** [cauli/lean4-wasm-in-browser](https://github.com/cauli/lean4-wasm-in-browser) (Apache-2.0, 18 stars, last push 2026-09-10).
  - It uses a custom fork of Lean in a Web Worker.
  - It reports 48 MB of JS plus 101 MB of WASM for the full build, and 3.4 MB plus 70 MB for the slim build (`Init` only), with about 4 s to import `Init`.
  - It requires COOP/COEP cross-origin isolation for `SharedArrayBuffer`.
  - These are the project's own figures and were not measured by us.
- **Why that cannot work for Rift:**
  - Cross-origin isolation needs the `Cross-Origin-Opener-Policy` and `Cross-Origin-Embedder-Policy` HTTP response headers ([MDN: crossOriginIsolated](https://developer.mozilla.org/en-US/docs/Web/API/Window/crossOriginIsolated)).
  - GitHub Pages does not let a site set custom headers. The usual workaround is a header-injecting service worker (z3-solver's README suggests `coi-serviceworker`). Service workers are "only available in secure contexts", meaning HTTPS or localhost ([MDN: Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)).
  - **[inference]** A page opened from file:// therefore has no route to cross-origin isolation at all.
  - Size comparison: today the whole of `js/` is 1.9 MB and the vendored Tatham engines are 1.4 MB **[measured, du]**. Even the slim Lean port would add about 40 times the game's code.

### 6.3 Other options compared

| Option | Offline (file://) | GitHub Pages | Backend | Size | Notes |
|---|---|---|---|---|---|
| JS checkers (A/B) | Yes | Yes | No | KBs | Current architecture |
| [logic-solver](https://www.npmjs.com/package/logic-solver) 2.0.1 (MiniSat via Emscripten, MIT) | Probably (single-threaded JS) **[untested]** | Yes | No | ~305 KB JS **[verified tarball]** | Last published 2016; the repo was last pushed 2019 |
| [z3-solver](https://www.npmjs.com/package/z3-solver) 5.2.0 (MIT) | No | Only with a `coi-serviceworker` workaround | No | 35.8 MB unpacked (34.9 MB WASM) **[verified]** | README: needs threads and `SharedArrayBuffer` |
| Unofficial Lean WASM | No | Only with a workaround | No | 73–149 MB | Unofficial fork |
| Hosted lean4game or lean4web | No | The client only | **Yes**: a Linux server with nginx, pm2, elan and bubblewrap, one Lean process per player ([lean4game doc/hosting.md](https://github.com/leanprover-community/lean4game/blob/main/doc/hosting.md)) | n/a | Network-dependent; per-session memory is undocumented. lean4game's `bubblewrap.sh` sets a 1-hour CPU limit and notes that RSS limits are "not supported by modern linux" |
| Lean during authoring (E) | Yes (nothing ships) | Yes | No | 0 in the browser | Author or CI machine; `lake check` is Linux-only |

### 6.4 Asynchronous checks, technical failures and executable submissions

- **The synchronous boundary matters.** In `encounter.js`, `onSubmit` takes the return value of `def.check` immediately. Any `solved: false` increments `wrongs` and goes through `World.recordWrong`, which charges a heart once the free checks are used **[code]**. There is currently no result that means "not an attempt", "pending" or "technical failure".
- **What an asynchronous checker would need [proposal]:**
  1. A third result kind, for example `{ status: 'unavailable' }`, that changes neither `wrongs`, hearts, stars nor completion.
  2. A pending state that disables Check, with a timeout that resolves to "unavailable".
  3. An idempotent submission id, so that a late answer cannot be counted twice.
  4. Completion awarded only on a positive verdict, never on a timeout.

  This touches the encounter screen, the stakes clocks and tests. That is a real cost even before any Lean work.
- **Executable submissions.** In the JS designs above, a submission is inert JSON that is validated field by field. Nothing the student sends is executed. The existing Three Acts model parser avoids `eval` for the same reason **[code]**.
  - If students ever submitted Lean, then on a server we would need:
    - `lake comparator` with `permitted_axioms` limited to the three standard axioms;
    - a ban on `sorry`, `native_decide` and `implemented_by`;
    - bubblewrap isolation and CPU and wall-clock limits.
  - The comparator README warns that definition-hole challenges can be gamed and need an extra verifier ([comparator](https://github.com/leanprover/comparator)) **[verified]**. In a browser-only design the student controls the device anyway, so cheat-proofing is not achievable; Rift's stated stance is "deterrence, not surveillance" ([DESIGN.md](../AOK/Mathematics/Rift%20of%20Reason/design/DESIGN.md)).

## 7. Teaching and gameplay value

### 7.1 What is already possible or shipped (no new technology)

- **Different wirings, same truth table** (Switchboard wire, with tests of equivalent wirings).
- **Free routes and plans:** Line Drawer, water jugs, river crossing, Tower.
- **Impossibility proofs:** the Line Drawer odd-vertex certificate, and the Water Jugs gcd reason at d3.
- **Valid versus sound:** Venn's validity verdict, separate from premise support. Liar's Gate's "why?" text already says "Valid reasoning from shaky premises proves nothing."
- **A truth-table tool** in the Village.

### 7.2 New activities this research supports (all in JS) **[proposal]**

| Activity | What the student does | What the checker does | Why it is worth having |
|---|---|---|---|
| **Open Grid** (§3.1) | Builds any circuit on a 3×3 board | Placement, toolbox, wiring, then all rows | Freedom of route, and spatial planning on top of logic |
| **Restriction ladder** | Same goal, three rounds: open toolbox, then "no OR", then "no NOT" | Search marks the last round impossible (exclusive or without NOT); the student declares "impossible" and picks the reason (no NOT means a gate can never turn ON into OFF) | Proving something cannot be done, like Water Jugs d3. Axioms (the toolbox) shape what is provable |
| **Second construction bonus** | After solving, builds a structurally different circuit | Compares canonical forms; rejects the same tree laid out differently | Discovery and replayability; "same argument in different clothes" (already the Switchboard's `why` wording) |
| **Open verdict gate** (§3.2a) | Answers "settled / contradictory / not settled" | Enumeration; "not settled" needs two worlds as a counterexample | Underdetermination, and counterexample reasoning. Instances come from the 84–92 % of naive candidates that are not unique (§5) |
| **Write your own gate** (§3.2b) | Composes three guard statements from tiles | Unique world, right door, tile limits | Authorship: students see that the *premises* create the certainty. A seed or answer code could let classmates swap gates without a backend |
| **Design a square** (Village) | Places imps, then picks job statements that pin them down uniquely | The same uniqueness enumeration | Truth tables as a design tool, not just a solving tool |

### 7.3 What only a proof checker would add

A Logic-Game-style "show your steps" mode would check the reasoning, not just the result, for example ∧-introduction and →-elimination over a guard's statement.

Two cautions:

- That mode is a different and slower activity: the Logic Game has 98 levels to teach five connectives (§9).
- A small JS checker for a fixed natural-deduction rule set is also possible **[proposal, untested]**. Lean's advantage there is trust in the kernel and the ability to grow, which Rift does not currently need.

### 7.4 Pacing, language and the limits of a checker

- Feedback lines stay short and concrete: the row with its input values, the named rival world, the named broken rule.
- The experiment shows two rough edges to fix before production:
  - "Amber and Basalt and Cobalt all talk about doors" should use a list join, as `andList` already does in the Village.
  - Reporting only the first broken rule means a circuit with both a toolbox break and a behaviour error shows only the toolbox message. Whether to list both is a design choice for the playtest.
- A checker certifies only that the conclusion follows from the *encoded* rules. A gate that is "uniquely solvable" says nothing about whether real guards always lie. That is exactly the TOK point Liar's Gate already makes. Open Grid's success line should keep the honest wording "Every case of *this* circuit checked".
- Classroom time **[estimate]:** Open Grid takes 3–6 minutes per task. Write your own gate takes 5–10 minutes, longer than current stations, so it suits an optional side path or the end of a lesson.

## 8. Proposed small playtest **[proposal]**

- **Question:** does a broader solution space (open toolbox and placement, plus "find another way") improve engagement or understanding compared with today's fixed-palette wire mode?
- **Setup:**
  - One lesson, 20 minutes, one DP1 class split into two halves of about 10 students.
  - Both halves use the puzzle bench offline (`dev/puzzle.html?id=…&seed=…`), so there are no saves, hearts or rewards.
  - Fixed seeds, so both halves see equivalent targets.
- **Group A** (current): three Switchboard wire tasks at d2.
- **Group B** (prototype): three Open Grid tasks with the same targets. The third task has a restriction ladder ending in an impossible round, and a "second construction" prompt follows every solve.
- **Measures (no backend):**
  - Tasks completed, and wrong checks per task. The bench shows these, and the teacher records them.
  - For group B, how many students found a second, different construction.
  - A three-question exit slip:
    1. Enjoyment on a 1–5 scale.
    2. "Can there be more than one correct circuit? Why?"
    3. "Could you build 'exactly one of A, B' with no NOT? How do you know?"
  - Teacher notes on English comprehension of the feedback lines.
- **Decision rule:** continue if group B is at least as fast to a first solve, at least half of group B find a second construction, and B's answers to question 3 cite a reason rather than "I tried and failed" more often than A's. Otherwise keep the current wire mode.

## 9. Reusable projects and licences

All facts below are **[verified]** via the GitHub API and the repositories on 2026-10-14.

| Project | Licence | Current state | What it is | Reuse potential for Rift |
|---|---|---|---|---|
| [Lean 4](https://github.com/leanprover/lean4) | Apache-2.0 | v4.35.0 (2026-10-12) | Theorem prover and language | Authoring only, if ever (§4.3) |
| [lean4game](https://github.com/leanprover-community/lean4game) | **GPL-3.0** | Last commit 2026-10-11 (#539). No GitHub Releases; tags up to v4.33.1; `server/lean-toolchain` = v4.33.1 | Node/TypeScript relay that starts a sandboxed Lean process per player, a Lean `GameServer`, and a React 18/Vite client. Games are published by importing a public repo to adam.math.hhu.de. No client-only or offline mode is documented | **Mechanics, not the stack.** Worth borrowing: worlds as a dependency graph, rules unlocked as tools, inventory of allowed tactics. Copying code would bring GPL obligations, and the architecture needs a server |
| [Logic Game](https://github.com/trequetrum/lean4game-logic) | MIT (the LICENSE copyright line names the template author, Jon Eugster) | Last commit 2024-07-10; `lean-toolchain` v4.7.0 (stale) | 5 connectives (∧ → ¬ ∨ ↔) × tutorial and "Redux" worlds, 98 levels. Proof terms (`exact`/`have` only) first, then tactics. Story wrapping (party, Kraken). The README notes that `tauto` solves every level | Idea source: unlock named rules (modus ponens, modus tollens) as tools; let the same level be solved twice in two styles. Lean code is not reusable in Rift's runtime |
| [Knights and Knaves Lean game](https://github.com/JadAbouHawili/KnightsAndKnaves-Lean4Game) | MIT (template copyright line) | Last commit 2026-07-08; `lean-toolchain` v4.29.1; uses Mathlib | Worlds: Logic, Simp, Propositional K&K (8 levels), DSL K&K (14), Set-theory K&K (14). Three encodings: islanders as `Prop` with `↔` statements; a DSL with `axiom Islander`, `isKnight`/`isKnave` and `A said P` bridge axioms; and `Finset Knight/Knave` with disjointness | **Formalisation reference.** Its `knight_said` / `knave_said` bridge rules are a good model for a future "show your steps" mode in §7.3. Note that the DSL world introduces its universe by `axiom`, which a strict `#print axioms` audit would flag. Rift's own AST plus enumeration already covers the puzzle content |
| [lean4web](https://github.com/leanprover-community/lean4web) | Apache-2.0 | Last commit 2026-10-02 | Server-side Lean playground (live.lean-lang.org) | Only for a hosted option |
| [comparator](https://github.com/leanprover/comparator) and [SafeVerify](https://github.com/GasStationManager/SafeVerify) | Apache-2.0 | Comparator is deprecated in favour of `lake comparator` (Lean v4.35.0). SafeVerify is third-party, last push 2026-04-22 | Judges for untrusted proofs | Only if students ever submit Lean |
| [logic-solver](https://github.com/meteor/logic-solver) | MIT | npm 2.0.1 (2016) | MiniSat in JS | Fallback if enumeration outgrows the puzzles |

### Argdown, assessed separately

[Argdown](https://argdown.org/guide/) ([repo](https://github.com/christianvoigt/argdown)) is MIT according to its README and per-package licence files. The repo has no root LICENSE file, so the GitHub API reports none. The latest published `@argdown/core` is 2.0.1 (2026-04-27), and the main branch was last committed 2026-05-20.

**What it does:** a Markdown-like syntax for reconstructing arguments. It has premise–conclusion structures, inference lines that can carry metadata, statement equivalence classes and support/attack relations, and it renders argument maps. `@argdown/web-components` 2.0.2 is about 186 KB unpacked.

**What it does not do:** check logic. Its syntax docs say it "can not and will not check if the members of an equivalence class really are logically and semantically equivalent". They also say the parser "will not check if the different relations you have defined are logically consistent" ([argdown.org/syntax](https://argdown.org/syntax/)). Inference-rule labels are metadata only.

**Value for Rift:** a representation and mapping reference for the Tribunal and Oracle. For example, display a reconstructed argument as numbered premises and a conclusion, with attack and support arrows. It is not a validator, and it is not a Lean-style substitute.

## 10. Open questions

1. When a submission breaks a rule *and* gives the wrong output, should feedback list both (fuller) or only the first (shorter, today's style)? The playtest should decide.
2. Should a "second construction" count as different when it is the same tree on different cells? This report says no, using canonical forms; the teacher may disagree.
3. Should "Write your own gate" let students share gates through a short code, keeping to the no-backend, save-object rules? That needs a code format and a check on any received gate, using the same enumeration.
4. Is there a puzzle the teacher wants whose claim is general rather than finite? Only that would justify authoring-only Lean (§4.3).
5. Logic Game and Knights-and-Knaves LICENSE files carry the template author's copyright line. That is irrelevant if we borrow only ideas, as recommended, and should be clarified with the authors before copying any text.
6. Not measured here: real-device latency on school laptops (expected to be negligible, given 0.01–0.14 ms on this desktop), and how 16–17-year-old EAL students read the new feedback lines.

## 11. Recommendation and proposed follow-up

**Recommendation: do not adopt Lean, and prototype further with JavaScript.** Lean does not fit the deployment (no current official browser build, cross-origin isolation, 70+ MB, or a server). It also adds no guarantee for finite puzzles that exhaustive JS checks do not already give. The teacher's goal of open toolboxes, restrictions, different routes and knights-and-knaves variants can be met inside the existing `check(data, answer)` boundary. Keep "authoring-only Lean" on file for a future general-claim puzzle.

**Smallest useful next step:** a puzzle-bench-only prototype of Open Grid. It would reuse `checkGate` and the tree search from `research/lean-validation-2026-10-14/experiment.mjs`, as a Switchboard mode or a new puzzle file listed in `dev/puzzle.html`, and would not be placed on the map yet. After that, run the §8 playtest.

**Proposed follow-up scope** (separate issues; none authorised by #138):

1. **Open Grid prototype.**
   - Generator: target from `randomCircuit`, toolbox and blocked cells, and generation-time classification that rejects impossible tasks except in deliberate "prove it impossible" rounds.
   - Checker: rules first, then rows with the input values named.
   - Mount: grid placement plus keyboard controls, to match the Switchboard's accessibility.
   - Tests modelled on `switchboard.test.mjs`.
   - Dependencies: none new.
2. **Liar's Gate open verdict.**
   - Add `{ verdict: 'contradictory' | 'open' }` answers, and generate those instances from the candidates the generator currently discards.
   - Dependency: decide whether the d3 "why?" text should change.
3. **Write your own gate**, as an optional side station, after the playtest.
4. **A rules-from-data test** (§3.3), so the displayed restrictions cannot drift from the checker.
5. **(Only if an asynchronous checker is ever proposed) an encounter result kind for "unavailable"** that never costs hearts or awards completion (§6.4).

## Appendix: feasibility experiment

- **Files:** `research/lean-validation-2026-10-14/experiment.mjs` (code) and `output.txt` (the run below).
- **Run:** `node research/lean-validation-2026-10-14/experiment.mjs` from the repo root. Exit code 0 means every expectation held.
- **Isolation:** the script loads the game's classic scripts read-only through `tools/test/harness.mjs` (the same loader as the unit tests: a `vm` context with a fake `window`). It reuses the Switchboard's `randomCircuit` and `truthTable` and the Liar's Gate and Village solvers. It also contains its own independent evaluators for cross-checking, and it writes nothing to the game folder.
- **Why a runnable experiment rather than a paper analysis:** whether a JS property checker suffices is an empirical question about feedback, constraint handling and speed. A paper analysis is enough for Lean itself, because it cannot run here: Lean is not installed, there is no official browser build, and a hosted option is out of scope.

Actual output, run 2026-10-14 (timings vary slightly between runs):

```
PART A. Open-grid gate construction (exclusive or, 3x3 board, cracked cell at column 2 row 1,
        toolbox AND x2, OR x1, NOT x2, at most 5 plaques)

    orAndNotBoth   -> solved=true [ok] All 4 rows match, with 4 plaques. Every case checked.
    sumOfProducts  -> solved=true [ok] All 4 rows match, with 5 plaques. Every case checked.
    justOr         -> solved=false [behaviour] Row 4 (A ON, B ON): your bulb is lit, but the target says dark. 1 of 4 rows differ.
    wrongWire      -> solved=false [behaviour] Row 3 (A ON, B off): your bulb is dark, but the target says lit. 1 of 4 rows differ.
    wrongLast      -> solved=false [tool] You used 2 OR plaques, but the toolbox has 1. Can you build the same behaviour with other plaques?
    onCrack        -> solved=false [placement] The NOT plaque sits on a cracked cell (column 2, row 1). Cracked cells cannot hold a plaque.
    deMorgan       -> solved=false [tool] You used 2 OR plaques, but the toolbox has 1. Can you build the same behaviour with other plaques?
    backwards      -> solved=false [placement] A wire into the AND plaque in column 3 comes from column 3. Wires flow left to right.

  PASS two structurally different valid circuits both pass
  PASS near-miss "just OR" fails on behaviour with a counterexample row (row 4: A ON, B ON)
  PASS near-miss "wrong wire" fails on behaviour with partial credit 3/4 and counterexample row 3
  PASS near-miss "wrong last plaque" (also two ORs) is reported as a toolbox break, not behaviour
  PASS the three rule-breaking circuits really do produce the target (Switchboard evaluator)
  PASS cracked-cell circuit fails on placement
  PASS two-OR circuit fails on the toolbox rule
  PASS right-to-left wire fails on placement
  PASS the checker is deterministic (same answer, same result)

    Exhaustive search space: 4914 canonical trees over 2 inputs, 47838 over 3 inputs (up to 5 plaques); built once in 19.605 ms.
    Exclusive-or task: multiple, 2 valid constructions, e.g.
      (A OR B) AND NOT (A AND B)
      (A AND NOT B) OR (B AND NOT A)
  PASS exhaustive search finds several constructions for the exclusive-or task
  PASS every construction the search finds is accepted by checkGate
  PASS removing every NOT makes the task impossible (exclusive or is not monotone) and the search says so

    Seeded generated gate tasks (seed "gate-task:<i>"):
      seed  inputs  toolbox (A/O/N)  cracked  squeezed  verdict     constructions
         0       2  0/2/1            2.2      false     multiple    3
         1       3  1/1/1            2.3 1.1  false     unique      1
         2       2  0/0/1            2.1      true      impossible  0
         3       3  0/1/0            2.1 3.2  true      impossible  0
         4       3  0/1/0            2.3 3.2  true      impossible  0
         5       3  0/1/1            1.1      true      impossible  0
         6       2  1/1/1            1.2      false     unique      1
         7       3  1/0/0            2.1      true      impossible  0
         8       2  2/0/1            1.2 1.3  false     multiple    3
         9       3  0/1/1            1.2 1.3  true      impossible  0
        10       2  0/0/1            2.3 3.1  true      impossible  0
        11       2  1/1/1            3.2 1.1  false     multiple    2
      ... 200 tasks: {"impossible":59,"unique":54,"multiple":87,"degenerate":0}
      split: one plaque removed {"impossible":59,"unique":10}; one spare added {"multiple":87,"unique":44}
  PASS generation-time search classifies every seeded task (impossible / unique / multiple)
  PASS squeezed toolboxes produce some impossible tasks, which the search detects
  PASS checker accepts every construction the search found (560 checked)
  PASS AND<->OR mutations: checker verdict agrees with the Switchboard evaluator, failures carry a counterexample row
  PASS generated tasks repeat exactly for the same seed
    Mean generation-time analysis per task: 0.198 ms (after the one-off tree build).

PART B. Knights and knaves

  PASS Liar's Gate: 900 seeded puzzles (300 per difficulty) each have exactly one consistent world
  PASS Liar's Gate: the independent enumerator agrees with the game's solver on every one
    Mean generate + double enumeration per Liar's Gate puzzle (ms, d1/d2/d3): 1.806 / 0.745 / 1.497
  PASS Village: 300 seeded squares (100 per difficulty) each have exactly one consistent world

    Raw random statement sets (1,000 per size, seed "raw-kk:<n>:<k>:<i>"), classified by enumeration:
      guards doors  contradictory  unique  ambiguous(door fixed)  ambiguous(door open)
           2     2             85     145                     44                   726
           3     2             94     156                    103                   647
           4     3            112      84                     73                   731
           5     3            148      85                    100                   667
  PASS raw statement sets repeat exactly for the same seed

    Open-verdict checker:
      openOneWorld         -> solved=false  Your world fits, but so does another: Amber liar, Basalt liar, Cobalt honest; left door safe. The door is not settled.
      openTwoWorlds        -> solved=true  Both worlds fit every statement and disagree about the door. The guards do not settle it.
      openTwoWorldsSwapped -> solved=true  Both worlds fit every statement and disagree about the door. The guards do not settle it.
      openSameDoor         -> solved=false  Both your worlds fit, but they agree on the safe door. To show the door is not settled, find two worlds with different safe doors.
      badWorld             -> solved=false  Amber is honest in your world, but says something false there.
      badDeclared          -> solved=true  Right: every one of the 8 worlds breaks a statement. These premises cannot all hold.
      openDeclaredBad      -> solved=false  At least one world fits all the statements. Look for it before calling the gate impossible.
  PASS an ambiguous gate rejects a single consistent world and names a rival world
  PASS two consistent worlds with different doors prove the gate is open (either order)
  PASS two worlds with the same door do not prove openness
  PASS a contradictory gate is recognised by exhaustion; a world answer gets a named clash
  PASS calling a satisfiable gate contradictory fails

    "Write your own gate" construction (3 guards, right door must be the only safe answer):
      selfIf        -> solved=true [ok] Exactly one world fits: Amber honest, Basalt honest, Cobalt liar; right door safe. A careful traveller can deduce the right door.
      sameAnd       -> solved=true [ok] Exactly one world fits: Amber liar, Basalt honest, Cobalt liar; right door safe. A careful traveller can deduce the right door.
      nearMiss      -> solved=false [behaviour] 2 worlds fit, for example: (1) Amber honest, Basalt honest, Cobalt liar; right door safe and (2) Amber liar, Basalt liar, Cobalt honest; left door safe. Add or change a statement to rule one out.
      tooManyDoors  -> solved=false [tool] Amber and Basalt and Cobalt all talk about doors. Only one guard may mention a door.
      orTile        -> solved=false [tool] The "or" tile is not in your toolbox.
  PASS two structurally different gates both pass
  PASS the near-miss (two worlds fit) fails and names both worlds
  PASS a gate with a unique right-door world, but three door statements, fails on the toolbox rule
  PASS a gate that uses a tile outside the toolbox fails on the toolbox rule

    Latency per call (mean, Node v24.14.0):
      checkGate, 5-plaque circuit, 2 inputs       0.012 ms
      checkKK, 5 guards x 3 doors (96 worlds)     0.050 ms
      checkBuild, 3 guards x 2 doors              0.014 ms
      Liar's Gate check() (game code), d3         1.392 ms (includes generate)

ALL EXPECTATIONS HELD
```

What the experiment does **not** show:

- Any UI, or students' actual behaviour.
- Any performance on school laptops.
- Anything about Lean itself.
- The "unique" or "several" counts are canonical formula trees, up to mirror images, and exclude board layouts. The tile rules in "Write your own gate" are illustrative, not tuned.
