/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: './src/test/setup.ts',
        include: ['**/*.{test,spec}.{ts,tsx}'],
        exclude: [
            'node_modules/**',
            'dist/**', 
            'supabase/migrations/**',
            'tmp_rovodev_*'
        ],
        coverage: {
            enabled: true,
            provider: 'v8',
            reporter: ['text', 'html', 'json'],
            reportsDirectory: './coverage',
            thresholds: {
                statements: 70,
                branches: 70,
                functions: 70,
                lines: 70,
            },
            exclude: [
                'node_modules/**',
                'dist/**',
                'supabase/migrations/**',
                '**/*.d.ts',
                '**/*.config.*',
                'vite.config.ts',
                'tailwind.config.cjs',
                'postcss.config.cjs',
                'src/test/**',
                'tests/**',
                '**/*.test.*',
                '**/*.spec.*',
                'tmp_rovodev_*',
            ]
        },
        testTimeout: 10000,
        hookTimeout: 10000,
    },
});
