import * as UTIF from 'utif';
import { ConversionError } from '../types';

/**
 * TIFF-Lesen/Schreiben über UTIF.js (Kap. 3: als Fallback vorgesehen, hier
 * primär genutzt, da vollwertiges vips-TIFF in dieser Phase nicht gebaut wird,
 * siehe RISKS.md). Nur Baseline-TIFF (unkomprimiert/LZW/Deflate über pako,
 * was UTIF nativ abdeckt) — keine exotischen Kompressionen.
 */

export interface TiffPageInfo {
  width: number;
  height: number;
}

export async function decodeTiffPages(blob: Blob): Promise<{ pages: ImageData[]; info: TiffPageInfo[] }> {
  const buffer = await blob.arrayBuffer();
  const ifds = UTIF.decode(buffer);

  if (ifds.length === 0) {
    throw new ConversionError('CORRUPT_INPUT', 'Diese TIFF-Datei enthält keine lesbaren Seiten.', 'Prüfe die Datei in einem anderen Programm.');
  }

  const pages: ImageData[] = [];
  const info: TiffPageInfo[] = [];

  for (const ifd of ifds) {
    UTIF.decodeImage(buffer, ifd);
    const rgba = UTIF.toRGBA8(ifd);
    const width = ifd.width;
    const height = ifd.height;
    pages.push(new ImageData(new Uint8ClampedArray(rgba), width, height));
    info.push({ width, height });
  }

  return { pages, info };
}

export function encodeTiff(imageData: ImageData): Blob {
  const rgba = new Uint8Array(imageData.data.buffer, imageData.data.byteOffset, imageData.data.byteLength);
  const buffer = UTIF.encodeImage(rgba, imageData.width, imageData.height);
  return new Blob([buffer], { type: 'image/tiff' });
}
