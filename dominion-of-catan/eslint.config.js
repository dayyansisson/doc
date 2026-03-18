import js from '@eslint/js';
import ts from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import svelte from 'eslint-plugin-svelte';
import globals from 'globals';

/** @type {import('eslint').Linter.Config[]} */
export default [
	js.configs.recommended,
	{
		files: ['src/**/*.ts'],
		plugins: { '@typescript-eslint': ts },
		languageOptions: {
			parser: tsParser,
			globals: { ...globals.browser, ...globals.node }
		},
		rules: {
			...ts.configs.recommended.rules,
			'@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }]
		}
	},
	{
		files: ['src/**/*.svelte'],
		plugins: { svelte },
		languageOptions: {
			parser: svelte.parser,
			parserOptions: { parser: tsParser }
		},
		rules: { ...svelte.configs.recommended.rules }
	},
	{
		ignores: ['node_modules', '.svelte-kit', 'build', 'dist']
	}
];
