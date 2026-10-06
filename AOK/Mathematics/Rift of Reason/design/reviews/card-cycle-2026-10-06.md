# Card-cycle rebuild — release evidence, 6 October 2026

Scope: this activity only, on main. Baseline `4bb36f9`. The teacher's two October6 requests are recorded in #44 and `../card-cycle-2026-10-06.md`. They replace the old one-action/automatic-axiom battle design. The follow-up art request is fulfilled by `../source-assets/card-cycle-art-brief.md`.

## Result

Six hearts; energy capacity grows1→2→3 to10 and refills; three actions with explicit End turn. Play, paid activation, attack and paid rewrite each spend an action. Attack/block/activate exhaust; arriving creatures may block. Passive effects remain; paid skills never fire automatically on play. Program gains a skill but requires a later paid activation. Axiomatic offers five choices with one activation payment.

Collection builds ten distinct axioms. Opponent contributes ten; both selections are shuffled into twenty cards, retaining duplicate copies across sides. Selected rules travel in ghost codes and survive save migration. Fixed teaching/story decks are explained exceptions. Several rule categories persist together. Current rules, costs, remaining actions and the actual victory condition are displayed. Underdog and own-zero-hearts victory are demonstrated in practice.

The central Fate track advances on each End turn, flips a free rule after six spaces, resets all rules six later, then alternates. Filter advances two; Next Year delays two, capped at twelve away. A skill reaching zero triggers the event immediately. Delayed spells and timed creature arrivals remain future design ideas.

## Browser observations

- Completed all sixteen real-engine practice steps, including keyboard End turn, paid play/ability, preserving a blocker, multiple actions, persistent Underdog plus reversed victory, and winning with own zero hearts.
- In a normal match, played a creature for1energy without ending the turn, observed arriving/readiness, paid2energy for Two Paths, saw the spent rewrite reduce remaining allowance immediately, and attacked using the remaining action.
- In another match the AI paid to introduce Underdog and attacked with a weaker creature; the block preview correctly warned that the stronger defender loses. Activated Well, Actually for2energy, drew one, exhausted the creature and retained the turn.
- Deck editor rejected Save with nine chosen, accepted a replacement tenth, and reopening retained it.
- Corrected a clipped-card layout found at1280×720: board rows now use max-content sizing, preserving card labels; your budget and action controls remain sticky while the table scrolls. DOM geometry confirmed board height248.5 versus card214.2. Safe centring keeps the first card reachable in wide hands. Developer bench now loads the existing manifest and resolves its asset base correctly.
- Source reviews independently checked standards and requirements. Their prompt/rule contradictions, mislabelled Granny budget, free Program trigger and victory-blind Axiomatic choice were corrected; final reviews found no blockers. They were source reviews, not independent classroom trials.

## Balance evidence and limits

The final simulator supplies random ten-card selections from each side. Seed `cycle-shared-2026-10-06`:1,000 Hard/Hard matches, first-player62.4% of decided games,2.6% draws,26.93 personal turns on average. Another2,000 Hard/Easy matches in both seats: Hard71.7%, no draws. See `card-balance-followup.md` and #45 for a concrete next tuning task. These are AI samples, not human win rates or evidence of classroom fun. The visible bounded draw remains.

Actual file:// navigation remains blocked by the browser; HTTP preview and classic-script/source dependency checks substitute. No bypass was attempted.

## Audio

Sixteen settled new Granny steps and five remaining lesson-one story lines were recorded after the October6 Pacific reset, using the pinned voices/styles and per-line acting metadata. The remaining daily allowance records settled later-story/creature lines. Eight obsolete old tutorial clips were backed up outside the repository and pruned with the voice tool. New texts use their own hashes, so stale narration cannot describe old mechanics.

Final audio:55 new clips,439/502 current lines recorded,63 still missing in22 default requests. Both pinned models used ten actual attempts for Pacific day2026-10-06. One failed Siuuugull split was recovered through2+1 requests. Local ASR covered all55 clips; two neighbouring-word cut errors (Fin’s Probably and Core’s Fair) were repaired from existing audio, then transcribed again. Hashes, expected text, approximate transcripts and limits are in `card-cycle-voice-checks-2026-10-06.json`. No extra TTS requests were used for those repairs. ASR is approximate, especially names/exclamations; it does not certify acting or every word.

## Final verification

### Standards

Final source recheck found no concrete blockers. Native labelled checkboxes, announced deck count, guarded ten-card save, calm-motion guards and classic scripts conform to AGENTS.md. Rules-dependent prompts and the tutorial's active-player budget were corrected. Activation helper names now describe their actual behaviour. This axis did not independently repeat browser/test verification.

### Spec

Final source recheck found no new blockers. Ten per-side selections, duplicates across contributions, deterministic shuffle, seeded NPC selections, ghost round trips, default old-save selection and exact-ten saving match the revised brief. Fate advances on End turn, triggers through Filter at zero, caps delays and clones before mutation. Paid costs/exhaustion survive rule changes. Program's free skill and Axiomatic's victory-blind AI choice are fixed. Fixed teaching decks and five Axiomatic offers are explicit exceptions. This axis did not independently repeat browser verification.

Remaining review findings: zero blockers per axis. Balance limits are the separate measured follow-up #45.

Full suite:353 passing, including10,000 simulated games with card-zone/controller invariants and a deck covering every axiom. A further29 targeted engine/launcher/tutorial/voice checks passed after final log wording and audio repairs. A separate3,000-game shared-deck balance run completed with the figures above. Both source-review axes found no remaining blockers. `git diff --check` is clear.

The exact main commit, successful Pages run and public-file verification are recorded in the closing #44 comment after deployment. The next balance task is #45; voices remain #43. No claim of a second classroom playtest.
