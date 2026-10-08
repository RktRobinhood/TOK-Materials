/*
 * The inner voice's lead bank (STORY.md Appendix E), keyed by puzzle id, and by puzzle id and
 * mode where a puzzle has two (rule-hunter:pattern, line-drawer:graph, line-drawer:dots).
 * A script plays one with { lead: true } (this station's puzzle) or { lead: 'venn' }
 * (design/SCRIPT-FORMAT.md section 4). Each entry is an inner step, so tools/voices.mjs records
 * it in the inner voices like any other inner line.
 */
(function (root) {
    'use strict';
    const Rift = root.Rift;
    const L = Rift.data.leads || (Rift.data.leads = {});

    L['rule-hunter'] = { inner: {
        owlet: 'Test a triple that should fail. If it passes, I\'m wrong. It happens. Rarely.',
        mothkin: 'Look at the yeses. What do they share? …Ooh, nineteen is a pretty number. Focus.',
        fox: 'Safe numbers are boring. Try huge ones. Falling ones. Drama.',
        frogling: 'I once counted only sunny days. Then: heron. Count the no\'s too.',
        raven: '"Fits the rule." Not "is the rule". Many rules fit.',
    } };
    L['rule-hunter:pattern'] = { inner: {
        owlet: 'A pattern is not a proof. I say this often. I\'m usually right.',
        mothkin: 'Shh. Number six. It\'s dimmer than the others. Look closer.',
        fox: 'Five in a row? Boring. Picture the one that breaks it.',
        frogling: 'I trusted five sunny days once. The sixth was a heron.',
        raven: '"And so on." Three small words. Who is promising?',
    } };
    L['witness'] = { inner: {
        owlet: 'If the scene doesn\'t settle it, "cannot know" is the clever answer.',
        mothkin: 'Look only at what\'s there. Not the shiny bits my brain adds.',
        fox: 'My brain is painting extras in. Ignore my brain. Just this once.',
        frogling: 'Check the picture again. Memory lies. Mine says I was taller.',
        raven: '"Saw" and "probably saw". Different words. Different prices.',
    } };
    L['venn'] = { inner: {
        owlet: 'Shade the "no" parts first. Then the "some". Neat. I like neat.',
        mothkin: 'Look. An x on the line could sit either side. Don\'t push it.',
        fox: 'Make the premises true and the ending false. If I can, it\'s broken.',
        frogling: 'Remember the question, not the story. Does it follow?',
        raven: '"Some" means at least one. Not "not all".',
    } };
    // The Syllogism Gallery's own Venn lead (venn d1, met there first), so the Well's Venn lead is fresh.
    L['venn:gallery'] = { inner: {
        owlet: 'Premises first, opinions later. Shade what they say. Nothing more.',
        mothkin: 'Look at the circles, not the lobsters. The lobsters are very shiny.',
        fox: 'Picture trumpet lobsters. Fine. If all that were true, must it follow?',
        frogling: 'Ponds can\'t play trumpets either. Doesn\'t matter. Does it follow?',
        raven: '"All" and "some". Two small words. They do all the work.',
    } };
    // The Wishing Well's own banks (map.js opts.lead: 'well'), so a player who met venn or rule-hunter
    // at the Road, the Gallery or the Pattern Stall never hears the same lead twice in lesson 1.
    L['venn:well'] = { inner: {
        owlet: 'Shade the premises. Then hunt for one spot that breaks the ending.',
        mothkin: 'Does anything force an x? Then find it. If not, read the shading.',
        fox: 'Picture a world where the premises hold and the ending fails. Found one?',
        frogling: 'He fished with a sock. Odd, but true. Odd doesn\'t matter. Does it follow?',
        raven: '"No" and "not all". Different words. Different shading.',
    } };
    L['rule-hunter:well'] = { inner: {
        owlet: 'Ten fits prove nothing. One miss proves plenty. Hunt the miss.',
        mothkin: 'Look at the ones it says no to. They know the secret.',
        fox: 'Picture the weirdest numbers. Feed it those.',
        frogling: 'People test what fits. Every time. I\'ve watched. Test what breaks.',
        raven: '"Fits" is a soft word. Look for "fails".',
    } };
    L['liars-gate'] = { inner: {
        owlet: 'If one calls another a liar, they\'re different kinds. Every time.',
        mothkin: 'Shh. Two guards, same claim about a door? Same kind.',
        fox: 'Pretend the first guard lies. Follow the story. Does it crash?',
        frogling: 'Write every claim down. Test one world at a time. Slowly. Like a pond.',
        raven: '"I am honest." Both kinds say that. Worthless sentence.',
    } };
    L['line-drawer:graph'] = { inner: {
        owlet: 'Count lines at each dot. More than two odd dots: impossible. Proven.',
        mothkin: 'Look for the odd dots. Start at one. Ignore the pretty middle one.',
        fox: 'Impossible is an answer too. A dramatic one.',
        frogling: 'Old puzzle. The trick was counting. Count first.',
        raven: '"Impossible" isn\'t giving up here. It\'s a claim. Prove it.',
    } };
    L['line-drawer:dots'] = { inner: {
        owlet: 'Nobody said the lines must stay in the box. I checked.',
        mothkin: 'Look past the edge. There\'s room out there. Dark, but room.',
        fox: 'The box is boring. Leave it.',
        frogling: 'Old trick. The answer lives outside the box.',
        raven: '"Connect the dots." It never said "inside".',
    } };
    L['village'] = { inner: {
        owlet: 'Two villagers accuse each other? Exactly one is an imp. Lovely.',
        mothkin: 'Look for two claims that can\'t both be true. Someone\'s lying.',
        fox: 'Cast one as the imp. Run the scene. Does the village still work?',
        frogling: 'Keep a list: who accused whom. Gossip forgets. Lists don\'t.',
        raven: '"At least one" and "exactly one". Read the small words.',
    } };
    L['switchboard'] = { inner: {
        owlet: 'AND needs both. OR needs one. NOT flips it. I find this relaxing.',
        mothkin: 'Follow one wire to the bulb. Just one. Then the next. Oh, the bulb.',
        fox: 'Hidden switch? Imagine it on. Then off. One of them is the story.',
        frogling: 'Remember which settings lit it. The bulb won\'t.',
        raven: '"Off" means false. Not "unknown".',
    } };
    L['tower'] = { inner: {
        owlet: 'Keep my first answers simple. Everything stacks on them.',
        mothkin: 'Watch which block he taps. That\'s the one he doubts.',
        fox: 'Pick a story I can picture all the way to the end.',
        frogling: 'Remember what I said first. He will. Bulldogs remember.',
        raven: 'No extra details. Every word is a block.',
    } };
    L['tribunal'] = { inner: {
        owlet: 'Find the premise doing all the work. Then push it. Politely.',
        mothkin: 'Read the evidence picture first. Not the shiny headline.',
        fox: 'Imagine the claim is false. What would I expect to see?',
        frogling: 'Compare with what they said before. Witnesses forget. I don\'t.',
        raven: 'Press the line with "always" or "everyone". Big words, weak legs.',
    } };
    L['chart-fixer'] = { inner: {
        owlet: 'Same numbers, fair scale, then decide. Fair is my favourite.',
        mothkin: 'Look. The axis starts at ninety. Shiny trick. I fall for shiny.',
        fox: 'Picture this chart with all the years. Less drama. More true.',
        frogling: 'Are the years evenly spaced? Last time, they weren\'t.',
        raven: '"Technically true." That word "technically" is working very hard.',
    } };
    L['prediction'] = { inner: {
        owlet: 'It bets on my usual move. So: don\'t be usual. You can do this.',
        mothkin: 'Look at its counting table. It shows its bet. Brightest number wins.',
        fox: 'It counts what I did. So do something I\'d never do. Ta-da.',
        frogling: 'My habits are its food. Starve it.',
        raven: '"Predict." A fancy word for "guess".',
    } };
    L['three-act'] = { inner: {
        owlet: 'Which facts change the answer? Ignore the rest.',
        mothkin: 'Look at the picture first. Numbers later.',
        fox: 'Guess first. Wildly. Then ask for what I need.',
        frogling: 'Compare it with something real. Like a pond filling up.',
        raven: 'Say the question in one sentence. Then it can\'t wriggle.',
    } };
    L['sorting'] = { inner: {
        owlet: 'Accurate on average. Fair to whom? Good question. Yours, really.',
        mothkin: 'Look at the ones it said no to. They\'re in the dark corner.',
        fox: 'Picture being the one it got wrong.',
        frogling: 'Which district did it miss before? It\'ll miss it again.',
        raven: '"Warning notes." That word measures something else.',
    } };
    L['oracle'] = { inner: {
        owlet: 'Check every step that divides. Dividing by zero is a classic.',
        mothkin: 'Look at that corner. Does it only look square?',
        fox: 'Try a number it didn\'t try. It hates that.',
        frogling: 'Checking some cases isn\'t checking all. I learned that the hard way.',
        raven: '"Therefore." Carrying a lot there.',
    } };
})(typeof window !== 'undefined' ? window : globalThis);
