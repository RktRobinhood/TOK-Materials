// Staged plot-card runtime ledger. Never grants cards or changes pack exclusion.
export const plotBatch = ['generic-fair-rest','generic-conservative-plans','generic-quiet-reset',
    'reason-inference-heron','emotion-heartfire-hawk','perception-exposure-eagle','language-contract-coyote','imagination-cloud-castle-crab','memory-second-chance-salamander',
    'reason-complete-argument','emotion-shared-vulnerability','perception-observed-pattern','language-consensus','imagination-living-possibilities','memory-recovered-story','generic-the-common-good',
    'generic-public-rules','generic-the-last-page'];
const clarifications = {
    'emotion-heartfire-hawk':'Once per turn, after your hero loses hearts during your turn, your oldest other creature gains 1 attack this turn.',
    'language-contract-coyote':'Your first spell each turn targeting a friendly creature costs 1 less, minimum 0. Multiple copies do not stack.',
    'imagination-cloud-castle-crab':'Guard. The first time each turn this survives damage, summon a colourless 1/1 paper token if you have board space.',
    'memory-second-chance-salamander':'Entrance: return a defeated creature with printed cost 3 or less to hand; it gains 1 maximum health on its next play only.',
    'language-consensus':'Win by enemy hero reaching 0, or by ending your own turn with 3 Language creatures and 3 changed Axiom categories, including Win.',
    'perception-observed-pattern':'Win by enemy hero reaching 0, or by ending your own turn with 3 Perception creatures and no damaged friendly creatures.',
    'memory-recovered-story':'Win by enemy hero reaching 0, or by ending your own turn with 3 Memory creatures after recovering 2 distinct discard cards that turn.',
    'generic-public-rules':'While active, each newly drawn Axiom stays public until played or discarded. Existing hands and personal cards stay private.',
};
export function reviewStoryCards(cards) {
    for (const c of cards) if (plotBatch.includes(c.id)) {
        c.runtimeRelease='plot-1';
        c.status='plot-1 runtime; once-only story source, never packs; see story-132 acceptance report';
        c.acquisition.assignmentStatus='Implemented #132: completed-node proof plus canonical once-only two-normal-copy receipt';
        if(clarifications[c.id]){
            c.plotRevision={issue:132,previousText:c.text,rationale:'Pin deterministic targets, bounded first triggers, printed recovery cost and public own-turn-end goal/knowledge policy before runtime release.'};
            c.text=clarifications[c.id];
        }
    }
}
