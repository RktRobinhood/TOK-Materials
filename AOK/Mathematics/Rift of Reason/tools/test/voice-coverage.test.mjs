import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import os from 'node:os';
import path from 'node:path';
import {voiceCatalog,speechParts} from '../voices.mjs';
import {budgetDay,readBudget,reserveRequest,reserveFileRequest} from '../voice-budget.mjs';
import {loadRift,GAME_DIR} from './harness.mjs';
import {Node} from './dom-adapter.mjs';
test('voice catalog covers every actual tutorial host/family and all teaching-battle steps',()=>{
 const {lines,skipped}=voiceCatalog();
 const cast=JSON.parse(fs.readFileSync(GAME_DIR+'/tools/voices-cast.json','utf8'));
 const puzzles=fs.readdirSync(GAME_DIR+'/js/puzzles').filter(f=>f.endsWith('.js')&&f!=='registry.js');
 const Rift=loadRift(['js/core/rift.js','data/map.js','data/cases.js','data/creatures.js','js/puzzles/registry.js',...puzzles.map(f=>'js/puzzles/'+f),'js/battle/lesson.js']);
 const ids=new Set(lines.map(l=>l.id)),families=new Set();assert.equal(ids.size,lines.length);
 for(const n of Object.values(Rift.data.map.nodes))for(const p of n.puzzles||[]){
  families.add(p.id);assert.ok(cast[n.host],n.host);
  for(const step of Rift.Puzzles.get(p.id).tutorial)assert.ok(ids.has(Rift.voiceId(n.host,step.text)),n.id+': '+step.text);
 }
 assert.equal(families.size,14);
 for(const step of Rift.Battle.Lesson.steps)assert.ok(ids.has(Rift.voiceId('granny',step.text)));
 assert.ok(lines.every(l=>l.who!=='avatar'));assert.ok(skipped.every(l=>['nothing to say (stage direction only)','understudy voice not cast yet'].includes(l.why)));
});
test('batch speech keeps acting directions in each line metadata',()=>{
 const parts=speechParts([{say:'Come closer.',mood:'whispering'},{say:'We have a plan!',mood:'triumphant'}],'Dry tortoise humour');
 assert.match(parts[0].annotations[0].style,/whispering/);assert.match(parts[1].annotations[0].style,/triumphant/);
 assert.ok(parts.every(p=>p.annotations[0].style.includes('Dry tortoise humour')));
 assert.ok(parts.every(p=>!p.text.includes('whispering')&&!p.text.includes('triumphant')));
 assert.deepEqual(parts.map(p=>p.text),['Come closer.','We have a plan!'],'Only script words may enter spoken text; pause directions belong in metadata');
});
test('daily budget counts actual attempts independently per model and resets at Pacific midnight',()=>{
 const budget={counts:{flash:3}};
 for(let i=0;i<7;i++)assert.equal(reserveRequest(budget,'flash',10),true);
 assert.equal(reserveRequest(budget,'flash',10),false);assert.equal(reserveRequest(budget,'lite',10),true);
 assert.equal(reserveRequest(budget,'lite',0),false);
 const before=new Date('2026-10-04T06:59:59Z'),after=new Date('2026-10-04T07:00:00Z');
 assert.notEqual(budgetDay(before),budgetDay(after));
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'rift-voice-budget-')),file=path.join(dir,'usage.json');
 fs.writeFileSync(file,JSON.stringify({day:budgetDay(before),counts:{flash:10}}));
 assert.equal(readBudget(file,before).counts.flash,10);assert.deepEqual(readBudget(file,after).counts,{});
 assert.throws(()=>reserveFileRequest(file,'flash',10,before),{code:'LOCAL_DAILY_LIMIT'});
 reserveFileRequest(file,'flash',10,after);
 assert.equal(readBudget(file,after).counts.flash,1);
 reserveFileRequest(file,'lite',10,after);assert.equal(readBudget(file,after).counts.lite,1);
 assert.throws(()=>reserveFileRequest(file,'flash',0,after),{code:'LOCAL_DAILY_LIMIT'});
 assert.equal(readBudget(file,after).counts.flash,1);
 fs.unlinkSync(file);fs.rmdirSync(dir);
});
test('tutorial speaks its displayed host/text and stops the line when closed',()=>{
 class Element extends Node {remove(){this.removed=true;}focus(){}scrollIntoView(){}}
 const Rift=loadRift(['js/core/rift.js']);Rift.el=(...a)=>new Element(...a);
 Rift.data.speakers={granny:{name:'Granny Axiom',art:'granny'},narrator:{name:'Sundial',art:'narrator'}};
 const spoken=[];let stops=0,closed=0;Rift.Audio={speak:l=>spoken.push(l),stopVoice:()=>stops++};Rift.Assets={img:()=>new Element()};
 const overlay=new Element();const document={activeElement:null,getElementById:()=>overlay,addEventListener(){},removeEventListener(){}};
 vm.runInNewContext(fs.readFileSync(GAME_DIR+'/js/ui/tutorial.js','utf8'),{window:{Rift,document}});
 const tour=Rift.Tutorial.play(new Element(),[{text:'Read the rule.'},{text:'Try a move.'}],'granny',{onClose:()=>closed++});
 assert.equal(spoken[0].speaker,'granny');assert.equal(spoken[0].voice,Rift.voiceId('granny','Read the rule.'));
 overlay.querySelector('.primary').onclick();assert.equal(spoken.at(-1).text,'Try a move.');
 tour.close();tour.close();assert.equal(stops,1);assert.equal(closed,1);
});
