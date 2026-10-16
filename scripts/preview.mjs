import { createServer } from 'node:http';
import { readFile, stat, realpath } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const site = await realpath(path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../site'));
const base = '/pages-preview/';
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.gif': 'image/gif', '.ico': 'image/x-icon', '.woff': 'font/woff', '.woff2': 'font/woff2' };
const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url, 'http://127.0.0.1:4173');
    if (url.pathname === '/') { response.writeHead(302, { Location: base }); response.end(); return; }
    if (!url.pathname.startsWith(base)) { response.writeHead(404); response.end('Not found'); return; }
    let relative = decodeURIComponent(url.pathname.slice(base.length));
    if (!relative || relative.endsWith('/')) relative += 'index.html';
    const file = await realpath(path.resolve(site, relative));
    if (!file.startsWith(site + path.sep) || !(await stat(file)).isFile()) throw new Error('Not a public file');
    response.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    response.end(request.method === 'HEAD' ? undefined : await readFile(file));
  } catch {
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Not found');
  }
});
server.listen(4173, '127.0.0.1', () => console.log('Static preview: http://127.0.0.1:4173/pages-preview/'));
