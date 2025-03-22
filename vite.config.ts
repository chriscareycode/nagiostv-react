/// <reference types="vitest" />
import { defineConfig, transformWithEsbuild } from 'vite';
import react from '@vitejs/plugin-react';
import viteTsconfigPaths from 'vite-tsconfig-paths';
import svgr from 'vite-plugin-svgr';
import { VitePWA } from 'vite-plugin-pwa';
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
	base: './', // needed to work in subdirectories
	build: {
		outDir: 'build',
	},
	optimizeDeps: {
    force: true,
    esbuildOptions: {
      loader: {
        '.js': 'jsx',
      },
    },
  },
	plugins: [
		react({
			// Enable JSX in .js files
			include: /\.(jsx|js|tsx|ts)$/,
		}), 
		viteTsconfigPaths(),
		svgr({
			include: '**/*.svg?react',
		}),
		VitePWA({
			injectRegister: 'auto'
		}),
	],
	resolve: {
		// alias. These also need to be set up in tsconfig.json
		alias: {
			'~': path.resolve(__dirname, './src'),
			'atoms': path.resolve(__dirname, 'src/atoms'),
			'components': path.resolve(__dirname, 'src/components'),
			'helpers': path.resolve(__dirname, 'src/helpers'),
			'types': path.resolve(__dirname, 'src/types'),
			'widgets': path.resolve(__dirname, 'src/widgets'),
		},
	},
	server: {
		open: false, // BROWSER=false
		port: 3015, 
	},
	test: {
		globals: true,
		environment: 'jsdom',
		setupFiles: ['./src/setupTests.ts'],
		coverage: {
		  reporter: ['text', 'html'],
		  exclude: [
			'node_modules/',
			'src/setupTests.ts',
		  ],
		},
	},
});