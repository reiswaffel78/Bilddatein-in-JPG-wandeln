import { describe, it, expect } from 'vitest';
import { LIMITS } from '../../domain/config/limits';

describe('LIMITS', () => {
  it('definiert ein positives Megapixel-Limit', () => {
    expect(LIMITS.maxMegapixels).toBeGreaterThan(0);
  });

  it('begrenzt die Worker-Pool-Größe auf maximal 4', () => {
    expect(LIMITS.maxWorkerPoolSize).toBe(4);
  });

  it('definiert Speicher-Schätzfaktoren für alle drei memoryClass-Stufen', () => {
    expect(LIMITS.memoryEstimateFactor.low).toBeLessThan(LIMITS.memoryEstimateFactor.medium);
    expect(LIMITS.memoryEstimateFactor.medium).toBeLessThan(LIMITS.memoryEstimateFactor.high);
  });
});
