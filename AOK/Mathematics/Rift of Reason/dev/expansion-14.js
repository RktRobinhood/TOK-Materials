/* #129 expansion-14: production controls, disposable memory-only progress. */
(function(){
    'use strict';
    const CASES=['play-dua','survive','twice','opponent-turn','lethal','silenced','empty-set','attack-cap','haste-three','programmed'];
    const labels={'play-dua':'Dua: ordinary play','survive':'Dua: survived fight','twice':'Dua: two attacks','opponent-turn':'Dua: opposing turn','lethal':'Dua: lethal fight','silenced':'Dua: silenced','empty-set':'Dua: Empty Set','attack-cap':'Dua: player attack cap','haste-three':'Dua: Haste plus one','programmed':'Lovelace: programmed leap'};
    function boot(){
        const R=window.Rift,E=R.Battle.Engine,el=R.el,memory=new Map(),q=new URLSearchParams(location.search);
        R.storage=()=>({getItem:k=>memory.get(k)||null,setItem:(k,v)=>memory.set(k,String(v)),removeItem:k=>memory.delete(k)});
        R.State.newGame();R.State.update(s=>{s.avatar={type:'owlet',variant:'girl',nickname:'Expansion bench'};s.settings.music=s.settings.sfx=s.settings.voice=s.settings.ambience=0;});
        document.body.classList.toggle('calm-motion',q.get('calm')==='1');
        const team=(p,ids)=>ids.map((species,i)=>({uid:'e14-'+p+'-'+i,species,powerDelta:0,injuries:[],scars:[]}));
        function move(s,cid,zone){s.players.forEach(P=>['deck','hand','board','discard'].forEach(z=>{const i=P[z].indexOf(cid);if(i>=0)P[z].splice(i,1);}));s.players[s.cards[cid].owner][zone].push(cid);if(zone==='board')s.cards[cid].enteredTurn=0;}
        function sample(key){
            const opposite=key==='opponent-turn',programmed=key==='programmed',dua='emotion-pulse-pup';
            let s=E.createBattle({seed:'expansion-14-browser-'+key,players:[{name:'You',team:team(0,programmed?['lovelace',dua,'beastie','proof-pup']:[opposite?'beastie':dua,'proof-pup','paper-dragon','cloud-calf']),tactics:['lemma']},
                {name:'Rival',team:team(1,[opposite?dua:'beastie','paper-dragon','cloud-calf','proof-pup']),tactics:['lemma']}],axiomDeck:['one-action','luxury'],
                options:{first:0,shuffle:false,shuffleAxioms:false,openHand:[0,0],openAxioms:0,spark:false,timeline:false}});
            s.phase='main';s.players.forEach(P=>{P.energy=10;P.capacity=10;P.hearts=7;});move(s,'p1c0','board');
            if(key==='play-dua')move(s,'p0c0','hand');else move(s,'p0c0','board');
            const quiet=opposite?'p0c0':'p1c0';Object.assign(s.cards[quiet],{attack:opposite?1:0,health:20,generic:true,silenced:true});
            if(opposite)s.cards.p1c0.health=3;
            if(key==='lethal')s.cards.p1c0.attack=2;
            if(key==='silenced')s.cards.p0c0.silenced=true;
            if(key==='empty-set')s.axioms.active[R.data.axioms['empty-set'].category]='empty-set';
            if(key==='attack-cap')s.axioms.active[R.data.axioms['one-action'].category]='one-action';
            if(key==='haste-three'){s.axioms.active[R.data.axioms.haste.category]='haste';s.axioms.active[R.data.axioms.infinity.category]='infinity';}
            if(programmed){
                // Authored initial-state preparation through actual Program/choice/turn actions.
                move(s,'p0c1','discard');move(s,'p0c2','discard');s=E.applyAction(s,{type:'activate',player:0,cid:'p0c0',ability:'program'});
                s=E.applyAction(s,{type:'choose',player:0,choice:'one-more-leap'});
                for(let i=0;i<2;i++){s=E.applyAction(s,{type:'end',player:E.decider(s)});if(s.phase==='draw'){const legal=E.legalActions(s);s=E.applyAction(s,legal.find(x=>x.choice==='none')||legal.find(x=>x.choice==='rewind')||legal[0]);}}
                s.players.forEach(P=>{P.energy=10;P.capacity=10;});
            }
            return s;
        }
        const status=el('span.small',{role:'status'}),detail=el('output#e14-outcome',{style:{fontSize:'11px',overflowWrap:'anywhere'}});
        function check(){
            const h=R.Router.current()==='battle'&&R.Router.handle(),s=h&&h.state;if(!s){status.textContent='Memory-only acquisition sample';return;}
            status.textContent='Hearts '+s.players[0].hearts+' / '+s.players[1].hearts+' · Energy '+s.players[0].energy+' · '+s.phase;
            detail.textContent=JSON.stringify({winner:s.winner,endReason:s.endReason,turn:s.turn,active:s.active,phase:s.phase,pending:s.pending,
                players:s.players.map(p=>({hearts:p.hearts,energy:p.energy,playsThisTurn:p.playsThisTurn,attacksThisTurn:p.attacksThisTurn,hand:p.hand.slice(),deck:p.deck.slice(),board:p.board.map(cid=>({cid,...E.describe(s,cid),
                    token:!!s.cards[cid].token,oneMoreLeapUsed:!!s.cards[cid].oneMoreLeapUsed,extraAttacks:s.cards[cid].extraAttacks,canAttack:E.canAttack(s,cid),canActivate:E.canActivateNow(s,cid),buffs:s.cards[cid].buffs,damage:s.cards[cid].damage})),discard:p.discard.slice()})),events:s.lastEvents});
        }
        const pick=el('select',{'aria-label':'Expansion-14 card'});CASES.forEach(id=>pick.appendChild(el('option',{value:id,text:labels[id]||R.data.tactics[id].name})));
        function start(){R.Router.replace('battle',{mode:'practice',initialState:sample(pick.value),player:{name:'You'},opponent:{name:'Rival',ai:'normal'},onEnd:check});check();}
        const bar=el('div#e14-bar',{style:{position:'fixed',top:0,left:0,right:0,padding:'8px',zIndex:90,background:'#191726',display:'flex',flexWrap:'wrap',gap:'8px',alignItems:'center'}},[
            el('strong',{text:'Expansion-14 · memory-only save'}),pick,el('button.btn.small',{text:'Start card sample',onclick:start}),el('button.btn.small',{text:'Check outcome',onclick:check}),status,
            el('button.btn.small',{text:'Open pack sample',onclick(){
                R.State.newGame();R.State.update(s=>{s.avatar={type:'owlet',variant:'girl',nickname:'Pack bench'};R.State.grantStarter(s);s.seed=79;s.map.at='campfire';s.map.revealed=['campfire'];s.wallet.coins=120;s.settings.music=s.settings.sfx=s.settings.voice=s.settings.ambience=0;});
                R.Router.replace('map');R.UI.shop();check();
            }})]);
        document.body.append(bar,el('details',{style:{position:'fixed',bottom:0,left:0,right:0,zIndex:90,background:'#191726',maxHeight:'25vh',overflow:'auto'}},[el('summary',{text:'Scratch outcome details'}),detail]));
        const layout=()=>{document.getElementById('screen').style.top=bar.getBoundingClientRect().height+'px';};window.addEventListener('resize',layout);
        pick.value=CASES.includes(q.get('card'))?q.get('card'):CASES[0];document.title='Expansion-14 scratch battles';start();layout();
    }
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
