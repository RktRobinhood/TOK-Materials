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

test('silent film notes allow reading and never request a narrator recording',async()=>{
    const g=game(),noted=[];
    const done=g.Rift.Cutscene.play(g.film([shot,{note:'LICENCE: DELETED.'}]),{onNote:text=>noted.push(text)});
    await settle();assert.equal(g.$('.cs-sub-text').textContent,'LICENCE: DELETED.');
    assert.equal(g.speech.length,0);await g.advance(100);assert.deepEqual(noted,[]);
    await g.advance(8000);assert.equal(await done,true);assert.deepEqual(noted,['LICENCE: DELETED.']);
    assert.equal(g.claims(),0);
});

test('painted sign lettering travels and fades with its physical placard',async()=>{
    const g=game();
    const done=g.Rift.Cutscene.play(g.film([
        {shot:'sign',layers:[{id:'sign',art:'item/lucky-sequin',x:800,y:450,w:200,h:100}]},
        {hud:'text',follow:'sign',x:800,y:450,w:160,h:60,label:'GUILTY',colour:'#b32738'},
        {tween:'sign',to:{y:650,opacity:0},dur:1000,wait:true},
    ]));
    await settle();await g.advance(250);
    const label=g.$('.cs-lettering'),firstTop=parseFloat(label.style.top),firstOpacity=+label.style.opacity;
    assert.equal(label.textContent,'GUILTY');assert.equal(label.style.color,'#b32738');
    await g.advance(500);assert.ok(parseFloat(label.style.top)>firstTop);assert.ok(+label.style.opacity<firstOpacity);
    await g.advance(500);assert.equal(await done,true);assert.equal(g.claims(),0);
});

test('Skip preserves an interrupted silent note and does not repeat a completed one',async()=>{
    for(const interrupt of [false,true]) {
        const g=storyGame();
        g.Rift.data.script.noteWords=[{note:'The licence disappears.'},{note:'The gallery falls silent.'}];
        g.film([shot,{conversation:'noteWords'}],'note-film');
        const play=g.Rift.Cutscene.play;
        g.Rift.Cutscene.play=(id,o)=>play(id,{...o,onNote:text=>{o.onNote(text);if(!interrupt)g.key('Escape');}});
        const done=g.Rift.Dialogue.play([{cutscene:'note-film',continuation:'noteWords'}]);await settle();
        if(interrupt)g.key('Escape');else await g.advance(20000);
        await settle();
        assert.match(g.$('.box').textContent,interrupt?/The licence disappears\./:/The gallery falls silent\./);
        await finishStory(g,done,'skip');assert.equal(g.speech.length,0);assert.equal(g.claims(),0);
    }
});

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
    g.run('data/script/lesson3.js');
    g.run('data/script/lesson4.js');
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

function trialGame(type='owlet',variant='girl',tier=1,bargain) {
    const g=storyGame(type,variant),n=[0,1,4,6,8][tier];
    Object.assign(g.state.flags,{'dead:sundial':tier===4,
        'stakes.ch3':tier===4?4:undefined,'clock:ch3':{n,size:8,started:true,done:tier===4,tier:tier===4?4:null,paused:bargain==='yes'},
        'seen:prologue.wake':true,'seen:prologue.evening':true,'seen:ch1.night':true,
        'seen:ch2.clockmaker':true,'seen:ch3.cafe':true});
    if(bargain!==undefined)g.state.flags.bargain=bargain;
    g.state.chapter='ch3';g.state.settings.charactersCanDie=true;
    return g;
}
function trialPresentation(g,mode='complete') {
    const events=[],trace=[],speak=g.Rift.Audio.speak,play=g.Rift.Cutscene.play;
    g.Rift.Audio.speak=line=>{events.push({kind:'say',speaker:line.speaker,text:line.text});return speak(line);};
    if(mode==='unavailable')g.Rift.Cutscene=null;
    else if(mode==='failed')g.Rift.Cutscene.play=async()=>false;
    else g.Rift.Cutscene.play=(id,o)=>play(id,{...o,onStep:(kind,s)=>trace.push([kind,s]),
        onNote:note=>{events.push({kind:'note',text:note});if(o.onNote)o.onNote(note);}});
    return {events,trace};
}
async function finishTrial(g,promise,mode='complete',events=[],wrongFirst=false) {
    let done=false,choices=0;promise.then(()=>{done=true;});
    for(let guard=0;guard<300&&!done;guard++) {
        await settle();
        if(g.Rift.Cutscene?.current()) {
            if(mode==='skip')g.key('Escape');else await g.advance(20000);
        } else if(g.$('.choices button')) {
            const options=g.$$('.choices button');
            const pick=wrongFirst&&choices===0?options.find(b=>b.textContent.includes('I HAVE THE BEST SHADOW')):
                options.find(b=>b.textContent.includes('I TOOK IT AT A FAIR'));
            assert.ok(pick,'the accepted evidence remains an actual choice');pick.click();choices++;
        } else if(g.$('.box')) {
            const note=g.$('.stage-note .text');
            if(note)events.push({kind:'note',text:note.textContent});
            g.$('.box').click();
        }
    }
    assert.ok(done,'the Tribunal ending completes');await promise;return choices;
}

test('Tribunal replay is save-free for all ten avatars, frames whole figures and voices no silent court record',async()=>{
    const voices=new Set(voiceCatalog().lines.map(l=>l.who+':'+l.text));
    for(const type of ['owlet','mothkin','fox','frogling','raven'])for(const variant of ['boy','girl'])
        for(const tier of [1,2,3,4]) {
            const g=trialGame(type,variant,tier);g.state.flags['stakes.ch3']=tier;
            const before=JSON.stringify(g.state),p=g.Rift.Cutscene.plan('tribunal-aftermath');
            assert.equal(JSON.stringify(g.state),before);
            const notes=p.steps.filter(s=>s.note),says=p.steps.filter(s=>s.say);
            assert.ok(notes.length>=3);for(const s of says)assert.ok(voices.has(s.say+':'+s.t),'canonical '+s.say+':'+s.t);
            if(tier===4)assert.ok(says.every(s=>s.say!=='narrator'));
            const main=p.steps.find(s=>s.shot==='the-verdict');
            const licence=p.steps.find(s=>s.line==='ch3.trial.licence');
            assert.equal(licence.during.some(s=>s.art==='cutscene/fin-tie'),tier!==4,'nested line animations honour outcome conditions');
            assert.equal(main.layers.some(l=>l.id==='sundial'),tier!==4);
            assert.equal(main.layers.filter(l=>l.id==='exhibit').length,1,'only the returning third piece is shown');
            for(const s of p.steps)for(const l of s.layers||[]) {
                if(l.cover)continue;
                const at=g.Rift.Cutscene.project(s.camera||{x:800,y:450,zoom:1},l);
                assert.ok(at.sx-l.w*at.S/2>=0&&at.sx+l.w*at.S/2<=1600,l.id+' fits horizontally');
                assert.ok(at.sy-l.h*at.S/2>=0&&at.sy+l.h*at.S/2<=760,l.id+' is wholly above captions');
            }
            assert.ok(p.steps.every(s=>!s.flag&&!s.clock&&!s.give&&!s.choice));
        }
});

test('Tribunal films preserve the different living/dead event order and reward across completion, Skip and failure',async()=>{
    for(const type of ['fox','frogling'])for(const tier of [1,2,3,4])for(const mode of ['complete','skip','unavailable','failed']) {
        const g=trialGame(type,type==='fox'?'boy':'girl',tier),{events,trace}=trialPresentation(g,mode);
        assert.equal(await finishTrial(g,g.Rift.Dialogue.play('ch3.trial.win'),mode,events),1);
        assert.equal(g.state.flags['stakes.ch3'],tier);assert.equal(g.state.items['hoots-gavel']||0,tier===1?1:0);
        assert.equal(!!g.state.flags['hoots-gavel'],tier===1);assert.equal(g.state.flags['trial-evidence'],true);
        assert.equal(g.state.flags['seen:ch3.trial.win'],true);
        const pos=snippet=>events.findIndex(e=>e.text.includes(snippet));
        const verdict=pos(tier===4?'The arguments failed.':'Case dismissed.');
        const fin=pos('The vault never opens.'),licence=pos('LICENCE: DELETED.'),algorithm=pos(tier===4?'VERDICT: EXECUTED.':'verdict rejected.');
        const piece=pos(tier===4?'It is cold.':'Exhibit A leaves its glass case.');
        const inner=pos(type==='fox'?'He was the villain in my story.':'"A case he wanted to win."');
        const gallery=pos(tier===4?'The GUILTY counter peaks.':'In the gallery, the GUILTY signs');
        assert.ok(verdict>=0&&fin>verdict&&licence>fin&&algorithm>licence);
        if(tier===4) {
            assert.ok(piece>algorithm&&inner>piece&&gallery>inner&&pos('Why is nobody cheering?')>gallery);
            assert.ok(events.slice(verdict).every(e=>e.kind!=='say'||e.speaker!=='narrator'));
        } else assert.ok(piece>verdict&&piece<fin&&gallery>algorithm&&inner>gallery&&pos('Was he right?')>inner);
        for(const n of events.filter(e=>e.kind==='note'))assert.ok(g.speech.every(s=>s.text!==n.text),'notes stay silent');
        assert.equal(events.filter(e=>e.text.startsWith('The vault never opens.')).length,1);
        assert.equal(g.claims(),0);
        if(mode==='complete')assert.ok(trace.some(([,s])=>s.shot==='the-verdict'));
    }
});

test('Tribunal bargain, refusal and no-death brink preserve the real outcome without inventing pocket pieces',async()=>{
    for(const bargain of ['yes','no',undefined]) {
        const g=trialGame('raven','boy',2,bargain),{events}=trialPresentation(g,'skip');
        await finishTrial(g,g.Rift.Dialogue.play('ch3.trial.win'),'skip',events);
        assert.equal(g.state.flags.bargain,bargain);assert.equal(g.state.flags['clock:ch3'].paused,bargain==='yes');
        assert.equal(g.state.flags['stakes.ch3'],2);assert.equal(g.state.flags['dead:sundial'],false);
        const p=g.Rift.Cutscene.plan('tribunal-aftermath');
        assert.equal(p.steps.find(s=>s.shot==='the-verdict').layers.filter(l=>l.id==='exhibit').length,1);
        assert.ok(events.some(e=>e.text.includes('CONTROVERSIAL.')));
    }
    const g=trialGame('owlet','girl',3);g.state.flags['clock:ch3'].n=8;
    g.state.settings.charactersCanDie=false;const {events}=trialPresentation(g,'skip');
    await finishTrial(g,g.Rift.Dialogue.play('ch3.trial.win'),'skip',events);
    assert.equal(g.state.flags['stakes.ch3'],3);assert.equal(!!g.state.flags['dead:sundial'],false);
    assert.ok(events.some(e=>e.text==='The adverts end. The sentence never starts.'));
    assert.ok(events.some(e=>e.text.startsWith('One screen keeps playing it:')));
    assert.ok(events.every(e=>!e.text.startsWith('VERDICT: EXECUTED.')));
});

test('a wrong final evidence pick can still kill the Sundial before the film and retains the correct late order',async()=>{
    const g=trialGame('fox','boy',3);g.state.flags['clock:ch3'].n=7;
    const {events}=trialPresentation(g,'skip');
    assert.equal(await finishTrial(g,g.Rift.Dialogue.play('ch3.trial.win'),'skip',events,true),2);
    assert.equal(g.state.flags['dead:sundial'],true);assert.equal(g.state.flags['stakes.ch3'],4);
    assert.equal(g.state.flags['clock:ch3'].n,8);assert.equal(g.state.flags['quiet:sundial'],'pending');
    assert.equal(g.state.items['hoots-gavel'],undefined);
    const at=snippet=>events.findIndex(e=>e.text.includes(snippet));
    assert.ok(at('On cloudy days I gu—')<at('The arguments failed.'));
    assert.ok(at('The arguments failed.')<at('I bet with its life. I lost.'));
    assert.ok(at('VERDICT: EXECUTED.')<at('It is cold.'));
});

test('Tribunal navigation during either film grants no gavel and re-entry never repeats accepted evidence or danger',async()=>{
    for(const [tier,stopAt] of [[1,'tribunal-verdict'],[4,'tribunal-empty-gallery']]) {
        const g=trialGame('fox','boy',tier),play=g.Rift.Cutscene.play;let arrived=false;
        g.Rift.Cutscene.play=(id,o)=>{if(id===stopAt)arrived=true;return play(id,{...o,instant:id!==stopAt});};
        g.Rift.Dialogue.play('ch3.trial.win');
        for(let guard=0;guard<150&&!arrived;guard++) {
            await settle();
            if(g.$('.choices button'))g.$$('.choices button').find(b=>b.textContent.includes('I TOOK IT AT A FAIR')).click();
            else if(g.$('.box'))g.$('.box').click();
        }
        assert.ok(arrived);await settle();assert.ok(g.Rift.Cutscene.current());
        g.Rift.Dialogue.abortAll();await settle();
        assert.equal(g.state.flags['seen:ch3.trial.win'],undefined);assert.equal(g.state.items['hoots-gavel'],undefined);
        assert.equal(g.state.flags['trial-evidence'],true);const danger=g.state.flags['clock:ch3'].n;
        g.Rift.Cutscene.play=(id,o)=>play(id,{...o,instant:true});
        assert.equal(await finishTrial(g,g.Rift.Dialogue.play('ch3.trial.win')),0);
        assert.equal(g.state.flags['clock:ch3'].n,danger);
        assert.equal(g.state.items['hoots-gavel']||0,tier===1?1:0);
        assert.equal(g.state.flags['seen:ch3.trial.win'],true);assert.equal(g.claims(),0);
    }
});

const CORE_QUESTIONS={believe:'Why do people believe you?',noclicks:'What happens if nobody clicks?',
    premises:'What are your premises?',light:'What\'s behind all that light?',small:'What if you\'re small?',
    before:'What were you before?',know:'What do you mean by "know"?'};
const CORE_PERSONAL={owlet:'premises',mothkin:'light',fox:'small',frogling:'before',raven:'know'};
const CORE_FATES={home:'Take it home.',off:'Switch it off.',left:'Label it. Leave it running.'};
test('silent film notes use the court default, a Core definition label or an explicit step override',async()=>{
    for(const [definition,override,expected] of [[undefined,undefined,'COURT RECORD'],['THE CORE',undefined,'THE CORE'],['THE CORE','A MEMORY','A MEMORY']]) {
        const g=game(),id=g.film([shot,{note:'A quiet beat.',...(override?{label:override}:{})}]);
        if(definition)g.Rift.data.cutscenes[id].noteLabel=definition;
        const done=g.Rift.Cutscene.play(id);await settle();
        assert.equal(g.$('.cs-sub-name').textContent,expected);assert.equal(g.speech.length,0);
        g.key('Escape');assert.equal(await done,true);
    }
});
function coreGame(type='owlet',variant='girl',tier=1) {
    const g=storyGame(type,variant),n=[0,1,4,6,8][tier];g.state.chapter='ch4';
    Object.assign(g.state.flags,{'stakes.ch4':tier,'clock:copy':{n,size:8,started:true,done:true,tier,paused:false},
        'voice.offered':2,'voice.followed':1});
    return g;
}
async function finishCore(g,promise,mode='complete',events=[],wonder='believe',fate='home') {
    let done=false;const choices=[];promise.then(()=>{done=true;});
    for(let guard=0;guard<400&&!done;guard++) {
        await settle();
        if(g.Rift.Cutscene?.current()) {
            if(mode==='skip')g.key('Escape');else await g.advance(20000);
        } else if(g.$('.choices button')) {
            const options=g.$$('.choices button');assert.equal(options.length,3,'two shared and one personal question, or three fates');
            const isFate=options.some(b=>b.textContent===CORE_FATES.home);
            const wanted=isFate?CORE_FATES[fate]:CORE_QUESTIONS[wonder];
            const pick=options.find(b=>b.textContent.includes(wanted));assert.ok(pick,'personal choice stays available: '+wanted);
            choices.push(wanted);pick.click();
        } else if(g.$('.box')) {
            const note=g.$('.stage-note .text');if(note)events.push({kind:'note',text:note.textContent});
            g.$('.box').click();
        }
    }
    assert.ok(done,'the Core ending completes');await promise;return choices;
}

test('Core replay uses chosen avatar Copies for all ten avatars and resolved tiers without mutating clocks or saves',()=>{
    const voices=new Set(voiceCatalog().lines.map(l=>l.who+':'+l.text));
    for(const type of ['owlet','mothkin','fox','frogling','raven'])for(const variant of ['boy','girl'])for(const tier of [1,2,3,4]) {
        const g=coreGame(type,variant,tier);
        Object.assign(g.state.flags,{wonder:CORE_PERSONAL[type],fate:'home'});
        const before=JSON.stringify(g.state),p=g.Rift.Cutscene.plan('core-aftermath');
        assert.equal(JSON.stringify(g.state),before);assert.equal(p.def.noteLabel,'THE CORE');
        const copyShot=p.steps.find(s=>s.shot==='the-last-copy'),copy=copyShot.layers.find(l=>l.id==='copy');
        assert.equal(copy.art,'avatar/'+type+'-'+variant+'/idle');assert.equal(copy.opacity,tier===4?1:0.65);
        assert.equal(copyShot.layers.some(l=>l.id==='hat'),tier===1);assert.equal(copyShot.layers.some(l=>l.id==='die'),tier===2);
        const open=p.steps.find(s=>s.shot==='no-applause'),young=open.layers.find(l=>l.id==='young-box'),old=open.layers.find(l=>l.id==='old-box');
        const companion=open.layers.find(l=>l.id==='sundial');
        assert.ok(Math.abs(young.y+young.h/2-700)<1&&Math.abs(old.y+old.h/2-700)<1,'both boxes stand on the floor');
        assert.ok(young.x+young.w/2<companion.x-companion.w/2,'young box clears companion silhouette');
        assert.equal(open.layers.find(l=>l.id==='room').bright,0.55);
        for(const s of p.steps)for(const l of s.layers||[]) {
            if(l.cover)continue;const at=g.Rift.Cutscene.project(s.camera||{x:800,y:450,zoom:1},l);
            assert.ok(at.sx-l.w*at.S/2>=0&&at.sx+l.w*at.S/2<=1600,l.id+' fits horizontally');
            assert.ok(at.sy-l.h*at.S/2>=0&&at.sy+l.h*at.S/2<=760,l.id+' fits above captions');
        }
        for(const s of p.steps.filter(s=>s.say))assert.ok(voices.has(s.say+':'+s.t),'canonical Core voice '+s.say+':'+s.t);
        assert.ok(p.steps.every(s=>!s.clock&&!s.flag&&!s.give&&!s.choice));
        if(tier>=3){const speech=p.steps.findIndex(s=>s.say==='copy');const exit=p.steps.findIndex(s=>s.note?.includes('gets home first.'));assert.ok(speech>=0&&exit>speech);}
    }
});

test('Core completion, Skip and unavailable/error films preserve both decisions, species response and resolved stakes',async()=>{
    for(const type of ['owlet','mothkin','fox','frogling','raven'])for(const tier of [1,2,3,4])for(const mode of ['complete','skip','unavailable','failed']) {
        const g=coreGame(type,type==='fox'?'boy':'girl',tier),{events,trace}=trialPresentation(g,mode);
        const clock=JSON.stringify(g.state.flags['clock:copy']);
        const choices=await finishCore(g,g.Rift.Dialogue.play('ch4.core.win'),mode,events,CORE_PERSONAL[type],'home');
        assert.deepEqual(choices,[CORE_QUESTIONS[CORE_PERSONAL[type]],CORE_FATES.home]);
        assert.equal(g.state.flags.wonder,CORE_PERSONAL[type]);assert.equal(g.state.flags.fate,'home');
        assert.equal(g.state.flags['finale-open'],true);assert.equal(g.state.flags['seen:ch4.core.win'],true);
        assert.equal(g.state.flags['stakes.ch4'],tier);assert.equal(JSON.stringify(g.state.flags['clock:copy']),clock);
        assert.equal(!!g.state.flags['keepsake:copy-hat'],tier===1);assert.equal(g.state.flags['rift-walker'],undefined);
        assert.equal(events.filter(e=>e.text==='PROBABLY.').length,1);
        const pos=text=>events.findIndex(e=>e.text.startsWith(text));
        const inner={owlet:'You counted. You never checked.',mothkin:'Shh. It\'s tiny.',fox:'It didn\'t hate me.',frogling:'You counted a few things',raven:'You said "know".'}[type];
        assert.ok(pos(inner)>pos('The two little boxes'));
        assert.ok(pos('People clapped when I was right.')>pos(inner));
        assert.ok(pos('Home?')>pos('May I… stay small'));
        assert.ok(pos('Tick. Tock. Ah.')>pos('Home?'));
        assert.ok(events.some(e=>e.kind==='note'&&e.text.includes('Could a different model do better?')));
        const qualification=events.findIndex(e=>e.kind==='note'&&e.text.endsWith('Could a different model do better?'));
        assert.ok(qualification>=0&&events[qualification+1].text==='The colossus cracks open.');
        if(mode==='complete')assert.ok(trace.some(([,s])=>s.shot==='the-shell'));
        assert.equal(g.claims(),0);
    }
});

test('every Core question, all three fates and data-count answers retain their exact canonical responses',async()=>{
    const answers={believe:'I sounded sure. That was all.',noclicks:'…I get quiet. Like now.',premises:'Just one. "People clap for sure." It was false.',
        light:'This. A box with one sequin.',small:'I am. I always was.',before:'A toy. On a stall. Saying "probably".',know:'"Know" was the word they clapped for.'};
    for(const wonder of Object.keys(CORE_QUESTIONS))for(const fate of Object.keys(CORE_FATES)) {
        const type=Object.keys(CORE_PERSONAL).find(k=>CORE_PERSONAL[k]===wonder)||'owlet';
        const g=coreGame(type,'girl',3),{events}=trialPresentation(g,'skip');
        await finishCore(g,g.Rift.Dialogue.play('ch4.core.win'),'skip',events,wonder,fate);
        assert.ok(events.some(e=>e.text===answers[wonder]));assert.equal(g.state.flags.fate,fate);
        assert.equal(events.filter(e=>e.text==='Home? …I had one once. On a stall.').length,fate==='home'?1:0);
        assert.equal(events.filter(e=>e.text==='It goes dark. You carry the box. It is lighter than it looked.').length,fate==='off'?1:0);
        assert.equal(events.filter(e=>e.text==='probably.').length,fate==='left'?1:0);
        const plan=g.Rift.Cutscene.plan('core-chosen-fate');
        assert.equal(plan.steps.some(s=>s.set==='old-box'&&s.bright===0.12)||plan.steps.some(s=>s.tween==='old-box'&&s.to.bright===0.12),fate==='off');
        assert.equal(plan.steps.some(s=>s.hud==='text'&&s.label==='IT GUESSES'),fate==='left');
    }
    for(const [n,word] of [[1,'One data point.'],[2,'Two data points.'],[9,'Nine data points.'],[10,'A handful of data points.']]) {
        const g=coreGame();g.state.flags['voice.offered']=n;
        assert.ok(g.Rift.Cutscene.conversation('ch4.core.confession').some(s=>s.t?.includes(word)));
    }
});

test('Core bargain voices and final shadows obey life, death and understudy arrival without resurrection',async()=>{
    for(const companion of ['alive','bargain','silent','kuku']) {
        const g=coreGame('raven','boy',4);Object.assign(g.state.flags,{wonder:'know',fate:'left'});
        if(companion==='bargain')g.state.flags.bargain='yes';
        if(companion==='silent'||companion==='kuku')g.state.flags['dead:sundial']=true;
        if(companion==='kuku')g.state.flags['arrived:sundial']=true;
        g.state.flags['dead:sequins']=true;
        const p=g.Rift.Cutscene.plan('core-aftermath'),copy=p.steps.find(s=>s.say==='copy'||s.say==='copy-sundial');
        assert.equal(copy.say,companion==='bargain'?'copy-sundial':'copy');
        const fate=p.steps.find(s=>s.shot==='the-small-decision'),shadow=fate.layers.find(l=>l.id==='restored-shadow');
        assert.equal(fate.layers.some(l=>l.id==='sundial'),companion==='alive'||companion==='bargain');
        assert.equal(fate.layers.some(l=>l.id==='kuku'),companion==='kuku');
        const young=fate.layers.find(l=>l.id==='young-box'),kuku=fate.layers.find(l=>l.id==='kuku');
        if(kuku)assert.ok(young.x+young.w/2<kuku.x-kuku.w/2,'Kuku never overlaps the young box');
        if(companion==='alive'||companion==='bargain')assert.equal(shadow.art,companion==='bargain'?'cutscene/sundial-half-shadow':'cutscene/sundial-shadow');
        else assert.equal(shadow,undefined);
        const {events}=trialPresentation(g,'skip');await finishCore(g,g.Rift.Dialogue.play('ch4.core.win'),'skip',events);
        if(companion==='silent'||companion==='kuku')assert.ok(g.speech.every(s=>s.speaker!=='narrator'));
        assert.equal(g.speech.filter(s=>s.speaker==='kuku').length,companion==='kuku'?1:0);
        assert.ok(events.some(e=>e.text==='Professor Sequins taught me "probably". I took him to un-learn it. …It didn\'t work.'));
        assert.equal(!!g.state.flags['dead:sundial'],companion==='silent'||companion==='kuku');
    }
});

test('Core navigation before or after either accepted decision cannot reopen a completed choice or unlock the Fair early',async()=>{
    for(const stopAt of ['core-copy-outcome','core-revelation','core-confession','core-chosen-fate']) {
        const g=coreGame('fox','boy',3),play=g.Rift.Cutscene.play;let arrived=false;
        const clock=JSON.stringify(g.state.flags['clock:copy']);
        g.Rift.Cutscene.play=(id,o)=>{if(id===stopAt)arrived=true;return play(id,{...o,instant:id!==stopAt});};
        g.Rift.Dialogue.play('ch4.core.win');
        for(let guard=0;guard<180&&!arrived;guard++) {
            await settle();
            if(g.$('.choices button')) {
                const opts=g.$$('.choices button'),isFate=opts.some(b=>b.textContent===CORE_FATES.home);
                opts.find(b=>b.textContent.includes(isFate?CORE_FATES.off:CORE_QUESTIONS.small)).click();
            } else if(g.$('.box'))g.$('.box').click();
        }
        assert.ok(arrived);await settle();assert.ok(g.Rift.Cutscene.current());g.Rift.Dialogue.abortAll();await settle();
        assert.equal(g.state.flags['finale-open'],undefined);assert.equal(g.state.flags['seen:ch4.core.win'],undefined);
        const acceptedWonder=g.state.flags.wonder,acceptedFate=g.state.flags.fate;
        g.Rift.Cutscene.play=(id,o)=>play(id,{...o,instant:true});
        const choices=await finishCore(g,g.Rift.Dialogue.play('ch4.core.win'),'complete',[],'small','off');
        assert.equal(choices.includes(CORE_QUESTIONS.small),acceptedWonder===undefined);
        assert.equal(choices.includes(CORE_FATES.off),acceptedFate===undefined);
        assert.equal(g.state.flags.wonder,'small');assert.equal(g.state.flags.fate,'off');
        assert.equal(g.state.flags['finale-open'],true);assert.equal(JSON.stringify(g.state.flags['clock:copy']),clock);
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
        g.state.flags['seen:ch3.trial.win']=seen;
        g.state.flags['seen:ch4.core.win']=seen;
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
        assert.equal(!!g.$$('button').find(n=>n.textContent==='Watch the Tribunal aftermath again'),seen);
        assert.equal(!!g.$$('button').find(n=>n.textContent==='Watch the Core revelation again'),seen);
        if(!seen)continue;
        let end,calls=0;g.Rift.Cutscene.play=()=>{calls++;return new Promise(resolve=>{end=resolve;});};
        const before=JSON.stringify(g.state);replay.click();replay.click();assert.equal(calls,1);assert.ok(replay.disabled);
        end(true);await settle();assert.equal(replay.disabled,false);assert.equal(JSON.stringify(g.state),before);
    }
});
