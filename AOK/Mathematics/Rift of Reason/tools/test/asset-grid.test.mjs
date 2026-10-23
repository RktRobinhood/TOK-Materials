import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import sharp from 'sharp';
import {readManifest} from '../assets/manifest.mjs';
import {load, alphaBox, crop} from '../assets/image.mjs';

// An idle loop whose "scarf" (upper block) swings while the "feet" (lower block) stay put. Re-centring each
// frame on its upper body would slide the feet; register "grid" must keep them on the same pixel.
test('register "grid" keeps each idle frame where the artist drew it', async () => {
    const temp = await fs.mkdtemp(path.join(os.tmpdir(), 'rift-grid-'));
    try {
        const src = path.join(temp, 'source');
        await fs.mkdir(src);
        const n = 4, cw = 60, ch = 90, rows = 2;
        const rgba = Buffer.alloc(cw * n * ch * rows * 4);
        const paint = (x0, y0, w, h) => {
            for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) {
                const p = (y * cw * n + x) * 4;
                rgba[p] = 200; rgba[p + 1] = 60; rgba[p + 2] = 40; rgba[p + 3] = 255;
            }
        };
        for (let r = 0; r < rows; r++) for (let i = 0; i < n; i++) {
            paint(i * cw + 20, r * ch + 60, 16, 20);              // feet: fixed
            paint(i * cw + 10 + i * 6, r * ch + 10, 14, 50);      // scarf: swings 6 px a frame
        }
        await fs.writeFile(path.join(src, 'idle.png'),
            await sharp(rgba, {raw: {width: cw * n, height: ch * rows, channels: 4}}).png().toBuffer());
        const mapping = path.join(temp, 'mapping.json');
        await fs.writeFile(mapping, JSON.stringify({sheets: {
            'idle.png': {type: 'walk', frames: n, register: 'grid', class: 'bust', rows: ['avatar/test-a/idle-loop', 'avatar/test-b/idle-loop']},
        }}));
        const manifest = path.join(temp, 'assets.js'), out = path.join(temp, 'out');
        execFileSync(process.execPath, [fileURLToPath(new URL('../build-assets.mjs', import.meta.url)),
            '--src', src, '--out', out, '--manifest', manifest,
            '--mapping', mapping, '--cache', path.join(temp, 'cache.json')], {stdio: 'pipe'});
        const entries = await readManifest(manifest);
        for (const id of ['avatar/test-a/idle-loop', 'avatar/test-b/idle-loop']) {
            const e = entries[id];
            assert.equal(e.frames, n);
            assert.equal(e.w, e.frameWidth * n);
            const sheet = await load(path.join(out, e.file));
            const feet = [];
            for (let i = 0; i < n; i++) {
                const frame = crop(sheet, i * e.frameWidth, 0, e.frameWidth, e.frameHeight);
                const base = crop(frame, 0, e.frameHeight - 14, e.frameWidth, 14); // feet only, under the scarf
                feet.push(alphaBox(base, 128));
            }
            assert(feet.every(b => b && b.x === feet[0].x && b.w === feet[0].w), `${id}: feet moved ${JSON.stringify(feet)}`);
        }
    } finally {
        assert(path.dirname(temp) === path.resolve(os.tmpdir()) && path.basename(temp).startsWith('rift-grid-'));
        sharp.cache(false);
        await fs.rm(temp, {recursive: true, force: true, maxRetries: 3, retryDelay: 100});
    }
});
