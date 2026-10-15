/*
 * Background audio: one seamless loop per scene, with two optional tension layers.
 * Ordinary scene loops use the Ambience slider; the title theme uses Music & jingles.
 *
 *   Rift.Ambience.scene('scene/fair')   crossfade to the scene's loop (same loop: nothing changes)
 *   Rift.Ambience.tension(0..1)         0 calm; 0.5 the uneasy drone is fully in; 1 adds the urgent heartbeat
 *
 * Tension changes glide over a few seconds. Silent until the first click or key (browser rule).
 * Native media playback supports file:// previews, where browsers cannot fetch MP3 bytes.
 */
(function (root) {
    'use strict';
    const Rift = root.Rift;
    const AC = root.AudioContext || root.webkitAudioContext;
    const FADE = 2;          // seconds for a scene crossfade
    const GLIDE = 3;         // seconds for a tension change
    const LEVEL = 0.6;       // ambience sits under effects and voices
    const localFiles = root.location && root.location.protocol === 'file:' && root.Audio;

    let ctx = null, held = false, pendingScene = null, sceneVersion = 0;
    const masters = {};
    const buffers = {};      // full URL → Promise<AudioBuffer>
    const native = new Set();
    let base = null;         // { name, bus, level, gain, src }
    let bed = null, pendingBed = null;
    const layers = {};
    let wantScene = null, wantTension = 0, wantArt = null;   // wantArt: the art id last asked for (a cutscene restores it)

    function volume(bus) {
        const s = Rift.State && Rift.State.get();
        const v = s && s.settings && s.settings[bus];
        return Rift.clamp(v == null ? 0.5 : v, 0, 1);
    }
    const busLevel = bus => volume(bus) * (bus === 'music' ? 1 : LEVEL);
    const audible = () => volume('ambience') > 0 || volume('music') > 0;
    const hidden = () => !!(root.document && root.document.hidden);

    function trackOf(name) {
        if (!name) return null;
        const track = ((Rift.data.ambience || {}).tracks || {})[name];
        if (track) return { name, bus: track.bus === 'music' ? 'music' : 'ambience', level: track.level == null ? 1 : track.level, trim: track.trim !== false, file: track.file };
        const file = ((Rift.data.sfx || {})['amb-' + name] || [])[0];
        return file ? { name, bus: 'ambience', level: 1, trim: true, file: 'assets/sfx/' + file } : null;
    }

    function context() {
        if (ctx || !AC) return ctx;
        ctx = new AC();
        ['ambience', 'music'].forEach(bus => {
            const gain = masters[bus] = ctx.createGain();
            gain.gain.value = busLevel(bus);
            gain.connect(ctx.destination);
        });
        return ctx;
    }

    function load(file) {
        if (!buffers[file]) {
            buffers[file] = fetch(file).then(r => {
                if (r.ok === false) throw new Error('Missing background audio');
                return r.arrayBuffer();
            }).then(b => ctx.decodeAudioData(b)).catch(() => { delete buffers[file]; return null; });
        }
        return buffers[file];
    }

    function nativeVolume(gain) {
        gain.audio.volume = Rift.clamp(gain.gain.value * busLevel(gain.bus), 0, 1);
    }

    // Browsers can play local media even when fetch(file://...) is blocked.
    function startLocal(track) {
        const audio = new root.Audio(track.file);
        audio.loop = true;
        audio.volume = 0;
        const gain = { audio, bus: track.bus, gain: { value: 0 }, frame: null,
            disconnect() { clearTimeout(this.frame); native.delete(this); } };
        native.add(gain);
        audio.play().catch(() => { /* browser autoplay or unavailable file */ });
        return { gain, src: { stop() { audio.pause(); gain.disconnect(); } } };
    }

    // A looping source on its own gain, starting silent.
    function start(buffer, track) {
        if (localFiles) return startLocal(track);
        const gain = ctx.createGain();
        gain.gain.value = 0;
        gain.connect(masters[track.bus]);
        const src = ctx.createBufferSource();
        src.buffer = buffer;
        src.loop = true;
        // Older ambience files have padding. The title theme uses its whole decoded loop.
        src.loopStart = track.trim ? Math.min(0.03, buffer.duration / 4) : 0;
        src.loopEnd = track.trim ? Math.max(src.loopStart + 0.1, buffer.duration - 0.03) : buffer.duration;
        src.connect(gain);
        src.start(0, src.loopStart);
        return { gain, src };
    }

    function ramp(gain, to, secs) {
        if (gain.audio) {
            clearTimeout(gain.frame);
            const from = gain.gain.value, begun = Date.now();
            const tick = () => {
                const progress = secs <= 0 ? 1 : Math.min(1, (Date.now() - begun) / (secs * 1000));
                gain.gain.value = from + (to - from) * progress;
                nativeVolume(gain);
                if (progress < 1) gain.frame = setTimeout(tick, 40);
            };
            tick();
            return;
        }
        const now = ctx.currentTime;
        gain.gain.cancelScheduledValues(now);
        gain.gain.setValueAtTime(gain.gain.value, now);
        gain.gain.linearRampToValueAtTime(to, now + secs);
    }

    function stop(node, secs) {
        if (!node || !node.gain || !node.src) return;
        ramp(node.gain, 0, secs);
        setTimeout(() => { try { node.src.stop(); node.gain.disconnect(); } catch (e) { /* already gone */ } }, secs * 1000 + 100);
    }

    // Keep the old loop until its replacement has loaded; stale requests never acquire the scene.
    async function applyScene() {
        if (held || !context() || ctx.state !== 'running') return;
        const name = wantScene;
        if (base && base.name === name) return;
        if (!name) { stop(base, FADE); base = null; return; }
        if (pendingScene && pendingScene.name === name && pendingScene.version === sceneVersion) return pendingScene.promise;
        const track = trackOf(name);
        if (!track || !track.file) { stop(base, FADE); base = null; return; }
        const request = pendingScene = { name, version: sceneVersion };
        request.promise = (async () => {
            const buffer = localFiles ? null : await load(track.file);
            if ((!localFiles && !buffer) || held || ctx.state !== 'running' || pendingScene !== request || request.version !== sceneVersion || wantScene !== name) return;
            const old = base;
            base = Object.assign({}, track, start(buffer, track));
            ramp(base.gain, track.level, FADE);
            stop(old, FADE);
        })().finally(() => { if (pendingScene === request) pendingScene = null; });
        return request.promise;
    }

    // An optional physical room recording under the score, on its own volume bus.
    async function applyBed() {
        if (held || !context() || ctx.state !== 'running') return;
        const name = ((Rift.data.ambience || {}).beds || {})[wantArt] || null;
        if (bed && bed.name === name) return;
        if (!name) { stop(bed, FADE); bed = null; pendingBed = null; return; }
        if (pendingBed && pendingBed.name === name && pendingBed.version === sceneVersion) return pendingBed.promise;
        const track = trackOf(name);
        if (!track || !track.file) { stop(bed, FADE); bed = null; return; }
        const request = pendingBed = {name, version: sceneVersion};
        request.promise = (async () => {
            const buffer = localFiles ? null : await load(track.file);
            if ((!localFiles && !buffer) || held || ctx.state !== 'running' || pendingBed !== request || request.version !== sceneVersion) return;
            const old = bed;
            bed = Object.assign({}, track, start(buffer, track));
            ramp(bed.gain, track.level, FADE);
            stop(old, FADE);
        })().finally(() => { if (pendingBed === request) pendingBed = null; });
        return request.promise;
    }

    function applyBackground() { return Promise.all([applyScene(), applyBed()]).then(applyTension); }

    function tensionLevel(name) {
        const track = trackOf(wantScene);
        const t = track && track.bus === 'music' ? 0 : wantTension;
        return name === 'tension-1' ? Math.min(1, t * 2) * 0.8 : Math.max(0, t * 2 - 1) * 0.9;
    }

    async function applyTension() {
        if (held || !context() || ctx.state !== 'running') return;
        for (const name of ['tension-1', 'tension-2']) {
            let L = layers[name];
            if (!L && tensionLevel(name) > 0) {
                const track = trackOf(name);
                if (!track) continue;
                const buffer = localFiles ? null : await load(track.file);
                if ((!localFiles && !buffer) || held || ctx.state !== 'running') continue;
                // A scene or danger change may have happened while the file was decoding.
                if (tensionLevel(name) <= 0) continue;
                L = layers[name] || (layers[name] = start(buffer, track));
            }
            if (L) ramp(L.gain, tensionLevel(name), GLIDE);
        }
        if (base && base.gain) ramp(base.gain, base.level * (base.bus === 'music' ? 1 : 1 - wantTension * 0.35), GLIDE);
    }

    function scene(artId) {
        const map = Rift.data.ambience || { scenes: {} };
        const name = artId === null ? null : ((map.scenes || {})[artId] || map.fallback || null);
        if (name !== wantScene || artId !== wantArt) sceneVersion++;
        wantArt = artId;
        wantScene = name;
        wantTension = 0;
        applyBackground();
    }

    function tension(x) {
        wantTension = Rift.clamp(+x || 0, 0, 1);
        applyTension();
    }

    function pauseNative() { native.forEach(gain => gain.audio.pause()); }
    function resumeNative() {
        native.forEach(gain => {
            nativeVolume(gain);
            if (busLevel(gain.bus) > 0) gain.audio.play().catch(() => { /* unavailable audio */ });
        });
    }

    // Browsers only allow sound after a click or key press.
    function unlock() {
        if (held || hidden() || !audible() || !context()) return;
        const ready = () => {
            if (held || hidden() || !audible()) { ctx.suspend(); pauseNative(); return; }
            resumeNative();
            applyBackground();
        };
        if (ctx.state === 'suspended') ctx.resume().then(ready);
        else if (ctx.state === 'running') ready();
    }
    if (root.document) {
        ['pointerdown', 'keydown'].forEach(t => root.document.addEventListener(t, unlock, true));
        root.document.addEventListener('visibilitychange', () => {
            if (!ctx) return;
            if (hidden()) { ctx.suspend(); pauseNative(); } else unlock();
        });
    }

    if (Rift.bus) {
        const applyVolume = () => {
            if (!ctx) return;
            ['ambience', 'music'].forEach(bus => ramp(masters[bus], busLevel(bus), 0.3));
            native.forEach(nativeVolume);
            if (!audible()) { ctx.suspend(); pauseNative(); } else unlock();
        };
        Rift.bus.on('state:changed', applyVolume);
        Rift.bus.on('state:replaced', applyVolume);
        Rift.bus.on('stakes:changed', ({ id, clock }) => {
            const size = Rift.Stakes ? Rift.Stakes.size(id) : 6;
            tension(!clock || clock.done ? 0 : (clock.n || 0) / size);
        });
    }

    const now = () => ({ scene: base && base.name, bed: bed && bed.name, art: wantArt, playing: !!(base && base.src), tension: wantTension, state: ctx ? ctx.state : 'none' });

    // Give the optional trailer exclusive sound without changing saved settings.
    function hold() { held = true; if (ctx) ctx.suspend(); pauseNative(); }
    function release() { held = false; unlock(); }

    Rift.Ambience = { scene, tension, now, hold, release };
})(typeof window !== 'undefined' ? window : globalThis);
