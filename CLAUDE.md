# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## there is no polisheddx directory or polishedx. Never look for one. Ever.

## Development Commands

### Core Development
- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build production version (includes data generation and file copying)
- `npm start` - Start production server
- `npm run lint` - Lint code with Next.js ESLint
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting

### Data Extraction
- `npm run extract` - Extract all Pokémon and location data from ROM files
- `npm run crop` - Crop top sprites using image processing script
- `npm run update-rom` - Update the polishedcrystal submodule

### Testing
- `npm run test` - Run all tests with Vitest
- `npm run test:watch` - Run tests in watch mode

## Project Architecture

### Core Next.js Structure
This is a Next.js 15 application using the App Router with TypeScript, built for the Pokémon Polished Crystal ROM hack. The app follows a data-driven architecture where ROM data is extracted into JSON files and consumed by React components.

### Data Flow Architecture
1. **Data Extraction** (`extract_pokemon_data.ts`, `extract_locations.ts`) - Parses ROM files in `/polishedcrystal` submodule
2. **JSON Generation** - Creates structured data files in `/output` directory
3. **React Consumption** - Components read pre-generated JSON files for display

### Key Directories

#### `/src/utils/extractors`
Contains specialized extractors for different ROM data types:
- `statsExtractors.ts` - Pokémon stats, abilities, moves, forms
- `locationExtractors.ts` - Wild encounter data and location information
- `moveExtractors.ts` - Move descriptions and data
- `tmHmExtractors.ts` - TM/HM item data
- `pokedexExtractors.ts` - Pokédex entries and descriptions

#### `/output`
Generated JSON files consumed by the app:
- `pokemon_detailed_stats.json` - Complete Pokémon data
- `locations_by_area.json` - Location-based encounter data
- `pokemon_move_descriptions.json` - Move information
- `items_data.json` - Item data including TMs/HMs

#### `/src/components`
React components organized by feature:
- `/pokemon` - Pokémon display components, search, navigation
- `/locations` - Location browsing and search
- `/items` - Item database components
- `/ui` - Shared UI components using shadcn/ui + Radix

#### `/src/contexts`
- `FaithfulPreferenceContext.tsx` - Manages faithful vs polished ROM mode preference
- `PokemonTypeContext.tsx` - Handles type filtering and display

### Data Processing Concepts

#### Faithful vs Polished Modes
The app supports two ROM variants:
- **Faithful** - Classic Crystal mechanics and movesets
- **Polished** - Enhanced mechanics with modern features
Data extractors handle both versions, and the UI switches between them via context.

#### Form Handling
Pokémon with multiple forms (like Unown) have specialized handling:
- Base data in main Pokémon files
- Form-specific data in nested objects
- Dynamic form selection in UI components

#### String Normalization
Complex normalization system in `/src/utils/stringNormalizer` handles:
- ROM text format conversion
- URL-safe string generation
- Pokémon name variations and edge cases

### Important Patterns

#### File Structure Convention
- Individual Pokémon: `/output/pokemon/{name}.json`
- Individual Locations: `/output/locations/{name}.json`
- Aggregate data files at `/output` root level

#### Type Safety
Comprehensive TypeScript definitions in `/src/types`:
- `types.ts` - Core data structures
- `locationTypes.ts` - Location-specific types
- `pokemonBaseData.d.ts` - Base Pokémon data interface

#### Search & Navigation
Uses `nuqs` for URL state management with:
- Search parameters for filtering
- Type-based navigation
- Pagination state in URLs
