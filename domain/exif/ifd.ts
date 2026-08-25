/**
 * Minimaler TIFF/IFD-Parser für EXIF-Daten. Wird für JPEG (APP1 "Exif\0\0"-Payload),
 * WebP (EXIF-Chunk) und PNG (eXIf-Chunk) gemeinsam genutzt, da alle drei denselben
 * TIFF/IFD-Bytestrom als Payload verwenden (Kap. 16: keine Code-Duplikation).
 *
 * Deckt nur die Tags ab, die die App tatsächlich braucht: Orientation, GPS-Präsenz,
 * Kamera-Info-Präsenz, ICC-Profil wird separat behandelt (nicht Teil von EXIF).
 */

export interface ParsedExif {
  orientation: number; // 1 = normal, EXIF-Standardwerte 1–8
  hasGps: boolean;
  hasCameraInfo: boolean;
  hasDateTime: boolean;
  hasCopyright: boolean;
  hasSoftware: boolean;
}

const TAG_ORIENTATION = 0x0112;
const TAG_MAKE = 0x010f;
const TAG_MODEL = 0x0110;
const TAG_DATETIME = 0x0132;
const TAG_COPYRIGHT = 0x8298;
const TAG_SOFTWARE = 0x0131;
const TAG_GPS_IFD_POINTER = 0x8825;
const TAG_EXIF_IFD_POINTER = 0x8769;

export function parseExifIfd(buffer: ArrayBuffer): ParsedExif {
  const result: ParsedExif = {
    orientation: 1,
    hasGps: false,
    hasCameraInfo: false,
    hasDateTime: false,
    hasCopyright: false,
    hasSoftware: false,
  };

  if (buffer.byteLength < 8) return result;
  const view = new DataView(buffer);
  const byteOrderMark = view.getUint16(0);
  let littleEndian: boolean;
  if (byteOrderMark === 0x4949) littleEndian = true;
  else if (byteOrderMark === 0x4d4d) littleEndian = false;
  else return result;

  const magic = view.getUint16(2, littleEndian);
  if (magic !== 42) return result;

  const firstIfdOffset = view.getUint32(4, littleEndian);
  readIfd(view, firstIfdOffset, littleEndian, result, 0);
  return result;
}

function readIfd(view: DataView, offset: number, littleEndian: boolean, result: ParsedExif, depth: number): void {
  if (depth > 3 || offset + 2 > view.byteLength) return;
  const entryCount = view.getUint16(offset, littleEndian);
  let entryOffset = offset + 2;

  for (let i = 0; i < entryCount; i++) {
    if (entryOffset + 12 > view.byteLength) break;
    const tag = view.getUint16(entryOffset, littleEndian);
    const type = view.getUint16(entryOffset + 2, littleEndian);
    const valueOffset = entryOffset + 8;

    switch (tag) {
      case TAG_ORIENTATION:
        result.orientation = readShortValue(view, valueOffset, littleEndian, type);
        break;
      case TAG_MAKE:
      case TAG_MODEL:
        result.hasCameraInfo = true;
        break;
      case TAG_DATETIME:
        result.hasDateTime = true;
        break;
      case TAG_COPYRIGHT:
        result.hasCopyright = true;
        break;
      case TAG_SOFTWARE:
        result.hasSoftware = true;
        break;
      case TAG_GPS_IFD_POINTER:
        result.hasGps = true;
        break;
      case TAG_EXIF_IFD_POINTER: {
        const subOffset = view.getUint32(valueOffset, littleEndian);
        readIfd(view, subOffset, littleEndian, result, depth + 1);
        break;
      }
    }
    entryOffset += 12;
  }
}

function readShortValue(view: DataView, offset: number, littleEndian: boolean, type: number): number {
  // Type 3 = SHORT (2 bytes), stored left-justified in the 4-byte value field.
  if (type === 3) return view.getUint16(offset, littleEndian);
  return view.getUint32(offset, littleEndian);
}

/**
 * Extrahiert den rohen EXIF-IFD-Payload aus einer JPEG-Datei (APP1 "Exif\0\0"-Segment).
 */
export function extractJpegExifPayload(buffer: ArrayBuffer): ArrayBuffer | null {
  const view = new DataView(buffer);
  if (view.byteLength < 4 || view.getUint16(0) !== 0xffd8) return null;
  let offset = 2;
  while (offset + 4 <= view.byteLength) {
    if (view.getUint8(offset) !== 0xff) {
      offset += 1;
      continue;
    }
    const marker = view.getUint8(offset + 1);
    if (marker === 0xd8 || marker === 0xd9) {
      offset += 2;
      continue;
    }
    const segmentLength = view.getUint16(offset + 2);
    if (marker === 0xe1 && offset + 4 + 6 <= view.byteLength) {
      const isExif =
        view.getUint8(offset + 4) === 0x45 &&
        view.getUint8(offset + 5) === 0x78 &&
        view.getUint8(offset + 6) === 0x69 &&
        view.getUint8(offset + 7) === 0x66 &&
        view.getUint8(offset + 8) === 0x00 &&
        view.getUint8(offset + 9) === 0x00;
      if (isExif) {
        const payloadStart = offset + 4 + 6;
        const payloadEnd = offset + 2 + segmentLength;
        return buffer.slice(payloadStart, payloadEnd);
      }
    }
    if (marker === 0xda) break; // Start of Scan — keine weiteren Marker-Segmente danach.
    offset += 2 + segmentLength;
  }
  return null;
}
