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
        Rift.World.catchUpWallet();
        if (Rift.Acquisition) {
            Rift.Acquisition.catchUp();
            Rift.bus.on('state:changed', Rift.Acquisition.catchUp);
            Rift.bus.on('state:replaced', Rift.Acquisition.catchUp);
            Rift.bus.on('plot-cards:granted', got => Rift.UI.toast('Story cards earned: ' + got.filter(r => r.granted).map(r => {
                const defs = Rift.data[{creature:'creatures',tactic:'tactics',axiom:'axioms'}[r.kind]];
                return defs[r.id].name + ' ×' + r.granted;
            }).join(', ') + '. Open Collection.', 6000));
        }
        Rift.bus.on('state:replaced', () => { Rift.State.ensureStarter(); Rift.World.catchUpCards(); Rift.World.catchUpWallet(); });
        // Calm motion reduces animation; catch games use static paths in every mode.
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
