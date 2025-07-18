import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
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
    // Exclude specific directories and files from being linted
    ignoreDuringBuilds: true,
  },
  // Optionally, you can also configure webpack to exclude these files from the build
  webpack: (config) => {
    // Exclude data extraction utilities from the build
    config.watchOptions = {
      ...config.watchOptions,
      ignored: ['**/src/utils/extractors/**', '**/extract_pokemon_data.ts'],
    };
    return config;
  },
};

export default nextConfig;
