/* Scratch metadata variants only: no new species, grants or catch tuning in production. */
(function(){
    'use strict';
    function boot(){
        const R=window.Rift,el=R.el,memory=new Map(),tom='reason-premise-pigeon',spell='generic-small-patch',ax='flux-plays-plus-1';
        R.storage=()=>({getItem:k=>memory.get(k)||null,setItem:(k,v)=>memory.set(k,String(v)),removeItem:k=>memory.delete(k)});
        R.State.newGame();R.State.update(s=>{
            s.avatar={type:'owlet',variant:'girl',nickname:'Rarity bench'};R.State.grantStarter(s);
            s.settings.music=s.settings.sfx=s.settings.voice=s.settings.ambience=0;
            for(const id of [tom,'rawmsay','muskrat','khaby']){s.creatures.push(R.State.makeCreature(id,{foil:id===tom}));if(!s.seen.includes(id))s.seen.push(id);}
            R.State.grantTactic(spell,s);R.State.grantAxiom(ax,s);
        });
        const pick=el('select',{'aria-label':'Scratch rarity'},R.Rarity.ids.map(id=>el('option',{value:id,text:R.Rarity.of({rarity:id}).label})));pick.value='mythic';
        function tier(){[R.data.creatures[tom],R.data.tactics[spell],R.data.axioms[ax]].forEach(def=>{def.rarity=pick.value;});}
        function collection(){tier();R.Router.replace('collection');}
        function battle(){
            tier();const f=R.FoundationFixtures.sample(tom,false),P=f.s.players[0];
            const cid=P.deck.find(id=>f.s.cards[id].tactic===spell);P.deck.splice(P.deck.indexOf(cid),1);P.hand.push(cid);
            const i=f.s.axioms.deck.indexOf(ax);if(i>=0)f.s.axioms.deck.splice(i,1);P.axHand.push(ax);
            R.Router.replace('battle',{mode:'practice',initialState:f.s,opponent:{name:'Rival',ai:'normal'}});
        }
        const bar=el('div',{style:{position:'fixed',top:0,left:0,right:0,zIndex:90,padding:'8px',background:'#191726',display:'flex',gap:'8px',flexWrap:'wrap',alignItems:'center'}},[
            el('strong',{text:'Rarity · memory-only save'}),pick,el('button.btn.small',{text:'Collection sample',onclick:collection}),el('button.btn.small',{text:'Battle sample',onclick:battle}),
            el('span.small',{text:'Scratch relabels Tom, Small Patch and One More Move only. Mythic wild catches stay disabled.'}),
        ]);document.body.appendChild(bar);
        const layout=()=>{document.getElementById('screen').style.top=bar.getBoundingClientRect().height+'px';};window.addEventListener('resize',layout);
        document.body.classList.toggle('calm-motion',new URLSearchParams(location.search).get('calm')==='1');collection();layout();document.title='Five-tier rarity scratch review';
    }
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
