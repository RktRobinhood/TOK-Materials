/* Offline QR display/scan. Camera starts only on an explicit Scan press; never stored or sent. */
(function(root){
    'use strict';
    const R=root.Rift;
    function matrix(code,limit){
        const qr=root.qrcode(0,'M');qr.addData(code,'Byte');try{qr.make();}catch(e){throw new Error('This code is too large for QR. Copy and paste it instead.');}
        const modules=qr.getModuleCount(),scale=Math.min(5,Math.floor(limit/(modules+8)));
        if(scale<2)throw new Error('This QR needs a wider screen. Copy and paste the code instead.');
        return {modules,scale,size:(modules+8)*scale,dark:(row,col)=>qr.isDark(row,col)};
    }
    function render(canvas,code,limit){
        const m=matrix(code,limit),ctx=canvas.getContext('2d');canvas.width=canvas.height=m.size;
        ctx.fillStyle='#fff';ctx.fillRect(0,0,m.size,m.size);ctx.fillStyle='#000';
        for(let row=0;row<m.modules;row++)for(let col=0;col<m.modules;col++)if(m.dark(row,col))ctx.fillRect((col+4)*m.scale,(row+4)*m.scale,m.scale,m.scale);
        return m.size;
    }
    function scanner(video,options){
        const o=options,canvas=root.document.createElement('canvas');let stream=null,epoch=0,timer=null,expiry=null;
        function stop(){epoch++;clearTimeout(timer);clearTimeout(expiry);timer=expiry=null;if(stream)stream.getTracks().forEach(track=>track.stop());stream=null;video.srcObject=null;video.hidden=true;canvas.width=canvas.height=0;}
        async function start(){
            stop();const stamp=epoch;
            if(!root.navigator.mediaDevices||!root.navigator.mediaDevices.getUserMedia){o.status('This browser cannot scan here. Paste your partner’s code instead.');return;}
            o.status('Allow the camera, then point it at your partner’s QR.');
            expiry=setTimeout(()=>{if(stamp===epoch){stop();o.status('Camera stopped after one minute. Scan again or paste the code.');}},60000);
            try{
                const result=await root.navigator.mediaDevices.getUserMedia({audio:false,video:{facingMode:{ideal:'environment'},width:{ideal:1280},height:{ideal:720}}});
                if(stamp!==epoch){result.getTracks().forEach(track=>track.stop());return;}
                stream=result;video.srcObject=stream;video.muted=true;video.playsInline=true;video.hidden=false;await video.play();if(stamp!==epoch)return;
                function frame(){
                    if(stamp!==epoch)return;
                    try{
                        if(video.readyState>=2&&video.videoWidth&&video.videoHeight){
                            const scale=Math.min(1,1280/video.videoWidth);canvas.width=Math.round(video.videoWidth*scale);canvas.height=Math.round(video.videoHeight*scale);
                            const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(video,0,0,canvas.width,canvas.height);
                            const pixels=ctx.getImageData(0,0,canvas.width,canvas.height),found=root.jsQR(pixels.data,canvas.width,canvas.height,{inversionAttempts:'dontInvert'});
                            if(found){try{R.Peer.decode(found.data,o.role(),Date.now());}catch(e){o.status('Scan a current Rift connection QR, or paste its code.');timer=setTimeout(frame,200);return;}
                                const code=found.data;stop();o.found(code);return;}
                        }
                        timer=setTimeout(frame,200);
                    }catch(e){stop();o.status('The camera could not read a code. Paste it instead.');}
                }
                frame();
            }catch(e){if(stamp!==epoch)return;stop();o.status('Camera unavailable or not allowed. Paste your partner’s code instead.');}
        }
        return {start,stop};
    }
    R.PeerQR={matrix,render,scanner};
})(typeof window!=='undefined'?window:globalThis);
