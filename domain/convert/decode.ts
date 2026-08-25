import type { DetectedMetadata, Format } from '../types';
import { ConversionError } from '../types';
import { decodeNatively } from '../engines/nativeCanvas';
import { jsquashDecode, type JsquashFormat } from '../engines/jsquash';
import { decodeIco } from '../engines/ico';
import { decodePpm } from '../engines/ppm';
import { decodeTiffPages } from '../engines/tiff';
import { rasterizeSvg } from '../engines/svg';
import { extractJpegExifPayload, parseExifIfd } from '../exif/ifd';
import { applyOrientation, orientedDimensions } from '../exif/orientation';
import { probeDimensionsCheaply, exceedsPixelLimit } from '../validation/dimensions';
import { pixelLimitExceededError, frameLimitExceededError, rasterizeSizeMissingError } from '../errors';
import { LIMITS } from '../config/limits';

export interface DecodedImage {
  imageData: ImageData;
  metadata: DetectedMetadata;
  /** Roher EXIF-IFD-Payload, falls vorhanden — für optionales 1:1-Durchreichen bei JPEG-Zielen. */
  rawExifPayload: ArrayBuffer | null;
}

const JSQUASH_DECODE_FORMATS: readonly Format[] = ['jpeg', 'png', 'webp', 'avif', 'jxl'];

interface ExifProbeResult {
  orientation: number;
  hasGps: boolean;
  hasCameraInfo: boolean;
  hasDateTime: boolean;
  hasCopyright: boolean;
  hasSoftware: boolean;
  rawPayload: ArrayBuffer | null;
}

async function detectExifOrientation(blob: Blob, format: Format): Promise<ExifProbeResult> {
  const empty: ExifProbeResult = {
    orientation: 1,
    hasGps: false,
    hasCameraInfo: false,
    hasDateTime: false,
    hasCopyright: false,
    hasSoftware: false,
    rawPayload: null,
  };
  if (format !== 'jpeg') return empty;

  const buffer = await blob.arrayBuffer();
  const payload = extractJpegExifPayload(buffer);
  if (!payload) return empty;
  const parsed = parseExifIfd(payload);
  return { ...parsed, rawPayload: payload };
}

async function checkPixelLimit(blob: Blob): Promise<void> {
  const dims = await probeDimensionsCheaply(blob);
  if (dims && exceedsPixelLimit(dims, LIMITS.maxMegapixels)) {
    throw pixelLimitExceededError(dims.width, dims.height, LIMITS.maxMegapixels);
  }
}

async function decodeRaw(blob: Blob, format: Format, rasterizeSize?: { width: number; height: number }): Promise<ImageData> {
  switch (format) {
    case 'jpeg':
    case 'png':
    case 'webp':
      // Native Decodierung ist im Normalfall schneller; jsquash ist der Fallback,
      // falls createImageBitmap dieses konkrete Bild ablehnt (z. B. exotische Subsampling-Varianten).
      try {
        return await decodeNatively(blob);
      } catch {
        const buffer = await blob.arrayBuffer();
        return jsquashDecode(format as JsquashFormat, buffer);
      }
    case 'avif':
    case 'jxl': {
      try {
        return await decodeNatively(blob);
      } catch {
        const buffer = await blob.arrayBuffer();
        return jsquashDecode(format as JsquashFormat, buffer);
      }
    }
    case 'gif':
    case 'bmp':
      return decodeNatively(blob);
    case 'tiff': {
      const { pages, info } = await decodeTiffPages(blob);
      if (pages.length > LIMITS.maxFrames) {
        throw frameLimitExceededError(pages.length, LIMITS.maxFrames);
      }
      const first = pages[0];
      if (!first) {
        throw new ConversionError('CORRUPT_INPUT', 'Diese TIFF-Datei enthält keine lesbare Seite.', 'Prüfe die Datei in einem anderen Programm.');
      }
      void info;
      return first;
    }
    case 'ico':
      return decodeIco(blob);
    case 'ppm':
      return decodePpm(blob);
    case 'svg': {
      if (!rasterizeSize) throw rasterizeSizeMissingError();
      return rasterizeSvg(blob, rasterizeSize.width, rasterizeSize.height);
    }
  }
}

export async function decodeInput(blob: Blob, format: Format, rasterizeSize?: { width: number; height: number }): Promise<DecodedImage> {
  if (format !== 'svg') {
    await checkPixelLimit(blob);
  }

  const rawImageData = await decodeRaw(blob, format, rasterizeSize);
  const exif = await detectExifOrientation(blob, format);

  let imageData = rawImageData;
  if (exif.orientation !== 1 && (format === 'jpeg' || format === 'tiff')) {
    const oriented = orientedDimensions({ width: rawImageData.width, height: rawImageData.height }, exif.orientation);
    const canvas = new OffscreenCanvas(oriented.width, oriented.height);
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const bitmap = await createImageBitmap(rawImageData);
      applyOrientation(ctx, bitmap, rawImageData.width, rawImageData.height, exif.orientation);
      imageData = ctx.getImageData(0, 0, oriented.width, oriented.height);
    }
  }

  return {
    imageData,
    rawExifPayload: exif.rawPayload,
    metadata: {
      hasExif: exif.rawPayload !== null,
      hasIptc: false,
      hasXmp: false,
      hasGps: exif.hasGps,
      hasIccProfile: false,
      orientation: exif.orientation,
      width: imageData.width,
      height: imageData.height,
      frameCount: 1,
    },
  };
}
