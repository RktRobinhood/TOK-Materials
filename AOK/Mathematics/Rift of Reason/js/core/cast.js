/*
 * The cast resolver (design/UNDERSTUDIES.md §3, STORY.md Appendix D): who speaks for a role
 * right now, who hosts a station, whether a death can be armed, and what a peril's end records.
 *
 *   Rift.Cast.actor('granny')            → 'granny' | 'achilles' (after arrived:granny) | null (silent)
 *   Rift.Cast.host('sequins', 'gate')    → 'narrator' while Sequins is silent
 *   Rift.Cast.canLose('sequins', 'ch1')  → the six arming conditions
 *   Rift.Cast.resolvePeril('sequins', 'ch1', 4) → the tier actually played (4, or 3 when disarmed)
 *
 * Scripts, nodes and trainers keep naming roles; only this file maps them to people.
 * Everything is stored in save flags (no save migration).
 */
(function (root) {
    'use strict';

    const Rift = root.Rift;
    const S = () => Rift.Story;

    function entry(role) { return ((Rift.data || {}).cast || {})[role] || null; }
    function original(role) { const e = entry(role); return e ? e.actors[0] : role; }
    function understudy(role) { const e = entry(role); return e && e.policy === 'lethal' ? e.actors[1] || null : null; }
    function npc(role) { return S().npcOf(role); }
    // A role id from a role or an NPC name ('sundial' → 'narrator').
    function roleOf(name) {
        const cast = (Rift.data || {}).cast || {};
        if (cast[name]) return name;
        const found = Object.keys(cast).find(r => cast[r].npc === name);
        return found || name;
    }
    const isDead = role => !!S().flag('dead:' + npc(role));
    const hasArrived = role => !!S().flag('arrived:' + npc(role));

    // Who speaks a script line for this role now; null = silence (the line is skipped).
    // opts.replay: { role: actor } stored when the scene was first seen (originals if missing).
    function actor(role, opts) {
        if (opts && opts.replay) return opts.replay[role] || original(role);
        const e = entry(role);
        if (!e) return role;
        if (!isDead(role)) return e.actors[0];
        const u = understudy(role);
        return u && hasArrived(role) ? u : null;
    }

    // Who hosts a station for this role: the actor, else the named stand-in, else nobody.
    function host(role, nodeId) {
        if (!role) return null;
        const a = actor(role);
        if (a) return a;
        const e = entry(role) || {};
        const fb = e.fallback || {};
        let to;
        if (nodeId && Object.prototype.hasOwnProperty.call(fb, nodeId)) to = fb[nodeId];
        else if (Object.prototype.hasOwnProperty.call(fb, '*')) {
            const ch = nodeId ? S().nodeChapter(nodeId) : null;
            to = !e.fallbackChapters || e.fallbackChapters.includes(ch) ? fb['*'] : null;
        } else to = null;
        return to ? actor(to) : null;
    }
    // A station's host now (SCRIPT-FORMAT.md section 1): the node's `hosts` list, first entry whose `when`
    // holds ({ when, host: role | null, note }), else its `host`; then the cast picks the actor.
    // Returns { role, actor, note }: actor null = nobody there (note = what the panel says instead).
    function nodeHost(nodeId) {
        const n = (((Rift.data || {}).map || {}).nodes || {})[nodeId];
        if (!n) return { role: null, actor: null, note: null };
        let role = n.host || 'narrator';
        let note = null;
        const pick = (n.hosts || []).find(h => S().test(h.when));
        if (pick) { role = pick.host || null; note = pick.note || null; }
        return { role, actor: role ? host(role, nodeId) : null, note };
    }

    // A station's background now: the node's `scenes` list ({ when, scene }), first entry whose `when`
    // holds, else its `scene` (like `hosts`). The Town Hall shows the feast until it is over.
    function nodeScene(nodeId) {
        const n = (((Rift.data || {}).map || {}).nodes || {})[nodeId];
        if (!n) return null;
        const pick = (n.scenes || []).find(x => S().test(x.when));
        return pick ? pick.scene : n.scene;
    }

    // A black ribbon on this station while its role is silent (the Pattern Stall).
    function ribbon(role, nodeId) {
        const e = entry(role);
        return !!(e && e.ribbon && e.ribbon.includes(nodeId) && !actor(role));
    }
    // A dark-if-lost station: its host role is gone with no stand-in.
    function isDark(nodeId) {
        const n = (((Rift.data || {}).map || {}).nodes || {})[nodeId];
        const e = n && n.host && entry(n.host);
        return !!(e && e.policy === 'dark' && isDead(n.host));
    }

    // The words this actor says for a step: t for the original, u (else t) for the understudy.
    // null = nothing to say (an understudy-only line for the original, or an empty line).
    function text(step, who) {
        const role = step.s;
        const u = understudy(role);
        const words = who && u && who === u ? (step.u != null ? step.u : step.t) : step.t;
        return typeof words === 'string' && words.length ? words : null;
    }

    // Production guard (arming condition 6): the understudy has a speaker entry and art.
    function ready(role) {
        const u = understudy(role);
        const sp = u && ((Rift.data || {}).speakers || {})[u];
        if (!sp) return false;
        return !Rift.Assets || Rift.Assets.has(sp.art);
    }

    // STORY.md App. D "Arming": every condition must hold.
    function canLose(role, scene) {
        const e = entry(role);
        if (!e || e.policy !== 'lethal') return false;
        if (!S().canDie()) return false;                                        // 1. the switch
        if (scene !== e.peril || S().flag('risked:' + npc(role))) return false;  // 2. its one moment
        if (actor(role) !== e.actors[0]) return false;                         // 3. original holds the role
        if (!(e.met || []).every(k => S().flag('seen:' + k))) return false;     // 4. met in the required scenes
        if (S().isMemory(e.chapter)) return false;                             // 5. not a memory
        return ready(role);                                                    // 6. understudy art and voice entry
    }

    // A peril has ended at this tier. Always sets risked:<npc>. Returns the tier actually played.
    // Feed and stakes.<id> are recorded by the stakes clock (js/core/stakes.js), not here.
    function resolvePeril(role, scene, tier) {
        const name = npc(role);
        let played = tier;
        if (tier >= 4) {
            if (canLose(role, scene)) {
                S().setFlag('dead:' + name, true);
                S().setFlag('quiet:' + name, 'pending');
            } else played = 3;
        }
        S().setFlag('risked:' + name, true);
        if (played >= 4) Rift.bus.emit('cast:death', { role, npc: name });
        return played;
    }

    function arrive(roleOrNpc) {
        const role = roleOf(roleOrNpc);
        S().setFlag('arrived:' + npc(role), true);
    }

    // STORY.md A.6: never someone with a risked: lock or an active understudy.
    function canPossess(role) {
        const e = entry(role);
        if (!e) return true;
        if (e.policy === 'exempt') return true;
        if (S().flag('risked:' + npc(role))) return false;
        if (isDead(role)) return false;
        return true;
    }

    function losses() {
        const cast = (Rift.data || {}).cast || {};
        return Object.keys(cast).filter(r => cast[r].policy === 'lethal' && isDead(r)).length;
    }

    Rift.Cast = { entry, original, understudy, roleOf, actor, host, nodeHost, nodeScene, ribbon, isDark, text, ready, canLose, resolvePeril, arrive, canPossess, losses, isDead, hasArrived };
})(typeof window !== 'undefined' ? window : globalThis);
