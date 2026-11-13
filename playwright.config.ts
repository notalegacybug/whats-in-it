import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  timeout: 90_000, // the OCR test loads a ~15 MB language model
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:4173',
    // The production build registers a service worker. Block it by default so tests hit the
    // network, not a cache; the offline test opts back in with test.use.
    serviceWorkers: 'block',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm run build && npm run preview -- --port 4173 --strictPort',
    url: 'http://localhost:4173',
    reuseExistingServer: false,
    timeout: 180_000,
  },
})
