// Dev only: a pinned QR encoder writes local PNGs, with no runtime library.
import {createRequire} from 'node:module';
import fs from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const require=createRequire(import.meta.url),qr=require('qrcode');
const dir=fileURLToPath(new URL('../assets/clues/',import.meta.url));
await fs.mkdir(dir,{recursive:true});
await qr.toFile(dir+'trace.png','RIFT-TRACE',{errorCorrectionLevel:'M',margin:4,width:320});
console.log('Wrote assets/clues/trace.png (plain text: RIFT-TRACE).');
