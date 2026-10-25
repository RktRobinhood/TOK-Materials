// Reproduce every extended selected turn-limit draw; do not alter the retained cohorts.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {loadRift,GAME_DIR} from './test/harness.mjs';
const dir=path.join(GAME_DIR,'design/reviews/expansion-11-2026-10-25'),source=JSON.parse(fs.readFileSync(path.join(dir,'targeted-64.json'))),draws=[];
for(const row of source.rows)for(const trial of row.trials.filter(t=>t.endReason==='turn-limit')){
    const R=loadRift(['js/core/rift.js','js/core/state.js','data/creatures.js','data/items.js','data/axioms.js','data/tactics.js','data/fate.js','data/starters.js',
        'js/battle/abilities.js','js/battle/engine.js','js/battle/ai.js','dev/foundation-fixtures.js']),E=R.Battle.Engine,AI=R.Battle.AI;
    if(row.mode==='control')Object.values(R.data.tactics).filter(d=>d.release==='expansion-11').forEach(d=>{d.run=()=>{};d.ai=()=>0;});
    if(row.mode==='without-shared-pain')R.data.tactics['emotion-shared-pain'].run=()=>{};
    const s=E.createBattle({seed:'expansion-11:'+row.colour+'-'+row.partner+':'+trial.seed,
        players:(trial.monoSeat?[row.mixed,row.mono]:[row.mono,row.mixed]).map(R.FoundationFixtures.player),options:{first:trial.first,mode:'practice'}});
    const tail=[];let steps=0;
    const end=AI.playOut(s,['competent','competent'],(before,a,after)=>{
        steps++;tail.push({turn:before.turn,action:a,events:after.lastEvents,players:after.players.map(P=>({hearts:P.hearts,hand:P.hand.length,deck:P.deck.length,
            board:P.board.map(cid=>({name:E.cardName(after,cid),attack:E.attackOf(after,cid),health:E.healthOf(after,cid).current})),discard:P.discard.length})),rules:E.ruleSummary(after)});
        if(tail.length>12)tail.shift();
    });
    const winner=end.winner==='draw'?'draw':end.winner===trial.monoSeat?'mono':'mixed';
    assert.equal(winner,trial.winner);assert.equal(end.endReason,trial.endReason);assert.equal(end.turn,trial.turn);assert.equal(steps,trial.steps);
    draws.push({colour:row.colour,edge:row.edge,partner:row.partner,mode:row.mode,trial,tail});
}
fs.writeFileSync(path.join(dir,'targeted-draws.json'),JSON.stringify({scope:'Exact replays of every extended selected turn-limit draw, with original decks/seeds/first/seat/current AI and twelve final actions. No infinite-loop or global draw-frequency claim.',draws},null,2)+'\n');
console.log(JSON.stringify(draws.map(({tail,...d})=>({...d,tailActions:tail.length}))));
