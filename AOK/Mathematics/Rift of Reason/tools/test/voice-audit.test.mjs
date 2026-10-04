import test from 'node:test';
import assert from 'node:assert/strict';
import {auditResponse} from '../voices-audit.mjs';
const lines=[{id:'a',say:'They wear the villagers’ faces like masks.'},{id:'b',say:'Exactly. Check every case.'}];
test('audio audit catches words spilling across a clip boundary without script priming',()=>{
 const results=auditResponse(lines,[{id:'b',heard:'Check every case.'},{id:'a',heard:"They wear the villagers' faces like masks. Exactly."}]);
 assert.ok(results.every(r=>!r.ok));assert.equal(results[0].id,'a');
});
test('audio audit tolerates punctuation but rejects omitted, duplicate or unknown clips',()=>{
 assert.ok(auditResponse(lines,[{id:'a',heard:"They wear the villagers' faces like masks!"},{id:'b',heard:'Exactly: check every case.'}]).every(r=>r.ok));
 assert.throws(()=>auditResponse(lines,[{id:'a',heard:'x'}]),/Incomplete/);
 assert.throws(()=>auditResponse(lines,[{id:'a',heard:'x'},{id:'a',heard:'x'}]),/IDs/);
 assert.throws(()=>auditResponse(lines,[{id:'a',heard:'x'},{id:'unknown',heard:'x'}]),/IDs/);
});
test('audio audit preserves mathematical operators and signed numbers',()=>{
 for(const [expected,heard] of [['4 + 2 = 6','4 - 2 = 6'],['Reason +2','Reason 2'],['Reason 2','Reason -2'],['4 > 2','4 < 2'],['4 × 2','4 ÷ 2']])
  assert.equal(auditResponse([{id:'math',say:expected}],[{id:'math',heard}])[0].ok,false);
});
