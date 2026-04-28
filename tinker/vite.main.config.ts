import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    ssr: true,
    outDir: 'dist-electron',
    lib: {
      entry: 'electron/main.ts',
      formats: ['cjs'],
      fileName: () => 'main.js',
    },
    rollupOptions: {
      external: ['electron', 'better-sqlite3', 'path', 'fs/promises', 'fs'],
    },
  },
});
