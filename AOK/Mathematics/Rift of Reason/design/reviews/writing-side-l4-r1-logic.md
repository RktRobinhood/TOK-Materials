# Writing gate, side stories lesson 4, round 1: Critic 1 (logic and consistency)

**Score: 7/10**

Under review: `data/script/side-stories-l4.js` (commit f714b05). Traced: Moth-kin (girl, the board-power gender) and Raven (boy) through both stories; Owlet, Fox and Frogling through the shared path and their negotiation cards. Story 9: with and without `side.1 = 4`, every tier, all three signs. Story 10: GRANNY, ACHILLES and no holder, tiers 1–4, `{ clock: 'side.10', lte: 3 }`, all three rules, the Sorting Room won or not with `dead:pip`, and the `berry`/`honest-label` finale barks in lesson4.js.

The base-rate logic is right at its core. The 90/0 and 0/10 split table is consistent with the log, the dial and Mirage, and the test for foresight is the correct one. Gating, ripples and barks fit together. Each species' negotiation card always hits an unused care, so none can fall into the "facts" pitfall. Problems: both blue options do nothing, several lines get ahead of what the player knows, and a few TOK statements are overstated.

## Problems and fixes

1. **Both stories, blue options: the drains are lost.** fortune-machine l.64–65 (Moth-kin) and giveaway-app l.257–258 (Raven) run `{ clock: 'side', drain: 1 }` in `clues.intro`. Danger is still 0 there, and `Stakes.drain` drains nothing at 0 (stakes.js l.139–145; side-stories.test.mjs l.373–389 shows a drain at 0 being lost). Both species get a thinner path.
   **Fix (preferred):** change each to `{ clock: 'side', progress: 1 }`. This lands well in both stories:
   - Story 9: the head start strikes "Ask it about a hundred more ordinary days." in round 1, which is the test that Moth-kin's dial line points to.
   - Story 10: the negotiation gets +1 Interest, fitting Raven's "Define 'most'".
   - Update the §2 table in SIDE-STORIES.md ("drains 1" → "+1 progress").
   **Alternative:** start each `clues.intro` with `{ clock: 'side', tick: 1 }`, as story 1 does.

2. **fortune-machine, Raven hook (l.57): it quotes a word nobody has said.** `'"Accurate." Accurate at what?'` comes before anyone says "accurate". The start, the teaser and Altmanta all say only "ninety per cent" or "CONFIDENCE: 90%". The word first appears on the sign, in `after`.
   **Fix:** Altmanta's start line (l.45) becomes `'Ninety per cent accurate. It will be better soon. Very soon.'`.

3. **fortune-machine, Mirage clue (l.75): the arithmetic doesn't work.** "I could say that all year and be right ninety times." 90% of a year is about 330 times, not ninety.
   **Fix:** `'I could say that every day and be right nine times in ten. I chose not to.'`.

4. **fortune-machine, round 1 option 4 reply (l.118): Mirage claims certainty.** "Tomorrow will be like today, darling. It will be right." This states as certain the very thing the story says is only usual. It undercuts "prediction vs knowing".
   **Fix:** `'Tomorrow will probably be like today, darling. It will probably be right. We\'ll learn nothing.'`.

5. **fortune-machine, round 3 (l.145–146): the wrong answer is marked wrong for an unclear reason.** By the story's own numbers, a "same as yesterday" guess is right 9 times in 10. So "he will fail, nine times in ten" looks almost justified, and Altmanta's "Is that not what it means?" doesn't say what is wrong with it. The real error is the reference class: 90% is the box's hit rate over all its fortunes, nearly all on ordinary Fair days. It is not the chance that this hedgehog, who might practise, plays badly again.
   **Fix:** keep the option and give it a teaching reply: `{ s: 'mirage', t: 'Its ninety is about all its fortunes. Mostly ordinary days. Not about him.' }`.

6. **giveaway-app, start with ACHILLES (l.235–237): he refers to someone not yet shown.** Achilles says "Give mine to the limping one" before the note that shows Volt limping.
   **Fix:** move the Volt note (l.237) up to sit right after Beastie's line (l.232).

7. **giveaway-app, ranking clue with ACHILLES (l.279): Speedcheeta's rank is wrong.** "Number ONE!" is unconditional, but in this branch Speedcheeta is second ("Then Speedcheeta…", l.275).
   **Fix:** gate the line on `{ not: ACHILLES }` and add, for ACHILLES: `{ s: 'speedcheeta', t: 'Number TWO? Behind a GRANDPA? …CHAT, am I supposed to be hurt?' }`.

8. **giveaway-app, `ask` vs `after` (l.350, l.366–374): the ask commits to a rule that two of the choices drop.** The ask commits Beastie to "Count need, not asking", but then two of the three rules ignore need: the draw, and first come first served, which rewards speed just as the old proxy did. The last line (l.409) then calls any of them "New rule. Fair one." That overstates fairness in allocation, which is the point the trade-offs are meant to make.
   **Fix:** ask: `'Change the rule. Asking isn\'t needing.'`. Last line, tiers 1–2: `'New rule. …It\'s getting more views than the old one. Huh.'` (drop "Fair one").

9. **giveaway-app, outcome 1 (l.382): one line makes the rule choice pointless.** "There are berries for everyone." If there are, which rule you chose stops mattering, and the draw ("Volt wins a basket") and first-come ("berries left for the slow ones. Today.") notes contradict it.
   **Fix:** `{ note: 'Volt tries the lightning pose. Carefully. He might follow you.' }`.

10. **giveaway-app, fame argument (l.319): flattery is marked sound.** `sound: true` on "Film the fix… People love that." treats an appeal to views as a sound reason. Ch3's negotiation marks fame cards "slick" (STORY.md Ch3 table).
    **Fix:** remove `sound: true`. It still hits the `fame` care for +1 Interest, but costs a point of Patience.

11. **giveaway-app, GRANNY branch, tiers 1–2: her thread is set up but not resolved.** She is the opening image ("I… need… a… ber—"), but outcomes 1–2 never mention her. Only the finale bark ("I had a berry") pays it off, and that is optional.
    **Fix:** add to outcomes 1 and 2 `{ note: '{role:granny} gets a berry. She didn\'t have to finish typing.', when: GRANNY }`. For ACHILLES: `{ note: 'Coach Achilles passes his on again. Nobody stops him.', when: ACHILLES }`.

12. Minor:
    - (a) giveaway-app, outcome 3 Achilles (l.395): "I'll give it to the eel." reintroduces the epithet that the Round 4 change list says was removed. Use `'Thanks. I\'ll give it to the limping one. He won\'t ask.'`.
    - (b) fortune-machine, clues intro (l.51): Mirage reads tea leaves in every branch. That fits only BALL, where story 1 had her switch to tea leaves after losing the ball. With NO_BALL use `'Madame Mirage sits on the step, polishing her crystal ball. The queue walks past her.'`.
    - (c) The spec says story 9 has Progress 4; the script has 3, matching its 3 rounds. Update the spec.
    - (d) giveaway-app, Frogling: with the Sorting Room won, the inner line cites the Sorting Room but the negotiation card uses the pond line. That's acceptable; optionally make the card `'The Sorting Room counted the wrong thing too. It cost us.'` when the inner line did.

## Checked and fine

- **Story 9 TOK.** "Score it only on the days when something changed" is the correct test. The table is consistent with the log (90/10), the dial and Mirage. The correct reading ("gets the usual days right; never saw a change coming") is not overstated. "Broken" is rightly false, "90% ACCURATE" is rightly true but misleading, and the last line asks the question.
- **Information order.** The table appears only in round 2, after the test choice. The twist shows the crack-day log entry on every path. Any two clues support "guesses the usual".
- **`side.1 = 4`.** Story 1, tier 4 ("So is the crystal ball") matches "A crow sold it to a manta" and the ball's return at tier 1.
- **`{ clock: 'side.10', lte: 3 }`.** It is read before the tier, with no ticks in between, so tiers 1–2 always set `side.10.rule` and get exactly one RULE note. Tier 3 matches "the app is locked". Tier 4 (a full clock) skips `after`.
- **Holders.** GRANNY, ACHILLES and NO_GRANNY are mutually exclusive. `{role:granny}` and the `u:` lines go to the right actor. `berry` is set only with a holder, so `finale.bark.berry` (t/u) always has a speaker. The Achilles bark ("Gave it to Volt") fits tier 3.
- **Frogling and `dead:pip`.** The Sorting Room line is gated on `ch4.sorting.win` and `!dead:pip`, so it never sits next to Pip's death.
- **Negotiation cards.** Every species' card hits an unused care (fairness, safety or fame) and never the "facts" pitfall. `honest-label` matches `finale.bark.label` word for word.
- **Other checks.** No understudy appears outside its gate, and nobody known is possessed. Gender changes no lines.
