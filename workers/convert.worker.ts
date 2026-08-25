import * as Comlink from 'comlink';
import type { ConvertOptions, Format } from '../domain/types';
import { ConversionError } from '../domain/types';
import { convertFile, type ConvertResult } from '../domain/convert';

/**
 * Worker-seitige API. Jeder Job läuft in einem eigenen Aufruf; der Worker
 * wird vom Pool nach jedem Job recycelt (terminiert + neu erzeugt), da
 * Emscripten-Heaps (jsquash-WASM-Module) Speicher nicht zuverlässig
 * freigeben (Kap. 8).
 *
 * `convert` wirft bewusst nichts über die Comlink-Grenze — Comlinks eingebaute
 * Fehlerweiterleitung reduziert geworfene Fehler auf message/name/stack und
 * verliert dabei unsere ErrorCode/userMessage/userAction-Felder (Kap. 11).
 * Stattdessen liefert die Funktion ein diskriminiertes Ergebnisobjekt zurück.
 */
export type WorkerConvertResult =
  | { ok: true; result: ConvertResult }
  | { ok: false; code: string; userMessage: string; userAction: string };

export interface ConvertWorkerApi {
  convert(input: Blob, src: Format, opts: ConvertOptions): Promise<WorkerConvertResult>;
}

let currentController: AbortController | null = null;

const api: ConvertWorkerApi = {
  async convert(input, src, opts) {
    currentController = new AbortController();
    try {
      const result = await convertFile(input, src, opts, currentController.signal);
      return { ok: true, result };
    } catch (error) {
      if (error instanceof ConversionError) {
        return { ok: false, code: error.code, userMessage: error.userMessage, userAction: error.userAction };
      }
      const message = error instanceof Error ? error.message : String(error);
      const isOom = /out of memory|oom|allocation failed|memory access out of bounds/i.test(message);
      return {
        ok: false,
        code: isOom ? 'OOM' : 'UNKNOWN',
        userMessage: isOom ? 'Dem Browser ist während der Konvertierung der Speicher ausgegangen.' : 'Bei der Konvertierung ist ein unerwarteter Fehler aufgetreten.',
        userAction: isOom
          ? 'Versuche eine kleinere Zieldateigröße (z. B. Resize aktivieren) oder konvertiere diese Datei einzeln statt im Batch.'
          : 'Kopiere den Diagnosebericht und versuche es erneut.',
      };
    }
  },
};

self.addEventListener('message', (event: MessageEvent) => {
  if (event.data === '__abort__') {
    currentController?.abort();
  }
});

Comlink.expose(api);
