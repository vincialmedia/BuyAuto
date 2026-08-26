#!/bin/sh
# THE build entry point for the design-sync export. Always use this rather than
# calling package-build.mjs directly — it wires in the two repo-specific steps
# the converter knows nothing about.
#
#   1. tsc                       (pre)  emit the .d.ts tree the prop extractor reads
#   2. gen-default-exports.mjs   (pre)  regenerate the barrel of default exports
#   3. tailwindcss               (pre)  compile the utility classes
#   4. package-build.mjs                the converter itself
#   5. copy-public-assets.mjs    (post) images referenced from public/
#
# Steps 1-3 are also in cfg.buildCmd, which is what a re-sync re-runs. Step 5
# is a POST-build step — package-build.mjs resets the output directory on every
# run, so it must follow the converter, and it must be re-run after resync.mjs
# too (the driver calls package-build.mjs internally and knows nothing about it).
#
# Usage: sh .design-sync/build.sh [outDir]
set -e

OUT="${1:-./ds-bundle}"

npx tsc -p .design-sync/tsconfig.types.json
node .design-sync/gen-default-exports.mjs
npx tailwindcss -c .design-sync/tailwind.sync.ts \
  -i .design-sync/css/entry.css \
  -o .design-sync/css/ds-styles.css
node .ds-sync/package-build.mjs \
  --config .design-sync/config.json \
  --node-modules ./node_modules \
  --out "$OUT"
node .design-sync/copy-public-assets.mjs "$OUT"
