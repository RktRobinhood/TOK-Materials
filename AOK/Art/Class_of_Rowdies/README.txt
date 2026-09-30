THE CLASS OF ROWDIES / AFTER HOURS
A TOK Arts lesson: a short film, then a branching scroll-story.

Files
  index.html   page shell + the film screening gate
  film.css     film gate styles (unchanged from the first version)
  story.css    everything after the film
  story.js     THE WORDS — every scene, line, choice and branch, in order. Edit here.
  app.js       engine: sound, scroll scenes, choices, shocks, smoke/chatter canvas
  assets/art   public-domain paintings (Wikimedia Commons), stored locally
  assets/audio public-domain / CC0 recordings (Commons, archive.org)
  assets/CREDITS.json  source + licence for every asset
  CRITIC_REVIEW.md     the two critic passes this version went through

Shape
  Film  ->  I  horror (fluorescent corridor, Piranesi, Goya, a door with a slot)
        ->  II chaos  (a glitching speakeasy: smoke, chatter falling like code, a warped 1917 jazz record,
                       three timed choices, an overload, a blackout)
        ->  III order (a match, lamplight, Wright of Derby, Rembrandt's stairs, the wiring tally)
        ->  IV light  (Friedrich's open window, Monet's sunrise, the same jazz record played clean, Period 1)

Sound
  Real recordings now ship with the page (the first version synthesised everything at
  inaudible levels). Sound starts on the "Enter screening" click; "sound on/off" is bottom left.
  Serve over http(s) (GitHub Pages is fine). Opened straight from disk (file://) it falls back
  to simpler playback without the filters/warping.

Intensity
  Sudden noise, screen shake and single white flashes (rate-limited, never strobing).
  "shocks: gentle" (bottom left) removes shake/lightning and softens flashes; it is on
  automatically for anyone with reduced-motion turned on.

Local testing
  python -m http.server 8765   then open http://localhost:8765/?dev
  (?dev skips the film and only works on localhost.)
