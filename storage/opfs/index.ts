/**
 * OPFS-Scratch-Space für Zwischenergebnisse (Kap. 3, ARCHITECTURE.md).
 * Batch-Ergebnisse werden hier abgelegt statt im Hauptspeicher gehalten zu
 * werden, damit ein Batch mit vielen/großen Dateien nicht den Tab-Speicher
 * sprengt, bevor der Nutzer "Alle als ZIP" klickt.
 */

const SCRATCH_DIR = 'converter-scratch';

export function isOpfsSupported(): boolean {
  return typeof navigator !== 'undefined' && 'storage' in navigator && 'getDirectory' in navigator.storage;
}

async function getScratchDir(): Promise<FileSystemDirectoryHandle> {
  const root = await navigator.storage.getDirectory();
  return root.getDirectoryHandle(SCRATCH_DIR, { create: true });
}

export async function writeScratchFile(id: string, blob: Blob): Promise<void> {
  if (!isOpfsSupported()) return;
  const dir = await getScratchDir();
  const fileHandle = await dir.getFileHandle(id, { create: true });
  const writable = await fileHandle.createWritable();
  await writable.write(blob);
  await writable.close();
}

export async function readScratchFile(id: string): Promise<Blob | null> {
  if (!isOpfsSupported()) return null;
  try {
    const dir = await getScratchDir();
    const fileHandle = await dir.getFileHandle(id);
    return await fileHandle.getFile();
  } catch {
    return null;
  }
}

export async function deleteScratchFile(id: string): Promise<void> {
  if (!isOpfsSupported()) return;
  try {
    const dir = await getScratchDir();
    await dir.removeEntry(id);
  } catch {
    // Datei existiert nicht mehr — kein Fehlerfall.
  }
}

export async function clearScratch(): Promise<void> {
  if (!isOpfsSupported()) return;
  try {
    const root = await navigator.storage.getDirectory();
    await root.removeEntry(SCRATCH_DIR, { recursive: true });
  } catch {
    // nichts zu löschen
  }
}
