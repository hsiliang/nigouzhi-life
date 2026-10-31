import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'e2e', timeout: 120_000, fullyParallel: false, reporter: 'line',
  use: { baseURL: 'http://localhost:5199', trace: 'off' },
  webServer: { command: 'npx vite --port 5199 --strictPort', url: 'http://localhost:5199', reuseExistingServer: true },
  projects: [
    { name: 'phone', use: { ...devices['Desktop Chrome'], viewport: { width: 390, height: 844 }, hasTouch: true } },
    { name: 'narrow', use: { ...devices['Desktop Chrome'], viewport: { width: 320, height: 568 }, hasTouch: true } },
    { name: 'landscape', use: { ...devices['Desktop Chrome'], viewport: { width: 844, height: 390 }, hasTouch: true } },
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } } },
    { name: 'webkit', use: { ...devices['iPhone 14'] } },
  ],
});
