import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// Deliberately separate from vite.config.js: tests don't need the Tailwind
// plugin, and this keeps the production build config untouched by testing concerns.
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.js'],
    // Netlify's local dev tooling copies functions (and this test file with
    // them) into .netlify/ — exclude it or Vitest picks up broken duplicates.
    exclude: ['**/node_modules/**', '**/dist/**', '**/.netlify/**'],
  },
});
