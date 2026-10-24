// Authored planning data only. Not loaded by the game; no effects are implemented here.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { reviewCatalogue } from './review-123.mjs';
import { reviewStoryCards } from './review-132.mjs';
import { reviewExpansion2, reviewExpansion3, reviewExpansion4 } from './review-129.mjs';
const dir = path.dirname(fileURLToPath(import.meta.url));
const cards = [];
const creatureRarities = ['common','common','common','common','uncommon','uncommon','uncommon','uncommon','rare','rare','mythic','legendary'];
const spellRarities = ['common','common','common','common','common','uncommon','uncommon','uncommon','rare','rare'];
const axiomRarities = ['common','common','common','uncommon','rare','mythic'];
const themes = {
  reason: 'Careful exchanges, defensive control and public proof goals',
  emotion: 'Risk, pressure, self-damage and changed victory conditions',
  perception: 'Information, exposed targets and visible future plans',
  language: 'Labels, support, rule changes and temporary control',
  imagination: 'Stat transformations, diverse boards and token plans',
  memory: 'Discard recovery, delayed effects and bounded Fate re-entry',
  generic: 'Simple support and shared rules accessible to any deck',
};
function add(affinity, kind, rows, rarities) {
  rows.trim().split('\n').forEach((row, index) => {
    const [name, cost, detail, text, tags, counterplay] = row.split('|').map(x => x.trim());
    const id = affinity + '-' + name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    cards.push({id, name, affinity, kind, rarity: rarities[index], cost: Number(cost),
      ...(kind === 'creature' ? {attack: Number(detail.split('/')[0]), health: Number(detail.split('/')[1])}
        : kind === 'axiom' ? {category: detail} : {target: detail}),
      text, tags: tags.split(','), strategy: themes[affinity], counterplay,
      status: 'draft; not implemented or balance-tested',
      ...(kind === 'creature' ? {identityStatus: 'Mechanical contract retained; use builder-selected persona/pun/prop in persona-roster.json. Teacher delegated cast decisions; no teacher roster approval. Mechanical release and art QA remain.', artDirection: 'design/ART-BIBLE.md and approved 0-style/style-board.png'} : {})});
  });
}
add('reason', 'creature', `
Premise Pigeon|1|1/2|No ability.|board|Trade with a larger creature.
Axiom Ant|2|1/3|Guard.|guard|Remove Guard or use a spell.
Proof Beetle|2|2/2|Entrance: another friendly creature gains 1 maximum health and heals 1.|healing|Remove the supported creature.
Counterexample Crow|3|2/2|Entrance: deal 1 damage to an enemy creature.|damage|Shield protects a small target.
Parity Panda|3|2/4|After surviving a fight with equal effective attack, heal this by 1.|combat,healing|Attack with unequal power.
Induction Ibex|3|2/3|Once per turn, after you cast a Reason spell, this gains 1 attack until your next turn starts.|spell-payoff|Remove it before the spell sequence.
Logic Lynx|4|3/4|Entrance: look at the top 2 personal-deck cards; keep their order or swap them.|inspection|Pressure its setup turn.
Guardrail Goat|4|2/5|Guard. The first spell damage this takes each round is reduced by 1.|guard,prevention|Use combat or multiple small spells.
Diagonal Deer|4|3/3|Entrance: silence an enemy creature whose current attack equals this creature's attack.|control|Change the target's attack first.
Inference Heron|5|3/5|Once per turn, after another friendly creature survives a fight at 1 health, draw 1 personal-deck card.|draw,combat|Finish damaged creatures before they fight.
Boundary Bear|6|4/6|Guard. While this is ready, your hero takes at most 2 damage from each creature attack.|guard,prevention|Disable it, use spells or attack repeatedly.
Theorem Tortoise|7|4/7|At your turn's end, if you cast 2 Reason spells, schedule at +1 round: your creatures present then gain 1 maximum health and heal 1. At most one event from this creature pending.|fate-schedule,spell-payoff|Remove the board or skip the announced event.
`, creatureRarities);
add('emotion', 'creature', `
Pulse Pup|1|2/1|No ability.|board|Trade a small creature.
Courage Cub|2|2/2|Entrance: restore 1 heart to your hero.|healing|Keep pressure on its board.
Spite Sprite|2|1/3|Once per turn, after taking damage and surviving, this gains 1 attack until your next turn starts.|self-damage|Defeat it in one hit.
Cheer Chick|2|1/2|Entrance: another friendly creature gains 1 attack this turn.|buff|Remove or block the supported attacker.
Temper Tiger|3|3/2|Entrance: your hero loses 1 heart.|self-damage|Counterattack the fragile body.
Bond Badger|3|2/4|Once per turn, after another friendly creature is defeated, restore 1 heart to your hero.|healing|Remove this first.
Grudge Goose|3|2/3|Last Word: deal 1 damage to the enemy hero.|damage|Silence it or change Win.
Resolve Ram|4|2/5|Guard. If your hero has 4 hearts or less, this has 1 more attack.|guard|Use removal instead of small trades.
Outrage Ox|4|4/3|Swift. This cannot attack a hero on the turn it arrives.|swift|Use a high-health defender.
Heartfire Hawk|5|3/4|Once per turn, after your hero loses hearts during your turn, another friendly creature gains 1 attack this turn.|self-damage,buff|Remove its supporting attackers.
Stormheart Serpent|6|5/5|Entrance: choose to lose up to 2 of your own hearts; deal that much damage to a chosen enemy creature.|self-damage,choice|Exploit low hearts or deny small kill targets.
Empathy Elephant|7|4/8|At your turn's end, if both heroes lost hearts this turn, restore 2 hearts to both and draw 1 personal-deck card.|healing,draw|Avoid enabling both losses or replace Win.
`, creatureRarities);
add('perception', 'creature', `
Cue Cricket|1|1/2|Entrance: look at the top card of your personal deck.|inspection|Pressure instead of giving planning time.
Lens Lynx|2|2/2|Entrance: remove Elusive from one enemy creature until its controller's next turn starts.|control|Use other keywords or restore Elusive.
Focus Falcon|2|1/3|This deals 1 extra combat damage to a creature whose Shield has already been consumed this match.|combat|Refresh Shield or heal the exposed target.
Shadow Shrimp|2|2/1|Elusive.|elusive|Use a spell or remove Elusive.
Scout Stoat|3|2/3|Entrance: inspect the top 2 personal-deck cards and put one on the bottom.|inspection|Contest its setup turn.
Prism Puffin|3|2/4|Entrance: another friendly creature becomes Perception until your next turn starts.|transformation|Choose neutral matchups or remove the buff.
Pattern Panther|3|3/2|Once per round, after an enemy scheduled occurrence is skipped, draw 1 personal-deck card.|fate-move,draw|Use immediate effects or protect key occurrences.
Signal Seal|4|2/5|Guard. Entrance: heal your hero by 1 for each environmental occurrence permanently skipped this match, maximum 3.|guard,fate-move|Pressure before skips accumulate.
Observer Octopus|4|3/4|Once per turn, after you inspect deck cards without drawing them, another friendly creature gains Shield.|inspection,shield|Remove its support before protection arrives.
Exposure Eagle|5|3/5|Entrance: remove one chosen enemy keyword: Guard, Shield or Elusive.|control|Stack different defences or restore a keyword.
Horizon Hare|6|4/5|Entrance: move one own pending event one space earlier, no sooner than +1 round; announce its new time.|fate-schedule|Skip the new node or contest the board.
True Sight Stag|7|4/7|Once per round, replace your normal personal draw with inspecting the top 3 cards, drawing one and restoring the others in their original order.|inspection,draw|Pressure before the expensive selector arrives.
`, creatureRarities);
add('language', 'creature', `
Question Quail|1|1/2|Entrance: unfreeze another friendly creature.|control,support|Use removal, Guard or another Freeze; normal action limits still apply.
Comma Caterpillar|2|1/3|Guard.|guard|Remove Guard or use a spell.
Label Lemur|2|2/2|Entrance: an enemy creature loses 1 attack until its controller's next turn ends, minimum 0.|control|Use another attacker or restore its stats.
Word Weasel|2|2/1|Last Word: choose a surviving friendly creature; it gains 1 maximum health and heals 1.|buff|Remove other friendly creatures first.
Echo Egret|3|2/3|Once per turn, after you play an Axiom from hand, draw 1 personal-deck card.|axiom,draw|Remove the engine or change rules through Fate.
Definition Dolphin|3|1/4|Entrance: give a friendly creature Guard until your next turn starts.|guard|Remove Guard or attack after expiry.
Debate Dingo|3|3/2|When attacking a creature with higher effective attack, this gains Shield for that fight only.|combat,shield|Use equal or lower power or silence it.
Clause Crane|4|2/5|Guard. Once per round, when an active Axiom is replaced, heal this by 1.|guard,axiom|Use direct removal instead of chip damage.
Metaphor Mantis|4|3/3|Entrance: an enemy creature loses its colour and 1 attack until your next turn starts, minimum 0.|control,transformation|Wait out the label or clear the debuff.
Contract Coyote|5|3/5|Your first spell each turn targeting a friendly creature costs 1 less, minimum 0.|cost|Remove the creature before the support sequence.
Orator Owl|6|4/6|At your turn's end, if you played an Axiom, schedule at +1 round: your creatures present then gain 1 attack until your next turn ends. At most one own Orator event pending.|axiom,fate-schedule|Trade the board or skip the occurrence.
Lexicon Lion|7|4/7|Entrance: choose one active Axiom category; discard that rule and restore its basic rule. Draw 1 personal-deck card.|axiom,draw|Keep a replacement or rely on other categories.
`, creatureRarities);
add('imagination', 'creature', `
Doodle Duck|1|1/2|No ability.|board|Trade a larger creature.
Possibility Pika|2|2/2|Entrance: choose 1 extra attack or 1 extra maximum health and healing for this creature.|choice|Punish the mode not chosen.
Fable Fawn|2|1/3|Entrance: swap the attack and health of another friendly creature using normal stat-swap rules.|transformation|Use balanced bodies or remove the transformed threat.
Mosaic Mole|2|1/2|Last Word: summon a colourless 1/1 paper token if you have board space.|token|Silence it before defeat.
Blueprint Bat|3|2/3|The first colourless token you summon each turn arrives with 1 extra maximum health.|token|Remove this before the token spell.
Mirror Marten|3|2/3|Entrance: copy another friendly creature's current attack until your next turn starts, maximum 4.|transformation|Remove the large source before the copy turn.
Chimera Chick|3|1/4|Once per turn, after this has attack and health swapped, it gains Shield.|transformation,shield|Remove Shield or deal damage twice.
Stage Mouse|4|2/4|Elusive. Your colourless tokens have 1 extra attack while this remains in play.|token,elusive|Use a spell or strip Elusive.
Paradox Pony|4|3/3|Entrance: swap an enemy creature's attack and health until your next turn starts, using normal swap rules.|transformation|Use balanced stats or restore them.
Cloud Castle Crab|5|2/6|Guard. Once per turn, after surviving damage, summon a colourless 1/1 paper token if you have board space.|guard,token|Defeat it in one hit or silence it.
Dreamweaver Whale|6|3/7|At your turn's end, if you control at least 2 colourless tokens, draw 1 personal-deck card.|token,draw|Remove the tokens or their engine.
Impossible Unicorn|7|4/6|Entrance: choose two other friendly creatures; swap their attack values permanently, then give each 1 maximum health and heal 1.|transformation|Limit supporting creatures or silence boosted bodies.
`, creatureRarities);
add('memory', 'creature', `
Bookmark Bunny|1|1/2|Entrance: if this is still on your board when your next turn starts, draw 1 personal-deck card.|draw,delayed|Defeat, bounce, steal or silence it before its owner's next turn.
Recall Robin|2|1/2|Entrance: put your most recently discarded spell on the bottom of your personal deck if still there.|recursion|Race before it is redrawn.
Archive Armadillo|2|1/3|Guard.|guard|Remove Guard or use spells.
Return Roach|2|2/1|Once per match, before an enemy spell targeting this resolves, return this to its owner's hand if there is room.|recursion,spell-reaction|Use creature combat, untargeted damage or silence; a full hand prevents escape.
Chronicle Cat|3|2/3|Once per turn, after you recover a card from discard, heal your hero by 1.|recursion,healing|Remove the engine or exploit reversed Win.
Replay Raccoon|3|2/3|Entrance: return a friendly creature costing 1 or less from discard to hand.|recursion|Pressure during the replay turn.
Hourglass Hedgehog|3|1/4|Guard. The first time each round you move Fate backward, this gains Shield.|guard,fate-move|Remove Shield or use repeated damage.
Souvenir Seal|4|2/4|Once per turn, after an own pending event resolves, draw 1 personal-deck card. Skipped events do not count.|fate-schedule,draw|Skip or cancel the event.
Sequence Swan|4|3/4|Entrance: move one own pending event one space later, maximum +4 rounds; draw 1 personal-deck card if it moved.|fate-schedule,draw|Contest the newly announced node.
Second Chance Salamander|5|3/4|Entrance: return a defeated creature costing 3 or less to hand; it gains 1 maximum health on its next play only.|recursion|Race the replay or remove the restored creature.
Keeper Koi|6|3/7|Once per round, when a marked repeatable player event resolves, heal all your creatures by 1.|fate-repeat,healing|Expire or skip the marked space.
Timekeeper Tapir|7|4/7|Entrance, once per match: copy one spent own one-shot event to a new public occurrence at +2 rounds. No spell energy is repaid; the spent original stays consumed.|fate-schedule,recursion|Skip the new occurrence or avoid supplying a powerful original.
`, creatureRarities);
add('reason', 'spell', `
Check the Premise|1|enemy-creature|Deal 1 damage, or 2 if the target has Guard.|damage|Use a non-Guard threat.
Small Lemma|1|friendly-creature|Give 1 maximum health and heal 1.|healing|Use removal instead of chip damage.
Work It Out|2|none|Inspect the top 3 personal-deck cards; draw one and bottom the others in their original relative order.|inspection,draw|Pressure the selection turn.
Exact Answer|2|enemy-creature|Deal damage equal to its current attack, capped at 3.|damage|Use low attack and high health.
Provisional Proof|2|friendly-creature|Give Shield. Draw 1 personal-deck card only if it already had Guard when cast.|shield,draw|Remove its keywords.
Divide the Case|3|two-enemy-creatures|Deal 2 damage to each of two distinct chosen creatures. If only one legal target exists, deal 2 to it.|damage|Play one large threat.
Wait for Evidence|2|friendly-creature|At +1 round, fully heal the chosen creature if it is still on your board.|fate-schedule,healing|Bounce, remove or skip it before resolution.
Narrow Conclusion|3|enemy-creature|Silence it; its attack becomes 2 until its controller's next turn ends.|control|Use a different threat or restore attack.
Proof by Cases|4|choice|Choose: deal 4 damage to an enemy creature, or give two friendly creatures 2 maximum health and heal each by 2.|choice|Force the less useful choice.
Finish the Argument|5|enemy-creature|Defeat a creature with 2 health or less. If defeated, put one Reason spell from your discard on the bottom of your deck.|control,recursion|Heal beyond the threshold.
`, spellRarities);
add('emotion', 'spell', `
Quick Courage|1|friendly-creature|Give 2 attack until this turn ends.|buff|Block with Guard or prevent the hit.
Honest Hurt|1|none|Your hero loses 1 heart. Draw 1 personal-deck card.|self-damage,draw|Change Win or pressure remaining hearts.
Share the Feeling|2|friendly-creature|Deal 1 damage to it; if it survives, give 2 attack until your next turn starts.|self-damage,buff|Remove it before it attacks.
Cool Down|1|enemy-creature|Reduce its attack by 2 until its controller's next turn ends, minimum 0.|control|Wait or use another attacker.
Careful Cheer|2|none|Restore 2 hearts to your hero, or 3 if you control 2 or fewer creatures.|healing|Develop a larger board.
Cost of Courage|2|friendly-creature|Your hero loses 2 hearts; give the target 2 maximum health and heal it by 2.|self-damage,buff|Silence or remove the supported target.
Tomorrow's Rally|3|none|At +1 round, your creatures present then gain 1 attack until your next turn ends.|fate-schedule,buff|Trade the board or skip the node.
Shared Pain|3|none|Deal 2 damage to both heroes as one simultaneous effect.|self-damage,damage|Change Win, heal or race the threshold.
Outburst|4|enemy-creature|Deal 5 damage to it. Your hero loses 2 hearts.|self-damage,damage|Exploit the caster's low hearts.
Second Heartbeat|4|none|Restore your hero to 5 hearts if below 5; otherwise draw 2 personal-deck cards.|healing,draw|Maintain pressure or exploit reversed Win.
`, spellRarities);
add('perception', 'spell', `
Notice the Crack|1|enemy-creature|Deal 1 damage, or 2 if the creature is already damaged.|damage|Heal between exchanges.
Read the Room|1|none|See the count and colours, not identities, of enemy hand creatures. Draw 1 personal-deck card.|inspection,draw|Change the hand before playing.
Expose the Shield|1|enemy-creature|Remove Shield. If none was removed, reduce its attack by 1 this turn, minimum 0.|control|Use other defences.
Practical Observation|2|none|Inspect the top 2 unreserved shared Axioms without changing them. Draw 1 personal-deck card.|inspection,draw|Draw or reorder unreserved rules before the next choice.
Focused Hit|2|enemy-creature|Deal 2 damage, or 3 if it has no keywords.|damage|Keep a keyword or use Shield.
Change the Angle|2|friendly-creature|Choose its colour until your next turn starts; restore its base colour afterward.|transformation|Use neutral targets or clear the effect.
Mark the Moment|2|enemy-creature|At +1 round, deal 3 damage to the chosen creature if still in play. Its controller sees the mark.|fate-schedule,damage|Bounce, heal, protect or skip.
Follow the Clue|3|none|Inspect the top 4 personal-deck cards; draw one creature and one spell if present, then bottom the others in original order.|inspection,draw|Pressure the expensive selection turn.
Strip the Illusion|4|enemy-creature|Remove its keywords and temporary buffs. Printed stats, permanent changes and existing damage remain.|control|Use permanent stats or reapply a keyword.
Public Forecast|3|own-pending-event|Move one own pending event one space earlier or later; earliest +1 round. Announce the new time.|fate-schedule|Adapt to or skip the new node.
`, spellRarities);
add('language', 'spell', `
A Better Label|1|enemy-creature|Reduce its attack by 1 until its controller's next turn ends, minimum 0. Draw 1 personal-deck card.|control,draw|Use another attacker.
Plain Words|1|friendly-creature|Remove one temporary attack debuff; if none exists, heal the target by 1.|healing|Use permanent damage or silence.
Hold the Floor|2|friendly-creature|Give Guard and 1 maximum health; heal it by 1.|guard|Remove Guard or target with spells.
Ask Again|2|enemy-creature|Remove Elusive and reduce its attack by 1 this turn, minimum 0.|control|Reapply protection or wait out the penalty.
Change the Subject|2|active-attacks-axiom|Discard the active attack-limit rule and restore that category to basics. Draw 1 personal-deck card.|axiom,draw|Hold another attack-limit rule.
Careful Wording|3|friendly-creature|Give 1 attack and 2 maximum health; heal it by 2.|buff|Silence or remove the supported creature.
Tomorrow's Address|2|none|At +1 round, your creatures present then gain 1 attack until your next turn ends.|fate-schedule|Trade the board or skip the occurrence.
Read the Fine Print|3|enemy-creature|Silence it. Your hero loses 1 heart.|control,self-damage|Exploit low hearts or reverse Win.
Borrowed Voice|4|enemy-creature|Take control of a creature with 1 attack or less until your next turn starts. It arrives asleep; return it if still in play.|control|Raise its attack or fill the borrower's board.
Rewrite One Clause|4|active-axiom-category|Remove that category's active rule. You may immediately play one matching-category Axiom from hand, paying its normal cost and activation budget.|axiom|Keep another answer or exhaust its resources.
`, spellRarities);
add('imagination', 'spell', `
Sketch a Friend|1|none|Summon one colourless 1/1 paper token if you have board space.|token|Use small area damage.
Try Another Shape|1|friendly-creature|Swap its attack and health using normal stat-swap rules.|transformation|Use balanced defenders or answer after the swap.
Bright Possibility|1|friendly-creature|Choose 1 attack this turn or 1 maximum health and healing.|choice|Force defensive spending.
Paper Shield|2|friendly-creature|Give Shield. If it is a colourless token, also give 1 attack.|token,shield|Remove Shield or hit twice.
Unexpected Door|2|friendly-creature|Return it to your hand; its next play costs 1 less, minimum 0. Consume the discount on play.|recursion,cost|Pressure while its board is smaller.
New Perspective|3|enemy-creature|It becomes Imagination until its controller's next turn ends. Draw 1 personal-deck card.|transformation,draw|Avoid affected matchups or restore colour.
Tomorrow's Sketch|2|none|At +1 round, summon two colourless 1/1 paper tokens, limited by board space.|fate-schedule,token|Wipe after resolution or skip the node.
Borrow the Shape|3|friendly-and-enemy-creature|The friendly target copies the enemy target's current attack until your next turn starts, maximum 5.|transformation|Reduce the source's attack before casting.
Dream in Layers|4|none|Summon two colourless 1/1 paper tokens, then give all your colourless tokens 1 maximum health and heal 1.|token|Use area damage or remove token support.
Impossible Position|5|two-distinct-creatures|Swap their current attack values until your next turn starts. May choose either side; controllers do not change.|transformation|Use balanced stats or clear the benefit.
`, spellRarities);
add('memory', 'spell', `
Keep the Note|1|own-discard-spell|Put it on the bottom of your personal deck. Restore 1 heart to your hero.|recursion,healing|Race before it is redrawn.
Familiar Path|1|own-discard-creature|Return a creature costing 1 or less to hand.|recursion|Use tempo while it is absent.
Remember the Guard|2|friendly-creature|Give Guard until your next turn starts. Heal it by 2.|guard,healing|Remove Guard or focus another target.
A Little Later|2|own-pending-event|Move it one space later, maximum +4 rounds. Announce the new time.|fate-schedule|Pressure before it resolves.
Clear Reminder|2|none|Draw 1 personal-deck card. If you recovered a discard card earlier this turn, restore 2 hearts.|draw,healing|Pressure recovery or reverse Win.
Return to the Plan|3|own-discard-spell|Return a spell other than this card to hand; its cost stays unchanged.|recursion|Pressure the recovery turn.
Marked Revisit|3|none|Rewind Fate one space. Only marked repeatable player effects may fire again; permanently skipped environmental occurrences stay skipped.|fate-repeat,fate-move|Expire the space or exploit its public path.
Tomorrow's Return|3|own-discard-creature|At +1 round, return that chosen creature to hand if still in your discard.|fate-schedule,recursion|Move the card, apply pressure or skip.
Stored Resolve|4|none|At +2 rounds, your creatures present then gain 1 attack and 1 maximum health, and heal 1. One-shot.|fate-schedule,buff|Trade the board or skip the occurrence.
One More Chance|5|own-discard-creature|Return it to hand and reduce its next play cost by 2, minimum 0. Each creature may receive this discount once per match.|recursion,cost|Race before replay or remove its new body.
`, spellRarities);
add('reason', 'axiom', `
Stable Premises|1|healing|Each player's Guard creatures heal 1 at the start of their controller's turn.|axiom,healing|Replace the rule or remove Guard.
One Clear Case|1|draw|A personal draw takes 1 card and lets its player inspect the next without changing it.|axiom,inspection|Replace the draw rule.
Measured Dispute|1|combat|Effective attack above 4 counts as 4 in creature fights, for damage and combat comparison.|axiom,combat|Use several medium creatures.
Burden of Proof|2|cost|Each player's first spell each turn costs 1 less, minimum 0; later spells cost 1 more.|axiom,cost|Force an awkward spell sequence.
Complete Argument|2|victory|Win by enemy hero reaching 0, or by ending your own turn with 3 Reason creatures and 6 cards in hand.|axiom,alt-win|Reduce the board or hand, or replace Win.
Long View|3|fate-delay|New effects from either player are scheduled 1 round later, maximum +4 rounds. Announced events do not move.|axiom,fate-schedule|Replace before scheduling.
`, axiomRarities);
add('emotion', 'axiom', `
Shared Nerves|1|damage|Each creature attack on a hero deals at most 2 damage.|axiom|Attack repeatedly or use spells.
Brave Arrivals|1|arrival|New creatures may attack creatures immediately; only Swift permits hero attacks on arrival.|axiom|Protect important creatures.
Small Comforts|1|healing|At each turn's start, if that player has fewer hearts, restore 1 to their hero.|axiom,healing|Replace the rule or race its healing.
Price of Passion|2|cost|Once per turn, each player may pay 1 heart to reduce a spell's cost by 1. Heart loss obeys Win.|axiom,self-damage|Change Win or force risky spending.
Shared Vulnerability|2|victory|Win by enemy hero reaching 0, or by ending your own turn at exactly 1 heart with 3 Emotion creatures.|axiom,alt-win|Change hearts, remove a creature or replace Win.
Rising Tension|3|fate-impact|Each scheduled effect damaging a hero deals 1 more damage, for both players and once per effect.|axiom,fate-schedule|Skip the occurrence or replace the rule.
`, axiomRarities);
add('perception', 'axiom', `
Open Evidence|1|inspection|Reveal the name of every Axiom drawn from the shared deck; personal draws stay private.|axiom,inspection|Use personal draws or play the revealed rule promptly.
Visible Weakness|1|combat|In creature fights, the strong-matchup bonus remains +1 but weakness reduces effective attack by 2 instead of 1, keeping the agreed minimum.|axiom,combat|Choose neutral matchups or replace the rule.
Careful Aim|1|damage|Each player's first damage spell each turn deals 1 more damage to a damaged creature.|axiom,damage|Heal or protect damaged targets.
Shared Horizon|2|inspection|Both players may inspect the top card of each personal deck; the cards stay there.|axiom,inspection|Draw or reorder the exposed card.
Observed Pattern|2|victory|Win by enemy hero reaching 0, or by ending your own turn with 3 Perception creatures and no damaged friendly creatures.|axiom,alt-win|Damage or remove a creature, or replace Win.
Clear Timetable|3|fate-capacity|Each player may hold one additional pending player-created event. Environmental events use no player slots.|axiom,fate-schedule|Skip or cancel the highest-impact event.
`, axiomRarities);
add('language', 'axiom', `
Names Matter|1|colour|A colourless creature gains 1 maximum health while this rule is active; remove that maximum-health increase on replacement or reset.|axiom|Use damage or restore its original colour.
One Speaker|1|attacks|Each player may attack with at most 2 distinct creatures per turn; repeated attacks still obey creature limits.|axiom|Use two strong attackers or replace the limit.
Clear Definitions|1|abilities|Each player's first silence effect each turn also heals its target by 1 after silence.|axiom,control|Use damage on nearly defeated targets.
Open Debate|2|draw|Playing an Axiom from hand draws its player 1 personal-deck card, once per turn. Fate flips do not count.|axiom,draw|Pressure the rule-playing turn.
Consensus|2|victory|Win by enemy hero reaching 0, or by ending your own turn with 3 Language creatures while 3 different Axiom categories are active.|axiom,alt-win|Remove a creature, reset rules or replace Win.
Binding Words|3|fate-impact|Scheduled buffs for either player last until the recipient controller's next turn ends instead of this turn's end; one-shot resolution time does not change.|axiom,fate-schedule|Silence, trade or skip the buff.
`, axiomRarities);
add('imagination', 'axiom', `
Room for Ideas|1|arrival|Each player's first colourless token each turn may attack creatures immediately, not heroes.|axiom,token|Use durable defenders.
Different Shapes|1|combat|In a fight, matching printed attack values reduce each fighter's damage by 1, minimum 0, after matchup calculation.|axiom,combat|Use varied printed attacks.
Light Materials|1|cost|Each player's first token-summoning spell each turn costs 1 less, minimum 0.|axiom,token,cost|Contest the tokens before the next spell.
Mixed Colours|2|power|A creature gets 1 extra attack if its controller also has creatures of at least 2 other colours.|axiom|Remove a supporting colour.
Living Possibilities|2|victory|Win by enemy hero reaching 0, or by ending your own turn with 2 Imagination creatures and 4 colourless tokens.|axiom,alt-win|Clear tokens or replace Win.
Changed Horizons|3|fate-delay|Each player may schedule a new effect one space later than its card says, up to +4 rounds. Its chosen time is public and fixed.|axiom,fate-schedule|Plan around the published node.
`, axiomRarities);
add('memory', 'axiom', `
Small Reminders|1|healing|Recovering a discard card heals that player's hero by 1, at most once per turn.|axiom,recursion|Pressure directly or reverse Win.
Keep the Order|1|draw|Personal draws are normal; draw-selection effects inspect one fewer card, minimum one.|axiom,inspection|Use raw draw or replace the rule.
Patient Recovery|1|defeat|The first creature defeated on each player's own turn goes to its owner's deck bottom instead of discard. Other defeats are unchanged.|axiom,recursion|Defeat it on the other player's turn.
Written History|2|fate-capacity|Each player may retain one more marked repeatable space under its original elapsed-round expiry. No one-shot or environment becomes repeatable.|axiom,fate-repeat|Wait out expiry or replace the rule.
Recovered Story|2|victory|Win by enemy hero reaching 0, or by ending your own turn with 3 Memory creatures after recovering 2 distinct discard cards that turn.|axiom,alt-win|Remove the board or deny recovery targets.
No Forgotten Debts|3|exhaustion|Future exhaustion steps increase by 2 rather than 1 for both players. Damage already taken is unchanged.|axiom,exhaustion|Restore a draw source, change Win or replace the rule.
`, axiomRarities);
add('generic', 'spell', `
Clean Cut|1|enemy-creature|Deal 1 damage. If the target is a colourless token, deal 2 instead.|damage|Use non-token bodies.
Small Patch|1|friendly-creature|Heal it by 2 without changing maximum health.|healing|Defeat it in one hit.
Quick Study|2|none|Draw 1 personal-deck card; inspect the next without changing it.|draw,inspection|Pressure the slow draw turn.
Simple Cover|1|friendly-creature|Give Guard until your next turn starts.|guard|Remove Guard or wait out the effect.
Pocket Plan|1|none|Inspect the top unreserved shared Axiom. You may put it on the bottom; reserved events are untouched.|inspection,axiom|Draw or reorder the rule before the next shared draw.
Spare Spark|0|none|Gain 1 energy this turn, capped at 10. This still uses the normal activation budget.|energy|Force inefficient sequencing.
Settle Down|1|enemy-creature|Reduce its attack by 1 until its controller's next turn ends, minimum 0.|control|Use another attacker.
Fair Trade|2|none|Each player draws 1 personal-deck card, caster first; normal hand limits apply.|draw|Benefit from the shared draw.
Follow Through|2|enemy-creature|Deal 2 damage if already damaged, otherwise 1.|damage|Heal before it is cast.
Warm Blanket|2|friendly-creature|Heal it by 2 and give Shield until your next turn starts.|healing,shield|Remove Shield or strike twice.
Pause One Beat|2|none|At +1 round, restore 2 hearts to your hero. One-shot.|fate-schedule,healing|Skip the occurrence or exploit reversed Win.
Take Stock|1|none|Draw 1 personal-deck card. If that deck is empty, restore 1 heart instead; no extra exhaustion step.|draw,healing|Maintain pressure through the small benefit.
Balanced Exchange|3|own-hand-card|Put one chosen personal card from hand on deck bottom, then draw 2 personal-deck cards.|draw|Pressure its card-quality turn.
Forked Reply|3|two-enemy-creatures|Deal 1 damage to two distinct creatures, then restore 1 heart to your hero. One target is legal if no second exists.|damage,healing|Use large bodies or Shield.
Repair the Shield|2|friendly-creature|Remove its consumed-Shield marker, give a fresh Shield and heal it by 1.|shield,healing|Remove keywords or use repeated damage.
Quiet Reset|3|active-axiom-category|Restore one chosen active category to basics without drawing or moving Fate.|axiom|Hold a replacement rule.
Scheduled Shelter|3|none|At +1 round, your creatures present then gain Shield. One-shot.|fate-schedule,shield|Trade them before resolution or skip.
Recorded Choice|2|none|If you have a pending own event, draw 1 personal-deck card; otherwise inspect the top 2 personal cards and bottom one.|inspection,draw,fate-schedule|Pressure setup before the pending plan exists.
Board Sweep|5|none|Deal 3 damage to every creature as one effect. Shields and normal prevention apply.|damage|Use high health or Shield.
One Last Draw|3|none|Your hero loses 2 hearts; draw 2 personal-deck cards.|self-damage,draw|Change Win or exploit low hearts.
Cancel the Appointment|3|player-created-pending-event|Cancel one chosen player-created one-shot event. It is spent and cannot fire; environmental occurrences are not legal targets.|fate-schedule|Keep a second plan or protect the important occurrence.
Steal a Beat|4|enemy-pending-event|Move one enemy player-created event one space later, maximum +4 rounds. Draw 1 personal-deck card if it moved; announce its new time.|fate-schedule,draw|Adapt to the known delay or use immediate effects.
Common Ground|5|none|Remove temporary buffs and debuffs from both boards. Each surviving creature gains 1 maximum health and heals 1; both players draw 1 personal card.|control,healing,draw|Use permanent stats or play after the reset.
The Last Page|6|none|Reset all active Axiom categories to basics, return one own defeated creature costing 4 or less to hand, and draw 2 personal-deck cards. Announced events keep their identities and timing.|axiom,recursion,draw|Keep replacement rules and pressure the expensive recovery turn.
`, [...Array(12).fill('common'), ...Array(6).fill('uncommon'), ...Array(4).fill('rare'), 'mythic', 'legendary']);
add('generic', 'axiom', `
Careful Hands|1|hand|At the end of each player's turn, keep at most 5 cards; discard the oldest excess cards.|axiom,hand|Play cards before the limit checks.
Small Armies|1|board-capacity|A player controlling 5 or more creatures cannot play or summon another. Existing creatures remain.|axiom|Remove a body or replace the cap.
Fair Rest|1|healing|At the start of each player's turn, heal their most damaged creature by 1; break ties by oldest arrival.|axiom,healing|Defeat threats in one hit.
Unhurried Arrival|1|arrival|New non-Swift creatures cannot activate until their controller's next turn, even if another effect readies their attacks.|axiom|Use Swift or wait a turn.
One Tool at a Time|1|abilities|Each player may activate at most one creature ability per turn; hero powers and card plays still follow their normal budgets.|axiom|Choose the key ability or replace the rule.
Gentle Growth|1|growth|A creature surviving a fight at 1 health gains 1 maximum health and heals 1; at most once per creature per round.|axiom,combat|Finish wounded creatures before they fight again.
Public Rules|1|inspection|After an Axiom enters either hand, its name stays public until played or discarded. Personal cards stay private.|axiom,inspection|Use personal cards or promptly play the revealed rule.
Modest Claims|1|damage|A single spell effect deals at most 3 damage to each creature; hero damage is unchanged.|axiom|Use several spells or combat.
Shared Supplies|2|draw|Once per turn, playing a creature costing 5 or more draws its controller 1 personal card.|axiom,draw|Pressure before expensive plays.
Give and Take|2|healing|An original hero-healing effect also heals the other hero by that amount once; the copy creates no further copies.|axiom,healing|Exploit shared healing under the current Win rule.
Conservative Plans|2|fate-delay|New player-created scheduled effects have minimum +2 rounds; already announced times and environments do not change.|axiom,fate-schedule|Replace before scheduling or use immediate spells.
No Shortcuts|2|cost|Neither player's spells may cost less than 1 energy, after discounts; printed zero-cost spells also cost 1.|axiom,cost|Use efficient creatures or replace the rule.
Open Slots|2|board-capacity|Playing a new creature requires a free slot beyond it: a player at one below the normal board limit cannot add another. Existing boards remain.|axiom|Trade before playing or replace the limit.
Prepared Response|2|abilities|Each player's first creature activation each turn costs 1 less, minimum 0; later creature activations cost 1 more.|axiom,cost|Choose activation order carefully.
Fragile Shields|3|keywords|A newly granted Shield expires at its controller's next turn start unless consumed first. Printed arrival Shield follows the same expiry.|axiom,shield|Wait out protection or replace the rule.
Balanced Accounts|3|exhaustion|Exhaustion counters increase normally, but each normal draw's exhaustion damage is capped at 3 for both players.|axiom,exhaustion|Use attacks or replace the cap; self-zero strategies may still benefit.
One Fair Fight|3|combat|The first creature fight each turn ignores auras on both fighters for that fight only; permanent buffs remain.|axiom,combat|Make the first fight with a creature not relying on an aura.
The Common Good|4|victory|Win by enemy hero reaching 0, or by ending your own turn with all 6 creature colours on your board and at least 4 hero hearts.|axiom,alt-win|Remove one colour, reduce hearts or replace Win.
`, [...Array(8).fill('common'), ...Array(6).fill('uncommon'), ...Array(3).fill('rare'), 'mythic']);

reviewCatalogue(cards);
const expectedRarity = {common:92, uncommon:60, rare:37, mythic:14, legendary:7};
const counts = key => cards.reduce((out, c) => (out[c[key]] = (out[c[key]] || 0) + 1, out), {});
function assert(ok, why) { if (!ok) throw new Error(why); }
assert(cards.length === 210, 'Expected exactly 210 authored concepts');
assert(new Set(cards.map(c => c.id)).size === 210, 'Duplicate draft IDs');
assert(new Set(cards.map(c => c.name)).size === 210, 'Duplicate names');
assert(new Set(cards.map(c => c.text)).size === 210, 'Every revised concept needs distinct effect text; semantic review remains separate');
for (const [rarity, count] of Object.entries(expectedRarity)) assert(counts('rarity')[rarity] === count, 'Rarity count: ' + rarity);
for (const affinity of Object.keys(themes)) assert(counts('affinity')[affinity] === (affinity === 'generic' ? 42 : 28), 'Affinity count: ' + affinity);
assert(cards.every(c => c.text && c.counterplay && c.strategy && c.tags.every(Boolean) && Number.isInteger(c.cost) && c.cost >= 0), 'Missing design information');
assert(cards.filter(c => c.kind === 'creature').every(c => c.health > 0 && c.attack >= 0), 'Invalid creature stats');
const gateTags = { 'fate-schedule':[118,119], 'fate-move':[118,120], 'fate-repeat':[118,120], 'alt-win':['victory-policy'], 'exhaustion':[117], 'token':['token-order'], 'combat':[127], 'spell-reaction':['spell-reaction-policy'] };
for (const card of cards) {
  card.gates = [109, ...new Set(card.tags.flatMap(t => gateTags[t] || []))];
  card.art = card.kind === 'creature' ? 'creature/' + card.id + '/idle' : 'shared frame and mechanic icon; unique illustration optional';
}
// Source assignments are draft plot-design suggestions; story-only exclusion is approved.
const storyRewards = {
  'Inference Heron':['b-town-hall','Ch2 truth/claim resolution'],
  'Complete Argument':['gate','Ch1 completed Gate challenge'],
  'Heartfire Hawk':['t-tribunal','Ch3 confronted public claims'],
  'Shared Vulnerability':['troll-bridge','Ch1 completed confrontation, either supported outcome'],
  'Exposure Eagle':['b-clock-tower','Ch2 observation at the clock tower'],
  'Observed Pattern':['t-tribunal','Ch3 completed evidence-based verdict'],
  'Contract Coyote':['t-archive','Ch3 recovered archival evidence'],
  'Consensus':['t-tribunal','Ch3 completed verdict, either supported outcome'],
  'Cloud Castle Crab':['k-sorting','Ch4 completed Sorting Room story'],
  'Living Possibilities':['fair-finale','Completed homecoming, either supported story outcome'],
  'Second Chance Salamander':['b-clock-tower','Ch2 completed time-related story'],
  'Recovered Story':['fair-finale','Completed homecoming and the recovered account'],
  'Public Rules':['fair-gate','Completed Fair Gate introduction, not merely opening its screen'],
  'Fair Rest':['gate','Ch1 completed Gate and recovery beat'],
  'Quiet Reset':['b-town-hall','Ch2 resolved the Town Hall claims'],
  'Conservative Plans':['b-clock-tower','Ch2 understood the timeline'],
  'The Common Good':['fair-finale','Completed shared homecoming'],
  'The Last Page':['fair-finale','Completed final story, not only a repeatable battle win'],
};
for (const card of cards) {
  const story = storyRewards[card.name];
  card.acquisition = story ? {channel:'story-only', packEligible:false, proposedMilestoneNode:story[0], theme:story[1], assignmentStatus:'draft; verify exact plot completion flag'}
    : {channel:'pack-pool', packEligible:true, releaseStatus:'draft; only enters packs when its implementation is released'};
}
assert(cards.filter(c => !c.acquisition.packEligible).length === 18, 'Story assignment count');
const eligible = cards.filter(c => c.acquisition.packEligible);
const eligibleCounts = key => eligible.reduce((out,c) => (out[c[key]]=(out[c[key]]||0)+1,out),{});
reviewStoryCards(cards);
reviewExpansion2(cards);
reviewExpansion3(cards);
reviewExpansion4(cards);
const catalogue = {version:2, date:'2026-10-12', status:'210 screened concepts; seven foundation-1 cards, eight expansion-2 cards, eight expansion-3 cards, eight expansion-4 cards, eighteen plot-1 story cards, 161 held', reviewed:'2026-10-21',
  counts:{total:cards.length, affinity:counts('affinity'), kind:counts('kind'), rarity:counts('rarity'),
    acquisition:{packPool:eligible.length,storyOnly:cards.length-eligible.length},packRarity:eligibleCounts('rarity')}, cards};
fs.writeFileSync(path.join(dir, 'card-catalogue.json'), JSON.stringify(catalogue, null, 2) + '\n');
let md = '# 210-card creative catalogue\n\nDrafted 12 October; reviewed 21 October 2026. Seven foundation-1, eight expansion-2, eight expansion-3 and eight expansion-4 (#129) and eighteen plot-1 story cards have runtime definitions; the other 161 remain held design proposals. Expansion checks: expansion-2, expansion-3 and expansion-4 acceptance reports. Story policy and checks: story-132 acceptance report. See CONTRACT-AUDIT-123.md and the acceptance report for the exact release, 23 semantic revisions and limits. Costs/stats outside that release remain proposals. This catalogue is additional to the 12-card starter support pack. Costs and stats are first-pass tuning. Each card includes a role and counterplay in the JSON. The redesigned production board (#109) is complete. Per-concept gameplay gates still apply.\n\n## Counts and rules\n\n28 concepts for each of six colours plus 42 generic concepts (20% exactly). Each colour has 12 creatures, 10 spells and 6 themed Axioms. Generic has 24 spells and 18 Axioms. Totals: 72 creatures, 84 spells, 54 Axioms; 92 common, 60 uncommon, 37 rare, 14 mythic and 7 legendary.\n\n**18 are implemented story-only rewards and 192 are eventual pack-pool candidates. Story-only cards never enter packs, even after their story is completed.** Story assignments now use the #132 completed-plot proof and two-normal-copy policy; other pool numbers remain proposals. Overall catalogue generic coverage remains exactly 20%; this does not assert a 20% generic pack-drop rate. See STORY-REWARDS.md for the authored unlock assignments and copy/foil proposals.\n\nAxiom affinity is a **theme**, not a new construction quota: these shared rules affect both players, and any player may choose them. Personal colour-spell copies are constrained by matching creature copies in the submitted deck, never by a live-board creature. Tokens are colourless, uncollectible battle objects unless a card explicitly says otherwise. No token expands collection quantities or deck copy quotas.\n\nTiming uses full rounds after both players act. Scheduled effects are one-shot unless explicitly marked repeatable. Player replay/expiry/capacity, temporary-control return, simultaneous defeats/goal ties, alternative Win routes and token-order rules remain design gates, not silently settled mechanics. Environmental occurrences skipped by a leap are permanently skipped; rewind cannot resurrect them. Cards that inspect deck cards never inspect or reorder already reserved Fate cards.\n\nThe minimum-one matchup proposal does not force prevented damage through Shield; damage prevention and explicit combat rules may produce zero. Generated temporary stat effects must use the existing authoritative stat semantics and show their expiry. Hooks such as once per round/once per match must use persistent battle state, not UI callbacks.\n\n## Strategy matrix\n\n| Colour | Main plans | Win pressure | Counterplay |\n|---|---|---|---|\n| Reason | Guard, precise damage, hand selection | Exact trades or Complete Argument | Remove support; contest hand size; replace Win |\n| Emotion | Self-damage, aggressive trades, shared hearts | Attack pressure or self-zero when that Axiom is active | Change Win, heal or remove attackers |\n| Perception | Inspect, expose protection, move announced plans | Healthy board or public Fate advantage | Apply wounds; disrupt plans |\n| Language | Label, silence, support, play rules | Rule-and-board Consensus | Remove board; reset rule categories |\n| Imagination | Swap stats, diversity, colourless tokens | Wide board or Living Possibilities | Area damage, silence, trade supporting colours |\n| Memory | Recover, delay, bounded repeatable spaces | Recovered Story or exhaustion under changed Win | Race recovery; expire/cancel spaces |\n| Generic | Basic defence, cycling, shared constraints | Supports any strategy | Every shared Axiom helps the opponent too |\n\n## Card entries\n';
for (const affinity of Object.keys(themes)) {
  md += '\n### ' + affinity + '\n\n' + themes[affinity] + '.\n\n| Card / ID | Kind / rarity / cost | Stats or category / target | Proposed text | Counterplay | Source |\n|---|---|---|---|---|---|\n';
  for (const c of cards.filter(x => x.affinity === affinity)) {
    md += '| ' + c.name + ' · `' + c.id + '` | ' + c.kind + ' / ' + c.rarity + ' / ' + c.cost + ' | ' + (c.kind === 'creature' ? c.attack + '/' + c.health : c.category || c.target) + ' | ' + c.text + ' | ' + c.counterplay + ' | ' + c.acquisition.channel + ' |\n';
  }
}
md += '\n## Release sequence\n\nUse small playtested packs, never enable all 210 at once. Begin with simple common board/heal/draw/control cards after the existing starter-pack slice. Then introduce uncommons, bounded tokens/transformations, scheduled one-shots, contextual Axiom families and only then alternate goals, repeatable spaces and mythic/legendary engines. Existing #101 owns broad modifier rules. Thematic overlap is deliberate; exact stat-only duplicates should be merged during review rather than counted as strategic breadth. Creature names are working mechanical labels. The teacher reaffirmed cute-horror public-persona satire: assign inspiration, pun, signature prop and harmless joke in ROSTER.md before art/release. Generic helper exceptions require documented builder judgement; do not mass-generate seventy-two generic animals. Follow ART-BIBLE.md and the approved style board.\n\nRun catalogue-source.mjs to regenerate these two catalogue files and arithmetic checks. New runtime card definitions belong in later implementation tickets.\n';
fs.writeFileSync(path.join(dir, 'CARD-CATALOGUE.md'), md);
console.log(JSON.stringify(catalogue.counts));
