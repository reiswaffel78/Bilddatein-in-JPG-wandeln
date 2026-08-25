import type { Capability } from '../types';

const CACHE_KEY_PREFIX = 'converter.capabilityMatrix.v1.';

/** Cache-Schlüssel enthält den User-Agent, damit ein Browser-Update die Probe automatisch neu auslöst (Kap. 5). */
function cacheKey(): string {
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown';
  return `${CACHE_KEY_PREFIX}${ua}`;
}

export function readCachedMatrix(): Capability[] | null {
  try {
    const raw = localStorage.getItem(cacheKey());
    if (!raw) return null;
    return JSON.parse(raw) as Capability[];
  } catch {
    return null;
  }
}

export function writeCachedMatrix(matrix: Capability[]): void {
  try {
    localStorage.setItem(cacheKey(), JSON.stringify(matrix));
  } catch {
    // localStorage kann in Private-Modus-Browsern fehlschlagen — kein kritischer Pfad, einfach nicht cachen.
  }
}
