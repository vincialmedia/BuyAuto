# Duplicate Header Fix Plan

## Problem
The `GaragePlanPage` (`src/pages/garage-plan.tsx`) displays a double header and double footer.

## Root Cause
- `src/pages/_app.tsx` wraps all pages in `MainLayout`.
- `MainLayout` renders `<Header />` and `<Footer />`.
- `garage-plan.tsx` explicitly renders `<Header />` and `<Footer />` again.

## Solution
Modify `src/pages/garage-plan.tsx`:

1.  **Remove Imports**:
    - Remove `import Header from "@/components/buyauto/Header";`
    - Remove `import { Footer } from "@/components/buyauto/Footer";`

2.  **Remove Components**:
    - Remove `<Header />` JSX tag.
    - Remove `<Footer />` JSX tag.

3.  **Adjust Layout Wrapper**:
    - Remove the outer `div`'s `min-h-screen` and `flex-col` classes (layout handles this).
    - Remove the internal `<main>` tag (layout handles this).
    - Keep the background gradient styling on a wrapper `div` to maintain the visual design.

## Verification
- Navigate to `/garage-plan` (or try to create a listing without a package).
- Verify only one navigation bar and one footer are visible.