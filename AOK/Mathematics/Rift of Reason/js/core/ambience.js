/*
 * Background ambience: one seamless loop per scene (data/ambience.js → assets/sfx/el/amb-*.mp3) with
 * two tension layers on top. Volume is the Ambience slider in Settings.
 *
 *   Rift.Ambience.scene('scene/fair')   crossfade to the scene's loop (same loop: nothing changes)
 *   Rift.Ambience.tension(0..1)         0 calm; 0.5 the uneasy drone is fully in; 1 adds the urgent heartbeat
 *
 * Tension changes glide over a few seconds, so danger rises and falls instead of jumping. Screens set
 * the scene; danger clocks (stakes:changed), battles (hero health) and story steps ({ tension: 0.6 },
 * { ambience: 'scene/…' }) set the tension. Silent until the first click or key (browser rule).
 */
(function (root) {
    'use strict';
    const Rift = root.Rift;
    const AC = root.AudioContext || root.webkitAudioContext;
    const FADE = 2;          // seconds for a scene crossfade
    const GLIDE = 3;         // seconds for a tension change
    const LEVEL = 0.6;       // ambience sits under effects and voices

    let ctx = null, master = null;
    const buffers = {};      // file → Promise<AudioBuffer>
    let base = null;         // { name, gain, src }
    const layers = {};       // 'tension-1' | 'tension-2' → { gain, src }
    let wantScene = null, wantTension = 0;

    const volume = () => {
        const s = Rift.State && Rift.State.get();
        const v = s && s.settings && s.settings.ambience;
        return v == null ? 0.5 : v;
    };
    const fileOf = name => ((Rift.data.sfx || {})['amb-' + name] || [])[0] || null;

    function context() {
        if (ctx || !AC) return ctx;
        ctx = new AC();
        master = ctx.createGain();
        master.gain.value = volume() * LEVEL;
        master.connect(ctx.destination);
        return ctx;
    }

    function load(file) {
        if (!buffers[file]) {
            buffers[file] = fetch('assets/sfx/' + file).then(r => r.arrayBuffer()).then(b => ctx.decodeAudioData(b))
                .catch(() => { delete buffers[file]; return null; });
        }
        return buffers[file];
    }

    // A looping source on its own gain, starting silent.
    function start(buffer) {
        const gain = ctx.createGain();
        gain.gain.value = 0;
        gain.connect(master);
        const src = ctx.createBufferSource();
        src.buffer = buffer;
        src.loop = true;
        // Trim the MP3 padding at both ends so the seam does not click.
        src.loopStart = Math.min(0.03, buffer.duration / 4);
        src.loopEnd = Math.max(src.loopStart + 0.1, buffer.duration - 0.03);
        src.connect(gain);
        src.start(0, src.loopStart);
        return { gain, src };
    }

    function ramp(gain, to, secs) {
        const now = ctx.currentTime;
        gain.gain.cancelScheduledValues(now);
        gain.gain.setValueAtTime(gain.gain.value, now);
        gain.gain.linearRampToValueAtTime(to, now + secs);
    }

    function stop(node, secs) {
        if (!node) return;
        ramp(node.gain, 0, secs);
        setTimeout(() => { try { node.src.stop(); node.gain.disconnect(); } catch (e) { /* already gone */ } }, secs * 1000 + 100);
    }

    async function applyScene() {
        if (!context() || ctx.state !== 'running') return;
        const name = wantScene;
        if (base && base.name === name) return;
        const old = base;
        base = name ? { name } : null;
        stop(old, FADE);
        const file = name && fileOf(name);
        if (!file) return;
        const buffer = await load(file);
        if (!buffer || !base || base.name !== name) return;
        Object.assign(base, start(buffer));
        ramp(base.gain, 1, FADE);
    }

    async function applyTension() {
        if (!context() || ctx.state !== 'running') return;
        const t = wantTension;
        const levels = { 'tension-1': Math.min(1, t * 2) * 0.8, 'tension-2': Math.max(0, t * 2 - 1) * 0.9 };
        for (const [name, level] of Object.entries(levels)) {
            let L = layers[name];
            if (!L && level > 0) {
                const file = fileOf(name);
                const buffer = file && await load(file);
                if (!buffer || layers[name]) continue;
                L = layers[name] = start(buffer);
            }
            if (L) ramp(L.gain, level, GLIDE);
        }
        // The calm loop steps back a little as tension takes over.
        if (base && base.gain) ramp(base.gain, 1 - t * 0.35, GLIDE);
    }

    function scene(artId) {
        const map = Rift.data.ambience || { scenes: {} };
        wantScene = artId === null ? null : (map.scenes[artId] || map.fallback || null);
        wantTension = 0;
        applyScene().then(applyTension);
    }

    function tension(x) {
        wantTension = Rift.clamp(+x || 0, 0, 1);
        applyTension();
    }

    // Browsers only allow sound after a click or key press.
    function unlock() {
        if (!context()) return;
        if (ctx.state === 'suspended' && volume() > 0 && !root.document.hidden) ctx.resume().then(() => applyScene().then(applyTension));
    }
    if (root.document) {
        ['pointerdown', 'keydown'].forEach(t => root.document.addEventListener(t, unlock, true));
        root.document.addEventListener('visibilitychange', () => {
            if (!ctx) return;
            if (root.document.hidden) ctx.suspend(); else unlock();
        });
    }

    if (Rift.bus) {
        const applyVolume = () => {
            if (!ctx) return;
            const v = volume();
            ramp(master, v * LEVEL, 0.3);
            if (v <= 0) ctx.suspend(); else unlock();
        };
        Rift.bus.on('state:changed', applyVolume);
        Rift.bus.on('state:replaced', applyVolume);
        // A danger clock filling (or easing) sets the tension; a finished clock calms down.
        Rift.bus.on('stakes:changed', ({ id, clock }) => {
            const size = Rift.Stakes ? Rift.Stakes.size(id) : 6;
            tension(!clock || clock.done ? 0 : (clock.n || 0) / size);
        });
    }

    // What is playing (for the dev benches and tests).
    const now = () => ({ scene: base && base.name, playing: !!(base && base.src), tension: wantTension, state: ctx ? ctx.state : 'none' });

    Rift.Ambience = { scene, tension, now };
})(typeof window !== 'undefined' ? window : globalThis);
