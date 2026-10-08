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
