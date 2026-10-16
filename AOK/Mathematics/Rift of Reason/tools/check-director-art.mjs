// Reproduce the 16 October directing art checks and dark/light inspection sheets.
import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
import {load, alphaBox, findIslands} from './assets/image.mjs';
import {readManifest} from './assets/manifest.mjs';

const game=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const source=path.join(game,'design/source-assets/6-cutscene/director-2026-10-16');
const evidence=path.join(game,'design/reviews/cutscene-direction-2026-10-16');
await fs.mkdir(evidence,{recursive:true});
const inventory=JSON.parse(await fs.readFile(path.join(source,'generation.json'),'utf8'));
const sheets=JSON.parse(await fs.readFile(path.join(game,'tools/assets/sheets.json'),'utf8')).sheets;
const manifest=await readManifest(path.join(game,'data/assets.js'));
const before={Rift:{data:{}}};
vm.runInNewContext(execFileSync('git',['show','c9e6039:AOK/Mathematics/Rift of Reason/data/assets.js'],{cwd:game,encoding:'utf8'}),{window:before});
const errors=[],sources=[],ids=[];
for(const record of inventory.records.filter(r=>r.selected)) {
    const file=path.join(source,record.file),img=await load(file),bounds=alphaBox(img),spec=sheets[record.file];
    const transparent=spec.type!=='scene';
    if(!record.prompt||!record.references?.length||!record.original)errors.push(record.id+': provenance missing');
    if(!bounds)errors.push(record.id+': empty source');
    else if(transparent&&(bounds.x===0||bounds.y===0||bounds.x+bounds.w===img.w||bounds.y+bounds.h===img.h))errors.push(record.id+': contour touches source edge');
    if(spec.type==='islands'&&findIslands(img,{minArea:spec.minArea}).islands.length!==spec.ids.length)errors.push(record.id+': incorrect island count');
    sources.push({id:record.id,file:record.file,w:img.w,h:img.h,bounds,sha256:createHash('sha256').update(await fs.readFile(file)).digest('hex')});
    ids.push(...(spec.ids||[spec.id]));
}
for(const [id,entry] of Object.entries(before.Rift.data.assets))if(JSON.stringify(manifest[id])!==JSON.stringify(entry))errors.push(id+': existing manifest entry changed');
const added=Object.keys(manifest).filter(id=>!before.Rift.data.assets[id]);
if(added.length!==18||ids.length!==18||added.some(id=>!ids.includes(id)))errors.push('Expected exactly the eighteen directed art IDs');
const runtime=[];
for(const id of ids) {
    const entry=manifest[id];if(!entry){errors.push(id+': absent from manifest');continue;}
    const file=path.join(game,'assets',entry.file),img=await load(file);
    if(img.w!==entry.w||img.h!==entry.h||!alphaBox(img))errors.push(id+': invalid runtime image');
    let clear=0;for(let i=3;i<img.data.length;i+=4)if(img.data[i]<=8)clear++;
    if(!id.startsWith('scene/')&&clear/(img.w*img.h)<0.05)errors.push(id+': transparency lost');
    runtime.push({id,...entry,transparentPercent:Math.round(1000*clear/(img.w*img.h))/10,sha256:createHash('sha256').update(await fs.readFile(file)).digest('hex')});
}
const avatars=['owlet-boy','owlet-girl','mothkin-boy','mothkin-girl','fox-boy','fox-girl','frogling-boy','frogling-girl','raven-boy','raven-girl'];
for(const [theme,background] of [['dark','#1A1020'],['light','#EFE3C8']]) {
    const tiles=[];
    for(let i=0;i<avatars.length;i++)tiles.push({input:await sharp(path.join(game,'assets/avatars/'+avatars[i]+'-solemn.webp')).resize({width:240,height:280,fit:'inside'}).toBuffer(),left:i%5*300+30,top:Math.floor(i/5)*320+20});
    tiles.push({input:await sharp(path.join(source,'director-shadow-atlas-clean.png')).resize({width:850,height:280,fit:'inside'}).toBuffer(),left:10,top:650});
    tiles.push({input:await sharp(path.join(game,'assets/cutscene/nudge-net-soft-shadow.webp')).resize({width:300,height:280,fit:'inside'}).toBuffer(),left:1000,top:650});
    await sharp({create:{width:1500,height:950,channels:4,background}}).composite(tiles).png().toFile(path.join(evidence,'art-'+theme+'.png'));
}
await fs.writeFile(path.join(source,'bounds.json'),JSON.stringify(sources,null,2)+'\n');
await fs.writeFile(path.join(evidence,'art-checks.json'),JSON.stringify({baseline:'c9e6039',errors,sources,runtime},null,2)+'\n');
console.log(JSON.stringify({sourcePaintings:sources.length,runtimeIds:ids.length,errors},null,2));
if(errors.length)process.exitCode=1;
