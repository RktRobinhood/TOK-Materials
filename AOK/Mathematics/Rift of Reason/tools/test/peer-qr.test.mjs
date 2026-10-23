import test from 'node:test';
import assert from 'node:assert/strict';
import {loadWithDom} from './fake-dom.mjs';
const files=['js/core/rift.js','js/vendor/qrcode-generator-2.0.4.js','js/vendor/jsqr-1.4.0.js','js/ui/peer-qr.js'];

test('offline QR modules round-trip connection-sized text at integer phone and desktop sizes',()=>{
    const g=loadWithDom(files);
    for(const [length,limit] of [[150,326],[1108,326],[1108,600],[1800,600]]){
        const code='RORP1.'+'aBc_012-Z'.repeat(Math.ceil(length/9)).slice(0,length),m=g.Rift.PeerQR.matrix(code,limit),data=new Uint8ClampedArray(m.size*m.size*4);data.fill(255);
        for(let row=0;row<m.modules;row++)for(let col=0;col<m.modules;col++)if(m.dark(row,col))for(let y=0;y<m.scale;y++)for(let x=0;x<m.scale;x++){
            const offset=(((row+4)*m.scale+y)*m.size+(col+4)*m.scale+x)*4;data[offset]=data[offset+1]=data[offset+2]=0;
        }
        assert.ok(m.size<=limit);assert.ok(m.scale>=2);const found=g.ctx.jsQR(data,m.size,m.size,{inversionAttempts:'dontInvert'});assert.equal(found.data,code);
    }
    assert.throws(()=>g.Rift.PeerQR.matrix('x'.repeat(1108),100),/wider screen/);assert.throws(()=>g.Rift.PeerQR.matrix('x'.repeat(1800),326),/wider screen/);assert.throws(()=>g.Rift.PeerQR.matrix('x'.repeat(10000),600),/too large/);
});

function camera(getUserMedia){
    const g=loadWithDom(['js/core/rift.js',ctx=>{ctx.navigator={mediaDevices:{getUserMedia}};},'js/ui/peer-qr.js']),video=g.document.createElement('video'),messages=[],found=[];
    video.play=async()=>{};video.readyState=2;video.videoWidth=1280;video.videoHeight=720;
    const create=g.document.createElement;g.document.createElement=tag=>{const node=create(tag);if(tag==='canvas')node.getContext=()=>({drawImage(){},getImageData(){return {data:new Uint8ClampedArray(4)};}});return node;};
    g.Rift.Peer={decode:(code,role)=>{assert.equal(role,'offer');if(code!=='valid')throw new Error('Wrong code.');}};g.ctx.jsQR=()=>null;
    const scanner=g.Rift.PeerQR.scanner(video,{status:text=>messages.push(text),role:()=> 'offer',found:code=>found.push(code)});
    return {g,video,messages,found,scanner};
}

test('camera denial keeps copy/paste available and clears its timeout',async()=>{
    const f=camera(async()=>{throw new Error('Denied');});await f.scanner.start();assert.match(f.messages.at(-1),/not allowed|unavailable/);assert.equal(f.video.srcObject,null);assert.equal(f.g.timers.length,0);
});

test('cancelling or expiring a pending camera request stops late tracks without reopening preview',async()=>{
    for(const timeout of [false,true]){let resolve,stops=0;const pending=new Promise(r=>{resolve=r;}),f=camera(()=>pending),started=f.scanner.start();
        if(timeout)f.g.timers.find(t=>t.ms===60000).fn();else f.scanner.stop();resolve({getTracks:()=>[{stop(){stops++;}}]});await started;
        assert.equal(stops,1);assert.equal(f.video.srcObject,null);assert.equal(f.video.hidden,true);assert.equal(f.found.length,0);
    }
});

test('a valid local scan stops the camera before returning the validated code',async()=>{
    let stops=0;const f=camera(async constraints=>{assert.equal(constraints.audio,false);return {getTracks:()=>[{stop(){stops++;}}]};});f.g.ctx.jsQR=()=>({data:'valid'});
    await f.scanner.start();assert.deepEqual(f.found,['valid']);assert.equal(stops,1);assert.equal(f.video.srcObject,null);assert.equal(f.g.timers.length,0);
});

test('a foreign QR is ignored and the scan still has a one-minute bound',async()=>{
    let stops=0;const f=camera(async()=>({getTracks:()=>[{stop(){stops++;}}]}));f.g.ctx.jsQR=()=>({data:'https://unrelated.invalid'});await f.scanner.start();assert.equal(f.found.length,0);assert.match(f.messages.at(-1),/current Rift/);
    f.g.timers.find(t=>t.ms===60000).fn();assert.equal(stops,1);assert.equal(f.video.srcObject,null);
});
