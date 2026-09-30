/* =====================================================================
   THE CLASS OF ROWDIES — the journey after the film
   ---------------------------------------------------------------------
   A turbulent class, like the one in the film. The same room can become
   a battle or something good, and it goes both ways: the teacher answers
   what the class does. Everything a reader sees lives here, in order.
   Edit words freely; the engine (app.js) only cares about the shape.

   Scene fields
     id / label  unique id / text in the vertical chapter marker
     act         1 the noise / 2 the wall / 3 the door / 4 the call
     h           scroll length in viewport-heights (longer = slower)
     chaos       0..1 glitch, scrambled type, tilt, haze darkness.
                 Under .3 the words stop scattering and line up to be read.
     smoke/rain  0..1 haze density / falling classroom chatter
     art         image in assets/art/ (artAlt: fallback image)
     look        tube | frame | room | wall | lamp | clean | light | recruit
     room        (look 'room') what the teacher sees: 'noise' | 'split' | 'waiting' | 'teaching'
                 or a function of state
     mix         ambience levels (see Sound in app.js)
     beats       lines revealed by scroll: { at: 0..1, t: text, k: kind }
                 kinds: line (default) | slam | whisper | quote
                 t may be a function of state; '' hides the line
     cue         one-shot events keyed by progress: { at, fx }
     when        state => boolean, for branch scenes
     gate        a fork, or 'enlist' (the form at the end)
   Fork options
     wire 'brick' lays a labelled brick in the wall along the bottom of the screen
     wire 'open'  the room opens a little; nothing is laid
   ===================================================================== */

const VOICE={ brick:'The teacher noticed.', open:'The teacher noticed that too.' };

window.STORY = [

/* ================================================================ I — THE NOISE */
{ id:'bell', label:'I / PERIOD 5', act:1, h:230, chaos:.5, look:'tube',
  mix:{ hum:.6, classroom:.35, classroomCut:600 },
  cue:[ { at:.02, fx:'bellLow' } ],
  beats:[
    { at:.00, k:'whisper', t:'contains sudden noise, shaking and single flashes — “shocks: gentle” (bottom left) softens them' },
    { at:.12, k:'slam', t:'PERIOD 5.' },
    { at:.32, t:'The bell goes. The noise doesn’t stop. It just changes rooms.' },
    { at:.54, t:'Twenty-eight of you.' },
    { at:.70, k:'slam', t:'One of them.' }
  ]},

{ id:'riot', label:'I / THE ROOM', act:1, h:300, chaos:.8, smoke:.6, rain:.8, look:'frame', art:'steen-school.jpg',
  credit:'Jan Steen, <i>A School for Boys and Girls</i>, c. 1670',
  mix:{ classroom:.9, drum:.55, pencil:.3, crackle:.1 },
  cue:[ { at:.1, fx:'chair' }, { at:.45, fx:'chair' } ],
  beats:[
    { at:.06, k:'slam', t:'You know this room.' },
    { at:.22, t:'Someone’s drumming the desk. Someone’s halfway out of their chair.' },
    { at:.40, t:'Someone’s actually trying. It’s hard to tell from here.' },
    { at:.58, t:'Honestly? It’s the best part of the day.' },
    { at:.78, k:'whisper', t:'somewhere at the front, someone is saying something about knowledge' }
  ]},

{ id:'front', label:'I / THE FRONT', act:1, h:230, chaos:.5, look:'room', room:'noise',
  mix:{ classroom:.45, classroomCut:900, heart:.35 },
  beats:[
    { at:.04, k:'whisper', t:'from the front of the room' },
    { at:.16, t:'Twenty-eight faces. Three looking back.' },
    { at:.38, t:'This lesson got planned on Sunday night.' },
    { at:.60, t:'Now: is it worth trying at all?' }
  ]},

{ id:'fork-friend', label:'I / THE JOKE', act:1, h:190, chaos:.7, smoke:.6, rain:.5, look:'frame', art:'steen-village-school.jpg', artAlt:'steen-school.jpg',
  credit:'Jan Steen, <i>The Village School</i>, c. 1670',
  mix:{ classroom:.6, pencil:.35 },
  beats:[
    { at:.04, t:'Five minutes in. The teacher starts:' },
    { at:.14, k:'quote', t:'“Today I want to try something—”' },
    { at:.28, t:'Your friend leans over. It’s genuinely funny.' }
  ],
  gate:{ fork:'friend', at:.40, timer:12, timeout:'say',
    timeoutToast:'You didn’t choose. The joke did.',
    options:[
      { id:'say',  wire:'brick', brick:'ONE MORE JOKE', label:'Say it now', sub:'It’s funnier now than it’ll be later.', toast:VOICE.brick },
      { id:'hold', wire:'open', label:'Hold it', sub:'Save it for the break. See what the something is.', toast:VOICE.open }
    ]}},

{ id:'all-noise', label:'I / EVERYONE', act:1, h:250, chaos:1, smoke:.9, rain:1, look:'room', room:'noise',
  when:s=>s.forks.friend==='say',
  mix:{ classroom:1, drum:.7, dirt:.25 },
  cue:[ { at:.06, fx:'multiply' } ],
  beats:[
    { at:.06, k:'slam', t:'Now let everyone do what you did.' },
    { at:.26, t:'Twenty-eight side conversations.' },
    { at:.44, t:'Nobody hears what the something was.' },
    { at:.62, k:'slam', t:'Nobody even knows they missed it.' }
  ]},

{ id:'all-quiet', label:'I / EVERYONE', act:1, h:250, chaos:.45, look:'room', room:'split',
  when:s=>s.forks.friend==='hold',
  mix:{ classroom:.25, classroomCut:1200, pencil:.25, clock:.3 },
  cue:[ { at:.06, fx:'multiply' } ],
  beats:[
    { at:.06, k:'slam', t:'Now let everyone do what you did.' },
    { at:.26, t:'Twenty-eight people sitting on a joke.' },
    { at:.44, t:'It’s weirdly quiet.' },
    { at:.62, k:'slam', t:'The something starts.' }
  ]},

/* ================================================================ II — THE WALL */
{ id:'battle', label:'II / THE YARD', act:2, h:280, chaos:.85, smoke:.8, rain:.7, look:'frame', art:'vangogh-prisoners.jpg',
  credit:'Vincent van Gogh, <i>Prisoners Exercising</i> (after Doré), 1890',
  when:s=>s.forks.friend==='say',
  mix:{ classroom:.7, drum:.4, heart:.5, clock:.35, clockRate:.85, dirt:.2 },
  beats:[
    { at:.06, t:'The teacher raises their voice. Somebody laughs at that too.' },
    { at:.24, t:'Now it’s a battle, and the lesson is whoever’s louder.' },
    { at:.42, t:'Worksheets come out. Seats get moved. The three who were listening stop bothering.' },
    { at:.58, k:'slam', t:'Round and round the yard.' },
    { at:.76, t:'The thing from Sunday goes back in the drawer.' }
  ]},

{ id:'opened', label:'II / THE SOMETHING', act:2, h:280, chaos:.28, look:'lamp', art:'wright-orrery.jpg', lampAt:[.5,.55],
  credit:'Joseph Wright of Derby, <i>A Philosopher Lecturing on the Orrery</i>, c. 1766',
  when:s=>s.forks.friend==='hold',
  mix:{ classroom:.2, classroomCut:1500, clock:.2 },
  beats:[
    { at:.08, t:'The something is a question nobody can answer.' },
    { at:.26, t:'Two people start arguing about it. Nobody stops them.' },
    { at:.44, t:'The teacher is leaning on the desk, listening.' },
    { at:.64, k:'slam', t:'It’s actually a bit good.' }
  ]},

{ id:'dream', label:'II / TUESDAYS', act:2, h:300, chaos:.65, smoke:.5, rain:.3, look:'tube', art:'piranesi-carceri.jpg',
  credit:'Giovanni Battista Piranesi, <i>Carceri d’invenzione</i> (Imaginary Prisons), 1761',
  mix:{ drone:.5, heart:.4, clock:.45, clockRate:.8, classroom:.25, classroomCut:500 },
  beats:[
    { at:.06, t:'Everyone in here wants something.' },
    { at:.22, t:'A place somewhere. A future with your name on it.' },
    { at:.40, k:'slam', t:'Dreams are cheap.' },
    { at:.72, k:'slam', t:'You don’t get the dream. You get your Tuesdays.' }
  ]},

{ id:'fork-offer', label:'II / THE OFFER', act:2, h:200, chaos:.7, look:'room', room:'waiting', keep:2,
  mix:{ classroom:.3, classroomCut:800, heart:.55 },
  beats:[
    { at:.04, k:'quote', t:s=>(s.forks.friend==='say'?'“Okay. Different idea. ':'“')+'Next week — anyone who wants to — bring something. A skill. A sport. An argument. The lesson’s yours.”' },
    { at:.20, t:'Twenty-eight people look around.' },
    { at:.30, k:'slam', t:'Waiting for someone.' }
  ],
  gate:{ fork:'offer', at:.42, timer:13, timeout:'look',
    timeoutToast:'You didn’t choose. The room waited, and so did you.',
    options:[
      { id:'look', wire:'brick', brick:'WAITING FOR SOMEONE ELSE', label:'Look around like everyone else', sub:'Someone will. Someone always does.', toast:VOICE.brick },
      { id:'hand', wire:'open', label:'Put your hand up. Halfway.', sub:'You don’t even know what you’d bring yet.', toast:VOICE.open }
    ]}},

{ id:'wall', label:'II / THE WALL', act:2, h:300, chaos:.85, smoke:.4, look:'wall', keep:2,
  mix:{ classroom:.5, drum:.35, heart:.6 },
  cue:[ { at:.06, fx:'wallShow' }, { at:.62, fx:'wake' } ],
  beats:[
    { at:.06, k:'slam', t:'Look at the wall.' },
    { at:.20, t:'Every brick is something somebody did. Or didn’t.' },
    { at:.36, t:s=>{
        const n=s.bricks.length;
        if(!n) return 'None of these have your name on them. You still sat behind it.';
        return s.bricks.map(b=>'“'+b+'”').join(' and ')+(n===1?' — that one’s yours.':' — those are yours.')+' It didn’t feel like building anything at the time.';
      }},
    { at:.50, t:'Nobody built it on purpose. Nobody had to.' },
    { at:.62, k:'slam', t:'Check whose hands.' }
  ]},

{ id:'front2', label:'II / THE QUESTION', act:2, h:240, chaos:.28, look:'room', room:s=>s.bricks.length>1?'noise':s.bricks.length?'split':'waiting',
  mix:{ room:.3, clock:.3 },
  beats:[
    { at:.04, k:'whisper', t:'from the front of the room' },
    { at:.16, t:'The question is always the same one.' },
    { at:.36, k:'slam', t:'When do I stop pushing for your future—' },
    { at:.60, k:'slam', t:'—and when do you start?' }
  ]},

/* ================================================================ III — THE DOOR */
{ id:'door', label:'III / THE DOOR', act:3, h:280, chaos:.12, look:'clean', art:'hammershoi-open-doors.jpg',
  credit:'Vilhelm Hammershøi, <i>Open Doors</i> (Strandgade 30), 1905',
  mix:{ room:.3, clock:.15 },
  beats:[
    { at:.08, t:'The door was never locked.' },
    { at:.26, t:'Everyone was waiting for someone else to go first.' },
    { at:.46, k:'slam', t:'Nobody is going to push you through it.' }
  ]},

{ id:'games', label:'III / LOOK AGAIN', act:3, h:320, chaos:.28, look:'clean', art:'bruegel-childrens-games.jpg',
  credit:'Pieter Bruegel the Elder, <i>Children’s Games</i>, 1560',
  mix:{ classroom:.3, classroomCut:2500, drum:.2 },
  beats:[
    { at:.06, t:'Look at the noise again.' },
    { at:.20, t:'That one can hold a room.' },
    { at:.32, t:'That one can’t sit still, because their body knows things the rest of us don’t.' },
    { at:.48, t:'That one has been arguing with everyone since they were twelve. Imagine pointing it at something.' },
    { at:.64, k:'slam', t:'It was never too much energy.' },
    { at:.78, t:'It was energy with nowhere to go.' }
  ]},

{ id:'sower', label:'III / NOBODY CLAPS', act:3, h:300, chaos:.08, look:'clean', art:'vangogh-sower.jpg', artAlt:'millet-gleaners.jpg',
  credit:'Vincent van Gogh, <i>The Sower</i>, 1888',
  mix:{ room:.25, birds:.2 },
  beats:[
    { at:.06, k:'slam', t:'Nobody claps for this part.' },
    { at:.22, t:'The reading nobody checks. The reps nobody sees.' },
    { at:.38, t:'Doing it right when nobody’s watching isn’t a step towards the thing.' },
    { at:.52, k:'slam', t:'It is the thing.' }
  ]},

{ id:'front3', label:'III / FROM THE FRONT', act:3, h:260, chaos:.04, look:'room', room:'teaching',
  cue:[ { at:.05, fx:'peers' } ],
  mix:{ room:.25, classroom:.12, classroomCut:3000, birds:.15 },
  beats:[
    { at:.04, k:'whisper', t:'from the front of the room, some other Tuesday' },
    { at:.16, t:'Someone is explaining the angle of a seven-metre throw to people who didn’t know they cared.' },
    { at:.36, t:'Someone asks a question the teacher can’t answer. Good.' },
    { at:.54, k:'slam', t:'Twenty-eight people know more than one.' }
  ]},

/* ================================================================ IV — THE CALL */
{ id:'fork-bring', label:'IV / YOURS', act:4, h:200, chaos:0, look:'light',
  mix:{ room:.2, birds:.25 },
  beats:[
    { at:.04, t:'So.' },
    { at:.14, k:'slam', t:'What would you bring?' }
  ],
  gate:{ fork:'bring', at:.30,
    options:[
      { id:'gym',    wire:'none', label:'Take us to the gym', sub:'Work out the angle of the shot. Physics you can feel.' },
      { id:'teach',  wire:'none', label:'Teach the thing nobody else knows', sub:'The hobby, the language, the game, the craft.' },
      { id:'argue',  wire:'none', label:'Start the argument', sub:'Pick a fight with an idea. Win it with reasons.' },
      { id:'ask',    wire:'none', label:'Ask the question nobody’s asking', sub:'From the quiet seat. You don’t have to be loud to start something.' }
    ]}},

{ id:'athens', label:'IV / THE SAME CLASS', act:4, h:300, chaos:0, look:'clean', art:'raphael-athens.jpg',
  credit:'Raphael, <i>The School of Athens</i>, 1509–11',
  mix:{ classroom:.18, classroomCut:3500, birds:.2 },
  beats:[
    { at:.06, t:s=>({
        gym:'Ball, goal, protractor. The whole room follows you down the corridor.',
        teach:'Twenty-seven people learning something from you, for once.',
        argue:'Two sides, both loud, both with reasons. Nobody loses the lesson.',
        ask:'One question from the back row. The whole room turns round.'
      })[s.forks.bring]||'' },
    { at:.26, k:'slam', t:'This is the same class.' },
    { at:.42, t:'Same people. Same noise.' },
    { at:.58, k:'slam', t:'Pointed somewhere.' }
  ]},

{ id:'takeaway', label:'IV / THE CLASS OF ROWDIES', act:4, h:240, chaos:0, look:'light', room:'teaching',
  mix:{ room:.3, birds:.18, classroom:.08, classroomCut:2500 },
  beats:[
    { at:.06, k:'slam', t:'You are the class of rowdies.' },
    { at:.30, k:'slam', t:'You don’t have to be.' },
    { at:.52, t:'You’ve got the energy.' },
    { at:.64, k:'slam', t:'Let’s decide where it goes.' }
  ]},

{ id:'recruit', label:'IV / ENLIST', act:4, h:220, chaos:.15, look:'recruit', art:'leete-wants-you.jpg',
  credit:'Alfred Leete, <i>Britons: Lord Kitchener Wants You</i>, 1914 recruitment poster',
  mix:{ march:.7, crackle:.35 },
  cue:[ { at:.02, fx:'reveille' } ],
  beats:[
    { at:.04, k:'whisper', t:'would you like to know more?' }
  ],
  gate:'enlist', end:true }
];

/* The enlistment form. `private` answers are never printed on the card. */
window.ENLIST=[
  { id:'give',   q:'What could you give the group?',                       hint:'a skill, a sport, a story, a way of arguing…' },
  { id:'get',    q:'What would you like to get from the group?',           hint:'what would make this hour worth it for you?' },
  { id:'learn',  q:'Whose skill would you love to learn? (Or what skill?)', hint:'someone in this room can already do it' },
  { id:'bucket', q:'Something on your bucket list that could be part of the course?', hint:'it probably has more to do with knowledge than you think' },
  { id:'weekly', q:'One thing you’ll actually do every week.', hint:'this one doesn’t get printed. Don’t tell anyone. Just do it.', private:true }
];

/* Classroom chatter, falling like broken code. */
window.CHATTER=['did you see','lol','wait wait','one more','who cares','shh','HAHA','later','bro','what time is it','does this even count','do we have to','can I go toilet','look at this','skip','boring','5 more min','ok but','literally','no way','again','who even','same','dead','it’s fine','LOUDER','no but actually','say it again','watch this','i swear','no because','i can’t','wait what','what page','are we doing anything','it’s literally period 5'];
