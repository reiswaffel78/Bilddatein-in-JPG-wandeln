/**
 * Fügt einen rohen EXIF-IFD-Payload als APP1-Segment direkt nach dem
 * SOI-Marker in einen frisch encodierten JPEG-Bytestrom ein.
 *
 * Bewusste Vereinfachung dieser Phase (siehe RISKS.md): Es wird der komplette
 * Original-EXIF-Block 1:1 übernommen oder gar nicht — eine Filterung einzelner
 * Felder (nur Kamera behalten, GPS entfernen, ...) ist nicht implementiert.
 * Granulare Checkboxen im UI zeigen daher nur an, was erkannt wurde, filtern
 * aber (noch) nicht selektiv.
 */
export function insertExifIntoJpeg(jpegBytes: ArrayBuffer, exifPayload: ArrayBuffer): ArrayBuffer {
  const exifMarkerHeader = new Uint8Array([0xff, 0xe1]);
  const exifSignature = new Uint8Array([0x45, 0x78, 0x69, 0x66, 0x00, 0x00]); // "Exif\0\0"
  const segmentLength = exifSignature.length + exifPayload.byteLength + 2; // +2 für das Längenfeld selbst

  if (segmentLength > 0xffff) {
    // EXIF-Block zu groß für ein einzelnes JPEG-Segment (max. 65533 Byte Payload) — überspringen statt zu crashen.
    return jpegBytes;
  }

  const lengthBytes = new Uint8Array([(segmentLength >> 8) & 0xff, segmentLength & 0xff]);
  const soi = new Uint8Array(jpegBytes.slice(0, 2));
  const rest = new Uint8Array(jpegBytes.slice(2));

  const out = new Uint8Array(soi.length + exifMarkerHeader.length + lengthBytes.length + exifSignature.length + exifPayload.byteLength + rest.length);
  let offset = 0;
  out.set(soi, offset); offset += soi.length;
  out.set(exifMarkerHeader, offset); offset += exifMarkerHeader.length;
  out.set(lengthBytes, offset); offset += lengthBytes.length;
  out.set(exifSignature, offset); offset += exifSignature.length;
  out.set(new Uint8Array(exifPayload), offset); offset += exifPayload.byteLength;
  out.set(rest, offset);

  return out.buffer;
}
