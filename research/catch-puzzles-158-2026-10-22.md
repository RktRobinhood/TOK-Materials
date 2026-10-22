# The three catch puzzles for #158: teaching without text, hints and average players

Research date: 2026-10-22. Second addendum to [catching-arena-158-2026-10-18.md](catching-arena-158-2026-10-18.md) and [catch-arcade-158-2026-10-22.md](catch-arcade-158-2026-10-22.md). It covers the three turn-based catch games: Lantern Lure, Trail Finder and Picture Catch. [Background] means general genre knowledge, not checked against a source in this note. [Builder] means our own design call or measurement. No classroom measurement is claimed.

## The genres

- **Lantern Lure: tile-rotation ("pipe") puzzles.** [Background] Players turn pieces in place until one connected route joins a start and an end. Two things make the genre readable. The connected part lights up, so progress shows on every tap. And a turn is free to undo by turning again, so mistakes cost time rather than the round. [Builder] We keep the lit trail and limit turns. One clockwise turn repairs each scrambled route piece, and the solver checks every alternative route before a board is served.
- **Trail Finder: Minesweeper-style deduction.** [Background] A number counts hidden hazards in the eight touching squares. A good layout can be solved without guessing ("no-guess" generation, as in Simon Tatham's *Mines*). [Builder] Boards are admitted only if a reader using single numbers, one number inside another, and the total snare count can clear them from the first opening, without guessing.
- **Picture Catch: the eight-piece sliding puzzle.** [Background] Half of all arrangements can't be solved (the parity rule), so shuffles must come from legal moves. The hardest arrangements need 31 slides. [Builder] Every board is picked from an exact reverse breadth-first map at a known shortest distance, so the budget is honest.

## Teaching through the screen

[Builder] The teacher asked for at most one line of text, with the rules shown through the board (#158, 18 Oct). Each game has one rule line of 50 characters or fewer. That fits on one line on a 390 px phone; it is measured in a real browser and checked by a test. Before Start, a **static** example is outlined: the first Lantern piece to turn, or one Trail Finder number with the hidden patches it counts. Picture Catch shows its whole reference picture and gold-edged movable pieces. Nothing animates, so Calm motion needs no separate version for the puzzles.

## Why hints, not more moves

[Builder] Measured with the average Picture player below, a player who loses usually wanders off a good route; +10 slides added only 6–9 points. So each help bonus also gives **2 hints**. A hint marks the next slide of a shortest route with a "Next" badge, costs no move, and comes one at a time. Following hints still changes the player's path afterwards, so 11–16% of unaided wins were lost with hints (counted, not hidden). Overall, one help bonus adds 27–32 points.

## Why these "average sensible players"

[Builder] A solver wins every admitted board, and a random player wins almost none, so neither says anything about "about half the time". Each puzzle player sees only what the screen shows and makes an ordinary mistake:

- **Picture:** two-slide look-ahead on piece distances, misjudged by up to 2.5 squares, and never undoes its last slide on purpose.
- **Lantern:** re-plans from the screen, but 30% of taps are plausible slips on or beside the lit trail. A "follow the light" player without planning was tried first. It either finished at once or thrashed for hundreds of turns, so it was not a fair average.
- **Trail Finder:** reads one number at a time and never combines numbers. When stuck, it opens the patch touching the fewest numbers, and it misclicks 3% of safe opens.

These are machine stand-ins. They set the dials. They don't predict how students do. The tuning and measured rates are in `AOK/Mathematics/Rift of Reason/design/reviews/catch-puzzles-158-2026-10-22.md`.
