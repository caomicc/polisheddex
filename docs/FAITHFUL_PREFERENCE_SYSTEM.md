# Faithful vs Polished Preference System

## Overview

The PolishedDex application now includes a site-wide preference system that allows users to toggle between "Faithful" and "Polished" (Updated) versions of Pokémon data. This preference is stored in a secure HTTP cookie and persists across browser sessions.

## Architecture

### Components

1. **FaithfulPreferenceContext** (`src/contexts/FaithfulPreferenceContext.tsx`)
   - React context that manages the faithful/polished preference state
   - Provides hooks for accessing and updating the preference
   - Automatically saves changes to cookies via API calls with client-side fallback
   - Reads initial state from client-side cookies when no server value provided

2. **API Route** (`src/app/api/faithful-preference/route.ts`)
   - Handles GET and POST requests for reading/writing the preference cookie
   - Sets secure, HTTP-only cookies with appropriate expiration (1 year)
   - Uses Next.js cookies API for server-side cookie management

3. **Server Helper** (`src/lib/faithful-preference.ts`)
   - Utility function to read the preference from cookies on the server side
   - Used in specific pages/components that need server-side initialization
   - Makes routes dynamic when used

4. **Client Helper** (`src/lib/client-faithful-preference.ts`)
   - Client-side utilities for reading and writing cookies
   - Used as fallback when API is not available
   - Provides direct cookie manipulation capabilities

5. **Server Provider** (`src/components/providers/server-faithful-preference-provider.tsx`)
   - Optional server component wrapper for pages that need server-side cookie reading
   - Makes the route dynamic but ensures correct initial state
   - Use only when specifically needed

### Usage

#### In Components

```tsx
import { useFaithfulPreference } from '@/contexts/FaithfulPreferenceContext';

function MyComponent() {
  const { showFaithful, toggleFaithful, setFaithful } = useFaithfulPreference();
  
  return (
    <Switch
      checked={showFaithful}
      onCheckedChange={toggleFaithful}
      aria-label="Toggle between faithful and updated Pokémon types"
    />
  );
}
```

#### In Server Components

```tsx
import { getFaithfulPreference } from '@/lib/faithful-preference';

export default async function ServerComponent() {
  const initialFaithfulPreference = await getFaithfulPreference();
  
  return (
    <FaithfulPreferenceProvider initialValue={initialFaithfulPreference}>
      {/* Your app content */}
    </FaithfulPreferenceProvider>
  );
}
```

## Implementation Details

### Cookie Configuration

- **Name**: `faithful-preference`
- **Values**: `'true'` (faithful mode) or `'false'` (polished mode)
- **Max Age**: 1 year (365 days)
- **Security**: 
  - `httpOnly: false` (allows client-side access if needed)
  - `secure: true` (production only, HTTPS required)
  - `sameSite: 'strict'` (CSRF protection)
  - `path: '/'` (available site-wide)

### State Management Flow

1. **Initial Load**: 
   - Server reads cookie value using `getFaithfulPreference()`
   - Value is passed to `FaithfulPreferenceProvider` as `initialValue`
   - Context initializes with server-provided value

2. **User Interaction**:
   - User toggles switch in UI
   - Context updates local state immediately (for responsive UI)
   - Context makes POST request to `/api/faithful-preference` to save to cookie
   - Cookie is updated server-side with new preference

3. **Subsequent Visits**:
   - Server reads existing cookie value
   - User's preference is restored automatically

### Components Using the Preference

1. **Navigation** (`src/components/ui/Navigation.tsx`)
   - Main site navigation switch
   - Available on every page

2. **PokemonFormClient** (`src/components/pokemon/PokemonFormClient.tsx`)
   - Pokémon detail page move toggle
   - Controls display of faithful vs updated movesets

3. **PokemonSearch** (`src/components/pokemon/PokemonSearch.tsx`)
   - Pokémon listing page filter
   - Controls display of faithful vs updated types in search and cards

## Data Differences

The faithful vs polished preference affects various aspects of Pokémon data:

### Types
- **Faithful**: Original Pokémon types from the base game
- **Polished**: Updated types with balance changes and new type combinations

### Moves
- **Faithful**: Original movesets and move data
- **Polished**: Updated movesets with balance changes, new moves, and improved distributions

### Abilities  
- **Faithful**: Original abilities from the base game
- **Polished**: Updated abilities with balance changes and new ability distributions

### Stats
- **Faithful**: Original base stats
- **Polished**: Rebalanced stats for improved game balance

## Benefits

1. **User Control**: Users can choose their preferred data version
2. **Site-wide Consistency**: Preference applies across all pages and components
3. **Persistent**: Preference survives browser sessions and page refreshes
4. **Secure**: Uses HTTP-only cookies with appropriate security settings
5. **Performance**: Minimal overhead with context-based state management
6. **Accessible**: Proper ARIA labels and semantic HTML for screen readers

## Future Enhancements

- Add preference for other data aspects (items, locations, trainer teams)
- Implement user accounts with profile-based preferences
- Add visual indicators showing which data version is currently displayed
- Provide detailed comparisons between faithful and polished versions
