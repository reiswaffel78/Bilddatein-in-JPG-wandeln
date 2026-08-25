import DOMPurify, { type Config } from 'dompurify';
import { ConversionError } from '../types';

/**
 * SVG ist nur-Lesen, und nur über den Rasterisierungspfad (Kap. 6, Kap. 12:
 * ehrlich als "rasterize" ausgewiesen, nie als "Konvertierung" verkauft).
 * Sicherheitsmaßnahmen aus Kap. 7 / SECURITY.md: Sanitizing vor jeder
 * Einbindung, Rasterisierung nur über `<img>` mit `blob:`-URL, Zielgröße ist
 * Pflichtfeld.
 */

const SANITIZE_CONFIG: Config = {
  USE_PROFILES: { svg: true, svgFilters: true },
  FORBID_TAGS: ['script', 'foreignObject'],
  FORBID_ATTR: ['onload', 'onclick', 'onerror', 'onmouseover'],
  ALLOW_DATA_ATTR: false,
};

export function sanitizeSvg(svgText: string): string {
  const clean = DOMPurify.sanitize(svgText, SANITIZE_CONFIG);
  if (typeof clean !== 'string') {
    throw new ConversionError('CORRUPT_INPUT', 'Diese SVG-Datei konnte nicht sicher verarbeitet werden.', 'Prüfe die Datei in einem anderen Programm.');
  }
  // Externe Referenzen (xlink:href/href auf http(s)) zusätzlich entfernen —
  // DOMPurify lässt harmlose externe Bild-Referenzen sonst stehen.
  return clean.replace(/((?:xlink:)?href)\s*=\s*["'](https?:)?\/\/[^"']*["']/gi, '');
}

export async function rasterizeSvg(blob: Blob, targetWidth: number, targetHeight: number): Promise<ImageData> {
  if (!targetWidth || !targetHeight || targetWidth <= 0 || targetHeight <= 0) {
    throw new ConversionError(
      'RASTERIZE_SIZE_MISSING',
      'SVG-Dateien haben keine feste Pixelgröße — eine Zielgröße muss angegeben werden, damit die Rasterisierung eindeutig ist.',
      'Trage Breite und Höhe im Formular ein, bevor du konvertierst.',
    );
  }

  const rawText = await blob.text();
  const sanitized = sanitizeSvg(rawText);
  const sanitizedBlob = new Blob([sanitized], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(sanitizedBlob);

  try {
    const bitmap = await createImageBitmap(sanitizedBlob).catch(async () => {
      // Fallback über <img>, falls createImageBitmap dieses SVG nicht direkt akzeptiert.
      const img = new Image();
      const loaded = new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('SVG-Rasterisierung fehlgeschlagen'));
      });
      img.src = url;
      await loaded;
      return createImageBitmap(img);
    });

    const canvas = new OffscreenCanvas(targetWidth, targetHeight);
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new ConversionError('UNKNOWN', 'Canvas-Kontext nicht verfügbar.', 'Versuche es in einem anderen Browser erneut.');
    ctx.drawImage(bitmap, 0, 0, targetWidth, targetHeight);
    return ctx.getImageData(0, 0, targetWidth, targetHeight);
  } finally {
    URL.revokeObjectURL(url);
  }
}
