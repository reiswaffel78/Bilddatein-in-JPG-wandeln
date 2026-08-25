import { describe, it, expect } from 'vitest';
import { recommendTarget } from '../../domain/recommend';
import type { Capability } from '../../domain/types';

function cap(src: Capability['src'], dst: Capability['dst']): Capability {
  return { src, dst, type: 'native', engine: 'jsquash', lossy: true, alpha: true, animated: false, metadata: false, tier: 1, memoryClass: 'medium' };
}

describe('recommendTarget', () => {
  it('empfiehlt JPEG, wenn verfügbar', () => {
    const matrix = [cap('png', 'jpeg'), cap('png', 'webp')];
    expect(recommendTarget('png', matrix)).toEqual({ dst: 'jpeg', quality: 90 });
  });

  it('empfiehlt WebP, wenn JPEG nicht verfügbar ist', () => {
    const matrix = [cap('avif', 'webp'), cap('avif', 'png')];
    expect(recommendTarget('avif', matrix)).toEqual({ dst: 'webp', quality: 90 });
  });

  it('fällt auf das erste verfügbare Format zurück, wenn keine Präferenz passt', () => {
    const matrix = [cap('tiff', 'bmp')];
    expect(recommendTarget('tiff', matrix)).toEqual({ dst: 'bmp', quality: 90 });
  });

  it('gibt PNG mit Qualität 100 zurück, wenn nur PNG in der Präferenzliste verfügbar ist', () => {
    const matrix = [cap('bmp', 'png')];
    expect(recommendTarget('bmp', matrix)).toEqual({ dst: 'png', quality: 100 });
  });
});
