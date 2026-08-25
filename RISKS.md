# Risks & Open Decisions

Phase-0-Dokument. Enthält die beiden in Kapitel 6 markierten offenen Entscheidungen — als Rückfragen, nicht als getroffene Wahl — sowie eigene Einschätzungen zu Anforderungen aus dem Auftrag, die für nicht umsetzbar, unrealistisch oder falsch priorisiert gehalten werden. Diese Datei ist bei jedem Phasenabschluss zu aktualisieren (Kapitel 23).

## Offene Entscheidungen aus Kapitel 6 — Rückfrage an den Auftraggeber

### Offene Entscheidung 1: Ghostscript-WASM (EPS/AI/PostScript, Tier 3)
Ghostscript ist AGPL-3.0-lizenziert. AGPL Section 13 erweitert die Copyleft-Pflicht auf Netzwerknutzung: Sobald die App öffentlich über ein Netzwerk erreichbar ist — was auf Netlify der Fall ist, auch bei nur zweistelligem Nutzerkreis —, muss der vollständige korrespondierende Quellcode der **gesamten kombinierten Anwendung** unter einer AGPL-kompatiblen Lizenz verfügbar gemacht werden, nicht nur der Ghostscript-Teil.

**Diese Entscheidung wird hier nicht getroffen.** Es braucht eine explizite Antwort auf:
- Ist der Auftraggeber bereit, das gesamte Repository unter einer AGPL-kompatiblen Lizenz offenzulegen, damit EPS/AI/PostScript-Support gebaut werden kann?
- Falls nein: EPS/AI/PostScript entfällt ersatzlos aus Tier 3, dauerhaft, nicht nur „vorerst".
- Falls ja: alle anderen Abhängigkeiten im Projekt müssen auf AGPL-Kompatibilität geprüft werden (siehe `LICENSES.md`) — nicht nur die Ghostscript-Einbindung selbst.

Es gibt keine dritte Option (z. B. „nur ein bisschen AGPL"). Solange keine Antwort vorliegt, bleibt Ghostscript-WASM ungebaut.

### Offene Entscheidung 2: Conversion History (Kapitel 13)
`ARCHITECTURE.md` beschreibt das IndexedDB-Schema für eine mögliche History-Funktion, `SCOPE.md` führt sie als nicht automatisch in Version 1 enthalten. Implementiert wird sie nicht ohne Freigabe.

Offene Fragen an den Auftraggeber:
- Soll die History überhaupt gebaut werden, oder ist „kein Account, keine Datenspur" auch hier die einfachere und im Sinne des Projekts konsequentere Wahl?
- Falls ja: reicht der in Kapitel 13 beschriebene Umfang (Zeitstempel, Formate, Größe, Einstellungen, Status, Dauer; Dateinamen nur separat aktivierbar; 30-Tage-Default-Retention), oder soll er reduziert werden?
- Opt-in ist in Kapitel 13 als Default „deaktiviert" festgelegt — das wird hier nicht in Frage gestellt, nur die Existenz der Funktion selbst.

## Eigene Risikoeinschätzung zu Anforderungen aus dem Auftrag

### R1 — Widerspruch zwischen Laufzeit-Probe (Kap. 5) und Lazy-Loading-Gebot (Kap. 4)
Kapitel 5 verlangt, dass die Capability-Matrix „beim Start aus einem echten Probe-Lauf der Engines gebaut" wird — inklusive Abfrage der tatsächlich einkompilierten Loader/Saver von `wasm-vips`. Kapitel 4 verlangt, dass der Initial-Load „kein WASM außer dem, was für die Startseite nötig ist" enthält. Um `wasm-vips`' echte Loader/Saver-Liste abzufragen, muss `vips.wasm` geladen sein — das widerspricht dem Lazy-Load-Gebot für alles außer Tier-1-Formate, die auf der Startseite ohnehin sofort gebraucht werden.
**Einschätzung:** lösbar, aber nicht wie geschrieben widerspruchsfrei. Praktikabler Kompromiss: Tier-1-Engines (die ohnehin für die Startseite geladen werden) werden real geprobt; Tier-2/3-Engines werden erst bei Bedarf geladen **und dann erst** in die Matrix eingetragen (Matrix wird inkrementell ergänzt, nicht einmalig beim Start vollständig gebaut). Das weicht von „beim Start" leicht ab und sollte als Klarstellung, nicht als stille Umsetzung, festgehalten werden.

### R2 — mozjpeg als Encoder in Kombination mit wasm-vips
Kapitel 9 schreibt mozjpeg als JPEG-Encoder vor. Standard-Builds von `wasm-vips` verwenden üblicherweise `libjpeg-turbo`, nicht mozjpeg, als JPEG-Backend. Ein mozjpeg-Encoder in Kombination mit vips zu bekommen kann einen eigenen Emscripten-Build von vips gegen mozjpeg statt libjpeg-turbo erfordern, oder den JPEG-Pfad separat über `@jsquash/mozjpeg` zu führen und damit den in Kapitel 4 formulierten Grundsatz „keine zwei Engines für denselben Pfad ohne dokumentierten Grund" zu berühren.
**Einschätzung:** technisch machbar, aber mit mehr Custom-Build-Aufwand verbunden, als der Auftrag suggeriert. Sollte in Phase 1 als früher Spike geprüft werden, nicht erst beim Implementieren des JPEG-Pfads.

### R3 — Modulare vips-Loader (`vips-heif.wasm`, `vips-jxl.wasm`) als getrennt nachladbare Module
Kapitel 4 verlangt, HEIF- und JXL-Support als separat nachladbare WASM-Module von vips zu trennen. Die offiziellen `wasm-vips`-Distributionen bieten diese Granularität nicht ohne Weiteres als fertige, getrennt ladbare Artefakte an — das kann einen eigenen Build-Schritt gegen den vips-Quellbaum bedeuten, inklusive Pflege bei jedem Upstream-Update.
**Einschätzung:** Aufwand und Wartungslast sind für ein Hobby-Projekt mit zweistelligem Nutzerkreis potenziell unverhältnismäßig zum Nutzen (schnellerer Initial-Load für ein Nischenformat). Empfehlung: in Phase 1 zunächst mit dem größeren, ungetrennten vips-Bundle für HEIC/JXL starten und die Modul-Trennung erst nachziehen, falls Ladezeiten real ein Problem sind — nicht umgekehrt.

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

## Hinweis zur Vollständigkeit dieser Datei

Diese Liste ist der Stand nach Lektüre des vollständigen Auftrags in Phase 0. Sie wird, wie in Kapitel 23 gefordert, am Ende jeder folgenden Phase aktualisiert — insbesondere sobald zu R1–R3 belastbare technische Spikes vorliegen und sobald der Auftraggeber die beiden offenen Entscheidungen beantwortet hat.
