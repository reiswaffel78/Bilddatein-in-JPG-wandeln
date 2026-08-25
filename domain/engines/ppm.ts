import { ConversionError } from '../types';

/**
 * PPM/PGM/PBM sind nur-Lesen (Kap. 6). Reiner Text-/Binär-Parser, kein WASM nötig —
 * das Format ist trivial genug, dass eine Engine dafür unverhältnismäßig wäre.
 */

class Tokenizer {
  private pos = 0;
  constructor(private readonly bytes: Uint8Array) {}

  private skipWhitespaceAndComments(): void {
    while (this.pos < this.bytes.length) {
      const byte = this.bytes[this.pos];
      if (byte === 0x23) {
        // '#' Kommentar bis Zeilenende
        while (this.pos < this.bytes.length && this.bytes[this.pos] !== 0x0a) this.pos++;
      } else if (byte === 0x20 || byte === 0x09 || byte === 0x0a || byte === 0x0d) {
        this.pos++;
      } else {
        break;
      }
    }
  }

  nextToken(): string {
    this.skipWhitespaceAndComments();
    const start = this.pos;
    while (this.pos < this.bytes.length) {
      const byte = this.bytes[this.pos];
      if (byte === 0x20 || byte === 0x09 || byte === 0x0a || byte === 0x0d) break;
      this.pos++;
    }
    return String.fromCharCode(...Array.from(this.bytes.slice(start, this.pos)));
  }

  nextInt(): number {
    return parseInt(this.nextToken(), 10);
  }

  /** Position direkt nach dem letzten gelesenen Whitespace-Zeichen (für Binärdaten). */
  get bodyStart(): number {
    return this.pos + 1;
  }

  get position(): number {
    return this.pos;
  }
}

export async function decodePpm(blob: Blob): Promise<ImageData> {
  const buffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  const tokenizer = new Tokenizer(bytes);

  const magic = tokenizer.nextToken();
  const width = tokenizer.nextInt();
  const height = tokenizer.nextInt();

  if (!width || !height || width <= 0 || height <= 0) {
    throw new ConversionError('CORRUPT_INPUT', 'Diese PPM/PGM/PBM-Datei hat keine gültigen Bildmaße im Header.', 'Prüfe die Datei in einem anderen Programm.');
  }

  const out = new Uint8ClampedArray(width * height * 4);

  if (magic === 'P1' || magic === 'P4') {
    // Bitonal: 0 = schwarz, 1 = weiß (P1 ASCII) — P4 Binär wird hier nicht unterstützt (Bit-Packing).
    if (magic === 'P4') {
      throw new ConversionError(
        'CORRUPT_INPUT',
        'Binäre PBM-Dateien (P4) werden aktuell nicht unterstützt, nur die ASCII-Variante (P1).',
        'Exportiere die Datei im ASCII-PBM-Format (P1) oder als PGM/PPM.',
      );
    }
    for (let i = 0; i < width * height; i++) {
      const bit = tokenizer.nextInt();
      const value = bit === 0 ? 255 : 0;
      out[i * 4] = value;
      out[i * 4 + 1] = value;
      out[i * 4 + 2] = value;
      out[i * 4 + 3] = 255;
    }
    return new ImageData(out, width, height);
  }

  const maxVal = tokenizer.nextInt();
  const scale = 255 / maxVal;

  if (magic === 'P2') {
    for (let i = 0; i < width * height; i++) {
      const value = Math.round(tokenizer.nextInt() * scale);
      out[i * 4] = value;
      out[i * 4 + 1] = value;
      out[i * 4 + 2] = value;
      out[i * 4 + 3] = 255;
    }
    return new ImageData(out, width, height);
  }

  if (magic === 'P3') {
    for (let i = 0; i < width * height; i++) {
      out[i * 4] = Math.round(tokenizer.nextInt() * scale);
      out[i * 4 + 1] = Math.round(tokenizer.nextInt() * scale);
      out[i * 4 + 2] = Math.round(tokenizer.nextInt() * scale);
      out[i * 4 + 3] = 255;
    }
    return new ImageData(out, width, height);
  }

  if (magic === 'P6') {
    const bodyStart = tokenizer.bodyStart;
    for (let i = 0; i < width * height; i++) {
      const srcIdx = bodyStart + i * 3;
      out[i * 4] = Math.round((bytes[srcIdx] ?? 0) * scale);
      out[i * 4 + 1] = Math.round((bytes[srcIdx + 1] ?? 0) * scale);
      out[i * 4 + 2] = Math.round((bytes[srcIdx + 2] ?? 0) * scale);
      out[i * 4 + 3] = 255;
    }
    return new ImageData(out, width, height);
  }

  if (magic === 'P5') {
    const bodyStart = tokenizer.bodyStart;
    for (let i = 0; i < width * height; i++) {
      const value = Math.round((bytes[bodyStart + i] ?? 0) * scale);
      out[i * 4] = value;
      out[i * 4 + 1] = value;
      out[i * 4 + 2] = value;
      out[i * 4 + 3] = 255;
    }
    return new ImageData(out, width, height);
  }

  throw new ConversionError('CORRUPT_INPUT', `Unbekanntes PNM-Magic "${magic}".`, 'Prüfe, ob die Datei tatsächlich im PPM/PGM/PBM-Format vorliegt.');
}
