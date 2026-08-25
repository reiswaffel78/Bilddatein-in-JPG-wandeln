import type { Capability, ConversionType, Format } from '../types';
import { TIER1_READ_ONLY, TIER1_READ_WRITE } from '../types';
import { probeNativeDecodeSupport } from './probe';
import { readCachedMatrix, writeCachedMatrix } from './cache';

const WRITER_ENGINE: Record<Format, string> = {
  jpeg: 'jsquash',
  png: 'jsquash',
  webp: 'jsquash',
  avif: 'jsquash',
  jxl: 'jsquash',
  gif: 'gif',
  bmp: 'bmp',
  tiff: 'tiff',
  ico: 'none',
  svg: 'none',
  ppm: 'none',
};

const LOSSY_DST: Partial<Record<Format, boolean>> = {
  jpeg: true,
  webp: true,
  avif: true,
  jxl: true,
  gif: true,
  png: false,
  bmp: false,
  tiff: false,
};

const ALPHA_DST: Partial<Record<Format, boolean>> = {
  jpeg: false,
  png: true,
  webp: true,
  avif: true,
  jxl: true,
  gif: true,
  bmp: true,
  tiff: true,
};

const MEMORY_CLASS: Partial<Record<Format, Capability['memoryClass']>> = {
  jpeg: 'medium',
  png: 'medium',
  webp: 'medium',
  avif: 'high',
  jxl: 'high',
  gif: 'low',
  bmp: 'low',
  tiff: 'low',
};

function writerType(src: Format): ConversionType {
  if (src === 'svg') return 'rasterize';
  return 'native';
}

/**
 * Baut die Laufzeit-Capability-Matrix aus dem tatsächlichen Probe-Ergebnis
 * (Kap. 5). Für Tier 1 bedeutet das: die Schreib-Engines (jsquash, eigener
 * GIF/BMP/TIFF-Code) sind reines WASM/JS ohne Browser-Abhängigkeit und daher
 * immer verfügbar; die native-Decode-Probe bestimmt nur, ob GIF und BMP
 * überhaupt als Quellformat gelesen werden können — für JPEG/PNG/WebP greift
 * bei fehlender nativer Decodierung automatisch der jsquash-Decoder.
 */
export async function buildCapabilityMatrix(useCache = true): Promise<Capability[]> {
  if (useCache) {
    const cached = readCachedMatrix();
    if (cached) return cached;
  }

  const nativeSupport = await probeNativeDecodeSupport();

  const availableSrc: Format[] = TIER1_READ_WRITE.filter((format) => {
    if (format === 'gif') return nativeSupport.gif;
    if (format === 'bmp') return nativeSupport.bmp;
    return true; // jpeg/png/webp/avif/jxl/tiff: jsquash bzw. UTIF unabhängig von nativer Unterstützung
  });

  const matrix: Capability[] = [];

  for (const src of availableSrc) {
    for (const dst of TIER1_READ_WRITE) {
      // src === dst wird bewusst mit aufgenommen: erneutes Encodieren im selben
      // Format (z. B. nur Resize oder Qualität ändern) ist ein legitimer Fall,
      // kein reiner "Konvertierungs"-Zwang (Kap. 10, Advanced-Optionen).
      matrix.push({
        src,
        dst,
        type: writerType(src),
        engine: WRITER_ENGINE[dst],
        lossy: LOSSY_DST[dst] ?? true,
        alpha: ALPHA_DST[dst] ?? false,
        animated: false,
        // EXIF-Durchreichen ist nur für JPEG→JPEG implementiert (kompletter Block, keine Feldfilterung), siehe RISKS.md.
        metadata: src === 'jpeg' && dst === 'jpeg',
        tier: 1,
        memoryClass: MEMORY_CLASS[dst] ?? 'medium',
      });
    }
  }

  for (const src of TIER1_READ_ONLY) {
    for (const dst of TIER1_READ_WRITE) {
      matrix.push({
        src,
        dst,
        type: writerType(src),
        engine: WRITER_ENGINE[dst],
        lossy: LOSSY_DST[dst] ?? true,
        alpha: ALPHA_DST[dst] ?? false,
        animated: false,
        metadata: false,
        tier: 1,
        memoryClass: MEMORY_CLASS[dst] ?? 'medium',
      });
    }
  }

  writeCachedMatrix(matrix);
  return matrix;
}

export function findCapability(matrix: Capability[], src: Format, dst: Format): Capability | undefined {
  return matrix.find((c) => c.src === src && c.dst === dst);
}

export function availableTargetsFor(matrix: Capability[], src: Format): Format[] {
  return matrix.filter((c) => c.src === src).map((c) => c.dst);
}
