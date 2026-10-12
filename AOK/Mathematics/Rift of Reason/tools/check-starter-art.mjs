// Verify selected #137 sources and runtime outputs; report, never edits pixels.
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
import {load,alphaBox} from './assets/image.mjs';
import {readManifest} from './assets/manifest.mjs';
const game=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const dir=path.join(game,'design/source-assets/4-caricatures/card-starters-2026-10-12');
const provenance=JSON.parse(await fs.readFile(path.join(dir,'generation.json')));
const manifest=await readManifest(path.join(game,'data/assets.js'));
const report=[];
for(const a of provenance.assets){
 assert(a.prompt&&a.source&&a.styleReferences.length,'incomplete provenance');
 const source=await load(path.join(dir,a.source)), box=alphaBox(source);
 assert(box&&box.x>0&&box.y>0&&box.x+box.w<source.w&&box.y+box.h<source.h,'source edge clipping '+a.id);
 assert.equal(source.data[3],0,'opaque source corner '+a.id);
 const entry=manifest[a.id]; assert(entry,'missing manifest '+a.id);
 const built=await load(path.join(game,'assets',entry.file));
 assert.equal(built.w,entry.w); assert.equal(built.h,entry.h); assert(built.h<=620);
 let transparent=0,solid=0;
 for(let i=3;i<built.data.length;i+=4){if(built.data[i]===0)transparent++;if(built.data[i]>170)solid++;}
 assert(transparent>built.w*built.h*.05&&solid>built.w*built.h*.1,'invalid alpha '+a.id);
 report.push({id:a.id,source:{w:source.w,h:source.h,alphaBox:box},runtime:entry,transparentPercent:Math.round(1000*transparent/(built.w*built.h))/10,bytes:(await fs.stat(path.join(game,'assets',entry.file))).size});
}
assert.equal(report.length,7);
await fs.writeFile(path.join(dir,'validation.json'),JSON.stringify({issue:137,status:'source and runtime alpha/dimension checks pass; visual gallery reviewed separately',assets:report},null,2)+'\n');
console.log(JSON.stringify(report.map(a=>({id:a.id,w:a.runtime.w,h:a.runtime.h,transparentPercent:a.transparentPercent,bytes:a.bytes}))));
