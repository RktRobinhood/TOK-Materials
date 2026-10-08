/*
 * Story rules shared by the dialogue runner, the cast and the stakes clocks
 * (design/SCRIPT-FORMAT.md): script conditions (`when`), the player's avatar and Way of
 * Knowing, chapter order and memory mode, `seen:` beats, the Feed and pending Quiet Scenes.
 * Pure (no DOM); reads and writes the save through Rift.State.
 */
(function (root) {
    'use strict';

    const Rift = root.Rift;
    const CHAPTERS = ['prologue', 'ch1', 'ch2', 'ch3', 'ch4'];
    const NPC_PREFIXES = ['dead', 'risked', 'arrived', 'quiet', 'possessed'];
    const WOK = { reason: 'REASON', perception: 'PERCEPTION', imagination: 'IMAGINATION', memory: 'MEMORY', language: 'LANGUAGE', emotion: 'EMOTION' };

    const save = () => (Rift.State && Rift.State.get()) || null;
    const flags = () => (save() || {}).flags || {};

    // The flag name for an NPC: a role id becomes its `npc` name (narrator → sundial).
    function npcOf(roleOrNpc) {
        const c = ((Rift.data || {}).cast || {})[roleOrNpc];
        return (c && c.npc) || roleOrNpc;
    }
    // dead:narrator and dead:sundial are the same flag (SCRIPT-FORMAT.md section 3).
    function normalKey(key) {
        const m = /^([a-z]+):(.+)$/.exec(String(key));
        return m && NPC_PREFIXES.includes(m[1]) ? m[1] + ':' + npcOf(m[2]) : String(key);
    }
    function flag(key) { return flags()[normalKey(key)]; }
    function setFlag(key, value) { Rift.State.setFlag(normalKey(key), value === undefined ? true : value); }
    function addFlag(key, by) {
        const k = normalKey(key);
        Rift.State.update(s => { s.flags[k] = (Number(s.flags[k]) || 0) + by; });
        return flags()[k];
    }

    // ---- the avatar -------------------------------------------------------------
    function avatar() { const s = save(); return (s && s.avatar) || null; }
    function species() { const a = avatar(); return a ? a.type : null; }
    function avatarId() { const a = avatar(); return a ? a.type + '-' + a.variant : null; }
    // { key: 'reason', tag: 'REASON', hex, name } for the player's Way of Knowing.
    function wayOfKnowing(sp) {
        const def = ((Rift.data || {}).avatars || {})[sp || species()];
        const key = def ? def.colour : null;
        const c = key && Rift.COLOURS[key];
        return c ? { key, tag: WOK[key] || c.name.toUpperCase(), hex: c.hex, name: c.name } : null;
    }
    // Voice speaker ids (design/AVATAR-VOICES.md): avatar-<species>-<variant>[-inner|-possessed].
    function avatarVoice(kind) {
        const a = avatar();
        if (!a) return null;
        return 'avatar-' + a.type + '-' + a.variant + (kind ? '-' + kind : '');
    }
    // `only`: a species id, an avatar id ('owlet-girl') or a list of them.
    function matchesOnly(only) {
        if (only == null) return true;
        const list = [].concat(only);
        const sp = species(), id = avatarId();
        return list.some(x => x === sp || x === id);
    }

    // ---- chapters and memory mode -------------------------------------------------
    const chapterIndex = ch => CHAPTERS.indexOf(ch);
    function nodeChapter(id) {
        const n = (((Rift.data || {}).map || {}).nodes || {})[id];
        return n ? n.chapter : null;
    }
    // Chapters the player has ever been in: entered:<ch> flags, chapters of completed nodes, rift jumps.
    function enteredChapters(state) {
        const s = state || save();
        const out = new Set();
        if (!s) return out;
        Object.keys(s.flags || {}).forEach(k => { if (k.startsWith('entered:') && s.flags[k]) out.add(k.slice(8)); });
        ((s.map || {}).completed || []).forEach(id => { const c = nodeChapter(id); if (c) out.add(c); });
        ((s.map || {}).rifts || []).forEach(c => out.add(c));
        return out;
    }
    function markEntered(ch) {
        if (!ch || chapterIndex(ch) < 0 || flag('entered:' + ch)) return;
        setFlag('entered:' + ch, true);
    }
    // A chapter played after a later one plays as a memory (STORY.md A.12).
    function isMemory(ch) {
        const i = chapterIndex(ch);
        if (i < 0) return false;
        for (const c of enteredChapters()) if (chapterIndex(c) > i) return true;
        return false;
    }
    // The chapter a script belongs to: its key prefix (ch2.hall → ch2), else the current chapter.
    function chapterOfKey(key) {
        const p = String(key || '').split('.')[0];
        if (chapterIndex(p) >= 0) return p;
        if (p === 'recap' || p === 'quiet') return null;
        const s = save();
        return s ? s.chapter : null;
    }

    // ---- conditions -------------------------------------------------------------------
    function test(cond, ctx) {
        if (cond == null) return true;
        if (Array.isArray(cond)) return cond.every(c => test(c, ctx));
        if (typeof cond === 'string') {
            const neg = cond.startsWith('!');
            const v = flag(neg ? cond.slice(1) : cond);
            return neg ? !v : !!v;
        }
        if (typeof cond !== 'object') return !!cond;
        if (cond.all) return cond.all.every(c => test(c, ctx));
        if (cond.any) return cond.any.some(c => test(c, ctx));
        if ('not' in cond && !('flag' in cond)) return !test(cond.not, ctx);
        if (cond.seen) return !!flag('seen:' + cond.seen);
        if (cond.species) return [].concat(cond.species).includes(species());
        if (cond.avatar) return [].concat(cond.avatar).includes(avatarId());
        if ('memory' in cond) return !!(ctx && ctx.memory) === !!cond.memory;
        let v;
        if (cond.clock) v = Rift.Stakes ? Rift.Stakes.danger(cond.clock) : 0;
        else if (cond.flag) v = flag(cond.flag);
        else return true;
        if (cond.unset) return v === undefined || v === null;
        if ('is' in cond) return v === cond.is;
        if ('not' in cond) return v !== cond.not;
        if (cond.in) return cond.in.includes(v);
        if ('gte' in cond || 'lte' in cond) {
            const n = Number(v) || 0;
            return (!('gte' in cond) || n >= cond.gte) && (!('lte' in cond) || n <= cond.lte);
        }
        return !!v;
    }

    // ---- the Feed (STORY.md App. C): one 8-notch campaign clock ----------------------
    function addFeed(by) {
        Rift.State.update(s => { s.flags.feed = Rift.clamp((Number(s.flags.feed) || 0) + by, 0, 8); });
        return flags().feed;
    }

    function canDie() {
        const s = save();
        return !(s && s.settings && s.settings.charactersCanDie === false);
    }

    // NPC names whose Quiet Scene is pending and plays at the opening of chapter `ch`
    // (any chapter after the peril's own; never on a jump backwards).
    function pendingQuiet(ch) {
        const cast = (Rift.data || {}).cast || {};
        const i = chapterIndex(ch);
        return Object.entries(cast).filter(([role, c]) => c.policy === 'lethal' && c.quietAuto !== false
            && flag('quiet:' + npcOf(role)) === 'pending' && i > chapterIndex(c.chapter)).map(([role]) => npcOf(role));
    }

    Rift.Story = {
        CHAPTERS, chapterIndex, nodeChapter, enteredChapters, markEntered, isMemory, chapterOfKey,
        npcOf, normalKey, flag, setFlag, addFlag, test, addFeed, canDie, pendingQuiet,
        avatar, species, avatarId, wayOfKnowing, avatarVoice, matchesOnly,
    };
})(typeof window !== 'undefined' ? window : globalThis);
