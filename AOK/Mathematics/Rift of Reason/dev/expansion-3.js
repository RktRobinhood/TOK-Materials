/* #129 expansion-3 bench: the real board, actions and readers with disposable prepared states.
 * Memory-only save; never the player's progress. ?card=<id>&calm=1 starts one sample.
 * 'last-save' is a second Niklas sample: the rival's Niklas is defeated by your Focused Hit. */
(function(){
    'use strict';
    const BATCH=['reason-check-the-premise','emotion-cheer-chick','perception-focused-hit','language-definition-dolphin',
        'imagination-mirror-marten','memory-archive-armadillo','generic-simple-cover','reason-proof-by-cases','last-save'];
    function boot(){
        const R=window.Rift,E=R.Battle.Engine,el=R.el,memory=new Map();
        R.storage=()=>({getItem:k=>memory.get(k)||null,setItem:(k,v)=>memory.set(k,String(v)),removeItem:k=>memory.delete(k)});
        R.State.newGame();R.State.update(s=>{s.avatar={type:'owlet',variant:'girl',nickname:'Expansion bench'};s.settings.music=s.settings.sfx=s.settings.voice=s.settings.ambience=0;});
        const q=new URLSearchParams(location.search);
        document.body.classList.toggle('calm-motion',q.get('calm')==='1');
        const team=(p,ids)=>ids.map((species,i)=>({uid:'e3-'+p+'-'+i,species,powerDelta:0,injuries:[],scars:[]}));
        function move(s,cid,zone){
            s.players.forEach(P=>['deck','hand','board','discard'].forEach(z=>{const i=P[z].indexOf(cid);if(i>=0)P[z].splice(i,1);}));
            s.players[s.cards[cid].owner][zone].push(cid);if(zone==='board')s.cards[cid].enteredTurn=0;
        }
        function sample(key){
            const id=key==='last-save'?'perception-focused-hit':key,creature=!!R.data.creatures[id];
            const s=E.createBattle({seed:'expansion-3-browser-'+key,players:[
                {name:'You',team:team(0,(creature?[id]:[]).concat(['paper-dragon','proof-pup','khaby'])),tactics:(creature?[]:[id]).concat(['counterexample','lemma'])},
                {name:'Rival',team:team(1,[key==='last-save'?'memory-archive-armadillo':'lobstorian','beastie','eelish','khaby']),tactics:['counterexample','pep-talk']}],
                options:{first:0,shuffle:false,shuffleAxioms:false,openHand:[0,0],openAxioms:0,spark:false,timeline:false}});
            s.phase='main';s.players.forEach(P=>{P.energy=10;P.capacity=10;});
            const mine=k=>Object.keys(s.cards).find(c=>s.cards[c].owner===0&&(s.cards[c].species===k||s.cards[c].tactic===k));
            const theirs=k=>Object.keys(s.cards).find(c=>s.cards[c].owner===1&&(s.cards[c].species===k||s.cards[c].tactic===k));
            const cid=mine(id);move(s,cid,'hand');let target=null;
            // Your Paper Dragon is the friendly target; Proof Pup (Guard) is on the board too, so Guard filters show.
            const friend=mine('paper-dragon');move(s,friend,'board');move(s,mine('proof-pup'),'board');
            if(['emotion-cheer-chick','language-definition-dolphin','generic-simple-cover'].includes(id))target=friend;
            if(id==='imagination-mirror-marten'){target=mine('khaby');move(s,target,'board');s.cards[target].attack=4;}
            if(id==='reason-check-the-premise'){target=theirs('lobstorian');move(s,target,'board');s.cards[target].health=9;}
            if(id==='perception-focused-hit'&&key!=='last-save'){target=theirs('beastie');move(s,target,'board');s.cards[target].health=9;}
            if(id==='reason-proof-by-cases'){target=theirs('lobstorian');move(s,target,'board');move(s,theirs('beastie'),'board');}
            if(key==='last-save'){
                // The rival's Niklas has 1 health left, and the rival's Counterexample is the oldest spell in their pile.
                target=theirs('memory-archive-armadillo');move(s,target,'board');s.cards[target].damage=2;
                move(s,theirs('counterexample'),'discard');move(s,theirs('pep-talk'),'discard');
            }
            return {s,cid,target};
        }
        const status=el('span.small',{role:'status'});let fixture;
        function check(){
            const h=R.Router.current()==='battle'&&R.Router.handle(),s=h&&h.state;if(!s){status.textContent='';return;}
            const P=s.players[0],d=fixture.target&&s.cards[fixture.target]&&P.board.concat(s.players[1].board).includes(fixture.target)&&E.describe(s,fixture.target);
            status.textContent='Hearts '+P.hearts+' · Deck '+P.deck.length+(d?' · Target '+d.name+' '+d.attack+'/'+d.health+' ['+d.keywords.join(' ')+']':'')+' · '+s.phase;
        }
        const pick=el('select',{'aria-label':'Expansion-3 card'});
        BATCH.forEach(id=>pick.appendChild(el('option',{value:id,text:id==='last-save'?'Niklas Landillo: Last Word':(R.data.creatures[id]||R.data.tactics[id]).name})));
        function start(){
            fixture=sample(pick.value);
            R.Router.replace('battle',{mode:'practice',initialState:fixture.s,player:{name:'You'},opponent:{name:'Rival',ai:'normal'},onEnd:check});check();
        }
        const bar=el('div#e3-bar',{style:{position:'fixed',top:0,left:0,right:0,padding:'8px',zIndex:90,background:'#191726',display:'flex',flexWrap:'wrap',gap:'8px',alignItems:'center'}},[
            el('strong',{text:'Expansion-3 · memory-only save'}),pick,el('button.btn.small',{text:'Start card sample',onclick:start}),el('button.btn.small',{text:'Check outcome',onclick:check}),status]);
        document.body.appendChild(bar);const layout=()=>{document.getElementById('screen').style.top=bar.getBoundingClientRect().height+'px';};
        window.addEventListener('resize',layout);pick.value=BATCH.includes(q.get('card'))?q.get('card'):BATCH[0];document.title='Expansion-3 scratch battles';
        window.E3Bench={start,check,fixture:()=>fixture};start();layout();
    }
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
