/* #129 expansion-4: production board and controls, disposable memory-only progress.
 * ?card=<id>&calm=1; extra cases shield-fight and last-word exercise combat/death. */
(function(){
    'use strict';
    const BATCH=['reason-counterexample-crow','reason-exact-answer','emotion-grudge-goose','perception-notice-the-crack',
        'language-debate-dingo','imagination-paradox-pony','memory-bookmark-bunny','generic-forked-reply','shield-fight','last-word'];
    function boot(){
        const R=window.Rift,E=R.Battle.Engine,el=R.el,memory=new Map(),q=new URLSearchParams(location.search);
        R.storage=()=>({getItem:k=>memory.get(k)||null,setItem:(k,v)=>memory.set(k,String(v)),removeItem:k=>memory.delete(k)});
        R.State.newGame();R.State.update(s=>{s.avatar={type:'owlet',variant:'girl',nickname:'Expansion bench'};s.settings.music=s.settings.sfx=s.settings.voice=s.settings.ambience=0;});
        document.body.classList.toggle('calm-motion',q.get('calm')==='1');
        const team=(p,ids)=>ids.map((species,i)=>({uid:'e4-'+p+'-'+i,species,powerDelta:0,injuries:[],scars:[]}));
        function move(s,cid,zone){
            s.players.forEach(P=>['deck','hand','board','discard'].forEach(z=>{const i=P[z].indexOf(cid);if(i>=0)P[z].splice(i,1);}));
            s.players[s.cards[cid].owner][zone].push(cid);if(zone==='board')s.cards[cid].enteredTurn=0;
        }
        function sample(key){
            const id=key==='shield-fight'?'language-debate-dingo':key==='last-word'?'counterexample':key,creature=!!R.data.creatures[id];
            const s=E.createBattle({seed:'expansion-4-browser-'+key,players:[
                {name:'You',team:team(0,(creature?[id]:[]).concat(['beastie','paper-dragon','proof-pup'])),tactics:creature?['lemma']:[id,'lemma']},
                {name:'Rival',team:team(1,[key==='last-word'?'emotion-grudge-goose':'beastie','paper-dragon','cloud-calf']),tactics:[]}],
                options:{first:0,shuffle:false,shuffleAxioms:false,openHand:[0,0],openAxioms:0,spark:false,timeline:false}});
            s.phase='main';s.players.forEach(P=>{P.energy=10;P.capacity=10;P.hearts=5;});
            const cid=creature?'p0c0':'p0t0';move(s,cid,key==='shield-fight'?'board':'hand');
            move(s,creature?'p0c1':'p0c0','board');
            ['p1c0','p1c1','p1c2'].forEach(c=>{move(s,c,'board');if(key!=='last-word'){s.cards[c].health=6;s.cards[c].attack=2;s.cards[c].ability=null;}});
            if(id==='reason-exact-answer')s.cards.p1c0.attack=5;
            if(id==='perception-notice-the-crack')s.cards.p1c0.damage=1;
            if(key==='shield-fight'){s.cards.p1c0.attack=5;s.cards.p1c0.health=10;s.cards.p1c0.colour='language';}
            if(id==='memory-bookmark-bunny')Object.values(s.cards).filter(c=>c.owner===1).forEach(c=>{c.attack=0;c.ability=null;});
            return {s,cid,target:'p1c0'};
        }
        const status=el('span.small',{role:'status'}),detail=el('output#e4-outcome',{style:{fontSize:'11px',overflowWrap:'anywhere'}});let fixture;
        function check(){
            const h=R.Router.current()==='battle'&&R.Router.handle(),s=h&&h.state;if(!s){status.textContent='Memory-only acquisition sample';return;}
            const P=s.players[0];status.textContent='Hearts '+P.hearts+' · Hand '+P.hand.length+' · Deck '+P.deck.length+' · Turn '+s.turn+' · '+s.phase;
            detail.textContent=JSON.stringify({turn:s.turn,active:s.active,phase:s.phase,players:s.players.map(p=>({hearts:p.hearts,hand:p.hand.length,deck:p.deck.length,
                board:p.board.map(cid=>({cid,...E.describe(s,cid)})),discard:p.discard})),events:s.lastEvents});
        }
        const pick=el('select',{'aria-label':'Expansion-4 card'});
        BATCH.forEach(id=>pick.appendChild(el('option',{value:id,text:id==='shield-fight'?'K-S-Ibis: higher-attack fight':id==='last-word'?'Jack Axoloticeye: Last Word':(R.data.creatures[id]||R.data.tactics[id]).name})));
        function start(){fixture=sample(pick.value);R.Router.replace('battle',{mode:'practice',initialState:fixture.s,player:{name:'You'},opponent:{name:'Rival',ai:'normal'},onEnd:check});check();}
        const bar=el('div#e4-bar',{style:{position:'fixed',top:0,left:0,right:0,padding:'8px',zIndex:90,background:'#191726',display:'flex',flexWrap:'wrap',gap:'8px',alignItems:'center'}},[
            el('strong',{text:'Expansion-4 · memory-only save'}),pick,el('button.btn.small',{text:'Start card sample',onclick:start}),el('button.btn.small',{text:'Check outcome',onclick:check}),status,
            el('button.btn.small',{text:'Open pack sample',onclick(){
                R.State.newGame();R.State.update(s=>{s.avatar={type:'owlet',variant:'girl',nickname:'Pack bench'};R.State.grantStarter(s);s.seed=1234;s.map.at='campfire';s.map.revealed=['campfire'];s.wallet.coins=120;s.settings.music=s.settings.sfx=s.settings.voice=s.settings.ambience=0;});
                R.Router.replace('map');R.UI.shop();check();
            }})]);
        // Details are opt-in below the board; no private fixture state is exposed in the production game.
        const details=el('details',{style:{position:'fixed',bottom:0,left:0,right:0,zIndex:90,background:'#191726',maxHeight:'25vh',overflow:'auto'}},[el('summary',{text:'Scratch outcome details'}),detail]);
        document.body.append(bar,details);const layout=()=>{document.getElementById('screen').style.top=bar.getBoundingClientRect().height+'px';};
        window.addEventListener('resize',layout);pick.value=BATCH.includes(q.get('card'))?q.get('card'):BATCH[0];document.title='Expansion-4 scratch battles';start();layout();
    }
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
