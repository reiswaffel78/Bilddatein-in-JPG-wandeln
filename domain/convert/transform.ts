import type { ResizeOptions } from '../types';

export interface TargetSize {
  width: number;
  height: number;
}

export function computeTargetSize(source: TargetSize, resize: ResizeOptions): TargetSize {
  const { mode, value, keepAspectRatio, allowUpscale } = resize;
  if (mode === 'none' || !value || value <= 0) return source;

  const ratio = source.width / source.height;
  let width = source.width;
  let height = source.height;

  switch (mode) {
    case 'width':
      width = value;
      height = keepAspectRatio ? Math.round(value / ratio) : source.height;
      break;
    case 'height':
      height = value;
      width = keepAspectRatio ? Math.round(value * ratio) : source.width;
      break;
    case 'percent':
      width = Math.round((source.width * value) / 100);
      height = Math.round((source.height * value) / 100);
      break;
    case 'max-width':
      if (source.width > value) {
        width = value;
        height = Math.round(value / ratio);
      }
      break;
    case 'max-height':
      if (source.height > value) {
        height = value;
        width = Math.round(value * ratio);
      }
      break;
    case 'long-edge': {
      const isWidthLonger = source.width >= source.height;
      if (isWidthLonger) {
        width = value;
        height = Math.round(value / ratio);
      } else {
        height = value;
        width = Math.round(value * ratio);
      }
      break;
    }
    case 'short-edge': {
      const isWidthShorter = source.width <= source.height;
      if (isWidthShorter) {
        width = value;
        height = Math.round(value / ratio);
      } else {
        height = value;
        width = Math.round(value * ratio);
      }
      break;
    }
  }

  if (!allowUpscale) {
    if (width > source.width || height > source.height) {
      return source;
    }
  }

  return { width: Math.max(1, width), height: Math.max(1, height) };
}

export interface GeometryOptions {
  rotate?: 0 | 90 | 180 | 270;
  flipHorizontal?: boolean;
  flipVertical?: boolean;
  crop?: { x: number; y: number; width: number; height: number };
  resize: ResizeOptions;
}

export async function applyGeometry(imageData: ImageData, opts: GeometryOptions): Promise<ImageData> {
  let bitmap: ImageBitmap = await createImageBitmap(imageData);
  let width = imageData.width;
  let height = imageData.height;

  if (opts.crop && opts.crop.width > 0 && opts.crop.height > 0) {
    const cropped = new OffscreenCanvas(opts.crop.width, opts.crop.height);
    const ctx = cropped.getContext('2d')!;
    ctx.drawImage(bitmap, opts.crop.x, opts.crop.y, opts.crop.width, opts.crop.height, 0, 0, opts.crop.width, opts.crop.height);
    bitmap.close();
    bitmap = await createImageBitmap(cropped);
    width = opts.crop.width;
    height = opts.crop.height;
  }

  const rotate = opts.rotate ?? 0;
  if (rotate !== 0 || opts.flipHorizontal || opts.flipVertical) {
    const swapDimensions = rotate === 90 || rotate === 270;
    const outWidth = swapDimensions ? height : width;
    const outHeight = swapDimensions ? width : height;
    const canvas = new OffscreenCanvas(outWidth, outHeight);
    const ctx = canvas.getContext('2d')!;
    ctx.translate(outWidth / 2, outHeight / 2);
    ctx.rotate((rotate * Math.PI) / 180);
    ctx.scale(opts.flipHorizontal ? -1 : 1, opts.flipVertical ? -1 : 1);
    ctx.drawImage(bitmap, -width / 2, -height / 2, width, height);
    bitmap.close();
    bitmap = await createImageBitmap(canvas);
    width = outWidth;
    height = outHeight;
  }

  const target = computeTargetSize({ width, height }, opts.resize);
  if (target.width !== width || target.height !== height) {
    const canvas = new OffscreenCanvas(target.width, target.height);
    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(bitmap, 0, 0, target.width, target.height);
    bitmap.close();
    return ctx.getImageData(0, 0, target.width, target.height);
  }

  const finalCanvas = new OffscreenCanvas(width, height);
  const finalCtx = finalCanvas.getContext('2d')!;
  finalCtx.drawImage(bitmap, 0, 0);
  bitmap.close();
  return finalCtx.getImageData(0, 0, width, height);
}
