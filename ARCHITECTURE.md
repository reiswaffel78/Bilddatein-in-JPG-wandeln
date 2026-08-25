# Architecture

Phase-0-Dokument. Beschreibt Stack-Entscheidungen, Worker-/Speichermodell, IndexedDB-Schema und Ordnerstruktur für den local-first Datei-Converter. Kein Anwendungscode in dieser Phase.

## Stack-Entscheidungen

### Static Export (Next.js `output: 'export'`)
Ohne Backend gibt es nichts, das eine Server-Runtime bräuchte — API-Routes, Server Actions und Middleware wären totes Gewicht und ein Widerspruch zum „kein Endpunkt"-Versprechen. Static Export erzwingt diese Grenze auf Build-Ebene, statt sie nur per Konvention einzuhalten. Netlify Free Tier kann einen reinen Static Export ohne Functions kostenlos hosten.

### Web Worker Pool (Comlink oder eigener Wrapper)
Konvertierung mit WASM-Engines blockiert den Main Thread spürbar; ein Pool hält die UI reaktionsfähig, während mehrere Dateien parallel bzw. sequenziell verarbeitet werden. Poolgröße `min(navigator.hardwareConcurrency - 1, 4)` balanciert Durchsatz gegen Speicherdruck, da jede Worker-Instanz ihren eigenen WASM-Linearspeicher trägt. Comlink kapselt die Postmessage-Serialisierung, ein eigener Wrapper bleibt Fallback, falls Comlink mit OffscreenCanvas-Transfer kollidiert.

### OPFS (Origin Private File System)
Zwischenergebnisse gehören nicht in JS-Arrays oder den Hauptspeicher, weil das den knappen WASM-Adressraum zusätzlich belastet und bei großen Batches zum Tab-Crash führt. OPFS bietet synchronen, dateibasierten Zugriff aus dem Worker heraus und überlebt Worker-Neustarts nach einem OOM. Es ist reines Scratch-Space — keine Nutzerdaten verlassen damit das Gerät, es ändert sich nur, wo Zwischenzustand während eines laufenden Jobs liegt.

### ZIP-Strategie (`client-zip`)
JSZip baut das gesamte Archiv im RAM auf, was bei Batches mit vielen oder großen Dateien denselben Speicher-Engpass wie WASM trifft. `client-zip` streamt Einträge direkt in einen `ReadableStream`, der zum Download durchgereicht wird, ohne das Archiv je vollständig im Speicher zu halten. Das ist bei Batch-Downloads mit potenziell hunderten Dateien der einzige Weg, der auf schwachen Geräten nicht kollabiert.

### IndexedDB-Schema
IndexedDB hält ausschließlich kleine, strukturierte Metadaten — Presets und optional History — nie Dateiinhalte, da Dateien über OPFS bzw. direkten Download laufen. Zwei Object Stores reichen für den bekannten Bedarf; ein dritter (History) ist unten beschrieben, aber nicht freigegeben (siehe `RISKS.md`, offene Entscheidung 2).

```
Database: converter-db (Version 1)

Object Store: presets
  keyPath: id (uuid)
  indexes: name (unique)
  fields:
    id: string
    name: string
    createdAt: number (epoch ms)
    settings: {
      targetFormat, quality, resize, colorSpace,
      metadataFlags, watermark, ...
    }

Object Store: settings
  keyPath: key (string)
  fields:
    key: string           // z.B. "workerPoolSize", "history.enabled", "history.retentionDays"
    value: unknown

Object Store: history (nur falls Kapitel 13 freigegeben wird — siehe RISKS.md)
  keyPath: id (uuid)
  indexes: timestamp
  fields:
    id: string
    timestamp: number
    srcFormat: string
    dstFormat: string
    fileSizeBytes: number
    settings: object
    resultStatus: 'success' | 'failed'
    durationMs: number
    // explizit NICHT gespeichert: Dateiinhalt, Dateiname (außer separat aktiviert), Vorschaubild
```

## Worker- und Speichermodell

- Pool-Größe: `min(navigator.hardwareConcurrency - 1, 4)`, per UI überschreibbar. Ein Wert von 0 wird auf 1 angehoben (Hauptthread bleibt frei für UI).
- Batch-Jobs laufen sequenziell pro Worker-Slot — kein Worker verarbeitet zwei Dateien gleichzeitig.
- Nach jeder Datei wird die WASM-Instanz recycelt (Worker terminieren und neu erzeugen, oder expliziter Reset-Call der Engine), da Emscripten-Heaps Speicher nicht zuverlässig freigeben.
- iOS/Safari lädt die `lowmem`-Variante von wasm-vips (256 MB Cap) statt der Desktop-Variante.
- Vor Batch-Start wird der geschätzte Peak-Speicher (Dateigröße × Faktor je Engine/Pfad) berechnet; bei Überschreitung einer konfigurierbaren Schwelle warnt die UI, statt zu starten und abzustürzen.
- Oberhalb dieser Schwelle nutzt vips seine Streaming-Pipeline statt Vollpuffer-Dekodierung.
- Ein OOM in einem Worker lässt nur den betroffenen Job als `failed` fehlschlagen; der Worker wird neu erzeugt, die Queue läuft weiter.
- Zwischenergebnisse (dekodierte Zwischenformate, Seiten aus Multipage-Quellen) liegen in OPFS, nicht in Worker-Message-Payloads.

## Ordnerstruktur

```
/app                      Next.js App Router, nur Client-Komponenten, kein Server-Code
  /[locale]/...            i18n-Routing (de/en)

/domain                   Kernlogik, kein React, kein DOM außer wo unvermeidbar
  /matrix                  Capability-Matrix: Probe-Runner, Cache, Typen
  /engines                 Ein Modul je Engine, implementiert ConversionEngine-Interface
  /convert                 Orchestrierung: Format wählen, Engine wählen, Job aufbauen
  /validation              Zentrale Input-Validierung (Pixel-Limits, ZIP-Limits, MIME-Checks)
  /errors                  Zentrale Error-Types mit stabilen Codes
  /config                  Eine Datei für alle Grenzwerte (Pixel-Limits, Pool-Größe, Schwellen)

/workers                  Worker-Pool-Implementierung, Comlink-Bindings, Engine-Loader (lazy)

/storage
  /opfs                    Scratch-Space-Wrapper
  /indexeddb               Presets-, Settings-, (optional) History-Store

/ui
  /components              shadcn/ui-basierte Komponenten, keine God Components
  /simple                  Simple-Mode-Flow
  /advanced                 Advanced-Panel (Resize, Metadaten, Rename, Crop/Rotate/Flip, ...)
  /batch                   Queue-UI

/i18n                     Übersetzungsdateien de/en, keine Strings in Komponenten

/fixtures                 Testdateien für Golden-File-Tests, Lizenz je Datei dokumentiert

/tests
  /unit                    Vitest
  /integration             Vitest
  /e2e                     Playwright

netlify.toml
_headers
.env.example
```

Diese Struktur ist die Zielstruktur für Phase 1 und wird in Phase 0 nicht angelegt — Phase 0 liefert ausschließlich die sechs in Kapitel 21 genannten Dokumente.
