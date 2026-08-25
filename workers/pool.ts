import * as Comlink from 'comlink';
import type { ConvertOptions, Format } from '../domain/types';
import type { ConvertResult } from '../domain/convert';
import type { ConvertWorkerApi } from './convert.worker';
import { LIMITS } from '../domain/config/limits';

export interface QueueJob {
  id: string;
  input: Blob;
  src: Format;
  opts: ConvertOptions;
}

export type JobStatus = 'success' | 'failed' | 'cancelled';

export interface JobOutcome {
  id: string;
  status: JobStatus;
  result?: ConvertResult;
  errorMessage?: string;
  errorAction?: string;
  errorCode?: string;
}

type OutcomeListener = (outcome: JobOutcome) => void;

function isOomError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /out of memory|oom|allocation failed|memory access out of bounds/i.test(message);
}

function classifyError(error: unknown): { code: string; message: string } {
  if (error && typeof error === 'object' && 'code' in error) {
    const err = error as { code: string; message: string };
    return { code: err.code, message: err.message };
  }
  if (isOomError(error)) {
    return { code: 'OOM', message: 'Dem Worker ist der Speicher ausgegangen.' };
  }
  return { code: 'UNKNOWN', message: error instanceof Error ? error.message : 'Unbekannter Fehler' };
}

/**
 * Worker-Pool: Poolgröße `min(hardwareConcurrency-1, 4)`, per UI überschreibbar
 * (Kap. 8). Jeder Job läuft in einem frisch erzeugten Worker, der danach
 * terminiert wird — kein Wiederverwenden derselben WASM-Instanz über mehrere
 * Dateien hinweg, da Emscripten-Heaps Speicher nicht zuverlässig freigeben.
 * Ein OOM lässt nur den betroffenen Job scheitern, die Queue läuft weiter.
 */
export class WorkerPool {
  private queue: QueueJob[] = [];
  private readonly activeWorkers = new Map<string, { worker: Worker }>();
  private paused = false;
  private runningCount = 0;
  private readonly listeners = new Set<OutcomeListener>();
  poolSize: number;

  constructor(poolSize?: number) {
    const hw = typeof navigator !== 'undefined' && navigator.hardwareConcurrency ? navigator.hardwareConcurrency : 4;
    this.poolSize = poolSize ?? Math.max(1, Math.min(hw - 1, LIMITS.maxWorkerPoolSize));
  }

  setPoolSize(size: number): void {
    this.poolSize = Math.max(1, size);
    this.pump();
  }

  onOutcome(fn: OutcomeListener): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  enqueue(job: QueueJob): void {
    this.queue.push(job);
    this.pump();
  }

  pause(): void {
    this.paused = true;
  }

  resume(): void {
    this.paused = false;
    this.pump();
  }

  cancel(id: string): void {
    this.queue = this.queue.filter((j) => j.id !== id);
    const active = this.activeWorkers.get(id);
    if (active) {
      active.worker.postMessage('__abort__');
    }
  }

  get pendingCount(): number {
    return this.queue.length;
  }

  private pump(): void {
    if (this.paused) return;
    while (this.runningCount < this.poolSize && this.queue.length > 0) {
      const job = this.queue.shift();
      if (!job) break;
      void this.runJob(job);
    }
  }

  private async runJob(job: QueueJob): Promise<void> {
    this.runningCount++;
    // Bewusst KEIN { type: 'module' }: Next.js/webpack generiert für Worker-
    // Chunks ein klassisches, `importScripts()`-basiertes Chunk-Loading-Runtime
    // (kompiliert ESM bereits zu diesem Format) — ein Module-Worker würde
    // `importScripts()` innerhalb seines Moduls ablehnen und sofort mit einem
    // leeren, nicht diagnostizierbaren `error`-Event abstürzen.
    const worker = new Worker(new URL('./convert.worker.ts', import.meta.url));
    this.activeWorkers.set(job.id, { worker });

    try {
      const proxy = Comlink.wrap<ConvertWorkerApi>(worker);
      const outcome = await proxy.convert(job.input, job.src, job.opts);
      if (outcome.ok) {
        this.emit({ id: job.id, status: 'success', result: outcome.result });
      } else {
        const status: JobStatus = outcome.code === 'ABORTED' ? 'cancelled' : 'failed';
        this.emit({ id: job.id, status, errorMessage: outcome.userMessage, errorAction: outcome.userAction, errorCode: outcome.code });
      }
    } catch (error) {
      // Der Worker selbst ist abgestürzt (z. B. vom Browser wegen OOM beendet) —
      // das ist die einzige Stelle, an der wir noch einen rohen Comlink-Fehler sehen.
      const classified = classifyError(error);
      this.emit({ id: job.id, status: 'failed', errorMessage: classified.message, errorCode: classified.code });
    } finally {
      this.activeWorkers.delete(job.id);
      worker.terminate();
      this.runningCount--;
      this.pump();
    }
  }

  private emit(outcome: JobOutcome): void {
    for (const listener of this.listeners) listener(outcome);
  }
}
