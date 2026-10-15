# Credits

## Art

The development-only Card Arena board study (`dev/arena-prototype.*`, #107) adapts presentation ideas from Richard Webb's [hearthstone-web](https://github.com/Rymedy/hearthstone-web/tree/8d831088f96ec5c2e47d969e998f63ebcc5d6d56): compact board portraits, hand hierarchy and short transform feedback. Copyright (c) 2021 Richard Webb, MIT; the complete notice is retained in `vendor/hearthstone-web/LICENSE`. The new layout code is written for Rift's existing renderer. All displayed artwork, card backs and audio remain Rift resources; no upstream card/hero/board media, music, voices, video, cursor or font is imported.

Characters, scenes and UI art were generated with ChatGPT from prompts written for this game (see `design/art-requests/ART-REQUESTS.md`) and reviewed and edited by hand. Caricatures are affectionate satire inspired by public figures' public personas; they are not likenesses and imply nothing beyond the jokes.

The seven common starter helper portraits (#137, 12 October 2026) were generated using the built-in image generation tool from original project prompts and Rift style references. Selected original PNGs, exact prompts, reference identities and validation are retained in design/source-assets/4-caricatures/card-starters-2026-10-12/. They were visually checked against the approved style board and built into WebP through the existing asset pipeline. No commercial character art was imported. See design/ART-BIBLE.md for continuing cute-horror/public-persona direction.

## Sound

The opening also layers real server fans/disks by Joseph Sardin (BigSoundBank) with the horror score *Lost in a bad place* by congusbongus (OpenGameArt), both CC0. [Sources, licences and processing](music/CREDITS.md#the-algorithms-opening-soundscape-cc0).

From [Kenney](https://kenney.nl) (CC0), converted to short mono 22,050 Hz / 16-bit PCM WAVs for browser playback. Existing source sounds were shared with the psychology games in `psychology materials`. All effects peak at -13 dB; the four playback buses leave mix headroom. `tools/prepare-sfx.mjs` reproduces conversion and levelling with FFmpeg.

| File | Source pack | Original |
|---|---|---|
| page1, page2, back | RPG Audio | bookFlip1, bookFlip3, bookFlip2 |
| open, close, unlock | RPG Audio | bookOpen, bookClose, metalLatch |
| door, creak | RPG Audio | doorOpen_1, creak1 |
| step1, step2 | [RPG Audio](https://kenney.nl/assets/rpg-audio) | footstep00, footstep04 |
| throw, block, cloth | RPG Audio | knifeSlice2, metalPot1, cloth1 |
| rift | RPG Audio | creak3, reversed, slowed and faded |
| tap, correct, wrong, notify, tile, count | Interface Sounds | click_001, confirmation_001, error_008, question_002, glass_005, glass_003 |
| dial | Interface Sounds | tick_002 |
| tick | UI Audio | click3 |
| sigil, victory, escape | Music Jingles | jingles_PIZZI03, jingles_PIZZI07, jingles_PIZZI07 |
| loss | Music Jingles | jingles_PIZZI07, reversed and slowed |
| shatter, clunk | Impact Sounds | impactGlass_heavy_000, impactMetal_heavy_001 |

## Voices
Pre-rendered with Google Gemini text-to-speech from the game's own script.
The voices are Gemini's prebuilt synthetic voices (`gemini-3.8-flash-tts` and `gemini-3.8-flash-lite-tts`), one fixed voice and acting direction per character in `tools/voices-cast.json`. Caricature voices are directed by style (energy, cadence) and never told to imitate a real person. The Algorithm's chorus and the Sundial's room echo are added afterwards by `tools/voices-fx.mjs`. Any line without a recording uses the browser's built-in speech. The player's avatar is never voiced, and recordings leave out the player's nickname.

## Adventure trailer

The trailer uses the game's original artwork and an original, spoiler-light narration developed from the teacher's supplied *Rift of Reason Trailer Package* pitch. The narrator is ElevenLabs' synthetic Brian voice, generated with `eleven_v3`; it does not imitate an actor or public figure. Four instrumental orchestral cues were generated with ElevenLabs sound generation. Effects reuse the game's ElevenLabs recordings. The edit, comic panels, sprite animation and soundtrack mixing are implemented in JavaScript; FFmpeg handles production audio/video codecs. The portable MP4 is rendered with `@napi-rs/canvas` (MIT) from the same JavaScript compositor. See `data/trailer.js` and `tools/trailer-*.mjs` for the script and production sources.

## Mechanics and open puzzles
- Battle rules adapted from *Mindbug* (Richard Garfield, Christian Kudahl, Marvin Hegen, Skaff Elias; Nerdlab Games, 2022).
- Knights-and-knaves, the 2-4-6 task (Peter Wason, 1960), Euler paths (Leonhard Euler, 1736) and the nine-dots family are classic public puzzles.
- Syllogism flavour after Lewis Carroll, *Symbolic Logic* (1896) and *The Game of Logic* (1886), public domain.
- Black Box and Mines from [Simon Tatham's Portable Puzzle Collection](https://www.chiark.greenend.org.uk/~sgtatham/puzzles/), version 20260923.616da16, MIT. Local copies use the original compiled engines with an offline-loading frontend adaptation. Copyright/permission notices and original-file hashes are in `vendor/tatham/LICENSE.txt` and `upstream.json`; see its README and `tools/vendor-tatham.mjs`. Black Box was contributed by James Harvey, based on Eric Solomon's puzzle. Native games are credited in their station introductions and local frames.

## Fonts
Fredoka and Nunito via Google Fonts (SIL Open Font License).
