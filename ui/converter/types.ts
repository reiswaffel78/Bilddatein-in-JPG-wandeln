import type { ConvertOptions, Format } from '../../domain/types';

export type FileStatus = 'detecting' | 'ready' | 'unsupported' | 'queued' | 'running' | 'success' | 'failed' | 'cancelled';

export interface ResultInfo {
  sizeBytes: number;
  durationMs: number;
  width: number;
  height: number;
  hasExif: boolean;
}

export interface FileEntry {
  id: string;
  file: File;
  srcFormat: Format | null;
  status: FileStatus;
  opts: ConvertOptions;
  resultInfo?: ResultInfo;
  errorCode?: string;
  errorMessage?: string;
  errorAction?: string;
}
