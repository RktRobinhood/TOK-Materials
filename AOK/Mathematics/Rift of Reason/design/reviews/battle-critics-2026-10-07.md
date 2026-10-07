# Card battle: critic rounds after the teacher's playtest — 7 October 2026

The teacher playtested the Card Arena and the guided lesson and asked for two critics on the battle screen (legibility & visibility; understandability & fun), each to reach 8/10, at most five rounds, then critics on the tutorial. Critics were subagents that played the real bench (`dev/battle.html`, port 8823) and the lesson in a muted tab; every round's report was read and acted on.

## Scores

Battle screen (five rounds allowed):

| Round | Legibility & visibility | Understanding & fun |
|---|---|---|
| baseline (old screen) | 5.5 | 5 |
| 1 | 6.5 | 6.5 |
| 2 | 6.5 | 6.5 |
| 3 | 7 | 6.5 |
| 4 | 6.5 | 7 |
| 5 (last) | 7 | 7 |

Guided lesson (rewritten first, then critics):

| Round | Clarity & pacing | Learning & fun |
|---|---|---|
| 1 | 6.5 | 6 |
| 2 | 7 | 6.5 |
| 3 | 6.5 | 7 |
| 4 | 7 | 7 |
| 5 (last) | 7 | 7 |

## Resume here

All ten critic rounds are done (board 5, lesson 5). Neither reached 8; every round's quick fixes are in, the last ones unscored.

### Earlier resume notes (kept for the record)

- Tutorial round 4 was started after the round-3 fixes (Fate step of its own, no answer in the bar on the open step, ▲ pointers, too-expensive spare cards so there is no early win, Kim's Filter mentioned earlier, hint after 25 s) and stopped before reporting. Next: rerun the two tutorial critics (prompts as in this session: muted tab, `Rift.Audio.speak` replaced by a timed fake, `Rift.Router.go('battle-lesson')` on port 8823), fix, repeat (up to round 5).
- Preview: `rift-merged` launch entry (port 8823) serves this checkout; port 8790 may be another session's server.
- All tests passed before the commit (full suite earlier: 511 pass, 1 skipped by design; the lesson/screen files again after the last changes).

Neither board critic reached 8 within five rounds. The round-5 findings were fixed afterwards without a further critic round (listed under "After round 5").

## What changed (teacher decisions in bold)

- **Fate track** on the middle bar as a reel: 7 spaces (3 past, NOW fixed in the middle, 3 coming), tinted by whose turn; it slides one space per End turn (fade under Calm motion). Further events wait in a "›› in N" chip. **Fate always moves forward 1 per turn; the draw-choice time moves were removed** (engine `options.timeDraws`, off). **Clockwork moves 1 space** (was 3).
- **Card plays per turn** (Fluxx-style "Play N"): 2 by default; new rule cards for 1 / 3 / unlimited plays, energy that stops growing or shrinks, a hand limit of 3, and four bonus rules (see `card-arena-2026-10-07.md`). Sim (600 games): first player 50.3%, 7.9 rounds.
- Side panel: **Rules in play** picture tiles (core: Win, Fights, Card plays, Attacks, Energy; changed rules gold); **the text log was replaced by a Recent plays column** of pictures at the table's left edge (teacher: like Hearthstone, small, hover for details).
- Pacing: opponent moves wait 1.25 s; a card the opponent plays is shown big first; rule changes are shown big while everything waits; turn banners for both sides; a one-line recap of the opponent's turn.
- Cards: short text on every face (tactic/axiom `short` fields), the full text in the magnifier's note; the magnifier opens beside the card after 220 ms and stays shut while aiming. Asleep/Lectured/No ability veils, Ready tags, a Danger warning that follows the rules in play, fight previews that warn when a reversed goal makes a hit help the opponent.
- End turn is a round medallion; energy is large with a plays counter; How to play is a one-screen visual sheet.
- **Voice:** the browser fallback speaks only with an English voice (the teacher's Claude app pane only has a Danish one); otherwise it stays silent and the text carries the line.
- **Lesson** rewritten (23 steps) in logical blocks: narration lines between Granny's moves, each waiting for the voice; Granny's side starts empty (hit the hero), her Guard comes next; every creature attack is forced by Guard or shows a rule at work; one open decision step with a trap (attacking under the reversed goal is stopped and explained); a closing TOK line.

## After round 5 (not re-scored)

Recap shows rule changes first and wraps to two lines; shorter face text on hand rule cards; 12px names on table cards; Fate spaces have tooltips; "rule card" wording everywhere (log, tooltips, Look It Up).

## Guard badge (teacher, 7 Oct)

Guard on the table is now the shield picture (ui/kw-guard) under the card, between the attack and health gems, instead of the silver frame; it dims while a rule ignores Guard.

## Missing or weak assets (Stage 12 in art-requests/ART-REQUESTS.md)

- 12.1: pictures for the 11 new rule cards (axioms-5, axioms-6).
- 12.2: icons for the basic rule tiles (Win, Fights, Card plays, Attacks, Energy), a card-play token, a Danger icon and a recap icon. The game uses each one automatically once it exists.

## Open (for the teacher)

- **Voices:** the new lesson lines have no recorded files yet (`node tools/voices.mjs --render`, Gemini quota). Until then: English browser voice or silence.
- **Art:** the 11 new rule cards have no `ui/axiom-<id>` pictures yet (they show ⚖).
- Critics' remaining wishes, not done: fight log showing the colour bonus split; ability rule text on Recent tiles; a "preview on the enemy" line when playing a rule; Guard/Colour tiles visible before they change; a match-specific TOK line on the end screen; a gentler first real match (the bench decks are random).
