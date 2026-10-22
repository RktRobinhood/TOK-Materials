import test from 'node:test';
import assert from 'node:assert/strict';
import {loadWithDom} from './fake-dom.mjs';
function fixture(){
    const g=loadWithDom(['js/core/rift.js',ctx=>{ctx.btoa=text=>Buffer.from(text,'binary').toString('base64');ctx.atob=text=>Buffer.from(text,'base64').toString('binary');ctx.crypto={getRandomValues:bytes=>{bytes.forEach((_,i)=>{bytes[i]=i+1;});return bytes;}};},'js/core/peer.js']);
    const R=g.Rift;let now=1000;const pcs=[],messages=[],statuses=[];
    const connection=()=>{
        const dc={readyState:'connecting',bufferedAmount:0,sent:[],send(text){this.sent.push(text);},close(){this.readyState='closed';}};
        const pc={iceGatheringState:'complete',connectionState:'new',remoteDescription:null,dc,
            createDataChannel(){return dc;},async createOffer(){return {type:'offer',sdp:'v=0\r\ns=host\r\n'};},async createAnswer(){return {type:'answer',sdp:'v=0\r\ns=join\r\n'};},
            async setLocalDescription(value){this.localDescription=value;},async setRemoteDescription(value){this.remoteDescription=value;},close(){this.connectionState='closed';},addEventListener(){},removeEventListener(){}};
        pcs.push(pc);return pc;
    };
    const make=()=>R.Peer.create({connection,now:()=>now,message:m=>messages.push(m),status:s=>statuses.push(s)});
    return {R,g,make,pcs,messages,statuses,advance:ms=>{now+=ms;}};
}

test('connection codes validate checksum, role, expiry and bounded payload without executing supplied text',async()=>{
    const f=fixture(),p=f.make(),code=await p.host();const value=f.R.Peer.decode(code,'offer',1000);assert.equal(value.description.type,'offer');assert.match(value.room,/^[a-f0-9]{32}$/);
    assert.throws(()=>f.R.Peer.decode(code+'x','offer',1000),/damaged/);assert.throws(()=>f.R.Peer.decode(code,'answer',1000),/wrong connection step/);
    assert.throws(()=>f.R.Peer.decode(code,'offer',1000+f.R.Peer.LIFETIME+1),/expired/);assert.throws(()=>f.R.Peer.decode('x'.repeat(50000),'offer',1000),/too long/);
    assert.equal(f.R.Peer.decode(' \n'+code+'\n','offer',1000).room,value.room);p.close();
});

test('manual offer, answer, return code and open channel are separate steps; repeated or wrong-room return is rejected',async()=>{
    const f=fixture(),host=f.make(),join=f.make(),offer=await host.host(),answer=await join.join(offer);assert.equal(f.pcs.length,2);
    assert.throws(()=>host.send({type:'ping'}),/not connected/);const wrong=f.R.Peer.decode(answer,'answer',1000);wrong.room='f'.repeat(32);await assert.rejects(host.accept(f.R.Peer.encode(wrong)),/different host/);
    await host.accept(answer);await assert.rejects(host.accept(answer),/already accepted/);f.pcs[0].dc.readyState='open';f.pcs[0].dc.onopen();host.send({type:'ping',n:1});assert.equal(f.pcs[0].dc.sent[0],' {"type":"ping","n":1}'.trim());
    assert.ok(f.statuses.some(s=>s.startsWith('Connected.')));host.close();join.close();
});

test('unreadable/oversize peer messages close the connection and retain the useful failure reason',async()=>{
    for(const data of ['not-json',JSON.stringify([]),'x'.repeat(20000)]){
        const f=fixture(),p=f.make();await p.host();f.pcs[0].dc.onmessage({data});assert.equal(f.pcs[0].connectionState,'closed');assert.match(f.statuses.at(-1),/unreadable message/);assert.equal(f.messages.length,0);p.close();
    }
});

test('cancel closes transport, clears callbacks and makes old connection actions inert',async()=>{
    const f=fixture(),p=f.make(),code=await p.host();p.close();p.close();assert.equal(f.pcs[0].connectionState,'closed');assert.equal(f.pcs[0].dc.onmessage,null);assert.throws(()=>p.send({type:'ping'}),/not connected/);await assert.rejects(p.accept(code),/Create a host code first/);await assert.rejects(p.host(),/already started/);
});

test('sending validates bounded objects and applies backpressure; inbound valid objects alone reach the caller',async()=>{
    const f=fixture(),p=f.make();await p.host();const dc=f.pcs[0].dc;assert.equal(p.writable(),false);dc.readyState='open';dc.onopen();assert.equal(p.writable(),true);
    assert.throws(()=>p.send([]),/too large/);assert.throws(()=>p.send({text:'x'.repeat(20000)}),/too large/);dc.bufferedAmount=100000;assert.equal(p.writable(),false);assert.throws(()=>p.send({type:'ping'}),/busy/);dc.bufferedAmount=0;assert.equal(p.writable(),true);
    dc.onmessage({data:'{"type":"pong","number":1}'});assert.equal(f.messages[0].type,'pong');assert.equal(f.messages.length,1);p.close();assert.equal(p.writable(),false);
});

test('cancelling during host/join awaits prevents later status, code and gathering work',async()=>{
    const f=fixture(),host=f.make(),pending=host.host();host.close();await assert.rejects(pending,/cancelled/);assert.equal(f.pcs[0].localDescription,undefined);assert.doesNotMatch(f.statuses.at(-1),/ready|Preparing/);
    const h=f.make(),offer=await h.host(),join=f.make(),joining=join.join(offer);join.close();await assert.rejects(joining,/cancelled/);assert.equal(f.pcs[2].localDescription,undefined);h.close();
});

test('cancelled deferred answer acceptance cannot install a connecting timer or overwrite the retry state',async()=>{
    const f=fixture(),host=f.make(),join=f.make(),offer=await host.host(),answer=await join.join(offer);let finish;
    f.pcs[0].setRemoteDescription=()=>new Promise(resolve=>{finish=resolve;});const accepting=host.accept(answer);host.close();finish();await assert.rejects(accepting,/cancelled/);
    assert.equal(f.statuses.at(-1),'Disconnected. You can start again.');join.close();f.g.flush();assert.equal(f.statuses.at(-1),'Disconnected. You can start again.');
});

test('an unanswered waiting host expires and releases the native connection with a retry message',async()=>{
    const f=fixture(),p=f.make();await p.host();f.advance(f.R.Peer.LIFETIME);f.g.flush();assert.equal(f.pcs[0].connectionState,'closed');assert.match(f.statuses.at(-1),/expired.*Start again/);assert.throws(()=>p.send({type:'ping'}),/not connected/);
});

test('a connected peer connection without an open data channel still has a bounded setup timeout',async()=>{
    const f=fixture(),host=f.make(),join=f.make(),offer=await host.host(),answer=await join.join(offer);await host.accept(answer);join.close();f.pcs[0].connectionState='connected';f.pcs[0].onconnectionstatechange();f.g.flush();assert.equal(f.pcs[0].connectionState,'closed');assert.match(f.statuses.at(-1),/No connection after 30 seconds/);
});

test('bench retry ignores old resolved/rejected operations and old status/open callbacks',async()=>{
    for(const reject of [false,true]){
        const attempts=[];const g=loadWithDom(['js/core/rift.js',ctx=>{
            ctx.addEventListener=()=>{};
            for(const id of ['status','outgoing','incoming','ping','messages','host','join','use','cancel','copy']){const node=ctx.document.createElement(id==='outgoing'||id==='incoming'?'textarea':'button');node.setAttribute('id',id);ctx.document.body.appendChild(node);}
            ctx.Rift.Peer={create(options){let resolve,fail;const promise=new Promise((a,b)=>{resolve=a;fail=b;});attempts.push({options,resolve,fail});return {host:()=>promise,close(){options.status('old close');},send(){}};}};
        },'dev/peer.js']);
        const $=id=>g.document.getElementById(id),old=$('host').onclick();$('cancel').onclick();$('join').onclick();const expected=$('status').textContent;
        attempts[0].options.status('Old result');attempts[0].options.open();if(reject)attempts[0].fail(new Error('Old failure'));else attempts[0].resolve('OLD CODE');await old;
        assert.equal($('status').textContent,expected);assert.equal($('outgoing').value,'');assert.equal($('ping').disabled,true);
    }
});
