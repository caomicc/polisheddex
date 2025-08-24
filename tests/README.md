# Testing Setup for PolishedDex

This project uses **Playwright** for end-to-end testing to ensure the site works correctly before deployment.

## Available Test Commands

```bash
# Run all tests
npm run test:e2e

# Run quick production-ready tests only
npm run test:quick

# Run tests with UI (for debugging)
npm run test:e2e:ui

# Run tests with browser visible
npm run test:e2e:headed
```

## Test Files

- **`production-ready.spec.ts`** - Essential tests for deployment
- **`basic-functionality.spec.ts`** - Core site functionality tests
- **`pokemon-navigation.spec.ts`** - Navigation and routing tests
- **`pokemon-data-integrity.spec.ts`** - Data accuracy tests
- **`homepage.spec.ts`** - Homepage functionality tests

## What Gets Tested

✅ **Core Functionality**
- Homepage loads successfully
- Pokemon pages load and display correctly
- Navigation between pages works
- Data integrity (pokedex entries, stats, types)

✅ **Performance**  
- Pages load within reasonable time limits
- No crashes or unhandled errors

✅ **User Experience**
- Pokemon forms work correctly
- Search and navigation function properly
- Error states handle gracefully

## Before Deployment

Always run the quick test suite:

```bash
npm run test:quick
```

This ensures all critical functionality works before going live.

## Configuration

Tests are configured to:
- Start the dev server automatically
- Test against localhost:3000
- Run in headless mode by default
- Test in Chrome, Firefox, and Safari
- Generate HTML reports on failure

## Debugging Failed Tests

If tests fail:

1. Run with UI: `npm run test:e2e:ui`
2. Run with visible browser: `npm run test:e2e:headed`
3. Check the generated HTML report in `test-results/`
4. Look at screenshots in `test-results/` folder