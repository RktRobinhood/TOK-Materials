/*
 * Boot: load the save and show the title screen.
 */
(function (root) {
    'use strict';

    const Rift = root.Rift;

    function boot() {
        Rift.State.load();
        Rift.Router.replace('title');
        // Unlock audio on the first interaction (browsers block autoplay).
        root.document.addEventListener('pointerdown', function unlock() {
            Rift.Audio.sfx('click', { volume: 0.01 });
            root.document.removeEventListener('pointerdown', unlock);
        });
    }

    if (root.document.readyState === 'loading') root.document.addEventListener('DOMContentLoaded', boot);
    else boot();
})(window);
