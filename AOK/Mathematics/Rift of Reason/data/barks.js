/*
 * Battle barks: what a creature says in the Card Arena. enter = played (Entrance creatures name their
 * trick), ability = an Activate ability is used, defeat = it leaves the board (Last Word creatures hint
 * they're coming back). The battle picks one at random and plays it only once it is recorded
 * (tools/voices.mjs renders them in each creature's own voice). Khaby Llame never speaks.
 * Jokes stay with each public persona's well-known catchphrases and on-record style.
 */
(function (root) {
    'use strict';
    root.Rift.data.barks = {
        lobstorian: {
            enter: ['Sit up straight. You. Yes, you. No attacking.', 'Lecture one. Hierarchies. Take notes.', 'Stop. Before you attack, tidy your room.'],
            defeat: ['I was making a very precise point.', 'Clean your room. Without me.', 'This is… roughly a disaster.'],
        },
        astrophysicat: {
            enter: ['Well, actually, I am here now.', 'Hello, fellow stardust!', 'Let me explain the universe. Briefly.'],
            ability: ['One more card. For science.', 'Data! Glorious data!', 'Fun fact incoming.'],
            defeat: ['Demoted. Like Pluto.', 'The universe owes me nothing. Rude.', 'Back to the stars. Meow.'],
        },
        tremendoodle: {
            enter: ['You there. Your new name is Low Energy.', 'I have the best nicknames. Everyone says so.', 'Little Syllogism. That\'s your name now. Sad!'],
            defeat: ['Rigged! Totally rigged!', 'Nobody has ever lost like me. Tremendous loss.', 'I won. Many people are saying I won.'],
        },
        swiftlet: {
            enter: ['Did you spot my clues? Too late.', 'New era, new rules.', 'Clue number one: I am winning.'],
            defeat: ['Fine. That gets a sad song.', 'I will write a song about this.', 'This one goes in the breakup song.'],
        },
        muskrat: {
            enter: ['Launching! Probably!', 'Mars by next year. This battle by Tuesday.', 'Ignition. Mostly.'],
            ability: ['Rewinding. Time is just a deadline.', 'Delayed! Like everything else.', 'Fate is now called Fate X.'],
            defeat: ['Rapid unscheduled disassembly.', 'Next year. I will win next year.', 'That was a successful test. Of losing.'],
        },
        zuckerborg: {
            enter: ['Hello, fellow humans. I have arrived.', 'Moving fast. Breaking things.', 'Engagement is up. Prepare to be engaged.'],
            defeat: ['Logging out. Temporarily.', 'This is not the end. Just an update.', 'I will be back. With legs.'],
        },
        altmanta: {
            enter: ['Stay calm. Everything is about to change.', 'Hello. I am gliding in. Safely.', 'Do not worry. It is all under control. Mostly.'],
            ability: ['Next creature? I call its colour.', 'I can see your next colour coming.', 'Calculating the most likely future.'],
            defeat: ['I did not predict that.', 'Statistically, that was unlikely.', 'Fine. Transformative. But fine.'],
        },
        beastie: {
            enter: ['Last one standing gets a cheque!', 'Biggest creature ever! Count the attack!', 'Hit the subscribe button! On logic!'],
            defeat: ['Okay. That was not a gift.', 'Next video: I lose to a student.', 'Bigger… I needed bigger…'],
        },
        siuuugull: {
            enter: ['SIUUUU!', 'The best is here. Again. Always.', 'Same jump. Same result. Watch.'],
            defeat: ['Impossible! I did the jump!', 'The pattern… broke?', 'Same jump. Different ending. Rude.'],
        },
        rawmsay: {
            enter: ['Weak argument? Out of my kitchen!', 'It is RAW! Get it off my board!', 'Right. Who undercooked this premise?'],
            defeat: ['Shut it down!', 'Overcooked. Completely.', 'You cooked me. Respect.'],
        },
        speedcheeta: {
            enter: ['LET\'S GOOOO! Everybody hits harder!', 'AAAAH! I am here! Why am I here?!', 'Power up! Everyone, plus one!'],
            defeat: ['Too fast! I was too fast!', 'Nooo! Chat, did you see that?!', 'I need a backflip. Emotionally.'],
        },
        chimpossible: {
            enter: ['It is entirely possible I just arrived.', 'Have you ever really looked at a deck?', 'Jamie, pull up my entrance.'],
            ability: ['Jamie, pull that up. Top three cards.', 'Let\'s look into it. Wild.', 'Hold on. I read about this.'],
            defeat: ['That is entirely possible. Sadly.', 'Crazy. Absolutely crazy.', 'I need to look into this defeat.'],
        },
        carlseal: {
            enter: ['Show me your hand. I already know it.', 'I have calculated this. Twenty moves ahead.', 'Let me see your cards. Yes. As expected.'],
            defeat: ['Hm. A blunder. Mine.', 'Interesting. I will analyse that later.', 'Good game. I suppose.'],
        },
        eminemu: {
            enter: ['Premise, premise, conclusion, boom!', 'I hit twice and rhyme twice, nice!', 'Rhymes so fast, you missed the past!'],
            defeat: ['I lost the beat.', 'I tripped on my own rhyme.', 'The rhyme ran out of time.'],
        },
        obambu: {
            enter: ['Let me be clear. Here is some hope. And hearts.', 'Yes, we can. Heal up, team.', 'Now… let me pause… and heal.'],
            defeat: ['Thank you. It has been an honour.', 'Let me be clear. That hurt.', 'Change… is hard.'],
        },
        beansprout: {
            enter: ['Hmm… Teddy?', 'Teddy!', 'Ooh.'],
            defeat: ['Oh dear.', 'Teddy…', 'Hmph.'],
        },
        gargoyle: {
            enter: ['Darling, I am here. And I am art.', 'New look! Same stone.', 'Tonight I am wearing a strategy.'],
            ability: ['Borrowing a look from the discards.', 'Reinvention! Again!', 'Change the costume, change the rules.'],
            defeat: ['Even stone cracks, darling.', 'Next week: a new me.', 'Cancel my next costume.'],
        },
        haalandroid: {
            enter: ['Target: hero. Goal: yes.', 'Breathe in. Breathe out. Score.', 'Pattern loading. Goal loading.'],
            defeat: ['Error. No goal.', 'Pattern… broken.', 'Rebooting. Meditating.'],
        },
        usainvolt: {
            enter: ['Too fast for your guards!', 'Ready. Set. Already here.', 'Lightning pose! Done. Let\'s go.'],
            defeat: ['Second place? Me?', 'I blinked. You won.', 'Still the fastest loser ever.'],
        },
        keanu: {
            enter: ['Whoa.', 'You\'re breathtaking. All of you.', 'I know logic. Show me.'],
            defeat: ['Déjà vu. I\'ll see you again.', 'This isn\'t goodbye.', 'Whoa. Okay. Back soon.'],
        },
        beeyonce: {
            enter: ['Hive, line up behind me.', 'Kneel. Then get stronger.', 'Everybody up. The queen is here.'],
            defeat: ['The hive will remember this.', 'I\'m not crying. It\'s pollen.', 'Even queens take a break.'],
        },
        eelish: {
            enter: ['Shhh. Your tricks are gone now.', 'Your powers? Duh. Deleted.', 'Lean in. You lost your abilities.'],
            defeat: ['That\'s so sad.', 'Whatever. I\'m going home.', 'Quietly… losing.'],
        },
        rockodile: {
            enter: ['Can you smell what the Rockodile is cooking?', 'The Rockodile has come back!', 'Hit me. I dare you.'],
            defeat: ['The Rockodile… needs a rest.', 'Respect. You worked harder.', 'Even rocks get tired.'],
        },
        attenbirdough: {
            enter: ['Here, a deck. Let us look at the top three.', 'Shh. We must not startle the opponent.', 'And here comes a puffin. Remarkable.'],
            defeat: ['The puffin… returns to the sea.', 'Nature is cruel. And so are you.', 'A natural ending. Quite natural.'],
        },
        kardashiant: {
            enter: ['Is it me, or do I look huge?', 'Filter on. Fierce mode.', 'Take a picture. I\'m the main character.'],
            ability: ['Speeding up Fate. For the content.', 'Fast-forward to the good bit.', 'Let\'s skip ahead.'],
            defeat: ['Wait, the filter fell off.', 'Delete that photo.', 'I am… very small, actually.'],
        },
        messilion: {
            enter: ['Quietly. Let us see the gaps.', 'I see the pass.', 'Okay. Play simple.'],
            defeat: ['I missed the gap.', 'Missed. I will pass better.', 'Still… a beautiful game.'],
        },
        shakirattle: {
            enter: ['Try to target me. The hips won\'t let you.', 'Watch the rattle. Not the talk.', 'Spells cannot catch this.'],
            defeat: ['The hips… they lied.', 'Rattled. Seriously rattled.', 'My tail is shaking. Not in a good way.'],
        },
        euclidon: {
            enter: ['Assume one rule. Now.', 'A new axiom, now in effect.', 'Let us begin from what we assume.'],
            defeat: ['Therefore… I lose.', 'Q.E.D. Sadly.', 'Proven wrong. Awkward.'],
        },
        lovelace: {
            enter: ['The machine is ready. Shall we begin?', 'I bring patterns, woven in lace.', 'A new program is loading.'],
            ability: ['Borrowing a pattern from the past.', 'The engine weaves another ability.', 'New instructions loaded.'],
            defeat: ['The program… stops here.', 'Not all machines finish their work.', 'Someone will build the rest.'],
        },
        godelix: {
            enter: ['You cannot attack me. Not while I have a friend.', 'This statement is unattackable.', 'I am safe. Prove otherwise.'],
            defeat: ['True. But unprovable.', 'Caught. Somehow.', 'The loop… closes.'],
        },
        tycho: {
            enter: ['Measuring every enemy. Precisely. Ouch for them.', 'One damage to everyone. Accurately.', 'The heavens report. You are all hit.'],
            defeat: ['My measurements… were perfect.', 'Someone else will finish the charts.', 'My charts… unfinished.'],
        },
        booleon: {
            enter: ['True or false? I choose.', 'One or zero. Pick wisely.', 'Every case checked. Now.'],
            defeat: ['False. Zero. Gone.', 'I did not check that case.', 'Not true. Not anymore.'],
        },
        hexling: {
            enter: ['A tiny verse for a tiny battle.', 'Hex! I mean hello.', 'Problems worthy of attack? Here I am.'],
            defeat: ['A short poem. A short life.', 'The verse is done.', 'Put me in a little book.'],
        },
    };
})(typeof window !== 'undefined' ? window : globalThis);
