/* #129 expansion-8: production controls with disposable memory-only progress.
 * ?card=<id>&calm=1; extra cases cover fallback, lethal modifier loss, zero health and negative raw attack. */
(function(){
    'use strict';
    const BATCH=['perception-expose-the-shield','language-ask-again','language-hold-the-floor','generic-settle-down','perception-strip-the-illusion','imagination-try-another-shape','generic-clean-cut','imagination-impossible-position','expose-fallback','strip-lethal','shape-zero','position-negative'];
    function boot(){
        const R=window.Rift,E=R.Battle.Engine,el=R.el,memory=new Map(),q=new URLSearchParams(location.search);
        R.storage=()=>({getItem:k=>memory.get(k)||null,setItem:(k,v)=>memory.set(k,String(v)),removeItem:k=>memory.delete(k)});
        R.State.newGame();R.State.update(s=>{s.avatar={type:'owlet',variant:'girl',nickname:'Expansion bench'};s.settings.music=s.settings.sfx=s.settings.voice=s.settings.ambience=0;});
        document.body.classList.toggle('calm-motion',q.get('calm')==='1');
        const team=(p,ids)=>ids.map((species,i)=>({uid:'e8-'+p+'-'+i,species,powerDelta:0,injuries:[],scars:[]}));
        function move(s,cid,zone){
            s.players.forEach(P=>['deck','hand','board','discard'].forEach(z=>{const i=P[z].indexOf(cid);if(i>=0)P[z].splice(i,1);}));
            s.players[s.cards[cid].owner][zone].push(cid);if(zone==='board')s.cards[cid].enteredTurn=0;
        }
        function sample(key){
            const id=({'expose-fallback':'perception-expose-the-shield','strip-lethal':'perception-strip-the-illusion','shape-zero':'imagination-try-another-shape','position-negative':'imagination-impossible-position'})[key]||key;
            let s=E.createBattle({seed:'expansion-8-browser-'+key,players:[
                {name:'You',team:team(0,['beastie','proof-pup','reason-premise-pigeon','cloud-calf']),tactics:[id,'counterexample']},
                {name:'Rival',team:team(1,['beastie','imagination-cloud-castle-crab','emotion-grudge-goose','proof-pup']),tactics:['lemma']}],
                axiomDeck:['abundance','reverse-hearts','luxury'],options:{first:0,shuffle:false,shuffleAxioms:false,openHand:[0,0],openAxioms:0,spark:false,timeline:false}});
            s.phase='main';s.players.forEach(P=>{P.energy=10;P.capacity=10;P.hearts=7;});
            move(s,'p0c0','board');move(s,'p0t0','hand');move(s,'p1c0','board');
            s.cards.p0c0.health=6;s.cards.p0c0.attack=2;s.cards.p0c0.damage=2;s.cards.p1c0.health=6;s.cards.p1c0.attack=4;
            if(id==='perception-expose-the-shield'&&key!=='expose-fallback')s.cards.p1c0.extraKeywords=['shield'];
            if(id==='language-ask-again')s.cards.p1c0.extraKeywords=['elusive','guard','shield'];
            if(id==='language-hold-the-floor'){s.cards.p0c0.frozen=true;s.cards.p0c0.frozenUntil=5;s.cards.p0c0.attacks=1;s.cards.p0c0.activated=true;}
            if(id==='perception-strip-the-illusion'){
                s.cards.p1c0.extraKeywords=['elusive','guard','shield','swift'];
                s.cards.p1c0.buffs=[{attack:2,health:2,temp:false,untilStart:3,label:'Earlier timed boost'},{attack:1,health:1,temp:false,label:'Lasting boost'}];
                s.cards.p1c0.damage=2;s.cards.p1c0.frozen=true;s.cards.p1c0.frozenUntil=5;
            }
            if(key==='strip-lethal'){
                move(s,'p1c0','deck');move(s,'p1c2','board');s.cards.p1c2.health=2;s.cards.p1c2.damage=3;
                s.cards.p1c2.buffs=[{attack:0,health:2,temp:true,label:'Fragile extra health'}];s.players[0].hearts=1;
            }
            if(key==='shape-zero')s.cards.p0c0.attack=0;
            if(id==='generic-clean-cut'){
                move(s,'p1c1','board');move(s,'p0t1','hand');s=E.applyAction(s,{type:'play',player:0,cid:'p0t1',target:'p1c1'});
                // A real surviving Paper Backup trigger makes the colourless token. Preparation is free only in this scratch fixture.
                s.players[0].energy=10;s.players[0].playsThisTurn=0;
            }
            if(key==='position-negative')s.cards.p0c0.buffs=[{attack:-6,health:0,temp:false,label:'Earlier lasting penalty'}];
            return s;
        }
        const status=el('span.small',{role:'status'}),detail=el('output#e8-outcome',{style:{fontSize:'11px',overflowWrap:'anywhere'}});
        function check(){
            const h=R.Router.current()==='battle'&&R.Router.handle(),s=h&&h.state;if(!s){status.textContent='Memory-only acquisition sample';return;}
            const P=s.players[0];status.textContent='Hearts '+P.hearts+' · Hand '+P.hand.length+' · Deck '+P.deck.length+' · Energy '+P.energy+' · '+s.phase;
            detail.textContent=JSON.stringify({winner:s.winner,endReason:s.endReason,turn:s.turn,active:s.active,phase:s.phase,players:s.players.map(p=>({hearts:p.hearts,energy:p.energy,capacity:p.capacity,hand:p.hand.length,deck:p.deck.length,
                board:p.board.map(cid=>({cid,...E.describe(s,cid),buffs:s.cards[cid].buffs,timedKeywords:s.cards[cid].timedKeywords,frozen:s.cards[cid].frozen,attacks:s.cards[cid].attacks,activated:s.cards[cid].activated,damage:s.cards[cid].damage})),discard:p.discard})),shared:s.axioms.deck,pending:s.pending,events:s.lastEvents});
        }
        const pick=el('select',{'aria-label':'Expansion-8 card'});
        BATCH.forEach(id=>pick.appendChild(el('option',{value:id,text:({'expose-fallback':'Expose: no Shield fallback','strip-lethal':'Strip: lethal health loss','shape-zero':'Shape: zero attack defeat','position-negative':'Position: negative raw attack'})[id]||R.data.tactics[id].name})));
        function start(){R.Router.replace('battle',{mode:'practice',initialState:sample(pick.value),player:{name:'You'},opponent:{name:'Rival',ai:'normal'},onEnd:check});check();}
        const bar=el('div#e8-bar',{style:{position:'fixed',top:0,left:0,right:0,padding:'8px',zIndex:90,background:'#191726',display:'flex',flexWrap:'wrap',gap:'8px',alignItems:'center'}},[
            el('strong',{text:'Expansion-8 · memory-only save'}),pick,el('button.btn.small',{text:'Start card sample',onclick:start}),el('button.btn.small',{text:'Check outcome',onclick:check}),status,
            el('button.btn.small',{text:'Open pack sample',onclick(){
                R.State.newGame();R.State.update(s=>{s.avatar={type:'owlet',variant:'girl',nickname:'Pack bench'};R.State.grantStarter(s);s.seed=68;s.map.at='campfire';s.map.revealed=['campfire'];s.wallet.coins=120;s.settings.music=s.settings.sfx=s.settings.voice=s.settings.ambience=0;});
                R.Router.replace('map');R.UI.shop();check();
            }})]);
        const details=el('details',{style:{position:'fixed',bottom:0,left:0,right:0,zIndex:90,background:'#191726',maxHeight:'25vh',overflow:'auto'}},[el('summary',{text:'Scratch outcome details'}),detail]);
        document.body.append(bar,details);const layout=()=>{document.getElementById('screen').style.top=bar.getBoundingClientRect().height+'px';};
        window.addEventListener('resize',layout);pick.value=BATCH.includes(q.get('card'))?q.get('card'):BATCH[0];document.title='Expansion-8 scratch battles';start();layout();
    }
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
