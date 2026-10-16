# Cutscene critic review

16 October 2026. Reviewed runtime baseline `eaaac24`, including the cold open and the six selected story films.

The story has a strong ending and distinct chapter reversals, but I would not sign off the cinematic presentation yet. The main weaknesses are visible danger left unresolved during exposition, an obscured speaking character, outward-facing protagonists, and cheerful poses during loss. Fix these before adding more explanation or expanding the cinematic scope.

Pending voice recordings are excluded from the criticism. The assessment covers script, staging, rendered frames and playback timing; vocal acting, timbre and physical speaker output are not graded.

## Changes needed before visual signoff

### Make Granny safe before the long confession

In the living Hall route, the first shot shows Granny hanging above a burning pot. That picture remains the background through the mask reveal, the other guests, Nudge's reaction and all three confession lines. In this run her release starts at **74.1 seconds**. The mechanical clock is waiting for its story resolution; the image still communicates an immediate emergency. The player appears to listen to the villain while a friend could burn.

Keep Quill's confession. Establish that the winch has stopped and the heat is no longer a threat, or rearrange the presentation so the rescue precedes her extended explanation. Keep the actual outcome and reward controlled by the story. The brink and death routes need their own equivalent staging, rather than a universal rescue.

Source: `data/cutscenes.js:247–307`; `data/script/lesson2.js:523–535`. Evidence: [Granny above the fire during the confession](cutscene-critic-2026-10-16/hall-confession-captive.jpg), [timing](cutscene-critic-2026-10-16/hall-trace.txt).

### Put the Rift behind Quill while she speaks

During “Tomorrow is waiting. Everyone there has already decided about you,” Quill is present, but the bright Rift covers her face and upper body. This loses the personal threat at the very point where the viewer should see her. The layer order places the Rift after Quill; moving her toward its centre compounds the overlap.

Draw the Rift behind her, keep her head clear until the line finishes, then let her enter it. This needs staging, not a new line or new artwork.

Source: `data/cutscenes.js:342–349`. Evidence: [the threat with Quill obscured](cutscene-critic-2026-10-16/hall-threat-occluded.jpg).

### Give the protagonist attention and an emotional response

The Hall, Tribunal and Core put the protagonist on the right using the normal idle art without the mirroring already used in the homecoming. The Moth girl and Owlet girl visibly face away from the central conversation. The Fox girl keeps a bright smile through Sequins' death and the memorial. Those poses make the player seem detached, even though the writing asks for shock, consideration or grief.

Check facing for each species rather than assuming every illustration shares one orientation. Reuse the existing mirror support where appropriate. Add a restrained, non-smiling whole-body reaction for the ten selectable avatars; current worried/surprised portraits are busts, so substituting them as whole figures would introduce a new composition problem. This request is recorded in Stage 13.85 of the art list.

Sources: `data/cutscenes.js:207`, `254`, `367`, `473`, compared with `607`. Evidence: [Gate loss](cutscene-critic-2026-10-16/gate-loss-feed.jpg), [Hall](cutscene-critic-2026-10-16/hall-confession-captive.jpg), [Core](cutscene-critic-2026-10-16/core-confession.jpg), [narrow memorial](cutscene-critic-2026-10-16/memorial-narrow.jpg).

### Make story lettering readable at its displayed size

The Core's **IT GUESSES** lettering exceeds the sign. At the default 743-pixel CSS viewport, the lettering element was approximately 53 pixels wide while its content required 65. The homecoming already uses a smaller explicit font for a larger sign; carry that care back to the Core.

At a verified **390 × 844 CSS viewport**, the memorial names render at **6.83 pixels**. They fit their boxes but are too small to serve as useful labels. Subtitles and Skip remain within the viewport. Give important lettering a readable screen-space treatment, with layout changes where needed; merely increasing the font can create overlaps between the four names.

Sources: `data/cutscenes.js:582–583`, `628–629`; `js/ui/cutscene.js:422–431`. Evidence: [Core sign](cutscene-critic-2026-10-16/core-label.jpg), [sign measurements](cutscene-critic-2026-10-16/core-sign-metrics.json), [memorial measurements](cutscene-critic-2026-10-16/memorial-narrow-metrics.json).

## Assessment by scene

| Scene | What works | What would improve it |
| --- | --- | --- |
| Cold open | The ordinary village becoming a feed is the strongest camera transition. Surveillance entering the bedroom gives the threat a personal target. Ending on waking creates a useful handoff. | Preserve the quiet opening. Do not fill the silent watching with explanation. Check the scanner's smaller labels when changing responsive lettering. |
| Fair rupture | Boast, saved quote, theft, possession and pursuit form a clear causal chain. Sequins finishes his speech before leaving. Granny's additions help the viewer interpret the unusual events. | Most beats use the same wide composition. Give the net capture and eye-to-gull transfer stronger visual emphasis. The gull changes from a small raised figure to a much larger grounded figure on a cut without a camera change; make that transition feel motivated. |
| Gate aftermath | The empty cage and “still warm” line are economical. The LIVE FEED frame clearly distinguishes Granny's door from the player's location. The villain's reversal creates momentum. | A smiling player weakens the loss. Bring attention toward the empty cushion before the villain resumes. The living Sequins tiers use whole-figure brightness changes, which communicate dimming more readily than a specific loss of sequins. |
| Town Hall | Quill's tired eyes and “Forty years” confession give the antagonist a motive. Physical masks and separate shadow props make the reveal understandable. | This needs the largest revision: the prolonged danger, hidden final threat and player facing away all compete with otherwise good dialogue. |
| Tribunal | Fin's failed-gamble version acknowledges responsibility. Licence deletion gives his decision a cost. The audience withdrawing is a different consequence from another villain simply escaping. | Turn the player toward the proceedings. The exhibit's small movement and Fin's quiet tie gesture would benefit from a more focused composition. Keep the loss version's absence of the Sundial and its restrained Fin staging. |
| Core | The large shell becoming two little boxes is a strong reversal. The chosen question remains visible; the answer is followed by confession and a real fate decision in gameplay. The model-limitation qualification is worth preserving. | The boxes remain small in a detailed, wide chamber throughout the confession. Give their recognition and the plea a closer, simpler whole-object composition, with an attentive protagonist. Repair the sign. The replay caption calls the colossus “three sizes smaller,” but its configured width is still 650 in both preceding shots. |
| Homecoming | Recognition, remembrance, shelf and trophy create a satisfying order. Pip gets his own memorial beat. Actual deaths and understudies matter. The pause after “Probably,” the elder's reply and Nudge's first clap directly answer the Core's motive. | Preserve this structure. Use solemn player art during remembrance and readable memorial labels. The crowd response can remain modest; avoid covering this ending with spectacle. |

The Core's dramatic problem is distance: the confession is more intimate than its picture. The homecoming largely solves that by putting the elder and protagonist near each other and facing the exchange. Apply that attention to the earlier endings while keeping complete silhouettes and Calm motion.

## Voice decisions

**No new explanatory dialogue is necessary for the priority fixes.** Existing words already explain the theft, possession, betrayal, evidence, model limitation and changed meaning of “probably.” More lines would lengthen the Hall's weakest stretch.

One optional addition is useful: let an off-screen Fair seller actually say **“Best nuts in the world! Everyone says so!”** before Nudge's “…Why?” These exact words currently live inside a silent stage-direction caption and a banner (`data/script/lesson4.js:774`), so this is a proposed new spoken cue, not a complaint about an MP3 awaiting delivery. An audible claim would make Nudge's first question feel like a response to a person. Reuse an appropriate established Fair voice if one fits; otherwise define the minor seller deliberately. Pass the writing gate before adding it to the existing recording catalogue. It is not queued by this review.

## Review coverage

Browser playback completed for the cold open, Fair rupture, Gate loss, living Hall, living Tribunal, Core with an escaped unfinished Copy and labelled-left fate, and homecoming with all four deaths, complete Copy, bargain, switched-off box, arrived understudies and the remaining sky crack. Additional checks cover the isolated Hall departure, narrow Calm memorial and Tribunal loss. These are sampled rendered frames with complete-playback traces, not a claim that every outcome was watched end to end.

Recorded completion times: Fair 102.6 s; Gate loss 34.2 s; Hall 116.6 s; living Tribunal 45.3 s; Tribunal loss 57.2 s; selected Core replay 94.4 s; selected homecoming 141.8 s. The Tribunal loss was also inspected at a verified 1280 × 720 CSS viewport. Actual gameplay includes the existing dialogue/choice seams, including the player's Core questions and the playable Summit return; the combined bench replays omit those interactions.

A reproducible [pure planning inventory](cutscene-critic-2026-10-16/inspect-plans.mjs) selected **1,680 plans** across ten avatars, twelve outcome fixtures, seven films and normal/Calm. It found no missing required manifest entries or save mutations. This checks selection, not artistic success. The [full existing suite](cutscene-critic-2026-10-16/full-tests.txt) reports **984 tests: 983 passed, one skipped, zero failures**.

Because the visual findings remain, I have not moved on to an unrelated issue. Runtime scenes, canonical scripts and the recording schedule are unchanged by this assessment.
