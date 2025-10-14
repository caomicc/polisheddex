import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  env: {
    NEXT_PUBLIC_VERCEL_GIT_COMMIT_DATE: process.env.VERCEL_GIT_COMMIT_DATE,
    NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA: process.env.VERCEL_GIT_COMMIT_SHA,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'raw.githubusercontent.com',
        pathname: '/**',
      },
    ],
    // Optimize image loading
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  // Build performance optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  experimental: {
    optimizeServerReact: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  async headers() {
    return [
      {
        source: '/output/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400',
          },
        ],
      },
      {
        source: '/pokemon.json',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400',
          },
        ],
      },
    ];
  },
  async redirects() {
    return [
      {
        source: '/items/dusk',
        destination: '/items/duskball',
        permanent: true,
      },
      {
        source: '/items/poke',
        destination: '/items/pokeball',
        permanent: true,
      },
      {
        source: '/items/ultra',
        destination: '/items/ultraball',
        permanent: true,
      },
      {
        source: '/items/great',
        destination: '/items/greatball',
        permanent: true,
      },
      {
        source: '/items/master',
        destination: '/items/masterball',
        permanent: true,
      },
      {
        source: '/items/safari',
        destination: '/items/safariball',
        permanent: true,
      },
      {
        source: '/items/net',
        destination: '/items/netball',
        permanent: true,
      },
      {
        source: '/items/moon',
        destination: '/items/moonball',
        permanent: true,
      },
      {
        source: '/items/lure',
        destination: '/items/lureball',
        permanent: true,
      },
      {
        source: '/items/level',
        destination: '/items/levelball',
        permanent: true,
      },
      {
        source: '/items/fast',
        destination: '/items/fastball',
        permanent: true,
      },
      {
        source: '/items/cherish',
        destination: '/items/cherishball',
        permanent: true,
      },
      {
        source: '/items/premier',
        destination: '/items/premierball',
        permanent: true,
      },
      {
        source: '/items/luxury',
        destination: '/items/luxuryball',
        permanent: true,
      },
      {
        source: '/items/friend',
        destination: '/items/friendball',
        permanent: true,
      },
      {
        source: '/items/love',
        destination: '/items/loveball',
        permanent: true,
      },
      {
        source: '/items/repeat',
        destination: '/items/repeatball',
        permanent: true,
      },
      {
        source: '/items/timer',
        destination: '/items/timerball',
        permanent: true,
      },
      {
        source: '/items/dive',
        destination: '/items/diveball',
        permanent: true,
      },
      {
        source: '/wiki',
        destination: 'https://github.com/Rangi42/polishedcrystal/wiki',
        permanent: false,
      },
      {
        source: '/wiki/faq',
        destination: '/faq',
        permanent: true,
      },
    ];
  },
  webpack: (config) => {
    config.watchOptions = {
      ...config.watchOptions,
      ignored: ['**/src/utils/extractors/**', '**/extract_pokemon_data.ts'],
    };
    return config;
  },
};

export default nextConfig;
