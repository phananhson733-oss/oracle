import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
    testTimeout: 10000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      // Ratchet floor just below the 2026-06-03 baseline; raise over time toward
      // CLAUDE.md targets (core algos/billing/auth 100%, normal 80%). See backlog #17.
      thresholds: {
        statements: 42,
        branches: 28,
        functions: 35,
        lines: 45,
      },
      exclude: [
        'src/**/*.test.ts',
        'src/**/__tests__/**',
        '**/*.config.ts',
        'src/data/comprehensive-generate.ts',
        'src/data/fast-generate.ts',
        'src/data/generate-enhanced-reports.ts',
        'src/data/populate-enhanced-data.ts',
      ],
    },
  },
});
