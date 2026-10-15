// Local-only CC0 processing. No service calls, keys, billing, or automatic downloads.
// RIFT_FFMPEG=/path/to/ffmpeg node tools/cold-open-audio.mjs
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {GAME, ffmpegPath, decodeAudio} from './trailer-narration.mjs';

const SOURCE = path.join(GAME, 'design/source-audio/cold-open-65');
const ffmpeg = ffmpegPath();
const hash = file => createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const cues = [
    {id: 'server-room', source: 'nas-starting-joseph-sardin.mp3', file: 'assets/music/server-room.mp3',
        title: 'NAS, starting', author: 'Joseph Sardin',
        page: 'https://bigsoundbank.com/nas-starting-s1622.html',
        download: 'https://bigsoundbank.com/UPLOAD/mp3/1622.mp3',
        filter: 'atrim=start=5:end=37,asetpts=PTS-STARTPTS,highpass=f=55,lowpass=f=6500',
        lufs: -25, seam: 1.2},
    {id: 'algorithm-theme', source: 'lost-congusbongus.ogg', file: 'assets/music/algorithm-theme.mp3',
        title: 'Lost in a bad place (horror ambience loop)', author: 'congusbongus',
        page: 'https://opengameart.org/content/lost-in-a-bad-place-horror-ambience-loop',
        download: 'https://opengameart.org/sites/default/files/lost_2.ogg',
        filter: 'anull', lufs: -26, seam: 0},
];
function run(args, input) {
    const r = spawnSync(ffmpeg, ['-hide_banner', '-nostdin', ...args], {windowsHide: true, encoding: 'utf8', input, maxBuffer: 4e6});
    if (r.status !== 0) throw new Error(String(r.stderr).slice(-700));
    return r.stderr;
}
function levels(log) { return JSON.parse(log.slice(log.lastIndexOf('{'), log.lastIndexOf('}') + 1)); }
const receipt = {issue: 65, date: '2026-10-15', method: 'CC0 source recordings; local FFmpeg processing',
    paidGenerationRequests: 0, licence: 'CC0-1.0', licenceURL: 'https://creativecommons.org/publicdomain/zero/1.0/', cues: []};
for (const cue of cues) {
    const input = path.join(SOURCE, cue.source), output = path.join(GAME, cue.file);
    const first = levels(run(['-i', input, '-af', cue.filter + `,loudnorm=I=${cue.lufs}:TP=-5:LRA=7:print_format=json`, '-f', 'null', '-']));
    const norm = `loudnorm=I=${cue.lufs}:TP=-5:LRA=7:measured_I=${first.input_i}:measured_TP=${first.input_tp}:measured_LRA=${first.input_lra}:measured_thresh=${first.input_thresh}:offset=${first.target_offset}:linear=true`;
    const filter = cue.filter + ',' + norm;
    const decoded = spawnSync(ffmpeg, ['-v', 'error', '-i', input, '-af', filter, '-ar', '44100', '-ac', '2', '-f', 'f32le', 'pipe:1'], {windowsHide: true, maxBuffer: 128e6});
    if (decoded.status !== 0 || !decoded.stdout.length) throw new Error('Cannot prepare source: ' + cue.id);
    let pcm = decoded.stdout;
    // Rotate at 1.2 seconds and overlap the end with the beginning; the wrap is consecutive source samples.
    if (cue.seam) {
        const overlap = Math.round(cue.seam * 44100) * 2, samples = pcm.length / 4;
        const output = Buffer.alloc((samples - overlap) * 4), tail = samples - overlap;
        for (let i = 0; i < tail; i++) {
            const original = pcm.readFloatLE((i + overlap) * 4);
            const k = i - (tail - overlap);
            const blend = k < 0 ? original : original * (1 - k / overlap) + pcm.readFloatLE(k * 4) * (k / overlap);
            output.writeFloatLE(blend, i * 4);
        }
        pcm = output;
    }
    fs.mkdirSync(path.dirname(output), {recursive: true});
    run(['-y', '-f', 'f32le', '-ar', '44100', '-ac', '2', '-i', 'pipe:0', '-c:a', 'libmp3lame', '-b:a', '128k', output], pcm);
    const audio = decodeAudio(output, ffmpeg, {rate: 44100, channels: 2});
    let peak = 0, sum = 0;
    for (const x of audio.samples) { peak = Math.max(peak, Math.abs(x)); sum += x * x; }
    const rms = Math.sqrt(sum / audio.samples.length);
    if (!(audio.duration > 10 && peak > .01 && peak < .71 && rms > .001)) throw new Error('Invalid audio: ' + cue.id);
    const measured = levels(run(['-i', output, '-af', 'loudnorm=I=-25:TP=-5:LRA=7:print_format=json', '-f', 'null', '-']));
    receipt.cues.push({...cue, licence: 'CC0-1.0', sourceSHA256: hash(input), fileSHA256: hash(output),
        duration: audio.duration, peak, rms, loudnessLUFS: Number(measured.input_i), truePeakDB: Number(measured.input_tp),
        seamJump: Math.max(...[0, 1].map(ch => Math.abs(audio.samples[ch] - audio.samples[audio.samples.length - 2 + ch])))});
    console.log(`${cue.id}: ${audio.duration.toFixed(2)}s, ${measured.input_i} LUFS, ${measured.input_tp} dBTP`);
}
fs.writeFileSync(path.join(SOURCE, 'sources.json'), JSON.stringify(receipt, null, 2) + '\n');
