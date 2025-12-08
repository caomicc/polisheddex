import type { NextConfig } from 'next';
import path from 'path';

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
  typescript: {
    ignoreBuildErrors: false,
  },
  // Turbopack configuration
  turbopack: {
    // Set root to current directory to prevent resolving symlinks outside project
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
