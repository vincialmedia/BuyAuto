
# Search Page Redesign Plan

## 1. Project Goal
To redesign the search page (`/suche`) to align with the new, modern aesthetic of the homepage. The focus is on improving user experience, mobile-friendliness, and perceived performance without altering the existing backend search and filter logic.

## 2. Guiding Principles
- **Cohesive Design:** The search page should feel like a natural extension of the homepage.
- **Mobile-First:** The experience must be seamless and intuitive on mobile devices.
- **Performance:** The page should feel fast and responsive, especially during loading states.
- **Clarity:** Information should be easy to scan and digest.

## 3. Phased Implementation Plan

### Phase 1: Foundation &amp; Filter UX

-   **Target Files:** `src/pages/suche.tsx`, `src/components/buyauto/search/DynamicFilterBar.tsx`.
-   **Actions:**
    1.  **Refine Page Layout:**
        -   Ensure the main `Header` and `Footer` are consistent with the homepage.
        -   Add better spacing and a max-width container for the main content.
    2.  **Redesign `DynamicFilterBar.tsx`:**
        -   **Desktop:** Restyle inputs and dropdowns to match the homepage `SearchForm`. Use cleaner visuals and better spacing.
        -   **Mobile:**
            -   Show only 2-3 primary filters (e.g., Brand, Price).
            -   Add an "All Filters" button.
            -   This button will trigger a `Sheet` (slide-out panel) from the left, containing a simplified version of the `FacetPanel.tsx` component for all other options.
    3.  **Create a Reusable Filter Sheet:**
        -   Develop a new component `FilterSheet.tsx` that will be used on mobile.
        -   This component will house the detailed filter options in a clean, vertical layout.

### Phase 2: Results Display

-   **Target Files:** `src/components/buyauto/search/VerticalResultsList.tsx`, `src/components/buyauto/search/VerticalListingCard.tsx`.
-   **Actions:**
    1.  **Create a new `ListingCard.tsx`:**
        -   This will be the new standard card, replacing `VerticalListingCard`.
        -   **Visuals:** Rounded corners, subtle hover shadows, and clean typography.
        -   **Image:** Prominent image area with support for a hover effect to show a second image if available.
        -   **Info:** Use icons for key specs (mileage, gearbox, fuel, etc.) for quick scanning.
        -   **Premium:** A distinct visual treatment (e.g., a subtle red border or glow) for premium listings.
    2.  **Implement `ListingCardSkeleton.tsx`:**
        -   Create a new skeleton component that mimics the exact layout of the new `ListingCard`.
        -   This will be used to provide a high-quality loading experience.
    3.  **Update `VerticalResultsList.tsx`:**
        -   Replace the old card with the new `ListingCard`.
        -   Use an array of `ListingCardSkeleton` components when `isLoading` is true.
        -   Redesign the "No Results" view to be more engaging and helpful.

### Phase 3: Polishing &amp; Cleanup

-   **Target Files:** `src/components/buyauto/search/MinimalPagination.tsx`.
-   **Actions:**
    1.  **Restyle Pagination:** Update the pagination component to match the new, minimalist design language.
    2.  **Review &amp; Refine:** Do a final pass on all redesigned components to ensure consistency in spacing, fonts, and colors.
    3.  **Documentation:** The implementation itself will serve as documentation, but we'll mark old components like `SearchLayout.tsx` and the original `ResultsList.tsx` with `// @deprecated` comments to signal they should be phased out.

---
This plan provides a clear path to a vastly improved search experience. We can begin implementation by switching to **Creative Mode**.
