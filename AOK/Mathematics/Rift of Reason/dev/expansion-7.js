/* #129 expansion-7: production controls with disposable memory-only progress.
 * ?card=<id>&calm=1; extra cases cover both choices, board-count healing and reversed Win. */
(function(){
    'use strict';
    const BATCH=['emotion-careful-cheer','imagination-bright-possibility','memory-keep-the-note','memory-familiar-path','generic-spare-spark','generic-fair-trade','generic-repair-the-shield','generic-one-last-draw','bright-health','cheer-wide','last-reversed'];
    function boot(){
        const R=window.Rift,E=R.Battle.Engine,el=R.el,memory=new Map(),q=new URLSearchParams(location.search);
        R.storage=()=>({getItem:k=>memory.get(k)||null,setItem:(k,v)=>memory.set(k,String(v)),removeItem:k=>memory.delete(k)});
        R.State.newGame();R.State.update(s=>{s.avatar={type:'owlet',variant:'girl',nickname:'Expansion bench'};s.settings.music=s.settings.sfx=s.settings.voice=s.settings.ambience=0;});
        document.body.classList.toggle('calm-motion',q.get('calm')==='1');
        const team=(p,ids)=>ids.map((species,i)=>({uid:'e7-'+p+'-'+i,species,powerDelta:0,injuries:[],scars:[]}));
        function move(s,cid,zone){
            s.players.forEach(P=>['deck','hand','board','discard'].forEach(z=>{const i=P[z].indexOf(cid);if(i>=0)P[z].splice(i,1);}));
            s.players[s.cards[cid].owner][zone].push(cid);if(zone==='board')s.cards[cid].enteredTurn=0;
        }
        function sample(key){
            const id=key==='bright-health'?'imagination-bright-possibility':key==='cheer-wide'?'emotion-careful-cheer':key==='last-reversed'?'generic-one-last-draw':key;
            const own=team(0,['beastie','proof-pup','reason-premise-pigeon','cloud-calf']);
            if(id==='memory-familiar-path'){own[1].changes=[{id:'light-feet'}];own[2].changes=[{id:'heavy-step'}];}
            const s=E.createBattle({seed:'expansion-7-browser-'+key,players:[
                {name:'You',team:own,tactics:[id,'lemma','memory-keep-the-note']},
                {name:'Rival',team:team(1,['beastie','paper-dragon','cloud-calf','proof-pup']),tactics:['lemma']}],
                axiomDeck:['abundance','reverse-hearts','luxury'],options:{first:0,shuffle:false,shuffleAxioms:false,openHand:[0,0],openAxioms:0,spark:false,timeline:false}});
            s.phase='main';s.players.forEach(P=>{P.energy=10;P.capacity=10;P.hearts=7;});
            move(s,'p0c0','board');move(s,'p0t0','hand');move(s,'p1c0','board');
            s.cards.p0c0.health=3;s.cards.p0c0.damage=2;s.cards.p1c0.health=5;s.cards.p1c0.attack=4;
            if(id==='memory-keep-the-note'){move(s,'p0t1','discard');move(s,'p0t2','discard');}
            if(id==='memory-familiar-path'){move(s,'p0c1','discard');move(s,'p0c2','discard');s.axioms.active[R.data.axioms.luxury.category]='luxury';}
            if(id==='generic-spare-spark')s.players[0].energy=8;
            if(id==='generic-repair-the-shield'){s.cards.p0c0.extraKeywords=['shield'];s.cards.p0c0.shieldUsed=true;}
            if(key==='cheer-wide'){move(s,'p0c1','board');move(s,'p0c2','board');}
            if(key==='last-reversed'){s.players[0].hearts=2;s.axioms.active[R.data.axioms['reverse-hearts'].category]='reverse-hearts';}
            return s;
        }
        const status=el('span.small',{role:'status'}),detail=el('output#e7-outcome',{style:{fontSize:'11px',overflowWrap:'anywhere'}});
        function check(){
            const h=R.Router.current()==='battle'&&R.Router.handle(),s=h&&h.state;if(!s){status.textContent='Memory-only acquisition sample';return;}
            const P=s.players[0];status.textContent='Hearts '+P.hearts+' · Hand '+P.hand.length+' · Deck '+P.deck.length+' · Energy '+P.energy+' · '+s.phase;
            detail.textContent=JSON.stringify({winner:s.winner,endReason:s.endReason,turn:s.turn,active:s.active,phase:s.phase,players:s.players.map(p=>({hearts:p.hearts,energy:p.energy,capacity:p.capacity,hand:p.hand.length,deck:p.deck.length,
                board:p.board.map(cid=>({cid,...E.describe(s,cid),buffs:s.cards[cid].buffs,timedKeywords:s.cards[cid].timedKeywords})),discard:p.discard})),shared:s.axioms.deck,pending:s.pending,events:s.lastEvents});
        }
        const pick=el('select',{'aria-label':'Expansion-7 card'});
        BATCH.forEach(id=>pick.appendChild(el('option',{value:id,text:id==='bright-health'?'Bright Possibility: health branch':id==='cheer-wide'?'Careful Cheer: three friends':id==='last-reversed'?'One Last Draw: reversed-heart win':R.data.tactics[id].name})));
        function start(){R.Router.replace('battle',{mode:'practice',initialState:sample(pick.value),player:{name:'You'},opponent:{name:'Rival',ai:'normal'},onEnd:check});check();}
        const bar=el('div#e7-bar',{style:{position:'fixed',top:0,left:0,right:0,padding:'8px',zIndex:90,background:'#191726',display:'flex',flexWrap:'wrap',gap:'8px',alignItems:'center'}},[
            el('strong',{text:'Expansion-7 · memory-only save'}),pick,el('button.btn.small',{text:'Start card sample',onclick:start}),el('button.btn.small',{text:'Check outcome',onclick:check}),status,
            el('button.btn.small',{text:'Open pack sample',onclick(){
                R.State.newGame();R.State.update(s=>{s.avatar={type:'owlet',variant:'girl',nickname:'Pack bench'};R.State.grantStarter(s);s.seed=1234;s.map.at='campfire';s.map.revealed=['campfire'];s.wallet.coins=120;s.settings.music=s.settings.sfx=s.settings.voice=s.settings.ambience=0;});
                R.Router.replace('map');R.UI.shop();check();
            }})]);
        const details=el('details',{style:{position:'fixed',bottom:0,left:0,right:0,zIndex:90,background:'#191726',maxHeight:'25vh',overflow:'auto'}},[el('summary',{text:'Scratch outcome details'}),detail]);
        document.body.append(bar,details);const layout=()=>{document.getElementById('screen').style.top=bar.getBoundingClientRect().height+'px';};
        window.addEventListener('resize',layout);pick.value=BATCH.includes(q.get('card'))?q.get('card'):BATCH[0];document.title='Expansion-7 scratch battles';start();layout();
    }
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
