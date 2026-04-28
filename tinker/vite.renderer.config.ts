import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import electron from 'vite-plugin-electron/simple';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    electron({
      main: {
        entry: 'electron/main.ts',
        vite: {
          build: {
            rollupOptions: {
              external: ['better-sqlite3'],
            },
          },
        },
      },
      preload: {
        input: path.join(__dirname, 'electron/preload.ts'),
      },
      renderer: {},
    }),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) {
            return;
          }

          if (id.includes("3d-force-graph") || id.includes("three")) {
            return "vendor-graph";
          }

          if (id.includes("react-konva") || id.includes("konva")) {
            return "vendor-canvas";
          }

          if (id.includes("framer-motion")) {
            return "vendor-motion";
          }

          if (id.includes("@tanstack/react-query")) {
            return "vendor-query";
          }

          if (
            id.includes("react-hook-form") ||
            id.includes("@hookform/resolvers") ||
            id.includes("zod")
          ) {
            return "vendor-forms";
          }

          if (id.includes("lucide-react")) {
            return "vendor-icons";
          }

          if (id.includes("react-window")) {
            return "vendor-lists";
          }

          if (id.includes("react-router")) {
            return "vendor-router";
          }

          if (id.includes("drizzle-orm") || id.includes("better-sqlite3")) {
            return "vendor-data";
          }

          return "vendor-react";
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
