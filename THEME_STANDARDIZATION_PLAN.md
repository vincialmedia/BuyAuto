# Theme Standardization Plan: "Standard Red"

## 1. Current State
- **Primary Color**: Dark/Black (`240 5.9% 10%`) - Used for main buttons and text.
- **Red Color**: Used manually via utility classes like `text-red-600` (`#dc2626` / `0 72% 51%`).
- **Destructive Color**: A different red (`0 84.2% 60.2%`) - Used for delete buttons/errors.

## 2. Location of Changes

### A. The Color Values: `src/styles/globals.css`
This file contains the CSS variables. To change the default colors, we update the HSL values here.

**To set "Standard Red" (approx Red-600) as a variable:**
```css
:root {
  /* Standard Red-600 HSL: 339 90% 51% (or custom brand red) */
  --brand-red: 0 72% 51%; 
}
```

### B. The Utility Classes: `tailwind.config.ts`
This file exposes the CSS variable to your code.

```typescript
extend: {
  colors: {
    brand: {
      DEFAULT: 'hsl(var(--brand-red))',
      foreground: 'hsl(0 0% 100%)' // White text on red background
    }
  }
}
```

## 3. Implementation Options

### Option 1: The "Full Rebrand" (Set Primary to Red)
Use this if you want the **entire site** (buttons, focus rings, active states) to be Red by default.
1. Update `--primary` in `globals.css` to `0 72% 51%`.
2. Update `--primary-foreground` to `0 0% 100%` (white) if not already.

### Option 2: The "Semantic Highlight" (Add Brand Color)
Use this if you want to keep black buttons but use Red for highlights/accents.
1. Add `--brand` variable to `globals.css`.
2. Add `brand` color to `tailwind.config.ts`.
3. Replace manual `text-red-600` classes with `text-brand`.

## 4. Execution Steps
1. Decide on Option 1 or 2.
2. Switch to **Standard Mode**.
3. Request: "Implement Option [1/2] from the THEME_STANDARDIZATION_PLAN to set Red as the default."