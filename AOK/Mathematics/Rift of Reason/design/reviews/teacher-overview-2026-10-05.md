# Teacher overview checks — 2026-10-05

Scope: #31. Pasted backup/team codes satisfy the requested pasted-or-scanned input; camera scanning is unnecessary. The page is linked from the game title and also available directly as `teacher.html`.

## Behaviour

- Backup codes yield anonymous group summaries: chapter, distinct completed puzzle stations, separate honour bonuses, collection size and team size. Team codes yield team size only; no progression is invented.
- Summaries live in tab memory. Codes, nicknames, seeds and creature identities are discarded after successful reading. Group numbers 1–60 are explicit slots: replacing a slot updates its report atomically. Remove, Clear and Reload discard reports. Reusing a student under a different slot would double-count them; the page explains this.
- Code reading calls pure decoding and team validation only, with additional backup shape/version/known-map checks. It never calls State.load/replace/importCode/save and does not boot the game. Existing game storage is untouched.
- Class maps show completed station reports divided by the number of loaded backups across all chapters; team-only codes are excluded. Projector mode hides code inputs and individual rows, fits the map within the normal browser viewport, and exits with its button or Escape. Station names/counts are also available in a text list.
- Maps remain available with no reports for introducing each lesson. Values are described as editable adventure snapshots, not live tracking, mastery or grades. No network upload, camera permission, accounts or persistence is introduced.

## Evidence

- **330 tests passed**, including no player-state/storage writes, anonymous summaries, duplicate-station handling, team-only exclusion, defensive copies, atomic failed replacement, removal/clear and rejection of unsupported/damaged/oversized backups.
- Independent Standards and Spec source reviews report no actionable blockers.
- Browser: a malformed synthetic backup was rejected without adding a row. A valid synthetic backup produced two completed puzzle stations, one honour bonus and one owned/team creature. A synthetic team code showed team size one and no invented chapter/progress. Class map denominator stayed one with both rows loaded. Raw textarea emptied after success, and the synthetic nickname never appeared.
- Chapter-two map displayed Lamp Lane 1/1 and other stations 0/1. Projector screenshot shows the map and its explanation together, with no individual rows. Reload removed reports; Escape exited projection; Remove/Clear returned to no reports. No browser console errors recorded on this page.

## Limits

No actual student codes or classroom devices were used. Local-file browser navigation remains blocked by this session's browser policy; all dependencies are local classic scripts and the page avoids fetch/storage boot paths, but actual `file://` play is unverified. Anonymous reports still reveal aggregate class progress on the projector; they are intentionally not an assessment record. The page does not automatically detect duplicate students assigned different group slots.
