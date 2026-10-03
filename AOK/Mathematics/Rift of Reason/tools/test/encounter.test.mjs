// Exercise the real encounter controller with a small DOM/UI adapter.
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
import {loadRift} from './harness.mjs';
import {Node} from './dom-adapter.mjs';
async function game(type='puzzle',difficulty=1){
 const Rift=loadRift(['js/core/rift.js','js/core/state.js','js/core/world.js','data/avatars.js','data/items.js','data/creatures.js','js/puzzles/registry.js']);
 const state=Rift.State.freshState();state.avatar={type:'owlet',nickname:'Test'};state.tutorialsSeen.fake=true;
 Rift.State.get=()=>state;Rift.State.save=()=>{};Rift.State.update=fn=>fn(state);
 Rift.el=(...a)=>new Node(...a);
 const puzzles=type==='boss'?[{id:'fake',difficulty},{id:'fake',difficulty}]:[{id:'fake',difficulty}];
 Rift.data.map={nodes:{test:{type,chapter:'prologue',links:[],puzzles,name:'Test',host:'narrator',goal:'Check rules'} }};
 Rift.data.chapters={prologue:{}};Rift.data.speakers={narrator:{name:'Host',art:'host'}};Rift.data.script={};
 const modals=[];let api;let screen;let paused=0;
 Rift.Assets={img:()=>new Node()};Rift.Audio={sfx:()=>{}};Rift.Dialogue={has:()=>false};Rift.Router={replace:()=>{}};
 Rift.UI={hud:opts=>new Node('div',{},[opts.status]),toast:()=>{},modal:(title,body,buttons)=>{const m={title,body,buttons,close(){}};modals.push(m);return m;}};
 Rift.Tutorial={};Rift.Screens={register:(_,def)=>{screen=def;}};
 Rift.Puzzles.register({id:'fake',name:'Fake',colour:'reason',tok:'A conclusion needs a reason.',generate:()=>({}),check:(_,a)=>({solved:a===true,feedback:'Check the premise.'}),hints:()=>['Check the premise.'],why:()=>({question:'Why?',options:['Valid reason','Wrong'],correct:0,explain:'Reason'}),mount:(_,a,x)=>{api=x;return {pause(){paused++;},destroy(){}};}});
  const ctx={window:{Rift},setTimeout,clearTimeout,Date};vm.runInNewContext(fs.readFileSync(new URL('../../js/screens/encounter.js',import.meta.url),'utf8'),ctx);
  const root=new Node();const handle=screen.mount(root,{nodeId:'test'});
  return {Rift,state,root,handle,modals,api:()=>api,paused:()=>paused};
}
test('normal station: three free wrong checks, then heart; success requires Continue and cannot be counted twice',async()=>{
 const g=await game();assert.match(g.root.querySelector('.enc-checks').textContent,/●●●/);
 for(let i=0;i<3;i++)g.api().submit(false);assert.equal(g.state.health,5);
 g.api().submit(false);assert.equal(g.state.health,4);assert.match(g.root.querySelector('.enc-checks').textContent,/○○○/);
 g.api().submit(true);assert.equal(g.state.stats.puzzlesSolved,1);assert.ok(g.paused());
 assert.equal(g.modals.at(-1).title,'Stage solved!');assert.deepEqual([...g.state.map.completed],[]);
 g.api().submit(true);assert.equal(g.state.stats.puzzlesSolved,1);
 await g.modals.at(-1).buttons[0].onclick();assert.deepEqual([...g.state.map.completed],['test']);assert.equal(g.modals.at(-1).title,'Solved!');
});
test('a paid hint counts once; knockout blocks further checks and completion',async()=>{
 const g=await game();
 function all(n){return [n,...n.children.filter(x=>x instanceof Node).flatMap(all)];}
 all(g.root).find(x=>x.textContent.startsWith('💡 Hint')).onclick();assert.equal(g.state.health,4);assert.equal(g.state.stats.hintsUsed,1);
 g.state.health=1;for(let i=0;i<4;i++)g.api().submit(false);
 assert.equal(g.state.health,2);assert.equal(g.state.scars.length,1);assert.equal(g.modals.at(-1).title,'Knocked out!');
 g.api().submit(true);assert.equal(g.state.stats.puzzlesSolved,0);assert.equal(g.state.map.completed.length,0);
});
test('boss Why knockout cannot grant rewards or advance to the next stage',async()=>{
 const g=await game('boss',3);g.state.health=1;g.api().submit(true);
 const next=g.modals.at(-1).buttons[0].onclick();assert.equal(g.modals.at(-1).title,'Why?');
 g.modals.at(-1).buttons[0].onclick();await next;
 assert.equal(g.modals.at(-1).title,'Knocked out!');assert.equal(g.state.xp,0);assert.equal(g.state.map.completed.length,0);assert.equal(g.state.stats.puzzlesSolved,1);
});

test('Witness marks wrong claims without answers, then explains one on the second check',()=>{
 const Rift=loadRift(['js/core/rift.js','js/puzzles/registry.js','js/puzzles/witness.js']);
 const p=Rift.Puzzles.get('witness');const data=p.generate(Rift.makeRng(6),1);const root=new Node();
 p.mount(root,data,{el:(...a)=>new Node(...a),sfx:()=>{},submit:a=>p.check(data,a)});
 function all(n){return [n,...n.children.filter(x=>x instanceof Node).flatMap(all)];}
 const send=all(root).find(x=>x.textContent==='Give my testimony');send.onclick();
 const rows=all(root).filter(x=>x.className.split(' ').includes('wit-claim'));
 assert.ok(rows.every(x=>x.classList.contains('wit-wrong')));
 assert.ok(rows.every(x=>x.querySelector('.wit-reason').textContent==='Check this claim against the scene.'));
 send.onclick();assert.equal(rows.filter(x=>x.querySelector('.wit-reason').textContent.startsWith('Why:')).length,1);
});

test('loot is rolled only after success and the stage debrief, never on arrival or a wrong check',async()=>{
 const g=await game();let rolls=0;g.Rift.World.rollLoot=()=>{rolls++;return {species:null,chance:.65};};
 assert.equal(rolls,0);g.api().submit(false);assert.equal(rolls,0);g.api().submit(true);assert.equal(rolls,0);
 await g.modals.at(-1).buttons[0].onclick();assert.equal(rolls,1);assert.equal(g.modals.at(-1).title,'Solved!');
 assert.ok(g.state.xp>0);assert.equal(g.modals.at(-1).buttons[0].label,'Back to the map');
});
