import type { Format } from './types';

/**
 * Formaterkennung anhand von Magic Bytes — nicht anhand der Dateiendung
 * (Kap. 7: MIME-Mismatch-Prüfung braucht einen davon unabhängigen echten Check).
 */
export async function detectFormat(input: Blob): Promise<Format | null> {
  const head = new Uint8Array(await input.slice(0, 32).arrayBuffer());
  const str = (start: number, len: number): string =>
    String.fromCharCode(...Array.from(head.slice(start, start + len)));

  if (head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff) return 'jpeg';
  if (head[0] === 0x89 && head[1] === 0x50 && head[2] === 0x4e && head[3] === 0x47) return 'png';
  if (str(0, 4) === 'RIFF' && str(8, 4) === 'WEBP') return 'webp';
  if (str(0, 3) === 'GIF') return 'gif';
  if (head[0] === 0x42 && head[1] === 0x4d) return 'bmp';
  if (str(4, 4) === 'ftyp') {
    const brand = str(8, 4);
    if (brand.startsWith('avif') || brand.startsWith('avis')) return 'avif';
  }
  if (
    (head[0] === 0x49 && head[1] === 0x49 && head[2] === 0x2a && head[3] === 0x00) ||
    (head[0] === 0x4d && head[1] === 0x4d && head[2] === 0x00 && head[3] === 0x2a)
  ) {
    return 'tiff';
  }
  if (head[0] === 0x00 && head[1] === 0x00 && head[2] === 0x01 && head[3] === 0x00) return 'ico';
  // JPEG XL: entweder nackter Codestream (FF 0A) oder ISOBMFF-Container ("JXL \r\n\x87\n")
  if (head[0] === 0xff && head[1] === 0x0a) return 'jxl';
  if (head[4] === 0x4a && head[5] === 0x58 && head[6] === 0x4c && head[7] === 0x20) return 'jxl';
  if (str(0, 2) === 'P1' || str(0, 2) === 'P2' || str(0, 2) === 'P3' || str(0, 2) === 'P4' || str(0, 2) === 'P5' || str(0, 2) === 'P6') {
    return 'ppm';
  }
  const text = new TextDecoder().decode(head).trimStart();
  if (text.startsWith('<?xml') || text.startsWith('<svg')) return 'svg';

  return null;
}
