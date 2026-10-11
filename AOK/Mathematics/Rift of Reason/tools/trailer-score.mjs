// Original 82-second cinematic composition. Musical notes, orchestration, acoustic
// envelopes, stereo room and arrangement are generated in JavaScript. No samples,
// commercial songs, electronic UI beeps or synthesized sound effects are used here.
// Imported by trailer-audio.mjs; FFmpeg is used only for codec conversion there.
export const RATE = 48000;
const TAU = Math.PI * 2;
const TABLE_LENGTH = 16384;
const TABLE_MASK = TABLE_LENGTH - 1;
const SINE = Float32Array.from({ length: TABLE_LENGTH }, (_, i) => Math.sin(TAU * i / TABLE_LENGTH));
const midiHz = midi => 440 * Math.pow(2, (midi - 69) / 12);
const clamp = (value, low, high) => Math.max(low, Math.min(high, value));

export function composeScore(duration = 82) {
    const count = Math.round(duration * RATE);
    const left = new Float32Array(count), right = new Float32Array(count);
    const sine = phase => SINE[Math.floor(phase) & TABLE_MASK];
    let seed = 0x52494654;
    const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };

    function note(start, length, midi, volume, kind = 'strings', pan = 0) {
        const begin = Math.round(start * RATE), end = Math.min(count, Math.round((start + length) * RATE));
        if (end <= begin || end <= 0) return;
        const hz = midiHz(midi), step = TABLE_LENGTH * hz / RATE;
        const gainL = Math.sqrt((1 - pan) / 2), gainR = Math.sqrt((1 + pan) / 2);
        const phases = [random() * TABLE_LENGTH, random() * TABLE_LENGTH, random() * TABLE_LENGTH];
        const detunes = [0.9973, 1.0001, 1.0027];
        const wave = new Float32Array(TABLE_LENGTH);
        if (kind === 'strings' || kind === 'choir') {
            const harmonics = kind === 'choir' ? 24 : 14;
            let totalWeight = 0;
            const weights = [];
            for (let h = 1; h <= harmonics; h++) {
                const frequency = h * hz;
                const formants = Math.exp(-Math.pow((frequency - 650) / 350, 2)) + 0.65 * Math.exp(-Math.pow((frequency - 1150) / 500, 2)) + 0.18 * Math.exp(-Math.pow((frequency - 2400) / 650, 2));
                const weight = kind === 'choir' ? (0.1 + formants) / Math.pow(h, 1.15) : Math.exp(-h / 8) / Math.pow(h, 1.05);
                weights.push(weight); totalWeight += weight;
            }
            for (let i = 0; i < TABLE_LENGTH; i++) {
                let value = 0;
                for (let h = 1; h <= harmonics; h++) value += SINE[(i * h) & TABLE_MASK] * weights[h - 1];
                wave[i] = value / totalWeight;
            }
        }
        const modes = kind === 'bell' ? [1, 2.01, 2.76, 4.1, 5.43] : [1, 2.001, 3.005, 4.009, 5.018, 6.027];
        const amplitudes = kind === 'bell' ? [0.65, 0.24, 0.12, 0.055, 0.025] : [0.65, 0.22, 0.11, 0.055, 0.03, 0.014];
        const decays = modes.map((_, h) => Math.exp(-(kind === 'bell' ? 1.1 + h * 0.65 : 0.75 + h * 1.4) / RATE));
        const modePhases = modes.map(() => 0);
        for (let i = begin; i < end; i++) {
            const t = (i - begin) / RATE;
            let value = 0, envelope;
            if (kind === 'strings' || kind === 'choir') {
                const attack = kind === 'choir' ? 1.7 : 0.9;
                const release = kind === 'choir' ? 2.2 : 1.6;
                envelope = Math.sin(clamp(t / attack, 0, 1) * Math.PI / 2) * Math.sin(clamp((length - t) / release, 0, 1) * Math.PI / 2);
                const vibrato = 1 + 0.0017 * Math.sin(t * TAU * 4.7);
                for (let voice = 0; voice < 3; voice++) {
                    phases[voice] += step * detunes[voice] * vibrato;
                    value += wave[Math.floor(phases[voice]) & TABLE_MASK] / 3;
                }
                value *= 0.92 + 0.08 * Math.sin(t * TAU * 0.37);
            } else {
                envelope = Math.min(1, t / 0.008) * Math.sin(clamp((length - t) / 0.6, 0, 1) * Math.PI / 2);
                for (let h = 0; h < modes.length; h++) {
                    modePhases[h] += step * modes[h];
                    value += sine(modePhases[h]) * amplitudes[h];
                    amplitudes[h] *= decays[h];
                }
            }
            if (i >= 0) {
                left[i] += value * envelope * volume * gainL;
                right[i] += value * envelope * volume * gainR;
            }
        }
    }

    function drum(start, strength = 0.16, high = false) {
        const begin = Math.round(start * RATE), length = high ? 0.46 : 1.8;
        const end = Math.min(count, begin + Math.round(length * RATE));
        let phase = 0, filteredNoise = 0;
        const frequency = high ? 106 : 47;
        for (let i = begin; i < end; i++) {
            const t = (i - begin) / RATE;
            phase += TABLE_LENGTH * (frequency + (high ? 70 : 35) * Math.exp(-t * 19)) / RATE;
            filteredNoise = filteredNoise * 0.7 + (random() * 2 - 1) * 0.3;
            const skin = sine(phase) + 0.19 * sine(phase * 1.594) + 0.08 * sine(phase * 2.17);
            const value = strength * (skin * Math.exp(-t * (high ? 9 : 3.3)) + filteredNoise * 0.32 * Math.exp(-t * 40)) * Math.min(1, t / 0.002);
            if (i >= 0) { left[i] += value * 0.74; right[i] += value * 0.74; }
        }
    }

    const chords = [
        [0, 8, [50, 57, 60, 65], 0.13],
        [9, 8, [38, 50, 57, 60], 0.2],
        [16, 9, [46, 53, 58, 62], 0.2],
        [23, 8, [43, 50, 58, 62], 0.24],
        [29, 8, [45, 52, 57, 61], 0.24],
        [35, 9, [50, 57, 62, 65], 0.26],
        [42, 9, [46, 53, 58, 65], 0.28],
        [49, 7, [43, 50, 58, 62], 0.3],
        [54, 7, [45, 52, 57, 61], 0.31],
        [59, 7, [50, 57, 62, 65], 0.34],
        [64, 7, [46, 53, 58, 65], 0.36],
        [69, 2, [45, 52, 57, 61], 0.34],
        [70.7, 6, [38, 50, 57, 62], 0.1],
        [76, 6, [38, 50, 57, 62, 65, 69], 0.33],
    ];
    for (const [time, length, chord, level] of chords) {
        chord.forEach((midi, i) => note(time, length, midi, level / chord.length, 'strings', (i / (chord.length - 1) - 0.5) * 1.1));
        if (time >= 23 && time !== 70.7) [chord[1] + 12, chord[2] + 12].forEach((midi, i) => note(time + 0.3, length - 0.3, midi, level * 0.15, 'choir', i ? 0.5 : -0.5));
    }
    // A small music-box/piano idea establishes home before the orchestra enters.
    [74, 77, 81, 79, 77, 74, 72, 69].forEach((midi, i) => note(0.35 + i * 0.8, 3.2, midi, 0.115, i % 3 === 0 ? 'bell' : 'piano', (i % 3 - 1) * 0.38));
    [62, 69, 72, 65].forEach((midi, i) => note(0.4 + i * 1.6, 5, midi, 0.09, 'piano', -0.25));
    note(9.4, 5, 74, 0.045, 'bell', 0.55);
    note(17.4, 5, 77, 0.05, 'bell', -0.5);
    // Orchestra accelerates from a walking pulse into piano/string ostinatos.
    const beat = 60 / 96;
    for (let t = 23; t < 69.4; t += beat / 2) {
        const active = [...chords].reverse().find(chord => chord[0] <= t);
        const chord = active[2], tick = Math.round((t - 23) / (beat / 2));
        const driving = t >= 49;
        if (driving || tick % 2 === 0) {
            const pattern = [0, 2, 1, 3, 2, 1, 3, 2];
            const midi = chord[pattern[tick % pattern.length] % chord.length] + (driving ? 12 : 0);
            note(t, driving ? 0.76 : 1.5, midi, driving ? 0.11 : 0.067, 'piano', tick % 2 ? 0.32 : -0.32);
        }
        if (tick % 8 === 0) drum(t, t < 36 ? 0.06 : driving ? 0.24 : 0.12);
        if (driving && tick % 8 === 5) drum(t, 0.12, true);
        if (driving && tick % 8 === 6) drum(t, 0.15);
    }
    // Rising melody returns the fair motif in a wider orchestral register.
    [74, 77, 79, 81, 82, 81, 79, 77].forEach((midi, i) => note(49.1 + i * 2.35, 3.8, midi, 0.073, 'strings', i % 2 ? 0.35 : -0.35));
    drum(76.05, 0.32);
    [74, 77, 81, 86].forEach((midi, i) => note(76.12 + i * 0.2, 5.6 - i * 0.2, midi, 0.08, 'piano', (i - 1.5) * 0.2));
    note(78.9, 3.05, 86, 0.062, 'bell', 0.35);

    // Stereo chamber: four damped feedback reflections per side, a restrained tail.
    const reverberate = (input, delays) => {
        const result = new Float32Array(count);
        for (const seconds of delays) {
            const buffer = new Float32Array(Math.round(seconds * RATE));
            let cursor = 0, damped = 0;
            for (let i = 0; i < count; i++) {
                const reflected = buffer[cursor];
                damped = damped * 0.55 + reflected * 0.45;
                buffer[cursor] = input[i] * 0.32 + damped * 0.73;
                cursor = (cursor + 1) % buffer.length;
                result[i] += reflected * 0.25;
            }
        }
        return result;
    };
    const roomL = reverberate(left, [0.083, 0.101, 0.137, 0.179]);
    const roomR = reverberate(right, [0.089, 0.109, 0.149, 0.193]);
    let peak = 0;
    for (let i = 0; i < count; i++) {
        const t = i / RATE;
        const opening = Math.min(1, t / 0.45);
        const ending = Math.sin(clamp((duration - t) / 1.7, 0, 1) * Math.PI / 2);
        const fracture = t >= 7.6 && t < 9 ? 0.2 : 1;
        const gain = opening * ending * fracture;
        left[i] = (left[i] + roomL[i] * 0.45 + roomR[i] * 0.08) * gain;
        right[i] = (right[i] + roomR[i] * 0.45 + roomL[i] * 0.08) * gain;
        peak = Math.max(peak, Math.abs(left[i]), Math.abs(right[i]));
    }
    const gain = peak ? 0.58 / peak : 1;
    for (let i = 0; i < count; i++) { left[i] *= gain; right[i] *= gain; }
    return { left, right, rate: RATE, title: 'One Dangerous Word', composer: 'Original JavaScript composition for Rift of Reason', duration };
}
