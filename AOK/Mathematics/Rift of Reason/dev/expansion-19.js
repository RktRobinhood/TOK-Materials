/* #129 expansion-19: production controls over disposable Map-backed progress. */
(function(){
    'use strict';
    const CASES=['derek-keep','derek-swap','derek-short','derek-empty','derek-known-keep','derek-known-swap','nikola-recover','nikola-none','nikola-burned','nikola-empty'];
    function boot(){
        const R=window.Rift,E=R.Battle.Engine,el=R.el,memory=new Map(),q=new URLSearchParams(location.search);
        R.storage=()=>({getItem:k=>memory.get(k)||null,setItem:(k,v)=>memory.set(k,String(v)),removeItem:k=>memory.delete(k)});
        R.State.newGame();R.State.update(s=>{s.avatar={type:'owlet',variant:'girl',nickname:'Expansion bench'};s.settings.music=s.settings.sfx=s.settings.voice=s.settings.ambience=0;});
        document.body.classList.toggle('calm-motion',q.get('calm')==='1');
        const team=(p,ids)=>ids.map((species,i)=>({uid:'e19-'+p+'-'+i,species,powerDelta:0,injuries:[],scars:[]}));
        function move(s,cid,zone){s.players.forEach(P=>['deck','hand','board','discard'].forEach(z=>{const i=P[z].indexOf(cid);if(i>=0)P[z].splice(i,1);}));s.players[s.cards[cid].owner][zone].push(cid);if(zone==='board')s.cards[cid].enteredTurn=0;}
        function draw(s){if(s.phase!=='draw')return s;const legal=E.legalActions(s);return E.applyAction(s,legal.find(a=>a.choice==='none')||legal.find(a=>a.choice==='rewind')||legal[0]);}
        function sample(key){
            const derek='reason-logic-lynx',nikola='memory-replay-raccoon',hank='memory-bookmark-bunny',tom='reason-premise-pigeon',isDerek=key.startsWith('derek-'),known=key.startsWith('derek-known-');
            const myTeam=isDerek?(known?[derek,tom,'beastie','proof-pup','paper-dragon']:key==='derek-short'?[derek,'beastie']:[derek,'beastie','proof-pup','paper-dragon']):[nikola,hank,tom,'proof-pup'];
            let s=E.createBattle({seed:'expansion-19-browser-'+key,players:[{name:'You',team:team(0,myTeam),tactics:[]},{name:'Rival',team:team(1,['beastie']),tactics:[]}],axiomDeck:[],
                options:{first:0,shuffle:false,shuffleAxioms:false,openHand:[0,0],openAxioms:0,spark:false,timeline:false,deckSize:myTeam.length,minCreatures:0,maxCreatures:20}});
            s.phase='main';s.players.forEach(P=>{P.energy=10;P.capacity=10;P.hearts=7;});move(s,'p1c0','board');Object.assign(s.cards.p1c0,{attack:0,health:20,silenced:true});move(s,'p0c0','hand');
            if(known){move(s,'p0c1','hand');s=E.applyAction(s,{type:'play',cid:'p0c1',player:0});}
            if(!isDerek&&key!=='nikola-none'){move(s,'p0c1','discard');move(s,'p0c2','discard');if(key==='nikola-burned'){s.cards.p0c1.burned=true;s.cards.p0c2.burned=true;}}
            if(key.endsWith('empty'))s.axioms.active.abilities='empty-set';
            s.players.forEach(P=>{P.energy=10;P.capacity=10;});return s;
        }
        const status=el('span.small',{role:'status'}),detail=el('output#e19-outcome',{style:{fontSize:'11px',overflowWrap:'anywhere'}});
        function check(){const h=R.Router.current()==='battle'&&R.Router.handle(),s=h&&h.state;if(!s){status.textContent='Memory-only acquisition sample';return;}
            status.textContent='Hearts '+s.players[0].hearts+' / '+s.players[1].hearts+' · Energy '+s.players[0].energy+' · '+s.phase;
            detail.textContent=JSON.stringify({winner:s.winner,endReason:s.endReason,turn:s.turn,active:s.active,phase:s.phase,pending:s.pending,
                players:s.players.map(p=>({hearts:p.hearts,energy:p.energy,playsThisTurn:p.playsThisTurn,monoColour:p.monoColour,hand:p.hand.slice(),deck:p.deck.slice(),handDetails:p.hand.map(cid=>({...E.describe(s,cid),nextPlayHealth:s.cards[cid].nextPlayHealth??null})),knows:p.knows.slice(),sight:(p.sight||[]).slice(),axHand:p.axHand.slice(),publicAxioms:(p.publicAxioms||[]).slice(),board:p.board.map(cid=>({cid,...E.describe(s,cid),
                    sleeping:E.isSleeping(s,cid),effects:E.activeEffects(s,cid),lastEncoreTurn:s.cards[cid].lastEncoreTurn??null,buffs:s.cards[cid].buffs,damage:s.cards[cid].damage})),discard:p.discard.slice()})),events:s.lastEvents});}
        const pick=el('select',{'aria-label':'Expansion-19 card'});CASES.forEach(id=>pick.appendChild(el('option',{value:id,text:id})));
        function start(){R.Router.replace('battle',{mode:'practice',initialState:sample(pick.value),player:{name:'You'},opponent:{name:'Rival',ai:'normal'},onEnd:check});check();}
        const bar=el('div#e19-bar',{style:{position:'fixed',top:0,left:0,right:0,padding:'8px',zIndex:90,background:'#191726',display:'flex',flexWrap:'wrap',gap:'8px',alignItems:'center'}},[
            el('strong',{text:'Expansion-19 · memory-only save'}),pick,el('button.btn.small',{text:'Start card sample',onclick:start}),el('button.btn.small',{text:'Check outcome',onclick:check}),status,
            el('button.btn.small',{text:'Open pack sample',onclick(){R.State.newGame();R.State.update(s=>{s.avatar={type:'owlet',variant:'girl',nickname:'Pack bench'};R.State.grantStarter(s);s.seed=3104;s.map.at='campfire';s.map.revealed=['campfire'];s.wallet.coins=120;s.settings.music=s.settings.sfx=s.settings.voice=s.settings.ambience=0;});R.Router.replace('map');R.UI.shop();check();}})]);
        document.body.append(bar,el('details',{style:{position:'fixed',bottom:0,left:0,right:0,zIndex:90,background:'#191726',maxHeight:'25vh',overflow:'auto'}},[el('summary',{text:'Scratch outcome details'}),detail]));
        const layout=()=>{document.getElementById('screen').style.top=bar.getBoundingClientRect().height+'px';};window.addEventListener('resize',layout);
        pick.value=CASES.includes(q.get('card'))?q.get('card'):CASES[0];document.title='Expansion-19 scratch battles';start();layout();
    }
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
