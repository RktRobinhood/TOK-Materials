# GLOBAL DAY '26 — The World, On a Plate

An 11-scene, projector-ready student launch site for **Global Day 2026** at **Ikast-Brande Gymnasium (IB)**. The 1i students are organizing a food fair for the STX community on **Wednesday 2 December 2026, during module 5**.

## Publish on GitHub Pages

No installation, build step, framework, or API keys required.

1. Create a new **public GitHub repository** (or use an existing one).
2. Upload `index.html`, `styles.css`, `script.js`, and the complete `assets/` folder **directly to the repository root**. Preserve folder names and paths. Commit.
3. Open **Settings → Pages → Build and deployment → Deploy from a branch**. Choose your branch (usually `main`) and `/ (root)`; save.
4. Wait for GitHub Pages to publish. The URL is shown in the Pages settings.

All site illustrations are included locally. Google Fonts and YouTube embeds require internet; system fonts and the custom video poster work without those external services.

## Present it

- **Right / left arrows**, **Page Down / Page Up**, **Space**, or the bottom navigation buttons: move between scenes.
- **Contents** in the top right: jump to a scene.
- **F**: fullscreen presentation mode (or browser `F11`).
- On phones, swipe horizontally between scenes or use the arrows. Scroll vertically for longer content.
- Scene 3 has a clickable *before → after* plating illustration.
- Scene 4 has **two click-to-play YouTube embeds**. They do not autoplay until someone explicitly clicks Play; the official YouTube source can also be opened in a new tab. Consider showing an excerpt instead of an entire video.
- Scene 5 has interactive storytelling angles; scene 7 has a clickable 60-second film storyboard.
- Scene 10 is the planning studio; students can draft a team brief and **download TXT** or **Print / Save as PDF**. Entries are stored in that browser's local storage only. **No online submissions, syncing, analytics, or teacher approvals occur.** Students should share the downloaded plan with the teacher.

## Lesson outline (suggestion)

| Phase | Scenes | Approx. time |
| --- | --- | --- |
| Sell the idea: food as an invitation | 1–2 | 3 min |
| Food design: make more with less | 3 | 3 min |
| Watch a **short excerpt** and discuss | 4 | 5–8 min |
| Cultural story, roles and film | 5–7 | 5 min |
| Explicit rules and logistics | 8–9 | 3 min |
| Teams form and complete draft briefs | 10–11 | Remaining class time |

**Teacher approval is required before a group's budget is authorized.** The role structure, 4–6-person starting point, bite lab concept, video time breakdown, and allergen-label suggestion are creative/organizational recommendations, not additional school rules.

## Original project requirements represented

- Food fair is for the STX community on Wednesday 2 December (Global Day), in **fifth module**.
- 1i students form reasonably large cooking groups; **groups of two are not permitted**.
- Country / cuisine is **chosen by the students**, not assigned by birthplace. Someone with genuine culinary knowledge of that cuisine should lead.
- Working budget: **150–200 DKK**, subject to teacher approval. **Retain receipts.**
- Food is **prepared and cooked on Global Day** and brought to the fair in module 5.
- **Visitors receive the food**. Students should eat their own lunch; don't eat guest portions before STX students arrive.
- Prepare a **one-minute video** about the dish, cultural history, why it was chosen, what it says about the culture, and a fitting virtue (e.g., wisdom) where relevant.
- 1i groups should reach out to involve **students in the 2i English B classes** after forming their groups.

## Video sources

- JOLLY: [*British Highschoolers try Michelin star food for the first time!*](https://www.youtube.com/watch?v=wi7T7pJsnC0) — user-supplied inspiration.
- MasterChef World: [*Perfecting Plating | MasterChef Canada*](https://www.youtube.com/watch?v=YGxRv5MELgo) — optional official-channel inspiration.

The videos are embedded from YouTube; no video or copyrighted TV footage is redistributed in this ZIP. Availability, ads, regional restrictions, or school network filters are controlled by YouTube. Use **OPEN ON YOUTUBE** if embedding is blocked.

## Technical notes

- `index.html` — 11-scene accessible presentation & planning form.
- `styles.css` — visual design, responsive and printable styles.
- `script.js` — navigation, two video embeds, interactive prompts, local plan and text export.
- `assets/*.svg` — original vector illustrations and favicon, included locally.
- `generate_assets.py` — source used for the original SVG graphics (optional; not required to deploy).

Designed to be hosted as plain static files on GitHub Pages. No dependencies or npm packages.
