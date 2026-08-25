import type { ConvertOptions } from '../../domain/types';
import { idbGetAll, idbPut, idbDelete, STORE_PRESETS } from './db';

export interface Preset {
  id: string;
  name: string;
  createdAt: number;
  settings: ConvertOptions;
}

export const BUILTIN_PRESETS: readonly Omit<Preset, 'id' | 'createdAt'>[] = [
  {
    name: 'Website',
    settings: {
      dst: 'webp',
      quality: 80,
      resize: { mode: 'max-width', value: 1920, keepAspectRatio: true, allowUpscale: false },
      colorSpace: 'srgb',
      iccPolicy: 'strip',
      metadata: { exif: false, iptc: false, xmp: false, gps: false, cameraInfo: false, dateTime: false, copyright: false, author: false, software: false },
      backgroundColor: '#ffffff',
      frameStrategy: 'first-frame',
      progressive: true,
    },
  },
  {
    name: 'Social',
    settings: {
      dst: 'jpeg',
      quality: 85,
      resize: { mode: 'max-width', value: 2048, keepAspectRatio: true, allowUpscale: false },
      colorSpace: 'srgb',
      iccPolicy: 'strip',
      metadata: { exif: false, iptc: false, xmp: false, gps: false, cameraInfo: false, dateTime: false, copyright: false, author: false, software: false },
      backgroundColor: '#ffffff',
      frameStrategy: 'first-frame',
      progressive: true,
      chromaSubsampling: '4:2:0',
    },
  },
  {
    name: 'E-Mail',
    settings: {
      dst: 'jpeg',
      quality: 70,
      resize: { mode: 'max-width', value: 1200, keepAspectRatio: true, allowUpscale: false },
      colorSpace: 'srgb',
      iccPolicy: 'strip',
      metadata: { exif: false, iptc: false, xmp: false, gps: false, cameraInfo: false, dateTime: false, copyright: false, author: false, software: false },
      backgroundColor: '#ffffff',
      frameStrategy: 'first-frame',
      progressive: true,
      chromaSubsampling: '4:2:0',
    },
  },
  {
    name: 'Print',
    settings: {
      dst: 'tiff',
      quality: 100,
      resize: { mode: 'none', keepAspectRatio: true, allowUpscale: false },
      colorSpace: 'srgb',
      iccPolicy: 'strip',
      // Hinweis: ICC-Farbraum-Transformation und granulare Metadaten-Filterung
      // sind in dieser Phase nicht implementiert (siehe RISKS.md) — Presets
      // behaupten deshalb nur, was die Pipeline tatsächlich tut.
      metadata: { exif: false, iptc: false, xmp: false, gps: false, cameraInfo: false, dateTime: false, copyright: false, author: false, software: false },
      backgroundColor: '#ffffff',
      frameStrategy: 'first-frame',
    },
  },
  {
    name: 'Archiv',
    settings: {
      dst: 'png',
      quality: 100,
      resize: { mode: 'none', keepAspectRatio: true, allowUpscale: false },
      colorSpace: 'srgb',
      iccPolicy: 'strip',
      metadata: { exif: false, iptc: false, xmp: false, gps: false, cameraInfo: false, dateTime: false, copyright: false, author: false, software: false },
      backgroundColor: '#ffffff',
      frameStrategy: 'first-frame',
    },
  },
];

export async function listUserPresets(): Promise<Preset[]> {
  return idbGetAll<Preset>(STORE_PRESETS);
}

export async function saveUserPreset(name: string, settings: ConvertOptions): Promise<Preset> {
  const preset: Preset = {
    id: crypto.randomUUID(),
    name,
    createdAt: Date.now(),
    settings,
  };
  await idbPut(STORE_PRESETS, preset);
  return preset;
}

export async function deleteUserPreset(id: string): Promise<void> {
  await idbDelete(STORE_PRESETS, id);
}
