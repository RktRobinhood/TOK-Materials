/* Student-hosted live practice. This screen renders recipient DTOs, never engine state. */
(function(root){
    'use strict';
    const R=root.Rift,el=(...args)=>R.el(...args);
    function mount(container,options){
        const o=options||{},save=o.save||R.State.get();let peer=null,session=null,side=null,attempt=0,stopping=false,current=null,selected=null,anchor=0,remaining=0,destroyed=false;
        const status=el('p.peer-status',{role:'status',text:'Choose Host or Join.'}),timer=el('p.peer-timer',{role:'timer','aria-live':'off'}),board=el('div.peer-board'),
            outgoing=el('textarea#peer-out',{readOnly:true,spellcheck:false,'aria-label':'Your connection code'}),incoming=el('textarea#peer-in',{spellcheck:false,maxLength:48000,'aria-label':'Partner connection code'}),
            qr=el('canvas',{'aria-label':'Your connection QR',role:'img'}),qrNote=el('p.small'),video=el('video',{hidden:true,'aria-label':'Camera preview'}),
            instruction=el('p',{text:''}),exchange=el('section.peer-exchange',{hidden:true}),outgoingPanel=el('div.peer-code',{hidden:true}),incomingPanel=el('div.peer-code'),home=el('div.row.wrap');
        const scanner=R.PeerQR.scanner(video,{status:text=>{status.textContent=text;},role:()=>side==='host'?'answer':'offer',found:code=>{incoming.value=code;status.textContent='Code scanned. Choose Use partner code.';}});
        const use=el('button.btn.primary',{text:'Use partner code',onclick:useCode});
        function setClock(ms){remaining=ms;anchor=root.performance.now();drawClock();}
        function drawClock(){if(!current)return;const seconds=Math.max(0,Math.ceil((remaining-(root.performance.now()-anchor))/1000));timer.textContent=current.stopped||current.winner!=null?'Practice finished':seconds+' seconds · '+(current.active===current.you?'your turn':'partner’s turn')+(seconds<=10?' · ending soon':'');timer.classList.toggle('peer-near',seconds<=10&&current.winner==null&&!current.stopped);}
        function codeReady(code){outgoing.value=code;outgoingPanel.hidden=false;qrNote.textContent='Scan this QR, or copy the code.';try{R.PeerQR.render(qr,code,Math.min(600,Math.max(250,container.clientWidth-64)));qr.hidden=false;}catch(e){qr.hidden=true;qrNote.textContent=e.message;}}
        function reset(){attempt++;stopping=true;scanner.stop();if(session)session.close();if(peer)peer.close();session=peer=null;side=null;current=null;selected=null;stopping=false;board.replaceChildren();timer.textContent='';outgoing.value=incoming.value='';qr.width=qr.height=0;exchange.hidden=true;outgoingPanel.hidden=true;incomingPanel.hidden=false;home.hidden=false;use.disabled=false;status.textContent='Choose Host or Join.';}
        function stop(text){stopping=true;scanner.stop();if(peer)peer.close();use.disabled=true;status.textContent=text;}
        async function begin(host){
            reset();const stamp=attempt;side=host?'host':'join';
            try{
                const loadout=R.Battle.PeerSession.loadout(save);home.hidden=true;exchange.hidden=false;
                instruction.textContent=host?'1. Send your host code to your partner. Then paste or scan their return code.':'1. Paste or scan the host’s code, then choose Use partner code.';
                peer=R.Peer.create({status:text=>{if(stamp===attempt&&!stopping&&!current)status.textContent=text;},error:text=>{if(stamp===attempt&&session)session.disconnected(text);},
                    message:message=>{if(stamp===attempt&&session)session.receive(message);},open:()=>{if(stamp!==attempt)return;scanner.stop();outgoing.value=incoming.value='';qr.width=qr.height=0;exchange.hidden=true;session.open();}});
                const transport=peer;
                session=R.Battle.PeerSession.create({host,save,loadout,send:message=>{if(!transport.writable())return false;transport.send(message);return true;},
                    status:text=>{if(stamp===attempt)status.textContent=text;},stop:text=>{if(stamp===attempt)stop(text);},clock:ms=>{if(stamp===attempt)setClock(ms);},view:view=>{if(stamp===attempt){current=view;status.textContent='Live practice. '+view.settlement;setClock(view.remainingMs);render();}}});
                if(host){const code=await transport.host();if(stamp===attempt)codeReady(code);}else incoming.focus();
            }catch(e){if(stamp===attempt){stop(e.message);home.hidden=false;}}
        }
        async function useCode(){
            if(!peer||!side)return;const stamp=attempt,transport=peer;use.disabled=true;scanner.stop();
            try{if(side==='join'){const code=await transport.join(incoming.value);if(stamp!==attempt)return;codeReady(code);incomingPanel.hidden=true;instruction.textContent='2. Send this return code back to the host. Keep this page open.';}
                else{await transport.accept(incoming.value);if(stamp!==attempt)return;instruction.textContent='3. Connecting. Keep both pages open.';}}
            catch(e){if(stamp===attempt){status.textContent=e.message;use.disabled=false;}}
        }
        function send(index,match,revision,stamp){if(stamp!==attempt||!current||current.match!==match||current.revision!==revision){status.textContent='The board changed. Choose again.';return;}if(session)session.move(index);}
        function select(value){selected=value;render();const next=board.querySelector('.peer-action-list button')||board.querySelector('.peer-moves');if(next)next.focus();}
        function name(value){if(/^h[01]$/.test(value))return current.players[+value[1]].name;const cards=current.hand.concat(current.armed,current.known,...current.players.map(p=>p.board.concat(p.discard)));
            const card=cards.find(c=>c.cid===value);return card?card.name:(R.data.axioms[value]||{}).name||value;}
        function actionLabel(a){if(a.type==='choose'){const choice=current.choices&&current.choices.labels.find(c=>c.value===a.choice);return choice?(choice.card?choice.card.name:choice.label):name(a.choice);}
            const target=a.target?' → '+name(a.target):'';
            if(a.type==='play')return 'Play '+name(a.cid)+target;if(a.type==='attack')return 'Attack '+name(a.target);
            if(a.type==='activate')return ((R.Battle.Abilities[a.ability]||{}).name||'Use ability')+target;
            if(a.type==='axiom')return 'Play '+name(a.choice);if(a.type==='power')return 'Use hero power'+target;
            if(a.type==='draw')return {deck:'Draw from your deck',axiom:'Draw a shared Axiom',none:'Continue without a draw'}[a.choice]||a.choice;
            return a.type==='end'?'End turn':a.type==='spark'?'Use Spark · +1 energy':a.type;
        }
        function cardNode(card,selectable){
            const node=el(selectable?'button.peer-card':'div.peer-card',selectable?{type:'button',dataset:{peerFocus:'card:'+card.cid},'aria-pressed':selected===card.cid,onclick:()=>select(card.cid)}:null);
            if(R.Assets&&card.species&&R.data.creatures[card.species])node.appendChild(R.Assets.img('creature/'+card.species+'/idle',{className:'peer-card-art',alt:''}));
            node.append(el('strong',{text:card.name}),el('span',{text:card.cost+' energy'+(card.kind==='creature'?' · '+card.attack+' attack / '+card.health+' health':'')}));
            if(card.keywords&&card.keywords.length)node.appendChild(el('span',{text:card.keywords.join(', ')}));
            if(card.text)node.appendChild(el('span',{text:card.text}));
            (card.lines||[]).forEach(line=>node.appendChild(el('span',{text:(line.off?'Off · ':'')+line.text})));
            const states=[card.sleeping?'Waiting this turn':null,card.frozen?'Frozen':null,card.silenced?'Silenced':null].filter(Boolean);if(states.length)node.appendChild(el('span',{text:states.join(' · ')}));
            return node;
        }
        function render(){
            if(!current||destroyed)return;const v=current,stamp=attempt,me=v.you,them=1-me,live=!v.stopped&&v.winner==null;
            const active=root.document.activeElement,hadFocus=board.contains(active),focusKey=hadFocus&&active.dataset?active.dataset.peerFocus:null;
            const openPanels=new Set(Array.from(board.querySelectorAll('details')).filter(d=>d.open).map(d=>d.dataset.peerPanel));
            function actionButton(x){return el('button.btn.primary',{text:actionLabel(x.a),dataset:{peerFocus:'action:'+JSON.stringify(x.a)},onclick:()=>send(x.i,v.match,v.revision,stamp)});}
            const content=[];
            if(!live)content.push(el('h2',{tabIndex:-1,text:v.stopped||v.winner==='draw'?'Practice ended':v.winner===me?'You won practice':'Your partner won practice'}),el('p',{text:v.stopped||v.settlement}));
            else content.push(el('h2',{'aria-live':'polite',tabIndex:-1,text:'Turn '+v.turn+' · '+(v.decider===me?'Choose your move':v.players[v.decider==null?v.active:v.decider].name+' is choosing')}));
            const victory=v.activeAxioms.find(a=>a.category==='victory');if(victory)content.push(el('section.peer-win',null,[el('h3',{text:'Win · '+victory.name}),el('p',{text:victory.text}),...v.players.filter(p=>p.goal).map(p=>el('p',{text:p.name+' · '+p.goal.checks.map(c=>(c.met?'✓ ':'○ ')+c.text).join(' · ')}))]));
            [them,me].forEach(p=>{const pl=v.players[p],section=el('section.peer-side');section.append(el('h3',{text:(p===me?'You · ':'')+pl.name}),el('p',{text:pl.hearts+'/'+pl.maxHearts+' hearts · '+pl.energy+'/'+pl.capacity+' energy · '+(pl.unlimitedUses?'unlimited':pl.uses)+' activations left'}));
                section.appendChild(el('div.peer-cards',null,pl.board.length?pl.board.map(c=>cardNode(c,p===me)):el('p',{text:'No creatures in play.'})));
                section.appendChild(el('p.small',{text:pl.deckCount+' in deck · '+pl.handCount+' personal cards in hand · '+pl.axiomCount+' Axioms in hand'}));
                if(pl.conditions.length)section.appendChild(el('p',{text:'Waiting: '+pl.conditions.map(c=>c.concealed?'Hidden condition':c.name+' · '+c.condition).join('; ')}));
                if(pl.power)section.appendChild(el('p',{text:'Hero power · '+pl.power.name+' · '+pl.power.cost+' energy'+(pl.power.heartCost?' + '+pl.power.heartCost+' hearts':'')+' · '+pl.power.text+(pl.power.turnsLeft?' · ready in '+pl.power.turnsLeft+' turns':'')}));
                if(p===them&&pl.publicAxioms.length)section.appendChild(el('p',{text:'Known Axioms: '+pl.publicAxioms.map(name).join(', ')}));
                if(pl.discard.length)section.appendChild(el('details',{dataset:{peerPanel:'discard:'+p}},[el('summary',{text:'Discard · '+pl.discard.length,dataset:{peerFocus:'discard:'+p}}),el('div.peer-cards',null,pl.discard.map(c=>cardNode(c,false)))]));content.push(section);});
            if(v.known.length)content.push(el('section',null,[el('h3',{text:'Seen in your partner’s hand'}),el('div.peer-cards',null,v.known.map(c=>cardNode(c,false)))]));
            content.push(el('section',null,[el('h3',{text:'Your hand · select a card'}),el('div.peer-cards',null,v.hand.map(c=>cardNode(c,true))),
                el('div.peer-cards',null,v.axiomHand.map(id=>{const ax=R.data.axioms[id]||{};return el('button.peer-card',{'aria-pressed':selected==='ax:'+id,dataset:{peerFocus:'ax:'+id},onclick:()=>select('ax:'+id)},[el('strong',{text:name(id)}),el('span',{text:v.axiomCosts[id]+' energy'}),el('span',{text:ax.text})]);}))]));
            const moves=el('section.peer-moves',{'aria-label':'Legal moves',tabIndex:-1});
            if(live&&v.decider===me){
                if(v.phase==='choose')moves.appendChild(el('h3',{text:v.choices.prompt}));
                const globals=v.actions.map((a,i)=>({a,i})).filter(x=>x.a.type==='end'||x.a.type==='spark');
                moves.appendChild(el('div.row.wrap',null,globals.map(actionButton)));
                if(v.actions.some(a=>a.type==='power'))moves.appendChild(el('button.btn',{text:'Hero power',dataset:{peerFocus:'power'},onclick:()=>select('power')}));
                const shown=v.actions.map((a,i)=>({a,i})).filter(({a})=>v.phase!=='main'||(selected==='power'?a.type==='power':selected&&selected.startsWith('ax:')?a.type==='axiom'&&a.choice===selected.slice(3):a.cid===selected));
                moves.appendChild(el('div.peer-action-list',null,shown.map(actionButton)));
                if(v.phase==='main'&&!shown.length)moves.appendChild(el('p',{text:selected?'This card has no legal move now.':'Select a card to see its legal moves.'}));
            }else if(live)moves.appendChild(el('p',{text:'Waiting for your partner. Your cards stay private.'}));content.push(moves);
            content.push(el('details',{dataset:{peerPanel:'rules'}},[el('summary',{text:'Rules and Fate',dataset:{peerFocus:'rules'}}),...v.activeAxioms.map(ax=>el('p',{text:ax.name+' · '+ax.text})),...v.rules.filter(pair=>!(victory&&pair[0]==='Win')).map(pair=>el('p',{text:pair[0]+': '+pair[1]})),...v.timeline.map(t=>el('p',{text:t.text+' · in '+t.rounds+' rounds'})),...v.schedule.map(t=>el('p',{text:t.name+' · '+t.summary+' · '+t.state+(t.rounds!=null?' · in '+t.rounds+' rounds':'')}))]));
            content.push(el('details',{dataset:{peerPanel:'history'}},[el('summary',{text:'Recent moves',dataset:{peerFocus:'history'}}),...v.events.map(text=>el('p',{text}))]));board.replaceChildren(...content);
            board.querySelectorAll('details').forEach(d=>{if(openPanels.has(d.dataset.peerPanel))d.open=true;});
            if(hadFocus){const same=focusKey&&Array.from(board.querySelectorAll('[data-peer-focus]')).find(n=>n.dataset.peerFocus===focusKey),fallback=board.querySelector('.peer-action-list button')||board.querySelector('h2');if(same||fallback)(same||fallback).focus();}
        }
        home.append(el('button.btn.primary',{text:'Host a live practice',onclick:()=>begin(true)}),el('button.btn',{text:'Join a live practice',onclick:()=>begin(false)}));
        outgoingPanel.append(el('label',{htmlFor:'peer-out',text:'Your code · send to your partner'}),outgoing,el('button.btn',{text:'Copy your code',onclick:async()=>{try{await root.navigator.clipboard.writeText(outgoing.value);status.textContent='Code copied. Send it to your partner.';}catch(e){outgoing.focus();outgoing.select();status.textContent='Select and copy the code.';}}}),qr,qrNote);
        incomingPanel.append(el('label',{htmlFor:'peer-in',text:'Partner’s code'}),incoming,el('button.btn',{text:'Scan partner QR',onclick:()=>scanner.start()}),el('button.btn',{text:'Stop camera',onclick:()=>scanner.stop()}),video,use);
        exchange.append(instruction,outgoingPanel,incomingPanel);
        container.appendChild(el('div.peer-page',null,[el('div.row.wrap',null,[el('h1',{text:'Live practice'}),el('button.btn',{text:'Back',onclick:()=>o.back?o.back():R.Router.go('collection')}),el('button.btn',{text:'Cancel / Retry',onclick:reset})]),
            el('p',{text:'Two players · your own decks · 60 seconds per turn. No cards, items, coins or rewards change.'}),el('p.small',{text:'Your partner hosts the rules. Play with someone you trust. Try the same Wi-Fi; some networks block direct links.'}),status,home,exchange,timer,board]));
        const interval=setInterval(()=>{if(session)session.pump();drawClock();},200);
        function onLeave(){reset();}function resize(){if(outgoing.value)codeReady(outgoing.value);}
        root.addEventListener('pagehide',onLeave);root.addEventListener('resize',resize);
        return {destroy(){destroyed=true;clearInterval(interval);root.removeEventListener('pagehide',onLeave);root.removeEventListener('resize',resize);reset();}};
    }
    R.PeerUI={mount};
    R.Screens.register('peer',{mount});
})(typeof window!=='undefined'?window:globalThis);
