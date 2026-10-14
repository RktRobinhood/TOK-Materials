/*
 * Boot: load the save and show the title screen.
 */
(function (root) {
    'use strict';

    const Rift = root.Rift;

    function boot() {
        Rift.State.load();
        // Catch-up (#114): an adventure from before the owned starter decks gets its avatar type's
        // starter once (also after loading a backup code or the previous save). Never repeats.
        Rift.State.ensureStarter();
        // Station card rewards (#124) for places finished before they existed: each slot pays once.
        Rift.World.catchUpCards();
        Rift.bus.on('state:replaced', () => { Rift.State.ensureStarter(); Rift.World.catchUpCards(); });
        // Calm motion reduces animation and keeps the catch ring still.
        const applyCalm = () => {
            const s = Rift.State.get();
            root.document.body.classList.toggle('calm-motion', !!(s && s.settings.calm));
        };
        applyCalm();
        Rift.bus.on('state:changed', applyCalm);
        Rift.bus.on('state:replaced', applyCalm);
        Rift.Router.replace('title');
        // Native button clicks include keyboard activation. Specific puzzle
        // cues still play; the shared throttle suppresses duplicate UI clicks.
        root.document.addEventListener('click', event => {
            const control = event.target.closest && event.target.closest('button, summary, a, [role="button"], input[type="checkbox"]');
            if (control && !control.disabled) Rift.Audio.sfx('click', { volume: 0.5 });
        }, true);
    }

    if (root.document.readyState === 'loading') root.document.addEventListener('DOMContentLoaded', boot);
    else boot();
})(window);
