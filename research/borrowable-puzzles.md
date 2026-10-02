# Borrowable puzzles for the TOK maths/logic adventure

Research date: 2026-10-01. Purpose: a catalogue of puzzle engines, public-domain texts, folk puzzle types, datasets and teacher sites that can be BORROWED for a plain HTML/JS, GitHub Pages TOK game for 16–17 year olds. Licences were checked against primary sources where marked **[verified]**; otherwise marked **[unverified — check before shipping]**.

Family colour key: **DED** Deduction · **SEE** Seeing vs knowing · **LANG** Language/definitions · **LAT** Lateral thinking/reframing · **AX** Hidden premise/axioms · **IND** Pattern breakers/induction

Effort: **L** = drop-in or < 1 day · **M** = a few days · **H** = a week+ or deep porting

---

## 1. Open-source puzzle engines with generators

### 1.1 Simon Tatham's Portable Puzzle Collection (the big one)

- URL: https://www.chiark.greenend.org.uk/~sgtatham/puzzles/
- Licence: **MIT** **[verified — doc/licence.html]**. Use, modify, redistribute freely; keep the copyright + licence notice. Fully compatible with a public education site.
- Source: C, ~40+ puzzles (57 games counting ports' list), every one with a **random generator** that guarantees a **uniquely solvable** instance at a chosen difficulty, plus a solver. Each puzzle accepts a **game ID / random seed** string, so a teacher can hand out "the same" puzzle to a whole class or let each student roll a fresh one.
- Browser builds:
  - **Official JS/WebAssembly build** — upstream ships `emcc.c`, `emcclib.js`, `emccpre.js` (Emscripten front end) and hosts per-puzzle browser pages on the chiark site (the "play in your browser" links). Can be self-hosted as static files (one `.js`/`.wasm` + one `.html` per puzzle) on GitHub Pages. Needs Emscripten to rebuild, but you can **copy the pre-built outputs** without building anything. [site was unreachable during this research; structure confirmed via the ports below]
  - **medmunds/puzzles-web** — https://github.com/medmunds/puzzles-web — **MIT** (app code; upstream puzzles MIT) [verified — repo README]. Polished, mobile-friendly PWA, live at https://puzzles.twistymaze.com/ with one page per puzzle (`/bridges`, `/blackbox`…) and shareable game IDs/seeds. Build uses Docker + Emscripten + pnpm, so for a no-build site you'd **link out or iframe** rather than vendor it.
  - **medmunds/puzzles** — https://github.com/medmunds/puzzles — older HTML5 port (Emscripten 1.29). Superseded by puzzles-web.
  - **yoniLavi/puzzles-ts** — https://github.com/yoniLavi/puzzles-ts — **MIT** [verified — repo README]. The whole collection (57 games + Lennard Sprong's extras) **re-written in pure TypeScript**, with hints that explain the next move. Vite build; not yet deployed (Oct 2026). **This is the most "stealable" form**: a single game's generator/solver module can be lifted and compiled once to plain JS. Very new, AI-assisted port, so check its quality before you rely on it.
- **Licence compatibility:** MIT means you can embed, modify, re-skin and ship on GitHub Pages; just keep a `LICENCE`/credits page listing "Simon Tatham et al." No copyleft issues.
- **Integration options (cheapest first):** (a) link out / iframe a twistymaze.com page with a fixed seed: **L**; (b) copy official Emscripten build files for 3–4 chosen puzzles into `/vendor/tatham/` and wrap them in an iframe with your own story frame: **L–M**; (c) lift TS modules from puzzles-ts to drive your own themed canvas UI: **M–H**.

#### Tatham puzzles by family (★ = strongest TOK hook)

| Puzzle | What it is | Family | TOK hook / why it fits | Replay | Effort |
|---|---|---|---|---|---|
| ★ **Black Box** | Fire rays into a box, infer hidden balls from deflections | IND, SEE | It's science in miniature: indirect observation and **underdetermination** (different hidden configurations can give identical evidence). Brilliant for "how do we know what we can't see?" | infinite | L (iframe) |
| ★ **Guess** | Mastermind | IND, DED | Hypothesis testing. Pairs with the 2-4-6 task: do students pick tests that could *falsify*? | infinite | L |
| ★ **Mines** | Minesweeper with a **no-guessing-required** generator | DED, AX | Knowledge vs lucky guess: every move can be *deduced*. Discuss "justified true belief". The generator guarantees this, unlike Windows Minesweeper | infinite | L |
| ★ **Untangle** | Drag vertices until no edges cross | SEE, LAT | Planarity: a graph that *looks* hopelessly tangled has a crossing-free drawing. Appearance ≠ structure. Fully mouse-driven | infinite | L |
| ★ **Map** | Colour a map with 4 colours | AX, DED | Four Colour Theorem, the first major **computer-assisted proof** (1976). Does a proof nobody can check by hand count as knowledge? | infinite | L |
| ★ **Fifteen / Sixteen / Twiddle** | Sliding/rotating permutation puzzles | AX, LAT | **Parity invariants**: half of all scrambles are impossible (Sam Loyd's 1880s "14–15" prize puzzle). An invariant proves impossibility without trying everything | infinite | L |
| **Undead** | Place ghosts/vampires/zombies seen (or not) via mirrors | SEE, DED | Ghosts are seen only in mirrors, vampires only directly: an observation depends on the instrument | infinite | L |
| **Loopy** | Slitherlink: draw a single loop | DED | Pure local-to-global deduction | infinite | L |
| **Bridges** | Hashiwokakero | DED | Constraint deduction plus a "connectedness" hidden premise | infinite | L |
| **Light Up** | Akari | DED | Contradiction reasoning ("if a lamp were here then…") | infinite | L |
| **Pattern** | Nonogram | DED, SEE | The picture only emerges from the logic | infinite | L |
| **Slant** | Diagonal-line, no-loops puzzle | DED, AX | A rule you don't notice ("no loops") does all the work | infinite | L |
| **Galaxies** | Divide grid into 180°-symmetric regions | SEE, DED | Symmetry as a constraint; satisfying "aha" | infinite | L |
| **Signpost** | Number path following arrows | DED, IND | Chain reasoning | infinite | L |
| **Unequal** | Futoshiki (Latin square with < >) | DED | Inequality chains | infinite | L |
| **Net** | Rotate tiles to connect a network | DED, AX | Rules out loops: a hidden axiom (it's a tree) | infinite | L |
| **Flood** | Flood-fill in N moves | LAT | Greedy vs strategic thinking | infinite | L |
| **Inertia** | Slide on ice to collect gems | LAT | Constrained-motion planning | infinite | L |
| **Pegs** | Peg solitaire | AX, LAT | Invariants again (colouring arguments) | infinite | L |
| **Cube** | Roll a cube to collect squares | LAT | Spatial reframing | infinite | L |
| Solo / Keen / Towers / Tents / Dominosa / Magnets / Pearl / Range / Tracks / Unruly / Filling / Palisade / Mosaic | Sudoku family and other grid-logic puzzles | DED | Good backup deduction pool; less TOK-specific | infinite | L |


### 1.2 Other open-source JS/TS puzzle libraries

Licences below were read from the GitHub API (`spdx_id`) on 2026-10-01 **[verified]** unless noted. **No licence = all rights reserved**: you can study it and re-implement the *idea*, but you can't copy the code.

| Name | URL | Licence | What it gives you | Family | Replay | Effort |
|---|---|---|---|---|---|---|
| **logic-puzzle-generator** (joshhills) | https://github.com/joshhills/logic-puzzle-generator (npm `logic-puzzle-generator`) | **MIT** | Zebra/Einstein logic-grid generator in TypeScript, runs in the browser. Guarantees a **unique solution**, has many clue types (ordinal, adjacency, disjunction, arithmetic…) and outputs a **proof chain** of the deductions. | DED, LANG | infinite | M (bundle once with esbuild into a single `.js`, then no build step) |
| **LogikGen** | https://github.com/KevinGundlach/LogikGen | MIT | Zebra generator in C#, useful as a reference algorithm only | DED | — | H |
| **tuchandra/zebra** | https://github.com/tuchandra/zebra | MIT | Python zebra generator/solver: a readable algorithm to port | DED | — | M |
| **dmackinnon1/knaves** | https://github.com/dmackinnon1/knaves · demo https://dmackinnon1.github.io/knaves/ | **No licence file** → all rights reserved | Plain-JS knights & knaves generator: always solvable, uses 3 statement types. **Copy the approach, not the code.** A brute-force K&K generator is about 80 lines (see §3) | DED | infinite | L to re-implement |
| nick-merrill/logic-puzzle-generator | https://github.com/nick-merrill/logic-puzzle-generator | check | K&K generator (Python) for reference | DED | — | — |
| **monkeyArms/nonogram** | https://github.com/monkeyArms/nonogram · https://monkeyarms.github.io/nonogram/ | **MIT** | Small (~8 KB) plain-JS library to create, solve and play nonograms; logical solver, no deps. Random grids give an "image emerges from logic" puzzle; checks uniqueness | DED, SEE | infinite | **L** |
| HandsomeOne/Nonogram | https://github.com/HandsomeOne/Nonogram | MIT | TS nonogram editor + solver, no deps | DED | infinite | L–M |
| **thomasahle/numberlink** | https://github.com/thomasahle/numberlink | **AGPL-3.0** ⚠ | Very fast Flow/Numberlink generator (Go). AGPL: if you embed it, your whole site's source must be AGPL. Fine for a public GitHub repo **if** you're happy to AGPL the game; otherwise only read it and re-implement | LAT, DED | infinite | H |
| abhishekpant93/numberlink-generator | https://github.com/abhishekpant93/numberlink-generator | No licence → re-implement only | JS Numberlink generator (random-walk paths) | LAT | infinite | M |
| **pzprjs / puzz.link** | https://github.com/robx/pzprjs · https://puzz.link/list.html | **MIT** | Browser player/editor for 100+ Nikoli-style genres (no generators); puzzles load from URL strings. Good for **hand-authored** set pieces | DED | low (authored) | L (link) / M (embed) |
| x-sheep/puzzles-unreleased | https://github.com/x-sheep/puzzles-unreleased | NOASSERTION (likely MIT like upstream, but check) | Extra Tatham-style genres | DED | infinite | M |
| **LogicEmu** | https://github.com/lvandeve/logicemu · https://lodev.org/logicemu/ | **MIT** | Browser logic-circuit emulator using ASCII-art circuits; you can build "wire the gates so the lamp lights" puzzles from a text string. Plain JS | AX | authored + param. | M |
| **SimcirJS** | https://github.com/kazuhikoarase/simcirjs · https://kazuhikoarase.github.io/simcirjs/ | **MIT** | Tiny drag-and-drop gate simulator (jQuery). Circuits are JSON, so you can generate "find the hidden premise: which gate is in the black box?" puzzles | AX, IND | infinite (random hidden gate) | **L–M** |
| CircuitVerse | https://github.com/CircuitVerse/CircuitVerse · https://circuitverse.org | MIT | Full circuit sim (Rails app). Embeddable iframes of public circuits | AX | authored | L (iframe) |
| hneemann/Digital | https://github.com/hneemann/Digital | GPL-3.0 (Java) | Desktop only, not for the browser | — | — | — |
| **venn.js** | https://github.com/benfred/venn.js | **MIT** | Area-proportional Venn/Euler diagrams (d3). Render syllogism diagrams; students click regions to shade them | LANG, DED | infinite | **L** |
| **JSXGraph** | https://github.com/jsxgraph/jsxgraph · https://jsxgraph.org | LGPL-3.0 (dual LGPL/MIT per its site) | Drag-able geometry, perfect for **"visual proofs that lie"** (missing square, Curry triangle, 64=65) and "drag to break the conjecture". Load from CDN; LGPL is fine unmodified | SEE, IND | param. | M |
| Mathigon textbooks | https://github.com/mathigon/textbooks | **© All rights reserved** (README) ⚠ | Beautiful interactive content (Euler paths, Königsberg, graph theory). **Look, don't copy**; link students to mathigon.org/polypad | — | — | link only |

**GPL/AGPL notes for a public education site.** MIT/BSD/LGPL-via-CDN: just add a credits page. GPL-3 JS embedded in your pages makes the combined game GPL-3. That's legally fine for a free public GitHub repo (you'd license your game code GPL-3 and keep the source public, which GitHub Pages does anyway), but it stops you or the school from ever making a closed version. AGPL is the same, plus network use counts as distribution. **Rule of thumb: prefer MIT and re-implement anything GPL/AGPL/unlicensed from the idea.** Puzzle *rules* and *mechanics* are not copyrightable; code and text are.

---

## 2. Public-domain classic puzzle sources

**Copyright status.** Carroll (d. 1898), Rouse Ball (d. 1925), Dudeney (d. 1930), Loyd Sr (d. 1911) and Loyd Jr, who compiled the Cyclopedia (d. 1934), are all **public domain in the EU (life + 70) and the US (pre-1931)**. You can copy **text and diagrams verbatim**. Credit them anyway; it's good TOK practice. Gutenberg numbers were checked on gutenberg.org search **[verified]**. Modern editions with new notes or typesetting (e.g. Dover reprints with added commentary) can have their own copyright, so take text from the Gutenberg or archive.org scans.

| Source | URL | Best puzzles for the game | Family | Generator potential |
|---|---|---|---|---|
| **Lewis Carroll, *Symbolic Logic* Part I (1896)** | https://www.gutenberg.org/ebooks/28696 | **Sorites**: chains of 3–10 silly premises ("No ducks waltz; No officers ever decline to waltz; All my poultry are ducks" ⇒ ?). Also Carroll's biliteral/triliteral diagrams. | LANG, DED | **High.** A sorites is a shuffled chain A⊂B⊂C… with some terms negated and contraposed, so you can generate endless ones from a vocabulary list. Mouse: drag premise cards into a chain, then drag the conclusion out. Carroll's own sets give the "authentic" level. |
| **Lewis Carroll, *The Game of Logic* (1886)** | https://www.gutenberg.org/ebooks/4763 | A literal **board game**: put red (occupied) and grey (empty) counters on a square diagram to represent premises, then read off the conclusion. | LANG, DED | **High, and mouse-native.** A random syllogism generator plus a clickable Carroll diagram, essentially the original rules. Contrast it with Venn diagrams to show that notation shapes thought. |
| Lewis Carroll, *A Tangled Tale* (1885) | https://www.gutenberg.org/ebooks/29042 | 10 "Knots", story problems with Carroll's commentary on readers' wrong answers. More arithmetic than you want; mine the commentary for "how do we judge an answer?" | AX (light) | Low |
| Lewis Carroll, "What the Tortoise Said to Achilles" (*Mind*, 1895) | Wikisource (search title) | Infinite regress of inference rules: why accept modus ponens? **A perfect "hidden axiom" cutscene.** | AX | n/a (narrative) |
| **H. E. Dudeney, *Amusements in Mathematics* (1917)** | https://www.gutenberg.org/ebooks/16713 | Sections on **unicursal & route problems** (Euler paths), **river-crossing**, moving-counter puzzles, measuring/weighing (jugs), chessboard problems, dissections, magic squares, "puzzle games" (Nim-like). About 430 puzzles with answers. | LAT, DED, AX | Med. Use as **seed set-pieces** and re-skin the mechanics with generators (§3). |
| **H. E. Dudeney, *The Canterbury Puzzles* (1907)** | https://www.gutenberg.org/ebooks/27635 | Story-framed puzzles (Chaucer's pilgrims) that fit an **adventure framing**. Includes the **Haberdasher's puzzle** (triangle→square dissection, draggable hinged pieces: SEE), plus route, river and counter puzzles. | SEE, LAT | Med (authored) |
| **W. W. Rouse Ball, *Mathematical Recreations and Essays*** | https://www.gutenberg.org/ebooks/26839 | Königsberg/unicursal figures, Tower of Hanoi, 15-puzzle parity, Kirkman's schoolgirls, map colouring, and **geometrical fallacies** (e.g. "every triangle is isosceles"). The fallacies are gold for "visual proofs that lie". | SEE, AX, LAT | Med |
| **Sam Loyd, *Cyclopedia of 5000 Puzzles, Tricks and Conundrums* (1914)** | https://archive.org/details/CyclopediaOfPuzzlesLoyd · Wikisource: https://en.wikisource.org/wiki/Sam_Loyd%27s_Cyclopedia_of_5000_Puzzles_Tricks_and_Conundrums · Commons PDF | Contains the **nine-dots puzzle** (an early printed source), **Get Off the Earth** (vanishing-man paradox: SEE), Trick Mules, the 14–15 puzzle, plus rebuses and conundrums (LANG). **TOK twist:** Loyd claimed puzzles he didn't invent (e.g. the 15-puzzle, really Noyes Chapman's), so it's a lesson in source reliability. | LAT, SEE, LANG | Low–Med (authored; illustrations reusable) |
| John Scott, *The Puzzle King* | https://www.gutenberg.org/ebooks/52052 | Victorian "catches", paradoxes and quibbles: word-trick riddles (LANG) | LANG, LAT | Low (authored pool) |
| W. F. White, *A Scrap-Book of Elementary Mathematics* (1908) | https://www.gutenberg.org/ebooks/40624 | Fallacies, paradoxes, curiosities | SEE, AX | Low |
| H. Schubert, *Mathematical Essays and Recreations* | https://www.gutenberg.org/ebooks/25387 | Essays (e.g. squaring the circle, magic squares): background reading | AX | — |

**Copyrighted, so mechanics only:** Smullyan (knights & knaves *as he phrased them*, "What is the Name of this Book?"), Martin Gardner, Paul Sloane (lateral thinking "situation puzzles"), Boolos ("Hardest Logic Puzzle Ever" text), Wason's original papers (cite them, don't copy the materials). The *types* (liar/truth-teller islands, three gods, situation puzzles) are free to re-implement in your own words.

---

## 3. Classic folk puzzles and tropes, free to re-implement

Ideas and rules aren't copyrightable, so all of these can be written from scratch in plain JS. "Gen" = how to vary it procedurally; "Mouse" = interaction.

| Puzzle / trope | Family | Gen (variation) | Mouse interaction | Effort |
|---|---|---|---|---|
| **Knights & knaves (+ spies, normals)** | DED | Random truth assignment for 2–5 islanders; pick random statement templates (accuse, affirm, "exactly one of us…", "X and I are the same type", conditionals); brute-force all 2^n assignments; keep only uniquely solvable sets. Scale difficulty by n and template mix | Click each islander to toggle K/N; optional truth-table panel; speech bubbles revealed on hover | **L** |
| **Two doors / two guards** (one liar, one truthful) | DED, LANG | Randomise which door is safe and which guard lies; the student builds a question from clickable phrase tiles, and the game **evaluates any question** by simulation, so multiple valid solutions exist | Drag-and-drop question builder | M |
| Three gods ("Hardest logic puzzle", da/ja) | DED, LANG | Random da/ja meaning and god placement; same question-builder engine | Phrase tiles | H (bonus) |
| **Wason 2-4-6** | IND | Random hidden rule from a pool (ascending; even; sum<20; any distinct; middle is mean…). The student proposes triples, gets yes/no, then commits a guess. **Score falsifying tests** | Click number dials, "test" button, log of tests | **L** |
| **Wason selection task (4 cards)** | IND, LANG | Random abstract vs social framing (drinking age) shows the content effect | Click cards to flip | L |
| **Moser's circle / pattern breakers** | IND | Drag points on a circle and count regions 1,2,4,8,16,**31**. Also "guess the next term" sequences with **multiple valid generating rules** (accept any rule the student enters as a formula and checks) | Drag points; regions auto-shaded | L–M |
| Large-counterexample conjectures (n²+n+41 primes, Pólya, Borwein integrals) | IND | Parameterised "keep testing until it breaks" machine | Slider / step button | L |
| **One-stroke drawing / Euler paths, Königsberg** | LAT, AX | Random graph; control odd-degree vertex count (0 = circuit, 2 = path, >2 = **impossible**, so the student must *prove* impossibility by counting) | Trace edges with the mouse; "it's impossible" button | **L** |
| **Nine dots** (and 16 dots in 6 lines, etc.) | LAT | Grid sizes n×n with a line-count budget; the canvas extends beyond the box | Click-to-place line endpoints | L |
| **Matchstick equations** (Roman numerals, move 1 stick) | LAT | Generate equations from a 7-segment digit graph; BFS over single moves to find **all** valid solutions (often several) | Drag matches | M |
| **River crossing** (wolf-goat-cabbage, missionaries & cannibals, jealous couples, bridge-and-torch) | DED, AX | Random items + random "can't be left together" graph + boat capacity; BFS solver confirms solvability and finds the optimum. **Hidden premise:** can the boat cross empty? Can things be thrown? | Drag items into boat, click to cross | M |
| **Water jugs** (Die Hard) | LAT | Random capacities a,b, target t (solvable iff gcd(a,b) divides t); BFS | Click fill/empty/pour | L |
| **Tower of Hanoi** | IND, LAT | n discs; ask students to *predict* 2^n − 1 before proving it (induction in both senses) | Drag discs | L |
| **Lights Out** | DED, AX | Random solvable states (linear algebra over GF(2) proves solvability; some boards are unsolvable) | Click cells | L |
| **15-puzzle parity** | AX | Offer "impossible" scrambles (Loyd's 14–15); the student must argue *why* | Slide tiles | L |
| **Monty Hall** (+ variants: 100 doors, Monty Fall, ignorant host) | IND, AX | Hidden premise: *does the host know?* Run 1000 simulations with one click | Click doors; histogram | L |
| **Three utilities (K3,3)** | LAT, AX | Impossible on a plane but **possible on a torus/mug**: reframing changes the axioms | Drag pipes; a toggle wraps the edges | M |
| **Missing square / Curry triangle / 64 = 65 / Get Off the Earth** | SEE | Parameterise Fibonacci dissections (F(n−1)·F(n+1) − F(n)² = ±1); zoom reveals the sliver | Drag pieces; magnifier | M |
| **Misleading charts** | SEE | Random dataset plus a random "trick" (truncated axis, dual axes, cherry-picked window, area-scaled icons, log vs linear, Simpson's paradox) | Spot-the-trick: click the offending element; toggle "honest view" | **L** |
| **Optical illusions** (Müller-Lyer, café wall, checker shadow, Ebbinghaus) | SEE | Random parameters; the student adjusts until lines "look equal", then the game measures their bias | Slider/drag + reveal ruler | L |
| **Prisoners and hats** (2 colours in a line, 100 prisoners) | DED, AX | Random hats; the student designs a strategy from blocks (parity) and simulation scores it | Strategy builder | M–H |
| **Muddy children / blue-eyed islanders** | DED | n children, k muddy; day-by-day common-knowledge simulation | Step through days; click who steps forward | M |
| **Liar paradox / Berry / barber / Grelling** | LANG, AX | Statement-card sets where the student marks T/F and the engine flags contradictions. Some sets are **paradoxical** (no consistent assignment) | Toggle cards | L (reuses K&K engine) |
| **Zeno (Achilles, dichotomy)** | AX, IND | Animated halving; partial sums converge | Step/zoom slider | L |
| **Syllogism validity** (All/Some/No; Barbara, Celarent… plus invalid forms) | LANG, DED | Random mood/figure and terms; belief-bias trials with *believable but invalid* conclusions | Shade Venn regions; click valid/invalid | **L** |
| **Ambiguity puzzles** (scope: "every student read a book"; "I saw the man with the telescope") | LANG | Template sentences; the student drags pictures to match each reading | Picture matching | L–M |
| **Zebra / Einstein puzzle** | DED | Use `logic-puzzle-generator` (MIT) | Click grid ✓/✗ | M |
| **Logic-gate black box** | AX, IND | Random hidden gate or 2-gate circuit; the student toggles inputs, observes output, names the circuit. **Underdetermination:** some circuits are indistinguishable with the allowed tests | Toggle switches; drag gates to "build your hypothesis" | M |
| Bridges of Königsberg "add a bridge" | AX, LAT | Random city graph; the student adds/removes the minimum bridges to make a walk possible | Click to add a bridge | L |
| Coin weighing (12 coins, 3 weighings) | DED | Random counterfeit and n coins; the student drags coins onto scales | Drag + weigh | M |

---

## 4. Free / open datasets of riddles and logic puzzles

| Dataset | URL | Licence | Notes | Fit |
|---|---|---|---|---|
| **flyingfishinwater/riddle** | https://huggingface.co/datasets/flyingfishinwater/riddle | **Apache-2.0** (per HF card, via search) | 585 English riddles with answers. Usable with attribution; vet the content | LANG, LAT |
| RiddleSense (INK-USC) | https://huggingface.co/datasets/INK-USC/riddle_sense | Scraped from fan sites; "terms of use of fan websites" ⚠ | Multiple-choice riddles. **Licence unclear, so don't redistribute**; use for inspiration only | LANG |
| BRAINTEASER (SemEval-2024) | https://arxiv.org/abs/2310.05057 | Puzzles described as folk knowledge from websites "for noncommercial use without modification" ⚠ | Sentence and word lateral-thinking puzzles. **Can't modify, so poor fit**; inspiration only | LAT |
| Visual Riddles | https://huggingface.co/datasets/visual-riddles/visual-riddles | Apache-2.0 (per search result) | Image + commonsense riddles; the images may have their own terms | SEE |
| **Puzzling StackExchange data dump** | https://puzzling.stackexchange.com · archive.org "stackexchange" dumps | **CC BY-SA** (4.0 for posts after May 2018; 3.0 earlier) | Thousands of riddles and logic puzzles. Reuse **with attribution (author + link)**, and adapted text must stay CC BY-SA. That applies to the *text* only, not your game code | all |
| Gutenberg texts (§2) | — | Public domain | Best "dataset" for Carroll sorites and Dudeney/Loyd set pieces: parse Carroll's sorites into JSON once | LANG, DED |
| Wikipedia lists ("List of paradoxes", "Riddle", "Lateral thinking") | wikipedia.org | CC BY-SA 4.0 | Good source list of paradox/illusion *names*; write your own text | all |

**Recommendation:** for riddles, hand-write 30–50 in your own words, plus Carroll/Loyd PD originals, plus a few attributed Puzzling SE items. Avoid the scraped ML datasets for anything you publish.

---

## 5. Educational puzzle sites teachers borrow from

| Site | URL | Licence / terms | How to borrow |
|---|---|---|---|
| **NRICH** (Cambridge) | https://nrich.maths.org | **© University of Cambridge, all rights reserved** **[verified — /terms]**. Teachers may copy for their own students; **no mirroring on the web**; no text/data mining or AI training without permission | **Link out** to specific tasks; re-implement the *mechanic* in your own words. Don't paste their text into the game |
| **MathPickle** (Gordon Hamilton) | https://mathpickle.com | Creative Commons (the About page shows a CC badge; **variant not confirmed**) ⚠ | Check the badge. If it's BY-NC(-SA), fine for a free school site with attribution. Great "unsolved problem" puzzles for "what counts as knowing?" |
| **Puzzling StackExchange** | https://puzzling.stackexchange.com | CC BY-SA 4.0 (newer posts) | Attribute author + URL; share-alike on adapted text |
| **Mathigon / Polypad** (now Amplify) | https://mathigon.org · https://polypad.amplify.com | Textbook source **© all rights reserved** (GitHub README) **[verified]** | Link to Polypad canvases; students can build Euler graphs and tangrams there |
| **Desmos Classroom** (Amplify) | https://teacher.desmos.com | Proprietary platform terms; activities are shareable *links* | Link out for "graph that lies" activities. Don't copy into your game |
| **Dan Meyer three-act tasks** | https://www.danmeyer.com · 101qs | Historically shared openly (CC-style) ⚠ unverified | Borrow the **structure** (show → wonder → reveal); it suits "Seeing vs knowing" cutscenes |
| Brilliant.org | https://brilliant.org | Proprietary | Inspiration only. Their logic courses show good UI patterns |
| Wikipedia / Wikimedia Commons | — | CC BY-SA 4.0 / per-file (many illusion images are PD or CC) | Illusion images: check each file's licence on Commons |
| Cut-the-Knot (Bogomolny) | https://www.cut-the-knot.org | © all rights reserved | Ideas only (huge archive of interactive proofs-without-words) |

---

## 6. Making it hard to "just paste into ChatGPT"

- **Per-student seeds:** every puzzle is generated from a seed shown on screen, so the answer to one student's puzzle doesn't solve another's.
- **State lives in the mouse, not in text:** Untangle, Euler tracing, Black Box, the gate black box and the 2-4-6 *test log* aren't pasteable as one prompt, and the *process* (e.g. how many falsifying tests a student ran) is scored, not just the answer.
- **Ask for a justification move:** after solving K&K, click the *one statement* that forces the answer. After an "impossible" Euler puzzle, click the odd-degree vertices.
- **Include impossible and paradoxical instances**, where the right answer is "can't be done / no consistent assignment". Overconfident solvers (human or AI) get caught: a very TOK lesson.

---

## 7. Recommended STEAL LIST (ranked by fun × replayability × fit × low effort)

| # | System | Family | Source to borrow | Why | Effort |
|---|---|---|---|---|---|
| 1 | **Knights & knaves generator** (+ liar-paradox mode that sometimes produces *no* consistent answer) | DED, LANG | Own code (brute-force 2^n); approach from dmackinnon1/knaves (no licence: idea only) | Endless, uniquely solvable, scales with n, classic TOK hook | **L** |
| 2 | **2-4-6 rule hunter** | IND | Own code; Wason (1960) as the cited idea | The single best confirmation-bias experience; scores falsification | **L** |
| 3 | **Syllogism / sorites board** (Carroll Game-of-Logic counters ↔ Venn shading) | LANG, DED | Carroll PD texts (#4763, #28696) + venn.js (MIT) or hand SVG | All/some/none made tactile; Carroll's absurd premises split validity from truth | **L–M** |
| 4 | **One-stroke / Euler path generator** (with impossible Königsberg-style cases) + **Nine dots** as a set piece | LAT, AX | Own code; Dudeney/Rouse Ball/Loyd PD for flavour | Mouse-native, infinite, teaches "prove it can't be done" | **L** |
| 5 | **Tatham Black Box** | IND, SEE | Tatham (MIT), iframe/self-host | Science-as-inference and underdetermination, zero dev cost | **L** |
| 6 | **Tatham Untangle** | SEE, LAT | Tatham (MIT) | Appearance vs structure, very satisfying | **L** |
| 7 | **Moser's circle + "sequences with many rules"** | IND | Own code | The canonical pattern breaker (1,2,4,8,16,31); accepts multiple valid answers | **L–M** |
| 8 | **Misleading-chart spotter** | SEE | Own code (canvas/SVG) | Highly replayable, real-world relevance, quick to build | **L** |
| 9 | **Logic-gate black box** | AX, IND | SimcirJS (MIT) / LogicEmu (MIT) or own SVG | Hidden premises + hypothesis testing; links maths to tech | **M** |
| 10 | **River-crossing generator with BFS solver** | DED, AX | Own code; Dudeney PD variants as named levels | Random constraint graphs; the "hidden rules" discussion (can the boat go empty?) | **M** |
| 11 | **Lying visual proofs** (missing square / 64=65 / every triangle is isosceles) | SEE | JSXGraph (LGPL via CDN) or own SVG; Rouse Ball/Loyd PD | "Seeing isn't knowing" in its purest form; Fibonacci parameterisation gives variety | **M** |
| 12 | **Tatham Mines (no-guess) + Fifteen (impossible parity)** | DED, AX | Tatham (MIT) | Knowledge vs luck; invariants prove impossibility | **L** |

Runners-up: Zebra via `logic-puzzle-generator` (MIT, M), Monty Hall simulator (L), Wason selection task (L), two-guards question builder (M), Tatham Map for the four-colour/computer-proof discussion (L).

### Lesson 1 ("Reason"): the four to build first

1. **Knights & knaves** → *deduction* (certainty from premises).
2. **2-4-6 rule hunter** → *induction and confirmation bias* (why we can't verify, only falsify).
3. **Carroll/Venn syllogism board** → *all/some/none*; valid ≠ true.
4. **One-stroke Euler paths with a nine-dots opener** → *lateral thinking*: reframing ("outside the box") and proving impossibility.

All four are plain JS/SVG with no dependencies (venn.js optional), procedurally generated, mouse-driven, have uniquely checkable answers or score the process, and could each be built in about a day.

### Still to verify before shipping
- The official Tatham JS build files and URL/seed syntax (chiark site timed out during research).
- The exact MathPickle CC variant, Dan Meyer's licence, and the dmackinnon1/knaves licence (none found, so treat it as all rights reserved).
- The x-sheep/puzzles-unreleased licence (NOASSERTION on GitHub).
