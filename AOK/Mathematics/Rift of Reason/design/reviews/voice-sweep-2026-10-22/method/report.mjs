// FAL-262: summarise classified.json into the re-record list and request plan.
// Usage: node report.mjs <game-dir> <classified.json> <out-dir>
import fs from 'node:fs'; import path from 'node:path';
const [game, inFile, outDir] = process.argv.slice(2);
const report = JSON.parse(fs.readFileSync(inFile, 'utf8'));
const cast = JSON.parse(fs.readFileSync(path.join(game, 'tools', 'voices-cast.json'), 'utf8'));
const speakerOf = id => id.replace(/-[^-]+$/, '');
const baseOf = s => s.replace(/-(inner|possessed)$/, '');
const modelOf = s => ((cast[s] || cast[baseOf(s)] || {}).model === 'flash' ? 'flash' : 'lite');
const words = t => t.toLowerCase().replace(/[’']/g, '').split(/[^\p{L}\p{N}]+/u).filter(Boolean).join(' ');
const likely = Object.entries(report).filter(([, r]) => r.grade === 'likely');
const review = Object.entries(report).filter(([, r]) => r.grade === 'review');
// A flagged line whose exact words are the whole transcript of another clip by the same speaker.
const heardBy = {};
for (const [id, r] of Object.entries(report)) (heardBy[speakerOf(id) + '|' + words(r.heard)] ||= []).push(id);
const copyable = likely.map(([id, r]) => [id, (heardBy[speakerOf(id) + '|' + words(r.say)] || []).filter(o => o !== id)]).filter(([, o]) => o.length);
const by = {};
for (const [id] of likely) (by[speakerOf(id)] ||= []).push(id);
const plan = Object.entries(by).map(([s, ids]) => ({speaker: s, model: modelOf(s), lines: ids.length, requests: Math.ceil(ids.length / 28)})).sort((a, b) => b.lines - a.lines);
const req = m => plan.filter(p => p.model === m).reduce((a, p) => a + p.requests, 0);
fs.mkdirSync(outDir, {recursive: true});
fs.writeFileSync(path.join(outDir, 'rerecord.json'), JSON.stringify(Object.fromEntries(Object.entries(by).map(([s, ids]) => [s, ids.map(id => ({id, flag: report[id].flag, say: report[id].say, heard: report[id].heard}))])), null, 1) + '\n');
fs.writeFileSync(path.join(outDir, 'review.json'), JSON.stringify(Object.fromEntries(review.map(([id, r]) => [id, {flag: r.flag, say: r.say, heard: r.heard}])), null, 1) + '\n');
fs.writeFileSync(path.join(outDir, 'sweep.json'), JSON.stringify({checker: 'faster-whisper small (local CPU, int8, beam 5)', clips: Object.fromEntries(Object.entries(report).sort().map(([id, r]) => [id, {sha256: r.sha256, say: r.say, heard: r.heard, ...(r.flag ? {flag: r.flag, grade: r.grade} : {})}]))}, null, 1) + '\n');
console.log(JSON.stringify({clips: Object.keys(report).length, likely: likely.length, review: review.length, speakers: plan.length, lite: req('lite'), flash: req('flash'), copyable: copyable.length}));
console.log(plan.map(p => `${p.speaker} ${p.model} ${p.lines}`).join('\n'));
fs.writeFileSync(path.join(outDir, '.plan.json'), JSON.stringify({plan, copyable}, null, 1));
