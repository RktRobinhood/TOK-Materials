// Re-level the retained CC0 recording; no synthesized tones, service calls or build step.
// node tools/prepare-victory-audio.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const game = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const folder = path.join(game, 'design/source-audio/victory-feedback-160');
const source = fs.readFileSync(path.join(folder, 'source.wav'));
if (source.toString('ascii', 0, 4) !== 'RIFF' || source.readUInt16LE(20) !== 1 || source.readUInt16LE(22) !== 1 || source.readUInt32LE(24) !== 22050 || source.readUInt16LE(34) !== 16 || source.toString('ascii', 36, 40) !== 'data') throw new Error('Expected the retained mono 22050 Hz PCM16 source.');
let peak = 0;
for (let i = 44; i < source.length; i += 2) peak = Math.max(peak, Math.abs(source.readInt16LE(i)) / 32767);
if (!peak) throw new Error('The source is silent.');
const gain = Math.pow(10, -13 / 20) / peak;
const result = Buffer.from(source);
for (let i = 44; i < result.length; i += 2) result.writeInt16LE(Math.round(source.readInt16LE(i) * gain), i);
const output = path.join(game, 'assets/sfx/victory-bright.wav');
fs.writeFileSync(output, result);
const hash = buffer => createHash('sha256').update(buffer).digest('hex');
const receipt = {
    creator: 'Kenney Vleugels', license: 'CC0-1.0',
    sourcePage: 'https://kenney.nl/assets/music-jingles',
    download: 'https://kenney.nl/media/pages/assets/music-jingles/f37e530b9e-1677590399/kenney_music-jingles.zip',
    original: 'Audio/Steel jingles/jingles_STEEL10.ogg',
    originalSha256: hash(fs.readFileSync(path.join(folder, 'jingles_STEEL10.ogg'))),
    decodedSource: 'source.wav', decodedSourceSha256: hash(source),
    decoding: 'Original Ogg decoded to 22050 Hz mono by Chrome OfflineAudioContext; retained as PCM16 source.wav.',
    processing: 'Original recorded ascending steel jingle, gain only to -13 dB peak. No synthesis, new service recording or API quota used.',
    seconds: (result.length - 44) / 44100, peakDb: -13, output: 'assets/sfx/victory-bright.wav', outputSha256: hash(result),
};
fs.writeFileSync(path.join(folder, 'sources.json'), JSON.stringify(receipt, null, 2) + '\n');
console.log(JSON.stringify({ seconds: receipt.seconds, output: receipt.output, sha256: receipt.outputSha256 }));
