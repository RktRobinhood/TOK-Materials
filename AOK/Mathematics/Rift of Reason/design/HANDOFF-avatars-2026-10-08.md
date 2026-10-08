# Handoff — "Avatars that matter" (#59), paused 8 October 2026

The teacher shut the laptop; all agents were stopped mid-task and their partial files committed as they were. Branch `avatar-powers` (off `card-arena`; neither is pushed).

## Done

| Issue | What | Where |
|---|---|---|
| #50 | Avatar powers in engine, AI, team codes, launchers; 23 tests; full suite green (536/537, one skip) | `data/powers.js`, `js/battle/engine.js`, `ai.js`, `team-codes.js`, `js/ui/battles.js`, `tools/test/avatar-powers.test.mjs` |
| #54 | Ten avatar voices cast (Gemini), inner-voice delivery + effect, auditions for 5 (one per species); creature voice lab; ElevenLabs tool and 5 species sounds (~750 of 10k monthly credits, rough local log) | `design/AVATAR-VOICES.md`, `tools/voices-cast.json`, `tools/voices-fx.mjs`, `tools/voices.mjs --audition --avatars`, `dev/voice-lab.html`, `tools/eleven.mjs` |
| #55 | Writing gate (two critics, 8/10 each) and baseline: current story 5/10 logic, 5/10 author | `design/WRITING-CRITICS.md`, `design/reviews/writing-baseline-2026-10-08-*.md` |
| #56/#60 | Research: Draw Steel + Disco Elysium; stakes clocks, one-shots, negotiation, comedic peril, 10 seeds | `research/draw-steel-and-disco-elysium.md`, `research/one-shots-and-stakes.md` |

## In progress (partial, committed as found)

- **#51 balance pass:** `--powers` sim modes done; costs/recharges retuned (committed); AI avoids exposing creatures to a ready Lantern/Close the Proof. `design/reviews/avatar-powers-balance.md` has the vs-none table (9 of 12 in +3..+8; Foresee +0.7 and Hold That Thought +1.8 are weak; Brainstorm +2.9 on the edge; first player 47.2% vs 46.9% without powers; rounds unchanged). **Still to do:** the pairs and tweaks tables (placeholders PAIRS_SECTION, TWEAKS_SECTION, OPEN_SECTION in the review), buff Foresee and Hold That Thought, re-run the full test suite. `design/AVATARS.md` table was updated to the new numbers (uncommitted change from the balance agent, now committed).
- **#60 main story outline:** `design/STORY.md` has sections 0–2 (what it fixes, the spine, the four twists, how it ends, rules of the world). **Still to do:** per-chapter beats, perils and stakes clocks, inner-voice beats, flags, recaps, the "Deaths and understudies" section (teacher: the worst tier may kill; core NPCs at most one death-risk moment; minor stations go dark; funerals/inheritance drop-ins; world darkens), sample lines.
- **#56 side stories:** `design/SIDE-STORIES.md` not started (10 one-shots at revisited stations, blinking icon, stakes clock, death rules as above).
- **#61 understudies:** `design/UNDERSTUDIES.md` skeleton only (roster/policy, cards, technical role/actor spec, drop-in scenes, art and voice budget).

## Next steps on resume

1. Finish the balance pass (#51).
2. Finish STORY.md, write SIDE-STORIES.md and UNDERSTUDIES.md (the briefs are the issue texts plus this file).
3. Run both critics on all three outlines; loop to 8/10 each (max five rounds, then the teacher).
4. Power button on the battle screen (#52).
5. Next Gemini quota day: `node tools/voices.mjs --audition --avatars avatar-owlet-girl,avatar-mothkin-boy,avatar-fox-girl,avatar-frogling-boy,avatar-raven-girl`.
6. Done: the teacher chose the plain voices and plain inner voices (8 Oct); creature filter dropped.

## Open decisions for the teacher

- ElevenLabs voice design needs a paid plan; free plan covers sound effects and TTS with premade voices only.

## Update, end of 8 October

- Done: #50–#52 (powers, balance, button); story engine (cast, inner voice, stakes clocks, Quiet Scenes, possession, dark stations, Settings switch); outlines passed the three-critic gate (`reviews/outline-gate-passed-2026-10-08.md`); **lesson 1 script passed** (logic 8, author 8.5, editor 8.5).
- Next: art session (`PRODUCTION-TODO.md`, lesson 1 order); voices on each quota day (`PRODUCTION-TODO.md`); add a `--script` filter to `tools/voices.mjs` before big narrator runs; then script lesson 2 through the same gate.
- Teacher decisions pending: provisional voices for Nudge/Guess-o-Matic/Signpost; OK for the Ch3 map change and the new Ch2/Ch4 puzzle code (asked 8 Oct).

## Update, afternoon of 8 October

- **All four lesson scripts passed the three-critic gate** (L1 8/8.5/8.5; L2 author 8, editor 8.5, logic fix applied as the critic specified; L3 8/8.5/8.5; L4 8/8.5/8.5). Reviews in `design/reviews/writing-script-l*`.
- Approved code done: Ch3 Newsstand–Plaza link removed and Tower Road behind the Tribunal; village fixed/hidden-count mode (Square, Hall stage 3, core trial 1); Copy and Pip clocks; core trials; four new Tribunal story cases.
- Understudies Tally, Achilles, Kuku, Rubberstamp are cast (voices); their deaths arm once their art exists.
- Full suite: 577 pass, 0 fail, 1 skip.
- **Not built yet:** side stories (`SIDE-STORIES.md`, need the negotiation encounter); the negotiation system (the Ch2 Mayor scene uses a dialogue stand-in); power tweaks (#53); a `--script` filter for voice recording; the Copy speaking in the player's own voice; Spare Axiom card; Hall stage skip.
- Leftover optional line fixes: lesson 4 review r2 items (tower line in say(), Tally's box note, "…Why?" give-away).
- Untracked OneDrive conflict copy `js/puzzles/tribunal-DESKTOP-MFKNDVN.js` (differs from the committed file); the teacher can delete it.
- Voices: record per `PRODUCTION-TODO.md`; art per `PRODUCTION-TODO.md` and Stage 13.
