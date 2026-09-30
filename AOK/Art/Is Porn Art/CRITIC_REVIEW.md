# Boundary / Art - Morning Critic Gate

This pass uses three deliberately separate review lenses. A dossier is accepted only when its current metadata is at least **9.0/10** in all three categories. These scores are internal editorial QA, not claims of objective measurement.

## 1. TOK teacher / educational tutor - 9.4/10

**Passed.** The activity now produces TOK thinking through a guided sequence rather than abstract prompts. Students classify a concrete case, identify the fact doing the argumentative work, meet a counter-pressure selected from their own prior rule, revisit earlier thinking, and finally sort their accumulated evidence before writing a claim.

Strengths:
- questions use concrete case language rather than unexplained TOK jargon;
- earlier student answers are returned later as evidence, so reflection has an object;
- the branch engine pressures both permissive and restrictive definitions rather than steering toward a preferred conclusion;
- middle/hedged positions are sometimes removed when the learning goal is to make a practical classification;
- the finale separates nuance at the evidence level from commitment at the thesis level;
- the case bank spans literature, music, film, comedy, performance, advertising/platform culture, censorship, politics and cross-cultural historical material.

Residual risk: some mature cases require teacher age/context judgment. This is why risk labels and Teacher Preview remain part of the workflow.

## 2. Resource curator - 9.2/10

**Passed after source revision.** The dossier itself now contains enough evidence for a student to make the decision without leaving the site. External material is supplementary exploration rather than required reading.

Resource standard:
1. the internal case briefing explains what happened;
2. `EVIDENCE IN THE FILE` supplies concrete facts rather than saying merely that a work exists;
3. the student link aims at an experience-first source where practical - listening link, trailer, official work/exhibition page, performance record or accessible primary-facing resource;
4. a second context/controversy source is supplied where it materially improves the case;
5. amber/red links are visibly labelled because some original-source pages contain mature material.

Major link upgrades include direct listening links for music cases, BFI film/censorship material, the Schneemann Foundation for *Fuses*, LACMA for Mapplethorpe, the British Museum for Tantra/Warren Cup context, the Havel Library for *Audience*, and separate work/context links in the teacher console.

External websites can still move or geoblock material. The design therefore does not depend on them for comprehension.

## 3. Aesthetic / game curation - 9.2/10

**Passed after card-front revision.** The dossier board now treats the image as the collectible object. Each live case has a real representative image URL selected for that case - book cover, record sleeve, film poster/still, venue, exhibition image, historic poster, festival graphic or other identifiable primary artefact. The title/decision information appears as an overlay or hover layer rather than replacing the picture.

The visual system now uses:
- smoke/sepia paper rather than clean app-card white;
- charcoal evidence-board surfaces;
- brass/acid accents for pins and active state;
- image-led collected cards with small title overlays;
- hover/focus notes showing the student's earlier decision and evidence;
- dossier stamps, filing metadata and evidence blocks that support the 1920s investigative mood without reducing readability.

Safety rule: explicit/nude images are not deliberately used as card fronts. For risky cases the identifying visual is a safe cover, poster, venue, exhibition, artist or institutional image.

### Image-delivery limitation

This runtime cannot reliably fetch third-party image bytes for redistribution into the ZIP. The current build therefore uses the sourced representative image as the **primary** card image and keeps a local WebP case graphic as a fail-safe if that remote image cannot load. The student experience is image-first when online; the activity remains functional offline. This is the only material item preventing the build from being a completely self-contained archive of third-party imagery.

## Structural QA

- 73 unique live dossiers.
- 73/73 have student source links.
- 73/73 have representative image URLs and local fallback images.
- 73/73 have three or more internal evidence statements.
- 73/73 clear the 9.0 metadata gate for pedagogy, resources and visual review.
- 0 unresolved branch IDs.
- 0 stranded dossiers outside the branching graph.
- Courbet / *L'Origine du monde* remains removed.
- JavaScript syntax checks pass for `app.js`, `teacher.js`, `shared.js` and `case-data.js`.
- Teacher Preview exposes the exact student evidence, branch memberships, sources, image and three QA scores for each dossier.

## Overall gate

**9.2/10 - accepted for teacher curation/testing.**

The next teacher action should be editorial rather than technical: use **Teacher > Preview student content** to cut or replace individual cases whose subject matter, source risk or representative image is unsuitable for the class.
