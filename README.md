# PolishedDex

Complete Pokémon Polished Crystal Database

## Overview
PolishedDex is a modern, searchable Pokédex and location guide for Pokémon Polished Crystal. It provides detailed stats, moves, evolutions, locations, and more for every Pokémon in the game, with a clean, accessible UI and fast navigation.

## Features
- Browse all Pokémon with stats, types, evolutions, moves, and locations
- Explore all game locations and see which Pokémon are available in each area
- Hidden Grotto and special encounter support
- Accessible, responsive design with dark mode
- Fast search and navigation
- Data sourced from game files and scripts
- Modern Next.js App Router architecture

## Tech Stack
- **Next.js** (App Router, TypeScript)
- **Tailwind CSS v4** (utility-first styling)
- **shadcn/ui** and **Radix UI** (accessible components)

## Utilities

### String Normalizer
A utility for normalizing Pokémon move names and related strings across different formats.

```typescript
// Normalize any variant of a move name to a consistent Capital Case format
import { normalizeMoveString } from '@/utils/stringNormalizer';

// All these return the same normalized string: "Thunder Shock"
normalizeMoveString('THUNDERSHOCK');
normalizeMoveString('ThunderShock');
normalizeMoveString('ThundershockDescription');
normalizeMoveString('BattleAnim_ThunderShock');

// Handles edge cases and conflicts
normalizeMoveString('SLASH'); // "Slash"
normalizeMoveString('NIGHT_SLASH'); // "Night Slash"
```

See [String Normalizer Documentation](/src/utils/stringNormalizer/README.md) for more details.
- **TypeScript** (type safety)
- **ESLint** and **Prettier** (code quality)
- **Vercel Analytics** (optional)

## Getting Started

### Prerequisites
- Node.js (v24+ required for extracting asm files)
- npm or yarn

### Installation
1. Clone the repo:
```sh
git clone https://github.com/caomicc/polisheddex.git
cd polisheddex
```
2. Install dependencies:
```sh
npm install
# or
yarn install
```
3. Build game data (if needed):
   - Ensure the `output/` folder contains the required JSON files (see below).
   - If you need to regenerate data, use the provided scripts (e.g. `extract_pokemon_data.ts`).

4. Run the development server:
```sh
npm run dev
# or
yarn dev
```
5. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Data Files
The app expects the following files in the `output/` directory:
- `pokemon_base_data.json`
- `pokemon_detailed_stats.json`
- `pokemon_egg_moves.json`
- `pokemon_evolution_data.json`
- `pokemon_level_moves.json`
- `pokemon_locations.json`
- `pokemon_move_descriptions.json`
- `pokemon_pokedex_entries.json`
- `locations_by_area.json`

You can generate these from the game source using the scripts in the repo.

## Usage
- Browse Pokémon: `/pokemon`
- Browse Locations: `/locations`
- View details for each Pokémon or location
- Search and filter as needed

### Coding Standards
- Functional React components and hooks
- Tailwind v4 CSS, `cn` utility for class names
- shadcn/ui and Radix UI for advanced components
- TypeScript for all code
- Accessible, semantic HTML
- Modular, maintainable code structure
- ESLint and Prettier rules

## License
MIT

## Acknowledgements
- Pokémon Polished Crystal by Rangi
- shadcn/ui, Radix UI, Next.js, Tailwind CSS
- All contributors

---
For questions or feedback, open an issue or contact [Cammy](https://caomi.cc).
