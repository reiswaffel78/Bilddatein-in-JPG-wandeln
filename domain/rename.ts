import type { Format } from './types';

/**
 * Batch-Rename mit Variablen {name} {counter} {date} {width} {height} {format}
 * (Kap. 10). Reine Funktion, unabhängig von der UI testbar (Kap. 18).
 */
export interface RenameContext {
  name: string; // Originalname ohne Endung
  counter: number;
  date: Date;
  width: number;
  height: number;
  format: Format;
}

function pad(n: number, width: number): string {
  return String(n).padStart(width, '0');
}

function formatDate(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1, 2)}-${pad(date.getDate(), 2)}`;
}

const EXTENSION_FOR_FORMAT: Record<Format, string> = {
  jpeg: 'jpg',
  png: 'png',
  webp: 'webp',
  avif: 'avif',
  tiff: 'tiff',
  gif: 'gif',
  bmp: 'bmp',
  jxl: 'jxl',
  ico: 'ico',
  svg: 'svg',
  ppm: 'ppm',
};

export function applyRenamePattern(pattern: string, ctx: RenameContext, counterDigits = 3): string {
  const replaced = pattern
    .replace(/\{name\}/g, ctx.name)
    .replace(/\{counter\}/g, pad(ctx.counter, counterDigits))
    .replace(/\{date\}/g, formatDate(ctx.date))
    .replace(/\{width\}/g, String(ctx.width))
    .replace(/\{height\}/g, String(ctx.height))
    .replace(/\{format\}/g, ctx.format);

  return `${replaced}.${EXTENSION_FOR_FORMAT[ctx.format]}`;
}

export function stripExtension(filename: string): string {
  return filename.includes('.') ? filename.substring(0, filename.lastIndexOf('.')) : filename;
}
