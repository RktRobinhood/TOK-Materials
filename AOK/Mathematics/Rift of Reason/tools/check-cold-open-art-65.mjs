// Read-only production checks for the cold-open art handoff. Does not alter pixels.
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {load, alphaBox, findIslands} from './assets/image.mjs';
import {readManifest} from './assets/manifest.mjs';

const game = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const inventory = JSON.parse(await fs.readFile(path.join(game, 'design/source-assets/6-cutscene/generation.json')));
const waking = JSON.parse(await fs.readFile(path.join(game, 'design/source-assets/6-cutscene/waking/generation.json')));
const records = [...inventory.records, ...waking.records];
const manifest = await readManifest(path.join(game, 'data/assets.js'));
const errors = [], assets = [];
const hash = data => createHash('sha256').update(data).digest('hex');
function stats(img) {
    let transparent = 0, solid = 0;
    for (let p = 3; p < img.data.length; p += 4) {
        if (img.data[p] <= 8) transparent++;
        if (img.data[p] > 170) solid++;
    }
    const pixels = img.w * img.h;
    return {w: img.w, h: img.h, transparentPercent: Math.round(1000 * transparent / pixels) / 10,
        solidPercent: Math.round(1000 * solid / pixels) / 10,
        cornerAlpha: [0, img.w - 1, img.w * (img.h - 1), pixels - 1].map(p => img.data[p * 4 + 3])};
}
const seen = new Set();
for (const record of records) {
    const sourceFile = path.join(game, record.source), source = await load(sourceFile), sourceStats = stats(source);
    if (!record.prompt || !record.refs.length || !record.visualReview) errors.push(record.key + ': missing provenance');
    if (record.transparent && (sourceStats.transparentPercent < 5 || sourceStats.solidPercent < .05)) errors.push(record.key + ': missing alpha or subject');
    if (!record.transparent && sourceStats.transparentPercent > .1) errors.push(record.key + ': opaque background expected');
    if (record.ids && findIslands(source, {minArea: 2500}).islands.length !== 2) errors.push(record.key + ': expected two separate sleepers');
    const entry = {key: record.key, source: {...sourceStats, sha256: hash(await fs.readFile(sourceFile))}, outputs: []};
    for (const id of record.ids || [record.id]) {
        if (seen.has(id)) errors.push('Duplicate id: ' + id);
        seen.add(id);
        const asset = manifest[id];
        if (!asset) { errors.push('Missing manifest id: ' + id); continue; }
        const file = path.join(game, 'assets', asset.file), image = await load(file), runtime = stats(image);
        if (asset.w !== image.w || asset.h !== image.h) errors.push(id + ': dimensions disagree with manifest');
        if (!alphaBox(image)) errors.push(id + ': empty artwork');
        if (record.transparent && runtime.transparentPercent < 5) errors.push(id + ': alpha lost in build');
        if (record.ids && (image.h > 620 || runtime.cornerAlpha.some(a => a > 2))) errors.push(id + ': sleeper size/alpha defect');
        if (id.startsWith('cutscene/cold-open-') && (image.w !== 1600 || Math.abs(image.h - 900) > 1)) errors.push(id + ': layer canvas not preserved');
        entry.outputs.push({id, ...asset, ...runtime, bytes: (await fs.stat(file)).size, sha256: hash(await fs.readFile(file))});
    }
    assets.push(entry);
}
if (seen.size !== 27) errors.push('Expected 27 cutscene asset IDs, found ' + seen.size);
console.log(JSON.stringify({issue: 65, sourcePaintings: records.length, assetIds: seen.size, errors,
    status: errors.length ? 'fail' : 'source/runtime checks pass', assets}, null, 2));
if (errors.length) process.exitCode = 1;
