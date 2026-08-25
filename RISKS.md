# Risks & Open Decisions

Phase-0-Dokument. Enthält die beiden in Kapitel 6 markierten Entscheidungen — inzwischen vom Auftraggeber beantwortet, siehe unten — sowie eigene Einschätzungen zu Anforderungen aus dem Auftrag, die für nicht umsetzbar, unrealistisch oder falsch priorisiert gehalten werden. Diese Datei ist bei jedem Phasenabschluss zu aktualisieren (Kapitel 23).

## Entscheidungen aus Kapitel 6 — beantwortet

### Entscheidung 1: Ghostscript-WASM (EPS/AI/PostScript, Tier 3) — **Beantwortet: Code wird offengelegt**
Ghostscript ist AGPL-3.0-lizenziert. AGPL Section 13 erweitert die Copyleft-Pflicht auf Netzwerknutzung: Sobald die App öffentlich über ein Netzwerk erreichbar ist — was auf Netlify der Fall ist, auch bei nur zweistelligem Nutzerkreis —, muss der vollständige korrespondierende Quellcode der **gesamten kombinierten Anwendung** unter einer AGPL-kompatiblen Lizenz verfügbar gemacht werden, nicht nur der Ghostscript-Teil.

**Entscheidung des Auftraggebers:** Ja — das gesamte Repository wird unter einer AGPL-kompatiblen Lizenz offengelegt, damit EPS/AI/PostScript-Support (Tier 3) gebaut werden darf.

Konsequenzen für die weitere Umsetzung:
- Das Repository braucht eine explizite `LICENSE`-Datei mit einer AGPL-3.0-kompatiblen Lizenz (z. B. AGPL-3.0 selbst), sobald Ghostscript tatsächlich integriert wird — vor Tier-3-Implementierung nachzutragen.
- Alle anderen Abhängigkeiten sind bereits MIT/Apache/BSD/LGPL (siehe `LICENSES.md`) und damit mit AGPL kombinierbar — keine weitere Prüfung nötig, außer bei künftigen neuen Abhängigkeiten.
- Ghostscript-WASM bleibt trotzdem Tier 3 und wird erst nach den in Kapitel 22 vorgesehenen Phasen 1–3 angegangen, nicht vorgezogen.
- Die Lizenzwahl gilt für das gesamte Projekt ab dem Moment, in dem Ghostscript integriert wird — nicht rückwirkend nötig, solange Tier 3 noch nicht gebaut ist.

### Entscheidung 2: Conversion History (Kapitel 13) — **Beantwortet: wird gebaut, wie in Kapitel 13 beschrieben**
`ARCHITECTURE.md` beschreibt das IndexedDB-Schema für die History-Funktion.

**Entscheidung des Auftraggebers:** Ja, im vollen in Kapitel 13 beschriebenen Umfang — Zeitstempel, Quell-/Zielformat, Dateigröße, Einstellungen, Ergebnisstatus, Dauer; standardmäßig **deaktiviert** (Opt-in); Dateinamen nur bei separater Aktivierung; Aufbewahrungsfrist wählbar, Default 30 Tage, automatische Bereinigung beim App-Start; ein Klick löscht alles. Keine Dateien, Dateiinhalte oder Vorschaubilder werden je gespeichert.

Die Implementierung erfolgt zum in Kapitel 22 vorgesehenen Zeitpunkt (Phase 2, zusammen mit Presets/Rename/PWA/i18n), nicht vorgezogen in Phase 1.

## Eigene Risikoeinschätzung zu Anforderungen aus dem Auftrag

### R1 — Widerspruch zwischen Laufzeit-Probe (Kap. 5) und Lazy-Loading-Gebot (Kap. 4)
Kapitel 5 verlangt, dass die Capability-Matrix „beim Start aus einem echten Probe-Lauf der Engines gebaut" wird — inklusive Abfrage der tatsächlich einkompilierten Loader/Saver von `wasm-vips`. Kapitel 4 verlangt, dass der Initial-Load „kein WASM außer dem, was für die Startseite nötig ist" enthält. Um `wasm-vips`' echte Loader/Saver-Liste abzufragen, muss `vips.wasm` geladen sein — das widerspricht dem Lazy-Load-Gebot für alles außer Tier-1-Formate, die auf der Startseite ohnehin sofort gebraucht werden.
**Einschätzung:** lösbar, aber nicht wie geschrieben widerspruchsfrei. Praktikabler Kompromiss: Tier-1-Engines (die ohnehin für die Startseite geladen werden) werden real geprobt; Tier-2/3-Engines werden erst bei Bedarf geladen **und dann erst** in die Matrix eingetragen (Matrix wird inkrementell ergänzt, nicht einmalig beim Start vollständig gebaut). Das weicht von „beim Start" leicht ab und sollte als Klarstellung, nicht als stille Umsetzung, festgehalten werden.
**Update nach Phase 1:** Da wasm-vips in Phase 1 gar nicht eingesetzt wurde (siehe R2/R3-Update), hat sich dieser Konflikt so nicht gestellt — die tatsächlich gebaute Matrix kombiniert eine echte Native-Decode-Probe (für GIF/BMP) mit deklarativ bekannten jsquash/UTIF/Eigenbau-Fähigkeiten, ohne dafür zusätzliches WASM beim Start zu laden.

### R2 — mozjpeg als Encoder in Kombination mit wasm-vips
Kapitel 9 schreibt mozjpeg als JPEG-Encoder vor. Standard-Builds von `wasm-vips` verwenden üblicherweise `libjpeg-turbo`, nicht mozjpeg, als JPEG-Backend. Ein mozjpeg-Encoder in Kombination mit vips zu bekommen kann einen eigenen Emscripten-Build von vips gegen mozjpeg statt libjpeg-turbo erfordern, oder den JPEG-Pfad separat über `@jsquash/mozjpeg` zu führen und damit den in Kapitel 4 formulierten Grundsatz „keine zwei Engines für denselben Pfad ohne dokumentierten Grund" zu berühren.
**Einschätzung:** technisch machbar, aber mit mehr Custom-Build-Aufwand verbunden, als der Auftrag suggeriert. Sollte in Phase 1 als früher Spike geprüft werden, nicht erst beim Implementieren des JPEG-Pfads.
**Update nach Phase 1 — Entscheidung getroffen:** Der frühe Spike hat ergeben, dass ein eigener wasm-vips-Build in einer Session mit vertretbarem Aufwand nicht seriös umsetzbar ist (Emscripten-Toolchain, Threads/COOP-COEP-Feinschliff, Upstream-Pflege). Für Tier 1 wird deshalb **ausschließlich `@jsquash/*`** verwendet (mozjpeg für JPEG, oxipng für PNG, native WebP/AVIF/JXL-Codecs) — ein einzelner, in sich konsistenter Encoder-Satz statt einer vips+jsquash-Mischung. `wasm-vips` ist damit für Tier 1 vollständig gestrichen, nicht nur verschoben. Das ist eine Abweichung von `ARCHITECTURE.md`s ursprünglicher Engine-Tabelle, dort inzwischen nachgetragen.

### R3 — Modulare vips-Loader (`vips-heif.wasm`, `vips-jxl.wasm`) als getrennt nachladbare Module
Kapitel 4 verlangt, HEIF- und JXL-Support als separat nachladbare WASM-Module von vips zu trennen. Die offiziellen `wasm-vips`-Distributionen bieten diese Granularität nicht ohne Weiteres als fertige, getrennt ladbare Artefakte an — das kann einen eigenen Build-Schritt gegen den vips-Quellbaum bedeuten, inklusive Pflege bei jedem Upstream-Update.
**Update nach Phase 1:** Gegenstandslos für Tier 1 (siehe R2-Update) — JXL läuft über `@jsquash/jxl`, per dynamischem `import()` ohnehin lazy nachgeladen. HEIF/HEIC bleibt Tier 2 und ist noch nicht gebaut; die Frage, ob `wasm-vips` dafür doch gebraucht wird oder ein schmalerer HEIF-Decoder reicht, ist neu zu bewerten, wenn Tier 2 ansteht.

### R4 — Speicherstabilität auf iOS ist nur teilweise durch die App kontrollierbar
Kapitel 8 setzt „Speicherstabilität auf schwachen Geräten" als Priorität 3 und beschreibt Gegenmaßnahmen (lowmem-Variante, 256 MB Cap, Worker-Recycling). iOS Safari terminiert Tabs bei Speicherdruck nach eigenen, nicht dokumentierten und nicht von der Seite kontrollierbaren Heuristiken, unabhängig vom internen vips-Cap — ein 256-MB-Cap in vips verhindert nicht, dass Safari den gesamten Tab wegen Gesamtspeicherverbrauchs (DOM, andere Tabs, System) killt.
**Einschätzung:** Die im Auftrag beschriebenen Maßnahmen sind richtig und nötig, aber die Formulierung „Speicherstabilität" sollte im Erwartungsmanagement (README, UI-Text) nicht als Garantie kommuniziert werden — auf sehr alten/schwachen iOS-Geräten bleibt ein Restrisiko für harte Tab-Abstürze bestehen, das die App nicht abfangen kann.

### R5 — Butteraugli/SSIM-Golden-File-Tests für jeden Tier-1-Pfad sind aufwändiger als der Rahmen vermuten lässt
Kapitel 17 verlangt für jeden Tier-1-Pfad einen Butteraugli-/SSIM-Score gegen eine Referenzkonvertierung über definiertem Schwellwert. Das braucht: gepflegte Referenzkonvertierungen (womit erzeugt, mit welcher Version, wie reproduzierbar?), eine Butteraugli/SSIM-Tooling-Integration im Test-Runner, und gepflegte Schwellwerte pro Formatpaar — nicht nur pro Format.
**Einschätzung:** sinnvoll und richtig priorisiert (Kapitel 2, Priorität 1), aber der Aufwand dafür ist für ein Hobby-Projekt mit Freundeskreis-Nutzerzahl erheblich höher als der restliche Testrahmen. Empfehlung: Schwellwerte und Referenzverfahren bewusst grob/einfach halten (z. B. ein einzelnes SSIM-Tool statt beider Metriken), statt ein volles Qualitätsmess-Framework zu bauen, das mehr Pflegeaufwand als der Rest der App erzeugt.

### R6 — RAW-Formatbreite „und was LibRaw sonst öffnet" ist keine belastbare Zusage
Kapitel 6 verweist für RAW auf die Laufzeit-Probe von LibRaw-Wasm statt auf eine feste Liste. `LibRaw-Wasm` (ybouane) ist ein Community-Wasm-Port mit eigenem Aktualisierungsrhythmus, der hinter der offiziellen LibRaw-Bibliothek herhinken kann — neue Kamera-RAW-Varianten (insbesondere von aktuellen Kameramodellen) sind möglicherweise erst mit Verzögerung oder gar nicht unterstützt.
**Einschätzung:** Die Laufzeit-Probe ist der richtige Mechanismus (Kapitel 5, ehrlich über Grenzen), aber die Erwartung „was LibRaw sonst öffnet" im Auftragstext sollte nicht als „nahezu jedes RAW-Format" verstanden werden. Sollte im UI-Text so kommuniziert werden, dass ein nicht unterstütztes RAW-Format eine normale, keine überraschende Antwort ist.

### R7 — WCAG AA plus vollständige i18n-Struktur für einen zweistelligen, dem Entwickler bekannten Nutzerkreis
Kapitel 15 verlangt WCAG-AA-Konformität (Tastaturnavigation, Screenreader-Labels, Kontrast) und i18n-Struktur für DE/EN ab Phase 1 „für weitere Sprachen" vorbereitet. Der in Kapitel 2 beschriebene Nutzerkreis ist der Entwickler und ein kleiner Freundeskreis, ohne Wachstums- oder SEO-Ziel.
**Einschätzung:** WCAG AA ist unabhängig von der Nutzerzahl richtig, wenn es Screenreader-Nutzer im Freundeskreis gibt oder geben könnte — das ist hier nicht auszuschließen und daher nicht per se falsch priorisiert. Die i18n-Struktur „für weitere Sprachen vorbereitet" über DE/EN hinaus ist jedoch eine Investition, deren Nutzen bei diesem Nutzerkreis nicht ersichtlich ist. Empfehlung: DE/EN wie gefordert, aber keine zusätzliche Infrastruktur für hypothetische künftige Sprachen über das hinaus, was ein normales i18n-Setup (z. B. Key-basierte Strings) ohnehin mitbringt.

### R8 — Lighthouse-Ziel „über 90" bei vollem WASM-/Worker-Stack
Kapitel 23 verlangt Lighthouse Performance und Accessibility über 90. Eine App mit Web-Worker-Pool, mehreren lazy-geladenen WASM-Modulen und OPFS-Zugriff kann bei Performance-Metriken (insbesondere Time to Interactive, Total Blocking Time) durch reines Vorhandensein von großen JS-Bundles für Worker-Orchestrierung unter Druck geraten, auch wenn WASM selbst korrekt lazy geladen wird.
**Einschätzung:** erreichbar, aber nicht automatisch — sollte als eigener, ernstgenommener Performance-Budget-Posten in Phase 1/2 behandelt werden, nicht als Nebenprodukt der übrigen Arbeit.

### R9 — File System Access API ist kein Teil der Format-Capability-Matrix, aber ebenso browserabhängig
Kapitel 3 und 10 setzen die File System Access API für Ordner-Input und Direktschreiben voraus, mit Fallback auf `<input webkitdirectory>` plus ZIP. Diese Browser-Feature-Erkennung ist konzeptionell dieselbe Art von „nicht überall verfügbar" wie die Format-Matrix aus Kapitel 5, wird im Auftrag aber nicht derselben Laufzeit-Probe-Logik unterstellt.
**Einschätzung:** kein Widerspruch, aber eine Lücke in der Spezifikation. Empfehlung: dieselbe Ehrlichkeitsregel („nie mehr behaupten als die Laufzeit belegt", Kapitel 12) explizit auch auf Feature-Erkennung jenseits der Format-Matrix ausweiten (File System Access API, SharedArrayBuffer/COOP-COEP-Status, OPFS-Verfügbarkeit) — nicht nur auf Format-Paare.

## Konkrete Findings aus der Phase-1-Implementierung

Diese vier Punkte wurden nicht spekulativ identifiziert, sondern jeweils durch einen tatsächlich fehlschlagenden Playwright-E2E-Test aufgedeckt und danach behoben. Sie stehen hier, weil sie beim nächsten größeren Umbau (z. B. Wechsel auf eine echte wasm-vips-Integration in Tier 2) erneut auftreten könnten.

### R10 — CSP `script-src 'self'` allein reicht für Next.js' Static Export nicht
Next.js' App Router bettet auch im vollständig statischen Export ausführbare Inline-`<script>`-Tags ein (u. a. den React-Server-Components-Streaming-Payload). Ohne `'unsafe-inline'` führt die in `SECURITY.md` ursprünglich entworfene CSP dazu, dass die Seite ihr eigenes JavaScript gar nicht erst ausführt — kein Fehler in der Konvertierungslogik, sondern ein kompletter Totalausfall der App, der beim bloßen Betrachten des gebauten HTML leicht übersehen wird. Behoben durch Ergänzung von `'unsafe-inline'` in `script-src` (siehe `SECURITY.md`, Direktiventabelle).

### R11 — Emscripten-WASM-Encoder brauchen `'wasm-unsafe-eval'`, nicht nur ein „vielleicht"
Kapitel 7 hat diesen Fall als hypothetisch offenen Punkt vorgesehen („falls Emscripten unsafe-eval erzwingt"). Er ist eingetreten: `WebAssembly.instantiate()` der jsquash-mozjpeg-Kompilate wird ohne `'wasm-unsafe-eval'` in `script-src` mit einem `CompileError` verweigert. Die engere, WASM-spezifische CSP-Direktive `'wasm-unsafe-eval'` (statt des breiteren `'unsafe-eval'`) genügt und wurde ergänzt. **Für Tier 2/3:** Jede neue WASM-Engine ist gegen die aktuelle CSP zu testen, bevor sie als „funktioniert" gilt — ein grüner `npm run build` allein beweist das nicht, nur ein E2E-Lauf im echten Browser mit den echten Headern.

### R12 — `new Worker(url, { type: 'module' })` ist mit Next.js' Worker-Chunk-Bundling inkompatibel
Next.js/Webpack kompiliert den Code hinter `new Worker(new URL('./worker.ts', import.meta.url))` zu einem klassischen, `importScripts()`-basierten Chunk-Loading-Runtime — nicht zu echtem ESM. Ein mit `{ type: 'module' }` erzeugter Worker lehnt `importScripts()` intern ab und stürzt sofort mit einem leeren, nicht diagnostizierbaren `error`-Event ab (keine Fehlermeldung, keine Zeilennummer). Das sah zunächst wie ein unerklärliches Hängenbleiben aus und ließ sich erst über `worker.addEventListener('error', ...)` in einem eigenen Debug-Skript nachweisen. **Fix:** `new Worker(...)` ohne `{ type: 'module' }` verwenden — der von Next.js erzeugte Code ist bereits klassisch-kompatibel. Für Tier 2/3 gilt: jede neue `new Worker(...)`-Stelle ohne `type: 'module'` anlegen, nicht nach vermeintlich „modernerer" ESM-Syntax greifen.

### R13 — Next.js' inkrementeller Webpack-Cache kann einen falschen Chunk-Hash für Worker-Einstiegspunkte einfrieren
Bei wiederholten `npm run build`-Läufen mit unverändertem `webpack-*.js`-Runtime-Chunk, aber geändertem Worker-Chunk-Inhalt, blieb die in `webpack-*.js` fest einkompilierte Hash-Formel für den Worker-Chunk (`s.u=function(e){return"static/chunks/"+e+".<alter-hash>.js"}`) auf einem veralteten Wert stehen, während der Worker-Chunk selbst unter einem neuen Hash gebaut wurde — der Browser fragte dann eine nicht existierende Datei an (404) und die Konvertierung hing scheinbar grundlos fest. **Nur ein vollständiger Clean-Build (`rm -rf .next out && npm run build`) behebt das zuverlässig.** Für Netlify-Deploys aus einem frischen Checkout unkritisch (kein alter `.next`-Cache vorhanden), aber ein reales Risiko für lokale Entwicklung und für CI-Setups mit Build-Cache. Siehe README.md „Build (statischer Export)" für die Handlungsanweisung. Sollte dieses Verhalten in einer künftigen Next.js-Version fortbestehen, gehört ein `rm -rf .next` fest in den `build`-Skript-Schritt, nicht nur in die Doku.

## Hinweis zur Vollständigkeit dieser Datei

Diese Liste wurde in Phase 0 begonnen und wird, wie in Kapitel 23 gefordert, am Ende jeder folgenden Phase aktualisiert. R1–R3 sind nach dem Phase-1-Spike aktualisiert, R10–R13 sind neu aus der tatsächlichen Implementierung hinzugekommen. Der Implementierungsstand (was aus Phase 1 fertig ist, was noch aussteht) steht in `SCOPE.md`.
