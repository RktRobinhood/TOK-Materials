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
