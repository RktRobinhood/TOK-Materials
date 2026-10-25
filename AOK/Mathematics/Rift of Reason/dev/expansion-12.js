/* #129 expansion-12: production controls, disposable memory-only progress. */
(function(){
    'use strict';
    const CASES=['proof-guard','proof-no-guard','proof-silenced','proof-used','paper-token','paper-coloured-token','paper-colourless-body','paper-silenced'];
    const labels={'proof-guard':'Provisional Proof: Guard','proof-no-guard':'Provisional Proof: no Guard','proof-silenced':'Provisional Proof: silenced Guard','proof-used':'Provisional Proof: used Shield',
        'paper-token':'Paper Shield: Paper token','paper-coloured-token':'Paper Shield: coloured token','paper-colourless-body':'Paper Shield: colourless body','paper-silenced':'Paper Shield: silenced Paper'};
    function boot(){
        const R=window.Rift,E=R.Battle.Engine,el=R.el,memory=new Map(),q=new URLSearchParams(location.search);
        R.storage=()=>({getItem:k=>memory.get(k)||null,setItem:(k,v)=>memory.set(k,String(v)),removeItem:k=>memory.delete(k)});
        R.State.newGame();R.State.update(s=>{s.avatar={type:'owlet',variant:'girl',nickname:'Expansion bench'};s.settings.music=s.settings.sfx=s.settings.voice=s.settings.ambience=0;});
        document.body.classList.toggle('calm-motion',q.get('calm')==='1');
        const team=(p,ids)=>ids.map((species,i)=>({uid:'e12-'+p+'-'+i,species,powerDelta:0,injuries:[],scars:[]}));
        function move(s,cid,zone){s.players.forEach(P=>['deck','hand','board','discard'].forEach(z=>{const i=P[z].indexOf(cid);if(i>=0)P[z].splice(i,1);}));s.players[s.cards[cid].owner][zone].push(cid);if(zone==='board')s.cards[cid].enteredTurn=0;}
        function sample(key){
            const paper=key.startsWith('paper-'),id=paper?'imagination-paper-shield':'reason-provisional-proof';
            let s=E.createBattle({seed:'expansion-12-browser-'+key,players:[{name:'You',team:team(0,['beastie','proof-pup','paper-dragon','cloud-calf']),tactics:[id,'imagination-sketch-a-friend']},
                {name:'Rival',team:team(1,['beastie','paper-dragon','cloud-calf','proof-pup']),tactics:['lemma']}],axiomDeck:['one-action','luxury'],
                options:{first:0,shuffle:false,shuffleAxioms:false,openHand:[0,0],openAxioms:0,spark:false,timeline:false}});
            s.phase='main';s.players.forEach(P=>{P.energy=10;P.capacity=10;P.hearts=7;});
            move(s,'p0c0','board');move(s,'p1c0','board');
            if(paper){
                // Authored initial-state preparation: make a real Paper through the existing spell API.
                move(s,'p0t1','hand');s=E.applyAction(s,{type:'play',player:0,cid:'p0t1'});
                const token=s.players[0].board.find(cid=>s.cards[cid].token);
                if(key==='paper-coloured-token')Object.assign(s.cards[token],{generic:false,colourless:false,colour:'imagination'});
                if(key==='paper-colourless-body')s.cards.p0c0.colourless=true;
                if(key==='paper-silenced')s.cards[token].silenced=true;
                s.players[0].energy=10;s.players[0].playsThisTurn=0;
            }else{
                if(key!=='proof-no-guard')s.cards.p0c0.extraKeywords=['guard'];
                if(key==='proof-silenced')s.cards.p0c0.silenced=true;
                if(key==='proof-used'){s.cards.p0c0.extraKeywords.push('shield');s.cards.p0c0.shieldUsed=true;}
            }
            move(s,'p0t0','hand');return s;
        }
        const status=el('span.small',{role:'status'}),detail=el('output#e12-outcome',{style:{fontSize:'11px',overflowWrap:'anywhere'}});
        function check(){
            const h=R.Router.current()==='battle'&&R.Router.handle(),s=h&&h.state;if(!s){status.textContent='Memory-only acquisition sample';return;}
            status.textContent='Hearts '+s.players[0].hearts+' / '+s.players[1].hearts+' · Energy '+s.players[0].energy+' · '+s.phase;
            detail.textContent=JSON.stringify({winner:s.winner,endReason:s.endReason,turn:s.turn,active:s.active,phase:s.phase,pending:s.pending,
                players:s.players.map(p=>({hearts:p.hearts,energy:p.energy,hand:p.hand.slice(),deck:p.deck.slice(),board:p.board.map(cid=>({cid,...E.describe(s,cid),
                    token:!!s.cards[cid].token,buffs:s.cards[cid].buffs,damage:s.cards[cid].damage})),discard:p.discard.slice()})),events:s.lastEvents});
        }
        const pick=el('select',{'aria-label':'Expansion-12 card'});CASES.forEach(id=>pick.appendChild(el('option',{value:id,text:labels[id]||R.data.tactics[id].name})));
        function start(){R.Router.replace('battle',{mode:'practice',initialState:sample(pick.value),player:{name:'You'},opponent:{name:'Rival',ai:'normal'},onEnd:check});check();}
        const bar=el('div#e12-bar',{style:{position:'fixed',top:0,left:0,right:0,padding:'8px',zIndex:90,background:'#191726',display:'flex',flexWrap:'wrap',gap:'8px',alignItems:'center'}},[
            el('strong',{text:'Expansion-12 · memory-only save'}),pick,el('button.btn.small',{text:'Start card sample',onclick:start}),el('button.btn.small',{text:'Check outcome',onclick:check}),status,
            el('button.btn.small',{text:'Open pack sample',onclick(){
                R.State.newGame();R.State.update(s=>{s.avatar={type:'owlet',variant:'girl',nickname:'Pack bench'};R.State.grantStarter(s);s.seed=144;s.map.at='campfire';s.map.revealed=['campfire'];s.wallet.coins=120;s.settings.music=s.settings.sfx=s.settings.voice=s.settings.ambience=0;});
                R.Router.replace('map');R.UI.shop();check();
            }})]);
        document.body.append(bar,el('details',{style:{position:'fixed',bottom:0,left:0,right:0,zIndex:90,background:'#191726',maxHeight:'25vh',overflow:'auto'}},[el('summary',{text:'Scratch outcome details'}),detail]));
        const layout=()=>{document.getElementById('screen').style.top=bar.getBoundingClientRect().height+'px';};window.addEventListener('resize',layout);
        pick.value=CASES.includes(q.get('card'))?q.get('card'):CASES[0];document.title='Expansion-12 scratch battles';start();layout();
    }
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
