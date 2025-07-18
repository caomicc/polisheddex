import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { FlatCompat } from '@eslint/eslintrc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  {
    ignores: [
      '**/src/utils/*',
      '**/src/utils/**',
      '**/src/utils/**/*',
      '**/extract_pokemon_data.ts',
      '**/test_mart_extraction.ts',
      '**/test_parse.ts',
      '**/add_form_type_mappings.js',
      '**/fix_form_files.js',
      '**/crop_top_sprite.ts',
    ],
  },
];

export default eslintConfig;
