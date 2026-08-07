// Copies the public/ images that components reference by root-absolute path
// into the built bundle, at _preview/assets/.
//
// WHY: components write `src="/buyauto-logo-header.png"`. A preview card is
// opened over file://, where a leading "/" is the filesystem root — so the
// Header lost its logo, the pricing hero its photo, and so on. The next/image
// shim rewrites those paths to _preview/assets/…; this puts the bytes there.
//
// Only the referenced files are copied, not all of public/ (43 MB).
//
// This is a POST-build step: package-build.mjs resets the output directory on
// every run, so it must be re-run after each build. See the build wrapper in
// NOTES.md.
//
// Usage: node .design-sync/copy-public-assets.mjs [outDir]

import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';

const OUT = process.argv[2] ?? './ds-bundle';
const SRC = 'src/components';
const PUBLIC = 'public';
const DEST = join(OUT, '_preview', 'assets');

function walk(dir, acc = []) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) walk(p, acc);
    else if (/\.(tsx|jsx|ts)$/.test(e.name)) acc.push(p);
  }
  return acc;
}

// Root-absolute references to an image/font-ish file, in either `src="/x.png"`
// or `src={"/x.png"}` form.
const RX = /["'](\/[\w\-./@]+\.(?:png|jpe?g|gif|svg|webp|avif))["']/g;

const wanted = new Set();
for (const file of walk(SRC)) {
  for (const [, ref] of readFileSync(file, 'utf8').matchAll(RX)) wanted.add(ref);
}

let copied = 0;
const missing = [];
for (const ref of [...wanted].sort()) {
  const from = join(PUBLIC, ref);
  if (!existsSync(from) || !statSync(from).isFile()) {
    missing.push(ref);
    continue;
  }
  const to = join(DEST, ref);
  mkdirSync(dirname(to), { recursive: true });
  copyFileSync(from, to);
  copied++;
}

console.error(`  public assets: ${copied} copied → ${DEST}`);
// A referenced file that is not in public/ is already broken in the app — worth
// surfacing, but not a reason to fail the sync.
if (missing.length) console.error(`  ! referenced but not in public/: ${missing.join(', ')}`);
