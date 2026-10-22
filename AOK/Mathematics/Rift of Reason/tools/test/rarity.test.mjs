import test from 'node:test';
import assert from 'node:assert/strict';
import {loadRift} from './harness.mjs';
import {loadWithDom} from './fake-dom.mjs';

const files=['js/core/rift.js','js/core/state.js','js/core/world.js','data/creatures.js','data/items.js','data/tactics.js','data/axioms.js','data/starters.js','data/fate.js',
    'js/battle/abilities.js','js/battle/engine.js','js/battle/team-codes.js'];
const plain=x=>JSON.parse(JSON.stringify(x));
const tom='reason-premise-pigeon';

test('five stable tiers have distinct non-colour cues; historical released cards default Common without releasing studies',()=>{
    const R=loadRift(files),T=R.data.tactics,A=R.data.axioms;
    assert.deepEqual(plain(R.Rarity.ids),['common','uncommon','rare','mythic','legendary']);
    const tiers=R.Rarity.ids.map(rarity=>R.Rarity.of({rarity}));
    assert.equal(new Set(tiers.map(r=>r.mark)).size,5);
    assert.deepEqual(plain(tiers.map(r=>r.rank)),[0,1,2,3,4]);
    for(const c of Object.values(R.data.creatures)) assert.ok(R.Rarity.ids.includes(c.rarity));
    for(const id of R.data.tacticDecks.starter.concat(R.data.tacticDecks.earned)) assert.equal(T[id].rarity,'common');
    for(const ax of Object.values(A).filter(a=>a.pack!=='fate')) assert.ok(R.Rarity.ids.includes(ax.rarity));
    for(const value of [undefined,'newer-tier','__proto__','toString']) assert.equal(R.Rarity.of({rarity:value}).id,'common');
    assert.equal(T['clean-slate'].rarity,undefined); assert.equal(A['patient-plans'].rarity,undefined);
    const s=R.State.freshState();
    assert.ok(!R.State.ownedTactics(s).includes('clean-slate')); assert.ok(!R.State.ownedAxioms(s).includes('patient-plans'));
});

test('Mythic preserves ordinary copy/release/deck rules and exact backup/team codes, independently of foil',async()=>{
    const R=loadRift(files),S=R.State,s=S.freshState();
    R.data.creatures[tom].rarity='mythic'; R.data.tactics['generic-small-patch'].rarity='mythic'; R.data.axioms['flux-plays-plus-1'].rarity='mythic';
    s.avatar={type:'owlet',variant:'girl',nickname:'Rarity'}; S.grantStarter(s);
    s.creatures[0].species=tom;s.creatures[1].species=tom;s.creatures[0].foil=true;
    // A payload's suggested tier cannot turn this species into a protected Legendary.
    s.creatures[0].rarity='legendary';
    assert.equal(S.copyCap(tom),4);assert.equal(S.isLegendary(tom),false);
    assert.equal(S.releaseCheck(s,s.creatures[0].uid).ok,true);
    const deck=S.ownDeck(s);assert.equal(deck.check.valid,true);
    for(let i=0;i<4;i++) assert.equal(S.grantPrint('tactic','generic-small-patch',s,{foil:!!(i%2)}),true);
    assert.equal(S.grantPrint('tactic','generic-small-patch',s),false);
    S.unlockColourTactics(s);
    const before=plain({creatures:s.creatures,team:s.team,deck:s.deckTactics,loadout:s.axiomLoadout,prints:s.cardPrints});
    for(const code of [S.encode('save',s),await S.encodePacked('save',s)]){
        const back=S.checkSave(await S.decodeAsync('save',code));
        assert.deepEqual(plain({creatures:back.creatures,team:back.team,deck:back.deckTactics,loadout:back.axiomLoadout,prints:back.cardPrints}),before);
        assert.equal(S.ownDeck(back).check.valid,true);
    }
    const TC=R.Battle.TeamCodes,ghost=TC.importTeam(TC.exportTeam({nickname:'Rarity',creatures:deck.team,tactics:deck.tactics,axioms:deck.axioms}));
    assert.equal(ghost.team.filter(c=>c.species===tom).length,2);
    const battle=R.Battle.Engine.createBattle({players:[{team:ghost.team,tactics:ghost.tactics},{team:ghost.team,tactics:ghost.tactics}],options:{openHand:[0,0],timeline:false}});
    assert.ok(Object.values(battle.cards).filter(c=>c.species===tom).every(c=>!c.legendary));
});

test('unapproved Mythic wild routes never spawn, catch, spend a charm or enter random opponents',()=>{
    const R=loadRift(files.concat(['js/core/catch-arcade.js','js/core/catch-games.js','js/core/catch-session.js']));
    const memory=new Map();R.storage=()=>({getItem:k=>memory.get(k)||null,setItem:(k,v)=>memory.set(k,v),removeItem:k=>memory.delete(k)});
    R.State.newGame();const s=R.State.get(); R.data.creatures[tom].rarity='mythic';s.items.charm=3;
    const node={id:'probe',type:'puzzle',spawns:['astrophysicat',tom]};
    assert.equal(R.World.spawnWeights(s,node,{stars:3,lured:true})[tom],undefined);
    s.flags['visitor:'+tom]=true;
    assert.notEqual(R.World.rollLoot(s,node,R.makeRng('mythic'),{stars:3}).species,tom);
    assert.equal(R.World.catchOdds(s,tom,'greatcharm',{stars:3,lured:true,skillBonus:1}),0);
    R.CatchSession.offer(s,'probe',tom,'mythic',true);
    assert.throws(()=>R.CatchSession.preview('probe','charm'),/no wild catch route/);
    const result=R.CatchSession.start('probe','charm',0);assert.equal(result.ok,false);assert.match(result.error,/no wild catch route/);
    assert.equal(R.State.get().items.charm,3);assert.equal(R.State.get().catchOffers.probe.board,null);
    for(let seed=0;seed<20;seed++) assert.ok(!R.Battle.Engine.randomTeam(R.makeRng(seed),20).some(c=>c.species===tom));
});

test('Collection filters use canonical tiers for creatures and both print kinds, without altering saved decks',()=>{
    let screen,modal;
    const g=loadWithDom(files.concat([ctx=>{
        const R=ctx.Rift,s=R.State.freshState();s.avatar={type:'owlet',variant:'girl',nickname:'Rarity'};R.State.grantStarter(s);
        R.data.creatures[tom].rarity='mythic';R.data.tactics['generic-small-patch'].rarity='mythic';R.data.axioms['flux-plays-plus-1'].rarity='mythic';
        s.creatures.push(R.State.makeCreature(tom));s.seen.push(tom);R.State.grantTactic('generic-small-patch',s);
        R.State.get=()=>s;R.data.accolades={};R.Screens={register:(id,def)=>{if(id==='collection')screen=def;}};R.Router={back(){},go(){},replace(){}};
        R.UI={hud:()=>R.el('div'),framedCard:id=>R.el('div',{text:R.data.creatures[id].name}),
            modal(title,body,buttons){modal={title,body,buttons,node:R.el('div')};return modal;}};
    },'js/screens/collection.js']));
    const R=g.Rift,s=R.State.get(),before=JSON.stringify(s),root=R.el('div');g.document.body.appendChild(root);screen.mount(root);
    const filter=root.querySelectorAll('select').find(n=>n.getAttribute('aria-label')==='Creature rarity');filter.value='mythic';filter.dispatchEvent({type:'change',target:filter});
    assert.equal(root.querySelectorAll('.dex-card').length,1);assert.match(root.querySelector('.dex-grid').textContent,/Tom Skink/);
    filter.value='legendary';filter.dispatchEvent({type:'change',target:filter});assert.equal(root.querySelectorAll('.dex-card').length,0,'undiscovered legendaries stay hidden');
    R.Collection.editCardFolders();const folders=modal.body.querySelectorAll('select').find(n=>n.getAttribute('aria-label')==='Spell and Axiom rarity');folders.value='mythic';folders.dispatchEvent({type:'change',target:folders});
    const names=modal.body.querySelectorAll('[data-print-folder]').map(n=>n.textContent).join(' ');
    assert.match(names,/Small Patch/);assert.match(names,/One More Move/);assert.doesNotMatch(names,/Counterexample/);
    assert.equal(JSON.stringify(s),before);
    for(const rarity of R.Rarity.ids){const badge=R.Rarity.badge({rarity});assert.match(badge.getAttribute('aria-label'),new RegExp(R.Rarity.of({rarity}).label));assert.ok(badge.textContent.includes(R.Rarity.of({rarity}).mark));}
});
