# Next Google voice generation — 20 October 2026

Recorded: **2754/2974 catalog lines**. **220 files remain missing:** **174 ready** for the next pass and **46 deferred reserve lines**.

Both models reached their server daily limits. Resume after **09:00 Copenhagen, 21 October**, keeping the saved ledger and existing character/model pins. No billing or recurring-task changes were made.

| Speaker | Model | Ready lines |
|---|---|---:|
| achilles | lite | 1 |
| tally | lite | 13 |
| kuku | lite | 67 |
| pip | lite | 10 |
| granny | flash | 73 |
| rawmsay-possessed | lite | 1 |
| beastie-possessed | lite | 1 |
| zuckerborg-possessed | lite | 1 |
| rockodile-possessed | lite | 1 |
| muskrat-possessed | lite | 1 |
| schoolteacher | lite | 2 |
| avatar-mothkin-boy-inner | lite | 1 |
| beansprout | lite | 2 |

Prioritize the withheld Achilles retake, tutorial hosts and Granny’s remaining customized power explanations. The exact speaker, text, hash ID and model groups are in [next-generation.json](next-generation.json). Use its ready IDs; do not blindly render the deferred Rubberstamp reserve tutorials. He never arrives in the shipped story.

Power wording is a finite inventory: 260 legal configurations produce 173 unique whole lines; 100 are now recorded and 73 remain. All ten default explanations and both formerly missing Constable tutorial lines now have files.

Additional conditional story discovery remains separate from the missing-file count. Eleven proven inherited reminders are now catalogued; other candidate scenes require a reachability decision before recording. See [discovery-gaps.json](discovery-gaps.json). Browser speech removal remains the final completion step after coverage is complete.

Plan or render only the ready inventory in PowerShell, from the game folder:

```powershell
$riftVoiceQueue = Get-Content -Raw 'design/reviews/voice-recording-2026-10-20/next-generation.json' | ConvertFrom-Json
$riftVoiceIds = $riftVoiceQueue.ready.lines.id -join ','
node tools/voices.mjs --plan --id $riftVoiceIds
node tools/voices.mjs --render --id $riftVoiceIds --keep-raw --batch 10
```

The normal ten-request local allowance per model still applies. Failed attempts count. If another agent has already recorded some IDs, the tool skips existing files.
