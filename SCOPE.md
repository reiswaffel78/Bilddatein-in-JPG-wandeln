# Scope

Phase-0-Dokument. Was Version 1 exakt kann und was ausdrücklich nicht — als Referenz für Erwartungsmanagement gegenüber dem kleinen Nutzerkreis (Entwickler + Freunde) und als Leitplanke gegen Scope Creep.

„Version 1" bezeichnet hier den Stand nach Abschluss von Phase 1–2 (Tier 1 vollständig, Kernbedienung, Batch, PWA-Grundgerüst). Tier 2/3 sind separat markiert, da sie eigene Freigaben durchlaufen.

## Was Version 1 kann

- Konvertierung vollständig im Browser, kein Server-Roundtrip für Nutzerdateien, jederzeit im Netzwerk-Tab verifizierbar.
- Lesen **und** Schreiben von JPEG/JPG/JFIF, PNG, WebP, AVIF, TIFF/TIF, GIF, BMP, JPEG XL.
- Nur Lesen: ICO, SVG (sanitized rasterisiert), PPM/PGM/PBM.
- Simple Mode: Dropzone → Format-Erkennung → Zielformat → Qualität → Konvertieren → Download.
- Advanced-Optionen: Resize (mehrere Modi), DPI als Metadatenfeld, Farbraum (sRGB, Display P3, Adobe RGB, Grayscale), granulare Metadaten-Kontrolle, Batch-Rename mit Variablen, Crop, Rotate, Flip, Bildanpassung (Helligkeit/Kontrast/Sättigung/Schärfe/Gamma/Schwarzweiß), Wasserzeichen (Text und Bild), Presets (vordefiniert + eigene in IndexedDB).
- Vorschau mit Vorher/Nachher-Slider, herunterskaliert auf Viewport-Größe, mit als Schätzung gekennzeichneter Größenprognose; optionaler Drei-Stufen-Vergleichsmodus.
- Batch-Verarbeitung mit Queue (Pause/Fortsetzen/Abbrechen/Retry/Einzelentfernung), Ordner-Upload, ZIP-Download via `client-zip`, direktes Schreiben in einen Zielordner über File System Access API wo verfügbar.
- Laufzeit-Capability-Matrix: UI zeigt nur Formate/Pfade, die der jeweilige Browser tatsächlich unterstützt.
- EXIF-Orientation-Korrektur vor jeder Transformation.
- ICC-Profil-Handling (erhalten/nach sRGB konvertieren/entfernen) über echte Farbraumtransformation.
- Alpha-zu-JPEG mit wählbarer Hintergrundfarbe.
- Animierte Quellen und Multipage-TIFF: Auswahl erster Frame / alle Frames einzeln / Animation erhalten (wo Zielformat es kann).
- Verständliche, handlungsleitende Fehlermeldungen (was, warum, was tun) statt generischer Fehlercodes; Diagnosebericht zum manuellen Kopieren, ohne Dateinamen/-inhalte/Vorschaubilder, nichts wird automatisch gesendet.
- PWA, installierbar, Tier-1-Formate vollständig offlinefähig.
- Mobile-first, WCAG-AA-Ziel, Deutsch und Englisch ab Phase 1/2.
- Kein Analytics, kein Tracking, keine Cookies, keine Drittanbieter-Requests zur Laufzeit — per Playwright-Test abgesichert.

## Was Version 1 ausdrücklich nicht kann

- **Kein Server-Fallback für irgendeine Funktion.** Kollidiert eine denkbare Funktion mit „kein Backend", entfällt sie ersatzlos statt über einen Server gelöst zu werden.
- **Kein Account, kein Login, keine Datenbank, kein Payment, keine Preisseite, kein Kontingentsystem.**
- **Keine Office-Formate** (DOCX, XLSX, PPTX, ODT, ODS, ODP) — kein Rendering-Pfad vorgesehen.
- **Kein OCR.**
- **Keine Hintergrundentfernung, keine KI-gestützten Bildfunktionen.**
- **Kein HEIC-Encoding** (`→ HEIC`) — nur Dekodierung, aus Patentgründen (HEVC), sichtbar im UI erklärt, nicht nur im Code.
- **Keine SEO-Landingpages**, kein Wachstums- oder Reichweitenziel.
- **Keine Nutzungsstatistiken, keine Telemetrie.**
- **RAW, PSD/PSB, PDF-Konvertierung sind nicht Teil von Version 1** — sie gehören zu Tier 2 / Phase 3 und erscheinen erst nach eigener Freigabe.
- **PSD/PSB-Layer-Rekonstruktion** ist nie vorgesehen (auch nicht in Tier 2) — nur der gespeicherte Composite.
- **CMYK-Farbraum** nur, falls eine Engine ihn sauber unterstützt; sonst dauerhaft weggelassen statt fehlerhaft angeboten.
- **Raster → SVG (Tier 3), EPS/AI/PostScript via Ghostscript (Tier 3)** sind nicht Teil von Version 1 und benötigen jeweils eine explizite Einzelfreigabe pro Feature. Die AGPL-Lizenzfrage für Ghostscript ist bereits geklärt (Repository wird bei Integration AGPL-kompatibel offengelegt, siehe `RISKS.md`) — das hebt Tier 3 nicht in Version 1, es bleibt Phase-3/4-Umfang.
- **Conversion History** ist nicht Teil von Version 1 (Phase 1–2), sondern erst ab Phase 2 vorgesehen — die Entscheidung, sie im vollen Kapitel-13-Umfang zu bauen, ist bereits getroffen (siehe `RISKS.md`), Umsetzung erfolgt aber zum vorgesehenen Zeitpunkt, nicht vorgezogen. Standardmäßig deaktiviert (Opt-in).
- **Kein Feature, kein Button für nicht implementierte Funktionen** — auch nicht ausgegraut oder als „demnächst" markiert. Was nicht funktioniert, erscheint nirgends in der UI.

## Kriterium für jede zukünftige Erweiterung

Jede neue Funktion wird vor Aufnahme gegen die Prioritätenliste aus Kapitel 2 geprüft: Korrektheit des Outputs vor Ehrlichkeit über Grenzen vor Speicherstabilität vor Bedienbarkeit vor Formatbreite. Eine Funktion, die diese Reihenfolge verletzt (z. B. Formatbreite auf Kosten von Speicherstabilität), wird nicht aufgenommen, ohne diese Reihenfolge explizit zu diskutieren.
