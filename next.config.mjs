/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    // Supabase pre-generates _thumbnail/_medium/_large WebP variants on upload
    // and serves them via Cloudflare's CDN, so we don't need Vercel's optimizer.
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  allowedDevOrigins: ['*.daytona.work'],
};

export default nextConfig;
