#!/usr/bin/env node
/*
 * Art pipeline: design/source-assets/**.png -> assets/**.webp + data/assets.js.
 *
 *   node tools/build-assets.mjs              build everything that changed
 *   node tools/build-assets.mjs --only owlet rebuild sheets whose file name or ids contain "owlet"
 *   node tools/build-assets.mjs --dry-run    slice and report, write nothing
 *   --force    ignore the cache        --prune   drop manifest entries and .webp files no sheet produces
 *   --src <dir> --out <dir> --manifest <file> --cache <file> --mapping <file>   overrides (for testing)
 *
 * Which ids each PNG becomes is in tools/assets/sheets.json.
 */
import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdir, readFile, readdir, unlink, writeFile } from 'node:fs/promises';
import { basename, dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CLASSES, OUTPUT_FOLDERS, QUALITY, SMALL_QUALITY, classify, fileFor } from './assets/classes.mjs';
import { alphaBox, crop, extract, rotate, findIslands, islandBox, load, mergeColumns, packWalk, readingOrder, sourceSize, trim, writeScene, writeSprite } from './assets/image.mjs';
import { manifestText, readManifest } from './assets/manifest.mjs';
import { previewHtml } from './assets/preview.mjs';

const TOOL_VERSION = 1;
const HERE = dirname(fileURLToPath(import.meta.url));
const GAME = resolve(HERE, '..');
const STAGES = ['0-style', '1-avatars', '2-world', '3-cast', '4-caricatures', '5-ui'];

// ---- options ----------------------------------------------------------------

function parseArgs(argv) {
    const o = {
        src: join(GAME, 'design', 'source-assets'),
        out: join(GAME, 'assets'),
        manifest: join(GAME, 'data', 'assets.js'),
        cache: join(HERE, '.asset-cache.json'),
        mapping: join(HERE, 'assets', 'sheets.json'),
        only: null, dry: false, force: false, prune: false,
    };
    for (let i = 0; i < argv.length; i++) {
        const a = argv[i];
        const value = () => {
            if (i + 1 >= argv.length) throw new Error(`${a} needs a value`);
            return argv[++i];
        };
        if (a === '--only') o.only = value().toLowerCase();
        else if (a === '--dry-run') o.dry = true;
        else if (a === '--force') o.force = true;
        else if (a === '--prune') o.prune = true;
        else if (['--src', '--out', '--manifest', '--cache', '--mapping'].includes(a)) o[a.slice(2)] = resolve(value());
        else if (a === '--help' || a === '-h') o.help = true;
        else throw new Error(`unknown option ${a} (try --help)`);
    }
    return o;
}

const posix = p => p.split('\\').join('/');

async function findPngs(dir) {
    const out = [];
    async function walk(d) {
        let list;
        try {
            list = await readdir(d, { withFileTypes: true });
        } catch {
            return;
        }
        for (const e of list) {
            const p = join(d, e.name);
            if (e.isDirectory()) await walk(p);
            else if (/\.png$/i.test(e.name)) out.push(p);
        }
    }
    await walk(dir);
    return out.sort();
}

// sheets.json entry -> { id, also, class, rotate } or null
function outputSpec(entry) {
    if (entry === null) return null;
    if (typeof entry === 'string') return { id: entry, also: [] };
    if (Array.isArray(entry)) return { id: entry[0], also: entry.slice(1) };
    return { id: entry.id, also: entry.also || [], class: entry.class, rotate: entry.rotate };
}

function sheetIds(spec) {
    if (spec.type === 'scene' || spec.type === 'single') return [spec.id];
    if (spec.type === 'walk') return spec.rows || [];
    if (spec.type === 'islands') return spec.ids.map(outputSpec).filter(Boolean).flatMap(s => [s.id, ...s.also]);
    return [];
}

function capsFor(id, cls) {
    const name = cls || classify(id);
    const caps = CLASSES[name];
    if (!caps) throw new Error(`unknown class "${name}" for ${id}`);
    return caps;
}

// ---- slicing per sheet type ----------------------------------------------------

async function doScene(file, spec, ctx) {
    const caps = CLASSES.scene;
    const maxW = spec.maxWidth || caps.maxW;
    const smallW = spec.smallWidth || caps.smallW;
    const rel = fileFor(spec.id);
    const relSmall = fileFor(spec.id, '-small');
    const big = await writeScene(file, join(ctx.out, rel), maxW, QUALITY, ctx.dry);
    await writeScene(file, join(ctx.out, relSmall), smallW, SMALL_QUALITY, ctx.dry);
    const size = await sourceSize(file);
    const notes = size.w < 1672 ? [`source is only ${size.w}×${size.h}; backgrounds should be at least 1672×941`] : [];
    return { outputs: [{ id: spec.id, entry: { file: rel, w: big.w, h: big.h, small: relSmall } }], size, notes };
}

async function doSingle(file, spec, ctx) {
    const img = await load(file);
    const piece = trim(img, 8);
    if (!piece) return { error: 'image is completely transparent', size: { w: img.w, h: img.h } };
    const rel = fileFor(spec.id);
    const { w, h } = await writeSprite(piece, join(ctx.out, rel), capsFor(spec.id, spec.class), QUALITY, ctx.dry);
    return { outputs: [{ id: spec.id, entry: { file: rel, w, h } }], size: { w: img.w, h: img.h } };
}

function islandOpts(spec) {
    return { threshold: spec.threshold, minArea: spec.minArea, mergeDist: spec.mergeDist };
}

function mismatchHint(found, rows) {
    const areas = found.islands.map(i => i.area).sort((a, b) => a - b);
    const bits = [`rows of ${rows.map(r => r.items.length).join('+')}`];
    if (areas.length) bits.push(`smallest figure ${areas[0]}`);
    if (found.biggestSmall) bits.push(`biggest blob under minArea ${found.biggestSmall}`);
    bits.push(`minArea ${found.minArea}`);
    return bits.join(', ');
}

async function doIslands(file, spec, ctx) {
    const img = await load(file);
    const size = { w: img.w, h: img.h };
    const outs = spec.ids.map(outputSpec);
    const found = findIslands(img, islandOpts(spec));
    const rows = readingOrder(found.islands);
    let ordered = rows.flatMap(r => r.items);
    // "join": [[a, b], ...] merges figure b into figure a (indexes in reading order, before
    // matching ids): for an effect that floats free of its owner and overlaps a neighbour.
    for (const [a, z] of [...(spec.join || [])].sort((p, q) => q[1] - p[1])) {
        const keep = ordered[a], drop = ordered[z];
        if (!keep || !drop) continue;
        for (let l = 0; l < found.owner.length; l++) if (found.owner[l] === drop.label) found.owner[l] = keep.label;
        keep.x0 = Math.min(keep.x0, drop.x0); keep.y0 = Math.min(keep.y0, drop.y0);
        keep.x1 = Math.max(keep.x1, drop.x1); keep.y1 = Math.max(keep.y1, drop.y1);
        keep.area += drop.area;
        ordered = ordered.filter(i => i !== drop);
    }
    const boxes = ordered.map((isl, i) => ({ ...islandBox(found, isl), label: outs[i] ? outs[i].id : (i < outs.length ? '(dropped)' : '?') }));
    if (ordered.length !== outs.length) {
        return { error: `found ${ordered.length} figures, expected ${outs.length} (${mismatchHint(found, rows)}); sheet skipped`, boxes, size };
    }
    const outputs = [];
    for (let i = 0; i < ordered.length; i++) {
        const o = outs[i];
        if (!o) continue;
        let piece = extract(img, found, ordered[i], { margin: spec.margin });
        if (o.rotate) piece = rotate(piece, Math.round(o.rotate / 90));
        const rel = fileFor(o.id);
        const { w, h } = await writeSprite(piece, join(ctx.out, rel), capsFor(o.id, o.class || spec.class), QUALITY, ctx.dry);
        for (const id of [o.id, ...o.also]) outputs.push({ id, entry: { file: rel, w, h } });
    }
    const notes = found.merged ? [`${found.merged} small blob(s) (sparkles) merged into nearby figures`] : [];
    if (found.ignored) notes.push(`${found.ignored} speck(s) ignored`);
    return { outputs, boxes, size, notes };
}

// Equal-width cells across a band of the sheet (fallback when frames touch).
function equalCells(img, band, n) {
    const frames = [];
    const cw = band.w / n;
    for (let i = 0; i < n; i++) {
        const x = Math.round(band.x + i * cw);
        const w = Math.round(band.x + (i + 1) * cw) - x;
        frames.push({ img: trim(crop(img, x, band.y, w, band.h), 8), box: { x, y: band.y, w, h: band.h } });
    }
    return frames;
}

async function doWalk(file, spec, ctx) {
    const img = await load(file);
    const size = { w: img.w, h: img.h };
    const n = spec.frames || 6;
    const rowIds = spec.rows;
    const found = findIslands(img, islandOpts(spec));
    const rows = readingOrder(found.islands);
    const notes = [];
    let frameRows;
    if (rows.length === rowIds.length) {
        frameRows = rows.map((r, ri) => {
            const items = r.items.length > n ? mergeColumns(found, r.items) : r.items;
            if (items.length === n) {
                if (items.length !== r.items.length) notes.push(`row ${ri + 1}: ${r.items.length - n} loose piece(s) joined to the frame above or below them`);
                return items.map(isl => ({ img: extract(img, found, isl, { margin: spec.margin }), box: islandBox(found, isl) }));
            }
            notes.push(`row ${ri + 1}: found ${r.items.length} figures, not ${n}; cut into ${n} equal cells instead`);
            const boxes = r.items.map(isl => islandBox(found, isl));
            const x0 = Math.min(...boxes.map(b => b.x));
            const x1 = Math.max(...boxes.map(b => b.x + b.w));
            const y0 = Math.min(...boxes.map(b => b.y));
            const y1 = Math.min(img.h, Math.max(...boxes.map(b => b.y + b.h)));
            return equalCells(img, { x: x0, y: y0, w: Math.min(img.w, x1) - x0, h: y1 - y0 }, n);
        });
    } else {
        notes.push(`found ${rows.length} rows of figures, not ${rowIds.length}; cut the sheet into an equal ${rowIds.length}×${n} grid instead`);
        const box = alphaBox(img, 8);
        if (!box) return { error: 'image is completely transparent', size };
        const bh = box.h / rowIds.length;
        frameRows = rowIds.map((_, ri) => {
            const y = Math.round(box.y + ri * bh);
            return equalCells(img, { x: box.x, y, w: box.w, h: Math.round(box.y + (ri + 1) * bh) - y }, n);
        });
    }
    const boxes = [];
    const outputs = [];
    for (let ri = 0; ri < rowIds.length; ri++) {
        const frames = frameRows[ri];
        frames.forEach((f, fi) => boxes.push({ ...f.box, label: `${rowIds[ri].split('/')[1]} ${fi + 1}` }));
        if (frames.some(f => !f.img)) return { error: `row ${ri + 1} has an empty frame; sheet skipped`, boxes, size, notes };
        const id = rowIds[ri];
        const caps = capsFor(id, spec.class);
        const { strip, frameWidth, frameHeight } = await packWalk(frames.map(f => f.img), caps.maxH);
        const rel = fileFor(id);
        const { w, h } = await writeSprite(strip, join(ctx.out, rel), {}, QUALITY, ctx.dry);
        outputs.push({ id, entry: { file: rel, w, h, frames: n, frameWidth, frameHeight } });
    }
    return { outputs, boxes, size, notes };
}

const HANDLERS = { scene: doScene, single: doSingle, islands: doIslands, walk: doWalk };

// ---- main ----------------------------------------------------------------

async function main() {
    const o = parseArgs(process.argv.slice(2));
    if (o.help) {
        console.log(await readFile(fileURLToPath(import.meta.url), 'utf8').then(t => t.split('*/')[0]));
        return;
    }
    const mapping = JSON.parse(await readFile(o.mapping, 'utf8')).sheets;
    const warnings = [];

    const seen = new Map();
    for (const [name, spec] of Object.entries(mapping)) {
        if (!HANDLERS[spec.type] && spec.type !== 'skip') throw new Error(`sheets.json: ${name} has unknown type "${spec.type}"`);
        for (const id of sheetIds(spec)) {
            if (seen.has(id)) warnings.push(`sheets.json: ${id} is listed by both ${seen.get(id)} and ${name}`);
            seen.set(id, name);
        }
    }

    if (!o.dry) for (const s of STAGES) await mkdir(join(o.src, s), { recursive: true });
    const pngs = await findPngs(o.src);
    const byName = new Map();
    for (const p of pngs) {
        const name = basename(p).toLowerCase();
        if (byName.has(name)) warnings.push(`two files called ${basename(p)}: using ${posix(relative(o.src, byName.get(name)))}`);
        else byName.set(name, p);
    }
    const mapLower = new Map(Object.entries(mapping).map(([k, v]) => [k.toLowerCase(), v]));
    const unmapped = [...byName.entries()].filter(([n]) => !mapLower.has(n)).map(([, p]) => posix(relative(o.src, p)));
    const waiting = Object.entries(mapping).filter(([n, s]) => s.type !== 'skip' && !byName.has(n.toLowerCase())).map(([n]) => n);

    let cache = { version: TOOL_VERSION, sheets: {} };
    try {
        const c = JSON.parse(await readFile(o.cache, 'utf8'));
        if (c.version === TOOL_VERSION) cache = c;
    } catch { /* first run */ }

    const ctx = { out: o.out, dry: o.dry };
    const sheets = [];
    const counts = { built: 0, unchanged: 0, failed: 0, notSelected: 0, skipped: 0 };
    for (const [name, file] of byName) {
        const spec = mapLower.get(name);
        if (!spec) continue;
        const rel = posix(relative(o.src, file));
        if (spec.type === 'skip') { counts.skipped++; continue; }
        const key = posix(resolve(file));
        const prev = cache.sheets[key];
        const prevValid = prev && prev.outputs && prev.outputs.every(x => existsSync(join(o.out, x.entry.file)));
        const selected = !o.only || rel.toLowerCase().includes(o.only) || sheetIds(spec).some(id => id.includes(o.only));
        if (!selected) {
            counts.notSelected++;
            if (prevValid) sheets.push({ ...prev, rel, type: spec.type, status: 'kept' });
            continue;
        }
        const hash = createHash('sha1')
            .update(await readFile(file))
            .update(JSON.stringify({ spec, TOOL_VERSION, CLASSES, QUALITY, SMALL_QUALITY, out: posix(o.out) }))
            .digest('hex');
        if (!o.force && prevValid && prev.hash === hash) {
            counts.unchanged++;
            if (prev.error) delete prev.error;
            sheets.push({ ...prev, rel, type: spec.type, status: 'unchanged' });
            continue;
        }
        let result;
        try {
            result = await HANDLERS[spec.type](file, spec, ctx);
        } catch (err) {
            result = { error: `could not process: ${err.message}` };
        }
        if (result.error) {
            counts.failed++;
            const kept = prevValid ? ' (previous version kept)' : '';
            warnings.push(`${rel}: ${result.error}${kept}`);
            sheets.push({ rel, type: spec.type, status: 'failed', error: result.error + kept, boxes: result.boxes, size: result.size, notes: result.notes,
                outputs: prevValid ? prev.outputs : [], prevIds: prev ? prev.outputs.map(x => x.id) : [] });
            if (!o.dry) cache.sheets[key] = prev ? { ...prev, boxes: result.boxes, size: result.size, error: result.error } : undefined;
            continue;
        }
        counts.built++;
        for (const n of result.notes || []) if (/instead|only/.test(n)) warnings.push(`${rel}: ${n}`);
        const entry = { hash, rel, type: spec.type, outputs: result.outputs, boxes: result.boxes, size: result.size, notes: result.notes };
        sheets.push({ ...entry, status: 'built', prevIds: prev ? prev.outputs.map(x => x.id) : [] });
        if (!o.dry) cache.sheets[key] = entry;
    }
    for (const k of Object.keys(cache.sheets)) {
        if (!cache.sheets[k] || !existsSync(k)) delete cache.sheets[k];
    }

    // Manifest: what this run produced, on top of existing entries whose files still exist.
    const old = await readManifest(o.manifest);
    const assets = {};
    if (!o.prune) {
        for (const [id, entry] of Object.entries(old)) {
            if (existsSync(join(o.out, entry.file))) assets[id] = entry;
        }
    }
    for (const s of sheets) {
        for (const id of s.prevIds || []) delete assets[id];
        for (const x of s.outputs || []) assets[x.id] = x.entry;
    }
    const produced = new Set(sheets.flatMap(s => (s.outputs || []).map(x => x.id)));
    const extra = Object.entries(assets).filter(([id]) => !produced.has(id)).sort(([a], [b]) => a.localeCompare(b));

    const text = manifestText(assets);
    let oldText = '';
    try { oldText = await readFile(o.manifest, 'utf8'); } catch { /* new */ }
    const manifestChanged = text !== oldText;

    let pruned = [];
    if (o.prune) {
        const used = new Set(Object.values(assets).flatMap(e => [e.file, e.small].filter(Boolean)));
        for (const folder of OUTPUT_FOLDERS) {
            let list = [];
            try { list = await readdir(join(o.out, folder)); } catch { continue; }
            for (const f of list) {
                const rel = `${folder}/${f}`;
                if (f.endsWith('.webp') && !used.has(rel)) pruned.push(rel);
            }
        }
    }

    if (!o.dry) {
        if (manifestChanged) {
            await mkdir(dirname(o.manifest), { recursive: true });
            await writeFile(o.manifest, text);
        }
        for (const rel of pruned) await unlink(join(o.out, rel));
        await mkdir(dirname(o.cache), { recursive: true });
        await writeFile(o.cache, JSON.stringify(cache, null, 1));
        const previewFile = join(o.src, '_preview.html');
        const html = previewHtml({
            sheets: [...sheets].sort((a, b) => a.rel.localeCompare(b.rel)),
            extra, warnings, unmapped, waiting,
            outRel: posix(relative(o.src, o.out)) || '.', srcRel: '.',
        });
        let oldHtml = '';
        try { oldHtml = await readFile(previewFile, 'utf8'); } catch { /* new */ }
        if (html !== oldHtml) await writeFile(previewFile, html);
    }

    // ---- summary ----
    const tag = { built: o.dry ? 'would build' : 'built    ', unchanged: 'unchanged', kept: 'kept     ', failed: 'FAILED   ' };
    for (const s of [...sheets].sort((a, b) => a.rel.localeCompare(b.rel))) {
        const n = (s.outputs || []).length;
        console.log(`  ${tag[s.status]}  ${s.rel}  (${n} asset${n === 1 ? '' : 's'})`);
    }
    console.log(`${o.dry ? '[dry run] ' : ''}${counts.built} ${o.dry ? 'to build' : 'built'}, ${counts.unchanged} unchanged, ${counts.failed} failed`
        + (counts.notSelected ? `, ${counts.notSelected} not selected by --only` : '')
        + (counts.skipped ? `, ${counts.skipped} skipped (not game art)` : ''));
    if (waiting.length) console.log(`Waiting for ${waiting.length} of ${Object.values(mapping).filter(s => s.type !== 'skip').length} source PNGs (see tools/assets/sheets.json).`);
    if (unmapped.length) console.log(`Not in sheets.json, ignored: ${unmapped.join(', ')}`);
    if (extra.length) console.log(`${extra.length} manifest entr${extra.length === 1 ? 'y' : 'ies'} kept from before (source missing or not rebuilt); --prune drops them.`);
    if (pruned.length) console.log(`${o.dry ? 'Would delete' : 'Deleted'} ${pruned.length} unused .webp file(s).`);
    console.log(`Manifest: ${Object.keys(assets).length} ids, ${manifestChanged ? (o.dry ? 'would change' : 'updated') : 'unchanged'} (${posix(relative(process.cwd(), o.manifest))})`);
    if (!o.dry) console.log(`Preview: ${posix(relative(process.cwd(), join(o.src, '_preview.html')))}`);
    if (warnings.length) {
        console.log(`\n${warnings.length} warning(s):`);
        for (const w of warnings) console.log(`  ! ${w}`);
        process.exitCode = counts.failed ? 1 : 0;
    }
}

main().catch(err => {
    console.error(err.message || err);
    process.exit(2);
});
