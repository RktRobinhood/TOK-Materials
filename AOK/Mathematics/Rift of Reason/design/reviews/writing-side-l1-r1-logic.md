# Writing gate: side stories, lesson 1, round 1, Critic 1 (logic and consistency)

**Score: 6/10**

Reviewed: `data/script/side-stories-l1.js` (all of it), the `well-map` beat in `ch1.gate.comfort` and `ch1.pass` / `ch1.pass.keanu` in `data/script/lesson1.js`. Checked against SIDE-STORIES.md §1–2, §4 (1–3), §8, STORY.md, UNDERSTUDIES.md, and the engine (`js/core/side-stories.js`, `js/core/side-verbs.js`, `js/screens/side-story.js`).

Traced an Owlet and a Moth-kin through every beat (plus the Raven and Frogling blue options and every species' negotiation card). Also traced Syllo present and `syllo-away`; Sequins in the cage, at home, `dead:sequins` with and without `arrived:sequins`; tiers 1–4 including an early clock fill; and both ripples, applied and late.

**What already works.** The understudy gating is correct: Tally's line is behind dead+arrived, and the ribbon is a fallback that does not name her. Every Syllo line has a sergeant-less twin. `SEQ_HOME`/`SEQ_AWAY` match lesson1's `SEQUINS_HOME`/`SEQUINS_AWAY`. Both ripple flags are read (`lesson1.js` 494, `lesson3.js` 470). The engine sets a ripple flag only when the ripple applies, so `last` never duplicates `late`. The map tier split (1–2 keep it, 3–4 Nudge takes it) agrees with the flag. The "common cause" round and the Lucky Well test question are correct TOK.

## Problems

1. **The Lucky Well's table gives away the test** (side-stories-l1.js, `lucky-well`, resolve, line 305). In `side-story.js` `roundsPanel`, a round's `table` renders on *every* ask of that round, including the first one. So "Which data would show whether wishing works?" is asked with a "Wished first / Did not wish" table already on screen, and that table *is* option 3. The core skill of the story then needs no thought. The same round also gives only +1 Progress against a size-3 bar, so the bar never fills for four of the five species.
   **Fix:** make two rounds. Round 1 is `{ q: 'Which data would show whether wishing works?', options: [...] }`, with no table. Round 2 is `{ q: 'Does wishing help?', table: v => [...], options: [...] }`. Then 2 rounds + the Frogling's +1 = 3, which fills the bar. (Also tell the engine owner: the format header's `test` example has the same shape.)

2. **The pie "deduction" is unsound, and its correct "Why?" misses the evidence that decides it** (`midday-pie`, resolve round 1, lines 431–451). Pastry crumbs and a fork are normal on a *chef's* apron, as his own lines say ("Chefs wear flour", "That fork is for TASTING"), so on their own they do not pick him out. What does pick him out is in the twist: he naps until noon, the timer wakes him "eyes still closed", and he "wakes up full". The grid also gives "—" for Keanu's and Sir David's crumbs, but no clue ever checked them. As written, the right answer to "Why?" ("Only he has the crumbs and the fork.") is inference from weak evidence presented as deduction. That goes against the spec's "deduction settles it".
   **Fix:** add a grid column `'Woke up full'` (Keanu —, Sir David —, Rawmsay ✓). Make the correct why `'He was at the sill, half asleep, and woke up full. Crumbs and fork too.'` Add a tempting wrong why: `'Chefs always have crumbs.'` → Rawmsay: `'Exactly! Crumbs prove NOTHING. …Hm.'`

3. **"The whole clip" breaks Ch3, and Speedcheeta is in two places** (`witness-tent`, outcome 1, line 178 "Speedcheeta plays the whole clip"; arg line 129 "Let the crowd see the whole clip"). In STORY.md Ch3 §7, Speedcheeta's "full, uncut clip" from the Fair (the eye, the net, the shadow) is the prize of the main-story negotiation (`clip`). If he plays the whole thing to the Fair in lesson 1, the Ch3 beat loses its point. Separately, the hostages are Billie, Beansprout and "the cheetah cub", and STORY.md says that cub is Speedcheeta. Yet he works his clip outside with you ("You zoom out…").
   **Fix:** line 178 → `'Speedcheeta shows the zoomed-out clip. Just the trophy stand. "The rest is… private."'` This also plants Ch3. Line 129 → `'Come out with me. Let the crowd see the clip, zoomed out.'` Spot label → `'Speedcheeta's stream, from inside the tent'`, and add a first note: `'Through the flap, a phone screen. The cub is streaming his own siege.'`

4. **Two species' own cards are dead in the negotiation** (`witness-tent`, `special`, lines 149–154; `cares: ['fairness','profit']`). The engine maps the special cards to motives (`side-verbs.js` 108–112). Owlet's (fairness), Frogling's (fairness) and Raven's (profit) land. Moth-kin's (facts/safety) and Fox's (fame/safety) hit no care, so they cost Patience and give nothing. That is a thinner path for two species, and STORY.md's own negotiation (Speedcheeta) sets the rule that "every species' special card hits one of his cares".
   **Fix:** make it `cares: ['fairness', 'profit', 'safety']`. She is barricaded against cork rifles, so it fits. Change the safety arg's reply (line 142) to `'…Corks. Yes. I don't love corks. Go on.'` and drop the "hit by Tuesdays" brush-off, or move it to the `facts` reply.

5. **The Lucky Well twist assumes the one clue you can skip** (`lucky-well`, twist line 282 "Down below, Nudge drops a rolled-up map"; outcome 1 "without its sack"). "Any two" allows list + log, and then the player has never looked down the well: Nudge and the sack appear from nowhere. The engine has no `found:` condition, so the twist must stand on its own. (Note also that list + well do not show that wishing does nothing; only the log does. The verb supplies the table, so this is tolerable. A safer setting is `need: [['list','log'], ['log','well']]`.)
   **Fix:** line 282 → `'A bell jingles down the well. Nudge is down there, with a sack of coins. It drops a rolled-up map: tunnels. One runs under the Gate, to the cage.'`

6. **The Raven's lead quotes a word nobody says** (`lucky-well`, clues intro line 241: `'"Works." Works compared to what?'`). Nobody before it says "works": Siuuugull says "magic", Chimpossible "possible", Siuuugull later "science".
   **Fix:** start line 230 → `'I wished. I scored. SIUUU! The well works!'`. Or make the Raven say `'"Magic." Magic compared to what?'`.

7. **The avatar uses Billie's fact without having found it** (`witness-tent`, listen.sum line 124 "So you never left…"; owlet special line 146 "You were dealing cards all morning"). Both are always on offer, but only the Billie spot establishes those facts, and clip + box is a valid pair. Corvina herself only says "I didn't take the trophy."
   **Fix:** sum → `'So you didn't take it, and they blamed you anyway.'`; Owlet → `'Black and white is a magpie. You're a crow. So it wasn't you.'` (still fairness, and still valid from the clip or the twist card, which everyone gets).

8. **Keanu's forgiveness lands on top of a death** (`lesson1.js`, `ch1.pass` line 580 → `ch1.pass.keanu`). It plays *first* at the Rift Pass, before Granny's crackle. If the pie was done before the Gate and Sequins died there, the first thing after the "cushion is still warm" is a cheerful pie line. That goes against the Gate's rule "after a death: no jokes". In the same way, the Lucky Well's `late` "It is a very bad map" (line 346) is a joke about the empty cage that also plays after `dead:sequins`.
   **Fix:** move the Keanu `when` *below* the arrival block, and make it `{ all: [{ flag: 'side.3', is: 4 }, { any: ['!dead:sequins', LATER] }] }` so it waits for a revisit. Split the `late` note: `when: '!dead:sequins'` keeps the joke; `when: 'dead:sequins'` → `'You keep Nudge's tunnel map. It leads to an empty cage.'`

9. **Nudge's look after it loses its job** (`lucky-well`, spot `well`, lines 270–272, `NUDGE_CH2`/`NUDGE_CH3`). There are two problems. First, `NUDGE_CH3` covers all of Ch4, but after core trial 2 Nudge has no clipboard and no job, and it follows you home. An "Engagement! Keep them coming!" at the well then contradicts its arc. Second, `NUDGE_CH2` keeps the mask on after the Hall, where it drops.
   **Fix:** gate `NUDGE_CH2` on `!seen:` the Hall win, and add a post-trial-2 variant (`seen:` the core trial 2 key), for example `{ s: 'nudge', t: 'Old habits. Nobody counts my clicks now. I count coins.' }`. A lower-effort alternative is to note in the header that the variants are approximate before the Hall and after trial 2.

10. **Small wording slips that blur the logic:**
    - The log card (line 266) says "`a` goals in 10 matches", but the table counts *matches with a goal*. Change it to `'after wishing, he scored in ' + v.a + ' of 10 matches. Without wishing, ' + v.b + ' of 10.'`
    - Siuuugull's list line (257), "Every match I wished before. Every goal.", claims the list is complete, but the list is the biased sample. Change it to `'My list! Every time I wished and scored. All me.'`
    - The Frogling's blue reply (250) contradicts itself ("I never forget" / the forgotten ones). Change it to `'Forgot to wish? A few times. I scored in those too. …Hm.'`
    - Sequins at home (95): the avatar heard him announce the polishing in the Prologue. Make the confirmation-bias point land with `'The trophy? I'm POLISHING it! I told the whole Fair! Twice!'`

## Not problems (checked)
- `need` defaults are satisfiable for every story; with `free: 3` and 3 spots, no click costs a notch unless you click a spot again.
- The head-start strike-outs (Frogling/Moth-kin +1 Progress) leave one wrong option, as the engine intends.
- The early clock fill skips the twist and verb; `last` still reads well at tier 4 for all three stories.
- Witness Tent's scripted `tick: 1` in the intro is consistent: Syllo's "When the drum roll ends" comes first, and its warning is the drum starting.
