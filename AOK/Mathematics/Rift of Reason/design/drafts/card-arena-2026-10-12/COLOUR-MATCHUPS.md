# Colour matchup revision — teacher feedback

**Settled 14 October; implemented under #127 on 20 October:** the teacher approved the six-colour model and floor/zero semantics below. Preserve the old five-colour clockwise order and append Memory: Reason, Emotion, Language, Perception, Imagination, Memory. This makes Reason/Perception, Emotion/Imagination and Language/Memory the three opposite neutral pairs. The 17 October hexagon reference delegates which colour occupies each role. No further model approval is required. The notes below retain the original proposal history.

12 October 2026. Current code has six card colours (Reason, Emotion, Perception, Language, Imagination, Memory), although only five avatar types. The existing wheel adds +1 against one opposing colour; it does not subtract for weakness.

Teacher direction: expose target-dependent Strong against (+1 attack) and Weak against (-1 attack), with a proposed minimum effective attack of one. Show these while hovering/dragging onto a target, not as permanent general-board buffs. Preview both fighters and actual predicted damage using the authoritative engine, including combat Axioms.

Recommended six-colour model: preserve current wheel order; each colour beats the next two, loses to the previous two, and is neutral against the opposite colour and itself. Colourless creatures/heroes have no matchup modifier. This yields equal matchup coverage without removing Emotion. The five-colour version would have two strong/two weak with no other neutral matchup.

Floor proposal to settle: weakness cannot reduce an otherwise positive attack below one; zero-attack creatures are not automatically made attackers. Shield, immunity and prevention can still result in zero damage. Resolve target-specific effective attack before combat comparisons, so Underdog and reversed-wheel rules remain coherent. Clear transient previews on cancel, invalid target, release, resize and navigation; do not mutate stored/base attack while aiming.

Use a small labelled wheel button on the board, opening a readable diagram/table with icons and text (not colour alone). Keyboard/click/touch gets the same explanation. Teach after the board is integrated: neutral fight, strong matchup, weak matchup, minimum-one case, Shield zero damage and an Axiom changing combat. Reuse a code-native SVG diagram; no bitmap or sound generation required.
