# Plan: Intelligent Search Page (`/suche`)

This document outlines the strategic plan for building the vehicle search results page.

### **1. High-Level Goal**

To create a fast, minimalist, and SEO-friendly vehicle search results page (`/suche`). The page will feature faceted filtering, sorting, and a vertical list layout. All filter states will be managed via URL query parameters for shareability and a predictable user experience.

### **2. Data Layer &amp; Business Logic**

This is the foundation. We'll manage all data-related aspects in a dedicated library file.

*   **File:** `src/lib/buyauto/search.ts`
*   **Core Types:**
    *   `Listing`: Defines the structure for a single vehicle listing.
    *   `SearchQuery`: Defines all possible filter and sort parameters.
*   **Data Seeding:**
    *   A `getDemoListings()` function will generate an array of 30-40 sample `Listing` objects to power the UI without a database. This will include a mix of premium/standard vehicles across different brands, prices, and locations.
*   **Search Function:**
    *   `searchListings(query: SearchQuery): { items: Listing[], total: number, page: number, pageSize: number }`
    *   **Filtering:** It will apply all filters from the `SearchQuery` object (brand, price, body type, etc.).
    *   **Sorting:** It will handle sorting logic:
        *   `relevance`: Default sort. Will apply a subtle boost to `premium: true` listings.
        *   Other options (`priceAsc`, `priceDesc`, etc.) will perform standard array sorting.
    *   **Pagination:** It will slice the filtered and sorted array based on the `page` number and a fixed `pageSize` of 12.

### **3. Routing &amp; Page Structure**

*   **Primary Route:** A new page will be created at `src/pages/suche.tsx`.
*   **Alias:** We will configure a rewrite in `next.config.mjs` to allow `/fahrzeuge` to serve the `/suche` page content, improving the user-facing URL.
    ```javascript
    // next.config.mjs
    async rewrites() {
      return [
        {
          source: '/fahrzeuge',
          destination: '/suche',
        },
      ];
    }
    ```

### **4. Component Architecture**

We'll use a modular, component-based approach.

*   **Page Component (`SuchePage`):** `src/pages/suche.tsx`
    *   **Role:** The main container.
    *   **Responsibilities:**
        *   Parses URL query params (`useRouter`).
        *   Manages the `SearchQuery` state.
        *   Calls `searchListings` to fetch and update results.
        *   Handles debounced URL updates when filters change.
        *   Renders the main layout and passes data down to child components.

*   **Layout (`SearchLayout`):** `src/components/buyauto/search/SearchLayout.tsx`
    *   **Role:** Defines the responsive 2-column (desktop) or single-column (mobile) structure.
    *   **Contains:** Slots for the `FacetPanel` and `ResultsList`.

*   **Filters (`FacetPanel`):** `src/components/buyauto/search/FacetPanel.tsx`
    *   **Role:** The left-hand sidebar for filtering.
    *   **Features:**
        *   Uses `shadcn/ui` components (`Accordion`, `Select`, `Slider`, `Checkbox`) for filter controls.
        *   On mobile, it will be rendered inside a `Sheet` (drawer).
        *   Receives the current `SearchQuery` to display active filters.
        *   Emits filter change events up to the `SuchePage`.

*   **Results (`ResultsList`):** `src/components/buyauto/search/ResultsList.tsx`
    *   **Role:** The right-hand section displaying search results.
    *   **Features:**
        *   Displays the result count ("Treffer: 128 Fahrzeuge").
        *   Contains the sorting dropdown.
        *   Renders a list of `SearchResultCard` components.
        *   Includes `Pagination` controls.
        *   Shows skeleton loaders during data fetching.
        *   Displays the `EmptyState` component when there are no results.

*   **Result Item (`SearchResultCard`):** `src/components/buyauto/search/SearchResultCard.tsx`
    *   **Role:** Displays a single vehicle listing in a stacked, row-based format.
    *   **Features:**
        *   Image on the left, details in the middle, price/CTA on the right.
        *   Displays a "Premium" badge and has a subtle glow if `listing.premium` is true.
        *   Links to `/fahrzeug/[id]` (placeholder route).

*   **Active Filters (`ActiveFilters`):** `src/components/buyauto/search/ActiveFilters.tsx`
    *   **Role:** Displays active filters as dismissible chips below the top bar.
    *   **Features:**
        *   Each chip's "x" button removes the corresponding query param from the URL.
        *   Includes a "Alle zurücksetzen" link.

*   **SEO (`SeoHead`):** `src/components/buyauto/search/SeoHead.tsx`
    *   **Role:** Manages all `<head>` content.
    *   **Features:**
        *   Sets the page `title` and `meta description`.
        *   Dynamically generates the `ItemList` JSON-LD `<script>` tag based on the visible results for the current page.

### **5. State Management &amp; Data Flow**

The URL is the single source of truth.

1.  **Init:** `SuchePage` loads and reads filters from `useRouter().query`.
2.  **State Sync:** The raw query object is parsed into a structured `SearchQuery` state object.
3.  **Data Fetch:** The `SearchQuery` is passed to the `searchListings` function.
4.  **Render:** The UI renders based on the search results and the `SearchQuery` state.
5.  **User Action:** A user changes a filter (e.g., checks a "Body Type" box).
6.  **State Update:** An event handler updates the local `SearchQuery` state object.
7.  **Debounce &amp; Push:** The change is debounced (300ms). After the delay, `router.push` is called with the new, updated URL query string.
8.  **Loop:** The URL change triggers a re-render, and the cycle repeats from Step 1.
