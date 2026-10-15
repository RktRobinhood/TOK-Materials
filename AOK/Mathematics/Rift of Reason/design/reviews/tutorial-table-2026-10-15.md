# Production card tutorial table — 15 October 2026

The teacher found the new board, decks and foreground artwork absent from the prologue card tutorial. Finished art and opening changes were already committed and pushed through 2bbe164; the selected card board remained a developer study. This slice brings its presentation into the native battle screen, shared by Granny's short lesson, full lesson and normal matches.

## Delivered

- Selected A layout with owner deck piles beside energy, shared Axioms at centre-left and a permanent rules column. Narrow screens stack guidance, table and rules; crowded rows and hands scroll.
- Shipped transparent creatures overlap their decorative frames; live text/stats remain above both. Guard's backplate and Shield's bubble remain distinct. Existing card inspection, effect explanations and teaching questions are preserved.
- Persistent deck buttons resolve against current legal actions, including lesson restrictions and busy state. Counts and static draw cues update after actions. A repeated draw click cannot draw twice. No observer, polling, save override or fixture code from the prototype enters production.
- The developer comparison study explicitly requests the old layout. The regular bench can open the native lessons with `?lesson=short` or `?lesson=full`.
- No art generation, asset replacements, voice recordings, engine changes, progress grants or save-shape changes. Tutorial teaching cards remain the controlled loaned fixture. Cosmetic ownership/selected backs, expansion mechanics and the broader animation pipeline remain separate work; #122/#109/#66 are not closed by this slice.

## Validation

Full required suite: **946 tests, 945 passed, one existing skip, zero failures**, 126145.0359 ms; exit 0. Raw output: `tutorial-table-2026-10-15/tests.txt`. Includes both complete guided lessons, independent rule repairs, required questions, save backups, stable deck identity, repeat-click safety and disallowed tutorial draw sources. Syntax and whitespace checks passed. Subsequent changes only refine CSS layout.

Native browser checks covered desktop 1280×720, compact 1024×768 and narrow 390×844. Shipped card and Granny images loaded. At 390px the page width stays 390; guidance is readable and the table/rules scroll. A keyboard deck draw advanced to step 2; a real pointer drag from Kim in hand onto the board advanced to step 3. At 1024px the rules column remains visible beside the lesson. Touch hardware, actual browser zoom and school-laptop performance remain unverified.

## Standards review

The independent Standards reviewer found one compact-layout regression: inherited 851–1100px styles hid the rules column while its drawer toggle was hidden. Restored the two-column grid, normal sidebar positioning and coach grid placement; reviewer rechecked and confirmed resolved. No remaining actionable findings.

## Spec review

The independent Spec reviewer found the same compact-layout regression against the permanent Axiom panel requirement, and confirmed its resolution. No scope creep or engine/save/voice changes found; native required decisions and legal action checks remain intact. No remaining actionable findings.

Total unresolved findings: Standards 0; Spec 0.

## Published

Implementation commit **99eaaf1** is pushed to `main`. Pages run **38754274071 succeeded**. Public `index.html`, battle script, arena stylesheet and bench HTML return HTTP 200 and match the committed Git blobs by SHA256 (`public-files.json`). Native public 1280×720 verification shows the live layout, three deck piles, step 1 of 10 and all images loaded. `public.png` is the unedited, visually inspected public screenshot; `public.json` records its DOM receipt. Local desktop, compact and narrow captures are saved alongside it. Existing unrelated receipts, helper and research files were left unstaged.
