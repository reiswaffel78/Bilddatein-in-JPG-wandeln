# Graph Report - bilddatein-in-jpg-wandeln  (2026-10-18)

## Corpus Check
- 74 files · ~22,647 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 7 file(s) not represented in the graph (top: (none) 4, .example 1, .css 1)

## Summary
- 491 nodes · 866 edges · 23 communities (18 shown, 5 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 2 edges (avg confidence: 0.95)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `c130b800`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- decode.ts
- domain/types.ts
- README.md
- ConverterApp.tsx
- build.ts
- compilerOptions
- package.json
- Eigene Risikoeinschätzung zu Anforderungen aus dem Auftrag
- encode.ts
- context.tsx
- devDependencies
- dependencies
- Tokenizer
- Bedrohungen und Gegenmaßnahmen
- presets.ts
- dimensions.ts
- serve-static.mjs
- resultStore.ts
- WorkerPool
- extends
- next.config.mjs
- fixtures/LICENSES.md

## God Nodes (most connected - your core abstractions)
1. `ConversionError` - 31 edges
2. `ConverterApp()` - 23 edges
3. `compilerOptions` - 20 edges
4. `Format` - 17 edges
5. `ConvertOptions` - 17 edges
6. `WorkerPool` - 14 edges
7. `decodeRaw()` - 11 edges
8. `cn()` - 11 edges
9. `probeDimensionsCheaply()` - 10 edges
10. `Eigene Risikoeinschätzung zu Anforderungen aus dem Auftrag` - 10 edges

## Surprising Connections (you probably didn't know these)
- `Implementierungsstand (nach Phase 1)` --references--> `ConvertOptions`  [INFERRED]
  SCOPE.md → domain/types.ts
- `Preset` --references--> `ConvertOptions`  [EXTRACTED]
  storage/indexeddb/presets.ts → domain/types.ts
- `Page()` --calls--> `ConverterApp()`  [EXTRACTED]
  app/page.tsx → ui/converter/ConverterApp.tsx
- `JobOutcome` --references--> `ConvertResult`  [EXTRACTED]
  workers/pool.ts → domain/convert/index.ts
- `ConverterApp()` --calls--> `recommendTarget()`  [EXTRACTED]
  ui/converter/ConverterApp.tsx → domain/recommend.ts

## Import Cycles
- None detected.

## Communities (23 total, 5 thin omitted)

### Community 0 - "decode.ts"
Cohesion: 0.08
Nodes (44): DecodedImage, decodeInput(), decodeRaw(), detectExifOrientation(), ExifProbeResult, JSQUASH_DECODE_FORMATS, convertFile(), throwIfAborted() (+36 more)

### Community 1 - "domain/types.ts"
Cohesion: 0.06
Nodes (40): Limits, ConvertResult, GeometryOptions, TargetSize, DiagnosticContext, recommendTarget(), applyRenamePattern(), EXTENSION_FOR_FORMAT (+32 more)

### Community 2 - "README.md"
Cohesion: 0.04
Nodes (37): Architecture, IndexedDB-Schema, OPFS (Origin Private File System), Ordnerstruktur, Stack-Entscheidungen, Static Export (Next.js `output: 'export'`), Web Worker Pool (Comlink oder eigener Wrapper), Worker- und Speichermodell (+29 more)

### Community 3 - "ConverterApp.tsx"
Cohesion: 0.13
Nodes (27): Page(), defaultConvertOptions(), detectFormat(), buildDiagnosticReport(), availableTargetsFor(), useI18n(), react, AdvancedPanel() (+19 more)

### Community 4 - "build.ts"
Cohesion: 0.13
Nodes (19): probeNativeDecode(), ALPHA_DST, buildCapabilityMatrix(), findCapability(), LOSSY_DST, MEMORY_CLASS, WRITER_ENGINE, writerType() (+11 more)

### Community 5 - "compilerOptions"
Cohesion: 0.09
Nodes (22): compilerOptions, allowJs, esModuleInterop, forceConsistentCasingInFileNames, incremental, isolatedModules, jsx, lib (+14 more)

### Community 6 - "package.json"
Cohesion: 0.06
Nodes (31): name, private, scripts, build, dev, e2e, lint, start (+23 more)

### Community 7 - "Eigene Risikoeinschätzung zu Anforderungen aus dem Auftrag"
Cohesion: 0.10
Nodes (20): Eigene Risikoeinschätzung zu Anforderungen aus dem Auftrag, Entscheidung 1: Ghostscript-WASM (EPS/AI/PostScript, Tier 3) — **Beantwortet: Code wird offengelegt**, Entscheidung 2: Conversion History (Kapitel 13) — **Beantwortet: wird gebaut, wie in Kapitel 13 beschrieben**, Entscheidungen aus Kapitel 6 — beantwortet, Hinweis zur Vollständigkeit dieser Datei, Konkrete Findings aus der Phase-1-Implementierung, R10 — CSP `script-src 'self'` allein reicht für Next.js' Static Export nicht, R11 — Emscripten-WASM-Encoder brauchen `'wasm-unsafe-eval'`, nicht nur ein „vielleicht" (+12 more)

### Community 8 - "encode.ts"
Cohesion: 0.07
Nodes (29): encodeOutput(), flattenAlpha(), hexToRgb(), MIME_TYPES, encodeBmp(), Box, encodeGif(), lzwEncode() (+21 more)

### Community 9 - "context.tsx"
Cohesion: 0.18
Nodes (12): metadata, RootLayout(), detectBrowserLocale(), DICTIONARIES, I18nContext, I18nContextValue, I18nProvider(), Locale (+4 more)

### Community 10 - "devDependencies"
Cohesion: 0.12
Nodes (16): devDependencies, autoprefixer, eslint, eslint-config-next, jsdom, @playwright/test, postcss, tailwindcss (+8 more)

### Community 11 - "dependencies"
Cohesion: 0.13
Nodes (15): dependencies, client-zip, clsx, comlink, dompurify, @jsquash/avif, @jsquash/jpeg, @jsquash/jxl (+7 more)

### Community 13 - "Bedrohungen und Gegenmaßnahmen"
Cohesion: 0.14
Nodes (13): 1. SVG als Angriffsvektor, 2. Dekompressionsbomben / Ressourcenerschöpfung, 3. ZIP-Input (falls implementiert), 4. Third-Party-Requests zur Laufzeit, 5. WASM-Threads / SharedArrayBuffer, 6. Emscripten `unsafe-eval` / WebAssembly-Kompilierung, 7. Speichererschöpfung als Sicherheitsproblem, Bedrohungen und Gegenmaßnahmen (+5 more)

### Community 14 - "presets.ts"
Cohesion: 0.26
Nodes (12): idbDelete(), idbGet(), idbGetAll(), idbPut(), openDb(), STORE_PRESETS, STORE_SETTINGS, BUILTIN_PRESETS (+4 more)

### Community 17 - "dimensions.ts"
Cohesion: 0.22
Nodes (10): checkPixelLimit(), exceedsPixelLimit(), probeBmp(), ProbedDimensions, probeDimensionsCheaply(), probeGif(), probeJpeg(), probePng() (+2 more)

### Community 18 - "serve-static.mjs"
Cohesion: 0.15
Nodes (7): @playwright/test, MIME_TYPES, PORT, ROOT, SECURITY_HEADERS, server, SAMPLE_PNG

### Community 19 - "resultStore.ts"
Cohesion: 0.38
Nodes (10): clearScratch(), deleteScratchFile(), getScratchDir(), isOpfsSupported(), readScratchFile(), writeScratchFile(), getResult(), memoryFallback (+2 more)

### Community 22 - "extends"
Cohesion: 0.50
Nodes (3): extends, next/core-web-vitals, next/typescript

## Knowledge Gaps
- **15 isolated node(s):** `next/core-web-vitals`, `next/typescript`, `react-dom`, `@types/dompurify`, `@types/node` (+10 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 219 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `ConvertOptions` connect `domain/types.ts` to `decode.ts`, `README.md`, `ConverterApp.tsx`, `encode.ts`, `presets.ts`?**
  _High betweenness centrality (0.244) - this node is a cross-community bridge._
- **What connects `next/core-web-vitals`, `next/typescript`, `react-dom` to the rest of the system?**
  _15 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `decode.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07922077922077922 - nodes in this community are weakly interconnected._
- **Why does `Implementierungsstand (nach Phase 1)` connect `README.md` to `domain/types.ts`?**
  _High betweenness centrality (0.218) - this node is a cross-community bridge._
- **Should `domain/types.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06203007518796992 - nodes in this community are weakly interconnected._
- **Should `README.md` be split into smaller, more focused modules?**
  _Cohesion score 0.043478260869565216 - nodes in this community are weakly interconnected._
- **Should `ConverterApp.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.13063063063063063 - nodes in this community are weakly interconnected._