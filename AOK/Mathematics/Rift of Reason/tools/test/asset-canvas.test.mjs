import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import sharp from 'sharp';
import {readManifest} from '../assets/manifest.mjs';
import {load, alphaBox} from '../assets/image.mjs';

test('transparent parallax art keeps its source canvas while ordinary cutouts still trim', async () => {
    const temp = await fs.mkdtemp(path.join(os.tmpdir(), 'rift-canvas-'));
    try {
        const src = path.join(temp, 'source');
        await fs.mkdir(src);
        const rgba = Buffer.alloc(120 * 80 * 4);
        for (let y = 20; y < 50; y++) for (let x = 30; x < 50; x++) {
            const p = (y * 120 + x) * 4;
            rgba[p] = 80; rgba[p + 1] = 100; rgba[p + 2] = 180; rgba[p + 3] = 255;
        }
        const png = await sharp(rgba, {raw: {width: 120, height: 80, channels: 4}}).png().toBuffer();
        await fs.writeFile(path.join(src, 'layer.png'), png);
        await fs.writeFile(path.join(src, 'cutout.png'), png);
        const mapping = path.join(temp, 'mapping.json');
        await fs.writeFile(mapping, JSON.stringify({sheets: {
            'layer.png': {type: 'single', id: 'cutscene/test-layer', class: 'scene', trim: false},
            'cutout.png': {type: 'single', id: 'creature/test/idle', class: 'sprite'},
        }}));
        const manifest = path.join(temp, 'assets.js'), out = path.join(temp, 'out');
        execFileSync(process.execPath, [fileURLToPath(new URL('../build-assets.mjs', import.meta.url)),
            '--src', src, '--out', out, '--manifest', manifest,
            '--mapping', mapping, '--cache', path.join(temp, 'cache.json')], {stdio: 'pipe'});
        const entries = await readManifest(manifest);
        const layer = await load(path.join(out, entries['cutscene/test-layer'].file));
        assert.deepEqual([layer.w, layer.h], [120, 80]);
        assert.equal(layer.data[3], 0);
        const box = alphaBox(layer);
        assert.equal(box.x, 30); assert.equal(box.y, 20);
        const cutout = entries['creature/test/idle'];
        assert(cutout.w < layer.w && cutout.h < layer.h);
    } finally {
        assert(path.dirname(temp) === path.resolve(os.tmpdir()) && path.basename(temp).startsWith('rift-canvas-'));
        sharp.cache(false);
        await fs.rm(temp, {recursive: true, force: true, maxRetries: 3, retryDelay: 100});
    }
});
