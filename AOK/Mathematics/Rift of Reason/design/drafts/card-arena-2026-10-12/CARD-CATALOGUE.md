# 210-card creative catalogue

12 October 2026. These are **authored design proposals**, not implemented effects, approved balance or completed artwork. This catalogue is additional to the 12-card starter support pack. Costs and stats are first-pass tuning. Each card includes a role and counterplay in the JSON. All release work waits for the redesigned board (#109).

## Counts and rules

28 concepts for each of six colours plus 42 generic concepts (20% exactly). Each colour has 12 creatures, 10 spells and 6 themed Axioms. Generic has 24 spells and 18 Axioms. Totals: 72 creatures, 84 spells, 54 Axioms; 92 common, 60 uncommon, 37 rare, 14 mythic and 7 legendary.

**18 are proposed story-only rewards and 192 are proposed pack-pool cards. Story-only cards never enter packs, even after their story is completed.** Source assignment/numbers are proposals; the two-channel separation is approved. Overall catalogue generic coverage remains exactly 20%; this does not assert a 20% generic pack-drop rate. See STORY-REWARDS.md for the authored unlock assignments and copy/foil proposals.

Axiom affinity is a **theme**, not a new construction quota: these shared rules affect both players, and any player may choose them. Personal colour-spell copies are constrained by matching creature copies in the submitted deck, never by a live-board creature. Tokens are colourless, uncollectible battle objects unless a card explicitly says otherwise. No token expands collection quantities or deck copy quotas.

Timing uses full rounds after both players act. Scheduled effects are one-shot unless explicitly marked repeatable. Player replay/expiry/capacity, temporary-control return, simultaneous defeats/goal ties, alternative Win routes and token-order rules remain design gates, not silently settled mechanics. Environmental occurrences skipped by a leap are permanently skipped; rewind cannot resurrect them. Cards that inspect deck cards never inspect or reorder already reserved Fate cards.

The minimum-one matchup proposal does not force prevented damage through Shield; damage prevention and explicit combat rules may produce zero. Generated temporary stat effects must use the existing authoritative stat semantics and show their expiry. Hooks such as once per round/once per match must use persistent battle state, not UI callbacks.

## Strategy matrix

| Colour | Main plans | Win pressure | Counterplay |
|---|---|---|---|
| Reason | Guard, precise damage, hand selection | Exact trades or Complete Argument | Remove support; contest hand size; replace Win |
| Emotion | Self-damage, aggressive trades, shared hearts | Attack pressure or self-zero when that Axiom is active | Change Win, heal or remove attackers |
| Perception | Inspect, expose protection, move announced plans | Healthy board or public Fate advantage | Apply wounds; disrupt plans |
| Language | Label, silence, support, play rules | Rule-and-board Consensus | Remove board; reset rule categories |
| Imagination | Swap stats, diversity, colourless tokens | Wide board or Living Possibilities | Area damage, silence, trade supporting colours |
| Memory | Recover, delay, bounded repeatable spaces | Recovered Story or exhaustion under changed Win | Race recovery; expire/cancel spaces |
| Generic | Basic defence, cycling, shared constraints | Supports any strategy | Every shared Axiom helps the opponent too |

## Card entries

### reason

Careful exchanges, defensive control and public proof goals.

| Card / ID | Kind / rarity / cost | Stats or category / target | Proposed text | Counterplay | Source |
|---|---|---|---|---|---|
| Premise Pigeon · `reason-premise-pigeon` | creature / common / 1 | 1/2 | No ability. | Trade with a larger creature. | pack-pool |
| Axiom Ant · `reason-axiom-ant` | creature / common / 2 | 1/3 | Guard. | Remove Guard or use a spell. | pack-pool |
| Proof Beetle · `reason-proof-beetle` | creature / common / 2 | 2/2 | Entrance: another friendly creature gains 1 maximum health and heals 1. | Remove the supported creature. | pack-pool |
| Counterexample Crow · `reason-counterexample-crow` | creature / common / 3 | 2/2 | Entrance: deal 1 damage to an enemy creature. | Shield protects a small target. | pack-pool |
| Parity Panda · `reason-parity-panda` | creature / uncommon / 3 | 2/4 | After surviving a fight with equal effective attack, heal this by 1. | Attack with unequal power. | pack-pool |
| Induction Ibex · `reason-induction-ibex` | creature / uncommon / 3 | 2/3 | Once per turn, after you cast a Reason spell, this gains 1 attack until your next turn starts. | Remove it before the spell sequence. | pack-pool |
| Logic Lynx · `reason-logic-lynx` | creature / uncommon / 4 | 3/4 | Entrance: look at the top 2 personal-deck cards; keep their order or swap them. | Pressure its setup turn. | pack-pool |
| Guardrail Goat · `reason-guardrail-goat` | creature / uncommon / 4 | 2/5 | Guard. The first spell damage this takes each round is reduced by 1. | Use combat or multiple small spells. | pack-pool |
| Diagonal Deer · `reason-diagonal-deer` | creature / rare / 4 | 3/3 | Entrance: silence an enemy creature whose current attack equals this creature's attack. | Change the target's attack first. | pack-pool |
| Inference Heron · `reason-inference-heron` | creature / rare / 5 | 3/5 | Once per turn, after another friendly creature survives a fight at 1 health, draw 1 personal-deck card. | Finish damaged creatures before they fight. | story-only |
| Boundary Bear · `reason-boundary-bear` | creature / mythic / 6 | 4/6 | Guard. While this is ready, your hero takes at most 2 damage from each creature attack. | Disable it, use spells or attack repeatedly. | pack-pool |
| Theorem Tortoise · `reason-theorem-tortoise` | creature / legendary / 7 | 4/7 | At your turn's end, if you cast 2 Reason spells, schedule at +1 round: your creatures present then gain 1 maximum health and heal 1. At most one event from this creature pending. | Remove the board or skip the announced event. | pack-pool |
| Check the Premise · `reason-check-the-premise` | spell / common / 1 | enemy-creature | Deal 1 damage, or 2 if the target has Guard. | Use a non-Guard threat. | pack-pool |
| Small Lemma · `reason-small-lemma` | spell / common / 1 | friendly-creature | Give 1 maximum health and heal 1. | Use removal instead of chip damage. | pack-pool |
| Work It Out · `reason-work-it-out` | spell / common / 2 | none | Inspect the top 3 personal-deck cards; draw one and bottom the others in their original relative order. | Pressure the selection turn. | pack-pool |
| Exact Answer · `reason-exact-answer` | spell / common / 2 | enemy-creature | Deal damage equal to its current attack, capped at 3. | Use low attack and high health. | pack-pool |
| Provisional Proof · `reason-provisional-proof` | spell / common / 2 | friendly-creature | Give Shield. Draw 1 personal-deck card only if it already had Guard when cast. | Remove its keywords. | pack-pool |
| Divide the Case · `reason-divide-the-case` | spell / uncommon / 3 | two-enemy-creatures | Deal 2 damage to each of two distinct chosen creatures. If only one legal target exists, deal 2 to it. | Play one large threat. | pack-pool |
| Wait for Evidence · `reason-wait-for-evidence` | spell / uncommon / 2 | friendly-creature | At +1 round, fully heal the chosen creature if it is still on your board. | Bounce, remove or skip it before resolution. | pack-pool |
| Narrow Conclusion · `reason-narrow-conclusion` | spell / uncommon / 3 | enemy-creature | Silence it; its attack becomes 2 until its controller's next turn ends. | Use a different threat or restore attack. | pack-pool |
| Proof by Cases · `reason-proof-by-cases` | spell / rare / 4 | choice | Choose: deal 4 damage to an enemy creature, or give two friendly creatures 2 maximum health and heal each by 2. | Force the less useful choice. | pack-pool |
| Finish the Argument · `reason-finish-the-argument` | spell / rare / 5 | enemy-creature | Defeat a creature with 2 health or less. If defeated, put one Reason spell from your discard on the bottom of your deck. | Heal beyond the threshold. | pack-pool |
| Stable Premises · `reason-stable-premises` | axiom / common / 1 | healing | Each player's Guard creatures heal 1 at the start of their controller's turn. | Replace the rule or remove Guard. | pack-pool |
| One Clear Case · `reason-one-clear-case` | axiom / common / 1 | draw | A personal draw takes 1 card and lets its player inspect the next without changing it. | Replace the draw rule. | pack-pool |
| Measured Dispute · `reason-measured-dispute` | axiom / common / 1 | combat | Effective attack above 4 counts as 4 in creature fights, for damage and combat comparison. | Use several medium creatures. | pack-pool |
| Burden of Proof · `reason-burden-of-proof` | axiom / uncommon / 2 | cost | Each player's first spell each turn costs 1 less, minimum 0; later spells cost 1 more. | Force an awkward spell sequence. | pack-pool |
| Complete Argument · `reason-complete-argument` | axiom / rare / 2 | victory | Win by enemy hero reaching 0, or by ending your own turn with 3 Reason creatures and 6 cards in hand. | Reduce the board or hand, or replace Win. | story-only |
| Long View · `reason-long-view` | axiom / mythic / 3 | fate-delay | New effects from either player are scheduled 1 round later, maximum +4 rounds. Announced events do not move. | Replace before scheduling. | pack-pool |

### emotion

Risk, pressure, self-damage and changed victory conditions.

| Card / ID | Kind / rarity / cost | Stats or category / target | Proposed text | Counterplay | Source |
|---|---|---|---|---|---|
| Pulse Pup · `emotion-pulse-pup` | creature / common / 1 | 2/1 | No ability. | Trade a small creature. | pack-pool |
| Courage Cub · `emotion-courage-cub` | creature / common / 2 | 2/2 | Entrance: restore 1 heart to your hero. | Keep pressure on its board. | pack-pool |
| Spite Sprite · `emotion-spite-sprite` | creature / common / 2 | 1/3 | Once per turn, after taking damage and surviving, this gains 1 attack until your next turn starts. | Defeat it in one hit. | pack-pool |
| Cheer Chick · `emotion-cheer-chick` | creature / common / 2 | 1/2 | Entrance: another friendly creature gains 1 attack this turn. | Remove or block the supported attacker. | pack-pool |
| Temper Tiger · `emotion-temper-tiger` | creature / uncommon / 3 | 3/2 | Entrance: your hero loses 1 heart. | Counterattack the fragile body. | pack-pool |
| Bond Badger · `emotion-bond-badger` | creature / uncommon / 3 | 2/4 | Once per turn, after another friendly creature is defeated, restore 1 heart to your hero. | Remove this first. | pack-pool |
| Grudge Goose · `emotion-grudge-goose` | creature / uncommon / 3 | 2/3 | Last Word: deal 1 damage to the enemy hero. | Silence it or change Win. | pack-pool |
| Resolve Ram · `emotion-resolve-ram` | creature / uncommon / 4 | 2/5 | Guard. If your hero has 4 hearts or less, this has 1 more attack. | Use removal instead of small trades. | pack-pool |
| Outrage Ox · `emotion-outrage-ox` | creature / rare / 4 | 4/3 | Swift. This cannot attack a hero on the turn it arrives. | Use a high-health defender. | pack-pool |
| Heartfire Hawk · `emotion-heartfire-hawk` | creature / rare / 5 | 3/4 | Once per turn, after your hero loses hearts during your turn, another friendly creature gains 1 attack this turn. | Remove its supporting attackers. | story-only |
| Stormheart Serpent · `emotion-stormheart-serpent` | creature / mythic / 6 | 5/5 | Entrance: choose to lose up to 2 of your own hearts; deal that much damage to a chosen enemy creature. | Exploit low hearts or deny small kill targets. | pack-pool |
| Empathy Elephant · `emotion-empathy-elephant` | creature / legendary / 7 | 4/8 | At your turn's end, if both heroes lost hearts this turn, restore 2 hearts to both and draw 1 personal-deck card. | Avoid enabling both losses or replace Win. | pack-pool |
| Quick Courage · `emotion-quick-courage` | spell / common / 1 | friendly-creature | Give 2 attack until this turn ends. | Block with Guard or prevent the hit. | pack-pool |
| Honest Hurt · `emotion-honest-hurt` | spell / common / 1 | none | Your hero loses 1 heart. Draw 1 personal-deck card. | Change Win or pressure remaining hearts. | pack-pool |
| Share the Feeling · `emotion-share-the-feeling` | spell / common / 2 | friendly-creature | Deal 1 damage to it; if it survives, give 2 attack until your next turn starts. | Remove it before it attacks. | pack-pool |
| Cool Down · `emotion-cool-down` | spell / common / 1 | enemy-creature | Reduce its attack by 2 until its controller's next turn ends, minimum 0. | Wait or use another attacker. | pack-pool |
| Careful Cheer · `emotion-careful-cheer` | spell / common / 2 | none | Restore 2 hearts to your hero, or 3 if you control 2 or fewer creatures. | Develop a larger board. | pack-pool |
| Cost of Courage · `emotion-cost-of-courage` | spell / uncommon / 2 | friendly-creature | Your hero loses 2 hearts; give the target 2 maximum health and heal it by 2. | Silence or remove the supported target. | pack-pool |
| Tomorrow's Rally · `emotion-tomorrow-s-rally` | spell / uncommon / 3 | none | At +1 round, your creatures present then gain 1 attack until your next turn ends. | Trade the board or skip the node. | pack-pool |
| Shared Pain · `emotion-shared-pain` | spell / uncommon / 3 | none | Deal 2 damage to both heroes as one simultaneous effect. | Change Win, heal or race the threshold. | pack-pool |
| Outburst · `emotion-outburst` | spell / rare / 4 | enemy-creature | Deal 5 damage to it. Your hero loses 2 hearts. | Exploit the caster's low hearts. | pack-pool |
| Second Heartbeat · `emotion-second-heartbeat` | spell / rare / 4 | none | Restore your hero to 5 hearts if below 5; otherwise draw 2 personal-deck cards. | Maintain pressure or exploit reversed Win. | pack-pool |
| Shared Nerves · `emotion-shared-nerves` | axiom / common / 1 | damage | Each creature attack on a hero deals at most 2 damage. | Attack repeatedly or use spells. | pack-pool |
| Brave Arrivals · `emotion-brave-arrivals` | axiom / common / 1 | arrival | New creatures may attack creatures immediately; only Swift permits hero attacks on arrival. | Protect important creatures. | pack-pool |
| Small Comforts · `emotion-small-comforts` | axiom / common / 1 | healing | At each turn's start, if that player has fewer hearts, restore 1 to their hero. | Replace the rule or race its healing. | pack-pool |
| Price of Passion · `emotion-price-of-passion` | axiom / uncommon / 2 | cost | Once per turn, each player may pay 1 heart to reduce a spell's cost by 1. Heart loss obeys Win. | Change Win or force risky spending. | pack-pool |
| Shared Vulnerability · `emotion-shared-vulnerability` | axiom / rare / 2 | victory | Win by enemy hero reaching 0, or by ending your own turn at exactly 1 heart with 3 Emotion creatures. | Change hearts, remove a creature or replace Win. | story-only |
| Rising Tension · `emotion-rising-tension` | axiom / mythic / 3 | fate-impact | Each scheduled effect damaging a hero deals 1 more damage, for both players and once per effect. | Skip the occurrence or replace the rule. | pack-pool |

### perception

Information, exposed targets and visible future plans.

| Card / ID | Kind / rarity / cost | Stats or category / target | Proposed text | Counterplay | Source |
|---|---|---|---|---|---|
| Cue Cricket · `perception-cue-cricket` | creature / common / 1 | 1/2 | Entrance: look at the top card of your personal deck. | Pressure instead of giving planning time. | pack-pool |
| Lens Lynx · `perception-lens-lynx` | creature / common / 2 | 2/2 | Entrance: remove Elusive from one enemy creature until its controller's next turn starts. | Use other keywords or restore Elusive. | pack-pool |
| Focus Falcon · `perception-focus-falcon` | creature / common / 2 | 1/3 | This deals 1 extra combat damage to a creature whose Shield has already been consumed this match. | Refresh Shield or heal the exposed target. | pack-pool |
| Shadow Shrimp · `perception-shadow-shrimp` | creature / common / 2 | 2/1 | Elusive. | Use a spell or remove Elusive. | pack-pool |
| Scout Stoat · `perception-scout-stoat` | creature / uncommon / 3 | 2/3 | Entrance: inspect the top 2 personal-deck cards and put one on the bottom. | Contest its setup turn. | pack-pool |
| Prism Puffin · `perception-prism-puffin` | creature / uncommon / 3 | 2/4 | Entrance: another friendly creature becomes Perception until your next turn starts. | Choose neutral matchups or remove the buff. | pack-pool |
| Pattern Panther · `perception-pattern-panther` | creature / uncommon / 3 | 3/2 | Once per round, after an enemy scheduled occurrence is skipped, draw 1 personal-deck card. | Use immediate effects or protect key occurrences. | pack-pool |
| Signal Seal · `perception-signal-seal` | creature / uncommon / 4 | 2/5 | Guard. Entrance: heal your hero by 1 for each environmental occurrence permanently skipped this match, maximum 3. | Pressure before skips accumulate. | pack-pool |
| Observer Octopus · `perception-observer-octopus` | creature / rare / 4 | 3/4 | Once per turn, after you inspect deck cards without drawing them, another friendly creature gains Shield. | Remove its support before protection arrives. | pack-pool |
| Exposure Eagle · `perception-exposure-eagle` | creature / rare / 5 | 3/5 | Entrance: remove one chosen enemy keyword: Guard, Shield or Elusive. | Stack different defences or restore a keyword. | story-only |
| Horizon Hare · `perception-horizon-hare` | creature / mythic / 6 | 4/5 | Entrance: move one own pending event one space earlier, no sooner than +1 round; announce its new time. | Skip the new node or contest the board. | pack-pool |
| True Sight Stag · `perception-true-sight-stag` | creature / legendary / 7 | 4/7 | Once per round, replace your normal personal draw with inspecting the top 3 cards, drawing one and restoring the others in their original order. | Pressure before the expensive selector arrives. | pack-pool |
| Notice the Crack · `perception-notice-the-crack` | spell / common / 1 | enemy-creature | Deal 1 damage, or 2 if the creature is already damaged. | Heal between exchanges. | pack-pool |
| Read the Room · `perception-read-the-room` | spell / common / 1 | none | See the count and colours, not identities, of enemy hand creatures. Draw 1 personal-deck card. | Change the hand before playing. | pack-pool |
| Expose the Shield · `perception-expose-the-shield` | spell / common / 1 | enemy-creature | Remove Shield. If none was removed, reduce its attack by 1 this turn, minimum 0. | Use other defences. | pack-pool |
| Practical Observation · `perception-practical-observation` | spell / common / 2 | none | Inspect the top 2 unreserved shared Axioms without changing them. Draw 1 personal-deck card. | Draw or reorder unreserved rules before the next choice. | pack-pool |
| Focused Hit · `perception-focused-hit` | spell / common / 2 | enemy-creature | Deal 2 damage, or 3 if it has no keywords. | Keep a keyword or use Shield. | pack-pool |
| Change the Angle · `perception-change-the-angle` | spell / uncommon / 2 | friendly-creature | Choose its colour until your next turn starts; restore its base colour afterward. | Use neutral targets or clear the effect. | pack-pool |
| Mark the Moment · `perception-mark-the-moment` | spell / uncommon / 2 | enemy-creature | At +1 round, deal 3 damage to the chosen creature if still in play. Its controller sees the mark. | Bounce, heal, protect or skip. | pack-pool |
| Follow the Clue · `perception-follow-the-clue` | spell / uncommon / 3 | none | Inspect the top 4 personal-deck cards; draw one creature and one spell if present, then bottom the others in original order. | Pressure the expensive selection turn. | pack-pool |
| Strip the Illusion · `perception-strip-the-illusion` | spell / rare / 4 | enemy-creature | Remove its keywords and temporary buffs. Printed stats, permanent changes and existing damage remain. | Use permanent stats or reapply a keyword. | pack-pool |
| Public Forecast · `perception-public-forecast` | spell / rare / 3 | own-pending-event | Move one own pending event one space earlier or later; earliest +1 round. Announce the new time. | Adapt to or skip the new node. | pack-pool |
| Open Evidence · `perception-open-evidence` | axiom / common / 1 | inspection | Reveal the name of every Axiom drawn from the shared deck; personal draws stay private. | Use personal draws or play the revealed rule promptly. | pack-pool |
| Visible Weakness · `perception-visible-weakness` | axiom / common / 1 | combat | In creature fights, the strong-matchup bonus remains +1 but weakness reduces effective attack by 2 instead of 1, keeping the agreed minimum. | Choose neutral matchups or replace the rule. | pack-pool |
| Careful Aim · `perception-careful-aim` | axiom / common / 1 | damage | Each player's first damage spell each turn deals 1 more damage to a damaged creature. | Heal or protect damaged targets. | pack-pool |
| Shared Horizon · `perception-shared-horizon` | axiom / uncommon / 2 | inspection | Both players may inspect the top card of each personal deck; the cards stay there. | Draw or reorder the exposed card. | pack-pool |
| Observed Pattern · `perception-observed-pattern` | axiom / rare / 2 | victory | Win by enemy hero reaching 0, or by ending your own turn with 3 Perception creatures and no damaged friendly creatures. | Damage or remove a creature, or replace Win. | story-only |
| Clear Timetable · `perception-clear-timetable` | axiom / mythic / 3 | fate-capacity | Each player may hold one additional pending player-created event. Environmental events use no player slots. | Skip or cancel the highest-impact event. | pack-pool |

### language

Labels, support, rule changes and temporary control.

| Card / ID | Kind / rarity / cost | Stats or category / target | Proposed text | Counterplay | Source |
|---|---|---|---|---|---|
| Question Quail · `language-question-quail` | creature / common / 1 | 1/2 | Entrance: another friendly creature gains 1 attack for its next creature attack this turn. | Block the supported attacker. | pack-pool |
| Comma Caterpillar · `language-comma-caterpillar` | creature / common / 2 | 1/3 | Guard. | Remove Guard or use a spell. | pack-pool |
| Label Lemur · `language-label-lemur` | creature / common / 2 | 2/2 | Entrance: an enemy creature loses 1 attack until its controller's next turn ends, minimum 0. | Use another attacker or restore its stats. | pack-pool |
| Word Weasel · `language-word-weasel` | creature / common / 2 | 2/1 | Last Word: choose a surviving friendly creature; it gains 1 maximum health and heals 1. | Remove other friendly creatures first. | pack-pool |
| Echo Egret · `language-echo-egret` | creature / uncommon / 3 | 2/3 | Once per turn, after you play an Axiom from hand, draw 1 personal-deck card. | Remove the engine or change rules through Fate. | pack-pool |
| Definition Dolphin · `language-definition-dolphin` | creature / uncommon / 3 | 1/4 | Entrance: give a friendly creature Guard until your next turn starts. | Remove Guard or attack after expiry. | pack-pool |
| Debate Dingo · `language-debate-dingo` | creature / uncommon / 3 | 3/2 | When attacking a creature with higher effective attack, this gains Shield for that fight only. | Use equal or lower power or silence it. | pack-pool |
| Clause Crane · `language-clause-crane` | creature / uncommon / 4 | 2/5 | Guard. Once per round, when an active Axiom is replaced, heal this by 1. | Use direct removal instead of chip damage. | pack-pool |
| Metaphor Mantis · `language-metaphor-mantis` | creature / rare / 4 | 3/3 | Entrance: an enemy creature loses its colour and 1 attack until your next turn starts, minimum 0. | Wait out the label or clear the debuff. | pack-pool |
| Contract Coyote · `language-contract-coyote` | creature / rare / 5 | 3/5 | Your first spell each turn targeting a friendly creature costs 1 less, minimum 0. | Remove the creature before the support sequence. | story-only |
| Orator Owl · `language-orator-owl` | creature / mythic / 6 | 4/6 | At your turn's end, if you played an Axiom, schedule at +1 round: your creatures present then gain 1 attack until your next turn ends. At most one own Orator event pending. | Trade the board or skip the occurrence. | pack-pool |
| Lexicon Lion · `language-lexicon-lion` | creature / legendary / 7 | 4/7 | Entrance: choose one active Axiom category; discard that rule and restore its basic rule. Draw 1 personal-deck card. | Keep a replacement or rely on other categories. | pack-pool |
| A Better Label · `language-a-better-label` | spell / common / 1 | enemy-creature | Reduce its attack by 1 until its controller's next turn ends, minimum 0. Draw 1 personal-deck card. | Use another attacker. | pack-pool |
| Plain Words · `language-plain-words` | spell / common / 1 | friendly-creature | Remove one temporary attack debuff; if none exists, heal the target by 1. | Use permanent damage or silence. | pack-pool |
| Hold the Floor · `language-hold-the-floor` | spell / common / 2 | friendly-creature | Give Guard and 1 maximum health; heal it by 1. | Remove Guard or target with spells. | pack-pool |
| Ask Again · `language-ask-again` | spell / common / 2 | enemy-creature | Remove Elusive and reduce its attack by 1 this turn, minimum 0. | Reapply protection or wait out the penalty. | pack-pool |
| Change the Subject · `language-change-the-subject` | spell / common / 2 | active-attacks-axiom | Discard the active attack-limit rule and restore that category to basics. Draw 1 personal-deck card. | Hold another attack-limit rule. | pack-pool |
| Careful Wording · `language-careful-wording` | spell / uncommon / 3 | friendly-creature | Give 1 attack and 2 maximum health; heal it by 2. | Silence or remove the supported creature. | pack-pool |
| Tomorrow's Address · `language-tomorrow-s-address` | spell / uncommon / 2 | none | At +1 round, your creatures present then gain 1 attack until your next turn ends. | Trade the board or skip the occurrence. | pack-pool |
| Read the Fine Print · `language-read-the-fine-print` | spell / uncommon / 3 | enemy-creature | Silence it. Your hero loses 1 heart. | Exploit low hearts or reverse Win. | pack-pool |
| Borrowed Voice · `language-borrowed-voice` | spell / rare / 4 | enemy-creature | Take control of a creature with 1 attack or less until your next turn starts. It arrives asleep; return it if still in play. | Raise its attack or fill the borrower's board. | pack-pool |
| Rewrite One Clause · `language-rewrite-one-clause` | spell / rare / 4 | active-axiom-category | Remove that category's active rule. You may immediately play one matching-category Axiom from hand, paying its normal cost and activation budget. | Keep another answer or exhaust its resources. | pack-pool |
| Names Matter · `language-names-matter` | axiom / common / 1 | colour | A colourless creature gains 1 maximum health while this rule is active; remove that maximum-health increase on replacement or reset. | Use damage or restore its original colour. | pack-pool |
| One Speaker · `language-one-speaker` | axiom / common / 1 | attacks | Each player may attack with at most 2 distinct creatures per turn; repeated attacks still obey creature limits. | Use two strong attackers or replace the limit. | pack-pool |
| Clear Definitions · `language-clear-definitions` | axiom / common / 1 | abilities | Each player's first silence effect each turn also heals its target by 1 after silence. | Use damage on nearly defeated targets. | pack-pool |
| Open Debate · `language-open-debate` | axiom / uncommon / 2 | draw | Playing an Axiom from hand draws its player 1 personal-deck card, once per turn. Fate flips do not count. | Pressure the rule-playing turn. | pack-pool |
| Consensus · `language-consensus` | axiom / rare / 2 | victory | Win by enemy hero reaching 0, or by ending your own turn with 3 Language creatures while 3 different Axiom categories are active. | Remove a creature, reset rules or replace Win. | story-only |
| Binding Words · `language-binding-words` | axiom / mythic / 3 | fate-impact | Scheduled buffs for either player last until the recipient controller's next turn ends instead of this turn's end; one-shot resolution time does not change. | Silence, trade or skip the buff. | pack-pool |

### imagination

Stat transformations, diverse boards and token plans.

| Card / ID | Kind / rarity / cost | Stats or category / target | Proposed text | Counterplay | Source |
|---|---|---|---|---|---|
| Doodle Duck · `imagination-doodle-duck` | creature / common / 1 | 1/2 | No ability. | Trade a larger creature. | pack-pool |
| Possibility Pika · `imagination-possibility-pika` | creature / common / 2 | 2/2 | Entrance: choose 1 extra attack or 1 extra maximum health and healing for this creature. | Punish the mode not chosen. | pack-pool |
| Fable Fawn · `imagination-fable-fawn` | creature / common / 2 | 1/3 | Entrance: swap the attack and health of another friendly creature using normal stat-swap rules. | Use balanced bodies or remove the transformed threat. | pack-pool |
| Mosaic Mole · `imagination-mosaic-mole` | creature / common / 2 | 1/2 | Last Word: summon a colourless 1/1 paper token if you have board space. | Silence it before defeat. | pack-pool |
| Blueprint Bat · `imagination-blueprint-bat` | creature / uncommon / 3 | 2/3 | The first colourless token you summon each turn arrives with 1 extra maximum health. | Remove this before the token spell. | pack-pool |
| Mirror Marten · `imagination-mirror-marten` | creature / uncommon / 3 | 2/3 | Entrance: copy another friendly creature's current attack until your next turn starts, maximum 4. | Remove the large source before the copy turn. | pack-pool |
| Chimera Chick · `imagination-chimera-chick` | creature / uncommon / 3 | 1/4 | Once per turn, after this has attack and health swapped, it gains Shield. | Remove Shield or deal damage twice. | pack-pool |
| Stage Mouse · `imagination-stage-mouse` | creature / uncommon / 4 | 2/4 | Elusive. Your colourless tokens have 1 extra attack while this remains in play. | Use a spell or strip Elusive. | pack-pool |
| Paradox Pony · `imagination-paradox-pony` | creature / rare / 4 | 3/3 | Entrance: swap an enemy creature's attack and health until your next turn starts, using normal swap rules. | Use balanced stats or restore them. | pack-pool |
| Cloud Castle Crab · `imagination-cloud-castle-crab` | creature / rare / 5 | 2/6 | Guard. Once per turn, after surviving damage, summon a colourless 1/1 paper token if you have board space. | Defeat it in one hit or silence it. | story-only |
| Dreamweaver Whale · `imagination-dreamweaver-whale` | creature / mythic / 6 | 3/7 | At your turn's end, if you control at least 2 colourless tokens, draw 1 personal-deck card. | Remove the tokens or their engine. | pack-pool |
| Impossible Unicorn · `imagination-impossible-unicorn` | creature / legendary / 7 | 4/6 | Entrance: choose two other friendly creatures; swap their attack values permanently, then give each 1 maximum health and heal 1. | Limit supporting creatures or silence boosted bodies. | pack-pool |
| Sketch a Friend · `imagination-sketch-a-friend` | spell / common / 1 | none | Summon one colourless 1/1 paper token if you have board space. | Use small area damage. | pack-pool |
| Try Another Shape · `imagination-try-another-shape` | spell / common / 1 | friendly-creature | Swap its attack and health using normal stat-swap rules. | Use balanced defenders or answer after the swap. | pack-pool |
| Bright Possibility · `imagination-bright-possibility` | spell / common / 1 | friendly-creature | Choose 1 attack this turn or 1 maximum health and healing. | Force defensive spending. | pack-pool |
| Paper Shield · `imagination-paper-shield` | spell / common / 2 | friendly-creature | Give Shield. If it is a colourless token, also give 1 attack. | Remove Shield or hit twice. | pack-pool |
| Unexpected Door · `imagination-unexpected-door` | spell / common / 2 | friendly-creature | Return it to your hand; its next play costs 1 less, minimum 0. Consume the discount on play. | Pressure while its board is smaller. | pack-pool |
| New Perspective · `imagination-new-perspective` | spell / uncommon / 3 | enemy-creature | It becomes Imagination until its controller's next turn ends. Draw 1 personal-deck card. | Avoid affected matchups or restore colour. | pack-pool |
| Tomorrow's Sketch · `imagination-tomorrow-s-sketch` | spell / uncommon / 2 | none | At +1 round, summon two colourless 1/1 paper tokens, limited by board space. | Wipe after resolution or skip the node. | pack-pool |
| Borrow the Shape · `imagination-borrow-the-shape` | spell / uncommon / 3 | friendly-and-enemy-creature | The friendly target copies the enemy target's current attack until your next turn starts, maximum 5. | Reduce the source's attack before casting. | pack-pool |
| Dream in Layers · `imagination-dream-in-layers` | spell / rare / 4 | none | Summon two colourless 1/1 paper tokens, then give all your colourless tokens 1 maximum health and heal 1. | Use area damage or remove token support. | pack-pool |
| Impossible Position · `imagination-impossible-position` | spell / rare / 5 | two-distinct-creatures | Swap their current attack values until your next turn starts. May choose either side; controllers do not change. | Use balanced stats or clear the benefit. | pack-pool |
| Room for Ideas · `imagination-room-for-ideas` | axiom / common / 1 | arrival | Each player's first colourless token each turn may attack creatures immediately, not heroes. | Use durable defenders. | pack-pool |
| Different Shapes · `imagination-different-shapes` | axiom / common / 1 | combat | In a fight, matching printed attack values reduce each fighter's damage by 1, minimum 0, after matchup calculation. | Use varied printed attacks. | pack-pool |
| Light Materials · `imagination-light-materials` | axiom / common / 1 | cost | Each player's first token-summoning spell each turn costs 1 less, minimum 0. | Contest the tokens before the next spell. | pack-pool |
| Mixed Colours · `imagination-mixed-colours` | axiom / uncommon / 2 | power | A creature gets 1 extra attack if its controller also has creatures of at least 2 other colours. | Remove a supporting colour. | pack-pool |
| Living Possibilities · `imagination-living-possibilities` | axiom / rare / 2 | victory | Win by enemy hero reaching 0, or by ending your own turn with 2 Imagination creatures and 4 colourless tokens. | Clear tokens or replace Win. | story-only |
| Changed Horizons · `imagination-changed-horizons` | axiom / mythic / 3 | fate-delay | Each player may schedule a new effect one space later than its card says, up to +4 rounds. Its chosen time is public and fixed. | Plan around the published node. | pack-pool |

### memory

Discard recovery, delayed effects and bounded Fate re-entry.

| Card / ID | Kind / rarity / cost | Stats or category / target | Proposed text | Counterplay | Source |
|---|---|---|---|---|---|
| Bookmark Bunny · `memory-bookmark-bunny` | creature / common / 1 | 1/2 | Entrance: heal a damaged friendly creature by 1. | Finish damaged targets before the heal. | pack-pool |
| Recall Robin · `memory-recall-robin` | creature / common / 2 | 1/2 | Entrance: put your most recently discarded spell on the bottom of your personal deck if still there. | Race before it is redrawn. | pack-pool |
| Archive Armadillo · `memory-archive-armadillo` | creature / common / 2 | 1/3 | Guard. | Remove Guard or use spells. | pack-pool |
| Return Roach · `memory-return-roach` | creature / common / 2 | 2/1 | Last Word: return this to your hand once per match. | Silence it before defeat. | pack-pool |
| Chronicle Cat · `memory-chronicle-cat` | creature / uncommon / 3 | 2/3 | Once per turn, after you recover a card from discard, heal your hero by 1. | Remove the engine or exploit reversed Win. | pack-pool |
| Replay Raccoon · `memory-replay-raccoon` | creature / uncommon / 3 | 2/3 | Entrance: return a friendly creature costing 1 or less from discard to hand. | Pressure during the replay turn. | pack-pool |
| Hourglass Hedgehog · `memory-hourglass-hedgehog` | creature / uncommon / 3 | 1/4 | Guard. The first time each round you move Fate backward, this gains Shield. | Remove Shield or use repeated damage. | pack-pool |
| Souvenir Seal · `memory-souvenir-seal` | creature / uncommon / 4 | 2/4 | Once per turn, after an own pending event resolves, draw 1 personal-deck card. Skipped events do not count. | Skip or cancel the event. | pack-pool |
| Sequence Swan · `memory-sequence-swan` | creature / rare / 4 | 3/4 | Entrance: move one own pending event one space later, maximum +4 rounds; draw 1 personal-deck card if it moved. | Contest the newly announced node. | pack-pool |
| Second Chance Salamander · `memory-second-chance-salamander` | creature / rare / 5 | 3/4 | Entrance: return a defeated creature costing 3 or less to hand; it gains 1 maximum health on its next play only. | Race the replay or remove the restored creature. | story-only |
| Keeper Koi · `memory-keeper-koi` | creature / mythic / 6 | 3/7 | Once per round, when a marked repeatable player event resolves, heal all your creatures by 1. | Expire or skip the marked space. | pack-pool |
| Timekeeper Tapir · `memory-timekeeper-tapir` | creature / legendary / 7 | 4/7 | Entrance, once per match: copy one spent own one-shot event to a new public occurrence at +2 rounds. No spell energy is repaid; the spent original stays consumed. | Skip the new occurrence or avoid supplying a powerful original. | pack-pool |
| Keep the Note · `memory-keep-the-note` | spell / common / 1 | own-discard-spell | Put it on the bottom of your personal deck. Restore 1 heart to your hero. | Race before it is redrawn. | pack-pool |
| Familiar Path · `memory-familiar-path` | spell / common / 1 | own-discard-creature | Return a creature costing 1 or less to hand. | Use tempo while it is absent. | pack-pool |
| Remember the Guard · `memory-remember-the-guard` | spell / common / 2 | friendly-creature | Give Guard until your next turn starts. Heal it by 2. | Remove Guard or focus another target. | pack-pool |
| A Little Later · `memory-a-little-later` | spell / common / 2 | own-pending-event | Move it one space later, maximum +4 rounds. Announce the new time. | Pressure before it resolves. | pack-pool |
| Clear Reminder · `memory-clear-reminder` | spell / common / 2 | none | Draw 1 personal-deck card. If you recovered a discard card earlier this turn, restore 2 hearts. | Pressure recovery or reverse Win. | pack-pool |
| Return to the Plan · `memory-return-to-the-plan` | spell / uncommon / 3 | own-discard-spell | Return a spell other than this card to hand; its cost stays unchanged. | Pressure the recovery turn. | pack-pool |
| Marked Revisit · `memory-marked-revisit` | spell / uncommon / 3 | none | Rewind Fate one space. Only marked repeatable player effects may fire again; permanently skipped environmental occurrences stay skipped. | Expire the space or exploit its public path. | pack-pool |
| Tomorrow's Return · `memory-tomorrow-s-return` | spell / uncommon / 3 | own-discard-creature | At +1 round, return that chosen creature to hand if still in your discard. | Move the card, apply pressure or skip. | pack-pool |
| Stored Resolve · `memory-stored-resolve` | spell / rare / 4 | none | At +2 rounds, your creatures present then gain 1 attack and 1 maximum health, and heal 1. One-shot. | Trade the board or skip the occurrence. | pack-pool |
| One More Chance · `memory-one-more-chance` | spell / rare / 5 | own-discard-creature | Return it to hand and reduce its next play cost by 2, minimum 0. Each creature may receive this discount once per match. | Race before replay or remove its new body. | pack-pool |
| Small Reminders · `memory-small-reminders` | axiom / common / 1 | healing | Recovering a discard card heals that player's hero by 1, at most once per turn. | Pressure directly or reverse Win. | pack-pool |
| Keep the Order · `memory-keep-the-order` | axiom / common / 1 | draw | Personal draws are normal; draw-selection effects inspect one fewer card, minimum one. | Use raw draw or replace the rule. | pack-pool |
| Patient Recovery · `memory-patient-recovery` | axiom / common / 1 | defeat | The first creature defeated on each player's own turn goes to its owner's deck bottom instead of discard. Other defeats are unchanged. | Defeat it on the other player's turn. | pack-pool |
| Written History · `memory-written-history` | axiom / uncommon / 2 | fate-capacity | Each player may retain one more marked repeatable space under its original elapsed-round expiry. No one-shot or environment becomes repeatable. | Wait out expiry or replace the rule. | pack-pool |
| Recovered Story · `memory-recovered-story` | axiom / rare / 2 | victory | Win by enemy hero reaching 0, or by ending your own turn with 3 Memory creatures after recovering 2 distinct discard cards that turn. | Remove the board or deny recovery targets. | story-only |
| No Forgotten Debts · `memory-no-forgotten-debts` | axiom / mythic / 3 | exhaustion | Future exhaustion steps increase by 2 rather than 1 for both players. Damage already taken is unchanged. | Restore a draw source, change Win or replace the rule. | pack-pool |

### generic

Simple support and shared rules accessible to any deck.

| Card / ID | Kind / rarity / cost | Stats or category / target | Proposed text | Counterplay | Source |
|---|---|---|---|---|---|
| Clean Cut · `generic-clean-cut` | spell / common / 1 | enemy-creature | Deal 1 damage. If the target is a colourless token, deal 2 instead. | Use non-token bodies. | pack-pool |
| Small Patch · `generic-small-patch` | spell / common / 1 | friendly-creature | Heal it by 2 without changing maximum health. | Defeat it in one hit. | pack-pool |
| Quick Study · `generic-quick-study` | spell / common / 2 | none | Draw 1 personal-deck card; inspect the next without changing it. | Pressure the slow draw turn. | pack-pool |
| Simple Cover · `generic-simple-cover` | spell / common / 1 | friendly-creature | Give Guard until your next turn starts. | Remove Guard or wait out the effect. | pack-pool |
| Pocket Plan · `generic-pocket-plan` | spell / common / 1 | none | Inspect the top unreserved shared Axiom. You may put it on the bottom; reserved events are untouched. | Draw or reorder the rule before the next shared draw. | pack-pool |
| Spare Spark · `generic-spare-spark` | spell / common / 0 | none | Gain 1 energy this turn, capped at 10. This still uses the normal activation budget. | Force inefficient sequencing. | pack-pool |
| Settle Down · `generic-settle-down` | spell / common / 1 | enemy-creature | Reduce its attack by 1 until its controller's next turn ends, minimum 0. | Use another attacker. | pack-pool |
| Fair Trade · `generic-fair-trade` | spell / common / 2 | none | Each player draws 1 personal-deck card, caster first; normal hand limits apply. | Benefit from the shared draw. | pack-pool |
| Follow Through · `generic-follow-through` | spell / common / 2 | enemy-creature | Deal 2 damage if already damaged, otherwise 1. | Heal before it is cast. | pack-pool |
| Warm Blanket · `generic-warm-blanket` | spell / common / 2 | friendly-creature | Heal it by 2 and give Shield until your next turn starts. | Remove Shield or strike twice. | pack-pool |
| Pause One Beat · `generic-pause-one-beat` | spell / common / 2 | none | At +1 round, restore 2 hearts to your hero. One-shot. | Skip the occurrence or exploit reversed Win. | pack-pool |
| Take Stock · `generic-take-stock` | spell / common / 1 | none | Draw 1 personal-deck card. If that deck is empty, restore 1 heart instead; no extra exhaustion step. | Maintain pressure through the small benefit. | pack-pool |
| Balanced Exchange · `generic-balanced-exchange` | spell / uncommon / 3 | own-hand-card | Put one chosen personal card from hand on deck bottom, then draw 2 personal-deck cards. | Pressure its card-quality turn. | pack-pool |
| Forked Reply · `generic-forked-reply` | spell / uncommon / 3 | two-enemy-creatures | Deal 1 damage to two distinct creatures, then restore 1 heart to your hero. One target is legal if no second exists. | Use large bodies or Shield. | pack-pool |
| Repair the Shield · `generic-repair-the-shield` | spell / uncommon / 2 | friendly-creature | Remove its consumed-Shield marker, give a fresh Shield and heal it by 1. | Remove keywords or use repeated damage. | pack-pool |
| Quiet Reset · `generic-quiet-reset` | spell / uncommon / 3 | active-axiom-category | Restore one chosen active category to basics without drawing or moving Fate. | Hold a replacement rule. | story-only |
| Scheduled Shelter · `generic-scheduled-shelter` | spell / uncommon / 3 | none | At +1 round, your creatures present then gain Shield. One-shot. | Trade them before resolution or skip. | pack-pool |
| Recorded Choice · `generic-recorded-choice` | spell / uncommon / 2 | none | If you have a pending own event, draw 1 personal-deck card; otherwise inspect the top 2 personal cards and bottom one. | Pressure setup before the pending plan exists. | pack-pool |
| Board Sweep · `generic-board-sweep` | spell / rare / 5 | none | Deal 3 damage to every creature as one effect. Shields and normal prevention apply. | Use high health or Shield. | pack-pool |
| One Last Draw · `generic-one-last-draw` | spell / rare / 3 | none | Your hero loses 2 hearts; draw 2 personal-deck cards. | Change Win or exploit low hearts. | pack-pool |
| Cancel the Appointment · `generic-cancel-the-appointment` | spell / rare / 3 | player-created-pending-event | Cancel one chosen player-created one-shot event. It is spent and cannot fire; environmental occurrences are not legal targets. | Keep a second plan or protect the important occurrence. | pack-pool |
| Steal a Beat · `generic-steal-a-beat` | spell / rare / 4 | enemy-pending-event | Move one enemy player-created event one space later, maximum +4 rounds. Draw 1 personal-deck card if it moved; announce its new time. | Adapt to the known delay or use immediate effects. | pack-pool |
| Common Ground · `generic-common-ground` | spell / mythic / 5 | none | Remove temporary buffs and debuffs from both boards. Each surviving creature gains 1 maximum health and heals 1; both players draw 1 personal card. | Use permanent stats or play after the reset. | pack-pool |
| The Last Page · `generic-the-last-page` | spell / legendary / 6 | none | Reset all active Axiom categories to basics, return one own defeated creature costing 4 or less to hand, and draw 2 personal-deck cards. Announced events keep their identities and timing. | Keep replacement rules and pressure the expensive recovery turn. | story-only |
| Careful Hands · `generic-careful-hands` | axiom / common / 1 | hand | At the end of each player's turn, keep at most 5 cards; discard the oldest excess cards. | Play cards before the limit checks. | pack-pool |
| Small Armies · `generic-small-armies` | axiom / common / 1 | board-capacity | A player controlling 5 or more creatures cannot play or summon another. Existing creatures remain. | Remove a body or replace the cap. | pack-pool |
| Fair Rest · `generic-fair-rest` | axiom / common / 1 | healing | At the start of each player's turn, heal their most damaged creature by 1; break ties by oldest arrival. | Defeat threats in one hit. | story-only |
| Unhurried Arrival · `generic-unhurried-arrival` | axiom / common / 1 | arrival | New non-Swift creatures cannot activate until their controller's next turn, even if another effect readies their attacks. | Use Swift or wait a turn. | pack-pool |
| One Tool at a Time · `generic-one-tool-at-a-time` | axiom / common / 1 | abilities | Each player may activate at most one creature ability per turn; hero powers and card plays still follow their normal budgets. | Choose the key ability or replace the rule. | pack-pool |
| Gentle Growth · `generic-gentle-growth` | axiom / common / 1 | growth | A creature surviving a fight at 1 health gains 1 maximum health and heals 1; at most once per creature per round. | Finish wounded creatures before they fight again. | pack-pool |
| Public Rules · `generic-public-rules` | axiom / common / 1 | inspection | After an Axiom enters either hand, its name stays public until played or discarded. Personal cards stay private. | Use personal cards or promptly play the revealed rule. | story-only |
| Modest Claims · `generic-modest-claims` | axiom / common / 1 | damage | A single spell effect deals at most 3 damage to each creature; hero damage is unchanged. | Use several spells or combat. | pack-pool |
| Shared Supplies · `generic-shared-supplies` | axiom / uncommon / 2 | draw | Once per turn, playing a creature costing 5 or more draws its controller 1 personal card. | Pressure before expensive plays. | pack-pool |
| Give and Take · `generic-give-and-take` | axiom / uncommon / 2 | healing | An original hero-healing effect also heals the other hero by that amount once; the copy creates no further copies. | Exploit shared healing under the current Win rule. | pack-pool |
| Conservative Plans · `generic-conservative-plans` | axiom / uncommon / 2 | fate-delay | New player-created scheduled effects have minimum +2 rounds; already announced times and environments do not change. | Replace before scheduling or use immediate spells. | story-only |
| No Shortcuts · `generic-no-shortcuts` | axiom / uncommon / 2 | cost | Neither player's spells may cost less than 1 energy, after discounts; printed zero-cost spells also cost 1. | Use efficient creatures or replace the rule. | pack-pool |
| Open Slots · `generic-open-slots` | axiom / uncommon / 2 | board-capacity | Playing a new creature requires a free slot beyond it: a player at one below the normal board limit cannot add another. Existing boards remain. | Trade before playing or replace the limit. | pack-pool |
| Prepared Response · `generic-prepared-response` | axiom / uncommon / 2 | abilities | Each player's first creature activation each turn costs 1 less, minimum 0; later creature activations cost 1 more. | Choose activation order carefully. | pack-pool |
| Fragile Shields · `generic-fragile-shields` | axiom / rare / 3 | keywords | A newly granted Shield expires at its controller's next turn start unless consumed first. Printed arrival Shield follows the same expiry. | Wait out protection or replace the rule. | pack-pool |
| Balanced Accounts · `generic-balanced-accounts` | axiom / rare / 3 | exhaustion | Exhaustion counters increase normally, but each normal draw's exhaustion damage is capped at 3 for both players. | Use attacks or replace the cap; self-zero strategies may still benefit. | pack-pool |
| One Fair Fight · `generic-one-fair-fight` | axiom / rare / 3 | combat | The first creature fight each turn ignores auras on both fighters for that fight only; permanent buffs remain. | Make the first fight with a creature not relying on an aura. | pack-pool |
| The Common Good · `generic-the-common-good` | axiom / mythic / 4 | victory | Win by enemy hero reaching 0, or by ending your own turn with all 6 creature colours on your board and at least 4 hero hearts. | Remove one colour, reduce hearts or replace Win. | story-only |

## Release sequence

Use small playtested packs, never enable all 210 at once. Begin with simple common board/heal/draw/control cards after the existing starter-pack slice. Then introduce uncommons, bounded tokens/transformations, scheduled one-shots, contextual Axiom families and only then alternate goals, repeatable spaces and mythic/legendary engines. Existing #101 owns broad modifier rules. Thematic overlap is deliberate; exact stat-only duplicates should be merged during review rather than counted as strategic breadth. Creature names are working mechanical labels. The teacher reaffirmed cute-horror public-persona satire: assign inspiration, pun, signature prop and harmless joke in ROSTER.md before art/release. Generic helper exceptions require explicit review; do not mass-generate seventy-two generic animals. Follow ART-BIBLE.md and the approved style board.

Run catalogue-source.mjs to regenerate these two catalogue files and arithmetic checks. New runtime card definitions belong in later implementation tickets.
