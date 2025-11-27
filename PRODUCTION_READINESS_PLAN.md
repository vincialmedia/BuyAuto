# Production Readiness Plan

This plan covers critical missing features required for a professional, compliant, and SEO-friendly launch of BuyAuto.

## 1. SEO Infrastructure (Priority: High)
**Status**: Missing
**Goal**: ensure Google can find and index your vehicle listings.

### A. Dynamic Sitemap (`src/pages/sitemap.xml.ts`)
- **What**: A script that generates an XML map of all your pages.
- **Why**: Google needs to know about every single car listing page (`/fahrzeug/[id]`).
- **Implementation**:
  - Create server-side page `src/pages/sitemap.xml.ts`.
  - Fetch all `active` listings from Supabase.
  - Output XML with `lastmod` dates.

### B. Robots.txt (`public/robots.txt`)
- **What**: Instructions for search engine crawlers.
- **Why**: To tell Google NOT to index your admin dashboard or API routes.
- **Content**:
  ```text
  User-agent: *
  Allow: /
  Disallow: /admin/
  Disallow: /dashboard/
  Disallow: /api/
  Sitemap: https://buyauto.ch/sitemap.xml
  ```

### C. Canonical URLs
- **What**: A meta tag telling Google which URL is the "original" one.
- **Why**: Prevents penalties if your site is accessed via `www.buyauto.ch` vs `buyauto.ch`.
- **Fix**: Update `SeoHead.tsx` and `StructuredData.tsx` to include `<link rel="canonical" href="..." />`.

## 2. Analytics & Tracking (Priority: High)
**Status**: Missing
**Goal**: Understand user behavior.

### A. Google Analytics 4 (GA4)
- **Implementation**:
  - Add `Script` component in `src/pages/_app.tsx` or `_document.tsx`.
  - Requires a GA4 Measurement ID (e.g., `G-XXXXXXXXXX`) from the user.

## 3. Legal & Compliance (Priority: Critical)
**Status**: Missing
**Goal**: Avoid fines and legal issues in Switzerland/EU.

### A. Cookie Consent Banner
- **What**: A popup asking users to accept cookies.
- **Why**: Required by DSGVO/GDPR.
- **Implementation**:
  - Create `src/components/ui/CookieConsent.tsx`.
  - Simple banner: "We use cookies..." [Accept] [Decline].
  - Only load Analytics scripts AFTER consent is given.

## 4. Error Monitoring (Priority: Medium)
**Status**: Basic (React Error Boundary exists)
**Goal**: Know when users crash without them telling you.

- **Recommendation**: Sentry is the industry standard.
- **Action**: Since `react-error-boundary` is installed, ensure it wraps the main app in `_app.tsx` with a proper fallback UI.

## 5. Implementation Strategy

1.  **Step 1**: Implement Sitemap & Robots.txt (Creative Mode).
2.  **Step 2**: Add Canonical Tags to SEO components (Creative Mode).
3.  **Step 3**: Build Cookie Consent Banner (Creative Mode).
4.  **Step 4**: User provides GA4 ID -> Add Analytics script.
