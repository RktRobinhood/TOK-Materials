/* #129 expansion-15: production controls, disposable memory-only progress. */
(function(){
    'use strict';
    const CASES=['bill-outnumbered','bill-equal','bill-friend','bill-consumed','bill-empty','mark-damaged','mark-full','mark-alone','mark-empty','mark-silenced-friend'];
    const labels={'bill-outnumbered':'Bill: outnumbered','bill-equal':'Bill: equal boards','bill-friend':'Bill: friend counts','bill-consumed':'Bill: consume Shield','bill-empty':'Bill: Empty Set',
        'mark-damaged':'Mark: damaged friend','mark-full':'Mark: full-health friend','mark-alone':'Mark: no friend','mark-empty':'Mark: Empty Set','mark-silenced-friend':'Mark: silenced friend'};
    function boot(){
        const R=window.Rift,E=R.Battle.Engine,el=R.el,memory=new Map(),q=new URLSearchParams(location.search);
        R.storage=()=>({getItem:k=>memory.get(k)||null,setItem:(k,v)=>memory.set(k,String(v)),removeItem:k=>memory.delete(k)});
        R.State.newGame();R.State.update(s=>{s.avatar={type:'owlet',variant:'girl',nickname:'Expansion bench'};s.settings.music=s.settings.sfx=s.settings.voice=s.settings.ambience=0;});
        document.body.classList.toggle('calm-motion',q.get('calm')==='1');
        const team=(p,ids)=>ids.map((species,i)=>({uid:'e15-'+p+'-'+i,species,powerDelta:0,injuries:[],scars:[]}));
        function move(s,cid,zone){s.players.forEach(P=>['deck','hand','board','discard'].forEach(z=>{const i=P[z].indexOf(cid);if(i>=0)P[z].splice(i,1);}));s.players[s.cards[cid].owner][zone].push(cid);if(zone==='board')s.cards[cid].enteredTurn=0;}
        function sample(key){
            const bill='reason-axiom-ant',mark='reason-proof-beetle',consume=key==='bill-consumed',isMark=key.startsWith('mark-');
            let s=E.createBattle({seed:'expansion-15-browser-'+key,players:[{name:'You',team:team(0,consume?['beastie','proof-pup']:[isMark?mark:bill,'beastie','proof-pup']),tactics:['lemma']},
                {name:'Rival',team:team(1,[consume?bill:'beastie','paper-dragon','cloud-calf']),tactics:['lemma']}],axiomDeck:['one-action','luxury'],
                options:{first:consume?1:0,shuffle:false,shuffleAxioms:false,openHand:[0,0],openAxioms:0,spark:false,timeline:false}});
            s.phase='main';s.players.forEach(P=>{P.energy=10;P.capacity=10;P.hearts=7;});
            if(consume){
                move(s,'p0c0','board');move(s,'p0c1','board');Object.assign(s.cards.p0c0,{attack:1,health:20,generic:true,silenced:true});move(s,'p1c0','hand');
                // Real Entrance gives the Rival Bill a Shield; advance back to the native player's turn.
                s=E.applyAction(s,{type:'play',player:1,cid:'p1c0'});s=E.applyAction(s,{type:'end',player:1});
                if(s.phase==='draw'){const legal=E.legalActions(s);s=E.applyAction(s,legal.find(a=>a.choice==='none')||legal.find(a=>a.choice==='rewind')||legal[0]);}
                s.players.forEach(P=>{P.energy=10;P.capacity=10;});return s;
            }
            move(s,'p0c0','hand');move(s,'p1c0','board');
            if(key!=='bill-equal')move(s,'p1c1','board');
            if(key==='bill-friend'||(isMark&&key!=='mark-alone'))move(s,'p0c1','board');
            if(isMark&&key!=='mark-alone')s.cards.p0c1.damage=key==='mark-full'?0:3;
            if(key==='mark-silenced-friend')s.cards.p0c1.silenced=true;
            if(key.endsWith('empty'))s.axioms.active[R.data.axioms['empty-set'].category]='empty-set';
            return s;
        }
        const status=el('span.small',{role:'status'}),detail=el('output#e15-outcome',{style:{fontSize:'11px',overflowWrap:'anywhere'}});
        function check(){
            const h=R.Router.current()==='battle'&&R.Router.handle(),s=h&&h.state;if(!s){status.textContent='Memory-only acquisition sample';return;}
            status.textContent='Hearts '+s.players[0].hearts+' / '+s.players[1].hearts+' · Energy '+s.players[0].energy+' · '+s.phase;
            detail.textContent=JSON.stringify({winner:s.winner,endReason:s.endReason,turn:s.turn,active:s.active,phase:s.phase,pending:s.pending,
                players:s.players.map(p=>({hearts:p.hearts,energy:p.energy,playsThisTurn:p.playsThisTurn,attacksThisTurn:p.attacksThisTurn,hand:p.hand.slice(),deck:p.deck.slice(),board:p.board.map(cid=>({cid,...E.describe(s,cid),
                    shieldUsed:s.cards[cid].shieldUsed,canAttack:E.canAttack(s,cid),canActivate:E.canActivateNow(s,cid),buffs:s.cards[cid].buffs,damage:s.cards[cid].damage})),discard:p.discard.slice()})),events:s.lastEvents});
        }
        const pick=el('select',{'aria-label':'Expansion-15 card'});CASES.forEach(id=>pick.appendChild(el('option',{value:id,text:labels[id]})));
        function start(){R.Router.replace('battle',{mode:'practice',initialState:sample(pick.value),player:{name:'You'},opponent:{name:'Rival',ai:'normal'},onEnd:check});check();}
        const bar=el('div#e15-bar',{style:{position:'fixed',top:0,left:0,right:0,padding:'8px',zIndex:90,background:'#191726',display:'flex',flexWrap:'wrap',gap:'8px',alignItems:'center'}},[
            el('strong',{text:'Expansion-15 · memory-only save'}),pick,el('button.btn.small',{text:'Start card sample',onclick:start}),el('button.btn.small',{text:'Check outcome',onclick:check}),status,
            el('button.btn.small',{text:'Open pack sample',onclick(){
                R.State.newGame();R.State.update(s=>{s.avatar={type:'owlet',variant:'girl',nickname:'Pack bench'};R.State.grantStarter(s);s.seed=506;s.map.at='campfire';s.map.revealed=['campfire'];s.wallet.coins=120;s.settings.music=s.settings.sfx=s.settings.voice=s.settings.ambience=0;});
                R.Router.replace('map');R.UI.shop();check();
            }})]);
        document.body.append(bar,el('details',{style:{position:'fixed',bottom:0,left:0,right:0,zIndex:90,background:'#191726',maxHeight:'25vh',overflow:'auto'}},[el('summary',{text:'Scratch outcome details'}),detail]));
        const layout=()=>{document.getElementById('screen').style.top=bar.getBoundingClientRect().height+'px';};window.addEventListener('resize',layout);
        pick.value=CASES.includes(q.get('card'))?q.get('card'):CASES[0];document.title='Expansion-15 scratch battles';start();layout();
    }
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
