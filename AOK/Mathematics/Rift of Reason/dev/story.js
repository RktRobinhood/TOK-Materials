/* Prepared battle seams and legacy proofs are labelled. All storage stays in memory. */
(function(){
    'use strict';
    function boot(){
        const R=window.Rift,el=R.el,E=R.Battle.Engine,memory=new Map(),A=R.Acquisition;
        R.storage=()=>({getItem:k=>memory.get(k)||null,setItem:(k,v)=>memory.set(k,String(v)),removeItem:k=>memory.delete(k)});
        R.bus.on('state:changed',A.catchUp);R.bus.on('state:replaced',A.catchUp);
        const status=el('span.small',{role:'status'});
        function refresh(){const s=R.State.get();status.textContent=A.entries.filter(row=>s.flags['plot-card:'+row.id]).length+'/18 reward receipts · Public Rules '+R.State.cardCopies('axiom','generic-public-rules',s);}
        R.bus.on('state:changed',refresh);R.bus.on('state:replaced',refresh);
        function fresh(){R.State.newGame();R.State.update(s=>{s.avatar={type:'owlet',variant:'girl',nickname:'Story bench'};s.chapter='prologue';s.map.at='fair-gate';s.map.revealed=['burrow','fair-gate'];R.State.grantStarter(s);s.settings.music=s.settings.sfx=s.settings.voice=s.settings.ambience=0;});R.Router.replace('map');refresh();}
        function legacy(){R.State.update(s=>{for(const row of A.entries){if(!s.map.completed.includes(row.node))s.map.completed.push(row.node);const n=R.World.node(row.node);s.flags[n.type==='story'?'seen:'+n.script:n.type==='battle'?'trainer-reward:'+n.trainer:'seen:'+n.script+'.win']=true;}});R.Router.replace('collection');}
        const pick=el('select',{'aria-label':'Story battle sample'},A.entries.map(row=>el('option',{value:row.id,text:(R.data[{creature:'creatures',tactic:'tactics',axiom:'axioms'}[row.kind]][row.id]).name})));
        function battle(){
            const id=pick.value,row=A.entries.find(r=>r.id===id),base=['proof-pup','proof-pup','proof-pup','proof-pup'],tactics=['counterexample','stand-firm','generic-quiet-reset','generic-the-last-page'];
            const s=E.createBattle({seed:'story-browser:'+id,players:[{name:'You',team:base.concat(row.kind==='creature'?[id]:[]).map((species,i)=>({uid:'story'+i,species})),tactics,power:{id:'fine-print',tweaks:['blood']}},{name:'Rival',team:[{uid:'rival',species:'khaby'}],tactics:[]}],axiomDeck:['study','luxury','thrift'],options:{first:0,shuffle:false,shuffleAxioms:false,openHand:[0,0],openAxioms:0,spark:false,timeline:true}});
            s.phase='main';s.players.forEach(P=>{P.energy=P.capacity=10;});
            function move(cid,zone){const c=s.cards[cid];s.players.forEach(P=>['deck','hand','board','discard'].forEach(z=>{P[z]=P[z].filter(x=>x!==cid);}));s.players[c.owner][zone].push(cid);c.enteredTurn=0;}
            move('p0c0','board');move('p1c0','board');
            if(row.kind==='creature'){
                const cid='p0c4';move(cid,['perception-exposure-eagle','memory-second-chance-salamander'].includes(id)?'hand':'board');
                if(id==='reason-inference-heron'){s.cards.p0c0.health=2;s.cards.p1c0.attack=1;s.cards.p1c0.health=12;}
                if(id==='perception-exposure-eagle')s.cards.p1c0.extraKeywords=['guard','shield','elusive'];
                if(id==='language-contract-coyote')move('p0t1','hand');
                if(id==='imagination-cloud-castle-crab')move('p0t0','hand');
                if(id==='memory-second-chance-salamander')move('p0c1','discard');
            }else if(row.kind==='tactic'){
                move(id==='generic-quiet-reset'?'p0t2':'p0t3','hand');s.axioms.active.plays='infinity';s.axioms.active.cost='luxury';move('p0c1','discard');
            }else{
                s.players[0].axHand.push(id);
                if(id==='generic-public-rules'){s.players[1].axHand=['thrift','luxury'];s.players[1].publicAxioms=['thrift'];}
                if(id==='generic-fair-rest'){s.cards.p0c0.damage=1;s.cards.p1c0.damage=1;}
                const ax=R.data.axioms[id];if(ax.goalChecks){
                    s.axioms.active.victory=id;s.players[0].axHand=[];
                    const colour=row.id.split('-')[0];
                    if(colour!=='generic'&&colour!=='imagination')for(let i=0;i<3;i++){move('p0c'+i,'board');s.cards['p0c'+i].colour=colour;s.cards['p0c'+i].silenced=true;}
                    if(colour==='emotion')s.players[0].hearts=1;
                    if(colour==='reason')s.players[0].axHand=['study','thrift','luxury','study','thrift','luxury'];
                    if(colour==='language'){s.axioms.active.draw='study';s.axioms.active.cost='luxury';}
                    if(colour==='memory')s.players[0].recovered={turn:s.turn,cids:['p0c2','p0c3']};
                }
            }
            R.Router.replace('battle',{mode:'practice',initialState:s,opponent:{name:'Rival',ai:'normal'}});
        }
        const bar=el('div',{style:{position:'fixed',top:0,left:0,right:0,zIndex:90,padding:'6px',background:'#191726',display:'flex',gap:'6px',flexWrap:'wrap',alignItems:'center'}},[
            el('strong',{text:'Story · memory-only'}),el('button.btn.small',{text:'Fresh Fair Gate',onclick:fresh}),
            el('button.btn.small',{text:'Synthetic legacy completions',onclick:legacy}),el('button.btn.small',{text:'Collection',onclick(){R.Router.replace('collection');}}),
            el('button.btn.small',{text:'Back up and import',async onclick(){await R.State.importCode(await R.State.exportCode());R.Router.replace('collection');refresh();}}),pick,el('button.btn.small',{text:'Prepared battle seam',onclick:battle}),status,
        ]);const toggle=el('button.btn.small',{text:'Hide bench controls',onclick(){const hide=toggle.textContent==='Hide bench controls';Array.from(bar.children).forEach(c=>{if(c!==toggle&&c!==bar.firstChild)c.hidden=hide;});toggle.textContent=hide?'Show bench controls':'Hide bench controls';layout();}});bar.appendChild(toggle);
        document.body.appendChild(bar);const layout=()=>{document.getElementById('screen').style.top=bar.getBoundingClientRect().height+'px';};window.addEventListener('resize',layout);
        document.body.classList.toggle('calm-motion',new URLSearchParams(location.search).get('calm')==='1');document.title='Story cards scratch review';fresh();layout();
    }
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
