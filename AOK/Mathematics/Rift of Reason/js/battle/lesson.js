/* A fixed teaching match, using only legal moves in the real battle engine. */
(function (root) {
    'use strict';
    const Rift = root.Rift;
    const E = () => Rift.Battle.Engine;
    const steps = [
        { title: 'Play', text: 'On your turn, play a creature from your hand OR attack with one on your board. First, play Lobstorian. Granny will play Speedcheeta.', label: 'Play Lobstorian', highlight: '.lesson-hand', actions: [{type:'play',cid:'p0c0'}, {type:'decline'}, {type:'play',cid:'p1c0'}, {type:'decline'}] },
        { title: 'Attack', text: 'Attack with one creature on your board. Granny will take this hit and lose one of her three lives. She will then attack you.', label: 'Attack with Lobstorian', highlight: '.lesson-board', actions: [{type:'attack',cid:'p0c0'}, {type:'take'}, {type:'attack',cid:'p1c0'}] },
        { title: 'Block', text: 'When attacked, block with one of your creatures OR take the hit and lose a life. Block now. Lobstorian wins this fight. Then we will set up two new cards for the next example.', label: 'Block with Lobstorian', highlight: '.lesson-board', actions: [{type:'block',cid:'p0c0'}, {type:'play',cid:'p0c1'}, {type:'decline'}, {type:'play',cid:'p1c1'}] },
        { title: 'Steal', text: 'You start with two steals. Right after your opponent plays a creature, you may steal it. It joins your board for this battle only. Your opponent gets an extra turn. Steal Muskrat; Granny will then play another Speedcheeta.', label: 'Steal Muskrat', highlight: '.lesson-opponent', actions: [{type:'steal'}, {type:'play',cid:'p1c2'}, {type:'decline'}] },
        { title: 'Axioms', text: 'Each round reveals a shared axiom: a rule for both players. Underdog now says the WEAKER creature wins a fight. The cards stay the same; the winning move can change.', label: 'Read the shared axiom', highlight: '.lesson-axiom', actions: [] },
        { title: 'Colours', text: 'In this game, Reason gets +2 power against Emotion. Astrophysicat has 4 + 2 = 6 against Speedcheeta’s 4. Normally 6 wins. Under Underdog, 4 wins. This colour wheel is a game rule, not a ranking of ways of knowing. Granny will take your next attack, then attack you.', label: 'Try the changed rules', highlight: '.lesson-axiom', actions: [{type:'attack',cid:'p0c1'}, {type:'take'}, {type:'attack',cid:'p1c2'}] },
        { title: 'Lives', text: 'Age of Reason has now arrived: Reason creatures get +2. You can choose to take a hit instead of blocking. You will lose one life: three becomes two. Granny has one life left.', label: 'Take the hit', highlight: '.lesson-score', actions: [{type:'take'}] },
        { title: 'Win', text: 'Age of Reason still applies. Read the axiom before deciding. Attack again: Granny will take this last hit to finish the lesson. You win when your opponent has no lives, or cannot play or attack. In a real match, they can block or steal!', label: 'Make the last attack', highlight: '.lesson-axiom', actions: [{type:'attack',cid:'p0c1'}, {type:'take'}] },
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
    Rift.Battle.Lesson = {steps, create, advance, starter, team};
})(typeof window !== 'undefined' ? window : globalThis);
