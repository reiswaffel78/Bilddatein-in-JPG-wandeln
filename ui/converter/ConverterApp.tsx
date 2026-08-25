'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { downloadZip } from 'client-zip';
import type { ConvertOptions, Format } from '../../domain/types';
import { detectFormat } from '../../domain/detect';
import { defaultConvertOptions } from '../../domain/convert';
import { recommendTarget } from '../../domain/recommend';
import { availableTargetsFor } from '../../domain/matrix';
import { buildDiagnosticReport } from '../../domain/diagnostics';
import { WorkerPool } from '../../workers/pool';
import { useCapabilityMatrix } from '../hooks/useCapabilityMatrix';
import { useI18n } from '../../i18n/context';
import { Button } from '../components/Button';
import { Select } from '../components/Select';
import { Card } from '../components/Card';
import { Dropzone } from '../components/Dropzone';
import { AdvancedPanel, QualityControl } from '../advanced/AdvancedPanel';
import { storeResult, getResult } from '../resultStore';
import type { FileEntry } from './types';

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

let idCounter = 0;
function nextId(): string {
  idCounter += 1;
  return `file-${Date.now()}-${idCounter}`;
}

export function ConverterApp() {
  const { t, locale, setLocale } = useI18n();
  const { matrix, loading: matrixLoading } = useCapabilityMatrix();
  const poolRef = useRef<WorkerPool | null>(null);
  const [entries, setEntries] = useState<FileEntry[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [sharedTarget, setSharedTarget] = useState<Format>('jpeg');
  const [diagnosticsCopied, setDiagnosticsCopied] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState(false);

  if (!poolRef.current) {
    poolRef.current = new WorkerPool();
  }

  useEffect(() => {
    const pool = poolRef.current!;
    return pool.onOutcome((outcome) => {
      setEntries((prev) =>
        prev.map((entry) => {
          if (entry.id !== outcome.id) return entry;
          if (outcome.status === 'success' && outcome.result) {
            void storeResult(entry.id, outcome.result.blob);
            return {
              ...entry,
              status: 'success',
              resultInfo: {
                sizeBytes: outcome.result.blob.size,
                durationMs: outcome.result.durationMs,
                width: outcome.result.metadata.width,
                height: outcome.result.metadata.height,
                hasExif: outcome.result.metadata.hasExif,
              },
            };
          }
          return {
            ...entry,
            status: outcome.status,
            errorCode: outcome.errorCode,
            errorMessage: outcome.errorMessage,
            errorAction: outcome.errorAction,
          };
        }),
      );
    });
  }, []);

  const addFiles = useCallback(
    async (files: File[]) => {
      const newEntries: FileEntry[] = [];
      for (const file of files) {
        const format = await detectFormat(file);
        const opts = defaultConvertOptions(sharedTarget);
        if (format && matrix) {
          const recommendation = recommendTarget(format, matrix);
          opts.dst = recommendation.dst;
          opts.quality = recommendation.quality;
        }
        newEntries.push({
          id: nextId(),
          file,
          srcFormat: format,
          status: format ? 'ready' : 'unsupported',
          opts,
        });
      }
      setEntries((prev) => [...prev, ...newEntries]);
    },
    [matrix, sharedTarget],
  );

  const updateEntryOpts = (id: string, opts: ConvertOptions) => {
    setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, opts } : e)));
  };

  const convertEntry = (entry: FileEntry) => {
    if (!entry.srcFormat) return;
    setEntries((prev) => prev.map((e) => (e.id === entry.id ? { ...e, status: 'queued' } : e)));
    poolRef.current!.enqueue({ id: entry.id, input: entry.file, src: entry.srcFormat, opts: entry.opts });
  };

  const convertAll = () => {
    for (const entry of entries) {
      if (entry.status === 'ready' || entry.status === 'failed') convertEntry(entry);
    }
  };

  const removeEntry = (id: string) => {
    poolRef.current!.cancel(id);
    setEntries((prev) => prev.filter((e) => e.id !== id));
  };

  const retryEntry = (id: string) => {
    const entry = entries.find((e) => e.id === id);
    if (entry) convertEntry(entry);
  };

  const togglePause = () => {
    if (isPaused) {
      poolRef.current!.resume();
    } else {
      poolRef.current!.pause();
    }
    setIsPaused(!isPaused);
  };

  const downloadSingle = async (entry: FileEntry) => {
    const blob = await getResult(entry.id);
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = replaceExtension(entry.file.name, entry.opts.dst);
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadAllAsZip = async () => {
    const successEntries = entries.filter((e) => e.status === 'success');
    const files = await Promise.all(
      successEntries.map(async (entry) => ({
        name: replaceExtension(entry.file.name, entry.opts.dst),
        input: (await getResult(entry.id)) ?? new Blob([]),
      })),
    );
    const blob = await downloadZip(files).blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'konvertierte-dateien.zip';
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyDiagnostics = async (entry?: FileEntry) => {
    const report = buildDiagnosticReport({
      errorCode: entry?.errorCode,
      errorMessage: entry?.errorMessage,
      jobOptions: entry?.opts,
      matrix,
    });
    await navigator.clipboard.writeText(report);
    setDiagnosticsCopied(entry?.id ?? 'global');
    setTimeout(() => setDiagnosticsCopied(null), 2000);
  };

  const targetOptionsFor = (srcFormat: Format | null): Format[] => {
    if (!matrix || !srcFormat) return [];
    return availableTargetsFor(matrix, srcFormat);
  };

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-10">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{t.appName}</h1>
          <p className="text-sm text-muted-foreground">{t.tagline}</p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setLocale(locale === 'de' ? 'en' : 'de')} aria-label="Sprache wechseln">
          {t.languageSwitch}
        </Button>
      </header>

      <Dropzone
        onFiles={(files) => void addFiles(files)}
        multiple
        label={t.dropzone.label}
        hint={t.dropzone.hint}
        browseLabel={t.dropzone.browse}
      />

      {entries.length > 0 && (
        <Card className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-medium">{t.batch.title}</h2>
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" onClick={togglePause}>
                {isPaused ? t.batch.resume : t.batch.pause}
              </Button>
              <Button size="sm" onClick={convertAll} disabled={matrixLoading}>
                {t.convert}
              </Button>
              <Button size="sm" variant="secondary" onClick={() => void downloadAllAsZip()} disabled={!entries.some((e) => e.status === 'success')}>
                {t.downloadAll}
              </Button>
            </div>
          </div>

          <ul className="flex flex-col gap-3">
            {entries.map((entry) => (
              <li key={entry.id} className="rounded-md border border-border p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-medium">{entry.file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {t.detected}: {entry.srcFormat ?? '?'} · {formatBytes(entry.file.size)}
                    </p>
                  </div>

                  {entry.srcFormat && (
                    <Select
                      aria-label={t.targetFormat}
                      value={entry.opts.dst}
                      onChange={(e) => updateEntryOpts(entry.id, { ...entry.opts, dst: e.target.value as Format })}
                    >
                      {targetOptionsFor(entry.srcFormat).map((format) => (
                        <option key={format} value={format}>
                          {format.toUpperCase()}
                        </option>
                      ))}
                    </Select>
                  )}

                  <span className="text-sm">{t.batch.status[statusKey(entry.status)]}</span>

                  <div className="flex gap-2">
                    {(entry.status === 'ready' || entry.status === 'failed') && (
                      <Button size="sm" onClick={() => convertEntry(entry)}>
                        {entry.status === 'failed' ? t.batch.retry : t.convert}
                      </Button>
                    )}
                    {entry.status === 'success' && (
                      <Button size="sm" variant="secondary" onClick={() => void downloadSingle(entry)}>
                        {t.download}
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => removeEntry(entry.id)}>
                      {t.batch.remove}
                    </Button>
                  </div>
                </div>

                {entry.status === 'unsupported' && (
                  <p className="mt-2 text-sm text-destructive">
                    Dieses Dateiformat konnte nicht erkannt werden. Prüfe, ob die Datei intakt ist und tatsächlich ein unterstütztes Bildformat hat.
                  </p>
                )}

                {entry.status === 'failed' && (
                  <div className="mt-2 text-sm">
                    <p className="text-destructive">{entry.errorMessage}</p>
                    {entry.errorAction && <p className="text-muted-foreground">{entry.errorAction}</p>}
                    <Button size="sm" variant="ghost" onClick={() => void copyDiagnostics(entry)}>
                      {diagnosticsCopied === entry.id ? t.diagnostics.copied : t.diagnostics.copy}
                    </Button>
                  </div>
                )}

                {entry.status === 'success' && entry.resultInfo && (
                  <p className="mt-2 text-sm text-muted-foreground">
                    {formatBytes(entry.file.size)} → {formatBytes(entry.resultInfo.sizeBytes)} (
                    {(((entry.resultInfo.sizeBytes - entry.file.size) / entry.file.size) * 100).toFixed(0)}%), {entry.resultInfo.width}×{entry.resultInfo.height}
                  </p>
                )}

                {entry.srcFormat && entry.status === 'ready' && (
                  <div className="mt-3 flex flex-col gap-3">
                    <QualityControl opts={entry.opts} onChange={(opts) => updateEntryOpts(entry.id, opts)} />
                    <Button size="sm" variant="ghost" onClick={() => setShowAdvanced((v) => !v)}>
                      {t.advanced}
                    </Button>
                    {showAdvanced && (
                      <AdvancedPanel
                        opts={entry.opts}
                        onChange={(opts) => updateEntryOpts(entry.id, opts)}
                        detectedHasExif={false}
                        canKeepExif={entry.srcFormat === 'jpeg' && entry.opts.dst === 'jpeg'}
                      />
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </Card>
      )}

      <footer className="text-xs text-muted-foreground text-center">{t.privacyNote}</footer>
    </div>
  );
}

function statusKey(status: FileEntry['status']): 'queued' | 'running' | 'success' | 'failed' | 'cancelled' {
  if (status === 'ready' || status === 'unsupported') return 'queued';
  if (status === 'queued' || status === 'running') return 'running';
  if (status === 'success') return 'success';
  if (status === 'cancelled') return 'cancelled';
  return 'failed';
}

function replaceExtension(filename: string, dst: Format): string {
  const base = filename.includes('.') ? filename.substring(0, filename.lastIndexOf('.')) : filename;
  const ext = dst === 'jpeg' ? 'jpg' : dst;
  return `${base}.${ext}`;
}
