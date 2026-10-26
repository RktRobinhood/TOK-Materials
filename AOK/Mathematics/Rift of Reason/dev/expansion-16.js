/* #129 expansion-16: production controls, disposable memory-only progress. */
(function(){
    'use strict';
    const CASES=['serena-entry','serena-creature','serena-mature','serena-shared-entry','serena-suppressed','david-entry','david-hero','david-creature','david-empty','david-restored'];
    const labels={'serena-entry':'Serenox: Swift entry','serena-creature':'Serenox: arrival creature fight','serena-mature':'Serenox: later hero attack','serena-shared-entry':'Serenox: shared readiness','serena-suppressed':'Serenox: suppressed with Arrival',
        'david-entry':'David: ordinary entry','david-hero':'David: hero exposure','david-creature':'David: creature fight','david-empty':'David: Empty Set','david-restored':'David: Look Closer then Daydream'};
    function boot(){
        const R=window.Rift,E=R.Battle.Engine,el=R.el,memory=new Map(),q=new URLSearchParams(location.search);
        R.storage=()=>({getItem:k=>memory.get(k)||null,setItem:(k,v)=>memory.set(k,String(v)),removeItem:k=>memory.delete(k)});
        R.State.newGame();R.State.update(s=>{s.avatar={type:'owlet',variant:'girl',nickname:'Expansion bench'};s.settings.music=s.settings.sfx=s.settings.voice=s.settings.ambience=0;});
        document.body.classList.toggle('calm-motion',q.get('calm')==='1');
        const team=(p,ids)=>ids.map((species,i)=>({uid:'e16-'+p+'-'+i,species,powerDelta:0,injuries:[],scars:[]}));
        function move(s,cid,zone){s.players.forEach(P=>['deck','hand','board','discard'].forEach(z=>{const i=P[z].indexOf(cid);if(i>=0)P[z].splice(i,1);}));s.players[s.cards[cid].owner][zone].push(cid);if(zone==='board')s.cards[cid].enteredTurn=0;}
        function draw(s){if(s.phase!=='draw')return s;const legal=E.legalActions(s);return E.applyAction(s,legal.find(a=>a.choice==='none')||legal.find(a=>a.choice==='rewind')||legal[0]);}
        function sample(key){
            const serena='emotion-outrage-ox',david='perception-shadow-shrimp',isDavid=key.startsWith('david-'),restored=key==='david-restored';
            let s=E.createBattle({seed:'expansion-16-browser-'+key,players:[{name:'You',team:team(0,[isDavid?david:serena,'proof-pup','paper-dragon']),tactics:['daydream']},
                {name:'Rival',team:team(1,['beastie','paper-dragon','cloud-calf']),tactics:['look-closer']}],axiomDeck:['one-action','luxury'],
                options:{first:restored?1:0,shuffle:false,shuffleAxioms:false,openHand:[0,0],openAxioms:0,spark:false,timeline:false}});
            s.phase='main';s.players.forEach(P=>{P.energy=10;P.capacity=10;P.hearts=7;});move(s,'p1c0','board');
            Object.assign(s.cards.p1c0,{attack:0,health:20,generic:true,silenced:true});
            if(key.endsWith('entry'))move(s,'p0c0','hand');else move(s,'p0c0','board');
            if(key==='serena-creature'||key==='serena-suppressed')s.cards.p0c0.enteredTurn=s.turn;
            if(key==='serena-shared-entry'||key==='serena-suppressed')s.axioms.active[R.data.axioms.arrival.category]='arrival';
            if(key==='serena-suppressed'||key==='david-empty')s.axioms.active[R.data.axioms['empty-set'].category]='empty-set';
            if(restored){
                // Actual opposing Look Closer and end/draw actions prepare the native two-action regression.
                move(s,'p1t0','hand');move(s,'p0t0','hand');s=E.applyAction(s,{type:'play',player:1,cid:'p1t0',target:'p0c0'});
                s=draw(E.applyAction(s,{type:'end',player:1}));s.players.forEach(P=>{P.energy=10;P.capacity=10;});
            }
            return s;
        }
        const status=el('span.small',{role:'status'}),detail=el('output#e16-outcome',{style:{fontSize:'11px',overflowWrap:'anywhere'}});
        function check(){
            const h=R.Router.current()==='battle'&&R.Router.handle(),s=h&&h.state;if(!s){status.textContent='Memory-only acquisition sample';return;}
            status.textContent='Hearts '+s.players[0].hearts+' / '+s.players[1].hearts+' · Energy '+s.players[0].energy+' · '+s.phase;
            detail.textContent=JSON.stringify({winner:s.winner,endReason:s.endReason,turn:s.turn,active:s.active,phase:s.phase,pending:s.pending,
                legalAttacks:E.legalActions(s).filter(a=>a.type==='attack'),players:s.players.map(p=>({hearts:p.hearts,energy:p.energy,playsThisTurn:p.playsThisTurn,attacksThisTurn:p.attacksThisTurn,hand:p.hand.slice(),deck:p.deck.slice(),board:p.board.map(cid=>({cid,...E.describe(s,cid),
                    targets:E.attackTargets(s,cid),sleeping:E.isSleeping(s,cid),canAttack:E.canAttack(s,cid),canActivate:E.canActivateNow(s,cid),timedKeywords:s.cards[cid].timedKeywords||null,lostKeywords:s.cards[cid].lostKeywords||null,buffs:s.cards[cid].buffs,damage:s.cards[cid].damage})),discard:p.discard.slice()})),events:s.lastEvents});
        }
        const pick=el('select',{'aria-label':'Expansion-16 card'});CASES.forEach(id=>pick.appendChild(el('option',{value:id,text:labels[id]})));
        function start(){R.Router.replace('battle',{mode:'practice',initialState:sample(pick.value),player:{name:'You'},opponent:{name:'Rival',ai:'normal'},onEnd:check});check();}
        const bar=el('div#e16-bar',{style:{position:'fixed',top:0,left:0,right:0,padding:'8px',zIndex:90,background:'#191726',display:'flex',flexWrap:'wrap',gap:'8px',alignItems:'center'}},[
            el('strong',{text:'Expansion-16 · memory-only save'}),pick,el('button.btn.small',{text:'Start card sample',onclick:start}),el('button.btn.small',{text:'Check outcome',onclick:check}),status,
            el('button.btn.small',{text:'Open pack sample',onclick(){
                R.State.newGame();R.State.update(s=>{s.avatar={type:'owlet',variant:'girl',nickname:'Pack bench'};R.State.grantStarter(s);s.seed=12155;s.map.at='campfire';s.map.revealed=['campfire'];s.wallet.coins=120;s.settings.music=s.settings.sfx=s.settings.voice=s.settings.ambience=0;});
                R.Router.replace('map');R.UI.shop();check();
            }})]);
        document.body.append(bar,el('details',{style:{position:'fixed',bottom:0,left:0,right:0,zIndex:90,background:'#191726',maxHeight:'25vh',overflow:'auto'}},[el('summary',{text:'Scratch outcome details'}),detail]));
        const layout=()=>{document.getElementById('screen').style.top=bar.getBoundingClientRect().height+'px';};window.addEventListener('resize',layout);
        pick.value=CASES.includes(q.get('card'))?q.get('card'):CASES[0];document.title='Expansion-16 scratch battles';start();layout();
    }
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
