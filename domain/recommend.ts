import type { Capability, Format } from './types';

/**
 * Einfache Empfehlungslogik für "Erkannt: … / Empfohlen: …" (Kap. 10).
 * Bewusst simpel gehalten: kein maschinelles Lernen, keine Heuristik, die mehr
 * verspricht als sie hält — nur eine sinnvolle Voreinstellung, die der Nutzer
 * jederzeit ändern kann.
 */
export function recommendTarget(src: Format, matrix: Capability[]): { dst: Format; quality: number } {
  const available = matrix.filter((c) => c.src === src && c.dst !== src).map((c) => c.dst);

  const preferenceOrder: Format[] = ['jpeg', 'webp', 'png'];
  for (const candidate of preferenceOrder) {
    if (available.includes(candidate)) {
      return { dst: candidate, quality: candidate === 'png' ? 100 : 90 };
    }
  }

  const fallback = available[0];
  return { dst: fallback ?? 'jpeg', quality: 90 };
}
