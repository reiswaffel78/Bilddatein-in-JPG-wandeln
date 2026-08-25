import { isOpfsSupported, writeScratchFile, readScratchFile, deleteScratchFile } from '../storage/opfs';

/**
 * Ergebnis-Blobs werden nicht dauerhaft im React-State gehalten (Kap. 8: kein
 * Halten großer Datenmengen in JS-Arrays), sondern in OPFS geschrieben und bei
 * Bedarf (Einzel-Download, ZIP-Export) wieder gelesen. Fällt OPFS-Unterstützung
 * aus (seltener Fall in aktuellen Browsern), wird ein In-Memory-Fallback genutzt.
 */

const memoryFallback = new Map<string, Blob>();
const opfsAvailable = typeof window !== 'undefined' && isOpfsSupported();

export async function storeResult(id: string, blob: Blob): Promise<void> {
  if (opfsAvailable) {
    await writeScratchFile(id, blob);
  } else {
    memoryFallback.set(id, blob);
  }
}

export async function getResult(id: string): Promise<Blob | null> {
  if (opfsAvailable) {
    return readScratchFile(id);
  }
  return memoryFallback.get(id) ?? null;
}

export async function removeResult(id: string): Promise<void> {
  if (opfsAvailable) {
    await deleteScratchFile(id);
  } else {
    memoryFallback.delete(id);
  }
}
