// Exercise the real encounter controller with a small DOM/UI adapter.
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
import {loadRift} from './harness.mjs';
import {Node} from './dom-adapter.mjs';
async function game(type='puzzle',difficulty=1,clock=null,prep=null){
 const Rift=loadRift(['js/core/rift.js','js/core/state.js','js/core/world.js','data/avatars.js','data/items.js','data/creatures.js','js/puzzles/registry.js']);
 const state=Rift.State.freshState();state.avatar={type:'owlet',nickname:'Test'};state.tutorialsSeen.fake=true;state.flags['learning-hint:fake']=true;
 Rift.State.get=()=>state;Rift.State.save=()=>{};Rift.State.update=fn=>fn(state);
 Rift.el=(...a)=>new Node(...a);
 const puzzles=type==='boss'?[{id:'fake',difficulty},{id:'fake',difficulty}]:[{id:'fake',difficulty}];
 Rift.data.map={nodes:{test:{type,chapter:'prologue',links:[],puzzles,name:'Test',host:'narrator',goal:'Check rules'} }};
 Rift.data.chapters={prologue:{}};Rift.data.speakers={narrator:{name:'Host',art:'host'}};Rift.data.script={};
 const modals=[];let api;let screen;let paused=0;
 const sounds=[];Rift.Assets={img:()=>new Node()};Rift.Audio={sfx:name=>sounds.push(name),speak:()=>{}};Rift.Dialogue={has:()=>false};Rift.Router={replace:()=>{}};
 Rift.UI={hud:opts=>new Node('div',{},[opts.status]),toast:()=>{},modal:(title,body,buttons)=>{const m={title,body,buttons,close(){}};modals.push(m);return m;}};
 Rift.Tutorial={};Rift.Screens={register:(_,def)=>{screen=def;}};
 Rift.Puzzles.register({id:'fake',name:'Fake',colour:'reason',tok:'A conclusion needs a reason.',generate:()=>({}),check:(_,a)=>({solved:a===true,feedback:'Check the premise.'}),hints:()=>['Check the premise.'],why:()=>({question:'Why?',options:['Valid reason','Wrong'],correct:0,explain:'Reason'}),mount:(_,a,x)=>{api=x;return {pause(){paused++;},destroy(){}};}});
  const ctx={window:{Rift},setTimeout:clock?.set||setTimeout,clearTimeout:clock?.clear||clearTimeout,Date};vm.runInNewContext(fs.readFileSync(new URL('../../js/screens/encounter.js',import.meta.url),'utf8'),ctx);
  if(prep)prep(Rift);
  const root=new Node();const handle=screen.mount(root,{nodeId:'test'});
  return {Rift,state,root,handle,modals,sounds,api:()=>api,paused:()=>paused};
}
test('normal station: three free wrong checks, then heart; success requires Continue and cannot be counted twice',async()=>{
 const g=await game();assert.match(g.root.querySelector('.enc-checks').textContent,/●●●/);
 for(let i=0;i<3;i++)g.api().submit(false);assert.equal(g.state.health,5);
 g.api().submit(false);assert.equal(g.state.health,4);assert.match(g.root.querySelector('.enc-checks').textContent,/○○○/);
 g.api().submit(true);assert.equal(g.state.stats.puzzlesSolved,1);assert.ok(g.paused());
 assert.equal(g.modals.at(-1).title,'Stage solved!');assert.deepEqual([...g.state.map.completed],[]);
 g.api().submit(true);assert.equal(g.state.stats.puzzlesSolved,1);
 await g.modals.at(-1).buttons[0].onclick();assert.deepEqual([...g.state.map.completed],['test']);assert.equal(g.modals.at(-1).title,'Solved!');
 assert.ok(g.sounds.includes('win'));
});
test('a paid hint counts once; knockout blocks further checks and completion',async()=>{
 const g=await game();
 function all(n){return [n,...n.children.filter(x=>x instanceof Node).flatMap(all)];}
 all(g.root).find(x=>x.textContent.startsWith('💡 Hint')).onclick();assert.equal(g.state.health,4);assert.equal(g.state.stats.hintsUsed,1);
 g.state.health=1;for(let i=0;i<4;i++)g.api().submit(false);
 assert.equal(g.state.health,2);assert.equal(g.state.scars.length,1);assert.equal(g.modals.at(-1).title,'Knocked out!');
 assert.ok(g.sounds.includes('lose'));
 g.api().submit(true);assert.equal(g.state.stats.puzzlesSolved,0);assert.equal(g.state.map.completed.length,0);
});

test('timed catch settles once after a wobble, and leaving cancels its pending outcome',async()=>{
 for(const leave of [false,true]){
  const pending=new Map();let next=0;
  const clock={set(fn){pending.set(++next,fn);return next;},clear(id){pending.delete(id);}};
  const tick=()=>{const [id,fn]=pending.entries().next().value;pending.delete(id);fn();};
  const g=await game('puzzle',1,clock);
  g.Rift.World.rollLoot=()=>({species:'lobstorian'});g.Rift.World.rollCatch=()=>({caught:true,p:.65});
  const rng=g.Rift.makeRng;g.Rift.makeRng=seed=>String(seed).endsWith(':catch-mode')?{pick:()=> 'throw'}:rng(seed);
  let catchOptions;g.Rift.CatchGame={mount:(_,opts)=>{catchOptions=opts;return {destroy(){}};}};
  g.Rift.voiceId=()=>'';
  g.api().submit(true);await g.modals.at(-1).buttons[0].onclick();g.modals.at(-1).buttons[0].onclick();
  function all(n){return [n,...n.children.filter(x=>x instanceof Node).flatMap(all)];}
  all(g.root).find(n=>n.textContent.startsWith('Time a throw:')).onclick();
  catchOptions.onFinish({spent:1,bonus:.15,label:'Excellent throw!'});
  assert.equal(g.state.stats.catches,0);assert.equal(pending.size,1);
  tick();assert.ok(g.sounds.includes('wobble'));assert.equal(pending.size,1);
  if(leave){g.handle.destroy();assert.equal(pending.size,0);assert.equal(g.state.stats.catches,0);}
  else{tick();assert.equal(g.state.stats.catches,1);assert.ok(g.sounds.includes('caught'));assert.equal(pending.size,0);}
 }
});
test('boss Why knockout cannot grant rewards or advance to the next stage',async()=>{
 const g=await game('boss',3);g.state.health=1;g.api().submit(true);
 const next=g.modals.at(-1).buttons[0].onclick();assert.equal(g.modals.at(-1).title,'Why?');
 g.modals.at(-1).buttons[0].onclick();await next;
 assert.equal(g.modals.at(-1).title,'Knocked out!');assert.equal(g.state.xp,0);assert.equal(g.state.map.completed.length,0);assert.equal(g.state.stats.puzzlesSolved,1);
});

test('a boss stage with skipWhen is left out while its condition holds (the Hall when the Mayor is torn)',async()=>{
 for(const torn of [true,false]){
  const g=await game('boss',2,null,R=>{R.data.map.nodes.test.puzzles[0].skipWhen={flag:'mayor',is:'torn'};R.Story={test:c=>torn&&c.flag==='mayor'};});
  await new Promise(r=>setTimeout(r,0));
  assert.equal(g.root.querySelector('.stage').textContent,torn?'Fake':'Fake  ·  stage 1 of 2');
 }
});
test('Witness explains each rejected claim from the evidence on the first check',()=>{
 const Rift=loadRift(['js/core/rift.js','js/puzzles/registry.js','js/puzzles/witness.js']);
 const p=Rift.Puzzles.get('witness');const data=p.generate(Rift.makeRng(6),1);const root=new Node();
 p.mount(root,data,{el:(...a)=>new Node(...a),sfx:()=>{},submit:a=>p.check(data,a)});
 function all(n){return [n,...n.children.filter(x=>x instanceof Node).flatMap(all)];}
 const send=all(root).find(x=>x.textContent==='Give my testimony');send.onclick();
 const rows=all(root).filter(x=>x.className.split(' ').includes('wit-claim'));
 assert.ok(rows.every(x=>x.classList.contains('wit-wrong')));
 assert.ok(rows.every(x=>/^(Supporting evidence|Contradicting evidence|Missing evidence):/.test(x.querySelector('.wit-reason').textContent)));
});

test('loot is rolled only after success and the stage debrief, never on arrival or a wrong check',async()=>{
 const g=await game();let rolls=0;g.Rift.World.rollLoot=()=>{rolls++;return {species:null,chance:.65};};
 assert.equal(rolls,0);g.api().submit(false);assert.equal(rolls,0);g.api().submit(true);assert.equal(rolls,0);
 await g.modals.at(-1).buttons[0].onclick();assert.equal(rolls,1);assert.equal(g.modals.at(-1).title,'Solved!');
 assert.ok(g.state.xp>0);assert.equal(g.modals.at(-1).buttons[0].label,'Back to the map');
});

test('strategy journal is updated after a completed checked encounter, not arrival or wrong checks',async()=>{
 const g=await game(),notes=[];g.Rift.Rumours={recordWin:(s,id)=>notes.push(id)};g.Rift.World.rollLoot=()=>({species:null});
 g.api().submit(false);g.api().submit(true);assert.equal(notes.length,0);
 await g.modals.at(-1).buttons[0].onclick();assert.deepEqual(notes,['fake']);
});

test('first encounter bubble uses the introduction, repeat visits use the reminder',async()=>{
 for(const repeat of [false,true]){
  const g=await game('puzzle',1,null,R=>{
   Object.assign(R.data.map.nodes.test,{intro:'first',reminder:'again'});
   R.data.script={first:[{s:'narrator',t:'Welcome to this task.'}],again:[{s:'narrator',t:'Back again?'}]};
   if(repeat)R.State.get().map.visitCount.test=1;
  });
  assert.equal(g.root.querySelector('.bubble').textContent,repeat?'Back again?':'Welcome to this task.');
 }
});

test('first topic hint is free, keeps stars, and remains used after the encounter is remounted',async()=>{
 const g=await game('puzzle',1,null,R=>{delete R.State.get().flags['learning-hint:fake'];});
 function all(n){return [n,...n.children.filter(x=>x instanceof Node).flatMap(all)];}
 const hint=all(g.root).find(x=>x.textContent.startsWith('💡 Hint'));
 assert.match(hint.textContent,/free/);hint.onclick();
 assert.equal(g.state.health,5);assert.equal(g.state.stats.hintsUsed,0);assert.equal(g.state.flags['learning-hint:fake'],true);
 g.api().submit(true);await g.modals.at(-1).buttons[0].onclick();
 assert.match(g.modals.at(-1).body.children[0].textContent,/★★★/);
 assert.ok(g.state.flags['reasoning:test'][0].feedback);
});

test('a puzzle-owned correct reflection skips the generic Why and completes once',async()=>{
 let whyCalls=0;
 const g=await game('miniboss',3,null,R=>{
  const p=R.Puzzles.get('fake');p.check=(_,a)=>({solved:a===true,feedback:'The model used counts.',meta:{reflectionComplete:a===true}});
  p.why=()=>{whyCalls++;return {question:'Same question',options:['a'],correct:0};};
 });
 g.api().submit(false);assert.equal(g.state.stats.puzzlesSolved,0);
 g.api().submit(true);const waiting=g.modals.at(-1).buttons[0].onclick();
 assert.equal(whyCalls,0);await waiting;assert.equal(g.modals.at(-1).title,'Solved!');assert.equal(g.state.stats.puzzlesSolved,1);
 g.api().submit(true);assert.equal(g.state.stats.puzzlesSolved,1);
});

test('accepted answer reaches layout-specific reflection and defensible alternatives are accepted',async()=>{
 let received;
 const g=await game('miniboss',3,null,R=>{R.Puzzles.get('fake').why=(_,answer)=>{
  received=answer;return {question:'Your reason?',options:['One view','Another view','Unsupported'],correct:0,correctOptions:[0,1],explain:'Both supported views fit.'};
 };});
 g.api().submit(true);const waiting=g.modals.at(-1).buttons[0].onclick();
 assert.equal(received,true);
 g.modals.at(-1).body.children.find(x=>x.textContent==='Another view').onclick();
 assert.equal(g.modals.at(-1).title,'Exactly.');g.modals.at(-1).buttons[0].onclick();await waiting;
 assert.equal(g.state.health,5);assert.equal(g.state.map.completed.length,1);
});

test('reload after a local reflection restores completion and its costs without asking or counting it twice',async()=>{
 const prep=R=>{R.Puzzles.get('fake').check=(_,a)=>({solved:a===true,feedback:'Checked counts.',meta:{reflectionComplete:a===true,reflectionExplain:'Counts do not show reasons.'}});};
 const first=await game('miniboss',3,null,prep);
 first.api().submit(false);first.api().submit(true);
 const saved=first.Rift.State.decode('save',first.Rift.State.encode('save',first.state));first.handle.destroy();
 const second=await game('miniboss',3,null,R=>{Object.assign(R.State.get(),saved);prep(R);R.Puzzles.get('fake').why=()=>{throw Error('Duplicate question');};});
 assert.equal(second.modals.at(-1).title,'Stage solved!');assert.equal(second.state.stats.puzzlesSolved,1);assert.equal(second.state.map.visitCount.test,1);
 await second.modals.at(-1).buttons[0].onclick();
 assert.equal(second.modals.at(-1).title,'Solved!');assert.equal(second.state.stats.puzzlesSolved,1);assert.equal(second.state.flags['reflection:test'],undefined);
 assert.match(second.modals.at(-1).body.children[0].textContent,/1 wrong checks/);assert.equal(second.state.flags['reasoning:test'][0].reflection,'Counts do not show reasons.');
});

test('Owlet first-topic hint keeps stars and leaves its chapter perk available',async()=>{
 const g=await game('puzzle',1,null,R=>{delete R.State.get().flags['learning-hint:fake'];});
 function all(n){return [n,...n.children.filter(x=>x instanceof Node).flatMap(all)];}
 all(g.root).find(x=>x.textContent.startsWith('🦉 Free hint')).onclick();
 assert.equal(g.state.flags['learning-hint:fake'],true);assert.equal(g.state.perksUsed['free-hint'],undefined);assert.equal(g.state.stats.hintsUsed,0);assert.equal(g.state.health,5);
});
