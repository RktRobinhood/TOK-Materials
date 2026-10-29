// Extend the largest initial absolute paired shift, preserving decks/seeds/firsts; no tuning.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {loadRift,GAME_DIR} from './test/harness.mjs';
const dir=path.join(GAME_DIR,'design/reviews/expansion-20-2026-10-28'),read=f=>JSON.parse(fs.readFileSync(path.join(dir,f)));
const original=read('mono-mixed-probe.json'),oldControl=read('mono-mixed-without-hooks.json');
const files=['js/core/rift.js','js/core/state.js','data/creatures.js','data/items.js','data/axioms.js','data/tactics.js','data/fate.js','data/starters.js','js/battle/abilities.js','js/battle/engine.js','js/battle/ai.js','dev/foundation-fixtures.js'];
const batch=['generic-pause-one-beat','generic-scheduled-shelter','imagination-tomorrow-s-sketch','memory-stored-resolve'],colour='language',edge='neutral';
const initial=original.rows.find(r=>r.colour===colour&&r.edge===edge),decks=original.decks[colour],mono=decks.mono,mixed=decks.mixedNeutral,tag=colour+'-'+initial.partner;
assert(mono.tactics.includes(batch[0])&&mixed.tactics.includes(batch[1])&&mixed.tactics.includes(batch[3]));assert(!mono.tactics.includes(batch[2])&&!mixed.tactics.includes(batch[2]));
const row={colour,edge,tag,mono,mixed,seeds:64,modes:{}};
for(const mode of ['production','control']){
    const R=loadRift(files),E=R.Battle.Engine,AI=R.Battle.AI,F=R.FoundationFixtures;
    if(mode==='control')for(const id of batch){const scheduled=R.data.tactics[id].scheduled;R.data.tactics[id].scheduled={...scheduled,resolve(){},project:s=>s};}
    for(const d of [mono,mixed]){const valid=R.State.validateDeck(d,{owned:d.tactics});assert(valid.valid,valid.message);}
    const trials=[],fired=Object.fromEntries(batch.map(id=>[id,0]));
    for(let seed=0;seed<64;seed++)for(const seat of [0,1]){
        const s=E.createBattle({seed:'expansion-20:'+tag+':'+seed,players:(seat?[mixed,mono]:[mono,mixed]).map(F.player),options:{first:seed%2,mode:'practice'}});let steps=0;
        const end=AI.playOut(s,['competent','competent'],(before,a,after)=>{steps++;for(const e of after.lastEvents)if(e.t==='fate-event'&&batch.includes(e.def))fired[e.def]++;});
        const trial={seed,monoSeat:seat,first:seed%2,winner:end.winner,endReason:end.endReason,turn:end.turn,steps};trials.push(trial);
        if(seed<16){const old=(mode==='production'?original:oldControl).trials.find(t=>t.tag===tag&&t.seed===seed&&t.monoSeat===seat);for(const k of ['winner','endReason','turn','steps'])assert.equal(trial[k],old[k],mode+' '+seed+' '+seat+' '+k);}
    }
    const share=t=>t.winner==='draw'?.5:t.winner===t.monoSeat?1:0;
    row.modes[mode]={games:trials.length,monoShare:trials.reduce((n,t)=>n+share(t),0)/trials.length,draws:trials.filter(t=>t.winner==='draw').length,fired,trials};
}
row.seedDeltas=Array.from({length:64},(_,seed)=>{let d=0;for(const seat of [0,1]){const i=seed*2+seat,a=row.modes.production.trials[i],b=row.modes.control.trials[i],share=t=>t.winner==='draw'?.5:t.winner===seat?1:0;d+=(share(a)-share(b))/2;}return d;});
row.pairedDelta=row.seedDeltas.reduce((a,b)=>a+b,0)/64;
row.seedClusterSE=Math.sqrt(row.seedDeltas.reduce((n,d)=>n+(d-row.pairedDelta)**2,0)/63/64);
const out={date:'2026-10-28',issue:129,release:'expansion-20',games:256,scope:"Exploratory selected largest initial absolute paired shift:64seeds/bothseats/bothmodes. Both decks contain Pause One Beat and Scheduled Shelter; only mixed contains Stored Resolve; neither contains Tomorrow's Sketch. Control removes all new scheduled payoffs and projections while retaining costs and the one-shot queue. Joint effects are not per-card or subeffect attribution. Original first16 winners/reasons/turns/steps reproduce exactly; no tuning/global balance claim.",rows:[row]};
fs.writeFileSync(path.join(dir,'targeted-64.json'),JSON.stringify(out,null,2)+'\n');
console.log(JSON.stringify({colour,edge,pairedDelta:row.pairedDelta,seedClusterSE:row.seedClusterSE,modes:Object.fromEntries(Object.entries(row.modes).map(([k,v])=>[k,{share:v.monoShare,draws:v.draws,fired:v.fired}]))}));
