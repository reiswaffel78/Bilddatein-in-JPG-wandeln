/**
 * Zentrale Domain-Typen. Kein Format-Paar wird irgendwo hartcodiert außerhalb
 * der Capability-Matrix verwendet (Kap. 5, Kap. 16).
 */

export type Format =
  | 'jpeg'
  | 'png'
  | 'webp'
  | 'avif'
  | 'tiff'
  | 'gif'
  | 'bmp'
  | 'jxl'
  | 'ico'
  | 'svg'
  | 'ppm';

export const TIER1_READ_WRITE: readonly Format[] = [
  'jpeg',
  'png',
  'webp',
  'avif',
  'tiff',
  'gif',
  'bmp',
  'jxl',
];

export const TIER1_READ_ONLY: readonly Format[] = ['ico', 'svg', 'ppm'];

export type ConversionType = 'native' | 'render' | 'rasterize' | 'embed' | 'trace';

export interface Capability {
  src: Format;
  dst: Format;
  type: ConversionType;
  engine: string;
  lossy: boolean;
  /** Zielformat kann Transparenz. */
  alpha: boolean;
  /** Mehrere Frames erhaltbar. */
  animated: boolean;
  /** EXIF/ICC durchreichbar. */
  metadata: boolean;
  tier: 1 | 2 | 3;
  memoryClass: 'low' | 'medium' | 'high';
}

export type ChromaSubsampling = '4:4:4' | '4:2:0';
export type ColorSpace = 'srgb' | 'display-p3' | 'adobe-rgb' | 'grayscale';
export type IccPolicy = 'keep' | 'convert-srgb' | 'strip';
export type FrameStrategy = 'first-frame' | 'all-frames' | 'keep-animation';

export interface ResizeOptions {
  mode: 'none' | 'width' | 'height' | 'percent' | 'max-width' | 'max-height' | 'long-edge' | 'short-edge';
  value?: number;
  keepAspectRatio: boolean;
  allowUpscale: boolean;
}

export interface MetadataFlags {
  exif: boolean;
  iptc: boolean;
  xmp: boolean;
  gps: boolean;
  cameraInfo: boolean;
  dateTime: boolean;
  copyright: boolean;
  author: boolean;
  software: boolean;
}

export const METADATA_FLAGS_STRIP_ALL: MetadataFlags = {
  exif: false,
  iptc: false,
  xmp: false,
  gps: false,
  cameraInfo: false,
  dateTime: false,
  copyright: false,
  author: false,
  software: false,
};

export const METADATA_FLAGS_KEEP_ALL: MetadataFlags = {
  exif: true,
  iptc: true,
  xmp: true,
  gps: true,
  cameraInfo: true,
  dateTime: true,
  copyright: true,
  author: true,
  software: true,
};

export interface ConvertOptions {
  dst: Format;
  quality: number; // 1–100
  chromaSubsampling?: ChromaSubsampling;
  progressive?: boolean;
  resize: ResizeOptions;
  colorSpace: ColorSpace;
  iccPolicy: IccPolicy;
  metadata: MetadataFlags;
  /** Hintergrundfarbe bei Alpha→JPEG (o.ä.), als #rrggbb. Pflichtfeld, kein stiller Default. */
  backgroundColor: string;
  frameStrategy: FrameStrategy;
  dpi?: number;
  rotate?: 0 | 90 | 180 | 270;
  flipHorizontal?: boolean;
  flipVertical?: boolean;
  crop?: { x: number; y: number; width: number; height: number };
  /** Nur für rasterize (SVG): Zielgröße ist Pflichtfeld, kein 1×1-Default. */
  rasterizeSize?: { width: number; height: number };
}

export interface DetectedMetadata {
  hasExif: boolean;
  hasIptc: boolean;
  hasXmp: boolean;
  hasGps: boolean;
  hasIccProfile: boolean;
  orientation: number;
  width: number;
  height: number;
  frameCount: number;
}

export interface Metadata extends DetectedMetadata {
  format: Format;
  sizeBytes: number;
}

export type ErrorCode =
  | 'UNSUPPORTED_PAIR'
  | 'PIXEL_LIMIT_EXCEEDED'
  | 'FRAME_LIMIT_EXCEEDED'
  | 'CORRUPT_INPUT'
  | 'MIME_MISMATCH'
  | 'PSD_NO_COMPOSITE'
  | 'OOM'
  | 'ABORTED'
  | 'TIMEOUT'
  | 'ENGINE_LOAD_FAILED'
  | 'RASTERIZE_SIZE_MISSING'
  | 'UNKNOWN';

export class ConversionError extends Error {
  readonly code: ErrorCode;
  readonly userMessage: string;
  readonly userAction: string;

  constructor(code: ErrorCode, userMessage: string, userAction: string, cause?: unknown) {
    super(`${code}: ${userMessage}`);
    this.name = 'ConversionError';
    this.code = code;
    this.userMessage = userMessage;
    this.userAction = userAction;
    if (cause !== undefined) {
      this.cause = cause;
    }
  }
}

export interface ConversionEngine {
  id: string;
  probe(): Promise<{ readers: Format[]; writers: Format[] }>;
  supports(src: Format, dst: Format): boolean;
  convert(input: Blob, opts: ConvertOptions, signal: AbortSignal): Promise<Blob>;
  metadata(input: Blob): Promise<Metadata>;
}

export interface JobResult {
  blob: Blob;
  outputSizeBytes: number;
  durationMs: number;
}
