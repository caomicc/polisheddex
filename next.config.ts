import type { NextConfig } from 'next';

const withBundleAnalyzer = require('@next/bundle-analyzer')({
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
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  async redirects() {
    return [
      {
        source: '/duskball',
        destination: '/dusk',
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
