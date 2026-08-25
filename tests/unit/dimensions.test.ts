// @vitest-environment node
// jsdoms Blob-Polyfill implementiert `.slice().arrayBuffer()` nicht vollständig;
// Node bringt eine spezifikationskonforme Blob-Implementierung mit, die für
// diesen reinen Byte-Parsing-Test ausreicht (kein DOM nötig).
import { describe, it, expect } from 'vitest';
import { probeDimensionsCheaply, exceedsPixelLimit } from '../../domain/validation/dimensions';

function pngHeader(width: number, height: number): Uint8Array {
  const bytes = new Uint8Array(24);
  const view = new DataView(bytes.buffer);
  view.setUint32(0, 0x89504e47);
  view.setUint32(4, 0x0d0a1a0a);
  view.setUint32(16, width);
  view.setUint32(20, height);
  return bytes;
}

function bmpHeader(width: number, height: number): Uint8Array {
  const bytes = new Uint8Array(26);
  const view = new DataView(bytes.buffer);
  view.setUint8(0, 0x42);
  view.setUint8(1, 0x4d);
  view.setInt32(18, width, true);
  view.setInt32(22, height, true);
  return bytes;
}

function gifHeader(width: number, height: number): Uint8Array {
  const bytes = new Uint8Array(10);
  bytes.set([0x47, 0x49, 0x46], 0);
  const view = new DataView(bytes.buffer);
  view.setUint16(6, width, true);
  view.setUint16(8, height, true);
  return bytes;
}

describe('probeDimensionsCheaply', () => {
  it('liest Breite/Höhe aus einem PNG-Header', async () => {
    const blob = new Blob([Buffer.from(pngHeader(1920, 1080))]);
    await expect(probeDimensionsCheaply(blob)).resolves.toEqual({ width: 1920, height: 1080 });
  });

  it('liest Breite/Höhe aus einem BMP-Header', async () => {
    const blob = new Blob([Buffer.from(bmpHeader(640, 480))]);
    await expect(probeDimensionsCheaply(blob)).resolves.toEqual({ width: 640, height: 480 });
  });

  it('liest Breite/Höhe aus einem GIF-Header', async () => {
    const blob = new Blob([Buffer.from(gifHeader(320, 240))]);
    await expect(probeDimensionsCheaply(blob)).resolves.toEqual({ width: 320, height: 240 });
  });

  it('gibt null zurück für ein unbekanntes/zu kurzes Format', async () => {
    const blob = new Blob([new Uint8Array(4)]);
    await expect(probeDimensionsCheaply(blob)).resolves.toBeNull();
  });
});

describe('exceedsPixelLimit', () => {
  it('erkennt eine Dekompressionsbombe über dem Limit', () => {
    expect(exceedsPixelLimit({ width: 50000, height: 50000 }, 256)).toBe(true);
  });

  it('lässt normale Bildgrößen unter dem Limit durch', () => {
    expect(exceedsPixelLimit({ width: 1920, height: 1080 }, 256)).toBe(false);
  });
});
