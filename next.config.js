/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remove static export for Vercel deployment
  // output: 'export',
  // trailingSlash: true,
  images: {
    unoptimized: true,
  },
}

module.exports = nextConfig
