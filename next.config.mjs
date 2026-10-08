/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    // Serve responsive AVIF/WebP via the Next image optimizer. Supabase
    // originals can be multi-MB (variant generation has gaps), so optimizing
    // on delivery is the only path that guarantees small payloads everywhere.
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 2678400, // 31 days — listing images are immutable per URL
    remotePatterns: [
      { protocol: 'https', hostname: 'fgalkhfopecwsryracre.supabase.co' },
      { protocol: 'https', hostname: 'psdtkknwxzxnxnbqmdzl.supabase.co' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
  },
  // Retired pages. Every target is a live page that does not redirect itself,
  // so each old URL resolves in exactly one 308 hop.
  async redirects() {
    return [
      { source: '/auto-abos-im-vergleich', destination: '/leasinguebernahme-vs-autoabo', permanent: true },
      { source: '/carify-alternativen', destination: '/leasinguebernahme-vs-autoabo', permanent: true },
      { source: '/auto-abo-vs-leasing-kosten', destination: '/leasinguebernahme-vs-autoabo', permanent: true },
      { source: '/auto-abo-kuendigen', destination: '/leasinguebernahme-vs-autoabo', permanent: true },
      { source: '/leasinguebernahme-vs-neues-leasing', destination: '/leasinguebernahme', permanent: true },
      { source: '/leasing-transfer', destination: '/leasinguebernahme', permanent: true },
      { source: '/fuer-haendler', destination: '/eintauschwert-rechner', permanent: true },
      { source: '/fuer-haendler/marktwert-rechner', destination: '/eintauschwert-rechner', permanent: true },
    ];
  },
  async headers() {
    return [
      {
        // Static assets in /public are content-addressed by filename in
        // practice (new uploads get new names), so cache them hard.
        source: '/:file(.*\\.(?:png|jpg|jpeg|webp|avif|svg|ico))',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ];
  },
  allowedDevOrigins: ['*.daytona.work'],
};

export default nextConfig;
