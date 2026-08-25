import type { ConvertOptions, DetectedMetadata, Format } from '../types';
import { abortedError, unknownError } from '../errors';
import { decodeInput } from './decode';
import { applyGeometry } from './transform';
import { encodeOutput } from './encode';

export { computeTargetSize } from './transform';

export interface ConvertResult {
  blob: Blob;
  metadata: DetectedMetadata;
  durationMs: number;
}

export function defaultConvertOptions(dst: Format): ConvertOptions {
  return {
    dst,
    quality: 90,
    chromaSubsampling: '4:2:0',
    progressive: true,
    resize: { mode: 'none', keepAspectRatio: true, allowUpscale: false },
    colorSpace: 'srgb',
    iccPolicy: 'strip',
    metadata: {
      exif: false,
      iptc: false,
      xmp: false,
      gps: false,
      cameraInfo: false,
      dateTime: false,
      copyright: false,
      author: false,
      software: false,
    },
    backgroundColor: '#ffffff',
    frameStrategy: 'first-frame',
  };
}

function throwIfAborted(signal: AbortSignal): void {
  if (signal.aborted) throw abortedError();
}

export async function convertFile(input: Blob, src: Format, opts: ConvertOptions, signal: AbortSignal): Promise<ConvertResult> {
  const start = performance.now();
  try {
    throwIfAborted(signal);
    const { imageData, metadata, rawExifPayload } = await decodeInput(input, src, opts.rasterizeSize);

    throwIfAborted(signal);
    const transformed = await applyGeometry(imageData, {
      rotate: opts.rotate,
      flipHorizontal: opts.flipHorizontal,
      flipVertical: opts.flipVertical,
      crop: opts.crop,
      resize: opts.resize,
    });

    throwIfAborted(signal);
    const blob = await encodeOutput(transformed, opts.dst, opts, src === 'jpeg' ? rawExifPayload : null);

    return {
      blob,
      metadata: { ...metadata, width: transformed.width, height: transformed.height },
      durationMs: performance.now() - start,
    };
  } catch (error) {
    if (error instanceof Error && error.name === 'ConversionError') throw error;
    throw unknownError(error);
  }
}
