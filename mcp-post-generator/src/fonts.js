// Register Inter (English only, matches a.md's font rule) from the bundled
// @fontsource/inter woff2 files. No CJK face is registered on purpose so any
// accidental non-Latin glyph renders as tofu and is caught immediately.
import { GlobalFonts } from '@napi-rs/canvas';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const fdir = resolve(here, '..', 'node_modules', '@fontsource', 'inter', 'files');

let done = false;
export function registerFonts() {
  if (done) return;
  const reg = (w, name) =>
    GlobalFonts.registerFromPath(resolve(fdir, `inter-latin-${w}-normal.woff2`), name);
  reg(400, 'InterR');
  reg(500, 'InterM');
  reg(600, 'InterSB');
  reg(700, 'InterB');
  reg(800, 'InterX');
  done = true;
}
