/* Shared scratch fixtures for browser play and measured matches. Not loaded by production. */
(function (root) {
    'use strict';
    const R = root.Rift;
    const colours = ['reason','emotion','perception','language','imagination','memory'];
    const newcomers = ['reason-premise-pigeon','emotion-courage-cub','perception-cue-cricket','language-question-quail','imagination-fable-fawn','memory-recall-robin'];
    const twice = xs => xs.flatMap(x => [x,x]);
    function deck(colour, mixed) {
        const primary = colours.indexOf(colour), other = colours[(primary+1)%6];
        function species(c,n) {
            const fresh = newcomers[colours.indexOf(c)];
            return [fresh].concat(Object.keys(R.data.creatures).filter(id => id !== fresh && R.data.creatures[id].release !== 'plot-1' && R.data.creatures[id].colour === c && R.data.creatures[id].rarity !== 'legendary')
                .sort((a,b)=>R.data.creatures[a].cost-R.data.creatures[b].cost || a.localeCompare(b))).slice(0,n);
        }
        const creatures = twice(mixed ? species(colour,2).concat(species(other,2)) : species(colour,4));
        const colourSpells = R.data.tacticDecks.colour;
        const tactics = twice(['counterexample','pep-talk','stand-firm','generic-small-patch'].concat(mixed ? [colourSpells[colour][0],colourSpells[other][1]] : colourSpells[colour].slice(0,2)));
        return { creatures,tactics,axioms:R.data.starterDecks.axioms.slice() };
    }
    function player(d,p) {
        return { name:p?'Rival':'You',team:d.creatures.map((species,i)=>({uid:'foundation-'+p+'-'+i,species,powerDelta:0,injuries:[],scars:[]})),tactics:d.tactics,axioms:d.axioms };
    }
    function move(s,cid,zone,front) {
        const c=s.cards[cid];
        s.players.forEach(P=>['deck','hand','board','discard'].forEach(z=>{const i=P[z].indexOf(cid);if(i>=0)P[z].splice(i,1);}));
        const list=s.players[c.owner][zone]; if(front)list.unshift(cid);else list.push(cid);
        if(zone==='board')c.enteredTurn=0;
    }
    function sample(id,mixed) {
        const E=R.Battle.Engine, colour=id==='generic-small-patch'?'imagination':R.data.creatures[id].colour;
        const d=deck(colour,mixed), rival=deck(colours[(colours.indexOf(colour)+3)%6],true);
        const s=E.createBattle({seed:'foundation-browser-'+id,players:[player(d,0),player(rival,1)],
            options:{first:0,shuffle:false,shuffleAxioms:false,openHand:[0,0],openAxioms:0,spark:false,timeline:false}});
        s.phase='main';s.players.forEach(P=>{P.energy=10;P.capacity=10;});
        const cid=Object.keys(s.cards).find(k=>s.cards[k].owner===0&&(id==='generic-small-patch'?s.cards[k].tactic===id:s.cards[k].species===id));
        move(s,cid,'hand');
        let target=null;
        if(['language-question-quail','imagination-fable-fawn','generic-small-patch'].includes(id)) {
            target=Object.keys(s.cards).find(k=>s.cards[k].owner===0&&s.cards[k].kind==='creature'&&k!==cid);
            move(s,target,'board');
            if(id==='language-question-quail'){s.cards[target].frozen=true;s.cards[target].frozenUntil=99;}
            if(id==='imagination-fable-fawn'){s.cards[target].attack=1;s.cards[target].health=4;}
            if(id==='generic-small-patch'){s.cards[target].health=5;s.cards[target].damage=4;}
        }
        if(id==='emotion-courage-cub')s.players[0].hearts=s.players[0].maxHearts-1;
        if(id==='reason-premise-pigeon')move(s,Object.keys(s.cards).find(k=>s.cards[k].owner===0&&s.cards[k].tactic==='generic-small-patch'),'deck',true);
        if(id==='memory-recall-robin') {
            for(const name of ['counterexample','generic-small-patch'])move(s,Object.keys(s.cards).find(k=>s.cards[k].owner===0&&s.cards[k].tactic===name),'discard');
        }
        return {s,cid,target};
    }
    R.FoundationFixtures={colours,newcomers,deck,player,sample};
})(typeof window!=='undefined'?window:globalThis);
