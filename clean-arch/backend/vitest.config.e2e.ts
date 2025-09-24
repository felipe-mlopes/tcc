import swc from 'unplugin-swc'
import { defineConfig } from 'vitest/config'
import tsConfigPaths from 'vite-tsconfig-paths'
import { resolve } from 'path'

export default defineConfig({
  test: {
    include: ['**/*.e2e.spec.ts'],
    globals: true,
    
    // CRÍTICO: Executar testes E2E sequencialmente para evitar conflitos
    sequence: {
      concurrent: false, // Desabilita execução concorrente
    },
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: true, // Força execução em thread única
      },
    },
    
    // Timeouts aumentados para testes E2E
    testTimeout: 30000,
    hookTimeout: 60000,
    
    // Configurações específicas para E2E
    bail: 1, // Para na primeira falha para economizar recursos
    
    alias: {
      '@': resolve(__dirname, './src'),
      '@src': resolve(__dirname, './src'),
      '@test': resolve(__dirname, './test'),
    },
    
    root: './',
    setupFiles: ['./test/setup-e2e.ts'],
    
    // Configuração de reporters para Sonar
    reporters: [
      'default',
      ['vitest-sonar-reporter', { 
        outputFile: 'test-results/sonar-report-e2e.xml',
        silent: false
      }],
      ['junit', { 
        outputFile: 'test-results/junit-e2e.xml',
        classname: 'E2E Tests'
      }]
    ],
    
    // Coverage específico para E2E
    coverage: {
      enabled: true,
      provider: 'v8',
      reporter: ['text', 'lcov', 'html', 'cobertura'],
      reportsDirectory: 'coverage/e2e',
      include: ['src/**/*.ts'],
      exclude: [
        'node_modules/',
        'dist/',
        'coverage/',
        '**/*.d.ts',
        '**/*.interface.ts',
        '**/*.type.ts',
        '**/*.dto.ts',
        '**/*.entity.ts',
        '**/*.spec.ts',
        '**/*.test.ts',
        '**/*.e2e.spec.ts',
        'src/main.ts',
        'test/**',
      ],
      // Limites de cobertura para E2E
      thresholds: {
        global: {
          branches: 60,
          functions: 60,
          lines: 60,
          statements: 60
        }
      }
    },
    
    // Output customizado
    outputFile: {
      json: 'test-results/e2e-results.json'
    },
  },
  
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@src': resolve(__dirname, './src'),
      '@test': resolve(__dirname, './test'),
    },
  },
  
  plugins: [
    tsConfigPaths(),
    swc.vite({
      // Otimizações para performance
      jsc: {
        parser: {
          syntax: 'typescript',
          decorators: true,
          dynamicImport: true,
        },
        transform: {
          legacyDecorator: true,
          decoratorMetadata: true,
        },
        target: 'es2020',
      },
      module: {
        type: 'es6',
      },
    }),
  ],
})