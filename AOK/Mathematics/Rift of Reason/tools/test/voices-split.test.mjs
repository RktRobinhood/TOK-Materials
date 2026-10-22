import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spoken,pausesOf,stockCuts,alignCuts,splitChecked,splitBatch,voiceCatalog} from '../voices.mjs';
const HERE=path.dirname(fileURLToPath(import.meta.url));
// Kept raw takes from FAL-260 as their loud/quiet frame pattern (all the splitter reads), with
// local Whisper word timings and the cuts checked by transcript. Rebuilt as a square wave.
const take=name=>{
 const f=JSON.parse(fs.readFileSync(path.join(HERE,'fixtures','voice-take-'+name+'.json'),'utf8'));
 const frames=f.loudRuns.reduce((n,[,len])=>n+len,0),pcm=new Int16Array(frames*f.frame);
 let at=0;for(const [loud,len] of f.loudRuns){if(loud)pcm.fill(1000,at*f.frame,(at+len)*f.frame);at+=len;}
 return {...f,pcm,texts:f.lines.map(l=>l.say)};
};
// A synthetic take: each entry is a sound (seconds) or a pause (negative seconds).
const synth=(rate,parts)=>{
 const frame=Math.round(rate*0.02),frames=parts.map(s=>Math.round(Math.abs(s)/0.02)),pcm=new Int16Array(frames.reduce((a,b)=>a+b,0)*frame);
 let at=0;parts.forEach((s,i)=>{if(s>0)pcm.fill(1000,at*frame,(at+frames[i])*frame);at+=frames[i];});
 return pcm;
};

test('stock splitter cuts inside lines on a real Granny take; Whisper alignment restores the checked cuts',()=>{
 const t=take('granny-oggp2h-10'),p=pausesOf(t.pcm,t.rate);
 assert.deepEqual(stockCuts(p,t.texts),t.stockCuts);
 assert.notDeepEqual(t.stockCuts,t.checkedCuts,'the fixture shows the slipped cuts');
 const a=alignCuts(p,t.texts,t.words,t.stockCuts);
 assert.deepEqual(a.cuts,t.checkedCuts);
 // Line 6 starts with "Foresee", which Whisper heard as "Forsee": the earliest pause in the window wins.
 assert.equal(t.lines[6].say.split(':')[0],'Foresee');
 assert.equal(a.boundaries[5].how,'earliest');
 assert.ok(a.boundaries.every(b=>b.how!=='unsure'));
});

test('a short Tally take: the line-length guess slips one cut, alignment moves it back',()=>{
 const t=take('tally-12d4hyp-3'),p=pausesOf(t.pcm,t.rate);
 assert.deepEqual(stockCuts(p,t.texts),t.stockCuts);
 assert.deepEqual(alignCuts(p,t.texts,t.words,t.stockCuts).cuts,t.checkedCuts);
});

test('render split: checked pieces follow the aligned cuts; without a checker the stock cut is kept and flagged',async()=>{
 const t=take('granny-oggp2h-10'),p=pausesOf(t.pcm,t.rate);
 const checked=await splitChecked(t.pcm,t.rate,t.lines,async()=>t.words);
 assert.equal(checked.checked,true);assert.deepEqual(checked.unsure,[]);
 const mid=g=>Math.round((p.gaps[g].start+p.gaps[g].end)/2)*p.frame;
 assert.deepEqual(checked.pieces.slice(1).map(x=>x.byteOffset/2),t.checkedCuts.map(mid));
 const unchecked=await splitChecked(t.pcm,t.rate,t.lines,async()=>null);
 assert.equal(unchecked.checked,false);
 assert.deepEqual(unchecked.pieces.map(x=>x.length),splitBatch(t.pcm,t.rate,t.texts).map(x=>x.length));
});

test('alignment rules: earliest pause when the next line opens unheard, latest when this line ends unheard',()=>{
 const rate=24000;
 // "Alpha beta." | 0.6 s | "Gamma." 0.6 s | "delta epsilon." — two pauses between beta and delta.
 const pcm=synth(rate,[0.4,-0.3,0.4,-0.6,0.4,-0.6,0.5,-0.3,0.5]),p=pausesOf(pcm,rate);
 assert.equal(p.gaps.length,4);
 const at=g=>[p.gaps[g].start*p.fsec,p.gaps[g].end*p.fsec];
 const w=(word,[a,b])=>[word,a,b];
 const sounds=[[0,0.4],[0.7,1.1],[1.7,2.1],[2.7,3.2],[3.5,4.0]].map(([a,b])=>[a+at(0)[0]-0.4,b+at(0)[0]-0.4]);
 // Next line "Gamma delta epsilon." but Whisper heard "Comma": its first word did not align.
 let a=alignCuts(p,['Alpha beta.','Gamma delta epsilon.'],[w('Alpha',sounds[0]),w('beta.',sounds[1]),w('Comma',sounds[2]),w('delta',sounds[3]),w('epsilon.',sounds[4])],[2]);
 assert.deepEqual(a.cuts,[1]);assert.equal(a.boundaries[0].how,'earliest');
 // This line "Alpha beta gamma." ends with an unheard word: the latest pause wins.
 a=alignCuts(p,['Alpha beta gamma.','Delta epsilon.'],[w('Alpha',sounds[0]),w('beta',sounds[1]),w('Comma.',sounds[2]),w('Delta',sounds[3]),w('epsilon.',sounds[4])],[1]);
 assert.deepEqual(a.cuts,[2]);assert.equal(a.boundaries[0].how,'latest');
 // Nothing heard at the boundary: keep the stock cut and report it as unsure.
 a=alignCuts(p,['Alpha beta.','Gamma delta epsilon.'],[w('Alpha',sounds[0]),w('Zulu',sounds[1]),w('Comma',sounds[2]),w('Yankee',sounds[3]),w('Xray',sounds[4])],[2]);
 assert.deepEqual(a.cuts,[2]);assert.equal(a.boundaries[0].how,'unsure');
});

test('spoken text says tick and cross for ✓ and ✕; ids still hash the text as written',()=>{
 assert.equal(spoken('Click a cell once for ✕ (ruled out), twice for ✓ (confirmed). A ✓ crosses out its row and column.'),
  'Click a cell once for a cross, twice for a tick. A tick crosses out its row and column.');
 assert.equal(spoken('When a row has only one empty cell left, that cell must be ✓. Keep going until every row has one ✓.'),
  'When a row has only one empty cell left, that cell must be a tick. Keep going until every row has one tick.');
 assert.equal(spoken('✓ means yes.'),'A tick means yes.');
 const {lines}=voiceCatalog();
 assert.ok(lines.every(l=>!/[✓✔✕✗✘]/.test(l.say)),'no mark reaches the TTS');
 const kuku=lines.find(l=>l.id==='kuku-o0st9l');
 assert.ok(kuku&&kuku.text.includes('✓')&&kuku.say.endsWith('every row has one tick.'));
});
