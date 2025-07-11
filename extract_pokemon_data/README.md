# Pokémon Data Extractor

This module extracts and processes game data from ASM files, converting them into JSON format for use in the PokéDex application.

## Directory Structure

```
extract_pokemon_data/
├── index.ts                   # Entry point
├── utils/
│   ├── fileUtils.ts           # File I/O utilities
│   └── stringUtils.ts         # String formatting utilities
├── parsers/
│   ├── abilityParser.ts       # Parses ability data
│   ├── moveParser.ts          # Parses move data
│   ├── locationParser.ts      # Parses location data
│   └── ... additional parsers
├── transformers/
│   └── formatters.ts          # Data transformation utilities
├── types/
│   └── pokemon.ts             # TypeScript type definitions
├── data/
│   └── constants.ts           # Shared constants and mapping tables
└── output/
    └── savePokemonData.ts     # Output file handling
```

## Usage

Run the data extraction process:

```bash
npm run extract
```

This will:
1. Extract ability descriptions
2. Extract move descriptions and stats
3. Extract Pokémon location data
4. ... (additional extraction processes)

The output will be JSON files stored in the project root directory.

## Adding New Parsers

To add a new parser:

1. Create a new file in the `parsers/` directory
2. Implement your parsing logic
3. Export the main function
4. Import and call your parser from `index.ts`

## Maintainers

Maintained by the PokéDex development team
