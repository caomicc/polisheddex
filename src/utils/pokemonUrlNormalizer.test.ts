import { describe, expect, it } from 'vitest';
import {
  normalizePokemonUrlKey,
  normalizePokemonDisplayName,
  urlKeyToStandardKey,
  getPokemonFileName,
  validatePokemonHyphenation
} from './pokemonUrlNormalizer';

describe('Pokemon URL Normalizer', () => {
  describe('normalizePokemonUrlKey', () => {
    it('should handle basic Pokemon names', () => {
      expect(normalizePokemonUrlKey('Pikachu')).toBe('pikachu');
      expect(normalizePokemonUrlKey('Charizard')).toBe('charizard');
      expect(normalizePokemonUrlKey('BULBASAUR')).toBe('bulbasaur');
    });

    it('should handle names with spaces', () => {
      expect(normalizePokemonUrlKey('Mr. Mime')).toBe('mr-mime');
      expect(normalizePokemonUrlKey('Tapu Koko')).toBe('tapu-koko');
    });

    it('should preserve hyphens in special Pokemon names', () => {
      expect(normalizePokemonUrlKey('Nidoran-F')).toBe('nidoran-f');
      expect(normalizePokemonUrlKey('Nidoran-M')).toBe('nidoran-m');
      expect(normalizePokemonUrlKey('Ho-Oh')).toBe('ho-oh');
      expect(normalizePokemonUrlKey('porygon-z')).toBe('porygon-z');
    });

    it('should handle form variants correctly', () => {
      expect(normalizePokemonUrlKey('Raichu Alolan')).toBe('raichu-alolan');
      expect(normalizePokemonUrlKey('Growlithe Hisuian')).toBe('growlithe-hisuian');
      expect(normalizePokemonUrlKey('Typhlosion Hisuian')).toBe('typhlosion-hisuian');
    });

    it('should remove special characters', () => {
      expect(normalizePokemonUrlKey('Farfetch\'d')).toBe('farfetchd');
      expect(normalizePokemonUrlKey('Flabébé')).toBe('flabebe');
    });

    it('should handle empty or whitespace input', () => {
      expect(normalizePokemonUrlKey('')).toBe('');
      expect(normalizePokemonUrlKey('   ')).toBe('');
    });

    it('should handle multiple spaces and normalize them', () => {
      expect(normalizePokemonUrlKey('Mr.   Mime')).toBe('mr-mime');
      expect(normalizePokemonUrlKey('Tapu  Koko')).toBe('tapu-koko');
    });
  });

  describe('normalizePokemonDisplayName', () => {
    it('should handle basic Pokemon names', () => {
      expect(normalizePokemonDisplayName('pikachu')).toBe('Pikachu');
      expect(normalizePokemonDisplayName('CHARIZARD')).toBe('Charizard');
      expect(normalizePokemonDisplayName('bulbasaur')).toBe('Bulbasaur');
    });

    it('should handle special cases correctly', () => {
      expect(normalizePokemonDisplayName('nidoran-f')).toBe('Nidoran-F');
      expect(normalizePokemonDisplayName('nidoran_f')).toBe('Nidoran-F');
      expect(normalizePokemonDisplayName('ho-oh')).toBe('Ho-Oh');
      expect(normalizePokemonDisplayName('ho_oh')).toBe('Ho-Oh');
      expect(normalizePokemonDisplayName('porygon-z')).toBe('porygon-z');
      expect(normalizePokemonDisplayName('porygon_z')).toBe('porygon-z');
    });

    it('should handle names with underscores and hyphens', () => {
      expect(normalizePokemonDisplayName('mr_mime')).toBe('Mr Mime');
      expect(normalizePokemonDisplayName('tapu-koko')).toBe('Tapu Koko');
    });

    it('should handle empty input', () => {
      expect(normalizePokemonDisplayName('')).toBe('');
      expect(normalizePokemonDisplayName('   ')).toBe('');
    });
  });

  describe('urlKeyToStandardKey', () => {
    it('should convert URL keys back to standard keys', () => {
      expect(urlKeyToStandardKey('pikachu')).toBe('Pikachu');
      expect(urlKeyToStandardKey('mr-mime')).toBe('Mr Mime');
      expect(urlKeyToStandardKey('tapu-koko')).toBe('Tapu Koko');
    });

    it('should handle special hyphenated Pokemon', () => {
      expect(urlKeyToStandardKey('nidoran-f')).toBe('Nidoran-F');
      expect(urlKeyToStandardKey('nidoran-m')).toBe('Nidoran-M');
      expect(urlKeyToStandardKey('ho-oh')).toBe('Ho-Oh');
      expect(urlKeyToStandardKey('porygon-z')).toBe('porygon-z');
    });

    it('should handle URL encoding', () => {
      expect(urlKeyToStandardKey('mr%2Dmime')).toBe('Mr Mime');
      expect(urlKeyToStandardKey(encodeURIComponent('nidoran-f'))).toBe('Nidoran-F');
    });
  });

  describe('getPokemonFileName', () => {
    it('should generate correct filenames', () => {
      expect(getPokemonFileName('Pikachu')).toBe('pikachu.json');
      expect(getPokemonFileName('Nidoran-F')).toBe('nidoran-f.json');
      expect(getPokemonFileName('Mr. Mime')).toBe('mr-mime.json');
      expect(getPokemonFileName('Raichu Alolan')).toBe('raichu-alolan.json');
    });
  });

  describe('validatePokemonHyphenation', () => {
    it('should identify Pokemon without hyphens', () => {
      const result = validatePokemonHyphenation('Pikachu');
      expect(result.hasHyphen).toBe(false);
      expect(result.isKnownForm).toBe(false);
      expect(result.isEdgeCase).toBe(false);
      expect(result.suggestedKey).toBe('pikachu');
    });

    it('should identify known form variants', () => {
      const result = validatePokemonHyphenation('Raichu-Alolan');
      expect(result.hasHyphen).toBe(true);
      expect(result.isKnownForm).toBe(true);
      expect(result.isEdgeCase).toBe(false);
    });

    it('should identify edge cases (hyphens that are part of the name)', () => {
      const result = validatePokemonHyphenation('Nidoran-F');
      expect(result.hasHyphen).toBe(true);
      expect(result.isKnownForm).toBe(false);
      expect(result.isEdgeCase).toBe(false); // Should be false because it's a known hyphenated name
      expect(result.suggestedKey).toBe('nidoran-f');
    });

    it('should suggest correct keys for all cases', () => {
      expect(validatePokemonHyphenation('Pikachu').suggestedKey).toBe('pikachu');
      expect(validatePokemonHyphenation('Nidoran-F').suggestedKey).toBe('nidoran-f');
      expect(validatePokemonHyphenation('Mr. Mime').suggestedKey).toBe('mr-mime');
    });
  });
});
