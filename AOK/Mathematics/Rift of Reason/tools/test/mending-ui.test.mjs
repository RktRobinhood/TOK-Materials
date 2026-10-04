import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
import {loadRift} from './harness.mjs';
import {Node} from './dom-adapter.mjs';
class Element extends Node {
 append(...nodes){super.append(...nodes);for(const n of nodes)if(n instanceof Node)n.parent=this;}
 appendChild(n){this.append(n);return n;}
 remove(){if(this.parent)this.parent.children=this.parent.children.filter(n=>n!==this);}
}
function setup(){
 const Rift=loadRift(['js/core/rift.js','js/core/state.js','js/core/world.js','data/creatures.js','data/items.js']);
 const state=Rift.State.freshState();state.items.mending=1;state.creatures.push(Rift.State.makeCreature('astrophysicat',{uid:'hurt',powerDelta:-1,injuries:['minus-one']}));
 Rift.State.replace(state);Rift.data.map={nodes:{}};Rift.State.update=fn=>fn(state);Rift.el=(...args)=>new Element(...args);Rift.Assets={img:()=>new Element()};Rift.Audio={sfx:()=>{}};
 const overlay=new Element();vm.runInNewContext(fs.readFileSync(new URL('../../js/ui/ui.js',import.meta.url),'utf8'),{window:{Rift,document:{getElementById:()=>overlay}},setTimeout:()=>{}});
 function walk(n){return [n,...n.children.filter(x=>x instanceof Node).flatMap(walk)];}
 const button=text=>walk(overlay).find(n=>n.textContent===text);
 return {Rift,state,overlay,button};
}
test('Bag lets the player select an injury and spends Mending only on repair',()=>{
 const g=setup();g.Rift.UI.bag();g.button('Use').onclick();assert.equal(g.state.items.mending,1);
 g.button('Cancel').onclick();assert.equal(g.state.items.mending,1);
 g.button('Use').onclick();g.button('Restore 1 power · 1 Mending').onclick();
 assert.equal(g.state.items.mending,0);assert.equal(g.state.creatures[0].powerDelta,0);assert.equal(g.state.creatures[0].injuries.length,0);
 assert.ok(g.button('Bag'));assert.equal(g.button('Restore 1 power · 1 Mending'),undefined);
});
