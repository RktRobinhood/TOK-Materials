/* Local optional clues: fixed rewards and no network or arbitrary code actions. */
(function (root) {
    'use strict';
    const R = root.Rift;
    function redeem(state, input) {
        const code = String(input || '').trim().toUpperCase().replace(/[ _]+/g, '-');
        const entry = (R.data.clues || []).find(c => c.code === code);
        if (!entry) throw new Error('That clue code is not recognised. Check its letters and dashes.');
        const flag = 'clue:' + entry.id;
        if (state.flags[flag]) return { fresh: false, entry };
        state.flags[flag] = true;
        if (!state.rumours.includes(entry.id)) state.rumours.push(entry.id);
        if (entry.species) state.flags['rumour:' + entry.species] = true;
        if (entry.axiom && !state.axioms.includes(entry.axiom)) state.axioms.push(entry.axiom);
        return { fresh: true, entry };
    }
    function recordWin(state, id) {
        if (!Object.prototype.hasOwnProperty.call(R.data.strategyNotes || {}, id)) return;
        state.flags['strategy:' + id] = true;
    }
    function notes(state) {
        return Object.entries(R.data.strategyNotes || {}).filter(([id]) => state.flags['strategy:' + id]).map(([id, [title, text]]) => ({ id, title, text }));
    }
    R.Rumours = { redeem, recordWin, notes };
})(typeof window !== 'undefined' ? window : globalThis);
