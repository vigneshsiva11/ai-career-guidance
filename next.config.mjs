/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Keep dev entries alive longer to avoid intermittent _next/static 404s
  // after idle time and browser refresh on slower Windows environments.
  onDemandEntries: {
    maxInactiveAge: 1000 * 60 * 60 * 24, // 24 hours
    pagesBufferLength: 1000,
  },
}

export default nextConfig
