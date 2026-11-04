import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    core: 'src/core/index.ts',
  },
  format: 'esm',
  platform: 'browser',
  dts: true,
  sourcemap: true,
  banner: ({ fileName }) => (fileName === 'index.js' ? { js: "'use client'" } : undefined),
})
