import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { GAME_DIR } from './harness.mjs';

test('preview server supplies audio byte ranges, HEAD and video types for native media seeking', async t => {
    const server = spawn(process.execPath, ['tools/serve.mjs', '0'], { cwd: GAME_DIR, windowsHide: true });
    t.after(() => server.kill());
    const base = await new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('Preview server did not start')), 10000);
        t.after(() => clearTimeout(timer));
        server.on('error', reject);
        server.on('exit', code => reject(new Error('Preview server exited: ' + code)));
        server.stdout.on('data', chunk => {
            const match = String(chunk).match(/http:\/\/localhost:\d+\//);
            if (match) { clearTimeout(timer); resolve(match[0]); }
        });
    });
    const bytes = fs.readFileSync(path.join(GAME_DIR, 'assets/trailer/soundtrack.mp3'));
    const head = await fetch(base + 'assets/trailer/soundtrack.mp3', { method: 'HEAD' });
    assert.equal(head.status, 200);
    assert.equal(head.headers.get('accept-ranges'), 'bytes');
    assert.equal(+head.headers.get('content-length'), bytes.length);
    assert.equal((await head.arrayBuffer()).byteLength, 0);
    const range = await fetch(base + 'assets/trailer/soundtrack.mp3', { headers: { Range: 'bytes=127-255' } });
    assert.equal(range.status, 206);
    assert.equal(range.headers.get('content-range'), 'bytes 127-255/' + bytes.length);
    assert.deepEqual(Buffer.from(await range.arrayBuffer()), bytes.subarray(127, 256));
    const suffix = await fetch(base + 'assets/trailer/soundtrack.mp3', { headers: { Range: 'bytes=-18' } });
    assert.equal(suffix.status, 206);
    assert.deepEqual(Buffer.from(await suffix.arrayBuffer()), bytes.subarray(-18));
    const invalid = await fetch(base + 'assets/trailer/soundtrack.mp3', { headers: { Range: 'bytes=' + bytes.length + '-' } });
    assert.equal(invalid.status, 416);
    assert.equal(invalid.headers.get('content-range'), 'bytes */' + bytes.length);
    const movie = await fetch(base + 'assets/trailer/Rift-of-Reason.mp4', { method: 'HEAD' });
    assert.equal(movie.status, 200);
    assert.equal(movie.headers.get('content-type'), 'video/mp4');
});
