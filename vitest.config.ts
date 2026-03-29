import { resolve } from 'node:path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    alias: {
      obsidian: resolve(import.meta.dirname, 'test/mocks/obsidian.ts'),
    },
    coverage: {
      provider: 'v8',
      reporter: ['lcov', 'html', 'json-summary'],
      include: ['src/**/*.ts'],
      exclude: ['src/shared/**', 'src/main.ts'],
      thresholds: {
        statements: 24,
        branches: 65,
        functions: 65,
      },
    },
    reporters: ['default', 'junit'],
    outputFile: 'test-results.xml',
  },
})
