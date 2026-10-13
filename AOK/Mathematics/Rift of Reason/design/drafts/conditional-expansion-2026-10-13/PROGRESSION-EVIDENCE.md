# Two completed lessons — expansion qualification proposal

Human threshold is accepted: conditional expansion cards become available only after two completed campaign lessons, described as50%of the four-lesson campaign. Recommended existing-save predicate: `state.map.completed` includes **both `gate` and `b-town-hall`**. This is a specification predicate, not new runtime code.

## Canonical source evidence

- `data/map.js:21` maps Prologue and Chapter1 to Lesson1; Chapter2 maps to Lesson2. `data/map.js:158` defines `gate` as the Chapter1 boss; `data/map.js:292` defines `b-town-hall` as the Chapter2 boss. The normal route completes these end-of-lesson milestones in order.
- `js/core/state.js:28` stores completed node IDs in the canonical save object. `js/core/world.js:112` (`complete`) adds an ID once; `js/screens/encounter.js:441` calls it in the successful all-stages encounter completion path. Seeing a win script is not used instead of this history.
- `js/core/world.js:121` (`jumpToChapter`) sets current chapter/location, reveals nodes and records a rift. It does **not** mark earlier bosses completed. Its generous power/tweak catch-up elsewhere is not a lesson-completion predicate.
- `js/core/quests.js:31` derives normal station completion from saved completed IDs, but `list` can also display a dark/absent-host station as done. Do not use a journal label as proof of completing the two lessons.
- `js/core/state.js:304` merges defaults when loading old saves; the existing backup machinery carries the canonical map and flags. Infer qualification from the preserved two IDs rather than requiring a newly added unlock boolean. A later imported chapter/rift-only save does not qualify; preserve its owned data and offer normal catch-up information rather than deleting cards.

These are current source locations, inspected13October2026, not promises that line numbers never move. There is no existing dedicated “two lessons complete” function to reuse directly. Implement one central availability predicate over the existing completed-node history and route all acquisition/loadout/pool callers through it.

## Pool and quest behaviour

Qualification is necessary, not a bulk grant. A card must also be implemented/released and eligible for its individual acquisition channel. Gate pack/shop/random/story grants and conditional deck eligibility; checking only the Collection button is insufficient. Plot-only cards remain outside pack candidates even after qualification. Respect existing ownership/quantity/foil rules and never erase older collection entries to enforce this lock. Normal enemy pools before the threshold also avoid teaching this advanced set early; development benches can explicitly preview it without persistent grants.

Recommendation: an existing card-teaching NPC gives a brief Lesson1 teaser, then offers the expansion introduction after the Town Hall milestone. Use a reachable story station and existing narrator/understudy fallback. No new NPC art is required by this suggestion. Draft plain lines: “Some cards wait for the right moment. Finish two lessons, then I'll show you.” / “You have finished two lessons. Let's try a card that waits.” Exact host/location/wording are implementation choices; existing recorded scripts remain intact.

The journal should derive the upcoming/available objective through the current quest flow. Persist only genuine new offered/seen/completed introduction state in canonical saved flags; no separate quest storage. Teaser, invitation and repeat conversations grant no cards by themselves. Surface the introduction at qualification or before first expansion use/reward; do not make missing legacy conversation flags reset two-lesson eligibility. Actual rewards, if added, are individual reviewed grants with receipts.

Draft validation fixtures in this folder check neither/one/both milestones, non-qualifying later chapter/rift/star history and an old qualified save. This validates the recommendation, not runtime enforcement. Save/load, NPC absence, grant routes, pack exclusion and idempotence remain future implementation tests.
