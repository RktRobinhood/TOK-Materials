/* A fixed teaching match, using only legal moves in the real battle engine. */
(function (root) {
    'use strict';
    const Rift = root.Rift;
    const Battle = Rift.Battle || (Rift.Battle = {});
    const E = () => Rift.Battle.Engine;
    const steps = [
        { title: 'Play', text: "Your turn: play a card from your hand OR attack with a card on your board. Click the highlighted Lobstorian in your hand. Watch it move to your board; Granny will reply.", label: 'Play Lobstorian', highlight: '.lesson-hand', actions: [{type:'play',cid:'p0c0'}, {type:'decline'}, {type:'play',cid:'p1c0'}, {type:'decline'}] },
        { title: 'Attack', text: "Click Lobstorian on your board to attack. Granny will take the hit: her lives go from three to two. Then she will attack you.", label: 'Attack with Lobstorian', highlight: '.lesson-board', actions: [{type:'attack',cid:'p0c0'}, {type:'take'}, {type:'attack',cid:'p1c0'}] },
        { title: 'Block', text: "Granny attacks! Click Lobstorian to block. Its greater power wins this fight. Then we will place two cards for the stealing example. Watch which board each card joins.", label: 'Block with Lobstorian', highlight: '.lesson-board', actions: [{type:'block',cid:'p0c0'}, {type:'play',cid:'p0c1'}, {type:'decline'}, {type:'play',cid:'p1c1'}] },
        { title: 'Steal', text: "Granny just played Muskrat. Click it to spend one steal and move it to your board. You keep it for this battle only. Granny gets an extra turn.", label: 'Steal Muskrat', highlight: '.lesson-opponent', actions: [{type:'steal'}, {type:'play',cid:'p1c2'}, {type:'decline'}] },
        { title: 'Axioms', text: "Read the shared axiom. Underdog says the WEAKER creature wins a fight. Compare the two previews below, then click Read the shared axiom. The same cards now have a different winner.", label: 'Read the shared axiom', highlight: '.lesson-axiom', actions: [] },
        { title: 'Colours', text: "Click Astrophysicat to attack. Reason gets +2 against Emotion: six against four. Normally six wins; Underdog makes four win a block. Granny will take this hit, then attack. Colours are game rules, not a ranking of knowledge.", label: 'Try the changed rules', highlight: '.lesson-axiom', actions: [{type:'attack',cid:'p0c1'}, {type:'take'}, {type:'attack',cid:'p1c2'}] },
        { title: 'Lives', text: "The new axiom is Age of Reason: Reason creatures get +2. This time choose Take the hit. Your lives will go from three to two. You can take a hit instead of blocking.", label: 'Take the hit', highlight: '.lesson-score', actions: [{type:'take'}] },
        { title: 'Win', text: "Granny has one life left. Click Astrophysicat to attack again. Granny takes the last hit for this lesson. In a real match she could block or steal! You win when she has no lives or cannot play or attack.", label: 'Make the last attack', highlight: '.lesson-axiom', actions: [{type:'attack',cid:'p0c1'}, {type:'take'}] },
    ];
    function team(ids, prefix) {
        return ids.map((species, i) => ({uid:prefix+i, species, loaner:true, injuries:['no-ability']}));
    }
    function starter() {
        return team(['lobstorian','astrophysicat','muskrat','lobstorian','astrophysicat','lobstorian','astrophysicat','muskrat','lobstorian','astrophysicat'], 'lesson-you-');
    }
    function create() {
        return E().createBattle({seed:'first-card-lesson', players:[
            {name:'You',team:starter()},
            {name:'Granny Axiom',team:team(['speedcheeta','muskrat','speedcheeta','speedcheeta','speedcheeta','speedcheeta','speedcheeta','speedcheeta','speedcheeta','speedcheeta'],'lesson-granny-')},
        ], axiomDeck:['empty-set','empty-set','empty-set','underdog','age-of-reason','empty-set'],
        options:{mode:'practice',first:0,shuffle:false,shuffleAxioms:false}});
    }
    function advance(state, index) {
        const step = steps[index];
        if (!step) throw new Error('Unknown lesson step');
        return step.actions.reduce((s, action) => E().applyAction(s, action), state);
    }
    Battle.Lesson = {steps, create, advance, starter, team};
})(typeof window !== 'undefined' ? window : globalThis);
