import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import vm from 'node:vm';
import {loadRift,GAME_DIR} from './harness.mjs';
import {Node} from './dom-adapter.mjs';
const files=['js/core/rift.js','js/core/state.js','js/core/world.js','js/core/router.js','data/map.js','data/creatures.js'];

test('honour bonus is reduced, once per station, and cannot replace checked core wins',()=>{
 const R=loadRift(files),s=R.State.freshState();s.avatar={type:'owlet',variant:'boy',nickname:'Bonus QA'};
 const hearts=s.health,charms=s.items.charm;
 assert.equal(R.World.claimBonus(s,'burrow'),null);assert.equal(R.World.claimBonus(s,'missing'),null);
 for(const id of ['bonus-blackbox','bonus-mines']){
  const reward=R.World.claimBonus(s,id);assert.equal(reward.xp,5);assert.equal(reward.items.charm,1);
  const saved=JSON.stringify(s);assert.equal(R.World.claimBonus(s,id),null);assert.equal(JSON.stringify(s),saved);
 }
 assert.equal(s.xp,10);assert.equal(s.items.charm,charms+2);assert.equal(s.health,hearts);
 assert.equal(s.creatures.length,0);assert.equal(s.stats.puzzlesSolved,0);
 assert.equal(R.World.completedPuzzlesInChapter(s,'ch1'),0);
 assert.ok(s.map.revealed.includes('campfire'));assert.ok(s.map.revealed.includes('well'));
});

test('vendored payloads match pinned official engines and compile without network loads',async()=>{
 const provenance=JSON.parse(fs.readFileSync(GAME_DIR+'/vendor/tatham/upstream.json','utf8'));
 for(const id of ['blackbox','mines']){
  const text=fs.readFileSync(GAME_DIR+'/vendor/tatham/'+id+'-wasm.js','utf8');
  const base64=JSON.parse(text.match(/atob\(("[^"]+")\)/)[1]),binary=Buffer.from(base64,'base64');
  assert.equal(crypto.createHash('sha256').update(binary).digest('hex'),provenance.files[id+'.wasm']);
  await WebAssembly.compile(binary);
 }
 assert.match(fs.readFileSync(GAME_DIR+'/vendor/tatham/LICENSE.txt','utf8'),/copyright 2004-2024 Simon Tatham/);
});

test('bonus controller gates reports on its own loaded frame and cleans up late messages',()=>{
 const R=loadRift(files);R.State.newGame();R.State.update(s=>{s.avatar={type:'owlet',variant:'boy',nickname:'Bonus QA'};});
 R.el=(...a)=>new Node(...a);R.Assets={img:()=>new Node()};let hudClosed=0,listener,removed=0;
 R.UI={hud:()=>Object.assign(new Node(),{destroy:()=>hudClosed++})};R.Audio={sfx(){}};
 const window={Rift:R,location:{protocol:'http:',origin:'http://test'},addEventListener:(name,fn)=>{listener=fn;},removeEventListener:(name,fn)=>{assert.equal(fn,listener);removed++;}};
 vm.runInNewContext(fs.readFileSync(GAME_DIR+'/js/screens/bonus.js','utf8'),{window});
 const root=new Node(),handle=R.Screens.get('bonus').mount(root,{nodeId:'bonus-blackbox'});
 const frame=root.querySelector('.bonus-frame'),claim=root.querySelector('.primary');frame.contentWindow={};
 const event={source:frame.contentWindow,origin:'http://test',data:{type:'rift-bonus-ready',puzzle:'blackbox'}};
 claim.onclick();assert.equal(R.State.get().xp,0);
 listener({...event,source:{}});listener({...event,origin:'http://other'});listener({...event,data:{...event.data,puzzle:'mines'}});
 assert.equal(claim.disabled,true);listener(event);assert.equal(claim.disabled,false);
 claim.onclick();assert.equal(R.State.get().xp,5);assert.equal(claim.disabled,true);
 claim.onclick();assert.equal(R.State.get().xp,5);
 handle.destroy();assert.equal(removed,1);assert.equal(hudClosed,1);assert.equal(frame.src,'about:blank');
 listener(event);assert.equal(claim.disabled,true);assert.equal(R.State.get().xp,5);
});
