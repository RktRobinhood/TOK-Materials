/*
 * The cast: which roles can be lost, who stands in, and where (design/UNDERSTUDIES.md §3.1,
 * STORY.md Appendix D, design/SCRIPT-FORMAT.md section 5). Loaded after the lesson scripts,
 * because a lesson file creates Rift.data.speakers.
 *
 * A role is a speaker id used in scripts (`s`) and as a node host. Only roles listed here have
 * deaths, understudies or a dark state; every other speaker is simply played by itself.
 *
 *   npc       the name used in flags (dead:<npc>, risked:<npc>, arrived:<npc>, quiet:<npc>); default = role
 *   policy    'lethal' (one death-risk moment, an understudy), 'dark' (station goes dark if ever lost),
 *             'safe' (never in danger), 'exempt' (cannot die)
 *   actors    [original, understudy]: speaker ids
 *   peril     the stakes clock id of the role's single death-risk moment
 *   met       script keys that must have been played to the end before the death can be armed
 *   fallback  host slots while the role is silent: { <nodeId>: speaker | null, '*': speaker | null }
 *             (null = no host; the station shows no portrait). `fallbackChapters` limits '*'.
 *   ribbon    node ids whose host panel shows a black ribbon while the role is silent
 *   chapter   the chapter of the peril: its Quiet Scene plays at the opening of any later chapter
 *   quietAuto false: the Quiet Scene is placed by a script step only (Pip's, at the next floor)
 */
(function (root) {
    'use strict';
    const Rift = root.Rift;

    Rift.data.cast = {
        sequins: {
            policy: 'lethal', actors: ['sequins', 'tally'], peril: 'ch1', chapter: 'ch1',
            met: ['prologue.fair', 'prologue.rift', 'ch1.well'],
            fallback: { gate: 'narrator', 'stall-pattern': null }, ribbon: ['stall-pattern'],
        },
        granny: {
            policy: 'lethal', actors: ['granny', 'achilles'], peril: 'ch2', chapter: 'ch2',
            met: ['prologue.wake', 'prologue.fair', 'prologue.evening', 'ch1.well'],
            fallback: { 'b-town-hall': 'constable' },
        },
        narrator: {
            npc: 'sundial', policy: 'lethal', actors: ['narrator', 'kuku'], peril: 'ch3', chapter: 'ch3',
            met: ['prologue.wake', 'prologue.evening', 'ch1.night', 'ch2.clockmaker', 'ch3.cafe'],
            fallback: { '*': 'pip' }, fallbackChapters: ['ch3', 'ch4'],
        },
        pip: {
            policy: 'lethal', actors: ['pip', 'rubberstamp'], peril: 'pip', chapter: 'ch4', quietAuto: false,
            met: ['ch3.arrive', 'ch3.plaza', 'ch4.door'],
            fallback: { '*': 'narrator' },
        },
        mirage: { policy: 'safe', actors: ['mirage'] },
        syllo: { policy: 'safe', actors: ['syllo'] },
        judge: { policy: 'safe', actors: ['judge'] },
        fin: { policy: 'safe', actors: ['fin'] },
        constable: { policy: 'safe', actors: ['constable'] },
        corvina: { policy: 'dark', actors: ['corvina'] },
        muskrat: { policy: 'dark', actors: ['muskrat'] },
        lamplighter: { policy: 'dark', actors: ['lamplighter'] },
        baker: { policy: 'dark', actors: ['baker'] },
        postmistress: { policy: 'dark', actors: ['postmistress'] },
        clockmaker: { policy: 'dark', actors: ['clockmaker'] },
        sweep: { policy: 'dark', actors: ['sweep'] },
        gardener: { policy: 'dark', actors: ['gardener'] },
        mayor: { policy: 'dark', actors: ['mayor'] },
        oracle: { policy: 'dark', actors: ['oracle'] },
        gumleaf: { policy: 'dark', actors: ['gumleaf'] },
        schoolteacher: { policy: 'exempt', actors: ['schoolteacher'] },
        nudge: { policy: 'exempt', actors: ['nudge'] },
        algorithm: { policy: 'exempt', actors: ['algorithm'] },
    };

    // Built understudies (art ids are requests 13.4–13.6 and 13.22 in ART-REQUESTS.md).
    // The off-stage rule: none of them speaks unless their original is dead and they have arrived.
    Rift.data.speakers = Object.assign(Rift.data.speakers || {}, {
        tally: { name: 'Tally', art: 'npc/tally', role: 'sequins' },
        achilles: { name: 'Coach Achilles', art: 'npc/achilles', role: 'granny' },
        kuku: { name: 'Kuku', art: 'npc/kuku', role: 'narrator' },
        rubberstamp: { name: 'Mr Rubberstamp', art: 'npc/rubberstamp', role: 'pip' },
    });
})(typeof window !== 'undefined' ? window : globalThis);
