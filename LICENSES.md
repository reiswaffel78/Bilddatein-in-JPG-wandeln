# Licenses

Phase-0-Dokument. Lizenzlage jeder geplanten Abhängigkeit aus Kapitel 3, 4 und 6. Muss vor jeder Implementierung erneut geprüft werden, da sich Lizenzen zwischen Versionen ändern können — diese Liste ist Planungsstand, kein Lizenz-Audit einer konkreten `package.json`.

## Framework / Tooling

| Abhängigkeit | Lizenz | Anmerkung |
|---|---|---|
| Next.js | MIT | Nur Static Export genutzt, keine Server-Features |
| TypeScript | Apache-2.0 | |
| Tailwind CSS | MIT | |
| shadcn/ui | MIT | Copy-in-Komponenten, keine Laufzeit-Abhängigkeit im klassischen Sinn |
| Comlink | Apache-2.0 | |
| Vitest | MIT | Dev-Dependency |
| Playwright | Apache-2.0 | Dev-Dependency |

## Engines

| Abhängigkeit | Lizenz | Anmerkung |
|---|---|---|
| wasm-vips | LGPL-2.1-or-later (libvips selbst; Bindings i. d. R. MIT) | **Zu prüfen:** LGPL erlaubt dynamisches Linken/Verwendung als Bibliothek ohne Copyleft-Zwang für den eigenen Code, solange nicht statisch un-austauschbar verlinkt wird. Bei WASM-Kompilation ist die genaue LGPL-Konformität (Austauschbarkeit der Bibliothek) im Detail zu klären — üblicherweise durch Bereitstellung der Objektdateien/Möglichkeit zum Neulinken erfüllt. Kein AGPL, aber nicht trivial „lizenzfrei". |
| vips-heif.wasm (libheif-Bindings) | LGPL-3.0 (libheif) | Nur Dekodierung wird genutzt (Kap. 6) — reduziert, aber ändert nichts an der Lizenzpflicht selbst. HEVC-Patente sind ein separates Thema, siehe unten. |
| vips-jxl.wasm (libjxl-Bindings) | BSD-3-Clause / Apache-2.0 (libjxl) | Unproblematisch. |
| @jsquash/* | MIT (Wrapper) — zugrundeliegende Codecs variieren: mozjpeg (BSD-artige „IJG-like" Lizenz), libwebp (BSD-3-Clause), etc. | Je Codec-Paket bei Implementierung einzeln prüfen. |
| LibRaw-Wasm (ybouane) | LibRaw selbst: **dual-lizenziert LGPL-2.1 / CDDL-1.0**, Wrapper meist MIT | LibRaw's Lizenzwahl (LGPL vs. CDDL) beeinflusst Distributionspflichten; für eine WASM-Einbindung ohne Modifikation der LibRaw-Quelle i. d. R. unkritisch, aber nicht ungeprüft übernehmen. |
| ag-psd | MIT | |
| pdf.js | Apache-2.0 | |
| pdf-lib | MIT | |
| UTIF.js | MIT | |
| DOMPurify | Apache-2.0 / MIT (dual) | |
| mozjpeg (Encoder, via wasm-vips oder @jsquash) | Eigene „IJG-like" BSD-artige Lizenz (zlib/libpng-ähnlich) | Permissiv, keine Copyleft-Pflicht. |
| lcms (Farbraumtransformation) | MIT | |
| potrace-wasm (Tier 3, trace) | GPL-2.0 (Original potrace) — WASM-Port-Lizenz je nach Paket prüfen | **Achtung:** potrace selbst ist GPL, nicht AGPL, aber GPL-Copyleft gilt bei Distribution des kompilierten Ergebnisses. Vor Tier-3-Freigabe explizit zu klären, welches WASM-Port-Paket verwendet wird und mit welcher Lizenz es das GPL-Original umschließt. |
| Ghostscript-WASM (Tier 3, EPS/AI/PS) | **AGPL-3.0** | **⚠️ Kritisch, siehe unten und RISKS.md.** |

## ⚠️ AGPL / GPL — explizit markiert

### Ghostscript-WASM
**Lizenz: AGPL-3.0.**
Ghostscript ist unter AGPL lizenziert, sobald keine kommerzielle Artifex-Lizenz erworben wird. AGPL Section 13 erweitert die Copyleft-Pflicht der GPL auf **Netzwerknutzung**: Wird die Software (auch nur als Teil einer Web-App, mit der Nutzer über ein Netzwerk interagieren) öffentlich erreichbar gemacht, muss der **vollständige korrespondierende Quellcode der gesamten kombinierten Anwendung** unter AGPL-kompatibler Lizenz offengelegt werden — nicht nur der Ghostscript-Teil.

**Entscheidung getroffen (siehe `RISKS.md`): Ja.** Das gesamte Repository wird bei Integration von Ghostscript-WASM unter einer AGPL-3.0-kompatiblen Lizenz offengelegt. Damit ist EPS/AI/PostScript-Support grundsätzlich freigegeben — bleibt aber Tier 3 und wird erst nach Phase 1–3 umgesetzt. Vor der tatsächlichen Integration braucht das Repository eine explizite `LICENSE`-Datei (z. B. AGPL-3.0), die aktuell noch fehlt, weil noch keine AGPL-Abhängigkeit eingebunden ist.

### potrace (Tier 3, `trace`-Modus)
GPL-2.0, kein AGPL — die Netzwerk-Klausel greift hier nicht, aber Distribution des kompilierten WASM-Artefakts unterliegt weiterhin GPL-Copyleft-Pflichten für den Ghostscript-artigen Teil. Weniger kritisch als Ghostscript, aber vor Tier-3-Freigabe separat zu prüfen — insbesondere, welches konkrete WASM-Portierungspaket verwendet wird und ob es zusätzliche Bedingungen mitbringt.

### libheif / libvips (LGPL)
Kein Copyleft-Zwang für eigenen Anwendungscode bei korrekter dynamischer/austauschbarer Einbindung, aber **nicht mit AGPL/GPL-Fällen verwechseln** — LGPL verlangt keine Offenlegung des eigenen Codes. Trotzdem: die genaue WASM-Linking-Situation (statisch vs. „austauschbar" im Sinne der LGPL) ist bei Emscripten-Kompilaten nicht immer eindeutig und sollte vor Phase-1-Implementierung von einer Person mit Lizenz-Erfahrung gegengeprüft werden.

## Patentthemen (unabhängig von Copyright-Lizenz)

### HEVC / H.265 (betrifft HEIC-Encoding)
HEIC/HEIF nutzt HEVC-Videokompression für Standbilder. HEVC ist durch ein fragmentiertes Patent-Pool-System (MPEG LA, Access Advance, teils Einzelpatente) abgedeckt, dessen Lizenzgebühren typischerweise an Hersteller/Distributoren adressiert sind, nicht an Open-Source-Bibliotheksnutzung im Speziellen — die Rechtslage für ein kostenloses Hobby-Projekt ohne kommerzielle Verwertung ist uneinheitlich und nicht risikofrei genug, um sie zu ignorieren.
**Konsequenz (bereits in Kapitel 6 festgelegt, hier nur lizenzseitig dokumentiert):** Nur HEIC-**Dekodierung** wird gebaut. HEVC-**Encoding** (`→ HEIC`) wird nicht implementiert. Das ist keine offene Frage mehr, sondern eine getroffene Entscheidung — sie steht hier zur Nachvollziehbarkeit, nicht zur erneuten Diskussion.

## Grundsatz für Phase 1

Vor jeder tatsächlichen Dependency-Installation: Lizenz der exakten verwendeten Version (nicht nur des Projekts allgemein) gegenprüfen, da sich Lizenzen zwischen Majorversionen ändern können (Beispiel-Muster in der Praxis, nicht spezifisch für ein hier gelistetes Paket). Diese Datei wird bei jeder neuen Abhängigkeit aktualisiert.
