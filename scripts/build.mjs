import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { build } from 'vite';

const root = resolve(import.meta.dirname, '..');
const outDir = resolve(root, 'extension/dist');

const entries = [
  { name: 'background', entry: 'extension/src/background/index.ts', format: 'es' },
  { name: 'content', entry: 'extension/src/content/index.ts', format: 'iife' },
  { name: 'capture', entry: 'extension/src/content/capture.ts', format: 'iife' },
  { name: 'injected', entry: 'extension/src/injected/index.ts', format: 'iife' },
  { name: 'popup', entry: 'extension/src/popup/main.ts', format: 'es' },
  { name: 'options', entry: 'extension/src/options/main.ts', format: 'es' }
];

await rm(outDir, { force: true, recursive: true });
await mkdir(outDir, { recursive: true });

await cp(resolve(root, 'extension/manifest.json'), resolve(outDir, 'manifest.json'));
await cp(resolve(root, 'extension/src/popup/index.html'), resolve(outDir, 'popup/index.html'), {
  recursive: true
});
await cp(resolve(root, 'extension/src/popup/styles.css'), resolve(outDir, 'popup/styles.css'), {
  recursive: true
});
await cp(resolve(root, 'extension/src/options/index.html'), resolve(outDir, 'options/index.html'), {
  recursive: true
});
await cp(resolve(root, 'extension/src/options/styles.css'), resolve(outDir, 'options/styles.css'), {
  recursive: true
});
await cp(resolve(root, 'extension/icons'), resolve(outDir, 'icons'), {
  recursive: true
});

for (const item of entries) {
  await build({
    configFile: false,
    publicDir: false,
    logLevel: 'warn',
    build: {
      emptyOutDir: false,
      minify: false,
      sourcemap: true,
      outDir,
      lib: {
        entry: resolve(root, item.entry),
        formats: [item.format],
        name: `SealosAppDevBridge_${item.name}`,
        fileName: () => `assets/${item.name}.js`
      },
      rollupOptions: {
        output: {
          inlineDynamicImports: true
        }
      }
    }
  });
}

const manifestPath = resolve(outDir, 'manifest.json');
const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
manifest.version_name = `${manifest.version} dev`;
await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
