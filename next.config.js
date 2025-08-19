/** @type {import('next').NextConfig} */
const nextConfig = {
  // Standard Next.js configuration for server-side hosting
  trailingSlash: true,
  
  // Disable image optimization for better performance
  images: {
    unoptimized: true,
  },
}

module.exports = nextConfig
