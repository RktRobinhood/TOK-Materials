// Read-only cinematic inventory. Run from any directory; writes evidence beside this script.
import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
import {loadRift} from '../../../tools/test/harness.mjs';

const R = loadRift(['js/core/rift.js', 'data/assets.js', 'data/avatars.js',
    'data/creatures.js', 'data/script/lesson1.js', 'data/script/lesson2.js',
    'data/script/lesson3.js', 'data/script/lesson4.js', 'data/cast.js',
    'js/core/story.js', 'js/core/cast.js', 'js/core/stakes.js',
    'data/cutscenes.js', 'js/ui/cutscene.js']);
const state = {avatar: {type: 'fox', variant: 'girl', nickname: 'Traveller'}, settings: {}, flags: {}};
R.State = {get: () => state, has: () => false};
const films = ['cold-open', 'fair-rupture', 'gate-aftermath', 'town-hall-aftermath',
    'tribunal-aftermath', 'core-aftermath', 'fair-homecoming'];
function flags(tier, deaths = [], arrivals = true) {
    const earlier = tier === 4 ? 1 : tier;
    const chapter = {sequins:'ch1',granny:'ch2',sundial:'ch3'};
    return Object.assign({'stakes.ch1': earlier, 'stakes.ch2': earlier, 'stakes.ch3': earlier,
        'stakes.ch4': tier, 'clock:ch1': {n: [0,1,3,5,6][earlier], size: 6},
        'clock:ch2': {n: [0,1,4,6,8][earlier], size: 8},
        'clock:ch3': {n: [0,1,4,6,8][earlier], size: 8},
        'seen:prologue.rift': true, 'seen:ch2.cover': true, 'seen:ch2.square.win': true,
        nudgeFled: true, 'paradox-board': true, wonder: 'believe', fate: 'home',
        brave: 'ask', bargain: 'no', feed: 0},
    ...deaths.map(n => Object.assign({['dead:' + n]: true, ['arrived:' + n]: arrivals},
        chapter[n] ? {['stakes.'+chapter[n]]:4,
            ['clock:'+chapter[n]]:{n:chapter[n]==='ch1'?6:8,size:chapter[n]==='ch1'?6:8}} : {})));
}
const routes = [
    ['clean', flags(1)], ['worn', flags(2)], ['diminished', flags(3)],
    ['brink', {...flags(3), 'clock:ch2': {n:8,size:8}, 'clock:ch3': {n:8,size:8}}],
    ['complete-copy', flags(4)],
    ['all-loss', {...flags(4,['sequins','granny','sundial','pip']), bargain:'yes', fate:'off',feed:6}],
    ['all-loss-no-arrivals', {...flags(4,['sequins','granny','sundial','pip'],false), fate:'left'}],
    ...['sequins','granny','sundial','pip'].map(n => ['loss-'+n,flags(4,[n])]),
    ['bargain-left', {...flags(3), bargain:'yes',fate:'left'}],
];
const errors = [], summary = []; let plans = 0;
for (const type of ['owlet','mothkin','fox','frogling','raven']) for (const variant of ['boy','girl']) {
    Object.assign(state.avatar,{type,variant});
    for (const [route, selected] of routes) for (const id of films) for (const calm of [false,true]) {
        state.flags = selected;
        const before = JSON.stringify(state);
        const p = R.Cutscene.plan(id,{calm}); plans++;
        for (const need of R.Cutscene.needs(p)) if (!need.optional && !R.data.assets[need.id])
            errors.push({type,variant,route,id,missing:need.id});
        if (JSON.stringify(state) !== before) errors.push({type,variant,route,id,mutated:true});
        if (type==='fox' && variant==='girl' && route==='clean' && !calm) summary.push({id,
            shots:p.steps.filter(s=>s.shot).map(s=>({shot:s.shot,camera:s.camera,
                hero:(s.layers||[]).filter(l=>l.id==='hero').map(l=>({x:l.x,w:l.w,mirror:!!l.mirror,art:l.art}))})),
            lines:p.steps.filter(s=>s.say||s.note).map(s=>({kind:s.say?'say':'note',actor:s.actor,text:s.text||s.note}))});
    }
}
const result = {baseline:'eaaac24',plans,routes:routes.map(([name])=>name),errors,summary,
    scope:'Pure selection, manifest coverage and save invariance. Browser framing, emotion and audio quality require separate judgement.'};
fs.writeFileSync(fileURLToPath(new URL('plan-inventory.json',import.meta.url)),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({plans,errors:errors.length,films:summary.map(s=>({id:s.id,shots:s.shots.length,lines:s.lines.length}))},null,2));
