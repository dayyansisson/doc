import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
	webServer: {
		command: 'pnpm dev',
		url: 'http://localhost:5173',
		reuseExistingServer: !process.env.CI
	},
	testDir: 'tests/e2e',
	testMatch: '**/*.spec.ts',
	use: {
		baseURL: 'http://localhost:5173'
	},
	projects: [
		{
			name: 'chromium',
			use: { ...devices['Desktop Chrome'] }
		},
		{
			name: 'mobile',
			use: { ...devices['iPhone 14'] }
		}
	]
});
