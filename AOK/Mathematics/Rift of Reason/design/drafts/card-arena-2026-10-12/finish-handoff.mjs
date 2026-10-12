// Local planning publisher: generates handoff lists, never changes runtime data.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const dir = path.dirname(fileURLToPath(import.meta.url));
const game = path.resolve(dir, '../../..');
const catalogue = JSON.parse(fs.readFileSync(path.join(dir, 'card-catalogue.json')));
const write = (name, value) => fs.writeFileSync(path.join(dir, name), value);
const stories = catalogue.cards.filter(c => !c.acquisition.packEligible);
write('STORY-REWARDS.md', `# Story-only card rewards — draft assignments

The teacher approved a separate story-only subset. Completing the associated plot earns these cards; packs never contain them, before or after unlock. These eighteen assignments are proposals, not implemented reward flags or approved balance. The other 192 expansion concepts are candidates for released pack pools.

| Card | Rarity | Proposed completion node |
|---|---|---|
${stories.map(c => `| ${c.name} (${c.id}) | ${c.rarity} | ${c.acquisition.proposedMilestoneNode} |`).join('\n')}

## Implementation contract

Use explicit acquisition metadata for every released ID. Pack eligibility is a channel, not a flag that story completion changes. Release status and ownership do not override it. Validate source nodes and their actual completed-plot seam before wiring rewards; visiting or replaying dialogue alone must not count. Keep receipts and quantities in the canonical save and round-trip backup codes. Replaying/reloading/importing the same completion cannot duplicate a grant.

Proposed grant: two normal copies at the milestone so the exclusive card can enter a legal two-copy strategy immediately. This quantity needs tuning review. Cosmetic upgrades should come from named later story/challenge milestones, never packs; until those milestones exist leave the two copies normal. No mandatory story progress depends on owning a foil. Preserve already-completed saves through a bounded once-only reconciliation, not repeated grants on every load.

Tell the player the source in Collection: “Story reward · complete [milestone]”, then “Earned from [milestone]”. Distinguish unseen spoilers from known requirements. Pack odds and pool completion refer only to the released pack pool. Story rewards still obey rarity, deck limits and colour quotas. Existing unique keepsakes and captured creature UIDs remain separate possessions.
`);
write('ASSET-PLAN.md', `# Card pipeline art plan

Use the existing Stage 13 list in ../../art-requests/ART-REQUESTS.md as the running production ledger. This index is generated from the creative catalogue; none of these portraits is claimed produced. Seven starter creatures are listed separately in CARD-DRAFTS.md. Total new portrait targets: 79 (7 starters + 72 expansion creatures). Generate the seven common portraits first after the board slice, then one tested content batch at a time. Do not generate all 79 before balancing their release.

Use the game's cute/dark painted cutout style, strong outlines and readable silhouettes. Transparent idle art can serve board, hand, Collection and enlarged inspection. Preserve the existing asset build/manifest workflow; retain original generation prompts and provenance. Do not edit generated manifests by hand. Existing attack/hurt motion may transform the same cutout; add another pose only if it conveys a necessary action.

| Asset | Card | Status |
|---|---|---|
${catalogue.cards.filter(c => c.kind === 'creature').map(c => `| ${c.art} | ${c.name} | Planned; gated by card release |`).join('\n')}

Shared presentation: code/SVG Guard backplate distinct from Shield; enlarged card text with type/rarity text and icons; five consistent rarity treatments including Mythic; cosmetic foil static overlay or one short optional sheen; shared pack illustration/opened wrapper; seven affinity symbols (six colours + generic); upcoming Fate environmental marker and inspectable node. Reuse current card backs, frames and effect sounds where suitable. Owner back selection must use saved choices with default fallback, not invented save fields. Reserve the outcome-clip area (#108) without covering board controls.

Spell/Axiom illustrations are a later shared motif set, not 138 bespoke full paintings. Start with colour/keyword motifs and only commission a unique scene for an effect needing it. Pack motion is short, skippable and Calm/reduced-motion friendly. No looping moving borders or shakes. Teacher layout review and actual viewport checks precede production release (#109).
`);
write('VOICE-NEEDS.md', `# Card pipeline voice and sound handoff

Production sources remain data/script/*.js, creature lines, data/barks.js and Granny's lesson steps. tools/voices.mjs --plan enumerates actual missing lines; this proposal list is not silently injected into that scan. Preserve all current text hashes, recordings, cast pins and quota ledgers. The current recording audit is design/reviews/voice-recording-2026-10-12.md. No recordings were generated in this planning pass.

| Need | Proposed wording / treatment | Release gate |
|---|---|---|
| Deck workshop, Granny | “Your creatures support your spells. Count the matching colours in your deck.” | #112/#114/#115; text review before recording |
| Workshop, Granny | “You can cast the spell even when that creature is off the board.” | #115 |
| Workshop, Granny | “Take up to two copies of one card.” | #115 |
| Fate timing, Granny | “Both players take a turn. Then Fate moves once.” | #116 and revised lesson |
| Plot reward, narrator or current host | “A story reward. You will not find this card in packs.” | Story acquisition issue; source-specific speaker review |
| Pack rarity announcer | “Mythic.” / “Legendary.” | Pack reveal issue; optional shared two clips, #43 |
| Starter creatures | Three short lines per released creature: introduction, attack, defeat. Draft only after name/art/effect review; public-persona rules still apply. | #113; seven creatures, at most 21 first-pass lines |
| Expansion creature barks | Only released batches; shared nonverbal sounds where fitting. Do not generate 72 voice casts in advance. | #123 staged releases |

Use existing open, reveal, card-play, jingle, axiom, block, hit and defeat sounds; sequence them without five simultaneous celebrations. No new paid sound generation is needed for the board slice. Sound budget and audition workflow remain tools/sfx-plan.mjs and tools/README.md. New lines must enter their authoritative runtime source only when implemented, then plan/render/audit through the established voice tools. Missing optional announcements fall back to readable rarity labels; battle never waits on an API. Do not prune or replace unrelated recordings.
`);
const economyPath = path.join(dir, 'ECONOMY-DRAFT.md');
let economy = fs.readFileSync(economyPath, 'utf8').replace('for the 210-card reference pool', 'for the 192-card eligible reference pack pool (18 story-only concepts excluded)');
for (const [rarity, oldN, newN, weight] of [['Common',92,90,'0.65'],['Uncommon',60,58,'0.23'],['Rare',37,25,'0.09'],['Mythic',14,13,'0.025'],['Legendary',7,6,'0.005']]) {
  economy = economy.replace(`| ${rarity} | ${oldN} |`, `| ${rarity} | ${newN} |`).replace(`${weight} / ${oldN}`, `${weight} / ${newN}`);
}
economy = economy.replace('for 210 new IDs requires 840 progression draws from zero ownership, or 168 full five-slot packs', 'for 192 eligible IDs requires 768 progression draws from zero ownership, or 153 full five-slot packs and one final three-slot pack');
if (!economy.includes('Story-only acquisition is permanently excluded')) economy += '\nStory-only acquisition is permanently excluded from pack selection, including after its completion flag is set. See STORY-REWARDS.md for proposed source assignments, copy grants and independent foil routes. The 20% generic target describes the whole creative catalogue; the eligible pool has 36 generic IDs (18.75%), not an approved generic drop rate.\n';
fs.writeFileSync(economyPath, economy);
write('EXPANSION.md', `# Collection expansion — 12 October 2026

The completed creative draft contains **210 additional concepts**, beyond the twelve starter-pack proposals: **28 in each of six colours and 42 generic (20%)**. See CARD-CATALOGUE.md and card-catalogue.json for effect text, cost/stats, rarity, strategy, counterplay, acquisition and implementation gates. All are proposals, not implemented or playtest-balanced cards.

There are 72 creatures, 84 spells and 54 Axioms; 92 common, 60 uncommon, 37 rare, 14 mythic and 7 legendary. Eighteen draft plot-exclusive assignments never enter packs. The other 192 become eligible only when released. STORY-REWARDS.md distinguishes approved exclusivity from proposed milestones/quantities.

Board-first release remains the direction. Start with the simple starter pack, then small playtested strategy batches. Fate replay/expiry, alternate victory resolution and token ordering require their policy gates; no mass implementation of unresolved cards. ASSET-PLAN.md and VOICE-NEEDS.md connect production work to the existing art and recording flow. ECONOMY-DRAFT.md, PROGRESSION-AUDIT.md and PACK-MODEL-REPORT.md document evidence and tuning proposals. The simulation validates exclusion and probability movement, not classroom pacing or balance.

The user now authorizes implementation immediately after issue publication, with generated art where suitable and one issue at a time. Preserve engine/save/recorded-voice contracts and other sessions. Continuation is recorded in PLANNING-CHECKPOINT.md.
`);
const artPath = path.join(game, 'design/art-requests/ART-REQUESTS.md');
let art = fs.readFileSync(artPath, 'utf8');
if (!art.includes('13.CARD-2026-10-12')) art = art.replace('## Outcome log', `### 13.CARD-2026-10-12 — Card Arena pipeline (planned)

Teacher authorizes builder-generated images for this pipeline. Status: planned; no images produced by this planning pass. See [asset index](../drafts/card-arena-2026-10-12/ASSET-PLAN.md) and [card catalogue](../drafts/card-arena-2026-10-12/CARD-CATALOGUE.md). Generate after board review in small release batches, preserving source prompts/provenance and the existing build-assets manifest flow.

| Request ID | Asset / use | Status |
|---|---|---|
| 13.CARD.STARTER | Proof Pup, Lens Lizard, Paper Dragon, Cloud Calf, Pocket Tortoise, Comma Crab, Footnote Finch: seven transparent idle cutouts for #113 | Planned, generate first |
| 13.CARD.EXPANSION | 72 portraits with exact asset IDs in ASSET-PLAN.md; board/hand/Collection/inspection | Planned, release-gated |
| 13.CARD.GUARD | Large readable Guard backplate, distinct from Shield and compatible with both; code/SVG | #122 implementation |
| 13.CARD.RARITY | Five consistent frames including Mythic, with labels/icons; shared foil cosmetic | Planned, rarity policy gate |
| 13.CARD.PACK | One pack wrapper/opened treatment, restrained rarity reveal; reuse current sounds | Planned, transactional packs first |
| 13.CARD.FATE | Environmental node marking and inspectable preview; code/SVG; outcome-clip space remains reserved | #122/#128 |

Voice needs are tracked in [VOICE-NEEDS.md](../drafts/card-arena-2026-10-12/VOICE-NEEDS.md) and tools/README.md. Avoid bulk art/audio generation before concepts are released and reviewed.

## Outcome log`);
fs.writeFileSync(artPath, art);
const readmePath = path.join(game, 'tools/README.md');
let readme = fs.readFileSync(readmePath, 'utf8');
if (!readme.includes('card-arena-2026-10-12/VOICE-NEEDS.md')) readme = readme.replace('## Voices', '## Voices\n\nCard Arena expansion planning: [voice needs and release gates](../design/drafts/card-arena-2026-10-12/VOICE-NEEDS.md). This is a proposal list; the status/plan commands below continue to read authoritative runtime lines. Preserve existing recorded hashes/cast choices.\n');
fs.writeFileSync(readmePath, readme);
console.log('Handoff documents and existing art/voice flow links written.');
