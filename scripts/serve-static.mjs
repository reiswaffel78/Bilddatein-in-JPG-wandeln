// Minimaler statischer Server für den Static Export ("out/"), der dieselben
// Header wie public/_headers setzt (Netlify interpretiert _headers selbst,
// ein generischer statischer Server tut das nicht — für lokale Tests/CI
// bilden wir das hier nach, damit COOP/COEP auch außerhalb von Netlify gilt).
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join } from 'node:path';

const ROOT = join(process.cwd(), 'out');
const PORT = Number(process.env.PORT ?? 4173);

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.wasm': 'application/wasm',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.txt': 'text/plain; charset=utf-8',
};

const SECURITY_HEADERS = {
  'Content-Security-Policy':
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'; img-src 'self' blob: data:; connect-src 'self'; frame-src 'self' blob:; worker-src 'self' blob:; object-src 'none'; base-uri 'none'",
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Embedder-Policy': 'require-corp',
  'Cache-Control': 'no-store',
};

const server = createServer(async (req, res) => {
  try {
    const path = decodeURIComponent(new URL(req.url ?? '/', 'http://localhost').pathname);
    const isAsset = path.startsWith('/_next/');

    if (isAsset) {
      const filePath = join(ROOT, path);
      try {
        const data = await readFile(filePath);
        const ext = extname(filePath);
        res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] ?? 'application/octet-stream', ...SECURITY_HEADERS });
        res.end(data);
      } catch {
        console.error('404 (asset):', path);
        res.writeHead(404, SECURITY_HEADERS);
        res.end('Not found');
      }
      return;
    }

    let pagePath = path.endsWith('/') ? `${path}index.html` : path;
    let filePath = join(ROOT, pagePath);
    let fileStat;
    try {
      fileStat = await stat(filePath);
    } catch {
      filePath = join(ROOT, `${pagePath}.html`);
      try {
        fileStat = await stat(filePath);
      } catch {
        filePath = join(ROOT, '404.html');
        fileStat = await stat(filePath);
      }
    }
    if (fileStat.isDirectory()) {
      filePath = join(filePath, 'index.html');
    }

    const data = await readFile(filePath);
    const ext = extname(filePath);
    res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] ?? 'application/octet-stream', ...SECURITY_HEADERS });
    res.end(data);
  } catch (error) {
    res.writeHead(500);
    res.end(String(error));
  }
});

server.listen(PORT, () => {
  console.log(`Static export served at http://localhost:${PORT}`);
});
