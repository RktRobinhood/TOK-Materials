# Writing gate, puzzles #62, round 2: Critic 2 (Author) and Critic 3 (Editor)

**Critic 2, Author and style: 8/10 (pass)**
**Critic 3, The editor: 8/10 (pass)**

Commit 863f04a fixes all eight items from round 1. Granny's line now works for any ladles and is in her voice. Muskrat owns the toll and the tickets, so the recurring antagonist is present. Failed crossings name the pair who clashed. "Byline" is explained and given a motive ("Scared of being wrong in print"). The idioms are gone.

The three new lines are good:
- **River practice result** ("A and B are safe while you are with them…"): teaches the idea of going back without solving the real level. Plain and speakable.
- **Practice title** ("Start a safe crossing"): fine.
- **Narrator reminder for `side.6 gte 3`** ("Upstream, a rocket sits in the river. Muskrat calls it a reef now."): a strong callback to the lesson 2 rocket story. It pays off on a revisit, is short, dark and dry, and is exactly the right tone. Keep it.

## Remaining problems (polish, not blocking)

1. **Mrs Crumb's reminder now reads as a death line even when Granny is alive** (lesson2.js, `station.b-kitchen.reminder`). Since 863f04a, Mrs Crumb also hosts after `ch2.hall.win` while Granny may still be alive. "Her ladles are still here" suggests Granny is gone. Use a line that works either way:
   `{ s: 'baker', t: 'Ladles again. Exact cups. Granny would know if you guessed.', when: { any: [{ seen: 'ch2.hall.win' }, 'dead:granny'] } }`

2. **The water-jugs practice result switches ladles without warning** (tutorial-examples.js, `water-jugs` result). The board uses 3 and 5, and the result suddenly says 4 and 6. Add one word:
   `result:'Four cups, by pouring alone. With ladles of 4 and 6 instead, every amount is even. So 3 cups can never appear.'`
