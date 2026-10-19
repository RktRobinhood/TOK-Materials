# GLOBAL DAY '26 | Ikast-Brande Gymnasium

**Wednesday, 2 December 2026 · Fifth module · Food fair for the STX community**

A 16-scene, projector-ready, student-facing GitHub Pages site for the school's Global Day food fair. The 1I TOK classes lead the event and invite other students to join their groups.

## Publish on GitHub Pages

1. Extract the ZIP **before** uploading; do not upload the ZIP as a single file.
2. Upload `index.html`, `styles.css`, `script.js`, and the entire `assets/` folder to the **root of the GitHub repository**. Replace files from an earlier version, including the whole `assets/` folder.
3. On GitHub, choose **Settings → Pages → Build and deployment → Deploy from a branch → main → /(root) → Save**.
4. Once deployed, hard-refresh the browser if an earlier version is cached.

Nothing requires npm, a build step, JavaScript package installation, or API keys. Images, illustrations, the PDF worksheet, HTML, CSS, and JS are included locally. Google Fonts and embedded YouTube videos require internet; text and navigation work without them.

## Present in class

- `→`, `←`, `Space`, bottom buttons: change slide.
- `F`: fullscreen (where supported).
- `ALL SLIDES`: jump to a specific scene; slide locations have shareable URL fragments, e.g. `#outreach-map`, `#pitch-your-group`.
- On touch devices, swipe horizontally or use arrows. Longer mobile slides scroll vertically.
- Videos are **click to play**, never autoplay merely because a slide is shown. Leaving their slide, changing video tabs, closing the tab or opening the slide menu removes the YouTube iframe and stops playback.

## Important school information included

- Event: **Wednesday, 2 December 2026**, food fair in **module 5**.
- School budget: **150–200 DKK per group**; receipts must be kept. Teacher must approve the group before the budget is approved. Teams of two are prohibited; larger groups cover the different responsibilities.
- Groups choose a cuisine/country **regardless of birthplace**; at least one member must have sound knowledge of it and help lead the cuisine.
- Dish is prepared and cooked **on Global Day** and brought to the fair in module 5. Students should have eaten beforehand and **must reserve the food for STX visitors**, rather than consume it beforehand.
- Every group makes a **60-second cultural video** introducing its dish, roots, choice, cultural significance and a meaningful possible IB virtue link (wisdom is one possibility).
- This year's **1I groups lead the decision-making**, while inviting students from assigned classes as real collaborators rather than spectators.

| Host group | Students to invite/involve |
|---|---|
| 1I TOK 1 | 1J (pre-IB) |
| 1I TOK 2 | 1K (pre-IB) |
| 1I TOK 3 | 2I English **A only** |
| 1I TOK 4 | 2I English **B only** |

## The one-page PDF proposal

The old in-page group-planning form was removed. Instead, the pitch slide links to **`assets/Global_Day_2026_Fillable_Group_Pitch.pdf`**, a single-page A4 AcroForm PDF that can be downloaded or opened for completion.

The PDF has **12 editable text fields** for group composition, cuisine, dish, cultural story, invited classmates, video concept, AI-art/keyframe research, editing route, budget, and service plan; plus a teacher sign-off line. It includes the Wednesday 2 December date. **Downloading/opening the PDF does not submit anything or approve the group.** Students must save/send/hand it to the teacher. Browser PDF viewers vary; for reliable saving use Adobe Acrobat Reader or another capable PDF form viewer. Printing and writing by hand is an alternative.

## Media teaching notes

Students are explicitly told to **investigate AI art and where it is genuinely free**. They may ultimately choose a traditional filmed-and-edited video, a hybrid, or an AI-supported sequence. They are introduced to storyboards, keyframes, five-second test clips, and the need to evaluate cost, cultural fidelity and consent before uploading classmates' images.

Resource links use original official websites:

- ArtCraft free open-source **Crafting Apps**: https://getartcraft.com/apps (these are early-stage/experimental, notably FilmCraft). The separate AI studio/generation side may cost credits.
- DaVinci Resolve free desktop video editor: https://www.blackmagicdesign.com/products/davinciresolve
- ComfyUI official documentation: https://docs.comfy.org
- Blender: https://www.blender.org

Video tabs:

1. JOLLY – British students try Michelin-star food: https://www.youtube.com/watch?v=wi7T7pJsnC0
2. MasterChef World – plating inspiration: https://www.youtube.com/watch?v=YGxRv5MELgo
3. Teacher-supplied **AI-video workflow/tutorial** (description intentionally generic; we did not independently confirm the video's title): https://www.youtube.com/watch?v=2MzCkYrvDaI

Some school networks or YouTube creator settings can block embedded playback. Each video tab provides **OPEN ON YOUTUBE** as a fallback.

## Directory

```
index.html
styles.css
script.js
README.md
assets/
  favicon.svg
  culture-globe.svg
  plated-bite.svg
  chef-closeup.webp
  chef-at-work.webp
  a-shared-bite.webp
  cultural-landscape.webp
  pitch-preview.webp
  Global_Day_2026_Fillable_Group_Pitch.pdf
```

No tracking, analytics, backend form submission, or browser storage of students' answers is used.
