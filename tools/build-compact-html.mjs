import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { minify } from 'html-minifier-terser';
import { build, auditHTML } from './build-single-html.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export async function buildCompact(projectRoot = root) {
  // Git checkouts may use CRLF on Windows; produce the same artifact everywhere.
  const html = build(projectRoot).replace(/\r\n/g, '\n');
  const output = await minify(html, {
    collapseWhitespace: false,
    removeComments: false,
    minifyCSS: { level: 1 },
    minifyJS: { compress: { passes: 2 }, mangle: true, format: { comments: /^!/ } }
  });
  auditHTML(output);
  return output;
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const output = await buildCompact();
  const destination = path.join(root, 'ai-studio.compact.html');
  fs.writeFileSync(destination, output);
  console.log(`Built ${destination}: ${Buffer.byteLength(output)} bytes, ${Array.from(output).length} characters.`);
}
