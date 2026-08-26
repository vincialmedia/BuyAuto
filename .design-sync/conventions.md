# BuyAuto — how to build with this design system

BuyAuto is a Swiss marketplace for **Leasingübernahme** (taking over a running
car lease). The UI is German (de-CH), built on shadcn/ui primitives over
Tailwind, with a red brand accent on a near-neutral zinc base.

## Setup

**No provider wrapper is required.** Components read auth state from a context
that ships with sensible defaults, so anything you compose renders as a
logged-out visitor without any setup. Just import and render:

```jsx
import { Button, Card, CardContent } from 'buyauto';
```

The bundle's `styles.css` is the only stylesheet you need — it carries the
theme tokens, the compiled utilities, and the two brand faces (Manrope for UI,
Caveat for the handwritten accent), which ship as real `.woff2` files. Nothing
loads from a CDN.

## The styling idiom: Tailwind utilities over semantic tokens

Style with **Tailwind utility classes**, never with hand-written CSS or
`var(--*)` directly. Colours come from a semantic family — always reach for the
token name, never a raw palette colour like `bg-red-500`, or the design drifts
off-brand and breaks anything themed later.

| Family | Classes | Use for |
|---|---|---|
| Surface | `bg-background` `text-foreground` | page ground |
| Card | `bg-card` `text-card-foreground` | raised panels |
| Popover | `bg-popover` `text-popover-foreground` | menus, dialogs, tooltips |
| Brand | `bg-primary` `text-primary-foreground` | primary actions, active state |
| Secondary | `bg-secondary` `text-secondary-foreground` | low-emphasis fills |
| Muted | `bg-muted` `text-muted-foreground` | secondary text, subtle fills |
| Accent | `bg-accent` `text-accent-foreground` | hover/selected rows |
| Danger | `bg-destructive` `text-destructive-foreground` | delete, errors |
| Lines | `border-border` `border-input` `ring-ring` | borders, focus rings |

`--primary` is the brand red (`0 84% 60%`) and doubles as the focus ring.
Radius follows `--radius` through `rounded-lg` / `rounded-md` / `rounded-sm`.
Type is `font-sans` (Manrope) by default; `font-scribble` (Caveat) is the
handwritten accent — use it sparingly, for a single flourish, never body copy.
There is an extra `xs` breakpoint at **400px** below `sm`.

**Utility vocabulary is fixed at export time.** The stylesheet is precompiled,
so only classes it already contains will do anything. The standard scales are
covered — spacing/gap `0–64`, `grid-cols-1..12`, `text-xs..9xl`, the full
radius/shadow/opacity scales, `sm|md|lg|xl` responsive variants, and
`hover|focus|active|disabled` on the colour families above. Arbitrary values
(`w-[437px]`, `bg-[#ff0000]`) will **not** work. Stay on the scales.

## Where the truth lives

Read these before styling — they beat any summary:

- `_ds/<folder>/styles.css` and its `@import`s — the actual tokens and utilities.
- `components/<group>/<Name>/<Name>.d.ts` — the real prop contract.
- `components/<group>/<Name>/<Name>.prompt.md` — per-component usage.

Groups: `general` holds the ~240 shadcn primitives; BuyAuto's own screens live
in `buyauto`, `search`, `detail`, `pricing`, `dashboard`, `auth`,
`create-listing`, `dealer`, `messages`, `calculator`, `layout`.

## Idiomatic example

A library component for the control, DS utilities for your own layout glue:

```jsx
import { Badge, Button, Card, CardContent, CardFooter, CardHeader, CardTitle } from 'buyauto';

<Card className="w-full max-w-sm">
  <CardHeader>
    <div className="flex items-start justify-between gap-3">
      <CardTitle>BMW 320d Touring</CardTitle>
      <Badge>Premium</Badge>
    </div>
  </CardHeader>
  <CardContent className="text-sm text-muted-foreground">
    42’000 km · Diesel · Automatik · Zürich
  </CardContent>
  <CardFooter className="flex items-center justify-between">
    <div>
      <div className="text-xs text-muted-foreground">ab</div>
      <div className="text-lg font-semibold">CHF 489/Mt.</div>
    </div>
    <Button>Details</Button>
  </CardFooter>
</Card>
```

Copy uses Swiss conventions: `CHF` before the amount, `’` as the thousands
separator, `/Mt.` for per-month.

## Three things that will trip you up

- **Toasters are named, not generic.** This app runs two toast systems, so the
  plain name `Toaster` is ambiguous and is not exported. Use **`SonnerToaster`**
  (the primary one) or **`RadixToaster`**.
- **`Sidebar` needs `SidebarProvider`.** Every `Sidebar*` component throws
  outside it. Inside a fixed-height container use `collapsible="none"`; note the
  `side` prop is ignored in that mode — put the sidebar after `SidebarInset` in
  DOM order for a right-hand rail.
- **Compose whole families.** `CardContent`, `TableCell`, `BreadcrumbItem`,
  `SidebarMenuItem` and friends paint nothing on their own — they only render
  inside their parent (`Card`, `Table`, `Breadcrumb`, `Sidebar`).
