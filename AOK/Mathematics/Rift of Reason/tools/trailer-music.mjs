// Production-only instrumental cues from ElevenLabs, cached without automatic retakes.
// node tools/trailer-music.mjs --plan                  free: inspect missing cues
// node tools/trailer-music.mjs --render [--credits n]   sequential: at most 1000 credits
// Key: repo-root/.secrets/elevenlabs_api_key. Never printed, copied or shipped.
// Model/API follow the game's established tools/sfx-eleven.mjs pipeline.
// A changed take is preserved; explicitly archive its MP3 and JSON before replacing.
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { GAME, ffmpegPath, decodeAudio } from './trailer-narration.mjs';

const KEY_FILE = path.resolve(GAME, '../../..', '.secrets', 'elevenlabs_api_key');
const API = 'https://api.elevenlabs.io/v1';
const MODEL = 'eleven_text_to_sound_v2';
const CAP = 1000;
export const MUSIC_CUES = [
    { id: 'wonder', start: 0, seconds: 22, level: 0.86, prompt: 'Continuous cinematic fantasy instrumental underscore. Delicate acoustic celesta and warm felt piano over soft expressive chamber strings, lanterns at a mysterious village fair. Gentle wonder, memorable rising motif. At eight seconds warmth darkens: low cellos and an eerie orchestral drone enter, anticipation grows. Spacious premium orchestral recording. Music only; no vocals, speech, choir, sound effects or electronic beeps.' },
    { id: 'journey', start: 21, seconds: 26, level: 0.95, prompt: 'Continuous cinematic fantasy adventure instrumental score. Dark low cellos, rich sustained strings, restrained acoustic piano ostinato, distant deep orchestral percussion. A brave journey through a strange forest into a city of mysteries. Gradually rising harmony and intensity with space for narration. Lush orchestral studio recording, sustained beginning and ending. No vocals, speech, choir, electronic beeps or sound effects.' },
    { id: 'stakes', start: 46, seconds: 30, level: 1, prompt: 'Grand fantasy adventure trailer instrumental score. Fast bowed string ostinatos, soaring violins, powerful French horns, low brass, deep timpani and acoustic drums. Mysterious opening builds to an exciting heroic crescendo, high stakes and discovery. Spacious orchestral recording, evolving chords, room for narration. Last five seconds: percussion falls away to a quiet ominous low string chord. No vocals, speech, choir or beeps.' },
    { id: 'resolve', start: 75, seconds: 8, level: 1, prompt: 'Cinematic fantasy film title music sting. Deep orchestral timpani strike and resonant low brass, then warm triumphant strings and French horns resolve to a majestic sustained final chord. Delicate celesta shimmer, long natural concert hall reverb tail fades to silence. Confident heroic finish, premium acoustic orchestral recording. No vocals, speech, choir, electronic beeps or other sound effects.' },
];

export function musicSignature(cue) {
    return createHash('sha256').update(JSON.stringify({ model: MODEL, text: cue.prompt, seconds: cue.seconds, loop: false, influence: 0.45 })).digest('hex');
}

export function musicFile(cue) { return path.join(GAME, 'assets/trailer/music', cue.id + '.mp3'); }

function planCue(cue) {
    if (cue.prompt.length > 450 || cue.seconds < 0.5 || cue.seconds > 30) throw new Error(`Invalid music prompt/duration: ${cue.id}. No API requests.`);
    const file = musicFile(cue), metadataFile = file.replace(/\.mp3$/, '.json');
    const metadata = fs.existsSync(metadataFile) ? JSON.parse(fs.readFileSync(metadataFile, 'utf8')) : null;
    const exists = fs.existsSync(file), signature = musicSignature(cue);
    return { cue, file, metadataFile, signature, exists, cached: exists && metadata?.signature === signature, metadata };
}

async function main(args = process.argv.slice(2)) {
    const creditIndex = args.indexOf('--credits');
    const declaredCredits = creditIndex >= 0 ? Number(args[creditIndex + 1]) : null;
    const validArgs = args.length === 1 || (args.length === 3 && creditIndex === 1 && Number.isSafeInteger(declaredCredits) && declaredCredits >= 0);
    if (!validArgs || !['--plan', '--render'].includes(args[0])) throw new Error('Use --plan (free) or --render [--credits <known remaining credits>].');
    const plan = MUSIC_CUES.map(planCue), pending = plan.filter(item => !item.cached);
    const estimated = pending.reduce((sum, item) => sum + item.cue.seconds * 10, 0);
    for (const item of plan) console.log(`${item.cue.id}: ${item.cached ? 'cached' : item.exists ? 'preserved changed take' : 'missing'}; ${item.cue.seconds}s; estimate ${item.cue.seconds * 10} credits.`);
    console.log(`Missing batch estimate: ${estimated} credits; fixed cap ${CAP}.`);
    if (args[0] === '--plan') return;
    if (!pending.length) { console.log('All musical cues cached. No API requests.'); return; }
    if (pending.some(item => item.exists)) throw new Error('A musical take changed or lacks matching metadata. Preserve/archive it before replacement; no automatic retakes.');
    if (estimated > CAP) throw new Error('Music plan exceeds the fixed credit cap. No API requests.');
    const ffmpeg = ffmpegPath();
    if (!fs.existsSync(KEY_FILE)) throw new Error('Missing repo .secrets/elevenlabs_api_key. No API requests.');
    const key = fs.readFileSync(KEY_FILE, 'utf8').trim();
    if (!key) throw new Error('Empty ElevenLabs key file. No API requests.');
    const account = await fetch(API + '/user/subscription', { signal: AbortSignal.timeout(30000), headers: { 'xi-api-key': key } });
    let remaining;
    if (account.ok) {
        const data = await account.json(); remaining = data.character_limit - data.character_count;
    } else if (account.status === 403 && declaredCredits !== null) {
        remaining = declaredCredits;
        console.log('Account metadata permission unavailable; using explicitly declared credit balance.');
    } else {
        throw new Error(`Account preflight returned HTTP ${account.status}. Supply --credits only for missing User:Read permission. No generation requests.`);
    }
    if (!Number.isFinite(remaining) || remaining < estimated) throw new Error('Cannot verify enough credits for the full music batch. No generation requests.');
    let spent = 0;
    for (const item of pending) {
        const estimate = item.cue.seconds * 10;
        if (spent + estimate > CAP) throw new Error('Music credit cap reached; generation stopped without retry.');
        const response = await fetch(API + '/sound-generation?output_format=mp3_44100_128', {
            method: 'POST', signal: AbortSignal.timeout(180000),
            headers: { 'xi-api-key': key, 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: item.cue.prompt, duration_seconds: item.cue.seconds, prompt_influence: 0.45, loop: false, model_id: MODEL }),
        });
        if (!response.ok) throw new Error(`ElevenLabs sound generation returned HTTP ${response.status}. Completed cues retained; no retry or plan upgrade.`);
        const bytes = Buffer.from(await response.arrayBuffer());
        if (!bytes.length || (response.headers.get('content-type') || '').includes('json')) throw new Error(`No audio returned for ${item.cue.id}; no retry.`);
        fs.mkdirSync(path.dirname(item.file), { recursive: true });
        fs.writeFileSync(item.file + '.tmp', bytes); fs.renameSync(item.file + '.tmp', item.file);
        const headerCost = Number(response.headers.get('character-cost'));
        const cost = Number.isFinite(headerCost) && headerCost > 0 ? headerCost : estimate;
        spent += cost;
        const metadata = { signature: item.signature, model: MODEL, prompt: item.cue.prompt, requestedSeconds: item.cue.seconds, credits: cost, generatedAt: new Date().toISOString(), duration: null };
        fs.writeFileSync(item.metadataFile, JSON.stringify(metadata, null, 2) + '\n');
        const decoded = decodeAudio(item.file, ffmpeg, { channels: 2 });
        metadata.duration = decoded.duration;
        fs.writeFileSync(item.metadataFile, JSON.stringify(metadata, null, 2) + '\n');
        console.log(`Saved ${item.cue.id}: ${decoded.duration.toFixed(3)}s; ${cost} credits; running spend ${spent}/${CAP}.`);
        if (Math.abs(decoded.duration - item.cue.seconds) > 0.25) throw new Error(`Unexpected duration for ${item.cue.id}. Cached take preserved; inspect it before adjusting the timeline.`);
        if (spent > CAP) throw new Error('Actual cost exceeded the cap estimate; no further requests will be made.');
    }
    console.log('Instrumental cues complete. Mix with node tools/trailer-audio.mjs --render.');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    main().catch(error => { console.error(error.message); process.exitCode = 1; });
}
