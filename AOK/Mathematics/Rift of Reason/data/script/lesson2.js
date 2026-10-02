/*
 * Script for lesson 2: Chapter 2, Boolesbury (truth tables as an introduction to proof).
 * Same step format as data/script/lesson1.js.
 */
(function (root) {
    'use strict';
    const Rift = root.Rift;
    const S = Rift.data.script || (Rift.data.script = {});

    Object.assign(Rift.data.speakers, {
        mayor: { name: 'Mayor Plumage', art: 'npc/mayor' },
        constable: { name: 'Constable Clobber', art: 'npc/villager-constable' },
        baker: { name: 'Mrs Crumb, the Baker', art: 'npc/villager-baker' },
        postmistress: { name: 'Miss Whisker, Postmistress', art: 'npc/villager-postmistress' },
        clockmaker: { name: 'Mr Tock, the Clockmaker', art: 'npc/villager-clockmaker' },
        lamplighter: { name: 'Old Wick, the Lamplighter', art: 'npc/villager-lamplighter' },
        sweep: { name: 'Smudge the Sweep', art: 'npc/villager-sweep' },
        schoolteacher: { name: 'Miss Quill, the Teacher', art: 'npc/villager-schoolteacher' },
        gardener: { name: 'Mr Thistle, the Gardener', art: 'npc/villager-gardener' },
    });

    S['ch2.arrive'] = [
        { s: 'narrator', t: 'Boolesbury. Eighteen fifty-something. Gas lamps, cobbles, and windows glowing a little too brightly.' },
        { s: 'narrator', t: 'The rift brought the imps here first. They wear the villagers\' faces like masks.' },
        { s: 'avatar', t: 'So any of them could be lying.' },
        { s: 'narrator', t: 'Exactly. Honest folk always tell the truth here. Imps always lie. The trick is checking every case.' },
        { s: 'narrator', t: 'The stone circle is your way home. Step back through whenever you like.' },
    ];

    S['ch2.bridge'] = [
        { s: 'lamplighter', t: 'The bridge only lowers if the right levers are pulled. Each lever is something you assume.' },
        { s: 'lamplighter', t: 'Pull as few as you can, mind. Every assumption is a thing that might be wrong.' },
    ];
    S['ch2.bridge.win'] = [
        { s: 'narrator', t: 'The fewer assumptions an argument needs, the harder it is to knock down.' },
    ];

    S['ch2.lane'] = [
        { s: 'narrator', t: 'Lamp Lane. The neighbours are accusing each other. One of them is an imp.' },
        { s: 'narrator', t: 'Open the truth table if you get stuck. Every row is one possible world. Cross out the ones that contradict themselves.' },
    ];
    S['ch2.lane.win'] = [
        { s: 'narrator', t: 'You did not guess. You checked every world, and only one survived. That is a proof.' },
    ];

    S['ch2.square'] = [
        { s: 'mayor', e: 'happy', t: 'Citizens of Boolesbury! Nothing is wrong! Everything is excellent! Especially me!' },
        { s: 'baker', e: 'nervous', t: 'He says that every day. And every day something else goes missing.' },
        { s: 'mayor', t: 'You there, stranger. Welcome. Do not ask questions. Questions are bad for business.' },
        { s: 'avatar', t: 'That is exactly what someone with something to hide would say.' },
        { s: 'narrator', t: 'Help the villagers find the imps among them. Then climb to the Town Hall.' },
    ];

    S['ch2.bakery'] = [
        { s: 'baker', e: 'accusing', t: 'Someone took my last loaf! And everyone in this shop has an opinion about who.' },
    ];
    S['ch2.bakery.win'] = [
        { s: 'baker', e: 'happy', t: 'Well I never. And I would have blamed the one who looked nervous.' },
        { s: 'narrator', t: 'Looking guilty is not evidence. A consistent world is.' },
    ];

    S['ch2.post'] = [
        { s: 'constable', e: 'accusing', t: 'Stranger in town, eh? Answer my questions. And keep your story straight.' },
        { s: 'narrator', t: 'Every answer you give rests on the ones before. Contradict yourself and the whole tower comes down.' },
    ];
    S['ch2.post.win'] = [
        { s: 'constable', t: 'Hmph. Your story holds together. For now.' },
        { s: 'narrator', t: 'A proof is only as strong as the axioms it stands on. So is a cover story.' },
    ];

    S['ch2.rumour'] = [
        { s: 'narrator', t: 'Gossip drifts across the West Bridge like fog.' },
        { s: 'narrator', t: 'They say a grey heron in a frock coat visits the Schoolhouse. He writes only ones and zeros.' },
        { flag: 'rumour:booleon', value: true },
    ];

    S['ch2.clockmaker'] = [
        { s: 'clockmaker', t: 'Tick, tock. My machine lights the bulb when its conditions are met. AND, OR, NOT. Nothing else.' },
        { s: 'clockmaker', t: 'Mr Boole says all of thinking can be done this way. I say it makes very good clocks.' },
    ];
    S['ch2.clockmaker.win'] = [
        { s: 'narrator', t: 'Every circuit has a truth table. So does every argument.' },
    ];

    S['ch2.school'] = [
        { s: 'schoolteacher', t: 'Today\'s lesson: a statement is either true or false. One or zero. No maybes in my classroom.' },
        { s: 'sweep', e: 'nervous', t: 'I am honest, miss!' },
        { s: 'schoolteacher', t: 'Saying so proves nothing, Smudge. An imp would say exactly the same.' },
    ];
    S['ch2.school.win'] = [
        { s: 'schoolteacher', e: 'happy', t: 'Top marks. You did not trust anyone. You trusted the table.' },
    ];

    S['ch2.garden'] = [
        { s: 'gardener', t: 'Sit a while. The greenhouse keeps the imps out. They do not like things that grow honestly.' },
    ];

    S['ch2.cards'] = [
        { s: 'constable', t: 'Off duty. Fancy a game? I play by the rules. Whatever the rules are this round.' },
    ];
    S['ch2.cards.win'] = [
        { s: 'constable', e: 'nervous', t: 'Beaten fair and square. Take your winnings before I arrest them.' },
    ];

    S['ch2.tower'] = [
        { s: 'narrator', t: 'The Clock Tower. Something up here has been questioning everyone who climbs it.' },
        { s: 'constable', e: 'accusing', t: 'Again, stranger. From the top. And this time the questions are harder.' },
    ];
    S['ch2.tower.win'] = [
        { s: 'narrator', t: 'Your tower stands. Every block rests on something you could defend.' },
    ];

    S['ch2.stairs'] = [
        { s: 'narrator', t: 'A locked gate on the Town Hall stairs. One of its switches is hidden behind a curtain.' },
        { s: 'narrator', t: 'You cannot see the hidden premise. But you can see what it does. Work backwards.' },
    ];
    S['ch2.stairs.win'] = [
        { s: 'narrator', t: 'Finding the unstated assumption is half of every argument.' },
    ];

    S['ch2.hall'] = [
        { s: 'mayor', e: 'happy', t: 'Ah, the stranger. Come in, come in. I have nothing to hide, and here is a list of everything I am not hiding.' },
        { s: 'mayor', e: 'nervous', t: 'Also, this statement is false.' },
        { s: 'avatar', t: 'Wait. If that is true, it is false. And if it is false, it is true.' },
        { s: 'narrator', t: 'A sentence that breaks the truth table. Logicians have argued about that one for two thousand years. Ignore it, for now.' },
        { s: 'narrator', t: 'Build your tables. Check every world. Find the imps in the Town Hall.' },
    ];
    S['ch2.hall.win'] = [
        { s: 'mayor', e: 'unmasked', t: 'No! You checked every case! Nobody checks every case!' },
        { s: 'algorithm', t: 'ASSET LOST. RECALCULATING. THE NEXT ERA WILL BE… LOUDER.' },
        { s: 'narrator', t: 'The Mayor was the Arch-Imp all along. Notice what caught him: not a feeling, but a table with one row left.' },
        { s: 'narrator', t: 'But the liar\'s sentence is still out there. Some statements cannot be settled by any table. Remember that.' },
    ];
})(typeof window !== 'undefined' ? window : globalThis);
