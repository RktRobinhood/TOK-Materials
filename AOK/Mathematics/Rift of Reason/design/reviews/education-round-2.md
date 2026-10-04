# Education review, round 2 — source and content

4 October 2026. Requested source review of #37–42 against baseline `f1bfcf6`; latest completed implementation commit at review was `e049a20` (#42). Read together with [round 1](education-round-1.md), [feedback audit](feedback-audit.md), [tutorial review](tutorial-round-2.md), [catching review](catching-review.md), and [card introduction](card-introduction.md).

The onboarding and feedback improvements address the principal access problems from round 1. All fourteen families now have free rules, worked examples and replayable tours. Success waits for Continue; boss stages retain their explanations. Witness gives claim-specific correction, hearts have visible rules, visitors arrive after learning, and cards have a safe introduction and an explicit changed-axiom comparison. This review initially found seven substantive content/checker problems. **The final focused source recheck confirms corrections to all seven at their named anchors. No remaining blocker was identified in that correction pass.** Passing generator tests does not by itself establish that English claims are correct.

## Coverage and limits

- Read all 54 current map definitions, the goals and first/repeat scripts of all 30 puzzle stations, and the associated original story and victory text across lessons 1–4. Story, rest, rumour and battle nodes were included in that text review.
- Read every family's current rules, tutorial text and TOK line. Inspected wrong/success feedback, hints/Why and checking sections against the feedback audit. Relevant deeper sections included Tower's displayed fact templates and logical implications, Rule Hunter's strategy classifier, Witness's complete scene/claim bank, Three Acts' reflection checker, and Tribunal's proof-repair case.
- Reviewed the source changes for encounter attempts/debriefs, post-success loot, catch mini-games and the guided/story battle. Earlier delegated checks replayed all 48 grid solutions, tested the legal guided sequence, and showed the empty-collection starter winning Syllo's fixed challenge under easy and hard learner AI policies. These are code observations, not pupil observations.
- **No browser traversal in this round.** No new visual, audio, accessibility, classroom timing, engagement or learning-outcome measurement is claimed. Primary-agent browser evidence in the linked reports remains separately attributed. This is not exhaustive checking of every random puzzle, proof expression or possible solution.

The primary agent was making content corrections while this review ran. The initial findings below are retained as review history. Their final dispositions apply to the working files inspected on 4 October, after `e049a20`; the primary agent will record the eventual commit and regression-test results. The final pass re-read only the named correction anchors, rather than repeat the complete initial review.

## Final dispositions after correction

| ID | Final source disposition and evidence |
|---|---|
| R2-01 | **Corrected at named templates.** School residents explicitly get up before dawn; inn guests have eaten pie; former tower entrants now carry watches; current watch carriers have met the Mayor; sweeps have never entered. Loft/shed trade, attic acquaintance and parade-arrival clauses also directly state the encoded facts. These changes remove the cited unstated causal/obedience assumptions. |
| R2-02 | **Corrected.** Candidate eliminations now drive feedback, partial credit, the result chip and the earned accolade. Positive discriminating tests are credited; a negative response alone is not labelled a discriminating strategy. The legacy `strategy` property remains response-count metadata and no longer drives those teaching/reward decisions. Why distinguishes a few observed cases from proof over unrestricted triples. |
| R2-03 | **Corrected.** The bakery False claim now says the figure was still in the shop when the cat jumped up, directly contradicting the narrated order. The hint permits what the scene clearly establishes and reserves False for contradiction. |
| R2-04 | **Corrected.** An otherwise successful model cannot claim missing needed information when every needed fact was requested; an exact prediction requires the matched reflection. Approximate predictions retain forgiving reflection choices. A direct Node probe of a generated hourglass solution with `reflection = 2` returned `solved: false`, with factual corrective feedback. |
| R2-05 | **Corrected.** Bridge/stone payoffs now cover route and pattern outcomes, school/hall describe passing the rules without asserting table use, workshop/Why avoid claiming red herrings were ignored, and stairs describes inputs or gates. Map goals agree with the circuit task. |
| R2-06 | **Corrected.** Gallery separates consequence from worldly premises; clockmaker bounds tables to these finite circuits; plaza admits testimony as evidence needing scrutiny. Predictor certainty is distinguished from a well-supported prediction, with the knowledge issue posed as a question. |
| R2-07 | **Corrected.** Picture Frame restricts the elementary theorem to convex polyhedra and explicitly avoids claiming an exhaustive classification. This is a safe domain for the Euler formula and the intended flattening proof. |

An additional direct Rule Hunter probe using the explicit ascending/sum-multiple-of-three/has-prime/equal-steps candidate fixture below produced two positive tests, all alternatives eliminated, `discriminating: true`, `partial: 1`, and appropriate feedback. This is source/engine evidence, not browser or pupil evidence. Regression suites are owned and reported by the primary agent; this report does not claim their final result.

## Initial substantive findings and scoped fixes (all corrected above)

### R2-01 — Tower still has English premises that do not entail its encoded consequences

**High priority; content.** `js/puzzles/tower.js`, `TEMPLATES`, retains several versions of the round-one correspondence problem:

- `school-dawn` says a bell **at dawn** wakes schoolhouse residents, but encodes `lodge:school → dawn`, where `dawn` means **get up before dawn**. Being woken at dawn does not establish that.
- `inn-pie` says guests are **served** pie, but encodes that they **have eaten** it. A guest can refuse it.
- `tower-watch` gives a watch to tower climbers, but encodes that they **currently carry** one. Receipt does not establish present possession/carrying.
- `watch-mayor` says watches are sold only by the Mayor, who meets customers, but applies this to **everyone carrying** a watch. A carrier could have received a gift.
- `sweep-tower` says sweeps are banned, but encodes that no sweep **has ever been inside**. A ban is not a statement that nobody previously entered.

These are instructional errors even if the formal solver is internally consistent: a player can reject an unsupported inference and be penalised. Preserve the engine and rewrite the premises as exact stipulated facts, for example “Everyone staying in the schoolhouse gets up before dawn” and “Every guest has eaten the goose pie.” Audit all displayed fact/atom pairs using the same standard. Do not rely on unstated assumptions about obedience, buying, eating or keeping gifts.

### R2-02 — Rule Hunter labels successful discrimination as confirmation bias

**High priority; feedback/classification.** `js/puzzles/rule-hunter.js`, `classify` and `checkRules`, calls a strategy `confirming-only` whenever every response is “fits”. A response is not the student's hypothesis or intention. A positive result can falsify a narrower candidate.

Reproduction fixture: rules mode, secret `ascending`, with the supplied alternatives `sum-mult-3`, `has-prime`, and `equal-steps`. Tests **[1,2,4]** and **[1,4,6]** both fit ascending and together rule out all alternatives. The initial result returned `eliminated: true` while saying the tests “can't tell your idea apart from other rules” and labelling them confirmation bias. This contradicts the tutorial's discriminating-test lesson. This explicit fixture supersedes the earlier seed notation, which did not regenerate the same candidate list in the final recheck.

Use the existing candidate eliminations to describe whether tests distinguished the displayed ideas. Do not infer confirmation bias solely from yes/no counts. If identifying the student's intention matters, ask for a predicted result before testing; that larger change is not necessary to remove the false feedback. Keep the distinction between identifying one rule among a supplied finite candidate set and proving a rule over an unrestricted domain.

### R2-03 — Witness's bakery cat claim confuses missing evidence with falsity

**High priority; scene/claim content.** `js/puzzles/witness.js`, bakery claim “The cat was on the counter before the figure left” is keyed **False** because the cat jumps up afterward. The scene never says it had not been there earlier. It could have been on the counter, jumped down, and returned after the figure left. Under this activity's strict evidence rules the claim is **Can't tell**.

Either change it to Can't tell, or use an explicitly contradicted claim such as “The figure was still in the shop when the cat jumped onto the counter.” Keep a False item in the scene so the generator's answer mix remains useful. Also change the hint “Only mark True if the scene SAYS it” to allow conclusions the scene establishes: the current bank itself accepts ordinary supported inferences such as a reading lamp being on. Distinguish unsupported inference from inference generally.

### R2-04 — Three Acts accepts a reflection contradicted by its own audit

**Medium priority; formative feedback/checker.** `js/puzzles/three-act.js`, `checkAnswer`, checks only that `reflection` is a valid index. A correct model with every necessary fact requested can select “Missing information: I did not ask for something that mattered” and still receive unconditional success.

Reproduction: generate a difficulty-2 hourglass, take `solve(data)` and set `reflection = 2`. The initial checker returned `solved: true`, `missing: []`, `tidy: true` for an exact prediction. It praised the information choice without discussing the contradictory reflection. The defect does not depend on a particular numeric answer or seed.

Do not require one rigid explanation where several are defensible. Reject or explain reflections that the recorded facts directly contradict, or make the reflection explicitly ungraded self-report and avoid claiming it was assessed. A small factual consistency check plus teaching feedback is enough; no new written assignment is needed.

### R2-05 — Original victory scripts still describe the wrong task or an unperformed method

**Medium priority; narrative.** The new first/repeat introductions help, but original `.win` scripts still run:

- `ch1.bridge.win` praises proving impossibility even when Line Drawer supplied a completed solvable route or dot drawing.
- `ch1.stone.win` describes a counterexample to a continuing pattern when the rolled family is Line Drawer.
- `ch2.school.win` and `ch2.hall.win` describe trusting/checking a table even when no table was used. Hall also includes a Switchboard stage, rather than only identifying villagers.
- `ch4.workshop.win` says the student ignored irrelevant information, although the checker deliberately allows requests for red herrings. `three-act.js:whyFor` makes the same unconditional process claim.
- `station.b-stairs` calls the hidden object an **input**, while the hidden mode can conceal the **AND/OR gate** instead.

Use the actual family/mode/result for these payoffs, or use neutral wording that is true for all allowed outcomes. Do not require table clicks solely to justify a narrator sentence. The neutral repaired `ch2.lane.win` is a suitable pattern.

### R2-06 — Three narrator claims blur the unit's logical distinctions

**Medium priority; content/narrative.**

- `lesson1.js:prologue.gallery.win`: “True means the world agrees. Mathematics needs both.” Mathematical truth is not simply agreement with the physical world; valid reasoning can operate within stipulated axioms. Replace with: a valid conclusion follows from its premises; whether the premises describe the world is a separate question.
- `lesson2.js:ch2.clockmaker.win`: “Every circuit has a truth table. So does every argument.” A finite propositional truth table is the model here, not a method covering every mathematical or ordinary argument. Limit the claim to these finite logical circuits/arguments.
- `lesson3.js:ch3.plaza`: “Asking anyone is not evidence.” Testimony can be evidence. A witness's popularity or reputation does not prove the mathematical claim. Say that instead.

The villain's confidence can remain theatrical. These statements are made by the instructional narrator/hero and should preserve the distinction between evidence, proof and truth. The toy predictor's counted frequencies are accurately described; the stronger philosophical claim that prediction cannot be knowledge should be framed as a question or tied to this machine's claim of certainty, rather than used as a settled definition of knowledge. That philosophical choice needs the teacher's judgement and is not classified here as a generator bug.

### R2-07 — Picture Frame's repaired theorem needs a defined domain

**Medium priority; proof-case content.** `data/cases.js`, Picture Frame `repair.options[lemma]` and `lesson`, certifies the theorem for “every solid with no hole through it” and then says the proof is valid and its exact domain is known. “Hole through” does not specify connectedness, one boundary, or treatment of cavities. The Euler count depends on those conditions; a single connected solid with an enclosed cavity has separate inner/outer boundary surfaces, despite no through-tunnel.

Use a clearly specified safe elementary class, such as convex polyhedra (explain: flat-faced solids with no dents), or state one closed connected surface that can be continuously reshaped into a sphere. Keep the frame counterexample and the lesson about repairing a hidden assumption. Avoid presenting “no visible tunnel” as a complete definition of the theorem's domain.

## All fourteen families: disposition

| Family | Source review outcome |
|---|---|
| Liar's Gate | Rules and worked supposition are coherent; conditional certainty is explicitly stated. No additional teaching error found. |
| Rule Hunter | Controls/examples are coherent; R2-02 discriminating-positive-test feedback is corrected. |
| Venn | All/Some/No and validity/truth separation are coherent. Diagram is explicitly a formative thinking tool, rather than a mandatory win condition. This no longer warrants claiming a checker bug; do not claim drawing proficiency from a correct verdict. |
| Line Drawer | Dot/route/impossibility modes and connected-graph odd-degree condition are explained. R2-05 story payoff is corrected. |
| Witness | Corrective sequence supports the intended distinction; R2-03 bakery classification and hint are corrected. |
| Village | Consistency feedback and table guidance are clear. Accolade/lane and R2-05 school/hall process claims are corrected. |
| Switchboard | Operator examples and three modes are coherent. ON/OFF versus removing a premise is corrected in checker/Why/TOK. R2-05/06 hidden-input/gate narration and table scope are corrected. |
| Tower | Atom-negation and proof-versus-truth debrief repairs are improvements. R2-01 named displayed-fact mismatches are corrected. |
| Tribunal | Cat case correctly leaves identity unsupported. Press/Present and correction are coherent; R2-07 Euler domain is corrected. |
| Chart Fixer | Repair plus interpretation is aligned; 95/100 example is mathematically sound. No additional error found. |
| Prediction | The counting model, reveal and required debrief are coherent. No algorithm/content mismatch found; R2-06 philosophical scope is corrected. |
| Sorting | Audit, confusion matrix, listed fixes, budget and value choices are aligned. No additional concrete error found. Goals are stipulated; this is not evidence of a universal fairness criterion. |
| Oracle | Sample testing is distinguished from universal proof. The negative-square-root label was corrected during review; explanation and label now agree. No additional concrete error identified. |
| Three Acts | Question/information/model/reveal sequence is coherent; R2-04/05 reflection consistency and process claims are corrected. |

## Repairs confirmed in the reviewed source

- **Round-one F1 repaired at the identified anchors:** Postmistress know/not-know and the pie implication use consistent atoms; dawn's negative answer is an actual negation. R2-01's further named English/fact mismatches are now corrected.
- **F2 repaired:** Oracle no longer recommends stamping a universal proof merely because two or three tests passed. Its square-root flaw label now correctly names treating equal squares as equal numbers.
- **F3 repaired:** the two-cat evidence undermines established identity rather than proves different cats appeared. Euler domain precision remains separate.
- **F4/F8 repaired:** durable stage explanations, per-stage boss Why, free rules/tours and worked examples address lost feedback and paid basic instruction. Formal controller evidence does not certify real-world comprehension.
- **F6 repaired at the identified anchors:** Truth-Tabler and Lane no longer assert unrecorded exhaustive table work. R2-05's other success scripts are now neutralised.
- **F9 repaired at the identified anchors:** Tower distinguishes lost proof support from a false conclusion; Switchboard explicitly says OFF is false, not a removed premise. R2-06's further narrator generalisations are corrected.
- **F10 materially improved:** catches expose base/skill/failure/final odds; both failed and successful skill moments remain probabilistic. The guided card lesson visibly compares the same 6-versus-4 cards under ordinary rules and Underdog using the real engine. Story stakes are safe, loaned starters suffice, and optional trainer wins do not mark host puzzles complete.

## Completion and handoff

R2-01..07 require no further game changes from this focused source recheck. Record the final correction commit and regression results beside these IDs in the #35 verification/handoff. Do not translate source review into claims of classroom mastery, experienced fun or complete UI coverage. The original whole-source review and final anchor recheck are complementary, bounded evidence, rather than exhaustive testing of every generated wording or proof.

These fixes preserve the four-lesson structure, puzzle generators and card/catch additions. Wider philosophical interviews, new historical content and a larger finale writing activity are not prerequisites for finishing this scoped correction pass.
