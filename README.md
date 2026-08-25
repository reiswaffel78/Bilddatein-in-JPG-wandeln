# Lokaler Datei-Converter

Bild-Konvertierung, die vollständig im Browser läuft. Keine Datei verlässt das
Gerät — es gibt keinen Server, der Uploads entgegennimmt. Prüfbar jederzeit im
Netzwerk-Tab.

Hintergrund und Leitplanken dieses Projekts stehen in den Phase-0-Dokumenten:
[`ARCHITECTURE.md`](./ARCHITECTURE.md), [`MATRIX.md`](./MATRIX.md),
[`SECURITY.md`](./SECURITY.md), [`LICENSES.md`](./LICENSES.md),
[`SCOPE.md`](./SCOPE.md), [`RISKS.md`](./RISKS.md).

## Setup

```bash
npm install
npm run dev        # Entwicklungsserver, http://localhost:3000
```

## Build (statischer Export)

```bash
npm run build       # erzeugt ./out — kein Server, keine Functions
```

**Wichtig:** Bei lokalen Iterationen an Worker-Code (`workers/*.ts`) immer
`.next` vor einem erneuten Build löschen (`rm -rf .next`). Ein bekannter
Next.js/Webpack-Cache-Bug kann sonst dazu führen, dass der Worker-Chunk einen
veralteten Datei-Hash referenziert und die Konvertierung im Browser mit einem
nicht diagnostizierbaren `error`-Event fehlschlägt (siehe `RISKS.md`). Ein
frischer `out/`-Ordner aus CI/Netlify ist davon nicht betroffen, da dort kein
alter `.next`-Cache existiert.

## Tests

```bash
npm run typecheck   # tsc --noEmit
npm run lint        # ESLint
npm test            # Vitest (Unit)
npm run build && npm run e2e   # Playwright (braucht den statischen Export unter ./out)
```

Die Playwright-Tests starten automatisch `scripts/serve-static.mjs` — einen
minimalen statischen Server, der dieselben Sicherheits-Header wie
`public/_headers` setzt (Netlify interpretiert `_headers` selbst, ein
generischer Server tut das nicht). Falls das vorinstallierte Chromium nicht
zur `@playwright/test`-Version passt:

```bash
PLAYWRIGHT_CHROMIUM_PATH=/pfad/zu/chrome npx playwright test
```

## Deployment

Netlify, statischer Deploy aus `out/` (`netlify.toml`: Build-Command +
Publish-Verzeichnis). Keine Functions, keine Edge Functions.

## Projektstruktur

Siehe „Ordnerstruktur" in [`ARCHITECTURE.md`](./ARCHITECTURE.md).

## Stand dieser Phase

Was tatsächlich implementiert und getestet ist — versus was aus dem
23-Kapitel-Gesamtauftrag noch aussteht — steht in
[`SCOPE.md`](./SCOPE.md) unter „Implementierungsstand" und in
[`RISKS.md`](./RISKS.md). Kurzfassung: Tier-1-Formate (Lesen/Schreiben von
JPEG, PNG, WebP, AVIF, TIFF, GIF, BMP, JPEG XL; Lesen von ICO, SVG, PPM/PGM/PBM),
Worker-Pool, Batch mit ZIP-Export, Resize, Rotate/Flip, Qualität, EXIF-Orientation
und ein Basis-Fehler-/Diagnose-Flow funktionieren end-to-end und sind per
Playwright-E2E-Test (inkl. „kein Fremd-Request"-Assertion) sowie 31
Vitest-Unit-Tests abgesichert. PWA/Offline, Crop-UI, Batch-Rename-UI, Presets-UI,
Bildanpassungen, Wasserzeichen, Vergleichsmodus, Golden-File-Tests mit
Butteraugli/SSIM sowie alles ab Tier 2 (RAW, PSD, PDF, HEIC-Decode) stehen noch
aus.
