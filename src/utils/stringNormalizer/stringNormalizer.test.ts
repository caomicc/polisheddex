import { describe, it, expect } from 'vitest';
import { normalizeString, normalizeMoveString } from './stringNormalizer';

describe('String Normalizer', () => {
  describe('normalizeString', () => {
    it('should normalize ThunderShock variants', () => {
      expect(normalizeString('ThunderShock')).toBe('Thunder Shock');
      expect(normalizeString('ThundershockDescription')).toBe('Thundershock');
      expect(normalizeString('Sfx_Thundershock')).toBe('Thundershock');
      expect(normalizeString('THUNDERSHOCK')).toBe('Thundershock');
    });

    it('should normalize ExtremeSpeed variants', () => {
      expect(normalizeString('EXTREMESPEED')).toBe('Extreme Speed');
      expect(normalizeString('BattleAnim_Extremespeed')).toBe('Extremespeed');
      expect(normalizeString('ExtremespeedDescription')).toBe('Extremespeed');
      expect(normalizeString('ExtremeSpeed')).toBe('Extreme Speed');
    });

    it('should normalize Double Slap variants', () => {
      expect(normalizeString('DOUBLE_SLAP')).toBe('Double Slap');
      expect(normalizeString('DoubleSlap')).toBe('Double Slap');
      expect(normalizeString('DoubleSlapDescription')).toBe('Double Slap');
      expect(normalizeString('BattleAnim_DoubleSlap')).toBe('Double Slap');
    });

    it('should normalize Wild Charge variants', () => {
      expect(normalizeString('Wild Charge')).toBe('Wild Charge');
      expect(normalizeString('WildChargeDescription')).toBe('Wild Charge');
      expect(normalizeString('WILD_CHARGE')).toBe('Wild Charge');
      expect(normalizeString('BattleAnim_WildCharge')).toBe('Wild Charge');
    });

    it('should normalize Disarm Voice variants', () => {
      expect(normalizeString('Disarm Voice')).toBe('Disarm Voice');
      expect(normalizeString('DisarmVoiceDescription')).toBe('Disarm Voice');
      expect(normalizeString('DISARM_VOICE')).toBe('Disarm Voice');
    });

    it('should handle the Slash vs Night Slash conflict correctly', () => {
      expect(normalizeString('Slash')).toBe('Slash');
      expect(normalizeString('SLASH')).toBe('Slash');
      expect(normalizeString('SlashDescription')).toBe('Slash');

      expect(normalizeString('Night Slash')).toBe('Night Slash');
      expect(normalizeString('NIGHT_SLASH')).toBe('Night Slash');
      expect(normalizeString('NightSlashDescription')).toBe('Night Slash');
    });

    it('should normalize Extrasensory variants', () => {
      expect(normalizeString('Extrasensory')).toBe('Extrasensory');
      expect(normalizeString('EXTRASENSORY')).toBe('Extrasensory');
    });

    it('should normalize HealingLight variants with consistent capitalization', () => {
      expect(normalizeString('Healinglight')).toBe('Healing Light');
      expect(normalizeString('HEALINGLIGHT')).toBe('Healing Light');
      expect(normalizeString('BattleAnim_HealingLight')).toBe('Healing Light');
      expect(normalizeString('HealingLight')).toBe('Healing Light');
    });

    it('should normalize Future Sight variants', () => {
      expect(normalizeString('Future Sight')).toBe('Future Sight');
      expect(normalizeString('FutureSight')).toBe('Future Sight');
      expect(normalizeString('FUTURE_SIGHT')).toBe('Future Sight');
    });

    it('should normalize Nasty Plot variants', () => {
      expect(normalizeString('Nasty Plot')).toBe('Nasty Plot');
      expect(normalizeString('NASTY_PLOT')).toBe('Nasty Plot');
      expect(normalizeString('NastyPlot')).toBe('Nasty Plot');
    });

    it('should normalize Foresight variants', () => {
      expect(normalizeString('Foresight')).toBe('Foresight');
      expect(normalizeString('FORESIGHT')).toBe('Foresight');
      expect(normalizeString('ForesightDescription')).toBe('Foresight');
    });
  });

  describe('normalizeMoveString', () => {
    it('should be an alias of normalizeString', () => {
      const testStrings = ['ThunderShock', 'DOUBLE_SLAP', 'Wild Charge', 'NIGHT_SLASH'];

      testStrings.forEach((str) => {
        expect(normalizeMoveString(str)).toBe(normalizeString(str));
      });
    });
  });
});
