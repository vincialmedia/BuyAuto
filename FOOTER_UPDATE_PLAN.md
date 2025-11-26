# Footer Update Plan

## Objective
Remove the "Unternehmen" column and its associated links from the website footer as requested.

## Analysis
- **Target File**: `src/components/buyauto/Footer.tsx`
- **Current Structure**: 
  - The footer uses a grid layout: `lg:grid-cols-5`.
  - The "Company Info" block takes 2 columns (`lg:col-span-2`).
  - The `footerSections` array currently has 3 items ("Services", "Unternehmen", "Rechtliches"), taking up the remaining 3 columns.
  - Total: 2 + 3 = 5 columns.

## Proposed Changes

1. **Modify `footerSections` Data**:
   - Remove the object containing `title: "Unternehmen"` from the `footerSections` array.

2. **Layout Considerations**:
   - **Option A (Minimal)**: Keep `lg:grid-cols-5`. The footer will effectively use 4 columns (2 for info + 2 for links), leaving the rightmost column empty. This is a safe default.
   - **Option B (Optimized)**: Change `lg:grid-cols-5` to `lg:grid-cols-4` to distribute the space evenly among the remaining content.

## Implementation Steps
1. Open `src/components/buyauto/Footer.tsx`.
2. Locate the `footerSections` constant.
3. Delete the middle object:
   ```typescript
   {
     title: "Unternehmen",
     links: [
       { label: "Über uns", href: "/" },
       { label: "Kontakt", href: "#kontakt" },
       { label: "Presse", href: "/" },
       { label: "Karriere", href: "/" }
     ]
   },
   ```
4. (Optional) Update the grid class name from `lg:grid-cols-5` to `lg:grid-cols-4`.

## Next Steps
Switch to Creative Mode or Standard Mode to apply these changes.
