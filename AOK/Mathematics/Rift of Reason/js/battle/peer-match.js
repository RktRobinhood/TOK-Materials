/* Practice match authority and recipient views. No network or adventure-save access.
 * The host is trusted to run the rules. A guest receives views, never engine state. */
(function(root){
    'use strict';
    const R=root.Rift,B=R.Battle,E=B.Engine,TURN_MS=60000;
    const copy=value=>JSON.parse(JSON.stringify(value));
    function fields(value,names){const out={};names.forEach(key=>{if(value[key]!==undefined)out[key]=value[key];});return copy(out);}
    function project(s,viewer){
        if(viewer!==0&&viewer!==1)throw new Error('Unknown player.');
        const mine=s.players[viewer],decider=E.decider(s);
        function publicAxioms(p){const known=(p.publicAxioms||[]).slice();return p.axHand.filter(id=>{const at=known.indexOf(id);if(at<0)return false;known.splice(at,1);return true;});}
        function goal(p){const g=E.goalProgress(s,p);return g?{id:g.id,name:g.name,complete:g.complete,checks:g.checks.map(c=>({text:c.text,met:c.met}))}:null;}
        function card(cid){
            const d=E.describe(s,cid),out=fields(d,['cid','kind','id','species','name','colour','cost','attack','health','maxHealth','keywords','sleeping','frozen','silenced','canAttack','hidden','attacks','activated']);
            out.text=d.text||'';out.lines=(d.lines||[]).map(line=>fields(line,['name','text','kind','off','cost']));return out;
        }
        const actions=decider===viewer?E.legalActions(s):[];
        const choices=decider===viewer&&s.phase==='choose'?{
            prompt:s.pending.prompt||'Choose one.',
            labels:actions.map(a=>({value:a.choice,label:String((s.pending.labels||{})[a.choice]||a.choice),card:s.cards[a.choice]?card(a.choice):null}))
        }:null;
        return {
            v:1,you:viewer,turn:s.turn,round:s.round,active:s.active,decider,phase:s.phase,winner:s.winner,endReason:s.endReason,
            players:s.players.map((p,i)=>({
                name:p.name,hearts:p.hearts,maxHearts:p.maxHearts,energy:p.energy,capacity:p.capacity,monoColour:p.monoColour,
                deckCount:p.deck.length,handCount:p.hand.length,axiomCount:p.axHand.length,publicAxioms:publicAxioms(p),
                uses:Number.isFinite(E.playsLeft(s,i))?E.playsLeft(s,i):null,unlimitedUses:!Number.isFinite(E.playsLeft(s,i)),spark:p.spark,
                board:p.board.map(card),discard:p.discard.map(card),conditions:copy(E.armedView(s,i,viewer)),goal:goal(i),
                power:p.power?fields(E.powerStatus(s,i),['id','name','text','cost','heartCost','turnsLeft','ready','usable','why','note']):null
            })),
            hand:mine.hand.map(card),axiomHand:mine.axHand.slice(),axiomCosts:Object.fromEntries(mine.axHand.map(id=>[id,E.axiomCost(s,id,viewer)])),armed:(mine.armed||[]).map(card),
            known:mine.knows.filter(cid=>s.players[1-viewer].hand.includes(cid)).map(card),
            choices,actions:copy(actions),rules:E.ruleSummary(s).map(pair=>pair.slice()),
            activeAxioms:E.activeAxioms(s).map(ax=>fields(ax,['id','name','category','text'])),
            axiomDeckCount:s.axioms.deck.length,axiomDiscard:s.axioms.discard.slice(),
            timeline:copy(E.timeline(s)),schedule:E.fateSchedule(s).map(ev=>fields(ev,['id','def','name','summary','text','controller','state','live','repeat','spaces','rounds','turns','fires','target','targetName'])),
            events:E.fullLog(s).map(ev=>ev.privateTo==null||ev.privateTo===viewer?ev.text:ev.publicText).filter(text=>typeof text==='string').slice(-12)
        };
    }
    function create(initial,options){
        const o=options||{},clock=o.now||(()=>root.performance.now());
        if(!initial||initial.players.length!==2||initial.options.mode!=='practice'
            ||initial.players.some(p=>p.bag.length||Object.values(p.consumables).some(Boolean)))throw new Error('Live practice cannot spend adventure items.');
        if(typeof o.id!=='string'||!/^[a-f0-9]{32}$/.test(o.id))throw new Error('A match needs a fresh connection identity.');
        let s=initial,revision=0,last=clock(),deadline=last+TURN_MS,stopped=null;
        function now(){const sample=clock();if(!Number.isFinite(sample))throw new Error('The match clock stopped.');last=Math.max(last,sample);return last;}
        function done(){return stopped!==null||s.winner!=null;}
        function abort(reason){if(done())return;stopped=reason||'Connection ended. No cards or rewards changed.';revision++;}
        function apply(action,time){const turn=s.turn;s=E.applyAction(s,action);revision++;if(s.turn!==turn)deadline=time+TURN_MS;}
        function settle(time){
            if(done()||time<deadline)return false;
            const turn=s.turn;
            // Resolve mandatory menus deterministically, then end the expired turn legally.
            // A reaction never buys more time. A background host grants the NEXT turn a full minute.
            for(let steps=0;!done()&&s.turn===turn;steps++){
                if(steps>=128){abort('The turn could not finish safely. No cards or rewards changed.');break;}
                const legal=E.legalActions(s);
                const action=s.phase==='main'?legal.find(a=>a.type==='end'):legal[0];
                if(!action){abort('The turn could not finish safely. No cards or rewards changed.');break;}
                apply(action,time);
            }
            return true;
        }
        function tick(){return settle(now());}
        function submit(sender,message){
            const time=now();settle(time);
            if(done())return {ok:false,reason:'This practice match has ended.'};
            if(sender!==0&&sender!==1)return {ok:false,reason:'Unknown player.'};
            if(!message||message.v!==1||message.match!==o.id||message.revision!==revision)return {ok:false,reason:'The board changed. Choose again.'};
            if(sender!==E.decider(s))return {ok:false,reason:'Wait for your turn.'};
            const legal=E.legalActions(s),index=message.action;
            if(!Number.isSafeInteger(index)||index<0||index>=legal.length)return {ok:false,reason:'Choose a move shown on this board.'};
            apply(legal[index],time);return {ok:true};
        }
        function view(viewer){const time=now();settle(time);const out=Object.assign(project(s,viewer),{
            match:o.id,revision,remainingMs:done()?0:Math.max(0,deadline-time),stopped,
            practice:true,settlement:'No cards, items, coins or rewards change.'
        });if(done()){out.actions=[];out.choices=null;out.decider=null;}return out;}
        return {view,submit,tick,abort};
    }
    B.PeerMatch={project,create,TURN_MS};
})(typeof window!=='undefined'?window:globalThis);
