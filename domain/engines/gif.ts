/**
 * GIF-Schreibpfad: kein Browser bietet GIF-Encoding über `convertToBlob` an,
 * daher ein eigener, minimaler GIF89a-Encoder (Median-Cut-Quantisierung +
 * LZW). Nur Einzelbild — animiertes GIF-Schreiben ist nicht Teil dieser
 * Phase (siehe RISKS.md).
 *
 * GIF-Lesen läuft über `createImageBitmap` (native-canvas-Engine); das liefert
 * nur den ersten Frame. Mehrere Frames einer animierten GIF-Quelle einzeln zu
 * extrahieren bräuchte einen eigenen GIF-Parser — ebenfalls nicht Teil dieser
 * Phase (siehe RISKS.md, „Frame-Strategie für GIF").
 */

interface Box {
  colors: [number, number, number][];
}

function medianCutQuantize(pixels: [number, number, number][], maxColors: number): [number, number, number][] {
  if (pixels.length <= maxColors) return pixels;

  const boxes: Box[] = [{ colors: pixels }];

  while (boxes.length < maxColors) {
    let boxToSplitIndex = -1;
    let largestRange = -1;
    let splitChannel: 0 | 1 | 2 = 0;

    for (let i = 0; i < boxes.length; i++) {
      const box = boxes[i]!;
      if (box.colors.length < 2) continue;
      for (const channel of [0, 1, 2] as const) {
        let min = 255;
        let max = 0;
        for (const c of box.colors) {
          if (c[channel] < min) min = c[channel];
          if (c[channel] > max) max = c[channel];
        }
        const range = max - min;
        if (range > largestRange) {
          largestRange = range;
          boxToSplitIndex = i;
          splitChannel = channel;
        }
      }
    }

    if (boxToSplitIndex === -1) break;

    const box = boxes[boxToSplitIndex]!;
    box.colors.sort((a, b) => a[splitChannel] - b[splitChannel]);
    const mid = Math.floor(box.colors.length / 2);
    const left: Box = { colors: box.colors.slice(0, mid) };
    const right: Box = { colors: box.colors.slice(mid) };
    boxes.splice(boxToSplitIndex, 1, left, right);
  }

  return boxes
    .filter((box) => box.colors.length > 0)
    .map((box) => {
      let r = 0;
      let g = 0;
      let b = 0;
      for (const c of box.colors) {
        r += c[0];
        g += c[1];
        b += c[2];
      }
      const n = box.colors.length;
      return [Math.round(r / n), Math.round(g / n), Math.round(b / n)] as [number, number, number];
    });
}

function nearestPaletteIndex(palette: [number, number, number][], r: number, g: number, b: number): number {
  let best = 0;
  let bestDist = Infinity;
  for (let i = 0; i < palette.length; i++) {
    const p = palette[i]!;
    const dr = p[0] - r;
    const dg = p[1] - g;
    const db = p[2] - b;
    const dist = dr * dr + dg * dg + db * db;
    if (dist < bestDist) {
      bestDist = dist;
      best = i;
    }
  }
  return best;
}

class LzwWriter {
  private readonly bytes: number[] = [];
  private currentByte = 0;
  private bitPos = 0;

  constructor(private readonly minCodeSize: number) {}

  writeCode(code: number, codeSize: number): void {
    for (let i = 0; i < codeSize; i++) {
      const bit = (code >> i) & 1;
      this.currentByte |= bit << this.bitPos;
      this.bitPos++;
      if (this.bitPos === 8) {
        this.bytes.push(this.currentByte);
        this.currentByte = 0;
        this.bitPos = 0;
      }
    }
  }

  flush(): Uint8Array {
    if (this.bitPos > 0) {
      this.bytes.push(this.currentByte);
    }
    return new Uint8Array(this.bytes);
  }

  get clearCode(): number {
    return 1 << this.minCodeSize;
  }

  get endCode(): number {
    return this.clearCode + 1;
  }
}

function lzwEncode(indices: Uint8Array, colorDepth: number): Uint8Array {
  const minCodeSize = Math.max(2, colorDepth);
  const writer = new LzwWriter(minCodeSize);
  const clearCode = writer.clearCode;
  const endCode = writer.endCode;

  let codeSize = minCodeSize + 1;
  let dict = new Map<string, number>();
  let nextCode = endCode + 1;

  const resetDict = (): void => {
    dict = new Map();
    for (let i = 0; i < clearCode; i++) dict.set(String(i), i);
    nextCode = endCode + 1;
    codeSize = minCodeSize + 1;
  };

  resetDict();
  writer.writeCode(clearCode, codeSize);

  let current = String(indices[0]);
  for (let i = 1; i < indices.length; i++) {
    const next = String(indices[i]);
    const combined = `${current},${next}`;
    if (dict.has(combined)) {
      current = combined;
      continue;
    }
    writer.writeCode(dict.get(current)!, codeSize);
    dict.set(combined, nextCode);
    nextCode++;
    if (nextCode > (1 << codeSize) - 1) {
      codeSize++;
      if (codeSize > 12) {
        writer.writeCode(clearCode, codeSize - 1);
        resetDict();
      }
    }
    current = next;
  }
  writer.writeCode(dict.get(current)!, codeSize);
  writer.writeCode(endCode, codeSize);

  return writer.flush();
}

function packDataSubBlocks(data: Uint8Array): Uint8Array {
  const blocks: number[] = [];
  for (let offset = 0; offset < data.length; offset += 255) {
    const chunk = data.subarray(offset, Math.min(offset + 255, data.length));
    blocks.push(chunk.length, ...Array.from(chunk));
  }
  blocks.push(0);
  return new Uint8Array(blocks);
}

export function encodeGif(imageData: ImageData): Blob {
  const { width, height, data } = imageData;
  const hasAlpha = (() => {
    for (let i = 3; i < data.length; i += 4) {
      if ((data[i] ?? 255) < 128) return true;
    }
    return false;
  })();

  const pixels: [number, number, number][] = [];
  for (let i = 0; i < data.length; i += 4) {
    pixels.push([data[i] ?? 0, data[i + 1] ?? 0, data[i + 2] ?? 0]);
  }

  const maxColors = hasAlpha ? 255 : 256;
  let palette = medianCutQuantize(pixels, maxColors);
  if (palette.length === 0) palette = [[0, 0, 0]];

  const transparentIndex = hasAlpha ? palette.length : -1;
  const effectivePaletteSize = hasAlpha ? palette.length + 1 : palette.length;
  const colorDepth = Math.max(1, Math.ceil(Math.log2(Math.max(2, effectivePaletteSize))));
  const paletteEntries = 1 << colorDepth;

  const indices = new Uint8Array(width * height);
  for (let i = 0; i < width * height; i++) {
    const alpha = data[i * 4 + 3] ?? 255;
    if (hasAlpha && alpha < 128) {
      indices[i] = transparentIndex;
    } else {
      const [r, g, b] = pixels[i]!;
      indices[i] = nearestPaletteIndex(palette, r, g, b);
    }
  }

  const bytes: number[] = [];
  const pushStr = (s: string) => { for (let i = 0; i < s.length; i++) bytes.push(s.charCodeAt(i)); };
  const push16 = (n: number) => { bytes.push(n & 0xff, (n >> 8) & 0xff); };

  pushStr('GIF89a');
  push16(width);
  push16(height);
  // Global Color Table Flag=1, Color Resolution=colorDepth-1, Sort=0, Size=colorDepth-1
  bytes.push(0x80 | ((colorDepth - 1) << 4) | (colorDepth - 1));
  bytes.push(0); // Background color index
  bytes.push(0); // Pixel aspect ratio

  for (let i = 0; i < paletteEntries; i++) {
    const c = palette[i] ?? [0, 0, 0];
    bytes.push(c[0], c[1], c[2]);
  }

  if (hasAlpha) {
    // Graphic Control Extension für Transparenz
    bytes.push(0x21, 0xf9, 0x04);
    bytes.push(0x01); // Transparency flag gesetzt
    push16(0);
    bytes.push(transparentIndex);
    bytes.push(0);
  }

  // Image Descriptor
  bytes.push(0x2c);
  push16(0);
  push16(0);
  push16(width);
  push16(height);
  bytes.push(0); // keine lokale Farbtabelle

  bytes.push(colorDepth); // LZW minimum code size
  const compressed = lzwEncode(indices, colorDepth);
  const subBlocks = packDataSubBlocks(compressed);
  bytes.push(...Array.from(subBlocks));

  bytes.push(0x3b); // Trailer

  return new Blob([new Uint8Array(bytes)], { type: 'image/gif' });
}
