import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {loadRift,GAME_DIR} from './harness.mjs';
const files=['js/core/rift.js','js/core/state.js','data/map.js','data/creatures.js','data/axioms.js','data/items.js','js/battle/abilities.js','js/battle/team-codes.js','js/teacher/overview.js'];
function setup(){const R=loadRift(files),s=R.State.freshState();s.avatar={nickname:'PRIVATE NAME',type:'owlet',variant:'boy'};s.map.completed=['stall-gallery','stall-gallery','bonus-mines'];return {R,s};}

test('teacher reads anonymous backup/team summaries without loading or writing game state',()=>{
 const {R,s}=setup();let writes=0;R.storage=()=>({setItem(){writes++;}});const live=R.State.newGame();writes=0;
 const code=R.State.encode('save',s),report=R.TeacherOverview.read(code);
 assert.equal(report.checked,1);assert.equal(report.bonus,1);assert.equal(report.chapter,'prologue');
 assert.ok(!JSON.stringify(report).includes('PRIVATE NAME'));assert.ok(!JSON.stringify(report).includes(code));
 const team=R.Battle.TeamCodes.exportTeam({nickname:'PRIVATE NAME',creatures:[R.State.makeCreature('lobstorian')]});
 const tr=R.TeacherOverview.read(team);assert.equal(tr.kind,'team');assert.equal(tr.teamSize,1);assert.equal(tr.chapter,null);assert.equal(tr.creatures,null);
 assert.equal(R.State.get(),live);assert.equal(writes,0);
});

test('teacher groups replace atomically, counts deduplicate stations and exclude team-only reports',()=>{
 const {R,s}=setup(),session=R.TeacherOverview.create(),code=R.State.encode('save',s);
 session.put(1,code);session.put(1,code);session.put(2,R.Battle.TeamCodes.exportTeam({creatures:[R.State.makeCreature('lobstorian')]}));
 assert.equal(session.rows().length,2);const m=session.map('prologue');assert.equal(m.reports,1);assert.equal(m.stations.find(n=>n.id==='stall-gallery').count,1);
 assert.throws(()=>session.put(1,'bad'));assert.equal(session.rows()[0].checked,1);
 const exposed=session.rows();exposed[0].completed.length=0;assert.equal(session.rows()[0].checked,1);assert.equal(session.map('prologue').stations.find(n=>n.id==='stall-gallery').count,1);
 session.remove(1);assert.equal(session.map('ch1').reports,0);session.clear();assert.equal(session.rows().length,0);
 assert.throws(()=>session.put(0,code));assert.throws(()=>session.put(61,code));assert.throws(()=>session.map('__proto__'));
});

test('teacher rejects unsupported, damaged and oversized reports before interpreting progress',()=>{
 const {R,s}=setup(),encode=p=>R.State.encode('save',p);
 for(const mutate of [p=>p.version=99,p=>p.chapter='__proto__',p=>p.map.completed.push('missing'),p=>p.creatures=[null],p=>p.team=['missing']]){
  const p=JSON.parse(JSON.stringify(s));mutate(p);assert.throws(()=>R.TeacherOverview.read(encode(p)));
 }
 assert.throws(()=>R.TeacherOverview.read('x'.repeat(200001)));assert.throws(()=>R.TeacherOverview.read(encode(null)));
 // The page only loads local classic scripts and never boots the saved game.
 const html=fs.readFileSync(GAME_DIR+'/teacher.html','utf8');assert.ok(!html.includes('boot.js'));assert.ok(!/src="https?:/.test(html));
 const page=fs.readFileSync(GAME_DIR+'/js/teacher/page.js','utf8');assert.ok(!/fetch\(|localStorage|State\.(load|replace|importCode|save)/.test(page));
});
