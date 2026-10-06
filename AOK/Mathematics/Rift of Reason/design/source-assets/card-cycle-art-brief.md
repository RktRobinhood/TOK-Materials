# Optional card-board art queue — 6 October 2026

The playable rebuild uses existing creature portraits and the painted battle table. These assets are polish, not release blockers. The Fate track, costs, countdown, current rules, selection outlines and exhausted state already work as HTML/CSS. Never bake words, numbers, buttons, arrows or rules into an image.

## Shared style and delivery

Cute, dark fairground fantasy; thick clean outlines, saturated violet/teal/gold on a dark background; match the existing battle-table and creature art. Keep strong silhouettes and simple shapes that remain legible at small size. No flashing, shaking or looping effects. Deliver transparent PNG for icons; preserve a separate high-resolution master. Use the existing build-assets pipeline to crop/resize and generate the manifest; do not edit data/assets.js by hand.

| Priority | Proposed asset ID | Master / displayed size | Generation brief |
|---|---|---|---|
| 1 | `ui/fate-track` | 1536×256 / responsive strip | A flat horizontal row of six connected stone sockets, fine teal/gold outlines and quiet clockwork decoration at the edges. Empty sockets, no numerals. Transparent background; wide empty interior for CSS markers. Needs a twelve-space CSS extension, not a second baked board. |
| 1 | `ui/fate-marker` | 256×256 / 22–32px | One bright gold hourglass token, bold outline and clear silhouette, centred transparent cutout. No light rays beyond the token. |
| 1 | `ui/energy` | 256×256 / 20–28px | One teal energy crystal in a gold setting, readable at 20px. Transparent background, no text or count. |
| 1 | `ui/exhausted` | 256×256 / 18–24px | A spent, dim violet crystal lying sideways beside a small closed crescent. Communicate used/readiness through shape as well as colour. Transparent background. Keep the written Exhausted label. |
| 2 | `ui/fate-flip` | 256×256 / 24–32px | A single rule card turning over beside an hourglass; simple two-colour outline, transparent background. |
| 2 | `ui/fate-reset` | 256×256 / 24–32px | A circular rewind arrow enclosing three small blank rule tablets; bold readable silhouette, transparent background. |
| 2 | `ui/activate` | 256×256 / 18–24px | A creature paw touching a small glowing rune, transparent cutout. Keep ability name and energy cost as HTML. |
| 2 | `ui/axiom-back` | 512×768 / existing card-back slot | A framed dark purple card back: two interlocking sets of ten small stones around a central question rune. Symmetrical; no typography. Two contributions become one shared deck. |
| 3 | `scene/battle-table` variant | 1920×1080 / full screen | Preserve the established painted table aesthetic. Opponent zone above, player zone below, a calm clear horizontal centre lane for Fate. Leave the right third dark and quiet for Rules now. Decoration at the perimeter; no cards, labels, costs, rules or UI panels painted in. Save as an alternate master until visual comparison is approved through normal project review. |

## New axiom vignettes

Optional `ui/axiom-<id>` transparent square masters, 512×512, displayed 44–64px. Keep all words on the HTML card. Existing Underdog, Mercy and other original vignettes can be reused.

| IDs | Visual prompt |
|---|---|
| `one-action`, `two-actions`, `three-actions` | One / two / three distinct gold stepping stones along a violet path; use the correct count, no numeral. Separate outputs. |
| `reverse-hearts` | A small smiling heart resting safely at the end of an hourglass, surrounded by a reversed arrow. Friendly, not medical. |
| `normal-hearts` | Two opposing heart shields with a clear forward arrow between them. |
| `thrift`, `luxury` | One small plain energy purse / one ornate full crystal purse. Separate outputs, transparent. |
| `abundance` | Two new teal crystals growing from a gold stem. |
| `study` | Two blank creature cards beside a small open book. |
| `vigilance`, `patience` | Upright bright hourglass / resting dim hourglass. Distinct silhouettes, not only colours. |
| `arrival` | A small paw stepping from a blank card onto a bright stone. |

## Integration notes for the next agent

- The proposed new icon IDs are not currently required or referenced by runtime code. Add optional `Assets.has` fallbacks when integrating; retain existing CSS and written labels.
- `ui/axiom-<id>` is already the optional lookup in the battle screen. The fallback text card works without its vignette.
- Keep touch/click targets at their current button sizes; imagery must not become the only control or status explanation.
- Check 1280×720 and narrow layout, active/reversed goals, exhausted cards, and calm/reduced-motion. Art must not reduce contrast or push budgets out of view.
- Delayed spells and timed creature arrivals are design ideas for a later mechanics slice. Do not create a large spell roster before their behaviour and teaching sequence settle.
