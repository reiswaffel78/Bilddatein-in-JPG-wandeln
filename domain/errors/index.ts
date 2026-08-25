import { ConversionError } from '../types';

/**
 * Jede Fehlermeldung nennt drei Dinge: was passiert ist, warum, und was der
 * Nutzer tun kann (Kap. 11). "Conversion failed" ist verboten — jede Factory
 * hier liefert alle drei Teile.
 */

export function unsupportedPairError(src: string, dst: string): ConversionError {
  return new ConversionError(
    'UNSUPPORTED_PAIR',
    `Dein Browser kann "${src}" nicht nach "${dst}" konvertieren.`,
    'Wähle ein anderes Zielformat aus der Liste — sie zeigt nur, was dein Browser tatsächlich kann. Ein anderer Browser (z. B. Chrome statt Safari) unterstützt eventuell mehr Formate.',
  );
}

export function pixelLimitExceededError(width: number, height: number, limitMegapixels: number): ConversionError {
  const megapixels = (width * height) / 1_000_000;
  return new ConversionError(
    'PIXEL_LIMIT_EXCEEDED',
    `Dieses Bild hat ${megapixels.toFixed(1)} Megapixel (${width}×${height}), das aktuelle Limit liegt bei ${limitMegapixels} Megapixel.`,
    'Diese Grenze schützt vor Speicherabstürzen durch außergewöhnlich große oder manipulierte Bilder. Falls das Bild echt ist: Limit in den Einstellungen erhöhen, sofern dein Gerät genug Speicher hat.',
  );
}

export function frameLimitExceededError(frameCount: number, limit: number): ConversionError {
  return new ConversionError(
    'FRAME_LIMIT_EXCEEDED',
    `Diese Datei enthält ${frameCount} Seiten/Frames, das Limit liegt bei ${limit}.`,
    'Wähle eine kleinere Seiten-/Frame-Auswahl, oder erhöhe das Limit in den Einstellungen, falls dein Gerät genug Speicher hat.',
  );
}

export function corruptInputError(reason?: string): ConversionError {
  return new ConversionError(
    'CORRUPT_INPUT',
    `Diese Datei konnte nicht gelesen werden${reason ? `: ${reason}` : ', der Inhalt scheint beschädigt oder unvollständig zu sein'}.`,
    'Prüfe, ob die Datei sich in einem anderen Programm öffnen lässt. Falls ja, exportiere sie dort erneut und versuche es hier noch einmal.',
  );
}

export function mimeMismatchError(declared: string, detected: string): ConversionError {
  return new ConversionError(
    'MIME_MISMATCH',
    `Die Dateiendung deutet auf "${declared}" hin, der tatsächliche Inhalt sieht aber nach "${detected}" aus.`,
    'Benenne die Datei entsprechend ihres echten Formats um, oder wähle das erkannte Format manuell aus.',
  );
}

export function psdNoCompositeError(): ConversionError {
  return new ConversionError(
    'PSD_NO_COMPOSITE',
    'Diese PSD-Datei enthält kein gespeichertes Vorschaubild. Photoshop erzeugt es nur mit aktivierter Option "Kompatibilität maximieren".',
    'Speichere die Datei in Photoshop erneut mit dieser Option, oder wähle ein anderes Quellformat.',
  );
}

export function oomError(): ConversionError {
  return new ConversionError(
    'OOM',
    'Dem Browser ist während der Konvertierung der Speicher ausgegangen.',
    'Versuche eine kleinere Zieldateigröße (z. B. Resize aktivieren) oder konvertiere diese Datei einzeln statt im Batch.',
  );
}

export function abortedError(): ConversionError {
  return new ConversionError('ABORTED', 'Die Konvertierung wurde abgebrochen.', 'Starte den Job erneut, falls das nicht beabsichtigt war.');
}

export function timeoutError(): ConversionError {
  return new ConversionError(
    'TIMEOUT',
    'Die Konvertierung hat zu lange gedauert und wurde abgebrochen.',
    'Versuche es mit einer kleineren Datei oder weniger aufwändigen Einstellungen erneut.',
  );
}

export function engineLoadFailedError(engineId: string): ConversionError {
  return new ConversionError(
    'ENGINE_LOAD_FAILED',
    `Die für diese Konvertierung benötigte Komponente ("${engineId}") konnte nicht geladen werden.`,
    'Prüfe deine Internetverbindung (nur beim ersten Laden dieser Komponente nötig) und versuche es erneut.',
  );
}

export function rasterizeSizeMissingError(): ConversionError {
  return new ConversionError(
    'RASTERIZE_SIZE_MISSING',
    'SVG-Dateien haben keine feste Pixelgröße — eine Zielgröße muss angegeben werden, damit die Rasterisierung eindeutig ist.',
    'Trage Breite und Höhe im Formular ein, bevor du konvertierst.',
  );
}

export function unknownError(cause?: unknown): ConversionError {
  return new ConversionError(
    'UNKNOWN',
    'Bei der Konvertierung ist ein unerwarteter Fehler aufgetreten.',
    'Kopiere den Diagnosebericht und versuche es erneut. Falls der Fehler wiederholt auftritt, ist die Datei möglicherweise nicht mit den aktuellen Einstellungen kompatibel.',
    cause,
  );
}
