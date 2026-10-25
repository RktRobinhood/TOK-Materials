/* #129 expansion-9: production controls with disposable memory-only progress.
 * ?card=<id>&calm=1; extra cases cover hand caps, both shared-card choices and own pending events. */
(function(){
    'use strict';
    const BATCH=['reason-work-it-out','emotion-quick-courage','perception-follow-the-clue','language-a-better-label','language-change-the-subject','imagination-sketch-a-friend','generic-pocket-plan','generic-recorded-choice','clue-one-slot','pocket-bottom','recorded-pending'];
    function boot(){
        const R=window.Rift,E=R.Battle.Engine,el=R.el,memory=new Map(),q=new URLSearchParams(location.search);
        R.storage=()=>({getItem:k=>memory.get(k)||null,setItem:(k,v)=>memory.set(k,String(v)),removeItem:k=>memory.delete(k)});
        R.State.newGame();R.State.update(s=>{s.avatar={type:'owlet',variant:'girl',nickname:'Expansion bench'};s.settings.music=s.settings.sfx=s.settings.voice=s.settings.ambience=0;});
        document.body.classList.toggle('calm-motion',q.get('calm')==='1');
        const team=(p,ids)=>ids.map((species,i)=>({uid:'e9-'+p+'-'+i,species,powerDelta:0,injuries:[],scars:[]}));
        function move(s,cid,zone){
            s.players.forEach(P=>['deck','hand','board','discard'].forEach(z=>{const i=P[z].indexOf(cid);if(i>=0)P[z].splice(i,1);}));
            s.players[s.cards[cid].owner][zone].push(cid);if(zone==='board')s.cards[cid].enteredTurn=0;
        }
        function sample(key){
            const id=({'clue-one-slot':'perception-follow-the-clue','pocket-bottom':'generic-pocket-plan','recorded-pending':'generic-recorded-choice'})[key]||key;
            let s=E.createBattle({seed:'expansion-9-browser-'+key,players:[
                {name:'You',team:team(0,['beastie','proof-pup','reason-premise-pigeon','cloud-calf']),tactics:[id,'lemma','pep-talk','tomorrows-idea']},
                {name:'Rival',team:team(1,['beastie','paper-dragon','cloud-calf','proof-pup']),tactics:['lemma']}],
                axiomDeck:['one-action','luxury','reverse-hearts'],options:{first:0,shuffle:false,shuffleAxioms:false,openHand:[0,0],openAxioms:0,spark:false,
                    timeline:key==='recorded-pending',fateStart:9,fateGap:3,handLimit:key==='clue-one-slot'?1:10}});
            s.phase='main';s.players.forEach(P=>{P.energy=10;P.capacity=10;P.hearts=7;});
            move(s,'p0c0','board');move(s,'p0t0','hand');move(s,'p1c0','board');
            s.cards.p0c0.health=6;s.cards.p0c0.attack=2;s.cards.p0c0.damage=2;s.cards.p1c0.health=6;s.cards.p1c0.attack=4;
            const top=['p0c1','p0t1','p0c2','p0t2'];s.players[0].deck=top.concat(s.players[0].deck.filter(cid=>!top.includes(cid)));
            if(id==='language-change-the-subject'){s.axioms.active.attacks='one-action';s.axioms.active.cost='luxury';}
            if(key==='recorded-pending'){
                move(s,'p0t3','hand');s=E.applyAction(s,{type:'play',player:0,cid:'p0t3'});
                // Existing bench-only scheduled spell prepares a real event. This does not release it to the campaign.
                s.players[0].energy=10;s.players[0].playsThisTurn=0;
            }
            return s;
        }
        const status=el('span.small',{role:'status'}),detail=el('output#e9-outcome',{style:{fontSize:'11px',overflowWrap:'anywhere'}});
        function check(){
            const h=R.Router.current()==='battle'&&R.Router.handle(),s=h&&h.state;if(!s){status.textContent='Memory-only acquisition sample';return;}
            const P=s.players[0];status.textContent='Hearts '+P.hearts+' · Hand '+P.hand.length+' · Deck '+P.deck.length+' · Energy '+P.energy+' · '+s.phase;
            detail.textContent=JSON.stringify({winner:s.winner,endReason:s.endReason,turn:s.turn,active:s.active,phase:s.phase,players:s.players.map(p=>({hearts:p.hearts,energy:p.energy,capacity:p.capacity,hand:p.hand.length,handCards:p.hand.map(cid=>({cid,name:E.cardName(s,cid)})),deck:p.deck.length,deckOrder:p.deck.slice(),
                board:p.board.map(cid=>({cid,...E.describe(s,cid),buffs:s.cards[cid].buffs,timedKeywords:s.cards[cid].timedKeywords,frozen:s.cards[cid].frozen,attacks:s.cards[cid].attacks,activated:s.cards[cid].activated,damage:s.cards[cid].damage})),discard:p.discard})),shared:s.axioms.deck,axioms:{active:s.axioms.active,discard:s.axioms.discard,reserved:s.fate.next},schedule:E.fateSchedule(s),pending:s.pending,events:s.lastEvents});
        }
        const pick=el('select',{'aria-label':'Expansion-9 card'});
        BATCH.forEach(id=>pick.appendChild(el('option',{value:id,text:({'clue-one-slot':'Follow the Clue: one hand slot','pocket-bottom':'Pocket Plan: bottom branch','recorded-pending':'Recorded Choice: own pending event'})[id]||R.data.tactics[id].name})));
        function start(){R.Router.replace('battle',{mode:'practice',initialState:sample(pick.value),player:{name:'You'},opponent:{name:'Rival',ai:'normal'},onEnd:check});check();}
        const bar=el('div#e9-bar',{style:{position:'fixed',top:0,left:0,right:0,padding:'8px',zIndex:90,background:'#191726',display:'flex',flexWrap:'wrap',gap:'8px',alignItems:'center'}},[
            el('strong',{text:'Expansion-9 · memory-only save'}),pick,el('button.btn.small',{text:'Start card sample',onclick:start}),el('button.btn.small',{text:'Check outcome',onclick:check}),status,
            el('button.btn.small',{text:'Open pack sample',onclick(){
                R.State.newGame();R.State.update(s=>{s.avatar={type:'owlet',variant:'girl',nickname:'Pack bench'};R.State.grantStarter(s);s.seed=3;s.map.at='campfire';s.map.revealed=['campfire'];s.wallet.coins=120;s.settings.music=s.settings.sfx=s.settings.voice=s.settings.ambience=0;});
                R.Router.replace('map');R.UI.shop();check();
            }})]);
        const details=el('details',{style:{position:'fixed',bottom:0,left:0,right:0,zIndex:90,background:'#191726',maxHeight:'25vh',overflow:'auto'}},[el('summary',{text:'Scratch outcome details'}),detail]);
        document.body.append(bar,details);const layout=()=>{document.getElementById('screen').style.top=bar.getBoundingClientRect().height+'px';};
        window.addEventListener('resize',layout);pick.value=BATCH.includes(q.get('card'))?q.get('card'):BATCH[0];document.title='Expansion-9 scratch battles';start();layout();
    }
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
