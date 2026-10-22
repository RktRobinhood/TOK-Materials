/*
 * Sound effects and voices.
 *
 * SFX come from Kenney CC0 packs listed in data/sfx.js (never synthesized
 * beeps). Voices are pre-rendered MP3s listed in data/voice-manifest.js; a line
 * without a file stays silent and is only text on screen. The browser's own
 * speechSynthesis is never used: it sounded too poor. Avatars never speak.
 */
(function (root) {
    'use strict';

    const Rift = root.Rift;
    const lastPlayed = {};
    const cache = {};
    // Four independent voices maximum; a new cue replaces the previous cue
    // on its bus. Files peak at -13 dB, leaving headroom for the whole mix.
    const playing = {};
    const music = new Set(['caught', 'jingle', 'win', 'lose']);
    const uiSounds = new Set(['click', 'open', 'close', 'count', 'throw', 'block']);
    let currentVoice = null;
    let finishVoice = null;

    function settings() {
        const s = Rift.State && Rift.State.get();
        return (s && s.settings) || { music: 0.5, sfx: 0.8, voice: 1 };
    }

    function sfx(name, opts) {
        const list = (Rift.data.sfx || {})[name];
        if (!list || !list.length) return;
        const o = opts || {};
        const bus = o.bus || (music.has(name) ? 'music' : name === 'step' ? 'step' : uiSounds.has(name) ? 'ui' : 'effect');
        const volume = Rift.clamp(settings()[bus === 'music' ? 'music' : 'sfx'] * (o.volume == null ? 1 : o.volume), 0, 1);
        if (volume <= 0) return;
        const now = Date.now();
        // Throttle so rapid clicks don't stack into noise.
        if (lastPlayed[name] != null && now - lastPlayed[name] < (o.minGap == null ? 80 : o.minGap)) return;
        lastPlayed[name] = now;
        const file = list[Math.floor(Math.random() * list.length)];
        try {
            if (playing[bus]) playing[bus].pause();
            const a = (cache[file] || (cache[file] = new Audio('assets/sfx/' + file))).cloneNode();
            playing[bus] = a;
            // Keep spoken instructions clear while effects play underneath.
            a.volume = volume * (currentVoice ? 0.35 : 1);
            const clear = () => { if (playing[bus] === a) delete playing[bus]; };
            a.onended = clear;
            a.onerror = clear;
            a.play().catch(clear);
        } catch (e) { /* audio unavailable */ }
    }

    function stopSounds() {
        Object.keys(playing).forEach(bus => { playing[bus].pause(); delete playing[bus]; });
    }

    // ---- voices ----------------------------------------------------------------

    // Pause first: the line's finish() clears currentVoice, so calling it first
    // left the old recording playing under the next one.
    function stopVoice() {
        const a = currentVoice;
        currentVoice = null;
        if (a) { try { a.pause(); } catch (e) { /* ignore */ } }
        if (finishVoice) { const finish = finishVoice; finishVoice = null; finish(); }
    }

    // Plays a line's recording. Resolves when it ends, or at once when the line has
    // no recording or it fails to play: then the line is text on screen only.
    function speak(line) {
        stopVoice();
        const vol = settings().voice;
        if (!line || !line.text || vol <= 0 || line.speaker === 'avatar') return Promise.resolve();
        const manifest = Rift.data.voices || {};
        const file = line.voice && manifest[line.voice];
        if (!file) return Promise.resolve();
        return new Promise(resolve => {
            const a = new Audio('assets/voice/' + file);
            a.volume = Rift.clamp(vol, 0, 1);
            const finish = () => {
                if (currentVoice === a) currentVoice = null;
                if (finishVoice === finish) finishVoice = null;
                resolve();
            };
            finishVoice = finish;
            a.onended = finish;
            a.onerror = finish;
            currentVoice = a;
            a.play().catch(finish);
        });
    }

    // A mute/volume change also applies to sounds already in progress.
    if (Rift.bus) {
        let levels = { sfx: settings().sfx, music: settings().music, voice: settings().voice };
        const applyLevels = () => {
            const next = settings();
            if (next.sfx !== levels.sfx || next.music !== levels.music) stopSounds();
            if (next.voice !== levels.voice) {
                if (next.voice <= 0) stopVoice();
                else if (currentVoice) currentVoice.volume = Rift.clamp(next.voice, 0, 1);
            }
            levels = { sfx: next.sfx, music: next.music, voice: next.voice };
        };
        Rift.bus.on('state:changed', applyLevels);
        Rift.bus.on('state:replaced', applyLevels);
    }
    // True while a recorded voice line is playing (battle barks wait their turn).
    const speaking = () => !!currentVoice;
    const has = name => !!((Rift.data.sfx || {})[name] || []).length;

    Rift.Audio = { sfx, speak, stopVoice, stopSounds, speaking, has };
})(typeof window !== 'undefined' ? window : globalThis);
