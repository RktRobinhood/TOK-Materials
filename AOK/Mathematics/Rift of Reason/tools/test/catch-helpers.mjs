// Real-time games are driven like a player would: the clock runs, then arrow keys and
// Space at the moment the certificate acts. The canvas exposes its view for the clock only.
export function arcadeMove(root, action) {
    const canvas = root.querySelector('[data-catch-key="arena"]'), view = canvas.arcade, key = k => canvas.dispatchEvent({ type: 'keydown', key: k, preventDefault() {} });
    view.advance(action.t - view.state().t);
    if (action.wall) {
        const [x, y, o] = action.wall;
        canvas.focus();
        for (let c = view.cursor(); c.x !== x || c.y !== y; c = view.cursor()) key(c.x < x ? 'ArrowRight' : c.x > x ? 'ArrowLeft' : c.y < y ? 'ArrowDown' : 'ArrowUp');
        if (view.cursor().o !== o) key('r');
        key(' ');
    } else if (action.fire != null) { view.aim(action.fire); key(' '); }
}
