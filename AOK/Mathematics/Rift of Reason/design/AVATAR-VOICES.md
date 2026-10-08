# Avatar voices — design (8 October 2026)

> **Decision (teacher, 8 Oct 2026): plain voices.** All ten auditions approved as recorded: the plain spoken voice and the plain inner voice (with the existing inner effect). "Distinct, like a Pixar movie." The creature filter and species sounds were tried and dropped. When a character is **possessed by the Algorithm**, they speak as `<id>-possessed`: their own voice, acted slow and flat, then lowered and stretched a little and doubled into the Algorithm's chorus (`tools/voices-fx.mjs` `possessed`). No new voices are needed for possession.

Part of "Avatars that matter" (`design/AVATARS.md`, section 2.1). The ten avatars (5 species × boy/girl, `data/avatars.js`) stop being silent. Each gets one Gemini prebuilt voice used for two deliveries:

1. **Spoken** — normal dialogue with NPCs.
2. **Inner** — the Disco Elysium-style inner voice: the avatar's Way of Knowing speaking inside their head. Same voice, delivered close, quiet and intimate, then a light `inner` effect (`tools/voices-fx.mjs`) so it is clearly "in your head".

Everyone is a **teen protagonist** (about 15) in a cute-and-dark JRPG with Monty-Python-ish comedy: young-sounding, never babyish, never cartoon-squeaky. Comedy comes from timing and attitude, not silly voices.

## Design rules

- **Species = texture and rhythm.** Each Way of Knowing has its own tempo and shape of sentence, so two avatars of the same species sound related and any two species sound different even with the same gender.
- **Boy and girl = different voice and a different angle on the same Way of Knowing.** The coin-flip power split in AVATARS.md (one board power, one "bends the game" power per species) is used as the character hook: e.g. Owlet girl closes proofs (decisive), Owlet boy foresees (careful planner).
- **Voices.** Only Zephyr and Pulcherrima are unused by NPCs, so reuse is unavoidable. Each reused voice is taken from a minor or rarely co-present NPC (one-off caricatures, small town roles), never from a major recurring character (Sundial, Granny, Sequins, Mirage, Syllo, the Algorithm, Corvina, the Mayor, Judge Hoot). Every avatar voice is unique among avatars.
- **Model pinning.** Each speaker keeps one model forever (README rule). Avatars are split 5/5 across flash and lite, one of each species and a mix of genders, so a full avatar pass spreads over both daily quotas.

## Speaker ids (for the voice pipeline)

- Spoken: `avatar-<species>-<variant>`, e.g. `avatar-owlet-boy`, `avatar-mothkin-girl` (species ids as in `data/avatars.js`: owlet, mothkin, fox, frogling, raven).
- Inner: the same id plus `-inner`, e.g. `avatar-owlet-boy-inner`. `tools/voices.mjs` derives these from the spoken entry's `inner` field in `tools/voices-cast.json` (same voice and model, inner acting direction), and `tools/voices-fx.mjs` applies the `inner` effect to every `*-inner` speaker. Recording ids stay `Rift.voiceId(speaker, text)`.
- AVATARS.md: avatar dialogue is recorded 10× (once per avatar); an inner line from `{ inner: { owlet: '…' } }` is recorded 2× (boy and girl of that species). Wiring script lines to these ids is a later step (order of work, step 5); this file only defines the voices.

## The ten voices

| Avatar | Way of Knowing | Voice (Google descriptor) | Model | Also used by (NPC) | Character in one line |
|---|---|---|---|---|---|
| Owlet boy | Reason | Sadaltager (knowledgeable) | flash | lamplighter (minor) | Earnest little logician, over-explains, adorable pedant |
| Owlet girl | Reason | Pulcherrima (forward) | lite | — | Crisp, decisive, already three steps ahead |
| Moth-kin boy | Sense perception | Enceladus (breathy) | lite | muskrat (caricature) | Shy, hushed, notices everything, says it softly |
| Moth-kin girl | Sense perception | Achernar (soft) | flash | euclidon, messilion (caricatures) | Calm, unblinking, quietly unsettling night-watcher |
| Fox kit boy | Imagination | Sadachbia (lively) | flash | siuuugull, usainvolt (caricatures) | Ideas tumbling out faster than he can say them |
| Fox kit girl | Imagination | Zephyr (bright) | lite | — | Theatrical storyteller, sly and conspiratorial |
| Frogling boy | Memory | Zubenelgenubi (casual) | lite | chimpossible, gardener (minor) | Unhurried, croaky, deadpan; has seen it all before (age 15) |
| Frogling girl | Memory | Callirrhoe (easy-going) | flash | hexling (legendary, rare) | Warm old soul, steady, matter-of-fact, dryly funny |
| Raven chick boy | Language | Achird (friendly) | flash | astrophysicat, khaby (hums), core (finale) | Hoodie-cool, dry mumbling wit, weighs every word |
| Raven chick girl | Language | Leda (youthful) | lite | baker, kardashiant (minor) | Sharp-tongued word detective, relishes catching a slip |

## Species texture

| Species | Tempo and rhythm | Texture | Inner voice is like… |
|---|---|---|---|
| Owlet (Reason) | Even, steady, step-by-step; little stresses on "if", "then", "so" | Clear, precise consonants | A calm whispered deduction |
| Moth-kin (Perception) | Slow, with small noticing pauses | Soft, airy, hushed | Almost a breath; a detail pointed out in the dark |
| Fox kit (Imagination) | Fast, bouncy, big pitch swings | Bright, playful, smiling | A conspiratorial grin of a whisper |
| Frogling (Memory) | Slow, rounded, unhurried; recounting cadence | Low, a little throaty and croaky | Soft and far away, like recalling a dream |
| Raven chick (Language) | Deliberate, leans on single words | Dry, wry, articulate | A sardonic murmured aside |

## Acting directions

These are the `style` and `inner` strings in `tools/voices-cast.json` (the cast file is the source of truth if they ever differ). Every direction ends with the shared clause about a creature character, so the model never imitates anyone.

### Owlet boy — Reason — Sadaltager
- **Spoken:** A teenage owl boy of about fifteen, earnest and bookish, young but not childish. Speaks in careful, even steps as if laying out a proof, lightly stressing words like if, then and so; a gentle know-it-all who over-explains, sincere rather than smug, with a tiny proud pause before his conclusion.
- **Inner:** His own thoughts in his head: very close to the microphone, quiet and intimate, almost a whisper, calm and certain, each step of logic placed softly.
- **Why:** "Knowledgeable" suits Reason; the over-explaining pedant is the comic angle, and Foresee (planning ahead) fits a careful step-by-step thinker. Sadaltager's NPC is a minor creaky old duck, and the teen direction pulls it far away from that.

### Owlet girl — Reason — Pulcherrima
- **Spoken:** A teenage owl girl of about fifteen in spectacles, quick and decisive, young but not childish. Crisp, brisk delivery that cuts straight to the point, clean consonants, a confident little snap on the last word, as if she has already solved it and is waiting for everyone else.
- **Inner:** Her own thoughts: very close, quiet and intimate, a brisk confident whisper, logic clicking into place.
- **Why:** "Forward" = Close the Proof: finish it now. Unused voice. Same species rhythm as the boy (precise, step-wise) but faster and more decisive; he lays out the proof, she closes it.

### Moth-kin boy — Sense perception — Enceladus
- **Spoken:** A shy teenage moth boy of about fifteen, young but not childish. Soft, breathy and hushed, a little fluttery and hesitant, with small pauses as he notices things; gentle and polite, slightly amazed by details everyone else missed.
- **Inner:** His own thoughts: barely above a breath, very close and intimate, slow, pointing out one small detail in the dark.
- **Why:** "Breathy" is the moth: soft wings, night air. His power Lantern is a small precise light on one target. The muskrat caricature is a minor one-off.

### Moth-kin girl — Sense perception — Achernar
- **Spoken:** A teenage moth girl of about fifteen, young but not childish. Soft, low and calm, slow and unblinking, cool and a little eerie in a cute way; she states what she sees plainly and lets it hang, like someone watching from the dark.
- **Inner:** Her own thoughts: very close, a quiet steady murmur, intimate and observant, slightly eerie, never rushed.
- **Why:** "Soft" but steady; Night Sight is seeing the hidden hand, so she is the quietly unsettling one who sees too much. Same hushed species texture as the boy, but calm and cool where he is shy and fluttery.

### Fox kit boy — Imagination — Sadachbia
- **Spoken:** An excitable teenage fox boy of about fifteen, young but not childish. Fast, bouncy and lively, words tumbling out as new ideas arrive mid-sentence, big pitch swings, laughing easily at his own wild plans.
- **Inner:** His own thoughts: close and quiet but still bubbling, a fast excited whisper, as if an idea just sparked.
- **Why:** "Lively" fits Brainstorm (+1 card play): more options, more chaos. The Monty-Python energy lives here.

### Fox kit girl — Imagination — Zephyr
- **Spoken:** A teenage fox girl of about fifteen, young but not childish. Bright, sly and theatrical, a storyteller who paints pictures with her voice, playful rises and dramatic little drops, conspiratorial as if letting you in on a secret.
- **Inner:** Her own thoughts: very close and intimate, a sly playful whisper, painting a picture in your head.
- **Why:** "Bright", unused. What If? (swap attack and health) is imaginative reframing; she is the storyteller, the boy is the inventor. Same fast, swinging species rhythm, but controlled and theatrical rather than tumbling.

### Frogling boy — Memory — Zubenelgenubi
- **Spoken:** A laid-back teenage frog boy of about fifteen, young but not childish. Slow, unhurried and deadpan, a slightly croaky, throaty low voice, matter-of-fact as if he has seen all of this before; dry comic timing, never sleepy.
- **Inner:** His own thoughts: close and quiet, slow and a little far away, like remembering something from long ago.
- **Why:** "Casual" plus a croaky direction gives the frog. Recall (bring back the fallen) fits the "been here before" deadpan, which is great for comedy.

### Frogling girl — Memory — Callirrhoe
- **Spoken:** A teenage frog girl of about fifteen, young but not childish. Warm, steady and easy-going, a rounded slightly throaty voice, unhurried and matter-of-fact like an old soul, quietly and dryly funny, recalling details with total confidence.
- **Inner:** Her own thoughts: very close and soft, warm and steady, like a memory gently surfacing.
- **Why:** "Easy-going" and rounded; Hold That Thought (nudging Fate) suits a calm, patient keeper of time. Same slow species rhythm as the boy, but warm where he is deadpan. Hexling is a rare legendary with few lines.

### Raven chick boy — Language — Achird
- **Spoken:** A teenage raven boy of about fifteen in an oversized hoodie, young but not childish. Dry, wry and low-key, a slightly mumbled cool, leaning on single words as if weighing them, quiet sarcasm and very good comic timing.
- **Inner:** His own thoughts: very close, a dry murmured aside, quiet and knowing.
- **Why:** "Friendly" underneath the cool keeps him likeable. Fine Print (paying hearts for cards) is the reads-the-small-print kid. Achird's NPCs are a cat (lite), a llama that only hums, and the finale's tiny dice cloud.

### Raven chick girl — Language — Leda
- **Spoken:** A teenage raven girl of about fifteen in a beret, young but not childish. Sharp, quick-tongued and articulate, crisp enunciation that relishes every word, a word detective delighted to catch someone's slip, a little theatrical.
- **Inner:** Her own thoughts: very close and intimate, a sharp knowing whisper, underlining one word.
- **Why:** "Youthful" keeps her the youngest-sounding of the girls without going babyish; Call It Out (strip a creature's defences) is catching a word trick. Same word-leaning species rhythm as the boy, but sharp and quick where he is dry and slow.

## The inner effect (`tools/voices-fx.mjs`, `FX.inner`)

Applied to every speaker id ending in `-inner`, after the "close, quiet, intimate" acting direction:

- **EQ:** high-pass at 90 Hz (rumble out), +2.5 dB low shelf at 220 Hz (a little bone-conduction warmth, like hearing yourself), −5 dB high shelf from 3 kHz and a gentle low-pass at 7 kHz (softer sibilance and air). Not a telephone band: the voice stays full and clear, just rounder, "inside the skull" rather than "in the room";
- a very small, damped **room** (reverb size 0.25, mix 0.07, about 0.04 s of tail) so the voice sits just behind your ears;
- about **−4 dB** peak compared with spoken lines (the normaliser otherwise puts every clip at the same peak).

Deliberately subtle: no pitch change, no chorus, no echo trail — those belong to the Algorithm. Checked offline with a synthetic signal (`tools/test/voices-fx.test.mjs`): 6 kHz drops about 7 dB relative to 400 Hz, the peak is about 4 dB lower, the tail is short. A text-model listen check on two auditions heard the inner clip as "quieter, closer, more inward" with the words intact.

## Auditions

`node tools/voices.mjs --audition --avatars <id[,id…]>` (or `--avatars all`) sends **one request per avatar**: a spoken sample and an inner sample in the same request, each with its own acting direction. The audio is split at the gap into `tools/voice-auditions/<id>.mp3` and `<id>-inner.mp3` (inner effect applied); if the split fails, the whole take is kept as `<id>-take.mp3`. The usual quota ledger applies (10 attempts per model per Pacific day).

Sample lines (one pair per species):

| Species | Spoken | Inner |
|---|---|---|
| Owlet | If the bridge only opens at noon, how did the baker cross it at ten? | If the left guard is lying, then the door he points to is safe. |
| Moth-kin | Does anyone else smell burnt sugar? Because I do. Very strongly. | The left guard won't meet your eyes. |
| Fox kit | Okay, hear me out. What if the dragon is just three ducks in a coat? | What if the guard is guarding the wrong door on purpose? |
| Frogling | We've been here before. Same puddle, same sign, same angry goose. | Last time the clock struck three, the bridge went up. |
| Raven chick | He didn't say it was safe. He said it was "probably fine". | He said "always". Nobody can check "always". |

### Audition status

Pacific day 2026-10-07: lite was already at the 10-attempt cap, flash had 7 left. The five flash-pinned avatars were auditioned (5 attempts, all split cleanly; flash ended the day at 8/10, two left as a margin). Lite-pinned avatars were **not** moved to flash to get round the cap.

| Avatar | Model | Audition | Notes |
|---|---|---|---|
| Owlet boy | flash | done | Listen check: teen male, "bright, curious"; inner clearly quieter, closer, thought-like; words exact |
| Owlet girl | lite | **to do** | |
| Moth-kin boy | lite | **to do** | |
| Moth-kin girl | flash | done | Listen check: teen female, observant; inner "hushed, intimate"; words exact |
| Fox kit boy | flash | done | |
| Fox kit girl | lite | **to do** | |
| Frogling boy | lite | **to do** | |
| Frogling girl | flash | done | |
| Raven chick boy | flash | done | |
| Raven chick girl | lite | **to do** | |

**Next quota day:** `node tools/voices.mjs --audition --avatars avatar-owlet-girl,avatar-mothkin-boy,avatar-fox-girl,avatar-frogling-boy,avatar-raven-girl` (5 lite attempts). Then the teacher listens to all ten pairs in `tools/voice-auditions/` and picks any to recast; a recast costs one attempt each on that avatar's model.
