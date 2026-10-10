/*
 * Sound effects and voices.
 *
 * SFX come from Kenney CC0 packs listed in data/sfx.js (never synthesized
 * beeps). Voices are pre-rendered MP3s listed in data/voice-manifest.js; a line
 * without a file falls back to the browser's speechSynthesis with a per-speaker
 * pitch/rate so characters still sound different. Avatars never speak.
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
    let voiceGeneration = 0;
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
            a.volume = volume * (currentVoice || (root.speechSynthesis && root.speechSynthesis.speaking) ? 0.35 : 1);
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

    // Fallback voice character per speaker id (pitch, rate). Unknown speakers get
    // a stable pitch derived from their id.
    const FALLBACK = {
        sundial: { pitch: 0.7, rate: 0.85 },
        narrator: { pitch: 0.8, rate: 0.9 },
    };

    function fallbackFor(speaker) {
        if (FALLBACK[speaker]) return FALLBACK[speaker];
        const h = Rift.hashSeed(speaker || 'x');
        return { pitch: 0.6 + (h % 90) / 100, rate: 0.9 + ((h >> 8) % 25) / 100 };
    }

    function stopVoice() {
        voiceGeneration += 1;
        if (finishVoice) { const finish = finishVoice; finishVoice = null; finish(); }
        if (currentVoice) { try { currentVoice.pause(); } catch (e) { /* ignore */ } currentVoice = null; }
        if (root.speechSynthesis) { try { root.speechSynthesis.cancel(); } catch (e) { /* ignore */ } }
    }

    // Plays a line. Resolves when it ends (or immediately if silent).
    function speak(line) {
        stopVoice();
        const vol = settings().voice;
        if (!line || !line.text || vol <= 0 || line.speaker === 'avatar') return Promise.resolve();
        const manifest = Rift.data.voices || {};
        const file = line.voice && manifest[line.voice];
        const generation = voiceGeneration;
        return new Promise(resolve => {
            if (file) {
                const a = new Audio('assets/voice/' + file);
                a.volume = Rift.clamp(vol, 0, 1);
                let settled = false;
                const finish = () => { if (finishVoice === finish) finishVoice = null; resolve(); };
                finishVoice = finish;
                a.onended = () => { settled = true; if (currentVoice === a) currentVoice = null; finish(); };
                const fallback = () => {
                    if (settled) return;
                    settled = true;
                    if (currentVoice === a) currentVoice = null;
                    if (generation !== voiceGeneration || settings().voice <= 0) { finish(); return; }
                    resolve(speakFallback(line, settings().voice));
                };
                a.onerror = fallback;
                currentVoice = a;
                a.play().catch(fallback);
                return;
            }
            resolve(speakFallback(line, vol));
        });
    }

    // What the browser voice should actually say: no stage directions in
    // brackets, no "…". A line that is only a direction stays silent.
    function speakable(text) {
        return String(text || '').replace(/\([^)]*\)/g, ' ').replace(/…/g, ' ').replace(/[*_]/g, '').replace(/\s+/g, ' ').trim();
    }

    function speakFallback(line, vol) {
        const synth = root.speechSynthesis;
        const words = speakable(line.text);
        if (!synth || !root.SpeechSynthesisUtterance || !/[\p{L}\p{N}]/u.test(words)) return Promise.resolve();
        // English only: a machine whose only voice is (say) Danish would read English text in
        // Danish. Without an English voice the line stays silent; the text is on screen anyway.
        const english = synth.getVoices().filter(v => /^en/i.test(v.lang));
        if (!english.length) return Promise.resolve();
        return new Promise(resolve => {
            const finish = () => { if (finishVoice === finish) finishVoice = null; resolve(); };
            finishVoice = finish;
            const u = new root.SpeechSynthesisUtterance(words);
            const fb = fallbackFor(line.speaker);
            u.pitch = fb.pitch;
            u.rate = fb.rate;
            u.volume = Rift.clamp(vol, 0, 1);
            u.voice = english[(Rift.hashSeed ? Rift.hashSeed(line.speaker || 'x') : 0) % english.length];
            u.lang = u.voice.lang;
            u.onend = finish;
            u.onerror = finish;
            synth.speak(u);
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
    // True while a recorded or browser voice line is playing (battle barks wait their turn).
    const speaking = () => !!(currentVoice || (root.speechSynthesis && root.speechSynthesis.speaking));
    const has = name => !!((Rift.data.sfx || {})[name] || []).length;

    Rift.Audio = { sfx, speak, stopVoice, stopSounds, speaking, has };
})(typeof window !== 'undefined' ? window : globalThis);
