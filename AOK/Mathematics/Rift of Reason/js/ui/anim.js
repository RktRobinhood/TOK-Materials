/*
 * Rift.Motion: short one-shot animations for puzzles and screens (#66). The battle screen keeps
 * its own event clock in js/screens/battle.js; this is the same idea for everything else.
 *
 * Every call plays once (never loops), returns the Animation (or null when the browser has no
 * Web Animations) and changes no game state. Calm motion (body.calm-motion) and the system's
 * reduced-motion setting get a gentle fade instead of movement, scale or flashes.
 *
 *   Motion.calm()              → true when movement should be replaced by fades
 *   Motion.play(node, frames, options, still)   frames normally; `still` (default: a short fade) when calm
 *   Motion.settle(node)        a correct answer or a piece that fits: clicks into place with a glow
 *   Motion.nudge(node)         "here is what broke": one movement out and back, never a shake
 *   Motion.reveal(node, i)     a clue or a new mark arrives; i staggers a list (70 ms apart)
 *   Motion.glow(node, colour)  draws the eye once (a hint, a lit lamp, a caught creature)
 *   Motion.pop(node)           a counter or icon that just changed
 *   Motion.draw(path, opts)    an SVG line draws itself from its start ({ reverse: true }: from its end)
 *   Motion.cancel(scope)       stops every running motion inside scope (all when omitted), and
 *                              undoes any finished one that holds its end state (fill forwards)
 */
(function (root) {
    'use strict';

    const Rift = root.Rift;
    const live = new Set();

    function calm() {
        const doc = root.document;
        if (doc && doc.body && doc.body.classList && doc.body.classList.contains('calm-motion')) return true;
        try { return !!(root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches); } catch (e) { return false; }
    }

    function play(node, frames, options, still) {
        if (!node || !node.animate) return null;
        const quiet = calm();
        let motion;
        try {
            motion = node.animate(quiet ? still || [{ opacity: 0.55 }, { opacity: 1 }] : frames,
                Object.assign({ duration: 300, easing: 'ease-out' }, options, { iterations: 1 }));
        } catch (e) { return null; }
        if (!motion) return null;
        live.add(motion);
        // A motion that holds its end state (fill forwards) stays cancellable after it finishes,
        // so cancel(scope) can still put the node back (e.g. an escaped visitor for a new try).
        const holds = options && (options.fill === 'forwards' || options.fill === 'both');
        const done = () => live.delete(motion);
        if (motion.addEventListener) { if (!holds) motion.addEventListener('finish', done); motion.addEventListener('cancel', done); }
        return motion;
    }

    function cancel(scope) {
        live.forEach(motion => {
            const target = motion.effect && motion.effect.target;
            if (scope && !(target && scope.contains && scope.contains(target))) return;
            live.delete(motion);
            try { motion.cancel(); } catch (e) { /* already gone */ }
        });
    }

    const settle = (node, opts) => play(node,
        [{ scale: '1.035', filter: 'brightness(1.25) drop-shadow(0 0 10px #f2b632)' }, { scale: '1', filter: 'none' }],
        Object.assign({ duration: 380 }, opts), [{ opacity: 0.6 }, { opacity: 1 }]);

    const nudge = (node, opts) => play(node,
        [{ translate: '0 0', filter: 'none' }, { translate: '7px 0', filter: 'drop-shadow(0 0 6px #e8384f)', offset: 0.35 }, { translate: '0 0', filter: 'none' }],
        Object.assign({ duration: 320, easing: 'ease-in-out' }, opts), [{ opacity: 0.5 }, { opacity: 1 }]);

    const reveal = (node, i, opts) => play(node,
        [{ opacity: 0, translate: '0 8px' }, { opacity: 1, translate: '0 0' }],
        Object.assign({ duration: 280, delay: (i || 0) * 70, fill: 'backwards' }, opts), [{ opacity: 0 }, { opacity: 1 }]);

    const glow = (node, colour, opts) => play(node,
        [{ filter: 'none' }, { filter: 'brightness(1.2) drop-shadow(0 0 10px ' + (colour || '#f2b632') + ')', offset: 0.4 }, { filter: 'none' }],
        Object.assign({ duration: 560 }, opts), [{ opacity: 0.6 }, { opacity: 1 }]);

    const pop = (node, opts) => play(node,
        [{ scale: '1' }, { scale: '1.2', offset: 0.35 }, { scale: '1' }],
        Object.assign({ duration: 300 }, opts));

    // An SVG line or path draws from its start (or its end, the way the player drew it).
    // Calm motion fades it in instead.
    function draw(path, opts) {
        if (!path || !path.animate) return null;
        const o = Object.assign({}, opts), from = o.reverse ? -1 : 1;
        delete o.reverse;
        let length = 0;
        try { length = path.getTotalLength ? path.getTotalLength() : 0; } catch (e) { length = 0; }
        if (!length) return reveal(path, 0, o);
        return play(path, [{ strokeDasharray: length, strokeDashoffset: from * length }, { strokeDasharray: length, strokeDashoffset: 0 }],
            Object.assign({ duration: 260, easing: 'ease-out' }, o), [{ opacity: 0 }, { opacity: 1 }]);
    }

    Rift.Motion = { calm, play, cancel, settle, nudge, reveal, glow, pop, draw };
})(typeof window !== 'undefined' ? window : globalThis);
