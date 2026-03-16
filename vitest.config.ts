import { resolve } from 'node:path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    alias: {
      obsidian: resolve(import.meta.dirname, 'test/mocks/obsidian.ts'),
    },
    reporters: ['default', 'junit'],
    outputFile: 'test-results.xml',
    passWithNoTests: true,
  },
})
