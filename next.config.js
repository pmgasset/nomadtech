// /var/www/nomadnet-ecommerce/next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  
  // Image optimization settings
  images: {
    domains: [
      'localhost',
      'nomadnet.com',
      'www.nomadnet.com',
      'via.placeholder.com'
    ],
    formats: ['image/webp', 'image/avif'],
  },

  // Environment variables available to the client
  env: {
    CUSTOM_KEY: 'my-value',
  },

  // Redirects for SEO and user experience
  async redirects() {
    return [
      {
        source: '/shop',
        destination: '/products',
        permanent: true,
      },
      {
        source: '/store',
        destination: '/products',
        permanent: true,
      },
    ];
  },

  // Headers for security and caching
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, max-age=0',
          },
        ],
      },
    ];
  },

  // Webpack configuration for build optimization
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Add any custom webpack configuration here
    
    // Optimize bundle size
    if (!dev && !isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        '@': __dirname,
      };
    }

    return config;
  },

  // Experimental features
  experimental: {
    // Enable app directory (if using App Router)
    // appDir: true,
    
    // Server Components
    serverComponentsExternalPackages: ['stripe'],
  },

  // Output configuration for deployment
  output: 'standalone',

  // Compiler options
  compiler: {
    // Remove console.log in production
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // Enable powered by header
  poweredByHeader: false,

  // Compression
  compress: true,

  // Generate etags for caching
  generateEtags: true,

  // Page extensions
  pageExtensions: ['ts', 'tsx', 'js', 'jsx'],
};

module.exports = nextConfig;