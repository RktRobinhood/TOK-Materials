// Extend the largest initial absolute paired shift, preserving decks/seeds/firsts; no tuning.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {loadRift,GAME_DIR} from './test/harness.mjs';
const dir=path.join(GAME_DIR,'design/reviews/expansion-18-2026-10-27'),read=f=>JSON.parse(fs.readFileSync(path.join(dir,f)));
const original=read('mono-mixed-probe.json'),oldControl=read('mono-mixed-without-hooks.json');
const files=['js/core/rift.js','js/core/state.js','data/creatures.js','data/items.js','data/axioms.js','data/tactics.js','data/fate.js','data/starters.js','js/battle/abilities.js','js/battle/engine.js','js/battle/ai.js','dev/foundation-fixtures.js'];
const batch=['language-comma-caterpillar','language-echo-egret'],colour='language',edge='strong';
const initial=original.rows.find(r=>r.colour===colour&&r.edge===edge),decks=original.decks[colour],mono=decks.mono,mixed=decks.mixedStrong,tag=colour+'-'+initial.partner;
assert(mono.creatures.includes(batch[0])&&mixed.creatures.includes(batch[0])&&mixed.creatures.includes(batch[1]));
const row={colour,edge,tag,mono,mixed,seeds:64,modes:{}};
for(const mode of ['production','control']){
    const R=loadRift(files),E=R.Battle.Engine,AI=R.Battle.AI,F=R.FoundationFixtures;
    if(mode==='control')for(const id of batch){const ability=R.data.creatures[id].ability;R.Battle.Abilities[ability]={...R.Battle.Abilities[ability],lastWordEffect:undefined,onHeldAxiomPlayed:undefined};}
    for(const d of [mono,mixed]){const valid=R.State.validateDeck(d,{owned:d.tactics});assert(valid.valid,valid.message);}
    const trials=[],hookAttempts=Object.fromEntries(batch.map(id=>[id,0]));
    for(let seed=0;seed<64;seed++)for(const seat of [0,1]){
        const s=E.createBattle({seed:'expansion-18:'+tag+':'+seed,players:(seat?[mixed,mono]:[mono,mixed]).map(F.player),options:{first:seed%2,mode:'practice'}});let steps=0;
        const end=AI.playOut(s,['competent','competent'],(before,a,after)=>{steps++;for(const e of after.lastEvents){const id=after.cards[e.cid]?.species;if(e.t==='ability'&&e.drawn!==undefined&&batch.includes(id))hookAttempts[id]++;}});
        const trial={seed,monoSeat:seat,first:seed%2,winner:end.winner,endReason:end.endReason,turn:end.turn,steps};trials.push(trial);
        if(seed<16){const old=(mode==='production'?original:oldControl).trials.find(t=>t.tag===tag&&t.seed===seed&&t.monoSeat===seat);for(const k of ['winner','endReason','turn','steps'])assert.equal(trial[k],old[k],mode+' '+seed+' '+seat+' '+k);}
    }
    const share=t=>t.winner==='draw'?.5:t.winner===t.monoSeat?1:0;
    row.modes[mode]={games:trials.length,monoShare:trials.reduce((n,t)=>n+share(t),0)/trials.length,draws:trials.filter(t=>t.winner==='draw').length,hookAttempts,trials};
}
row.seedDeltas=Array.from({length:64},(_,seed)=>{let d=0;for(const seat of [0,1]){const i=seed*2+seat,a=row.modes.production.trials[i],b=row.modes.control.trials[i],share=t=>t.winner==='draw'?.5:t.winner===seat?1:0;d+=(share(a)-share(b))/2;}return d;});
row.pairedDelta=row.seedDeltas.reduce((a,b)=>a+b,0)/64;
row.seedClusterSE=Math.sqrt(row.seedDeltas.reduce((n,d)=>n+(d-row.pairedDelta)**2,0)/63/64);
const out={date:'2026-10-27',issue:129,release:'expansion-18',games:256,scope:'Exploratory selected largest initial absolute paired shift,64seeds/bothseats/bothmodes. Citation and Encore hooks disabled together while retaining Emma Guard; does not isolate Emma versus Sabrina or reveal versus draw. Original first16 winners/reasons/turns/steps reproduce exactly. No tuning/global balance claim.',rows:[row]};
fs.writeFileSync(path.join(dir,'targeted-64.json'),JSON.stringify(out,null,2)+'\n');
console.log(JSON.stringify({colour,edge,pairedDelta:row.pairedDelta,seedClusterSE:row.seedClusterSE,modes:Object.fromEntries(Object.entries(row.modes).map(([k,v])=>[k,{share:v.monoShare,draws:v.draws,hookAttempts:v.hookAttempts}]))}));
