import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [sveltekit()],
	test: {
		projects: [
			{
				extends: true,
				test: {
					name: 'unit',
					include: ['src/lib/engine/**/*.test.ts'],
					environment: 'node',
					globals: true
				}
			},
			{
				extends: true,
				resolve: {
					conditions: ['browser']
				},
				test: {
					name: 'client',
					include: ['src/**/*.component.test.ts'],
					environment: 'happy-dom',
					globals: true,
					setupFiles: ['src/test-setup.ts']
				}
			}
		]
	}
});
