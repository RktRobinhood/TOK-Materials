// #129 expansion-2 probe: paired mono/mixed games per Way, plus a mono mirror to size the noise.
// Same method as sim-foundation.mjs (#123). Not a tournament or classroom balance claim.
//   node tools/sim-expansion-2.mjs [seeds] [--without-batch-hooks]
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {loadRift,GAME_DIR} from './test/harness.mjs';
const R=loadRift(['js/core/rift.js','js/core/state.js','data/creatures.js','data/items.js','data/axioms.js','data/tactics.js','data/fate.js','data/starters.js',
    'js/battle/abilities.js','js/battle/engine.js','js/battle/ai.js','dev/foundation-fixtures.js']);
const F=R.FoundationFixtures,E=R.Battle.Engine,AI=R.Battle.AI;
const batch=Object.keys(R.data.creatures).concat(Object.keys(R.data.tactics)).filter(id=>(R.data.creatures[id]||R.data.tactics[id]).release==='expansion-2');
const withoutHooks=process.argv.includes('--without-batch-hooks');
if(withoutHooks){
    // Same bodies, costs and keywords (Greta keeps Guard); every new hook removed. As #123 kept Small Patch,
    // each batch spell stays a plain heal 2 on its friendly target, so the control decks carry no dead cards.
    const A=R.Battle.Abilities;
    batch.forEach(id=>{
        const c=R.data.creatures[id];
        if(c){ const kw=(A[c.ability]||{}).keywords; if(kw){A['e2-plain-'+id]={name:'Plain',text:'',keywords:kw.slice()};c.ability='e2-plain-'+id;} else c.ability=null; }
        else R.data.tactics[id].run=(api,p,target)=>api.heal(target,2);
    });
}
// The batch card for each Way leads its deck; Memory's new card is a spell, so it keeps the foundation body.
const lead={reason:'reason-diagonal-deer',emotion:'emotion-resolve-ram',perception:'perception-scout-stoat',language:'language-label-lemur',imagination:'imagination-possibility-pika'};
const spell={emotion:'emotion-share-the-feeling',memory:'memory-remember-the-guard'};
const twice=xs=>xs.flatMap(x=>[x,x]);
function species(c,n){
    const first=lead[c]?[lead[c]]:[];
    return first.concat(F.deck(c,false).creatures.filter((id,i,a)=>a.indexOf(id)===i&&id!==lead[c])).slice(0,n);
}
function deck(colour,mixed){
    const other=F.colours[(F.colours.indexOf(colour)+1)%6];
    const creatures=twice(mixed?species(colour,2).concat(species(other,2)):species(colour,4));
    const own=[spell[colour]||R.data.tacticDecks.colour[colour][0],'generic-warm-blanket'];
    const tactics=twice(['counterexample','pep-talk','stand-firm'].concat(own,mixed?[spell[other]||R.data.tacticDecks.colour[other][0]]:[R.data.tacticDecks.colour[colour][1]]));
    return {creatures,tactics,axioms:R.data.starterDecks.axioms.slice()};
}
const seeds=Number(process.argv[2]||8),rows=[],plays={},mirror=[];
assert(Number.isInteger(seeds)&&seeds>0&&seeds<=100);
function game(specs,seed,tag,count){
    const s=E.createBattle({seed:'expansion-2:'+tag+':'+seed,players:specs.map(F.player),options:{first:seed%2,mode:'practice'}});
    let steps=0;
    const end=AI.playOut(s,['competent','competent'],(before,a,after)=>{
        steps++;
        if(count&&a.type==='play'){const c=before.cards[a.cid],id=c.species||c.tactic;if(batch.includes(id))plays[id]=(plays[id]||0)+1;}
        for(const P of after.players){
            const zones=['deck','hand','board','armed','discard'].flatMap(k=>P[k]||[]);
            assert.equal(new Set(zones).size,zones.length,'an instance cannot occupy two zones');
        }
    });
    return {s,end,steps};
}
for(const colour of F.colours){
    const mono=deck(colour,false),mixed=deck(colour,true);
    for(const d of [mono,mixed]){
        const check=R.State.validateDeck(d,{owned:d.tactics});assert(check.valid,colour+': '+check.message);
        assert.equal(d.creatures.length+d.tactics.length,20);
    }
    const row={colour,games:0,monoWins:0,mixedWins:0,draws:0,maxSteps:0,turnLimit:0},m={colour,games:0,seat0:0,seat1:0,draws:0};
    for(let seed=0;seed<seeds;seed++)for(const seat of [0,1]){
        const {s,end,steps}=game(seat?[mixed,mono]:[mono,mixed],seed,colour,true);
        assert.equal(s.players[seat].monoColour,colour);assert.equal(s.players[1-seat].monoColour,null);
        row.games++;row.maxSteps=Math.max(row.maxSteps,steps);
        if(end.endReason==='turn-limit')row.turnLimit++;
        if(end.winner==='draw')row.draws++;else if(end.winner===seat)row.monoWins++;else row.mixedWins++;
        // Mirror: the same mono deck on both seats. Any split here is seat, first-player and seed noise.
        const mir=game([mono,mono],seed*2+seat,'mirror-'+colour,false).end;
        m.games++;if(mir.winner==='draw')m.draws++;else if(mir.winner===0)m.seat0++;else m.seat1++;
    }
    row.monoShare=+(row.monoWins/(row.games-row.draws||1)).toFixed(3);
    m.seat0Share=+(m.seat0/(m.games-m.draws||1)).toFixed(3);
    rows.push(row);mirror.push(m);console.log(JSON.stringify(row),JSON.stringify(m));
}
const out={date:'2026-10-22',issue:129,release:'expansion-2',
    scope:'Paired legal 20-card mono/mixed probe and same-deck mono mirror. Competent AI both seats, opposite seats, alternating first player; no tuning from one win rate.',
    withoutBatchHooks:withoutHooks,seedsPerColour:seeds,games:rows.reduce((n,r)=>n+r.games,0)+mirror.reduce((n,r)=>n+r.games,0),
    decks:Object.fromEntries(F.colours.map(c=>[c,{mono:deck(c,false),mixed:deck(c,true)}])),rows,mirror,plays};
const target=path.join(GAME_DIR,'design/reviews/expansion-2-2026-10-22');fs.mkdirSync(target,{recursive:true});
fs.writeFileSync(path.join(target,withoutHooks?'mono-mixed-without-hooks.json':'mono-mixed-probe.json'),JSON.stringify(out,null,2)+'\n');
console.log(JSON.stringify({games:out.games,plays}));
