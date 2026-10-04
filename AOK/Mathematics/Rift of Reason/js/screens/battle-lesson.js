(function (root) {
    'use strict';
    const Rift=root.Rift;
    const el=(...args)=>Rift.el(...args);
    function mount(container, params) {
        const L=Rift.Battle.Lesson, E=Rift.Battle.Engine;
        let state=L.create(), index=0, tour=null, help=null, closed=false;
        const screen=el('div.battle-lesson.panel');
        container.append(Rift.Assets.img('scene/battle-table',{className:'scene-bg',label:'Granny’s card table'}),screen);
        function leave(won) {if(closed)return;closed=true;if(tour)tour.close();if(help)help.close();if(params&&params.onEnd)params.onEnd(won);else Rift.Router.replace('collection');}
        function rules(){if(help)return;if(tour){tour.close();tour=null;}help=Rift.Battles.rules(()=>{help=null;});}
        function card(cid) {
            const c=state.cards[cid], sp=Rift.data.creatures[c.species];
            return el('div.lesson-card',null,[
                Rift.Assets.img('creature/'+c.species+'/idle',{label:sp.name,alt:sp.name}),
                el('strong',{text:sp.name}),el('span',{text:Rift.COLOURS[c.colour].name+' · Power '+E.power(state,cid)}),
            ]);
        }
        function row(ids) {return ids.length?ids.map(card):[el('p.small.muted',{text:'No creatures here yet.'})];}
        function render() {
            if(tour){tour.close();tour=null;}
            screen.innerHTML='';
            const done=index===L.steps.length;
            const step=done?null:L.steps[index], ax=Rift.data.axioms[state.axioms.current];
            screen.append(
                el('div.row.wrap.lesson-controls',null,[el('h2',{text:done?'You won the lesson!':'Learn the card game · '+(index+1)+' / '+L.steps.length}),
                    el('button.btn.small',{text:'How to play',onclick:rules}),
                    el('button.btn.small',{text:'Leave lesson',onclick:()=>leave(false)})]),
                el('p.small',{text:'Loaned cards. No stakes or fate rolls. Abilities are paused for this first lesson. Granny’s moves are scripted.'}),
                el('div.lesson-score.row.wrap',{role:'status',text:'Your lives: '+state.players[0].lives+' · Your steals: '+state.players[0].steals+' · Granny’s lives: '+state.players[1].lives}),
                el('div.lesson-axiom.panel',null,[el('strong',{text:'Shared axiom: '+ax.name}),el('p',{text:ax.text})]),
                (index===4||index===5)?comparison():el('span'),
                el('h3',{text:'Granny’s board'}),el('div.lesson-opponent.row.wrap',null,row(state.players[1].board)),
                el('h3',{text:'Your board'}),el('div.lesson-board.row.wrap',null,row(state.players[0].board)),
                el('details.lesson-hand', {open:index===0},[el('summary',{text:'Your hand · '+state.players[0].hand.length+' cards'}),el('div.row.wrap',null,row(state.players[0].hand))]),
                el('div.lesson-controls.panel',null,[el('p',{text:done?'Same cards, different axioms, different results. In mathematics, axioms are starting rules; conclusions depend on them. Try a real match next.':step.text}),
                    el('button.btn.primary',{text:done?'Finish lesson':step.label,onclick(){if(done){leave(true);return;}state=L.advance(state,index);index++;render();}}),
                    !done?el('button.btn.small',{text:'Show this step',onclick:showStep}):el('span')]),
            );
            if(!done)showStep();
        }
        function comparison(){
            const ordinary=E.fightOutcome(Object.assign({},state,{axioms:Object.assign({},state.axioms,{current:'empty-set'})}),'p0c1','p1c2');
            const changed=E.fightOutcome(state,'p0c1','p1c2');
            function line(label,out){return el('p',{text:label+': Astrophysicat '+out.pa+' vs Speedcheeta '+out.pb+' → '+(out.attackerDefeated?'Speedcheeta':'Astrophysicat')+' wins.'});}
            return el('div.lesson-comparison.panel',{role:'status'},[
                el('strong',{text:'Same cards: two fight previews'}),line('Normal rules',ordinary),line('Underdog',changed),
                el('p.small.muted',{text:'Fight preview only. This spends no move.'}),
            ]);
        }
        function showStep(){if(tour)tour.close();const step=L.steps[index];tour=Rift.Tutorial.play(screen,[Object.assign({},step,{progress:(index+1)+'/'+L.steps.length})],'granny');}
        render();
        return {destroy(){closed=true;if(tour)tour.close();if(help)help.close();},get state(){return state;}};
    }
    Rift.Screens.register('battle-lesson',{mount});
})(typeof window !== 'undefined'?window:globalThis);
