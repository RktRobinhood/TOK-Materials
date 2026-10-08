/*
 * Script for lesson 3: Chapter 3, Tomorrowton and the Tribunal (breaking down arguments).
 * Same step format as data/script/lesson1.js.
 */
(function (root) {
    'use strict';
    const Rift = root.Rift;
    const S = Rift.data.script || (Rift.data.script = {});

    Object.assign(Rift.data.speakers, {
        judge: { name: 'Judge Hoot', art: 'npc/judge' },
        fin: { name: 'Prosecutor Fin', art: 'npc/prosecutor' },
        pip: { name: 'Pip, the Clerk', art: 'npc/clerk' },
    });

    // ch2.skyrift (the Sky Rift, a Ch2 node) is in lesson2.js.

    S['ch3.arrive'] = [
        { s: 'narrator', t: 'Tomorrowton. The lanterns have become neon, and the gossip has become a feed.' },
        { s: 'pip', e: 'happy', t: 'Oh! A new face! I am Pip, clerk of the Tribunal. We put arguments on trial here. Not people. Arguments.' },
        { s: 'pip', t: 'The Algorithm\'s rabid ones keep making claims. Your job: find the weak premise and prove it.' },
        { s: 'avatar', t: 'So in a trial, I am attacking the argument, not the creature.' },
        { s: 'pip', e: 'happy', t: 'Exactly! The rift back to Boolesbury is right here, if you need it.' },
    ];

    S['ch3.bridge'] = [
        { s: 'narrator', t: 'Every lamp-post has a screen, and every screen has an opinion. Warm up your reasoning before the trials.' },
    ];
    S['ch3.bridge.win'] = [
        { s: 'narrator', t: 'Good. In Tomorrowton, the loudest claim is rarely the best supported one.' },
    ];

    S['ch3.rumour'] = [
        { s: 'narrator', t: 'Scratched into the rail: "A lady who saw what machines could do before anyone built one is visiting the Tribunal."' },
        { s: 'narrator', t: 'And under it, smaller: "An elk with a brass nose measures the charts in the Gallery at night."' },
        { flag: 'rumour:lovelace', value: true },
        { flag: 'rumour:tycho', value: true },
    ];

    S['ch3.newsstand'] = [
        { s: 'pip', t: 'A practice trial! Listen to the testimony. Press a statement if it sounds too sure of itself.' },
        { s: 'pip', t: 'When a piece of evidence clashes with a statement, present it. Then name the flaw.' },
    ];
    S['ch3.newsstand.win'] = [
        { s: 'pip', e: 'happy', t: 'You found the premise doing all the work, and you knocked it over. That is breaking down an argument.' },
    ];

    S['ch3.cafe'] = [
        { s: 'pip', t: 'No screens in here. The owner says it helps people hear each other. Rest a while.' },
    ];

    S['ch3.library'] = [
        { s: 'narrator', t: 'In the Library, someone insists they have proved something. The proof looks lovely. Proofs often do.' },
        { s: 'pip', e: 'thinking', t: 'A proof on trial is special. One counterexample sinks it. But then you have to decide how to fix it.' },
    ];
    S['ch3.library.win'] = [
        { s: 'narrator', t: 'Mathematicians do this all the time: a counterexample, then a better theorem. That is how proofs grow up.' },
    ];

    S['ch3.plaza'] = [
        { s: 'narrator', t: 'The Neon Plaza. Giant screens. Everyone is looking up. Nobody is looking at each other.' },
        { s: 'algorithm', t: 'TRENDING NOW: A CLAIM. TRENDING NEXT: THE OPPOSITE CLAIM. ENGAGEMENT SECURED.' },
        { s: 'fin', e: 'smug', t: 'Ah, the famous traveller. I am Prosecutor Fin. I have never lost a case. Not once. Ask anyone.' },
        { s: 'avatar', t: 'Popularity does not prove the claim. A witness can give evidence, but we still need to check what supports it.' },
        { s: 'fin', e: 'shaken', t: 'We shall see. At the Tribunal.' },
    ];

    S['ch3.datalab'] = [
        { s: 'pip', t: 'The Data Lab. Numbers do not lie, people say. But people choose which numbers to show you.' },
    ];
    S['ch3.datalab.win'] = [
        { s: 'narrator', t: 'Statistics are evidence, but only if you ask: compared to what? Out of how many? Chosen how?' },
    ];

    S['ch3.gallery'] = [
        { s: 'narrator', t: 'The Gallery of Charts. Every chart here is true, technically. And every one of them is lying a little.' },
    ];
    S['ch3.gallery.win'] = [
        { s: 'narrator', t: 'The data never changed. Only the picture did. Seeing is not the same as knowing.' },
    ];

    S['ch3.cards'] = [
        { s: 'fin', e: 'smug', t: 'Cards? In the Archive? Fine. I will crush you here too. The axioms always favour me. Probably.' },
    ];
    S['ch3.cards.win'] = [
        { s: 'fin', e: 'shaken', t: 'That was a statistical fluke. Which, I suppose, is still a loss.' },
    ];

    S['ch3.steps'] = [
        { s: 'pip', t: 'A witness is rehearsing on the steps. Catch the flaw before they get inside!' },
    ];
    S['ch3.steps.win'] = [
        { s: 'pip', e: 'happy', t: 'Objection sustained! The big trial is next. Judge Hoot is already in her robes.' },
    ];

    S['ch3.trial'] = [
        { s: 'judge', t: 'Order! This Tribunal is now in session. Today we try three arguments, and only the arguments.' },
        { s: 'fin', e: 'smug', t: 'The prosecution\'s witnesses are confident, famous and very popular, Your Honour.' },
        { s: 'judge', e: 'angry', t: 'None of which is evidence, Mr Fin. Proceed.' },
        { s: 'pip', t: 'Three cases: an argument, some statistics, and a proof. Find the weak premise in each.' },
    ];
    S['ch3.trial.win'] = [
        { s: 'judge', e: 'gavel', t: 'The Tribunal finds every argument unsound. Not the witnesses. The arguments.' },
        { s: 'fin', e: 'shaken', t: 'My first loss. I will need to check my premises.' },
        { s: 'algorithm', t: 'CERTAINTY DOWN. THINKING UP. THIS IS… UNACCEPTABLE. COME TO THE TOWER.' },
        { s: 'narrator', t: 'On the horizon, the Server Tower lights up. The last climb is close.' },
        { s: 'narrator', t: 'Breaking an argument down is not winning a fight. It is finding out what we have good reason to believe.' },
    ];
    // Station hosts: a lead-in every visit, with a goal on first arrival.
    S["station.t-south-bridge.intro"] = [{"s":"pip","t":"Screens shout claims at this bridge. Check the task before you join the shouting."},{"s":"pip","t":"Separate what a claim says from what its evidence supports."}];
    S["station.t-south-bridge.reminder"] = [{"s":"pip","t":"Screens shout claims at this bridge. Check the task before you join the shouting."}];
    S["station.t-newsstand.intro"] = [{"s":"pip","t":"A small trial is starting. Read the testimony, press it, and compare the evidence."},{"s":"pip","t":"Find evidence that breaks a claim, then name the weak step."}];
    S["station.t-newsstand.reminder"] = [{"s":"pip","t":"A small trial is starting. Read the testimony, press it, and compare the evidence."}];
    S["station.t-library.intro"] = [{"s":"pip","t":"A proof has arrived in the library. Check its steps against the court record."},{"s":"pip","t":"One broken step can make a claimed proof fail."}];
    S["station.t-library.reminder"] = [{"s":"pip","t":"A proof has arrived in the library. Check its steps against the court record."}];
    S["station.t-datalab.intro"] = [{"s":"pip","t":"The lab has numbers and a bold claim. See whether the evidence really supports it."},{"s":"pip","t":"Numbers need a fair comparison before they support a claim."}];
    S["station.t-datalab.reminder"] = [{"s":"pip","t":"The lab has numbers and a bold claim. See whether the evidence really supports it."}];
    S["station.t-gallery.intro"] = [{"s":"pip","t":"These charts impress the crowd. Adjust them so the numbers can speak fairly."},{"s":"pip","t":"The same numbers can look different when a chart changes."}];
    S["station.t-gallery.reminder"] = [{"s":"pip","t":"These charts impress the crowd. Adjust them so the numbers can speak fairly."}];
    S["station.t-steps.intro"] = [{"s":"pip","t":"A witness is waiting. Press the statement that seems too sure and check the record."},{"s":"pip","t":"Question a claim and connect your objection to evidence."}];
    S["station.t-steps.reminder"] = [{"s":"pip","t":"A witness is waiting. Press the statement that seems too sure and check the record."}];
    S["station.t-tribunal.intro"] = [{"s":"judge","t":"We judge arguments here. Check each case and explain the flaw you find."},{"s":"judge","t":"An argument must survive checks of its reasons, data and proof."}];
    S["station.t-tribunal.reminder"] = [{"s":"judge","t":"We judge arguments here. Check each case and explain the flaw you find."}];
})(typeof window !== 'undefined' ? window : globalThis);
