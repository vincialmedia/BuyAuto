# Footer Layout Fix Plan

## Issue
The footer currently uses `lg:grid-cols-4`.
- Company Info: `lg:col-span-2` (Takes 2 columns)
- Services: 1 column
- Rechtliches: 1 column
- Seiten: 1 column (Wraps to next row because 2+1+1+1 = 5, but grid is 4)

## Required Change
**File:** `src/components/buyauto/Footer.tsx`

**Find:**
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
```

**Replace with:**
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12">
```

## Result
This will align "Services", "Rechtliches", and "Seiten" in a single row next to the company info on desktop screens.