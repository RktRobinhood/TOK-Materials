// Loads the game's classic scripts into a fake window so pure modules
// (state, puzzles' generate/check, the battle engine) can be tested in Node.
//
//   import { loadRift } from './harness.mjs';
//   const Rift = loadRift(['js/core/rift.js', 'js/puzzles/registry.js', 'js/puzzles/liars-gate.js']);
//
// Paths are relative to the game folder. Run all tests from the game folder with:
//   node --test "tools/test/*.test.mjs"
import vm from 'node:vm';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const GAME_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

// opts.noCompression leaves out CompressionStream, like a browser too old to pack codes.
export function loadRift(files, opts = {}) {
    const ctx = {
        console, Math, Date, JSON, Buffer, TextEncoder, TextDecoder,
        setTimeout, clearTimeout, Promise, Uint8Array, Error, Object, Array,
    };
    if (!opts.noCompression) Object.assign(ctx, { CompressionStream, DecompressionStream });
    ctx.window = ctx;
    ctx.globalThis = ctx;
    vm.createContext(ctx);
    for (const rel of files) {
        const file = path.join(GAME_DIR, rel);
        vm.runInContext(fs.readFileSync(file, 'utf8'), ctx, { filename: file });
    }
    return ctx.Rift;
}
