/*
 * Boot: load the save and show the title screen.
 */
(function (root) {
    'use strict';

    const Rift = root.Rift;

    function boot() {
        Rift.State.load();
        // Calm motion (Settings) switches every animation off.
        const applyCalm = () => {
            const s = Rift.State.get();
            root.document.body.classList.toggle('calm-motion', !!(s && s.settings.calm));
        };
        applyCalm();
        Rift.bus.on('state:changed', applyCalm);
        Rift.bus.on('state:replaced', applyCalm);
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
