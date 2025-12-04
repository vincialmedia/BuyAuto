# Sitemap Update Plan

## Issue
The sitemap generator at `src/pages/sitemap.xml.ts` relies on a hardcoded list of static URLs. It does not automatically scan the file system for new pages.

## Identified Missing Page
- `src/pages/leasing-abgeben-schweiz.tsx` → URL: `/leasing-abgeben-schweiz`

## Solution
We need to manually add the new URL entry to the `generateSiteMap` function in `src/pages/sitemap.xml.ts`.

### Code to Add
```xml
  <url>
    <loc>${baseUrl}/leasing-abgeben-schweiz</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
```

## Steps to Implement
1. Open `src/pages/sitemap.xml.ts`
2. Locate the `<!-- Static Pages -->` section
3. Insert the XML block for the new page
4. Save and deploy