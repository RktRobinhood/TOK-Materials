// Larger selected comparisons, preserving the original decks/seeds/first schedule.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {loadRift,GAME_DIR} from './test/harness.mjs';
const dir=path.join(GAME_DIR,'design/reviews/expansion-16-2026-10-26');
const original=JSON.parse(fs.readFileSync(path.join(dir,'mono-mixed-probe.json'))),oldControl=JSON.parse(fs.readFileSync(path.join(dir,'mono-mixed-without-hooks.json')));
const files=['js/core/rift.js','js/core/state.js','data/creatures.js','data/items.js','data/axioms.js','data/tactics.js','data/fate.js','data/starters.js',
    'js/battle/abilities.js','js/battle/engine.js','js/battle/ai.js','dev/foundation-fixtures.js'];
const modes=['production','control'],selected=[['reason','strong'],['imagination','neutral']],rows=[];
for(const [colour,edge] of selected){
    const initial=original.rows.find(r=>r.colour===colour&&r.edge===edge),decks=original.decks[colour],mono=decks.mono,mixed=decks['mixed'+edge[0].toUpperCase()+edge.slice(1)],tag=colour+'-'+initial.partner;
    assert(mixed.creatures.includes('emotion-outrage-ox'));assert(!mono.creatures.concat(mixed.creatures).includes('perception-shadow-shrimp'));
    const row={colour,edge,tag,mono,mixed,seeds:64,modes:{}};
    for(const mode of modes){
        const R=loadRift(files),E=R.Battle.Engine,AI=R.Battle.AI,F=R.FoundationFixtures;
        if(mode==='control')for(const id of ['emotion-outrage-ox','perception-shadow-shrimp']){const ability=R.data.creatures[id].ability;R.Battle.Abilities[ability]={...R.Battle.Abilities[ability],noHeroOnArrival:false,onAttack:undefined};}
        for(const d of [mono,mixed]){const check=R.State.validateDeck(d,{owned:d.tactics});assert(check.valid,check.message);}
        const trials=[],arrivalAttacks={creature:0,hero:0};
        for(let seed=0;seed<64;seed++)for(const seat of [0,1]){
            const s=E.createBattle({seed:'expansion-16:'+tag+':'+seed,players:(seat?[mixed,mono]:[mono,mixed]).map(F.player),options:{first:seed%2,mode:'practice'}});
            let steps=0;
            const end=AI.playOut(s,['competent','competent'],(before,a,after)=>{steps++;
                for(const e of after.lastEvents){const c=before.cards[e.cid];if(e.t==='attack'&&c?.species==='emotion-outrage-ox'&&c.enteredTurn===before.turn)arrivalAttacks[E.isHero(e.target)?'hero':'creature']++;}
            });
            const trial={seed,monoSeat:seat,first:seed%2,winner:end.winner,endReason:end.endReason,turn:end.turn,steps};trials.push(trial);
            if(seed<16){const old=(mode==='production'?original:oldControl).trials.find(t=>t.tag===tag&&t.seed===seed&&t.monoSeat===seat);
                for(const k of ['winner','endReason','turn','steps'])assert.equal(trial[k],old[k],mode+' initial '+tag+' '+seed+' '+seat+' '+k);}
        }
        if(mode==='production')assert.equal(arrivalAttacks.hero,0);
        const share=t=>t.winner==='draw'?.5:t.winner===t.monoSeat?1:0;
        row.modes[mode]={games:trials.length,monoShare:trials.reduce((n,t)=>n+share(t),0)/trials.length,draws:trials.filter(t=>t.winner==='draw').length,arrivalAttacks,trials};
    }
    const seedDeltas=Array.from({length:64},(_,seed)=>{let d=0;for(const seat of [0,1]){const i=seed*2+seat,a=row.modes.production.trials[i],b=row.modes.control.trials[i];
        const share=t=>t.winner==='draw'?.5:t.winner===seat?1:0;d+=(share(a)-share(b))/2;}return d;});
    const mean=seedDeltas.reduce((n,x)=>n+x,0)/64,variance=seedDeltas.reduce((n,x)=>n+(x-mean)**2,0)/63;
    row.pairedDelta=mean;row.seedClusterSE=Math.sqrt(variance/64);row.seedDeltas=seedDeltas;rows.push(row);
    console.log(JSON.stringify({colour,edge,pairedDelta:mean,seedClusterSE:row.seedClusterSE,modes:Object.fromEntries(modes.map(m=>[m,{share:row.modes[m].monoShare,draws:row.modes[m].draws,arrivalAttacks:row.modes[m].arrivalAttacks}]))}));
}
const out={date:'2026-10-26',issue:129,release:'expansion-16',games:512,
    scope:'Two initially shifted rows, 64 seeds/both seats/current Competent AI. Original decks/seeds/first schedule; all first16 trial winners/reasons/turns/action counts reproduce exactly. Neither fixture contains David: the control isolates Serenox arrival hero restriction, retaining Swift. Exploratory selected rows, not global balance or tuning.',rows};
fs.writeFileSync(path.join(dir,'targeted-64.json'),JSON.stringify(out,null,2)+'\n');
