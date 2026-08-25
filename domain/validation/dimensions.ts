/**
 * Dekompressionsbomben-Schutz (Kap. 7, SECURITY.md): Header parsen und
 * Pixelanzahl prüfen, BEVOR das Bild vollständig dekodiert wird.
 *
 * Für JPEG, PNG, GIF, BMP, WebP wird die Größe aus dem Header gelesen, ohne
 * die Bilddaten zu dekodieren. Für AVIF/JXL/TIFF ist ein vollständiger
 * Box-/IFD-Parser hier (noch) nicht implementiert — als Fallback wird
 * `createImageBitmap` mit einer konservativeren Vorabprüfung der Dateigröße
 * verwendet. Das ist eine dokumentierte Lücke, siehe RISKS.md.
 */

export interface ProbedDimensions {
  width: number;
  height: number;
}

async function readPrefix(input: Blob, bytes: number): Promise<DataView> {
  const slice = input.slice(0, bytes);
  const buf = await slice.arrayBuffer();
  return new DataView(buf);
}

function probeJpeg(view: DataView): ProbedDimensions | null {
  if (view.byteLength < 4 || view.getUint16(0) !== 0xffd8) return null;
  let offset = 2;
  while (offset + 9 < view.byteLength) {
    if (view.getUint8(offset) !== 0xff) {
      offset += 1;
      continue;
    }
    const marker = view.getUint8(offset + 1);
    // SOF0..SOF3, SOF5..SOF7, SOF9..SOF11, SOF13..SOF15 carry dimensions.
    const isSof =
      (marker >= 0xc0 && marker <= 0xc3) ||
      (marker >= 0xc5 && marker <= 0xc7) ||
      (marker >= 0xc9 && marker <= 0xcb) ||
      (marker >= 0xcd && marker <= 0xcf);
    if (isSof) {
      const height = view.getUint16(offset + 5);
      const width = view.getUint16(offset + 7);
      return { width, height };
    }
    if (marker === 0xd8 || marker === 0xd9) {
      offset += 2;
      continue;
    }
    const segmentLength = view.getUint16(offset + 2);
    offset += 2 + segmentLength;
  }
  return null;
}

function probePng(view: DataView): ProbedDimensions | null {
  if (view.byteLength < 24) return null;
  const isPng = view.getUint32(0) === 0x89504e47 && view.getUint32(4) === 0x0d0a1a0a;
  if (!isPng) return null;
  const width = view.getUint32(16);
  const height = view.getUint32(20);
  return { width, height };
}

function probeGif(view: DataView): ProbedDimensions | null {
  if (view.byteLength < 10) return null;
  const sig = String.fromCharCode(view.getUint8(0), view.getUint8(1), view.getUint8(2));
  if (sig !== 'GIF') return null;
  const width = view.getUint16(6, true);
  const height = view.getUint16(8, true);
  return { width, height };
}

function probeBmp(view: DataView): ProbedDimensions | null {
  if (view.byteLength < 26) return null;
  if (view.getUint8(0) !== 0x42 || view.getUint8(1) !== 0x4d) return null;
  const width = view.getInt32(18, true);
  const height = Math.abs(view.getInt32(22, true));
  return { width, height };
}

function probeWebp(view: DataView): ProbedDimensions | null {
  if (view.byteLength < 30) return null;
  const riff = String.fromCharCode(view.getUint8(0), view.getUint8(1), view.getUint8(2), view.getUint8(3));
  const webp = String.fromCharCode(view.getUint8(8), view.getUint8(9), view.getUint8(10), view.getUint8(11));
  if (riff !== 'RIFF' || webp !== 'WEBP') return null;
  const chunk = String.fromCharCode(view.getUint8(12), view.getUint8(13), view.getUint8(14), view.getUint8(15));
  if (chunk === 'VP8 ') {
    const width = view.getUint16(26, true) & 0x3fff;
    const height = view.getUint16(28, true) & 0x3fff;
    return { width, height };
  }
  if (chunk === 'VP8L') {
    const b0 = view.getUint8(21);
    const b1 = view.getUint8(22);
    const b2 = view.getUint8(23);
    const b3 = view.getUint8(24);
    const width = 1 + (((b1 & 0x3f) << 8) | b0);
    const height = 1 + (((b3 & 0x0f) << 10) | (b2 << 2) | ((b1 & 0xc0) >> 6));
    return { width, height };
  }
  if (chunk === 'VP8X') {
    const width = 1 + (view.getUint8(24) | (view.getUint8(25) << 8) | (view.getUint8(26) << 16));
    const height = 1 + (view.getUint8(27) | (view.getUint8(28) << 8) | (view.getUint8(29) << 16));
    return { width, height };
  }
  return null;
}

/**
 * Ermittelt Bildmaße ohne vollständige Dekodierung, wo ein Header-Parser
 * existiert. Gibt `null` zurück, wenn das Format hier (noch) nicht unterstützt
 * wird — der Aufrufer muss dann auf einen teureren Fallback ausweichen.
 */
export async function probeDimensionsCheaply(input: Blob): Promise<ProbedDimensions | null> {
  const view = await readPrefix(input, 64);
  return probeJpeg(view) ?? probePng(view) ?? probeGif(view) ?? probeBmp(view) ?? probeWebp(view);
}

export function exceedsPixelLimit(dims: ProbedDimensions, maxMegapixels: number): boolean {
  return (dims.width * dims.height) / 1_000_000 > maxMegapixels;
}
