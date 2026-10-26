import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ASSET_BASE = 'https://tanabe0422.github.io/number-bluff/';
const rootDefault = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
function localFile(root, reference) {
  if (/^(?:[a-z]+:|\/\/)/i.test(reference)) throw new Error(`External runtime dependency prohibited: ${reference}`);
  const resolved = path.resolve(root, reference.split(/[?#]/)[0]);
  if (!resolved.startsWith(root + path.sep)) throw new Error(`Dependency escapes project: ${reference}`);
  return resolved;
}
function assetURL(value, relativeDir = '') {
  if (/^(?:https?:|data:|blob:|#)/i.test(value)) {
    if (/^https?:/i.test(value) && !value.startsWith(ASSET_BASE)) throw new Error(`Unowned asset URL: ${value}`);
    if (/^data:/i.test(value)) throw new Error('Embedded data assets are not supported by this package');
    return value;
  }
  if (value.startsWith('//')) throw new Error(`Unowned asset URL: ${value}`);
  return new URL(path.posix.normalize(path.posix.join(relativeDir, value.replace(/^\//, ''))), ASSET_BASE).href;
}
function rewriteCSS(css, relativeDir = '') {
  if (/@import\b/i.test(css)) throw new Error('CSS @import is unsupported; inline the stylesheet first');
  return css.replace(/url\(\s*(['"]?)([^)'"\s]+)\1\s*\)/gi, (_, quote, value) => `url("${assetURL(value, relativeDir)}")`);
}
function rewriteScript(js) {
  if (/\bimport\s*(?:\(|[{'"*])|\brequire\s*\(\s*['"](?!\.\/)/.test(js)) throw new Error('Unresolved module dependency');
  // App assets use string literals or template strings starting with assets/.
  return js.replace(/(['"`])(?:\.\/|\/)?assets\//g, `$1${ASSET_BASE}assets/`);
}
export function auditHTML(html) {
  for (const match of html.matchAll(/https?:\/\/[^\s'"`<>)}]+/gi)) {
    if (!match[0].startsWith(ASSET_BASE)) throw new Error(`Unowned runtime URL: ${match[0]}`);
  }
  if (/<script\b[^>]*\bsrc\s*=/i.test(html)) throw new Error('Unresolved external script');
  if (/<link\b[^>]*rel\s*=\s*['"]stylesheet/i.test(html)) throw new Error('Unresolved stylesheet');
  if (/(?:['"`(])(?:\.\/|\/)?assets\//.test(html)) throw new Error('Unresolved relative asset');
  for (const match of html.matchAll(/\b(?:src|poster)\s*=\s*(['"])(.*?)\1/gi)) {
    if (match[2] && !match[2].startsWith(ASSET_BASE)) throw new Error(`Non-owned source: ${match[2]}`);
  }
  for (const match of html.matchAll(/url\(\s*['"]?([^)'"\s]+)/gi)) {
    if (!match[1].startsWith(ASSET_BASE) && !match[1].startsWith('#')) throw new Error(`Unresolved CSS URL: ${match[1]}`);
  }
}
export function build(root = rootDefault) {
  root = path.resolve(root);
  let html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  html = html.replace(/<link\b[^>]*rel=['"]stylesheet['"][^>]*href=['"]([^'"]+)['"][^>]*>/gi, (_, reference) => {
    const filename = localFile(root, reference);
    const css = rewriteCSS(fs.readFileSync(filename, 'utf8'), path.relative(root, path.dirname(filename)).split(path.sep).join('/'));
    if (/<\/style/i.test(css)) throw new Error('Unsafe style closing token');
    return `<style>\n${css}\n</style>`;
  });
  html = html.replace(/<script\b([^>]*?)src=['"]([^'"]+)['"]([^>]*)>\s*<\/script>/gi, (_, before, reference, after) => {
    if (/\b(?:async|defer|type)\b/i.test(before + after)) throw new Error('Only ordered classic runtime scripts are supported');
    const js = rewriteScript(fs.readFileSync(localFile(root, reference), 'utf8'));
    return `<script>\n${js.replace(/<\/script/gi, '<\\/script')}\n</script>`;
  });
  html = html.replace(/\b(src|poster)=(["'])([^"']+)\2/gi, (_, attribute, quote, value) => `${attribute}=${quote}${assetURL(value)}${quote}`);
  html = rewriteCSS(html);
  auditHTML(html);
  return html;
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = process.argv[2] ? path.resolve(process.argv[2]) : rootDefault;
  const output = build(root);
  const destination = path.join(root, 'ai-studio.html');
  fs.writeFileSync(destination, output);
  console.log(`Built ${destination} (${Buffer.byteLength(output)} bytes); inline runtime and owned absolute assets audited.`);
}
