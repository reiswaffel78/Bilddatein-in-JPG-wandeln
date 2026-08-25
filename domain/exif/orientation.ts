/**
 * EXIF-Orientation MUSS vor jeder anderen Transformation aufgelöst werden
 * (Kap. 9: "häufigster Bug dieser Produktklasse"). Diese Funktion zeichnet ein
 * bereits dekodiertes Bild orientierungskorrigiert auf einen neuen Canvas.
 */

export interface Dimensions {
  width: number;
  height: number;
}

/** Liefert die Zieldimensionen nach Anwendung der Orientation (bei 5–8 werden Breite/Höhe getauscht). */
export function orientedDimensions(source: Dimensions, orientation: number): Dimensions {
  if (orientation >= 5 && orientation <= 8) {
    return { width: source.height, height: source.width };
  }
  return source;
}

export function applyOrientation(
  ctx: OffscreenCanvasRenderingContext2D,
  source: CanvasImageSource,
  sourceWidth: number,
  sourceHeight: number,
  orientation: number,
): void {
  switch (orientation) {
    case 2: // Horizontal spiegeln
      ctx.transform(-1, 0, 0, 1, sourceWidth, 0);
      break;
    case 3: // 180°
      ctx.transform(-1, 0, 0, -1, sourceWidth, sourceHeight);
      break;
    case 4: // Vertikal spiegeln
      ctx.transform(1, 0, 0, -1, 0, sourceHeight);
      break;
    case 5: // Transponieren
      ctx.transform(0, 1, 1, 0, 0, 0);
      break;
    case 6: // 90° im Uhrzeigersinn
      ctx.transform(0, 1, -1, 0, sourceHeight, 0);
      break;
    case 7: // Transversal
      ctx.transform(0, -1, -1, 0, sourceHeight, sourceWidth);
      break;
    case 8: // 90° gegen den Uhrzeigersinn
      ctx.transform(0, -1, 1, 0, 0, sourceWidth);
      break;
    default:
      // 1 oder unbekannt: keine Transformation.
      break;
  }
  ctx.drawImage(source, 0, 0, sourceWidth, sourceHeight);
}
