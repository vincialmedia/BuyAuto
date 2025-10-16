# Mobile Performance Optimization Plan

This document outlines the strategic plan to improve the mobile PageSpeed/Lighthouse performance score to 90+ for the BuyAuto project. All optimizations are targeted exclusively for mobile devices, ensuring the desktop experience remains unchanged.

## 1. Image Optimization (LCP &amp; CLS)

**Problem:** Large, unoptimized images are likely slowing down the Largest Contentful Paint (LCP) and causing Cumulative Layout Shift (CLS) on mobile devices.

**Strategy:** We will replace standard `<img>` tags with Next.js's `<Image>` component for all primary listing and hero images. This provides automatic responsive sizing, modern format conversion (WebP/AVIF), and lazy loading. We will also assign explicit `width`, `height`, and `priority` props to prevent layout shifts and prioritize critical above-the-fold images.

**Target Files &amp; Actions:**

*   **Homepage Hero Image:**
    *   **File:** `src/components/buyauto/HeroSection.tsx`
    *   **Action:** Modify the hero background image implementation to use `<Image>` with `priority={true}`, `fill={true}`, and `sizes="100vw"` to ensure it loads quickly and is optimized for mobile screens.

*   **Listing Card Images:**
    *   **Files:**
        *   `src/components/buyauto/search/ListingCard.tsx`
        *   `src/components/buyauto/search/VerticalListingCard.tsx`
        *   `src/components/buyauto/PremiumListings.tsx` (which uses a listing card component)
    *   **Action:** Convert the `<img>` tag to a `<Image>` component. Set fixed `width` and `height` props to match the design and prevent CLS. For the first few images visible on initial load (e.g., in `PremiumListings` and the first results on `suche.tsx`), we will add the `priority` prop.

*   **Vehicle Detail Page Gallery:**
    *   **File:** `src/components/buyauto/detail/ImageGallery.tsx`
    *   **Action:** Update the image gallery to use `<Image>`. The main, visible image will be given `priority={true}`. Thumbnails will be lazy-loaded.

## 2. JavaScript &amp; Component Loading (INP &amp; TBT)

**Problem:** A large initial JavaScript bundle increases Total Blocking Time (TBT) and negatively impacts the Interaction to Next Paint (INP), making the page feel sluggish on mobile.

**Strategy:** We will use `next/dynamic` to code-split and lazy-load components that are not critical for the initial mobile view. This includes modals, filter sidebars, and sections of the page that are below the fold.

**Target Files &amp; Actions:**

*   **Mobile Filter Sheet:**
    *   **File:** `src/components/buyauto/search/DynamicFilterBar.tsx`
    *   **Action:** The component rendered inside the mobile `<Sheet>` (likely the `FacetPanel` or similar) will be dynamically imported. It will only be loaded into the browser when the user clicks the "Filter" button.

*   **Detail Page Inquiry Form:**
    *   **File:** `src/pages/fahrzeug/[id].tsx`
    *   **Action:** The `InquiryForm` component will be dynamically imported. It can be loaded when it becomes visible in the viewport or when the user interacts with a CTA.

*   **Below-the-Fold Homepage Sections:**
    *   **File:** `src/pages/index.tsx`
    *   **Action:** Dynamically import sections that are not visible on the initial mobile screen load, such as `FAQSection` and `TrustSection`.

## 3. Font Optimization

**Problem:** Web fonts can block text rendering, causing a flash of invisible text (FOIT) and contributing to a poor user experience.

**Strategy:** We will migrate from the current CSS-based font loading to the `next/font` system. This modern approach automatically optimizes font delivery, self-hosts the fonts, and applies `font-display: swap` to ensure text is always visible during load.

**Target Files &amp; Actions:**

*   **Global Font Loading:**
    *   **File:** `src/pages/_app.tsx`
    *   **Action:**
        1.  Define local fonts using `next/font/local`, pointing to the font files in `src/pages/fonts/`.
        2.  Create a CSS variable for the font family.
        3.  Apply this variable to the global stylesheet or the main layout component to replace the existing `@font-face` declarations.
    *   **File:** `src/styles/globals.css`
    *   **Action:** Remove the old `@font-face` rules once `next/font` is implemented.

## 4. Resource Prioritization &amp; Delivery

**Problem:** The browser may not know which resources are critical for the initial mobile render, leading to inefficient loading sequences.

**Strategy:** We will provide hints to the browser using `preconnect` for critical third-party domains (like Supabase for images) and ensure that modern compression (Brotli/Gzip) is active via Vercel's default configuration.

**Target Files &amp; Actions:**

*   **Establish Early Connections:**
    *   **File:** `src/pages/_document.tsx`
    *   **Action:** Add a `<link rel="preconnect">` tag to the `<Head>` for the Supabase storage URL (`https://*.supabase.co`). This will speed up the connection handshake, DNS lookup, and SSL negotiation for image requests.

*   **Review Caching &amp; Compression:**
    *   **Action:** No code changes are needed here. We will rely on Vercel's built-in caching for static assets and Brotli compression, but we will verify the headers in the final review to ensure they are being applied correctly.
