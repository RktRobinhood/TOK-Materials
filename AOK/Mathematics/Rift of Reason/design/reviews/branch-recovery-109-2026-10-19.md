# Recover useful branch work — #109, 19 October 2026

The teacher requested sequential issue completion and consolidation of every branch into main. Baseline for this recovery: `0a02cb7` (completed #128). The old `D:/Claude/work/wt-109` contained an uncommitted alternative arena integration over `0a4d704`.

Most of that alternative layout is superseded by the shipped selected-A board, physical piles, draw cues, responsive arena CSS, focusable inspectors and the #109 lifecycle fixes. Copying the whole file would roll those fixes back. This recovery ports its useful remaining behavior into the current screen instead:

- Drawn cards travel from the correct physical pile as plain card backs. Own cards reveal on arrival; opponent cards stay concealed. Rule draws originate at the shared pile for either side. Duplicate axiom copies use their newly appended hand positions. Calm motion and OS reduced motion use short fades. No engine action waits for an animation.
- A keyboard draw moves focus to the newly drawn card. Board/hand/ability/Fate focus is recovered semantically across rendering when another control has not deliberately taken focus.
- Hovering, focusing or tapping a visible card offers a persistent **Read [name]** button. It opens the same full card text and **Active effects** in a native dialog that fits narrow screens. The opponent waits; Close/Escape returns focus and resumes scheduling. Hidden opponent hands never become reader candidates.
- New animation jobs use the existing screen's presentation owner. New actions, resize, battle end and navigation cancel them and remove ghosts. The existing audio, Fate reel, action-state guards, selected layout and lesson behavior remain authoritative; the prototype's duplicate lifecycle, arbitrary extra event delays and replacement CSS are not reintroduced.

## Verification

Five new screen regressions cover keyboard-draw focus; full reading and opponent pause/resume; stale background input; selection repaint and touch-style click; destruction; card-back flights, Calm motion and action cancellation; opponent shared-deck origin with hidden identity; and asynchronous native dialog close events. Two review findings were fixed before publication: opponent axiom draws originally chose the personal deck; a stale native close event could close a newer reader.

Focused battle screen, environmental UI and mounted lesson checks: **68 passed**. Independent Standards review: no findings. Spec review: both findings fixed, no remaining actionable findings. Final full tracked suite: **1,178 tests; 1,177 passed, one existing skip, zero failures (239.3 seconds)**.

Actual in-app browser checks: card reader full text/Active effects at desktop and 390×844; native Escape/Close; opening it during the opponent turn pauses that turn until dismissal; keyboard draw focuses the drawn Astrophysicat; no warning/error logs. The phone-width reader fits without clipping its text. These are browser viewport checks, not physical touchscreen or school-laptop observations.

This completes the useful work recovered from that abandoned prototype. **#109 and #66 remain open** for their separately tracked wider acceptance and #108 preview dependency; this branch recovery does not claim those epics complete.

## Preservation and consolidation

Before detaching or removing branch references, saved every changed/untracked file from the four dirty legacy worktrees, binary tracked diffs, base commits and SHA-256 manifests at:

`D:/Claude/work/TOK-branch-recovery-2026-10-19/`

The four original dirty checkouts were detached and moved into its `checkouts/` directory; all changed/untracked file hashes were checked both before and after the move. The verified `branches.bundle` preserves divergent branch history with prerequisites already present in main. The primary checkout's unrelated OneDrive duplicates, unfinished Mending tests and other pre-existing untracked files are untouched.

Branch dispositions:

| Branch/work | Reconciliation |
|---|---|
| `rift/issue-100` dirty attempt | Earlier shared activation implementation, superseded by main `9502c05`; original changes archived. |
| `rift/issue-111` dirty attempt | Earlier three-hunt implementation, superseded by main `12def30`, `c9d4d45`, `55f03b1`, `f267d77`; original changes archived. |
| `rift/issue-120` dirty attempt and `backup/local-120-attempt-2026-10-16` | Earlier alternate Fate leap API/tests, superseded by main `80c21de`; original changes/history preserved. |
| `rift/issue-109` dirty attempt | Useful draw/reader/focus work recovered here; obsolete layout/lifecycle reconciled to shipped implementations. Original preserved. |
| `main-T14S-G6-MP-2` | Three old voice batches. All 101 MP3 paths exist on main with later recordings (including `b102dbd`), so retain current audio/manifest and preserve old ancestry. |
| `origin/rift/issue-121-temporal-pack` | `git cherry main` reports its patch already applied (`- 51ddfa8`); preserve ancestry without replaying it. |
| `origin/review-evidence/rift-playtest-2026-10-10` | Its 15 historical evidence files were absent from main; integrate the real evidence tree. |
| Remaining `rift/*` and `claude/keen-faraday-80a9a4` branches | Already ancestors of main; remove references after clean worktree cleanup. |

The final consolidation receipt records main/remote state and branch removal after successful publication.
