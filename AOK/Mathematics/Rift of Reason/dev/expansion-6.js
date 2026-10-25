/* #129 expansion-6: production board and controls, disposable memory-only progress.
 * ?card=<id>&calm=1; extra cases shield-fight and last-word exercise combat/death. */
(function(){
    'use strict';
    const BATCH=['emotion-honest-hurt','perception-read-the-room','language-plain-words','generic-quick-study','emotion-cost-of-courage','language-read-the-fine-print','memory-return-to-the-plan','emotion-outburst','plain-heal','quick-one-card','honest-reversed'];
    function boot(){
        const R=window.Rift,E=R.Battle.Engine,el=R.el,memory=new Map(),q=new URLSearchParams(location.search);
        R.storage=()=>({getItem:k=>memory.get(k)||null,setItem:(k,v)=>memory.set(k,String(v)),removeItem:k=>memory.delete(k)});
        R.State.newGame();R.State.update(s=>{s.avatar={type:'owlet',variant:'girl',nickname:'Expansion bench'};s.settings.music=s.settings.sfx=s.settings.voice=s.settings.ambience=0;});
        document.body.classList.toggle('calm-motion',q.get('calm')==='1');
        const team=(p,ids)=>ids.map((species,i)=>({uid:'e6-'+p+'-'+i,species,powerDelta:0,injuries:[],scars:[]}));
        function move(s,cid,zone){
            s.players.forEach(P=>['deck','hand','board','discard'].forEach(z=>{const i=P[z].indexOf(cid);if(i>=0)P[z].splice(i,1);}));
            s.players[s.cards[cid].owner][zone].push(cid);if(zone==='board')s.cards[cid].enteredTurn=0;
        }
        function sample(key){
            const id=key==='plain-heal'?'language-plain-words':key==='quick-one-card'?'generic-quick-study':key==='honest-reversed'?'emotion-honest-hurt':key;
            const s=E.createBattle({seed:'expansion-6-browser-'+key,players:[
                {name:'You',team:team(0,['beastie','paper-dragon','proof-pup','cloud-calf']),tactics:[id,'lemma','memory-return-to-the-plan']},
                {name:'Rival',team:team(1,['beastie','paper-dragon','cloud-calf','proof-pup']),tactics:['lemma']}],
                axiomDeck:['abundance','reverse-hearts','luxury'],options:{first:0,shuffle:false,shuffleAxioms:false,openHand:[0,0],openAxioms:0,spark:false,timeline:false}});
            s.phase='main';s.players.forEach(P=>{P.energy=10;P.capacity=10;P.hearts=7;});
            move(s,'p0c0','board');move(s,'p0t0','hand');move(s,'p1c0','board');
            s.cards.p0c0.health=2;s.cards.p0c0.damage=1;s.cards.p1c0.health=5;s.cards.p1c0.attack=4;
            if(key==='language-plain-words')s.cards.p0c0.buffs.push({attack:-2,health:0,temp:false,untilStart:3,label:'Scratch temporary penalty'});
            if(id==='language-read-the-fine-print'){s.cards.p1c0.extraKeywords=['guard'];s.cards.p1c0.buffs.push({attack:2,health:2,temp:false,label:'Scratch boost'});s.cards.p1c0.damage=2;}
            if(id==='perception-read-the-room'){['p1c1','p1c3','p1t0'].forEach(cid=>move(s,cid,'hand'));}
            if(id==='memory-return-to-the-plan'){move(s,'p0t1','discard');move(s,'p0t2','discard');}
            if(key==='quick-one-card')s.players[0].deck.slice(1).forEach(cid=>move(s,cid,'discard'));
            if(key==='honest-reversed'){s.players[0].hearts=1;s.axioms.active[R.data.axioms['reverse-hearts'].category]='reverse-hearts';}
            return {s,cid:'p0t0',target:id==='emotion-outburst'||id==='language-read-the-fine-print'?'p1c0':'p0c0'};
        }
        const status=el('span.small',{role:'status'}),detail=el('output#e6-outcome',{style:{fontSize:'11px',overflowWrap:'anywhere'}});let fixture;
        function check(){
            const h=R.Router.current()==='battle'&&R.Router.handle(),s=h&&h.state;if(!s){status.textContent='Memory-only acquisition sample';return;}
            const P=s.players[0];status.textContent='Hearts '+P.hearts+' · Hand '+P.hand.length+' · Deck '+P.deck.length+' · Turn '+s.turn+' · '+s.phase;
            detail.textContent=JSON.stringify({winner:s.winner,endReason:s.endReason,turn:s.turn,active:s.active,phase:s.phase,players:s.players.map(p=>({hearts:p.hearts,hand:p.hand.length,deck:p.deck.length,
                board:p.board.map(cid=>({cid,...E.describe(s,cid),buffs:s.cards[cid].buffs,timedKeywords:s.cards[cid].timedKeywords})),discard:p.discard})),shared:s.axioms.deck,pending:s.pending,events:s.lastEvents});
        }
        const pick=el('select',{'aria-label':'Expansion-6 card'});
        BATCH.forEach(id=>pick.appendChild(el('option',{value:id,text:id==='plain-heal'?'Plain Words: heal branch':id==='quick-one-card'?'Quick Study: one-card deck':id==='honest-reversed'?'Honest Hurt: reversed-heart win':R.data.tactics[id].name})));
        function start(){fixture=sample(pick.value);R.Router.replace('battle',{mode:'practice',initialState:fixture.s,player:{name:'You'},opponent:{name:'Rival',ai:'normal'},onEnd:check});check();}
        const bar=el('div#e6-bar',{style:{position:'fixed',top:0,left:0,right:0,padding:'8px',zIndex:90,background:'#191726',display:'flex',flexWrap:'wrap',gap:'8px',alignItems:'center'}},[
            el('strong',{text:'Expansion-6 · memory-only save'}),pick,el('button.btn.small',{text:'Start card sample',onclick:start}),el('button.btn.small',{text:'Check outcome',onclick:check}),status,
            el('button.btn.small',{text:'Open pack sample',onclick(){
                R.State.newGame();R.State.update(s=>{s.avatar={type:'owlet',variant:'girl',nickname:'Pack bench'};R.State.grantStarter(s);s.seed=1234;s.map.at='campfire';s.map.revealed=['campfire'];s.wallet.coins=120;s.settings.music=s.settings.sfx=s.settings.voice=s.settings.ambience=0;});
                R.Router.replace('map');R.UI.shop();check();
            }})]);
        // Details are opt-in below the board; no private fixture state is exposed in the production game.
        const details=el('details',{style:{position:'fixed',bottom:0,left:0,right:0,zIndex:90,background:'#191726',maxHeight:'25vh',overflow:'auto'}},[el('summary',{text:'Scratch outcome details'}),detail]);
        document.body.append(bar,details);const layout=()=>{document.getElementById('screen').style.top=bar.getBoundingClientRect().height+'px';};
        window.addEventListener('resize',layout);pick.value=BATCH.includes(q.get('card'))?q.get('card'):BATCH[0];document.title='Expansion-6 scratch battles';start();layout();
    }
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
