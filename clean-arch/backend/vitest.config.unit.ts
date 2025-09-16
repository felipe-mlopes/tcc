import swc from 'unplugin-swc'
import { defineConfig } from 'vitest/config'
import tsConfigPaths from 'vitest-tsconfig-paths'

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
        // Incluir apenas testes unitários
        include: [
            'src/**/*.unit.spec.ts',
            'src/**/*.unit.test.ts',
            'test/unit/**/*.{test,spec}.ts'
        ],
        // Excluir explicitamente outros tipos de teste
        exclude: [
            'node_modules/',
            'dist/',
            'coverage/',
            '**/*.d.ts',
            '**/*.integration.spec.ts',
            '**/*.integration.test.ts',
            '**/*.e2e.spec.ts',
            '**/*.e2e.test.ts'
        ],
        reporters: [
            'default',
            ['vitest-sonar-reporter', { outputFile: 'sonar-report-unit.xml' }],
        ],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'lcov', 'html'],
            reportsDirectory: 'coverage/unit',
            exclude: [
                'node_modules/',
                'dist/',
                'coverage/',
                '**/*.d.ts',
                '**/*.interface.ts',
                '**/*.type.ts',
                '**/*.dto.ts',
                'src/main.ts',
                // Excluir camadas de infraestrutura dos testes unitários
                'src/infrastructure/**',
            ],
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
    }
})