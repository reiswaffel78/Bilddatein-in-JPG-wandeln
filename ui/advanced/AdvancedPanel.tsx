'use client';

import type { ConvertOptions, ResizeOptions } from '../../domain/types';
import { useI18n } from '../../i18n/context';
import { Select } from '../components/Select';
import { Slider } from '../components/Slider';

interface AdvancedPanelProps {
  opts: ConvertOptions;
  onChange: (next: ConvertOptions) => void;
  detectedHasExif: boolean;
  canKeepExif: boolean;
}

const RESIZE_MODES: ResizeOptions['mode'][] = ['none', 'width', 'height', 'percent', 'max-width', 'max-height', 'long-edge', 'short-edge'];

export function AdvancedPanel({ opts, onChange, detectedHasExif, canKeepExif }: AdvancedPanelProps) {
  const { t } = useI18n();

  const setResize = (patch: Partial<ResizeOptions>) => onChange({ ...opts, resize: { ...opts.resize, ...patch } });

  return (
    <div className="flex flex-col gap-6">
      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-medium mb-1">{t.resize}</legend>
        <div className="flex flex-wrap gap-2">
          <Select
            aria-label={t.resize}
            value={opts.resize.mode}
            onChange={(e) => setResize({ mode: e.target.value as ResizeOptions['mode'] })}
          >
            {RESIZE_MODES.map((mode) => (
              <option key={mode} value={mode}>
                {t.resizeMode[mode]}
              </option>
            ))}
          </Select>
          {opts.resize.mode !== 'none' && (
            <input
              type="number"
              min={1}
              aria-label={`${t.resize} ${t.resizeMode[opts.resize.mode]}`}
              value={opts.resize.value ?? ''}
              onChange={(e) => setResize({ value: Number(e.target.value) })}
              className="h-10 w-28 rounded-md border border-border bg-background px-3 text-sm"
            />
          )}
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={opts.resize.keepAspectRatio}
            onChange={(e) => setResize({ keepAspectRatio: e.target.checked })}
          />
          {t.keepAspectRatio}
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={opts.resize.allowUpscale} onChange={(e) => setResize({ allowUpscale: e.target.checked })} />
          {t.allowUpscale}
        </label>
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-medium mb-1">{t.rotate}</legend>
        <div className="flex gap-2">
          {([0, 90, 180, 270] as const).map((deg) => (
            <button
              key={deg}
              type="button"
              aria-pressed={opts.rotate === deg}
              onClick={() => onChange({ ...opts, rotate: deg })}
              className={`h-9 rounded-md border border-border px-3 text-sm ${opts.rotate === deg ? 'bg-primary text-primary-foreground' : 'bg-background'}`}
            >
              {deg}°
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={!!opts.flipHorizontal} onChange={(e) => onChange({ ...opts, flipHorizontal: e.target.checked })} />
          {t.flipHorizontal}
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={!!opts.flipVertical} onChange={(e) => onChange({ ...opts, flipVertical: e.target.checked })} />
          {t.flipVertical}
        </label>
      </fieldset>

      {opts.dst === 'jpeg' && (
        <fieldset className="flex flex-col gap-2">
          <legend className="text-sm font-medium mb-1">{t.backgroundColor}</legend>
          <input
            type="color"
            aria-label={t.backgroundColor}
            value={opts.backgroundColor}
            onChange={(e) => onChange({ ...opts, backgroundColor: e.target.value })}
            className="h-10 w-16 rounded-md border border-border bg-background"
          />
        </fieldset>
      )}

      {opts.dst === 'jpeg' && (
        <fieldset className="flex flex-col gap-2">
          <legend className="text-sm font-medium mb-1">Chroma-Subsampling</legend>
          <Select
            aria-label="Chroma-Subsampling"
            value={opts.chromaSubsampling}
            onChange={(e) => onChange({ ...opts, chromaSubsampling: e.target.value as '4:4:4' | '4:2:0' })}
          >
            <option value="4:2:0">4:2:0</option>
            <option value="4:4:4">4:4:4 (verlustärmer)</option>
          </Select>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={!!opts.progressive} onChange={(e) => onChange({ ...opts, progressive: e.target.checked })} />
            Progressive JPEG
          </label>
        </fieldset>
      )}

      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-medium mb-1">{t.metadataDetected}</legend>
        <p className="text-sm text-muted-foreground">
          {detectedHasExif ? 'EXIF-Daten erkannt.' : 'Keine EXIF-Daten erkannt.'}
        </p>
        {canKeepExif && (
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={opts.metadata.exif} onChange={(e) => onChange({ ...opts, metadata: { ...opts.metadata, exif: e.target.checked } })} />
            {t.metadataKeepJpeg}
          </label>
        )}
        <p className="text-xs text-muted-foreground">{t.metadataNote}</p>
      </fieldset>
    </div>
  );
}

export function QualityControl({ opts, onChange }: { opts: ConvertOptions; onChange: (next: ConvertOptions) => void }) {
  const { t } = useI18n();
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor="quality-slider" className="text-sm font-medium">
        {t.quality}: {opts.quality}
      </label>
      <Slider id="quality-slider" min={1} max={100} value={opts.quality} onChange={(e) => onChange({ ...opts, quality: Number(e.target.value) })} />
    </div>
  );
}
