# Deployment Timestamp Feature

## Overview

The Footer component displays a "Last updated" timestamp showing when the site was last deployed. This is implemented using two fallback approaches:

## Implementation

### 1. Vercel Environment Variables (Primary)
- Uses `VERCEL_GIT_COMMIT_DATE` environment variable
- Automatically available in Vercel deployments
- Shows the Git commit date

### 2. Build-time Generated File (Fallback)
- Generates `public/build-info.json` during build
- Contains build date and Git information
- Used via `useBuildInfo` hook

## Configuration

### Next.js Config
The `next.config.ts` exposes Vercel environment variables:

```typescript
env: {
  NEXT_PUBLIC_VERCEL_GIT_COMMIT_DATE: process.env.VERCEL_GIT_COMMIT_DATE,
  NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA: process.env.VERCEL_GIT_COMMIT_SHA,
}
```

### Build Script
The build process includes generating build info:

```json
{
  "scripts": {
    "build": "node scripts/generate-build-info.mjs && next build"
  }
}
```

## Files

- `src/components/ui/Footer.tsx` - Main component with timestamp display
- `src/hooks/useBuildInfo.ts` - Hook to fetch build information
- `scripts/generate-build-info.mjs` - Script to generate build metadata
- `public/build-info.json` - Generated file with build information

## Development

When running locally, the timestamp will show "Unknown" unless you manually run the build info script:

```bash
node scripts/generate-build-info.mjs
```

On Vercel, the timestamp will automatically show the deployment date.
