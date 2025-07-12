# String Normalizer

A utility for normalizing Pokémon move names and related strings across different formats.

## Overview

This utility helps normalize various string formats used for Pokémon move names throughout the codebase. It handles various formats like:

- CamelCase: `ThunderShock`
- SNAKE_CASE: `THUNDER_SHOCK`
- Space-separated: `Thunder Shock`
- Prefixed variants: `BattleAnim_ThunderShock`, `Sfx_ThunderShock`
- Suffixed variants: `ThunderShockDescription`

It converts all these variants into a consistent Capital Case (Title Case) format (e.g., `Thunder Shock`) for use as keys in maps, comparisons, and display.

## Usage

### Basic Usage

```typescript
import { normalizeMoveString } from '@/utils/stringNormalizer';

// Normalize a move name
const normalized = normalizeMoveString('THUNDER_SHOCK'); // 'Thunder Shock'

// Use in a Map
const moveMap = new Map<string, MoveData>();
moveMap.set(normalizeMoveString('THUNDER_SHOCK'), { power: 40, type: 'Electric' });

// Look up using any variant
const moveData = moveMap.get(normalizeMoveString('ThundershockDescription')); // Same as 'Thunder Shock'
```

### Handling Edge Cases

The normalizer handles special cases like:

- Capitalization inconsistencies: `Healinglight` vs `HealingLight`
- Move name conflicts: `Slash` vs `Night Slash`
- Special move formatting: `ExtremeSpeed` vs `Extremespeed`

## API

### `normalizeMoveString(str: string): string`

Normalizes any variant of a move name string to a consistent Capital Case (Title Case) format.

**Parameters**:
- `str`: The string to normalize (any variant of a move name)

**Returns**:
- A normalized string in Capital Case format (e.g., `Thunder Shock`)

### `normalizeString(str: string): string`

The underlying function that `normalizeMoveString` uses. Can be used directly for normalizing any string, not just move names.

**Parameters**:
- `str`: The string to normalize

**Returns**:
- A normalized string in Capital Case format (e.g., `Thunder Shock`)

### `runNormalizerTests(): void`

Runs a series of tests on the normalizer to verify it works correctly with various edge cases.
Useful for debugging or verifying the normalizer is functioning as expected.

## Testing

Run the tests with:

```bash
npm test
```

Or to run tests in watch mode:

```bash
npm run test:watch
```
