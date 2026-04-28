import path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    globals: true,
    environment: "node",
    include: ["tests/unit/**/*.test.ts"],
    setupFiles: ["./tests/setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: ["src/data/**/*.ts", "src/utils/**/*.ts", "src/stores/**/*.ts"],
      exclude: ["src/db/**", "src/lib/electron.ts", "src/main.tsx"],
      thresholds: {
        lines: 80,
        functions: 80,
        statements: 80,
        branches: 70,
      },
    },
  },
});
