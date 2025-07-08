# PolishedDex

A modern Pokédex web app built with Next.js, designed as a companion for the [Polished Crystal disassembly project](https://github.com/Rangi42/polishedcrystal).

- Accurate Pokémon data extraction from Polished Crystal's ASM files
- Consistent move, egg, and evolution move normalization
- Robust handling of shared move descriptions and special cases
- Clean, modern frontend for browsing Pokémon and their moves

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Extract and generate data files:
   ```bash
   node extract_pokemon_data.ts
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

- `extract_pokemon_data.ts` — Data extraction and normalization script
- `move_descriptions.json`, `pokemon_egg_moves.json`, `pokemon_evo_moves.json` — Generated data files
- `src/app/` — Next.js frontend application
- `data/` — ASM source files for Pokémon, moves, and related data (from Polished Crystal)

## Features

- Consistent move name and description formatting
- Handles shared and special-case move descriptions
- Accurate egg and evolution move mapping
- Modern, responsive UI

## References

- [Polished Crystal disassembly repository](https://github.com/Rangi42/polishedcrystal)

## License

MIT
