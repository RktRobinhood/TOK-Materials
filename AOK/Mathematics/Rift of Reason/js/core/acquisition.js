/* Permanent story/pack separation and once-only plot entitlements. No draft card is granted. */
(function(root){
    'use strict';
    const R=root.Rift;
    const rows=[
        ['creature','reason-inference-heron','b-town-hall'],['creature','emotion-heartfire-hawk','t-tribunal'],
        ['creature','perception-exposure-eagle','b-clock-tower'],['creature','language-contract-coyote','t-archive'],
        ['creature','imagination-cloud-castle-crab','k-sorting'],['creature','memory-second-chance-salamander','b-clock-tower'],
        ['axiom','reason-complete-argument','gate'],['axiom','emotion-shared-vulnerability','troll-bridge'],
        ['axiom','perception-observed-pattern','t-tribunal'],['axiom','language-consensus','t-tribunal'],
        ['axiom','imagination-living-possibilities','fair-finale'],['axiom','memory-recovered-story','fair-finale'],
        ['tactic','generic-quiet-reset','b-town-hall'],['tactic','generic-the-last-page','fair-finale'],
        ['axiom','generic-fair-rest','gate'],['axiom','generic-public-rules','fair-gate'],
        ['axiom','generic-conservative-plans','b-clock-tower'],['axiom','generic-the-common-good','fair-finale'],
    ].map(([kind,id,node])=>Object.freeze({kind,id,node,quantity:2}));
    const entries=Object.freeze(rows),byKey=Object.fromEntries(rows.map(r=>[r.kind+':'+r.id,r]));
    const definition=(kind,id)=>((R.data||{})[{creature:'creatures',tactic:'tactics',axiom:'axioms'}[kind]]||{})[id];
    const story=(kind,id)=>Object.prototype.hasOwnProperty.call(byKey,kind+':'+id)?byKey[kind+':'+id]:null;
    function released(row){const d=definition(row.kind,row.id);return !!(d&&/^plot-\d+$/.test(d.release||'')&&d.packEligible===false);}
    // Ownership and progress are deliberately not inputs. Story exclusion wins over any definition flag.
    function packEligible(kind,id){const d=definition(kind,id);return !story(kind,id)&&!!(d&&d.packEligible===true);}
    function qualified(s,row){
        const n=R.World.node(row.node),flags=s.flags||{};
        if(!(s.map&&s.map.completed||[]).includes(row.node))return false;
        if(n.type==='story')return !!flags['seen:'+n.script];
        if(n.type==='battle')return !!flags['trainer-reward:'+n.trainer];
        const reasoning=flags['reasoning:'+row.node];
        return !!flags['seen:'+n.script+'.win']||(Array.isArray(reasoning)&&reasoning.some(p=>p&&typeof p.puzzle==='string'));
    }
    const key=row=>'plot-card:'+row.id;
    function pending(s){return !!(s&&s.avatar&&entries.some(row=>released(row)&&qualified(s,row)&&!s.flags[key(row)]));}
    function claim(s){
        const got=[];
        if(!s||!s.avatar)return got;
        for(const row of entries){
            if(!released(row)||!qualified(s,row)||s.flags[key(row)])continue;
            const S=R.State,owned=row.kind==='creature'?S.copiesOf(s,row.id):S.cardCopies(row.kind,row.id,s);
            // Existing historical copies satisfy the entitlement. Never refill a released reward.
            const due=Math.max(0,row.quantity-owned);let granted=0;
            for(let i=0;i<due;i++){
                if(row.kind==='creature'){
                    let uid='plot:'+row.id+':'+(owned+i);
                    const existing=(s.creatures||[]).concat(s.trophies||[]);
                    while(existing.some(c=>c.uid===uid))uid+='x';
                    const c=S.makeCreature(row.id,{uid,variant:{attack:0,health:0,trait:null},foil:false});
                    if(S.addCreature(s,c,{story:row.id}))granted++;
                }else if(S.grantPrint(row.kind,row.id,s,{foil:false,story:row.id}))granted++;
            }
            const receipt={v:1,kind:row.kind,id:row.id,node:row.node,quantity:row.quantity,granted};
            s.flags[key(row)]=receipt;got.push(receipt);
        }
        return got;
    }
    let reconciling=false;
    function catchUp(){
        if(reconciling||!pending(R.State.get()))return [];
        let got=[];reconciling=true;
        try{R.State.update(s=>{got=claim(s);});}finally{reconciling=false;}
        if(got.some(r=>r.granted))R.bus.emit('plot-cards:granted',got);
        return got;
    }
    function sourceText(kind,id,s){
        const row=story(kind,id);if(!row)return '';
        const known=(s.map.revealed||[]).includes(row.node)||(s.map.completed||[]).includes(row.node);
        if(s.flags[key(row)])return 'Story reward · earned from '+R.World.node(row.node).name;
        return known?'Story reward · complete '+R.World.node(row.node).name:'Story reward · continue the story';
    }
    R.Acquisition={entries,story,released,packEligible,qualified,pending,claim,catchUp,sourceText};
})(typeof window!=='undefined'?window:globalThis);
