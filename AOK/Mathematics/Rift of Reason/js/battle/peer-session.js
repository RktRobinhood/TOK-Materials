/* Ordered data-channel protocol for live practice. The host alone owns engine state.
 * This module never writes a save. UI calls pump() regularly and destroys it on departure. */
(function(root){
    'use strict';
    const R=root.Rift,B=R.Battle,VERSION='peer-2',PART=5000,MAX_PARTS=32;
    function loadout(save){
        const own=R.State.ownDeck(save);if(!own||!own.check.valid)throw new Error(own?own.check.message:'Choose a deck first.');
        return {code:B.TeamCodes.exportTeam({nickname:save.avatar&&save.avatar.nickname||'Classmate',creatures:own.team,tactics:own.tactics,axioms:own.axioms,avatar:save.avatar}),
            ownAxioms:save.flags['spare-axiom']?['spare-axiom']:[]};
    }
    function create(options){
        const o=options,clock=o.now||(()=>root.performance.now()),host=o.host===true;
        let closed=false,connected=false,match=null,current=null,frame=0,lastFrame=0,parts=null,lastMessage=0,lastBeat=0,lastRevision=-1,waiting=false,blocked=false;
        const outbox=[];
        function status(text){if(o.status)o.status(text);}
        // send returns false for temporary backpressure; a throw means transport failure.
        function drain(){if(blocked||closed)return;while(outbox.length){if(o.send(outbox[0])===false){blocked=true;return;}outbox.shift();}}
        function send(value){if(outbox.length>=128)throw new Error('The connection is too slow. Start again.');outbox.push(Object.assign({v:VERSION},value));drain();}
        function stop(reason,notify){if(closed)return;closed=true;outbox.length=0;waiting=false;if(match)match.abort(reason);if(notify&&connected){try{o.send({v:VERSION,type:'leave'});}catch(e){/* Already disconnected. */}}
            if(current){current={...current,stopped:current.winner!=null?current.stopped:reason,actions:[],choices:null,decider:null,remainingMs:0};if(o.view)o.view(current);}
            parts=null;status(reason);if(o.stop)o.stop(reason);}
        function imported(data){
            if(!data||typeof data.code!=='string'||data.code.length>14000||!Array.isArray(data.ownAxioms)||data.ownAxioms.length>1||data.ownAxioms.some(id=>id!=='spare-axiom'))throw new Error('That deck cannot join live practice.');
            const team=B.TeamCodes.importTeam(data.code,{save:o.save});
            if(team.droppedTactics.length||team.lockedCards.length)throw new Error('These decks need different cards or completed lessons. Check both decks in Collection.');
            const check=R.State.validateDeck({creatures:team.team,tactics:team.tactics,axioms:team.axioms},{save:o.save});
            if(!check.valid)throw new Error(check.message);
            return {name:team.nickname,team:team.team,tactics:team.tactics,axioms:team.axioms,ownAxioms:data.ownAxioms.slice(),power:team.avatar&&R.Powers?R.Powers.forAvatar(team.avatar):null};
        }
        const own=imported(o.loadout);
        function display(view){if(o.view)o.view(view);current=view;waiting=false;}
        function publish(){
            if(!match||closed)return;const mine=match.view(0),theirs=match.view(1),text=JSON.stringify(theirs),count=Math.ceil(text.length/PART);
            if(count>MAX_PARTS)throw new Error('This board is too large to share safely. No rewards changed.');
            display(mine);lastRevision=mine.revision;const id=++frame;
            for(let part=0;part<count;part++)send({type:'view',frame:id,part,count,text:text.slice(part*PART,(part+1)*PART)});
        }
        function entropy(){const bytes=new Uint8Array(16);root.crypto.getRandomValues(bytes);return Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');}
        function open(){if(closed||connected)return;connected=true;lastMessage=lastBeat=clock();status(host?'Connected. Waiting for your partner’s deck…':'Connected. Sending your deck…');try{if(!host)send({type:'join',loadout:o.loadout});}catch(e){stop(e.message,false);}}
        function acceptView(message){
            if(!Number.isSafeInteger(message.frame)||message.frame<=lastFrame)return;
            if(!Number.isSafeInteger(message.count)||message.count<1||message.count>MAX_PARTS||!Number.isSafeInteger(message.part)||typeof message.text!=='string'||message.text.length>PART)throw new Error('Unreadable board. Start a new connection.');
            if(message.part===0){if(parts)throw new Error('An unfinished board arrived. Start again.');parts={frame:message.frame,count:message.count,text:[],started:clock()};}
            if(!parts||message.frame!==parts.frame||message.count!==parts.count||message.part!==parts.text.length)throw new Error('An incomplete board arrived. Start again.');
            parts.text.push(message.text);if(parts.text.length!==parts.count)return;
            const view=JSON.parse(parts.text.join(''));parts=null;
            const array=(value,max)=>Array.isArray(value)&&value.length<=max;
            const strings=(value,max)=>array(value,max)&&value.every(s=>typeof s==='string');
            const cards=value=>array(value,100)&&value.every(c=>c&&typeof c.cid==='string'&&typeof c.name==='string'&&(!c.keywords||strings(c.keywords,30))&&(!c.lines||(array(c.lines,30)&&c.lines.every(line=>line&&typeof line.text==='string'))));
            if(!view||view.v!==1||view.you!==1||typeof view.match!=='string'||!/^[a-f0-9]{32}$/.test(view.match)||!Number.isSafeInteger(view.revision)||view.revision<0
                ||![0,1].includes(view.active)||![0,1,null].includes(view.decider)||![0,1,'draw',null].includes(view.winner)||!Number.isSafeInteger(view.turn)||view.turn<1
                ||!Array.isArray(view.players)||view.players.length!==2||view.players.some(p=>!p||typeof p.name!=='string'||!cards(p.board)||!cards(p.discard)||!array(p.conditions,2)||p.conditions.some(c=>!c||(!c.concealed&&(typeof c.name!=='string'||typeof c.condition!=='string')))||!strings(p.publicAxioms,20)||(p.goal&&(!array(p.goal.checks,20)||p.goal.checks.some(c=>!c||typeof c.text!=='string'))))
                ||!array(view.actions,2000)||view.actions.some(a=>!a||typeof a.type!=='string')||!cards(view.hand)||view.hand.length>20||!cards(view.known)||!cards(view.armed)||!strings(view.axiomHand,20)
                ||!view.axiomCosts||typeof view.axiomCosts!=='object'||view.axiomHand.some(id=>!Number.isFinite(view.axiomCosts[id])||view.axiomCosts[id]<0)
                ||!array(view.rules,50)||!view.rules.every(pair=>strings(pair,2))||!array(view.activeAxioms,50)||view.activeAxioms.some(a=>!a||typeof a.name!=='string'||typeof a.text!=='string')
                ||!array(view.timeline,20)||view.timeline.some(t=>!t||typeof t.text!=='string')||!array(view.schedule,500)||view.schedule.some(t=>!t||typeof t.name!=='string')||!strings(view.events,12)
                ||(view.choices&&(!array(view.choices.labels,2000)||view.choices.labels.some(c=>!c)))||(view.phase==='choose'&&view.decider===1&&!view.choices)
                ||!Number.isFinite(view.remainingMs)||view.remainingMs<0||view.remainingMs>60000||view.practice!==true)throw new Error('Unreadable practice board. Start again.');
            if(current&&(view.match!==current.match||view.revision<current.revision))throw new Error('The match changed unexpectedly. Start again.');
            lastFrame=message.frame;display(view);
        }
        function receive(message){
            if(closed||!connected)return;
            try{
                if(!message||message.v!==VERSION)throw new Error('These game versions differ. Reload both pages and start again.');
                lastMessage=clock();
                if(message.type==='leave'){stop('Your partner left. No cards or rewards changed.',false);return;}
                if(message.type==='error'){stop('The other game could not start. Check both decks and reload both pages.',false);return;}
                if(message.type==='join'&&host&&!match){const remote=imported(message.loadout),id=o.id?o.id():entropy(),seed=o.seed?o.seed():entropy();match=B.PeerMatch.create(B.Engine.createBattle({seed,players:[own,remote],options:{mode:'practice'}}),{id,now:clock});publish();status('Practice started. Each turn lasts 60 seconds.');return;}
                if(message.type==='move'&&host&&match){const result=match.submit(1,message.move);publish();if(!result.ok)send({type:'notice',text:result.reason});return;}
                if(message.type==='view'&&!host){acceptView(message);return;}
                if(message.type==='notice'&&!host){status(typeof message.text==='string'?message.text.slice(0,160):'Choose again.');return;}
                if(message.type==='beat'){
                    if(!host&&current&&message.match===current.match&&message.revision===current.revision&&Number.isFinite(message.remainingMs)&&message.remainingMs>=0&&message.remainingMs<=60000){current={...current,remainingMs:message.remainingMs};if(o.clock)o.clock(message.remainingMs);}
                    return;
                }
                throw new Error('Unexpected connection step. Start again.');
            }catch(e){try{send({type:'error'});}catch(ignored){/* Connection already closed. */}stop(e.message,false);}
        }
        function move(index){
            if(closed||!current||waiting||current.stopped||current.winner!=null)return false;
            if(!Number.isSafeInteger(index)||index<0||index>=current.actions.length)return false;
            const action={v:1,match:current.match,revision:current.revision,action:index};
            try{
                if(host){const result=match.submit(0,action);publish();if(!result.ok)status(result.reason);return result.ok;}
                waiting=true;send({type:'move',move:action});status('Move sent. Waiting for the host…');return true;
            }catch(e){stop(e.message,false);return false;}
        }
        function pump(){
            if(closed||!connected)return;const time=clock();
            if(time-lastMessage>=15000){stop('Your partner stopped responding. No cards or rewards changed.',true);return;}
            if(parts&&time-parts.started>=3000){stop('The board did not finish arriving. Start again.',true);return;}
            try{
                blocked=false;drain();
                if(host&&match){match.tick();const v=match.view(0);if(v.revision!==lastRevision)publish();}
                if(time-lastBeat>=1000){lastBeat=time;const v=match?match.view(0):null;send({type:'beat',match:v?v.match:null,revision:v?v.revision:null,remainingMs:v?v.remainingMs:0});if(v&&o.clock)o.clock(v.remainingMs);}
            }catch(e){stop(e.message,true);}
        }
        return {open,receive,move,pump,close:()=>stop('You left practice. No cards or rewards changed.',true),disconnected:reason=>stop(reason||'The connection ended. No cards or rewards changed.',false)};
    }
    B.PeerSession={loadout,create,VERSION};
})(typeof window!=='undefined'?window:globalThis);
