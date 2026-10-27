/* #129 expansion-17: production controls over disposable Map-backed progress. */
(function(){
    'use strict';
    const CASES=['zach-friend','zach-token','zach-nickname','zach-empty','zach-alone','isabelle-enemy','isabelle-zero','isabelle-empty','isabelle-elusive','isabelle-cleared'];
    function boot(){
        const R=window.Rift,E=R.Battle.Engine,el=R.el,memory=new Map(),q=new URLSearchParams(location.search);
        R.storage=()=>({getItem:k=>memory.get(k)||null,setItem:(k,v)=>memory.set(k,String(v)),removeItem:k=>memory.delete(k)});
        R.State.newGame();R.State.update(s=>{s.avatar={type:'owlet',variant:'girl',nickname:'Expansion bench'};s.settings.music=s.settings.sfx=s.settings.voice=s.settings.ambience=0;});
        document.body.classList.toggle('calm-motion',q.get('calm')==='1');
        const team=(p,ids)=>ids.map((species,i)=>({uid:'e17-'+p+'-'+i,species,powerDelta:0,injuries:[],scars:[]}));
        function move(s,cid,zone){s.players.forEach(P=>['deck','hand','board','discard'].forEach(z=>{const i=P[z].indexOf(cid);if(i>=0)P[z].splice(i,1);}));s.players[s.cards[cid].owner][zone].push(cid);if(zone==='board')s.cards[cid].enteredTurn=0;}
        function draw(s){if(s.phase!=='draw')return s;const legal=E.legalActions(s);return E.applyAction(s,legal.find(a=>a.choice==='none')||legal.find(a=>a.choice==='rewind')||legal[0]);}
        function sample(key){
            const zach='perception-prism-puffin',isabelle='language-metaphor-mantis',isZach=key.startsWith('zach-'),token=key==='zach-token',nick=key==='zach-nickname',cleared=key==='isabelle-cleared';
            let s=E.createBattle({seed:'expansion-17-browser-'+key,players:[{name:'You',team:team(0,[isZach?zach:isabelle,token?'imagination-cloud-castle-crab':'beastie','paper-dragon']),tactics:['language-plain-words']},
                {name:'Rival',team:team(1,[key==='isabelle-elusive'?'perception-shadow-shrimp':'beastie',nick?'tremendoodle':isabelle,'cloud-calf']),tactics:[]}],axiomDeck:['one-action','luxury'],
                options:{first:token||nick||cleared?1:0,shuffle:false,shuffleAxioms:false,openHand:[0,0],openAxioms:0,spark:false,timeline:false}});
            s.phase='main';s.players.forEach(P=>{P.energy=10;P.capacity=10;P.hearts=7;});move(s,'p1c0','board');
            if(key!=='isabelle-elusive')Object.assign(s.cards.p1c0,{attack:key==='isabelle-zero'?0:2,health:20,silenced:true});
            if(isZach&&key!=='zach-alone'||cleared)move(s,'p0c1','board');
            if(!token&&s.players[0].board.includes('p0c1'))Object.assign(s.cards.p0c1,{attack:2,health:20,silenced:true});
            if(token)s=E.applyAction(s,{type:'attack',player:1,cid:'p1c0',target:'p0c1'});
            if(nick||cleared){move(s,'p1c1','hand');s=E.applyAction(s,{type:'play',player:1,cid:'p1c1',target:'p0c1'});}
            if(token||nick||cleared){s=draw(E.applyAction(s,{type:'end',player:1}));s.players.forEach(P=>{P.energy=10;P.capacity=10;});}
            if(key.endsWith('empty'))s.axioms.active[R.data.axioms['empty-set'].category]='empty-set';
            move(s,cleared?'p0t0':'p0c0','hand');return s;
        }
        const status=el('span.small',{role:'status'}),detail=el('output#e17-outcome',{style:{fontSize:'11px',overflowWrap:'anywhere'}});
        function check(){const h=R.Router.current()==='battle'&&R.Router.handle(),s=h&&h.state;if(!s){status.textContent='Memory-only acquisition sample';return;}
            status.textContent='Hearts '+s.players[0].hearts+' / '+s.players[1].hearts+' · Energy '+s.players[0].energy+' · '+s.phase;
            detail.textContent=JSON.stringify({winner:s.winner,endReason:s.endReason,turn:s.turn,active:s.active,phase:s.phase,pending:s.pending,
                players:s.players.map(p=>({hearts:p.hearts,energy:p.energy,playsThisTurn:p.playsThisTurn,monoColour:p.monoColour,hand:p.hand.slice(),deck:p.deck.slice(),board:p.board.map(cid=>({cid,...E.describe(s,cid),
                    sleeping:E.isSleeping(s,cid),effects:E.activeEffects(s,cid),timedColours:s.cards[cid].timedColours||null,buffs:s.cards[cid].buffs,damage:s.cards[cid].damage})),discard:p.discard.slice()})),events:s.lastEvents});}
        const pick=el('select',{'aria-label':'Expansion-17 card'});CASES.forEach(id=>pick.appendChild(el('option',{value:id,text:id})));
        function start(){R.Router.replace('battle',{mode:'practice',initialState:sample(pick.value),player:{name:'You'},opponent:{name:'Rival',ai:'normal'},onEnd:check});check();}
        const bar=el('div#e17-bar',{style:{position:'fixed',top:0,left:0,right:0,padding:'8px',zIndex:90,background:'#191726',display:'flex',flexWrap:'wrap',gap:'8px',alignItems:'center'}},[
            el('strong',{text:'Expansion-17 · memory-only save'}),pick,el('button.btn.small',{text:'Start card sample',onclick:start}),el('button.btn.small',{text:'Check outcome',onclick:check}),status,
            el('button.btn.small',{text:'Open pack sample',onclick(){R.State.newGame();R.State.update(s=>{s.avatar={type:'owlet',variant:'girl',nickname:'Pack bench'};R.State.grantStarter(s);s.seed=7714;s.map.at='campfire';s.map.revealed=['campfire'];s.wallet.coins=120;s.settings.music=s.settings.sfx=s.settings.voice=s.settings.ambience=0;});R.Router.replace('map');R.UI.shop();check();}})]);
        document.body.append(bar,el('details',{style:{position:'fixed',bottom:0,left:0,right:0,zIndex:90,background:'#191726',maxHeight:'25vh',overflow:'auto'}},[el('summary',{text:'Scratch outcome details'}),detail]));
        const layout=()=>{document.getElementById('screen').style.top=bar.getBoundingClientRect().height+'px';};window.addEventListener('resize',layout);
        pick.value=CASES.includes(q.get('card'))?q.get('card'):CASES[0];document.title='Expansion-17 scratch battles';start();layout();
    }
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
