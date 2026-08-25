# Format Matrix

Diese Datei beschreibt die Formatabdeckung nach Tier, mit tatsächlich genutzter Engine und Conversion-Type. Die Tier-1-Spalte „Engine" ist inzwischen **Implementierungsstand, nicht mehr nur Planung** — siehe `RISKS.md` R2/R3: `wasm-vips` wird für Tier 1 nicht verwendet, stattdessen `@jsquash/*` (jsquash), UTIF.js, sowie eigene schmale Encoder/Decoder für BMP/GIF/ICO/PPM. Tier 2/3 sind weiterhin Planung. Die reale Laufzeit-Capability-Matrix (Kapitel 5) wird aus `domain/matrix/build.ts` gebaut — diese Tabelle ist die menschenlesbare Übersicht dazu, kein Ersatz.

Conversion-Types folgen Kapitel 5: `native`, `render`, `rasterize`, `embed`, `trace`.

## Tier 1 — MVP, implementiert

| Format | Lesen | Schreiben | Engine | Type | Stand / offene Punkte |
|---|---|---|---|---|---|
| JPEG/JPG/JFIF | ✓ | ✓ | `@jsquash/jpeg` (mozjpeg) | native | Progressiv + Chroma-Subsampling (4:2:0/4:4:4) im UI wählbar. EXIF-Komplettübernahme nur JPEG→JPEG, siehe RISKS.md. |
| PNG | ✓ | ✓ | `@jsquash/png` (oxipng) | native | Kein separater Palette-vs-Truecolor-Schalter. |
| WebP | ✓ | ✓ | `@jsquash/webp` | native | Nur erster Frame; kein Animation-Erhalt. |
| AVIF | ✓ | ✓ | `@jsquash/avif` | native | Kein HDR→SDR-Tone-Mapping (kein HDR-Tier-1-Quellformat). |
| TIFF/TIF | ✓ | ✓ | UTIF.js | native | Nur Baseline-TIFF; nur erste Seite bei Multipage. |
| GIF | ✓ | ✓ | Lesen: native-canvas (`createImageBitmap`) · Schreiben: eigener GIF89a-Encoder (Median-Cut-Quantisierung) | native | Nur Einzelbild — kein animiertes GIF-Schreiben, kein Multi-Frame-Lesen. |
| BMP | ✓ | ✓ | Eigener Encoder (unkomprimiert, 32bpp) · Lesen über native-canvas | native | Kein RLE-Schreiben (unkomprimiert reicht für den Zweck). |
| JPEG XL | ✓ | ✓ | `@jsquash/jxl` | native | Native Browser-Unterstützung uneinheitlich, daher immer über jsquash-WASM, unabhängig vom Probe-Ergebnis. |
| ICO | ✓ | – | Eigener Parser (größten Eintrag wählen, PNG- oder BMP-DIB-Entry) | native | Nur Lesen, wie in Kapitel 6 festgelegt. |
| SVG | ✓ | – | DOMPurify (Sanitizing) + `<img>`/`createImageBitmap` (Rasterisierung) | rasterize | Rasterisierungsgröße ist Pflichtfeld, siehe SECURITY.md. |
| PPM/PGM/PBM | ✓ | – | Eigener Parser (P1/P2/P3/P5/P6; P4 binär nicht unterstützt) | native | Nur Lesen, wie in Kapitel 6 festgelegt. |

## Tier 2 — nach Freigabe von Tier 1

| Format | Lesen | Schreiben | Engine | Type | Offene Fragen |
|---|---|---|---|---|---|
| HEIC/HEIF | ✓ | – | wasm-vips (vips-heif.wasm) | native | **Nur Dekodierung — HEVC-Encoding patentbelastet, `→ HEIC` wird nicht gebaut.** Sichtbar im UI zu erklären, nicht nur im Code. |
| RAW (CR2, CR3, CRW, NEF, NRW, ARW, SR2, SRF, RAF, ORF, RW2, PEF, SRW, DNG, 3FR, RWL, X3F, ...) | ✓ | – | LibRaw-Wasm | native → render (Demosaicing + Tone Mapping) | Tatsächliche Formatliste kommt aus der Laufzeit-Probe von LibRaw-Wasm, nicht aus dieser Aufzählung. Weißabgleich-Presets (as-shot/Kamera/neutral) noch zu spezifizieren. |
| PSD, PSB | ✓ | – | ag-psd | embed (Composite) | Nur gespeicherter Composite; ohne „Kompatibilität maximieren" harter Ablehnungsfehler mit Erklärung (Kap. 11) |
| PDF → Raster | ✓ | – | pdf.js | rasterize | DPI-Default, Seitenzahl-Limit (Dekompressionsbombe-Schutz) final festlegen |
| Raster → PDF | – | ✓ | pdf-lib | embed | Seitengrößen-Presets, Ränder-Defaults noch zu spezifizieren |
| TGA, PCX, DDS | ✓ | ✗ (offen) | vorhandene Engine, falls ohne Eigenentwicklung möglich | native | Nur aufnehmen, wenn eine vorhandene Engine sie öffnet — sonst weglassen (Kap. 6) |

## Tier 3 — nur nach expliziter Freigabe, jeweils einzeln

| Format | Lesen | Schreiben | Engine | Type | Offene Fragen |
|---|---|---|---|---|---|
| Raster → SVG (embed) | – | ✓ | eigene Implementierung | embed | Ehrlich als „Bild in SVG eingebettet" benannt, nicht als Vektorisierung |
| Raster → SVG (trace) | – | ✓ | potrace-wasm | trace | Optional, klar von „embed" unterschieden |
| EPS, AI, PostScript | ✓ | ✓ | Ghostscript-WASM | render | **Freigegeben — siehe RISKS.md.** Repository wird bei Integration unter AGPL-3.0-kompatibler Lizenz offengelegt. Bleibt Tier 3, Umsetzung erst nach Phase 1–3. |

## Grundsatz

Kein Format-Paar aus dieser Tabelle wird hartcodiert in UI oder Konvertierungslogik übernommen. Diese Datei ist Planungsdokumentation für Kapitel 21; die tatsächliche Runtime-Matrix (Kapitel 5) entsteht durch `probe()` auf jeder Engine plus `createImageBitmap`-Tests gegen eingebettete 1×1-Testbilder für browser-native Codecs, gecached pro Browser-Version.
