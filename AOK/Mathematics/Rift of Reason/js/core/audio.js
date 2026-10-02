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
    let currentVoice = null;

    function settings() {
        const s = Rift.State && Rift.State.get();
        return (s && s.settings) || { music: 0.5, sfx: 0.8, voice: 1 };
    }

    function sfx(name, opts) {
        const list = (Rift.data.sfx || {})[name];
        if (!list || !list.length) return;
        const now = Date.now();
        // Throttle so rapid clicks don't stack into noise.
        if (lastPlayed[name] && now - lastPlayed[name] < ((opts && opts.minGap) || 60)) return;
        lastPlayed[name] = now;
        const file = list[Math.floor(Math.random() * list.length)];
        try {
            const a = (cache[file] || (cache[file] = new Audio('assets/sfx/' + file))).cloneNode();
            a.volume = Rift.clamp(settings().sfx * ((opts && opts.volume) || 1), 0, 1);
            a.play().catch(() => {});
        } catch (e) { /* audio unavailable */ }
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
        return new Promise(resolve => {
            if (file) {
                const a = new Audio('assets/voice/' + file);
                a.volume = Rift.clamp(vol, 0, 1);
                a.onended = resolve;
                a.onerror = () => resolve(speakFallback(line, vol));
                currentVoice = a;
                a.play().catch(() => resolve(speakFallback(line, vol)));
                return;
            }
            resolve(speakFallback(line, vol));
        });
    }

    function speakFallback(line, vol) {
        const synth = root.speechSynthesis;
        if (!synth || !root.SpeechSynthesisUtterance) return Promise.resolve();
        return new Promise(resolve => {
            const u = new root.SpeechSynthesisUtterance(line.text.replace(/[*_]/g, ''));
            const fb = fallbackFor(line.speaker);
            u.pitch = fb.pitch;
            u.rate = fb.rate;
            u.volume = Rift.clamp(vol, 0, 1);
            const voices = synth.getVoices().filter(v => /^en/i.test(v.lang));
            if (voices.length) u.voice = voices[Rift.hashSeed(line.speaker || 'x') % voices.length];
            u.onend = resolve;
            u.onerror = resolve;
            synth.speak(u);
        });
    }

    Rift.Audio = { sfx, speak, stopVoice };
})(typeof window !== 'undefined' ? window : globalThis);
