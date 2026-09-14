import { PlanManifest } from '../models/plan-manifest.model';

/**
 * URL Hash Fragment Serializer & Compressor for Direct P2P Link Sharing (WhatsApp / Telegram).
 * Serializes a PlanManifest into a URL-safe base64 string fragment (#import=...).
 */
export function encodePlanToUrlHash(manifest: PlanManifest): string {
  try {
    const jsonString = JSON.stringify(manifest);
    // Standard URL-safe base64 encoding
    const encoded = btoa(encodeURIComponent(jsonString));
    return encoded;
  } catch (err) {
    console.error('Failed to encode PlanManifest to URL hash fragment:', err);
    throw new Error('Error serializando el plan para el enlace de compartir.');
  }
}

/**
 * Parses and decompresses a URL hash fragment into a PlanManifest.
 */
export function decodePlanFromUrlHash(hashString: string): PlanManifest {
  try {
    // Strip leading # or #import= if present
    let cleanString = hashString;
    if (cleanString.startsWith('#')) cleanString = cleanString.substring(1);
    if (cleanString.startsWith('import=')) cleanString = cleanString.substring(7);

    const jsonString = decodeURIComponent(atob(cleanString));
    const manifest = JSON.parse(jsonString) as PlanManifest;
    return manifest;
  } catch (err) {
    console.error('Failed to decode PlanManifest from URL hash fragment:', err);
    throw new Error('El enlace de importación es invalid o se encuentra dañado.');
  }
}
