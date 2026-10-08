/*
 * Granny's guided card lesson: a thin wrapper that runs the real battle screen in
 * guide mode with the fixed teaching match from js/battle/lesson.js.
 *
 * Rift.Router.go('battle-lesson', { onEnd(won) })   won: true after the final step, false when left
 * Without onEnd the lesson returns to the Collection.
 */
(function (root) {
    'use strict';
    const Rift = root.Rift;

    function mount(container, params) {
        const L = Rift.Battle.Lesson;
        const granny = (Rift.data.speakers || {}).granny;
        const battle = Rift.Screens.get('battle');
        let done = false;
        function end(result) {
            if (done) return;
            done = true;
            const won = !!(result && result.outcome === 'won');
            if (params && typeof params.onEnd === 'function') params.onEnd(won);
            else Rift.Router.replace('collection');
        }
        return battle.mount(container, {
            mode: 'practice',
            seed: L.config().seed,
            opponent: { name: 'Granny Axiom', art: granny ? granny.art : null },
            // The learner's own power, so Granny can point at its button (it stays unused).
            guide: L.guide(Rift.Powers && Rift.State ? Rift.Powers.forAvatar((Rift.State.get() || {}).avatar) : null),
            onEnd: end,
        });
    }

    Rift.Screens.register('battle-lesson', { mount });
})(typeof window !== 'undefined' ? window : globalThis);
