// #129 expansion-2: the second small staged release under the #123 continuation rules.
// Builder selection, 22 October 2026. Contracts keep their reviewed meaning; the student text is
// shortened in data/*.js and the clarifications below pin the timing the drafts left open.
export const expansion2Batch = ['reason-diagonal-deer','emotion-resolve-ram','perception-scout-stoat','language-label-lemur',
    'imagination-possibility-pika','emotion-share-the-feeling','memory-remember-the-guard','generic-warm-blanket'];
const rationales = {
    'reason-diagonal-deer':'Pin the comparison moment (after entering, so auras count) and the Elusive exclusion. Meaning unchanged.',
    'perception-scout-stoat':'Pin the private viewer and the short-deck case. Meaning unchanged.',
    'emotion-share-the-feeling':'Pin the Shield outcome: blocked damage still counts as surviving. Meaning unchanged.',
};
const clarifications = {
    'reason-diagonal-deer':'Entrance: an enemy creature with the same current attack as this one, measured after this is on the board, loses its abilities, keywords and boosts. Elusive enemies are not offered.',
    'perception-scout-stoat':'Entrance: look privately at the top 2 personal-deck cards and put one of them on the bottom. With fewer than 2 cards nothing moves.',
    'emotion-share-the-feeling':'Deal 1 damage to a friendly creature. If it survives (a Shield counts), it gains 2 attack until your next turn starts.',
};
export function reviewExpansion2(cards) {
    for (const c of cards) if (expansion2Batch.includes(c.id)) {
        c.runtimeRelease='expansion-2';
        c.status='Released in expansion-2 (#129); bounded engineering validation, not classroom balance certification';
        c.acquisition.releaseStatus='Released expansion-2: pack pool'+(c.kind==='creature'?' plus one ordinary chapter-two catch':'');
        if(clarifications[c.id]){
            c.releaseRevision={issue:129,previousText:c.text,rationale:rationales[c.id]};
            c.text=clarifications[c.id];
        }
    }
}

// #129 expansion-3: the third small staged release, same rules. Builder selection, 23 October 2026: the eight IDs
// suggested in the expansion-2 report. None needs Fate timing, an alternative Win goal, a token or a reaction.
export const expansion3Batch = ['reason-check-the-premise','emotion-cheer-chick','perception-focused-hit','language-definition-dolphin',
    'imagination-mirror-marten','memory-archive-armadillo','generic-simple-cover','reason-proof-by-cases'];
const rationales3 = {
    'language-definition-dolphin':'Pin the target: it is chosen as the creature is played, so it is another friendly creature, and one that already has Guard is not offered. Meaning unchanged.',
    'imagination-mirror-marten':'Pin the copy: measured once this is on the board, kept as a timed boost of the difference, so it never lowers this creature or passes 4. Meaning unchanged.',
    'memory-archive-armadillo':'Pin the Last Word: it happens with a full hand or Mercy too, and any spell card in the pile counts. Meaning unchanged.',
    'reason-proof-by-cases':'Pin the choice: a case that can do nothing is not offered, and with two or fewer friendly creatures each one gets the second case. Meaning unchanged.',
};
const clarifications3 = {
    'language-definition-dolphin':'Entrance: another friendly creature that does not have Guard gains Guard until your next turn starts.',
    'imagination-mirror-marten':'Entrance: if another friendly creature has higher current attack, this creature\'s attack becomes that attack, maximum 4, until your next turn starts. Measured after this is on the board; it never lowers this creature\'s attack.',
    'memory-archive-armadillo':'Guard. Last Word: put your oldest discarded spell on top of your personal deck if one is still there. This happens even when the hand is full or Mercy returns this creature.',
    'reason-proof-by-cases':'Choose one that can happen: deal 4 damage to an enemy creature, or give two friendly creatures (all of them if you have two or fewer) +2 maximum health and heal each by 2.',
};
export function reviewExpansion3(cards) {
    for (const c of cards) if (expansion3Batch.includes(c.id)) {
        c.runtimeRelease='expansion-3';
        c.status='Released in expansion-3 (#129); bounded engineering validation, not classroom balance certification';
        c.acquisition.releaseStatus='Released expansion-3: pack pool'+(c.kind==='creature'?' plus one ordinary chapter-two catch':'');
        if(clarifications3[c.id]){
            c.releaseRevision={issue:129,previousText:c.text,rationale:rationales3[c.id]};
            c.text=clarifications3[c.id];
        }
    }
}

// #129 expansion-4: the eight IDs suggested after expansion-3. Builder selection, 24 October 2026.
export const expansion4Batch = ['reason-counterexample-crow','reason-exact-answer','emotion-grudge-goose','perception-notice-the-crack',
    'language-debate-dingo','imagination-paradox-pony','memory-bookmark-bunny','generic-forked-reply'];
const clarifications4 = {
    'reason-counterexample-crow': ['Entrance: deal 1 damage to an enemy creature, or 2 if another friendly creature has a different explicit colour as this resolves. Generic, colourless and absent-colour creatures do not qualify.',
        'Pin the live-board comparison and explicit-colour exclusions, not the fixed construction identity.'],
    'reason-exact-answer': ['Deal damage equal to an enemy creature\'s current attack, capped at 3. A zero-attack creature is not offered.',
        'Exclude a target that would certainly take zero damage; keep normal Shield prevention.'],
    'emotion-grudge-goose': ['Last Word: deal 1 damage to the enemy hero, even with a full hand or Mercy. All simultaneous Last Words resolve before the existing heart-win check.',
        'Use the existing effect-only Last Word and simultaneous cleanup order, without a new Win rule.'],
    'language-debate-dingo': ['When attacking a creature with higher effective attack, including wheel/rule/aura changes, this gains Shield for that fight only. This temporary Shield is used before any existing Shield; it never remains after the fight.',
        'Pin the comparison and one-fight lifetime in both preview and resolution.'],
    'imagination-paradox-pony': ['Entrance: swap an enemy creature\'s current attack and health until your next turn starts, using normal swap rules. The swap is a timed stat modifier; damage taken afterwards and later boosts remain when it expires.',
        'Pin temporary expiry using the authoritative normal-swap and timed-modifier semantics.'],
    'memory-bookmark-bunny': ['Entrance: if this stays on your board, draw 1 personal card at your next turn start after rule bonuses, before the ordinary draw choice. Defeat, bounce, a control change, Silence or Empty Set at the due start cancels it; it never fires late.',
        'Pin the one-shot turn, board/controller requirement, suppression and ordering. Store it in battle state.'],
    'generic-forked-reply': ['Choose two distinct enemy creatures, then deal 1 damage to each and restore 1 heart to your hero. One target is legal if no second is available. Choose both before damage; defeats use the ordinary cleanup after the spell.',
        'Resolve the prose against the explicit two-enemy-creatures target field; pin the second choice and deferred cleanup.'],
};
export function reviewExpansion4(cards) {
    for (const c of cards) if (expansion4Batch.includes(c.id)) {
        c.runtimeRelease='expansion-4';
        c.status='Released in expansion-4 (#129); bounded engineering validation, not classroom balance certification';
        c.acquisition.releaseStatus='Released expansion-4: pack pool'+(c.kind==='creature'?' plus one ordinary chapter-two catch':'');
        if (clarifications4[c.id]) {
            c.releaseRevision={issue:129,previousText:c.text,rationale:clarifications4[c.id][1]};
            c.text=clarifications4[c.id][0];
        }
    }
}

// #129 expansion-5: eight existing support spells; no new damage or Fate policy.
export const expansion5Batch = ['reason-small-lemma','emotion-second-heartbeat','perception-practical-observation','language-careful-wording',
    'imagination-borrow-the-shape','memory-clear-reminder','generic-balanced-exchange','generic-take-stock'];
const clarifications5 = {
    'perception-practical-observation': ['Look privately at the top 2 unreserved shared rule cards, or all if fewer. Leave them in order, then draw 1 personal card. Fate cards already set aside are excluded.',
        'Pin the private viewer, short/empty shared deck and already reserved Fate exclusion.'],
    'language-careful-wording': ['Remove the oldest applied temporary attack penalty from a friendly creature, then give +1 attack until your next turn starts. Remove only that modifier\'s attack component; its health component, other penalties and lasting changes remain.',
        'Pin one penalty and preserve combined health/expiry and permanent modifiers.'],
    'imagination-borrow-the-shape': ['Choose a friendly creature, then a legal non-Elusive enemy. Set the friend\'s current unconditioned attack to the enemy\'s current unconditioned attack, capped at 5, until your next turn starts. This can lower attack. Printed stats and later boosts remain; a certain no-op is not offered.',
        'Pin the two choices, clamped-negative offset, five cap, timed lifetime and normal Elusive exclusion.'],
    'memory-clear-reminder': ['Draw 1 personal card. If an actual discarded card was recovered earlier this turn, also heal your hero by 2. An attempted recovery that moved no card does not qualify.',
        'Use the existing actual-instance recovery receipt for the current turn.'],
    'generic-balanced-exchange': ['Privately choose another personal card from your hand, put it on your personal deck bottom, then draw 2 personal cards under normal caps. The casting spell has already left hand; held Axioms are excluded. The bottomed card can be drawn if the deck is short.',
        'Pin the private selection, other-card requirement, source zones and bottom-before-draw order.'],
};
export function reviewExpansion5(cards) {
    for (const c of cards) if (expansion5Batch.includes(c.id)) {
        c.runtimeRelease='expansion-5';
        c.status='Released in expansion-5 (#129); bounded engineering validation, not classroom balance certification';
        c.acquisition.releaseStatus='Released expansion-5: pack pool';
        if (clarifications5[c.id]) {
            c.releaseRevision={issue:129,previousText:c.text,rationale:clarifications5[c.id][1]};
            c.text=clarifications5[c.id][0];
        }
    }
}

// #129 expansion-6: independent utility/counterplay contracts; no further Reason reinforcement.
export const expansion6Batch = ['emotion-honest-hurt','perception-read-the-room','language-plain-words','generic-quick-study',
    'emotion-cost-of-courage','language-read-the-fine-print','memory-return-to-the-plan','emotion-outburst'];
const clarifications6 = {
    'emotion-honest-hurt': ['Your hero loses 1 heart, then draw 1 personal card under normal hand/deck caps. Heart loss is a spell effect; finish printed effects before ordinary cleanup and Win checks.',
        'Pin existing damageHero/afterMove semantics rather than introduce a separate casting-heart fee.'],
    'perception-read-the-room': ['Privately see only the count and current colours of enemy personal-hand creatures, including a colourless count. Do not reveal identities or held Axioms. Then draw 1 personal card.',
        'Pin the private viewer, creature-only aggregate and source zones; previews/planning do not use future hidden inspections.'],
    'language-plain-words': ['Remove the oldest applied temporary negative attack component from a friendly creature. Preserve its health/expiry, other penalties and lasting changes. If no such component exists, heal the target by 1.',
        'Share the reviewed one-component penalty semantics with Careful Wording; skip a certain healthy/no-penalty no-op.'],
    'generic-quick-study': ['Draw 1 personal card normally, then privately inspect the next personal-deck card without moving it. With no next card, no inspection is needed.',
        'Pin draw-before-look, empty/one-card sources and owner-only inspection.'],
    'emotion-cost-of-courage': ['Your hero loses 2 hearts; give a friendly creature 2 maximum health and heal it by 2 using normal stat/heal semantics. Finish both printed effects before ordinary cleanup/Win checks.',
        'Heart loss is an effect, not an additional casting fee; preserve the authoritative maximum-health and healing behavior.'],
    'language-read-the-fine-print': ['Silence a legal enemy creature using ordinary Silence rules, then your hero loses 1 heart. Finish printed effects before ordinary cleanup/Win checks.',
        'Reuse existing Silence/Elusive rules and ordinary deferred heart-loss cleanup.'],
    'memory-return-to-the-plan': ['Return another actual spell instance from your discard to your hand under the normal hand cap, with its future cost unchanged. Exclude the exact casting instance; a different copy of Return to the Plan is eligible. Every later cast pays its normal energy and shared activation use.',
        'Thread exact casting CID into the hook; do not exclude all copies by definition ID or infer the caster from discard ordering.'],
    'emotion-outburst': ['Deal 5 damage to a legal enemy creature, then your hero loses 2 hearts. Normal Shield/Elusive apply. Finish printed effects and ordinary defeated Last Words before the existing Win check.',
        'Pin prevention, ordinary cleanup order and self-heart-loss effect semantics without a new Win policy.'],
};
export function reviewExpansion6(cards) {
    for (const c of cards) if (expansion6Batch.includes(c.id)) {
        c.runtimeRelease='expansion-6';
        c.status='Released in expansion-6 (#129); bounded engineering validation, not classroom balance certification';
        c.acquisition.releaseStatus='Released expansion-6: pack pool';
        c.releaseRevision={issue:129,previousText:c.text,rationale:clarifications6[c.id][1]};
        c.text=clarifications6[c.id][0];
    }
}

// #129 expansion-7: resource/choice contracts; six Common, one Uncommon, one Rare.
export const expansion7Batch = ['emotion-careful-cheer','imagination-bright-possibility','memory-keep-the-note','memory-familiar-path',
    'generic-spare-spark','generic-fair-trade','generic-repair-the-shield','generic-one-last-draw'];
const clarifications7 = {
    'emotion-careful-cheer': ['Restore 2 hearts to your hero, or 3 if you currently control at most 2 creatures. Normal maximum hearts apply.',
        'Measure the current friendly board at resolution and retain the ordinary hero cap.'],
    'imagination-bright-possibility': ['Choose for one friendly creature: +1 attack until this turn ends, or +1 maximum health and heal 1. Record the target in the normal pending choice.',
        'Separate temporary attack from permanent maximum health/healing and retain the target through JSON replay.'],
    'memory-keep-the-note': ['Put another actual spell from your discard on the bottom of your personal deck, then restore 1 heart. Exclude the exact casting instance; a different copy is allowed. No draw, new copy or reordering of existing deck cards.',
        'Pin exact-instance eligibility before the casting spell enters discard, public bottom recovery and healing after the real move.'],
    'memory-familiar-path': ['Return an actual creature from your discard to hand if its base instance cost is 1 or less, including permanent Changes but before current rule costs or taxes. Normal hand limits and future play costs apply.',
        'Resolve the draft cost ambiguity explicitly: instance base cost including Changes, not original species cost or transient payable cost. This differs from Cameo eligibility.'],
    'generic-spare-spark': ['Gain 1 current energy this turn, capped at 10, without growing energy capacity. Still consumes one normal shared card activation; unavailable at the cap.',
        'Pin current energy rather than capacity and preserve paid-use limits even at zero card cost.'],
    'generic-fair-trade': ['Each player draws 1 personal card, caster first. Ordinary deck and combined personal/Axiom hand caps apply. Empty sources do not cause draw-phase exhaustion; identities stay private to their respective owners.',
        'Delegate both draws to the ordinary draw API, preserving order, privacy and hypothetical opaque-card planning.'],
    'generic-repair-the-shield': ['Remove the consumed-Shield marker, give a fresh Shield and heal a friendly creature by 1. Shield does not stack; ordinary Silence and ability-suppression rules still apply.',
        'Use existing keyword grant semantics for printed or granted Shield, without undoing Silence or adding extra prevention layers.'],
    'generic-one-last-draw': ['Your hero loses 2 hearts, then draw up to 2 personal cards under ordinary source/hand caps. Finish the printed effects before ordinary cleanup and Win checks, including reversed hearts.',
        'Use the same self-loss effect semantics as expansion-6 rather than introduce a separate casting-heart fee.'],
};
export function reviewExpansion7(cards) {
    for (const c of cards) if (expansion7Batch.includes(c.id)) {
        c.runtimeRelease='expansion-7';
        c.status='Released in expansion-7 (#129); bounded engineering validation, not classroom balance certification';
        c.acquisition.releaseStatus='Released expansion-7: pack pool';
        c.releaseRevision={issue:129,previousText:c.text,rationale:clarifications7[c.id][1]};
        c.text=clarifications7[c.id][0];
    }
}

// #129 expansion-8: existing keyword counters and public positioning; six Common, two Rare.
export const expansion8Batch = ['perception-expose-the-shield','language-ask-again','language-hold-the-floor','generic-settle-down',
    'perception-strip-the-illusion','imagination-try-another-shape','generic-clean-cut','imagination-impossible-position'];
const clarifications8 = {
    'perception-expose-the-shield': ['Remove effective Shield from a legal enemy creature. If it had none, give it -1 attack this turn, minimum 0. Ordinary enemy Elusive exclusion applies.',
        'Distinguish effective Shield from a consumed marker; preserve the fallback lifetime and ordinary targeting.'],
    'language-ask-again': ['Choose an enemy creature, even Elusive. Remove its Elusive and give it -1 attack this turn, minimum 0. Other keywords and ability text remain.',
        'Explicitly use the existing seen-enemy targeting exception, as Look Closer does, so this keyword counter can reach Elusive.'],
    'language-hold-the-floor': ['A friendly creature gains Guard until your next turn starts. If frozen, remove only Freeze and heal it by 1. Do not reset sleep, attacks, activated status or shared card uses.',
        'Pin conditional healing and thaw-only semantics rather than readying the creature.'],
    'generic-settle-down': ['A legal enemy creature gets -1 attack until the end of its controller\'s next turn, minimum 0. Later boosts and lasting changes remain when this penalty expires.',
        'Use the ordinary target-controller next-turn-end modifier, not this turn or caster next-start.'],
    'perception-strip-the-illusion': ['Choose an enemy creature, even Elusive. Remove Guard, Swift, Shield and Elusive plus all temporary stat gains or penalties, including this-turn, timed and Fate-lifetime rows. Keep printed stats, permanent Changes/boosts, ability text, Freeze and existing damage. Normal health-loss defeats and Last Words finish before Win cleanup.',
        'Explicit seen-enemy exception; temporary includes Fate-tagged boosts without cancelling their event. This is not Silence or healing.'],
    'imagination-try-another-shape': ['A friendly creature swaps its current attack and health under the existing lasting stat-swap rules. Retain those rules for damage, lasting boosts and temporary attack/health or auras. Zero attack can leave zero health and cause an ordinary defeat.',
        'Reuse the existing swapStats contract; do not invent a different damage or modifier policy.'],
    'generic-clean-cut': ['Deal 1 damage to a legal enemy creature, or 2 if it is an existing colourless token. Ordinary Shield, Elusive and defeat rules apply. Coloured tokens and colourless non-tokens take only 1.',
        'Colourlessness uses the current colour helper, not token identity alone; no new token ordering policy.'],
    'imagination-impossible-position': ['Choose two distinct legal creatures, either side. Capture both current visible attacks without matchup bonuses, then set each to the other\'s value until your next turn starts. Use ordinary raw-aware timed attack changes; retain controllers, health, damage and later boosts. Enemy Elusive remains excluded.',
        'Serialize the first target, validate both choices, and capture both attacks before applying either modifier, including displayed zero over negative raw attack.'],
};
export function reviewExpansion8(cards) {
    for (const c of cards) if (expansion8Batch.includes(c.id)) {
        c.runtimeRelease='expansion-8';
        c.status='Released in expansion-8 (#129); bounded engineering validation, not classroom balance certification';
        c.acquisition.releaseStatus='Released expansion-8: pack pool';
        c.releaseRevision={issue:129,previousText:c.text,previousTarget:c.target,rationale:clarifications8[c.id][1]};
        c.text=clarifications8[c.id][0];
        if (['language-ask-again','perception-strip-the-illusion'].includes(c.id)) c.target='enemy-creature-seen';
    }
}

// #129 expansion-9: private card selection and basic utility; six Common, two Uncommon.
export const expansion9Batch = ['reason-work-it-out','emotion-quick-courage','perception-follow-the-clue','language-a-better-label',
    'language-change-the-subject','imagination-sketch-a-friend','generic-pocket-plan','generic-recorded-choice'];
const clarifications9 = {
    'reason-work-it-out': ['Privately inspect up to your top 3 personal cards. Draw one chosen actual instance under the combined hand cap, then bottom every undrawn inspected card in its original relative order. Keep the rest of the deck in order; no copies or burns. Empty source does nothing.',
        'Pin exact instances, owner-only selection, short source, normal caps and order; hypothetical draws use opaque cards.'],
    'emotion-quick-courage': ['Give a friendly creature +2 attack until this turn ends. Ordinary temporary modifiers apply; health, damage, lasting Changes and later boosts remain.',
        'Use the ordinary this-turn attack modifier without new timing or readying rules.'],
    'perception-follow-the-clue': ['Privately inspect up to your top 4 personal cards. Choose and draw one creature, then one spell if present and there is combined hand room. Never choose two of one type. Bottom all undrawn inspected cards in their original relative order; preserve the uninspected rest. Choices use serialized owner-only pending state.',
        'Pin creature-first selection/cap priority and retain undrawn cards rather than burn them; prospective AI assumes only one opaque draw because a second type is unknown.'],
    'language-a-better-label': ['A legal enemy creature gets -1 attack until the end of its controller\'s next turn, minimum 0; then draw 1 personal card normally. If current displayed attack is already 0, skip the penalty but still draw. Later boosts are not held down by a latent negative row at 0.',
        'Match established minimum-zero penalty semantics and normal draw/expiry/Elusive rules.'],
    'language-change-the-subject': ['Discard the changed Attacks-category rule and its numeric record, restoring that category to basics; then draw 1 personal card normally. Other categories, shared order, reserved Fate and player events remain. No changed Attacks rule means no useful cast. This is a spell, not an Axiom play.',
        'Use existing clearCategory semantics and pin the exact category rather than a new reset or nested Axiom play.'],
    'imagination-sketch-a-friend': ['Summon one existing colourless 1/1 Paper token if normal board capacity allows, including armed creature reservations. Ordinary sleep and token leave-play rules apply. No collection or deck copies are created; a full board cannot cast this.',
        'Use existing summonToken and authoritative boardOccupancy; no new token order or collection policy.'],
    'generic-pocket-plan': ['Privately inspect only the top unreserved shared Axiom and choose leave or bottom. Hide both its identity and the keep/bottom decision from the opponent. Reserved Fate, personal decks, held Axioms and every other shared card remain. Empty shared source does nothing.',
        'Pin owner-only branch events and exclude already reserved Fate; no draw or prospective hidden read.'],
    'generic-recorded-choice': ['If you currently control a pending player-created event, draw 1 personal card normally. Otherwise privately inspect up to your top 2 personal cards and bottom one, leaving all other order intact. Opposing, environmental, fired, skipped or cancelled events do not qualify. No event changes; an empty personal deck does nothing.',
        'Pin pending-state scope and private selection. Mark the bottoming purpose so AI gives up the least valuable inspected option without reading uninspected cards.'],
};
export function reviewExpansion9(cards) {
    for (const c of cards) if (expansion9Batch.includes(c.id)) {
        c.runtimeRelease='expansion-9';
        c.status='Released in expansion-9 (#129); bounded engineering validation, not classroom balance certification';
        c.acquisition.releaseStatus='Released expansion-9: pack pool';
        c.releaseRevision={issue:129,previousText:c.text,previousTarget:c.target,rationale:clarifications9[c.id][1]};
        c.text=clarifications9[c.id][0];
        if(c.id==='language-change-the-subject')c.target='none';
    }
}

// #129 expansion-10: selected portraits and ordinary Entrance effects; two Common, one Uncommon.
export const expansion10Batch=['emotion-temper-tiger','perception-lens-lynx','imagination-doodle-duck'];
const clarifications10={
    'emotion-temper-tiger':['Entrance: your hero loses 1 heart after this enters. This is an effect, not an additional play cost; ordinary heart loss and Win cleanup apply, including reversed hearts.',
        'Keep the original 3/3/2 body and pin the same own-loss effect semantics as existing spells.'],
    'perception-lens-lynx':['Entrance: choose an enemy creature, even Elusive. Remove only its Elusive until its controller\'s next turn starts. Other keywords, stats, damage and ability text remain. Without a useful target, this still enters normally.',
        'Explicitly use the existing seen-enemy target exception and the target controller\'s next-start expiry.'],
    'imagination-doodle-duck':['Entrance: if another friendly creature\'s printed species attack equals this creature\'s printed species health, swap this creature\'s current attack and health through ordinary lasting stat-swap rules. It cannot qualify itself. Buffs, permanent Changes, auras and damage do not alter the printed comparison.',
        'Separate species-printed eligibility from the authoritative current-stat swap, with no new swap or timing policy.'],
};
export function reviewExpansion10(cards){
    for(const c of cards)if(expansion10Batch.includes(c.id)){
        c.runtimeRelease='expansion-10';c.status='Released in expansion-10 (#129); bounded engineering validation, not classroom balance certification';
        c.acquisition.releaseStatus='Released expansion-10: pack pool';
        c.releaseRevision={issue:129,previousText:c.text,rationale:clarifications10[c.id][1]};c.text=clarifications10[c.id][0];
    }
}

// #129 expansion-11: two existing global damage spells, one Uncommon and one Rare.
export const expansion11Batch=['emotion-shared-pain','generic-board-sweep'];
const clarifications11={
    'emotion-shared-pain':['Deal 2 damage to both heroes as one resolving spell effect. Both packets finish before ordinary Win cleanup; both-zero is a draw, including reversed hearts. Existing hero-loss hooks and heart floor apply. No premature winner after only the first packet.',
        'Use the same deferred spell-effect damage/cleanup boundary as existing own-heart-loss spells; no new Win or payment policy.'],
    'generic-board-sweep':['Capture both current creature boards, then deal 3 damage to every captured creature through ordinary prevention. No chosen target, so Elusive does not exclude a creature. Damage completes before normal defeat, Last Words and Win cleanup. New tokens summoned during damage are outside the original snapshot. Empty boards have no useful cast.',
        'Extend the existing board-snapshot spell pattern to both sides without changing prevention, cleanup or token order.'],
};
export function reviewExpansion11(cards){
    for(const c of cards)if(expansion11Batch.includes(c.id)){
        c.runtimeRelease='expansion-11';c.status='Released in expansion-11 (#129); bounded engineering validation, not classroom balance certification';
        c.acquisition.releaseStatus='Released expansion-11: pack pool';
        c.releaseRevision={issue:129,previousText:c.text,previousTarget:c.target,rationale:clarifications11[c.id][1]};c.text=clarifications11[c.id][0];
    }
}

// #129 expansion-12: two Common Shield supports using existing keyword/buff/draw rules.
export const expansion12Batch=['reason-provisional-proof','imagination-paper-shield'];
const clarifications12={
    'reason-provisional-proof':['Give a friendly creature a fresh ordinary Shield, resetting its consumed marker. If it had effective Guard immediately before this effect, draw one personal card normally. Suppressed or removed Guard does not qualify; normal hand caps, empty decks and Silence still apply.',
        'Pin effective Guard before refreshing Shield and reuse normal draw/prevention; no heal or new resource policy.'],
    'imagination-paper-shield':['Give a friendly creature a fresh ordinary Shield, resetting its consumed marker. If it is an existing colourless token, also give it a lasting +1 attack through normal buffs. An ordinary colourless creature or a coloured token does not qualify. No token is created or reordered; Silence remains authoritative.',
        'Pin colourless-token identity and the existing lasting-buff default, without a new token-order or keyword policy.'],
};
export function reviewExpansion12(cards){
    for(const c of cards)if(expansion12Batch.includes(c.id)){
        c.runtimeRelease='expansion-12';c.status='Released in expansion-12 (#129); bounded engineering validation, not classroom balance certification';
        c.acquisition.releaseStatus='Released expansion-12: pack pool';
        c.releaseRevision={issue:129,previousText:c.text,previousTarget:c.target,rationale:clarifications12[c.id][1]};c.text=clarifications12[c.id][0];
    }
}

// #129 expansion-13: one selected Common creature and ordinary survived-damage response.
export const expansion13Batch=['emotion-spite-sprite'];
export function reviewExpansion13(cards){
    for(const c of cards)if(expansion13Batch.includes(c.id)){
        c.runtimeRelease='expansion-13';c.status='Released in expansion-13 (#129); bounded engineering validation, not classroom balance certification';
        c.acquisition.releaseStatus='Released expansion-13: pack pool';
        c.releaseRevision={issue:129,previousText:c.text,rationale:'Pin positive survived damage after normal prevention, once per global turn on the same instance, and existing controller-next-start buff expiry. Bounce/replay does not reset the turn allowance; no engine or action-budget policy change.'};
        c.text='Once per global turn, after this takes positive damage and survives ordinary prevention, give it +1 attack until its controller at that moment next starts a turn. Shield, lethal damage, Silence and Empty Set do not trigger it. The same instance keeps its allowance through bounce/replay; ordinary leave-play cleanup removes buffs. No attack or card activation is refunded.';
    }
}
