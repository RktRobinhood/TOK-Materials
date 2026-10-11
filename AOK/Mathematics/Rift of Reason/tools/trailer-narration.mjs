// Production-only ElevenLabs narration. The browser never calls ElevenLabs.
// node tools/trailer-narration.mjs --plan       free: inspect text and cached takes
// node tools/trailer-narration.mjs --render     sequential: generate missing takes once
// node tools/trailer-narration.mjs --render --credits 9000
// The optional credit declaration is used only if User:Read permission is absent.
// Set RIFT_FFMPEG to an FFmpeg executable if it is not on PATH.
// Key: repo-root/.secrets/elevenlabs_api_key (ignored); never logged or copied.
// API: https://elevenlabs.io/docs/api-reference/text-to-speech/convert
// Changed cached takes are deliberately preserved. Archive that take and its JSON
// before requesting a replacement; this tool never spends credits on automatic retakes.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export const GAME = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const KEY_FILE = path.resolve(GAME, '../../..', '.secrets', 'elevenlabs_api_key');
const API = 'https://api.elevenlabs.io/v1';
const HARD_CHARACTER_CAP = 2500;
const SETTINGS = { stability: 0.5, similarity_boost: 0.8, style: 0, use_speaker_boost: true };

export function loadTrailer() {
    const root = { Rift: { data: {} } };
    vm.runInNewContext(fs.readFileSync(path.join(GAME, 'data/trailer.js'), 'utf8'), { window: root, globalThis: root });
    const trailer = root.Rift.data.trailer;
    if (!trailer || !Number.isFinite(trailer.duration) || trailer.duration < 60 || trailer.duration > 90 || !Array.isArray(trailer.lines)) {
        throw new Error('Expected a 60–90 second trailer with a narration timeline in data/trailer.js.');
    }
    if (!trailer.voice?.id || !trailer.voice?.model) throw new Error('Trailer narrator voice and model are required.');
    let previousEnd = 0;
    const ids = new Set();
    for (const line of trailer.lines) {
        if (!/^\d{2}$/.test(line.id) || ids.has(line.id) || typeof line.text !== 'string' || !line.text.trim()) throw new Error('Invalid or duplicate narration line.');
        if (!Number.isFinite(line.start) || !Number.isFinite(line.end) || line.start < previousEnd || line.end <= line.start || line.end > trailer.duration) {
            throw new Error(`Invalid or overlapping narration timing: ${line.id}.`);
        }
        const file = path.resolve(GAME, line.file);
        const voiceRoot = path.join(GAME, 'assets', 'trailer', 'voice') + path.sep;
        if (!file.startsWith(voiceRoot) || !file.endsWith('.mp3')) throw new Error(`Narration file must stay in assets/trailer/voice: ${line.id}.`);
        previousEnd = line.end;
        ids.add(line.id);
    }
    return trailer;
}

export function ffmpegPath() {
    const executable = process.env.RIFT_FFMPEG || 'ffmpeg';
    const check = spawnSync(executable, ['-version'], { encoding: 'utf8', windowsHide: true });
    if (check.status !== 0) throw new Error('FFmpeg is unavailable. Set RIFT_FFMPEG to its executable; no paid request was made.');
    return executable;
}

export function decodeAudio(file, ffmpeg, { rate = 48000, channels = 1, tempo = 1 } = {}) {
    const args = ['-v', 'error', '-i', file];
    if (tempo !== 1) args.push('-af', `atempo=${tempo.toFixed(6)}`);
    args.push('-ar', String(rate), '-ac', String(channels), '-f', 'f32le', 'pipe:1');
    const result = spawnSync(ffmpeg, args, { maxBuffer: 128 * 1024 * 1024, windowsHide: true });
    if (result.status !== 0) throw new Error(`Could not decode ${path.basename(file)}: ${String(result.stderr).slice(0, 300)}`);
    const values = new Float32Array(result.stdout.length / 4);
    for (let i = 0; i < values.length; i++) values[i] = result.stdout.readFloatLE(i * 4);
    return { samples: values, duration: values.length / channels / rate };
}

export function lineSignature(trailer, line) {
    return createHash('sha256').update(JSON.stringify({ voice: trailer.voice, text: line.text, direction: line.direction || '', settings: SETTINGS })).digest('hex');
}

function linePlan(trailer, line) {
    const file = path.resolve(GAME, line.file);
    const metadataFile = file.replace(/\.mp3$/, '.json');
    const signature = lineSignature(trailer, line);
    const text = `${line.direction || ''} ${line.text}`.trim();
    let metadata = null;
    if (fs.existsSync(metadataFile)) metadata = JSON.parse(fs.readFileSync(metadataFile, 'utf8'));
    const exists = fs.existsSync(file);
    const cached = exists && metadata?.signature === signature;
    const status = cached ? 'cached' : exists ? 'preserved take: missing or changed signature' : 'missing';
    return { line, file, metadataFile, signature, text, metadata, cached, exists, status };
}

function atomicJSON(file, value) {
    const temporary = file + '.tmp';
    fs.writeFileSync(temporary, JSON.stringify(value, null, 2) + '\n');
    fs.renameSync(temporary, file);
}

async function apiRequest(key, method, endpoint, body) {
    const response = await fetch(API + endpoint, {
        method, signal: AbortSignal.timeout(180000),
        headers: { 'xi-api-key': key, 'Content-Type': 'application/json' },
        ...(body ? { body: JSON.stringify(body) } : {}),
    });
    if (!response.ok) {
        // Never echo service responses: they can contain request data or credentials.
        throw new Error(`ElevenLabs returned HTTP ${response.status}. Generation stopped; completed takes are retained. Check quota/key permissions before rerunning.`);
    }
    return response;
}

export async function main(args = process.argv.slice(2)) {
    const creditIndex = args.indexOf('--credits');
    const declaredCredits = creditIndex >= 0 ? Number(args[creditIndex + 1]) : null;
    const validArgs = args.length === 1 || (args.length === 3 && creditIndex === 1 && Number.isSafeInteger(declaredCredits) && declaredCredits >= 0);
    if (!validArgs || !['--plan', '--render'].includes(args[0])) throw new Error('Use --plan (free) or --render [--credits <known remaining credits>].');
    const trailer = loadTrailer();
    const plan = trailer.lines.map(line => linePlan(trailer, line));
    const missing = plan.filter(item => !item.cached);
    const characters = missing.reduce((sum, item) => sum + item.text.length, 0);
    for (const item of plan) console.log(`${item.line.id}: ${item.status}; ${item.text.length} characters; slot ${(item.line.end - item.line.start).toFixed(2)}s${item.metadata?.duration ? `; take ${item.metadata.duration.toFixed(2)}s` : ''}`);
    console.log(`Missing batch: ${characters} characters; fixed per-run cap ${HARD_CHARACTER_CAP}. Voice ${trailer.voice.id}; model ${trailer.voice.model}.`);
    if (args[0] === '--plan') return;
    if (missing.length === 0) { console.log('All narration takes are cached. No API requests.'); return; }
    if (missing.some(item => item.exists)) throw new Error('An existing take has changed or lacks metadata. Preserve/archive it explicitly before replacement; no automatic retakes.');
    if (characters > HARD_CHARACTER_CAP) throw new Error(`Missing batch exceeds ${HARD_CHARACTER_CAP} characters. Shorten the script; no API requests.`);
    const ffmpeg = ffmpegPath();
    if (!fs.existsSync(KEY_FILE)) throw new Error('Missing repo .secrets/elevenlabs_api_key; no API requests.');
    const key = fs.readFileSync(KEY_FILE, 'utf8').trim();
    if (!key) throw new Error('ElevenLabs key file is empty; no API requests.');
    const subscriptionResponse = await fetch(API + '/user/subscription', {
        signal: AbortSignal.timeout(30000), headers: { 'xi-api-key': key },
    });
    let remaining;
    if (subscriptionResponse.ok) {
        const subscription = await subscriptionResponse.json();
        remaining = subscription.character_limit - subscription.character_count;
    } else if (subscriptionResponse.status === 403 && declaredCredits !== null) {
        remaining = declaredCredits;
        console.log('Account metadata permission unavailable; using the explicitly declared credit budget.');
    } else if (subscriptionResponse.status === 403) {
        throw new Error('Key lacks User:Read permission. Supply --credits with the known remaining balance; no generation requests.');
    } else {
        throw new Error(`ElevenLabs account preflight returned HTTP ${subscriptionResponse.status}. Verify the actual API secret; no generation requests.`);
    }
    if (!Number.isFinite(remaining)) {
        if (declaredCredits === null) throw new Error('Could not verify remaining credits. Supply --credits with the known balance; no generation requests.');
        remaining = declaredCredits;
    }
    console.log(`Available credits: ${remaining}; estimated maximum batch cost: ${characters}.`);
    if (remaining < characters) throw new Error('Insufficient credits for the complete missing batch. No generation requests.');
    for (const item of missing) {
        const body = { text: item.text, model_id: trailer.voice.model, voice_settings: SETTINGS };
        const response = await apiRequest(key, 'POST', `/text-to-speech/${encodeURIComponent(trailer.voice.id)}?output_format=mp3_44100_128`, body);
        const bytes = Buffer.from(await response.arrayBuffer());
        if (!bytes.length || (response.headers.get('content-type') || '').includes('json')) throw new Error(`No audio returned for line ${item.line.id}; stopped without retry.`);
        fs.mkdirSync(path.dirname(item.file), { recursive: true });
        // Keep a successful take even if a later decode/timing check fails.
        fs.writeFileSync(item.file + '.tmp', bytes);
        fs.renameSync(item.file + '.tmp', item.file);
        const metadata = { signature: item.signature, voice: trailer.voice.id, model: trailer.voice.model, characters: item.text.length, generatedAt: new Date().toISOString(), duration: null };
        atomicJSON(item.metadataFile, metadata);
        const decoded = decodeAudio(item.file, ffmpeg);
        metadata.duration = Math.round(decoded.duration * 1000) / 1000;
        metadata.slot = item.line.end - item.line.start;
        metadata.maximumTempo = 1.15;
        atomicJSON(item.metadataFile, metadata);
        console.log(`Saved ${item.line.id}: ${metadata.duration.toFixed(2)}s; slot ${metadata.slot.toFixed(2)}s.`);
        if (decoded.duration > metadata.slot * 1.15 - 0.03) {
            throw new Error(`Line ${item.line.id} needs a longer timeline slot (${metadata.duration.toFixed(2)}s). Take saved; no retake or speech truncation. Adjust timing before generating remaining lines.`);
        }
    }
    console.log('Narration complete. Run node tools/trailer-audio.mjs --render to compose the soundtrack.');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    main().catch(error => { console.error(error.message); process.exitCode = 1; });
}
