# Security

Phase-0-Dokument. Die Angriffsfläche ist ohne Server klein — kein Endpunkt nimmt Nutzerdaten entgegen —, aber nicht null: Der Browser rendert und dekodiert aktiv untrusted Content (SVG, PDF, Bilder, Archive), und WASM-Module laufen mit Threads/SharedArrayBuffer.

## Bedrohungen und Gegenmaßnahmen

### 1. SVG als Angriffsvektor
**Bedrohung:** SVG ist XML mit ausführbarem Inhalt — `<script>`, Event-Handler (`onload`, `onclick`), `<foreignObject>` mit eingebettetem HTML, externe Referenzen (`xlink:href`, `<image>`) können Netzwerkzugriffe auslösen oder im schlimmsten Fall Code im Kontext der Seite ausführen, wenn das SVG unsanitized eingebunden wird.

**Gegenmaßnahmen:**
- Niemals `innerHTML` mit rohem SVG-Inhalt.
- DOMPurify entfernt `<script>`, `<foreignObject>`, alle Event-Handler-Attribute, externe `xlink:href`/`href`-Referenzen auf fremde URLs.
- Rasterisierung ausschließlich über `<img>` mit `blob:`-URL (aus dem sanitized SVG erzeugt) oder ein sandboxed `<iframe>` — beide ohne Netzwerkzugriff, kompatibel mit der CSP (kein `connect-src` zu Fremdhosts).
- SVG hat keine intrinsische Pixelgröße: Rasterisierungsgröße ist im UI ein Pflichtfeld, kein stiller 1×1-Default.

### 2. Dekompressionsbomben / Ressourcenerschöpfung
**Bedrohung:** Ein manipuliertes Bild kann einen winzigen Header mit einer riesigen deklarierten Pixelanzahl haben (z. B. 50000×50000). Decodieren ohne Vorprüfung kann den Tab durch OOM zum Absturz bringen. Gleiches gilt für PDFs mit exzessiver Seitenzahl und Multipage-TIFFs mit vielen Frames.

**Gegenmaßnahmen:**
- Vor dem Dekodieren wird der Header geparst und die deklarierte Pixelanzahl geprüft. Harte Grenze konfigurierbar (in der zentralen Konfigurationsdatei, siehe ARCHITECTURE.md), Default 256 Megapixel.
- Überschreitung führt zu einer erklärenden Ablehnung (Kap. 11), nicht zu einem Crash.
- Gleiches Prinzip für PDF-Seitenzahl (Limit vor dem Rendern der ersten Seite prüfen) und Multipage-TIFF-Framezahl.

### 3. ZIP-Input (falls implementiert)
**Bedrohung:** Ordner-Upload oder ZIP-Import könnte Zip-Bomben (extreme Entpack-Ratio), Pfad-Traversal (`../../etc/...`), absolute Pfade oder Symlinks enthalten, die außerhalb des vorgesehenen Scratch-Space landen.

**Gegenmaßnahmen:**
- Entpack-Ratio-Limit (komprimierte vs. unkomprimierte Größe) vor vollständigem Entpacken prüfen.
- Pfad-Normalisierung: keine absoluten Pfade, kein `..`-Segment, keine Symlink-Einträge werden verfolgt.
- Alle entpackten Pfade werden relativ zum OPFS-Scratch-Root validiert, bevor geschrieben wird.

### 4. Third-Party-Requests zur Laufzeit
**Bedrohung:** Selbst unbeabsichtigt eingebundene Tracker, CDN-Referenzen oder Telemetrie würden das Kernversprechen „Datei verlässt das Gerät nie" untergraben — und wären durch einen Blick in den Netzwerk-Tab widerlegbar.

**Gegenmaßnahmen:**
- Alle Assets (App-Shell, WASM-Module, Fonts) werden self-hosted ausgeliefert.
- CSP `connect-src 'self'` unterbindet jeden Fetch/XHR/WebSocket zu Fremdhosts auf Protokollebene.
- Ein Playwright-E2E-Test prüft explizit, dass während eines vollständigen Konvertierungslaufs kein Request an eine fremde Domain geht (Kap. 18, Kap. 23 DoD).

### 5. WASM-Threads / SharedArrayBuffer
**Bedrohung:** `wasm-vips` mit Multithreading benötigt `SharedArrayBuffer`, das Browser nur in „cross-origin isolierten" Kontexten erlauben (Spectre-Mitigation). Ohne COOP/COEP ist das Feature schlicht nicht verfügbar, kein Sicherheitsloch — die Anforderung hier ist Funktionsfähigkeit, nicht Abwehr.

**Gegenmaßnahmen:**
- `Cross-Origin-Opener-Policy: same-origin` und `Cross-Origin-Embedder-Policy: require-corp` werden gesetzt.
- Als Konsequenz müssen alle eingebundenen Subressourcen (Fonts, WASM, evtl. Worker-Skripte) `same-origin` oder mit `Cross-Origin-Resource-Policy` versehen sein — daher self-hosting aller WASM-Module statt CDN-Bezug.

### 6. Emscripten `unsafe-eval` / WebAssembly-Kompilierung
**Bedrohung:** Manche Emscripten-Builds nutzen `eval`-artige Codepfade (z. B. für dynamische Funktionszeiger-Tabellen), was eine CSP-Lockerung erzwingen könnte — ein realer Sicherheitsverlust, wenn er unbemerkt bleibt oder breiter als nötig gewählt wird.

**Gegenmaßnahmen:**
- Jede eingesetzte Engine wird darauf geprüft, ob sie eine CSP-Lockerung benötigt.
- **Status Phase 1 (bestätigt, nicht mehr offen):** Die jsquash-Encoder (u. a. mozjpeg, Emscripten-kompiliert) rufen `WebAssembly.instantiate()` auf eine Art auf, die Chromium ohne `'wasm-unsafe-eval'` in `script-src` mit `CompileError: WebAssembly.instantiate(): Refused to compile or instantiate WebAssembly module` ablehnt — ein Playwright-E2E-Test hat das aufgedeckt (die Konvertierung schlug fehl, bis die Direktive ergänzt wurde).
- **Gewählte Direktive: `'wasm-unsafe-eval'`, nicht das breitere `'unsafe-eval'`.** `'wasm-unsafe-eval'` (CSP Level 3) erlaubt ausschließlich das Kompilieren/Instanziieren von WebAssembly-Modulen — nicht `eval()`, nicht `new Function()`, nicht String-basiertes `setTimeout`. Das ist die engstmögliche Lockerung für dieses Bedürfnis und bewusst dokumentiert statt stillschweigend übernommen.

### 7. Speichererschöpfung als Sicherheitsproblem
Siehe Kapitel 8 / ARCHITECTURE.md — ein OOM ist hier primär ein Stabilitäts-, nicht in erster Linie ein Security-Thema, wird aber aus Verfügbarkeitssicht mitgeführt: Ein einzelner Job darf abstürzen, nie die gesamte Queue oder der Tab.

## CSP-Entwurf

Ausgeliefert über Netlifys `_headers`-Datei.

```
default-src 'self';
script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval';
img-src 'self' blob: data:;
connect-src 'self';
frame-src 'self' blob:;
worker-src 'self' blob:;
object-src 'none';
base-uri 'none';
```

### Begründung je Direktive

| Direktive | Wert | Begründung |
|---|---|---|
| `default-src` | `'self'` | Restriktiver Fallback für jede Ressourcenart ohne eigene Direktive — nichts wird implizit von Fremdhosts geladen. |
| `script-src` | `'self' 'unsafe-inline' 'wasm-unsafe-eval'` | **Zwei Ergänzungen gegenüber dem Phase-0-Entwurf, beide durch den Phase-1-E2E-Test aufgedeckt:** `'unsafe-inline'`, weil Next.js' App Router auch im vollständig statischen Export kleine ausführbare Inline-`<script>`-Tags einbettet (u. a. den React-Server-Components-Streaming-Payload `self.__next_f.push(...)`) — ohne das führt die CSP dazu, dass die App gar kein eigenes JavaScript mehr ausführt. `'wasm-unsafe-eval'`, weil die Emscripten-kompilierten jsquash-Encoder (mozjpeg u. a.) `WebAssembly.instantiate()` sonst mit einem `CompileError` verweigert bekommen (siehe Punkt 6 oben) — bewusst die enge WASM-spezifische Direktive, nicht das breitere `'unsafe-eval'`. Alle Skripte kommen weiterhin ausschließlich von `'self'`, kein Fremdhost ist erlaubt. |
| `img-src` | `'self' blob: data:'` | `blob:` für aus WASM-Konvertierung erzeugte Vorschau-/Ergebnisbilder und für sanitized SVG-Rasterisierung; `data:` für kleine eingebettete Testbilder der Capability-Probe (Kap. 5). Kein Fremdhost, da keine externen Bilder geladen werden müssen. |
| `connect-src` | `'self'` | Verhindert jeden `fetch`/`XHR`/WebSocket zu einer fremden Domain — das ist die technische Durchsetzung des „kein Endpunkt"-Versprechens, per Playwright-Test verifiziert. |
| `frame-src` | `'self' blob:'` | `blob:` wird für das sandboxed iframe zur SVG-Rasterisierung benötigt (Alternative zum `<img>`-Pfad); kein Fremd-Frame nötig. |
| `worker-src` | `'self' blob:'` | Web Worker werden self-hosted erzeugt; `blob:` wird von manchen Bundlern für dynamisch erzeugte Worker-Skripte benötigt. |
| `object-src` | `'none'` | Kein Plugin-Content (Flash, Java-Applets o.ä.) — reduziert Angriffsfläche ohne Funktionsverlust, da nichts davon genutzt wird. |
| `base-uri` | `'none'` | Verhindert, dass eine injizierte `<base>`-Tag relative URLs der Seite auf einen fremden Host umbiegt. |

Beide Ergänzungen wurden nicht spekulativ vorgenommen, sondern erst, nachdem der Playwright-E2E-Test die App tatsächlich in einem Browser mit dieser CSP hat scheitern lassen — reproduzierbar über `npx playwright test` gegen den in `scripts/serve-static.mjs` nachgebildeten Header-Satz.

### Zusätzliche Header

- `X-Content-Type-Options: nosniff` — verhindert MIME-Sniffing, das eine als Bild ausgelieferte Datei als Script interpretieren könnte.
- `Referrer-Policy: no-referrer` — es gibt keinen legitimen Grund, Referrer-Information an irgendeinen externen Ziel-Host zu senden, da keiner kontaktiert wird.
- `Permissions-Policy` — restriktiv, alle nicht benötigten Browser-Features (Kamera, Mikrofon, Geolocation, etc.) deaktiviert.
- `Strict-Transport-Security` (HSTS) — erzwingt HTTPS für alle zukünftigen Verbindungen zur Domain.
- `Cross-Origin-Opener-Policy: same-origin`, `Cross-Origin-Embedder-Policy: require-corp` — siehe Punkt 5 oben.

## Offene Punkte für Phase 1

- Konkrete `unsafe-eval`-Prüfung pro eingesetzter WASM-Engine-Build.
- Exakte Werte für Pixel-Limit, ZIP-Entpack-Ratio-Limit und PDF-Seitenlimit landen in der zentralen Konfigurationsdatei (ARCHITECTURE.md) — Defaults hier genannt, aber nicht in Stein gemeißelt.
