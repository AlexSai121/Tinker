import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  timeout: 60000,
  reporter: "html",
  use: {
    baseURL: "http://127.0.0.1:4273",
    trace: "on-first-retry",
  },
  webServer: {
    command: "npx vite --config vite.web.config.ts --host 127.0.0.1 --port 4273",
    url: "http://127.0.0.1:4273",
    reuseExistingServer: true,
    timeout: 120000,
  },
  projects: [
    {
      name: "desktop-chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "tablet-safari",
      use: { ...devices["iPad (gen 7)"] },
    },
  ],
});
