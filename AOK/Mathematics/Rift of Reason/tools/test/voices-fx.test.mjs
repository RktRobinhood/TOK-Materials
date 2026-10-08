import test from 'node:test';
import assert from 'node:assert/strict';
import {applyFx,fxFor,FX} from '../voices-fx.mjs';
// Energy of one frequency (Goertzel), in the steady middle of the clip.
function power(pcm,rate,hz){
 const a=Math.floor(pcm.length*0.25),b=Math.floor(pcm.length*0.75),k=2*Math.cos(2*Math.PI*hz/rate);let s1=0,s2=0;
 for(let i=a;i<b;i++){const s=pcm[i]+k*s1-s2;s2=s1;s1=s;}
 return s1*s1+s2*s2-k*s1*s2;
}
const peak=pcm=>pcm.reduce((m,v)=>Math.max(m,Math.abs(v)),0);
test('inner voice: every *-inner speaker gets the subtle inner effect, others are untouched',()=>{
 assert.equal(fxFor('avatar-owlet-boy-inner'),FX.inner);assert.equal(fxFor('avatar-fox-girl-inner'),FX.inner);
 assert.equal(fxFor('avatar-owlet-boy'),null);assert.equal(fxFor('granny'),null);assert.equal(fxFor('narrator'),FX.narrator);
 const rate=24000,n=rate*2,pcm=new Int16Array(n);
 for(let i=0;i<n;i++)pcm[i]=Math.round(9000*Math.sin(2*Math.PI*400*i/rate)+9000*Math.sin(2*Math.PI*6000*i/rate));
 assert.equal(applyFx('avatar-owlet-boy',pcm,rate),pcm,'the spoken delivery stays dry');
 const out=applyFx('avatar-owlet-boy-inner',pcm,rate);
 const db=(o,i,hz)=>10*Math.log10(power(o,rate,hz)/power(i,rate,hz));
 const tilt=db(out,pcm,6000)-db(out,pcm,400);
 assert.ok(tilt<-6&&tilt>-20,'highs softened, not a telephone band: '+tilt.toFixed(1)+' dB');
 assert.ok(peak(out)<0.6*32767&&peak(out)>0.5*32767,'about 4 dB below the spoken peak');
 assert.ok(out.length>=n&&out.length<n+rate*0.6,'only a short room tail: '+((out.length-n)/rate).toFixed(2)+' s');
});
