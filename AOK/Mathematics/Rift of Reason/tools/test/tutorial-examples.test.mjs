import test from 'node:test';
import assert from 'node:assert/strict';
import {loadRift,GAME_DIR} from './harness.mjs';
import fs from 'node:fs';
import vm from 'node:vm';
import {Node} from './dom-adapter.mjs';
class Element extends Node{focus(){}remove(){this.removed=true;}scrollIntoView(){}}
function setup(){const R=loadRift(['js/core/rift.js','js/ui/tutorial-examples.js']);R.el=(...a)=>new Element(...a);return R;}
function walk(n){return [n,...n.children.filter(x=>x instanceof Node).flatMap(walk)];}
const click=(board,label)=>{const target=walk(board).find(n=>n.textContent===label&&n.onclick);assert.ok(target,label);target.onclick();};
const text=board=>walk(board).map(n=>n.textContent).join(' ');
test('number practice builds its own counterexample without touching a live answer',()=>{
 const R=setup();let completed=0;const board=R.TutorialExamples.create('rule-hunter',()=>completed++);
 click(board,'2');assert.match(text(board),/Try the highlighted control/);assert.equal(completed,0);
 for(const label of ['1','3','5'])click(board,label);
 assert.match(text(board),/1  ·  3  ·  5/);assert.equal(completed,0);click(board,'Test it');
 assert.equal(completed,1);assert.match(text(board),/✓ Numbers going up.*✗ Even numbers/);
});
test('all fourteen puzzle families have a completable independent practice board',()=>{
 const R=setup(),files=fs.readdirSync(GAME_DIR+'/js/puzzles').filter(f=>f.endsWith('.js')&&f!=='registry.js');
 const game=loadRift(['js/core/rift.js','data/cases.js','data/creatures.js','js/puzzles/registry.js',...files.map(f=>'js/puzzles/'+f)]);
 assert.deepEqual([...R.TutorialExamples.ids].sort(),game.Puzzles.all().map(p=>p.id).sort());
 for(const id of R.TutorialExamples.ids){let complete=0;const board=R.TutorialExamples.create(id,()=>complete++);let safety=8;
  while(complete===0&&safety--){const target=board.querySelector('.tour-action');assert.ok(target,id);target.onclick();}
  assert.equal(complete,1,id);assert.match(text(board),/Practice complete/);
 }
});
test('practice gates Next but Skip closes once and resumes the paused puzzle',()=>{
 const R=setup();R.data.speakers={granny:{name:'Granny',art:'granny'}};R.Assets={img:()=>new Element()};
 const overlay=new Element();let resumed=0;const document={activeElement:null,getElementById:()=>overlay,addEventListener(){},removeEventListener(){}};
 vm.runInNewContext(fs.readFileSync(GAME_DIR+'/js/ui/tutorial.js','utf8'),{window:{Rift:R,document}});
 const tour=R.Tutorial.play(new Element(),[{text:'First'},{text:'Second'},{text:'Example'},{text:'Last'}],'granny',{puzzleId:'rule-hunter',onClose:()=>resumed++});
 click(overlay,'Next');click(overlay,'Next');assert.equal(overlay.querySelector('.primary').disabled,true);
 const board=overlay.querySelector('.tour-practice');for(const label of ['1','3','5','Test it'])click(board,label);
 assert.equal(overlay.querySelector('.primary').disabled,false);click(overlay,'Skip');tour.close();assert.equal(resumed,1);
});
test('visual examples show NOT with one input and the tank starting empty',()=>{
 const R=setup(),gate=R.TutorialExamples.create('switchboard',()=>{});
 for(const label of ['AND','OR','NOT ON'])click(gate,label);
 assert.match(text(gate),/NOT/);assert.ok(!text(gate).includes('B: OFF'));
 const tank=R.TutorialExamples.create('three-act',()=>{});
 assert.equal(tank.querySelector('.tour-water').style.height,'0%');
 for(const label of ['Capacity: 60 litres','Rate: 5 litres/minute','60 ÷ 5 = 12 minutes'])click(tank,label);
 assert.equal(tank.querySelector('.tour-water').style.height,'100%');
});
