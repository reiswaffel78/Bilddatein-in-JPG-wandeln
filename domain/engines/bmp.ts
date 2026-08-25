import { ConversionError } from '../types';

/**
 * BMP wird von keinem gängigen Browser über `OffscreenCanvas.convertToBlob`
 * geschrieben — daher ein minimaler, unkomprimierter 32-bpp-Encoder in
 * reinem TypeScript, ohne WASM (Kap. 4: keine Engine ohne dokumentierten Grund
 * für einen Pfad, den bereits eine andere abdeckt — hier deckt keine andere
 * Engine BMP-Schreiben ab).
 *
 * Lesen von BMP läuft über `createImageBitmap` (native-canvas-Engine), das
 * decodiert unkomprimierte wie einfache RLE-BMP-Dateien in allen gängigen
 * Browsern zuverlässig. Der Decoder hier wird nur für ICO-Einträge gebraucht,
 * die eine headerlose DIB-Struktur (ohne BITMAPFILEHEADER) enthalten.
 */

export function encodeBmp(imageData: ImageData): Blob {
  const { width, height, data } = imageData;
  const rowSize = width * 4;
  const pixelArraySize = rowSize * height;
  const fileHeaderSize = 14;
  const dibHeaderSize = 40;
  const fileSize = fileHeaderSize + dibHeaderSize + pixelArraySize;

  const buffer = new ArrayBuffer(fileSize);
  const view = new DataView(buffer);

  // BITMAPFILEHEADER
  view.setUint8(0, 0x42); // 'B'
  view.setUint8(1, 0x4d); // 'M'
  view.setUint32(2, fileSize, true);
  view.setUint32(6, 0, true);
  view.setUint32(10, fileHeaderSize + dibHeaderSize, true);

  // BITMAPINFOHEADER
  view.setUint32(14, dibHeaderSize, true);
  view.setInt32(18, width, true);
  view.setInt32(22, height, true); // positiv = bottom-up
  view.setUint16(26, 1, true); // planes
  view.setUint16(28, 32, true); // bpp
  view.setUint32(30, 0, true); // BI_RGB, keine Kompression
  view.setUint32(34, pixelArraySize, true);
  view.setInt32(38, 2835, true); // ~72 DPI
  view.setInt32(42, 2835, true);
  view.setUint32(46, 0, true);
  view.setUint32(50, 0, true);

  // Pixel-Array: BGRA, bottom-up, keine Padding nötig bei 32bpp (Zeilen sind durch 4 teilbar).
  const pixelOffset = fileHeaderSize + dibHeaderSize;
  for (let y = 0; y < height; y++) {
    const srcRow = height - 1 - y; // Quelle ist top-down (ImageData), Ziel ist bottom-up.
    for (let x = 0; x < width; x++) {
      const srcIdx = (srcRow * width + x) * 4;
      const dstIdx = pixelOffset + y * rowSize + x * 4;
      view.setUint8(dstIdx + 0, data[srcIdx + 2] ?? 0); // B
      view.setUint8(dstIdx + 1, data[srcIdx + 1] ?? 0); // G
      view.setUint8(dstIdx + 2, data[srcIdx + 0] ?? 0); // R
      view.setUint8(dstIdx + 3, data[srcIdx + 3] ?? 0); // A
    }
  }

  return new Blob([buffer], { type: 'image/bmp' });
}

/**
 * Decodiert eine headerlose DIB-Struktur (wie sie ICO-Einträge enthalten):
 * BITMAPINFOHEADER direkt gefolgt vom Pixel-Array (inkl. AND-Maske bei <32bpp
 * mit Transparenz). Unterstützt 32bpp (BGRA) und 24bpp (BGR + implizite AND-Maske).
 */
export function decodeBmpDib(view: DataView, offset: number): ImageData {
  const dibHeaderSize = view.getUint32(offset, true);
  const width = view.getInt32(offset + 4, true);
  const rawHeight = view.getInt32(offset + 8, true);
  const bpp = view.getUint16(offset + 14, true);
  const compression = view.getUint32(offset + 16, true);

  if (compression !== 0) {
    throw new ConversionError(
      'CORRUPT_INPUT',
      'Diese ICO-Datei enthält ein komprimiertes BMP-Element, das dieser einfache Decoder nicht unterstützt.',
      'Versuche eine andere ICO-Datei oder exportiere das Icon erneut ohne Kompression.',
    );
  }

  // Bei ICO-Einträgen ist die im Header angegebene Höhe die Summe aus XOR- und AND-Maske (doppelt).
  const height = Math.abs(rawHeight) / 2;
  const pixelStart = offset + dibHeaderSize;
  const rowSize32 = Math.ceil((width * bpp) / 32) * 4;

  const out = new Uint8ClampedArray(width * height * 4);

  if (bpp === 32) {
    for (let y = 0; y < height; y++) {
      const srcRow = height - 1 - y;
      for (let x = 0; x < width; x++) {
        const srcIdx = pixelStart + srcRow * rowSize32 + x * 4;
        const dstIdx = (y * width + x) * 4;
        out[dstIdx + 0] = view.getUint8(srcIdx + 2);
        out[dstIdx + 1] = view.getUint8(srcIdx + 1);
        out[dstIdx + 2] = view.getUint8(srcIdx + 0);
        out[dstIdx + 3] = view.getUint8(srcIdx + 3);
      }
    }
  } else if (bpp === 24) {
    for (let y = 0; y < height; y++) {
      const srcRow = height - 1 - y;
      for (let x = 0; x < width; x++) {
        const srcIdx = pixelStart + srcRow * rowSize32 + x * 3;
        const dstIdx = (y * width + x) * 4;
        out[dstIdx + 0] = view.getUint8(srcIdx + 2);
        out[dstIdx + 1] = view.getUint8(srcIdx + 1);
        out[dstIdx + 2] = view.getUint8(srcIdx + 0);
        out[dstIdx + 3] = 255;
      }
    }
  } else {
    throw new ConversionError(
      'CORRUPT_INPUT',
      `Diese ICO-Datei nutzt ${bpp} Bit pro Pixel, unterstützt werden nur 24 und 32 Bit.`,
      'Exportiere das Icon in einem gängigen Editor mit 24 oder 32 Bit pro Pixel neu.',
    );
  }

  return new ImageData(out, width, height);
}
