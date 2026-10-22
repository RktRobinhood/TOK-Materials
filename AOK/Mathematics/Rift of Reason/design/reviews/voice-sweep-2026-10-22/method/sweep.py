# FAL-262: transcribe every recorded clip locally with faster-whisper small (CPU, no API quota).
# Usage: python sweep.py <voice-dir> <expected.json> <out.json> <shard> <shards> [seed.json]
# Resumable: a clip whose file hash is already in out.json is skipped.
import json, sys, os, hashlib, time
from faster_whisper import WhisperModel
voice, expected, outp, shard, shards = sys.argv[1], sys.argv[2], sys.argv[3], int(sys.argv[4]), int(sys.argv[5])
seed = json.load(open(sys.argv[6]))['clips'] if len(sys.argv) > 6 else {}
lines = [l for i, l in enumerate(json.load(open(expected))) if i % shards == shard]
out = json.load(open(outp)) if os.path.exists(outp) else {}
model = WhisperModel(os.environ.get('WHISPER_DIR', 'small'), device='cpu', compute_type='int8', cpu_threads=int(os.environ.get('THREADS', '4')))
t0, done = time.time(), 0
for l in lines:
    f = os.path.join(voice, l['id'] + '.mp3')
    if not os.path.exists(f): continue
    h = hashlib.sha256(open(f, 'rb').read()).hexdigest()
    if out.get(l['id'], {}).get('sha256') == h: continue
    s = seed.get(l['id'])
    if s and s.get('sha256') == h:
        out[l['id']] = {'say': l['say'], 'heard': s['heard'], 'sha256': h, 'from': 'FAL-260 transcripts.json'}
    else:
        segs, info = model.transcribe(f, language='en', beam_size=5, word_timestamps=True, vad_filter=False)
        segs = list(segs)
        out[l['id']] = {'say': l['say'], 'heard': ' '.join(x.text.strip() for x in segs), 'sha256': h,
                        'duration': round(info.duration, 2),
                        'words': [[w.word.strip(), round(w.start, 2), round(w.end, 2)] for x in segs for w in x.words]}
    done += 1
    if done % 20 == 0:
        json.dump(out, open(outp, 'w'), ensure_ascii=False)
        print(f'{done}/{len(lines)} {time.time() - t0:.0f}s', flush=True)
json.dump(out, open(outp, 'w'), ensure_ascii=False)
print(f'FINISHED shard {shard}: {len(out)} clips in {time.time() - t0:.0f}s', flush=True)
