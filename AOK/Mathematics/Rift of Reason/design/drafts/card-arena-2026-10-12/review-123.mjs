// Authored contract revisions after comparing all 210 concepts with the shipped
// creatures, tactics, Axioms and starter helpers. Planning only: no runtime grants.
export const foundationBatch = ['reason-premise-pigeon', 'emotion-courage-cub', 'perception-cue-cricket', 'language-question-quail', 'imagination-fable-fawn', 'memory-recall-robin', 'generic-small-patch'];
export const revisions = {
  'emotion-cool-down': {
    text: 'Until its controller\'s next turn ends, the chosen enemy creature may attack creatures but not heroes.',
    tags: ['control'], counterplay: 'Fight creatures, use spells or silence away the temporary restriction.',
    why: 'Spec review found the old -2 attack was only an affinity/number change from Generic Settle Down. This redirects aggression without reducing creature-fight damage.',
  },
  'reason-premise-pigeon': {
    text: 'Entrance: reveal your top personal-deck card. If it is a spell with printed cost 1 or less, draw it; otherwise leave it there.',
    tags: ['inspection','draw'], counterplay: 'A costly card or creature leaves the revealed top card in place.',
    why: 'Tom Skink now checks one small premise instead of adding a recoloured vanilla body. Conditional public reveal differs from Lens Lizard and paid selection.',
    persona: 'A little explanation reveals one small premise; only a cheap spell turns it into a useful example.',
  },
  'reason-axiom-ant': {
    text: 'Guard. Entrance: if the opponent controls more creatures than you after this enters, this gains Shield.',
    tags: ['guard','shield'], counterplay: 'Keep equal board numbers, consume Shield with a small hit, or silence it.',
    why: 'Bill Ny-ant compares board counts once. A conditional catch-up shield differs from vanilla Guard and unconditional Beansprout Shield.',
    persona: 'A small science demonstration compares the two sides before adding protection.',
  },
  'emotion-pulse-pup': {
    text: 'Once per match, after this survives a fight on your turn, ready one additional attack for it. Normal card activations still apply.',
    tags: ['combat','ready'], counterplay: 'Defeat it in the first fight, freeze it, or consume the shared activation budget.',
    why: 'Dua Leapfrog gets one bounded second leap instead of a vanilla attack body. This is not permanent double attack or a shared activation refund.',
    persona: 'One energetic leap earns one encore, with no singing or copied catchphrase.',
  },
  'emotion-courage-cub': {
    text: 'Entrance: restore 1 heart to your hero. If that restoration fills your hero to maximum hearts, this gains Shield.',
    tags: ['healing','shield'], counterplay: 'Keep the hero wounded or already full so no qualifying restoration occurs.',
    why: 'Simone Bearles turns exactly finishing recovery into protection. Obambu only heals; Proof Pup heals another creature.',
    persona: 'A clean recovery of balance earns a protective landing; no injury or personal-experience joke.',
  },
  'perception-shadow-shrimp': {
    text: 'Elusive. After this attacks a hero, it loses Elusive until your next turn starts.',
    tags: ['elusive','combat'], counterplay: 'Wait for the hero attack to expose it, then use a targeted answer.',
    why: 'David Brine must trade concealment for pressure. Shakirattle keeps Elusive; this opens a visible response window.',
    persona: 'The little stage trick stops hiding its performer after the big reveal.',
  },
  'language-comma-caterpillar': {
    text: 'Guard. Last Word: if you hold an Axiom, reveal your oldest held Axiom and draw 1 personal-deck card.',
    tags: ['guard','inspection','draw'], counterplay: 'Silence it or make the opponent use their held rules first.',
    why: 'Emma Wordson exchanges a public held-rule clue for a last-word draw. This is neither plain Guard nor Footnote Finch attack growth.',
    persona: 'The final word cites an actual rule in the hand, making the argument public.',
  },
  'imagination-doodle-duck': {
    text: 'Entrance: if another friendly creature has printed attack equal to this creature\'s printed health, swap this creature\'s attack and health.',
    tags: ['transform'], counterplay: 'Deny the matching teammate; after the swap, trade into its lower health.',
    why: 'Luka Donchilla now has a teammate setup and a one-time self transformation. Paper Dragon pays to swap itself later; Fable Fawn changes another ally.',
    persona: 'A matching teammate sets up the unexpected change of position; the ball remains the only prop.',
  },
  'memory-archive-armadillo': {
    text: 'Guard. Last Word: put your oldest discarded spell on top of your personal deck if one is still there.',
    tags: ['guard','recursion'], counterplay: 'Silence it or force an unwanted oldest spell; it replaces a later draw rather than creating a copy.',
    why: 'Niklas Landillo marks a precise place in the archive instead of plain Guard. Recall Robin recycles the newest spell to the bottom on Entrance.',
    persona: 'The oldest archived note becomes the next thing read; no new physical prop or magical power.',
  },
  'reason-small-lemma': {
    text: 'Give 1 maximum health and heal 1. If the target had equal current attack and current health before this effect, also give Guard until your next turn starts.',
    tags: ['healing','guard'], counterplay: 'Damage or change the target so its values no longer match; temporary Guard can expire.',
    why: 'The former text exactly repeated shipped Careful Words. Equality now creates a precise defensive case.',
  },
  'reason-counterexample-crow': {
    text: 'Entrance: deal 1 damage to an enemy creature, or 2 if you control another creature of a different explicit colour.',
    tags: ['damage','mixed-board'], counterplay: 'Remove the other colour first; Shield still prevents the single damage packet.',
    why: 'Adopt the STRATEGY-IDENTITY mixed bridge. V-Squish asks whether one extra kind of evidence changes the answer. Generic bodies do not qualify.',
    persona: 'One unexpected different-colour example changes the comfortable answer; only one damage packet is dealt.',
  },
  'imagination-fable-fawn': {
    text: 'Entrance: swap the attack and health of another friendly creature using normal stat-swap rules. In a mono-Imagination deck, it then gains 1 maximum health and heals 1.',
    tags: ['transform','mono-deck'], counterplay: 'Balanced stats limit the swap; remove the newly fragile creature.',
    why: 'Adopt the STRATEGY-IDENTITY oddity and construction payoff. Generic cards do not break mono; printed Memory is its own sixth colour.',
    persona: 'A dramatic reframing changes an ally; a whole deck of the same ideas makes the landing slightly safer.',
  },
  'generic-small-patch': {
    text: 'Heal it by 2 without changing maximum health, or 3 in a mono-colour personal deck.',
    tags: ['healing','mono-deck'], counterplay: 'Defeat the target before healing; an all-generic deck has no mono colour.',
    why: 'Adopt the small construction bridge. Identity is fixed from submitted personal cards, never the shared Axioms or live board.',
  },
  'language-hold-the-floor': {
    text: 'Give Guard until your next turn starts. If the target was frozen, remove only its Freeze and heal it by 1.',
    tags: ['guard','thaw'], counterplay: 'Use removal or a later Freeze. Sleeping and spent attacks remain spent.',
    why: 'The former permanent Guard/health package was a number-only Stand Firm variant. This is temporary defensive support with a specific interruption answer; Jimmy remains a creature Entrance thaw.',
  },
  'language-careful-wording': {
    text: 'Remove one temporary attack debuff from the target, then give it 1 attack until your next turn starts. Permanent changes remain.',
    tags: ['buff','control'], counterplay: 'Use permanent reduction, silence or a second temporary debuff.',
    why: 'The former +1/+2 package was a number-only Pep Talk variant. This repairs one specific wording change and supplies a bounded follow-up.',
  },
  'emotion-tomorrow-s-rally': {
    text: 'At +1 round, your next declared creature attack on an enemy hero that round deals 1 extra damage. Lose 1 own heart when declaring it; resolve Win before damage.',
    tags: ['fate-schedule','self-damage'], counterplay: 'Skip the announcement, block hero attacks with Guard, or exploit the heart payment.',
    why: 'The former team buff duplicated both Language Tomorrow\'s Address and shipped Scheduled Speech. Chosen risk now has a specific delayed attack window.',
  },
  'language-tomorrow-s-address': {
    text: 'At +1 round, gain this public permission until that round ends: after your next Axiom played from hand, draw 1 personal-deck card. Consume it before drawing.',
    tags: ['fate-schedule','draw'], counterplay: 'Skip the occurrence or deny an affordable held rule; unused permission expires.',
    why: 'Replace the identical scheduled team buff with a one-use delayed rule-speaking invitation; no environmental flip counts.',
  },
  'generic-follow-through': {
    text: 'Deal 2 damage if one of your creatures already attacked an enemy hero this turn, otherwise 1.',
    tags: ['damage'], counterplay: 'Guard or Freeze stops the prerequisite hero attack; Shield still blocks the spell.',
    why: 'The former damaged-target bonus exactly repeated Perception Notice the Crack with a different cost. Attack sequencing is a distinct generic bridge.',
  },
  'reason-long-view': {
    text: 'After a player\'s own scheduled one-shot resolves, that player may inspect the top unreserved shared Axiom without drawing or moving it. Once per player per round.',
    category: 'fate-inspection', tags: ['axiom','fate-schedule','inspection'], counterplay: 'Skip their event or reorder the shared deck before their next draw.',
    why: 'The former +1 scheduling delay exactly repeated Patient Plans. This rule rewards completed plans with bounded information, never reserved-card inspection.',
  },
  'emotion-shared-nerves': {
    text: 'When a hero has fewer hearts than the other hero, reduce damage from each creature attack on that hero by 1, minimum 0. Spell damage is unchanged.',
    tags: ['axiom','prevention'], counterplay: 'Equalise hearts, use spells, replace the rule or exploit the active Win condition.',
    why: 'The former attack cap of 2 was only a number change from Doubt. Relative hearts now change which side receives protection.',
  },
  'perception-clear-timetable': {
    text: 'At a player\'s normal personal-deck draw, if that player has 2 or more pending player events, inspect the top card and optionally bottom it before drawing normally. Once per turn.',
    category: 'fate-inspection', tags: ['axiom','fate-schedule','inspection'], counterplay: 'Skip a pending event; the normal draw, hand limit and exhaustion still apply.',
    why: 'The former extra pending slot duplicated Open Calendar at the normal two-slot limit. Prepared plans now improve one actual draw rather than capacity.',
  },
  'generic-careful-hands': {
    text: 'At each player\'s turn end, if they hold 5 or more cards, put their highest printed-cost held card on the bottom of its own deck. Ties use oldest hand arrival.',
    tags: ['axiom','hand'], counterplay: 'Play expensive cards first; fewer than 5 cards avoids the check.',
    why: 'The former five-card discard cap was a number-only Limited Memory variant. Cost ordering and bottom-deck recycling change the decision.',
  },
  'generic-open-slots': {
    text: 'A player who began their turn with a full creature board cannot play or summon creatures during that turn, even after making room. Existing creatures remain.',
    tags: ['axiom','board-snapshot'], counterplay: 'Keep one slot empty before your turn or replace the rule; ordinary full-board protection still applies.',
    why: 'The former spare-slot limit duplicated Small Armies on the standard board. A start-of-turn snapshot now changes when to trade.',
  },
};

export function reviewCatalogue(cards) {
  for (const card of cards) {
    if (foundationBatch.includes(card.id)) {
      card.runtimeRelease = 'foundation-1';
      card.status = 'Released in foundation-1; bounded engineering validation, not classroom balance certification';
    }
    const change = revisions[card.id];
    if (!change) continue;
    card.revision = { issue: 123, date: '2026-10-21', previousText: card.text, rationale: change.why };
    for (const field of ['text','tags','counterplay','category']) if (change[field] !== undefined) card[field] = change[field];
  }
}
