# Card pipeline voice and sound handoff

#139 supplies all 72 proposed creature delivery directions and explicit existing SFX keys in [PERSONA-ROSTER.md](PERSONA-ROSTER.md) / persona-roster.json. They are original voice briefs, never celebrity impressions or copied catchphrases. Each sharedSfx list is validated against data/sfx.js; select cues at their actual action rather than layering them. Descriptive words in voiceDirection do not create sound keys. #123 roster/strategy review precedes names/lines in runtime sources. Record only released batches through the existing voice plan, render and audit flow; preserve every existing recording and hash. No new lines or audio were generated for this cast pass.

Production sources remain data/script/*.js, creature lines, data/barks.js and Granny's lesson steps. tools/voices.mjs --plan enumerates actual missing lines; this proposal list is not silently injected into that scan. Preserve all current text hashes, recordings, cast pins and quota ledgers. The current recording audit is design/reviews/voice-recording-2026-10-12.md. No recordings were generated in this planning pass.

| Need | Proposed wording / treatment | Release gate |
|---|---|---|
| Deck workshop, Granny | “Your creatures support your spells. Count the matching colours in your deck.” | #112/#114/#115; text review before recording |
| Workshop, Granny | “You can cast the spell even when that creature is off the board.” | #115 |
| Workshop, Granny | “Take up to two copies of one card.” | #115 |
| Fate timing, Granny | “Both players take a turn. Then Fate moves once.” | #116 and revised lesson |
| Plot reward, narrator or current host | “A story reward. You will not find this card in packs.” | Story acquisition issue; source-specific speaker review |
| Pack rarity announcer | “Mythic.” / “Legendary.” | Pack reveal issue; optional shared two clips, #43 |
| Starter creatures | Three short lines per released creature: introduction, attack, defeat. Draft only after name/art/effect review; public-persona rules still apply. | #113; seven creatures, at most 21 first-pass lines |
| Expansion creature barks | Only released batches; shared nonverbal sounds where fitting. Do not generate 72 voice casts in advance. | #123 staged releases |

Use existing open, reveal, card-play, jingle, axiom, block, hit and defeat sounds; sequence them without five simultaneous celebrations. No new paid sound generation is needed for the board slice. Sound budget and audition workflow remain tools/sfx-plan.mjs and tools/README.md. New lines must enter their authoritative runtime source only when implemented, then plan/render/audit through the established voice tools. Missing optional announcements fall back to readable rarity labels; battle never waits on an API. Do not prune or replace unrelated recordings.
