// Self-hosts Tesseract in public/tesseract/ (no CDN). Idempotent; runs on postinstall.
import { copyFileSync, existsSync, mkdirSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const nm = join(root, 'node_modules');
const out = join(root, 'public', 'tesseract');

// tesseract.js picks one of these core builds per device; the wasm is embedded in the .js.
const core = ['tesseract-core-relaxedsimd-lstm.wasm.js', 'tesseract-core-simd-lstm.wasm.js', 'tesseract-core-lstm.wasm.js'];

const files = [
  [join(nm, 'tesseract.js', 'dist', 'worker.min.js'), 'worker.min.js'],
  ...core.map((f) => [join(nm, 'tesseract.js-core', f), f]),
  // 4.0.0_best_int is the data set tesseract.js itself uses for the LSTM-only engine.
  [join(nm, '@tesseract.js-data', 'eng', '4.0.0_best_int', 'eng.traineddata.gz'), 'eng.traineddata.gz'],
];

const missing = files.filter(([src]) => !existsSync(src)).map(([src]) => src);
if (missing.length > 0) {
  // During `npm install` of a partial tree (e.g. --omit=optional/dependencies), do not break the install.
  if (process.env.npm_lifecycle_event === 'postinstall') {
    console.warn(`copy-tesseract: skipped, source files not installed:\n  ${missing.join('\n  ')}\n  Run "npm run tesseract:copy" after a full install.`);
    process.exit(0);
  }
  console.error(`copy-tesseract: missing source files:\n  ${missing.join('\n  ')}`);
  process.exit(1);
}

mkdirSync(out, { recursive: true });
for (const [src, name] of files) {
  copyFileSync(src, join(out, name));
  console.log(`copy-tesseract: ${name} (${(statSync(src).size / 1024).toFixed(0)} KiB)`);
}
