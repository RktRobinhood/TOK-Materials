// Verify #142 provenance, source padding and generated runtime assets; never edits pixels.
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {load,alphaBox} from './assets/image.mjs';
import {readManifest} from './assets/manifest.mjs';
const game=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const dir=path.join(game,'design/source-assets/4-caricatures/persona-batch-142-2026-10-13');
const provenance=JSON.parse(await fs.readFile(path.join(dir,'generation.json')));
const manifest=await readManifest(path.join(game,'data/assets.js'));
assert.deepEqual(provenance.assets.map(a=>a.id),['creature/reason-diagonal-deer/idle','creature/emotion-spite-sprite/idle']);
const report=[];
for(const a of provenance.assets){
 assert(a.prompt&&a.source&&a.styleReferences.length===2&&a.generatedOutput,'incomplete provenance');
 const sourceFile=path.join(dir,a.source), source=await load(sourceFile), box=alphaBox(source);
 assert(box&&box.x>0&&box.y>0&&box.x+box.w<source.w&&box.y+box.h<source.h,'source edge clipping '+a.id);
 for(const p of [0,source.w-1,source.w*(source.h-1),source.w*source.h-1])assert.equal(source.data[p*4+3],0,'opaque source corner '+a.id);
 const entry=manifest[a.id]; assert(entry,'missing manifest '+a.id);
 const builtFile=path.join(game,'assets',entry.file),built=await load(builtFile);
 assert.equal(built.w,entry.w); assert.equal(built.h,entry.h); assert(built.h<=620);
 let transparent=0,solid=0;
 for(let i=3;i<built.data.length;i+=4){if(built.data[i]===0)transparent++;if(built.data[i]>170)solid++;}
 assert(transparent>built.w*built.h*.05&&solid>built.w*built.h*.1,'invalid alpha '+a.id);
 const hash=async file=>createHash('sha256').update(await fs.readFile(file)).digest('hex');
 report.push({id:a.id,source:{w:source.w,h:source.h,alphaBox:box,sha256:await hash(sourceFile)},runtime:{...entry,sha256:await hash(builtFile)},transparentPercent:Math.round(1000*transparent/(built.w*built.h))/10,bytes:(await fs.stat(builtFile)).size});
}
await fs.writeFile(path.join(dir,'validation.json'),JSON.stringify({issue:142,status:'Source padding, alpha, dimensions and provenance pass; gallery evidence recorded separately.',assets:report},null,2)+'\n');
console.log(JSON.stringify(report.map(a=>({id:a.id,w:a.runtime.w,h:a.runtime.h,transparentPercent:a.transparentPercent,bytes:a.bytes}))));
