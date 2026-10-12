# Expansion persona roster review — #139

## Subsequent teacher delegation: cast selected by builder

The teacher explicitly removed teacher roster review and delegated meme-worthiness / teenage appeal to the builder. All 72 identities now have a recorded castDecision. Five weaker references were replaced: Chomsky → KSI (K-S-Ibis), Ardern → Olivia Rodrigo (Olivia Rodentgo), Amal Clooney → Jenna Ortega (Jenna Otterga), Lynch → Pedro Pascal (Pedro Ponycal), Björk → Ariana Grande (Ariana Crande). Sources for their public roles were checked against the verified KSI channel, Recording Academy, Netflix, Lucasfilm and Ariana's official site. These sources do not measure teenage familiarity; appeal is an explicit editorial judgement.

Keep the historical maths lane and selected niche creators where the independent prop/pose joke works without knowing the person. Artwork still follows the style board, readability and alpha checks. Mechanical strategy/balance, board integration and gameplay policy gates remain. Earlier references below to teacher familiarity/pun review are historical and superseded; no builder should wait for teacher roster approval.

All 72 creature concepts now have proposed public-persona mappings: twelve per each of the six colours. The pass drafts puns, silhouettes, one main prop, harmless joke angles, exact palette accents, source links, original voice directions and reusable sound keys. ART-BIBLE.md and the approved style board remain canonical. The seven already produced starter helpers are a separate small exception proposal, not a new generic-animal cast direction.

The JSON retains the original mechanical IDs, asset IDs, costs, stats, effect text, rarity, acquisition and release gates. Proposed name/silhouette changes do not change species identity or two-copy rules. Eighteen plot-only cards remain outside packs. Public roles were checked using linked official/institutional references; thin or inaccessible sources and class familiarity remain explicit review limits. The creative jokes and prop choices are proposals, not biographical claims. No celebrity voice impressions, lyrics, logos, private-life/victim jokes or new recordings.

Latest delegated-selection checks: persona/planning validators passed; full suite 805 tests, 804 passed, one skipped, zero failed (105,434 ms). Independent Standards review found no blockers; Spec found only stale CARD-DRAFTS mapping language, corrected along with DESIGN.md. Zero remaining findings. Cast changes introduce no runtime or recording changes.

## Validation

- `validate-personas.mjs`: 72 unique IDs, names and inspirations; twelve per colour; no current actor overlap; exact mechanical/acquisition/gate/asset/rarity preservation; accents match Rift.COLOURS; reusable keys exist in data/sfx.js.
- `validate-planning.mjs`: 210 additional concepts, 12 separate starters, 18 existing proposed story nodes, 192 pack candidates and exact colour allocation passed.
- Generator and validator syntax checks passed. Canonical roster regeneration is byte-stable. In an isolated temporary copy, an unrelated trailing builder section survived regeneration exactly and the second run retained identical bytes. The generator bounds changes with explicit start/end markers and fails on malformed markers.
- Full game suite: 805 tests, 804 passed, one skipped, zero failed; 104,016 ms. No game runtime, save, backup, audio manifest or recorded-voice files changed in this pass.

## Standards

Independent review found one P2: replacing the roster draft through EOF could remove later builder additions. Explicit bounded markers and exact-footer legacy migration resolved it; trailing content is preserved. Re-review found no remaining blocking standards findings or material refactoring smell.

## Spec

Independent review found one partial requirement: some voice briefs lacked exact existing sound keys. Every row now has validated sharedSfx keys, exposed in the Markdown voice table, selected per action rather than layered. Art/voice/Stage13/roadmap handoffs preserve the cast review gate. Re-review found no remaining missing requirement, incorrect implementation or scope creep.

One initial finding per axis, both resolved; zero remaining findings per axis. #139's drafting deliverable is complete. #123 still owns familiarity/pun/strategy/balance and small release batches; no expansion images or runtime cards are authorized by these draft rows alone. The next independent implementation is #113, using the seven existing starter portraits. The broader #129 pipeline remains open.
