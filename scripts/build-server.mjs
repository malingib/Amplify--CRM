import { build } from 'esbuild';
import { mkdir } from 'node:fs/promises';

await mkdir('server/dist', { recursive: true });
await build({
  entryPoints: ['server/src/index.ts'],
  outfile: 'server/dist/index.mjs',
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node22',
  packages: 'external',
  sourcemap: false,
});
