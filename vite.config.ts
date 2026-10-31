import { defineConfig } from 'vitest/config';

export default defineConfig({
  base: process.env.NODE_ENV === 'production' ? '/nigouzhi-life/' : '/',
  build: { target: 'es2020', assetsInlineLimit: 0 },
  test: { include: ['tests/*.test.ts'], environment: 'node' },
});
