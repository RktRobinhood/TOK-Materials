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
