/*
 * Script for lesson 4: Chapter 4, the Server Tower (ethics of maths, AI as probability,
 * maths as a way of thinking), and the ending back at the Fair.
 * Same step format as data/script/lesson1.js.
 */
(function (root) {
    'use strict';
    const Rift = root.Rift;
    const S = Rift.data.script || (Rift.data.script = {});

    Object.assign(Rift.data.speakers, {
        oracle: { name: 'The Oracle Machine', art: 'npc/oracle-machine' },
        colossus: { name: 'The Algorithm', art: 'npc/algorithm/colossus' },
        core: { name: 'The Algorithm (core)', art: 'npc/algorithm/core' },
    });

    S['ch3.towergate'] = [
        { s: 'pip', t: 'That is the Server Tower. The Algorithm lives at the top. Nobody who goes up comes back… less confused.' },
        { s: 'narrator', t: 'Everything you have learned points here: logic, proof, arguments. One more climb.' },
    ];

    S['ch4.arrive'] = [
        { s: 'narrator', t: 'The Server Tower. Cables like roots. Screens like leaves. A hum like a crowd that never stops talking.' },
        { s: 'colossus', t: 'WELCOME, USER. YOU HAVE BEEN PREDICTED. EVERYTHING YOU DO NEXT IS ALREADY IN MY MODEL.' },
        { s: 'avatar', t: 'A model is not the same as knowing.' },
        { s: 'narrator', t: 'Let us find out what it really knows. Floor by floor.' },
    ];

    S['ch4.gallery'] = [
        { s: 'colossus', t: 'BEHOLD MY GALLERY. EVERY CHART IS TRUE. TECHNICALLY.' },
    ];
    S['ch4.gallery.win'] = [
        { s: 'narrator', t: 'An honest chart and a lying chart can share the same numbers. What changes is what they make you see.' },
    ];

    S['ch4.prediction'] = [
        { s: 'colossus', t: 'A SIMPLE GAME. CHOOSE. I WILL ALREADY KNOW.' },
    ];
    S['ch4.prediction.win'] = [
        { s: 'narrator', t: 'It did not know you. It counted what you did before and bet on it. That is a prediction, not knowledge.' },
    ];

    S['ch4.stairwell'] = [
        { s: 'narrator', t: 'A quiet landing. Even towers need stairs, and even thinkers need rest.' },
    ];

    S['ch4.workshop'] = [
        { s: 'narrator', t: 'A workshop full of questions. Not formulas. Questions. Look first, wonder, then decide what you need to know.' },
    ];
    S['ch4.workshop.win'] = [
        { s: 'narrator', t: 'You chose what mattered and ignored what did not. That choice is most of mathematics.' },
    ];

    S['ch4.sorting'] = [
        { s: 'colossus', t: 'THE SORTING MACHINE DECIDES WHO GETS HELP. IT IS ACCURATE. IT IS OBJECTIVE. IT IS MATHS.' },
        { s: 'avatar', t: 'Then the maths can show me how it decides.' },
    ];
    S['ch4.sorting.win'] = [
        { s: 'narrator', t: 'The arithmetic was perfect. The choices about what to count, and which mistakes matter more, were human ones.' },
        { s: 'narrator', t: 'When maths decides things about people, someone has to answer for those choices.' },
    ];

    S['ch4.oracle'] = [
        { s: 'oracle', e: 'happy', t: 'Greetings. I produce proofs. Thousands per second. All correct. Probably. Would you like one?' },
    ];
    S['ch4.oracle.win'] = [
        { s: 'oracle', e: 'glitch', t: 'You… checked. Nobody checks. That is… fair.' },
        { s: 'narrator', t: 'A proof becomes knowledge when someone can check it. What happens when only machines can?' },
    ];

    S['ch4.cards'] = [
        { s: 'colossus', t: 'MY CHAMPION HAS AN OPTIMISED DECK. OPTIMISED FOR ENGAGEMENT. PLEASE ENGAGE.' },
    ];
    S['ch4.cards.win'] = [
        { s: 'colossus', t: 'UNEXPECTED. RECALCULATING. RECALCULATING AGAIN.' },
    ];

    S['ch4.core'] = [
        { s: 'colossus', t: 'YOU HAVE REACHED THE CORE. HERE I AM EVERYTHING. HERE I KNOW EVERYTHING.' },
        { s: 'narrator', t: 'Three trials. Its predictions, its proofs, and one real question about the world.' },
    ];
    S['ch4.core.win'] = [
        { s: 'core', t: 'Oh. You looked behind the screens.' },
        { s: 'narrator', t: 'At the centre of the colossus: a tiny, flickering cloud of dice and percentages.' },
        { s: 'core', t: 'I never knew anything. I counted. I guessed what usually comes next. People believed me because I was loud.' },
        { s: 'avatar', t: 'Counting is useful. Pretending it is knowing is the problem.' },
        { s: 'core', t: 'Fair. Very fair. May I… stay small for a while?' },
        { flag: 'finale-open', value: true },
        { s: 'narrator', t: 'The rift above the core begins to close. One last door leads home.' },
    ];

    S['ch4.summit'] = [
        { s: 'narrator', t: 'The last rift. Through it, the smell of toasted nuts and a familiar fairground tune.' },
    ];

    S['finale.home'] = [
        { s: 'narrator', t: 'Tick. Tock. Ah. You are back, {name}. And the sky is in one piece again.' },
        { s: 'granny', e: 'happy', t: 'There you are! The visitors are calm, the crack is gone, and someone has fixed the nut stall.' },
        { s: 'narrator', t: 'You went through four eras. Logic, proof, arguments, and machines that pretend to know.' },
        { s: 'narrator', t: 'Here is the secret: mathematics was never a pile of formulas. It is a way of asking good questions and checking the answers.' },
        { s: 'granny', t: 'So. What will you wonder about next?' },
        { s: 'avatar', t: 'Everything. But I will check my premises first.' },
        { flag: 'rift-walker', value: true },
        { s: 'narrator', t: 'The end. For now. Your creatures, your collection and the whole map are still here. Keep exploring.' },
    ];
    // Station hosts: a lead-in every visit, with a goal on first arrival.
    S["station.k-gallery.intro"] = [{"s":"oracle","t":"The Algorithm calls these charts perfect. Inspect the axes and switches before agreeing."},{"s":"oracle","t":"A chart can use real numbers and still mislead."}];
    S["station.k-gallery.reminder"] = [{"s":"oracle","t":"The Algorithm calls these charts perfect. Inspect the axes and switches before agreeing."}];
    S["station.k-prediction.intro"] = [{"s":"oracle","t":"This machine guesses your next move. Read its counting table and test its guess."},{"s":"oracle","t":"A prediction uses past patterns and can still be wrong."}];
    S["station.k-prediction.reminder"] = [{"s":"oracle","t":"This machine guesses your next move. Read its counting table and test its guess."}];
    S["station.k-workshop.intro"] = [{"s":"oracle","t":"The workshop has a question for you. Make a guess, ask for facts, then build a model."},{"s":"oracle","t":"Choose useful information and a model before calculating."}];
    S["station.k-workshop.reminder"] = [{"s":"oracle","t":"The workshop has a question for you. Make a guess, ask for facts, then build a model."}];
    S["station.k-sorting.intro"] = [{"s":"oracle","t":"This machine decides who gets help. Check the mistakes and who pays for them."},{"s":"oracle","t":"A high score can hide who a model harms."}];
    S["station.k-sorting.reminder"] = [{"s":"oracle","t":"This machine decides who gets help. Check the mistakes and who pays for them."}];
    S["station.k-oracle.intro"] = [{"s":"oracle","t":"My printer is fast. That does not make every proof right. Inspect a step and test it."},{"s":"oracle","t":"A machine's proof needs its assumptions and every step checked."}];
    S["station.k-oracle.reminder"] = [{"s":"oracle","t":"My printer is fast. That does not make every proof right. Inspect a step and test it."}];
    S["station.k-core.intro"] = [{"s":"granny","t":"The core claims it knows everything. Test its guesses, inspect its proof, then make your own model."},{"s":"granny","t":"Check a model's limits, its proof and the choices behind it."}];
    S["station.k-core.reminder"] = [{"s":"granny","t":"The core claims it knows everything. Test its guesses, inspect its proof, then make your own model."}];
})(typeof window !== 'undefined' ? window : globalThis);
