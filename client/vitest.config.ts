import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    watch: false,
    reporters: ['verbose'],
    pool: 'forks',
    setupFiles: ['src/setupTests.ts'],
  },
});
