import { normalizeString } from './string.utils';

describe('normalizeString', () => {
  it('should return empty string for null, undefined or empty input', () => {
    expect(normalizeString('')).toBe('');
    expect(normalizeString(null)).toBe('');
    expect(normalizeString(undefined)).toBe('');
  });

  it('should remove accents and tildes from uppercase and lowercase characters', () => {
    expect(normalizeString('Tecnológica')).toBe('tecnologica');
    expect(normalizeString('tecnologica')).toBe('tecnologica');
    expect(normalizeString('INGENIERÍA')).toBe('ingenieria');
    expect(normalizeString('Diseño')).toBe('diseno');
  });

  it('should trim surrounding whitespace', () => {
    expect(normalizeString('  Tecnológica  ')).toBe('tecnologica');
  });
});
