/* Small, fixed practice boards. They never receive a live puzzle or submit API. */
(function(root){
    'use strict';
    const R=root.Rift, el=(...a)=>R.el(...a);
    // Each action changes a visible example. Wrong practice clicks cost nothing.
    const examples={
        'rule-hunter':{kind:'numbers',title:'Try a test that separates two rules',frames:[
            ['Both “even numbers” and “numbers going up” fit 2, 4, 6. Build a different test. Click 1.',['1','2','4'],0,'1  ·  _  ·  _'],
            ['Click 3 for the second slot.',['3','4','6'],0,'1  ·  3  ·  _'],
            ['Click 5 for the third slot.',['5','6','8'],0,'1  ·  3  ·  5'],
            ['Now test your triple.',['Test it'],0,'✓ Numbers going up     ✗ Even numbers'],
        ],result:'One test separates these two ideas. It does not prove a rule against every other possibility.'},
        'liars-gate':{kind:'guards',title:'Reason from a guard’s words',frames:[
            ['A says “B is a liar”. Try the assumption that A tells the truth.',['A: Truth','A: Lie'],0,'A: Truth → B: Lie'],
            ['Now try the other assumption. If A lies, those words must be false.',['B: Truth','B: Lie'],0,'A: Lie → B: Truth'],
        ],result:'Both possibilities need checking against the other clues. One statement has not settled who is honest.'},
        venn:{kind:'venn',title:'Make a small Venn diagram',frames:[
            ['All ducks are birds. Select Shade.',['Shade','Add x'],0,'shade'],
            ['Click the ducks-only region: ducks cannot be outside birds.',['Ducks only','Overlap'],0,'shaded'],
            ['A separate fact says some ducks exist. Put x in the overlap.',['Add x in overlap','Add x outside birds'],0,'x'],
        ],result:'Shading means empty; x means at least one. “All” alone does not say ducks exist.'},
        'line-drawer':{kind:'path',title:'Draw one connected route',frames:[
            ['Start at point A.',['Point A','Point B','Point C'],0,'A'],
            ['Follow the first edge to B.',['Point A','Point B','Point C'],1,'AB'],
            ['Follow the unused edge to C.',['Point A','Point B','Point C'],2,'ABC'],
        ],result:'You used each edge once without lifting. In an impossible task, count odd points and submit a proof instead.'},
        witness:{kind:'lamps',title:'Use only the evidence',frames:[
            ['The only fact is “a red lamp is on”. Judge “the red lamp is on”.',['True','False','Can’t tell'],0,'Red on: True'],
            ['Now judge “the red lamp is off”.',['True','False','Can’t tell'],1,'Red off: False'],
            ['Now judge “a blue lamp is on”.',['True','False','Can’t tell'],2,'Blue on: Can’t tell'],
        ],result:'Missing evidence is different from evidence that a claim is false.'},
        switchboard:{kind:'circuit',title:'Watch a signal through a gate',frames:[
            ['A is ON; B is OFF. Try the AND gate.',['AND','OR'],0,'ON AND OFF → OFF'],
            ['Use the same inputs with OR.',['AND','OR'],1,'ON OR OFF → ON'],
            ['Send ON through NOT.',['NOT ON'],0,'NOT ON → OFF'],
        ],result:'Each gate follows its own fixed rule. Changing an input or gate can change the output.'},
        village:{kind:'worlds',title:'Cross out a world that clashes',frames:[
            ['Baker says “Sweep is an imp”. Inspect a world where Sweep is honest.',['Sweep: Honest','Sweep: Imp'],0,'Sweep honest → Baker’s words false'],
            ['In that world, could Baker also be honest?',['Cross out Baker honest','Keep Baker honest'],0,'✗ Both honest     ✓ Baker imp, Sweep honest'],
        ],result:'That world cannot have both honest. Check every statement before deciding which world survives.'},
        tower:{kind:'blocks',title:'Keep answers tied to their premises',frames:[
            ['Fact: all runners wear boots. Your story: “I am a runner”. Add that block.',['I am a runner'],0,'All runners wear boots\nI am a runner'],
            ['Which answer keeps this tower consistent?',['I wear boots','I wear no boots'],0,'All runners wear boots\nI am a runner\nTherefore I wear boots'],
        ],result:'This answer is forced by the premises. A loose answer in the real tower may still be possible.'},
        'chart-fixer':{kind:'bars',title:'Repair an exaggerated chart',frames:[
            ['The bars are 95 and 100. The axis starts at 90. Change the start to 0.',['Axis start: 0','Axis start: 94'],0,'zero'],
            ['Read the values rather than the dramatic picture. What is the increase?',['5','100'],0,'difference'],
        ],result:'The increase is 5. A fair view still needs a conclusion supported by the data.'},
        tribunal:{kind:'record',title:'Present evidence against a statement',frames:[
            ['Statement: “The door stayed locked all day”. Press it for details.',['Press statement'],0,'Witness: “I never checked the log.”'],
            ['Open the record and select evidence that contradicts “all day”.',['Door log: opened at noon','Photo: door is blue'],0,'Selected: door log, opened at noon'],
            ['Present the log against that statement.',['Take that'],0,'“Locked all day” ✗ “Opened at noon”'],
        ],result:'The record contradicts that exact statement. A related picture would not establish the contradiction.'},
        prediction:{kind:'moves',title:'Beat a locked prediction',frames:[
            ['Past choices: left, left, right. This example guesses the most common move. Reveal its locked guess.',['Reveal guess'],0,'Locked guess: LEFT'],
            ['The guess is already locked. Choose a different move.',['Left','Right'],1,'Guess LEFT · You RIGHT · Machine missed'],
        ],result:'This example follows one simple rule. Read the real machine’s brain; its strategy may differ.'},
        oracle:{kind:'proof',title:'Test a confident claim',frames:[
            ['Claim: “All odd numbers are prime”. Testing 3 works. Try another test.',['Test 5','Test 9'],1,'9 = 3 × 3 → odd, but not prime'],
            ['Which verdict follows?',['Claim fails at 9','Claim proved'],0,'Counterexample: 9'],
        ],result:'One counterexample defeats “all”. Many successful tests alone are not a general proof.'},
        sorting:{kind:'audit',title:'Follow one decision into the audit',frames:[
            ['The machine refused help to Pat. Open the home-visit card.',['Visit Pat'],0,'Pat needs help. Machine said NO.'],
            ['Where does this decision belong?',['Missed need','Correct refusal'],0,'Missed need: +1'],
        ],result:'Count missed needs as well as correct decisions. A high overall score can hide who is left without help.'},
        'three-act':{kind:'tank',title:'Choose facts for a useful model',frames:[
            ['An empty tank fills at a steady rate. Pick the capacity card.',['Capacity: 60 litres','Tank colour: blue'],0,'Capacity 60 L'],
            ['Pick the rate card.',['Rate: 5 litres/minute','Owner’s age: 30'],0,'Capacity 60 L · Rate 5 L/min'],
            ['Use time = capacity ÷ rate.',['60 ÷ 5 = 12 minutes','60 + 5 = 65 minutes'],0,'12 minutes (steady rate, empty start)'],
        ],result:'The model depends on the assumptions. In Act 3, compare its result with the reveal.'},
        'logic-grid':{kind:'grid',title:'Cross out, then confirm',frames:[
            ['Two writers, two stories. Clue: “Ada did not write the frog story.” Cross out Ada and frogs.',['✕ Ada · Frogs','✓ Ada · Frogs'],0,'Ada · Frogs ✕'],
            ['Ada has one story left. Confirm Ada and the moon story.',['✓ Ada · Moon','✕ Ada · Moon'],0,'Ada · Frogs ✕ · Ada · Moon ✓'],
            ['Each story has one writer. So who wrote the frog story?',['✓ Ben · Frogs','✓ Ada · Frogs'],0,'Ada · Moon ✓ · Ben · Frogs ✓'],
        ],result:'One clue and the one-each rule settled it. Every other arrangement broke one of them.'},
        'river-crossing':{kind:'river',title:'Start a safe crossing',frames:[
            ['A and B are rivals. B and C are rivals. The boat takes you and one more. Take B across.',['Take B','Take A'],0,'Near: A, C · Far: B'],
            ['Come back alone, then take A.',['Back alone, take A','Take C'],0,'Near: C · Far: A, B'],
        ],result:'A and B are safe while you are with them. When you leave, someone may need to come back with you.'},
        'water-jugs':{kind:'jugs',title:'Measure 4 cups with two ladles',frames:[
            ['Ladles of 3 and 5 cups. Goal: 4. Fill the 5-cup ladle.',['Fill 5','Fill 3'],0,'3-cup: 0 · 5-cup: 5'],
            ['Pour the 5 into the 3. It stops when the 3 is full.',['Pour 5 into 3','Empty 5'],0,'3-cup: 3 · 5-cup: 2'],
            ['Empty the 3, then pour the 2 across.',['Empty 3, pour 5 into 3','Fill 3'],0,'3-cup: 2 · 5-cup: 0'],
            ['Fill the 5 and top up the 3. One cup moves.',['Fill 5, pour 5 into 3','Empty 3'],0,'3-cup: 3 · 5-cup: 4 ✓'],
        ],result:'Four cups, by pouring alone. With ladles of 4 and 6, every amount is even. So 3 cups can never appear.'},
    };
    function picture(kind,value,index){
        function tile(text,cls){return el('div.tour-tile'+(cls?'.'+cls:''),{text});}
        if(kind==='guards')return el('div.tour-diagram',null,[tile(value&&value.startsWith('A: Lie')?'A: Lie':'A: Truth'),tile('A says: “B is a liar”'),tile(value&&value.endsWith('B: Truth')?'B: Truth':'B: Lie')]);
        if(kind==='lamps')return el('div.tour-diagram',null,[el('div.tour-lamp.red',{text:'Red: ON'}),el('div.tour-lamp.unknown',{text:'Blue: ?'}),tile(value||'Read the one known fact')]);
        if(kind==='circuit')return el('div.tour-circuit',null,[tile('A: ON','tour-on'),index<3?tile('B: OFF'):null,tile('→ '+(index===0?'AND':index===1?'AND':index===2?'OR':'NOT')+' →'),tile(index===2?'Bulb: ON':'Bulb: OFF',index===2?'tour-on':''),el('p.small',{text:value||'Trace the signal from inputs to output'})]);
        if(kind==='worlds')return el('div.tour-diagram',null,[tile('Baker: “Sweep is an imp”'),tile('World: Sweep honest'),tile(index>=2?'✗ Baker honest + Sweep honest':'Baker’s words are false'),index>=2?tile('Possible: Baker imp + Sweep honest','tour-on'):null]);
        if(kind==='blocks')return el('div.tour-stack',null,(value||'All runners wear boots').split('\n').map(t=>tile(t)));
        if(kind==='record')return el('div.tour-diagram',null,[tile('Witness: door locked all day'),tile(index===0?'Press for details':index===1?'“I never checked the log.”':'Record: opened at noon','tour-paper'),index===3?tile('✗ Contradiction found','tour-on'):null]);
        if(kind==='moves')return el('div.tour-diagram',null,[tile('Past: LEFT 2 · RIGHT 1'),tile(index===0?'Guess hidden':'🔒 Guess: LEFT'),index===2?tile('You: RIGHT · Machine missed','tour-on'):null]);
        if(kind==='proof')return el('div.tour-stack',null,[tile('Claim: all odd numbers are prime','tour-paper'),index>=1?tile('Test: 9 is odd; 9 = 3 × 3','tour-paper'):null,index>=2?tile('✗ Claim fails at 9','tour-on'):null]);
        if(kind==='audit')return el('div.tour-diagram',null,[tile('Pat · Machine stamp: NO'),index>=1?tile('Home visit: needs help','tour-paper'):null,el('div.tour-matrix',null,['Correct help','Missed need'+(index>=2?': +1':''),'Unneeded help','Correct refusal'].map((t,i)=>tile(t,index>=2&&i===1?'tour-on':'')))]);
        if(kind==='venn')return el('div.tour-venn',null,[el('div.tour-circle.ducks',{text:'Ducks'}),el('div.tour-circle.birds',{text:'Birds'}),value==='shaded'||value==='x'?el('span.tour-shade',{text:'Empty'}):null,value==='x'?el('strong.tour-x',{text:'×'}):null]);
        if(kind==='bars')return el('div.tour-bars',null,[el('span.small',{text:index===0?'Axis starts at 90':'Axis starts at 0'}),el('div.tour-bar',{style:{height:(index===0?50:95)+'px'},text:'95'}),el('div.tour-bar',{style:{height:'100px'},text:'100'})]);
        if(kind==='path')return el('div.tour-path',null,['A','B','C'].map((p,i)=>el('span'+(value&&value.includes(p)?'.tour-lit':''),{text:p+(i<2?' →':'')})));
        if(kind==='tank')return el('div.tour-tank',null,[el('div.tour-water',{style:{height:(index>=3?'100%':'0%')}}),el('strong',{text:value||'Empty tank'})]);
        return el('div.tour-scene.tour-'+kind,{text:value||({numbers:'2 · 4 · 6',guards:'A: “B is a liar”',lamps:'🔴 Red lamp ON · Blue lamp unknown',circuit:'A: ON → gate ← B: OFF',worlds:'Baker: “Sweep is an imp”',blocks:'All runners wear boots',record:'“The door stayed locked all day”',moves:'LEFT · LEFT · RIGHT',proof:'All odd numbers are prime?',audit:'Pat: help refused',jugs:'3-cup: 0 · 5-cup: 0',river:'Near: A, B, C · Far: nobody',grid:'Ada, Ben · Moon, Frogs'}[kind]||'')});
    }
    function create(id,onComplete){
        const example=examples[id];if(!example)return null;
        const board=el('section.tour-practice',{'aria-label':example.title});let index=0,value=null,feedback='';
        function render(){
            const done=index===example.frames.length, frame=example.frames[index];board.innerHTML='';
            board.append(el('h4',{text:example.title}),el('p.small',{text:'Practice example · separate from your puzzle · no hearts spent'}),picture(example.kind,value,index),
                el('p',{text:done?example.result:frame[0]}),el('p.tour-feedback',{role:'status','aria-live':'polite',text:feedback}));
            if(!done)board.append(el('div.row.wrap',null,frame[1].map((label,i)=>el('button.btn.small'+(i===frame[2]?'.tour-action':''),{text:label,onclick(){
                if(i!==frame[2]){feedback='Try the highlighted control. '+frame[0];render();return;}
                value=frame[3];index++;feedback='';render();if(index===example.frames.length)onComplete();
            }}))));
            else board.append(el('strong',{text:'✓ Practice complete. Continue the guide.'}));
            const target=board.querySelector('.tour-action');if(target&&target.focus)target.focus({preventScroll:true});
        }
        render();return board;
    }
    R.TutorialExamples={create,ids:Object.keys(examples)};
})(typeof window!=='undefined'?window:globalThis);
