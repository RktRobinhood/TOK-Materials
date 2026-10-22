/* Pack reveal (#134): plays back a pack receipt that js/core/packs.js already saved (#136).
 * Nothing here draws, charges or grants. Next, Skip and a reload only change what is on screen;
 * only Done (in the results list) marks the receipt shown. At most one sound per card, never a loop. */
(function (root) {
    'use strict';
    const Rift = root.Rift;
    const el = (...args) => Rift.el(...args);
    const def = card => ((Rift.data[Rift.Packs.KINDS[card.kind]] || {})[card.id]) || { name: card.id };
    const owned = (card, s) => (card.kind === 'creature' ? Rift.State.copiesOf(s, card.id) : Rift.State.cardCopies(card.kind, card.id, s));
    const unique = card => card.kind === 'creature' && Rift.State.isLegendary(card.id);
    // Shared sounds only: an Axiom rings the Axiom chime, rare or better the reveal, the rest a card play.
    function soundFor(card) {
        if (card.kind === 'axiom') return 'axiom';
        return Rift.Rarity.of({ rarity: card.rarity }).rank >= Rift.Rarity.of({ rarity: 'rare' }).rank ? 'reveal' : 'card-play';
    }

    // Pure: what each saved card shows. The folder count is the copies owned right after that card,
    // saved with the pack. An older receipt without it uses today's count minus the same card later
    // in this pack. Reads the save, never writes it.
    function plan(receipt, save) {
        const s = save || Rift.State.get();
        return receipt.cards.map((card, i) => {
            const later = receipt.cards.slice(i + 1).filter(c => c.kind === card.kind && c.id === card.id).length;
            const cap = card.kind === 'creature' ? Rift.State.copyCap(card.id) : Rift.State.COPY_CAP;
            const count = Number.isSafeInteger(card.copies) ? card.copies : Math.max(0, Math.min(cap, owned(card, s) - later));
            // A creature copy released (or lost) before Done still shows, with a note.
            const gone = card.kind === 'creature' && !(s.creatures || []).some(c => c && c.uid === card.uid);
            const rarity = Rift.Rarity.of({ rarity: card.rarity });
            return {
                card, name: def(card).name || card.id, kind: Rift.Packs.LABELS[card.kind], rarity, foil: !!card.foil, count, cap, gone,
                folder: (unique(card) ? 'Legendary creature: one of a kind (' + count + '/1)' : 'New copy · Folder ' + count + '/' + cap) + (gone ? ' · no longer in your Collection' : ''),
                sound: soundFor(card),
            };
        });
    }
    // One plain line per card. Beside a rarity badge (short) the badge already names the tier.
    function line(slide, short) {
        return slide.name + ' · ' + (short ? '' : slide.rarity.label + ' ') + slide.kind + ' · ' + slide.folder + (slide.foil ? ' · ✦ Foil' : '');
    }

    // A spell or Axiom card in the same full-art layout as a creature's framed card.
    function printFace(card) {
        const d = def(card), A = Rift.Assets;
        const frame = card.kind === 'axiom' ? 'ui/card-axiom' : d.colour && A.has('ui/card-tactic-' + d.colour) ? 'ui/card-tactic-' + d.colour : 'ui/card-tactic';
        const art = d.art || (card.kind === 'axiom' ? 'ui/axiom-' + card.id : 'tactic/' + card.id);
        const node = el('div.fcard.big.pack-print' + (card.kind === 'axiom' ? '.axiom' : '') + (card.foil ? '.foil' : ''), { dataset: { rarity: Rift.Rarity.of(d).id } }, [
            el('div.fcard-art', null, [A.has(art) ? A.img(art, { alt: '' }) : el('span.pack-glyph', { text: card.kind === 'axiom' ? '⚖' : '✦', 'aria-hidden': 'true' })]),
            A.has(frame) ? A.img(frame, { className: 'fcard-frame' }) : null,
            Rift.Rarity.badge(d),
            el('div.fcard-panel', null, [
                el('div.fcard-name', { text: d.name || card.id }),
                el('div.fcard-text' + ((d.short || d.text || '').length > 75 ? '.long' : ''), { text: d.short || d.text || '' }),
            ]),
            card.foil ? el('div.fcard-foil', { 'aria-label': 'Foil', text: '✦' }) : null,
        ]);
        if (!A.has(frame)) node.classList.add('no-frame');
        return node;
    }
    function face(card, s) {
        if (card.kind !== 'creature') return printFace(card);
        const inst = ((s || Rift.State.get()).creatures || []).find(c => c && c.uid === card.uid);
        return Rift.UI.framedCard(card.id, { big: true, foil: card.foil, inst });
    }

    // The reveal dialog. Opens on the pack, one card per press, then the results list (#136), whose
    // Done is the only thing that marks the receipt shown. Skip goes straight to that list in silence.
    function show(receipt, after) {
        const s = Rift.State.get(), slides = plan(receipt, s), n = slides.length, A = Rift.Audio;
        let step = -1, played = false, closed = false, timer = null;
        const heading = el('p.pack-step', { text: 'Pack ' + receipt.number + ' · ' + n + ' card' + (n === 1 ? '' : 's') + (receipt.source === 'free' ? ' · free' : ' · ' + receipt.price + ' Coins') });
        const stage = el('div.pack-stage', { onclick: () => next() });
        const caption = el('div.pack-caption', { role: 'status', 'aria-live': 'polite', text: 'Your new cards are already saved. Open the pack to see them.' });
        const button = el('button.btn.primary.pack-next', { type: 'button', text: 'Open pack', onclick: () => next() });
        const sound = name => { if (A && A.sfx) A.sfx(name, { minGap: 150 }); };
        const back = Rift.Assets.has('ui/card-back') ? Rift.Assets.img('ui/card-back', { alt: '' }) : el('span.pack-glyph', { text: '⟁' });
        stage.appendChild(el('div.pack-wrapper.pack-in', { 'aria-hidden': 'true' }, [back]));
        function render(slide) {
            const tier = slide.rarity;
            stage.replaceChildren(el('div.pack-card.pack-in', { dataset: { rarity: tier.id } }, [
                face(slide.card, s),
                slide.foil ? el('div.pack-sheen', { 'aria-hidden': 'true' }) : null,
            ]));
            caption.replaceChildren(...[
                el('div.pack-tier', { dataset: { rarity: tier.id } }, [Rift.Rarity.badge({ rarity: tier.id }), ' ' + slide.kind]),
                el('div.pack-name', { text: slide.name }),
                el('div.pack-folder', { text: slide.folder }),
                slide.foil ? el('div.chip.foil-chip.pack-foil', { text: '✦ Foil · looks only, same card' }) : null,
            ].filter(Boolean));
            heading.textContent = 'Card ' + (step + 1) + ' of ' + n;
            button.textContent = step < n - 1 ? 'Next card (' + (step + 2) + ' of ' + n + ')' : 'See all cards';
        }
        // Keep the card in view (at high zoom the dialog scrolls); focus stays on the button.
        function hold() {
            button.focus({ preventScroll: true });
            if (stage.scrollIntoView) stage.scrollIntoView({ block: 'nearest' });
        }
        function next() {
            if (closed) return;
            if (step >= n - 1) { played = true; dialog.close(); return; }
            step += 1;
            render(slides[step]);
            root.clearTimeout(timer);
            // The pack's open sound first, then the first card's own sound a moment later.
            if (step === 0) { sound('open'); timer = root.setTimeout(() => { if (!closed) sound(slides[0].sound); }, 300); }
            else sound(slides[step].sound);
            hold();
        }
        const dialog = Rift.UI.modal('Your new cards', el('div.stack.pack-reveal', null, [heading, stage, caption, el('div.row.pack-controls', null, [button])]),
            [{ label: 'Skip', required: true }], {
                // Skip, See all cards or any other close: stop this pack's sounds and show the list.
                onClose() {
                    if (closed) return;
                    closed = true;
                    root.clearTimeout(timer);
                    root.document.removeEventListener('keydown', escape, true);
                    if (A && A.stopSounds) A.stopSounds();
                    if (played) sound('jingle');
                    results(receipt, after);
                },
            });
        // Escape skips too: the shared dialog's Escape only knows Close/Cancel-style buttons.
        function escape(event) {
            if (event.key !== 'Escape' || event.repeat || closed || !Rift.UI.input.available(dialog.node)) return;
            Rift.UI.input.consume(event);
            dialog.close();
        }
        root.document.addEventListener('keydown', escape, true);
        hold();
        return dialog;
    }

    // The static list from #136, with each card's folder count and rarity mark. Done finishes it.
    function results(receipt, after) {
        const slides = plan(receipt), n = slides.length, spells = (receipt.unlocked || []).map(id => ((Rift.data.tactics || {})[id] || {}).name || id);
        return Rift.UI.modal('Your new cards', el('div.stack', null, [
            el('p', { text: n + ' new card' + (n === 1 ? ' is' : 's are') + ' in your Collection' + (receipt.source === 'free' ? ' (free).' : ' (' + receipt.price + ' Coins).') }),
            el('ol.pack-results', null, slides.map(x => el('li', { dataset: { rarity: x.rarity.id }, className: x.foil ? 'foil' : '' }, [Rift.Rarity.badge({ rarity: x.rarity.id }), ' ' + line(x, true)]))),
            slides.some(x => x.foil) ? el('p.small', { text: 'Foil changes the look only: same stats, same limits.' }) : null,
            spells.length ? el('p.small', { text: 'New colour spell' + (spells.length === 1 ? '' : 's') + ': ' + spells.join(', ') + '.' }) : null,
        ]), [{ label: 'Done', primary: true, required: true }], {
            onClose() { if (Rift.Audio && Rift.Audio.stopSounds) Rift.Audio.stopSounds(); const r = Rift.Packs.finish(receipt.number); if (after) after(r); },
        });
    }

    Rift.PackReveal = { plan, line, soundFor, show, results };
})(typeof window !== 'undefined' ? window : globalThis);
