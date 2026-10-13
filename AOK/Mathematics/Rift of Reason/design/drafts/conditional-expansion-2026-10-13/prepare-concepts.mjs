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
  gates:[148,109,123,...gates],status:'Future concept; no runtime definition, grant, artwork, recording or settled balance.'});
}
add('reason','premise-pending','Premise Pending',1,'face-down',['opponent'],['creature-played'],
 'The triggering creature loses 1 attack until its controller’s next turn ends, minimum 0.',
 'Small precise ambush; preparing an equal-attack exchange.','Play a low-value body first; an irrelevant/no-longer-present target still consumes the condition.');
add('reason','spare-premise','Spare Premise',1,'face-up',['self'],['axiom-replaced'],
 'Your most damaged surviving creature gains 1 maximum health and heals 1. Ties use oldest board arrival.',
 'Rule-change support for a durable board.','Remove its useful recipient before the rule change; no creature means no effect.');
add('reason','exhibit-aha','Exhibit Aha',1,'face-down',['opponent'],['creature-played','spell-played'],
 'Inspect your top 2 personal-deck cards; keep their order or swap them. Draw nothing.',
 'Commit to one anticipated action; private preparation rather than a free draw.','Force the unhelpful timing; deck mutation/draw limits still apply.');
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
add('generic','seat-reserved','Seat Reserved',1,'face-down',['opponent'],['creature-played'],
 'If your board is empty, summon one colourless 1/1 paper token if there is a legal slot. Otherwise do nothing.',
 'A simple response to an enemy arrival while behind.','Trigger while a friendly creature remains; normal slot/prevention rules still apply.',['token-order']);

const colours=['reason','emotion','perception','language','imagination','memory'];
assert.equal(cards.length,23);for(const colour of colours)assert.equal(cards.filter(c=>c.colour===colour).length,3);
assert.equal(cards.filter(c=>c.colour==='generic').length,5);
for(const field of ['id','name','effectProposal'])assert.equal(new Set(cards.map(c=>c[field])).size,23);
const current=JSON.parse(fs.readFileSync(path.join(dir,'../card-arena-2026-10-12/card-catalogue.json')));
for(const card of cards){
 assert(!current.cards.some(c=>c.id===card.id||c.name===card.name),'existing catalogue collision '+card.name);
 assert(card.allowedTriggers.length>=1&&card.allowedTriggers.length<=3);
 assert(card.allowedActors.every(a=>['self','opponent','either'].includes(a)));
 assert(card.costProposal>=1&&card.costProposal<=2);
}
fs.writeFileSync(path.join(dir,'concepts.json'),JSON.stringify({status:'Future proposal only; separate from the existing 210',count:23,allocation:{reason:3,emotion:3,perception:3,language:3,imagination:3,memory:3,generic:5},cards},null,2)+'\n');
let md='# Twenty-three future conditional concepts\n\nSeparate future expansion after the initial batch. These are additional proposals, not replacements or runtime definitions in the existing 210. Three per Way of Knowing plus five Generic. Costs (1–2), visibility, actor/trigger menus, targets, caps and timing are proposals for later review. All use the backend handoff: one committed trigger/actor, post-resolution reaction, consume before effect, ordinary energy/play limits, no free rearming. “Either” may include actor-neutral events only where the event schema allows them. Face-down choices remain committed, not rerolled on reveal.\n\nColour spells/conditional cards still obey the approved submitted-deck quota; no live matching-creature prerequisite. Generic helps mono and mixed plans without deciding the separate Memory/Generic classification. Exact once-per-turn mono/mixed bonuses are deliberately not added to these frozen proposals.\n';
for(const colour of [...colours,'generic']){
 md+='\n## '+colour.charAt(0).toUpperCase()+colour.slice(1)+'\n';
 for(const c of cards.filter(c=>c.colour===colour))md+='\n### '+c.name+'\n\n- ID: '+c.id+'; proposed cost '+c.costProposal+'; '+c.visibilityProposal+'.\n- Arm: '+c.allowedActors.join(' / ')+'; '+c.allowedTriggers.join(' / ')+'. Choose one printed option where a menu exists.\n- Effect: '+c.effectProposal+'\n- Role: '+c.role+'\n- Counterplay: '+c.counterplay+'\n- Gates: '+c.gates.join(', ')+'.\n';
}
md+='\n## Validation and release notes\n\nArithmetic/identity checks:23 unique IDs, names and effect texts; six groups of3 plus5Generic; no ID/name collision with the 210 catalogue; bounded printed menus and costs. This is not engine testing or proof of balance. Each effect has a different trigger/target/payoff combination within its colour. Shared small damage, healing, Shield, recovery and tokens remain deliberate primitives, not a claim that every underlying operation is novel.\n\nBefore release, audit against the then-current shipped set, paid/copy/recovery loops, event ordering, private/public views, caps and active Win rules. Reject exact clones; do not silently change the 210 to make room. Shared trigger-back/armed-marker art, existing colour motifs/full-art normal frames and reused card-play/reveal/block/axiom/defeat sounds are future needs only. No portrait, sound or voice generation in this draft. Fate/expiry/replay/tie and conditional rearm policy remain explicit gates.\n';
fs.writeFileSync(path.join(dir,'CONCEPTS.md'),md);
console.log('23 future concepts validated:3 per six colours +5 Generic; unique IDs/names/effects; no existing210 ID/name collisions.');
