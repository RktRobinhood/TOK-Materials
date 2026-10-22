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
