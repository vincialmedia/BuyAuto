# Leasingübernahme vs. Auto Abo Page Implementation Plan

## Goal
Create a new SEO-optimized landing page `/leasinguebernahme-vs-autoabo` that compares "Leasingübernahme" (Lease Transfer) with "Auto Abo" (Car Subscription). The page must strictly follow the design, layout, and component usage of the existing `/leasinguebernahme` page.

## Content & Structure

### 1. New Page: `src/pages/leasinguebernahme-vs-autoabo.tsx`
- **Design Reference:** `src/pages/leasinguebernahme.tsx`
- **Components:**
  - `HeroSection` (Custom implementation with background image)
  - `Table` (Custom CSS/Tailwind implementation for comparison)
  - `Accordion` (from `@/components/ui/accordion`)
  - `Card` (from `@/components/ui/card`)
  - `Button` (from `@/components/ui/button`)
  - `Lucide Icons` (Check, X, DollarSign, etc.)
- **SEO Metadata:**
  - **Title:** Leasingübernahme vs. Auto Abo – Was lohnt sich 2025 wirklich?
  - **Description:** Auto Abo oder Leasingübernahme? Wir vergleichen Kosten, Flexibilität, Vertragsbindung, Risiken und Vorteile. Finde heraus, welche Option 2025 in der Schweiz günstiger & sinnvoller ist.
  - **Canonical:** `https://www.buyauto.ch/leasinguebernahme-vs-autoabo`

### 2. Sections Breakdown
1. **Hero Section:** High-impact visual with H1, Subtitle, and dual CTAs.
2. **Overview (Section 1):** Text block explaining the trend and core difference.
3. **Comparison Table (Section 2):** Detailed table comparing 8 criteria.
4. **Advantages Leasingübernahme (Section 3):** Bullet points with green checks.
5. **Advantages Auto Abo (Section 4):** Bullet points with pros and cons.
6. **Cost Comparison (Section 5):** Concrete calculation examples (VW Golf & Tesla Model 3).
7. **Target Audience (Section 6):** "For whom is which option?"
8. **Risks (Section 7):** Comparison of risks.
9. **FAQ (Section 8):** Accordion with specific questions and internal links.
10. **Final CTA (Section 9):** Strong closing statement and button.

### 3. Integration Updates
- **Footer:** Add link to `src/components/buyauto/Footer.tsx` under "Ressourcen" or "Seiten".
- **Sitemap:** Add `/leasinguebernahme-vs-autoabo` to `src/pages/sitemap.xml.ts`.

## Execution Steps
1. Create `src/pages/leasinguebernahme-vs-autoabo.tsx`.
2. Update `src/components/buyauto/Footer.tsx`.
3. Update `src/pages/sitemap.xml.ts`.
4. Verify internal linking strategy (anchors like "Leasingübernahme", "Leasing übernehmen").