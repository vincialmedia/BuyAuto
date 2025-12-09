# Sitemap Update Plan

## Objective
Update the sitemap configuration to ensure optimal SEO and Google Search Console compatibility by enforcing the `www` subdomain.

## Tasks

### 1. Update Base URL
**Current Status:** `https://buyauto.ch`
**Required Change:** Update to `https://www.buyauto.ch`
**Reasoning:** Google Search Console requires consistent domain usage. Using `www` ensures canonical URL consistency and prevents "Duplicate, Google chose different canonical than user" errors.

## Implementation Details
File: `src/pages/sitemap.xml.ts`

**Change:**
```typescript
// Define your base URL
const BASE_URL = 'https://buyauto.ch';
```

**To:**
```typescript
// Define your base URL
const BASE_URL = 'https://www.buyauto.ch';
```

### 2. Verify Static Pages
Current list in `src/pages/sitemap.xml.ts` appears correct:
- `''` (Home)
- `/suche`
- `/inserat-erstellen`
- `/leasinguebernahme`
- `/leasing-abgeben-schweiz`
- `/datenschutz`
- `/agb`
- `/impressum`
- `/auth`