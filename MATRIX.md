# Format Matrix

Diese Datei beschreibt die **geplante** Formatabdeckung nach Tier, mit vorgesehener Engine und Conversion-Type. Sie ist keine Implementierung der Laufzeit-Capability-Matrix aus Kapitel 5 — die reale Matrix wird zur Laufzeit aus einem Probe-Lauf der Engines gebaut und kann je nach Browser abweichen (fehlende Codecs, fehlende Loader/Saver in der geladenen wasm-vips-Variante). Diese Tabelle ist die Planungsgrundlage für diesen Probe-Lauf, kein Ersatz dafür.

Conversion-Types folgen Kapitel 5: `native`, `render`, `rasterize`, `embed`, `trace`.

## Tier 1 — MVP, muss funktionieren

| Format | Lesen | Schreiben | Engine | Type | Offene Fragen |
|---|---|---|---|---|---|
| JPEG/JPG/JFIF | ✓ | ✓ | wasm-vips | native | mozjpeg-Encoder-Parameter (progressiv, Subsampling) final in Phase 1 festlegen |
| PNG | ✓ | ✓ | wasm-vips | native | Palette-PNG vs. Truecolor-Ausgabe als Option? |
| WebP | ✓ | ✓ | wasm-vips | native | Animation erhalten vs. erster Frame — UI-Auswahl nötig (Kap. 9) |
| AVIF | ✓ | ✓ | wasm-vips | native | HDR/10-bit → SDR Tone Mapping: konkretes Verfahren noch zu wählen |
| TIFF/TIF | ✓ | ✓ | wasm-vips (Fallback UTIF.js) | native | Multipage-Handling (alle Seiten vs. erste) |
| GIF | ✓ | ✓ | wasm-vips / @jsquash | native | Animation erhalten nur wenn Zielformat es kann — Matrix muss das pro Zielpaar ausweisen |
| BMP | ✓ | ✓ | wasm-vips | native | keine offen |
| JPEG XL | ✓ | ✓ | wasm-vips (vips-jxl.wasm) | native | Browser-native Unterstützung uneinheitlich — abhängig vom Probe-Ergebnis pro Browser |
| ICO | ✓ | – | wasm-vips / @jsquash | native | Nur Lesen, wie in Kapitel 6 festgelegt |
| SVG | ✓ | – | Browser (`<img>`/blob: oder sandboxed iframe) + DOMPurify | rasterize | Rasterisierungsgröße ist Pflichtfeld, siehe SECURITY.md |
| PPM/PGM/PBM | ✓ | – | wasm-vips | native | Nur Lesen, wie in Kapitel 6 festgelegt |

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
