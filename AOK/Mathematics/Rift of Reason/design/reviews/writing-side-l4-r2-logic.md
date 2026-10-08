# Writing gate, side stories lesson 4, round 2: Critic 1 (logic and consistency)

**Score: 9/10**

Re-reviewed commit 820ade4 (`side-stories-l4.js`, SIDE-STORIES.md §2). Traced Moth-kin (girl) and Raven (boy), plus Owlet and Frogling, through every branch again.

## Round 1 items: all 12 fixed (12c settled the other way, and that is fine)

- **Blue head starts (Progress).**
  - Story 9, Moth-kin: +1 strikes "a hundred more ordinary days" in round 1, the right ask.
  - Story 10, Raven: +1 Interest (2 → 3), which fits "Define 'most'".
  - Keeping story 9 at Progress 4 (3 rounds plus the blue notch) matches lessons 1–2. Accepted.
- **Story 9 lines.**
  - "accurate" is now said before the Raven quotes it.
  - Mirage's line now reads "nine times in ten".
  - "It will probably be right."
  - Round 3 has the reference-class reply ("Not about him").
- **Story 10.**
  - The Volt note comes before Achilles' "limping one", and Speedcheeta's "Number TWO" is gated.
  - The ask is "Asking isn't needing", and "Fair one" is gone from the tier 1–2 last line.
  - "Berries for everyone" is gone. The fame argument is no longer marked sound.
  - The Granny and Achilles notes are in outcomes 1–2, "the limping one" is used, and the tea leaves and crystal ball sit in the right branches.

## New paths checked

- **Speedcheeta accusation and twist.** "Are you HACKING my app?" sets up "Nobody hacked it. It counts exactly what Beastie told it to count." This works in both the GRANNY and ACHILLES orders.
- **side.9.sign 'accurate'.** It sets its own flag. "By evening, a new queue" shows the cost of a true but misleading sign at tiers 1–2, and doesn't clash with `honest-label` or the tier flag `side.9`.
- **Mirage's twist line.** "I saw a crack… in my ball… I got lucky" matches her prologue line (lesson1.js l.190). It's a good TOK beat: one lucky hit is not knowing.
- **Achilles' grief line (GRIEF).** It is spoken only with ACHILLES, so the `t: ''` text never shows. It is a memory of her habit, so it does not assume he saw Granny at this tablet.
- **Tier 4.** "Volt is still waiting. He doesn't ask." and the new last line both fit the proxy lesson.

## Remaining fixes

1. **giveaway-app, outcomes 1 and 2, Achilles (l.394–395, l.404–405): he speaks after running off.** The note "Achilles carries a basket/soft berry to Volt. He runs off before anyone can thank him." is followed by GRIEF, his spoken line "She typed with one finger…".
   **Fix:** put GRIEF before the carry note in both outcomes. He speaks, then carries the berries and runs off. Outcome 3's order is already right.
2. **Optional: giveaway-app, outcome 1 with the random draw (l.221 + l.393).** "The draw is random. Volt wins a basket. So does Speedcheeta" implies there are winners and losers. The next note then gives Granny a basket anyway, which blurs the "ignores need" trade-off.
   **Fix:** add a draw-only variant: `{ note: 'Granny\'s name comes up too. Luck, not need. She types "thank you". It takes the rest of the day.', when: { all: [GRANNY, RULE('draw')] } }`. Gate the plain note with `{ not: RULE('draw') }`.
