/** @type {import('next').NextConfig} */
const nextConfig = {
  // Conditional output based on environment
  // Only use static export for production builds, not during development
  ...(process.env.NODE_ENV === 'production' && process.env.BUILD_EXPORT === 'true' ? {
    output: 'export',
    trailingSlash: true,
    skipTrailingSlashRedirect: true,
  } : {}),
  
  // Ignore ESLint errors during build
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Image optimization for shared hosting
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      }
    ],
  },
  
  // Environment variables
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  
  // Performance optimizations for shared hosting
  experimental: {
    optimizePackageImports: ['@heroicons/react', 'lucide-react'],
  },
  
  // Webpack configuration for bundle optimization
  webpack: (config, { dev, isServer }) => {
    if (!dev && !isServer) {
      // Production optimizations
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
          },
        },
      }
    }
    return config
  },
  
  // Headers for SEO and performance
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
      {
        source: '/sitemap.xml',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600, revalidate=86400',
          },
        ],
      },
      {
        source: '/rss.xml',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600, revalidate=86400',
          },
        ],
      },
    ]
  },
  
  // Redirects for SEO
  async redirects() {
    return [
      {
        source: '/blog',
        destination: '/',
        permanent: true,
      },
    ]
  },
  
  // Rewrites for clean URLs
  async rewrites() {
    return [
      {
        source: '/feed',
        destination: '/rss.xml',
      },
      {
        source: '/sitemap',
        destination: '/sitemap.xml',
      },
    ]
  },
}

module.exports = nextConfig