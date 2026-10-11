// Tiny static server for previewing the game (Python isn't installed on every machine).
//   node tools/serve.mjs [port]   → http://localhost:8790/
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = +(process.argv[2] || 8790);
const TYPES = {
    '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png',
    '.webp': 'image/webp', '.jpg': 'image/jpeg', '.wav': 'audio/wav', '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.mp4': 'video/mp4', '.vtt': 'text/vtt', '.md': 'text/plain; charset=utf-8',
};

const server = http.createServer((req, res) => {
    const url = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    let file = path.join(ROOT, url);
    if (!file.startsWith(ROOT)) { res.writeHead(403).end(); return; }
    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
    fs.readFile(file, (err, buf) => {
        if (err) { res.writeHead(404, { 'Content-Type': 'text/plain' }).end('Not found: ' + url); return; }
        const headers = { 'Content-Type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-store', 'Accept-Ranges': 'bytes' };
        // Media seeking needs a byte range; otherwise Chrome can snap a new
        // audio.currentTime back to zero even though metadata has loaded.
        if (req.headers.range) {
            const match = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range);
            const start = match && match[1] ? +match[1] : match && match[2] ? Math.max(0, buf.length - +match[2]) : NaN;
            const end = match && match[1] && match[2] ? Math.min(+match[2], buf.length - 1) : buf.length - 1;
            if (!Number.isSafeInteger(start) || start < 0 || start >= buf.length || end < start) {
                res.writeHead(416, { ...headers, 'Content-Range': 'bytes */' + buf.length }).end(); return;
            }
            res.writeHead(206, { ...headers, 'Content-Range': 'bytes ' + start + '-' + end + '/' + buf.length, 'Content-Length': end - start + 1 });
            res.end(req.method === 'HEAD' ? undefined : buf.subarray(start, end + 1));
            return;
        }
        res.writeHead(200, { ...headers, 'Content-Length': buf.length });
        res.end(req.method === 'HEAD' ? undefined : buf);
    });
});
server.listen(PORT, () => console.log('Rift of Reason on http://localhost:' + server.address().port + '/'));
