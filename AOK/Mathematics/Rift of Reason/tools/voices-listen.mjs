// Have a Gemini text model listen to rendered voice lines and report what it hears, to catch
// mis-split batches (a file holding the wrong line) or stage directions read aloud without a
// human ear. Uses a text model's quota, not the TTS quota. Ported from the Odyssey game.
//
//   node tools/voices-listen.mjs muskrat narrator     check every rendered line of these speakers
import fs from 'node:fs';
import path from 'node:path';
import { loadRift, GAME_DIR } from './test/harness.mjs';
import { spoken } from './voices.mjs';

const MODEL = process.env.LISTEN_MODEL || 'gemini-3.8-flash';
const KEY_FILE = path.resolve(GAME_DIR, '..', '..', '..', '.secrets', 'gemini_api_key');
const key = (process.env.GEMINI_API_KEY || fs.readFileSync(KEY_FILE, 'utf8')).trim().split(/\s+/)[0];
const who = process.argv.slice(2);

const scripts = fs.readdirSync(path.join(GAME_DIR, 'data', 'script')).filter(f => f.endsWith('.js'));
const Rift = loadRift(['js/core/rift.js', 'data/creatures.js', ...scripts.map(f => 'data/script/' + f)]);
const lines = [];
const walk = n => {
    if (Array.isArray(n)) return n.forEach(walk);
    if (!n || typeof n !== 'object') return;
    if (typeof n.s === 'string' && typeof n.t === 'string') lines.push({ who: n.s, text: n.t });
    Object.entries(n).forEach(([k, v]) => { if (k !== 't' && typeof v === 'object') walk(v); });
};
walk(Object.values(Rift.data.script || {}));
Object.entries(Rift.data.creatures).forEach(([id, c]) => (c.lines || []).forEach(t => lines.push({ who: id, text: t })));

let bad = 0;
for (const l of lines.filter(x => who.includes(x.who))) {
    const file = path.join(GAME_DIR, 'assets', 'voice', Rift.voiceId(l.who, l.text) + '.mp3');
    if (!fs.existsSync(file)) { console.log('MISSING', l.who, l.text.slice(0, 50)); continue; }
    const prompt = `Listen to this voice line from a game. The script is: "${spoken(l.text)}".
Reply in exactly three lines:
HEARD: <verbatim transcript>
OK: <yes if it is this script line, every script word is spoken and nothing else is said; otherwise no>
SOUND: <a few words on how the voice sounds>`;
    let res;
    for (let t = 0; t < 5; t++) {
        res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, {
            method: 'POST',
            headers: { 'x-goog-api-key': key, 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ inline_data: { mime_type: 'audio/mpeg', data: fs.readFileSync(file).toString('base64') } }, { text: prompt }] }] }),
        });
        if (res.status !== 503) break;
        await new Promise(r => setTimeout(r, 8000 * (t + 1)));
    }
    const j = await res.json();
    const out = res.ok ? (j.candidates?.[0]?.content?.parts || []).map(p => p.text || '').join('').trim() : 'HTTP ' + res.status + ' ' + JSON.stringify(j).slice(0, 200);
    if (!/OK:\s*yes/i.test(out)) bad++;
    console.log(`--- ${l.who}: ${l.text.slice(0, 70)}\n${out}`);
}
console.log(bad ? `${bad} line(s) need a look.` : 'All checked lines OK.');
