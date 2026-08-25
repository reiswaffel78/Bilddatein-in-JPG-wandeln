import { ConversionError } from '../types';
import { decodeBmpDib } from './bmp';

/**
 * ICO ist nur-Lesen (Kap. 6). Eine ICO-Datei kann mehrere Größen desselben
 * Icons enthalten — wir wählen die größte, weil das dem Nutzer am ehesten
 * entspricht, was er "das Bild" nennen würde.
 */
export async function decodeIco(blob: Blob): Promise<ImageData> {
  const buffer = await blob.arrayBuffer();
  const view = new DataView(buffer);

  if (view.getUint16(0, true) !== 0 || view.getUint16(2, true) !== 1) {
    throw new ConversionError(
      'CORRUPT_INPUT',
      'Diese Datei hat keinen gültigen ICO-Header.',
      'Prüfe, ob die Datei tatsächlich eine .ico-Datei ist.',
    );
  }

  const entryCount = view.getUint16(4, true);
  let bestEntry: { size: number; bytesInRes: number; imageOffset: number } | null = null;

  for (let i = 0; i < entryCount; i++) {
    const entryOffset = 6 + i * 16;
    const widthByte = view.getUint8(entryOffset);
    const heightByte = view.getUint8(entryOffset + 1);
    const width = widthByte === 0 ? 256 : widthByte;
    const height = heightByte === 0 ? 256 : heightByte;
    const bytesInRes = view.getUint32(entryOffset + 8, true);
    const imageOffset = view.getUint32(entryOffset + 12, true);
    const size = width * height;
    if (!bestEntry || size > bestEntry.size) {
      bestEntry = { size, bytesInRes, imageOffset };
    }
  }

  if (!bestEntry) {
    throw new ConversionError('CORRUPT_INPUT', 'Diese ICO-Datei enthält keine Icon-Einträge.', 'Prüfe die Datei in einem anderen Programm.');
  }

  const entryBytes = new Uint8Array(buffer, bestEntry.imageOffset, bestEntry.bytesInRes);
  const isPng = entryBytes[0] === 0x89 && entryBytes[1] === 0x50 && entryBytes[2] === 0x4e && entryBytes[3] === 0x47;

  if (isPng) {
    const pngBlob = new Blob([entryBytes], { type: 'image/png' });
    const bitmap = await createImageBitmap(pngBlob);
    const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new ConversionError('UNKNOWN', 'Canvas-Kontext nicht verfügbar.', 'Versuche es in einem anderen Browser erneut.');
    ctx.drawImage(bitmap, 0, 0);
    return ctx.getImageData(0, 0, bitmap.width, bitmap.height);
  }

  return decodeBmpDib(new DataView(buffer, bestEntry.imageOffset), 0);
}
