/*
 * Hero powers on screen (design/AVATARS.md 1.6): the power's picture and its numbers, shared by the
 * battle screen, the avatar select screen and the Collection. The rules are in data/powers.js and
 * js/battle/engine.js; this file only shows them.
 *
 * Rift.PowerView.glyph(id) → a fallback symbol until the art ui/power-<id> exists
 * Rift.PowerView.icon(id, cls?) → an <img> (art) or a <span> with the glyph
 * Rift.PowerView.numbers(id, tweaks?) → { id, name, text, cost, heartCost, recharge } after the tweaks
 * Rift.PowerView.costWords(n, hearts?) / rechargeWords(n) → "2 energy" / "Rests 2 turns after use"
 * Rift.PowerView.panel(avatar) → a small panel (name, text, cost, recharge) or null without a power
 */
(function (root) {
    'use strict';
    const Rift = root.Rift;
    const el = (...a) => Rift.el(...a);

    const GLYPH = {
        'close-the-proof': '∎', foresee: '🔮', lantern: '🏮', 'night-sight': '🌙', 'what-if': '⇄',
        brainstorm: '💭', recall: '↩', 'hold-that-thought': '⏳', 'call-it-out': '🗯', 'fine-print': '✍',
        outrage: '😠', 'pile-on': '👊',
    };
    const glyph = id => GLYPH[id] || '✷';
    const has = id => !!(Rift.Assets && Rift.Assets.has && Rift.Assets.has(id));

    function icon(id, cls) {
        const art = 'ui/power-' + id;
        if (has(art)) return Rift.Assets.img(art, { className: 'pw-icon' + (cls ? ' ' + cls : ''), alt: '' });
        return el('span.pw-icon.pw-glyph' + (cls ? '.' + cls : ''), { text: glyph(id), 'aria-hidden': 'true' });
    }

    // The engine's numbers (tweaks included) without a battle: powerMods only reads players[0].power.
    function numbers(id, tweaks) {
        const def = (Rift.data.powers || {})[id];
        if (!def) return null;
        const t = tweaks || [];
        const E = Rift.Battle && Rift.Battle.Engine;
        const m = E && E.powerMods ? E.powerMods({ players: [{ power: { id, tweaks: t } }] }, 0) : null;
        return {
            id, name: def.name,
            text: Rift.Powers && Rift.Powers.text ? Rift.Powers.text(id, t) : def.text,
            cost: m ? m.cost : def.cost, heartCost: m ? m.heartCost : 0, recharge: m ? m.recharge : def.recharge,
        };
    }

    const costWords = (n, hearts) => (hearts ? hearts + ' heart' + (hearts === 1 ? '' : 's') : n ? n + ' energy' : 'Free');
    const rechargeWords = n => (n ? 'Rests ' + n + ' turn' + (n === 1 ? '' : 's') + ' after use' : 'Ready every turn');

    function panel(avatar) {
        const pw = Rift.Powers && Rift.Powers.forAvatar ? Rift.Powers.forAvatar(avatar) : null;
        const x = pw && numbers(pw.id, pw.tweaks);
        if (!x) return null;
        return el('div.panel.perk.power-panel', { dataset: { power: x.id } }, [
            el('div.power-panel-icon', {}, [icon(x.id)]),
            el('div.power-panel-words', {}, [
                el('div.small.muted', { text: 'Card Arena power' }),
                el('strong', { text: x.name }),
                el('div', { text: x.text }),
                el('div.power-panel-stats', {}, [
                    el('span.chip.power-cost', { text: (x.heartCost ? '❤ ' : '⚡ ') + costWords(x.cost, x.heartCost) }),
                    el('span.chip.power-recharge', { text: '⟳ ' + rechargeWords(x.recharge) }),
                ]),
            ]),
        ]);
    }

    Rift.PowerView = { glyph, icon, numbers, costWords, rechargeWords, panel };
})(typeof window !== 'undefined' ? window : globalThis);
