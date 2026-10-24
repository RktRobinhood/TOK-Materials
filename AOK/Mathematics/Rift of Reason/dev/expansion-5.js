/* #129 expansion-5: production board and controls, disposable memory-only progress.
 * ?card=<id>&calm=1; extra cases shield-fight and last-word exercise combat/death. */
(function(){
    'use strict';
    const BATCH=['reason-small-lemma','emotion-second-heartbeat','perception-practical-observation','language-careful-wording','imagination-borrow-the-shape','memory-clear-reminder','generic-balanced-exchange','generic-take-stock','heartbeat-draw','stock-empty'];
    function boot(){
        const R=window.Rift,E=R.Battle.Engine,el=R.el,memory=new Map(),q=new URLSearchParams(location.search);
        R.storage=()=>({getItem:k=>memory.get(k)||null,setItem:(k,v)=>memory.set(k,String(v)),removeItem:k=>memory.delete(k)});
        R.State.newGame();R.State.update(s=>{s.avatar={type:'owlet',variant:'girl',nickname:'Expansion bench'};s.settings.music=s.settings.sfx=s.settings.voice=s.settings.ambience=0;});
        document.body.classList.toggle('calm-motion',q.get('calm')==='1');
        const team=(p,ids)=>ids.map((species,i)=>({uid:'e5-'+p+'-'+i,species,powerDelta:0,injuries:[],scars:[]}));
        function move(s,cid,zone){
            s.players.forEach(P=>['deck','hand','board','discard'].forEach(z=>{const i=P[z].indexOf(cid);if(i>=0)P[z].splice(i,1);}));
            s.players[s.cards[cid].owner][zone].push(cid);if(zone==='board')s.cards[cid].enteredTurn=0;
        }
        function sample(key){
            const id=key==='heartbeat-draw'?'emotion-second-heartbeat':key==='stock-empty'?'generic-take-stock':key;
            let s=E.createBattle({seed:'expansion-5-browser-'+key,players:[
                {name:'You',team:team(0,['beastie','paper-dragon','proof-pup','cloud-calf']),tactics:[id,'lemma','recall']},
                {name:'Rival',team:team(1,['beastie','paper-dragon','cloud-calf']),tactics:[]}],
                axiomDeck:['abundance','reverse-hearts','luxury'],options:{first:0,shuffle:false,shuffleAxioms:false,openHand:[0,0],openAxioms:0,spark:false,timeline:false}});
            s.phase='main';s.players.forEach(P=>{P.energy=10;P.capacity=10;P.hearts=key==='heartbeat-draw'?7:3;});
            move(s,'p0c0','board');move(s,'p0t0','hand');
            ['p1c0','p1c1','p1c2'].forEach(c=>{move(s,c,'board');s.cards[c].health=6;s.cards[c].attack=4;s.cards[c].ability=null;});
            s.cards.p0c0.health=2;
            if(id==='language-careful-wording')s.cards.p0c0.buffs.push({attack:-2,health:0,temp:false,untilStart:3,label:'Scratch temporary penalty'});
            if(id==='generic-balanced-exchange'){move(s,'p0c1','hand');move(s,'p0t1','hand');}
            if(id==='memory-clear-reminder'){
                move(s,'p0c2','discard');move(s,'p0t2','hand');s=E.applyLegal(s,{type:'play',player:0,cid:'p0t2'});
                if(s.phase==='choose')s=E.applyLegal(s,{type:'choose',player:0,choice:'p0c2'});
            }
            if(key==='stock-empty')s.players[0].deck.slice().forEach(cid=>move(s,cid,'discard'));
            return {s,cid:'p0t0',target:'p0c0'};
        }
        const status=el('span.small',{role:'status'}),detail=el('output#e5-outcome',{style:{fontSize:'11px',overflowWrap:'anywhere'}});let fixture;
        function check(){
            const h=R.Router.current()==='battle'&&R.Router.handle(),s=h&&h.state;if(!s){status.textContent='Memory-only acquisition sample';return;}
            const P=s.players[0];status.textContent='Hearts '+P.hearts+' · Hand '+P.hand.length+' · Deck '+P.deck.length+' · Turn '+s.turn+' · '+s.phase;
            detail.textContent=JSON.stringify({turn:s.turn,active:s.active,phase:s.phase,players:s.players.map(p=>({hearts:p.hearts,hand:p.hand.length,deck:p.deck.length,
                board:p.board.map(cid=>({cid,...E.describe(s,cid),buffs:s.cards[cid].buffs,timedKeywords:s.cards[cid].timedKeywords})),discard:p.discard})),shared:s.axioms.deck,pending:s.pending,events:s.lastEvents});
        }
        const pick=el('select',{'aria-label':'Expansion-5 card'});
        BATCH.forEach(id=>pick.appendChild(el('option',{value:id,text:id==='heartbeat-draw'?'Second Heartbeat: draw branch':id==='stock-empty'?'Take Stock: empty deck':R.data.tactics[id].name})));
        function start(){fixture=sample(pick.value);R.Router.replace('battle',{mode:'practice',initialState:fixture.s,player:{name:'You'},opponent:{name:'Rival',ai:'normal'},onEnd:check});check();}
        const bar=el('div#e5-bar',{style:{position:'fixed',top:0,left:0,right:0,padding:'8px',zIndex:90,background:'#191726',display:'flex',flexWrap:'wrap',gap:'8px',alignItems:'center'}},[
            el('strong',{text:'Expansion-5 · memory-only save'}),pick,el('button.btn.small',{text:'Start card sample',onclick:start}),el('button.btn.small',{text:'Check outcome',onclick:check}),status,
            el('button.btn.small',{text:'Open pack sample',onclick(){
                R.State.newGame();R.State.update(s=>{s.avatar={type:'owlet',variant:'girl',nickname:'Pack bench'};R.State.grantStarter(s);s.seed=1234;s.map.at='campfire';s.map.revealed=['campfire'];s.wallet.coins=120;s.settings.music=s.settings.sfx=s.settings.voice=s.settings.ambience=0;});
                R.Router.replace('map');R.UI.shop();check();
            }})]);
        // Details are opt-in below the board; no private fixture state is exposed in the production game.
        const details=el('details',{style:{position:'fixed',bottom:0,left:0,right:0,zIndex:90,background:'#191726',maxHeight:'25vh',overflow:'auto'}},[el('summary',{text:'Scratch outcome details'}),detail]);
        document.body.append(bar,details);const layout=()=>{document.getElementById('screen').style.top=bar.getBoundingClientRect().height+'px';};
        window.addEventListener('resize',layout);pick.value=BATCH.includes(q.get('card'))?q.get('card'):BATCH[0];document.title='Expansion-5 scratch battles';start();layout();
    }
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
