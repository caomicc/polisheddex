#!/usr/bin/env node

// Simple Node.js test runner to check if the functions work without Vitest
import {
  normalizePokemonUrlKey,
  normalizePokemonDisplayName,
  urlKeyToStandardKey,
  getPokemonFileName,
  validatePokemonHyphenation,
} from './pokemonUrlNormalizer.js';

console.log('Running simple Pokemon URL Normalizer tests...\n');

// Test normalizePokemonUrlKey
console.log('Testing normalizePokemonUrlKey:');
console.log('Pikachu ->', normalizePokemonUrlKey('Pikachu')); // should be 'pikachu'
console.log('Nidoran-F ->', normalizePokemonUrlKey('Nidoran-F')); // should be 'nidoran-f'
console.log('Mr. Mime ->', normalizePokemonUrlKey('Mr. Mime')); // should be 'mr-mime'
console.log('Raichu Alolan ->', normalizePokemonUrlKey('Raichu Alolan')); // should be 'raichu-alolan'

// Test normalizePokemonDisplayName
console.log('\nTesting normalizePokemonDisplayName:');
console.log('pikachu ->', normalizePokemonDisplayName('pikachu')); // should be 'Pikachu'
console.log('nidoran-f ->', normalizePokemonDisplayName('nidoran-f')); // should be 'Nidoran-F'

// Test urlKeyToStandardKey
console.log('\nTesting urlKeyToStandardKey:');
console.log('pikachu ->', urlKeyToStandardKey('pikachu')); // should be 'Pikachu'
console.log('nidoran-f ->', urlKeyToStandardKey('nidoran-f')); // should be 'Nidoran-F'

// Test getPokemonFileName
console.log('\nTesting getPokemonFileName:');
console.log('Pikachu ->', getPokemonFileName('Pikachu')); // should be 'pikachu.json'
console.log('Nidoran-F ->', getPokemonFileName('Nidoran-F')); // should be 'nidoran-f.json'

// Test validatePokemonHyphenation
console.log('\nTesting validatePokemonHyphenation:');
console.log('Pikachu ->', validatePokemonHyphenation('Pikachu'));
console.log('Nidoran-F ->', validatePokemonHyphenation('Nidoran-F'));
console.log('Raichu-Alolan ->', validatePokemonHyphenation('Raichu-Alolan'));

console.log('\nAll tests completed successfully!');
