// Design simulation only, not a production shop or ownership implementation.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
const dir = path.dirname(fileURLToPath(import.meta.url));
const game = path.resolve(dir, '../../..');
const catalogue = JSON.parse(fs.readFileSync(path.join(dir, 'card-catalogue.json'), 'utf8'));
const pool = catalogue.cards.filter(c => c.acquisition.packEligible);
const probabilities = {common:.65, uncommon:.23, rare:.09, mythic:.025, legendary:.005};
const rarities = Object.keys(probabilities);
const baseline = pool.reduce((out,c) => (out[c.rarity] = (out[c.rarity] || 0) + 1, out), {});
const weights = pool.map(c => probabilities[c.rarity] / baseline[c.rarity]);
const ctx = vm.createContext({window:{}});
vm.runInContext(fs.readFileSync(path.join(game,'js/core/rift.js'),'utf8'),ctx);
const makeRng = ctx.window.Rift.makeRng;
const assert = (v,msg) => { if(!v) throw new Error(msg); };
assert(pool.length === 192 && catalogue.cards.length - pool.length === 18,'Source split mismatch');
assert(pool.every(c => c.acquisition.channel === 'pack-pool'),'Story card in pack pool');
assert(Math.abs(Object.values(probabilities).reduce((a,b)=>a+b,0)-1) < 1e-10,'Bad probabilities');

// Eligible selection consumes exactly one of four entitlements. No card at stage 4 is drawn.
function nextReward(stages, rng) {
  let total = 0;
  for(let i=0;i<pool.length;i++) if(stages[i]<4) total += weights[i];
  if(total <= 0) return null;
  let roll = rng.next()*total, selected = -1;
  for(let i=0;i<pool.length;i++) if(stages[i]<4) {
    selected=i; roll -= weights[i]; if(roll < 0) break;
  }
  assert(selected >= 0 && stages[selected]<4,'Selected completed card');
  const before=stages[selected]++;
  return {id:pool[selected].id,rarity:pool[selected].rarity,type:before<2?'normal-copy':'foil-upgrade',stage:before+1};
}
function purchase(stages, balance, rng) {
  const remaining = stages.reduce((sum,n)=>sum+4-n,0), slots=Math.min(5,remaining), price=slots*10;
  if(!slots || balance<price) return {balance,charged:0,rewards:[]};
  const rewards=[];
  for(let n=0;n<slots;n++) rewards.push(nextReward(stages,rng));
  return {balance:balance-price,charged:price,rewards};
}
const probe = Array(pool.length).fill(4); probe[0]=3;
assert(purchase(probe,9,makeRng('insufficient')).charged===0 && probe[0]===3,'Insufficient balance changed ownership');
const last=purchase(probe,10,makeRng('last-slot'));
assert(last.charged===10 && last.rewards.length===1 && last.rewards[0].type==='foil-upgrade','Final partial purchase');
assert(purchase(probe,100,makeRng('completed')).charged===0,'Completed collection charged');
const only=Array(pool.length).fill(4);only[1]=0;
const oneCard=purchase(only,100,makeRng('four-entitlements'));
assert(oneCard.rewards.length===4 && oneCard.rewards.map(r=>r.type).join(',')==='normal-copy,normal-copy,foil-upgrade,foil-upgrade','Stage sequence');
assert(new Set(oneCard.rewards.map(r=>r.id)).size===1 && only[1]===4,'Single eligible card progression');

const runs=1000, bins=Array.from({length:4},()=>Object.fromEntries(rarities.map(r=>[r,0])));
const firstLegendary=[],twoNormalCompletion=[],firstPackLegendary=[];
for(let seed=0;seed<runs;seed++) {
  const stages=Array(pool.length).fill(0),rng=makeRng('pack-model-v2:'+seed);
  let first=null,two=null,firstPack=false;
  for(let draw=1;draw<=pool.length*4;draw++) {
    const reward=nextReward(stages,rng);
    assert(reward && catalogue.cards.find(c=>c.id===reward.id).acquisition.packEligible,'Invalid reward');
    bins[Math.min(3,Math.floor((draw-1)/(pool.length)))][reward.rarity]++;
    if(reward.rarity==='legendary') { if(first===null)first=draw; if(draw<=5)firstPack=true; }
    if(two===null && stages.every(n=>n>=2))two=draw;
  }
  assert(stages.every(n=>n===4) && nextReward(stages,rng)===null,'Completion invariant');
  firstLegendary.push(first); twoNormalCompletion.push(two);firstPackLegendary.push(firstPack);
}
const percentile=(a,p)=>a.slice().sort((x,y)=>x-y)[Math.floor((a.length-1)*p)];
const firstPackCount=firstPackLegendary.filter(Boolean).length;
const observed=firstPackCount/runs,z=1.96,den=1+z*z/runs;
const center=(observed+z*z/(2*runs))/den,half=z*Math.sqrt(observed*(1-observed)/runs+z*z/(4*runs*runs))/den;
const report={status:'design simulation, not production behaviour or classroom playtest',runs,seedPattern:'pack-model-v2:0..999',poolIds:pool.length,storyExcluded:18,baseline,initialTargets:probabilities,
  stageTransitions:'normal, normal, foil-upgrade, foil-upgrade, excluded',fullCompletionDraws:pool.length*4,fullFiveDrawPacks:Math.floor(pool.length*4/5),finalPartialSlots:pool.length*4%5,
  firstPackWithLegendary:{count:firstPackCount,rate:observed,wilson95:[center-half,center+half]},
  firstLegendaryDraw:{p50:percentile(firstLegendary,.5),p90:percentile(firstLegendary,.9)},
  allIdsHaveTwoNormalEntitlementsByDraw:{p50:percentile(twoNormalCompletion,.5),p90:percentile(twoNormalCompletion,.9)},
  drawQuarterRarityPercentages:bins.map(b=>Object.fromEntries(Object.entries(b).map(([r,n])=>[r,Number((100*n/(runs*pool.length)).toFixed(2))]))),
  checks:['192 pack IDs; 18 story IDs excluded','two normal copies then two foil upgrades','completed IDs excluded after every draw','insufficient funds leave stages unchanged','final partial price delivers only usable slots','completed pool never charges','all 1000 complete reference runs preserve stage bounds']};
fs.writeFileSync(path.join(dir,'PACK-MODEL-REPORT.json'),JSON.stringify(report,null,2)+'\n');
let md='# Draft pack-model results\n\n12 October 2026. '+runs+' seeded runs of the **proposed** eligibility/weight model using the actual Rift RNG. No gameplay, purchases, rewards or art were implemented by this simulation. The pool is the 192 pack-eligible expansion proposals; all 18 proposed story-only cards are excluded. It does not model existing cards, campaigns, human choices, partial owned starters or legacy migrations.\n\n';
md+='Four entitlements for every pack ID require '+report.fullCompletionDraws+' draws: '+report.fullFiveDrawPacks+' full five-draw packs and a final '+report.finalPartialSlots+'-draw pack. With the proposed ten-coins-per-slot price, this is '+(report.fullCompletionDraws*10)+' earned coins from zero ownership. Completing the pack pool does not grant any story-only card.\n\n';
md+='Legendary appeared in the first five draws in '+firstPackCount+'/'+runs+' runs ('+(100*observed).toFixed(2)+'%; Wilson 95% interval '+(100*(center-half)).toFixed(2)+'–'+(100*(center+half)).toFixed(2)+'%). Median first-Legendary draw: '+report.firstLegendaryDraw.p50+'; 90th percentile: '+report.firstLegendaryDraw.p90+'. This is not a pity guarantee.\n\n';
md+='Median draw when every eligible ID had at least two normal-copy entitlements: '+report.allIdsHaveTwoNormalEntitlementsByDraw.p50+'. Counts include later foil upgrades, not extra usable copies.\n\n| Draw quarter | Common | Uncommon | Rare | Mythic | Legendary |\n|---|---:|---:|---:|---:|---:|\n';
report.drawQuarterRarityPercentages.forEach((b,i)=>md+='| '+(i+1)+' | '+rarities.map(r=>b[r]+'%').join(' | ')+' |\n');
md+='\nThe changing mix illustrates the requested shrinking-pool effect. It does not establish enjoyable reward pacing; long-run full foiling is not a campaign requirement. Review prices, release-pool composition, weighting and guarantee policy before implementation.\n\nVerified invariants:\n\n'+report.checks.map(c=>'- '+c).join('\n')+'\n';
fs.writeFileSync(path.join(dir,'PACK-MODEL-REPORT.md'),md);
console.log(JSON.stringify({runs,firstPack:report.firstPackWithLegendary,firstLegendary:report.firstLegendaryDraw,quarters:report.drawQuarterRarityPercentages}));
