# Roaming legendaries (#111)

Status, 19 October 2026: the three hunts, all 21 art pieces, unique powerful reward cards, twelve-round bank and sparse timers are shipped. The builder's final bank, controls, timer, map pursuit and save audit is recorded in `reviews/roaming-111-2026-10-19.md`. Classroom feedback remains optional future tuning, as the teacher confirmed on 18 October. Research and reference notes: `research/roaming-legendary-trick-challenges-2026-10-11.md` (repository root) and GitHub issue #111.

Code: `data/legendaries.js` (hunt data), `js/core/hunts.js` (save rules, pure), `js/core/tricks.js` (the trick bank, pure), `js/screens/hunt.js` + `css/hunts.css` (challenge screen), `js/screens/map.js` (badge, trail, flight, note), `dev/tricks.html` (review every trick), `dev/hunts.html` (scratch map/hunt and bank controls, no adventure storage). Tests: `tools/test/hunts.test.mjs`, `tools/test/tricks.test.mjs`, `tools/test/hunt-ui.test.mjs`, `tools/test/legendaries.test.mjs`.

## 1. The three creatures

They are original tricksters, not historical mathematicians. They sit beside the six rumour-gated historical legendaries and do not replace them. They have `roaming: true` in `data/creatures.js`, which keeps them out of every spawn table. Passing the challenge is the only way to get one. There is no rumour prerequisite: the badge on the map is the discovery.

| Unit / map | Creature | Colour | Challenge | TOK idea |
|---|---|---|---|---|
| 2 · Boolesbury (`ch2`) | **Maskip**, a lantern imp in an oversized mask | reason | *The Lantern Switch* | A logic rule decides which cases count. AND is not "exactly one". A confident mask is not evidence. |
| 3 · Tomorrowton (`ch3`) | **Quibblequill**, an ink-stained ferret in a legal wig | language | *The Paper Trail* | One counterexample breaks an "every" claim. A supported claim says no more than the records. A rule does not run backwards (converse). |
| 4 · Server Tower (`ch4`) | **Oddsnap**, a dice-tailed gremlin in a crooked paper crown | memory | *Odds and Ends* | A frequency model predicts from counts. Likely is not certain. A confident machine adds no evidence. |

Cards (teacher decision 17 October 2026: legendaries are one of a kind, so they sit above the curve; tougher and a bit unfair, still beatable):

| Card | Energy | Stats | Ability (stronger version of) |
|---|---|---|---|
| Maskip | 4 | 3/5 | *Lantern Switch*: Entrance, every enemy creature loses its abilities, keywords and boosts (Eelish's *Whisper* hits one). |
| Quibblequill | 4 | 3/6 Guard | *Cross-Examine*: takes 1 less damage from each hit; Entrance, read the opponent's hand and draw 2 (Carlseal's *Foresight* draws 1). |
| Oddsnap | 3 | 3/5 | *Loaded Odds*: Predict; right gives +3/+3 and a card, wrong still gives +1/+1 (Altmanta's *Predict* gives nothing when wrong). |

A claimed creature has no luck roll (plain variant), so every student's copy is the same. Like every legendary, a student keeps one copy and a deck takes one (`Rift.State.copyCap` / `deckCopies`).

## 2. The challenges (a 12-round gauntlet from a 50-trick bank)

Teacher, 17 October 2026: these should be hard and a bit of a meme, in the spirit of the old Flash idiot tests (Stupidity Test, Impossible Quiz, Idiot Test). We take their trick TYPES, pacing and instant reset; every question is our own (the originals are someone else's work). Code: `js/core/tricks.js`. Review every trick with its answer: `dev/tricks.html`.

An attempt is 12 rounds drawn from the creature's bank of about 50: 4 of its own TOK tricks and 8 shared troll tricks dressed in its theme, mixed, no trick twice. The draw and every number in it come from a seed (save seed + hunt + attempt), so a reload shows the same run and a new attempt draws a new one. One wrong answer resets the run and the creature runs away.

Answer types: pick one + Check; pick all + Check; type a number + Check; **tap** (the first click answers, no Check); **press in order** (a wrong press fails at once); **wait** (touch nothing for 5–7 seconds; touching fails). Some taps hide in plain sight: a word in the sign, the creature's picture, or the challenge's name. The rules screen warns that some rounds answer on the first click and some want you to wait.

Fair by rule (`tools/test/tricks.test.mjs`): one right answer that follows from the sign and the screen, every other answer rejected with a plain reason, no colour-only cues, no English puns, no trivia. Teacher steering, 18 October: keep all twelve rounds and the deliberately frustrating reset/pursuit loop, but use speed tests sparingly. Each run has at most one clearly signposted **Quick!** tap round, with six seconds to answer. Counting is untimed. Later quick candidates in that same seeded run become untimed tap rounds with no false clock wording; question order, layouts and answers stay unchanged. Wait rounds retain their countdown because resisting a click is their task, not answering quickly.

- **Maskip's own** (logic words, four lantern pairs): both; exactly one (two answers); the mask's claim true/false; neither; select every pair with at least one on; the pair that breaks an if-then rule; select every pair that is not both on; the pair where an OR claim is false; select every pair that is not exactly one; count every lantern that is on.
- **Quibblequill's own** (evidence, parcel records): the one counterexample; the supported claim; the converse that does not follow; select every record that says nothing about the claim; select every stamped parcel that arrived; how many counterexamples break an "every" claim (1); the record that supports "some have not"; the new record that would break the claim; "not brass, so not an archive key" (no); "brass, so an archive key?" (we cannot tell).
- **Oddsnap's own** (probability, a shape log whose glowing shape is the decoy): least likely; most likely; no door is guaranteed; a fair coin after a streak (50%); two exact roll lists are equally likely; the impossible roll; the certain roll; the most likely total of two dice (7); the chance of a 6 (1 in 6, not 50/50); a bag of more triangles than squares.
- **Shared** (40): the smallest button; the biggest number in the smallest print; the button with nothing written on it; do not touch; "click here" in the sign; click the creature; click the challenge's name; letters in a number word; double negatives; reverse order; smallest to biggest with minus numbers; odd one out; corners; the shape you see, then the word you read; the cheap-thing price trap; a kilo of feathers; months with at least 28/30 days; select every even number (0 counts); how many rounds; press one button exactly N times; quick GO (6-second clock); count the icons (untimed); quick "not a word"; second from the left; last letter; every button except one; the number not in digits; times before plus; fence posts; the smaller decimal; legs; alphabet order; a yes/no pattern; a longer wait; count a letter; the same amount written two ways; the upside-down button; the longest word in small print; sides of shapes.

## 3. Rules of the hunt

- **Optional.** Ignoring every hunt changes nothing. The hunt never writes `map.completed`, `map.revealed`, flags or the chapter. The host station keeps its normal activity: its marker opens the station, and the hunt badge opens the challenge.
- **Found.** The hunt is found when the avatar is on the hunt's painted map and at least two of its authored sites are legal (§4). The creature starts at the first legal site in the list. A toast and a map note announce it.
- **Answers.** Depends on the round type (§2). Tap rounds answer on the first click; the screen says so.
- **Right answer.** Saved at once (`Hunts.pass`).
- **Leave (voluntary exit).** Back to the map. The run and the rounds passed so far are kept, and the next visit continues ("Go on"). Leaving is never a wrong answer.
- **Wrong answer.** The run resets to round 1 and the attempt number goes up. The new site is picked once and saved *before* the explanation is shown (`Hunts.fail`). The screen names the new place. A repeated submission (double click, reload, replayed event) is ignored by the attempt guard, so the creature never moves twice.
- **Cost of failing.** Only the walk. No hearts, scars, items or stars. The ordinary puzzle rules do not apply.
- **Retry.** Only at the new site, after the avatar has walked there (`canAttempt` needs `map.at === hunt.node`). There is no timer.
- **Win.** After round 12, `Hunts.claim` adds exactly one creature (uid `legend-<hunt>-<seed>`) with no catch roll and no charm, and writes the permanent receipt `claimed`. The receipt, not collection ownership, blocks a second grant, so releasing the creature never reopens the reward.
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

## 7. Shipped art

All 21 pieces are delivered: six still poses and one six-frame run sheet per creature. Source prompts and provenance are in `source-assets/4-caricatures/roaming-111-2026-10-17/PROVENANCE.md`; the final Oddsnap idle completed the set in `55f03b1`. Original requests are in `art-requests/ART-REQUESTS.md`, Stage 13.87. Per creature:

- `creature/<id>/idle`: portrait and card art, same size class as the shipped creatures (about 230×215 WebP, transparent). Also used for the map badge and the runner.
- Poses `taunt`, `thinking`, `happy` (correct answer), `shocked` (wrong answer / flee start), `recruited`.
- A run (or fly) sheet: `creature/<id>/run`, one row of 6 frames on a shared ground line, in the same pipeline format as the avatar walk sheets (`tools/assets/sheets.json` type `walk`, ~240–320 px frame width, ~330–380 px height, pivot bottom-centre, facing right; the map mirrors it for leftward runs).
- Reduced-motion equivalent: none needed. Calm motion uses the static idle at the destination.

## 8. Balance and later feedback

- The cards deliberately outperform their common counterparts: Maskip removes enemy abilities, keywords and boosts; Quibblequill combines Guard, damage reduction, hand information and two draws; Oddsnap rewards a right prediction strongly and still grows on a miss. `tools/test/legendaries.test.mjs` checks these engine effects, their card text and relative stats. One per collection/deck and twelve rounds plus pursuit limit access. This satisfies the teacher's requested powerful, rare rewards; it does not claim tournament balance or a measured classroom win rate.
- Optional class feedback may inform timing and fairness. Twelve rounds, instant reset, pursuit and sparse Quick clocks are the settled teacher direction. The builder audit completes the currently authorized #111 work; later class feedback is not an approval gate.
- Voiced taunts remain optional under the separate normal voice run (#43). This audit consumes no image or voice quota.
