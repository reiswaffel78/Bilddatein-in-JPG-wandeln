import { describe, it, expect } from 'vitest';
import { parseExifIfd } from '../../domain/exif/ifd';
import { orientedDimensions } from '../../domain/exif/orientation';

function buildMinimalIfd(orientationValue: number): ArrayBuffer {
  const buffer = new ArrayBuffer(26);
  const view = new DataView(buffer);
  view.setUint8(0, 0x49); // 'I'
  view.setUint8(1, 0x49); // 'I'
  view.setUint16(2, 42, true);
  view.setUint32(4, 8, true); // Offset zum ersten IFD

  view.setUint16(8, 1, true); // 1 Eintrag
  view.setUint16(10, 0x0112, true); // Tag: Orientation
  view.setUint16(12, 3, true); // Typ: SHORT
  view.setUint32(14, 1, true); // Count
  view.setUint16(18, orientationValue, true); // Wert (linksbündig im 4-Byte-Feld)
  view.setUint32(22, 0, true); // kein weiteres IFD

  return buffer;
}

describe('parseExifIfd', () => {
  it('liest den Orientation-Tag aus einem minimalen IFD', () => {
    const parsed = parseExifIfd(buildMinimalIfd(6));
    expect(parsed.orientation).toBe(6);
  });

  it('gibt Orientation 1 (normal) zurück, wenn kein gültiger Header vorliegt', () => {
    const parsed = parseExifIfd(new ArrayBuffer(4));
    expect(parsed.orientation).toBe(1);
  });
});

describe('orientedDimensions', () => {
  it('tauscht Breite/Höhe bei Orientation 6 (90°)', () => {
    expect(orientedDimensions({ width: 800, height: 600 }, 6)).toEqual({ width: 600, height: 800 });
  });

  it('lässt Breite/Höhe bei Orientation 1 unverändert', () => {
    expect(orientedDimensions({ width: 800, height: 600 }, 1)).toEqual({ width: 800, height: 600 });
  });
});
