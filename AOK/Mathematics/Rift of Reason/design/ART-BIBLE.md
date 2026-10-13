# Rift of Reason — Art bible

The rules every image is judged against during the art sessions (#32). Once the style board (0.1) is approved, it is attached to every later request as the reference, and wins over any wording here.

## Start here in a fresh agent session

The teacher reaffirmed the direction on 12 October 2026: **cute horror and meme caricatures of public figures**. Preserve that identity across new cards, effects and scenes. Read this bible, [DESIGN.md](DESIGN.md), [ROSTER.md](ROSTER.md) and the relevant [running art request](art-requests/ART-REQUESTS.md), then visually inspect the [approved style board](source-assets/0-style/style-board.png) and a shipped creature such as [Astrophysicat](../assets/creatures/astrophysicat-idle.webp). Attach the style board and relevant shipped creature to new generation requests. Do not rely on an earlier chat remembering the style.

The horror comes from dusk, uncanny masks, crooked fairground silhouettes, dark forests and dangerous rifts, with expressive creatures and funny public-persona exaggeration. Keep it slightly unsettling and welcoming, never gory. Faces and signature props need enough light to read; saturated accents sit against ink/forest/violet darkness. The style board's soft feather/fabric texture and clean cel-lit forms set the level of detail. Avoid drifting into an all-pastel nursery collection, realistic celebrity portraits, glossy 3D mascots or a uniform set of harmless woodland pets.

For a collectible creature, record its real public-persona inspiration, pun name, animal silhouette, signature prop/pose, harmless joke angle, colour and rarity in ROSTER.md before release. One readable prop or gesture should carry the meme at small scale. The teacher delegates roster, meme-worthiness and teenage-appeal decisions to the builder (12 October 2026): no teacher roster approval is required. Record a clear editorial rationale and readable visual joke; replace weak choices yourself. The 72 expansion identities are selected in PERSONA-ROSTER.md / persona-roster.json; mechanical animal names remain stable working IDs. Do not mass-generate those concepts as generic animals. Historical mathematical legendaries follow their established roster treatment. Avatars/story NPCs and explicitly reviewed starter helpers have their own roles; they do not replace the main caricature cast.

Each art batch keeps exact prompts, references, selected source PNGs and a provenance record, and links its Stage13 request, issue and asset IDs. Inspect on the dark game palette and a light background, then at ~70px board size and ~300px inspection size. Reject cropped parts, painted-in checkerboards, unreadable props and excessive tiny ornaments. Log any intentional exception and the teacher's feedback; don't silently redefine the style from the last generated image.

## Look

### Card layering: teacher correction, 12 October 2026

Full-card art is the default normal appearance (teacher clarified13October2026), not a foil upgrade or optional cosmetic. Use the shipped colour frame behind the transparent creature cutout; do not trap the creature behind that frame or inside an arched art-window crop. Keep the creature inside the card's outer rectangle, with live names/rules/stats above it. Preserve faces and signature props with contain fitting. Prototype and production integration must check both inspection and ~70px sizes, six colours and narrow screens before visual acceptance. The current developer correction is recorded in reviews/full-art-frame-2026-10-13.md; it does not yet change production rendering.

- **Cute and dark.** A storybook creature world at dusk: whimsical, slightly spooky, never gory. Big expressive eyes, round friendly shapes, sharp comedy in the poses.
- **Clear dark outlines** of consistent medium weight (dark brown-black, as on the approved style board), cel shading with a soft painterly texture, a little rim light.
- **Saturated jewel colours that glow against deep, dark backgrounds** (forest green, midnight violet). Lanterns, magic and the time rift are the light sources.
- Feels like a modern indie card game. Inspired by the cute-dark feel of games like Demon Bluff, but we never copy their characters, frames or layouts.
- **Everyone is a creature.** No humans anywhere. Caricatures are creatures *inspired by* real people's public traits and props, never realistic likenesses.

## Pose variety — teacher steering13October2026

Do not make a whole collection of upright creatures facing right. Mix front/left/right views, seated/crouched/leaning poses, over-shoulder glances and occasional diagonal jumps/lunges toward the viewer. Compose the actual cutout differently; mirroring can supplement this but is not a substitute. Keep faces and one prop legible, anatomy coherent and the full silhouette inside the transparent canvas. Dynamic still illustrations do not require looping motion. Retain calm standing portraits as part of the mix, not the default for every new card.

## Colour tokens

Each Way of Knowing has a colour used on card frames, icons, glows and the caricature's accents. Always pair the colour with its icon (colour-blind players).

| Way of Knowing | Colour | Hex | Icon idea |
|---|---|---|---|
| Reason | blue | `#3D7BFF` | a compass |
| Emotion | red | `#E8384F` | a flame-heart |
| Sense perception | green | `#2FBF71` | an eye |
| Language | gold | `#F2B632` | a quill |
| Imagination | violet | `#A05CF0` | a spiral star |
| Memory (colourless) | silver | `#C9C9D6` | an hourglass |

Neutrals: ink `#1A1020`, night `#14121F`, deep forest `#0F1F1A`, parchment `#EFE3C8`, frame magenta `#B0219E`, rift cyan `#3FE0D0`.

## Formats (so the game can cut images up automatically)

- **Characters and props:** transparent PNG; no text, labels, numbers, floor or shadow blobs. Clear empty space between every figure; nothing touches. Same scale for every full-body pose on a sheet, all standing on one imaginary ground line, feet visible.
- **Walk cycles:** side view facing right, 6 frames in one row of equal cells, identical character and scale in every frame, same ground line.
- **Backgrounds:** 16:9, at least 1672×941, no characters; keep the lower left and lower right thirds open for characters.
- **Cards:** portrait 5:7; frames have an empty art window and empty text boxes (the game writes the text).
- Canvas for sheets: about 1536×1024 or larger.

## Who must be told apart at a glance

- The 10 avatars: by silhouette (species) and garment colour (boy vs girl).
- Caricatures: by species and their signature prop (the tie, the rocket, the cheque, the spatula…).
- The demon imps must look sweet until the mask slips.

## Review checklist (every builder uses this on every image)

1. Matches the style board: outline weight, shading, palette, level of detail.
2. Format rules above (transparency, spacing, no text, grid).
3. Character consistency with earlier approved sheets (same markings, colours, proportions).
4. Readable at game size (a bust at 240 px, a sprite at ~300 px tall).
5. Tone: cute and dark, funny, not cruel.

### Cast breadth — teacher steering, 13 October 2026

Keep accepted artwork. For fresh card art, spread bodies across birds, insects and other invertebrates, aquatic animals, reptiles, unusual mammals and imaginary creatures. Avoid repeating felines or any narrow genus. Track body family alongside pose/composition in the production inventory before choosing the next group; explicit mechanical species IDs need not dictate an unproduced visual body. Record any display-name/body replacement so later builders can reconcile the roster without changing gameplay contracts. Spell and Axiom art should also include objects and small scenes, rather than a creature in every image.

### Accessory breadth — teacher steering13October2026

Avoid a collection where every creature holds a book, sketchpad or pencil. Retain these where essential to a persona joke; otherwise mix instruments, tools, relics, enchantments, armour and original magical weapons. Bulkier/Guard bodies can read as protected; higher-attack bodies can carry heavier fantasy gear. Art should suggest the printed role without implying a new keyword or equipment mechanic. Use one large readable cue rather than many tiny trinkets. Preserve artwork already generated/in flight; update pending production briefs and record accessory family with the body/pose mapping.

### Current production direction — #145 group 3, 13 October 2026

Thirty-nine of 72 expansion portraits are now art-ready; 33 remain (30 pending and three deferred). The latest twelve include a repair beetle, puzzle slime, clock-shield golem, axolotl, leaf insect, lantern wisp and original glider crocodile. Keep all selected images, including the corrected Ein-stone golem; retain the unused dragon-like first take as provenance rather than reusing it for this card. Full art above shipped colour frames remains the default NORMAL appearance, with live labels/stats above both layers.

For unproduced cards, use the seven sports substitutions in ROSTER.md and production body-plan.json: three basketball, two Danish handball, one golf and one volleyball persona. These are builder-selected original nonhuman forms, with one readable fantasy sports cue, no licensed uniforms/emblems or imitated voices. Preserve already-made sports characters. Historical body briefs do not override the current production mapping. Species/art IDs, rarity, colour, mechanics and acquisition stay fixed; armour, glider wings and props add no powers. No teacher roster review is required.
