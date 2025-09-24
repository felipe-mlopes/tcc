import { defineConfig } from 'vitest/config';
import tsConfigPaths from 'vitest-tsconfig-paths'
import swc from 'unplugin-swc'

export default defineConfig({
  plugins: [
      tsConfigPaths(),
      swc.vite({
          module: { type: 'es6' }
      })
  ],
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.spec.{ts,js}'],
    reporters: [
      'default',
      ['junit', { outputFile: 'reports/junit.xml' }], // 👈 JUnit nativo
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      reportsDirectory: 'coverage',
      include: ['src/**/*.{ts,js}'],
      exclude: ['**/tests/**', '**/*.d.ts', 'src/server.{ts,js}'],
    },
    // Configurações otimizadas para testes unitários
    testTimeout: 5000,
    hookTimeout: 5000,
    // Pool threads para melhor performance em testes unitários
    pool: 'threads',
    poolOptions: {
        threads: {
            singleThread: false,
            isolate: false,
        },
    },
  },
});