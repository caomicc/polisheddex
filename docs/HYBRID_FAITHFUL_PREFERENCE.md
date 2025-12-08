# Hybrid Faithful Preference System

This document explains how the hybrid faithful preference system works for returning users.

## How It Works

### Priority Order:
1. **URL Parameter** (`?version=faithful`) - Highest priority
2. **Cookie** (`faithful-preference=true`) - Fallback for returning users  
3. **Default** (`polished`) - When no preference is set

### User Experience Flow:

#### New User:
1. Visits site → Gets `polished` by default
2. Toggles to faithful → URL becomes `?version=faithful` + cookie is set
3. Navigation works instantly, no refresh needed

#### Returning User:
1. Visits site without URL param → Cookie is checked
2. If cookie shows `faithful` preference → URL automatically updates to `?version=faithful`
3. Data loads with correct version immediately

#### Shared URLs:
1. User shares `example.com/pokemon/bulbasaur?version=faithful`
2. Anyone clicking link gets faithful version, regardless of their cookie
3. URL parameter always takes precedence over cookie

## Implementation

### Client Components:
```tsx
import { useFaithfulPreferenceUrl } from '@/hooks/useFaithfulPreferenceUrl';

function MyComponent() {
  const { showFaithful, toggleFaithful, isLoading } = useFaithfulPreferenceUrl();
  
  if (isLoading) {
    return <div>Loading preference...</div>;
  }
  
  return (
    <div>
      Current version: {showFaithful ? 'Faithful' : 'Polished'}
      <button onClick={toggleFaithful}>Toggle</button>
    </div>
  );
}
```

### Server Components:
```tsx
import { getVersionFromSearchParams } from '@/utils/version-utils';
import { cookies } from 'next/headers';

export default async function ServerPage({ 
  searchParams 
}: { 
  searchParams: Promise<Record<string, string | string[]>>
}) {
  const params = await searchParams;
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();
  
  const version = getVersionFromSearchParams(params, cookieHeader);
  
  // Load data based on version
  const data = await loadData(version);
  
  return <div>Data for {version} version</div>;
}
```

## Benefits

✅ **Instant Updates**: No page refresh needed when toggling
✅ **User Memory**: Returning users get their preferred version 
✅ **URL Sharing**: Shared URLs work correctly for everyone
✅ **SEO Friendly**: Search engines can index both versions
✅ **No Hydration Issues**: Server and client always in sync
✅ **Graceful Fallbacks**: Works even if cookies are disabled

## Migration from Cookie-Only System

Existing users with cookies will automatically get their preference applied to the URL on their next visit, creating a seamless transition.