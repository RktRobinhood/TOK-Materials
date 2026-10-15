import test from 'node:test';
import assert from 'node:assert/strict';
import {loadWithDom} from './fake-dom.mjs';
import {voiceCatalog} from '../voices.mjs';

test('completed greeting lines are not repeated; Skip and failure supply only unheard lines',async()=>{
    for(const completed of [0,1,2])for(const failed of [false,true]){
        const g=game();dialogue(g);
        const greetings=[{s:'narrator',t:'Good morning, {name}.'},{s:'narrator',t:'I am the Sundial.'}];
        g.Rift.Cutscene={has:()=>true,stop(){},play:async(id,options)=>{
            greetings.slice(0,completed).forEach(line=>options.onSpoken({speaker:line.s,text:line.t}));
            return !failed;
        }};
        const done=g.Rift.Dialogue.play([{cutscene:'cold-open',fallback:[{flag:'fallback'}],continuation:greetings},{flag:'awake'}]);
        await settle();
        for(let guard=0;guard<4&&g.$('.box');guard++){g.$('.box').click();await settle();}
        await done;
        assert.deepEqual(g.speech.map(line=>line.text),greetings.slice(completed).map(line=>line.t.replace('{name}','Ada')));
        assert.equal(g.state.flags.awake,true);assert.equal(g.state.flags.fallback,failed?true:undefined);
        assert.equal(g.claims(),0);
    }
});

test('a line interrupted before its voice/reading beat finishes is not reported as spoken',async()=>{
    let finish;const voice=new Promise(resolve=>{finish=resolve;});
    const g=game({voice}),heard=[];
    const done=g.Rift.Cutscene.play(g.film([shot,{say:'narrator',t:'Good morning.'}]),{onSpoken:line=>heard.push(line)});
    await settle();await g.advance(2500);assert.equal(heard.length,0);
    g.key('Escape');finish();assert.equal(await done,true);await settle();assert.equal(heard.length,0);
});

test('new and older seen openings greet once on the regular screen, after the film closes',async()=>{
    for(const seen of [false,true]){
        const g=game();dialogue(g);g.run('data/script/lesson1.js');
        g.state.flags['seen:prologue.cold']=seen;
        g.Rift.Story.test=condition=>!!g.state.flags['seen:'+condition.seen];
        let films=0;
        const play=g.Rift.Cutscene.play;
        g.Rift.Cutscene.play=id=>{films++;return play(id,{instant:true});};
        const opening=g.Rift.data.script['prologue.wake'].slice(0,2);
        const done=g.Rift.Dialogue.play([...opening,{flag:'awake'}]);
        await settle();
        for(let guard=0;guard<20&&!g.state.flags.awake;guard++){
            if(g.$('.box')){assert.equal(g.$('.cutscene'),null);g.$('.box').click();}
            await settle();
        }
        await done;assert.equal(films,seen?0:1);
        const greetings=g.speech.filter(line=>line.speaker==='narrator');
        assert.equal(greetings.length,2);assert.match(greetings[0].text,/Good morning, Ada/);
        assert.equal(g.state.flags.awake,true);
    }
});

function dialogue(g) {
    const overlay=g.document.createElement('div');overlay.setAttribute('id','overlay');g.document.body.append(overlay);
    g.Rift.Story={matchesOnly:()=>true,chapterOfKey:()=>null,flag:key=>g.state.flags[key],
        setFlag:(key,value)=>{g.state.flags[key]=value;}};
    g.Rift.data.script={};
    g.Rift.Cast={actor:role=>role,original:role=>role,text:step=>step.t};
    g.Rift.Assets={img:()=>g.Rift.el('img'),has:()=>true};
    g.state.settings.textInstant=true;
    g.run('js/ui/dialogue.js');
}

test('the real router starts the opening once, Skip continues to wake, navigation does not',async()=>{
    for(const navigate of [false,true]){
        const g=game();dialogue(g);g.run('js/core/router.js');
        const screen=g.document.createElement('div');screen.setAttribute('id','screen');g.document.body.append(screen);
        g.film([shot,{wait:60000}],'cold-open');
        g.Rift.data.script.cold=[{cutscene:'cold-open',fallback:[{flag:'fallback'}]}];
        g.Rift.data.script.wake=[{play:'cold',once:true},{flag:'awake'}];
        g.Rift.Screens.register('encounter',{mount(){g.Rift.Dialogue.play('wake');return{};}});
        g.Rift.Screens.register('map',{mount(){return{};}});
        g.Rift.Router.replace('encounter');await settle();
        assert.ok(g.Rift.Cutscene.current(),'initial screen:changed must not skip the film');
        if(navigate)g.Rift.Router.replace('map');else g.key('Escape');
        await settle();
        assert.equal(g.Rift.Cutscene.current(),null);assert.equal(g.claims(),0);
        assert.equal(g.state.flags.awake,navigate?undefined:true);
        assert.equal(g.state.flags['seen:cold'],navigate?undefined:true);
        assert.equal(g.state.flags.fallback,undefined);
    }
});

test('dialogue falls back when film is absent, art fails, or the player rejects',async()=>{
    for(const kind of ['absent','failed','rejected']){
        const g=game();dialogue(g);
        g.Rift.Cutscene={has:()=>kind!=='absent',play:()=>kind==='failed'?Promise.resolve(false):Promise.reject(new Error('test')),stop(){}};
        await g.Rift.Dialogue.play([{cutscene:'cold-open',fallback:[{flag:'fallback'}]},{flag:'awake'}]);
        assert.equal(g.state.flags.fallback,true);assert.equal(g.state.flags.awake,true);assert.equal(g.claims(),0);
    }
});

test('system reduced motion selects the gentler cut without changing saved settings',async()=>{
    const g=game();g.ctx.matchMedia=()=>({matches:true});
    const steps=[];await g.Rift.Cutscene.play('cold-open',{instant:true,onStep:(kind,s)=>steps.push(s)});
    assert.ok(steps.every(s=>!s.fx));assert.equal(g.state.settings.calm,undefined);
});

test('a render failure after playback starts releases the overlay and returns fallback',async()=>{
    const g=game(),id=g.film([{shot:'test',layers:[{id:'room',art:'scene/bedroom',x:800,y:450,w:1600,h:900,cover:true}]},{wait:60000}]);
    const done=g.Rift.Cutscene.play(id);await settle();
    g.Rift.clamp=()=>{throw new Error('test renderer failure');};
    await g.advance(16);assert.equal(await done,false);assert.equal(g.claims(),0);
    assert.equal(g.frames.size,0);assert.equal(g.timers.size,0);assert.equal(g.$('.cutscene'),null);
});

const settle = async () => { for (let i = 0; i < 80; i++) await Promise.resolve(); };
function game(options = {}) {
    let now = 0, serial = 0, stopped = 0, claims = 0;
    const timers = new Map(), frames = new Map(), events = new Map(), speech = [], scenes = [];
    const state = {avatar:{type:'fox',variant:'girl',nickname:'Ada'},flags:{},settings:{}};
    const g = loadWithDom(['js/core/rift.js','data/avatars.js','data/assets.js','data/cutscenes.js', ctx => {
        ctx.performance = {now:() => now};
        ctx.setTimeout = (fn, ms) => { const id=++serial;timers.set(id,{fn,at:now+ms});return id; };
        ctx.clearTimeout = id => timers.delete(id);
        ctx.requestAnimationFrame = fn => { const id=++serial;frames.set(id,fn);return id; };
        ctx.cancelAnimationFrame = id => frames.delete(id);
        ctx.addEventListener = (key, fn) => { if(!events.has(key))events.set(key,new Set());events.get(key).add(fn); };
        ctx.removeEventListener = (key,fn) => events.get(key)?.delete(fn);
        ctx.Image = class {
            set src(value) {
                if(options.holdImages)return;
                Promise.resolve().then(() => options.brokenImages ? this.onerror() : this.onload());
            }
        };
        ctx.Rift.State = {get:() => state};
        ctx.Rift.Audio = {sfx(){},stopVoice(){stopped++;},speak(line){speech.push(line);return options.voice || Promise.resolve();}};
        ctx.Rift.Ambience = {now:() => ({art:options.beforeArt ?? null,tension:0.4}),scene:id=>scenes.push(id),tension(){}};
        ctx.Rift.UI = {input:{claim:()=>{claims++;return()=>claims--;},guard(){},available:()=>true}};
        ctx.Rift.voiceId = (speaker,text) => speaker+':'+text;
    },'js/ui/cutscene.js']);
    const film = (steps, id='test') => {g.Rift.data.cutscenes[id]={title:'Test film',steps};return id;};
    const advance = async ms => {
        now+=ms;
        for(const [id,t] of [...timers])if(t.at<=now){timers.delete(id);t.fn();}
        const pending=[...frames];frames.clear();pending.forEach(([,fn])=>fn(now));
        await settle();
    };
    return Object.assign(g,{state,timers,frames,events,speech,scenes,film,advance,
        stopped:()=>stopped,claims:()=>claims,
        key(key){const ev={key,preventDefault(){},stopImmediatePropagation(){}};events.get('keydown')?.forEach(fn=>fn(ev));}});
}
const shot = {shot:'quiet',layers:[]};

function storyGame(type = 'fox', variant = 'girl') {
    const g = game(); dialogue(g);
    Object.assign(g.state.avatar, {type, variant});
    g.state.items = {}; g.state.map = {completed:[],rifts:[]}; g.state.chapter = 'prologue';
    Object.assign(g.Rift.State, {
        setFlag:(k,v)=>{g.state.flags[k]=v;}, update:fn=>fn(g.state),
        addItem:(id,n)=>{g.state.items[id]=(g.state.items[id]||0)+n;},
    });
    g.Rift.UI.toast=()=>{}; g.Rift.UI.input.consume=()=>{};
    g.run('data/map.js'); g.run('data/items.js'); g.run('data/creatures.js'); g.run('data/script/lesson1.js'); g.run('data/cast.js');
    g.run('data/script/lesson2.js');
    g.run('js/core/story.js'); g.run('js/core/cast.js'); g.run('js/core/stakes.js');
    return g;
}
async function finishStory(g, promise, mode) {
    let done=false; promise.then(()=>{done=true;});
    for(let guard=0;guard<260&&!done;guard++) {
        await settle();
        if(g.Rift.Cutscene && g.Rift.Cutscene.current()) {
            if(mode==='skip') g.key('Escape'); else await g.advance(20000);
        } else if(g.$('.choices button')) g.$('.choices button').click();
        else if(g.$('.box')) g.$('.box').click();
    }
    assert.ok(done,'story must finish without hiding a decision'); await promise;
}

test('the Fair movie uses canonical recorded keys for all ten avatars, remains in frame and changes no save',async()=>{
    const voices=new Set(voiceCatalog().lines.map(l=>l.who+':'+l.text));
    for(const type of ['owlet','mothkin','fox','frogling','raven']) for(const variant of ['boy','girl']) {
        const g=storyGame(type,variant), before=JSON.stringify(g.state), trace=[];
        const ok=await g.Rift.Cutscene.play('fair-rupture',{instant:true,onStep:(k,s)=>trace.push([k,s])});
        assert.ok(ok); assert.equal(JSON.stringify(g.state),before); assert.equal(g.speech.length,18);
        for(const l of g.speech) assert.ok(voices.has(l.voice),'catalogued: '+l.voice);
        assert.equal(g.speech[2].speaker,'avatar-'+type+'-'+variant);
        for(const [,s] of trace) for(const l of s.layers||[]) {
            if(l.cover||l.id==='shadow')continue;
            const p=g.Rift.Cutscene.project(s.camera||{x:800,y:450,zoom:1},l);
            assert.ok(p.sx-l.w*p.S/2>=0&&p.sx+l.w*p.S/2<=1600,l.id+' fits horizontally');
            assert.ok(p.sy-l.h*p.S/2>=0&&p.sy+l.h*p.S/2<=760,l.id+' fits above subtitles');
        }
    }
});

test('complete, skipped and unavailable Fair films preserve the evening decision, gifts and next destination exactly once',async()=>{
    for(const mode of ['complete','skip','unavailable']) {
        const g=storyGame('mothkin','girl');
        if(mode==='unavailable')g.Rift.Cutscene=null;
        await finishStory(g,g.Rift.Dialogue.play('prologue.rift'),mode);
        assert.equal(g.state.flags.brave,'go'); assert.equal(g.state.items.charm,3);assert.equal(g.state.items.tonic,1);
        assert.ok(g.state.flags['seen:prologue.rift']);assert.ok(g.state.flags['seen:prologue.evening']);
        assert.ok(g.speech.some(l=>l.text.includes('Talking Signpost')));
        assert.ok(g.speech.some(l=>l.text==='Find my shadow. Then we can finish that final.'));
        assert.equal(g.speech.filter(l=>l.text==='Hey! That was my shadow! I was using it!').length,1);
        if(g.Rift.Cutscene)g.Rift.Cutscene.play=async()=>true;
        await finishStory(g,g.Rift.Dialogue.play('prologue.rift'),'skip');
        assert.equal(g.state.items.charm,3);assert.equal(g.state.items.tonic,1);
    }
});

test('an interrupted named conversation resumes only unheard lines; navigation never commits its ending',async()=>{
    const g=storyGame(); let release;
    const spoken=g.Rift.Audio.speak;
    g.Rift.Audio.speak=line=>{spoken(line);return g.speech.length===4?new Promise(r=>{release=r;}):Promise.resolve();};
    const promise=g.Rift.Dialogue.play('prologue.rift');
    await settle();
    for(let i=0;i<20&&g.speech.length<4;i++)await g.advance(20000);
    assert.equal(g.speech.length,4);g.key('Escape');release();
    await finishStory(g,promise,'skip');
    assert.equal(g.speech.filter(l=>l.text.startsWith('Make way!')).length,1);
    assert.equal(g.speech.filter(l=>l.text.startsWith('Always?')).length,2,'interrupted line is replayed');
    const abandoned=storyGame();abandoned.Rift.Dialogue.play('prologue.rift');await settle();
    abandoned.Rift.Dialogue.abortAll();await settle();
    assert.equal(abandoned.state.flags['seen:prologue.rift'],undefined);assert.deepEqual(abandoned.state.items,{});
    assert.equal(abandoned.claims(),0);
});

test('Gate films show the actual outcome, take Nudge away before narration and preserve rewards on skip/failure',async()=>{
    for(const type of ['owlet','fox','mothkin','frogling','raven']) for(const tier of [1,2,3,4]) for(const mode of ['complete','skip','unavailable']) {
        const g=storyGame(type,type==='owlet'?'girl':'boy'), trace=[];
        Object.assign(g.state.flags, {'seen:prologue.rift':true,'stakes.ch1':tier,'dead:sequins':tier===4,
            'clock:ch1':{n:[0,1,3,5,6][tier],size:6,started:true,done:true,tier},turnedBack:type==='fox'});
        g.state.chapter='ch1';
        const original=g.Rift.Cutscene.play;
        if(mode==='unavailable')g.Rift.Cutscene=null;
        else g.Rift.Cutscene.play=(id,o)=>original(id,{...o,onStep:(k,s)=>trace.push([k,s])});
        await finishStory(g,g.Rift.Dialogue.play('ch1.gate.win'),mode);
        assert.equal(g.state.items['lucky-sequin']||0,tier<=2?1:0);
        assert.equal(!!g.state.flags.nudgeFled,tier>=2);
        assert.ok(g.state.flags['seen:ch1.gate.win']);
        assert.equal(g.speech.filter(l=>l.text.includes('I TOOK THE TORTOISE')).length,type==='fox'&&tier!==4?0:1);
        assert.equal(g.speech.filter(l=>l.text.startsWith('You turned back.')).length,type==='fox'?1:0);
        if(mode!=='complete')continue;
        const opening=trace.find(([,s])=>s.shot==='the-open-gate')[1];
        assert.equal(opening.layers.some(l=>l.id==='sequins'),tier!==4);
        const escape=trace.find(([,s])=>s.shot==='the-escaping-piece')[1];
        assert.equal(escape.layers.some(l=>l.id==='nudge'),tier!==4);
        if(tier===4)assert.ok(g.speech.every(l=>l.speaker!=='sequins'&&l.speaker!=='nudge'));
        else {
            const leave=trace.findIndex(([k,s])=>k==='tween'&&s.tween==='nudge');
            const consequence=trace.findIndex(([k,s])=>k==='say'&&/^Gone through|^You caught/.test(s.t));
            assert.ok(leave>=0&&consequence>leave);
        }
        const vision=trace.find(([,s])=>s.shot==='the-wrong-victory')[1];
        assert.ok(vision.layers.some(l=>l.id==='hero'));assert.ok(vision.layers.some(l=>l.id==='door-feed'&&!l.cover));
    }
});

test('Gate navigation abandonment grants no reward and re-entry grants only one',async()=>{
    for(const tier of [1,2,3,4]) {
        const g=storyGame();
        Object.assign(g.state.flags,{'seen:prologue.rift':true,'stakes.ch1':tier,'dead:sequins':tier===4,
            'clock:ch1':{n:[0,1,3,5,6][tier],size:6,started:true,done:true,tier}});
        g.Rift.Dialogue.play('ch1.gate.win');await settle();
        assert.ok(g.Rift.Cutscene.current());g.Rift.Dialogue.abortAll();await settle();
        assert.equal(g.state.flags['seen:ch1.gate.win'],undefined);
        assert.equal(g.state.flags.nudgeFled,undefined);assert.deepEqual(g.state.items,{});
        await finishStory(g,g.Rift.Dialogue.play('ch1.gate.win'),'complete');
        assert.equal(g.state.items['lucky-sequin']||0,tier<=2?1:0);
        assert.equal(!!g.state.flags.nudgeFled,tier>=2);assert.equal(g.claims(),0);
    }
});

function hallGame(type='mothkin',variant='girl',tier=1) {
    const g=storyGame(type,variant),n=[0,0,3,5,8][tier];
    Object.assign(g.state.flags,{'seen:ch2.cover':true,'seen:ch2.square.win':true,
        'seen:prologue.evening':true,'seen:ch2.arrive':true,'seen:ch2.well':true,
        'dead:granny':tier===4,'stakes.ch2':tier===4?4:undefined,
        'clock:ch2':{n,size:8,started:true,done:tier===4,tier:tier===4?4:null},suspect:'mayor'});
    g.state.chapter='ch2';
    return g;
}

test('the Hall replay uses only canonical words and stages each tier without changing story state',async()=>{
    const voices=new Set(voiceCatalog().lines.map(l=>l.who+':'+l.text));
    for(const type of ['owlet','mothkin','fox','frogling','raven'])for(const variant of ['boy','girl'])
        for(const tier of [1,2,3,4])for(const recovered of [false,true]) {
            const g=hallGame(type,variant,tier);
            g.state.flags['stakes.ch2']=tier;
            Object.assign(g.state.flags,{nudgeFled:recovered,'paradox-board':true});
            const before=JSON.stringify(g.state),p=g.Rift.Cutscene.plan('town-hall-aftermath');
            const says=p.steps.filter(s=>s.say),shots=p.steps.filter(s=>s.shot);
            assert.equal(JSON.stringify(g.state),before);
            for(const s of says)assert.ok(voices.has(s.say+':'+s.t),'catalogued Hall line '+s.say+':'+s.t);
            assert.equal(says.filter(s=>s.t.includes('my first piece')).length,recovered?1:0);
            assert.equal(says.filter(s=>s.say==='nudge').length,tier===4?0:1);
            assert.equal(says.filter(s=>s.say==='granny').length,tier===4?0:1);
            assert.ok(says.some(s=>s.t==='Forty years I marked "maybe" wrong. Red ink. Every child.'));
            const outcome=shots.find(s=>s.shot==='the-space-beside-you');
            assert.equal(outcome.layers.some(l=>l.id==='granny'),tier!==4);
            assert.equal(outcome.layers.some(l=>l.id==='axiom'),tier<=2);
            assert.equal(outcome.layers.some(l=>l.id==='keepsakes'),tier===4);
            if(tier===3)assert.equal(outcome.layers.find(l=>l.id==='granny').art,'npc/granny-axiom/idle');
            for(const s of shots) {
                const isPeril=['the-last-answer','the-teachers-face','the-shadow-on-the-floor','borrowed-faces','forty-years'].includes(s.shot);
                assert.equal(s.layers[0].art,isPeril&&tier!==4?'scene/feast-hall':'scene/hall-after');
                for(const l of s.layers.filter(l=>!l.cover)) {
                    const p=g.Rift.Cutscene.project(s.camera,l);
                    assert.ok(p.sx-l.w*p.S/2>=0&&p.sx+l.w*p.S/2<=1600,l.id+' fits horizontally');
                    assert.ok(p.sy-l.h*p.S/2>=0&&p.sy+l.h*p.S/2<=760,l.id+' fits above subtitles');
                }
            }
            assert.equal(shots.find(s=>s.shot==='forty-years').layers.filter(l=>/^shadow-/.test(l.id)).length,recovered?2:1);
            const speech=p.steps.findIndex(s=>s.t==='Tomorrow is waiting. Everyone there has already decided about you.');
            const exit=p.steps.findIndex(s=>s.tween==='quill'&&s.to.opacity===0);
            assert.ok(speech>=0&&exit>speech,'Quill speaks before she leaves');
            assert.ok(p.steps.every(s=>!s.flag&&!s.clock&&!s.give&&!s.choice));
        }
    const brink=hallGame('raven','boy',3);
    brink.state.flags['stakes.ch2']=3;brink.state.flags['clock:ch2'].n=8;
    const saved=brink.Rift.Cutscene.plan('town-hall-aftermath');
    assert.equal(saved.steps.find(s=>s.shot==='the-space-beside-you').layers.find(l=>l.id==='granny').art,'cutscene/granny-without-shawl');
    assert.ok(saved.steps.some(s=>s.t==='My shawl boiled away. With your card in the pocket.'));
    const recovered=saved.steps.find(s=>s.shot==='the-last-answer');
    assert.equal(recovered.layers[0].art,'scene/hall-after');
    assert.equal(recovered.layers.find(l=>l.id==='granny-safe').art,'cutscene/granny-without-shawl');
    const grounded=saved.steps.find(s=>s.shot==='the-space-beside-you').layers.find(l=>l.id==='granny');
    assert.equal(grounded.y+grounded.h/2,730);
});

test('Hall complete, Skip and failed films preserve decisions, outcomes, inner voices and one earned card',async()=>{
    for(const type of ['owlet','mothkin','fox','frogling','raven'])for(const tier of [1,2,3,4])
        for(const mode of ['complete','skip','unavailable','failed']) {
            const g=hallGame(type,type==='mothkin'?'boy':'girl',tier),trace=[];
            g.state.flags.nudgeFled=true;g.state.flags['paradox-board']=true;
            const play=g.Rift.Cutscene.play;
            if(mode==='unavailable')g.Rift.Cutscene=null;
            else if(mode==='failed')g.Rift.Cutscene.play=async()=>false;
            else g.Rift.Cutscene.play=(id,o)=>play(id,{...o,onStep:(k,s)=>trace.push([k,s])});
            await finishStory(g,g.Rift.Dialogue.play('ch2.hall.win'),mode);
            assert.equal(g.state.flags['stakes.ch2'],tier);
            assert.equal(!!g.state.flags['spare-axiom'],tier<=2);
            assert.equal(g.state.flags['away:schoolteacher'],true);
            assert.equal(g.state.flags['hall-paradox'],true);
            assert.equal(g.state.flags['seen:ch2.hall.win'],true);
            assert.equal(g.speech.filter(l=>l.text.startsWith('True. No. False.')).length,1);
            assert.equal(g.speech.filter(l=>l.text.startsWith('Forty years I marked')).length,1);
            assert.equal(g.speech.filter(l=>l.text.includes('my first piece')).length,1);
            assert.equal(g.speech.filter(l=>l.text.includes('Who checks the table')).length,1);
            if(tier===4)assert.ok(g.speech.every(l=>l.speaker!=='granny'&&l.speaker!=='nudge'));
            const expected={owlet:'I called it the first rule.',mothkin:'He twitched.',fox:tier===4?'I pictured the wrong face.':'Great story.',frogling:'Loud was bad three times.'}[type];
            if(expected)assert.ok(g.speech.some(l=>l.text.startsWith(expected)),type+' keeps its inner reveal');
            if(mode==='complete')assert.equal(trace.filter(([,s])=>s.shot==='the-space-beside-you').length,1);
            assert.equal(g.claims(),0);
        }
});

test('one wrong Hall sentence still advances danger and changes Granny from dry to damp',async()=>{
    const g=hallGame();g.state.flags['clock:ch2'].n=2;
    const play=g.Rift.Cutscene.play;g.Rift.Cutscene.play=(id,o)=>play(id,{...o,instant:true});
    let wrong=false,done=false;
    const promise=g.Rift.Dialogue.play('ch2.hall.win');promise.then(()=>{done=true;});
    for(let guard=0;guard<150&&!done;guard++) {
        await settle();
        const choices=g.$$('.choices button');
        if(choices.length){const pick=!wrong?choices.find(b=>b.textContent==='This statement is true.'):choices[0];wrong=true;pick.click();}
        else if(g.$('.box'))g.$('.box').click();
    }
    assert.ok(done);await promise;
    assert.equal(g.state.flags['clock:ch2'].n,4);
    assert.equal(g.state.flags['stakes.ch2'],2);
    assert.ok(g.speech.some(l=>l.text==='I smell of leek. Tell no one. Tell everyone. Here: my Spare Axiom.'));
    assert.ok(g.speech.every(l=>!l.text.startsWith('Not a drop on me.')));
});

test('Hall navigation aborts each passage without granting the card; accepted paradox and danger survive re-entry',async()=>{
    for(const stopAt of ['town-hall-unmask','town-hall-outcome','town-hall-departure']) {
        const g=hallGame(),play=g.Rift.Cutscene.play;let arrived=false;
        g.Rift.Cutscene.play=(id,o)=>{if(id===stopAt)arrived=true;return play(id,{...o,instant:id!==stopAt});};
        g.Rift.Dialogue.play('ch2.hall.win');
        for(let guard=0;guard<100&&!arrived;guard++) {
            await settle();
            if(g.$('.choices button'))g.$('.choices button').click();
            else if(g.$('.box'))g.$('.box').click();
        }
        assert.ok(arrived);await settle();assert.ok(g.Rift.Cutscene.current(),'abort occurs inside the film');
        g.Rift.Dialogue.abortAll();await settle();
        assert.equal(g.state.flags['seen:ch2.hall.win'],undefined);
        assert.equal(g.state.flags['spare-axiom'],undefined);
        assert.equal(g.state.flags['hall-paradox'],true);
        const danger=g.state.flags['clock:ch2'].n;
        g.Rift.Cutscene.play=(id,o)=>play(id,{...o,instant:true});
        await finishStory(g,g.Rift.Dialogue.play('ch2.hall.win'),'complete');
        assert.equal(g.state.flags['clock:ch2'].n,danger);
        assert.equal(g.state.flags['spare-axiom'],true);
        assert.equal(g.state.flags['seen:ch2.hall.win'],true);
        assert.equal(g.claims(),0);
    }
});

test('canonical creature subtitle labels use display names while voice IDs retain possession',()=>{
    const g=storyGame();
    const says=g.Rift.Cutscene.plan('fair-rupture').steps.filter(s=>s.say);
    for(const actor of ['speedcheeta','siuuugull']) {
        const s=says.find(s=>s.actor===actor);assert.ok(s);
        assert.equal(s.label,g.Rift.data.creatures[actor].name);
    }
    assert.ok(says.some(s=>s.say==='siuuugull-possessed'));
});

test('named cutscene dialogue handles understudy words without repetition or unearned actors',async()=>{
    const g=storyGame();g.state.flags['dead:granny']=true;
    g.Rift.data.script.testWords=[{s:'granny',t:'Original words.',u:'Understudy words.'}];
    g.film([shot,{conversation:'testWords'}],'cast-film');
    assert.equal(g.Rift.Cutscene.plan('cast-film').steps.filter(s=>s.say).length,0);
    g.state.flags['arrived:granny']=true;
    const original=g.Rift.Cutscene.play;g.Rift.Cutscene.play=(id,o)=>original(id,{...o,instant:true});
    await g.Rift.Dialogue.play([{cutscene:'cast-film',continuation:'testWords'}]);
    assert.deepEqual(g.speech.map(l=>l.text),['Understudy words.']);
    assert.equal(g.speech[0].speaker,'achilles');
});

test('each chosen nickname reaches the scan and subtitles while the recorded voice key stays reusable',async()=>{
    for(const nickname of ['Lin','Åsa','Jo & Sam']){
        const g=game(),trace=[];
        await g.Rift.Cutscene.play('cold-open',{player:{type:'raven',variant:'girl',nickname},instant:true,onStep:(kind,s)=>trace.push([kind,s])});
        assert.ok(g.speech[0].text.endsWith('SUBJECT: '+nickname+'.'));
        assert.ok(g.speech[0].voice.endsWith('SUBJECT: {name}.'));
        const subject=trace.find(([kind,s])=>kind==='hud'&&s.id==='subject')[1];
        assert.equal(subject.label,'SUBJECT: '+nickname.toUpperCase());
        assert.ok(!JSON.stringify(trace).includes('Ada'));
    }
});

test('the observation glass opens continuously, then the film fades to reveal the regular screen',async()=>{
    const g=game();
    const done=g.Rift.Cutscene.play(g.film([
        {shot:'monitor',layers:[{id:'feed',art:'scene/cold-open',x:800,y:450,w:800,h:400,aperture:.5}]},
        {tween:'feed',to:{aperture:1,scale:2},dur:1000,wait:true},
        {end:true,reveal:true,fade:1000},
    ]));
    await settle();assert.equal(g.$('.cs-layer').style.clipPath,'inset(100px 0)');
    await g.advance(500);assert.equal(g.$('.cs-layer').style.clipPath,'inset(50px 0)');
    await g.advance(500);assert.equal(g.$('.cs-layer').style.clipPath,'inset(0px 0)');
    await g.advance(500);assert.equal(g.$('.cutscene').style.opacity,'0.5');
    assert.equal(g.$('.cs-black').style.opacity,'0');
    await g.advance(500);assert.equal(await done,true);assert.equal(g.$('.cutscene'),null);
});

test('all ten avatars complete the real timeline, speak the exact recorded keys and never change the save',async()=>{
    for(const type of ['owlet','mothkin','fox','frogling','raven'])for(const variant of ['boy','girl']){
        const g=game(),before=JSON.stringify(g.state),trace=[];
        const ok=await g.Rift.Cutscene.play('cold-open',{player:{type,variant,nickname:'Ada'},instant:true,onStep:(kind,s)=>trace.push([kind,s])});
        assert.equal(ok,true,type+' '+variant);assert.equal(JSON.stringify(g.state),before);
        assert.equal(g.speech.length,1);assert.match(g.speech[0].text,/SUBJECT: Ada/);assert.match(g.speech[0].voice,/\{name\}/);
        assert.ok(trace.every(([k,s])=>!('title' in s)&&s.shot!=='void'&&s.shot!=='crack'&&s.shot!=='daybreak'));
        assert.equal(trace.filter(([k])=>k==='shot').at(-1)[1].shot,'waking');
        assert.equal(trace.at(-1)[1].reveal,true);
        assert.equal(trace.find(([k])=>k==='shot')[1].shot,'morning');
        const bedroom=trace.find(([k,s])=>k==='shot'&&s.shot==='bedroom')[1];
        assert.ok(bedroom.layers.some(l=>l.art==='avatar/'+type+'-'+variant+'/asleep'));
        const waking=trace.find(([k,s])=>k==='shot'&&s.shot==='waking')[1];
        const body=waking.layers.find(l=>l.id==='awake');
        assert.equal(body.art,'avatar/'+type+'-'+variant+'/waking');assert.equal(body.clipY,undefined);
        const bounds=g.Rift.Cutscene.project({x:800,y:450,zoom:1.035},body);
        assert.ok(bounds.sx-body.w*bounds.S/2>=0&&bounds.sx+body.w*bounds.S/2<=1600);
        assert.ok(bounds.sy-body.h*bounds.S/2>=0&&bounds.sy+body.h*bounds.S/2<=900,'full body remains in frame');
        assert.equal(g.$('.cutscene'),null);assert.equal(g.claims(),0);assert.equal(g.timers.size,0);
        assert.equal(g.frames.size,0);assert.equal(g.events.get('keydown').size,0);
        assert.deepEqual(g.scenes,['scene/fair','cutscene/server-room','cutscene/cold-open',null]);
    }
});

test('Calm removes every flash/sweep/glitch and preserves the quiet opening hold',async()=>{
    const g=game(),seen=[];
    const plan=g.Rift.Cutscene.plan('cold-open',{calm:true});
    assert.equal(plan.steps[2].wait,6500);
    await g.Rift.Cutscene.play('cold-open',{calm:true,instant:true,onStep:(kind,s)=>seen.push([kind,s])});
    assert.ok(seen.every(([k,s])=>k!=='fx'&&s.hud!=='sweep'&&!s.glitch));
    assert.ok(seen.filter(([k])=>k==='camera').every(([,s])=>!s.dur));
});

test('a say step waits for the voice as well as the subtitle reading time',async()=>{
    let finish;const voice=new Promise(resolve=>{finish=resolve;});
    const g=game({voice}),id=g.film([shot,{say:'algorithm',t:'Hello {name}.'},{wait:10}]);
    const done=g.Rift.Cutscene.play(id);await settle();
    assert.equal(g.$('.cs-sub-text').textContent,'Hello Ada.');
    await g.advance(3000);assert.equal(g.Rift.Cutscene.current().closed,false);
    finish();await settle();await g.advance(10);assert.equal(await done,true);
    assert.equal(g.Rift.Cutscene.current(),null);assert.equal(g.timers.size,0);
});

test('Skip button, Escape and hold finish once and cancel timers, frames, input and voice',async()=>{
    for(const action of ['button','escape','hold']){
        const g=game(),done=g.Rift.Cutscene.play(g.film([shot,{ambience:'cutscene/cold-open'},{wait:60000}]));
        await settle();assert.equal(g.claims(),1);
        if(action==='button')g.$('.cs-skip').click();
        if(action==='escape')g.key('Escape');
        if(action==='hold'){g.$('.cutscene').dispatchEvent({type:'pointerdown'});await g.advance(901);}
        assert.equal(await done,true,action);await settle();
        assert.equal(g.claims(),0);assert.equal(g.timers.size,0);assert.equal(g.frames.size,0);
        assert.equal(g.$('.cutscene'),null);assert.equal(g.events.get('keydown').size,0);
        assert.deepEqual(g.scenes,['cutscene/cold-open',null]);
        const stopped=g.stopped();g.Rift.Cutscene.stop();assert.equal(g.stopped(),stopped);
    }
});

test('missing and broken art return false; preload is also immediately skippable',async()=>{
    const missing=game();delete missing.Rift.data.assets['scene/bedroom'];
    assert.equal(await missing.Rift.Cutscene.play('cold-open'),false);assert.equal(missing.claims(),0);
    const broken=game({brokenImages:true});
    assert.equal(await broken.Rift.Cutscene.play('cold-open'),false);assert.equal(broken.timers.size,0);
    const held=game({holdImages:true}),done=held.Rift.Cutscene.play('cold-open');
    held.key('Escape');assert.equal(await done,true);assert.equal(held.timers.size,0);
    const slow=game({holdImages:true}),timeout=slow.Rift.Cutscene.play('cold-open');await slow.advance(12000);
    assert.equal(await timeout,false);assert.equal(slow.claims(),0);
});

test('initial screen mounted notification does not skip the film; explicit navigation stop cleans it',async()=>{
    const g=game();const done=g.Rift.Cutscene.play(g.film([shot,{wait:60000}]));
    g.Rift.bus.emit('screen:changed',{name:'encounter'});await settle();
    assert.ok(g.Rift.Cutscene.current());assert.equal(g.$('.cutscene')!==null,true);
    g.Rift.Cutscene.stop();assert.equal(await done,true);assert.equal(g.timers.size,0);
});

test('an invalid timeline falls back cleanly and the player can start another film',async()=>{
    const g=game();
    assert.equal(await g.Rift.Cutscene.play(g.film([{unrecognised:true}]),{instant:true}),false);
    assert.equal(g.$('.cutscene'),null);assert.equal(g.claims(),0);
    assert.equal(await g.Rift.Cutscene.play(g.film([shot]),{instant:true}),true);
});

test('Journal replay is seen-gated, deduplicates clicks and preserves story state',async()=>{
    for(const seen of [false,true]){
        const g=game();g.state.flags['seen:prologue.cold']=seen;
        g.state.flags['seen:prologue.rift']=seen;g.state.flags['seen:ch1.gate.win']=seen;
        g.state.flags['seen:ch2.hall.win']=seen;
        g.Rift.UI.hud=()=>g.Rift.el('div');g.Rift.UI.toast=()=>{};
        g.Rift.Quests={glyph:()=>'',COLOURS:{main:'#fff',side:'#fff'},list:()=>[]};
        g.run('js/core/router.js');g.run('js/screens/journal.js');
        const root=g.document.createElement('main');g.document.body.append(root);
        g.Rift.Screens.get('journal').mount(root);
        const replay=g.$$('button').find(n=>n.textContent==='Watch the opening again');
        assert.equal(!!replay,seen);
        assert.equal(!!g.$$('button').find(n=>n.textContent==='Watch the Gate aftermath again'),seen);
        assert.equal(!!g.$$('button').find(n=>n.textContent==='Watch the Fair rupture again'),seen);
        assert.equal(!!g.$$('button').find(n=>n.textContent==='Watch the Hall aftermath again'),seen);
        if(!seen)continue;
        let end,calls=0;g.Rift.Cutscene.play=()=>{calls++;return new Promise(resolve=>{end=resolve;});};
        const before=JSON.stringify(g.state);replay.click();replay.click();assert.equal(calls,1);assert.ok(replay.disabled);
        end(true);await settle();assert.equal(replay.disabled,false);assert.equal(JSON.stringify(g.state),before);
    }
});
