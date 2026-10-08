// ElevenLabs helpers for avatar voice design (design/AVATAR-VOICES.md).
//
// Key: .secrets/elevenlabs_api_key at the repo root (gitignored). It is only read here and never
// printed, copied or shipped. The free plan has about 10,000 credits a month: spend them on the
// avatars only, and check `status` before a run.
//
//   node tools/eleven.mjs status                       credits used / limit (needs User → Read)
//   node tools/eleven.mjs design <id> [--seed n]        PAID PLAN ONLY (free plan gets 403): 3 previews for
//                                                       tools/eleven-designs.json → tools/voice-auditions/eleven/
//   node tools/eleven.mjs save <id> <preview 1-3>      keep a preview as a voice (needs Voices → Write)
//   node tools/eleven.mjs sfx <name> "<prompt>" [--secs n]   a sound effect → tools/voice-auditions/eleven/
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const GAME = path.resolve(HERE, '..');
const KEY_FILE = path.resolve(GAME, '..', '..', '..', '.secrets', 'elevenlabs_api_key');
const DESIGNS = path.join(HERE, 'eleven-designs.json');
const OUT = path.join(HERE, 'voice-auditions', 'eleven');
const API = 'https://api.elevenlabs.io/v1';
// Rough local credit log (the key cannot read the account balance): text characters sent per call.
const USAGE = path.join(HERE, 'eleven-usage.json');
function logUse(kind, id, chars) {
    const u = fs.existsSync(USAGE) ? JSON.parse(fs.readFileSync(USAGE, 'utf8')) : { note: 'Rough: characters sent. Free plan about 10,000 credits a month.', total: 0, calls: [] };
    u.total += chars; u.calls.push({ at: new Date().toISOString(), kind, id, chars });
    fs.writeFileSync(USAGE, JSON.stringify(u, null, 2));
    console.log('logged ~' + chars + ' credits; total so far ~' + u.total);
}

const args = process.argv.slice(2);
const opt = n => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : null; };
const key = () => fs.readFileSync(KEY_FILE, 'utf8').trim();

async function call(method, url, body) {
    const res = await fetch(API + url, {
        method, signal: AbortSignal.timeout(180000),
        headers: { 'xi-api-key': key(), 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined,
    });
    const type = res.headers.get('content-type') || '';
    const data = type.includes('json') ? await res.json() : Buffer.from(await res.arrayBuffer());
    if (!res.ok) throw new Error(res.status + ' ' + JSON.stringify(data.detail || data).slice(0, 400));
    return data;
}

const designs = () => JSON.parse(fs.readFileSync(DESIGNS, 'utf8'));

async function main() {
    fs.mkdirSync(OUT, { recursive: true });
    const [cmd, id, n] = args;
    if (cmd === 'status') {
        const s = await call('GET', '/user/subscription');
        console.log(`${s.tier}: ${s.character_count} / ${s.character_limit} credits used; resets ${new Date(s.next_character_count_reset_unix * 1000).toISOString()}`);
    } else if (cmd === 'design') {
        const d = designs()[id];
        if (!d) throw new Error('No design "' + id + '" in tools/eleven-designs.json');
        const seed = opt('--seed');
        const r = await call('POST', '/text-to-voice/design', {
            voice_description: d.description, text: d.text, model_id: d.model || 'eleven_ttv_v3',
            guidance_scale: d.guidance ?? 5, loudness: 0.5, ...(seed ? { seed: +seed } : {}),
        });
        const log = fs.existsSync(path.join(OUT, 'previews.json')) ? JSON.parse(fs.readFileSync(path.join(OUT, 'previews.json'), 'utf8')) : {};
        log[id] = r.previews.map((p, i) => {
            const file = path.join(OUT, `${id}-${i + 1}.mp3`);
            fs.writeFileSync(file, Buffer.from(p.audio_base_64, 'base64'));
            console.log(file, p.duration_secs.toFixed(1) + 's');
            return { generated_voice_id: p.generated_voice_id, file };
        });
        fs.writeFileSync(path.join(OUT, 'previews.json'), JSON.stringify(log, null, 2));
        logUse('design', id, r.text.length * r.previews.length);
    } else if (cmd === 'save') {
        const p = JSON.parse(fs.readFileSync(path.join(OUT, 'previews.json'), 'utf8'))[id][+n - 1];
        const d = designs()[id];
        const r = await call('POST', '/text-to-voice', { voice_name: 'Rift ' + id, voice_description: d.description, generated_voice_id: p.generated_voice_id });
        console.log('saved', id, r.voice_id);
    } else if (cmd === 'sfx') {
        const audio = await call('POST', '/sound-generation', { text: n, ...(opt('--secs') ? { duration_seconds: +opt('--secs') } : {}) });
        const file = path.join(OUT, 'sfx-' + id + '.mp3');
        fs.writeFileSync(file, audio);
        console.log(file);
        logUse('sfx', id, 100 * (+opt('--secs') || 5));
    } else {
        console.log('usage: status | design <id> | save <id> <1-3> | sfx <name> "<prompt>"');
    }
}

main().catch(e => { console.error(e.message); process.exit(1); });
