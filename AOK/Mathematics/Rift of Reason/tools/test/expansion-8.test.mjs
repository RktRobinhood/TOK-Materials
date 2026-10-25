// #129 expansion-8: bounded keyword counters and public stat positioning.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {Rift as R,E,AI,setup,act,onBoard,toHand,toDiscard,pass,rule,hp,atk,invariants} from './battle-helpers.mjs';
import {loadRift,GAME_DIR} from './harness.mjs';
const SPELLS=['perception-expose-the-shield','language-ask-again','language-hold-the-floor','generic-settle-down',
    'perception-strip-the-illusion','imagination-try-another-shape','generic-clean-cut','imagination-impossible-position'];
const battle=opts=>setup({...opts,options:{deckSize:Math.max(1,(opts.p0||[]).length+(opts.t0||[]).length,(opts.p1||[]).length+(opts.t1||[]).length),minCreatures:0,maxCreatures:20,...(opts.options||{})}});
const play=(s,cid,target)=>act(toHand(s,cid),{type:'play',cid,...(target?{target}:{})});

test('Expose the Shield removes effective printed/granted/timed Shield, otherwise lowers attack for this turn only',()=>{
    assert.ok(R.data.tactics['perception-expose-the-shield']);
    for(const mode of ['printed','granted','timed','spent','none']){
        let s=battle({p0:['beastie'],p1:['beastie'],t0:['perception-expose-the-shield']});onBoard(s,'p0c0','p1c0');
        const c=s.cards.p1c0;c.attack=3;c.health=6;c.damage=2;
        c.baseKeywords=mode==='printed'||mode==='spent'?['shield']:[];c.extraKeywords=mode==='granted'?['shield']:[];
        c.shieldUsed=mode==='spent';if(mode==='timed')c.timedKeywords=[{k:'shield',mode:'gain',until:3,label:'Earlier Shield'}];
        const had=E.hasKeyword(s,'p1c0','shield');s=play(s,'p0t0','p1c0');
        assert.equal(E.hasKeyword(s,'p1c0','shield'),false);assert.equal(atk(s,'p1c0'),had?3:2);assert.equal(s.cards.p1c0.damage,2);
        assert.equal(s.players[0].energy,9);assert.equal(s.players[0].playsThisTurn,1);s=pass(s);assert.equal(atk(s,'p1c0'),3);assert.equal(E.hasKeyword(s,'p1c0','shield'),false);invariants(s,assert);
    }
    const s=battle({p0:['beastie'],p1:['beastie'],t0:['perception-expose-the-shield']});onBoard(s,'p0c0','p1c0');toHand(s,'p0t0');s.cards.p1c0.extraKeywords=['shield','elusive'];
    assert.ok(!E.legalActions(s).some(a=>a.type==='play'&&a.cid==='p0t0'),'ordinary Elusive exclusion remains');
});

test('Ask Again can reach Elusive, strips only that keyword and applies a nonnegative attack penalty this turn',()=>{
    assert.ok(R.data.tactics['language-ask-again']);
    for(const attack of [0,3]){
        let s=battle({p0:['beastie'],p1:['beastie'],t0:['language-ask-again']});onBoard(s,'p0c0','p1c0');
        const c=s.cards.p1c0;c.attack=attack;c.extraKeywords=['elusive','guard','shield'];c.damage=1;
        s=play(s,'p0t0','p1c0');assert.equal(E.hasKeyword(s,'p1c0','elusive'),false);assert.ok(E.hasKeyword(s,'p1c0','guard'));assert.ok(E.hasKeyword(s,'p1c0','shield'));
        assert.equal(atk(s,'p1c0'),Math.max(0,attack-1));assert.equal(s.cards.p1c0.damage,1);assert.equal(s.cards.p1c0.silenced,false);
        s=pass(s);assert.equal(atk(s,'p1c0'),attack);assert.equal(E.hasKeyword(s,'p1c0','elusive'),false);invariants(s,assert);
    }
});

test('Hold the Floor thaws only Freeze, conditionally heals one and gives ordinary until-next-start Guard without readying',()=>{
    assert.ok(R.data.tactics['language-hold-the-floor']);
    for(const frozen of [false,true]){
        let s=battle({p0:['beastie'],p1:['beastie'],t0:['language-hold-the-floor']});onBoard(s,'p0c0','p1c0');
        const c=s.cards.p0c0;c.health=3;c.damage=1;c.frozen=frozen;c.frozenUntil=frozen?5:null;c.attacks=1;c.activated=true;c.enteredTurn=s.turn;
        s=play(s,'p0t0','p0c0');assert.ok(E.hasKeyword(s,'p0c0','guard'));assert.equal(hp(s,'p0c0'),frozen?3:2);assert.equal(s.cards.p0c0.frozen,false);assert.equal(s.cards.p0c0.frozenUntil,null);
        assert.equal(s.cards.p0c0.attacks,1);assert.equal(s.cards.p0c0.activated,true);assert.equal(s.cards.p0c0.enteredTurn,1);assert.equal(E.canAttack(s,'p0c0'),false);
        assert.equal(s.players[0].playsThisTurn,1);s=pass(s);assert.ok(E.hasKeyword(s,'p0c0','guard'));s=pass(s);assert.equal(E.hasKeyword(s,'p0c0','guard'),false);invariants(s,assert);
    }
});

test('Settle Down lasts through the enemy next turn end, then removes only its own penalty while later boosts survive',()=>{
    assert.ok(R.data.tactics['generic-settle-down']);
    let s=battle({p0:['beastie'],p1:['beastie'],t0:['generic-settle-down']});onBoard(s,'p0c0','p1c0');s.cards.p1c0.attack=3;
    s=play(s,'p0t0','p1c0');assert.equal(atk(s,'p1c0'),2);s.cards.p1c0.buffs.push({attack:2,health:1,temp:false,label:'Later boost'});
    s=pass(s);assert.equal(atk(s,'p1c0'),4);s=pass(s);assert.equal(atk(s,'p1c0'),5);assert.ok(s.cards.p1c0.buffs.some(b=>b.label==='Later boost'));invariants(s,assert);
    let one=battle({p0:['beastie'],p1:['beastie'],t0:['generic-settle-down']});onBoard(one,'p0c0','p1c0');one.cards.p1c0.attack=1;
    one=play(one,'p0t0','p1c0');assert.equal(atk(one,'p1c0'),0);invariants(one,assert);
});

test('Strip the Illusion reaches Elusive and removes keywords plus every timed stat row without Silence, thaw or healing',()=>{
    assert.ok(R.data.tactics['perception-strip-the-illusion']);
    let s=battle({p0:['beastie'],p1:['beastie'],t0:['perception-strip-the-illusion']});onBoard(s,'p0c0','p1c0');
    const c=s.cards.p1c0;c.attack=3;c.health=4;c.damage=3;c.frozen=true;c.frozenUntil=5;
    c.baseKeywords=['guard'];c.extraKeywords=['elusive','shield','swift'];c.timedKeywords=[{k:'shield',mode:'gain',until:3,label:'Earlier Shield'}];
    c.buffs=[{attack:1,health:2,temp:false,label:'Permanent boost'}, {attack:2,health:1,temp:true,label:'This-turn boost'},
        {attack:-1,health:0,temp:false,untilTurn:4,label:'Timed penalty'}, {attack:0,health:2,temp:false,untilStart:3,label:'Timed health'}];
    const ability=c.ability;s=play(s,'p0t0','p1c0');
    assert.deepEqual(Array.from(E.keywordsOf(s,'p1c0')),[]);assert.equal(s.cards.p1c0.buffs.length,1);assert.equal(s.cards.p1c0.buffs[0].label,'Permanent boost');
    assert.equal(s.cards.p1c0.attack,3);assert.equal(s.cards.p1c0.health,4);assert.equal(s.cards.p1c0.damage,3);assert.equal(atk(s,'p1c0'),4);assert.equal(hp(s,'p1c0'),3);
    assert.equal(s.cards.p1c0.ability,ability);assert.equal(s.cards.p1c0.silenced,false);assert.equal(s.cards.p1c0.frozen,true);assert.equal(s.cards.p1c0.frozenUntil,5);invariants(s,assert);
});

test('removing temporary health finishes ordinary defeats and Last Words before normal/reversed Win',()=>{
    for(const reversed of [false,true]){
        let s=battle({p0:['beastie'],p1:['emotion-grudge-goose'],t0:['perception-strip-the-illusion']});onBoard(s,'p0c0','p1c0');
        s.cards.p1c0.health=2;s.cards.p1c0.damage=3;s.cards.p1c0.buffs=[{attack:0,health:2,temp:true,label:'Fragile extra health'}];s.players[0].hearts=1;if(reversed)rule(s,'reverse-hearts');
        s=play(s,'p0t0','p1c0');assert.equal(s.players[0].hearts,0);assert.ok(s.players[1].discard.includes('p1c0'));assert.equal(s.winner,reversed?0:1);
        assert.ok(s.lastEvents.some(e=>e.t==='defeated'));invariants(s,assert);
    }
});

test('Strip removes actual repeatable-Fate boosts and resolves health loss while preserving the source event and other creatures',()=>{
    let s=battle({p0:['beastie','emotion-grudge-goose'],p1:['beastie'],t0:['echoing-encouragement'],t1:['perception-strip-the-illusion'],
        options:{timeline:true,fateStart:9,fateGap:3,hearts:30}});onBoard(s,'p0c0','p0c1','p1c0');s.cards.p0c0.health=6;s.cards.p0c1.health=1;
    s=play(s,'p0t0');s=pass(s);s=pass(s); // The real repeatable space fires at the round end.
    const ev=E.fateSchedule(s).find(e=>e.def==='echoing-encouragement');assert.ok(ev&&ev.live);assert.ok(s.cards.p0c1.buffs.some(b=>b.fate===ev.id));
    s=pass(s);s.cards.p0c1.damage=1;s.cards.p0c0.buffs.push({attack:1,health:1,temp:false,label:'Unrelated lasting boost'});toHand(s,'p1t0');
    assert.deepEqual(Array.from(E.keywordsOf(s,'p0c1')),[],'the event-lifetime row is the only reason this target qualifies');
    assert.ok(E.legalActions(s).some(a=>a.type==='play'&&a.cid==='p1t0'&&a.target==='p0c1'));
    const queue=JSON.stringify(E.fateSchedule(s)),hearts=s.players[1].hearts;
    s=act(s,{type:'play',cid:'p1t0',target:'p0c1'});assert.ok(s.players[0].discard.includes('p0c1'));assert.equal(s.players[1].hearts,hearts-1);
    assert.equal(JSON.stringify(E.fateSchedule(s)),queue,'removing this modifier does not cancel or rewrite its event');
    assert.ok(s.cards.p0c0.buffs.some(b=>b.fate===ev.id));
    for(let turns=0;turns<8&&E.fateSchedule(s).find(e=>e.id===ev.id).live;turns++)s=pass(s);
    assert.equal(E.fateSchedule(s).find(e=>e.id===ev.id).state,'expired');assert.ok(!s.cards.p0c0.buffs.some(b=>b.fate===ev.id));
    assert.ok(s.cards.p0c0.buffs.some(b=>b.label==='Unrelated lasting boost'));assert.ok(s.players[0].discard.includes('p0c1'));invariants(s,assert);
});

test('Try Another Shape uses normal lasting swap semantics with temporary boosts, damage and later changes',()=>{
    assert.ok(R.data.tactics['imagination-try-another-shape']);
    let s=battle({p0:['beastie'],p1:['beastie'],t0:['imagination-try-another-shape']});onBoard(s,'p0c0','p1c0');
    const c=s.cards.p0c0;c.attack=2;c.health=5;c.damage=2;c.buffs=[{attack:1,health:1,temp:false,label:'Lasting'}, {attack:2,health:2,temp:true,label:'This turn'}];
    assert.equal(atk(s,'p0c0'),5);assert.equal(hp(s,'p0c0'),6);s=play(s,'p0t0','p0c0');assert.equal(atk(s,'p0c0'),6);assert.equal(hp(s,'p0c0'),5);
    assert.equal(s.cards.p0c0.damage,0);assert.equal(s.cards.p0c0.buffs.length,1);assert.equal(s.cards.p0c0.buffs[0].health,0);
    s.cards.p0c0.buffs.push({attack:1,health:2,temp:false,label:'Later'});s.cards.p0c0.damage=1;s=pass(s);
    assert.equal(atk(s,'p0c0'),5);assert.equal(hp(s,'p0c0'),6);assert.equal(s.cards.p0c0.damage,1);invariants(s,assert);
    let zero=battle({p0:['emotion-grudge-goose','proof-pup'],p1:['beastie'],t0:['imagination-try-another-shape']});onBoard(zero,'p0c0','p1c0');zero.cards.p0c0.attack=0;
    zero=play(zero,'p0t0','p0c0');assert.ok(zero.players[0].discard.includes('p0c0'));assert.equal(zero.players[1].hearts,9);invariants(zero,assert);
});

test('Clean Cut uses two damage only for an existing colourless token and ordinary prevention/leave-play rules',()=>{
    assert.ok(R.data.tactics['generic-clean-cut']);
    for(const shield of [false,true]){
        let s=battle({p0:['beastie'],p1:['imagination-cloud-castle-crab'],t0:['counterexample','generic-clean-cut']});onBoard(s,'p0c0','p1c0');
        s=play(s,'p0t0','p1c0');const token=s.players[1].board.find(cid=>s.cards[cid].token);assert.ok(token);
        s.cards[token].buffs.push({attack:0,health:2,temp:false,label:'Earlier health'});if(shield)s.cards[token].extraKeywords=['shield'];
        s=play(s,'p0t1',token);assert.equal(hp(s,token),shield?3:1);assert.equal(s.cards[token].shieldUsed,shield);
        if(!shield)assert.equal(s.lastEvents.find(e=>e.t==='damage'&&e.cid===token).amount,2);invariants(s,assert);
    }
    let ordinary=battle({p0:['beastie'],p1:['beastie'],t0:['generic-clean-cut']});onBoard(ordinary,'p0c0','p1c0');ordinary.cards.p1c0.colourless=true;const before=hp(ordinary,'p1c0');
    ordinary=play(ordinary,'p0t0','p1c0');assert.equal(hp(ordinary,'p1c0'),before-1);invariants(ordinary,assert);
    let coloured=battle({p0:['beastie'],p1:['beastie'],t0:['tomorrows-idea'],t1:['generic-clean-cut'],options:{timeline:true,fateStart:9,fateGap:3}});onBoard(coloured,'p0c0','p1c0');
    coloured=play(coloured,'p0t0');coloured=pass(coloured);coloured=pass(coloured);
    const idea=coloured.players[0].board.find(cid=>coloured.cards[cid].token);assert.ok(idea);assert.equal(E.colourOf(coloured,coloured.cards[idea]),'imagination');
    coloured=pass(coloured);coloured=play(coloured,'p1t0',idea);assert.equal(hp(coloured,idea),1);invariants(coloured,assert);
});

test('Impossible Position swaps two distinct public current attacks including negative raw modifiers, preserving controllers/health/later boosts',()=>{
    assert.ok(R.data.tactics['imagination-impossible-position']);
    for(const second of ['p1c0','p0c1','p1c1'])for(const negative of [false,true]){
        let s=battle({p0:['beastie','beastie'],p1:['beastie','beastie'],t0:['imagination-impossible-position']});onBoard(s,'p0c0','p0c1','p1c0','p1c1');
        s.cards.p0c0.attack=negative?2:3;s.cards.p0c0.health=6;s.cards.p0c0.damage=1;
        if(negative)s.cards.p0c0.buffs.push({attack:-6,health:0,temp:false,label:'Existing lasting penalty'});s.cards[second].attack=5;
        const a=atk(s,'p0c0'),b=atk(s,second),health=hp(s,'p0c0'),owner=s.cards[second].controller;
        s=play(s,'p0t0','p0c0');assert.equal(s.phase,'choose');assert.equal(s.pending.first,'p0c0');assert.ok(!s.pending.options.includes('p0c0'));
        s=act(JSON.parse(JSON.stringify(s)),{type:'choose',choice:second});assert.equal(atk(s,'p0c0'),b);assert.equal(atk(s,second),a);
        assert.equal(hp(s,'p0c0'),health);assert.equal(s.cards[second].controller,owner);assert.equal(s.players[0].energy,5);assert.equal(s.players[0].playsThisTurn,1);
        s.cards.p0c0.buffs.push({attack:2,health:0,temp:false,label:'Later boost'});assert.equal(atk(s,'p0c0'),b+2);
        s=pass(s);assert.equal(atk(s,'p0c0'),b+2);s=pass(s);assert.equal(atk(s,'p0c0'),negative?0:a+2);assert.equal(atk(s,second),b);assert.equal(hp(s,'p0c0'),health);invariants(s,assert);
    }
});

test('Impossible Position requires two legal distinct targets and public actions do not mutate their input or depend on hidden decks',()=>{
    let alone=battle({p0:['beastie'],p1:['beastie'],t0:['imagination-impossible-position']});onBoard(alone,'p0c0','p1c0');toHand(alone,'p0t0');
    alone.cards.p1c0.extraKeywords=['elusive'];assert.ok(!E.legalActions(alone).some(a=>a.type==='play'&&a.cid==='p0t0'));
    for(const id of SPELLS){
        const s=battle({p0:['beastie','proof-pup','cloud-calf'],p1:['beastie','proof-pup','cloud-calf'],t0:[id,'counterexample','pep-talk'],t1:['lemma','counterexample']});
        onBoard(s,'p0c0','p0c1','p1c0');toHand(s,'p0t0');s.cards.p0c0.damage=1;s.cards.p1c0.extraKeywords=['guard','shield','elusive'];
        s.cards.p1c0.buffs=[{attack:2,health:1,temp:true,label:'Earlier boost'}];s.cards.p0c1.attack=4;
        if(['perception-expose-the-shield','generic-settle-down','generic-clean-cut'].includes(id))s.cards.p1c0.extraKeywords=['guard','shield'];
        const before=JSON.stringify(s),other=E.cloneState(s);other.players[0].deck.reverse();other.players[1].deck.reverse();
        const actions=E.legalActions(s).filter(a=>a.type==='play'&&a.cid==='p0t0');assert.ok(actions.length,id);
        assert.deepEqual(E.previewAction(s,actions[0],0),E.previewAction(other,actions[0],0),id);
        for(const level of ['normal','competent','expert'])assert.equal(E.actionKey(AI.choose(s,{level})),E.actionKey(AI.choose(other,{level})),id+' '+level);
        const next=act(s,actions[0]);assert.equal(JSON.stringify(s),before,id+' input unchanged');
        if(next.pending){assert.ok(!next.pending.options.includes(next.pending.first));assert.ok(!next.pending.options.includes('p1c0'),'enemy Elusive cannot be a second target');}
        invariants(next,assert);
    }
});

test('keyword and positioning self-play uses legal decks, preserves zones and exercises the new spells',()=>{
    const creatures=['perception-cue-cricket','memory-recall-robin','imagination-fable-fawn','reason-premise-pigeon','beastie','language-label-lemur'];
    const d={creatures:creatures.flatMap(id=>[id,id]),tactics:SPELLS,axioms:R.State.axiomLoadout({})};
    const valid=R.State.validateDeck(d,{owned:SPELLS});assert.ok(valid.valid,valid.message);const seen=new Set();
    for(let seed=0;seed<12;seed++){
        const s=E.createBattle({seed:'expansion-8-selfplay:'+seed,players:[0,1].map(p=>({name:'P'+p,team:d.creatures.map((species,i)=>({uid:'e8-'+p+'-'+i,species,powerDelta:0,injuries:[],scars:[]})),tactics:d.tactics,axioms:d.axioms})),options:{first:seed%2}});
        if(seed>=6)rule(s,'reverse-hearts');
        const end=AI.playOut(s,[seed%4===0?'expert':'competent','competent'],(before,a,after)=>{if(a.type==='play'&&before.cards[a.cid].kind==='tactic')seen.add(before.cards[a.cid].tactic);invariants(after,assert);});
        assert.ok(end.winner!=null);assert.notEqual(end.endReason,'turn-limit');
    }
    // Public Shield / timed-boost situations absent from the ordinary low-cost cohort.
    for(const id of ['perception-expose-the-shield','perception-strip-the-illusion']){
        const s=E.createBattle({seed:'expansion-8-role:'+id,players:[0,1].map(p=>({name:'P'+p,team:d.creatures.map((species,i)=>({uid:'e8-role-'+p+'-'+i,species,powerDelta:0,injuries:[],scars:[]})),tactics:d.tactics,axioms:d.axioms})),
            options:{first:0,shuffle:false,openHand:[0,0],openAxioms:0,spark:false,timeline:false}});
        s.phase='main';s.players.forEach(P=>{P.capacity=6;P.energy=6;});onBoard(s,'p0c0','p0c1','p1c0');toHand(s,'p0t'+SPELLS.indexOf(id));
        s.players[1].hearts=2;s.cards.p0c0.attack=3;s.cards.p0c1.attack=3;s.cards.p0c0.health=3;s.cards.p0c1.health=3;
        s.cards.p1c0.extraKeywords=['shield','guard'];s.cards.p1c0.attack=5;s.cards.p1c0.health=3;
        if(id==='perception-strip-the-illusion')s.cards.p1c0.buffs.push({attack:3,health:3,temp:false,untilStart:3,label:'Earlier timed boost'});
        assert.equal(AI.choose(s,{level:'expert'}).cid,'p0t'+SPELLS.indexOf(id),id+' public payoff');
        const end=AI.playOut(s,['expert','competent'],(before,a,after)=>{if(a.type==='play'&&before.cards[a.cid].kind==='tactic')seen.add(before.cards[a.cid].tactic);invariants(after,assert);});
        assert.ok(end.winner!=null);assert.notEqual(end.endReason,'turn-limit');
    }
    assert.deepEqual(SPELLS.filter(id=>!seen.has(id)),[],'every selected spell is actually played');
});

test('keyword spells retain reviewed costs/rarities, pack/story exclusions, motif/text fit and canonical copy backups',async()=>{
    const cat=JSON.parse(fs.readFileSync(path.join(GAME_DIR,'design/drafts/card-arena-2026-10-12/card-catalogue.json'),'utf8'));
    const L=loadRift(['js/core/rift.js','js/core/state.js','js/core/acquisition.js','js/core/packs.js','data/creatures.js','data/items.js','data/map.js',
        'data/tactics.js','data/axioms.js','data/starters.js','data/assets.js','js/battle/abilities.js','js/battle/conditional-cards.js','js/ui/card-text.js']);
    const s=L.State.freshState();s.avatar={type:'owlet',variant:'girl'};L.State.grantStarter(s);const roster=L.Packs.roster(s),assets=fs.readFileSync(path.join(GAME_DIR,'data/assets.js'),'utf8'),rarities={};
    for(const id of SPELLS){
        const row=cat.cards.find(c=>c.id===id),d=L.data.tactics[id];assert.equal(row.runtimeRelease,'expansion-8',id);assert.equal(d.release,row.runtimeRelease);
        assert.equal(d.cost,row.cost);assert.equal(d.rarity,row.rarity);rarities[d.rarity]=(rarities[d.rarity]||0)+1;
        assert.ok(roster.some(r=>r.id===id&&r.weight>0));assert.ok(assets.includes("'"+d.art+"'"));assert.ok(L.CardText.fits(d.text,'framed'),id);
        assert.equal(L.State.grantPrint('tactic',id,s),true);assert.equal(L.State.grantPrint('tactic',id,s,{foil:true}),true);
    }
    assert.deepEqual(rarities,{common:6,rare:2});for(const row of L.Acquisition.entries)assert.ok(!roster.some(r=>r.id===row.id));
    for(const copy of [L.State.migrate(JSON.parse(JSON.stringify(s))),L.State.migrate(await L.State.decodeAsync('save',await L.State.encodePacked('save',s)))]){
        for(const id of SPELLS){assert.equal(L.State.cardCopies('tactic',id,copy),2);L.State.grantPrint('tactic',id,copy);L.State.grantPrint('tactic',id,copy);assert.equal(L.State.grantPrint('tactic',id,copy),false);}
    }
});
