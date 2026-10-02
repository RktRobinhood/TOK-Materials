// Pixel work for the art pipeline: RGBA buffers in memory, sharp for decoding,
// resizing and WebP encoding. An image is { w, h, data } with 4 bytes per pixel.

import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';

export async function load(file) {
    const { data, info } = await sharp(file).toColourspace('srgb').ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    if (info.channels !== 4) throw new Error(`expected RGBA, got ${info.channels} channels`);
    return { w: info.width, h: info.height, data };
}

export function blank(w, h) {
    return { w, h, data: Buffer.alloc(w * h * 4) };
}

export function crop(img, x, y, w, h) {
    const out = blank(w, h);
    for (let row = 0; row < h; row++) {
        const from = ((y + row) * img.w + x) * 4;
        img.data.copy(out.data, row * w * 4, from, from + w * 4);
    }
    return out;
}

// Quarter turns clockwise (1-3), for pieces drawn upright that the game uses sideways.
export function rotate(img, quarters) {
    let out = img;
    for (let q = 0; q < ((quarters % 4) + 4) % 4; q++) {
        const src = out;
        out = blank(src.h, src.w);
        for (let y = 0; y < src.h; y++) {
            for (let x = 0; x < src.w; x++) {
                src.data.copy(out.data, (x * out.w + (src.h - 1 - y)) * 4, (y * src.w + x) * 4, (y * src.w + x) * 4 + 4);
            }
        }
    }
    return out;
}

export function blit(dst, src, x, y) {
    for (let row = 0; row < src.h; row++) {
        const ty = y + row;
        if (ty < 0 || ty >= dst.h) continue;
        const x0 = Math.max(0, -x);
        const x1 = Math.min(src.w, dst.w - x);
        if (x1 <= x0) continue;
        src.data.copy(dst.data, (ty * dst.w + x + x0) * 4, (row * src.w + x0) * 4, (row * src.w + x1) * 4);
    }
}

// Bounding box of pixels with alpha above t, or null if there are none.
export function alphaBox(img, t = 8) {
    let x0 = img.w, y0 = img.h, x1 = -1, y1 = -1;
    for (let y = 0; y < img.h; y++) {
        for (let x = 0; x < img.w; x++) {
            if (img.data[(y * img.w + x) * 4 + 3] > t) {
                if (x < x0) x0 = x;
                if (x > x1) x1 = x;
                if (y < y0) y0 = y;
                if (y > y1) y1 = y;
            }
        }
    }
    return x1 < 0 ? null : { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
}

export function trim(img, t = 8) {
    const box = alphaBox(img, t);
    return box ? crop(img, box.x, box.y, box.w, box.h) : null;
}

// ---- islands ----------------------------------------------------------------

/*
 * Find separate figures on a transparent sheet. Works on a half-scale alpha mask
 * (alpha > threshold), labels 4-connected blobs, then: blobs of at least minArea
 * (half-scale px) are figures; smaller blobs within mergeDist of a figure join the
 * nearest one (sparkles, loose feathers); the rest, and specks, are ignored.
 */
export function findIslands(img, opts = {}) {
    const scale = opts.scale || 2;
    const threshold = opts.threshold ?? 170;
    const minArea = opts.minArea ?? 400;
    const speck = opts.speck ?? 6;
    const mergeDist = opts.mergeDist ?? 40;
    const sw = Math.ceil(img.w / scale);
    const sh = Math.ceil(img.h / scale);

    const mask = new Uint8Array(sw * sh);
    for (let sy = 0; sy < sh; sy++) {
        for (let sx = 0; sx < sw; sx++) {
            let sum = 0;
            let n = 0;
            for (let dy = 0; dy < scale; dy++) {
                const y = sy * scale + dy;
                if (y >= img.h) break;
                for (let dx = 0; dx < scale; dx++) {
                    const x = sx * scale + dx;
                    if (x >= img.w) break;
                    sum += img.data[(y * img.w + x) * 4 + 3];
                    n++;
                }
            }
            mask[sy * sw + sx] = sum / n > threshold ? 1 : 0;
        }
    }

    const labels = new Int32Array(sw * sh);
    const blobs = [null];
    const stack = new Int32Array(sw * sh);
    for (let start = 0; start < mask.length; start++) {
        if (!mask[start] || labels[start]) continue;
        const label = blobs.length;
        const b = { label, area: 0, x0: sw, y0: sh, x1: -1, y1: -1 };
        let top = 0;
        stack[top++] = start;
        labels[start] = label;
        while (top) {
            const i = stack[--top];
            const x = i % sw;
            const y = (i - x) / sw;
            b.area++;
            if (x < b.x0) b.x0 = x;
            if (x > b.x1) b.x1 = x;
            if (y < b.y0) b.y0 = y;
            if (y > b.y1) b.y1 = y;
            if (x > 0 && mask[i - 1] && !labels[i - 1]) { labels[i - 1] = label; stack[top++] = i - 1; }
            if (x < sw - 1 && mask[i + 1] && !labels[i + 1]) { labels[i + 1] = label; stack[top++] = i + 1; }
            if (y > 0 && mask[i - sw] && !labels[i - sw]) { labels[i - sw] = label; stack[top++] = i - sw; }
            if (y < sh - 1 && mask[i + sw] && !labels[i + sw]) { labels[i + sw] = label; stack[top++] = i + sw; }
        }
        blobs.push(b);
    }

    const owner = new Int32Array(blobs.length);
    const islands = blobs.filter(b => b && b.area >= minArea);
    for (const isl of islands) owner[isl.label] = isl.label;
    let merged = 0;
    let ignored = 0;
    let biggestIgnored = 0;
    const smalls = blobs.filter(b => b && b.area < minArea).sort((a, b) => b.area - a.area);
    for (const b of smalls) {
        if (b.area < speck) { ignored++; continue; }
        let best = null;
        let bestD = Infinity;
        for (const isl of islands) {
            const dx = Math.max(0, isl.x0 - b.x1, b.x0 - isl.x1);
            const dy = Math.max(0, isl.y0 - b.y1, b.y0 - isl.y1);
            const d = Math.hypot(dx, dy);
            if (d < bestD) { bestD = d; best = isl; }
        }
        if (best && bestD <= mergeDist) {
            owner[b.label] = best.label;
            best.x0 = Math.min(best.x0, b.x0);
            best.y0 = Math.min(best.y0, b.y0);
            best.x1 = Math.max(best.x1, b.x1);
            best.y1 = Math.max(best.y1, b.y1);
            merged++;
        } else {
            ignored++;
            biggestIgnored = Math.max(biggestIgnored, b.area);
        }
    }
    const biggestSmall = smalls.length ? smalls[0].area : 0;
    return { scale, sw, sh, labels, owner, islands, merged, ignored, biggestSmall, biggestIgnored, minArea };
}

// Rows top to bottom (islands that overlap vertically share a row), left to right within a row.
export function readingOrder(islands) {
    const rows = [];
    for (const isl of [...islands].sort((a, b) => a.y0 - b.y0)) {
        const h = isl.y1 - isl.y0 + 1;
        let row = rows.find(r => {
            const overlap = Math.min(r.y1, isl.y1) - Math.max(r.y0, isl.y0) + 1;
            return overlap >= 0.4 * Math.min(h, r.y1 - r.y0 + 1);
        });
        if (!row) {
            row = { y0: isl.y0, y1: isl.y1, items: [] };
            rows.push(row);
        }
        row.items.push(isl);
        row.y0 = Math.min(row.y0, isl.y0);
        row.y1 = Math.max(row.y1, isl.y1);
    }
    rows.sort((a, b) => a.y0 - b.y0);
    for (const r of rows) r.items.sort((a, b) => a.x0 - b.x0);
    return rows;
}

// Islands in one row whose horizontal spans overlap become one figure (a walk
// frame whose leg or lantern came loose). Returns the merged row, left to right.
export function mergeColumns(found, items) {
    const out = [];
    for (const isl of [...items].sort((a, b) => a.x0 - b.x0)) {
        const last = out[out.length - 1];
        const overlap = last ? Math.min(last.x1, isl.x1) - Math.max(last.x0, isl.x0) + 1 : 0;
        if (last && overlap > 0.3 * Math.min(last.x1 - last.x0 + 1, isl.x1 - isl.x0 + 1)) {
            for (let l = 0; l < found.owner.length; l++) if (found.owner[l] === isl.label) found.owner[l] = last.label;
            last.x0 = Math.min(last.x0, isl.x0);
            last.y0 = Math.min(last.y0, isl.y0);
            last.x1 = Math.max(last.x1, isl.x1);
            last.y1 = Math.max(last.y1, isl.y1);
            last.area += isl.area;
        } else {
            out.push(isl);
        }
    }
    return out;
}

// Full-resolution box of an island, in source pixels.
export function islandBox(found, isl) {
    const s = found.scale;
    return { x: isl.x0 * s, y: isl.y0 * s, w: (isl.x1 - isl.x0 + 1) * s, h: (isl.y1 - isl.y0 + 1) * s };
}

/*
 * Cut one island out at full resolution: its own blobs, grown by `margin`
 * half-scale px into empty space (to keep soft outlines and glow), never into
 * a neighbouring figure. Returns the trimmed piece.
 */
export function extract(img, found, isl, opts = {}) {
    const margin = opts.margin ?? 4;
    const { scale, sw, sh, labels, owner } = found;
    const bx0 = Math.max(0, isl.x0 - margin);
    const by0 = Math.max(0, isl.y0 - margin);
    const bx1 = Math.min(sw - 1, isl.x1 + margin);
    const by1 = Math.min(sh - 1, isl.y1 + margin);
    const lw = bx1 - bx0 + 1;
    const lh = by1 - by0 + 1;
    let m = new Uint8Array(lw * lh);
    const allowed = new Uint8Array(lw * lh);
    for (let y = 0; y < lh; y++) {
        for (let x = 0; x < lw; x++) {
            const lab = labels[(by0 + y) * sw + bx0 + x];
            const mine = lab && owner[lab] === isl.label;
            m[y * lw + x] = mine ? 1 : 0;
            allowed[y * lw + x] = mine || !lab || !owner[lab] ? 1 : 0;
        }
    }
    for (let step = 0; step < margin; step++) {
        const g = m.slice();
        for (let y = 0; y < lh; y++) {
            for (let x = 0; x < lw; x++) {
                const i = y * lw + x;
                if (!m[i]) continue;
                if (x > 0 && allowed[i - 1]) g[i - 1] = 1;
                if (x < lw - 1 && allowed[i + 1]) g[i + 1] = 1;
                if (y > 0 && allowed[i - lw]) g[i - lw] = 1;
                if (y < lh - 1 && allowed[i + lw]) g[i + lw] = 1;
            }
        }
        m = g;
    }
    const fx0 = bx0 * scale;
    const fy0 = by0 * scale;
    const fx1 = Math.min(img.w, (bx1 + 1) * scale);
    const fy1 = Math.min(img.h, (by1 + 1) * scale);
    const out = blank(fx1 - fx0, fy1 - fy0);
    for (let y = fy0; y < fy1; y++) {
        const cy = ((y / scale) | 0) - by0;
        for (let x = fx0; x < fx1; x++) {
            const cx = ((x / scale) | 0) - bx0;
            if (!m[cy * lw + cx]) continue;
            const from = (y * img.w + x) * 4;
            img.data.copy(out.data, ((y - fy0) * out.w + x - fx0) * 4, from, from + 4);
        }
    }
    return trim(out, opts.alphaTrim ?? 8);
}

// ---- walk cycles ----------------------------------------------------------------

// Horizontal anchor of a frame: alpha-weighted centre of its upper 60% (head and
// body), which stays put while legs, tails and scarves swing.
function anchorX(img) {
    const rows = Math.max(1, Math.round(img.h * 0.6));
    let sum = 0;
    let wsum = 0;
    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < img.w; x++) {
            const a = img.data[(y * img.w + x) * 4 + 3];
            sum += a * x;
            wsum += a;
        }
    }
    return wsum ? sum / wsum : img.w / 2;
}

/*
 * Re-pack trimmed frames into equal cells: feet on a shared ground line (bottom
 * of the cell), body anchors on the cell's centre line, so the loop doesn't jitter.
 * Frames are scaled together so a cell is at most maxH tall.
 */
export async function packWalk(frames, maxH, pad = 2) {
    const anchors = frames.map(anchorX);
    const left = Math.max(...frames.map((f, i) => anchors[i]));
    const right = Math.max(...frames.map((f, i) => f.w - anchors[i]));
    const cellW = Math.ceil(left + right) + pad * 2;
    const cellH = Math.max(...frames.map(f => f.h)) + pad * 2;
    const s = Math.min(1, maxH / cellH);
    const fw = Math.max(1, Math.round(cellW * s));
    const fh = Math.max(1, Math.round(cellH * s));
    const strip = blank(fw * frames.length, fh);
    for (let i = 0; i < frames.length; i++) {
        const cell = blank(cellW, cellH);
        blit(cell, frames[i], pad + Math.round(left - anchors[i]), cellH - pad - frames[i].h);
        const data = s === 1 ? cell.data : await sharp(cell.data, { raw: { width: cellW, height: cellH, channels: 4 } })
            .resize(fw, fh, { fit: 'fill', kernel: 'lanczos3' }).raw().toBuffer();
        blit(strip, { w: fw, h: fh, data }, i * fw, 0);
    }
    return { strip, frameWidth: fw, frameHeight: fh };
}

// ---- output ----------------------------------------------------------------

function fitInside(w, h, maxW, maxH) {
    const s = Math.min(1, maxW ? maxW / w : 1, maxH ? maxH / h : 1);
    return s < 1 ? { width: Math.max(1, Math.round(w * s)), height: Math.max(1, Math.round(h * s)) } : null;
}

async function emit(pipeline, file, dry) {
    if (dry) {
        const { info } = await pipeline.toBuffer({ resolveWithObject: true });
        return { w: info.width, h: info.height };
    }
    await mkdir(dirname(file), { recursive: true });
    const info = await pipeline.toFile(file);
    return { w: info.width, h: info.height };
}

// Transparent image -> WebP within the class caps.
export async function writeSprite(img, file, caps, quality, dry) {
    let p = sharp(img.data, { raw: { width: img.w, height: img.h, channels: 4 } });
    const size = fitInside(img.w, img.h, caps.maxW, caps.maxH);
    if (size) p = p.resize({ ...size, fit: 'fill', kernel: 'lanczos3' });
    return emit(p.webp({ quality, alphaQuality: 90, effort: 5 }), file, dry);
}

// Opaque background straight from the source file.
export async function writeScene(src, file, maxW, quality, dry) {
    const p = sharp(src).flatten({ background: '#14121F' })
        .resize({ width: maxW, withoutEnlargement: true, kernel: 'lanczos3' })
        .webp({ quality, effort: 5 });
    return emit(p, file, dry);
}

export async function sourceSize(file) {
    const m = await sharp(file).metadata();
    return { w: m.width, h: m.height };
}
