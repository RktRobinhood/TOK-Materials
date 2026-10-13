// Future design data only. Generates files in this draft folder; no runtime writes.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
const dir=path.dirname(fileURLToPath(import.meta.url));
const cards=[];
function add(colour,slug,name,cost,visibility,actors,triggers,effect,role,counterplay,gates=[]){
 cards.push({id:'conditional-'+colour+'-'+slug,name,colour,kind:'conditional',costProposal:cost,visibilityProposal:visibility,
  allowedActors:actors,allowedTriggers:triggers,selection:'Choose one actor/trigger from these printed options when arming; single options are fixed.',
  timingProposal:'After the triggering action/effect and ordinary cleanup complete; no retroactive cancellation.',effectProposal:effect,
  role,counterplay,limits:'One shot per committed arming; consume before effect. Ordinary energy/play budgets. No free rearming.',
  gates:[148,109,123,112,...gates],status:'Future concept; no runtime definition, grant, artwork, recording or settled balance.'});
}
add('reason','premise-pending','Premise Pending',1,'face-down',['opponent'],['creature-played'],
 'If you have a creature and the triggering creature has more current attack than every creature on your board, it loses 2 attack until its controller’s next turn ends, minimum 0.',
 'Reason precision tempo: punish a provably larger arrival rather than grant a generic attack buff.','Play a smaller body first or keep attacks outside the comparison; a failed comparison consumes the spell.');
add('reason','spare-premise','Spare Premise',1,'face-up',['self'],['axiom-replaced'],
 'Entrance: choose two other friendly creatures with equal current attack; each gains 1 maximum health and heals 1. Without a legal pair, the creature still enters with no pair effect.',
 'Reason midrange: maintain a matched pair through changing rules; the revealed body is support, not a second healing copy.','Break the equality or remove one prospective recipient before the rule change.');
add('reason','exhibit-aha','Exhibit Aha',1,'face-down',['opponent'],['creature-played','spell-played'],
 'If the triggering card’s actual paid energy cost was odd, draw 1 personal-deck card. If it was even, heal your most damaged creature by 1; ties use oldest arrival. Zero is even.',
 'Reason control: commit to one event class and predict the odd/even cost after public discounts.','Choose a cost/timing that wastes the desired branch; neither branch repays energy or rearms the spell.');
add('emotion','tiny-drama','Tiny Drama',1,'face-up',['self'],['creature-defeated'],
 'Your hero loses 1 heart. If the match is still active, draw 1 personal-deck card.',
 'A loss becomes risky fuel for Emotion payoffs.','Pressure low hearts; terminal Win rules stop the later draw.');
add('emotion','standing-ovation','Standing Ovation',2,'face-down',['opponent'],['spell-played'],
 'Your surviving creatures gain 1 attack until your next turn starts.',
 'Opponent spell timing creates one counter-pressure window.','Cast before the armed player has useful attackers; no copied/repeated ovation from this instance.');
add('emotion','group-gasp','Group Gasp',2,'face-up',['either'],['axiom-replaced'],
 'Both heroes lose 1 heart as one simultaneous effect, following the settled Win/tie policy.',
 'Symmetrical pressure, including active own-zero Win situations.','Plan around the visible rule-change trigger; simultaneous outcomes remain a release gate.',['victory-tie-policy']);
add('perception','velvet-reveal','Velvet Reveal',1,'face-down',['opponent'],['creature-played'],
 'If the triggering creature has Elusive, remove it until that creature’s controller next starts a turn.',
 'Expose one expected arrival rather than silence every ability.','Lead with another creature; non-Elusive arrival consumes the condition without a removal.');
add('perception','clock-eyes','Clock Eyes',1,'face-up',['either'],['fate-entered'],
 'Privately inspect the top 2 unreserved shared Axioms without moving or drawing them. Public scheduled effects stay unchanged.',
 'Public Fate timing buys limited hidden-deck information.','Change the available unreserved deck before entry; this reveals no reserved effect.',['fate-entry-policy',118,119]);
add('perception','blink-forecast','Blink Forecast',1,'face-up',['self'],['creature-played','spell-played'],
 'Reveal your top personal-deck card to both players. If it is a creature, heal your hero by 1; if it is a spell, heal your most damaged creature by 1. An empty deck does nothing.',
 'A committed action menu and a public forecast exchange secrecy for a small benefit.','Alter deck order; no draw/reorder or benefit for an unsupported card type.');
add('language','footnote-trap','Footnote Trap',1,'face-up',['opponent'],['axiom-replaced'],
 'Heal your most damaged surviving creature by 1 and the opponent’s hero by 1. Missing creature does not cancel the hero heal.',
 'An asymmetrical polite concession after an enemy rule change.','Change rules when the friendly heal is wasted; the opponent receives its concession.');
add('language','queue-that-question','Queue That Question',2,'face-down',['opponent'],['spell-played'],
 'The opponent’s next spell before their next turn ends costs 1 more. Consume this tax after that play; otherwise it expires.',
 'Post-play follow-up tax; it never cancels the spell that triggered it.','Use a cheap follow-up or wait out the openly revealed tax.');
add('language','chair-recognises','The Chair Recognises You',1,'face-up',['self','opponent'],['creature-played'],
 'The triggering creature gains Guard until its controller’s next turn starts. Existing Guard does not stack.',
 'Choose whose next speaker must take the front seat; support or force an enemy blocker.','Control the next arrival; an already-Guard target gains no second keyword.');
add('imagination','wrong-way-round','Wrong Way Round',2,'face-down',['opponent'],['creature-played'],
 'Swap the triggering creature’s attack and health until your next turn starts, using settled stat-swap/temporary-expiry rules.',
 'An arrival changes shape instead of being directly damaged.','Balanced stats blunt the surprise; source disappearance creates no replacement.',['temporary-swap-policy']);
add('imagination','paper-tiger','Paper Tiger',1,'face-up',['self'],['creature-defeated'],
 'If the defeated creature was not a token, summon a colourless 1/1 paper token if you have room.',
 'One paid replacement piece for token decks; token death cannot feed itself.','Fill the board or remove the result; consumed source produces no second token.',['token-order']);
add('imagination','costume-rehearsal','Costume Rehearsal',2,'face-up',['either'],['spell-played'],
 'All surviving colourless paper tokens on both sides gain Shield until their controllers’ next turns start. Identical Shield does not stack.',
 'Symmetrical stage protection; a mixed deck can shelter its small pieces.','Opponent tokens also benefit; use the visible timing and consume protection with small hits.',['token-order']);
add('memory','somewhere-safe','Somewhere Very Safe',1,'face-up',['self'],['creature-defeated'],
 'If the defeated non-token creature is still in your discard, move that exact instance to the bottom of your personal deck.',
 'Preserve a body for a later draw without a free replay.','Pressure the delay; earlier Last Word recovery means no second copy is created.');
add('memory','second-alarm','Second Alarm',2,'face-up',['either'],['fate-entered'],
 'Move one chosen own pending player-created one-shot occurrence one space later, no later than +4 rounds. Announce its new time; never move an environment.',
 'A visible later opportunity rather than resurrecting a skipped occurrence.','Contest the newly announced timing; no legal pending event consumes this harmlessly.',['fate-entry-policy',118,119]);
add('memory','borrowed-tomorrow','Borrowed Tomorrow',2,'face-down',['opponent'],['spell-played'],
 'Put your oldest discarded conditional card other than this card on the bottom of your deck, preserving its identity and spent history. It gains no discount or immediate rearm.',
 'Slow conditional-card recovery with a real future draw/play cost.','Pressure before the redraw; eligibility to arm a recovered spent card requires explicit policy.',['conditional-rearm-policy']);
add('generic','spare-umbrella','Spare Umbrella',1,'face-up',['self'],['spell-played'],
 'Your lowest-current-health creature gains Shield until your next turn starts. Ties use oldest arrival; no creature means no effect.',
 'Easy generic shelter for a mixed fragile board.','Empty the board or consume Shield cheaply; existing Shield does not become two layers.');
add('generic','queue-please','Queue, Please',1,'face-up',['either'],['spell-played'],
 'Each player moves the top card of their personal deck to its bottom without looking. A deck of 0 or 1 card is unchanged.',
 'Symmetrical blind disruption; nobody gets information or an extra card.','Play around publicly known ordering changes; no hidden reroll or shuffle.');
add('generic','refreshments','Round of Refreshments',1,'face-up',['either'],['axiom-replaced','fate-entered'],
 'Restore 1 heart to both heroes, without exceeding either maximum. A finished match stays finished.',
 'Choose one public gathering moment for simple shared recovery.','The opponent heals too; a Fate option waits for settled entry semantics.',['fate-entry-policy-for-fate-menu',118]);
add('generic','tiny-windfall','Tiny Windfall',1,'face-down',['either'],['spell-played'],
 'The currently active player gains 1 energy this turn, capped at 10. No draw, free card play or additional activation budget.',
 'A small surprise whose beneficiary depends on turn timing.','Opponent spell timing may give the opponent the energy; the condition is already consumed.');
add('generic','seat-reserved','Seat Reserved',2,'face-down',['opponent'],['attack-declared'],
 'While your board is empty, reveal this Guard creature in response to an attack aimed at your side. It enters normally; the declared attack must then obey legal Guard targeting. No extra Entrance effect.',
 'A simple masked Guard interception rather than a retroactive damage shield.','Fill the armed player’s board or use applicable Guard-ignoring rules; full-board/impossible-interception policy must be settled first.',['guard-interception-policy','masked-creature-board-space']);

// Revision under13October human steering: keep23concepts, distinguish card kinds and advanced colour lines.
const creatureIds=new Set(['reason-spare-premise','emotion-standing-ovation','perception-clock-eyes','language-chair-recognises','imagination-paper-tiger','memory-somewhere-safe','generic-spare-umbrella','generic-seat-reserved'].map(id=>'conditional-'+id));
const ways={
 reason:{specialism:'Comparisons, matched values, odd/even costs and carefully committed cases.',mono:'Repeated Reason bodies/spells build predictable comparisons and cost cases.',mix:'Imagination swaps or Language attack labels set up comparisons; Perception helps choose the trigger.'},
 emotion:{specialism:'Spend own hearts, pressure opposing hearts and turn losses into tempo.',mono:'Concentrate paid heart-risk and damage reactions under the active Win axiom.',mix:'Language Guard or Memory recovery sustains risk; borrowed payoff is not a free universal heal.'},
 perception:{specialism:'Private/public deck information, exposure and planned trigger knowledge.',mono:'Inspect and expose before committing attacks or concealed triggers.',mix:'Feed Reason precision or protect a fragile Imagination plan; preserve opponent privacy.'},
 language:{specialism:'Axiom replacement, temporary permissions/Guard and post-play resource taxes.',mono:'Plan around rule replacement and controlled follow-up costs.',mix:'Change the terms under which another colour fights, rather than repeat its damage spell.'},
 imagination:{specialism:'Unexpected shapes, revealed bodies and colourless token formations.',mono:'Build token boards and transformation windows with available slots.',mix:'Transform defensive bodies or shelter other colours’ token plans; do not create free copies.'},
 memory:{specialism:'Discard instance history, delayed opportunities and paid future recovery.',mono:'Recover the right instance and preserve a planned later event.',mix:'Revisit other colours’ useful paid Entrances/spells; never revive a permanently skipped environment.'},
 generic:{specialism:'Plain shelter, modest shared resources and a readable Guard ambush.',mono:'Supports a qualifying mono deck without defining its identity.',mix:'Easy bridges; these helpers do not receive automatic colour bonuses.'},
};
const lines={reason:['aggro','midrange','control'],emotion:['control','midrange','aggro'],perception:['aggro','control','midrange'],language:['control','aggro','midrange'],imagination:['control','aggro','midrange'],memory:['midrange','aggro','control']};
const positions={};
for(const c of cards){
 c.kind=creatureIds.has(c.id)?'creature':'spell';c.mechanic='conditional';
 c.strategy={line:c.colour==='generic'?'helper':lines[c.colour][positions[c.colour]||0],...ways[c.colour]};positions[c.colour]=(positions[c.colour]||0)+1;
 c.availability={minimumCompletedLessons:2,recommendedCompletedNodes:['gate','b-town-hall'],predicateStatus:'Recommended canonical completion history; not runtime enforcement',introduction:'Existing saved NPC/quest flow; teaser grants nothing',channels:'All pool/grant/loadout paths require qualification and individual release; plot-only never packs'};
 c.armingClassification=c.kind==='creature'?'Creature copy/colour contribution, not spell quota. Pay arming once; reveal enters normally without a second payment.':'Spell copy/colour quota. Pay arming once; consume then resolve/discard once.';
 if(c.kind==='creature'){
  c.costProposal=Math.max(2,c.costProposal);c.statsProposal={attack:1,health:c.id.endsWith('seat-reserved')?3:2,keywords:c.id.endsWith('seat-reserved')?['guard']:[]};
  c.entryEffectProposal=c.effectProposal;c.timingProposal=c.id.endsWith('seat-reserved')?'After attack declaration, before final Guard legality and combat damage.':'Reveal/enter through normal creature-entry handling after the triggering action; run the printed Entrance once.';
  c.limits='One conditional reveal per committed arming. No second payment/free attack. Sleeping/Swift and normal Entrance/Guard rules apply. Board reservation/full-board/rearm policy unresolved.';
  c.gates.push('masked-creature-board-space','reveal-vs-play-event-policy');
 }
}

const colours=['reason','emotion','perception','language','imagination','memory'];
assert.equal(cards.length,23);for(const colour of colours)assert.equal(cards.filter(c=>c.colour===colour).length,3);
assert.equal(cards.filter(c=>c.colour==='generic').length,5);
assert.equal(cards.filter(c=>c.kind==='creature').length,8);assert.equal(cards.filter(c=>c.kind==='spell').length,15);
for(const colour of colours)assert.deepEqual(new Set(cards.filter(c=>c.colour===colour).map(c=>c.strategy.line)),new Set(['aggro','midrange','control']));
for(const field of ['id','name','effectProposal'])assert.equal(new Set(cards.map(c=>c[field])).size,23);
const current=JSON.parse(fs.readFileSync(path.join(dir,'../card-arena-2026-10-12/card-catalogue.json')));
for(const card of cards){
 assert(!current.cards.some(c=>c.id===card.id||c.name===card.name),'existing catalogue collision '+card.name);
 assert(card.allowedTriggers.length>=1&&card.allowedTriggers.length<=3);
 assert(card.allowedActors.every(a=>['self','opponent','either'].includes(a)));
 assert(card.costProposal>=1&&card.costProposal<=2);
}
fs.writeFileSync(path.join(dir,'concepts.json'),JSON.stringify({status:'Design handoff; backend/design/art directly authorized after all current initial generation, not implemented now',count:23,cardKinds:{maskedCreatures:8,conditionalSpells:15},allocation:{reason:3,emotion:3,perception:3,language:3,imagination:3,memory:3,generic:5},cards},null,2)+'\n');
let md='# Twenty-three advanced conditional concepts\n\nLatest13October steering: after ALL current initial/starter generation, proceed directly to backend implementation and this set’s design/art. No implementation/generation in this handoff. These23 proposals are separate from the existing210:3 per Way plus5Generic, with8masked creatures/15spells. Each Way has aggro/midrange/control lines and leans hard into its specialism. Costs(1–2), creature stats, visibility, menus, ordering and wording remain proposals.\n\nCampaign availability requires TWO completed lessons, recommended canonical history gate+b-town-hall; an NPC/quest introduces the set. Teasers grant nothing, old qualified saves infer history, qualification does not grant all23, and plot-only cards never enter packs. Shared Axioms, stars, rift jumps or current chapter do not substitute for completion.\n\nArming commits one printed trigger/actor. Spells consume/resolve/discard once. Masked creatures reveal/enter through normal handling and execute their printed Entrance once; no extra payment/free attack, and sleeping/Swift still applies. Seat Reserved introduces accepted pre-damage Guard interception, with board-space/reveal-event/target edge policies still gated. Other reactions remain post-action. Creature construction contributions and spell quotas are different; absent colour does not imply Memory. Optional mono/mixed themes are not silently injected stat bonuses.\n';
for(const colour of [...colours,'generic']){
 md+='\n## '+colour.charAt(0).toUpperCase()+colour.slice(1)+'\n';
 for(const c of cards.filter(c=>c.colour===colour))md+='\n### '+c.name+'\n\n- ID: '+c.id+'; '+c.kind+'; proposed cost '+c.costProposal+'; '+c.visibilityProposal+(c.statsProposal?'; proposed '+c.statsProposal.attack+'/'+c.statsProposal.health+(c.statsProposal.keywords.length?' · '+c.statsProposal.keywords.join(', '):''):'')+'.\n- Line: '+c.strategy.line+'. '+c.strategy.specialism+'\n- Arm: '+c.allowedActors.join(' / ')+'; '+c.allowedTriggers.join(' / ')+'. Choose one printed option where a menu exists.\n- Effect / normal Entrance: '+c.effectProposal+'\n- Role: '+c.role+'\n- Mono: '+c.strategy.mono+' Mixed: '+c.strategy.mix+'\n- Counterplay: '+c.counterplay+'\n- Gates: '+c.gates.join(', ')+'.\n';
}
md+='\n## Validation and release notes\n\nChecks:23unique IDs/names/effects;6groups of3+5Generic;8creatures/15spells; each Way has one aggro/midrange/control line; bounded costs/menus; no existing210 ID/name collision. Two-lesson predicate fixtures and source evidence are in PROGRESSION-EVIDENCE.md/validate-progression.mjs. None is runtime enforcement or proof of balance.\n\nReason’s three effects were explicitly revised in this new draft for comparison/parity specialism; eight card kinds/reveal routes were assigned under the latest masked-creature steering. Original210contracts/art are unchanged. Shared primitives remain deliberate; before release audit exact tuples, paid/copy loops, privacy, Guard interception and Win boundaries. Reserved-slot/full-board, reveal-vs-play events, sleeping/Swift, multiple-Guard/invalid interception, Fate/expiry/replay/tie and rearm decisions remain gates.\n\nFuture authorized design/art after initial generation includes appropriate masked-creature art and spell/trap illustrations, reusing normal full-art frames/colour motifs and existing SFX. No art/audio/runtime was generated here. Do not grant all23 or admit plot-only cards to packs.\n';
fs.writeFileSync(path.join(dir,'CONCEPTS.md'),md);
console.log('23 advanced concepts validated:3 per six colours +5 Generic;8creatures/15spells; three strategy lines per Way; unique IDs/names/effects; no existing210 collisions.');
