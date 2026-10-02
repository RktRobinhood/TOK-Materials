// Pre-render every voiced line of Rift of Reason with Gemini TTS (ported from the Odyssey game).
//
// Key: .secrets/gemini_api_key at the repo root (gitignored), or GEMINI_API_KEY. It is only
// read here and never printed, copied or shipped.
//
//   node tools/voices.mjs                   status: how many lines are rendered, missing or skipped
//   node tools/voices.mjs --plan            the batches a render would send (no API calls)
//   node tools/voices.mjs --render          render missing lines in batches (resumable, free-tier friendly)
//        --only <speaker>  --max-requests <n>  --batch <lines per request>  --model <id>  --single
//   node tools/voices.mjs --report          every line still on browser-voice fallback
//   node tools/voices.mjs --audition        one sample per speaker into tools/voice-auditions (one request each)
//   node tools/voices.mjs --resplit         retry the splitter on failed batches kept in tools/voice-raw (no quota)
//   node tools/voices.mjs --prune           delete recordings whose line no longer exists
//   node tools/voices.mjs --manifest        just rebuild data/voice-manifest.js from files on disk
//
// Lines come from data/script/*.js (every step with a speaker `s` and text `t`, at any depth;
// the avatar is silent) and each creature's `lines` in data/creatures.js. A file is named by
// Rift.voiceId(speaker, text) of the text as written, so the game finds it with no extra data.
// `{name}` is the player's nickname at runtime: the recording leaves the name out.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { loadRift, GAME_DIR } from './test/harness.mjs';
import { applyFx } from './voices-fx.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(GAME_DIR, 'assets', 'voice');
const MANIFEST = path.join(GAME_DIR, 'data', 'voice-manifest.js');
const RAW = path.join(HERE, 'voice-raw');
const KEY_FILE = path.resolve(GAME_DIR, '..', '..', '..', '.secrets', 'gemini_api_key');
const CAST = JSON.parse(fs.readFileSync(path.join(HERE, 'voices-cast.json'), 'utf8'));

const args = process.argv.slice(2);
const flag = n => args.includes(n);
const opt = n => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : null; };
const DELAY = +(opt('--delay') || 21000); // free tier: about 3 requests a minute per model
const FLASH = 'gemini-3.8-flash-tts', LITE = 'gemini-3.8-flash-lite-tts';
const sleep = ms => new Promise(r => setTimeout(r, ms));

// ---- lines --------------------------------------------------------------------

function loadGame() {
    const scripts = fs.readdirSync(path.join(GAME_DIR, 'data', 'script')).filter(f => f.endsWith('.js')).sort();
    return loadRift(['js/core/rift.js', 'data/creatures.js', ...scripts.map(f => 'data/script/' + f)]);
}

// What the TTS reads: no nickname, and shouted all-caps lines (the Algorithm) in sentence case
// so they are spoken, not spelled out.
export function spoken(text) {
    let t = text.replace(/,\s*\{name\}/g, '').replace(/\{name\}[,!.]?\s*/g, '');
    t = t.replace(/\s+([,.!?…])/g, '$1').replace(/\s+/g, ' ').trim();
    const letters = t.replace(/[^A-Za-z]/g, '');
    if (letters.length > 8 && letters === letters.toUpperCase()) {
        t = t.toLowerCase().replace(/(^|[.!?…]\s+)([a-z])/g, (_, a, b) => a + b.toUpperCase()).replace(/\bi\b/g, 'I');
    }
    return t.charAt(0).toUpperCase() + t.slice(1);
}

function collect(Rift) {
    const lines = [], seen = new Set(), skipped = [];
    const add = (who, text, mood, where) => {
        if (who === 'avatar' || typeof text !== 'string' || !text.trim()) return;
        const id = Rift.voiceId(who, text);
        if (seen.has(id)) return;
        seen.add(id);
        if (!CAST[who]) { skipped.push({ who, text, why: 'no voice in voices-cast.json' }); return; }
        const say = spoken(text);
        if (!/[a-z]/i.test(say)) { skipped.push({ who, text, why: 'nothing to say' }); return; }
        lines.push({ id, who, text, say, mood, where });
    };
    const walk = (node, where) => {
        if (Array.isArray(node)) return node.forEach(n => walk(n, where));
        if (!node || typeof node !== 'object') return;
        if (typeof node.s === 'string' && typeof node.t === 'string') add(node.s, node.t, node.e, where);
        for (const [k, v] of Object.entries(node)) if (k !== 't' && typeof v === 'object') walk(v, where);
    };
    const scripts = Rift.data.script || Rift.data.scripts || {};
    for (const [key, steps] of Object.entries(scripts)) walk(steps, key);
    for (const [id, c] of Object.entries(Rift.data.creatures || {})) (c.lines || []).forEach(t => add(id, t, null, 'creature ' + id));
    return { lines, skipped };
}

const fileOf = l => l.id + '.mp3';
const rendered = l => fs.existsSync(path.join(OUT, fileOf(l)));

function writeManifest() {
    fs.mkdirSync(OUT, { recursive: true });
    const have = fs.readdirSync(OUT).filter(f => f.endsWith('.mp3')).sort();
    const body = '/*\n * GENERATED by tools/voices.mjs. Do not edit by hand.\n'
        + ' * Maps voice ids (Rift.voiceId(speaker, text)) to MP3 files in assets/voice/.\n'
        + ' * Lines missing here fall back to the browser\'s speech voices.\n */\n'
        + '(function (root) {\n    \'use strict\';\n    root.Rift.data.voices = {\n'
        + have.map(f => '        ' + JSON.stringify(f.slice(0, -4)) + ': ' + JSON.stringify(f) + ',').join('\n')
        + (have.length ? '\n' : '') + '    };\n})(typeof window !== \'undefined\' ? window : globalThis);\n';
    fs.writeFileSync(MANIFEST, body);
    return have.length;
}

// ---- audio --------------------------------------------------------------------

const require = createRequire(import.meta.url);
let lamejs = null;
function lame() {
    if (lamejs) return lamejs;
    // lamejs's CommonJS entry is broken under Node; its bundled build works in a VM context.
    const ctx = { console };
    ctx.window = ctx;
    vm.createContext(ctx);
    vm.runInContext(fs.readFileSync(require.resolve('lamejs/lame.all.js'), 'utf8'), ctx);
    return (lamejs = ctx.lamejs);
}

// Gemini returns 24 kHz mono 16-bit PCM, sometimes wrapped in a RIFF header.
function pcmFromWav(buf) {
    if (buf.toString('ascii', 0, 4) !== 'RIFF') {
        const copy = Buffer.from(buf);
        return { rate: 24000, pcm: new Int16Array(copy.buffer, copy.byteOffset, Math.floor(copy.length / 2)) };
    }
    let off = 12, rate = 24000, data = null;
    while (off + 8 <= buf.length) {
        const id = buf.toString('ascii', off, off + 4), size = buf.readUInt32LE(off + 4);
        if (id === 'fmt ') rate = buf.readUInt32LE(off + 12);
        if (id === 'data') { data = buf.subarray(off + 8, off + 8 + Math.min(size, buf.length - off - 8)); break; }
        off += 8 + size + (size % 2);
    }
    const copy = Buffer.from(data);
    return { rate, pcm: new Int16Array(copy.buffer, copy.byteOffset, Math.floor(copy.length / 2)) };
}
function trim(pcm, rate) {
    const thr = 350, pad = Math.round(rate * 0.12);
    let a = 0, b = pcm.length - 1;
    while (a < b && Math.abs(pcm[a]) < thr) a++;
    while (b > a && Math.abs(pcm[b]) < thr) b--;
    return pcm.subarray(Math.max(0, a - pad), Math.min(pcm.length, b + pad));
}
function toMp3(pcm, rate) {
    const enc = new (lame().Mp3Encoder)(1, rate, 48);
    const chunks = [];
    for (let i = 0; i < pcm.length; i += 1152) {
        const out = enc.encodeBuffer(pcm.subarray(i, i + 1152));
        if (out.length) chunks.push(Buffer.from(out));
    }
    const end = enc.flush();
    if (end.length) chunks.push(Buffer.from(end));
    return Buffer.concat(chunks);
}
function save(l, pcm, rate) {
    fs.writeFileSync(path.join(OUT, fileOf(l)), toMp3(applyFx(l.who, trim(pcm, rate), rate), rate));
}

// ---- API ----------------------------------------------------------------------

function apiKey() {
    if (process.env.GEMINI_API_KEY) return process.env.GEMINI_API_KEY.trim();
    if (fs.existsSync(KEY_FILE)) return fs.readFileSync(KEY_FILE, 'utf8').trim().split(/\s+/)[0];
    return null;
}

async function tts(key, model, voice, text, style) {
    const res = await fetch('https://generativelanguage.googleapis.com/v1beta/interactions', {
        method: 'POST',
        headers: { 'x-goog-api-key': key, 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(120000),
        body: JSON.stringify({
            model,
            input: [{ type: 'user_input', content: [{ type: 'text', text, annotations: [{ type: 'speech_metadata', style }] }] }],
            response_format: { type: 'audio' },
            generation_config: { speech_config: [{ voice }] },
        }),
    });
    const body = await res.text();
    if (!res.ok) { const e = new Error(`HTTP ${res.status}: ${body.slice(0, 300)}`); e.status = res.status; throw e; }
    const data = findAudio(JSON.parse(body));
    if (!data) throw new Error('No audio in response: ' + body.slice(0, 300));
    return Buffer.from(data, 'base64');
}
function findAudio(o) {
    if (!o || typeof o !== 'object') return null;
    if (typeof o.data === 'string' && o.data.length > 1000) return o.data;
    for (const v of Object.values(o)) { const r = findAudio(v); if (r) return r; }
    return null;
}
const dailyQuota = e => e.status === 429 && /per.?day|PerDay|daily|RPD/i.test(e.message);

// ---- batch splitting ----------------------------------------------------------
// Many lines from one speaker go into one request, separated by long pauses. The audio is
// split at the silences that best fit each line's expected length; a batch whose pieces
// don't fit is saved raw and retried as two smaller batches.

function rmsFrames(pcm, rate) {
    const n = Math.round(rate * 0.02), out = [];
    for (let i = 0; i + n <= pcm.length; i += n) {
        let s = 0;
        for (let j = i; j < i + n; j++) s += pcm[j] * pcm[j];
        out.push(Math.sqrt(s / n));
    }
    return { rms: out, frame: n };
}

export function splitBatch(pcm, rate, texts) {
    const { rms, frame } = rmsFrames(pcm, rate);
    const loud = rms.map(v => v > 450);
    const first = loud.indexOf(true), last = loud.lastIndexOf(true);
    if (first < 0) return null;
    const n = texts.length, need = n - 1;
    const fsec = frame / rate;
    const gaps = [];
    for (let i = first; i < last;) {
        if (loud[i]) { i++; continue; }
        let j = i;
        while (j < last && !loud[j]) j++;
        if (j - i >= 12) gaps.push({ start: i, end: j, len: j - i });
        i = j;
    }
    if (gaps.length < need) return null;
    const chars = texts.map(t => t.length), totalChars = chars.reduce((a, b) => a + b, 0);
    const longest = gaps.map(g => g.len).sort((a, b) => b - a).slice(0, need).reduce((a, b) => a + b, 0);
    const rate0 = (last + 1 - first - longest) * fsec / totalChars;
    const G = gaps.length, INF = 1e18;
    const pts = [{ end: first }].concat(gaps).concat([{ start: last + 1 }]);
    const cost = (a, b, k) => { const s = (pts[b].start - pts[a].end) * fsec; if (s <= 0) return INF; const r = Math.log(s / Math.max(0.3, chars[k] * rate0)); return r * r * 4; };
    const bonus = g => -Math.log(pts[g].len / 12);
    const dp = Array.from({ length: n }, () => new Float64Array(G + 2).fill(INF));
    const back = Array.from({ length: n }, () => new Int32Array(G + 2).fill(-1));
    for (let g = 1; g <= G; g++) dp[0][g] = cost(0, g, 0) + bonus(g);
    if (n === 1) dp[0][G + 1] = cost(0, G + 1, 0);
    for (let k = 1; k < n; k++) {
        const lastLine = k === n - 1;
        for (let g = k + 1; g <= G + 1; g++) {
            if (lastLine !== (g === G + 1)) continue;
            for (let p = k; p < g; p++) {
                if (dp[k - 1][p] >= INF) continue;
                const c = dp[k - 1][p] + cost(p, g, k) + (lastLine ? 0 : bonus(g));
                if (c < dp[k][g]) { dp[k][g] = c; back[k][g] = p; }
            }
        }
    }
    if (dp[n - 1][G + 1] >= INF) return null;
    const chosen = [];
    for (let k = n - 1, g = G + 1; k > 0; k--) { g = back[k][g]; chosen.unshift(g); }
    if (need && Math.min(...chosen.map(g => pts[g].len)) < 20) return null; // cuts must be > 0.4 s
    const bounds = [first].concat(chosen.map(g => Math.round((pts[g].start + pts[g].end) / 2))).concat([last + 1]);
    const pieces = [], secs = [];
    for (let k = 0; k < n; k++) {
        pieces.push(pcm.subarray(bounds[k] * frame, bounds[k + 1] * frame));
        let a = bounds[k], b = bounds[k + 1] - 1;
        while (a < b && !loud[a]) a++;
        while (b > a && !loud[b]) b--;
        secs.push((b - a + 1) * fsec);
    }
    const r1 = secs.reduce((a, b) => a + b, 0) / totalChars;
    for (let k = 0; k < n; k++) {
        const expect = chars[k] * r1;
        if (secs[k] < expect * 0.4 - 0.5 || secs[k] > expect * 2.4 + 1.0) return null;
    }
    return pieces;
}

function saveRaw(wav, lines) {
    fs.mkdirSync(RAW, { recursive: true });
    const id = lines[0].who + '-' + lines[0].id.split('-').pop() + '-' + lines.length;
    fs.writeFileSync(path.join(RAW, id + '.wav'), wav);
    fs.writeFileSync(path.join(RAW, id + '.json'), JSON.stringify(lines));
}

function resplit() {
    if (!fs.existsSync(RAW)) return console.log('Nothing in tools/voice-raw.');
    let n = 0;
    fs.mkdirSync(OUT, { recursive: true });
    for (const f of fs.readdirSync(RAW).filter(x => x.endsWith('.json'))) {
        const lines = JSON.parse(fs.readFileSync(path.join(RAW, f), 'utf8'));
        const { rate, pcm } = pcmFromWav(fs.readFileSync(path.join(RAW, f.replace('.json', '.wav'))));
        const pieces = splitBatch(pcm, rate, lines.map(l => l.say));
        if (!pieces) { console.log('still unsplittable:', f); continue; }
        pieces.forEach((p, k) => save(lines[k], p, rate));
        n += pieces.length;
        fs.unlinkSync(path.join(RAW, f)); fs.unlinkSync(path.join(RAW, f.replace('.json', '.wav')));
    }
    console.log('Recovered ' + n + ' lines. Manifest lists ' + writeManifest() + ' files.');
}

// ---- planning -----------------------------------------------------------------

// One model per speaker keeps each voice consistent. voices-cast.json pins a speaker with
// "model": "flash" (spreading the cast over both models' daily quotas); the rest use lite.
const modelFor = who => opt('--model') || ((CAST[who] || {}).model === 'flash' ? FLASH : LITE);

function plan(todo) {
    const size = flag('--single') ? 1 : +(opt('--batch') || 28);
    const by = {};
    todo.forEach(l => { (by[l.who] = by[l.who] || []).push(l); });
    const jobs = [];
    for (const [who, list] of Object.entries(by)) {
        for (let i = 0; i < list.length; i += size) jobs.push({ who, model: modelFor(who), lines: list.slice(i, i + size) });
    }
    return jobs;
}

async function render(key, todo) {
    fs.mkdirSync(OUT, { recursive: true });
    const jobs = plan(todo);
    const maxRequests = +(opt('--max-requests') || Infinity);
    const models = [...new Set(jobs.map(j => j.model))];
    let requests = 0, saved = 0;
    console.log(`${todo.length} lines to render in ${jobs.length} requests on ${models.join(', ')}.`);
    async function worker(model) {
        const queue = jobs.filter(j => j.model === model);
        let failures = 0;
        while (queue.length) {
            if (requests >= maxRequests) return;
            const job = queue.shift();
            const c = CAST[job.who];
            const single = job.lines.length === 1;
            const mood = single && job.lines[0].mood ? '; in this line: ' + job.lines[0].mood : '';
            const text = job.lines.map(l => l.say).join(' <long pause> <long pause> ');
            const style = c.style + mood + (single ? '' : '. Read each sentence group as a separate line, with a long, silent pause between them.');
            requests++;
            let wav;
            try {
                wav = await tts(key, model, c.voice, text, style);
            } catch (e) {
                if (dailyQuota(e)) { console.log(`DAILY QUOTA reached on ${model}; ${queue.length + 1} requests left for it. Run again after the reset.`); return; }
                if (e.status === 429) {
                    const m = e.message.match(/retry in (\d+)/i);
                    console.log(`429 on ${model}, waiting ${m ? m[1] : 30}s`);
                    await sleep(((m ? +m[1] : 30) + 2) * 1000);
                    queue.unshift(job); requests--;
                    continue;
                }
                console.log(`FAILED ${job.who} x${job.lines.length}: ${String(e.message).slice(0, 160)}`);
                if (++failures >= 4) { console.log(`Too many failures on ${model}; stopping it.`); return; }
                if (!job.retried) { job.retried = true; queue.push(job); }
                await sleep(15000);
                continue;
            }
            const { rate, pcm } = pcmFromWav(wav);
            const pieces = single ? [pcm] : splitBatch(pcm, rate, job.lines.map(l => l.say));
            if (!pieces) {
                saveRaw(wav, job.lines);
                const half = Math.ceil(job.lines.length / 2);
                console.log(`split failed for ${job.who} x${job.lines.length}; kept in tools/voice-raw, retrying as ${half} + ${job.lines.length - half}.`);
                queue.unshift({ ...job, lines: job.lines.slice(half) });
                queue.unshift({ ...job, lines: job.lines.slice(0, half) });
                await sleep(DELAY);
                continue;
            }
            pieces.forEach((p, k) => save(job.lines[k], p, rate));
            saved += pieces.length;
            writeManifest();
            console.log(`${new Date().toLocaleTimeString()} ${model === FLASH ? 'flash' : 'lite '} ${job.who}: saved ${pieces.length} lines (total ${saved})`);
            if (queue.length) await sleep(DELAY);
        }
    }
    await Promise.all(models.map(worker));
    console.log(`FINISHED: ${saved} lines saved, ${requests} requests used. Manifest lists ${writeManifest()} files.`);
}

async function audition(key, lines) {
    const dir = path.join(HERE, 'voice-auditions');
    fs.mkdirSync(dir, { recursive: true });
    const seen = new Set();
    for (const l of lines.filter(x => !seen.has(x.who) && seen.add(x.who))) {
        const c = CAST[l.who];
        const { rate, pcm } = pcmFromWav(await tts(key, modelFor(l.who), c.voice, l.say, c.style));
        fs.writeFileSync(path.join(dir, l.who + '.mp3'), toMp3(applyFx(l.who, trim(pcm, rate), rate), rate));
        console.log('audition', l.who, c.voice);
        await sleep(DELAY);
    }
}

// ---- main ---------------------------------------------------------------------

async function main() {
    if (flag('--manifest')) return console.log('Manifest lists ' + writeManifest() + ' files.');
    if (flag('--resplit')) return resplit();
    const { lines: all, skipped } = collect(loadGame());
    let lines = all;
    if (opt('--only')) lines = lines.filter(l => l.who === opt('--only'));
    const todo = lines.filter(l => !rendered(l));

    if (flag('--prune')) {
        const keep = new Set(all.map(fileOf));
        let n = 0;
        if (fs.existsSync(OUT)) fs.readdirSync(OUT).filter(f => f.endsWith('.mp3') && !keep.has(f)).forEach(f => { fs.unlinkSync(path.join(OUT, f)); n++; });
        return console.log('Removed ' + n + ' orphaned recordings. Manifest lists ' + writeManifest() + ' files.');
    }
    if (flag('--report')) {
        todo.forEach(l => console.log(`${l.who.padEnd(14)} ${l.where.padEnd(22)} ${l.text}`));
        skipped.forEach(s => console.log(`SKIPPED ${s.who}: ${s.why}: ${s.text}`));
        return console.log(`${todo.length} lines on browser-voice fallback, ${skipped.length} skipped.`);
    }
    if (flag('--plan')) {
        plan(todo).forEach(j => console.log(`${j.model.padEnd(26)} ${j.who.padEnd(14)} ${j.lines.length} lines`));
        return console.log(`${todo.length} lines, ${plan(todo).length} requests.`);
    }
    if (flag('--render') || flag('--audition')) {
        const key = apiKey();
        if (!key) { console.error('No API key. Put it in ' + KEY_FILE + ' or set GEMINI_API_KEY.'); process.exit(1); }
        if (flag('--audition')) return audition(key, lines);
        return render(key, todo);
    }
    const by = {};
    lines.forEach(l => { const b = by[l.who] || (by[l.who] = { done: 0, total: 0 }); b.total++; if (rendered(l)) b.done++; });
    Object.entries(by).forEach(([who, b]) => console.log(`${who.padEnd(14)} ${b.done}/${b.total}`));
    skipped.forEach(s => console.log(`SKIPPED ${s.who}: ${s.why}: ${s.text}`));
    console.log(`${lines.length - todo.length}/${lines.length} lines rendered; ${plan(todo).length} requests to go. Use --render to record.`);
}

if (path.resolve(process.argv[1] || '') === fileURLToPath(import.meta.url)) {
    main().catch(e => { console.error(e); process.exit(1); });
}
