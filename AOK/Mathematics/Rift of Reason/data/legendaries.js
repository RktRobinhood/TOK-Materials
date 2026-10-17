/*
 * Roaming legendary hunts (#111, design/ROAMING-LEGENDARIES.md): one optional trickster per Unit 2–4.
 *
 * Each hunt lives on one painted map. `sites` is the authored roaming set in a stable order: the first
 * legal site is where the creature is first found, and a failed challenge sends it to another legal
 * site (js/core/hunts.js validates every choice: revealed, unlocked, reachable on the same map).
 * `challenge` names the trick run in js/core/tricks.js. `say` holds every spoken line of the hunt
 * (voiced through tools/voices.mjs as speaker = species; recordings come later).
 *
 * The species themselves are in data/creatures.js with `roaming: true`, which keeps them out of every
 * ordinary spawn table (Rift.World.spawnWeights). Passing the challenge is the only way to get one.
 */
(function (root) {
    'use strict';
    const Rift = root.Rift;

    Rift.data.hunts = {
        maskip: {
            species: 'maskip', chapter: 'ch2', map: 'ch2', challenge: 'maskip',
            title: 'The Lantern Switch',
            sites: ['b-lamp-lane', 'b-square', 'b-bakery', 'b-post', 'b-school', 'b-clockmaker', 'b-garden', 'b-west-bridge'],
            found: 'Optional: a masked imp with two lanterns is giggling at {place}. Look for its marker.',
            tok: 'A logic rule decides which cases count. Changing AND to "exactly one" changes the answer, and a confident mask is not evidence.',
            say: {
                intro: 'Ooh, a visitor! Twelve little lantern games. Read my sign. I change it when you blink.',
                rounds: [
                    'The shiny one is the answer. Probably. Maybe.',
                    'Same lanterns! Same answer, surely? Hee hee.',
                    'My mask says it is true. Masks never lie. Ahem.',
                    'Quick, quick! Clicking fast is clever. Everyone knows that.',
                    'Read the sign? Nobody reads the sign. Hee hee.',
                    'Last one! I bet your finger is already twitching.',
                ],
                wrong: 'Ha! The sign changed, and you did not. Catch me if you can!',
                win: 'You read every sign! Fine, fine. My lanterns are yours.',
                practice: 'Back for more lantern games? No prize, just fun.',
            },
        },
        quibblequill: {
            species: 'quibblequill', chapter: 'ch3', map: 'ch3', challenge: 'quibblequill',
            title: 'The Paper Trail',
            sites: ['t-newsstand', 't-cafe', 't-library', 't-west-bridge', 't-reading-room', 't-plaza', 't-datalab', 't-gallery'],
            found: 'Optional: a ferret in a huge wig is hiding behind paperwork at {place}. Look for its marker.',
            tok: 'Agreeing examples cannot prove an "every" claim, but one counterexample can break it. A rule that goes one way does not go back the other way.',
            say: {
                intro: 'Order! Order! I have papers. Many papers. Very official papers.',
                rounds: [
                    'Look at all these happy records. Surely they prove me right?',
                    'New task! Read it slowly. I wrote it very small.',
                    'Every archive key is brass. So every brass key opens the archive. Obviously!',
                    'The court will now hear the obvious answer. Which is wrong.',
                    'I object to you reading carefully! Objection!',
                    'Final exhibit! Sign here, here, and also here.',
                ],
                wrong: 'Objection sustained, by me! I am off to file this somewhere else.',
                win: 'One record beats a pile of paper. You may keep my quill. And me.',
                practice: 'Case reopened! For practice only. No prizes.',
            },
        },
        oddsnap: {
            species: 'oddsnap', chapter: 'ch4', map: 'ch4', challenge: 'oddsnap',
            title: 'Odds and Ends',
            sites: ['k-prediction', 'k-gallery', 'k-stairwell', 'k-workshop', 'k-oracle', 'k-bridge'],
            found: 'Optional: a dice-tailed gremlin is counting everything at {place}. Look for its marker.',
            tok: 'A frequency model predicts from past counts. A high chance is still not a guarantee, and a confident machine adds no evidence.',
            say: {
                intro: 'I count everything! Then I am very, very sure. Want to play?',
                rounds: [
                    'Pick the big shiny one! Big means likely. Right?',
                    'New log, new question. Did you read it, or guess it?',
                    'Ninety percent! That is basically one hundred. Basically.',
                    'I counted the answer already. Twice. Probably.',
                    'The odds say you click the first button. Go on!',
                    'Last roll! My dice say you blink first.',
                ],
                wrong: 'Probably wrong! Ha! I am rolling away to somewhere new.',
                win: 'You beat the odds by reading them. I will roll with you now.',
                practice: 'Another round of chances? No prize this time.',
            },
        },
    };
})(typeof window !== 'undefined' ? window : globalThis);
