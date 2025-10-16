# Homepage Redesign & SEO Enhancement Plan

This document outlines the strategy for redesigning the BuyAuto.ch homepage to be more sleek, user-friendly, and optimized for search engines, as per the user's request.

## 1. Project Goals

- **Design:** Modernize the homepage with a sleeker hero section, anchored search bar, and prominent Unique Selling Propositions (USPs), while maintaining the brand's color scheme.
- **User Experience:** Improve mobile-friendliness and overall UX.
- **Performance:** Ensure fast load times, primarily through image optimization.
- **SEO:** Enhance on-page SEO with updated meta tags and a dedicated SEO content block.
- **Integrity:** Do not alter the "Premium Inserate" section.

## 2. File Modification & Creation Strategy

The following files will be modified or created:

- **Modified:**
  - `src/pages/index.tsx`: To integrate new components and add `next/head` for SEO tags.
  - `src/components/buyauto/HeroSection.tsx`: To restructure the layout, anchor the search form, and reduce height.
  - `src/pages/_app.tsx`: To add the canonical link globally or on the homepage.
- **Created:**
  - `src/components/buyauto/UspBar.tsx`: A new component to display trust-building USPs.
  - `src/components/buyauto/SeoCopyBlock.tsx`: A new component for the "Über BuyAuto.ch" SEO text.

## 3. Phased Implementation Plan

### Phase 1: Core SEO Enhancements

1.  **Update Head Tags (`src/pages/index.tsx`):**
    -   Use `next/head` to implement the new SEO metadata.
    -   **Title:** `<title>Auto Leasing Übernehmen oder Verkaufen in der Schweiz | BuyAuto.ch</title>`
    -   **Meta Description:** `<meta name="description" content="Finde dein nächstes Auto-Leasing oder verkaufe deines einfach und sicher. BuyAuto.ch ist die Plattform für Leasingübernahmen in der Schweiz – transparent, schnell und ohne Stress.">`
    -   **Canonical Tag:** A canonical link pointing to the root domain (`https://www.buyauto.ch/`) will be added to the homepage to prevent duplicate content issues.

2.  **Create SEO Copy Block (`src/components/buyauto/SeoCopyBlock.tsx`):**
    -   Create a new component to house the SEO-focused text.
    -   It will contain an `H2` heading: "Über BuyAuto.ch".
    -   It will include 400-600 words of well-written, keyword-rich German text covering the specified topics (leasing takeover, secure process, benefits).
    -   This component will be designed to be clean and readable, possibly in an expandable section if it feels too long for a static display.

3.  **Integrate SEO Block (`src/pages/index.tsx`):**
    -   Import and add the `SeoCopyBlock` component at the bottom of the homepage, just before the `Footer`.

### Phase 2: Design & Layout Redesign

1.  **Redesign Hero Section (`src/components/buyauto/HeroSection.tsx`):**
    -   **Reduce Height:** Change the `h-[70vh]` class to a smaller value (e.g., `h-[60vh]` or a fixed height like `min-h-[550px]`) to make it thinner.
    -   **Anchor Search Form:** Restructure the component's layout. The text content will be centered in the top portion of the hero, and the `SearchForm` component will be moved to the bottom, positioned to slightly overlap the end of the section for a modern, anchored look. This will be achieved using Flexbox and/or absolute positioning.
    -   **Mobile Responsiveness:** Ensure the new layout adapts seamlessly to mobile screens. The search form will stack neatly below the title on smaller devices.

2.  **Create USP Bar (`src/components/buyauto/UspBar.tsx`):**
    -   Create a new, simple component to display USPs.
    -   It will feature icons and short text for points like "✓ Swiss Data Hosting" and "✓ Sichere Bezahlung (Stripe)".
    -   This component will be styled to be sleek and will be placed directly below the redesigned hero section to build trust immediately.

3.  **Integrate USP Bar (`src/pages/index.tsx`):**
    -   Import and add the new `UspBar` component between the `HeroSection` and `PremiumListings` sections.

### Phase 3: Performance & Linking Audit

1.  **Image Performance:**
    -   The `PremiumListings` component already uses `next/image`, which provides automatic lazy loading. This is excellent.
    -   The hero section uses a CSS `background-image`. While this is standard, we will ensure the image is optimized for the web. We won't switch to `next/image` for the background as it adds complexity, but we will ensure the file size is reasonable.
    -   Any new images introduced will strictly use the `next/image` component.

2.  **Internal Link Audit:**
    -   A review of all major Call-to-Action (CTA) buttons on the homepage (e.g., in the Header, Footer, and new sections) will be conducted during implementation.
    -   We will ensure all links use the Next.js `<Link>` component, which renders a crawlable `<a>` tag.
    -   Links will point to the correct, existing routes, such as `/suche` for finding vehicles and `/inserat-erstellen` for creating a listing.

---

This plan provides a clear path forward. Once you approve, we can switch to **Creative Mode** to begin implementation.