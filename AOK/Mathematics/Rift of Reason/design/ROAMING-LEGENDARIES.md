# Roaming legendaries (#111): stage 1 specification

Status, 17 October 2026: stages 1 and 2 are built, with placeholder art. The teacher authorised them on 14 October 2026. Stage 3 (final art, balance review) and stage 4 (class playtest) come later. Research and reference notes: `research/roaming-legendary-trick-challenges-2026-10-11.md` (repository root) and GitHub issue #111.

Code: `data/legendaries.js` (hunt data), `js/core/hunts.js` (save rules, pure), `js/core/tricks.js` (the three challenges, pure), `js/screens/hunt.js` + `css/hunts.css` (challenge screen), `js/screens/map.js` (badge, trail, flight, note). Tests: `tools/test/hunts.test.mjs`.

## 1. The three creatures

They are original tricksters, not historical mathematicians. They sit beside the six rumour-gated historical legendaries and do not replace them. They have `roaming: true` in `data/creatures.js`, which keeps them out of every spawn table. Passing the challenge is the only way to get one. There is no rumour prerequisite: the badge on the map is the discovery.

| Unit / map | Creature | Colour | Challenge | TOK idea |
|---|---|---|---|---|
| 2 · Boolesbury (`ch2`) | **Maskip**, a lantern imp in an oversized mask | reason | *The Lantern Switch* | A logic rule decides which cases count. AND is not "exactly one". A confident mask is not evidence. |
| 3 · Tomorrowton (`ch3`) | **Quibblequill**, an ink-stained ferret in a legal wig | language | *The Paper Trail* | One counterexample breaks an "every" claim. A supported claim says no more than the records. A rule does not run backwards (converse). |
| 4 · Server Tower (`ch4`) | **Oddsnap**, a dice-tailed gremlin in a crooked paper crown | memory | *Odds and Ends* | A frequency model predicts from counts. Likely is not certain. A confident machine adds no evidence. |

Cards (builder proposals, existing abilities, for the stage 3 balance review): Maskip 3 energy 2/3 *whisper*; Quibblequill 4 energy 2/5 Guard *foresight*; Oddsnap 3 energy 2/3 *predict*. A claimed creature has no luck roll (plain variant), so every student's copy is the same.

## 2. The challenges (three rounds each)

Every round is generated from a seed (save seed + hunt + attempt), so a reload shows the same rounds. The sign (instruction) changes every round: that is the trick. Each answer follows from the shown evidence alone: no timers, no hidden outcomes, no pixel hunting, and no colour-only cues (lanterns say ON/off, shapes have names and symbols). Wrong answers get one or two plain sentences that name the missed rule.

**Maskip.** Four lantern pairs, A–D, show all four on/off combinations in a random order.
1. "Pick the pair with BOTH lanterns on." One answer.
2. "The sign changed! Pick a pair with EXACTLY ONE lantern on." Same layout. Both valid pairs pass. Repeating round 1's answer fails.
3. The mask makes a claim about one marked pair (both / exactly one / none / at least one lantern on). True half the time. The player answers True or False from the lanterns.

**Quibblequill.** A table of 4–6 parcel records (stamp yes/no, arrived yes/no). There is exactly one stamped, not-arrived parcel, plus at least one unstamped, not-arrived distractor.
1. Claim "Every stamped parcel has arrived." Pick the ONE record that proves it false (the stamped, not-arrived parcel).
2. "New task! Pick the claim these records SUPPORT." Only "At least *k* stamped parcels have arrived" is supported. The others are broken by a record ("every stamped…", "every parcel has a stamp") or say more than the records show ("…always arrive first").
3. Rule "Every *archive* key is *brass*", plus a test record of a brass key that did not open the archive. Pick the claim that does NOT follow: the converse "Every brass key opens the archive". The material and the door vary.

**Oddsnap.** A machine log of 10 shapes (▲ Triangle, ● Circle, ■ Square) with distinct counts. Its model is chance = count ÷ 10. The most frequent shape glows: the decoy.
1. "Pick its LEAST likely next shape."
2. "New log! Now pick the MOST likely next shape." The new log makes round 1's answer the least likely, so repeating the old shape or the old rule fails.
3. Three doors, all below 100% safe, plus "No door is guaranteed safe". The sign asks for a GUARANTEED safe door; only the last option passes.

## 3. Rules of the hunt

- **Optional.** Ignoring every hunt changes nothing. The hunt never writes `map.completed`, `map.revealed`, flags or the chapter. The host station keeps its normal activity: its marker opens the station, and the hunt badge opens the challenge.
- **Found.** The hunt is found when the avatar is on the hunt's painted map and at least two of its authored sites are legal (§4). The creature starts at the first legal site in the list. A toast and a map note announce it.
- **Answers.** Pick an answer, then press Check. Nothing submits on the first tap.
- **Right answer.** Saved at once (`Hunts.pass`).
- **Leave (voluntary exit).** Back to the map. The run and the rounds passed so far are kept, and the next visit continues ("Go on"). Leaving is never a wrong answer.
- **Wrong answer.** The run resets to round 1 and the attempt number goes up. The new site is picked once and saved *before* the explanation is shown (`Hunts.fail`). The screen names the new place. A repeated submission (double click, reload, replayed event) is ignored by the attempt guard, so the creature never moves twice.
- **Cost of failing.** Only the walk. No hearts, scars, items or stars. The ordinary puzzle rules do not apply.
- **Retry.** Only at the new site, after the avatar has walked there (`canAttempt` needs `map.at === hunt.node`). There is no timer.
- **Win.** After round 3, `Hunts.claim` adds exactly one creature (uid `legend-<hunt>-<seed>`) with no catch roll and no charm, and writes the permanent receipt `claimed`. The receipt, not collection ownership, blocks a second grant, so releasing the creature never reopens the reward.
- **Practice.** After the claim, the badge stays where the creature was won. Practice runs use a new seed each time, with no reward and no flight.

## 4. Sites, legality and fallback

Authored roaming sites (the order is the discovery order):

- Maskip: Lamp Lane, Square, Bakery, Post Office, School, Clockmaker, Walled Garden, West Bridge.
- Quibblequill: Newsstand, Café, Library, West Bridge, Reading Room, Plaza, Data Lab, Gallery.
- Oddsnap: Prediction Hall, Gallery, Stairwell, Workshop, Oracle, Sky Bridge.

A site is legal when it is revealed, on the hunt's own painted map, not locked (`World.lockReason`), not a boss or rift node, and reachable from the creature's current place through revealed, unlocked nodes on that map. The Fair finale belongs to chapter 4 but sits on the main map, so it is never an Oddsnap site. The destination is chosen once, seeded by the save and the attempt, so it is never rerolled.

1. **roam**: another legal authored site. It is never the current place, and not straight back where the creature just came from, when anything else is legal.
2. **fallback**: no other authored site is legal, so any other legal node on the map.
3. **hide**: nowhere else at all. The creature stays and hides until the avatar has walked to another place and back. It is never stranded.

## 5. Storyboard: fail → map → flee → travel → retry

1. The challenge screen: "Not quite." Then the missed rule, the creature's taunt, and "*Name* runs off to *Place*. Walk there to try again from round 1." Then a *Back to the map* button.
2. The map, after about 0.4 s: the creature's portrait runs once along the walkable route from the old site to the new one (≤ 2.6 s, no loops, no bobbing). Its badge appears at the new site.
3. The map then marks the departure as shown (`departure.seen`). A toast and the persistent bottom-left note say "*Name* ran from *A* to *B*. Walk there to try again." A dotted gold trail stays on the map until the avatar reaches the new site.
4. Calm motion or OS reduced motion: no runner. The badge is drawn at the new site straight away, with the same toast, note and static trail.
5. If the page closes during the flight, the departure is still unseen, so the map shows it on the next visit. The destination itself was saved in step 1. Leaving the chapter keeps the hunt; it is drawn only on its own map.

## 6. Save format

`save.hunts[id]` (default `{}` in `freshState()`; old saves get it on load; backup codes carry it):

```
{ v, phase: 'roaming'|'claimed', node, from, attempt, round, fails, practice, resting,
  departure: { attempt, from, to, tier, seen } | null, claimed: { uid, at, node, attempt } | null, found }
```

## 7. Art needed (placeholders now)

The placeholder silhouette (`Rift.Assets` fallback) is used everywhere until the art arrives. Requests are in `art-requests/ART-REQUESTS.md`, Stage 13.87. Per creature:

- `creature/<id>/idle`: portrait and card art, same size class as the shipped creatures (about 230×215 WebP, transparent). Also used for the map badge and the runner.
- Poses `taunt`, `thinking`, `happy` (correct answer), `shocked` (wrong answer / flee start), `recruited`.
- A run (or fly) sheet: `creature/<id>/run`, one row of 6 frames on a shared ground line, in the same pipeline format as the avatar walk sheets (`tools/assets/sheets.json` type `walk`, ~240–320 px frame width, ~330–380 px height, pivot bottom-centre, facing right; the map mirrors it for leftward runs).
- Reduced-motion equivalent: none needed. Calm motion uses the static idle at the destination.

## 8. Open for later stages

- Stage 3: final art and the balance review of the three cards. Voiced taunts are optional: the lines are text only now and go through the normal voice run (#43) if wanted.
- Stage 4: class playtest of timing and fairness, and whether three rounds is the right length.
