// #129 expansion-16 probe: paired mono/mixed games per Way against THREE partner Ways, plus a mono mirror
// to size the noise. Same method as sim-expansion-2.mjs. Partners come from the colour wheel (data/axioms.js):
// the next Way (the mono Way is Strong against it), the previous Way (Weak against it) and the opposite Way
// (neutral). The wheel edge then cannot pass for colour strength: read strength from the neutral row and the
// Strong/Weak average. Not a tournament or classroom balance claim.
//   node tools/sim-expansion-16.mjs [seeds] [--without-batch-hooks]
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {loadRift,GAME_DIR} from './test/harness.mjs';
const R=loadRift(['js/core/rift.js','js/core/state.js','data/creatures.js','data/items.js','data/axioms.js','data/tactics.js','data/fate.js','data/starters.js',
    'js/battle/abilities.js','js/battle/engine.js','js/battle/ai.js','dev/foundation-fixtures.js']);
const F=R.FoundationFixtures,E=R.Battle.Engine,AI=R.Battle.AI;
const batch=Object.keys(R.data.creatures).concat(Object.keys(R.data.tactics)).filter(id=>(R.data.creatures[id]||R.data.tactics[id]).release==='expansion-16');
const withoutHooks=process.argv.includes('--without-batch-hooks');
if(withoutHooks){
    // Same legal deck, body/costs and AI; retain Swift/Elusive, remove only arrival hero restriction and timed Elusive loss.
    // Control Serenox can target a hero on arrival; David keeps Elusive. Costs/uses and existing rules remain.
    for(const id of batch){const ability=R.data.creatures[id].ability;R.Battle.Abilities[ability]={...R.Battle.Abilities[ability],noHeroOnArrival:false,onAttack:undefined};}
}
// Preserve prior spell slots and Reason's Bill/Mark pair; replace Emotion and Perception leads.
const lead={reason:'reason-counterexample-crow',emotion:'emotion-outrage-ox',perception:'perception-shadow-shrimp',language:'language-debate-dingo',imagination:'imagination-doodle-duck',memory:'memory-bookmark-bunny'};
const spell={reason:'reason-provisional-proof',emotion:'emotion-shared-pain',perception:'perception-follow-the-clue',language:'language-a-better-label',imagination:'imagination-paper-shield',memory:'memory-keep-the-note'};
const second={reason:'reason-exact-answer',emotion:'emotion-honest-hurt',perception:'perception-strip-the-illusion',language:'language-change-the-subject',imagination:'imagination-sketch-a-friend',memory:'memory-familiar-path'};
const twice=xs=>xs.flatMap(x=>[x,x]);
function species(c,n){
    const first=c==='reason'?['reason-axiom-ant','reason-proof-beetle']:c==='perception'?[lead[c],'shakirattle']:c==='imagination'?[lead[c],'paper-dragon']:lead[c]?[lead[c]]:[];
    return first.concat(F.deck(c,false).creatures.filter((id,i,a)=>a.indexOf(id)===i&&!first.includes(id))).slice(0,n);
}
const colourSpell=(c,i)=>(i?second[c]:spell[c])||R.data.tacticDecks.colour[c][i];
// partner: how many Ways along the colour wheel the mixed deck's second Way sits.
const WHEEL=R.data.wheel.order,along=(colour,n)=>WHEEL[(WHEEL.indexOf(colour)+n)%6];
function deck(colour,partner){
    const other=partner&&along(colour,partner);
    const creatures=twice(other?species(colour,2).concat(species(other,2)):species(colour,4));
    const tactics=twice(['generic-recorded-choice','generic-board-sweep','generic-clean-cut',colourSpell(colour,0),'counterexample',other?colourSpell(other,0):colourSpell(colour,1)]);
    return {creatures,tactics,axioms:R.data.starterDecks.axioms.slice()};
}
// Reject every fixture before spending games.
for(const colour of F.colours)for(const partner of [0,1,5,3]){
    const d=deck(colour,partner),check=R.State.validateDeck(d,{owned:d.tactics});
    assert(check.valid,colour+': '+check.message);assert.equal(d.creatures.length+d.tactics.length,20);
}
const seeds=Number(process.argv[2]||16),rows=[],plays={},mirror=[],trials=[];
const arrivalAttacks={creature:0,hero:0};let curtainDrops=0;
assert(Number.isInteger(seeds)&&seeds>0&&seeds<=100);
function game(specs,seed,tag,count,monoSeat=null){
    const s=E.createBattle({seed:'expansion-16:'+tag+':'+seed,players:specs.map(F.player),options:{first:seed%2,mode:'practice'}});
    let steps=0;
    const end=AI.playOut(s,['competent','competent'],(before,a,after)=>{
        steps++;
        // Count actual attacks/loss events in all games, including mirrors, with the pre-action arrival stamp.
        for(const e of after.lastEvents){const c=before.cards[e.cid];
            if(e.t==='attack'&&c?.species==='emotion-outrage-ox'&&c.enteredTurn===before.turn)arrivalAttacks[E.isHero(e.target)?'hero':'creature']++;
            if(e.t==='ability'&&after.cards[e.cid]?.species==='perception-shadow-shrimp'&&e.text.includes('takes a bow'))curtainDrops++;}
        if(count&&a.type==='play'){const c=before.cards[a.cid],id=c.species||c.tactic;if(batch.includes(id))plays[id]=(plays[id]||0)+1;}
        for(const P of after.players){
            const zones=['deck','hand','board','armed','discard'].flatMap(k=>P[k]||[]);
            assert.equal(new Set(zones).size,zones.length,'an instance cannot occupy two zones');
        }
    });
    trials.push({seed,tag,monoSeat,first:seed%2,role:count?'mono-mixed':'mirror',winner:end.winner,endReason:end.endReason,turn:end.turn,steps});return {s,end,steps};
}
// 1 = next on the wheel (mono is Strong against it), 5 = previous (Weak), 3 = opposite (neutral).
const PARTNERS={strong:1,weak:5,neutral:3};
for(const colour of F.colours){
    const mono=deck(colour,0);
    for(const [edge,partner] of Object.entries(PARTNERS)){
        const mixed=deck(colour,partner),with_=along(colour,partner);
        for(const d of [mono,mixed]){
            const check=R.State.validateDeck(d,{owned:d.tactics});assert(check.valid,colour+': '+check.message);
            assert.equal(d.creatures.length+d.tactics.length,20);
        }
        const row={colour,partner:with_,edge,games:0,monoWins:0,mixedWins:0,draws:0,maxSteps:0,turnLimit:0};
        for(let seed=0;seed<seeds;seed++)for(const seat of [0,1]){
            const {s,end,steps}=game(seat?[mixed,mono]:[mono,mixed],seed,colour+'-'+with_,true,seat);
            assert.equal(s.players[seat].monoColour,colour);assert.equal(s.players[1-seat].monoColour,null);
            row.games++;row.maxSteps=Math.max(row.maxSteps,steps);
            if(end.endReason==='turn-limit')row.turnLimit++;
            if(end.winner==='draw')row.draws++;else if(end.winner===seat)row.monoWins++;else row.mixedWins++;
        }
        row.monoShare=+(row.monoWins/(row.games-row.draws||1)).toFixed(3);
        rows.push(row);console.log(JSON.stringify(row));
    }
    // Mirror: the same mono deck on both seats. Any split here is seat, first-player and seed noise.
    const m={colour,games:0,seat0:0,seat1:0,draws:0,turnLimit:0};
    for(let seed=0;seed<seeds;seed++)for(const seat of [0,1]){
        const mir=game([mono,mono],seed*2+seat,'mirror-'+colour,false).end;
        m.games++;if(mir.endReason==='turn-limit')m.turnLimit++;
        if(mir.winner==='draw')m.draws++;else if(mir.winner===0)m.seat0++;else m.seat1++;
    }
    m.seat0Share=+(m.seat0/(m.games-m.draws||1)).toFixed(3);
    mirror.push(m);console.log(JSON.stringify(m));
}
const out={date:'2026-10-26',issue:129,release:'expansion-16',
    scope:'Paired legal 20-card mono/mixed probe against three partner Ways taken from the colour wheel (next = Strong target, previous = Weak, opposite = neutral), and a same-deck mono mirror. Competent AI both seats, opposite seats, alternating first player; no tuning from one win rate.',
    withoutBatchHooks:withoutHooks,seedsPerColour:seeds,games:rows.reduce((n,r)=>n+r.games,0)+mirror.reduce((n,r)=>n+r.games,0),
    arrivalAttacks,curtainDrops,decks:Object.fromEntries(F.colours.map(c=>[c,{mono:deck(c,0),mixedStrong:deck(c,1),mixedWeak:deck(c,5),mixedNeutral:deck(c,3)}])),rows,mirror,plays,trials};
const target=path.join(GAME_DIR,'design/reviews/expansion-16-2026-10-26');fs.mkdirSync(target,{recursive:true});
fs.writeFileSync(path.join(target,withoutHooks?'mono-mixed-without-hooks.json':'mono-mixed-probe.json'),JSON.stringify(out,null,2)+'\n');
console.log(JSON.stringify({games:out.games,plays,arrivalAttacks,curtainDrops}));
