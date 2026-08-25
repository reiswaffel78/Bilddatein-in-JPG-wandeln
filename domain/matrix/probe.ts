import { probeNativeDecode } from '../engines/nativeCanvas';
import { TEST_IMAGES } from './testImages';

export interface NativeDecodeSupport {
  jpeg: boolean;
  png: boolean;
  webp: boolean;
  gif: boolean;
  bmp: boolean;
}

/**
 * Prüft native Decode-Unterstützung des Browsers gegen eingebettete
 * 1×1-Testbilder (Kap. 5). Wird primär für GIF/BMP gebraucht, da diese beiden
 * Formate keinen WASM-Fallback haben — jpeg/png/webp haben einen (jsquash)
 * und bleiben unabhängig vom Ergebnis hier als Quellformat verfügbar.
 */
export async function probeNativeDecodeSupport(): Promise<NativeDecodeSupport> {
  const [jpeg, png, webp, gif, bmp] = await Promise.all([
    probeNativeDecode(TEST_IMAGES.jpeg.base64, TEST_IMAGES.jpeg.mimeType),
    probeNativeDecode(TEST_IMAGES.png.base64, TEST_IMAGES.png.mimeType),
    probeNativeDecode(TEST_IMAGES.webp.base64, TEST_IMAGES.webp.mimeType),
    probeNativeDecode(TEST_IMAGES.gif.base64, TEST_IMAGES.gif.mimeType),
    probeNativeDecode(TEST_IMAGES.bmp.base64, TEST_IMAGES.bmp.mimeType),
  ]);
  return { jpeg, png, webp, gif, bmp };
}
