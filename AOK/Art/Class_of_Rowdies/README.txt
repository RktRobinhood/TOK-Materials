THE CLASS OF ROWDIES
A TOK Arts lesson: a short film, then a branching scroll-story about a loud class.

Files
  index.html   page shell, the film screening gate, teacher notes in the footer
  film.css     film gate styles (unchanged from the first version)
  story.css    everything after the film
  story.js     THE WORDS: every scene, line, choice, branch and the enlistment questions. Edit here.
  app.js       engine: sound, scroll scenes, the room map, the wall, choices, shocks, enlistment card
  assets/art   public-domain paintings (Wikimedia Commons), stored locally
  assets/audio public-domain / CC0 recordings (Commons, archive.org USC/Sunset collections)
  assets/CREDITS.json  source + licence for every asset
  CRITIC_REVIEW.md     the critic passes this version went through

Shape
  Film -> I   The Noise  (Period 5; Jan Steen's riotous classroom; the teacher's view of 28 seats;
                          a timed choice: say the joke or hold it; "now let everyone do what you did")
       -> II  The Wall   (a battle or an opening, depending on you; "dreams are cheap, you get your Tuesdays";
                          the teacher's offer; a wall built brick by brick along the bottom of the screen;
                          "Check whose hands"; "when do I stop pushing for your future, and when do you start?")
       -> III The Door   (Hammershøi's open doors; Bruegel's Children's Games seen again; Van Gogh's Sower:
                          "Nobody claps for this part"; the room teaching itself)
       -> IV  The Call   ("What would you bring?" - the wall comes down; the School of Athens;
                          "You are the class of rowdies. You don't have to be."; a defaced Kitchener poster,
                          "THE CLASS NEEDS YOU", and an enlistment card students can save)

The enlistment card
  Answers never leave the student's browser. The card (PNG) can be saved and shown to the teacher.
  The last question - one thing you'll do every week - is deliberately never printed.

Sound
  Starts on the "Enter screening" click; "sound on/off" is bottom left.
  Serve over http(s) (GitHub Pages is fine). Opened straight from disk (file://) it falls back
  to simpler playback without filters.

Intensity
  Sudden noise, screen shake and single white flashes (rate-limited, never strobing).
  "shocks: gentle" (bottom left) removes shake/lightning, softens flashes and doubles choice timers;
  it is on automatically for anyone with reduced-motion turned on. Timers pause while the pointer
  is over the choices.

Local testing
  python -m http.server 8765   then open http://localhost:8765/?dev
  (?dev skips the film and only works on localhost.)
