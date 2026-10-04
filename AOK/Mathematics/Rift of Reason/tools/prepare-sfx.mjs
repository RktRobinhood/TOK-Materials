// Convert downloaded Kenney RPG Audio and re-level the existing CC0 sounds.
// node tools/prepare-sfx.mjs --rpg <unpacked-pack> --ffmpeg <ffmpeg-executable>
// Only a development tool; the game itself requires no packages or build step.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
const args=process.argv.slice(2);
const option=name=>args[args.indexOf(name)+1];
if(!args.includes('--rpg')||!args.includes('--ffmpeg'))throw new Error('Supply --rpg and --ffmpeg');
const pack=path.resolve(option('--rpg')), ffmpeg=option('--ffmpeg');
const out=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../assets/sfx');
function find(dir,name){
 for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
  const file=path.join(dir,entry.name);
  if(entry.isDirectory()){const match=find(file,name);if(match)return match;}
  else if(entry.name===name)return file;
 }
}
const sources={
 'step1.wav':['footstep00.ogg'], 'step2.wav':['footstep04.ogg'],
 'throw.wav':['knifeSlice2.ogg'], 'block.wav':['metalPot1.ogg'],
 'cloth.wav':['cloth1.ogg'],
 'rift.wav':['creak3.ogg','areverse,asetrate=33075,aresample=22050,afade=t=in:d=0.1,afade=t=out:st=0.25:d=0.25'],
};
function convert(input,output,filter){
 const opts=['-v','error','-i',input];
 if(filter)opts.push('-af',filter);
 opts.push('-ac','1','-ar','22050','-f','f32le','pipe:1');
 const raw=execFileSync(ffmpeg,opts,{maxBuffer:32*1024*1024});
 let peak=0;
 for(let i=0;i<raw.length;i+=4)peak=Math.max(peak,Math.abs(raw.readFloatLE(i)));
 if(!peak)throw new Error('Silent source: '+input);
 const gain=Math.pow(10,-13/20)/peak;
 const pcm=Buffer.alloc(raw.length/2);
 for(let i=0;i<raw.length;i+=4)pcm.writeInt16LE(Math.round(raw.readFloatLE(i)*gain*32767),i/2);
 const header=Buffer.alloc(44);
 header.write('RIFF',0);header.writeUInt32LE(36+pcm.length,4);header.write('WAVEfmt ',8);
 header.writeUInt32LE(16,16);header.writeUInt16LE(1,20);header.writeUInt16LE(1,22);
 header.writeUInt32LE(22050,24);header.writeUInt32LE(44100,28);header.writeUInt16LE(2,32);header.writeUInt16LE(16,34);
 header.write('data',36);header.writeUInt32LE(pcm.length,40);
 // Write beside the destination, then replace it atomically. OneDrive can
 // briefly lock a file after the preceding conversion.
 const temporary=output+'.tmp';
 fs.writeFileSync(temporary,Buffer.concat([header,pcm]));
 for(let attempt=0;;attempt++){
  try{fs.renameSync(temporary,output);break;}
  catch(error){if(attempt===9)throw error;Atomics.wait(new Int32Array(new SharedArrayBuffer(4)),0,0,100);}
 }
 console.log(path.basename(output)+': '+(pcm.length/44100).toFixed(2)+'s, peak -13 dB');
}
for(const [name,[source,filter]] of Object.entries(sources)){
 const input=find(pack,source);if(!input)throw new Error('Missing Kenney source: '+source);
 convert(input,path.join(out,name),filter);
}
for(const name of fs.readdirSync(out).filter(n=>n.endsWith('.wav')&&!sources[n]))convert(path.join(out,name),path.join(out,name));
convert(path.join(out,'escape.wav'),path.join(out,'loss.wav'),'areverse,asetrate=16538,aresample=22050');
