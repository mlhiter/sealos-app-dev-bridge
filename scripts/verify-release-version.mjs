import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const rawTag = process.env.GITHUB_REF_NAME ?? process.argv[2] ?? '';
const tagVersion = rawTag.startsWith('v') ? rawTag.slice(1) : rawTag;

if (!tagVersion) {
  throw new Error('Missing release tag. Pass a tag such as v0.1.0 or set GITHUB_REF_NAME.');
}

const packageJson = JSON.parse(await readFile(resolve(root, 'package.json'), 'utf8'));
const manifest = JSON.parse(await readFile(resolve(root, 'extension/manifest.json'), 'utf8'));

const mismatches = [
  ['package.json', packageJson.version],
  ['extension/manifest.json', manifest.version]
].filter(([, version]) => version !== tagVersion);

if (mismatches.length > 0) {
  throw new Error(
    [
      `Release tag ${rawTag} does not match project version ${tagVersion}.`,
      ...mismatches.map(([file, version]) => `${file} has version ${version}.`)
    ].join('\n')
  );
}

console.log(`Release version verified: ${tagVersion}`);
