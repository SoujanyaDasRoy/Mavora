/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === 'production'

const nextConfig = {
  // Apply static export only for production builds (e.g. Cloudflare Pages / GitHub Pages).
  // In development, run as a normal SSR server so unknown routes get a proper 404
  // instead of the "missing param in generateStaticParams" runtime crash.
  ...(isProd ? { output: 'export' } : {}),
  images: { unoptimized: true },
  trailingSlash: true,
}

module.exports = nextConfig
