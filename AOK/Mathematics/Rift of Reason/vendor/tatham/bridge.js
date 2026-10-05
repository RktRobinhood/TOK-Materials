/* Local readiness/error bridge; no automatic claim of puzzle completion. */
(function () {
    'use strict';
    const puzzle = document.body.dataset.puzzle;
    const target = location.protocol === 'file:' ? '*' : location.origin;
    window.RiftPuzzleReady = function () {
        const apology = document.getElementById('apology');
        if (apology) apology.remove();
        parent.postMessage({ type: 'rift-bonus-ready', puzzle }, target);
    };
    window.RiftPuzzleFailure = function () {
        const apology = document.getElementById('apology');
        if (apology) apology.textContent = 'This puzzle could not start. Return to the map and try again.';
        parent.postMessage({ type: 'rift-bonus-error', puzzle }, target);
    };
})();
