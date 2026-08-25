import { ConversionError } from '../types';

/**
 * Universeller Decoder über `createImageBitmap`, deckt alles ab, was der
 * Browser selbst dekodieren kann (JPEG, PNG, WebP, GIF-erster-Frame, BMP,
 * teils AVIF). Encoding läuft NICHT über diese Engine — mozjpeg-Optionen
 * (Progressive, Chroma-Subsampling) und AVIF/JXL-Kontrolle sind nur über
 * jsquash erreichbar (Kap. 9, Kap. 16: ein Schreib-Pfad pro Format).
 */

export async function decodeNatively(blob: Blob): Promise<ImageData> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(blob);
  } catch (cause) {
    throw new ConversionError(
      'CORRUPT_INPUT',
      'Dieses Bild konnte von deinem Browser nicht dekodiert werden.',
      'Prüfe, ob die Datei in einem anderen Programm intakt ist, oder probiere einen anderen Browser.',
      cause,
    );
  }
  const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new ConversionError('UNKNOWN', 'Canvas-Kontext nicht verfügbar.', 'Versuche es in einem anderen Browser erneut.');
  }
  ctx.drawImage(bitmap, 0, 0);
  return ctx.getImageData(0, 0, bitmap.width, bitmap.height);
}

/**
 * Prüft, ob der Browser ein Format nativ dekodieren kann, anhand eines
 * eingebetteten 1×1-Testbilds. Bewusst kein `fetch` einer data:-URL — die App
 * darf zur Laufzeit außer dem Nachladen eigener WASM-Module keinen Request
 * absetzen (Kap. 7), auch keinen lokal aufgelösten.
 */
export async function probeNativeDecode(base64: string, mimeType: string): Promise<boolean> {
  try {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const blob = new Blob([bytes], { type: mimeType });
    const bitmap = await createImageBitmap(blob);
    bitmap.close();
    return true;
  } catch {
    return false;
  }
}
