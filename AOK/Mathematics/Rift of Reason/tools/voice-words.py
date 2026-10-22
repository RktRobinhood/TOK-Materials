# Word timings for one recorded take, for tools/voices.mjs to check its batch cuts (no API, CPU only).
# Prints a JSON array of [word, start, end] (seconds) from faster-whisper.
#
#   <python> tools/voice-words.py <take.wav>
#
# voices.mjs runs this with RIFT_WHISPER_PYTHON (a Python with faster-whisper installed) and passes
# RIFT_WHISPER_MODEL (a model name such as "small" or a local model folder; default "small").
import json, os, sys
from faster_whisper import WhisperModel

model = WhisperModel(os.environ.get('RIFT_WHISPER_MODEL') or 'small', device='cpu', compute_type='int8')
segments, _ = model.transcribe(sys.argv[1], language='en', beam_size=5, word_timestamps=True, vad_filter=False)
print(json.dumps([[w.word.strip(), round(w.start, 3), round(w.end, 3)] for s in segments for w in s.words]))
