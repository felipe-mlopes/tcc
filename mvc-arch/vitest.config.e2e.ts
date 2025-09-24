import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') },
    extensions: ['.ts', '.js'],
  },
  test: {
    include: ['tests/e2e/**/*.e2e.spec.{ts,js}'],
    environment: 'node',
    globals: true,
    setupFiles: ['tests/e2e/setup.e2e.ts'],
    hookTimeout: 120_000,
    testTimeout: 120_000,
    reporters: [
      'default',
      ['junit', { outputFile: 'reports/junit-e2e.xml' }],
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      reportsDirectory: 'coverage/e2e',
      include: ['src/**/*.{ts,js}'],
      exclude: ['**/tests/**', '**/*.d.ts', 'src/server.{ts,js}'],
    },
  },
});