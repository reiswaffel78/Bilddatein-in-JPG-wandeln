import { describe, it, expect } from 'vitest';
import { computeTargetSize } from '../../domain/convert/transform';
import type { ResizeOptions } from '../../domain/types';

const source = { width: 1000, height: 500 };

function resize(overrides: Partial<ResizeOptions>): ResizeOptions {
  return { mode: 'none', keepAspectRatio: true, allowUpscale: false, ...overrides };
}

describe('computeTargetSize', () => {
  it('gibt die Originalgröße zurück, wenn mode "none" ist', () => {
    expect(computeTargetSize(source, resize({ mode: 'none' }))).toEqual(source);
  });

  it('skaliert nach Breite mit erhaltenem Seitenverhältnis', () => {
    expect(computeTargetSize(source, resize({ mode: 'width', value: 500 }))).toEqual({ width: 500, height: 250 });
  });

  it('skaliert nach Prozent', () => {
    expect(computeTargetSize(source, resize({ mode: 'percent', value: 50 }))).toEqual({ width: 500, height: 250 });
  });

  it('max-width greift nur, wenn das Bild größer ist', () => {
    expect(computeTargetSize(source, resize({ mode: 'max-width', value: 2000 }))).toEqual(source);
    expect(computeTargetSize(source, resize({ mode: 'max-width', value: 800 }))).toEqual({ width: 800, height: 400 });
  });

  it('verhindert Vergrößern, wenn allowUpscale false ist', () => {
    expect(computeTargetSize(source, resize({ mode: 'width', value: 2000, allowUpscale: false }))).toEqual(source);
  });

  it('erlaubt Vergrößern, wenn allowUpscale true ist', () => {
    expect(computeTargetSize(source, resize({ mode: 'width', value: 2000, allowUpscale: true }))).toEqual({ width: 2000, height: 1000 });
  });

  it('long-edge skaliert die längere Kante', () => {
    expect(computeTargetSize(source, resize({ mode: 'long-edge', value: 400 }))).toEqual({ width: 400, height: 200 });
  });

  it('short-edge skaliert die kürzere Kante', () => {
    expect(computeTargetSize(source, resize({ mode: 'short-edge', value: 250 }))).toEqual({ width: 500, height: 250 });
  });
});
