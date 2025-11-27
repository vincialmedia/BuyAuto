# SEO & Sitemap Implementation Plan

## Overview
This plan addresses the missing `sitemap.xml` and `robots.txt` files, which are critical for search engine indexing. Since BuyAuto is a listing site, we need a dynamic sitemap that updates as new car listings are added.

## 1. Technology Strategy
We will use a server-side script to generate the sitemap dynamically because:
- Next.js Pages Router allows for API routes or server-side props to generate XML.
- We need to fetch all active car listings from Supabase to include their URLs.
- This ensures Google always sees the latest available cars.

## 2. Implementation Steps

### Phase 1: Sitemap Generation Script (`src/pages/sitemap.xml.ts`)
We will create a dynamic page that renders XML instead of HTML.
- **Fetch Static Pages**: Hardcode core paths:
  - `/` (Homepage)
  - `/suche` (Search)
  - `/leasinguebernahme` (How it works/Landing)
  - `/inserat-erstellen` (Create Listing)
  - `/auth` (Login/Register)
- **Fetch Dynamic Pages**: Query Supabase for all `active` listings.
  - Table: `listings`
  - Filter: `status = 'active'`
  - Fields: `id`, `updated_at`
- **Generate XML**: Format as standard Sitemap Protocol v0.9.
  - URL format: `https://buyauto.ch/fahrzeug/[id]`
  - `lastmod`: Use the listing's `updated_at` date.
  - `changefreq`: 'daily' for listings, 'weekly' for static pages.
  - `priority`: 1.0 for home, 0.8 for listings.

### Phase 2: Robots.txt (`public/robots.txt`)
Create a static file in `public/` to guide crawlers.
- **Allow**: `/`
- **Disallow**: Private/Admin routes like `/dashboard/*`, `/admin/*`, `/api/*`.
- **Sitemap**: Point to the new sitemap URL.

### Phase 3: Metadata & Verification
- Ensure the base URL is correctly configured for production vs. localhost.
- Add `<meta name="google-site-verification" content="..." />` placeholder in `_document.tsx` or `_app.tsx` (user will need to provide the code later).

## 3. Code Structure (Preview)

**`src/pages/sitemap.xml.ts`**
```typescript
import { GetServerSideProps } from 'next';
import { supabase } from '@/integrations/supabase/client'; // Note: Needs server-side client or fetch

const EXTERNAL_DATA_URL = 'https://buyauto.ch';

function generateSiteMap(listings: any[]) {
  return `<?xml version="1.0" encoding="UTF-8"?>
   <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
     <!-- Static Pages -->
     <url>
       <loc>${EXTERNAL_DATA_URL}</loc>
       <changefreq>daily</changefreq>
       <priority>1.0</priority>
     </url>
     <url>
       <loc>${EXTERNAL_DATA_URL}/suche</loc>
       <changefreq>daily</changefreq>
       <priority>0.9</priority>
     </url>
     <!-- Dynamic Listings -->
     ${listings
       .map(({ id, updated_at }) => {
         return `
       <url>
           <loc>${EXTERNAL_DATA_URL}/fahrzeug/${id}</loc>
           <lastmod>${new Date(updated_at).toISOString()}</lastmod>
           <changefreq>daily</changefreq>
           <priority>0.8</priority>
       </url>
     `;
       })
       .join('')}
   </urlset>
 `;
}

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  // Fetch active listings from Supabase
  const { data: listings } = await supabase
    .from('listings')
    .select('id, updated_at')
    .eq('status', 'active');

  const sitemap = generateSiteMap(listings || []);

  res.setHeader('Content-Type', 'text/xml');
  res.write(sitemap);
  res.end();

  return {
    props: {},
  };
}

export default function SiteMap() {}
```

**`public/robots.txt`**
```text
User-agent: *
Allow: /

# Disallow private areas
Disallow: /dashboard/
Disallow: /admin/
Disallow: /api/
Disallow: /auth

# Sitemap location
Sitemap: https://buyauto.ch/sitemap.xml
```

## 4. Next Steps for User
1. Switch to **Creative Mode** to implement these files.
2. Once deployed, submit `https://buyauto.ch/sitemap.xml` to Google Search Console.
