/**
 * Zentrale Grenzwerte des Projekts (Kap. 16: "alle Grenzwerte in einer Konfigurationsdatei").
 * Werte sind zur Build-Zeit über NEXT_PUBLIC_*-Variablen überschreibbar, siehe .env.example.
 */

export const LIMITS = {
  /** Dekompressionsbomben-Schutz: harte Obergrenze für Pixelanzahl (Breite × Höhe). */
  maxMegapixels: Number(process.env.NEXT_PUBLIC_MAX_MEGAPIXELS ?? 256),

  /** Maximale PDF-Seitenzahl pro Job (Phase 3). */
  maxPdfPages: Number(process.env.NEXT_PUBLIC_MAX_PDF_PAGES ?? 500),

  /** Maximale Framezahl für Multipage-TIFF / animierte Quellen. */
  maxFrames: 2000,

  /** Worker-Pool-Obergrenze, unabhängig von hardwareConcurrency. */
  maxWorkerPoolSize: 4,

  /** ZIP-Input: Entpack-Ratio-Limit (unkomprimiert / komprimiert), falls ZIP-Input je implementiert wird. */
  maxZipInflateRatio: 100,

  /** Ab dieser Dateigröße (Bytes) wird vor Batch-Start eine Speicherwarnung angezeigt. */
  memoryWarningThresholdBytes: 200 * 1024 * 1024,

  /** Peak-Speicher-Schätzfaktor je nach memoryClass der Capability (Kap. 5), relativ zur Eingabedateigröße. */
  memoryEstimateFactor: {
    low: 3,
    medium: 6,
    high: 12,
  },
} as const;

export type Limits = typeof LIMITS;
