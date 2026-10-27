/* #129 expansion-18: production controls over disposable Map-backed progress. */
(function(){
    'use strict';
    const CASES=['emma-held','emma-none','emma-empty','emma-duplicate','emma-mercy','sabrina-held','sabrina-spent','sabrina-enter-empty','sabrina-reset','sabrina-capped'];
    function boot(){
        const R=window.Rift,E=R.Battle.Engine,el=R.el,memory=new Map(),q=new URLSearchParams(location.search);
        R.storage=()=>({getItem:k=>memory.get(k)||null,setItem:(k,v)=>memory.set(k,String(v)),removeItem:k=>memory.delete(k)});
        R.State.newGame();R.State.update(s=>{s.avatar={type:'owlet',variant:'girl',nickname:'Expansion bench'};s.settings.music=s.settings.sfx=s.settings.voice=s.settings.ambience=0;});
        document.body.classList.toggle('calm-motion',q.get('calm')==='1');
        const team=(p,ids)=>ids.map((species,i)=>({uid:'e18-'+p+'-'+i,species,powerDelta:0,injuries:[],scars:[]}));
        function move(s,cid,zone){s.players.forEach(P=>['deck','hand','board','discard'].forEach(z=>{const i=P[z].indexOf(cid);if(i>=0)P[z].splice(i,1);}));s.players[s.cards[cid].owner][zone].push(cid);if(zone==='board')s.cards[cid].enteredTurn=0;}
        function draw(s){if(s.phase!=='draw')return s;const legal=E.legalActions(s);return E.applyAction(s,legal.find(a=>a.choice==='none')||legal.find(a=>a.choice==='rewind')||legal[0]);}
        function sample(key){
            const emma='language-comma-caterpillar',sabrina='language-echo-egret',isEmma=key.startsWith('emma-'),duplicate=key==='emma-duplicate';
            let s=E.createBattle({seed:'expansion-18-browser-'+key,players:[{name:'You',team:team(0,[isEmma?'beastie':sabrina,'proof-pup','paper-dragon','beastie']),tactics:[]},
                {name:'Rival',team:team(1,[isEmma?emma:'beastie','beastie','proof-pup']),tactics:[]}],axiomDeck:['momentum','extensionality'],
                options:{first:duplicate?1:0,shuffle:false,shuffleAxioms:false,openHand:[0,0],openAxioms:0,spark:false,timeline:false}});
            s.phase='main';s.players.forEach(P=>{P.energy=10;P.capacity=10;P.hearts=7;});move(s,'p0c0','board');move(s,'p1c0','board');
            if(isEmma){Object.assign(s.cards.p0c0,{attack:3,health:20,silenced:true});s.players[1].axHand=key==='emma-none'?[]:['momentum'];
                if(key==='emma-held')s.players[1].axHand.push('underdog');
                if(key==='emma-empty')s.axioms.active.abilities='empty-set';
                if(key==='emma-mercy'){s.axioms.active.defeat='mercy';s.options.handLimit=3;}
                if(duplicate){s.axioms.active.information='generic-public-rules';s.phase='draw';s=E.applyAction(s,{type:'draw',choice:'axiom',player:1});delete s.axioms.active.information;s=draw(E.applyAction(s,{type:'end',player:1}));}
            }else{
                Object.assign(s.cards.p1c0,{attack:0,health:20,silenced:true});s.players[0].axHand=['underdog'];
                if(key==='sabrina-spent'){s.players[0].axHand=['underdog','extensionality'];s=E.applyAction(s,{type:'axiom',choice:'underdog',player:0});}
                if(key==='sabrina-enter-empty')s.players[0].axHand=['empty-set'];
                if(key==='sabrina-reset'){s.axioms.active.plays='infinity';s.players[0].axHand=['two-plays'];}
                if(key==='sabrina-capped'){s.axioms.active.combat='underdog';s.players[0].axHand=['spare-axiom'];move(s,'p0c1','hand');s.options.handLimit=2;}
            }
            s.players.forEach(P=>{P.energy=10;P.capacity=10;});return s;
        }
        const status=el('span.small',{role:'status'}),detail=el('output#e18-outcome',{style:{fontSize:'11px',overflowWrap:'anywhere'}});
        function check(){const h=R.Router.current()==='battle'&&R.Router.handle(),s=h&&h.state;if(!s){status.textContent='Memory-only acquisition sample';return;}
            status.textContent='Hearts '+s.players[0].hearts+' / '+s.players[1].hearts+' · Energy '+s.players[0].energy+' · '+s.phase;
            detail.textContent=JSON.stringify({winner:s.winner,endReason:s.endReason,turn:s.turn,active:s.active,phase:s.phase,pending:s.pending,
                players:s.players.map(p=>({hearts:p.hearts,energy:p.energy,playsThisTurn:p.playsThisTurn,monoColour:p.monoColour,hand:p.hand.slice(),deck:p.deck.slice(),axHand:p.axHand.slice(),publicAxioms:(p.publicAxioms||[]).slice(),board:p.board.map(cid=>({cid,...E.describe(s,cid),
                    sleeping:E.isSleeping(s,cid),effects:E.activeEffects(s,cid),lastEncoreTurn:s.cards[cid].lastEncoreTurn??null,buffs:s.cards[cid].buffs,damage:s.cards[cid].damage})),discard:p.discard.slice()})),events:s.lastEvents});}
        const pick=el('select',{'aria-label':'Expansion-18 card'});CASES.forEach(id=>pick.appendChild(el('option',{value:id,text:id})));
        function start(){R.Router.replace('battle',{mode:'practice',initialState:sample(pick.value),player:{name:'You'},opponent:{name:'Rival',ai:'normal'},onEnd:check});check();}
        const bar=el('div#e18-bar',{style:{position:'fixed',top:0,left:0,right:0,padding:'8px',zIndex:90,background:'#191726',display:'flex',flexWrap:'wrap',gap:'8px',alignItems:'center'}},[
            el('strong',{text:'Expansion-18 · memory-only save'}),pick,el('button.btn.small',{text:'Start card sample',onclick:start}),el('button.btn.small',{text:'Check outcome',onclick:check}),status,
            el('button.btn.small',{text:'Open pack sample',onclick(){R.State.newGame();R.State.update(s=>{s.avatar={type:'owlet',variant:'girl',nickname:'Pack bench'};R.State.grantStarter(s);s.seed=4010;s.map.at='campfire';s.map.revealed=['campfire'];s.wallet.coins=120;s.settings.music=s.settings.sfx=s.settings.voice=s.settings.ambience=0;});R.Router.replace('map');R.UI.shop();check();}})]);
        document.body.append(bar,el('details',{style:{position:'fixed',bottom:0,left:0,right:0,zIndex:90,background:'#191726',maxHeight:'25vh',overflow:'auto'}},[el('summary',{text:'Scratch outcome details'}),detail]));
        const layout=()=>{document.getElementById('screen').style.top=bar.getBoundingClientRect().height+'px';};window.addEventListener('resize',layout);
        pick.value=CASES.includes(q.get('card'))?q.get('card'):CASES[0];document.title='Expansion-18 scratch battles';start();layout();
    }
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
