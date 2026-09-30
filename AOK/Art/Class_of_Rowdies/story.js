/* =====================================================================
   THE CLASS OF ROWDIES / AFTER HOURS — the story
   ---------------------------------------------------------------------
   Everything a reader sees after the film lives here, in order.
   Edit words freely; the engine (app.js) only cares about the shape.

   Scene fields
     id        unique id
     label     text in the vertical chapter marker
     act       1 horror / 2 chaos / 3 order / 4 light
     h         scroll length in viewport-heights (longer = slower)
     chaos     0..1 — glitch, scrambled type, tilt, grain, smoke darkness.
               Act I sits low on purpose: dread is quiet. Act II slopes up
               from seductive (.55) to rotten (1.0) at the overload.
               Scenes under .3 stop scattering their words and line them up.
     smoke     0..1 — smoke density           rain 0..1 — falling chatter
     art       image in assets/art/
     look      stagecraft: tube | door | neon | overload | dark | dark-art | lamp | window-light | tally | window | dawn
     mix       ambience levels (see Sound in app.js); mixAfter = after a 'silence' cue
     beats     lines revealed by scroll: { at: 0..1, t: text, k: kind }
               kinds: line (default) | slam | whisper | quote | sign
               t may be a function of state (lines that remember you); '' hides the line
     cue       one-shot events keyed by progress: { at, fx }
               shocks ('jolt') sit only on moments every reader reaches — never on a choice
     when      state => boolean — branch scenes only appear on their path
     gate      'password' or a fork; nothing below appears until it is met
   ===================================================================== */

const LIST=a=>a.length<2?a.join(''):a.slice(0,-1).join(', ')+' and '+a[a.length-1];

window.STORY = [

/* ---------------------------------------------------------------- ACT I — dread */
{ id:'period5', label:'I / PERIOD 5', act:1, h:240, chaos:.4, look:'tube',
  mix:{ hum:.75, drone:.25 },
  cue:[ { at:.02, fx:'bellLow' } ],
  beats:[
    { at:.00, k:'whisper', t:'contains sudden noise, shaking and single flashes — “shocks: gentle” (bottom left) softens them' },
    { at:.12, k:'slam', t:'PERIOD 5.' },
    { at:.34, t:'The bell went four minutes ago.' },
    { at:.52, t:'Nobody came.' },
    { at:.72, t:'The lights haven’t decided either.' }
  ]},

{ id:'corridor', label:'I / THE CORRIDOR', act:1, h:320, chaos:.45, look:'tube', art:'piranesi-carceri.jpg',
  credit:'Giovanni Battista Piranesi, <i>Carceri d’invenzione</i> (Imaginary Prisons), 1761',
  mix:{ hum:.55, drone:.45, heart:.35, jazz:.22, jazzCut:320 },
  beats:[
    { at:.10, t:'The corridor keeps going.' },
    { at:.28, t:'Stairs up. Stairs down. Stairs to more stairs.' },
    { at:.48, t:'Every door you pass is propped open.' },
    { at:.62, k:'slam', t:'Nobody walks through.' },
    { at:.82, k:'whisper', t:'somewhere below: music' }
  ]},

{ id:'saturn', label:'I / TIME', act:1, h:300, chaos:.45, look:'tube', art:'goya-saturn.jpg',
  credit:'Francisco Goya, <i>Saturn Devouring His Son</i>, c. 1819–23',
  mix:{ drone:.7, heart:.6, clock:.55, clockRate:.72, jazz:.18, jazzCut:280 },
  cue:[ { at:.66, fx:'jolt' } ],
  beats:[
    { at:.10, t:'Down here, time eats.' },
    { at:.30, t:'Not all at once.' },
    { at:.46, t:'An hour here. A lesson there.' },
    { at:.66, k:'slam', t:'It’s been chewing since September.' }
  ]},

{ id:'door', label:'I / THE DOOR', act:1, h:230, chaos:.4, look:'door', gate:'password',
  mix:{ drone:.35, heart:.55, jazz:.5, jazzCut:650, chatter:.18, chatterCut:500 },
  cue:[ { at:.24, fx:'knock' }, { at:.46, fx:'slot' } ],
  beats:[
    { at:.06, t:'A door. A slot at eye height.' },
    { at:.20, k:'whisper', t:'you knock' }
  ]},

/* ---------------------------------------------------------------- ACT II — the speakeasy */
{ id:'inside', label:'II / AFTER HOURS', act:2, h:340, chaos:.55, smoke:.8, rain:.45, look:'neon', art:'lautrec-moulin-rouge.jpg',
  credit:'Henri de Toulouse-Lautrec, <i>At the Moulin Rouge</i>, 1892–95',
  signs:['NO CLOCKS','OPEN ALL NIGHT'],
  mix:{ jazz:.85, chatter:.7, crackle:.35, warp:.2, dirt:.05 },
  cue:[ { at:.78, fx:'bulbOn' } ],
  beats:[
    { at:.08, k:'slam', t:'Nobody checks the time in here.' },
    { at:.24, t:'Nobody checks anything.' },
    { at:.38, t:'Everyone’s humming with the same thing. You can feel it in your teeth.' },
    { at:.55, t:'It isn’t good. It isn’t bad.' },
    { at:.64, k:'slam', t:'It’s just current.' },
    { at:.78, t:'One bulb hangs over the bar, flickering like it can’t make up its mind.' }
  ]},

{ id:'fork-stage', label:'II / THE SILENCE', act:2, h:190, chaos:.65, smoke:.9, rain:.35, look:'neon',
  signs:['TONIGHT ONLY'],
  mix:{ jazz:.8, chatter:.6, crackle:.3, warp:.3, dirt:.08 },
  mixAfter:{ chatter:.08, chatterCut:700, crackle:.55, heart:.42 },
  cue:[ { at:.18, fx:'silence' } ],
  beats:[
    { at:.04, t:'The band stops for a smoke.' },
    { at:.18, k:'slam', t:'Silence.' },
    { at:.32, t:'Every face turns, looking for who fills it.' }
  ],
  gate:{ fork:'stage', at:.42, timer:13, timeout:'heckle',
    timeoutToast:'You didn’t choose. The room filled the silence for you.',
    options:[
      { id:'heckle', wire:'neon', sign:'HA HA HA', label:'Heckle the empty stage', sub:'The laugh is right there. Take it.', toast:'The room will remember that.' },
      { id:'stage',  wire:'lamp', label:'Get up on it', sub:'No idea what you’ll do. Go anyway.', toast:'The bulb will remember that.' }
    ]}},

{ id:'heckle', label:'II / THE LAUGH', act:2, h:280, chaos:.85, smoke:1, rain:.9, look:'neon', art:'ensor-intrigue.jpg',
  credit:'James Ensor, <i>The Intrigue</i>, 1890',
  when:s=>s.forks.stage==='heckle',
  mix:{ chatter:1, jazz:.35, warp:.5, dirt:.3, crackle:.3 },
  cue:[ { at:.08, fx:'roar' } ],
  beats:[
    { at:.06, k:'slam', t:'It lands.' },
    { at:.20, t:'The whole room roars.' },
    { at:.38, t:'For eleven seconds you’re the most important person here.' },
    { at:.60, t:'Then the laugh needs feeding again.' },
    { at:.76, k:'slam', t:'And again.' }
  ]},

{ id:'stage', label:'II / THE LIGHT ON YOU', act:2, h:300, chaos:.6, smoke:.6, rain:.1, look:'neon', art:'degas-star.jpg',
  credit:'Edgar Degas, <i>The Star</i> (<i>L’Étoile</i>), c. 1876–78',
  when:s=>s.forks.stage==='stage',
  mix:{ chatter:.08, heart:.8, jazz:.12, jazzCut:500, crackle:.3 },
  beats:[
    { at:.06, t:'The spotlight is hotter than it looks.' },
    { at:.22, t:'Your hands have nothing to do.' },
    { at:.38, t:'You start anyway. Badly.' },
    { at:.52, k:'slam', t:'Then less badly.' },
    { at:.70, t:'The room goes quiet. Not bored quiet.' },
    { at:.82, k:'slam', t:'Listening quiet.' }
  ]},

{ id:'bandback', label:'II / THE BAND COMES BACK', act:2, h:170, chaos:.8, smoke:1, rain:.7, look:'neon',
  signs:['ONE MORE'],
  mix:{ jazz:.85, chatter:.65, crackle:.3, warp:.45, dirt:.18 },
  beats:[
    { at:.08, t:'The band comes back. The night goes on either way.' },
    { at:.34, t:'Nobody in here is keeping score.' },
    { at:.62, k:'whisper', t:'(the room is)' }
  ]},

{ id:'fork-napkin', label:'II / THE NAPKIN', act:2, h:200, chaos:.85, smoke:.9, rain:.7, look:'neon', art:'munch-karl-johan.jpg',
  credit:'Edvard Munch, <i>Evening on Karl Johan</i>, 1892',
  mix:{ jazz:.6, chatter:.5, crackle:.3, warp:.4, dirt:.1 },
  cue:[ { at:.20, fx:'buzz' }, { at:.28, fx:'buzz' }, { at:.36, fx:'buzz' } ],
  beats:[
    { at:.04, t:'At the end of the bar, an old man has been drawing on the same napkin all night.' },
    { at:.20, k:'sign', t:'bzzt' },
    { at:.28, k:'sign', t:'bzzt' },
    { at:.36, k:'sign', t:'bzzt' }
  ],
  gate:{ fork:'napkin', at:.44, timer:13, timeout:'phone',
    timeoutToast:'You didn’t choose. The buzzing did.',
    options:[
      { id:'phone',  wire:'neon', sign:'FOR YOU', label:'Answer it', sub:'One message. Somebody just said your name.', toast:'The room will remember that.' },
      { id:'napkin', wire:'lamp', label:'Lean over his shoulder', sub:'Nobody has ever asked him what it is.', toast:'The bulb will remember that.' }
    ]}},

{ id:'phone', label:'II / FOR YOU', act:2, h:280, chaos:.95, smoke:.8, rain:1, look:'neon', art:'degas-absinthe.jpg',
  credit:'Edgar Degas, <i>L’Absinthe</i>, 1875–76',
  when:s=>s.forks.napkin==='phone',
  mix:{ chatter:.35, chatterCut:900, jazz:.3, jazzCut:900, drone:.3, warp:.6, crackle:.3 },
  beats:[
    { at:.06, t:'One becomes forty.' },
    { at:.22, t:'Everyone’s in there. Everyone’s typing.' },
    { at:.42, t:'When you look up, his stool is empty.' },
    { at:.56, t:'The napkin’s gone.' },
    { at:.74, k:'slam', t:'You laughed at nine things. You can’t name one.' }
  ]},

{ id:'napkin', label:'II / THE WING', act:2, h:300, chaos:.55, smoke:.6, rain:.15, look:'neon', art:'leonardo-flying-machine.jpg',
  credit:'Leonardo da Vinci, design for a flying machine, c. 1485–90',
  when:s=>s.forks.napkin==='napkin',
  mix:{ chatter:.3, chatterCut:1400, jazz:.35, jazzCut:1600, crackle:.25 },
  beats:[
    { at:.06, k:'slam', t:'It’s a wing.' },
    { at:.20, t:'It doesn’t work.' },
    { at:.34, t:'He’s been getting it wrong for forty years and looks delighted about it.' },
    { at:.56, t:'He slides the pencil over.' },
    { at:.72, k:'quote', t:'“What would you change?”' }
  ]},

{ id:'overload', label:'II / OVERLOAD', act:2, h:380, chaos:1, smoke:1, rain:1, look:'overload', art:'ensor-skeletons-herring.jpg',
  credit:'James Ensor, <i>Skeletons Fighting over a Pickled Herring</i>, 1891',
  mix:{ jazz:1, chatter:1, crackle:.5, warp:.9, dirt:.55, hum:.3 },
  cue:[ { at:.20, fx:'salon' }, { at:.36, fx:'salon' }, { at:.74, fx:'blowout' } ],
  beats:[
    { at:.06, t:'Somebody turns it up.' },
    { at:.20, k:'slam', t:'Somebody turns it up again.' },
    { at:.36, t:s=>s.lamp>=2?'Even the corner you found is shaking. Everyone buzzing at once.':'Every body in here buzzing at once, and nowhere to put it.' },
    { at:.56, k:'slam', t:'The bulb over the bar goes white —' },
    { at:.86, k:'whisper', t:'ringing' }
  ]},

/* ---------------------------------------------------------------- ACT III — order */
{ id:'dark', label:'III / DARK', act:3, h:250, chaos:.28, look:'dark',
  mix:{ tinnitus:.6, room:.35 },
  cue:[ { at:.34, fx:'breath' }, { at:.72, fx:'match' } ],
  beats:[
    { at:.10, t:'The silence is louder than the band was.' },
    { at:.34, t:'Somebody near you is breathing.' },
    { at:.52, t:'Somebody else is laughing, quietly, at nothing.' },
    { at:.72, k:'slam', t:'Somebody strikes a match.' },
    { at:.86, t:'Somebody else finds the lamp.' }
  ]},

{ id:'lamp', label:'III / LAMPLIGHT', act:3, h:320, chaos:.28, look:'lamp', art:'wright-orrery.jpg', lampAt:[.5,.55],
  credit:'Joseph Wright of Derby, <i>A Philosopher Lecturing on the Orrery</i>, c. 1766',
  mix:{ tinnitus:.05, room:.4, clock:.25, clockRate:1 },
  cue:[ { at:.02, fx:'lampOn' } ],
  beats:[
    { at:.10, t:'In lamplight the room is smaller than it sounded.' },
    { at:.26, t:'Full of faces you thought you knew.' },
    { at:.44, t:s=>s.forks.napkin==='napkin'?'The old man with the pencil is explaining how the planets move.':'Someone is explaining how the planets move. You’ve seen him before. End of the bar. The napkin.' },
    { at:.60, t:'Nobody asked him to.' },
    { at:.74, k:'slam', t:'Everyone’s leaning in anyway.' }
  ]},

{ id:'fork-lamp', label:'III / THE WHISPER', act:3, h:180, chaos:.28, look:'lamp', art:'wright-orrery.jpg', lampAt:[.5,.55],
  mix:{ room:.4, clock:.3 },
  beats:[
    { at:.04, t:'The kid beside you leans over.' },
    { at:.18, k:'quote', t:'“Blow it out. It was better in the dark.”' }
  ],
  gate:{ fork:'lamp', at:.36, timer:15, timeout:'blow',
    timeoutToast:'You didn’t choose. Somebody else’s breath did.',
    options:[
      { id:'blow',  wire:'neon', sign:'LIGHTS OUT', label:'Blow it out', sub:'Back to the noise. Nobody could see you in it.', toast:'The room will remember that.' },
      { id:'chair', wire:'lamp', label:'Pull up a chair', sub:'Closer. You might have to say something.', toast:'The bulb will remember that.' }
    ]}},

{ id:'blow', label:'III / THE SLEEP', act:3, h:270, chaos:.7, smoke:.3, look:'dark-art', art:'goya-sleep-reason.jpg',
  credit:'Francisco Goya, <i>The Sleep of Reason Produces Monsters</i>, 1799',
  when:s=>s.forks.lamp==='blow',
  mix:{ drone:.45, room:.2, chatter:.12, chatterCut:400 },
  beats:[
    { at:.06, k:'slam', t:'Dark again. Nobody can see you.' },
    { at:.26, t:'Things with wings come out when nobody’s looking.' },
    { at:.46, t:'They don’t bite.' },
    { at:.60, t:'They just stay.' },
    { at:.76, t:'In the morning you won’t remember them. You’ll just be tired.' }
  ]},

{ id:'chair', label:'III / THE EXPERIMENT', act:3, h:300, chaos:.2, look:'lamp', art:'wright-air-pump.jpg', lampAt:[.5,.45],
  credit:'Joseph Wright of Derby, <i>An Experiment on a Bird in the Air Pump</i>, 1768',
  when:s=>s.forks.lamp==='chair',
  mix:{ room:.4, clock:.2, clockRate:1 },
  beats:[
    { at:.06, t:'Up close it isn’t a lecture. It’s an experiment.' },
    { at:.22, t:'Someone gets it wrong.' },
    { at:.34, t:'Someone gets it less wrong.' },
    { at:.52, t:'Someone asks the question you had and didn’t say.' },
    { at:.70, k:'slam', t:'It was a good question.' }
  ]},

{ id:'stairs', label:'III / THE STAIRS', act:3, h:280, chaos:.12, look:'window-light', art:'rembrandt-philosopher.jpg',
  credit:'Rembrandt (attributed), <i>Philosopher in Meditation</i>, 1632',
  mix:{ room:.3, clock:.12, clockRate:1, birds:.1, jazz:.18 },
  beats:[
    { at:.08, t:s=>s.forks.lamp==='blow'?'Somebody lit it again. Nobody made a thing of it.':'The lamp is still going.' },
    { at:.26, k:'slam', t:'Same stairs.' },
    { at:.44, t:'Up. Down. Same as before.' },
    { at:.62, t:'Only now you can see which way you’re facing.' }
  ]},

{ id:'tally', label:'III / THE WIRING', act:3, h:280, chaos:.08, look:'tally',
  mix:{ room:.25, birds:.12, jazz:.22 },
  cue:[ { at:.06, fx:'cageShow' } ],
  beats:[
    { at:.06, k:'slam', t:'Look up.' },
    { at:.22, t:'Every bar in here was wired by somebody.' },
    { at:.38, t:s=>{
        const n=s.neon.length;
        if(!n) return 'None of them have your wiring on them. They’re still here.';
        let line=LIST(s.neon)+(n===1?' has your wiring on it.':' have your wiring on them.')+' At the time it just felt like the night.';
        if(s.timeouts&&s.timeouts===n) line+=' You never picked '+(n===1?'it':'any of them')+'. Your hands wired '+(n===1?'it':'them')+' anyway.';
        else if(s.timeouts) line+=' '+(s.timeouts===1?'One of them':'Some of them')+' you never picked. Your hands wired '+(s.timeouts===1?'it':'them')+' anyway.';
        return line;
      }},
    { at:.56, t:'The neon hums.' },
    { at:.66, t:'The lamp doesn’t.' },
    { at:.80, k:'slam', t:'Same current.' }
  ]},

/* ---------------------------------------------------------------- ACT IV — light */
{ id:'window', label:'IV / THE OPEN DOOR', act:4, h:260, chaos:.04, look:'window', art:'friedrich-woman-window.jpg',
  credit:'Caspar David Friedrich, <i>Woman at a Window</i>, 1822',
  mix:{ birds:.45, room:.15, jazz:.28 },
  beats:[
    { at:.06, t:'Every door upstairs was propped open. So is this one.' },
    { at:.22, t:'Morning is coming in around the edges.' },
    { at:.38, t:'Nobody’s stopping you.' },
    { at:.50, t:'Nobody’s pushing you, either.' }
  ],
  gate:{ fork:'final', at:.60,
    options:[
      { id:'stay', wire:'none', label:'One more song', sub:'The band is still good. It’s still dark enough.', toast:'The door stays open.' },
      { id:'walk', wire:'none', label:'Walk out into it', sub:'No map. Just morning.', toast:'' }
    ]}},

{ id:'loop', label:'IV / ONE MORE SONG', act:4, h:240, chaos:.4, smoke:.5, rain:.2, look:'neon', art:'lautrec-moulin-rouge.jpg',
  credit:'Henri de Toulouse-Lautrec, <i>At the Moulin Rouge</i>, 1892–95',
  when:s=>s.forks.final==='stay',
  signs:['ONE MORE'],
  mix:{ jazz:.6, chatter:.35, crackle:.5, warp:.2, skip:1 },
  beats:[
    { at:.06, t:'The band plays it again.' },
    { at:.24, t:'It’s a good song. It was a good song the last four times.' },
    { at:.46, t:'Nobody’s stopping you.' },
    { at:.58, t:'The door stays open. It doesn’t close on anyone.' }
  ],
  gate:{ fork:'door', at:.70,
    options:[
      { id:'again', wire:'none', label:'One more', sub:'Just one.', toast:'' },
      { id:'walk',  wire:'none', label:'Walk out', sub:'Whenever you’re ready. It was always there.', toast:'' }
    ]}},

{ id:'packup', label:'IV / LAST ORDERS', act:4, h:200, chaos:.2, look:'dark',
  when:s=>s.forks.door==='again',
  mix:{ birds:.35, room:.2, crackle:.3 },
  beats:[
    { at:.08, t:'The band packs up.' },
    { at:.30, t:'Somebody opens the shutters.' },
    { at:.54, k:'slam', t:'Morning came in without asking.' }
  ]},

{ id:'morning', label:'IV / MORNING', act:4, h:340, chaos:0, keep:9, look:'dawn', art:'monet-sunrise.jpg',
  credit:'Claude Monet, <i>Impression, Sunrise</i>, 1872',
  when:s=>s.forks.final==='walk'||!!s.forks.door,
  mix:{ jazz:.55, birds:.45 },
  cue:[ { at:.02, fx:'bulbOff' }, { at:.93, fx:'bellHigh' } ],
  beats:[
    { at:.06, k:'slam', t:'Morning.' },
    { at:.18, t:s=>s.forks.final==='stay'?'Period 1. You’re a little late. Nobody says anything.':'Period 1.' },
    { at:.30, t:'Same room. Same people.' },
    { at:.42, k:'slam', t:'Same electricity.' },
    { at:.56, t:'The bell hasn’t gone yet.' },
    { at:.68, k:'whisper', t:s=>s.forks.napkin==='napkin'?'there’s a pencil in your pocket that isn’t yours':'' },
    { at:.74, k:'whisper', t:s=>s.pw?'last night the word at the door was “'+s.pw+'”':'last night you didn’t need a word at the door' },
    { at:.80, k:'whisper', t:'in daylight, nobody asks' }
  ],
  end:true }
];

/* The chatter that falls through the speakeasy like broken code. */
window.CHATTER=['did you see','lol','wait wait','one more','who cares','nobody’s checking','shh','HAHA','later','tomorrow','bro','what time is it','doesn’t matter','again','look at this','skip','boring','5 more min','ok but','literally','no way','for you','again again','who even','same','dead','it’s fine','later later','LOUDER','did he just','say it again','who’s got','it’s not even','watch this','i swear','no because','i can’t'];
