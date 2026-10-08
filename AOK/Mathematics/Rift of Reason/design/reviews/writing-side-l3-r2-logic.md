# Writing gate, side stories lesson 3, round 2: Critic 1 (logic and consistency)

**Score: 9/10**

Re-reviewed commit d9958a1: `side-stories-l3.js`, `lesson1.js`, `js/ui/battles.js`, `js/screens/map.js` and `battle-launch.test.mjs`. Traced Fox (girl) and Owlet (boy), plus Raven, through both stories again.

## Round 1 items: all 14 fixed

- **Fox tick, then drain.** Danger goes 1 → 0, so the drain now works. Non-Fox players start at 1, which is still tier 1 with no mistakes.
- **Syllo trainer while away.** He is closed at the Gallery and the Fair Gate. The map shows "Learn", the card school modal is Learn-only, and his challenge returns on `finale-open`.
- **Lesson 1 guards.** `ch1.lantern` and `prologue.gallery.win` are guarded, with fallbacks.
- **Strawman.** It now targets the article.
- **Round 2 reply.** The line is specific, and the reply points to page nine.
- **Authority split.** Round 3's "expert / famous isn't right" no longer clashes with round 4's "I outrank you".
- **Smaller fixes.** The singer option, "Ignore him", three drafts listed, the nickname line moved before the correction, "my soldiers", outcomes 3 and 4 (only those still glowing, the wooden rank stays), the true Frogling memory, Moth-kin's lead, the Ward, and the Pip line moved first.

## New paths checked

- **Owlet blue in `headline-debate` `resolve.intro`.** It plays before `makeModel`, so the head start is 1. It skips round 1's `present` ask and strikes "Popularity" in round 1's naming ask, which is the strawman its line is about. Every path knows "long" by then.
- **Inner hooks moved to `clues.intro` (story 8).** They are leads before the clue hunt. None cites a clue the player hasn't found yet: the gold ink is visible on the stand, and the Fox's "picture him writing it" is imagination, as Fox should be.
- **Drum rule.** The marching happens on the last boom, at notch 6, which is tier 4. Warn[4] ("Last drum roll!") sets it up. Tiers 1–2 have "no last boom", and tier 3 has "stumbles before the last boom… anyway". All consistent.
- **Late steps for `fair-quote`.** With `!dead:sundial`, the new narrator line "That's me. All of me." is spoken by the living Sundial. With `dead:sundial`, the joke now comes before the correction, and the frame notes and solemn last line follow without a break.

## Remaining fixes

1. **syllo-away, Fair Gate: Syllo's Road challenge can still appear (js/screens/map.js l.338, js/ui/battles.js l.271 and `storyOffer` l.275).**
   - **The bug:** a time-rift jumper never gets `story-battle-won`, because `jumpToChapter` doesn't set it. A Ch3 jumper can visit the Gallery, get story 7 tier 4, then click the Fair Gate. The card school then opens `storyOffer()`, showing Syllo's face and the quote "Before the Road, show me you can reason from the rules". The same happens after `learn` succeeds.
   - **Fix:** at the top of `storyOffer`, if `syllo-away && !finale-open`, show the Learn-only card-school modal instead and return. Add that case to the new battle-launch test.
2. **Optional: recruitment-drive, Frogling (l.65).** "At the Fair, eyes glowed…" is said while standing at the Fair. Suggested wording: `'Last time eyes glowed here, the sky split. Syllo shouted it. I remember.'`.
