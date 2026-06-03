import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const packageJson = JSON.parse(await readFile(resolve(root, 'package.json'), 'utf8'));
const version = packageJson.version;
const releaseDir = resolve(root, 'release');
const packageName = 'sealos-app-dev-bridge';
const stagingDir = resolve(releaseDir, packageName);
const zipPath = resolve(releaseDir, `${packageName}-${version}.zip`);
const checksumPath = `${zipPath}.sha256`;

await import('./build.mjs');

await rm(releaseDir, { force: true, recursive: true });
await mkdir(releaseDir, { recursive: true });
await cp(resolve(root, 'extension/dist'), stagingDir, { recursive: true });

await run('zip', ['-r', '-X', zipPath, packageName], releaseDir);
await rm(stagingDir, { force: true, recursive: true });

const checksum = createHash('sha256').update(await readFile(zipPath)).digest('hex');
await writeFile(checksumPath, `${checksum}  ${packageName}-${version}.zip\n`);

console.log(`Packaged ${zipPath}`);
console.log(`Checksum ${checksumPath}`);

function run(command, args, cwd) {
  return new Promise((resolveRun, reject) => {
    const child = spawn(command, args, {
      cwd,
      stdio: 'inherit'
    });

    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) {
        resolveRun();
        return;
      }

      reject(new Error(`${command} exited with code ${code}`));
    });
  });
}
