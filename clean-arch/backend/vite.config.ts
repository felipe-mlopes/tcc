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
        // Incluir todos os tipos de teste por padrão
        include: ['src/**/*.{test,spec}.ts', 'test/**/*.{test,spec}.ts'],
        exclude: [
            'node_modules/',
            'dist/',
            'coverage/',
            '**/*.d.ts'
        ],
        reporters: [
            'default',
            ['vitest-sonar-reporter', { outputFile: 'sonar-report.xml' }],
        ],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'lcov', 'html'],
            reportsDirectory: 'coverage',
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
                'src/main.ts',
            ],
        },
    }
})