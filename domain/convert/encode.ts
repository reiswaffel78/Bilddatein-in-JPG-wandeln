import type { ConvertOptions, Format } from '../types';
import { jsquashEncode, JSQUASH_FORMATS, type JsquashFormat } from '../engines/jsquash';
import { encodeGif } from '../engines/gif';
import { encodeBmp } from '../engines/bmp';
import { encodeTiff } from '../engines/tiff';
import { insertExifIntoJpeg } from '../exif/writeJpegExif';

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return [Number.isNaN(r) ? 255 : r, Number.isNaN(g) ? 255 : g, Number.isNaN(b) ? 255 : b];
}

/** Alpha→JPEG braucht eine Hintergrundfarbe, Pflichtfeld statt stillem Default (Kap. 9). */
function flattenAlpha(imageData: ImageData, backgroundColor: string): ImageData {
  const [br, bg, bb] = hexToRgb(backgroundColor);
  const out = new Uint8ClampedArray(imageData.data.length);
  for (let i = 0; i < imageData.data.length; i += 4) {
    const alpha = (imageData.data[i + 3] ?? 255) / 255;
    out[i] = Math.round((imageData.data[i] ?? 0) * alpha + br * (1 - alpha));
    out[i + 1] = Math.round((imageData.data[i + 1] ?? 0) * alpha + bg * (1 - alpha));
    out[i + 2] = Math.round((imageData.data[i + 2] ?? 0) * alpha + bb * (1 - alpha));
    out[i + 3] = 255;
  }
  return new ImageData(out, imageData.width, imageData.height);
}

export async function encodeOutput(imageData: ImageData, dst: Format, opts: ConvertOptions, rawExifPayload: ArrayBuffer | null = null): Promise<Blob> {
  const prepared = dst === 'jpeg' ? flattenAlpha(imageData, opts.backgroundColor) : imageData;

  if (JSQUASH_FORMATS.includes(dst as JsquashFormat)) {
    let encoded = await jsquashEncode(dst as JsquashFormat, prepared, {
      quality: opts.quality,
      progressive: opts.progressive,
      chromaSubsampling: opts.chromaSubsampling,
    });
    if (dst === 'jpeg' && opts.metadata.exif && rawExifPayload) {
      encoded = insertExifIntoJpeg(encoded, rawExifPayload);
    }
    const mime = MIME_TYPES[dst];
    return new Blob([encoded], { type: mime });
  }

  if (dst === 'gif') return encodeGif(prepared);
  if (dst === 'bmp') return encodeBmp(prepared);
  if (dst === 'tiff') return encodeTiff(prepared);

  throw new Error(`Kein Encoder für Zielformat "${dst}" registriert.`);
}

const MIME_TYPES: Partial<Record<Format, string>> = {
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  avif: 'image/avif',
  jxl: 'image/jxl',
};
