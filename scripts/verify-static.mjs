import { readFile, readdir, lstat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const site = path.join(root, 'site');
const manifest = JSON.parse(await readFile(path.join(root, 'site-manifest.json'), 'utf8'));
const expected = new Set([...manifest.pages.map(page => page.file), ...manifest.assets, '.nojekyll']);
const contents = new Map();
const problems = [];
let checkedLinks = 0;

async function walk(directory) {
  for (const name of await readdir(directory)) {
    const file = path.join(directory, name);
    const info = await lstat(file);
    if (info.isSymbolicLink()) throw new Error(`Symbolic link blocked: ${file}`);
    if (info.isDirectory()) await walk(file);
    else {
      const relative = path.relative(site, file).split(path.sep).join('/');
      if (!expected.has(relative)) problems.push(`Unexpected public file: ${relative}`);
      contents.set(relative, /\.(html|css|js|svg)$/.test(name) ? await readFile(file, 'utf8') : null);
    }
  }
}
await walk(site);
for (const file of expected) if (!contents.has(file)) problems.push(`Missing file: ${file}`);

function checkUrl(file, value) {
  const urlValue = value.replace(/&amp;/g, '&');
  if (/^mailto:/i.test(urlValue)) {
    if (urlValue !== 'mailto:shlee@mustinfotech.co.kr') problems.push(`Unexpected contact: ${file}`);
    return;
  }
  if (/^(?:https?:|\/\/|data:)/i.test(urlValue)) return;
  if (/^[a-z][a-z0-9+.-]*:/i.test(urlValue) || urlValue.startsWith('/')) {
    problems.push(`Non-portable URL in ${file}: ${urlValue}`);
    return;
  }
  const resolved = new URL(urlValue || '', 'https://static.invalid/' + file);
  let target = decodeURIComponent(resolved.pathname.slice(1));
  if (target.endsWith('/')) target += 'index.html';
  checkedLinks++;
  if (!contents.has(target)) problems.push(`Broken link in ${file}: ${urlValue}`);
  if (resolved.hash && contents.get(target) != null) {
    const id = decodeURIComponent(resolved.hash.slice(1));
    const escaped = id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (!new RegExp(`\\bid=["']${escaped}["']`).test(contents.get(target))) problems.push(`Missing anchor in ${file}: ${urlValue}`);
  }
}
for (const [file, text] of contents) {
  if (text == null) continue;
  if (/127\.0\.0\.1|localhost|;jsessionid|<%@|<c:|070[- ]?7699|국회대로|영등포/.test(text)) problems.push(`Server-only or outdated content in ${file}`);
  if (/\.(html|svg)$/.test(file)) {
    for (const match of text.matchAll(/\b(?:href|src|poster)\s*=\s*(["'])(.*?)\1/gi)) checkUrl(file, match[2]);
  }
  if (/\.(css|svg)$/.test(file)) {
    for (const match of text.matchAll(/url\(\s*["']?([^)"']+)["']?\s*\)/gi)) checkUrl(file, match[1].trim());
  }
}
if (manifest.pages.length !== 19) problems.push('Expected 19 public pages.');
for (const page of manifest.pages) {
  const html = contents.get(page.file) || '';
  if (!html.includes('서울 성동구 왕십리로10길 6 서울숲비즈포레 805호') || !html.includes('mailto:shlee@mustinfotech.co.kr')) problems.push(`Company contact missing: ${page.file}`);
}
if (problems.length) throw new Error(problems.join('\n'));
console.log(JSON.stringify({ pages: manifest.pages.length, assets: manifest.assets.length, files: contents.size, checkedLinks, problems: 0 }));
