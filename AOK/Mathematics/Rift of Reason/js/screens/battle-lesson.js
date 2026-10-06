/* Guided practice: the learner clicks real cards; replies use the real engine. */
(function (root) {
    'use strict';
    const Rift=root.Rift, el=(...args)=>Rift.el(...args);
    function mount(container, params) {
        const L=Rift.Battle.Lesson, E=Rift.Battle.Engine;
        let state=L.create(), index=0, help=null, closed=false, busy=false, timer=null, notice='';
        const animations=new Set();
        const screen=el('div.battle-lesson.panel');
        container.append(Rift.Assets.img('scene/battle-table',{className:'scene-bg',label:'Granny’s card table'}),screen);
        function stop(){if(timer!==null)root.clearTimeout(timer);timer=null;animations.forEach(a=>a.cancel());animations.clear();if(Rift.Audio)Rift.Audio.stopVoice();}
        function leave(won){if(closed)return;closed=true;stop();if(help)help.close();if(params&&params.onEnd)params.onEnd(won);else Rift.Router.replace('collection');}
        function rules(){if(help||busy)return;stop();help=Rift.Battles.rules(()=>{help=null;focusTarget();});}
        function targetCid(){const action=L.steps[index]&&L.steps[index].actions[0];return action&&(action.cid||(action.type==='steal'?'p1c1':null));}
        function card(cid){
            const c=state.cards[cid], sp=Rift.data.creatures[c.species], active=!busy&&cid===targetCid();
            return el(active?'button.lesson-card.lesson-target':'div.lesson-card',Object.assign({'data-cid':cid},active?{type:'button','aria-label':L.steps[index].label,onclick:act}:{}),[
                active?el('span.lesson-pointer',{text:'↓ '+L.steps[index].label}):null,
                Rift.Assets.img('creature/'+c.species+'/idle',{label:sp.name,alt:sp.name}),
                el('strong',{text:sp.name}),el('span',{text:E.playCost(state,cid)+' energy · Power '+E.power(state,cid)}),el('span',{text:c.exhausted?'Exhausted':state.players[c.controller].board.includes(cid)?E.readyToUse(state,cid)?'Ready / can block':'Arriving / can block':'In hand'}),
            ]);
        }
        function row(ids){return ids.length?ids.map(card):[el('p.small.muted',{text:'No creatures here yet.'})];}
        function focusTarget(){const target=screen.querySelector('.lesson-target');if(target&&target.focus){target.focus({preventScroll:true});if(target.scrollIntoView)target.scrollIntoView({block:'nearest',behavior:'auto'});}}
        function speak(){const step=L.steps[index];if(step&&Rift.Audio)Rift.Audio.speak({speaker:'granny',text:step.text,voice:Rift.voiceId('granny',step.text)});}
        function render(){
            screen.innerHTML='';
            const done=index===L.steps.length, step=done?null:L.steps[index];
            screen.append(
                el('div.row.wrap.lesson-header',null,[el('h2',{text:done?'You won the lesson!':'Card minigame · '+(index+1)+' / '+L.steps.length}),
                    el('button.btn.small',{text:'How to play',disabled:busy,onclick:rules}),el('button.btn.small',{text:'Leave lesson',onclick:()=>leave(false)})]),
                el('p.small.lesson-safety',{text:'Practice with loaned cards. Nothing is at risk. One heart each for this learning match; six in normal matches.'}),
                el('div.lesson-layout',null,[
                    el('div.lesson-table',null,[
                        el('div.lesson-score.row.wrap',{role:'status',text:'You: '+state.players[0].lives+' heart · Energy '+state.players[0].energy+'/'+state.players[0].capacity+' · '+(state.active===0?'Your':'Granny’s')+' actions: '+E.actionsLeft(state)+'/'+E.rules(state).actions+' left · Granny: '+state.players[1].lives+' heart'}),
                        el('h3',{text:'Granny’s board'}),el('div.lesson-opponent.row',null,row(state.players[1].board)),
                        el('h3',{text:'Your board'}),el('div.lesson-board.row',null,row(state.players[0].board)),
                        el('h3',{text:'Your hand · click a highlighted card to play it'}),el('div.lesson-hand.row',null,row(state.players[0].hand)),
                    ]),
                    el('aside.lesson-guide',null,[
                        el('div.lesson-coach.panel',null,[Rift.Assets.img(Rift.data.speakers.granny.art,{className:'tutorial-face',label:'Granny Axiom'}),
                            el('h3',{text:done?'Ready for a match':step.title}),
                            el('p',{text:done?'You spent energy, used multiple actions, exhausted creatures and rewrote two rules. A real match has six hearts. Check Rules now and the timeline before choosing.':step.text}),
                            el('p.lesson-notice',{role:'status','aria-live':'polite',text:done?'Practice complete. Your collected cards are safe.':notice||'Your turn. Follow the gold arrow.'}),
                            done?el('button.btn.primary.lesson-target',{text:'Finish lesson',onclick:()=>leave(true)}):
                                el('button.btn.small',{text:'Hear this step again',disabled:busy,onclick:speak}),
                        ]),
                        !done&&!busy&&!targetCid()?el('button.btn.primary.lesson-target',{text:step.label,onclick:act}):null,
                        el('div.lesson-axiom.panel',null,[el('strong',{text:'Rules now'}),...E.ruleSummary(state).slice(0,2).map(([label,text])=>el('p',{text:label+': '+text})),...E.activeAxioms(state).map(ax=>el('p',{text:ax.name+': '+ax.text}))]),
                        !busy&&(index===9||index===10)?comparison():null,
                    ]),
                ]),
            );
            if(!busy)focusTarget();
        }
        function actionText(action){
            const player=E.decider(state)===0?'You':'Granny', c=action.cid&&state.cards[action.cid], name=c&&Rift.data.creatures[c.species].name;
            const suffix=player==='You'?'':'s';
            if(action.type==='play')return player+' play'+suffix+' '+name+'.';
            if(action.type==='attack')return player+' attack'+suffix+' with '+name+'.';
            if(action.type==='block')return player+' block'+suffix+' with '+name+'.';
            if(action.type==='take')return player+' take'+suffix+' the hit: one life lost.';
            if(action.type==='steal')return 'You steal Muskrat. It joins your board; Granny gets an extra turn.';
            if(action.type==='end')return player+' end'+suffix+' the turn. Watch the energy refill and creatures ready.';
            if(action.type==='activate')return player+' activate'+suffix+' '+name+': spend energy and exhaust it.';
            if(action.type==='rewrite')return 'Rule changes for both players: '+Rift.data.axioms[action.choice].name+'.';
            return 'Read the current rules.';
        }
        function act(){
            if(closed||busy||help)return;
            busy=true;stop();const actions=L.steps[index].actions;let cursor=0;
            function next(){
                if(closed)return;
                if(cursor===actions.length){busy=false;index++;notice='';render();speak();return;}
                const action=actions[cursor++], cid=action.cid||(action.type==='steal'?'p1c1':null);
                const before=cid&&screen.querySelector('[data-cid="'+cid+'"]');
                const rect=before&&before.getBoundingClientRect?before.getBoundingClientRect():null;
                notice=actionText(action);state=E.applyAction(state,action);render();animate(action,cid,rect);
                timer=root.setTimeout(next,action.type==='decline'?400:1000);
            }
            next();
        }
        function animate(action,cid,rect){
            if(root.document&&root.document.body.classList.contains('calm-motion')||root.matchMedia&&root.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
            const target=cid?screen.querySelector('[data-cid="'+cid+'"]'):screen.querySelector('.lesson-score');
            if(!target||!target.animate)return;
            let frames=[{opacity:.35},{opacity:1}];
            if(rect&&(action.type==='play'||action.type==='steal')){
                const after=target.getBoundingClientRect();frames=[{transform:'translate('+(rect.left-after.left)+'px,'+(rect.top-after.top)+'px)'},{transform:'translate(0,0)'}];
            }else if(action.type==='attack')frames=[{transform:'translateY(0)'},{transform:'translateY('+(cid.startsWith('p0')?'-24':'24')+'px)'},{transform:'translateY(0)'}];
            const animation=target.animate(frames,{duration:700,easing:'ease-in-out'});animations.add(animation);animation.onfinish=()=>animations.delete(animation);
        }
        function comparison(){
            const ordinary=E.fightOutcome({...state,axioms:{...state.axioms,active:{},current:null}},'p0c0','p1c3');
            const changed=E.fightOutcome({...state,axioms:{...state.axioms,current:'underdog'}},'p0c0','p1c3');
            function line(label,out){return el('p',{text:label+': Astrophysicat '+out.pa+' vs Lobstorian '+out.pb+' → '+(out.attackerDefeated?'Lobstorian':'Astrophysicat')+' wins.'});}
            return el('div.lesson-comparison.panel',null,[el('strong',{text:'Same cards, different rule'}),line('Normal rules',ordinary),line('Underdog',changed)]);
        }
        render();speak();
        return {destroy(){closed=true;stop();if(help)help.close();},get state(){return state;}};
    }
    Rift.Screens.register('battle-lesson',{mount});
})(typeof window !== 'undefined'?window:globalThis);
