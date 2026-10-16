// Local-only processing of the two credited CC0 recordings; no service requests.
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {GAME, ffmpegPath, decodeAudio} from './trailer-narration.mjs';

const ffmpeg = ffmpegPath(), folder = path.join(GAME, 'design/source-audio/homecoming-153');
const cues = [
    {id: 'single-clap', source: 'clap-xumr.mp3', author: 'xUMR', title: 'clap.wav',
        page: 'https://freesound.org/people/xUMR/sounds/478657/',
        download: 'https://cdn.freesound.org/previews/478/478657_5953161-hq.mp3'},
    {id: 'fair-applause', source: 'applause-breviceps.mp3', author: 'Breviceps', title: 'Small applause',
        page: 'https://freesound.org/people/Breviceps/sounds/462362/',
        download: 'https://cdn.freesound.org/previews/462/462362_9159316-hq.mp3'},
];
const hash = file => createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const receipt = {date: '2026-10-16', issue: 153, licence: 'CC0-1.0',
    licenceURL: 'https://creativecommons.org/publicdomain/zero/1.0/',
    method: 'Source recordings decoded locally to22050Hz mono PCM16 WAV, normalized to-13dB peak; applause trimmed to3.6s with0.6s tail fade. No synthesis or paid requests.', cues: []};
for (const cue of cues) {
    const input = path.join(folder, cue.source), output = path.join(GAME, 'assets/sfx/' + cue.id + '.wav');
    const raw = decodeAudio(input, ffmpeg, {rate: 22050, channels: 1});
    const samples = raw.samples.slice(0, Math.round(Math.min(raw.duration, cue.id === 'fair-applause' ? 3.6 : raw.duration) * 22050));
    if (cue.id === 'fair-applause') {
        const fade = Math.round(0.6 * 22050);
        for (let i = samples.length - fade; i < samples.length; i++) samples[i] *= (samples.length - 1 - i) / fade;
    }
    let peak = 0, sum = 0;
    for (const x of samples) { peak = Math.max(peak, Math.abs(x)); sum += x * x; }
    const rms = Math.sqrt(sum / samples.length);
    if (!(peak > 0.01 && rms > 0.001)) throw new Error('Silent source: ' + cue.id);
    const gain = Math.pow(10, -13 / 20) / peak;
    const pcm = Buffer.alloc(samples.length * 2), header = Buffer.alloc(44);
    samples.forEach((x, i) => pcm.writeInt16LE(Math.round(x * gain * 32767), i * 2));
    header.write('RIFF'); header.writeUInt32LE(36 + pcm.length, 4); header.write('WAVEfmt ', 8);
    header.writeUInt32LE(16, 16); header.writeUInt16LE(1, 20); header.writeUInt16LE(1, 22);
    header.writeUInt32LE(22050, 24); header.writeUInt32LE(44100, 28); header.writeUInt16LE(2, 32); header.writeUInt16LE(16, 34);
    header.write('data', 36); header.writeUInt32LE(pcm.length, 40);
    fs.writeFileSync(output, Buffer.concat([header, pcm]));
    const audio = decodeAudio(output, ffmpeg, {rate: 22050, channels: 1});
    let finalPeak = 0;
    for (const x of audio.samples) finalPeak = Math.max(finalPeak, Math.abs(x));
    if (!(audio.duration > 0.4 && audio.duration < 4 && finalPeak > 0.2 && finalPeak <= 0.224)) throw new Error('Invalid cue: ' + cue.id);
    receipt.cues.push({...cue, file: path.relative(GAME, output).replaceAll('\\', '/'), gain, duration: audio.duration,
        peak: finalPeak, sourceSHA256: hash(input), fileSHA256: hash(output)});
    console.log(cue.id + ': ' + audio.duration.toFixed(2) + 's, peak' + finalPeak.toFixed(3));
}
fs.writeFileSync(path.join(folder, 'sources.json'), JSON.stringify(receipt, null, 2) + '\n');
