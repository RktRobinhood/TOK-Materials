/* Export the same JavaScript film as the title-page player. No API calls. */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { setTimeout as delay } from 'node:timers/promises';
import { createHash } from 'node:crypto';

const GAME = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(GAME, 'assets', 'trailer');
const args = process.argv.slice(2);
const render = args.includes('--render');
const finalize = args.includes('--finalize');
const stillAt = args.indexOf('--still');
const WIDTH = 1280, HEIGHT = 720, FPS = 24;

function canvasRuntime() {
    const require = createRequire(process.env.RIFT_CANVAS_MODULE_DIR ?
        path.join(path.resolve(process.env.RIFT_CANVAS_MODULE_DIR), 'package.json') : import.meta.url);
    try { return require('@napi-rs/canvas'); }
    catch { throw new Error('Install @napi-rs/canvas for this production tool, or set RIFT_CANVAS_MODULE_DIR to its npm project directory.'); }
}

function timestamp(seconds) {
    const ms = Math.round(seconds * 1000);
    return String(Math.floor(ms / 3600000)).padStart(2, '0') + ':' +
        String(Math.floor(ms / 60000) % 60).padStart(2, '0') + ':' +
        String(Math.floor(ms / 1000) % 60).padStart(2, '0') + '.' + String(ms % 1000).padStart(3, '0');
}

async function prepare() {
    const { createCanvas, Image } = canvasRuntime();
    // Return a native Skia image so drawImage receives the real image type.
    function LocalImage() {
        const image = new Image();
        const descriptor = Object.getOwnPropertyDescriptor(Image.prototype, 'src');
        Object.defineProperty(image, 'src', {
            get() { return descriptor.get.call(image); },
            set(value) { descriptor.set.call(image, fs.readFileSync(path.resolve(GAME, value))); },
        });
        return image;
    }
    const context = vm.createContext({ Image: LocalImage, console });
    for (const file of ['js/core/rift.js', 'data/assets.js', 'data/creatures.js', 'data/trailer.js', 'js/ui/trailer-scenes.js']) {
        vm.runInContext(fs.readFileSync(path.join(GAME, file), 'utf8'), context, { filename: file });
    }
    const R = context.Rift, edit = R.data.trailer;
    const loaded = await R.TrailerScenes.load(edit.scenes);
    const missing = loaded.filter(asset => !asset.loaded);
    if (missing.length) throw new Error('Missing film art: ' + missing.map(asset => asset.id).join(', '));
    return { R, edit, canvas: createCanvas(WIDTH, HEIGHT) };
}

async function main() {
    if (!render && !finalize && stillAt < 0) {
        console.log('Export: node tools/trailer-export.mjs --render\nInspect: node tools/trailer-export.mjs --still <seconds> [--output <png-path>]');
        return;
    }
    const { R, edit, canvas } = await prepare();
    if (stillAt >= 0) {
        const time = Number(args[stillAt + 1]);
        if (!Number.isFinite(time) || time < 0 || time >= edit.duration) throw new Error('Still time must be inside the trailer.');
        const outputAt = args.indexOf('--output');
        const output = outputAt < 0 ? path.join(OUT, 'preview.png') : path.resolve(args[outputAt + 1]);
        R.TrailerScenes.draw(canvas, time, edit.scenes);
        fs.writeFileSync(output, canvas.toBuffer('image/png'));
        console.log(output);
        return;
    }
    fs.mkdirSync(OUT, { recursive: true });
    const subtitles = 'WEBVTT\n\n' + edit.lines.map(line => timestamp(line.start) + ' --> ' + timestamp(line.end) + '\n' + line.text + '\n').join('\n');
    const captionFile = path.join(OUT, 'captions.vtt');
    fs.writeFileSync(captionFile, subtitles);
    const output = path.join(OUT, 'Rift-of-Reason.mp4');
    const temporary = path.join(OUT, 'Rift-of-Reason.rendering.mp4');
    const frames = Math.round(edit.duration * FPS);
    async function publish() {
        for (let attempt = 0; ; attempt++) {
            try { fs.renameSync(temporary, output); break; }
            catch (error) {
                if (!['EBUSY', 'EPERM'].includes(error.code) || attempt >= 5) throw error;
                await delay(500 * (attempt + 1));
            }
        }
        R.TrailerScenes.draw(canvas, 78.5, edit.scenes);
        fs.writeFileSync(path.join(OUT, 'poster.webp'), canvas.toBuffer('image/webp', 90));
        const sha256 = file => createHash('sha256').update(fs.readFileSync(path.join(GAME, file))).digest('hex');
        fs.writeFileSync(path.join(OUT, 'video-report.json'), JSON.stringify({
            duration: edit.duration, width: WIDTH, height: HEIGHT, fps: FPS, frames,
            videoCodec: 'h264', audioCodec: 'aac', captions: 'English mov_text and captions.vtt',
            source: 'data/trailer.js + js/ui/trailer-scenes.js', soundtrack: edit.soundtrack,
            hashes: { edit: sha256('data/trailer.js'), compositor: sha256('js/ui/trailer-scenes.js'), soundtrack: sha256(edit.soundtrack) },
            bytes: fs.statSync(output).size,
        }, null, 2) + '\n');
        console.log('Saved ' + output);
    }
    if (finalize) { await publish(); return; }
    const ffmpeg = process.env.RIFT_FFMPEG || 'ffmpeg';
    const ff = spawn(ffmpeg, ['-hide_banner', '-loglevel', 'error', '-y',
        '-f', 'rawvideo', '-pixel_format', 'rgba', '-video_size', WIDTH + 'x' + HEIGHT, '-framerate', String(FPS), '-i', 'pipe:0',
        '-i', path.join(GAME, edit.soundtrack), '-i', captionFile,
        '-map', '0:v', '-map', '1:a', '-map', '2:s', '-c:v', 'libx264', '-preset', 'fast', '-crf', '21', '-pix_fmt', 'yuv420p',
        '-c:a', 'aac', '-b:a', '160k', '-c:s', 'mov_text', '-metadata:s:s:0', 'language=eng',
        '-t', String(edit.duration), '-movflags', '+faststart', temporary], { windowsHide: true });
    let errors = '';
    ff.stderr.on('data', chunk => { errors = (errors + chunk).slice(-6000); });
    const finished = new Promise((resolve, reject) => {
        ff.on('error', reject);
        ff.on('close', code => code === 0 ? resolve() : reject(new Error('FFmpeg failed: ' + errors)));
    });
    // An early encoder failure must reject the writer as well as completion.
    ff.stdin.on('error', () => {});
    try {
        for (let frame = 0; frame < frames; frame++) {
            if (ff.exitCode != null) throw new Error('Encoder stopped: ' + errors);
            R.TrailerScenes.draw(canvas, frame / FPS, edit.scenes);
            if (!ff.stdin.write(canvas.data())) await Promise.race([once(ff.stdin, 'drain'), finished.then(() => { throw new Error('Encoder stopped before the last frame.'); })]);
            if (frame % (FPS * 5) === 0) console.log('Rendered ' + frame / FPS + ' / ' + edit.duration + ' seconds');
        }
        ff.stdin.end();
        await finished;
        await publish();
    } catch (error) {
        ff.kill();
        await finished.catch(() => {});
        throw error;
    }
}

main().catch(error => { console.error(error.message); process.exitCode = 1; });
