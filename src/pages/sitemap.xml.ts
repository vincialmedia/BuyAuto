import { GetServerSideProps } from 'next';
import { supabase } from '@/integrations/supabase/client';

// Define your base URL
const BASE_URL = 'https://buyauto.ch';

// Define static pages
const STATIC_PAGES = [
  '',
  '/suche',
  '/inserat-erstellen',
  '/leasinguebernahme',
  '/leasing-abgeben-schweiz',
  '/datenschutz',
  '/agb',
  '/impressum',
  '/auth',
];

function generateSiteMap(listings: any[]) {
  return `<?xml version="1.0" encoding="UTF-8"?>
   <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
     <!-- Static Pages -->
     ${STATIC_PAGES
       .map((url) => {
         return `
       <url>
           <loc>${BASE_URL}${url}</loc>
           <changefreq>daily</changefreq>
           <priority>0.7</priority>
       </url>
     `;
       })
       .join('')}
       
     <!-- Dynamic Listing Pages -->
     ${listings
       .map(({ id, updated_at }) => {
         return `
       <url>
           <loc>${BASE_URL}/fahrzeug/${id}</loc>
           <lastmod>${new Date(updated_at).toISOString()}</lastmod>
           <changefreq>daily</changefreq>
           <priority>0.9</priority>
       </url>
     `;
       })
       .join('')}
   </urlset>
 `;
}

export default function SiteMap() {
  // getServerSideProps will do the heavy lifting
}

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  // We make an API call to gather the URLs for our site
  const { data: listings } = await supabase
    .from('listings')
    .select('id, updated_at')
    .eq('status', 'active'); // Only include active listings

  const sitemap = generateSiteMap(listings || []);

  res.setHeader('Content-Type', 'text/xml');
  // we send the XML to the browser
  res.write(sitemap);
  res.end();

  return {
    props: {},
  };
};