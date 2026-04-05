# Footer: Remove “Kontakt” Link (Unternehmen column)

## Problem
The footer still renders a “Kontakt” item under the column **UNTERNEHMEN**.

## Verified root cause (current code)
**File:** `src/components/buyauto/Footer.tsx`

There is still a link entry in `footerSections`:
```ts
{
  title: "Unternehmen",
  links: [
    { label: "Über BuyAuto", href: "/#ueber-buyauto" },
    { label: "Kontakt", href: "/#kontakt" }
  ]
}
```

Repo search confirms this is the only occurrence of:
- `{ label: "Kontakt", href: "/#kontakt" }`

## Change
**File:** `src/components/buyauto/Footer.tsx`

Remove this entry:
```ts
{ label: "Kontakt", href: "/#kontakt" }
```

Result should be:
```ts
{
  title: "Unternehmen",
  links: [{ label: "Über BuyAuto", href: "/#ueber-buyauto" }]
}
```

## Acceptance criteria
- Footer column **UNTERNEHMEN** no longer shows “Kontakt”
- “Über BuyAuto” remains unchanged
- Lint + TypeScript checks pass