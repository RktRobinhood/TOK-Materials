/* Card rules text that fits its box (#163). Every card face prints its rules at 12px or more and
 * never cuts them off. Each box below has a width, a type size and a number of lines, measured in
 * the browser (tools/measure-card-text.mjs; report design/reviews/card-text-163-2026-10-23.md). Lines
 * are wrapped like the browser does, word by word, with the measured width of each Nunito letter.
 * A face prints a text only if it fits; the full text is always beside the card (Collection, the
 * pack caption, the Arena magnifier's notes). tools/test/card-text.test.mjs checks every released
 * card against these boxes. */
(function (root) {
    'use strict';
    const Rift = root.Rift;

    // width: the box's inner width in CSS px; px: type size; weight: 400 or 700 (bold); lines: lines it holds.
    const BOXES = {
        // The 300px framed creature card (Collection details, hunt reward): the ability under the
        // name and numbers. .fcard.big and .fcard-text in css/screens.css.
        framed: { width: 204, px: 12, weight: 400, lines: 4 },
        // An Arena big card at its smallest, 190px (magnifier, Read, reveals): a label, then the rule.
        // .bc.big .bc-text in css/battle.css.
        big: { width: 140, px: 13, weight: 400, lines: 4 },
        // A tactic on that big card: only the frame's parchment plate, no label. .bc.big.tactic .bc-text.
        tactic: { width: 120, px: 13, weight: 400, lines: 3 },
        // An Axiom on that big card: the frame's dark plate, clear of its key and chain. .bc.big.axiom .bc-text.
        axiom: { width: 127, px: 13, weight: 400, lines: 3 },
        // A creature's keyword and ability lines on that big card. .bc.big .bc-brief.
        brief: { width: 155, px: 13, weight: 700, lines: 4 },
        // An Arena hand card (76px): one word under the name plate. .bc.hand .bc-text.
        hand: { width: 62, px: 12, weight: 700, lines: 1 },
    };
    // Advance widths in em of Nunito (Google Fonts), regular and bold, measured in Firefox with
    // `node tools/measure-card-text.mjs <dir> --glyphs`. An unknown letter counts as 1.25em.
    const EM = {
        400: { "0": .6, "1": .6, "2": .6, "3": .6, "4": .6, "5": .6, "6": .6, "7": .6, "8": .6, "9": .6, " ": .258, "!": .228, "\"": .392, "'": .221, "(": .317, ")": .317, "+": .6, ",": .228, "-": .424, ".": .228, "/": .245, ":": .228, ";": .228, "?": .447, "A": .729, "B": .676, "C": .654, "D": .742, "E": .583, "F": .548, "G": .726, "H": .761, "I": .257, "J": .306, "K": .625, "L": .543, "M": .855, "N": .74, "O": .767, "P": .633, "Q": .767, "R": .669, "S": .615, "T": .612, "U": .728, "V": .689, "W": 1.101, "X": .65, "Y": .598, "Z": .589, "a": .53, "b": .583, "c": .454, "d": .583, "e": .532, "f": .318, "g": .586, "h": .568, "i": .232, "j": .236, "k": .5, "l": .296, "m": .856, "n": .568, "o": .556, "p": .583, "q": .583, "r": .358, "s": .481, "t": .338, "u": .561, "v": .532, "w": .858, "x": .525, "y": .531, "z": .463, "·": .228, "–": .5, "—": 1, "’": .228, "…": .686, "−": .6, "⚡": 1.25, "❤": .838 },
        700: { "0": .6, "1": .6, "2": .6, "3": .6, "4": .6, "5": .6, "6": .6, "7": .6, "8": .6, "9": .6, " ": .271, "!": .248, "\"": .448, "'": .243, "(": .358, ")": .358, "+": .6, ",": .248, "-": .434, ".": .248, "/": .273, ":": .248, ";": .248, "?": .471, "A": .744, "B": .688, "C": .659, "D": .762, "E": .597, "F": .562, "G": .736, "H": .773, "I": .282, "J": .336, "K": .665, "L": .562, "M": .868, "N": .748, "O": .785, "P": .652, "Q": .785, "R": .686, "S": .631, "T": .633, "U": .738, "V": .713, "W": 1.113, "X": .672, "Y": .623, "Z": .605, "a": .547, "b": .6, "c": .463, "d": .6, "e": .542, "f": .343, "g": .604, "h": .585, "i": .255, "j": .259, "k": .536, "l": .319, "m": .877, "n": .585, "o": .576, "p": .6, "q": .6, "r": .392, "s": .488, "t": .359, "u": .579, "v": .563, "w": .889, "x": .546, "y": .562, "z": .474, "·": .248, "–": .5, "—": 1, "’": .248, "…": .745, "−": .6, "⚡": 1.26, "❤": .838 },
    };
    const SAFETY = 1.03;   // kerning and rounding

    function width(text, px, weight) {
        const t = EM[weight >= 600 ? 700 : 400];
        let w = 0;
        for (const c of Array.from(String(text || ''))) w += t[c] != null ? t[c] : 1.25;
        return w * px * SAFETY;
    }
    // How many lines `text` takes in box `box` (a BOXES key), breaking only between words. A word
    // wider than the box would stick out (no rules text sets overflow-wrap), so it never fits.
    function lines(text, box, weight) {
        const b = BOXES[box], wt = weight || b.weight, space = width(' ', b.px, wt);
        const words = String(text || '').trim().split(/\s+/).filter(Boolean);
        if (!words.length) return 0;
        let n = 0, used = 0;
        for (const word of words) {
            const w = width(word, b.px, wt);
            if (w > b.width) return Infinity;
            if (n && used + space + w <= b.width) { used += space + w; continue; }
            n++;
            used = w;
        }
        return n;
    }
    // Does `text` fit box `box`, under an optional bold `label` (which takes its own lines)?
    function fits(text, box, label) {
        const b = BOXES[box];
        return !!b && lines(label, box, 700) + lines(text, box) <= b.lines;
    }

    Rift.CardText = { BOXES, EM, width, lines, fits };
})(typeof window !== 'undefined' ? window : globalThis);
