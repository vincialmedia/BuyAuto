# design-sync notes — BuyAuto

Repo-specific gotchas for syncing this repo to claude.ai/design. Read this
before re-running the sync; it is the accumulated cost of the first import.

## Shape: this is an app, not a library

BuyAuto is a Next.js **application**, not a published component package. There
is no `dist/`, no `main`/`module`/`exports` in `package.json`, and no build step
that produces a library entry. Consequences:

- The converter runs in **synth-entry mode**: it globs every `.tsx` under
  `cfg.srcDir` and writes an entry that `export * from` each one. Hence
  `[NO_DIST] no built entry — synthesizing from N src files` in every build log.
  That line is expected here, not a failure.
- `cfg.srcDir` is `src/components` (not the default `src/`) so the synth entry
  does not sweep in `src/pages`, `src/services`, `src/lib`, etc.
- `.d.ts` prop contracts are derived from source by ts-morph rather than from
  shipped types, so they are only as good as the components' own prop
  annotations.

## `node_modules/buyauto` self-symlink — REQUIRED, and NOT committed

`package-build.mjs` resolves the package directory as `<node_modules>/<pkg>`.
For a self-contained app that path does not exist, and the build dies with
`ENOENT … node_modules/buyauto/package.json`.

Fix, which must be re-run **after every fresh clone / `npm ci`**:

```sh
ln -sfn .. node_modules/buyauto
```

`cfg.pkg` is `buyauto`, deliberately *not* the `package.json` name
(`softgen-starter`, a leftover template name). The symlink makes `buyauto` the
resolvable package name, so the docs the design agent reads say
`import { Button } from 'buyauto'` rather than exposing the template name.
`cfg.globalName` is set explicitly to `BuyAuto` for the same reason.

## Next.js runtime shims — the reason the bundle builds at all

`.design-sync/shims/` holds browser-safe stand-ins for six Next.js modules, and
`.design-sync/tsconfig.sync.json` aliases them in via `compilerOptions.paths`
(the converter's esbuild pass resolves through that plugin — it is the only
alias seam available without forking a lib script).

Why each one exists:

| Shim | Why |
|---|---|
| `next/router` | **Hard build blocker.** The real module drags `next/dist/shared/lib/router/router.js` in, which requires `fs`/`stream`/`zlib` and fails the browser build. 26 components call `useRouter()`; the shim returns an inert router with `isReady: true` so components don't sit in their loading branch. |
| `next/link` | No router to prefetch against. Renders a plain `<a>`, including the `legacyBehavior` single-child clone path. |
| `next/image` | The Next image-optimization endpoint doesn't exist in a design render, so real images would 404. Renders `<img>`, reproduces `fill` via absolute positioning, forces `loading="eager"` (lazy images below the fold get screenshotted before they start loading). |
| `next/dynamic` | 5 components code-split their most interesting child. Implemented with `React.lazy` + `Suspense` so the real component still renders. |
| `next/head`, `next/script` | No visual output; `next/script` would also fire real network requests during capture. |

**If a component starts importing a Next module not in that table, add a shim
and a `paths` entry** — otherwise the build fails or the preview blanks.

## `tsconfig.sync.json` comment syntax — a real trap

`package-build.mjs` strips comments with two regexes before `JSON.parse`. The
line-comment regex is `/(^|[^:])\/\/.*$/gm`, which **also eats a `"//"` JSON
key** (the `"` before it matches `[^:]`). A documentation key written as
`"//": [ … ]` silently mangles the parse; `tsconfigPathsPlugin` then returns
`null`, *all* paths are lost, and the failure surfaces far away as an
unresolved-import error about `fs`/`stream`/`zlib`. Cost the first sync a
debugging cycle.

Rules for that file: **line comments only, never a `"//"` key, and never a
slash-star sequence inside a comment** (it opens a block-comment strip).

## `process.env` must be installed before the bundle body runs

esbuild only substitutes the literal `process.env.NODE_ENV`; the other seven
`process.env.*` reads in this codebase survive as property accesses on a global
that does not exist in a browser. Two of them run at **module scope**
(`src/integrations/supabase/client.ts` constructs the client at import time,
`src/lib/analytics/gtag.ts` computes its IDs at import time), so the very first
one threw `process is not defined` while `_ds_bundle.js` was still
initialising. The IIFE never completed and `window.BuyAuto` stayed `undefined`
— **every** component rendered blank, with no error tying it to env vars.

`.design-sync/shims/process-env.ts` installs an inert `process.env` and is
wired in via `cfg.extraEntries`. That placement is load-bearing:
`package-build.mjs` emits `export * from <extraEntry>` **before**
`export * from <mainEntry>`, and ES module evaluation follows that order, so
the shim runs first by construction.

The Supabase host is `https://design-preview.invalid` — a reserved TLD that can
never resolve, so a component that fetches on mount fails fast into its own
error branch instead of hanging the render check or hitting a real backend.
**Add any new `NEXT_PUBLIC_*` var to that shim** or it re-breaks the bundle.

## `export *` drops default exports — the generated barrel

35 of this repo's components use `export default` (Header, HeroSection,
FAQSection, MainLayout, the whole auth and dashboard set). The converter's
synth entry is made of `export * from "<file>"` lines, and `export *`
deliberately does **not** re-export a default binding. Those components were
still discovered and given cards — the cards just rendered blank, because
`window.BuyAuto.Header` was `undefined`.

`.design-sync/gen-default-exports.mjs` generates
`.design-sync/shims/default-exports.ts`, a barrel of
`export { default as X } from "@/…"` lines, wired in via `cfg.extraEntries`.
It is **generated, not hand-written**, so a component added with `export
default` tomorrow is picked up automatically — `cfg.buildCmd` runs it before
every converter build.

### The `Toaster` collision

`Toaster` is exported by BOTH `ui/sonner.tsx` and `ui/toaster.tsx` — the repo
genuinely runs two toast systems and `_app.tsx` mounts both. An ambiguous name
is dropped from an ES namespace entirely, so `Toaster` reached the bundle as
`undefined`.

Re-exporting it from the barrel under the plain name does **not** help: the
barrel and the main entry are both `export * from` sources in the generated
bundle entry, so the name is ambiguous between *those two* and gets dropped
again (verified — `hasOwnProperty(window.BuyAuto, 'Toaster')` was `false`).

Resolution: the barrel exposes them as **`SonnerToaster`** and
**`RadixToaster`**, and the plain `Toaster` card is excluded via
`cfg.componentSrcMap`. No real loss — `Toaster` is a mount point that renders
an empty portal until a toast fires, so its card would have been blank anyway.
The individual `Toast*` primitives all still have cards.

## TRAP: a non-null `componentSrcMap` entry disables discovery

In synth-entry mode (no `dist/`, no `.d.ts`) the component list comes from
`deriveComponentsFromSrc`, but **only if the list is otherwise empty**.
`resolvePackage` builds the set from the `.d.ts` exports (empty here), applies
`componentSrcMap`, and only falls back to the src scan when the result is still
empty. So adding a single non-null `componentSrcMap` entry to pin or add a
component silently collapses the whole sync — the build went from 326
components to **2**, exit code 0, no warning.

**In this repo `componentSrcMap` may only ever contain `null` exclusions.** To
add a component that the src scan misses, export it from the generated barrel
instead.

## Styling: Tailwind must be compiled before every build

All styling is Tailwind utility classes; `src/styles/globals.css` is a source
file full of `@tailwind` directives, useless as a `cssEntry`. `cfg.buildCmd`
compiles it:

```sh
npx tailwindcss -c .design-sync/tailwind.sync.ts -i .design-sync/css/entry.css -o .design-sync/css/ds-styles.css
```

- `.design-sync/tailwind.sync.ts` reuses the app's theme verbatim but widens
  `content` to include `.design-sync/previews/**` — Tailwind is JIT, so a class
  that appears **only** in an authored preview is otherwise never emitted and
  the card renders unstyled.
- `.design-sync/css/entry.css` `@import`s the app's real `globals.css` (never a
  copy — it can't drift) plus the fonts, below.
- **Re-run this whenever a preview is authored or edited**, before
  `package-build.mjs`. `resync.mjs` does not run it.

### TRAP: `preview-rebuild.mjs` does not refresh the stylesheet

`lib/preview-rebuild.mjs` recompiles preview HTML/JS for the named components
but does **not** re-copy `cfg.cssEntry` into `ds-bundle/_ds_bundle.css` — only a
full `package-build.mjs` run does that. So the fast author→rebuild→capture loop
renders every card against the **previous** build's CSS.

Classes that already exist somewhere in `src/` are unaffected, which is what
makes this so easy to miss: everything looks right except the handful of
utilities that appear *only* in an authored preview. It first showed up as
`Avatar`'s `size-12` / `size-8` cells rendering as bare text with no circle —
`.size-12` was in the freshly compiled `ds-styles.css` and absent from the
bundle's `_ds_bundle.css`.

**So: after authoring previews that introduce new utility classes, run the full
`sh .design-sync/build.sh`, not just `preview-rebuild.mjs`.** Quick check:
`grep -c '\.some-new-class' ds-bundle/_ds_bundle.css`.

## Authoring previews in this repo — four traps

1. **Never import one `previews/<Name>.tsx` from another.** Each preview file is
   compiled as its own entry; importing a sibling preview yields an empty module
   at capture time and the card renders **blank with no error**
   (`SidebarMenuSubItem`, `PaginationEllipsis`, `DrawerFooter` all hit this).
   Shared compositions go in an **underscore-prefixed helper**
   (`_sidebar-demo.tsx`, `_nested-nav.tsx`, `_pager-demo.tsx`,
   `_drawer-demo.tsx`) — the underscore keeps it from matching a component name,
   so it never becomes a card, and importing it works.

2. **A bare re-export produces no cells.** `export { X } from './y'` leaves the
   preview module with no own exports and capture fails with
   `window.__dsCells is empty`. Declare a local component that renders the
   shared one instead.

3. **Portalled content never reaches the capture root.** `DropdownMenuContent`
   works (it is anchored to an open trigger), but `MenubarContent` and
   `ContextMenuContent` wrap children in a Radix Portal that mounts on
   `document.body`, and neither Menubar nor ContextMenu accepts a controlled
   `open`. Cards for `MenubarLabel` / `ContextMenuLabel` therefore render the
   real label components on plain scaffolding carrying the same surface classes
   the content component uses — marked as scaffolding in each file.

4. **Some primitives need their library's root context.** `DrawerTitle` /
   `DrawerDescription` are vaul primitives and throw outside `Drawer` — using
   them blanked the whole card. `DrawerHeader` / `DrawerFooter` are plain divs
   and render anywhere.

Also worth knowing: **`Sidebar`'s `side` prop is a no-op when
`collapsible="none"`** — that branch returns a plain flex column and never
reads `side`. Right-hand placement in that mode comes from DOM order (sidebar
after `SidebarInset`).

## Fonts: Manrope + Caveat come from `next/font/google`

`_app.tsx` loads both via `next/font/google`, which injects `--font-manrope` /
`--font-caveat` at runtime. Nothing injects them in a design render, so
`tailwind.config.ts`'s `fontFamily.sans: var(--font-manrope)` would silently
fall back to the browser default and **every** exported component would render
in the wrong face.

`.design-sync/css/entry.css` fixes this by loading both families from the Google
Fonts CDN and defining the two variables itself. They load at runtime over the
network (validate reports this as `[FONT_REMOTE]`, informational). No `.woff2`
ships with the bundle.

## Scope

`cfg.componentSrcMap` exclusions (all `null`):

- `src/components/admin/**` (9) — internal tooling, not part of the public design
  language.
- `GoogleAnalytics`, `SEO`, `StructuredData`, `SEOElements`, `BreadcrumbJsonLd`
  — render nothing visible.

`cfg.guidelinesGlob` is `[]` on purpose: the only file the default globs matched
was `docs/ai-traffic-tracking.md`, an SEO/ops note that would have been handed
to the design agent as a "design guideline".

## Group labels

Groups are derived from the source directory. The ~240 shadcn/ui primitives all
land in **`general`** because `ui` is in the converter's `GENERIC_DIR` skip
list, so the path contributes no usable segment. This is the converter's
designed default, not a misconfiguration. Fixing it would need a per-component
docs stub carrying a `category:` frontmatter — an enumeration the skill
explicitly warns against, and it would rot on every component added. Left as-is.

BuyAuto's own components get real groups from their directories: `buyauto`,
`search`, `detail`, `pricing`, `dashboard`, `auth`, `create-listing`, `dealer`,
`messages`, `calculator`, `layout`, plus `step1`/`step2` from the listing
wizard's step subdirectories.

## Tailwind safelist — why the stylesheet is 470 KB

A design agent building screens from this system renders against the
**shipped** `_ds_bundle.css`; nothing recompiles Tailwind for it. Without help,
the available class vocabulary would be only what this repo happens to use
today — so `grid-cols-3` would work and `grid-cols-7` would silently do
nothing, `text-2xl` would work and `text-7xl` would not.

`.design-sync/tailwind.sync.ts` therefore carries a `safelist` emitting the
full standard scales for the utilities an agent actually composes with
(spacing, grid, sizing, typography, radius/shadow/opacity, plus `sm|md|lg|xl`
responsive variants and `hover|focus|active|disabled` on the DS colour
families). That took the compiled sheet from ~180 KB to ~470 KB, which is a
good trade for predictable output.

Colours are **enumerated** (the DS's own semantic families) rather than
pattern-matched, so the safelist does not drag in all of Tailwind's default
palette and the agent is steered to `bg-primary` over `bg-red-500`.

Arbitrary values (`w-[437px]`) can never work in a precompiled sheet;
conventions.md tells the agent to stay on the scales.

## Known render warns (triaged — not new)

Re-syncs should compare validate's warn lines against this list:

- **`[FONT_MISSING] "Cambria"`** — not a brand font. It is a member of
  Tailwind's default `font-serif` fallback stack
  (`ui-serif, Georgia, Cambria, "Times New Roman", …`), which preflight emits.
  Nothing to ship.
- **`[TOKENS_MISSING]` for `--radix-*`** (e.g.
  `--radix-accordion-content-height`, `--radix-navigation-menu-viewport-height`)
  — set at runtime by Radix on the element. Expected to be absent from a static
  stylesheet.
- **`[EXPORT_COLLISION]` naming 37 names from `default-exports.ts`** — a false
  positive here. The converter's static scan counts `export default function
  Header` in the main entry as an export named `Header`, but `export *` never
  re-exports a default, so at runtime the main namespace has no such key and the
  barrel's binding survives. Verified: `typeof window.BuyAuto.Header ===
  'function'` and every one of the 326 cards resolves to a defined export.

## Re-sync risks — what can silently go stale

- **The `node_modules/buyauto` symlink** is recreated per clone. A fresh clone
  or `npm ci` without it fails the build immediately (`ENOENT …
  node_modules/buyauto/package.json`).
- **The generated `types/` tree and the default-exports barrel** are rebuilt by
  `build.sh`. Never run `package-build.mjs` directly — you would build against a
  stale `.d.ts` tree and a stale barrel, silently dropping any newly added
  default-exported component from the bundle.
- **`copy-public-assets.mjs` is a POST-build step** and `resync.mjs` does not
  know about it. After any driver run, re-run it or the Header logo, hero photo,
  founder portrait and pricing photo all 404.
- **The `--sidebar-*` token block in `.design-sync/css/entry.css` is a
  workaround for an app bug.** If someone fixes `src/styles/globals.css`
  properly, delete that block or the two definitions will drift.
- **The Next.js shims are a fixed set of six.** A component that starts
  importing another `next/*` module (e.g. `next/navigation`) breaks the build or
  blanks its preview until a shim and a `paths` entry are added.
- **The vendored fonts are a point-in-time copy.** `fetch-fonts.mjs` re-fetches
  from Google Fonts; the file names are stable but the woff2 bytes will change
  when Google revs the family.
- **Preview data is invented, not sourced.** The repo deleted its `mockListings`
  fixture, so every listing in `.design-sync/previews/` is hand-written. If the
  `Listing` type gains required fields these previews will not fail loudly —
  they will just render slightly wrong.
- **`SimilarListings` can never show real content** in a capture; it fetches and
  returns `null` when empty. Its card explains that rather than faking data.
- **Only partially verified:** the ~240 primitives that still ship the floor
  card were verified by the render check only, not by an authored preview.

## Card-mode overrides (`cfg.overrides`) — grid presentation, not correctness

Validate's `[GRID_OVERFLOW]` check flagged nine components whose stories render
fine standalone but present badly in the product's grid view. All nine are in
`cfg.overrides`:

- **`cardMode: "single"`** — `AlertDialog`, `DropdownMenu`, `DropdownMenuLabel`,
  `HoverCard`, `Popover`, `Tooltip`. These mount portalled/`fixed` content that
  positions itself outside its grid cell; no grid layout can present them, so
  the card shows one story at full size.
- **`cardMode: "column"`** — `CardFooter`, `NavigationMenuItem`, `Pagination`.
  Wider than a grid cell; column mode keeps every story at full card width, one
  per row.

`Dialog` and `Sheet` were **not** flagged: `Dialog`'s preview already neutralises
the `fixed` centring (`relative left-auto top-auto translate-x-0 translate-y-0`
— without it the panel's `translate-y-[-50%]` pushed the title above the cell
and it was clipped), and `Sheet` is edge-anchored within the cell.

These are presentation-only edits — grades carry forward and a single/column
card cannot re-flag by construction, so no confirming re-validate is needed.
