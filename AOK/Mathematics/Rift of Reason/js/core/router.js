/*
 * Screens and the router.
 *
 * Rift.Screens.register('battle', {
 *   mount(root, params) { ... build DOM into root ...; return { destroy() {} }; }
 * });
 * Rift.Router.go('battle', { opponent: 'trainer-1' });
 * Rift.Router.back();            // returns to the previous screen (e.g. the map)
 *
 * One screen is mounted at a time inside #screen. Overlays (dialogue, toasts,
 * menus) live in #overlay and are managed by their own modules.
 */
(function (root) {
    'use strict';

    const Rift = root.Rift;
    const screens = {};
    const history = [];
    let active = null;

    const Screens = {
        register(name, def) { screens[name] = def; },
        get(name) { return screens[name]; },
    };

    function host() {
        return root.document.getElementById('screen');
    }

    function mount(name, params) {
        const def = screens[name];
        if (!def) throw new Error('Unknown screen: ' + name);
        if (active && active.handle && active.handle.destroy) {
            try { active.handle.destroy(); } catch (e) { console.error('[Rift] destroy', active.name, e); }
        }
        // A script or voice from the old screen must not carry on over the new one.
        if (Rift.Dialogue && Rift.Dialogue.abortAll) Rift.Dialogue.abortAll();
        else if (Rift.Audio && Rift.Audio.stopVoice) Rift.Audio.stopVoice();
        const node = host();
        node.innerHTML = '';
        node.className = 'screen screen-' + name;
        active = { name, params: params || {}, handle: null };
        active.handle = def.mount(node, active.params) || null;
        Rift.bus.emit('screen:changed', { name, params: active.params });
    }

    const Router = {
        go(name, params) {
            if (active) history.push({ name: active.name, params: active.params });
            if (history.length > 20) history.shift();
            mount(name, params);
        },
        replace(name, params) { mount(name, params); },
        back(fallback) {
            const prev = history.pop();
            if (prev) mount(prev.name, prev.params);
            else mount(fallback || 'map', {});
        },
        current() { return active && active.name; },
        // The mounted screen's handle (playtest scripts use e.g. handle().debugSolve()).
        handle() { return active && active.handle; },
    };

    Rift.Screens = Screens;
    Rift.Router = Router;
})(typeof window !== 'undefined' ? window : globalThis);
