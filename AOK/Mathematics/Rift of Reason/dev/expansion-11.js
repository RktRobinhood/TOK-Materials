/* #129 expansion-11: production controls, disposable memory-only progress. */
(function(){
    'use strict';
    const CASES=['emotion-shared-pain','shared-own-zero','shared-both-zero','shared-enemy-zero','generic-board-sweep','sweep-last-words','sweep-paper','sweep-reduction'];
    const labels={'shared-own-zero':'Shared Pain: reversed own zero','shared-both-zero':'Shared Pain: both zero','shared-enemy-zero':'Shared Pain: enemy zero',
        'sweep-last-words':'Board Sweep: both Last Words','sweep-paper':'Board Sweep: surviving Paper Backup','sweep-reduction':'Board Sweep: damage reduction'};
    function boot(){
        const R=window.Rift,E=R.Battle.Engine,el=R.el,memory=new Map(),q=new URLSearchParams(location.search);
        R.storage=()=>({getItem:k=>memory.get(k)||null,setItem:(k,v)=>memory.set(k,String(v)),removeItem:k=>memory.delete(k)});
        R.State.newGame();R.State.update(s=>{s.avatar={type:'owlet',variant:'girl',nickname:'Expansion bench'};s.settings.music=s.settings.sfx=s.settings.voice=s.settings.ambience=0;});
        document.body.classList.toggle('calm-motion',q.get('calm')==='1');
        const team=(p,ids)=>ids.map((species,i)=>({uid:'e11-'+p+'-'+i,species,powerDelta:0,injuries:[],scars:[]}));
        function move(s,cid,zone){s.players.forEach(P=>['deck','hand','board','discard'].forEach(z=>{const i=P[z].indexOf(cid);if(i>=0)P[z].splice(i,1);}));s.players[s.cards[cid].owner][zone].push(cid);if(zone==='board')s.cards[cid].enteredTurn=0;}
        function sample(key){
            const shared=key.startsWith('shared-')||key==='emotion-shared-pain',id=shared?'emotion-shared-pain':'generic-board-sweep';
            let own=['beastie','proof-pup','paper-dragon','cloud-calf'],foe=['shakirattle','paper-dragon','beastie','proof-pup'];
            if(key==='sweep-last-words'){own[0]=foe[0]='emotion-grudge-goose';}
            if(key==='sweep-paper')own[0]='imagination-cloud-castle-crab';
            if(key==='sweep-reduction')own[0]='rockodile';
            const s=E.createBattle({seed:'expansion-11-browser-'+key,players:[{name:'You',team:team(0,own),tactics:[id,'lemma']},
                {name:'Rival',team:team(1,foe),tactics:['lemma']}],axiomDeck:['one-action','luxury','reverse-hearts'],
                options:{first:0,shuffle:false,shuffleAxioms:false,openHand:[0,0],openAxioms:0,spark:false,timeline:false}});
            s.phase='main';s.players.forEach(P=>{P.energy=10;P.capacity=10;P.hearts=7;});
            move(s,'p0t0','hand');move(s,'p0c0','board');move(s,'p1c0','board');
            if(key==='generic-board-sweep'){
                move(s,'p0c1','board');move(s,'p1c1','board');s.cards.p0c0.health=5;s.cards.p0c1.extraKeywords=['shield'];s.cards.p1c1.health=3;
            }
            if(key==='shared-own-zero'){s.players[0].hearts=1;s.axioms.active[R.data.axioms['reverse-hearts'].category]='reverse-hearts';}
            if(key==='shared-both-zero'||key==='sweep-last-words')s.players.forEach(P=>P.hearts=1);
            if(key==='shared-enemy-zero')s.players[1].hearts=1;
            return s;
        }
        const status=el('span.small',{role:'status'}),detail=el('output#e11-outcome',{style:{fontSize:'11px',overflowWrap:'anywhere'}});
        function check(){
            const h=R.Router.current()==='battle'&&R.Router.handle(),s=h&&h.state;if(!s){status.textContent='Memory-only acquisition sample';return;}
            status.textContent='Hearts '+s.players[0].hearts+' / '+s.players[1].hearts+' · Energy '+s.players[0].energy+' · '+s.phase;
            detail.textContent=JSON.stringify({winner:s.winner,endReason:s.endReason,turn:s.turn,active:s.active,phase:s.phase,pending:s.pending,
                players:s.players.map(p=>({hearts:p.hearts,energy:p.energy,hand:p.hand.slice(),deck:p.deck.slice(),board:p.board.map(cid=>({cid,...E.describe(s,cid),
                    token:!!s.cards[cid].token,buffs:s.cards[cid].buffs,damage:s.cards[cid].damage})),discard:p.discard.slice()})),events:s.lastEvents});
        }
        const pick=el('select',{'aria-label':'Expansion-11 card'});CASES.forEach(id=>pick.appendChild(el('option',{value:id,text:labels[id]||R.data.tactics[id].name})));
        function start(){R.Router.replace('battle',{mode:'practice',initialState:sample(pick.value),player:{name:'You'},opponent:{name:'Rival',ai:'normal'},onEnd:check});check();}
        const bar=el('div#e11-bar',{style:{position:'fixed',top:0,left:0,right:0,padding:'8px',zIndex:90,background:'#191726',display:'flex',flexWrap:'wrap',gap:'8px',alignItems:'center'}},[
            el('strong',{text:'Expansion-11 · memory-only save'}),pick,el('button.btn.small',{text:'Start card sample',onclick:start}),el('button.btn.small',{text:'Check outcome',onclick:check}),status,
            el('button.btn.small',{text:'Open pack sample',onclick(){
                R.State.newGame();R.State.update(s=>{s.avatar={type:'owlet',variant:'girl',nickname:'Pack bench'};R.State.grantStarter(s);s.seed=6;s.map.at='campfire';s.map.revealed=['campfire'];s.wallet.coins=120;s.settings.music=s.settings.sfx=s.settings.voice=s.settings.ambience=0;});
                R.Router.replace('map');R.UI.shop();check();
            }})]);
        document.body.append(bar,el('details',{style:{position:'fixed',bottom:0,left:0,right:0,zIndex:90,background:'#191726',maxHeight:'25vh',overflow:'auto'}},[el('summary',{text:'Scratch outcome details'}),detail]));
        const layout=()=>{document.getElementById('screen').style.top=bar.getBoundingClientRect().height+'px';};window.addEventListener('resize',layout);
        pick.value=CASES.includes(q.get('card'))?q.get('card'):CASES[0];document.title='Expansion-11 scratch battles';start();layout();
    }
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
