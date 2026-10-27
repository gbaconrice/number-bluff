import { build } from 'esbuild';
import { readFile, writeFile, mkdir, cp } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { gzipSync } from 'node:zlib';

const dependencies = [
  ['number-flow', '0.6.2', 'LICENSE.md', 'https://github.com/barvian/number-flow'],
  ['canvas-confetti', '1.9.4', 'LICENSE', 'https://github.com/catdad/canvas-confetti'],
  ['esm-env', '1.2.2', 'LICENSE', 'https://github.com/benmccann/esm-env']
];
await mkdir('vendor', { recursive: true });
const licenseSections = [];
for (const [name, version, license, repository] of dependencies) {
  const text = await readFile(`node_modules/${name}/${license}`, 'utf8');
  licenseSections.push(`${name}@${version}\nSource: ${repository}\n\n${text}`);
  // Keep unmodified upstream files and notices for auditing/reproducible rebuilds.
  await cp(`node_modules/${name}`, `vendor/${name}`, { recursive: true });
}
const notices = licenseSections.join('\n\n' + '='.repeat(72) + '\n\n');
await writeFile('THIRD_PARTY_NOTICES.txt', notices);
const banner = `/*!\nNumber Bluff component scene motion: third-party license notices.\n${notices.replaceAll('*/', '* /')}\n*/`;
const shared = {
  entryPoints: ['component-scene-motion.source.js'], bundle: true,
  platform: 'browser', conditions: ['browser', 'production'],
  format: 'iife', target: ['es2020'], legalComments: 'inline',
  banner: { js: banner }, metafile: true, sourcemap: false
};
const raw = await build({ ...shared, outfile: 'component-scene-motion.raw.js', minify: false });
const min = await build({ ...shared, outfile: 'component-scene-motion.js', minify: true });
const files = {};
for (const path of ['component-scene-motion.js', 'component-scene-motion.raw.js', 'component-scene-motion.css']) {
  const bytes = await readFile(path);
  files[path] = { bytes: bytes.length, gzip9: gzipSync(bytes, { level: 9 }).length,
    sha256: createHash('sha256').update(bytes).digest('hex') };
}
for (const metadata of [raw.metafile, min.metafile]) {
  for (const output of Object.values(metadata.outputs)) {
    if (output.imports.length) throw new Error('Bundle has unresolved imports');
  }
}
const manifest = {
  generatedAt: new Date().toISOString(), dependencies: dependencies.map(([name,version,,repository]) => ({
    name, version, repository, tarball: `https://registry.npmjs.org/${name}/-/${name}-${version}.tgz`
  })),
  notes: ['No external runtime imports, network, Worker, or dynamic imports are invoked by the adapter.',
    'NumberFlow browser condition is bundled with esm-env; continuous plugin is not used.',
    'All three runtime licenses are included in both JS bundles in full.'],
  files, bundleInputs: Object.keys(min.metafile.inputs), unresolvedImports: []
};
await writeFile('BUILD_MANIFEST.json', JSON.stringify(manifest, null, 2) + '\n');
console.log(JSON.stringify(files, null, 2));
