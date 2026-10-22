/* Real RTCPeerConnection only. No fake network, storage, or battle snapshots. */
(function(){
    'use strict';
    const $=id=>document.getElementById(id),status=text=>{$('status').textContent=text;};let peer=null,side=null,sequence=0,attempt=0;
    function make(){const stamp=attempt;return Rift.Peer.create({status:text=>{if(stamp===attempt)status(text);},error(){if(stamp===attempt)$('ping').disabled=true;},message(message){if(stamp!==attempt)return;const text=JSON.stringify(message);$('messages').textContent=($('messages').textContent==='No messages yet.'?'':$('messages').textContent+'\n')+'Received '+text;
        if(message.type==='ping')peer.send({type:'pong',number:message.number});},open(){if(stamp!==attempt)return;$('ping').disabled=false;$('outgoing').value=$('incoming').value='';}});}
    function reset(){attempt++;if(peer)peer.close();peer=null;side=null;$('outgoing').value=$('incoming').value='';$('ping').disabled=true;$('messages').textContent='No messages yet.';status('Choose Host or Join. Codes expire after 10 minutes.');}
    async function run(work){const stamp=attempt;try{const code=await work();if(stamp===attempt&&typeof code==='string')$('outgoing').value=code;}catch(e){if(stamp===attempt)status(e.message);}}
    $('host').onclick=async()=>{reset();side='host';peer=make();const current=peer;await run(()=>current.host());};
    $('join').onclick=()=>{reset();side='join';peer=make();status('Paste your partner’s host code, then choose Use partner code.');$('incoming').focus();};
    $('use').onclick=async()=>{if(!peer){status('Choose Host or Join first.');return;}const current=peer;await run(()=>side==='join'?current.join($('incoming').value):current.accept($('incoming').value));};
    $('cancel').onclick=reset;
    $('copy').onclick=async()=>{if(!$('outgoing').value){status('There is no code yet. Choose Host or finish Join first.');return;}try{await navigator.clipboard.writeText($('outgoing').value);status('Code copied. Send it to your partner.');}catch(e){$('outgoing').focus();$('outgoing').select();status('Select and copy the code above.');}};
    $('ping').onclick=()=>{try{peer.send({type:'ping',number:++sequence});status('Ping sent. Wait for your partner’s pong below.');}catch(e){status(e.message);}};
    addEventListener('pagehide',()=>{if(peer)peer.close();});
})();
