/* Manual two-way WebRTC connection codes. No lobby, hosted signalling or relay.
 * This transport carries only explicitly supplied JSON, never a save or battle state. */
(function(root){
    'use strict';
    const R=root.Rift,PREFIX='RORP1',LIFETIME=10*60*1000,MAX_CODE=48000,MAX_MESSAGE=16384;
    function encode(value){
        const body=root.btoa(unescape(encodeURIComponent(JSON.stringify(value)))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
        return PREFIX+'.'+body+'.'+R.hashSeed(body).toString(36);
    }
    function decode(code,role,now){
        if(typeof code!=='string'||code.length>MAX_CODE)throw new Error('That connection code is too long. Ask for a fresh code.');
        const parts=code.trim().replace(/\s+/g,'').split('.');
        if(parts.length!==3||parts[0]!==PREFIX||!/^[\w-]+$/.test(parts[1])||parts[2]!==R.hashSeed(parts[1]).toString(36))throw new Error('That connection code is incomplete or damaged. Copy it again.');
        let value;try{value=JSON.parse(decodeURIComponent(escape(root.atob(parts[1].replace(/-/g,'+').replace(/_/g,'/')))));}catch(e){throw new Error('That connection code cannot be read. Copy it again.');}
        if(!value||value.v!==1||value.role!==role||typeof value.room!=='string'||!/^[a-f0-9]{32}$/.test(value.room)
            ||!Number.isSafeInteger(value.expires)||value.expires<now||value.expires>now+LIFETIME+5000
            ||!value.description||value.description.type!==role||typeof value.description.sdp!=='string'||value.description.sdp.length>32000
            ||!/^v=0\r?\n/.test(value.description.sdp))throw new Error('That is an expired code or the wrong connection step. Start again with a fresh host code.');
        return value;
    }
    function create(options){
        const o=options||{},now=o.now||Date.now,make=o.connection||(()=>new root.RTCPeerConnection({iceServers:[]}));
        let pc=null,channel=null,room=null,expires=0,role=null,closed=false,timer=null,gatherCancel=null,connected=false;
        const status=text=>{if(o.status)o.status(text);};
        const error=text=>{if(o.error)o.error(text);status(text);};
        function live(){if(closed)throw new Error('Connection cancelled.');}
        function clear(){clearTimeout(timer);timer=null;if(gatherCancel){const cancel=gatherCancel;gatherCancel=null;cancel();}}
        function close(){if(closed)return;closed=true;clear();if(channel){channel.onopen=channel.onmessage=channel.onclose=channel.onerror=null;channel.close();}if(pc){pc.onconnectionstatechange=pc.ondatachannel=null;pc.close();}status('Disconnected. You can start again.');}
        function fail(text){if(closed)return;close();error(text);}
        function bind(dc){
            channel=dc;channel.onopen=()=>{if(closed)return;clearTimeout(timer);connected=true;status('Connected. Your partner is ready.');if(o.open)o.open();};
            channel.onmessage=ev=>{
                if(closed)return;if(typeof ev.data!=='string'||ev.data.length>MAX_MESSAGE){fail('The other browser sent an unreadable message. Start again.');return;}
                let message;try{message=JSON.parse(ev.data);}catch(e){fail('The other browser sent an unreadable message. Start again.');return;}
                if(!message||typeof message!=='object'||Array.isArray(message)){fail('The other browser sent an unreadable message. Start again.');return;}
                if(o.message)o.message(message);
            };
            channel.onclose=()=>{if(!closed)fail('Your partner disconnected. Start a new connection.');};
            channel.onerror=()=>fail('The connection stopped. Try again, or use a classmate code instead.');
        }
        function start(){
            if(pc||closed)throw new Error('This connection was already started. Choose Retry for a new one.');
            try{pc=make();}catch(e){throw new Error('This browser cannot make a peer connection. Try a current browser or use classmate codes.');}
            pc.onconnectionstatechange=()=>{if(closed)return;if(pc.connectionState==='failed'||pc.connectionState==='closed')fail('These browsers could not stay connected. Try again.');else if(pc.connectionState==='disconnected')status('Connection interrupted. Waiting up to 15 seconds…');
                if(pc.connectionState==='disconnected'){clearTimeout(timer);timer=setTimeout(()=>fail('The connection did not return. Start again.'),15000);}else if(pc.connectionState==='connected'&&connected){clearTimeout(timer);status('Connected. Your partner is ready.');}};
            pc.ondatachannel=ev=>{if(channel){ev.channel.close();fail('An unexpected extra connection arrived. Start again.');return;}bind(ev.channel);};
        }
        function gather(){live();return new Promise((resolve,reject)=>{
            if(pc.iceGatheringState==='complete'){resolve();return;}
            const finish=err=>{clearTimeout(wait);pc.removeEventListener('icegatheringstatechange',change);gatherCancel=null;err?reject(err):resolve();};
            const change=()=>{if(pc.iceGatheringState==='complete')finish();};
            const wait=setTimeout(()=>finish(new Error('This browser could not prepare a connection code. Retry.')),8000);
            gatherCancel=()=>finish(new Error('Connection cancelled.'));pc.addEventListener('icegatheringstatechange',change);
        });}
        function packet(){if(closed)throw new Error('Connection cancelled.');return encode({v:1,role,room,expires,description:{type:pc.localDescription.type,sdp:pc.localDescription.sdp}});}
        function connecting(){clearTimeout(timer);timer=setTimeout(()=>fail('No connection after 30 seconds. This Wi-Fi may block direct links. Retry, or use a classmate code.'),30000);status('Connecting… Keep both pages open.');}
        function waiting(){live();clearTimeout(timer);timer=setTimeout(()=>fail('This connection code expired. Start again.'),Math.max(1,expires-now()));}
        async function host(){
            start();role='offer';expires=now()+LIFETIME;const bytes=new Uint8Array(16);root.crypto.getRandomValues(bytes);room=Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');
            bind(pc.createDataChannel('rift-1',{ordered:true}));waiting();status('Preparing your host code…');const offer=await pc.createOffer();live();await pc.setLocalDescription(offer);live();await gather();live();status('Host code ready. Send it to your partner, then paste their return code here.');return packet();
        }
        async function join(code){
            const offer=decode(code,'offer',now());start();role='answer';room=offer.room;expires=offer.expires;waiting();status('Preparing your return code…');await pc.setRemoteDescription(offer.description);live();const answer=await pc.createAnswer();live();await pc.setLocalDescription(answer);live();await gather();live();
            status('Return code ready. Send it back to the host. Keep this page open.');return packet();
        }
        async function accept(code){
            if(closed||role!=='offer'||!pc)throw new Error('Create a host code first.');const answer=decode(code,'answer',now());
            if(answer.room!==room||answer.expires!==expires)throw new Error('That return code belongs to a different host. Ask your partner to join your latest host code.');
            if(pc.remoteDescription)throw new Error('This return code was already accepted. Retry for a new connection.');await pc.setRemoteDescription(answer.description);live();connecting();
        }
        function send(message){
            if(closed||!channel||channel.readyState!=='open')throw new Error('You are not connected yet.');const text=JSON.stringify(message);
            if(!message||typeof message!=='object'||Array.isArray(message)||text.length>MAX_MESSAGE)throw new Error('That message is too large or cannot be sent.');
            if(channel.bufferedAmount>MAX_MESSAGE*4)throw new Error('The connection is busy. Try again in a moment.');channel.send(text);
        }
        return {host,join,accept,send,close};
    }
    R.Peer={create,encode,decode,LIFETIME,MAX_MESSAGE};
})(typeof window!=='undefined'?window:globalThis);
