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
    '.webp': 'image/webp', '.jpg': 'image/jpeg', '.wav': 'audio/wav', '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.md': 'text/plain; charset=utf-8',
};

http.createServer((req, res) => {
    const url = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    let file = path.join(ROOT, url);
    if (!file.startsWith(ROOT)) { res.writeHead(403).end(); return; }
    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
    fs.readFile(file, (err, buf) => {
        if (err) { res.writeHead(404, { 'Content-Type': 'text/plain' }).end('Not found: ' + url); return; }
        res.writeHead(200, { 'Content-Type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-store' });
        res.end(buf);
    });
}).listen(PORT, () => console.log('Rift of Reason on http://localhost:' + PORT + '/'));
