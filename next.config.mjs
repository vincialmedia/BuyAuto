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
