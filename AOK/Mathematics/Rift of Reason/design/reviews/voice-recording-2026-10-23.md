# Voice recording — 23 October 2026

The scheduled 09:05 run stopped before recording, because this machine's local `main` could not fast-forward. The work was then done in a clean worktree taken from `origin/main` (91930dd3), so the local tree was left alone. Before this run, **2962/2981** lines were recorded. Missing were the 19 lines in [voice-missing-2026-10-22.json](voice-missing-2026-10-22.json).

## Recorded (6 lite TTS requests in all)

- **Rubberstamp, 18 tutorial lines:** recorded at 09:28 CPH in one lite batch request. That was the other computer's run; OneDrive synced its clips here, but it had not committed them.
- **kuku-o0st9l:** one `--single` request, with ✓ spoken as "a tick".
- **Slipped cuts re-recorded:** Whisper found two cuts from the batch that slipped:
  - `rubberstamp-185owf6` ended with "Follow the stages. Audit,", so `rubberstamp-15dcfg1` began mid-sentence.
  - `rubberstamp-1c74w0l` ended with "Example.", so `rubberstamp-12dpqkf` lost its first word.

  The raw take wasn't on this machine for a `--resplit`, so the four lines were re-recorded one at a time with `--single` (4 requests). The slipped takes are kept in `D:\Claude\work\voice-slipped-2026-10-23`.

Quota ledger after the run: lite 6/10 for 23 Oct.

## Checked

Local faster-whisper (small, CPU, no API) transcribed every final clip:

| Clip | Duration | sha256 (first 16) | Local Whisper transcript |
|---|---|---|---|
| kuku-o0st9l | 9.82 s | 3df18215dfea91de | When a row has only one empty cell left, that cell must be a tick. Keep going until every row has one tick. |
| rubberstamp-11fvkps | 11.02 s | 380f93d67cd94a49 | After the warm-up, its brain opens. The table counts past choices. Read it, then choose Now beat it to start the next round. |
| rubberstamp-12dpqkf | 12.55 s | 1556b2474c2af9b6 | Example, Baker says, sweep is an imp. In a world where sweep is honest, those words are false. Baker must then be an imp. |
| rubberstamp-15dcfg1 | 11.54 s | 790b11aafa99821d | Follow the stages, audit, name the flaw, then fix. We are checking who gets help and who misses out. |
| rubberstamp-17sqlo5 | 19.27 s | 2465506175eb7147 | Check rows for clashes and cross out the ones that cannot fit. Put tokens on the imps in the surviving world and accuse when every statement fits. How to play is free. The hint button shows its heart cost. Think first, then check your answer. |
| rubberstamp-185owf6 | 18.53 s | e2bd3d8c7eb11b88 | In the reveal, compare your model with what happened, explain which assumption caused any gap, and complete the reflection. How to play is free. The hit button shows its heart cost. Think first, then check your answer. |
| rubberstamp-1c74w0l | 9.94 s | 23f93abf0d2efe8f | Open the truth table. A row is one possible world. A column asks whether someone's words are true in that world. |
| rubberstamp-1dtkb2b | 11.64 s | bc79862d9972779c | Choose information cards with facts your model needs. Choose a model and use the calculator, table, or graph to find a result. |
| rubberstamp-1eovm7 | 9.53 s | 747af797bbbf3a88 | Watch the scene, choose what you wonder, then make a rough guess. The guess is a starting point, not a test of your maths. |
| rubberstamp-1h8stzw | 9.17 s | c70becbe8e37147d | Read the rule and budget, name the flaw, then choose one of the listed fixes to meet the stated goals. |
| rubberstamp-1ip5xjq | 8.74 s | cf07e39dff45addc | Find which villagers are imps. Every identity must fit all their words under these rules. |
| rubberstamp-1xwwk54 | 13.37 s | 225c196ee579a6bc | The four boxes count right and wrong decisions. Example, refusing help to someone who needs it is a missed need, even if most other decisions are right. |
| rubberstamp-3zbtgc | 21.98 s | 9f0a4168df084abd | Check who your fix changes, its cost, and the mistakes left. If asked, choose a value and support it with a reason from the audit, then hand in the audit. How to play is free. The Hint button shows its heart cost. Think first, then check your answer. |
| rubberstamp-5roqxx | 12.02 s | 7970e8eb0dd28fa6 | Click a villager to add an accusation token. Click again to remove it. Mark suspected imps. Leave honest villagers unmarked. |
| rubberstamp-fbkh0t | 10.22 s | 06d438449816d6cb | Example, if it always guesses your most common past move, choosing a different move can beat it. Watch whether its rule changes. |
| rubberstamp-gkb00m | 9.34 s | 1d12ecc8dd35a0f6 | Three acts. Wonder, investigate, compare. We need a useful question before a calculation. |
| rubberstamp-gsk6ws | 11.76 s | 17baddcd2d2eeb6c | Example, to fill an empty tank at a steady rate, we need its capacity and the amount entering each minute. Its color probably will not help. |
| rubberstamp-jocmxl | 8.90 s | 6aae4ac11f3c847c | Run the home visit audit. Click cards to see their scores. Compare the stamps with the needs the audit reveals. |
| rubberstamp-p0l1sv | 18.10 s | a4c29f51e52b2af3 | Reach the stated target, then explain how the guess works. Check the score and last result after each move. How to play is free. The hint button shows its hard cost. Think first, then check your answer. |

Every clip has its own line from the first word to the last. The only differences are punctuation, spelling (color/colour), "hard"/"hit" for "heart" and "Hint" (the same sentence comes through as "heart" in `rubberstamp-3zbtgc` and `rubberstamp-17sqlo5`) and "round" for "rounds". The voice tests (`voice-audit`, `voice-coverage`, `voices-fx`, `voices-split`) pass, 22/22.

Catalog: **2981/2981**. Every voiced line has a recording.
