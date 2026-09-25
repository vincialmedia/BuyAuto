/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Languages (mirrors src/i18n/config.ts). German is the default and keeps
  // every URL unprefixed exactly as before; fr/it/en live under /fr, /it, /en.
  // localeDetection MUST stay false: Next's default would redirect "/" by the
  // browser's Accept-Language, which Google explicitly advises against
  // (Googlebot crawls without that header) — visitors get a dismissible
  // language suggestion instead (LanguageSuggestion.tsx).
  i18n: {
    locales: ['de', 'fr', 'it', 'en'],
    defaultLocale: 'de',
    localeDetection: false,
  },
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
  // No redirect/header rule for /de/… here, on purpose: Next prefixes the
  // default locale internally BEFORE matching custom routes, so a
  // `/de/:path*` → `/:path*` redirect loops on every German page (and a
  // `/de/:path*` noindex header would hit every German page). Next also serves
  // German at /de/…, but nothing links there and every German page carries an
  // absolute canonical to its unprefixed URL, which consolidates any such
  // duplicate.
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
