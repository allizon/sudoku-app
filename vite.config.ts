/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    projects: [
      {
        // src/core/ is plain TypeScript, so its tests run without a DOM.
        extends: true,
        test: {
          name: 'core',
          environment: 'node',
          include: ['src/core/**/*.test.{ts,tsx}'],
        },
      },
      {
        extends: true,
        test: {
          name: 'app',
          environment: 'jsdom',
          include: ['src/**/*.test.{ts,tsx}'],
          exclude: ['src/core/**'],
          setupFiles: ['./src/test-setup.ts'],
        },
      },
    ],
  },
});
