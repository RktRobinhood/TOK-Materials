/* #129 expansion-10: disposable memory-only production board/shop controls. */
(function(){
    'use strict';
    const CASES=['emotion-temper-tiger','perception-lens-lynx','imagination-doodle-duck','luka-no-match','luka-lasting','jeremy-zero','jeremy-reversed','james-no-target'];
    function boot(){
        const R=window.Rift,E=R.Battle.Engine,el=R.el,memory=new Map(),q=new URLSearchParams(location.search);
        R.storage=()=>({getItem:k=>memory.get(k)||null,setItem:(k,v)=>memory.set(k,String(v)),removeItem:k=>memory.delete(k)});
        R.State.newGame();R.State.update(s=>{s.avatar={type:'owlet',variant:'girl',nickname:'Expansion bench'};s.settings.music=s.settings.sfx=s.settings.voice=s.settings.ambience=0;});
        document.body.classList.toggle('calm-motion',q.get('calm')==='1');
        const team=(p,ids)=>ids.map((species,i)=>({uid:'e10-'+p+'-'+i,species,powerDelta:0,injuries:[],scars:[]}));
        function move(s,cid,zone){
            s.players.forEach(P=>['deck','hand','board','discard'].forEach(z=>{const i=P[z].indexOf(cid);if(i>=0)P[z].splice(i,1);}));
            s.players[s.cards[cid].owner][zone].push(cid);if(zone==='board')s.cards[cid].enteredTurn=0;
        }
        function sample(key){
            const id=key.startsWith('luka-')?'imagination-doodle-duck':key.startsWith('jeremy-')?'emotion-temper-tiger':key==='james-no-target'?'perception-lens-lynx':key;
            const friend=key==='luka-no-match'?'proof-pup':'paper-dragon',enemy=key==='james-no-target'?'beastie':'shakirattle';
            const s=E.createBattle({seed:'expansion-10-browser-'+key,players:[
                {name:'You',team:team(0,[id,friend,'proof-pup','beastie']),tactics:['lemma']},
                {name:'Rival',team:team(1,[enemy,'beastie','cloud-calf','proof-pup']),tactics:['lemma']}],
                axiomDeck:['one-action','luxury','reverse-hearts'],options:{first:0,shuffle:false,shuffleAxioms:false,openHand:[0,0],openAxioms:0,spark:false,timeline:false}});
            s.phase='main';s.players.forEach(P=>{P.energy=10;P.capacity=10;P.hearts=7;});
            move(s,'p0c0','hand');move(s,'p0c1','board');move(s,'p1c0','board');
            if(key==='luka-lasting')Object.assign(s.cards.p0c0,{attack:4,health:5,damage:1,buffs:[{label:'Lasting',attack:1,health:2,temp:false}]});
            if(id==='perception-lens-lynx')s.cards.p1c0.extraKeywords=['guard','shield'];
            if(key.startsWith('jeremy-'))s.players[0].hearts=1;
            if(key==='jeremy-reversed')s.axioms.active[R.data.axioms['reverse-hearts'].category]='reverse-hearts';
            return s;
        }
        const status=el('span.small',{role:'status'}),detail=el('output#e10-outcome',{style:{fontSize:'11px',overflowWrap:'anywhere'}});
        function check(){
            const h=R.Router.current()==='battle'&&R.Router.handle(),s=h&&h.state;if(!s){status.textContent='Memory-only acquisition sample';return;}
            status.textContent='Hearts '+s.players[0].hearts+' · Energy '+s.players[0].energy+' · '+s.phase;
            detail.textContent=JSON.stringify({winner:s.winner,endReason:s.endReason,turn:s.turn,active:s.active,phase:s.phase,pending:s.pending,
                players:s.players.map(p=>({hearts:p.hearts,energy:p.energy,capacity:p.capacity,hand:p.hand.map(cid=>({cid,...E.describe(s,cid)})),deck:p.deck.slice(),
                    board:p.board.map(cid=>({cid,...E.describe(s,cid),buffs:s.cards[cid].buffs,timedKeywords:s.cards[cid].timedKeywords,damage:s.cards[cid].damage})),discard:p.discard})),events:s.lastEvents});
        }
        const pick=el('select',{'aria-label':'Expansion-10 card'});
        CASES.forEach(id=>pick.appendChild(el('option',{value:id,text:R.data.creatures[id]?.name||({'luka-no-match':'Luka: no printed match','luka-lasting':'Luka: lasting stats','jeremy-zero':'Jeremy: last heart','jeremy-reversed':'Jeremy: reversed Win','james-no-target':'James: no Elusive'})[id]})));
        function start(){R.Router.replace('battle',{mode:'practice',initialState:sample(pick.value),player:{name:'You'},opponent:{name:'Rival',ai:'normal'},onEnd:check});check();}
        const bar=el('div#e10-bar',{style:{position:'fixed',top:0,left:0,right:0,padding:'8px',zIndex:90,background:'#191726',display:'flex',flexWrap:'wrap',gap:'8px',alignItems:'center'}},[
            el('strong',{text:'Expansion-10 · memory-only save'}),pick,el('button.btn.small',{text:'Start card sample',onclick:start}),el('button.btn.small',{text:'Check outcome',onclick:check}),status,
            el('button.btn.small',{text:'Open pack sample',onclick(){
                R.State.newGame();R.State.update(s=>{s.avatar={type:'owlet',variant:'girl',nickname:'Pack bench'};R.State.grantStarter(s);s.seed=24;s.map.at='campfire';s.map.revealed=['campfire'];s.wallet.coins=120;s.settings.music=s.settings.sfx=s.settings.voice=s.settings.ambience=0;});
                R.Router.replace('map');R.UI.shop();check();
            }})]);
        document.body.append(bar,el('details',{style:{position:'fixed',bottom:0,left:0,right:0,zIndex:90,background:'#191726',maxHeight:'25vh',overflow:'auto'}},[el('summary',{text:'Scratch outcome details'}),detail]));
        const layout=()=>{document.getElementById('screen').style.top=bar.getBoundingClientRect().height+'px';};window.addEventListener('resize',layout);
        pick.value=CASES.includes(q.get('card'))?q.get('card'):CASES[0];document.title='Expansion-10 scratch battles';start();layout();
    }
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
