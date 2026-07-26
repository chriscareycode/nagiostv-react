import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import tseslint from 'typescript-eslint';

export default tseslint.config(
	{
		ignores: [
			'build/**',
			'coverage/**',
			'node_modules/**',
			'public/**',
		],
	},
	...tseslint.configs.recommended,
	{
		files: ['src/**/*.{ts,tsx}', 'vite.config.ts'],
		languageOptions: {
			parser: tseslint.parser,
			globals: {
				...globals.browser,
				...globals.node,
			},
		},
		plugins: {
			'react-hooks': reactHooks,
		},
		rules: {
			'react-hooks/rules-of-hooks': 'error',
			'react-hooks/exhaustive-deps': 'warn',
		},
	},
	{
		files: [
			'src/components/DashboardFetch.tsx',
			'src/components/alerts/AlertSection.tsx',
			'src/components/hosts/HostSection.tsx',
			'src/components/services/ServiceSection.tsx',
		],
		rules: {
			'react-hooks/exhaustive-deps': 'error',
		},
	},
);
