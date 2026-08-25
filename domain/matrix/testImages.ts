/**
 * Eingebettete 1×1-Testbilder für die Laufzeit-Probe nativer Browser-Codecs
 * (Kap. 5). Keine Netzwerk-Requests — die Bytes sind Teil des Bundles.
 */

interface TestImage {
  base64: string;
  mimeType: string;
}

export const TEST_IMAGES: {
  jpeg: TestImage;
  png: TestImage;
  webp: TestImage;
  gif: TestImage;
  bmp: TestImage;
} = {
  jpeg: {
    mimeType: 'image/jpeg',
    base64:
      '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAMCAgICAgMCAgIDAwMDBAYEBAQEBAgGBgUGCQgKCgkICQkKDA8MCgsOCwkJDRENDg8QEBEQCgwSExIQEw8QEBD/2wBDAQMDAwQDBAgEBAgQCwkLEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBD/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAj/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=',
  },
  png: {
    mimeType: 'image/png',
    base64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
  },
  webp: {
    mimeType: 'image/webp',
    base64: 'UklGRhoAAABXRUJQVlA4TA0AAAAvAAAAEAcQERGIiP4HAA==',
  },
  gif: {
    mimeType: 'image/gif',
    base64: 'R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==',
  },
  bmp: {
    mimeType: 'image/bmp',
    base64: 'Qk08AAAAAAAAADYAAAAoAAAAAQAAAAEAAAABABgAAAAAAAYAAAATCwAAEwsAAAAAAAAAAAAA////AA==',
  },
};

/** Erzeugt eine minimale 1×1-ImageData für Encode-Proben. */
export function tinyImageData(): ImageData {
  return new ImageData(new Uint8ClampedArray([255, 0, 0, 255]), 1, 1);
}
