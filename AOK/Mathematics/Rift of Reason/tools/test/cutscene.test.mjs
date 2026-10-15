import test from 'node:test';
import assert from 'node:assert/strict';
import {loadWithDom} from './fake-dom.mjs';

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

test('older seen openings keep their greeting and a completed new film does not repeat it',async()=>{
    for(const seen of [false,true]){
        const g=game();dialogue(g);g.run('data/script/lesson1.js');
        g.state.flags['seen:prologue.cold']=seen;
        g.Rift.Story.test=condition=>!!g.state.flags['seen:'+condition.seen];
        let films=0;
        const greeting=g.Rift.data.script['prologue.greeting'];
        g.Rift.Cutscene={has:()=>true,stop(){},play:async(id,options)=>{
            films++;greeting.forEach(line=>options.onSpoken({speaker:line.s,text:line.t}));return true;
        }};
        const opening=g.Rift.data.script['prologue.wake'][0];
        const done=g.Rift.Dialogue.play([opening,{flag:'awake'}]);
        await settle();
        for(let guard=0;guard<4&&g.$('.box');guard++){g.$('.box').click();await settle();}
        await done;assert.equal(films,seen?0:1);
        assert.equal(g.speech.length,seen?2:0);assert.equal(g.state.flags.awake,true);
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

test('all ten avatars complete the real timeline, speak the exact recorded keys and never change the save',async()=>{
    for(const type of ['owlet','mothkin','fox','frogling','raven'])for(const variant of ['boy','girl']){
        const g=game(),before=JSON.stringify(g.state),trace=[];
        const ok=await g.Rift.Cutscene.play('cold-open',{player:{type,variant,nickname:'Ada'},instant:true,onStep:(kind,s)=>trace.push([kind,s])});
        assert.equal(ok,true,type+' '+variant);assert.equal(JSON.stringify(g.state),before);
        assert.equal(g.speech.length,3);assert.match(g.speech[0].text,/SUBJECT: Ada/);assert.match(g.speech[0].voice,/\{name\}/);
        assert.match(g.speech[1].text,/Good morning, Ada/);assert.match(g.speech[2].text,/I'm the Sundial/);
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
        assert.deepEqual(g.scenes,['scene/fair','cutscene/cold-open','scene/fair',null]);
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
        g.Rift.UI.hud=()=>g.Rift.el('div');g.Rift.UI.toast=()=>{};
        g.Rift.Quests={glyph:()=>'',COLOURS:{main:'#fff',side:'#fff'},list:()=>[]};
        g.run('js/core/router.js');g.run('js/screens/journal.js');
        const root=g.document.createElement('main');g.document.body.append(root);
        g.Rift.Screens.get('journal').mount(root);
        const replay=g.$$('button').find(n=>n.textContent==='Watch the opening again');
        assert.equal(!!replay,seen);
        if(!seen)continue;
        let end,calls=0;g.Rift.Cutscene.play=()=>{calls++;return new Promise(resolve=>{end=resolve;});};
        const before=JSON.stringify(g.state);replay.click();replay.click();assert.equal(calls,1);assert.ok(replay.disabled);
        end(true);await settle();assert.equal(replay.disabled,false);assert.equal(JSON.stringify(g.state),before);
    }
});
