import { describe, it, expect } from 'vitest';
import { applyRenamePattern, stripExtension } from '../../domain/rename';

describe('applyRenamePattern', () => {
  const baseCtx = {
    name: 'urlaubsfoto',
    counter: 1,
    date: new Date(2026, 0, 5),
    width: 1920,
    height: 1080,
    format: 'jpeg' as const,
  };

  it('ersetzt alle Variablen und hängt die richtige Endung an', () => {
    const result = applyRenamePattern('{name}_{counter}_{date}_{width}x{height}', baseCtx);
    expect(result).toBe('urlaubsfoto_001_2026-01-05_1920x1080.jpg');
  });

  it('nutzt die konfigurierbare Zähler-Stellenzahl', () => {
    const result = applyRenamePattern('{name}-{counter}', baseCtx, 5);
    expect(result).toBe('urlaubsfoto-00001.jpg');
  });

  it('hängt für jedes Format die passende Endung an', () => {
    expect(applyRenamePattern('{name}', { ...baseCtx, format: 'webp' })).toBe('urlaubsfoto.webp');
    expect(applyRenamePattern('{name}', { ...baseCtx, format: 'tiff' })).toBe('urlaubsfoto.tiff');
  });

  it('lässt ein Pattern ohne Variablen unverändert (außer Endung)', () => {
    expect(applyRenamePattern('konstant', baseCtx)).toBe('konstant.jpg');
  });
});

describe('stripExtension', () => {
  it('entfernt die letzte Dateiendung', () => {
    expect(stripExtension('foto.bild.jpg')).toBe('foto.bild');
  });

  it('gibt den Namen unverändert zurück, wenn keine Endung vorhanden ist', () => {
    expect(stripExtension('foto')).toBe('foto');
  });
});
