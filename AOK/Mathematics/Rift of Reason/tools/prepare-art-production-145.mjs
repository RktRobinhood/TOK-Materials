// Freeze the #145 production inventory/prompts once; resumes must preserve selected outputs.
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const game=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const draft=path.join(game,'design/drafts/card-arena-2026-10-12');
const dir=path.join(game,'design/source-assets/4-caricatures/production-145-2026-10-13');
const file=path.join(dir,'inventory.json');
try{await fs.access(file);console.log('Existing production inventory preserved.');process.exit(0);}catch{}
const roster=JSON.parse(await fs.readFile(path.join(draft,'persona-roster.json')));
const accepted=new Set(['reason-diagonal-deer','emotion-spite-sprite','perception-cue-cricket','language-echo-egret']);
const first=['imagination-possibility-pika','imagination-blueprint-bat','memory-bookmark-bunny','memory-recall-robin','reason-logic-lynx','reason-parity-panda','emotion-empathy-elephant','emotion-outrage-ox','perception-lens-lynx','perception-prism-puffin','language-definition-dolphin','language-clause-crane'];
const lines=['Same game. Different idea.','This sketch needs a backstory.','Keep this note. It might help.','That page still has a purpose.','Let’s check what comes next.','A fair match deserves a small repair.','A little room for both hearts.','First, let’s clear the court.','Lovely trick. Show me the sleeve.','Try looking from this side.','Let’s agree what safe means.','I crossed out the rule. Not you.'];
const refs=['design/source-assets/0-style/style-board.png','assets/creatures/astrophysicat-idle.webp'];
const poses={
 'imagination-possibility-pika':'A small TAILESS mountain pika, short ROUNDED ears (not a fox/rabbit/cat), springing diagonally toward the viewer, front paws bringing the controller forward, surprised playful face. Full body in air, visible feet; no bushy tail.',
 'memory-bookmark-bunny':'Facing LEFT, low crouch with knees tucked, one paw opens the notebook and the other indicates the broad bookmark. Head turns slightly toward viewer; full ears/feet in frame.',
 'memory-recall-robin':'FRONT-FACING hovering finch, wings partly spread while holding the marked paperback close, feet tucked below. A thoughtful slightly tilted head; no perch/scenery.',
 'reason-logic-lynx':'Left-facing diagonal lean backwards, paws presenting the pulley wheel while a short taut blue cord gives the demonstration tension. Face curious and visible; not an extra scene.',
 'reason-parity-panda':'FRONT-FACING seated raccoon with tucked crossed legs, holding the paired-bead counter level before the chest, amused raised brow. No chair or ground plane.',
 'emotion-empathy-elephant':'Three-quarter LEFT elephant kneeling in a broad welcoming pose, trunk curves to offer the paper heart toward viewer, ears spread. Heart is main prop, omit counting frame.',
 'emotion-outrage-ox':'Dynamic overhead tennis swing, body angled toward viewer, one hoof lifted in a short forward leap, racket high and face focused/playful. One unbranded racket, no ball/scenery/motion blur.',
 'perception-lens-lynx':'Facing LEFT in a theatrical half-bow, paws stretch one empty sleeve open toward viewer, head glances up with a dry amused expression. Spectacles/ear tufts intact.',
 'perception-prism-puffin':'Over-shoulder puffin looking toward viewer, body turned LEFT, one wing holds the simple mirror panel sideways while another invites a different angle. A playful sideways step.',
 'language-definition-dolphin':'Diagonal mid-swim curve facing the viewer, dolphin tail curls downward/left, one flipper clasps the closed dictionary, the other opens in a delighted question. Fish-shaped, no human legs/water.',
 'language-clause-crane':'Front-facing mouse springing in a compact forward leap, notebook under one paw and the other raised emphatically, open playful mouth, bent hind feet and curving tail. No platform/frame/particles.'
};
const alternates=['front-facing presenting pose','left-facing crouch or species-appropriate floating curl','diagonal forward leap with full extremities visible','over-shoulder curious glance','front-facing seated or tucked pose','three-quarter right-facing calm pose'];
const base='Use case: stylized-concept. Make ONE original transparent full-body Rift of Reason creature cutout. Image1: approved STYLE BOARD, authoritative cute-horror storybook ink outlines, soft textured cel shading, warm expressive animal faces and dusk jewel accents. Image2: shipped Astrophysicat, rendering reference only; do not copy cat anatomy, its clothes/stars/gesture. Match this game, not nursery pastels, realistic celebrity likeness or glossy3D. No humans. Center the entire coherent silhouette at about80percent of the canvas so ears/props/feet/tail have transparent padding. No background, floor, ground-shadow blob, frame, text, letters, logo, watermark, particles or extra figures. Art will sit ABOVE a separate shipped card frame with live names/rules/stats. Face and one signature prop readable at70px, attractive at300px; medium dark brown outlines, ink/violet shadows and warm lantern rim light. Public-persona joke only, no private-life/scandal jokes or copied lyrics/quotes/costumes. '; 
const portraits=roster.rows.filter(r=>!accepted.has(r.mechanicalId)).map((r,index)=>({
 id:r.artId,species:r.mechanicalId,persona:r.proposedName,inspiration:r.inspiration,colour:r.colour,rarity:r.rarity,acquisition:r.acquisition,mechanicalContract:r.mechanicalContract,
 source:'production-'+r.mechanicalId+'-145.png',status:r.mechanicalId==='language-question-quail'?'deferred:144 near-clone':'pending',group:first.includes(r.mechanicalId)?1:null,
 poseDirection:poses[r.mechanicalId]||alternates[index%alternates.length],
 prompt:base+'Subject: '+r.proposedName+', an ORIGINAL NONHUMAN creature inspired by '+r.inspiration+'\'s public persona. Silhouette/costume: '+r.silhouette+' Main prop/gesture: '+r.signatureProp+' Visual joke: '+r.jokeAngle+' Use jewel accent '+r.palette.accent+' on worn dark cloth/trim, no invented branding. Pose/composition: '+(poses[r.mechanicalId]||alternates[index%alternates.length])+'. A fish/dolphin remains fish-shaped with fins/tail rather than human legs; a bird/bat retains wings/beak/ears. One bold recognition cue; keep small ornaments minimal. No extra props or scene. Entire figure/prop comfortably inside transparent canvas.',
 styleReferences:refs,transparentBackgroundRequested:true,voiceDirection:r.voiceDirection,sharedSfx:r.sharedSfx,draftLines:first.includes(r.mechanicalId)?[lines[first.indexOf(r.mechanicalId)]]:[],
}));
const motifs=['reason','emotion','perception','language','imagination','memory','generic'].map(colour=>({id:'art/spell-motif-'+colour,status:'planned',coverage:'Routine '+colour+' spells; individual proposed mappings follow motif selection. Axiom art is a separate shared rule motif; no runtime mapping yet.'}));
await fs.mkdir(dir,{recursive:true});await fs.writeFile(file,JSON.stringify({issue:145,date:'2026-10-13',method:'built-in image_gen',model:'not reported by tool',status:'Bulk production in progress; runtime mechanics/acquisition gated',qualityPolicy:'Student-project level: one visual look plus alpha/major-crop checks; regenerate only clear defects; one contact-sheet/native pass and required checks per published larger group.',acceptedPrior:[...accepted],targetRemainingPortraits:68,portraits,motifs,axiomMotif:{id:'art/axiom-rule-motif',status:'planned',coverage:'Shared Axiom/rule illustration, with native colour treatment where appropriate; no runtime mapping yet.'}},null,2)+'\n');
console.log('Production inventory:68 remaining portraits (Jimmy deferred144),12 in first group,7 spell motifs plus shared Axiom illustration planned.');
