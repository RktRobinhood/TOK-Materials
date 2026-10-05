/* Optional classroom trail and short notes unlocked by checked puzzle wins. */
(function (root) {
    'use strict';
    const R = root.Rift;
    R.data.clues = [
        { id: 'trace', code: 'RIFT-TRACE', title: 'The classroom trace', hint: 'Look for a Rift clue card in the classroom. Scan its QR or copy its short code.',
            lore: 'The rift leaves traces, not answers. Several explanations may fit the same evidence. Ask what would separate them.' },
        { id: 'boole', code: 'BOOLE', title: 'The web trail', hint: 'Who wrote The Laws of Thought, published in 1854? Find the surname on University College Cork’s George Boole site. Enter it as the code.',
            source: 'https://georgeboole.com/boole/life/ucc/lawsofthought/', species: 'booleon',
            lore: 'Booleon can now appear after a win at the Schoolhouse. It is a rare chance, not a promised visit. A truth table checks every possible case.' },
        { id: 'rules', code: 'CHANGE-THE-RULE', title: 'The slide trail', hint: 'Look for a short Rift code in the lesson slides. Copy it here.', axiom: 'age-of-wonder',
            lore: 'Age of Wonder is in your axiom pool. It boosts Imagination cards in battle. A changed starting rule can change which conclusion follows.' },
    ];
    R.data.strategyNotes = {
        'liars-gate': ['Liar’s Gate', 'Test each possible identity against every statement. One matching statement is not enough.'],
        'rule-hunter': ['Rule Hunter', 'Choose a test whose outcomes separate the remaining rules. Examples that fit every rule cannot settle the choice.'],
        venn: ['Venn board', 'A valid conclusion follows from the stated premises. Whether those premises are true is a separate question.'],
        'line-drawer': ['Line Drawer', 'Count odd-degree dots before you draw. An Euler trail has zero or two odd-degree dots.'],
        witness: ['Witness', 'Separate visible evidence from assumptions. A plausible detail may still be unsupported.'],
        village: ['Village deduction', 'Check a whole assignment of identities. Keep it only if every statement fits.'],
        switchboard: ['Switchboard', 'AND needs both inputs, OR needs at least one, and NOT reverses its input.'],
        tower: ['The Tower', 'Look for a case where all premises hold but the conclusion fails. That case disproves the claimed entailment.'],
        prediction: ['Prediction', 'A likely outcome is not guaranteed. Judge a forecast by its stated evidence and probabilities.'],
        'chart-fixer': ['Chart Fixer', 'Read the scale, baseline and labels before comparing shapes. A fair chart makes its comparison clear.'],
        tribunal: ['Tribunal', 'Match your evidence to the exact claim. A relevant contradiction matters more than a loud objection.'],
        sorting: ['Sorting', 'A rule can be consistent and still use a poor measure of need. Ask what it misses and who bears the cost.'],
        'three-act': ['Three Acts', 'Choose the information that the question needs. A model’s answer depends on its assumptions.'],
        oracle: ['Oracle', 'Frequent next words can sound convincing. Fluency alone does not establish truth or understanding.'],
    };
})(typeof window !== 'undefined' ? window : globalThis);
