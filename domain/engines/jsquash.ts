import type { ChromaSubsampling, Format } from '../types';

/**
 * Encoder/Decoder für JPEG, PNG, WebP, AVIF, JPEG XL über @jsquash/*.
 * Jedes Codec-Modul wird lazy per dynamischem Import geladen (Kap. 4: kein
 * WASM im Initial-Load außer dem für die Startseite Nötigen) und ist damit
 * der alleinige Schreib-Pfad für diese fünf Formate — kein zweiter Encoder
 * für denselben Pfad (Kap. 16).
 */

export type JsquashFormat = Extract<Format, 'jpeg' | 'png' | 'webp' | 'avif' | 'jxl'>;

export const JSQUASH_FORMATS: readonly JsquashFormat[] = ['jpeg', 'png', 'webp', 'avif', 'jxl'];

export interface JsquashEncodeOptions {
  quality: number;
  progressive?: boolean;
  chromaSubsampling?: ChromaSubsampling;
}

async function loadJpeg() {
  return import('@jsquash/jpeg');
}
async function loadPng() {
  return import('@jsquash/png');
}
async function loadWebp() {
  return import('@jsquash/webp');
}
async function loadAvif() {
  return import('@jsquash/avif');
}
async function loadJxl() {
  return import('@jsquash/jxl');
}

export async function jsquashDecode(format: JsquashFormat, data: ArrayBuffer): Promise<ImageData> {
  switch (format) {
    case 'jpeg': {
      const { decode } = await loadJpeg();
      return decode(data);
    }
    case 'png': {
      const { decode } = await loadPng();
      return decode(data);
    }
    case 'webp': {
      const { decode } = await loadWebp();
      return decode(data);
    }
    case 'avif': {
      const { decode } = await loadAvif();
      const result = await decode(data);
      if (!result) throw new Error('AVIF-Decodierung ergab kein Bild.');
      return result;
    }
    case 'jxl': {
      const { decode } = await loadJxl();
      return decode(data);
    }
  }
}

export async function jsquashEncode(format: JsquashFormat, imageData: ImageData, opts: JsquashEncodeOptions): Promise<ArrayBuffer> {
  switch (format) {
    case 'jpeg': {
      const { encode } = await loadJpeg();
      return encode(imageData, {
        quality: opts.quality,
        progressive: opts.progressive ?? true,
        // 0 = 4:4:4 (kein Subsampling), 2 = 4:2:0 in mozjpeg-Nomenklatur (chroma h/v-Sample-Faktoren)
        chroma_subsampling: opts.chromaSubsampling === '4:4:4' ? false : true,
      } as never);
    }
    case 'png': {
      const { encode } = await loadPng();
      return encode(imageData);
    }
    case 'webp': {
      const { encode } = await loadWebp();
      return encode(imageData, { quality: opts.quality });
    }
    case 'avif': {
      const { encode } = await loadAvif();
      return encode(imageData, { quality: opts.quality });
    }
    case 'jxl': {
      const { encode } = await loadJxl();
      return encode(imageData, { quality: opts.quality });
    }
  }
}
