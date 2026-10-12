/* #113 scratch QA: dev/battle.html?starter=proof-pup (or another pack ID).
 * Uses the real battle screen/engine, selected from visible controls. No save writes.
 */
(function (root) {
    'use strict';
    const R=root.Rift, q=new URLSearchParams(root.location.search);
    if (!q.has('starter')) return;
    const E=R.Battle.Engine, el=R.el;
    const creatures=['proof-pup','lens-lizard','paper-dragon','cloud-calf','pocket-tortoise','comma-crab','footnote-finch'];
    const spells=R.data.tacticDecks.starterPack;
    const ids=creatures.concat(spells);
    let selected=ids.includes(q.get('starter'))?q.get('starter'):'proof-pup';
    const scratch=R.State.freshState();
    R.State.get=()=>scratch; R.State.update=fn=>fn(scratch); R.State.save=()=>{}; R.State.saveNow=()=>true;
    const notes={
        'proof-pup':'Play Proof Pup on the damaged Paper Dragon: heal 1; Guard enters.',
        'lens-lizard':'Activate Lens Check: inspect your top card, then choose keep or bottom. No card is drawn.',
        'paper-dragon':'Activate Fold Self: the damaged 2/1 Paper Dragon becomes 1/2. It uses its attack.',
        'cloud-calf':'End your turn: the damaged Cloud Calf restores 1 heart, capped at maximum.',
        'pocket-tortoise':'Activate Old Pocket: the bottom card moves to the top; deck size stays unchanged.',
        'comma-crab':'Activate Comma Pause on Paper Dragon: heal 1. Crab cannot heal itself.',
        'footnote-finch':'Play Costly Assumptions: the Finch gets +1 attack this turn; End turn removes it.',
        'patient-proof':'Play Patient Proof on an enemy with at most 2 attack: deal 2 damage.',
        'steady-gaze':'Play Steady Gaze on an enemy: deal 1 damage and draw 1 personal card.',
        'creative-spark':'Play Creative Spark on a friend: +1/+1 this turn, removed at End turn.',
        'stored-thought':'Play Stored Thought: draw 1 personal card and restore 1 heart.',
        'careful-words':'Play Careful Words on damaged Paper Dragon: maximum health 2 → 3, heal 1.',
    };
    const note=el('p',{id:'starter-note',text:notes[selected]});
    const select=el('select',{'aria-label':'Starter pack case',onchange(e){
        selected=e.target.value;q.set('starter',selected);root.history.replaceState(null,'',root.location.pathname+'?'+q.toString());start();
    }},ids.map(id=>el('option',{value:id,selected:id===selected,text:(R.data.creatures[id]||R.data.tactics[id]).name})));
    root.document.querySelector('.bench header').replaceChildren(el('strong',{text:'Starter pack · scratch battle, no saves'}),select,
        el('button.btn.small',{text:'Reset case',onclick:()=>start()}),el('label',{},[el('input',{type:'checkbox',onchange(e){root.document.body.classList.toggle('calm-motion',e.target.checked);}}),' Calm motion']));
    root.document.getElementById('screen').before(note);
    function start(){
        note.textContent=notes[selected];
        const colour=R.data.tactics[selected]&&R.data.tactics[selected].colour;
        const matching={reason:'proof-pup',perception:'lens-lizard',imagination:'paper-dragon',memory:'pocket-tortoise',language:'comma-crab'};
        const own=[colour?matching[colour]:selected,'paper-dragon','cloud-calf','pocket-tortoise','lens-lizard','footnote-finch'];
        const inst=(species,i,p)=>({uid:'starter-'+p+'-'+i,species,powerDelta:0,injuries:[],scars:[]});
        const s=E.createBattle({seed:'starter-pack-'+selected,
            players:[{name:'You',team:own.map((id,i)=>inst(id,i,0)),tactics:colour?[selected]:[]},
                {name:'Practice rival',team:['lens-lizard','paper-dragon','cloud-calf','footnote-finch','pocket-tortoise','comma-crab'].map((id,i)=>inst(id,i,1)),tactics:[]}],
            axiomDeck:['luxury','abundance','reverse-hearts'],options:{first:0,shuffle:false,shuffleAxioms:false,openHand:[0,0],openAxioms:0,spark:false,timeline:false,mode:'practice'}});
        function move(cid,p,zone){
            ['deck','hand','board','discard'].forEach(z=>{s.players[p][z]=s.players[p][z].filter(id=>id!==cid);});
            s.players[p][zone].push(cid);s.cards[cid].enteredTurn=0;
        }
        move('p0c0',0,selected==='proof-pup'?'hand':'board');move('p0c1',0,'board');s.cards.p0c1.damage=1;
        move('p1c0',1,'board');move('p1c1',1,'board');
        if(selected==='paper-dragon'||selected==='cloud-calf')s.cards.p0c0.damage=1;
        if(colour)move('p0t0',0,'hand');
        if(selected==='footnote-finch')s.players[0].axHand=['luxury'];
        s.players.forEach(P=>{P.energy=10;P.capacity=10;});s.players[0].hearts=8;s.phase='main';
        R.Router.replace('battle',{mode:'practice',initialState:s,opponent:{name:'Practice rival',ai:'normal'},onEnd(result){note.textContent='Scratch result: '+result.outcome+'. Reset or choose another case.';}});
    }
    R.StarterPackBench={start};
})(typeof window!=='undefined'?window:globalThis);
