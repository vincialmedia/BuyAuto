# Homepage Redesign Implementation Plan

This document outlines the strategic plan for redesigning the BuyAuto.ch homepage based on the provided requirements.

## 1. Project Goals &amp; Constraints
- **Primary Goal:** Redesign the homepage to improve trust, modern aesthetics, SEO, performance, and accessibility.
- **Key Constraint:** The search bar must be visually integrated *into* the hero section, not below it.
- **Strict Rules:** No changes to image paths/names, listing card markup, or featured listing logic.

## 2. Recommended Mode: Creative Mode
**Creative Mode** is the ideal choice for this project. The scope involves creating multiple new components and a complete structural overhaul of the homepage, which is exactly what Creative Mode is designed for.

## 3. Implementation Phases

### Phase 1: Foundational Component Development
This phase focuses on creating all new sections as independent, modular components housed in a new `src/components/buyauto/homepage/` directory.

- **New Components to be Created:**
    1.  **`NewHeroSection.tsx`**: Will contain the H1, subline, CTAs, and trust icons. It will wrap the existing `SearchForm.tsx` to achieve the "docked" search bar effect.
    2.  **`WhyBuyAutoSection.tsx`**: A four-card grid (4x1 desktop, 2x2 mobile) for key benefits.
    3.  **`HowItWorksRedesignedSection.tsx`**: A three-step visual guide.
    4.  **`TestimonialsSection.tsx`**: A simple section for static customer quotes.
    5.  **`CtaBannerSection.tsx`**: A full-width, high-contrast banner to drive listing creations.
    6.  **`SeoCopySection.tsx`**: An expandable text block at the bottom with SEO-rich content.
    7.  **`MobileCta.tsx`**: A sticky CTA button ("Inserat erstellen") that is only visible on mobile viewports.

### Phase 2: Homepage Assembly &amp; SEO Implementation
This phase involves rewriting `src/pages/index.tsx` to use the new components and implement all SEO requirements.

- **Actions on `src/pages/index.tsx`:**
    1.  **Update `<Head>`:**
        - New `<title>`: `Auto Leasing Übernehmen oder Transferieren in der Schweiz | BuyAuto.ch`.
        - New `<meta name="description">`.
        - Add a canonical `<link>` tag.
        - Inject `Organization` and `BreadcrumbList` JSON-LD schema markup.
    2.  **Rebuild Page Structure:**
        - Replace the old component layout with the new components from Phase 1.
        - Reuse the existing `PremiumListings.tsx` component, adding the new H2 ("Top Leasingangebote in der Schweiz").
        - The final component order will be: `NewHeroSection`, `PremiumListings`, `WhyBuyAutoSection`, `HowItWorksRedesignedSection`, `TestimonialsSection`, `CtaBannerSection`, `SeoCopySection`, and `MobileCta`.

### Phase 3: Final Polish, Responsiveness, and Performance
This final phase is dedicated to refining the design and ensuring it meets all technical and accessibility goals.

- **Styling &amp; Animation:**
    - Apply a consistent design system via Tailwind CSS.
    - Add subtle, performant animations that respect `prefers-reduced-motion`.
- **Responsiveness:**
    - Test thoroughly across all target breakpoints (360px, 390px, 430px, 768px, 1024px, 1440px).
    - Ensure the docked search bar adapts gracefully on mobile devices.
- **Performance (Core Web Vitals):**
    - Apply `loading="lazy"` to all below-the-fold images.
    - Set explicit `width` and `height` on images to prevent CLS.
    - Optimize the hero section for a fast LCP (< 2.5s).
- **Accessibility:**
    - Use semantic HTML (`<main>`, `<section>`, etc.).
    - Ensure all interactive elements are keyboard-accessible with visible focus states.
    - Verify color contrast ratios meet WCAG AA standards.

## 4. Acceptance Criteria Checklist
- [ ] Listing cards and Featured logic are unchanged.
- [ ] All image filenames and paths are preserved.
- [ ] The search bar is visually integrated at the bottom of the hero section.
- [ ] The design is fully responsive and mobile-first.
- [ ] All specified SEO and schema tags are implemented.
- [ ] Core Web Vitals are optimized, targeting Lighthouse scores of ≥90 for Desktop and ≥80 (Perf) / ≥90 (Others) for Mobile.