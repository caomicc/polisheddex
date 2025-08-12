import type { NextConfig } from 'next';

import bundleAnalyzer from '@next/bundle-analyzer';

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

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
        source: '/items/duskball',
        destination: '/items/dusk',
        permanent: true,
      },
      {
        source: '/items/pokeball',
        destination: '/items/poke',
        permanent: true,
      },
      {
        source: '/items/ultraball',
        destination: '/items/ultra',
        permanent: true,
      },
      {
        source: '/items/greatball',
        destination: '/items/great',
        permanent: true,
      },
      {
        source: '/items/masterball',
        destination: '/items/master',
        permanent: true,
      },
      {
        source: '/items/safariball',
        destination: '/items/safari',
        permanent: true,
      },
      {
        source: '/items/netball',
        destination: '/items/net',
        permanent: true,
      },
      {
        source: '/items/moonball',
        destination: '/items/moon',
        permanent: true,
      },
      {
        source: '/items/lureball',
        destination: '/items/lure',
        permanent: true,
      },
      {
        source: '/items/levelball',
        destination: '/items/level',
        permanent: true,
      },
      {
        source: '/items/fastball',
        destination: '/items/fast',
        permanent: true,
      },
      {
        source: '/items/cherishball',
        destination: '/items/cherish',
        permanent: true,
      },
      {
        source: '/items/premierball',
        destination: '/items/premier',
        permanent: true,
      },
      {
        source: '/items/luxuryball',
        destination: '/items/luxury',
        permanent: true,
      },
      {
        source: '/items/friendball',
        destination: '/items/friend',
        permanent: true,
      },
      {
        source: '/items/loveball',
        destination: '/items/love',
        permanent: true,
      },
      {
        source: '/items/repeatball',
        destination: '/items/repeat',
        permanent: true,
      },
      {
        source: '/items/timerball',
        destination: '/items/timer',
        permanent: true,
      },
      {
        source: '/items/diveball',
        destination: '/items/dive',
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
      {
        source: '/moves/psychic-m',
        destination: '/moves/psychic',
        permanent: true,
      },
      {
        source: '/locations/route_16_south_gate',
        destination: '/locations/route_16_south',
        permanent: true,
      },
      {
        source: '/locations/battle_tower',
        destination: '/locations/battle_tower_outside',
        permanent: true,
      },
      {
        source: '/locations/scary_cave',
        destination: '/locations/scary_cave_1f',
        permanent: true,
      },
      {
        source: '/locations/goldenrod',
        destination: '/locations/goldenrod_city',
        permanent: true,
      },
      {
        source: '/locations/celadon',
        destination: '/locations/celadon_city',
        permanent: true,
      },
      {
        source: '/locations/route_35-natioal_park_gate',
        destination: '/locations/route_35_coast_north',
        permanent: true,
      },
      {
        source: '/locations/mahogany_mart',
        destination: '/locations/mahogany_town',
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

export default withBundleAnalyzer(nextConfig);
