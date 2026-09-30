# Class of Rowdies / After Hours — Critic Gate

Two deliberately separate critics reviewed the post-film story. The gate is **9.0/10 from both**. Scores are internal editorial QA, not objective measurement. Both critics worked from the code, the story file, and full-path screenshot runs: desktop at 1280×720 and 1440×860, mobile at 390×844. Every branch combination was covered, plus a timed-out fork.

## The brief being judged
Horror and chaos resolve into order and light. The world is a glitching, broken-Matrix speakeasy of smoke and chatter that grows clearer as order approaches. It uses Boat-style scroll storytelling with Telltale-style choices, plus jarring shocks that make the point that it's time to wake up. The message stays implicit: a rowdy class in a moratorium can route the same energy into learning or into distraction, and the cage is one of its own making. Nothing may be preachy or browbeating.

## 1. Story critic (continuity, logic, implicitness): 8.0 → 9.0 → **~9.3, passed**

**Round 1 (8.0).** The writing was praised: spare, wry, and honest about how good distraction feels. Three problems held it back.
- **Shocks fired on neon choices.** A timeout (which defaults to neon) hit hardest. That made the cattle prod a "wrong answer" buzzer.
- **The pre-wired cage bars read as a teacher's list of sins:** LATER, WHATEVER, NOT MY PROBLEM, TOMORROW.
- **Act III ended with three narrator-explains scenes.** Setups dangled: the old man vanished on the phone path, the stairs line contradicted the corridor, and a blown-out lamp was relit without comment.

**Fixes.**
- Shocks now land only on moments of recognition that every reader reaches: the slot, "since September", the overload, "Look up.", and idling.
- A neon choice gives a pink bloom and a cheer, because distraction feels good. A timeout gives a dull thud, and the neon lights without you.
- The other bars in the cage are now the speakeasy's own signs (NO CLOCKS, OPEN ALL NIGHT, TONIGHT ONLY, ONE MORE). The décor was the prison.
- The old man returns as the Orrery lecturer on every path. The stairs, the relit lamp, the pencil in your pocket and the "one more" → late-for-Period-1 chain all pay off.
- The thesis lines became images: "The neon hums. / The lamp doesn't. / Same current."
- The phone option became "Answer it" (social, not a strawman). The blow option became "Nobody could see you in it" (anonymity, not laziness).

**Round 2 (9.0, passed).** Two small contradictions remained: "forty messages" against "One becomes forty", and "every door on the way in" when the speakeasy door had a password. Both were fixed, as was the all-timeouts tally wording.

**One recommendation deliberately not taken.** The critic suggested replacing the 120 ms "WAKE UP." flash inside the blackout shock with "PERIOD 1.", because it is the one imperative on the page. It stays because "make the point it's time to wake up" is the creator's explicit brief, and at 120 ms it is felt rather than read. The teacher notes now say so honestly.

## 2. Avant-garde art critic (motion, stylisation, sound vs content): 7.3 → 8.8 → **9.1, passed**

**Round 1 (7.3).** The architecture was praised: a single eased `--chaos` dial drives the form. But it said the dial wasn't used as a dial.
- Acts I and II shared one glitch vocabulary, so dread and delirium blurred.
- The speakeasy read as "a tasteful salon with an overlay".
- The Matrix rain read upside-down.
- Lamplight still glitched.
- The overload didn't peak, and the shocks escalated only in amplitude.
- Bach's Prelude in C was "the most stock enlightenment cue there is".

**Fixes.**
- **Act I is now dread, not glitch.** Chaos sits at .4–.45, the words exist only while the tube is lit, and the slams bleed off the edge without an RGB fringe.
- **Act II slopes** from seductive (.55) to rotten (1.0), and the reader's own neon and lamp choices bend it.
- **Slams split into words** that scatter with chaos and settle into a line as order arrives.
- **Chatter rain** now falls top-down in amber and pink, stutters, and lets whole overheard phrases surface.
- **A second, dark smoke layer** actually hides words until it drifts on.
- **"Silence." stops time:** the smoke freezes mid-air and the record is cut with a needle-lift.
- **The overload** crowds in salon-hung frames, then drops everything off the wall before the blackout.
- **Shocks escalate in kind:** scare, then jolt, then full.
- **Glitch bursts** now displace real image bands and pixelate into macroblocks, and the previous painting datamoshes across Act II scene changes.
- **Neon signs** have dying letters and audible buzz-outs.
- **The bulb** lowers into the painted lamp.
- **Bach is gone.** The same 1917 Original Dixieland Jass Band record returns clean from Rembrandt's stairs to Monet's sunrise: same electricity, different wiring, carried by sound.

**Round 2 (8.8).** Two must-fixes remained. Lamplight still produced occasional glitches (fixed with a hard floor: no glitch below chaos .5). The match line collided with the line before it (fixed with a calm flow layout, words pinned still after the blowout, and older lines stepping back when a slam lands). The critic's should-fixes were also applied:
- a clean "clear" shock for "Look up."
- amber rather than Matrix-green decoding
- the sharpest type in the piece at dawn
- mobile tally and salon spacing

**Round 3 (9.1, passed).** Lamplight, the stairs and the blackout were confirmed clean. The critic's two leftover polish notes were also applied: a clean chime instead of an electric arc for the calm "Look up." jolt, and the calm column for the lamplight scenes on narrow screens.

## Safety
Flashes are single hits of at most two luminance swings, at least 1.1 s apart. The fluorescent tube never toggles faster than every 340 ms and goes quiet for 1 s around a shock. "shocks: gentle" removes shake and lightning and softens flashes and flicker. It switches on automatically under `prefers-reduced-motion`, which also disables scrambling, glitches and the chatter rain.
