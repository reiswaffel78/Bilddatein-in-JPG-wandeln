export interface Dictionary {
  appName: string;
  tagline: string;
  dropzone: {
    label: string;
    hint: string;
    browse: string;
  };
  detected: string;
  recommended: string;
  targetFormat: string;
  quality: string;
  convert: string;
  download: string;
  downloadAll: string;
  advanced: string;
  resize: string;
  resizeMode: {
    none: string;
    width: string;
    height: string;
    percent: string;
    'max-width': string;
    'max-height': string;
    'long-edge': string;
    'short-edge': string;
  };
  keepAspectRatio: string;
  allowUpscale: string;
  rotate: string;
  flipHorizontal: string;
  flipVertical: string;
  backgroundColor: string;
  metadataDetected: string;
  metadataKeepJpeg: string;
  metadataNote: string;
  batch: {
    title: string;
    add: string;
    addFolder: string;
    pause: string;
    resume: string;
    cancel: string;
    retry: string;
    remove: string;
    status: {
      queued: string;
      running: string;
      success: string;
      failed: string;
      cancelled: string;
    };
  };
  diagnostics: {
    copy: string;
    copied: string;
  };
  privacyNote: string;
  languageSwitch: string;
}
