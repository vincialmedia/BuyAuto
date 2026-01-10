import { GetServerSideProps } from 'next';
import { supabase } from '@/integrations/supabase/client';

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  // Fetch dynamic slugs from Supabase
  const { data: listings } = await supabase
    .from('listings')
    .select('id, make, model')
    .eq('status', 'active');

  // Define static pages
  const staticPages = [
    '',
    '/suche',
    '/inserat-erstellen',
    '/leasinguebernahme',
    '/leasinguebernahme-kosten',
    '/leasingvertrag-uebertragen',
    '/leasinguebernahme-vs-neues-leasing',
    '/leasinguebernahme-vs-autoabo',
    '/auto-abo-kuendigen',
    '/auto-abo-vs-leasing-kosten',
    '/leasing-abgeben-schweiz',
    '/autoscout24-alternative-leasinguebernahme',
    '/carify-alternativen', // Keeping this for reference, but it will 301 to the new page
    '/auto-abos-im-vergleich', // NEW PAGE ADDED
    '/datenschutz',
    '/agb',
  ];

  // Build the XML
  const baseUrl = 'https://www.buyauto.ch';
  
  const staticUrls = staticPages
    .map((page) => {
      return `
      <url>
        <loc>${baseUrl}${page}</loc>
        <lastmod>${new Date().toISOString()}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>${page === '' ? '1.0' : '0.8'}</priority>
      </url>
    `;
    })
    .join('');

  const dynamicUrls = (listings || [])
    .map((listing) => {
      return `
      <url>
        <loc>${baseUrl}/fahrzeug/${listing.id}</loc>
        <lastmod>${new Date().toISOString()}</lastmod>
        <changefreq>daily</changefreq>
        <priority>0.9</priority>
      </url>
    `;
    })
    .join('');

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      ${staticUrls}
      ${dynamicUrls}
    </urlset>
  `;

  // Set header to XML
  res.setHeader('Content-Type', 'text/xml');
  // Send the XML to the browser
  res.write(sitemap);
  res.end();

  return {
    props: {},
  };
};