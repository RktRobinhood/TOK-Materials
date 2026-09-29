# Boundary / Art - TOK Decision Journey

A standalone static TOK activity about how we classify controversial art, culminating in the question **Can pornography be art?**

## Student journey

The experience is deliberately one-way. Students see only the current decision, commit it, and move forward. Multiple-choice decisions drive a seeded branching engine; short written responses act as reflective speed bumps rather than long essays.

The site moves through taboo, censorship, intention, audience, craft, context, ethics, culture, politics, commercial purpose and institutional classification. Earlier answers are brought back later so the student has to confront their own rule rather than invent a new answer each screen.

At the end students sort every collected dossier onto a continuum from **supports “pornography can be art”** through a grey area to **supports “pornography is not art”**, with a separate irrelevant-evidence bin. They then make a forced final claim, choose their strongest dossier evidence, and write a concise defended answer.

## 73-case curation bank

`CASE_CURATION.json` and `CASE_CURATION.md` expose the full live bank. Cases span literature, music, film, comedy, performance, advertising/platform culture, propaganda/censorship, cross-cultural history and difficult art/pornography boundary examples.

Each case contains:
- concise student briefing;
- 3-4 concrete evidence statements;
- challenge/tension and student task;
- period, region, medium and challenge-axis metadata;
- argumentative pressure direction;
- source-safety level;
- student-facing exploration source;
- optional separate teacher/controversy source;
- representative image URL plus local WebP fallback;
- evidence-board hover text;
- live branch memberships;
- TOK/resource/visual curation scores.

Teacher-supplied corrections retained:
- *Fuses* -> Schneemann Foundation;
- Courbet / *L'Origine du monde* -> removed;
- Mapplethorpe -> LACMA *The Perfect Medium*.

## Dossier images

The collectible dossier face is now image-led. Representative images are selected to identify the exact case: book covers, record sleeves, film posters/stills, performance or exhibition images, venues, festival graphics, historic posters and other recognizable artefacts.

The student board does not intentionally embed explicit nudity or sexual activity. Mature cases use a safe identifying visual; the underlying source can remain an optional, risk-labelled external link.

Because this build environment cannot reliably download third-party image bytes for redistribution, sourced images remain remote primary thumbnails and each case also contains a local WebP fallback. The logic, writing, branching and PDF workflow remain usable offline; the best visual experience assumes normal internet access for those sourced thumbnails.

## Response integrity

Open responses use hidden low-threshold checks for minimum development, vocabulary recognition, uniqueness and repetition. Students see only conversational prompts and a rising-water completion cue. Copy/paste/cut/drop are blocked in student response fields. Aggregate typing/process data is kept locally for teacher review; no keystroke text or clipboard contents are recorded.

## Student-added evidence

Before the finale a student may optionally add one dossier the archive missed: title, medium, source/link, classification, rationale and an optional classroom-safe image. Images are compressed and stored locally; audio/video remain links. The custom dossier joins the evidence board, spectrum and PDF.

## Teacher workflow

Open `teacher.html`.

### Review student reports
Import the QR by webcam, screenshot/image upload, drag/drop, pasted screenshot, raw code or hosted link. The QR carries compact process data; the student's actual written reasoning remains in the PDF.

### Preview student content
The curation console exposes all 73 live dossiers without replaying student routes. Filters show medium, source safety and argumentative direction. Each dossier preview includes:
- representative image;
- exact evidence students receive;
- briefing/tension/task;
- board-hover copy;
- branch memberships and challenge axes;
- student and context source links;
- TOK, resource and visual QA scores.

## PDF

The final PDF records the student's starting position, encountered dossiers, reasoning, evolving rule, evidence spectrum, irrelevant bin, forced final claim, selected evidence, final reflection and teacher QR.
