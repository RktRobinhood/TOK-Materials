# Jimmy Fowlon draft distinctness — #144

13 October 2026. Base: 5646c14424045fcbd9b367a19507160a791ebb25. This resolves a proposal overlap; it does not release a runtime creature.

The old Entrance gave one ally +1 attack for its next creature attack this turn. Cheer Chick gives one ally +1 attack this turn; shipped Speedcheeta also buffs allied attacks. The ordinary one-attack limit made the shorter expiry little strategic difference. The original full card/persona proposal is retained in jimmy-distinctness-144-before.json.

**Selected hook — Let the Guest Speak:** `Entrance: unfreeze another friendly creature.` The nervous guest freezes, and the little host gives them the floor. Cost 1, attack 1, health 2, Language, common, stable mechanical/art IDs and pack eligibility remain unchanged; numbers are provisional tuning. The portrait cue changes from a cue card to one plain brass microphone, avoiding another book/pad accessory.

The audit covered all 210 catalogue proposals, shipped creature/tactic/Axiom/ability/item sources, and the separate starter support pack. No allied thaw effect was found. Freeze is used by shipped lectures, Pause for Thought, catches in battle and a later tactic. Unlike Cheer Chick/Speedcheeta, this restores access to an already available action rather than changing attack. Unlike Comma Crab/Footnote Finch it neither heals nor buffs; unlike arrival-readiness rules it never grants Swift or resets sleeping. Language gains a specific answer to an interruption; removal, Guard, another Freeze and spent action budgets still counter it. It can be a plain 1/2 when no frozen guest is available. Activation discounts were considered but kept aside because Prepared Response already supplies a related sequencing incentive.

Catalogue-source.mjs and persona-source.mjs are authoritative and regenerate their JSON/Markdown files together. Exactly one catalogue entry changes (text, tags and counterplay), with counts, IDs, colour, rarity, costs/stats, art ID, acquisition and existing gates identical to the base. The bulk #145 inventory remains a historical frozen snapshot during this design issue; a subsequent explicitly recorded adoption must retain its old contract before Jimmy art is generated. #109/#123 remain mechanical release gates. No save, runtime script, audio, voice-manifest, image or grant changes are included.

Future #123 implementation checks:

1. Clear only Freeze on one other friendly on-board frozen creature. Current engine stores a Boolean; clear any associated expiry too if a future schema adds one. A later Freeze still works.
2. Awake unused guests can act; sleeping, spent attacks/activation, energy costs and player/Axiom limits remain. No Swift, extra play, attack or activation.
3. Exclude Jimmy, enemies and off-board cards. No legal guest means paid creature entry succeeds and Entrance fizzles without refund or a stranded choice.
4. Each normally paid re-entry may thaw once. Two copies may choose separate guests; no identity duplication or counter reset. Normal copy quotas remain.
5. Disabled/silenced Entrance does nothing. Re-enabling abilities never replays a missed Entrance.
6. Keep existing enemy-on-play → Entrance → cleanup ordering; revalidate target ownership/presence and fizzle vanished targets. Legal previews and resolution agree.

Relevant runtime seams: js/battle/engine.js (canAttack, canActivateNow, entranceOf, target generation and doPlay); frozen is currently a Boolean. The implementation is intentionally deferred to #123.

Validation: both planning/persona validators pass; 210 concepts, six × 28 coloured plus 42 generic, 72 creatures, 192 pack candidates and 18 story-only assignments remain. Automated base comparison confirms exactly one changed card and no protected-field/count changes. Required full-suite and independent Standards/Spec results will be recorded before publication.

Final acceptance: both independent reviews report zero findings (Standards: 0 hard breaches / 0 material smells; Spec: 0 findings). Full suite 823 tests, 822 pass, 1 skip, 0 fail, 129984.6861ms; process exited 0. See jimmy-distinctness-144-full-tests.txt. Both draft validators and exact base comparison passed. No runtime changes require browser gameplay acceptance.
