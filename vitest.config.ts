import { defineConfig } from 'vitest/config';

// Separate from vite.config.ts so tests don't load the PWA plugin
export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
  },
});
