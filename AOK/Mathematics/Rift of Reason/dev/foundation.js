/* Real board/actions/readers with disposable prepared states. Never the player's save. */
(function(){
    'use strict';
    function boot(){
        const R=window.Rift,F=R.FoundationFixtures,el=R.el,memory=new Map();
        R.storage=()=>({getItem:k=>memory.get(k)||null,setItem:(k,v)=>memory.set(k,String(v)),removeItem:k=>memory.delete(k)});
        R.State.newGame();R.State.update(s=>{s.avatar={type:'owlet',variant:'girl',nickname:'Foundation bench'};s.settings.music=s.settings.sfx=s.settings.voice=s.settings.ambience=0;});
        const calm=new URLSearchParams(location.search).get('calm')==='1';document.body.classList.toggle('calm-motion',calm);
        const pick=el('select',{'aria-label':'Foundation card'}),mix=el('select',{'aria-label':'Deck composition'},[el('option',{value:'mono',text:'Mono deck'}),el('option',{value:'mixed',text:'Mixed deck'})]);
        [...F.newcomers,'generic-small-patch'].forEach(id=>pick.appendChild(el('option',{value:id,text:(R.data.creatures[id]||R.data.tactics[id]).name})));
        const status=el('span.small',{role:'status'});let fixture;
        function check(){
            if(R.Router.current()!=='battle'){
                const s=R.State.get();status.textContent='Normal Forest Road source · '+s.wallet.coins+' Coins · Tom copies '+s.creatures.filter(c=>c.species==='reason-premise-pigeon').length;return;
            }
            const h=R.Router.handle(),s=h&&h.state;if(!s)return;
            const P=s.players[0],d=fixture.target&&R.Battle.Engine.describe(s,fixture.target);
            status.textContent='Identity: '+(P.monoColour||'mixed')+' · Hearts '+P.hearts+'/'+P.maxHearts+' · Hand '+P.hand.length+' · Deck '+P.deck.length+' · Discard '+P.discard.length
                +(d?' · Target '+d.name+' '+d.attack+'/'+d.health+(d.frozen?' Frozen':' Not frozen'):'')+' · '+s.phase;
        }
        function start(){
            fixture=F.sample(pick.value,mix.value==='mixed');
            R.Router.replace('battle',{mode:'practice',initialState:fixture.s,player:{name:'You'},opponent:{name:'Rival',ai:'normal'},onEnd:check});check();
        }
        const bar=el('div',{style:{position:'fixed',top:0,left:0,right:0,padding:'8px',zIndex:90,background:'#191726',display:'flex',flexWrap:'wrap',gap:'8px',alignItems:'center'}},[
            el('strong',{text:'Foundation · memory-only save'}),pick,mix,el('button.btn.small',{text:'Start card sample',onclick:start}),el('button.btn.small',{text:'Check outcome',onclick:check}),status,
            el('button.btn.small',{text:'Play normal acquisition sample',onclick(){
                R.State.newGame();R.State.update(s=>{
                    s.avatar={type:'owlet',variant:'girl',nickname:'Foundation bench'};R.State.grantStarter(s);s.seed=30;
                    s.settings.music=s.settings.sfx=s.settings.voice=s.settings.ambience=0;
                    s.flags['entered:ch1']=true;s.flags['learning-hint:liars-gate']=true;s.tutorialsSeen['liars-gate']=true;
                    s.map.at='road-start';s.map.revealed=['road-start'];
                });
                const road=R.data.map.nodes['road-start'];road.script=road.intro=road.reminder=''; // Fixture omits lead-ins only.
                R.Router.replace('encounter',{nodeId:'road-start'});check();
            }}),
        ]);
        document.body.appendChild(bar);const layout=()=>{document.getElementById('screen').style.top=bar.getBoundingClientRect().height+'px';};
        window.addEventListener('resize',layout);pick.value=F.newcomers[0];document.title='Foundation scratch battles';start();layout();
    }
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
