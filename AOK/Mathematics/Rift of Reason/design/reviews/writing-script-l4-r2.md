# Script gate, lesson 4, round 2: all three critics

Date: 8 October 2026. Checked: commit d46ee83 (`data/script/lesson4.js`), against round 1 (`writing-script-l4-r1.md`), WRITING-CRITICS.md, TEACHER-STORY-NOTES.md and SCRIPT-FORMAT.md §5 (`t`/`u`). Re-read the whole file once as a player: Raven girl (Ch3 deaths, Kuku, `dead:pip`, `fate: left`) and Owlet boy (jump-in, then bargain, no deaths, `fate: home`).

## Scores

- **Critic 1, logic: 8 / 10. Pass.** Every round 1 slip is fixed and gated correctly; only two small "how does she know" / geography wrinkles remain.
- **Critic 2, author: 8.5 / 10. Pass.** The clap now pays off "Nobody claps for 'probably'", Pip gets a warm goodbye in his own voice, and Nudge's grief carries through to trial 2.
- **Critic 3, editor: 8.5 / 10. Pass.** The ending has its cathartic image, Quill and the living Pip close, and "…Why?" now has a claim to push against on a skim.

## Round 1 problems: verified

1. **Clap payoff.** `:711` note after "Probably." (unvoiced, shelf cap and last word untouched); `:628` now asks the question it answers. Fixed.
2. **Pip's goodbye if alive.** `:629–632`, `!dead:pip`, fits tier 3 ("I'll start again" → "Then I checked it. Twice."). Fixed.
3. **Nudge after grieving Pip.** `:482–483` split by `dead:pip`; the new line keeps the arc to "Not again." and "…Why?". "SERVANTS" gone (`:452`). Fixed.
4. **Knowledge.** Sequins `:686` is now a question; Kuku `:269` names Fin (met in Ch3) and says how it heard. Fixed.
5. **Quill and "…Why?".** `:634` red-pen note; `:689` stall-holder claim. Fixed.
6. **Route-false lines.** `:165–169`, `:176–177`, `:229`. Fixed.
7. **Hard phrases.** `:213`, `:261`, `:648`, `:676`; duplicate "Cloudy, always" cut. Fixed.
8. **Beat before the Oracle.** `:779–783`: the joke greeting is replaced by a callous note and a flat greeting under `dead:pip`. Fixed.

No regressions found: the shelf still has at most 5 spoken lines (`:676`/`:679`, `:682`, `:687`, `:690`, `:691`); no avatar line says "probably" before `:709`; all understudy text is still in `u` or `t: ''`.

## Remaining problems (minor; fix if cheap, none blocks the gate)

1. **`:628` "Would you?" is ambiguous** for a non-native reader (would you stop? would you clap?), and it is the set-up for the clap. Fix:
   `say('It said "probably" once. Nobody clapped, so it stopped. Would you clap?'),`
2. **`:174` no establishing image with `dead:sundial`.** The narrator is silent here (Kuku arrives later), so the Tower Door opens on Pip's line with no picture of the tower. Fix: `say('The Server Tower. Cables like roots. Screens like leaves.'),` (drop the `when`; `say` turns it into a note exactly in this case).
3. **`:686–687` Tally's `u` is a statement.** She was never up the tower, so "You left it running." needs a source. Fix: add before `:686`
   `{ note: 'No box on the shelf for this one. You tell them where it is.', when: { flag: 'fate', is: 'left' } },`
4. **`:688` now muddles `:689–690`.** "It stops every passer-by with its first question" says the question before we hear it. Fix: `{ note: 'Nudge stands by the stall. No clipboard. It is learning a new word.' },`
5. **`:634` geography.** The Summit Rift shares the core chamber and Quill sat down there; "comes down the stairs" is odd. Fix: `'Miss Quill gets up off the floor and follows Nudge. She carries her red pen. She doesn\'t use it.'`

**Applied 8 Oct (evening):** 1 and 5 were already in; 2 (the tower picture via `say`), 3 (Tally's source note) and 4 (Nudge "learning a new word") applied as written above.
