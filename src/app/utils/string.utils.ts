/**
 * Normalizes a string by converting to lowercase, removing diacritical marks (accents, tildes),
 * and trimming whitespace.
 *
 * Example:
 *  - 'Tecnológica' -> 'tecnologica'
 *  - 'tecnologica' -> 'tecnologica'
 */
export function normalizeString(str: string | null | undefined): string {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}
