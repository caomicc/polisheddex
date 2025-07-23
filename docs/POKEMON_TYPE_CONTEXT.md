# Pokemon Type Context

This context provides a way to dynamically theme the navigation, hero section, and other components based on the currently viewed Pokemon's type(s).

## How it works

1. **PokemonTypeProvider**: Wraps the entire app and manages the current Pokemon type state
2. **PokemonTypeSetter**: A component that sets the active Pokemon types (use this in Pokemon detail pages)
3. **usePokemonType**: A hook to access the context in other components

## Usage

### Setting Pokemon Types

In a Pokemon detail page or component:

```tsx
import PokemonTypeSetter from '@/components/pokemon/PokemonTypeSetter';

export default function PokemonDetailPage({ pokemon }) {
  return (
    <div>
      {/* This will set the theme based on the Pokemon's types */}
      <PokemonTypeSetter
        primaryType={pokemon.types}
        secondaryType={pokemon.secondaryType} // optional
      />

      {/* Rest of your page content */}
      <h1>{pokemon.name}</h1>
      {/* ... */}
    </div>
  );
}
```

### Using the Context in Components

```tsx
import { usePokemonType } from '@/contexts/PokemonTypeContext';

export default function MyComponent() {
  const { primaryType, secondaryType, getTypeBasedStyles } = usePokemonType();

  const styles = getTypeBasedStyles();

  return (
    <div style={{
      backgroundColor: styles.backgroundColor,
      color: styles.textColor
    }}>
      Current Pokemon type: {primaryType}
    </div>
  );
}
```

### CSS Custom Properties

The context automatically sets CSS custom properties that you can use in your CSS:

```css
.my-element {
  background-color: var(--pokemon-theme-bg);
  color: var(--pokemon-theme-text);
}

.my-link {
  color: var(--pokemon-theme-link);
}

.my-link:hover {
  background-color: var(--pokemon-theme-hover);
}
```

### Utility Classes

Use the predefined utility classes for common theming:

```tsx
<div className="pokemon-themed">
  This will use the Pokemon theme colors
</div>

<a className="pokemon-themed-link">
  This link will use Pokemon theme colors
</a>
```

## Components that use the context

- **Navigation**: Changes background and text colors based on Pokemon type
- **Hero**: Updates background and text colors to match Pokemon type
- **PokemonFormClient**: Automatically sets the type when viewing a Pokemon

## Type Colors

The system supports all 18 Pokemon types with carefully chosen colors that work well for both light and dark themes:

- Normal, Fire, Water, Electric, Grass, Ice
- Fighting, Poison, Ground, Flying, Psychic, Bug
- Rock, Ghost, Dragon, Dark, Steel, Fairy

## Clearing Types

Types are automatically cleared when:
- The PokemonTypeSetter component unmounts
- You manually call `clearPokemonTypes()`

This ensures that the theme returns to default when navigating away from Pokemon pages.
