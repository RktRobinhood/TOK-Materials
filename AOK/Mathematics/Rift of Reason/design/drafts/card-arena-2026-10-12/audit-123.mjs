// A review ledger, not a gameplay simulator or proof of balance. The authored
// revisions carry the semantic decisions; this tool indexes every retained contract.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
import {foundationBatch,revisions} from './review-123.mjs';
import {plotBatch} from './review-132.mjs';
import {expansion2Batch,expansion3Batch,expansion4Batch,expansion5Batch,expansion6Batch,expansion7Batch,expansion8Batch,expansion9Batch,expansion10Batch} from './review-129.mjs';
const dir=path.dirname(fileURLToPath(import.meta.url));
const catalogue=JSON.parse(fs.readFileSync(path.join(dir,'card-catalogue.json')));
const rows=catalogue.cards.map(c=>{
  const t=c.text;
  const risks=[];
  if(/draw|energy|costs? |discount/i.test(t))risks.push('resource: preserve normal energy, activation and hand caps; no refund on replay');
  if(/discard|recover|return|copy|replay/i.test(t))risks.push('identity: move actual instance; consume one-shots before effects; no cloned receipt or source');
  if(c.tags.some(x=>x.startsWith('fate')))risks.push('Fate: public occurrence identity, original expiry, skip/rewind/cancel and terminal-queue tests before release');
  if(/token|summon/i.test(t))risks.push('tokens: reserve board capacity; finite generation; no collection copies; deterministic order');
  if(/Win|hearts|hero/i.test(t))risks.push('Win: current rule and simultaneous/terminal boundaries; no revival after a settled win');
  if(/until|round|turn|once/i.test(t))risks.push('lifetime: authoritative owner/round/match stamp; no UI timer; copied source does not reset a match cap');
  if(/inspect|look|reveal/i.test(t))risks.push('information: explicit viewer and public/private label; no reserved-deck or prospective hidden read');
  if(/control|swap|colour/i.test(t))risks.push('derived state: legal target revalidation, normal swaps/prevention, fixed construction identity and explicit temporary expiry');
  return {id:c.id,affinity:c.affinity,kind:c.kind,rarity:c.rarity,channel:c.acquisition.channel,
    disposition:foundationBatch.includes(c.id)?'foundation-1 runtime release; see acceptance report':plotBatch.includes(c.id)?'plot-1 runtime release; see story-132 acceptance report':expansion2Batch.includes(c.id)?'expansion-2 runtime release (#129); see expansion-2 acceptance report':expansion3Batch.includes(c.id)?'expansion-3 runtime release (#129); see expansion-3 acceptance report':expansion4Batch.includes(c.id)?'expansion-4 runtime release (#129); see expansion-4 acceptance report':expansion5Batch.includes(c.id)?'expansion-5 runtime release (#129); see expansion-5 acceptance report':expansion6Batch.includes(c.id)?'expansion-6 runtime release (#129); see expansion-6 acceptance report':expansion7Batch.includes(c.id)?'expansion-7 runtime release (#129); see expansion-7 acceptance report':expansion8Batch.includes(c.id)?'expansion-8 runtime release (#129); see expansion-8 acceptance report':expansion9Batch.includes(c.id)?'expansion-9 runtime release (#129); see expansion-9 acceptance report':expansion10Batch.includes(c.id)?'expansion-10 runtime release (#129); see expansion-10 acceptance report':'held; not a runtime release',
    trigger:t.split(':')[0].includes('Entrance')?'Entrance':c.kind==='spell'?'paid cast':c.kind==='axiom'?'active shared rule':t.split(',')[0],
    target:c.target||c.category||(c.kind==='creature'?'creature-local or explicitly named target in contract':null),
    payoffAndLifetime:t,counterplay:c.counterplay,semanticRevision:revisions[c.id]?.why||null,
    releaseChecks:risks.length?risks:['ordinary target, cost, copy cap and defeat/cleanup tests before release'],gates:c.gates};
});
assert.equal(rows.length,210);assert.equal(new Set(rows.map(r=>r.id)).size,210);
assert.equal(rows.filter(r=>r.channel==='story-only').length,18);
assert.equal(rows.filter(r=>r.disposition.startsWith('foundation')).length,7);
assert.equal(rows.filter(r=>r.disposition.startsWith('expansion-2')).length,8);
assert.equal(rows.filter(r=>r.disposition.startsWith('expansion-3')).length,8);
const out={date:'2026-10-21',issue:123,scope:'All 210 effects screened against shipped cards and each other; index is not a balance result',
  revised:Object.keys(revisions).length,firstBatch:foundationBatch,plotBatch,expansion2Batch,expansion3Batch,expansion4Batch,expansion5Batch,expansion6Batch,expansion7Batch,expansion8Batch,expansion9Batch,expansion10Batch,held:210-foundationBatch.length-plotBatch.length-expansion2Batch.length-expansion3Batch.length-expansion4Batch.length-expansion5Batch.length-expansion6Batch.length-expansion7Batch.length-expansion8Batch.length-expansion9Batch.length-expansion10Batch.length,rows};
fs.writeFileSync(path.join(dir,'CONTRACT-REVIEW.json'),JSON.stringify(out,null,2)+'\n');
console.log(JSON.stringify({screened:rows.length,revised:out.revised,released:7+plotBatch.length+expansion2Batch.length+expansion3Batch.length+expansion4Batch.length+expansion5Batch.length+expansion6Batch.length+expansion7Batch.length+expansion8Batch.length+expansion9Batch.length+expansion10Batch.length,held:out.held,storyOnly:18}));
