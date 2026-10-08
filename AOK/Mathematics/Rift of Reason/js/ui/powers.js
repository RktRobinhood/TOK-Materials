/*
 * Hero powers on screen (design/AVATARS.md 1.6): the power's picture and its numbers, shared by the
 * battle screen, the avatar select screen and the Collection. The rules are in data/powers.js and
 * js/battle/engine.js; this file only shows them.
 *
 * Rift.PowerView.glyph(id) → a fallback symbol until the art ui/power-<id> exists
 * Rift.PowerView.icon(id, cls?) → an <img> (art) or a <span> with the glyph
 * Rift.PowerView.numbers(id, tweaks?) → { id, name, text, cost, heartCost, recharge } after the tweaks
 * Rift.PowerView.costWords(n, hearts?) / rechargeWords(n) → "2 energy" / "Rests 2 turns after use"
 * Rift.PowerView.panel(avatar) → a small panel (name, text, cost, recharge, tweak icons) or null without a power
 * Rift.PowerView.tweakIcon(id) → the tweak's art ui/tweak-<id>, or a small text chip
 * Rift.PowerView.editTweaks(opts?) → the campfire tweak editor (a modal); false when there is no power or no slot.
 *   Slots come from Rift.World.tweakSlots; the choice is saved to save.avatar.tweaks. opts.onClose runs after.
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

    function tweakIcon(id) {
        const t = ((Rift.data.powerTweaks || {})[id]) || { name: id };
        const art = 'ui/tweak-' + id;
        return has(art) ? Rift.Assets.img(art, { className: 'tweak-icon', alt: t.name, label: t.name }) : el('span.chip.tweak-chip', { text: t.name });
    }

    function panel(avatar) {
        const pw = Rift.Powers && Rift.Powers.forAvatar ? Rift.Powers.forAvatar(avatar) : null;
        const x = pw && numbers(pw.id, pw.tweaks);
        if (!x) return null;
        const tweaks = pw.tweaks || [];
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
                tweaks.length ? el('div.power-panel-tweaks', { 'aria-label': 'Tweaks: ' + tweaks.map(t => Rift.data.powerTweaks[t].name).join(', ') }, tweaks.map(tweakIcon)) : null,
            ]),
        ]);
    }

    // The campfire tweak editor: pick up to one tweak per open slot; each shows what it gains and pays,
    // and the power's numbers update as you choose.
    function editTweaks(opts) {
        const o = opts || {};
        const s = Rift.State.get();
        const pw = Rift.Powers && Rift.Powers.forAvatar ? Rift.Powers.forAvatar(s.avatar) : null;
        const slots = Rift.World && Rift.World.tweakSlots ? Rift.World.tweakSlots(s) : 0;
        if (!pw || !slots) return false;
        let chosen = pw.tweaks.slice(0, slots);
        const body = el('div.stack.tweak-editor');
        const draw = () => {
            const x = numbers(pw.id, chosen);
            body.innerHTML = '';
            body.append(
                el('p.small', { text: 'A tweak changes your power: it gains something and pays for it. You have ' + slots + ' slot' + (slots === 1 ? '' : 's') + ' (' + chosen.length + ' used). You can change them at any campfire.' }),
                el('div.panel.perk.power-panel', { dataset: { power: x.id } }, [
                    el('div.power-panel-icon', {}, [icon(x.id)]),
                    el('div.power-panel-words', {}, [
                        el('strong', { text: x.name }),
                        el('div', { text: x.text }),
                        el('div.power-panel-stats', {}, [
                            el('span.chip.power-cost', { text: (x.heartCost ? '❤ ' : '⚡ ') + costWords(x.cost, x.heartCost) }),
                            el('span.chip.power-recharge', { text: '⟳ ' + rechargeWords(x.recharge) }),
                        ]),
                    ]),
                ]),
                el('div.stack.tweak-list', {}, Object.entries(Rift.data.powerTweaks).map(([id, t]) => {
                    const on = chosen.includes(id);
                    const full = !on && chosen.length >= slots;
                    return el('button.btn.tweak-option' + (on ? '.on' : ''), {
                        type: 'button', disabled: full, dataset: { tweak: id }, 'aria-pressed': on ? 'true' : 'false',
                        onclick() { chosen = on ? chosen.filter(c => c !== id) : chosen.concat(id); draw(); },
                    }, [tweakIcon(id), el('strong', { text: t.name }), el('span.small', { text: t.text })]);
                })),
            );
        };
        draw();
        Rift.UI.modal('Tweak your power', body, [
            { label: 'Not now' },
            { label: 'Save', primary: true, onclick() {
                Rift.State.update(st => { st.avatar.tweaks = Rift.Powers.cleanTweaks(chosen).slice(0, slots); });
                if (Rift.UI.toast) Rift.UI.toast(chosen.length ? 'Tweaks saved: ' + chosen.map(t => Rift.data.powerTweaks[t].name).join(', ') + '.' : 'Your power has no tweaks now.');
            } },
        ], { onClose: o.onClose });
        return true;
    }

    Rift.PowerView = { glyph, icon, tweakIcon, numbers, costWords, rechargeWords, panel, editTweaks };
})(typeof window !== 'undefined' ? window : globalThis);
