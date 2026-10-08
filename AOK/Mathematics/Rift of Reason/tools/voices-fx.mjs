// Voice post-processing for Rift of Reason, ported from the Odyssey game's voice-fx.mjs.
// FX are keyed by speaker id; speakers without an entry are left untouched. Every avatar
// inner-voice speaker (id ending in "-inner", design/AVATAR-VOICES.md) gets FX.inner.
// `pitch` < 1 lowers pitch and slows the voice (tape-style).

export const FX = {
    colossus: { pitch: 0.9, chorus: true, reverb: { size: 1.1, decay: 0.84, damp: 0.3, mix: 0.3 } },
    // The Algorithm: a cold feed-voice, slightly lowered and doubled into a synthetic choir.
    algorithm: { pitch: 0.93, chorus: true, reverb: { size: 0.8, decay: 0.8, damp: 0.3, mix: 0.25 } },
    // The Sundial is a big old stone: a little room around the voice.
    narrator: { reverb: { size: 0.6, decay: 0.7, damp: 0.5, mix: 0.12 } },
    // The avatar's inner voice: subtle "inside your head". A little bone-conduction warmth,
    // softened highs (not a telephone band), a very small dry room, and a lower level.
    inner: {
        eq: [['highpass', 90, 0.7], ['lowshelf', 220, 0.7, 2.5], ['highshelf', 3000, 0.7, -5], ['lowpass', 7000, 0.7]],
        reverb: { size: 0.25, decay: 0.45, damp: 0.6, mix: 0.07 },
        level: 0.56, // peak about 4 dB below spoken lines (0.89)
    },
};
export const fxFor = who => FX[who] || (/-inner$/.test(who) ? FX.inner : null);

const toF = pcm => Float32Array.from(pcm, v => v / 32768);
function toI(x, level = 0.89) {
    let peak = 0;
    for (const v of x) peak = Math.max(peak, Math.abs(v));
    const g = peak > 0 ? level / peak : 1;
    return Int16Array.from(x, v => Math.round(Math.max(-1, Math.min(1, v * g)) * 32767));
}
function resample(x, f) {
    const n = Math.floor(x.length / f), y = new Float32Array(n);
    for (let i = 0; i < n; i++) { const p = i * f, a = Math.floor(p), t = p - a; y[i] = x[a] * (1 - t) + (x[a + 1] || 0) * t; }
    return y;
}
function drive(x, d) {
    const n = Math.tanh(d);
    return x.map(v => Math.tanh(v * d) / n);
}
// RBJ cookbook biquads: [type, frequency Hz, Q, gain dB for shelves].
function biquad(x, rate, [type, f0, q, db = 0]) {
    const A = Math.pow(10, db / 40), w = 2 * Math.PI * f0 / rate, cw = Math.cos(w), sw = Math.sin(w);
    const al = sw / (2 * q), sa = 2 * Math.sqrt(A) * al;
    let b0, b1, b2, a0, a1, a2;
    if (type === 'lowpass') { b0 = (1 - cw) / 2; b1 = 1 - cw; b2 = b0; a0 = 1 + al; a1 = -2 * cw; a2 = 1 - al; }
    else if (type === 'highpass') { b0 = (1 + cw) / 2; b1 = -(1 + cw); b2 = b0; a0 = 1 + al; a1 = -2 * cw; a2 = 1 - al; }
    else if (type === 'lowshelf') {
        b0 = A * ((A + 1) - (A - 1) * cw + sa); b1 = 2 * A * ((A - 1) - (A + 1) * cw); b2 = A * ((A + 1) - (A - 1) * cw - sa);
        a0 = (A + 1) + (A - 1) * cw + sa; a1 = -2 * ((A - 1) + (A + 1) * cw); a2 = (A + 1) + (A - 1) * cw - sa;
    } else if (type === 'highshelf') {
        b0 = A * ((A + 1) + (A - 1) * cw + sa); b1 = -2 * A * ((A - 1) + (A + 1) * cw); b2 = A * ((A + 1) + (A - 1) * cw - sa);
        a0 = (A + 1) - (A - 1) * cw + sa; a1 = 2 * ((A - 1) - (A + 1) * cw); a2 = (A + 1) - (A - 1) * cw - sa;
    } else throw new Error('Unknown filter ' + type);
    const y = new Float32Array(x.length);
    let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
    for (let i = 0; i < x.length; i++) {
        const v = (b0 * x[i] + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2) / a0;
        x2 = x1; x1 = x[i]; y2 = y1; y1 = v; y[i] = v;
    }
    return y;
}
// Freeverb-style: parallel damped combs into series allpasses, with a tail appended.
function reverb(x, rate, { size, decay, damp, mix }) {
    const s = rate / 44100 * size, tail = Math.round(rate * 1.6);
    const inp = new Float32Array(x.length + tail); inp.set(x);
    const wet = new Float32Array(inp.length);
    for (const d0 of [1116, 1188, 1277, 1356, 1422, 1491]) {
        const d = Math.round(d0 * s), buf = new Float32Array(d); let idx = 0, lp = 0;
        for (let i = 0; i < inp.length; i++) {
            const out = buf[idx];
            lp = out * (1 - damp) + lp * damp;
            buf[idx] = inp[i] + lp * decay;
            idx = (idx + 1) % d;
            wet[i] += out / 6;
        }
    }
    for (const d0 of [556, 441]) {
        const d = Math.round(d0 * s), buf = new Float32Array(d); let idx = 0;
        for (let i = 0; i < wet.length; i++) {
            const b = buf[idx], v = wet[i];
            buf[idx] = v + b * 0.5;
            wet[i] = b - v;
            idx = (idx + 1) % d;
        }
    }
    const y = new Float32Array(inp.length);
    for (let i = 0; i < y.length; i++) y[i] = inp[i] * (1 - mix * 0.5) + wet[i] * mix * 2;
    let end = y.length;
    while (end > x.length && Math.abs(y[end - 1]) < 0.002) end--;
    return y.subarray(0, end);
}
// Several copies on slowly wobbling delays: one voice becomes a shimmering choir.
function chorus(x, rate) {
    const voices = [[18, 4, 0.31, 0.7, 0], [27, 6, 0.23, 0.6, 2.1], [11, 3, 0.47, 0.55, 4.2], [35, 7, 0.17, 0.45, 1.3]];
    const y = Float32Array.from(x, v => v * 0.8);
    for (const [dms, depth, hz, gain, ph] of voices) {
        for (let i = 0; i < x.length; i++) {
            const d = (dms + depth * Math.sin(2 * Math.PI * hz * i / rate + ph)) * rate / 1000;
            const p = i - d; if (p < 0) continue;
            const a = Math.floor(p), t = p - a;
            y[i] += (x[a] * (1 - t) + (x[a + 1] || 0) * t) * gain;
        }
    }
    return y;
}

export function applyFx(who, pcm, rate) {
    const fx = fxFor(who);
    if (!fx) return pcm;
    let x = toF(pcm);
    if (fx.pitch) x = resample(x, fx.pitch);
    for (const band of fx.eq || []) x = biquad(x, rate, band);
    if (fx.drive) x = drive(x, fx.drive);
    if (fx.chorus) x = chorus(x, rate);
    if (fx.reverb) x = reverb(x, rate, fx.reverb);
    return toI(x, fx.level);
}
