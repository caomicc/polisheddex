import { describe, it, expect } from 'vitest';
import { normalizeText, accentInsensitiveIncludes } from '@/utils/textUtils';

describe('textUtils', () => {
  describe('normalizeText', () => {
    it('should remove accents from text', () => {
      expect(normalizeText('Pokémon')).toBe('pokemon');
      expect(normalizeText('café')).toBe('cafe');
      expect(normalizeText('résumé')).toBe('resume');
      expect(normalizeText('naïve')).toBe('naive');
      expect(normalizeText('façade')).toBe('facade');
    });

    it('should convert to lowercase', () => {
      expect(normalizeText('POKEMON')).toBe('pokemon');
      expect(normalizeText('Pokémon')).toBe('pokemon');
    });

    it('should handle text without accents', () => {
      expect(normalizeText('pokemon')).toBe('pokemon');
      expect(normalizeText('Great Ball')).toBe('great ball');
    });

    it('should handle empty strings', () => {
      expect(normalizeText('')).toBe('');
    });
  });

  describe('accentInsensitiveIncludes', () => {
    it('should find accented characters with non-accented search', () => {
      expect(accentInsensitiveIncludes('Pokémon', 'pokemon')).toBe(true);
      expect(accentInsensitiveIncludes('Pokémon', 'e')).toBe(true);
      expect(accentInsensitiveIncludes('café', 'cafe')).toBe(true);
      expect(accentInsensitiveIncludes('résumé', 'resume')).toBe(true);
    });

    it('should find non-accented characters with accented search', () => {
      expect(accentInsensitiveIncludes('pokemon', 'pokémon')).toBe(true);
      expect(accentInsensitiveIncludes('resume', 'résumé')).toBe(true);
      expect(accentInsensitiveIncludes('cafe', 'café')).toBe(true);
    });

    it('should be case insensitive', () => {
      expect(accentInsensitiveIncludes('Pokémon', 'POKEMON')).toBe(true);
      expect(accentInsensitiveIncludes('POKEMON', 'pokémon')).toBe(true);
    });

    it('should work with partial matches', () => {
      expect(accentInsensitiveIncludes('Pokémon Ball', 'poke')).toBe(true);
      expect(accentInsensitiveIncludes('Great Ball', 'ball')).toBe(true);
      expect(accentInsensitiveIncludes('TM01 Dynamicpunch', 'dynamic')).toBe(true);
    });

    it('should return false for non-matches', () => {
      expect(accentInsensitiveIncludes('Pokémon', 'digimon')).toBe(false);
      expect(accentInsensitiveIncludes('Great Ball', 'ultra')).toBe(false);
    });

    it('should handle empty strings', () => {
      expect(accentInsensitiveIncludes('pokemon', '')).toBe(true);
      expect(accentInsensitiveIncludes('', 'pokemon')).toBe(false);
      expect(accentInsensitiveIncludes('', '')).toBe(true);
    });
  });
});
