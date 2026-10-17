# Environmental Fate schedules (#128), 17 October 2026

Teacher direction: [ENVIRONMENTAL-FATE.md](../drafts/card-arena-2026-10-12/ENVIRONMENTAL-FATE.md). Model: [FATE-SCHEDULE-MODEL.md](../drafts/card-arena-2026-10-12/FATE-SCHEDULE-MODEL.md) section 10.

As the issue asks, this pass builds one gentle encounter and one boss end to end. Every other battle gets a proposed schedule in the table below. Those are not implemented. They wait for a playtest of the first two.

## What is implemented

| | Syllo's practice match (gentle) | The Feed's Champion (boss) |
|---|---|---|
| Event | **Drill Whistle** (Sergeant Syllo) | **Trending** (The Algorithm) |
| Effect | Both players get +1 energy on their next turn. | The Feed's creature with the most attack (leftmost on a tie) gets +1 attack until the end of its next turn. |
| Who it helps | Both players | The Feed's Champion |
| First | End of round 4 | End of round 2 (Expert); round 3 (lower levels) |
| Recurs | Every 4 rounds | Every 2 rounds (Expert); every 3 (lower levels) |
| Target | None | Chosen when it happens, by the rule above. No creature: a public "no creature to trend" line, and it is used up. |
| Duration | One turn's energy | Until the end of the Feed's next turn |
| Skip | A leap past it skips that occurrence for good. The next one is a new event. | Same |
| Counterplay | Save a bigger play for the extra energy. | Defeat the strongest creature before it trends, keep the Feed's board small, or leap past it. |
| Data | `SYLLO_FATE` in js/ui/battles.js | `fate` on `feed` in data/map.js |

The events are defined in `Rift.data.environments` (data/tactics.js). The engine takes them as `createBattle({ environment: [{ def, first, every?, times?, side? }] })`.

## Audit: every card battle, with the proposed schedule

"Proposed" rows are drafts for the next slice. Their effects reuse existing engine primitives, and their numbers are not tuned.

| Encounter | Opponent | Scene | AI level | Event | Effect | First | Recurs | Target rule | Duration | Counterplay | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Granny's guided lesson | Granny | Fair Gate | scripted | none | n/a | n/a | n/a | n/a | n/a | n/a | **Exception**: scripted steps would be invalidated. |
| Syllo's practice match | Sergeant Syllo | Fair Gate | Normal | Drill Whistle | Both +1 energy next turn | 4 | every 4 | none | 1 turn | Plan a bigger play | **Implemented** |
| Training Dummy practice | Training Dummy | Collection | Normal | none | n/a | n/a | n/a | n/a | n/a | n/a | **Exception**: plain sparring. |
| Classmate ghost | Team code | Collection | Normal | none | n/a | n/a | n/a | n/a | n/a | n/a | **Exception**: no scene, both sides equal. |
| Syllo's stall challenge | Sergeant Syllo | The Valley | Normal | Roll Call | Both players draw 1 card | 4 | every 4 | none | instant | Keep hand room | Proposed |
| Corvina's challenge | Corvina the Card Sharp | Battle table, ch1 | Competent | Marked Deck | Corvina draws 1 card | 3 | every 4 | none | instant | Leap past it; press early | Proposed |
| Mrs Crumb's challenge | Mrs Crumb | Boolesbury | Normal | Oven Timer | Every creature in play heals 1 | 3 | every 3 | all creatures | instant | Trade before it heals | Proposed |
| Constable Clobber (boss) | Constable Clobber | Battle table, ch2 | Expert | Curfew | The player's creature with the most attack is frozen (it can't attack on its next turn) | 2 | every 3 | most attack, leftmost | next turn | Spread attack over several creatures; leap | Proposed |
| Pip's challenge | Pip, the Clerk | Tomorrowton | Normal | Late Paperwork | Both players draw 1 card | 4 | every 4 | none | instant | Keep hand room | Proposed |
| Prosecutor Fin (boss) | Prosecutor Fin | Battle table, ch3 | Expert | Objection! | The player's creature with the most attack gets −1 attack until the end of its next turn | 3 | every 3 | most attack, leftmost | next turn | Attack first, go wide, leap | Proposed |
| The Feed's Champion (boss) | The Feed's Champion | Battle table, ch4 | Expert | Trending | Feed's strongest +1 attack | 2 | every 2 | most attack, leftmost | Feed's next turn | Defeat it first, leap | **Implemented** |
| Roaming legendaries (#111) | per legendary | various | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | Later, with #111 |

The design note's draft "Clockmaker workshop" example has no matching encounter in the game today, so it is not in the table.

Every card battle in the game is in this table. Exceptions are explicit. The two implemented events differ by level in data (`levels` on a trainer's `fate` entry). A level with no matching entry gets no environmental event.

## Rules (builder decisions; see the model, section 10)

- Environmental events are one-shot occurrences on the Fate track. They are scheduled when the battle starts, before the first turn. They are public: the source, effect, who it helps, countdown and recurrence are all visible. The AI reads them only through the public schedule.
- **Recurrence** makes a new occurrence with its own id. It is put on when the previous occurrence fires or is skipped, `every` spaces after the previous one, and never on or behind NOW. A rewind never repeats a fired occurrence and never revives a skipped one. It only moves the next occurrence further away. `times` caps the total.
- **Ownership**: no player controls an environmental event, so it never uses a player's live-event limit. Its `side` (the player it helps, or none) only decides wording and targets.
- **Same space**: events resolve in the order they were scheduled. Environmental events come first, because they are scheduled when the battle starts and their recurrences when the previous one ends. Fate's own rule event comes last. Gentle Consequences (#121) caps their hero damage like any scheduled effect.
- **Missing target**: the event is used up with a public line, and it never retargets. It still recurs.
- **Battle over**: nothing more resolves or recurs.
- **Saves**: battles are not saved mid-match. The whole state, including plans and records, survives a JSON round trip and resolves the same way.

## Pacing evidence

`node tools/sim-battle.mjs --ladder --games=600 --seed=env128`. The Syllo row and the Feed's boss deck include their events after this change.

| Row | Before | After | Target |
|---|---|---|---|
| Expert boss deck vs Competent: the Feed | 83.0% | 84.0% | 75–85% (all decks) |
| Expert boss deck vs Competent: all decks | 82.8% | 83.2% | 75–85% |
| Beginner vs Normal Syllo | 95.8% | 96.3% | 65–75% (already off before #128) |

Trending adds about one point of boss pressure, within the noise (±3). The Drill Whistle helps both sides and does not move the beginner match. The beginner row was already above its target before this change. That belongs to the separate beginner-balance work, not to #128.

## Not done yet (needs the teacher or a playtest)

- A classroom playtest of both encounters, especially whether the round-4 whistle is noticed and understood in the beginner match.
- The proposed rows above. Implement them after the playtest, one encounter at a time, as the issue asks.
- A short tutorial line that teaches leaping past an environmental event. Today the node, the leap prompt and the reveal say it. A taught moment could go into the Feed's pre-battle line, which has a recorded voice and needs a voice pass, so it is left out here.
- No new art: the event nodes use the sources' existing portraits.
