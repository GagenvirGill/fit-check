import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['server.ts'],
  format: ['esm'],
  outDir: 'dist/api',
  platform: 'node',
  target: 'node24',
  bundle: true,
  splitting: false,
  clean: true,
  sourcemap: true,
  tsconfig: './tsconfig.json',
  noExternal: [/^@fit-check\//],
});
