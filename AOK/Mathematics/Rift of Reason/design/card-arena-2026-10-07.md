# Card Arena rebuild — 7 October 2026

The teacher asked to move the card minigame towards a familiar digital card-battler interface: drag a creature at the opponent's face or at a creature, creatures keep their damage, attack/health values, guard creatures that must be attacked first, abilities on entry, on defeat and on activation, caught creatures that vary like real animals, trainers that teach tricks, and a draw choice that feeds the shared axiom deck and the Fate track. This supersedes `card-cycle-2026-10-06.md` (#44) and the balance issue #45.

AGENTS.md still applies: borrow mechanics, never names. Our keyword names are **Guard**, **Swift**, **Shield**, **Entrance**, **Last Word** and **Activate**.

## Players and turns

- Each player has a **hero** (the player's avatar or the trainer's portrait) with **10 hearts** (the teacher asked to start at ten; tuned by simulation). Lessons may use fewer. Creature stats are deliberately modest for their cost (about two stat points per energy, health usually at least attack), and Guard plus removal tactics keep the board relevant, so pure face-rushing should not dominate.
- Energy capacity grows by 1 at the start of each own turn (max 10) and refills. Unspent energy is lost. No action limit.
- **Own deck:** 20 cards = creatures from your team plus **Tactic cards** (one-shot spells, our version of trainer cards). Default: your first 10 creatures + your 10 chosen tactics; the Collection deck builder allows 6–14 creatures and up to two copies of a tactic. Missing creatures are loaned.
- **Opening hands:** the first player gets 3 cards from their deck and 1 axiom card. The second player gets 4 deck cards, 1 axiom card and the **Spark** (once per match: +1 energy this turn). This is the opening compensation #45 asked for.
- **Draw choice** at the start of every own turn (including the first): exactly one of
  - **Deck** — draw the top card of your own deck (creature or tactic);
  - **Axiom** — take the top card of the shared axiom deck into your hand (private until played);
  - **Fast-forward** — draw nothing, move the Fate track 2 spaces closer;
  - **Rewind** — draw nothing, move the Fate track 2 spaces further away (max 12).
  A full hand (10 cards) blocks drawing; the time choices remain. An empty deck greys out Deck.
- Then the **main phase**: any number of these, in any order, while energy lasts. **End turn** passes play.
  - **Play a creature** for its cost. It arrives *sleeping*: it can't attack or activate this turn unless it has Swift (or the Arrival rule is on). If it has an Entrance that needs a target, the target is chosen as part of the play.
  - **Play a tactic** for its cost. It resolves once (choose a target if needed) and goes to your discard.
  - **Play an axiom card** from hand for its cost (most cost 2). It becomes the active rule in its category for **both** players and replaces the previous rule in that category (which goes to the shared discard).
  - **Attack** with a ready creature (free): choose the enemy hero or an enemy creature. Each creature attacks once per turn (some rules/abilities allow two).
  - **Activate** a ready creature's ability for its listed energy cost. Activating **uses that creature's attack for the turn**, so it is a real trade-off.
  - **Spark** (second player only, once).

## Combat

- An attack on a creature: both deal damage equal to their attack at the same time. An attack on a hero removes hearts equal to the attacker's attack.
- **Damage stays.** Creatures do not heal between turns (unless the Healing rule changes it). Health shows as current/max.
- A creature at 0 health is **defeated**: Last Word triggers, then it goes to its owner's discard (or hand under Mercy). Defeated collected creatures roll Fate after risked matches (unchanged odds table).
- **Guard:** while an enemy has any Guard creature, attacks must target a Guard creature (not the hero, not other creatures). The Axiom of Choice and a few abilities ignore Guard.
- **Shield:** the first damage the creature would take is cancelled and the shield pops.
- **Colour wheel:** a creature gets **+1 attack** while fighting the colour it beats. Memory stays outside the wheel.
- Under the combat axioms (see below) the same fight can end differently — that is the TOK point.

## Victory

- Normal: reduce the opponent's hearts to 0.
- Reversed (The Last Shall Be First): a player whose hearts reach 0 **wins**.
- A player who starts their turn with no creatures anywhere (deck, hand, board) loses.
- Turn 60 ends in a draw.

## Creatures

Each species in `data/creatures.js` has `cost`, `attack`, `health`, optional `keywords` (guard, swift, shield) and one `ability` (an id in `js/battle/abilities.js`). The old `power` stays as the collection/Mindbug number but battles use attack/health. Ability ids stay stable so warp-cursed saves and team codes still work.

### Variation (like wild animals)

Every caught creature has `variant = { attack: -1|0|+1, health: -1|0|+1|+2, trait: null|'guard'|'swift'|'shield'|'sturdy' }`. About one in eight has a natural trait. Old saves derive the variant deterministically from the creature's uid (save migration v2). Injuries still subtract attack (minus-one) or remove the ability (no-ability). Mending is unchanged.

### Teaching tricks

The **Trick Book** item lets a creature learn one trick (stored as `taught`): Guard, Swift, Shield, +1 attack or +1 health. One taught trick per creature; teaching again replaces it. Trainers give a Trick Book the first time they are beaten; puzzles can drop them rarely. Teach from the Collection details panel.

## Tactic cards

One-shot cards defined in `data/tactics.js` (`cost`, `text`, optional `target`, effect hook `run`). The draw choice still offers the communal axiom deck alongside your own deck. A starter pool of ten is unlocked for everyone; more come from trainers, puzzles and rumours. Examples: Counterexample (deal 3 damage to a creature), Pep Talk (+2/+2), Stand Firm (Guard and +2 health), Eureka! (Swift and +1 attack), Second Wind (restore 3 hearts), Occam's Razor (a creature loses its abilities), Rethink (return a creature to its owner's hand), Big Claims Need Big Evidence (defeat a creature with 5 or more attack), Clockwork (move Fate 3 spaces either way), Look It Up (take an axiom card), Peer Review (1 damage to every enemy creature), Recall (return a defeated creature to your hand).

## Axioms (rules)

Ids are unchanged; several texts/effects change. One active rule per category.

| Category | Ids | Effect |
|---|---|---|
| combat | underdog, excluded-middle, extensionality | Underdog: in a fight only the creature with LOWER attack deals damage (equal: both). Excluded Middle: if both would be defeated, the defender survives on 1 health. Extensionality: creatures with equal attack deal no damage to each other. |
| victory | reverse-hearts, normal-hearts | Own zero hearts wins / back to normal. |
| attacks | one-action, two-actions, three-actions, haste | Only 1 / 2 attacks per player per turn / no attack limit / every creature may attack twice. |
| cost | thrift, luxury | Creatures cost 1 less (min 0) / 1 more. |
| energy | abundance | Capacity grows by 2. |
| draw | study | Creature or axiom draws take 2 cards. |
| healing | vigilance, patience | Creatures heal fully at the start of their controller's turn / wounds remain (default). |
| arrival | arrival | New creatures can act at once (all Swift). |
| targeting | choice | Guard is ignored. |
| defeat | mercy | Defeated creatures return to the owner's hand, fully healed. |
| power | crowd | +1 attack for each other friendly creature. |
| colour | curved-space, age-of-* | Wheel reversed / that colour gets +2 attack. |
| abilities | silence, empty-set | Activations cost 1 more / all abilities and keywords off. |
| growth | induction | A creature that defeats an enemy in a fight gets +1/+1. |
| damage | doubt | Attacks on heroes remove only 1 heart. |

Axiom cards cost 2 energy (thrift/luxury-style cheap rules 1, victory rules 3). Players still build a ten-card contribution in Collection; both contributions form the shared 20-card deck.

## Fate track

Unchanged in spirit: a central countdown, starting 6 spaces away. Each End turn advances 1. Events alternate **free flip** (top shared axiom becomes active) and **reset** (all rules return to the basics), 6 spaces apart. Draw-choice Fast-forward/Rewind move it 2; Filter (Kim Kardashiant) advances 2, Next Year (Muskrat) rewinds 2. Reaching 0 triggers at once.

## Interface

- Opponent hero at top centre, opponent hand (backs) above it, opponent board, Fate track in the centre lane, my board, my hero, my hand fanned at the bottom; energy crystals and the End turn button at the right; Rules now and the log in a collapsible side panel.
- **Drag** a creature from your board onto an enemy creature or the enemy hero to attack. A gold arrow follows the pointer; valid targets glow; Guard creatures show a shield frame. **Click-click** works too (click attacker, click target) for touch and keyboard. Drag a hand card onto the board to play it; an Entrance with a target then asks for a target click.
- The draw choice is four large buttons at the start of the turn.
- Damage numbers and defeats animate briefly; Calm motion turns movement into fades.

## Guided lesson

Granny's practice drives the real battle screen in **guide mode**: each step names one expected player action (highlighted) and scripted replies for Granny. Steps teach: draw choice, playing, sleeping, End turn, attacking a creature (damage stays), Guard, attacking the hero, Activate, an Entrance with a target, an axiom card that changes a fight (Underdog), Fast-forward on the Fate track, a Last Word and a reversed victory rule.

## Validation

Pure-engine legality, determinism and invariants; targeted rule tests; 10,000-game fuzz; swapped-seat AI simulations (`tools/sim-battle.mjs`); browser checks of drag, click-click, guide mode and calm motion.
