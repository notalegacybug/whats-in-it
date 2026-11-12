import { createWorker } from 'tesseract.js';
import { downscaleImage } from './downscale';

const MAX_SIDE_PX = 2000;
// Served from public/tesseract/ (copied by scripts/copy-tesseract.mjs). Same origin only: no CDN,
// so label photos never leave the device and the app works offline.
const BASE = '/tesseract';

/** Reads text from an image entirely in the browser. Rejects with an Error; the caller shows the message. */
export async function readImage(file: Blob, onProgress?: (fraction: number) => void): Promise<string> {
  const image = await downscaleImage(file, MAX_SIDE_PX);
  const worker = await createWorker('eng', 1, {
    workerPath: `${BASE}/worker.min.js`,
    corePath: `${BASE}/`, // a directory: tesseract.js picks the right wasm build for this device
    langPath: `${BASE}/`, // trailing slash is stripped by tesseract.js; expects eng.traineddata.gz (gzip is the tesseract.js default)
    workerBlobURL: false,
    logger: (m: { status: string; progress: number }) => {
      if (m.status === 'recognizing text') onProgress?.(m.progress);
    },
  });
  try {
    const { data } = await worker.recognize(image);
    return data.text;
  } catch (e) {
    throw e instanceof Error ? e : new Error(String(e));
  } finally {
    await worker.terminate();
  }
}
