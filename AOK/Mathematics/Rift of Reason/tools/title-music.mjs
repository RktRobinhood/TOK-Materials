// Production-only custom menu loop. No API calls from the game.
// node tools/title-music.mjs --plan | --render | --mix
// Set RIFT_FFMPEG to the production encoder. Completed takes are never regenerated.
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { GAME, ffmpegPath, decodeAudio } from './trailer-narration.mjs';

export const THEME = {
    name: 'A Little Wonder',
    model: 'eleven_text_to_sound_v2',
    seconds: 30,
    prompt: 'Seamless looping instrumental title theme for a whimsical fantasy puzzle adventure about time rifts and curious creatures. Catchy five-note rising melody on warm felt piano and soft celesta, lightly plucked acoustic strings and gentle chamber strings. Lilting 6/8 at 96 BPM, cosy wonder with a hint of mystery. Intimate mix, consistent quiet dynamics, no build or ending. No vocals, drums, thunder, buzzing, drones or effects.',
};
const OUT = path.join(GAME, 'assets/music');
const RAW = path.join(OUT, 'title-theme-source.mp3');
const FILE = path.join(OUT, 'title-theme.mp3');
const META = path.join(OUT, 'title-theme.json');
const KEY = path.resolve(GAME, '../../..', '.secrets/elevenlabs_api_key');
const SIGNATURE = createHash('sha256').update(JSON.stringify(THEME)).digest('hex');
const CAP = 300;

function encode(ffmpeg, args) {
    const result = spawnSync(ffmpeg, ['-hide_banner', '-nostdin', ...args], { encoding: 'utf8', maxBuffer: 2 * 1024 * 1024, windowsHide: true });
    if (result.status !== 0) throw new Error('Audio processing failed: ' + String(result.stderr).slice(-600));
    return result.stderr;
}

function save(metadata) { fs.writeFileSync(META, JSON.stringify(metadata, null, 2) + '\n'); }

function mix(ffmpeg, metadata) {
    const analysis = encode(ffmpeg, ['-i', RAW, '-af', 'loudnorm=I=-22:TP=-4:LRA=7:print_format=json', '-f', 'null', '-']);
    const levels = JSON.parse(analysis.slice(analysis.lastIndexOf('{'), analysis.lastIndexOf('}') + 1));
    const filter = `loudnorm=I=-22:TP=-4:LRA=7:measured_I=${levels.input_i}:measured_TP=${levels.input_tp}:measured_LRA=${levels.input_lra}:measured_thresh=${levels.input_thresh}:offset=${levels.target_offset}:linear=true`;
    encode(ffmpeg, ['-y', '-i', RAW, '-af', filter, '-ar', '44100', '-ac', '2', '-c:a', 'libmp3lame', '-b:a', '128k', '-metadata', 'title=' + THEME.name, '-metadata', 'artist=Rift of Reason / ElevenLabs', FILE]);
    const decoded = decodeAudio(FILE, ffmpeg, { rate: 44100, channels: 2 });
    if (Math.abs(decoded.duration - THEME.seconds) > .25) throw new Error('Unexpected loop duration. The generated take is preserved.');
    let peak = 0, sum = 0;
    for (const value of decoded.samples) { peak = Math.max(peak, Math.abs(value)); sum += value * value; }
    const measured = encode(ffmpeg, ['-i', FILE, '-af', 'loudnorm=I=-22:TP=-4:LRA=7:print_format=json', '-f', 'null', '-']);
    const finalLevels = JSON.parse(measured.slice(measured.lastIndexOf('{'), measured.lastIndexOf('}') + 1));
    const seamJump = Math.max(...[0, 1].map(ch => Math.abs(decoded.samples[ch] - decoded.samples[decoded.samples.length - 2 + ch])));
    Object.assign(metadata, {
        duration: decoded.duration, loop: true, loudnessLUFS: Number(finalLevels.input_i),
        truePeakDB: Number(finalLevels.input_tp), rms: Math.sqrt(sum / decoded.samples.length),
        peak, seamJump, fileSHA256: createHash('sha256').update(fs.readFileSync(FILE)).digest('hex'),
        processing: 'Two-pass -22 LUFS / -4 dBTP normalization; 44.1 kHz stereo gapless MP3. Full decoded buffer loops.',
    });
    save(metadata);
    if (metadata.truePeakDB > -3.5 || Math.abs(metadata.loudnessLUFS + 22) > 1 || seamJump > .08) throw new Error('The loop needs audio inspection. Take and metadata preserved; no automatic retake.');
    console.log(`Menu loop: ${decoded.duration.toFixed(2)}s, ${metadata.loudnessLUFS} LUFS, ${metadata.truePeakDB} dBTP, seam jump ${seamJump.toFixed(4)}.`);
}

async function main(args) {
    if (args.length !== 1 || !['--plan', '--render', '--mix'].includes(args[0])) throw new Error('Use --plan, --render or --mix.');
    if (THEME.prompt.length > 450) throw new Error('Prompt exceeds the sound generator limit. No request made.');
    const metadata = fs.existsSync(META) ? JSON.parse(fs.readFileSync(META, 'utf8')) : null;
    console.log(`${THEME.name}: ${fs.existsSync(FILE) ? 'finished' : fs.existsSync(RAW) ? 'source cached' : 'missing'}; ${THEME.seconds}s loop; at most ${CAP} credits.`);
    if (args[0] === '--plan') return;
    const ffmpeg = ffmpegPath();
    if (fs.existsSync(RAW)) {
        if (metadata?.signature !== SIGNATURE) throw new Error('Changed take preserved. Archive it explicitly before a new generation.');
        if (args[0] === '--mix' || !fs.existsSync(FILE)) mix(ffmpeg, metadata);
        else console.log('Cached finished loop. No API request.');
        return;
    }
    if (args[0] === '--mix') throw new Error('No cached source to mix. No API request.');
    const key = fs.readFileSync(KEY, 'utf8').trim();
    if (!key) throw new Error('Empty ElevenLabs key.');
    const headers = { 'xi-api-key': key, 'Content-Type': 'application/json' };
    const account = await fetch('https://api.elevenlabs.io/v1/user/subscription', { headers, signal: AbortSignal.timeout(30000) });
    if (!account.ok) throw new Error('Cannot verify available credits: HTTP ' + account.status + '. No generation request.');
    const subscription = await account.json();
    if (subscription.character_limit - subscription.character_count < CAP) throw new Error('Insufficient included credits. No generation request.');
    const response = await fetch('https://api.elevenlabs.io/v1/sound-generation?output_format=mp3_44100_128', {
        method: 'POST', headers, signal: AbortSignal.timeout(180000),
        body: JSON.stringify({ text: THEME.prompt, duration_seconds: THEME.seconds, prompt_influence: .55, loop: true, model_id: THEME.model }),
    });
    if (!response.ok) throw new Error('ElevenLabs loop generation returned HTTP ' + response.status + '. No retry.');
    const bytes = Buffer.from(await response.arrayBuffer());
    if (!bytes.length || (response.headers.get('content-type') || '').includes('json')) throw new Error('No audio returned. No retry.');
    fs.mkdirSync(OUT, { recursive: true });
    fs.writeFileSync(RAW, bytes);
    const cost = Number(response.headers.get('character-cost')) || CAP;
    const generated = { name: THEME.name, provider: 'ElevenLabs', model: THEME.model, prompt: THEME.prompt, requestedSeconds: THEME.seconds, loop: true, credits: cost, generatedAt: new Date().toISOString(), signature: SIGNATURE };
    save(generated);
    console.log(`Generated one custom take: ${cost} credits. Original preserved.`);
    mix(ffmpeg, generated);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main(process.argv.slice(2)).catch(error => { console.error(error.message); process.exitCode = 1; });
