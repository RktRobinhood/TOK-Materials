// Proportionate read-only checks; JSON report goes to stdout, not the inventory.
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {load, alphaBox} from './assets/image.mjs';
import {readManifest} from './assets/manifest.mjs';
import {fileFor} from './assets/classes.mjs';

const game = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dir = path.join(game, 'design/source-assets/4-caricatures/production-145-2026-10-13');
const inventory = JSON.parse(await fs.readFile(path.join(dir, 'inventory.json'), 'utf8'));
const selected = [...inventory.portraits, ...inventory.motifs, inventory.axiomMotif].filter(record => record?.status === 'selected');
const manifest = await readManifest(path.join(game, 'data/assets.js'));
const assets = [], errors = [], warnings = [];
const hash = async file => createHash('sha256').update(await fs.readFile(file)).digest('hex');
function alphaStats(image) {
    let transparent = 0, solid = 0;
    for (let p = 3; p < image.data.length; p += 4) {
        if (image.data[p] <= 8) transparent++;
        if (image.data[p] > 170) solid++;
    }
    const pixels = image.w * image.h;
    return {
        transparentPercent: Math.round(1000 * transparent / pixels) / 10,
        solidPercent: Math.round(1000 * solid / pixels) / 10,
        cornerAlpha: [0, image.w - 1, image.w * (image.h - 1), pixels - 1].map(p => image.data[p * 4 + 3]),
    };
}
function checkAlpha(image, id, stage) {
    const stats = alphaStats(image);
    if (stats.transparentPercent < 5 || stats.solidPercent < 5 || stats.cornerAlpha.some(alpha => alpha > 2)) {
        errors.push(id + ': ' + stage + ' needs a transparent background and visible artwork; inspect for opaque checkerboard.');
    }
    return stats;
}
if (!selected.length) warnings.push('No selected assets yet.');
if (new Set(selected.map(record => record.id)).size !== selected.length) errors.push('Duplicate selected art id.');
for (const record of selected) {
    try {
        if (!record.prompt || !record.source || !record.generatedOutput || !record.styleReferences?.length || !record.visualReview || record.transparentBackgroundRequested !== true) {
            errors.push(record.id + ': incomplete prompt/reference/output/visual-review provenance.');
        }
        const sourceFile = path.join(dir, record.source);
        const source = await load(sourceFile), box = alphaBox(source);
        if (!box) errors.push(record.id + ': source artwork is empty.');
        if (source.w < 70 || source.h < 70) errors.push(record.id + ': source is too small for a 70px sample.');
        if (box && (box.x === 0 || box.y === 0 || box.x + box.w === source.w || box.y + box.h === source.h)) {
            warnings.push(record.id + ': source silhouette contacts an edge; manually check for major cropping, accept minor tips.');
        }
        const result = {id: record.id, source: {w: source.w, h: source.h, alphaBox: box, ...checkAlpha(source, record.id, 'source'), sha256: await hash(sourceFile)}};
        const entry = manifest[record.id];
        if (!entry) result.runtime = {status: 'pending manifest/build'};
        else {
            const builtFile = path.join(game, 'assets', entry.file), built = await load(builtFile);
            if (entry.file !== fileFor(record.id) || entry.w !== built.w || entry.h !== built.h) errors.push(record.id + ': manifest file/dimensions do not match built asset.');
            if (built.h > 620) errors.push(record.id + ': runtime artwork exceeds the 620px height cap.');
            result.runtime = {status: 'built', ...entry, ...checkAlpha(built, record.id, 'runtime'), sha256: await hash(builtFile), bytes: (await fs.stat(builtFile)).size};
        }
        assets.push(result);
    } catch (error) { errors.push(record.id + ': ' + error.message); }
}
const pending = assets.filter(asset => asset.runtime.status !== 'built').length;
console.log(JSON.stringify({issue: 145, selected: selected.length, pending, status: errors.length ? 'fail' : pending ? 'source checks pass; runtime pending' : 'basic asset checks pass', warnings, errors, assets}, null, 2));
if (errors.length) process.exitCode = 1;
