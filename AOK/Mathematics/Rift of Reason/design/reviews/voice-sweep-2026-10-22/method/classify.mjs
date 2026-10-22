// FAL-262: classify sweep transcripts. A clip is flagged when its transcript is missing words or
// has extra words at the start or end compared with its script line (homophones and digit
// readings normalised on both sides). Extra words are matched to the edges of the same speaker's
// other lines to name the neighbour a slipped cut came from or went to.
// Usage: node classify.mjs <game-dir> <out.json> sweep-0.json [sweep-1.json …]
import fs from 'node:fs'; import path from 'node:path'; import {pathToFileURL} from 'node:url';
const [game, outFile, ...inputs] = process.argv.slice(2);
const {matchWords} = await import(pathToFileURL(path.join(game, 'tools', 'voices.mjs')).href);
const SAME = {whos: 'whose', its: 'its', theyre: 'their', there: 'their', youre: 'your', to: '2', too: '2', for: '4', won: '1', ate: '8', colour: 'color', grey: 'gray',
    okay: 'ok', x: 'cross', check: 'tick', checkmark: 'tick', plus: '', percent: '', mr: 'mister', vs: 'versus'};
const UNITS = ['zero','one','two','three','four','five','six','seven','eight','nine','ten','eleven','twelve','thirteen','fourteen','fifteen','sixteen','seventeen','eighteen','nineteen'];
const TENS = {twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90};
const FILLER = new Set(['hmm', 'hm', 'hmph', 'um', 'uh', 'mm', 'ah', 'oh', 'ha', 'huh']);
// Number words to digits ("thirty one" -> 31), then runs of digits joined ("9 02" -> 902).
function numbers(ws) {
    const out = [];
    for (let i = 0; i < ws.length; i++) {
        const w = ws[i];
        if (w in TENS) { const u = UNITS.indexOf(ws[i + 1]); if (u > 0 && u < 10) { out.push(String(TENS[w] + u)); i++; } else out.push(String(TENS[w])); continue; }
        if (w === 'hundred' && /^\d+$/.test(out.at(-1) || '')) { out[out.length - 1] = String(+out.at(-1) * 100); continue; }
        const u = UNITS.indexOf(w);
        out.push(u >= 0 ? String(u) : w);
    }
    return out.reduce((a, w) => (/^\d+$/.test(w) && /^\d+$/.test(a.at(-1) || '') ? (a[a.length - 1] += w, a) : (a.push(w), a)), []);
}
// Marks are compared as the words they are read as; articles are dropped on both sides.
const canon = t => numbers(matchWords(t.replace(/[✓✔]/g, ' tick ').replace(/[✕✗✘]/g, ' cross ')).filter(w => !FILLER.has(w) && w !== 'a' && w !== 'an')).map(w => SAME[w] ?? w).filter(Boolean);
const clips = Object.assign({}, ...inputs.map(f => JSON.parse(fs.readFileSync(f, 'utf8'))));
function lcs(a, b) {
    const m = b.length, rows = Array.from({length: a.length + 1}, () => new Uint16Array(m + 1));
    for (let i = a.length - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) rows[i][j] = a[i] === b[j] ? rows[i + 1][j + 1] + 1 : Math.max(rows[i + 1][j], rows[i][j + 1]);
    const pairs = [];
    for (let i = 0, j = 0; i < a.length && j < m;) { if (a[i] === b[j]) pairs.push([i++, j++]); else if (rows[i + 1][j] >= rows[i][j + 1]) i++; else j++; }
    return pairs;
}
const bySpeaker = {};
for (const [id, c] of Object.entries(clips)) (bySpeaker[id.replace(/-[^-]+$/, '')] ||= []).push([id, canon(c.say), canon(c.heard)]);
const endsWith = (w, tail) => tail.length && tail.every((x, i) => w[w.length - tail.length + i] === x);
const startsWith = (w, head) => head.length && head.every((x, i) => w[i] === x);
const report = {};
for (const [id, c] of Object.entries(clips)) {
    const E = canon(c.say), H = canon(c.heard), pairs = lcs(E, H);
    const r = {say: c.say, heard: c.heard, sha256: c.sha256, matched: pairs.length + '/' + E.length};
    if (!E.length) { report[id] = r; continue; } // only fillers ("Oh.")
    if (!pairs.length) { r.flag = 'nothing matched'; r.grade = E.length >= 3 ? 'likely' : 'review'; report[id] = r; continue; }
    const [e0, h0] = pairs[0], [e1, h1] = pairs.at(-1);
    r.headMissing = E.slice(0, e0); r.tailMissing = E.slice(e1 + 1);
    r.headExtra = H.slice(0, h0); r.tailExtra = H.slice(h1 + 1);
    r.midMissing = E.length - pairs.length - r.headMissing.length - r.tailMissing.length;
    const edge = (miss, extra) => (miss.length !== extra.length) || miss.length >= 2;
    const flags = [];
    if (edge(r.headMissing, r.headExtra)) flags.push(r.headExtra.length > r.headMissing.length ? 'extra at start' : 'missing at start');
    if (edge(r.tailMissing, r.tailExtra)) flags.push(r.tailExtra.length > r.tailMissing.length ? 'extra at end' : 'missing at end');
    if (pairs.length < E.length * 0.6 && E.length >= 3) flags.push('mostly unmatched');
    if (flags.length) r.flag = flags.join(', ');
    // Where did extra words come from? The end of another line (start) or the start of one (end).
    const speaker = id.replace(/-[^-]+$/, ''), others = (bySpeaker[speaker] || []).filter(([o]) => o !== id);
    // Missing words are looked for at the edge of another clip's transcript, where they would have slipped.
    const tail3 = w => w.slice(-Math.min(3, w.length)), head3 = w => w.slice(0, Math.min(3, w.length));
    const from = [], to = [];
    if (r.flag?.includes('extra at start')) from.push(...others.filter(([, w]) => endsWith(w, tail3(r.headExtra))).map(([o]) => o + ' (its line ends so)'));
    if (r.flag?.includes('extra at end')) to.push(...others.filter(([, w]) => startsWith(w, head3(r.tailExtra))).map(([o]) => o + ' (its line starts so)'));
    if (r.flag?.includes('missing at start')) from.push(...others.filter(([, w, h]) => endsWith(h, tail3(r.headMissing)) && !endsWith(w, tail3(r.headMissing))).map(([o]) => o + ' (heard at its end)'));
    if (r.flag?.includes('missing at end')) to.push(...others.filter(([, w, h]) => startsWith(h, head3(r.tailMissing)) && !startsWith(w, head3(r.tailMissing))).map(([o]) => o + ' (heard at its start)'));
    if (from.length) r.from = from;
    if (to.length) r.to = to;
    if (r.flag) r.grade = (r.from?.length || r.to?.length || Math.abs(r.headExtra.length - r.headMissing.length) >= 2 || Math.abs(r.tailExtra.length - r.tailMissing.length) >= 2 || r.flag.includes('matched')) ? 'likely' : 'review';
    report[id] = r;
}
const flagged = Object.entries(report).filter(([, r]) => r.flag);
fs.writeFileSync(outFile, JSON.stringify(report, null, 1));
const tally = {};
flagged.forEach(([, r]) => r.flag.split(', ').forEach(f => tally[f] = (tally[f] || 0) + 1));
console.log(Object.keys(report).length, 'clips;', flagged.length, 'flagged (', flagged.filter(([, r]) => r.grade === 'likely').length, 'likely)', JSON.stringify(tally));
