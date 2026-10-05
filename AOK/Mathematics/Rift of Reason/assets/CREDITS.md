# Credits

## Art
Characters, scenes and UI art were generated with ChatGPT from prompts written for this game (see `design/art-requests/ART-REQUESTS.md`) and reviewed and edited by hand. Caricatures are affectionate satire inspired by public figures' public personas; they are not likenesses and imply nothing beyond the jokes.

## Sound
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

## Mechanics and open puzzles
- Battle rules adapted from *Mindbug* (Richard Garfield, Christian Kudahl, Marvin Hegen, Skaff Elias; Nerdlab Games, 2022).
- Knights-and-knaves, the 2-4-6 task (Peter Wason, 1960), Euler paths (Leonhard Euler, 1736) and the nine-dots family are classic public puzzles.
- Syllogism flavour after Lewis Carroll, *Symbolic Logic* (1896) and *The Game of Logic* (1886), public domain.
- Black Box and Mines from [Simon Tatham's Portable Puzzle Collection](https://www.chiark.greenend.org.uk/~sgtatham/puzzles/), version 20260923.616da16, MIT. Local copies use the original compiled engines with an offline-loading frontend adaptation. Copyright/permission notices and original-file hashes are in `vendor/tatham/LICENSE.txt` and `upstream.json`; see its README and `tools/vendor-tatham.mjs`. Black Box was contributed by James Harvey, based on Eric Solomon's puzzle. Native games are credited in their station introductions and local frames.

## Fonts
Fredoka and Nunito via Google Fonts (SIL Open Font License).
