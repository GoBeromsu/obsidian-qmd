import { baseConfig } from './eslint.base.js'

export default [
	...baseConfig,
	// Obsidian runs in Electron — src/ui/ files that spawn child processes need process global.
	{
		files: ['src/ui/**/*.ts'],
		languageOptions: {
			globals: { process: 'readonly' },
		},
	},
]
