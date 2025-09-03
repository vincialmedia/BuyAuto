# Listing Detail Page - Implementation Plan

This document outlines the plan to build the vehicle listing detail page as per the user's request.

## 1. Route & Data Fetching

### Route
-   **File:** `src/pages/fahrzeug/[id].tsx`
-   **Logic:** This will be a new dynamic page using Next.js's pages router.

### Data Fetching (`getServerSideProps`)
-   The page will use `getServerSideProps` to fetch data on the server for each request. This is crucial for SEO and for ensuring fresh data.
-   **Primary Fetch:**
    -   It will extract the `id` from the URL query parameters.
    -   It will call a new service function, `listingsService.getPublishedListingById(id)`, which fetches a single record from a Supabase view (`public_listings`).
    -   The service will explicitly select all required fields and filter by `id` and `status = 'published'`.
    -   If no listing is found, `getServerSideProps` will return `{ notFound: true }`, triggering a 404 page.
-   **Secondary Fetch (Similar Listings):**
    -   A second service function, `listingsService.getSimilarListings(listing)`, will be called.
    -   This function will fetch 3-6 other listings from the `public_listings` view.
    -   The query will match by `brand` or `body` and will exclude the current listing's `id`.
    -   The results will be passed as a prop to the page component.

## 2. Database Schema (`listing_inquiries`)

-   A new table will be created in Supabase to store inquiries.
-   **SQL for Table Creation:**
    ```sql
    -- Create the table for listing inquiries
    CREATE TABLE IF NOT EXISTS public.listing_inquiries (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        listing_id uuid NOT NULL REFERENCES public.listings(id),
        name text NOT NULL,
        email text NOT NULL,
        phone text,
        message text NOT NULL,
        created_at timestamptz DEFAULT now() NOT NULL
    );

    -- Enable Row Level Security
    ALTER TABLE public.listing_inquiries ENABLE ROW LEVEL SECURITY;

    -- Create Policy: Allow anyone to insert an inquiry.
    -- This is safe because it's an append-only action for anonymous users.
    -- The table should not be readable by the public.
    CREATE POLICY "Allow public insert for inquiries"
    ON public.listing_inquiries
    FOR INSERT
    WITH CHECK (true);
    ```

## 3. Component Structure

The UI will be broken down into a set of new, reusable components located in `src/components/buyauto/listing-detail/`.

-   `ListingPage.tsx`: The main component in `src/pages/fahrzeug/[id].tsx`. It will receive `listing` and `similarListings` as props and assemble the layout.
-   `ListingHeader.tsx`: Renders the `H1` title, subline pills (`price`, `mileage`, etc.), and a conditional premium badge with a subtle glow animation.
-   `MediaGallery.tsx`:
    -   **Desktop:** A two-column layout with a large main image and thumbnails below or on the side.
    -   **Mobile:** Uses `shadcn/ui/carousel` for a swipeable gallery.
    -   Will include a simple, accessible lightbox modal (`shadcn/ui/dialog`) for viewing full-size images.
-   `KeyActionsPanel.tsx`: The right-hand column on desktop, containing the emphasized price, key facts (`Restlaufzeit`, `Kaution`), and the main CTAs.
-   `InquiryForm.tsx`: A form built with `react-hook-form` and `zod` for validation. It will handle its own state and call a service to submit the data. It can be displayed in a modal or as an anchored block.
-   `ListingDetailsSection.tsx`: An accordion (`shadcn/ui/accordion`) to neatly display "Leasingdetails", "Fahrzeugdaten", and "Inserats-Infos".
-   `TrustBox.tsx`: A simple, static component displaying trust-building points.
-   `SimilarListings.tsx`: A section displaying the related listings in a horizontally scrolling container on mobile and a grid on desktop.
-   `ListingSchema.tsx`: A dedicated client component to inject `JSON-LD` structured data (`Vehicle`, `Offer`, `BreadcrumbList`) into the page's `<head>` using a `script` tag. This keeps SEO logic clean and separate.

## 4. Services & Types

-   **`src/services/listingsService.ts`:**
    -   `getPublishedListingById(id: string)`: New function to fetch a single, published listing.
    -   `getSimilarListings(listing: Listing)`: New function to fetch related listings.
-   **`src/services/inquiryService.ts` (New File):**
    -   `submitInquiry(formData)`: A function that validates and inserts data into the `public.listing_inquiries` table using the Supabase client.
-   **`src/lib/buyauto/types.ts`:**
    -   Define a new `ListingDetail` type that includes all fields for the detail page.
    -   Define a new `Inquiry` type for the form data.

## 5. SEO & Structured Data

-   **Page Metadata:** The main page component will use `next/head` to set the page `title`, `meta description`, and OpenGraph tags dynamically based on the listing data.
-   **JSON-LD:** The `ListingSchema.tsx` component will handle all structured data, ensuring that only non-null values are included in the output to produce valid schema markup.

## 6. Implementation Steps

1.  **Start in Plan Mode (This Step):** Define the architecture and component plan.
2.  **Switch to Creative Mode.**
3.  **Database:** Execute the SQL query to create the `listing_inquiries` table and its RLS policy.
4.  **Backend Services:** Create/update the service files (`listingsService.ts`, `inquiryService.ts`) and `types.ts`.
5.  **Page & Layout:** Create the `src/pages/fahrzeug/[id].tsx` file and implement `getServerSideProps`. Build the main page layout using placeholder components.
6.  **Component Development:** Build each component one by one, starting with the simplest ones.
7.  **Styling & Interactivity:** Apply CSS, responsive design, and animations.
8.  **Final Integration:** Connect the inquiry form, and ensure all data flows correctly.
9.  **Review:** Check against acceptance tests.

This plan establishes a clear path forward. I'm ready to move to **Creative Mode** to begin implementation when you are.
