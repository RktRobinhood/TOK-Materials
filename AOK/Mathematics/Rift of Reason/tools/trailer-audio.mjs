// Build the trailer soundtrack locally; no API calls or browser dependencies.
// node tools/trailer-audio.mjs --plan         check files without writing
// node tools/trailer-audio.mjs --preview      free music/SFX audition under the OS temp folder
// node tools/trailer-audio.mjs --render       all cached ElevenLabs VO + instrumental cues + SFX
// Set RIFT_FFMPEG to an FFmpeg executable if it is not on PATH.
// JavaScript owns arrangement, crossfades, mixing, level control and
// voice ducking. FFmpeg handles MP3 decoding/encoding and a maximum 1.15x voice fit.
// No speech is truncated; an overlong take stops the mix for a timeline adjustment.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawnSync } from 'node:child_process';
import { composeScore, RATE } from './trailer-score.mjs';
import { GAME, loadTrailer, ffmpegPath, decodeAudio, lineSignature } from './trailer-narration.mjs';
import { MUSIC_CUES, musicFile, musicSignature } from './trailer-music.mjs';

const CUES = [
    { time: 7.9, file: 'rift-1.mp3', level: 0.34 },
    { time: 22.9, file: 'cloth-1.mp3', level: 0.1, optional: true },
    { time: 42.9, file: 'rift-2.mp3', level: 0.18 },
    { time: 55.85, file: 'summon-1.mp3', level: 0.16 },
    { time: 60.6, file: 'draw-1.mp3', level: 0.14 },
    { time: 63.1, file: 'impact-1.mp3', level: 0.2 },
    { time: 66.5, file: 'axiom-1.mp3', level: 0.16 },
    { time: 75.85, file: 'impact-2.mp3', level: 0.25 },
];

function normaliseVoice(samples) {
    let power = 0, active = 0, peak = 0;
    for (const sample of samples) {
        peak = Math.max(peak, Math.abs(sample));
        if (Math.abs(sample) >= 0.015) { power += sample * sample; active++; }
    }
    const rms = Math.sqrt(power / Math.max(1, active));
    if (!peak || !active) throw new Error('A narration take is silent. Preserve it and inspect it; no automatic retake.');
    const gain = Math.min(0.21 / rms, 0.72 / peak);
    return { gain, rms, peak };
}

// ITU-R BS.1770 stereo K weighting and EBU R128 absolute/relative gating.
// 400ms blocks with a 100ms hop; channel energy is summed before loudness conversion.
function integratedLoudness(left, right) {
    function weight(input) {
        const filters = [
            { b: [1.53512485958697, -2.69169618940638, 1.19839281085285], a: [-1.69065929318241, 0.73248077421585] },
            { b: [1, -2, 1], a: [-1.99004745483398, 0.99007225036621] },
        ];
        let output = input;
        for (const filter of filters) {
            const next = new Float32Array(output.length);
            let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
            for (let i = 0; i < output.length; i++) {
                const x = output[i];
                const y = filter.b[0] * x + filter.b[1] * x1 + filter.b[2] * x2 - filter.a[0] * y1 - filter.a[1] * y2;
                next[i] = y; x2 = x1; x1 = x; y2 = y1; y1 = y;
            }
            output = next;
        }
        return output;
    }
    const l = weight(left), r = weight(right);
    const block = Math.round(RATE * 0.4), hop = Math.round(RATE * 0.1);
    const loudness = power => -0.691 + 10 * Math.log10(Math.max(Number.MIN_VALUE, power));
    const blocks = [];
    let sum = 0;
    for (let i = 0; i < l.length; i++) {
        sum += l[i] * l[i] + r[i] * r[i];
        if (i >= block) sum -= l[i - block] * l[i - block] + r[i - block] * r[i - block];
        if (i + 1 >= block && (i + 1 - block) % hop === 0) blocks.push(sum / block);
    }
    const absolute = blocks.filter(power => loudness(power) >= -70);
    if (!absolute.length) return { integratedLUFS: null, loudnessBlocks: 0 };
    const mean = values => values.reduce((total, value) => total + value, 0) / values.length;
    const gate = loudness(mean(absolute)) - 10;
    const relative = absolute.filter(power => loudness(power) >= gate);
    return { integratedLUFS: Math.round(loudness(mean(relative)) * 100) / 100, loudnessBlocks: relative.length };
}

function writeMP3(file, left, right, ffmpeg) {
    const pcm = Buffer.allocUnsafe(left.length * 4);
    let peak = 0, power = 0;
    for (let i = 0; i < left.length; i++) peak = Math.max(peak, Math.abs(left[i]), Math.abs(right[i]));
    const masterGain = peak > 0.8 ? 0.8 / peak : 1;
    for (let i = 0; i < left.length; i++) {
        const l = left[i] * masterGain, r = right[i] * masterGain;
        if (!Number.isFinite(l) || !Number.isFinite(r)) throw new Error('Non-finite audio sample.');
        pcm.writeInt16LE(Math.round(l * 32767), i * 4);
        pcm.writeInt16LE(Math.round(r * 32767), i * 4 + 2);
        power += l * l + r * r;
    }
    const header = Buffer.alloc(44);
    header.write('RIFF', 0); header.writeUInt32LE(pcm.length + 36, 4); header.write('WAVEfmt ', 8);
    header.writeUInt32LE(16, 16); header.writeUInt16LE(1, 20); header.writeUInt16LE(2, 22);
    header.writeUInt32LE(RATE, 24); header.writeUInt32LE(RATE * 4, 28); header.writeUInt16LE(4, 32); header.writeUInt16LE(16, 34);
    header.write('data', 36); header.writeUInt32LE(pcm.length, 40);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    const temporary = file + '.tmp';
    const encoded = spawnSync(ffmpeg, ['-v', 'error', '-y', '-i', 'pipe:0', '-codec:a', 'libmp3lame', '-b:a', '192k', '-ar', String(RATE), '-f', 'mp3', temporary], {
        input: Buffer.concat([header, pcm]), maxBuffer: 128 * 1024 * 1024, windowsHide: true,
    });
    if (encoded.status !== 0) throw new Error(`MP3 encoding failed: ${String(encoded.stderr).slice(0, 300)}`);
    fs.renameSync(temporary, file);
    const verified = decodeAudio(file, ffmpeg, { rate: RATE, channels: 2 });
    let encodedPeak = 0;
    for (const sample of verified.samples) encodedPeak = Math.max(encodedPeak, Math.abs(sample));
    if (Math.abs(verified.duration - left.length / RATE) > 0.08 || encodedPeak >= 0.99) throw new Error('Encoded audio failed duration/peak verification.');
    const finalL = new Float32Array(left.length), finalR = new Float32Array(right.length);
    for (let i = 0; i < left.length; i++) { finalL[i] = left[i] * masterGain; finalR[i] = right[i] * masterGain; }
    return { duration: verified.duration, peak: peak * masterGain, encodedPeak, masterGain, rms: Math.sqrt(power / (left.length * 2)), ...integratedLoudness(finalL, finalR) };
}

function narrationTakes(trailer, ffmpeg) {
    return trailer.lines.map(line => {
        const file = path.resolve(GAME, line.file);
        const metadataFile = file.replace(/\.mp3$/, '.json');
        if (!fs.existsSync(file) || !fs.existsSync(metadataFile)) throw new Error(`Narration ${line.id} is missing. Generate it first; --preview remains free.`);
        const metadata = JSON.parse(fs.readFileSync(metadataFile, 'utf8'));
        if (metadata.signature !== lineSignature(trailer, line)) throw new Error(`Narration ${line.id} does not match the current script/voice. Preserve the take before replacing it.`);
        const decoded = decodeAudio(file, ffmpeg);
        const slot = line.end - line.start;
        const tempo = decoded.duration > slot - 0.04 ? decoded.duration / (slot - 0.04) : 1;
        if (tempo > 1.15) throw new Error(`Narration ${line.id} lasts ${decoded.duration.toFixed(2)}s but has ${slot.toFixed(2)}s. Increase its slot; speech will not be cut or regenerated.`);
        const fitted = tempo > 1 ? decodeAudio(file, ffmpeg, { tempo }) : decoded;
        if (fitted.duration > slot + 0.01) throw new Error(`Narration ${line.id} still exceeds its slot after timing fit. Adjust the timeline.`);
        const level = normaliseVoice(fitted.samples);
        return { line, samples: fitted.samples, duration: fitted.duration, tempo, ...level };
    });
}

function voiceDuck(t, takes) {
    let amount = 0;
    for (const take of takes) {
        const begin = take.line.start, end = begin + take.duration;
        if (t < begin - 0.22 || t > end + 0.35) continue;
        const attack = Math.max(0, Math.min(1, (t - begin + 0.22) / 0.22));
        const release = Math.max(0, Math.min(1, (end + 0.35 - t) / 0.35));
        amount = Math.max(amount, Math.min(attack, release));
    }
    return 1 - amount * 0.73;
}

function generatedMusic(duration, ffmpeg) {
    const left = new Float32Array(Math.round(duration * RATE)), right = new Float32Array(left.length);
    const cues = [];
    for (let index = 0; index < MUSIC_CUES.length; index++) {
        const cue = MUSIC_CUES[index], file = musicFile(cue);
        const metadataFile = file.replace(/\.mp3$/, '.json');
        if (!fs.existsSync(file) || !fs.existsSync(metadataFile)) throw new Error(`Musical cue ${cue.id} is missing. Generate cues with tools/trailer-music.mjs --render first.`);
        const metadata = JSON.parse(fs.readFileSync(metadataFile, 'utf8'));
        if (metadata.signature !== musicSignature(cue)) throw new Error(`Musical cue ${cue.id} no longer matches its production prompt. Preserve it before replacement.`);
        const decoded = decodeAudio(file, ffmpeg, { channels: 2 });
        if (Math.abs(decoded.duration - cue.seconds) > 0.25) throw new Error(`Musical cue ${cue.id} has unexpected duration.`);
        let power = 0, peak = 0;
        for (const sample of decoded.samples) { power += sample * sample; peak = Math.max(peak, Math.abs(sample)); }
        if (!peak) throw new Error(`Musical cue ${cue.id} is silent.`);
        const rms = Math.sqrt(power / decoded.samples.length);
        const gain = Math.min(0.145 / rms, 0.58 / peak) * cue.level;
        const offset = Math.round(cue.start * RATE);
        const nextStart = MUSIC_CUES[index + 1]?.start;
        for (let frame = 0; frame < decoded.samples.length / 2 && offset + frame < left.length; frame++) {
            const local = frame / RATE, t = cue.start + local;
            let envelope = 1;
            if (index > 0 && local < 1) envelope *= Math.sin(local * Math.PI / 2);
            if (nextStart !== undefined && t >= nextStart) envelope *= Math.cos(Math.min(1, (t - nextStart)) * Math.PI / 2);
            if (index === 0) envelope *= Math.min(1, local / 0.3);
            // Drop beneath the final challenge, then let the title chord bloom.
            if (t >= 69.8 && t < 75.9) {
                const dip = t < 70.4 ? 1 - (t - 69.8) / 0.6 * 0.75 : t > 75 ? 0.25 + (t - 75) / 0.9 * 0.75 : 0.25;
                envelope *= dip;
            }
            if (t > duration - 2) envelope *= Math.sin(Math.max(0, duration - t) / 2 * Math.PI / 2);
            left[offset + frame] += decoded.samples[frame * 2] * gain * envelope;
            right[offset + frame] += decoded.samples[frame * 2 + 1] * gain * envelope;
        }
        cues.push({ id: cue.id, file: path.relative(GAME, file).replaceAll('\\', '/'), start: cue.start, duration: decoded.duration, credits: metadata.credits });
    }
    return { left, right, rate: RATE, duration, title: 'Rift of Reason cinematic instrumental cues', composer: 'ElevenLabs Sound Effects v2; original production prompts and JavaScript arrangement', cues };
}

function main() {
    const args = process.argv.slice(2);
    if (args.length !== 1 || !['--plan', '--render', '--preview'].includes(args[0])) throw new Error('Use --plan, --preview or --render.');
    const trailer = loadTrailer();
    const scoreOnly = args[0] === '--preview';
    const output = scoreOnly ? path.join(os.tmpdir(), 'rift-trailer-audio-preview', 'score.mp3') : path.join(GAME, 'assets/trailer/soundtrack.mp3');
    if (args[0] === '--plan') {
        trailer.lines.forEach(line => console.log(`${line.id}: ${fs.existsSync(path.resolve(GAME, line.file)) ? 'present' : 'missing'}; ${line.start.toFixed(2)}–${line.end.toFixed(2)}s`));
        console.log(`Original score: ${trailer.duration}s. ${CUES.length} existing ElevenLabs SFX cues. Output: ${output}`);
        return;
    }
    const ffmpeg = ffmpegPath();
    // Validate every take before spending time on composition or replacing output.
    const takes = scoreOnly ? [] : narrationTakes(trailer, ffmpeg);
    console.log(`Arranging ${trailer.duration}s of ${scoreOnly ? 'original JavaScript audition music' : 'cached ElevenLabs orchestral music'}; ${takes.length} narration takes.`);
    const score = scoreOnly ? composeScore(trailer.duration) : generatedMusic(trailer.duration, ffmpeg);
    const { left, right } = score;
    for (let i = 0; i < left.length; i++) {
        const gain = voiceDuck(i / RATE, takes);
        left[i] *= gain; right[i] *= gain;
    }
    const effects = [];
    for (const cue of CUES) {
        const file = path.join(GAME, 'assets/sfx/el', cue.file);
        if (!fs.existsSync(file)) {
            if (cue.optional) continue;
            throw new Error(`Missing existing SFX: ${cue.file}`);
        }
        const decoded = decodeAudio(file, ffmpeg, { channels: 2 });
        let peak = 0;
        for (const sample of decoded.samples) peak = Math.max(peak, Math.abs(sample));
        const gain = peak ? cue.level / peak : 0;
        const offset = Math.round(cue.time * RATE);
        if (offset + decoded.samples.length / 2 > left.length) throw new Error(`SFX ${cue.file} exceeds trailer duration.`);
        for (let i = 0; i < decoded.samples.length / 2; i++) {
            const duck = 0.65 + voiceDuck((offset + i) / RATE, takes) * 0.35;
            left[offset + i] += decoded.samples[i * 2] * gain * duck;
            right[offset + i] += decoded.samples[i * 2 + 1] * gain * duck;
        }
        effects.push({ time: cue.time, file: `assets/sfx/el/${cue.file}`, duration: decoded.duration });
    }
    for (const take of takes) {
        const offset = Math.round(take.line.start * RATE);
        if (offset + take.samples.length > left.length) throw new Error(`Voice ${take.line.id} exceeds trailer duration.`);
        for (let i = 0; i < take.samples.length; i++) {
            // Only a 2ms anti-click edge; the complete decoded take is retained.
            const edge = Math.min(1, i / (RATE * 0.002), (take.samples.length - 1 - i) / (RATE * 0.002));
            const value = take.samples[i] * take.gain * edge;
            left[offset + i] += value; right[offset + i] += value;
        }
    }
    // The mix ends in a room tail; only the final 120ms get a master fade.
    for (let i = Math.max(0, left.length - RATE * 0.12); i < left.length; i++) {
        const fade = (left.length - i) / (RATE * 0.12);
        left[i] *= fade; right[i] *= fade;
    }
    const verified = writeMP3(output, left, right, ffmpeg);
    const report = {
        ...verified, score: score.title, composition: score.composer,
        narrationComplete: takes.length === trailer.lines.length,
        voice: trailer.voice, musicCues: score.cues || [], effects,
        lines: takes.map(take => ({ id: take.line.id, start: take.line.start, end: take.line.start + take.duration, sourceDuration: take.duration * take.tempo, tempo: take.tempo })),
    };
    fs.writeFileSync(output.replace(/\.mp3$/, '-report.json'), JSON.stringify(report, null, 2) + '\n');
    console.log(`Saved ${output}: ${verified.duration.toFixed(3)}s; decoded peak ${(20 * Math.log10(verified.encodedPeak)).toFixed(2)} dBFS; integrated ${verified.integratedLUFS} LUFS; ${takes.length}/${trailer.lines.length} voice takes.`);
}

try { main(); } catch (error) { console.error(error.message); process.exitCode = 1; }
