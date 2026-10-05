// Adapt pinned official browser builds without rebuilding their C engines.
// Download blackbox/mines .html/.js/.wasm and doc/licence.html into one directory,
// then: node tools/vendor-tatham.mjs --source <directory>
// Binary JS avoids fetch/XHR restrictions when the game is opened from file://.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {GAME_DIR} from './test/harness.mjs';
const source=process.argv[process.argv.indexOf('--source')+1];
if(!process.argv.includes('--source')||!source)throw new Error('Pass --source with the downloaded official files');
const out=path.join(GAME_DIR,'vendor/tatham');
const pinnedFile=path.join(out,'upstream.json');
if(fs.existsSync(pinnedFile)){
    const pinned=JSON.parse(fs.readFileSync(pinnedFile,'utf8'));
    for(const [file,hash] of Object.entries(pinned.files)){
        const actual=crypto.createHash('sha256').update(fs.readFileSync(path.join(source,file))).digest('hex');
        if(actual!==hash)throw new Error('Downloaded source differs from pinned build: '+file);
    }
}
fs.mkdirSync(out,{recursive:true});
const manifest={version:'20260923.616da16',origin:'https://www.chiark.greenend.org.uk/~sgtatham/puzzles/',files:{}};
for(const id of ['blackbox','mines']){
    const html=fs.readFileSync(path.join(source,id+'.html'),'utf8');
    let js=fs.readFileSync(path.join(source,id+'.js'),'utf8');
    const wasm=fs.readFileSync(path.join(source,id+'.wasm'));
    if(!html.includes('Wed Sep 23')||!wasm.subarray(0,8).equals(Buffer.from([0,97,115,109,1,0,0,0])))throw new Error('Unexpected upstream build: '+id);
    for(const ext of ['html','js','wasm'])manifest.files[id+'.'+ext]=crypto.createHash('sha256').update(fs.readFileSync(path.join(source,id+'.'+ext))).digest('hex');
    const marker="var Module = {\n  'preRun':";
    if(js.split(marker).length!==2)throw new Error('Upstream Module bootstrap changed');
    js=js.replace(marker,"var Module = {\n  'wasmBinary': window.RiftPuzzleBinary,\n  'postRun': window.RiftPuzzleReady,\n  'onAbort': window.RiftPuzzleFailure,\n  'preRun':");
    js=js.replace('  alert(e.message);','  window.RiftPuzzleFailure(e.message);');
    fs.writeFileSync(path.join(out,id+'.js'),'// Adapted from Simon Tatham et al.; MIT. See LICENSE.txt and README.md.\n'+js);
    fs.writeFileSync(path.join(out,id+'-wasm.js'),'// Official WASM bytes; MIT. See LICENSE.txt.\nwindow.RiftPuzzleBinary = Uint8Array.from(atob('+JSON.stringify(wasm.toString('base64'))+'), c => c.charCodeAt(0));\n');
    const style=html.match(/<style>([\s\S]*?)<\/style>/)[1];
    const main=html.match(/<main id="puzzle"[\s\S]*?<\/main>/)[0];
    const title=id==='blackbox'?'Black Box':'Mines';
    const instructions=id==='blackbox'
        ? 'Click the edge to fire a beam: H = hit, R = reflected, matching numbers = entry and exit. Click inside to mark guessed balls. The green top-left check appears when enough are marked. Arrows move; Enter fires or marks; Space locks a cell.'
        : 'Open safe cells with a click. Numbers count mines in the eight neighbouring cells, including corners. Right-click to flag a mine. The first click is safe. The default generated boards can be solved without guessing. Arrows move; Enter opens; Space flags.';
    fs.writeFileSync(path.join(out,id+'.html'),`<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title} — Simon Tatham</title>
<style>${style}\nbody{margin:8px;background:#efe3c8;color:#1a1020;font:16px/1.4 "Segoe UI",sans-serif}button{font:inherit}canvas:focus{outline:3px solid #8d1b72}.instructions{max-width:50em;margin:10px auto}#puzzle{overflow:auto}a{color:#632857}</style>
<script defer src="bridge.js"></script><script defer src="${id}-wasm.js"></script><script defer src="${id}.js"></script></head>
<body data-puzzle="${id}"><p id="apology">Loading ${title}…</p>${main}
<p class="instructions">${instructions}</p><p class="instructions">New makes a fresh board. Solve reveals the answer; use it to learn, then try a new board.</p>
<p class="instructions">Simon Tatham's Portable Puzzle Collection · <a href="LICENSE.txt">MIT licence</a></p></body></html>\n`);
}
const licence=fs.readFileSync(path.join(source,'licence.html'),'utf8');
if(!licence.includes(manifest.version))throw new Error('Unexpected licence version');
const decode=s=>s.replace(/<[^>]*>/g,'').replace(/&#(\d+);/g,(_,n)=>String.fromCodePoint(Number(n))).replace(/&amp;/g,'&').trim();
const paragraphs=[...licence.matchAll(/<p>([\s\S]*?)<\/p>/g)].map(m=>decode(m[1])).slice(1);
fs.writeFileSync(path.join(out,'LICENSE.txt'),paragraphs.join('\n\n')+'\n');
manifest.files['licence.html']=crypto.createHash('sha256').update(fs.readFileSync(path.join(source,'licence.html'))).digest('hex');
fs.writeFileSync(path.join(out,'upstream.json'),JSON.stringify(manifest,null,2)+'\n');
console.log('Vendored Black Box and Mines '+manifest.version+' with embedded offline WASM.');
