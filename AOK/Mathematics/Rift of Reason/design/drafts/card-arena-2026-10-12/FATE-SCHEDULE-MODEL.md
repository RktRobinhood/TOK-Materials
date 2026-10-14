# Fate schedule model (#118), 14 October 2026

This is the agreed state model for events that players (and later, encounters) put on the Fate track. It builds on #116: Fate advances once per full round, and the next rule card is locked and set aside in `s.fate.next`. #119 (Clean Slate) implements this model. #120 (Leap Ahead, Revisit, Echoing Encouragement), #121 and #128 build on it.

**Teacher decision, 14 October 2026 (settled):**

- Scheduled spells and summons are **one-shot**. They fire once, ever. Leaping past one skips it permanently.
- Only a few spaces are **marked repeatable** (e.g. a +1/+1 buff space). They fire again when the marker rewinds onto them.
- Lifetimes count **real elapsed full rounds**, so rewinding the cursor can't extend them.

Anything below marked **Builder decision** is the builder's most conservative reading of that decision and of existing engine conventions. The teacher can overturn any of them without changing the rest of the model.

## 1. Terms

- **Space**: one round on the Fate track. Spaces are numbered from 0, where the battle starts.
- **Cursor** (`s.fate.pos`): the space NOW is on. An ordinary advance (after the second player's End turn) moves it +1.
- **Rule node**: Fate's own flip/reset event from #116. It is always `s.fate.until` spaces ahead of the cursor. It isn't stored as a queued event.
- **Scheduled event** (or "node"): a record in `s.fate.queue` that sits on one absolute space.
- **Enter**: the cursor arrives on a space by an ordinary advance, by one step of a forward walk, or by the landing of a leap or rewind.
- **Walk**: a forward move of n spaces made of n single entries. Every existing forward time effect is a walk: the ordinary advance, Clockwork, Filter, Hold That Thought and the time draw.
- **Leap** (#120 only): a forward move that enters only its landing space and **bypasses** the spaces in between.
- **Rewind**: a backward move. Next Year, Nostalgia, Clockwork back, Hold That Thought back, the time draw back and #120's Revisit are rewinds. A rewind enters only its landing space. The spaces it passes are neither entered nor bypassed.

## 2. Event record (lossless battle state)

`s.fate` gains three plain-data fields: `pos` (cursor), `seq` (last event number) and `queue` (records, oldest first). A record holds:

| Field | Meaning |
|---|---|
| `id`, `seq` | Identity: `'f' + seq`. It is unique for the whole battle and never reused. Recasting the same card makes a new record. |
| `def` | Definition id, e.g. the tactic id `clean-slate`. Effects are looked up by id. Functions are never stored. |
| `source` | `{ type: 'tactic' \| 'creature' \| 'environment', cid?, card }`. The physical card that scheduled it, if any. |
| `controller` | The player who scheduled it (`null` for environment). It never changes. |
| `space` | The absolute space it sits on. |
| `createdRound`, `createdTurn` | When it was scheduled. |
| `repeat` | `false` = one-shot (default), `true` = marked repeatable. |
| `lifetime`, `expiresRound` | Repeatable only: the lifetime in rounds, and the last round whose end it lives through. `null` for one-shot events. |
| `state` | `pending`, `fired`, `skipped`, `cancelled` or `expired` (section 3). |
| `fires`, `firedRound`, `reason` | How often it fired, the round of its first firing, and why it ended. |
| `target` | A target fixed when it was scheduled, if the card names one (`null` for Clean Slate). |

`cloneState` copies the queue. The whole battle state still survives a JSON round trip. An older state without these fields reads as cursor 0 with an empty queue, so no state version bump is needed. Terminal records are kept for the reel's history and for "rewind onto a fired node". Capacity (section 4) bounds how many can exist.

## 3. States and transitions

```
                 enter (one-shot)                 enter again: no change
  [schedule] ──► pending ───────────────────────► fired (terminal for one-shot)
                   │  │  enter (repeatable)
                   │  └─────────────────────────► fired (live, repeatable) ──enter──► fired, fires+1
                   │ bypass by a leap (one-shot)                 │
                   ├─────────────────────────────► skipped (terminal)
                   │ explicit cancel / missing required source   │
                   ├─────────────────────────────► cancelled (terminal) ◄─┤
                   │ lifetime used up (repeatable)               │
                   └─────────────────────────────► expired (terminal) ◄───┘
```

- **schedule**: a scheduled card resolves. The record is created `pending` at `space = pos + delay` (delay ≥ 1). It isn't legal without a Fate track or at capacity.
- **enter**: a `pending` one-shot becomes `fired`. The record is claimed (state set) **before** its effect runs, as the conditional queue does, so nothing can make it fire twice. A live repeatable (`pending`, or `fired` with `repeat`) fires and `fires` goes up by 1. Entering a `fired` one-shot, `skipped`, `cancelled` or `expired` record does nothing, whichever direction the cursor came from.
- **bypass** (#120 leaps only): a `pending` one-shot becomes `skipped`, permanently. Rewinding onto it later doesn't bring it back (matches ENVIRONMENTAL-FATE.md). **Builder decision:** a bypassed repeatable space was not entered, so it doesn't fire and stays live.
- **cancel**: only explicit card text, or a missing required source (section 5), cancels. Hiding, skipping or interrupting an animation never changes the engine state.
- **expire**: after the round end that uses up its lifetime (section 6).
- **battle over**: the schedule freezes. Pending records stay pending and never resolve. **Builder decision:** they are not rewritten, so the final state records what was still planned.

## 4. Rules for the edge cases

**Delay.** "+n rounds" means n spaces ahead of the cursor. If nothing bends time, the event happens at the nth ordinary advance after it was scheduled. Its countdown uses #116's labels: rounds (plus one while the Anchor holds the current round), End turns, and whose End turn brings it. Future `fate-delay` Axioms (Patient/Hasty Plans) change n only when the event is scheduled.

**Time effects move every node.** All existing time effects move the **cursor**, so the rule node and every scheduled node move relative to NOW together. Next Year delays a pending Clean Slate by 2 rounds, and Filter brings it 2 rounds closer. That is the intended counterplay. **Builder decision (keeps #116 behaviour exactly):** a forward walk stops on the rule node when it reaches it, and the remaining spaces are absorbed. A rewind is limited, as before, so that the rule node stays at most `fateMax` spaces ahead. Scheduled nodes move by the same amount the cursor actually moved.

**Leaps and the rule node (#120).** **Builder decision:** a leap never jumps over the rule node. If the rule node lies inside the leap, the leap lands on it, and only scheduled one-shot nodes before it are bypassed. Rule events are never skipped.

**Pending-event capacity.** **Builder decision:** each player may have at most **2 live scheduled events**: pending ones plus live repeatable ones. This mirrors the two conditional slots. A scheduled card is not offered while its controller is at capacity. Environmental events (#128) don't count. Open Calendar would raise the limit by one.

**Source death or removal.** A scheduled spell keeps its controller and doesn't need its card: the card goes to the discard as usual, and recovering, bouncing or replaying it doesn't touch the pending record. Replaying it schedules a new, separate record. **Builder decision for creature-sourced events (later):** independent of the creature by default. A definition may require its source. In that case the event checks at entry whether the source is still on its scheduling controller's board. If it isn't, the event is `cancelled` (reason `source-left`), publicly, and consumed. Control changes never transfer an event.

**Full board or hand.** Every effect uses the normal engine rules at resolution.

- A summon with no board space does nothing, but the event is still consumed (`fired`, with a public "no room" line). A one-shot event is never retried.
- A draw with a full hand stops, and the card stays in the deck.
- A "return to hand" with a full hand leaves the card where it is.
- A defeated creature that Mercy or a Last Word would return to a full hand goes to the discard, as now.

**Simultaneous events.** **Builder decision:** when the cursor enters a space:

1. The scheduled events on that space resolve one at a time, in `seq` order (the order they were scheduled), whatever their source.
2. Fate's rule event on that space resolves **last**, so a scheduled effect resolves under the rules shown while it was forecast.
3. Each event's targets are a snapshot taken when that event starts.
4. After each event, the engine's cleanup runs: chained defeats, Last Words and the heart and winner check.
5. A winner ends the battle at once, and nothing further resolves.
6. For a multi-creature effect, the order is the active player's board left to right, then the other board. This is the existing cleanup order.
7. Conditional cards that react to these facts (#148/#149) queue and resolve after the whole Fate movement, in their own arming order.

**Invalid targets.** Targets described by a rule ("all creatures", "your creatures present then") are resolved at entry, so they are always valid. A target fixed when the event was scheduled that is gone or illegal at entry gives no effect. The event is consumed with a public "no target" line, and there is no arbitrary retarget (the conditional-attack convention). **Builder decision:** scheduled effects never ask a question when they resolve. Any choice is made when the event is scheduled, so resolution stays deterministic and can happen in the middle of an End turn.

**Fate reset vs queued events.** A reset (and Granny's Spare Axiom) clears active rules only. Scheduled events, their spaces and their lifetimes don't change, unless a card explicitly says otherwise.

**Repeated clicks, navigation and visual cancellation.** Resolution happens inside the one engine action that moves Fate. The engine is pure: the input state is never changed, and the result already holds the fired record. Clicking again acts on the new state. Replaying an old state yields the same single firing. Leaving or skipping animations only stops reading events. Battles are not saved mid-match. The whole state is still serialisable, and a restored copy resolves the same way.

**Public information.** Every scheduled event in this model is public: source card, controller, effect, space, countdown and state. The reel's "if it resolved now" line runs the real resolution on a throwaway copy of the state, so the preview and resolution can't drift apart. The AI reads only this public schedule.

## 5. Lifetime

A repeatable event with lifetime L created during round r lives through the round ends of rounds r … r+L−1 (`expiresRound = r + L − 1`). The creation round counts even if it was created on the second player's turn. It expires right after round `expiresRound`'s Fate advance, or right after that round's end if the Anchor holds the track. Rewinds and the Anchor don't extend it, because it counts rounds, not spaces. **Builder decision (#120):** buffs a repeatable space grants are tagged with its id and end together when it expires. Repeated entries can't snowball beyond its lifetime. As with Temporary Spark, health that depended on them can then be lost.

## 6. Deterministic worked example

Two players, A first. To keep the example about scheduled nodes, `fateStart: 9`: the rule node sits on space 9 throughout. It never moves past the cap, so it plays no part. The cards are the CARD-DRAFTS.md drafts: Tomorrow's Idea (one-shot summon, +1), Clean Slate (one-shot wipe, +2), Echoing Encouragement (marked repeatable +1/+1 to its controller's creatures, +1, lifetime 3), Leap Ahead (leap 2), Revisit (rewind 1), and the existing Next Year (rewind 2) and Clockwork (rewind 1).

| Round | Move | Cursor | Queue afterwards (id@space state) | What happens |
|---|---|---|---|---|
| 1 | A: Tomorrow's Idea | 0 | f1 TI@1 pending | Scheduled, public. |
| 1 | B: Clean Slate | 0 | f2 CS@2 pending | A one-shot wipe 2 rounds ahead. |
| 1 end | ordinary advance | 1 | f1 **fired** | **Ordinary entry**: A's **one-shot summon** fires, and a 1/2 token T appears. |
| 2 | A: Leap Ahead | 3 | f2 **skipped** | **Leap**: space 2 is bypassed, and B's Clean Slate is skipped forever. It lands on 3 (empty). |
| 2 | A: Echoing Encouragement | 3 | f3 EE@4 pending, expiresRound 4 | A marked repeatable space with lifetime 3, created in round 2. |
| 2 end | ordinary advance | 4 | f3 fired (live), fires 1 | EE fires: A's creatures +1/+1, so T is 2/3. Round ends used: 1 of 3. |
| 3 end | ordinary advance | 5 | — | Space 5 is empty. Round ends used: 2 of 3. |
| 4 | A: Revisit | 4 | f3 fires 2 | **Rewind onto a marked repeatable** space: it fires again, so T is 3/4. |
| 4 | B: Next Year | 2 | f2 still skipped | The rewind lands on 2: the skipped Clean Slate **stays skipped**. Space 3 is passed, not entered. |
| 4 | B: Clockwork back | 1 | f1 still fired | **Rewind onto a fired one-shot** node: no second token. |
| 4 end | ordinary advance | 2 | f3 **expired** | Space 2 holds only the skipped f2: nothing. Round ends used: 3 of 3, so EE **expires** and its two buffs end. T is 1/2 again. |
| 5 end | ordinary advance | 3 | — | Empty. |
| 6 end | ordinary advance | 4 | f3 still expired | **Expiry**: entering EE's space does nothing. Three rewinds moved the cursor back four spaces but gave EE no extra life. |

Checks: 6 ordinary advances, 1 leap (+2) and 3 rewinds (−4) leave the cursor at 6 + 2 − 4 = 4. TI fired exactly once. CS never fired. EE fired exactly twice, all within its lifetime. The rule node is still on space 9. Its `until` went 9 → 8 → 6 → 5 → 4 → 5 → 7 → 8 → 7 → 6 → 5, so the cap (9) was never reached.

## 7. What #119 implements now

#119 implements the record, the queue, capacity, walks, rewinds, the entry and claim rules, simultaneous order, reset independence, the lifetime and expiry of repeatable records, the public schedule view with a resolve-on-a-copy preview, the reel nodes and AI awareness. It does this with one card, Clean Slate.

Leaps, bypass, required sources, repeatable content and environmental sources are data-ready but have no card yet. They belong to #120, #121 and #128.

Known limitation (existing, not new): a conditional reaction that asks a question while the next turn's draw step is open would skip that draw. No released card does this. It needs fixing before a conditional reveal with a targeted Entrance ships.
